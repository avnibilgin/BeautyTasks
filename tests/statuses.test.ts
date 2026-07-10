import { describe, it, expect, afterEach } from "vitest";
import {
  initStatuses, isOpen, isDone, isCancelled, isTrashed, isKnownStatus,
  boardStatuses, allStatuses, statusLabel, statusIcon, statusColor,
  firstOpenStatus, firstDoneStatus, firstCancelledStatus, ensureStatusInvariants,
} from "../src/statuses";
import { StoredStatus, StatusKind } from "../src/types";

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

describe("Papierkorb-Erkennung (isTrashed / firstCancelledStatus)", () => {
  it("erkennt abgebrochen per Art UND den reservierten Sentinel", () => {
    initStatuses([
      { id: "to-do", label: "To-Do", kind: "open" },
      { id: "done", labelKey: "status_done", kind: "done" },
    ]);   // KEIN cancelled-Status definiert
    expect(isTrashed("cancelled")).toBe(true);    // Sentinel bleibt erkennbar
    expect(isTrashed("to-do")).toBe(false);
    expect(isCancelled("cancelled")).toBe(false); // art-basiert wäre hier falsch -> darum isTrashed
    expect(firstCancelledStatus()).toBe("cancelled");   // Fallback = Sentinel
  });
  it("nutzt den definierten Abgebrochen-Status, wenn vorhanden", () => {
    initStatuses([
      { id: "to-do", label: "To-Do", kind: "open" },
      { id: "done", labelKey: "status_done", kind: "done" },
      { id: "verworfen", label: "Verworfen", kind: "cancelled" },
    ]);
    expect(firstCancelledStatus()).toBe("verworfen");
    expect(isTrashed("verworfen")).toBe(true);
    expect(isTrashed("cancelled")).toBe(true);    // Sentinel weiterhin (Altdaten)
  });
});

describe("Pflicht-Kategorien (ensureStatusInvariants, self-healing)", () => {
  const kinds = (list: StoredStatus[]): StatusKind[] => list.map((s) => s.kind);
  it("ergänzt fehlenden Papierkorb (Kern-Bug: gelöschter Abgebrochen-Status)", () => {
    const healed = ensureStatusInvariants([
      { id: "to-do", label: "To-Do", kind: "open" },
      { id: "in-arbeit", label: "In Arbeit", kind: "open" },
      { id: "done", labelKey: "status_done", kind: "done" },
    ]);
    expect(healed.some((s) => s.kind === "cancelled")).toBe(true);   // Papierkorb wieder da
    expect(healed[healed.length - 1].kind).toBe("cancelled");        // hinten einsortiert
    expect(healed.filter((s) => s.kind === "open")).toHaveLength(2); // nichts entfernt
  });
  it("ergänzt fehlendes offen/erledigt", () => {
    const healed = ensureStatusInvariants([{ id: "x", label: "X", kind: "cancelled" }]);
    expect(kinds(healed)).toContain("open");
    expect(kinds(healed)).toContain("done");
    expect(kinds(healed)).toContain("cancelled");
  });
  it("lässt eine bereits vollständige Liste unverändert (kein Duplizieren)", () => {
    const full: StoredStatus[] = [
      { id: "to-do", label: "To-Do", kind: "open" },
      { id: "done", labelKey: "status_done", kind: "done" },
      { id: "cancelled", labelKey: "status_cancelled", kind: "cancelled" },
    ];
    expect(ensureStatusInvariants(full).map((s) => s.id)).toEqual(["to-do", "done", "cancelled"]);
  });
  it("leere/fehlende Liste -> volle Defaults", () => {
    expect(kinds(ensureStatusInvariants([]))).toEqual(["open", "open", "done", "cancelled"]);
    expect(kinds(ensureStatusInvariants(null))).toEqual(["open", "open", "done", "cancelled"]);
  });
  it("vergibt eindeutige Ids, falls der Default-Name schon existiert", () => {
    const healed = ensureStatusInvariants([{ id: "cancelled", label: "Fake offen", kind: "open" }]);
    // "cancelled"-Id ist belegt -> der ergänzte Papierkorb bekommt eine eindeutige Id.
    const trash = healed.filter((s) => s.kind === "cancelled");
    expect(trash).toHaveLength(1);
    expect(trash[0].id).not.toBe("cancelled");
  });
});
