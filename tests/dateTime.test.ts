import { describe, it, expect, beforeEach } from "vitest";
import { dateOf, timeOf, combineDT, formatDuration, formatDateTime } from "../src/format";
import { parseTime, parseDuration } from "../src/datePicker";
import { setLocale } from "../src/i18n";

beforeEach(() => setLocale("en"));

describe("dateOf / timeOf / combineDT", () => {
  it("trennt Datum und Zeit", () => {
    expect(dateOf("2026-06-30T23:30")).toBe("2026-06-30");
    expect(dateOf("2026-06-30")).toBe("2026-06-30");
    expect(timeOf("2026-06-30T23:30")).toBe("23:30");
    expect(timeOf("2026-06-30")).toBeNull();
  });
  it("kombiniert nur mit Zeit", () => {
    expect(combineDT("2026-06-30", "23:30")).toBe("2026-06-30T23:30");
    expect(combineDT("2026-06-30", null)).toBe("2026-06-30");
    expect(combineDT("2026-06-30", undefined)).toBe("2026-06-30");
  });
});

describe("formatDateTime", () => {
  const today = "2026-06-30";
  it("hängt die Uhrzeit an", () => {
    expect(formatDateTime("2026-06-30T23:30", today)).toBe("Today · 23:30");
    expect(formatDateTime("2026-06-24T09:05", today)).toBe("24 Jun · 09:05");
  });
  it("ohne Uhrzeit nur das Datum", () => {
    expect(formatDateTime("2026-06-24", today)).toBe("24 Jun");
  });
});

describe("formatDuration", () => {
  it("min/h-Formatierung", () => {
    expect(formatDuration(15)).toBe("15 min");
    expect(formatDuration(30)).toBe("30 min");
    expect(formatDuration(60)).toBe("1 h");
    expect(formatDuration(90)).toBe("1 h 30 min");
  });
});

describe("parseTime", () => {
  it("diverse Eingaben", () => {
    expect(parseTime("23:30")).toBe("23:30");
    expect(parseTime("2330")).toBe("23:30");
    expect(parseTime("930")).toBe("09:30");
    expect(parseTime("9")).toBe("09:00");
    expect(parseTime("9:30")).toBe("09:30");
  });
  it("am/pm", () => {
    expect(parseTime("9pm")).toBe("21:00");
    expect(parseTime("9:30am")).toBe("09:30");
    expect(parseTime("12am")).toBe("00:00");
    expect(parseTime("12pm")).toBe("12:00");
  });
  it("ungültig -> null", () => {
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("abc")).toBeNull();
    expect(parseTime("")).toBeNull();
  });
});

describe("parseDuration (frei)", () => {
  it("Minuten/Stunden/gemischt", () => {
    expect(parseDuration("30")).toBe(30);
    expect(parseDuration("30 min")).toBe(30);
    expect(parseDuration("90")).toBe(90);
    expect(parseDuration("1h")).toBe(60);
    expect(parseDuration("2 h")).toBe(120);
    expect(parseDuration("1h30")).toBe(90);
    expect(parseDuration("1:30")).toBe(90);
    expect(parseDuration("1,5h")).toBe(90);
  });
  it("leer/— -> null", () => {
    expect(parseDuration("")).toBeNull();
    expect(parseDuration("—")).toBeNull();
  });
});
