import { App, FuzzySuggestModal, TFile, normalizePath } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { BeautyTasksSettings, Priority, TaskStatus } from "./types";
import { buildFrontmatter, ensureFolder, slugify, newId, todayIso, createProjectNote, listManaged } from "./taskService";
import { combineDT } from "./format";
import { t } from "./i18n";

const EXPORT_FORMAT = "beautytasks";
const EXPORT_VERSION = 2;   // v2: eigener `lists`-Abschnitt (Projekt/Bereich mit Typ). v1 = nur Aufgaben.

const baseName = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");

/** Portable Repräsentation einer Aufgabe: Referenzen (Projekt/Bereich/Eltern) als Basename,
 *  nicht als Vault-Pfad – so bleibt der Export beim Umzug in einen anderen Vault gültig. */
export interface ExportTask {
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
  project: string | null;   // Basename der zugeordneten Liste (Projekt ODER Bereich – Typ steht in `lists`)
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

/** Listen-Definition (Projekt/Bereich). Trägt den Typ, den die Aufgaben-Referenz allein nicht
 *  kennt – so kommen Bereiche beim Import wieder als Bereich (nicht als Projekt) zurück. */
export interface ExportList {
  name: string;
  type: "project" | "area";
  color: string | null;
  archived: boolean;
}

export interface ExportData {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  taskCount: number;
  lists: ExportList[];
  labels: string[];
  tasks: ExportTask[];
}

export interface ImportResult { created: number; skipped: number; listsCreated: number; labelsAdded: number; }

/** ExportData aus fertigen Records zusammensetzen – für Importer aus Fremdformaten (z. B. TaskNotes),
 *  die direkt Aufgaben-/Listen-Records erzeugen und den gemeinsamen importData()-Writer nutzen. */
export function makeImportData(lists: ExportList[], labels: string[], tasks: ExportTask[]): ExportData {
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), taskCount: tasks.length, lists, labels, tasks };
}

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
    parent: tk.parent ? baseName(tk.parent) : null,
    labels: tk.labels,
    recurrence: tk.recurrence,
    recurBasis: tk.recurBasis,
    reminders: tk.reminders,
    created: tk.created,
    completed: tk.completed,
    cancelled: tk.cancelled,
    description: tk.description,
  }));
  // Listen mit Typ mitexportieren (aktive + archivierte, ohne Inbox – listManaged filtert sie).
  const { active, archived } = listManaged(plugin.app);
  const lists: ExportList[] = [...active, ...archived].map((p) => ({
    name: p.name, type: p.type, color: p.color, archived: p.archived,
  }));
  return {
    format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(),
    taskCount: tasks.length, lists, labels: [...plugin.settings.knownLabels], tasks,
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
    parent: et.parent ? "[[" + et.parent + "]]" : null,
    labels: et.labels ?? [],
    recurrence: et.recurrence ?? null,
    recur_basis: et.recurrence && et.recurBasis === "done" ? "done" : null,
    reminders: et.reminders ?? [],
    created: et.created || todayIso(),
    completed: et.completed ?? null,
    cancelled: et.cancelled ?? null,
    external_id: et.externalId ?? null,
    description: (et.description ?? "").trim() || null,   // Beschreibung im Frontmatter, nicht im Body
  });
  await app.vault.create(dest, fm + "\n# " + et.title + "\n");
}

/** Eine importierte Liste mit KORREKTEM Typ (Projekt/Bereich) + Farbe/Archiv-Status anlegen. */
async function writeImportedList(app: App, settings: BeautyTasksSettings, list: ExportList): Promise<void> {
  const folder = settings.projectsFolder;
  await ensureFolder(app, folder);
  const base = slugify(list.name);
  let dest = normalizePath(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(folder + "/" + base + " " + n + ".md"); n++; if (n > 200) break; }
  const fm = buildFrontmatter({
    type: list.type === "area" ? "area" : "project",
    id: newId("p"),
    status: list.archived ? "archived" : "active",
    color: list.color ?? undefined,
    created: todayIso(),
  });
  await app.vault.create(dest, fm + "\n# " + list.name + "\n");
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

  // 1) Listen (Projekte/Bereiche) mit KORREKTEM Typ aus dem Manifest anlegen – nur fehlende.
  //    Vorhandene Notizen bleiben unangetastet (eine falsch als Projekt liegende Liste
  //    korrigiert der User mit einem Klick im ListManager → in Bereich umwandeln).
  const listNames = existingListNames(app);
  let listsCreated = 0;
  for (const list of data.lists ?? []) {
    const key = list.name?.toLowerCase();
    if (!key || listNames.has(key)) continue;
    listNames.add(key);
    await writeImportedList(app, settings, list);
    listsCreated++;
  }
  // Fallback: von Aufgaben referenzierte Listen, die weder existieren noch im Manifest stehen
  //   (z. B. Alt-Export ohne `lists`), als Projekt anlegen, damit die Wikilinks auflösen.
  for (const et of data.tasks) {
    const key = et.project?.toLowerCase();
    if (!et.project || !key || listNames.has(key)) continue;
    if (key === "inbox" || key === "eingang") continue;   // Inbox nie als Projekt anlegen (wird separat sichergestellt)
    listNames.add(key);
    await createProjectNote(app, settings, et.project, false);
    listsCreated++;
  }

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

/** OS-Dateidialog (Rechner) → liest den Textinhalt und reicht ihn weiter.
 *  WICHTIG: Das Input MUSS im DOM hängen – ein loses Element öffnet den nativen Dialog in
 *  Electron/Chromium unzuverlässig (öffnet erst beim nächsten Fensterfokus). Daher versteckt
 *  in document.body einhängen, klicken, danach wieder entfernen. `showPicker()` bevorzugt. */
export function pickOsJsonFile(onText: (text: string) => void): void {
  const input = createEl("input", { cls: "bt-hidden-file-input", type: "file", attr: { accept: ".json,application/json" } });
  activeDocument.body.appendChild(input);
  const cleanup = () => input.remove();
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    cleanup();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  });
  // Abbruch (kein change-Event) → aufräumen, sobald das Fenster den Fokus zurückbekommt.
  window.addEventListener("focus", () => window.setTimeout(cleanup, 0), { once: true });
  try {
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  } catch {
    input.click();
  }
}
