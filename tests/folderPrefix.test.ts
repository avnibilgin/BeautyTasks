import { describe, it, expect } from "vitest";
import { folderPrefix, isUnderPrefix, isUnderFolder } from "../src/taskService";

/**
 * `isUnderFolder` ist in zwei Hälften zerlegt: den Ordner AUFBEREITEN (teuer, ändert sich fast
 * nie) und ihn VERGLEICHEN (billig, läuft für jede Notiz). TaskIndex.inScope bereitet einmal auf
 * und vergleicht danach zehntausendfach.
 *
 * Die Zerlegung darf die Bedeutung nicht verschieben — deshalb prüft der zweite Block, dass die
 * zusammengesetzte Fassung für dieselben Eingaben dasselbe sagt wie die alte.
 */

describe("folderPrefix – Ordner auf Vergleichsform bringen", () => {
  it("nimmt den Schlusstrich weg", () => {
    expect(folderPrefix("BeautyTasks/Templates/")).toBe("BeautyTasks/Templates");
  });

  it("liefert \"\" für alles Unbrauchbare – das vergleicht sich später mit nichts", () => {
    for (const v of ["", "   ", ".", "/", null, undefined]) expect(folderPrefix(v)).toBe("");
  });
});

describe("isUnderPrefix – der billige Vergleich", () => {
  const p = "BeautyTasks/Templates";

  it("der Ordner selbst zählt dazu", () => {
    expect(isUnderPrefix(p, p)).toBe(true);
  });

  it("alles darunter zählt dazu, beliebig tief", () => {
    expect(isUnderPrefix("BeautyTasks/Templates/Urlaub/Koffer.md", p)).toBe(true);
  });

  it("ein Ordner mit gleichem ANFANG zählt NICHT dazu", () => {
    // Ohne den "/" im Vergleich wäre „…/TemplatesAlt" ein Treffer – und der Vorlagen-Index
    // zöge sich fremde Notizen ein.
    expect(isUnderPrefix("BeautyTasks/TemplatesAlt/x.md", p)).toBe(false);
  });

  it("leerer Präfix trifft nie", () => {
    expect(isUnderPrefix("BeautyTasks/Items/a.md", "")).toBe(false);
  });
});

describe("die Zerlegung sagt dasselbe wie vorher", () => {
  it("stimmt für jede Kombination mit isUnderFolder überein", () => {
    const pfade = [
      "BeautyTasks/Templates/Urlaub/Koffer.md", "BeautyTasks/Templates", "BeautyTasks/TemplatesAlt/x.md",
      "BeautyTasks/Items/a.md", "Templates/x.md", "a.md", "",
    ];
    const ordner = ["BeautyTasks/Templates", "BeautyTasks/Templates/", "BeautyTasks", "Templates", "", "   ", "."];
    for (const path of pfade) {
      for (const dir of ordner) {
        expect(isUnderPrefix(path, folderPrefix(dir)), `${path} in ${dir}`).toBe(isUnderFolder(path, dir));
      }
    }
  });
});
