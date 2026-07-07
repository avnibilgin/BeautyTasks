import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import {
  matchesTask, sortTasks, activeFacetCount, addDays, DEFAULT_CRITERIA, FilterCriteria,
} from "../src/filterEngine";

const TODAY = "2026-07-07";

function mk(p: Partial<Task>): Task {
  return {
    id: "t1", path: "Items/t1.md", title: "Task", status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    project: null, parent: null, labels: [], recurrence: null, recurBasis: "due", reminders: [],
    created: "2026-07-01", completed: null, cancelled: null, externalId: null, ...p,
  };
}
const crit = (p: Partial<FilterCriteria>): FilterCriteria => ({ ...DEFAULT_CRITERIA, ...p });

describe("addDays", () => {
  it("addiert Tage ohne UTC-Drift", () => {
    expect(addDays("2026-07-07", 7)).toBe("2026-07-14");
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");   // Monatsübergang
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");   // Jahresübergang
  });
});

describe("matchesTask – Zeitraum", () => {
  it("any lässt alles durch", () => {
    expect(matchesTask(mk({ due: null }), crit({ range: "any" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: "2020-01-01" }), crit({ range: "any" }), TODAY)).toBe(true);
  });
  it("overdue = fällig vor heute", () => {
    expect(matchesTask(mk({ due: "2026-07-06" }), crit({ range: "overdue" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: TODAY }), crit({ range: "overdue" }), TODAY)).toBe(false);
    expect(matchesTask(mk({ due: null }), crit({ range: "overdue" }), TODAY)).toBe(false);
  });
  it("today = überfällig + heute", () => {
    expect(matchesTask(mk({ due: "2026-07-06" }), crit({ range: "today" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: TODAY }), crit({ range: "today" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: "2026-07-08" }), crit({ range: "today" }), TODAY)).toBe(false);
  });
  it("next7 = heute bis heute+7", () => {
    expect(matchesTask(mk({ due: TODAY }), crit({ range: "next7" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: "2026-07-14" }), crit({ range: "next7" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: "2026-07-15" }), crit({ range: "next7" }), TODAY)).toBe(false);
    expect(matchesTask(mk({ due: "2026-07-06" }), crit({ range: "next7" }), TODAY)).toBe(false);
  });
  it("nodate = ohne Fälligkeit", () => {
    expect(matchesTask(mk({ due: null }), crit({ range: "nodate" }), TODAY)).toBe(true);
    expect(matchesTask(mk({ due: TODAY }), crit({ range: "nodate" }), TODAY)).toBe(false);
  });
});

describe("matchesTask – Facetten (UND zwischen, ODER innerhalb)", () => {
  it("Priorität: ODER innerhalb", () => {
    const c = crit({ priorities: ["highest", "high"] });
    expect(matchesTask(mk({ priority: "high" }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ priority: "normal" }), c, TODAY)).toBe(false);
  });
  it("Label: irgendeines genügt", () => {
    const c = crit({ labels: ["wichtig", "dringend"] });
    expect(matchesTask(mk({ labels: ["dringend", "x"] }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ labels: ["x"] }), c, TODAY)).toBe(false);
  });
  it("Projekt: Vergleich per Basename", () => {
    const c = crit({ projects: ["Immobilien"] });
    expect(matchesTask(mk({ project: "BeautyTasks/Projects/Immobilien.md" }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ project: "BeautyTasks/Projects/Reisen.md" }), c, TODAY)).toBe(false);
    expect(matchesTask(mk({ project: null }), c, TODAY)).toBe(false);
  });
  it("Suche: Teilstring im Titel, case-insensitiv", () => {
    const c = crit({ search: "steuer" });
    expect(matchesTask(mk({ title: "Steuererklärung abgeben" }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ title: "Einkaufen" }), c, TODAY)).toBe(false);
  });
  it("mehrere Facetten sind UND-verknüpft", () => {
    const c = crit({ range: "overdue", priorities: ["highest"] });
    expect(matchesTask(mk({ due: "2026-07-01", priority: "highest" }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ due: "2026-07-01", priority: "normal" }), c, TODAY)).toBe(false);
    expect(matchesTask(mk({ due: TODAY, priority: "highest" }), c, TODAY)).toBe(false);
  });
});

describe("sortTasks", () => {
  it("smart: datiert zuerst (aufsteigend), Datumlose ans Ende", () => {
    const list = [mk({ id: "a", due: null }), mk({ id: "b", due: "2026-07-10" }), mk({ id: "c", due: "2026-07-08" })];
    expect(sortTasks(list, "smart").map((t) => t.id)).toEqual(["c", "b", "a"]);
  });
  it("priority: höchste zuerst", () => {
    const list = [mk({ id: "a", priority: "normal" }), mk({ id: "b", priority: "highest" }), mk({ id: "c", priority: "medium" })];
    expect(sortTasks(list, "priority").map((t) => t.id)).toEqual(["b", "c", "a"]);
  });
  it("title: alphabetisch", () => {
    const list = [mk({ id: "a", title: "Zebra" }), mk({ id: "b", title: "Apfel" })];
    expect(sortTasks(list, "title").map((t) => t.id)).toEqual(["b", "a"]);
  });
  it("deadline: nach scheduled (aufsteigend), ohne Deadline ans Ende", () => {
    const list = [mk({ id: "a", scheduled: null }), mk({ id: "b", scheduled: "2026-07-10" }), mk({ id: "c", scheduled: "2026-07-08" })];
    expect(sortTasks(list, "deadline").map((t) => t.id)).toEqual(["c", "b", "a"]);
  });
});

describe("activeFacetCount", () => {
  it("zählt nur nicht-Default-Facetten", () => {
    expect(activeFacetCount(DEFAULT_CRITERIA)).toBe(0);
    expect(activeFacetCount(crit({ range: "today" }))).toBe(1);
    expect(activeFacetCount(crit({ range: "today", priorities: ["high"], search: "x" }))).toBe(3);
    expect(activeFacetCount(crit({ search: "   " }))).toBe(0);   // leerer Suchtext zählt nicht
  });
});
