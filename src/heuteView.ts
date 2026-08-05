import { ItemView, WorkspaceLeaf, setIcon, MarkdownRenderer, Component, Keymap, Menu, ViewStateResult } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { PageCtx, PageRef, pageInfo, samePage, manageTitleKey } from "./pageCtx";
import { dragTask, dragFromCol, startTaskDrag, endTaskDrag, applyDropPage } from "./taskDrag";
import { Task, NavSection, Priority } from "./types";
import { todayStr, formatDateTime, formatDeadline, combineDT, dueWhen, dueDist, dateOf, groupLabel } from "./format";
import { openDatePicker } from "./datePicker";
import { listProjectsAndAreas, listManaged, isAreaPath, isInboxLink, baseName, openTaskNote, INBOX_KEY } from "./taskService";
import { listFilters, readFilter, FilterItem } from "./filterService";
import { applyFilter, filterTasks, hasCriteria, sortTasks, groupTasks, dateColumnKeys, visibleRows, agendaOwnRow, effectiveSubtasks, sortSubtasks, DEFAULT_CRITERIA, FilterGroup, FilterSort, PageLayout, LAYOUTS, SortDir, SubtaskDisplay, ViewOptions } from "./filterEngine";
import { FilterModal } from "./filterModal";
import { NewItemModal } from "./newItemModal";
import { buildItemMenu, showHiddenSubmenu, addGcalSyncItem, addOpenItems, openEdit, NavMenuItem } from "./navMenu";
import { anzeigeButton } from "./viewPanel";
import { renderManageInto, iconBtn, confirmInline, attachRowDrag } from "./manageView";
import { ConfirmModal } from "./confirmModal";
import { parseRecurrence } from "./recurrence";
import { formatReminder } from "./reminders";
import { renderCalendar, calendarDayAnchor, tryPatchCalendar, activateEventOpen, dropCalendarAnchors } from "./calendarView";
import { DayEvent, bucketEvents, addDays, addMonths } from "./calendarModel";
import { renderCheck, installCheckDelegation } from "./taskCheck";
import { installTaskMenuDelegation, menuHoldPath } from "./taskMenu";
import { PRIOS } from "./taskModal";
import { isOpen, isDone, isTrashed, boardStatuses, statusLabel, statusTint, firstOpenStatus, StatusKind } from "./statuses";
import { t, getLocale, projectDisplayName } from "./i18n";

/**
 * ── Transienter Anzeige-Zustand: IMMER mit dem Tab schlüsseln ─────────────────────────────────
 * Diese Maps überleben ein Neuzeichnen (das ist ihr Zweck), sind aber Modul-Zustand: ohne die
 * Tab-Kennung im Schlüssel (ctx.id, s. viewKey) teilen sich zwei Tabs DERSELBEN Seite einen
 * Eintrag – Tab 2 spränge dann beim Zeichnen auf die Scrollposition von Tab 1, und ein dort
 * aufgeklapptes Unteraufgaben-Badge klappte hier mit auf.
 */
const viewKey = (ctx: PageCtx, rest: string): string => ctx.id + "|" + rest;
/** Alle Einträge eines Tabs verwerfen (beim Schließen bzw. beim Seitenwechsel des Tabs). */
function dropViewKeys(id: string): void {
  const prefix = id + "|";
  for (const map of [boardScroll, colScroll, subtaskToggle] as Map<string, unknown>[]) {
    for (const k of [...map.keys()]) if (k.startsWith(prefix)) map.delete(k);
  }
  for (const k of [...gcalExpanded]) if (k.startsWith(prefix)) gcalExpanded.delete(k);
  dropCalendarAnchors(id);   // der angezeigte Zeitraum des Kalenders liegt drüben (calendarView)
}
// Horizontale Board-Scrollposition je Board-Identität – überlebt Re-Renders (z. B. nach Karten-Drop).
const boardScroll = new Map<string, number>();
// Senkrechte Position INNERHALB einer Spalte (Schlüssel: Board-Identität + Spalten-ID).
// Nötig, weil `.bt-kanban-list` bei jeder Zeichnung neu entsteht – ein frisches Element startet
// zwangsläufig bei 0. In der Listenansicht stellt sich die Frage nicht: dort ist der Scroller
// contentEl selbst, das Element überlebt und wird nur geleert und wieder gefüllt.
const colScroll = new Map<string, number>();
// Klappzustand der verschachtelten Unteraufgaben je Hauptaufgabe: EXPLIZITE Nutzer-Klicks aufs
// Badge. Der Default hängt am Anzeige-Modus – „Eingerückt" ist offen, sonst zu –, ein Klick
// überschreibt ihn pro Aufgabe. Modul-Zustand wie gcalExpanded: überlebt renderMain(), ein
// Reload startet wieder beim Modus-Default.
const subtaskToggle = new Map<string, boolean>();
function subsExpanded(ctx: PageCtx, path: string, mode: SubtaskDisplay): boolean {
  return subtaskToggle.get(viewKey(ctx, path)) ?? (mode === "indented");
}
/**
 * Die Einzel-Klick-Zustände DIESES Tabs verwerfen – ruft das Anzeige-Panel beim MODUSWECHSEL auf.
 * Ohne das überstimmte ein früherer Badge-Klick („zu") den frisch gewählten Modus dauerhaft:
 * „Eingerückt" rückte dann genau die Aufgaben nicht ein, deren Badge man beim Ausprobieren
 * angeklickt hatte – je Ansicht andere, was wie ein Ansichts-Fehler aussah. Der Moduswechsel
 * ist die ausdrückliche neue Ansage „alle auf/zu" und setzt deshalb alle Overrides zurück.
 */
export function resetSubtaskToggles(ctx: PageCtx): void {
  const prefix = ctx.id + "|";
  for (const k of [...subtaskToggle.keys()]) if (k.startsWith(prefix)) subtaskToggle.delete(k);
}

export const VIEW_PREFIX = "beautytasks-";
export type ViewId = "heute" | "demnaechst" | "wiederkehrend" | "erledigt";
export const VIEW_IDS: ViewId[] = ["heute", "demnaechst", "wiederkehrend", "erledigt"];
export const VIEW_MAIN = VIEW_PREFIX + "main";             // Dashboard-Leaf; beliebig oft offen (je Tab eine Seite)
export const VIEW_NAV = VIEW_PREFIX + "nav";
export const OLD_VIEW_TYPES = VIEW_IDS.map((v) => VIEW_PREFIX + v);   // Aufräumen alter Sitzungen
export const VIEW_ICON: Record<ViewId, string> = {
  heute: "calendar-days", demnaechst: "calendar-1", wiederkehrend: "refresh-ccw", erledigt: "check-circle",
};
const TITLE_KEY: Record<ViewId, string> = { heute: "view_today", demnaechst: "view_upcoming", wiederkehrend: "view_recurring", erledigt: "view_done" };
/**
 * Die Anzeige-Optionen, die ein TAB für sich überschreiben darf. Beide beschreiben den BLICK,
 * nicht den Inhalt: welches Layout gerade davorsteht und ob die Seitenspalte des Kalenders offen
 * ist. Sortieren, Gruppieren, Erledigte und der Kalendermodus gehören dagegen zur Seite – sie
 * beantworten „was steht da?" und sollen in allen Tabs derselben Seite gleich beantwortet sein.
 */
type LocalOptions = Pick<ViewOptions, "layout" | "calPanel">;

/** Tab-Icon je Layout (s. MainView.getIcon). Bewusst nur lange etablierte Lucide-Namen –
 *  ein Icon, das die minAppVersion noch nicht kennt, bliebe leer. */
const LAYOUT_ICON: Record<PageLayout, string> = { list: "list", board: "layout-grid", calendar: "calendar-days" };
export const viewTitle = (id: ViewId): string => t(TITLE_KEY[id]);

/** Datum, auf das „+ Aufgabe hinzufügen" vorbelegt: in der Kalender-TAGESANSICHT der gerade
 *  angezeigte Tag, sonst null (dann greift wie bisher „heute" bzw. gar kein Datum). Projekt/Label
 *  kommen unverändert von der Seite – der Knopf verhält sich also wie in der Liste, nur mit dem
 *  Tag, den man gerade ansieht. */
function addDue(ctx: PageCtx): string | null {
  return calendarDayAnchor(ctx, ctx.opts);
}

/** Aufgabenmenge für das Kalender-Layout der System-Views (Heute/Demnächst).
 *  Diese Views schneiden ihre Menge bewusst zeitlich zu (nur heute bzw. nur Zukunft) – im Kalender
 *  wäre damit fast jede Zelle leer und Zurückblättern sinnlos. Der Kalender zeigt dort deshalb ALLE
 *  datierten Aufgaben; das Datum ist ja bereits seine Achse. Projekt-/Label-/Filterseiten behalten
 *  dagegen ihre Menge (dort ist die Einschränkung die Aussage der Seite).
 *
 *  Der Ansichtsfilter gilt trotzdem: Genau WEIL dieser Weg die Menge der Seite umgeht, muss er
 *  hier ausdrücklich stehen – sonst stellt man „nur Priorität 1" ein und der Kalender bleibt voll. */
function calendarTasks(ctx: PageCtx, opts: ViewOptions): Task[] {
  const idx = ctx.plugin.index;
  const open = idx.open();
  return ctx.filter(opts.showDone ? [...open, ...idx.done()] : open);
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
export function renderViewInto(c: HTMLElement, ctx: PageCtx, view: ViewId): void {
  const plugin = ctx.plugin;
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  c.removeClass("bt-has-desc");   // Klassen überleben empty(); pageDesc setzt sie ggf. neu
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  // Heute/Demnächst: Kopf mit „Anzeige"-Knopf (leichtes Panel). Wiederkehrend: nur Titel.
  if (view === "heute" || view === "demnaechst") {
    const top = pageTop(c, ctx.opts.layout);
    const head = top.createDiv({ cls: "bt-board-head" });
    head.createEl("h1", { text: viewTitle(view) });
    anzeigeButton(head.createDiv({ cls: "bt-head-actions" }), ctx);   // rechts an der Pane-Kante
    const add = top.createDiv({ cls: "bt-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    add.onclick = () => plugin.openNewTask(undefined, undefined, view === "heute", undefined, addDue(ctx));
  } else if (view !== "erledigt") {
    root.createEl("h1", { text: viewTitle(view) });   // „Erledigt" bekommt einen Kopf mit Tabs (unten)
  }

  const idx = plugin.index;
  if (view === "heute") {
    const opts = ctx.opts;
    // Auswahl vollständig über den Index – die Regel (Fälligkeit, ersatzweise Deadline; eine
    // verstrichene Frist macht überfällig) lebt in filterEngine und gilt für alle Zeit-Ansichten.
    const overdue = ctx.filter(idx.overdue(today)), dueToday = ctx.filter(idx.dueToday(today));
    const doneToday = ctx.filter(idx.done().filter((tk) => dateOf(tk.completed ?? "") === today));   // completed = Zeitstempel -> Datums-Teil vergleichen
    const open = [...overdue, ...dueToday];
    // Termine des Tages (read-only) zählen mit: sonst behauptete „Nichts für heute" leeren Tag,
    // obwohl der Kalender voller Meetings steckt. setRange meldet dem Feed den Zeitraum (Listen-Layout
    // hat sonst nichts, was ihn anstößt – das macht sonst nur der Kalender).
    plugin.gcalFeed?.setRange(today, today);
    // Bei aktivem Ansichtsfilter bleiben die Termine weg: Ein Termin hat weder Priorität noch
    // Label noch Projekt, kann also kein Kriterium erfüllen – er stünde als einziges Element in
    // einer Ansicht, die ausdrücklich etwas anderes sehen will.
    const todayEv = hasCriteria(ctx.crit) ? [] : dayEvents(plugin, today);
    if (!open.length && !(opts.showDone && doneToday.length) && !todayEv.length) {
      if (hasCriteria(ctx.crit)) filterEmptyState(root, ctx);
      else emptyState(root, VIEW_ICON.heute, "empty_nothing_today");
    } else if (opts.layout === "calendar") {
      renderCalendar(root, ctx, () => calendarTasks(ctx, opts), today, opts, () => ctx.redraw());
    } else if (opts.layout === "board") {
      // Board folgt der Gruppierung (Status/Label/Priorität/Projekt) – wie die vollen Seiten.
      // Termine haben hier keine Spalte (kein Tages-Board) → sie erscheinen im Listen-/Kalender-Layout.
      renderKanbanBoard(root, ctx, opts.showDone ? [...open, ...doneToday] : open, today, opts, { today: true });
    } else {
      // Wie in renderPageBody: jede Sektion bestimmt ihre Wirte aus ihrer eigenen Menge, sonst
      // fallen Unteraufgaben zwischen offen und erledigt hindurch (s. dort).
      const subs = effectiveSubtasks(opts);
      const present = nestingHosts(plugin, open, subs);
      const doneHosts = nestingHosts(plugin, doneToday, subs);
      // Heute-Liste-Default = „Datum": „Keine"(none) und „Datum" liefern denselben Überfällig/Heute-Split,
      // deshalb ist „Keine" hier ausgeblendet (s. viewPanel) und beide Werte laufen über DIESEN einen Pfad.
      const group = opts.group === "none" ? "date" : opts.group;
      // „Das eigene Datum gewinnt" (s. agendaOwnRow): bei Datums-/Deadline-Sektionen steht eine
      // Unteraufgabe mit eigenem Wert in IHRER Sektion – sonst fehlte das Kind mit Fälligkeit
      // heute in „Heute", wenn sein Parent in „Überfällig" sitzt.
      const ownRow = agendaOwnRow(group);
      if (group === "date") {
        // Default: die semantischen Sektionen Überfällig/Heute (nach opts.sort sortiert).
        // Die Termine des Tages hängen an „Heute" (Überfällig ist vergangen, dort ergäben sie keinen Sinn).
        // „Heute"-Kopf im Datumsstil „18. Jul · Heute · Samstag" (wie in „Demnächst").
        // Leere Sektionen weglassen – wie der Datums-Zweig (filterGroups(...).filter(tasks.length)):
        // kein „Überfällig · 0" und kein leeres „Heute". „Heute" bleibt aber, wenn Termine dranhängen
        // (die zählen mit, auch ohne Aufgabe für heute).
        if (visibleRows(overdue, present, ownRow).length) {
          const overdueHead = section(root, ctx, t("sec_overdue"), sortTasks(overdue, opts.sort, opts.sortDir, orderKey(plugin)), today, false, false, present, [], "", ownRow);
          rescheduleButton(overdueHead, plugin, overdue);   // verschiebt ALLE überfälligen, auch die verschachtelten
        }
        if (visibleRows(dueToday, present, ownRow).length || todayEv.length) {
          section(root, ctx, groupLabel(today, today), sortTasks(dueToday, opts.sort, opts.sortDir, orderKey(plugin)), today, false, false, present, todayEv, today, ownRow);
        }
      } else {
        // Aktive Gruppierung ersetzt den Überfällig/Heute-Split. Die Termine gehören zu „Heute":
        // in die Heute-Gruppe hinein, sonst als eigene „Heute"-Box direkt NACH „Überfällig"
        // (nie oben über allem schwebend).
        const todayHead = groupLabel(today, today);   // „18. Jul · Heute · Samstag" (Titel der Heute-Gruppe)
        const gs = groupTasks(sortTasks(open, opts.sort, opts.sortDir, orderKey(plugin)), opts.group, today, opts, labelOrderOf(plugin, open, opts.group))
          .filter((g) => visibleRows(g.tasks, present, ownRow).length);
        const hasToday = gs.some((g) => g.title === todayHead);
        const overdueIdx = gs.findIndex((g) => g.title === t("sec_overdue"));
        const eventsSection = (): void => { section(root, ctx, todayHead, [], today, false, false, present, todayEv, today, ownRow); };
        if (todayEv.length && !hasToday && overdueIdx === -1) eventsSection();   // nichts davor → oben
        gs.forEach((g, i) => {
          const isToday = g.title === todayHead;
          section(root, ctx, g.title, g.tasks, today, false, false, present, isToday ? todayEv : [], isToday ? today : "", ownRow);
          // Kein Sammel-„Verschieben" hier: „Datum" läuft über den Split-Zweig oben (dort trägt Überfällig
          // seinen Knopf). Bei „Deadline" stammt die gleichnamige Gruppe aus `scheduled` – eine Deadline
          // verhandelt man einzeln, nicht per Sammelklick; „Priorität"/„Label"/„Projekt" ohnehin fachfremd.
          if (todayEv.length && !hasToday && i === overdueIdx) eventsSection();   // direkt nach „Überfällig"
        });
      }
      if (opts.showDone && visibleRows(doneToday, doneHosts).length) section(root, ctx, t("sec_done"), doneToday, today, true, false, doneHosts);
    }
  } else if (view === "demnaechst") {
    // „Demnächst" ist eine reine, datierte Zukunfts-Agenda: KEINE undatierten (die gehören in
    // Eingang/Projekt bzw. später „Irgendwann") und KEINE erledigten (gehören in „Erledigt").
    const opts = ctx.opts;
    // Der Ansichtsfilter greift PRO TAG; Tage, von denen nichts übrig bleibt, verschwinden ganz
    // (sonst stünden leere Datums-Überschriften in der Agenda).
    const groups = idx.upcomingByDate(today)
      .map((g) => ({ ...g, tasks: ctx.filter(g.tasks) })).filter((g) => g.tasks.length);
    // Termine des Vorschauzeitraums (read-only). Der Feed lädt diesen Bereich nach (Listen-Layout
    // stößt ihn sonst nicht an). Ein Tag MIT Terminen, aber OHNE Aufgabe, bekommt so trotzdem seine
    // Gruppe – „Demnächst" wird so zur ehrlichen Wochenplanungs-Fläche.
    const eventEnd = upcomingEventEnd(plugin, today);
    plugin.gcalFeed?.setRange(today, eventEnd);   // LADEN ab heute – „Heute" braucht denselben Feed
    // ANZEIGEN erst ab morgen: „Demnächst" beginnt bei morgen, und das muss für Termine genauso
    // gelten wie für Aufgaben. Sonst entstand allein wegen eines heutigen Termins eine „Heute"-
    // Gruppe in einer Ansicht, die Heutiges gar nicht zeigt – doppelt zur Heute-Liste.
    // Wie in „Heute": bei aktivem Ansichtsfilter keine Termine (sie können kein Kriterium erfüllen).
    const evByDate = hasCriteria(ctx.crit) ? new Map<string, DayEvent[]>() : feedEventsByDate(plugin, addDays(today, 1), eventEnd);
    if (!groups.length && !evByDate.size) {
      if (hasCriteria(ctx.crit)) filterEmptyState(root, ctx);
      else emptyState(root, VIEW_ICON.demnaechst, "empty_nothing_scheduled");
    } else if (opts.layout === "calendar") {
      renderCalendar(root, ctx, () => calendarTasks(ctx, opts), today, opts, () => ctx.redraw());
    } else if (opts.layout === "board") {
      // Demnächst gruppiert wie Heute – Default Datum: ein gespeichertes „none" wird zu „date"
      // (Spalte je Datum), jede andere Wahl (Label/Priorität/Projekt/Deadline) gilt wie sonst.
      renderKanbanBoard(root, ctx, groups.flatMap((g) => g.tasks), today, { ...opts, group: opts.group === "none" ? "date" : opts.group }, {});
    } else {
      // Gruppierung wie Heute – Default Datum. „date"/„none": die chronologische Datums-Agenda (mit
      // Terminen). Jede andere Wahl (Label/Priorität/Projekt/Deadline) gruppiert die Aufgaben wie auf
      // den vollen Seiten; Termine haben dort keine Gruppe und entfallen (wie im Board).
      const flat = groups.flatMap((g) => g.tasks);
      const present = nestingHosts(plugin, flat, effectiveSubtasks(opts));
      const group = opts.group === "none" ? "date" : opts.group;
      // „Das eigene Datum gewinnt" (s. agendaOwnRow): das Kind mit Fälligkeit übermorgen steht
      // bei ÜBERMORGEN als eigene Zeile (nicht NUR unter seinem Parent am Morgen-Tag).
      const ownRow = agendaOwnRow(group);
      if (group === "date") {
        const tasksByDate = new Map(groups.map((g) => [g.date, g.tasks]));
        // Datums-Vereinigung: alle Aufgaben-Tage PLUS alle Tage mit Terminen, chronologisch.
        const dates = [...new Set([...tasksByDate.keys(), ...evByDate.keys()])].sort();
        for (const date of dates) {
          // Innerhalb eines Tages nach der gewählten Sortierung ordnen (wie „Heute" seine Sektionen) –
          // die Tages-REIHENFOLGE bleibt chronologisch (Agenda).
          const dayTasks = sortTasks(tasksByDate.get(date) ?? [], opts.sort, opts.sortDir, orderKey(plugin));
          const dayEv = evByDate.get(date) ?? [];
          // Ein Tag, dessen Aufgaben allesamt unter ihren Eltern hängen, hätte sonst einen Kopf
          // mit „· 0" – siehe sectionRows. Tage mit Terminen bleiben auch ohne Aufgabe stehen.
          if (visibleRows(dayTasks, present, ownRow).length || dayEv.length)
            section(root, ctx, groupLabel(date, today), dayTasks, today, false, false, present, dayEv, date, ownRow);
        }
      } else {
        const gs = groupTasks(sortTasks(flat, opts.sort, opts.sortDir, orderKey(plugin)), group, today, opts, labelOrderOf(plugin, flat, group))
          .filter((g) => visibleRows(g.tasks, present, ownRow).length);
        for (const g of gs) section(root, ctx, g.title, g.tasks, today, false, false, present, [], "", ownRow);
      }
    }
  } else if (view === "wiederkehrend") {
    renderRecurring(root, ctx, today);
  } else {
    // „Erledigt" wie Manage: Kopf mit Titel links, Tabs (Erledigt | Papierkorb) rechts.
    const redraw = () => ctx.redraw();
    const header = root.createDiv({ cls: "bt-manage-header" });
    header.createEl("h1", { text: ctx.doneTab === "trash" ? t("nav_trash") : viewTitle(view) });
    // Kebab + Tabs rechts gruppieren: der Kebab sitzt (wie die Projekt-/Bereichs-Kebabs) links neben
    // den Tabs und trägt dieselbe Button-/Menü-CSS (bt-manage-btn + natives Obsidian-Menü).
    const headActions = header.createDiv({ cls: "bt-head-actions" });
    // Papierkorb-Aktionen im Kebab (nur im Papierkorb-Tab und nur wenn etwas drin ist):
    // Alle wiederherstellen (reversibel) · Papierkorb leeren (destruktiv -> Bestätigung).
    if (ctx.doneTab === "trash" && idx.cancelled().length) {
      const kebab = headActions.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": t("more_actions"), "data-tooltip-position": "top" } });
      setIcon(kebab.createSpan(), "more-horizontal");
      kebab.onclick = (e) => {
        e.stopPropagation();
        const m = new Menu();
        m.addItem((mi) => mi.setTitle(t("trash_restore_all")).setIcon("archive-restore").onClick(() => void plugin.restoreAllCancelled()));
        m.addItem((mi) => mi.setTitle(t("trash_empty")).setIcon("trash-2").setWarning(true).onClick(() =>
          new ConfirmModal(plugin.app, { title: t("confirm_empty_trash_q"), confirmText: t("trash_empty") }, () => void plugin.emptyTrash()).open()));
        m.showAtMouseEvent(e);
      };
    }
    const tabs = headActions.createDiv({ cls: "bt-tabs" });
    const mkTab = (id: "done" | "trash", label: string) => {
      const b = tabs.createEl("button", { cls: "bt-tab" + (ctx.doneTab === id ? " is-active" : ""), text: label });
      b.onclick = () => { ctx.setDoneTab(id); redraw(); };
    };
    mkTab("done", t("view_done"));
    mkTab("trash", t("nav_trash"));

    if (ctx.doneTab === "trash") {
      const items = idx.cancelled();
      if (!items.length) { emptyState(root, "trash-2", "empty_trash"); return; }
      // Liste identisch zur Erledigt-Liste (dieselben Task-Zeilen), nur im Papierkorb-Modus.
      section(root, ctx, t("nav_trash"), items, today, false, true);
    } else {
      const done = idx.done();
      // `present` mitgeben: sonst nimmt die Liste an, JEDE Unteraufgabe hänge schon unter ihrer
      // Hauptaufgabe – und lässt sie weg. Ist die Hauptaufgabe noch offen, steht sie hier aber
      // gar nicht, und die abgehakte Unteraufgabe war nirgends auffindbar. Mit `present` bekommt
      // sie eine eigene Zeile; nur wenn ihre Hauptaufgabe ebenfalls hier steht, bleibt sie unter
      // ihr eingeklappt (erreichbar über deren Fortschritts-Badge).
      const present = nestingHosts(plugin, done, effectiveSubtasks(ctx.opts));
      if (!visibleRows(done, present).length) emptyState(root, VIEW_ICON.erledigt, "empty_nothing_done");
      else section(root, ctx, t("sec_done"), done, today, false, false, present);
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
function renderRecurring(root: HTMLElement, ctx: PageCtx, today: string): void {
  const plugin = ctx.plugin;
  const recs = plugin.index.open().filter((tk) => tk.recurrence);   // open() blendet archivierte Projekte aus
  if (!recs.length) { emptyState(root, VIEW_ICON.wiederkehrend, "empty_nothing_recurring"); return; }
  const groups = new Map<string, Task[]>();
  for (const tk of recs) {
    const key = recurKey(tk.recurrence ?? "");
    const arr = groups.get(key); if (arr) arr.push(tk); else groups.set(key, [tk]);
  }
  // Wie in der Erledigt-Ansicht: ohne `present` fiele jede wiederkehrende Unteraufgabe heraus,
  // deren Hauptaufgabe nicht selbst wiederkehrend ist (sie steht dann nicht in dieser Liste).
  const present = nestingHosts(plugin, recs, effectiveSubtasks(ctx.opts));
  const recurSection = (title: string, items: Task[]): void => {
    if (visibleRows(items, present).length) section(root, ctx, title, items.sort(byDue), today, false, false, present);
  };
  for (const key of RECUR_ORDER) {
    const items = groups.get(key);
    if (items) recurSection(t(key), items);
  }
  for (const [key, items] of groups) {
    if (key.startsWith("raw:")) recurSection(key.slice(4), items);
  }
}

/** Obsidians „Lesbare Zeilenlänge" respektieren (wie Markdown-Ansichten): Breite +
 *  Zentrierung über --file-line-width, wenn die Einstellung aktiv ist. */
function applyReadableWidth(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  const cfg = (plugin.app.vault as unknown as { getConfig?: (k: string) => unknown }).getConfig?.("readableLineLength");
  c.toggleClass("is-readable-line-width", cfg !== false);   // Standard in Obsidian = an
}

const byDue = (a: Task, b: Task) => (a.due ?? "").localeCompare(b.due ?? "");

/** Einheitlicher Leerzustand für alle Boards: zentriert im Restraum, Icon + Text (Akzentfarbe).
 *  Struktur/Position/Style sind bewusst identisch – die Optik steuert `.bt-empty` in styles.css.
 *  `action` hängt einen Knopf darunter (derzeit „Filter zurücksetzen"). */
function emptyState(root: HTMLElement, icon: string, key: string, action?: { label: string; onClick: () => void }): void {
  root.addClass("is-empty");   // zentriert den Leerzustand (ersetzt :has(> .bt-empty))
  const box = root.createDiv({ cls: "bt-empty" });
  setIcon(box.createDiv({ cls: "bt-empty-ic" }), icon);
  box.createDiv({ cls: "bt-empty-text", text: t(key) });
  if (action) box.createEl("button", { cls: "bt-empty-btn", text: action.label }).onclick = action.onClick;
}

/**
 * Leerzustand einer Seite, deren Aufgaben der ANSICHTSFILTER verbirgt.
 *
 * Ohne ihn behauptete die Projektseite „Noch keine Aufgaben in diesem Projekt" – falsch und
 * erschreckend, und der einzige Weg zurück (das Anzeige-Panel) wäre nirgends erwähnt. Deshalb
 * benennt der Text die Ursache und der Knopf beseitigt sie an Ort und Stelle.
 */
function filterEmptyState(root: HTMLElement, ctx: PageCtx): void {
  emptyState(root, "filter", "empty_no_filter_match",
    { label: t("filter_clear"), onClick: () => ctx.setCriteria({ ...DEFAULT_CRITERIA }) });
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
export function renderProjectBoardInto(c: HTMLElement, ctx: PageCtx, projectPath: string): void {
  const plugin = ctx.plugin;
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  c.removeClass("bt-has-desc");   // Klassen überleben empty(); pageDesc setzt sie ggf. neu
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const isInbox = projectPath === INBOX_KEY;   // eingebaute Eingang-Ansicht (keine Notiz)
  const name = isInbox ? "" : baseName(projectPath);
  // Kopf: Kebab-Menü (wie Sidebar-Rechtsklick); Eingang ist eine Systemansicht → kein Menü.
  const isArea = !isInbox && isAreaPath(plugin.app, projectPath);
  // ALLE (aktiv UND archiviert) durchsuchen: archivierte fehlen in listProjectsAndAreas, hätten also
  // kein Kebab -> man käme aus einer archivierten Projektseite nicht mehr heraus.
  const meta = isInbox ? null
    : (() => { const { active, archived } = listManaged(plugin.app); return [...active, ...archived].find((p) => p.path === projectPath) ?? null; })();
  const top = pageTop(c, ctx.opts.layout);
  const projItem: NavMenuItem | null = meta
    ? { sec: meta.type === "area" ? "areas" : "projects", key: meta.path, name: meta.name, hidden: meta.hidden, color: meta.color, type: meta.type, archived: meta.archived }
    : null;
  pageHeader(top, ctx, top.createEl("h1", { text: isInbox ? t("nav_inbox") : projectDisplayName(name) }),
    projItem ? { menu: projItem } : {});
  pageDesc(top, plugin, meta?.description, projItem);
  // Im Eingang neue Aufgaben OHNE Projekt anlegen (Eingang = kein Projekt), sonst im Projekt.
  addBar(top, plugin, () => plugin.openNewTask(isInbox ? undefined : name, undefined, false, undefined, addDue(ctx)));

  // Eingang = alle „nicht einsortierten" Aufgaben (kein Projekt ODER Verweis auf Inbox).
  // ctx.filter davor: der Ansichtsfilter der Seite (Anzeige-Panel), siehe PageCtx.filter.
  const source = (): Task[] => ctx.filter(isInbox
    ? plugin.index.inbox()
    : plugin.index.all().filter((t) => t.project != null && baseName(t.project) === name));
  const tasks = source();
  if (!tasks.length) {
    if (hasCriteria(ctx.crit)) filterEmptyState(root, ctx);
    else if (isInbox) emptyState(root, "inbox", "empty_no_inbox_tasks");
    else if (isArea) emptyState(root, "circle-small", "empty_no_area_tasks");
    else emptyState(root, "folder", "empty_no_project_tasks");
    return;
  }
  renderPageBody(root, ctx, source, ctx.opts, today, isInbox ? { project: null } : { project: name });
}

/** Label-Board: alle Aufgaben mit einem Label, nach Status/Datum gruppiert (wie Projekt-Board). */
export function renderLabelBoardInto(c: HTMLElement, ctx: PageCtx, label: string): void {
  const plugin = ctx.plugin;
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  c.removeClass("bt-has-desc");   // Klassen überleben empty(); pageDesc setzt sie ggf. neu
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const top = pageTop(c, ctx.opts.layout);
  pageHeader(top, ctx, top.createEl("h1", { cls: "bt-label-title", text: "#" + label }),
    { menu: { sec: "labels", key: label, name: label, hidden: !plugin.isLabelVisible(label), color: plugin.getLabelColor(label) } });
  addBar(top, plugin, () => plugin.openNewTask(undefined, label, false, undefined, addDue(ctx)));

  const source = (): Task[] => ctx.filter(
    plugin.index.all().filter((tk) => tk.labels.includes(label) && !plugin.index.isProjectArchived(tk.project)));
  const tasks = source();
  if (!tasks.length) {
    if (hasCriteria(ctx.crit)) filterEmptyState(root, ctx);
    else emptyState(root, "hash", "empty_no_label_tasks");
    return;
  }
  renderPageBody(root, ctx, source, ctx.opts, today, { label });
}

/** Reihenfolge der Label-Gruppen = die der Seitenleiste (Name · Anzahl · manuell), damit Liste
 *  und Board dieselbe Ordnung zeigen. Vorher sortierte die Liste stur alphabetisch, das Board
 *  dagegen über plugin.sortLabels – eine manuell sortierte Label-Leiste schlug sich also nur
 *  im Board nieder. Berücksichtigt nur Labels, die in dieser Menge überhaupt vorkommen. */
function labelOrderOf(plugin: BeautyTasksPlugin, tasks: Task[], group: FilterGroup): string[] | undefined {
  if (group !== "label") return undefined;
  const names = [...new Set(tasks.flatMap((tk) => tk.labels))];
  return plugin.sortLabels(names.map((name) => ({ name }))).map((x) => x.name);
}

/** Generischer Seiten-Body (Boards): honoriert Layout · Sortieren · Gruppieren · Erledigte.
 *  `source` liefert die Aufgaben der Seite – als Funktion, damit der Kalender sie beim
 *  inkrementellen Nachzeichnen frisch holen kann, ohne die Seiten-Logik zu kennen. */
function renderPageBody(root: HTMLElement, ctx: PageCtx, source: () => Task[], opts: ViewOptions, today: string,
  add: BoardAdd): void {
  const plugin = ctx.plugin;
  const tasks = source();
  const open = tasks.filter((t) => isOpen(t.status));
  const done = tasks.filter((t) => isDone(t.status)).sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  if (opts.layout === "board") {
    renderKanbanBoard(root, ctx, opts.showDone ? [...open, ...done] : open, today, opts, add);
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
    renderCalendar(root, ctx, calSource, today, opts, () => ctx.redraw(), add);
    return;
  }
  const sorted = sortTasks(open, opts.sort, opts.sortDir, orderKey(plugin));
  // JEDE Sektion bestimmt ihre Wirte aus IHRER eigenen Menge. Eine gemeinsame Menge liess beide
  // Richtungen verschwinden: eine erledigte Unteraufgabe mit offenem Parent fiel aus „Erledigt"
  // (der Parent galt als Wirt, stand aber in einer anderen Sektion), und umgekehrt rutschte eine
  // offene Unteraufgabe mit erledigtem Parent in die eingeklappte Erledigt-Sektion hinein.
  // Die Erledigt-ANSICHT macht es seit 1.20.3 schon so – hier war es uebersehen.
  const subs = effectiveSubtasks(opts);
  const openHosts = nestingHosts(plugin, open, subs);
  const doneHosts = nestingHosts(plugin, done, subs);
  // Bei Gruppierung „Datum"/„Deadline" gewinnt das eigene Datum der Unteraufgabe (agendaOwnRow) –
  // sie steht in IHRER Tages-Sektion, nicht nur verschachtelt beim Parent in dessen Sektion.
  const ownRow = agendaOwnRow(opts.group);
  for (const g of groupTasks(sorted, opts.group, today, opts, labelOrderOf(plugin, sorted, opts.group))) {
    if (visibleRows(g.tasks, openHosts, ownRow).length) section(root, ctx, g.title, g.tasks, today, false, false, openHosts, [], "", ownRow);
  }
  if (opts.showDone && visibleRows(done, doneHosts).length) section(root, ctx, t("sec_done"), done, today, true, false, doneHosts);
}

/** Filter-Board: die Treffer eines gespeicherten Filters, sortiert/gruppiert nach seinen
 *  Optionen. Layout (Liste/Kanban) folgt – wie Projekte – dem globalen Umschalter. */
export function renderFilterBoardInto(c: HTMLElement, ctx: PageCtx, filterPath: string): void {
  const plugin = ctx.plugin;
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  c.removeClass("bt-has-desc");   // Klassen überleben empty(); pageDesc setzt sie ggf. neu
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const filter = readFilter(plugin.app, filterPath);
  if (!filter) { emptyState(root, "tag", "empty_no_filter"); return; }

  // Kopf: Titel + [Stift Kriterien-Editor] [Link „Filter"] [Anzeige].
  // ctx.opts statt filter.options: identisch bis auf das Layout, und DAS kann dieser Tab
  // überschreiben (s. MainView.setLayout) – filter.options kennt nur den Seiten-Standard.
  const opts = ctx.opts;
  const top = pageTop(c, opts.layout);
  const filterItem: NavMenuItem = { sec: "filters", key: filterPath, name: filter.name, hidden: filter.hidden, color: filter.color };
  pageHeader(top, ctx, top.createEl("h1", { text: filter.name }), { menu: filterItem });
  pageDesc(top, plugin, filter.description, filterItem);
  addBar(top, plugin, () => plugin.openNewTask(undefined, undefined, false, undefined, addDue(ctx)));

  // Kriterien filtern die Menge; renderPageBody übernimmt Layout/Sortieren/Gruppieren/Erledigte.
  const tasks = applyFilter(plugin.index, filter.criteria, opts, today);
  if (!tasks.length) { emptyState(root, filter.icon, "empty_no_filter_tasks"); return; }
  renderPageBody(root, ctx, () => applyFilter(plugin.index, filter.criteria, opts, today), opts, today, {});
}

// ── Seiten-Kopf: Titel links, rechts eine Aktionsgruppe (Variante 02) ──
interface HeaderOpts {
  menu?: NavMenuItem;     // Kebab: Item-Kontextmenü (Board-Variante); fehlt → kein Kebab (z. B. Eingang)
}
/** Board-Überschrift: Titel + rechte Gruppe [Kebab-Menü] [Anzeige].
 *  Der Kebab öffnet dasselbe Kontextmenü wie ein Rechtsklick in der Seitenleiste – ohne die
 *  Sortier-Optionen, dafür mit „Zur …übersicht" (früher der list-plus-Kopf-Button). */
function pageHeader(root: HTMLElement, ctx: PageCtx, titleEl: HTMLElement, opts: HeaderOpts = {}): void {
  const plugin = ctx.plugin;
  const head = root.createDiv({ cls: "bt-board-head" });
  head.appendChild(titleEl);
  const actions = head.createDiv({ cls: "bt-head-actions" });
  if (opts.menu) {
    const it = opts.menu;
    const kebab = actions.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": t("more_actions"), "data-tooltip-position": "top" } });
    setIcon(kebab.createSpan(), "more-horizontal");
    kebab.onclick = (e) => { e.stopPropagation(); const m = new Menu(); buildItemMenu(m, plugin, it, "board"); m.showAtMouseEvent(e); };
  }
  anzeigeButton(actions, ctx);
}

/** Kurzbeschreibung unter dem Seitentitel – die eine Zeile aus dem Frontmatter der Projekt-,
 *  Bereichs- oder Filternotiz. Ist sie leer, steht dort ein blasser Platzhalter, der in denselben
 *  Bearbeiten-Dialog führt, in dem das Feld liegt – so ist das Feld auffindbar, ohne dass man das
 *  Kontextmenü kennt. Ohne Eintrag (Eingang, eingebaute Ansichten) entsteht gar nichts. */
function pageDesc(root: HTMLElement, plugin: BeautyTasksPlugin, text: string | undefined, item: NavMenuItem | null): void {
  // Abgeschaltet: gar nichts rendern – und damit auch keine bt-has-desc-Markierung. Die Seite
  // bekommt dann exakt die Abstände der Systemansichten, sodass „+ Aufgabe hinzufügen" beim
  // Wechsel zwischen Eingang und Projekt nicht springt.
  if (!plugin.settings.showProjectDescription) return;
  const t2 = (text ?? "").trim();
  if (!t2 && !item) return;
  const el = root.createDiv({ cls: "bt-page-desc" + (t2 ? "" : " is-empty"), text: t2 || t("desc_add") });
  // Nur Seiten MIT Beschreibungszeile rücken Bar und erste Sektion enger zusammen – die
  // Systemansichten (Heute, Demnächst, Eingang, Labels …) behalten ihre Abstände.
  root.closest<HTMLElement>(".bt-view")?.addClass("bt-has-desc");
  if (!item) return;   // ohne Eintrag kein Ziel – dann bleibt es reiner Text
  // Auch die gefüllte Beschreibung führt in den Dialog: Wer sie ändern will, klickt sie an,
  // statt den Umweg über das Kontextmenü zu suchen.
  el.setAttr("role", "button");
  el.setAttr("tabindex", "0");
  // Der Tooltip zeigt den VOLLEN Text – die Zeile ist auf eine Zeile begrenzt, Längeres wäre
  // sonst nur in der Notiz zu lesen. Beim Platzhalter gibt es nichts zu zeigen, dort nennt er
  // stattdessen das Ziel des Klicks.
  el.setAttr("aria-label", t2 || t("menu_edit"));
  el.setAttr("data-tooltip-position", "top");
  el.onclick = () => openEdit(plugin, item);
  el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openEdit(plugin, item); } };
}

/** Positionsketten-Schlüssel für die Sortierung „Manuell". Liegt im Index, weil er den Elter
 *  braucht – der in der zu sortierenden Liste gar nicht vorkommen muss. Wird an JEDEN
 *  sortTasks-Aufruf gereicht, damit „Manuell" in Liste und Board dieselbe Ordnung ergibt. */
const orderKey = (plugin: BeautyTasksPlugin) => (t: Task): number[] => plugin.index.orderKey(t);

// ── Kanban-Board (Spalten = Status, Karten per Drag-and-Drop verschiebbar) ──
/**
 * Innerhalb einer Spalte sortieren – nach derselben Wahl wie die Liste (Anzeige-Panel).
 * Vorher war das hier fest auf „Datum, dann Titel" verdrahtet: die Spalten stammen aus 1.2.0,
 * die Sortierrichtung kam erst mit 1.13.0 dazu und wurde nie nachgezogen. Sortieren/Richtung
 * standen im Board also im Panel, ohne etwas zu bewirken.
 *
 * Ausnahme bleibt die „erledigt"-Spalte: zuletzt Abgehaktes oben – wie die „Erledigt"-Sektion
 * der Liste. Eine Spalte aus fertigen Aufgaben beantwortet „was ist zuletzt passiert?", nicht
 * „was kommt als Nächstes?"; eine Sortierung nach Fälligkeit hilft dort niemandem.
 */
function sortColumn(list: Task[], kind: StatusKind, sort: FilterSort, dir: SortDir,
  key: (t: Task) => number[]): Task[] {
  if (kind === "done") return [...list].sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  return sortTasks(list, sort, dir, key);
}

// ── Generisches Spalten-Modell: das Board folgt der Gruppierung ──
// Fundament für Status/Label/… – aktuell freigeschaltet: Status (Default) und Label.
/** Basis-Kontext fürs „+ Aufgabe" einer Spalte (die Spalten-Dimension setzt die Spalte selbst). */
interface BoardAdd { project?: string | null; label?: string; today?: boolean; }
interface BoardColumn {
  id: string;                                   // stabile Spalten-ID (Status-ID bzw. Label-Name / NO_LABEL)
  title: string;
  tint: string;                                 // Kopf-Punkt-Farbe
  kind: StatusKind;                             // steuert sortColumn (Nicht-Status = "open")
  has: (tk: Task) => boolean;                   // gehört die Aufgabe in diese Spalte?
  onDrop?: (tk: Task, fromColId: string) => void; // Loslassen aus Spalte fromColId; fehlt = kein Drop-Ziel
  onAdd?: () => void;                           // „+ Aufgabe" in dieser Spalte; fehlt = kein „+" (z. B. „Überfällig")
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
  const present = new Set(tasks.filter((t) => t.project && !isInboxLink(t.project)).map((t) => baseName(t.project!)));
  const ordered = [
    ...plugin.sortProjItems("areas", bereiche.filter((p) => present.has(p.name))),
    ...plugin.sortProjItems("projects", projekte.filter((p) => present.has(p.name))),
  ];
  const names = ordered.map((p) => p.name);
  for (const n of present) if (!names.includes(n)) names.push(n);   // Sicherheitsnetz (z. B. archivierte Liste)
  const cols: BoardColumn[] = names.map((name) => ({
    id: name, title: projectDisplayName(name), tint: colorOf.get(name) ?? "var(--bt-nav-project)", kind: "open",
    has: (tk: Task) => !!tk.project && baseName(tk.project) === name,
    onDrop: (tk: Task) => { if (!tk.project || baseName(tk.project) !== name) void plugin.setTaskProject(tk, name); },
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

/** Datums-Spalten (Gruppierung „date" = due · „deadline" = scheduled): eine Spalte je exaktem Datum,
 *  spiegelt die Listen-Datumsgruppierung (dateColumnKeys). „Überfällig" ist ein berechneter Sammel-
 *  Bucket ohne setzbares Datum -> KEIN Drop-/„+"-Ziel (onDrop/onAdd weggelassen). „Ohne Datum" und die
 *  konkreten Datumsspalten sind Drop-Ziele: Ziehen setzt bzw. löscht das Datum (setTaskDate). */
function dateColumns(plugin: BeautyTasksPlugin, cards: Task[], today: string, field: "due" | "scheduled", add: BoardAdd): BoardColumn[] {
  const dateOfTask = (tk: Task): string | null => field === "due" ? tk.due : tk.scheduled;
  return dateColumnKeys(cards, today, field).map((key): BoardColumn => {
    if (key === "overdue") return {
      id: "overdue", title: t("sec_overdue"), tint: "var(--bt-overdue)", kind: "open",
      has: (tk: Task) => { const d = dateOfTask(tk); return !!d && d < today; },
      // kein onDrop/onAdd: „Überfällig" ist berechnet, hat kein einzelnes Zieldatum.
    };
    if (key === "nodate") return {
      id: "nodate", title: t("sec_no_date"), tint: "var(--text-muted)", kind: "open",
      has: (tk: Task) => !dateOfTask(tk),
      onDrop: (tk: Task) => { if (dateOfTask(tk)) void plugin.setTaskDate(tk, field, ""); },   // Datum löschen
      onAdd: () => plugin.openNewTask(add.project ?? undefined, add.label, add.today ?? false),
    };
    const d = key.slice(2);   // "d:2026-07-15" -> "2026-07-15"
    return {
      id: key, title: groupLabel(d, today), tint: "var(--text-muted)", kind: "open",
      has: (tk: Task) => dateOfTask(tk) === d,
      onDrop: (tk: Task) => { if (dateOfTask(tk) !== d) void plugin.setTaskDate(tk, field, d); },
      onAdd: () => plugin.openNewTask(add.project ?? undefined, add.label, add.today ?? false,
        undefined, field === "due" ? d : undefined, field === "scheduled" ? d : undefined),
    };
  });
}

/** Horizontales Edge-Autoscroll beim Karten-Drag (natives HTML5-DnD scrollt eigene Container in
 *  Chromium NICHT): Kommt der Cursor an den linken/rechten Rand des Boards, scrollt es fortlaufend –
 *  auch beim Stillhalten am Rand (die rAF-Schleife läuft mit der zuletzt gemeldeten Position weiter).
 *  Nur für eigene Karten (s. taskDrag.ts). Popout-sicher (reiner Element-Scroll). Selbst-Stopp, sobald die
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
  board.addEventListener("dragover", (e) => { if (dragTask()) drive(e.clientX); });   // nur eigene Karten, kein Vault-/Text-Drag
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

/** Alle Zieh-Markierungen einer Liste entfernen (Einfügekante und Ausgrauen). */
function clearDropTarget(list: HTMLElement): void {
  for (const el of Array.from(list.querySelectorAll<HTMLElement>(".bt-task"))) {
    el.removeClass("is-drop-before"); el.removeClass("is-drop-after"); el.removeClass("is-drop-inert");
  }
}

/**
 * Vor WELCHE Zeile würde auf Höhe `y` losgelassen? Markiert die Stelle und gibt den Pfad zurück,
 * vor dem eingefügt wird – null für „ans Ende", undefined für „hier ist nichts einzusortieren".
 *
 * Es zählen nur GESCHWISTER der gezogenen Aufgabe: eine Position gilt unter Geschwistern, also
 * sind die Kanten dazwischen die einzigen sinnvollen Einfügestellen. Eine Unteraufgabe lässt sich
 * damit nicht zwischen fremde Aufgaben ziehen – sie bliebe ohnehin im Slot ihres Elters.
 *
 * Damit das SICHTBAR ist, werden alle übrigen Zeilen währenddessen ausgegraut. Ohne das sieht eine
 * gemischte Spalte gleichförmig aus, und die Markierung springt scheinbar grundlos über Karten
 * hinweg – das wirkt wie eine Sperre statt wie „gehört nicht zu dieser Ordnung". Der Fall tritt
 * real auf: Unteraufgaben einer ERLEDIGTEN Hauptaufgabe stehen als eigene Karten in der Spalte,
 * sortieren aber an der Position ihres unsichtbaren Elters.
 *
 * Dieselbe Funktion für Board und Liste. In beiden ist `list` der Container der Zeilen/Karten;
 * berechnen und markieren gehören zusammen, weil beides dieselbe Geschwister-Auswahl braucht.
 */
function showDropTarget(list: HTMLElement, dragged: Task, plugin: BeautyTasksPlugin, y: number): string | null | undefined {
  const rows = Array.from(list.querySelectorAll<HTMLElement>(".bt-task"));
  for (const el of rows) { el.removeClass("is-drop-before"); el.removeClass("is-drop-after"); }
  /** Gehört diese Zeile zur selben Geschwistergruppe? (Die gezogene selbst zählt dazu – sie soll
   *  nicht ausgegraut werden, sie trägt bereits `is-dragging`.) */
  const related = (el: HTMLElement): boolean => {
    const tk = el.dataset.path ? plugin.index.get(el.dataset.path) : undefined;
    return !!tk && tk.parent === dragged.parent;
  };
  for (const el of rows) el.toggleClass("is-drop-inert", !related(el));
  const siblings = rows.filter((el) => related(el) && el.dataset.path !== dragged.path);
  if (!siblings.length) return undefined;   // nichts einzusortieren – alles andere ist bereits grau
  for (const el of siblings) {
    const r = el.getBoundingClientRect();
    if (y < r.top + r.height / 2) { el.addClass("is-drop-before"); return el.dataset.path ?? null; }
  }
  siblings[siblings.length - 1].addClass("is-drop-after");
  return null;   // unterhalb aller Geschwister -> ans Ende
}

/**
 * Zeile in der LISTE von Hand einsortieren – per Griff, nur bei Sortierung „Manuell".
 *
 * Bewusst NICHT attachRowDrag (ListManager): das ordnet das DOM live um und kennt keine
 * Hierarchie. In „Eingerückt" bliebe der Teilbaum einer gezogenen Hauptaufgabe zurück, und jede
 * Zeile wäre ein Ziel – auch eine, die kein Geschwister ist, worauf die Zeile nach dem Loslassen
 * zurückspränge. Hier bewegt sich stattdessen nur eine Markierung, wie im Board; die Zeile selbst
 * wandert erst beim Neuzeichnen. Damit stellt sich die Frage nach dem Teilbaum gar nicht.
 */
function attachTaskReorder(row: HTMLElement, grip: HTMLElement, list: HTMLElement, task: Task, plugin: BeautyTasksPlugin): void {
  grip.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    ev.stopPropagation();          // nicht die Zeile anklicken (öffnet sonst das Modal)
    const doc = list.ownerDocument;   // Ziel-Fenster einmal festhalten (Popout-sicher)
    row.addClass("is-dragging");
    let before: string | null | undefined;
    const onMove = (me: PointerEvent): void => { before = showDropTarget(list, task, plugin, me.clientY); };
    const onUp = (): void => {
      row.removeClass("is-dragging");
      clearDropTarget(list);
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      if (before === undefined) return;   // kein Geschwister getroffen -> nichts tun
      void plugin.moveTaskBefore(task, before ? plugin.index.get(before) ?? null : null);
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  });
}

/**
 * Eine Spalte als Drop-Ziel verdrahten: Loslassen ruft die spaltenspezifische Mutation.
 * Bei Sortierung „Manuell" kommt die Einfügeposition dazu – dann bestimmt der Zug nicht nur die
 * Spalte, sondern auch den Platz darin. Bei jeder anderen Sortierung wäre das sinnlos: die
 * nächste Neuzeichnung würde die Handarbeit sofort wieder überschreiben.
 */
function setupColumnDnd(colEl: HTMLElement, col: BoardColumn, plugin: BeautyTasksPlugin, manual: boolean, page: BoardAdd): void {
  const listEl = (): HTMLElement | null => colEl.querySelector<HTMLElement>(".bt-kanban-list");
  const dragged = (): Task | undefined => { const p = dragTask(); return p ? plugin.index.get(p) : undefined; };
  colEl.addEventListener("dragover", (e) => {
    if (!dragTask()) return;                       // nur eigene Karten (kein Vault-Drag)
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    colEl.addClass("is-drop");
    const tk = manual ? dragged() : undefined;
    const l = listEl();
    if (l) { if (tk) showDropTarget(l, tk, plugin, e.clientY); else clearDropTarget(l); }
  });
  colEl.addEventListener("dragleave", (e) => {
    if (!colEl.contains(e.relatedTarget as Node | null)) {
      colEl.removeClass("is-drop");
      const l = listEl(); if (l) clearDropTarget(l);
    }
  });
  colEl.addEventListener("drop", (e) => {
    e.preventDefault();
    colEl.removeClass("is-drop");
    const path = e.dataTransfer?.getData("text/plain") || dragTask();
    const fromCol = dragFromCol();
    const task = path ? plugin.index.get(path) : undefined;
    const l = listEl();
    const before = manual && task && l ? showDropTarget(l, task, plugin, e.clientY) : undefined;
    if (l) clearDropTarget(l);
    endTaskDrag();
    if (!task) return;
    // Seite zuerst: Kommt die Karte aus einem ANDEREN Projekt (Planungs-Split), gehört sie durch
    // den Abwurf hierher – sonst bekäme sie zwar den Status dieser Spalte, bliebe aber drüben und
    // wäre auf diesem Board nicht zu sehen (s. applyDropPage).
    // Alles nacheinander und abgewartet: zwei processFrontMatter auf dieselbe Datei dürfen sich
    // nicht überholen, sonst geht einer der beiden Schreibvorgänge verloren.
    void applyDropPage(plugin, task, page).then(async () => {
      if (before !== undefined) {
        await plugin.moveTaskBefore(task, before ? plugin.index.get(before) ?? null : null);
      }
      col.onDrop?.(task, fromCol ?? "");
    });
  });
}

/** Kanban-Board zeichnen: Spalten folgen der Gruppierung (Label → Label-Spalten, sonst Status).
 *  Ziehbare Karten + „+ Aufgabe" je Spalte (legt mit der Spalten-Dimension an). */
function renderKanbanBoard(root: HTMLElement, ctx: PageCtx, tasks: Task[], today: string,
  opts: ViewOptions, add: BoardAdd): void {
  const plugin = ctx.plugin;
  root.addClass("bt-sizer-board");   // Kanban nutzt volle Pane-Breite statt Lesebreite
  // Unteraufgaben: „Kompakt" nimmt ihre Karten heraus, die Hauptaufgabe trägt stattdessen das
  // Fortschritts-Badge. „Einzeln" (Vorgabe, bisheriges Verhalten) lässt jede als eigene Karte
  // stehen – nur so lässt sie sich einzeln in eine andere Status-Spalte ziehen.
  // Hat eine Unteraufgabe keine Hauptaufgabe auf diesem Board, bleibt sie auch im kompakten
  // Modus als Karte stehen (nestingHosts/visibleRows) – sonst wäre sie hier unerreichbar.
  const subs = effectiveSubtasks(opts);   // im Board-Layout schliesst das boardSubtasks() ein
  // Datums-/Deadline-Spalten: „das eigene Datum gewinnt" auch hier – eine datierte Unteraufgabe
  // bekommt ihre Karte in IHRER Tages-Spalte, auch wenn der Parent als Karte auf dem Board steht.
  // Karten sind flach (keine Verschachtelung) -> kein skip nötig, Doppelung kann nicht entstehen.
  const cards = visibleRows(tasks, nestingHosts(plugin, tasks, subs), agendaOwnRow(opts.group));
  // Gruppierungs-Schlüssel (stabil) für die board-eigene Spalten-Reihenfolge. Priorität bleibt fest.
  const groupKey = opts.group === "label" ? "label" : opts.group === "priority" ? "priority" : opts.group === "project" ? "project"
    : opts.group === "date" || opts.group === "deadline" ? opts.group : "status";
  // Nicht umsortierbar, wo die Reihenfolge fest ist: Priorität (P1–P4) und Datum (chronologisch).
  const reorderable = groupKey !== "priority" && groupKey !== "date" && groupKey !== "deadline";
  // Spalten aus den SICHTBAREN Karten ableiten: sonst entstünde eine Label-/Projekt-Spalte für
  // eine Unteraufgabe, die im kompakten Modus gar keine Karte hat – eine leere Spalte ohne Grund.
  const baseCols = opts.group === "label" ? labelColumns(plugin, cards, add)
    : opts.group === "priority" ? priorityColumns(plugin, add)
      : opts.group === "project" ? projectColumns(plugin, cards, add)
        : opts.group === "date" ? dateColumns(plugin, cards, today, "due", add)
          : opts.group === "deadline" ? dateColumns(plugin, cards, today, "scheduled", add)
            : statusColumns(plugin, add);
  const cols = reorderable ? applyColumnOrder(baseCols, plugin.settings.boardColumnOrder?.[groupKey]) : baseCols;
  const board = root.createDiv({ cls: "bt-kanban" });
  const driveScroll = attachEdgeAutoscroll(board);
  // Scroll-Position über Re-Renders halten: nach einem Karten-Drop rendert die ganze View neu –
  // ohne das spränge das Board zurück nach links. Schlüssel = aktuelle Board-Identität (+ Gruppierung).
  const scrollKey = viewKey(ctx, ctx.pageKey + "|" + (opts.group ?? ""));
  board.addEventListener("scroll", () => boardScroll.set(scrollKey, board.scrollLeft));
  for (const col of cols) {
    const colEl = board.createDiv({ cls: "bt-kanban-col" });
    colEl.dataset.col = col.id;
    const sentinel = isSentinelCol(col.id);
    if (sentinel) colEl.dataset.pin = "1";
    if (col.onDrop) setupColumnDnd(colEl, col, plugin, opts.sort === "manual", add);   // kein Drop-Ziel -> kein DnD (z. B. „Überfällig")

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
    const colTasks = sortColumn(cards.filter((tk) => col.has(tk)), col.kind, opts.sort, opts.sortDir, orderKey(plugin));
    head.createSpan({ cls: "bt-kanban-count", text: String(colTasks.length) });

    const listEl = colEl.createDiv({ cls: "bt-kanban-list" });
    // Abhaken schreibt die Notiz -> der Index meldet -> MainView.draw() baut alles neu. Ohne das
    // Folgende spränge die Spalte dabei nach oben, und wer unten mehrere Karten abhaken will,
    // müsste nach jeder einzelnen erneut hinunterscrollen.
    const colKey = scrollKey + "|" + col.id;
    listEl.addEventListener("scroll", () => colScroll.set(colKey, listEl.scrollTop));
    // Bei Datums-Gruppierung ist die Spalte das Fälligkeitsdatum -> Datums-Chip in der Karte redundant
    // (Kompakt-Thema blendet ihn dann aus, außer Uhrzeit). „Überfällig"/„ohne Datum" bleiben unberührt.
    const dateImplied = groupKey === "date";
    const deadlineImplied = groupKey === "deadline";   // Spalte = Deadline-Datum -> Deadline-Chip in Karte redundant
    // Bei Projekt-Gruppierung ist die Spalte das Projekt (col.id = Name bzw. NO_PROJECT) -> @Projekt weglassen.
    const hideProject = groupKey === "project" ? col.id : undefined;
    // Datums-Spalten heißen „d:<ISO>" (s. dateColumns); „Überfällig"/„ohne Datum" tragen kein
    // einzelnes Datum und blenden deshalb nichts aus.
    const impliedDate = dateImplied && col.id.startsWith("d:") ? col.id.slice(2) : undefined;
    for (const tk of colTasks) renderTask(listEl, ctx, tk, today, 0, false, { flat: true, colId: col.id, subs, impliedDate, deadlineImplied, hideProject });
    // Erst nach den Karten: vorher hat die Liste keine Höhe und scrollTop würde auf 0 geklemmt.
    // Ist die Spalte inzwischen kürzer (Karte ist rausgefallen), klemmt der Browser auf das neue
    // Maximum – das Scroll-Ereignis schreibt den geklemmten Wert dann selbst zurück.
    const savedTop = colScroll.get(colKey);
    if (savedTop) listEl.scrollTop = savedTop;

    if (col.onAdd) {
      const addEl = colEl.createDiv({ cls: "bt-kanban-add" });
      addEl.createSpan({ cls: "bt-add-icon" });
      addEl.createSpan({ text: t("btn_add_task") });
      addEl.onclick = () => col.onAdd?.();
    }
  }
  // Board ist jetzt aufgebaut (Breite steht) -> gemerkte Scroll-Position wiederherstellen.
  const savedLeft = boardScroll.get(scrollKey);
  if (savedLeft) board.scrollLeft = savedLeft;
}


/** Alle Pfade, die in dieser Ansicht real gerendert werden: die Anker-Aufgaben plus ihre
 *  (nicht abgebrochenen) Nachfahren, die renderTask verschachtelt zeichnet. Basis für
 *  Variante A – eine Unteraufgabe gilt als „im Parent aufgehoben", wenn ihr Parent hier
 *  gerendert wird; ist er es nicht, wird die Unteraufgabe eigenständig angezeigt. */
/**
 * Die Menge, unter der verschachtelt gezeichnet wird – EINZIGE Stelle, an der die gewählte
 * Unteraufgaben-Darstellung über die Verschachtelung entscheidet.
 *
 * Bei „standalone" (Board: „Einblenden"; in der Liste kommt der Wert nicht mehr an, s.
 * listSubtasks) ist sie bewusst LEER: dann gilt keine Hauptaufgabe als Wirt, also hängt keine
 * Unteraufgabe an ihr und jede bekommt ihre eigene Karte – in ihrer eigenen Spalte/Gruppe.
 * Wichtig ist die leere Menge statt `undefined`: `undefined` bedeutet in visibleRows das
 * GEGENTEIL (alle Unteraufgaben weglassen, s. Papierkorb).
 */
function nestingHosts(plugin: BeautyTasksPlugin, anchors: Task[], mode: SubtaskDisplay): Set<string> {
  return mode === "standalone" ? new Set<string>() : renderedPaths(plugin, anchors);
}

// Die Datums-Ausnahme („das eigene Datum gewinnt", agendaOwnRow) kennt bewusst KEINE
// Anti-Doppelungs-Sperre beim Verschachteln: Aufklappen (per „Eingerückt" oder Badge-Klick)
// zeigt IMMER ALLE Kinder unterm Parent – auch die, die zusätzlich an ihrem eigenen Datum
// stehen. Das ist der Sinn des Aufklappens: die Aufgabe komplett durchgehen. Eine Sperre
// machte „Eingerückt" in reinen Datums-Agenden (Demnächst: alles datiert) zum toten Schalter.

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
/** Wie weit „Demnächst" Termine zeigt – einstellbar (`upcomingMonths`, Vorgabe 1 Monat).
 *  Geklemmt auf 1–12: schützt gegen eine von Hand verbogene data.json und hält den Wert
 *  innerhalb dessen, was MAX_MONTHS/MAX_STORE im Feed tatsächlich laden und halten können. */
function upcomingEventEnd(plugin: BeautyTasksPlugin, today: string): string {
  const months = Math.min(12, Math.max(1, plugin.settings.gcalFeed?.upcomingMonths ?? 1));
  return addMonths(today, months);
}

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

/** Wie viele Termine ein Tag zeigt, bevor der Rest hinter „+N weitere" klappt. */
const GCAL_BAND_LIMIT = 5;
/** Aufgeklappte Tage (Schlüssel = Tag). Modul-Zustand, damit die Wahl ein Neuzeichnen übersteht –
 *  wie boardScroll/anchors; ein Reload startet wieder eingeklappt. */
const gcalExpanded = new Set<string>();

/**
 * Ein Termin als schmales Band – bewusst KEINE Aufgabenzeile (kein Abhak-Kreis, keine Meta-Zeile):
 * ein Farbbalken links, Uhrzeit vor dem Titel, Klick öffnet den Termin im Google Kalender. Die
 * Bänder stehen oben in der Tagesgruppe (Ganztägig zuerst, dann nach Uhrzeit): eine Zeitmarke,
 * kein Listeneintrag, der um die Sortierung konkurriert. Ab `GCAL_BAND_LIMIT` klappt der Rest ein.
 */
function renderEventBands(list: HTMLElement, ctx: PageCtx, events: DayEvent[], dayKey: string): void {
  const key = viewKey(ctx, dayKey);
  const sorted = [...events].sort((a, b) => (a.startMin ?? -1) - (b.startMin ?? -1) || a.event.title.localeCompare(b.event.title));
  const expanded = gcalExpanded.has(key);
  const visible = expanded ? sorted : sorted.slice(0, GCAL_BAND_LIMIT);
  for (const de of visible) {
    const ev = de.event;
    const row = list.createDiv({ cls: "bt-gcal-band" });
    row.style.setProperty("--bt-ev-color", ev.color);
    // Schlanker, runder Farbbalken in EIGENER Spalte (Google-Kalenderfarbe) statt getönter Zeile –
    // so trägt allein der Balken die Farbe und die Zeile bleibt ruhig.
    row.createSpan({ cls: "bt-gcal-band-bar", attr: { "aria-hidden": "true" } });
    if (de.startMin !== null) {
      const time = de.endMin !== null ? bandTime(de.startMin) + "–" + bandTime(de.endMin) : bandTime(de.startMin);
      row.createSpan({ cls: "bt-gcal-band-time", text: time });
    }
    row.createSpan({ cls: "bt-gcal-band-title", text: ev.title });
    setIcon(row.createSpan({ cls: "bt-gcal-band-open", attr: { "aria-hidden": "true" } }), "external-link");
    row.setAttr("aria-label", t("gcalfeed_open_in_google"));
    row.setAttr("data-tooltip-position", "top");
    activateEventOpen(row, ev);
  }
  if (sorted.length > GCAL_BAND_LIMIT) {
    const hidden = sorted.length - GCAL_BAND_LIMIT;
    const more = list.createDiv({ cls: "bt-gcal-more", attr: { role: "button", tabindex: "0" } });
    setIcon(more.createSpan({ cls: "bt-gcal-more-ic" }), expanded ? "chevron-up" : "chevron-down");
    more.createSpan({ text: expanded ? t("gcalfeed_show_less") : t("gcalfeed_more", hidden) });
    const toggle = (): void => { if (expanded) gcalExpanded.delete(key); else gcalExpanded.add(key); ctx.redraw(); };
    more.onclick = toggle;
    more.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
  }
}

/** Zeichnet eine Sektion und gibt ihren Überschriften-Kopf zurück – daran hängen Aufrufer
 *  optionale Kopf-Aktionen (z. B. „Verschieben" bei „Überfällig"), ohne dass section() sie
 *  kennen muss. Wer den Rückgabewert nicht braucht, ignoriert ihn wie bisher. */
function section(parent: HTMLElement, ctx: PageCtx, title: string, tasks: Task[], today: string, collapsible = false, trash = false, present?: Set<string>, events: DayEvent[] = [], eventKey = "", ownRow?: (t: Task) => boolean): HTMLElement {
  const top = trash ? tasks : visibleRows(tasks, present, ownRow);
  const sec = parent.createDiv({ cls: "bt-section" });
  const head = sec.createEl("h6", { cls: "bt-section-title" });
  head.createSpan({ cls: "bt-section-lbl", text: title });
  head.createSpan({ cls: "bt-section-count", text: String(top.length) });   // Anzahl direkt neben dem Titel
  const list = sec.createDiv({ cls: "bt-list" });
  // Termine des Tages (read-only) gebündelt in einer dezenten Box oben, vor den Aufgaben.
  if (events.length) renderEventBands(list.createDiv({ cls: "bt-gcal-daybox" }), ctx, events, eventKey);
  // EINMAL pro Section lesen (statt pro Zeile) und an renderTask durchreichen.
  const o = ctx.opts;
  const subs = effectiveSubtasks(o);
  const manual = o.sort === "manual";
  // „Kompakt"-Thema: ist die Ansicht nach Datum gruppiert, tragen die Sektionsüberschriften das Datum
  // -> der per-Aufgabe-Datums-Chip ist redundant (renderTask blendet ihn dann aus, außer Uhrzeit).
  // Heute/Demnächst zeigen Datums-Sektionen schon im Default (group „none"), volle Seiten (Projekt/
  // Bereich/Label/Filter/Eingang) nur bei ausdrücklichem group „date". Einmal je Sektion bestimmt.
  const key = ctx.pageKey;
  const dateImplied = (key === "heute" || key === "demnaechst") ? (o.group === "none" || o.group === "date") : (o.group === "date");
  const deadlineImplied = o.group === "deadline";   // Sektionen = Deadline-Datum -> Deadline-Chip redundant
  // Bei Projekt-Gruppierung: alle Zeilen der Sektion haben dasselbe Projekt (bzw. Eingang) -> aus der ersten
  // ableiten und den @Projekt-/@Eingang-Backlink weglassen (Sektionsüberschrift zeigt es schon). Labels
  // dagegen zeigen wir bei Label-Gruppierung ALLE (auch das Gruppen-Label), s. renderTask.
  const hideProject = o.group === "project" && top.length
    ? (isInboxLink(top[0].project) ? NO_PROJECT : baseName(top[0].project!)) : undefined;
  // Das Datum, das DIESE Sektion in ihrer Überschrift trägt (leer bei „Überfällig" – ein Sammel-
  // Bucket ohne einzelnes Datum – und bei nicht-datierten Gruppierungen).
  const impliedDate = dateImplied && eventKey ? eventKey : undefined;
  for (const task of top) renderTask(list, ctx, task, today, 0, trash, { subs, manual, showDone: o.showDone, impliedDate, deadlineImplied, hideProject });
  annotateSubtaskTree(list);

  if (collapsible) {
    // Einklappbar (z. B. „Erledigt"): Chevron rechts in der Überschrift, Klick toggelt.
    sec.addClass("bt-collapsible");
    const chev = head.createSpan({ cls: "bt-collapse-ic" });
    const apply = () => { sec.toggleClass("is-collapsed", ctx.doneCollapsed); setIcon(chev, ctx.doneCollapsed ? "chevron-right" : "chevron-down"); };
    apply();
    head.onclick = () => { ctx.setDoneCollapsed(!ctx.doneCollapsed); apply(); };
  }
  return head;
}

/** „Verschieben" rechts im Kopf der Überfällig-Sektion (Sammel-Aktion auf ALLE Aufgaben der
 *  Sektion). Der Picker startet bewusst OHNE Vorbelegung: 15 überfällige Aufgaben haben 15
 *  verschiedene Daten – ein vorausgewählter Tag müsste eines davon erfinden und würde
 *  suggerieren, es passiere ohnehin gleich. Klick daneben schließt folgenlos (openDatePicker
 *  meldet nur bei ausdrücklicher Auswahl). */
function rescheduleButton(head: HTMLElement, plugin: BeautyTasksPlugin, tasks: Task[]): void {
  head.addClass("bt-has-action");
  // Bewusst KEIN <button>: darauf greifen Obsidians App-Styles mit Rahmen, Schatten und
  // eigener Textfarbe zu, die man einzeln wieder abräumen müsste (und die je nach Theme
  // trotzdem gewinnen). Span mit role/tabindex wie bei .bt-gcal-more – reiner Text, der
  // Schrift und Größe der Überschrift erbt und nur über die Akzentfarbe hervorsticht.
  const btn = head.createSpan({ cls: "bt-sec-action", text: t("sec_reschedule"), attr: { role: "button", tabindex: "0" } });
  const open = (e: Event): void => {
    e.stopPropagation();   // ein einklappbarer Kopf (head.onclick) darf nicht mitschalten
    openDatePicker(btn, "", (v) => void plugin.rescheduleTasks(tasks, v));
  };
  btn.onclick = open;
  btn.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(e); } };
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
function renderLinkedText(el: HTMLElement, ctx: PageCtx, text: string, sourcePath: string): void {
  const plugin = ctx.plugin;
  if (!LINK_MARKERS.test(text) || !ctx.titleComp) { el.setText(text); return; }
  el.addClass("bt-md-inline");
  void MarkdownRenderer.render(plugin.app, text, el, sourcePath, ctx.titleComp)
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

/**
 * Eigenes Zugbild statt des Browser-Abzugs der Zeile.
 *
 * Der Abzug erbt zwei Dinge, die ihn unbrauchbar machen: die halbe Deckkraft von `is-dragging`
 * (der Browser zieht sein Bild ERST NACH dem Start-Ereignis, die Klasse sitzt dann schon) und den
 * fehlenden Hintergrund der Zeile – über der Seitenleiste blieb dadurch schwebender Text übrig,
 * der sich mit deren Einträgen überlagerte.
 *
 * Stattdessen eine undurchsichtige Karte mit demselben Inhalt: eine KOPIE der Zeile, damit Checkbox,
 * Titel, Meta-Zeile und Projekt-Verweis genau so aussehen wie in der Liste. Die Hülle trägt die
 * Klasse `bt-view`, weil ein Teil der Zeilen-Gestaltung darunter gescopet ist (Chip-Farben) und die
 * Icon-Masken als Variablen dort hängen – am nackten `body` wären die Meta-Chips farb- und symbollos.
 *
 * Die Karte wird außerhalb des Sichtfelds erzeugt (der Browser braucht sie gerendert im Dokument)
 * und sofort danach wieder entfernt: Das Bild ist zu diesem Zeitpunkt längst gezogen.
 */
function attachDragGhost(e: DragEvent, row: HTMLElement): void {
  if (!e.dataTransfer) return;
  // Zwei Ebenen: eine DURCHSICHTIGE Hülle mit Rand, darin die eigentliche Karte. Der Abzug endet an
  // der Hüllenkante – und dort liegt jetzt nur noch Nichts. Läge die Umrandung selbst auf dieser
  // Kante, verschwände sie bei jeder Bewegung neu: Das Bild wird auf einer skalierten Anzeige an
  // gebrochenen Gerätepixeln abgesetzt, und die äußerste Pixelreihe fällt dann mal weg, mal nicht.
  const ghost = row.ownerDocument.body.createDiv({ cls: "bt-view bt-drag-ghost" });
  const card = ghost.createDiv({ cls: "bt-drag-ghost-card" });
  card.style.width = row.offsetWidth + "px";
  const clone = row.cloneNode(true) as HTMLElement;
  clone.removeClass("is-focus");   // ein Suchtreffer-Rahmen gehört nicht ans Zugbild
  card.appendChild(clone);
  // Greifpunkt beibehalten: Die Karte hängt dort am Zeiger, wo man die Zeile angefasst hat – plus
  // den Rand der Hülle. GERUNDET, damit das Bild auf ganzen Pixeln sitzt und nicht bei jeder
  // Bewegung neu verrechnet wird (dieselbe Rundung wie bei den Popovers).
  const r = row.getBoundingClientRect();
  e.dataTransfer.setDragImage(ghost, Math.round(e.clientX - r.left) + GHOST_PAD, Math.round(e.clientY - r.top) + GHOST_PAD);
  window.setTimeout(() => ghost.remove(), 0);
}
/** Durchsichtiger Rand der Zughülle – muss zum `padding` von `.bt-drag-ghost` passen. */
const GHOST_PAD = 4;

function renderTask(list: HTMLElement, ctx: PageCtx, task: Task, today: string, depth: number, trash = false,
  opts: { flat?: boolean; colId?: string; subs?: SubtaskDisplay; manual?: boolean; showDone?: boolean; impliedDate?: string; deadlineImplied?: boolean; hideProject?: string } = {}): void {
  const plugin = ctx.plugin;
  // Unteraufgaben-Darstellung: vom Aufrufer (section) EINMAL pro Section gereicht statt hier pro
  // Zeile ctx.opts zu lesen (bei Projektseiten ein metadataCache-Zugriff je Aufgabe).
  const subs = opts.subs ?? "compact";   // Aufrufer reichen ihn immer durch; Rueckfall nur der Form halber
  const row = list.createDiv({ cls: "bt-task" + (depth ? " bt-subtask" : "") });
  if (depth) row.style.setProperty("--bt-depth", String(depth));
  row.dataset.path = task.path;
  if (task.path === menuHoldPath()) row.addClass("bt-menu-hold");   // offenes Kontextmenü hält das Hover
  if (isDone(task.status)) row.addClass("is-done");
  if (trash) row.addClass("is-cancelled");
  plugin.applyFlash(row, task.path);   // aus der Suche angesprungen? -> hervorheben + ins Bild scrollen

  // Griff zum Einsortieren – nur bei Sortierung „Manuell" und nur in der Liste (die Karte im Board
  // wird per HTML5-Drag bewegt, der Papierkorb kennt keine Reihenfolge). Eigener Griff statt
  // Ganzzeilen-Drag, weil ein Klick auf die Zeile das Aufgaben-Modal öffnet.
  if (opts.manual && !opts.flat && !trash) {
    const grip = row.createSpan({ cls: "bt-row-grip", attr: { "aria-label": t("sort_manual") } });
    setIcon(grip, "grip-vertical");
    attachTaskReorder(row, grip, list, task, plugin);
  }

  // Per HTML5-Drag verschiebbar (Desktop): auf dem Board zwischen den Spalten, in der LISTE auf
  // einen Eintrag der Seitenleiste (Projekt/Bereich/Eingang – s. navItem/onDropTask). Beides
  // derselbe Zug, deshalb dieselbe Verdrahtung; die Papierkorb-Ansicht bleibt außen vor.
  //
  // Der Zieh-Griff der Handsortierung kommt sich damit nicht ins Gehege: Er ruft in `pointerdown`
  // `preventDefault()`, und das unterbindet den nativen Zug, bevor er beginnt.
  if (!trash) {
    row.setAttr("draggable", "true");
    row.addEventListener("dragstart", (e) => {
      startTaskDrag(task.path, opts.colId ?? null);   // Quell-Spalte (Status-ID bzw. Label) für die Drop-Semantik
      attachDragGhost(e, row);            // VOR is-dragging: sonst zöge die Karte dessen Dimmung mit
      row.addClass("is-dragging");
      e.dataTransfer?.setData("text/plain", task.path);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    // Auch aufräumen, wenn der Zug ohne Drop endet (Escape, Loslassen außerhalb des Boards) –
    // sonst bliebe die Spalte ausgegraut, bis sie das nächste Mal neu gezeichnet wird.
    row.addEventListener("dragend", () => {
      endTaskDrag();
      row.removeClass("is-dragging");
      clearDropTarget(list);
      // Abbruch per Escape über einem Abwurfziel liefert dort kein `dragleave` – die Hervorhebung
      // bliebe sonst stehen. `dragend` ist der eine Punkt, der jedes Ende sicher sieht. Seit die
      // Liste im Planungs-Split neben dem Kalender steht, gilt das auch für dessen Zellen
      // (`.is-drop`), nicht mehr nur für die Seitenleiste (`.is-drop-task`).
      row.ownerDocument.querySelectorAll(".is-drop-task, .is-drop").forEach((el) => el.removeClasses(["is-drop-task", "is-drop"]));
    });
  }

  renderCheck(row, plugin, task, { trash });

  const body = row.createDiv({ cls: "bt-body" });
  renderLinkedText(body.createDiv({ cls: "bt-title" }), ctx, task.title, task.path);

  // Beschreibungs-Vorschau (einzeilig, gekürzt) – aus dem Frontmatter (`description`), optional
  // per Einstellung. Bild-/Embed-Syntax wird entfernt, damit die Zeile nie zu einem Block aufgeht.
  if (plugin.settings.showDescriptionInList) {
    const desc = task.description
      .replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "")   // Embeds/Bilder raus
      .replace(/\s+/g, " ").trim();
    if (desc) renderLinkedText(body.createDiv({ cls: "bt-desc" }), ctx, desc, task.path);
  }

  const meta = body.createDiv({ cls: "bt-meta" });
  // Hauptaufgaben-Link ganz vorn als normales Meta-Icon: an jeder Unteraufgabe, die hier auf
  // Top-Level steht (datiert in Heute, fremdes Projekt, erledigter Parent) – in der LISTE wie
  // auf der KARTE (Board „Einblenden": ohne das Icon wäre einer Unterkarte nicht anzusehen,
  // dass sie eine ist). Grau, ohne Hover-Hintergrund, Tooltip = Titel, Klick öffnet die
  // Hauptaufgabe – konsistent zu den übrigen Meta-Icons.
  if (depth === 0 && task.parent) {
    const parent = plugin.index.get(task.parent);
    if (parent) {
      const link = meta.createSpan({ cls: "bt-parent-link",
        attr: { role: "button", tabindex: "0", "aria-label": t("menu_goto_parent") + ": " + parent.title, "data-tooltip-position": "top" } });
      setIcon(link.createSpan({ cls: "bt-parent-link-ic" }), "corner-left-up");
      const openParent = (e: Event): void => { e.stopPropagation(); plugin.openEditTask(parent); };
      link.onclick = openParent;
      link.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openParent(e); } };
    }
  }
  if (task.due) {
    // „Kompakt"-Thema (nur Top-Level): das Datum weglassen, wo die Sektionsüberschrift bzw. der
    // Spaltenkopf GENAU DIESES Datum schon zeigt (opts.impliedDate, EINMAL je Sektion/Spalte
    // bestimmt; ohne Datums-Gruppierung gar nicht gesetzt). Ohne Uhrzeit gar kein Chip (Icon UND
    // Wort weg); mit Uhrzeit nur die Uhrzeit (Kalendericon bleibt), eingefärbt nach Tages-Distanz.
    //
    // Verglichen wird das Datum, NICHT bloß „liegt in der Zukunft": In „Heute" stehen seit der
    // Deadline-Aufnahme auch Aufgaben, die erst später fällig sind. Deren Fälligkeit ist alles
    // andere als redundant – sie ist der Grund, warum ihre Zeile dort überhaupt erklärbar ist.
    const compactHide = depth === 0 && !!opts.impliedDate && task.due === opts.impliedDate;
    if (!(compactHide && !task.dueTime)) {
      const text = compactHide ? (task.dueTime ?? "") : formatDateTime(combineDT(task.due, task.dueTime), today);
      const chip = meta.createSpan({ cls: "bt-chip bt-due" });
      chip.createSpan({ cls: "bt-meta-txt", text });   // Text im eigenen Span -> unabhängig vom Kalender-Icon justierbar
      chip.dataset.when = dueWhen(task.due, today);
      // Datum nach Tages-Distanz einfärben (heute/morgen/übermorgen/bis Tag 7) – IMMER, wenn der
      // Chip überhaupt gezeichnet wird. Früher hing das an einer Bedingung, die „Datum sichtbar"
      // bloß annäherte (nicht datumsgruppiert ODER nur-Uhrzeit-Chip); seit in datierten Sektionen
      // auch abweichende Fälligkeiten stehen können, hätte deren Datum sonst keine Distanzfarbe.
      // Überfällig (< heute) behält seine rote data-when-Farbe (dueDist liefert dort ""); ab Tag 8
      // heller Grau.
      const dist = dueDist(task.due, today);
      if (dist) chip.dataset.dist = dist;
      chip.onclick = (e) => {
        e.stopPropagation();
        openDatePicker(chip, combineDT(task.due!, task.dueTime), (v) => void plugin.setTaskDate(task, "due", v),
          { value: task.duration, onChange: (d) => void plugin.setTaskDuration(task, d) });
      };
    }
  }
  // Deadline DIREKT hinter der Fälligkeit: die beiden gehören zusammen („wann arbeite ich daran"
  // und „wann muss es fertig sein") und werden meist im Vergleich gelesen. Zwischen ihnen standen
  // vorher Wiederholung, Erinnerung und sämtliche Labels.
  if (task.scheduled) {
    // Analog zum Datum: ist nach Deadline gruppiert (Sektion/Spalte = Deadline-Datum), ist der Deadline-
    // Chip redundant -> im Kompakt-Thema ausblenden, außer es gibt eine Uhrzeit (dann nur Icon + Uhrzeit).
    // Überfällige Deadlines (< heute) liegen im Sammel-Bucket „Überfällig" -> dort NICHT ausblenden.
    // Anders als beim Datum genügt hier der Vergleich „nicht vergangen": Bei Gruppierung NACH
    // DEADLINE bilden die Sektionen/Spalten sich aus genau diesem Feld, alle Zeilen einer Gruppe
    // tragen also dieselbe Frist. Der einzige Sammel-Bucket ohne eigenes Datum ist „Überfällig"
    // (scheduled < heute) – und dort soll der Chip ja gerade stehen bleiben. Ein Datumsvergleich
    // wie bei impliedDate wäre möglich, verlangte aber, die Gruppen-Frist bis hierher zu reichen,
    // ohne dass sich etwas am Ergebnis änderte.
    const schedHide = depth === 0 && !!opts.deadlineImplied && task.scheduled >= today;
    if (!(schedHide && !task.scheduledTime)) {
      const chip = meta.createSpan({ cls: "bt-chip bt-sched" });
      // Wie beim Datums-Chip: data-when trägt „verstrichen", data-dist die Nähe-Abstufung
      // (heute/morgen/übermorgen/Tag 3–7). Beide Angaben lesen sich damit gleich (s. styles.css).
      chip.dataset.when = dueWhen(task.scheduled, today);
      const sdist = dueDist(task.scheduled, today);
      if (sdist) chip.dataset.dist = sdist;
      chip.createSpan({ cls: "bt-meta-txt", text: schedHide ? (task.scheduledTime ?? "") : formatDeadline(combineDT(task.scheduled, task.scheduledTime), today) });
      chip.onclick = (e) => { e.stopPropagation(); openDatePicker(chip, combineDT(task.scheduled!, task.scheduledTime), (v) => void plugin.setTaskDate(task, "scheduled", v)); };
    }
  }
  if (task.recurrence) meta.createSpan({ cls: "bt-chip bt-recur" });
  // Erinnerungs-Indikator: nur Icon (alarm-clock, wie der Reminder-Chip im Editor), Details im Tooltip.
  if (task.reminders.length) {
    const rem = meta.createSpan({ cls: "bt-remind", attr: { "aria-label": task.reminders.map(formatReminder).join(" · "), "data-tooltip-position": "top" } });
    setIcon(rem, "alarm-clock");
  }
  // Text im eigenen Span (.bt-meta-txt), damit er sich unabhängig vom Icon vertikal feinjustieren lässt.
  // ALLE Labels der Aufgabe werden gezeigt – auch auf einer #Label-Seite bzw. bei Gruppierung nach Label
  // das gleichnamige. Selektives Ausblenden verwirrt, sobald eine Aufgabe mehrere Labels hat (anders als
  // beim @Projekt-Backlink, wo eine Aufgabe genau ein Projekt hat).
  for (const l of task.labels) meta.createSpan({ cls: "bt-chip bt-label" }).createSpan({ cls: "bt-meta-txt", text: l });
  // Kommentare/Anhänge: Büroklammer + dezente Anzahl. Klick öffnet die Aufgabe.
  const comments = plugin.index.commentsOf(task.path);
  if (comments > 0) {
    const chip = meta.createSpan({ cls: "bt-comments" });
    const ic = chip.createSpan({ cls: "bt-comments-ic" }); setIcon(ic, "paperclip");
    chip.createSpan({ cls: "bt-comments-n", text: String(comments) });
  }
  // Unteraufgaben-Badge: an JEDER Hauptaufgabe mit (nicht-abgebrochenen) Kindern, in ALLEN Modi
  // (list-checks + „erledigt/gesamt"). Klick klappt DIESE eine Aufgabe auf/zu – der Default kommt
  // vom Modus (subsExpanded): „Eingerückt" offen, „Kompakt" zu. Auf einer Karte (flat) ist es
  // reine ANZEIGE: aufklappen ginge nicht (eine Karte nimmt keine verschachtelten Zeilen auf),
  // daher ohne role/Klick.
  if (!trash) {
    const kids = plugin.index.children(task.path).filter((k) => !isTrashed(k.status));
    if (kids.length) {
      const done = kids.filter((k) => isDone(k.status)).length;
      const open = !opts.flat && subsExpanded(ctx, task.path, subs);
      const attr: Record<string, string> = { "aria-label": t("subtasks_progress", done, kids.length) };
      if (opts.flat) attr["data-tooltip-position"] = "top";
      else { attr.role = "button"; attr.tabindex = "0"; }
      const badge = meta.createSpan({ cls: "bt-subs" + (open ? " is-open" : "") + (opts.flat ? " is-static" : ""), attr });
      setIcon(badge.createSpan({ cls: "bt-subs-ic" }), "list-checks");
      badge.createSpan({ cls: "bt-subs-n", text: done + "/" + kids.length });
      if (!opts.flat) {
        const toggle = (e: Event): void => {
          e.stopPropagation();   // nicht das Aufgaben-Modal öffnen
          subtaskToggle.set(viewKey(ctx, task.path), !subsExpanded(ctx, task.path, subs));
          ctx.redraw();
        };
        badge.onclick = toggle;
        badge.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(e); } };
      }
    }
  }

  if (trash) {
    // Papierkorb: rechts zwei Icons – Wiederherstellen + Endgültig löschen (mit Bestätigung).
    const acts = row.createDiv({ cls: "bt-task-actions" });
    iconBtn(acts, "archive-restore", t("btn_restore"), () => void plugin.restoreTask(task));
    iconBtn(acts, "trash-2", t("btn_delete_forever"),
      () => confirmInline(acts, t("confirm_delete_forever_q"), () => void plugin.deleteTaskForever(task.path), () => plugin.renderAll()));
  } else if (depth === 0) {
    // Rechte Zone: nur der @Projekt-Backlink (der Hauptaufgaben-Link sitzt jetzt links in der Meta-Zeile).
    // @Projekt weglassen: wenn DIESER Tab schon auf einer Projekt-/Eingang-Seite steht ODER wenn die Gruppierung nach Projekt
    // das Projekt schon in Spalte/Sektionsüberschrift zeigt (opts.hideProject; NO_PROJECT = Eingang);
    // „nicht einsortiert" = @Eingang.
    const inbox = isInboxLink(task.project);
    const projName = inbox ? null : baseName(task.project!);
    const backlink = ctx.page.kind !== "project" && (inbox ? opts.hideProject !== NO_PROJECT : projName !== opts.hideProject);
    if (backlink) {
      const extras = row.createDiv({ cls: "bt-extras" });
      if (inbox) {
        const bl = extras.createEl("a", { cls: "bt-backlink", text: "@" + t("nav_inbox") });
        bl.onclick = (e) => { e.stopPropagation(); ctx.open({ kind: "project", key: INBOX_KEY }); };
      } else {
        const bl = extras.createEl("a", { cls: "bt-backlink", text: "@" + projectDisplayName(projName) });
        bl.onclick = (e) => { e.stopPropagation(); ctx.open({ kind: "project", key: task.project! }); };   // zum Projekt-/Bereich-Board
      }
    }
  }
  // Klick auf die Zeile öffnet die Aufgabe (kein separater Stift – wäre redundant).
  // MIT Modifier stattdessen die NOTIZ – dieselbe Geste, die in der Seitenleiste (navItem) und
  // in Aufgaben-Links (renderLinkedText) schon „woanders öffnen" bedeutet. Über Keymap.isModEvent
  // statt selbst abgefragter Tasten: plattformrichtig (Cmd auf macOS, Ctrl sonst) und mit Shift
  // von allein im geteilten Fenster. Ohne Modifier bleibt alles wie bisher.
  // Links im Titel fangen ihren Klick vorher ab (stopPropagation) – Mod+Klick dort öffnet
  // weiterhin das Linkziel, nicht die Aufgabennotiz.
  row.onclick = (e) => {
    const mod = Keymap.isModEvent(e);
    if (mod) openTaskNote(plugin.app, task.path, mod); else plugin.openEditTask(task);
  };
  // Mittelklick öffnet die Notiz in einem neuen Tab (die Geste, die im Browser und in Obsidians
  // Dateiliste dasselbe tut). `onauxclick`, weil die mittlere Taste gar kein `click` auslöst;
  // preventDefault unterdrückt den Autoscroll-Modus, den Chromium sonst startet.
  row.onauxclick = (e) => {
    if (e.button !== 1) return;
    e.preventDefault();
    openTaskNote(plugin.app, task.path, "tab");
  };

  // Unteraufgaben verschachtelt darunter (eingerückt nach Tiefe) – nicht im Papierkorb
  // und nicht im flachen Kanban-Kartenmodus. Bei „Unteraufgaben verstecken" nur zeichnen,
  // wenn das Badge (per Modus-Default oder Klick) aufgeklappt ist – siehe subsExpanded.
  // „Eingerückt" Default auf · „Kompakt" Default zu; ein Klick überschreibt pro Aufgabe.
  const showKids = !trash && !opts.flat && subsExpanded(ctx, task.path, subs);
  if (showKids) for (const kid of sortSubtasks(plugin.index.children(task.path))) {
    if (isTrashed(kid.status)) continue;
    // Erledigte Unteraufgaben an denselben Schalter koppeln wie die Erledigt-Sektion: „Erledigte
    // anzeigen" aus -> auch hier verschachtelt weg. Ausnahme: ist der Parent SELBST erledigt (Erledigt-
    // Ansicht/-Sektion), bleiben sie sichtbar – sonst verschwänden dort die einzigen Zeilen fälschlich.
    if (isDone(kid.status) && !opts.showDone && !isDone(task.status)) continue;
    // Griff auch an verschachtelten Zeilen: ihre Geschwister stehen direkt darunter, also lassen
    // sie sich untereinander genauso einsortieren wie Hauptaufgaben.
    // Unteraufgaben zeigen IMMER ihr eigenes Datum distanz-gefärbt (nie ausgeblendet): die Sektions-/
    // Spaltenüberschrift trägt das Datum der HAUPTaufgabe, nicht das der Unteraufgabe – ein weggelassenes
    // „Heute" an einer Unteraufgabe sähe sonst aus, als hätte sie gar kein Datum. impliedDate wird bewusst
    // NICHT durchgereicht (zusätzlich schützt der depth-Guard in compactHide/schedHide).
    renderTask(list, ctx, kid, today, depth + 1, false, { subs, manual: opts.manual, showDone: opts.showDone });
  }
}

// ── Linke Navigation ─────────────────────────────────────────────
interface NavItemOpts {
  cls?: string; icon: string; iconColor?: string | null; label: string; count?: number; countKey?: string;
  active?: boolean; onClick: () => void; onContext?: (e: MouseEvent) => void; onDropTask?: (task: Task) => void;
  /** Wohin der Eintrag führt. Nur dafür da, Strg-/Mittelklick zu bedienen – der normale Klick
   *  läuft weiter über onClick (Einträge wie „Suchen" haben gar keine Seite und lassen es weg). */
  page?: PageRef;
}

/** Div klick- UND tastaturbedienbar machen (role=button/tabindex kommen vom Aufrufer):
 *  Klick + Enter/Space lösen dieselbe Aktion aus. So bleibt die Optik 1:1 wie zuvor. */
function activate(el: HTMLElement, handler: () => void): void {
  el.onclick = handler;
  el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); } };
}

/** Ein Nav-Eintrag (Div wie bisher, aber per role=button/tabindex tastaturbedienbar). */
function navItem(c: HTMLElement, plugin: BeautyTasksPlugin, o: NavItemOpts): void {
  const item = c.createDiv({ cls: "bt-nav-item" + (o.active ? " is-active" : "") + (o.cls ? " " + o.cls : ""), attr: { role: "button", tabindex: "0" } });
  const ic = item.createSpan({ cls: "bt-nav-ic" }); setIcon(ic, o.icon); if (o.iconColor) ic.setCssStyles({ color: o.iconColor });
  item.createSpan({ cls: "bt-nav-lbl", text: o.label });
  // Zähler-Span IMMER anlegen (auch bei 0 – dann leer): nur so kann ihn der Badge-Füller später
  // beschreiben, ohne die Seitenleiste neu zu bauen. o.countKey registriert ihn dafür.
  if (o.countKey || o.count) {
    const badge = item.createSpan({ cls: "bt-nav-count", text: o.count ? String(o.count) : "" });
    if (o.countKey) navBadges?.set(o.countKey, badge);
  }
  // Mit Modifier öffnet der Eintrag einen NEUEN Tab statt im aktuellen zu wechseln. WELCHER
  // Modifier was bedeutet, beantwortet bewusst Keymap.isModEvent: es liefert genau den Wert,
  // den workspace.getLeaf() erwartet, und folgt damit der Vorgabe des Nutzers und der Plattform –
  // eine eigene Auslegung wiche irgendwann von Obsidian ab. Ohne Modifier bleibt alles wie bisher.
  if (o.page) {
    const page = o.page;
    item.onclick = (e) => {
      const mod = Keymap.isModEvent(e);
      if (mod) void plugin.openPage(page, mod); else o.onClick();
    };
    item.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); o.onClick(); } };
    // Mittelklick = neuer Tab (Browser-Gewohnheit). Gehandelt wird auf `auxclick` (erst dort steht
    // fest, dass Drücken und Loslassen zusammengehören); das preventDefault gehört dagegen an
    // `mousedown` – nur dort lässt sich Chromiums Autoscroll-Kreuz noch verhindern.
    item.addEventListener("mousedown", (e) => { if (e.button === 1) e.preventDefault(); });
    item.addEventListener("auxclick", (e) => {
      if (e.button !== 1) return;
      e.preventDefault();
      void plugin.openPage(page, "tab");
    });
  } else {
    activate(item, o.onClick);
  }
  if (o.onContext) item.oncontextmenu = (e) => { e.preventDefault(); o.onContext!(e); };   // Rechtsklick = Kontextmenü
  if (o.onDropTask) attachTaskDrop(item, plugin, o.onDropTask);
}

/**
 * Einen Seitenleisten-Eintrag als Ablage für Aufgaben verdrahten: Eine Aufgabe aus der Liste (oder
 * vom Board) hierher zu ziehen wendet die Bedeutung des Ziels auf sie an.
 *
 * WAS geschieht, entscheidet die Aufrufstelle, nicht diese Funktion: Projekt, Bereich und Eingang
 * VERSCHIEBEN die Aufgabe (sie hat genau eine Liste), ein Label ERGÄNZT sie (sie kann mehrere
 * tragen und bleibt, wo sie ist). Filter bleiben außen vor – sie sind Suchanfragen und haben kein
 * Feld, das sich setzen ließe.
 *
 * Die Aufgabe kommt aus dem gemeinsamen Zug-Zustand (s. taskDrag.ts – denselben benutzen Liste,
 * Board und Kalender);
 * `dataTransfer` trägt sie zusätzlich, weil ein Zug ohne Nutzlast in manchen Umgebungen gar nicht
 * erst startet. Gelesen wird der Modul-Zustand – er überlebt auch Züge über View-Grenzen hinweg.
 */
function attachTaskDrop(el: HTMLElement, plugin: BeautyTasksPlugin, onDrop: (task: Task) => void): void {
  const clear = (): void => el.removeClass("is-drop-task");
  el.addEventListener("dragover", (e) => {
    if (!dragTask()) return;                  // fremder Zug (Datei aus dem Vault o. Ä.) -> nicht anfassen
    e.preventDefault();                     // ohne das lehnt der Browser den Drop ab
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    el.addClass("is-drop-task");
  });
  // Beim Wechsel auf ein KIND des Eintrags (Symbol, Beschriftung, Zähler) feuert ebenfalls
  // `dragleave` – ohne diese Prüfung flackerte die Hervorhebung, während man über dem Eintrag steht.
  el.addEventListener("dragleave", (e) => { if (!el.contains(e.relatedTarget as Node | null)) clear(); });
  el.addEventListener("drop", (e) => {
    clear();
    if (!dragTask()) return;
    e.preventDefault();
    const task = plugin.index.get(dragTask()!);
    if (task) onDrop(task);
  });
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
        plugin.revealNavSection(id);   // neu Angelegtes soll sichtbar sein
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
/** Sidebar-Badge eines Filters: nur OFFENE Treffer – wie Eingang/Projekte/Labels, die alle offene
 *  zählen. Der `showDone`-Schalter ist eine ANZEIGE-Option der Filterseite, kein Zähl-Kriterium;
 *  ohne dieses Überschreiben zählte der Badge bei „Erledigte anzeigen" die Erledigten mit. Filter mit
 *  ausdrücklichem Status-Kriterium zählen weiter ihre Treffer (applyFilter -> byStatus ignoriert
 *  showDone ohnehin, s. filterEngine). */
function filterBadgeCount(plugin: BeautyTasksPlugin, fl: FilterItem, today: string): number {
  return applyFilter(plugin.index, fl.criteria, { ...fl.options, showDone: false }, today).length;
}

function navCounts(plugin: BeautyTasksPlugin): Map<string, number> {
  const m = new Map<string, number>();
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  m.set("p:" + INBOX_KEY, plugin.index.inboxOpen().length);   // eingebauter Eingang
  for (const id of VIEW_IDS) m.set("v:" + id, navCount(plugin, id));
  for (const p of [...bereiche, ...projekte]) m.set("p:" + p.path, plugin.index.byProject(p.path).length);
  const today = todayStr();
  for (const fl of listFilters(plugin.app)) m.set("f:" + fl.path, filterBadgeCount(plugin, fl, today));
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
    active: JSON.stringify(plugin.activePage()),   // markiert wird die Seite des AKTIVEN Tabs
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
  // Die Markierung folgt dem AKTIVEN Dashboard-Tab. Seit es mehrere geben kann, gibt es keine
  // „offene Seite" mehr, die das Plugin für sich kennen könnte – nur die des Tabs im Vordergrund.
  const act = plugin.activePage();
  const isActive = (kind: PageRef["kind"], key: string): boolean => !!act && act.kind === kind && act.key === key;
  const badges = new Map<string, HTMLElement>();
  navBadges = badges;   // navItem trägt seine Zähler-Spans hier ein

  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  // Live-Vorschau der Icon-Farbe (Farb-Picker): überschreibt für EINEN Eintrag die gespeicherte Farbe.
  const navColor = (path: string, stored: string | null): string | null =>
    plugin.colorPreview?.key === path ? plugin.colorPreview.color : stored;

  // „Aufgabe hinzufügen" ganz oben: öffnet die kompakte Schnell-Erfassung.
  // Folgt dem Kontext der geöffneten Seite – wie der Command und der „+ Aufgabe"-Knopf (addContext).
  navItem(c, plugin, { cls: "bt-nav-add-task", icon: "bt-add-task", label: t("btn_add_task"), onClick: () => plugin.openQuickAddHere() });

  // „Suchen" darunter: öffnet die Aufgaben-Suche (Command-Palette-Stil).
  navItem(c, plugin, { cls: "bt-nav-search", icon: "search", label: t("nav_search"), onClick: () => plugin.openSearch() });

  // Eingang ganz oben, OHNE Abschnittsüberschrift (über den Ansichten). Eingebaute Systemansicht
  // (keine Notiz) – KEIN volles Menü, nur der Kalender-Sync-Ein/Ausschalter (falls mit Google verbunden).
  navItem(c, plugin, {
    cls: "bt-nav-inbox", icon: "inbox", label: t("nav_inbox"),
    count: plugin.index.inboxOpen().length, countKey: "p:" + INBOX_KEY, active: isActive("project", INBOX_KEY),
    page: { kind: "project", key: INBOX_KEY },
    onClick: () => void plugin.activateProject(INBOX_KEY),
    // Der Eingang hat kein volles Item-Menü (Systemansicht ohne Notiz) – aber öffnen lässt er
    // sich wie jede andere Seite, und der Sync-Schalter kommt wie bisher dazu.
    onContext: (e) => {
      const m = new Menu();
      addOpenItems(m, plugin, { kind: "project", key: INBOX_KEY });
      addGcalSyncItem(m, plugin, INBOX_KEY);
      m.showAtMouseEvent(e);
    },
    // Hierher gezogen = aus dem Projekt herausnehmen; „kein Projekt" IST der Eingang.
    onDropTask: (task) => { if (task.project) void plugin.setTaskProject(task, null); },
  });

  for (const id of VIEW_IDS) {
    const active = isActive("view", id);
    // Klasse pro Board (bt-nav-heute …) für einzeln themebare Icon-Farben.
    const page: PageRef = { kind: "view", key: id };
    navItem(c, plugin, {
      cls: "bt-nav-" + id, icon: VIEW_ICON[id], label: viewTitle(id), count: navCount(plugin, id), countKey: "v:" + id,
      active, page, onClick: () => void plugin.activateView(id),
      // Die eingebauten Ansichten haben nichts zu bearbeiten – ihr Menü besteht genau aus den
      // Öffnen-Einträgen. Ohne sie käme man an „Heute in einem zweiten Tab" nur per Modifier-Klick.
      onContext: (e) => { const m = new Menu(); addOpenItems(m, plugin, page); m.showAtMouseEvent(e); },
    });
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
      navItem(c, plugin, {
        cls, icon: p.icon, iconColor: navColor(p.path, p.color), label: p.name,
        count: plugin.index.byProject(p.path).length, countKey: "p:" + p.path,
        active: isActive("project", p.path), page: { kind: "project", key: p.path }, onClick: () => void plugin.activateProject(p.path),
        onContext: (e) => { const m = new Menu(); buildItemMenu(m, plugin, { sec, key: p.path, name: p.name, hidden: p.hidden, color: p.color, type: kind }); m.showAtMouseEvent(e); },
        // Verweise laufen über den Basename (s. setTaskProject); liegt die Aufgabe schon hier,
        // bleibt der Zug folgenlos statt die Notiz unnötig neu zu schreiben.
        onDropTask: (task) => { if (task.project !== p.path) void plugin.setTaskProject(task, p.name); },
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
      navItem(c, plugin, {
        cls: "bt-nav-filter", icon: fl.icon, iconColor: navColor(fl.path, fl.color), label: fl.name,
        count: filterBadgeCount(plugin, fl, today), countKey: "f:" + fl.path,
        active: isActive("filter", fl.path), page: { kind: "filter", key: fl.path }, onClick: () => void plugin.activateFilter(fl.path),
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
      navItem(c, plugin, {
        cls: "bt-nav-label", icon: "hash", iconColor: navColor(name, plugin.getLabelColor(name)), label: name, count, countKey: "l:" + name,
        active: isActive("label", name), page: { kind: "label", key: name }, onClick: () => void plugin.activateLabel(name),
        onContext: (e) => { const m = new Menu(); buildItemMenu(m, plugin, { sec: "labels", key: name, name, hidden: !plugin.isLabelVisible(name), color: plugin.getLabelColor(name) }); m.showAtMouseEvent(e); },
        // Anders als bei Projekt/Bereich/Eingang wird hier nichts VERSCHOBEN, sondern ERGÄNZT:
        // Die Aufgabe bleibt, wo sie ist, und bekommt das Label dazu. Sichtbar wird das sofort am
        // neuen Chip in ihrer Meta-Zeile. Trägt sie es schon, bleibt der Zug folgenlos.
        onDropTask: (task) => { if (!task.labels.includes(name)) void plugin.swapTaskLabel(task, null, name); },
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

/** Fortlaufende Nummer für die Tab-Kennung (s. MainView.id). Bewusst KEIN Pfad/Seitenname:
 *  die Kennung muss den Seitenwechsel eines Tabs überleben und zwei Tabs derselben Seite
 *  auseinanderhalten – beides kann nur eine Identität des Leafs selbst. */
let viewSeq = 0;

/** Erlaubte Werte aus einem gespeicherten Zustand herausfiltern (Workspace-Datei ist fremder Input). */
const oneOfState = <T extends string>(v: unknown, allowed: readonly T[]): T | null =>
  typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : null;

/**
 * Ein Dashboard-Tab. Er BESITZT seine Seite (this.page) – bis 1.33 stand die auf der Plugin-
 * Instanz, weshalb es per Konstruktion nur einen sinnvollen Tab geben konnte. Über getState/
 * setState hängt die Seite jetzt an der Leaf: Obsidian stellt sie beim Neustart wieder her,
 * „In neuem Tab öffnen" ergibt zwei UNTERSCHIEDLICHE Ansichten, und jeder Tab behält seine
 * Scrollpositionen, Klappzustände und sein Layout (s. setLayout).
 */
export class MainView extends ItemView {
  private unsub: (() => void) | null = null;
  private renderComp: Component | null = null;
  /** Zeichnung steht aus, weil der Tab gerade verdeckt ist (s. draw/drawIfDirty). */
  private dirty = false;
  /** Stabile Kennung DIESES Tabs – Bestandteil jedes Schlüssels für transienten Zustand (viewKey). */
  readonly id = "v" + (++viewSeq);
  /** Die Seite, die dieser Tab zeigt. */
  page: PageRef;
  /** Die Wahl DIESES Tabs; was hier fehlt, kommt vom Seiten-Standard (s. setLocal/useLocal). */
  private local: Partial<LocalOptions> = {};
  /**
   * Rolle dieses Tabs im Planungs-Split, sonst null. Ohne diese Merkung legte jeder Aufruf von
   * „Planen" eine WEITERE Anordnung an: Der Befehl übernahm irgendeinen Tab und spaltete einen
   * neuen ab, während die Hälften des vorigen Splits stehen blieben – nach zwei Aufrufen standen
   * drei Ansichten nebeneinander. Mit der Rolle findet der Befehl seine eigenen Tabs wieder und
   * schickt sie beide auf die neue Seite. Wandert in getState: die Paarung übersteht den Neustart.
   */
  planRole: "list" | "calendar" | null = null;
  /** Umschaltbarer Unterzustand der Seite. Bewusst ein eigenes OBJEKT: der Kontext hält eine
   *  Referenz darauf und liest per Getter mit – ein Abzug wäre veraltet, sobald ein Umschalter
   *  ihn setzt und mit demselben Kontext neu zeichnet (Verwaltungs-Tabs machen genau das). */
  private tab = { doneTab: "done" as "done" | "trash", manageTab: "active" as "active" | "archive", doneCollapsed: true };

  constructor(leaf: WorkspaceLeaf, private plugin: BeautyTasksPlugin) {
    super(leaf);
    this.page = plugin.newTabStartPage();
  }
  getViewType(): string { return VIEW_MAIN; }

  /**
   * Tab- und Pane-Titel = der NAME DER SEITE, nicht der Programmname. Solange es genau eine
   * Dashboard-Leaf gab, war „BeautyTasks" eine brauchbare Beschriftung; bei drei offenen Tabs
   * sähen alle drei gleich aus. Woher die Seite kommt, zeigt das Icon im Tab.
   *
   * Bewusst OHNE Unterzustand: „Erledigt" bleibt „Erledigt", auch wenn gerade der Papierkorb-Tab
   * innerhalb der Seite aktiv ist – der Tab-Titel benennt die Seite, nicht die Stelle darin.
   */
  getDisplayText(): string {
    const p = this.page;
    if (p.kind === "manage") return t(manageTitleKey(p.key));
    if (p.kind === "filter") return readFilter(this.plugin.app, p.key)?.name ?? baseName(p.key);
    if (p.kind === "label") return "#" + p.key;
    if (p.kind === "project") return p.key === INBOX_KEY ? t("nav_inbox") : projectDisplayName(baseName(p.key));
    return viewTitle(p.key as ViewId);
  }

  /**
   * Icon = das LAYOUT (Liste · Board · Kalender). Genau das unterscheidet zwei Tabs derselben
   * Seite – ihre Titel sind ja identisch, und für „Liste links, Kalender rechts" ist das die
   * einzige Angabe, die zählt. Seiten ohne Layout-Wahl (Wiederkehrend, Erledigt, Verwaltung)
   * behalten ihr eigenes Ansichts-Icon.
   */
  getIcon(): string {
    const p = this.page;
    if (p.kind === "manage") return "list-plus";
    if (pageInfo(p).tier === "none") return VIEW_ICON[p.key as ViewId] ?? "check-circle";
    return LAYOUT_ICON[this.local.layout ?? this.plugin.pageOptions(p).layout];
  }

  /** Zustand, den Obsidian in die Workspace-Datei schreibt: die Seite dieses Tabs plus das,
   *  was man beim Neustart erwartet, wieder vorzufinden. */
  getState(): Record<string, unknown> {
    return {
      kind: this.page.kind, key: this.page.key,
      layout: this.local.layout ?? null, calPanel: this.local.calPanel ?? null,
      doneTab: this.tab.doneTab, manageTab: this.tab.manageTab, planRole: this.planRole,
    };
  }

  /**
   * Der EINZIGE Weg, diesen Tab auf eine andere Seite zu schicken – von der Workspace-
   * Wiederherstellung, von plugin.openPage() und von ctx.open() gleichermaßen benutzt.
   * `history` bleibt bewusst false: MainView ist keine navigierbare Datei-Ansicht, ein
   * Eintrag in Obsidians Zurück/Vorwärts-Kette wäre hier irreführend.
   */
  async setState(state: unknown, result: ViewStateResult): Promise<void> {
    const s = (state ?? {}) as Record<string, unknown>;
    const kind = oneOfState<PageRef["kind"]>(s.kind, ["view", "project", "label", "filter", "manage"]);
    const key = typeof s.key === "string" ? s.key : "";
    const page: PageRef = kind && key ? { kind, key } : this.page;
    const changed = !samePage(page, this.page);
    if (changed) {
      // Transienten Zustand der ALTEN Seite wegwerfen: Scrollposition und aufgeklappte Badges
      // gehören zu ihr, nicht zum Tab – sonst erbte die neue Seite eine fremde Position.
      dropViewKeys(this.id);
      this.local = {};              // neue Seite startet bei IHREN Standards
      this.tab.doneTab = "done";
      this.tab.doneCollapsed = true;
    }
    this.page = page;
    // Beim Wiederherstellen kommen die gemerkten Werte mit; bei einem Seitenwechsel gibt es sie nicht.
    const layout = oneOfState<PageLayout>(s.layout, LAYOUTS);
    if (layout) this.local.layout = layout;
    if (typeof s.calPanel === "boolean") this.local.calPanel = s.calPanel;
    // Die Rolle hängt am TAB, nicht an der Seite: Ein Seitenwechsel im Planungs-Split lässt ihn
    // ein Planungs-Split bleiben. Deshalb wird sie NUR übernommen, wenn der Zustand wirklich eine
    // mitbringt (Wiederherstellung aus der Workspace-Datei) – eine gewöhnliche Navigation reicht
    // nur {kind, key} herein und darf die Rolle nicht stillschweigend löschen. Genau das tat sie:
    // Nach einem Klick in der Seitenleiste fand „Planen" seine Hälften nicht mehr wieder und
    // spaltete eine dritte Ansicht ab.
    const role = oneOfState<"list" | "calendar">(s.planRole, ["list", "calendar"]);
    if (role) this.planRole = role;
    const done = oneOfState<"done" | "trash">(s.doneTab, ["done", "trash"]);
    if (done) this.tab.doneTab = done;
    const mtab = oneOfState<"active" | "archive">(s.manageTab, ["active", "archive"]);
    if (mtab) this.tab.manageTab = mtab;
    result.history = false;
    this.draw();
  }

  /** Diesen Tab auf eine andere Seite schicken (Backlink, „Zum Projekt", Verwaltungs-Liste, Nav). */
  openPage(page: PageRef): void {
    void this.setState({ kind: page.kind, key: page.key }, { history: false });
    this.plugin.app.workspace.requestSaveLayout();   // Seite des Tabs übersteht den Neustart
    this.plugin.renderNav();                         // Markierung folgt dem aktiven Tab
  }

  /**
   * Layout umstellen. Das Layout gehört dem TAB: Wer die Liste in einem und den Kalender in
   * einem zweiten Tab offen hat, darf beim Umschalten hier nicht den anderen mitreißen – dafür
   * gibt es den zweiten Tab ja gerade. Deshalb bekommt jeder ANDERE Tab derselben Seite, der
   * bisher nur dem Seiten-Standard folgte, vorher ausdrücklich den ALTEN Wert: er bleibt damit
   * stehen, wo er war. Der neue Wert wird zusätzlich als Seiten-Standard gespeichert (wie
   * bisher) – die nächste Zeichnung dieser Seite beginnt also dort.
   */
  /**
   * Nur für diesen Tab setzen – ohne den Seiten-Standard anzufassen. Das ist der Unterschied zu
   * setLocal: Der Planungs-Split ordnet dieselbe Seite für JETZT als Liste und Kalender an; er
   * sagt nichts darüber, wie sie beim nächsten Öffnen aussehen soll.
   * Weil es nur den eigenen Tab betrifft, braucht es hier auch kein Einfrieren der Nachbarn.
   */
  useLocal(patch: Partial<LocalOptions>, planRole: "list" | "calendar" | null = this.planRole): void {
    Object.assign(this.local, patch);
    this.planRole = planRole;
    this.plugin.app.workspace.requestSaveLayout();   // die Anordnung übersteht den Neustart
    this.draw();
  }

  setLocal(patch: Partial<LocalOptions>): void {
    const before = this.plugin.pageOptions(this.page);
    for (const other of this.plugin.mainViews()) {
      if (other === this || !samePage(other.page, this.page)) continue;
      // Nur je Schlüssel einfrieren, und nur wo der Nachbar bisher dem Seiten-Standard folgte:
      // Ein Tab, der sein Layout schon selbst gewählt hat, wird von einer Panel-Änderung hier
      // nicht angefasst und umgekehrt.
      for (const k of Object.keys(patch) as (keyof LocalOptions)[]) {
        if (other.local[k] === undefined) Object.assign(other.local, { [k]: before[k] });
      }
    }
    Object.assign(this.local, patch);
    void this.plugin.setPageOption(this.page, patch);
    // Sofort zeichnen statt auf den Speicher zu warten: auf einer PROJEKT-Seite landet der neue
    // Wert im Frontmatter und käme erst mit dem metadataCache-Ereignis zurück. Der eingefrorene
    // Nachbar-Tab (oben) soll aber im selben Moment sichtbar stehen bleiben, nicht erst gleich.
    this.plugin.renderMain();
  }

  /**
   * Der Kontext, den die Zeichen-Funktionen bekommen – siehe pageCtx.ts.
   *
   * `opts` und `titleComp` sind bewusst MOMENTAUFNAHMEN (sie gelten für genau diese Zeichnung).
   * Der umschaltbare Unterzustand dagegen kommt über Getter aus der View: Aufrufer wie die
   * Verwaltungs-Tabs setzen ihn und zeichnen mit DEMSELBEN ctx neu – ein eingefrorener Wert
   * hätte dort weiter den alten Stand gezeigt und den Umschalter tot wirken lassen.
   */
  ctx(): PageCtx {
    const info = pageInfo(this.page);
    const stored = this.plugin.pageOptions(this.page);
    const crit = this.plugin.pageCriteria(this.page);
    const st = this.tab;   // DASSELBE Objekt, keine Kopie – nur so sehen die Getter jede Änderung
    return {
      plugin: this.plugin,
      id: this.id,
      page: this.page,
      pageKey: info.key,
      opts: { ...stored, ...this.local },
      crit,
      // Ohne Kriterien dieselbe Liste zurückgeben statt einer Kopie: der Ansichtsfilter ist der
      // Ausnahmefall, und jede Seite geht durch diese Funktion.
      filter: (list) => (hasCriteria(crit) ? filterTasks(list, crit, todayStr()) : list),
      titleComp: this.renderComp,
      get doneTab() { return st.doneTab; },
      get manageTab() { return st.manageTab; },
      get doneCollapsed() { return st.doneCollapsed; },
      setDoneTab: (v) => { st.doneTab = v; },
      setManageTab: (v) => { st.manageTab = v; },
      setDoneCollapsed: (v) => { st.doneCollapsed = v; },
      redraw: () => this.draw(),
      open: (p) => this.openPage(p),
      setOption: (patch) => void this.plugin.setPageOption(this.page, patch),
      setCriteria: (patch) => void this.plugin.setPageCriteria(this.page, patch),
      setLayout: (l) => this.setLocal({ layout: l }),
      setCalPanel: (open) => this.setLocal({ calPanel: open }),
      resetOptions: () => { this.local = {}; void this.plugin.resetPageOptions(this.page); },
    };
  }

  async onOpen(): Promise<void> {
    // Checkbox-Aktionen EINMAL delegiert (nicht je Zeichnung je Checkbox – s. taskCheck.ts).
    installCheckDelegation(this.contentEl, this.plugin);
    // Zeilen-Kontextmenü (Rechtsklick/Long-Press) genauso: EIN Satz Listener für alle Zeilen.
    // Der Kontext wird als Funktion gereicht, nicht als Wert: die Delegation lebt so lange wie
    // der Tab, der Kontext dagegen wird je Zeichnung neu gebaut.
    installTaskMenuDelegation(this.contentEl, () => this.ctx());
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose(): Promise<void> {
    this.unsub?.(); this.unsub = null;
    dropViewKeys(this.id);   // sonst wüchsen die Modul-Maps mit jedem geschlossenen Tab weiter
  }
  /** Beim Sichtbarwerden nachziehen, falls in der Zwischenzeit vorgemerkt (s. draw). */
  drawIfDirty(): void { if (this.dirty) this.draw(); }
  onResize(): void { this.drawIfDirty(); }

  draw(): void {
    if (!this.contentEl) return;
    // Ein VERDECKTER Tab (anderer Tab derselben Gruppe) wird nur vorgemerkt. Solange es genau
    // eine Dashboard-Leaf gab, war das kein Thema; mit drei offenen Tabs zahlte man den vollen
    // Aufbau (gemessen ~110 ms) bei JEDER Aufgabenänderung dreifach – zweimal davon für Seiten,
    // die niemand ansieht. Nachgezogen wird beim Sichtbarwerden (onResize bzw. der
    // active-leaf-change-Zweig in main.ts).
    if (!this.containerEl.isShown()) { this.dirty = true; return; }
    this.dirty = false;
    // Kalender: Ist der Rahmen unverändert (gleiche Seite, gleicher Modus, gleicher Zeitraum), reicht
    // es, die Aufgaben-Elemente nachzuziehen – ein Dutzend statt ~1800 Elemente. Der komplette
    // Neuaufbau unten kostete gemessen ~80 ms Style + Layout + Paint bei JEDER Änderung.
    // tryPatchCalendar lehnt bei der kleinsten Abweichung ab; dann läuft der normale Pfad.
    if (this.page.kind !== "manage" && tryPatchCalendar(this.contentEl, this.ctx())) return;
    // Frische Render-Component pro Zeichnung: Markdown-Titel (Links) sauber auf-/abbauen,
    // damit sich Hover-/Embed-Kindkomponenten nicht über Redraws hinweg ansammeln. Sie hängt an
    // DIESER View (früher an der Plugin-Instanz): bei zwei zeichnenden Tabs überschrieb der
    // zweite die Referenz des ersten – dessen Kindkomponenten wurden dann nie sauber abgeräumt.
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new Component());
    const ctx = this.ctx();
    this.contentEl.removeClass("bt-view-calendar");   // setzt renderCalendar bei Bedarf wieder
    if (this.page.kind === "manage") renderManageInto(this.contentEl, ctx);
    else if (this.page.kind === "filter") renderFilterBoardInto(this.contentEl, ctx, this.page.key);
    else if (this.page.kind === "label") renderLabelBoardInto(this.contentEl, ctx, this.page.key);
    else if (this.page.kind === "project") renderProjectBoardInto(this.contentEl, ctx, this.page.key);
    else renderViewInto(this.contentEl, ctx, this.page.key as ViewId);
    this.syncTitle();
  }

  /** Tab UND Pane-Header (zwei getrennte Elemente) auf die aktuelle Seite bringen –
   *  sonst bleibt der Titel beim zuerst geöffneten View hängen. Seit Titel und Icon der Seite
   *  folgen, gilt das für beide: das Icon wechselt schon beim bloßen Layout-Umschalten. */
  private syncTitle(): void {
    (this.leaf as WorkspaceLeaf & { updateHeader?: () => void }).updateHeader?.();   // Tab
    const titleEl = this.containerEl.querySelector<HTMLElement>(".view-header-title");
    if (titleEl) titleEl.setText(this.getDisplayText());                              // Pane-Header
    const iconEl = this.containerEl.querySelector<HTMLElement>(".view-header-icon");
    if (iconEl) setIcon(iconEl, this.getIcon());
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
