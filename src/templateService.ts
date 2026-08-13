import { App, TFile, normalizePath } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { AnchorMode, planTemplateDates } from "./templatePlan";
import { baseName, createTaskNote, EditScope, ensureFolder, NoteTarget, setTaskTitle, slugify } from "./taskService";
import { firstOpenStatus, isTrashed } from "./statuses";

/**
 * Vorlagen: speichern und anwenden.
 *
 * Beide Richtungen laufen über DENSELBEN Kopierer wie das Duplizieren (`duplicateSubtree`), nur
 * mit anderen Vorgaben (s. DuplicateOpts in taskService.ts):
 *
 *   Aufgabe → Vorlage:  anderer Zielordner, anderer Typwert
 *   Vorlage → Aufgabe:  anderer Quell-Index, verschobene Daten, erzwungenes Zielprojekt
 *
 * Ein zweiter Schreibweg hätte über kurz oder lang ein Feld vergessen, das der erste kennt –
 * die Rekursion, der Kreis-Schutz und die frischen `sort_order`-Lücken gibt es deshalb nur einmal.
 */

/** Frontmatter-Feld an der WURZEL einer Vorlage: was beim Anwenden entsteht. Die Kinder tragen es
 *  nicht – sie sind schon durch ihren `parent` eindeutig einer Wurzel zugeordnet. */
export const TEMPLATE_OF = "template_of";
export type TemplateKind = "task" | "project";

/** Der Typwert, an dem der Vorlagen-Index seine Notizen erkennt (s. TEMPLATE_SCOPE). */
export const TEMPLATE_TYPE = "template";

/** Eine Vorlage, wie die Seitenleiste und die Auswahl sie brauchen. */
export interface TemplateInfo {
  root: Task;
  name: string;
  kind: TemplateKind;
  /** Wie viele Aufgaben beim Anwenden entstehen (Wurzel eingeschlossen). */
  size: number;
}

/** Ordner einer Vorlage: `<templatesFolder>/<Name>`. Je Vorlage einer – siehe templates-plan.md,
 *  Abschnitt „Vault-Layout": flach in einem Topf verwechselten sich gleichnamige Schritte zweier
 *  Vorlagen über den Basenamen. */
function templateFolder(plugin: BeautyTasksPlugin, name: string): string {
  return normalizePath(plugin.settings.templatesFolder + "/" + slugify(name));
}

/** Freien Ordnernamen finden (`Urlaub`, `Urlaub 2`, …) – wie createTaskNote es für Dateien tut. */
function freeFolder(app: App, base: string): string {
  let dest = base;
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = base + " " + n; n++; if (n > 200) break; }
  return dest;
}

/** Ist diese Notiz die WURZEL einer Vorlage? Wurzeln haben keinen `parent` innerhalb der Vorlage.
 *  Gelöschte bleiben aussen vor – Löschen setzt wie überall den Papierkorb-Status, statt die Notiz
 *  wegzuwerfen, und eine gelöschte Vorlage soll nicht weiter in der Seitenleiste stehen. */
const isRoot = (t: Task): boolean => !t.parent && !isTrashed(t.status);

/**
 * Alle Vorlagen mit ihrer Grösse, alphabetisch. Liest ausschliesslich aus dem Vorlagen-Index –
 * der Aufgaben-Index weiss von Vorlagen nichts und soll es auch nicht.
 */
export function listTemplates(plugin: BeautyTasksPlugin): TemplateInfo[] {
  return plugin.templates.all()
    .filter(isRoot)
    .map((root) => ({
      root,
      name: root.title,
      kind: templateKind(plugin.app, root.path),
      size: 1 + plugin.templates.descendants(root.path).length,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

/** `template_of` der Wurzel lesen. Fehlt es (von Hand angelegte Notiz), gilt „Aufgabe" – das ist
 *  die harmlosere Annahme: Sie legt EINE Aufgabe an, statt ungefragt ein Projekt zu erzeugen. */
export function templateKind(app: App, path: string): TemplateKind {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof TFile)) return "task";
  return app.metadataCache.getFileCache(f)?.frontmatter?.[TEMPLATE_OF] === "project" ? "project" : "task";
}

/**
 * Eine Aufgabe samt Unterbaum als Vorlage ablegen. Gibt den Pfad der Vorlagen-Wurzel zurück.
 *
 * Die Vorlage übernimmt die Daten UNVERÄNDERT – sie sind der Rhythmus, den sie sich merkt. Erst
 * beim Anwenden werden sie auf einen neuen Anker gerechnet (templatePlan.ts).
 */
export async function saveAsTemplate(plugin: BeautyTasksPlugin, task: Task, kind: TemplateKind = "task"): Promise<string> {
  const folder = freeFolder(plugin.app, templateFolder(plugin, task.title));
  await ensureFolder(plugin.app, folder);
  const target: NoteTarget = { folder, type: TEMPLATE_TYPE };

  const root = await createTaskNote(plugin.app, plugin.settings, {
    title: task.title,
    titleInFrontmatter: task.titleInFm,
    description: task.description,
    status: firstOpenStatus(),
    due: task.due, dueTime: task.dueTime,
    scheduled: task.scheduled, scheduledTime: task.scheduledTime,
    duration: task.duration,
    priority: task.priority,
    // Der Projektverweis der Quelle gehört NICHT in die Vorlage: Wohin sie angewendet wird,
    // entscheidet der Anwenden-Dialog. Ein mitkopierter Verweis wäre eine stille Vorbelegung,
    // die man nicht sieht und die beim Umbenennen des Projekts ins Leere zeigte.
    project: null,
    labels: [...task.labels],
    recurrence: task.recurrence, recurBasis: task.recurBasis,
    reminders: [...task.reminders],
  }, target);

  await plugin.app.fileManager.processFrontMatter(root, (fm: Record<string, unknown>) => { fm[TEMPLATE_OF] = kind; });
  await plugin.duplicateSubtree(task.path, root.basename, { target, project: null });
  return root.path;
}

/**
 * Der Bearbeitungs-Bereich einer Vorlage: gelesen wird aus dem Vorlagen-Index, geschrieben in
 * ihren EIGENEN Ordner. Damit läuft der normale Aufgaben-Editor unverändert auf einer Vorlage –
 * inklusive Unteraufgaben-Sektion, Chips und Kommentaren.
 *
 * Der Ordner kommt aus dem Pfad der Wurzel und nicht aus dem Namen: Bei einer Namenskollision
 * heisst der Ordner „Urlaub 2", und eine neue Unteraufgabe muss dort landen, nicht in „Urlaub".
 */
export function templateEditScope(plugin: BeautyTasksPlugin, rootPath: string): EditScope {
  return {
    index: plugin.templates,
    target: { folder: rootPath.split("/").slice(0, -1).join("/"), type: TEMPLATE_TYPE },
  };
}

export interface ApplyOptions {
  /** Zielprojekt (Basename) oder `null` für den Eingang. */
  project: string | null;
  /** Ankerdatum „YYYY-MM-DD"; `null` = ohne Datum anwenden (die Vorlage behält ihre eigenen). */
  anchor: string | null;
  mode: AnchorMode;
}

/**
 * Eine Vorlage anwenden. Gibt zurück, wie viele Aufgaben entstanden sind.
 *
 * Der Datums-Plan wird über den GANZEN Baum gerechnet, bevor die erste Notiz entsteht: Die
 * Verschiebung ergibt sich aus der Spanne aller Aufgaben, nicht aus der zuerst angefassten.
 * Stückweise gerechnet bekäme jede Aufgabe ihren eigenen Anker und die Abstände wären dahin.
 */
export async function applyTemplate(plugin: BeautyTasksPlugin, rootPath: string, opts: ApplyOptions): Promise<number> {
  const root = plugin.templates.get(rootPath);
  if (!root) return 0;
  const items = [root, ...plugin.templates.descendants(rootPath)];
  const dates = planTemplateDates(items, opts.anchor, opts.mode);
  const d = dates.get(rootPath);

  const created = await createTaskNote(plugin.app, plugin.settings, {
    title: root.title,
    titleInFrontmatter: root.titleInFm,
    description: root.description,
    status: firstOpenStatus(),
    due: d ? d.due : root.due, dueTime: root.dueTime,
    scheduled: d ? d.scheduled : root.scheduled, scheduledTime: root.scheduledTime,
    duration: root.duration,
    priority: root.priority,
    project: opts.project,
    labels: [...root.labels],
    recurrence: root.recurrence, recurBasis: root.recurBasis,
    reminders: d ? [...d.reminders] : [...root.reminders],
  });

  await plugin.duplicateSubtree(rootPath, created.basename, {
    from: plugin.templates,
    dates,
    project: opts.project,
  });
  return items.length;
}

/**
 * Eine leere Vorlage anlegen. Gibt den Pfad der Wurzel zurück.
 *
 * Der übliche Weg zu einer Vorlage ist „Aufgabe als Vorlage speichern" – man hat die Sache ja
 * schon einmal gemacht. Von Null anzufangen bleibt trotzdem nötig, sonst müsste man erst eine
 * Wegwerf-Aufgabe bauen, um sie sofort wieder zu löschen.
 */
export async function createEmptyTemplate(plugin: BeautyTasksPlugin, name: string, kind: TemplateKind = "task"): Promise<string> {
  const folder = freeFolder(plugin.app, templateFolder(plugin, name));
  await ensureFolder(plugin.app, folder);
  const root = await createTaskNote(plugin.app, plugin.settings, {
    title: name, status: firstOpenStatus(), project: null,
  }, { folder, type: TEMPLATE_TYPE });
  await plugin.app.fileManager.processFrontMatter(root, (fm: Record<string, unknown>) => { fm[TEMPLATE_OF] = kind; });
  return root.path;
}

/**
 * Eine Vorlage umbenennen.
 *
 * Geändert werden der angezeigte Name (Frontmatter-`title` der Wurzel) und der Ordnername. Die
 * DATEI der Wurzel behält ihren Namen: Die Kinder verweisen mit `parent: [[Basename]]` auf sie,
 * und ein Umbenennen zöge das Umschreiben jedes Kindes nach sich – für etwas, das niemand sieht.
 * Dieselbe Trennung wie bei Projekten (Name = Referenz, Anzeige = Wert).
 */
export async function renameTemplate(plugin: BeautyTasksPlugin, rootPath: string, newName: string): Promise<void> {
  const file = plugin.app.vault.getAbstractFileByPath(rootPath);
  if (!(file instanceof TFile)) return;
  await setTaskTitle(plugin.app, file, newName);
  const folder = file.parent;
  if (!folder || folder.path === plugin.settings.templatesFolder) return;   // Wurzel liegt (noch) ohne eigenen Ordner
  const dest = freeFolder(plugin.app, templateFolder(plugin, newName));
  if (dest !== folder.path) await plugin.app.fileManager.renameFile(folder, dest);
}

/** Eine Vorlage samt ihres Ordners in den Obsidian-Papierkorb (reversibel, wie bei Projekten). */
export async function deleteTemplate(plugin: BeautyTasksPlugin, rootPath: string): Promise<void> {
  const folder = plugin.app.vault.getAbstractFileByPath(rootPath.split("/").slice(0, -1).join("/"));
  // Der Ordner gehört der Vorlage allein – ihn als Ganzes zu entfernen nimmt auch die Kinder mit,
  // ohne sie einzeln aufsammeln zu müssen. Fehlt er wider Erwarten, bleibt die Wurzel-Notiz.
  if (folder) { await plugin.app.fileManager.trashFile(folder); return; }
  const f = plugin.app.vault.getAbstractFileByPath(rootPath);
  if (f instanceof TFile) await plugin.app.fileManager.trashFile(f);
}

/** Für Anzeigezwecke: der Name der Vorlage, zu der eine Notiz gehört (= ihr Ordnername). */
export const templateNameOf = (path: string): string => baseName(path.split("/").slice(0, -1).join("/"));
