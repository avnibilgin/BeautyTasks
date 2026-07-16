import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { escapeTriggers, parseQuickEntry } from "../src/quickEntry";

// Der Rundlauf (escapen -> neu parsen) braucht einen festen Bezugspunkt: Montag, 2026-06-15.
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)); });
afterEach(() => { vi.useRealTimers(); });

/** Simuliert den Klick auf das ✕: Auslöser melden lassen, escapen, neu parsen. */
const klick = (raw: string) => {
  const p = parseQuickEntry(raw);
  const next = escapeTriggers(raw, [p.faelligSrc, p.timeSrc]);
  return { next, after: parseQuickEntry(next) };
};

describe("escapeTriggers – Datum", () => {
  it.each([
    ["heute gehe ich duschen", "\\heute gehe ich duschen"],
    ["Zahnarzt morgen", "Zahnarzt \\morgen"],
    ["übermorgen Müll rausbringen", "\\übermorgen Müll rausbringen"],
    ["montag anrufen", "\\montag anrufen"],
    ["Bericht 20.06.2026", "Bericht \\20.06.2026"],
    ["Bericht 2026-12-01", "Bericht \\2026-12-01"],
  ])("%s -> %s (Wort bleibt Text, kein Datum)", (raw, expected) => {
    const { next, after } = klick(raw);
    expect(next).toBe(expected);
    expect(after.faellig).toBe("");
    expect(after.title).toBe(raw);
  });

  // Mehrwortige Auslöser: pro Wort ein Backslash. Anführungszeichen ums Ganze blieben im Titel
  // stehen; ein Backslash nur vorm ersten Wort reicht nicht („monday" allein trifft weiter).
  it.each([
    ["am freitag arzt", "\\am \\freitag arzt"],
    ["next monday meeting", "\\next \\monday meeting"],
    ["in 3 tagen abgeben", "\\in \\3 \\tagen abgeben"],
    ["nächste woche planen", "\\nächste \\woche planen"],
  ])("%s -> %s (mehrwortig)", (raw, expected) => {
    const { next, after } = klick(raw);
    expect(next).toBe(expected);
    expect(after.faellig).toBe("");
    expect(after.title).toBe(raw);
  });

  it("escapt ALLE Vorkommen – „kein Datum\" gilt dem Wort, nicht einem Vorkommen", () => {
    const { next, after } = klick("heute heute anrufen");
    expect(next).toBe("\\heute \\heute anrufen");
    expect(after.faellig).toBe("");
    expect(after.title).toBe("heute heute anrufen");
  });
});

describe("escapeTriggers – Uhrzeit", () => {
  it.each([
    ["Zahnarzt um 20:00", "Zahnarzt \\um \\20:00"],
    ["Meeting 14:15", "Meeting \\14:15"],
    ["call 7pm", "call \\7pm"],
    ["Anruf um 9 uhr", "Anruf \\um \\9 \\uhr"],
  ])("%s -> %s", (raw, expected) => {
    const { next, after } = klick(raw);
    expect(next).toBe(expected);
    expect(after.time).toBe("");
    expect(after.title).toBe(raw);
  });

  it("escapt Datum und Uhrzeit gemeinsam", () => {
    const { next, after } = klick("Zahnarzt morgen um 20:00");
    expect(next).toBe("Zahnarzt \\morgen \\um \\20:00");
    expect(after.faellig).toBe("");
    expect(after.time).toBe("");
  });
});

describe("escapeTriggers – Rückfall und Robustheit", () => {
  // Label MITTEN im mehrwortigen Auslöser: der Parser strippt es vor der Datumsregel, der gemeldete
  // Auslöser trägt dann dessen Lücke („in 3  tagen") und findet sich im Rohtext nicht mehr.
  // Erwartung: Text unverändert -> der Aufrufer leert den Chip wie bisher. Kein Schaden.
  it("lässt den Text unverändert, wenn der Auslöser nicht mehr wörtlich vorkommt", () => {
    const raw = "in 3 #x tagen abgeben";
    const p = parseQuickEntry(raw);
    expect(p.faellig).not.toBe("");            // Datum wurde erkannt …
    expect(escapeTriggers(raw, [p.faelligSrc, p.timeSrc])).toBe(raw);   // … aber nicht escapebar
  });

  it("tut nichts ohne Auslöser", () => {
    expect(escapeTriggers("Milch kaufen", ["", ""])).toBe("Milch kaufen");
  });

  it("escapt bereits Escaptes nicht doppelt", () => {
    expect(escapeTriggers("\\heute anrufen", ["heute"])).toBe("\\heute anrufen");
  });

  it("lässt Labels und Projekte im Titel unberührt", () => {
    const { next, after } = klick("Milch kaufen #einkauf morgen");
    expect(next).toBe("Milch kaufen #einkauf \\morgen");
    expect(after.faellig).toBe("");
    expect(after.tags).toEqual(["einkauf"]);
  });
});
