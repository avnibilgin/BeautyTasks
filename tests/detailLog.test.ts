import { describe, it, expect, beforeEach } from "vitest";
import { parseDetailLog, serializeDetailLog, splitContent, composeContent, nowLogTs, formatLogTime } from "../src/detailLog";
import { setLocale } from "../src/i18n";

beforeEach(() => setLocale("en"));

describe("parseDetailLog / serializeDetailLog", () => {
  it("parst [!log]-Callouts (mehrzeilig)", () => {
    const md = "> [!log] 2026-06-15 10:00:00\n> Erster\n\n> [!log] 2026-06-15 11:30:00\n> Zweiter\n> mit Bild";
    expect(parseDetailLog(md)).toEqual([
      { ts: "2026-06-15 10:00:00", body: "Erster" },
      { ts: "2026-06-15 11:30:00", body: "Zweiter\nmit Bild" },
    ]);
  });

  it("Freitext ohne Callout = ein Legacy-Eintrag mit Fallback-Zeit", () => {
    const r = parseDetailLog("nur eine Notiz\nzweite Zeile", "2026-06-01 09:00:00");
    expect(r).toEqual([{ ts: "2026-06-01 09:00:00", body: "nur eine Notiz\nzweite Zeile", legacy: true }]);
  });

  it("leerer Body = keine Einträge", () => {
    expect(parseDetailLog("   \n\n")).toEqual([]);
  });

  it("Roundtrip serialize -> parse erhält Einträge", () => {
    const entries = [
      { ts: "2026-06-15 10:00:00", body: "A" },
      { ts: "2026-06-15 12:00:00", body: "B\nC" },
    ];
    const round = parseDetailLog(serializeDetailLog(entries));
    expect(round).toEqual(entries);
  });

  it("serialize überspringt leere Einträge", () => {
    expect(serializeDetailLog([{ ts: "x", body: "  " }])).toBe("");
  });
});

describe("splitContent / composeContent (Beschreibung ↔ Log)", () => {
  const FM = "---\ntype: task\nid: t1\n---\n";

  it("trennt Frontmatter, Titel, Beschreibung und Log", () => {
    const content = FM + "\n# Titel\n\nMeine Beschreibung\nmit zwei Zeilen\n\n> [!log] 2026-06-15 10:00:00\n> Ein Kommentar\n";
    const r = splitContent(content);
    expect(r.title).toBe("# Titel");
    expect(r.description).toBe("Meine Beschreibung\nmit zwei Zeilen");
    expect(r.log).toBe("> [!log] 2026-06-15 10:00:00\n> Ein Kommentar");
  });

  it("ohne Log ist alles nach dem Titel Beschreibung", () => {
    const r = splitContent(FM + "\n# Titel\n\nNur Beschreibung\n");
    expect(r.description).toBe("Nur Beschreibung");
    expect(r.log).toBe("");
  });

  it("ohne Beschreibung bleibt die Beschreibung leer", () => {
    const r = splitContent(FM + "\n# Titel\n\n> [!log] x\n> K\n");
    expect(r.description).toBe("");
    expect(r.log).toBe("> [!log] x\n> K");
  });

  it("Log schreiben erhält die Beschreibung (nicht-destruktiv)", () => {
    const content = FM + "\n# Titel\n\nBeschreibung bleibt\n\n> [!log] alt\n> alter Kommentar\n";
    const { fm, title, description } = splitContent(content);
    const neu = composeContent(fm, title, description, serializeDetailLog([{ ts: "neu", body: "neuer Kommentar" }]));
    const r = splitContent(neu);
    expect(r.description).toBe("Beschreibung bleibt");
    expect(r.log).toBe("> [!log] neu\n> neuer Kommentar");
  });

  it("Beschreibung schreiben erhält den Log", () => {
    const content = FM + "\n# Titel\n\nalt\n\n> [!log] x\n> K\n";
    const { fm, title, log } = splitContent(content);
    const neu = composeContent(fm, title, "neue Beschreibung", log);
    const r = splitContent(neu);
    expect(r.description).toBe("neue Beschreibung");
    expect(r.log).toBe("> [!log] x\n> K");
  });
});

describe("nowLogTs", () => {
  it("formatiert YYYY-MM-DD HH:MM:SS", () => {
    expect(nowLogTs(new Date(2026, 5, 15, 9, 5, 3))).toBe("2026-06-15 09:05:03");
  });
});

describe("formatLogTime", () => {
  const now = new Date(2026, 5, 15, 23, 0, 0);
  it("relative Tage (EN)", () => {
    expect(formatLogTime("2026-06-15 09:05", now)).toBe("Today · 09:05");
    expect(formatLogTime("2026-06-14 18:30", now)).toBe("Yesterday · 18:30");
  });
  it("anderes Datum mit Monatskürzel", () => {
    expect(formatLogTime("2026-06-10 08:15", now)).toBe("Jun 10 · 08:15");
  });
  it("anderes Jahr hängt Jahreszahl an", () => {
    expect(formatLogTime("2025-12-01 07:00", now)).toBe("Dec 1 2025 · 07:00");
  });
  it("ungültiger Zeitstempel wird unverändert zurückgegeben", () => {
    expect(formatLogTime("kein datum")).toBe("kein datum");
  });
});
