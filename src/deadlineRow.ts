import { Platform, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { renderCheck, installCheckDelegation } from "./taskCheck";
import { openPopover } from "./popover";
import { combineDT, formatDateTime, dueWhen } from "./format";
import { t } from "./i18n";

/**
 * Der Deadline-Hinweis – EINE Quelle für Liste (heuteView) und Kalender (calendarView).
 *
 * Er steckt wie renderCheck in einer eigenen Datei, weil beide Views ihn brauchen und ein
 * gegenseitiger Import einen Zyklus ergäbe.
 *
 * Modell (wie Todoist): Die Deadline verdoppelt die Aufgabe NICHT. Sie erscheint an ihrem Tag als
 * eigener, NICHT abhakbarer Eintrag mit Uhr-Symbol, der auf die Aufgabe zeigt. Wer ihn überfährt,
 * bekommt die echte Aufgabenzeile mit funktionierender Checkbox eingeblendet und kann von dort
 * abhaken oder zur Aufgabe springen. WELCHE Deadlines in einem Abschnitt einen solchen Eintrag
 * bekommen, entscheidet deadlineMarkers() in filterEngine.ts – nicht diese Datei.
 */

/** Offenes Aufklapp-Feld: das Element UND sein close() aus openPopover. Das close() ist wichtig –
 *  ein blosses remove() liesse dessen Dokument-/Resize-Listener zurueck. */
interface Panel { el: HTMLElement; close: () => void; }

/** Aufklapp-Feld: die echte Aufgabenzeile mit Checkbox. Bewusst schlank nachgebaut statt
 *  renderTask zu importieren – das lebt in heuteView und ergäbe genau den Zyklus, den diese
 *  Datei vermeidet. Die Checkbox ist die ECHTE (renderCheck + Delegation), also voll bedienbar. */
function openPanel(anchor: HTMLElement, plugin: BeautyTasksPlugin, task: Task, today: string, onClose: () => void): Panel | null {
  let panel: Panel | null = null;
  openPopover(anchor, (pop, close) => {
    panel = { el: pop, close };
    pop.addClass("bt-dl-panel");
    installCheckDelegation(pop, plugin);        // Popover hängt am Body, nicht in der View
    const row = pop.createDiv({ cls: "bt-dl-panel-row" });
    renderCheck(row, plugin, task);
    const body = row.createDiv({ cls: "bt-dl-panel-body" });
    const title = body.createDiv({ cls: "bt-dl-panel-title", text: task.title });
    if (task.due) {
      const when = dueWhen(task.due, today);
      const d = body.createDiv({ cls: "bt-dl-panel-due", text: formatDateTime(combineDT(task.due, task.dueTime), today) });
      d.dataset.when = when;
    }
    // Titel anklicken = zur Aufgabe wechseln (die Checkbox links hakt ab, ohne zu wechseln).
    title.onclick = (e) => { e.stopPropagation(); close(); plugin.openEditTask(task); };
  }, onClose);
  return panel;
}

/**
 * Einen Deadline-Hinweis zeichnen. `compact` = kleinere Variante für den Kalender.
 *
 * Desktop: Klick öffnet die Aufgabe, Überfahren blendet nach kurzer Verzögerung das Feld ein.
 * Mobile: Es gibt kein Hovern – dort öffnet das erste Tippen das Feld, und darin führt ein
 * Tippen auf den Titel zur Aufgabe (die Checkbox hakt direkt ab).
 */
export function renderDeadlineRow(parent: HTMLElement, plugin: BeautyTasksPlugin, task: Task, today: string,
  opts: { compact?: boolean } = {}): HTMLElement {
  const row = parent.createDiv({
    cls: "bt-deadline-row" + (opts.compact ? " bt-deadline-sm" : ""),
    attr: { role: "button", tabindex: "0", "aria-label": t("deadline_aria", task.title) },
  });
  // BEWUSST OHNE data-path: darauf greift die Delegation des Zeilen-Kontextmenüs (taskMenu.ts),
  // und dessen Aktionen (Datum setzen, löschen …) gehören einer echten Aufgabenzeile, nicht einem
  // Verweis darauf.
  if (task.scheduled) row.dataset.when = dueWhen(task.scheduled, today);   // tagesgenau wie der Datums-Chip
  setIcon(row.createSpan({ cls: "bt-deadline-ic" }), "clock");             // dasselbe Zeichen wie der Deadline-Chip
  row.createSpan({ cls: "bt-deadline-title", text: task.title });
  if (task.scheduledTime) row.createSpan({ cls: "bt-deadline-time", text: task.scheduledTime });

  // ── Aufklapp-Feld ──
  let openTimer: number | null = null;
  let closeTimer: number | null = null;
  let panel: Panel | null = null;
  const clearTimers = (): void => {
    if (openTimer !== null) { window.clearTimeout(openTimer); openTimer = null; }
    if (closeTimer !== null) { window.clearTimeout(closeTimer); closeTimer = null; }
  };
  const scheduleHide = (): void => {
    if (closeTimer !== null) window.clearTimeout(closeTimer);
    // Kurze Gnadenfrist: zwischen Zeile und Feld liegt eine Lücke, über die die Maus wandert.
    closeTimer = window.setTimeout(() => {
      closeTimer = null;
      if (panel && !panel.el.matches(":hover") && !row.matches(":hover")) panel.close();
    }, 160);
  };
  const show = (): void => {
    // Die Zeile kann zwischen Hover und Timerablauf neu gezeichnet worden sein – dann hinge das
    // Feld an einem gelösten Element und positionierte sich ins Leere.
    if (!row.isConnected || panel) return;
    panel = openPanel(row, plugin, task, today, () => { panel = null; });
    // Wandert die Maus INS Feld, darf es nicht schließen; verlässt sie es, schließt es wie die Zeile.
    panel?.el.addEventListener("mouseenter", () => { if (closeTimer !== null) { window.clearTimeout(closeTimer); closeTimer = null; } });
    panel?.el.addEventListener("mouseleave", () => scheduleHide());
  };

  if (!Platform.isMobile) {
    row.addEventListener("mouseenter", () => {
      if (closeTimer !== null) { window.clearTimeout(closeTimer); closeTimer = null; }
      if (openTimer === null && !panel) openTimer = window.setTimeout(() => { openTimer = null; show(); }, 200);
    });
    row.addEventListener("mouseleave", () => {
      if (openTimer !== null) { window.clearTimeout(openTimer); openTimer = null; }
      scheduleHide();
    });
  }

  const activate = (): void => {
    clearTimers();
    if (Platform.isMobile) { if (panel) panel.close(); else show(); return; }
    plugin.openEditTask(task);
  };
  row.onclick = (e) => { e.stopPropagation(); activate(); };
  row.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); } };
  return row;
}
