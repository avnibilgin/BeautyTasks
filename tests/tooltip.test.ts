import { describe, it, expect } from "vitest";
import { isClipped } from "../src/tooltip";

/** Bequemer Aufbau: nur nennen, was der jeweilige Fall braucht. */
const m = (o: Partial<{ scrollWidth: number; clientWidth: number; scrollHeight: number; clientHeight: number }>) =>
  ({ scrollWidth: 100, clientWidth: 100, scrollHeight: 20, clientHeight: 20, ...o });

describe("isClipped", () => {
  it("erkennt einen waagerecht abgeschnittenen Text", () => {
    expect(isClipped(m({ scrollWidth: 240, clientWidth: 120 }))).toBe(true);
  });

  it("erkennt einen senkrecht gedeckelten Text", () => {
    expect(isClipped(m({ scrollHeight: 60, clientHeight: 20 }))).toBe(true);
  });

  it("meldet nichts, wenn der Text vollständig sichtbar ist", () => {
    expect(isClipped(m({}))).toBe(false);
  });

  // Der Grund für die Toleranz: scrollWidth und clientWidth sind gerundete Ganzzahlen. Bei
  // fraktionaler Displayskalierung gehen sie regelmäßig um genau eins auseinander – ohne
  // Toleranz erschiene ein Tooltip über einem vollständig lesbaren Namen.
  it("hält eine Abweichung von einem Pixel für Rundung, nicht für Kürzung", () => {
    expect(isClipped(m({ scrollWidth: 121, clientWidth: 120 }))).toBe(false);
    expect(isClipped(m({ scrollHeight: 21, clientHeight: 20 }))).toBe(false);
  });

  it("schlägt ab zwei Pixeln an", () => {
    expect(isClipped(m({ scrollWidth: 122, clientWidth: 120 }))).toBe(true);
  });

  // Ein Element, das breiter gezeichnet ist als sein Inhalt, ist nicht „negativ gekürzt".
  it("wertet einen Überhang in die andere Richtung nicht als Kürzung", () => {
    expect(isClipped(m({ scrollWidth: 80, clientWidth: 120 }))).toBe(false);
  });
});
