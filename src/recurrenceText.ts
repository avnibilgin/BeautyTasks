import { Options } from "rrule";
import { t, getLocale } from "./i18n";
import { ruleOptions, Rule, FREQ_UNIT } from "./recurrence";

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
      // Ab Intervall 2 bewusst NICHT „Jeden 2. Dienstag": Das liest sich wie der zweite Dienstag
      // im MONAT und stünde damit neben „2. Montag im Monat" für etwas ganz anderes. Der Umweg
      // über „Alle 2 Wochen" ist eindeutig und braucht nebenbei keine Ordnungszahl – die kann
      // JavaScript ohnehin nicht ausschreiben (Intl kennt kein RBNF).
      return n === 1 ? t("recur_every_weekday", name) : t("recur_n_weeks_on", n, name);
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
  const opts = ruleOptions(rule);
  if (!opts) return rule;
  const base = describeBase(opts);
  if (!base) return rule;
  const extra: string[] = [];
  if (opts.until instanceof Date) extra.push(t("recur_until", localDate(opts.until)));
  if (typeof opts.count === "number") extra.push(t("recur_count", opts.count));
  return [base, ...extra].join(" · ");
}
