import { describe, it, expect } from "vitest";
import { pageShowsEvents } from "../src/calendarModel";

describe("pageShowsEvents – welche Seite Google-Termine zeigt", () => {
  it("Heute und Demnächst zeigen Termine", () => {
    expect(pageShowsEvents("heute")).toBe(true);
    expect(pageShowsEvents("demnaechst")).toBe(true);
  });

  // Die eigentliche Falle: der Eingang läuft in currentPage() als kind "view" (wie Heute/Demnächst)
  // und käme bei einer Prüfung auf `kind` fälschlich durch. Er zeigt ausschließlich unsortierte
  // Aufgaben – Termine haben dort nichts zu suchen.
  it("Eingang zeigt KEINE Termine, obwohl er eine eingebaute Ansicht ist", () => {
    expect(pageShowsEvents("inbox")).toBe(false);
  });

  it("Projekt-, Bereichs-, Label- und Filterseiten zeigen keine Termine", () => {
    expect(pageShowsEvents("Projekte/Website.md")).toBe(false);
    expect(pageShowsEvents("Bereiche/Gesundheit.md")).toBe(false);
    expect(pageShowsEvents("wichtig")).toBe(false);            // Label
    expect(pageShowsEvents("Extras/Filter/Woche.md")).toBe(false);
  });

  it("die übrigen System-Ansichten zeigen keine Termine", () => {
    expect(pageShowsEvents("wiederkehrend")).toBe(false);
    expect(pageShowsEvents("erledigt")).toBe(false);
    expect(pageShowsEvents("manage")).toBe(false);
    expect(pageShowsEvents("")).toBe(false);
  });
});
