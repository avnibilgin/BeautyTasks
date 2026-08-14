import { App, Component, TFile } from "obsidian";
import { Task, Priority, BeautyTasksSettings } from "./types";
import { archivedProjectNames, isInboxName, isProjectType, resolveProjectPath, baseName, isUnderFolder } from "./taskService";
import { isKnownStatus, isOpen, isDone, isTrashed, firstOpenStatus } from "./statuses";
import { titleKey, fmTitle, firstH1, resolveTitle } from "./taskTitle";
import { fieldKey, labelKey } from "./fieldNames";
import { orderChain, severReferences, agendaDate, isOverdueTask, isTodayTask, isUpcomingTask } from "./filterEngine";   // umgekehrt nur `import type` – kein Laufzeit-Zyklus

const PRIO = new Set<string>(["highest", "high", "medium", "normal", "low", "lowest"]);
const asDate = (v: unknown): string | null =>
  typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
const asTime = (v: unknown): string | null => {
  const m = typeof v === "string" ? v.match(/T(\d{2}:\d{2})/) : null;
  return m ? m[1] : null;
};
const asNum = (v: unknown): number | null => (typeof v === "number" && isFinite(v) ? v : null);

/**
 * Woraus dieser Index seine Einträge zieht. Es gibt zwei Ausprägungen und sonst keine:
 *
 *   TASK_SCOPE      – die Aufgaben des Vaults (`type: task`), überall ausser in den
 *                     Ausschluss-Ordnern und im Vorlagen-Ordner.
 *   TEMPLATE_SCOPE  – die Vorlagen (`type: template`), NUR im Vorlagen-Ordner.
 *
 * Warum ein zweiter Index derselben Klasse statt einer Sonderbehandlung IM Index: Vorlagen sind
 * Aufgabenbäume mit exakt derselben Struktur, nur an einem anderen Ort und mit einem anderen
 * Typwert. Als eigener Index sind sie für jede Ansicht, jeden Zähler, den Google-Sync und den
 * Erinnerungs-Scan schlicht nicht vorhanden – ohne dass an einer dieser Stellen eine Zeile
 * Ausschluss stünde. Genau diese Ausschluss-Zeilen sind die Fehlerquelle, die wir vermeiden.
 */
export interface IndexScope {
  /** Frontmatter-`type`-Wert, an dem dieser Index seine Notizen erkennt. */
  typeValue: string;
  /** Ordner, auf den sich dieser Index beschränkt. Fehlt er, gilt der ganze Vault. */
  restrictTo?: (s: BeautyTasksSettings) => string;
}

export const TASK_SCOPE: IndexScope = { typeValue: "task" };
export const TEMPLATE_SCOPE: IndexScope = { typeValue: "template", restrictTo: (s) => s.templatesFolder };

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
  // Auflösungs-Karte für project-Verweise. Bewusst NUR bei Projekt-/Bereichs-Änderungen neu gebaut
  // (nicht bei jeder Aufgaben-Änderung) -> projectLink ist O(1)-Lookup ohne Vault-Scan pro Bearbeitung.
  private projPathDirty = true;
  private projPathSet = new Map<string, string>(); // lowercase Basename -> Pfad der Projekt-/Bereichs-Notiz
  /** Wurde der Index MINDESTENS EINMAL aufgebaut? Vorher ist er nicht leer, sondern UNBEKANNT –
   *  wer daraus „dieser Vault hat nichts davon" schließt, irrt (s. ready). */
  private built = false;
  /** Sind die Abos schon verdrahtet? build() wird mehrfach gerufen (Migrationen, Importe, s.
   *  main.ts) und registrierte bis hierher JEDES MAL neue Handler auf metadataCache/vault. Nach
   *  drei Aufbauten lief upsert bei jeder Dateiänderung dreifach – unsichtbar, aber teuer. */
  private wired = false;

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
  private childCache: Map<string, Task[]> | null = null;     // Eltern-Pfad -> Unteraufgaben (s. byParentMap)

  /** Alle abgeleiteten Abfragen verwerfen. Aufrufen, wenn sich Aufgaben ODER Archiv-Status ändern. */
  private invalidate(): void {
    this.openCache = null;
    this.projectCache = null;
    this.labelCache = null;
    this.orderKeyCache = null;
    this.childCache = null;
  }

  constructor(private app: App, private getSettings: () => BeautyTasksSettings,
              private scope: IndexScope = TASK_SCOPE) { super(); }

  /**
   * Gehört diese Notiz in DIESEN Index? Zwei Ausprägungen, eine Frage (s. IndexScope).
   *
   * Ordner-gebunden (Vorlagen): nur innerhalb des eigenen Ordners. Steht dort nichts (der Nutzer
   * hat das Feld geleert), indiziert dieser Index NICHTS – ein leerer Ordnername darf nie zu
   * „ganzer Vault" werden, sonst zöge der Vorlagen-Index plötzlich fremde `type: template`-Notizen
   * ein (Templater-Nutzer markieren so gern ihre Bausteine).
   *
   * Vault-weit (Aufgaben): überall ausser in den Ausschluss-Ordnern des Nutzers – Schutz vor
   * fremden `type: task`-Notizen anderer Plugins – UND ausser im Vorlagen-Ordner. Letzteres ist
   * Gürtel zum Hosenträger: Vorlagen tragen `type: template` und fielen schon am Typ-Tor durch.
   * Schreibt aber jemand von Hand `type: task` in eine Vorlagen-Notiz, stünde sie sonst als echte
   * Aufgabe in Heute, im Kalender, im Google-Sync und im Erinnerungs-Scan.
   */
  private inScope(path: string): boolean {
    const s = this.getSettings();
    if (this.scope.restrictTo) {
      const only = this.scope.restrictTo(s);
      return !!only && isUnderFolder(path, only);
    }
    if (s.templatesFolder && isUnderFolder(path, s.templatesFolder)) return false;
    return !s.excludeFolders.some((dir) => isUnderFolder(path, dir));
  }

  /** Basenamen archivierter Projekte, gecacht bis zur nächsten Änderung (notify setzt dirty). */
  private archivedProjects(): Set<string> {
    if (this.archivedDirty) { this.archivedSet = archivedProjectNames(this.app); this.archivedDirty = false; }
    return this.archivedSet;
  }

  /** lowercase Basename -> Pfad der Projekt-/Bereichs-Notiz. Neu berechnet NUR wenn projPathDirty
   *  (gesetzt bei Projekt-/Bereichs-Änderungen), nicht bei Aufgaben-Änderungen. Damit ist die
   *  project-Auflösung in parse() ein reiner Map-Lookup ohne wiederholten Vault-Scan. */
  private projectPaths(): Map<string, string> {
    if (this.projPathDirty) {
      const m = new Map<string, string>();
      for (const f of this.app.vault.getMarkdownFiles()) {
        const ty: unknown = this.app.metadataCache.getFileCache(f)?.frontmatter?.[fieldKey("type")];
        if (isProjectType(ty)) m.set(f.basename.toLowerCase(), f.path);
      }
      this.projPathSet = m; this.projPathDirty = false;
    }
    return this.projPathSet;
  }

  /** War dieser Pfad zuletzt eine Projekt-/Bereichs-Notiz? Zum Invalidieren der Karte, wenn eine
   *  solche Notiz gelöscht wird oder aufhört, Projekt zu sein. */
  private isMappedProjectPath(path: string): boolean {
    for (const p of this.projPathSet.values()) if (p === path) return true;
    return false;
  }

  /**
   * Steht der Index? Solange das false ist, heißt „keine Aufgabe mit diesem Label" NICHT „gibt es
   * nicht", sondern „noch nicht nachgesehen". Genau diese beiden Zustände hat die Seitenleiste
   * bis 1.39.0 verwechselt und beim Start „+ Label erstellen" angeboten, obwohl der Vault voller
   * Labels war (s. renderNavInto).
   */
  get ready(): boolean { return this.built; }

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

    this.built = true;
    if (this.wired) { this.notify(); return; }   // Abos nur EINMAL verdrahten (s. wired)
    this.wired = true;

    const { metadataCache: mc, vault } = this.app;
    this.registerEvent(mc.on("changed", (f) => this.upsert(f)));
    // Sicherheitsnetz gegen einen kalten Metadaten-Cache: `onLayoutReady` sagt NICHTS darüber, ob
    // Obsidian mit dem Indizieren fertig ist – das ist ein eigenes Ereignis ("resolved": „Called
    // when all files has been resolved", obsidian.d.ts). War der Cache beim Aufbau noch kalt,
    // stünde der Index sonst dauerhaft zu kurz: Aufgaben, deren Frontmatter erst danach ankommt,
    // meldet "changed" zwar – Dateien, die Obsidian aus seinem Cache lädt, aber nicht.
    // Einmal nachbauen, dann abmelden; Folge-"resolved" (jede spätere Änderung) sind uninteressant.
    const nachbauen = mc.on("resolved", () => { mc.offref(nachbauen); this.build(); });
    this.registerEvent(nachbauen);
    // Neu angelegte Dateien: beim "create" ist das Frontmatter noch nicht geparst ->
    // kurz später erneut versuchen (sonst erscheinen neue Aufgaben erst nach Reload).
    this.registerEvent(vault.on("create", (f) => {
      if (f instanceof TFile && f.extension === "md") window.setTimeout(() => this.upsert(f), 80);
    }));
    this.registerEvent(vault.on("delete", (f) => {
      if (!(f instanceof TFile) || f.extension !== "md") return;
      const wasProject = this.isMappedProjectPath(f.path);
      if (wasProject) this.projPathDirty = true;   // gelöschtes Projekt -> Auflösungs-Karte neu bauen
      this.remove(f.path);                          // war es eine Aufgabe: raus + gemeldet
      // Aufgaben, die auf die gelöschte Notiz zeigten (Projekt ODER Eltern-Aufgabe), SOFORT umhängen:
      // parse() läuft beim Löschen des Verweisziels nicht von allein, der aufgelöste Pfad bliebe
      // hängen (Aufgabe weiter im gelöschten Projekt statt im Eingang). Deterministisch kappen,
      // unabhängig davon, wann der Metadaten-Cache nachzieht.
      const severed = severReferences([...this.byPath.values()], f.path);
      for (const t of severed) this.byPath.set(t.path, t);
      if (wasProject || severed.length) this.notify();
    }));
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
    // Ordner-gebundener Index (Vorlagen): alles ausserhalb geht ihn nichts an – auch nicht der
    // Projekt-Zweig unten, der sonst bei JEDER fremden Dateiänderung im Vault eine Meldung
    // auslöste und damit die Vorlagen-Ansicht grundlos neu zeichnen liesse.
    if (this.scope.restrictTo && !this.inScope(f.path)) { this.remove(f.path, notify); return; }
    const t = this.parse(f);
    if (!t) {
      // Keine Aufgabe – aber PROJEKT-/BEREICHS-Notizen beeinflussen den Index trotzdem: ihr
      // `status: archived` steuert open(), die Zähler und die Suche. remove() steigt bei einer
      // Nicht-Aufgabe sofort aus (der Pfad steht ja nicht im Index) und würde weder den Cache
      // verwerfen noch melden – der Archiv-Zustand bliebe veraltet, bis zufällig etwas anderes
      // eine Meldung auslöst. Deshalb hier gezielt anstoßen.
      const type: unknown = this.app.metadataCache.getFileCache(f)?.frontmatter?.[fieldKey("type")];
      // Ist die Notiz ein Projekt/Bereich ODER war sie es zuletzt (type gerade entfernt)? Dann
      // die Auflösungs-Karte neu bauen lassen und die Views anstoßen (Archiv/Zähler/Zuordnung).
      const proj = isProjectType(type) || this.isMappedProjectPath(f.path);
      if (proj) this.projPathDirty = true;
      if (notify && proj) this.notify();
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
    if (!this.inScope(f.path)) return null;     // ausserhalb des Geltungsbereichs (s. inScope)
    const cache = this.app.metadataCache.getFileCache(f);
    const fm = cache?.frontmatter;
    if (!fm || fm[fieldKey("type")] !== this.scope.typeValue) return null;
    const link = (v: unknown): string | null => {
      const m = typeof v === "string" ? v.match(/\[\[([^\]|#]+)/) : null;
      const dest = m ? this.app.metadataCache.getFirstLinkpathDest(m[1].trim(), f.path) : null;
      return dest ? dest.path : null;
    };
    const fromFm = fmTitle(fm[titleKey()]);
    return {
      id: String(fm.id ?? f.path),
      path: f.path,
      // Titel-Kaskade (s. taskTitle.ts): `title:` -> erste H1 -> Dateiname. Ungekürzt; der
      // Dateiname ist nur ein Slug (max. 80) und bleibt die Identität.
      title: resolveTitle(fromFm, firstH1(cache?.headings), f.basename),
      titleInFm: fromFm !== null,
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
      // Projekt über den Basenamen gegen echte Projekt-/Bereichs-Notizen (immun gegen gleichnamige
      // Fremd-Notizen, s. resolveProjectPath). `parent` bleibt beim generischen Link-Resolver.
      project: resolveProjectPath(fm.project, this.projectPaths()),
      parent: link(fm.parent),
      labels: Array.isArray(fm[labelKey()]) ? (fm[labelKey()] as unknown[]).map(String) : [],
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
  /** Alle Aufgaben außer denen aus archivierten Projekten – JEDEN Status, auch erledigte und
   *  abgebrochene. Basis für Filter mit ausdrücklichem Status-Kriterium: dort entscheiden die
   *  gewählten Status, was sichtbar ist, nicht eine vorgelagerte Auswahl (s. applyFilter). */
  unarchived(): Task[] {
    const archived = this.archivedProjects();
    return this.all().filter((t) => !(t.project && archived.has(baseName(t.project).toLowerCase())));
  }
  /** True, wenn das Projekt (Basename) archiviert ist – für Ansichten/Zähler, die all() nutzen. */
  isProjectArchived(project: string | null | undefined): boolean {
    return !!project && this.archivedProjects().has(baseName(project).toLowerCase());
  }
  // Zeit-Ansichten: Platzierung nach agendaDate (Fälligkeit, ersatzweise Deadline) und
  // Überfälligkeit nach beiden Feldern – die EINE Regel steht in filterEngine.
  overdue(today: string): Task[] { return this.open().filter((t) => isOverdueTask(t, today)); }
  dueToday(today: string): Task[] { return this.open().filter((t) => isTodayTask(t, today)); }
  upcoming(today: string): Task[] {
    return this.open().filter((t) => isUpcomingTask(t, today))
      .sort((a, b) => agendaDate(a)!.localeCompare(agendaDate(b)!));
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

  /** ALLE Aufgaben eines Projekts/Bereichs – JEDER Status (auch erledigt/abgebrochen) UND auch aus
   *  archivierten Projekten. Für Lösch-Operationen (Kaskade/Zähler): byProject baut auf open() (nur
   *  offen, ohne Archiv) und darf hier NICHT verwendet werden, sonst blieben erledigte bzw. alle
   *  Aufgaben archivierter Projekte beim Löschen unberücksichtigt. */
  allInProject(path: string): Task[] {
    const name = baseName(path);
    return this.all().filter((t) => t.project != null && baseName(t.project) === name);
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

  /**
   * Unteraufgaben je Eltern-Pfad – EINMAL gruppiert, wie byProjectMap/byLabelMap.
   *
   * Vorher war `children()` ein `all().filter(...)`: ein Vollscan über den ganzen Bestand PLUS
   * eine frische Array-Kopie, und das je gezeichneter Zeile mehrfach (Unteraufgaben-Badge,
   * Verschachtelung, nestingHosts – s. heuteView). Die Kosten wuchsen damit quadratisch zur
   * Aufgabenzahl: bei zwei Aufrufen je Aufgabe gemessene 98 ms (2000 Aufgaben) bzw. 411 ms
   * (5000) je Zeichenvorgang, gegenüber 0,8 bzw. 1,6 ms hier. Aufbau EIN Durchlauf, Zugriff O(1).
   */
  private byParentMap(): Map<string, Task[]> {
    if (this.childCache) return this.childCache;
    const m = new Map<string, Task[]>();
    // Über byPath statt all(): identische Reihenfolge (Map hält die Einfügereihenfolge), aber
    // ohne die Zwischen-Kopie des gesamten Bestands.
    for (const t of this.byPath.values()) {
      if (!t.parent) continue;
      const arr = m.get(t.parent);
      if (arr) arr.push(t); else m.set(t.parent, [t]);
    }
    this.childCache = m;
    return m;
  }

  /** Die direkten Unteraufgaben (JEDER Status, in Index-Reihenfolge). Wie bei byProject/byLabel
   *  gehört das Ergebnis dem Cache: nicht an Ort und Stelle sortieren oder umhängen, sondern
   *  vorher kopieren (`sortSubtasks` und die `.filter()`-Aufrufer tun das bereits). */
  children(parentPath: string): Task[] { return this.byParentMap().get(parentPath) ?? []; }
  /**
   * Alle Nachfahren (rekursiv, jeder Status) einer Aufgabe – z. B. für Kaskaden-Aktionen.
   *
   * Mit Schutz gegen Kreise: `parent` ist ein von Hand schreibbares Frontmatter-Feld, und eine
   * Aufgabe, die sich selbst (oder über eine Kette) als Elternaufgabe führt, ließ die Rekursion
   * bis zum Stapelüberlauf laufen. Das traf keine Anzeige, sondern die Kaskaden: Löschen mit
   * Unteraufgaben, Papierkorb und Duplizieren. Gefunden von der Differenzprüfung in
   * tests/taskIndexFuzz.test.ts; ein Kreis ist unsinnig, darf die App aber nicht anhalten.
   */
  descendants(path: string): Task[] {
    const out: Task[] = [];
    const gesehen = new Set<string>([path]);
    const walk = (p: string): void => {
      for (const kid of this.children(p)) {
        if (gesehen.has(kid.path)) continue;
        gesehen.add(kid.path);
        out.push(kid);
        walk(kid.path);
      }
    };
    walk(path);
    return out;
  }

  /** Demnächst: künftige datierte Aufgaben, gruppiert nach ISO-Datum (aufsteigend). */
  upcomingByDate(today: string): { date: string; tasks: Task[] }[] {
    const groups = new Map<string, Task[]>();
    for (const t of this.upcoming(today)) {
      const d = agendaDate(t)!;
      const arr = groups.get(d) ?? [];
      arr.push(t); groups.set(d, arr);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, tasks]) => ({ date, tasks }));
  }
}
