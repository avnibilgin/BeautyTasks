import { describe, it, expect } from "vitest";
import { eventColor } from "../src/gcalFeed";

const PALETTE = { "1": "#a4bdfc", "8": "#e1e1e1", "11": "#dc2127" };   // /colors – die elf alten
const LABELS = {                                                       // labelProperties des Kalenders
  "f2895a4d-6be8-4a41-b036-2aa7e399c797": "#b39ddb",                   // Flieder
  "50e8c3fb-5a48-4e1e-bbd5-1c8314b7d567": "#0b8043",
};
const FLIEDER = "f2895a4d-6be8-4a41-b036-2aa7e399c797";
const CAL = "#9fc6e7";   // Farbe des Kalenders

describe("eventColor – Termin-Farbe schlägt Kalenderfarbe", () => {
  it("nimmt die Farbe zur colorId des Termins", () => {
    expect(eventColor(undefined, "11", LABELS, PALETTE, CAL)).toBe("#dc2127");
    expect(eventColor(undefined, "8", LABELS, PALETTE, CAL)).toBe("#e1e1e1");
  });

  it("bleibt bei der Kalenderfarbe, wenn der Termin keine eigene hat (der Normalfall)", () => {
    expect(eventColor(undefined, undefined, LABELS, PALETTE, CAL)).toBe(CAL);
    expect(eventColor(null, null, LABELS, PALETTE, CAL)).toBe(CAL);
  });

  it("fällt bei unbekannter colorId auf den Kalender zurück statt auf nichts", () => {
    expect(eventColor(undefined, "99", LABELS, PALETTE, CAL)).toBe(CAL);
  });

  it("ignoriert Werte, die keine Zeichenkette sind", () => {
    expect(eventColor(undefined, 11, LABELS, PALETTE, CAL)).toBe(CAL);
    expect(eventColor(undefined, { id: "11" }, LABELS, PALETTE, CAL)).toBe(CAL);
    expect(eventColor(42, undefined, LABELS, PALETTE, CAL)).toBe(CAL);
  });

  it("kommt mit leerer Palette klar – offline darf kein farbloser Balken entstehen", () => {
    expect(eventColor(undefined, "11", {}, {}, CAL)).toBe(CAL);
  });
});

describe("eventColor – die neuen Farben hängen an eventLabelId", () => {
  it("nimmt die Label-Farbe des Kalenders (Flieder, seit Googles Farb-Erweiterung 06/2026)", () => {
    expect(eventColor(FLIEDER, undefined, LABELS, PALETTE, CAL)).toBe("#b39ddb");
  });

  it("Label schlägt colorId: Google löscht colorId beim Wechsel auf eine neue Farbe – steht doch einmal beides da, ist das Label das genauere Feld", () => {
    expect(eventColor(FLIEDER, "11", LABELS, PALETTE, CAL)).toBe("#b39ddb");
  });

  it("fällt bei unbekanntem Label auf die colorId zurück, sonst auf den Kalender", () => {
    expect(eventColor("gibt-es-nicht", "11", LABELS, PALETTE, CAL)).toBe("#dc2127");
    expect(eventColor("gibt-es-nicht", undefined, LABELS, PALETTE, CAL)).toBe(CAL);
  });

  it("leere Label-Liste (Abruf fehlgeschlagen) verhält sich wie vor der Erweiterung", () => {
    expect(eventColor(FLIEDER, "11", {}, PALETTE, CAL)).toBe("#dc2127");
    expect(eventColor(FLIEDER, undefined, {}, PALETTE, CAL)).toBe(CAL);
  });
});
