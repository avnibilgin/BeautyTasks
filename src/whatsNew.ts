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

    // Gezeigt wird, was seit dem LETZTEN Modal sichtbar dazugekommen ist. Die Link-
    // Vervollständigung ist deshalb raus: Wer jetzt 1.46 sieht, hatte den Dialog bei 1.45.0.
    //
    // Der ZWEITE Eintrag ist der wichtigste, obwohl der erste die Überschrift trägt: Ohne ihn
    // liest sich „Vorlagen" wie Duplizieren mit Zusatzschritten. Dass die Zeitabstände erhalten
    // bleiben, ist der ganze Unterschied – und „merkt sich den Rhythmus, nicht den Kalender"
    // sagt ihn in einem Satz.
    const items: Highlight[] = [
      { icon: "clipboard-list", title: t("wn_tpl_t"), desc: t("wn_tpl_d") },
      { icon: "calendar-days", title: t("wn_tplwhen_t"), desc: t("wn_tplwhen_d") },
      { icon: "list-plus", title: t("wn_navtidy_t"), desc: t("wn_navtidy_d") },
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
