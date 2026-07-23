import { Task, Priority } from "./types";
// Nur als Typ: taskIndex holt sich umgekehrt orderChain von hier. Ein `import type` wird beim
// Kompilieren entfernt und schließt den Zyklus, bevor er zur Laufzeit einer wird.
import type { TaskIndex } from "./taskIndex";
import { isInboxLink, isInboxName } from "./taskService";
import { t, projectDisplayName } from "./i18n";
import { groupLabel } from "./format";
import { isDone } from "./statuses";   // statuses importiert nur types+i18n -> kein Zyklus

// ── Kriterien & Optionen ────────────────────────────────────────────
// Ein flaches Kriterien-Objekt (Vorschlag 3 „Smart Lists"): verschiedene Facetten sind
// implizit UND-verknüpft, mehrere Werte innerhalb einer Facette ODER. Keine Bool-Algebra
// im UI. Die Engine ist bewusst rein (nur Task-Daten), damit später ein Query-Modus
// (Vorschlag 1) dieselbe Auswertung wiederverwenden kann.

import { CalMode } from "./calendarModel";
export type { CalMode };

export type FilterRange = "any" | "today" | "overdue" | "next7" | "nodate";
export type FilterSort = "smart" | "manual" | "due" | "deadline" | "priority" | "created" | "title";
export type FilterGroup = "none" | "date" | "deadline" | "priority" | "label" | "project";
export type PageLayout = "list" | "board" | "calendar";
/** Sortierrichtung. Gilt für die Aufgaben UND die Reihenfolge der Gruppen (eine Entscheidung).
 *  Bei „smart" bedeutungslos – dort wird sie im UI gar nicht erst angeboten. */
export type SortDir = "asc" | "desc";
/**
 * Wie Unteraufgaben in der Liste erscheinen – die drei Antworten auf EINE Frage: wie eng hängt
 * eine Unteraufgabe an ihrer Hauptaufgabe?
 *   compact    – zusammengefasst AN ihr (Fortschritts-Badge „2/3", per Klick aufklappbar)
 *   indented   – sichtbar UNTER ihr (eingerückt)
 *   standalone – UNABHÄNGIG von ihr: eigene Zeile, eigene Gruppe, eigene Position in der Sortierung
 *
 * Der dritte Zustand ist die ausdrückliche Nutzer-Entscheidung in einem Konflikt, den die Liste
 * sonst raten müsste: Gruppieren/Sortieren ordnet nach Attributen, Verschachteln nach Herkunft.
 * Trägt eine Unteraufgabe eigene Labels oder ein eigenes Datum, widersprechen sich beide – dann
 * bestimmt dieser Schalter, welche Ordnung gewinnt, statt dass wir es festlegen.
 */
export type SubtaskDisplay = "compact" | "indented" | "standalone";
/** Verknüpfungs-Modus einer Auswahl-Facette: irgendeines (ODER) / alle (UND) / keines (NICHT).
 *  „all" ist nur bei mehrwertigen Facetten (Labels) sinnvoll – ein Task hat genau EIN Projekt/
 *  EINE Priorität, dort gibt es nur any/none. */
export type MatchMode = "any" | "all" | "none";
/** Unteraufgaben in einem Filter: alle · nur Unteraufgaben · nur Hauptaufgaben.
 *  Entspricht dem, was Todoist mit den Operatoren subtask / !subtask anbietet. */
export type SubtaskFilter = "any" | "only" | "none";

export interface FilterCriteria {
  range: FilterRange;         // Zeitraum der Faelligkeit (Default „any" = alle)
  deadlineRange: FilterRange; // Zeitraum der Deadline – dieselben Stufen, eigenes Feld
  // Jede Auswahl-Facette führt ihre Werte pro Marker getrennt: ✓ (irgendeines/ODER),
  // + (alle/UND, nur bei mehrwertigen Labels sinnvoll), − (keines/NICHT).
  statuses: string[];      statusesNot: string[];                  // ✓ / −  (Status-Ids)
  priorities: Priority[];  prioritiesNot: Priority[];              // ✓ / −
  labels: string[];        labelsAll: string[]; labelsNot: string[];  // ✓ / + / −
  projects: string[];      projectsNot: string[];                 // ✓ / −  (Basenamen)
  subtaskMode: SubtaskFilter; // Unteraufgaben einbeziehen / nur sie / keine
  search: string;          // Freitext in Titel und Beschreibung ("" = keiner)
}

export interface ViewOptions {
  layout: PageLayout;      // Liste, Kanban-Board oder Kalender
  sort: FilterSort;
  group: FilterGroup;
  showDone: boolean;       // erledigte Aufgaben mit einbeziehen
  /** Wie Unteraufgaben erscheinen. `undefined` = NIE GEWÄHLT und damit etwas anderes als jeder
   *  konkrete Wert: die Vorgabe hängt am Layout (s. effectiveSubtasks) und darf deshalb nicht
   *  vorzeitig auf einen Wert festgelegt werden. */
  subtasks?: SubtaskDisplay;
  sortDir: SortDir;        // Richtung von Sortierung + Gruppen-Reihenfolge
  calMode: CalMode;        // nur im Kalender-Layout: Jahr/Monat/Woche/Tag
  calPanel: boolean;       // nur im Kalender-Layout: Seitenleiste „Undatiert" offen?
}

export const DEFAULT_CRITERIA: FilterCriteria = {
  range: "any", deadlineRange: "any",
  statuses: [], statusesNot: [],
  priorities: [], prioritiesNot: [],
  labels: [], labelsAll: [], labelsNot: [],
  projects: [], projectsNot: [],
  subtaskMode: "any",
  search: "",
};
// `subtasks` fehlt bewusst: „nie gewählt" IST der Standard, und was daraus folgt, entscheidet
// erst das Layout (effectiveSubtasks).
export const DEFAULT_OPTIONS: ViewOptions = { layout: "list", sort: "smart", group: "none", showDone: false, sortDir: "asc", calMode: "month", calPanel: true };

/** Im UI wählbare Zeiträume/Sortierungen/Gruppierungen (Reihenfolge = Anzeige). */
export const RANGES: FilterRange[] = ["any", "overdue", "today", "next7", "nodate"];
export const SUBTASK_FILTERS: SubtaskFilter[] = ["any", "none", "only"];
// „manual" steht neben „smart": beides sind Ordnungen ohne Feldvergleich, danach die Feld-Sortierungen.
export const SORTS: FilterSort[] = ["smart", "manual", "due", "deadline", "priority", "created", "title"];
export const GROUPS: FilterGroup[] = ["none", "date", "deadline", "priority", "label", "project"];
export const SORT_DIRS: SortDir[] = ["asc", "desc"];
/** Reihenfolge im Dropdown = zunehmende Eigenständigkeit der Unteraufgabe. */
export const SUBTASK_DISPLAYS: SubtaskDisplay[] = ["compact", "indented", "standalone"];
/** Im Board fehlt „Eingerückt": in eine Karte lässt sich keine Karte einrücken. */
export const BOARD_SUBTASK_DISPLAYS: SubtaskDisplay[] = ["compact", "standalone"];
/**
 * Der im Board wirksame Modus. „Eingerückt" fällt auf „Einzeln" zurück – sichtbar bleiben die
 * Unteraufgaben in beiden Fällen, nur eben als eigene Karten. Nicht destruktiv: der gespeicherte
 * Wert bleibt „indented" und wirkt in der Liste weiter.
 *
 * Muss die EINE Abbildung sein, die Panel und Board benutzen. Liefen sie auseinander, böte das
 * Panel „Einzeln" an, während das Board nach „Kompakt"-Regeln filtert – die Unteraufgaben wären
 * dann weder Karte noch Badge, also verschwunden.
 */
export const boardSubtasks = (m: SubtaskDisplay): SubtaskDisplay => (m === "compact" ? "compact" : "standalone");

/**
 * Der tatsächlich wirksame Modus – die EINE Stelle, die „nie gewählt" auflöst.
 *
 * Die Vorgabe hängt am Layout, weil beide Flächen vor dieser Einstellung unterschiedlich
 * arbeiteten: die Liste zeigte ein Fortschritts-Badge, das Board immer eigene Karten. Eine
 * gemeinsame Vorgabe würde eine der beiden beim Update stillschweigend umstellen – im Board sogar
 * mit Funktionsverlust, weil sich eine Unteraufgabe ohne Karte nicht mehr in eine andere
 * Status-Spalte ziehen lässt.
 *
 * WICHTIG: erst hier auflösen, nicht schon beim Lesen. setPageViewOption speichert das ganze
 * aufgelöste Objekt; ein vorzeitig gesetzter Wert würde beim Umschalten auf Board mit dem ALTEN
 * Layout aufgelöst und dauerhaft festgeschrieben. Als `undefined` fällt das Feld beim Speichern
 * weg und wird jedes Mal frisch zum aktuellen Layout bestimmt.
 */
export function effectiveSubtasks(o: { layout: PageLayout; subtasks?: SubtaskDisplay }): SubtaskDisplay {
  if (o.layout === "board") return boardSubtasks(o.subtasks ?? "standalone");
  return o.subtasks ?? "compact";
}
/** „smart" ist eine Semantik (datiert zuerst, Datumlose ans Ende), keine Ordnung – rückwärts
 *  ergibt sie keinen Sinn. „manual" ebenso: eine von Hand gelegte Reihenfolge umzudrehen ist
 *  keine Sortierung, sondern verwirft die Handarbeit. Beide kennen deshalb keine Richtung. */
export const hasSortDir = (sort: FilterSort): boolean => sort !== "smart" && sort !== "manual";
export const LAYOUTS: PageLayout[] = ["list", "board", "calendar"];
/** Prioritäten wie im Aufgaben-Picker (4 Stufen). */
export const FILTER_PRIORITIES: Priority[] = ["highest", "high", "medium", "normal"];

const baseName = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");
const PRIO_RANK: Record<Priority, number> = { highest: 0, high: 1, medium: 2, normal: 3, low: 4, lowest: 5 };

/**
 * Positionskette einer Aufgabe von der Wurzel abwärts – der Sortierschlüssel für „Manuell".
 *
 *   Umzug planen      -> [3]
 *     Kartons kaufen  -> [3, 1]
 *   Steuer machen     -> [4]
 *
 * `sortOrder = null` (nie von Hand einsortiert) wird zu +Infinity: solche Aufgaben stehen hinten,
 * damit neu Angelegtes unten landet, ohne dass beim Anlegen etwas geschrieben werden muss.
 *
 * Der Zyklus-Schutz ist kein Zierrat: `parent` ist ein Wikilink in einer Notiz, den man von Hand
 * auf einen Nachfahren zeigen lassen kann. Ohne ihn liefe der Aufstieg endlos.
 *
 * Hier statt im Index, damit Index UND Tests dieselbe Regel benutzen – eine nachgebaute Kette im
 * Test würde genau die Abweichung nicht finden, für die er da ist.
 */
export function orderChain(task: Task, parentOf: (path: string) => Task | undefined): number[] {
  const chain: number[] = [];
  const seen = new Set<string>();
  let cur: Task | undefined = task;
  while (cur && !seen.has(cur.path)) {
    seen.add(cur.path);
    chain.unshift(cur.sortOrder ?? Infinity);
    cur = cur.parent ? parentOf(cur.parent) : undefined;
  }
  return chain;
}

/**
 * Reihenfolge der Unteraufgaben UNTER einer Hauptaufgabe – für die Liste wie für das Modal.
 *
 *   1. Erledigte nach unten
 *   2. danach die Reihenfolge der Geschwister: sort_order, sonst created, sonst Titel
 *
 * Bewusst EINE Funktion für beide Oberflächen: vorher sortierte die Liste gar nicht und das Modal
 * nur nach „erledigt", der Rest war in beiden die Einfügereihenfolge des Index. Die hängt daran,
 * in welcher Folge Obsidian die Dateien gefunden hat, und ist nach einem Neustart eine andere –
 * die Unteraufgaben sprangen also scheinbar willkürlich umher, und Liste und Modal zeigten
 * Verschiedenes.
 *
 * Die Positionskette (orderChain) braucht es hier nicht: Geschwister teilen sich denselben
 * Präfix, es zählt also nur ihr eigener Wert.
 *
 * Erledigte behalten ihre Geschwister-Reihenfolge, statt nach Abschlusszeit zu stehen. Die großen
 * Erledigt-Listen (Sektion, Spalte, Ansicht) tun Letzteres – die sind ein Protokoll, in dem
 * „zuletzt erledigt" zählt. Eine Checkliste unter einer Aufgabe hat drei bis sechs Zeilen; dort
 * ist es nützlicher, dass jede Zeile ihren Platz behält und Aufhaken exakt zurückführt.
 */
export function sortSubtasks(kids: Task[]): Task[] {
  // MAX_SAFE_INTEGER statt Infinity: zwei Aufgaben ohne Position ergäben sonst Infinity-Infinity
  // = NaN, und ein NaN-Vergleich macht die Sortierung unvorhersagbar.
  const pos = (t: Task): number => t.sortOrder ?? Number.MAX_SAFE_INTEGER;
  return [...kids].sort((a, b) =>
    Number(isDone(a.status)) - Number(isDone(b.status))
    || pos(a) - pos(b)
    || (a.created ?? "").localeCompare(b.created ?? "")
    || a.title.localeCompare(b.title));
}

/** Abstand beim Durchnummerieren. Lücken, damit spätere Züge reine Mittelwerte sind. */
export const ORDER_GAP = 10;
/** Ein zu schreibender Positionswert. */
export interface OrderWrite { path: string; order: number; }

/**
 * Plant die Schreibvorgänge für einen Zug: `moved` soll VOR `beforePath` stehen (null = ans Ende).
 * `ordered` sind die Geschwister in ihrer AKTUELLEN Reihenfolge, `moved` eingeschlossen.
 *
 * Normalfall: **eine** Notiz – der neue Wert ist die Mitte zwischen den Nachbarn.
 *
 * Entscheidend sind allein die beiden DIREKTEN Nachbarn an der Zielstelle. Ob sonstwo in der Gruppe
 * eine noch nie einsortierte Aufgabe (`sortOrder == null`) steht, ist egal – die hängt hinten und
 * ist von diesem Zug nicht betroffen. Das ist der Grund, weshalb eine frisch angelegte Aufgabe die
 * Gruppe nicht bei jedem Zug neu durchnummerieren lässt.
 *
 * Ein voller Durchlauf (10, 20, 30 …) bleibt nur für die echten Fälle:
 *   1. Kein Nachbar an der Zielstelle hat eine Zahl – z. B. der allererste Zug einer Gruppe, in der
 *      noch niemand von Hand einsortiert wurde. Dann gibt es keine Mitte zu bilden.
 *   2. Ein direkter Nachbar ist noch ohne Zahl – auch dann fehlt die Grundlage für einen Mittelwert.
 *   3. Die Lücke ist aufgebraucht (Mitte gleich einem Nachbarn – nach ~50 Zügen auf dieselbe
 *      Stelle). Dann wird mit frischen Lücken neu nummeriert.
 *
 * Nur die Spalte zu nummerieren wäre falsch: Geschwister stehen auch in anderen Spalten (anderer
 * Status). Deshalb bekommt der Aufrufer die GANZE Gruppe herein – die Nachbarschaft wird über alle
 * Spalten hinweg bestimmt.
 */
export function planReorder(ordered: Task[], moved: Task, beforePath: string | null): OrderWrite[] {
  const rest = ordered.filter((t) => t.path !== moved.path);
  const found = beforePath ? rest.findIndex((t) => t.path === beforePath) : -1;
  const at = beforePath && found >= 0 ? found : rest.length;
  /** Endgültige Reihenfolge durchnummerieren – gibt ALLE Positionen zurück. */
  const renumber = (): OrderWrite[] => {
    const seq = [...rest.slice(0, at), moved, ...rest.slice(at)];
    return seq.map((t, i) => ({ path: t.path, order: (i + 1) * ORDER_GAP }));
  };

  const hasPrev = at > 0;
  const hasNext = at < rest.length;
  const prev = hasPrev ? rest[at - 1].sortOrder : null;
  const next = hasNext ? rest[at].sortOrder : null;
  // Ein DIREKTER Nachbar ist da, hat aber keine Zahl: kein Mittelwert bildbar -> neu durchnummerieren.
  if ((hasPrev && prev === null) || (hasNext && next === null)) return renumber();
  if (!hasPrev && !hasNext) return [{ path: moved.path, order: ORDER_GAP }];
  if (!hasPrev) return [{ path: moved.path, order: next! / 2 }];
  if (!hasNext) return [{ path: moved.path, order: prev! + ORDER_GAP }];
  const mid = (prev! + next!) / 2;
  if (mid === prev || mid === next) return renumber();   // Lücke erschöpft
  return [{ path: moved.path, order: mid }];
}

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
  if (c.deadlineRange !== "any") n++;
  if (c.statuses.length || c.statusesNot.length) n++;
  if (c.priorities.length || c.prioritiesNot.length) n++;
  if (c.labels.length || c.labelsAll.length || c.labelsNot.length) n++;
  if (c.projects.length || c.projectsNot.length) n++;
  if (c.subtaskMode !== "any") n++;
  if (c.search.trim()) n++;
  return n;
}

/** Zeitraum-Pruefung fuer EIN Datumsfeld. Bewusst ueber den Wert statt ueber die Aufgabe:
 *  dieselbe Regel gilt fuer Faelligkeit (due) und Deadline (scheduled). */
function inRange(date: string | null, range: FilterRange, today: string): boolean {
  if (range === "any") return true;
  if (range === "nodate") return !date;
  if (!date) return false;
  if (range === "overdue") return date < today;
  if (range === "today") return date <= today;             // überfällig + heute
  if (range === "next7") return date >= today && date <= addDays(today, 7);
  return true;
}

/** Reine Prädikat-Auswertung einer Aufgabe gegen die Kriterien. Je Facette:
 *  ✓ (irgendeines muss zutreffen) UND + (alle müssen zutreffen) UND − (keines darf zutreffen). */
export function matchesTask(t: Task, c: FilterCriteria, today: string): boolean {
  if (!inRange(t.due, c.range, today)) return false;
  if (!inRange(t.scheduled, c.deadlineRange, today)) return false;
  // Status (einwertig): ✓ irgendeiner / − keiner
  if (c.statuses.length && !c.statuses.includes(t.status)) return false;
  if (c.statusesNot.includes(t.status)) return false;
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
  // Unteraufgaben: eine Aufgabe MIT parent ist eine Unteraufgabe.
  if (c.subtaskMode === "only" && !t.parent) return false;
  if (c.subtaskMode === "none" && t.parent) return false;
  // Suche: Titel UND Beschreibung. Die Beschreibung steht in der Liste unter dem Titel – ein Wort
  // dort zu sehen, es aber nicht zu finden, wäre die überraschendere Variante.
  const q = c.search.trim().toLowerCase();
  if (q && !t.title.toLowerCase().includes(q) && !t.description.toLowerCase().includes(q)) return false;
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
 *
 * `orderKey` liefert für „manual" die Positionskette einer Aufgabe (TaskIndex.orderKey). Sie
 * hängt an anderen Aufgaben – dem Elter – und kann deshalb nicht aus `list` allein berechnet
 * werden: der Elter muss dort gar nicht vorkommen. Fehlt der Schlüssel, fällt „manual" auf
 * `created` zurück, statt eine unbrauchbare Reihenfolge zu liefern.
 */
export function sortTasks(list: Task[], sort: FilterSort, dir: SortDir = "asc",
  orderKey?: (t: Task) => number[]): Task[] {
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

  // Handreihenfolge: Positionsketten lexikografisch. Eine kürzere Kette gewinnt bei Gleichstand,
  // damit der Elter vor seinen Kindern steht ([3] vor [3,1]). Ohne Schlüssel: Rückfall auf created.
  if (sort === "manual") {
    if (!orderKey) return arr.sort((a, b) => (a.created ?? "").localeCompare(b.created ?? "") || byTitle(a, b));
    const byChain = (a: Task, b: Task): number => {
      const ka = orderKey(a), kb = orderKey(b);
      for (let i = 0; i < Math.max(ka.length, kb.length); i++) {
        const va = ka[i] ?? -Infinity, vb = kb[i] ?? -Infinity;   // fehlende Ebene = weiter oben
        if (va !== vb) return va < vb ? -1 : 1;
      }
      return 0;
    };
    return arr.sort((a, b) => byChain(a, b) || (a.created ?? "").localeCompare(b.created ?? "") || byTitle(a, b));
  }
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
 *
 * LABEL: eine Aufgabe erscheint unter JEDEM ihrer Labels (mehrwertige Facette, s. u.). Die
 * Summe der Gruppen-Zähler ist damit größer als die Aufgabenzahl – im Board ist das seit jeher
 * so, und es ist die ehrlichere Anzeige: „#finance · 1" heißt „ein Treffer", nicht „ein Achtel
 * deiner Aufgaben". `labelOrder` gibt die Gruppen-Reihenfolge vor (s. u.).
 */
export function groupTasks(tasks: Task[], group: FilterGroup, today: string,
  order?: { sort: FilterSort; sortDir: SortDir }, labelOrder?: string[]): TaskGroup[] {
  if (group === "none") return [{ title: t("sec_tasks"), tasks }];
  // Reihenfolge der Label-Gruppen: die der Seitenleiste (Name/Anzahl/manuell), vom Aufrufer
  // fertig gereicht – sie hängt an Plugin-Zustand, den diese Engine bewusst nicht kennt.
  // Ohne Vorgabe bleibt es beim alphabetischen Tiebreaker über den Titel (alle Ränge gleich).
  const labelRank = new Map((labelOrder ?? []).map((n, i) => [n, i] as const));
  const rankOf = (name: string): number => labelRank.get(name) ?? labelRank.size;   // Unbekannte hinter die Bekannten
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
      // Labels sind die EINZIGE mehrwertige Facette (Projekt/Priorität hat eine Aufgabe genau
      // einmal). Sie erscheint deshalb unter JEDEM ihrer Labels – wie die Spalten im Board, die
      // pro Spalte `tk.labels.includes(name)` fragen. Vorher zählte nur labels[0], also die
      // Reihenfolge im Frontmatter: eine Aufgabe mit #urgent #finance fehlte unter #finance
      // stillschweigend, und welches Label „gewinnt", war für den Nutzer nirgends sichtbar.
      // Die Doppelung erklärt sich von selbst – die Zeile zeigt ohnehin alle ihre Labels.
      if (tk.labels.length) for (const name of tk.labels) push("l:" + name, "#" + name, rankOf(name), 0, tk);
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

/**
 * Basis-Menge → Facetten-Filter → Sortierung. Nav-Zähler UND Board nutzen dies.
 *
 * Ohne Status-Kriterium wie bisher: Basis ist `open()` (ohne archivierte, ohne erledigte), mit
 * `showDone` kommen erledigte hinzu. Abgebrochene bleiben draußen, die stehen im Papierkorb.
 *
 * Sind dagegen Status ausdrücklich gewählt, bestimmen SIE die Basis – inklusive erledigter und
 * abgebrochener –, und `showDone` tritt zurück. Sonst käme ein Filter auf „erledigt" auf null
 * Treffer, weil die Aufgaben schon vor den Kriterien aussortiert wären: eine getroffene Wahl
 * schlägt eine Vorgabe (dasselbe Prinzip wie bei der Unteraufgaben-Darstellung). Nebenbei wird so
 * ein Filter auf abgebrochene Aufgaben überhaupt erst möglich.
 */
export function applyFilter(idx: TaskIndex, c: FilterCriteria, opts: ViewOptions, today: string): Task[] {
  const byStatus = c.statuses.length > 0 || c.statusesNot.length > 0;
  const base = byStatus ? idx.unarchived()
    : opts.showDone ? [...idx.open(), ...idx.done()]
      : idx.open();
  return sortTasks(base.filter((t) => matchesTask(t, c, today)), opts.sort, opts.sortDir, (t) => idx.orderKey(t));
}
