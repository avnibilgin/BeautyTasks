import { App, TFile, requestUrl, Notice } from "obsidian";
import { Task } from "./types";
import { isTrashed, isDone } from "./statuses";
import { isInboxLink, listProjectsAndAreas } from "./taskService";
import { resolveReminders } from "./reminders";
import { combineDT } from "./format";
import { t } from "./i18n";
import { GCalAuth, GCalAuthError } from "./gcalAuth";

/**
 * Google-Kalender-Sync, **Zwei-Wege (Stufe A Push + Stufe B Pull/Konflikt)**. Bewusst
 * UI-agnostisch: die Engine kennt weder Settings-Tab noch Statusleiste, sondern
 * *emittiert* ihren Zustand (`onStatus`). Settings-UI und Statusleiste sind dünne
 * Abonnenten — dasselbe Prinzip wie reminders.ts.
 *
 * Identität liegt in der NOTIZ (`gcal_event_id`/`gcal_calendar_id` im Frontmatter),
 * plus `btTaskId` unsichtbar im Event (für die Pull-Zuordnung). Der operative Abgleich
 * läuft über `lastSynced` in den Settings: `sig` (Signatur-Diff → keine redundanten
 * Schreibzugriffe) und der zuletzt abgeglichene `due`/`dueTime` (Basis des 3-Wege-
 * Konflikts). Pull ist inkrementell über `nextSyncToken` je Kalender.
 *
 * Reihenfolge pro Lauf: erst PULL (Google→Obsidian: geänderte Termine zurückschreiben,
 * gelöschte Events lösen die Verknüpfung), dann PUSH (Obsidian→Google). Frisch aus Google
 * zurückgeschriebene Aufgaben werden im Push übersprungen (der metadataCache ist noch stale).
 *
 * Konflikt (beide Seiten geändert): **Obsidian gewinnt** (Push überschreibt Google);
 * optionaler gebündelter Hinweis (`notifyConflicts`). Existenz ist Obsidian-gesteuert:
 * ein in Google gelöschtes Event wird neu angelegt, solange die Aufgabe ein Datum hat.
 *
 * Alle HTTP-Calls über requestUrl (kein fetch → keine CORS/Origin-Probleme).
 */

/** HTTP-Fehler der Kalender-API mit Statuscode – für gezielte Behandlung:
 *  404/410 = Event/Kalender weg (neu anlegen bzw. ignorieren); 410 im Pull = syncToken abgelaufen. */
class GCalHttpError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

const API = "https://www.googleapis.com/calendar/v3";
const SYNC_SOURCE = "beautytasks";
const DEBOUNCE_MS = 2000;
const POLL_MS = 5 * 60 * 1000;   // periodischer Pull, damit Google-Änderungen auch ohne lokale Edits kommen
export const DEFAULT_CALENDAR_NAME = "BeautyTasks";

// ── Persistierte Sync-Einstellungen (Unter-Objekt von BeautyTasksSettings) ────
/** Zuletzt abgeglichener Stand je Aufgabe. `sig` = Push-Änderungserkennung;
 *  `due`/`dueTime` = letzter gemeinsamer Datumsstand (Basis des 3-Wege-Konflikts). */
export interface GCalLink { eventId: string; calendarId: string; sig: string; due?: string | null; dueTime?: string | null; }

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
  lastSynced: Record<string, GCalLink>;             // taskId -> zuletzt abgeglichener Stand
  syncTokens: Record<string, string>;               // calendarId -> nextSyncToken (inkrementeller Pull)
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
  syncTokens: {},
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
    throw new GCalHttpError(res.status, "Google Kalender: " + msg);
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

/** Event-Start → (due, dueTime) in lokaler Zeit. Ganztags: dateTime=null. */
function eventDateParts(ev: Record<string, unknown>): { due: string | null; dueTime: string | null } {
  const start = ev.start as { date?: string; dateTime?: string } | undefined;
  if (!start) return { due: null, dueTime: null };
  if (start.date) return { due: start.date, dueTime: null };
  if (start.dateTime) {
    const d = new Date(start.dateTime);
    if (isNaN(d.getTime())) return { due: null, dueTime: null };
    return {
      due: isoDate(d),
      dueTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`,
    };
  }
  return { due: null, dueTime: null };
}

/** Events inkrementell holen. Ohne syncToken: nur eigene Events (privateExtendedProperty),
 *  der zurückgelieferte nextSyncToken „merkt" sich diesen Filter für Folgeläufe. */
async function pullEvents(
  auth: GCalAuth, calendarId: string, syncToken: string | undefined,
): Promise<{ items: Record<string, unknown>[]; nextSyncToken: string | null }> {
  const items: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  let nextSyncToken: string | null = null;
  do {
    const q = new URLSearchParams({ singleEvents: "true", showDeleted: "true", maxResults: "2500" });
    if (syncToken) q.set("syncToken", syncToken);
    else q.set("privateExtendedProperty", "syncSource=" + SYNC_SOURCE);
    if (pageToken) q.set("pageToken", pageToken);
    const resp = await api(auth, "GET", `/calendars/${enc(calendarId)}/events?` + q.toString());
    for (const ev of (resp?.items as Record<string, unknown>[] | undefined) ?? []) items.push(ev);
    pageToken = resp?.nextPageToken as string | undefined;
    nextSyncToken = (resp?.nextSyncToken as string | undefined) ?? nextSyncToken;
  } while (pageToken);
  return { items, nextSyncToken };
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
  private pollTimer: number | null = null;
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

  /** Auto-Sync verdrahten: bei Vault-Änderungen entprellt syncen + periodischer Pull
   *  (holt Google-Änderungen auch ohne lokale Edits). Beides an `autoSync` gekoppelt. Idempotent. */
  start(): void {
    if (this.unsub) return;
    this.unsub = this.host.subscribe(() => this.scheduleSync());
    this.pollTimer = window.setInterval(() => { if (this.host.settings.autoSync) void this.syncNow(); }, POLL_MS);
  }
  stop(): void {
    this.unsub?.(); this.unsub = null;
    if (this.debounceTimer) { window.clearTimeout(this.debounceTimer); this.debounceTimer = null; }
    if (this.pollTimer) { window.clearInterval(this.pollTimer); this.pollTimer = null; }
  }

  private scheduleSync(): void {
    if (!this.canSync() || !this.host.settings.autoSync) return;
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => { this.debounceTimer = null; void this.syncNow(); }, DEBOUNCE_MS);
  }

  /** Ist der Sync tatsächlich aktiv (verbunden UND Hauptschalter an UND Ziel-Kalender gesetzt)?
   *  Auch die UI (per-Listen-Schalter/-Menü) hängt daran – tote Bedienelemente vermeiden. */
  canSync(): boolean {
    const s = this.host.settings;
    return s.enabled && !!s.calendarId && this.auth.isConnected();
  }

  /** Ein Zwei-Wege-Durchlauf (manuell oder entprellt): erst Pull, dann Push. Re-entrancy-sicher. */
  async syncNow(): Promise<void> {
    if (!this.canSync()) return;
    if (this.running) { this.rerun = true; return; }
    this.running = true;
    this.emit({ status: "syncing", lastError: null });
    try {
      const pulled = await this.pullAll();   // Google → Obsidian (+ neuer syncToken)
      await this.pushAll(pulled);            // Obsidian → Google (frisch Gezogene übersprungen)
      await this.host.persist();
      this.emit({ status: "idle", lastSyncedAt: Date.now(), lastError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ status: "error", lastError: msg });
    } finally {
      this.running = false;
      if (this.rerun) { this.rerun = false; void this.syncNow(); }
    }
  }

  // ── Pull-Reconcile (Google → Obsidian) ──
  /** Liefert die Menge der Aufgaben-Ids, die gerade AUS Google zurückgeschrieben wurden –
   *  der Push überspringt sie diesen Lauf (metadataCache ist noch stale). */
  private async pullAll(): Promise<Set<string>> {
    const s = this.host.settings;
    const cal = s.calendarId;
    const pulled = new Set<string>();
    let result: { items: Record<string, unknown>[]; nextSyncToken: string | null };
    try {
      result = await pullEvents(this.auth, cal, s.syncTokens[cal]);
    } catch (e) {
      if (!(e instanceof GCalHttpError && e.status === 410)) throw e;
      delete s.syncTokens[cal];                        // Token tot → einmal voll neu ziehen
      result = await pullEvents(this.auth, cal, undefined);
    }

    const taskMap = new Map(this.host.allTasks().map((t) => [t.id, t]));
    const byEvent = new Map<string, string>();          // eventId -> taskId (für Löschungen ohne btTaskId)
    for (const [tid, link] of Object.entries(s.lastSynced)) byEvent.set(link.eventId, tid);

    let conflicts = 0;
    for (const ev of result.items) {
      const eventId = ev.id as string;
      const priv = (ev.extendedProperties as { private?: Record<string, string> } | undefined)?.private;
      const taskId = priv?.btTaskId ?? byEvent.get(eventId);
      if (!taskId) continue;                            // fremdes/unbekanntes Event
      const link = s.lastSynced[taskId];

      if (ev.status === "cancelled") {                  // in Google gelöscht → Verknüpfung lösen
        if (link && link.eventId === eventId) delete s.lastSynced[taskId];
        const task = taskMap.get(taskId);
        if (task) await this.clearBack(task);           // Aufgabe bleibt; Push legt sie ggf. neu an
        continue;
      }
      const task = taskMap.get(taskId);
      if (!task || !link || link.eventId !== eventId) continue;

      const g = eventDateParts(ev);
      // Alt-Links (Stufe A) haben kein `due` → als synchron mit der Aufgabe annehmen (sonst
      // würde der erste Pull jeden Bestandstermin fälschlich als Konflikt werten).
      const known = link.due !== undefined;
      const lastDue = known ? (link.due ?? null) : (task.due ?? null);
      const lastDueTime = known ? (link.dueTime ?? null) : (task.dueTime ?? null);
      const gChanged = g.due !== lastDue || g.dueTime !== lastDueTime;
      if (!gChanged) {
        if (!known) { link.due = g.due; link.dueTime = g.dueTime; }   // Stand nachtragen (Migration)
        continue;                                       // Google unverändert → nichts zu holen
      }
      const oChanged = task.due !== lastDue || task.dueTime !== lastDueTime;
      if (oChanged) { conflicts++; continue; }          // beide geändert → Obsidian gewinnt (Push regelt)

      await this.writeBackDue(task, g.due, g.dueTime);  // Google geändert, Obsidian nicht → zurückschreiben
      link.due = g.due; link.dueTime = g.dueTime;
      link.sig = signature({ ...task, due: g.due, dueTime: g.dueTime }, cal);
      pulled.add(taskId);
    }

    if (result.nextSyncToken) s.syncTokens[cal] = result.nextSyncToken;
    if (conflicts && s.notifyConflicts) new Notice(t("gcal_conflicts_notice", conflicts));
    return pulled;
  }

  // ── Push-Reconcile (Obsidian → Google) ──
  /** `skip` = Aufgaben, die dieser Lauf gerade aus Google zurückgeschrieben hat (stale Cache). */
  private async pushAll(skip: Set<string>): Promise<void> {
    const s = this.host.settings;
    const cal = s.calendarId;
    const tasks = this.host.allTasks();
    const eligible = new Map<string, Task>();
    for (const t of tasks) if (this.isEligible(t)) eligible.set(t.id, t);

    // 1) Anlegen / Aktualisieren
    for (const [id, task] of eligible) {
      if (skip.has(id)) continue;
      const link = s.lastSynced[id];
      const eventId = link?.eventId ?? this.frontmatterEventId(task);
      const sig = signature(task, cal);
      const stamp = (evId: string): GCalLink => ({ eventId: evId, calendarId: cal, sig, due: task.due, dueTime: task.dueTime });
      if (!eventId) {
        if (!s.syncOnCreate) continue;
        const ev = await api(this.auth, "POST", `/calendars/${enc(cal)}/events`, eventBody(task, s));
        const newId = ev?.id as string;
        if (newId) { s.lastSynced[id] = stamp(newId); await this.writeBack(task, newId, cal); }
      } else if (!link || link.sig !== sig || link.calendarId !== cal) {
        if (!s.syncOnUpdate) continue;
        try {
          if (link && link.calendarId !== cal) {
            // Kalenderwechsel: Google kann Events verschieben (move)
            await api(this.auth, "POST", `/calendars/${enc(link.calendarId)}/events/${enc(eventId)}/move?destination=${enc(cal)}`);
          }
          await api(this.auth, "PATCH", `/calendars/${enc(cal)}/events/${enc(eventId)}`, eventBody(task, s));
          s.lastSynced[id] = stamp(eventId);
          await this.writeBack(task, eventId, cal);
        } catch (e) {
          if (!(e instanceof GCalHttpError && (e.status === 404 || e.status === 410))) throw e;
          // Event (oder Kalender) in Google weg → neu anlegen
          const ev = await api(this.auth, "POST", `/calendars/${enc(cal)}/events`, eventBody(task, s));
          const newId = ev?.id as string;
          if (newId) { s.lastSynced[id] = stamp(newId); await this.writeBack(task, newId, cal); }
        }
      }
    }

    // 2) Löschen: früher gesynct, jetzt nicht mehr berechtigt/vorhanden
    for (const id of Object.keys(s.lastSynced)) {
      if (eligible.has(id)) continue;
      if (!s.syncOnDelete) continue;
      const link = s.lastSynced[id];
      try { await api(this.auth, "DELETE", `/calendars/${enc(link.calendarId)}/events/${enc(link.eventId)}`); }
      catch (e) { if (!(e instanceof GCalHttpError && (e.status === 404 || e.status === 410))) throw e; }   // schon weg = ok
      delete s.lastSynced[id];
      const t = this.host.allTasks().find((x) => x.id === id);
      if (t) await this.clearBack(t);
    }
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
    // „Nicht einsortiert" (kein Projekt oder Inbox-Verweis) folgt dem Ausschluss der Eingang-Notiz.
    if (isInboxLink(t.project)) {
      const eingang = listProjectsAndAreas(this.host.app).eingang;
      return eingang ? this.frontmatterOf(eingang.path)?.gcal_sync === false : false;
    }
    return this.frontmatterOf(t.project!)?.gcal_sync === false;
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
  /** Datum/Uhrzeit aus Google in die Notiz zurückschreiben (Frontmatter `due` = kombiniert). */
  private async writeBackDue(t: Task, due: string | null, dueTime: string | null): Promise<void> {
    const f = this.host.app.vault.getAbstractFileByPath(t.path);
    if (!(f instanceof TFile)) return;
    await this.host.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      if (due) fm.due = combineDT(due, dueTime); else delete fm.due;
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
