import { describe, it, expect } from "vitest";
import { parseRecurrence, isValidRecurrence, nextInstance, toRRuleString, legacyToRRule } from "../src/recurrence";
import { Task } from "../src/types";

const task = (p: Partial<Task>): Task => ({
  id: "t1", path: "x.md", title: "T", status: "todo", priority: "normal",
  due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
  project: null, area: null, parent: null, labels: [], recurrence: null, recurBasis: "due",
  created: "2026-01-01", completed: null, cancelled: null, externalId: null, ...p,
});
const due = (rule: string, from: string, today: string, basis: "due" | "done" = "due") =>
  nextInstance(task({ recurrence: rule, due: from, recurBasis: basis }), today)?.due ?? null;

/**
 * RRULE lesen und rechnen (RFC 5545). Die alte Schreibweise „every 3 months" bleibt gültig und
 * wird von tests/recurrence.test.ts abgesichert – hier steht nur, was durch RRULE dazukommt.
 */
describe("RRULE einlesen", () => {
  it("nimmt die Regel mit und ohne Präfix", () => {
    expect(parseRecurrence("FREQ=WEEKLY")).toEqual({ n: 1, unit: "week" });
    expect(parseRecurrence("RRULE:FREQ=MONTHLY;INTERVAL=3")).toEqual({ n: 3, unit: "month" });
  });

  it("überspringt DTSTART – der Anker kommt aus der Aufgabe, nicht aus der Regel", () => {
    // Genau die Form, die TaskForge beim Bearbeiten schreibt (belegt am 2026-08-07).
    expect(parseRecurrence("DTSTART:20260821;FREQ=YEARLY;INTERVAL=1")).toEqual({ n: 1, unit: "year" });
  });

  it("verkürzt NICHT auf ein Intervall, was mehr ist als eines", () => {
    // Gültige Regeln – aber „jeden Montag" ist nicht dasselbe wie „jede Woche".
    // null heisst hier „nicht auf {n,unit} reduzierbar", nicht „ungültig".
    expect(parseRecurrence("FREQ=WEEKLY;BYDAY=MO")).toBeNull();
    expect(parseRecurrence("FREQ=MONTHLY;BYDAY=-1FR")).toBeNull();
    expect(isValidRecurrence("FREQ=WEEKLY;BYDAY=MO")).toBe(true);
    expect(isValidRecurrence("FREQ=MONTHLY;BYDAY=-1FR")).toBe(true);
  });

  it("weist Unlesbares ab, statt es zu raten", () => {
    expect(isValidRecurrence("manchmal")).toBe(false);
    expect(isValidRecurrence("FREQ=BLUBB")).toBe(false);
    expect(nextInstance(task({ recurrence: "manchmal", due: "2026-06-01" }), "2026-06-01")).toBeNull();
  });
});

describe("Regeln, die unser altes Modell nicht konnte", () => {
  it("nur werktags", () => {
    // Freitag 2026-06-05 -> nächster Werktag ist Montag, nicht Samstag.
    expect(due("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", "2026-06-05", "2026-06-05")).toBe("2026-06-08");
  });

  it("jeder zweite Dienstag", () => {
    expect(due("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU", "2026-06-02", "2026-06-02")).toBe("2026-06-16");
  });

  it("letzter Freitag im Monat", () => {
    expect(due("FREQ=MONTHLY;BYDAY=-1FR", "2026-06-26", "2026-06-26")).toBe("2026-07-31");
  });

  it("endet bei UNTIL – danach gibt es keine nächste Instanz", () => {
    expect(due("FREQ=WEEKLY;UNTIL=20260615T000000Z", "2026-06-01", "2026-06-01")).toBe("2026-06-08");
    expect(due("FREQ=WEEKLY;UNTIL=20260615T000000Z", "2026-06-15", "2026-06-15")).toBeNull();
  });

  it("lehnt COUNT ab, statt eine endlose Kette daraus zu machen", () => {
    // Wir wiederholen über eine KETTE: jede neue Aufgabe trägt die Regel mit ihrem eigenen
    // Datum als Anker. Eine Zählung „noch n-mal" begänne dadurch jedes Mal von vorn und liefe
    // nie ab. Ein Ende zu versprechen, das nie kommt, wäre schlimmer als die Regel abzulehnen.
    expect(isValidRecurrence("FREQ=WEEKLY;COUNT=2")).toBe(false);
    expect(due("FREQ=WEEKLY;COUNT=2", "2026-06-01", "2026-06-01")).toBeNull();
    // UNTIL ist davon nicht betroffen – ein absolutes Datum gilt für jede Instanz gleich.
    expect(isValidRecurrence("FREQ=WEEKLY;UNTIL=20260615T000000Z")).toBe(true);
  });
});

describe("recur_basis wirkt auch bei RRULE", () => {
  it("„due“ folgt dem Kalender, „done“ dem Tag der Erledigung", () => {
    // Fällig war der 01.06., erledigt wird erst am 10.06.
    expect(due("FREQ=WEEKLY", "2026-06-01", "2026-06-10", "due")).toBe("2026-06-15");
    expect(due("FREQ=WEEKLY", "2026-06-01", "2026-06-10", "done")).toBe("2026-06-17");
  });

  it("„done“ behält den Abstand auch bei komplexen Regeln", () => {
    // Ab Erledigung (Mittwoch) der nächste Werktag: Donnerstag.
    expect(due("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR", "2026-06-01", "2026-06-10", "done")).toBe("2026-06-11");
  });
});

describe("Sommerzeit", () => {
  it("verschiebt Termine über die Zeitumstellung hinweg nicht", () => {
    // Umstellung in Europa: 2026-03-29. Täglich darüber hinweg muss Tag für Tag zählen.
    expect(due("FREQ=DAILY", "2026-03-28", "2026-03-28")).toBe("2026-03-29");
    expect(due("FREQ=DAILY", "2026-03-29", "2026-03-29")).toBe("2026-03-30");
    expect(due("every day", "2026-03-28", "2026-03-28")).toBe("2026-03-29");
  });
});

describe("Schreibformat und Umstellung", () => {
  it("schreibt RRULE, INTERVAL=1 bleibt weg", () => {
    expect(toRRuleString({ n: 1, unit: "week" })).toBe("FREQ=WEEKLY");
    expect(toRRuleString({ n: 3, unit: "month" })).toBe("FREQ=MONTHLY;INTERVAL=3");
  });

  it("stellt die alte Schreibweise um", () => {
    expect(legacyToRRule("every day")).toBe("FREQ=DAILY");
    expect(legacyToRRule("every 2 weeks")).toBe("FREQ=WEEKLY;INTERVAL=2");
  });

  it("lässt in Ruhe, was nicht umzustellen ist – das macht die Migration wiederholbar", () => {
    expect(legacyToRRule("FREQ=WEEKLY")).toBeNull();          // schon umgestellt
    expect(legacyToRRule("FREQ=MONTHLY;BYDAY=-1FR")).toBeNull();
    expect(legacyToRRule("manchmal")).toBeNull();             // nie von uns geschrieben
    expect(legacyToRRule("")).toBeNull();
  });

  it("die Umstellung ändert die Bedeutung nicht", () => {
    // Alte und neue Schreibweise müssen denselben nächsten Termin liefern.
    for (const [alt, neu] of [["every day", "FREQ=DAILY"], ["every 3 months", "FREQ=MONTHLY;INTERVAL=3"]]) {
      expect(due(neu, "2026-06-01", "2026-06-01")).toBe(due(alt, "2026-06-01", "2026-06-01"));
    }
  });
});
