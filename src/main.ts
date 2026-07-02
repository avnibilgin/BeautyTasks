import { Plugin, Notice, TFile, WorkspaceLeaf, Component, moment } from "obsidian";
import { BeautyTasksSettings, DEFAULT_SETTINGS, Task } from "./types";
import { TaskIndex } from "./taskIndex";
import { runMigration } from "./migrate";
import {
  MainView, NavView, VIEW_MAIN, VIEW_NAV, VIEW_IDS, viewTitle, ViewId, OLD_VIEW_TYPES, projectName,
} from "./heuteView";
import { TaskModal } from "./taskModal";
import { createTaskNote, createProjectNote, setProjectType, setProjectArchived, setNavHidden, renameProjectNote, deleteProjectNote, normalizeLabel } from "./taskService";
import { nextInstance } from "./recurrence";
import { todayStr } from "./format";
import { t, setLocale } from "./i18n";
import { BeautyTasksSettingTab } from "./settingsTab";
import { TaskSearchModal } from "./searchModal";

export default class BeautyTasksPlugin extends Plugin {
  settings!: BeautyTasksSettings;
  index!: TaskIndex;
  currentView: ViewId = "heute";
  currentProject: string | null = null;
  currentLabel: string | null = null;                   // aktives Label-Board
  doneCollapsed = true;                                  // „Erledigt"-Sektionen eingeklappt (Default)
  manageOpen = false;                                   // Verwaltungs-Ansicht aktiv?
  manageSection: "projects" | "labels" = "projects";    // obere Ebene
  manageTab: "active" | "archive" = "active";           // Unterteilung nur bei Projekten
  doneTab: "done" | "trash" = "done";                   // „Erledigt"-Ansicht: Liste vs. Papierkorb
  flashPath: string | null = null;                       // aus der Suche angesprungene Aufgabe (kurz hervorgehoben)
  flashScrolled = false;                                 // pro Sprung nur einmal ins Bild scrollen
  titleRenderComp: Component | null = null;              // Lifecycle für Markdown-Titel (Links), von MainView pro Zeichnung gesetzt

  async onload(): Promise<void> {
    await this.loadSettings();
    this.applyLocale();                        // "auto" folgt Obsidian; sonst EN (Kanon) / DE
    this.currentView = this.resolveStartView();   // Startansicht aus den Einstellungen

    this.index = new TaskIndex(this.app);
    this.addChild(this.index);
    this.index.subscribe(() => this.renderAll());
    this.app.workspace.onLayoutReady(() => {
      // Leafs alter Sitzungen (pro-Ansicht-Typen) aufräumen.
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (OLD_VIEW_TYPES.includes(leaf.getViewState().type)) leaf.detach();
      });
      this.index.build();
      this.renderAll();
    });

    this.registerView(VIEW_MAIN, (leaf: WorkspaceLeaf) => new MainView(leaf, this));
    this.registerView(VIEW_NAV, (leaf: WorkspaceLeaf) => new NavView(leaf, this));

    this.addRibbonIcon("list-checks", t("ribbon_open"), () => void this.openBeautyTasks());
    this.addSettingTab(new BeautyTasksSettingTab(this.app, this));

    // Layout-/Tab-Wechsel: u. a. wenn Obsidian eine aufgeschobene View endlich anhängt.
    this.registerEvent(this.app.workspace.on("layout-change", () => this.renderAll()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.renderAll()));

    this.addCommand({ id: "open", name: t("ribbon_open"), callback: () => void this.openBeautyTasks() });
    for (const id of VIEW_IDS) {
      this.addCommand({ id: "open-" + id, name: t("cmd_open_view", viewTitle(id)), callback: () => void this.activateView(id) });
    }
    this.addCommand({ id: "new-task", name: t("cmd_new_task"), callback: () => this.openNewTask() });
    this.addCommand({ id: "search", name: t("cmd_search"), callback: () => this.openSearch() });
    this.addCommand({
      id: "count-tasks", name: t("cmd_count_tasks"),
      callback: () => new Notice(t("notice_count", this.index.all().length, this.index.open().length)),
    });
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
    this.currentView = id; this.currentProject = null; this.currentLabel = null; this.manageOpen = false; this.doneTab = "done";
    if (this.settings.lastView !== id) { this.settings.lastView = id; void this.saveSettings(); }   // für startView === "last"
    await this.showMain();
  }
  async activateProject(path: string): Promise<void> { this.currentProject = path; this.currentLabel = null; this.manageOpen = false; await this.showMain(); }
  async activateLabel(label: string): Promise<void> { this.currentLabel = label; this.currentProject = null; this.manageOpen = false; await this.showMain(); }
  async activateManage(section?: "projects" | "labels"): Promise<void> { this.manageOpen = true; if (section) this.manageSection = section; this.currentProject = null; this.currentLabel = null; await this.showMain(); }

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
  async createProject(name: string, asArea = false): Promise<void> {
    await createProjectNote(this.app, this.settings, name, asArea);
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
  async setProjectVisible(path: string, visible: boolean): Promise<void> {
    this.refreshOnChange(path);
    await setNavHidden(this.app, path, !visible);
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
    if (this.currentLabel === name) this.currentLabel = null;
    await this.saveSettings();
    this.renderAll();
  }

  // ── Label-Sichtbarkeit in der Seitenleiste (Default: aus) ──
  isLabelVisible(name: string): boolean { return this.settings.visibleLabels.includes(name); }
  /** Sichtbar geschaltete Labels, die es noch gibt (alphabetisch). */
  getVisibleLabels(): string[] {
    const exist = new Set(this.getLabels().map((l) => l.name));
    return this.settings.visibleLabels.filter((n) => exist.has(n)).sort((a, b) => a.localeCompare(b, "de"));
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

  // ── Aufgaben-Aktionen ──
  openNewTask(project?: string, label?: string, today = false): void {
    new TaskModal(this, undefined, project, { defaultLabel: label, defaultToday: today }).open();
  }
  openEditTask(task: Task): void { new TaskModal(this, task).open(); }
  openSearch(): void { new TaskSearchModal(this).open(); }

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

  async toggleDone(task: Task): Promise<void> {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof TFile)) return;
    const done = task.status !== "done";
    await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => {
      fm.status = done ? "done" : "todo";
      fm.completed = done ? todayStr() : null;
    });
    // Wiederkehrend + jetzt erledigt -> nächste Instanz anlegen (wie das Tasks-Plugin).
    if (done && task.recurrence) {
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
    const today = todayStr();
    const targets = [task, ...this.index.descendants(task.path)].filter((t) => t.status !== "cancelled");
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof TFile) await this.app.fileManager.processFrontMatter(f, (fm: Record<string, unknown>) => { fm.status = "cancelled"; fm.cancelled = today; });
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
    this.settings = Object.assign({}, DEFAULT_SETTINGS, (await this.loadData()) as Partial<BeautyTasksSettings>);
  }
  async saveSettings(): Promise<void> { await this.saveData(this.settings); }
}
