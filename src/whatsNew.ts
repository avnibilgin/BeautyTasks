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

    // Gezeigt wird, was seit dem LETZTEN Modal sichtbar dazugekommen ist. Der Eintrag zu den
    // Statuswerten ist deshalb raus: Wer jetzt 1.41 sieht, hatte den Dialog beim Sprung auf
    // 1.40.0 bereits.
    //
    // Drei Einträge, eine Reihenfolge: WAS jetzt möglich ist, WIE man es sagt, WAS man dann sieht.
    //
    // Die Umstellung der bestehenden Regeln (`every week` -> `FREQ=WEEKLY` im Frontmatter) steht
    // bewusst NICHT hier: Sie ändert die Bedeutung nicht, und ein vierter Eintrag über eine
    // Schreibweise verwässert die drei, die vom Gewinn handeln. Die beiden Fehlerbehebungen der
    // Fassung fehlen aus demselben Grund – Reparaturen sind keine Neuigkeiten und rechtfertigen
    // keinen Dialog, der die Arbeit unterbricht.
    const items: Highlight[] = [
      { icon: "repeat", title: t("wn_recurmore_t"), desc: t("wn_recurmore_d") },
      { icon: "text-cursor-input", title: t("wn_recurtype_t"), desc: t("wn_recurtype_d") },
      { icon: "eye", title: t("wn_recurplain_t"), desc: t("wn_recurplain_d") },
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
