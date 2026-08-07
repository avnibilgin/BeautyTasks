import { describe, it, expect } from "vitest";
import { rruleToRecurrence, splitDT, mapStatus, mapPriority, linkBase } from "../src/importTaskNotes";

describe("rruleToRecurrence", () => {
  // Seit unser Speicherformat selbst RRULE ist, wird uebernommen statt uebersetzt. Frueher wurde
  // hier auf "every n unit" angenaehert und der Rest als Verlust gemeldet - genau die Verluste
  // gibt es nicht mehr.
  it("uebernimmt eine gueltige Regel unveraendert", () => {
    expect(rruleToRecurrence("FREQ=WEEKLY")).toEqual({ recurrence: "FREQ=WEEKLY", lossyOriginal: null });
    expect(rruleToRecurrence("FREQ=DAILY;INTERVAL=3")).toEqual({ recurrence: "FREQ=DAILY;INTERVAL=3", lossyOriginal: null });
  });

  it("behaelt jetzt auch, was frueher verlorenging", () => {
    // BYDAY war bis 1.40.x ein "Annaeherung + Original merken"-Fall.
    expect(rruleToRecurrence("FREQ=WEEKLY;BYDAY=FR")).toEqual({ recurrence: "FREQ=WEEKLY;BYDAY=FR", lossyOriginal: null });
    expect(rruleToRecurrence("FREQ=MONTHLY;BYDAY=-1FR")).toEqual({ recurrence: "FREQ=MONTHLY;BYDAY=-1FR", lossyOriginal: null });
  });

  it("stellt die alte Schreibweise beim Import gleich mit um", () => {
    // Sonst kaeme ueber einen Import das zweite Schreibformat zurueck, das wir abgeschafft haben.
    expect(rruleToRecurrence("every 2 weeks")).toEqual({ recurrence: "FREQ=WEEKLY;INTERVAL=2", lossyOriginal: null });
  });

  it("DTSTART gehoert zur Quelle, nicht zur Regel - und stoert nicht", () => {
    expect(rruleToRecurrence("DTSTART:20260708;FREQ=DAILY;INTERVAL=1").lossyOriginal).toBeNull();
    expect(rruleToRecurrence("DTSTART:20260708;FREQ=DAILY;INTERVAL=1").recurrence).toContain("FREQ=DAILY");
  });

  it("meldet nur noch, was wir wirklich nicht fuehren koennen", () => {
    expect(rruleToRecurrence("")).toEqual({ recurrence: null, lossyOriginal: null });
    // Unterhalb eines Tages: unsere Faelligkeiten sind Kalendertage.
    expect(rruleToRecurrence("FREQ=HOURLY")).toEqual({ recurrence: null, lossyOriginal: "FREQ=HOURLY" });
    // COUNT wird uebernommen: Die Folgeaufgabe traegt es um eins verringert, dadurch laeuft die
    // Kette ab (s. recurrence.successorRule).
    expect(rruleToRecurrence("FREQ=WEEKLY;COUNT=5")).toEqual({ recurrence: "FREQ=WEEKLY;COUNT=5", lossyOriginal: null });
  });
});

describe("splitDT", () => {
  it("splits date-only and datetime", () => {
    expect(splitDT("2026-02-20")).toEqual({ date: "2026-02-20", time: null });
    expect(splitDT("2026-01-10T09:30:00Z")).toEqual({ date: "2026-01-10", time: "09:30" });
  });
  it("handles empty/non-string", () => {
    expect(splitDT("")).toEqual({ date: null, time: null });
    expect(splitDT(null)).toEqual({ date: null, time: null });
  });
});

describe("mapStatus", () => {
  it("maps TaskNotes statuses to BeautyTasks kinds", () => {
    expect(mapStatus("open")).toBe("todo");
    expect(mapStatus("in-progress")).toBe("doing");
    expect(mapStatus("done")).toBe("done");
    expect(mapStatus("cancelled")).toBe("cancelled");
  });
  it("keeps a matching BeautyTasks status id and falls back to open", () => {
    expect(mapStatus("doing")).toBe("doing");
    expect(mapStatus("something-unknown")).toBe("todo");
  });
});

describe("mapPriority", () => {
  it("maps and normalizes priorities", () => {
    expect(mapPriority("high")).toBe("high");
    expect(mapPriority("urgent")).toBe("highest");
    expect(mapPriority("")).toBe("normal");
    expect(mapPriority("weird")).toBe("normal");
    expect(mapPriority("lowest")).toBe("lowest");
  });
});

describe("linkBase", () => {
  it("extracts basename from wikilinks and plain text", () => {
    expect(linkBase("[[My Project]]")).toBe("My Project");
    expect(linkBase("[[folder/My Project|Alias]]")).toBe("My Project");
    expect(linkBase("Plain Name")).toBe("Plain Name");
  });
});
