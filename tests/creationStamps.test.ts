import { describe, it, expect, beforeAll } from "vitest";
import { creationStamps } from "../src/taskService";
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
