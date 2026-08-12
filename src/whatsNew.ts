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

    // Gezeigt wird, was seit dem LETZTEN Modal sichtbar dazugekommen ist. Der Performance-Eintrag
    // ist deshalb raus: Wer jetzt 1.44 sieht, hatte den Dialog beim Sprung auf 1.43.0 bereits.
    //
    // EIN Eintrag, und er beschreibt, was man MERKT (lange Namen sind lesbar, ohne die Leiste
    // aufzuziehen) – nicht, dass die Tooltips dahinter jetzt aus einer Stelle kommen. Der Zusatz
    // „nur wo etwas abgeschnitten ist" steht bewusst dabei, damit niemand über einen kurzen Namen
    // fährt und den Tooltip für kaputt hält – dieselbe Rolle wie die Größenangabe in 1.43.0.
    const items: Highlight[] = [
      { icon: "mouse-pointer", title: t("wn_tooltip_t"), desc: t("wn_tooltip_d") },
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
