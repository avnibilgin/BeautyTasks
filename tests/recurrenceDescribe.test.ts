import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { describeRecurrence } from "../src/recurrence";
import { setLocale } from "../src/i18n";

/**
 * Die Anzeigeschicht: gespeichert wird die Regel, gezeigt wird Klartext. Genau deshalb können wir
 * uns EIN Speicherformat leisten – niemand muss `FREQ=MONTHLY;BYDAY=-1FR` lesen.
 *
 * Sprache fest auf Deutsch, sonst hinge das Ergebnis an der Umgebung, in der die Tests laufen.
 * Wochentagsnamen kommen von `Intl`, nicht aus unseren Übersetzungen.
 */
beforeAll(() => setLocale("de"));
afterAll(() => setLocale("en"));

describe("describeRecurrence", () => {
  it("nennt die fünf Vorlagen bei ihrem Namen", () => {
    expect(describeRecurrence("FREQ=DAILY")).toBe("Täglich");
    expect(describeRecurrence("FREQ=MONTHLY;INTERVAL=3")).toBe("Quartalsweise");   // vorhandener Vorlagen-Name, nicht neu erfunden
  });

  it("zählt Sonderintervalle aus", () => {
    expect(describeRecurrence("FREQ=DAILY;INTERVAL=5")).toBe("Alle 5 Tage");
    expect(describeRecurrence("FREQ=WEEKLY;INTERVAL=2")).toBe("Alle 2 Wochen");
  });

  it("benennt Wochentagsregeln", () => {
    expect(describeRecurrence("FREQ=WEEKLY;BYDAY=MO")).toBe("Jeden Montag");
    // Bewusst NICHT "Jeden 2. Dienstag": Das liest sich wie der zweite Dienstag im MONAT und
    // stuende damit neben "2. Montag im Monat" fuer etwas ganz anderes. Der Umweg ueber
    // "Alle 2 Wochen" ist eindeutig - und braucht keine Ordnungszahl, die JavaScript ohnehin
    // nicht ausschreiben kann (Intl kennt kein RBNF).
    expect(describeRecurrence("FREQ=WEEKLY;INTERVAL=2;BYDAY=TU")).toBe("Alle 2 Wochen am Dienstag");
  });

  it("fasst Werktage und Wochenende zusammen, statt sie aufzuzählen", () => {
    expect(describeRecurrence("FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR")).toBe("Werktags");
    expect(describeRecurrence("FREQ=WEEKLY;BYDAY=SA,SU")).toBe("Am Wochenende");
  });

  it("zählt eine eigene Tagesauswahl auf – dafür gibt es kein Wort", () => {
    expect(describeRecurrence("FREQ=WEEKLY;BYDAY=MO,WE")).toBe("Montag, Mittwoch");
  });

  it("benennt Monatsregeln", () => {
    expect(describeRecurrence("FREQ=MONTHLY;BYDAY=-1FR")).toBe("Letzter Freitag im Monat");
    expect(describeRecurrence("FREQ=MONTHLY;BYDAY=2MO")).toBe("2. Montag im Monat");
    expect(describeRecurrence("FREQ=MONTHLY;BYMONTHDAY=15")).toBe("Am 15. jedes Monats");
  });

  it("hängt Enden hinten an, wie beim „wenn erledigt“-Zusatz", () => {
    expect(describeRecurrence("FREQ=WEEKLY;COUNT=3")).toBe("Wöchentlich · noch 3-mal");
    expect(describeRecurrence("FREQ=WEEKLY;UNTIL=20261231T000000Z")).toContain("Wöchentlich · bis ");
  });

  it("versteht auch die alte Schreibweise – für Notizen vor der Umstellung", () => {
    expect(describeRecurrence("every day")).toBe("Täglich");
    expect(describeRecurrence("every 5 days")).toBe("Alle 5 Tage");
  });

  it("zeigt den ROHTEXT, wo wir nichts benennen können – keine hübsche Näherung", () => {
    // Wer so etwas schreibt, soll sehen, was wirklich in der Datei steht.
    expect(describeRecurrence("manchmal")).toBe("manchmal");
    expect(describeRecurrence("FREQ=HOURLY")).toBe("FREQ=HOURLY");
    const exotisch = "FREQ=MONTHLY;BYDAY=MO,TU;BYSETPOS=2";
    expect(describeRecurrence(exotisch)).toBe(exotisch);
  });
});
