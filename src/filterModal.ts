// Editor für einen gespeicherten Filter (Vorschlag 3 „Smart List"). Bearbeitet EINE
// Kopie aus FilterCriteria + ViewOptions und zeigt live die Trefferzahl. Anlegen = neue
// type:filter-Notiz, Bearbeiten = bestehende aktualisieren. Facetten sind implizit UND;
// mehrere Werte je Facette ODER (kein Bool-Operator im UI, bewusste Vereinfachung).
import { Modal, Notice } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { todayStr } from "./format";
import { EditFocus } from "./newItemModal";
import { t } from "./i18n";
import {
  FilterCriteria, ViewOptions, DEFAULT_CRITERIA, DEFAULT_OPTIONS, ALL_FACETS, applyFilter, activeFacetCount,
} from "./filterEngine";
import { MODAL_STYLE, buildFacets, renderFacet, fieldRow } from "./facets";
import { readFilter } from "./filterService";
import { buildSwatchRow } from "./colorSwatches";
import { ConfirmModal } from "./confirmModal";

/** Eine Zeile des Filter-Modals: Beschriftung links, Bedienelement rechts (s. facets.fieldRow). */
const filterRow = (parent: HTMLElement, label: string): HTMLElement => fieldRow(parent, label, MODAL_STYLE);

export class FilterModal extends Modal {
  private name: string;
  private readonly origName: string;
  private c: FilterCriteria;
  private o: ViewOptions;
  private color: string | null;
  private description: string;
  private visible: boolean;
  private readonly wasVisible: boolean;
  private readonly editPath: string | null;
  private countEl!: HTMLElement;

  /** `preset` = Vorbelegung für einen NEUEN Filter: „Als Filter speichern" im Anzeige-Panel
   *  reicht damit den Ansichtsfilter der Seite herein (s. viewPanel.presetFor). Beim Bearbeiten
   *  gewinnt die Notiz – dort ist nichts vorzubelegen. */
  constructor(private plugin: BeautyTasksPlugin, editPath?: string, preset?: FilterCriteria, private focusField: EditFocus = "name") {
    super(plugin.app);
    this.editPath = editPath ?? null;
    const existing = editPath ? readFilter(plugin.app, editPath) : null;
    this.name = existing?.name ?? "";
    this.origName = this.name;
    this.c = { ...DEFAULT_CRITERIA, ...(existing?.criteria ?? preset ?? {}) };
    this.o = { ...DEFAULT_OPTIONS, ...(existing?.options ?? {}) };
    this.color = existing?.color ?? null;
    this.description = existing?.description ?? "";
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

    const nameIn = filterRow(contentEl, t("filter_name")).createEl("input", { type: "text", cls: "bt-filter-input" });
    nameIn.placeholder = t("filter_name_ph");
    nameIn.value = this.name;
    nameIn.oninput = () => { this.name = nameIn.value; };

    // Beschreibung: kurzer Text im Frontmatter der Filternotiz, erscheint über der Aufgabenliste.
    const descIn = filterRow(contentEl, t("new_description")).createEl("textarea", { cls: "bt-filter-input bt-new-desc", attr: { rows: "2" } });
    // Aus der Beschreibungszeile der Seite: Cursor direkt hierher, ans Ende des Textes. Dieser
    // Dialog fokussiert sonst gar nichts – ohne das müsste man erst hineinklicken.
    if (this.focusField === "description") {
      window.setTimeout(() => { descIn.focus(); descIn.setSelectionRange(descIn.value.length, descIn.value.length); }, 0);
    }
    descIn.placeholder = t("new_description_ph");
    descIn.value = this.description;
    descIn.oninput = () => { this.description = descIn.value; };

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
    // Die Definitionen (welche Werte, wie sie in die Kriterien schreiben) liegen in facets.ts –
    // dieselben, die der Filter-Abschnitt des Anzeige-Panels zeichnet. Der Editor zeigt ALLE
    // Facetten und die volle Status-Liste (statusScope „all"): „zeig mir alles Abgebrochene" ist
    // hier eine sinnvolle Frage, im Panel dagegen kollidierte sie mit „Erledigte anzeigen".
    // Zwei Klassen mit Absicht: `bt-modal-h` ist die gemeinsame Gestalt (auch der Anwenden-Dialog
    // der Vorlagen benutzt sie), `bt-filter-h` ist der ALTE Name. Er steckt in jeder
    // veroeffentlichten Fassung seit 1.40.0, und CSS-Klassen eines Plugins sind eine Flaeche,
    // an der fremde Snippets und Themes haengen koennen. Ihn wegzunehmen braeche sie lautlos –
    // fuer nichts als einen schoeneren Namen. Er bleibt deshalb stehen, obwohl unser Stylesheet
    // ihn nicht mehr anspricht.
    contentEl.createEl("h4", { cls: "bt-modal-h bt-filter-h", text: t("filter_facets") });
    for (const f of buildFacets(this.plugin, ALL_FACETS, () => this.c, (patch) => { this.c = { ...this.c, ...patch }; })) {
      renderFacet(contentEl, f, MODAL_STYLE, () => this.refresh());
    }

    const searchIn = filterRow(contentEl, t("filter_search")).createEl("input", { type: "text", cls: "bt-filter-input" });
    searchIn.placeholder = t("filter_search_ph");
    searchIn.value = this.c.search;
    searchIn.oninput = () => { this.c.search = searchIn.value; this.refresh(); };

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
      await this.plugin.setProjectDescription(path, this.description);   // gleiches Frontmatter-Feld
      if (this.visible !== this.wasVisible) await this.plugin.setFilterVisible(path, this.visible);
    } else {
      await this.plugin.createFilter(name, this.c, this.o, this.color, !this.visible, this.description);
    }
    this.close();
  }

  private async remove(): Promise<void> {
    if (!this.editPath) return;
    await this.plugin.deleteFilter(this.editPath);
    this.close();
  }
}
