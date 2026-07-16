import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseQuickEntry, escapeTriggers, applyQuickEntry, emptyQuickEntryState, QuickEntryFields, QuickEntryOptions } from "../src/quickEntry";
import { nextInstance, parseRecurrence } from "../src/recurrence";
import type { Task } from "../src/types";

// parseQuickEntry rechnet relative Phrasen gegen die Systemuhr -> hier einfrieren (Montag).
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)); });
afterEach(() => { vi.useRealTimers(); });

const HEUTE = "2026-06-15";
const fields = (over: Partial<QuickEntryFields> = {}): QuickEntryFields =>
  ({ due: null, dueTime: null, priority: "normal", labels: [], project: null, recurrence: null, ...over });
const opts = (over: Partial<QuickEntryOptions> = {}): QuickEntryOptions =>
  ({ enabled: true, frozen: false, duePinned: false, today: HEUTE, ...over });

describe("Wiederholung – Erkennung", () => {
  it.each([
    ["jeden tag sport", "every day"],
    ["täglich sport", "every day"],
    ["taeglich sport", "every day"],       // ohne Umlaut, wird real so getippt
    ["daily standup", "every day"],
    ["jede woche einkaufen", "every week"],
    ["wöchentlich putzen", "every week"],
    ["jeden monat miete", "every month"],
    ["jedes jahr tüv", "every year"],
    ["alle 3 tage gießen", "every 3 days"],
    ["alle 2 wochen müll", "every 2 weeks"],
    ["alle 3 monate zahnarzt", "every 3 months"],
    ["every 2 days water", "every 2 days"],
  ])("%s -> %s", (raw, rule) => {
    expect(parseQuickEntry(raw).recurrence).toBe(rule);
  });

  it("entfernt die Phrase aus dem Titel", () => {
    expect(parseQuickEntry("jeden tag sport").title).toBe("sport");
    expect(parseQuickEntry("alle 3 tage gießen").title).toBe("gießen");
  });

  // Der Chip und recurrence.ts sind die Abnehmer: was der Parser liefert, muessen sie verstehen.
  it("erzeugt ausschließlich Regeln, die recurrence.ts akzeptiert", () => {
    for (const raw of ["jeden tag", "täglich", "jede woche", "alle 3 tage", "alle 2 wochen",
                       "jeden monat", "alle 3 monate", "jedes jahr", "every 2 days"]) {
      const r = parseQuickEntry(raw).recurrence;
      expect(r, raw).not.toBeNull();
      expect(parseRecurrence(r!), raw).not.toBeNull();
    }
  });
});

describe("Wiederholung – Wochentag (jeden Montag)", () => {
  // Das Regelmodell {n, unit} in recurrence.ts kennt keine Wochentage – es braucht sie auch nicht:
  // „every week" + Faelligkeit am naechsten Montag ist dasselbe, weil advance() von der
  // Faelligkeit aus weiterzaehlt. Deshalb schluckt die Regel nur das Vorwort.
  it.each([
    ["jeden montag sport", "2026-06-22"],       // Testdatum ist Montag, 15.06. -> naechster Montag
    ["jeden Freitag Müll", "2026-06-19"],
    ["every monday standup", "2026-06-22"],
  ])("%s -> woechentlich, verankert am Wochentag", (raw, due) => {
    const r = parseQuickEntry(raw);
    expect(r.recurrence).toBe("every week");
    expect(r.faellig).toBe(due);
  });

  it("laesst den Rest des Titels in Ruhe und vertraegt eine Uhrzeit", () => {
    const r = parseQuickEntry("jeden montag um 20:00 sport");
    expect(r.recurrence).toBe("every week");
    expect(r.faellig).toBe("2026-06-22");
    expect(r.time).toBe("20:00");
    expect(r.title).toBe("sport");
  });

  it("kehrt tatsaechlich montags wieder", () => {
    const p = parseQuickEntry("jeden montag sport");
    const task = { recurrence: p.recurrence, recurBasis: "due", due: p.faellig, scheduled: null } as unknown as Task;
    const next = nextInstance(task, p.faellig);
    expect(next?.due).toBe("2026-06-29");                                  // + 1 Woche
    expect(new Date(next!.due + "T00:00:00").getDay()).toBe(1);            // wieder Montag
  });

  it("verwechselt einen blossen Wochentag nicht mit einer Wiederholung", () => {
    const r = parseQuickEntry("Montag Sport");
    expect(r.recurrence).toBeNull();
    expect(r.faellig).toBe("2026-06-22");
  });

  it("das ✕ macht die ganze Phrase zu Text, nicht nur das Vorwort", () => {
    // Nur „jeden" zu escapen liesse den Montag als Datum stehen – aber mit dem Titel „jeden sport".
    const p = parseQuickEntry("jeden montag sport");
    expect(p.recurSrc).toBe("jeden montag");
    const next = escapeTriggers("jeden montag sport", [p.recurSrc]);
    expect(next).toBe("\\jeden \\montag sport");
    const after = parseQuickEntry(next);
    expect(after.recurrence).toBeNull();
    expect(after.title).toBe("jeden montag sport");
  });
});

describe("Wiederholung – was KEINE Wiederholung ist", () => {
  // „alle"/„jeden" ohne Einheit dahinter ist normaler Text – sonst wäre der Parser unbrauchbar.
  it.each([
    "alle Rechnungen zahlen",
    "jeden Kunden anrufen",
    "Tag der Arbeit planen",
    "3 tage frei",
  ])("%s bleibt unberührt", (raw) => {
    const r = parseQuickEntry(raw);
    expect(r.recurrence).toBeNull();
    expect(r.title).toBe(raw);
  });

  it("verwechselt „in 3 tagen\" nicht mit einer Wiederholung", () => {
    const r = parseQuickEntry("in 3 tagen abgeben");
    expect(r.recurrence).toBeNull();
    expect(r.faellig).toBe("2026-06-18");
  });

  it("lässt sich escapen", () => {
    const r = parseQuickEntry("\\jeden \\tag sport");
    expect(r.recurrence).toBeNull();
    expect(r.title).toBe("jeden tag sport");
  });
});

describe("Wiederholung – Zusammenspiel", () => {
  it("greift vor den Datumsregeln, das Datum bleibt erhalten", () => {
    const r = parseQuickEntry("alle 3 tage ab morgen gießen");
    expect(r.recurrence).toBe("every 3 days");
    expect(r.faellig).toBe("2026-06-16");
  });

  it("verträgt sich mit Uhrzeit, Label und Priorität", () => {
    const r = parseQuickEntry("jeden tag um 20:00 sport #fit p1");
    expect(r.recurrence).toBe("every day");
    expect(r.time).toBe("20:00");
    expect(r.tags).toEqual(["fit"]);
    expect(r.priority).toBe("highest");
    expect(r.title).toBe("sport");
  });
});

describe("Wiederholung – braucht einen Anker (applyQuickEntry)", () => {
  // Ohne Datum liefert recurrence.ts keine naechste Instanz -> der Chip zeigte „Taeglich" an,
  // ohne dass je etwas wiederkehrt.
  it("setzt heute, wenn kein Datum im Text steht", () => {
    const r = applyQuickEntry("jeden tag sport", fields(), emptyQuickEntryState(), opts());
    expect(r.fields.recurrence).toBe("every day");
    expect(r.fields.due).toBe(HEUTE);
  });

  it("lässt ein genanntes Datum gewinnen", () => {
    const r = applyQuickEntry("alle 3 tage ab morgen gießen", fields(), emptyQuickEntryState(), opts());
    expect(r.fields.due).toBe("2026-06-16");
  });

  it("erfindet bei manuell geleertem Datum nichts", () => {
    const r = applyQuickEntry("jeden tag sport", fields(), emptyQuickEntryState(), opts({ duePinned: true }));
    expect(r.fields.recurrence).toBe("every day");
    expect(r.fields.due).toBeNull();
  });

  it("meldet den Auslöser für das ✕ am Chip", () => {
    const r = applyQuickEntry("jeden tag sport", fields(), emptyQuickEntryState(), opts());
    expect(r.state.recurSrc).toBe("jeden tag");
  });
});

describe("Wiederholung – ✕ am Chip", () => {
  it("escapt den Auslöser, das Wort bleibt im Titel", () => {
    const p = parseQuickEntry("jeden tag sport");
    const next = escapeTriggers("jeden tag sport", [p.recurSrc]);
    expect(next).toBe("\\jeden \\tag sport");
    const after = parseQuickEntry(next);
    expect(after.recurrence).toBeNull();
    expect(after.title).toBe("jeden tag sport");
  });

  it("funktioniert auch mit Zahl", () => {
    const p = parseQuickEntry("alle 3 tage gießen");
    const next = escapeTriggers("alle 3 tage gießen", [p.recurSrc]);
    expect(next).toBe("\\alle \\3 \\tage gießen");
    expect(parseQuickEntry(next).recurrence).toBeNull();
  });
});
