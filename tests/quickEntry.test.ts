import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseQuickEntry } from "../src/quickEntry";

// „Heute" ist im Parser an die Systemzeit gebunden -> für deterministische Datums-Tests
// auf einen festen Montag (2026-06-15) einfrieren.
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)); });
afterEach(() => { vi.useRealTimers(); });

describe("parseQuickEntry – Labels", () => {
  it("sammelt #Labels, entfernt sie aus dem Titel", () => {
    const r = parseQuickEntry("Milch kaufen #einkauf #wichtig");
    expect(r.title).toBe("Milch kaufen");
    expect(r.tags).toEqual(["einkauf", "wichtig"]);
  });

  it("dedupliziert gleiche Labels", () => {
    expect(parseQuickEntry("#a Aufgabe #a").tags).toEqual(["a"]);
  });
});

describe("parseQuickEntry – Datumsphrasen (DE/EN)", () => {
  it("heute / today", () => {
    expect(parseQuickEntry("heute anrufen").faellig).toBe("2026-06-15");
    expect(parseQuickEntry("call today").faellig).toBe("2026-06-15");
  });
  it("morgen / tomorrow", () => {
    expect(parseQuickEntry("morgen abgeben").faellig).toBe("2026-06-16");
    expect(parseQuickEntry("submit tomorrow").faellig).toBe("2026-06-16");
  });
  it("übermorgen / day after tomorrow", () => {
    expect(parseQuickEntry("übermorgen test").faellig).toBe("2026-06-17");
    expect(parseQuickEntry("day after tomorrow test").faellig).toBe("2026-06-17");
  });
  it("in N Tagen / in N days", () => {
    expect(parseQuickEntry("in 3 tagen").faellig).toBe("2026-06-18");
    expect(parseQuickEntry("in 3 days").faellig).toBe("2026-06-18");
  });
  it("Wochentag (am freitag / next monday)", () => {
    expect(parseQuickEntry("am freitag arzt").faellig).toBe("2026-06-19");
    expect(parseQuickEntry("next monday meeting").faellig).toBe("2026-06-22");
  });
  it("explizite Datumsformate", () => {
    expect(parseQuickEntry("Bericht 20.06.2026").faellig).toBe("2026-06-20");
    expect(parseQuickEntry("Bericht 2026-12-01").faellig).toBe("2026-12-01");
  });
});

describe("parseQuickEntry – Wortgrenzen (kein Lookbehind nötig)", () => {
  it("matcht Token nicht innerhalb eines Wortes", () => {
    const r = parseQuickEntry("theute kein Treffer");
    expect(r.faellig).toBe("");
    expect(r.title).toBe("theute kein Treffer");
  });
  it("kombiniert Datum + Label + Resttitel", () => {
    const r = parseQuickEntry("Milch kaufen #einkauf morgen");
    expect(r.faellig).toBe("2026-06-16");
    expect(r.tags).toEqual(["einkauf"]);
    expect(r.title).toBe("Milch kaufen");
  });
});
