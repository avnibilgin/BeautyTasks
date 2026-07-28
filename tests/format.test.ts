import { describe, it, expect, beforeEach } from "vitest";
import { formatDate, formatDeadline, dueWhen, monthShort } from "../src/format";
import { setLocale } from "../src/i18n";

beforeEach(() => setLocale("en"));   // Kanon-Locale für deterministische Ausgaben

describe("formatDate", () => {
  const today = "2026-06-15";
  it("relative Tage", () => {
    expect(formatDate("2026-06-15", today)).toBe("Today");
    expect(formatDate("2026-06-14", today)).toBe("Yesterday");
    expect(formatDate("2026-06-16", today)).toBe("Tomorrow");
  });
  it("gleiches Jahr ohne Jahreszahl", () => {
    expect(formatDate("2026-06-24", today)).toBe("24 Jun");
  });
  it("anderes Jahr mit Jahreszahl", () => {
    expect(formatDate("2025-12-01", today)).toBe("1 Dec 2025");
  });
});

describe("dueWhen", () => {
  const today = "2026-06-15";
  it("past / today / future", () => {
    expect(dueWhen("2026-06-14", today)).toBe("past");
    expect(dueWhen("2026-06-15", today)).toBe("today");
    expect(dueWhen("2026-06-16", today)).toBe("future");
  });
});

describe("monthShort", () => {
  it("liefert lokalisiertes Kürzel ohne Punkt", () => {
    expect(monthShort(5)).toBe("Jun");
    expect(monthShort(0)).toBe("Jan");
  });
});

describe("formatDeadline – verstrichene Deadlines als Abstand", () => {
  const today = "2026-06-15";
  it("schreibt bis eine Woche zurück den Abstand statt des Datums", () => {
    expect(formatDeadline("2026-06-12", today)).toBe("3 days ago");
    expect(formatDeadline("2026-06-08", today)).toBe("7 days ago");
  });
  it("nutzt bei gestern das Wort statt der Zahl (numeric: auto), groß geschrieben", () => {
    expect(formatDeadline("2026-06-14", today)).toBe("Yesterday");
  });
  it("hängt eine vorhandene Uhrzeit an", () => {
    expect(formatDeadline("2026-06-12T14:30", today)).toBe("3 days ago · 14:30");
  });
  it("fällt ab Tag 8 auf das Datum zurück – „vor 143 Tagen“ hülfe niemandem", () => {
    expect(formatDeadline("2026-06-07", today)).toBe("7 Jun");
  });
  it("lässt Heute und Künftiges unverändert (nur Verstrichenes wird umgeschrieben)", () => {
    expect(formatDeadline("2026-06-15", today)).toBe("Today");
    expect(formatDeadline("2026-06-16", today)).toBe("Tomorrow");
    expect(formatDeadline("2026-06-24", today)).toBe("24 Jun");
  });
  it("bildet die Pluralformen der Zielsprache – auch die russischen", () => {
    setLocale("ru");
    expect(formatDeadline("2026-06-12", today)).toBe("3 дня назад");   // 2–4: „дня"
    expect(formatDeadline("2026-06-10", today)).toBe("5 дней назад");  // ab 5: „дней"
    setLocale("de");
    expect(formatDeadline("2026-06-12", today)).toBe("Vor 3 Tagen");   // Chip = Beschriftung -> groß
    expect(formatDeadline("2026-06-14", today)).toBe("Gestern");
  });
});
