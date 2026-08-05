import { describe, it, expect, beforeAll } from "vitest";
import { creationStamps, transitionStamps } from "../src/taskService";
import { initStatuses } from "../src/statuses";

beforeAll(() => initStatuses(null));   // eingebaute Status: todo · doing · done · cancelled

const JETZT = "2026-08-05T15:09:43";

describe("creationStamps – Zeitstempel beim ANLEGEN", () => {
  it("offene Aufgaben bekommen keinen Stempel", () => {
    expect(creationStamps("todo", JETZT)).toEqual({ completed: null, cancelled: null });
    expect(creationStamps("doing", JETZT)).toEqual({ completed: null, cancelled: null });
  });

  it("gleich als erledigt angelegt: `completed` wird gesetzt", () => {
    expect(creationStamps("done", JETZT)).toEqual({ completed: JETZT, cancelled: null });
  });

  it("gleich als abgebrochen angelegt: `cancelled` wird gesetzt", () => {
    expect(creationStamps("cancelled", JETZT)).toEqual({ completed: null, cancelled: JETZT });
  });

  it("nie beide gleichzeitig – die Sortierung beider Listen hinge sonst an demselben Wert", () => {
    for (const s of ["todo", "doing", "done", "cancelled"]) {
      const r = creationStamps(s, JETZT);
      expect(r.completed !== null && r.cancelled !== null).toBe(false);
    }
  });

  it("unbekannter Status gilt als offen und bekommt keinen Stempel", () => {
    expect(creationStamps("gibtsnicht", JETZT)).toEqual({ completed: null, cancelled: null });
  });

  it("der Stempel ist genau der übergebene Zeitpunkt – kein zweiter Aufruf der Uhr", () => {
    // Wichtig, weil `created` denselben Wert trägt: Beide dürfen nicht um Millisekunden auseinanderliegen.
    expect(creationStamps("done", "2020-01-01T00:00:00").completed).toBe("2020-01-01T00:00:00");
  });
});

describe("transitionStamps – Zeitstempel beim WECHSEL", () => {
  const N = "2026-08-05T16:00:00";

  it("offen → erledigt setzt den Erledigt-Stempel, den anderen fasst es nicht an", () => {
    expect(transitionStamps("todo", "done", N)).toEqual({ completed: N });
  });

  it("erledigt → offen leert ihn wieder", () => {
    expect(transitionStamps("done", "todo", N)).toEqual({ completed: null });
  });

  it("offen → abgebrochen setzt den Abbruch-Stempel – die Lücke, durch die man in den leeren Papierkorb fiel", () => {
    expect(transitionStamps("todo", "cancelled", N)).toEqual({ cancelled: N });
  });

  it("abgebrochen → offen leert ihn", () => {
    expect(transitionStamps("cancelled", "todo", N)).toEqual({ cancelled: null });
  });

  it("erledigt → abgebrochen: der eine geht, der andere kommt", () => {
    expect(transitionStamps("done", "cancelled", N)).toEqual({ completed: null, cancelled: N });
  });

  it("abgebrochen → erledigt: umgekehrt", () => {
    expect(transitionStamps("cancelled", "done", N)).toEqual({ completed: N, cancelled: null });
  });

  it("Wechsel INNERHALB derselben Art rührt nichts an – sonst würde der Stempel neu gesetzt", () => {
    expect(transitionStamps("todo", "doing", N)).toEqual({});
    expect(transitionStamps("done", "done", N)).toEqual({});
  });

  it("ein fehlendes Feld heißt „nicht anfassen“, nicht „leeren“", () => {
    const p = transitionStamps("todo", "done", N);
    expect("cancelled" in p).toBe(false);   // der Aufrufer darf cancelled NICHT überschreiben
    expect("completed" in p).toBe(true);
  });
});
