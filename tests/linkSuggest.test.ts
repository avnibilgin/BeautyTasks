import { describe, it, expect } from "vitest";
import { findLinkQuery, applyLink } from "../src/linkSuggest";

/** Bequem: „|" im Text markiert den Cursor. */
function at(marked: string): { text: string; caret: number } {
  const caret = marked.indexOf("|");
  return { text: marked.slice(0, caret) + marked.slice(caret + 1), caret };
}
const find = (marked: string) => { const { text, caret } = at(marked); return findLinkQuery(text, caret); };

describe("findLinkQuery", () => {
  it("erkennt die offene Klammer und was dahinter getippt wurde", () => {
    expect(find("Siehe [[Kalen|")).toEqual({ start: 6, query: "Kalen" });
  });

  it("erkennt die Klammer auch ohne Eingabe dahinter", () => {
    expect(find("Siehe [[|")).toEqual({ start: 6, query: "" });
  });

  it("schweigt ohne Klammer", () => {
    expect(find("Nur Text|")).toBeNull();
  });

  // Sonst würde ein „[[" drei Zeilen weiter oben die Eingabe kapern.
  it("überschreitet keinen Zeilenumbruch", () => {
    expect(find("[[Notiz\nZweite Zeile|")).toBeNull();
  });

  it("schweigt bei einem bereits geschlossenen Link", () => {
    expect(find("Siehe [[Notiz]] und weiter|")).toBeNull();
  });

  it("nimmt die LETZTE offene Klammer, nicht die erste", () => {
    expect(find("[[Fertig]] und [[Neu|")).toEqual({ start: 15, query: "Neu" });
  });

  // Cursor steht MITTEN in einem fertigen Link – der Teil links davon ist offen.
  it("greift auch innerhalb eines fertigen Links", () => {
    expect(find("Siehe [[Alt|]]")).toEqual({ start: 6, query: "Alt" });
  });
});

describe("applyLink", () => {
  it("ersetzt nur den Bereich ab der Klammer und lässt den Rest stehen", () => {
    const { text, caret } = at("Siehe [[Kalen| – und danach mehr");
    const q = findLinkQuery(text, caret)!;
    const out = applyLink(text, q, caret, "Kalender-Sync");
    expect(out.text).toBe("Siehe [[Kalender-Sync]] – und danach mehr");
    expect(out.caret).toBe("Siehe [[Kalender-Sync]]".length);
  });

  // Wer in ein fertiges „[[Alt]]" hineinklickt und neu tippt, bekäme sonst „[[Neu]]]]".
  it("verbraucht ein direkt folgendes ]] mit", () => {
    const { text, caret } = at("Siehe [[Alt|]]");
    const q = findLinkQuery(text, caret)!;
    expect(applyLink(text, q, caret, "Neu").text).toBe("Siehe [[Neu]]");
  });

  it("setzt den Cursor hinter die schließende Klammer", () => {
    const { text, caret } = at("[[|");
    const q = findLinkQuery(text, caret)!;
    const out = applyLink(text, q, caret, "A");
    expect(out.text).toBe("[[A]]");
    expect(out.caret).toBe(5);
  });

  it("lässt Text vor der Klammer unangetastet", () => {
    const { text, caret } = at("Zeile eins\nSiehe [[K|");
    const q = findLinkQuery(text, caret)!;
    expect(applyLink(text, q, caret, "Kalender").text).toBe("Zeile eins\nSiehe [[Kalender]]");
  });
});
