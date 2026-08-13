import { App, Notice, TFile, normalizePath, stringifyYaml } from "obsidian";
import { BeautyTasksSettings, Priority, Task, TaskStatus } from "./types";
import type { ShiftedDates } from "./templatePlan";
import { combineDT, localStamp } from "./format";
import { firstOpenStatus, isDone, isTrashed } from "./statuses";
import { titleKey, fmTitle, findH1Line, replaceHeadingLine, renameHeadingLine, newTaskBody } from "./taskTitle";
import { fieldKey } from "./fieldNames";
import { t } from "./i18n";

export const slugify = (s: string): string =>
  s.replace(/[\\/:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Task";

/** Label-Normalisierung wie bei der Erfassung (klein, ohne #, Leerzeichen→Bindestrich). */
export const normalizeLabel = (s: string): string =>
  slugify(s).toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");

/** Basename (ohne Ordner und `.md`). Die EINE Quelle: Aufgaben verweisen über den Basename auf
 *  Projekt und Elternaufgabe, und genau diese Zeile stand vorher siebenmal im Quelltext – sechsmal
 *  wörtlich gleich, einmal als `projectName` in einer View-Datei, aus der sogar `main.ts` sie zog. */
export const baseName = (path: string): string => path.split("/").pop()!.replace(/\.md$/, "");

export const newId = (p: string): string =>
  p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

// Lokales Datum (YYYY-MM-DD), NICHT UTC: toISOString() würde nachts (lokal 00:00 bis
// UTC-Offset) noch „gestern" liefern. Identisch zur iso()-Logik im Datepicker.
export const todayIso = (): string => {
  const d = new Date();
  const z = (n: number): string => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
};

/** Fehlende Kanon-Felder (`id`, `created`) einer Aufgaben-Notiz nachtragen – idempotent.
 *  Für handgeschriebene `type: task`-Notizen, sobald sie erstmals über die App bearbeitet werden:
 *  hält die Identität über Umbenennen und GCal-Sync stabil. `status`/`project` bleiben unberührt. */
export function ensureCanonicalFm(fm: Record<string, unknown>): void {
  if (fm.id == null || fm.id === "") fm.id = newId("t");
  if (typeof fm.created !== "string" || !fm.created) fm.created = localStamp();
}

/** Frontmatter-Block – nur gesetzte Felder. */
export function buildFrontmatter(obj: Record<string, unknown>): string {
  const clean: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) continue;
    clean[k] = v;
  }
  return "---\n" + stringifyYaml(clean) + "---\n";
}

/** Liegt `path` in diesem Ordner (oder IST er es)? Leerer/ungültiger Ordner = nein. Die EINE
 *  Quelle für Ordner-Zugehörigkeit: genutzt von den Ausschluss-Ordnern (taskIndex) und von der
 *  Herkunftsfrage der Titel-Migration (main). Rein – ohne App, damit testbar. */
export function isUnderFolder(path: string, folder: string): boolean {
  const dir = normalizePath(folder ?? "").replace(/\/+$/, "").trim();
  if (!dir || dir === ".") return false;
  return path === dir || path.startsWith(dir + "/");
}

export async function ensureFolder(app: App, path: string): Promise<void> {
  const p = normalizePath(path);
  if (!app.vault.getAbstractFileByPath(p)) {
    try { await app.vault.createFolder(p); } catch { /* existiert evtl. schon */ }
  }
}

export interface TaskFields {
  title: string;
  titleInFrontmatter?: boolean;  // Titel ins Frontmatter (Default) statt in eine „# Überschrift".
                                 // Explizit false setzen die Kopier-Wege, wenn das Original seinen
                                 // Titel im Text führt – die Kopie hält es dann genauso.
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
  sortOrder?: number | null; // manuelle Position (sort_order). Normalfall: weglassen -> lazy, kein
                             // Feld. Nur gesetzt, wenn eine Reihenfolge bewusst materialisiert wird
                             // (z. B. beim Duplizieren eines Unterbaums), s. filterEngine.planReorder.
}

/**
 * Zeitstempel für eine NEU angelegte Aufgabe. Wird sie gleich als erledigt oder abgebrochen
 * angelegt, gehört der Stempel dazu — sonst fehlt er für immer, denn gesetzt wird er sonst nur
 * beim WECHSEL des Status (setTaskStatus).
 *
 * Das wiegt schwerer, als es aussieht: „Erledigt" und der Papierkorb sortieren absteigend nach
 * diesem Feld, und ein fehlender Wert wird zur leeren Zeichenkette — kleiner als jedes Datum. Die
 * Aufgabe rutschte damit ans ENDE einer womöglich hunderte Einträge langen Liste und galt für den
 * Nutzer als verschwunden. „Heute" zeigt Erledigtes ohnehin nur mit passendem Stempel.
 *
 * Genommen wird der Moment des Anlegens — der einzige Zeitpunkt, den wir kennen, und derselbe,
 * den das Abhaken schreiben würde.
 *
 * `cancelled` ist über die Oberfläche derzeit NICHT erreichbar: Die Statusauswahl beim Anlegen
 * zeigt nur `boardStatuses()`, und die filtert abgebrochene Status heraus (so gewollt — der
 * Papierkorb ist kein Zustand, in dem man etwas anlegt). Der Zweig bleibt trotzdem, weil
 * `createTaskNote` jeden Status entgegennimmt: Käme ein abgebrochener je von woanders (Import,
 * künftiger Aufrufer), stünde ohne ihn derselbe Fehler wieder da — unauffindbar am Ende des
 * Papierkorbs.
 */
export function creationStamps(status: TaskStatus, now: string): { completed: string | null; cancelled: string | null } {
  return {
    completed: isDone(status) ? now : null,
    cancelled: isTrashed(status) ? now : null,
  };
}

/**
 * Zeitstempel bei einem Status WECHSEL. Gegenstück zu `creationStamps`, dieselbe Regel:
 * Ein Stempel gehört zu SEINEM Zustand — er kommt beim Eintritt und geht beim Austritt.
 *
 * Zurückgegeben wird ein Patch: Ein Feld fehlt, wenn es unberührt bleiben soll. `null` heißt
 * ausdrücklich „leeren". So kann der Aufrufer den Unterschied zwischen „nicht anfassen" und
 * „entfernen" nicht versehentlich verlieren.
 *
 * Warum das zählt: Beide Listen (Erledigt, Papierkorb) sortieren absteigend nach ihrem Stempel,
 * und ein fehlender Wert ist die leere Zeichenkette — kleiner als jedes Datum. Eine Aufgabe ohne
 * Stempel steht damit am ENDE ihrer Liste und gilt für den Nutzer als verschwunden.
 */
export function transitionStamps(from: TaskStatus, to: TaskStatus, now: string): { completed?: string | null; cancelled?: string | null } {
  const patch: { completed?: string | null; cancelled?: string | null } = {};
  if (isDone(to) && !isDone(from)) patch.completed = now;
  else if (isDone(from) && !isDone(to)) patch.completed = null;
  if (isTrashed(to) && !isTrashed(from)) patch.cancelled = now;
  else if (isTrashed(from) && !isTrashed(to)) patch.cancelled = null;
  return patch;
}

/**
 * Wohin eine neue Notiz geschrieben wird und unter welchem `type` sie steht.
 *
 * Vorgabe ist die Aufgabe des Vaults (`itemsFolder` + `type: task`). Vorlagen geben hier ihren
 * eigenen Ordner und Typwert mit – dadurch legt DIESELBE Funktion Aufgaben wie Vorlagen an, und
 * es gibt keinen zweiten Schreibweg, der irgendwann auseinanderläuft (s. templateService.ts).
 */
export interface NoteTarget { folder: string; type: string; }

/** Nur der Teil eines Index, den der Kopierer braucht. Strukturell statt `TaskIndex` importiert,
 *  damit taskService keine Abhängigkeit auf den Index bekommt – und damit derselbe Kopierer aus
 *  dem Aufgaben- wie aus dem Vorlagen-Index lesen kann. */
export interface ChildSource { children(path: string): Task[]; }

/**
 * Was ein Kopiervorgang (`duplicateSubtree`) über das blosse Duplizieren hinaus tun soll.
 * Alles optional – ohne Angabe verhält er sich wie bisher: gleicher Ordner, gleicher Typ,
 * gleiche Daten, gleiches Projekt.
 */
export interface DuplicateOpts {
  /** Zielordner + Typwert. Gesetzt beim Speichern ALS Vorlage. */
  target?: NoteTarget;
  /** Verschobene Daten je Quellpfad. Gesetzt beim ANWENDEN einer Vorlage (s. templatePlan.ts). */
  dates?: Map<string, ShiftedDates>;
  /** Zielprojekt für ALLE Kopien. `undefined` = das des Originals behalten, `null` = Eingang. */
  project?: string | null;
  /** Woraus gelesen wird. Vorgabe ist der Aufgaben-Index; Vorlagen liegen im zweiten. */
  from?: ChildSource;
  /** Intern: bereits besuchte Pfade (Kreis-Schutz). Nicht von aussen setzen. */
  seen?: Set<string>;
}

/** Neue Aufgaben-Notiz anlegen (kollisionssicherer Dateiname). */
export async function createTaskNote(app: App, settings: BeautyTasksSettings, f: TaskFields, target?: NoteTarget): Promise<TFile> {
  const folder = target?.folder ?? settings.itemsFolder;
  await ensureFolder(app, folder);
  const slug = slugify(f.title);
  let dest = normalizePath(folder + "/" + slug + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = normalizePath(folder + "/" + slug + " " + n + ".md"); n++;
    if (n > 200) break;
  }
  const status = f.status ?? firstOpenStatus();
  const jetzt = localStamp();
  const stamps = creationStamps(status, jetzt);
  const fm = buildFrontmatter({
    [fieldKey("type")]: target?.type ?? "task",
    id: newId("t"),
    // Regelfall: der Titel steht hier. Nur wenn er ausdrücklich in den Text soll, bleibt das
    // Feld leer (null wird von buildFrontmatter verworfen) und newTaskBody schreibt die H1.
    [titleKey()]: f.titleInFrontmatter === false ? null : f.title,
    status,
    completed: stamps.completed,   // null -> von buildFrontmatter verworfen
    cancelled: stamps.cancelled,
    priority: f.priority && f.priority !== "normal" ? f.priority : undefined,
    due: f.due ? combineDT(f.due, f.dueTime) : null,
    scheduled: f.scheduled ? combineDT(f.scheduled, f.scheduledTime) : null,
    duration: f.duration ?? null,
    project: f.project ? "[[" + f.project + "]]" : null,
    parent: f.parent ? "[[" + f.parent + "]]" : null,
    [fieldKey("labels")]: f.labels ?? [],
    recurrence: f.recurrence ?? null,
    recur_basis: f.recurrence && f.recurBasis === "done" ? "done" : null,
    reminders: f.reminders ?? [],
    sort_order: f.sortOrder ?? null,   // null -> von buildFrontmatter verworfen (lazy, kein Feld)
    // Mit Uhrzeit (wie `completed`): sonst sind alle Aufgaben eines Tages beim Sortieren nach
    // „Erstellt" gleichwertig und die Richtung bleibt ohne sichtbare Wirkung. Ältere Notizen
    // behalten ihr reines Datum – der Vergleich in sortTasks kommt mit beidem zurecht.
    created: jetzt,
    description: (f.description ?? "").trim() || null,   // Beschreibung im Frontmatter, nicht im Body
  });
  return app.vault.create(dest, fm + newTaskBody(f.title, f.titleInFrontmatter !== false));
}

/** Titel einer bestehenden Aufgaben-Notiz setzen – nach der Kaskade aus taskTitle.ts.
 *
 *  Der Reihenfolge liegt eine Zusage zugrunde: Steht der Titel im Frontmatter, wird der Body
 *  NICHT angefasst. Ob `title:` existiert, entscheidet deshalb processFrontMatter (die lebende
 *  Quelle) und nicht der metadataCache – ein veralteter Cache dürfte diese Zusage nie brechen.
 *  Die H1 dagegen wird auf dem frischen Dateiinhalt INNERHALB von process() gesucht, kann also
 *  nicht veralten; passt die Zeile wider Erwarten nicht mehr, landet der Titel im Frontmatter,
 *  statt blind irgendwohin geschrieben zu werden. Der Dateiname bleibt unberührt (Slug/Identität). */
export async function setTaskTitle(app: App, file: TFile, title: string): Promise<void> {
  let inFm = false;
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
    inFm = fmTitle(fm[titleKey()]) !== null;
    if (inFm) fm[titleKey()] = title;
  });
  if (inFm) return;
  let wrote = false;
  await app.vault.process(file, (c) => {
    const line = findH1Line(c);
    if (line === null) return c;
    const out = replaceHeadingLine(c, line, title);
    if (out === null) return c;
    wrote = true;
    return out;
  });
  if (!wrote) await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => { fm[titleKey()] = title; });
}

/** Erste H1 einer Notiz umschreiben – für Notizen, deren Name aus dem DATEINAMEN kommt (Projekte,
 *  Bereiche, gespeicherte Filter). Dort ist die Überschrift reine Kosmetik. Angefasst wird sie nur,
 *  wenn sie noch den ALTEN Namen trägt: Neue Notizen bekommen gar keine mehr, und wer in einer
 *  bestehenden seine eigene Struktur angelegt hat, behält sie. Zeilengenau statt per Regex über den
 *  ganzen Text – sonst träfe es auch ein „# …" in einem Code-Block. */
export async function retitleHeading(app: App, file: TFile, oldTitle: string, newTitle: string): Promise<void> {
  await app.vault.process(file, (c) => renameHeadingLine(c, findH1Line(c), oldTitle, newTitle));
}

/** Obsidian-Deeplink (obsidian://) zur Aufgabe in die Zwischenablage kopieren –
 *  genutzt vom Task-Modal („+"-Menü) UND vom Zeilen-Kontextmenü. */
export function copyTaskLink(app: App, path: string): void {
  const vault = encodeURIComponent(app.vault.getName());
  const file = encodeURIComponent(path.replace(/\.md$/, ""));
  navigator.clipboard.writeText(`obsidian://open?vault=${vault}&file=${file}`)
    .then(() => new Notice(t("msg_link_copied")))
    .catch((err) => { console.error("BeautyTasks: copy link failed", err); new Notice(t("msg_link_copy_failed")); });
}

/**
 * Die Notiz einer Aufgabe im Editor öffnen.
 *
 * `where` wird unverändert an `getLeaf()` durchgereicht und stammt idealerweise aus
 * `Keymap.isModEvent(e)`: Das liefert genau den Wert, den Obsidian erwartet, und folgt damit
 * der Plattform (Cmd auf macOS, Ctrl sonst) und der Einstellung des Nutzers. Eine eigene
 * Auslegung von ctrlKey/shiftKey wiche irgendwann davon ab – und wäre auf macOS schlicht
 * falsch, wo Ctrl+Klick der Rechtsklick ist.
 *
 * Existiert die Notiz nicht mehr (Index noch nicht nachgezogen), passiert bewusst nichts:
 * Ein Fehlklick auf eine gerade gelöschte Zeile soll nicht mit einer Meldung antworten.
 */
export function openTaskNote(app: App, path: string, where: "tab" | "split" | "window" | boolean = "tab"): void {
  const f = app.vault.getAbstractFileByPath(path);
  if (f instanceof TFile) void app.workspace.getLeaf(where).openFile(f);
}

/** Vorhandene Projekte (Basename, alphabetisch) für den Picker. */
export function listProjects(app: App): string[] {
  return app.vault.getMarkdownFiles()
    .filter((file) => app.metadataCache.getFileCache(file)?.frontmatter?.[fieldKey("type")] === "project")
    .map((file) => file.basename)
    .sort((a, b) => a.localeCompare(b, "de"));
}

export interface ProjItem {
  name: string; path: string; icon: string; color: string | null;
  type: "project" | "area"; hidden: boolean; archived: boolean;
  description: string;   // kurze Beschreibung aus dem Frontmatter (Body bleibt dem Nutzer)
}

const byName = (a: ProjItem, b: ProjItem) => a.name.localeCompare(b.name, "de");
const isInbox = (p: ProjItem) => p.name.toLowerCase() === "inbox" || p.name.toLowerCase() === "eingang";

/** Reservierter Routing-Key des Eingangs (eingebaute Ansicht, KEINE Notiz). Der Doppelpunkt ist
 *  in Datei-Pfaden unzulässig – der Key kann daher nie mit einem echten Projekt-Pfad kollidieren. */
export const INBOX_KEY = "bt:inbox";

/** Pfad einer evtl. noch vorhandenen (alten) Inbox-Projekt-Notiz – nur für die Migration. */
export function inboxNotePath(app: App): string | null {
  return allProjItems(app).find(isInbox)?.path ?? null;
}

/** Ist dieser Projekt-NAME der reservierte Eingang? („Inbox"/„Eingang"). */
export const isInboxName = (name: string | null | undefined): boolean => !!name && /^(inbox|eingang)$/i.test(name);

/** Frontmatter-`type`-Werte, die eine Notiz zu einer verweisbaren Liste machen (Projekt ODER
 *  Bereich). Die EINE Wahrheit – nur ein solches Ziel darf ein Aufgaben-`project`-Link auflösen;
 *  ein Verweis auf irgendeine andere Notiz (z. B. ein altes Fremd-Dashboard) zählt nicht. */
export const isProjectType = (type: unknown): boolean => type === "project" || type === "area";

/** Projekt-Verweis (`[[Name]]`) über den BASENAMEN gegen die Karte echter Projekt-/Bereichs-Notizen
 *  auflösen – wie byProject und die ganze basename-zentrierte Projektlogik, NICHT über
 *  getFirstLinkpathDest: bei gleichnamigen Fremd-Notizen (alte Tasks-Plugin-Dashboards `Tasks/Name.md`
 *  mit `view: project`) träfe das den falschen Namensvetter. Kein echtes Projekt mit dem Basenamen
 *  -> null (Aufgabe im Eingang). `projectPaths` ist lowercase-Basename -> Pfad. Rein/ohne App:
 *  vollständig unit-testbar. */
export function resolveProjectPath(linkText: unknown, projectPaths: Map<string, string>): string | null {
  const m = typeof linkText === "string" ? linkText.match(/\[\[([^\]|#]+)/) : null;
  if (!m) return null;
  const base = m[1].trim().split("/").pop()!.toLowerCase();   // Basename, auch bei [[Ordner/Name]]
  return projectPaths.get(base) ?? null;
}

/** „Nicht einsortiert" = im Eingang: kein Projekt ODER Verweis auf die reservierte Inbox-Notiz.
 *  `project` ist ein aufgelöster Pfad (Task.project) ODER ein Basisname (Editor-Feld). */
export const isInboxLink = (project: string | null | undefined): boolean =>
  !project || isInboxName(project.split("/").pop()!.replace(/\.md$/, ""));

/** Alle Projekt-/Bereich-Notizen mit Meta (Typ, Icon, Farbe, Sichtbarkeit, Archiv). */
function allProjItems(app: App): ProjItem[] {
  return app.vault.getMarkdownFiles().flatMap((f) => {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    const ty: unknown = fm?.[fieldKey("type")];
    const type: "project" | "area" | null = ty === "area" ? "area" : ty === "project" ? "project" : null;
    if (!type) return [];
    return [{
      name: f.basename, path: f.path, type,
      // Bereiche immer circle-small (per CSS gefüllt), unabhängig vom icon-Frontmatter.
      // Projekte: eigenes icon-Frontmatter respektieren, sonst Default „folder".
      icon: type === "area" ? "circle-small" : (typeof fm?.icon === "string" && fm.icon ? fm.icon : "folder"),
      color: typeof fm?.color === "string" ? fm.color : null,
      description: typeof fm?.description === "string" ? fm.description : "",
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

export function listProjectsAndAreas(app: App): { bereiche: ProjItem[]; projekte: ProjItem[] } {
  const all = allProjItems(app).filter((p) => !p.archived);
  const bereiche = all.filter((p) => p.type === "area").sort(byName);
  // Eine evtl. noch vorhandene (alte) Inbox-Notiz NIE als Projekt anbieten – der Eingang ist
  // eine eingebaute Ansicht ohne Notiz. Die Migration räumt die Notiz ohnehin weg.
  const projekte = all.filter((p) => p.type === "project" && !isInbox(p)).sort(byName);
  return { bereiche, projekte };
}

/** Bekannte Projekt- und Bereichsnamen – die Liste, gegen die `@Projekt` in der Texterkennung
 *  aufgelöst wird. Bewusst nur BESTEHENDE: Ein Tippfehler soll kein Projekt anlegen, sondern
 *  Text bleiben (s. parseQuickEntry). Beide Eingabe-Masken benutzen dieselbe Liste, damit
 *  dieselbe Eingabe überall dasselbe bedeutet. */
export function knownProjectNames(app: App): string[] {
  const { bereiche, projekte } = listProjectsAndAreas(app);
  return [...bereiche, ...projekte].map((p) => p.name);
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
export async function createProjectNote(app: App, settings: BeautyTasksSettings, name: string, asArea = false, color: string | null = null, hidden = false, description = ""): Promise<string> {
  const folder = settings.projectsFolder;
  await ensureFolder(app, folder);
  const base = slugify(name);
  let dest = normalizePath(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) { dest = normalizePath(folder + "/" + base + " " + n + ".md"); n++; if (n > 200) break; }
  const fm = buildFrontmatter({ [fieldKey("type")]: asArea ? "area" : "project", id: newId("p"), status: "active", color: color ?? undefined, description: description.trim() || undefined, nav_hidden: hidden ? true : undefined, created: todayIso() });
  // Kein „# Name" mehr im Body: Der Name kommt aus dem Dateinamen, die Überschrift wäre redundant –
  // und der Body gehört ab hier vollständig dem Nutzer (s. „Projektnotiz öffnen").
  await app.vault.create(dest, fm + "\n");
  return base;
}

/** Projekt ↔ Bereich umschalten – ändert NUR den Frontmatter-type (kein Verschieben,
 *  keine sonstigen Änderungen). Bereich = type:area, Projekt = type:project. */
export async function setProjectType(app: App, path: string, toArea: boolean): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => { fm[fieldKey("type")] = toArea ? "area" : "project"; });
}

/** Ist die Notiz an diesem Pfad ein Bereich (type: area)? */
export function isAreaPath(app: App, path: string): boolean {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return false;
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return fm?.[fieldKey("type")] === "area";
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

/** Kurzbeschreibung eines Projekts/Bereichs setzen (Frontmatter `description`; leer = entfernen).
 *  Bewusst im Frontmatter und nicht im Body – der gehört dem Nutzer (s. „Notiz öffnen"). */
export async function setProjectDescription(app: App, path: string, description: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return;
  const text = description.trim();
  await app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
    if (text) fm.description = text; else delete fm.description;
  });
}

/** Projekt umbenennen: Datei umbenennen (Obsidian aktualisiert Links) + ggf. die H1-Überschrift,
 *  solange sie noch den alten Namen trägt (s. retitleHeading). */
export async function renameProjectNote(app: App, path: string, newName: string): Promise<string | null> {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof TFile)) return null;
  const oldName = file.basename;   // vor dem Umbenennen merken – danach heißt die Datei anders
  const base = slugify(newName);
  if (!base || base === file.basename) return file.basename;
  const dir = file.parent?.path ?? "";
  const dest = normalizePath((dir ? dir + "/" : "") + base + ".md");
  if (app.vault.getAbstractFileByPath(dest)) return null;   // Namenskollision
  await app.fileManager.renameFile(file, dest);
  const renamed = app.vault.getAbstractFileByPath(dest);
  if (renamed instanceof TFile) await retitleHeading(app, renamed, oldName, newName);
  return base;
}

/** Projekt in den Obsidian-Papierkorb verschieben (reversibel). */
export async function deleteProjectNote(app: App, path: string): Promise<void> {
  const file = app.vault.getAbstractFileByPath(path);
  if (file instanceof TFile) await app.fileManager.trashFile(file);
}
