import { describe, it, expect } from "vitest";
import { parseQuickEntry } from "../src/quickEntry";

const NOW = new Date("2026-06-15T09:00:00");   // Montag
const rec = (raw: string) => parseQuickEntry(raw, [], NOW).recurrence;

/**
 * Monatsregeln in der Texterkennung. Sie stehen VOR den Wochenregeln, weil „jeden zweiten
 * Dienstag im Monat" monatlich ist und nicht zweiwöchentlich – sonst griffe die Wochenregel
 * zuerst und der Zusatz „im Monat" bliebe wirkungslos im Titel stehen.
 */
describe("Wiederholung – Monatsregeln", () => {
  it.each([
    ["letzter freitag im monat abrechnung", "FREQ=MONTHLY;BYDAY=-1FR"],
    ["jeden letzten freitag im monat abrechnung", "FREQ=MONTHLY;BYDAY=-1FR"],
    ["erster montag im monat team", "FREQ=MONTHLY;BYDAY=1MO"],
    ["jeden zweiten dienstag im monat jour fixe", "FREQ=MONTHLY;BYDAY=2TU"],
    ["last friday of the month payroll", "FREQ=MONTHLY;BYDAY=-1FR"],
    ["first monday of each month team", "FREQ=MONTHLY;BYDAY=1MO"],
  ])("%s -> %s", (raw, rule) => expect(rec(raw)).toBe(rule));

  it.each([
    ["am 15. jedes monats miete", "FREQ=MONTHLY;BYMONTHDAY=15"],
    ["am 1. jedes monats sparen", "FREQ=MONTHLY;BYMONTHDAY=1"],
    ["on the 15th of each month rent", "FREQ=MONTHLY;BYMONTHDAY=15"],
  ])("%s -> %s", (raw, rule) => expect(rec(raw)).toBe(rule));

  it("verwechselt Monats- und Wochenregel nicht", () => {
    // Ohne „im Monat" ist es die Wochenregel – der Zusatz entscheidet.
    expect(rec("jeden zweiten dienstag standup")).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU");
    expect(rec("jeden zweiten dienstag im monat jour fixe")).toBe("FREQ=MONTHLY;BYDAY=2TU");
  });

  it("lässt harmlose Sätze in Ruhe", () => {
    expect(rec("monatsbericht schreiben")).toBeNull();
    expect(rec("this month review")).toBeNull();
  });
});

/**
 * Die REGEL bestimmt den ersten Termin, nicht die Datumsphrase.
 *
 * Vorher setzte die Datumsregel bei „letzter Freitag im Monat" schlicht den nächsten Freitag –
 * die erste Instanz lag also oft in der falschen Woche und war schlicht falsch. Jetzt wird das
 * gefundene Datum an der Regel ausgerichtet (recurrence.firstOccurrence).
 */
describe("Erste Fälligkeit folgt der Regel", () => {
  const due = (raw: string) => parseQuickEntry(raw, [], NOW).faellig;

  it("„letzter Freitag im Monat“ landet auf dem letzten Freitag, nicht auf dem nächsten", () => {
    // NOW ist Montag, 15.06.2026. Nächster Freitag waere der 19.06. – letzter Freitag im Juni
    // ist aber der 26.06.
    expect(due("letzter freitag im monat abrechnung")).toBe("2026-06-26");
  });

  it("„erster Montag im Monat“ springt in den Folgemonat, wenn der erste schon vorbei ist", () => {
    // Der erste Montag im Juni war der 01.06. und liegt hinter uns -> 06.07.
    expect(due("erster montag im monat team")).toBe("2026-07-06");
  });

  it("„am 15. jedes Monats“ trifft den 15., auch ohne Datum im Text", () => {
    expect(due("am 15. jedes monats miete")).toBe("2026-06-15");
    expect(due("am 1. jedes monats sparen")).toBe("2026-07-01");   // der 1. Juni ist vorbei
  });

  it("ändert nichts, wo die Regel keine Tage vorschreibt", () => {
    expect(due("jeden montag sport")).toBe("2026-06-22");
    expect(due("alle 3 tage giessen")).toBe("2026-06-15");   // ohne Datumsphrase: ab heute
  });
});
