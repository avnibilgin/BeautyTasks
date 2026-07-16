import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { parseQuickEntry } from "../src/quickEntry";

// „Heute" ist im Parser an die Systemzeit gebunden -> für deterministische Datums-Tests
// auf einen festen Montag (2026-06-15) einfrieren.
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 5, 15, 12, 0, 0)); });
afterEach(() => { vi.useRealTimers(); });

describe("parseQuickEntry – Labels", () => {
  it("sammelt #Labels, entfernt sie aus dem Titel", () => {
    const r = parseQuickEntry("Milch kaufen #einkauf #wichtig");
    expect(r.title).toBe("Milch kaufen");
    expect(r.tags).toEqual(["einkauf", "wichtig"]);
  });

  it("dedupliziert gleiche Labels", () => {
    expect(parseQuickEntry("#a Aufgabe #a").tags).toEqual(["a"]);
  });
});

describe("parseQuickEntry – @Projekt (nur bestehende)", () => {
  it("ordnet ein bestehendes Projekt zu und entfernt @Name aus dem Titel", () => {
    const r = parseQuickEntry("Readme schreiben @BeautyTasks", ["BeautyTasks"]);
    expect(r.project).toBe("BeautyTasks");
    expect(r.title).toBe("Readme schreiben");
  });
  it("trifft den längsten Namen zuerst (Mehrwort vor Teilwort)", () => {
    const r = parseQuickEntry("Backup @Home Server morgen", ["Home", "Home Server"]);
    expect(r.project).toBe("Home Server");
    expect(r.faellig).toBe("2026-06-16");
    expect(r.title).toBe("Backup");
  });
  it("übernimmt die kanonische Schreibweise (case-insensitiv)", () => {
    expect(parseQuickEntry("x @beautytasks", ["BeautyTasks"]).project).toBe("BeautyTasks");
  });
  it("ordnet NICHT zu, wenn das Projekt nicht existiert (Text bleibt stehen)", () => {
    const r = parseQuickEntry("mail @Unbekannt", ["BeautyTasks"]);
    expect(r.project).toBeNull();
    expect(r.title).toBe("mail @Unbekannt");
  });
  it("verwechselt @HH:MM nicht mit einem Projekt", () => {
    const r = parseQuickEntry("Termin @07:30", ["BeautyTasks"]);
    expect(r.project).toBeNull();
    expect(r.time).toBe("07:30");
  });
  it("ohne Projektliste ist project null", () => {
    expect(parseQuickEntry("Aufgabe @BeautyTasks").project).toBeNull();
  });
});

describe("parseQuickEntry – Datumsphrasen (DE/EN)", () => {
  it("heute / today", () => {
    expect(parseQuickEntry("heute anrufen").faellig).toBe("2026-06-15");
    expect(parseQuickEntry("call today").faellig).toBe("2026-06-15");
  });
  it("morgen / tomorrow", () => {
    expect(parseQuickEntry("morgen abgeben").faellig).toBe("2026-06-16");
    expect(parseQuickEntry("submit tomorrow").faellig).toBe("2026-06-16");
  });
  it("übermorgen / day after tomorrow", () => {
    expect(parseQuickEntry("übermorgen test").faellig).toBe("2026-06-17");
    expect(parseQuickEntry("day after tomorrow test").faellig).toBe("2026-06-17");
  });
  it("in N Tagen / in N days", () => {
    expect(parseQuickEntry("in 3 tagen").faellig).toBe("2026-06-18");
    expect(parseQuickEntry("in 3 days").faellig).toBe("2026-06-18");
  });
  it("Wochentag (am freitag / next monday)", () => {
    expect(parseQuickEntry("am freitag arzt").faellig).toBe("2026-06-19");
    expect(parseQuickEntry("next monday meeting").faellig).toBe("2026-06-22");
  });
  it("explizite Datumsformate", () => {
    expect(parseQuickEntry("Bericht 20.06.2026").faellig).toBe("2026-06-20");
    expect(parseQuickEntry("Bericht 2026-12-01").faellig).toBe("2026-12-01");
  });
});

describe("parseQuickEntry – Wortgrenzen (kein Lookbehind nötig)", () => {
  it("matcht Token nicht innerhalb eines Wortes", () => {
    const r = parseQuickEntry("theute kein Treffer");
    expect(r.faellig).toBe("");
    expect(r.title).toBe("theute kein Treffer");
  });
  it("kombiniert Datum + Label + Resttitel", () => {
    const r = parseQuickEntry("Milch kaufen #einkauf morgen");
    expect(r.faellig).toBe("2026-06-16");
    expect(r.tags).toEqual(["einkauf"]);
    expect(r.title).toBe("Milch kaufen");
  });
});

describe("parseQuickEntry – Uhrzeit", () => {
  it("erkennt um HH:MM und entfernt es aus dem Titel", () => {
    const r = parseQuickEntry("Zahnarzt um 07:30");
    expect(r.time).toBe("07:30");
    expect(r.title).toBe("Zahnarzt");
  });
  it("erkennt bloesses HH:MM", () => {
    expect(parseQuickEntry("Meeting 14:15").time).toBe("14:15");
  });
  it("erkennt um H uhr und H uhr", () => {
    expect(parseQuickEntry("Anruf um 9 uhr").time).toBe("09:00");
    expect(parseQuickEntry("Termin 8 uhr").time).toBe("08:00");
  });
  it("erkennt englisches am/pm", () => {
    expect(parseQuickEntry("call 7pm").time).toBe("19:00");
    expect(parseQuickEntry("call 7:30 am").time).toBe("07:30");
  });
  it("erkennt die deutsche Punkt-Schreibweise mit um", () => {
    expect(parseQuickEntry("Termin um 20.15").time).toBe("20:15");
    expect(parseQuickEntry("Termin um 8.30").time).toBe("08:30");
  });

  // Der Grund, warum die um-Regeln VOR den Datumsregeln laufen: „20.12" ist als Datum gueltig
  // (20. Dezember), „20.15" nicht (Monat 15). Ohne die Reihenfolge waere „um 20.12" ein Datum und
  // „um 20.15" eine Uhrzeit – dasselbe Muster mit zwei Ergebnissen, je nach Minutenzahl.
  it("liest um TT.MM als Uhrzeit, auch wenn die Minute ein gueltiger Monat waere", () => {
    for (const [raw, time] of [["Termin um 20.12", "20:12"], ["Termin um 8.12", "08:12"], ["Termin um 20.01", "20:01"]]) {
      const r = parseQuickEntry(raw);
      expect(r.time, raw).toBe(time);
      expect(r.faellig, raw).toBe("");
    }
  });

  it("laesst Datumsangaben Datumsangaben – auch mit Punkt", () => {
    expect(parseQuickEntry("Bericht am 20.12.").faellig).toBe("2026-12-20");
    expect(parseQuickEntry("Bericht 20.12").faellig).toBe("2026-12-20");
    expect(parseQuickEntry("Bericht 2.7.").faellig).toBe("2026-07-02");
    expect(parseQuickEntry("Bericht am 20.12.").time).toBe("");
    // Vollstaendiges Datum bleibt Datum, auch wenn „um" davor steht.
    expect(parseQuickEntry("Termin um 20.10.2026").faellig).toBe("2026-10-20");
    expect(parseQuickEntry("Termin um 20.10.2026").time).toBe("");
  });

  it("erkennt Datum und Uhrzeit nebeneinander", () => {
    const r = parseQuickEntry("Zahnarzt am 20.12. um 8.30");
    expect(r.faellig).toBe("2026-12-20");
    expect(r.time).toBe("08:30");
    expect(r.title).toBe("Zahnarzt");
  });

  it("weist unmoegliche Punkt-Uhrzeiten ab", () => {
    expect(parseQuickEntry("Termin um 25.15").time).toBe("");
    expect(parseQuickEntry("Termin um 25.15").title).toBe("Termin um 25.15");
  });

  it("erkennt vierstellige Uhrzeiten mit um/at", () => {
    expect(parseQuickEntry("Termin um 2015").time).toBe("20:15");
    expect(parseQuickEntry("Termin um 0930").time).toBe("09:30");
    expect(parseQuickEntry("meeting at 1745").time).toBe("17:45");
    expect(parseQuickEntry("Termin um 2015 uhr").time).toBe("20:15");
    expect(parseQuickEntry("Termin um 20").time).toBe("20:00");   // zweistellig unveraendert
  });

  it("haelt vierstellige Zahlen ohne um/at fuer Jahre, nicht fuer Uhrzeiten", () => {
    // Ohne diesen Schutz wuerde jede Jahreszahl im Titel zur Uhrzeit.
    for (const raw of ["Fotos von 2015 sortieren", "Jubilaeum 2015 feiern", "Termin 2015", "Bericht 1999"]) {
      const r = parseQuickEntry(raw);
      expect(r.time, raw).toBe("");
      expect(r.title, raw).toBe(raw);
    }
  });

  it("weist unmoegliche vierstellige Uhrzeiten ab", () => {
    const r = parseQuickEntry("Termin um 2500");
    expect(r.time).toBe("");
    expect(r.title).toBe("Termin um 2500");
  });

  it("ignoriert ungueltige Zeiten", () => {
    expect(parseQuickEntry("Code 99:99").time).toBe("");
  });
});

describe("parseQuickEntry – Prioritaet", () => {
  it("erkennt p1-p4 und entfernt es aus dem Titel", () => {
    const r = parseQuickEntry("Zahnarzt p1");
    expect(r.priority).toBe("highest");
    expect(r.title).toBe("Zahnarzt");
    expect(parseQuickEntry("x p2").priority).toBe("high");
    expect(parseQuickEntry("x p3").priority).toBe("medium");
    expect(parseQuickEntry("x p4").priority).toBe("normal");
  });
  it("erkennt !1-!4", () => {
    expect(parseQuickEntry("wichtig !1").priority).toBe("highest");
  });
  it("greift nicht mitten im Wort", () => {
    expect(parseQuickEntry("Kapitel p12 lesen").priority).toBeNull();
    expect(parseQuickEntry("Top1 Liste").priority).toBeNull();
  });
});

describe("parseQuickEntry – wörtlich per \\wort", () => {
  it("schützt ein einzelnes Wort und entfernt den Backslash", () => {
    const r = parseQuickEntry("\\Heute mache ich");
    expect(r.title).toBe("Heute mache ich");
    expect(r.faellig).toBe("");
  });

  it("schützt nur das markierte Wort – ein zweites Datum daneben greift weiter", () => {
    const r = parseQuickEntry("\\Heute Aufgabe planen morgen");
    expect(r.title).toBe("Heute Aufgabe planen");
    expect(r.faellig).toBe("2026-06-16");
  });

  it("wirkt auch auf Labels, Priorität und @Projekt", () => {
    const r = parseQuickEntry("Notiz \\#kein-label \\p1 \\@BeautyTasks", ["BeautyTasks"]);
    expect(r.title).toBe("Notiz #kein-label p1 @BeautyTasks");
    expect(r.tags).toEqual([]);
    expect(r.priority).toBeNull();
    expect(r.project).toBeNull();
  });

  it("entfernt den Marker auch vor Wörtern, die gar keine Auslöser sind", () => {
    expect(parseQuickEntry("\\Milch kaufen").title).toBe("Milch kaufen");
  });

  it("\\\\ ergibt einen echten Backslash im Titel", () => {
    expect(parseQuickEntry("Pfad \\\\ pruefen").title).toBe("Pfad \\ pruefen");
  });

  it("zählt nur am Wortanfang – Pfade bleiben unversehrt", () => {
    expect(parseQuickEntry("C:\\Users\\avni sichern").title).toBe("C:\\Users\\avni sichern");
  });
});

describe("parseQuickEntry – wörtlich per Anführungszeichen", () => {
  it("schützt eine Phrase und lässt die Anführungszeichen im Titel stehen", () => {
    const r = parseQuickEntry('Buch "Der Prozess" heute lesen');
    expect(r.title).toBe('Buch "Der Prozess" lesen');
    expect(r.faellig).toBe("2026-06-15");
  });

  it("schützt mehrwortige Datumsphrasen, die \\wort nicht sauber fasst", () => {
    expect(parseQuickEntry('Vortrag "next monday" erklären').faellig).toBe("");
    expect(parseQuickEntry('Vortrag "day after tomorrow" erklären').faellig).toBe("");
  });

  it("erkennt auch typografische Anführungszeichen (Autokorrektur)", () => {
    const r = parseQuickEntry("Kapitel „heute“ lesen");
    expect(r.faellig).toBe("");
    expect(r.title).toBe("Kapitel „heute“ lesen");
  });

  it("erhält die Formatierung im geschützten Text", () => {
    expect(parseQuickEntry('Zitat "a  b" merken').title).toBe('Zitat "a  b" merken');
  });

  it("unpaariges Anführungszeichen ändert nichts", () => {
    const r = parseQuickEntry('Zoll " heute zahlen');
    expect(r.faellig).toBe("2026-06-15");
    expect(r.title).toBe('Zoll " zahlen');
  });

  it("lässt Apostrophe unangetastet (kein Escape-Zeichen)", () => {
    const r = parseQuickEntry("Peter's Auto heute waschen");
    expect(r.faellig).toBe("2026-06-15");
    expect(r.title).toBe("Peter's Auto waschen");
  });

  it("lässt Wikilinks im Titel heil", () => {
    const r = parseQuickEntry("Notiz [[Projekt X]] heute lesen");
    expect(r.title).toBe("Notiz [[Projekt X]] lesen");
    expect(r.faellig).toBe("2026-06-15");
  });
});

describe("parseQuickEntry – kombiniert (Original-Eingabe)", () => {
  it("Morgen um 07:30 Zahnarzt #wichtig p1", () => {
    const r = parseQuickEntry("Morgen um 07:30 Zahnarzt #wichtig p1");
    expect(r.faellig).toBe("2026-06-16");
    expect(r.time).toBe("07:30");
    expect(r.tags).toEqual(["wichtig"]);
    expect(r.priority).toBe("highest");
    expect(r.title).toBe("Zahnarzt");
  });
});
