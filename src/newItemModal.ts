// „Neu/Bearbeiten"-Modal für Projekt / Bereich / Label: Name + Farbe + Sichtbarkeits-Schalter
// + Live-Vorschau. Ohne editRef = Anlegen (Schalter Default AN); mit editRef = Bearbeiten
// (Name/Farbe/Sichtbarkeit ändern). Farb-Swatches inline (siehe colorSwatches).
import { Modal, Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { normalizeLabel } from "./taskService";
import { buildSwatchRow } from "./colorSwatches";
import { ConfirmModal } from "./confirmModal";
import { t } from "./i18n";

export type NewItemKind = "project" | "area" | "label";
/** Referenz auf einen bestehenden Eintrag (Bearbeiten). key = Notiz-Pfad (Projekt/Bereich) bzw. Label-Name. */
export interface EditRef { key: string; name: string; color: string | null; visible: boolean; }

const ICON: Record<NewItemKind, string> = { project: "folder", area: "circle", label: "hash" };
const TITLE: Record<NewItemKind, string> = { project: "new_project_title", area: "new_area_title", label: "new_label_title" };
const EDIT_TITLE: Record<NewItemKind, string> = { project: "edit_project_title", area: "edit_area_title", label: "edit_label_title" };
const PH: Record<NewItemKind, string> = { project: "placeholder_project_name", area: "placeholder_area_name", label: "placeholder_label" };

export class NewItemModal extends Modal {
  private name: string;
  private color: string | null;
  private visible: boolean;
  private syncExcluded = false;              // aktueller Stand des Sync-Toggles
  private syncExcludedInit: boolean | null = null;   // Ausgangswert; null = Toggle nicht gezeigt
  private previewIc!: HTMLElement;
  private previewNm!: HTMLElement;

  constructor(private plugin: BeautyTasksPlugin, private kind: NewItemKind, private edit?: EditRef) {
    super(plugin.app);
    this.name = edit?.name ?? "";
    this.color = edit?.color ?? null;
    this.visible = edit ? edit.visible : true;   // beim Anlegen standardmäßig sichtbar
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-new-modal");
    contentEl.createEl("h3", { text: t((this.edit ? EDIT_TITLE : TITLE)[this.kind]) });

    // Name
    const nameField = contentEl.createDiv({ cls: "bt-new-field" });
    nameField.createEl("label", { text: t("filter_name") });
    const input = nameField.createEl("input", { cls: "bt-new-input", attr: { type: "text", placeholder: t(PH[this.kind]) } });
    input.value = this.name;
    input.oninput = () => { this.name = input.value; this.updatePreview(); };
    input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void this.submit(); } };

    // Farbe (Swatches inline)
    const colorField = contentEl.createDiv({ cls: "bt-new-field" });
    colorField.createEl("label", { text: t("status_pick_color") });
    buildSwatchRow(colorField.createDiv({ cls: "bt-color-box" }), this.color, (c) => { this.color = c; this.updatePreview(); });

    // Sichtbarkeit in der Seitenleiste (Schalter)
    const visRow = contentEl.createDiv({ cls: "bt-new-row" });
    visRow.createEl("label", { text: t("show_in_sidebar") });
    const sw = visRow.createDiv({ cls: "bt-mrow-switch" + (this.visible ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(this.visible), tabindex: "0" } });
    const flip = () => { this.visible = !this.visible; sw.toggleClass("is-on", this.visible); sw.setAttr("aria-checked", String(this.visible)); };
    sw.onclick = flip;
    sw.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip(); } };

    // Google-Kalender-Sync für diese Liste – nur beim Bearbeiten eines Projekts/Bereichs UND nur
    // wenn der Sync aktiv ist (konsistent mit canSync(), wie die anderen Sync-Bedienelemente).
    // Wird wie die übrigen Felder ERST beim Speichern angewendet (Abbrechen verwirft).
    if (this.edit && this.kind !== "label" && this.plugin.gcalSync.canSync()) {
      this.syncExcludedInit = this.plugin.isListGcalExcluded(this.edit.key);
      this.syncExcluded = this.syncExcludedInit;
      const on = (): boolean => !this.syncExcluded;
      const syncRow = contentEl.createDiv({ cls: "bt-new-row" });
      syncRow.createEl("label", { text: t("gcal_sync_list") });
      const sw2 = syncRow.createDiv({ cls: "bt-mrow-switch" + (on() ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(on()), tabindex: "0" } });
      const flip2 = (): void => { this.syncExcluded = !this.syncExcluded; sw2.toggleClass("is-on", on()); sw2.setAttr("aria-checked", String(on())); };
      sw2.onclick = flip2;
      sw2.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); flip2(); } };
    }

    // Live-Vorschau
    const prev = contentEl.createDiv({ cls: "bt-new-preview" });
    this.previewIc = prev.createSpan({ cls: "bt-new-preview-ic" });
    setIcon(this.previewIc, ICON[this.kind]);
    this.previewNm = prev.createSpan({ cls: "bt-new-preview-nm" });
    prev.createSpan({ cls: "bt-new-preview-hint", text: t("new_preview_hint") });
    this.updatePreview();

    // Fuß: links destruktiv (nur im Bearbeiten-Modus), rechts Abbrechen/Speichern (Layout A).
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    const danger = foot.createDiv({ cls: "bt-actions" });
    if (this.edit) {
      if (this.kind !== "label") danger.createEl("button", { text: t("btn_archive") }).onclick = () => {
        this.plugin.archiveWithUndo(this.edit!.key, this.edit!.name);
        this.close();
      };
      danger.createEl("button", { cls: "mod-warning", text: t("btn_delete") }).onclick = () => this.confirmDelete();
    }
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: t(this.edit ? "btn_save" : "btn_create") }).onclick = () => void this.submit();

    window.setTimeout(() => { input.focus(); input.select(); }, 0);
  }

  onClose(): void { this.contentEl.empty(); }

  private updatePreview(): void {
    this.previewNm.setText(this.name.trim() || t(PH[this.kind]));
    this.previewIc.style.color = this.color ?? "var(--text-muted)";
  }

  /** Löschen mit Sicherheitsabfrage (nur im Bearbeiten-Modus). */
  private confirmDelete(): void {
    const e = this.edit!;
    new ConfirmModal(this.app,
      { title: t("confirm_delete_title", e.name), message: t("confirm_delete_body") },
      () => {
        if (this.kind === "label") void this.plugin.deleteLabel(e.key);
        else void this.plugin.deleteProject(e.key);
        this.close();
      }).open();
  }

  private async submit(): Promise<void> {
    const name = this.name.trim();
    if (!name) { new Notice(t("new_need_name")); return; }
    if (this.edit) await this.applyEdit(name); else await this.applyNew(name);
    this.close();
  }

  /** Anlegen: Notiz/Label erstellen, Farbe + Sichtbarkeit setzen. */
  private async applyNew(name: string): Promise<void> {
    if (this.kind === "label") {
      const nu = normalizeLabel(name);
      await this.plugin.addLabel(name);
      if (nu) {
        if (this.visible) await this.plugin.setLabelVisible(nu, true);   // Labels sind sonst Default-versteckt
        if (this.color) await this.plugin.setLabelColor(nu, this.color);
      }
    } else {
      await this.plugin.createProject(name, this.kind === "area", this.color, !this.visible);
    }
  }

  /** Bearbeiten: Farbe & Sichtbarkeit anwenden, ZULETZT umbenennen (Rename zieht Farbe/Sichtbarkeit mit). */
  private async applyEdit(name: string): Promise<void> {
    const e = this.edit!;
    if (this.kind === "label") {
      if (this.color !== e.color) await this.plugin.setLabelColor(e.key, this.color);
      if (this.visible !== e.visible) await this.plugin.setLabelVisible(e.key, this.visible);
      if (name !== e.name) await this.plugin.renameLabel(e.key, name);
    } else {
      if (this.color !== e.color) await this.plugin.setProjectColor(e.key, this.color);
      if (this.visible !== e.visible) await this.plugin.setProjectVisible(e.key, this.visible);
      if (this.syncExcludedInit !== null && this.syncExcluded !== this.syncExcludedInit) await this.plugin.setListGcalExcluded(e.key, this.syncExcluded);
      if (name !== e.name) await this.plugin.renameProject(e.key, name);
    }
  }
}
