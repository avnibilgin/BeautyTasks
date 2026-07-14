import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { ViewOptions } from "./filterEngine";
import { t, getLocale } from "./i18n";
import { combineDT, todayStr } from "./format";
import { isDone, isOpen } from "./statuses";
import { renderCheck, installCheckDelegation } from "./taskCheck";
import { openPopover } from "./popover";
import {
  CalMode, CAL_MODES, monthGrid, weekDays, yearMonths, bucketByDue, layoutDay, allDayOf,
  addDays, addMonths, addYears, sameMonth, parseISO, DEFAULT_BLOCK_MIN,
  ChipMetrics, ChipFit, chipsThatFit, shownChips,
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

const HOUR_PX = 60;              // Höhe einer Stunde im Zeitraster
const SNAP_MIN = 15;             // Raster beim Ziehen/Resizen
const MIN_DUR = 15;
const TWO_LINE_PX = 34;          // darunter passen Uhrzeit + Titel nicht untereinander -> eine Zeile
const DAY_START_HOUR = 7;        // Startansicht der Wochenansicht (nicht Mitternacht)

// Angezeigter Zeitraum je Seite (transient wie boardScroll – ein Reload startet wieder bei „heute“).
const anchors = new Map<string, string>();
const pageKey = (plugin: BeautyTasksPlugin): string =>
  (plugin.currentProject ?? plugin.currentLabel ?? plugin.currentFilter ?? plugin.currentView ?? "") + "|cal";

// Drag-Zustand (nur eigene Chips, kein Vault-Drag)
let dragPath: string | null = null;

const z = (n: number) => String(n).padStart(2, "0");
const hhmm = (min: number): string => z(Math.floor(min / 60)) + ":" + z(min % 60);
/** Zeitspanne eines Blocks: „09:30 – 11:00" (Gedankenstrich statt „bis" – gilt in allen Sprachen). */
const span = (from: number, to: number): string => hhmm(from) + " – " + hhmm(to);
const snap = (min: number): number => Math.max(0, Math.min(1425, Math.round(min / SNAP_MIN) * SNAP_MIN));
const weekdayShort = (dayIdx: number): string =>
  new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(2021, 7, 1 + dayIdx));
const monthYear = (isoDate: string): string =>
  new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(parseISO(isoDate));

/** Projekt/Label der Seite – eine hier angelegte Aufgabe erbt sie (wie „+ Aufgabe" der Liste). */
export interface CalendarAdd { project?: string | null; label?: string }

/**
 * ── Inkrementelles Nachzeichnen ──────────────────────────────────────────────────────────────
 * Ändert sich EINE Aufgabe, wirft MainView.draw() sonst die ganze Seite weg und baut sie neu:
 * gemessen ~1800 Elemente, ~80 ms Style + Layout + Paint, die Chromium nicht schneller kann.
 *
 * Der Kalender merkt sich deshalb, WO die aufgabenabhängigen Teile stecken (Monatszellen,
 * Tagesspalten, Ganztägig-Zeile, Seitenleiste) und wie er sie füllt. Bei einer reinen
 * Datenänderung wird nur das neu gezeichnet – ein Dutzend Elemente statt 1800.
 *
 * Sicherheitsnetz: Der Patch greift NUR, wenn der Kontext bitgenau derselbe ist (Seite, Modus,
 * Zeitraum, Erledigte, Panel, Datum). Jede Abweichung -> vollständiger Neuaufbau wie bisher.
 * Ein Patch-Pfad, der einen Fall übersieht, zeigt veraltete Daten; lieber einmal zu viel neu bauen.
 */
interface CalMount {
  sig: string;                       // Kontext-Signatur (s. calSignature)
  root: HTMLElement;                 // Kalender-Wurzel (isConnected-Prüfung)
  source: () => Task[];              // Aufgaben der Seite – frisch aus dem Index
  paint: (tasks: Task[]) => void;    // füllt NUR die aufgabenabhängigen Teile
}
const mounts = new WeakMap<HTMLElement, CalMount>();

/** Signatur des Kalender-Kontexts. Gleich = derselbe Rahmen, nur andere Aufgaben. */
function calSignature(plugin: BeautyTasksPlugin, opts: ViewOptions): string {
  const key = pageKey(plugin);
  const today = todayStr();
  return [key, opts.calMode, anchors.get(key) ?? today, opts.showDone, opts.calPanel, today].join("|");
}

/** Versucht, den bereits gezeichneten Kalender in `c` nur nachzufüllen. true = erledigt,
 *  der Aufrufer darf das Neuzeichnen überspringen. */
export function tryPatchCalendar(c: HTMLElement, plugin: BeautyTasksPlugin): boolean {
  const m = mounts.get(c);
  if (!m || !m.root.isConnected) return false;
  const opts = plugin.pageViewOptions();
  if (opts.layout !== "calendar") return false;
  if (m.sig !== calSignature(plugin, opts)) return false;
  m.paint(m.source());
  return true;
}

/**
 * Der Tag, den die Seite gerade MEINT – oder null. Nur die Tagesansicht zeigt genau einen Tag;
 * in Woche/Monat/Jahr wäre die Wahl willkürlich. Damit weiß auch „+ Aufgabe hinzufügen"
 * außerhalb des Kalenders, auf welches Datum es vorbelegen soll.
 */
export function calendarDayAnchor(plugin: BeautyTasksPlugin, opts: ViewOptions): string | null {
  if (opts.layout !== "calendar" || opts.calMode !== "day") return null;
  return anchors.get(pageKey(plugin)) ?? todayStr();
}

/** Kalender zeichnen. `source` liefert die Aufgaben der Seite – als Funktion, damit der
 *  Patch-Pfad sie später frisch nachladen kann, ohne die Seiten-Logik zu kennen. */
export function renderCalendar(root: HTMLElement, plugin: BeautyTasksPlugin, source: () => Task[], today: string,
  opts: ViewOptions, redraw: () => void, add: CalendarAdd = {}): void {
  const tasks = source();
  root.addClass("bt-sizer-board");            // volle Pane-Breite (wie das Kanban)
  root.addClass("bt-calview-host");           // + volle Pane-HÖHE (Flex-Kette bis zum unteren Rand)
  // Der Scroll-Container muss für die Höhen-Kette selbst Flex werden. Das lief über
  // .bt-view:has(> .bt-calview-host) – und :has() ist in Chromium ein Style-Recalc-Killer: bei
  // JEDER DOM-Änderung im Teilbaum muss die Bedingung neu geprüft werden (im Profil: 72 ms
  // Recalculate Style je Neuzeichnung). Eine schlichte Klasse kostet nichts.
  root.parentElement?.addClass("bt-view-calendar");
  const key = pageKey(plugin);
  const anchor = anchors.get(key) ?? today;
  const mode: CalMode = opts.calMode;

  const go = (next: string): void => { anchors.set(key, next); redraw(); };
  // Ein Klick auf ‹/› springt um die angezeigte Spanne weiter: Jahr, Monat, Woche oder Tag.
  const step = (dir: number): void => go(
    mode === "year" ? addYears(anchor, dir)
      : mode === "month" ? addMonths(anchor, dir)
        : addDays(anchor, dir * (mode === "week" ? 7 : 1)));

  // ── Kopf: ‹ › Heute · Titel · [Monat | Woche] ──
  const head = root.createDiv({ cls: "bt-calview-head" });
  const nav = head.createDiv({ cls: "bt-calview-nav" });
  const navBtn = (icon: string, label: string, onClick: () => void): void => {
    const b = nav.createEl("button", { cls: "bt-calview-nav-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
    setIcon(b, icon);
    b.onclick = onClick;
  };
  // „Heute" sitzt zwischen den Chevrons: ‹ Heute ›
  navBtn("chevron-left", t("cal_prev"), () => step(-1));
  const todayBtn = nav.createEl("button", { cls: "bt-calview-today", text: t("cal_today") });
  todayBtn.onclick = () => go(today);
  navBtn("chevron-right", t("cal_next"), () => step(1));
  head.createSpan({ cls: "bt-calview-title", text: rangeTitle(mode, anchor) });

  const seg = head.createDiv({ cls: "bt-tabs bt-calview-seg" });
  for (const m of CAL_MODES) {
    const b = seg.createEl("button", { cls: "bt-tab" + (mode === m ? " is-active" : ""), text: t("cal_mode_" + m) });
    b.onclick = () => void plugin.setPageViewOption({ calMode: m });
  }

  // Undatierte der Seite = Quelle der Seitenleiste. Sie fallen ohnehin aus bucketByDue() heraus,
  // tauchen im Raster also nirgends auf – ohne Panel wären sie im Kalender unsichtbar.
  const unscheduledOf = (list: Task[]): Task[] => list.filter((tk) => !tk.due && isOpen(tk.status));
  // Im Jahr gibt es keine Drop-Ziele -> dort wäre eine Ablage zum Ziehen sinnlos.
  const panelUseful = mode !== "year";
  let setPanelCount: (n: number) => void = () => { /* kein Panel-Knopf im Jahr */ };
  if (panelUseful) {
    // Icon + Anzahl. „calendar-off" (durchgestrichener Kalender) statt „inbox": Letzteres behauptete
    // „Eingang" (ein Projekt) statt „ohne Datum" (ein Zustand) – das falsche Bild.
    const tgl = seg.createEl("button", {
      cls: "bt-tab bt-calview-panel-btn" + (opts.calPanel ? " is-active" : ""),
      attr: { "aria-label": t("cal_unscheduled"), "data-tooltip-position": "top" },
    });
    setIcon(tgl.createSpan({ cls: "bt-calview-panel-ic" }), "calendar-off");
    const n = tgl.createSpan({ cls: "bt-calview-panel-n" });
    setPanelCount = (count: number) => n.setText(count ? String(count) : "");
    tgl.onclick = () => void plugin.setPageViewOption({ calPanel: !opts.calPanel });
  }

  // In eine feinere Ansicht springen: Anker zuerst setzen, dann den Modus (der rendert neu).
  const zoom = (next: string, m: CalMode): void => { anchors.set(key, next); void plugin.setPageViewOption({ calMode: m }); };

  // Kalender + Seitenleiste stehen nebeneinander (das Panel schiebt das Raster, überlagert es nicht).
  const body = root.createDiv({ cls: "bt-calview-body" });
  // Jeder Zeichner baut sein GERÜST und liefert eine Funktion zurück, die nur die Aufgaben füllt.
  // Tag und Woche sind dasselbe Zeitraster – nur mit einer statt sieben Spalten.
  const fillGrid = mode === "year" ? renderYear(body, plugin, anchor, today, zoom)
    : mode === "month" ? renderMonth(body, plugin, anchor, today, add)
      : renderTimeGrid(body, plugin, mode === "day" ? [anchor] : weekDays(anchor), today, add);
  const fillPanel = panelUseful && opts.calPanel ? renderUnscheduled(body, plugin, add) : null;

  /** Nur die aufgabenabhängigen Teile neu zeichnen (Gerüst bleibt stehen). */
  const paint = (list: Task[]): void => {
    const unsched = unscheduledOf(list);
    fillGrid(bucketByDue(list));
    fillPanel?.(unsched);
    setPanelCount(unsched.length);
  };
  paint(tasks);

  // Für das nächste Mal merken: gleiche Signatur -> nur noch paint() statt Neuaufbau.
  const host = root.parentElement;
  if (host) mounts.set(host, { sig: calSignature(plugin, opts), root, source, paint });
}

/** Kopftitel je Modus: „2026" | „Juli 2026" | „13. – 19. Juli 2026" | „Montag, 13. Juli 2026". */
function rangeTitle(mode: CalMode, anchor: string): string {
  if (mode === "year") return anchor.slice(0, 4);
  if (mode === "month") return monthYear(anchor);
  if (mode === "day") {
    return new Intl.DateTimeFormat(getLocale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" })
      .format(parseISO(anchor));
  }
  return weekTitle(anchor);
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

// ── Jahr: zwölf Mini-Monate ────────────────────────────────────────────────────
/** Klick auf den Monatsnamen -> Monatsansicht, Klick auf einen Tag -> Tagesansicht. Tage mit
 *  Aufgaben sind markiert (Punkt), damit das Jahr nicht nur ein Datumsraster ist. */
function renderYear(root: HTMLElement, plugin: BeautyTasksPlugin,
  anchor: string, today: string, zoom: (next: string, m: CalMode) => void): (b: Map<string, Task[]>) => void {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-year" });
  const cells: { day: string; el: HTMLElement }[] = [];

  for (const first of yearMonths(anchor)) {
    const card = wrap.createDiv({ cls: "bt-calview-mini" });
    const title = card.createDiv({ cls: "bt-calview-mini-title", text: monthName(first) });
    title.onclick = () => zoom(first, "month");

    const grid = card.createDiv({ cls: "bt-calview-mini-grid" });
    for (const i of [1, 2, 3, 4, 5, 6, 0]) grid.createDiv({ cls: "bt-calview-mini-wd", text: weekdayShort(i) });
    for (const day of monthGrid(first)) {
      const cell = grid.createDiv({ cls: "bt-calview-mini-day", text: String(parseISO(day).getDate()) });
      if (!sameMonth(day, first)) cell.addClass("is-other");     // Nachbarmonate: nur Kontext
      if (day === today) cell.addClass("is-today");
      cell.onclick = () => zoom(day, "day");
      cells.push({ day, el: cell });
    }
  }

  // Füller: im Jahr ändert sich nur der Aufgaben-Punkt – kein Element wird neu erzeugt.
  return (buckets) => {
    for (const { day, el } of cells) {
      const n = (buckets.get(day) ?? []).length;
      el.toggleClass("has-tasks", n > 0);
      if (n) {
        el.setAttribute("aria-label", t("cal_tasks", n));
        el.setAttribute("data-tooltip-position", "top");
      } else {
        el.removeAttribute("aria-label");
      }
    }
  };
}

const monthName = (isoDate: string): string =>
  new Intl.DateTimeFormat(getLocale(), { month: "long" }).format(parseISO(isoDate));

// ── Monat ──────────────────────────────────────────────────────────────────────
/** Notnagel-Höhen, bis einmal echt gemessen wurde (Theme/Schriftgröße können abweichen). */
const CELL_GAP = 2;                 // muss zum gap von .bt-calview-cell-body passen (styles.css)
const CHIP_PX = 25;
const MORE_PX = 18;
/** Solange die Zelle noch keine Höhe hat (View noch nicht sichtbar) – der ResizeObserver zieht nach. */
const CHIPS_UNMEASURED: ChipFit = { all: 3, some: 3 };

/** Chip- und „+N"-Höhe am echten DOM messen – Theme, Schriftgröße und Zoom gehen so von selbst ein.
 *  Die Probe hängt kurz im Raster, ist aber per CSS aus dem Layout genommen (.bt-calview-probe). */
function measureChips(grid: HTMLElement, plugin: BeautyTasksPlugin, sample: Task): ChipMetrics {
  const probe = grid.createDiv({ cls: "bt-calview-probe" });
  renderChip(probe, plugin, sample);
  const chip = probe.firstElementChild as HTMLElement | null;
  const more = probe.createDiv({ cls: "bt-calview-more", text: t("cal_more", 1) });
  const m: ChipMetrics = {
    chip: chip?.offsetHeight || CHIP_PX,
    more: more.offsetHeight || MORE_PX,
    gap: CELL_GAP,
  };
  probe.remove();
  return m;
}

const firstTask = (buckets: Map<string, Task[]>): Task | null => {
  for (const list of buckets.values()) if (list.length) return list[0];
  return null;
};

function renderMonth(root: HTMLElement, plugin: BeautyTasksPlugin,
  anchor: string, today: string, add: CalendarAdd): (b: Map<string, Task[]>) => void {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-month" });
  const wd = wrap.createDiv({ cls: "bt-calview-weekdays" });
  for (const i of [1, 2, 3, 4, 5, 6, 0]) wd.createDiv({ cls: "bt-calview-wd", text: weekdayShort(i) });

  const grid = wrap.createDiv({ cls: "bt-calview-grid" });
  const cells: { day: string; body: HTMLElement }[] = [];

  for (const day of monthGrid(anchor)) {
    const cell = grid.createDiv({ cls: "bt-calview-cell" });
    if (!sameMonth(day, anchor)) cell.addClass("is-other");
    if (day === today) cell.addClass("is-today");
    const wdIdx = parseISO(day).getDay();
    if (wdIdx === 0 || wdIdx === 6) cell.addClass("is-weekend");

    const num = cell.createDiv({ cls: "bt-calview-daynum", text: String(parseISO(day).getDate()) });
    const addHere = (): void => plugin.openNewTaskOn(day, null, add.project ?? undefined, add.label);
    num.onclick = (e) => { e.stopPropagation(); addHere(); };
    cell.onclick = addHere;

    // Aufgaben-Teil der Zelle in einem eigenen Container, der sich in einem Zug leeren lässt.
    // Nur DAS wird beim Patch neu gefüllt. Er füllt die Zelle unter der Tagesnummer aus (flex: 1),
    // seine clientHeight IST damit der Platz, der für Chips übrig ist.
    const cellBody = cell.createDiv({ cls: "bt-calview-cell-body" });
    cells.push({ day, body: cellBody });

    // Ganzer Tag ist Drop-Ziel: nur der Tag ändert sich, eine gesetzte Uhrzeit bleibt.
    dropTarget(cell, plugin, (task) => combineDT(day, task.dueTime));
  }

  const fillCell = (day: string, body: HTMLElement, items: Task[], fit: ChipFit): void => {
    body.empty();
    const shown = shownChips(items.length, fit);
    const list = body.createDiv({ cls: "bt-calview-chips" });
    for (const tk of items.slice(0, shown)) renderChip(list, plugin, tk);
    if (items.length > shown) {
      const more = body.createDiv({ cls: "bt-calview-more", text: t("cal_more", items.length - shown) });
      more.onclick = (e) => {
        e.stopPropagation();
        openPopover(more, (pop) => {                       // alle Aufgaben des Tages im Popover
          pop.addClass("bt-calview-pop");
          installCheckDelegation(pop, plugin);             // Popovers hängen am Body, nicht in der View
          pop.createDiv({ cls: "bt-pop-head", text: dayTitle(day) });
          for (const tk of items) renderChip(pop, plugin, tk);
        });
      };
    }
  };

  let metrics: ChipMetrics | null = null;
  let fit: ChipFit | null = null;
  let last: Map<string, Task[]> = new Map();

  /** Passende Chip-Zahl für die aktuelle Zellenhöhe. Ohne Höhe (View noch nicht sichtbar) oder ohne
   *  Aufgabe zum Messen bleibt es beim Notnagel – der ResizeObserver zieht nach, sobald es liegt. */
  const currentFit = (): ChipFit => {
    const sample = firstTask(last);
    if (sample && !metrics) metrics = measureChips(grid, plugin, sample);
    const avail = cells[0]?.body.clientHeight ?? 0;   // Body füllt die Zelle -> das IST der freie Platz
    if (!metrics || avail <= 0) return CHIPS_UNMEASURED;
    return chipsThatFit(avail, metrics);
  };

  const draw = (): void => {
    fit = currentFit();
    for (const { day, body } of cells) fillCell(day, body, sortDay(last.get(day) ?? []), fit);
  };

  // Zellenhöhe ändert sich mit dem Fenster, der Sidebar und der Zoomstufe – ohne Datenänderung.
  // Neu gezeichnet wird nur, wenn sich die Chip-Zahl dadurch wirklich ändert (Resize feuert je Frame).
  const ro = new ResizeObserver(() => {
    if (!grid.isConnected) { ro.disconnect(); return; }   // Raster weg (Neuaufbau/Pane zu) -> Schluss
    const next = currentFit();
    if (!fit || next.all !== fit.all || next.some !== fit.some) draw();
  });
  ro.observe(grid);

  return (buckets) => {
    last = buckets;
    draw();
  };
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

// ── Zeitraster: Woche (7 Spalten) und Tag (1 Spalte) ───────────────────────────
function renderTimeGrid(root: HTMLElement, plugin: BeautyTasksPlugin,
  days: string[], today: string, add: CalendarAdd): (b: Map<string, Task[]>) => void {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-week" + (days.length === 1 ? " bt-calview-day" : "") });
  // Gescrollt wird der GANZE Wochenblock (wrap), nicht nur das Zeitraster: hätte das Raster eine
  // eigene Scrollbar, wären seine 7 Spalten um die Scrollbar-Breite schmaler als die Spalten in
  // Kopf-/Ganztägig-Zeile – die senkrechten Linien träfen sich nicht. Kopf + Ganztägig bleiben
  // stattdessen als sticky Block oben stehen.
  const top = wrap.createDiv({ cls: "bt-calview-week-top" });

  // Kopfzeile: leere Gutter-Spalte + Tagesköpfe
  const head = top.createDiv({ cls: "bt-calview-week-head" });
  head.createDiv({ cls: "bt-calview-gutter" });
  for (const day of days) {
    const d = head.createDiv({ cls: "bt-calview-dayhead" + (day === today ? " is-today" : "") });
    d.createSpan({ cls: "bt-calview-dayhead-wd", text: weekdayShort(parseISO(day).getDay()) });
    d.createSpan({ cls: "bt-calview-dayhead-num", text: String(parseISO(day).getDate()) });
    d.onclick = () => plugin.openNewTaskOn(day, null, add.project ?? undefined, add.label);
  }

  // Ganztägig-Zeile: alles ohne Uhrzeit. Drop hierher entfernt eine gesetzte Uhrzeit.
  // Beschriftung nur für Screenreader – sichtbar bleibt die Gutter-Spalte leer.
  const allday = top.createDiv({ cls: "bt-calview-allday", attr: { "aria-label": t("cal_allday") } });
  allday.createDiv({ cls: "bt-calview-gutter" });
  const alldayCells = new Map<string, HTMLElement>();
  for (const day of days) {
    const cell = allday.createDiv({ cls: "bt-calview-allday-cell" + (day === today ? " is-today" : "") });
    alldayCells.set(day, cell);
    dropTarget(cell, plugin, () => day);                   // ohne Zeitanteil = ganztägig
  }

  // Zeitraster: Stunden links, Tagesspalten mit absolut positionierten Blöcken.
  const gridWrap = wrap.createDiv({ cls: "bt-calview-timegrid" });
  gridWrap.style.setProperty("--bt-hour", HOUR_PX + "px");   // Stundenhöhe für das Gradient-Raster
  const gutter = gridWrap.createDiv({ cls: "bt-calview-gutter bt-calview-hours" });
  for (let h = 0; h < 24; h++) {
    const row = gutter.createDiv({ cls: "bt-calview-hour" });
    row.style.height = HOUR_PX + "px";
    if (h) row.createSpan({ text: z(h) + ":00" });          // 00:00 nicht beschriften (Kante)
  }

  const cols = new Map<string, HTMLElement>();
  for (const day of days) {
    const col = gridWrap.createDiv({ cls: "bt-calview-daycol" + (day === today ? " is-today" : "") });
    col.style.height = 24 * HOUR_PX + "px";
    // Die Stundenlinien sind ein CSS-Gradient, KEINE Elemente (sonst 23 × 7 = 161 Knoten je Zeichnung).
    if (day === today) {
      const now = new Date();
      const nowLine = col.createDiv({ cls: "bt-calview-now" });
      nowLine.style.top = ((now.getHours() * 60 + now.getMinutes()) / 60) * HOUR_PX + "px";
    }
    // Klick auf freie Fläche: neue Aufgabe mit der Uhrzeit des Slots.
    col.onclick = (e) => {
      if (e.target !== col) return;                        // nur die freie Fläche, nicht ein Block
      plugin.openNewTaskOn(day, hhmm(snap(yToMin(e.clientY, col))), add.project ?? undefined, add.label);
    };
    dropTarget(col, plugin, (_task, ev) => combineDT(day, hhmm(snap(yToMin(ev.clientY, col)))));
    attachGhost(col, plugin);                              // Live-Vorschau beim Ziehen
    cols.set(day, col);
  }

  // Startansicht bei 07:00 (früher = hoch scrollen, später = runter). Erst NACH dem Layout setzen:
  // direkt nach dem Erzeugen hat der Block noch keine Höhe, scrollTop würde auf 0 geklemmt.
  window.setTimeout(() => { if (wrap.isConnected) wrap.scrollTop = DAY_START_HOUR * HOUR_PX; }, 0);

  // Füller: nur Ganztägig-Chips und Zeitblöcke – Gerüst, Stundenraster und Scrollposition bleiben.
  return (buckets) => {
    for (const day of days) {
      const dayTasks = sortDay(buckets.get(day) ?? []);

      const cell = alldayCells.get(day)!;
      cell.empty();
      for (const tk of allDayOf(dayTasks)) renderChip(cell, plugin, tk);

      const col = cols.get(day)!;
      for (const old of Array.from(col.children)) {
        if (old.hasClass("bt-calview-block")) old.remove();   // Jetzt-Linie bleibt stehen
      }
      for (const b of layoutDay(dayTasks)) {
        const el = col.createDiv({ cls: "bt-calview-block" });
        const h = Math.max(18, ((b.endMin - b.startMin) / 60) * HOUR_PX - 2);
        el.style.top = (b.startMin / 60) * HOUR_PX + "px";
        el.style.height = h + "px";
        el.style.left = `calc(${(b.col / b.cols) * 100}% + 2px)`;
        el.style.width = `calc(${(1 / b.cols) * 100}% - 4px)`;
        // Flacher Block (30 min = eine Zeile hoch): NUR der Titel. Die Uhrzeit steht ohnehin an
        // der Position im Raster – eine zweite Zeile würde den Titel verdrängen.
        const compact = h < TWO_LINE_PX;
        if (compact) el.addClass("is-compact");
        decorate(el, plugin, b.task);
        renderCheck(el, plugin, b.task, { compact: true });
        const inner = el.createDiv({ cls: "bt-calview-block-in" });
        inner.createDiv({ cls: "bt-calview-block-title", text: b.task.title });
        if (!compact) inner.createDiv({ cls: "bt-calview-block-time", text: span(b.startMin, b.endMin) });
        dragSource(el, b.task);
        // Griff am unteren Rand: zieht die Dauer auf (rundet auf 15 min, Minimum 15 min).
        const grip = el.createDiv({ cls: "bt-calview-resize" });
        grip.onmousedown = (ev) => startResize(ev, el, b.task, b.startMin, plugin);
      }
    }
  };
}

/** Seitenleiste „Undatiert": baut das Gerüst und liefert den Füller für die Kartenliste.
 *  Von hier per Drag ins Raster; der Drop setzt `due` – die Aufgabe verschwindet dann aus der Liste. */
function renderUnscheduled(body: HTMLElement, plugin: BeautyTasksPlugin, add: CalendarAdd): (tasks: Task[]) => void {
  const panel = body.createDiv({ cls: "bt-calview-panel" });
  // Rückweg: eine Aufgabe aus dem Raster HIERHIN ziehen entfernt ihr Datum (setTaskDate löscht das
  // Frontmatter-Feld bei leerem Wert). Das Ziel ist der ganze Panel-Rahmen, nicht nur die Liste –
  // sonst ginge der Drop ins Leere, solange nichts undatiert ist. Die Uhrzeit verschwindet mit dem
  // Datum: beides liegt im selben Feld, und eine Uhrzeit ohne Tag ergibt keinen Sinn.
  dropTarget(panel, plugin, () => "");
  const head = panel.createDiv({ cls: "bt-calview-panel-head" });
  head.createSpan({ cls: "bt-calview-panel-title", text: t("cal_unscheduled") });
  const count = head.createSpan({ cls: "bt-calview-panel-count" });
  const list = panel.createDiv({ cls: "bt-calview-panel-list" });

  const addEl = panel.createDiv({ cls: "bt-calview-panel-add" });
  setIcon(addEl.createSpan({ cls: "bt-calview-panel-add-ic" }), "plus");
  addEl.createSpan({ text: t("btn_add_task") });
  // Ohne Datum anlegen – die Aufgabe landet genau hier und wird später eingeplant.
  addEl.onclick = () => plugin.openNewTask(add.project ?? undefined, add.label);

  return (tasks: Task[]): void => {
    count.setText(String(tasks.length));
    list.empty();
    if (!tasks.length) {
      list.createDiv({ cls: "bt-calview-panel-empty", text: t("cal_unscheduled_empty") });
      return;
    }
    for (const tk of [...tasks].sort((a, b) => a.title.localeCompare(b.title))) {
      const card = list.createDiv({ cls: "bt-calview-panel-card" });
      decorate(card, plugin, tk);
      renderCheck(card, plugin, tk, { compact: true });
      const inner = card.createDiv({ cls: "bt-calview-panel-card-in" });
      inner.createSpan({ cls: "bt-calview-panel-card-title", text: tk.title });
      const proj = tk.project ? projectBase(tk.project) : null;
      if (proj) inner.createSpan({ cls: "bt-calview-panel-card-proj", text: "@" + proj });
      dragSource(card, tk);
    }
  };
}

const projectBase = (p: string): string => p.split("/").pop()!.replace(/\.md$/, "");

/** Y-Position (Viewport) -> Minuten seit Mitternacht in dieser Tagesspalte.
 *  `top` = bereits gemessene Oberkante. Im dragover MUSS der gemerkte Wert benutzt werden:
 *  getBoundingClientRect() ist ein Layout-Read und würde – direkt nach dem Schreiben des Geistes –
 *  bei jeder Mausbewegung einen vollständigen Reflow erzwingen (Layout-Thrashing). */
function yToMin(clientY: number, col: HTMLElement, top?: number): number {
  const t = top ?? col.getBoundingClientRect().top;
  return ((clientY - t) / HOUR_PX) * 60;
}

/** Dauer per Maus ziehen. Bewusst Maus-Events (kein HTML5-Drag): das liefert stetige Positionen. */
function startResize(e: MouseEvent, el: HTMLElement, task: Task, startMin: number,
  plugin: BeautyTasksPlugin): void {
  e.preventDefault(); e.stopPropagation();
  const col = el.parentElement!;
  const doc = el.ownerDocument;
  let minutes = Math.max(MIN_DUR, (task.duration ?? 30));
  const onMove = (ev: MouseEvent): void => {
    minutes = Math.max(MIN_DUR, snap(yToMin(ev.clientY, col)) - startMin);
    const h = Math.max(18, (minutes / 60) * HOUR_PX - 2);
    el.style.height = h + "px";
    el.toggleClass("is-compact", h < TWO_LINE_PX);   // beim Aufziehen sofort zweizeilig werden
  };
  const onUp = (): void => {
    doc.removeEventListener("mousemove", onMove);
    doc.removeEventListener("mouseup", onUp);
    if (minutes !== task.duration) void plugin.setTaskDuration(task, minutes);   // Index zeichnet neu (s. dropTarget)
  };
  doc.addEventListener("mousemove", onMove);
  doc.addEventListener("mouseup", onUp);
}

// ── Chips, Drag & Drop ─────────────────────────────────────────────────────────
/** Kompakter Aufgaben-Chip (Monatszelle, Ganztägig-Zeile, „+N“-Popover). */
function renderChip(parent: HTMLElement, plugin: BeautyTasksPlugin, task: Task): void {
  const chip = parent.createDiv({ cls: "bt-calview-chip" });
  decorate(chip, plugin, task);
  renderCheck(chip, plugin, task, { compact: true });   // Klick = erledigt, Rechtsklick = Status-Menü
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

/**
 * Einrast-Vorschau beim Ziehen über eine Tagesspalte (das Google-Calendar-Gefühl): ein Geisterblock
 * in der Höhe der gezogenen Aufgabe, der ins 15-Minuten-Raster springt und die Zielzeit anzeigt.
 * Ohne ihn sieht man erst NACH dem Loslassen, wo die Aufgabe gelandet ist.
 *
 * dragover feuert bei jeder Mausbewegung – deshalb wird der Geist nur bewegt, nicht neu gebaut,
 * und nur dann angefasst, wenn sich die gerastete Minute tatsächlich geändert hat.
 */
function attachGhost(col: HTMLElement, plugin: BeautyTasksPlugin): void {
  let ghost: HTMLElement | null = null;
  let lastMin = -1;
  let colTop = 0;                                     // Spalten-Oberkante, EINMAL je Drag gemessen
  const remove = (): void => { ghost?.remove(); ghost = null; lastMin = -1; };

  col.addEventListener("dragenter", () => { colTop = col.getBoundingClientRect().top; });
  col.addEventListener("dragover", (e) => {
    if (!dragPath) return;
    const task = plugin.index.get(dragPath);
    if (!task) return;
    if (!ghost) {
      colTop = col.getBoundingClientRect().top;       // Sicherheitsnetz, falls dragenter ausblieb
      ghost = col.createDiv({ cls: "bt-calview-ghost" });
      // Höhe steht für den ganzen Drag fest (die Dauer ändert sich beim Ziehen nicht) -> einmal setzen.
      const dur = task.duration && task.duration > 0 ? task.duration : DEFAULT_BLOCK_MIN;
      ghost.style.height = Math.max(18, (dur / 60) * HOUR_PX - 2) + "px";
      ghost.dataset.dur = String(dur);
    }
    const start = snap(yToMin(e.clientY, col, colTop));
    if (start === lastMin) return;                    // gleiche Rasterstufe -> nichts zu tun
    lastMin = start;
    // Bewegen per transform, NICHT über top: transform läuft im Compositor und löst weder Layout
    // noch Repaint der Spalte aus. Über `top` müsste der Browser bei jeder 15-Minuten-Stufe die
    // gesamte (1440 px hohe, voll besetzte) Tagesspalte neu umbrechen – genau das ruckelt.
    ghost.style.transform = `translateY(${(start / 60) * HOUR_PX}px)`;
    const end = Math.min(start + Number(ghost.dataset.dur), 1440);
    ghost.dataset.time = span(start, end);            // Zielzeit im Geist (CSS ::before)
  });
  col.addEventListener("dragleave", (e) => { if (!col.contains(e.relatedTarget as Node | null)) remove(); });
  col.addEventListener("drop", remove);
  col.addEventListener("dragend", remove);
}

/** Drop-Ziel: `dueOf` liefert den neuen due-Wert („YYYY-MM-DD“ oder mit „THH:mm“). */
function dropTarget(el: HTMLElement, plugin: BeautyTasksPlugin,
  dueOf: (task: Task, ev: DragEvent) => string): void {
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
    // KEIN redraw() hier: setTaskDate schreibt ins Frontmatter, der Index meldet das und zeichnet
    // die Views ohnehin neu. Ein zusätzlicher Aufruf hieße ZWEI vollständige Neuzeichnungen –
    // im Profil ~330 ms Einfrieren nach dem Loslassen statt ~210 ms.
    void plugin.setTaskDate(task, "due", next);
  });
}
