import { App, PluginSettingTab, Setting, AbstractInputSuggest, TFolder, normalizePath } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { VIEW_IDS, viewTitle } from "./heuteView";
import { t } from "./i18n";

/** Ordner-Autovervollständigung für ein Text-Eingabefeld (Obsidian-Standard-API). */
class FolderSuggest extends AbstractInputSuggest<TFolder> {
  constructor(private appRef: App, textInputEl: HTMLInputElement, private onPick: (path: string) => void) {
    super(appRef, textInputEl);
  }
  protected getSuggestions(query: string): TFolder[] {
    const q = query.toLowerCase();
    const out: TFolder[] = [];
    for (const f of this.appRef.vault.getAllLoadedFiles()) {
      if (f instanceof TFolder && f.path.toLowerCase().includes(q)) { out.push(f); if (out.length >= 100) break; }
    }
    return out;
  }
  renderSuggestion(folder: TFolder, el: HTMLElement): void { el.setText(folder.path || "/"); }
  selectSuggestion(folder: TFolder): void { this.setValue(folder.path); this.onPick(folder.path); this.close(); }
}

/** Einstellungen (imperativ; funktioniert auch auf App-Versionen < 1.13.0). */
export class BeautyTasksSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: BeautyTasksPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();
    const p = this.plugin;

    // ── Ordner ──
    new Setting(containerEl).setName(t("set_folders_heading")).setHeading();
    const folderRow = (name: string, desc: string, get: () => string, set: (v: string) => void) => {
      new Setting(containerEl).setName(name).setDesc(desc).addText((text) => {
        text.setValue(get());
        const save = (raw: string) => { const v = normalizePath(raw.trim()); if (v && v !== ".") { set(v); void p.saveSettings(); } };
        text.onChange(save);
        new FolderSuggest(this.app, text.inputEl, (path) => { text.setValue(path); save(path); });
      });
    };
    folderRow(t("set_folder_items"), t("set_folder_items_desc"), () => p.settings.itemsFolder, (v) => (p.settings.itemsFolder = v));
    folderRow(t("set_folder_projects"), t("set_folder_projects_desc"), () => p.settings.projectsFolder, (v) => (p.settings.projectsFolder = v));
    folderRow(t("set_folder_attachments"), t("set_folder_attachments_desc"), () => p.settings.attachmentsFolder, (v) => (p.settings.attachmentsFolder = v));

    // ── Verhalten ──
    new Setting(containerEl).setName(t("set_behavior_heading")).setHeading();

    new Setting(containerEl).setName(t("set_language")).setDesc(t("set_language_desc")).addDropdown((dd) => {
      dd.addOption("auto", t("set_language_auto"));
      dd.addOption("en", "English");
      dd.addOption("de", "Deutsch");
      dd.setValue(p.settings.locale);
      // Sofort auf die Plugin-UI anwenden; die Settings-Labels wechseln beim erneuten Öffnen.
      dd.onChange(async (v) => { p.settings.locale = v; await p.saveSettings(); p.applyLocale(); p.renderAll(); });
    });

    new Setting(containerEl).setName(t("set_start_view")).setDesc(t("set_start_view_desc")).addDropdown((dd) => {
      for (const id of VIEW_IDS) dd.addOption(id, viewTitle(id));
      dd.addOption("last", t("set_start_view_last"));
      dd.setValue(p.settings.startView);
      dd.onChange(async (v) => { p.settings.startView = v; await p.saveSettings(); });
    });

    new Setting(containerEl).setName(t("set_nl")).setDesc(t("set_nl_desc")).addToggle((tg) =>
      tg.setValue(p.settings.parseNaturalLanguage).onChange(async (v) => { p.settings.parseNaturalLanguage = v; await p.saveSettings(); }));

    new Setting(containerEl).setName(t("set_show_desc")).setDesc(t("set_show_desc_desc")).addToggle((tg) =>
      tg.setValue(p.settings.showDescriptionInList).onChange(async (v) => {
        p.settings.showDescriptionInList = v;
        await p.saveSettings();
        p.renderAll();
      }));

    new Setting(containerEl).setName(t("set_chips_iconsonly")).setDesc(t("set_chips_iconsonly_desc")).addToggle((tg) =>
      tg.setValue(p.settings.chipsIconsOnly).onChange(async (v) => {
        p.settings.chipsIconsOnly = v;
        await p.saveSettings();
      }));
  }
}
