import { describe, it, expect } from "vitest";
import { takeFromBudget, repaintCount, rowsForScroll, columnFirstPaint, placeholderPx } from "../src/chunkPlan";

/**
 * Die Arithmetik des stückweisen Zeichnens.
 *
 * Beide Fehler, die dieses Verfahren im Betrieb hatte, waren Rechenfehler – und beide hätten
 * hier auffallen müssen. Deshalb stehen sie unten als eigene Fälle, mit den Zahlen aus dem
 * echten Vault statt mit erfundenen.
 */

const CHUNK = 60;
const BUDGET = 80;

/** Das Budget wandert von Sektion zu Sektion – hier nachgestellt wie in section(). */
function seitenlauf(groessen: number[], budget = BUDGET): number[] {
  let rest = budget;
  return groessen.map((g) => { const n = takeFromBudget(rest, g); rest -= n; return n; });
}

describe("Seiten-Budget", () => {
  it("zeichnet insgesamt nur das Budget – egal auf wie viele Sektionen es sich verteilt", () => {
    // Der echte Fall: 1411 offene Aufgaben, nach Datum gruppiert, 202 Tages-Sektionen.
    // 200 davon liegen unter einem Schub. Wer je Sektion deckelt, deckelt nichts.
    const groessen = [617, 132, ...Array<number>(200).fill(4)];
    const gezeichnet = seitenlauf(groessen);
    expect(gezeichnet.reduce((a, b) => a + b, 0)).toBe(BUDGET);
    expect(gezeichnet[0]).toBe(BUDGET);        // die erste Sektion nimmt, was sie braucht
    expect(gezeichnet.slice(1).every((n) => n === 0)).toBe(true);
  });

  it("bedient viele kleine Sektionen der Reihe nach, bis das Budget leer ist", () => {
    const gezeichnet = seitenlauf(Array<number>(50).fill(10));
    expect(gezeichnet.reduce((a, b) => a + b, 0)).toBe(BUDGET);
    expect(gezeichnet.slice(0, 8)).toEqual([10, 10, 10, 10, 10, 10, 10, 10]);
    expect(gezeichnet[8]).toBe(0);
  });

  it("zeichnet eine kurze Seite vollständig – dort gibt es nichts zu deckeln", () => {
    expect(seitenlauf([5, 3, 2])).toEqual([5, 3, 2]);
  });

  it("wird nie negativ und fordert nie mehr an, als die Sektion hat", () => {
    expect(takeFromBudget(0, 100)).toBe(0);
    expect(takeFromBudget(-5, 100)).toBe(0);
    expect(takeFromBudget(100, 7)).toBe(7);
  });

  it("ohne Budget (Infinity) wird alles gezeichnet – Seiten ohne Deckelung bleiben unverändert", () => {
    expect(takeFromBudget(Number.POSITIVE_INFINITY, 5000)).toBe(5000);
  });
});

describe("Wiederauffüllen nach einer Änderung", () => {
  it("baut mindestens einen Schub auf", () => {
    expect(repaintCount({ total: 500, shown: 0, minimum: CHUNK })).toBe(CHUNK);
  });

  it("baut so weit auf wie vorher – sonst schrumpft die Liste unter dem Nutzer weg", () => {
    expect(repaintCount({ total: 500, shown: 300, minimum: CHUNK })).toBe(300);
  });

  it("geht nie über das Ende hinaus", () => {
    expect(repaintCount({ total: 40, shown: 300, minimum: CHUNK })).toBe(40);
  });

  it("lässt eine ausgehängte Sektion ausgehängt", () => {
    expect(repaintCount({ total: 500, shown: 0, minimum: CHUNK, recycled: true })).toBe(0);
  });

  it("zeichnet bei einem Sprung aus der Suche ALLES – die Zeile kann überall stehen", () => {
    expect(repaintCount({ total: 500, shown: 0, minimum: CHUNK, flash: true })).toBe(500);
    // Auch dann, wenn die Sektion gerade ausgehängt ist.
    expect(repaintCount({ total: 500, shown: 0, minimum: CHUNK, recycled: true, flash: true })).toBe(500);
  });
});

describe("Füllen bis zu einer gemerkten Scrollposition", () => {
  it("zeichnet nichts, wenn die Spalte oben stand", () => {
    expect(rowsForScroll({ savedTop: 0, viewportPx: 600, itemPx: 40, chunk: CHUNK, total: 500 })).toBe(0);
  });

  it("reicht bis zur Position PLUS einem Sichtfeld", () => {
    // 4000 px gescrollt, 600 px hoch, 40 px je Karte -> (4000+600)/40 = 115, plus Reserve.
    expect(rowsForScroll({ savedTop: 4000, viewportPx: 600, itemPx: 40, chunk: CHUNK, total: 500 })).toBe(175);
  });

  it("zeichnet erst einen Schub, solange nichts gemessen wurde", () => {
    // Genau der Fall, der beim Verschieben einer Spalte an den Anfang zurücksprang: Ohne
    // gemessene Kartenhöhe war der Platzhalter zu kurz und der Browser klemmte die Position.
    expect(rowsForScroll({ savedTop: 4000, viewportPx: 600, itemPx: 0, chunk: CHUNK, total: 500 })).toBe(CHUNK);
  });

  it("geht nie über das Ende hinaus", () => {
    expect(rowsForScroll({ savedTop: 99999, viewportPx: 600, itemPx: 40, chunk: CHUNK, total: 12 })).toBe(12);
  });
});

describe("Board-Spalte", () => {
  it("füllt ihr eigenes Sichtfeld – nicht einen Anteil am Seiten-Budget", () => {
    // Der Fehler dahinter: Spalten stehen NEBENeinander. Wer das Budget von links nach rechts
    // verteilt, lässt die vierte leer starten, obwohl sie genauso sichtbar ist – sie füllte
    // sich dann sichtbar nach (das gemeldete „Blinzeln" beim Abhaken in Spalte 1).
    const je = { total: 500, viewportPx: 800, itemPx: 0, fallbackPx: 64, reserve: 4 };
    const spalten = [1, 2, 3, 4, 5].map(() => columnFirstPaint(je));
    expect(new Set(spalten).size).toBe(1);          // jede Spalte bekommt dasselbe
    expect(spalten[0]).toBeGreaterThan(0);          // und keine startet leer
  });

  it("nutzt die gemessene Kartenhöhe, sobald es eine gibt", () => {
    const gemessen = columnFirstPaint({ total: 500, viewportPx: 800, itemPx: 100, fallbackPx: 64, reserve: 4 });
    const geschaetzt = columnFirstPaint({ total: 500, viewportPx: 800, itemPx: 0, fallbackPx: 64, reserve: 4 });
    expect(gemessen).toBe(12);                      // 800/100 = 8, plus 4 Reserve
    expect(gemessen).toBeLessThan(geschaetzt);      // hohe Karten -> weniger passen hinein
  });

  it("zeichnet eine kurze Spalte ganz", () => {
    expect(columnFirstPaint({ total: 3, viewportPx: 800, itemPx: 40, fallbackPx: 64, reserve: 4 })).toBe(3);
  });
});

describe("Platzhalter", () => {
  it("misst das, was noch fehlt", () => {
    expect(placeholderPx(500, 80, 34)).toBe(420 * 34);
  });

  it("ist null, wenn alles steht – eine vollständige Sektion braucht keinen", () => {
    expect(placeholderPx(80, 80, 34)).toBe(0);
    expect(placeholderPx(80, 999, 34)).toBe(0);
  });
});
