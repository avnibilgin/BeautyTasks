import { setIcon, Notice } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { listManaged, ProjItem } from "./taskService";
import { listFilters, FilterItem } from "./filterService";
import { applyFilter } from "./filterEngine";
import { FilterModal } from "./filterModal";
import { statusLabel, statusIcon, statusTint, StatusKind, StoredStatus } from "./statuses";
import { NavSection, NavSortMode } from "./types";
import { todayStr } from "./format";
import { openPopover } from "./popover";
import { t } from "./i18n";

/** Sortier-Umschalter „Manuell · Name · Anzahl" (leise, aktiv = Akzent) für eine Sektion. */
function sortControl(parent: HTMLElement, plugin: BeautyTasksPlugin, sec: NavSection): void {
  const wrap = parent.createDiv({ cls: "bt-sort-control" });
  wrap.createSpan({ cls: "bt-sort-lbl", text: t("sort_by") });
  const seg = wrap.createDiv({ cls: "bt-tabs bt-layout-toggle" });
  const mk = (mode: NavSortMode, label: string) => {
    const b = seg.createEl("button", { cls: "bt-tab" + (plugin.navSortMode(sec) === mode ? " is-active" : ""), text: label });
    b.onclick = () => void plugin.setNavSort(sec, mode);
  };
  mk("manual", t("sort_manual"));
  mk("name", t("sort_name"));
  mk("count", t("sort_count"));
}

/** ↑/↓-Pfeile am Zeilenanfang (nur im Manuell-Modus) zum Verschieben. */
function reorderHandle(row: HTMLElement, plugin: BeautyTasksPlugin, sec: NavSection, key: string, i: number, n: number): void {
  const move = row.createDiv({ cls: "bt-status-move" });
  const up = iconBtn(move, "chevron-up", t("btn_move_up"), () => void plugin.moveNavItem(sec, key, -1));
  const down = iconBtn(move, "chevron-down", t("btn_move_down"), () => void plugin.moveNavItem(sec, key, 1));
  if (i === 0) up.disabled = true;
  if (i === n - 1) down.disabled = true;
  row.prepend(move);   // vor Name/Aktionen an den Zeilenanfang
}

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
  const titleKey = plugin.manageSection === "statuses" ? "tab_statuses"
    : plugin.manageSection === "filters" ? "nav_filters"
      : plugin.manageSection === "labels" ? "tab_labels"
        : plugin.manageSection === "areas" ? "group_area" : "group_project";
  header.createEl("h1", { text: t(titleKey) });
  const sections = header.createDiv({ cls: "bt-tabs" });
  const mkSection = (id: "projects" | "areas" | "labels" | "filters" | "statuses", label: string) => {
    const b = sections.createEl("button", { cls: "bt-tab" + (plugin.manageSection === id ? " is-active" : ""), text: label });
    b.onclick = () => { plugin.manageSection = id; renderManageInto(c, plugin); };
  };
  mkSection("projects", t("group_project"));
  mkSection("areas", t("group_area"));
  mkSection("labels", t("tab_labels"));
  mkSection("filters", t("nav_filters"));
  mkSection("statuses", t("tab_statuses"));

  if (plugin.manageSection === "statuses") {
    renderStatusManager(root, plugin, redraw);
    return;
  }

  if (plugin.manageSection === "filters") {
    // „+ Neuer Filter" öffnet den Editor (ein Filter braucht mehr als nur einen Namen).
    const add = root.createDiv({ cls: "bt-manage-add" });
    const btn = add.createDiv({ cls: "bt-add" });
    btn.createSpan({ cls: "bt-add-icon" });
    btn.createSpan({ text: t("filter_add") });
    btn.onclick = () => new FilterModal(plugin).open();
    const filters = listFilters(plugin.app);
    if (!filters.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_filters") }); return; }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const fl of filters) filterRow(list, plugin, fl, redraw);
    return;
  }

  if (plugin.manageSection === "labels") {
    addRow(root, t("add_label"), t("placeholder_label"), (v) => plugin.addLabel(v), redraw);
    sortControl(root, plugin, "labels");
    const labels = plugin.sortLabels(plugin.getLabels());
    if (!labels.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_labels") }); return; }
    const manual = plugin.navSortMode("labels") === "manual";
    const list = root.createDiv({ cls: "bt-manage-list" });
    labels.forEach((l, i) => labelRow(list, plugin, l, redraw, manual ? { sec: "labels", i, n: labels.length } : undefined));
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

  const sec: NavSection = isAreaSection ? "areas" : "projects";
  sortControl(root, plugin, sec);
  const items = plugin.sortProjItems(sec, active.filter((p) => p.type === wantType));
  if (!items.length) { root.createEl("p", { cls: "bt-empty", text: t(isAreaSection ? "manage_empty_areas" : "manage_empty_projects") }); return; }
  const manual = plugin.navSortMode(sec) === "manual";
  const list = root.createDiv({ cls: "bt-manage-list" });
  items.forEach((it, i) => activeRow(list, plugin, it, redraw, manual ? { sec, i, n: items.length } : undefined));
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

function activeRow(list: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem, redraw: () => void, reorder?: { sec: NavSection; i: number; n: number }): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorder) reorderHandle(row, plugin, reorder.sec, it.path, reorder.i, reorder.n);
  const isArea = it.type === "area";

  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  row.createSpan({ cls: "bt-manage-count", text: String(plugin.index.byProject(it.path).length) });   // offene Aufgaben (wie bei Labels/Status)

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

function labelRow(list: HTMLElement, plugin: BeautyTasksPlugin, l: { name: string; count: number }, redraw: () => void, reorder?: { sec: NavSection; i: number; n: number }): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorder) reorderHandle(row, plugin, reorder.sec, l.name, reorder.i, reorder.n);
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

/** Filter-Zeile im ListManager: Name (Klick öffnet das Board) · Anzahl · Sichtbarkeit ·
 *  Bearbeiten (öffnet den Filter-Editor) · Löschen. Sichtbarkeit wie bei Projekten (nav_hidden). */
function filterRow(list: HTMLElement, plugin: BeautyTasksPlugin, fl: FilterItem, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  const name = row.createSpan({ cls: "bt-manage-name", text: fl.name });
  name.onclick = () => void plugin.activateFilter(fl.path);
  row.createSpan({ cls: "bt-manage-count", text: String(applyFilter(plugin.index, fl.criteria, fl.options, todayStr()).length) });
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, fl.hidden ? "eye-off" : "eye", fl.hidden ? t("tip_show_sidebar") : t("tip_hide_sidebar"),
    () => void plugin.setFilterVisible(fl.path, fl.hidden));
  iconBtn(actions, "pencil", t("filter_edit"), () => new FilterModal(plugin, fl.path).open());
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteFilter(fl.path), redraw));
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

// ── Status-Verwaltung ────────────────────────────────────────────────
const KIND_KEY: Record<StatusKind, string> = { open: "status_kind_open", done: "status_kind_done", cancelled: "status_kind_cancelled" };
const KIND_ICON: Record<StatusKind, string> = { open: "circle", done: "check-circle", cancelled: "x-circle" };
// Kuratierte Icon-Auswahl (keine freien Lucide-Namen → nichts kann leer rendern).
const ICON_PRESETS = ["circle", "contrast", "circle-dot", "circle-dashed", "check-circle", "x-circle",
  "clock", "loader", "pause", "play", "flag", "star", "alert-circle", "eye", "inbox", "zap"];
const COLOR_PRESETS = ["#e05c4a", "#f97316", "#f59e0b", "#4caf50", "#3b82f6", "#7c5cff", "#a855f7", "#ec4899"];

function renderStatusManager(root: HTMLElement, plugin: BeautyTasksPlugin, redraw: () => void): void {
  addRow(root, t("status_add"), t("placeholder_status_name"), (v) => plugin.addStatus(v), redraw);
  root.createEl("p", { cls: "bt-manage-hint", text: t("status_hint") });
  const statuses = plugin.getStatuses();
  const list = root.createDiv({ cls: "bt-manage-list" });
  statuses.forEach((s, i) => statusRow(list, plugin, s, i, statuses.length, redraw));
}

function statusRow(list: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, i: number, n: number, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row bt-status-row" });

  // Sortier-Pfeile (mobil-sicher).
  const move = row.createDiv({ cls: "bt-status-move" });
  const up = iconBtn(move, "chevron-up", t("btn_move_up"), () => void plugin.moveStatus(s.id, -1));
  const down = iconBtn(move, "chevron-down", t("btn_move_down"), () => void plugin.moveStatus(s.id, 1));
  if (i === 0) up.disabled = true;
  if (i === n - 1) down.disabled = true;

  // Vorschau: Icon in der Status-Farbe – genau wie später auf dem Board.
  const dot = row.createSpan({ cls: "bt-status-dot" });
  setIcon(dot, statusIcon(s.id));
  dot.style.color = statusTint(s.id);

  const name = row.createSpan({ cls: "bt-manage-name bt-status-name", text: statusLabel(s.id) });
  name.onclick = () => startStatusRename(row, plugin, s, redraw);

  const cnt = plugin.statusTaskCount(s.id);
  if (cnt) row.createSpan({ cls: "bt-manage-count", text: String(cnt) });

  const actions = row.createDiv({ cls: "bt-manage-actions" });
  // kind-Pill → Popover mit den drei Arten.
  const kindBtn = actions.createEl("button", { cls: "bt-tab bt-status-kind", text: t(KIND_KEY[s.kind]) });
  kindBtn.onclick = (e) => { e.stopPropagation(); openKindPicker(kindBtn, plugin, s); };
  // Icon- und Farb-Picker.
  const iconB = iconBtn(actions, "shapes", t("status_pick_icon"), () => openIconPicker(iconB, plugin, s));
  const colB = iconBtn(actions, "palette", t("status_pick_color"), () => openColorPicker(colB, plugin, s));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteStatus(s.id), redraw));
}

function startStatusRename(row: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, redraw: () => void): void {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = statusLabel(s.id);
  const save = async () => { await plugin.renameStatus(s.id, input.value); redraw(); };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); void save(); }
    else if (e.key === "Escape") { e.preventDefault(); redraw(); }
  };
  window.setTimeout(() => { input.focus(); input.select(); }, 0);
}

function openKindPicker(anchor: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus): void {
  openPopover(anchor, (pop, close) => {
    (["open", "done", "cancelled"] as StatusKind[]).forEach((k) => {
      const row = pop.createDiv({ cls: "bt-row" + (s.kind === k ? " is-active" : "") });
      const ic = row.createSpan({ cls: "bt-row-ic" }); setIcon(ic, KIND_ICON[k]);
      row.createSpan({ cls: "bt-row-lbl", text: t(KIND_KEY[k]) });
      row.onclick = () => { void plugin.setStatusKind(s.id, k); close(); };
    });
  });
}

function openIconPicker(anchor: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus): void {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-icon-grid");
    for (const ic of ICON_PRESETS) {
      const b = pop.createEl("button", { cls: "bt-icon-cell" + (s.icon === ic ? " is-active" : ""), attr: { "aria-label": ic } });
      setIcon(b, ic);
      b.onclick = () => { void plugin.setStatusIcon(s.id, ic); close(); };
    }
  });
}

function openColorPicker(anchor: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus): void {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-color-grid");
    const none = pop.createEl("button", { cls: "bt-color-cell bt-color-none" + (!s.color ? " is-active" : ""), attr: { "aria-label": t("status_color_none") } });
    setIcon(none, "ban");
    none.onclick = () => { void plugin.setStatusColor(s.id, null); close(); };
    for (const c of COLOR_PRESETS) {
      const b = pop.createEl("button", { cls: "bt-color-cell" + (s.color === c ? " is-active" : ""), attr: { "aria-label": c } });
      b.style.setProperty("--bt-swatch", c);
      b.onclick = () => { void plugin.setStatusColor(s.id, c); close(); };
    }
  });
}

/** Inline-Bestätigung: ersetzt die Aktions-Buttons durch „Frage? ✓ ✗". */
export function confirmInline(actions: HTMLElement, question: string, onConfirm: () => void, redraw: () => void): void {
  actions.empty();
  actions.addClass("bt-confirm");
  actions.createSpan({ cls: "bt-confirm-q", text: question });
  iconBtn(actions, "check", t("btn_delete"), onConfirm);
  iconBtn(actions, "x", t("btn_cancel"), redraw);
}
