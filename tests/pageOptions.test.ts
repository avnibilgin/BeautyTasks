import { describe, it, expect } from "vitest";
import { readViewOptions, writeViewOptions } from "../src/pageOptions";
import { DEFAULT_OPTIONS } from "../src/filterEngine";

describe("readViewOptions – Unteraufgaben-Darstellung", () => {
  it("ohne Angabe: kompakt (Fortschritts-Badge)", () => {
    expect(readViewOptions({}).subtasks).toBe("compact");
    expect(readViewOptions(undefined).subtasks).toBe("compact");
  });

  it("nimmt einen gültigen Wert unverändert", () => {
    expect(readViewOptions({ subtasks: "indented" }).subtasks).toBe("indented");
    expect(readViewOptions({ subtasks: "standalone" }).subtasks).toBe("standalone");
  });

  it("fällt bei Unsinn auf den Default zurück", () => {
    expect(readViewOptions({ subtasks: "nested" }).subtasks).toBe("compact");
    expect(readViewOptions({ subtasks: 42 }).subtasks).toBe("compact");
  });

  it("übersetzt den alten Boolean showSubtasks: true -> eingerückt", () => {
    // Bis 1.20.3 gab es nur „verschachtelt ja/nein". Wer eingeschaltet hatte, meinte „indented" –
    // ohne diese Übersetzung spränge die Ansicht beim Update wortlos auf den Default zurück.
    expect(readViewOptions({ showSubtasks: true }).subtasks).toBe("indented");
  });

  it("alter Boolean false -> kompakt (wie bisher: Badge statt Zeilen)", () => {
    expect(readViewOptions({ showSubtasks: false }).subtasks).toBe("compact");
  });

  it("ein neuer Wert schlägt den alten Boolean", () => {
    expect(readViewOptions({ showSubtasks: true, subtasks: "standalone" }).subtasks).toBe("standalone");
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
