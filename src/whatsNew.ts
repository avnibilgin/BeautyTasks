import { Modal, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { t } from "./i18n";

interface Highlight { icon: string; title: string; desc: string; }

/** „Neu in dieser Version"-Modal – einmalig nach einem Versionswechsel gezeigt (siehe main.ts).
 *  Die Highlights beziehen sich auf die aktuell veröffentlichte Version. */
export class WhatsNewModal extends Modal {
  constructor(private plugin: BeautyTasksPlugin) { super(plugin.app); }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-whatsnew");
    contentEl.createDiv({ cls: "bt-wn-eyebrow", text: "BeautyTasks " + this.plugin.manifest.version });
    contentEl.createEl("h2", { cls: "bt-wn-title", text: t("whatsnew_title") });

    const items: Highlight[] = [
      { icon: "panels-top-left", title: t("wn_tabs_t"), desc: t("wn_tabs_d") },
      { icon: "file-plus", title: t("wn_newtab_t"), desc: t("wn_newtab_d") },
      { icon: "square-split-horizontal", title: t("wn_plan_t"), desc: t("wn_plan_d") },
      { icon: "calendar-plus", title: t("wn_dragcal_t"), desc: t("wn_dragcal_d") },
    ];
    const list = contentEl.createDiv({ cls: "bt-wn-list" });
    for (const it of items) {
      const row = list.createDiv({ cls: "bt-wn-item" });
      setIcon(row.createDiv({ cls: "bt-wn-ic" }), it.icon);
      const body = row.createDiv({ cls: "bt-wn-body" });
      body.createDiv({ cls: "bt-wn-item-t", text: it.title });
      body.createDiv({ cls: "bt-wn-item-d", text: it.desc });
    }

    const foot = contentEl.createDiv({ cls: "bt-wn-foot" });
    foot.createEl("button", { cls: "mod-cta", text: t("whatsnew_ok") }).onclick = () => this.close();
  }

  onClose(): void { this.contentEl.empty(); }
}
