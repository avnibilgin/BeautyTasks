// Gemeinsamer Kontextmenü-Baukasten für Seitenleisten-Einträge (Projekt/Bereich/Label/Filter).
// EINE Quelle der Wahrheit – genutzt vom Sidebar-Rechtsklick (heuteView) UND vom ListManager-Kebab
// (manageView). Alle Aktionen rufen bestehende Plugin-Methoden; das Menü ist reine Verdrahtung.
import { Menu, TFile, Platform } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { PageRef, pageInfo } from "./pageCtx";
import { NavSection } from "./types";
import { NewItemModal } from "./newItemModal";
import { FilterModal } from "./filterModal";
import { ConfirmModal, PromptModal } from "./confirmModal";
import { listManaged } from "./taskService";
import { listFilters } from "./filterService";
import { t } from "./i18n";

// setSubmenu() ist seit App 1.7 verfügbar, fehlt aber in den mitgelieferten Typings (1.13.1).
declare module "obsidian" {
  interface MenuItem { setSubmenu(): Menu; }
}

/** Schlüssel = Notiz-Pfad (Projekt/Bereich/Filter) bzw. Label-Name. */
export interface NavMenuItem {
  sec: NavSection;
  key: string;
  name: string;
  hidden: boolean;
  color?: string | null;
  type?: "project" | "area";   // nur für projects/areas
  archived?: boolean;          // archiviertes Projekt/Bereich -> reduziertes Kebab (nur auf dem Board)
}

/**
 * „In neuem Tab / rechts daneben / in neuem Fenster öffnen" – Wortlaut, Reihenfolge und Icons
 * bewusst 1:1 wie in Obsidians eigenem Datei-Explorer: Wer sein Vault kennt, kennt das hier
 * schon. Steht ganz oben (eigene Section), weil es die einzige Aktion ist, die einen ZWEITEN
 * Tab erzeugt – der Weg zu „Liste links, Kalender rechts".
 *
 * Auf Mobile gibt es keine Fenster; der dritte Eintrag entfällt dort.
 */
export function addOpenItems(menu: Menu, plugin: BeautyTasksPlugin, page: PageRef): void {
  menu.addItem((m) => m.setSection("bt-newtab").setTitle(t("menu_open_new_tab")).setIcon("file-plus")
    .onClick(() => void plugin.openPage(page, "tab")));
  menu.addItem((m) => m.setSection("bt-newtab").setTitle(t("menu_open_right")).setIcon("separator-vertical")
    .onClick(() => void plugin.openPage(page, "split")));
  if (Platform.isDesktop) {
    menu.addItem((m) => m.setSection("bt-newtab").setTitle(t("menu_open_window")).setIcon("picture-in-picture-2")
      .onClick(() => void plugin.openPage(page, "window")));
  }
  // Der Planungs-Split gehört hierher und nicht in ein eigenes Menü: Er beantwortet dieselbe
  // Frage wie die drei darüber („wie bekomme ich das woanders hin?"), nur mit einem Ziel, das
  // sich sonst niemand von Hand zusammenbaut – Liste hier, Kalender daneben.
  //
  // NUR wo es überhaupt ein Layout zu wählen gibt: Wiederkehrend, Erledigt und die Verwaltung
  // kennen keine Kalender-Ansicht (tier "none"). Dort wäre der Eintrag ein leeres Versprechen –
  // er stünde im Menü und lieferte zweimal dieselbe Liste.
  if (pageInfo(page).tier !== "none") {
    menu.addItem((m) => m.setSection("bt-newtab").setTitle(t("menu_open_plan")).setIcon("calendar-days")
      .onClick(() => void plugin.openPlanSplit(page)));
  }
}

/** Die Seite, auf die ein Seitenleisten-Eintrag führt. */
export function pageOf(item: NavMenuItem): PageRef {
  if (item.sec === "filters") return { kind: "filter", key: item.key };
  if (item.sec === "labels") return { kind: "label", key: item.key };
  return { kind: "project", key: item.key };   // projects + areas teilen sich die Projektseite
}

/** Fügt genau den Kalender-Sync-Ein/Ausschalt-Eintrag hinzu – nur wenn mit Google verbunden.
 *  Wiederverwendet vom Projekt/Bereich-Menü UND vom Eingang (der NUR diesen Eintrag bekommt).
 *  Liefert, ob etwas hinzugefügt wurde (der Aufrufer zeigt das Menü nur dann). */
export function addGcalSyncItem(menu: Menu, plugin: BeautyTasksPlugin, path: string): boolean {
  if (!plugin.gcalSync.canSync()) return false;   // nur wenn Sync wirklich aktiv (nicht bloß verbunden)
  const excluded = plugin.isListGcalExcluded(path);
  menu.addItem((m) => m.setSection("bt-gcal")
    .setTitle(excluded ? t("menu_gcal_include") : t("menu_gcal_exclude"))
    .setIcon(excluded ? "calendar-sync" : "calendar-off")
    .onClick(() => void plugin.setListGcalExcluded(path, !excluded)));
  return true;
}

/** Bearbeiten-Dialog des Eintrags – Filter bekommen ihren eigenen. Exportiert, weil auch der
 *  Beschreibungs-Platzhalter auf der Seite dorthin führt (das Feld liegt in diesem Dialog). */
export function openEdit(plugin: BeautyTasksPlugin, item: NavMenuItem): void {
  if (item.sec === "filters") { new FilterModal(plugin, item.key).open(); return; }
  const kind = item.sec === "labels" ? "label" : (item.type ?? "project");
  const desc = listManaged(plugin.app).active.concat(listManaged(plugin.app).archived).find((p) => p.path === item.key)?.description ?? "";
  new NewItemModal(plugin, kind, { key: item.key, name: item.name, color: item.color ?? null, visible: !item.hidden, description: desc }).open();
}

function setVisible(plugin: BeautyTasksPlugin, sec: NavSection, key: string, visible: boolean): Promise<void> {
  if (sec === "filters") return plugin.setFilterVisible(key, visible);
  if (sec === "labels") return plugin.setLabelVisible(key, visible);
  return plugin.setProjectVisible(key, visible);
}

function deleteItem(plugin: BeautyTasksPlugin, item: NavMenuItem): Promise<void> {
  if (item.sec === "filters") return plugin.deleteFilter(item.key);
  if (item.sec === "labels") return plugin.deleteLabel(item.key);
  return plugin.deleteProject(item.key);
}

/** Schnelles Umbenennen (nur der Name) je Typ – Schlüssel ist Pfad bzw. Label-Name. */
function renameItem(plugin: BeautyTasksPlugin, item: NavMenuItem, v: string): void {
  if (item.sec === "filters") { void plugin.renameFilter(item.key, v); return; }
  if (item.sec === "labels") { void plugin.renameLabel(item.key, v); return; }
  void plugin.renameProject(item.key, v);   // projects + areas (Pfad)
}

/** Übersetzungs-Schlüssel für „Zur …übersicht" je Sektion (Board-Kebab). */
const GOTO_KEY: Record<NavSection, string> = {
  projects: "menu_goto_projects", areas: "menu_goto_areas", labels: "menu_goto_labels", filters: "menu_goto_filters",
};

/** Baut das vollständige Item-Kontextmenü (typ-spezifisch) in ein bestehendes Menu.
 *  `source` steuert die Weiche:
 *   - "sidebar": Umsortieren bewegt nur die SICHTBARE Reihenfolge (Drag-Modus / visible-only).
 *   - "manage":  Umsortieren bewegt die VOLLE Liste; „Reihenfolge ändern" entfällt (Zieh-Griff vorhanden).
 *   - "board":   Kebab auf einer Einzelseite – ohne alle Sortier-Optionen, dafür mit „Zur …übersicht". */
export function buildItemMenu(menu: Menu, plugin: BeautyTasksPlugin, item: NavMenuItem, source: "sidebar" | "manage" | "board" = "sidebar"): void {
  const isProjLike = item.sec === "projects" || item.sec === "areas";
  const fromSidebar = source === "sidebar";
  const onBoard = source === "board";

  // Archivierte Projekte/Bereiche (nur auf ihrer Einzelseite erreichbar): reduziertes Menü, damit man
  // wieder rausnavigieren UND wiederherstellen/endgültig löschen kann – dieselben Aktionen wie die
  // Schnell-Icons in der Archivübersicht. Trennlinie nach „Zur Archivübersicht" (eigene Section).
  if (item.archived) {
    menu.addItem((m) => m.setSection("bt-goto").setTitle(t("menu_goto_archive")).setIcon("archive")
      .onClick(() => void plugin.activateManage(item.sec, "archive")));
    menu.addItem((m) => m.setSection("bt-archive").setTitle(t("btn_restore")).setIcon("archive-restore")
      .onClick(() => void plugin.archiveProject(item.key, false)));
    menu.addItem((m) => m.setSection("bt-archive").setTitle(t("btn_delete_forever")).setIcon("trash-2").setWarning(true)
      .onClick(() => plugin.confirmDeleteProject(item.key, item.name)));
    return;
  }

  addOpenItems(menu, plugin, pageOf(item));

  // — Notiz öffnen — (Projekte, Bereiche, Filter). Labels haben keine Notiz: Ihr `key` ist der
  // Label-Name, kein Pfad. Der Body dieser Notiz gehört dem Nutzer – hier ist der Weg dorthin.
  if (item.sec !== "labels") {
    const noteKey = item.sec === "filters" ? "menu_open_filter_note"
      : item.type === "area" ? "menu_open_area_note" : "menu_open_project_note";
    menu.addItem((m) => m.setSection("bt-open").setTitle(t(noteKey)).setIcon("file-text")
      .onClick(() => {
        const f = plugin.app.vault.getAbstractFileByPath(item.key);
        if (f instanceof TFile) void plugin.app.workspace.getLeaf("tab").openFile(f);
      }));
  }

  // — Zur Übersicht — (nur auf der Einzelseite; ersetzt den früheren „list-plus"-Kopf-Button)
  if (onBoard) {
    menu.addItem((m) => m.setSection("bt-goto").setTitle(t(GOTO_KEY[item.sec])).setIcon("list-plus")
      .onClick(() => void plugin.activateManage(item.sec)));
  }

  // — Bearbeiten —
  menu.addItem((m) => m.setSection("bt-edit").setTitle(t("menu_edit")).setIcon("pencil")
    .onClick(() => openEdit(plugin, item)));

  // — Umbenennen — (alle Typen; schnelles Prompt-Modal, konsistent statt „nur über Bearbeiten")
  menu.addItem((m) => m.setSection("bt-edit").setTitle(t("btn_rename")).setIcon("text-cursor-input")
    .onClick(() => new PromptModal(plugin.app, { title: t("btn_rename"), value: item.name },
      (v) => renameItem(plugin, item, v)).open()));

  if (isProjLike) {
    const toArea = item.type !== "area";
    menu.addItem((m) => m.setSection("bt-edit")
      .setTitle(toArea ? t("tip_mark_area") : t("tip_unmark_area"))
      .setIcon(toArea ? "circle-small" : "folder")   // Ziel-Icons: Bereich = circle-small, Projekt = folder
      .onClick(() => void plugin.setProjectArea(item.key, toArea)));
  }

  // — Anordnen —
  menu.addItem((m) => m.setSection("bt-arrange")
    .setTitle(item.hidden ? t("tip_show_sidebar") : t("tip_hide_sidebar"))
    .setIcon(item.hidden ? "eye" : "eye-off")
    .onClick(() => void setVisible(plugin, item.sec, item.key, item.hidden)));
  // Sortier-Optionen NICHT auf der Einzelseite (Board): dort gibt es keinen Listenkontext.
  // „Reihenfolge ändern" nur in der Seitenleiste (öffnet den Sidebar-Drag-Modus); in der Übersicht
  // gibt es dafür bereits den Zieh-Griff an jeder Zeile.
  if (fromSidebar) {
    menu.addItem((m) => m.setSection("bt-arrange").setTitle(t("menu_reorder")).setIcon("arrow-up-down")
      .onClick(() => void plugin.startReorder(item.sec)));
  }
  if (!onBoard) {
    menu.addItem((m) => m.setSection("bt-arrange").setTitle(t("btn_move_up")).setIcon("chevron-up")
      .onClick(() => void (fromSidebar ? plugin.moveNavItemVisible(item.sec, item.key, -1) : plugin.moveNavItem(item.sec, item.key, -1))));
    menu.addItem((m) => m.setSection("bt-arrange").setTitle(t("btn_move_down")).setIcon("chevron-down")
      .onClick(() => void (fromSidebar ? plugin.moveNavItemVisible(item.sec, item.key, 1) : plugin.moveNavItem(item.sec, item.key, 1))));
  }

  // — Kalender-Sync (nur Projekt/Bereich; Helfer prüft die Verbindung selbst) —
  if (isProjLike) addGcalSyncItem(menu, plugin, item.key);

  // — Archivieren / Löschen —
  if (isProjLike) {
    menu.addItem((m) => m.setSection("bt-danger").setTitle(t("btn_archive")).setIcon("archive")
      .onClick(() => plugin.archiveWithUndo(item.key, item.name)));
  }
  menu.addItem((m) => m.setSection("bt-danger").setTitle(t("btn_delete")).setIcon("trash-2").setWarning(true)
    .onClick(() => {
      // Projekte/Bereiche haben Aufgaben -> Zwei-Optionen-Abfrage (Papierkorb vs. Eingang).
      // Labels/Filter haben keine -> schlichte Bestätigung.
      if (isProjLike) plugin.confirmDeleteProject(item.key, item.name);
      else new ConfirmModal(plugin.app,
        { title: t("confirm_delete_title", item.name), message: t("confirm_delete_body") },
        () => void deleteItem(plugin, item)).open();
    }));
}

/** Ausgeblendete Einträge einer Sektion (Schlüssel + Anzeigename). */
function hiddenOf(plugin: BeautyTasksPlugin, sec: NavSection): { key: string; name: string }[] {
  if (sec === "filters") return listFilters(plugin.app).filter((f) => f.hidden).map((f) => ({ key: f.path, name: f.name }));
  if (sec === "labels") return plugin.getLabels().filter((l) => !plugin.isLabelVisible(l.name)).map((l) => ({ key: l.name, name: l.name }));
  const want = sec === "areas" ? "area" : "project";
  return listManaged(plugin.app).active.filter((p) => p.type === want && p.hidden).map((p) => ({ key: p.path, name: p.name }));
}

/** Hängt „Ausgeblendete einblenden ▸" (Untermenü, ein Klick = einblenden) an, falls es welche gibt.
 *  Gibt zurück, ob etwas hinzugefügt wurde – der Aufrufer zeigt das Menü nur dann. */
export function showHiddenSubmenu(menu: Menu, plugin: BeautyTasksPlugin, sec: NavSection): boolean {
  const hidden = hiddenOf(plugin, sec);
  if (!hidden.length) return false;
  menu.addItem((parent) => {
    parent.setTitle(t("menu_reveal_hidden")).setIcon("eye");
    const sub = parent.setSubmenu();
    for (const h of hidden) {
      sub.addItem((m) => m.setTitle(h.name).setIcon("eye-off")
        .onClick(() => void setVisible(plugin, sec, h.key, true)));
    }
  });
  return true;
}
