import { describe, it, expect, beforeAll } from "vitest";
import { mergeFieldMapping, buildStatusResolver, buildPriorityResolver } from "../src/tasknotesApi";
import { initStatuses } from "../src/statuses";
import { Priority } from "../src/types";

beforeAll(() => initStatuses(null));   // todo · doing · done · cancelled

/** Die Namenstabelle des Importeurs, nachgebildet als Rückfall. */
const nameStatus = (raw: string): string =>
  ({ open: "todo", "in-progress": "doing", done: "done", cancelled: "cancelled" } as Record<string, string>)[raw.toLowerCase()] ?? "todo";
const namePrio = (raw: string): Priority =>
  ({ low: "low", normal: "normal", high: "high" } as Record<string, Priority>)[raw.toLowerCase()] ?? "normal";

describe("mergeFieldMapping – eigene Feldnamen schlagen unsere Vorgabe", () => {
  const vorgabe = { title: "title", status: "status", due: "due", tags: "tags" };

  it("übernimmt umbenannte Felder", () => {
    expect(mergeFieldMapping(vorgabe, { title: "tn_titel", due: "faellig" }))
      .toEqual({ title: "tn_titel", status: "status", due: "faellig", tags: "tags" });
  });

  it("behält die Vorgabe für Rollen, die TaskNotes gar nicht führt (z. B. tags)", () => {
    expect(mergeFieldMapping(vorgabe, {}).tags).toBe("tags");
  });

  it("ignoriert leere Angaben statt einen leeren Schlüssel zu übernehmen", () => {
    expect(mergeFieldMapping(vorgabe, { status: "" }).status).toBe("status");
  });

  it("nimmt keine Rollen auf, die wir nicht kennen", () => {
    expect(Object.keys(mergeFieldMapping(vorgabe, { pomodoros: "pomo" }))).toEqual(Object.keys(vorgabe));
  });
});

describe("buildStatusResolver – isCompleted ist maßgeblich, nicht der Name", () => {
  const katalog = [
    { value: "none", isCompleted: false },
    { value: "open", isCompleted: false },
    { value: "in-progress", isCompleted: false },
    { value: "done", isCompleted: true },
  ];

  it("erledigte Status erkennt es an isCompleted", () => {
    expect(buildStatusResolver(katalog, nameStatus)("done")).toBe("done");
  });

  it("ein FREMD benannter erledigter Status wird trotzdem erledigt – das kann die Namenstabelle nicht", () => {
    const eigen = [{ value: "abgehakt", isCompleted: true }, { value: "archiviert", isCompleted: true }];
    const r = buildStatusResolver(eigen, nameStatus);
    expect(r("abgehakt")).toBe("done");
    expect(r("archiviert")).toBe("done");
    expect(nameStatus("abgehakt")).toBe("todo");   // Gegenprobe: ohne Katalog wäre es „offen“
  });

  it("offene Status mit bekanntem Namen landen in Arbeit", () => {
    expect(buildStatusResolver(katalog, nameStatus)("in-progress")).toBe("doing");
  });

  it("unbekannte offene Status bleiben offen statt zu verschwinden", () => {
    expect(buildStatusResolver([{ value: "wartet", isCompleted: false }], nameStatus)("wartet")).toBe("todo");
  });

  it("Status, die der Katalog gar nicht kennt, gehen an die Namenstabelle", () => {
    expect(buildStatusResolver(katalog, nameStatus)("cancelled")).toBe("cancelled");
  });

  it("leerer Wert ergibt die erste offene Phase", () => {
    expect(buildStatusResolver(katalog, nameStatus)("")).toBe("todo");
  });

  it("kaputte Katalogeinträge kippen nichts um", () => {
    const r = buildStatusResolver([{ value: null }, {}, { value: "done", isCompleted: "ja" }] as never, nameStatus);
    expect(r("done")).toBe("done");   // isCompleted ist nicht true -> Namenstabelle greift
  });
});

describe("buildPriorityResolver – Reihenfolge rettet, was der Name nicht hergibt", () => {
  it("bekannte Namen gewinnen", () => {
    const r = buildPriorityResolver([{ value: "high", weight: 3 }], namePrio);
    expect(r("high")).toBe("high");
  });

  it("eigene Stufen werden über weight auf unsere Skala gelegt", () => {
    const eigen = [{ value: "p4", weight: 1 }, { value: "p3", weight: 2 }, { value: "p2", weight: 3 }, { value: "p1", weight: 4 }];
    const r = buildPriorityResolver(eigen, namePrio);
    expect(r("p4")).toBe("lowest");
    expect(r("p1")).toBe("highest");
    expect(namePrio("p1")).toBe("normal");   // Gegenprobe: ohne Katalog wäre alles „normal“
  });

  it("„normal“ bleibt normal, auch wenn es in der Mitte der eigenen Skala steht", () => {
    const r = buildPriorityResolver([{ value: "low", weight: 1 }, { value: "normal", weight: 2 }], namePrio);
    expect(r("normal")).toBe("normal");
  });

  it("eine einzige Stufe ergibt normal statt einer willkürlichen Zuordnung", () => {
    expect(buildPriorityResolver([{ value: "egal", weight: 1 }], namePrio)("egal")).toBe("normal");
  });

  it("leerer Katalog verhält sich wie vorher", () => {
    expect(buildPriorityResolver([], namePrio)("irgendwas")).toBe("normal");
  });
});
