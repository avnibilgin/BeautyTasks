import { App, TFile, requestUrl } from "obsidian";
import { Task } from "./types";
import { isTrashed, isDone } from "./statuses";
import { resolveReminders } from "./reminders";
import { GCalAuth, GCalAuthError } from "./gcalAuth";

/**
 * Google-Kalender-Sync, **Stufe A: Push-only** (Obsidian → Google). Bewusst
 * UI-agnostisch: die Engine kennt weder Settings-Tab noch Statusleiste, sondern
 * *emittiert* ihren Zustand (`onStatus`). Settings-UI und Statusleiste sind dünne
 * Abonnenten — dasselbe Prinzip wie reminders.ts.
 *
 * Identität liegt in der NOTIZ (`gcal_event_id`/`gcal_calendar_id` im Frontmatter),
 * plus `btTaskId` unsichtbar im Event (für den späteren Pull, Stufe B). Der
 * operative Abgleich läuft über `lastSynced` in den Settings (Signatur-Diff →
 * keine redundanten API-Schreibzugriffe).
 *
 * Alle HTTP-Calls über requestUrl (kein fetch → keine CORS/Origin-Probleme).
 */

const API = "https://www.googleapis.com/calendar/v3";
const SYNC_SOURCE = "beautytasks";
const DEBOUNCE_MS = 2000;
const DEFAULT_CALENDAR_NAME = "BeautyTasks";

// ── Persistierte Sync-Einstellungen (Unter-Objekt von BeautyTasksSettings) ────
export interface GCalLink { eventId: string; calendarId: string; sig: string; }

export interface GCalSyncSettings {
  enabled: boolean;
  clientId: string;
  clientSecret: string;
  calendarId: string;              // Ziel-Kalender ("" bis gewählt)
  timezone: string;                // IANA, z. B. "Europe/Berlin"
  defaultDurationMin: number;      // Länge, wenn eine Aufgabe eine Uhrzeit, aber keine Dauer hat
  autoSync: boolean;               // bei Vault-Änderungen automatisch pushen
  syncOnCreate: boolean;           // neue datierte Aufgaben als Event anlegen
  syncOnUpdate: boolean;           // Änderungen (Datum/Titel/…) an bestehende Events übertragen
  syncOnDelete: boolean;           // Event entfernen, wenn Aufgabe gelöscht/undatiert wird
  removeEventOnComplete: boolean;  // erledigte Aufgaben: Event löschen statt behalten
  notifyConflicts: boolean;        // (Stufe B) bei Konflikten benachrichtigen
  showStatusBar: boolean;
  account: string | null;          // Anzeige-E-Mail
  tokens: import("./gcalAuth").GCalTokens | null;   // Auth-Token (data.json)
  lastSynced: Record<string, GCalLink>;             // taskId -> gepushter Stand
}

export const DEFAULT_GCAL_SETTINGS: GCalSyncSettings = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  calendarId: "",
  timezone: "Europe/Berlin",
  defaultDurationMin: 60,
  autoSync: true,
  syncOnCreate: true,
  syncOnUpdate: true,
  syncOnDelete: true,
  removeEventOnComplete: false,
  notifyConflicts: false,
  showStatusBar: true,
  account: null,
  tokens: null,
  lastSynced: {},
};

// ── Status-Emitter ────────────────────────────────────────────────────────────
export type GCalStatus = "disconnected" | "idle" | "syncing" | "error";
export interface GCalStatusInfo {
  status: GCalStatus;
  lastSyncedAt: number | null;
  lastError: string | null;
  account: string | null;
}

/** Was die Engine vom Plugin braucht (klein gehalten → testbar/entkoppelt). */
export interface GCalSyncHost {
  app: App;
  settings: GCalSyncSettings;               // lebendes Objekt; Engine mutiert tokens/lastSynced
  persist(): Promise<void>;                 // Settings speichern (data.json)
  allTasks(): Task[];
  subscribe(cb: () => void): () => void;    // TaskIndex-Änderungen
}

// ── Kalender-API (authentifiziert, mit Backoff) ───────────────────────────────
async function api(
  auth: GCalAuth, method: string, path: string, body?: unknown,
): Promise<Record<string, unknown> | null> {
  const token = await auth.getAccessToken();
  for (let attempt = 0; ; attempt++) {
    const res = await requestUrl({
      url: API + path,
      method,
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : undefined,
      throw: false,
    });
    if (res.status === 204 || !res.text) return null;      // z. B. DELETE
    if (res.status < 400) { try { return res.json as Record<string, unknown>; } catch { return null; } }
    if (res.status === 401) throw new GCalAuthError("Google-Verbindung abgelaufen – bitte neu verbinden.");
    // 403/429 (Quota/Rate) und 5xx: mit exponentiellem Backoff wiederholen
    if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 5) {
      await sleep(Math.min(30000, 2 ** attempt * 1000) + Math.random() * 500);
      continue;
    }
    let msg = `HTTP ${res.status}`;
    try { msg = ((res.json as Record<string, unknown>).error as { message?: string })?.message ?? msg; } catch { /* text unten */ }
    throw new Error("Google Kalender: " + msg);
  }
}

// ── Kalender-Helfer ───────────────────────────────────────────────────────────
export interface CalendarInfo { id: string; summary: string; primary: boolean; }

export async function listCalendars(auth: GCalAuth): Promise<CalendarInfo[]> {
  const out: CalendarInfo[] = [];
  let pageToken: string | undefined;
  do {
    const q = pageToken ? "?pageToken=" + encodeURIComponent(pageToken) : "";
    const resp = await api(auth, "GET", "/users/me/calendarList" + q);
    for (const c of (resp?.items as Record<string, unknown>[] | undefined) ?? []) {
      out.push({ id: c.id as string, summary: (c.summary as string) ?? (c.id as string), primary: !!c.primary });
    }
    pageToken = resp?.nextPageToken as string | undefined;
  } while (pageToken);
  return out;
}

/** Anzeige-E-Mail = Id des primären Kalenders (ohne zusätzlichen profile-Scope). */
export async function fetchAccountEmail(auth: GCalAuth): Promise<string | null> {
  const cal = await api(auth, "GET", "/calendars/primary");
  return (cal?.id as string) ?? null;
}

/** Eigenen „BeautyTasks"-Kalender finden oder anlegen (kleiner Blast-Radius). */
export async function ensureDefaultCalendar(auth: GCalAuth, timezone: string): Promise<string> {
  const existing = (await listCalendars(auth)).find((c) => c.summary === DEFAULT_CALENDAR_NAME);
  if (existing) return existing.id;
  const created = await api(auth, "POST", "/calendars", { summary: DEFAULT_CALENDAR_NAME, timeZone: timezone });
  return created?.id as string;
}

// ── Task → Event-Mapping ──────────────────────────────────────────────────────
const isoDate = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const isoDateTime = (d: Date): string =>
  `${isoDate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

function reminderOverrides(task: Task, start: Date): { method: "popup"; minutes: number }[] {
  const mins = resolveReminders(task)
    .map((r) => Math.round((start.getTime() - r.fireAt.getTime()) / 60000))
    .filter((m) => m >= 0 && m <= 40320);   // bis 4 Wochen vorher
  return [...new Set(mins)].slice(0, 5).map((minutes) => ({ method: "popup" as const, minutes }));
}

function eventBody(task: Task, s: GCalSyncSettings): Record<string, unknown> {
  const timed = !!task.dueTime;
  const startDate = new Date(task.due + "T" + (task.dueTime ?? "00:00"));
  let start: Record<string, string>, end: Record<string, string>;
  if (timed) {
    const endDate = new Date(startDate.getTime() + (task.duration ?? s.defaultDurationMin) * 60000);
    start = { dateTime: isoDateTime(startDate), timeZone: s.timezone };
    end = { dateTime: isoDateTime(endDate), timeZone: s.timezone };
  } else {
    const next = new Date(startDate.getTime()); next.setDate(next.getDate() + 1);
    start = { date: task.due! };
    end = { date: isoDate(next) };
  }
  const overrides = reminderOverrides(task, startDate);
  return {
    summary: task.title,
    start,
    end,
    reminders: overrides.length ? { useDefault: false, overrides } : { useDefault: true },
    extendedProperties: { private: { syncSource: SYNC_SOURCE, btTaskId: task.id } },
  };
}

/** Signatur der gepushten Felder – ändert sie sich, wird das Event gepatcht. */
function signature(task: Task, calendarId: string): string {
  return JSON.stringify([
    task.title, task.due, task.dueTime, task.duration,
    (task.reminders ?? []).join(","), calendarId,
  ]);
}

// ── Engine ────────────────────────────────────────────────────────────────────
export class GCalSync {
  private statusCbs = new Set<(i: GCalStatusInfo) => void>();
  private info: GCalStatusInfo = { status: "disconnected", lastSyncedAt: null, lastError: null, account: null };
  private unsub: (() => void) | null = null;
  private debounceTimer: number | null = null;
  private running = false;
  private rerun = false;

  constructor(private host: GCalSyncHost, private auth: GCalAuth) {
    this.info.account = host.settings.account;
    this.info.status = auth.isConnected() ? "idle" : "disconnected";
  }

  // ── Öffentliche API ──
  onStatus(cb: (i: GCalStatusInfo) => void): () => void {
    this.statusCbs.add(cb); cb(this.info);
    return () => this.statusCbs.delete(cb);
  }
  getStatus(): GCalStatusInfo { return this.info; }

  /** Auto-Sync verdrahten (bei Vault-Änderungen entprellt pushen). Idempotent. */
  start(): void {
    if (this.unsub) return;
    this.unsub = this.host.subscribe(() => this.scheduleSync());
  }
  stop(): void {
    this.unsub?.(); this.unsub = null;
    if (this.debounceTimer) { window.clearTimeout(this.debounceTimer); this.debounceTimer = null; }
  }

  private scheduleSync(): void {
    if (!this.canSync() || !this.host.settings.autoSync) return;
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => { this.debounceTimer = null; void this.syncNow(); }, DEBOUNCE_MS);
  }

  private canSync(): boolean {
    const s = this.host.settings;
    return s.enabled && !!s.calendarId && this.auth.isConnected();
  }

  /** Ein Push-Durchlauf (manuell oder entprellt). Re-entrancy-sicher. */
  async syncNow(): Promise<void> {
    if (!this.canSync()) return;
    if (this.running) { this.rerun = true; return; }
    this.running = true;
    this.emit({ status: "syncing", lastError: null });
    try {
      await this.pushAll();
      this.emit({ status: "idle", lastSyncedAt: Date.now(), lastError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ status: "error", lastError: msg });
    } finally {
      this.running = false;
      if (this.rerun) { this.rerun = false; void this.syncNow(); }
    }
  }

  // ── Push-Reconcile ──
  private async pushAll(): Promise<void> {
    const s = this.host.settings;
    const cal = s.calendarId;
    const tasks = this.host.allTasks();
    const eligible = new Map<string, Task>();
    for (const t of tasks) if (this.isEligible(t)) eligible.set(t.id, t);

    let changed = false;

    // 1) Anlegen / Aktualisieren
    for (const [id, task] of eligible) {
      const link = s.lastSynced[id];
      const eventId = link?.eventId ?? this.frontmatterEventId(task);
      const sig = signature(task, cal);
      if (!eventId) {
        if (!s.syncOnCreate) continue;
        const ev = await api(this.auth, "POST", `/calendars/${enc(cal)}/events`, eventBody(task, s));
        const newId = ev?.id as string;
        if (newId) { s.lastSynced[id] = { eventId: newId, calendarId: cal, sig }; await this.writeBack(task, newId, cal); changed = true; }
      } else if (!link || link.sig !== sig || link.calendarId !== cal) {
        if (!s.syncOnUpdate) continue;
        if (link && link.calendarId !== cal) {
          // Kalenderwechsel: Google kann Events verschieben (move)
          await api(this.auth, "POST", `/calendars/${enc(link.calendarId)}/events/${enc(eventId)}/move?destination=${enc(cal)}`);
        }
        await api(this.auth, "PATCH", `/calendars/${enc(cal)}/events/${enc(eventId)}`, eventBody(task, s));
        s.lastSynced[id] = { eventId, calendarId: cal, sig };
        await this.writeBack(task, eventId, cal); changed = true;
      }
    }

    // 2) Löschen: früher gesynct, jetzt nicht mehr berechtigt/vorhanden
    for (const id of Object.keys(s.lastSynced)) {
      if (eligible.has(id)) continue;
      if (!s.syncOnDelete) continue;
      const link = s.lastSynced[id];
      try { await api(this.auth, "DELETE", `/calendars/${enc(link.calendarId)}/events/${enc(link.eventId)}`); }
      catch (e) { if (!(e instanceof Error && /404|410/.test(e.message))) throw e; }   // schon weg = ok
      delete s.lastSynced[id];
      const t = this.host.allTasks().find((x) => x.id === id);
      if (t) await this.clearBack(t);
      changed = true;
    }

    if (changed) await this.host.persist();
  }

  private isEligible(t: Task): boolean {
    if (!t.due) return false;
    if (isTrashed(t.status)) return false;
    if (this.host.settings.removeEventOnComplete && isDoneStatus(t)) return false;
    if (this.projectExcluded(t)) return false;
    return true;
  }

  private frontmatterOf(path: string): Record<string, unknown> | null {
    const f = this.host.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return null;
    return this.host.app.metadataCache.getFileCache(f)?.frontmatter ?? null;
  }

  private projectExcluded(t: Task): boolean {
    return t.project ? this.frontmatterOf(t.project)?.gcal_sync === false : false;
  }

  private frontmatterEventId(t: Task): string | undefined {
    const id = this.frontmatterOf(t.path)?.gcal_event_id;
    return typeof id === "string" && id ? id : undefined;
  }

  private async writeBack(t: Task, eventId: string, calendarId: string): Promise<void> {
    const f = this.host.app.vault.getAbstractFileByPath(t.path);
    if (!(f instanceof TFile)) return;
    await this.host.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      fm.gcal_event_id = eventId; fm.gcal_calendar_id = calendarId;
    });
  }
  private async clearBack(t: Task): Promise<void> {
    const f = this.host.app.vault.getAbstractFileByPath(t.path);
    if (!(f instanceof TFile)) return;
    await this.host.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      delete fm.gcal_event_id; delete fm.gcal_calendar_id;
    });
  }

  // ── intern ──
  private emit(patch: Partial<GCalStatusInfo>): void {
    this.info = { ...this.info, ...patch, account: this.host.settings.account };
    for (const cb of this.statusCbs) cb(this.info);
  }
}

// Kleine Helfer außerhalb der Klasse (rein, testbar)
function enc(s: string): string { return encodeURIComponent(s); }
function sleep(ms: number): Promise<void> { return new Promise((r) => window.setTimeout(r, ms)); }
function isDoneStatus(t: Task): boolean { return isDone(t.status); }
