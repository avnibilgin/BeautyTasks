import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { ViewOptions } from "./filterEngine";
import { t, getLocale } from "./i18n";
import { combineDT } from "./format";
import { isDone } from "./statuses";
import { openPopover } from "./popover";
import {
  CalMode, CAL_MODES, monthGrid, weekDays, bucketByDue, layoutDay, allDayOf,
  addDays, addMonths, sameMonth, parseISO,
} from "./calendarModel";

/**
 * Kalender-Layout (drittes Layout neben Liste und Board). Dünner Zeichner über calendarModel.ts:
 * die gesamte Datums-/Überlappungs-Logik liegt dort und ist per Vitest abgedeckt.
 *
 * Achse ist `due`. Ziehen einer Aufgabe terminiert sie um:
 *   Monat / Ganztägig-Zeile -> nur der Tag ändert sich (eine gesetzte Uhrzeit bleibt erhalten)
 *   Zeitraster              -> Tag UND Uhrzeit (auf 15 Minuten gerundet)
 * Der Griff am unteren Blockrand ändert die Dauer.
 *
 * CSS-Präfix ist bewusst `bt-calview-`: `bt-cal-*` gehört bereits dem Mini-Kalender im
 * Datumswähler (styles.css, unter .bt-pop gescopet).
 */

const HOUR_PX = 44;              // Höhe einer Stunde im Zeitraster
const SNAP_MIN = 15;             // Raster beim Ziehen/Resizen
const MONTH_CHIPS = 3;           // Chips je Tageszelle, darüber „+N“
const MIN_DUR = 15;

// Angezeigter Zeitraum je Seite (transient wie boardScroll – ein Reload startet wieder bei „heute“).
const anchors = new Map<string, string>();
const pageKey = (plugin: BeautyTasksPlugin): string =>
  (plugin.currentProject ?? plugin.currentLabel ?? plugin.currentFilter ?? plugin.currentView ?? "") + "|cal";

// Drag-Zustand (nur eigene Chips, kein Vault-Drag)
let dragPath: string | null = null;

const z = (n: number) => String(n).padStart(2, "0");
const hhmm = (min: number): string => z(Math.floor(min / 60)) + ":" + z(min % 60);
const snap = (min: number): number => Math.max(0, Math.min(1425, Math.round(min / SNAP_MIN) * SNAP_MIN));
const weekdayShort = (dayIdx: number): string =>
  new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(2021, 7, 1 + dayIdx));
const monthYear = (isoDate: string): string =>
  new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(parseISO(isoDate));

/** Kalender zeichnen. `tasks` ist die bereits gefilterte Menge der Seite (inkl. Erledigte, wenn showDone). */
export function renderCalendar(root: HTMLElement, plugin: BeautyTasksPlugin, tasks: Task[], today: string,
  opts: ViewOptions, redraw: () => void): void {
  root.addClass("bt-sizer-board");            // volle Pane-Breite (wie das Kanban)
  const key = pageKey(plugin);
  const anchor = anchors.get(key) ?? today;
  const mode: CalMode = opts.calMode;
  const buckets = bucketByDue(tasks);

  const go = (next: string): void => { anchors.set(key, next); redraw(); };
  const step = (dir: number): void => go(mode === "month" ? addMonths(anchor, dir) : addDays(anchor, dir * 7));

  // ── Kopf: ‹ › Heute · Titel · [Monat | Woche] ──
  const head = root.createDiv({ cls: "bt-calview-head" });
  const nav = head.createDiv({ cls: "bt-calview-nav" });
  const navBtn = (icon: string, label: string, onClick: () => void): void => {
    const b = nav.createEl("button", { cls: "bt-calview-nav-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
    setIcon(b, icon);
    b.onclick = onClick;
  };
  navBtn("chevron-left", t("cal_prev"), () => step(-1));
  navBtn("chevron-right", t("cal_next"), () => step(1));
  const todayBtn = nav.createEl("button", { cls: "bt-calview-today", text: t("cal_today") });
  todayBtn.onclick = () => go(today);
  head.createSpan({ cls: "bt-calview-title", text: mode === "month" ? monthYear(anchor) : weekTitle(anchor) });

  const seg = head.createDiv({ cls: "bt-tabs bt-calview-seg" });
  for (const m of CAL_MODES) {
    const b = seg.createEl("button", { cls: "bt-tab" + (mode === m ? " is-active" : ""), text: t("cal_mode_" + m) });
    b.onclick = () => void plugin.setPageViewOption({ calMode: m });
  }

  if (mode === "month") renderMonth(root, plugin, buckets, anchor, today, redraw);
  else renderWeek(root, plugin, buckets, anchor, today, redraw);
}

/** „13. – 19. Juli 2026“ (Wochenspanne, über Monatsgrenzen hinweg lesbar). */
function weekTitle(anchor: string): string {
  const days = weekDays(anchor);
  const a = parseISO(days[0]), b = parseISO(days[6]);
  const fmt = (d: Date, withMonth: boolean): string =>
    new Intl.DateTimeFormat(getLocale(), withMonth ? { day: "numeric", month: "long" } : { day: "numeric" }).format(d);
  const year = new Intl.DateTimeFormat(getLocale(), { year: "numeric" }).format(b);
  return `${fmt(a, a.getMonth() !== b.getMonth())} – ${fmt(b, true)} ${year}`;
}

// ── Monat ──────────────────────────────────────────────────────────────────────
function renderMonth(root: HTMLElement, plugin: BeautyTasksPlugin, buckets: Map<string, Task[]>,
  anchor: string, today: string, redraw: () => void): void {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-month" });
  const wd = wrap.createDiv({ cls: "bt-calview-weekdays" });
  for (const i of [1, 2, 3, 4, 5, 6, 0]) wd.createDiv({ cls: "bt-calview-wd", text: weekdayShort(i) });

  const grid = wrap.createDiv({ cls: "bt-calview-grid" });
  for (const day of monthGrid(anchor)) {
    const cell = grid.createDiv({ cls: "bt-calview-cell" });
    if (!sameMonth(day, anchor)) cell.addClass("is-other");
    if (day === today) cell.addClass("is-today");
    const wdIdx = parseISO(day).getDay();
    if (wdIdx === 0 || wdIdx === 6) cell.addClass("is-weekend");

    const num = cell.createDiv({ cls: "bt-calview-daynum", text: String(parseISO(day).getDate()) });
    // Klick auf freie Fläche/Tagesnummer: neue Aufgabe an diesem Tag.
    const addHere = (): void => plugin.openNewTaskOn(day);
    num.onclick = (e) => { e.stopPropagation(); addHere(); };
    cell.onclick = addHere;

    const items = sortDay(buckets.get(day) ?? []);
    const list = cell.createDiv({ cls: "bt-calview-chips" });
    for (const tk of items.slice(0, MONTH_CHIPS)) renderChip(list, plugin, tk);
    if (items.length > MONTH_CHIPS) {
      const more = cell.createDiv({ cls: "bt-calview-more", text: t("cal_more", items.length - MONTH_CHIPS) });
      more.onclick = (e) => {
        e.stopPropagation();
        openPopover(more, (pop) => {                       // alle Aufgaben des Tages im Popover
          pop.addClass("bt-calview-pop");
          pop.createDiv({ cls: "bt-pop-head", text: dayTitle(day) });
          for (const tk of items) renderChip(pop, plugin, tk);
        });
      };
    }
    // Ganzer Tag ist Drop-Ziel: nur der Tag ändert sich, eine gesetzte Uhrzeit bleibt.
    dropTarget(cell, plugin, (task) => combineDT(day, task.dueTime), redraw);
  }
}

const dayTitle = (day: string): string =>
  new Intl.DateTimeFormat(getLocale(), { weekday: "long", day: "numeric", month: "long" }).format(parseISO(day));

/** Innerhalb eines Tages: Terminierte zuerst (nach Uhrzeit), dann Ganztägige; Erledigte ans Ende. */
function sortDay(list: Task[]): Task[] {
  return [...list].sort((a, b) => {
    const da = isDone(a.status) ? 1 : 0, db = isDone(b.status) ? 1 : 0;
    if (da !== db) return da - db;
    const ta = a.dueTime ?? "99:99", tb = b.dueTime ?? "99:99";
    return ta.localeCompare(tb) || a.title.localeCompare(b.title);
  });
}

// ── Woche (Ganztägig-Zeile + Zeitraster) ───────────────────────────────────────
function renderWeek(root: HTMLElement, plugin: BeautyTasksPlugin, buckets: Map<string, Task[]>,
  anchor: string, today: string, redraw: () => void): void {
  const days = weekDays(anchor);
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-week" });

  // Kopfzeile: leere Gutter-Spalte + 7 Tagesköpfe
  const head = wrap.createDiv({ cls: "bt-calview-week-head" });
  head.createDiv({ cls: "bt-calview-gutter" });
  for (const day of days) {
    const d = head.createDiv({ cls: "bt-calview-dayhead" + (day === today ? " is-today" : "") });
    d.createSpan({ cls: "bt-calview-dayhead-wd", text: weekdayShort(parseISO(day).getDay()) });
    d.createSpan({ cls: "bt-calview-dayhead-num", text: String(parseISO(day).getDate()) });
    d.onclick = () => plugin.openNewTaskOn(day);
  }

  // Ganztägig-Zeile: alles ohne Uhrzeit. Drop hierher entfernt eine gesetzte Uhrzeit.
  const allday = wrap.createDiv({ cls: "bt-calview-allday" });
  const gut = allday.createDiv({ cls: "bt-calview-gutter" });
  gut.createSpan({ text: t("cal_allday") });
  for (const day of days) {
    const cell = allday.createDiv({ cls: "bt-calview-allday-cell" + (day === today ? " is-today" : "") });
    for (const tk of sortDay(allDayOf(buckets.get(day) ?? []))) renderChip(cell, plugin, tk);
    dropTarget(cell, plugin, () => day, redraw);           // ohne Zeitanteil = ganztägig
  }

  // Zeitraster: Stundenlinien links, 7 Spalten mit absolut positionierten Blöcken.
  const gridWrap = wrap.createDiv({ cls: "bt-calview-timegrid" });
  const gutter = gridWrap.createDiv({ cls: "bt-calview-gutter bt-calview-hours" });
  for (let h = 0; h < 24; h++) {
    const row = gutter.createDiv({ cls: "bt-calview-hour" });
    row.style.height = HOUR_PX + "px";
    if (h) row.createSpan({ text: z(h) + ":00" });          // 00:00 nicht beschriften (Kante)
  }
  for (const day of days) {
    const col = gridWrap.createDiv({ cls: "bt-calview-daycol" + (day === today ? " is-today" : "") });
    col.style.height = 24 * HOUR_PX + "px";
    for (let h = 1; h < 24; h++) {
      const line = col.createDiv({ cls: "bt-calview-line" });
      line.style.top = h * HOUR_PX + "px";
    }
    if (day === today) {
      const now = new Date();
      const nowLine = col.createDiv({ cls: "bt-calview-now" });
      nowLine.style.top = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX + "px";
    }

    // Klick auf freie Fläche: neue Aufgabe mit der Uhrzeit des Slots.
    col.onclick = (e) => {
      if (e.target !== col && !(e.target as HTMLElement).hasClass("bt-calview-line")) return;
      plugin.openNewTaskOn(day, hhmm(snap(yToMin(e.clientY, col))));
    };

    for (const b of layoutDay(sortDay(buckets.get(day) ?? []))) {
      const el = col.createDiv({ cls: "bt-calview-block" });
      el.style.top = (b.startMin / 60) * HOUR_PX + "px";
      el.style.height = Math.max(18, ((b.endMin - b.startMin) / 60) * HOUR_PX - 2) + "px";
      el.style.left = `calc(${(b.col / b.cols) * 100}% + 2px)`;
      el.style.width = `calc(${(1 / b.cols) * 100}% - 4px)`;
      decorate(el, plugin, b.task);
      el.createDiv({ cls: "bt-calview-block-time", text: hhmm(b.startMin) });
      el.createDiv({ cls: "bt-calview-block-title", text: b.task.title });
      dragSource(el, b.task);
      // Griff am unteren Rand: zieht die Dauer auf (rundet auf 15 min, Minimum 15 min).
      const grip = el.createDiv({ cls: "bt-calview-resize" });
      grip.onmousedown = (e) => startResize(e, el, b.task, b.startMin, plugin, redraw);
    }

    // Drop ins Raster: Tag UND Uhrzeit (gerastert auf 15 min).
    dropTarget(col, plugin, (_task, ev) => combineDT(day, hhmm(snap(yToMin(ev.clientY, col)))), redraw);
  }
  // Arbeitstag sichtbar: auf 07:00 scrollen (nicht auf Mitternacht).
  gridWrap.scrollTop = 7 * HOUR_PX;
}

/** Y-Position (Viewport) -> Minuten seit Mitternacht in dieser Tagesspalte. */
function yToMin(clientY: number, col: HTMLElement): number {
  const r = col.getBoundingClientRect();
  return ((clientY - r.top) / HOUR_PX) * 60;
}

/** Dauer per Maus ziehen. Bewusst Maus-Events (kein HTML5-Drag): das liefert stetige Positionen. */
function startResize(e: MouseEvent, el: HTMLElement, task: Task, startMin: number,
  plugin: BeautyTasksPlugin, redraw: () => void): void {
  e.preventDefault(); e.stopPropagation();
  const col = el.parentElement!;
  const doc = el.ownerDocument;
  let minutes = Math.max(MIN_DUR, (task.duration ?? 30));
  const onMove = (ev: MouseEvent): void => {
    minutes = Math.max(MIN_DUR, snap(yToMin(ev.clientY, col)) - startMin);
    el.style.height = Math.max(18, (minutes / 60) * HOUR_PX - 2) + "px";
  };
  const onUp = (): void => {
    doc.removeEventListener("mousemove", onMove);
    doc.removeEventListener("mouseup", onUp);
    if (minutes !== task.duration) void plugin.setTaskDuration(task, minutes).then(redraw);
  };
  doc.addEventListener("mousemove", onMove);
  doc.addEventListener("mouseup", onUp);
}

// ── Chips, Drag & Drop ─────────────────────────────────────────────────────────
/** Kompakter Aufgaben-Chip (Monatszelle, Ganztägig-Zeile, „+N“-Popover). */
function renderChip(parent: HTMLElement, plugin: BeautyTasksPlugin, task: Task): void {
  const chip = parent.createDiv({ cls: "bt-calview-chip" });
  decorate(chip, plugin, task);
  if (task.dueTime) chip.createSpan({ cls: "bt-calview-chip-time", text: task.dueTime });
  chip.createSpan({ cls: "bt-calview-chip-title", text: task.title });
  dragSource(chip, task);
}

/** Gemeinsames Verhalten von Chip und Zeitblock: Farbe, Erledigt-Zustand, Klick. */
function decorate(el: HTMLElement, plugin: BeautyTasksPlugin, task: Task): void {
  el.dataset.path = task.path;
  if (isDone(task.status)) el.addClass("is-done");
  el.style.setProperty("--bt-cal-tint", prioTint(task));
  el.onclick = (e) => { e.stopPropagation(); plugin.openEditTask(task); };
}

const PRIO_TINT: Record<string, string> = {
  highest: "#ef4444", high: "#f59e0b", medium: "#3b82f6",
};
const prioTint = (task: Task): string => PRIO_TINT[task.priority] ?? "var(--interactive-accent)";

function dragSource(el: HTMLElement, task: Task): void {
  el.setAttr("draggable", "true");
  el.addEventListener("dragstart", (e) => {
    dragPath = task.path;
    el.addClass("is-dragging");
    e.dataTransfer?.setData("text/plain", task.path);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });
  el.addEventListener("dragend", () => { dragPath = null; el.removeClass("is-dragging"); });
}

/** Drop-Ziel: `dueOf` liefert den neuen due-Wert („YYYY-MM-DD“ oder mit „THH:mm“). */
function dropTarget(el: HTMLElement, plugin: BeautyTasksPlugin,
  dueOf: (task: Task, ev: DragEvent) => string, redraw: () => void): void {
  el.addEventListener("dragover", (e) => {
    if (!dragPath) return;                                 // nur eigene Chips
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    el.addClass("is-drop");
  });
  el.addEventListener("dragleave", (e) => {
    if (!el.contains(e.relatedTarget as Node | null)) el.removeClass("is-drop");
  });
  el.addEventListener("drop", (e) => {
    e.preventDefault(); e.stopPropagation();
    el.removeClass("is-drop");
    const path = e.dataTransfer?.getData("text/plain") || dragPath;
    dragPath = null;
    if (!path) return;
    const task = plugin.index.get(path);
    if (!task) return;
    const next = dueOf(task, e);
    if (next === combineDT(task.due ?? "", task.dueTime)) return;    // unverändert -> kein Schreibvorgang
    void plugin.setTaskDate(task, "due", next).then(redraw);
  });
}
