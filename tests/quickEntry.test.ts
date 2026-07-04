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

describe("parseQuickEntry – Uhrzeit", () => {
  it("erkennt um HH:MM und entfernt es aus dem Titel", () => {
    const r = parseQuickEntry("Zahnarzt um 07:30");
    expect(r.time).toBe("07:30");
    expect(r.title).toBe("Zahnarzt");
  });
  it("erkennt bloesses HH:MM", () => {
    expect(parseQuickEntry("Meeting 14:15").time).toBe("14:15");
  });
  it("erkennt um H uhr und H uhr", () => {
    expect(parseQuickEntry("Anruf um 9 uhr").time).toBe("09:00");
    expect(parseQuickEntry("Termin 8 uhr").time).toBe("08:00");
  });
  it("erkennt englisches am/pm", () => {
    expect(parseQuickEntry("call 7pm").time).toBe("19:00");
    expect(parseQuickEntry("call 7:30 am").time).toBe("07:30");
  });
  it("ignoriert ungueltige Zeiten", () => {
    expect(parseQuickEntry("Code 99:99").time).toBe("");
  });
});

describe("parseQuickEntry – Prioritaet", () => {
  it("erkennt p1-p4 und entfernt es aus dem Titel", () => {
    const r = parseQuickEntry("Zahnarzt p1");
    expect(r.priority).toBe("highest");
    expect(r.title).toBe("Zahnarzt");
    expect(parseQuickEntry("x p2").priority).toBe("high");
    expect(parseQuickEntry("x p3").priority).toBe("medium");
    expect(parseQuickEntry("x p4").priority).toBe("normal");
  });
  it("erkennt !1-!4", () => {
    expect(parseQuickEntry("wichtig !1").priority).toBe("highest");
  });
  it("greift nicht mitten im Wort", () => {
    expect(parseQuickEntry("Kapitel p12 lesen").priority).toBeNull();
    expect(parseQuickEntry("Top1 Liste").priority).toBeNull();
  });
});

describe("parseQuickEntry – kombiniert (Original-Eingabe)", () => {
  it("Morgen um 07:30 Zahnarzt #wichtig p1", () => {
    const r = parseQuickEntry("Morgen um 07:30 Zahnarzt #wichtig p1");
    expect(r.faellig).toBe("2026-06-16");
    expect(r.time).toBe("07:30");
    expect(r.tags).toEqual(["wichtig"]);
    expect(r.priority).toBe("highest");
    expect(r.title).toBe("Zahnarzt");
  });
});
