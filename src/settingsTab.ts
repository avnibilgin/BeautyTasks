import { App, PluginSettingTab, Setting, AbstractInputSuggest, TFolder, normalizePath, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { ChipId, ChipTier } from "./types";
import { CHIPS, resolveChipOrder, chipTierOf } from "./chips";
import { VIEW_IDS, viewTitle } from "./heuteView";
import { renderStatusEditor } from "./statusEditor";
import { t } from "./i18n";

const CHIP_TIERS: ChipTier[] = ["shown", "onValue", "hidden"];

/** Pointer-basiertes Ziehen einer Chip-Zeile ZWISCHEN den drei Tier-Zonen (Maus + Touch,
 *  Popout-sicher über row.ownerDocument). Beim Loslassen ruft onDrop() – der Aufrufer liest
 *  Zonen-Zugehörigkeit + Reihenfolge aus dem DOM und persistiert chipTiers/chipOrder. */
function attachChipDrag(row: HTMLElement, grip: HTMLElement, zones: HTMLElement[], onDrop: () => void): void {
  grip.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    const doc = row.ownerDocument;
    row.addClass("is-dragging");
    const onMove = (me: PointerEvent) => {
      const y = me.clientY;
      // Zielzone: die, deren Rechteck den Punkt (vertikal) enthält; sonst die vertikal nächste.
      let target = zones.find((z) => { const r = z.getBoundingClientRect(); return y >= r.top && y <= r.bottom; });
      if (!target) {
        let best = Infinity;
        for (const z of zones) { const r = z.getBoundingClientRect(); const dy = y < r.top ? r.top - y : y - r.bottom; if (dy < best) { best = dy; target = z; } }
      }
      if (!target) return;
      const sibs = (Array.from(target.children) as HTMLElement[]).filter((el) => el !== row);
      let placed = false;
      for (const sib of sibs) { const r = sib.getBoundingClientRect(); if (y < r.top + r.height / 2) { target.insertBefore(row, sib); placed = true; break; } }
      if (!placed) target.appendChild(row);
    };
    const onUp = () => {
      row.removeClass("is-dragging");
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      onDrop();
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  });
}

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
      dd.addOption("es", "Español");
      dd.addOption("pt", "Português (Brasil)");
      dd.addOption("fr", "Français");
      dd.addOption("it", "Italiano");
      dd.addOption("tr", "Türkçe");
      dd.addOption("ru", "Русский");
      dd.addOption("zh", "简体中文");
      dd.addOption("ja", "日本語");
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

    // ── Aufgabenaktionen (Chips ein-/ausblenden + sortieren; wirkt auf Editor UND Schnelleingabe) ──
    new Setting(containerEl).setName(t("set_chip_actions")).setHeading();
    containerEl.createEl("div", { cls: "setting-item-description bt-chip-actions-desc", text: t("set_chip_actions_desc") });
    this.renderChipZones(containerEl);

    // ── Status (früher im ListManager; Custom-Status ist Konfiguration → gehört hierher) ──
    new Setting(containerEl).setName(t("tab_statuses")).setHeading();
    renderStatusEditor(containerEl.createDiv({ cls: "bt-settings-status" }), p);

    // ── Import & Export ──
    new Setting(containerEl).setName(t("set_data_heading")).setHeading();

    new Setting(containerEl).setName(t("set_export")).setDesc(t("set_export_desc"))
      .addButton((b) => b.setButtonText(t("set_export_btn")).setCta().onClick(() => void p.exportTasksJson()));

    new Setting(containerEl).setName(t("set_import")).setDesc(t("set_import_desc"))
      .addButton((b) => b.setButtonText(t("set_import_vault_btn")).onClick(() => p.importTasksFromVault()))
      .addButton((b) => b.setButtonText(t("set_import_os_btn")).onClick(() => p.importTasksFromOs()));

    new Setting(containerEl).setName(t("set_import_tn")).setDesc(t("set_import_tn_desc"))
      .addButton((b) => b.setButtonText(t("set_import_tn_btn")).onClick(() => p.importFromTaskNotes()));
  }

  /** Drei Tier-Zonen (Immer anzeigen · Bei Wert anzeigen · Immer im +-Menü). Jede Chip-Zeile lässt
   *  sich per Griff zwischen den Zonen ziehen; das Ablegen persistiert chipTiers + chipOrder. */
  private renderChipZones(containerEl: HTMLElement): void {
    const p = this.plugin;
    const wrap = containerEl.createDiv({ cls: "bt-chip-zones" });
    const zones: HTMLElement[] = [];

    // Speichert die aktuelle DOM-Verteilung (Zonen-Zugehörigkeit = Tier, Reihenfolge = chipOrder).
    const persist = (): void => {
      const order: ChipId[] = [];
      const tiers: Partial<Record<ChipId, ChipTier>> = {};
      for (const z of zones) {
        const tier = z.getAttr("data-tier") as ChipTier;
        for (const r of Array.from(z.children) as HTMLElement[]) {
          const id = r.getAttr("data-id") as ChipId | null;
          if (!id) continue;
          order.push(id); tiers[id] = tier;
        }
      }
      p.settings.chipOrder = order;
      p.settings.chipTiers = tiers;
      void p.saveSettings();
    };

    for (const tier of CHIP_TIERS) {
      const block = wrap.createDiv({ cls: "bt-chip-zone-block" });
      block.createDiv({ cls: "bt-chip-zone-title", text: t("chip_tier_" + tier) });
      const zone = block.createDiv({ cls: "bt-chip-zone", attr: { "data-tier": tier } });
      zones.push(zone);
    }

    for (const id of resolveChipOrder(p.settings)) {
      const c = CHIPS[id];
      const zone = zones[CHIP_TIERS.indexOf(chipTierOf(p.settings, id))];
      const row = zone.createDiv({ cls: "bt-chip-row", attr: { "data-id": id } });
      const grip = row.createSpan({ cls: "bt-chip-grip", attr: { "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
      setIcon(grip, "grip-vertical");
      setIcon(row.createSpan({ cls: "bt-chip-row-ic" }), c.icon);
      row.createSpan({ cls: "bt-chip-row-lbl", text: t(c.nameKey) });
      attachChipDrag(row, grip, zones, persist);
    }
  }
}
