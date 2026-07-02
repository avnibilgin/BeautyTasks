import { describe, it, expect } from "vitest";
import { parseRecurrence, nextInstance } from "../src/recurrence";
import { Task } from "../src/types";

const task = (p: Partial<Task>): Task => ({
  id: "t1", path: "x.md", title: "T", status: "todo", priority: "normal",
  due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null, project: null, area: null, parent: null,
  labels: [], recurrence: null, recurBasis: "due", created: "2026-01-01",
  completed: null, cancelled: null, externalId: null, ...p,
});

describe("parseRecurrence", () => {
  it("erkennt Einheit und Anzahl", () => {
    expect(parseRecurrence("every day")).toEqual({ n: 1, unit: "day" });
    expect(parseRecurrence("every 3 months")).toEqual({ n: 3, unit: "month" });
    expect(parseRecurrence("EVERY 2 WEEKS")).toEqual({ n: 2, unit: "week" });
  });
  it("null bei Unbekanntem", () => {
    expect(parseRecurrence("manchmal")).toBeNull();
  });
});

describe("nextInstance", () => {
  it("springt ab Fälligkeit bis in die Zukunft (nicht sofort wieder überfällig)", () => {
    const r = nextInstance(task({ recurrence: "every week", due: "2026-06-01", recurBasis: "due" }), "2026-06-15");
    expect(r).toEqual({ due: "2026-06-22", scheduled: null });
  });
  it("basis 'done' rechnet ab heute", () => {
    const r = nextInstance(task({ recurrence: "every week", due: "2026-06-01", recurBasis: "done" }), "2026-06-15");
    expect(r).toEqual({ due: "2026-06-22", scheduled: null });
  });
  it("erhält den Abstand scheduled↔due", () => {
    const r = nextInstance(task({ recurrence: "every month", due: "2026-06-10", scheduled: "2026-06-08", recurBasis: "due" }), "2026-06-15");
    expect(r).toEqual({ due: "2026-07-10", scheduled: "2026-07-08" });
  });
  it("ohne Fälligkeit, nur scheduled", () => {
    const r = nextInstance(task({ recurrence: "every day", scheduled: "2026-06-14", recurBasis: "due" }), "2026-06-15");
    expect(r).toEqual({ due: null, scheduled: "2026-06-16" });
  });
  it("null ohne gültige Wiederholung", () => {
    expect(nextInstance(task({ recurrence: null, due: "2026-06-01" }), "2026-06-15")).toBeNull();
    expect(nextInstance(task({ recurrence: "bla", due: "2026-06-01" }), "2026-06-15")).toBeNull();
  });
});
