import { describe, it, expect } from "vitest";
import { pageInfo, samePage, manageTitleKey, PageRef } from "../src/pageCtx";
import { INBOX_KEY } from "../src/taskService";

// pageInfo ist die reine Fassung dessen, was bis 1.33 plugin.currentPage() aus dem globalen
// Zustand ableitete. Sie entscheidet, WO die Anzeige-Optionen einer Seite liegen (Frontmatter
// vs. Settings) und wie viel das Anzeige-Panel dort anbietet – Fehler hier schreiben Optionen
// an die falsche Stelle. Deshalb ist jeder Zweig einzeln festgehalten.

describe("pageInfo – Speicherort und Panel-Größe je Seitenart", () => {
  it("Projekt: Optionen liegen in der Notiz (Frontmatter), volles Panel", () => {
    expect(pageInfo({ kind: "project", key: "Projekte/Umzug.md" }))
      .toEqual({ key: "Projekte/Umzug.md", tier: "full", kind: "project" });
  });

  it("Eingang ist KEIN Projekt: eingebaute Ansicht ohne Notiz -> Schlüssel „inbox“ in den Settings", () => {
    // Die Falle: der Eingang kommt als kind „project“ herein (er steht in der Projekt-Reihe der
    // Seitenleiste), hat aber keine Notiz, in die man Frontmatter schreiben könnte.
    expect(pageInfo({ kind: "project", key: INBOX_KEY }))
      .toEqual({ key: "inbox", tier: "full", kind: "view" });
  });

  it("Label: eigener Speicher-Schlüssel, volles Panel", () => {
    expect(pageInfo({ kind: "label", key: "Einkauf" }))
      .toEqual({ key: "Einkauf", tier: "full", kind: "label" });
  });

  it("Filter: Optionen liegen in der Filternotiz", () => {
    expect(pageInfo({ kind: "filter", key: "Filter/Diese Woche.md" }))
      .toEqual({ key: "Filter/Diese Woche.md", tier: "full", kind: "filter" });
  });

  it("Heute/Demnächst: leichtes Panel", () => {
    expect(pageInfo({ kind: "view", key: "heute" }).tier).toBe("light");
    expect(pageInfo({ kind: "view", key: "demnaechst" }).tier).toBe("light");
  });

  it("Wiederkehrend/Erledigt/Verwaltung: gar kein Panel", () => {
    expect(pageInfo({ kind: "view", key: "wiederkehrend" }).tier).toBe("none");
    expect(pageInfo({ kind: "view", key: "erledigt" }).tier).toBe("none");
    expect(pageInfo({ kind: "manage", key: "projects" }))
      .toEqual({ key: "manage", tier: "none", kind: "view" });
  });

  it("Verwaltung: der Bereich steckt im Seiten-Schlüssel, der Speicher-Schlüssel bleibt „manage“", () => {
    // Zwei Tabs können verschiedene Bereiche verwalten – gespeicherte Anzeige-Optionen gibt es
    // dort ohnehin keine (tier „none“), also teilen sie sich denselben (unbenutzten) Schlüssel.
    for (const sec of ["projects", "areas", "labels", "filters"]) {
      expect(pageInfo({ kind: "manage", key: sec }).key).toBe("manage");
    }
  });
});

describe("samePage – „zeigt dieser Tab dieselbe Seite?“", () => {
  const p: PageRef = { kind: "project", key: "Projekte/Umzug.md" };

  it("gleich in Art UND Schlüssel", () => {
    expect(samePage(p, { kind: "project", key: "Projekte/Umzug.md" })).toBe(true);
  });

  it("gleicher Schlüssel, andere Art zählt NICHT als dieselbe Seite", () => {
    // Sonst würde ein gelöschtes Label einen gleichnamigen Projekt-Tab mit zur Startansicht
    // schicken (leaveDeletedPage) bzw. das Layout des falschen Tabs einfrieren (setLayout).
    expect(samePage({ kind: "label", key: "Umzug" }, { kind: "project", key: "Umzug" })).toBe(false);
  });

  it("andere Ansicht", () => {
    expect(samePage({ kind: "view", key: "heute" }, { kind: "view", key: "demnaechst" })).toBe(false);
  });
});

describe("manageTitleKey – Überschrift UND Tab-Titel der Verwaltung aus einer Quelle", () => {
  it("bildet jeden Bereich auf seinen Übersetzungs-Schlüssel ab", () => {
    expect(manageTitleKey("projects")).toBe("group_project");
    expect(manageTitleKey("areas")).toBe("group_area");
    expect(manageTitleKey("labels")).toBe("tab_labels");
    expect(manageTitleKey("filters")).toBe("nav_filters");
  });

  it("fällt bei Unsinn auf „Projekte“ zurück statt einen leeren Titel zu liefern", () => {
    // Der Bereich kommt aus dem gespeicherten Tab-Zustand (Workspace-Datei) – also fremder Input.
    expect(manageTitleKey("")).toBe("group_project");
    expect(manageTitleKey("quatsch")).toBe("group_project");
  });
});
