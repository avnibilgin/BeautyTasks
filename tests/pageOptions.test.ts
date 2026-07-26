import { describe, it, expect } from "vitest";
import { readViewOptions, writeViewOptions } from "../src/pageOptions";
import { DEFAULT_OPTIONS, boardSubtasks, listSubtasks, effectiveSubtasks, ALL_SUBTASK_DISPLAYS, BOARD_SUBTASK_DISPLAYS, SUBTASK_DISPLAYS } from "../src/filterEngine";

describe("readViewOptions – Unteraufgaben-Darstellung", () => {
  it("ohne Angabe: undefined = nie gewählt (NICHT vorzeitig aufgelöst)", () => {
    // Entscheidend: hier darf kein konkreter Wert entstehen. setPageViewOption speichert das ganze
    // gelesene Objekt – ein früh gesetzter Wert würde mit dem alten Layout aufgelöst und
    // dauerhaft festgeschrieben. Die Vorgabe fällt erst in effectiveSubtasks.
    expect(readViewOptions({}).subtasks).toBeUndefined();
    expect(readViewOptions(undefined).subtasks).toBeUndefined();
  });

  it("nimmt einen gültigen Wert unverändert – auch „standalone“, das die Liste nicht mehr anbietet", () => {
    // „standalone" bleibt als gespeicherter Wert gültig (Board-Wahl „Einblenden", Alt-Seiten).
    // Wegwerfen würde die Board-Wahl zerstören; was ein Layout nicht kennt, mappt effectiveSubtasks.
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
    expect(readViewOptions({ showSubtasks: false }).subtasks).toBeUndefined();
  });

  it("ein neuer Wert schlägt den alten Boolean", () => {
    expect(readViewOptions({ showSubtasks: true, subtasks: "standalone" }).subtasks).toBe("standalone");
  });
});

describe("effectiveSubtasks – Vorgabe hängt am Layout", () => {
  it("nie gewählt: Liste kompakt, Board „Ausblenden“ (compact)", () => {
    // Board-Default seit 2026-07-26 bewusst „Ausblenden": Unterkarten kommen erst per
    // ausdrücklichem „Einblenden" dazu (vorher zeigte das Board sie standardmäßig).
    expect(effectiveSubtasks({ layout: "list" })).toBe("compact");
    expect(effectiveSubtasks({ layout: "board" })).toBe("compact");
  });

  it("eine im Layout angebotene Wahl gilt unverändert", () => {
    expect(effectiveSubtasks({ layout: "list", subtasks: "indented" })).toBe("indented");
    expect(effectiveSubtasks({ layout: "board", subtasks: "standalone" })).toBe("standalone");
    expect(effectiveSubtasks({ layout: "board", subtasks: "compact" })).toBe("compact");
  });

  it("„Eingerückt“ im Board wird zu „Einblenden“ (keine Karte in einer Karte)", () => {
    expect(effectiveSubtasks({ layout: "board", subtasks: "indented" })).toBe("standalone");
    expect(effectiveSubtasks({ layout: "list", subtasks: "indented" })).toBe("indented");
  });

  it("„standalone“ in der Liste wird zu „Kompakt“ (die Liste bietet es nicht mehr an)", () => {
    // Alt-Seiten mit gewähltem „Einzeln" bzw. Board-Seiten mit „Einblenden" im Listen-Layout:
    // NICHT verschwinden lassen, sondern aufs Badge zurückfallen – die eigenen Zeilen für
    // Unteraufgaben ohne sichtbaren Parent liefert ohnehin Variante A (nestingHosts).
    expect(effectiveSubtasks({ layout: "list", subtasks: "standalone" })).toBe("compact");
  });

  it("liefert nie undefined und nur Werte, die das Layout anbietet", () => {
    for (const layout of ["list", "board", "calendar"] as const) {
      const offered = layout === "board" ? BOARD_SUBTASK_DISPLAYS : SUBTASK_DISPLAYS;
      for (const v of [undefined, ...ALL_SUBTASK_DISPLAYS])
        expect(offered).toContain(effectiveSubtasks({ layout, subtasks: v }));
    }
  });
});

describe("boardSubtasks – „Eingerückt“ gibt es auf Karten nicht", () => {
  it("Ausblenden bleibt Ausblenden, Einblenden bleibt Einblenden", () => {
    expect(boardSubtasks("compact")).toBe("compact");
    expect(boardSubtasks("standalone")).toBe("standalone");
  });

  it("Eingerückt fällt auf Einblenden zurück – nicht auf Ausblenden", () => {
    // Entscheidend: NICHT "compact". Sonst filterte das Board die Unteraufgaben-Karten heraus,
    // während das Panel „Einblenden" anzeigt – die Unteraufgaben wären weder Karte noch Badge.
    expect(boardSubtasks("indented")).toBe("standalone");
  });

  it("liefert immer einen im Board anbietbaren Wert", () => {
    // Panel und Board müssen sich einig sein: was boardSubtasks liefert, muss im Dropdown stehen.
    for (const m of ALL_SUBTASK_DISPLAYS) expect(BOARD_SUBTASK_DISPLAYS).toContain(boardSubtasks(m));
  });

  it("ist idempotent (zweimal anwenden ändert nichts)", () => {
    for (const m of ALL_SUBTASK_DISPLAYS) expect(boardSubtasks(boardSubtasks(m))).toBe(boardSubtasks(m));
  });
});

describe("listSubtasks – „Einzeln“ gibt es in der Liste nicht mehr", () => {
  it("Kompakt und Eingerückt bleiben unverändert", () => {
    expect(listSubtasks("compact")).toBe("compact");
    expect(listSubtasks("indented")).toBe("indented");
  });

  it("standalone fällt auf Kompakt zurück – das Spiegelbild zu boardSubtasks", () => {
    expect(listSubtasks("standalone")).toBe("compact");
  });

  it("liefert immer einen in der Liste anbietbaren Wert", () => {
    for (const m of ALL_SUBTASK_DISPLAYS) expect(SUBTASK_DISPLAYS).toContain(listSubtasks(m));
  });

  it("ist idempotent (zweimal anwenden ändert nichts)", () => {
    for (const m of ALL_SUBTASK_DISPLAYS) expect(listSubtasks(listSubtasks(m))).toBe(listSubtasks(m));
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
    for (const v of ALL_SUBTASK_DISPLAYS) {
      const fm: Record<string, unknown> = {};
      writeViewOptions(fm, { ...DEFAULT_OPTIONS, subtasks: v });
      expect(readViewOptions(fm).subtasks).toBe(v);
    }
  });
});
