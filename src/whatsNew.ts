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

    // Gezeigt wird, was seit dem LETZTEN Modal sichtbar dazugekommen ist. Die Einträge aus
    // 1.36.2/1.37.0 sind deshalb raus: Wer jetzt 1.38 sieht, hatte den Dialog beim Sprung auf
    // 1.37.0 bereits. Die Termin-Farben stehen hier, obwohl sie aus 1.37.1 stammen – ein stiller
    // Patch zeigt kein Modal, gesehen hat sie also noch niemand.
    //
    // ► Beim Sprung auf 1.39.0 fliegen die beiden 1.38.0-Einträge raus (Startseite, Termin-Farben):
    //   die hat jeder beim Sprung auf 1.38.0 bereits gesehen.
    const items: Highlight[] = [
      { icon: "square-split-horizontal", title: t("wn_plantabs_t"), desc: t("wn_plantabs_d") },
      { icon: "home", title: t("wn_startpage_t"), desc: t("wn_startpage_d") },
      { icon: "palette", title: t("wn_evcolor_t"), desc: t("wn_evcolor_d") },
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
