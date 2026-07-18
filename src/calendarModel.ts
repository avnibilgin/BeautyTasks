import { Task, CalEvent } from "./types";
import { dateOf, timeOf } from "./format";

/**
 * Kalender-Modell (Stufe 1+2). Reine Logik, KEIN DOM: Raster bauen, Aufgaben auf Tage verteilen,
 * Zeitblöcke überlappungsfrei anordnen. calendarView.ts ist ein dünner Zeichner darauf.
 *
 * Achse ist ausschließlich `due` (Fälligkeit) – damit hat ein Drag & Drop genau eine Bedeutung
 * („neu terminieren") und eine Aufgabe kann nie doppelt im Raster stehen.
 *
 * Datums-Arithmetik läuft konsequent über lokale Date-Objekte (new Date(y, m, d)) und nie über
 * new Date("2026-07-05") – letzteres liest ISO-Strings ohne Zeitanteil als UTC und verschiebt
 * das Datum je nach Zeitzone um einen Tag (dieselbe Falle wie in reminders.ts).
 */

export type CalMode = "year" | "month" | "week" | "day";
/** Reihenfolge = Anzeige der Umschalter im Kalender-Kopf (grob → fein). */
export const CAL_MODES: CalMode[] = ["year", "month", "week", "day"];

const z = (n: number) => String(n).padStart(2, "0");
export const iso = (d: Date): string => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
/** "YYYY-MM-DD" -> lokales Date (Mitternacht). */
export const parseISO = (s: string): Date => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

export function addDays(isoDate: string, n: number): string {
  const d = parseISO(isoDate); d.setDate(d.getDate() + n); return iso(d);
}
/** Monatssprung, der den Tag klemmt: 31. Jan + 1 Monat = 28./29. Feb (nicht 3. März). */
export function addMonths(isoDate: string, n: number): string {
  const d = parseISO(isoDate);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return iso(d);
}
/** Montag der Woche, in der `isoDate` liegt (Woche beginnt Montag – wie im Datumswähler). */
export function startOfWeek(isoDate: string): string {
  const d = parseISO(isoDate);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return iso(d);
}
export const sameMonth = (a: string, b: string): boolean => a.slice(0, 7) === b.slice(0, 7);

/** Monatsraster: immer 6 Wochen à 7 Tage ab dem Montag vor dem Monatsersten (stabile Höhe). */
export function monthGrid(anchor: string): string[] {
  const first = anchor.slice(0, 8) + "01";
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}
/** Die zwölf Monatsersten des Jahres von `anchor` (Jahresansicht). */
export function yearMonths(anchor: string): string[] {
  const y = anchor.slice(0, 4);
  return Array.from({ length: 12 }, (_, i) => `${y}-${z(i + 1)}-01`);
}
/** Jahressprung – klemmt den Tag (29. Feb im Schaltjahr -> 28. Feb). */
export function addYears(isoDate: string, n: number): string {
  return addMonths(isoDate, n * 12);
}

/** Wochenraster: Montag..Sonntag der Woche von `anchor`. */
export function weekDays(anchor: string): string[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}

/** Aufgaben auf ihren Fälligkeitstag verteilen. Ohne `due` = nicht im Kalender. */
export function bucketByDue(tasks: Task[]): Map<string, Task[]> {
  const out = new Map<string, Task[]>();
  for (const tk of tasks) {
    if (!tk.due) continue;
    const key = dateOf(tk.due);
    const arr = out.get(key);
    if (arr) arr.push(tk); else out.set(key, [tk]);
  }
  return out;
}

/** Minuten seit Mitternacht aus dueTime ("09:30" -> 570); ohne Uhrzeit null (= ganztägig). */
export function minutesOf(task: Task): number | null {
  const tm = task.dueTime ?? (task.due ? timeOf(task.due) : null);
  if (!tm) return null;
  const m = tm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const min = +m[1] * 60 + +m[2];
  return min >= 0 && min < 1440 ? min : null;
}

/** Alles, was im Zeitraster eine Fläche belegt – Aufgabe wie Termin. */
export interface Slot { startMin: number; endMin: number }
/** Slot + Position in seiner Überlappungs-Gruppe. */
export type Laid<T> = T & { col: number; cols: number };
/** Ein Zeitblock in der Wochen-/Tagesspalte. col/cols = Position in der Überlappungs-Gruppe. */
export type TimedBlock = Laid<{ task: Task; startMin: number; endMin: number }>;
/** Ohne eigene Dauer bekommt ein Termin diese Blockhöhe (sonst wäre er 0 Minuten hoch). */
export const DEFAULT_BLOCK_MIN = 30;

/**
 * Zeitblöcke eines Tages überlappungsfrei anordnen (Kalender-Standardverfahren):
 * überlappende Blöcke bilden einen Cluster und teilen sich dessen Breite.
 *
 * Bewusst generisch über `Slot`: seit der Kalender auch Google-Termine zeigt, müssen Aufgabe UND
 * Termin einander ausweichen – sie stecken im selben Cluster, sonst läge ein Meeting unsichtbar
 * unter einem Aufgabenblock. Was ein Block IST, weiß hier niemand (`tie` entscheidet nur die
 * Reihenfolge bei exakt gleicher Zeit).
 */
export function layoutSlots<T extends Slot>(items: T[], tie: (a: T, b: T) => number = () => 0): Laid<T>[] {
  const blocks: Laid<T>[] = items.map((it) => ({ ...it, col: 0, cols: 1 }));
  blocks.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin || tie(a, b));

  // Cluster = maximale Kette sich (transitiv) überlappender Blöcke. Innerhalb eines Clusters
  // bekommt jeder Block die erste Spalte, die zum Zeitpunkt seines Starts frei ist.
  let cluster: Laid<T>[] = [];
  let clusterEnd = -1;
  const flush = (): void => {
    if (!cluster.length) return;
    const cols = Math.max(...cluster.map((b) => b.col)) + 1;
    for (const b of cluster) b.cols = cols;
    cluster = [];
  };
  const colEnds: number[] = [];      // Endzeit je Spalte im laufenden Cluster
  for (const b of blocks) {
    if (b.startMin >= clusterEnd) { flush(); colEnds.length = 0; }   // keine Überlappung mehr -> neuer Cluster
    let c = colEnds.findIndex((end) => end <= b.startMin);
    if (c === -1) { c = colEnds.length; colEnds.push(b.endMin); } else { colEnds[c] = b.endMin; }
    b.col = c;
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  flush();
  return blocks;
}

/** Aufgabe -> Slot. Ohne Uhrzeit (= ganztägig) kein Slot: die zeigt die Ganztägig-Zeile. */
function taskSlot(task: Task): { task: Task; startMin: number; endMin: number } | null {
  const startMin = minutesOf(task);
  if (startMin === null) return null;
  const dur = task.duration && task.duration > 0 ? task.duration : DEFAULT_BLOCK_MIN;
  return { task, startMin, endMin: Math.min(startMin + dur, 1440) };
}

/** Zeitblöcke der Aufgaben eines Tages (ohne Termine – siehe layoutDayMixed). */
export function layoutDay(tasks: Task[]): TimedBlock[] {
  const slots = tasks.map(taskSlot).filter((s): s is NonNullable<typeof s> => s !== null);
  return layoutSlots(slots, (a, b) => a.task.title.localeCompare(b.task.title));
}

/** Aufgaben eines Tages ohne Uhrzeit (Ganztägig-Zeile der Wochenansicht). */
export const allDayOf = (tasks: Task[]): Task[] => tasks.filter((tk) => minutesOf(tk) === null);

// ── Termine (read-only Anzeige-Schicht, siehe gcalFeed.ts) ─────────────────────
/**
 * Ein Termin, zugeschnitten auf EINEN Tag. Ein Termin kann über mehrere Tage laufen (Ganztags
 * Mi–Fr, oder 23:00–01:00) und steht dann an jedem betroffenen Tag mit seinem dortigen Ausschnitt.
 * `startMin === null` heißt: belegt an diesem Tag ganztägig (gehört in die Ganztägig-Zeile).
 */
export interface DayEvent {
  event: CalEvent;
  startMin: number | null;
  endMin: number | null;
}

/** Alles, was in einer Tagesspalte liegt: Aufgabe ODER Termin. */
export type DayBlock =
  | { kind: "task"; task: Task; startMin: number; endMin: number }
  | { kind: "event"; event: CalEvent; startMin: number; endMin: number };

const titleOf = (b: DayBlock): string => (b.kind === "task" ? b.task.title : b.event.title);

/** Aufgaben UND Termine eines Tages gemeinsam anordnen – sie teilen sich die Spaltenbreite. */
export function layoutDayMixed(tasks: Task[], events: DayEvent[]): Laid<DayBlock>[] {
  const blocks: DayBlock[] = [];
  for (const task of tasks) {
    const s = taskSlot(task);
    if (s) blocks.push({ kind: "task", task, startMin: s.startMin, endMin: s.endMin });
  }
  for (const de of events) {
    if (de.startMin === null || de.endMin === null) continue;   // ganztägig -> Ganztägig-Zeile
    blocks.push({ kind: "event", event: de.event, startMin: de.startMin, endMin: de.endMin });
  }
  return layoutSlots(blocks, (a, b) => titleOf(a).localeCompare(titleOf(b)));
}

/** Termine eines Tages, die ganztägig belegen (Ganztägig-Zeile). */
export const allDayEventsOf = (events: DayEvent[]): DayEvent[] => events.filter((e) => e.startMin === null);

/** Minuten seit Mitternacht aus "YYYY-MM-DDTHH:mm"; ohne Zeitanteil null. */
const minutesIn = (stamp: string): number | null => {
  const m = stamp.match(/T(\d{2}):(\d{2})/);
  if (!m) return null;
  return +m[1] * 60 + +m[2];
};
/** Reißleine gegen kaputte Daten (Ende Jahre nach dem Start) – kein Endlos-Loop im Raster. */
const MAX_EVENT_DAYS = 400;

/**
 * Termine auf die Tage des Rasters verteilen und pro Tag zuschneiden.
 *
 * Zwei Fallen, an denen naive Umsetzungen brechen:
 *  - **Ganztags-Ende ist exklusiv** (Google): Mi–Fr kommt als start=Mi, end=Sa an und belegt Mi/Do/Fr.
 *  - **Termin über Mitternacht**: 23:00–01:00 steht an Tag 1 (23:00–24:00) UND Tag 2 (00:00–01:00);
 *    endet er exakt um 00:00, gehört er NICHT mehr auf den Folgetag (leerer Ausschnitt).
 */
export function bucketEvents(events: CalEvent[], days: string[]): Map<string, DayEvent[]> {
  const want = new Set(days);
  const out = new Map<string, DayEvent[]>();
  const push = (day: string, de: DayEvent): void => {
    if (!want.has(day)) return;
    const arr = out.get(day);
    if (arr) arr.push(de); else out.set(day, [de]);
  };

  for (const ev of events) {
    const startDay = ev.start.slice(0, 10);
    const endDay = ev.end.slice(0, 10);
    if (!startDay || endDay < startDay) continue;

    if (ev.allDay) {
      // Ende exklusiv: der letzte belegte Tag ist der Tag VOR `end`. Ein kaputtes end <= start
      // belegt wenigstens den Starttag (sonst wäre der Termin unsichtbar).
      let day = startDay;
      for (let i = 0; i < MAX_EVENT_DAYS && day < endDay; i++) {
        push(day, { event: ev, startMin: null, endMin: null });
        day = addDays(day, 1);
      }
      if (endDay <= startDay) push(startDay, { event: ev, startMin: null, endMin: null });
      continue;
    }

    const sMin = minutesIn(ev.start) ?? 0;
    // Termin ohne Dauer (start === end, in Google erlaubt) bekommt die Standard-Blockhöhe,
    // sonst fiele er durch die `to > from`-Prüfung und wäre unsichtbar.
    const rawEnd = minutesIn(ev.end) ?? 1440;
    const eMin = startDay === endDay && rawEnd <= sMin ? Math.min(sMin + DEFAULT_BLOCK_MIN, 1440) : rawEnd;
    let day = startDay;
    for (let i = 0; i < MAX_EVENT_DAYS && day <= endDay; i++) {
      const from = day === startDay ? sMin : 0;
      const to = day === endDay ? eMin : 1440;
      if (to > from) push(day, { event: ev, startMin: from, endMin: Math.min(to, 1440) });
      day = addDays(day, 1);
    }
  }

  for (const list of out.values()) {
    list.sort((a, b) => (a.startMin ?? -1) - (b.startMin ?? -1) || a.event.title.localeCompare(b.event.title));
  }
  return out;
}

// ── Chips je Monatszelle ───────────────────────────────────────────────────────
/**
 * Wie viele Chips passen in eine Tageszelle? KEINE Konstante: die Zeilen des Monatsrasters teilen
 * sich die freie Höhe (`grid-auto-rows: minmax(96px, 1fr)`), die Zellenhöhe hängt also an
 * Fensterhöhe, 5- oder 6-Wochen-Monat und Zoomstufe. Eine feste Zahl wäre für irgendeine
 * Fenstergröße immer falsch – zu klein verschenkt eine Zeile, zu groß schneidet die Zelle
 * (overflow: hidden) das „+N weitere" unten ab, und der Rest des Tages wird unsichtbar.
 *
 * calendarView.ts misst die freie Höhe der Zelle und die Höhe eines echten Chips; hier wird nur
 * gerechnet. Die „+N"-Zeile ist so hoch wie sie ist, deshalb zwei Zahlen:
 *   all  = Chips, wenn ALLE Aufgaben des Tages gezeigt werden (keine „+N"-Zeile nötig)
 *   some = Chips, wenn die „+N"-Zeile ihren Platz mitbekommt (also immer ≤ all)
 * Daraus folgt die Regel von oben: passt es bis auf EINE Aufgabe, zeig sie – „+1 weitere" bräuchte
 * dieselbe Zeile und würde sie nur verstecken.
 */
export interface ChipMetrics {
  chip: number;   // Höhe eines Chips in px
  more: number;   // Höhe der „+N weitere"-Zeile in px
  gap: number;    // Abstand zwischen den Zeilen (gap von .bt-calview-cell-body)
}
export interface ChipFit { all: number; some: number }

export function chipsThatFit(availPx: number, m: ChipMetrics): ChipFit {
  const row = m.chip + m.gap;                     // n Chips brauchen n*row − gap
  return {
    all: Math.max(1, Math.floor((availPx + m.gap) / row)),
    some: Math.max(1, Math.floor((availPx - m.more) / row)),
  };
}

/** Wie viele der `count` Aufgaben eines Tages als Chip gezeigt werden (Rest steckt im „+N"). */
export const shownChips = (count: number, fit: ChipFit): number => (count <= fit.all ? count : fit.some);
