import { App, TFile, normalizePath } from "obsidian";
import { BeautyTasksSettings, Priority } from "./types";
import { buildFrontmatter, ensureFolder, newId, todayIso, slugify } from "./taskService";
import {
  FilterCriteria, ViewOptions, FilterRange, FilterSort, FilterGroup,
  DEFAULT_CRITERIA, DEFAULT_OPTIONS, RANGES, SORTS, GROUPS, FILTER_PRIORITIES,
} from "./filterEngine";

/** Ein gespeicherter Filter (`type: filter`-Notiz im Vault). */
export interface FilterItem {
  name: string; path: string; icon: string; color: string | null; hidden: boolean;
  criteria: FilterCriteria; options: ViewOptions;
}

const asStrArr = (v: unknown): string[] => (Array.isArray(v) ? v.map(String) : []);
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T): T =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback;

function readCriteria(fm: Record<string, unknown>): FilterCriteria {
  const prios = asStrArr(fm.priorities).filter((p): p is Priority => (FILTER_PRIORITIES as string[]).includes(p));
  return {
    range: oneOf<FilterRange>(fm.range, RANGES, DEFAULT_CRITERIA.range),
    priorities: prios,
    labels: asStrArr(fm.labels),
    projects: asStrArr(fm.projects),
    search: typeof fm.search === "string" ? fm.search : "",
  };
}

function readOptions(fm: Record<string, unknown>): ViewOptions {
  return {
    sort: oneOf<FilterSort>(fm.sort, SORTS, DEFAULT_OPTIONS.sort),
    group: oneOf<FilterGroup>(fm.group, GROUPS, DEFAULT_OPTIONS.group),
    showDone: fm.showDone === true,
  };
}

function toItem(f: TFile, fm: Record<string, unknown>): FilterItem {
  return {
    name: f.basename, path: f.path,
    icon: "tag",   // fest (noch kein Icon-Picker) – gilt auch für Alt-Filter mit gespeichertem icon
    color: typeof fm.color === "string" ? fm.color : null,
    hidden: !!fm.nav_hidden,
    criteria: readCriteria(fm), options: readOptions(fm),
  };
}

/** Alle gespeicherten Filter (alphabetisch). Leichtgewichtiger Scan über den metadataCache
 *  (wie listProjects) – Filter ändern sich selten, daher NICHT im TaskIndex geführt. */
export function listFilters(app: App): FilterItem[] {
  return app.vault.getMarkdownFiles().flatMap((f) => {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    return fm?.type === "filter" ? [toItem(f, fm)] : [];
  }).sort((a, b) => a.name.localeCompare(b.name, "de"));
}

/** Einen Filter per Pfad lesen (null, wenn keine Filter-Notiz mehr). */
export function readFilter(app: App, path: string): FilterItem | null {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return null;
  const fm = app.metadataCache.getFileCache(f)?.frontmatter;
  return fm?.type === "filter" ? toItem(f, fm) : null;
}

/** Kriterien + Optionen als Frontmatter-Felder schreiben (nur nicht-leere; Defaults weggelassen). */
function applyToFrontmatter(fm: Record<string, unknown>, c: FilterCriteria, o: ViewOptions): void {
  const setOrDel = (k: string, v: unknown): void => { if (v == null) delete fm[k]; else fm[k] = v; };
  setOrDel("range", c.range === "any" ? null : c.range);
  setOrDel("priorities", c.priorities.length ? c.priorities : null);
  setOrDel("labels", c.labels.length ? c.labels : null);
  setOrDel("projects", c.projects.length ? c.projects : null);
  setOrDel("search", c.search.trim() || null);
  fm.sort = o.sort;
  fm.group = o.group;
  setOrDel("showDone", o.showDone ? true : null);
}

/** Neue Filter-Notiz anlegen; gibt den Basenamen zurück. */
export async function createFilterNote(
  app: App, settings: BeautyTasksSettings, name: string, criteria: FilterCriteria, options: ViewOptions,
): Promise<string> {
  const folder = settings.filtersFolder;
  await ensureFolder(app, folder);
  const base = slugify(name);
  let dest = normalizePath(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(folder + "/" + base + " " + n + ".md"); n++; if (n > 200) break; }
  const fm: Record<string, unknown> = { type: "filter", id: newId("f"), created: todayIso() };
  applyToFrontmatter(fm, criteria, options);
  await app.vault.create(dest, buildFrontmatter(fm) + "\n# " + name + "\n");
  return base;
}

/** Kriterien/Optionen einer bestehenden Filter-Notiz aktualisieren. */
export async function updateFilterNote(app: App, path: string, criteria: FilterCriteria, options: ViewOptions): Promise<void> {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => applyToFrontmatter(fm, criteria, options));
}

/** Filter-Notiz umbenennen (Datei + „# Überschrift"). Gibt neuen Basenamen zurück oder null. */
export async function renameFilterNote(app: App, path: string, newName: string): Promise<string | null> {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return null;
  const base = slugify(newName);
  const folder = f.parent?.path ?? "";
  let dest = normalizePath((folder ? folder + "/" : "") + base + ".md");
  if (dest !== path && app.vault.getAbstractFileByPath(dest)) return null;   // Kollision
  await app.fileManager.renameFile(f, dest);
  // „# Überschrift" nachziehen, falls vorhanden.
  const nf = app.vault.getAbstractFileByPath(dest);
  if (nf instanceof TFile) {
    const body = await app.vault.read(nf);
    const replaced = body.replace(/^# .*$/m, "# " + newName);
    if (replaced !== body) await app.vault.modify(nf, replaced);
  }
  return base;
}

/** Icon-Farbe eines Filters setzen (Frontmatter `color`; null = entfernen). */
export async function setFilterColor(app: App, path: string, color: string | null): Promise<void> {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { if (color) fm.color = color; else delete fm.color; });
}

/** Filter in der Seitenleiste ein-/ausblenden (Frontmatter `nav_hidden`). */
export async function setFilterNavHidden(app: App, path: string, hidden: boolean): Promise<void> {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { if (hidden) fm.nav_hidden = true; else delete fm.nav_hidden; });
}

/** Filter-Notiz löschen (in Obsidians Papierkorb). */
export async function deleteFilterNote(app: App, path: string): Promise<void> {
  const f = app.vault.getAbstractFileByPath(path);
  if (f instanceof TFile) await app.fileManager.trashFile(f);
}
