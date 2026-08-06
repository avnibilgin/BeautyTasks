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
    // 1.38.0 (Startseite, Termin-Farben) sind deshalb raus: Wer jetzt 1.39 sieht, hatte den
    // Dialog beim Sprung auf 1.38.0 bereits.
    //
    // Drei Einträge, eine Erzählung: WAS man sich hinstellen kann, WIE man darin navigiert, und
    // dass man auch wieder herauskommt. Der letzte Punkt steht bewusst dabei – ein Modus ohne
    // sichtbare Tür ist der häufigste Grund, warum Leute ein Feature nach einmal Ausprobieren
    // nie wieder anfassen.
    const items: Highlight[] = [
      { icon: "square-split-horizontal", title: t("wn_plantabs_t"), desc: t("wn_plantabs_d") },
      { icon: "mouse-pointer-click", title: t("wn_plannav_t"), desc: t("wn_plannav_d") },
      { icon: "panel-right-close", title: t("wn_planclose_t"), desc: t("wn_planclose_d") },
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
