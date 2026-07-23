import { describe, it, expect } from "vitest";
import { buildFrontmatter } from "../src/taskService";

// Der Duplizieren-Unterbaum verlässt sich auf genau diese zwei Eigenschaften: ein gesetztes
// sort_order landet im Frontmatter (Reihenfolge der Kopien bleibt erhalten), ein fehlendes/leeres
// bleibt weg (frisch angelegte Aufgaben sind weiterhin „lazy", ohne Positionsfeld).
describe("buildFrontmatter – sort_order materialisieren vs. lazy", () => {
  it("schreibt sort_order, wenn ein Zahlenwert gesetzt ist", () => {
    const fm = buildFrontmatter({ type: "task", sort_order: 20 });
    expect(fm).toContain("sort_order: 20");
  });

  it("lässt sort_order weg, wenn es null ist (lazy, kein Feld)", () => {
    const fm = buildFrontmatter({ type: "task", sort_order: null });
    expect(fm).not.toContain("sort_order");
  });
});
