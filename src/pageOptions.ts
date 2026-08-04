import { App, TFile } from "obsidian";
import { Priority } from "./types";
import {
  ViewOptions, PageLayout, FilterSort, FilterGroup, SortDir, SubtaskDisplay, FilterCriteria, FilterRange, SubtaskFilter,
  SORTS, GROUPS, LAYOUTS, SORT_DIRS, ALL_SUBTASK_DISPLAYS, DEFAULT_OPTIONS,
  RANGES, FILTER_PRIORITIES, SUBTASK_FILTERS, DEFAULT_CRITERIA,
} from "./filterEngine";
import { isKnownStatus } from "./statuses";
import { CalMode, CAL_MODES } from "./calendarModel";

// Gemeinsames Lesen/Schreiben der Anzeige-Optionen (Layout/Sortieren/Gruppieren/Erledigte).
// Notiz-Seiten (Projekte, Bereiche, Filter) speichern sie im Frontmatter (obsidian-nativ,
// rename-sicher). System-Views/Labels speichern in den Settings – das macht main.ts.
//
// Dasselbe gilt für die KRITERIEN: Ein gespeicherter Filter schreibt sie flach ins Frontmatter
// seiner Notiz (dort SIND sie die Notiz), eine gewöhnliche Seite trägt ihren Ansichtsfilter
// unter EINEM Schlüssel (s. readPageCriteria). Beide benutzen dieselbe Serialisierung.

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

/**
 * Unteraufgaben-Darstellung lesen – mit Rückfall auf den alten Boolean `showSubtasks`.
 * Bis 1.20.3 gab es nur „verschachtelt ja/nein"; wer damals eingeschaltet hatte, meinte das,
 * was heute „indented" heißt. Deshalb wird der alte Wert übersetzt statt ignoriert – sonst
 * spränge die Ansicht beim Update wortlos zurück.
 *
 * `undefined` = nie gewählt. Bewusst NICHT hier auf einen Wert auflösen: die Vorgabe hängt am
 * Layout (s. effectiveSubtasks), und ein früh gesetzter Wert würde von setPageOption
 * dauerhaft festgeschrieben. `showSubtasks: false` war der damalige Standard und zählt deshalb
 * ebenfalls als „nie gewählt" – im Board bedeutete er ohnehin nichts.
 *
 * Validiert gegen ALLE je gespeicherten Werte (inkl. „standalone"): was ein Layout nicht
 * anbietet, bildet erst effectiveSubtasks ab – wegwerfen würde die Board-Wahl zerstören.
 */
function readSubtasks(o: Record<string, unknown>): SubtaskDisplay | undefined {
  if (typeof o.subtasks === "string" && (ALL_SUBTASK_DISPLAYS as readonly string[]).includes(o.subtasks)) return o.subtasks as SubtaskDisplay;
  return o.showSubtasks === true ? "indented" : undefined;
}

/** Frontmatter/Settings-Objekt -> vollständige ViewOptions (fehlende Felder = Default). */
export function readViewOptions(fm: Record<string, unknown> | Partial<ViewOptions> | undefined): ViewOptions {
  const o = (fm ?? {}) as Record<string, unknown>;
  return {
    layout: oneOf<PageLayout>(o.layout, LAYOUTS, DEFAULT_OPTIONS.layout),
    sort: oneOf<FilterSort>(o.sort, SORTS, DEFAULT_OPTIONS.sort),
    group: oneOf<FilterGroup>(o.group, GROUPS, DEFAULT_OPTIONS.group),
    showDone: o.showDone === true,
    subtasks: readSubtasks(o),
    sortDir: oneOf<SortDir>(o.sortDir, SORT_DIRS, DEFAULT_OPTIONS.sortDir),
    calMode: oneOf<CalMode>(o.calMode, CAL_MODES, DEFAULT_OPTIONS.calMode),
    calPanel: o.calPanel !== false,   // Default: offen
  };
}

/** Optionen ins Frontmatter schreiben – Default-Werte werden entfernt (schlanke Notiz). */
export function writeViewOptions(fm: Record<string, unknown>, o: ViewOptions): void {
  const setOrDel = (k: string, v: unknown, def: unknown): void => { if (v === def) delete fm[k]; else fm[k] = v; };
  setOrDel("layout", o.layout, DEFAULT_OPTIONS.layout);
  setOrDel("sort", o.sort, DEFAULT_OPTIONS.sort);
  setOrDel("group", o.group, DEFAULT_OPTIONS.group);
  setOrDel("showDone", o.showDone, false);
  setOrDel("subtasks", o.subtasks, undefined);   // nie gewählt -> Schlüssel raus
  delete fm.showSubtasks;   // abgelöst durch `subtasks` – beim nächsten Schreiben aus der Notiz nehmen
  setOrDel("sortDir", o.sortDir, DEFAULT_OPTIONS.sortDir);
  setOrDel("calMode", o.calMode, DEFAULT_OPTIONS.calMode);
  setOrDel("calPanel", o.calPanel, DEFAULT_OPTIONS.calPanel);
}

// ── Kriterien (Ansichtsfilter bzw. Definition eines gespeicherten Filters) ──

const asStrArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);

/** Kriterien aus einem Datensatz lesen (Frontmatter einer Filternotiz, Unterobjekt einer Seite
 *  oder Settings-Eintrag). Alles wird gegen die erlaubten Werte geprüft – fremder Input. */
export function readCriteria(rec: Record<string, unknown> | undefined): FilterCriteria {
  const fm = rec ?? {};
  const prio = (v: unknown): Priority[] =>
    asStrArr(v).filter((p): p is Priority => (FILTER_PRIORITIES as string[]).includes(p));
  return {
    range: oneOf<FilterRange>(fm.range, RANGES, DEFAULT_CRITERIA.range),
    deadlineRange: oneOf<FilterRange>(fm.deadline_range, RANGES, DEFAULT_CRITERIA.deadlineRange),
    statuses: asStrArr(fm.statuses).filter(isKnownStatus), statusesNot: asStrArr(fm.statuses_not).filter(isKnownStatus),
    priorities: prio(fm.priorities), prioritiesNot: prio(fm.priorities_not),
    labels: asStrArr(fm.labels), labelsAll: asStrArr(fm.labels_all), labelsNot: asStrArr(fm.labels_not),
    projects: asStrArr(fm.projects), projectsNot: asStrArr(fm.projects_not),
    subtaskMode: oneOf<SubtaskFilter>(fm.subtask_mode, SUBTASK_FILTERS, DEFAULT_CRITERIA.subtaskMode),
    search: typeof fm.search === "string" ? fm.search : "",
  };
}

/** Kriterien in einen Datensatz schreiben – Standardwerte werden entfernt (schlanke Notiz). */
export function writeCriteria(rec: Record<string, unknown>, c: FilterCriteria): void {
  const setOrDel = (k: string, v: unknown): void => { if (v == null) delete rec[k]; else rec[k] = v; };
  setOrDel("range", c.range === "any" ? null : c.range);
  setOrDel("deadline_range", c.deadlineRange === "any" ? null : c.deadlineRange);
  setOrDel("statuses", c.statuses.length ? c.statuses : null);
  setOrDel("statuses_not", c.statusesNot.length ? c.statusesNot : null);
  setOrDel("priorities", c.priorities.length ? c.priorities : null);
  setOrDel("priorities_not", c.prioritiesNot.length ? c.prioritiesNot : null);
  setOrDel("labels", c.labels.length ? c.labels : null);
  setOrDel("labels_all", c.labelsAll.length ? c.labelsAll : null);
  setOrDel("labels_not", c.labelsNot.length ? c.labelsNot : null);
  setOrDel("projects", c.projects.length ? c.projects : null);
  setOrDel("projects_not", c.projectsNot.length ? c.projectsNot : null);
  setOrDel("subtask_mode", c.subtaskMode === "any" ? null : c.subtaskMode);
  setOrDel("search", c.search.trim() || null);
}

/**
 * Frontmatter-Schlüssel des ANSICHTSFILTERS einer gewöhnlichen Seite (Projekt/Bereich).
 *
 * Bewusst EIN verschachtelter Schlüssel statt dreizehn flacher: Eine Filternotiz IST ihre
 * Kriterien, dort gehören `labels:`/`projects:` an die Oberfläche. Eine Projektnotiz gehört dem
 * Nutzer – dieselben Namen dort verstreut wären dreizehn Fremdfelder mitten in seinen eigenen,
 * und `labels:`/`projects:` in einer Projektnotiz kollidiert mit dem, was Leser dort erwarten.
 */
const CRIT_KEY = "view_filter";

/** Ansichtsfilter einer Seite aus ihrem Frontmatter/Settings-Eintrag. */
export function readPageCriteria(fm: Record<string, unknown> | undefined): FilterCriteria {
  const raw = fm?.[CRIT_KEY];
  return readCriteria(raw && typeof raw === "object" && !Array.isArray(raw) ? raw as Record<string, unknown> : {});
}

/** Ansichtsfilter schreiben – ohne Kriterien fällt der Schlüssel ganz weg. */
export function writePageCriteria(fm: Record<string, unknown>, c: FilterCriteria): void {
  const sub: Record<string, unknown> = {};
  writeCriteria(sub, c);
  if (Object.keys(sub).length) fm[CRIT_KEY] = sub; else delete fm[CRIT_KEY];
}

/** Notiz-Seite (Projekt/Bereich): Ansichtsfilter aus dem Frontmatter. */
export function readNoteCriteria(app: App, path: string): FilterCriteria {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return { ...DEFAULT_CRITERIA };
  return readPageCriteria(app.metadataCache.getFileCache(f)?.frontmatter);
}

/** Ansichtsfilter einer Notiz-Seite ändern (merge + Frontmatter schreiben). */
export async function setNoteCriteria(app: App, path: string, patch: Partial<FilterCriteria>): Promise<void> {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
    writePageCriteria(fm, { ...readPageCriteria(fm), ...patch });
  });
}

/** Notiz-Seite (Projekt/Bereich): Anzeige-Optionen aus dem Frontmatter. */
export function readNoteViewOptions(app: App, path: string): ViewOptions {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return { ...DEFAULT_OPTIONS };
  return readViewOptions(app.metadataCache.getFileCache(f)?.frontmatter);
}

/** Eine oder mehrere Optionen einer Notiz-Seite setzen (merge + Frontmatter schreiben). */
export async function setNoteViewOption(app: App, path: string, patch: Partial<ViewOptions>): Promise<void> {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
    writeViewOptions(fm, { ...readViewOptions(fm), ...patch });
  });
}
