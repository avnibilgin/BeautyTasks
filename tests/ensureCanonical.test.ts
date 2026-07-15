import { describe, it, expect } from "vitest";
import { ensureCanonicalFm } from "../src/taskService";

describe("ensureCanonicalFm – Kanon-Felder für handgeschriebene Aufgaben", () => {
  it("trägt id und created nach, wenn sie fehlen", () => {
    const fm: Record<string, unknown> = { type: "task" };
    ensureCanonicalFm(fm);
    expect(typeof fm.id).toBe("string");
    expect((fm.id as string).length).toBeGreaterThan(0);
    expect(fm.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("ist idempotent: vorhandene id und created bleiben unangetastet", () => {
    const fm: Record<string, unknown> = { type: "task", id: "t-fest", created: "2020-01-01" };
    ensureCanonicalFm(fm);
    expect(fm.id).toBe("t-fest");
    expect(fm.created).toBe("2020-01-01");
  });

  it("rührt status und project NICHT an (fehlendes project = Eingang)", () => {
    const fm: Record<string, unknown> = { type: "task" };
    ensureCanonicalFm(fm);
    expect("status" in fm).toBe(false);
    expect("project" in fm).toBe(false);
  });

  it("ersetzt leere id/created", () => {
    const fm: Record<string, unknown> = { type: "task", id: "", created: "" };
    ensureCanonicalFm(fm);
    expect(fm.id).not.toBe("");
    expect(fm.created).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});
