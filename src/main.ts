import { Plugin, Notice, TFile, WorkspaceLeaf, Component, Platform, moment } from "obsidian";
import { BeautyTasksSettings, DEFAULT_SETTINGS, Task, TaskStatus, StoredStatus, StatusKind, NavSection, NavSortMode } from "./types";
import { isDone, initStatuses, firstOpenStatus, firstDoneStatus, DEFAULT_STATUSES, statusLabel } from "./statuses";
import { resolveReminders } from "./reminders";
import { TaskIndex } from "./taskIndex";
import { runMigration } from "./migrate";
import {
  MainView, NavView, VIEW_MAIN, VIEW_NAV, VIEW_IDS, viewTitle, ViewId, OLD_VIEW_TYPES, projectName,
} from "./heuteView";
import { TaskModal } from "./taskModal";
import { QuickAddModal } from "./quickAddModal";
import { createTaskNote, createProjectNote, setProjectType, setProjectArchived, setNavHidden, setProjectColor, renameProjectNote, deleteProjectNote, normalizeLabel, ensureInbox, listManaged, ProjItem } from "./taskService";
import { createFilterNote, updateFilterNote, deleteFilterNote, setFilterNavHidden, setFilterColor, renameFilterNote, listFilters, readFilter, FilterItem } from "./filterService";
import { FilterCriteria, ViewOptions, DEFAULT_OPTIONS, applyFilter } from "./filterEngine";
import { readNoteViewOptions, setNoteViewOption, readViewOptions } from "./pageOptions";
import { nextInstance } from "./recurrence";
import { todayStr, localStamp } from "./format";
import { t, setLocale } from "./i18n";
import { BeautyTasksSettingTab } from "./settingsTab";
import { TaskSearchModal } from "./searchModal";
import { writeExportFile, parseExport, importData, JsonFilePickerModal, pickOsJsonFile } from "./importExport";
import { ImportTaskNotesModal } from "./importTaskNotes";
import { WhatsNewModal } from "./whatsNew";

export default class BeautyTasksPlugin extends Plugin {
  settings!: BeautyTasksSettings;
  index!: TaskIndex;
  currentView: ViewId = "heute";
  currentProject: string | null = null;
  currentLabel: string | null = null;                   // aktives Label-Board
  currentFilter: string | null = null;                  // aktiver gespeicherter Filter (type:filter-Pfad)
  colorPreview: { key: string; color: string } | null = null;   // Live-Vorschau der Icon-Farbe (Farb-Picker), NICHT persistiert
  reorderSec: NavSection | null = null;                 // aktiver Drag-Sortiermodus in der Seitenleiste (transient)
  doneCollapsed = true;                                  // „Erledigt"-Sektionen eingeklappt (Default)
  manageOpen = false;                                   // Verwaltungs-Ansicht aktiv?
  manageSection: "projects" | "areas" | "labels" | "filters" | "statuses" = "projects";    // obere Ebene
  manageTab: "active" | "archive" = "active";           // Unterteilung nur bei Projekten
  doneTab: "done" | "trash" = "done";                   // „Erledigt"-Ansicht: Liste vs. Papierkorb
  flashPath: string | null = null;                       // aus der Suche angesprungene Aufgabe (kurz hervorgehoben)
  flashScrolled = false;                                 // pro Sprung nur einmal ins Bild scrollen
  titleRenderComp: Component | null = null;              // Lifecycle für Markdown-Titel (Links), von MainView pro Zeichnung gesetzt
  private reminderScan = 0;                              // Obergrenze des zuletzt geprüften Zeitfensters (Epoch-ms)

  async onload(): Promise<void> {
    await this.loadSettings();
    this.applyLocale();                        // "auto" folgt Obsidian; sonst EN (Kanon) / DE
    this.currentView = this.resolveStartView();   // Startansicht aus den Einstellungen

    this.index = new TaskIndex(this.app);
    this.addChild(this.index);
    this.index.subscribe(() => this.renderAll());
    // Reminder-Scanfenster: bei echtem Vorwert Verpasstes nachfeuern (auf Grace begrenzt),
    // bei Erstinstallation (0) ab jetzt starten -> kein Fehlalarm für heute Vergangenes.
    this.reminderScan = this.settings.reminderLastScan || Date.now();
    this.app.workspace.onLayoutReady(async () => {
      // Vor dem Erst-Setup merken, ob es ein bestehender Nutzer ist und welche Version zuletzt lief.
      const wasExisting = this.settings.didInitialSetup;
      const prevVersion = this.settings.lastSeenVersion;
      // Leafs alter Sitzungen (pro-Ansicht-Typen) aufräumen.
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (OLD_VIEW_TYPES.includes(leaf.getViewState().type)) leaf.detach();
      });
      // Erst-Setup (einmalig): Inbox-Notiz anlegen, falls keine existiert. Danach
      // Flag setzen, damit ein absichtliches Löschen der Inbox respektiert wird.
      if (!this.settings.didInitialSetup) {
        try { await ensureInbox(this.app, this.settings); } catch (e) { console.error("BeautyTasks inbox setup", e); }
        this.settings.didInitialSetup = true;
        await this.saveSettings();
      }
      this.index.build();
      this.renderAll();
      this.scanReminders();   // Startlauf (fängt beim Öffnen kürzlich Verpasstes)
      // „Neu"-Modal nur für bestehende Nutzer bei echtem Versionswechsel (nicht bei Erstinstallation).
      if (wasExisting && prevVersion !== this.manifest.version) new WhatsNewModal(this).open();
      if (this.settings.lastSeenVersion !== this.manifest.version) {
        this.settings.lastSeenVersion = this.manifest.version;
        await this.saveSettings();
      }
    });
    // Alle 30 s prüfen, welche Erinnerungen im Fenster (letzter Scan, jetzt] fällig wurden.
    this.registerInterval(window.setInterval(() => this.scanReminders(), 30_000));

    this.registerView(VIEW_MAIN, (leaf: WorkspaceLeaf) => new MainView(leaf, this));
    this.registerView(VIEW_NAV, (leaf: WorkspaceLeaf) => new NavView(leaf, this));

    this.addRibbonIcon("check-circle", t("ribbon_open"), () => void this.openBeautyTasks());
    this.addSettingTab(new BeautyTasksSettingTab(this.app, this));

    // Layout-/Tab-Wechsel: u. a. wenn Obsidian eine aufgeschobene View endlich anhängt.
    // Bewusst KEIN active-leaf-change-Redraw: der feuert auf dem fokusverschiebenden
    // mousedown beim Wechsel zwischen Nav- und Main-Leaf und würde c.empty() mitten in
    // der Klick-Geste ausführen -> das Klickziel verschwindet vor mouseup, der erste Klick
    // im neuen Bereich geht verloren. Badges/Inhalte bleiben via index.subscribe aktuell.
    this.registerEvent(this.app.workspace.on("layout-change", () => this.renderAll()));

    this.addCommand({ id: "open", name: t("ribbon_open"), callback: () => void this.openBeautyTasks() });
    for (const id of VIEW_IDS) {
      this.addCommand({ id: "open-" + id, name: t("cmd_open_view", viewTitle(id)), callback: () => void this.activateView(id) });
    }
    this.addCommand({ id: "new-task", name: t("cmd_new_task"), callback: () => this.openNewTask() });
    this.addCommand({ id: "quick-add", name: t("cmd_quick_add"), callback: () => this.openQuickAdd() });
    this.addCommand({ id: "search", name: t("cmd_search"), callback: () => this.openSearch() });
    this.addCommand({
      id: "count-tasks", name: t("cmd_count_tasks"),
      callback: () => new Notice(t("notice_count", this.index.all().length, this.index.open().length)),
    });
    this.addCommand({ id: "export-json", name: t("cmd_export_json"), callback: () => void this.exportTasksJson() });
    this.addCommand({ id: "import-json", name: t("cmd_import_json"), callback: () => this.importTasksFromVault() });
    this.addCommand({ id: "import-tasknotes", name: t("cmd_import_tasknotes"), callback: () => this.importFromTaskNotes() });
    this.addCommand({
      id: "import-from-lists", name: t("cmd_import"),
      callback: async () => {
        new Notice(t("notice_import_running"));
        try {
          const n = await runMigration(this.app, this.settings);
          new Notice(t("notice_imported", n));
          window.setTimeout(() => this.index.build(), 800);
        } catch (e) {
          console.error("BeautyTasks import error", e);
          new Notice(t("notice_import_failed"));
        }
      },
    });
  }

  // ── Rendern: Views zeichnen sich selbst (eigenes contentEl) ──
  renderAll(): void { this.renderMain(); this.renderNav(); }

  renderMain(): void {
    if (!this.index) return;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_MAIN)) {
      if (leaf.view instanceof MainView) leaf.view.draw();
    }
  }

  renderNav(): void {
    if (!this.index) return;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_NAV)) {
      if (leaf.view instanceof NavView) leaf.view.draw();
    }
  }

  // ── Öffnen / Navigieren ──
  async openBeautyTasks(): Promise<void> {
    await this.activateNav();
    await this.activateView(this.resolveStartView());
  }

  /** UI-Sprache anwenden: "auto" folgt Obsidians Sprache (via moment-Locale), sonst der
   *  gewählte Code. `moment.locale()` statt `getLanguage()` – letzteres bräuchte App ≥ 1.8.7. */
  applyLocale(): void {
    setLocale(this.settings.locale === "auto" ? moment.locale() : this.settings.locale);
  }

  /** Startansicht aus den Einstellungen (Fallback „heute"). "last" = zuletzt benutzte. */
  private resolveStartView(): ViewId {
    const pick = this.settings.startView === "last" ? this.settings.lastView : this.settings.startView;
    return (VIEW_IDS as string[]).includes(pick) ? (pick as ViewId) : "heute";
  }

  async activateNav(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_NAV)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeftLeaf(false);
      if (leaf) await leaf.setViewState({ type: VIEW_NAV, active: true });
    }
    if (leaf) await workspace.revealLeaf(leaf);   // awaited -> Nav vollständig geladen
    this.renderNav();
  }

  /** EINE Dashboard-Leaf öffnen/vordergründig machen und neu zeichnen. */
  private async showMain(): Promise<void> {
    const { workspace } = this.app;
    let leaf: WorkspaceLeaf | null = workspace.getLeavesOfType(VIEW_MAIN)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_MAIN, active: true });
    }
    await workspace.revealLeaf(leaf);   // awaited -> View vollständig geladen
    if (leaf.view instanceof MainView) leaf.view.draw();
    this.renderNav();
  }

  async activateView(id: ViewId): Promise<void> {
    this.currentView = id; this.currentProject = null; this.currentLabel = null; this.currentFilter = null; this.manageOpen = false; this.doneTab = "done";
    if (this.settings.lastView !== id) { this.settings.lastView = id; void this.saveSettings(); }   // für startView === "last"
    await this.showMain();
  }
  async activateProject(path: string): Promise<void> { this.currentProject = path; this.currentLabel = null; this.currentFilter = null; this.manageOpen = false; await this.showMain(); }
  async activateLabel(label: string): Promise<void> { this.currentLabel = label; this.currentProject = null; this.currentFilter = null; this.manageOpen = false; await this.showMain(); }
  async activateFilter(path: string): Promise<void> { this.currentFilter = path; this.currentProject = null; this.currentLabel = null; this.manageOpen = false; await this.showMain(); }
  async activateManage(section?: "projects" | "areas" | "labels" | "filters" | "statuses"): Promise<void> { this.manageOpen = true; if (section) this.manageSection = section; this.currentProject = null; this.currentLabel = null; this.currentFilter = null; await this.showMain(); }

  // ── Anzeige pro Seite (Layout/Sortieren/Gruppieren/Erledigte) ──
  /** Welche Seite ist gerade offen + ihre „Fernbedienungs-Größe". */
  currentPage(): { key: string; tier: "full" | "light" | "none"; kind: "view" | "project" | "label" | "filter" } {
    if (this.manageOpen) return { key: "manage", tier: "none", kind: "view" };
    if (this.currentFilter) return { key: this.currentFilter, tier: "full", kind: "filter" };
    if (this.currentLabel) return { key: this.currentLabel, tier: "full", kind: "label" };
    if (this.currentProject) return { key: this.currentProject, tier: "full", kind: "project" };
    const v = this.currentView;
    return { key: v, tier: (v === "heute" || v === "demnaechst") ? "light" : "none", kind: "view" };
  }
  /** Effektive Anzeige-Optionen der aktuellen Seite (aus Frontmatter bzw. Settings). */
  pageViewOptions(): ViewOptions {
    const p = this.currentPage();
    if (p.kind === "project") return readNoteViewOptions(this.app, p.key);
    if (p.kind === "filter") { const fl = readFilter(this.app, p.key); return fl ? fl.options : { ...DEFAULT_OPTIONS }; }
    return readViewOptions(this.settings.pageViewOptions?.[p.kind === "label" ? "label:" + p.key : p.key]);
  }
  /** Eine Anzeige-Option der aktuellen Seite setzen – am richtigen Ort gespeichert. */
  async setPageViewOption(patch: Partial<ViewOptions>): Promise<void> {
    const p = this.currentPage();
    if (p.kind === "project") { this.refreshOnChange(p.key); await setNoteViewOption(this.app, p.key, patch); return; }
    if (p.kind === "filter") {
      const fl = readFilter(this.app, p.key); if (!fl) return;
      await this.updateFilter(p.key, fl.criteria, { ...fl.options, ...patch }, fl.color);
      return;
    }
    const map = this.settings.pageViewOptions ?? {};
    const skey = p.kind === "label" ? "label:" + p.key : p.key;
    map[skey] = { ...readViewOptions(map[skey]), ...patch };
    this.settings.pageViewOptions = map;
    await this.saveSettings();
    this.renderMain();
  }
  /** Anzeige-Optionen der aktuellen Seite auf Default zurücksetzen. */
  async resetPageViewOptions(): Promise<void> {
    const p = this.currentPage();
    if (p.kind === "project") { this.refreshOnChange(p.key); await setNoteViewOption(this.app, p.key, { ...DEFAULT_OPTIONS }); return; }
    if (p.kind === "filter") { const fl = readFilter(this.app, p.key); if (fl) await this.updateFilter(p.key, fl.criteria, { ...DEFAULT_OPTIONS }, fl.color); return; }
    if (this.settings.pageViewOptions) { delete this.settings.pageViewOptions[p.kind === "label" ? "label:" + p.key : p.key]; await this.saveSettings(); }
    this.renderMain();
  }

  // ── Gespeicherte Filter (type:filter-Notizen) ──
  /** Neuen Filter anlegen und öffnen. Wie createProject wartet ein einmaliger „changed"-
   *  Listener auf den frisch geparsten Frontmatter, bevor zum neuen Filter-Board gewechselt wird. */
  async createFilter(name: string, criteria: FilterCriteria, options: ViewOptions, color: string | null = null, hidden = false): Promise<void> {
    const base = await createFilterNote(this.app, this.settings, name, criteria, options, color, hidden);
    const ref = this.app.metadataCache.on("changed", () => {
      this.app.metadataCache.offref(ref);
      const created = listFilters(this.app).find((fl) => fl.name === base);
      if (created) void this.activateFilter(created.path); else this.renderAll();
    });
    this.registerEvent(ref);
  }
  /** Filter aktualisieren. Wie die Projekt-Aktionen wartet ein einmaliger „changed"-Listener
   *  auf den frisch geparsten Frontmatter, bevor Board/Nav neu gezeichnet werden (sonst zeigt
   *  die Seite bis zum nächsten Ereignis den alten Stand). */
  async updateFilter(path: string, criteria: FilterCriteria, options: ViewOptions, color: string | null): Promise<void> {
    this.refreshOnChange(path);
    await updateFilterNote(this.app, path, criteria, options, color);
  }
  /** Filter umbenennen (Datei + „# Überschrift"). Gibt neuen Basenamen zurück oder null bei
   *  Kollision. renameFile löst ein vault-„rename" aus; zur Sicherheit zusätzlich neu zeichnen. */
  async renameFilter(path: string, newName: string): Promise<string | null> {
    const r = await renameFilterNote(this.app, path, newName);
    this.renderAll();
    return r;
  }
  /** Filter in der Seitenleiste ein-/ausblenden (nav_hidden), refresh nach Cache-Update. */
  async setFilterVisible(path: string, visible: boolean): Promise<void> {
    this.refreshOnChange(path);
    await setFilterNavHidden(this.app, path, !visible);
  }
  /** Icon-Farbe eines Filters setzen (null = keine), refresh nach Cache-Update. */
  async setFilterColor(path: string, color: string | null): Promise<void> {
    this.colorPreview = null;
    this.refreshOnChange(path);
    await setFilterColor(this.app, path, color);
  }
  async deleteFilter(path: string): Promise<void> {
    await deleteFilterNote(this.app, path);
    if (this.currentFilter === path) { this.currentFilter = null; await this.activateView("heute"); }
    else this.renderAll();
  }

  /** Aus der Suche gewählte Aufgabe in ihrer Liste zeigen: zum Projekt-/Inbox-Board
   *  (bzw. passenden Datums-/Erledigt-View) springen und die Zeile kurz hervorheben
   *  – als führe man mit der Maus darüber. `flashPath` wird beim Zeichnen von der
   *  Task-Zeile ausgewertet (robust gegen Neu-Zeichnen durch active-leaf-change). */
  async revealTask(task: Task): Promise<void> {
    this.flashPath = task.path;
    this.flashScrolled = false;
    if (task.status === "done") this.doneCollapsed = false;   // Erledigt-Sektion aufklappen, sonst ist die Zeile verborgen
    if (task.project) {
      await this.activateProject(task.project);
    } else if (task.status === "done") {
      await this.activateView("erledigt");
    } else if (task.due && task.due <= todayStr()) {
      await this.activateView("heute");
    } else {
      await this.activateView("demnaechst");   // datiert (künftig) oder ohne Datum
    }
    window.setTimeout(() => {
      if (this.flashPath !== task.path) return;
      this.flashPath = null;
      this.renderMain();   // Hervorhebung wieder entfernen
    }, 4400);
  }

  /** Task-Zeile beim Zeichnen hervorheben + einmalig ins Bild scrollen (aus der Suche). */
  applyFlash(row: HTMLElement, path: string): void {
    if (this.flashPath !== path) return;
    row.addClass("is-focus");
    if (this.flashScrolled) return;
    this.flashScrolled = true;
    window.setTimeout(() => row.scrollIntoView({ block: "center", behavior: "smooth" }), 0);   // nach Layout
  }

  // ── Projektverwaltung (Umwandeln/Archiv/Sichtbarkeit/Umbenennen/Löschen) ──
  /** Nav/Board/Verwaltung hängen am metadataCache, der nach processFrontMatter erst kurz
   *  später aktualisiert wird -> einmaliger „changed"-Listener zeichnet dann neu
   *  (flackerfrei, ohne festes Timeout). Listener VOR der Änderung registrieren. */
  private refreshOnChange(path: string): void {
    const ref = this.app.metadataCache.on("changed", (f) => {
      if (f.path !== path) return;
      this.app.metadataCache.offref(ref);
      this.renderAll();
    });
    this.registerEvent(ref);
  }

  /** Neues Projekt (oder direkt Bereich) anlegen. Nav/Board lesen den metadataCache, der
   *  nach create erst kurz später aktualisiert wird -> einmaliger „changed"-Listener zeichnet
   *  dann neu, damit der neue Eintrag sofort in der Seitenleiste erscheint. */
  async createProject(name: string, asArea = false, color: string | null = null, hidden = false): Promise<void> {
    await createProjectNote(this.app, this.settings, name, asArea, color, hidden);
    const ref = this.app.metadataCache.on("changed", () => { this.app.metadataCache.offref(ref); this.renderAll(); });
    this.registerEvent(ref);
  }

  async setProjectArea(path: string, toArea: boolean): Promise<void> {
    this.refreshOnChange(path);
    await setProjectType(this.app, path, toArea);
  }
  async archiveProject(path: string, archived: boolean): Promise<void> {
    this.refreshOnChange(path);
    await setProjectArchived(this.app, path, archived);
  }
  /** Projekt/Bereich archivieren und eine „Rückgängig"-Notice zeigen (Kontextmenü + Bearbeiten-Modal). */
  archiveWithUndo(path: string, name: string): void {
    void this.archiveProject(path, true);
    const frag = createFragment((f) => {
      f.appendText(t("archived_notice", name) + " ");
      const undo = f.createEl("a", { text: t("archive_undo"), href: "#" });
      undo.onclick = (e) => { e.preventDefault(); void this.archiveProject(path, false); };
    });
    new Notice(frag, 8000);
  }
  async setProjectVisible(path: string, visible: boolean): Promise<void> {
    this.refreshOnChange(path);
    await setNavHidden(this.app, path, !visible);
  }
  /** Live-Vorschau der Icon-Farbe (Ziehen im Farbwähler): nur die Nav neu zeichnen, KEIN
   *  Schreiben auf die Platte. Wird beim Bestätigen/Schließen verworfen bzw. persistiert. */
  setColorPreview(key: string, color: string): void { this.colorPreview = { key, color }; this.renderNav(); }
  clearColorPreview(): void { if (this.colorPreview) { this.colorPreview = null; this.renderNav(); } }

  /** Icon-Farbe eines Projekts/Bereichs setzen (null = keine), refresh nach Cache-Update. */
  async setProjectColor(path: string, color: string | null): Promise<void> {
    this.colorPreview = null;   // Vorschau verwerfen; der Cache-Refresh zeigt gleich die echte Farbe
    this.refreshOnChange(path);
    await setProjectColor(this.app, path, color);
  }
  /** Umbenennen löst ein vault-„rename" aus -> der Index benachrichtigt bereits; zur
   *  Sicherheit zusätzlich neu zeichnen. Gibt Basename zurück oder null bei Kollision. */
  async renameProject(path: string, newName: string): Promise<string | null> {
    const r = await renameProjectNote(this.app, path, newName);
    this.renderAll();
    return r;
  }
  async deleteProject(path: string): Promise<void> {
    await deleteProjectNote(this.app, path);
    this.renderAll();   // Datei ist nach trashFile sofort weg -> Cache aktuell
  }

  // ── Import / Export (JSON, verlustfrei) ──
  /** Alle Aufgaben als JSON in den Vault sichern; Notice mit Zielpfad. */
  async exportTasksJson(): Promise<void> {
    try {
      const path = await writeExportFile(this);
      new Notice(t("notice_export_done", path));
    } catch (e) {
      console.error("BeautyTasks export error", e);
      new Notice(t("notice_export_failed"));
    }
  }
  /** JSON-Rohtext einlesen, Aufgaben anlegen (Duplikat-Schutz), Index neu aufbauen. */
  async importTasksFromText(raw: string): Promise<void> {
    const data = parseExport(raw);
    if (!data) { new Notice(t("notice_import_invalid")); return; }
    try {
      const r = await importData(this, data);
      new Notice(t("notice_import_summary", r.created, r.skipped));
      window.setTimeout(() => this.index.build(), 800);   // Frontmatter der neuen Notizen ist erst kurz später im Cache
    } catch (e) {
      console.error("BeautyTasks JSON import error", e);
      new Notice(t("notice_import_failed"));
    }
  }
  /** Import über die In-Vault-Auswahl (alle .json-Dateien). */
  importTasksFromVault(): void {
    new JsonFilePickerModal(this.app, (f) => void this.readAndImport(f)).open();
  }
  private async readAndImport(f: TFile): Promise<void> {
    await this.importTasksFromText(await this.app.vault.read(f));
  }
  /** Import über den OS-Dateidialog (Datei außerhalb des Vaults). */
  importTasksFromOs(): void {
    pickOsJsonFile((text) => void this.importTasksFromText(text));
  }
  /** Migration aus dem TaskNotes-Plugin (Dialog: Quelle wählen, nicht-destruktiv importieren). */
  importFromTaskNotes(): void {
    new ImportTaskNotesModal(this).open();
  }

  // ── Label-Verwaltung (Strings auf den Aufgaben + Register für leere Labels) ──
  /** Alle Labels (aus Aufgaben + Register) mit Häufigkeit (alphabetisch). */
  getLabels(): { name: string; count: number }[] {
    const counts = new Map<string, number>();
    for (const name of this.settings.knownLabels) counts.set(name, 0);   // Register zuerst (count 0)
    for (const task of this.index.all()) for (const l of task.labels) counts.set(l, (counts.get(l) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  /** Neues (leeres) Label ins Register aufnehmen. false bei leer/bereits vorhanden. */
  async addLabel(raw: string): Promise<boolean> {
    const nu = normalizeLabel(raw);
    if (!nu) return false;
    if (this.settings.knownLabels.includes(nu) || this.getLabels().some((l) => l.name === nu)) return false;
    this.settings.knownLabels.push(nu);
    await this.saveSettings();
    this.renderAll();
    return true;
  }
  /** Label in ALLEN Aufgaben (und im Register) umbenennen. false bei leerem/gleichem Namen. */
  async renameLabel(oldName: string, rawNew: string): Promise<boolean> {
    const nu = normalizeLabel(rawNew);
    if (!nu || nu === oldName) return false;
    for (const task of this.index.all()) {
      if (!task.labels.includes(oldName)) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        const arr = Array.isArray(fm.labels) ? (fm.labels as unknown[]).map(String) : [];
        fm.labels = [...new Set(arr.map((x) => (x === oldName ? nu : x)))];
      });
    }
    this.settings.knownLabels = [...new Set(this.settings.knownLabels.map((x) => (x === oldName ? nu : x)))];
    this.settings.visibleLabels = [...new Set(this.settings.visibleLabels.map((x) => (x === oldName ? nu : x)))];
    if (this.settings.labelColors[oldName]) {   // Farbe auf den neuen Namen umziehen
      this.settings.labelColors[nu] = this.settings.labelColors[oldName];
      delete this.settings.labelColors[oldName];
    }
    if (this.currentLabel === oldName) this.currentLabel = nu;
    await this.saveSettings();
    this.renderAll();
    return true;
  }
  /** Label aus ALLEN Aufgaben (Register + Sichtbarkeit) entfernen. */
  async deleteLabel(name: string): Promise<void> {
    for (const task of this.index.all()) {
      if (!task.labels.includes(name)) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        const arr = Array.isArray(fm.labels) ? (fm.labels as unknown[]).map(String) : [];
        fm.labels = arr.filter((x) => x !== name);
      });
    }
    this.settings.knownLabels = this.settings.knownLabels.filter((x) => x !== name);
    this.settings.visibleLabels = this.settings.visibleLabels.filter((x) => x !== name);
    delete this.settings.labelColors[name];
    if (this.currentLabel === name) this.currentLabel = null;
    await this.saveSettings();
    this.renderAll();
  }

  // ── Label-Farbe (Labels sind keine Notizen -> Speicher in den Settings) ──
  getLabelColor(name: string): string | null { return this.settings.labelColors[name] ?? null; }
  async setLabelColor(name: string, color: string | null): Promise<void> {
    this.colorPreview = null;
    if (color) this.settings.labelColors[name] = color; else delete this.settings.labelColors[name];
    await this.saveSettings();
    this.renderAll();
  }

  // ── Label-Sichtbarkeit in der Seitenleiste (Default: aus) ──
  isLabelVisible(name: string): boolean { return this.settings.visibleLabels.includes(name); }
  /** Sichtbar geschaltete Labels, die es noch gibt – in der eingestellten Reihenfolge. */
  getVisibleLabels(): string[] {
    const exist = new Set(this.getLabels().map((l) => l.name));
    const raw = this.settings.visibleLabels.filter((n) => exist.has(n)).map((n) => ({ name: n }));
    return this.orderNav("labels", raw, (x) => x.name, (x) => x.name).map((x) => x.name);
  }

  // ── Seitenleisten-Sortierung (Projekte/Bereiche/Labels) ──
  navSortMode(sec: NavSection): NavSortMode { return this.settings.navSort?.[sec] ?? "name"; }
  async setNavSort(sec: NavSection, mode: NavSortMode): Promise<void> {
    const cur = this.settings.navSort ?? { projects: "name" as NavSortMode, areas: "name" as NavSortMode, labels: "name" as NavSortMode, filters: "name" as NavSortMode };
    cur[sec] = mode;
    this.settings.navSort = cur;
    await this.saveSettings();
    this.renderAll();
  }
  private navCount(sec: NavSection, key: string): number {
    if (sec === "labels") return this.index.byLabel(key).length;
    if (sec === "filters") { const fl = readFilter(this.app, key); return fl ? applyFilter(this.index, fl.criteria, fl.options, todayStr()).length : 0; }
    return this.index.byProject(key).length;
  }
  /** Liste nach dem aktiven Modus sortieren: Name (alphabetisch) · Anzahl (viele zuerst) · Manuell. */
  private orderNav<T>(sec: NavSection, items: T[], keyOf: (t: T) => string, nameOf: (t: T) => string): T[] {
    const mode = this.navSortMode(sec);
    const arr = [...items];
    const byName = (a: T, b: T) => nameOf(a).localeCompare(nameOf(b), "de");
    if (mode === "count") return arr.sort((a, b) => this.navCount(sec, keyOf(b)) - this.navCount(sec, keyOf(a)) || byName(a, b));
    if (mode === "manual") {
      const order = this.settings.navOrder?.[sec] ?? [];
      const idx = new Map(order.map((k, i) => [k, i] as const));
      return arr.sort((a, b) => ((idx.get(keyOf(a)) ?? Infinity) - (idx.get(keyOf(b)) ?? Infinity)) || byName(a, b));
    }
    return arr.sort(byName);
  }
  /** Projekte/Bereiche in eingestellter Reihenfolge – für Seitenleiste UND ListManager. */
  sortProjItems(sec: "projects" | "areas", items: ProjItem[]): ProjItem[] {
    return this.orderNav(sec, items, (p) => p.path, (p) => p.name);
  }
  /** Label-Liste (Manager) in eingestellter Reihenfolge. */
  sortLabels<T extends { name: string }>(items: T[]): T[] {
    return this.orderNav("labels", items, (x) => x.name, (x) => x.name);
  }
  /** Filter-Liste (Seitenleiste UND ListManager) in eingestellter Reihenfolge. */
  sortFilters(items: FilterItem[]): FilterItem[] {
    return this.orderNav("filters", items, (f) => f.path, (f) => f.name);
  }
  /** Aktuelle Reihenfolge der Schlüssel (materialisiert die manuelle Liste beim ersten Verschieben). */
  private currentNavKeys(sec: NavSection): string[] {
    if (sec === "labels") {
      const items = this.getLabels().map((l) => ({ name: l.name }));
      return this.orderNav("labels", items, (x) => x.name, (x) => x.name).map((x) => x.name);
    }
    if (sec === "filters") return this.sortFilters(listFilters(this.app)).map((f) => f.path);
    const wantType = sec === "areas" ? "area" : "project";
    const items = listManaged(this.app).active.filter((p) => p.type === wantType);
    return this.sortProjItems(sec, items).map((p) => p.path);
  }
  /** Manuelle Reihenfolge einer Sektion setzen (materialisiert navOrder). Gemeinsame Persistenz
   *  für ↑/↓-Verschieben UND Drag-Sortiermodus – schreibt genau ein Feld: navOrder[sec]. */
  async setNavOrder(sec: NavSection, keys: string[]): Promise<void> {
    const order = this.settings.navOrder ?? { projects: [], areas: [], labels: [], filters: [] };
    order[sec] = keys;
    this.settings.navOrder = order;
    await this.saveSettings();
    this.renderAll();
  }
  /** Neue Reihenfolge der SICHTBAREN Schlüssel (aus dem Drag-Sortiermodus) anwenden.
   *  Ausgeblendete behalten ihre bisherige Position, damit ihr Umsortieren nicht verloren geht. */
  async reorderVisible(sec: NavSection, visibleKeys: string[]): Promise<void> {
    const full = this.currentNavKeys(sec);
    const visSet = new Set(visibleKeys);
    let vi = 0;
    const merged = full.map((k) => (visSet.has(k) ? visibleKeys[vi++] : k));
    for (const k of visibleKeys) if (!full.includes(k)) merged.push(k);   // Sicherheitsnetz: neue Schlüssel
    await this.setNavOrder(sec, merged);
  }
  /** Ein Element in der manuellen Reihenfolge um eine Position verschieben. */
  async moveNavItem(sec: NavSection, key: string, dir: -1 | 1): Promise<void> {
    await this.ensureManualSort(sec);   // ↑/↓ wirken nur im Manuell-Modus
    const keys = this.currentNavKeys(sec);
    const i = keys.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    await this.setNavOrder(sec, keys);
  }
  /** Sicherstellen, dass eine Sektion im Manuell-Modus ist (Voraussetzung fürs Umsortieren). */
  async ensureManualSort(sec: NavSection): Promise<void> {
    if (this.navSortMode(sec) !== "manual") await this.setNavSort(sec, "manual");
  }
  /** Drag-Sortiermodus für eine Sektion starten (schaltet vorher auf Manuell). */
  async startReorder(sec: NavSection): Promise<void> {
    await this.ensureManualSort(sec);   // ruft bereits renderAll(), falls umgeschaltet
    this.reorderSec = sec;
    this.renderAll();
  }
  /** Drag-Sortiermodus beenden. */
  endReorder(): void {
    this.reorderSec = null;
    this.renderAll();
  }
  // ── Nav-Abschnitte ein-/ausklappen (Zustand persistent, beim Neustart wiederhergestellt) ──
  isNavCollapsed(id: string): boolean { return !!this.settings.navCollapsed[id]; }
  async setNavCollapsed(id: string, collapsed: boolean): Promise<void> {
    if (this.isNavCollapsed(id) === collapsed) return;
    this.settings.navCollapsed[id] = collapsed;
    await this.saveSettings();
    this.renderNav();
  }
  async toggleNavSection(id: string): Promise<void> { await this.setNavCollapsed(id, !this.isNavCollapsed(id)); }

  async setLabelVisible(name: string, visible: boolean): Promise<void> {
    const has = this.settings.visibleLabels.includes(name);
    if (visible === has) return;
    this.settings.visibleLabels = visible ? [...this.settings.visibleLabels, name] : this.settings.visibleLabels.filter((x) => x !== name);
    await this.saveSettings();
    this.renderAll();
  }

  // ── Status-Verwaltung (user-definierbare Status) ──
  /** Mutierbare Status-Liste; materialisiert beim ersten Edit die eingebauten Defaults. */
  private statusList(): StoredStatus[] {
    if (!this.settings.statuses) this.settings.statuses = DEFAULT_STATUSES.map((s) => ({ ...s }));
    return this.settings.statuses;
  }
  getStatuses(): StoredStatus[] { return this.statusList(); }
  /** Wie viele Aufgaben tragen diesen Status (für Löschen-Umzug/Anzeige). */
  statusTaskCount(id: string): number { return this.index.all().filter((tk) => tk.status === id).length; }

  /** Registry aktualisieren, speichern, Index neu bewerten (isKnownStatus), Views neu. */
  private async commitStatuses(): Promise<void> {
    initStatuses(this.settings.statuses);
    await this.saveSettings();
    this.index.build();
    this.renderAll();
  }

  async addStatus(label: string): Promise<void> {
    const name = label.trim();
    if (!name) return;
    const list = this.statusList();
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "status";
    let id = base, n = 2;
    while (list.some((s) => s.id === id)) id = base + "-" + n++;
    const entry: StoredStatus = { id, label: name, kind: "open", icon: "circle" };
    // vor dem cancelled-Status einsortieren, damit der Papierkorb-Status hinten bleibt.
    const cancelAt = list.findIndex((s) => s.kind === "cancelled");
    if (cancelAt >= 0) list.splice(cancelAt, 0, entry); else list.push(entry);
    await this.commitStatuses();
  }

  async renameStatus(id: string, label: string): Promise<void> {
    const name = label.trim();
    if (!name) return;
    const s = this.statusList().find((x) => x.id === id);
    if (!s) return;
    delete s.labelKey;   // umbenannter Eingebauter wird zu literalem Label
    s.label = name;
    await this.commitStatuses();
  }

  async setStatusKind(id: string, kind: StatusKind): Promise<void> {
    const list = this.statusList();
    const s = list.find((x) => x.id === id);
    if (!s || s.kind === kind) return;
    if (s.kind === "done" && list.filter((x) => x.kind === "done").length <= 1) { new Notice(t("status_need_done")); return; }
    s.kind = kind;
    await this.commitStatuses();
  }

  async setStatusIcon(id: string, icon: string): Promise<void> {
    const s = this.statusList().find((x) => x.id === id);
    if (!s) return;
    s.icon = icon;
    await this.commitStatuses();
  }

  async setStatusColor(id: string, color: string | null): Promise<void> {
    const s = this.statusList().find((x) => x.id === id);
    if (!s) return;
    if (color) s.color = color; else delete s.color;
    await this.commitStatuses();
  }

  async moveStatus(id: string, dir: -1 | 1): Promise<void> {
    const list = this.statusList();
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await this.commitStatuses();
  }

  /** Status löschen: Aufgaben darauf werden auf einen gleichartigen Ersatz umgezogen (statt
   *  zu verwaisen). Leitplanken: mind. 1 „erledigt" und 1 „offen" müssen bestehen bleiben. */
  async deleteStatus(id: string): Promise<void> {
    const list = this.statusList();
    const s = list.find((x) => x.id === id);
    if (!s) return;
    if (s.kind === "done" && list.filter((x) => x.kind === "done").length <= 1) { new Notice(t("status_need_done")); return; }
    if (s.kind === "open" && list.filter((x) => x.kind === "open").length <= 1) { new Notice(t("status_need_open")); return; }
    // Ersatz gleicher Art (sonst irgendein offener), aber nie der zu löschende selbst.
    const target = list.find((x) => x.id !== id && x.kind === s.kind)?.id
      ?? list.find((x) => x.id !== id && x.kind === "open")?.id ?? "todo";
    const affected = this.index.all().filter((tk) => tk.status === id);
    for (const tk of affected) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { fm.status = target; });
    }
    this.settings.statuses = list.filter((x) => x.id !== id);
    await this.commitStatuses();
    if (affected.length) new Notice(t("status_reassigned", affected.length, statusLabel(target)));
  }

  // ── Aufgaben-Aktionen ──
  openNewTask(project?: string, label?: string, today = false, status?: TaskStatus): void {
    new TaskModal(this, undefined, project, { defaultLabel: label, defaultToday: today, defaultStatus: status }).open();
  }
  openEditTask(task: Task): void { new TaskModal(this, task).open(); }
  openQuickAdd(project?: string): void { new QuickAddModal(this, project).open(); }
  openSearch(): void { new TaskSearchModal(this).open(); }

  // ── Erinnerungen (Stufe A) ──
  /** Prüft alle offenen Aufgaben und feuert Erinnerungen, deren Zeitpunkt ins Fenster
   *  (letzter Scan, jetzt] fällt. Das fortlaufende Fenster garantiert „genau einmal";
   *  ein Grace von 1 h fängt beim (Neu-)Start kürzlich Verpasstes ohne Alt-Spam. */
  private scanReminders(): void {
    if (!this.index) return;
    const now = Date.now();
    const REMINDER_GRACE_MS = 60 * 60_000;
    const from = Math.max(this.reminderScan, now - REMINDER_GRACE_MS);
    let fired = false;
    for (const task of this.index.open()) {
      for (const { fireAt } of resolveReminders(task)) {
        const ts = fireAt.getTime();
        if (ts > from && ts <= now) { this.fireReminder(task); fired = true; }
      }
    }
    this.reminderScan = now;
    // Nur beim tatsächlichen Feuern persistieren (kein 30-s-Dauerschreiben auf die Platte).
    // Das Grace-Fenster deckelt die Lücke ohnehin, falls zwischendurch nichts gefeuert wurde.
    if (fired) { this.settings.reminderLastScan = now; void this.saveSettings(); }
  }

  /** Zustellung: System-Notification (Desktop, auch im Hintergrund) + klickbare In-App-Notice.
   *  Klick öffnet die Aufgabe. Auf Mobile/ohne Notification bleibt die Notice der Kanal. */
  private fireReminder(task: Task): void {
    const body = task.title;
    try {
      if (typeof Notification !== "undefined" && !Platform.isMobile) {
        const n = new Notification("BeautyTasks", { body });
        n.onclick = () => { window.focus(); this.openEditTask(task); };
      }
    } catch { /* Notification je nach Umgebung nicht verfügbar -> Notice reicht */ }
    // In-App-Notice bewusst nur informativ: der Klick-zum-Öffnen läuft über die
    // System-Notification (oben). messageEl/noticeEl sind erst ab 1.8.7 bzw. deprecated
    // -> nicht anfassen, um minAppVersion 1.7.2 zu halten.
    new Notice("⏰ " + body, 10_000);
  }

  async setTaskDate(task: Task, field: "due" | "scheduled", isoVal: string): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { if (isoVal) fm[field] = isoVal; else delete fm[field]; });
  }

  async setTaskDuration(task: Task, minutes: number | null): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { if (minutes) fm.duration = minutes; else delete fm.duration; });
  }

  /** Checkbox-Umschalten: erledigt ⇄ offen. Delegiert an setTaskStatus, damit die
   *  Erledigt-Semantik (Zeitstempel, Wiederholung) an EINER Stelle lebt. */
  async toggleDone(task: Task): Promise<void> {
    await this.setTaskStatus(task, isDone(task.status) ? firstOpenStatus() : firstDoneStatus());
  }

  /** Status setzen (Frontmatter). Beim Wechsel nach „erledigt" wird `completed`
   *  gestempelt und – falls wiederkehrend – die nächste Instanz angelegt (wie das
   *  Tasks-Plugin). Beim Verlassen von „erledigt" wird der Stempel entfernt. Basis
   *  für Checkbox UND Kanban-Drag; `cancelled` läuft weiter über cancelTask. */
  async setTaskStatus(task: Task, status: TaskStatus): Promise<void> {
    if (task.status === status) return;
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    const wasDone = isDone(task.status);
    const nowDone = isDone(status);
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      fm.status = status;
      if (nowDone && !wasDone) fm.completed = localStamp();   // mit Uhrzeit: am selben Tag nach Zeit sortierbar
      else if (wasDone && !nowDone) fm.completed = null;      // von „erledigt" zurück ins Offene -> Stempel weg
    });
    // Wiederkehrend + gerade erledigt -> nächste Instanz anlegen.
    if (nowDone && !wasDone && task.recurrence) {
      const next = nextInstance(task, todayStr());
      if (next && (next.due || next.scheduled)) {
        await createTaskNote(this.app, this.settings, {
          title: task.title,
          priority: task.priority,
          project: task.project ? projectName(task.project) : null,
          labels: [...task.labels],
          due: next.due,
          dueTime: task.dueTime,             // Uhrzeit/Dauer in die nächste Instanz übernehmen
          scheduled: next.scheduled,
          scheduledTime: task.scheduledTime,
          duration: task.duration,
          recurrence: task.recurrence,
          recurBasis: task.recurBasis,
        });
      }
    }
  }

  // ── Papierkorb (abgebrochene Aufgaben = status "cancelled") ──
  /** Aufgabe in den Papierkorb: status "cancelled" – INKLUSIVE aller Unteraufgaben
   *  (Kaskade). Sonst blieben Kinder ohne sichtbaren Parent zurück und wären nur noch
   *  über die Suche, nicht mehr in den Boards erreichbar. */
  async cancelTask(task: Task): Promise<void> {
    // Voller lokaler Zeitstempel (mit Uhrzeit/Sekunden), NICHT nur Datum: sonst hätten alle
    // am selben Tag gelöschten Aufgaben denselben Sortierwert und der Papierkorb fiele bei
    // Gleichstand auf die Datei-Reihenfolge zurück. Für die Kaskade EIN Stempel (Gruppe bleibt zusammen).
    const stamp = localStamp();
    const targets = [task, ...this.index.descendants(task.path)].filter((t) => t.status !== "cancelled");
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { fm.status = "cancelled"; fm.cancelled = stamp; });
    }
  }

  /** Einzelne Aufgabe wiederherstellen: zurück auf offen, Abbruch-Datum entfernen. */
  async restoreTask(task: Task): Promise<void> {
    // Symmetrisch zur Kaskaden-Abbrechen-Logik: die Aufgabe UND alle abgebrochenen
    // Unteraufgaben zurückholen, sonst blieben Kinder allein im Papierkorb liegen.
    const targets = [task, ...this.index.descendants(task.path)].filter((tk) => tk.status === "cancelled");
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { fm.status = "todo"; delete fm.cancelled; });
    }
    new Notice(t("msg_restored", task.title));
  }

  /** Einzelne Aufgabe endgültig löschen (in Obsidians Papierkorb – dort wiederherstellbar). */
  async deleteTaskForever(path: string): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof TFile) await this.app.fileManager.trashFile(f);
  }

  /** Alle abgebrochenen Aufgaben wiederherstellen (reversibel, ohne Rückfrage). */
  async restoreAllCancelled(): Promise<void> {
    const items = this.index.cancelled();
    if (!items.length) { new Notice(t("report_trash_empty_restore")); return; }
    for (const task of items) {
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { fm.status = "todo"; delete fm.cancelled; });
    }
    new Notice(t("report_tasks_restored", items.length));
  }

  /** Papierkorb leeren: alle abgebrochenen Aufgaben in Obsidians Papierkorb verschieben. */
  async emptyTrash(): Promise<void> {
    const items = this.index.cancelled();
    if (!items.length) { new Notice(t("msg_trash_empty")); return; }
    for (const task of items) {
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) await this.app.fileManager.trashFile(f);
    }
    new Notice(t("msg_trash_emptied", items.length));
  }

  async loadSettings(): Promise<void> {
    const saved = (await this.loadData()) as Partial<BeautyTasksSettings> | null;
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    // Kompakt-Modus (nur Chip-Icons) auf Mobile standardmäßig an – aber nur, wenn der Nutzer
    // die Einstellung noch nie selbst gesetzt hat (frische Installation). Manuelles Umschalten
    // in den Einstellungen bleibt danach erhalten.
    if (saved?.chipsIconsOnly === undefined && Platform.isMobile) {
      this.settings.chipsIconsOnly = true;
    }
    initStatuses(this.settings.statuses);   // Status-Registry aus den Einstellungen (sonst Defaults)
  }
  async saveSettings(): Promise<void> { await this.saveData(this.settings); }
}
