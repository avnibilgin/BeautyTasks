import { describe, it, expect } from "vitest";
import { toExportTask, toExportList, importedTaskFrontmatter, importedListFrontmatter, parseExport, noteBody, ExportTask, ExportList } from "../src/importExport";
import { Task } from "../src/types";
import { ProjItem } from "../src/taskService";

/**
 * Die eine Eigenschaft, auf die es beim Export ankommt: Eine Aufgabe muss die Rundreise
 * überstehen. Geprüft wird auf der reinen Ebene — Aufgabe → Datensatz → Frontmatter —, denn
 * genau dazwischen ist `sortOrder` jahrelang verlorengegangen, ohne dass es jemandem auffiel.
 */

const AUFGABE: Task = {
  id: "t-abc", path: "BeautyTasks/Items/Test.md", title: "Test", titleInFm: true,
  status: "doing", priority: "high",
  due: "2026-08-20", dueTime: "09:30", scheduled: "2026-08-18", scheduledTime: null,
  duration: 45, start: "2026-08-01", sortOrder: 2110,
  project: "BeautyTasks/Projects/Haus.md", parent: "BeautyTasks/Items/Eltern.md",
  labels: ["ui", "bug"], description: "Beschreibung",
  recurrence: "jeden Montag", recurBasis: "done", reminders: ["-PT30M"],
  created: "2026-07-01T08:00:00", completed: null, cancelled: null, externalId: "ext-1",
};

const LISTE: ProjItem = {
  name: "Haus", path: "BeautyTasks/Projects/Haus.md", icon: "home", color: "#e05c4a",
  type: "project", hidden: true, archived: true, description: "Alles rund ums Haus",
};

/** Frontmatter-Wert holen, egal ob der Schlüssel konfiguriert wurde. */
const fmOf = (t: Task): Record<string, unknown> => importedTaskFrontmatter(toExportTask(t), "type", "title");

describe("Aufgabe → Export → Frontmatter", () => {
  it("bringt jedes Feld durch, das der Datensatz führt", () => {
    const fm = fmOf(AUFGABE);
    expect(fm.type).toBe("task");
    expect(fm.title).toBe("Test");
    expect(fm.id).toBe("t-abc");
    expect(fm.status).toBe("doing");
    expect(fm.priority).toBe("high");
    expect(fm.due).toBe("2026-08-20T09:30");   // Datum und Uhrzeit als ein Wert (combineDT)
    expect(fm.scheduled).toBe("2026-08-18");
    expect(fm.duration).toBe(45);
    expect(fm.start).toBe("2026-08-01");
    expect(fm.project).toBe("[[Haus]]");        // Basename, nicht Pfad
    expect(fm.parent).toBe("[[Eltern]]");
    expect(fm.labels).toEqual(["ui", "bug"]);
    expect(fm.recurrence).toBe("jeden Montag");
    expect(fm.recur_basis).toBe("done");
    expect(fm.reminders).toEqual(["-PT30M"]);
    expect(fm.created).toBe("2026-07-01T08:00:00");
    expect(fm.external_id).toBe("ext-1");
    expect(fm.description).toBe("Beschreibung");
  });

  it("nimmt die manuelle Reihenfolge mit – der Fall, für den v3 gebaut wurde", () => {
    expect(toExportTask(AUFGABE).sortOrder).toBe(2110);
    expect(fmOf(AUFGABE).sort_order).toBe(2110);
  });

  it("erfindet keine Reihenfolge, wo keine ist", () => {
    // sort_order wird erst beim ersten Umsortieren materialisiert – ein leeres Feld wäre eine
    // Behauptung über eine Ordnung, die es nicht gibt.
    expect(fmOf({ ...AUFGABE, sortOrder: null }).sort_order).toBeNull();
  });

  it("respektiert umbenannte Feldnamen", () => {
    const fm = importedTaskFrontmatter(toExportTask(AUFGABE), "bt_type", "bt_titel");
    expect(fm.bt_type).toBe("task");
    expect(fm.bt_titel).toBe("Test");
    expect(fm.type).toBeUndefined();
  });

  it("Zeitstempel überleben – erledigt wie abgebrochen", () => {
    expect(fmOf({ ...AUFGABE, completed: "2026-08-01T10:00:00" }).completed).toBe("2026-08-01T10:00:00");
    expect(fmOf({ ...AUFGABE, cancelled: "2026-08-02T11:00:00" }).cancelled).toBe("2026-08-02T11:00:00");
  });

  it("normale Priorität wird nicht geschrieben (Standard bleibt implizit)", () => {
    expect(fmOf({ ...AUFGABE, priority: "normal" }).priority).toBeUndefined();
  });
});

describe("Liste → Export → Frontmatter", () => {
  it("bringt Symbol, Beschreibung und Ausgeblendet mit (neu in v3)", () => {
    const el = toExportList(LISTE);
    expect(el).toEqual({ name: "Haus", type: "project", color: "#e05c4a", archived: true, icon: "home", description: "Alles rund ums Haus", hidden: true });
    const fm = importedListFrontmatter(el, "type");
    expect(fm.type).toBe("project");
    expect(fm.icon).toBe("home");
    expect(fm.description).toBe("Alles rund ums Haus");
    expect(fm.nav_hidden).toBe(true);
    expect(fm.status).toBe("archived");
  });

  it("exportiert BERECHNETE Symbole nicht – sonst entstuende beim Import eines aus dem Nichts", () => {
    // Bereiche bekommen im Modell immer „circle-small", Projekte ohne eigenes Symbol „folder".
    expect(toExportList({ ...LISTE, type: "area", icon: "circle-small" }).icon).toBeNull();
    expect(toExportList({ ...LISTE, icon: "folder" }).icon).toBeNull();
    expect(toExportList({ ...LISTE, icon: "sprout" }).icon).toBe("sprout");   // selbst gesetzt bleibt
  });

  it("schreibt keine leeren Felder", () => {
    const fm = importedListFrontmatter({ name: "X", type: "project", color: null, archived: false }, "type");
    expect(fm.icon).toBeUndefined();
    expect(fm.description).toBeUndefined();
    expect(fm.nav_hidden).toBeUndefined();
    expect(fm.color).toBeUndefined();
    expect(fm.status).toBe("active");
  });
});

describe("Alte Exporte bleiben lesbar", () => {
  const alt = JSON.stringify({
    format: "beautytasks", version: 2, exportedAt: "2026-01-01", taskCount: 1,
    lists: [{ name: "Alt", type: "project", color: null, archived: false }],
    labels: [],
    tasks: [{ id: "t-1", title: "Alt", status: "todo", priority: "normal", labels: [], created: "2026-01-01" }],
  });

  it("v2 wird angenommen – die Version ist eine Angabe, keine Schranke", () => {
    const d = parseExport(alt);
    expect(d).not.toBeNull();
    expect(d!.tasks[0].title).toBe("Alt");
  });

  it("fehlende v3-Felder erzeugen keine leeren Frontmatter-Einträge", () => {
    const d = parseExport(alt)!;
    const fm = importedTaskFrontmatter(d.tasks[0] as ExportTask, "type", "title");
    expect(fm.sort_order).toBeNull();     // -> buildFrontmatter verwirft es
    const lfm = importedListFrontmatter(d.lists[0] as ExportList, "type");
    expect(lfm.icon).toBeUndefined();
    expect(lfm.nav_hidden).toBeUndefined();
  });
});

describe("noteBody – der Inhalt unter der Titelzeile", () => {
  const notiz = (body: string): string => "---\ntype: task\ntitle: X\n---\n" + body;

  it("nimmt eigenen Text UND Detail-Log mit – beides hängt in echten Notizen zusammen", () => {
    const b = "Eigener Text.\n\n## Log\n> [!log] 2026-08-01\n> Etwas passiert.";
    expect(noteBody(notiz(b))).toBe(b);
  });

  it("wirft die Titelzeile weg – sonst stünde sie nach einer Rundreise doppelt da", () => {
    expect(noteBody(notiz("# X\n\nInhalt."))).toBe("Inhalt.");
  });

  it("lässt eigene Überschriften stehen, die nicht die Titelzeile sind", () => {
    expect(noteBody(notiz("## Unterpunkt\nText"))).toBe("## Unterpunkt\nText");
  });

  it("leere Notiz ergibt leeren Body, keine Leerzeichen-Reste", () => {
    expect(noteBody(notiz(""))).toBe("");
    expect(noteBody(notiz("\n\n\n"))).toBe("");
    expect(noteBody(notiz("# X\n"))).toBe("");
  });

  it("kommt ohne Frontmatter klar", () => {
    expect(noteBody("Nur Text")).toBe("Nur Text");
  });

  it("fasst Code-Blöcke nicht als Überschrift auf", () => {
    const b = "```\n# kein Titel\n```\nDanach";
    expect(noteBody(notiz(b))).toBe(b);
  });
});

describe("Body über die Rundreise", () => {
  it("wandert in den Datensatz und wieder heraus", () => {
    const inhalt = "Notiz-Inhalt\n\n> [!log] 2026-08-01\n> Eintrag";
    const et = toExportTask(AUFGABE, inhalt);
    expect(et.body).toBe(inhalt);
  });

  it("leerer Body erzeugt kein Feld – der Normalfall bleibt schlank", () => {
    expect(toExportTask(AUFGABE, "").body).toBeUndefined();
    expect(toExportTask(AUFGABE).body).toBeUndefined();
  });
});
