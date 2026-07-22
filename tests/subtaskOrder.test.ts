import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { sortSubtasks } from "../src/filterEngine";
import { initStatuses } from "../src/statuses";

initStatuses(null);   // eingebaute Status: todo · doing · done · cancelled

function mk(id: string, p: Partial<Task> = {}): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: "Items/eltern.md", labels: [], description: "",
    recurrence: null, recurBasis: "due", reminders: [], created: "2026-07-01",
    completed: null, cancelled: null, externalId: null, ...p,
  };
}
const ids = (l: Task[]): string[] => l.map((t) => t.id);

describe("sortSubtasks – Erledigte nach unten", () => {
  it("schiebt Abgehaktes ans Ende, egal wo es stand", () => {
    const kids = [
      mk("s1", { sortOrder: 10, status: "done" }),
      mk("s2", { sortOrder: 20 }), mk("s3", { sortOrder: 30 }), mk("s4", { sortOrder: 40 }),
    ];
    expect(ids(sortSubtasks(kids))).toEqual(["s2", "s3", "s4", "s1"]);
  });

  it("Erledigte behalten untereinander ihre Geschwister-Reihenfolge", () => {
    // Entscheidung A: nicht nach Abschlusszeit. Der erledigte Block soll ruhig bleiben und
    // Aufhaken exakt zurückführen – anders als die grossen Erledigt-Listen (die sind ein Protokoll).
    const kids = [
      mk("s3", { sortOrder: 30, status: "done", completed: "2026-07-01T09:00:00" }),
      mk("s1", { sortOrder: 10, status: "done", completed: "2026-07-22T18:00:00" }),
      mk("s2", { sortOrder: 20 }),
    ];
    expect(ids(sortSubtasks(kids))).toEqual(["s2", "s1", "s3"]);
  });
});

describe("sortSubtasks – Reihenfolge der Geschwister", () => {
  it("folgt sort_order", () => {
    const kids = [mk("c", { sortOrder: 30 }), mk("a", { sortOrder: 10 }), mk("b", { sortOrder: 20 })];
    expect(ids(sortSubtasks(kids))).toEqual(["a", "b", "c"]);
  });

  it("ohne Position: nach created, dann Titel", () => {
    const kids = [mk("spaet", { created: "2026-07-05" }), mk("frueh", { created: "2026-07-02" })];
    expect(ids(sortSubtasks(kids))).toEqual(["frueh", "spaet"]);
  });

  it("ohne Position und gleiches created: nach Titel – nie zufaellig", () => {
    // Der eigentliche Fehler war die Index-Einfuegereihenfolge, die nach einem Neustart eine
    // andere ist. Hier darf nichts uebrig bleiben, das vom Zufall abhaengt.
    const kids = [mk("Zebra"), mk("Apfel"), mk("Mango")];
    expect(ids(sortSubtasks(kids))).toEqual(["Apfel", "Mango", "Zebra"]);
  });

  it("zwei ohne Position ergeben keinen NaN-Vergleich", () => {
    // sortOrder fehlt bei beiden -> mit Infinity waere die Differenz NaN und die Sortierung
    // unvorhersagbar. Deshalb MAX_SAFE_INTEGER.
    const kids = [mk("b", { created: "2026-07-02" }), mk("a", { created: "2026-07-01" })];
    expect(ids(sortSubtasks(kids))).toEqual(["a", "b"]);
  });

  it("mit Position stehen vor denen ohne", () => {
    const kids = [mk("ohne"), mk("mit", { sortOrder: 99 })];
    expect(ids(sortSubtasks(kids))).toEqual(["mit", "ohne"]);
  });
});

describe("sortSubtasks – Eigenschaften", () => {
  it("laesst die Eingabe unangetastet (kein In-place-Sort)", () => {
    const kids = [mk("b", { sortOrder: 20 }), mk("a", { sortOrder: 10 })];
    sortSubtasks(kids);
    expect(ids(kids)).toEqual(["b", "a"]);
  });

  it("ist stabil: zweimal sortieren aendert nichts mehr", () => {
    const kids = [mk("s1", { sortOrder: 10, status: "done" }), mk("s3", { sortOrder: 30 }), mk("s2", { sortOrder: 20 })];
    const once = sortSubtasks(kids);
    expect(ids(sortSubtasks(once))).toEqual(ids(once));
  });
});
