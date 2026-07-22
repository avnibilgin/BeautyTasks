import { Task, Priority } from "./types";
import { TaskIndex } from "./taskIndex";
import { isInboxLink, isInboxName } from "./taskService";
import { t, projectDisplayName } from "./i18n";
import { groupLabel } from "./format";

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
/** Sortierrichtung. Gilt für die Aufgaben UND die Reihenfolge der Gruppen (eine Entscheidung).
 *  Bei „smart" bedeutungslos – dort wird sie im UI gar nicht erst angeboten. */
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
  showSubtasks: boolean;   // Unteraufgaben in der Liste verschachtelt zeigen (aus = Fortschritts-Badge am Parent)
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
export const DEFAULT_OPTIONS: ViewOptions = { layout: "list", sort: "smart", group: "none", showDone: false, showSubtasks: false, sortDir: "asc", calMode: "month", calPanel: true };

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
  if (range === "today") return t.due <= today;             // überfällig + heute
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
  //
  // Der Titel-Tiebreaker ist hier NICHT Kosmetik: `created` war lange ein reines Datum ohne
  // Uhrzeit (taskService.todayIso), Altbestände sind es weiterhin. Ohne ihn sind alle am selben
  // Tag angelegten Aufgaben gleichwertig, die stabile Sortierung lässt sie in Indexreihenfolge
  // stehen – und „aufsteigend"/„absteigend" sehen für den ganzen Block identisch aus. Neue
  // Aufgaben tragen einen vollen Zeitstempel; gemischt verglichen wird trotzdem richtig, weil
  // "2026-07-21" lexikografisch vor "2026-07-21T..." liegt (Datum-only = früher am selben Tag).
  if (sort === "created") return arr.sort((a, b) => s * (a.created ?? "").localeCompare(b.created ?? "") || byTitle(a, b));
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

/**
 * Die Zeilen, die eine Liste WIRKLICH als eigene Zeile zeichnet (Variante A): Unteraufgaben,
 * deren Parent in derselben Ansicht vorkommt (`present`), erscheinen verschachtelt unter ihm.
 * Fehlt der Parent dort, steht die Unteraufgabe eigenständig da – statt zu verschwinden.
 * Ohne `present` (Papierkorb/Wiederkehrend/Erledigt): altes Verhalten, nur verschachtelt.
 *
 * Eigene Funktion, weil ZWEI Stellen dieselbe Regel brauchen: die Sektion beim Zeichnen – und
 * jeder Aufrufer, der vorher entscheidet, OB die Sektion überhaupt kommt. Liefen die auseinander,
 * stünde dort ein Kopf mit „· 0" und nichts darunter. Genau das war der Fall bei „Kein Datum":
 * undatierte Unteraufgaben datierter Aufgaben landen alle in dieser einen Gruppe, gezeichnet
 * werden sie aber unter ihrem Parent.
 */
export function visibleRows(tasks: Task[], present?: Set<string>): Task[] {
  return tasks.filter((x) => !x.parent || (present !== undefined && !present.has(x.parent)));
}

export interface TaskGroup { title: string; tasks: Task[]; }

/**
 * Aufgaben in Abschnitte gruppieren. Die Reihenfolge INNERHALB einer Gruppe bringt bereits
 * sortTasks() mit (inkl. Richtung).
 *
 * DATUM/DEADLINE: eine Gruppe pro Tag („22. Jul · Mittwoch"), wie in „Demnächst". Vorher lag
 * alles ab morgen in EINEM Sammel-Eimer – auf einer Liste, die über Wochen streut, sah die
 * Gruppierung damit aus, als täte sie nichts. Zwei Ränder bleiben bewusst Sammel-Gruppen:
 *   • „Überfällig" – ein Block, nicht pro Tag. Das ist ein Alarmzustand, kein Punkt auf der
 *     Skala; außerdem hängt das Sammel-„Verschieben" der Heute-Ansicht an dieser EINEN Gruppe.
 *   • „Kein Datum" – die Abwesenheit eines Werts, immer ganz ans Ende (wie in sortTasks).
 *
 * RICHTUNG: nur die Tages-Gruppen sind eine Skala und drehen mit der Richtung. „Überfällig"
 * bleibt dabei oben angepinnt – Überfälliges ans Listenende zu schieben wäre eine schlechte
 * Voreinstellung, auch wenn es „streng nach Skala" dorthin gehörte. Priorität/Label/Projekt
 * sind Semantik bzw. Alphabet: deren Gruppen-Reihenfolge bleibt richtungsunabhängig fest.
 *
 * `order` ist bewusst das PAAR aus Sortierung UND Richtung, nicht die Richtung allein: ob eine
 * Richtung überhaupt gilt, hängt am Sortiermodus (bei „smart" gibt es keine, s. hasSortDir).
 * Nahm die Funktion nur die Richtung entgegen, gehorchte sie einer gespeicherten „absteigend",
 * die im Panel längst ausgeblendet war – die Tage standen rückwärts, obwohl „smart" gewählt war.
 * ViewOptions erfüllt die Form direkt, Aufrufer reichen einfach ihre Optionen durch.
 */
export function groupTasks(tasks: Task[], group: FilterGroup, today: string,
  order?: { sort: FilterSort; sortDir: SortDir }): TaskGroup[] {
  if (group === "none") return [{ title: t("sec_tasks"), tasks }];
  // pin: -1 = immer zuoberst · +1 = immer zuunterst · 0 = folgt `order`
  const buckets = new Map<string, { pin: number; order: number; title: string; tasks: Task[] }>();
  const push = (key: string, title: string, order: number, pin: number, tk: Task): void => {
    let b = buckets.get(key);
    if (!b) { b = { pin, order, title, tasks: [] }; buckets.set(key, b); }
    b.tasks.push(tk);
  };
  const prioKey = (p: string): string => p === "highest" ? "prio_1" : p === "high" ? "prio_2" : p === "medium" ? "prio_3" : "prio_4";
  const prioOrder = (p: string): number => p === "highest" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3;
  for (const tk of tasks) {
    if (group === "date" || group === "deadline") {
      const d = group === "date" ? tk.due : tk.scheduled;   // „Datum" = due, „Deadline" = scheduled
      if (!d) push("nodate", t("sec_no_date"), 0, 1, tk);
      else if (d < today) push("overdue", t("sec_overdue"), 0, -1, tk);
      // Ein Tag = eine Gruppe. Sortierschlüssel ist das Datum selbst (20260722): so stehen die
      // Gruppen ohne Zusatzwissen chronologisch und lassen sich mit `dir` sauber umdrehen.
      else push("d:" + d, groupLabel(d, today), Number(d.replace(/-/g, "")), 0, tk);
    } else if (group === "priority") {
      const k = prioKey(tk.priority);
      push(k, t(k), prioOrder(tk.priority), 0, tk);
    } else if (group === "label") {
      if (tk.labels.length) push("l:" + tk.labels[0], "#" + tk.labels[0], 1, 0, tk);
      else push("nolabel", t("no_label"), 0, 1, tk);
    } else {   // project – „nicht einsortiert" (kein Projekt ODER Inbox-Verweis) in EINEN Eingang-Bucket
      if (tk.project && !isInboxLink(tk.project)) { const nm = baseName(tk.project); push("p:" + nm, "@" + projectDisplayName(nm), 1, 0, tk); }
      else push("noproject", t("nav_inbox"), 0, 1, tk);
    }
  }
  // Absteigend nur, wenn die gewählte Sortierung überhaupt eine Richtung kennt – dieselbe
  // Bedingung, unter der das Panel die Richtungs-Zeile zeigt (hasSortDir).
  const desc = !!order && hasSortDir(order.sort) && order.sortDir === "desc";
  const s = (group === "date" || group === "deadline") && desc ? -1 : 1;
  return [...buckets.values()]
    .sort((a, b) => a.pin - b.pin || s * (a.order - b.order) || a.title.localeCompare(b.title))
    .map((b) => ({ title: b.title, tasks: b.tasks }));
}

/** Basis-Menge → Facetten-Filter → Sortierung. Basis ist `open()` (ohne archivierte/
 *  erledigte); mit showDone kommen erledigte hinzu. Nav-Zähler UND Board nutzen dies. */
export function applyFilter(idx: TaskIndex, c: FilterCriteria, opts: ViewOptions, today: string): Task[] {
  const base = opts.showDone ? [...idx.open(), ...idx.done()] : idx.open();
  return sortTasks(base.filter((t) => matchesTask(t, c, today)), opts.sort, opts.sortDir);
}
