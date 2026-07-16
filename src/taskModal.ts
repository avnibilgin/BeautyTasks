import { Modal, TFile, Notice, setIcon, Platform } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task, TaskStatus } from "./types";
import { createTaskNote, listProjectsAndAreas, createProjectNote, todayIso, ensureCanonicalFm, isInboxLink, TaskFields } from "./taskService";
import { formatDateTime, combineDT } from "./format";
import { openPopover, popRow } from "./popover";
import { applyQuickEntry, emptyQuickEntryState, QuickEntryState } from "./quickEntry";
import { readLog } from "./detailLog";
import { DetailLogView } from "./detailLogView";
import { firstOpenStatus } from "./statuses";
import { CHIPS, ChipHost, ChipFields, resolveChipOrder, isInline, plusHasSetHidden, renderPlusChips, renderStatusChip, renderValueChip, openChipSettings, PRIOS, PRIO_KEY } from "./chips";
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
  private projektBtn!: HTMLButtonElement;
  private detailsWrap!: HTMLElement;
  private logWrap!: HTMLElement;
  private detailsChip?: HTMLElement;   // Büroklammer-Chip, der die Detail-Sektion toggelt
  private log!: DetailLogView;         // Kommentar-Log (gemeinsame Komponente)
  private duePinned = false;          // true sobald Datum manuell gesetzt -> NL überschreibt nicht mehr
  private cleanTitle = "";            // Titel ohne erkannte Datum-/Label-Token
  private nl: QuickEntryState = emptyQuickEntryState();  // aus dem Titel Erkanntes (trennt es von Manuellem)
  private discarding = false;          // true = bewusst verwerfen („Cancel") -> kein Auto-Speichern
  private persisted = false;           // true sobald geschrieben -> kein Doppel-Speichern

  /** opts.hideProjekt blendet das Projekt-Chip aus (Unteraufgaben-Modus – die
   *  Unteraufgabe erbt Projekt der Hauptaufgabe). opts.parent = Eltern-Basename. */
  constructor(private plugin: BeautyTasksPlugin, private existing?: Task, defaultProject?: string,
              private opts: { hideProjekt?: boolean; parent?: string; defaultLabel?: string; defaultToday?: boolean; defaultTitle?: string; defaultStatus?: TaskStatus; seed?: Partial<ChipFields> & { description?: string }; openDetails?: boolean; duePinned?: boolean } = {}) {
    super(plugin.app);
    const seed = opts.seed;
    this.f = existing
      ? {
          title: existing.title, status: existing.status, due: existing.due, dueTime: existing.dueTime,
          scheduled: existing.scheduled, scheduledTime: existing.scheduledTime, duration: existing.duration,
          priority: existing.priority, recurrence: existing.recurrence, recurBasis: existing.recurBasis,
          project: existing.project ? baseName(existing.project) : null,
          parent: existing.parent ? baseName(existing.parent) : null,
          labels: [...existing.labels],
          reminders: [...(existing.reminders ?? [])],
          description: existing.description,   // aus dem Frontmatter (kein Body-Read mehr nötig)
        }
      // Neu: Basis + optionaler Seed (z. B. aus der Schnelleingabe, ⤢ „Voller Editor" – übernimmt
      // alle bereits gesetzten Chips). Explizit, damit reminders sicher string[] bleibt.
      : {
          title: opts.defaultTitle ?? "",
          status: seed?.status ?? opts.defaultStatus,
          priority: seed?.priority ?? "normal",
          labels: seed?.labels ? [...seed.labels] : (opts.defaultLabel ? [opts.defaultLabel] : []),
          reminders: seed?.reminders ? [...seed.reminders] : [],
          due: seed?.due ?? (opts.defaultToday ? todayIso() : null),
          dueTime: seed?.dueTime ?? null, duration: seed?.duration ?? null,
          scheduled: seed?.scheduled ?? null, scheduledTime: seed?.scheduledTime ?? null,
          recurrence: seed?.recurrence ?? null, recurBasis: seed?.recurBasis ?? "due",
          parent: seed?.parent ?? null, description: seed?.description,
          project: defaultProject ?? null,   // kein Default-Projekt -> Eingang (= kein Projekt)
        };
    if (opts.duePinned) this.duePinned = true;   // aus der Schnelleingabe übernommen (⤢)
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
    desc.oninput = () => { this.f.description = desc.value; this.growDesc(); };
    this.descInput = desc;
    window.setTimeout(() => this.growDesc(), 0);

    this.chipBar = contentEl.createDiv({ cls: "bt-chips" });

    // Details = Kommentar-Log (Timeline), einklappbar. Öffnen/Schließen jetzt über den
    // Büroklammer-Chip in der Chip-Leiste (statt der früheren "+ Details"-Zeile). Der Log
    // lebt im Body der Aufgaben-Notiz. Vor renderChips() anlegen, damit der Details-Chip
    // seinen Offen/Zu-Zustand aus logWrap lesen kann.
    this.detailsWrap = contentEl.createDiv({ cls: "bt-details" });
    this.logWrap = this.detailsWrap.createDiv({ cls: "bt-log bt-hidden" });
    this.log = new DetailLogView(this.app, this.plugin, {
      srcPath: () => this.logSrc(),
      file: () => this.existingFile(),
      reveal: () => { this.logWrap.removeClass("bt-hidden"); this.syncDetails(); },
      close: () => this.close(),
    });

    this.applyParse();
    this.renderChips();
    this.log.mount(this.logWrap);
    this.syncDetails();
    // Bestehende Aufgabe: Log aus dem Notiz-Body laden, bei Inhalt direkt aufgeklappt.
    // (Die Beschreibung kommt bereits aus dem Frontmatter über this.f.description.)
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof TFile) {
        void readLog(this.app, file).then((entries) => {
          this.log.setEntries(entries);
          if (entries.length) this.logWrap.removeClass("bt-hidden");
          this.log.render();
          this.syncDetails();
        });
      }
    }
    // Aus der Schnelleingabe über den Details-Chip geöffnet: Detailbereich direkt aufklappen.
    if (this.opts.openDetails) {
      this.logWrap.removeClass("bt-hidden");
      this.syncDetails();
      window.setTimeout(() => this.log.focusComposer(), 0);
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
    this.log?.unload();
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
    const r = applyQuickEntry(this.f.title, {
      due: this.f.due ?? null, dueTime: this.f.dueTime ?? null, priority: this.f.priority ?? "normal",
      labels: this.f.labels ?? [], project: this.f.project ?? null,
    }, this.nl, {
      enabled: this.plugin.settings.parseNaturalLanguage,
      // Bestehende Aufgabe: der gespeicherte Titel ist Text, kein Befehl. Er wurde bei der Erfassung
      // bereits geparst – ein zweiter Lauf läse „heute" erneut als Datum und löschte das Wort aus
      // dem Titel (beim Schließen wird automatisch gespeichert). Betrifft jeden Titel mit
      // Auslöserwort: per `\heute` geschützt, importiert oder von Hand geschrieben.
      frozen: !!this.existing,
      duePinned: this.duePinned,
      today: todayIso(),
      // Kein @Projekt im vollen Editor: dafür gibt es hier den eigenen Projekt-Wähler.
    });
    this.cleanTitle = r.title;
    Object.assign(this.f, r.fields);
    this.nl = r.state;
  }

  // ── Chips ──
  /** Brücke Modal ⇄ Chip-Registry: Feldzustand + host-spezifische Callbacks. */
  private chipHost(): ChipHost {
    return {
      plugin: this.plugin,
      app: this.app,
      f: this.f,
      surface: "editor",
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
    for (const id of resolveChipOrder(settings, host.surface)) {
      const c = CHIPS[id];
      if (host.chipEnabled && !host.chipEnabled(id)) continue;
      const set = c.isSet(this.f, host);
      if (!isInline(settings, host.surface, id, set)) continue;
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
      ...this.f, title: title + " " + t("copy_suffix"), status: firstOpenStatus(),
      parent: this.f.parent ?? this.opts.parent ?? null,
    });
    await this.log.flush(file);
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
    if (willOpen) window.setTimeout(() => this.log.focusComposer(), 0);
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
    const { bereiche, projekte } = listProjectsAndAreas(this.app);
    const inbox = isInboxLink(this.f.project);   // kein Projekt ODER Verweis auf Inbox -> Eingang
    const sel = inbox ? null : [...bereiche, ...projekte].find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    setIcon(ic, inbox ? "inbox" : (sel?.icon ?? "folder"));
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: inbox ? t("nav_inbox") : projectDisplayName(this.f.project) });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" }); setIcon(car, "chevron-down");
  }

  private openProject(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      // Projekt ODER Bereich direkt anlegen – gleicher Weg wie im ListManager.
      popRow(pop, "plus", t("pick_new_project"), () => this.startNewProject(pop, close, false)).addClass("bt-row-action");
      popRow(pop, "plus", t("pick_new_area"), () => this.startNewProject(pop, close, true)).addClass("bt-row-action");

      const { bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name: string | null) => { this.f.project = name; this.renderProjekt(); close(); };
      // Eingang = kein Projekt (Auswahl leert das Projekt-Feld).
      popRow(pop, "inbox", t("nav_inbox"), () => pick(null), isInboxLink(this.f.project));
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

  // ── Details: Kommentar-Log (gemeinsame Komponente DetailLogView) ──
  private logSrc(): string { return this.existing?.path ?? this.plugin.settings.itemsFolder + "/_.md"; }

  /** Ziel-Datei des Logs (nur bei bestehender Aufgabe) – null = neue Aufgabe (Puffer im Speicher). */
  private existingFile(): TFile | null {
    if (!this.existing) return null;
    const f = this.app.vault.getAbstractFileByPath(this.existing.path);
    return f instanceof TFile ? f : null;
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
          ensureCanonicalFm(fm);   // handgeschriebene Notiz beim ersten Editieren kanonisieren
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
          set("description", (this.f.description ?? "").trim() || null);   // leer => Feld entfernen
        });
        if (title !== this.existing.title) {
          // Titel steckt in der „# Überschrift" (ungekürzt); Dateiname bleibt der Slug
          // -> kein Umbenennen (bricht sonst Eltern-Links) und keine Längenbegrenzung.
          await this.app.vault.process(file, (c) => c.replace(/^#\s+.*$/m, () => "# " + title));
        }
        // Beschreibung steht im Frontmatter (siehe set("description") oben) – der Notiz-Body
        // (eigener Inhalt einer umgewandelten Notiz) bleibt hier bewusst unangetastet.
      }
    } else {
      const file = await createTaskNote(this.app, this.plugin.settings, { ...this.f, title, parent: this.f.parent ?? this.opts.parent ?? null });
      await this.log.flush(file);
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
