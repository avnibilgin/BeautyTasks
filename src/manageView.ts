import { setIcon, Notice, Menu } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { listManaged, ProjItem } from "./taskService";
import { listFilters, FilterItem } from "./filterService";
import { applyFilter } from "./filterEngine";
import { FilterModal } from "./filterModal";
import { buildItemMenu } from "./navMenu";
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

/** Zieh-Griff am Zeilenanfang (nur im Manuell-Modus). Ziehen ordnet die ganze Liste um –
 *  inkl. der in der Seitenleiste ausgeblendeten Einträge; ArrowUp/ArrowDown verschieben per Tastatur. */
function reorderHandle(row: HTMLElement, list: HTMLElement, plugin: BeautyTasksPlugin, sec: NavSection, key: string): void {
  row.setAttr("data-key", key);
  const grip = row.createSpan({ cls: "bt-nav-grip", attr: { role: "button", tabindex: "0", "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
  setIcon(grip, "grip-vertical");
  grip.onkeydown = (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); void plugin.moveNavItem(sec, key, -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); void plugin.moveNavItem(sec, key, 1); }
  };
  // Übersicht: Ziehen ordnet die VOLLE Reihenfolge (inkl. Ausgeblendeter) neu.
  attachRowDrag(row, grip, list, (keys) => void plugin.setNavOrder(sec, keys));
  row.prepend(grip);   // vor Farbpunkt/Name/Aktionen an den Zeilenanfang
}

/** Pointer-basiertes Umordnen einer Zeile per Griff (Maus + Touch, Popout-sicher über
 *  list.ownerDocument). Generisch: beim Loslassen bekommt `onDrop` die neue Schlüssel-Reihenfolge
 *  aus dem DOM – der Aufrufer entscheidet, wie persistiert wird (volle Liste vs. nur Sichtbare). */
export function attachRowDrag(row: HTMLElement, grip: HTMLElement, list: HTMLElement, onDrop: (keys: string[]) => void): void {
  grip.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    const doc = list.ownerDocument;   // Ziel-Fenster einmal festhalten (Rule 29a)
    row.addClass("is-dragging");
    const onMove = (me: PointerEvent) => {
      const y = me.clientY;
      const siblings = (Array.from(list.children) as HTMLElement[]).filter((el) => el !== row);
      let placed = false;
      for (const sib of siblings) {
        const r = sib.getBoundingClientRect();
        if (y < r.top + r.height / 2) { list.insertBefore(row, sib); placed = true; break; }
      }
      if (!placed) list.appendChild(row);
    };
    const onUp = () => {
      row.removeClass("is-dragging");
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      const keys = (Array.from(list.children) as HTMLElement[]).map((el) => el.getAttr("data-key")).filter((k): k is string => !!k);
      onDrop(keys);
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  });
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

  // Kopf: nur die Überschrift der aktuellen Sektion. Die Navigation zwischen den Sektionen
  // läuft jetzt über die (dauerhaft sichtbaren) Seitenleisten-Köpfe – keine Tab-Reihe mehr.
  const header = root.createDiv({ cls: "bt-manage-header" });
  const titleKey = plugin.manageSection === "filters" ? "nav_filters"
    : plugin.manageSection === "labels" ? "tab_labels"
      : plugin.manageSection === "areas" ? "group_area" : "group_project";
  header.createEl("h1", { text: t(titleKey) });
  // Aktiv/Archiv oben rechts (nur Projekte/Bereiche) – an der Stelle der früheren Tab-Reihe.
  if (plugin.manageSection === "projects" || plugin.manageSection === "areas") {
    const tabs = header.createDiv({ cls: "bt-tabs" });
    const mkTab = (id: "active" | "archive", label: string) => {
      const b = tabs.createEl("button", { cls: "bt-tab" + (plugin.manageTab === id ? " is-active" : ""), text: label });
      b.onclick = () => { plugin.manageTab = id; renderManageInto(c, plugin); };
    };
    mkTab("active", t("tab_active"));
    mkTab("archive", t("tab_archive"));
  }

  if (plugin.manageSection === "filters") {
    // „+ Neuer Filter" öffnet den Editor (ein Filter braucht mehr als nur einen Namen).
    const add = root.createDiv({ cls: "bt-manage-add" });
    const btn = add.createDiv({ cls: "bt-add" });
    btn.createSpan({ cls: "bt-add-icon" });
    btn.createSpan({ text: t("filter_add") });
    btn.onclick = () => new FilterModal(plugin).open();
    sortControl(root, plugin, "filters");
    const filters = plugin.sortFilters(listFilters(plugin.app));
    if (!filters.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_filters") }); return; }
    const manual = plugin.navSortMode("filters") === "manual";
    const list = root.createDiv({ cls: "bt-manage-list" });
    filters.forEach((fl) => filterRow(list, plugin, fl, redraw, manual ? "filters" : undefined));
    return;
  }

  if (plugin.manageSection === "labels") {
    addRow(root, t("add_label"), t("placeholder_label"), (v) => plugin.addLabel(v), redraw);
    sortControl(root, plugin, "labels");
    const labels = plugin.sortLabels(plugin.getLabels());
    if (!labels.length) { root.createEl("p", { cls: "bt-empty", text: t("manage_empty_labels") }); return; }
    const manual = plugin.navSortMode("labels") === "manual";
    const list = root.createDiv({ cls: "bt-manage-list" });
    labels.forEach((l) => labelRow(list, plugin, l, redraw, manual ? "labels" : undefined));
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
  items.forEach((it) => activeRow(list, plugin, it, redraw, manual ? sec : undefined));
}

/** „+ Neu"-Zeile: Button, der sich beim Klick in ein Eingabefeld verwandelt (Enter = anlegen). */
export function addRow(parent: HTMLElement, label: string, placeholder: string, onSubmit: (v: string) => Promise<unknown>, redraw: () => void): void {
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

/** Klickbarer Farbpunkt (zeigt die Farbe, öffnet den Picker) – ersetzt das Palette-Icon.
 *  Ohne eigene Farbe wird die Kategorie-Default-Farbe gezeigt (dieselbe wie in der Seitenleiste
 *  bei Anlegen ohne Farbwahl). previewKey = Nav-Schlüssel für die Live-Vorschau. */
function colorDot(row: HTMLElement, plugin: BeautyTasksPlugin, current: string | null, previewKey: string, defaultColor: string, onPick: (c: string | null) => void): void {
  const dot = row.createDiv({ cls: "bt-mrow-dot", attr: { "aria-label": t("status_pick_color"), "data-tooltip-position": "top" } });
  dot.style.setProperty("--c", current ?? defaultColor);
  dot.onclick = (e) => { e.stopPropagation(); openColorPicker(dot, current, onPick, { onPreview: (c) => plugin.setColorPreview(previewKey, c), onClose: () => plugin.clearColorPreview() }); };
}

/** Kalender-Sync-Schalter je Zeile (immer sichtbar → Zustand auf einen Blick). Nur wenn mit Google
 *  verbunden. Icon zeigt den Zustand (calendar-sync = an, calendar-off = aus) und schaltet per Klick.
 *  Führt den Zustand LOKAL/optimistisch – NICHT über den metadataCache neu lesen: der ist nach
 *  processFrontMatter noch stale, sonst bräuchte es zwei Klicks. */
function syncSwitch(row: HTMLElement, plugin: BeautyTasksPlugin, path: string): void {
  if (!plugin.gcalSync.canSync()) return;   // nur wenn Sync wirklich aktiv (nicht bloß verbunden)
  let excluded = plugin.isListGcalExcluded(path);
  const btn = row.createDiv({ cls: "bt-mrow-sync", attr: { role: "switch", "data-tooltip-position": "top", tabindex: "0" } });
  const paint = (): void => {
    setIcon(btn, excluded ? "calendar-off" : "calendar-sync");
    btn.toggleClass("is-off", excluded);
    btn.setAttr("aria-checked", String(!excluded));
    btn.setAttr("aria-label", excluded ? t("menu_gcal_include") : t("menu_gcal_exclude"));
  };
  paint();
  const toggle = (): void => { excluded = !excluded; paint(); void plugin.setListGcalExcluded(path, excluded); };
  btn.onclick = (e) => { e.stopPropagation(); toggle(); };
  btn.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
}

/** Sichtbarkeits-Schalter (immer sichtbar) – ersetzt das Auge-Icon. */
function visSwitch(row: HTMLElement, on: boolean, onToggle: () => void): void {
  const sw = row.createDiv({ cls: "bt-mrow-switch" + (on ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(on), "aria-label": on ? t("tip_hide_sidebar") : t("tip_show_sidebar"), "data-tooltip-position": "top", tabindex: "0" } });
  sw.onclick = (e) => { e.stopPropagation(); onToggle(); };
  sw.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onToggle(); } };
}

/** Überlauf-Kebab (Projekte/Bereiche): seltene Aktion „Umwandeln" (Projekt ↔ Bereich). */
function rowMenu(actions: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem): void {
  const kebab = actions.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": t("more_actions"), "data-tooltip-position": "top" } });
  setIcon(kebab.createSpan(), "more-horizontal");
  kebab.onclick = (e) => {
    e.stopPropagation();
    const menu = new Menu();
    buildItemMenu(menu, plugin, { sec: it.type === "area" ? "areas" : "projects", key: it.path, name: it.name, hidden: it.hidden, color: it.color, type: it.type }, "manage");
    menu.showAtMouseEvent(e);
  };
}

function activeRow(list: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem, redraw: () => void, reorderSec?: NavSection): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorderSec) reorderHandle(row, list, plugin, reorderSec, it.path);
  const isArea = it.type === "area";

  colorDot(row, plugin, it.color, it.path, isArea ? "var(--bt-nav-area)" : "var(--bt-nav-project)", (c) => void plugin.setProjectColor(it.path, c));
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);

  // Hover-Aktionen LINKS neben Zähler + Schalter; „Umwandeln" im Kebab; Schalter ganz rechts.
  const actions = row.createDiv({ cls: "bt-manage-actions bt-hover-acts" });
  iconBtn(actions, "pencil", t("btn_rename"), () => startRename(row, plugin, it, redraw));
  iconBtn(actions, "archive", t("btn_archive"), () => void plugin.archiveProject(it.path, true));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteProject(it.path), redraw));
  rowMenu(actions, plugin, it);

  row.createSpan({ cls: "bt-manage-count", text: String(plugin.index.byProject(it.path).length) });
  syncSwitch(row, plugin, it.path);
  visSwitch(row, !it.hidden, () => void plugin.setProjectVisible(it.path, it.hidden));
}

function archiveRow(list: HTMLElement, plugin: BeautyTasksPlugin, it: ProjItem, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row is-archived" });
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "archive-restore", t("btn_restore"), () => void plugin.archiveProject(it.path, false));
  iconBtn(actions, "trash-2", t("btn_delete_forever"), () => confirmInline(actions, t("confirm_delete_forever_q"), () => void plugin.deleteProject(it.path), redraw));
}

function labelRow(list: HTMLElement, plugin: BeautyTasksPlugin, l: { name: string; count: number }, redraw: () => void, reorderSec?: NavSection): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorderSec) reorderHandle(row, list, plugin, reorderSec, l.name);
  colorDot(row, plugin, plugin.getLabelColor(l.name), l.name, "var(--bt-nav-label)", (c) => void plugin.setLabelColor(l.name, c));
  const name = row.createSpan({ cls: "bt-manage-name", text: "#" + l.name });
  name.onclick = () => void plugin.activateLabel(l.name);   // Klick öffnet das Label-Board
  const actions = row.createDiv({ cls: "bt-manage-actions bt-hover-acts" });
  iconBtn(actions, "pencil", t("btn_rename"), () => startLabelRename(row, plugin, l, redraw));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteLabel(l.name), redraw));
  row.createSpan({ cls: "bt-manage-count", text: String(l.count) });
  visSwitch(row, plugin.isLabelVisible(l.name), () => void plugin.setLabelVisible(l.name, !plugin.isLabelVisible(l.name)));
}

/** Filter-Zeile im ListManager: Name (Klick öffnet das Board) · Anzahl · Sichtbarkeit ·
 *  Bearbeiten (öffnet den Filter-Editor) · Löschen. Sichtbarkeit wie bei Projekten (nav_hidden). */
function filterRow(list: HTMLElement, plugin: BeautyTasksPlugin, fl: FilterItem, redraw: () => void, reorderSec?: NavSection): void {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorderSec) reorderHandle(row, list, plugin, reorderSec, fl.path);
  colorDot(row, plugin, fl.color, fl.path, "var(--text-muted)", (c) => void plugin.setFilterColor(fl.path, c));
  const name = row.createSpan({ cls: "bt-manage-name", text: fl.name });
  name.onclick = () => void plugin.activateFilter(fl.path);
  const actions = row.createDiv({ cls: "bt-manage-actions bt-hover-acts" });
  iconBtn(actions, "sliders-horizontal", t("filter_edit"), () => new FilterModal(plugin, fl.path).open());   // Kriterien-Editor
  iconBtn(actions, "pencil", t("btn_rename"), () => startFilterRename(row, plugin, fl, redraw));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteFilter(fl.path), redraw));
  row.createSpan({ cls: "bt-manage-count", text: String(applyFilter(plugin.index, fl.criteria, fl.options, todayStr()).length) });
  visSwitch(row, !fl.hidden, () => void plugin.setFilterVisible(fl.path, fl.hidden));
}

function startFilterRename(row: HTMLElement, plugin: BeautyTasksPlugin, fl: FilterItem, redraw: () => void): void {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = fl.name;
  const save = async () => {
    const nu = input.value.trim();
    if (!nu || nu === fl.name) { redraw(); return; }
    const r = await plugin.renameFilter(fl.path, nu);
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

const COLOR_PRESETS = ["#e05c4a", "#f97316", "#f59e0b", "#4caf50", "#3b82f6", "#7c5cff", "#a855f7", "#ec4899"];

/** Generischer Farb-Picker (Status · Projekte · Bereiche · Filter): kuratiertes Raster +
 *  „keine Farbe" + eine „Custom"-Kachel für den nativen Farbwähler (Vorschlag D).
 *  onPreview (optional): Live-Vorschau beim Ziehen im nativen Wähler (kein Persistieren);
 *  onClose (optional): Aufräumen, wenn ohne Auswahl geschlossen wird (Vorschau verwerfen). */
export function openColorPicker(
  anchor: HTMLElement, current: string | null, onPick: (c: string | null) => void,
  opts: { onPreview?: (c: string) => void; onClose?: () => void } = {},
): void {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-color-grid");
    const none = pop.createEl("button", { cls: "bt-color-cell bt-color-none" + (!current ? " is-active" : ""), attr: { "aria-label": t("status_color_none") } });
    setIcon(none, "ban");
    none.onclick = () => { onPick(null); close(); };
    for (const c of COLOR_PRESETS) {
      const b = pop.createEl("button", { cls: "bt-color-cell" + (current === c ? " is-active" : ""), attr: { "aria-label": c } });
      b.style.setProperty("--bt-swatch", c);
      b.onclick = () => { onPick(c); close(); };
    }
    // „Custom": der native Farbwähler liegt als transparenter Input ÜBER der Kachel, damit
    // sich das OS-Fenster genau hier öffnet (nicht in der Bildschirmecke).
    const isPreset = !current || COLOR_PRESETS.includes(current);
    const custom = pop.createEl("button", { cls: "bt-color-cell bt-color-custom" + (isPreset ? "" : " is-active"), attr: { "aria-label": t("color_custom") } });
    if (!isPreset && current) custom.style.setProperty("--bt-swatch", current);
    else setIcon(custom, "pipette");
    const input = custom.createEl("input", { type: "color", cls: "bt-color-input" });
    if (current && /^#[0-9a-f]{6}$/i.test(current)) input.value = current;
    input.oninput = () => opts.onPreview?.(input.value);     // Live-Vorschau beim Ziehen
    input.onchange = () => { onPick(input.value); close(); };  // Bestätigen = persistieren
  }, opts.onClose);
}

/** Inline-Bestätigung: ersetzt die Aktions-Buttons durch „Frage? ✓ ✗". */
export function confirmInline(actions: HTMLElement, question: string, onConfirm: () => void, redraw: () => void): void {
  actions.empty();
  actions.addClass("bt-confirm");
  actions.createSpan({ cls: "bt-confirm-q", text: question });
  iconBtn(actions, "check", t("btn_delete"), onConfirm);
  iconBtn(actions, "x", t("btn_cancel"), redraw);
}
