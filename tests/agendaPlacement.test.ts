import { describe, it, expect } from "vitest";
import { Task, agendaDate } from "../src/types";
import { isOverdueTask, isTodayTask, isUpcomingTask } from "../src/filterEngine";

/**
 * Die EINE Regel der Zeit-Ansichten:
 *   Ohne Fälligkeit ist die Deadline die Fälligkeit; sonst entscheidet allein die Fälligkeit.
 *   Eine verstrichene Frist macht überfällig – auch bei künftigem Plan.
 *
 * Wichtigste Zusicherung dieser Datei: Jede Aufgabe fällt in HÖCHSTENS EINEN der drei Töpfe.
 * Genau daran ist die frühere Lösung gescheitert (dieselbe Aufgabe aus zwei Gründen sichtbar).
 */

const TODAY = "2026-07-29";
const GESTERN = "2026-07-28", MORGEN = "2026-07-30", NAECHSTE_WOCHE = "2026-08-05";

function mk(o: Partial<Task> = {}): Task {
  return {
    id: "t", path: "Items/t.md", title: "t", status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: TODAY, completed: null, cancelled: null,
    externalId: null, ...o,
  };
}

/** In welchem Topf landet die Aufgabe? */
const bucket = (t: Task): string =>
  [isOverdueTask(t, TODAY) && "überfällig", isTodayTask(t, TODAY) && "heute", isUpcomingTask(t, TODAY) && "demnächst"]
    .filter(Boolean).join("+") || "nirgends";

describe("Zeit-Ansichten: Platzierung", () => {
  it("ohne Fälligkeit ist die Deadline die Fälligkeit", () => {
    expect(agendaDate(mk({ scheduled: MORGEN }))).toBe(MORGEN);
    expect(bucket(mk({ scheduled: TODAY }))).toBe("heute");
    expect(bucket(mk({ scheduled: MORGEN }))).toBe("demnächst");
    expect(bucket(mk({ scheduled: GESTERN }))).toBe("überfällig");
  });

  it("mit Fälligkeit entscheidet die Fälligkeit – die Deadline verschiebt nichts", () => {
    expect(agendaDate(mk({ due: MORGEN, scheduled: NAECHSTE_WOCHE }))).toBe(MORGEN);
    expect(bucket(mk({ due: TODAY, scheduled: NAECHSTE_WOCHE }))).toBe("heute");
    expect(bucket(mk({ due: MORGEN, scheduled: TODAY }))).toBe("demnächst");   // Frist heute, Plan morgen
  });

  it("eine verstrichene Frist macht überfällig – auch bei künftigem Plan", () => {
    expect(bucket(mk({ due: MORGEN, scheduled: GESTERN }))).toBe("überfällig");
    expect(bucket(mk({ due: NAECHSTE_WOCHE, scheduled: GESTERN }))).toBe("überfällig");
  });

  it("ohne beides steht die Aufgabe in keiner Zeit-Ansicht", () => {
    expect(agendaDate(mk())).toBeNull();
    expect(bucket(mk())).toBe("nirgends");
  });

  it("jede Konstellation landet in HÖCHSTENS EINEM Topf", () => {
    const daten = [null, GESTERN, TODAY, MORGEN, NAECHSTE_WOCHE];
    for (const due of daten) {
      for (const scheduled of daten) {
        const t = mk({ due, scheduled });
        const treffer = [isOverdueTask(t, TODAY), isTodayTask(t, TODAY), isUpcomingTask(t, TODAY)].filter(Boolean).length;
        expect(treffer, `due=${due} scheduled=${scheduled}`).toBeLessThanOrEqual(1);
      }
    }
  });

  it("jede datierte Aufgabe landet in GENAU EINEM Topf", () => {
    const daten = [GESTERN, TODAY, MORGEN, NAECHSTE_WOCHE];
    for (const due of [null, ...daten]) {
      for (const scheduled of [null, ...daten]) {
        if (!due && !scheduled) continue;
        expect(bucket(mk({ due, scheduled })), `due=${due} scheduled=${scheduled}`).not.toBe("nirgends");
      }
    }
  });
});
