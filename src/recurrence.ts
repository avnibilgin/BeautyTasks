import { RRule, Frequency, Options } from "rrule";
import { Task } from "./types";

/**
 * Wiederholungen. Zwei Schreibweisen, ein Rechenweg.
 *
 * ── Warum überhaupt RRULE ────────────────────────────────────────────────────
 * `every 3 months` ist unsere gewachsene Schreibweise und bleibt lesbar und gültig. Sie kann aber
 * nur „alle n Einheiten". Regeln wie „nur werktags", „jeder zweite Dienstag" oder „letzter Freitag
 * im Monat" braucht eine Aufgabenverwaltung früher oder später, und dafür gibt es mit RFC 5545
 * (iCalendar) eine Sprache, die Google, Apple und Outlook ohnehin sprechen. Statt dafür eine
 * eigene Syntax zu erfinden, lesen und rechnen wir RRULE – über `rrule`, damit die harten Teile
 * (BYDAY, BYSETPOS, COUNT, UNTIL, Monatsenden) nicht hier nachgebaut werden.
 *
 * ── Was RRULE NICHT kann, und warum das ein eigenes Feld hat ─────────────────
 * RFC 5545 leitet alle Termine aus `DTSTART` plus Regel ab; sie stehen im Voraus fest. Eine
 * Wiederholung, die vom TAG DER ERLEDIGUNG zählt („alle 7 Tage nach der letzten Anwendung"),
 * ist darin nicht ausdrückbar – kein Feld, keine Erweiterung. Genau deshalb hat Outlook dafür
 * eigene Musterklassen (DailyRegenerationPattern & Co., ausdrücklich nur für Aufgaben) und
 * Todoist eine eigene Syntax (`every!`). Unser `recur_basis: done` ist dieselbe Lösung: ein
 * Schalter NEBEN der Regel, nicht in ihr. Die RRULE bleibt dadurch für Fremdprogramme gültig.
 *
 * ── Die eine Stelle, die das Format kennt ────────────────────────────────────
 * Alles darüber (Texterkennung, Chips, Index, Ansichten) arbeitet mit `Rule` bzw. reicht den
 * Text durch. Deshalb kostet eine neue Schreibweise nur diese Datei.
 */

export interface Rule { n: number; unit: "day" | "week" | "month" | "year"; }

const UNIT_FREQ: Record<Rule["unit"], Frequency> = {
  day: RRule.DAILY, week: RRule.WEEKLY, month: RRule.MONTHLY, year: RRule.YEARLY,
};
const FREQ_UNIT = new Map<Frequency, Rule["unit"]>([
  [RRule.DAILY, "day"], [RRule.WEEKLY, "week"], [RRule.MONTHLY, "month"], [RRule.YEARLY, "year"],
]);

/** Unsere gewachsene Schreibweise: „every day", „every 3 months". */
function parseEveryText(rule: string): Rule | null {
  const m = rule.trim().toLowerCase().match(/^every\s+(\d+)?\s*(day|week|month|year)s?$/);
  if (!m) return null;
  return { n: m[1] ? parseInt(m[1], 10) : 1, unit: m[2] as Rule["unit"] };
}

/**
 * RRULE-Text zu Optionen. Bewusst nachsichtig, weil fremde Programme unterschiedlich schreiben:
 * TaskForge liefert `DTSTART:20260821;FREQ=YEARLY;…` in EINER Zeile, andere setzen `RRULE:` davor.
 * `DTSTART` interessiert uns nie – der Anker kommt aus der Aufgabe, nicht aus der Regel.
 */
function parseRRuleText(rule: string): Partial<Options> | null {
  const body = rule
    .replace(/^\s*RRULE:/i, "")
    .replace(/DTSTART(?:;[^:;]*)?:[^;\s]*;?/i, "")
    .trim();
  if (!/FREQ=/i.test(body)) return null;
  try {
    const opts = RRule.parseString(body);
    if (opts.freq === undefined) return null;
    // COUNT wird ABGELEHNT, nicht ignoriert. Grund liegt im Modell: Wir wiederholen über eine
    // Kette neuer Aufgaben, und jede trägt die Regel erneut mit ihrem eigenen Datum als Anker.
    // Eine Zählung „noch zehnmal" begänne dadurch bei jeder Instanz von vorn und liefe nie ab –
    // die Regel verspräche ein Ende, das nie käme. Lieber sichtbar nicht unterstützt als still
    // falsch. (Sauber lösbar, sobald wir Regeln auch SCHREIBEN: dann bekommt die Folgeaufgabe
    // COUNT um eins verringert, und bei COUNT=1 entsteht keine mehr. Das ist Stufe 2.)
    // UNTIL ist davon nicht betroffen: ein absolutes Datum gilt für jede Instanz gleich.
    if (opts.count != null) return null;
    return opts;
  } catch { return null; }   // kaputte Regel -> wie „keine Regel"
}

/**
 * Die EINFACHE Gestalt einer Regel: „alle n Einheiten", sonst `null`.
 *
 * Für Anzeige und Gruppierung – nicht zum Rechnen. `null` heisst deshalb nicht „ungültig",
 * sondern „lässt sich nicht auf ein blosses Intervall verkürzen" (etwa `FREQ=MONTHLY;BYDAY=-1FR`).
 * Aufrufer, die gruppieren, zeigen solche Regeln im Rohtext – das ist ehrlicher, als sie auf ein
 * Intervall zu runden, das sie nicht sind.
 */
export function parseRecurrence(rule: string): Rule | null {
  const simple = parseEveryText(rule);
  if (simple) return simple;
  const opts = parseRRuleText(rule);
  if (!opts || opts.freq === undefined) return null;
  const unit = FREQ_UNIT.get(opts.freq);
  if (!unit) return null;   // SECONDLY/MINUTELY/HOURLY: kennt unser Modell nicht
  // Alles, was die Regel über das blosse Intervall hinaus einschränkt, macht sie nicht-einfach.
  const extra = opts.byweekday ?? opts.bymonthday ?? opts.bymonth ?? opts.bysetpos ?? opts.byyearday ?? opts.byweekno;
  if (extra != null && (!Array.isArray(extra) || extra.length > 0)) return null;
  return { n: opts.interval && opts.interval > 0 ? opts.interval : 1, unit };
}

/** Versteht BeautyTasks diese Regel überhaupt? Getrennt von `parseRecurrence`, weil eine
 *  komplexe RRULE gültig IST, sich aber nicht auf `{n, unit}` verkürzen lässt. */
export function isValidRecurrence(rule: string): boolean {
  return parseEveryText(rule) !== null || parseRRuleText(rule) !== null;
}

// ── Datumsrechnung ───────────────────────────────────────────────────────────
// Durchweg UTC-Mitternacht: `rrule` rechnet in UTC, und unsere Datumsangaben sind reine
// Kalendertage ohne Zeitzone. Über lokale Zeit zu gehen verschöbe Termine bei Sommerzeitwechseln
// um einen Tag – ein Fehler, der nur zweimal im Jahr auftritt und deshalb schwer zu finden ist.
const z = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => d.getUTCFullYear() + "-" + z(d.getUTCMonth() + 1) + "-" + z(d.getUTCDate());
const fromIso = (iso: string) => new Date(iso + "T00:00:00Z");
const addDays = (iso: string, days: number) => { const d = fromIso(iso); d.setUTCDate(d.getUTCDate() + days); return toIso(d); };
const ms = (iso: string) => fromIso(iso).getTime();

/** Regel + Anker -> erster Termin ECHT nach `afterIso`. `null`, wenn die Regel ausläuft
 *  (COUNT/UNTIL erschöpft) oder unlesbar ist. */
function nextAfter(rule: string, anchorIso: string, afterIso: string): string | null {
  const simple = parseEveryText(rule);
  const opts: Partial<Options> | null = simple
    ? { freq: UNIT_FREQ[simple.unit], interval: simple.n }
    : parseRRuleText(rule);
  if (!opts) return null;
  const next = new RRule({ ...opts, dtstart: fromIso(anchorIso) }).after(fromIso(afterIso), false);
  return next ? toIso(next) : null;
}

/**
 * Fälligkeit(en) der nächsten Instanz. `null` = keine gültige oder keine weitere Wiederholung.
 *
 * basis „done": ab dem Erledigungstag (heute) – der Abstand zwischen zwei Erledigungen ist der
 * Zweck. basis „due": ab dem alten Fälligkeitsdatum, dem Kalender folgend.
 *
 * In beiden Fällen wird ein Termin ECHT NACH heute gesucht. Sonst käme eine längst überfällige
 * Wiederholung sofort wieder als überfällig zurück, und der Nutzer hakt sie mehrfach ab, ohne
 * dass sich etwas bewegt.
 *
 * `scheduled` wandert mit und behält seinen Abstand zu `due` – wer „drei Tage vorher einplanen"
 * eingestellt hat, will das auch in der nächsten Runde.
 */
export function nextInstance(task: Task, today: string): { due: string | null; scheduled: string | null } | null {
  if (!task.recurrence || !isValidRecurrence(task.recurrence)) return null;
  const fromDone = task.recurBasis === "done";

  if (task.due) {
    const anchor = fromDone ? today : task.due;
    const after = fromDone ? today : (ms(task.due) > ms(today) ? task.due : today);
    const nextDue = nextAfter(task.recurrence, anchor, after);
    if (!nextDue) return null;
    let nextScheduled: string | null = null;
    if (task.scheduled) {
      const gap = Math.round((ms(task.scheduled) - ms(task.due)) / 86400000);
      nextScheduled = addDays(nextDue, gap);
    }
    return { due: nextDue, scheduled: nextScheduled };
  }
  if (task.scheduled) {
    const anchor = fromDone ? today : task.scheduled;
    const after = fromDone ? today : (ms(task.scheduled) > ms(today) ? task.scheduled : today);
    const next = nextAfter(task.recurrence, anchor, after);
    return next ? { due: null, scheduled: next } : null;
  }
  return null;
}
