import { describe, it, expect } from "vitest";
import { forcedStartPage, newTabPage, fromLegacyStartView, HOME } from "../src/startPage";
import { PageRef } from "../src/pageCtx";

const PROJEKT: PageRef = { kind: "project", key: "BeautyTasks/Projects/Reisen.md" };
const alles = (): boolean => true;
const nichts = (): boolean => false;
const ANSICHTEN = ["heute", "demnaechst", "wiederkehrend", "erledigt"];

describe("forcedStartPage – was ein wiederhergestellter Tab bekommt", () => {
  it("„zuletzt benutzte“ erzwingt NICHTS – der Tab behält seine Seite", () => {
    expect(forcedStartPage("last", alles)).toBeNull();
  });

  it("eine feste Seite überschreibt den Tab", () => {
    expect(forcedStartPage(PROJEKT, alles)).toEqual(PROJEKT);
    expect(forcedStartPage({ kind: "view", key: "demnaechst" }, alles)).toEqual({ kind: "view", key: "demnaechst" });
  });

  it("gelöschtes Ziel fällt auf „Heute“ zurück statt auf eine leere Seite", () => {
    expect(forcedStartPage(PROJEKT, nichts)).toEqual(HOME);
  });

  it("nie gewählt oder unbrauchbar gespeichert → Vorgabe", () => {
    expect(forcedStartPage(undefined, alles)).toEqual(HOME);
    expect(forcedStartPage(null, alles)).toEqual(HOME);
    expect(forcedStartPage("quatsch" as never, alles)).toEqual(HOME);
    expect(forcedStartPage({ kind: "view" } as never, alles)).toEqual(HOME);
  });
});

describe("newTabPage – ein neuer Tab muss immer eine Seite bekommen", () => {
  it("„zuletzt benutzte“ nimmt die letzte Ansicht des Geräts", () => {
    expect(newTabPage("last", "erledigt", alles)).toEqual({ kind: "view", key: "erledigt" });
  });

  it("ohne bekannte letzte Ansicht: Vorgabe", () => {
    expect(newTabPage("last", undefined, alles)).toEqual(HOME);
    expect(newTabPage("last", "gibtsnicht", nichts)).toEqual(HOME);
  });

  it("feste Seite gilt auch für neue Tabs", () => {
    expect(newTabPage(PROJEKT, "heute", alles)).toEqual(PROJEKT);
  });

  it("gibt NIE null zurück – ein Tab ohne Seite wäre leer", () => {
    for (const s of ["last", undefined, null, PROJEKT] as const) {
      expect(newTabPage(s, "heute", nichts)).not.toBeNull();
    }
  });
});

describe("fromLegacyStartView – Umzug vom alten String", () => {
  it("übernimmt die vier Ansichten", () => {
    expect(fromLegacyStartView("demnaechst", ANSICHTEN)).toEqual({ kind: "view", key: "demnaechst" });
    expect(fromLegacyStartView("wiederkehrend", ANSICHTEN)).toEqual({ kind: "view", key: "wiederkehrend" });
  });

  it("behält „zuletzt benutzte“", () => {
    expect(fromLegacyStartView("last", ANSICHTEN)).toBe("last");
  });

  it("Unbekanntes wird zur Vorgabe statt zu einer toten Seite", () => {
    expect(fromLegacyStartView("gibtsnicht", ANSICHTEN)).toEqual(HOME);
    expect(fromLegacyStartView(undefined, ANSICHTEN)).toEqual(HOME);
    expect(fromLegacyStartView(42, ANSICHTEN)).toEqual(HOME);
  });
});
