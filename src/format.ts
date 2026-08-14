import { t, getLocale } from "./i18n";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lokaler Zeitstempel „YYYY-MM-DDTHH:mm:ss" (mit Uhrzeit) – z. B. als Sortierschlüssel für
 *  den Papierkorb, damit am selben Tag Gelöschtes nach Uhrzeit geordnet bleibt. */
export function localStamp(): string {
  const d = new Date();
  const z = (n: number): string => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T${z(d.getHours())}:${z(d.getMinutes())}:${z(d.getSeconds())}`;
}

/** Lokalisiertes Monatskürzel via Intl (folgt der gewählten Locale). */
export function monthShort(monthIndex: number): string {
  return new Intl.DateTimeFormat(getLocale(), { month: "short" }).format(new Date(2020, monthIndex, 1)).replace(/\.$/, "");
}

/** Datums-Überschrift: „18. Jul · Heute · Samstag" / „19. Jul · Morgen · Sonntag" /
 *  „17. Jul · Gestern · Freitag", für sonstige Tage „20. Jul · Montag" (Datum · [rel ·] Wochentag).
 *  Liegt hier statt in der View, weil außer den Listen auch die Gruppierung (filterEngine)
 *  ihre Tages-Überschriften daraus baut – beide müssen wortgleich sein. */
export function groupLabel(dateISO: string, today: string): string {
  const d = new Date(dateOf(dateISO) + "T00:00");
  const tn = new Date(dateOf(today) + "T00:00");
  const diff = Math.round((d.getTime() - tn.getTime()) / 86400000);
  const sameYear = d.getFullYear() === tn.getFullYear();
  const datePart = `${d.getDate()}. ${monthShort(d.getMonth())}${sameYear ? "" : " " + d.getFullYear()}`;
  const weekday = new Intl.DateTimeFormat(getLocale(), { weekday: "long" }).format(d);
  const rel = diff === 0 ? t("date_today") : diff === 1 ? t("date_tomorrow") : diff === -1 ? t("date_yesterday") : null;
  return [datePart, rel, weekday].filter(Boolean).join(" · ");
}

// ── Datum/Zeit-Helfer (due/scheduled können "YYYY-MM-DD" ODER "YYYY-MM-DDTHH:mm" sein) ──
export const dateOf = (iso: string): string => iso.slice(0, 10);
export const timeOf = (iso: string): string | null => { const m = iso.match(/T(\d{2}:\d{2})/); return m ? m[1] : null; };
export const combineDT = (date: string, time: string | null | undefined): string => (time ? date + "T" + time : date);

/** Ganze Tage von heute bis zum ISO-Datum (0 = heute, 1 = morgen, -1 = gestern). Nur der
 *  Datums-Teil zählt (Uhrzeit ignoriert) – gleiche Rechnung wie formatDate. */
export function dayOffset(iso: string, today = todayStr()): number {
  const d = new Date(dateOf(iso) + "T00:00");
  const tn = new Date(dateOf(today) + "T00:00");
  return Math.round((d.getTime() - tn.getTime()) / 86400000);
}

/** Gegenstück zu `dayOffset`: ein ISO-Datum um N ganze Tage verschieben (N darf negativ sein).
 *  Über die lokalen Datumsanteile (`setDate`) statt über Millisekunden – ein Sommerzeitwechsel im
 *  verschobenen Zeitraum verschöbe sonst um einen Tag, und dieser Fehler tritt nur zweimal im Jahr
 *  auf. Eine vorhandene Uhrzeit bleibt erhalten (nötig für absolute Erinnerungen).
 *
 *  Ein unlesbares Datum kommt UNVERÄNDERT zurück. Die Form „vier Ziffern, zwei, zwei" ist nicht
 *  dasselbe wie ein gültiger Tag: `2026-13-99` besteht jede Regex im Haus, ergibt aber ein
 *  ungültiges Date – und ohne diese Schranke schriebe der Aufrufer „NaN-NaN-NaN" ins Frontmatter.
 *  Was wir nicht verstehen, verändern wir nicht. */
export function addDays(iso: string, days: number): string {
  const d = new Date(dateOf(iso) + "T00:00");
  if (isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  const z = (n: number): string => String(n).padStart(2, "0");
  return combineDT(`${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`, timeOf(iso));
}

/** ISO-Datum -> "Today" | "Yesterday" | "Tomorrow" | "24 Jun" | "1 Dec 2025" (locale).
 *  Eine evtl. Uhrzeit im ISO-String wird ignoriert (nur der Datums-Teil zählt). */
export function formatDate(iso: string, today = todayStr()): string {
  const d = new Date(dateOf(iso) + "T00:00");
  const tn = new Date(dateOf(today) + "T00:00");
  const diff = Math.round((d.getTime() - tn.getTime()) / 86400000);
  if (diff === 0) return t("date_today");
  if (diff === -1) return t("date_yesterday");
  if (diff === 1) return t("date_tomorrow");
  const sameYear = d.getFullYear() === tn.getFullYear();
  return `${d.getDate()} ${monthShort(d.getMonth())}${sameYear ? "" : " " + d.getFullYear()}`;
}

/** Datum + optionale Uhrzeit als Chip-Text, z. B. "30. Jun · 23:30". */
export function formatDateTime(iso: string, today = todayStr()): string {
  const tm = timeOf(iso);
  return formatDate(iso, today) + (tm ? " · " + tm : "");
}

/**
 * Deadline-Chip: wie formatDateTime, aber innerhalb einer Woche steht der ABSTAND da statt des
 * Datums – „Vor 3 Tagen" rückwärts, „In 3 Tagen" vorwärts, „Gestern"/„Heute"/„Morgen" direkt daneben.
 *
 * Der Grund ist Lesbarkeit: Ein absolutes Datum zwingt zum Kopfrechnen, bevor man Verspätung oder
 * Dringlichkeit spürt – gerade dort, wo es darauf ankommt. Als Countdown liest sich eine Frist,
 * wie man sie denkt. Nur die Deadline wird so geschrieben, die Fälligkeit behält ihr Datum.
 *
 * Jenseits einer Woche wieder das Datum: „In 143 Tagen" ist weder kurz noch hilfreich, und die
 * Distanzfarben hören ebenfalls bei Tag 7 auf.
 *
 * Formuliert wird über Intl.RelativeTimeFormat – das liefert für alle zehn Sprachen die richtige
 * Pluralform (im Russischen etwa „3 дня назад", aber „5 дней назад") ohne eine einzige eigene
 * Übersetzung. `numeric: "auto"` erzeugt bei -1/0/+1 von sich aus die Wörter („gestern", „heute",
 * „morgen") – die Sonderfälle aus formatDate entfallen damit hier. Groß geschrieben wird immer:
 * Der Chip ist eine Beschriftung, keine Satzmitte, und beginnt wie „25. Jul" der übrigen Angaben.
 */
export function formatDeadline(iso: string, today = todayStr()): string {
  const off = dayOffset(iso, today);
  const tm = timeOf(iso);
  if (off < -7 || off > 7) return formatDateTime(iso, today);
  const rel = new Intl.RelativeTimeFormat(getLocale(), { numeric: "auto" }).format(off, "day");
  return rel.charAt(0).toUpperCase() + rel.slice(1) + (tm ? " · " + tm : "");
}

/** Dauer in Minuten -> "30 min" / "1 h" / "1 h 30 min". */
export function formatDuration(min: number): string {
  if (min < 60) return min + " min";
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

/** "past" | "today" | "future" – steuert die Datumsfarbe (nur Datums-Teil). */
export function dueWhen(iso: string, today = todayStr()): "past" | "today" | "future" {
  const d = dateOf(iso), tn = dateOf(today);
  return d < tn ? "past" : d === tn ? "today" : "future";
}

/**
 * Tages-Distanz-Stufe fürs Einfärben des Datums-Chips (data-dist): heute/morgen/übermorgen/
 * bis Tag 7/ferner. "" bei Überfällig – das behält seine rote data-when-Farbe (kein data-dist).
 * EINE Zuordnung für Liste (renderTask) UND Modal-Unteraufgaben (subtaskList): vorher hatte
 * nur die Liste sie, und die Modal-Zeile blieb beim alten data-when-Orange – zwei Flächen,
 * zwei Farbsysteme für dasselbe Datum.
 */
export function dueDist(iso: string, today = todayStr()): "" | "today" | "d1" | "d2" | "week" | "far" {
  const off = dayOffset(iso, today);
  return off < 0 ? "" : off === 0 ? "today" : off === 1 ? "d1" : off === 2 ? "d2" : off <= 7 ? "week" : "far";
}
