import { App, Component, TFile } from "obsidian";
import { Task, Priority, BeautyTasksSettings } from "./types";
import { archivedProjectNames, isInboxName } from "./taskService";
import { isKnownStatus, isOpen, isDone, isTrashed, firstOpenStatus } from "./statuses";
import { orderChain } from "./filterEngine";   // umgekehrt nur `import type` – kein Laufzeit-Zyklus

const baseName = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");
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
  private subs = new Set<() => void>();
  private timer: number | null = null;
  private archivedDirty = true;                 // neu berechnen, sobald sich etwas geändert hat
  private archivedSet = new Set<string>();       // Basenamen (lowercase) archivierter Projekte

  // ── Abfrage-Cache ────────────────────────────────────────────────────────────────────────
  // open() filtert über ALLE Aufgaben und schlägt dabei je Aufgabe den Projekt-Basename nach
  // (String-Split + toLowerCase). Eine einzige Nav-Zeichnung ruft open() rund 30-mal auf (je
  // Projekt, Label, Filter und View-Zähler) – das sind Tausende identischer Durchläufe für Zahlen,
  // die sich zwischendurch gar nicht ändern können. Der Cache wird bei JEDER Mutation verworfen;
  // die Aufrufer mutieren die Ergebnisse nicht (sie filtern/sortieren stets in Kopien).
  private openCache: Task[] | null = null;
  private projectCache: Map<string, Task[]> | null = null;   // Projekt-Basename -> offene Aufgaben
  private labelCache: Map<string, Task[]> | null = null;     // Label -> offene Aufgaben
  private orderKeyCache: Map<string, number[]> | null = null;   // Pfad -> Positionskette (s. orderKey)

  /** Alle abgeleiteten Abfragen verwerfen. Aufrufen, wenn sich Aufgaben ODER Archiv-Status ändern. */
  private invalidate(): void {
    this.openCache = null;
    this.projectCache = null;
    this.labelCache = null;
    this.orderKeyCache = null;
  }

  constructor(private app: App, private getSettings: () => BeautyTasksSettings) { super(); }

  /** Liegt der Pfad in einem der Ausschluss-Ordner? Dann gilt die Notiz NIE als Aufgabe –
   *  Schutz vor fremden `type: task`-Notizen (z. B. anderer Plugins) im Vault-weiten Scan. */
  private isExcluded(path: string): boolean {
    for (const raw of this.getSettings().excludeFolders) {
      const dir = raw.replace(/\/+$/, "").trim();
      if (dir && (path === dir || path.startsWith(dir + "/"))) return true;
    }
    return false;
  }

  /** Basenamen archivierter Projekte, gecacht bis zur nächsten Änderung (notify setzt dirty). */
  private archivedProjects(): Set<string> {
    if (this.archivedDirty) { this.archivedSet = archivedProjectNames(this.app); this.archivedDirty = false; }
    return this.archivedSet;
  }

  /** NACH onLayoutReady aufrufen – dann sind Wikilinks auflösbar. */
  build(): void {
    this.byPath.clear();
    this.byId.clear();
    this.invalidate();
    const files = this.app.vault.getMarkdownFiles();
    for (const f of files) this.upsert(f, false, true);   // Frontmatter sofort, Body separat (s. u.)
    // Body-Metadaten (Beschreibung + Kommentarzahl) asynchron nachladen – und GENAU EINMAL melden.
    // Würde jede Datei einzeln melden (readBodyMeta ruft sonst notify), lösen die Promises über
    // mehrere hundert Millisekunden verteilt auf; der 50-ms-Debounce fasst sie nicht zusammen und
    // die Views zeichnen beim Start mehrfach komplett neu (sichtbar als mehrfaches Ruckeln).
    // NUR Aufgaben lesen (byPath), nicht jede Notiz des Vaults – der Body-Read ist Datei-I/O.
    const tasks = files.filter((f) => this.byPath.has(f.path));
    void Promise.all(tasks.map((f) => this.readBodyMeta(f, false))).then((changed) => {
      if (changed.some(Boolean)) this.notify();
    });

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
  private upsert(f: TFile, notify = true, skipBody = false): void {
    if (f.extension !== "md") return;
    const t = this.parse(f);
    if (!t) {
      // Keine Aufgabe – aber PROJEKT-/BEREICHS-Notizen beeinflussen den Index trotzdem: ihr
      // `status: archived` steuert open(), die Zähler und die Suche. remove() steigt bei einer
      // Nicht-Aufgabe sofort aus (der Pfad steht ja nicht im Index) und würde weder den Cache
      // verwerfen noch melden – der Archiv-Zustand bliebe veraltet, bis zufällig etwas anderes
      // eine Meldung auslöst. Deshalb hier gezielt anstoßen.
      const type: unknown = this.app.metadataCache.getFileCache(f)?.frontmatter?.type;
      if (notify && (type === "project" || type === "area")) this.notify();
      this.remove(f.path, notify);
      return;
    }
    const prev = this.byPath.get(f.path);
    if (prev && prev.id !== t.id) this.byId.delete(prev.id);
    this.byPath.set(f.path, t);
    this.byId.set(t.id, f.path);
    this.invalidate();
    // skipBody: nur beim initialen build – dort werden die Bodys gesammelt geladen (ein notify).
    if (!skipBody) void this.readBodyMeta(f);   // Kommentar-Anzahl + Beschreibung (async, eigenes notify)
    if (notify) this.notify();
  }

  private remove(path: string, notify = true): void {
    const t = this.byPath.get(path);
    this.commentCounts.delete(path);
    if (!t) return;
    this.byPath.delete(path);
    if (this.byId.get(t.id) === path) this.byId.delete(t.id);
    this.invalidate();
    if (notify) this.notify();
  }

  /** Anzahl der [!log]-Einträge (Kommentare/Anhänge) einer Aufgabe – für das Chip. */
  commentsOf(path: string): number { return this.commentCounts.get(path) ?? 0; }

  /** Body EINMAL lesen: Kommentar-Anzahl ableiten (cachedRead ist gecacht). Die Beschreibung
   *  lebt im Frontmatter (`description`) und kommt aus parse() – hier wird sie nicht mehr gelesen.
   *  Gibt zurück, ob sich die Zahl geändert hat. `notify = false` unterdrückt die Meldung. */
  private async readBodyMeta(f: TFile, notify = true): Promise<boolean> {
    let content: string;
    try { content = await this.app.vault.cachedRead(f); }
    catch { return false; }
    const n = (content.match(/^>\s*\[!log\]/gim) ?? []).length;
    const prevN = this.commentCounts.get(f.path) ?? 0;
    if (n) this.commentCounts.set(f.path, n); else this.commentCounts.delete(f.path);
    const changed = n !== prevN;
    if (changed && notify) this.notify();
    return changed;
  }

  /** Frontmatter -> Task (Defaults + Enum-Schutz). null = keine Aufgabe. */
  private parse(f: TFile): Task | null {
    if (this.isExcluded(f.path)) return null;   // Notizen in Ausschluss-Ordnern sind keine Aufgaben
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
      // Unbekannter/leerer Status -> erste offene Phase, damit die Aufgabe sichtbar bleibt (statt
      // Status-Limbo). Ausnahme: der reservierte Sentinel "cancelled" bleibt erhalten, sonst würden
      // abgebrochene Aufgaben ohne definierten Abgebrochen-Status wieder als aktiv auftauchen.
      status: typeof fm.status === "string" && isKnownStatus(fm.status) ? fm.status
        : fm.status === "cancelled" ? "cancelled" : firstOpenStatus(),
      priority: (typeof fm.priority === "string" && PRIO.has(fm.priority) ? fm.priority : "normal") as Priority,
      due: asDate(fm.due),
      dueTime: asTime(fm.due),
      scheduled: asDate(fm.scheduled),
      scheduledTime: asTime(fm.scheduled),
      duration: asNum(fm.duration),
      sortOrder: asNum(fm.sort_order),
      start: asDate(fm.start),
      project: link(fm.project),
      parent: link(fm.parent),
      labels: Array.isArray(fm.labels) ? fm.labels.map(String) : [],
      description: typeof fm.description === "string" ? fm.description : "",
      recurrence: typeof fm.recurrence === "string" ? fm.recurrence : null,
      recurBasis: fm.recur_basis === "done" ? "done" : "due",
      reminders: Array.isArray(fm.reminders) ? fm.reminders.map(String) : [],
      created: typeof fm.created === "string" ? fm.created : "",
      completed: typeof fm.completed === "string" ? fm.completed : null,   // voller Zeitstempel (Uhrzeit für Erledigt-Sortierung)
      cancelled: typeof fm.cancelled === "string" ? fm.cancelled : null,   // voller Zeitstempel (Uhrzeit für Papierkorb-Sortierung)
      externalId: fm.external_id != null ? String(fm.external_id) : null,
    };
  }

  // ── Reaktivität ──
  subscribe(cb: () => void): () => void { this.subs.add(cb); return () => this.subs.delete(cb); }
  private notify(): void {
    this.archivedDirty = true;   // Projekt-Notiz könnte (ent)archiviert worden sein
    this.invalidate();
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
    if (this.openCache) return this.openCache;
    const archived = this.archivedProjects();
    this.openCache = this.all().filter((t) => isOpen(t.status)
      && !(t.project && archived.has(baseName(t.project).toLowerCase())));
    return this.openCache;
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
  done(): Task[] {
    return this.all().filter((t) => isDone(t.status))
      .sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  }
  /** Abgebrochene Aufgaben (Papierkorb), neueste zuerst. */
  cancelled(): Task[] {
    return this.all().filter((t) => isTrashed(t.status))
      .sort((a, b) => (b.cancelled ?? "").localeCompare(a.cancelled ?? ""));
  }
  /** Offene Aufgaben je Projekt-Basename – EINMAL gruppiert statt je Projekt ein Vollscan.
   *  (Basename, weil gleichnamige Notizen verschiedene Pfade haben können.) */
  private byProjectMap(): Map<string, Task[]> {
    if (this.projectCache) return this.projectCache;
    const m = new Map<string, Task[]>();
    for (const t of this.open()) {
      if (!t.project) continue;
      const name = baseName(t.project);
      const arr = m.get(name);
      if (arr) arr.push(t); else m.set(name, [t]);
    }
    this.projectCache = m;
    return m;
  }
  byProject(path: string): Task[] {
    return this.byProjectMap().get(baseName(path)) ?? [];
  }

  /** Eingang, ALLE Status (fürs Board): „nicht einsortiert" = alter `[[Inbox]]`-Verweis ODER
   *  (optional, per Einstellung) gar kein Projekt. Papierkorb bleibt außen vor (globaler Papierkorb). */
  inbox(): Task[] {
    const filed = this.all().filter((t) => t.project != null && isInboxName(baseName(t.project)) && !isTrashed(t.status));
    const unfiled = this.getSettings().showUnfiledInInbox ? this.all().filter((t) => !t.project && !isTrashed(t.status)) : [];
    return [...filed, ...unfiled];
  }

  /** Offene Eingangs-Aufgaben – für den Sidebar-Zähler. */
  inboxOpen(): Task[] {
    return this.inbox().filter((t) => isOpen(t.status));
  }

  /** Offene Aufgaben je Label – ebenfalls einmal gruppiert (eine Aufgabe kann mehrere haben). */
  private byLabelMap(): Map<string, Task[]> {
    if (this.labelCache) return this.labelCache;
    const m = new Map<string, Task[]>();
    for (const t of this.open()) {
      for (const l of t.labels) {
        const arr = m.get(l);
        if (arr) arr.push(t); else m.set(l, [t]);
      }
    }
    this.labelCache = m;
    return m;
  }
  byLabel(label: string): Task[] { return this.byLabelMap().get(label) ?? []; }
  /**
   * Sortierschlüssel der Handreihenfolge (s. filterEngine.orderChain), gecacht je Pfad.
   *
   * Lexikografisch verglichen ergibt die Kette in JEDER Darstellung dieselbe Ordnung: Kinder
   * folgen ihrem Elter und stehen untereinander in der gewählten Reihenfolge. Auch dann, wenn der
   * Elter gar nicht in der sortierten Liste vorkommt (Label-Gruppe ohne ihn) – die Unteraufgabe
   * sortiert an der Stelle, an der ihr Elter stünde, statt willkürlich. Deshalb lebt der Schlüssel
   * hier und nicht in sortTasks: er braucht den ganzen Bestand, nicht nur die übergebene Liste.
   */
  orderKey(task: Task): number[] {
    if (!this.orderKeyCache) this.orderKeyCache = new Map<string, number[]>();
    const cache: Map<string, number[]> = this.orderKeyCache;
    const hit = cache.get(task.path);
    if (hit) return hit;
    const chain = orderChain(task, (p) => this.byPath.get(p));
    cache.set(task.path, chain);
    return chain;
  }

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
