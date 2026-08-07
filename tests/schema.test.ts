import { describe, it, expect } from "vitest";
import { schemaVersionOf, pendingSteps, nextSchemaVersion, CURRENT_SCHEMA, SCHEMA_STEPS } from "../src/schema";

const ALLE = { didDescriptionMigration: true, didInboxRemoval: true, didTitleMigration: true };
const offen = (saved: Parameters<typeof schemaVersionOf>[0]): string[] => pendingSteps(schemaVersionOf(saved));

describe("schemaVersionOf – Stand einer vorhandenen data.json", () => {
  it("frische Installation (keine Datei) startet auf dem aktuellen Stand", () => {
    expect(schemaVersionOf(null)).toBe(CURRENT_SCHEMA);
    expect(schemaVersionOf(undefined)).toBe(CURRENT_SCHEMA);
    expect(offen(null)).toEqual([]);
  });

  it("Altbestand ohne jeden Marker: alles offen", () => {
    expect(schemaVersionOf({})).toBe(0);
    expect(offen({})).toEqual([...SCHEMA_STEPS]);
  });

  it("Altbestand mit allen drei Markern: die drei alten Schritte sind durch, spätere nicht", () => {
    // Die Marker decken nur die ersten DREI Schritte ab – mehr gab es zu ihrer Zeit nicht.
    // Jeder später angehängte Schritt muss folglich offen bleiben, sonst überspränge ihn genau
    // die Gruppe, die ihn braucht: bestehende Vaults.
    expect(schemaVersionOf(ALLE)).toBe(3);
    expect(offen(ALLE)).toEqual(SCHEMA_STEPS.slice(3));
  });

  it("zählt den zusammenhängenden Anfang der Marker", () => {
    expect(schemaVersionOf({ didDescriptionMigration: true })).toBe(1);
    expect(offen({ didDescriptionMigration: true })).toEqual(["inboxRemoval", "titles", ...SCHEMA_STEPS.slice(3)]);
    expect(schemaVersionOf({ didDescriptionMigration: true, didInboxRemoval: true })).toBe(2);
  });

  it("bei einer LÜCKE wird ab der Lücke wiederholt – erlaubt, weil jeder Schritt wiederholbar ist", () => {
    const lueckig = { didDescriptionMigration: true, didTitleMigration: true };   // Schritt 2 fehlt
    expect(schemaVersionOf(lueckig)).toBe(1);
    expect(offen(lueckig)).toEqual(["inboxRemoval", "titles", ...SCHEMA_STEPS.slice(3)]);
  });

  it("nimmt nur echte true-Werte als gelaufen (kein truthy-Schummeln)", () => {
    expect(schemaVersionOf({ didDescriptionMigration: 1 })).toBe(0);
    expect(schemaVersionOf({ didDescriptionMigration: "ja" })).toBe(0);
    expect(schemaVersionOf({ didDescriptionMigration: false })).toBe(0);
  });
});

describe("schemaVersionOf – gespeicherte Zahl schlägt die Marker", () => {
  it("nimmt den gespeicherten Wert, auch wenn die alten Marker etwas anderes sagen", () => {
    expect(schemaVersionOf({ schemaVersion: 1, ...ALLE })).toBe(1);
    expect(offen({ schemaVersion: 1, ...ALLE })).toEqual(["inboxRemoval", "titles", ...SCHEMA_STEPS.slice(3)]);
  });

  it("Datei aus einer NEUEREN Fassung: Wert bleibt erhalten und es läuft nichts", () => {
    expect(schemaVersionOf({ schemaVersion: CURRENT_SCHEMA + 2 })).toBe(CURRENT_SCHEMA + 2);
    expect(offen({ schemaVersion: CURRENT_SCHEMA + 2 })).toEqual([]);
    // Entscheidend: der höhere Stand darf beim Zurückschreiben NICHT verloren gehen,
    // sonst ließe die neuere Fassung ihre Schritte erneut laufen.
    expect(nextSchemaVersion(CURRENT_SCHEMA + 2)).toBe(CURRENT_SCHEMA + 2);
  });

  it("unbrauchbare Werte fallen auf die Marker zurück statt etwas zu überspringen", () => {
    // Zurückfallen heisst: aus den MARKERN ableiten – die decken drei Schritte ab, nicht alle.
    expect(schemaVersionOf({ schemaVersion: NaN, ...ALLE })).toBe(3);
    expect(schemaVersionOf({ schemaVersion: "2", ...ALLE })).toBe(3);
    expect(schemaVersionOf({ schemaVersion: null, ...ALLE })).toBe(3);
    expect(schemaVersionOf({ schemaVersion: Infinity, ...ALLE })).toBe(3);
  });

  it("negative oder gebrochene Zahlen werden gutmütig eingefangen", () => {
    expect(schemaVersionOf({ schemaVersion: -5 })).toBe(0);
    expect(schemaVersionOf({ schemaVersion: 1.9 })).toBe(1);
  });
});

describe("nextSchemaVersion – was nach dem Lauf in der Datei steht", () => {
  it("hebt einen Altbestand auf den aktuellen Stand", () => {
    expect(nextSchemaVersion(0)).toBe(CURRENT_SCHEMA);
    expect(nextSchemaVersion(1)).toBe(CURRENT_SCHEMA);
  });

  it("senkt nie ab", () => {
    expect(nextSchemaVersion(CURRENT_SCHEMA + 1)).toBe(CURRENT_SCHEMA + 1);
  });
});

describe("SCHEMA_STEPS – die Reihenfolge ist Vertrag", () => {
  it("steht fest und stimmt mit CURRENT_SCHEMA überein", () => {
    expect(SCHEMA_STEPS).toEqual(["descriptions", "inboxRemoval", "titles", "recurrenceRRule"]);
    expect(CURRENT_SCHEMA).toBe(SCHEMA_STEPS.length);
  });
});
