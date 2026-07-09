// Kompaktes Schnell-Erfassungs-Modal (Todoist-Stil): ein Titelfeld mit Natural-Language-Parsing
// und eine interaktive Chip-Leiste (Datum/Priorität/Labels) – leer = Icon-Button zum Setzen,
// gesetzt = Wert + ✕. Ein Projekt-Chip (Default Eingang) sitzt im Fuß, Enter legt an. Nach dem
// Anlegen bleibt das Modal offen (Multi-Add / Brain-Dump) – Esc/× schließt.
// Wiederverwendet bewusst parseQuickEntry (Parser), createTaskNote (Speichern) und die Picker
// aus dem vollen TaskModal, dupliziert also keine Logik. Der ⤢-Button öffnet den vollen Editor.
import { Modal, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority } from "./types";
import { parseQuickEntry } from "./quickEntry";
import { createTaskNote, listProjectsAndAreas, slugify } from "./taskService";
import { t, projectDisplayName } from "./i18n";
import { openPopover, popRow } from "./popover";
import { openDatePicker } from "./datePicker";
import { formatDateTime, combineDT, dateOf, timeOf } from "./format";
import { TaskModal, PRIOS } from "./taskModal";

// Priorität -> Todoist-Kürzel „P1"–„P3" (normal/low = keine Anzeige). Der Quick-Parser vergibt
// nur p1–p4 (highest/high/medium/normal); low/lowest treten hier nicht auf, sind aber typvollständig.
const PRIO_NUM: Record<Priority, number | null> = { highest: 1, high: 2, medium: 3, normal: null, low: null, lowest: null };

export class QuickAddModal extends Modal {
  private f: { title: string; project: string | null; due: string | null; dueTime: string | null; priority: Priority; labels: string[] };
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
    this.f = { title: "", project: this.defaultProject, due: null, dueTime: null, priority: "normal", labels: [] };
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    // Basisklasse teilen -> erbt Titel-/Projekt-/Chip-Styles; .bt-quickadd macht es kompakt.
    modalEl.addClass("bt-task-modal");
    modalEl.addClass("bt-quickadd");
    contentEl.empty();

    const input = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder: t("qa_placeholder") } });
    input.oninput = () => { this.f.title = input.value; this.parse(); this.renderChips(); this.renderProjekt(); };
    input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void this.submit(); } };
    window.setTimeout(() => input.focus(), 0);
    this.input = input;

    // Eine kompakte Zeile (Todoist-Layout, spart vertikalen Platz): links der Projekt-Chip plus die
    // interaktiven Attribut-Chips (Datum/Priorität/Labels), rechts die Aktionen (voller Editor /
    // Absenden). renderProjekt() rührt nur projektBtn an, renderChips() nur chipBar.
    const row = contentEl.createDiv({ cls: "bt-qa-row" });
    this.projektBtn = row.createEl("button", { cls: "bt-projekt" });
    this.projektBtn.onclick = (e) => this.openProject(e.currentTarget as HTMLElement);
    this.chipBar = row.createDiv({ cls: "bt-chips bt-qa-chips" });

    const right = row.createDiv({ cls: "bt-qa-foot-right" });
    // Brücke zum vollen Editor: getippten Text übergeben (für Beschreibung/Details/Wiederholung).
    const full = right.createEl("button", { cls: "bt-qa-icon", attr: { "aria-label": t("qa_open_full"), "data-tooltip-position": "top" } });
    setIcon(full, "maximize-2");
    full.onclick = () => this.openInFull();
    // Absenden (wie Enter): legt an und bleibt offen für die nächste Aufgabe.
    const submit = right.createEl("button", { cls: "mod-cta bt-qa-submit", attr: { "aria-label": t("btn_add_task"), "data-tooltip-position": "top" } });
    setIcon(submit, "arrow-up");
    submit.onclick = () => void this.submit();

    this.parse();
    this.renderChips();
    this.renderProjekt();
  }

  onClose(): void { this.contentEl.empty(); }

  /** Natural-Language aus dem Titel: Datum, Uhrzeit, Priorität, #Labels. Manuell (per Chip)
   *  gesetzte Werte bleiben erhalten: das Datum solange `duePinned`, Labels über den Abgleich
   *  parsedLabels ↔ manuell. Spiegelt die Logik von TaskModal.applyParse. */
  private parse(): void {
    if (!this.plugin.settings.parseNaturalLanguage) { this.cleanTitle = this.f.title; return; }
    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
    const projNames = [eingang, ...bereiche, ...projekte].filter(Boolean).map((p) => (p as { name: string }).name);
    const p = parseQuickEntry(this.f.title, projNames);
    this.cleanTitle = p.title;
    if (!this.duePinned && p.faellig) this.f.due = p.faellig;
    if (!this.duePinned && p.time) this.f.dueTime = p.time;
    if (p.priority) this.f.priority = p.priority;
    // @Projekt: erkannt -> setzen; wieder aus dem Titel entfernt -> zurück zum Default (nur wenn das
    // aktuelle Projekt vom Parser stammt, damit eine manuelle Wahl nicht überschrieben wird).
    if (p.project) { this.f.project = p.project; this.parsedProject = p.project; }
    else if (this.parsedProject && this.f.project === this.parsedProject) { this.f.project = this.defaultProject; this.parsedProject = null; }
    const manual = this.f.labels.filter((l) => !this.parsedLabels.includes(l));
    this.parsedLabels = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
    this.f.labels = [...manual, ...this.parsedLabels];
  }

  // ── Interaktive Chips ──
  /** Ein Chip: gesetzt (label != null) -> Wert + ✕ + Klick öffnet Picker; leer -> nur Icon +
   *  Tooltip, Klick öffnet Picker. Optik/Verhalten wie im vollen Modal (addChip). */
  private addChip(icon: string, label: string | undefined, tooltip: string,
                  onClick: (anchor: HTMLElement) => void, onClear: () => void): void {
    const isSet = label !== undefined;
    const chip = this.chipBar.createEl("button", { cls: "bt-chip" + (isSet ? " is-set" : "") });
    if (!isSet) { chip.setAttribute("aria-label", tooltip); chip.setAttribute("data-tooltip-position", "top"); }
    setIcon(chip.createSpan({ cls: "bt-chip-ic" }), icon);
    if (isSet) chip.createSpan({ cls: "bt-chip-lbl", text: label });
    chip.onclick = (e) => { e.stopPropagation(); onClick(chip); };
    if (isSet) { const x = chip.createSpan({ cls: "bt-chip-x" }); setIcon(x, "x"); x.onclick = (e) => { e.stopPropagation(); onClear(); }; }
  }

  private renderChips(): void {
    this.chipBar.empty();
    this.addChip("calendar", this.f.due ? formatDateTime(combineDT(this.f.due, this.f.dueTime)) : undefined, t("chip_date"),
      (a) => this.openDate(a), () => { this.f.due = null; this.f.dueTime = null; this.duePinned = true; this.renderChips(); });
    const pn = PRIO_NUM[this.f.priority];
    this.addChip("flag", pn ? "P" + pn : undefined, t("chip_priority"),
      (a) => this.openPrio(a), () => { this.f.priority = "normal"; this.renderChips(); });
    this.addChip("hash", this.f.labels.length ? this.f.labels.join(" | ") : undefined, t("chip_label"),
      (a) => this.openLabels(a), () => { this.f.labels = []; this.parsedLabels = []; this.renderChips(); });
  }

  private openDate(anchor: HTMLElement): void {
    const value = this.f.due ? combineDT(this.f.due, this.f.dueTime) : "";
    openDatePicker(anchor, value, (v) => {
      this.f.due = v ? dateOf(v) : null;
      this.f.dueTime = v ? timeOf(v) : null;
      this.duePinned = true;   // ab jetzt nicht mehr aus dem Titel überschreiben
      this.renderChips();
    });
  }

  private openPrio(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      for (const p of PRIOS) {
        popRow(pop, "flag", t(p.key), () => { this.f.priority = p.value; this.renderChips(); close(); }, this.f.priority === p.value, p.color);
      }
    });
  }

  private openLabels(anchor: HTMLElement): void {
    const known = [...new Set([...this.plugin.index.all().flatMap((task) => task.labels), ...this.plugin.settings.knownLabels])];
    openPopover(anchor, (pop) => {
      pop.addClass("bt-tags");
      const add = pop.createEl("input", { type: "text", cls: "bt-tag-add", attr: { placeholder: t("placeholder_label") } });
      const list = pop.createDiv({ cls: "bt-tag-list" });
      const render = () => {
        list.empty();
        const f = add.value.trim().toLowerCase().replace(/^#/, "");
        const all = [...new Set([...known, ...this.f.labels])].sort((a, b) => a.localeCompare(b, "de"));
        for (const tag of all) {
          if (f && !tag.toLowerCase().includes(f)) continue;
          const on = this.f.labels.includes(tag);
          const r = list.createDiv({ cls: "bt-row bt-tag-row" + (on ? " is-active" : "") });
          setIcon(r.createSpan({ cls: "bt-row-ic" }), "hash");
          r.createSpan({ cls: "bt-row-lbl", text: tag });
          const box = r.createSpan({ cls: "bt-tag-box" }); if (on) setIcon(box, "check");
          r.onclick = () => {
            this.f.labels = on ? this.f.labels.filter((x) => x !== tag) : [...this.f.labels, tag];
            this.parsedLabels = this.parsedLabels.filter((x) => x !== tag);   // manuelle Wahl -> nicht mehr „geparst"
            this.renderChips(); render();
          };
        }
      };
      render();
      add.oninput = () => render();
      add.onkeydown = (ev) => {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        const slug = slugify(add.value).toLowerCase().replace(/\s+/g, "-");
        if (!slug) return;
        if (!this.f.labels.includes(slug)) this.f.labels.push(slug);
        this.parsedLabels = this.parsedLabels.filter((x) => x !== slug);
        add.value = ""; this.renderChips(); render();
      };
      window.setTimeout(() => add.focus(), 0);
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
      title, status: "todo",
      due: this.f.due, dueTime: this.f.dueTime,
      priority: this.f.priority, labels: this.f.labels,
      project: this.f.project,
    });
    new Notice(t("qa_added"));
    // Für die nächste Aufgabe zurücksetzen (Projekt beibehalten).
    this.f.title = ""; this.cleanTitle = ""; this.f.due = null; this.f.dueTime = null; this.f.priority = "normal"; this.f.labels = [];
    this.duePinned = false; this.parsedLabels = [];
    this.input.value = "";
    this.renderChips();
    this.input.focus();
  }

  /** Modal schließen und das bereits Getippte ins volle TaskModal übergeben. */
  private openInFull(): void {
    const text = this.f.title;
    const project = this.f.project ?? undefined;
    this.close();
    new TaskModal(this.plugin, undefined, project, { defaultTitle: text }).open();
  }
}
