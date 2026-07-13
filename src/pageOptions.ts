import { App, TFile } from "obsidian";
import {
  ViewOptions, PageLayout, FilterSort, FilterGroup,
  SORTS, GROUPS, LAYOUTS, DEFAULT_OPTIONS,
} from "./filterEngine";
import { CalMode, CAL_MODES } from "./calendarModel";

// Gemeinsames Lesen/Schreiben der Anzeige-Optionen (Layout/Sortieren/Gruppieren/Erledigte).
// Notiz-Seiten (Projekte, Bereiche, Filter) speichern sie im Frontmatter (obsidian-nativ,
// rename-sicher). System-Views/Labels speichern in den Settings – das macht main.ts.

const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

/** Frontmatter/Settings-Objekt -> vollständige ViewOptions (fehlende Felder = Default). */
export function readViewOptions(fm: Record<string, unknown> | Partial<ViewOptions> | undefined): ViewOptions {
  const o = (fm ?? {}) as Record<string, unknown>;
  return {
    layout: oneOf<PageLayout>(o.layout, LAYOUTS, DEFAULT_OPTIONS.layout),
    sort: oneOf<FilterSort>(o.sort, SORTS, DEFAULT_OPTIONS.sort),
    group: oneOf<FilterGroup>(o.group, GROUPS, DEFAULT_OPTIONS.group),
    showDone: o.showDone === true,
    calMode: oneOf<CalMode>(o.calMode, CAL_MODES, DEFAULT_OPTIONS.calMode),
  };
}

/** Optionen ins Frontmatter schreiben – Default-Werte werden entfernt (schlanke Notiz). */
export function writeViewOptions(fm: Record<string, unknown>, o: ViewOptions): void {
  const setOrDel = (k: string, v: unknown, def: unknown): void => { if (v === def) delete fm[k]; else fm[k] = v; };
  setOrDel("layout", o.layout, DEFAULT_OPTIONS.layout);
  setOrDel("sort", o.sort, DEFAULT_OPTIONS.sort);
  setOrDel("group", o.group, DEFAULT_OPTIONS.group);
  setOrDel("showDone", o.showDone, false);
  setOrDel("calMode", o.calMode, DEFAULT_OPTIONS.calMode);
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
