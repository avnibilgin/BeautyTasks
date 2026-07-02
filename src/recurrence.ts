import { Task } from "./types";

interface Rule { n: number; unit: "day" | "week" | "month" | "year"; }

/** "every day" | "every 3 months" | "every week" … -> { n, unit }. null = unbekannt. */
export function parseRecurrence(rule: string): Rule | null {
  const m = rule.trim().toLowerCase().match(/every\s+(\d+)?\s*(day|week|month|year)s?/);
  if (!m) return null;
  return { n: m[1] ? parseInt(m[1], 10) : 1, unit: m[2] as Rule["unit"] };
}

const z = (n: number) => String(n).padStart(2, "0");
const toIso = (d: Date) => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
const addDays = (isoDate: string, days: number) => { const d = new Date(isoDate + "T00:00:00"); d.setDate(d.getDate() + days); return toIso(d); };

function advance(isoDate: string, rule: Rule): string {
  const d = new Date(isoDate + "T00:00:00");
  if (rule.unit === "day") d.setDate(d.getDate() + rule.n);
  else if (rule.unit === "week") d.setDate(d.getDate() + rule.n * 7);
  else if (rule.unit === "month") d.setMonth(d.getMonth() + rule.n);
  else d.setFullYear(d.getFullYear() + rule.n);
  return toIso(d);
}

/** Einen Schritt weiter – aber bis in die Zukunft, damit die neue Instanz nicht
 *  sofort wieder überfällig ist (bei längst überfälligen Wiederholungen). */
function advanceUntilFuture(isoDate: string, rule: Rule, today: string): string {
  let d = advance(isoDate, rule);
  let guard = 0;
  while (d <= today && guard++ < 1000) d = advance(d, rule);
  return d;
}

const ms = (iso: string) => new Date(iso + "T00:00:00").getTime();

/** Fälligkeit(en) der nächsten Instanz. null = keine gültige Wiederholung.
 *  basis "done": ab Erledigungstag (today); "due": ab altem Fälligkeitsdatum.
 *  scheduled wird relativ zu due verschoben (Abstand bleibt erhalten). */
export function nextInstance(task: Task, today: string): { due: string | null; scheduled: string | null } | null {
  if (!task.recurrence) return null;
  const rule = parseRecurrence(task.recurrence);
  if (!rule) return null;
  const fromDone = task.recurBasis === "done";

  if (task.due) {
    const nextDue = advanceUntilFuture(fromDone ? today : task.due, rule, today);
    let nextScheduled: string | null = null;
    if (task.scheduled) {
      const gap = Math.round((ms(task.scheduled) - ms(task.due)) / 86400000);   // Abstand sched↔due erhalten
      nextScheduled = addDays(nextDue, gap);
    }
    return { due: nextDue, scheduled: nextScheduled };
  }
  if (task.scheduled) {
    return { due: null, scheduled: advanceUntilFuture(fromDone ? today : task.scheduled, rule, today) };
  }
  return null;
}
