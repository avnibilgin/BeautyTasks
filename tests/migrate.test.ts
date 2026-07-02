import { describe, it, expect } from "vitest";
import { parseLine } from "../src/migrate";

describe("parseLine – alte BeautyTasks-Zeile zerlegen", () => {
  it("offene Aufgabe mit Label, Fälligkeit, Priorität, Wiederholung", () => {
    const r = parseLine("- [ ] #task Milch kaufen #einkauf 📅 2026-06-20 🔼 🔁 every week");
    expect(r).not.toBeNull();
    expect(r).toMatchObject({
      status: "todo",
      title: "Milch kaufen",
      labels: ["einkauf"],
      due: "2026-06-20",
      priority: "medium",
      recurrence: "every week",
      scheduled: null,
      completed: null,
      cancelled: null,
      detailsBase: null,
    });
  });

  it("erledigt mit Abschlussdatum", () => {
    const r = parseLine("- [x] Rechnung zahlen ✅ 2026-06-01");
    expect(r).toMatchObject({ status: "done", title: "Rechnung zahlen", completed: "2026-06-01" });
  });

  it("abgebrochen mit Datum", () => {
    const r = parseLine("- [-] Alte Aufgabe ❌ 2026-06-02");
    expect(r).toMatchObject({ status: "cancelled", title: "Alte Aufgabe", cancelled: "2026-06-02" });
  });

  it("geplant (scheduled) via ⏳", () => {
    const r = parseLine("- [ ] Vorbereiten ⏳ 2026-06-18");
    expect(r).toMatchObject({ scheduled: "2026-06-18", due: null });
  });

  it("Details-Link wird als detailsBase erkannt und aus dem Titel entfernt", () => {
    const r = parseLine("- [ ] Aufgabe mit Notiz [[Aufgabe-abc|Details]]");
    expect(r).toMatchObject({ title: "Aufgabe mit Notiz", detailsBase: "Aufgabe-abc" });
  });

  it("Nicht-Aufgabenzeilen ergeben null", () => {
    expect(parseLine("## Überschrift")).toBeNull();
    expect(parseLine("nur Text")).toBeNull();
  });
});
