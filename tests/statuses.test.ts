import { describe, it, expect, afterEach } from "vitest";
import {
  initStatuses, isOpen, isDone, isCancelled, isKnownStatus,
  boardStatuses, allStatuses, statusLabel, statusIcon, statusColor,
  firstOpenStatus, firstDoneStatus,
} from "../src/statuses";
import { StoredStatus } from "../src/types";

afterEach(() => initStatuses(null));   // zurück auf die eingebauten Defaults

describe("Status-Registry (Defaults)", () => {
  it("kennt die eingebauten Arten", () => {
    expect(isOpen("todo")).toBe(true);
    expect(isOpen("doing")).toBe(true);
    expect(isDone("done")).toBe(true);
    expect(isCancelled("cancelled")).toBe(true);
    expect(isKnownStatus("todo")).toBe(true);
    expect(isKnownStatus("erfunden")).toBe(false);
  });
  it("Board-Spalten schließen cancelled aus", () => {
    expect(boardStatuses().map((s) => s.id)).toEqual(["todo", "doing", "done"]);
  });
  it("erste offene / erste erledigte Phase", () => {
    expect(firstOpenStatus()).toBe("todo");
    expect(firstDoneStatus()).toBe("done");
  });
});

describe("Status-Registry (user-definiert)", () => {
  const custom: StoredStatus[] = [
    { id: "backlog", label: "Backlog", kind: "open" },
    { id: "review", label: "Review", kind: "open", icon: "eye", color: "#3b82f6" },
    { id: "shipped", label: "Shipped", kind: "done" },
    { id: "cancelled", labelKey: "status_cancelled", kind: "cancelled" },
  ];

  it("übernimmt eigene Liste und Reihenfolge", () => {
    initStatuses(custom);
    expect(allStatuses().map((s) => s.id)).toEqual(["backlog", "review", "shipped", "cancelled"]);
    expect(firstOpenStatus()).toBe("backlog");
    expect(firstDoneStatus()).toBe("shipped");
    expect(isDone("shipped")).toBe(true);
    expect(isDone("done")).toBe(false);   // "done" ist in dieser Liste nicht mehr definiert
  });
  it("Label wörtlich, Icon-Fallback nach kind, Farbe optional", () => {
    initStatuses(custom);
    expect(statusLabel("backlog")).toBe("Backlog");
    expect(statusIcon("backlog")).toBe("circle");        // Default für kind=open
    expect(statusIcon("review")).toBe("eye");            // eigenes Icon
    expect(statusColor("review")).toBe("#3b82f6");
    expect(statusColor("backlog")).toBeUndefined();
  });
  it("leere/fehlende Liste fällt auf Defaults zurück", () => {
    initStatuses([]);
    expect(allStatuses().map((s) => s.id)).toEqual(["todo", "doing", "done", "cancelled"]);
  });
});
