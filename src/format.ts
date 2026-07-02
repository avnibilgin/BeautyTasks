import { t, getLocale } from "./i18n";

export function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** Lokalisiertes Monatskürzel via Intl (folgt der gewählten Locale). */
export function monthShort(monthIndex: number): string {
  return new Intl.DateTimeFormat(getLocale(), { month: "short" }).format(new Date(2020, monthIndex, 1)).replace(/\.$/, "");
}

// ── Datum/Zeit-Helfer (due/scheduled können "YYYY-MM-DD" ODER "YYYY-MM-DDTHH:mm" sein) ──
export const dateOf = (iso: string): string => iso.slice(0, 10);
export const timeOf = (iso: string): string | null => { const m = iso.match(/T(\d{2}:\d{2})/); return m ? m[1] : null; };
export const combineDT = (date: string, time: string | null | undefined): string => (time ? date + "T" + time : date);

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
