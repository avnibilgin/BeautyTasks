import { Task } from "./types";
import { isTrashed } from "./statuses";
import { visibleRows } from "./filterEngine";

/**
 * Die Signaturen des inkrementellen Nachzeichnens (s. tryPatchList in heuteView).
 *
 * Sie beantworten EINE Frage: „Sieht diese Sektion noch genauso aus wie beim letzten Zeichnen?"
 * Lautet die Antwort fälschlich ja, bleiben veraltete Zeilen stehen – der Nutzer ändert etwas
 * und die Oberfläche reagiert nicht. Das ist die gefährlichste Fehlerklasse des ganzen
 * Patch-Pfades, und genau deshalb liegt die Berechnung hier: rein, ohne DOM, ohne App – und
 * damit prüfbar (s. tests/rowSignature.test.ts, das jedes Feld von Task durchgeht).
 *
 * Die Regel für alles hier: lieber zu viel abdecken als zu wenig. Ein überflüssiger Neuaufbau
 * kostet Millisekunden, ein übersehenes Feld kostet Vertrauen.
 */

/** Trennzeichen zwischen den Feldern. Ein Steuerzeichen, das in Aufgabentexten nicht vorkommt. */
const SEP = "\u001f";

/** Was die Signatur über die Aufgabe hinaus braucht. Als Funktionen hereingereicht, damit
 *  weder Index noch View hier hereinragen. */
export interface SigLookup {
  /** Titel einer Aufgabe – die Zeile zeigt den ihrer Elternaufgabe als Verweis. */
  title(path: string): string | undefined;
  /** Anzahl der Kommentare/Anhänge – steht als Chip in der Zeile. */
  comments(path: string): number;
  /** Direkte Unteraufgaben – sie werden unter der Zeile mitgezeichnet. */
  children(path: string): Task[];
  /** Ist die Aufgabe aufgeklappt? Der Klick aufs Badge ändert NUR das, keine Daten. */
  expanded(path: string): boolean;
}

/**
 * Alles, was das Aussehen EINER Zeile bestimmt.
 *
 * Wer hier ein Feld ergänzt, das die Zeile zeigt, muss es aufnehmen. Der Test dazu geht jedes
 * Feld von `Task` einzeln durch und verlangt eine bewusste Entscheidung – ein neues Feld fällt
 * dort auf, statt still zu einer „reagiert nicht"-Meldung zu werden.
 */
export function rowSig(t: Task, look: SigLookup): string {
  return [
    t.path, t.status, t.priority, t.title, t.description,
    t.due ?? "", t.dueTime ?? "", t.duration ?? "", t.scheduled ?? "", t.scheduledTime ?? "", t.start ?? "",
    t.recurrence ?? "", t.recurBasis, t.reminders.join(","), t.labels.join(","), t.sortOrder ?? "",
    // Das Projekt gehört DAZU: Die Zeile zeigt es als @Backlink. Ohne dieses Feld galt eine in ein
    // anderes Projekt gezogene Aufgabe als unverändert – auf einer Projektseite fiel sie wenigstens
    // aus der Menge und die Sektion zeichnete neu, auf Filter- und Label-Seiten blieb sie stehen
    // und trug weiter das alte Projekt. Der Zug hatte funktioniert, nur die Zeile log.
    t.project ?? "",
    t.parent ?? "", t.parent ? (look.title(t.parent) ?? "") : "",
    // Zeitstempel der Übergänge: Sie ordnen die Erledigt-/Papierkorb-Sektionen und sind der
    // einzige sichtbare Unterschied, wenn sich sonst nichts an der Aufgabe ändert.
    t.completed ?? "", t.cancelled ?? "",
    look.comments(t.path),
    // Mit Trennzeichen verbunden statt stumpf aneinandergehängt: Sonst ergäben Titel "ab"
    // mit Beschreibung "c" und Titel "a" mit Beschreibung "bc" dieselbe Signatur.
  ].join(SEP);
}

/**
 * Signatur einer Sektion: über ihre sichtbaren Zeilen UND deren Unterbaum – verschachtelte
 * Zeilen gehören zur Sektion, auch wenn sie nicht in `tasks` stehen.
 *
 * Der Unterbaum wird bewusst OHNE Rücksicht darauf durchlaufen, ob er gerade aufgeklappt ist:
 * Die Menge ist damit eher zu groß als zu klein. Der Klappzustand selbst steht trotzdem je
 * Aufgabe drin – das Badge klappt um, ohne dass sich an den Daten etwas ändert.
 */
export function sectionSig(tasks: Task[], look: SigLookup, opts: { present?: Set<string>; ownRow?: (t: Task) => boolean; trash?: boolean } = {}): string {
  const top = opts.trash ? tasks : visibleRows(tasks, opts.present, opts.ownRow);
  const seen = new Set<string>();
  const parts: string[] = [];
  const walk = (tk: Task): void => {
    if (seen.has(tk.path)) return;   // Schutz gegen einen von Hand gebauten Zyklus
    seen.add(tk.path);
    parts.push(rowSig(tk, look), look.expanded(tk.path) ? "+" : "-");
    for (const kid of look.children(tk.path)) if (!isTrashed(kid.status)) walk(kid);
  };
  for (const tk of top) walk(tk);
  return parts.join(SEP);
}
