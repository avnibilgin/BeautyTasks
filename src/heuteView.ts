import { ItemView, WorkspaceLeaf, TFile, setIcon, MarkdownRenderer, Component, Keymap, Menu } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { todayStr, formatDate, formatDateTime, combineDT, dueWhen, dateOf } from "./format";
import { openDatePicker } from "./datePicker";
import { listProjectsAndAreas, normalizeLabel, isAreaPath } from "./taskService";
import { listFilters, readFilter } from "./filterService";
import { applyFilter, FilterGroup } from "./filterEngine";
import { FilterModal } from "./filterModal";
import { renderManageInto, iconBtn, confirmInline } from "./manageView";
import { parseRecurrence } from "./recurrence";
import { isOpen, isDone, isCancelled, allStatuses, boardStatuses, statusLabel, statusIcon, statusColor, statusTint, firstOpenStatus, StatusKind } from "./statuses";
import { t, getLocale, projectDisplayName } from "./i18n";

// Transienter Zustand während eines Kanban-Drags (Pfad der gezogenen Karte).
let dragPath: string | null = null;

export const VIEW_PREFIX = "beautytasks-";
export type ViewId = "heute" | "demnaechst" | "wiederkehrend" | "erledigt";
export const VIEW_IDS: ViewId[] = ["heute", "demnaechst", "wiederkehrend", "erledigt"];
export const VIEW_MAIN = VIEW_PREFIX + "main";             // EINE Dashboard-Leaf für alle Ansichten
export const VIEW_NAV = VIEW_PREFIX + "nav";
export const OLD_VIEW_TYPES = VIEW_IDS.map((v) => VIEW_PREFIX + v);   // Aufräumen alter Sitzungen
export const VIEW_ICON: Record<ViewId, string> = {
  heute: "calendar-days", demnaechst: "calendar-1", wiederkehrend: "refresh-ccw", erledigt: "check-circle",
};
const TITLE_KEY: Record<ViewId, string> = { heute: "view_today", demnaechst: "view_upcoming", wiederkehrend: "view_recurring", erledigt: "view_done" };
export const viewTitle = (id: ViewId): string => t(TITLE_KEY[id]);

/** Rendert eine Dashboard-Ansicht in ein angehängtes DOM-Element (Deferred-sicher). */
export function renderViewInto(c: HTMLElement, plugin: BeautyTasksPlugin, view: ViewId): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  if (view !== "erledigt") root.createEl("h1", { text: viewTitle(view) });   // „Erledigt" bekommt einen Kopf mit Tabs (unten)

  if (view === "heute" || view === "demnaechst") {
    const add = root.createDiv({ cls: "bt-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    // Nur im Today-Dashboard „heute" vorgeben; sonst ohne Datum.
    add.onclick = () => plugin.openNewTask(undefined, undefined, view === "heute");
  }

  const idx = plugin.index;
  if (view === "heute") {
    const overdue = idx.overdue(today), dueToday = idx.dueToday(today);
    // Heute erledigte Aufgaben – wie in Projekten/Inbox als eigener, einklappbarer Erledigt-Bereich.
    const doneToday = idx.done().filter((tk) => dateOf(tk.completed ?? "") === today);   // completed ist jetzt ein Zeitstempel -> nur Datums-Teil vergleichen
    if (!overdue.length && !dueToday.length && !doneToday.length) {
      // Komplett leer: nur der einheitliche Leerzustand – keine leeren „Überfällig/Heute"-Tabellen.
      emptyState(root, VIEW_ICON.heute, "empty_nothing_today");
    } else {
      const present = renderedPaths(plugin, [...overdue, ...dueToday, ...doneToday]);
      section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
      section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
      if (doneToday.length) section(root, plugin, t("sec_done"), doneToday, today, true, false, present);
    }
  } else if (view === "demnaechst") {
    const groups = idx.upcomingByDate(today);
    const nd = idx.noDate();
    const present = renderedPaths(plugin, [...groups.flatMap((g) => g.tasks), ...nd]);
    for (const g of groups) section(root, plugin, groupLabel(g.date, today), g.tasks, today, false, false, present);
    if (nd.length) section(root, plugin, t("sec_no_date"), nd, today, false, false, present);
    if (!groups.length && !nd.length) emptyState(root, VIEW_ICON.demnaechst, "empty_nothing_scheduled");
  } else if (view === "wiederkehrend") {
    renderRecurring(root, plugin, today);
  } else {
    // „Erledigt" wie Manage: Kopf mit Titel links, Tabs (Erledigt | Papierkorb) rechts.
    const redraw = () => renderViewInto(c, plugin, view);
    const header = root.createDiv({ cls: "bt-manage-header" });
    header.createEl("h1", { text: plugin.doneTab === "trash" ? t("nav_trash") : viewTitle(view) });
    const tabs = header.createDiv({ cls: "bt-tabs" });
    const mkTab = (id: "done" | "trash", label: string) => {
      const b = tabs.createEl("button", { cls: "bt-tab" + (plugin.doneTab === id ? " is-active" : ""), text: label });
      b.onclick = () => { plugin.doneTab = id; redraw(); };
    };
    mkTab("done", t("view_done"));
    mkTab("trash", t("nav_trash"));

    if (plugin.doneTab === "trash") {
      const items = idx.cancelled();
      if (!items.length) { emptyState(root, "trash-2", "empty_trash"); return; }
      // Globale Aktionen rechtsbündig: Alle wiederherstellen (reversibel) / Papierkorb leeren (Bestätigung).
      const bar = root.createDiv({ cls: "bt-trash-actions" });
      const rAll = bar.createEl("button", { cls: "bt-trash-btn" });
      setIcon(rAll.createSpan(), "archive-restore");
      rAll.createSpan({ text: t("trash_restore_all") });
      rAll.onclick = () => void plugin.restoreAllCancelled();
      const emptyWrap = bar.createDiv({ cls: "bt-trash-act" });
      const emptyBtn = emptyWrap.createEl("button", { cls: "bt-trash-btn is-danger" });
      setIcon(emptyBtn.createSpan(), "trash-2");
      emptyBtn.createSpan({ text: t("trash_empty") });
      emptyBtn.onclick = () => confirmInline(emptyWrap, t("confirm_empty_trash_q"), () => void plugin.emptyTrash(), redraw);
      // Liste identisch zur Erledigt-Liste (dieselben Task-Zeilen), nur im Papierkorb-Modus.
      section(root, plugin, t("nav_trash"), items, today, false, true);
    } else {
      const done = idx.done();
      if (!done.length) emptyState(root, VIEW_ICON.erledigt, "empty_nothing_done");
      else section(root, plugin, t("sec_done"), done, today);
    }
  }
}

/** Offene wiederkehrende Aufgaben, gruppiert nach Intervall (Überschrift = Täglich/Wöchentlich/…). */
const RECUR_ORDER = ["recur_daily", "recur_weekly", "recur_monthly", "recur_quarterly", "recur_yearly"];
function recurKey(recurrence: string): string {
  const r = parseRecurrence(recurrence);
  if (r && r.unit === "day" && r.n === 1) return "recur_daily";
  if (r && r.unit === "week" && r.n === 1) return "recur_weekly";
  if (r && r.unit === "month" && r.n === 1) return "recur_monthly";
  if (r && r.unit === "month" && r.n === 3) return "recur_quarterly";
  if (r && r.unit === "year" && r.n === 1) return "recur_yearly";
  return "raw:" + recurrence;   // Sonderintervalle: eigene Gruppe mit dem Rohtext als Titel
}
function renderRecurring(root: HTMLElement, plugin: BeautyTasksPlugin, today: string): void {
  const recs = plugin.index.open().filter((tk) => tk.recurrence);   // open() blendet archivierte Projekte aus
  if (!recs.length) { emptyState(root, VIEW_ICON.wiederkehrend, "empty_nothing_recurring"); return; }
  const groups = new Map<string, Task[]>();
  for (const tk of recs) {
    const key = recurKey(tk.recurrence ?? "");
    const arr = groups.get(key); if (arr) arr.push(tk); else groups.set(key, [tk]);
  }
  for (const key of RECUR_ORDER) {
    const items = groups.get(key);
    if (items?.length) section(root, plugin, t(key), items.sort(byDue), today);
  }
  for (const [key, items] of groups) {
    if (key.startsWith("raw:")) section(root, plugin, key.slice(4), items.sort(byDue), today);
  }
}

/** Obsidians „Lesbare Zeilenlänge" respektieren (wie Markdown-Ansichten): Breite +
 *  Zentrierung über --file-line-width, wenn die Einstellung aktiv ist. */
function applyReadableWidth(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  const cfg = (plugin.app.vault as unknown as { getConfig?: (k: string) => unknown }).getConfig?.("readableLineLength");
  c.toggleClass("is-readable-line-width", cfg !== false);   // Standard in Obsidian = an
}

const byDue = (a: Task, b: Task) => (a.due ?? "").localeCompare(b.due ?? "");
export const projectName = (path: string): string => path.split("/").pop()!.replace(/\.md$/, "");

/** Einheitlicher Leerzustand für alle Boards: zentriert im Restraum, Icon + Text (Akzentfarbe).
 *  Struktur/Position/Style sind bewusst identisch – die Optik steuert `.bt-empty` in styles.css. */
function emptyState(root: HTMLElement, icon: string, key: string): void {
  root.addClass("is-empty");   // zentriert den Leerzustand (ersetzt :has(> .bt-empty))
  const box = root.createDiv({ cls: "bt-empty" });
  setIcon(box.createDiv({ cls: "bt-empty-ic" }), icon);
  box.createDiv({ cls: "bt-empty-text", text: t(key) });
}

/** „+ Add task"-Zeile eines Boards: links der Hinzufügen-Button, rechts ein dezenter
 *  Link zurück ins ListManager (Projekte- bzw. Labels-Tab) – wie im alten BeautyTasks.
 *  Der Link ist optional: der Eingang ist ein Systemordner (kein normales Projekt) und
 *  bekommt daher KEINEN „Projekte"-Link. */
function addBar(root: HTMLElement, plugin: BeautyTasksPlugin, onAdd: () => void,
  section?: "projects" | "areas" | "labels", linkLabel?: string): void {
  const bar = root.createDiv({ cls: "bt-board-bar" });

  const add = bar.createDiv({ cls: "bt-add" });
  add.createSpan({ cls: "bt-add-icon" });
  add.createSpan({ text: t("btn_add_task") });
  add.onclick = onAdd;

  if (!section || !linkLabel) return;
  const link = bar.createDiv({ cls: "bt-board-link", attr: { role: "button", tabindex: "0", "aria-label": linkLabel } });
  const lic = link.createSpan({ cls: "bt-board-link-ic" }); setIcon(lic, "arrow-left-square");
  link.createSpan({ text: linkLabel });
  activate(link, () => void plugin.activateManage(section));
}

/** Projekt-Board: alle Aufgaben eines Projekts, nach Status/Datum gruppiert. */
export function renderProjectBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, projectPath: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const name = projectName(projectPath);
  boardHead(root, plugin, root.createEl("h1", { text: projectDisplayName(name) }));

  // Bereich (type: area) → Board-Link „Bereiche" und ListManager-Tab „areas"; sonst „Projekte".
  // Der Eingang ist ein Systemordner: „+ Aufgabe", aber KEIN „Projekte"-Link.
  const isArea = isAreaPath(plugin.app, projectPath);
  const isInbox = name.toLowerCase() === "inbox" || name.toLowerCase() === "eingang";
  if (isInbox) addBar(root, plugin, () => plugin.openNewTask(name));
  else addBar(root, plugin, () => plugin.openNewTask(name), isArea ? "areas" : "projects", isArea ? t("group_area") : t("group_project"));

  // Nach Namen vergleichen: gleichnamige Notizen (altes Board/Liste vs. Projekt-Notiz)
  // hätten sonst verschiedene Pfade -> der Wikilink trifft evtl. die falsche.
  const want = name;
  const tasks = plugin.index.all().filter((t) => t.project != null && projectName(t.project) === want);
  const open = tasks.filter((t) => isOpen(t.status));
  const overdue = open.filter((t) => t.due && t.due < today).sort(byDue);
  const dueToday = open.filter((t) => t.due === today);
  const upcoming = open.filter((t) => t.due && t.due > today).sort(byDue);
  const noDate = open.filter((t) => !t.due);
  const done = tasks.filter((t) => isDone(t.status)).sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));

  if (!tasks.length) {
    // Eingang und Bereich bekommen einen eigenen Text/Icon; sonst der generische Projekt-Leerzustand.
    if (isInbox) emptyState(root, "inbox", "empty_no_inbox_tasks");
    else if (isArea) emptyState(root, "circle-small", "empty_no_area_tasks");
    else emptyState(root, "folder", "empty_no_project_tasks");
    return;
  }
  // Kanban-Layout: Spalten = Status, Karten ziehbar. Sonst die klassische Liste.
  if (plugin.settings.boardLayout === "board") {
    renderKanbanBoard(root, plugin, tasks, today, (status) => plugin.openNewTask(name, undefined, false, status));
    return;
  }
  const present = renderedPaths(plugin, [...open, ...done]);
  if (overdue.length) section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
  if (dueToday.length) section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
  if (upcoming.length) section(root, plugin, t("sec_upcoming"), upcoming, today, false, false, present);
  if (noDate.length) section(root, plugin, t("sec_no_date"), noDate, today, false, false, present);
  if (done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}

/** Label-Board: alle Aufgaben mit einem Label, nach Status/Datum gruppiert (wie Projekt-Board). */
export function renderLabelBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, label: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  boardHead(root, plugin, root.createEl("h1", { cls: "bt-label-title", text: "#" + label }));

  addBar(root, plugin, () => plugin.openNewTask(undefined, label), "labels", t("tab_labels"));

  const tasks = plugin.index.all().filter((tk) => tk.labels.includes(label) && !plugin.index.isProjectArchived(tk.project));
  const open = tasks.filter((tk) => isOpen(tk.status));
  const overdue = open.filter((tk) => tk.due && tk.due < today).sort(byDue);
  const dueToday = open.filter((tk) => tk.due === today);
  const upcoming = open.filter((tk) => tk.due && tk.due > today).sort(byDue);
  const noDate = open.filter((tk) => !tk.due);
  const done = tasks.filter((tk) => isDone(tk.status)).sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));

  if (!tasks.length) { emptyState(root, "hash", "empty_no_label_tasks"); return; }
  // Kanban-Layout auch fürs Label-Board: „+ Aufgabe" legt mit Label + Spalten-Status an.
  if (plugin.settings.boardLayout === "board") {
    renderKanbanBoard(root, plugin, tasks, today, (status) => plugin.openNewTask(undefined, label, false, status));
    return;
  }
  const present = renderedPaths(plugin, [...open, ...done]);
  if (overdue.length) section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
  if (dueToday.length) section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
  if (upcoming.length) section(root, plugin, t("sec_upcoming"), upcoming, today, false, false, present);
  if (noDate.length) section(root, plugin, t("sec_no_date"), noDate, today, false, false, present);
  if (done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}

/** Aufgaben eines Filter-Boards in Abschnitte gruppieren (Reihenfolge innerhalb bleibt die
 *  bereits von applyFilter gesetzte Sortierung). „none" = ein Abschnitt. */
function filterGroups(plugin: BeautyTasksPlugin, tasks: Task[], group: FilterGroup, today: string): { title: string; tasks: Task[] }[] {
  if (group === "none") return [{ title: t("sec_tasks"), tasks }];
  const buckets = new Map<string, { title: string; tasks: Task[]; order: number }>();
  const push = (key: string, title: string, order: number, tk: Task): void => {
    let b = buckets.get(key);
    if (!b) { b = { title, tasks: [], order }; buckets.set(key, b); }
    b.tasks.push(tk);
  };
  const prioKey = (p: string): string => p === "highest" ? "prio_1" : p === "high" ? "prio_2" : p === "medium" ? "prio_3" : "prio_4";
  const prioOrder = (p: string): number => p === "highest" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3;
  for (const tk of tasks) {
    if (group === "date") {
      if (tk.due && tk.due < today) push("overdue", t("sec_overdue"), 0, tk);
      else if (tk.due === today) push("today", t("sec_today"), 1, tk);
      else if (tk.due && tk.due > today) push("upcoming", t("sec_upcoming"), 2, tk);
      else push("nodate", t("sec_no_date"), 3, tk);
    } else if (group === "priority") {
      const k = prioKey(tk.priority);
      push(k, t(k), prioOrder(tk.priority), tk);
    } else {   // project
      if (tk.project) { const nm = projectName(tk.project); push("p:" + nm, "#" + projectDisplayName(nm), 1, tk); }
      else push("none", t("no_project"), 0, tk);
    }
  }
  return [...buckets.values()].sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));
}

/** Filter-Board: die Treffer eines gespeicherten Filters, sortiert/gruppiert nach seinen
 *  Optionen. Layout (Liste/Kanban) folgt – wie Projekte – dem globalen Umschalter. */
export function renderFilterBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, filterPath: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const filter = readFilter(plugin.app, filterPath);
  if (!filter) { emptyState(root, "tag", "empty_no_filter"); return; }

  // Kopf: Titel + Bearbeiten (öffnet den Editor) + globaler Layout-Umschalter.
  const head = root.createDiv({ cls: "bt-board-head" });
  const titleWrap = head.createDiv({ cls: "bt-filter-title" });
  titleWrap.createEl("h1", { text: filter.name });
  iconBtn(titleWrap, "settings-2", t("filter_edit"), () => new FilterModal(plugin, filterPath).open());
  layoutToggle(head, plugin);

  addBar(root, plugin, () => plugin.openNewTask());

  const tasks = applyFilter(plugin.index, filter.criteria, filter.options, today);
  if (!tasks.length) { emptyState(root, filter.icon, "empty_no_filter_tasks"); return; }

  if (plugin.settings.boardLayout === "board") {
    renderKanbanBoard(root, plugin, tasks, today, (status) => plugin.openNewTask(undefined, undefined, false, status));
    return;
  }
  const present = renderedPaths(plugin, tasks);
  for (const g of filterGroups(plugin, tasks, filter.options.group, today)) {
    if (g.tasks.length) section(root, plugin, g.title, g.tasks, today, false, false, present);
  }
}

// ── Board-Kopf mit Layout-Umschalter (Liste ⇆ Kanban) ───────────────
/** Board-Überschrift: übergebenen Titel + rechts den Layout-Umschalter in eine
 *  Kopfzeile packen (der Titel wurde vom Aufrufer bereits erzeugt). */
function boardHead(root: HTMLElement, plugin: BeautyTasksPlugin, titleEl: HTMLElement): void {
  const head = root.createDiv({ cls: "bt-board-head" });
  head.appendChild(titleEl);
  layoutToggle(head, plugin);
}

/** Segmentierter Umschalter „Liste | Board". Persistiert global in den Einstellungen
 *  und zeichnet die Dashboard-Leaf neu. */
function layoutToggle(parent: HTMLElement, plugin: BeautyTasksPlugin): void {
  const seg = parent.createDiv({ cls: "bt-tabs bt-layout-toggle" });
  const mk = (mode: "list" | "board", label: string): void => {
    const b = seg.createEl("button", { cls: "bt-tab" + (plugin.settings.boardLayout === mode ? " is-active" : ""), text: label });
    b.onclick = () => {
      if (plugin.settings.boardLayout === mode) return;
      plugin.settings.boardLayout = mode;
      void plugin.saveSettings();
      plugin.renderMain();
    };
  };
  mk("list", t("layout_list"));
  mk("board", t("layout_board"));
}

// ── Kanban-Board (Spalten = Status, Karten per Drag-and-Drop verschiebbar) ──
/** Innerhalb einer Spalte sortieren: „erledigt" nach Abschlusszeit (neueste oben),
 *  offene Spalten datiert zuerst (aufsteigend), Datumlose ans Ende. */
function sortColumn(list: Task[], kind: StatusKind): Task[] {
  if (kind === "done") return list.sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  return list.sort((a, b) => (a.due ?? "9999-99-99").localeCompare(b.due ?? "9999-99-99") || a.title.localeCompare(b.title));
}

/** Eine Spalte als Drop-Ziel verdrahten: Loslassen setzt den Status der gezogenen Karte. */
function setupColumnDnd(colEl: HTMLElement, status: string, plugin: BeautyTasksPlugin): void {
  colEl.addEventListener("dragover", (e) => {
    if (!dragPath) return;                       // nur eigene Karten (kein Vault-Drag)
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    colEl.addClass("is-drop");
  });
  colEl.addEventListener("dragleave", (e) => {
    if (!colEl.contains(e.relatedTarget as Node | null)) colEl.removeClass("is-drop");
  });
  colEl.addEventListener("drop", (e) => {
    e.preventDefault();
    colEl.removeClass("is-drop");
    const path = e.dataTransfer?.getData("text/plain") || dragPath;
    dragPath = null;
    if (!path) return;
    const task = plugin.index.get(path);
    if (task && task.status !== status) void plugin.setTaskStatus(task, status);
  });
}

/** Kanban-Board zeichnen: je Board-Status eine Spalte mit ziehbaren Karten und
 *  einem „+ Aufgabe", das direkt mit dem Spalten-Status anlegt. */
function renderKanbanBoard(root: HTMLElement, plugin: BeautyTasksPlugin, tasks: Task[], today: string,
  addInStatus: (status: Task["status"]) => void): void {
  root.addClass("bt-sizer-board");   // Kanban nutzt volle Pane-Breite statt Lesebreite
  const board = root.createDiv({ cls: "bt-kanban" });
  for (const col of boardStatuses()) {
    const colEl = board.createDiv({ cls: "bt-kanban-col" });
    colEl.dataset.status = col.id;
    setupColumnDnd(colEl, col.id, plugin);

    const head = colEl.createDiv({ cls: "bt-kanban-head" });
    head.createSpan({ cls: "bt-kanban-dot" }).style.background = statusTint(col.id);
    head.createSpan({ cls: "bt-kanban-title", text: statusLabel(col.id) });
    const colTasks = sortColumn(tasks.filter((tk) => tk.status === col.id), col.kind);
    head.createSpan({ cls: "bt-kanban-count", text: String(colTasks.length) });

    const listEl = colEl.createDiv({ cls: "bt-kanban-list" });
    for (const tk of colTasks) renderTask(listEl, plugin, tk, today, 0, false, { flat: true, draggable: true });

    const add = colEl.createDiv({ cls: "bt-kanban-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    add.onclick = () => addInStatus(col.id);
  }
}

function groupLabel(dateISO: string, today: string): string {
  const lbl = formatDate(dateISO, today);
  if (lbl === t("date_today") || lbl === t("date_tomorrow") || lbl === t("date_yesterday")) return lbl;
  const wd = new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(dateISO + "T00:00:00"));
  return wd + ", " + lbl;
}

/** Alle Pfade, die in dieser Ansicht real gerendert werden: die Anker-Aufgaben plus ihre
 *  (nicht abgebrochenen) Nachfahren, die renderTask verschachtelt zeichnet. Basis für
 *  Variante A – eine Unteraufgabe gilt als „im Parent aufgehoben", wenn ihr Parent hier
 *  gerendert wird; ist er es nicht, wird die Unteraufgabe eigenständig angezeigt. */
function renderedPaths(plugin: BeautyTasksPlugin, anchors: Task[]): Set<string> {
  const present = new Set<string>();
  const walk = (tk: Task): void => {
    if (present.has(tk.path)) return;
    present.add(tk.path);
    for (const kid of plugin.index.children(tk.path)) if (!isCancelled(kid.status)) walk(kid);
  };
  for (const a of anchors) walk(a);
  return present;
}

function section(parent: HTMLElement, plugin: BeautyTasksPlugin, title: string, tasks: Task[], today: string, collapsible = false, trash = false, present?: Set<string>): void {
  // Variante A: Unteraufgaben werden verschachtelt unter ihrem Parent gezeigt, WENN dieser
  // in der Ansicht vorkommt (present). Fehlt der Parent in der Ansicht, erscheint die
  // Unteraufgabe eigenständig als eigene Zeile – statt ganz zu verschwinden.
  // Ohne present (z. B. Papierkorb/Wiederkehrend/Erledigt): altes Verhalten (nur verschachtelt).
  const top = trash ? tasks : tasks.filter((x) => !x.parent || (present !== undefined && !present.has(x.parent)));
  const sec = parent.createDiv({ cls: "bt-section" });
  const head = sec.createEl("h6", { cls: "bt-section-title" });
  head.createSpan({ cls: "bt-section-lbl", text: title });
  head.createSpan({ cls: "bt-section-count", text: String(top.length) });   // Anzahl direkt neben dem Titel
  const list = sec.createDiv({ cls: "bt-list" });
  for (const task of top) renderTask(list, plugin, task, today, 0, trash);
  annotateSubtaskTree(list);

  if (collapsible) {
    // Einklappbar (z. B. „Erledigt"): Chevron rechts in der Überschrift, Klick toggelt.
    sec.addClass("bt-collapsible");
    const chev = head.createSpan({ cls: "bt-collapse-ic" });
    const apply = () => { sec.toggleClass("is-collapsed", plugin.doneCollapsed); setIcon(chev, plugin.doneCollapsed ? "chevron-right" : "chevron-down"); };
    apply();
    head.onclick = () => { plugin.doneCollapsed = !plugin.doneCollapsed; apply(); };
  }
}

/** Subtask-Baum-Marker in EINEM Durchlauf setzen (statt Nachbar-`:has` in CSS, das breite
 *  Invalidierung auslöst): pro Liste die Zeilen durchgehen und
 *  - `bt-has-sub`  auf eine Hauptaufgabe, direkt gefolgt von einer Unteraufgabe (Rail + keine Trennlinie),
 *  - `bt-last-sub` auf eine Unteraufgabe, der KEINE weitere folgt (└-Ecke + Abschlusslinie). */
function annotateSubtaskTree(list: HTMLElement): void {
  const rows = Array.from(list.children) as HTMLElement[];
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.hasClass("bt-task")) continue;
    const next = rows[i + 1];
    const nextIsSub = !!next && next.hasClass("bt-task") && next.hasClass("bt-subtask");
    if (row.hasClass("bt-subtask")) row.toggleClass("bt-last-sub", !nextIsSub);
    else row.toggleClass("bt-has-sub", nextIsSub);
  }
}

// Marker, die einen Link andeuten – nur dann als Markdown rendern (Performance-Guard).
const LINK_MARKERS = /\[\[|]\(|https?:\/\/|obsidian:\/\//;

/** Text in die Zeile schreiben. Enthält er Link-Marker, als (inline) Markdown rendern –
 *  klickbare Wikilinks/URLs/obsidian-Links; sonst schneller Plaintext-Pfad. Genutzt für
 *  Aufgabentitel UND Beschreibungs-Vorschau. */
function renderLinkedText(el: HTMLElement, plugin: BeautyTasksPlugin, text: string, sourcePath: string): void {
  if (!LINK_MARKERS.test(text) || !plugin.titleRenderComp) { el.setText(text); return; }
  el.addClass("bt-md-inline");
  void MarkdownRenderer.render(plugin.app, text, el, sourcePath, plugin.titleRenderComp)
    .catch(() => { el.empty(); el.setText(text); });   // Fallback: Plaintext
  // Klick auf einen Link öffnet den Link (statt das Edit-Modal der Zeile).
  el.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    if (a.classList.contains("internal-link")) {
      const href = a.getAttribute("data-href") || a.getAttribute("href") || "";
      void plugin.app.workspace.openLinkText(href, sourcePath, Keymap.isModEvent(e));
    } else {
      const href = a.getAttribute("href");
      if (href) window.open(href);
    }
  });
}

function renderTask(list: HTMLElement, plugin: BeautyTasksPlugin, task: Task, today: string, depth: number, trash = false,
  opts: { flat?: boolean; draggable?: boolean } = {}): void {
  const row = list.createDiv({ cls: "bt-task" + (depth ? " bt-subtask" : "") });
  if (depth) row.style.setProperty("--bt-depth", String(depth));
  row.dataset.path = task.path;
  if (isDone(task.status)) row.addClass("is-done");
  if (trash) row.addClass("is-cancelled");
  plugin.applyFlash(row, task.path);   // aus der Suche angesprungen? -> hervorheben + ins Bild scrollen

  // Kanban-Karte: per HTML5-Drag zwischen Status-Spalten verschiebbar (Desktop).
  if (opts.draggable && !trash) {
    row.setAttr("draggable", "true");
    row.addEventListener("dragstart", (e) => {
      dragPath = task.path;
      row.addClass("is-dragging");
      e.dataTransfer?.setData("text/plain", task.path);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => { dragPath = null; row.removeClass("is-dragging"); });
  }

  const check = row.createDiv({ cls: "bt-check" });
  if (trash) { check.addClass("bt-check-x"); setIcon(check, "x"); }   // Papierkorb: × im Kreis (wie das x-circle-Status-Icon)
  else if (isDone(task.status)) {
    check.addClass("is-done");
    const c = statusColor(task.status);
    if (c) { check.style.backgroundColor = c; check.style.borderColor = c; }   // eigene Farbe, sonst Default-Grau
  }
  else {
    // Jede offene Phase außer der ersten (To-Do = leerer Kreis) zeigt ihr Icon in ihrer Farbe.
    if (task.status !== firstOpenStatus()) {
      check.addClass("bt-check-status");
      setIcon(check, statusIcon(task.status));
      check.style.setProperty("--bt-status-col", statusTint(task.status));
    } else {
      const c = statusColor(task.status);
      if (c) check.style.borderColor = c;   // To-Do: Ring nur tönen, wenn eine eigene Farbe gesetzt ist
    }
    // Priorität als farbiger Checkbox-Ring (wie altes BeautyTasks): höchste=rot, hoch=orange,
    // mittel=blau; normal/niedrig neutral. Ring + Status-Icon überlagern sich sauber.
    if (task.priority === "highest" || task.priority === "high" || task.priority === "medium") check.dataset.prio = task.priority;
  }
  if (!trash) attachCheckActions(check, plugin, task);

  const body = row.createDiv({ cls: "bt-body" });
  renderLinkedText(body.createDiv({ cls: "bt-title" }), plugin, task.title, task.path);

  // Beschreibungs-Vorschau (einzeilig, gekürzt) – optional per Einstellung.
  if (plugin.settings.showDescriptionInList) {
    const desc = plugin.index.descriptionOf(task.path).replace(/\s+/g, " ").trim();
    if (desc) renderLinkedText(body.createDiv({ cls: "bt-desc" }), plugin, desc, task.path);
  }

  const meta = body.createDiv({ cls: "bt-meta" });
  if (task.due) {
    const chip = meta.createSpan({ cls: "bt-chip bt-due", text: formatDateTime(combineDT(task.due, task.dueTime), today) });
    chip.dataset.when = dueWhen(task.due, today);
    chip.onclick = (e) => {
      e.stopPropagation();
      openDatePicker(chip, combineDT(task.due!, task.dueTime), (v) => void plugin.setTaskDate(task, "due", v),
        { value: task.duration, onChange: (d) => void plugin.setTaskDuration(task, d) });
    };
  }
  if (task.recurrence) meta.createSpan({ cls: "bt-chip bt-recur" });
  for (const l of task.labels) meta.createSpan({ cls: "bt-chip bt-label", text: l });
  if (task.scheduled) {
    const chip = meta.createSpan({ cls: "bt-chip bt-sched", text: formatDateTime(combineDT(task.scheduled, task.scheduledTime), today) });
    chip.onclick = (e) => { e.stopPropagation(); openDatePicker(chip, combineDT(task.scheduled!, task.scheduledTime), (v) => void plugin.setTaskDate(task, "scheduled", v)); };
  }
  // Kommentare/Anhänge: Büroklammer + dezente Anzahl (wie Todoist). Klick öffnet die Aufgabe.
  const comments = plugin.index.commentsOf(task.path);
  if (comments > 0) {
    const chip = meta.createSpan({ cls: "bt-comments" });
    const ic = chip.createSpan({ cls: "bt-comments-ic" }); setIcon(ic, "paperclip");
    chip.createSpan({ cls: "bt-comments-n", text: String(comments) });
  }

  if (trash) {
    // Papierkorb: rechts zwei Icons – Wiederherstellen + Endgültig löschen (mit Bestätigung).
    const acts = row.createDiv({ cls: "bt-task-actions" });
    iconBtn(acts, "archive-restore", t("btn_restore"), () => void plugin.restoreTask(task));
    iconBtn(acts, "trash-2", t("btn_delete_forever"),
      () => confirmInline(acts, t("confirm_delete_forever_q"), () => void plugin.deleteTaskForever(task.path), () => plugin.renderAll()));
  } else if (task.project && !plugin.currentProject && depth === 0) {
    // In einem Projekt-/Inbox-Board ist der Projektname redundant -> ausblenden; sonst sichtbar.
    // Ebenso bei verschachtelten Unteraufgaben (depth > 0): der Parent darüber zeigt dasselbe
    // Projekt bereits – nur auf Ebene 0 (Hauptaufgabe ODER promotete Unteraufgabe) anzeigen.
    const extras = row.createDiv({ cls: "bt-extras" });
    const name = task.project.split("/").pop()!.replace(/\.md$/, "");
    const bl = extras.createEl("a", { cls: "bt-backlink", text: "#" + projectDisplayName(name) });
    bl.onclick = (e) => { e.stopPropagation(); openPath(plugin, task.project!); };
  }
  // Klick auf die Zeile öffnet die Aufgabe (kein separater Stift – wäre redundant).
  row.onclick = () => plugin.openEditTask(task);

  // Unteraufgaben verschachtelt darunter (eingerückt nach Tiefe) – nicht im Papierkorb
  // und nicht im flachen Kanban-Kartenmodus.
  if (!trash && !opts.flat) for (const kid of plugin.index.children(task.path)) {
    if (!isCancelled(kid.status)) renderTask(list, plugin, kid, today, depth + 1);
  }
}

/** Checkbox-Interaktion: Links-Klick erledigt (⇄ offen); Rechtsklick/Long-Press öffnet das
 *  Status-Menü. Der Long-Press deckt Mobile ab (dort gibt es keinen Rechtsklick). */
function attachCheckActions(check: HTMLElement, plugin: BeautyTasksPlugin, task: Task): void {
  let longFired = false;
  check.onclick = (e) => {
    e.stopPropagation();
    if (longFired) { longFired = false; return; }   // Long-Press hat das Menü schon geöffnet
    void plugin.toggleDone(task);
  };
  check.addEventListener("contextmenu", (e) => {
    e.preventDefault(); e.stopPropagation();
    showStatusMenu(plugin, task, e.clientX, e.clientY);
  });
  // Touch: Long-Press (~500 ms) öffnet dasselbe Menü.
  let timer: number | null = null;
  const clear = () => { if (timer !== null) { window.clearTimeout(timer); timer = null; } };
  check.addEventListener("touchstart", (e) => {
    const p = e.touches[0];
    const x = p.clientX, y = p.clientY;
    longFired = false;
    timer = window.setTimeout(() => { timer = null; longFired = true; showStatusMenu(plugin, task, x, y); }, 500);
  }, { passive: true });
  check.addEventListener("touchend", clear);
  check.addEventListener("touchmove", clear);
  check.addEventListener("touchcancel", clear);
}

/** Status-Kontextmenü der Checkbox: To-Do · In Arbeit · Erledigt · (Abbrechen → Papierkorb).
 *  Setzt den Status live (setTaskStatus kümmert sich um Zeitstempel/Wiederholung). */
function showStatusMenu(plugin: BeautyTasksPlugin, task: Task, x: number, y: number): void {
  const menu = new Menu();
  for (const s of allStatuses()) {
    if (s.kind === "cancelled") menu.addSeparator();   // Abbrechen von den Arbeits-Status trennen
    menu.addItem((it) => {
      it.setTitle(s.kind === "cancelled" ? t("menu_cancel_task") : statusLabel(s.id));
      it.setIcon(statusIcon(s.id));
      it.setChecked(task.status === s.id);
      it.onClick(() => {
        if (s.kind === "cancelled") void plugin.cancelTask(task);
        else void plugin.setTaskStatus(task, s.id);
      });
    });
  }
  menu.showAtPosition({ x, y });
}

function openPath(plugin: BeautyTasksPlugin, path: string): void {
  const f = plugin.app.vault.getAbstractFileByPath(path);
  if (f instanceof TFile) void plugin.app.workspace.getLeaf(false).openFile(f);
}

// ── Linke Navigation ─────────────────────────────────────────────
interface NavItemOpts { cls?: string; icon: string; iconColor?: string | null; label: string; count?: number; active?: boolean; onClick: () => void; }

/** Div klick- UND tastaturbedienbar machen (role=button/tabindex kommen vom Aufrufer):
 *  Klick + Enter/Space lösen dieselbe Aktion aus. So bleibt die Optik 1:1 wie zuvor. */
function activate(el: HTMLElement, handler: () => void): void {
  el.onclick = handler;
  el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); } };
}

/** Ein Nav-Eintrag (Div wie bisher, aber per role=button/tabindex tastaturbedienbar). */
function navItem(c: HTMLElement, o: NavItemOpts): void {
  const item = c.createDiv({ cls: "bt-nav-item" + (o.active ? " is-active" : "") + (o.cls ? " " + o.cls : ""), attr: { role: "button", tabindex: "0" } });
  const ic = item.createSpan({ cls: "bt-nav-ic" }); setIcon(ic, o.icon); if (o.iconColor) ic.setCssStyles({ color: o.iconColor });
  item.createSpan({ cls: "bt-nav-lbl", text: o.label });
  if (o.count) item.createSpan({ cls: "bt-nav-count", text: String(o.count) });
  activate(item, o.onClick);
}

/** Ein-/ausklappbare Abschnittsüberschrift: Chevron-Toggle (Zustand persistent) + „+",
 *  das nur beim Hover/Fokus der Zeile erscheint. Gibt zurück, ob der Abschnitt eingeklappt ist. */
function navHead(c: HTMLElement, plugin: BeautyTasksPlugin, id: string, title: string,
  tip: string, placeholder: string, redraw: () => void, submit: (v: string) => Promise<unknown>,
  onAddClick?: () => void): boolean {
  const collapsed = plugin.isNavCollapsed(id);
  const head = c.createDiv({ cls: "bt-nav-head" });

  // Label links (füllt die Zeile) = tastatur-/klickbarer Umschalter.
  const toggle = head.createDiv({ cls: "bt-nav-head-toggle", attr: { role: "button", tabindex: "0", "aria-expanded": String(!collapsed) } });
  toggle.createSpan({ cls: "bt-nav-head-lbl", text: title });
  activate(toggle, () => void plugin.toggleNavSection(id));

  // „+" (nur bei Hover/Fokus) direkt links vom Chevron.
  const add = head.createDiv({ cls: "bt-nav-head-add", attr: { role: "button", tabindex: "0", "aria-label": tip, "data-tooltip-position": "top" } });
  setIcon(add, "plus");
  activate(add, () => {
    if (onAddClick) { onAddClick(); return; }   // Sektionen mit eigenem Editor (z. B. Filter) öffnen ein Modal statt Inline-Eingabe
    const input = createEl("input", { type: "text", cls: "bt-nav-add-input", attr: { placeholder } });
    head.insertAdjacentElement("afterend", input);
    const close = () => { input.onblur = null; redraw(); };
    const commit = () => void (async () => {
      input.onblur = null;
      const v = input.value.trim();
      if (v) {
        await submit(v);
        plugin.settings.navCollapsed[id] = false;   // neu Angelegtes soll sichtbar sein
        await plugin.saveSettings();
      }
      redraw();
    })();
    input.onkeydown = (e2) => {
      if (e2.key === "Enter") { e2.preventDefault(); commit(); }
      else if (e2.key === "Escape") { e2.preventDefault(); close(); }
    };
    input.onblur = close;
    window.setTimeout(() => input.focus(), 0);
  });

  // Chevron ganz rechts (über der Badge-Spalte). Tastatur läuft über den Label-Toggle,
  // daher hier nur Maus-Affordanz + Zustandsanzeige (aria-hidden, nicht tabbierbar).
  const chev = head.createDiv({ cls: "bt-nav-head-chevron", attr: { "aria-hidden": "true" } });
  setIcon(chev, collapsed ? "chevron-right" : "chevron-down");
  chev.onclick = () => void plugin.toggleNavSection(id);

  return collapsed;
}

export function renderNavInto(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  c.empty();
  c.addClass("bt-nav");
  const redraw = () => renderNavInto(c, plugin);

  const { eingang, bereiche, projekte } = listProjectsAndAreas(plugin.app);
  // Live-Vorschau der Icon-Farbe (Farb-Picker): überschreibt für EINEN Eintrag die gespeicherte Farbe.
  const navColor = (path: string, stored: string | null): string | null =>
    plugin.colorPreview?.key === path ? plugin.colorPreview.color : stored;

  // „Aufgabe hinzufügen" ganz oben (Todoist-Stil): öffnet die kompakte Schnell-Erfassung.
  navItem(c, { cls: "bt-nav-add-task", icon: "sparkles", label: t("btn_add_task"), onClick: () => plugin.openQuickAdd() });

  // „Suchen" darunter: öffnet die Aufgaben-Suche (Command-Palette-Stil).
  navItem(c, { cls: "bt-nav-search", icon: "search", label: t("nav_search"), onClick: () => plugin.openSearch() });

  // Inbox ganz oben, OHNE Abschnittsüberschrift (über den Ansichten).
  if (eingang && !eingang.hidden) {
    navItem(c, {
      cls: "bt-nav-inbox", icon: eingang.icon, iconColor: navColor(eingang.path, eingang.color), label: projectDisplayName(eingang.name),
      count: plugin.index.byProject(eingang.path).length, active: plugin.currentProject === eingang.path,
      onClick: () => void plugin.activateProject(eingang.path),
    });
  }

  for (const id of VIEW_IDS) {
    const active = !plugin.currentProject && !plugin.currentLabel && !plugin.manageOpen && plugin.currentView === id;
    // Klasse pro Board (bt-nav-heute …) für einzeln themebare Icon-Farben.
    navItem(c, { cls: "bt-nav-" + id, icon: VIEW_ICON[id], label: viewTitle(id), count: navCount(plugin, id), active, onClick: () => void plugin.activateView(id) });
  }

  // cls = Kategorie-Klasse (bt-nav-area / bt-nav-project) für eine gemeinsame Icon-Farbe je Gruppe.
  const projItems = (items: { name: string; path: string; icon: string; color: string | null; hidden: boolean }[], cls: string) => {
    for (const p of items.filter((x) => !x.hidden)) {   // in der Verwaltung ausgeblendete weglassen
      navItem(c, {
        cls, icon: p.icon, iconColor: navColor(p.path, p.color), label: p.name, count: plugin.index.byProject(p.path).length,
        active: plugin.currentProject === p.path, onClick: () => void plugin.activateProject(p.path),
      });
    }
  };

  // Filter-Sektion (ÜBER den Labels): „+" öffnet den Filter-Editor (Modal statt Inline-Eingabe –
  // ein Filter braucht mehr als nur einen Namen). Jeder Filter zeigt seine Live-Trefferzahl.
  const today = todayStr();
  const filters = plugin.sortFilters(listFilters(plugin.app));
  const filtersCollapsed = navHead(c, plugin, "filters", t("nav_filters"), t("filter_add"), "", redraw,
    async () => undefined, () => new FilterModal(plugin).open());
  if (!filtersCollapsed) for (const fl of filters) {
    if (fl.hidden) continue;   // im ListManager ausgeblendete Filter nicht in der Nav zeigen
    navItem(c, {
      cls: "bt-nav-filter", icon: fl.icon, iconColor: navColor(fl.path, fl.color), label: fl.name,
      count: applyFilter(plugin.index, fl.criteria, fl.options, today).length,
      active: plugin.currentFilter === fl.path, onClick: () => void plugin.activateFilter(fl.path),
    });
  }

  // Labels-Sektion (über den Bereichen): Header mit Chevron + „+", darunter die sichtbaren Labels.
  const labelsCollapsed = navHead(c, plugin, "labels", t("tab_labels"), t("add_label"), t("placeholder_label"), redraw, async (v) => {
    const nu = normalizeLabel(v);
    const ok = await plugin.addLabel(v);
    if (ok && nu) await plugin.setLabelVisible(nu, true);   // aus der Nav erstellt -> gleich sichtbar
  });
  if (!labelsCollapsed) for (const name of plugin.getVisibleLabels()) {
    const count = plugin.index.byLabel(name).length;   // byLabel nutzt open() → ohne archivierte Projekte
    navItem(c, { cls: "bt-nav-label", icon: "hash", label: name, count, active: plugin.currentLabel === name, onClick: () => void plugin.activateLabel(name) });
  }

  // Bereiche: Header „+" legt eine Notiz direkt als Bereich (type: area) an.
  const areasCollapsed = navHead(c, plugin, "areas", t("group_area"), t("pick_new_area"), t("placeholder_area_name"), redraw,
    (v) => plugin.createProject(v, true));
  if (!areasCollapsed) projItems(plugin.sortProjItems("areas", bereiche), "bt-nav-area");

  // Projekte: Header „+" legt ein neues Projekt an.
  const projCollapsed = navHead(c, plugin, "projects", t("group_project"), t("pick_new_project"), t("placeholder_project_name"), redraw,
    (v) => plugin.createProject(v));
  if (!projCollapsed) projItems(plugin.sortProjItems("projects", projekte), "bt-nav-project");

  // „Verwalten" unten: Projekte/Bereiche archivieren, ein-/ausblenden, umwandeln, löschen.
  navItem(c, { cls: "bt-nav-manage", icon: "list-plus", label: t("manage_full"), active: plugin.manageOpen, onClick: () => void plugin.activateManage() });
}

function navCount(plugin: BeautyTasksPlugin, id: ViewId): number {
  const today = todayStr();
  if (id === "heute") return plugin.index.overdue(today).length + plugin.index.dueToday(today).length;
  if (id === "demnaechst") return plugin.index.upcoming(today).length;
  if (id === "wiederkehrend") return plugin.index.open().filter((tk) => tk.recurrence).length;
  return 0;
}

/** Eine Dashboard-Ansicht. Rendern macht der Plugin-Code direkt ins DOM
 *  (renderAllViews), unabhängig von onOpen (robust gegen aufgeschobene Views). */
/** EINE Dashboard-Leaf für alle Ansichten. Welche Ansicht gezeigt wird, steht in
 *  plugin.currentView; Umschalten = nur neu zeichnen (kein neuer Leaf/Tab). */
export class MainView extends ItemView {
  private unsub: (() => void) | null = null;
  private renderComp: Component | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: BeautyTasksPlugin) { super(leaf); }
  getViewType(): string { return VIEW_MAIN; }
  getDisplayText(): string { return "BeautyTasks"; }   // statischer Header (Tab + Pane) = Programmname
  getIcon(): string { return VIEW_ICON.erledigt; }   // statisch = „Erledigt"-Icon (check-circle)
  async onOpen(): Promise<void> {
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose(): Promise<void> { this.unsub?.(); this.unsub = null; this.plugin.titleRenderComp = null; }
  draw(): void {
    if (!this.contentEl) return;
    // Frische Render-Component pro Zeichnung: Markdown-Titel (Links) sauber auf-/abbauen,
    // damit sich Hover-/Embed-Kindkomponenten nicht über Redraws hinweg ansammeln.
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new Component());
    this.plugin.titleRenderComp = this.renderComp;
    if (this.plugin.manageOpen) renderManageInto(this.contentEl, this.plugin);
    else if (this.plugin.currentFilter) renderFilterBoardInto(this.contentEl, this.plugin, this.plugin.currentFilter);
    else if (this.plugin.currentLabel) renderLabelBoardInto(this.contentEl, this.plugin, this.plugin.currentLabel);
    else if (this.plugin.currentProject) renderProjectBoardInto(this.contentEl, this.plugin, this.plugin.currentProject);
    else renderViewInto(this.contentEl, this.plugin, this.plugin.currentView);
    this.syncTitle();
  }

  /** Tab UND Pane-Header (zwei getrennte Elemente) auf die aktuelle Seite bringen –
   *  sonst bleibt der Titel beim zuerst geöffneten View hängen. */
  private syncTitle(): void {
    (this.leaf as WorkspaceLeaf & { updateHeader?: () => void }).updateHeader?.();   // Tab
    const titleEl = this.containerEl.querySelector<HTMLElement>(".view-header-title");
    if (titleEl) titleEl.setText(this.getDisplayText());                              // Pane-Header
  }
}

export class NavView extends ItemView {
  private unsub: (() => void) | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: BeautyTasksPlugin) { super(leaf); }
  getViewType(): string { return VIEW_NAV; }
  getDisplayText(): string { return "BeautyTasks"; }
  getIcon(): string { return "check-circle"; }
  async onOpen(): Promise<void> {
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose(): Promise<void> { this.unsub?.(); this.unsub = null; }
  draw(): void { if (this.contentEl) renderNavInto(this.contentEl, this.plugin); }
}
