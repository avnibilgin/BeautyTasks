import { Task } from "./types";
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

/** Ein Zeitblock in der Wochen-/Tagesspalte. col/cols = Position in der Überlappungs-Gruppe. */
export type TimedBlock = { task: Task; startMin: number; endMin: number; col: number; cols: number };
/** Ohne eigene Dauer bekommt ein Termin diese Blockhöhe (sonst wäre er 0 Minuten hoch). */
export const DEFAULT_BLOCK_MIN = 30;

/**
 * Zeitblöcke eines Tages überlappungsfrei anordnen (Kalender-Standardverfahren):
 * überlappende Blöcke bilden einen Cluster und teilen sich dessen Breite. Blöcke ohne Uhrzeit
 * gehören nicht hierher (die zeigt die Ganztägig-Zeile) und werden übersprungen.
 */
export function layoutDay(tasks: Task[]): TimedBlock[] {
  const blocks: TimedBlock[] = [];
  for (const task of tasks) {
    const startMin = minutesOf(task);
    if (startMin === null) continue;
    const dur = task.duration && task.duration > 0 ? task.duration : DEFAULT_BLOCK_MIN;
    blocks.push({ task, startMin, endMin: Math.min(startMin + dur, 1440), col: 0, cols: 1 });
  }
  blocks.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin || a.task.title.localeCompare(b.task.title));

  // Cluster = maximale Kette sich (transitiv) überlappender Blöcke. Innerhalb eines Clusters
  // bekommt jeder Block die erste Spalte, die zum Zeitpunkt seines Starts frei ist.
  let cluster: TimedBlock[] = [];
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

/** Aufgaben eines Tages ohne Uhrzeit (Ganztägig-Zeile der Wochenansicht). */
export const allDayOf = (tasks: Task[]): Task[] => tasks.filter((tk) => minutesOf(tk) === null);

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
