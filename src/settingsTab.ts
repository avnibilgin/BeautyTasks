import { App, PluginSettingTab, Setting, AbstractInputSuggest, TFolder, normalizePath, setIcon, Notice } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { ChipId, ChipTier, ChipSurface } from "./types";
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

  private gcalStatusUnsub: (() => void) | null = null;

  hide(): void { this.gcalStatusUnsub?.(); this.gcalStatusUnsub = null; }

  display(): void {
    const { containerEl } = this;
    this.gcalStatusUnsub?.(); this.gcalStatusUnsub = null;   // altes Status-Abo lösen (Re-Render)
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

    // ── Aufgabenaktionen (Chips je Fläche ein-/ausblenden + sortieren) ──
    new Setting(containerEl).setName(t("set_chip_actions")).setHeading();
    containerEl.createEl("div", { cls: "setting-item-description bt-chip-actions-desc", text: t("set_chip_actions_desc") });
    this.renderChipActions(containerEl);

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

    // ── Google Kalender ── (eigener Container → Neuzeichnen ohne this.display()-Selbstaufruf)
    const gcalHost = containerEl.createDiv();
    const drawGCal = (): void => { gcalHost.empty(); this.renderGCal(gcalHost, drawGCal); };
    drawGCal();
  }

  /** Google-Kalender-Sektion: vor dem Verbinden ein schlanker Setup-Assistent, danach der
   *  Verbunden-Zustand mit Status, Ziel-Kalender und Optionen (Feinkorn unter „Erweitert").
   *  Progressive Offenlegung – Optionen erscheinen erst nach erfolgreicher Verbindung.
   *  `redraw` zeichnet nur diese Sektion neu (kein this.display() → keine no-deprecated-Warnung). */
  private renderGCal(containerEl: HTMLElement, redraw: () => void): void {
    const p = this.plugin;
    const g = p.settings.gcal!;
    this.gcalStatusUnsub?.(); this.gcalStatusUnsub = null;   // Abo vor Neuaufbau lösen
    new Setting(containerEl).setName(t("set_gcal_heading")).setHeading();

    // ── Nicht verbunden: Assistent ──
    if (!p.gcalAuth.isConnected()) {
      containerEl.createEl("div", { cls: "setting-item-description", text: t("gcal_setup_desc") });
      new Setting(containerEl).setName(t("gcal_help_btn"))
        .addButton((b) => b.setButtonText(t("gcal_help_btn"))
          .onClick(() => window.open("https://console.cloud.google.com/apis/credentials")));
      new Setting(containerEl).setName(t("gcal_client_id")).addText((txt) =>
        txt.setValue(g.clientId).onChange((v) => { g.clientId = v.trim(); void p.saveSettings(); }));
      new Setting(containerEl).setName(t("gcal_client_secret")).addText((txt) => {
        txt.inputEl.type = "password";
        txt.setValue(g.clientSecret).onChange((v) => { g.clientSecret = v.trim(); void p.saveSettings(); });
      });
      new Setting(containerEl).addButton((b) => b.setButtonText(t("gcal_connect_btn")).setCta()
        .setDisabled(!g.clientId || !g.clientSecret)
        .onClick(async () => {
          b.setButtonText(t("gcal_connecting")).setDisabled(true);
          try {
            await p.gcalConnect((dp) => new Notice(t("gcal_device_prompt", dp.verificationUrl, dp.userCode), 0));
          } catch (e) {
            new Notice(t("gcal_connect_failed", e instanceof Error ? e.message : String(e)));
          }
          redraw();
        }));
      return;
    }

    // ── Verbunden: Kopf mit Status ──
    const head = new Setting(containerEl).setName(t("gcal_connected_as", g.account ?? "—"))
      .addButton((b) => b.setButtonText(t("gcal_disconnect_btn"))
        .onClick(async () => { await p.gcalDisconnect(); redraw(); }));
    head.nameEl.prepend(createSpan({ cls: "bt-gcal-dot" }));

    const statusSetting = new Setting(containerEl)
      .addButton((b) => b.setButtonText(t("gcal_sync_now_btn")).onClick(() => void p.gcalSync.syncNow()));
    const renderStatus = (i: import("./gcalSync").GCalStatusInfo): void => {
      const txt = i.status === "syncing" ? t("gcal_syncing")
        : i.status === "error" ? t("gcal_sync_error", i.lastError ?? "")
        : t("gcal_last_synced", i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleString() : t("gcal_never"));
      statusSetting.setName(txt);
    };
    this.gcalStatusUnsub = p.gcalSync.onStatus(renderStatus);   // ruft cb sofort mit aktuellem Stand

    // Ziel-Kalender (Liste async nachladen; Platzhalter = aktuelle Wahl)
    new Setting(containerEl).setName(t("gcal_target_calendar")).setDesc(t("gcal_target_calendar_desc"))
      .addDropdown((dd) => {
        if (g.calendarId) dd.addOption(g.calendarId, g.calendarId);
        dd.setValue(g.calendarId);
        dd.onChange((v) => { g.calendarId = v; void p.saveSettings(); void p.gcalSync.syncNow(); });
        void (async () => {
          try {
            const cals = await p.gcalCalendars();
            dd.selectEl.empty();
            for (const c of cals) dd.addOption(c.id, c.summary);
            dd.setValue(g.calendarId);
          } catch { /* Platzhalter behalten */ }
        })();
      });

    new Setting(containerEl).setName(t("gcal_enabled")).setDesc(t("gcal_enabled_desc"))
      .addToggle((tg) => tg.setValue(g.enabled).onChange((v) => { g.enabled = v; void p.saveSettings(); if (v) void p.gcalSync.syncNow(); }));
    new Setting(containerEl).setName(t("gcal_autosync")).setDesc(t("gcal_autosync_desc"))
      .addToggle((tg) => tg.setValue(g.autoSync).onChange((v) => { g.autoSync = v; void p.saveSettings(); }));

    // ── Erweitert (zugeklappt) ──
    const adv = containerEl.createEl("details", { cls: "bt-gcal-advanced" });
    adv.createEl("summary", { text: t("gcal_advanced") });
    const av = adv.createDiv();
    const boolRow = (key: string, get: () => boolean, set: (v: boolean) => void): void => {
      new Setting(av).setName(t(key)).addToggle((tg) => tg.setValue(get()).onChange((v) => { set(v); void p.saveSettings(); }));
    };
    boolRow("gcal_on_create", () => g.syncOnCreate, (v) => (g.syncOnCreate = v));
    boolRow("gcal_on_update", () => g.syncOnUpdate, (v) => (g.syncOnUpdate = v));
    boolRow("gcal_on_delete", () => g.syncOnDelete, (v) => (g.syncOnDelete = v));
    boolRow("gcal_remove_on_complete", () => g.removeEventOnComplete, (v) => (g.removeEventOnComplete = v));
    new Setting(av).setName(t("gcal_duration")).addText((txt) => {
      txt.inputEl.type = "number";
      txt.setValue(String(g.defaultDurationMin)).onChange((v) => { const n = parseInt(v, 10); if (n > 0) { g.defaultDurationMin = n; void p.saveSettings(); } });
    });
    new Setting(av).setName(t("gcal_timezone")).addText((txt) =>
      txt.setValue(g.timezone).onChange((v) => { g.timezone = v.trim() || g.timezone; void p.saveSettings(); }));
    boolRow("gcal_statusbar", () => g.showStatusBar, (v) => (g.showStatusBar = v));
    boolRow("gcal_notify_conflicts", () => g.notifyConflicts, (v) => (g.notifyConflicts = v));
  }

  /** Fläche wählen (Normale Eingabe · Schnelleingabe) und darunter deren drei Tier-Zonen zeichnen.
   *  Beide Flächen haben getrennte Profile (chipProfiles). */
  private renderChipActions(containerEl: HTMLElement): void {
    const p = this.plugin;
    const SURFACES: ChipSurface[] = ["editor", "quickAdd"];
    let surface: ChipSurface = "editor";
    // Kopfzeile: Flächen-Tabs links, „Auf Standard zurücksetzen" (aktuelle Fläche) rechts.
    const bar = containerEl.createDiv({ cls: "bt-chip-surface-bar" });
    const tabs = bar.createDiv({ cls: "bt-chip-surface-tabs" });
    const reset = bar.createEl("button", { cls: "bt-chip-reset", text: t("chip_reset_default") });
    const zonesHost = containerEl.createDiv();
    const drawTabs = (): void => {
      tabs.empty();
      for (const s of SURFACES) {
        const b = tabs.createEl("button", { cls: "bt-chip-surface-tab" + (s === surface ? " is-active" : ""), text: t(s === "editor" ? "chip_surface_editor" : "chip_surface_quickadd") });
        b.onclick = () => { if (s === surface) return; surface = s; drawTabs(); this.renderChipZones(zonesHost, surface); };
      }
    };
    // Zurücksetzen: gespeichertes Profil der AKTUELLEN Fläche entfernen -> Ersteinrichtungs-Default greift.
    reset.onclick = async () => {
      if (p.settings.chipProfiles) delete p.settings.chipProfiles[surface];
      await p.saveSettings();
      this.renderChipZones(zonesHost, surface);
    };
    drawTabs();
    this.renderChipZones(zonesHost, surface);
  }

  /** Drei Tier-Zonen (Immer anzeigen · Bei Wert anzeigen · Immer im +-Menü) für EINE Fläche. Jede
   *  Chip-Zeile lässt sich per Griff zwischen den Zonen ziehen; Ablegen persistiert das Profil. */
  private renderChipZones(containerEl: HTMLElement, surface: ChipSurface): void {
    const p = this.plugin;
    containerEl.empty();   // beim Flächen-Wechsel neu aufbauen
    const wrap = containerEl.createDiv({ cls: "bt-chip-zones" });
    const zones: HTMLElement[] = [];

    // Speichert die aktuelle DOM-Verteilung ins Profil der Fläche (Zone = Tier, Reihenfolge = order).
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
      const profiles = p.settings.chipProfiles ?? {};
      profiles[surface] = { order, tiers };
      p.settings.chipProfiles = profiles;
      void p.saveSettings();
    };

    for (const tier of CHIP_TIERS) {
      const block = wrap.createDiv({ cls: "bt-chip-zone-block" });
      block.createDiv({ cls: "bt-chip-zone-title", text: t("chip_tier_" + tier) });
      const zone = block.createDiv({ cls: "bt-chip-zone", attr: { "data-tier": tier } });
      zones.push(zone);
    }

    for (const id of resolveChipOrder(p.settings, surface)) {
      const c = CHIPS[id];
      const zone = zones[CHIP_TIERS.indexOf(chipTierOf(p.settings, surface, id))];
      const row = zone.createDiv({ cls: "bt-chip-row", attr: { "data-id": id } });
      const grip = row.createSpan({ cls: "bt-chip-grip", attr: { "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
      setIcon(grip, "grip-vertical");
      setIcon(row.createSpan({ cls: "bt-chip-row-ic" }), c.icon);
      row.createSpan({ cls: "bt-chip-row-lbl", text: t(c.nameKey) });
      attachChipDrag(row, grip, zones, persist);
    }
  }
}
