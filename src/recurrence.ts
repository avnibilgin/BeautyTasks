import { RRule, Frequency, Options } from "rrule";
import { Task } from "./types";
import { t, getLocale } from "./i18n";

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
    // Unterhalb eines Tages hat unser Modell keine Auflösung: Fälligkeiten sind Kalendertage.
    // `FREQ=HOURLY` lieferte sonst immer wieder denselben Tag – eine Wiederholung, die sich
    // nicht bewegt. Ablehnen ist die einzige ehrliche Antwort darauf.
    if (!FREQ_UNIT.has(opts.freq)) return null;
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

const FREQ_NAME: Record<Rule["unit"], string> = {
  day: "DAILY", week: "WEEKLY", month: "MONTHLY", year: "YEARLY",
};

/** Ein einfaches Intervall als RRULE. `INTERVAL=1` wird weggelassen – es ist der Vorgabewert,
 *  und die kürzere Regel ist die, die man beim Draufschauen noch versteht. */
export function toRRuleString(rule: Rule): string {
  return "FREQ=" + FREQ_NAME[rule.unit] + (rule.n > 1 ? ";INTERVAL=" + rule.n : "");
}

/**
 * Alte Schreibweise -> RRULE, für die einmalige Umstellung bestehender Notizen.
 *
 * `null` heisst „hier ist nichts zu tun" – entweder steht dort schon eine RRULE, oder der Text
 * ist keiner, den wir je geschrieben haben. Beides bleibt unangetastet: Eine Migration, die im
 * Zweifel nichts tut, ist wiederholbar; eine, die rät, ist es nicht.
 */
export function legacyToRRule(rule: string): string | null {
  const simple = parseEveryText(rule);
  return simple ? toRRuleString(simple) : null;
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
 * Welche Regel trägt die FOLGEAUFGABE?
 *
 * Normalerweise dieselbe. Bei `COUNT` aber eine um eins verringerte – und darin steckt die
 * Lösung für ein Problem, das unser Modell sonst hätte: Wir wiederholen über eine Kette neuer
 * Aufgaben, und jede verankert die Regel an ihrem eigenen Datum. Bliebe `COUNT=10` stehen,
 * begänne die Zählung bei jeder Instanz von vorn und liefe nie ab.
 *
 * Verringert wandert der Rest mit: Aus `COUNT=3` wird `COUNT=2`, dann `COUNT=1` – und bei
 * `COUNT=1` liefert die Regel von sich aus keinen weiteren Termin mehr, weil die eine erlaubte
 * Wiederholung der Anker selbst ist. Die Kette endet also ohne Sonderfall, und im Frontmatter
 * kann man ablesen, wie viele noch kommen.
 *
 * Gezielt ersetzt statt die Regel neu zu serialisieren: So bleibt alles andere Zeichen für
 * Zeichen erhalten – auch Reihenfolge und Schreibweisen, die wir gar nicht deuten.
 */
function successorRule(rule: string): string {
  return rule.replace(/(^|[;:\s])COUNT=(\d+)/i, (_m, pre: string, n: string) =>
    pre + "COUNT=" + Math.max(1, parseInt(n, 10) - 1));
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
export function nextInstance(task: Task, today: string): { due: string | null; scheduled: string | null; recurrence: string } | null {
  if (!task.recurrence || !isValidRecurrence(task.recurrence)) return null;
  const fromDone = task.recurBasis === "done";
  const rule = successorRule(task.recurrence);

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
    return { due: nextDue, scheduled: nextScheduled, recurrence: rule };
  }
  if (task.scheduled) {
    const anchor = fromDone ? today : task.scheduled;
    const after = fromDone ? today : (ms(task.scheduled) > ms(today) ? task.scheduled : today);
    const next = nextAfter(task.recurrence, anchor, after);
    return next ? { due: null, scheduled: next, recurrence: rule } : null;
  }
  return null;
}

// ── Anzeige ──────────────────────────────────────────────────────────────────
// Gespeichert wird die Regel, GEZEIGT wird Klartext. Beides zu trennen ist der Grund, warum wir
// uns ein einziges Speicherformat leisten können: Niemand muss `FREQ=MONTHLY;BYDAY=-1FR` lesen.
//
// Wochentagsnamen kommen von `Intl` statt aus unseren Übersetzungen – das sind zehn Sprachen mal
// sieben Tage, die die Plattform korrekter kennt als wir sie pflegen könnten.

/** rrule zählt MO=0 … SU=6. Der 01.01.2024 war ein Montag – damit wird aus dem Index ein Datum,
 *  aus dem Intl den Namen in der eingestellten Sprache bildet. */
function weekdayName(i: number): string {
  const d = new Date(Date.UTC(2024, 0, 1 + i));
  return new Intl.DateTimeFormat(getLocale(), { weekday: "long", timeZone: "UTC" }).format(d);
}

const localDate = (d: Date): string =>
  new Intl.DateTimeFormat(getLocale(), { year: "numeric", month: "2-digit", day: "2-digit", timeZone: "UTC" }).format(d);

/** byweekday in eine schlichte Liste bringen: rrule liefert Zahlen ODER Weekday-Objekte mit `n`
 *  („der zweite Dienstag"). Beides muss hier gleich aussehen, sonst hängt die Anzeige davon ab,
 *  wie die Regel geschrieben war. */
function weekdays(v: unknown): { n: number | null; wd: number }[] {
  const arr = Array.isArray(v) ? v : v == null ? [] : [v];
  return arr.map((x) => {
    if (typeof x === "number") return { n: null, wd: x };
    const o = x as { weekday?: number; n?: number | null };
    return typeof o?.weekday === "number" ? { n: o.n ?? null, wd: o.weekday } : null;
  }).filter((x): x is { n: number | null; wd: number } => x !== null);
}

const PRESET_KEY: Record<string, string> = {
  "1day": "recur_daily", "1week": "recur_weekly", "1month": "recur_monthly",
  "3month": "recur_quarterly", "1year": "recur_yearly",
};
const EVERY_N_KEY: Record<Rule["unit"], string> = {
  day: "recur_n_days", week: "recur_n_weeks", month: "recur_n_months", year: "recur_n_years",
};

/** Der Kern der Regel, ohne Zusätze wie „bis …". `null` = nicht benennbar. */
function describeBase(opts: Partial<Options>): string | null {
  const unit = opts.freq === undefined ? undefined : FREQ_UNIT.get(opts.freq);
  if (!unit) return null;
  const n = opts.interval && opts.interval > 0 ? opts.interval : 1;
  const wds = weekdays(opts.byweekday);
  const mdays = Array.isArray(opts.bymonthday) ? opts.bymonthday : opts.bymonthday != null ? [opts.bymonthday] : [];

  if (unit === "week" && wds.length) {
    const set = wds.map((w) => w.wd).sort((a, b) => a - b);
    if (set.length === 5 && set.join() === "0,1,2,3,4") return t("recur_weekdays");
    if (set.length === 2 && set.join() === "5,6") return t("recur_weekend");
    if (set.length === 1) {
      const name = weekdayName(set[0]);
      return n === 1 ? t("recur_every_weekday", name) : t("recur_every_nth_weekday", n, name);
    }
    return set.map(weekdayName).join(", ");   // eigene Auswahl: aufzählen statt deuten
  }

  if (unit === "month" && wds.length === 1 && wds[0].n != null) {
    const name = weekdayName(wds[0].wd);
    return wds[0].n === -1 ? t("recur_last_weekday_month", name) : t("recur_nth_weekday_month", wds[0].n, name);
  }
  if (unit === "month" && mdays.length === 1 && mdays[0] > 0) return t("recur_monthday", mdays[0]);

  // Schlichtes Intervall: die fünf Vorlagen haben eigene Namen, alles andere wird gezählt.
  if (wds.length || mdays.length || opts.bysetpos != null || opts.bymonth != null) return null;
  const preset = PRESET_KEY[String(n) + unit];
  return preset ? t(preset) : t(EVERY_N_KEY[unit], n);
}

/**
 * Eine Regel in Klartext. Rückfall ist der ROHTEXT, nicht eine hübsche Näherung: Wer eine Regel
 * schreibt, die wir nicht benennen können, soll sehen, was wirklich in der Datei steht.
 */
export function describeRecurrence(rule: string): string {
  const simple = parseEveryText(rule);
  const opts = simple ? { freq: UNIT_FREQ[simple.unit], interval: simple.n } : parseRRuleText(rule);
  if (!opts) return rule;
  const base = describeBase(opts);
  if (!base) return rule;
  const extra: string[] = [];
  if (opts.until instanceof Date) extra.push(t("recur_until", localDate(opts.until)));
  if (typeof opts.count === "number") extra.push(t("recur_count", opts.count));
  return [base, ...extra].join(" · ");
}
