import { setIcon, Notice } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { listManaged, ProjItem } from "./taskService";
import { t } from "./i18n";

// Verwaltungs-Ansicht (ListManager): drei Kategorie-Tabs Projekte | Bereiche | Labels,
// darunter (Projekte/Bereiche) die Subtabs Aktiv/Archiv. Jeder Typ hat seinen eigenen
// Anlege-Weg – Bereiche entstehen nicht mehr nur per Umwandeln.
// Aktiv-Zeile: Typ umschalten · Name · Sichtbarkeit · Umbenennen · Archiv · Löschen.
// Archiv-Zeile: Name · Wiederherstellen · Endgültig löschen.

export function iconBtn(parent: HTMLElement, icon: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = parent.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
  setIcon(b.createSpan(), icon);
  b.onclick = (e) => { e.stopPropagation(); onClick(); };
  return b;
}

export function renderManageInto(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  c.empty();
  c.addClass("bt-view");
  const root = c.createDiv({ cls: "bt-sizer" });
  const redraw = () => renderManageInto(c, plugin);

  // Kopf: Überschrift links, drei Kategorie-Tabs rechts auf gleicher Höhe.
  const header = root.createDiv({ cls: "bt-manage-header" });
  const titleKey = plugin.manageSection === "labels" ? "tab_labels" : plugin.manageSection === "areas" ? "group_area" : "group_project";
  header.createEl("h1", { text: t(titleKey) });
  const sections = header.createDiv({ cls: "bt-tabs" });
  const mkSection = (id: "projects" | "areas" | "labels", label: string) => {
    const b = sections.createEl("button", { cls: "bt-tab" + (plugin.manageSection === id ? " is-active" : ""), text: label });
    b.onclick = () => { plugin.manageSection = id; renderManageInto(c, plugin); };
  };
  mkSection("projects", t("group_project"));
  mkSection("areas", t("group_area"));
  mkSection("labels", t("tab_labels"));

  if (plugin.manageSection === "labels") {
    addRow(root, t("add_label"), t("placeholder_label"), (v) => plugin.addLabel(v), redraw);
    const labels = plugin.getLabels();
    if (!labels.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_labels") }); return; }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const l of labels) labelRow(list, plugin, l, redraw);
    return;
  }

  // Projekte- ODER Bereiche-Tab: eigener Anlege-Weg je Typ (kein Umwandeln nötig mehr).
  const isAreaSection = plugin.manageSection === "areas";
  const wantType = isAreaSection ? "area" : "project";
  // Über plugin.createProject anlegen: das wartet per einmaligem metadataCache-„changed" auf
  // das geparste Frontmatter und zeichnet dann neu. Direktes createProjectNote + sofortiges
  // redraw() käme zu früh (Typ noch nicht im Cache) -> Eintrag erst nach manuellem Reload sichtbar.
  addRow(root, isAreaSection ? t("pick_new_area") : t("pick_new_project"),
    isAreaSection ? t("placeholder_area_name") : t("placeholder_project_name"),
    (v) => plugin.createProject(v, isAreaSection), redraw);

  // Darunter: Aktiv | Archiv.
  const subtabs = root.createDiv({ cls: "bt-subtabs" });
  const mkTab = (id: "active" | "archive", label: string) => {
    const b = subtabs.createEl("button", { cls: "bt-subtab" + (plugin.manageTab === id ? " is-active" : ""), text: label });
    b.onclick = () => { plugin.manageTab = id; renderManageInto(c, plugin); };
  };
  mkTab("active", t("tab_active"));
  mkTab("archive", t("tab_archive"));

  const { active, archived } = listManaged(plugin.app);

  if (plugin.manageTab === "archive") {
    const items = archived.filter((p) => p.type === wantType);
    if (!items.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_archive") }); return; }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const it of items) archiveRow(list, plugin, it, redraw);
    return;
  }

  const items = active.filter((p) => p.type === wantType);
  if (!items.length) { root.createEl("p", { cls: "bt-empty", text: t(isAreaSection ? "manage_empty_areas" : "manage_empty_projects") }); return; }
  const list = root.createDiv({ cls: "bt-manage-list" });
  for (const it of items) activeRow(list, plugin, it, redraw);
}

/** „+ Neu"-Zeile: Button, der sich beim Klick in ein Eingabefeld verwandelt (Enter = anlegen). */
function addRow(parent: HTMLElement, label: string, placeholder: string, onSubmit: (v: string) => Promise<unknown>, redraw: () => void): void {
  const wrap = parent.createDiv({ cls: "bt-manage-add" });
  const btn = wrap.createDiv({ cls: "bt-add" });
  btn.createSpan({ cls: "bt-add-icon" });
  btn.createSpan({ text: label });
  btn.onclick = () => {
    wrap.empty();
    const input = wrap.createEl("input", { type: "text", cls: "bt-manage-input", attr: { placeholder } });
    const done = () => void (async () => { const v = input.value.trim(); if (v) await onSubmit(v); redraw(); })();
    input.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); done(); }
      else if (e.key === "Escape") { e.preventDefault(); redraw(); }
    };
    window.setTimeout(() => input.focus(), 0);
  };
}

function activeRow(list: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  const isArea = it.type === "area";

  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);

  const actions = row.createDiv({ cls: "bt-manage-actions" });
  // Projekt ↔ Bereich umschalten. Icon spiegelt den aktuellen Typ: Projekt = Seitenleisten-
  // Icon (it.icon, i.d.R. „folder"), Bereich = „circle" – gleiche Farbe wie die übrigen Icons.
  iconBtn(actions, isArea ? "circle" : it.icon, isArea ? t("tip_unmark_area") : t("tip_mark_area"),
    () => void plugin.setProjectArea(it.path, !isArea));
  iconBtn(actions, it.hidden ? "eye-off" : "eye", it.hidden ? t("tip_show_sidebar") : t("tip_hide_sidebar"),
    () => void plugin.setProjectVisible(it.path, it.hidden));
  iconBtn(actions, "pencil", t("btn_rename"), () => startRename(row, plugin, it, redraw));
  // Bereiche sind wie Projekte archivier-/löschbar (eigene Kategorie im ListManager).
  iconBtn(actions, "archive", t("btn_archive"), () => void plugin.archiveProject(it.path, true));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteProject(it.path), redraw));
}

function archiveRow(list: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row is-archived" });
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "archive-restore", t("btn_restore"), () => void plugin.archiveProject(it.path, false));
  iconBtn(actions, "trash-2", t("btn_delete_forever"), () => confirmInline(actions, t("confirm_delete_forever_q"), () => void plugin.deleteProject(it.path), redraw));
}

function labelRow(list: HTMLElement, plugin: BeautyTasksPlugin, l: { name: string; count: number }, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  const name = row.createSpan({ cls: "bt-manage-name", text: "#" + l.name });
  name.onclick = () => void plugin.activateLabel(l.name);   // Verlinkung: Klick öffnet das Label-Board
  row.createSpan({ cls: "bt-manage-count", text: String(l.count) });
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  const vis = plugin.isLabelVisible(l.name);
  iconBtn(actions, vis ? "eye" : "eye-off", vis ? t("tip_hide_sidebar") : t("tip_show_sidebar"),
    () => void plugin.setLabelVisible(l.name, !vis));
  iconBtn(actions, "pencil", t("btn_rename"), () => startLabelRename(row, plugin, l, redraw));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteLabel(l.name), redraw));
}

function startLabelRename(row: HTMLElement, plugin: BeautyTasksPlugin, l: { name: string; count: number }, redraw: () => void): void {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = l.name;
  const save = async () => {
    const ok = await plugin.renameLabel(l.name, input.value);
    if (!ok) { redraw(); return; }
    redraw();
  };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); void save(); }
    else if (e.key === "Escape") { e.preventDefault(); redraw(); }
  };
  window.setTimeout(() => { input.focus(); input.select(); }, 0);
}

/** Inline-Umbenennen: ersetzt die Zeile durch ein Eingabefeld + Speichern/Abbrechen. */
function startRename(row: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem, redraw: () => void): void {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = it.name;
  const save = async () => {
    const nu = input.value.trim();
    if (!nu || nu === it.name) { redraw(); return; }
    const r = await plugin.renameProject(it.path, nu);
    if (r === null) new Notice(t("err_enter_taskname"));   // Kollision o. ä. -> Hinweis, Liste neu
    redraw();
  };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); void save(); }
    else if (e.key === "Escape") { e.preventDefault(); redraw(); }
  };
  window.setTimeout(() => { input.focus(); input.select(); }, 0);
}

/** Inline-Bestätigung: ersetzt die Aktions-Buttons durch „Frage? ✓ ✗". */
export function confirmInline(actions: HTMLElement, question: string, onConfirm: () => void, redraw: () => void): void {
  actions.empty();
  actions.addClass("bt-confirm");
  actions.createSpan({ cls: "bt-confirm-q", text: question });
  iconBtn(actions, "check", t("btn_delete"), onConfirm);
  iconBtn(actions, "x", t("btn_cancel"), redraw);
}
