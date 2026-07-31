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
