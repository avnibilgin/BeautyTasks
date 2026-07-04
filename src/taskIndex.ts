import { App, Component, TFile } from "obsidian";
import { Task, TaskStatus, Priority } from "./types";
import { splitContent } from "./detailLog";
import { archivedProjectNames } from "./taskService";

const baseName = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");
const STATUS = new Set<string>(["todo", "doing", "done", "cancelled"]);
const PRIO = new Set<string>(["highest", "high", "medium", "normal", "low", "lowest"]);
const asDate = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
const asTime = (v: unknown): string | null => {
  const m = typeof v === "string" ? v.match(/T(\d{2}:\d{2})/) : null;
  return m ? m[1] : null;
};
const asNum = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);

/** Dünne, reaktive Schicht über metadataCache. Liest Aufgaben aus dem geparsten
 *  Frontmatter (kein eigenes Datei-Lesen/Parsen). Inkrementell über Events. */
export class TaskIndex extends Component {
  private byPath = new Map<string, Task>();
  private byId = new Map<string, string>();        // id -> path (überlebt Umbenennen, für Sync)
  private commentCounts = new Map<string, number>(); // path -> Anzahl [!log]-Einträge (Kommentare/Anhänge)
  private descriptions = new Map<string, string>();  // path -> Beschreibung (Body zwischen Titel und Log)
  private subs = new Set<() => void>();
  private timer: number | null = null;
  private archivedDirty = true;                 // neu berechnen, sobald sich etwas geändert hat
  private archivedSet = new Set<string>();       // Basenamen (lowercase) archivierter Projekte

  constructor(private app: App) { super(); }

  /** Basenamen archivierter Projekte, gecacht bis zur nächsten Änderung (notify setzt dirty). */
  private archivedProjects(): Set<string> {
    if (this.archivedDirty) { this.archivedSet = archivedProjectNames(this.app); this.archivedDirty = false; }
    return this.archivedSet;
  }

  /** NACH onLayoutReady aufrufen – dann sind Wikilinks auflösbar. */
  build(): void {
    this.byPath.clear();
    this.byId.clear();
    for (const f of this.app.vault.getMarkdownFiles()) this.upsert(f, false);

    const { metadataCache: mc, vault } = this.app;
    this.registerEvent(mc.on("changed", (f) => this.upsert(f)));
    // Neu angelegte Dateien: beim "create" ist das Frontmatter noch nicht geparst ->
    // kurz später erneut versuchen (sonst erscheinen neue Aufgaben erst nach Reload).
    this.registerEvent(vault.on("create", (f) => {
      if (f instanceof TFile && f.extension === "md") window.setTimeout(() => this.upsert(f), 80);
    }));
    this.registerEvent(vault.on("delete", (f) => { if (f instanceof TFile) this.remove(f.path); }));
    this.registerEvent(vault.on("rename", (f, old) => {
      this.remove(old, false);
      if (f instanceof TFile) this.upsert(f, false);
      this.notify();
    }));
    this.notify();
  }

  // ── Mutation (inkrementell, nie Vollscan im Betrieb) ──
  private upsert(f: TFile, notify = true): void {
    if (f.extension !== "md") return;
    const t = this.parse(f);
    if (!t) { this.remove(f.path, notify); return; }   // type:task verloren -> raus
    const prev = this.byPath.get(f.path);
    if (prev && prev.id !== t.id) this.byId.delete(prev.id);
    this.byPath.set(f.path, t);
    this.byId.set(t.id, f.path);
    void this.readBodyMeta(f);   // Kommentar-Anzahl + Beschreibung aus dem Body (async, eigenes notify)
    if (notify) this.notify();
  }

  private remove(path: string, notify = true): void {
    const t = this.byPath.get(path);
    this.commentCounts.delete(path);
    this.descriptions.delete(path);
    if (!t) return;
    this.byPath.delete(path);
    if (this.byId.get(t.id) === path) this.byId.delete(t.id);
    if (notify) this.notify();
  }

  /** Anzahl der [!log]-Einträge (Kommentare/Anhänge) einer Aufgabe – für das Chip. */
  commentsOf(path: string): number { return this.commentCounts.get(path) ?? 0; }

  /** Beschreibung einer Aufgabe (Body zwischen Titel und Log) – für die Listen-Vorschau. */
  descriptionOf(path: string): string { return this.descriptions.get(path) ?? ""; }

  /** Body EINMAL lesen: Kommentar-Anzahl + Beschreibung ableiten (cachedRead ist gecacht). */
  private async readBodyMeta(f: TFile): Promise<void> {
    let content: string;
    try { content = await this.app.vault.cachedRead(f); }
    catch { return; }
    const { description } = splitContent(content);
    const n = (content.match(/^>\s*\[!log\]/gim) ?? []).length;
    const prevN = this.commentCounts.get(f.path) ?? 0;
    const prevD = this.descriptions.get(f.path) ?? "";
    if (n) this.commentCounts.set(f.path, n); else this.commentCounts.delete(f.path);
    if (description) this.descriptions.set(f.path, description); else this.descriptions.delete(f.path);
    if (n !== prevN || description !== prevD) this.notify();
  }

  /** Frontmatter -> Task (Defaults + Enum-Schutz). null = keine Aufgabe. */
  private parse(f: TFile): Task | null {
    const cache = this.app.metadataCache.getFileCache(f);
    const fm = cache?.frontmatter;
    if (!fm || fm.type !== "task") return null;
    const link = (v: unknown): string | null => {
      const m = typeof v === "string" ? v.match(/\[\[([^\]|#]+)/) : null;
      const dest = m ? this.app.metadataCache.getFirstLinkpathDest(m[1].trim(), f.path) : null;
      return dest ? dest.path : null;
    };
    return {
      id: String(fm.id ?? f.path),
      path: f.path,
      // Titel aus der „# Überschrift" (ungekürzt) – der Dateiname ist nur ein Slug (max. 80).
      title: cache?.headings?.[0]?.heading ?? f.basename,
      status: (typeof fm.status === "string" && STATUS.has(fm.status) ? fm.status : "todo") as TaskStatus,
      priority: (typeof fm.priority === "string" && PRIO.has(fm.priority) ? fm.priority : "normal") as Priority,
      due: asDate(fm.due),
      dueTime: asTime(fm.due),
      scheduled: asDate(fm.scheduled),
      scheduledTime: asTime(fm.scheduled),
      duration: asNum(fm.duration),
      start: asDate(fm.start),
      project: link(fm.project),
      area: link(fm.area),
      parent: link(fm.parent),
      labels: Array.isArray(fm.labels) ? fm.labels.map(String) : [],
      recurrence: typeof fm.recurrence === "string" ? fm.recurrence : null,
      recurBasis: fm.recur_basis === "done" ? "done" : "due",
      reminders: Array.isArray(fm.reminders) ? fm.reminders.map(String) : [],
      created: typeof fm.created === "string" ? fm.created : "",
      completed: asDate(fm.completed),
      cancelled: asDate(fm.cancelled),
      externalId: fm.external_id != null ? String(fm.external_id) : null,
    };
  }

  // ── Reaktivität ──
  subscribe(cb: () => void): () => void { this.subs.add(cb); return () => this.subs.delete(cb); }
  private notify(): void {
    this.archivedDirty = true;   // Projekt-Notiz könnte (ent)archiviert worden sein
    if (this.timer) return;
    this.timer = window.setTimeout(() => { this.timer = null; this.subs.forEach((cb) => cb()); }, 50);
  }

  // ── Abfragen (für die Views) ──
  all(): Task[] { return [...this.byPath.values()]; }
  get(path: string): Task | undefined { return this.byPath.get(path); }
  getById(id: string): Task | undefined { const p = this.byId.get(id); return p ? this.byPath.get(p) : undefined; }
  /** Offene Aufgaben (todo/doing) OHNE die aus archivierten Projekten – Basis aller
   *  Sammelansichten, damit archivierte Projekte nirgends mehr auftauchen. */
  open(): Task[] {
    const archived = this.archivedProjects();
    return this.all().filter((t) => (t.status === "todo" || t.status === "doing")
      && !(t.project && archived.has(baseName(t.project).toLowerCase())));
  }
  /** True, wenn das Projekt (Basename) archiviert ist – für Ansichten/Zähler, die all() nutzen. */
  isProjectArchived(project: string | null | undefined): boolean {
    return !!project && this.archivedProjects().has(baseName(project).toLowerCase());
  }
  overdue(today: string): Task[] { return this.open().filter((t) => !!t.due && t.due < today); }
  dueToday(today: string): Task[] { return this.open().filter((t) => t.due === today); }
  upcoming(today: string): Task[] {
    return this.open().filter((t) => !!t.due && t.due > today).sort((a, b) => a.due!.localeCompare(b.due!));
  }
  noDate(): Task[] { return this.open().filter((t) => !t.due); }
  done(): Task[] {
    return this.all().filter((t) => t.status === "done")
      .sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  }
  /** Abgebrochene Aufgaben (Papierkorb), neueste zuerst. */
  cancelled(): Task[] {
    return this.all().filter((t) => t.status === "cancelled")
      .sort((a, b) => (b.cancelled ?? "").localeCompare(a.cancelled ?? ""));
  }
  byProject(path: string): Task[] {
    // Nach Basename vergleichen (gleichnamige Notizen können verschiedene Pfade haben).
    const base = (p: string) => p.split("/").pop()!.replace(/\.md$/, "");
    const name = base(path);
    return this.open().filter((t) => !!t.project && base(t.project) === name);
  }
  byLabel(label: string): Task[] { return this.open().filter((t) => t.labels.includes(label)); }
  children(parentPath: string): Task[] { return this.all().filter((t) => t.parent === parentPath); }
  /** Alle Nachfahren (rekursiv, jeder Status) einer Aufgabe – z. B. für Kaskaden-Aktionen. */
  descendants(path: string): Task[] {
    const out: Task[] = [];
    const walk = (p: string): void => { for (const kid of this.children(p)) { out.push(kid); walk(kid.path); } };
    walk(path);
    return out;
  }

  /** Demnächst: künftige datierte Aufgaben, gruppiert nach ISO-Datum (aufsteigend). */
  upcomingByDate(today: string): { date: string; tasks: Task[] }[] {
    const groups = new Map<string, Task[]>();
    for (const t of this.upcoming(today)) {
      const arr = groups.get(t.due!) ?? [];
      arr.push(t); groups.set(t.due!, arr);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, tasks]) => ({ date, tasks }));
  }
}
