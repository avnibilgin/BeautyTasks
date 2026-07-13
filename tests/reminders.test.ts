import { describe, it, expect, beforeEach } from "vitest";
import { parseReminder, formatReminder, resolveReminders } from "../src/reminders";
import { Task } from "../src/types";
import { setLocale } from "../src/i18n";

beforeEach(() => setLocale("en"));   // Kanon-Locale für deterministische Ausgaben

/** Minimal-Task mit sinnvollen Defaults; nur relevante Felder überschreiben. */
function mk(p: Partial<Task>): Task {
  return {
    id: "t1", path: "x.md", title: "x", status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null,
    start: null, project: null, area: null, parent: null, labels: [],
    recurrence: null, recurBasis: "due", created: "", completed: null, cancelled: null,
    externalId: null, reminders: [], ...p,
  };
}

describe("parseReminder", () => {
  it("relative Einheiten m/h/d in Minuten", () => {
    expect(parseReminder("-0m")).toEqual({ rel: 0 });
    expect(parseReminder("-30m")).toEqual({ rel: 30 });
    expect(parseReminder("-1h")).toEqual({ rel: 60 });
    expect(parseReminder("-2d")).toEqual({ rel: 2880 });
  });
  it("absolutes ISO-Datum (mit/ohne Uhrzeit)", () => {
    expect(parseReminder("2026-07-05T09:00")).toEqual({ abs: "2026-07-05T09:00" });
    expect(parseReminder("2026-07-05")).toEqual({ abs: "2026-07-05" });
  });
  it("ungültig -> null", () => {
    expect(parseReminder("30m")).toBeNull();     // ohne Minus
    expect(parseReminder("-5w")).toBeNull();     // unbekannte Einheit
    expect(parseReminder("morgen")).toBeNull();
  });
});

describe("formatReminder", () => {
  it("relativ: 0 / min / h / Tage", () => {
    expect(formatReminder("-0m")).toBe("At time of task");
    expect(formatReminder("-30m")).toBe("30 min before");
    expect(formatReminder("-1h")).toBe("1 h before");
    expect(formatReminder("-1d")).toBe("1 day before");
    expect(formatReminder("-2d")).toBe("2 days before");
  });
  it("absolut: als Datum/Zeit", () => {
    expect(formatReminder("2026-07-05T09:00")).toBe(formatReminder("2026-07-05T09:00"));   // stabil
    expect(formatReminder("2026-07-05T09:00")).toMatch(/09:00/);
  });
});

describe("resolveReminders", () => {
  it("relativ rechnet gegen due + dueTime", () => {
    const [r] = resolveReminders(mk({ due: "2026-06-15", dueTime: "09:00", reminders: ["-30m"] }));
    expect(r.fireAt.getTime()).toBe(new Date("2026-06-15T08:30").getTime());
  });
  it("-0m feuert exakt zur Fälligkeit", () => {
    const [r] = resolveReminders(mk({ due: "2026-06-15", dueTime: "09:00", reminders: ["-0m"] }));
    expect(r.fireAt.getTime()).toBe(new Date("2026-06-15T09:00").getTime());
  });
  it("relativ ohne Uhrzeit wird übersprungen", () => {
    expect(resolveReminders(mk({ due: "2026-06-15", dueTime: null, reminders: ["-30m"] }))).toHaveLength(0);
  });
  it("absolut braucht keine Fälligkeit", () => {
    const [r] = resolveReminders(mk({ reminders: ["2026-07-05T09:00"] }));
    expect(r.fireAt.getTime()).toBe(new Date("2026-07-05T09:00").getTime());
  });
  it("datumsreiner Wert feuert zur LOKALEN Mitternacht (nicht UTC)", () => {
    // new Date("2026-07-05") wäre UTC-Mitternacht -> in MESZ 02:00 lokal.
    const [r] = resolveReminders(mk({ reminders: ["2026-07-05"] }));
    expect(r.fireAt.getTime()).toBe(new Date("2026-07-05T00:00").getTime());
    expect(r.fireAt.getHours()).toBe(0);
  });
  it("erledigte/abgebrochene Aufgaben feuern nicht", () => {
    const base = { due: "2026-06-15", dueTime: "09:00", reminders: ["-0m"] };
    expect(resolveReminders(mk({ ...base, status: "done" }))).toHaveLength(0);
    expect(resolveReminders(mk({ ...base, status: "cancelled" }))).toHaveLength(0);
  });
  it("ungültige Einträge werden ignoriert", () => {
    expect(resolveReminders(mk({ reminders: ["quatsch", "-5w"] }))).toHaveLength(0);
  });
});
