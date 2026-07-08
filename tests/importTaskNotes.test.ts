import { describe, it, expect } from "vitest";
import { rruleToRecurrence, splitDT, mapStatus, mapPriority, linkBase } from "../src/importTaskNotes";

describe("rruleToRecurrence", () => {
  it("maps simple FREQ to BeautyTasks text", () => {
    expect(rruleToRecurrence("FREQ=WEEKLY")).toEqual({ recurrence: "every week", lossyOriginal: null });
    expect(rruleToRecurrence("FREQ=DAILY;INTERVAL=3")).toEqual({ recurrence: "every 3 days", lossyOriginal: null });
    expect(rruleToRecurrence("FREQ=MONTHLY;INTERVAL=2")).toEqual({ recurrence: "every 2 months", lossyOriginal: null });
  });
  it("ignores the DTSTART prefix TaskNotes adds (no false lossy note)", () => {
    expect(rruleToRecurrence("DTSTART:20260708;FREQ=DAILY;INTERVAL=1")).toEqual({ recurrence: "every day", lossyOriginal: null });
    expect(rruleToRecurrence("DTSTART:20260708;FREQ=WEEKLY;INTERVAL=2")).toEqual({ recurrence: "every 2 weeks", lossyOriginal: null });
  });
  it("keeps the original for complex rules (BYDAY etc.)", () => {
    const r = rruleToRecurrence("FREQ=WEEKLY;BYDAY=FR");
    expect(r.recurrence).toBe("every week");
    expect(r.lossyOriginal).toBe("FREQ=WEEKLY;BYDAY=FR");   // Annäherung → Original merken
  });
  it("returns null recurrence for unknown/empty", () => {
    expect(rruleToRecurrence("")).toEqual({ recurrence: null, lossyOriginal: null });
    expect(rruleToRecurrence("FREQ=HOURLY").recurrence).toBeNull();
    expect(rruleToRecurrence("FREQ=HOURLY").lossyOriginal).toBe("FREQ=HOURLY");
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
