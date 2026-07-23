import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { severReferences } from "../src/filterEngine";

function mk(id: string, project: string | null, parent: string | null): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project, parent, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null,
  };
}
const P = "Projects/Weg.md";

describe("severReferences – Verweise auf eine gelöschte Notiz kappen", () => {
  it("setzt project == gelöschter Pfad auf null (-> Eingang)", () => {
    const out = severReferences([mk("a", P, null)], P);
    expect(out).toHaveLength(1);
    expect(out[0].project).toBeNull();
  });

  it("setzt parent == gelöschter Pfad auf null (Unteraufgabe wird Hauptaufgabe)", () => {
    const out = severReferences([mk("b", null, P)], P);
    expect(out[0].parent).toBeNull();
  });

  it("kappt project UND parent, wenn beide auf den Pfad zeigen", () => {
    const out = severReferences([mk("c", P, P)], P);
    expect(out[0].project).toBeNull();
    expect(out[0].parent).toBeNull();
  });

  it("gibt NUR die geänderten zurück, Unbeteiligte bleiben unberührt", () => {
    const tasks = [mk("a", P, null), mk("x", "Projects/Anderes.md", "Items/y.md"), mk("z", null, null)];
    const out = severReferences(tasks, P);
    expect(out.map((t) => t.id)).toEqual(["a"]);
  });

  it("mutiert die Eingabe nicht (neue Objekte)", () => {
    const t = mk("a", P, null);
    const out = severReferences([t], P);
    expect(t.project).toBe(P);      // Original unverändert
    expect(out[0]).not.toBe(t);     // Kopie
  });
});
