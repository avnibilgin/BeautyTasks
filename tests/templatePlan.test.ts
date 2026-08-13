import { describe, it, expect } from "vitest";
import { DatedItem, planTemplateDates, shiftReminder, templateShift, templateSpan } from "../src/templatePlan";

/** Eine Vorlagen-Aufgabe. Nur die Felder, die der Planer anfasst. */
function mk(path: string, due: string | null, scheduled: string | null = null, reminders: string[] = []): DatedItem {
  return { path, due, scheduled, reminders };
}

// Die Beispielvorlage „Urlaub vorbereiten“: Reisepass am 1. Juni, Koffer am 13., Übergabe am 14.
// Sie merkt sich nicht den Juni, sondern die Abstände 0 / +12 / +13.
const urlaub: DatedItem[] = [
  mk("T/Reisepass.md", "2026-06-01"),
  mk("T/Koffer.md", "2026-06-13"),
  mk("T/Uebergabe.md", "2026-06-14"),
];
const due = (m: Map<string, { due: string | null }>, p: string) => m.get(p)!.due;

describe("templateSpan – die Spanne des Baums", () => {
  it("nimmt frühestes und spätestes Datum über alle Aufgaben", () => {
    expect(templateSpan(urlaub)).toEqual({ first: "2026-06-01", last: "2026-06-14" });
  });

  it("zählt auch die Deadline (scheduled), nicht nur die Fälligkeit", () => {
    expect(templateSpan([mk("a", "2026-06-10", "2026-06-20")])).toEqual({ first: "2026-06-10", last: "2026-06-20" });
  });

  it("übergeht Aufgaben ohne Datum", () => {
    expect(templateSpan([mk("a", null), mk("b", "2026-06-05"), mk("c", null)]))
      .toEqual({ first: "2026-06-05", last: "2026-06-05" });
  });

  it("ohne jedes Datum: null – es gibt nichts zu verankern", () => {
    expect(templateSpan([mk("a", null), mk("b", null)])).toBeNull();
  });

  it("lässt absolute Erinnerungen die Spanne NICHT nach vorn ziehen", () => {
    // Die Erinnerung liegt vor der ersten Aufgabe. Zählte sie mit, verschöbe „Start am“ den
    // Beginn der ARBEIT – gemeint ist aber der erste Termin, nicht der erste Piepton.
    expect(templateSpan([mk("a", "2026-06-10", null, ["2026-06-01T09:00"])]))
      .toEqual({ first: "2026-06-10", last: "2026-06-10" });
  });
});

describe("templateShift – um wie viele Tage der Baum wandert", () => {
  it("„Start am“: das früheste Datum landet auf dem Anker", () => {
    expect(templateShift(urlaub, "2026-09-01", "start")).toBe(92);   // 1. Juni -> 1. September
  });

  it("„Fertig bis“: das späteste Datum landet auf dem Anker", () => {
    expect(templateShift(urlaub, "2026-09-20", "end")).toBe(98);     // 14. Juni -> 20. September
  });

  it("ohne Datum im Baum: null", () => {
    expect(templateShift([mk("a", null)], "2026-09-01", "start")).toBeNull();
  });

  it("rückwärts ist erlaubt und wird nicht abgefangen", () => {
    expect(templateShift(urlaub, "2026-05-01", "start")).toBe(-31);
  });
});

describe("planTemplateDates – der fertige Plan", () => {
  it("„Start am 1. September“ ergibt 1.9. / 13.9. / 14.9.", () => {
    const p = planTemplateDates(urlaub, "2026-09-01", "start");
    expect(due(p, "T/Reisepass.md")).toBe("2026-09-01");
    expect(due(p, "T/Koffer.md")).toBe("2026-09-13");
    expect(due(p, "T/Uebergabe.md")).toBe("2026-09-14");
  });

  it("„Fertig bis 20. September“ ergibt 7.9. / 19.9. / 20.9.", () => {
    const p = planTemplateDates(urlaub, "2026-09-20", "end");
    expect(due(p, "T/Reisepass.md")).toBe("2026-09-07");
    expect(due(p, "T/Koffer.md")).toBe("2026-09-19");
    expect(due(p, "T/Uebergabe.md")).toBe("2026-09-20");
  });

  it("hält den Abstand zwischen Fälligkeit und Deadline", () => {
    const p = planTemplateDates([mk("a", "2026-06-01", "2026-06-08")], "2026-09-01", "start");
    expect(p.get("a")).toMatchObject({ due: "2026-09-01", scheduled: "2026-09-08" });
  });

  it("erfindet für undatierte Aufgaben kein Datum", () => {
    const p = planTemplateDates([mk("a", "2026-06-01"), mk("b", null)], "2026-09-01", "start");
    expect(p.get("b")).toMatchObject({ due: null, scheduled: null });
  });

  it("ohne Anker bleibt alles, wie es ist", () => {
    const p = planTemplateDates(urlaub, null, "start");
    expect(due(p, "T/Koffer.md")).toBe("2026-06-13");
  });

  it("ohne Datum im Baum bleibt alles, wie es ist", () => {
    const p = planTemplateDates([mk("a", null, null, ["-30m"])], "2026-09-01", "start");
    expect(p.get("a")).toMatchObject({ due: null, scheduled: null, reminders: ["-30m"] });
  });

  it("gibt die Erinnerungsliste als KOPIE heraus (kein geteiltes Array)", () => {
    const src = mk("a", null, null, ["-30m"]);
    const p = planTemplateDates([src], null, "start");
    expect(p.get("a")!.reminders).not.toBe(src.reminders);
  });

  it("über einen Sommerzeitwechsel hinweg bleibt der Abstand ganztägig", () => {
    // 1. März -> 1. Juni überspringt die Umstellung Ende März. Über Millisekunden gerechnet
    // landete die zweite Aufgabe einen Tag daneben.
    const p = planTemplateDates([mk("a", "2026-03-01"), mk("b", "2026-03-15")], "2026-06-01", "start");
    expect(due(p, "a")).toBe("2026-06-01");
    expect(due(p, "b")).toBe("2026-06-15");
  });
});

describe("shiftReminder – Erinnerungen wandern mit", () => {
  it("relative bleiben unangetastet (sie hängen ohnehin an der Fälligkeit)", () => {
    for (const r of ["-0m", "-30m", "-1h", "-2d"]) expect(shiftReminder(r, 92)).toBe(r);
  });

  it("absolute bekommen dieselbe Verschiebung wie die Aufgaben", () => {
    expect(shiftReminder("2026-06-14T09:00", 98)).toBe("2026-09-20T09:00");
  });

  it("behält dabei die Uhrzeit", () => {
    expect(shiftReminder("2026-06-14T07:45", 1)).toBe("2026-06-15T07:45");
  });

  it("kommt mit einem datumsreinen Wert zurecht (Bestandsdaten)", () => {
    expect(shiftReminder("2026-06-14", 1)).toBe("2026-06-15");
  });

  it("lässt Unlesbares unverändert – was wir nicht verstehen, ändern wir nicht", () => {
    for (const r of ["", "irgendwas", "+30m", "2026-13-99"]) expect(shiftReminder(r, 5)).toBe(r);
  });
});
