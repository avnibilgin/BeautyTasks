import { setIcon, Menu } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { t } from "./i18n";
import { allStatuses, isDone, statusColor, statusIcon, statusLabel, statusTint, firstOpenStatus } from "./statuses";

/**
 * Die Aufgaben-Checkbox – EINE Quelle für Liste, Kanban und Kalender.
 *
 * Sie steckt hier und nicht in heuteView.ts, weil calendarView.ts sie ebenfalls braucht und ein
 * gegenseitiger Import der beiden Views einen Zyklus ergäbe.
 *
 * Verhalten überall gleich: Klick erledigt (⇄ offen), Rechtsklick/Long-Press öffnet das Status-Menü.
 */

/** Checkbox zeichnen (Zustand, Status-Icon, Prioritäts-Ring) und verdrahten.
 *  `compact` = kleinere Variante für Kalender-Chips und flache Zeitblöcke. */
export function renderCheck(parent: HTMLElement, _plugin: BeautyTasksPlugin, task: Task,
  opts: { trash?: boolean; compact?: boolean } = {}): HTMLElement {
  const check = parent.createDiv({ cls: "bt-check" + (opts.compact ? " bt-check-sm" : "") });
  if (opts.trash) {
    check.addClass("bt-check-x"); setIcon(check, "x");     // Papierkorb: × im Kreis (nicht klickbar)
    return check;
  }
  check.dataset.check = task.path;   // Kennung für die Delegation (s. installCheckDelegation)
  if (isDone(task.status)) {
    check.addClass("is-done");
    const c = statusColor(task.status);
    if (c) { check.style.backgroundColor = c; check.style.borderColor = c; }   // eigene Farbe, sonst Default-Grau
  } else {
    // Jede offene Phase außer der ersten (To-Do = leerer Kreis) zeigt ihr Icon in ihrer Farbe.
    if (task.status !== firstOpenStatus()) {
      check.addClass("bt-check-status");
      setIcon(check, statusIcon(task.status));
      check.style.setProperty("--bt-status-col", statusTint(task.status));
    } else {
      const c = statusColor(task.status);
      if (c) check.style.borderColor = c;   // To-Do: Ring nur tönen, wenn eine eigene Farbe gesetzt ist
    }
    // Priorität als farbiger Ring: höchste=rot, hoch=orange, mittel=blau; normal/niedrig neutral.
    if (task.priority === "highest" || task.priority === "high" || task.priority === "medium") check.dataset.prio = task.priority;
  }
  return check;
}

/**
 * Event-Delegation: EIN Satz Listener am Container statt sechs je Checkbox.
 *
 * Vorher registrierte jede Checkbox click + contextmenu + vier Touch-Events. Bei 139 Checkboxen
 * (Kalender-Woche) sind das 834 addEventListener JE Neuzeichnung, in der Liste mit 262 Aufgaben
 * über 1500 – gemessen ein spürbarer Teil der Renderzeit. Die Checkbox trägt jetzt nur noch
 * data-check="<pfad>"; die Aktion findet der Container über das Ziel des Events.
 *
 * Einmal je View aufrufen (onOpen), NICHT je Zeichnung: der Container überlebt das Neuzeichnen.
 *
 * WICHTIG – capture: true. Die Checkbox ist ein KIND der Task-Zeile bzw. des Kalender-Blocks, und
 * die haben ein eigenes onclick (Aufgabe öffnen) mit stopPropagation(). In der Bubble-Phase würde
 * der Klick dort abgefangen und käme hier nie an. In der Capture-Phase läuft dieser Handler zuerst;
 * sein stopPropagation() verhindert dann, dass zusätzlich das Modal aufgeht.
 */
export function installCheckDelegation(root: HTMLElement, plugin: BeautyTasksPlugin): void {
  const taskOf = (e: Event): Task | null => {
    const el = (e.target as HTMLElement | null)?.closest<HTMLElement>(".bt-check[data-check]");
    if (!el) return null;
    return plugin.index.get(el.dataset.check!) ?? null;
  };

  let longFired = false;
  root.addEventListener("click", (e) => {
    const task = taskOf(e);
    if (!task) return;
    e.stopPropagation();                            // kein zusätzliches Öffnen der Aufgabe
    if (longFired) { longFired = false; return; }   // Long-Press hat das Menü schon geöffnet
    void plugin.toggleDone(task);
  }, true);
  root.addEventListener("contextmenu", (e) => {
    const task = taskOf(e);
    if (!task) return;
    e.preventDefault(); e.stopPropagation();
    showStatusMenu(plugin, task, e.clientX, e.clientY);
  }, true);

  // Touch: Long-Press (~500 ms) öffnet dasselbe Menü (auf Mobile gibt es keinen Rechtsklick).
  let timer: number | null = null;
  const clear = (): void => { if (timer !== null) { window.clearTimeout(timer); timer = null; } };
  root.addEventListener("touchstart", (e) => {
    const task = taskOf(e);
    if (!task) return;
    const p = e.touches[0];
    const x = p.clientX, y = p.clientY;
    longFired = false;
    timer = window.setTimeout(() => { timer = null; longFired = true; showStatusMenu(plugin, task, x, y); }, 500);
  }, { passive: true, capture: true });
  root.addEventListener("touchend", clear);
  root.addEventListener("touchmove", clear);
  root.addEventListener("touchcancel", clear);
}

/** Status-Kontextmenü der Checkbox: To-Do · In Arbeit · Erledigt · (Abbrechen → Papierkorb).
 *  Setzt den Status live (setTaskStatus kümmert sich um Zeitstempel/Wiederholung). */
export function showStatusMenu(plugin: BeautyTasksPlugin, task: Task, x: number, y: number): void {
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
