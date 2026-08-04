import { describe, it, expect } from "vitest";
import { emptyGCalCache, calIndex, seedGCalCache, resignLegacySignature } from "../src/gcalSync";
import { Task } from "../src/types";

const CAL = "230e5579d262f3aa0e0f43fd5c87a57e@group.calendar.google.com";
const OTHER = "zweiter@group.calendar.google.com";

const task = (over: Partial<Task> = {}): Task => ({
  id: "t-1", path: "BeautyTasks/Items/t-1.md", title: "Zahnarzt",
  status: "todo", priority: "none", labels: [], due: "2026-10-03",
  ...over,
} as Task);

const fm = (map: Record<string, Record<string, unknown>>) =>
  (path: string): Record<string, unknown> | null => map[path] ?? null;

describe("calIndex – Kalender-ID einmal statt in jedem Eintrag", () => {
  it("legt neue IDs an und gibt bekannte unverändert zurück", () => {
    const c = emptyGCalCache();
    expect(calIndex(c, CAL)).toBe(0);
    expect(calIndex(c, OTHER)).toBe(1);
    expect(calIndex(c, CAL)).toBe(0);      // nicht doppelt anlegen
    expect(c.cals).toEqual([CAL, OTHER]);
  });

  it("liefert bei jedem Aufruf eine frische, unabhängige Cache-Instanz", () => {
    const a = emptyGCalCache(); const b = emptyGCalCache();
    calIndex(a, CAL);
    expect(b.cals).toEqual([]);
  });
});

describe("resignLegacySignature – Altsignatur auf den Index umschreiben", () => {
  it("ersetzt die Kalender-ID am Ende durch den Index", () => {
    const alt = JSON.stringify(["Zahnarzt", "2026-10-03", null, null, "", CAL]);
    expect(resignLegacySignature(alt, 0)).toBe(
      JSON.stringify(["Zahnarzt", "2026-10-03", null, null, "", 0]));
  });

  it("lässt die übrigen fünf Felder unangetastet", () => {
    const alt = JSON.stringify(["Titel", "2026-01-01", "09:30", 45, "PT15M", CAL]);
    expect(JSON.parse(resignLegacySignature(alt, 3))).toEqual(
      ["Titel", "2026-01-01", "09:30", 45, "PT15M", 3]);
  });

  it("gibt Unlesbares unverändert zurück – kostet einen Push zu viel, mehr nicht", () => {
    expect(resignLegacySignature("kein json", 0)).toBe("kein json");
    expect(resignLegacySignature(JSON.stringify(["zu", "kurz"]), 0)).toBe(JSON.stringify(["zu", "kurz"]));
    expect(resignLegacySignature(JSON.stringify({ a: 1 }), 0)).toBe(JSON.stringify({ a: 1 }));
  });
});

describe("seedGCalCache – Vorbelegung statt Massen-Push", () => {
  it("übernimmt Aufgaben, die laut Frontmatter schon einmal gepusht wurden", () => {
    const c = emptyGCalCache();
    const t = task();
    const n = seedGCalCache(c, [t], fm({
      [t.path]: { gcal_event_id: "ev-1", gcal_calendar_id: CAL },
    }));
    expect(n).toBe(1);
    expect(c.links["t-1"].e).toBe("ev-1");
    expect(c.cals[c.links["t-1"].c]).toBe(CAL);
  });

  it("schreibt den AKTUELLEN Stand als Signatur – sonst pusht der erste Lauf doch", () => {
    const c = emptyGCalCache();
    const t = task({ due: "2026-10-03", dueTime: "09:30" } as Partial<Task>);
    seedGCalCache(c, [t], fm({ [t.path]: { gcal_event_id: "ev-1", gcal_calendar_id: CAL } }));
    const link = c.links["t-1"];
    expect(link.d).toBe("2026-10-03");
    expect(link.t).toBe("09:30");
    // Reihenfolge der Signatur: Titel, due, dueTime, Dauer, Erinnerungen, Kalender-INDEX.
    expect(JSON.parse(link.s)).toEqual(["Zahnarzt", "2026-10-03", "09:30", null, "", 0]);
  });

  it("überspringt Aufgaben ohne Datum – die gehören gar nicht in den Kalender", () => {
    const c = emptyGCalCache();
    const t = task({ due: undefined } as Partial<Task>);
    expect(seedGCalCache(c, [t], fm({ [t.path]: { gcal_event_id: "ev-1", gcal_calendar_id: CAL } }))).toBe(0);
  });

  it("überspringt Aufgaben, die noch nie gepusht wurden", () => {
    const c = emptyGCalCache();
    const t = task();
    expect(seedGCalCache(c, [t], fm({ [t.path]: {} }))).toBe(0);
    expect(seedGCalCache(c, [t], fm({}))).toBe(0);
  });

  it("überspringt halbe Angaben – ohne Kalender ist die Event-ID nicht adressierbar", () => {
    const c = emptyGCalCache();
    const t = task();
    expect(seedGCalCache(c, [t], fm({ [t.path]: { gcal_event_id: "ev-1" } }))).toBe(0);
    expect(seedGCalCache(c, [t], fm({ [t.path]: { gcal_calendar_id: CAL } }))).toBe(0);
  });

  it("ignoriert Frontmatter-Werte, die keine Zeichenketten sind", () => {
    const c = emptyGCalCache();
    const t = task();
    expect(seedGCalCache(c, [t], fm({ [t.path]: { gcal_event_id: 42, gcal_calendar_id: CAL } }))).toBe(0);
  });

  it("teilt sich einen Index, wenn mehrere Aufgaben im selben Kalender liegen", () => {
    const c = emptyGCalCache();
    const a = task({ id: "t-1", path: "a.md" } as Partial<Task>);
    const b = task({ id: "t-2", path: "b.md" } as Partial<Task>);
    seedGCalCache(c, [a, b], fm({
      "a.md": { gcal_event_id: "ev-a", gcal_calendar_id: CAL },
      "b.md": { gcal_event_id: "ev-b", gcal_calendar_id: CAL },
    }));
    expect(c.cals).toEqual([CAL]);              // 90 Zeichen einmal, nicht zweimal
    expect(c.links["t-1"].c).toBe(0);
    expect(c.links["t-2"].c).toBe(0);
  });
});
