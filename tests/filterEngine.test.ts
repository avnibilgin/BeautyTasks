import { describe, it, expect } from "vitest";
import { Task, Priority } from "../src/types";
import {
  matchesTask, sortTasks, activeFacetCount, addDays, hasSortDir, DEFAULT_CRITERIA, FilterCriteria,
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

describe("matchesTask – Marker-Gruppen (✓ / + / −)", () => {
  it("+ (labelsAll): alle müssen vorhanden sein (UND)", () => {
    const c = crit({ labelsAll: ["a", "b"] });
    expect(matchesTask(mk({ labels: ["a", "b", "c"] }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ labels: ["a"] }), c, TODAY)).toBe(false);
  });
  it("− (labelsNot): keines darf vorkommen (NICHT)", () => {
    const c = crit({ labelsNot: ["irgendwann"] });
    expect(matchesTask(mk({ labels: ["arbeit"] }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ labels: [] }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ labels: ["irgendwann"] }), c, TODAY)).toBe(false);
  });
  it("gemischt: ✓ einschließen UND − ausschließen im selben Feld", () => {
    const c = crit({ labels: ["arbeit"], labelsNot: ["irgendwann"] });
    expect(matchesTask(mk({ labels: ["arbeit"] }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ labels: ["arbeit", "irgendwann"] }), c, TODAY)).toBe(false);   // Ausschluss sticht
    expect(matchesTask(mk({ labels: ["health"] }), c, TODAY)).toBe(false);                 // kein ✓-Treffer
  });
  it("Projekt −: schließt Projekt aus, Inbox (kein Projekt) bleibt", () => {
    const c = crit({ projectsNot: ["Archiv"] });
    expect(matchesTask(mk({ project: "P/Archiv.md" }), c, TODAY)).toBe(false);
    expect(matchesTask(mk({ project: "P/Küche.md" }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ project: null }), c, TODAY)).toBe(true);
  });
  it("Priorität −: schließt gewählte Prioritäten aus", () => {
    const c = crit({ prioritiesNot: ["normal"] });
    expect(matchesTask(mk({ priority: "high" }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ priority: "normal" }), c, TODAY)).toBe(false);
  });
  it("Zielfilter „Jederzeit“: nodate + labelsNot irgendwann", () => {
    const c = crit({ range: "nodate", labelsNot: ["irgendwann"] });
    expect(matchesTask(mk({ due: null, labels: ["arbeit"] }), c, TODAY)).toBe(true);
    expect(matchesTask(mk({ due: null, labels: ["irgendwann"] }), c, TODAY)).toBe(false);
    expect(matchesTask(mk({ due: TODAY, labels: ["arbeit"] }), c, TODAY)).toBe(false);   // datiert fällt raus
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

describe("sortTasks: Richtung", () => {
  const mkT = (title: string, due: string | null, created = "", prio: Priority = "normal"): Task => ({
    id: title, path: title + ".md", title, status: "todo", priority: prio,
    due, dueTime: null, scheduled: null, scheduledTime: null, duration: null,
    start: null, project: null, area: null, parent: null, labels: [],
    recurrence: null, recurBasis: "due", created, completed: null, cancelled: null,
    externalId: null, reminders: [],
  });

  it("Fälligkeit aufsteigend: frühestes zuerst", () => {
    const r = sortTasks([mkT("b", "2026-07-20"), mkT("a", "2026-07-10")], "due", "asc");
    expect(r.map((t) => t.title)).toEqual(["a", "b"]);
  });
  it("Fälligkeit absteigend: spätestes zuerst", () => {
    const r = sortTasks([mkT("a", "2026-07-10"), mkT("b", "2026-07-20")], "due", "desc");
    expect(r.map((t) => t.title)).toEqual(["b", "a"]);
  });
  it("Undatierte bleiben in BEIDEN Richtungen am Ende", () => {
    const list = [mkT("ohne", null), mkT("spät", "2026-07-20"), mkT("früh", "2026-07-10")];
    expect(sortTasks(list, "due", "asc").map((t) => t.title)).toEqual(["früh", "spät", "ohne"]);
    expect(sortTasks(list, "due", "desc").map((t) => t.title)).toEqual(["spät", "früh", "ohne"]);
  });
  it("Priorität: aufsteigend = wichtigste zuerst, absteigend umgekehrt", () => {
    const list = [mkT("normal", null, "", "normal"), mkT("hoch", null, "", "highest")];
    expect(sortTasks(list, "priority", "asc").map((t) => t.title)).toEqual(["hoch", "normal"]);
    expect(sortTasks(list, "priority", "desc").map((t) => t.title)).toEqual(["normal", "hoch"]);
  });
  it("Erstellt: aufsteigend = ältestes zuerst", () => {
    const list = [mkT("neu", null, "2026-07-10"), mkT("alt", null, "2026-01-01")];
    expect(sortTasks(list, "created", "asc").map((t) => t.title)).toEqual(["alt", "neu"]);
    expect(sortTasks(list, "created", "desc").map((t) => t.title)).toEqual(["neu", "alt"]);
  });
  it("smart ignoriert die Richtung (hat keine)", () => {
    const list = [mkT("b", "2026-07-20"), mkT("a", "2026-07-10")];
    expect(sortTasks(list, "smart", "desc").map((t) => t.title)).toEqual(["a", "b"]);
    expect(hasSortDir("smart")).toBe(false);
    expect(hasSortDir("due")).toBe(true);
  });
});

describe("sortTasks: Uhrzeit am selben Tag", () => {
  const mkD = (title: string, due: string | null, dueTime: string | null): Task => ({
    id: title, path: title + ".md", title, status: "todo", priority: "normal",
    due, dueTime, scheduled: null, scheduledTime: null, duration: null,
    start: null, project: null, area: null, parent: null, labels: [],
    recurrence: null, recurBasis: "due", created: "", completed: null, cancelled: null,
    externalId: null, reminders: [],
  });

  it("gleicher Tag: nach Uhrzeit, nicht nach Titel", () => {
    // „Zahnarzt" (09:00) muss vor „Auto" (17:00) stehen – alphabetisch wäre es umgekehrt.
    const list = [mkD("Auto", "2026-07-14", "17:00"), mkD("Zahnarzt", "2026-07-14", "09:00")];
    expect(sortTasks(list, "due", "asc").map((t) => t.title)).toEqual(["Zahnarzt", "Auto"]);
    expect(sortTasks(list, "due", "desc").map((t) => t.title)).toEqual(["Auto", "Zahnarzt"]);
  });
  it("ohne Uhrzeit ans Tagesende (aufsteigend)", () => {
    const list = [mkD("ganztags", "2026-07-14", null), mkD("früh", "2026-07-14", "09:00")];
    expect(sortTasks(list, "due", "asc").map((t) => t.title)).toEqual(["früh", "ganztags"]);
  });
  it("smart berücksichtigt die Uhrzeit ebenfalls", () => {
    const list = [mkD("spät", "2026-07-14", "17:00"), mkD("früh", "2026-07-14", "09:00")];
    expect(sortTasks(list, "smart").map((t) => t.title)).toEqual(["früh", "spät"]);
  });
  it("Uhrzeit schlägt nicht über Tagesgrenzen hinweg", () => {
    const list = [mkD("morgenFrüh", "2026-07-15", "08:00"), mkD("heuteSpät", "2026-07-14", "23:00")];
    expect(sortTasks(list, "due", "asc").map((t) => t.title)).toEqual(["heuteSpät", "morgenFrüh"]);
  });
});
