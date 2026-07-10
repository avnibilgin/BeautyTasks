import { Modal, TFile, Notice, setIcon, normalizePath, MarkdownRenderer, Component, FuzzySuggestModal, Platform } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task, TaskStatus, ChipId } from "./types";
import { createTaskNote, listProjectsAndAreas, createProjectNote, slugify, todayIso, ensureFolder, TaskFields } from "./taskService";
import { formatDateTime, combineDT } from "./format";
import { openPopover, popRow } from "./popover";
import { statusLabel, statusIcon, statusTint } from "./statuses";
import { parseQuickEntry } from "./quickEntry";
import { LogEntry, readLog, writeLog, readDescription, writeDescription, nowLogTs, formatLogTime } from "./detailLog";
import { CHIPS, ChipHost, resolveChipOrder, isInline, plusHasSetHidden, renderPlusChips, renderStatusChip, renderValueChip, openChipSettings, PRIOS, PRIO_KEY } from "./chips";
import { t, projectDisplayName } from "./i18n";

// PRIOS/PRIO_KEY leben jetzt in chips.ts (gemeinsam mit der Schnelleingabe); hier re-exportiert,
// damit bestehende Importe (filterModal, quickAddModal) unverändert bleiben.
export { PRIOS, PRIO_KEY };

/** Basename (ohne Ordner/.md) – Aufgaben verlinken Eltern/Projekt über den Basename. */
const baseName = (path: string): string => path.split("/").pop()!.replace(/\.md$/, "");

/** Aufgaben-Modal im Todoist-Stil – 1:1 zu BeautyTasks (randloser Titel, Chip-Reihe,
 *  Projekt-Picker, CTA). Erfasst neu oder bearbeitet/verschiebt eine bestehende Aufgabe. */
export class TaskModal extends Modal {
  private f: TaskFields & { scheduled?: string | null; recurrence?: string | null; reminders: string[] };
  private chipBar!: HTMLElement;
  private descInput: HTMLTextAreaElement | null = null;
  private descDirty = false;          // true sobald Nutzer die Beschreibung getippt hat
  private projektBtn!: HTMLButtonElement;
  private detailsWrap!: HTMLElement;
  private logWrap!: HTMLElement;
  private detailsChip?: HTMLElement;   // Büroklammer-Chip, der die Detail-Sektion toggelt
  private logInput: HTMLTextAreaElement | null = null;
  private logComp: Component | null = null;
  private logEntries: LogEntry[] = [];
  private persistChain: Promise<void> = Promise.resolve();
  private duePinned = false;          // true sobald Datum manuell gesetzt -> NL überschreibt nicht mehr
  private cleanTitle = "";            // Titel ohne erkannte Datum-/Label-Token
  private parsedLabels: string[] = []; // aktuell aus dem Titel geparste #Labels (wird bei jedem Parse ersetzt)
  private discarding = false;          // true = bewusst verwerfen („Cancel") -> kein Auto-Speichern
  private persisted = false;           // true sobald geschrieben -> kein Doppel-Speichern

  /** opts.hideProjekt blendet das Projekt-Chip aus (Unteraufgaben-Modus – die
   *  Unteraufgabe erbt Projekt der Hauptaufgabe). opts.parent = Eltern-Basename. */
  constructor(private plugin: BeautyTasksPlugin, private existing?: Task, defaultProject?: string,
              private opts: { hideProjekt?: boolean; parent?: string; defaultLabel?: string; defaultToday?: boolean; defaultTitle?: string; defaultStatus?: TaskStatus } = {}) {
    super(plugin.app);
    this.f = existing
      ? {
          title: existing.title, status: existing.status, due: existing.due, dueTime: existing.dueTime,
          scheduled: existing.scheduled, scheduledTime: existing.scheduledTime, duration: existing.duration,
          priority: existing.priority, recurrence: existing.recurrence, recurBasis: existing.recurBasis,
          project: existing.project ? baseName(existing.project) : null,
          parent: existing.parent ? baseName(existing.parent) : null,
          labels: [...existing.labels],
          reminders: [...(existing.reminders ?? [])],
        }
      : { title: opts.defaultTitle ?? "", status: opts.defaultStatus, priority: "normal", labels: opts.defaultLabel ? [opts.defaultLabel] : [], reminders: [], due: opts.defaultToday ? todayIso() : null, project: defaultProject ?? "Inbox", recurBasis: "due" };
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-task-modal");
    modalEl.toggleClass("bt-chips-icons-only", this.plugin.settings.chipsIconsOnly);   // nur Chip-Icons
    contentEl.empty();

    const placeholder = this.opts.parent ? t("placeholder_subtask") : t("placeholder_taskname");
    const title = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder } });
    title.value = this.f.title;
    title.oninput = () => { this.f.title = title.value; this.applyParse(); this.renderChips(); };
    title.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void this.save(); } };
    window.setTimeout(() => title.focus(), 0);

    // Beschreibung: freier Markdown-Text, im Body zwischen Titel und Kommentar-Log.
    const desc = contentEl.createEl("textarea", { cls: "bt-beschr", attr: { placeholder: t("placeholder_description"), rows: "1" } });
    desc.value = this.f.description ?? "";
    desc.oninput = () => { this.descDirty = true; this.f.description = desc.value; this.growDesc(); };
    this.descInput = desc;
    window.setTimeout(() => this.growDesc(), 0);

    this.chipBar = contentEl.createDiv({ cls: "bt-chips" });

    // Details = Kommentar-Log (Timeline), einklappbar. Öffnen/Schließen jetzt über den
    // Büroklammer-Chip in der Chip-Leiste (statt der früheren "+ Details"-Zeile). Der Log
    // lebt im Body der Aufgaben-Notiz. Vor renderChips() anlegen, damit der Details-Chip
    // seinen Offen/Zu-Zustand aus logWrap lesen kann.
    this.detailsWrap = contentEl.createDiv({ cls: "bt-details" });
    this.logWrap = this.detailsWrap.createDiv({ cls: "bt-log bt-hidden" });

    this.applyParse();
    this.renderChips();
    this.renderDetailLog();
    this.syncDetails();
    // Bestehende Aufgabe: Log aus dem Notiz-Body laden, bei Inhalt direkt aufgeklappt.
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof TFile) {
        void readDescription(this.app, file).then((d) => {
          if (this.descDirty) return;   // Nutzer hat schon getippt -> nicht überschreiben
          this.f.description = d;
          if (this.descInput) { this.descInput.value = d; this.growDesc(); }
        });
        void readLog(this.app, file).then((entries) => {
          this.logEntries = entries;
          if (entries.length) this.logWrap.removeClass("bt-hidden");
          this.renderDetailLog();
          this.syncDetails();
        });
      }
    }

    // Fußzeile: Projekt-Picker links, Buttons rechts. Im Unteraufgaben-Modus
    // (hideProjekt) entfällt der Projekt-Picker – das Projekt erbt die Hauptaufgabe.
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    if (!this.opts.hideProjekt) {
      this.projektBtn = foot.createEl("button", { cls: "bt-projekt" });
      this.projektBtn.onclick = (e) => this.openProject(e.currentTarget as HTMLElement);
      this.renderProjekt();
    } else {
      foot.createDiv();   // Platzhalter links, damit die Buttons rechts bleiben
    }

    const actions = foot.createDiv({ cls: "bt-actions" });
    const cancel = actions.createEl("button", { text: t("btn_cancel") });
    cancel.onclick = () => { this.discarding = true; this.close(); };
    const submit = actions.createEl("button", { cls: "mod-cta", text: this.existing ? t("btn_save") : t("btn_add_task") });
    submit.onclick = () => void this.save();
  }

  onClose(): void {
    // Auto-Speichern beim Wegklicken / Esc / X (nur mit Titel). „Cancel" verwirft bewusst.
    // persist() ist gegen Doppel-Schreiben geschützt (this.persisted) und braucht kein DOM.
    if (!this.discarding) void this.persist();
    this.logComp?.unload();
    this.contentEl.empty();
  }

  /** Beschreibungs-Textarea an ihren Inhalt anpassen (Auto-Grow, gedeckelt). */
  private growDesc(): void {
    const el = this.descInput; if (!el) return;
    el.setCssStyles({ height: "auto" });
    el.setCssStyles({ height: Math.min(el.scrollHeight, 200) + "px" });
  }

  /** Natural-Language: Datum + #Labels aus dem Titel erkennen und übernehmen.
   *  Datum nur, solange nicht manuell gesetzt; Labels werden ergänzt. */
  private applyParse(): void {
    if (!this.plugin.settings.parseNaturalLanguage) { this.cleanTitle = this.f.title; return; }
    const p = parseQuickEntry(this.f.title);
    this.cleanTitle = p.title;
    if (!this.duePinned && p.faellig) this.f.due = p.faellig;
    if (!this.duePinned && p.time) this.f.dueTime = p.time;   // Uhrzeit („um 07:30") übernehmen
    if (p.priority) this.f.priority = p.priority;             // Priorität („p1") übernehmen
    // Inline-#Labels aus dem Titel bei JEDEM Tastendruck ersetzen (nicht anhäufen) – sonst
    // entstehen beim Tippen von „#wichtig" die Teil-Labels #w, #wi, #wich, … Manuell (Picker/
    // Default) gesetzte Labels bleiben erhalten.
    const manual = this.f.labels!.filter((l) => !this.parsedLabels.includes(l));
    this.parsedLabels = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
    this.f.labels = [...manual, ...this.parsedLabels];
  }

  // ── Chips ──
  /** Brücke Modal ⇄ Chip-Registry: Feldzustand + host-spezifische Callbacks. */
  private chipHost(): ChipHost {
    return {
      plugin: this.plugin,
      app: this.app,
      f: this.f,
      rerender: () => this.renderChips(),
      compactLabels: false,
      iconsOnly: this.plugin.settings.chipsIconsOnly,
      applyStatus: (s) => void this.applyStatus(s),
      pinDue: () => { this.duePinned = true; },
      existingPath: this.existing?.path,
      onParentPicked: (proj) => { if (proj) this.f.project = proj; if (!this.opts.hideProjekt) this.renderProjekt(); },
      toggleDetails: () => this.toggleDetails(),
      detailsOpen: () => !this.logWrap.hasClass("bt-hidden"),
      // Elternaufgaben-Chip im festen „+ Subtask"-Modus (opts.parent) ausblenden – Parent steht fest.
      chipEnabled: (id) => id === "parent" ? !this.opts.parent : true,
    };
  }

  private renderChips(): void {
    const bar = this.chipBar; bar.empty();
    const host = this.chipHost();
    const settings = this.plugin.settings;
    // Reihenfolge + Sichtbarkeit aus den Einstellungen (chipOrder/chipTiers): shown = immer,
    // onValue = nur mit Wert, hidden = nie (nur über „+"). Gesetzte Werte bleiben immer sichtbar.
    for (const id of resolveChipOrder(settings)) {
      const c = CHIPS[id];
      if (host.chipEnabled && !host.chipEnabled(id)) continue;
      const set = c.isSet(this.f, host);
      if (!isInline(settings, id, set)) continue;
      if (c.kind === "status") renderStatusChip(bar, host, c);
      else if (c.kind === "details") this.renderDetailsChip(bar);
      else renderValueChip(bar, host, c, set);
    }
    // „+"-Chip ganz rechts: „Weitere Aktionen" (ausgeblendete Chips) + (Edit) Aufgabenaktionen +
    // „Aufgabenaktionen bearbeiten". Immer sichtbar; has-set = Badge, wenn Ausgeblendete Werte tragen.
    const acts = bar.createEl("button", { cls: "bt-chip bt-chip-actions" + (plusHasSetHidden(host) ? " has-set" : ""), attr: { "aria-label": t("task_actions"), "data-tooltip-position": "top" } });
    setIcon(acts.createSpan({ cls: "bt-chip-ic" }), "plus");
    acts.onclick = (e) => { e.stopPropagation(); this.openPlusMenu(acts); };
  }

  /** Details-Chip (Büroklammer): toggelt die Kommentar-/Detail-Sektion (is-open statt is-set). */
  private renderDetailsChip(bar: HTMLElement): void {
    const open = !this.logWrap.hasClass("bt-hidden");
    const chip = bar.createEl("button", { cls: "bt-chip bt-chip-details" + (open ? " is-open" : "") });
    if (this.plugin.settings.chipsIconsOnly) { chip.setAttribute("aria-label", t("details")); chip.setAttribute("data-tooltip-position", "top"); }
    const dIc = chip.createSpan({ cls: "bt-chip-ic" }); setIcon(dIc, "paperclip");
    chip.createSpan({ cls: "bt-chip-lbl", text: t("details") });
    chip.onclick = (e) => { e.stopPropagation(); this.toggleDetails(); };
    this.detailsChip = chip;
  }

  /** „+"-Popover: „Weitere Aktionen" (ausgeblendete Chips, mit Umrandung + Wert-Vorschau),
   *  im Edit-Modus zusätzlich die Aufgabenaktionen; unten immer „Aufgabenaktionen bearbeiten". */
  private openPlusMenu(anchor: HTMLElement): void {
    const host = this.chipHost();
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-plus");
      const row = (icon: string, label: string, fn: () => void, danger = false): void => {
        const r = popRow(pop, icon, label, () => { close(); fn(); });
        if (danger) r.addClass("bt-row-danger");
      };
      let any = renderPlusChips(pop, host, anchor, close);
      if (this.existing) {
        if (any) pop.createDiv({ cls: "bt-plus-sep" });
        row("corner-down-right", t("menu_create_subtask"), () => this.addSubtask());
        if (this.parentTask()) row("corner-left-up", t("menu_show_parent"), () => this.showParent());
        row("copy", t("menu_duplicate"), () => void this.duplicate());
        pop.createDiv({ cls: "bt-plus-sep" });
        row("link", t("menu_copy_link"), () => this.copyLink());
        row("file-text", t("menu_open_obsidian"), () => this.openInObsidian());
        if (!Platform.isMobile) row("external-link", t("menu_open_editor"), () => this.openInEditor());
        if (!Platform.isMobile) { pop.createDiv({ cls: "bt-plus-sep" }); row("printer", t("menu_print"), () => this.printTask()); }
        pop.createDiv({ cls: "bt-plus-sep" });
        row("trash-2", t("btn_delete"), () => void this.remove(), true);
        any = true;
      }
      if (any) pop.createDiv({ cls: "bt-plus-sep" });
      popRow(pop, "sliders-horizontal", t("edit_task_actions"), () => { close(); openChipSettings(this.app); });
    });
  }

  /** Aufgabe duplizieren: aktuellen Stand sichern und als neue Aufgabe („(Kopie)") anlegen. */
  private async duplicate(): Promise<void> {
    const title = this.titleValue();
    if (!title) { new Notice(t("err_enter_taskname")); return; }
    await this.persist();   // laufende Bearbeitung sichern, bevor kopiert wird
    const file = await createTaskNote(this.app, this.plugin.settings, {
      ...this.f, title: title + " " + t("copy_suffix"), status: "todo",
      parent: this.f.parent ?? this.opts.parent ?? null,
    });
    if (this.logEntries.length) await writeLog(this.app, file, this.logEntries);
    new Notice(t("msg_duplicated"));
    this.close();
  }

  /** Obsidian-Deeplink (obsidian://) zur Aufgabe in die Zwischenablage kopieren. */
  private copyLink(): void {
    if (!this.existing) return;
    const vault = encodeURIComponent(this.app.vault.getName());
    const file = encodeURIComponent(this.existing.path.replace(/\.md$/, ""));
    navigator.clipboard.writeText(`obsidian://open?vault=${vault}&file=${file}`)
      .then(() => new Notice(t("msg_link_copied")))
      .catch((err) => { console.error("BeautyTasks: copy link failed", err); new Notice(t("msg_link_copy_failed")); });
  }

  /** Aufgaben-Notiz in einem neuen Obsidian-Tab öffnen. */
  private openInObsidian(): void {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (file instanceof TFile) { void this.app.workspace.getLeaf("tab").openFile(file); this.close(); }
  }

  /** Aufgaben-Notiz im System-Standardeditor (externe App) öffnen. */
  private openInEditor(): void {
    if (!this.existing) return;
    (this.app as unknown as { openWithDefaultApp?: (p: string) => void }).openWithDefaultApp?.(this.existing.path);
    this.close();
  }

  /** Aufgabe drucken: Titel + Meta + Beschreibung in ein verstecktes iframe rendern und drucken.
   *  DOM-basiert (createElement/textContent) – kein document.write, kein Inline-Style. */
  private printTask(): void {
    const doc = activeDocument;
    const title = this.titleValue() || t("placeholder_taskname");
    const meta: string[] = [];
    if (this.f.due) meta.push(t("chip_date") + ": " + formatDateTime(combineDT(this.f.due, this.f.dueTime)));
    if (this.f.priority && this.f.priority !== "normal") meta.push(t("chip_priority") + ": " + t(PRIO_KEY[this.f.priority]));
    if (this.f.labels?.length) meta.push(t("chip_label") + ": " + this.f.labels.map((l) => "#" + l).join(", "));
    if (this.f.project) meta.push(t("group_project") + ": " + projectDisplayName(this.f.project));
    const desc = (this.f.description ?? "").trim();

    const iframe = doc.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.addClass("bt-print-frame");
    doc.body.appendChild(iframe);
    // Inhalt liegt im iframe-Realm → nur Standard-DOM (kein Obsidian-createEl/addClass).
    const idoc = iframe.contentDocument, win = iframe.contentWindow;
    if (!idoc || !win) { iframe.remove(); return; }
    idoc.title = title;
    idoc.body.className = "bt-print";
    const style = idoc.createElement("style");
    style.textContent = ".bt-print{font-family:sans-serif;margin:2cm;color:#111}.bt-print h1{font-size:20pt;margin:0 0 12pt}"
      + ".bt-print ul{padding-left:1.2em;color:#333;font-size:11pt}.bt-print li{margin:2pt 0}"
      + ".bt-print pre{white-space:pre-wrap;font:inherit;font-size:11pt;margin-top:12pt}";
    idoc.head.appendChild(style);
    const h1 = idoc.createElement("h1"); h1.textContent = title; idoc.body.appendChild(h1);
    if (meta.length) {
      const ul = idoc.createElement("ul");
      for (const m of meta) { const li = idoc.createElement("li"); li.textContent = m; ul.appendChild(li); }
      idoc.body.appendChild(ul);
    }
    if (desc) { const pre = idoc.createElement("pre"); pre.textContent = desc; idoc.body.appendChild(pre); }
    win.focus();
    win.print();
    window.setTimeout(() => iframe.remove(), 1000);
  }

  /** Detail-Sektion (Kommentar-Log) auf-/zuklappen – vom Büroklammer-Chip ausgelöst. */
  private toggleDetails(): void {
    const willOpen = this.logWrap.hasClass("bt-hidden");
    this.logWrap.toggleClass("bt-hidden", !willOpen);
    if (willOpen) window.setTimeout(() => this.logInput?.focus(), 0);
    this.syncDetails();
  }

  /** Chip-Zustand + Sichtbarkeit des Detail-Bereichs angleichen: Der Wrapper (und damit sein
   *  Leerraum) verschwindet, wenn die Kommentar-Sektion zu ist – so kein leeres Band unter
   *  den Chips. */
  private syncDetails(): void {
    const logOpen = !this.logWrap.hasClass("bt-hidden");
    this.detailsChip?.toggleClass("is-open", logOpen);
    this.detailsWrap.toggleClass("bt-hidden", !logOpen);
  }

  /** Die aktuell gewählte Elternaufgabe aus dem Index (oder null, wenn keine/nicht gefunden). */
  private parentTask(): Task | null {
    if (!this.f.parent) return null;
    return this.plugin.index.all().find((tk) => baseName(tk.path) === this.f.parent) ?? null;
  }

  /** Elternaufgabe in ihrer Liste anzeigen (wie die Lupe in der Suche: hinspringen + kurz
   *  hervorheben). Modal schließen, damit die hervorgehobene Zeile sichtbar wird. */
  private showParent(): void {
    const parent = this.parentTask();
    if (!parent) { new Notice(t("err_parent_not_found")); return; }
    this.close();
    void this.plugin.revealTask(parent);
  }

  /** Status übernehmen. Bei bestehender Aufgabe live schreiben (setTaskStatus kümmert sich
   *  um Zeitstempel/Wiederholung); bei neuer Aufgabe fließt f.status beim Anlegen ein. */
  private async applyStatus(status: TaskStatus): Promise<void> {
    this.f.status = status;
    if (this.existing) { await this.plugin.setTaskStatus(this.existing, status); this.existing.status = status; }
    this.renderChips();
  }

  private renderProjekt(): void {
    this.projektBtn.empty();
    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
    const all = [eingang, ...bereiche, ...projekte].filter(Boolean) as { name: string; icon: string; color: string | null }[];
    const sel = all.find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    setIcon(ic, sel?.icon ?? (this.f.project ? "folder" : "inbox"));
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: this.f.project ? projectDisplayName(this.f.project) : t("no_project") });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" }); setIcon(car, "chevron-down");
  }

  private openProject(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      // Projekt ODER Bereich direkt anlegen – gleicher Weg wie im ListManager.
      popRow(pop, "plus", t("pick_new_project"), () => this.startNewProject(pop, close, false)).addClass("bt-row-action");
      popRow(pop, "plus", t("pick_new_area"), () => this.startNewProject(pop, close, true)).addClass("bt-row-action");

      const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name: string) => { this.f.project = name; this.renderProjekt(); close(); };
      if (eingang) popRow(pop, eingang.icon, projectDisplayName(eingang.name), () => pick(eingang.name), this.f.project === eingang.name, eingang.color ?? undefined);
      const group = (title: string, items: { name: string; icon: string; color: string | null }[]) => {
        if (!items.length) return;
        pop.createDiv({ cls: "bt-pop-head", text: title });
        for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), this.f.project === it.name, it.color ?? undefined);
      };
      group(t("group_area"), bereiche);
      group(t("group_project"), projekte);
    });
  }

  private startNewProject(pop: HTMLElement, close: () => void, asArea: boolean): void {
    pop.empty();
    const inp = pop.createEl("input", { type: "text", cls: "bt-pop-input", attr: { placeholder: asArea ? t("placeholder_area_name") : t("placeholder_project_name") } });
    inp.onkeydown = async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const name = inp.value.trim();
      if (!name) return;
      const base = await createProjectNote(this.app, this.plugin.settings, name, asArea);
      this.f.project = base; this.renderProjekt();
      close();
    };
    window.setTimeout(() => inp.focus(), 0);
  }

  // ── Unteraufgabe ──
  /** „＋ Unteraufgabe": schließt dieses Modal und öffnet ein neues, vollwertiges
   *  Aufgaben-Modal mit ausgeblendetem Projekt-Chip. Projekt = das der Hauptaufgabe,
   *  parent = Eltern-Titel. Genau wie im alten BeautyTasks. */
  private addSubtask(): void {
    if (!this.existing) return;
    const parent = this.existing;
    const parentProject = parent.project ? parent.project.split("/").pop()!.replace(/\.md$/, "") : undefined;
    // Eltern-Link über den Basename (Dateiname), NICHT den Titel – der Titel (Überschrift)
    // kann vom Dateinamen abweichen und würde als Wikilink sonst nicht auflösen.
    const parentBase = parent.path.split("/").pop()!.replace(/\.md$/, "");
    this.close();
    new TaskModal(this.plugin, undefined, parentProject, { hideProjekt: true, parent: parentBase }).open();
  }

  // ── Details: Kommentar-Log (Timeline + Composer) ──
  private logSrc(): string { return this.existing?.path ?? this.plugin.settings.itemsFolder + "/_.md"; }

  /** Timeline der Einträge (Zeitstempel + Markdown + Bearbeiten/Löschen) + Composer. */
  private renderDetailLog(): void {
    const wrap = this.logWrap; wrap.empty();
    this.logComp?.unload();
    this.logComp = new Component(); this.logComp.load();
    const src = this.logSrc();
    const list = wrap.createDiv({ cls: "bt-log-list" });
    // Klicks in den gerenderten Kommentaren: Bilder öffnen die Lightbox, interne
    // Links (Notizen/PDF) öffnen im Tab. MarkdownRenderer verdrahtet im Modal keine
    // Navigation. Delegation am transienten `list` (bei jedem Re-Render neu erzeugt)
    // → kein manuelles Cleanup, kein doppelter Listener.
    list.addEventListener("click", (e) => {
      if (!(e.target instanceof HTMLElement)) return;
      const img = e.target.closest(".bt-log-content img");
      if (img instanceof HTMLImageElement) {
        e.preventDefault();
        const imgs = Array.from(list.querySelectorAll<HTMLImageElement>(".bt-log-content img"));
        this.openLightbox(imgs, imgs.indexOf(img));
        return;
      }
      const link = e.target.closest("a.internal-link");
      if (link) {
        const href = link.getAttribute("data-href") || link.getAttribute("href");
        if (href) { e.preventDefault(); void this.app.workspace.openLinkText(href, src, true); this.close(); }
      }
    });
    this.logEntries.forEach((entry, idx) => {
      const row = list.createDiv({ cls: "bt-log-entry" });
      const head = row.createDiv({ cls: "bt-log-head" });
      head.createDiv({ cls: "bt-log-ts", text: formatLogTime(entry.ts) || "—" });
      const content = row.createDiv({ cls: "bt-log-content" });
      this.renderEntry(content, entry, src);
      const acts = head.createDiv({ cls: "bt-log-actions" });
      const ed = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("log_edit") } });
      setIcon(ed.createSpan(), "pencil");
      ed.onclick = () => this.editEntry(idx, content, src);
      const del = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("btn_delete") } });
      setIcon(del.createSpan(), "trash-2");
      del.onclick = () => { this.logEntries.splice(idx, 1); this.renderDetailLog(); void this.persistLog(); };
    });
    const comp = wrap.createDiv({ cls: "bt-log-composer" });
    const inp = comp.createEl("textarea", { cls: "bt-log-input", attr: { placeholder: t("log_placeholder"), rows: "1" } });
    this.logInput = inp;
    const grow = () => { inp.setCssStyles({ height: "auto" }); inp.setCssStyles({ height: Math.min(inp.scrollHeight, 220) + "px" }); };
    inp.oninput = grow;
    inp.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.addEntry(); } };
    inp.onpaste = (ev) => { const f = ev.clipboardData?.files; if (f && f.length) { ev.preventDefault(); void this.handleFiles(f); } };
    inp.ondragover = (ev) => { ev.preventDefault(); inp.addClass("bt-drop"); };
    inp.ondragleave = () => inp.removeClass("bt-drop");
    inp.ondrop = (ev) => { const f = ev.dataTransfer?.files; if (f && f.length) { ev.preventDefault(); ev.stopPropagation(); inp.removeClass("bt-drop"); void this.handleFiles(f); } };
    const cActs = comp.createDiv({ cls: "bt-log-composer-actions" });
    const attach = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_attach") } });
    setIcon(attach.createSpan(), "paperclip");
    attach.onclick = () => this.pickAttachment();
    const linkBtn = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_link") } });
    setIcon(linkBtn.createSpan(), "link");
    linkBtn.onclick = () => this.pickNote();
    const add = cActs.createEl("button", { cls: "bt-log-add", attr: { "aria-label": t("log_add") } });
    setIcon(add.createSpan(), "send-horizontal");
    add.onclick = () => this.addEntry();
    window.setTimeout(() => { list.scrollTop = list.scrollHeight; }, 0);
  }

  private renderEntry(el: HTMLElement, entry: LogEntry, src: string): void {
    el.empty();
    void Promise.resolve(MarkdownRenderer.render(this.app, entry.body || "", el, src, this.logComp!))
      .catch((e) => console.error("bt-log render", e));
  }

  /** Bild-Lightbox über dem Modal: navigiert über alle Kommentar-Bilder (Pfeiltasten/
   *  Buttons), Esc oder Klick auf den Hintergrund schließt. Das Overlay ist transient –
   *  nur der Tastatur-Listener braucht Cleanup, darum das Fenster fixieren (Popout-Drift). */
  private openLightbox(imgs: HTMLImageElement[], startIndex: number): void {
    if (!imgs.length) return;
    let i = Math.max(0, Math.min(startIndex, imgs.length - 1));
    const many = imgs.length > 1;
    const doc = activeDocument;

    const ov = doc.body.createDiv("bt-lightbox");
    const stage = ov.createDiv("bt-lb-stage");
    const view = stage.createEl("img", { cls: "bt-lb-img" });
    const counter = many ? ov.createDiv("bt-lb-counter") : null;

    const show = () => { view.src = imgs[i].src; counter?.setText((i + 1) + " / " + imgs.length); };
    const go = (d: number) => { i = (i + d + imgs.length) % imgs.length; show(); };
    // Aktuelles Bild als PNG in die Zwischenablage (Canvas -> Blob -> Clipboard-API).
    const copyCurrent = async (): Promise<void> => {
      const img = imgs[i];
      try {
        const canvas = doc.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("toBlob returned null");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        new Notice(t("msg_image_copied"));
      } catch (err) {
        console.error("BeautyTasks: copy image failed", err);
        new Notice(t("msg_image_copy_failed"));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) { e.preventDefault(); void copyCurrent(); }
      else if (many && e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (many && e.key === "ArrowRight") { e.preventDefault(); go(1); }
    };
    const close = () => { ov.remove(); doc.removeEventListener("keydown", onKey, true); };

    if (many) {
      const nav = (cls: string, icon: string, label: string, d: number) => {
        const b = ov.createEl("button", { cls: "bt-lb-nav " + cls, attr: { "aria-label": label } });
        setIcon(b, icon);
        b.onclick = (e) => { e.stopPropagation(); go(d); };
      };
      nav("bt-lb-prev", "chevron-left", t("lb_prev"), -1);
      nav("bt-lb-next", "chevron-right", t("lb_next"), 1);
    }
    const copyBtn = ov.createEl("button", { cls: "bt-lb-copy", attr: { "aria-label": t("lb_copy") } });
    setIcon(copyBtn, "copy");
    copyBtn.onclick = (e) => { e.stopPropagation(); void copyCurrent(); };
    const closeBtn = ov.createEl("button", { cls: "bt-lb-close", attr: { "aria-label": t("btn_close") } });
    setIcon(closeBtn, "x");
    closeBtn.onclick = (e) => { e.stopPropagation(); close(); };

    view.onclick = (e) => { e.stopPropagation(); if (many) go(1); };
    ov.onclick = (e) => { if (e.target === ov || e.target === stage) close(); };
    doc.addEventListener("keydown", onKey, true);
    show();
  }

  private addEntry(): void {
    const v = (this.logInput?.value || "").trim();
    if (!v) return;
    this.logEntries.push({ ts: nowLogTs(), body: v });
    this.logWrap.removeClass("bt-hidden");
    this.syncDetails();
    this.renderDetailLog();
    void this.persistLog();
  }

  private editEntry(idx: number, contentEl: HTMLElement, _src: string): void {
    const entry = this.logEntries[idx];
    contentEl.empty();
    const ta = contentEl.createEl("textarea", { cls: "bt-log-edit" });
    ta.value = entry.body || "";
    window.setTimeout(() => { ta.setCssStyles({ height: "auto" }); ta.setCssStyles({ height: (ta.scrollHeight + 2) + "px" }); ta.focus(); }, 0);
    const acts = contentEl.createDiv({ cls: "bt-log-edit-acts" });
    const doSave = () => { entry.body = ta.value.trim(); if (!entry.body) this.logEntries.splice(idx, 1); this.renderDetailLog(); void this.persistLog(); };
    const save = acts.createEl("button", { cls: "bt-log-edit-btn mod-cta", text: t("log_update") });
    save.onclick = doSave;
    const cancel = acts.createEl("button", { cls: "bt-log-edit-btn", text: t("btn_cancel") });
    cancel.onclick = () => this.renderDetailLog();
    ta.onkeydown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
      else if (e.key === "Escape") { e.preventDefault(); this.renderDetailLog(); }
    };
  }

  /** Sofort-Speichern – unabhängig vom Modal-Save. Bei neuen Aufgaben (kein File)
   *  wird der Log erst beim Speichern in den Body geschrieben. Serialisiert (Kette). */
  private async persistLog(): Promise<void> {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (!(file instanceof TFile)) return;
    this.persistChain = this.persistChain.then(async () => {
      try { await writeLog(this.app, file, this.logEntries); }
      catch (e) { console.error("bt-log persist", e); new Notice(t("err_detail_save")); }
    });
    return this.persistChain;
  }

  // ── Anhänge ──
  private insertInComposer(text: string): void {
    const el = this.logInput; if (!el) return;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    el.selectionStart = el.selectionEnd = s + text.length;
    el.dispatchEvent(new Event("input"));
    el.focus();
  }

  private async saveAttachment(file: File): Promise<void> {
    const IMG = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "heic"];
    const dir = this.plugin.settings.attachmentsFolder;
    try {
      const name = file.name || ("Pasted-" + Date.now() + "." + (file.type.split("/")[1] || "bin"));
      const buf = await file.arrayBuffer();
      await ensureFolder(this.app, dir);
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let p = normalizePath(dir + "/" + name); let i = 1;
      while (this.app.vault.getAbstractFileByPath(p)) p = normalizePath(dir + "/" + base + "-" + (i++) + ext);
      const tfile = await this.app.vault.createBinary(p, buf);
      const isImage = IMG.includes((name.split(".").pop() || "").toLowerCase());
      const link = this.app.fileManager.generateMarkdownLink(tfile, this.logSrc());
      this.logWrap.removeClass("bt-hidden");
      this.syncDetails();
      this.insertInComposer((isImage ? "!" : "") + link + " ");
      new Notice(t("msg_attached", tfile.name));
    } catch (err) {
      console.error("bt-attachment", err);
      new Notice(t("msg_attach_failed", String((err as Error)?.message || err)));
    }
  }

  private async handleFiles(files: FileList): Promise<void> { for (const f of Array.from(files)) await this.saveAttachment(f); }

  private pickAttachment(): void {
    const fi = createEl("input", { cls: "bt-hidden-file", attr: { type: "file", multiple: "true" } });
    activeDocument.body.appendChild(fi);
    // Einmal-Listener: Element wird nach Auswahl entfernt → kein Leak.
    fi.addEventListener("change", () => { if (fi.files?.length) void this.handleFiles(fi.files); fi.remove(); });
    fi.click();
  }

  private pickNote(): void {
    const app = this.app;
    const src = this.logSrc();
    const insert = (f: TFile) => { this.logWrap.removeClass("bt-hidden"); this.syncDetails(); this.insertInComposer(app.fileManager.generateMarkdownLink(f, src) + " "); };
    class NotePicker extends FuzzySuggestModal<TFile> {
      getItems(): TFile[] { return app.vault.getMarkdownFiles(); }
      getItemText(f: TFile): string { return f.path; }
      onChooseItem(f: TFile): void { insert(f); }
    }
    const picker = new NotePicker(app);
    picker.setPlaceholder(t("log_link_placeholder"));
    picker.open();
  }

  // ── Speichern / Löschen ──
  /** Aktueller (bereinigter) Titel. */
  private titleValue(): string { return (this.cleanTitle || this.f.title).trim(); }

  /** Explizites Speichern (Button/Enter): bei leerem Titel Hinweis + offen bleiben. */
  private async save(): Promise<void> {
    if (!this.titleValue()) { new Notice(t("err_enter_taskname")); return; }
    await this.persist();
    this.close();
  }

  /** Schreibt die Aufgabe (neu anlegen oder Frontmatter aktualisieren). Ohne Titel passiert
   *  nichts (stilles Verwerfen beim Auto-Speichern); nur EINMAL (Schutz gegen Doppel-Schreiben). */
  private async persist(): Promise<void> {
    const title = this.titleValue();
    if (!title || this.persisted) return;
    this.persisted = true;
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof TFile) {
        await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
          const set = (k: string, v: unknown) => {
            if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) delete fm[k]; else fm[k] = v;
          };
          set("priority", this.f.priority && this.f.priority !== "normal" ? this.f.priority : null);
          set("due", this.f.due ? combineDT(this.f.due, this.f.dueTime) : null);
          set("scheduled", this.f.scheduled ? combineDT(this.f.scheduled, this.f.scheduledTime) : null);
          set("duration", this.f.duration ?? null);
          set("recurrence", this.f.recurrence);
          set("recur_basis", this.f.recurrence && this.f.recurBasis === "done" ? "done" : null);
          set("project", this.f.project ? "[[" + this.f.project + "]]" : null);
          set("parent", this.f.parent ? "[[" + this.f.parent + "]]" : null);
          set("labels", this.f.labels);
          set("reminders", this.f.reminders);
        });
        if (title !== this.existing.title) {
          // Titel steckt in der „# Überschrift" (ungekürzt); Dateiname bleibt der Slug
          // -> kein Umbenennen (bricht sonst Eltern-Links) und keine Längenbegrenzung.
          await this.app.vault.process(file, (c) => c.replace(/^#\s+.*$/m, () => "# " + title));
        }
        // Beschreibung nur schreiben, wenn geladen oder getippt (undefined = Read noch
        // offen und nichts eingegeben -> Body nicht überschreiben).
        if (this.f.description !== undefined) await writeDescription(this.app, file, this.f.description ?? "");
      }
    } else {
      const file = await createTaskNote(this.app, this.plugin.settings, { ...this.f, title, parent: this.f.parent ?? this.opts.parent ?? null });
      if (this.logEntries.length) await writeLog(this.app, file, this.logEntries);
    }
  }

  private async remove(): Promise<void> {
    if (!this.existing) return;
    this.discarding = true;   // Löschen ist kein Bearbeiten -> onClose darf nicht auto-speichern
    // Kaskade: Aufgabe UND alle Unteraufgaben in den Papierkorb (sonst verwaisen Kinder).
    await this.plugin.cancelTask(this.existing);
    this.close();
  }
}
