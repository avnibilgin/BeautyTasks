import { describe, it, expect } from "vitest";
import { App } from "obsidian";
import { readTaskNotesConfig } from "../src/tasknotesApi";
import { TN_SETTINGS, TN_STATUSES, TN_PRIORITIES } from "./fixtures/tasknotes-4.11.1";

/**
 * `readTaskNotesConfig` greift auf eine FREMDE API zu. Getestet wird deshalb weniger der
 * Gutfall als die Frage: Reißt uns diese Fremdheit je mit? Die Daten stammen aus dem echt
 * installierten TaskNotes 4.11.1 – die Form ist also nicht ausgedacht.
 */

/** Ein App-Doppel, das ein TaskNotes mit gegebener API vortäuscht. */
const appMit = (api: unknown): App =>
  ({ plugins: { getPlugin: (id: string) => (id === "tasknotes" ? { api } : null) } } as unknown as App);

/** Die API, wie 4.11.1 sie aufbaut: Namensräume mit Funktionen. */
const echteApi = (over: Record<string, unknown> = {}): unknown => ({
  apiVersion: 1,
  settings: { snapshot: () => JSON.parse(JSON.stringify(TN_SETTINGS)) as unknown },
  catalog: { statuses: () => TN_STATUSES.map((s) => ({ ...s })), priorities: () => TN_PRIORITIES.map((p) => ({ ...p })) },
  ...over,
});

describe("readTaskNotesConfig – Gutfall gegen echte Daten aus 4.11.1", () => {
  it("liest Task-Tag, Feldzuordnung, Status und Prioritäten", () => {
    const c = readTaskNotesConfig(appMit(echteApi()));
    expect(c).not.toBeNull();
    expect(c!.taskTag).toBe("task");
    expect(c!.fieldMapping.title).toBe("title");
    expect(c!.fieldMapping.completedDate).toBe("completedDate");
    expect(Object.keys(c!.fieldMapping).length).toBe(34);
    expect(c!.statuses.map((s) => s.value)).toEqual(["none", "open", "in-progress", "done"]);
    expect(c!.statuses.find((s) => s.value === "done")!.isCompleted).toBe(true);
    expect(c!.priorities.map((p) => p.value)).toEqual(["none", "low", "normal", "high"]);
  });

  it("übernimmt auch UMBENANNTE Felder – der Fall, für den das Ganze gebaut ist", () => {
    const api = echteApi({ settings: { snapshot: () => ({ taskTag: "aufgabe", fieldMapping: { title: "tn_titel", due: "faellig" } }) } });
    const c = readTaskNotesConfig(appMit(api));
    expect(c!.taskTag).toBe("aufgabe");
    expect(c!.fieldMapping).toEqual({ title: "tn_titel", due: "faellig" });
  });
});

describe("readTaskNotesConfig – nichts davon darf uns mitreißen", () => {
  it("kein TaskNotes installiert", () => {
    expect(readTaskNotesConfig({ plugins: { getPlugin: () => null } } as unknown as App)).toBeNull();
  });

  it("Obsidian ohne plugins-Objekt (theoretisch, aber gratis abgesichert)", () => {
    expect(readTaskNotesConfig({} as unknown as App)).toBeNull();
  });

  it("TaskNotes ohne API (ältere Fassung)", () => {
    expect(readTaskNotesConfig(appMit(undefined))).toBeNull();
  });

  it("API wirft bei jedem Zugriff", () => {
    const api = { apiVersion: 1,
      settings: { snapshot: () => { throw new Error("kaputt"); } },
      catalog: { statuses: () => { throw new Error("kaputt"); }, priorities: () => { throw new Error("kaputt"); } } };
    expect(readTaskNotesConfig(appMit(api))).toBeNull();   // nichts Brauchbares -> wie ohne API
  });

  it("API liefert Unsinn statt Objekten", () => {
    const api = { apiVersion: 1, settings: { snapshot: () => 42 }, catalog: { statuses: () => "nein", priorities: () => null } };
    expect(readTaskNotesConfig(appMit(api))).toBeNull();
  });

  it("Namensräume fehlen ganz (umgebaute API)", () => {
    expect(readTaskNotesConfig(appMit({ apiVersion: 2 }))).toBeNull();
  });

  it("höhere apiVersion wird gelesen, nicht verweigert – die Felder sind einzeln abgesichert", () => {
    const c = readTaskNotesConfig(appMit(echteApi({ apiVersion: 7 })));
    expect(c!.taskTag).toBe("task");
  });

  it("nur Status, keine Einstellungen: was da ist, wird genommen", () => {
    const api = { apiVersion: 1, catalog: { statuses: () => [{ value: "done", isCompleted: true }] } };
    const c = readTaskNotesConfig(appMit(api));
    expect(c!.statuses.length).toBe(1);
    expect(c!.taskTag).toBeNull();
    expect(c!.fieldMapping).toEqual({});
  });

  it("leere Feldnamen werden nicht übernommen – ein leerer Schlüssel fände nichts", () => {
    const api = echteApi({ settings: { snapshot: () => ({ taskTag: "task", fieldMapping: { title: "  ", status: "st" } }) } });
    const c = readTaskNotesConfig(appMit(api));
    expect(c!.fieldMapping).toEqual({ status: "st" });
  });
});
