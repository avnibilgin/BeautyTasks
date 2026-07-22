import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { TaskIndex } from "../src/taskIndex";
import { matchesTask, applyFilter, activeFacetCount, DEFAULT_CRITERIA, DEFAULT_OPTIONS, FilterCriteria } from "../src/filterEngine";
import { initStatuses } from "../src/statuses";

initStatuses(null);   // eingebaute Status: todo · doing · done · cancelled
const TODAY = "2026-07-22";

function mk(id: string, status: string): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status, priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null,
  };
}
const crit = (p: Partial<FilterCriteria>): FilterCriteria => ({ ...DEFAULT_CRITERIA, ...p });

const todo = mk("todo", "todo"), doing = mk("doing", "doing");
const done = mk("done", "done"), gone = mk("gone", "cancelled");
/** Index-Attrappe: nur die vier Methoden, die applyFilter benutzt. */
const idx = {
  open: () => [todo, doing],
  done: () => [done],
  unarchived: () => [todo, doing, done, gone],
  orderKey: () => [],
} as unknown as TaskIndex;
const ids = (l: Task[]): string[] => l.map((t) => t.id).sort();

describe("matchesTask – Status", () => {
  it("✓ lässt nur die gewählten durch", () => {
    expect(matchesTask(doing, crit({ statuses: ["doing"] }), TODAY)).toBe(true);
    expect(matchesTask(todo, crit({ statuses: ["doing"] }), TODAY)).toBe(false);
  });

  it("− schließt aus", () => {
    expect(matchesTask(todo, crit({ statusesNot: ["doing"] }), TODAY)).toBe(true);
    expect(matchesTask(doing, crit({ statusesNot: ["doing"] }), TODAY)).toBe(false);
  });

  it("ohne Angabe geht alles durch", () => {
    for (const tk of [todo, doing, done, gone]) expect(matchesTask(tk, DEFAULT_CRITERIA, TODAY)).toBe(true);
  });

  it("zählt als aktive Facette", () => {
    expect(activeFacetCount(DEFAULT_CRITERIA)).toBe(0);
    expect(activeFacetCount(crit({ statuses: ["doing"] }))).toBe(1);
    expect(activeFacetCount(crit({ statusesNot: ["done"] }))).toBe(1);
  });
});

describe("matchesTask – Suche", () => {
  const withText = (title: string, description: string): Task => ({ ...mk("x", "todo"), title, description });

  it("findet im Titel", () => {
    expect(matchesTask(withText("Rechnung zahlen", ""), crit({ search: "rechnung" }), TODAY)).toBe(true);
  });

  it("findet auch in der Beschreibung", () => {
    // Die Beschreibung steht in der Liste unter dem Titel – sie zu sehen, aber nicht zu finden,
    // war die ueberraschendere Variante.
    expect(matchesTask(withText("Anruf", "wegen der Rechnung"), crit({ search: "rechnung" }), TODAY)).toBe(true);
  });

  it("findet nicht, wenn es in keinem von beiden steht", () => {
    expect(matchesTask(withText("Anruf", "wegen des Termins"), crit({ search: "rechnung" }), TODAY)).toBe(false);
  });

  it("ignoriert Gross-/Kleinschreibung und Leerraum um den Suchtext", () => {
    expect(matchesTask(withText("Anruf", "RECHNUNG"), crit({ search: "  rechnung  " }), TODAY)).toBe(true);
  });
});

describe("applyFilter – Grundmenge", () => {
  it("ohne Status-Kriterium wie bisher: nur offene", () => {
    expect(ids(applyFilter(idx, DEFAULT_CRITERIA, DEFAULT_OPTIONS, TODAY))).toEqual(["doing", "todo"]);
  });

  it("ohne Status-Kriterium, mit „Erledigte anzeigen“: offene + erledigte", () => {
    const o = { ...DEFAULT_OPTIONS, showDone: true };
    expect(ids(applyFilter(idx, DEFAULT_CRITERIA, o, TODAY))).toEqual(["doing", "done", "todo"]);
  });

  it("Status „erledigt“ findet erledigte AUCH ohne „Erledigte anzeigen“", () => {
    // Der Kern der Entscheidung: eine ausdrückliche Wahl schlägt die Vorgabe. Ohne diese Regel
    // käme der Filter auf null Treffer, weil die Aufgaben schon vor den Kriterien wegfielen.
    const c = crit({ statuses: ["done"] });
    expect(DEFAULT_OPTIONS.showDone).toBe(false);
    expect(ids(applyFilter(idx, c, DEFAULT_OPTIONS, TODAY))).toEqual(["done"]);
  });

  it("Status „abgebrochen“ ist überhaupt erst dadurch filterbar", () => {
    // In open() und done() steht Abgebrochenes nicht – vorher war es aus Filtern unerreichbar.
    expect(ids(applyFilter(idx, crit({ statuses: ["cancelled"] }), DEFAULT_OPTIONS, TODAY))).toEqual(["gone"]);
  });

  it("− auf einen Status öffnet die Grundmenge ebenfalls", () => {
    // „alles ausser erledigt" muss erledigte erst sehen, um sie ausschliessen zu koennen.
    const r = ids(applyFilter(idx, crit({ statusesNot: ["done"] }), DEFAULT_OPTIONS, TODAY));
    expect(r).toEqual(["doing", "gone", "todo"]);
  });
});
