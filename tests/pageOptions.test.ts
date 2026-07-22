import { describe, it, expect } from "vitest";
import { readViewOptions, writeViewOptions } from "../src/pageOptions";
import { DEFAULT_OPTIONS, boardSubtasks, effectiveSubtasks, BOARD_SUBTASK_DISPLAYS, SUBTASK_DISPLAYS } from "../src/filterEngine";

describe("readViewOptions – Unteraufgaben-Darstellung", () => {
  it("ohne Angabe: undefined = nie gewählt (NICHT vorzeitig aufgelöst)", () => {
    // Entscheidend: hier darf kein konkreter Wert entstehen. setPageViewOption speichert das ganze
    // gelesene Objekt – ein früh gesetzter Wert würde mit dem alten Layout aufgelöst und
    // dauerhaft festgeschrieben. Die Vorgabe fällt erst in effectiveSubtasks.
    expect(readViewOptions({}).subtasks).toBeUndefined();
    expect(readViewOptions(undefined).subtasks).toBeUndefined();
  });

  it("nimmt einen gültigen Wert unverändert", () => {
    expect(readViewOptions({ subtasks: "indented" }).subtasks).toBe("indented");
    expect(readViewOptions({ subtasks: "standalone" }).subtasks).toBe("standalone");
  });

  it("fällt bei Unsinn auf „nie gewählt“ zurück", () => {
    expect(readViewOptions({ subtasks: "nested" }).subtasks).toBeUndefined();
    expect(readViewOptions({ subtasks: 42 }).subtasks).toBeUndefined();
  });

  it("übersetzt den alten Boolean showSubtasks: true -> eingerückt", () => {
    // Bis 1.20.3 gab es nur „verschachtelt ja/nein". Wer eingeschaltet hatte, meinte „indented" –
    // ohne diese Übersetzung spränge die Ansicht beim Update wortlos zurück.
    expect(readViewOptions({ showSubtasks: true }).subtasks).toBe("indented");
  });

  it("alter Boolean false zählt als nie gewählt", () => {
    // false war der damalige Standard – keine Entscheidung, sondern deren Abwesenheit. Als
    // „compact" gelesen hätte es im Board die alte Darstellung überschrieben.
    expect(readViewOptions({ showSubtasks: false }).subtasks).toBeUndefined();
  });

  it("ein neuer Wert schlägt den alten Boolean", () => {
    expect(readViewOptions({ showSubtasks: true, subtasks: "standalone" }).subtasks).toBe("standalone");
  });
});

describe("effectiveSubtasks – Vorgabe hängt am Layout", () => {
  it("nie gewählt: Liste kompakt, Board einzeln – beides wie vor dem Feature", () => {
    expect(effectiveSubtasks({ layout: "list" })).toBe("compact");
    expect(effectiveSubtasks({ layout: "board" })).toBe("standalone");
  });

  it("eine eigene Wahl gilt in beiden Layouts", () => {
    expect(effectiveSubtasks({ layout: "list", subtasks: "standalone" })).toBe("standalone");
    expect(effectiveSubtasks({ layout: "board", subtasks: "compact" })).toBe("compact");
  });

  it("„Eingerückt“ im Board wird zu „Einzeln“ (keine Karte in einer Karte)", () => {
    expect(effectiveSubtasks({ layout: "board", subtasks: "indented" })).toBe("standalone");
    expect(effectiveSubtasks({ layout: "list", subtasks: "indented" })).toBe("indented");
  });

  it("liefert nie undefined – jeder Aufrufer bekommt einen konkreten Modus", () => {
    for (const layout of ["list", "board", "calendar"] as const)
      for (const v of [undefined, ...SUBTASK_DISPLAYS])
        expect(SUBTASK_DISPLAYS).toContain(effectiveSubtasks({ layout, subtasks: v }));
  });

  it("der Bestandsfall: alter Boolean false + Board bleibt „Einzeln“", () => {
    // Das war der Fehler – aus showSubtasks:false wurde „compact", und jedes bestehende Board
    // verlor beim Update seine Unteraufgaben-Karten (und damit das Ziehen auf andere Spalten).
    const o = readViewOptions({ showSubtasks: false, layout: "board" });
    expect(effectiveSubtasks(o)).toBe("standalone");
  });
});

describe("boardSubtasks – „Eingerückt“ gibt es auf Karten nicht", () => {
  it("Kompakt bleibt Kompakt, Einzeln bleibt Einzeln", () => {
    expect(boardSubtasks("compact")).toBe("compact");
    expect(boardSubtasks("standalone")).toBe("standalone");
  });

  it("Eingerückt fällt auf Einzeln zurück – nicht auf Kompakt", () => {
    // Entscheidend: NICHT "compact". Sonst filterte das Board die Unteraufgaben-Karten heraus,
    // während das Panel „Einzeln" anzeigt – die Unteraufgaben wären weder Karte noch Badge.
    expect(boardSubtasks("indented")).toBe("standalone");
  });

  it("liefert immer einen im Board anbietbaren Wert", () => {
    // Panel und Board müssen sich einig sein: was boardSubtasks liefert, muss im Dropdown stehen.
    for (const m of SUBTASK_DISPLAYS) expect(BOARD_SUBTASK_DISPLAYS).toContain(boardSubtasks(m));
  });

  it("ist idempotent (zweimal anwenden ändert nichts)", () => {
    for (const m of SUBTASK_DISPLAYS) expect(boardSubtasks(boardSubtasks(m))).toBe(boardSubtasks(m));
  });
});

describe("writeViewOptions – Notiz bleibt schlank", () => {
  it("schreibt den Default NICHT ins Frontmatter", () => {
    const fm: Record<string, unknown> = {};
    writeViewOptions(fm, { ...DEFAULT_OPTIONS });
    expect("subtasks" in fm).toBe(false);
  });

  it("schreibt abweichende Werte", () => {
    const fm: Record<string, unknown> = {};
    writeViewOptions(fm, { ...DEFAULT_OPTIONS, subtasks: "standalone" });
    expect(fm.subtasks).toBe("standalone");
  });

  it("räumt den abgelösten Schlüssel showSubtasks weg", () => {
    const fm: Record<string, unknown> = { showSubtasks: true };
    writeViewOptions(fm, readViewOptions({ showSubtasks: true }));
    expect("showSubtasks" in fm).toBe(false);   // alt raus …
    expect(fm.subtasks).toBe("indented");       // … Bedeutung erhalten
  });

  it("Rundlauf: lesen -> schreiben -> lesen ergibt denselben Wert", () => {
    for (const v of ["compact", "indented", "standalone"] as const) {
      const fm: Record<string, unknown> = {};
      writeViewOptions(fm, { ...DEFAULT_OPTIONS, subtasks: v });
      expect(readViewOptions(fm).subtasks).toBe(v);
    }
  });
});
