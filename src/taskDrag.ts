/**
 * Der EINE laufende Aufgaben-Zug.
 *
 * Bis 1.33 hielten heuteView.ts (Liste + Board + Seitenleiste) und calendarView.ts jeweils ein
 * EIGENES `dragPath`. Das fiel nie auf, weil Liste und Kalender zwei Layouts DERSELBEN Seite sind
 * und nie gleichzeitig auf dem Bildschirm standen. Mit dem Planungs-Split stehen sie es – und dann
 * zeigte sich die Folge: Der Kalender bewacht sein `dragover` mit „läuft gerade ein eigener Zug?",
 * fragte dafür aber seine eigene Variable, die bei einem Zug aus der Liste leer blieb. Die Zeile
 * ließ sich anfassen, das Raster nahm sie nicht an – obwohl der Drop-Handler den Pfad aus
 * `dataTransfer` längst hätte verarbeiten können.
 *
 * Deshalb liegt der Zustand jetzt hier, einmal für alle Ansichten. Es gibt genau einen Mauszeiger,
 * also immer höchstens einen laufenden Zug – auch wenn er in einem anderen Tab endet als er begann
 * (das Ziel sucht die Aufgabe über ihren Pfad im Index, nicht über die Quell-Liste).
 */

import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { isInboxLink, baseName } from "./taskService";

let path: string | null = null;
let fromCol: string | null = null;

/** Läuft gerade ein Zug mit einer unserer Aufgaben? Pfad, sonst null. Damit unterscheiden alle
 *  Abwurfziele unseren Zug von einem fremden (Datei aus dem Vault, Text aus dem Editor). */
export const dragTask = (): string | null => path;

/** Quell-Spalte des laufenden Zugs (Status-ID bzw. Label) – nur das Board braucht sie für die
 *  Swap-Semantik: welches Label hat die Karte hierher gebracht. Null bei jedem anderen Zug. */
export const dragFromCol = (): string | null => fromCol;

/** Zug beginnt. `col` NUR von Board-Karten; sonst wird sie ausdrücklich geleert, damit kein Wert
 *  aus einem früheren Board-Zug in einen Zug aus Liste oder Kalender hineinwirkt. */
export function startTaskDrag(taskPath: string, col: string | null = null): void {
  path = taskPath;
  fromCol = col;
}

/** Zug endet – egal ob per Drop, per Escape oder durch Loslassen im Nirgendwo. */
export function endTaskDrag(): void {
  path = null;
  fromCol = null;
}

/**
 * Die Dimension der SEITE, in die abgeworfen wurde – Projekt bzw. Label.
 * `project: undefined` = die Seite hat gar keine (Heute, Demnächst, Filter), `null` = der Eingang.
 * Dasselbe Objekt, das „+ Aufgabe hinzufügen" schon benutzt (BoardAdd/CalendarAdd).
 */
export interface DropPage { project?: string | null; label?: string }

/**
 * Eine hereingezogene Aufgabe der Seite zuschlagen, in der sie gelandet ist.
 *
 * Warum das überhaupt nötig ist: Kalender und Board schrieben bisher NUR die Dimension der Zelle
 * (Datum bzw. Status) – und das reichte, solange sie ein Layout DERSELBEN Seite waren wie die
 * Liste, aus der gezogen wurde. Die Aufgabe gehörte per Konstruktion schon hierher. Mit dem
 * Planungs-Split stimmt das nicht mehr: Wer aus der Liste von Projekt A in den Kalender von
 * Projekt B zieht, bekam ein neues Datum, aber die Aufgabe blieb in A – und war damit nirgends
 * mehr zu sehen. Eine Änderung, deren Ergebnis man nicht findet, ist schlimmer als keine.
 *
 * Die Bedeutung ist dieselbe wie beim Ziehen auf einen SEITENLEISTEN-Eintrag, die es im Plugin
 * schon gibt: Projekt verschiebt (eine Aufgabe hat genau eine Liste), Label ergänzt (sie kann
 * mehrere tragen), Eingang nimmt das Projekt weg. Der Kalender einer Projektseite ist nichts
 * anderes als dieser Eintrag in groß.
 *
 * Schreibt NUR, wenn sich wirklich etwas ändert – ein Zug innerhalb derselben Seite (der Normalfall)
 * fasst die Notiz nicht an.
 */
export async function applyDropPage(plugin: BeautyTasksPlugin, task: Task, page: DropPage): Promise<void> {
  if (page.label && !task.labels.includes(page.label)) await plugin.swapTaskLabel(task, null, page.label);
  if (page.project === undefined) return;                    // Seite ohne Projekt-Dimension
  // Eingang und „gar kein Projekt" sind derselbe Zustand (null) – so trifft der Vergleich unten
  // auch den Fall „liegt schon im Eingang, wurde in den Eingang gezogen".
  const cur = task.project && !isInboxLink(task.project) ? baseName(task.project) : null;
  if (cur === page.project) return;
  await plugin.setTaskProject(task, page.project);           // null = Projekt entfernen (Eingang)
}
