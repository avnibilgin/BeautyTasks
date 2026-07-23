import { describe, it, expect, beforeAll } from "vitest";
import { Task } from "../src/types";
import { subtasksToDuplicate } from "../src/filterEngine";
import { initStatuses } from "../src/statuses";

beforeAll(() => initStatuses());   // Default-Status-Registry (todo/doing/done/cancelled) fuer isTrashed/isDone

function mk(id: string, status: string, sortOrder: number | null = null): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status, priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder, project: null, parent: "Items/P.md", labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null,
  };
}

describe("subtasksToDuplicate – Duplizieren übernimmt nur sichtbare Unteraufgaben", () => {
  it("lässt abgebrochene (Papierkorb) Kinder weg, erledigte bleiben drin", () => {
    // Regression 1.23.3: cancelled-Kinder wurden mitkopiert und als offen wiederbelebt.
    const kids = [
      mk("a", "todo"), mk("b", "cancelled"), mk("c", "done"),
      mk("d", "cancelled"), mk("e", "doing"),
    ];
    const ids = subtasksToDuplicate(kids).map((k) => k.id);
    expect(ids).not.toContain("b");
    expect(ids).not.toContain("d");
    expect(ids.sort()).toEqual(["a", "c", "e"]);   // todo/doing/done bleiben – nur Papierkorb fällt weg
  });

  it("erhält die Anzeige-Reihenfolge (sort_order) der verbleibenden Kinder", () => {
    const kids = [mk("x", "todo", 30), mk("y", "cancelled", 5), mk("z", "todo", 10)];
    expect(subtasksToDuplicate(kids).map((k) => k.id)).toEqual(["z", "x"]);
  });
});
