import { describe, it, expect } from "vitest";
import { facetsFor } from "../src/pageCtx";
import { readPageCriteria, writePageCriteria, readCriteria, writeCriteria } from "../src/pageOptions";
import { filterTasks, hasCriteria, DEFAULT_CRITERIA, FilterCriteria } from "../src/filterEngine";
import { INBOX_KEY } from "../src/taskService";
import { Task } from "../src/types";

// Der Ansichtsfilter ist derselbe Kriterien-Satz wie ein gespeicherter Filter, nur an eine
// gewöhnliche Seite geheftet. Getestet wird deshalb genau das, was ihn von jenem unterscheidet:
// WELCHE Facetten eine Seite anbietet und WO/WIE die Kriterien liegen.

const task = (p: Partial<Task>): Task => ({
  path: "T/x.md", title: "x", status: "todo", priority: "normal", labels: [],
  project: null, parent: null, due: null, dueTime: null, scheduled: null,
  description: "", created: null, completed: null, recurrence: null, sortOrder: null,
  ...p,
} as Task);

describe("facetsFor – die Achse der Seite wird ausgeblendet", () => {
  it("Projektseite: kein „Projekte“ (die Seite IST das Projekt)", () => {
    const f = facetsFor({ kind: "project", key: "Projekte/Umzug.md" });
    expect(f).not.toContain("projects");
    expect(f).toEqual(["range", "deadlineRange", "priorities", "labels", "statuses", "subtaskMode"]);
  });

  it("Eingang: ebenfalls kein „Projekte“ – er IST die Abwesenheit eines Projekts", () => {
    // Die Falle: der Eingang kommt als kind „project" herein, ist aber pageInfo-seitig eine View.
    // Ohne den Sonderfall böte er ein Projekt-Sieb an, das dort nie etwas übrig lässt.
    expect(facetsFor({ kind: "project", key: INBOX_KEY })).not.toContain("projects");
  });

  it("Label-Seite: „Label“ BLEIBT (mehrwertig – #ux und #dringend ist eine echte Frage)", () => {
    const f = facetsFor({ kind: "label", key: "ux" });
    expect(f).toContain("labels");
    expect(f).toContain("projects");
  });

  it("Heute/Demnächst: kein Datum und keine Deadline (beides ist ihre Achse)", () => {
    for (const key of ["heute", "demnaechst"]) {
      const f = facetsFor({ kind: "view", key });
      expect(f).not.toContain("range");
      expect(f).not.toContain("deadlineRange");
      expect(f).toEqual(["priorities", "labels", "projects", "statuses", "subtaskMode"]);
    }
  });

  it("Gespeicherte Filter und Seiten ohne Panel haben KEINEN Ansichtsfilter", () => {
    // Dort sind die Kriterien die Seite selbst; ein zweiter Satz darüber wäre nicht mehr
    // auseinanderzuhalten. „Erledigt"/„Wiederkehrend"/Verwaltung haben gar kein Panel.
    expect(facetsFor({ kind: "filter", key: "Filter/Diese Woche.md" })).toEqual([]);
    expect(facetsFor({ kind: "view", key: "erledigt" })).toEqual([]);
    expect(facetsFor({ kind: "manage", key: "projects" })).toEqual([]);
  });
});

describe("readPageCriteria/writePageCriteria – EIN Schlüssel im Frontmatter", () => {
  it("ohne Kriterien steht nichts in der Notiz", () => {
    const fm: Record<string, unknown> = {};
    writePageCriteria(fm, { ...DEFAULT_CRITERIA });
    expect(fm).toEqual({});
  });

  it("schreibt unter EINEN Schlüssel und liest denselben Stand zurück", () => {
    const c: FilterCriteria = { ...DEFAULT_CRITERIA, priorities: ["high"], labels: ["ux"], range: "today" };
    const fm: Record<string, unknown> = { type: "project", title: "Umzug" };
    writePageCriteria(fm, c);
    // Entscheidend: die eigenen Felder der Notiz bleiben unberührt, und es kommt genau EIN Feld
    // hinzu – nicht dreizehn Fremdfelder mitten in einer Notiz, die dem Nutzer gehört.
    expect(Object.keys(fm).sort()).toEqual(["title", "type", "view_filter"]);
    expect(fm.view_filter).toEqual({ range: "today", priorities: ["high"], labels: ["ux"] });
    expect(readPageCriteria(fm)).toEqual(c);
  });

  it("räumt den Schlüssel weg, sobald das letzte Kriterium fällt", () => {
    const fm: Record<string, unknown> = {};
    writePageCriteria(fm, { ...DEFAULT_CRITERIA, labels: ["ux"] });
    writePageCriteria(fm, { ...DEFAULT_CRITERIA });
    expect(fm.view_filter).toBeUndefined();
  });

  it("liest die FLACHEN Felder einer Filternotiz NICHT als Ansichtsfilter", () => {
    // Beide Speicherorte benutzen dieselbe Serialisierung – aber ein gespeicherter Filter legt sie
    // flach ab. Läse readPageCriteria die auch, filterte eine Filternotiz sich selbst ein zweites Mal.
    const filterNote: Record<string, unknown> = { type: "filter", priorities: ["high"], range: "today" };
    expect(readPageCriteria(filterNote)).toEqual(DEFAULT_CRITERIA);
    expect(readCriteria(filterNote)).toEqual({ ...DEFAULT_CRITERIA, priorities: ["high"], range: "today" });
  });

  it("hält Unsinn aus fremdem Input heraus", () => {
    expect(readPageCriteria({ view_filter: "kaputt" })).toEqual(DEFAULT_CRITERIA);
    expect(readPageCriteria({ view_filter: ["a", "b"] })).toEqual(DEFAULT_CRITERIA);
    expect(readPageCriteria(undefined)).toEqual(DEFAULT_CRITERIA);
    expect(readPageCriteria({ view_filter: { priorities: ["dringend"], range: "irgendwann" } }))
      .toEqual(DEFAULT_CRITERIA);
  });

  it("Settings-Eintrag und Frontmatter benutzen dasselbe Format (Roundtrip)", () => {
    // Systemansichten/Labels speichern in data.json, Notiz-Seiten im Frontmatter – aber mit
    // derselben Serialisierung, damit es nur EINEN Leser braucht.
    const c: FilterCriteria = { ...DEFAULT_CRITERIA, labelsNot: ["warten"], subtaskMode: "none" };
    const rec: Record<string, unknown> = {};
    writeCriteria(rec, c);
    expect(readCriteria(rec)).toEqual(c);
  });
});

describe("filterTasks / hasCriteria", () => {
  const heute = "2026-08-04";
  const tasks = [
    task({ path: "a.md", priority: "high", labels: ["ux"] }),
    task({ path: "b.md", priority: "normal", labels: ["ux", "warten"] }),
    task({ path: "c.md", priority: "high", labels: [] }),
  ];

  it("ohne Kriterien ist die Menge unverändert", () => {
    expect(hasCriteria(DEFAULT_CRITERIA)).toBe(false);
    expect(filterTasks(tasks, DEFAULT_CRITERIA, heute)).toEqual(tasks);
  });

  it("Facetten sind UND-verknüpft, Werte innerhalb einer Facette ODER", () => {
    const c: FilterCriteria = { ...DEFAULT_CRITERIA, priorities: ["high"], labels: ["ux"] };
    expect(hasCriteria(c)).toBe(true);
    expect(filterTasks(tasks, c, heute).map((t) => t.path)).toEqual(["a.md"]);
  });

  it("„keines“ (−) schließt aus", () => {
    const c: FilterCriteria = { ...DEFAULT_CRITERIA, labelsNot: ["warten"] };
    expect(filterTasks(tasks, c, heute).map((t) => t.path)).toEqual(["a.md", "c.md"]);
  });
});
