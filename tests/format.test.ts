import { describe, it, expect, beforeEach } from "vitest";
import { formatDate, dueWhen, monthShort } from "../src/format";
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
