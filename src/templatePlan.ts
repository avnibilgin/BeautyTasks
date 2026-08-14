import { addDays, dayOffset } from "./format";
import { parseReminder } from "./reminders";

/**
 * Wie eine Vorlage beim Anwenden auf neue Daten kommt.
 *
 * ── Warum die Vorlage KEINE Versätze speichert ───────────────────────────────
 * Der naheliegende Weg wäre, an jeder Vorlagen-Aufgabe „3 Tage nach Start" zu hinterlegen. Das
 * kostet ein neues Feld, eine neue Eingabe, ein neues Chip und eine neue Schreibweise in der
 * Texterkennung – und macht die Vorlagen-Notiz zu etwas, das keine Aufgabe mehr ist.
 *
 * Stattdessen trägt eine Vorlage ganz normale Kalenderdaten, und der Versatz wird beim Anwenden
 * ABGELEITET: Die Vorlage merkt sich nicht „Juni", sie merkt sich den Abstand zwischen ihren
 * Aufgaben. Damit ist eine Vorlage ein gewöhnlicher Aufgabenbaum an einem anderen Ort, sie lässt
 * sich mit dem normalen Editor bauen, und dieses Modul ist der einzige neue Rechenweg.
 *
 * ── Was der Anker bedeutet ───────────────────────────────────────────────────
 * Gefragt wird nach EINEM Datum, und zwar an einem der beiden Enden der Spanne:
 *
 *   "start" – „wann geht es los?"      Das FRÜHESTE Datum des Baums landet auf dem Anker.
 *   "end"   – „wann muss es fertig?"   Das SPÄTESTE Datum des Baums landet auf dem Anker.
 *
 * Beides ist dieselbe Verschiebung, nur von der anderen Seite gemessen. Alles andere wandert um
 * denselben Betrag mit – dadurch bleiben sämtliche Abstände erhalten, auch der zwischen Fälligkeit
 * und Deadline einer einzelnen Aufgabe. Dieselbe Zusage macht `nextInstance` in recurrence.ts
 * bereits für Wiederholungen; hier gilt sie für den ganzen Baum.
 *
 * Bewusst NICHT: ein Runden auf Wochentage. Entweder stimmt das eingegebene Anker-Datum genau,
 * oder die Wochentage bleiben – beides zugleich geht nicht, und ein Schalter, der das eingegebene
 * Datum stillschweigend um bis zu drei Tage verschiebt, verwirrt mehr, als er nützt.
 */

export type AnchorMode = "start" | "end";

/**
 * Was eine Vorlagen-Aufgabe an Datumsangaben mitbringt – die einzige Eingabe des Planers.
 * `Task` erfüllt diese Form; als eigenes Interface bleibt das Modul ohne Obsidian-Bezug und
 * damit vollständig testbar (wie planReorder, chunkPlan und collectTrashTargets).
 */
export interface DatedItem {
  path: string;
  due: string | null;         // Fälligkeit, reiner Datumsteil "YYYY-MM-DD" (Uhrzeit liegt in dueTime)
  scheduled: string | null;   // Deadline, ebenso (s. types.ts)
  reminders: string[];        // rohe Erinnerungs-Strings, s. reminders.ts
}

/** Das Ergebnis je Aufgabe. Enthält NUR die verschobenen Felder – alles Übrige der Vorlage
 *  (Titel, Priorität, Labels, Wiederholung, Unterbau) kopiert der Aufrufer unverändert. */
export interface ShiftedDates {
  due: string | null;
  scheduled: string | null;
  reminders: string[];
}

/**
 * Die Spanne des Baums: frühestes und spätestes Datum über ALLE Aufgaben.
 *
 * Gezählt werden nur `due` und `scheduled` – die Termine der Arbeit. Absolute Erinnerungen bleiben
 * bewusst außen vor: Eine Erinnerung „drei Tage vorher" darf die Spanne nicht nach vorn ziehen und
 * damit den Sinn von „Start am" verschieben. Sie wandert trotzdem mit (s. shiftReminder).
 *
 * `null` = der Baum trägt überhaupt kein Datum. Dann gibt es nichts zu verankern.
 */
export function templateSpan(items: readonly DatedItem[]): { first: string; last: string } | null {
  let first: string | null = null;
  let last: string | null = null;
  for (const it of items) {
    for (const d of [it.due, it.scheduled]) {
      if (!d) continue;
      if (first === null || d < first) first = d;
      if (last === null || d > last) last = d;
    }
  }
  return first !== null && last !== null ? { first, last } : null;
}

/**
 * Um wie viele ganze Tage wandert der Baum? `null` = gar nicht, weil er kein Datum trägt.
 *
 * Ein negativer Wert ist erlaubt und wird nicht abgefangen: Wer eine Vorlage rückwirkend anlegt,
 * meint das so. Ihn stillschweigend auf heute zu klemmen wäre eine Entscheidung, die dem Aufrufer
 * gehört und nicht dem Rechenweg.
 */
export function templateShift(items: readonly DatedItem[], anchorIso: string, mode: AnchorMode): number | null {
  const span = templateSpan(items);
  if (!span) return null;
  return dayOffset(anchorIso, mode === "start" ? span.first : span.last);
}

/**
 * Eine einzelne Erinnerung verschieben.
 *
 * Relative Erinnerungen (`-30m`, `-2d`) hängen ohnehin an der Fälligkeit und wandern mit ihr –
 * sie bleiben unangetastet. Absolute (`2026-06-14T09:00`) zeigen auf einen festen Zeitpunkt und
 * lägen nach dem Anwenden sonst in der Vergangenheit; sie bekommen dieselbe Verschiebung wie die
 * Aufgaben, damit ihre Absicht erhalten bleibt. Die Uhrzeit bleibt dabei stehen.
 *
 * Unlesbare Werte bleiben, wie sie sind: Was wir nicht verstehen, verändern wir auch nicht.
 */
export function shiftReminder(raw: string, days: number): string {
  const p = parseReminder(raw);
  if (!p || !("abs" in p)) return raw;
  return addDays(p.abs, days);
}

/**
 * Der Plan: für jede Vorlagen-Aufgabe die verschobenen Daten, nach Pfad ansprechbar.
 *
 * Aufgaben ohne Datum bleiben ohne Datum – eine Vorlage, die für einen Schritt bewusst keinen
 * Termin vorgibt, soll beim Anwenden auch keinen erfinden.
 *
 * Trägt der Baum überhaupt kein Datum (oder fehlt der Anker), wird nichts verschoben; das Ergebnis
 * gibt dann die Eingabe unverändert wieder. Der Aufrufer braucht dafür keinen Sonderfall.
 */
export function planTemplateDates(items: readonly DatedItem[], anchorIso: string | null, mode: AnchorMode): Map<string, ShiftedDates> {
  const shift = anchorIso ? templateShift(items, anchorIso, mode) : null;
  const out = new Map<string, ShiftedDates>();
  for (const it of items) {
    out.set(it.path, shift === null || shift === 0 ? { due: it.due, scheduled: it.scheduled, reminders: [...it.reminders] } : {
      due: it.due ? addDays(it.due, shift) : null,
      scheduled: it.scheduled ? addDays(it.scheduled, shift) : null,
      reminders: it.reminders.map((r) => shiftReminder(r, shift)),
    });
  }
  return out;
}
