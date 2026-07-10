// Kompaktes Schnell-Erfassungs-Modal (Todoist-Stil): ein Titelfeld mit Natural-Language-Parsing
// und eine interaktive Chip-Leiste. Die Chips kommen – wie im vollen Editor – aus der gemeinsamen
// Registry (chips.ts): volle Chip-Parität (hier stets als Nur-Icon, kompakt). Beschreibung und
// Kommentar-Log (Details-Chip) teilen sich Feld/Komponente mit dem vollen Editor. Ein „+" bündelt
// ausgeblendete Chips + „Aufgabenaktionen bearbeiten". Nach dem Anlegen bleibt das Modal offen
// (Multi-Add / Brain-Dump). Der ⤢-Button öffnet den vollen Editor mit allem Übernommenen.
import { Modal, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority, TaskStatus } from "./types";
import { parseQuickEntry } from "./quickEntry";
import { createTaskNote, listProjectsAndAreas } from "./taskService";
import { t, projectDisplayName } from "./i18n";
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
  private parsedLabels: string[] = []; // aus dem Titel erkannte Labels (zum Trennen von manuellen)
  private parsedProject: string | null = null; // aus dem Titel erkanntes @Projekt (zum Zurücksetzen)
  private readonly defaultProject: string;      // Projekt-Fallback, wenn @Projekt wieder entfernt wird
  private input!: HTMLInputElement;
  private chipBar!: HTMLElement;
  private projektBtn!: HTMLButtonElement;

  constructor(private plugin: BeautyTasksPlugin, project?: string) {
    super(plugin.app);
    this.defaultProject = project ?? "Inbox";
    this.f = {
      title: "", project: this.defaultProject, status: firstOpenStatus(),
      due: null, dueTime: null, duration: null, scheduled: null, scheduledTime: null,
      priority: "normal", labels: [], recurrence: null, recurBasis: "due", reminders: [], parent: null,
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
    if (!this.plugin.settings.parseNaturalLanguage) { this.cleanTitle = this.f.title; return; }
    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
    const projNames = [eingang, ...bereiche, ...projekte].filter(Boolean).map((p) => (p as { name: string }).name);
    const p = parseQuickEntry(this.f.title, projNames);
    this.cleanTitle = p.title;
    if (!this.duePinned && p.faellig) this.f.due = p.faellig;
    if (!this.duePinned && p.time) this.f.dueTime = p.time;
    if (p.priority) this.f.priority = p.priority;
    if (p.project) { this.f.project = p.project; this.parsedProject = p.project; }
    else if (this.parsedProject && this.f.project === this.parsedProject) { this.f.project = this.defaultProject; this.parsedProject = null; }
    const manual = this.f.labels.filter((l) => !this.parsedLabels.includes(l));
    this.parsedLabels = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
    this.f.labels = [...manual, ...this.parsedLabels];
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
      pinDue: () => { this.duePinned = true; },
      resetParsedLabels: () => { this.parsedLabels = []; },
      onParentPicked: (proj) => { if (proj) { this.f.project = proj; this.parsedProject = null; this.renderProjekt(); } },
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
      const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name: string) => { this.f.project = name; this.parsedProject = null; this.renderProjekt(); close(); };
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
    this.cleanTitle = ""; this.duePinned = false; this.parsedLabels = []; this.parsedProject = null;
    this.input.value = "";
    this.renderChips();
    this.input.focus();
  }

  /** Modal schließen und den vollständigen Stand ins volle TaskModal übergeben: bereinigten Titel
   *  (NL-Token bereits ausgewertet) + alle gesetzten Chips als Seed. openDetails = Detailbereich
   *  (Beschreibung/Kommentare) direkt aufgeklappt (vom Details-Chip ausgelöst). */
  private openInFull(openDetails = false): void {
    const title = this.titleValue();
    const project = this.f.project ?? undefined;
    const seed = {
      status: this.f.status, due: this.f.due, dueTime: this.f.dueTime, duration: this.f.duration,
      scheduled: this.f.scheduled, scheduledTime: this.f.scheduledTime, priority: this.f.priority,
      labels: [...this.f.labels], recurrence: this.f.recurrence, recurBasis: this.f.recurBasis,
      reminders: [...this.f.reminders], parent: this.f.parent,
    };
    this.close();
    new TaskModal(this.plugin, undefined, project, { defaultTitle: title, seed, openDetails }).open();
  }
}
