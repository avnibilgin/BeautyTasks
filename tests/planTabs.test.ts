import { describe, it, expect } from "vitest";
import { readPlanTabs, PlanTab, PLAN_TAB_IDS } from "../src/planTabs";
import { BeautyTasksSettings, DEFAULT_SETTINGS } from "../src/types";

const mit = (planTabs?: unknown): BeautyTasksSettings =>
  ({ ...DEFAULT_SETTINGS, planTabs } as unknown as BeautyTasksSettings);

const ids = (t: PlanTab[]): string[] => t.map((e) => e.id);
const an = (t: PlanTab[]): string[] => t.filter((e) => e.on).map((e) => e.id);

describe("readPlanTabs – welche Tabs im Planungs-Split entstehen", () => {
  it("nie gewählt: nur der Kalender – der Befehl verhält sich wie vor der Einstellung", () => {
    const t = readPlanTabs(mit(undefined));
    expect(ids(t)).toEqual([...PLAN_TAB_IDS]);
    expect(an(t)).toEqual(["calendar"]);
  });

  it("die Reihenfolge des Nutzers bleibt – sie IST die Rangfolge", () => {
    const t = readPlanTabs(mit([{ id: "note", on: true }, { id: "calendar", on: true }]));
    expect(ids(t).slice(0, 2)).toEqual(["note", "calendar"]);
    expect(an(t)).toEqual(["note", "calendar"]);
  });

  it("fehlende Einträge hängen hinten an und sind AUS – ein Update stellt niemandem ungefragt einen Tab hin", () => {
    const t = readPlanTabs(mit([{ id: "note", on: true }]));
    expect(ids(t)).toEqual(["note", "calendar", "daily"]);
    expect(an(t)).toEqual(["note"]);
  });

  it("mindestens einer bleibt an – sonst hätte „Planen“ rechts nichts zu öffnen", () => {
    const t = readPlanTabs(mit([{ id: "note", on: false }, { id: "calendar", on: false }, { id: "daily", on: false }]));
    expect(an(t)).toEqual(["calendar"]);
  });

  it("Müll aus data.json fällt weg: Unbekanntes, Doppeltes, kaputte Einträge", () => {
    const t = readPlanTabs(mit([
      { id: "quatsch", on: true }, null, "note", { on: true },
      { id: "daily", on: true }, { id: "daily", on: false },
    ]));
    expect(ids(t)).toEqual(["daily", "calendar", "note"]);
    expect(an(t)).toEqual(["daily"]);   // der ZWEITE daily-Eintrag wird ignoriert, nicht der erste
  });

  it("kein Wert ist kein „an“: on muss echtes true sein", () => {
    const t = readPlanTabs(mit([{ id: "note", on: "ja" }, { id: "daily" }]));
    expect(an(t)).toEqual(["calendar"]);   // beide zählen als aus -> Rückfall
  });

  it("liefert frische Objekte – ein Aufrufer, der schaltet, verändert nicht den Standard", () => {
    const a = readPlanTabs(mit(undefined));
    a[0].on = false;
    a[1].on = true;
    const b = readPlanTabs(mit(undefined));
    expect(an(b)).toEqual(["calendar"]);
  });
});
