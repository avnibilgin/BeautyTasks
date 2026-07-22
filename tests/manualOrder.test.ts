import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { sortTasks, hasSortDir, orderChain, SORTS } from "../src/filterEngine";

function mk(p: Partial<Task> & { id: string }): Task {
  return {
    path: "Items/" + p.id + ".md", title: p.id, status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null, ...p,
  };
}
/** Die ECHTE Kettenberechnung, nur mit einer Map statt dem Index als Nachschlagewerk.
 *  Bewusst nicht nachgebaut: ein nachgebauter Schlüssel würde genau die Abweichung nicht
 *  finden, für die diese Tests da sind. TaskIndex.orderKey ruft dieselbe Funktion auf. */
const chainOf = (all: Task[]) => {
  const byPath = new Map(all.map((x) => [x.path, x]));
  return (t: Task): number[] => orderChain(t, (p) => byPath.get(p));
};
const ids = (l: Task[]): string[] => l.map((t) => t.id);

describe("sortTasks – Handreihenfolge", () => {
  it("ordnet nach der gesetzten Position", () => {
    const l = [mk({ id: "c", sortOrder: 3 }), mk({ id: "a", sortOrder: 1 }), mk({ id: "b", sortOrder: 2 })];
    expect(ids(sortTasks(l, "manual", "asc", chainOf(l)))).toEqual(["a", "b", "c"]);
  });

  it("Aufgaben ohne Position stehen hinten – neu Angelegtes landet unten", () => {
    // Deshalb muss beim Anlegen nichts geschrieben werden: fehlend = Infinity = ans Ende.
    const l = [mk({ id: "neu" }), mk({ id: "b", sortOrder: 2 }), mk({ id: "a", sortOrder: 1 })];
    expect(ids(sortTasks(l, "manual", "asc", chainOf(l)))).toEqual(["a", "b", "neu"]);
  });

  it("mehrere ohne Position: stabil nach created, dann Titel", () => {
    const l = [mk({ id: "spaet", created: "2026-07-05" }), mk({ id: "frueh", created: "2026-07-02" })];
    expect(ids(sortTasks(l, "manual", "asc", chainOf(l)))).toEqual(["frueh", "spaet"]);
  });

  it("Kinder folgen ihrem Elter und stehen untereinander in ihrer Reihenfolge", () => {
    const p = mk({ id: "umzug", sortOrder: 3 });
    const l = [
      mk({ id: "steuer", sortOrder: 4 }),
      mk({ id: "transporter", sortOrder: 2, parent: p.path }),
      p,
      mk({ id: "kartons", sortOrder: 1, parent: p.path }),
    ];
    expect(ids(sortTasks(l, "manual", "asc", chainOf(l)))).toEqual(["umzug", "kartons", "transporter", "steuer"]);
  });

  it("Elter steht vor seinen Kindern – kürzere Kette gewinnt bei Gleichstand", () => {
    const p = mk({ id: "eltern", sortOrder: 1 });
    const l = [mk({ id: "kind", sortOrder: 1, parent: p.path }), p];
    expect(ids(sortTasks(l, "manual", "asc", chainOf(l)))).toEqual(["eltern", "kind"]);
  });

  it("Unteraufgabe ohne ihren Elter in der Liste sortiert an dessen Stelle", () => {
    // Der Fall aus der Label-Gruppierung: der Elter trägt das Label nicht, ist also nicht dabei.
    // Trotzdem darf die Unteraufgabe nicht willkürlich landen.
    const p = mk({ id: "eltern", sortOrder: 2 });
    const kind = mk({ id: "kind", sortOrder: 1, parent: p.path });
    const alle = [p, kind, mk({ id: "vorher", sortOrder: 1 }), mk({ id: "danach", sortOrder: 3 })];
    const sichtbar = alle.filter((t) => t.id !== "eltern");
    expect(ids(sortTasks(sichtbar, "manual", "asc", chainOf(alle)))).toEqual(["vorher", "kind", "danach"]);
  });

  it("Zyklus im parent-Verweis führt nicht zur Endlosschleife", () => {
    // `parent` ist ein Wikilink, den man von Hand auf einen Nachfahren zeigen lassen kann.
    const a = mk({ id: "a", sortOrder: 1 }), b = mk({ id: "b", sortOrder: 2 });
    a.parent = b.path; b.parent = a.path;
    const l = [a, b];
    expect(() => sortTasks(l, "manual", "asc", chainOf(l))).not.toThrow();
    expect(ids(sortTasks(l, "manual", "asc", chainOf(l)))).toHaveLength(2);
  });

  it("ohne Schlüssel: Rückfall auf created statt unbrauchbarer Reihenfolge", () => {
    const l = [mk({ id: "spaet", sortOrder: 1, created: "2026-07-09" }), mk({ id: "frueh", sortOrder: 9, created: "2026-07-02" })];
    expect(ids(sortTasks(l, "manual"))).toEqual(["frueh", "spaet"]);
  });

  it("die Richtung gilt nicht – eine Handreihenfolge kennt keine", () => {
    const l = [mk({ id: "b", sortOrder: 2 }), mk({ id: "a", sortOrder: 1 })];
    const asc = ids(sortTasks(l, "manual", "asc", chainOf(l)));
    expect(ids(sortTasks(l, "manual", "desc", chainOf(l)))).toEqual(asc);
    expect(hasSortDir("manual")).toBe(false);
  });

  it("steht als Option zur Wahl", () => {
    expect(SORTS).toContain("manual");
  });
});
