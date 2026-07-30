import { describe, it, expect } from "vitest";
import { isUnderFolder } from "../src/taskService";

describe("isUnderFolder – Ordner-Zugehörigkeit (Ausschluss-Ordner + Herkunft der Titel-Migration)", () => {
  it("erkennt Notizen im Ordner und in Unterordnern", () => {
    expect(isUnderFolder("BeautyTasks/Items/Blogpost.md", "BeautyTasks/Items")).toBe(true);
    expect(isUnderFolder("BeautyTasks/Items/2026/Blogpost.md", "BeautyTasks/Items")).toBe(true);
  });

  it("greift NICHT bei einem nur namensgleichen Anfang", () => {
    expect(isUnderFolder("BeautyTasks/ItemsAlt/Blogpost.md", "BeautyTasks/Items")).toBe(false);
    expect(isUnderFolder("Andere/BeautyTasks/Items/Blogpost.md", "BeautyTasks/Items")).toBe(false);
  });

  it("erkennt Notizen außerhalb – die hat BeautyTasks nicht angelegt", () => {
    expect(isUnderFolder("Projekte/Meeting.md", "BeautyTasks/Items")).toBe(false);
    expect(isUnderFolder("Blogpost.md", "BeautyTasks/Items")).toBe(false);
  });

  it("verträgt Schrägstrich am Ende und Leerraum", () => {
    expect(isUnderFolder("BeautyTasks/Items/A.md", "BeautyTasks/Items/")).toBe(true);
    expect(isUnderFolder("BeautyTasks/Items/A.md", "  BeautyTasks/Items  ")).toBe(true);
  });

  it("ein leerer oder wurzelnaher Ordner trifft NIE – sonst gälte der halbe Vault als eigen", () => {
    expect(isUnderFolder("BeautyTasks/Items/A.md", "")).toBe(false);
    expect(isUnderFolder("BeautyTasks/Items/A.md", "   ")).toBe(false);
    expect(isUnderFolder("BeautyTasks/Items/A.md", ".")).toBe(false);
    expect(isUnderFolder("BeautyTasks/Items/A.md", "/")).toBe(false);
  });

  it("der Ordner selbst zählt mit (für die Ausschluss-Prüfung)", () => {
    expect(isUnderFolder("Archiv", "Archiv")).toBe(true);
  });
});
