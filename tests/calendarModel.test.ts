import { describe, it, expect } from "vitest";
import {
  addDays, addMonths, startOfWeek, monthGrid, weekDays,
  bucketByDue, minutesOf, layoutDay, allDayOf, DEFAULT_BLOCK_MIN, yearMonths, addYears,
} from "../src/calendarModel";
import { Task } from "../src/types";

function mk(p: Partial<Task>): Task {
  return {
    id: "t", path: (p.title ?? "x") + ".md", title: "x", status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null,
    start: null, project: null, area: null, parent: null, labels: [],
    recurrence: null, recurBasis: "due", created: "", completed: null, cancelled: null,
    externalId: null, reminders: [], ...p,
  };
}

describe("Datums-Arithmetik", () => {
  it("addDays über Monats- und Jahresgrenze", () => {
    expect(addDays("2026-07-31", 1)).toBe("2026-08-01");
    expect(addDays("2026-01-01", -1)).toBe("2025-12-31");
  });
  it("addDays überspringt die DST-Umstellung nicht", () => {
    // 29.03.2026 = Beginn der Sommerzeit in Europa. Über UTC-Arithmetik landete man auf demselben Tag.
    expect(addDays("2026-03-28", 1)).toBe("2026-03-29");
    expect(addDays("2026-03-29", 1)).toBe("2026-03-30");
    expect(addDays("2026-10-25", 1)).toBe("2026-10-26");   // Ende der Sommerzeit
  });
  it("addMonths klemmt den Tag auf den Monatsletzten", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");   // kein Überlauf in den März
    expect(addMonths("2024-01-31", 1)).toBe("2024-02-29");   // Schaltjahr
    expect(addMonths("2026-03-15", -1)).toBe("2026-02-15");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });
  it("startOfWeek liefert den Montag (Sonntag gehört zur Vorwoche)", () => {
    expect(startOfWeek("2026-07-13")).toBe("2026-07-13");   // ist selbst ein Montag
    expect(startOfWeek("2026-07-19")).toBe("2026-07-13");   // Sonntag -> derselbe Montag
    expect(startOfWeek("2026-07-12")).toBe("2026-07-06");   // Sonntag der Vorwoche
  });
});

describe("monthGrid", () => {
  it("immer 42 Tage, beginnt an einem Montag, lückenlos", () => {
    const g = monthGrid("2026-07-13");
    expect(g).toHaveLength(42);
    expect(g[0]).toBe("2026-06-29");                       // Montag vor dem 1. Juli
    expect(g[41]).toBe(addDays(g[0], 41));
    for (let i = 1; i < g.length; i++) expect(g[i]).toBe(addDays(g[i - 1], 1));
  });
  it("enthält jeden Tag des Monats", () => {
    const g = monthGrid("2026-02-01");
    for (let d = 1; d <= 28; d++) expect(g).toContain(`2026-02-${String(d).padStart(2, "0")}`);
  });
  it("hängt am Monat, nicht am Anker-Tag", () => {
    expect(monthGrid("2026-07-01")).toEqual(monthGrid("2026-07-31"));
  });
});

describe("weekDays", () => {
  it("7 Tage, Montag bis Sonntag", () => {
    const w = weekDays("2026-07-15");                       // Mittwoch
    expect(w).toEqual(["2026-07-13", "2026-07-14", "2026-07-15", "2026-07-16", "2026-07-17", "2026-07-18", "2026-07-19"]);
  });
});

describe("bucketByDue", () => {
  it("gruppiert nach Fälligkeitstag, ignoriert Aufgaben ohne Datum", () => {
    const a = mk({ title: "a", due: "2026-07-13" });
    const b = mk({ title: "b", due: "2026-07-13", dueTime: "09:00" });
    const c = mk({ title: "c", due: "2026-07-14" });
    const d = mk({ title: "d" });                           // ohne due -> nicht im Kalender
    const m = bucketByDue([a, b, c, d]);
    expect(m.get("2026-07-13")).toEqual([a, b]);
    expect(m.get("2026-07-14")).toEqual([c]);
    expect(m.size).toBe(2);
  });
  it("due mit Zeitanteil zählt zum richtigen Tag", () => {
    const m = bucketByDue([mk({ due: "2026-07-13T23:30" })]);
    expect(m.get("2026-07-13")).toHaveLength(1);
  });
});

describe("minutesOf / allDayOf", () => {
  it("dueTime -> Minuten seit Mitternacht", () => {
    expect(minutesOf(mk({ due: "2026-07-13", dueTime: "09:30" }))).toBe(570);
    expect(minutesOf(mk({ due: "2026-07-13", dueTime: "00:00" }))).toBe(0);
    expect(minutesOf(mk({ due: "2026-07-13", dueTime: "23:59" }))).toBe(1439);
  });
  it("ohne Uhrzeit null (= ganztägig)", () => {
    expect(minutesOf(mk({ due: "2026-07-13" }))).toBeNull();
    expect(minutesOf(mk({ due: "2026-07-13", dueTime: "quatsch" }))).toBeNull();
  });
  it("allDayOf trennt die Ganztägigen ab", () => {
    const a = mk({ title: "a", due: "2026-07-13" });
    const b = mk({ title: "b", due: "2026-07-13", dueTime: "09:00" });
    expect(allDayOf([a, b])).toEqual([a]);
  });
});

describe("layoutDay", () => {
  it("Dauer bestimmt die Blockhöhe, sonst Default", () => {
    const [b] = layoutDay([mk({ due: "2026-07-13", dueTime: "09:00", duration: 90 })]);
    expect(b.startMin).toBe(540);
    expect(b.endMin).toBe(630);
    const [d] = layoutDay([mk({ due: "2026-07-13", dueTime: "09:00" })]);
    expect(d.endMin).toBe(540 + DEFAULT_BLOCK_MIN);
  });
  it("Block wird bei Mitternacht gekappt", () => {
    const [b] = layoutDay([mk({ due: "2026-07-13", dueTime: "23:30", duration: 120 })]);
    expect(b.endMin).toBe(1440);
  });
  it("nicht überlappende Blöcke bekommen die volle Breite", () => {
    const bs = layoutDay([
      mk({ title: "a", due: "2026-07-13", dueTime: "09:00", duration: 60 }),
      mk({ title: "b", due: "2026-07-13", dueTime: "11:00", duration: 60 }),
    ]);
    expect(bs.map((b) => [b.col, b.cols])).toEqual([[0, 1], [0, 1]]);
  });
  it("zwei überlappende Blöcke teilen sich die Breite", () => {
    const bs = layoutDay([
      mk({ title: "a", due: "2026-07-13", dueTime: "09:00", duration: 60 }),
      mk({ title: "b", due: "2026-07-13", dueTime: "09:30", duration: 60 }),
    ]);
    expect(bs.map((b) => [b.col, b.cols])).toEqual([[0, 2], [1, 2]]);
  });
  it("Kette a-b-c: ein Cluster, aber zwei Spalten genügen", () => {
    const bs = layoutDay([
      mk({ title: "a", due: "2026-07-13", dueTime: "09:00", duration: 60 }),   // 09:00-10:00
      mk({ title: "b", due: "2026-07-13", dueTime: "09:30", duration: 60 }),   // 09:30-10:30
      mk({ title: "c", due: "2026-07-13", dueTime: "10:00", duration: 60 }),   // 10:00-11:00
    ]);
    // c überlappt zwar b (denselben Cluster), aber NICHT a -> es erbt a's Spalte. Zwei Spalten
    // reichen, die Blöcke werden dadurch breiter. (Wie Google Calendar; nicht eine Spalte je Block.)
    expect(bs.map((b) => b.col)).toEqual([0, 1, 0]);
    expect(bs.every((b) => b.cols === 2)).toBe(true);
  });
  it("nach einer Lücke beginnt ein neuer Cluster mit voller Breite", () => {
    const bs = layoutDay([
      mk({ title: "a", due: "2026-07-13", dueTime: "09:00", duration: 60 }),
      mk({ title: "b", due: "2026-07-13", dueTime: "09:30", duration: 60 }),
      mk({ title: "c", due: "2026-07-13", dueTime: "14:00", duration: 60 }),   // weit danach
    ]);
    expect(bs[2].cols).toBe(1);
    expect(bs[0].cols).toBe(2);
  });
  it("Ganztägige gehören nicht ins Zeitraster", () => {
    expect(layoutDay([mk({ due: "2026-07-13" })])).toEqual([]);
  });
});

describe("Jahr", () => {
  it("yearMonths liefert die zwölf Monatsersten", () => {
    const m = yearMonths("2026-07-13");
    expect(m).toHaveLength(12);
    expect(m[0]).toBe("2026-01-01");
    expect(m[11]).toBe("2026-12-01");
  });
  it("addYears klemmt den 29. Februar", () => {
    expect(addYears("2026-07-13", 1)).toBe("2027-07-13");
    expect(addYears("2026-07-13", -1)).toBe("2025-07-13");
    expect(addYears("2024-02-29", 1)).toBe("2025-02-28");   // 2025 ist kein Schaltjahr
  });
});
