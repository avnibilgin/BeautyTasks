import { describe, it, expect } from "vitest";
import { Task } from "../src/types";
import { TaskIndex } from "../src/taskIndex";
import { applyFilter, countFilter, DEFAULT_CRITERIA, DEFAULT_OPTIONS, FilterCriteria, ViewOptions } from "../src/filterEngine";

/**
 * `countFilter` ist `applyFilter().length` OHNE den Sortierlauf – weil eine ZAHL nicht davon
 * abhängt, in welcher Reihenfolge die Treffer stehen. Der Sortierlauf war bei 10.000 Aufgaben
 * gemessen 33 ms von 35 ms und wurde an vier Stellen weggeworfen, die Seitenleiste rechnete ihn
 * bei jeder Index-Meldung und einmal je Filter.
 *
 * Die Eigenschaft, an der das hängt und die hier festgenagelt wird: BEIDE müssen für dieselbe
 * Eingabe dieselbe Zahl liefern – über alle Wege durch die Grundmengen-Wahl hinweg (offene,
 * offene+erledigte, unarchivierte bei gesetztem Status-Kriterium).
 */

function mk(p: Partial<Task>): Task {
  return {
    id: "t" + (p.path ?? "x"), path: "Items/x.md", title: "Task", status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "",
    recurrence: null, recurBasis: "due", reminders: [],
    created: "2026-07-01", completed: null, cancelled: null, externalId: null, ...p,
  };
}

const TODAY = "2026-07-07";

const OFFEN: Task[] = [
  mk({ path: "a.md", title: "Zebra", due: "2026-07-06", priority: "high", labels: ["ui"] }),
  mk({ path: "b.md", title: "Anton", due: TODAY, status: "doing", labels: ["ui", "bug"] }),
  mk({ path: "c.md", title: "Mitte", due: "2026-07-20", project: "P/Haus.md" }),
  mk({ path: "d.md", title: "Ohne Datum" }),
];
const ERLEDIGT: Task[] = [
  mk({ path: "e.md", title: "Fertig", status: "done", due: "2026-07-01", completed: "2026-07-02" }),
  mk({ path: "f.md", title: "Abgebrochen", status: "cancelled" }),
];

/** Nur so viel Index, wie die Filter-Ebene anfasst. */
const idx = {
  open: () => OFFEN,
  done: () => ERLEDIGT,
  unarchived: () => [...OFFEN, ...ERLEDIGT],
  orderKey: (t: Task) => [t.path.charCodeAt(0)],
} as unknown as TaskIndex;

const crit = (p: Partial<FilterCriteria>): FilterCriteria => ({ ...DEFAULT_CRITERIA, ...p });
const opt = (p: Partial<ViewOptions>): ViewOptions => ({ ...DEFAULT_OPTIONS, ...p });

/** Quer durch die drei Grundmengen UND durch die Sortierarten – die Zahl darf von keiner abhängen. */
const FAELLE: { was: string; c: FilterCriteria; o: ViewOptions }[] = [
  { was: "alles offen", c: crit({}), o: opt({}) },
  { was: "offen + erledigt (showDone)", c: crit({}), o: opt({ showDone: true }) },
  { was: "Status-Kriterium -> unarchivierte", c: crit({ statuses: ["done"] }), o: opt({}) },
  { was: "Status-Ausschluss -> unarchivierte", c: crit({ statusesNot: ["todo"] }), o: opt({}) },
  { was: "Zeitraum overdue", c: crit({ range: "overdue" }), o: opt({}) },
  { was: "Zeitraum today", c: crit({ range: "today" }), o: opt({}) },
  { was: "Label ui", c: crit({ labels: ["ui"] }), o: opt({}) },
  { was: "Projekt", c: crit({ projects: ["P/Haus.md"] }), o: opt({}) },
  { was: "trifft nichts", c: crit({ labels: ["gibt-es-nicht"] }), o: opt({}) },
  { was: "nach Titel sortiert", c: crit({}), o: opt({ sort: "title" }) },
  { was: "absteigend sortiert", c: crit({}), o: opt({ sort: "due", sortDir: "desc" }) },
  { was: "manuell sortiert (orderKey)", c: crit({}), o: opt({ sort: "manual" }) },
];

describe("countFilter zählt genau das, was applyFilter zurückgibt", () => {
  for (const f of FAELLE) {
    it(f.was, () => {
      expect(countFilter(idx, f.c, f.o, TODAY)).toBe(applyFilter(idx, f.c, f.o, TODAY).length);
    });
  }

  it("liefert 0 statt zu werfen, wenn nichts passt", () => {
    expect(countFilter(idx, crit({ labels: ["gibt-es-nicht"] }), opt({}), TODAY)).toBe(0);
  });
});

describe("applyFilter sortiert weiterhin", () => {
  // Absicherung gegen die naheliegende Verwechslung beim Herausziehen des gemeinsamen Kerns:
  // Wer countFilter baut, indem er den Sortierlauf entfernt, darf ihn nicht bei applyFilter
  // mit entfernen. Ohne diesen Test fiele das erst im Betrieb auf – als unsortierte Liste.
  it("gibt nach Titel sortiert zurück, nicht in Index-Reihenfolge", () => {
    const titel = applyFilter(idx, crit({}), opt({ sort: "title" }), TODAY).map((t) => t.title);
    expect(titel).toEqual([...titel].sort((a, b) => a.localeCompare(b, "de")));
    expect(titel[0]).toBe("Anton");   // nicht "Zebra", das im Index vorne steht
  });

  it("lässt die Quelle unangetastet", () => {
    const vorher = OFFEN.map((t) => t.path);
    applyFilter(idx, crit({}), opt({ sort: "title" }), TODAY);
    expect(OFFEN.map((t) => t.path)).toEqual(vorher);
  });
});
