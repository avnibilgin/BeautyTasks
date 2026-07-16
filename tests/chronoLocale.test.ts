import { describe, it, expect } from "vitest";
import { chronoFallback, hasChronoFallback } from "../src/chronoLocale";
import { parseQuickEntry } from "../src/quickEntry";
import { pickLocale } from "../src/i18n";

// Donnerstag, 16.07.2026, 12:00 – fester Bezugspunkt statt Systemuhr.
const REF = new Date(2026, 6, 16, 12, 0, 0);
/** Wie das Plugin parst: eigene Regeln zuerst, chrono nur als Rueckfall der jeweiligen Sprache. */
const parse = (loc: string, text: string) => parseQuickEntry(text, [], REF, chronoFallback(loc));

describe("chrono-Rueckfall – Sprachen, die der eigene Parser nicht kann", () => {
  // Genau die Beispiele aus qa_placeholder. Vorher erkannte der Parser hier in 8 von 10 Sprachen
  // nichts – das Eingabefeld schlug also etwas vor, das nachweislich nicht funktionierte.
  it.each([
    ["es", "Escribir informe mañana"],
    ["pt", "Escrever relatório amanhã"],
    ["fr", "Rédiger le rapport demain"],
    ["it", "Scrivere report domani"],
    ["ru", "Написать отчёт завтра"],
    ["zh", "明天写报告"],
    ["ja", "明日 レポート作成"],
  ])("%s erkennt das eigene Placeholder-Beispiel", (loc, text) => {
    expect(parse(loc, text).faellig, text).toBe("2026-07-17");
  });

  // Der Platzhalter ist das, was die Leute lesen – er darf nichts versprechen, was nicht geht.
  // Vorher schlugen 8 von 10 Sprachen ein Datumswort vor, das der Parser nicht kannte.
  it.each([
    ["es", "Escribir informe mañana p1 #importante @trabajo"],
    ["pt", "Escrever relatório amanhã p1 #importante @trabalho"],
    ["fr", "Rédiger le rapport demain p1 #important @travail"],
    ["it", "Scrivere report domani p1 #importante @lavoro"],
    ["ru", "Написать отчёт завтра p1 #важно @работа"],
    ["zh", "明天写报告 p1 #重要 @工作"],
    ["ja", "明日 レポート作成 p1 #重要 @仕事"],
    ["de", "Bericht schreiben morgen p1 #wichtig @arbeit"],
    ["en", "Write report tomorrow p1 #important @work"],
    // Tuerkisch hat keinen chrono-Parser -> der Platzhalter zeigt bewusst das englische Wort.
    ["tr", "Rapor yaz tomorrow p1 #önemli @iş"],
  ])("%s: der qa_placeholder-Vorschlag funktioniert wirklich", (loc, text) => {
    const r = parse(loc, text);
    expect(r.faellig, text).not.toBe("");
    expect(r.priority, text).toBe("highest");
    expect(r.tags.length, text).toBe(1);
  });

  it("entfernt die erkannte Phrase aus dem Titel", () => {
    expect(parse("es", "Escribir informe mañana").title).toBe("Escribir informe");
    expect(parse("fr", "Rédiger le rapport demain").title).toBe("Rédiger le rapport");
  });

  it("meldet den Ausloeser fuer das ✕ am Chip", () => {
    expect(parse("es", "Escribir informe mañana").faelligSrc).toBe("mañana");
  });
});

describe("chrono-Rueckfall – de/en/tr bleiben beim eigenen Parser", () => {
  // Der Kern der Entscheidung: in DE/EN ist der eigene Parser besser. chrono kennt deutsche
  // Kurzdaten ohne Jahr nicht und liest „day after tomorrow" als „tomorrow" – ein FALSCHES Datum.
  it.each(["de", "en", "tr"])("%s bekommt keinen chrono-Rueckfall", (loc) => {
    expect(hasChronoFallback(loc)).toBe(false);
    expect(chronoFallback(loc)).toHaveLength(0);
  });

  it("deutsche Kurzdaten funktionieren weiter – die kann chrono naemlich nicht", () => {
    expect(parse("de", "Bericht 2.7.").faellig).toBe("2026-07-02");
    expect(parse("de", "Zahnarzt am 20.12.").faellig).toBe("2026-12-20");
  });

  it("uebermorgen bleibt uebermorgen – chrono wuerde daraus morgen machen", () => {
    expect(parse("de", "übermorgen test").faellig).toBe("2026-07-18");
    expect(parse("en", "day after tomorrow test").faellig).toBe("2026-07-18");
  });

  it("naechste woche bleibt der naechste Montag – chrono rechnet +7 Tage", () => {
    expect(parse("de", "nächste woche planen").faellig).toBe("2026-07-20");
  });
});

describe("chrono-Rueckfall – greift nur, wenn der eigene Parser nichts findet", () => {
  it("laesst englische Schluesselwoerter in jeder Sprache zuerst greifen", () => {
    // Der eigene Parser kann EN – der Rueckfall wird gar nicht erst befragt.
    expect(parse("es", "Escribir informe tomorrow").faellig).toBe("2026-07-17");
    expect(parse("ja", "レポート作成 tomorrow").faellig).toBe("2026-07-17");
  });

  it("nimmt eine ausdrueckliche Uhrzeit mit, erfindet aber keine", () => {
    // chrono fuellt die Stunde sonst aus dem Bezugszeitpunkt auf.
    expect(parse("es", "Reunión mañana").time).toBe("");
    expect(parse("es", "Reunión mañana").faellig).toBe("2026-07-17");
  });

  // Regression: Der chrono-Rueckfall lief zuerst NACH den eigenen Regeln. Deren Uhrzeit-Regel
  // schnappte sich die "20:00", damit galt der Rueckfall als erledigt und chrono sah das "mañana"
  // nie – der Termin landete auf HEUTE 20:00 statt morgen, mit "a las" als Rest im Titel.
  // In der eigenen Sprache hat chrono deshalb Vorrang vor den Regeln.
  it("erkennt Datum UND Uhrzeit in einem Satz", () => {
    const r = parse("es", "Reunión mañana a las 20:00");
    expect(r.faellig).toBe("2026-07-17");
    expect(r.time).toBe("20:00");
    expect(r.title).toBe("Reunión");
  });

  it("laesst sich escapen wie alles andere", () => {
    const r = parse("es", "Escribir \\mañana informe");
    expect(r.faellig).toBe("");
    expect(r.title).toBe("Escribir mañana informe");
  });

  it("ruehrt Labels, Prioritaet und Projekt nicht an", () => {
    const r = parseQuickEntry("Escribir mañana #importante p1 @trabajo", ["trabajo"], REF, chronoFallback("es"));
    expect(r.faellig).toBe("2026-07-17");
    expect(r.tags).toEqual(["importante"]);
    expect(r.priority).toBe("highest");
    expect(r.project).toBe("trabajo");
    expect(r.title).toBe("Escribir");
  });
});

describe("chrono-Rueckfall – passt zur Locale-Erkennung des Plugins", () => {
  // pickLocale mappt regionale Codes auf die Basissprache. Die Zuordnung muss dieselben Codes
  // treffen, sonst laeuft ein pt-BR-Vault stillschweigend ohne Rueckfall.
  it.each([["pt-br", "pt"], ["zh-cn", "zh"], ["es-ES", "es"]])("%s -> %s", (raw, base) => {
    expect(pickLocale(raw)).toBe(base);
    expect(hasChronoFallback(pickLocale(raw))).toBe(true);
  });

  it("wirft bei unbekannter Sprache nicht, sondern laesst den eigenen Parser arbeiten", () => {
    expect(chronoFallback("kli")).toHaveLength(0);
    expect(parse("kli", "call tomorrow").faellig).toBe("2026-07-17");
  });
});
