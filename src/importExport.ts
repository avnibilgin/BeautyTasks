import { App, FuzzySuggestModal, TFile, normalizePath } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { BeautyTasksSettings, Priority, TaskStatus, Task } from "./types";
import { buildFrontmatter, ensureFolder, slugify, newId, todayIso, createProjectNote, listManaged, baseName, ProjItem } from "./taskService";
import { titleKey, newTaskBody, findH1LineInBody } from "./taskTitle";
import { fieldKey } from "./fieldNames";
import { combineDT } from "./format";
import { listFilters, createFilterNote, FilterItem } from "./filterService";
import { FilterCriteria, ViewOptions } from "./filterEngine";
import { isKnownStatus } from "./statuses";
import { t } from "./i18n";

const EXPORT_FORMAT = "beautytasks";
const EXPORT_VERSION = 3;
// v1 = nur Aufgaben · v2 = eigener `lists`-Abschnitt (Projekt/Bereich mit Typ)
// v3 = `sortOrder` und `body` an der Aufgabe, `icon`/`description`/`hidden` an der Liste,
//      dazu `filters` und die Label-Farben/-Sichtbarkeit.
//
// Die Zahl ist eine ANGABE, keine Schranke: `parseExport` prüft sie bewusst nicht. Ältere Dateien
// bleiben lesbar (die neuen Felder sind optional und fehlen dann einfach), und eine v3-Datei lässt
// sich in einer älteren Fassung importieren – sie verliert dort nur, was sie noch nicht kennt.
// Deshalb sind alle Zugänge unten `?`-optional typisiert statt als Pflichtfelder.


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
  /** Manuelle Position (v3). Fehlt bei älteren Exporten UND bei Aufgaben, die nie umsortiert
   *  wurden – das Feld wird erst beim ersten Umsortieren materialisiert (s. planReorder). */
  sortOrder?: number | null;
  /** Der Notiz-Inhalt UNTER der Titelzeile, wörtlich (v3): eigener Text UND Detail-Log.
   *  Leer bei den allermeisten Aufgaben – die tragen ihren Inhalt im Frontmatter (`description`). */
  body?: string;
}

/** Listen-Definition (Projekt/Bereich). Trägt den Typ, den die Aufgaben-Referenz allein nicht
 *  kennt – so kommen Bereiche beim Import wieder als Bereich (nicht als Projekt) zurück. */
export interface ExportList {
  name: string;
  type: "project" | "area";
  color: string | null;
  archived: boolean;
  /** Seit v3. Ältere Exporte kennen sie nicht – dann bleibt es beim Standard der Zielliste. */
  icon?: string | null;
  description?: string;
  hidden?: boolean;
}

/** Ein gespeicherter Filter. Kriterien und Anzeige-Optionen wandern als Ganzes mit – sie
 *  benennen Projekte und Labels, und die kommen im selben Export mit. */
export interface ExportFilter {
  name: string;
  color: string | null;
  hidden: boolean;
  description: string;
  criteria: FilterCriteria;
  options: ViewOptions;
}

export interface ExportData {
  format: typeof EXPORT_FORMAT;
  version: number;
  exportedAt: string;
  taskCount: number;
  lists: ExportList[];
  labels: string[];
  tasks: ExportTask[];
  /** Seit v3. Fehlt in älteren Exporten – dann werden keine Filter angelegt. */
  filters?: ExportFilter[];
  /** Seit v3: Farbe je Label und welche Labels in der Seitenleiste stehen. Beides gehört zum
   *  Label, nicht zur Aufgabe – ohne sie kommen Labels farblos und unsichtbar an. */
  labelColors?: Record<string, string>;
  visibleLabels?: string[];
}

export interface ImportResult {
  created: number; skipped: number; listsCreated: number; labelsAdded: number; filtersCreated: number;
  /** Status aus dem Export, die es in DIESEM Vault nicht gibt (Namen, alphabetisch). */
  unknownStatuses: string[];
  /** Wie viele importierte Aufgaben davon betroffen sind. */
  unknownStatusTasks: number;
}

/**
 * Welche Status kennt dieser Vault nicht?
 *
 * Der Wert bleibt in der Notiz stehen und käme zurück, sobald jemand den Status anlegt — die App
 * zeigt die Aufgabe bis dahin aber als OFFEN (s. taskIndex.parse). Ohne Hinweis erfährt das
 * niemand: Man importiert dreihundert Aufgaben und merkt nicht, dass vierzig davon ihre Phase
 * verloren haben. Deshalb wird es gezählt und gemeldet — geändert wird nichts, denn fremde
 * Status-Definitionen in die Einstellungen zu schreiben hieße, die Konfiguration des Zielvaults
 * zu übernehmen statt seine Daten zu ergänzen.
 */
export function unknownStatusReport(tasks: ExportTask[], kennt: (id: string) => boolean): { names: string[]; count: number } {
  const namen = new Set<string>();
  let count = 0;
  for (const t of tasks) {
    const st = (t.status ?? "").trim();
    if (!st || kennt(st) || st === "cancelled") continue;   // „cancelled" ist der reservierte Sentinel
    namen.add(st);
    count++;
  }
  return { names: [...namen].sort(), count };
}

/** ExportData aus fertigen Records zusammensetzen – für Importer aus Fremdformaten (z. B. TaskNotes),
 *  die direkt Aufgaben-/Listen-Records erzeugen und den gemeinsamen importData()-Writer nutzen. */
// ── Umwandlung, rein und ohne Vault ───────────────────────────────────────────
// Export und Import als PAAR an einer Stelle: Nur so lässt sich die eine Eigenschaft prüfen, auf
// die es ankommt – dass eine Aufgabe die Rundreise übersteht. Verstreut über Vault-Zugriffe wäre
// genau das nicht testbar, und genau dort ist `sortOrder` jahrelang unbemerkt liegengeblieben.

/**
 * Der Notiz-Inhalt unterhalb der Titelzeile — wörtlich, ohne Auslegung.
 *
 * Enthält beides, was dort stehen kann: eigenen Text und den Detail-Log. Getrennt würden sie
 * nicht: Im Hauptvault haben ALLE 13 Notizen mit Inhalt beides, und die Grenze zu ziehen hieße,
 * eine Notiz zu zerschneiden, deren Aufbau dem Nutzer gehört.
 *
 * Die Titelzeile fällt weg, weil der Import sie selbst schreibt (newTaskBody) — sonst stünde sie
 * nach einer Rundreise doppelt da. Das Frontmatter fällt weg, weil jedes seiner Felder einzeln im
 * Datensatz steht.
 */
export function noteBody(content: string): string {
  const ohneFm = content.replace(/^---\n[\s\S]*?\n---\n/, "");
  const zeilen = ohneFm.split("\n");
  const h1 = findH1LineInBody(ohneFm);
  const rest = h1 === null ? zeilen : zeilen.slice(h1 + 1);
  return rest.join("\n").replace(/^\n+|\s+$/g, "");
}

/** Aufgabe -> portabler Datensatz. Referenzen als Basename (s. ExportTask).
 *  `body` kommt von außen: Der Index führt ihn nicht, er steht nur in der Datei. */
export function toExportTask(tk: Task, body = ""): ExportTask {
  return {
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
    sortOrder: tk.sortOrder,
    body: body || undefined,
  };
}

/** Filter -> portabler Datensatz. Der Pfad bleibt draußen (er gilt nur im Quell-Vault);
 *  Kriterien und Anzeige-Optionen wandern als Ganzes mit. */
export function toExportFilter(f: FilterItem): ExportFilter {
  return { name: f.name, color: f.color, hidden: f.hidden, description: f.description, criteria: f.criteria, options: f.options };
}

/**
 * Liste (Projekt/Bereich) -> portabler Datensatz.
 *
 * `ProjItem.icon` ist das BERECHNETE Symbol, nicht das gespeicherte: Bereiche bekommen dort immer
 * `circle-small`, Projekte ohne eigenes Symbol `folder` (s. allProjItems). Diese Vorgaben werden
 * hier wieder abgezogen — sonst schriebe der Import ein Symbol in die Notiz, das der Nutzer nie
 * gesetzt hat, und aus „kein Symbol" würde dauerhaft eines.
 *
 * Bekannte Grenze: Ein Symbol, das jemand an einem BEREICH gesetzt hat, wandert nicht mit. Das
 * Modell reicht es nicht durch (die App zeigt es dort ohnehin nicht), und dafür extra am Export
 * das Frontmatter zu lesen, lohnt den Aufwand nicht.
 */
const BERECHNETE_SYMBOLE = new Set(["circle-small", "folder"]);

export function toExportList(p: ProjItem): ExportList {
  const icon = p.icon && !BERECHNETE_SYMBOLE.has(p.icon) ? p.icon : null;
  return {
    name: p.name, type: p.type, color: p.color, archived: p.archived,
    icon, description: p.description || "", hidden: p.hidden,
  };
}

/**
 * Datensatz -> Frontmatter einer Aufgaben-Notiz. Die beiden konfigurierbaren Feldnamen kommen von
 * außen, damit diese Funktion nichts von der Registry wissen muss (und testbar bleibt).
 *
 * `null`/`undefined` verwirft `buildFrontmatter` – ein Feld, das der Export nicht kennt, entsteht
 * also gar nicht erst. Das ist bei `sortOrder` ausdrücklich gewollt: Es wird erst beim ersten
 * Umsortieren materialisiert, ein leeres Feld wäre eine Behauptung über eine Reihenfolge, die es
 * nicht gibt.
 */
export function importedTaskFrontmatter(et: ExportTask, typeName: string, titleName: string): Record<string, unknown> {
  return {
    [typeName]: "task",
    id: et.id || newId("t"),
    [titleName]: et.title,
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
    sort_order: et.sortOrder ?? null,
    created: et.created || todayIso(),
    completed: et.completed ?? null,
    cancelled: et.cancelled ?? null,
    external_id: et.externalId ?? null,
    description: (et.description ?? "").trim() || null,   // Beschreibung im Frontmatter, nicht im Body
  };
}

/** Datensatz -> Frontmatter einer Listen-Notiz (Projekt/Bereich). */
export function importedListFrontmatter(list: ExportList, typeName: string): Record<string, unknown> {
  return {
    [typeName]: list.type === "area" ? "area" : "project",
    id: newId("p"),
    status: list.archived ? "archived" : "active",
    color: list.color ?? undefined,
    icon: list.icon || undefined,
    description: (list.description ?? "").trim() || undefined,
    nav_hidden: list.hidden ? true : undefined,
    created: todayIso(),
  };
}

export function makeImportData(lists: ExportList[], labels: string[], tasks: ExportTask[]): ExportData {
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(), taskCount: tasks.length, lists, labels, tasks };
}

/** Alle Aufgaben (+ Label-Register) in ein portables Objekt serialisieren. */
/**
 * Asynchron, weil der Notiz-Inhalt nur in der DATEI steht – der Index führt ihn nicht. Gelesen
 * wird über `cachedRead`: für einen ausdrücklich angestoßenen Export ist ein Durchgang durch die
 * Aufgaben-Dateien vertretbar, und der Cache trägt die meisten davon ohnehin schon.
 */
async function buildExportData(plugin: BeautyTasksPlugin): Promise<ExportData> {
  const tasks: ExportTask[] = [];
  for (const tk of plugin.index.all()) {
    const f = plugin.app.vault.getAbstractFileByPath(tk.path);
    let body = "";
    // Eine Notiz, die zwischen Index und Export verschwindet, darf den Export nicht scheitern
    // lassen – dann fehlt eben ihr Inhalt, alle anderen kommen durch.
    if (f instanceof TFile) { try { body = noteBody(await plugin.app.vault.cachedRead(f)); } catch { body = ""; } }
    tasks.push(toExportTask(tk, body));
  }
  // Listen mit Typ mitexportieren (aktive + archivierte, ohne Inbox – listManaged filtert sie).
  const { active, archived } = listManaged(plugin.app);
  const lists: ExportList[] = [...active, ...archived].map(toExportList);
  const filters = listFilters(plugin.app).map(toExportFilter);
  return {
    format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: new Date().toISOString(),
    taskCount: tasks.length, lists, labels: [...plugin.settings.knownLabels], tasks, filters,
    labelColors: { ...plugin.settings.labelColors },
    visibleLabels: [...plugin.settings.visibleLabels],
  };
}

/** Export in eine .json-Datei im Vault (neben dem BeautyTasks-Ordner). Gibt den Pfad zurück. */
export async function writeExportFile(plugin: BeautyTasksPlugin): Promise<string> {
  const { app, settings } = plugin;
  const data = await buildExportData(plugin);
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

/** Eine importierte Aufgabe als Notiz schreiben. Übertragen wird, was `ExportTask` führt – NICHT
 *  der Notiz-Body und nicht die Definitionen eigener Status; beides ist in importExport.ts oben
 *  benannt. („Verlustfrei" stand hier einmal und war schon damals nicht wahr.) */
async function writeImportedTask(app: App, settings: BeautyTasksSettings, et: ExportTask): Promise<void> {
  await ensureFolder(app, settings.itemsFolder);
  const slug = slugify(et.title);
  let dest = normalizePath(settings.itemsFolder + "/" + slug + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(settings.itemsFolder + "/" + slug + " " + n + ".md"); n++; if (n > 500) break; }
  const fm = buildFrontmatter(importedTaskFrontmatter(et, fieldKey("type"), titleKey()));
  // Der Body kommt UNTER die (leere) Titelzeile – wörtlich so, wie er exportiert wurde.
  const body = (et.body ?? "").trim();
  await app.vault.create(dest, fm + newTaskBody(et.title, true) + (body ? body + "\n" : ""));
}

/** Eine importierte Liste mit KORREKTEM Typ (Projekt/Bereich) + Farbe/Archiv-Status anlegen. */
async function writeImportedList(app: App, settings: BeautyTasksSettings, list: ExportList): Promise<void> {
  const folder = settings.projectsFolder;
  await ensureFolder(app, folder);
  const base = slugify(list.name);
  let dest = normalizePath(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(folder + "/" + base + " " + n + ".md"); n++; if (n > 200) break; }
  const fm = buildFrontmatter(importedListFrontmatter(list, fieldKey("type")));
  await app.vault.create(dest, fm + "\n# " + list.name + "\n");
}

/** Basenamen (lowercase) aller vorhandenen Projekt-/Bereich-Notizen. */
function existingListNames(app: App): Set<string> {
  const out = new Set<string>();
  for (const f of app.vault.getMarkdownFiles()) {
    const type = app.metadataCache.getFileCache(f)?.frontmatter?.[fieldKey("type")] as unknown;
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
  //
  // NEU ZUWEISEN statt `push`: Eine Sammlung, die dem Standard gleicht, steht nicht in der
  // data.json – bis 1.38.3 zeigte sie deshalb auf DASSELBE Array wie der Standard, und ein `push`
  // veränderte den Standard des ganzen Prozesses. `toDelta` verglich danach gegen genau dieses
  // veränderte Objekt, fand Gleichheit und warf den Schlüssel weg: In der Sitzung standen die
  // importierten Labels in der Seitenleiste, nach dem Neustart waren sie fort. `applyDefaults`
  // kopiert seit 1.38.4 jeden veränderlichen Standardwert (s. `frisch`) – hier wird trotzdem
  // zugewiesen, damit das Speichern nicht wieder an einer Kopier-Regel woanders hängt.
  const labels = new Set<string>([...(data.labels ?? []), ...data.tasks.flatMap((t) => t.labels ?? [])]);
  const neueLabels = [...labels].filter((l) => l && !settings.knownLabels.includes(l));
  const labelsAdded = neueLabels.length;
  if (labelsAdded) settings.knownLabels = [...settings.knownLabels, ...neueLabels];
  // Farbe und Sichtbarkeit gehören zum Label, nicht zur Aufgabe. Vorhandenes wird NICHT
  // überschrieben: Wer im Zielvault schon eine Farbe für „ui" gewählt hat, behält sie.
  let labelMeta = false;
  const neueFarben = Object.entries(data.labelColors ?? {}).filter(([name, farbe]) => name && farbe && !settings.labelColors[name]);
  if (neueFarben.length) { settings.labelColors = { ...settings.labelColors, ...Object.fromEntries(neueFarben) }; labelMeta = true; }
  // `new Set` auch hier: Die alte Fassung prüfte gegen die WACHSENDE Liste und fing Doppelte in
  // `data.visibleLabels` damit nebenbei ab – ein Filter gegen den Ausgangsstand tut das nicht.
  const neueSichtbare = [...new Set((data.visibleLabels ?? []).filter((name) => name && labels.has(name) && !settings.visibleLabels.includes(name)))];
  if (neueSichtbare.length) { settings.visibleLabels = [...settings.visibleLabels, ...neueSichtbare]; labelMeta = true; }
  if (labelsAdded || labelMeta) await plugin.saveSettings();

  // 2b) Filter anlegen – nur fehlende, verglichen über den Namen (wie bei den Listen).
  const vorhandeneFilter = new Set(listFilters(app).map((f) => f.name.toLowerCase()));
  let filtersCreated = 0;
  for (const fl of data.filters ?? []) {
    const key = fl.name?.trim().toLowerCase();
    if (!key || vorhandeneFilter.has(key)) continue;
    vorhandeneFilter.add(key);
    await createFilterNote(app, settings, fl.name, fl.criteria, fl.options, fl.color ?? null, !!fl.hidden, fl.description ?? "");
    filtersCreated++;
  }

  // 3) Aufgaben schreiben – vorhandene (id/externalId) überspringen.
  let created = 0, skipped = 0;
  for (const et of data.tasks) {
    if ((et.id && seenIds.has(et.id)) || (et.externalId && seenExt.has(et.externalId))) { skipped++; continue; }
    await writeImportedTask(app, settings, et);
    if (et.id) seenIds.add(et.id);
    if (et.externalId) seenExt.add(et.externalId);
    created++;
  }
  const unbekannt = unknownStatusReport(data.tasks, isKnownStatus);
  return { created, skipped, listsCreated, labelsAdded, filtersCreated, unknownStatuses: unbekannt.names, unknownStatusTasks: unbekannt.count };
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
