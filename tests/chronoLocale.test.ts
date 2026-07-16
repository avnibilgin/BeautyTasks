import { describe, it, expect } from "vitest";
import { chronoFor, hasChronoLocale } from "../src/chronoLocale";
import { pickLocale } from "../src/i18n";

// Donnerstag, 16.07.2026, 12:00 – fester Bezugspunkt statt Systemuhr.
const REF = new Date(2026, 6, 16, 12, 0, 0);
const parse = (loc: string, text: string) => {
  for (const c of chronoFor(loc)) {
    const hit = c.parse(text, REF, { forwardDate: true })[0];
    if (hit) return hit;
  }
  return null;
};
const iso = (loc: string, text: string) => {
  const h = parse(loc, text);
  if (!h) return "";
  const d = h.start.date();
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
};

describe("chronoFor – Sprachabdeckung", () => {
  // Genau die Beispiele, die qa_placeholder der jeweiligen Sprache vorschlägt. Vorher hat der
  // handgeschriebene Parser hier in 8 von 10 Sprachen nichts erkannt.
  it.each([
    ["en", "Write report tomorrow"],
    ["de", "Bericht schreiben morgen"],
    ["es", "Escribir informe mañana"],
    ["pt", "Escrever relatório amanhã"],
    ["fr", "Rédiger le rapport demain"],
    ["it", "Scrivere report domani"],
    ["ru", "Написать отчёт завтра"],
    ["zh", "明天写报告"],
    ["ja", "明日 レポート作成"],
  ])("%s erkennt das eigene Placeholder-Beispiel", (loc, text) => {
    expect(iso(loc, text), text).toBe("2026-07-17");
  });

  it("hat für Türkisch keinen Parser und faellt auf Englisch zurueck", () => {
    expect(hasChronoLocale("tr")).toBe(false);
    expect(chronoFor("tr")).toHaveLength(1);
    // Englische Schluesselwoerter funktionieren dort trotzdem …
    expect(iso("tr", "Yarın rapor yaz tomorrow")).toBe("2026-07-17");
    // … das tuerkische Wort aber nicht. Haelt die bekannte Luecke fest.
    expect(iso("tr", "Yarın rapor yaz")).toBe("");
  });
});

describe("chronoFor – Englisch als zweiter Parser", () => {
  it("versteht in einer anderen Sprache auch englische Schluesselwoerter", () => {
    // Der handgeschriebene Parser konnte DE und EN immer gleichzeitig – das bleibt so.
    expect(iso("de", "Bericht schreiben tomorrow")).toBe("2026-07-17");
    expect(iso("es", "Escribir informe tomorrow")).toBe("2026-07-17");
  });

  it("gibt der eigenen Sprache den Vorrang", () => {
    expect(chronoFor("de")).toHaveLength(2);
    expect(chronoFor("en")).toHaveLength(1);   // kein doppeltes Englisch
  });
});

describe("chronoFor – passt zur Locale-Erkennung des Plugins", () => {
  // pickLocale mappt regionale Codes auf die Basissprache (pt-br -> pt). Die Zuordnung hier muss
  // dieselben Codes treffen, sonst laeuft ein pt-BR-Vault stillschweigend auf Englisch.
  it.each([["pt-br", "pt"], ["zh-cn", "zh"], ["en-gb", "en"], ["de-DE", "de"]])(
    "%s -> %s", (raw, base) => {
      const loc = pickLocale(raw);
      expect(loc).toBe(base);
      expect(hasChronoLocale(loc)).toBe(true);
    });

  it("faellt bei unbekannter Sprache auf Englisch zurueck statt zu werfen", () => {
    expect(chronoFor("kli")).toHaveLength(1);
    expect(iso("kli", "call tomorrow")).toBe("2026-07-17");
  });
});
