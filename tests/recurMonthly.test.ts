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
