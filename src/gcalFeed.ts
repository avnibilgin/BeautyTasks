import { CalEvent } from "./types";
import { GCalAuth } from "./gcalAuth";
import { gcalRequest, GCalHttpError, listCalendars, CalendarInfo } from "./gcalSync";
import { iso, addDays } from "./calendarModel";
import { t } from "./i18n";

/**
 * Google-Termine ANZEIGEN (read-only). Bewusst getrennt von `gcalSync.ts`:
 *
 *   gcalSync = Abgleich-Schicht  – Wahrheit über den Aufgaben-Zustand, schreibt in beide Richtungen.
 *   gcalFeed = Anzeige-Schicht   – Wahrheit über gar nichts, zeigt nur, was Google sagt.
 *
 * **Ein Termin wird nie eine Aufgabe.** Kein `type: task`, keine Notiz, kein Frontmatter, nichts im
 * TaskIndex. Würde ein Termin als Notiz landen, wäre er für `isEligible()` eine ganz normale
 * datierte Aufgabe → `pushAll()` legte ein zweites Event dafür an → der nächste Pull sähe es →
 * Schleife, die den echten Kalender vollschreibt. Termine leben deshalb nur hier im Speicher
 * (+ Snapshot in data.json für den Kaltstart). Siehe `docs/gcal-feed-plan.md`.
 *
 * Geholt wird über **Zeitfenster, nicht über syncToken**: `events.list` erlaubt keinen syncToken
 * zusammen mit timeMin/timeMax; der Feed müsste sonst den ganzen Kalender spiegeln (inkl. 2019).
 * Fenster-Einheit ist EIN Monat (± 7 Tage Rand), damit Blättern im Monat den Cache trifft.
 * `singleEvents=true` lässt Google die Wiederholungen auflösen – kein RRULE-Expandieren hier.
 * Wiederholte Läufe kosten dank ETag/`If-None-Match` fast nichts (Google antwortet 304).
 *
 * Verbindung wird mit dem Sync geteilt (`GCalAuth`, Scope enthält bereits `calendar.readonly`),
 * die Schalter sind getrennt: `gcal.enabled` = Aufgaben schreiben, `gcalFeed.enabled` = Termine
 * zeigen. „Nur anzeigen, nichts schreiben" ist ein vollwertiger Zustand.
 */

const POLL_MS = 5 * 60 * 1000;    // ruhiger Refresh – nur wenn eine BeautyTasks-Ansicht sichtbar ist
const PAD_DAYS = 7;               // Rand je Monatsfenster (Termine über die Monatsgrenze)
// ► MAX_MONTHS und MAX_STORE hängen am Vorschau-Regler (`upcomingMonths`, 1–12 Monate) und
//   dürfen NICHT einzeln zurückgesetzt werden – beide Deckel würden den Regler still aushebeln:
//   ein zu kleines MAX_MONTHS lädt die fernen Monate gar nicht erst, ein zu kleines MAX_STORE
//   lässt prune() genau die fernsten Termine wieder wegwerfen (also die, die der Regler zeigen soll).
const MAX_MONTHS = 13;            // Deckel je Anfrage; 12 Monate Horizont überspannen 13 Monatsfenster
const MAX_STORE = 12000;          // Notbremse gegen fette Kalender (Speicher); deckt 12 Monate × mehrere Kalender
const SNAPSHOT_MAX = 500;         // Deckel für data.json

// ── Persistierte Einstellungen (Unter-Objekt von BeautyTasksSettings) ─────────
export interface GCalFeedSettings {
  enabled: boolean;                      // Termine anzeigen
  calendars: Record<string, boolean>;    // calendarId -> sichtbar
  hideDeclined: boolean;                 // abgelehnte Einladungen ausblenden
  upcomingMonths: number;                // Vorschau in „Demnächst": 1–12 Monate (siehe MAX_MONTHS/MAX_STORE)
  snapshot: CalEvent[];                  // letzter Stand für Kaltstart/Offline (gedeckelt)
}

export const DEFAULT_GCAL_FEED_SETTINGS: GCalFeedSettings = {
  enabled: false,
  calendars: {},
  hideDeclined: true,
  upcomingMonths: 1,
  snapshot: [],
};

/** Was die Engine vom Plugin braucht (klein gehalten → testbar/entkoppelt). */
export interface GCalFeedHost {
  settings: GCalFeedSettings;
  /** Der eigene Sync-Kalender. **Hart ausgeschlossen**: sonst stünde jede datierte Aufgabe doppelt
   *  da – einmal als Aufgabe, einmal als ihr eigenes gepushtes Event. */
  syncCalendarId(): string;
  persist(): Promise<void>;
  /** Ist gerade eine BeautyTasks-Ansicht sichtbar? Ein Timer für eine Ansicht, die niemand ansieht,
   *  ist verschwendete Quota und Akku. */
  isVisible(): boolean;
}

export interface GCalFeedStatus {
  loading: boolean;
  error: string | null;
  lastLoadedAt: number | null;
}

const evKey = (ev: CalEvent): string => ev.calendarId + "|" + ev.id;
const enc = (s: string): string => encodeURIComponent(s);
const monthOf = (day: string): string => day.slice(0, 7);

/** Monate zwischen zwei Tagen ("YYYY-MM"), gedeckelt – siehe MAX_MONTHS. */
export function monthsBetween(from: string, to: string): string[] {
  const out: string[] = [];
  let [y, m] = from.split("-").map(Number);
  const last = monthOf(to);
  for (let i = 0; i < MAX_MONTHS; i++) {
    const key = `${y}-${String(m).padStart(2, "0")}`;
    out.push(key);
    if (key >= last) break;
    if (++m > 12) { m = 1; y++; }
  }
  return out;
}

/** Abrufsfenster eines Monats: erster Tag − 7 Tage bis erster Folgetag + 7 Tage (Ende exklusiv). */
function monthWindow(month: string): { fromDay: string; toDay: string; timeMin: string; timeMax: string } {
  const [y, m] = month.split("-").map(Number);
  const start = new Date(y, m - 1, 1);
  start.setDate(start.getDate() - PAD_DAYS);
  const end = new Date(y, m, 1);
  end.setDate(end.getDate() + PAD_DAYS);
  const lastDay = new Date(end.getTime());
  lastDay.setDate(lastDay.getDate() - 1);
  return { fromDay: iso(start), toDay: iso(lastDay), timeMin: start.toISOString(), timeMax: end.toISOString() };
}

/** RFC3339 („2026-07-17T09:00:00+02:00") → lokales "YYYY-MM-DDTHH:mm". */
function localStamp(rfc: string): string | null {
  const d = new Date(rfc);
  if (isNaN(d.getTime())) return null;
  const z = (n: number): string => String(n).padStart(2, "0");
  return `${iso(d)}T${z(d.getHours())}:${z(d.getMinutes())}`;
}

/** Eingeladen und abgesagt? Dann ist der Termin für den Nutzer kein Termin mehr. */
function isDeclined(raw: Record<string, unknown>): boolean {
  const attendees = raw.attendees as { self?: boolean; responseStatus?: string }[] | undefined;
  return !!attendees?.some((a) => a.self && a.responseStatus === "declined");
}

export class GCalFeed {
  private store = new Map<string, CalEvent>();        // evKey -> Termin
  private fetched = new Map<string, string | null>(); // `${calId}|${YYYY-MM}` -> ETag
  private wanted = new Set<string>();                 // Monate, die die Views gerade brauchen
  private cals: CalendarInfo[] | null = null;         // calendarList (Farben/Namen), einmal geholt
  private cbs = new Set<() => void>();
  private pollTimer: number | null = null;
  private running = false;
  private rerun: "ensure" | "refresh" | null = null;
  private status: GCalFeedStatus = { loading: false, error: null, lastLoadedAt: null };

  constructor(private host: GCalFeedHost, private auth: GCalAuth) {
    // Kaltstart: der Snapshot füllt die Ansicht SOFORT (kein leeres Blitzen, offline sichtbar).
    for (const ev of host.settings.snapshot ?? []) this.store.set(evKey(ev), ev);
  }

  // ── Öffentliche API ──
  onChange(cb: () => void): () => void {
    this.cbs.add(cb);
    return () => this.cbs.delete(cb);
  }
  getStatus(): GCalFeedStatus { return this.status; }

  /** Zeigt der Feed überhaupt etwas? (an UND verbunden UND mindestens ein Kalender gewählt) */
  isActive(): boolean {
    return this.host.settings.enabled && this.auth.isConnected() && this.selectedCalendars().length > 0;
  }

  /** Sichtbare Kalender – ohne den eigenen Sync-Kalender (der zeigte nur die eigenen Aufgaben doppelt). */
  selectedCalendars(): string[] {
    const own = this.host.syncCalendarId();
    return Object.entries(this.host.settings.calendars)
      .filter(([id, on]) => on && id !== own)
      .map(([id]) => id);
  }

  start(): void {
    if (this.pollTimer) return;
    this.pollTimer = window.setInterval(() => {
      if (this.host.isVisible()) void this.run("refresh");
    }, POLL_MS);
  }
  stop(): void {
    if (this.pollTimer) { window.clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  /** Eine View sagt, welchen Zeitraum sie zeigt. Fehlende Monate werden im Hintergrund geholt;
   *  gezeichnet wird sofort mit dem, was da ist (Cache/Snapshot). */
  setRange(from: string, to: string): void {
    let fresh = false;
    for (const m of monthsBetween(from, to)) if (!this.wanted.has(m)) { this.wanted.add(m); fresh = true; }
    if (fresh) void this.run("ensure");
  }

  /** Termine im Zeitraum (grob, tagegenau) – das genaue Zuschneiden macht `bucketEvents`. */
  eventsIn(from: string, to: string): CalEvent[] {
    const fromDay = from.slice(0, 10), toDay = to.slice(0, 10);
    const out: CalEvent[] = [];
    for (const ev of this.store.values()) {
      if (ev.start.slice(0, 10) <= toDay && ev.end.slice(0, 10) >= fromDay) out.push(ev);
    }
    return out;
  }

  /** Manuell/nach Fokuswechsel: alles Bekannte gegen Google prüfen (meist lauter 304er). */
  async refresh(): Promise<void> { await this.run("refresh"); }

  /** Nur nachladen, wenn der letzte Lauf her ist – für „Ansicht wird wieder sichtbar". */
  refreshIfStale(): void {
    if (!this.isActive()) return;
    const at = this.status.lastLoadedAt;
    if (at === null || Date.now() - at > POLL_MS) void this.run("refresh");
  }

  /** Kalenderliste (Farben/Namen) für die Einstellungen – ohne den eigenen Sync-Kalender. */
  async calendarList(force = false): Promise<CalendarInfo[]> {
    if (force || !this.cals) this.cals = await listCalendars(this.auth);
    const own = this.host.syncCalendarId();
    return this.cals.filter((c) => c.id !== own);
  }

  /** Erstes Einschalten: primärer Kalender an, alle anderen aus –
   *  lieber zu wenig zeigen als ungefragt fremde Kalender ausbreiten. */
  async initDefaults(): Promise<void> {
    const s = this.host.settings;
    if (Object.keys(s.calendars).length) return;      // schon einmal gewählt → Wahl des Nutzers gilt
    const cals = await this.calendarList(true);
    for (const c of cals) s.calendars[c.id] = !!c.primary;
    await this.host.persist();
  }

  /** Kalender ein-/ausblenden (Auge in den Einstellungen). */
  async setCalendarVisible(id: string, on: boolean): Promise<void> {
    this.host.settings.calendars[id] = on;
    if (!on) {
      for (const [k, ev] of this.store) if (ev.calendarId === id) this.store.delete(k);
      for (const k of [...this.fetched.keys()]) if (k.startsWith(id + "|")) this.fetched.delete(k);
      this.emit();
    }
    await this.host.persist();
    if (on) void this.run("ensure");
  }

  /** Termine komplett vergessen (Abmelden/Ausschalten) – nichts bleibt im Speicher oder data.json. */
  async clear(): Promise<void> {
    this.store.clear();
    this.fetched.clear();
    this.host.settings.snapshot = [];
    this.status = { loading: false, error: null, lastLoadedAt: null };
    await this.host.persist();
    this.emit();
  }

  // ── Laufwerk ──
  private async run(mode: "ensure" | "refresh"): Promise<void> {
    if (!this.isActive()) return;
    if (this.running) { this.rerun = mode; return; }
    this.running = true;
    this.setStatus({ loading: true, error: null });
    let failed: string | null = null;
    try {
      const months = [...this.wanted];
      for (const cal of this.selectedCalendars()) {
        for (const month of months) {
          const key = cal + "|" + month;
          if (mode === "ensure" && this.fetched.has(key)) continue;   // schon geladen
          try {
            await this.fetchMonth(cal, month);
          } catch (e) {
            // Ein Kalender ohne Zugriff (403/404) darf die anderen nicht mitreißen.
            if (e instanceof GCalHttpError && (e.status === 403 || e.status === 404)) continue;
            throw e;
          }
        }
      }
      this.prune();
      await this.saveSnapshot();
      this.setStatus({ loading: false, lastLoadedAt: Date.now(), error: null });
    } catch (e) {
      // Stale-while-error: der zuletzt geholte Stand bleibt stehen. Keine Notice – ein
      // fehlgeschlagener Termin-Abruf ist kein Ereignis, das eine Meldung wert wäre.
      failed = e instanceof Error ? e.message : String(e);
      this.setStatus({ loading: false, error: failed });
    } finally {
      this.running = false;
      const next = this.rerun;
      this.rerun = null;
      if (next) void this.run(next);
    }
  }

  /** Einen Monat eines Kalenders holen. `false` = unverändert (304), nichts neu gezeichnet. */
  private async fetchMonth(calId: string, month: string): Promise<boolean> {
    const key = calId + "|" + month;
    const { fromDay, toDay, timeMin, timeMax } = monthWindow(month);
    const etag = this.fetched.get(key);
    const items: Record<string, unknown>[] = [];
    let pageToken: string | undefined;
    let newEtag: string | null = null;

    do {
      const q = new URLSearchParams({
        singleEvents: "true", orderBy: "startTime", maxResults: "2500", timeMin, timeMax,
      });
      if (pageToken) q.set("pageToken", pageToken);
      // If-None-Match nur auf der ersten Seite: ändert sich nichts, ist der ganze Monat erledigt.
      const headers = !pageToken && etag ? { "If-None-Match": etag } : undefined;
      const res = await gcalRequest(this.auth, "GET", `/calendars/${enc(calId)}/events?` + q.toString(), undefined, headers);
      if (res.status === 304) return false;
      for (const raw of (res.json?.items as Record<string, unknown>[] | undefined) ?? []) items.push(raw);
      pageToken = res.json?.nextPageToken as string | undefined;
      if (!pageToken) newEtag = res.etag;
    } while (pageToken);

    const color = await this.colorOf(calId);
    const mapped: CalEvent[] = [];
    for (const raw of items) {
      const ev = this.mapEvent(raw, calId, color);
      if (ev) mapped.push(ev);
    }
    this.replaceRange(calId, fromDay, toDay, mapped);
    this.fetched.set(key, newEtag);
    this.emit();
    return true;
  }

  /** Kalenderfarbe (aus calendarList). Fällt auf die Akzentfarbe des Themes zurück. */
  private async colorOf(calId: string): Promise<string> {
    try {
      if (!this.cals) await this.calendarList();
    } catch { /* offline → Fallback-Farbe */ }
    return this.cals?.find((c) => c.id === calId)?.backgroundColor ?? "var(--interactive-accent)";
  }

  private mapEvent(raw: Record<string, unknown>, calId: string, color: string): CalEvent | null {
    if (raw.status === "cancelled") return null;
    if (this.host.settings.hideDeclined && isDeclined(raw)) return null;
    const start = raw.start as { date?: string; dateTime?: string } | undefined;
    const end = raw.end as { date?: string; dateTime?: string } | undefined;
    if (!start) return null;

    const allDay = !!start.date;
    const s = allDay ? start.date! : start.dateTime ? localStamp(start.dateTime) : null;
    if (!s) return null;
    const e = allDay
      ? (end?.date ?? addDays(s, 1))
      : (end?.dateTime ? localStamp(end.dateTime) ?? s : s);

    return {
      id: raw.id as string,
      calendarId: calId,
      title: (raw.summary as string) || t("gcalfeed_untitled"),
      start: s,
      end: e,
      allDay,
      color,
      htmlLink: (raw.htmlLink as string) ?? "",
      location: (raw.location as string) || undefined,
    };
  }

  /** Den Ausschnitt eines Kalenders ersetzen: erst alles im Fenster weg, dann das Geholte rein.
   *  So verschwinden in Google gelöschte/verschobene Termine, ohne `showDeleted` zu brauchen. */
  private replaceRange(calId: string, fromDay: string, toDay: string, events: CalEvent[]): void {
    for (const [k, ev] of this.store) {
      if (ev.calendarId !== calId) continue;
      if (ev.start.slice(0, 10) <= toDay && ev.end.slice(0, 10) >= fromDay) this.store.delete(k);
    }
    for (const ev of events) this.store.set(evKey(ev), ev);
  }

  /** Notbremse: bei sehr vollen Kalendern die zeitlich entferntesten Termine vergessen. */
  private prune(): void {
    if (this.store.size <= MAX_STORE) return;
    for (const ev of this.nearestToToday(MAX_STORE, true)) this.store.delete(evKey(ev));
  }

  /** Die `n` Termine nächst am heutigen Tag – oder (invert) genau die restlichen. */
  private nearestToToday(n: number, invert = false): CalEvent[] {
    const today = iso(new Date());
    const dist = (ev: CalEvent): number => Math.abs(Date.parse(ev.start.slice(0, 10)) - Date.parse(today));
    const all = [...this.store.values()].sort((a, b) => dist(a) - dist(b));
    return invert ? all.slice(n) : all.slice(0, n);
  }

  /** Snapshot für den nächsten Kaltstart. Gedeckelt, damit data.json nicht wächst. */
  private async saveSnapshot(): Promise<void> {
    const snap = this.nearestToToday(SNAPSHOT_MAX).sort((a, b) => a.start.localeCompare(b.start));
    this.host.settings.snapshot = snap;
    await this.host.persist();
  }

  private setStatus(patch: Partial<GCalFeedStatus>): void {
    this.status = { ...this.status, ...patch };
    this.emit();
  }
  private emit(): void { for (const cb of this.cbs) cb(); }
}
