import { Plugin, Notice, TFile, TAbstractFile, WorkspaceLeaf, WorkspaceParent, PaneType, Platform, moment, setIcon, addIcon } from "obsidian";
import { BeautyTasksSettings, Task, TaskStatus, Priority, StoredStatus, StatusKind, NavSection, NavSortMode, ChipId, ChipTier, CalEvent, DeviceState, DEFAULT_DEVICE_STATE } from "./types";
import { isDone, initStatuses, ensureStatusInvariants, firstOpenStatus, firstDoneStatus, firstCancelledStatus, isTrashed, DEFAULT_STATUSES, statusLabel } from "./statuses";
import { schemaVersionOf, pendingSteps, nextSchemaVersion } from "./schema";
import { applyDefaults, toDelta } from "./settingsDelta";
import { forcedStartPage, newTabPage, fromLegacyStartView } from "./startPage";
import { resolveReminders } from "./reminders";
import { TaskIndex } from "./taskIndex";
import { runMigration } from "./migrate";
import {
  MainView, NavView, VIEW_MAIN, VIEW_NAV, VIEW_IDS, viewTitle, ViewId, OLD_VIEW_TYPES,
} from "./heuteView";
import { PageRef, pageInfo, samePage } from "./pageCtx";
import { activePlanTabs, pageNoteFile, openDailyNote, NOTE_ICON, DAILY_ICON } from "./planTabs";
import { TaskModal } from "./taskModal";
import { QuickAddModal } from "./quickAddModal";
import { createTaskNote, transitionStamps, createProjectNote, setProjectType, setProjectArchived, setNavHidden, setProjectColor, setProjectDescription, renameProjectNote, deleteProjectNote, normalizeLabel, listManaged, listProjectsAndAreas, ensureCanonicalFm, isUnderFolder, INBOX_KEY, inboxNotePath, isInboxName, ProjItem, baseName } from "./taskService";
import { splitContent, isDocumentBody, hasOwnContent, ensureNoteLinkLog, writeDescription, writeLog, parseDetailLog, nowLogTs, LOG_HEADING } from "./detailLog";
import { titleKey, fmTitle, firstH1, findH1Line, findH1LineInBody, titleToStore, dropHeadingLine } from "./taskTitle";
import { FieldId, fieldKey, initFieldNames, allFieldNames, isTypeRenameTarget } from "./fieldNames";
import { createFilterNote, updateFilterNote, deleteFilterNote, setFilterNavHidden, setFilterColor, renameFilterNote, listFilters, readFilter, FilterItem } from "./filterService";
import { FilterCriteria, ViewOptions, DEFAULT_OPTIONS, DEFAULT_CRITERIA, applyFilter, sortTasks, planReorder, collectTrashTargets, subtasksToDuplicate, ORDER_GAP } from "./filterEngine";
import { ConfirmModal } from "./confirmModal";
import { readNoteViewOptions, setNoteViewOption, readViewOptions, readNoteCriteria, setNoteCriteria, readCriteria, writeCriteria } from "./pageOptions";
import { nextInstance } from "./recurrence";
import { todayStr, localStamp, dateOf, timeOf, combineDT } from "./format";
import { t, setLocale } from "./i18n";
import { BeautyTasksSettingTab } from "./settingsTab";
import { TaskSearchModal } from "./searchModal";
import { writeExportFile, parseExport, importData, JsonFilePickerModal, pickOsJsonFile } from "./importExport";
import { ImportTaskNotesModal } from "./importTaskNotes";
import { WhatsNewModal } from "./whatsNew";
import { calendarDayAnchor } from "./calendarView";
import { GCalAuth, TokenStore, DevicePrompt, GCalTokens, planTokenMigration } from "./gcalAuth";
import { GCalSync, GCalSyncHost, GCalCache, LegacyGCalLink, emptyGCalCache, calIndex, seedGCalCache, resignLegacySignature, DEFAULT_GCAL_SETTINGS, listCalendars, ensureDefaultCalendar, fetchAccountEmail, CalendarInfo, GCalStatusInfo } from "./gcalSync";
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

// Geräte-lokale Schlüssel (app.saveLocalStorage). Sie liegen bewusst NICHT in data.json:
// Der Refresh-Token ist ein Dauerzugriff auf den Google-Kalender und würde sonst über jeden
// Sync-Dienst, jedes Backup und jede Versionshistorie mitwandern. Obsidian trennt den Speicher
// bereits pro Vault, deshalb reicht ein Präfix je Zweck.
const GCAL_TOKEN_KEY = "beautytasks-gcal-tokens";
const GCAL_RECONNECT_KEY = "beautytasks-gcal-reconnect-notified";
const GCAL_CACHE_KEY = "beautytasks-gcal-cache";        // Abgleich-Stand (war gcal.lastSynced/syncTokens)
const GCAL_SNAPSHOT_KEY = "beautytasks-gcal-snapshot";  // Kaltstart-Termine (war gcalFeed.snapshot)
const DEVICE_STATE_KEY = "beautytasks-device";          // Geräte-Zustand (s. DeviceState in types.ts)

export default class BeautyTasksPlugin extends Plugin {
  settings!: BeautyTasksSettings;
  index!: TaskIndex;
  gcalAuth!: GCalAuth;
  gcalSync!: GCalSync;
  gcalFeed!: GCalFeed;
  private gcalCache!: GCalCache;   // geräte-lokal (GCAL_CACHE_KEY), NICHT in data.json
  private device!: DeviceState;    // geräte-lokal (DEVICE_STATE_KEY), NICHT in data.json
  private gcalStatusBar: HTMLElement | null = null;
  private feedRedrawTimer: number | null = null;
  // WELCHE SEITE OFFEN IST, steht NICHT mehr hier: das gehört seit 1.34 dem jeweiligen Tab
  // (MainView.page, s. pageCtx.ts). Am Plugin bleibt nur, was es wirklich nur einmal gibt.
  colorPreview: { key: string; color: string } | null = null;   // Live-Vorschau der Icon-Farbe (Farb-Picker), NICHT persistiert
  reorderSec: NavSection | null = null;                 // aktiver Drag-Sortiermodus in der Seitenleiste (transient, nur Sichtbare)
  flashPath: string | null = null;                       // aus der Suche angesprungene Aufgabe (kurz hervorgehoben)
  flashScrolled = false;                                 // pro Sprung nur einmal ins Bild scrollen
  private lastMain: MainView | null = null;              // zuletzt benutzter Dashboard-Tab (s. activeMain)
  /** Ursprüngliches Reiter-Icon der Notiz-Tabs, die der Planungs-Split übermalt hat – zum
   *  Zurückgeben, sobald ein Tab nicht mehr dazugehört (s. setLeafIcon/clearStalePlanTabs).
   *  Eine WeakMap, damit ein geschlossener Tab hier nichts festhält. */
  private planTabIcons = new WeakMap<WorkspaceLeaf, string>();
  private reminderScan = 0;                              // Obergrenze des zuletzt geprüften Zeitfensters (Epoch-ms)

  async onload(): Promise<void> {
    registerIcons();
    await this.loadSettings();
    this.applyLocale();                        // "auto" folgt Obsidian; sonst EN (Kanon) / DE
    this.applyFontSizes();                     // überschreibbare Textgrößen als body-CSS-Variablen
    this.applyColors();                        // vom Nutzer gewählte Meta-Farben als body-CSS-Variablen
    this.register(() => {                      // beim Entladen die gesetzten Body-Anpassungen wieder entfernen
      for (const n of ["--bt-task-scale", "--bt-nav-scale", "--bt-head-scale", "--bt-section-scale",
        "--bt-accent", "--bt-dist-overdue", "--bt-dist-today", "--bt-dist-d1", "--bt-dist-d2", "--bt-dist-week", "--bt-dist-far",
        "--bt-c-recur", "--bt-c-remind", "--bt-c-sched", "--bt-c-label", "--bt-c-comments", "--bt-c-subs", "--bt-c-parent", "--bt-c-backlink"]) document.body.style.removeProperty(n);
      document.body.removeClasses(["bt-meta-minimalisdo", "bt-meta-colorado"]);   // Meta-Theme-Klassen (s. renderMain) entfernen
    });

    this.index = new TaskIndex(this.app, () => this.settings);
    this.addChild(this.index);
    // KEIN globales Abo hier: MainView und NavView abonnieren den Index selbst (onOpen) und
    // zeichnen sich bei jeder Meldung neu. Ein zusätzliches renderAll() hier hieße, dass jede
    // Änderung BEIDE Views doppelt zeichnet – im Profil ~110 ms je Zeichnung, also glatt
    // verdoppelte Freezes. renderAll() bleibt für explizite Anlässe (Layout-Wechsel, Settings).
    this.setupGCal();
    // Reminder-Scanfenster: bei echtem Vorwert Verpasstes nachfeuern (auf Grace begrenzt),
    // bei Erstinstallation (0) ab jetzt starten -> kein Fehlalarm für heute Vergangenes.
    this.reminderScan = this.device.reminderLastScan || Date.now();
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
      this.applyStartPage();   // wiederhergestellten Tab auf die eingestellte Startseite schicken
      await this.runPendingMigrations();   // Einmal-Migrationen beim ersten Start nach dem Update
      this.scanReminders();   // Startlauf (fängt beim Öffnen kürzlich Verpasstes)
      this.seedGCalCacheIfEmpty();   // MUSS vor dem ersten Lauf stehen – sonst Massen-Push
      this.gcalSync.start();  // Auto-Push verdrahten + einmal initial abgleichen
      void this.gcalSync.syncNow();
      this.gcalFeed.start();  // Termine holen (ruhiges Intervall, nur bei sichtbarer Ansicht)
      this.gcalFeed.refreshIfStale();
      this.noticeGCalNeedsReconnect();
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
    // Tab-Wechsel merken: welcher Dashboard-Tab ist gemeint, wenn die Seitenleiste navigiert?
    // Bewusst NUR bei einem Dashboard-Leaf reagieren – wechselt der Fokus in die Seitenleiste
    // (also genau beim Klick dorthin), bleibt alles stehen. Ein renderNav() an dieser Stelle
    // führe c.empty() mitten in der Klick-Geste aus und schluckte den Klick (s. layout-change).
    this.registerEvent(this.app.workspace.on("active-leaf-change", (leaf) => {
      if (!(leaf?.view instanceof MainView)) return;
      leaf.view.drawIfDirty();   // war der Tab verdeckt, ist seine Zeichnung nachzuholen
      if (this.lastMain === leaf.view) return;
      this.lastMain = leaf.view;
      this.renderNav();   // Markierung folgt dem Tab im Vordergrund
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
        const type: unknown = this.app.metadataCache.getFileCache(f)?.frontmatter?.[fieldKey("type")];
        if (type === "task" || type === "project" || type === "area" || type === "filter") return false;
        if (!checking) void this.convertActiveNoteToTask(f);
        return true;
      },
    });
    this.addCommand({ id: "plan-split", name: t("plan_open"), callback: () => void this.openPlanSplit() });
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
    this.addCommand({ id: "migrate-titles", name: t("cmd_migrate_titles"), callback: () => void this.migrateTitles() });
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
    // Meta-Thema: nur „Colorado" braucht eine Body-Klasse (färbt einige Icons); Minimalisdo & User
    // nutzen die Body-Basis (grau), User zusätzlich die Overrides aus applyColors.
    document.body.toggleClass("bt-meta-colorado", this.settings.metaTheme === "colorado");
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

  /** Alle offenen Dashboard-Tabs. */
  mainViews(): MainView[] {
    return this.app.workspace.getLeavesOfType(VIEW_MAIN)
      .map((l) => l.view).filter((v): v is MainView => v instanceof MainView);
  }
  /**
   * Der Tab, dem Navigation aus der Seitenleiste folgt und dessen Seite dort markiert wird.
   *
   * Bewusst NICHT getActiveViewOfType: sobald man in die Seitenleiste klickt, ist DIE der aktive
   * Leaf und die Antwort wäre null – ein Klick auf ein Projekt landete dann immer im ersten Tab
   * statt in dem, den man gerade angesehen hat. Gemeint ist der ZULETZT benutzte Dashboard-Tab,
   * den `lastMain` mitschreibt (s. active-leaf-change in onload).
   */
  activeMain(): MainView | null {
    const views = this.mainViews();
    const last = this.lastMain;
    return (last && views.includes(last)) ? last : views[0] ?? null;
  }
  /** Seite des aktiven Tabs – Grundlage der Markierung in der Seitenleiste (s. renderNavInto). */
  activePage(): PageRef | null { return this.activeMain()?.page ?? null; }

  // ── Öffnen / Navigieren ──
  async openBeautyTasks(): Promise<void> {
    await this.activateNav();
    await this.openPage(this.newTabStartPage());
  }

  /** UI-Sprache anwenden: "auto" folgt Obsidians Sprache (via moment-Locale), sonst der
   *  gewählte Code. `moment.locale()` statt `getLanguage()` – letzteres bräuchte App ≥ 1.8.7. */
  applyLocale(): void {
    setLocale(this.settings.locale === "auto" ? moment.locale() : this.settings.locale);
  }

  /** Gibt es diese Seite noch? Verhindert, dass eine gelöschte Startseite ins Leere führt. */
  pageExists(page: PageRef): boolean {
    if (page.kind === "view") return (VIEW_IDS as string[]).includes(page.key);
    // Auch AUSGEBLENDETE Labels gelten als vorhanden – sie sind wählbar (s. listStartPages)
    // und dürfen als Startseite nicht plötzlich als gelöscht gelten.
    if (page.kind === "label") return this.getLabels().some((l) => l.name === page.key);
    if (page.kind === "filter") return listFilters(this.app).some((f) => f.path === page.key);
    if (page.kind === "project") {
      if (page.key === INBOX_KEY) return true;
      const { bereiche, projekte } = listProjectsAndAreas(this.app);
      return [...bereiche, ...projekte].some((p) => p.path === page.key);
    }
    return false;
  }

  /** Startseite für einen NEUEN Tab (Band-Symbol, Befehl, frischer Tab).
   *  Öffentlich, weil der MainView-Konstruktor damit startet. */
  newTabStartPage(): PageRef {
    return newTabPage(this.settings.startPage, this.device.lastView, (p) => this.pageExists(p));
  }

  /** Beim Start: den aktiven BeautyTasks-Tab auf die eingestellte Seite schicken. Andere Tabs
   *  bleiben stehen – wer sich mehrere Seiten eingerichtet hat, soll sie behalten. Bei „zuletzt
   *  benutzte" passiert gar nichts, dann gilt die wiederhergestellte Seite des Tabs. */
  private applyStartPage(): void {
    const forced = forcedStartPage(this.settings.startPage, (p) => this.pageExists(p));
    if (!forced) return;
    const views = this.mainViews();
    if (!views.length) return;
    const aktiv = this.app.workspace.getActiveViewOfType(MainView);
    const ziel = (aktiv && views.includes(aktiv)) ? aktiv : views[0];
    if (!samePage(ziel.page, forced)) ziel.openPage(forced);
  }
  /**
   * Jeden Tab, der die betroffene Seite zeigt, zur Startansicht schicken – wenn ihr Eintrag
   * (Projekt/Bereich/Label/Filter) gelöscht oder archiviert wurde. Früher ein einzelner
   * Wechsel, weil es nur eine Ansicht gab; seit es mehrere Tabs gibt, muss JEDER betroffene
   * weg, sonst bliebe in einem davon das leere Board eines gelöschten Eintrags stehen.
   */
  private leaveDeletedPage(page: PageRef): void {
    const start: PageRef = this.newTabStartPage();
    for (const v of this.mainViews()) if (samePage(v.page, page)) v.openPage(start);
    this.renderAll();
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

  /**
   * Eine Seite öffnen. Ohne `where` landet sie im zuletzt benutzten Dashboard-Tab (gibt es keinen,
   * entsteht einer). Mit `where` entsteht IMMER ein neuer: "tab" · "split" (rechts daneben) ·
   * "window" – bzw. direkt der Rückgabewert von Keymap.isModEvent, damit Strg-/Mittelklick genau
   * das tun, was der Nutzer in Obsidian ohnehin gewohnt ist.
   */
  async openPage(page: PageRef, where?: PaneType | boolean): Promise<MainView | null> {
    const { workspace } = this.app;
    if (page.kind === "view" && this.device.lastView !== page.key) {
      this.device.lastView = page.key; this.saveDevice();   // für startView === "last"
    }
    const target = where ? null : this.activeMain();
    if (target) {
      target.openPage(page);
      await workspace.revealLeaf(target.leaf);
      target.drawIfDirty();             // lag der Tab im Hintergrund, steht seine Zeichnung noch aus
      return target;
    }
    const leaf = workspace.getLeaf(where ?? "tab");
    await leaf.setViewState({ type: VIEW_MAIN, active: true, state: { kind: page.kind, key: page.key } });
    await workspace.revealLeaf(leaf);   // awaited -> View vollständig geladen
    const view = leaf.view instanceof MainView ? leaf.view : null;
    view?.drawIfDirty();
    this.renderNav();
    return view;
  }

  /**
   * Planungs-Split: dieselbe Seite links als Liste, rechts das, was in den Einstellungen
   * eingeschaltet ist – Kalender, Projektnotiz, Tagesnotiz (s. planTabs.ts).
   *
   * Warum ein Befehl und nicht „mach dir zwei Tabs auf": Planen ist EINE Bewegung – sehen, was zu
   * tun ist, und entscheiden, wann. Erst nebeneinander lässt sich eine Zeile in einen Tag ziehen,
   * statt sie über den Datumswähler zu terminieren. Dass niemand sich diese Anordnung von Hand
   * zusammensetzt, ist der eigentliche Grund für den Befehl.
   *
   * Das Layout wird NUR am jeweiligen Tab gesetzt (useLocal), nicht als Seiten-Standard: Der
   * Split ist eine Anordnung für jetzt, keine Aussage darüber, wie das Projekt künftig aussehen
   * soll – sonst stünde es beim nächsten Öffnen unversehens im Kalender.
   *
   * Die Notiz-Hälften sind bewusst ECHTE Markdown-Tabs und kein eingebauter Betrachter: Damit
   * gibt es Live-Vorschau, Bearbeiten, Einbettungen und Rückverweise geschenkt, und der Tab
   * gehört sichtbar dem Nutzer – er kann ihn schließen, anpinnen oder wegziehen.
   *
   * Mobil kennt keine sinnvollen Splits (und keinen HTML5-Zug): dort werden daraus Reiter.
   */
  async openPlanSplit(page?: PageRef): Promise<void> {
    const wanted = page ?? this.activeMain()?.page;
    // Seiten ohne Layout-Wahl (Wiederkehrend, Erledigt, Verwaltung) haben keine Kalender-Ansicht –
    // ein Split daraus wäre zweimal dieselbe Liste. Aus dem Kontextmenü kann das gar nicht kommen
    // (der Eintrag fehlt dort), über die Befehlspalette schon: dann wird die Startansicht geplant.
    const target: PageRef = wanted && pageInfo(wanted).tier !== "none"
      ? wanted : this.newTabStartPage();
    const roles = activePlanTabs(this.app, this.settings, target);

    // Steht schon ein Planungs-Split? Dann DIESE Tabs weiterverwenden statt neben ihnen weitere
    // aufzumachen: „Planen" für eine andere Seite ersetzt die Anordnung, es legt keine zweite an.
    // Ohne das wuchs die Zahl der Ansichten mit jedem Aufruf.
    const open = this.mainViews();
    const known = (role: "list" | "calendar"): MainView | null => open.find((v) => v.planRole === role) ?? null;

    // Die Listen-Hälfte: die bekannte, sonst schlicht der Tab, in dem man gerade steht.
    //
    // Bewusst OHNE Vorbehalt gegen die Kalender-Hälfte: Wer sie vor sich hat und „Planen" ruft,
    // bekommt sie als Liste und den Rest frisch daneben. Ein NEUER Tab stattdessen ergäbe eine
    // dritte Ansicht, und genau das soll der Befehl nicht tun. Ein Tab entsteht deshalb nur,
    // wenn es überhaupt kein Dashboard gibt.
    let left = known("list") ?? this.activeMain();
    if (left) left.openPage(target);
    else left = await this.openPage(target, "tab");
    if (!left) return;
    // Vor dem Abspalten den Fokus auf die Liste legen – nur so entsteht der neue Bereich NEBEN
    // ihr und nicht neben irgendeinem anderen, der zufällig zuletzt aktiv war.
    this.focusMain(left);

    const home = left.leaf.parent;
    // Auf Mobil gibt es keine Splits: dort ist die „rechte Gruppe" dieselbe Gruppe, und die
    // Hälften sind Reiter nebeneinander.
    const mobil = Platform.isMobile;

    // Die Kalender-Hälfte weiterverwenden – aber nur, wenn sie das überhaupt sein KANN:
    //  • nicht derselbe Tab, der oben schon zur Liste wurde,
    //  • und (auf dem Desktop) nicht in derselben Tab-Gruppe wie die Liste. Die Rolle sagt, WOZU
    //    ein Tab gehört, nicht WO er liegt; ein Kalender-Tab neben der Liste in derselben Gruppe
    //    ist ein Reiter HINTER ihr und kein Split. Dann gibt er seine Rolle ab.
    let cal = known("calendar");
    if (cal === left) cal = null;
    if (!mobil && cal && cal.leaf.parent === home) { cal.planRole = null; cal = null; }

    // ── Die rechte Gruppe wiederfinden ──
    // Erst über den Kalender-Tab (der trägt eine Rolle). Gibt es keinen – weil er abgeschaltet
    // ist –, über die Dateien, die die Liste sich gemerkt hat: Ein MarkdownView kann keine
    // planRole tragen, deshalb ist ihr Pfad der einzige Anker, den wir haben.
    let group: WorkspaceParent | null = mobil ? home : (cal?.leaf.parent ?? null);
    if (!group) {
      for (const path of Object.values(left.planMates ?? {})) {
        const mate = path ? this.leafShowing(path) : null;
        if (mate && (mobil || mate.parent !== home)) { group = mate.parent; break; }
      }
    }
    let anchor: WorkspaceLeaf | null = mobil ? left.leaf : (cal?.leaf ?? null);
    if (!anchor && group) anchor = this.leavesIn(group)[0] ?? null;

    /**
     * Einen weiteren Tab in der rechten Gruppe erzeugen – bzw. sie überhaupt erst abspalten.
     *
     * `anchor` ist die EINFÜGESTELLE, nicht bloß „irgendein Tab der Gruppe": getLeaf("tab") hängt
     * den neuen Reiter direkt HINTER den aktiven. Deshalb muss der Anker nach jedem Platzieren
     * weiterrücken (s. unten). Blieb er stehen, landete jeder weitere Tab wieder gleich hinter
     * dem ersten – bei drei Einträgen stand der dritte dann vor dem zweiten.
     */
    const nextLeaf = (): WorkspaceLeaf => {
      if (anchor) {
        // Ohne diesen Fokuswechsel landete der neue Reiter neben der LISTE statt drüben.
        this.app.workspace.setActiveLeaf(anchor, { focus: false });
        return this.app.workspace.getLeaf("tab");
      }
      this.focusMain(left);
      return this.app.workspace.getLeaf(mobil ? "tab" : "split");
    };

    const mates: Partial<Record<"note" | "daily", string>> = {};
    const placed: WorkspaceLeaf[] = [];
    // Parallel zu `placed`: das Tab-Icon der Notiz-Hälften (leer = eigene View, bringt ihres
    // selbst mit). Angewandt wird es erst NACH dem Umsortieren – ein verschobener Reiter ist
    // ein neu erzeugter, und dessen View kennt unsere Zuweisung noch nicht.
    const icons: string[] = [];

    for (const role of roles) {
      if (role === "calendar") {
        let view = cal;
        if (view) view.openPage(target);
        else {
          const leaf = nextLeaf();
          await leaf.setViewState({ type: VIEW_MAIN, active: true, state: { kind: target.kind, key: target.key } });
          view = leaf.view instanceof MainView ? leaf.view : null;
        }
        if (!view) continue;
        // Seitenspalte („Nicht terminiert") zu: Der Split halbiert die Breite, und ihre Aufgabe
        // erfüllt hier die LISTE links – sie ist die Quelle, aus der man ins Raster zieht. Offen
        // bliebe ein zweiter Vorrat, der dem Kalender den Platz nimmt, für den man geteilt hat.
        // Nur für diesen Tab: der Seiten-Standard („offen") gilt beim normalen Öffnen weiter.
        view.useLocal({ layout: "calendar", calPanel: false }, "calendar");
        cal = view;
        placed.push(view.leaf);
        icons.push("");       // MainView.getIcon() liefert das Layout-Icon selbst
        anchor = view.leaf;   // Einfügestelle rückt weiter – der nächste Tab gehört DAHINTER
        group ??= view.leaf.parent;
        continue;
      }

      // ── Notiz-Hälften ──
      // Einen vorhandenen Tab NUR weiterverwenden, wenn dort noch genau die Datei steht, die wir
      // hingelegt haben. Ist der Nutzer von dort einem Link gefolgt oder hat er den Tab
      // angepinnt, gehört er ihm – dann wird er nicht überschrieben, sondern danebengelegt.
      const remembered = left.planMates?.[role];
      const reuse = remembered ? this.leafShowing(remembered, group) : null;
      const leaf = (reuse && !reuse.getViewState().pinned) ? reuse : nextLeaf();
      const fresh = leaf !== reuse;

      let ok = false;
      if (role === "note") {
        const file = pageNoteFile(this.app, target);
        if (file) { await leaf.openFile(file); ok = true; }
      } else {
        ok = await openDailyNote(this.app, leaf);
      }
      if (!ok) {
        // Nichts zu öffnen (Tagesnotiz ließ sich nicht anlegen): einen gerade erst erzeugten,
        // leeren Tab wieder wegräumen statt ihn stehen zu lassen.
        if (fresh) leaf.detach();
        continue;
      }
      const shown = (leaf.getViewState().state as { file?: unknown } | undefined)?.file;
      if (typeof shown === "string") mates[role] = shown;
      placed.push(leaf);
      icons.push(role === "daily" ? DAILY_ICON : NOTE_ICON);
      anchor = leaf;   // Einfügestelle rückt weiter – der nächste Tab gehört DAHINTER
      group ??= leaf.parent;
    }

    left.planMates = Object.keys(mates).length ? mates : null;
    left.useLocal({ layout: "list" }, "list");
    await this.sortPlanTabs(placed);
    placed.forEach((leaf, i) => { if (icons[i]) this.setLeafIcon(leaf, icons[i]); });
    this.clearStalePlanTabs(placed);
    // Vorn liegt der ERSTE eingeschaltete Eintrag: Die Reihenfolge in den Einstellungen IST die
    // Rangfolge (s. planTabs.ts). Ohne das läge der zuletzt erzeugte Tab vorn – bei „Kalender +
    // Notiz" also die Notiz, und der Kalender, für den man geteilt hat, wäre unsichtbar.
    if (placed[0]) await this.app.workspace.revealLeaf(placed[0]);
    // Sichtbar gewordene Dashboard-Tabs nachzeichnen: draw() merkt sich bei verdecktem Tab nur
    // vor (dirty) – wie in openPage() muss das nach dem Hervorholen nachgeholt werden.
    for (const leaf of placed) if (leaf.view instanceof MainView) leaf.view.drawIfDirty();
    // Fokus zurück auf die Liste: Sie ist die Quelle des Zugs und die Seite, auf der man arbeitet.
    // Nebenwirkung mit Absicht – die Seitenleiste navigiert damit weiter die Liste. „Vorn" und
    // „fokussiert" sind hier zwei verschiedene Dinge.
    this.focusMain(left);
  }

  /**
   * Die Tabs des Planungs-Splits in die eingestellte Reihenfolge bringen.
   *
   * Nötig, weil vorhandene Tabs weiterverwendet werden: Wer die Reihenfolge in den Einstellungen
   * ändert, hätte sonst zwar den richtigen Tab vorn, aber die alte Abfolge in der Leiste.
   *
   * Obsidian hat keine API zum Verschieben eines Reiters. Ein Tab wandert deshalb, indem an der
   * richtigen Stelle ein neuer entsteht, der seinen Zustand übernimmt (getViewState +
   * getEphemeralState – bei einer Notiz also auch Cursor und Scrollstand), und der alte
   * geschlossen wird. `placed` wird dabei mitgeführt, damit der Aufrufer weiter die echten
   * Leaves in der Hand hat.
   *
   * Angerührt wird nur, was WIRKLICH falsch steht: Steht die Reihenfolge schon (der Normalfall),
   * passiert hier gar nichts – kein Flackern, kein verlorener Bearbeitungsstand. Angepinnte Tabs
   * bleiben ebenfalls unberührt; sie gehören dem Nutzer.
   */
  private async sortPlanTabs(placed: WorkspaceLeaf[]): Promise<void> {
    if (placed.length < 2) return;
    const group = placed[0].parent;
    for (let i = 1; i < placed.length; i++) {
      const leaf = placed[i];
      const before = placed[i - 1];
      if (leaf.parent !== group || before.parent !== group) continue;
      const reihe = this.leavesIn(group);
      if (reihe.indexOf(leaf) > reihe.indexOf(before)) continue;   // steht schon richtig
      if (leaf.getViewState().pinned) continue;
      const state = leaf.getViewState();
      const eState: unknown = leaf.getEphemeralState();   // liefert `any` – hier festnageln
      this.app.workspace.setActiveLeaf(before, { focus: false });
      const fresh = this.app.workspace.getLeaf("tab");
      await fresh.setViewState({ ...state, active: false });
      fresh.setEphemeralState(eState);
      leaf.detach();
      placed[i] = fresh;
    }
  }

  /**
   * Das Reiter-Icon eines fremden (Markdown-)Tabs setzen.
   *
   * ══ Reiter-Icons gibt es im Plugin auf ZWEI Wegen – dies ist der andere ════════
   * Der Gegenpart ist MainView.getIcon() in heuteView.ts (dort steht der Vergleich
   * ausführlich). Kurz: Unsere eigenen Tabs ÜBERSCHREIBEN getIcon() und leiten ihr Zeichen
   * bei jeder Zeichnung neu ab – selbstkorrigierend, ohne CSS. Hier geht beides nicht, weil
   * die View Obsidian gehört: Das Zeichen wird GESTEMPELT und muss aufgeräumt werden, und
   * sichtbar wird es erst durch eine eigene CSS-Klasse.
   * ═══════════════════════════════════════════════════════════════════════════════
   *
   * Zwei Schritte, weil zwei Dinge im Weg stehen:
   *
   * 1. `View.icon` ist öffentlich (seit 1.1.0) und `getIcon()` der ItemView liefert genau diesen
   *    Wert – MarkdownView überschreibt das nicht. Gesetzt wird NACH dem Öffnen der Datei: Ein
   *    FileView richtet sein Icon beim Laden selbst ein und überschriebe unseres sonst wieder.
   *
   * 2. Damit allein bleibt der Reiter LEER. Obsidian versteckt das Icon von Notiz-Tabs im
   *    Hauptbereich absichtlich:
   *      .mod-root .workspace-tab-header[data-type="markdown"] .workspace-tab-header-inner-icon
   *        { display: none }
   *    und `data-type` ist wörtlich `view.getViewType()` – bei einer Notiz also "markdown". Der
   *    Kalender-Reiter trägt deshalb ein Icon und die Notiz-Reiter nicht; an unserem Zuweisen
   *    liegt es nicht. Aufgehoben wird die Regel deshalb per eigener Klasse, und NUR für die
   *    Reiter, die dieser Befehl anlegt – alle übrigen Notiz-Tabs des Vaults bleiben, wie
   *    Obsidian sie vorsieht (s. styles.css, „bt-plan-tab").
   *
   * `tabHeaderEl` steht nicht in der Typdatei. Fehlt es einmal, bleibt der Reiter schlicht ohne
   * Icon – nichts bricht. Ein Neuzeichnen überlebt die Klasse: updateHeader() setzt nur
   * `data-type` und `mod-unknown`, es räumt keine fremden Klassen ab.
   */
  private setLeafIcon(leaf: WorkspaceLeaf, icon: string): void {
    const host = leaf as WorkspaceLeaf & { updateHeader?: () => void; tabHeaderEl?: HTMLElement };
    // Das ursprüngliche Zeichen einmalig merken – nur so lässt sich der Reiter später wieder
    // zurückgeben (s. clearStalePlanTabs). Beim zweiten Aufruf auf demselben Tab stünde dort
    // sonst UNSER Icon als „Original".
    if (!this.planTabIcons.has(leaf)) this.planTabIcons.set(leaf, leaf.view.icon);
    leaf.view.icon = icon;
    host.tabHeaderEl?.addClass("bt-plan-tab");
    host.updateHeader?.();
  }

  /**
   * Reiter, die nicht mehr zur Anordnung gehören, wieder zurückgeben.
   *
   * Folgt man aus der Projektnotiz einem Link, steht in diesem Tab etwas anderes – er gehört
   * dann dem Nutzer, und der Befehl legt beim nächsten Aufruf einen frischen daneben (s. die
   * Weiterverwenden-Regel oben). Ohne dieses Aufräumen behielte der abgewanderte Tab aber
   * unser Icon und die Klasse und sähe weiter aus wie ein Teil der Planungsansicht.
   *
   * Gesucht wird im ganzen Arbeitsbereich, nicht nur in der rechten Gruppe: Ein solcher Tab
   * kann längst woandershin gezogen worden sein.
   */
  private clearStalePlanTabs(keep: WorkspaceLeaf[]): void {
    this.app.workspace.iterateAllLeaves((leaf) => {
      const host = leaf as WorkspaceLeaf & { updateHeader?: () => void; tabHeaderEl?: HTMLElement };
      const el = host.tabHeaderEl;
      if (!el?.hasClass("bt-plan-tab") || keep.includes(leaf)) return;
      el.removeClass("bt-plan-tab");
      const vorher = this.planTabIcons.get(leaf);
      if (vorher !== undefined) { leaf.view.icon = vorher; this.planTabIcons.delete(leaf); }
      host.updateHeader?.();
    });
  }

  /** Alle Leaves einer Tab-Gruppe (Reihenfolge = Anzeige). */
  private leavesIn(group: WorkspaceParent): WorkspaceLeaf[] {
    const out: WorkspaceLeaf[] = [];
    this.app.workspace.iterateAllLeaves((l) => { if (l.parent === group) out.push(l); });
    return out;
  }

  /** Der (erste) Tab, in dem diese Datei offen steht – optional auf eine Gruppe eingegrenzt.
   *  Über getViewState statt über den View-Typ: Es geht um den PFAD, egal ob Markdown, PDF
   *  oder Bild – und so braucht main.ts keine Ansichtsklassen dafür zu kennen. */
  private leafShowing(path: string, group?: WorkspaceParent | null): WorkspaceLeaf | null {
    const out: WorkspaceLeaf[] = [];
    this.app.workspace.iterateAllLeaves((l) => {
      if (group && l.parent !== group) return;
      const st = l.getViewState().state as { file?: unknown } | undefined;
      if (st?.file === path) out.push(l);
    });
    return out[0] ?? null;
  }

  /**
   * Einen Dashboard-Tab wirklich AKTIV machen.
   *
   * revealLeaf reicht dafür nicht: Es holt einen Leaf „in den Vordergrund" (und klappt eine
   * Seitenleiste auf) – bei zwei nebeneinanderliegenden Panes sind aber beide längst sichtbar,
   * also tut es schlicht nichts. Der zuletzt erzeugte Split blieb dadurch der aktive Leaf, und
   * die Seitenleiste navigierte anschließend den KALENDER statt der Liste.
   */
  private focusMain(view: MainView): void {
    this.app.workspace.setActiveLeaf(view.leaf, { focus: true });
    this.lastMain = view;
  }

  // Bequeme Namen für die Seitenleiste, Menüs und Commands – alle landen in openPage().
  async activateView(id: ViewId): Promise<void> { await this.openPage({ kind: "view", key: id }); }
  async activateProject(path: string): Promise<void> { await this.openPage({ kind: "project", key: path }); }
  async activateLabel(label: string): Promise<void> { await this.openPage({ kind: "label", key: label }); }
  async activateFilter(path: string): Promise<void> { await this.openPage({ kind: "filter", key: path }); }
  async activateManage(section: "projects" | "areas" | "labels" | "filters" = "projects", tab: "active" | "archive" = "active"): Promise<void> {
    await this.openPage({ kind: "manage", key: section });
    // Default „Aktiv": Der Aktiv/Archiv-Umschalter ist eine Sicht INNERHALB der Übersicht, kein Zustand
    // der Anwendung – wer sie neu aufruft, will die aktiven Projekte sehen. Ausnahme: von der Seite
    // eines ARCHIVIERTEN Projekts „Zur Archivübersicht" landet gezielt im Archiv-Tab (tab="archive").
    const v = this.activeMain();
    if (v) { v.ctx().setManageTab(tab); v.draw(); }
  }

  // ── Anzeige pro Seite (Layout/Sortieren/Gruppieren/Erledigte) ──
  // Gespeichert wird JE SEITE (Projekt-/Filter-Frontmatter bzw. Settings) – das bleibt so, auch
  // wenn mehrere Tabs dieselbe Seite zeigen. Nur das LAYOUT kann ein Tab für sich überschreiben
  // (MainView.setLayout); alles andere beschreibt den Inhalt der Seite, nicht den Blick darauf.
  /** Gespeicherte Anzeige-Optionen einer Seite (aus Frontmatter bzw. Settings). */
  pageOptions(page: PageRef): ViewOptions {
    const p = pageInfo(page);
    if (p.kind === "project") return readNoteViewOptions(this.app, p.key);
    if (p.kind === "filter") { const fl = readFilter(this.app, p.key); return fl ? fl.options : { ...DEFAULT_OPTIONS }; }
    return readViewOptions(this.settings.pageViewOptions?.[p.kind === "label" ? "label:" + p.key : p.key]);
  }
  /** Eine Anzeige-Option einer Seite setzen – am richtigen Ort gespeichert. */
  async setPageOption(page: PageRef, patch: Partial<ViewOptions>): Promise<void> {
    const p = pageInfo(page);
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
  /** Anzeige-Optionen einer Seite auf Default zurücksetzen – einschließlich ihres Ansichtsfilters.
   *  „Zurücksetzen" im Panel muss ALLES aufheben, was die Seite gerade von ihrem Normalzustand
   *  entfernt; ein stehen gebliebener Filter wäre danach die einzige Erklärung für fehlende
   *  Aufgaben – und die einzige, die der Knopf gerade beseitigt zu haben scheint. */
  async resetPageOptions(page: PageRef): Promise<void> {
    const p = pageInfo(page);
    if (p.kind === "project") {
      this.refreshOnChange(p.key);
      await setNoteViewOption(this.app, p.key, { ...DEFAULT_OPTIONS });
      await setNoteCriteria(this.app, p.key, { ...DEFAULT_CRITERIA });
      return;
    }
    if (p.kind === "filter") { const fl = readFilter(this.app, p.key); if (fl) await this.updateFilter(p.key, fl.criteria, { ...DEFAULT_OPTIONS }, fl.color); return; }
    const skey = p.kind === "label" ? "label:" + p.key : p.key;
    if (this.settings.pageViewOptions) delete this.settings.pageViewOptions[skey];
    if (this.settings.pageFilters) delete this.settings.pageFilters[skey];
    await this.saveSettings();
    this.renderMain();
  }

  // ── Ansichtsfilter pro Seite ──
  // Dasselbe Muster wie die Anzeige-Optionen, ein Feld weiter: Der Filter beschreibt, WELCHE
  // Aufgaben die Seite zeigt, gehört also zur Seite und nicht zum Tab (anders als das Layout).
  // Gespeicherte Filter bekommen keinen: Dort sind die Kriterien die Seite selbst, ein zweiter
  // Satz darüber wäre für niemanden mehr auseinanderzuhalten – ihr Editor ist der Stift im Kopf.
  /** Ansichtsfilter einer Seite (Standard = keine Kriterien). */
  pageCriteria(page: PageRef): FilterCriteria {
    const p = pageInfo(page);
    if (p.kind === "filter" || page.kind === "manage") return { ...DEFAULT_CRITERIA };
    if (p.kind === "project") return readNoteCriteria(this.app, p.key);
    return readCriteria(this.settings.pageFilters?.[p.kind === "label" ? "label:" + p.key : p.key]);
  }
  /** Kriterien einer Seite ändern – am richtigen Ort gespeichert. */
  async setPageCriteria(page: PageRef, patch: Partial<FilterCriteria>): Promise<void> {
    const p = pageInfo(page);
    if (p.kind === "filter" || page.kind === "manage") return;
    if (p.kind === "project") { this.refreshOnChange(p.key); await setNoteCriteria(this.app, p.key, patch); return; }
    const map = this.settings.pageFilters ?? {};
    const skey = p.kind === "label" ? "label:" + p.key : p.key;
    const next: Record<string, unknown> = {};
    writeCriteria(next, { ...readCriteria(map[skey]), ...patch });
    if (Object.keys(next).length) map[skey] = next; else delete map[skey];
    this.settings.pageFilters = map;
    await this.saveSettings();
    this.renderMain();
  }

  // ── Gespeicherte Filter (type:filter-Notizen) ──
  /** Neuen Filter anlegen und öffnen. Wie createProject wartet ein einmaliger „changed"-
   *  Listener auf den frisch geparsten Frontmatter, bevor zum neuen Filter-Board gewechselt wird. */
  async createFilter(name: string, criteria: FilterCriteria, options: ViewOptions, color: string | null = null, hidden = false, description = ""): Promise<void> {
    const base = await createFilterNote(this.app, this.settings, name, criteria, options, color, hidden, description);
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
    this.leaveDeletedPage({ kind: "filter", key: path });
  }

  /** Aus der Suche gewählte Aufgabe in ihrer Liste zeigen: zum Projekt-/Inbox-Board
   *  (bzw. passenden Datums-/Erledigt-View) springen und die Zeile kurz hervorheben
   *  – als führe man mit der Maus darüber. `flashPath` wird beim Zeichnen von der
   *  Task-Zeile ausgewertet (robust gegen Neu-Zeichnen durch active-leaf-change). */
  async revealTask(task: Task): Promise<void> {
    this.flashPath = task.path;
    this.flashScrolled = false;
    if (task.project) {
      await this.activateProject(task.project);
    } else if (isDone(task.status)) {
      await this.activateView("erledigt");
    } else if (task.due && task.due <= todayStr()) {
      await this.activateView("heute");
    } else {
      await this.activateView("demnaechst");   // datiert (künftig) oder ohne Datum
    }
    // Erledigt-Sektion des ZIEL-Tabs aufklappen (sonst ist die Zeile verborgen) – nach dem
    // Wechsel, weil ein Seitenwechsel den Klappzustand des Tabs auf die Vorgabe zurücksetzt.
    if (isDone(task.status)) {
      const v = this.activeMain();
      if (v) { v.ctx().setDoneCollapsed(false); v.draw(); }
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
  async createProject(name: string, asArea = false, color: string | null = null, hidden = false, description = ""): Promise<void> {
    await createProjectNote(this.app, this.settings, name, asArea, color, hidden, description);
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
    // Archivieren eines offenen Projekts/Bereichs → betroffene Tabs zur Startansicht (Board wäre sonst „weg").
    if (archived) this.leaveDeletedPage({ kind: "project", key: path });
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
  /** Steht in der Notiz mehr als Frontmatter und eine Titelzeile? Nur zum Anzeigen eines Hinweises
   *  beim Löschen – gelesen wird über den Metadaten-Cache-Pfad, geschrieben wird nichts. */
  private noteHasOwnBody(path: string): boolean {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof TFile)) return false;
    const cache = this.app.metadataCache.getFileCache(f);
    // Überschriften jenseits der Titelzeile ODER irgendein Abschnitt außer Frontmatter/Titel.
    const heads = cache?.headings ?? [];
    const secs = (cache?.sections ?? []).filter((x) => x.type !== "yaml" && x.type !== "heading");
    return secs.length > 0 || heads.length > 1;
  }

  async setProjectDescription(path: string, description: string): Promise<void> {
    await setProjectDescription(this.app, path, description);
    this.renderAll();
  }

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
    this.leaveDeletedPage({ kind: "project", key: path });
  }

  /** Die (nicht schon im Papierkorb liegenden) Aufgaben eines Projekts/Bereichs – inkl. Unterbäume,
   *  dedupliziert. Basis für Zähler UND Kaskade, damit beide dieselbe Zahl sehen. Bewusst
   *  allInProject (jeder Status, auch archiviert), NICHT byProject (nur offen, ohne Archiv). */
  private projectTrashTargets(path: string): Task[] {
    return collectTrashTargets(this.index.allInProject(path), (p) => this.index.descendants(p));
  }

  /** Projekt/Bereich löschen UND seine Aufgaben (rekursiv) in den plugin-Papierkorb verschieben.
   *  Das Projekt selbst wandert wie immer in Obsidians Papierkorb. */
  async deleteProjectWithTasks(path: string): Promise<void> {
    await this.trashTasks(this.index.allInProject(path));
    await this.deleteProject(path);
  }

  /** Löschen-Abfrage für ein Projekt/Bereich mit Zwei-Optionen-Wahl: Häkchen an = Aufgaben in den
   *  Papierkorb (Kaskade), Häkchen aus (Default) = nur das Projekt löschen, die Aufgaben landen über
   *  den ungültig gewordenen Verweis im Eingang (s. severReferences/Einheit B). Der Zähler zeigt die
   *  EHRLICHE Gesamtzahl inkl. Unteraufgaben. Ohne Aufgaben entfällt das Häkchen. `onAfter` läuft nur
   *  nach tatsächlichem Löschen (nicht bei Abbruch) – z. B. um die Verwalten-Ansicht neu zu zeichnen. */
  confirmDeleteProject(path: string, name: string, onAfter?: () => void): void {
    const targets = this.projectTrashTargets(path);
    const count = targets.length;
    // „(inkl. erledigte)" nur, wenn wirklich Erledigte in der Zahl stecken – erklärt die Differenz
    // zur Übersicht (die nur offene zählt), ohne bei reinen Offen-Projekten fälschlich Erledigte zu
    // behaupten. Präziser Body statt des zu strengen „Kann nicht rückgängig…": bei Aufgaben sagen,
    // was standardmäßig passiert (bleiben erhalten -> Eingang; das Häkchen ist die Alternative ->
    // Papierkorb). Ohne Aufgaben kein Text – keine falsche Endgültigkeits-Behauptung.
    const hasDone = targets.some((tk) => isDone(tk.status));
    // Hat der Nutzer eigene Inhalte in die Projektnotiz geschrieben? Dann sagen, dass sie mitgeht –
    // sie landet im Obsidian-Papierkorb, ist also wiederherstellbar, aber unerwähnt bleiben soll es
    // nicht. Der Body wird nur gelesen, nie angefasst.
    const own = this.noteHasOwnBody(path);
    const body = [count > 0 ? t("confirm_delete_project_body") : "", own ? t("confirm_delete_note_body") : ""]
      .filter(Boolean).join(" ");
    new ConfirmModal(this.app, {
      title: t("confirm_delete_title", name),
      message: body || undefined,
      checkbox: count > 0 ? { label: t(hasDone ? "confirm_delete_with_tasks_done" : "confirm_delete_with_tasks", count) } : undefined,
    }, (withTasks) => {
      void (async () => {
        if (withTasks) await this.deleteProjectWithTasks(path);
        else await this.deleteProject(path);
        onAfter?.();
      })();
    }).open();
  }

  // ── Import / Export (JSON) ──
  //  „Verlustfrei" stand hier einmal und stimmte nie ganz. Was NICHT mitwandert, steht in
  //  importExport.ts oben: die Definitionen eigener Status (nur ihre Werte reisen mit, samt
  //  Hinweis nach dem Import) und ein Symbol, das an einem BEREICH gesetzt wurde.
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
      // Zweite Meldung NUR im Ausnahmefall: Status, die dieser Vault nicht kennt, werden als
      // offen angezeigt. Ohne Hinweis merkt das niemand – der Wert steht weiter in der Notiz.
      if (r.unknownStatusTasks) new Notice(t("notice_import_unknown_status", r.unknownStatusTasks, r.unknownStatuses.join(", ")), 0);
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
    for (const v of this.mainViews()) if (samePage(v.page, { kind: "label", key: oldName })) v.openPage({ kind: "label", key: nu });
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
    const type = this.app.metadataCache.getFileCache(file)?.frontmatter?.[fieldKey("type")] as unknown;
    if (type !== "project" && type !== "area" && type !== "filter" && type !== "task") return;

    const oldBase = oldPath.split("/").pop()!.replace(/\.md$/i, "");
    const newBase = file.basename;

    if (type !== "task" && oldPath !== file.path) this.remapNavOrder(oldPath, file.path);   // navOrder ist pfadbasiert
    // Offene Tabs auf den neuen Pfad umhängen – sonst zeigte der Tab ins Leere. Aufgaben haben
    // keine eigene Seite, für sie ist hier nichts zu tun.
    if (type !== "task") {
      const moved: PageRef["kind"] = type === "filter" ? "filter" : "project";
      for (const v of this.mainViews()) if (samePage(v.page, { kind: moved, key: oldPath })) v.openPage({ kind: moved, key: file.path });
    }

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
    await this.saveSettings();
    this.leaveDeletedPage({ kind: "label", key: name });   // offene Label-Tabs → Startansicht
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
  isNavCollapsed(id: string): boolean { return !!this.device.navCollapsed[id]; }
  /** Bleibt Promise-wertig, weil die Aufrufer darauf warten – geschrieben wird aber nur noch
   *  geräte-lokal, also ohne Datei-Zugriff. */
  setNavCollapsed(id: string, collapsed: boolean): Promise<void> {
    if (this.isNavCollapsed(id) !== collapsed) {
      this.device.navCollapsed[id] = collapsed;
      this.saveDevice();
      this.renderNav();
    }
    return Promise.resolve();
  }
  /** Einen Abschnitt aufklappen, ohne neu zu zeichnen – für „gerade angelegt, soll sichtbar sein". */
  revealNavSection(id: string): void {
    if (!this.device.navCollapsed[id]) return;
    this.device.navCollapsed[id] = false;
    this.saveDevice();
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
  openNewTask(project?: string, label?: string, today = false, status?: TaskStatus, due?: string | null, scheduled?: string | null): void {
    new TaskModal(this, undefined, project, {
      defaultLabel: label, defaultToday: today, defaultStatus: status,
      seed: (due || scheduled) ? { due: due ?? undefined, scheduled: scheduled ?? undefined } : undefined,
    }).open();
  }
  openEditTask(task: Task): void { new TaskModal(this, task).open(); }
  /** Bestehende Notiz zur Aufgabe machen: `type: task` + Kanon-Felder setzen. Ohne Projekt –
   *  landet damit (Variante A) automatisch im Eingang, bis der Nutzer sie zuordnet. */
  async convertActiveNoteToTask(f: TFile): Promise<void> {
    // Umwandeln ist ADDITIV: Es macht eine bestehende Notiz ZUSÄTZLICH zu einer Aufgabe. An ihrem
    // Text wird deshalb nichts geändert – eine Überschrift dort hat der Nutzer geschrieben, sie
    // gehört seinem Dokument und nicht uns. Der Aufgabentitel zieht ins Frontmatter: der Text der
    // H1, wenn es eine gibt, sonst der Dateiname (eine `##`-Zwischenüberschrift ist kein Titel).
    const title = (firstH1(this.app.metadataCache.getFileCache(f)?.headings) ?? "").trim() || f.basename;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      fm[fieldKey("type")] = "task";
      ensureCanonicalFm(fm);
      if (typeof fm.status !== "string" || !fm.status) fm.status = firstOpenStatus();
      if (fmTitle(fm[titleKey()]) === null) fm[titleKey()] = title;
    });
    // Bewusst KEIN reconcileTaskDescription mehr: Das verschob einen kurzen Text aus der Notiz ins
    // Feld `description` (und entfernte ihn dort) bzw. hängte einen „Notiz öffnen"-Kommentar an –
    // beides Eingriffe in einen fremden Body. Eine Beschreibung tippt man im Dialog, und zur Notiz
    // führt „In Obsidian öffnen" im Zeilenmenü. Die Funktion bleibt für die Alt-Migration bestehen.
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
    const h1 = findH1LineInBody(afterFm);                       // fence-sicher, wie splitContent
    const preH1 = (h1 === null ? "" : afterFm.split("\n").slice(0, h1).join("\n")).trim();
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

  /** Einmalige Migration „Titel ins Frontmatter": Seit 1.31.0 führen Aufgaben ihren Titel im
   *  Frontmatter statt in einer „# Überschrift". Diese Migration holt den Bestand nach, damit es
   *  im Vault EIN System gibt statt zweier nebeneinander.
   *
   *  Zwei Regeln halten sie ungefährlich:
   *  - Geschrieben wird immer der Titel, den die Notiz BISHER angezeigt hat (erste Überschrift,
   *    sonst Dateiname). Niemandem ändert sich damit ein Titel.
   *  - Aus dem Body verschwindet nur eine H1, die auch wirklich die Titel-Zeile war – geprüft
   *    Zeile für Zeile gegen den geschriebenen Titel. Zwischenüberschriften des Nutzers und
   *    Notizen mit eigener Struktur bleiben unangetastet.
   *
   *  Notizen, die `title:` schon führen, werden gar nicht erst angefasst. Damit ist die Migration
   *  idempotent: ein zweiter Lauf findet nichts mehr. */
  /** Liegt die Notiz im Aufgaben-Ordner? Dann hat BeautyTasks sie selbst angelegt (createTaskNote
   *  schreibt ausschließlich dorthin) – nur solche Notizen räumt die Titel-Migration im Body auf. */
  private isOwnTaskNote(path: string): boolean {
    return isUnderFolder(path, this.settings.itemsFolder);
  }

  async migrateTitles(opts: { silent?: boolean } = {}): Promise<void> {
    let moved = 0;
    for (const tk of this.index.all()) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (!(f instanceof TFile)) continue;
      const cache = this.app.metadataCache.getFileCache(f);
      const plan = titleToStore(cache?.frontmatter?.[titleKey()], cache?.headings, f.basename);
      if (!plan) continue;
      let wrote = false;
      await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
        if (fmTitle(fm[titleKey()]) !== null) return;   // lebende Quelle entscheidet
        fm[titleKey()] = plan.title;
        wrote = true;
      });
      if (!wrote) continue;
      // Erst NACH dem Frontmatter-Schreiben in den Body greifen: die H1-Zeile wird auf dem dann
      // aktuellen Inhalt gesucht, kann also nicht durch verschobene Zeilennummern danebengehen.
      //
      // Entfernt wird eine Titel-Überschrift nur in EIGENEN Notizen – die liegen im Aufgaben-Ordner,
      // dort hat BeautyTasks sie samt „# Titel" angelegt und bis 1.30.0 auch gepflegt. Alles
      // außerhalb kam von woanders (umgewandelt, von Hand geschrieben, importiert); dessen
      // Überschrift gehört dem Nutzer und bleibt stehen. Der Ordner ist ein Herkunftsnachweis,
      // die Textlänge wäre nur eine Schätzung. `hasOwnContent` bleibt als zweites Netz: auch in
      // eigenen Notizen wird nichts entfernt, wenn dort inzwischen ein Dokument steht.
      if (plan.dropH1 && this.isOwnTaskNote(f.path)) await this.app.vault.process(f, (c) =>
        hasOwnContent(c) ? c : dropHeadingLine(c, findH1Line(c), plan.title));
      moved++;
    }
    this.settings.didTitleMigration = true;
    await this.saveSettings();
    if (!opts.silent) { window.setTimeout(() => this.index.build(), 400); new Notice(t("notice_titles_moved", moved)); }
  }

  /** Feldnamen umstellen (Einstellungen). Der Wechsel selbst ist eine Zeile – gefährlich ist, was
   *  danach in den Notizen steht. Deshalb IMMER erst zählen, rückfragen, umschreiben; und erst wenn
   *  die Dateien durch sind, die Einstellung setzen. Bricht der Lauf ab, zeigt die Einstellung noch
   *  auf den alten Schlüssel – ein zweiter Versuch findet dann genau die Restmenge, statt dass
   *  halb umgeschriebene Notizen unsichtbar werden.
   *
   *  Zwei Felder, zwei Regeln (deshalb parametrisiert statt zweimal geschrieben):
   *  - `type` entscheidet, ob eine Notiz überhaupt zu BeautyTasks gehört. Betroffen ist der ganze
   *    Vault (Projekte, Bereiche und Filter stehen nicht im Aufgaben-Index), und der Wert wird
   *    VERSCHOBEN – `task` gehört uns, ihn stehen zu lassen konservierte die Kollision.
   *  - `title` betrifft nur Aufgaben, und der Wert wird KOPIERT: Wer das Feld wechselt, tut das in
   *    der Regel, weil `title` ihm selbst gehört. */
  changeFieldName(id: FieldId, next: string, done?: () => void): void {
    const prev = fieldKey(id);
    if (next === prev) { done?.(); return; }
    // Der Wert wird IMMER übernommen – sonst verlöre man mit einem Häkchen alle Titel bzw. alle
    // Aufgaben. Zur Wahl steht nur, ob das alte Feld danach verschwindet: Bei `type` gehört der
    // Wert uns, da wird ohne Rückfrage aufgeräumt. Bei `title` gehört das Feld meist dem Nutzer,
    // deshalb bleibt es stehen, solange er das Häkchen nicht setzt.
    const move = id === "type";
    const targets = this.fieldRenameTargets(id, prev, next);
    new ConfirmModal(this.app, {
      title: t("set_field_confirm_t"),
      message: t(move ? "set_field_confirm_type" : "set_field_confirm_title", next, prev, targets.length),
      confirmText: t("btn_save"),
      destructive: false,
      checkbox: move ? undefined : { label: t("set_field_drop_old", prev), checked: false },
    }, (dropOld: boolean) => {
      void (async () => {
        let done_ = 0, failed = 0;
        const remove = move || dropOld;
        for (const path of targets) {
          const f = this.app.vault.getAbstractFileByPath(path);
          if (!(f instanceof TFile)) continue;
          try {
            await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
              const from = fm[prev];                            // lebende Quelle entscheidet
              if (from === undefined || fm[next] !== undefined) return;
              fm[next] = from;
              if (remove) delete fm[prev];
            });
            done_++;
          } catch (err) { failed++; console.error("BeautyTasks: field rename failed", path, err); }
        }
        // Erst jetzt die Einstellung – s. Kommentar oben.
        this.settings.fieldNames = { ...allFieldNames(), [id]: next };
        initFieldNames(this.settings.fieldNames);
        this.settings.fieldNames = allFieldNames();
        await this.saveSettings();
        this.index.build();
        this.renderAll();
        new Notice(failed ? t("set_field_done_failed", next, done_, failed) : t("set_field_done", next, done_));
        done?.();
      })();
    }).open();
    // Abbruch schließt das Modal ohne Rückruf – das Eingabefeld setzt der Aufrufer beim nächsten
    // Zeichnen ohnehin auf den gespeicherten Wert zurück.
  }

  /** Pfade der Notizen, die ein Feldnamen-Wechsel anfassen würde. `type` geht vault-weit über die
   *  vier BeautyTasks-Werte; `title` nur über Aufgaben mit einem brauchbaren Wert. Notizen, die den
   *  neuen Schlüssel schon führen, bleiben außen vor – das macht den Lauf wiederholbar. Notizen in
   *  Ausschluss-Ordnern werden nie angefasst: Dort hat der Nutzer erklärt, dass sie uns nicht
   *  gehören. */
  private fieldRenameTargets(id: FieldId, prev: string, next: string): string[] {
    const out: string[] = [];
    if (id === "type") {
      for (const f of this.app.vault.getMarkdownFiles()) {
        if (this.settings.excludeFolders.some((dir) => isUnderFolder(f.path, dir))) continue;
        const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
        if (isTypeRenameTarget(fm, prev, next)) out.push(f.path);
      }
      return out;
    }
    for (const tk of this.index.all()) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (!(f instanceof TFile)) continue;
      const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
      if (fmTitle(fm?.[prev]) !== null && fmTitle(fm?.[next]) === null) out.push(f.path);
    }
    return out;
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
    const version = this.settings.schemaVersion ?? 0;
    const pending = pendingSteps(version);
    if (!pending.length) return;   // nichts offen (auch bei Dateien aus einer neueren Fassung)
    // Frischer Vault ohne Alt-Daten? -> Stand still hochsetzen, aber keine Notice/kein Neuaufbau.
    const hasData = this.index.all().length > 0 || inboxNotePath(this.app) !== null;
    // Reihenfolge kommt aus SCHEMA_STEPS, nicht aus dieser Funktion – so kann sie nicht auseinanderlaufen.
    for (const step of pending) {
      if (step === "descriptions") await this.migrateDescriptions({ silent: true });
      else if (step === "inboxRemoval") await this.migrateInboxRemoval({ silent: true });
      else await this.migrateTitles({ silent: true });
    }
    this.settings.schemaVersion = nextSchemaVersion(version);
    await this.saveSettings();
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
    // Gemeint ist der Tab im Vordergrund – nicht mehr „die" Seite, die es seit den Mehrfach-Tabs
    // nicht mehr gibt. Ohne offenes Dashboard bleibt es beim Eingang (kein Kontext).
    const view = this.activeMain();
    if (!view) return { today: false, due: null };
    const ctx = view.ctx();
    const page = pageInfo(ctx.page);
    // Kalender-Tagesansicht: der angezeigte Tag, nicht zwingend heute (wie „+ Aufgabe" dort).
    const due = calendarDayAnchor(ctx, ctx.opts);
    if (page.kind === "project") return { project: baseName(page.key), today: false, due };
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
    if (fired) { this.device.reminderLastScan = now; this.saveDevice(); }
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
    // Beide Zeitstempel nach EINER Regel (s. transitionStamps) und aus EINEM Zeitpunkt — sonst
    // drifteten sie um Millisekunden auseinander. Der Abgebrochen-Fall landet über die Oberfläche
    // heute nie hier (das Board kennt keine Papierkorb-Spalte, das Zeilenmenü leitet auf
    // cancelTask um); ein neuer Aufrufer soll aber nicht in dieselbe Falle laufen.
    const stamps = transitionStamps(task.status, status, localStamp());
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      this.ensureCanonical(fm);
      fm.status = status;
      if ("completed" in stamps) fm.completed = stamps.completed;
      if ("cancelled" in stamps) fm.cancelled = stamps.cancelled;
    });
    // Wiederkehrend + gerade erledigt -> nächste Instanz anlegen.
    if (nowDone && !wasDone && task.recurrence) {
      const next = nextInstance(task, todayStr());
      if (next && (next.due || next.scheduled)) {
        await createTaskNote(this.app, this.settings, {
          title: task.title,
          titleInFrontmatter: task.titleInFm,   // nächste Instanz wie die Vorlage
          priority: task.priority,
          project: task.project ? baseName(task.project) : null,
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

  /** Erinnerungen einer Aufgabe setzen (Kontextmenü – das Modal schreibt sie über persist).
   *  Leere Liste entfernt das Feld. */
  async setTaskReminders(task: Task, reminders: string[]): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      this.ensureCanonical(fm);
      if (reminders.length) fm.reminders = reminders; else delete fm.reminders;
    });
  }

  /** Aufgabe samt Unterbaum duplizieren (Kontextmenü; das Task-Modal kopiert seinen EIGENEN
   *  Entwurfsstand und ruft nur duplicateSubtree). Die Kopie startet wie dort auf „offen"
   *  und heißt „… (Kopie)". */
  async duplicateTask(task: Task): Promise<void> {
    const file = await createTaskNote(this.app, this.settings, {
      title: task.title + " " + t("copy_suffix"),
      titleInFrontmatter: task.titleInFm,   // Kopie hält es wie das Original
      description: task.description,
      status: firstOpenStatus(),
      due: task.due, dueTime: task.dueTime,
      scheduled: task.scheduled, scheduledTime: task.scheduledTime,
      duration: task.duration,
      priority: task.priority,
      project: task.project ? baseName(task.project) : null,
      labels: [...task.labels],
      recurrence: task.recurrence, recurBasis: task.recurBasis,
      reminders: [...task.reminders],
      parent: task.parent ? baseName(task.parent) : null,
    });
    await this.duplicateSubtree(task.path, file.basename);
    new Notice(t("msg_duplicated"));
  }

  /**
   * Die SICHTBAREN Unteraufgaben unter `srcParentPath` (nicht die im Papierkorb, s.
   * subtasksToDuplicate) als Kopien unter `newParentBase` neu anlegen, rekursiv über die ganze
   * Tiefe. Wie die Hauptkopie startet jede Kopie auf „offen".
   *
   * Reihenfolge: die Kopien bekommen frische `sort_order`-Lücken (10, 20, 30 …) in der Reihenfolge
   * der Originale. Das ist sicher – sie bilden unter der neuen Hauptkopie eine eigene, isolierte
   * Geschwistergruppe; `sort_order` wird nur INNERHALB einer Gruppe verglichen. Es wird kein
   * bestehender Datensatz angefasst, also kann sich keine vorhandene Board-Position verschieben.
   */
  async duplicateSubtree(srcParentPath: string, newParentBase: string): Promise<void> {
    const kids = subtasksToDuplicate(this.index.children(srcParentPath));
    let order = ORDER_GAP;
    for (const kid of kids) {
      const copy = await createTaskNote(this.app, this.settings, {
        title: kid.title,
        titleInFrontmatter: kid.titleInFm,
        description: kid.description,
        status: firstOpenStatus(),
        due: kid.due, dueTime: kid.dueTime,
        scheduled: kid.scheduled, scheduledTime: kid.scheduledTime,
        duration: kid.duration,
        priority: kid.priority,
        project: kid.project ? baseName(kid.project) : null,
        labels: [...kid.labels],
        recurrence: kid.recurrence, recurBasis: kid.recurBasis,
        reminders: [...(kid.reminders ?? [])],
        parent: newParentBase,
        sortOrder: order,
      });
      order += ORDER_GAP;
      await this.duplicateSubtree(kid.path, copy.basename);   // Enkel & tiefer
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

  /** Einzelne Aufgabe wiederherstellen: zurück auf offen, beide Zeitstempel entfernen.
   *
   *  Auch `completed`: Wer eine ERLEDIGTE Aufgabe in den Papierkorb legt, behält den
   *  Erledigt-Stempel dort (die Herkunft bleibt im Papierkorb sichtbar) — beim Wiederherstellen
   *  wird sie aber ausnahmslos offen, und ein Erledigt-Datum an einer offenen Aufgabe ist schlicht
   *  falsch. Es ist dieselbe Regel, die setTaskStatus beim Verlassen von „erledigt" anwendet. */
  async restoreTask(task: Task): Promise<void> {
    // Symmetrisch zur Kaskaden-Abbrechen-Logik: die Aufgabe UND alle abgebrochenen
    // Unteraufgaben zurückholen, sonst blieben Kinder allein im Papierkorb liegen.
    const targets = [task, ...this.index.descendants(task.path)].filter((tk) => isTrashed(tk.status));
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); fm.status = firstOpenStatus(); delete fm.cancelled; delete fm.completed; });
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
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { this.ensureCanonical(fm); fm.status = firstOpenStatus(); delete fm.cancelled; delete fm.completed; });
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
    this.settings = applyDefaults(saved);
    // Stand der Einmal-Migrationen bestimmen, solange `saved` noch vorliegt: Nur hier ist
    // unterscheidbar, ob es GAR KEINE data.json gab (frische Installation → nichts zu migrieren)
    // oder eine ohne `schemaVersion` (Altbestand → aus den did*-Markern ableiten). Siehe schema.ts.
    this.settings.schemaVersion = schemaVersionOf(saved);
    // Migration: früheres globales chipOrder/chipTiers -> Editor-Profil (Flächen ab jetzt getrennt).
    const legacy = (saved ?? {}) as Record<string, unknown>;
    // Auch hier die DATEI fragen, nicht `this.settings` – aus demselben Grund wie bei den
    // Feldnamen unten. `chipProfiles` hat zwar keinen Standardwert, aber die Regel gilt für jede
    // Migration: Ob etwas ALT ist, entscheidet die Datei, nicht der aufgefüllte Zustand.
    if ((legacy.chipOrder || legacy.chipTiers) && !legacy.chipProfiles) {
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
    // Feldnamen: früheres einzelnes `titleProperty` (1.31.x) in die Namenstabelle übernehmen.
    // Gefragt wird die DATEI (`legacy`), nicht `this.settings`: Seit die Standardwerte nicht mehr
    // mitgeschrieben werden, ist `settings.fieldNames` immer belegt (s. settingsDelta.ts). Eine
    // Prüfung auf `!this.settings.fieldNames` wäre nie wieder wahr – und ein eigener Titel-Feldname
    // aus 1.31.x ginge still verloren, das Plugin suchte danach im falschen Frontmatter-Feld.
    if (typeof legacy.titleProperty === "string" && !legacy.fieldNames) {
      this.settings.fieldNames = { title: legacy.titleProperty };
    }
    // Startseite: früher ein einzelner String (`startView`, nur ViewId oder "last"), jetzt eine
    // vollständige Seitenangabe. Auch hier entscheidet die DATEI, nicht der aufgefüllte Zustand –
    // `startPage` hat einen Standardwert und wäre sonst immer belegt.
    if (typeof legacy.startView === "string" && !legacy.startPage) {
      this.settings.startPage = fromLegacyStartView(legacy.startView, VIEW_IDS);
    }
    // resolveFieldNames fängt Vertipptes, feste und doppelt vergebene Namen ab und fällt auf die
    // Vorgabe zurück – eine kaputte Einstellung darf nie Daten treffen.
    initFieldNames(this.settings.fieldNames);
    this.settings.fieldNames = allFieldNames();
    // Google-Kalender-Sub-Objekt mit Defaults auffüllen (fehlende/neue Felder ergänzen,
    // gespeicherte Werte behalten). Lebendes Objekt – die Engine mutiert lastSynced/syncTokens darin.
    this.settings.gcal = Object.assign({}, DEFAULT_GCAL_SETTINGS, this.settings.gcal);
    this.settings.gcalFeed = Object.assign({}, DEFAULT_GCAL_FEED_SETTINGS, this.settings.gcalFeed);
    this.device = Object.assign({}, DEFAULT_DEVICE_STATE,
      this.app.loadLocalStorage(DEVICE_STATE_KEY) as Partial<DeviceState> | null);
    let dirty = this.migrateGCalTokens();
    dirty = this.migrateGCalCache() || dirty;
    dirty = this.migrateDeviceState() || dirty;
    if (dirty) await this.saveSettings();
  }

  /** Geräte-Zustand speichern. Bewusst synchron und ohne await: Es ist ein localStorage-Schreib
   *  vorgang, kein Datei-Zugriff – und der Aufrufer wartet nie darauf. */
  private saveDevice(): void { this.app.saveLocalStorage(DEVICE_STATE_KEY, this.device); }

  /** Einmalige Umstellung (ab 1.37.0): `navCollapsed`, `lastView` und `reminderLastScan` lagen in
   *  data.json und wanderten damit über den Sync auf jedes Gerät. Ein Handy und ein Desktop teilen
   *  sich aber weder ihre Bildschirmaufteilung noch ihren letzten Standort (s. die Regel an
   *  BeautyTasksSettings).
   *
   *  Der vorhandene Stand wird übernommen, damit auf DIESEM Gerät nichts springt. Andere Geräte
   *  starten mit aufgeklappter Seitenleiste – nichts davon ist Nutzerinhalt. Das `delete` ist
   *  wieder Pflicht, sonst schriebe saveSettings() die Altfelder zurück. */
  private migrateDeviceState(): boolean {
    const raw = this.settings as unknown as Record<string, unknown>;
    const keys = ["navCollapsed", "lastView", "reminderLastScan"] as const;
    if (!keys.some((k) => k in raw)) return false;
    if (!this.app.loadLocalStorage(DEVICE_STATE_KEY)) {
      const nav = raw.navCollapsed;
      const last = raw.lastView;
      const scan = raw.reminderLastScan;
      if (nav && typeof nav === "object") this.device.navCollapsed = nav as Record<string, boolean>;
      if (typeof last === "string" && last) this.device.lastView = last;
      if (typeof scan === "number") this.device.reminderLastScan = scan;
      this.saveDevice();
    }
    for (const k of keys) delete raw[k];
    return true;
  }

  /** Einmalige Umstellung (ab 1.37.0): `gcal.lastSynced`, `gcal.syncTokens` und
   *  `gcalFeed.snapshot` lagen in data.json und wurden bei JEDEM Sync-Lauf neu geschrieben –
   *  gemessen alle 5 Minuten auch ohne Änderung. Sie ziehen in den geräte-lokalen Speicher.
   *
   *  Der vorhandene Stand wird dabei übernommen, damit auf DIESEM Gerät kein einziger
   *  überflüssiger Push entsteht. Andere Geräte belegen ihren Cache aus dem Frontmatter vor
   *  (s. seedGCalCacheIfEmpty). Wie bei den Tokens ist das `delete` Pflicht, sonst schriebe
   *  saveSettings() die Altfelder stumm zurück. */
  private migrateGCalCache(): boolean {
    const raw = this.settings.gcal as unknown as Record<string, unknown>;
    const feedRaw = this.settings.gcalFeed as unknown as Record<string, unknown>;
    const hadSync = "lastSynced" in raw || "syncTokens" in raw;
    const hadFeed = "snapshot" in feedRaw;
    if (!hadSync && !hadFeed) return false;

    if (hadSync && !this.app.loadLocalStorage(GCAL_CACHE_KEY)) {
      const legacy = (raw.lastSynced ?? {}) as Record<string, LegacyGCalLink>;
      const cache = emptyGCalCache();
      for (const [taskId, l] of Object.entries(legacy)) {
        if (!l?.eventId || !l.calendarId) continue;
        const idx = calIndex(cache, l.calendarId);
        // Die alte Signatur endete auf die volle Kalender-ID, die neue auf deren Index. Sie hier
        // NICHT umzuschreiben wäre ein stiller Massen-Push beim ersten Lauf.
        cache.links[taskId] = { e: l.eventId, c: idx, s: resignLegacySignature(l.sig, idx), d: l.due, t: l.dueTime };
      }
      Object.assign(cache.syncTokens, (raw.syncTokens ?? {}) as Record<string, string>);
      this.app.saveLocalStorage(GCAL_CACHE_KEY, cache);
    }
    if (hadFeed && !this.app.loadLocalStorage(GCAL_SNAPSHOT_KEY)) {
      this.app.saveLocalStorage(GCAL_SNAPSHOT_KEY, feedRaw.snapshot ?? []);
    }
    delete raw.lastSynced;
    delete raw.syncTokens;
    delete feedRaw.snapshot;
    return true;
  }

  /** Gerät ohne Cache und ohne Altbestand: aus dem Frontmatter vorbelegen, statt beim ersten Lauf
   *  jede datierte Aufgabe erneut zu pushen (ein Push ersetzt das ganze Google-Event und löschte
   *  dabei Beschreibung, Ort und Teilnehmer). Läuft erst, wenn der Index steht. */
  private seedGCalCacheIfEmpty(): void {
    if (!this.settings.gcal?.enabled || Object.keys(this.gcalCache.links).length) return;
    const n = seedGCalCache(this.gcalCache, this.index.all(), (path) => {
      const f = this.app.vault.getAbstractFileByPath(path);
      return f instanceof TFile ? this.app.metadataCache.getFileCache(f)?.frontmatter ?? null : null;
    });
    if (n) this.app.saveLocalStorage(GCAL_CACHE_KEY, this.gcalCache);
  }

  /** Einmalige Umstellung (ab 1.36.0): Bis 1.35.x lagen Refresh-Token und Anzeige-E-Mail in
   *  data.json und wanderten damit über jeden Sync auf jedes Gerät – und in jedes Backup.
   *
   *  Das Gerät, das die Datei nach dem Update zuerst öffnet, übernimmt den Token in seinen
   *  lokalen Speicher: Dort bleibt die Verbindung ohne Zutun bestehen. Auf allen anderen Geräten
   *  ist danach keiner mehr da; sie verbinden sich einmal selbst (Hinweis beim Start, s. onload).
   *
   *  Gibt zurück, ob data.json dadurch zu bereinigen war. Der `delete` ist Pflicht, nicht Kosmetik:
   *  `Object.assign` oben kopiert die alten Felder mit, obwohl der Typ sie nicht mehr kennt –
   *  ohne das Löschen schriebe saveSettings() den Token stumm wieder zurück. */
  private migrateGCalTokens(): boolean {
    const raw = this.settings.gcal as unknown as Record<string, unknown>;
    if (!("tokens" in raw) && !("account" in raw)) return false;
    const adopt = planTokenMigration(
      raw.tokens as GCalTokens | null | undefined,
      raw.account as string | null | undefined,
      !!this.app.loadLocalStorage(GCAL_TOKEN_KEY),
    );
    if (adopt) this.app.saveLocalStorage(GCAL_TOKEN_KEY, adopt);
    delete raw.tokens;
    delete raw.account;
    return true;
  }
  /** Gespeichert wird nur, was vom Standard abweicht (s. settingsDelta.ts) – sonst friert die
   *  Datei jeden Standardwert ein und eine Verbesserung im Code erreicht keinen Bestandsnutzer. */
  async saveSettings(): Promise<void> { await this.saveData(toDelta(this.settings)); }

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

  /** Vom Nutzer gewählte Meta-Farben als Body-Inline-Variablen setzen – NUR im Theme „User" (sonst gelten
   *  die festen Vorlagen Minimalisdo/Colorado; die gespeicherten metaColors bleiben erhalten). */
  applyColors(): void {
    const mc = this.settings.metaColors ?? {};
    const isUser = this.settings.metaTheme === "user";
    const map: Record<string, string> = {
      accent: "--bt-accent",
      overdue: "--bt-dist-overdue", today: "--bt-dist-today", d1: "--bt-dist-d1", d2: "--bt-dist-d2", week: "--bt-dist-week", far: "--bt-dist-far",
      recur: "--bt-c-recur", remind: "--bt-c-remind", sched: "--bt-c-sched", label: "--bt-c-label",
      comments: "--bt-c-comments", subs: "--bt-c-subs", parent: "--bt-c-parent", backlink: "--bt-c-backlink",
    };
    for (const [key, cssVar] of Object.entries(map)) {
      // Akzent gilt IMMER (themenunabhängig) – überschreibt nur die Obsidian-Akzentfarbe innerhalb des
      // Plugins; leer = Obsidian-Akzent. Alle anderen Meta-Farben nur im „User"-Theme (sonst Preset).
      const active = key === "accent" || isUser;
      const v = active ? mc[key as keyof typeof mc] : undefined;
      if (v) document.body.style.setProperty(cssVar, v); else document.body.style.removeProperty(cssVar);
    }
  }

  /** Google-Auth + Push-Engine aufbauen (UI-agnostisch). Beide mutieren `settings.gcal`
   *  in place; Persistenz läuft über saveSettings (data.json). Auf Unload wird gestoppt. */
  private setupGCal(): void {
    const gcal = this.settings.gcal!;
    // Der Token liegt geräte-lokal, NICHT in data.json (s. GCAL_TOKEN_KEY). Nebeneffekt, der
    // ausdrücklich gewollt ist: data.json wird nicht mehr stündlich neu geschrieben, nur weil
    // ein Access-Token erneuert wurde – das war eine Hauptquelle für Sync-Konflikte.
    const store: TokenStore = {
      load: () => (this.app.loadLocalStorage(GCAL_TOKEN_KEY) as GCalTokens | null) ?? null,
      save: (tokens) => { this.app.saveLocalStorage(GCAL_TOKEN_KEY, tokens); return Promise.resolve(); },
    };
    this.gcalAuth = new GCalAuth(
      () => ({ clientId: gcal.clientId, clientSecret: gcal.clientSecret }),
      store,
    );
    // Abgleich-Cache: geräte-lokal, weil er bei JEDEM Sync-Lauf neu geschrieben wird (gemessen:
    // alle 5 Minuten auch ohne Änderung, beim Arbeiten im Sekundentakt). In data.json war er die
    // letzte Quelle automatischer Schreiblast – und damit die Hauptursache für Sync-Konflikte.
    this.gcalCache = (this.app.loadLocalStorage(GCAL_CACHE_KEY) as GCalCache | null) ?? emptyGCalCache();
    const host: GCalSyncHost = {
      app: this.app,
      settings: gcal,
      cache: this.gcalCache,
      persist: () => this.saveSettings(),
      persistCache: () => { this.app.saveLocalStorage(GCAL_CACHE_KEY, this.gcalCache); return Promise.resolve(); },
      allTasks: () => this.index.all(),
      subscribe: (cb) => this.index.subscribe(cb),
    };
    this.gcalSync = new GCalSync(host, this.gcalAuth);
    this.register(() => this.gcalSync.stop());   // Auto-Push-Abo + Debounce beim Unload lösen

    // Termin-Anzeige (read-only). Teilt sich die Verbindung mit dem Sync, ist aber sonst
    // unabhängig: „nur anzeigen, nichts schreiben" ist ein vollwertiger Zustand.
    const feedHost: GCalFeedHost = {
      settings: this.settings.gcalFeed!,
      snapshot: () => (this.app.loadLocalStorage(GCAL_SNAPSHOT_KEY) as CalEvent[] | null) ?? [],
      setSnapshot: (events) => { this.app.saveLocalStorage(GCAL_SNAPSHOT_KEY, events); return Promise.resolve(); },
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

  /** Auf einem Gerät, für das der Sync eingerichtet ist (`enabled` kommt über data.json mit),
   *  aber kein lokaler Token liegt, einmal auf das Neu-Verbinden hinweisen. Trifft nach dem
   *  Update auf 1.36.0 alle Geräte außer dem, das die Migration ausgeführt hat.
   *  Der Marker ist ebenfalls geräte-lokal und wird beim Verbinden gelöscht – nach einem späteren
   *  Trennen und erneuten Einrichten greift der Hinweis also wieder. */
  private noticeGCalNeedsReconnect(): void {
    if (!this.settings.gcal?.enabled || this.gcalAuth.isConnected()) return;
    if (this.app.loadLocalStorage(GCAL_RECONNECT_KEY)) return;
    this.app.saveLocalStorage(GCAL_RECONNECT_KEY, true);
    new Notice(t("gcal_reconnect_notice"), 0);   // bleibt stehen: der Nutzer muss handeln
  }

  /** Mit Google verbinden: Login (Desktop-Loopback bzw. Mobile-Device-Flow), danach Anzeige-
   *  E-Mail holen, bei Bedarf eigenen „BeautyTasks"-Kalender anlegen, aktivieren, initial pushen.
   *  Wirft bei Fehler (die UI zeigt die Meldung). */
  async gcalConnect(onDevicePrompt?: (p: DevicePrompt) => void): Promise<void> {
    const g = this.settings.gcal!;
    await this.gcalAuth.connect(onDevicePrompt);
    // Anzeige-E-Mail gehört zum geräte-lokalen Token, nicht in die Einstellungen – sie beschreibt
    // DIESE Verbindung. Schlägt der Abruf fehl, bleibt sie leer; die Verbindung steht trotzdem.
    try { await this.gcalAuth.setAccount(await fetchAccountEmail(this.gcalAuth)); } catch { /* optional */ }
    this.app.saveLocalStorage(GCAL_RECONNECT_KEY, null);   // Hinweis darf später wieder greifen
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
    // Termine anzeigen bei der ERSTEN Einrichtung gleich mit einschalten: Wer Google verbindet,
    // erwartet seine Termine zu sehen – sie hinter einem zweiten Schalter zu verstecken, sah nach
    // „geht nicht" aus. Nur beim ersten Mal, erkennbar daran, dass noch nie ein Kalender gewählt
    // wurde; beim WIEDERverbinden bleibt eine bewusste Abwahl also bestehen.
    //
    // Bewusst hier und NICHT als Standardwert `enabled: true`: Seit nur noch Abweichungen
    // gespeichert werden (1.37.3), erreicht eine Standardwert-Änderung jeden, der die Einstellung
    // nie angefasst hat – das schaltete die Anzeige bei allen bereits verbundenen Nutzern
    // ungefragt ein. Siehe die Regel an DEFAULT_SETTINGS.
    const gf = this.settings.gcalFeed!;
    const erstmalig = !Object.keys(gf.calendars).length;
    if (erstmalig) {
      gf.enabled = true;
      try { await this.gcalFeed.initDefaults(); } catch (e) { console.warn("BeautyTasks: Kalenderliste nicht erreichbar", e); }
    }
    await this.saveSettings();
    this.refreshGCalStatusBar();
    // Termine JETZT holen. Ohne das passiert bis zum nächsten Poll nichts: Die Ansichten haben
    // ihre Monate längst gemeldet (setRange läuft auch bei ausgeschaltetem Feed), und setRange
    // stößt nur bei NEUEN Monaten an – ein Neuzeichnen allein holt also nichts nach.
    if (this.gcalFeed.isActive()) void this.gcalFeed.refresh();
    this.renderMain();
    void this.gcalSync.syncNow();
  }

  /** Verbindung trennen (Token widerrufen + löschen). Kalenderwahl bleibt für erneutes Verbinden. */
  async gcalDisconnect(): Promise<void> {
    const g = this.settings.gcal!;
    await this.gcalAuth.disconnect();   // widerruft + löscht den geräte-lokalen Token
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
