import { Plugin, Notice, TFile, TAbstractFile, WorkspaceLeaf, Component, Platform, moment, setIcon, addIcon } from "obsidian";
import { BeautyTasksSettings, DEFAULT_SETTINGS, Task, TaskStatus, Priority, StoredStatus, StatusKind, NavSection, NavSortMode, ChipId, ChipTier } from "./types";
import { isDone, initStatuses, ensureStatusInvariants, firstOpenStatus, firstDoneStatus, firstCancelledStatus, isTrashed, DEFAULT_STATUSES, statusLabel } from "./statuses";
import { resolveReminders } from "./reminders";
import { TaskIndex } from "./taskIndex";
import { runMigration } from "./migrate";
import {
  MainView, NavView, VIEW_MAIN, VIEW_NAV, VIEW_IDS, viewTitle, ViewId, OLD_VIEW_TYPES, projectName,
} from "./heuteView";
import { TaskModal } from "./taskModal";
import { QuickAddModal } from "./quickAddModal";
import { createTaskNote, createProjectNote, setProjectType, setProjectArchived, setNavHidden, setProjectColor, renameProjectNote, deleteProjectNote, normalizeLabel, listManaged, ensureCanonicalFm, INBOX_KEY, inboxNotePath, isInboxName, ProjItem } from "./taskService";
import { splitContent, isDocumentBody, ensureNoteLinkLog, writeDescription, writeLog, parseDetailLog, nowLogTs, LOG_HEADING } from "./detailLog";
import { createFilterNote, updateFilterNote, deleteFilterNote, setFilterNavHidden, setFilterColor, renameFilterNote, listFilters, readFilter, FilterItem } from "./filterService";
import { FilterCriteria, ViewOptions, DEFAULT_OPTIONS, applyFilter, sortTasks, planReorder, collectTrashTargets } from "./filterEngine";
import { ConfirmModal } from "./confirmModal";
import { readNoteViewOptions, setNoteViewOption, readViewOptions } from "./pageOptions";
import { nextInstance } from "./recurrence";
import { todayStr, localStamp, dateOf, timeOf, combineDT } from "./format";
import { t, setLocale } from "./i18n";
import { BeautyTasksSettingTab } from "./settingsTab";
import { TaskSearchModal } from "./searchModal";
import { writeExportFile, parseExport, importData, JsonFilePickerModal, pickOsJsonFile } from "./importExport";
import { ImportTaskNotesModal } from "./importTaskNotes";
import { WhatsNewModal } from "./whatsNew";
import { calendarDayAnchor } from "./calendarView";
import { GCalAuth, TokenStore, DevicePrompt } from "./gcalAuth";
import { GCalSync, GCalSyncHost, DEFAULT_GCAL_SETTINGS, listCalendars, ensureDefaultCalendar, fetchAccountEmail, CalendarInfo, GCalStatusInfo } from "./gcalSync";
import { GCalFeed, GCalFeedHost, DEFAULT_GCAL_FEED_SETTINGS } from "./gcalFeed";

/** Eigene Icons. addIcon() erwartet Inhalt für ein viewBox="0 0 100 100"; die Pfade sind auf
 *  einem 24er-Raster gezeichnet und werden deshalb um 100/24 skaliert.
 *
 *  bt-add-task: gefüllter Kreis in der Akzentfarbe (currentColor) mit ausgestanztem „+"
 *  (fill-rule evenodd). Das Plus ist bewusst transparent statt weiß: so nimmt es den
 *  Hintergrund an – hell im Light-, dunkel im Dark-Theme – ohne feste Farbe. */
function registerIcons(): void {
  addIcon("bt-add-task", `<g transform="scale(4.1667)">
    <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m-.711-16.5a.75.75 0 1 1 1.5 0v4.789H17.5a.75.75 0 0 1 0 1.5h-4.711V17.5a.75.75 0 0 1-1.5 0V12.79H6.5a.75.75 0 1 1 0-1.5h4.789z"/>
  </g>`);
}

export default class BeautyTasksPlugin extends Plugin {
  settings!: BeautyTasksSettings;
  index!: TaskIndex;
  gcalAuth!: GCalAuth;
  gcalSync!: GCalSync;
  gcalFeed!: GCalFeed;
  private gcalStatusBar: HTMLElement | null = null;
  private feedRedrawTimer: number | null = null;
  currentView: ViewId = "heute";
  currentProject: string | null = null;
  currentLabel: string | null = null;                   // aktives Label-Board
  currentFilter: string | null = null;                  // aktiver gespeicherter Filter (type:filter-Pfad)
  colorPreview: { key: string; color: string } | null = null;   // Live-Vorschau der Icon-Farbe (Farb-Picker), NICHT persistiert
  reorderSec: NavSection | null = null;                 // aktiver Drag-Sortiermodus in der Seitenleiste (transient, nur Sichtbare)
  doneCollapsed = true;                                  // „Erledigt"-Sektionen eingeklappt (Default)
  manageOpen = false;                                   // Verwaltungs-Ansicht aktiv?
  manageSection: "projects" | "areas" | "labels" | "filters" = "projects";    // welcher Bereich im ListManager
  manageTab: "active" | "archive" = "active";           // Unterteilung nur bei Projekten
  doneTab: "done" | "trash" = "done";                   // „Erledigt"-Ansicht: Liste vs. Papierkorb
  flashPath: string | null = null;                       // aus der Suche angesprungene Aufgabe (kurz hervorgehoben)
  flashScrolled = false;                                 // pro Sprung nur einmal ins Bild scrollen
  titleRenderComp: Component | null = null;              // Lifecycle für Markdown-Titel (Links), von MainView pro Zeichnung gesetzt
  private reminderScan = 0;                              // Obergrenze des zuletzt geprüften Zeitfensters (Epoch-ms)

  async onload(): Promise<void> {
    registerIcons();
    await this.loadSettings();
    this.applyLocale();                        // "auto" folgt Obsidian; sonst EN (Kanon) / DE
    this.applyFontSizes();                     // überschreibbare Textgrößen als body-CSS-Variablen
    this.register(() => {                      // beim Entladen die gesetzten Variablen wieder entfernen
      for (const n of ["--bt-task-scale", "--bt-nav-scale", "--bt-head-scale", "--bt-section-scale"]) document.body.style.removeProperty(n);
    });
    this.currentView = this.resolveStartView();   // Startansicht aus den Einstellungen

    this.index = new TaskIndex(this.app, () => this.settings);
    this.addChild(this.index);
    // KEIN globales Abo hier: MainView und NavView abonnieren den Index selbst (onOpen) und
    // zeichnen sich bei jeder Meldung neu. Ein zusätzliches renderAll() hier hieße, dass jede
    // Änderung BEIDE Views doppelt zeichnet – im Profil ~110 ms je Zeichnung, also glatt
    // verdoppelte Freezes. renderAll() bleibt für explizite Anlässe (Layout-Wechsel, Settings).
    this.setupGCal();
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
      // Erst-Setup-Marker (für die „bestehender Nutzer?"-Erkennung des Neu-Modals). Der Eingang
      // ist eine eingebaute Ansicht – es wird KEINE Inbox-Notiz mehr angelegt.
      if (!this.settings.didInitialSetup) {
        this.settings.didInitialSetup = true;
        await this.saveSettings();
      }
      this.index.build();
      this.renderAll();
      await this.runPendingMigrations();   // Einmal-Migrationen beim ersten Start nach dem Update
      this.scanReminders();   // Startlauf (fängt beim Öffnen kürzlich Verpasstes)
      this.gcalSync.start();  // Auto-Push verdrahten + einmal initial abgleichen
      void this.gcalSync.syncNow();
      this.gcalFeed.start();  // Termine holen (ruhiges Intervall, nur bei sichtbarer Ansicht)
      this.gcalFeed.refreshIfStale();
      // „Neu"-Modal nur für bestehende Nutzer und nur bei einem MINOR/MAJOR-Sprung (z. B. 1.7→1.8),
      // NICHT bei reinen Patches (1.8.0→1.8.1) – sonst nervt es bei Bugfix-Releases. Der Command
      // „Neuigkeiten anzeigen" öffnet es jederzeit manuell.
      const minorKey = (v: string): string => v.split(".").slice(0, 2).join(".");
      if (wasExisting && minorKey(prevVersion ?? "") !== minorKey(this.manifest.version)) new WhatsNewModal(this).open();
      if (this.settings.lastSeenVersion !== this.manifest.version) {
        this.settings.lastSeenVersion = this.manifest.version;
        await this.saveSettings();
      }
    });
    // Alle 30 s prüfen, welche Erinnerungen im Fenster (letzter Scan, jetzt] fällig wurden.
    this.registerInterval(window.setInterval(() => this.scanReminders(), 30_000));

    this.registerView(VIEW_MAIN, (leaf: WorkspaceLeaf) => new MainView(leaf, this));
    this.registerView(VIEW_NAV, (leaf: WorkspaceLeaf) => new NavView(leaf, this));
    // Bei „Seitenvorschau" als Quelle anmelden: erscheint dort in den Einstellungen und folgt der
    // Strg-Vorgabe des Nutzers. defaultMod:false, weil das Icon der ausdrückliche Auslöser ist –
    // ein Strg-Zwang wäre hier unnötige Reibung (auf einem Wikilink im Text gilt weiter die Vorgabe).
    this.registerHoverLinkSource("beautytasks", { display: "BeautyTasks", defaultMod: false });

    this.addRibbonIcon("check-circle", t("ribbon_open"), () => void this.openBeautyTasks());
    this.addSettingTab(new BeautyTasksSettingTab(this.app, this));

    // Layout-/Tab-Wechsel: u. a. wenn Obsidian eine aufgeschobene View endlich anhängt.
    // Bewusst KEIN active-leaf-change-Redraw: der feuert auf dem fokusverschiebenden
    // mousedown beim Wechsel zwischen Nav- und Main-Leaf und würde c.empty() mitten in
    // der Klick-Geste ausführen -> das Klickziel verschwindet vor mouseup, der erste Klick
    // im neuen Bereich geht verloren. Badges/Inhalte bleiben via index.subscribe aktuell.
    this.registerEvent(this.app.workspace.on("layout-change", () => {
      this.renderAll();
      this.gcalFeed?.refreshIfStale();   // Ansicht wieder sichtbar -> Termine auffrischen (falls alt)
    }));
    // Referenz-Integrität bei JEDEM Umbenennen (nativ ODER über das Plugin) selbst sicherstellen –
    // unabhängig von Obsidians „interne Links aktualisieren"-Einstellung (die Klartext-Kriterien in
    // Filtern ohnehin nie anfasst). Deckt Projekt/Bereich/Filter/Aufgabe ab.
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => void this.onNoteRenamed(file, oldPath)));

    this.addCommand({ id: "open", name: t("ribbon_open"), callback: () => void this.openBeautyTasks() });
    for (const id of VIEW_IDS) {
      this.addCommand({ id: "open-" + id, name: t("cmd_open_view", viewTitle(id)), callback: () => void this.activateView(id) });
    }
    // Beide Commands folgen dem Kontext der geöffneten Seite (Projekt/Label/Heute/Kalendertag) –
    // sie tun dasselbe wie der „+ Aufgabe"-Knopf unter dem Seitentitel. Siehe addContext().
    this.addCommand({ id: "new-task", name: t("cmd_new_task"), callback: () => this.openNewTaskHere() });
    this.addCommand({ id: "quick-add", name: t("cmd_quick_add"), callback: () => this.openQuickAddHere() });
    // Aktuelle Notiz zur Aufgabe machen: setzt `type: task` (+ id/created) – ohne YAML von Hand.
    // Nur sichtbar, wenn eine Markdown-Notiz offen ist, die noch keine Aufgabe ist.
    this.addCommand({
      id: "make-task", name: t("cmd_make_task"),
      checkCallback: (checking: boolean) => {
        const f = this.app.workspace.getActiveFile();
        if (!f || f.extension !== "md") return false;
        // Nur „normale" Notizen: bereits eine Aufgabe ODER eine BeautyTasks-Entität
        // (Projekt/Bereich/Filter) NICHT anbieten – sonst würde der Typ überschrieben.
        const type: unknown = this.app.metadataCache.getFileCache(f)?.frontmatter?.type;
        if (type === "task" || type === "project" || type === "area" || type === "filter") return false;
        if (!checking) void this.convertActiveNoteToTask(f);
        return true;
      },
    });
    this.addCommand({ id: "search", name: t("cmd_search"), callback: () => this.openSearch() });
    this.addCommand({ id: "whats-new", name: t("cmd_whatsnew"), callback: () => new WhatsNewModal(this).open() });
    this.addCommand({ id: "gcal-sync-now", name: t("cmd_gcal_sync_now"), callback: () => void this.gcalSync.syncNow() });
    this.addCommand({
      id: "count-tasks", name: t("cmd_count_tasks"),
      callback: () => new Notice(t("notice_count", this.index.all().length, this.index.open().length)),
    });
    this.addCommand({ id: "export-json", name: t("cmd_export_json"), callback: () => void this.exportTasksJson() });
    this.addCommand({ id: "import-json", name: t("cmd_import_json"), callback: () => this.importTasksFromVault() });
    this.addCommand({ id: "import-tasknotes", name: t("cmd_import_tasknotes"), callback: () => this.importFromTaskNotes() });
    this.addCommand({ id: "migrate-descriptions", name: t("cmd_migrate_desc"), callback: () => void this.migrateDescriptions() });
    this.addCommand({ id: "remove-inbox-note", name: t("cmd_remove_inbox"), callback: () => void this.migrateInboxRemoval() });
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
  /** Zur konfigurierten Startansicht wechseln – z. B. wenn der gerade offene Eintrag
   *  (Projekt/Bereich/Label/Filter) gelöscht oder archiviert wurde. */
  private async goToStartView(): Promise<void> {
    await this.activateView(this.resolveStartView());
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
  async activateManage(section?: "projects" | "areas" | "labels" | "filters"): Promise<void> {
    this.manageOpen = true;
    if (section) this.manageSection = section;
    // Immer mit „Aktiv" öffnen. Der Aktiv/Archiv-Umschalter ist eine Sicht INNERHALB der Übersicht,
    // kein Zustand der Anwendung – wer sie neu aufruft, will die aktiven Projekte sehen, nicht das
    // Archiv, in dem er vor zehn Minuten zufällig zuletzt war.
    this.manageTab = "active";
    this.currentProject = null;
    this.currentLabel = null;
    this.currentFilter = null;
    await this.showMain();
  }

  // ── Anzeige pro Seite (Layout/Sortieren/Gruppieren/Erledigte) ──
  /** Welche Seite ist gerade offen + ihre „Fernbedienungs-Größe". */
  currentPage(): { key: string; tier: "full" | "light" | "none"; kind: "view" | "project" | "label" | "filter" } {
    if (this.manageOpen) return { key: "manage", tier: "none", kind: "view" };
    if (this.currentFilter) return { key: this.currentFilter, tier: "full", kind: "filter" };
    if (this.currentLabel) return { key: this.currentLabel, tier: "full", kind: "label" };
    // Eingang: eingebaute Ansicht ohne Notiz -> Anzeige-Optionen in den Settings (wie Heute/Demnächst).
    if (this.currentProject === INBOX_KEY) return { key: "inbox", tier: "full", kind: "view" };
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
    if (this.currentFilter === path) await this.goToStartView();
    else this.renderAll();
  }

  /** Aus der Suche gewählte Aufgabe in ihrer Liste zeigen: zum Projekt-/Inbox-Board
   *  (bzw. passenden Datums-/Erledigt-View) springen und die Zeile kurz hervorheben
   *  – als führe man mit der Maus darüber. `flashPath` wird beim Zeichnen von der
   *  Task-Zeile ausgewertet (robust gegen Neu-Zeichnen durch active-leaf-change). */
  async revealTask(task: Task): Promise<void> {
    this.flashPath = task.path;
    this.flashScrolled = false;
    if (isDone(task.status)) this.doneCollapsed = false;   // Erledigt-Sektion aufklappen, sonst ist die Zeile verborgen
    if (task.project) {
      await this.activateProject(task.project);
    } else if (isDone(task.status)) {
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
    // Archivieren des gerade offenen Projekts/Bereichs → zur Startansicht (Board wäre sonst „weg").
    if (archived && this.currentProject === path) await this.goToStartView();
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
    // Datei ist nach trashFile sofort weg -> Cache aktuell. War es das offene Projekt/Bereich,
    // zur Startansicht wechseln (sonst bliebe ein leeres Board des gelöschten Eintrags stehen).
    if (this.currentProject === path) { await this.goToStartView(); return; }
    this.renderAll();
  }

  /** Die (nicht schon im Papierkorb liegenden) Aufgaben eines Projekts/Bereichs – inkl. Unterbäume,
   *  dedupliziert. Basis für Zähler UND Kaskade, damit beide dieselbe Zahl sehen. */
  private projectTrashTargets(path: string): Task[] {
    return collectTrashTargets(this.index.byProject(path), (p) => this.index.descendants(p));
  }

  /** Projekt/Bereich löschen UND seine Aufgaben (rekursiv) in den plugin-Papierkorb verschieben.
   *  Das Projekt selbst wandert wie immer in Obsidians Papierkorb. */
  async deleteProjectWithTasks(path: string): Promise<void> {
    await this.trashTasks(this.index.byProject(path));
    await this.deleteProject(path);
  }

  /** Löschen-Abfrage für ein Projekt/Bereich mit Zwei-Optionen-Wahl: Häkchen an = Aufgaben in den
   *  Papierkorb (Kaskade), Häkchen aus (Default) = nur das Projekt löschen, die Aufgaben landen über
   *  den ungültig gewordenen Verweis im Eingang (s. severReferences/Einheit B). Der Zähler zeigt die
   *  EHRLICHE Gesamtzahl inkl. Unteraufgaben. Ohne Aufgaben entfällt das Häkchen. `onAfter` läuft nur
   *  nach tatsächlichem Löschen (nicht bei Abbruch) – z. B. um die Verwalten-Ansicht neu zu zeichnen. */
  confirmDeleteProject(path: string, name: string, onAfter?: () => void): void {
    const count = this.projectTrashTargets(path).length;
    new ConfirmModal(this.app, {
      title: t("confirm_delete_title", name),
      message: t("confirm_delete_body"),
      checkbox: count > 0 ? { label: t("confirm_delete_with_tasks", count) } : undefined,
    }, (withTasks) => {
      void (async () => {
        if (withTasks) await this.deleteProjectWithTasks(path);
        else await this.deleteProject(path);
        onAfter?.();
      })();
    }).open();
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
    // Filter-Kriterien, die dieses Label per Klartext referenzieren, mitziehen (Obsidian fasst das nie an).
    for (const fl of listFilters(this.app)) {
      if (!fl.criteria.labels.includes(oldName) && !fl.criteria.labelsAll.includes(oldName) && !fl.criteria.labelsNot.includes(oldName)) continue;
      const ff = this.app.vault.getAbstractFileByPath(fl.path);
      if (ff instanceof TFile) await this.app.fileManager.processFrontMatter(ff, (fm: Record<string, unknown>) => {
        for (const key of ["labels", "labels_all", "labels_not"]) {
          if (Array.isArray(fm[key])) fm[key] = [...new Set((fm[key] as unknown[]).map(String).map((x) => (x === oldName ? nu : x)))];
        }
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

  // ── Referenz-Integrität beim Umbenennen (nativ ODER Plugin, setting-unabhängig) ──
  /** Wikilink/Klartext → Basename (ohne .md); null, wenn kein String. */
  private wikiBase(v: unknown): string | null {
    if (typeof v !== "string") return null;
    const m = v.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
    const raw = (m ? m[1] : v).trim();
    return raw ? raw.split("/").pop()!.replace(/\.md$/i, "") : null;
  }
  /** Reagiert auf jedes Umbenennen einer verwalteten Notiz und zieht alle Referenzen selbst nach. */
  private async onNoteRenamed(file: TAbstractFile, oldPath: string): Promise<void> {
    if (!(file instanceof TFile) || file.extension !== "md") return;
    const type = this.app.metadataCache.getFileCache(file)?.frontmatter?.type as unknown;
    if (type !== "project" && type !== "area" && type !== "filter" && type !== "task") return;

    const oldBase = oldPath.split("/").pop()!.replace(/\.md$/i, "");
    const newBase = file.basename;

    if (type !== "task" && oldPath !== file.path) this.remapNavOrder(oldPath, file.path);   // navOrder ist pfadbasiert
    if (this.currentProject === oldPath) this.currentProject = file.path;
    if (this.currentFilter === oldPath) this.currentFilter = file.path;

    if (oldBase !== newBase) {
      if (type === "project" || type === "area") await this.remapListRefs(oldBase, newBase);
      else if (type === "task") await this.remapParentRefs(oldBase, newBase);
    }
    this.renderAll();
  }
  /** Projekt/Bereich umbenannt: Aufgaben-`project` (Wikilink) UND Filter-`projects` (Klartext) nachziehen. */
  private async remapListRefs(oldBase: string, newBase: string): Promise<void> {
    for (const task of this.index.all()) {
      if (this.wikiBase(task.project) !== oldBase) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        if (this.wikiBase(fm.project) === oldBase) fm.project = "[[" + newBase + "]]";
      });
    }
    for (const fl of listFilters(this.app)) {
      if (!fl.criteria.projects.includes(oldBase) && !fl.criteria.projectsNot.includes(oldBase)) continue;
      const f = this.app.vault.getAbstractFileByPath(fl.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        for (const key of ["projects", "projects_not"]) {
          if (Array.isArray(fm[key])) fm[key] = [...new Set((fm[key] as unknown[]).map(String).map((x) => (x === oldBase ? newBase : x)))];
        }
      });
    }
  }
  /** Aufgabe umbenannt: `parent`-Referenzen der Unteraufgaben nachziehen. */
  private async remapParentRefs(oldBase: string, newBase: string): Promise<void> {
    for (const task of this.index.all()) {
      if (this.wikiBase(task.parent) !== oldBase) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        if (this.wikiBase(fm.parent) === oldBase) fm.parent = "[[" + newBase + "]]";
      });
    }
  }
  /** navOrder-Schlüssel (Pfad) von alt → neu umhängen (project/area/filter). */
  private remapNavOrder(oldPath: string, newPath: string): void {
    const o = this.settings.navOrder;
    if (!o) return;
    let changed = false;
    for (const sec of ["projects", "areas", "filters"] as const) {
      const arr = o[sec]; const i = arr ? arr.indexOf(oldPath) : -1;
      if (arr && i >= 0) { arr[i] = newPath; changed = true; }
    }
    if (changed) void this.saveSettings();
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
    const wasOpen = this.currentLabel === name;
    await this.saveSettings();
    if (wasOpen) { await this.goToStartView(); return; }   // offenes Label gelöscht → Startansicht
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

  /** Manuelle Kanban-Spalten-Reihenfolge je Gruppierung setzen (board-eigen, entkoppelt von der
   *  Sidebar). keys = Spalten-IDs in gewünschter Reihenfolge (ohne Sentinel „Ohne …"). */
  async setBoardColumnOrder(groupKey: string, keys: string[]): Promise<void> {
    const map = this.settings.boardColumnOrder ?? {};
    map[groupKey] = keys;
    this.settings.boardColumnOrder = map;
    await this.saveSettings();
    this.renderAll();
  }
  /** Sichtbare Schlüssel einer Sektion in aktueller Reihenfolge (ohne die ausgeblendeten) –
   *  das ist genau die Menge, die die Seitenleiste zeigt. Basis fürs Sidebar-Umsortieren. */
  private visibleNavKeys(sec: NavSection): string[] {
    if (sec === "labels") return this.getVisibleLabels();
    if (sec === "filters") return this.sortFilters(listFilters(this.app)).filter((f) => !f.hidden).map((f) => f.path);
    const want = sec === "areas" ? "area" : "project";
    const items = listManaged(this.app).active.filter((p) => p.type === want && !p.hidden);
    return this.sortProjItems(sec, items).map((p) => p.path);
  }
  /** Neue Reihenfolge der SICHTBAREN Schlüssel anwenden (Seitenleisten-Umsortieren).
   *  Ausgeblendete behalten ihre absolute Position, damit ihre Reihenfolge nicht verloren geht. */
  async reorderVisible(sec: NavSection, visibleKeys: string[]): Promise<void> {
    const full = this.currentNavKeys(sec);
    const visSet = new Set(visibleKeys);
    let vi = 0;
    const merged = full.map((k) => (visSet.has(k) ? visibleKeys[vi++] : k));
    for (const k of visibleKeys) if (!full.includes(k)) merged.push(k);   // Sicherheitsnetz: neue Schlüssel
    await this.setNavOrder(sec, merged);
  }
  /** ↑/↓ im ÜBERSICHTS-Kontext: verschiebt in der VOLLEN Reihenfolge (inkl. Ausgeblendeter). */
  async moveNavItem(sec: NavSection, key: string, dir: -1 | 1): Promise<void> {
    await this.ensureManualSort(sec);   // ↑/↓ wirken nur im Manuell-Modus
    const keys = this.currentNavKeys(sec);
    const i = keys.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    await this.setNavOrder(sec, keys);
  }
  /** ↑/↓ im SEITENLEISTEN-Kontext: verschiebt NUR innerhalb der sichtbaren Reihenfolge
   *  (überspringt Ausgeblendete) – so bewegt sich in der Seitenleiste immer sichtbar etwas. */
  async moveNavItemVisible(sec: NavSection, key: string, dir: -1 | 1): Promise<void> {
    await this.ensureManualSort(sec);
    const vis = this.visibleNavKeys(sec);
    const i = vis.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= vis.length) return;
    [vis[i], vis[j]] = [vis[j], vis[i]];
    await this.reorderVisible(sec, vis);
  }
  /** Sicherstellen, dass eine Sektion im Manuell-Modus ist (Voraussetzung fürs Umsortieren). */
  async ensureManualSort(sec: NavSection): Promise<void> {
    if (this.navSortMode(sec) !== "manual") await this.setNavSort(sec, "manual");
  }
  /** „Reihenfolge ändern" aus der SEITENLEISTE: Drag-Sortiermodus (nur Sichtbare) starten. */
  async startReorder(sec: NavSection): Promise<void> {
    await this.ensureManualSort(sec);   // ruft bereits renderAll(), falls umgeschaltet
    this.reorderSec = sec;
    this.renderAll();
  }
  /** Seitenleisten-Sortiermodus beenden. */
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

  /** Registry aktualisieren, speichern, Index neu bewerten (isKnownStatus), Views neu. Vorher die
   *  Pflicht-Kategorien erzwingen (einziger Choke-Point aller Status-Mutationen). */
  private async commitStatuses(): Promise<void> {
    this.settings.statuses = ensureStatusInvariants(this.statusList());
    initStatuses(this.settings.statuses);
    await this.saveSettings();
    this.index.build();
    this.renderAll();
  }

  async addStatus(label: string, kind: StatusKind = "open"): Promise<void> {
    const name = label.trim();
    if (!name) return;
    if (kind === "cancelled") { new Notice(t("status_only_one_trash")); return; }   // Papierkorb = genau 1
    const list = this.statusList();
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "status";
    let id = base, n = 2;
    while (list.some((s) => s.id === id)) id = base + "-" + n++;
    const entry: StoredStatus = { id, label: name, kind, icon: kind === "done" ? "check-circle" : "circle" };
    // Ans Ende der eigenen Kategorie einsortieren (offen … · erledigt … · danach Papierkorb).
    let last = -1;
    for (let i = 0; i < list.length; i++) if (list[i].kind === kind) last = i;
    if (last >= 0) list.splice(last + 1, 0, entry);
    else { const cx = list.findIndex((s) => s.kind === "cancelled"); if (cx >= 0) list.splice(cx, 0, entry); else list.push(entry); }
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
    // Ziel „Papierkorb": genau 1 erlaubt -> nur, wenn noch keiner existiert.
    if (kind === "cancelled" && list.some((x) => x.kind === "cancelled")) { new Notice(t("status_only_one_trash")); return; }
    // Quelle darf nicht die letzte ihrer Pflicht-Kategorie sein (sonst bliebe sie leer).
    if (list.filter((x) => x.kind === s.kind).length <= 1) { new Notice(t("status_need_kind")); return; }
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

  /** Volle Status-Reihenfolge setzen (Drag&Drop-Sortierung im Status-Editor). Nicht genannte
   *  Ids werden ans Ende gehängt (Sicherheitsnetz), damit keine Definition verloren geht. */
  async setStatusOrder(ids: string[]): Promise<void> {
    const list = this.statusList();
    const byId = new Map(list.map((s) => [s.id, s]));
    const next = ids.map((id) => byId.get(id)).filter((s): s is StoredStatus => !!s);
    for (const s of list) if (!ids.includes(s.id)) next.push(s);
    this.settings.statuses = next;
    await this.commitStatuses();
  }

  /** Alle Status auf die eingebauten Defaults zurücksetzen (To-Do · In Arbeit · Erledigt · Papierkorb).
   *  Aufgaben mit eigenen, dann nicht mehr existierenden Status-IDs werden vom Index auf die erste
   *  offene Phase abgebildet (nicht-destruktiv am Frontmatter). */
  async resetStatuses(): Promise<void> {
    this.settings.statuses = DEFAULT_STATUSES.map((s) => ({ ...s }));
    await this.commitStatuses();
  }

  /** Status löschen: Aufgaben darauf werden auf einen gleichartigen Ersatz umgezogen (statt
   *  zu verwaisen). Leitplanken: mind. 1 je Kategorie (offen · erledigt · Papierkorb). */
  async deleteStatus(id: string): Promise<void> {
    const list = this.statusList();
    const s = list.find((x) => x.id === id);
    if (!s) return;
    // Pflicht-Kategorie darf nie leer werden -> letzten offen/erledigt/abgebrochen nicht löschbar.
    if (list.filter((x) => x.kind === s.kind).length <= 1) { new Notice(t("status_need_kind")); return; }
    // Ersatz gleicher Art (sonst irgendein offener), aber nie der zu löschende selbst.
    const target = list.find((x) => x.id !== id && x.kind === s.kind)?.id
      ?? list.find((x) => x.id !== id && x.kind === "open")?.id ?? firstOpenStatus();
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
  /** `due` (optional) schlägt `today`: der Kalender kann damit den angezeigten Tag vorgeben. */
  openNewTask(project?: string, label?: string, today = false, status?: TaskStatus, due?: string | null): void {
    new TaskModal(this, undefined, project, {
      defaultLabel: label, defaultToday: today, defaultStatus: status,
      seed: due ? { due } : undefined,
    }).open();
  }
  openEditTask(task: Task): void { new TaskModal(this, task).open(); }
  /** Bestehende Notiz zur Aufgabe machen: `type: task` + Kanon-Felder setzen. Ohne Projekt –
   *  landet damit (Variante A) automatisch im Eingang, bis der Nutzer sie zuordnet. */
  async convertActiveNoteToTask(f: TFile): Promise<void> {
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      fm.type = "task";
      ensureCanonicalFm(fm);
      if (typeof fm.status !== "string" || !fm.status) fm.status = firstOpenStatus();
    });
    await this.reconcileTaskDescription(f);   // Body → Beschreibung/Dokument einsortieren
    new Notice(t("notice_made_task"));
  }

  /** Beschreibungs-Modell für EINE Aufgaben-Notiz herstellen (idempotent):
   *  - hat sie schon eine Frontmatter-`description`, bleibt alles wie es ist;
   *  - ist der Body ein Dokument (eigener Inhalt), bleibt er stehen und bekommt einen Hinweis
   *    (`description`) plus einen „Notiz öffnen"-Kommentar mit Selbst-Wikilink;
   *  - ist der Body eine kurze Beschreibung, wandert sie ins Frontmatter und wird aus dem Body entfernt.
   *  Gibt zurück, was passiert ist (für die Migrations-Statistik). */
  private async reconcileTaskDescription(f: TFile): Promise<"none" | "moved" | "document"> {
    const fmNow: unknown = this.app.metadataCache.getFileCache(f)?.frontmatter?.description;
    if (typeof fmNow === "string" && fmNow.trim()) return "none";   // schon migriert
    const content = await this.app.vault.cachedRead(f);
    // Inhalt VOR der ersten „# Überschrift" getrennt betrachten: splitContent verwirft ihn, also
    // darf er NIE über den (rewritenden) „moved"-Zweig laufen – sonst ginge er verloren.
    const afterFm = content.replace(/^---\n[\s\S]*?\n---\n/, "");
    const h1 = afterFm.search(/^#\s+/m);
    const preH1 = (h1 > 0 ? afterFm.slice(0, h1) : "").trim();
    const bodyDesc = splitContent(content).description;         // zwischen H1 und Log
    const combined = (preH1 + "\n" + bodyDesc).trim();
    if (!combined) return "none";
    // Dokument: eigener Inhalt bleibt im Body, Hinweis + „Notiz öffnen"-Kommentar (rein additiv).
    if (preH1 || isDocumentBody(combined)) {
      await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        if (typeof fm.description !== "string" || !fm.description) fm.description = t("desc_note_content_hint");
      });
      await ensureNoteLinkLog(this.app, f, t("log_open_note"));
      return "document";
    }
    // Kurze Beschreibung (kein Pre-H1-Inhalt): ins Frontmatter verschieben und aus dem Body entfernen.
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { fm.description = bodyDesc; });
    await writeDescription(this.app, f, "");
    return "moved";
  }

  /** Einmalige Migration: bestehende Body-Beschreibungen ins Frontmatter überführen bzw. Dokumente
   *  mit „Notiz öffnen"-Kommentar versehen. Idempotent – mehrfaches Ausführen ist gefahrlos. */
  async migrateDescriptions(opts: { silent?: boolean } = {}): Promise<void> {
    const tasks = this.index.all();
    let moved = 0, docs = 0;
    for (const tk of tasks) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (!(f instanceof TFile)) continue;
      const r = await this.reconcileTaskDescription(f);
      if (r === "moved") moved++; else if (r === "document") docs++;
      await this.normalizeLog(f);   // bestehende Logs: altes 📄 entfernen + Log-Überschrift ergänzen
    }
    this.settings.didDescriptionMigration = true;
    await this.saveSettings();
    if (!opts.silent) { window.setTimeout(() => this.index.build(), 400); new Notice(t("notice_desc_migrated", moved, docs)); }
  }

  /** Einmalige Migration „Inbox-Notiz entfernen": übernimmt View-Optionen + GCal-Ausschluss der
   *  alten Inbox-Notiz in die Settings, löst `[[Inbox]]`-Verweise auf (kein Projekt) und verschiebt
   *  die Notiz in Obsidians Papierkorb. Idempotent (setzt `didInboxRemoval`); auch manuell aufrufbar. */
  async migrateInboxRemoval(opts: { silent?: boolean } = {}): Promise<void> {
    const path = inboxNotePath(this.app);
    const noteFile = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (noteFile instanceof TFile) {
      const fm = this.app.metadataCache.getFileCache(noteFile)?.frontmatter;
      if (fm?.gcal_sync === false && this.settings.gcal) this.settings.gcal.excludeInbox = true;   // Ausschluss übernehmen
      const opts = readNoteViewOptions(this.app, noteFile.path);                                    // Anzeige-Optionen übernehmen
      this.settings.pageViewOptions = { ...(this.settings.pageViewOptions ?? {}), inbox: opts };
    }
    // Alle `[[Inbox]]`-Verweise auflösen -> kein Projekt (verhindert kaputte Wikilinks nach dem Löschen).
    let unlinked = 0;
    for (const tk of this.index.all()) {
      if (!tk.project || !isInboxName(tk.project.split("/").pop()!.replace(/\.md$/, ""))) continue;
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) { await this.app.fileManager.processFrontMatter(f, (m: Record<string, unknown>) => { delete m.project; }); unlinked++; }
    }
    // Notiz in den Papierkorb (wiederherstellbar), nicht hart löschen.
    if (noteFile instanceof TFile) await this.app.fileManager.trashFile(noteFile);
    this.settings.didInboxRemoval = true;
    await this.saveSettings();
    if (!opts.silent) { window.setTimeout(() => this.index.build(), 400); new Notice(t("notice_inbox_removed", unlinked)); }
  }

  /** Beim ERSTEN Start nach einem Update die ausstehenden Einmal-Migrationen automatisch ausführen
   *  (per Flag abgesichert, nie doppelt). Für neue Vaults sind beide No-Ops (keine Alt-Daten). */
  private async runPendingMigrations(): Promise<void> {
    if (this.settings.didDescriptionMigration && this.settings.didInboxRemoval) return;   // nichts offen
    // Frischer Vault ohne Alt-Daten? -> Flags still setzen, aber keine Notice/kein Neuaufbau.
    const hasData = this.index.all().length > 0 || inboxNotePath(this.app) !== null;
    if (!this.settings.didDescriptionMigration) await this.migrateDescriptions({ silent: true });
    if (!this.settings.didInboxRemoval) await this.migrateInboxRemoval({ silent: true });
    if (hasData) { this.index.build(); this.renderAll(); new Notice(t("notice_auto_migrated")); }
  }

  /** Bestehenden Log einer Notiz auf den aktuellen Stand bringen (verlustfrei): führendes „📄 " aus
   *  „Notiz öffnen"-Einträgen entfernen und die einklappbare Log-Überschrift ergänzen, falls sie fehlt. */
  private async normalizeLog(f: TFile): Promise<void> {
    const content = await this.app.vault.cachedRead(f);
    const { log } = splitContent(content);
    if (!log) return;
    const entries = parseDetailLog(log, nowLogTs(new Date(f.stat.mtime)));
    let changed = false;
    for (const e of entries) { const s = e.body.replace(/^📄\s*/, ""); if (s !== e.body) { e.body = s; changed = true; } }
    if (changed || !content.includes(LOG_HEADING)) await writeLog(this.app, f, entries);
  }
  /** Neue Aufgabe mit vorbelegter Fälligkeit – Klick auf einen Kalendertag bzw. Zeit-Slot.
   *  Projekt/Label erbt sie von der Seite, auf der der Kalender steht (wie „+ Aufgabe" der Liste). */
  openNewTaskOn(due: string, dueTime?: string | null, project?: string, label?: string): void {
    new TaskModal(this, undefined, project, {
      defaultLabel: label,
      seed: { due, dueTime: dueTime ?? null },
    }).open();
  }
  openQuickAdd(project?: string): void { new QuickAddModal(this, project).open(); }

  /**
   * Kontext der aktuell geöffneten Seite für „Aufgabe hinzufügen" – spiegelt exakt das, was der
   * „+ Aufgabe"-Knopf UNTER DEM SEITENTITEL tut. Das ist die ganze Regel: Der Command macht
   * dasselbe wie der sichtbare Knopf. Seiten ohne Knopf (Wiederkehrend, Erledigt, Verwaltung,
   * Filter) belegen nichts vor -> Eingang, wie bisher.
   */
  addContext(): { project?: string; label?: string; today: boolean; due: string | null } {
    const page = this.currentPage();
    // Kalender-Tagesansicht: der angezeigte Tag, nicht zwingend heute (wie „+ Aufgabe" dort).
    const due = calendarDayAnchor(this, this.pageViewOptions());
    if (page.kind === "project") return { project: projectName(page.key), today: false, due };
    if (page.kind === "label") return { label: page.key, today: false, due };
    if (page.kind === "view" && page.key === "heute") return { today: true, due };
    return { today: false, due };
  }

  /** „Neue Aufgabe" (voller Editor) im Kontext der aktuellen Seite. */
  openNewTaskHere(): void {
    const c = this.addContext();
    this.openNewTask(c.project, c.label, c.today, undefined, c.due);
  }

  /** „Aufgabe schnell erfassen" im Kontext der aktuellen Seite. */
  openQuickAddHere(): void {
    const c = this.addContext();
    new QuickAddModal(this, c.project, { label: c.label, due: c.due, today: c.today }).open();
  }
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
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); if (isoVal) fm[field] = isoVal; else delete fm[field]; });
  }

  /** Sammel-Verschieben („Verschieben" im Kopf der Überfällig-Sektion): setzt `due` ALLER
   *  übergebenen Aufgaben auf `isoVal`; leerer Wert („Kein Datum") entfernt die Fälligkeit.
   *
   *  Enthält `isoVal` KEINE Uhrzeit, behält jede Aufgabe ihre eigene: 15 überfällige Aufgaben
   *  haben 15 verschiedene Uhrzeiten, und ein reiner Datumswechsel ist keine Aussage über sie.
   *  Erst eine im Picker ausdrücklich gesetzte Uhrzeit gilt für alle.
   *
   *  Sequenziell wie restoreAllCancelled – processFrontMatter parallel auf vielen Dateien
   *  handelt sich Schreibkonflikte ein. Teuer ist das nicht: Index (50 ms) und GCal-Sync (2 s)
   *  fassen die Änderungen ohnehin zu je EINEM Lauf zusammen. */
  async rescheduleTasks(tasks: Task[], isoVal: string): Promise<void> {
    if (!tasks.length) return;
    const date = dateOf(isoVal), time = timeOf(isoVal);
    for (const task of tasks) await this.setTaskDate(task, "due", date ? combineDT(date, time ?? task.dueTime) : "");
    new Notice(t("report_tasks_moved", tasks.length));
  }

  async setTaskDuration(task: Task, minutes: number | null): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); if (minutes) fm.duration = minutes; else delete fm.duration; });
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
  /** Ein Label an einer Aufgabe tauschen (Kanban „nach Label", Drag zwischen Label-Spalten):
   *  entfernt `remove` (falls gesetzt) und fügt `add` hinzu (falls gesetzt) – andere Labels bleiben.
   *  Der metadataCache-Listener zeichnet danach neu (wie bei setTaskStatus). */
  /** Fehlende Kanon-Felder einer handgeschriebenen `type: task`-Notiz nachtragen – idempotent,
   *  lazy: läuft nur, wenn der Nutzer die Aufgabe erstmals ÜBER DIE APP anfasst (Status/Projekt/
   *  Label/Datum ändern, abschließen …). So bleibt `id` über Umbenennen und GCal-Sync stabil,
   *  ohne dass beim Laden fremde Notizen umgeschrieben werden. `status`/`project` bleiben unberührt
   *  (fehlendes `project` ist bedeutungstragend = Eingang). */
  private ensureCanonical(fm: Record<string, unknown>): void { ensureCanonicalFm(fm); }
  async swapTaskLabel(task: Task, remove: string | null, add: string | null): Promise<void> {
    if (remove === add) return;
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      this.ensureCanonical(fm);
      let arr = Array.isArray(fm.labels) ? (fm.labels as unknown[]).map(String) : [];
      if (remove) arr = arr.filter((x) => x !== remove);
      if (add && !arr.includes(add)) arr.push(add);
      fm.labels = arr;
    });
  }
  /** Priorität einer Aufgabe setzen (Kanban „nach Priorität"). „normal" = kein Frontmatter-Feld. */
  async setTaskPriority(task: Task, priority: Priority): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      this.ensureCanonical(fm);
      fm.priority = priority !== "normal" ? priority : null;
    });
  }
  /** Aufgabe einem Projekt/Bereich zuordnen (Kanban „nach Projekt"). null = kein Projekt.
   *  Referenz als `[[Basename]]` – wie im Task-Modal; der Index löst den Basename auf. */
  /**
   * Aufgabe von Hand einsortieren: sie soll VOR `before` stehen (null = ans Ende ihrer Gruppe).
   *
   * Die Gruppe sind ALLE Geschwister – gleicher Parent, quer über Spalten, Status und Seiten. Nur
   * die sichtbaren zu nummerieren würde die übrigen auf `null` lassen; die rutschten dann in jeder
   * anderen Ansicht ans Ende. Abgebrochene bleiben draußen, die stehen im Papierkorb.
   *
   * Im Normalfall schreibt das EINE Notiz (Mitte zwischen den Nachbarn). Nur in den Sonderfällen aus
   * planReorder (kein/leerer Nachbar, erschöpfte Lücke) wird die Gruppe still neu durchnummeriert.
   */
  async moveTaskBefore(task: Task, before: Task | null): Promise<void> {
    const siblings = this.index.all().filter((t) => t.parent === task.parent && !isTrashed(t.status));
    const ordered = sortTasks(siblings, "manual", "asc", (t) => this.index.orderKey(t));
    const writes = planReorder(ordered, task, before?.path ?? null);
    for (const w of writes) {
      const f = this.app.vault.getAbstractFileByPath(w.path);
      if (!(f instanceof TFile)) continue;
      await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        this.ensureCanonical(fm);
        fm.sort_order = w.order;
      });
    }
  }

  async setTaskProject(task: Task, project: string | null): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      this.ensureCanonical(fm);
      fm.project = project ? "[[" + project + "]]" : null;
    });
  }
  async setTaskStatus(task: Task, status: TaskStatus): Promise<void> {
    if (task.status === status) return;
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    const wasDone = isDone(task.status);
    const nowDone = isDone(status);
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      this.ensureCanonical(fm);
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
    await this.trashTasks([task]);
  }

  /** Aufgaben in den Papierkorb – jede inkl. ihres Unteraufgaben-Baums (collectTrashTargets: Dedup
   *  bei überlappenden Bäumen, bereits abgebrochene ausgelassen). EIN gemeinsamer Zeitstempel (mit
   *  Uhrzeit/Sekunden, NICHT nur Datum: sonst hätten alle am selben Tag gelöschten denselben
   *  Sortierwert und der Papierkorb fiele bei Gleichstand auf die Datei-Reihenfolge zurück). Das
   *  `project`-Feld bleibt unberührt (wie beim Einzel-Abbrechen). */
  private async trashTasks(roots: Task[]): Promise<void> {
    const stamp = localStamp();
    const cancelId = firstCancelledStatus();   // definierter Abgebrochen-Status oder Sentinel "cancelled"
    const targets = collectTrashTargets(roots, (p) => this.index.descendants(p));
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); fm.status = cancelId; fm.cancelled = stamp; });
    }
  }

  /** Einzelne Aufgabe wiederherstellen: zurück auf offen, Abbruch-Datum entfernen. */
  async restoreTask(task: Task): Promise<void> {
    // Symmetrisch zur Kaskaden-Abbrechen-Logik: die Aufgabe UND alle abgebrochenen
    // Unteraufgaben zurückholen, sonst blieben Kinder allein im Papierkorb liegen.
    const targets = [task, ...this.index.descendants(task.path)].filter((tk) => isTrashed(tk.status));
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); fm.status = firstOpenStatus(); delete fm.cancelled; });
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
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); fm.status = firstOpenStatus(); delete fm.cancelled; });
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
    // Migration: früheres globales chipOrder/chipTiers -> Editor-Profil (Flächen ab jetzt getrennt).
    const legacy = (saved ?? {}) as Record<string, unknown>;
    if ((legacy.chipOrder || legacy.chipTiers) && !this.settings.chipProfiles) {
      this.settings.chipProfiles = {
        editor: { order: legacy.chipOrder as ChipId[] | undefined, tiers: legacy.chipTiers as Partial<Record<ChipId, ChipTier>> | undefined },
      };
    }
    // (Der Kompakt-Modus wird NICHT mehr hier gesetzt: Er hing früher an der Installation – wer
    // zuerst auf dem Handy installierte, bekam ihn gespeichert und per Sync auch auf den Desktop,
    // wer zuerst am Desktop installierte, nie. Das Gerät ist keine Eigenschaft des Vaults, also
    // entscheidet das jetzt chipsCompact() beim Zeichnen. Siehe chips.ts.)
    // Pflicht-Kategorien garantieren (offen/erledigt/abgebrochen), self-healing – z. B. re-added
    // ein versehentlich gelöschter Papierkorb-Status. Danach die Registry setzen.
    this.settings.statuses = ensureStatusInvariants(this.settings.statuses);
    initStatuses(this.settings.statuses);   // Status-Registry aus den Einstellungen (sonst Defaults)
    // Google-Kalender-Sub-Objekt mit Defaults auffüllen (fehlende/neue Felder ergänzen,
    // gespeicherte Werte behalten). Lebendes Objekt – Auth/Engine mutieren tokens/lastSynced darin.
    this.settings.gcal = Object.assign({}, DEFAULT_GCAL_SETTINGS, this.settings.gcal);
    this.settings.gcalFeed = Object.assign({}, DEFAULT_GCAL_FEED_SETTINGS, this.settings.gcalFeed);
  }
  async saveSettings(): Promise<void> { await this.saveData(this.settings); }

  /** Die drei Textgrößen-Skalierungen (Nutzer-Prozent/100) als CSS-Variablen auf <body> setzen.
   *  Die styles.css multipliziert damit die geerbte Basis-Größe: bei 100 % (Faktor 1) unverändert
   *  wie ohne Anpassung. Nach einer Änderung in den Einstellungen erneut aufrufen (sofort sichtbar). */
  applyFontSizes(): void {
    const s = this.settings;
    const set = (name: string, pct: number): void => document.body.style.setProperty(name, String(pct / 100));
    set("--bt-task-scale", s.fontTaskPct);
    set("--bt-nav-scale", s.fontNavPct);
    set("--bt-head-scale", s.fontHeadingPct);
    set("--bt-section-scale", s.fontSectionPct);
  }

  /** Google-Auth + Push-Engine aufbauen (UI-agnostisch). Beide mutieren `settings.gcal`
   *  in place; Persistenz läuft über saveSettings (data.json). Auf Unload wird gestoppt. */
  private setupGCal(): void {
    const gcal = this.settings.gcal!;
    const store: TokenStore = {
      load: () => gcal.tokens,
      save: async (tokens) => { gcal.tokens = tokens; await this.saveSettings(); },
    };
    this.gcalAuth = new GCalAuth(
      () => ({ clientId: gcal.clientId, clientSecret: gcal.clientSecret }),
      store,
    );
    const host: GCalSyncHost = {
      app: this.app,
      settings: gcal,
      persist: () => this.saveSettings(),
      allTasks: () => this.index.all(),
      subscribe: (cb) => this.index.subscribe(cb),
    };
    this.gcalSync = new GCalSync(host, this.gcalAuth);
    this.register(() => this.gcalSync.stop());   // Auto-Push-Abo + Debounce beim Unload lösen

    // Termin-Anzeige (read-only). Teilt sich die Verbindung mit dem Sync, ist aber sonst
    // unabhängig: „nur anzeigen, nichts schreiben" ist ein vollwertiger Zustand.
    const feedHost: GCalFeedHost = {
      settings: this.settings.gcalFeed!,
      syncCalendarId: () => this.settings.gcal!.calendarId,
      persist: () => this.saveSettings(),
      isVisible: () => this.app.workspace.getLeavesOfType(VIEW_MAIN).some((l) => l.view.containerEl.isShown()),
    };
    this.gcalFeed = new GCalFeed(feedHost, this.gcalAuth);
    this.register(() => this.gcalFeed.stop());
    // Neue Termine -> Ansicht nachziehen. Entprellt, weil ein Lauf mehrfach meldet
    // (Status „lädt", je Monat/Kalender einmal Daten, Status „fertig").
    this.register(this.gcalFeed.onChange(() => this.scheduleFeedRedraw()));
    this.register(() => { if (this.feedRedrawTimer) window.clearTimeout(this.feedRedrawTimer); });

    // Statusleiste: dünner Abonnent des Engine-Status (Ruhe/Sync/Fehler). Klick = manuell syncen.
    const bar = this.addStatusBarItem();
    bar.addClass("bt-gcal-sb");
    bar.addEventListener("click", () => void this.gcalSync.syncNow());
    this.gcalStatusBar = bar;
    this.register(this.gcalSync.onStatus((i) => this.renderStatusBar(i)));   // ruft sofort initial
  }

  /** Termin-Änderungen gebündelt nachzeichnen (siehe onChange-Abo in setupGCal). */
  private scheduleFeedRedraw(): void {
    if (this.feedRedrawTimer) return;
    this.feedRedrawTimer = window.setTimeout(() => {
      this.feedRedrawTimer = null;
      this.renderMain();
    }, 50);
  }

  /** Statusleiste zeichnen (nur wenn verbunden UND showStatusBar). Icon + Tooltip je Zustand. */
  private renderStatusBar(i: GCalStatusInfo): void {
    const bar = this.gcalStatusBar;
    if (!bar) return;
    const g = this.settings.gcal!;
    const show = g.showStatusBar && this.gcalAuth.isConnected();
    bar.style.display = show ? "" : "none";
    if (!show) return;
    bar.empty();
    bar.toggleClass("mod-error", i.status === "error");
    const icon = i.status === "syncing" ? "refresh-cw" : i.status === "error" ? "alert-circle" : "calendar-sync";
    setIcon(bar.createSpan({ cls: "bt-gcal-sb-ic" }), icon);
    const detail = i.status === "syncing" ? t("gcal_syncing")
      : i.status === "error" ? t("gcal_sync_error", i.lastError ?? "") + " — " + t("gcal_reconnect_hint")
      : t("gcal_last_synced", i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleTimeString() : t("gcal_never"));
    bar.setAttr("aria-label", t("set_gcal_heading") + " · " + detail);
  }

  /** Statusleiste neu zeichnen (nach Verbinden/Abmelden oder Toggle showStatusBar). */
  refreshGCalStatusBar(): void { this.renderStatusBar(this.gcalSync.getStatus()); }

  /** Ist diese Liste vom Kalender-Sync ausgeschlossen? Eingang -> Setting, sonst gcal_sync:false der Notiz. */
  isListGcalExcluded(path: string): boolean {
    if (path === INBOX_KEY) return this.settings.gcal?.excludeInbox ?? false;
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return false;
    const fm: Record<string, unknown> | undefined = this.app.metadataCache.getFileCache(f)?.frontmatter;
    return fm?.gcal_sync === false;
  }

  /** Liste ein-/ausschließen, danach syncen. Eingang -> Setting, sonst gcal_sync-Flag der Notiz. */
  async setListGcalExcluded(path: string, excluded: boolean): Promise<void> {
    if (path === INBOX_KEY) {
      if (this.settings.gcal) { this.settings.gcal.excludeInbox = excluded; await this.saveSettings(); }
      void this.gcalSync.syncNow();
      return;
    }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      if (excluded) fm.gcal_sync = false; else delete fm.gcal_sync;
    });
    void this.gcalSync.syncNow();
  }

  /** Mit Google verbinden: Login (Desktop-Loopback bzw. Mobile-Device-Flow), danach Anzeige-
   *  E-Mail holen, bei Bedarf eigenen „BeautyTasks"-Kalender anlegen, aktivieren, initial pushen.
   *  Wirft bei Fehler (die UI zeigt die Meldung). */
  async gcalConnect(onDevicePrompt?: (p: DevicePrompt) => void): Promise<void> {
    const g = this.settings.gcal!;
    await this.gcalAuth.connect(onDevicePrompt);
    try { g.account = await fetchAccountEmail(this.gcalAuth); } catch { g.account = null; }
    // Ziel-Kalender sicherstellen: leer ODER zeigt auf einen nicht (mehr) existierenden Kalender
    // (z. B. in Google gelöscht) -> eigenen „BeautyTasks"-Kalender finden/anlegen. Eine bewusst
    // gewählte, noch existierende Wahl bleibt unangetastet. Schlägt es fehl (z. B. Recht nicht
    // bestätigt), bleibt calendarId leer -> die Settings zeigen einen deutlichen Hinweis.
    try {
      const cals = await this.gcalCalendars();
      if (!g.calendarId || !cals.some((c) => c.id === g.calendarId)) {
        g.calendarId = await ensureDefaultCalendar(this.gcalAuth, g.timezone);
      }
    } catch (e) { console.warn("BeautyTasks: Ziel-Kalender konnte nicht sichergestellt werden", e); }
    g.enabled = true;
    await this.saveSettings();
    this.refreshGCalStatusBar();
    void this.gcalSync.syncNow();
  }

  /** Verbindung trennen (Token widerrufen + löschen). Kalenderwahl bleibt für erneutes Verbinden. */
  async gcalDisconnect(): Promise<void> {
    const g = this.settings.gcal!;
    await this.gcalAuth.disconnect();
    g.account = null;
    g.enabled = false;
    await this.gcalFeed.clear();   // gezeigte Termine + Snapshot verwerfen (Verbindung ist weg)
    await this.saveSettings();
    this.refreshGCalStatusBar();
    this.renderMain();
  }

  /** Kalenderliste für den Ziel-Kalender-Picker. */
  gcalCalendars(): Promise<CalendarInfo[]> { return listCalendars(this.gcalAuth); }

  /** Eigenen „BeautyTasks"-Kalender anlegen (oder vorhandenen finden) und als Ziel setzen.
   *  Bestehende Events ziehen beim nächsten Sync via move nach. Braucht den calendar.app.created-
   *  Scope → nach Scope-Erweiterung ggf. einmal neu verbinden. Wirft bei Fehler (UI zeigt Meldung). */
  async gcalCreateDefaultCalendar(): Promise<void> {
    const g = this.settings.gcal!;
    g.calendarId = await ensureDefaultCalendar(this.gcalAuth, g.timezone);
    await this.saveSettings();
    void this.gcalSync.syncNow();
  }
}
