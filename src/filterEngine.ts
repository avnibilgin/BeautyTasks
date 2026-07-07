import { Task, Priority } from "./types";
import { TaskIndex } from "./taskIndex";

// ── Kriterien & Optionen ────────────────────────────────────────────
// Ein flaches Kriterien-Objekt (Vorschlag 3 „Smart Lists"): verschiedene Facetten sind
// implizit UND-verknüpft, mehrere Werte innerhalb einer Facette ODER. Keine Bool-Algebra
// im UI. Die Engine ist bewusst rein (nur Task-Daten), damit später ein Query-Modus
// (Vorschlag 1) dieselbe Auswertung wiederverwenden kann.

export type FilterRange = "any" | "today" | "overdue" | "next7" | "nodate";
export type FilterSort = "smart" | "due" | "deadline" | "priority" | "created" | "title";
export type FilterGroup = "none" | "date" | "deadline" | "priority" | "label" | "project";
export type PageLayout = "list" | "board";

export interface FilterCriteria {
  range: FilterRange;      // Zeitraum-Facette (Default „any" = alle)
  priorities: Priority[];  // leer = alle (ODER innerhalb)
  labels: string[];        // leer = alle (ODER innerhalb)
  projects: string[];      // Basenamen, leer = alle (ODER innerhalb)
  search: string;          // Freitext im Titel ("" = keiner)
}

export interface ViewOptions {
  layout: PageLayout;      // Liste oder Kanban-Board
  sort: FilterSort;
  group: FilterGroup;
  showDone: boolean;       // erledigte Aufgaben mit einbeziehen
}

export const DEFAULT_CRITERIA: FilterCriteria = { range: "any", priorities: [], labels: [], projects: [], search: "" };
export const DEFAULT_OPTIONS: ViewOptions = { layout: "list", sort: "smart", group: "none", showDone: false };

/** Im UI wählbare Zeiträume/Sortierungen/Gruppierungen (Reihenfolge = Anzeige). */
export const RANGES: FilterRange[] = ["any", "overdue", "today", "next7", "nodate"];
export const SORTS: FilterSort[] = ["smart", "due", "deadline", "priority", "created", "title"];
export const GROUPS: FilterGroup[] = ["none", "date", "deadline", "priority", "label", "project"];
export const LAYOUTS: PageLayout[] = ["list", "board"];
/** Prioritäten wie im Aufgaben-Picker (4 Stufen). */
export const FILTER_PRIORITIES: Priority[] = ["highest", "high", "medium", "normal"];

const baseName = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");
const PRIO_RANK: Record<Priority, number> = { highest: 0, high: 1, medium: 2, normal: 3, low: 4, lowest: 5 };

/** Lokales Datum + n Tage als ISO (YYYY-MM-DD), ohne UTC-Drift. */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  const z = (x: number): string => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
}

/** Anzahl aktiver (nicht-Default) Facetten – für die „Anzeige: N"-Badge. */
export function activeFacetCount(c: FilterCriteria): number {
  let n = 0;
  if (c.range !== "any") n++;
  if (c.priorities.length) n++;
  if (c.labels.length) n++;
  if (c.projects.length) n++;
  if (c.search.trim()) n++;
  return n;
}

function inRange(t: Task, range: FilterRange, today: string): boolean {
  if (range === "any") return true;
  if (range === "nodate") return !t.due;
  if (!t.due) return false;
  if (range === "overdue") return t.due < today;
  if (range === "today") return t.due <= today;             // überfällig + heute (wie Todoist „Heute")
  if (range === "next7") return t.due >= today && t.due <= addDays(today, 7);
  return true;
}

/** Reine Prädikat-Auswertung einer Aufgabe gegen die Kriterien. */
export function matchesTask(t: Task, c: FilterCriteria, today: string): boolean {
  if (!inRange(t, c.range, today)) return false;
  if (c.priorities.length && !c.priorities.includes(t.priority)) return false;
  if (c.labels.length && !c.labels.some((l) => t.labels.includes(l))) return false;
  if (c.projects.length && !(t.project && c.projects.includes(baseName(t.project)))) return false;
  const q = c.search.trim().toLowerCase();
  if (q && !t.title.toLowerCase().includes(q)) return false;
  return true;
}

/** Sortierung nach Modus. „smart" = datiert zuerst (aufsteigend), Datumlose ans Ende,
 *  Gleichstand nach Priorität. */
export function sortTasks(list: Task[], sort: FilterSort): Task[] {
  const arr = [...list];
  const byDue = (a: Task, b: Task): number => (a.due ?? "9999-99-99").localeCompare(b.due ?? "9999-99-99");
  const byPrio = (a: Task, b: Task): number => PRIO_RANK[a.priority] - PRIO_RANK[b.priority];
  if (sort === "due") return arr.sort((a, b) => byDue(a, b) || a.title.localeCompare(b.title));
  if (sort === "deadline") {
    const byDl = (a: Task, b: Task): number => (a.scheduled ?? "9999-99-99").localeCompare(b.scheduled ?? "9999-99-99");
    return arr.sort((a, b) => byDl(a, b) || byPrio(a, b));
  }
  if (sort === "priority") return arr.sort((a, b) => byPrio(a, b) || byDue(a, b));
  if (sort === "created") return arr.sort((a, b) => (b.created ?? "").localeCompare(a.created ?? ""));
  if (sort === "title") return arr.sort((a, b) => a.title.localeCompare(b.title));
  return arr.sort((a, b) => byDue(a, b) || byPrio(a, b));   // smart
}

/** Basis-Menge → Facetten-Filter → Sortierung. Basis ist `open()` (ohne archivierte/
 *  erledigte); mit showDone kommen erledigte hinzu. Nav-Zähler UND Board nutzen dies. */
export function applyFilter(idx: TaskIndex, c: FilterCriteria, opts: ViewOptions, today: string): Task[] {
  const base = opts.showDone ? [...idx.open(), ...idx.done()] : idx.open();
  return sortTasks(base.filter((t) => matchesTask(t, c, today)), opts.sort);
}
