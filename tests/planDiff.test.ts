import { describe, it, expect } from "vitest";
import { planDiff } from "../src/filterEngine";

/**
 * Die Verzweigung des inkrementellen Nachzeichnens (s. tryPatchList in heuteView).
 *
 * Hier entscheidet sich, ob der Nutzer veraltete Zeilen sieht. Die Regel dahinter ist bewusst
 * feige: Nur wenn die Sektionen exakt dieselben sind – gleiche Anzahl, gleiche Titel, gleiche
 * Reihenfolge – darf nachgefüllt werden. Alles andere ist ein vollständiger Neuaufbau. Ein
 * überflüssiger Neuaufbau kostet Zeit, ein übersehener Unterschied kostet Vertrauen.
 */

const s = (title: string, sig: string) => ({ title, sig });

describe("planDiff – was muss neu gefüllt werden?", () => {
  it("meldet nichts, wenn sich nichts geändert hat", () => {
    const plan = [s("Heute", "a"), s("Morgen", "b")];
    expect(planDiff(plan, [s("Heute", "a"), s("Morgen", "b")])).toEqual([]);
  });

  it("meldet genau die Sektion, deren Inhalt sich geändert hat", () => {
    const vorher = [s("Heute", "a"), s("Morgen", "b"), s("Später", "c")];
    expect(planDiff(vorher, [s("Heute", "a"), s("Morgen", "B!"), s("Später", "c")])).toEqual([1]);
  });

  it("meldet auch mehrere – eine Aufgabe kann zwei Sektionen berühren", () => {
    const vorher = [s("Heute", "a"), s("Morgen", "b")];
    expect(planDiff(vorher, [s("Heute", "A!"), s("Morgen", "B!")])).toEqual([0, 1]);
  });
});

describe("planDiff – wann darf gar nicht gepatcht werden?", () => {
  it("bei einer zusätzlichen Sektion (neuer Tag in der Datums-Gruppierung)", () => {
    expect(planDiff([s("Heute", "a")], [s("Heute", "a"), s("Morgen", "b")])).toBeNull();
  });

  it("bei einer weggefallenen Sektion (letzte Aufgabe des Tages abgehakt)", () => {
    expect(planDiff([s("Heute", "a"), s("Morgen", "b")], [s("Heute", "a")])).toBeNull();
  });

  it("bei einer umbenannten Sektion – der Titel ist die Identität, nicht die Position", () => {
    expect(planDiff([s("Heute", "a")], [s("Überfällig", "a")])).toBeNull();
  });

  it("bei vertauschter Reihenfolge, auch wenn die Inhalte dieselben sind", () => {
    const vorher = [s("Heute", "a"), s("Morgen", "b")];
    expect(planDiff(vorher, [s("Morgen", "b"), s("Heute", "a")])).toBeNull();
  });

  it("wenn eine Sektion denselben Titel behält, aber an anderer Stelle steht", () => {
    // Gleiche Anzahl, gleiche Titelmenge – aber Sektion 0 heisst jetzt anders als vorher.
    expect(planDiff([s("A", "1"), s("B", "2")], [s("B", "2"), s("A", "1")])).toBeNull();
  });
});

describe("planDiff – Randfälle", () => {
  it("leer gegen leer ist erlaubt und ergibt nichts zu tun", () => {
    expect(planDiff([], [])).toEqual([]);
  });

  it("leer gegen gefüllt ist ein Neuaufbau", () => {
    expect(planDiff([], [s("Heute", "a")])).toBeNull();
    expect(planDiff([s("Heute", "a")], [])).toBeNull();
  });

  it("unterscheidet Titel und Signatur nicht durcheinander", () => {
    // Gleicher Titel, andere Signatur -> füllen. Anderer Titel, gleiche Signatur -> neu bauen.
    expect(planDiff([s("X", "1")], [s("X", "2")])).toEqual([0]);
    expect(planDiff([s("X", "1")], [s("Y", "1")])).toBeNull();
  });
});
