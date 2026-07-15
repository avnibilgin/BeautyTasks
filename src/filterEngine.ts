import { Task, Priority } from "./types";
import { TaskIndex } from "./taskIndex";
import { isInboxLink, isInboxName } from "./taskService";

// ── Kriterien & Optionen ────────────────────────────────────────────
// Ein flaches Kriterien-Objekt (Vorschlag 3 „Smart Lists"): verschiedene Facetten sind
// implizit UND-verknüpft, mehrere Werte innerhalb einer Facette ODER. Keine Bool-Algebra
// im UI. Die Engine ist bewusst rein (nur Task-Daten), damit später ein Query-Modus
// (Vorschlag 1) dieselbe Auswertung wiederverwenden kann.

import { CalMode } from "./calendarModel";
export type { CalMode };

export type FilterRange = "any" | "today" | "overdue" | "next7" | "nodate";
export type FilterSort = "smart" | "due" | "deadline" | "priority" | "created" | "title";
export type FilterGroup = "none" | "date" | "deadline" | "priority" | "label" | "project";
export type PageLayout = "list" | "board" | "calendar";
/** Sortierrichtung. Gilt für die Aufgaben UND die Reihenfolge der Gruppen (eine Entscheidung,
 *  wie in Todoist). Bei „smart" bedeutungslos – dort wird sie im UI gar nicht erst angeboten. */
export type SortDir = "asc" | "desc";
/** Verknüpfungs-Modus einer Auswahl-Facette: irgendeines (ODER) / alle (UND) / keines (NICHT).
 *  „all" ist nur bei mehrwertigen Facetten (Labels) sinnvoll – ein Task hat genau EIN Projekt/
 *  EINE Priorität, dort gibt es nur any/none. */
export type MatchMode = "any" | "all" | "none";

export interface FilterCriteria {
  range: FilterRange;      // Zeitraum-Facette (Default „any" = alle)
  // Jede Auswahl-Facette führt ihre Werte pro Marker getrennt: ✓ (irgendeines/ODER),
  // + (alle/UND, nur bei mehrwertigen Labels sinnvoll), − (keines/NICHT).
  priorities: Priority[];  prioritiesNot: Priority[];              // ✓ / −
  labels: string[];        labelsAll: string[]; labelsNot: string[];  // ✓ / + / −
  projects: string[];      projectsNot: string[];                 // ✓ / −  (Basenamen)
  search: string;          // Freitext im Titel ("" = keiner)
}

export interface ViewOptions {
  layout: PageLayout;      // Liste, Kanban-Board oder Kalender
  sort: FilterSort;
  group: FilterGroup;
  showDone: boolean;       // erledigte Aufgaben mit einbeziehen
  sortDir: SortDir;        // Richtung von Sortierung + Gruppen-Reihenfolge
  calMode: CalMode;        // nur im Kalender-Layout: Jahr/Monat/Woche/Tag
  calPanel: boolean;       // nur im Kalender-Layout: Seitenleiste „Undatiert" offen?
}

export const DEFAULT_CRITERIA: FilterCriteria = {
  range: "any",
  priorities: [], prioritiesNot: [],
  labels: [], labelsAll: [], labelsNot: [],
  projects: [], projectsNot: [],
  search: "",
};
export const DEFAULT_OPTIONS: ViewOptions = { layout: "list", sort: "smart", group: "none", showDone: false, sortDir: "asc", calMode: "month", calPanel: true };

/** Im UI wählbare Zeiträume/Sortierungen/Gruppierungen (Reihenfolge = Anzeige). */
export const RANGES: FilterRange[] = ["any", "overdue", "today", "next7", "nodate"];
export const SORTS: FilterSort[] = ["smart", "due", "deadline", "priority", "created", "title"];
export const GROUPS: FilterGroup[] = ["none", "date", "deadline", "priority", "label", "project"];
export const SORT_DIRS: SortDir[] = ["asc", "desc"];
/** „smart" ist eine Semantik (datiert zuerst, Datumlose ans Ende), keine Ordnung – rückwärts
 *  ergibt sie keinen Sinn. Deshalb kennt sie keine Richtung. */
export const hasSortDir = (sort: FilterSort): boolean => sort !== "smart";
export const LAYOUTS: PageLayout[] = ["list", "board", "calendar"];
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
  if (c.priorities.length || c.prioritiesNot.length) n++;
  if (c.labels.length || c.labelsAll.length || c.labelsNot.length) n++;
  if (c.projects.length || c.projectsNot.length) n++;
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

/** Reine Prädikat-Auswertung einer Aufgabe gegen die Kriterien. Je Facette:
 *  ✓ (irgendeines muss zutreffen) UND + (alle müssen zutreffen) UND − (keines darf zutreffen). */
export function matchesTask(t: Task, c: FilterCriteria, today: string): boolean {
  if (!inRange(t, c.range, today)) return false;
  // Prioritäten (einwertig): ✓ irgendeine / − keine
  if (c.priorities.length && !c.priorities.includes(t.priority)) return false;
  if (c.prioritiesNot.includes(t.priority)) return false;
  // Labels (mehrwertig): ✓ irgendeines / + alle / − keines
  if (c.labels.length && !c.labels.some((l) => t.labels.includes(l))) return false;
  if (!c.labelsAll.every((l) => t.labels.includes(l))) return false;
  if (c.labelsNot.some((l) => t.labels.includes(l))) return false;
  // Projekte (einwertig, Basename): ✓ irgendeines / − keines. „Eingang" = nicht einsortiert
  // (kein Projekt ODER Inbox-Verweis) und matcht einen Inbox-Eintrag der Filterliste.
  const inbox = isInboxLink(t.project);
  const pb = inbox ? null : baseName(t.project!);
  const inList = (list: string[]): boolean => inbox ? list.some(isInboxName) : (pb !== null && list.includes(pb));
  if (c.projects.length && !inList(c.projects)) return false;
  if (inList(c.projectsNot)) return false;
  // Suche
  const q = c.search.trim().toLowerCase();
  if (q && !t.title.toLowerCase().includes(q)) return false;
  return true;
}

/**
 * Sortierung nach Modus und Richtung. „smart" = datiert zuerst, Datumlose ans Ende, Gleichstand
 * nach Priorität (kennt keine Richtung, s. hasSortDir).
 *
 * WICHTIG – Aufgaben OHNE den Sortierschlüssel (kein Datum, keine Deadline) landen in BEIDEN
 * Richtungen am Ende. Früher erledigte das ein Platzhalter-Datum ("9999-99-99"); der funktioniert
 * nur aufsteigend – umgedreht wären alle undatierten Aufgaben nach oben gerutscht. Die Trennung
 * „hat einen Wert?" vor dem eigentlichen Vergleich ist deshalb keine Kosmetik, sondern die
 * Voraussetzung dafür, dass „absteigend" überhaupt brauchbar ist.
 */
export function sortTasks(list: Task[], sort: FilterSort, dir: SortDir = "asc"): Task[] {
  const arr = [...list];
  const s = dir === "desc" ? -1 : 1;
  /**
   * Sortierschlüssel eines Datumsfelds: Datum PLUS Uhrzeit. Der Index legt beides getrennt ab
   * (taskIndex.ts schneidet die Uhrzeit vom Datum ab) – ohne die Uhrzeit wären zwei Aufgaben am
   * selben Tag gleichwertig und ihre Reihenfolge fiele dem Titel-Tiebreaker zu.
   * Aufgaben ohne Uhrzeit stehen am Tagesende ("99:99"), wie im Kalender (sortDay).
   */
  const key = (date: string | null, time: string | null): string | null => date && date + "T" + (time ?? "99:99");
  /** Fehlender Wert immer ans Ende (richtungsunabhängig); sonst Vergleich mit Vorzeichen. */
  const byDate = (a: string | null, b: string | null): number => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return s * a.localeCompare(b);
  };
  const byDue = (a: Task, b: Task): number => byDate(key(a.due, a.dueTime), key(b.due, b.dueTime));
  const byPrio = (a: Task, b: Task): number => s * (PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
  const byTitle = (a: Task, b: Task): number => a.title.localeCompare(b.title);   // Gleichstand: stabil, ohne Richtung

  if (sort === "due") return arr.sort((a, b) => byDue(a, b) || byTitle(a, b));
  if (sort === "deadline") return arr.sort((a, b) => byDate(key(a.scheduled, a.scheduledTime), key(b.scheduled, b.scheduledTime)) || byPrio(a, b));
  if (sort === "priority") return arr.sort((a, b) => byPrio(a, b) || byDue(a, b));
  // „Aufsteigend" = ältestes zuerst. (Vorher war Erstellt fest auf „neueste zuerst" – das ist
  // jetzt „absteigend" und damit wählbar statt eingebaut.)
  if (sort === "created") return arr.sort((a, b) => s * (a.created ?? "").localeCompare(b.created ?? ""));
  if (sort === "title") return arr.sort((a, b) => s * byTitle(a, b));
  // „smart" ist richtungsfrei – hier NICHT byDue/byPrio verwenden, die tragen bereits das
  // Vorzeichen. Sonst würde eine gespeicherte Richtung die Semantik doch noch umdrehen.
  const dueAsc = (a: Task, b: Task): number => {
    const ka = key(a.due, a.dueTime), kb = key(b.due, b.dueTime);
    if (!ka && !kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return ka.localeCompare(kb);
  };
  return arr.sort((a, b) => dueAsc(a, b) || (PRIO_RANK[a.priority] - PRIO_RANK[b.priority]));
}

/** Basis-Menge → Facetten-Filter → Sortierung. Basis ist `open()` (ohne archivierte/
 *  erledigte); mit showDone kommen erledigte hinzu. Nav-Zähler UND Board nutzen dies. */
export function applyFilter(idx: TaskIndex, c: FilterCriteria, opts: ViewOptions, today: string): Task[] {
  const base = opts.showDone ? [...idx.open(), ...idx.done()] : idx.open();
  return sortTasks(base.filter((t) => matchesTask(t, c, today)), opts.sort, opts.sortDir);
}
