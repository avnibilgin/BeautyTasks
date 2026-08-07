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

    // Gezeigt wird, was seit dem LETZTEN Modal sichtbar dazugekommen ist. Die Einträge zur
    // Planungsansicht sind deshalb raus: Wer jetzt 1.40 sieht, hatte den Dialog beim Sprung auf
    // 1.39.0 bereits.
    //
    // 1.40.0 hat GENAU EINE sichtbare Neuerung – 1.39.1/1.39.2 waren stille Patches. Ein Eintrag
    // statt der gewohnten drei ist hier Absicht: Aufgefüllt würde der Dialog seine eigene Währung
    // entwerten, denn wer ihn zweimal ohne Gewinn wegklickt, liest ihn beim dritten Mal nicht
    // mehr. Der Text nennt bewusst weder „Frontmatter" noch „ID" – wer das Feature braucht,
    // versteht es auch so; wer es nicht braucht, soll nicht über Fachbegriffe stolpern.
    const items: Highlight[] = [
      { icon: "code", title: t("wn_statusid_t"), desc: t("wn_statusid_d") },
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
