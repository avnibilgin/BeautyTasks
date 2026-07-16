import { describe, it, expect } from "vitest";
import { applyQuickEntry, emptyQuickEntryState, QuickEntryFields, QuickEntryOptions, QuickEntryState } from "../src/quickEntry";

// Keine Fake-Timer noetig: `today` ist der Bezugspunkt fuer alles – auch „morgen" im Text rechnet
// dagegen, nicht gegen die Systemuhr. HEUTE ist ein Montag (fuer Wochentagsphrasen).
const HEUTE = "2026-06-15";
const MORGEN = "2026-06-16";

const fields = (over: Partial<QuickEntryFields> = {}): QuickEntryFields =>
  ({ due: null, dueTime: null, priority: "normal", labels: [], project: null, ...over });

const opts = (over: Partial<QuickEntryOptions> = {}): QuickEntryOptions =>
  ({ enabled: true, frozen: false, duePinned: false, today: HEUTE, ...over });

const run = (raw: string, over: { f?: Partial<QuickEntryFields>; s?: QuickEntryState; o?: Partial<QuickEntryOptions> } = {}) =>
  applyQuickEntry(raw, fields(over.f), over.s ?? emptyQuickEntryState(), opts(over.o));

describe("applyQuickEntry – Uhrzeit ohne Datum", () => {
  it("setzt heute, damit die Uhrzeit sichtbar ist und das Speichern überlebt", () => {
    const r = run("Zahnarzt um 20:00");
    expect(r.title).toBe("Zahnarzt");
    expect(r.fields.due).toBe(HEUTE);
    expect(r.fields.dueTime).toBe("20:00");
  });

  it("lässt ein erkanntes Datum unangetastet", () => {
    const r = run("Zahnarzt morgen um 20:00");
    expect(r.fields.due).toBe(MORGEN);
    expect(r.fields.dueTime).toBe("20:00");
  });

  it("greift auch bei geschütztem Datumswort – die Uhrzeit gilt trotzdem", () => {
    const r = run("\\heute um 20:00");
    expect(r.title).toBe("heute");
    expect(r.fields.due).toBe(HEUTE);
    expect(r.fields.dueTime).toBe("20:00");
  });

  it("erfindet ohne Uhrzeit kein Datum", () => {
    const r = run("Zahnarzt");
    expect(r.fields.due).toBeNull();
    expect(r.fields.dueTime).toBeNull();
  });
});

describe("applyQuickEntry – Determinismus", () => {
  it("rechnet relative Phrasen gegen `today`, nicht gegen die Systemuhr", () => {
    expect(run("morgen").fields.due).toBe(MORGEN);
    expect(run("heute").fields.due).toBe(HEUTE);
    // Gleicher Aufruf mit anderem Bezugspunkt -> anderes Ergebnis, ohne Fake-Timer.
    expect(run("morgen", { o: { today: "2026-12-24" } }).fields.due).toBe("2026-12-25");
  });

  it("nutzt fuer Text und Uhrzeit-Default denselben Tag", () => {
    const r = run("heute um 20:00", { o: { today: "2026-12-24" } });
    expect(r.fields.due).toBe("2026-12-24");
    expect(r.fields.dueTime).toBe("20:00");
  });
});

describe("applyQuickEntry – bestehende Aufgabe (frozen)", () => {
  // Regression: Öffnen einer bestehenden Aufgabe parste den gespeicherten Titel erneut, setzte
  // ein Datum und löschte das Wort aus dem Titel – das Auto-Speichern schrieb beides fest.
  it("lässt Titel und Felder unberührt", () => {
    const r = run("heute gehe ich duschen", { o: { frozen: true } });
    expect(r.title).toBe("heute gehe ich duschen");
    expect(r.fields.due).toBeNull();
  });

  it("frisst auch #Labels und Priorität nicht aus dem Titel", () => {
    const r = run("Bericht #wichtig p1", { o: { frozen: true } });
    expect(r.title).toBe("Bericht #wichtig p1");
    expect(r.fields.labels).toEqual([]);
    expect(r.fields.priority).toBe("normal");
  });
});

describe("applyQuickEntry – abgeschaltet", () => {
  it("lässt den Titel wie getippt", () => {
    const r = run("Zahnarzt morgen um 20:00", { o: { enabled: false } });
    expect(r.title).toBe("Zahnarzt morgen um 20:00");
    expect(r.fields.due).toBeNull();
  });
});

describe("applyQuickEntry – duePinned (Datum manuell gesetzt)", () => {
  it("überschreibt ein manuell gesetztes Datum nicht", () => {
    const r = run("Zahnarzt morgen", { f: { due: "2026-12-24" }, o: { duePinned: true } });
    expect(r.fields.due).toBe("2026-12-24");
    expect(r.title).toBe("Zahnarzt");
  });

  it("setzt bei manuell geleertem Datum auch über die Uhrzeit kein heute", () => {
    const r = run("Zahnarzt um 20:00", { o: { duePinned: true } });
    expect(r.fields.due).toBeNull();
    expect(r.fields.dueTime).toBeNull();
  });
});

describe("applyQuickEntry – Labels", () => {
  it("ersetzt erkannte Labels bei jedem Lauf statt sie anzuhäufen", () => {
    // Simuliert das Tippen von „#wichtig": ohne Ersetzen entstünden #w, #wi, #wich, …
    let s = emptyQuickEntryState();
    let last = fields();
    for (const raw of ["Bericht #w", "Bericht #wi", "Bericht #wichtig"]) {
      const r = applyQuickEntry(raw, last, s, opts());
      last = r.fields; s = r.state;
    }
    expect(last.labels).toEqual(["wichtig"]);
  });

  it("lässt manuell gesetzte Labels unberührt", () => {
    const r = run("Bericht #erkannt", { f: { labels: ["manuell"] } });
    expect(r.fields.labels).toEqual(["manuell", "erkannt"]);
  });

  it("entfernt ein erkanntes Label wieder, wenn es aus dem Titel verschwindet", () => {
    const first = run("Bericht #weg");
    expect(first.fields.labels).toEqual(["weg"]);
    const second = applyQuickEntry("Bericht", first.fields, first.state, opts());
    expect(second.fields.labels).toEqual([]);
  });
});

describe("applyQuickEntry – @Projekt", () => {
  it("übernimmt ein erkanntes Projekt", () => {
    const r = run("Readme @BeautyTasks", { o: { projects: ["BeautyTasks"] } });
    expect(r.fields.project).toBe("BeautyTasks");
    expect(r.state.project).toBe("BeautyTasks");
  });

  it("fällt auf den Default zurück, wenn das @Projekt wieder gelöscht wird", () => {
    const o = { projects: ["BeautyTasks"], defaultProject: "Eingang" };
    const first = run("Readme @BeautyTasks", { o });
    const second = applyQuickEntry("Readme", first.fields, first.state, opts(o));
    expect(second.fields.project).toBe("Eingang");
    expect(second.state.project).toBeNull();
  });

  it("lässt ein manuell gewähltes Projekt in Ruhe", () => {
    const r = run("Readme", { f: { project: "Manuell" }, o: { projects: ["BeautyTasks"] } });
    expect(r.fields.project).toBe("Manuell");
  });

  // Der volle Editor reicht keine Projektliste herein – dort wählt man das Projekt per Picker.
  it("erkennt ohne Projektliste kein @Projekt", () => {
    const r = run("Readme @BeautyTasks");
    expect(r.fields.project).toBeNull();
  });
});

describe("applyQuickEntry – mutiert die Eingaben nicht", () => {
  it("lässt die übergebenen Felder unverändert", () => {
    const f = fields({ labels: ["a"] });
    applyQuickEntry("Zahnarzt morgen #b", f, emptyQuickEntryState(), opts());
    expect(f).toEqual({ due: null, dueTime: null, priority: "normal", labels: ["a"], project: null });
  });
});
