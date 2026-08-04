import { describe, it, expect } from "vitest";
import { eventColor } from "../src/gcalFeed";

const PALETTE = { "1": "#a4bdfc", "8": "#e1e1e1", "11": "#dc2127" };
const CAL = "#0B8043";   // Farbe des Kalenders

describe("eventColor – Termin-Farbe schlägt Kalenderfarbe", () => {
  it("nimmt die Farbe zur colorId des Termins", () => {
    expect(eventColor("11", PALETTE, CAL)).toBe("#dc2127");
    expect(eventColor("8", PALETTE, CAL)).toBe("#e1e1e1");
  });

  it("bleibt bei der Kalenderfarbe, wenn der Termin keine eigene hat (der Normalfall)", () => {
    expect(eventColor(undefined, PALETTE, CAL)).toBe(CAL);
    expect(eventColor(null, PALETTE, CAL)).toBe(CAL);
  });

  it("fällt bei unbekannter colorId auf den Kalender zurück statt auf nichts", () => {
    expect(eventColor("99", PALETTE, CAL)).toBe(CAL);
  });

  it("ignoriert Werte, die keine Zeichenkette sind", () => {
    expect(eventColor(11, PALETTE, CAL)).toBe(CAL);
    expect(eventColor({ id: "11" }, PALETTE, CAL)).toBe(CAL);
  });

  it("kommt mit leerer Palette klar – offline darf kein farbloser Balken entstehen", () => {
    expect(eventColor("11", {}, CAL)).toBe(CAL);
  });
});
