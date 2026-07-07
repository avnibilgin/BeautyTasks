// Kleines „Neu"-Modal (Variante B) zum Anlegen von Projekt / Bereich / Label direkt aus der
// Seitenleiste: Name + Farbe + Live-Vorschau. Farb-Swatches inline (immer sichtbar), inkl.
// „keine Farbe" und einer „Custom"-Kachel mit nativem Farbwähler.
import { Modal, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { normalizeLabel } from "./taskService";
import { t } from "./i18n";

export type NewItemKind = "project" | "area" | "label";

const COLOR_PRESETS = ["#e05c4a", "#f97316", "#f59e0b", "#4caf50", "#3b82f6", "#7c5cff", "#a855f7", "#ec4899"];
const ICON: Record<NewItemKind, string> = { project: "folder", area: "circle", label: "hash" };
const TITLE: Record<NewItemKind, string> = { project: "new_project_title", area: "new_area_title", label: "new_label_title" };
const PH: Record<NewItemKind, string> = { project: "placeholder_project_name", area: "placeholder_area_name", label: "placeholder_label" };

export class NewItemModal extends Modal {
  private name = "";
  private color: string | null = null;
  private previewIc!: HTMLElement;
  private previewNm!: HTMLElement;

  constructor(private plugin: BeautyTasksPlugin, private kind: NewItemKind) { super(plugin.app); }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-new-modal");
    contentEl.createEl("h3", { text: t(TITLE[this.kind]) });

    // Name
    const nameField = contentEl.createDiv({ cls: "bt-new-field" });
    nameField.createEl("label", { text: t("filter_name") });
    const input = nameField.createEl("input", { cls: "bt-new-input", attr: { type: "text", placeholder: t(PH[this.kind]) } });
    input.oninput = () => { this.name = input.value; this.updatePreview(); };
    input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void this.submit(); } };

    // Farbe (Swatches inline)
    const colorField = contentEl.createDiv({ cls: "bt-new-field" });
    colorField.createEl("label", { text: t("status_pick_color") });
    this.buildSwatches(colorField.createDiv({ cls: "bt-new-swatches" }));

    // Live-Vorschau
    const prev = contentEl.createDiv({ cls: "bt-new-preview" });
    this.previewIc = prev.createSpan({ cls: "bt-new-preview-ic" });
    setIcon(this.previewIc, ICON[this.kind]);
    this.previewNm = prev.createSpan({ cls: "bt-new-preview-nm" });
    prev.createSpan({ cls: "bt-new-preview-hint", text: t("new_preview_hint") });
    this.updatePreview();

    // Fuß (gleiche Buttons wie TaskModal/FilterModal)
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: t("btn_create") }).onclick = () => void this.submit();

    window.setTimeout(() => input.focus(), 0);
  }

  onClose(): void { this.contentEl.empty(); }

  private buildSwatches(row: HTMLElement): void {
    const mark = (el: HTMLElement): void => {
      row.querySelectorAll(".bt-color-cell").forEach((s) => s.removeClass("is-active"));
      el.addClass("is-active");
    };
    const none = row.createEl("button", { cls: "bt-color-cell bt-color-none is-active", attr: { "aria-label": t("status_color_none") } });
    setIcon(none, "ban");
    none.onclick = () => { this.color = null; mark(none); this.updatePreview(); };
    for (const c of COLOR_PRESETS) {
      const b = row.createEl("button", { cls: "bt-color-cell", attr: { "aria-label": c } });
      b.style.setProperty("--bt-swatch", c);
      b.onclick = () => { this.color = c; mark(b); this.updatePreview(); };
    }
    const custom = row.createEl("button", { cls: "bt-color-cell bt-color-custom", attr: { "aria-label": t("color_custom") } });
    setIcon(custom, "pipette");
    const input = custom.createEl("input", { cls: "bt-color-input", attr: { type: "color" } });
    input.oninput = () => {   // NICHT custom.empty() – das würde den Input mitten im Event mitlöschen
      this.color = input.value;
      custom.style.setProperty("--bt-swatch", input.value);   // CSS legt die Farbe hinter die Pipette
      mark(custom);
      this.updatePreview();
    };
  }

  private updatePreview(): void {
    this.previewNm.setText(this.name.trim() || t(PH[this.kind]));
    this.previewIc.style.color = this.color ?? "var(--text-muted)";
  }

  private async submit(): Promise<void> {
    const name = this.name.trim();
    if (!name) { new Notice(t("new_need_name")); return; }
    if (this.kind === "label") {
      const nu = normalizeLabel(name);
      await this.plugin.addLabel(name);            // legt an (oder ist schon da)
      if (nu) {
        await this.plugin.setLabelVisible(nu, true);   // aus dem Anlegen -> gleich sichtbar
        if (this.color) await this.plugin.setLabelColor(nu, this.color);
      }
    } else {
      await this.plugin.createProject(name, this.kind === "area", this.color);
    }
    this.close();
  }
}
