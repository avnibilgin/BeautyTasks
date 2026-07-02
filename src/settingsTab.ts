import { App, PluginSettingTab, Setting } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { t } from "./i18n";

/** Einstellungen (imperativ; funktioniert auch auf App-Versionen < 1.13.0). */
export class BeautyTasksSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: BeautyTasksPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    new Setting(containerEl)
      .setName(t("set_show_desc"))
      .setDesc(t("set_show_desc_desc"))
      .addToggle((tg) => tg
        .setValue(this.plugin.settings.showDescriptionInList)
        .onChange(async (v) => {
          this.plugin.settings.showDescriptionInList = v;
          await this.plugin.saveSettings();
          this.plugin.renderAll();
        }));
  }
}
