// Kleines „Neu"-Modal (Variante B) zum Anlegen von Projekt / Bereich / Label direkt aus der
// Seitenleiste: Name + Farbe + Live-Vorschau. Farb-Swatches inline (immer sichtbar), inkl.
// „keine Farbe" und einer „Custom"-Kachel mit nativem Farbwähler.
import { Modal, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { normalizeLabel } from "./taskService";
import { buildSwatchRow } from "./colorSwatches";
import { t } from "./i18n";

export type NewItemKind = "project" | "area" | "label";

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
    buildSwatchRow(colorField.createDiv(), this.color, (c) => { this.color = c; this.updatePreview(); });

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
