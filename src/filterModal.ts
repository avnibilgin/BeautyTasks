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
import {
  FilterCriteria, ViewOptions, DEFAULT_CRITERIA, DEFAULT_OPTIONS,
  RANGES, SORTS, GROUPS, FILTER_PRIORITIES, applyFilter, activeFacetCount,
} from "./filterEngine";
import { updateFilterNote, readFilter } from "./filterService";

export class FilterModal extends Modal {
  private name: string;
  private c: FilterCriteria;
  private o: ViewOptions;
  private readonly editPath: string | null;
  private countEl!: HTMLElement;

  constructor(private plugin: BeautyTasksPlugin, editPath?: string) {
    super(plugin.app);
    this.editPath = editPath ?? null;
    const existing = editPath ? readFilter(plugin.app, editPath) : null;
    this.name = existing?.name ?? "";
    this.c = { ...DEFAULT_CRITERIA, ...(existing?.criteria ?? {}) };
    this.o = { ...DEFAULT_OPTIONS, ...(existing?.options ?? {}) };
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

    // ── Anordnung (Sortieren/Gruppieren/Erledigte) ──
    contentEl.createEl("h4", { cls: "bt-filter-h", text: t("filter_arrange") });
    new Setting(contentEl).setName(t("filter_sort")).addDropdown((d) => {
      for (const s of SORTS) d.addOption(s, t("filter_sort_" + s));
      d.setValue(this.o.sort).onChange((v) => { this.o.sort = v as ViewOptions["sort"]; this.refresh(); });
    });
    new Setting(contentEl).setName(t("filter_group")).addDropdown((d) => {
      for (const g of GROUPS) d.addOption(g, t("filter_group_" + g));
      d.setValue(this.o.group).onChange((v) => { this.o.group = v as ViewOptions["group"]; this.refresh(); });
    });
    new Setting(contentEl).setName(t("filter_show_done")).addToggle((tg) =>
      tg.setValue(this.o.showDone).onChange((v) => { this.o.showDone = v; this.refresh(); }));

    // ── Filter-Facetten ──
    contentEl.createEl("h4", { cls: "bt-filter-h", text: t("filter_facets") });
    new Setting(contentEl).setName(t("filter_range")).addDropdown((d) => {
      for (const r of RANGES) d.addOption(r, t("filter_range_" + r));
      d.setValue(this.c.range).onChange((v) => { this.c.range = v as FilterCriteria["range"]; this.refresh(); });
    });

    this.facet(contentEl, t("filter_priorities"),
      FILTER_PRIORITIES.map((p) => ({ key: p, label: t(PRIO_KEY[p]) })),
      () => this.c.priorities, (arr) => { this.c.priorities = arr as Priority[]; });

    const labels = this.plugin.getLabels().map((l) => ({ key: l.name, label: l.name }));
    if (labels.length) this.facet(contentEl, t("filter_labels"), labels,
      () => this.c.labels, (arr) => { this.c.labels = arr; });

    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.plugin.app);
    const projOpts = [...(eingang ? [eingang] : []), ...bereiche, ...projekte]
      .map((p) => ({ key: p.name, label: projectDisplayName(p.name) }));
    if (projOpts.length) this.facet(contentEl, t("filter_projects"), projOpts,
      () => this.c.projects, (arr) => { this.c.projects = arr; });

    new Setting(contentEl).setName(t("filter_search")).addText((tx) =>
      tx.setPlaceholder(t("filter_search_ph")).setValue(this.c.search).onChange((v) => { this.c.search = v; this.refresh(); }));

    // ── Fuß: Live-Zähler + Aktionen ──
    this.countEl = contentEl.createDiv({ cls: "bt-filter-count" });
    this.refresh();

    const foot = new Setting(contentEl);
    foot.addButton((b) => b.setButtonText(t("filter_reset")).onClick(() => this.reset()));
    if (this.editPath) foot.addButton((b) => { b.buttonEl.addClass("mod-warning"); b.setButtonText(t("filter_delete")).onClick(() => void this.remove()); });
    foot.addButton((b) => b.setButtonText(t("filter_save")).setCta().onClick(() => void this.save()));
  }

  onClose(): void { this.contentEl.empty(); }

  /** Mehrfachauswahl als kompaktes Dropdown (Button + Popover mit Häkchen). Optisch wie die
   *  Sort/Group/Time-Dropdowns; „Alle" oben leert die Auswahl. ODER innerhalb der Facette. */
  private facet(parent: HTMLElement, label: string, opts: { key: string; label: string }[],
    get: () => string[], set: (arr: string[]) => void): void {
    const btn = new Setting(parent).setName(label).controlEl.createEl("button", { cls: "bt-facet-dd" });
    const lbl = btn.createSpan({ cls: "bt-facet-dd-lbl" });
    setIcon(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
    const summary = (): string => {
      const sel = get();
      if (!sel.length) return t("filter_all");
      if (sel.length <= 2) return sel.map((k) => opts.find((o) => o.key === k)?.label ?? k).join(", ");
      return t("filter_n_selected", sel.length);
    };
    const syncLbl = (): void => lbl.setText(summary());
    syncLbl();

    btn.onclick = () => openPopover(btn, (pop) => {
      pop.addClass("bt-facet-pop");
      const row = (on: boolean, text: string, onClick: () => void): void => {
        const r = pop.createDiv({ cls: "bt-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });   // Slot immer da -> Beschriftungen bündig
        if (on) setIcon(ic, "check");
        r.createSpan({ cls: "bt-row-lbl", text });
        r.onclick = onClick;
      };
      const render = (): void => {
        pop.empty();
        pop.addClass("bt-facet-pop");
        row(get().length === 0, t("filter_all"), () => { set([]); syncLbl(); this.refresh(); render(); });
        for (const o of opts) {
          const on = get().includes(o.key);
          row(on, o.label, () => {
            const cur = get();
            set(cur.includes(o.key) ? cur.filter((x) => x !== o.key) : [...cur, o.key]);
            syncLbl(); this.refresh(); render();
          });
        }
      };
      render();
    });
  }

  private refresh(): void {
    const n = applyFilter(this.plugin.index, this.c, this.o, todayStr()).length;
    const facets = activeFacetCount(this.c);
    this.countEl.setText(t(n === 1 ? "count_task" : "count_tasks", n)
      + (facets ? " · " + t("filter_facets_active", facets) : ""));
  }

  private reset(): void {
    this.c = { ...DEFAULT_CRITERIA };
    this.o = { ...DEFAULT_OPTIONS };
    this.build();   // in-place neu aufbauen; Name bleibt erhalten
  }

  private async save(): Promise<void> {
    const name = this.name.trim();
    if (!name) { new Notice(t("filter_need_name")); return; }
    if (this.editPath) {
      await updateFilterNote(this.app, this.editPath, this.c, this.o);
      this.plugin.renderAll();
    } else {
      await this.plugin.createFilter(name, this.c, this.o);
    }
    this.close();
  }

  private async remove(): Promise<void> {
    if (!this.editPath) return;
    await this.plugin.deleteFilter(this.editPath);
    this.close();
  }
}
