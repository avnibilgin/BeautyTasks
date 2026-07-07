import { App, TFile, normalizePath, stringifyYaml } from "obsidian";
import { BeautyTasksSettings, Priority, TaskStatus } from "./types";
import { combineDT } from "./format";

export const slugify = (s: string): string =>
  s.replace(/[\\/:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Task";

/** Label-Normalisierung wie bei der Erfassung (klein, ohne #, Leerzeichen→Bindestrich). */
export const normalizeLabel = (s: string): string =>
  slugify(s).toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");

export const newId = (p: string): string =>
  p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Lokales Datum (YYYY-MM-DD), NICHT UTC: toISOString() würde nachts (lokal 00:00 bis
// UTC-Offset) noch „gestern" liefern. Identisch zur iso()-Logik im Datepicker.
export const todayIso = (): string => {
  const d = new Date();
  const z = (n: number): string => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
};

/** Frontmatter-Block – nur gesetzte Felder. */
export function buildFrontmatter(obj: Record<string, unknown>): string {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    clean[k] = v;
  }
  return "---\n" + stringifyYaml(clean) + "---\n";
}

export async function ensureFolder(app: App, path: string): Promise<void> {
  const p = normalizePath(path);
  if (!app.vault.getAbstractFileByPath(p)) {
    try { await app.vault.createFolder(p); } catch { /* existiert evtl. schon */ }
  }
}

export interface TaskFields {
  title: string;
  description?: string | null;  // freier Markdown-Text (Body, zwischen Titel und Log)
  status?: TaskStatus;
  due?: string | null;          // Datums-Teil (YYYY-MM-DD)
  dueTime?: string | null;      // "HH:mm" -> wird in due eingebettet (YYYY-MM-DDTHH:mm)
  scheduled?: string | null;
  scheduledTime?: string | null;
  duration?: number | null;     // Minuten (Event-Länge)
  priority?: Priority;
  project?: string | null;   // Projekt-Basename (nicht Pfad)
  labels?: string[];
  recurrence?: string | null;
  recurBasis?: "due" | "done";
  parent?: string | null;    // Basename der Eltern-Aufgabe
  reminders?: string[];      // rohe Erinnerungs-Strings (siehe reminders.ts)
}

/** Neue Aufgaben-Notiz anlegen (kollisionssicherer Dateiname). */
export async function createTaskNote(app: App, settings: BeautyTasksSettings, f: TaskFields): Promise<TFile> {
  await ensureFolder(app, settings.itemsFolder);
  const slug = slugify(f.title);
  let dest = normalizePath(settings.itemsFolder + "/" + slug + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = normalizePath(settings.itemsFolder + "/" + slug + " " + n + ".md"); n++;
    if (n > 200) break;
  }
  const fm = buildFrontmatter({
    type: "task",
    id: newId("t"),
    status: f.status ?? "todo",
    priority: f.priority && f.priority !== "normal" ? f.priority : undefined,
    due: f.due ? combineDT(f.due, f.dueTime) : null,
    scheduled: f.scheduled ? combineDT(f.scheduled, f.scheduledTime) : null,
    duration: f.duration ?? null,
    project: f.project ? "[[" + f.project + "]]" : null,
    parent: f.parent ? "[[" + f.parent + "]]" : null,
    labels: f.labels ?? [],
    recurrence: f.recurrence ?? null,
    recur_basis: f.recurrence && f.recurBasis === "done" ? "done" : null,
    reminders: f.reminders ?? [],
    created: todayIso(),
  });
  const desc = (f.description ?? "").trim();
  return app.vault.create(dest, fm + "\n# " + f.title + "\n" + (desc ? "\n" + desc + "\n" : ""));
}

/** Vorhandene Projekte (Basename, alphabetisch) für den Picker. */
export function listProjects(app: App): string[] {
  return app.vault.getMarkdownFiles()
    .filter((file) => app.metadataCache.getFileCache(file)?.frontmatter?.type === "project")
    .map((file) => file.basename)
    .sort((a, b) => a.localeCompare(b, "de"));
}

export interface ProjItem {
  name: string; path: string; icon: string; color: string | null;
  type: "project" | "area"; hidden: boolean; archived: boolean;
}

const byName = (a: ProjItem, b: ProjItem) => a.name.localeCompare(b.name, "de");
const isInbox = (p: ProjItem) => p.name.toLowerCase() === "inbox" || p.name.toLowerCase() === "eingang";

/** Alle Projekt-/Bereich-Notizen mit Meta (Typ, Icon, Farbe, Sichtbarkeit, Archiv). */
function allProjItems(app: App): ProjItem[] {
  return app.vault.getMarkdownFiles().flatMap((f) => {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    const type: "project" | "area" | null = fm?.type === "area" ? "area" : fm?.type === "project" ? "project" : null;
    if (!type) return [];
    return [{
      name: f.basename, path: f.path, type,
      // Bereiche immer circle-small (per CSS gefüllt), unabhängig vom icon-Frontmatter.
      // Projekte: eigenes icon-Frontmatter respektieren, sonst Default „folder".
      icon: type === "area" ? "circle-small" : (typeof fm?.icon === "string" && fm.icon ? fm.icon : "folder"),
      color: typeof fm?.color === "string" ? fm.color : null,
      hidden: !!fm?.nav_hidden, archived: fm?.status === "archived",
    }];
  });
}

/** Eingang + Bereiche + Projekte (ohne Archivierte) für Picker/Nav. „hidden" bleibt drin;
 *  die Nav filtert es selbst, der Aufgaben-Picker zeigt es weiterhin. */
/** Basenamen (lowercase) aller archivierten Projekte/Bereiche – zum Ausblenden ihrer
 *  Aufgaben aus Sammelansichten (Heute, Demnächst, Labels, Projekt-Boards …). */
export function archivedProjectNames(app: App): Set<string> {
  return new Set(allProjItems(app).filter((p) => p.archived).map((p) => p.name.toLowerCase()));
}

export function listProjectsAndAreas(app: App): { eingang: ProjItem | null; bereiche: ProjItem[]; projekte: ProjItem[] } {
  const all = allProjItems(app).filter((p) => !p.archived);
  const bereiche = all.filter((p) => p.type === "area").sort(byName);
  const projekteAll = all.filter((p) => p.type === "project");
  const eingang = projekteAll.find(isInbox) ?? null;
  if (eingang) eingang.icon = "inbox";
  const projekte = projekteAll.filter((p) => p !== eingang).sort(byName);
  return { eingang, bereiche, projekte };
}

/** Verwaltung: aktive (Bereiche + Projekte, ohne Eingang) und archivierte Einträge. */
export function listManaged(app: App): { active: ProjItem[]; archived: ProjItem[] } {
  const all = allProjItems(app).filter((p) => !isInbox(p));
  const active = all.filter((p) => !p.archived)
    .sort((a, b) => (a.type === b.type ? byName(a, b) : a.type === "area" ? -1 : 1));   // Bereiche zuerst
  const archived = all.filter((p) => p.archived).sort(byName);
  return { active, archived };
}

/** Neues Projekt (oder mit asArea=true direkt einen Bereich) anlegen; gibt den Basenamen
 *  zurück. Bereiche entstehen sonst per Umwandeln eines Projekts (setProjectType). */
export async function createProjectNote(app: App, settings: BeautyTasksSettings, name: string, asArea = false, color: string | null = null): Promise<string> {
  const folder = settings.projectsFolder;
  await ensureFolder(app, folder);
  const base = slugify(name);
  let dest = normalizePath(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(folder + "/" + base + " " + n + ".md"); n++; if (n > 200) break; }
  const fm = buildFrontmatter({ type: asArea ? "area" : "project", id: newId("p"), status: "active", color: color ?? undefined, created: todayIso() });
  await app.vault.create(dest, fm + "\n# " + name + "\n");
  return base;
}

/** Beim Erst-Setup die Inbox-Notiz anlegen, falls noch keine existiert. Die Inbox ist eine
 *  normale Projekt-Notiz namens „Inbox" (im UI lokalisiert als „Eingang"); erkannt via isInbox.
 *  Legt nichts an, wenn schon eine Inbox/Eingang-Notiz vorhanden ist. */
export async function ensureInbox(app: App, settings: BeautyTasksSettings): Promise<void> {
  if (allProjItems(app).some(isInbox)) return;
  await ensureFolder(app, settings.projectsFolder);
  const dest = normalizePath(settings.projectsFolder + "/Inbox.md");
  if (app.vault.getAbstractFileByPath(dest)) return;
  const fm = buildFrontmatter({ type: "project", id: newId("p"), status: "active", icon: "inbox", created: todayIso() });
  await app.vault.create(dest, fm + "\n# Inbox\n");
}

/** Projekt ↔ Bereich umschalten – ändert NUR den Frontmatter-type (kein Verschieben,
 *  keine sonstigen Änderungen). Bereich = type:area, Projekt = type:project. */
export async function setProjectType(app: App, path: string, toArea: boolean): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => { fm.type = toArea ? "area" : "project"; });
}

/** Ist die Notiz an diesem Pfad ein Bereich (type: area)? */
export function isAreaPath(app: App, path: string): boolean {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return false;
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return fm?.type === "area";
}

/** Projekt archivieren/wiederherstellen (status: archived|active). */
export async function setProjectArchived(app: App, path: string, archived: boolean): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => { fm.status = archived ? "archived" : "active"; });
}

/** Sichtbarkeit in der Nav umschalten (nav_hidden gesetzt = ausgeblendet). */
export async function setNavHidden(app: App, path: string, hidden: boolean): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
    if (hidden) fm.nav_hidden = true; else delete fm.nav_hidden;
  });
}

/** Icon-Farbe eines Projekts/Bereichs setzen (Frontmatter `color`; null = entfernen). */
export async function setProjectColor(app: App, path: string, color: string | null): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => { if (color) fm.color = color; else delete fm.color; });
}

/** Projekt umbenennen: Datei umbenennen (Obsidian aktualisiert Links) + H1-Überschrift. */
export async function renameProjectNote(app: App, path: string, newName: string): Promise<string | null> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return null;
  const base = slugify(newName);
  if (!base || base === file.basename) return file.basename;
  const dir = file.parent?.path ?? "";
  const dest = normalizePath((dir ? dir + "/" : "") + base + ".md");
  if (app.vault.getAbstractFileByPath(dest)) return null;   // Namenskollision
  await app.fileManager.renameFile(file, dest);
  const renamed = app.vault.getAbstractFileByPath(dest);
  if (renamed instanceof TFile) {
    await app.vault.process(renamed, (c) => c.replace(/^#\s+.*$/m, "# " + newName));
  }
  return base;
}

/** Projekt in den Obsidian-Papierkorb verschieben (reversibel). */
export async function deleteProjectNote(app: App, path: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (file instanceof TFile) await app.fileManager.trashFile(file);
}
