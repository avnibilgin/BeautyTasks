import { Task } from "./types";
import { t } from "./i18n";
import { formatDateTime } from "./format";

/**
 * Erinnerungen (Stufe A). Dieses Modul ist die *einzige* Wahrheit über „wann feuert was":
 * Modell (rohe Strings im Frontmatter) + Auflösung in absolute Feuerzeiten + Formatierung.
 * Es kennt bewusst KEINE Zustellung (Notification) – der Scheduler (Schritt 2) und ein
 * späterer .ics-Export (Stufe C) sind dünne Konsumenten von resolveReminders().
 *
 * Roh-Format im Frontmatter (greppbar, handeditierbar):
 *   "-0m"                 relativ: zum Zeitpunkt der Aufgabe
 *   "-30m" | "-1h" | "-2d" relativ: N vor der Fälligkeit (Minuten/Stunden/Tage)
 *   "2026-07-05T09:00"    absolut: fester Zeitpunkt (lokale Zeit)
 */

export type ParsedReminder = { rel: number } | { abs: string };   // rel = Minuten vor Fälligkeit
export type ResolvedReminder = { raw: string; fireAt: Date };

/** Roh-String -> relativer Offset (Minuten) oder absolutes ISO-Datum. null = ungültig. */
export function parseReminder(raw: string): ParsedReminder | null {
  const rel = raw.match(/^-(\d+)([mhd])$/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const mult = rel[2] === "m" ? 1 : rel[2] === "h" ? 60 : 1440;
    return { rel: n * mult };
  }
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(raw)) return { abs: raw };
  return null;
}

/** Offset in Minuten -> „30 min" / „1 Std" / „2 Tage" (lokalisiert). */
function humanizeOffset(min: number): string {
  if (min % 1440 === 0) { const d = min / 1440; return t(d === 1 ? "rem_unit_day" : "rem_unit_days", d); }
  if (min % 60 === 0) return t("rem_unit_hour", min / 60);
  return t("rem_unit_min", min);
}

/** Chip-/Listen-Text: „Zum Zeitpunkt der Aufgabe" | „30 min vorher" | „5. Jul · 09:00". */
export function formatReminder(raw: string): string {
  const p = parseReminder(raw);
  if (!p) return raw;
  if ("abs" in p) return formatDateTime(p.abs);
  if (p.rel === 0) return t("rem_at_time");
  return t("rem_before", humanizeOffset(p.rel));
}

/**
 * Löst die Erinnerungen einer Aufgabe in absolute Feuerzeiten auf.
 * - erledigte/abgebrochene Aufgaben: keine.
 * - relative Erinnerungen brauchen Datum UND Uhrzeit (due + dueTime); sonst übersprungen.
 * - Recurrence „gratis": rückt due nach vorn, ändert sich fireAt automatisch mit.
 */
export function resolveReminders(task: Task): ResolvedReminder[] {
  if (task.status === "done" || task.status === "cancelled") return [];
  const out: ResolvedReminder[] = [];
  for (const raw of task.reminders ?? []) {
    const p = parseReminder(raw);
    if (!p) continue;
    if ("abs" in p) {
      const d = new Date(p.abs);                       // ISO ohne Z => lokale Zeit
      if (!isNaN(d.getTime())) out.push({ raw, fireAt: d });
    } else {
      if (!task.due || !task.dueTime) continue;        // relativ braucht eine Uhrzeit
      const base = new Date(task.due + "T" + task.dueTime);
      if (isNaN(base.getTime())) continue;
      out.push({ raw, fireAt: new Date(base.getTime() - p.rel * 60000) });
    }
  }
  return out;
}
