import { ItemView, WorkspaceLeaf, setIcon, MarkdownRenderer, Component, Keymap, Menu } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task, NavSection, Priority } from "./types";
import { todayStr, formatDate, formatDateTime, combineDT, dueWhen, dateOf } from "./format";
import { openDatePicker } from "./datePicker";
import { listProjectsAndAreas, isAreaPath, isInboxLink, INBOX_KEY } from "./taskService";
import { listFilters, readFilter } from "./filterService";
import { applyFilter, sortTasks, FilterGroup, PageLayout, ViewOptions } from "./filterEngine";
import { FilterModal } from "./filterModal";
import { NewItemModal } from "./newItemModal";
import { buildItemMenu, showHiddenSubmenu, addGcalSyncItem, NavMenuItem } from "./navMenu";
import { anzeigeButton } from "./viewPanel";
import { renderManageInto, iconBtn, confirmInline, attachRowDrag } from "./manageView";
import { parseRecurrence } from "./recurrence";
import { formatReminder } from "./reminders";
import { renderCalendar, calendarDayAnchor, tryPatchCalendar, activateEventOpen } from "./calendarView";
import { DayEvent, bucketEvents, addDays } from "./calendarModel";
import { renderCheck, installCheckDelegation } from "./taskCheck";
import { PRIOS } from "./taskModal";
import { isOpen, isDone, isTrashed, boardStatuses, statusLabel, statusTint, firstOpenStatus, StatusKind } from "./statuses";
import { t, getLocale, projectDisplayName } from "./i18n";

// Transienter Zustand während eines Kanban-Drags: Pfad der Karte + ID der Quell-Spalte
// (für die Swap-Semantik beim Label-Board – welches Label die Karte hier her gebracht hat).
let dragPath: string | null = null;
let dragFromCol: string | null = null;
// Horizontale Board-Scrollposition je Board-Identität – überlebt Re-Renders (z. B. nach Karten-Drop).
const boardScroll = new Map<string, number>();
// Senkrechte Position INNERHALB einer Spalte (Schlüssel: Board-Identität + Spalten-ID).
// Nötig, weil `.bt-kanban-list` bei jeder Zeichnung neu entsteht – ein frisches Element startet
// zwangsläufig bei 0. In der Listenansicht stellt sich die Frage nicht: dort ist der Scroller
// contentEl selbst, das Element überlebt und wird nur geleert und wieder gefüllt.
const colScroll = new Map<string, number>();

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

/** Datum, auf das „+ Aufgabe hinzufügen" vorbelegt: in der Kalender-TAGESANSICHT der gerade
 *  angezeigte Tag, sonst null (dann greift wie bisher „heute" bzw. gar kein Datum). Projekt/Label
 *  kommen unverändert von der Seite – der Knopf verhält sich also wie in der Liste, nur mit dem
 *  Tag, den man gerade ansieht. */
function addDue(plugin: BeautyTasksPlugin): string | null {
  return calendarDayAnchor(plugin, plugin.pageViewOptions());
}

/** Aufgabenmenge für das Kalender-Layout der System-Views (Heute/Demnächst).
 *  Diese Views schneiden ihre Menge bewusst zeitlich zu (nur heute bzw. nur Zukunft) – im Kalender
 *  wäre damit fast jede Zelle leer und Zurückblättern sinnlos. Der Kalender zeigt dort deshalb ALLE
 *  datierten Aufgaben; das Datum ist ja bereits seine Achse. Projekt-/Label-/Filterseiten behalten
 *  dagegen ihre Menge (dort ist die Einschränkung die Aussage der Seite). */
function calendarTasks(plugin: BeautyTasksPlugin, opts: ViewOptions): Task[] {
  const open = plugin.index.open();
  return opts.showDone ? [...open, ...plugin.index.done()] : open;
}

/**
 * Kopf-Block einer Seite (Titel + „Anzeige" + „+ Aufgabe"). Bleibt beim Scrollen oben stehen (CSS).
 * Die Gruppen-Überschriften scrollen bewusst mit – deshalb braucht hier auch niemand die Kopfhöhe
 * zu kennen (kein ResizeObserver, keine CSS-Variable).
 *
 * (Das Ruckeln, das mich diesen Block einmal wieder ausbauen ließ, kam nachweislich woanders her:
 * aus dem dreifachen Neuzeichnen pro Änderung – siehe tryPatchCalendar/tryPatchNav.)
 */
function pageTop(c: HTMLElement, layout: PageLayout): HTMLElement {
  // Der Block spannt die VOLLE Pane-Breite (nur so kann „Anzeige" rechts an der Pane-Kante andocken).
  // Der innere Sizer folgt dem Layout des Bodys darunter: Liste = Lesebreite, Board/Kalender =
  // volle Breite. Sonst stünde der Titel im Kalender zentriert, während sein Raster links beginnt.
  const bar = c.createDiv({ cls: "bt-page-top" });
  c.prepend(bar);   // IMMER als erstes Element – der Listen-Sizer ist teils schon erzeugt
  const wide = layout !== "list";
  return bar.createDiv({ cls: "bt-sizer bt-page-top-in" + (wide ? " bt-sizer-board" : "") });
}

/** Rendert eine Dashboard-Ansicht in ein angehängtes DOM-Element (Deferred-sicher). */
export function renderViewInto(c: HTMLElement, plugin: BeautyTasksPlugin, view: ViewId): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  // Heute/Demnächst: Kopf mit „Anzeige"-Knopf (leichtes Panel). Wiederkehrend: nur Titel.
  if (view === "heute" || view === "demnaechst") {
    const top = pageTop(c, plugin.pageViewOptions().layout);
    const head = top.createDiv({ cls: "bt-board-head" });
    head.createEl("h1", { text: viewTitle(view) });
    anzeigeButton(head.createDiv({ cls: "bt-head-actions" }), plugin);   // rechts an der Pane-Kante
    const add = top.createDiv({ cls: "bt-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    add.onclick = () => plugin.openNewTask(undefined, undefined, view === "heute", undefined, addDue(plugin));
  } else if (view !== "erledigt") {
    root.createEl("h1", { text: viewTitle(view) });   // „Erledigt" bekommt einen Kopf mit Tabs (unten)
  }

  const idx = plugin.index;
  if (view === "heute") {
    const opts = plugin.pageViewOptions();
    const overdue = idx.overdue(today), dueToday = idx.dueToday(today);
    const doneToday = idx.done().filter((tk) => dateOf(tk.completed ?? "") === today);   // completed = Zeitstempel -> Datums-Teil vergleichen
    const open = [...overdue, ...dueToday];
    // Termine des Tages (read-only) zählen mit: sonst behauptete „Nichts für heute" leeren Tag,
    // obwohl der Kalender voller Meetings steckt. setRange meldet dem Feed den Zeitraum (Listen-Layout
    // hat sonst nichts, was ihn anstößt – das macht sonst nur der Kalender).
    plugin.gcalFeed?.setRange(today, today);
    const todayEv = dayEvents(plugin, today);
    if (!open.length && !(opts.showDone && doneToday.length) && !todayEv.length) {
      emptyState(root, VIEW_ICON.heute, "empty_nothing_today");
    } else if (opts.layout === "calendar") {
      renderCalendar(root, plugin, () => calendarTasks(plugin, opts), today, opts, () => plugin.renderMain());
    } else if (opts.layout === "board") {
      // Board folgt der Gruppierung (Status/Label/Priorität/Projekt) – wie die vollen Seiten.
      // Termine haben hier keine Spalte (kein Tages-Board) → sie erscheinen im Listen-/Kalender-Layout.
      renderKanbanBoard(root, plugin, opts.showDone ? [...open, ...doneToday] : open, today, opts, { today: true });
    } else {
      const present = renderedPaths(plugin, opts.showDone ? [...open, ...doneToday] : open);
      if (opts.group === "none") {
        // Default: die semantischen Sektionen Überfällig/Heute (nach opts.sort sortiert).
        // Die Termine des Tages hängen an „Heute" (Überfällig ist vergangen, dort ergäben sie keinen Sinn).
        section(root, plugin, t("sec_overdue"), sortTasks(overdue, opts.sort, opts.sortDir), today, false, false, present);
        section(root, plugin, t("sec_today"), sortTasks(dueToday, opts.sort, opts.sortDir), today, false, false, present, todayEv);
      } else {
        // Aktive Gruppierung ersetzt den Überfällig/Heute-Split (Todoist-Stil). Termine passen in keine
        // Sachgruppe (Priorität/Label/…) → ein schlichtes Band-Segment oben, vor den Gruppen.
        if (todayEv.length) renderEventBands(root.createDiv({ cls: "bt-section bt-list" }), todayEv);
        for (const g of filterGroups(plugin, sortTasks(open, opts.sort, opts.sortDir), opts.group, today))
          if (g.tasks.length) section(root, plugin, g.title, g.tasks, today, false, false, present);
      }
      if (opts.showDone && doneToday.length) section(root, plugin, t("sec_done"), doneToday, today, true, false, present);
    }
  } else if (view === "demnaechst") {
    // „Demnächst" ist eine reine, datierte Zukunfts-Agenda: KEINE undatierten (die gehören in
    // Eingang/Projekt bzw. später „Irgendwann") und KEINE erledigten (gehören in „Erledigt").
    const opts = plugin.pageViewOptions();
    const groups = idx.upcomingByDate(today);
    // Termine des Vorschauzeitraums (read-only). Der Feed lädt diesen Bereich nach (Listen-Layout
    // stößt ihn sonst nicht an). Ein Tag MIT Terminen, aber OHNE Aufgabe, bekommt so trotzdem seine
    // Gruppe – „Demnächst" wird zur ehrlichen Wochenplanungs-Fläche (Idee aus dem belki-Plugin).
    const eventEnd = addDays(today, UPCOMING_EVENT_HORIZON_DAYS);
    plugin.gcalFeed?.setRange(today, eventEnd);
    const evByDate = feedEventsByDate(plugin, today, eventEnd);
    if (!groups.length && !evByDate.size) { emptyState(root, VIEW_ICON.demnaechst, "empty_nothing_scheduled"); }
    else if (opts.layout === "calendar") {
      renderCalendar(root, plugin, () => calendarTasks(plugin, opts), today, opts, () => plugin.renderMain());
    } else if (opts.layout === "board") {
      // Termine haben im Board keine Spalte (keine Tages-Spalten) → nur Aufgaben.
      renderKanbanBoard(root, plugin, groups.flatMap((g) => g.tasks), today, opts, {});
    } else {
      const present = renderedPaths(plugin, groups.flatMap((g) => g.tasks));
      const tasksByDate = new Map(groups.map((g) => [g.date, g.tasks]));
      // Datums-Vereinigung: alle Aufgaben-Tage PLUS alle Tage mit Terminen, chronologisch.
      const dates = [...new Set([...tasksByDate.keys(), ...evByDate.keys()])].sort();
      for (const date of dates)
        section(root, plugin, groupLabel(date, today), tasksByDate.get(date) ?? [], today, false, false, present, evByDate.get(date) ?? []);
    }
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
function addBar(root: HTMLElement, plugin: BeautyTasksPlugin, onAdd: () => void): void {
  const bar = root.createDiv({ cls: "bt-board-bar" });
  const add = bar.createDiv({ cls: "bt-add" });
  add.createSpan({ cls: "bt-add-icon" });
  add.createSpan({ text: t("btn_add_task") });
  add.onclick = onAdd;
}

/** Projekt-Board: alle Aufgaben eines Projekts, nach Status/Datum gruppiert. */
export function renderProjectBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, projectPath: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const isInbox = projectPath === INBOX_KEY;   // eingebaute Eingang-Ansicht (keine Notiz)
  const name = isInbox ? "" : projectName(projectPath);
  // Kopf: Kebab-Menü (wie Sidebar-Rechtsklick); Eingang ist eine Systemansicht → kein Menü.
  const isArea = !isInbox && isAreaPath(plugin.app, projectPath);
  const meta = isInbox ? null
    : (() => { const a = listProjectsAndAreas(plugin.app); return [...a.bereiche, ...a.projekte].find((p) => p.path === projectPath) ?? null; })();
  const top = pageTop(c, plugin.pageViewOptions().layout);
  pageHeader(top, plugin, top.createEl("h1", { text: isInbox ? t("nav_inbox") : projectDisplayName(name) }),
    meta ? { menu: { sec: meta.type === "area" ? "areas" : "projects", key: meta.path, name: meta.name, hidden: meta.hidden, color: meta.color, type: meta.type } } : {});
  // Im Eingang neue Aufgaben OHNE Projekt anlegen (Eingang = kein Projekt), sonst im Projekt.
  addBar(top, plugin, () => plugin.openNewTask(isInbox ? undefined : name, undefined, false, undefined, addDue(plugin)));

  // Eingang = alle „nicht einsortierten" Aufgaben (kein Projekt ODER Verweis auf Inbox).
  const source = (): Task[] => isInbox
    ? plugin.index.inbox()
    : plugin.index.all().filter((t) => t.project != null && projectName(t.project) === name);
  const tasks = source();
  if (!tasks.length) {
    if (isInbox) emptyState(root, "inbox", "empty_no_inbox_tasks");
    else if (isArea) emptyState(root, "circle-small", "empty_no_area_tasks");
    else emptyState(root, "folder", "empty_no_project_tasks");
    return;
  }
  renderPageBody(root, plugin, source, plugin.pageViewOptions(), today, isInbox ? {} : { project: name });
}

/** Label-Board: alle Aufgaben mit einem Label, nach Status/Datum gruppiert (wie Projekt-Board). */
export function renderLabelBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, label: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const top = pageTop(c, plugin.pageViewOptions().layout);
  pageHeader(top, plugin, top.createEl("h1", { cls: "bt-label-title", text: "#" + label }),
    { menu: { sec: "labels", key: label, name: label, hidden: !plugin.isLabelVisible(label), color: plugin.getLabelColor(label) } });
  addBar(top, plugin, () => plugin.openNewTask(undefined, label, false, undefined, addDue(plugin)));

  const source = (): Task[] =>
    plugin.index.all().filter((tk) => tk.labels.includes(label) && !plugin.index.isProjectArchived(tk.project));
  const tasks = source();
  if (!tasks.length) { emptyState(root, "hash", "empty_no_label_tasks"); return; }
  renderPageBody(root, plugin, source, plugin.pageViewOptions(), today, { label });
}

/**
 * Aufgaben eines Filter-Boards in Abschnitte gruppieren. Die Reihenfolge INNERHALB einer Gruppe
 * bringt bereits sortTasks() mit (inkl. Richtung).
 *
 * Die Reihenfolge der GRUPPEN ist dagegen fest und richtungsunabhängig: „Überfällig → Heute →
 * Demnächst → Kein Datum" ist eine Semantik (dringend zuerst), keine Skala – umgedreht ergäbe sie
 * keinen Sinn. Ebenso Priorität (P1→P4) und Label/Projekt (alphabetisch). Die Sortierrichtung
 * betrifft nur die Aufgaben unter den Überschriften. (So macht es auch Todoist.)
 */
function filterGroups(plugin: BeautyTasksPlugin, tasks: Task[], group: FilterGroup, today: string): { title: string; tasks: Task[] }[] {
  if (group === "none") return [{ title: t("sec_tasks"), tasks }];
  const buckets = new Map<string, { key: string; title: string; tasks: Task[]; order: number }>();
  const push = (key: string, title: string, order: number, tk: Task): void => {
    let b = buckets.get(key);
    if (!b) { b = { key, title, tasks: [], order }; buckets.set(key, b); }
    b.tasks.push(tk);
  };
  const prioKey = (p: string): string => p === "highest" ? "prio_1" : p === "high" ? "prio_2" : p === "medium" ? "prio_3" : "prio_4";
  const prioOrder = (p: string): number => p === "highest" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3;
  for (const tk of tasks) {
    if (group === "date" || group === "deadline") {
      const d = group === "date" ? tk.due : tk.scheduled;   // „Datum" = due, „Deadline" = scheduled
      if (d && d < today) push("overdue", t("sec_overdue"), 0, tk);
      else if (d === today) push("today", t("sec_today"), 1, tk);
      else if (d && d > today) push("upcoming", t("sec_upcoming"), 2, tk);
      else push("nodate", t("sec_no_date"), 3, tk);
    } else if (group === "priority") {
      const k = prioKey(tk.priority);
      push(k, t(k), prioOrder(tk.priority), tk);
    } else if (group === "label") {
      if (tk.labels.length) push("l:" + tk.labels[0], "#" + tk.labels[0], 1, tk);
      else push("nolabel", t("no_label"), 0, tk);
    } else {   // project – „nicht einsortiert" (kein Projekt ODER Inbox-Verweis) in EINEN Eingang-Bucket
      if (tk.project && !isInboxLink(tk.project)) { const nm = projectName(tk.project); push("p:" + nm, "@" + projectDisplayName(nm), 1, tk); }
      else push("noproject", t("nav_inbox"), 0, tk);
    }
  }
  // „Kein Datum" / „Kein Label" / „Kein Projekt" immer ans Ende – kein Wert auf der Skala,
  // sondern dessen Abwesenheit (wie undatierte Aufgaben in sortTasks()).
  const isRest = (k: string): number => (k === "nodate" || k === "nolabel" || k === "noproject" ? 1 : 0);
  return [...buckets.values()].sort((a, b) =>
    isRest(a.key) - isRest(b.key) || a.order - b.order || a.title.localeCompare(b.title));
}

/** Generischer Seiten-Body (Boards): honoriert Layout · Sortieren · Gruppieren · Erledigte.
 *  `source` liefert die Aufgaben der Seite – als Funktion, damit der Kalender sie beim
 *  inkrementellen Nachzeichnen frisch holen kann, ohne die Seiten-Logik zu kennen. */
function renderPageBody(root: HTMLElement, plugin: BeautyTasksPlugin, source: () => Task[], opts: ViewOptions, today: string,
  add: BoardAdd): void {
  const tasks = source();
  const open = tasks.filter((t) => isOpen(t.status));
  const done = tasks.filter((t) => isDone(t.status)).sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  if (opts.layout === "board") {
    renderKanbanBoard(root, plugin, opts.showDone ? [...open, ...done] : open, today, opts, add);
    return;
  }
  if (opts.layout === "calendar") {
    // Der Kalender bekommt die QUELLE (nicht die Liste): so kann er bei einer reinen Datenänderung
    // nur seine Aufgaben-Elemente nachziehen, statt die Seite neu aufzubauen (s. tryPatchCalendar).
    const calSource = (): Task[] => {
      const all = source();
      const o = all.filter((t) => isOpen(t.status));
      return opts.showDone ? [...o, ...all.filter((t) => isDone(t.status))] : o;
    };
    // Der Redraw hier ist für die Navigation nötig (Blättern ändert nur den transienten Anker).
    renderCalendar(root, plugin, calSource, today, opts, () => plugin.renderMain(), add);
    return;
  }
  const sorted = sortTasks(open, opts.sort, opts.sortDir);
  const present = renderedPaths(plugin, opts.showDone ? [...open, ...done] : open);
  for (const g of filterGroups(plugin, sorted, opts.group, today)) {
    if (g.tasks.length) section(root, plugin, g.title, g.tasks, today, false, false, present);
  }
  if (opts.showDone && done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
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

  // Kopf: Titel + [Stift Kriterien-Editor] [Link „Filter"] [Anzeige].
  const top = pageTop(c, filter.options.layout);
  pageHeader(top, plugin, top.createEl("h1", { text: filter.name }), {
    menu: { sec: "filters", key: filterPath, name: filter.name, hidden: filter.hidden, color: filter.color },
  });
  addBar(top, plugin, () => plugin.openNewTask(undefined, undefined, false, undefined, addDue(plugin)));

  // Kriterien filtern die Menge; renderPageBody übernimmt Layout/Sortieren/Gruppieren/Erledigte.
  const tasks = applyFilter(plugin.index, filter.criteria, filter.options, today);
  if (!tasks.length) { emptyState(root, filter.icon, "empty_no_filter_tasks"); return; }
  renderPageBody(root, plugin, () => applyFilter(plugin.index, filter.criteria, filter.options, today), filter.options, today, {});
}

// ── Seiten-Kopf: Titel links, rechts eine Aktionsgruppe (Variante 02) ──
interface HeaderOpts {
  menu?: NavMenuItem;     // Kebab: Item-Kontextmenü (Board-Variante); fehlt → kein Kebab (z. B. Eingang)
}
/** Board-Überschrift: Titel + rechte Gruppe [Kebab-Menü] [Anzeige].
 *  Der Kebab öffnet dasselbe Kontextmenü wie ein Rechtsklick in der Seitenleiste – ohne die
 *  Sortier-Optionen, dafür mit „Zur …übersicht" (früher der list-plus-Kopf-Button). */
function pageHeader(root: HTMLElement, plugin: BeautyTasksPlugin, titleEl: HTMLElement, opts: HeaderOpts = {}): void {
  const head = root.createDiv({ cls: "bt-board-head" });
  head.appendChild(titleEl);
  const actions = head.createDiv({ cls: "bt-head-actions" });
  if (opts.menu) {
    const it = opts.menu;
    const kebab = actions.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": t("more_actions"), "data-tooltip-position": "top" } });
    setIcon(kebab.createSpan(), "more-horizontal");
    kebab.onclick = (e) => { e.stopPropagation(); const m = new Menu(); buildItemMenu(m, plugin, it, "board"); m.showAtMouseEvent(e); };
  }
  anzeigeButton(actions, plugin);
}

// ── Kanban-Board (Spalten = Status, Karten per Drag-and-Drop verschiebbar) ──
/** Innerhalb einer Spalte sortieren: „erledigt" nach Abschlusszeit (neueste oben),
 *  offene Spalten datiert zuerst (aufsteigend), Datumlose ans Ende. */
function sortColumn(list: Task[], kind: StatusKind): Task[] {
  if (kind === "done") return list.sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  return list.sort((a, b) => (a.due ?? "9999-99-99").localeCompare(b.due ?? "9999-99-99") || a.title.localeCompare(b.title));
}

// ── Generisches Spalten-Modell: das Board folgt der Gruppierung (Todoist-Muster) ──
// Fundament für Status/Label/… – aktuell freigeschaltet: Status (Default) und Label.
/** Basis-Kontext fürs „+ Aufgabe" einer Spalte (die Spalten-Dimension setzt die Spalte selbst). */
interface BoardAdd { project?: string | null; label?: string; today?: boolean; }
interface BoardColumn {
  id: string;                                   // stabile Spalten-ID (Status-ID bzw. Label-Name / NO_LABEL)
  title: string;
  tint: string;                                 // Kopf-Punkt-Farbe
  kind: StatusKind;                             // steuert sortColumn (Nicht-Status = "open")
  has: (tk: Task) => boolean;                   // gehört die Aufgabe in diese Spalte?
  onDrop: (tk: Task, fromColId: string) => void; // Loslassen aus Spalte fromColId
  onAdd: () => void;                            // „+ Aufgabe" in dieser Spalte
}

const NO_LABEL = "\u0000nolabel";   // Sentinel-ID der „Ohne Label"-Spalte (kein gültiger Label-Name)

/** Status-Spalten (Standard-Kanban): Ziehen setzt den Status. */
function statusColumns(plugin: BeautyTasksPlugin, add: BoardAdd): BoardColumn[] {
  return boardStatuses().map((col) => ({
    id: col.id, title: statusLabel(col.id), tint: statusTint(col.id), kind: col.kind,
    has: (tk: Task) => tk.status === col.id,
    onDrop: (tk: Task) => { if (tk.status !== col.id) void plugin.setTaskStatus(tk, col.id); },
    onAdd: () => plugin.openNewTask(add.project ?? undefined, add.label, add.today ?? false, col.id),
  }));
}

/** Label-Spalten (Gruppierung = Label): Ziehen TAUSCHT das Label (Quell-Spalten-Label raus,
 *  Ziel-Label rein) – andere Labels der Aufgabe bleiben. Spalten = die in der Ansicht VORKOMMENDEN
 *  Labels (in Seitenleisten-Reihenfolge), plus „Ohne Label" bei Bedarf. */
function labelColumns(plugin: BeautyTasksPlugin, tasks: Task[], add: BoardAdd): BoardColumn[] {
  const present = tasks.flatMap((t) => t.labels);
  const names = plugin.sortLabels([...new Set(present)].map((name) => ({ name }))).map((x) => x.name);
  const cols: BoardColumn[] = names.map((name) => ({
    id: name, title: "#" + name, tint: plugin.getLabelColor(name) ?? "var(--bt-label)", kind: "open",
    has: (tk: Task) => tk.labels.includes(name),
    onDrop: (tk: Task, fromColId: string) => void plugin.swapTaskLabel(tk, fromColId === NO_LABEL ? null : fromColId, name),
    onAdd: () => plugin.openNewTask(add.project ?? undefined, name, add.today ?? false, firstOpenStatus()),
  }));
  if (tasks.some((t) => t.labels.length === 0)) {
    cols.push({
      id: NO_LABEL, title: t("no_label"), tint: "var(--text-muted)", kind: "open",
      has: (tk: Task) => tk.labels.length === 0,
      onDrop: (tk: Task, fromColId: string) => void plugin.swapTaskLabel(tk, fromColId === NO_LABEL ? null : fromColId, null),
      onAdd: () => plugin.openNewTask(add.project ?? undefined, undefined, add.today ?? false, firstOpenStatus()),
    });
  }
  return cols;
}

const NO_PROJECT = " noproject";   // Sentinel-ID der „Kein Projekt"-Spalte

/** Prioritäts-Spalten (Gruppierung = Priorität): eine Spalte je Stufe (P1–P4); Ziehen setzt die
 *  Priorität. low/lowest fallen unter „normal" (P4). */
function priorityColumns(plugin: BeautyTasksPlugin, add: BoardAdd): BoardColumn[] {
  const eff = (p: Priority): Priority => (p === "low" || p === "lowest") ? "normal" : p;
  return PRIOS.map((p) => ({
    id: p.value, title: t(p.key), tint: p.color, kind: "open",
    has: (tk: Task) => eff(tk.priority) === p.value,
    onDrop: (tk: Task) => { if (eff(tk.priority) !== p.value) void plugin.setTaskPriority(tk, p.value); },
    onAdd: () => plugin.openNewTask(add.project ?? undefined, add.label, add.today ?? false),
  }));
}

/** Projekt-Spalten (Gruppierung = Projekt): eine Spalte je vorkommendem Projekt/Bereich (+ „Kein
 *  Projekt"); Ziehen verschiebt die Aufgabe (Label/Status bleiben). */
function projectColumns(plugin: BeautyTasksPlugin, tasks: Task[], add: BoardAdd): BoardColumn[] {
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  const colorOf = new Map(([...bereiche, ...projekte]).map((p) => [p.name, p.color] as const));
  // Nur ECHTE Projekte werden Spalten – „nicht einsortierte" (kein Projekt ODER Inbox-Verweis)
  // landen alle im einen Eingang-Bucket (unten), nie in einer eigenen Inbox-Spalte.
  const present = new Set(tasks.filter((t) => t.project && !isInboxLink(t.project)).map((t) => projectName(t.project!)));
  const ordered = [
    ...plugin.sortProjItems("areas", bereiche.filter((p) => present.has(p.name))),
    ...plugin.sortProjItems("projects", projekte.filter((p) => present.has(p.name))),
  ];
  const names = ordered.map((p) => p.name);
  for (const n of present) if (!names.includes(n)) names.push(n);   // Sicherheitsnetz (z. B. archivierte Liste)
  const cols: BoardColumn[] = names.map((name) => ({
    id: name, title: projectDisplayName(name), tint: colorOf.get(name) ?? "var(--bt-nav-project)", kind: "open",
    has: (tk: Task) => !!tk.project && projectName(tk.project) === name,
    onDrop: (tk: Task) => { if (!tk.project || projectName(tk.project) !== name) void plugin.setTaskProject(tk, name); },
    onAdd: () => plugin.openNewTask(name, add.label, add.today ?? false),
  }));
  if (tasks.some((t) => isInboxLink(t.project))) {
    cols.push({
      id: NO_PROJECT, title: t("nav_inbox"), tint: "var(--text-muted)", kind: "open",
      has: (tk: Task) => isInboxLink(tk.project),
      onDrop: (tk: Task) => { if (!isInboxLink(tk.project)) void plugin.setTaskProject(tk, null); },   // in den Eingang = Projekt leeren
      onAdd: () => plugin.openNewTask(undefined, add.label, add.today ?? false),
    });
  }
  return cols;
}

/** Horizontales Edge-Autoscroll beim Karten-Drag (natives HTML5-DnD scrollt eigene Container in
 *  Chromium NICHT): Kommt der Cursor an den linken/rechten Rand des Boards, scrollt es fortlaufend –
 *  auch beim Stillhalten am Rand (die rAF-Schleife läuft mit der zuletzt gemeldeten Position weiter).
 *  Nur für eigene Karten (`dragPath`). Popout-sicher (reiner Element-Scroll). Selbst-Stopp, sobald die
 *  Zone verlassen ist, beim Drag-Ende ODER wenn das Board neu gerendert/entfernt wurde (`isConnected`).
 *  KEIN vertikales Autoscroll: Spalten scrollen intern und Drops sind positionsunabhängig – man muss
 *  beim Ziehen nie eine Spalte intern scrollen. */
/** Rand-Autoscroll fürs Board. Gibt `drive(clientX)` zurück, um dieselbe Mechanik von außen zu
 *  füttern (`null` stoppt) – Karten ziehen per HTML5-Drag, da feuert `dragover` von selbst; Spalten
 *  ziehen per Pointer-Events, da feuert `dragover` NIE. Ohne diese Ansteuerung stünde das Board beim
 *  Spalten-Ziehen still, und man käme mit der rechten Spalte nie an den linken Rand. */
function attachEdgeAutoscroll(board: HTMLElement): (clientX: number | null) => void {
  const EDGE = 56;   // Randzone (px)
  const MAX = 18;    // Höchstgeschwindigkeit (px/Frame)
  let hSpeed = 0, rafId = 0;
  const ramp = (dist: number): number => Math.min(MAX, Math.max(1, Math.ceil(((EDGE - dist) / EDGE) * MAX)));
  const tick = (): void => {
    if (!board.isConnected || !hSpeed) { rafId = 0; return; }
    board.scrollLeft += hSpeed;
    rafId = window.requestAnimationFrame(tick);
  };
  const stop = (): void => { hSpeed = 0; if (rafId) { window.cancelAnimationFrame(rafId); rafId = 0; } };
  const drive = (clientX: number | null): void => {
    if (clientX === null) { stop(); return; }
    const r = board.getBoundingClientRect();
    hSpeed = clientX < r.left + EDGE ? -ramp(clientX - r.left) : clientX > r.right - EDGE ? ramp(r.right - clientX) : 0;
    if (hSpeed && !rafId) rafId = window.requestAnimationFrame(tick);
  };
  board.addEventListener("dragover", (e) => { if (dragPath) drive(e.clientX); });   // nur eigene Karten, kein Vault-/Text-Drag
  board.addEventListener("dragend", stop);
  board.addEventListener("drop", stop);
  return drive;
}

/** Sentinel-Spalten („Ohne Label"/„Kein Projekt") – bleiben immer hinten, nicht umsortierbar. */
const isSentinelCol = (id: string): boolean => id === NO_LABEL || id === NO_PROJECT;

/** Board-eigene Spalten-Reihenfolge anwenden (Option B, entkoppelt von der Sidebar): gespeicherte
 *  IDs zuerst in ihrer Reihenfolge, unbekannte (neue) Spalten behalten ihre Default-Position dahinter,
 *  Sentinel immer ganz hinten. Stabile Sortierung (JS Array.sort). */
function applyColumnOrder(cols: BoardColumn[], saved: string[] | undefined): BoardColumn[] {
  if (!saved?.length) return cols;
  const rank = new Map(saved.map((id, i) => [id, i] as const));
  return [...cols].sort((a, b) => {
    const pa = isSentinelCol(a.id) ? 1 : 0, pb = isSentinelCol(b.id) ? 1 : 0;
    if (pa !== pb) return pa - pb;                                   // Sentinel ans Ende
    return (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity);
  });
}

/** Kanban-Spalte horizontal umsortieren – der ganze Spaltenkopf ist der Ziehgriff (Pointer-basiert,
 *  Maus + Touch, Popout-sicher). Persistiert die neue ID-Reihenfolge (ohne Sentinel) je Gruppierung,
 *  aber nur wenn sich die Reihenfolge tatsächlich geändert hat (bloßer Klick = No-Op). */
/** `drive` = Rand-Autoscroll des Boards (aus attachEdgeAutoscroll). Karten bekommen ihn beim Ziehen
 *  von selbst über `dragover`; ein Pointer-Drag kennt dieses Ereignis nicht, also fütterte ihn die
 *  Spalte hier direkt – damit sie sich beim Anfahren des linken/rechten Randes genauso verhält. */
function attachColumnDrag(colEl: HTMLElement, handle: HTMLElement, board: HTMLElement, groupKey: string,
                          plugin: BeautyTasksPlugin, drive: (clientX: number | null) => void): void {
  const cols = (): HTMLElement[] => Array.from(board.children).filter((el): el is HTMLElement => el.instanceOf(HTMLElement) && el.hasClass("bt-kanban-col"));
  const orderIds = (): string[] => cols().filter((el) => el.dataset.pin !== "1").map((el) => el.dataset.col).filter((c): c is string => !!c);
  handle.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;   // nur Primärtaste/Touch
    ev.preventDefault();
    const doc = board.ownerDocument;
    const before = orderIds().join(",");
    let lastX = ev.clientX;
    const place = (x: number): void => {
      let placed = false;
      for (const sib of cols()) {
        if (sib === colEl || sib.dataset.pin === "1") continue;   // Sentinel bleibt hinten, nie verdrängen
        const r = sib.getBoundingClientRect();
        if (x < r.left + r.width / 2) { board.insertBefore(colEl, sib); placed = true; break; }
      }
      if (!placed) { const pin = cols().find((el) => el.dataset.pin === "1"); if (pin) board.insertBefore(colEl, pin); else board.appendChild(colEl); }
    };
    const onMove = (me: PointerEvent): void => {
      colEl.addClass("is-col-dragging");   // Drag-Optik erst bei echter Bewegung (Klick = kein Aufblinken)
      lastX = me.clientX;
      drive(lastX);      // Rand-Autoscroll wie beim Karten-Ziehen – Pointer-Drag feuert kein dragover
      place(lastX);
    };
    // Während der Autoscroll läuft, feuert bei ruhendem Zeiger kein pointermove – die Nachbarn
    // wandern aber unter ihm durch. Deshalb die Platzierung mit dem letzten X nachziehen, sonst
    // scrollt das Board zwar nach links, die Spalte bliebe aber hinten einsortiert.
    const onBoardScroll = (): void => place(lastX);
    const onUp = (): void => {
      colEl.removeClass("is-col-dragging");
      drive(null);       // Autoscroll anhalten
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      board.removeEventListener("scroll", onBoardScroll);
      const ids = orderIds();
      if (ids.join(",") !== before) void plugin.setBoardColumnOrder(groupKey, ids);   // nur bei echter Änderung
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
    board.addEventListener("scroll", onBoardScroll);
  });
}

/** Eine Spalte als Drop-Ziel verdrahten: Loslassen ruft die spaltenspezifische Mutation. */
function setupColumnDnd(colEl: HTMLElement, col: BoardColumn, plugin: BeautyTasksPlugin): void {
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
    const fromCol = dragFromCol;
    dragPath = null; dragFromCol = null;
    if (!path) return;
    const task = plugin.index.get(path);
    if (task) col.onDrop(task, fromCol ?? "");
  });
}

/** Kanban-Board zeichnen: Spalten folgen der Gruppierung (Label → Label-Spalten, sonst Status).
 *  Ziehbare Karten + „+ Aufgabe" je Spalte (legt mit der Spalten-Dimension an). */
function renderKanbanBoard(root: HTMLElement, plugin: BeautyTasksPlugin, tasks: Task[], today: string,
  opts: ViewOptions, add: BoardAdd): void {
  root.addClass("bt-sizer-board");   // Kanban nutzt volle Pane-Breite statt Lesebreite
  // Gruppierungs-Schlüssel (stabil) für die board-eigene Spalten-Reihenfolge. Priorität bleibt fest.
  const groupKey = opts.group === "label" ? "label" : opts.group === "priority" ? "priority" : opts.group === "project" ? "project" : "status";
  const reorderable = groupKey !== "priority";
  const baseCols = opts.group === "label" ? labelColumns(plugin, tasks, add)
    : opts.group === "priority" ? priorityColumns(plugin, add)
      : opts.group === "project" ? projectColumns(plugin, tasks, add)
        : statusColumns(plugin, add);
  const cols = reorderable ? applyColumnOrder(baseCols, plugin.settings.boardColumnOrder?.[groupKey]) : baseCols;
  const board = root.createDiv({ cls: "bt-kanban" });
  const driveScroll = attachEdgeAutoscroll(board);
  // Scroll-Position über Re-Renders halten: nach einem Karten-Drop rendert die ganze View neu –
  // ohne das spränge das Board zurück nach links. Schlüssel = aktuelle Board-Identität (+ Gruppierung).
  const scrollKey = (plugin.currentProject ?? plugin.currentLabel ?? plugin.currentFilter ?? plugin.currentView ?? "") + "|" + (opts.group ?? "");
  board.addEventListener("scroll", () => boardScroll.set(scrollKey, board.scrollLeft));
  for (const col of cols) {
    const colEl = board.createDiv({ cls: "bt-kanban-col" });
    colEl.dataset.col = col.id;
    const sentinel = isSentinelCol(col.id);
    if (sentinel) colEl.dataset.pin = "1";
    setupColumnDnd(colEl, col, plugin);

    const head = colEl.createDiv({ cls: "bt-kanban-head" });
    // Der ganze Spaltenkopf ist der Ziehgriff zum Umsortieren (nicht bei Priorität/Sentinel).
    // Grip-Dots als Hover-Signal (absolut positioniert -> kein Layout-Versatz), Cursor = Hand via CSS.
    if (reorderable && !sentinel) {
      head.addClass("bt-col-draggable");
      setIcon(head.createSpan({ cls: "bt-kanban-grip" }), "grip-vertical");
      attachColumnDrag(colEl, head, board, groupKey, plugin, driveScroll);
    }
    head.createSpan({ cls: "bt-kanban-dot" }).style.background = col.tint;
    head.createSpan({ cls: "bt-kanban-title", text: col.title });
    const colTasks = sortColumn(tasks.filter((tk) => col.has(tk)), col.kind);
    head.createSpan({ cls: "bt-kanban-count", text: String(colTasks.length) });

    const listEl = colEl.createDiv({ cls: "bt-kanban-list" });
    // Abhaken schreibt die Notiz -> der Index meldet -> MainView.draw() baut alles neu. Ohne das
    // Folgende spränge die Spalte dabei nach oben, und wer unten mehrere Karten abhaken will,
    // müsste nach jeder einzelnen erneut hinunterscrollen.
    const colKey = scrollKey + "|" + col.id;
    listEl.addEventListener("scroll", () => colScroll.set(colKey, listEl.scrollTop));
    for (const tk of colTasks) renderTask(listEl, plugin, tk, today, 0, false, { flat: true, draggable: true, colId: col.id });
    // Erst nach den Karten: vorher hat die Liste keine Höhe und scrollTop würde auf 0 geklemmt.
    // Ist die Spalte inzwischen kürzer (Karte ist rausgefallen), klemmt der Browser auf das neue
    // Maximum – das Scroll-Ereignis schreibt den geklemmten Wert dann selbst zurück.
    const savedTop = colScroll.get(colKey);
    if (savedTop) listEl.scrollTop = savedTop;

    const addEl = colEl.createDiv({ cls: "bt-kanban-add" });
    addEl.createSpan({ cls: "bt-add-icon" });
    addEl.createSpan({ text: t("btn_add_task") });
    addEl.onclick = () => col.onAdd();
  }
  // Board ist jetzt aufgebaut (Breite steht) -> gemerkte Scroll-Position wiederherstellen.
  const savedLeft = boardScroll.get(scrollKey);
  if (savedLeft) board.scrollLeft = savedLeft;
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
    for (const kid of plugin.index.children(tk.path)) if (!isTrashed(kid.status)) walk(kid);
  };
  for (const a of anchors) walk(a);
  return present;
}

// ── Google-Termine als Bänder in der Liste (read-only) ─────────────────────────
/** Wie weit „Demnächst" Termine OHNE zugehörige Aufgabe als eigenen Tag zeigt (≈ 5 Wochen). */
const UPCOMING_EVENT_HORIZON_DAYS = 34;

/** Die Termine EINES Tages aus dem Feed, tagegenau zugeschnitten. Leer, wenn der Feed aus/leer ist. */
function dayEvents(plugin: BeautyTasksPlugin, day: string): DayEvent[] {
  const feed = plugin.gcalFeed;
  if (!feed?.isActive()) return [];
  return bucketEvents(feed.eventsIn(day, day), [day]).get(day) ?? [];
}

/** Termine eines Zeitraums nach Tag gebündelt (für „Demnächst": auch Tage ohne Aufgabe). */
function feedEventsByDate(plugin: BeautyTasksPlugin, from: string, to: string): Map<string, DayEvent[]> {
  const feed = plugin.gcalFeed;
  if (!feed?.isActive()) return new Map();
  const days: string[] = [];
  for (let d = from; d <= to; d = addDays(d, 1)) days.push(d);
  return bucketEvents(feed.eventsIn(from, to), days);
}
const z2 = (n: number): string => String(n).padStart(2, "0");
const bandTime = (min: number): string => z2(Math.floor(min / 60)) + ":" + z2(min % 60);

/**
 * Ein Termin als schmales Band – bewusst KEINE Aufgabenzeile (kein Abhak-Kreis, keine Meta-Zeile):
 * ein Farbbalken links, Uhrzeit vor dem Titel, Klick öffnet den Termin im Google Kalender. Die
 * Bänder stehen oben in der Tagesgruppe (Ganztägig zuerst, dann nach Uhrzeit) – so wie Todoist es
 * zeigt: eine Zeitmarke, kein Listeneintrag, der um die Sortierung konkurriert.
 */
function renderEventBands(list: HTMLElement, events: DayEvent[]): void {
  const sorted = [...events].sort((a, b) => (a.startMin ?? -1) - (b.startMin ?? -1) || a.event.title.localeCompare(b.event.title));
  for (const de of sorted) {
    const ev = de.event;
    const row = list.createDiv({ cls: "bt-gcal-band" });
    row.style.setProperty("--bt-ev-color", ev.color);
    if (de.startMin !== null) {
      const time = de.endMin !== null ? bandTime(de.startMin) + "–" + bandTime(de.endMin) : bandTime(de.startMin);
      row.createSpan({ cls: "bt-gcal-band-time", text: time });
    }
    row.createSpan({ cls: "bt-gcal-band-title", text: ev.title });
    row.setAttr("aria-label", t("gcalfeed_open_in_google"));
    row.setAttr("data-tooltip-position", "top");
    activateEventOpen(row, ev);
  }
}

function section(parent: HTMLElement, plugin: BeautyTasksPlugin, title: string, tasks: Task[], today: string, collapsible = false, trash = false, present?: Set<string>, events: DayEvent[] = []): void {
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
  renderEventBands(list, events);   // Termine des Tages oben (read-only), vor den Aufgaben
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
  opts: { flat?: boolean; draggable?: boolean; colId?: string } = {}): void {
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
      dragFromCol = opts.colId ?? null;   // Quell-Spalte (Status-ID bzw. Label) für die Drop-Semantik
      row.addClass("is-dragging");
      e.dataTransfer?.setData("text/plain", task.path);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => { dragPath = null; dragFromCol = null; row.removeClass("is-dragging"); });
  }

  renderCheck(row, plugin, task, { trash });

  const body = row.createDiv({ cls: "bt-body" });
  renderLinkedText(body.createDiv({ cls: "bt-title" }), plugin, task.title, task.path);

  // Beschreibungs-Vorschau (einzeilig, gekürzt) – aus dem Frontmatter (`description`), optional
  // per Einstellung. Bild-/Embed-Syntax wird entfernt, damit die Zeile nie zu einem Block aufgeht.
  if (plugin.settings.showDescriptionInList) {
    const desc = task.description
      .replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "")   // Embeds/Bilder raus
      .replace(/\s+/g, " ").trim();
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
  // Erinnerungs-Indikator: nur Icon (alarm-clock, wie der Reminder-Chip im Editor), Details im Tooltip.
  if (task.reminders.length) {
    const rem = meta.createSpan({ cls: "bt-remind", attr: { "aria-label": task.reminders.map(formatReminder).join(" · "), "data-tooltip-position": "top" } });
    setIcon(rem, "alarm-clock");
  }
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
  } else if (!plugin.currentProject && depth === 0) {
    // In einem Projekt-/Inbox-Board ist die Zuordnung redundant -> ausblenden (currentProject gesetzt);
    // sonst sichtbar. Bei verschachtelten Unteraufgaben (depth > 0) zeigt der Parent sie schon.
    // „Nicht einsortiert" (kein Projekt oder Inbox-Verweis) wird als @Eingang gezeigt.
    const extras = row.createDiv({ cls: "bt-extras" });
    if (isInboxLink(task.project)) {
      const bl = extras.createEl("a", { cls: "bt-backlink", text: "@" + t("nav_inbox") });
      bl.onclick = (e) => { e.stopPropagation(); void plugin.activateProject(INBOX_KEY); };
    } else {
      const name = projectName(task.project!);
      const bl = extras.createEl("a", { cls: "bt-backlink", text: "@" + projectDisplayName(name) });
      bl.onclick = (e) => { e.stopPropagation(); void plugin.activateProject(task.project!); };   // zum Projekt-/Bereich-Board
    }
  }
  // Klick auf die Zeile öffnet die Aufgabe (kein separater Stift – wäre redundant).
  row.onclick = () => plugin.openEditTask(task);

  // Unteraufgaben verschachtelt darunter (eingerückt nach Tiefe) – nicht im Papierkorb
  // und nicht im flachen Kanban-Kartenmodus.
  if (!trash && !opts.flat) for (const kid of plugin.index.children(task.path)) {
    if (!isTrashed(kid.status)) renderTask(list, plugin, kid, today, depth + 1);
  }
}

// ── Linke Navigation ─────────────────────────────────────────────
interface NavItemOpts { cls?: string; icon: string; iconColor?: string | null; label: string; count?: number; countKey?: string; active?: boolean; onClick: () => void; onContext?: (e: MouseEvent) => void; }

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
  // Zähler-Span IMMER anlegen (auch bei 0 – dann leer): nur so kann ihn der Badge-Füller später
  // beschreiben, ohne die Seitenleiste neu zu bauen. o.countKey registriert ihn dafür.
  if (o.countKey || o.count) {
    const badge = item.createSpan({ cls: "bt-nav-count", text: o.count ? String(o.count) : "" });
    if (o.countKey) navBadges?.set(o.countKey, badge);
  }
  activate(item, o.onClick);
  if (o.onContext) item.oncontextmenu = (e) => { e.preventDefault(); o.onContext!(e); };   // Rechtsklick = Kontextmenü
}

/** Dezente Empty-State-Zeile unter einem Sektionskopf („+ … erstellen"). */
function navHintRow(c: HTMLElement, icon: string, label: string, onClick: () => void): void {
  const row = c.createDiv({ cls: "bt-nav-hint", attr: { role: "button", tabindex: "0" } });
  setIcon(row.createSpan({ cls: "bt-nav-hint-ic" }), icon);
  row.createSpan({ cls: "bt-nav-hint-lbl", text: label });
  activate(row, onClick);
}

/** Ein-/ausklappbare Abschnittsüberschrift: Chevron-Toggle (Zustand persistent) + „+",
 *  das nur beim Hover/Fokus der Zeile erscheint. Gibt zurück, ob der Abschnitt eingeklappt ist. */
function navHead(c: HTMLElement, plugin: BeautyTasksPlugin, id: string, title: string,
  tip: string, placeholder: string, redraw: () => void, submit: (v: string) => Promise<unknown>,
  onAddClick?: () => void): boolean {
  const collapsed = plugin.isNavCollapsed(id);
  const head = c.createDiv({ cls: "bt-nav-head" });

  // Label links (füllt die Zeile): Klick/Enter führt in die jeweilige ListManager-Übersicht.
  // (Das Auf-/Zuklappen liegt jetzt beim Chevron rechts.)
  const manageSec = (id === "projects" || id === "areas" || id === "labels" || id === "filters") ? id : null;
  const toggle = head.createDiv({ cls: "bt-nav-head-toggle", attr: { role: "button", tabindex: "0" } });
  toggle.createSpan({ cls: "bt-nav-head-lbl", text: title });
  activate(toggle, () => manageSec ? void plugin.activateManage(manageSec) : void plugin.toggleNavSection(id));

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

  // Chevron rechts: vollwertiger, tastaturbedienbarer Klapp-Button (auf/zu) mit aria-expanded.
  const chev = head.createDiv({ cls: "bt-nav-head-chevron", attr: { role: "button", tabindex: "0", "aria-expanded": String(!collapsed), "aria-label": t("nav_toggle_section"), "data-tooltip-position": "top" } });
  setIcon(chev, collapsed ? "chevron-right" : "chevron-down");
  activate(chev, () => void plugin.toggleNavSection(id));

  // Rechtsklick auf den Sektionskopf: „Ausgeblendete einblenden ▸" (nur wenn es welche gibt).
  if (id === "projects" || id === "areas" || id === "labels" || id === "filters") {
    head.oncontextmenu = (e) => {
      const menu = new Menu();
      if (showHiddenSubmenu(menu, plugin, id)) { e.preventDefault(); menu.showAtMouseEvent(e); }
    };
  }

  return collapsed;
}

interface ReorderEntry { key: string; name: string; icon: string; color: string | null; }

/** Sidebar-Sortiermodus für EINE Sektion: „Fertig"-Leiste + per Griff ziehbare Zeilen.
 *  Bewegt NUR die sichtbaren Einträge; persistiert am Drop über plugin.reorderVisible –
 *  ausgeblendete behalten ihre Position (eigener Mechanismus, getrennt von der Übersicht). */
function renderReorderList(c: HTMLElement, plugin: BeautyTasksPlugin, sec: NavSection, entries: ReorderEntry[]): void {
  const bar = c.createDiv({ cls: "bt-reorder-bar" });
  bar.createSpan({ cls: "bt-reorder-lbl", text: t("reorder_active") });
  const done = bar.createEl("button", { cls: "bt-reorder-done mod-cta", text: t("reorder_done") });
  done.onclick = () => plugin.endReorder();

  const list = c.createDiv({ cls: "bt-reorder-list" });
  for (const e of entries) {
    const row = list.createDiv({ cls: "bt-reorder-row", attr: { "data-key": e.key } });
    const grip = row.createSpan({ cls: "bt-nav-grip", attr: { role: "button", tabindex: "0", "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
    setIcon(grip, "grip-vertical");
    const ic = row.createSpan({ cls: "bt-nav-ic" }); setIcon(ic, e.icon);
    if (e.color) ic.setCssStyles({ color: e.color });
    row.createSpan({ cls: "bt-nav-lbl", text: e.name });
    grip.onkeydown = (ev) => {
      if (ev.key === "ArrowUp") { ev.preventDefault(); void plugin.moveNavItemVisible(sec, e.key, -1); }
      else if (ev.key === "ArrowDown") { ev.preventDefault(); void plugin.moveNavItemVisible(sec, e.key, 1); }
    };
    attachRowDrag(row, grip, list, (keys) => void plugin.reorderVisible(sec, keys));
  }
}

/**
 * ── Seitenleiste: Struktur vs. Zahlen ────────────────────────────────────────────────────────
 * Bei jeder Änderung wurde die komplette Navigation weggeworfen und neu gebaut – 29 Einträge mit
 * Icons, Farben und Handlern, nur weil sich eine Zahl geändert hat.
 *
 * Jetzt getrennt:
 *  • Die ZAHLEN werden bei jeder Meldung neu geschrieben (kein Skip, keine Signatur) – sie können
 *    also nicht veralten. Es wird nur Text ersetzt, kein DOM erzeugt.
 *  • Die STRUKTUR (welche Einträge, Namen, Farben, aktiver Eintrag, eingeklappte Abschnitte) wird
 *    per Signatur geprüft. Ändert sie sich, läuft der vollständige Neuaufbau wie bisher.
 */
interface NavMount { sig: string; badges: Map<string, HTMLElement> }
const navMounts = new WeakMap<HTMLElement, NavMount>();
let navBadges: Map<string, HTMLElement> | null = null;   // aktive Sammlung während renderNavInto

/** Alle Zähler der Seitenleiste – dieselben Werte, die renderNavInto einsetzt. */
function navCounts(plugin: BeautyTasksPlugin): Map<string, number> {
  const m = new Map<string, number>();
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  m.set("p:" + INBOX_KEY, plugin.index.inboxOpen().length);   // eingebauter Eingang
  for (const id of VIEW_IDS) m.set("v:" + id, navCount(plugin, id));
  for (const p of [...bereiche, ...projekte]) m.set("p:" + p.path, plugin.index.byProject(p.path).length);
  const today = todayStr();
  for (const fl of listFilters(plugin.app)) m.set("f:" + fl.path, applyFilter(plugin.index, fl.criteria, fl.options, today).length);
  for (const name of plugin.getVisibleLabels()) m.set("l:" + name, plugin.index.byLabel(name).length);
  return m;
}

/** Struktur-Signatur OHNE Zahlen: gleich = dieselben Einträge in derselben Form. */
function navSignature(plugin: BeautyTasksPlugin): string {
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  const proj = (p: { path: string; name: string; icon: string; color: string | null; hidden: boolean }): string =>
    [p.path, p.name, p.icon, p.color, p.hidden].join("~");
  return JSON.stringify({
    areas: plugin.sortProjItems("areas", bereiche).map(proj),
    projects: plugin.sortProjItems("projects", projekte).map(proj),
    filters: plugin.sortFilters(listFilters(plugin.app)).map((f) => [f.path, f.name, f.icon, f.color, f.hidden].join("~")),
    labels: plugin.getVisibleLabels().map((n) => n + "~" + plugin.getLabelColor(n)),
    labelsTotal: plugin.getLabels().length,                       // steuert die „+ Label erstellen"-Zeile
    active: [plugin.currentProject, plugin.currentLabel, plugin.currentFilter, plugin.currentView, plugin.manageOpen].join("~"),
    collapsed: ["filters", "labels", "areas", "projects"].map((id) => plugin.isNavCollapsed(id)),
    reorder: plugin.reorderSec,
    preview: plugin.colorPreview,
    locale: getLocale(),
  });
}

/** Versucht, nur die Zähler der Seitenleiste nachzuziehen. true = erledigt (kein Neuaufbau nötig). */
export function tryPatchNav(c: HTMLElement, plugin: BeautyTasksPlugin): boolean {
  const m = navMounts.get(c);
  if (!m || m.sig !== navSignature(plugin)) return false;
  const counts = navCounts(plugin);
  for (const [key, el] of m.badges) {
    const n = counts.get(key) ?? 0;
    el.setText(n ? String(n) : "");
  }
  return true;
}

export function renderNavInto(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  c.empty();
  c.addClass("bt-nav");
  const redraw = () => renderNavInto(c, plugin);
  const badges = new Map<string, HTMLElement>();
  navBadges = badges;   // navItem trägt seine Zähler-Spans hier ein

  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  // Live-Vorschau der Icon-Farbe (Farb-Picker): überschreibt für EINEN Eintrag die gespeicherte Farbe.
  const navColor = (path: string, stored: string | null): string | null =>
    plugin.colorPreview?.key === path ? plugin.colorPreview.color : stored;

  // „Aufgabe hinzufügen" ganz oben (Todoist-Stil): öffnet die kompakte Schnell-Erfassung.
  // Folgt dem Kontext der geöffneten Seite – wie der Command und der „+ Aufgabe"-Knopf (addContext).
  navItem(c, { cls: "bt-nav-add-task", icon: "bt-add-task", label: t("btn_add_task"), onClick: () => plugin.openQuickAddHere() });

  // „Suchen" darunter: öffnet die Aufgaben-Suche (Command-Palette-Stil).
  navItem(c, { cls: "bt-nav-search", icon: "search", label: t("nav_search"), onClick: () => plugin.openSearch() });

  // Eingang ganz oben, OHNE Abschnittsüberschrift (über den Ansichten). Eingebaute Systemansicht
  // (keine Notiz) – KEIN volles Menü, nur der Kalender-Sync-Ein/Ausschalter (falls mit Google verbunden).
  navItem(c, {
    cls: "bt-nav-inbox", icon: "inbox", label: t("nav_inbox"),
    count: plugin.index.inboxOpen().length, countKey: "p:" + INBOX_KEY, active: plugin.currentProject === INBOX_KEY,
    onClick: () => void plugin.activateProject(INBOX_KEY),
    onContext: (e) => { const m = new Menu(); if (addGcalSyncItem(m, plugin, INBOX_KEY)) m.showAtMouseEvent(e); },
  });

  for (const id of VIEW_IDS) {
    const active = !plugin.currentProject && !plugin.currentLabel && !plugin.currentFilter && !plugin.manageOpen && plugin.currentView === id;
    // Klasse pro Board (bt-nav-heute …) für einzeln themebare Icon-Farben.
    navItem(c, { cls: "bt-nav-" + id, icon: VIEW_ICON[id], label: viewTitle(id), count: navCount(plugin, id), countKey: "v:" + id, active, onClick: () => void plugin.activateView(id) });
  }

  // cls = Kategorie-Klasse (bt-nav-area / bt-nav-project) für eine gemeinsame Icon-Farbe je Gruppe.
  // Rechtsklick auf einen Eintrag öffnet das Kontextmenü (Bearbeiten, Ausblenden, Sortieren, …).
  const projItems = (items: { name: string; path: string; icon: string; color: string | null; hidden: boolean }[], cls: string, kind: "project" | "area") => {
    const sec: NavSection = kind === "area" ? "areas" : "projects";
    const visible = items.filter((x) => !x.hidden);   // in der Verwaltung ausgeblendete weglassen
    if (plugin.reorderSec === sec) {
      renderReorderList(c, plugin, sec, visible.map((p) => ({ key: p.path, name: p.name, icon: p.icon, color: p.color })));
      return;
    }
    for (const p of visible) {
      navItem(c, {
        cls, icon: p.icon, iconColor: navColor(p.path, p.color), label: p.name,
        count: plugin.index.byProject(p.path).length, countKey: "p:" + p.path,
        active: plugin.currentProject === p.path, onClick: () => void plugin.activateProject(p.path),
        onContext: (e) => { const m = new Menu(); buildItemMenu(m, plugin, { sec, key: p.path, name: p.name, hidden: p.hidden, color: p.color, type: kind }); m.showAtMouseEvent(e); },
      });
    }
    // Leer (frisches Setup): dezenter „+ …erstellen"-Hinweis wie bei Labels/Filtern.
    if (!items.length) navHintRow(c, "plus", t(kind === "area" ? "create_area" : "create_project"), () => new NewItemModal(plugin, kind).open());
  };

  // Filter-Sektion (ÜBER den Labels): „+" öffnet den Filter-Editor. Rechtsklick = bearbeiten.
  const today = todayStr();
  const filters = plugin.sortFilters(listFilters(plugin.app));
  const filtersCollapsed = navHead(c, plugin, "filters", t("nav_filters"), t("filter_add"), "", redraw,
    async () => undefined, () => new FilterModal(plugin).open());
  if (plugin.reorderSec === "filters") {
    renderReorderList(c, plugin, "filters", filters.filter((f) => !f.hidden).map((f) => ({ key: f.path, name: f.name, icon: f.icon, color: f.color })));
  } else if (!filtersCollapsed) {
    for (const fl of filters) {
      if (fl.hidden) continue;   // im ListManager ausgeblendete Filter nicht in der Nav zeigen
      navItem(c, {
        cls: "bt-nav-filter", icon: fl.icon, iconColor: navColor(fl.path, fl.color), label: fl.name,
        count: applyFilter(plugin.index, fl.criteria, fl.options, today).length, countKey: "f:" + fl.path,
        active: plugin.currentFilter === fl.path, onClick: () => void plugin.activateFilter(fl.path),
        onContext: (e) => { const m = new Menu(); buildItemMenu(m, plugin, { sec: "filters", key: fl.path, name: fl.name, hidden: fl.hidden, color: fl.color }); m.showAtMouseEvent(e); },
      });
    }
    if (!filters.length) navHintRow(c, "plus", t("create_filter"), () => new FilterModal(plugin).open());
  }

  // Labels-Sektion: „+" öffnet das Neu-Modal. Rechtsklick = bearbeiten; leer = „+ Label erstellen".
  const labelsCollapsed = navHead(c, plugin, "labels", t("tab_labels"), t("add_label"), "", redraw,
    async () => undefined, () => new NewItemModal(plugin, "label").open());
  if (plugin.reorderSec === "labels") {
    renderReorderList(c, plugin, "labels", plugin.getVisibleLabels().map((n) => ({ key: n, name: n, icon: "hash", color: plugin.getLabelColor(n) })));
  } else if (!labelsCollapsed) {
    for (const name of plugin.getVisibleLabels()) {
      const count = plugin.index.byLabel(name).length;   // byLabel nutzt open() → ohne archivierte Projekte
      navItem(c, {
        cls: "bt-nav-label", icon: "hash", iconColor: navColor(name, plugin.getLabelColor(name)), label: name, count, countKey: "l:" + name,
        active: plugin.currentLabel === name, onClick: () => void plugin.activateLabel(name),
        onContext: (e) => { const m = new Menu(); buildItemMenu(m, plugin, { sec: "labels", key: name, name, hidden: !plugin.isLabelVisible(name), color: plugin.getLabelColor(name) }); m.showAtMouseEvent(e); },
      });
    }
    if (!plugin.getLabels().length) navHintRow(c, "plus", t("create_label"), () => new NewItemModal(plugin, "label").open());
  }

  // Bereiche: „+" öffnet das Neu-Modal (Name + Farbe), legt als type:area an.
  const areasCollapsed = navHead(c, plugin, "areas", t("group_area"), t("pick_new_area"), "", redraw,
    async () => undefined, () => new NewItemModal(plugin, "area").open());
  if (!areasCollapsed || plugin.reorderSec === "areas") projItems(plugin.sortProjItems("areas", bereiche), "bt-nav-area", "area");

  // Projekte: „+" öffnet das Neu-Modal (Name + Farbe).
  const projCollapsed = navHead(c, plugin, "projects", t("group_project"), t("pick_new_project"), "", redraw,
    async () => undefined, () => new NewItemModal(plugin, "project").open());
  if (!projCollapsed || plugin.reorderSec === "projects") projItems(plugin.sortProjItems("projects", projekte), "bt-nav-project", "project");

  navBadges = null;
  navMounts.set(c, { sig: navSignature(plugin), badges });
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
    // Checkbox-Aktionen EINMAL delegiert (nicht je Zeichnung je Checkbox – s. taskCheck.ts).
    installCheckDelegation(this.contentEl, this.plugin);
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose(): Promise<void> { this.unsub?.(); this.unsub = null; this.plugin.titleRenderComp = null; }
  draw(): void {
    if (!this.contentEl) return;
    // Kalender: Ist der Rahmen unverändert (gleiche Seite, gleicher Modus, gleicher Zeitraum), reicht
    // es, die Aufgaben-Elemente nachzuziehen – ein Dutzend statt ~1800 Elemente. Der komplette
    // Neuaufbau unten kostete gemessen ~80 ms Style + Layout + Paint bei JEDER Änderung.
    // tryPatchCalendar lehnt bei der kleinsten Abweichung ab; dann läuft der normale Pfad.
    if (!this.plugin.manageOpen && tryPatchCalendar(this.contentEl, this.plugin)) return;
    // Frische Render-Component pro Zeichnung: Markdown-Titel (Links) sauber auf-/abbauen,
    // damit sich Hover-/Embed-Kindkomponenten nicht über Redraws hinweg ansammeln.
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new Component());
    this.plugin.titleRenderComp = this.renderComp;
    this.contentEl.removeClass("bt-view-calendar");   // setzt renderCalendar bei Bedarf wieder
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
  draw(): void {
    if (!this.contentEl) return;
    // Nur die Zahlen haben sich geändert? Dann bleibt die Seitenleiste stehen (s. tryPatchNav).
    if (tryPatchNav(this.contentEl, this.plugin)) return;
    renderNavInto(this.contentEl, this.plugin);
  }
}
