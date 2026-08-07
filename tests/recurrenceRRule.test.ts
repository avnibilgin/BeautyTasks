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

  it("zählt COUNT über die Kette herunter, statt jedes Mal von vorn zu beginnen", () => {
    // Jede neue Aufgabe verankert die Regel an ihrem eigenen Datum. Bliebe COUNT stehen, liefe
    // die Zählung nie ab. Deshalb trägt die Folgeaufgabe eine um eins verringerte Regel.
    const step = (rule: string, from: string) =>
      nextInstance(task({ recurrence: rule, due: from, recurBasis: "due" }), from);

    const a = step("FREQ=WEEKLY;COUNT=3", "2026-06-01");
    expect(a).toEqual({ due: "2026-06-08", scheduled: null, recurrence: "FREQ=WEEKLY;COUNT=2" });
    const b = step(a!.recurrence, a!.due!);
    expect(b).toEqual({ due: "2026-06-15", scheduled: null, recurrence: "FREQ=WEEKLY;COUNT=1" });
    // COUNT=1: die eine erlaubte Wiederholung IST der Anker – also endet die Kette hier.
    expect(step(b!.recurrence, b!.due!)).toBeNull();
  });

  it("lässt die Regel unangetastet, wo es nichts herunterzuzählen gibt", () => {
    const r = nextInstance(task({ recurrence: "FREQ=WEEKLY;BYDAY=MO", due: "2026-06-01" }), "2026-06-01");
    expect(r?.recurrence).toBe("FREQ=WEEKLY;BYDAY=MO");
    // UNTIL braucht kein Herunterzählen – ein absolutes Datum gilt für jede Instanz gleich.
    const u = nextInstance(task({ recurrence: "FREQ=WEEKLY;UNTIL=20260615T000000Z", due: "2026-06-01" }), "2026-06-01");
    expect(u?.recurrence).toBe("FREQ=WEEKLY;UNTIL=20260615T000000Z");
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

describe("Regel ohne Datum", () => {
  it("verschwindet beim Abhaken nicht ersatzlos, sondern rechnet ab heute", () => {
    // Diesen Zustand laesst die Oberflaeche nicht mehr zu (chips.keepRecurrenceAnchored), in
    // Bestandsdaten steht er aber: Frueher liess sich das Datum leeren, ohne dass die Regel
    // mitging. Beim Abhaken entstand dann NICHTS - die Aufgabe war einfach weg.
    const r = nextInstance(task({ recurrence: "FREQ=MONTHLY;BYMONTHDAY=15", due: null, scheduled: null }), "2026-08-07");
    expect(r?.due).toBe("2026-08-15");
  });

  it("nimmt den naechsten Termin, nicht heute – erledigt ist erledigt", () => {
    const r = nextInstance(task({ recurrence: "FREQ=DAILY", due: null, scheduled: null }), "2026-08-07");
    expect(r?.due).toBe("2026-08-08");
  });

  it("bleibt null, wenn die Regel selbst nichts hergibt", () => {
    expect(nextInstance(task({ recurrence: "manchmal", due: null, scheduled: null }), "2026-08-07")).toBeNull();
  });
});
