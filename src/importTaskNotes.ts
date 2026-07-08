// Import aus dem TaskNotes-Plugin (callumalpass). TaskNotes speichert wie BeautyTasks eine
// Markdown-Notiz pro Aufgabe mit Frontmatter → Migration = Frontmatter-Ummappen. Erzeugt
// ExportTask-Records und nutzt den gemeinsamen, idempotenten importData()-Writer (Dedup über
// external_id, Auto-Anlage von Projekten/Labels). Nicht-destruktiv: Original-Dateien bleiben.
import { App, Modal, Notice, Setting, TFile, normalizePath } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority } from "./types";
import { ExportList, ExportTask, makeImportData, importData } from "./importExport";
import { firstOpenStatus, firstDoneStatus, isDone, isKnownStatus } from "./statuses";
import { todayIso } from "./taskService";
import { t } from "./i18n";

/** TaskNotes-Standard-Feldnamen (Spec v0.2.0). Alle in TaskNotes konfigurierbar; hier die Defaults. */
type Role = "title" | "status" | "priority" | "due" | "scheduled" | "contexts" | "projects"
  | "tags" | "timeEstimate" | "recurrence" | "completedDate" | "dateCreated" | "dateModified" | "id";
const DEFAULT_MAPPING: Record<Role, string> = {
  title: "title", status: "status", priority: "priority", due: "due", scheduled: "scheduled",
  contexts: "contexts", projects: "projects", tags: "tags", timeEstimate: "timeEstimate",
  recurrence: "recurrence", completedDate: "completedDate", dateCreated: "dateCreated",
  dateModified: "dateModified", id: "id",
};

// TaskNotes-Status/Priorität → BeautyTasks (semantische Standard-Zuordnung; Unbekanntes fällt auf offen/normal).
const STATUS_MAP: Record<string, string> = {
  open: "todo", todo: "todo", backlog: "todo", "in-progress": "doing", "in progress": "doing",
  doing: "doing", started: "doing", done: "done", completed: "done", complete: "done",
  finished: "done", closed: "done", cancelled: "cancelled", canceled: "cancelled",
};
const PRIO_MAP: Record<string, Priority> = {
  lowest: "lowest", low: "low", none: "normal", normal: "normal", medium: "medium",
  high: "high", highest: "highest", urgent: "highest", critical: "highest",
};
const VALID_PRIO = new Set<Priority>(["highest", "high", "medium", "normal", "low", "lowest"]);

// ── kleine Helfer ──
const asStr = (v: unknown): string => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  if (v instanceof Date) return v.toISOString();
  return "";   // Objekte/Arrays: kein sinnvoller Skalar-String
};
const toStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.map(asStr).map((x) => x.trim()).filter(Boolean)
    : (typeof v === "string" && v.trim() ? [v.trim()] : []);
const uniq = (a: string[]): string[] => [...new Set(a)];
const numOrNull = (v: unknown): number | null =>
  typeof v === "number" ? v : (typeof v === "string" && /^\d+$/.test(v.trim()) ? parseInt(v, 10) : null);
const stripFrontmatter = (content: string): string => content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");

/** Basename aus einem Wikilink (oder Klartext) ziehen. */
export function linkBase(s: string): string {
  const m = s.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  const raw = (m ? m[1] : s).trim();
  return raw.split("/").pop()!.replace(/\.md$/i, "").trim();
}

/** Datum/Datetime („2026-02-20" oder „2026-01-10T09:30:00Z") in Datum + HH:mm zerlegen. */
export function splitDT(v: unknown): { date: string | null; time: string | null } {
  const s = asStr(v).trim();
  if (!s) return { date: null, time: null };
  const ti = s.indexOf("T");
  if (ti === -1) return { date: s.slice(0, 10), time: null };
  const time = s.slice(ti + 1, ti + 6);
  return { date: s.slice(0, 10), time: /^\d\d:\d\d$/.test(time) ? time : null };
}

/** RRULE (RFC 5545) → BeautyTasks-Recurrence-Text. Nur FREQ+INTERVAL abbildbar; bei Zusatzregeln
 *  (BYDAY, COUNT, UNTIL …) Annäherung + Original zur Notiz. Unbekannt → keine Recurrence, Original gemerkt. */
export function rruleToRecurrence(v: unknown): { recurrence: string | null; lossyOriginal: string | null } {
  const s = asStr(v).trim();
  if (!s) return { recurrence: null, lossyOriginal: null };
  const parts: Record<string, string> = {};
  for (const seg of s.split(";")) {
    const p = seg.trim();
    if (!p || /^DTSTART/i.test(p) || /^RRULE/i.test(p)) continue;   // Start-Datum/Prefix sind keine Zusatzregeln
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    parts[p.slice(0, eq).toUpperCase().trim()] = p.slice(eq + 1).trim();
  }
  const unit = ({ DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" } as Record<string, string>)[parts.FREQ?.toUpperCase()];
  if (!unit) return { recurrence: null, lossyOriginal: s };
  const n = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;
  const recurrence = "every " + (n > 1 ? n + " " + unit + "s" : unit);
  const IGNORED = new Set(["FREQ", "INTERVAL", "WKST"]);   // beeinflussen die Basis-Übersetzung nicht
  const hasExtra = Object.keys(parts).some((k) => !IGNORED.has(k));
  return { recurrence, lossyOriginal: hasExtra ? s : null };
}

export function mapStatus(raw: string): string {
  const key = raw.trim().toLowerCase();
  if (raw && isKnownStatus(raw)) return raw;   // gleicher Custom-Status-Name
  return STATUS_MAP[key] ?? firstOpenStatus();
}
export function mapPriority(raw: string): Priority {
  const key = raw.trim().toLowerCase() as Priority;
  if (VALID_PRIO.has(key)) return key;
  return PRIO_MAP[key] ?? "normal";
}

/** Alle TaskNotes-Notizen finden: Frontmatter trägt den Task-Tag (Default „task"); optional auf einen Ordner begrenzt. */
export function scanTaskNotes(app: App, taskTag: string, folder: string, tagsKey: string): { file: TFile; fm: Record<string, unknown> }[] {
  const tag = taskTag.replace(/^#/, "").trim().toLowerCase();
  const pref = folder.trim() ? normalizePath(folder.trim()) + "/" : null;
  const out: { file: TFile; fm: Record<string, unknown> }[] = [];
  for (const f of app.vault.getMarkdownFiles()) {
    if (pref && !f.path.startsWith(pref)) continue;
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    if (!fm) continue;
    if (tag) {
      const tags = toStrArr(fm[tagsKey]).map((x) => x.replace(/^#/, "").toLowerCase());
      if (!tags.includes(tag)) continue;
    }
    out.push({ file: f, fm });
  }
  return out;
}

/** Gefundene TaskNotes-Notizen in importierbare Records umwandeln (liest die Notiz-Bodies für die Beschreibung). */
async function buildImportData(app: App, files: { file: TFile; fm: Record<string, unknown> }[], mapping: Record<Role, string>, taskTag: string): Promise<{ tasks: ExportTask[]; lists: ExportList[]; labels: string[]; lossy: number }> {
  const tag = taskTag.replace(/^#/, "").trim().toLowerCase();
  const listByKey = new Map<string, ExportList>();
  const labelSet = new Set<string>();
  const tasks: ExportTask[] = [];
  let lossy = 0;

  for (const { file, fm } of files) {
    const get = (r: Role): unknown => fm[mapping[r]];
    const title = (asStr(get("title")).trim() || file.basename).trim();

    // Status + Erledigungs-Zeitstempel
    const completedRaw = asStr(get("completedDate")).trim();
    let status = mapStatus(asStr(get("status")));
    let completed: string | null = null;
    if (completedRaw) { status = firstDoneStatus(); completed = completedRaw; }
    else if (isDone(status)) { completed = asStr(get("dateModified")).trim() || todayIso(); }

    // Datumsfelder
    const due = splitDT(get("due"));
    const sched = splitDT(get("scheduled"));

    // Projekte: erstes = project, weitere → Labels; Projekt-Liste sammeln (auto-anlegen)
    const projects = toStrArr(get("projects")).map(linkBase).filter(Boolean);
    const project = projects[0] ?? null;
    if (project) { const k = project.toLowerCase(); if (!listByKey.has(k)) listByKey.set(k, { name: project, type: "project", color: null, archived: false }); }

    // Labels = Contexts (@ ab) + Tags (ohne Task-Tag) + überzählige Projekte
    const contexts = toStrArr(get("contexts")).map((c) => c.replace(/^@/, "").trim()).filter(Boolean);
    const tnTags = toStrArr(get("tags")).map((x) => x.replace(/^#/, "").trim()).filter((x) => x && x.toLowerCase() !== tag);
    const labels = uniq([...contexts, ...tnTags, ...projects.slice(1)]);
    for (const l of labels) labelSet.add(l);

    // Recurrence (RRULE → Text); Verlust → Original in die Beschreibung
    const rec = rruleToRecurrence(get("recurrence"));
    let body = stripFrontmatter(await app.vault.cachedRead(file)).trim();
    if (rec.lossyOriginal) { body = (body ? body + "\n\n" : "") + "> [TaskNotes recurrence] " + rec.lossyOriginal; lossy++; }

    tasks.push({
      id: "", externalId: asStr(get("id")).trim() || file.path,
      title, status, priority: mapPriority(asStr(get("priority"))),
      due: due.date, dueTime: due.time, scheduled: sched.date, scheduledTime: sched.time,
      duration: numOrNull(get("timeEstimate")), start: null,
      project, parent: null, labels, recurrence: rec.recurrence, recurBasis: "due",
      reminders: [], created: (asStr(get("dateCreated")).trim() || todayIso()).slice(0, 10),
      completed, cancelled: null, description: body,
    });
  }
  return { tasks, lists: [...listByKey.values()], labels: [...labelSet], lossy };
}

/** Dialog: Quelle wählen (Task-Tag/Ordner), Vorschau, nicht-destruktiv importieren. */
export class ImportTaskNotesModal extends Modal {
  private taskTag = "task";
  private folder = "";
  private countEl!: HTMLElement;

  constructor(private plugin: BeautyTasksPlugin) { super(plugin.app); }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-new-modal");
    contentEl.createEl("h3", { text: t("tn_import_title") });
    contentEl.createEl("p", { cls: "bt-confirm-msg", text: t("tn_import_desc") });

    new Setting(contentEl).setName(t("tn_import_tag")).setDesc(t("tn_import_tag_desc"))
      .addText((tx) => tx.setPlaceholder("task").setValue(this.taskTag).onChange((v) => { this.taskTag = v; this.updateCount(); }));
    new Setting(contentEl).setName(t("tn_import_folder")).setDesc(t("tn_import_folder_desc"))
      .addText((tx) => tx.setPlaceholder(t("tn_import_folder_ph")).setValue(this.folder).onChange((v) => { this.folder = v; this.updateCount(); }));

    this.countEl = contentEl.createDiv({ cls: "bt-filter-count" });
    this.updateCount();

    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: t("tn_import_btn") }).onclick = () => void this.run();
  }

  onClose(): void { this.contentEl.empty(); }

  private updateCount(): void {
    const n = scanTaskNotes(this.app, this.taskTag, this.folder, DEFAULT_MAPPING.tags).length;
    this.countEl.setText(t("tn_import_found", n));
  }

  private async run(): Promise<void> {
    const files = scanTaskNotes(this.app, this.taskTag, this.folder, DEFAULT_MAPPING.tags);
    if (!files.length) { new Notice(t("tn_import_none")); return; }
    try {
      const { tasks, lists, labels, lossy } = await buildImportData(this.app, files, DEFAULT_MAPPING, this.taskTag);
      const r = await importData(this.plugin, makeImportData(lists, labels, tasks));
      // Importierte Labels in der Seitenleiste einblenden (wie importierte Projekte sichtbar sind).
      let shown = false;
      for (const l of labels) {
        if (l && !this.plugin.settings.visibleLabels.includes(l)) { this.plugin.settings.visibleLabels.push(l); shown = true; }
      }
      if (shown) await this.plugin.saveSettings();
      this.close();
      new Notice(t("tn_import_done", r.created, r.skipped) + (lossy ? " " + t("tn_import_lossy", lossy) : ""));
      window.setTimeout(() => this.plugin.index.build(), 800);   // Frontmatter der neuen Notizen ist erst kurz später im Cache
    } catch (e) {
      console.error("BeautyTasks TaskNotes import error", e);
      new Notice(t("tn_import_failed"));
    }
  }
}
