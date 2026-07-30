import { describe, it, expect } from "vitest";
import { fmTitle, resolveTitle, firstH1, titleTarget, findH1Line, findH1LineInBody, replaceHeadingLine, titleToStore, dropHeadingLine, newTaskBody } from "../src/taskTitle";

const fm = (yaml: string): string => "---\n" + yaml + "\n---\n";

describe("fmTitle – Stufe 1 der Kaskade", () => {
  it("nimmt Strings (getrimmt)", () => {
    expect(fmTitle("  Blogpost schreiben  ")).toBe("Blogpost schreiben");
  });
  it("nimmt Zahlen (YAML liefert bei `title: 2026` keine Zeichenkette)", () => {
    expect(fmTitle(2026)).toBe("2026");
  });
  it("verwirft Leeres und Nicht-Skalares", () => {
    expect(fmTitle("")).toBeNull();
    expect(fmTitle("   ")).toBeNull();
    expect(fmTitle(undefined)).toBeNull();
    expect(fmTitle(null)).toBeNull();
    expect(fmTitle(["a"])).toBeNull();
    expect(fmTitle({ a: 1 })).toBeNull();
  });
});

describe("resolveTitle – die Kaskade", () => {
  it("Frontmatter gewinnt vor Überschrift und Dateiname", () => {
    expect(resolveTitle("Aus dem Frontmatter", "Aus der H1", "Dateiname")).toBe("Aus dem Frontmatter");
  });
  it("ohne Frontmatter-Titel gilt die H1", () => {
    expect(resolveTitle(null, "Aus der H1", "Dateiname")).toBe("Aus der H1");
  });
  it("ohne H1 bleibt der Dateiname", () => {
    expect(resolveTitle(null, undefined, "Dateiname")).toBe("Dateiname");
    expect(resolveTitle(null, "   ", "Dateiname")).toBe("Dateiname");
  });
});

describe("firstH1 – nur Ebene 1 zählt", () => {
  it("findet die H1 auch hinter tieferen Überschriften", () => {
    expect(firstH1([{ heading: "Topic", level: 2 }, { heading: "Echter Titel", level: 1 }])).toBe("Echter Titel");
  });
  it("liefert undefined, wenn es nur tiefere Ebenen gibt", () => {
    expect(firstH1([{ heading: "Topic", level: 2 }, { heading: "Detail", level: 3 }])).toBeUndefined();
    expect(firstH1(undefined)).toBeUndefined();
  });
});

describe("titleTarget – wohin eine Titeländerung gehört", () => {
  it("Frontmatter, wenn dort schon ein Titel steht (der Body bleibt unberührt)", () => {
    expect(titleTarget(true, 4)).toBe("frontmatter");
  });
  it("H1, wenn es eine gibt und kein title: gesetzt ist", () => {
    expect(titleTarget(false, 4)).toBe("heading");
  });
  it("Frontmatter, wenn es gar keine H1 gibt – statt die Änderung zu verlieren", () => {
    expect(titleTarget(false, null)).toBe("frontmatter");
  });
});

describe("findH1Line – fence-sicher und frontmatter-sicher", () => {
  it("findet die H1 hinter dem Frontmatter", () => {
    expect(findH1Line(fm("type: task") + "\n# Titel\n\nText")).toBe(4);
  });
  it("ignoriert eine `#`-Zeile im Code-Block", () => {
    const c = fm("type: task") + "\n```bash\n# kein Titel, ein Kommentar\n```\n";
    expect(findH1Line(c)).toBeNull();
  });
  it("findet die echte H1 NACH einem Code-Block", () => {
    const c = fm("type: task") + "\n```\n# Kommentar\n```\n\n# Echter Titel\n";
    expect(findH1Line(c)).toBe(8);
  });
  it("ignoriert tiefere Überschriften", () => {
    expect(findH1Line(fm("type: task") + "\n## Topic\n\n### Detail\n")).toBeNull();
  });
  it("ignoriert `#` ohne Text und Raute-Ketten ohne Leerzeichen", () => {
    expect(findH1Line(fm("type: task") + "\n#\n#tag\n")).toBeNull();
  });
  it("liest ein `---` im Body NICHT als Frontmatter (kein Frontmatter am Anfang)", () => {
    expect(findH1Line("---\n\n# Titel\n")).toBeNull();   // unabgeschlossenes Frontmatter -> keine H1
    expect(findH1Line("# Titel\n\n---\n\n# Zweiter\n")).toBe(0);
  });
  it("findH1LineInBody rechnet ohne Frontmatter (führendes `---` ist eine Trennlinie)", () => {
    expect(findH1LineInBody("---\n\n# Titel\n")).toBe(2);
  });
});

describe("replaceHeadingLine – genau eine Zeile", () => {
  it("ersetzt die Zielzeile und lässt alles andere in Ruhe", () => {
    const c = fm("type: task") + "\n# Alt\n\nText mit # Raute\n";
    expect(replaceHeadingLine(c, 4, "Neu")).toBe(fm("type: task") + "\n# Neu\n\nText mit # Raute\n");
  });
  it("behält die Überschriftenebene bei", () => {
    expect(replaceHeadingLine("## Alt\n", 0, "Neu")).toBe("## Neu\n");
  });
  it("gibt null zurück, wenn die Zeile keine Überschrift (mehr) ist", () => {
    expect(replaceHeadingLine("Kein Titel\n", 0, "Neu")).toBeNull();
    expect(replaceHeadingLine("# Titel\n", 99, "Neu")).toBeNull();
    expect(replaceHeadingLine("# Titel\n", -1, "Neu")).toBeNull();
  });
});

describe("newTaskBody – neue Notiz bekommt den Titel an genau einer Stelle", () => {
  it("ohne Frontmatter-Titel: Ueberschrift im Body (Vorgabe fuer neue Aufgaben)", () => {
    expect(newTaskBody("Blogpost schreiben", false)).toBe("\n# Blogpost schreiben\n");
  });
  it("mit Frontmatter-Titel: KEINE Überschrift (sonst stünde der Titel doppelt)", () => {
    expect(newTaskBody("Blogpost schreiben", true)).toBe("\n");
  });
});

describe("titleToStore – Migration ins Frontmatter, ohne dass sich ein Titel ändert", () => {
  const h = (heading: string, level: number) => ({ heading, level });
  it("nimmt den Text der H1 und lässt sie danach aus dem Body entfernen", () => {
    expect(titleToStore(undefined, [h("Blogpost", 1)], "Blogpost")).toEqual({ title: "Blogpost", dropH1: true });
  });
  it("nimmt bei tieferer erster Überschrift deren Text – entfernt sie aber NICHT", () => {
    expect(titleToStore(undefined, [h("Topic", 2), h("Später", 1)], "Meeting")).toEqual({ title: "Topic", dropH1: false });
  });
  it("nimmt ohne Überschrift den Dateinamen", () => {
    expect(titleToStore(undefined, [], "Meine Notiz")).toEqual({ title: "Meine Notiz", dropH1: false });
    expect(titleToStore(undefined, undefined, "Meine Notiz")).toEqual({ title: "Meine Notiz", dropH1: false });
  });
  it("fasst Notizen mit vorhandenem title: gar nicht erst an – und ist damit idempotent", () => {
    expect(titleToStore("Schon gesetzt", [h("Blogpost", 1)], "Blogpost")).toBeNull();
    const plan = titleToStore(undefined, [h("Blogpost", 1)], "Blogpost");
    expect(titleToStore(plan!.title, [h("Blogpost", 1)], "Blogpost")).toBeNull();
  });
});

describe("dropHeadingLine – entfernt nur die echte Titel-Zeile", () => {
  const FM = "---\ntype: task\n---\n";
  it("entfernt die H1 samt folgender Leerzeile – Ergebnis wie bei einer neuen Notiz", () => {
    const c = FM + "\n# Blogpost\n\nBeschreibung\n";
    expect(dropHeadingLine(c, 4, "Blogpost")).toBe(FM + "\nBeschreibung\n");
  });
  it("räumt eine Notiz, die nur aus der Titelzeile bestand, vollständig ab", () => {
    const c = FM + "\n# Blogpost\n";
    expect(dropHeadingLine(c, 4, "Blogpost")).toBe(FM);   // nur noch Frontmatter
  });
  it("lässt die Zeile stehen, wenn sie einen ANDEREN Text trägt (Überschrift des Nutzers)", () => {
    const c = FM + "\n# Ganz was anderes\n\nText\n";
    expect(dropHeadingLine(c, 4, "Blogpost")).toBe(c);
  });
  it("tut nichts ohne Zeile und nichts bei einer Nicht-Überschrift", () => {
    const c = FM + "\nKein Titel\n";
    expect(dropHeadingLine(c, null, "Blogpost")).toBe(c);
    expect(dropHeadingLine(c, 4, "Blogpost")).toBe(c);
  });
});
