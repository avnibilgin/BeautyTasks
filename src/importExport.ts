import { App, FuzzySuggestModal, TFile, normalizePath } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { BeautyTasksSettings, Priority, TaskStatus } from "./types";
import { buildFrontmatter, ensureFolder, slugify, newId, todayIso, createProjectNote } from "./taskService";
import { combineDT } from "./format";
import { t } from "./i18n";

const EXPORT_FORMAT = "beautytasks";
const EXPORT_VERSION = 1;

const baseName = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");

/** Portable Repräsentation einer Aufgabe: Referenzen (Projekt/Bereich/Eltern) als Basename,
 *  nicht als Vault-Pfad – so bleibt der Export beim Umzug in einen anderen Vault gültig. */
interface ExportTask {
  id: string;
  externalId: string | null;
  title: string;
  status: TaskStatus;
  priority: Priority;
  due: string | null;
  dueTime: string | null;
  scheduled: string | null;
  scheduledTime: string | null;
  duration: number | null;
  start: string | null;
  project: string | null;
  area: string | null;
  parent: string | null;
  labels: string[];
  recurrence: string | null;
  recurBasis: "due" | "done";
  reminders: string[];
  created: string;
  completed: string | null;
  cancelled: string | null;
  description: string;
}

interface ExportData {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  taskCount: number;
  labels: string[];
  tasks: ExportTask[];
}

export interface ImportResult { created: number; skipped: number; listsCreated: number; labelsAdded: number; }

/** Alle Aufgaben (+ Label-Register) in ein portables Objekt serialisieren. */
function buildExportData(plugin: BeautyTasksPlugin): ExportData {
  const tasks: ExportTask[] = plugin.index.all().map((tk) => ({
    id: tk.id,
    externalId: tk.externalId,
    title: tk.title,
    status: tk.status,
    priority: tk.priority,
    due: tk.due,
    dueTime: tk.dueTime,
    scheduled: tk.scheduled,
    scheduledTime: tk.scheduledTime,
    duration: tk.duration,
    start: tk.start,
    project: tk.project ? baseName(tk.project) : null,
    area: tk.area ? baseName(tk.area) : null,
    parent: tk.parent ? baseName(tk.parent) : null,
    labels: tk.labels,
    recurrence: tk.recurrence,
    recurBasis: tk.recurBasis,
    reminders: tk.reminders,
    created: tk.created,
    completed: tk.completed,
    cancelled: tk.cancelled,
    description: plugin.index.descriptionOf(tk.path),
  }));
  return {
    format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(),
    taskCount: tasks.length, labels: [...plugin.settings.knownLabels], tasks,
  };
}

/** Export in eine .json-Datei im Vault (neben dem BeautyTasks-Ordner). Gibt den Pfad zurück. */
export async function writeExportFile(plugin: BeautyTasksPlugin): Promise<string> {
  const { app, settings } = plugin;
  const data = buildExportData(plugin);
  const parts = settings.itemsFolder.split("/");
  const base = parts.length > 1 ? parts.slice(0, -1).join("/") : settings.itemsFolder;   // z. B. „BeautyTasks"
  await ensureFolder(app, base);
  const d = new Date();
  const z = (n: number): string => String(n).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}-${z(d.getHours())}${z(d.getMinutes())}`;
  let dest = normalizePath(`${base}/beautytasks-export-${stamp}.json`);
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(`${base}/beautytasks-export-${stamp} ${n}.json`); n++; if (n > 200) break; }
  await app.vault.create(dest, JSON.stringify(data, null, 2));
  return dest;
}

/** Rohtext als BeautyTasks-Export parsen. null, wenn Format/Struktur nicht passt. */
export function parseExport(raw: string): ExportData | null {
  let obj: unknown;
  try { obj = JSON.parse(raw); } catch { return null; }
  if (typeof obj !== "object" || obj === null) return null;
  const d = obj as Partial<ExportData>;
  if (d.format !== EXPORT_FORMAT || !Array.isArray(d.tasks)) return null;
  return d as ExportData;
}

/** Eine importierte Aufgabe verlustfrei als Notiz schreiben (alle Felder erhalten). */
async function writeImportedTask(app: App, settings: BeautyTasksSettings, et: ExportTask): Promise<void> {
  await ensureFolder(app, settings.itemsFolder);
  const slug = slugify(et.title);
  let dest = normalizePath(settings.itemsFolder + "/" + slug + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(settings.itemsFolder + "/" + slug + " " + n + ".md"); n++; if (n > 500) break; }
  const fm = buildFrontmatter({
    type: "task",
    id: et.id || newId("t"),
    status: et.status || "todo",
    priority: et.priority && et.priority !== "normal" ? et.priority : undefined,
    due: et.due ? combineDT(et.due, et.dueTime) : null,
    scheduled: et.scheduled ? combineDT(et.scheduled, et.scheduledTime) : null,
    duration: et.duration ?? null,
    start: et.start ?? null,
    project: et.project ? "[[" + et.project + "]]" : null,
    area: et.area ? "[[" + et.area + "]]" : null,
    parent: et.parent ? "[[" + et.parent + "]]" : null,
    labels: et.labels ?? [],
    recurrence: et.recurrence ?? null,
    recur_basis: et.recurrence && et.recurBasis === "done" ? "done" : null,
    reminders: et.reminders ?? [],
    created: et.created || todayIso(),
    completed: et.completed ?? null,
    cancelled: et.cancelled ?? null,
    external_id: et.externalId ?? null,
  });
  const desc = (et.description ?? "").trim();
  await app.vault.create(dest, fm + "\n# " + et.title + "\n" + (desc ? "\n" + desc + "\n" : ""));
}

/** Basenamen (lowercase) aller vorhandenen Projekt-/Bereich-Notizen. */
function existingListNames(app: App): Set<string> {
  const out = new Set<string>();
  for (const f of app.vault.getMarkdownFiles()) {
    const type = app.metadataCache.getFileCache(f)?.frontmatter?.type as unknown;
    if (type === "project" || type === "area") out.add(f.basename.toLowerCase());
  }
  return out;
}

/** Import: fehlende Projekte/Bereiche + Labels anlegen, Aufgaben schreiben.
 *  Dedup über id UND externalId → erneuter Import derselben Datei erzeugt keine Duplikate. */
export async function importData(plugin: BeautyTasksPlugin, data: ExportData): Promise<ImportResult> {
  const { app, settings } = plugin;
  const existing = plugin.index.all();
  const seenIds = new Set(existing.map((t) => t.id));
  const seenExt = new Set(existing.filter((t) => t.externalId).map((t) => t.externalId as string));

  // 1) Fehlende Projekte/Bereiche anlegen, damit Wikilinks der Aufgaben auflösen.
  const listNames = existingListNames(app);
  let listsCreated = 0;
  const ensureList = async (name: string | null, asArea: boolean): Promise<void> => {
    if (!name) return;
    const key = name.toLowerCase();
    if (listNames.has(key)) return;
    listNames.add(key);
    await createProjectNote(app, settings, name, asArea);
    listsCreated++;
  };
  for (const et of data.tasks) { await ensureList(et.project, false); await ensureList(et.area, true); }

  // 2) Label-Register ergänzen (aus Export-Register + Aufgaben-Labels).
  const labels = new Set<string>([...(data.labels ?? []), ...data.tasks.flatMap((t) => t.labels ?? [])]);
  let labelsAdded = 0;
  for (const l of labels) {
    if (l && !settings.knownLabels.includes(l)) { settings.knownLabels.push(l); labelsAdded++; }
  }
  if (labelsAdded) await plugin.saveSettings();

  // 3) Aufgaben schreiben – vorhandene (id/externalId) überspringen.
  let created = 0, skipped = 0;
  for (const et of data.tasks) {
    if ((et.id && seenIds.has(et.id)) || (et.externalId && seenExt.has(et.externalId))) { skipped++; continue; }
    await writeImportedTask(app, settings, et);
    if (et.id) seenIds.add(et.id);
    if (et.externalId) seenExt.add(et.externalId);
    created++;
  }
  return { created, skipped, listsCreated, labelsAdded };
}

/** In-Vault-Auswahl: listet alle .json-Dateien (neueste zuerst). */
export class JsonFilePickerModal extends FuzzySuggestModal<TFile> {
  constructor(app: App, private onPick: (f: TFile) => void) {
    super(app);
    this.setPlaceholder(t("import_pick_placeholder"));
  }
  getItems(): TFile[] {
    return this.app.vault.getFiles().filter((f) => f.extension === "json").sort((a, b) => b.stat.mtime - a.stat.mtime);
  }
  getItemText(f: TFile): string { return f.path; }
  onChooseItem(f: TFile): void { this.onPick(f); }
}

/** OS-Dateidialog (Rechner) → liest den Textinhalt und reicht ihn weiter. */
export function pickOsJsonFile(onText: (text: string) => void): void {
  const input = createEl("input", { type: "file", attr: { accept: ".json,application/json" } });
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  });
  input.click();
}
