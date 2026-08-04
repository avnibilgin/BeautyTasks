import { describe, it, expect } from "vitest";
import { mergeEventBody } from "../src/gcalSync";

/** So sieht ein Termin aus, den ein Nutzer in Google weiterbearbeitet hat. */
const inGoogle = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  id: "ev-1", etag: '"123"', status: "confirmed", created: "2026-01-01T10:00:00Z",
  summary: "Zahnarzt",
  start: { date: "2026-10-03" }, end: { date: "2026-10-04" },
  description: "Versichertenkarte mitnehmen",
  location: "Hauptstraße 12",
  attendees: [{ email: "partner@example.com", responseStatus: "accepted" }],
  colorId: "11",
  transparency: "opaque",
  ...over,
});

/** Was BeautyTasks aus der Aufgabe baut (eventBody) – die fünf Dinge, die es kennt. */
const ours = (over: Record<string, unknown> = {}): Record<string, unknown> => ({
  summary: "Zahnarzt (verschoben)",
  start: { date: "2026-10-04" }, end: { date: "2026-10-05" },
  reminders: { useDefault: true },
  extendedProperties: { private: { syncSource: "beautytasks", btTaskId: "t-1" } },
  ...over,
});

describe("mergeEventBody – in Google Ergänztes darf ein Push nicht löschen", () => {
  it("behält Beschreibung, Ort, Teilnehmer und Farbe", () => {
    const m = mergeEventBody(inGoogle(), ours());
    expect(m.description).toBe("Versichertenkarte mitnehmen");
    expect(m.location).toBe("Hauptstraße 12");
    expect(m.attendees).toEqual([{ email: "partner@example.com", responseStatus: "accepted" }]);
    expect(m.colorId).toBe("11");
    expect(m.transparency).toBe("opaque");
  });

  it("lässt unsere fünf Felder gewinnen", () => {
    const m = mergeEventBody(inGoogle(), ours());
    expect(m.summary).toBe("Zahnarzt (verschoben)");
    expect(m.start).toEqual({ date: "2026-10-04" });
    expect(m.end).toEqual({ date: "2026-10-05" });
    expect(m.reminders).toEqual({ useDefault: true });
    expect(m.extendedProperties).toEqual({ private: { syncSource: "beautytasks", btTaskId: "t-1" } });
  });

  it("ersetzt start/end GANZ statt zu verschmelzen – sonst „Invalid start time“", () => {
    // Ganztag -> Uhrzeit: im Ergebnis darf kein `date` neben `dateTime` stehen bleiben.
    const m = mergeEventBody(inGoogle(), ours({
      start: { dateTime: "2026-10-04T09:30:00+02:00", timeZone: "Europe/Berlin" },
      end: { dateTime: "2026-10-04T10:30:00+02:00", timeZone: "Europe/Berlin" },
    }));
    expect(m.start).toEqual({ dateTime: "2026-10-04T09:30:00+02:00", timeZone: "Europe/Berlin" });
    expect(m.end).toEqual({ dateTime: "2026-10-04T10:30:00+02:00", timeZone: "Europe/Berlin" });
  });

  it("übernimmt eine in Google angelegte Serie NICHT – BeautyTasks wiederholt über Aufgaben", () => {
    const m = mergeEventBody(inGoogle({ recurrence: ["RRULE:FREQ=WEEKLY;BYDAY=MO"] }), ours());
    expect(m).not.toHaveProperty("recurrence");
  });

  it("gibt ohne lesbares Event unseren Rumpf allein zurück (Verhalten wie bisher)", () => {
    expect(mergeEventBody(null, ours())).toEqual(ours());
  });

  it("verändert weder das gelesene Event noch unseren Rumpf", () => {
    const g = inGoogle({ recurrence: ["RRULE:FREQ=WEEKLY"] });
    const o = ours();
    mergeEventBody(g, o);
    expect(g.recurrence).toEqual(["RRULE:FREQ=WEEKLY"]);   // Vorlage unangetastet
    expect(g.summary).toBe("Zahnarzt");
    expect(o.summary).toBe("Zahnarzt (verschoben)");
  });

  it("reicht Googles eigene Felder unverändert durch (get→update ist der vorgesehene Weg)", () => {
    const m = mergeEventBody(inGoogle(), ours());
    expect(m.id).toBe("ev-1");
    expect(m.status).toBe("confirmed");
    expect(m.created).toBe("2026-01-01T10:00:00Z");
  });
});
