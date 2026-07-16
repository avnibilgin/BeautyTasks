// Kompaktes Schnell-Erfassungs-Modal (Todoist-Stil): ein Titelfeld mit Natural-Language-Parsing
// und eine interaktive Chip-Leiste. Die Chips kommen – wie im vollen Editor – aus der gemeinsamen
// Registry (chips.ts): volle Chip-Parität (hier stets als Nur-Icon, kompakt). Beschreibung und
// Kommentar-Log (Details-Chip) teilen sich Feld/Komponente mit dem vollen Editor. Ein „+" bündelt
// ausgeblendete Chips + „Aufgabenaktionen bearbeiten". Nach dem Anlegen bleibt das Modal offen
// (Multi-Add / Brain-Dump). Der ⤢-Button öffnet den vollen Editor mit allem Übernommenen.
import { Modal, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority, TaskStatus } from "./types";
import { applyQuickEntry, emptyQuickEntryState, escapeTriggers, QuickEntryState } from "./quickEntry";
import { createTaskNote, listProjectsAndAreas, isInboxLink } from "./taskService";
import { t, projectDisplayName } from "./i18n";
import { todayStr } from "./format";
import { openPopover, popRow } from "./popover";
import { CHIPS, ChipHost, resolveChipOrder, isInline, plusHasSetHidden, renderPlusChips, renderStatusChip, renderValueChip, openChipSettings } from "./chips";
import { firstOpenStatus } from "./statuses";
import { TaskModal } from "./taskModal";

export class QuickAddModal extends Modal {
  private f: {
    title: string; project: string | null; status: TaskStatus;
    due: string | null; dueTime: string | null; duration: number | null;
    scheduled: string | null; scheduledTime: string | null;
    priority: Priority; labels: string[];
    recurrence: string | null; recurBasis: "due" | "done";
    reminders: string[]; parent: string | null;
  };
  private cleanTitle = "";
  private duePinned = false;        // Datum manuell gesetzt/geleert -> Parser überschreibt nicht mehr
  private nl: QuickEntryState = emptyQuickEntryState();  // aus dem Titel Erkanntes (trennt es von Manuellem)
  private readonly defaultProject: string | null;   // Projekt-Fallback, wenn @Projekt wieder entfernt wird (null = Eingang)
  private input!: HTMLInputElement;
  private chipBar!: HTMLElement;
  private projektBtn!: HTMLButtonElement;

  /** `opts` belegt die Schnellerfassung aus dem Kontext der aufrufenden Seite vor – genauso wie
   *  der „+ Aufgabe"-Knopf unter dem Seitentitel (Label-Seite -> Label, Heute -> heute, …). */
  constructor(private plugin: BeautyTasksPlugin, project?: string,
              opts: { label?: string; due?: string | null; today?: boolean } = {}) {
    super(plugin.app);
    this.defaultProject = project ?? null;   // kein Default-Projekt -> Eingang
    this.f = {
      title: "", project: this.defaultProject, status: firstOpenStatus(),
      due: opts.due ?? (opts.today ? todayStr() : null),
      dueTime: null, duration: null, scheduled: null, scheduledTime: null,
      priority: "normal", labels: opts.label ? [opts.label] : [],
      recurrence: null, recurBasis: "due", reminders: [], parent: null,
    };
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    // Basisklasse teilen -> erbt Titel-/Projekt-/Chip-Styles; .bt-quickadd macht es kompakt.
    // Schnelleingabe zeigt leere Chips grundsätzlich nur als Icon (bt-chips-icons-only).
    modalEl.addClass("bt-task-modal");
    modalEl.addClass("bt-quickadd");
    modalEl.addClass("bt-chips-icons-only");
    contentEl.empty();

    const input = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder: t("qa_placeholder") } });
    input.oninput = () => { this.f.title = input.value; this.parse(); this.renderChips(); this.renderProjekt(); };
    input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void this.submit(); } };
    window.setTimeout(() => input.focus(), 0);
    this.input = input;

    // Eine kompakte Zeile: links Projekt-Chip + interaktive Chips, rechts Aktionen (voller Editor / Absenden).
    const row = contentEl.createDiv({ cls: "bt-qa-row" });
    this.projektBtn = row.createEl("button", { cls: "bt-projekt" });
    this.projektBtn.onclick = (e) => this.openProject(e.currentTarget as HTMLElement);
    this.chipBar = row.createDiv({ cls: "bt-chips bt-qa-chips" });

    const right = row.createDiv({ cls: "bt-qa-foot-right" });
    const full = right.createEl("button", { cls: "bt-qa-icon", attr: { "aria-label": t("qa_open_full"), "data-tooltip-position": "top" } });
    setIcon(full, "maximize-2");
    full.onclick = () => this.openInFull();
    const submit = right.createEl("button", { cls: "mod-cta bt-qa-submit", attr: { "aria-label": t("btn_add_task"), "data-tooltip-position": "top" } });
    setIcon(submit, "arrow-up");
    submit.onclick = () => void this.submit();

    this.parse();
    this.renderChips();
    this.renderProjekt();
  }

  onClose(): void { this.contentEl.empty(); }

  /** Natural-Language aus dem Titel: Datum, Uhrzeit, Priorität, #Labels, @Projekt. Manuell (per
   *  Chip) gesetzte Werte bleiben erhalten. Spiegelt die Logik von TaskModal.applyParse. */
  private parse(): void {
    const { bereiche, projekte } = listProjectsAndAreas(this.app);
    const r = applyQuickEntry(this.f.title, this.f, this.nl, {
      enabled: this.plugin.settings.parseNaturalLanguage,
      frozen: false,                 // Schnelleingabe legt immer neu an
      duePinned: this.duePinned,
      today: todayStr(),
      projects: [...bereiche, ...projekte].map((p) => p.name),
      defaultProject: this.defaultProject,
    });
    this.cleanTitle = r.title;
    Object.assign(this.f, r.fields);
    this.nl = r.state;
  }

  /** ✕ am Datums-Chip: den erkannten Auslöser im Titel escapen („morgen" -> „\morgen"), damit das
   *  Wort Text bleibt. false = nichts zu escapen (manuell gesetzt oder Auslöser nicht auffindbar),
   *  dann leert der Chip wie bisher. */
  private unparseDue(): boolean {
    const next = escapeTriggers(this.f.title, [this.nl.dueSrc, this.nl.timeSrc]);
    if (next === this.f.title) return false;
    this.f.title = next;
    this.input.value = next;
    // Der Wert kam aus dem Titel – escapen heisst: er ist weg. Erst leeren, dann neu parsen
    // (der escapte Text setzt nichts mehr). KEIN pinDue: das Escape im Titel IST der Zustand,
    // ein spaeter getipptes „uebermorgen" soll wieder erkannt werden.
    this.f.due = null; this.f.dueTime = null; this.f.duration = null;
    this.parse();
    return true;
  }

  // ── Chips (gemeinsame Registry) ──
  /** Brücke Modal ⇄ Chip-Registry. Kein existing (Neu-Anlage): Status nur lokal, keine Ausschlüsse. */
  private chipHost(): ChipHost {
    return {
      plugin: this.plugin,
      app: this.app,
      f: this.f,
      surface: "quickAdd",
      rerender: () => this.renderChips(),
      compactLabels: true,     // Priorität als „P1" (kompakt)
      iconsOnly: true,         // leere Chips stets nur Icon
      applyStatus: (s) => { this.f.status = s; this.renderChips(); },
      // Manuell gesetzt/geleert: der Titel besitzt das Datum ab jetzt nicht mehr.
      pinDue: () => { this.duePinned = true; this.nl.dueSrc = ""; this.nl.timeSrc = ""; },
      unparseDue: () => this.unparseDue(),
      resetParsedLabels: () => { this.nl.labels = []; },
      onParentPicked: (proj) => { if (proj) { this.f.project = proj; this.nl.project = null; this.renderProjekt(); } },
      // Details in der Schnelleingabe hat keinen Inline-Log -> öffnet den vollen Editor mit
      // aufgeklapptem Detailbereich (Schnelleingabe bleibt eine reine Ein-Zeilen-Erfassung).
      toggleDetails: () => this.openInFull(true),
      detailsOpen: () => false,
      chipEnabled: () => true,
    };
  }

  private renderChips(): void {
    const bar = this.chipBar; bar.empty();
    const host = this.chipHost();
    const settings = this.plugin.settings;
    for (const id of resolveChipOrder(settings, host.surface)) {
      const c = CHIPS[id];
      const set = c.isSet(this.f, host);
      if (!isInline(settings, host.surface, id, set)) continue;
      if (c.kind === "status") renderStatusChip(bar, host, c);
      else if (c.kind === "details") this.renderDetailsChip(bar);
      else renderValueChip(bar, host, c, set);
    }
    const acts = bar.createEl("button", { cls: "bt-chip bt-chip-actions" + (plusHasSetHidden(host) ? " has-set" : ""), attr: { "aria-label": t("task_actions"), "data-tooltip-position": "top" } });
    setIcon(acts.createSpan({ cls: "bt-chip-ic" }), "plus");
    acts.onclick = (e) => { e.stopPropagation(); this.openPlusMenu(acts); };
  }

  /** Details-Chip: öffnet den vollen Editor mit aufgeklapptem Detailbereich (kein Inline-Log). */
  private renderDetailsChip(bar: HTMLElement): void {
    const chip = bar.createEl("button", { cls: "bt-chip bt-chip-details", attr: { "aria-label": t("details"), "data-tooltip-position": "top" } });
    setIcon(chip.createSpan({ cls: "bt-chip-ic" }), "paperclip");
    chip.createSpan({ cls: "bt-chip-lbl", text: t("details") });
    chip.onclick = (e) => { e.stopPropagation(); this.openInFull(true); };
  }

  /** „+"-Popover (Erstell-Modus, schlank): ausgeblendete Chips + „Aufgabenaktionen bearbeiten". */
  private openPlusMenu(anchor: HTMLElement): void {
    const host = this.chipHost();
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-plus");
      const any = renderPlusChips(pop, host, anchor, close);
      if (any) pop.createDiv({ cls: "bt-plus-sep" });
      popRow(pop, "sliders-horizontal", t("edit_task_actions"), () => { close(); openChipSettings(this.app); });
    });
  }

  // ── Projekt ──
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
      const { bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name: string | null) => { this.f.project = name; this.nl.project = null; this.renderProjekt(); close(); };
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

  // ── Speichern / Brücke ──
  private titleValue(): string { return (this.cleanTitle || this.f.title).trim(); }

  /** Aufgabe anlegen und für die nächste offen bleiben (Multi-Add). Das gewählte Projekt bleibt
   *  erhalten; die Liste im Hintergrund aktualisiert sich über den Index-Listener von selbst. */
  private async submit(): Promise<void> {
    const title = this.titleValue();
    if (!title) { new Notice(t("err_enter_taskname")); return; }
    await createTaskNote(this.app, this.plugin.settings, {
      title, status: this.f.status,
      due: this.f.due, dueTime: this.f.dueTime, duration: this.f.duration,
      scheduled: this.f.scheduled, scheduledTime: this.f.scheduledTime,
      priority: this.f.priority, labels: this.f.labels,
      recurrence: this.f.recurrence, recurBasis: this.f.recurBasis,
      reminders: this.f.reminders, parent: this.f.parent,
      project: this.f.project,
    });
    new Notice(t("qa_added"));
    // Für die nächste Aufgabe zurücksetzen (Projekt beibehalten).
    const project = this.f.project;
    this.f = {
      title: "", project, status: firstOpenStatus(),
      due: null, dueTime: null, duration: null, scheduled: null, scheduledTime: null,
      priority: "normal", labels: [], recurrence: null, recurBasis: "due", reminders: [], parent: null,
    };
    this.cleanTitle = ""; this.duePinned = false; this.nl = emptyQuickEntryState();
    this.input.value = "";
    this.renderChips();
    this.input.focus();
  }

  /** Modal schließen und den vollständigen Stand ins volle TaskModal übergeben: bereinigten Titel
   *  (NL-Token bereits ausgewertet) + alle gesetzten Chips als Seed. openDetails = Detailbereich
   *  (Beschreibung/Kommentare) direkt aufgeklappt (vom Details-Chip ausgelöst). */
  private openInFull(openDetails = false): void {
    // ROHER Titel (inkl. `\wort`/"phrase"-Marker), nicht der bereinigte: der volle Editor parst ihn
    // als Neu-Anlage selbst. Mit dem bereinigten Titel läse er die Auslöserwörter ein zweites Mal –
    // `\heute` wäre dort wieder ein Datum. duePinned reist mit, damit ein per Chip gesetztes Datum
    // nicht doch noch vom Text überschrieben wird.
    const title = this.f.title.trim();
    const project = this.f.project ?? undefined;
    const seed = {
      status: this.f.status, due: this.f.due, dueTime: this.f.dueTime, duration: this.f.duration,
      scheduled: this.f.scheduled, scheduledTime: this.f.scheduledTime, priority: this.f.priority,
      labels: [...this.f.labels], recurrence: this.f.recurrence, recurBasis: this.f.recurBasis,
      reminders: [...this.f.reminders], parent: this.f.parent,
    };
    this.close();
    new TaskModal(this.plugin, undefined, project, { defaultTitle: title, seed, openDetails, duePinned: this.duePinned }).open();
  }
}
