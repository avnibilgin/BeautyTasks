// Kleine wiederverwendbare Sicherheitsabfrage (z. B. vor dem Löschen aus dem Kontextmenü,
// wo eine Inline-Bestätigung nicht möglich ist, weil das Menü beim Klick schließt).
import { App, Modal } from "obsidian";
import { t } from "./i18n";

interface ConfirmOpts {
  title: string;
  message?: string;
  confirmText?: string;   // Default: t("btn_delete")
  destructive?: boolean;  // Default: true -> roter Bestätigen-Button
  // Optionales Häkchen (Default aus). Sein Zustand geht an onConfirm – so bleibt die EINE Abfrage
  // ein Zwei-Optionen-Dialog (z. B. „Projekt löschen“ mit/ohne Aufgaben), ohne zweiten Button.
  checkbox?: { label: string; checked?: boolean };
}

export class ConfirmModal extends Modal {
  constructor(app: App, private opts: ConfirmOpts, private onConfirm: (checked: boolean) => void) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-confirm-modal");
    contentEl.createEl("h3", { text: this.opts.title });
    if (this.opts.message) contentEl.createEl("p", { cls: "bt-confirm-msg", text: this.opts.message });

    let checked = this.opts.checkbox?.checked ?? false;
    if (this.opts.checkbox) {
      const row = contentEl.createEl("label", { cls: "bt-confirm-check" });
      const cb = row.createEl("input", { attr: { type: "checkbox" } });
      cb.checked = checked;
      cb.onchange = () => { checked = cb.checked; };
      row.createSpan({ text: this.opts.checkbox.label });
    }

    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    const cancel = actions.createEl("button", { text: t("btn_cancel") });
    cancel.onclick = () => this.close();
    const confirm = actions.createEl("button", {
      cls: "mod-cta" + (this.opts.destructive === false ? "" : " mod-warning"),
      text: this.opts.confirmText ?? t("btn_delete"),
    });
    confirm.onclick = () => { this.close(); this.onConfirm(checked); };

    window.setTimeout(() => confirm.focus(), 0);
  }

  onClose(): void { this.contentEl.empty(); }
}

interface PromptOpts {
  title: string;
  value?: string;
  placeholder?: string;
  confirmText?: string;   // Default: t("btn_save")
}

/** Einzeiliger Text-Prompt (z. B. Umbenennen aus dem Kontextmenü). Leerer Wert bricht ab. */
export class PromptModal extends Modal {
  constructor(app: App, private opts: PromptOpts, private onSubmit: (value: string) => void) {
    super(app);
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-confirm-modal");
    contentEl.createEl("h3", { text: this.opts.title });

    const input = contentEl.createEl("input", { cls: "bt-new-input", attr: { type: "text", placeholder: this.opts.placeholder ?? "" } });
    input.value = this.opts.value ?? "";
    const submit = () => {
      const v = input.value.trim();
      this.close();
      if (v && v !== this.opts.value) this.onSubmit(v);
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); submit(); }
      else if (e.key === "Escape") { e.preventDefault(); this.close(); }
    };

    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: this.opts.confirmText ?? t("btn_save") }).onclick = submit;

    window.setTimeout(() => { input.focus(); input.select(); }, 0);
  }

  onClose(): void { this.contentEl.empty(); }
}
