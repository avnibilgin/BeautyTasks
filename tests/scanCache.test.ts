import { describe, it, expect } from "vitest";
import { App, TFile } from "obsidian";
import { ScanCache, clearScanCaches, noteScanChanged, noteScanGone } from "../src/scanCache";

/**
 * Das Gemerkte darf NIE hinter der Wahrheit zurückbleiben.
 *
 * Ein gemerkter Vault-Durchlauf spart die 99 % Fälle, in denen sich nichts geändert hat – aber
 * wenn er einen der übrigen 1 % verschläft, sieht der Nutzer ein Projekt in der Seitenleiste, das
 * es nicht mehr gibt (oder sein neues gar nicht). Das ist die einzige Fehlerklasse, die dieses
 * Modul überhaupt einführen kann, und deshalb steht sie hier vollständig.
 *
 * Die Gegenrichtung ist genauso wichtig: Eine ganz normale Aufgaben-Änderung darf das Gemerkte
 * NICHT verwerfen. Täte sie es, wäre die ganze Übung umsonst.
 */

interface Datei { path: string; basename: string; fm: Record<string, unknown> | null }

const datei = (path: string, fm: Record<string, unknown> | null): Datei =>
  ({ path, basename: path.split("/").pop()!.replace(/\.md$/, ""), fm });

/** Fake-App plus Zähler: Nur so lässt sich prüfen, ob wirklich NICHT gerechnet wurde. */
function aufbau(dateien: Datei[]) {
  const app = {
    vault: { getMarkdownFiles: () => dateien },
    metadataCache: { getFileCache: (f: { path: string }) => { const d = dateien.find((x) => x.path === f.path); return d?.fm ? { frontmatter: d.fm } : null; } },
  } as unknown as App;

  let laeufe = 0;
  const cache = new ScanCache<{ path: string; name: string }>(
    (ty) => ty === "project" || ty === "area",
    (a) => {
      laeufe++;
      return a.vault.getMarkdownFiles().flatMap((f) => {
        const ty = a.metadataCache.getFileCache(f)?.frontmatter?.type;
        return ty === "project" || ty === "area" ? [{ path: f.path, name: (f as unknown as Datei).basename }] : [];
      });
    },
  );
  // Die Datei-Objekte des Fakes reichen als TFile: ScanCache liest nur `path`.
  const alsDatei = (path: string): TFile => dateien.find((d) => d.path === path) as unknown as TFile;
  return { app, cache, alsDatei, dateien, laeufe: () => laeufe };
}

const PROJEKT = { type: "project" };
const AUFGABE = { type: "task", status: "todo" };

const start = () => aufbau([
  datei("Projects/Haus.md", PROJEKT),
  datei("Projects/Garten.md", { type: "area" }),
  datei("Items/a.md", AUFGABE),
  datei("Notizen/Rezept.md", null),
]);

describe("ScanCache – wann gerechnet wird", () => {
  it("rechnet erst beim ersten Fragen, danach gar nicht mehr", () => {
    const { app, cache, laeufe } = start();
    expect(laeufe()).toBe(0);            // Anlegen allein kostet nichts
    expect(cache.get(app)).toHaveLength(2);
    expect(laeufe()).toBe(1);
    cache.get(app); cache.get(app); cache.get(app);
    expect(laeufe()).toBe(1);            // genau EIN Durchlauf für vier Fragen
  });

  it("rechnet nach dem Verwerfen genau einmal neu", () => {
    const { app, cache, laeufe } = start();
    cache.get(app);
    cache.clear();
    cache.get(app); cache.get(app);
    expect(laeufe()).toBe(2);
  });
});

describe("ScanCache – was das Gemerkte stehen lässt", () => {
  it("lässt eine Aufgaben-Änderung stehen (der Normalfall bei jedem Häkchen)", () => {
    const { app, cache, alsDatei, laeufe } = start();
    cache.get(app);
    cache.changed(app, alsDatei("Items/a.md"));
    cache.get(app);
    expect(laeufe()).toBe(1);
  });

  it("lässt eine fremde Notiz ohne Typ stehen", () => {
    const { app, cache, alsDatei, laeufe } = start();
    cache.get(app);
    cache.changed(app, alsDatei("Notizen/Rezept.md"));
    cache.get(app);
    expect(laeufe()).toBe(1);
  });

  it("lässt eine gelöschte Aufgabe stehen", () => {
    const { app, cache, laeufe } = start();
    cache.get(app);
    cache.gone("Items/a.md");
    cache.get(app);
    expect(laeufe()).toBe(1);
  });

  it("rechnet nicht, solange gar nichts gemerkt ist", () => {
    const { app, cache, alsDatei, laeufe } = start();
    cache.changed(app, alsDatei("Projects/Haus.md"));   // nichts gemerkt -> nichts zu tun
    cache.gone("Projects/Haus.md");
    expect(laeufe()).toBe(0);
  });
});

describe("ScanCache – was das Gemerkte verwirft", () => {
  it("verwirft, wenn sich eine gemerkte Notiz ändert (Farbe, Name, Archiv-Status …)", () => {
    const { app, cache, alsDatei, laeufe } = start();
    cache.get(app);
    cache.changed(app, alsDatei("Projects/Haus.md"));
    cache.get(app);
    expect(laeufe()).toBe(2);
  });

  it("verwirft, wenn eine fremde Notiz gerade ein Projekt geworden ist", () => {
    const { app, cache, alsDatei, dateien, laeufe } = start();
    expect(cache.get(app)).toHaveLength(2);
    dateien.find((d) => d.path === "Notizen/Rezept.md")!.fm = PROJEKT;
    cache.changed(app, alsDatei("Notizen/Rezept.md"));
    expect(cache.get(app)).toHaveLength(3);
    expect(laeufe()).toBe(2);
  });

  it("verwirft, wenn eine gemerkte Notiz aufhört, ein Projekt zu sein", () => {
    // Der Fall, den eine reine Typ-Prüfung verschliefe: Der Typ ist WEG, also greift `owns`
    // nicht mehr – gerettet wird es allein dadurch, dass der Pfad noch im Gemerkten steht.
    const { app, cache, alsDatei, dateien } = start();
    expect(cache.get(app)).toHaveLength(2);
    dateien.find((d) => d.path === "Projects/Haus.md")!.fm = { type: "note" };
    cache.changed(app, alsDatei("Projects/Haus.md"));
    expect(cache.get(app)).toHaveLength(1);
  });

  it("verwirft, wenn eine gemerkte Notiz gelöscht wird", () => {
    const { app, cache, dateien } = start();
    expect(cache.get(app)).toHaveLength(2);
    dateien.splice(dateien.findIndex((d) => d.path === "Projects/Garten.md"), 1);
    cache.gone("Projects/Garten.md");
    expect(cache.get(app)).toHaveLength(1);
  });

  it("verwirft beim Umbenennen über den ALTEN Pfad", () => {
    // Beim Umbenennen ist der neue Name auch der neue Anzeigename – bliebe das Gemerkte stehen,
    // stünde in der Seitenleiste weiter der alte.
    const { app, cache, dateien } = start();
    expect(cache.get(app).map((p) => p.name)).toContain("Haus");
    const d = dateien.find((x) => x.path === "Projects/Haus.md")!;
    d.path = "Projects/Haus alt.md"; d.basename = "Haus alt";
    cache.gone("Projects/Haus.md");
    expect(cache.get(app).map((p) => p.name)).toContain("Haus alt");
  });
});

describe("ScanCache – die Sammel-Werkzeuge", () => {
  it("clearScanCaches verwirft ohne Einzelprüfung (Feldnamen-Wechsel, Import, neue Notiz)", () => {
    const { app, cache, laeufe } = start();
    cache.get(app);
    clearScanCaches();
    cache.get(app);
    expect(laeufe()).toBe(2);
  });

  it("noteScanChanged/-Gone erreichen jeden angelegten Durchlauf", () => {
    const a = start(); const b = start();
    a.cache.get(a.app); b.cache.get(b.app);
    noteScanChanged(a.app, a.alsDatei("Projects/Haus.md"));
    a.cache.get(a.app); b.cache.get(b.app);
    expect(a.laeufe()).toBe(2);
    expect(b.laeufe()).toBe(2);   // gleicher Pfad, eigener Cache – auch der wird erreicht

    noteScanGone("Projects/Garten.md");
    a.cache.get(a.app); b.cache.get(b.app);
    expect(a.laeufe()).toBe(3);
    expect(b.laeufe()).toBe(3);
  });
});
