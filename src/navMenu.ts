// Gemeinsamer Kontextmenü-Baukasten für Seitenleisten-Einträge (Projekt/Bereich/Label/Filter).
// EINE Quelle der Wahrheit – genutzt vom Sidebar-Rechtsklick (heuteView) UND vom ListManager-Kebab
// (manageView). Alle Aktionen rufen bestehende Plugin-Methoden; das Menü ist reine Verdrahtung.
import { Menu, TFile, Platform } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { PageRef, pageInfo } from "./pageCtx";
import { NavSection } from "./types";
import { EditFocus, NewItemModal } from "./newItemModal";
import { FilterModal } from "./filterModal";
import { ConfirmModal, PromptModal } from "./confirmModal";
import { listManaged } from "./taskService";
import { listFilters } from "./filterService";
import { ApplyTemplateModal, promptNewTemplate } from "./templateModal";
import { TaskModal } from "./taskModal";
import { openTaskNote } from "./taskService";
import { deleteTemplate, listTemplates, refreshTemplates, renameTemplate, templateEditScope, TemplateInfo } from "./templateService";
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
    // „square-split-horizontal" ist der aktuelle Lucide-Name; „split-square-horizontal" ist der
    // Alt-Alias von vor der Umbenennung (2024) und wird nur noch aus Kompatibilität mitgeführt.
    //
    // Der Eintrag beschriftet sich um: Steht die Anordnung für GENAU DIESE Seite schon, macht
    // derselbe Befehl sie wieder zu. Ohne die sichtbare Umbeschriftung wäre der Ausgang aus der
    // Planungsansicht nicht auffindbar – man käme nur heraus, indem man Reiter einzeln zuklickt.
    const steht = plugin.planSplitFor(page) !== null;
    menu.addItem((m) => m.setSection("bt-newtab").setTitle(t(steht ? "plan_close" : "plan_open")).setIcon("square-split-horizontal")
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
export function openEdit(plugin: BeautyTasksPlugin, item: NavMenuItem, focus: EditFocus = "name"): void {
  if (item.sec === "filters") { new FilterModal(plugin, item.key, undefined, focus).open(); return; }
  const kind = item.sec === "labels" ? "label" : (item.type ?? "project");
  const desc = listManaged(plugin.app).active.concat(listManaged(plugin.app).archived).find((p) => p.path === item.key)?.description ?? "";
  new NewItemModal(plugin, kind, { key: item.key, name: item.name, color: item.color ?? null, visible: !item.hidden, description: desc }, focus).open();
}

function setVisible(plugin: BeautyTasksPlugin, sec: NavSection, key: string, visible: boolean): Promise<void> {
  if (sec === "filters") return plugin.setFilterVisible(key, visible);
  if (sec === "labels") return plugin.setLabelVisible(key, visible);
  if (sec === "templates") return plugin.setTemplateVisible(key, visible);
  return plugin.setProjectVisible(key, visible);
}

function deleteItem(plugin: BeautyTasksPlugin, item: NavMenuItem): Promise<void> {
  if (item.sec === "filters") return plugin.deleteFilter(item.key);
  if (item.sec === "labels") return plugin.deleteLabel(item.key);
  if (item.sec === "templates") return deleteTemplate(plugin, item.key);
  return plugin.deleteProject(item.key);
}

/** Schnelles Umbenennen (nur der Name) je Typ – Schlüssel ist Pfad bzw. Label-Name. */
function renameItem(plugin: BeautyTasksPlugin, item: NavMenuItem, v: string): void {
  if (item.sec === "filters") { void plugin.renameFilter(item.key, v); return; }
  if (item.sec === "labels") { void plugin.renameLabel(item.key, v); return; }
  if (item.sec === "templates") { void renameTemplate(plugin, item.key, v); return; }
  void plugin.renameProject(item.key, v);   // projects + areas (Pfad)
}

/** Übersetzungs-Schlüssel für „Zur …übersicht" je Sektion (Board-Kebab).
 *  Vorlagen fehlen bewusst: Der Eintrag erscheint nur auf einer Einzel-SEITE (`onBoard`), und eine
 *  Vorlage hat keine – sie wird angewendet oder im Editor bearbeitet. Deshalb Partial mit Guard
 *  statt eines Textes, den nie jemand zu sehen bekäme. */
const GOTO_KEY: Partial<Record<NavSection, string>> = {
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
  const gotoKey = GOTO_KEY[item.sec];
  if (onBoard && gotoKey) {
    menu.addItem((m) => m.setSection("bt-goto").setTitle(t(gotoKey)).setIcon("list-plus")
      .onClick(() => void plugin.activateManage(item.sec)));
  }

  // — Bearbeiten —
  menu.addItem((m) => m.setSection("bt-edit").setTitle(t("menu_edit")).setIcon("pencil")
    .onClick(() => openEdit(plugin, item)));

  // — Umbenennen — (alle Typen; schnelles Prompt-Modal, konsistent statt „nur über Bearbeiten")
  menu.addItem((m) => m.setSection("bt-edit").setTitle(t("btn_rename")).setIcon("text-cursor-input")
    .onClick(() => new PromptModal(plugin.app, { title: t("btn_rename"), value: item.name },
      (v) => renameItem(plugin, item, v)).open()));

  // — Als Vorlage speichern — (nur Projekte/Bereiche; Labels und Filter haben keine Aufgaben,
  // die man mitnehmen könnte). Nimmt das Projekt samt aller Aufgabenbäume auf.
  if (isProjLike) {
    menu.addItem((m) => m.setSection("bt-edit").setTitle(t("menu_save_project_as_template")).setIcon("bookmark-plus")
      .onClick(() => void plugin.saveProjectAsTemplate(item.key, item.name)));
  }

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

  // — Neu erstellen — (global, nicht auf diesen Eintrag bezogen; deshalb weit unten)
  buildCreateSubmenu(menu, plugin, "bt-new");

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
  if (sec === "templates") return listTemplates(plugin).filter((x) => x.hidden).map((x) => ({ key: x.root.path, name: x.name }));
  if (sec === "labels") return plugin.getLabels().filter((l) => !plugin.isLabelVisible(l.name)).map((l) => ({ key: l.name, name: l.name }));
  const want = sec === "areas" ? "area" : "project";
  return listManaged(plugin.app).active.filter((p) => p.type === want && p.hidden).map((p) => ({ key: p.path, name: p.name }));
}

/** Hängt „Ausgeblendete einblenden ▸" (Untermenü, ein Klick = einblenden) an, falls es welche gibt.
 *  Gibt zurück, ob etwas hinzugefügt wurde – der Aufrufer zeigt das Menü nur dann. */
/**
 * „Neu erstellen ▸" – der EINE Weg, ein Projekt, einen Bereich, ein Label, einen Filter oder eine
 * Vorlage anzulegen, ohne dass der zugehörige Abschnitt schon existiert.
 *
 * Seit die Abschnitte erst mit ihrem ersten Eintrag erscheinen, gibt es die „+ … erstellen"-
 * Hinweiszeilen nicht mehr. Für vier der fünf Typen ist das folgenlos – Projekt, Bereich und Label
 * entstehen ohnehin beim Anlegen einer Aufgabe (Projekt-Picker bzw. Label-Chip), eine Vorlage über
 * „Als Vorlage speichern" an der Aufgabenzeile. Der FILTER ist der Sonderfall: Für ihn gibt es
 * keinen zweiten Weg, sein einziger Einstieg sass im Filter-Abschnitt. Dieses Menü ist der Ersatz.
 *
 * Deshalb hängt es auch an den Zeilen, die NIE verschwinden (Eingang und die vier Ansichten) und
 * am leeren Bereich der Seitenleiste – ein Menü, das nur an Einträgen hinge, wäre auf einem
 * frischen Vault nicht erreichbar.
 */
export function buildCreateSubmenu(menu: Menu, plugin: BeautyTasksPlugin, section?: string): void {
  menu.addItem((parent) => {
    if (section) parent.setSection(section);
    parent.setTitle(t("menu_create_new")).setIcon("plus");
    const sub = parent.setSubmenu();
    const row = (key: string, icon: string, open: () => void): void => {
      sub.addItem((m) => m.setTitle(t(key)).setIcon(icon).onClick(open));
    };
    // Icons wie in der Seitenleiste: Projekt = folder, Bereich = circle, Label = hash.
    row("create_project", "folder", () => new NewItemModal(plugin, "project").open());
    row("create_area", "circle", () => new NewItemModal(plugin, "area").open());
    row("create_label", "hash", () => new NewItemModal(plugin, "label").open());
    row("create_filter", "filter", () => new FilterModal(plugin).open());
    row("create_template", "clipboard-list", () => promptNewTemplate(plugin));
  });
}

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

/** Rechtsklick auf eine Vorlage. Anwenden steht zusätzlich hier, obwohl der Klick es schon tut –
 *  wer das Menü öffnet, soll nicht raten müssen, welche Handlung die Zeile ausführt. */
export function buildTemplateMenu(plugin: BeautyTasksPlugin, tpl: TemplateInfo): Menu {
  const m = new Menu();
  m.addItem((i) => i.setTitle(t("tpl_apply_title")).setIcon("wand-sparkles")
    .onClick(() => new ApplyTemplateModal(plugin, tpl, plugin.addContext().project ?? null).open()));
  // Bearbeiten öffnet den NORMALEN Aufgaben-Editor, nur auf den Vorlagen-Bestand gestellt
  // (s. templateEditScope). Unteraufgaben, die man darin anlegt, landen im Vorlagen-Ordner.
  m.addItem((i) => i.setTitle(t("tpl_edit")).setIcon("pencil")
    // Der Projekt-Chip zeigt (und ändert) das Ziel, das sich die Vorlage merkt und das der
    // Anwenden-Dialog vorschlägt. Bei einer PROJEKTvorlage bleibt er weg: Die wird selbst zum
    // Projekt, ein eigenes Projektfeld hätte dort keine Wirkung.
    .onClick(() => new TaskModal(plugin, tpl.root, undefined, { hideProjekt: tpl.kind === "project", scope: templateEditScope(plugin, tpl.root.path) }).open()));
  m.addItem((i) => i.setTitle(t("menu_open_task_note")).setIcon("file-text")
    .onClick(() => openTaskNote(plugin.app, tpl.root.path)));
  m.addSeparator();
  m.addItem((i) => i.setTitle(tpl.hidden ? t("tip_show_sidebar") : t("tip_hide_sidebar")).setIcon(tpl.hidden ? "eye" : "eye-off")
    .onClick(() => void plugin.setTemplateVisible(tpl.root.path, tpl.hidden)));
  m.addItem((i) => i.setTitle(t("btn_rename")).setIcon("text-cursor-input")
    .onClick(() => new PromptModal(plugin.app, { title: t("btn_rename"), value: tpl.name }, (name) => {
      void renameTemplate(plugin, tpl.root.path, name).then(() => refreshTemplates(plugin));
    }).open()));
  buildCreateSubmenu(m, plugin);
  m.addSeparator();
  m.addItem((i) => i.setTitle(t("btn_delete")).setIcon("trash-2").setWarning(true)
    .onClick(() => new ConfirmModal(plugin.app, {
      title: t("confirm_delete_title", tpl.name),
      message: t("confirm_delete_body"),
    }, () => void deleteTemplate(plugin, tpl.root.path).then(() => refreshTemplates(plugin))).open()));
  return m;
}

