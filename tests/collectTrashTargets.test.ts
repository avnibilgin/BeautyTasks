import { describe, it, expect, beforeAll } from "vitest";
import { Task } from "../src/types";
import { collectTrashTargets } from "../src/filterEngine";
import { initStatuses } from "../src/statuses";

beforeAll(() => initStatuses());   // isTrashed braucht die Default-Registry (cancelled)

function mk(id: string, status = "todo"): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status, priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null,
  };
}
const p = (id: string) => "Items/" + id + ".md";

describe("collectTrashTargets – was ein Papierkorb-Zug tatsächlich erfasst", () => {
  // Baum: A -> [A1, A2],  B -> [B1]
  const kids: Record<string, Task[]> = {
    [p("A")]: [mk("A1"), mk("A2")],
    [p("B")]: [mk("B1")],
    [p("A1")]: [], [p("A2")]: [], [p("B1")]: [],
  };
  const descOf = (path: string): Task[] => {
    // rekursiv (wie index.descendants)
    const out: Task[] = [];
    const walk = (pp: string) => { for (const k of kids[pp] ?? []) { out.push(k); walk(k.path); } };
    walk(path);
    return out;
  };

  it("nimmt jede Wurzel inkl. ihres Unterbaums (Zähler = ehrliche Gesamtzahl)", () => {
    const out = collectTrashTargets([mk("A"), mk("B")], descOf);
    expect(out.map((t) => t.id).sort()).toEqual(["A", "A1", "A2", "B", "B1"]);
  });

  it("dedupliziert überlappende Bäume (Wurzel + eigenes Kind übergeben)", () => {
    const out = collectTrashTargets([mk("A"), mk("A1")], descOf);   // A1 ist Kind von A
    expect(out.map((t) => t.id).sort()).toEqual(["A", "A1", "A2"]);   // A1 nur einmal
  });

  it("überspringt bereits im Papierkorb liegende (cancelled) Aufgaben", () => {
    const out = collectTrashTargets([mk("A", "cancelled")], (path) =>
      path === p("A") ? [mk("A1"), mk("A2", "cancelled")] : []);
    expect(out.map((t) => t.id)).toEqual(["A1"]);   // A und A2 (cancelled) fallen weg
  });

  it("leere Wurzelliste -> leer", () => {
    expect(collectTrashTargets([], descOf)).toEqual([]);
  });
});
