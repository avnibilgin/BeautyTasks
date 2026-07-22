import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { planReorder, ORDER_GAP, sortTasks, orderChain } from "../src/filterEngine";

function mk(id: string, sortOrder: number | null = null): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null,
  };
}
const p = (id: string): string => "Items/" + id + ".md";
/** Die Schreibvorgänge anwenden und die daraus folgende Reihenfolge zurückgeben. */
const apply = (all: Task[], writes: { path: string; order: number }[]): string[] => {
  const next = all.map((t) => {
    const w = writes.find((x) => x.path === t.path);
    return w ? { ...t, sortOrder: w.order } : t;
  });
  const byPath = new Map(next.map((t) => [t.path, t]));
  return sortTasks(next, "manual", "asc", (t) => orderChain(t, (q) => byPath.get(q))).map((t) => t.id);
};

describe("planReorder – erster Zug in einer Gruppe", () => {
  it("nummeriert die GANZE Gruppe durch, weil es keine Mitte zu bilden gibt", () => {
    const list = [mk("a"), mk("b"), mk("c")];
    const w = planReorder(list, list[2], p("a"));   // c nach ganz vorn
    expect(w).toHaveLength(3);
    expect(w.map((x) => x.order)).toEqual([ORDER_GAP, 2 * ORDER_GAP, 3 * ORDER_GAP]);
    expect(apply(list, w)).toEqual(["c", "a", "b"]);
  });

  it("die Gruppe umfasst auch Geschwister aus anderen Spalten", () => {
    // Wichtig: nur die Spalte zu nummerieren würde die uebrigen auf null lassen – sie rutschten
    // in der Liste ans Ende, ein Zug im Board wuerde also die Listenansicht umwerfen.
    const list = [mk("todo1"), mk("doing1"), mk("done1")];
    expect(planReorder(list, list[1], p("todo1"))).toHaveLength(3);
  });
});

describe("planReorder – danach nur noch eine Notiz", () => {
  const list = () => [mk("a", 10), mk("b", 20), mk("c", 30)];

  it("Mitte zwischen zwei Nachbarn", () => {
    const l = list();
    const w = planReorder(l, l[2], p("b"));   // c zwischen a und b
    expect(w).toEqual([{ path: p("c"), order: 15 }]);
    expect(apply(l, w)).toEqual(["a", "c", "b"]);
  });

  it("ganz nach vorn: die Hälfte des ersten Werts", () => {
    const l = list();
    const w = planReorder(l, l[2], p("a"));
    expect(w).toEqual([{ path: p("c"), order: 5 }]);
    expect(apply(l, w)).toEqual(["c", "a", "b"]);
  });

  it("ans Ende: letzter Wert plus Lücke", () => {
    const l = list();
    const w = planReorder(l, l[0], null);
    expect(w).toEqual([{ path: p("a"), order: 40 }]);
    expect(apply(l, w)).toEqual(["b", "c", "a"]);
  });

  it("unbekanntes Ziel wird als „ans Ende“ verstanden", () => {
    const l = list();
    expect(planReorder(l, l[0], p("geloescht"))).toEqual([{ path: p("a"), order: 40 }]);
  });

  it("an dieselbe Stelle zurück ändert die Reihenfolge nicht", () => {
    const l = list();
    expect(apply(l, planReorder(l, l[1], p("c")))).toEqual(["a", "b", "c"]);
  });
});

describe("planReorder – erschöpfte Lücke", () => {
  it("nummeriert neu, statt eine Position doppelt zu vergeben", () => {
    // Zwei Nachbarn so dicht, dass die Mitte auf einen von beiden fällt.
    const a = mk("a", 10), b = mk("b", 10 + Number.EPSILON * 10), c = mk("c", 30);
    const w = planReorder([a, b, c], c, p("b"));
    expect(w).toHaveLength(3);                       // volle Neunummerierung
    expect(new Set(w.map((x) => x.order)).size).toBe(3);   // keine Dopplung
    expect(apply([a, b, c], w)).toEqual(["a", "c", "b"]);
  });

  it("nach dem Neunummerieren ist wieder Platz für Mittelwerte", () => {
    const l = [mk("a"), mk("b")];
    const first = planReorder(l, l[1], p("a"));
    const numbered = l.map((t) => ({ ...t, sortOrder: first.find((w) => w.path === t.path)!.order }));
    const second = planReorder(numbered, numbered[0], null);
    expect(second).toHaveLength(1);
  });
});
