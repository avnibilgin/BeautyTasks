import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { dateColumnKeys } from "../src/filterEngine";

function mk(id: string, due: string | null, scheduled: string | null = null): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status: "todo", priority: "normal",
    due, dueTime: null, scheduled, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null,
  };
}
const TODAY = "2026-07-15";

describe("dateColumnKeys – Board-Datumsspalten in Anzeige-Reihenfolge", () => {
  it("Überfällig zuerst · je Datum aufsteigend · Ohne Datum zuletzt (Feld = due)", () => {
    const cards = [mk("a", "2026-07-16"), mk("b", "2026-07-10"), mk("c", null), mk("d", "2026-07-15"), mk("e", "2026-07-16")];
    expect(dateColumnKeys(cards, TODAY, "due")).toEqual(["overdue", "d:2026-07-15", "d:2026-07-16", "nodate"]);
  });

  it("keine Überfällig-Spalte ohne Überfällige, keine Ohne-Datum-Spalte ohne Undatierte", () => {
    expect(dateColumnKeys([mk("x", "2026-07-20")], TODAY, "due")).toEqual(["d:2026-07-20"]);
  });

  it("nutzt scheduled bei Feld = scheduled (due wird ignoriert)", () => {
    const cards = [mk("a", "2026-07-01", "2026-07-16"), mk("b", null, null)];
    expect(dateColumnKeys(cards, TODAY, "scheduled")).toEqual(["d:2026-07-16", "nodate"]);
  });

  it("heute zählt NICHT als überfällig (>= today ist eine eigene Datumsspalte)", () => {
    expect(dateColumnKeys([mk("a", TODAY)], TODAY, "due")).toEqual(["d:2026-07-15"]);
  });

  it("leer -> keine Spalten", () => {
    expect(dateColumnKeys([], TODAY, "due")).toEqual([]);
  });
});
