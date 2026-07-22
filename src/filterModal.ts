// Editor für einen gespeicherten Filter (Vorschlag 3 „Smart List"). Bearbeitet EINE
// Kopie aus FilterCriteria + ViewOptions und zeigt live die Trefferzahl. Anlegen = neue
// type:filter-Notiz, Bearbeiten = bestehende aktualisieren. Facetten sind implizit UND;
// mehrere Werte je Facette ODER (kein Bool-Operator im UI, bewusste Vereinfachung).
import { Modal, Setting, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority } from "./types";
import { todayStr } from "./format";
import { listProjectsAndAreas } from "./taskService";
import { openPopover } from "./popover";
import { projectDisplayName, t } from "./i18n";
import { PRIO_KEY } from "./taskModal";
import { allStatuses, statusLabel } from "./statuses";
import {
  FilterCriteria, ViewOptions, MatchMode, DEFAULT_CRITERIA, DEFAULT_OPTIONS,
  RANGES, FILTER_PRIORITIES, SUBTASK_FILTERS, SubtaskFilter, applyFilter, activeFacetCount,
} from "./filterEngine";
import { readFilter } from "./filterService";
import { buildSwatchRow } from "./colorSwatches";
import { ConfirmModal } from "./confirmModal";

export class FilterModal extends Modal {
  private name: string;
  private readonly origName: string;
  private c: FilterCriteria;
  private o: ViewOptions;
  private color: string | null;
  private visible: boolean;
  private readonly wasVisible: boolean;
  private readonly editPath: string | null;
  private countEl!: HTMLElement;

  constructor(private plugin: BeautyTasksPlugin, editPath?: string) {
    super(plugin.app);
    this.editPath = editPath ?? null;
    const existing = editPath ? readFilter(plugin.app, editPath) : null;
    this.name = existing?.name ?? "";
    this.origName = this.name;
    this.c = { ...DEFAULT_CRITERIA, ...(existing?.criteria ?? {}) };
    this.o = { ...DEFAULT_OPTIONS, ...(existing?.options ?? {}) };
    this.color = existing?.color ?? null;
    this.visible = existing ? !existing.hidden : true;   // neuer Filter: standardmäßig sichtbar
    this.wasVisible = this.visible;
  }

  onOpen(): void {
    this.modalEl.addClass("bt-filter-modal");
    this.build();
  }

  private build(): void {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.editPath ? t("filter_edit") : t("filter_new") });

    new Setting(contentEl).setName(t("filter_name")).addText((tx) =>
      tx.setPlaceholder(t("filter_name_ph")).setValue(this.name).onChange((v) => { this.name = v; }));

    // Farbe direkt unter dem Namen (gleiche Swatch-Reihe wie im Neu-Modal).
    const colorField = contentEl.createDiv({ cls: "bt-new-field bt-filter-color" });
    colorField.createEl("label", { text: t("status_pick_color") });
    buildSwatchRow(colorField.createDiv({ cls: "bt-color-box" }), this.color, (c) => { this.color = c; });

    // Sichtbarkeit in der Seitenleiste (Schalter, wie im Neu/Bearbeiten-Modal).
    const visRow = contentEl.createDiv({ cls: "bt-new-row" });
    visRow.createEl("label", { text: t("show_in_sidebar") });
    const sw = visRow.createDiv({ cls: "bt-mrow-switch" + (this.visible ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(this.visible), tabindex: "0" } });
    const flip = (): void => { this.visible = !this.visible; sw.toggleClass("is-on", this.visible); sw.setAttr("aria-checked", String(this.visible)); };
    sw.onclick = flip;
    sw.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } };

    // Anordnung (Sortieren/Gruppieren/Erledigte/Layout) lebt im „Anzeige"-Panel der Seite –
    // der Editor beschreibt nur, WELCHE Aufgaben zum Filter gehören (Kriterien).

    // ── Filter-Facetten ──
    contentEl.createEl("h4", { cls: "bt-filter-h", text: t("filter_facets") });
    this.select(contentEl, t("filter_range"),
      RANGES.map((r) => ({ key: r, label: t("filter_range_" + r) })),
      () => this.c.range, (v) => { this.c.range = v as FilterCriteria["range"]; this.refresh(); });

    // Deadline hat dieselben Stufen wie die Faelligkeit, aber ein eigenes Feld: „Deadline diese
    // Woche" ist eine andere Frage als „faellig diese Woche".
    this.select(contentEl, t("filter_deadline_range"),
      RANGES.map((r) => ({ key: r, label: t("filter_range_" + r) })),
      () => this.c.deadlineRange, (v) => { this.c.deadlineRange = v as FilterCriteria["deadlineRange"]; this.refresh(); });

    // Status: einwertig wie Priorität, also nur ✓ und − (kein „alle"). Nimmt ALLE Status – auch
    // erledigte und abgebrochene –, denn genau das macht diese Facette möglich: eine Ansicht auf
    // „was ist gerade in Arbeit", „was habe ich abgebrochen" oder einen selbst angelegten Status.
    this.facet(contentEl, t("filter_statuses"),
      allStatuses().map((s) => ({ key: s.id, label: statusLabel(s.id) })), {
        modeOf: (k) => this.c.statusesNot.includes(k) ? "none" : this.c.statuses.includes(k) ? "any" : null,
        toggle: (k, pen) => {
          const was = this.c.statusesNot.includes(k) ? "none" : this.c.statuses.includes(k) ? "any" : null;
          this.c.statuses = this.c.statuses.filter((x) => x !== k);
          this.c.statusesNot = this.c.statusesNot.filter((x) => x !== k);
          if (was !== pen) (pen === "none" ? this.c.statusesNot : this.c.statuses).push(k);
        },
        clear: () => { this.c.statuses = []; this.c.statusesNot = []; },
        pens: ["any", "none"],
      });

    this.facet(contentEl, t("filter_priorities"),
      FILTER_PRIORITIES.map((p) => ({ key: p, label: t(PRIO_KEY[p]) })), {
        modeOf: (k) => this.c.prioritiesNot.includes(k as Priority) ? "none" : this.c.priorities.includes(k as Priority) ? "any" : null,
        toggle: (k, pen) => {
          const p = k as Priority;
          const was = this.c.prioritiesNot.includes(p) ? "none" : this.c.priorities.includes(p) ? "any" : null;
          this.c.priorities = this.c.priorities.filter((x) => x !== p);
          this.c.prioritiesNot = this.c.prioritiesNot.filter((x) => x !== p);
          if (was !== pen) (pen === "none" ? this.c.prioritiesNot : this.c.priorities).push(p);
        },
        clear: () => { this.c.priorities = []; this.c.prioritiesNot = []; },
        pens: ["any", "none"],
      });

    const labels = this.plugin.getLabels().map((l) => ({ key: l.name, label: l.name }));
    if (labels.length) this.facet(contentEl, t("filter_labels"), labels, {
      modeOf: (k) => this.c.labelsNot.includes(k) ? "none" : this.c.labelsAll.includes(k) ? "all" : this.c.labels.includes(k) ? "any" : null,
      toggle: (k, pen) => {
        const was = this.c.labelsNot.includes(k) ? "none" : this.c.labelsAll.includes(k) ? "all" : this.c.labels.includes(k) ? "any" : null;
        this.c.labels = this.c.labels.filter((x) => x !== k);
        this.c.labelsAll = this.c.labelsAll.filter((x) => x !== k);
        this.c.labelsNot = this.c.labelsNot.filter((x) => x !== k);
        if (was !== pen) (pen === "all" ? this.c.labelsAll : pen === "none" ? this.c.labelsNot : this.c.labels).push(k);
      },
      clear: () => { this.c.labels = []; this.c.labelsAll = []; this.c.labelsNot = []; },
      pens: ["any", "all", "none"],
    });

    const { bereiche, projekte } = listProjectsAndAreas(this.plugin.app);
    // Eingang = eingebaute Option (Key „Inbox"; die Engine matcht ihn via isInboxName).
    const projOpts = [{ key: "Inbox", label: t("nav_inbox") },
      ...[...bereiche, ...projekte].map((p) => ({ key: p.name, label: projectDisplayName(p.name) }))];
    if (projOpts.length) this.facet(contentEl, t("filter_projects"), projOpts, {
      modeOf: (k) => this.c.projectsNot.includes(k) ? "none" : this.c.projects.includes(k) ? "any" : null,
      toggle: (k, pen) => {
        const was = this.c.projectsNot.includes(k) ? "none" : this.c.projects.includes(k) ? "any" : null;
        this.c.projects = this.c.projects.filter((x) => x !== k);
        this.c.projectsNot = this.c.projectsNot.filter((x) => x !== k);
        if (was !== pen) (pen === "none" ? this.c.projectsNot : this.c.projects).push(k);
      },
      clear: () => { this.c.projects = []; this.c.projectsNot = []; },
      pens: ["any", "none"],
    });

    // Unteraufgaben: dieselbe Frage, die Todoist mit subtask / !subtask beantwortet.
    this.select(contentEl, t("filter_subtasks"),
      SUBTASK_FILTERS.map((v) => ({ key: v, label: t("filter_subtasks_" + v) })),
      () => this.c.subtaskMode, (v) => { this.c.subtaskMode = v as SubtaskFilter; this.refresh(); });

    new Setting(contentEl).setName(t("filter_search")).addText((tx) =>
      tx.setPlaceholder(t("filter_search_ph")).setValue(this.c.search).onChange((v) => { this.c.search = v; this.refresh(); }));

    // ── Fuß: Live-Zähler + Aktionen (gleiche Struktur/Buttons wie das TaskModal) ──
    this.countEl = contentEl.createDiv({ cls: "bt-filter-count" });
    this.refresh();

    // Fuß: links destruktiv (Löschen, nur beim Bearbeiten), rechts Zurücksetzen/Speichern (Layout A).
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    const danger = foot.createDiv({ cls: "bt-actions" });
    if (this.editPath) danger.createEl("button", { cls: "mod-warning", text: t("filter_delete") }).onclick = () =>
      new ConfirmModal(this.app, { title: t("confirm_delete_title", this.name || t("nav_filters")), message: t("confirm_delete_body") }, () => void this.remove()).open();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("filter_reset") }).onclick = () => this.reset();
    actions.createEl("button", { cls: "mod-cta", text: t("filter_save") }).onclick = () => void this.save();
  }

  onClose(): void { this.contentEl.empty(); }

  /** Mehrfachauswahl mit PRO-WERT-Marker. Der Modus oben (eines/alle/keines) ist nur der „Stift":
   *  Ein Klick auf einen Wert setzt/entfernt ihn im aktuellen Stift; jeder Wert behält seinen Marker
   *  (✓ = eines/ODER · + = alle/UND · − = keines/NICHT), auch wenn der Stift gewechselt wird. */
  private facet(parent: HTMLElement, label: string, opts: { key: string; label: string }[], ctl: {
    modeOf: (k: string) => MatchMode | null;   // aktueller Marker eines Werts, null = nicht gewählt
    toggle: (k: string, pen: MatchMode) => void;
    clear: () => void;
    pens: MatchMode[];
  }): void {
    const btn = new Setting(parent).setName(label).controlEl.createEl("button", { cls: "bt-facet-dd" });
    const lbl = btn.createSpan({ cls: "bt-facet-dd-lbl" });
    setIcon(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
    const iconOf = (m: MatchMode): string => (m === "all" ? "plus" : m === "none" ? "minus" : "check");
    const syncLbl = (): void => {   // Zusammenfassung: „N Kriterien gewählt" (Gesamtzahl)
      const n = opts.filter((o) => ctl.modeOf(o.key)).length;
      lbl.setText(n ? t("filter_n_criteria", n) : t("filter_all"));
    };
    syncLbl();

    let pen: MatchMode = ctl.pens[0];   // Standard-Stift = „eines"
    btn.onclick = () => openPopover(btn, (pop) => {
      pop.addClass("bt-facet-pop");
      const render = (): void => {
        pop.empty();
        pop.addClass("bt-facet-pop");
        if (ctl.pens.length > 1) {   // Stift-Segment oben – wechselt nur den Stift, ändert keine Auswahl
          pop.addClass("bt-mode-pop");
          pop.createDiv({ cls: "bt-mode-lead", text: t("filter_mode_lead") });
          const seg = pop.createDiv({ cls: "bt-mode-seg" });
          for (const m of ctl.pens) {
            const opt = seg.createSpan({ cls: "bt-mode-opt" + (pen === m ? " is-on" : ""), text: t("filter_mode_" + m) });
            opt.onclick = () => { pen = m; render(); };
          }
          pop.createDiv({ cls: "bt-mode-sentence", text: t("filter_mode_s_" + pen) });   // beschreibt den aktiven Stift
        }
        const rowEl = (active: boolean, icon: string | null, text: string, onClick: () => void): void => {
          const r = pop.createDiv({ cls: "bt-row" + (active ? " is-active" : "") });
          const ic = r.createSpan({ cls: "bt-row-ic" });   // Slot immer da -> Beschriftungen bündig
          if (icon) setIcon(ic, icon);
          r.createSpan({ cls: "bt-row-lbl", text });
          r.onclick = onClick;
        };
        const empty = !opts.some((o) => ctl.modeOf(o.key));
        rowEl(empty, empty ? "check" : null, t("filter_all"), () => { ctl.clear(); syncLbl(); this.refresh(); render(); });
        for (const o of opts) {
          const m = ctl.modeOf(o.key);
          rowEl(!!m, m ? iconOf(m) : null, o.label, () => { ctl.toggle(o.key, pen); syncLbl(); this.refresh(); render(); });
        }
      };
      render();
    });
  }

  /** Einfachauswahl als kompaktes Dropdown (Button + Popover mit Häkchen) – optisch identisch
   *  zu den Mehrfach-Facetten, aber genau EIN Wert; Klick wählt und schließt. */
  private select(parent: HTMLElement, label: string, opts: { key: string; label: string }[],
    get: () => string, set: (v: string) => void): void {
    const btn = new Setting(parent).setName(label).controlEl.createEl("button", { cls: "bt-facet-dd" });
    const lbl = btn.createSpan({ cls: "bt-facet-dd-lbl" });
    setIcon(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
    const syncLbl = (): void => lbl.setText(opts.find((o) => o.key === get())?.label ?? "");
    syncLbl();

    btn.onclick = () => openPopover(btn, (pop, close) => {
      pop.addClass("bt-facet-pop");
      for (const o of opts) {
        const on = get() === o.key;
        const r = pop.createDiv({ cls: "bt-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });
        if (on) setIcon(ic, "check");
        r.createSpan({ cls: "bt-row-lbl", text: o.label });
        r.onclick = () => { set(o.key); syncLbl(); this.refresh(); close(); };
      }
    });
  }

  private refresh(): void {
    const n = applyFilter(this.plugin.index, this.c, this.o, todayStr()).length;
    const facets = activeFacetCount(this.c);
    this.countEl.setText(t(n === 1 ? "count_task" : "count_tasks", n)
      + (facets ? " · " + t("filter_facets_active", facets) : ""));
  }

  private reset(): void {
    this.c = { ...DEFAULT_CRITERIA };   // nur Kriterien + Farbe; die Anordnung (this.o) bleibt, sie gehört ins Anzeige-Panel
    this.color = null;
    this.build();   // in-place neu aufbauen; Name bleibt erhalten
  }

  private async save(): Promise<void> {
    const name = this.name.trim();
    if (!name) { new Notice(t("filter_need_name")); return; }
    if (this.editPath) {
      // Name = Dateiname → bei Änderung erst umbenennen (liefert neuen Basenamen), dann auf
      // den neuen Pfad schreiben. Kollision (null) bricht ab, damit nichts halb gespeichert wird.
      let path = this.editPath;
      if (name !== this.origName) {
        const base = await this.plugin.renameFilter(this.editPath, name);
        if (base === null) { new Notice(t("filter_name_taken")); return; }
        const slash = this.editPath.lastIndexOf("/");
        path = (slash >= 0 ? this.editPath.slice(0, slash + 1) : "") + base + ".md";
      }
      await this.plugin.updateFilter(path, this.c, this.o, this.color);
      if (this.visible !== this.wasVisible) await this.plugin.setFilterVisible(path, this.visible);
    } else {
      await this.plugin.createFilter(name, this.c, this.o, this.color, !this.visible);
    }
    this.close();
  }

  private async remove(): Promise<void> {
    if (!this.editPath) return;
    await this.plugin.deleteFilter(this.editPath);
    this.close();
  }
}
