import { Platform, requestUrl } from "obsidian";

/**
 * Google-OAuth für den Kalender-Sync. Bewusst **UI- und Plugin-agnostisch**:
 * Zugangsdaten und Token-Persistenz kommen über den Konstruktor herein (Callbacks),
 * damit dieses Modul nur „Tokens besorgen/erneuern/widerrufen" kann und sonst nichts.
 * Settings-UI und Sync-Engine sind dünne Konsumenten (Prinzip wie reminders.ts).
 *
 * Zwei Flows nach Plattform:
 *  - Desktop: Loopback-Server auf 127.0.0.1 + PKCE (kein Browser-Redirect-Hosting nötig).
 *  - Mobile:  Device-Code-Flow (Code am Zweitgerät eingeben).
 *
 * Kein Client-Secret im Plugin — der Nutzer legt einen eigenen OAuth-Client an
 * (Anleitung im Setup-Assistenten). „Desktop-App"-Clients liefern zwar ein Secret,
 * das ist bei installierten Apps aber nicht vertraulich (Google-Doku).
 *
 * Alle HTTP-Calls über requestUrl (nicht fetch → keine CORS/Origin-Probleme).
 */

const AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
const REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
const DEVICE_ENDPOINT = "https://oauth2.googleapis.com/device/code";
const DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";

/** calendar.events = Events schreiben; calendar.readonly = Kalenderliste/Anzeige. */
export const GCAL_SCOPE =
  "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly";

/** Access-Token 60 s vor Ablauf als „abgelaufen" behandeln (Uhr-Drift/Latenz-Puffer). */
const EXPIRY_SKEW_MS = 60_000;
/** Loopback-Login abbrechen, wenn der Nutzer nicht binnen dieser Zeit zustimmt. */
const LOOPBACK_TIMEOUT_MS = 180_000;

export interface GCalCredentials {
  clientId: string;
  clientSecret?: string;   // Desktop-Client; bei Device-Flow ebenfalls nötig
}

export interface GCalTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;       // Epoch-ms, wann accessToken abläuft
  scope?: string;
  account?: string;        // Anzeige-E-Mail (füllt die Sync-Engine via primary-Kalender)
}

/** Persistenz-Brücke: die Engine reicht Laden/Speichern der Tokens durch (data.json). */
export interface TokenStore {
  load(): GCalTokens | null;
  save(tokens: GCalTokens | null): Promise<void>;
}

/** Wird beim Device-Flow aufgerufen, damit die UI Code + URL anzeigen kann. */
export interface DevicePrompt {
  userCode: string;
  verificationUrl: string;
  expiresInSec: number;
}

export class GCalAuthError extends Error {}

// ── PKCE / Zufall (Web-Crypto, funktioniert auf Desktop UND Mobile) ──────────
function base64url(buf: ArrayBuffer): string {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function randomToken(bytes = 32): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)).buffer);
}

async function pkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifier = randomToken(32);   // 43 Zeichen, unreserved
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(digest) };
}

// ── HTTP-Helfer ──────────────────────────────────────────────────────────────
function form(params: Record<string, string>): string {
  return Object.entries(params)
    .map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v))
    .join("&");
}

async function postForm(url: string, params: Record<string, string>): Promise<Record<string, unknown>> {
  const res = await requestUrl({
    url,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: form(params),
    throw: false,
  });
  let json: Record<string, unknown> = {};
  try { json = res.json as Record<string, unknown>; } catch { /* nicht-JSON unten behandelt */ }
  if (res.status >= 400) {
    const err = (json.error_description as string) || (json.error as string) || `HTTP ${res.status}`;
    throw new GCalAuthError(String(err));
  }
  return json;
}

/** Token-Antwort von Google in unsere Struktur überführen (refreshToken ggf. vom Vorlauf). */
function toTokens(json: Record<string, unknown>, prevRefresh?: string): GCalTokens {
  const access = json.access_token as string | undefined;
  const refresh = (json.refresh_token as string | undefined) ?? prevRefresh;
  const expiresIn = (json.expires_in as number | undefined) ?? 3600;
  if (!access || !refresh) throw new GCalAuthError("Unvollständige Token-Antwort von Google.");
  return {
    accessToken: access,
    refreshToken: refresh,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: json.scope as string | undefined,
  };
}

// ── Auth-Kern ─────────────────────────────────────────────────────────────────
export class GCalAuth {
  constructor(
    private readonly getCredentials: () => GCalCredentials | null,
    private readonly store: TokenStore,
  ) {}

  isConnected(): boolean {
    const t = this.store.load();
    return !!t?.refreshToken;
  }

  account(): string | null {
    return this.store.load()?.account ?? null;
  }

  /** Gültiges Access-Token liefern; bei Bedarf transparent per Refresh-Token erneuern. */
  async getAccessToken(): Promise<string> {
    const t = this.store.load();
    if (!t?.refreshToken) throw new GCalAuthError("Nicht mit Google verbunden.");
    if (t.accessToken && Date.now() < t.expiresAt - EXPIRY_SKEW_MS) return t.accessToken;
    return this.refresh(t);
  }

  private async refresh(t: GCalTokens): Promise<string> {
    const creds = this.requireCredentials();
    const json = await postForm(TOKEN_ENDPOINT, {
      client_id: creds.clientId,
      ...(creds.clientSecret ? { client_secret: creds.clientSecret } : {}),
      refresh_token: t.refreshToken,
      grant_type: "refresh_token",
    });
    const next = toTokens(json, t.refreshToken);
    next.account = t.account;   // Anzeige-E-Mail über Refreshs hinweg behalten
    await this.store.save(next);
    return next.accessToken;
  }

  /** Plattform-passender Login. onDevicePrompt nur für den Mobile-Device-Flow relevant. */
  async connect(onDevicePrompt?: (p: DevicePrompt) => void): Promise<GCalTokens> {
    const tokens = Platform.isDesktopApp
      ? await this.connectLoopback()
      : await this.connectDevice(onDevicePrompt);
    await this.store.save(tokens);
    return tokens;
  }

  /** Verbindung trennen: Refresh-Token bei Google widerrufen + lokal löschen (best effort). */
  async disconnect(): Promise<void> {
    const t = this.store.load();
    if (t?.refreshToken) {
      try { await postForm(REVOKE_ENDPOINT, { token: t.refreshToken }); } catch { /* egal */ }
    }
    await this.store.save(null);
  }

  private requireCredentials(): GCalCredentials {
    const creds = this.getCredentials();
    if (!creds?.clientId) throw new GCalAuthError("Keine Google-Zugangsdaten hinterlegt.");
    return creds;
  }

  // ── Desktop: Loopback-Server + PKCE ──
  private async connectLoopback(): Promise<GCalTokens> {
    const creds = this.requireCredentials();
    const { verifier, challenge } = await pkcePair();
    const state = randomToken(16);

    // Node-http nur auf dem Desktop (Electron); als externes Builtin nicht gebündelt.
    // eslint-disable-next-line import/no-nodejs-modules, @typescript-eslint/no-require-imports, no-undef
    const http = require("http") as typeof import("http");

    const { code, redirectUri } = await new Promise<{ code: string; redirectUri: string }>(
      (resolve, reject) => {
        const server = http.createServer((req, res) => {
          try {
            const url = new URL(req.url ?? "/", "http://127.0.0.1");
            if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
              res.writeHead(204).end();   // Favicon o. Ä. ignorieren
              return;
            }
            const ok = url.searchParams.get("state") === state && url.searchParams.has("code");
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(loopbackPage(ok));
            server.close();
            window.clearTimeout(timer);
            if (url.searchParams.get("error")) return reject(new GCalAuthError(url.searchParams.get("error")!));
            if (!ok) return reject(new GCalAuthError("Ungültige Antwort (state stimmt nicht)."));
            resolve({ code: url.searchParams.get("code")!, redirectUri: base });
          } catch (e) {
            reject(e instanceof Error ? e : new GCalAuthError(String(e)));
          }
        });
        let base = "";
        const timer = window.setTimeout(() => {
          server.close();
          reject(new GCalAuthError("Zeitüberschreitung bei der Google-Anmeldung."));
        }, LOOPBACK_TIMEOUT_MS);
        server.on("error", (e: Error) => { window.clearTimeout(timer); reject(e); });
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          const port = typeof addr === "object" && addr ? addr.port : 0;
          base = `http://127.0.0.1:${port}`;
          const authUrl = AUTH_ENDPOINT + "?" + form({
            client_id: creds.clientId,
            redirect_uri: base,
            response_type: "code",
            scope: GCAL_SCOPE,
            code_challenge: challenge,
            code_challenge_method: "S256",
            state,
            access_type: "offline",
            prompt: "consent",   // erzwingt refresh_token auch bei erneutem Login
          });
          window.open(authUrl);
        });
      },
    );

    const json = await postForm(TOKEN_ENDPOINT, {
      client_id: creds.clientId,
      ...(creds.clientSecret ? { client_secret: creds.clientSecret } : {}),
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    });
    return toTokens(json);
  }

  // ── Mobile: Device-Code-Flow ──
  private async connectDevice(onPrompt?: (p: DevicePrompt) => void): Promise<GCalTokens> {
    const creds = this.requireCredentials();
    const dev = await postForm(DEVICE_ENDPOINT, { client_id: creds.clientId, scope: GCAL_SCOPE });

    const deviceCode = dev.device_code as string;
    const intervalMs = ((dev.interval as number | undefined) ?? 5) * 1000;
    const expiresAt = Date.now() + ((dev.expires_in as number | undefined) ?? 1800) * 1000;
    onPrompt?.({
      userCode: dev.user_code as string,
      verificationUrl: (dev.verification_url as string) ?? (dev.verification_uri as string),
      expiresInSec: (dev.expires_in as number | undefined) ?? 1800,
    });

    // Auf Zustimmung am Zweitgerät warten (authorization_pending → weiter pollen).
    let wait = intervalMs;
    for (;;) {
      if (Date.now() > expiresAt) throw new GCalAuthError("Der Anmeldecode ist abgelaufen.");
      await sleep(wait);
      const res = await requestUrl({
        url: TOKEN_ENDPOINT,
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        body: form({
          client_id: creds.clientId,
          ...(creds.clientSecret ? { client_secret: creds.clientSecret } : {}),
          device_code: deviceCode,
          grant_type: DEVICE_GRANT,
        }),
        throw: false,
      });
      const json = (res.json ?? {}) as Record<string, unknown>;
      if (res.status < 400) return toTokens(json);
      const err = json.error as string | undefined;
      if (err === "authorization_pending") continue;
      if (err === "slow_down") { wait += 5000; continue; }
      throw new GCalAuthError((json.error_description as string) || err || `HTTP ${res.status}`);
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => window.setTimeout(r, ms));
}

/** Schlichte Abschluss-Seite im Browser nach dem Loopback-Redirect. */
function loopbackPage(ok: boolean): string {
  const msg = ok
    ? "✅ BeautyTasks ist jetzt mit Google Kalender verbunden."
    : "⚠️ Anmeldung fehlgeschlagen. Bitte in Obsidian erneut versuchen.";
  return `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>BeautyTasks</title><style>
body{font-family:system-ui,sans-serif;background:#1e1e1e;color:#eee;display:flex;
min-height:100vh;align-items:center;justify-content:center;margin:0}
div{max-width:28rem;text-align:center;line-height:1.5;padding:2rem}
</style></head><body><div><p>${msg}</p><p>Du kannst dieses Fenster schließen.</p></div></body></html>`;
}
