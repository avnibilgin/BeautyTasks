import { describe, it, expect } from "vitest";
import { timeGridDays, timeGridStep } from "../src/calendarModel";

describe("timeGridDays – sichtbare Tage je Zeitraster-Modus", () => {
  const anchor = "2026-07-15";   // Mi

  it("Tag = nur der Anker", () => {
    expect(timeGridDays("day", anchor)).toEqual(["2026-07-15"]);
  });

  it("3 Tage = Anker + 2 Folgetage (ab Anker, nicht zentriert)", () => {
    expect(timeGridDays("3day", anchor)).toEqual(["2026-07-15", "2026-07-16", "2026-07-17"]);
  });

  it("Woche = 7 Tage (Mo–So der Ankerwoche), erster und letzter passen", () => {
    const w = timeGridDays("week", anchor);
    expect(w).toHaveLength(7);
    expect(w).toContain(anchor);
  });

  it("3 Tage über Monatsgrenze", () => {
    expect(timeGridDays("3day", "2026-07-30")).toEqual(["2026-07-30", "2026-07-31", "2026-08-01"]);
  });
});

describe("timeGridStep – Blätter-Schritt", () => {
  it("Tag 1 · 3 Tage 3 · Woche 7", () => {
    expect(timeGridStep("day")).toBe(1);
    expect(timeGridStep("3day")).toBe(3);
    expect(timeGridStep("week")).toBe(7);
  });
});
