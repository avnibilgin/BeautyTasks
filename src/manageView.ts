import { setIcon, Notice } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { listManaged, createProjectNote, ProjItem } from "./taskService";
import { t } from "./i18n";

// Verwaltungs-Ansicht (ListManager): Projekte + Bereiche, Tabs Aktiv/Archiv.
// Aktiv-Zeile: Area-Häkchen · Name · Sichtbarkeit · Umbenennen · Archiv · Löschen
//   (Archiv/Löschen für Bereiche gesperrt – Bereiche sind dauerhaft).
// Archiv-Zeile: Name · Wiederherstellen · Endgültig löschen.

export function iconBtn(parent: HTMLElement, icon: string, label: string, onClick: () => void): HTMLButtonElement {
  const b = parent.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
  setIcon(b.createSpan(), icon);
  b.onclick = (e) => { e.stopPropagation(); onClick(); };
  return b;
}

function lockBtn(btn: HTMLButtonElement, tip: string): void {
  btn.disabled = true;
  btn.addClass("is-locked");
  btn.setAttr("aria-label", tip);
}

export function renderManageInto(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  c.empty();
  c.addClass("bt-view");
  const root = c.createDiv({ cls: "bt-sizer" });
  const redraw = () => renderManageInto(c, plugin);

  // Kopf: Überschrift links, Kategorie-Buttons rechts auf gleicher Höhe (wie alt).
  const header = root.createDiv({ cls: "bt-manage-header" });
  header.createEl("h1", { text: plugin.manageSection === "labels" ? t("tab_labels") : t("group_project") });
  const sections = header.createDiv({ cls: "bt-tabs" });
  const mkSection = (id: "projects" | "labels", label: string) => {
    const b = sections.createEl("button", { cls: "bt-tab" + (plugin.manageSection === id ? " is-active" : ""), text: label });
    b.onclick = () => { plugin.manageSection = id; renderManageInto(c, plugin); };
  };
  mkSection("projects", t("group_project"));
  mkSection("labels", t("tab_labels"));

  if (plugin.manageSection === "labels") {
    addRow(root, t("add_label"), t("placeholder_label"), (v) => plugin.addLabel(v), redraw);
    const labels = plugin.getLabels();
    if (!labels.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_labels") }); return; }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const l of labels) labelRow(list, plugin, l, redraw);
    return;
  }

  // „Neues Projekt" zuerst (wie bei Labels); Bereiche entstehen per Umwandeln.
  addRow(root, t("pick_new_project"), t("placeholder_project_name"),
    async (v) => { await createProjectNote(plugin.app, plugin.settings, v); }, redraw);

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
    if (!archived.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_archive") }); return; }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const it of archived) archiveRow(list, plugin, it, redraw);
    return;
  }

  if (!active.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_active") }); return; }
  const group = (title: string, items: ProjItem[]) => {
    if (!items.length) return;
    root.createEl("h6", { cls: "bt-section-title bt-manage-head", text: title });
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const it of items) activeRow(list, plugin, it, redraw);
  };
  group(t("group_area"), active.filter((p) => p.type === "area"));
  group(t("group_project"), active.filter((p) => p.type === "project"));
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
  const arch = iconBtn(actions, "archive", t("btn_archive"), () => void plugin.archiveProject(it.path, true));
  const del = iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteProject(it.path), redraw));
  if (isArea) { lockBtn(arch, t("make_area_hint")); lockBtn(del, t("make_area_hint")); }
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
