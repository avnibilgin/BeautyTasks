import { describe, it, expect, afterEach } from "vitest";
import {
  normalizeFieldName, resolveFieldNames, initFieldNames, fieldKey, allFieldNames,
  DEFAULT_FIELD_NAMES, isEntityValue, isTypeRenameTarget,
} from "../src/fieldNames";

afterEach(() => initFieldNames(null));   // Registry nach jedem Test zurücksetzen

describe("normalizeFieldName – eine vertippte Einstellung darf nie Daten treffen", () => {
  it("nimmt gültige Feldnamen unverändert", () => {
    expect(normalizeFieldName("type", "bt_type")).toBe("bt_type");
    expect(normalizeFieldName("title", "  Titel-Feld  ")).toBe("Titel-Feld");
  });

  it("fällt bei unbrauchbaren Namen auf die Vorgabe des JEWEILIGEN Feldes zurück", () => {
    for (const bad of ["", "   ", "2typ", "mein feld", "feld:x", "feld#1", undefined, null, 42]) {
      expect(normalizeFieldName("type", bad)).toBe("type");
      expect(normalizeFieldName("title", bad)).toBe("title");
    }
  });

  it("sperrt die festen Felder von BeautyTasks und Obsidian", () => {
    for (const reserved of ["status", "due", "project", "parent", "labels", "id", "description", "tags", "aliases", "STATUS"]) {
      expect(normalizeFieldName("type", reserved)).toBe("type");
      expect(normalizeFieldName("title", reserved)).toBe("title");
    }
  });

  // Der Kernfall des generischen Modells: Zwei konfigurierbare Felder dürfen nie im selben
  // Schlüssel landen – sonst stünden `task` und der Titel in einer Eigenschaft.
  it("sperrt den aktuellen Namen des ANDEREN konfigurierbaren Feldes", () => {
    const current = { type: "bt_type", title: "bt_title" };
    expect(normalizeFieldName("type", "bt_title", current)).toBe("type");
    expect(normalizeFieldName("title", "bt_type", current)).toBe("title");
  });

  it("sperrt auch die VORGABE des anderen Feldes – kein Umweg über einen Zwischenschritt", () => {
    const current = { type: "bt_type", title: "bt_title" };
    expect(normalizeFieldName("type", "title", current)).toBe("type");
    expect(normalizeFieldName("title", "type", current)).toBe("title");
  });

  it("das Feld darf seinen eigenen Namen behalten", () => {
    expect(normalizeFieldName("type", "type")).toBe("type");
    expect(normalizeFieldName("title", "title")).toBe("title");
  });
});

describe("resolveFieldNames – gespeicherte Einstellung zu geprüfter Tabelle", () => {
  it("ergänzt Fehlendes mit den Vorgaben", () => {
    expect(resolveFieldNames({ type: "bt_type" })).toEqual({ type: "bt_type", title: "title" });
    expect(resolveFieldNames(null)).toEqual(DEFAULT_FIELD_NAMES);
    expect(resolveFieldNames(undefined)).toEqual(DEFAULT_FIELD_NAMES);
  });

  it("löst eine gespeicherte Doppelbelegung auf, statt sie zu übernehmen", () => {
    // Beide auf denselben Namen: das zweite Feld fällt auf seine Vorgabe zurück.
    const r = resolveFieldNames({ type: "gemeinsam", title: "gemeinsam" });
    expect(r.type).toBe("gemeinsam");
    expect(r.title).toBe("title");
  });
});

describe("Feldnamen-Registry", () => {
  it("liefert die Vorgaben, solange nichts gesetzt ist", () => {
    expect(fieldKey("type")).toBe("type");
    expect(fieldKey("title")).toBe("title");
  });

  it("übernimmt gespeicherte Namen und normalisiert dabei", () => {
    initFieldNames({ type: "bt_type", title: "status" });   // `status` ist reserviert
    expect(fieldKey("type")).toBe("bt_type");
    expect(fieldKey("title")).toBe("title");
    expect(allFieldNames()).toEqual({ type: "bt_type", title: "title" });
  });
});

describe("isEntityValue – welche Werte gehören BeautyTasks", () => {
  it("erkennt die vier eigenen Werte", () => {
    for (const v of ["task", "project", "area", "filter"]) expect(isEntityValue(v)).toBe(true);
  });

  it("lässt fremde Taxonomien in Ruhe – sie werden bei einem Wechsel nicht umgeschrieben", () => {
    for (const v of ["meeting", "note", "person", "", undefined, null, 1, ["task"]]) expect(isEntityValue(v)).toBe(false);
  });
});

describe("isTypeRenameTarget – welche Notizen ein type-Wechsel umschreibt", () => {
  it("nimmt alle vier BeautyTasks-Werte mit", () => {
    for (const v of ["task", "project", "area", "filter"])
      expect(isTypeRenameTarget({ type: v }, "type", "bt_type")).toBe(true);
  });

  it("lässt fremde Werte im selben Feld unangetastet", () => {
    expect(isTypeRenameTarget({ type: "meeting" }, "type", "bt_type")).toBe(false);
    expect(isTypeRenameTarget({ type: "person" }, "type", "bt_type")).toBe(false);
  });

  it("überspringt Notizen ohne das alte Feld", () => {
    expect(isTypeRenameTarget({ status: "todo" }, "type", "bt_type")).toBe(false);
    expect(isTypeRenameTarget(undefined, "type", "bt_type")).toBe(false);
  });

  it("ist idempotent: was den neuen Schlüssel schon führt, wird nicht erneut angefasst", () => {
    expect(isTypeRenameTarget({ type: "task", bt_type: "task" }, "type", "bt_type")).toBe(false);
    expect(isTypeRenameTarget({ bt_type: "task" }, "type", "bt_type")).toBe(false);
  });
});
