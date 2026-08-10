import { describe, it, expect } from "vitest";
import { TFile } from "obsidian";
import { TaskIndex } from "../src/taskIndex";
import { DEFAULT_SETTINGS, BeautyTasksSettings } from "../src/types";

/**
 * `children()` / `descendants()` – die Eltern-Beziehung des Index.
 *
 * Der Grund für diese Tests: `children()` war ein Vollscan über alle Aufgaben und wird je
 * gezeichneter Zeile mehrfach gerufen. Als gruppierte Map ist der Zugriff O(1) – aber eine Map
 * kann VERALTEN, ein Vollscan nicht. Deshalb prüft hier jeder Test nicht nur das Ergebnis,
 * sondern auch, dass es nach einer Änderung sofort stimmt: hinzugefügt, umgehängt, gelöscht.
 */

// TaskIndex meldet über `window.setTimeout` (Obsidian-Linter erzwingt das, s. timer-Regel).
// Unter environment: "node" gibt es kein window – hier eines auslegen.
(globalThis as unknown as { window: unknown }).window = globalThis;

interface Datei extends TFile { path: string; basename: string; extension: string; fm: Record<string, unknown> | null }

/** Echte TFile-Instanz: die vault-Handler (delete/rename) prüfen `instanceof TFile`. */
const datei = (path: string, fm: Record<string, unknown> | null): Datei =>
  Object.assign(new TFile(), {
    path, basename: path.split("/").pop()!.replace(/\.md$/, ""), extension: "md", fm,
  }) as Datei;

/** Aufgabe mit optionalem Eltern-Verweis – geschrieben wie im Vault, als Wikilink. */
const aufgabe = (parent?: string, extra: Record<string, unknown> = {}) =>
  ({ type: "task", status: "todo", ...(parent ? { parent: `[[${parent}]]` } : {}), ...extra });

function fakeApp(dateien: Datei[]) {
  const kanaele = new Map<string, ((...a: never[]) => void)[]>();
  const on = (kanal: string, cb: (...a: never[]) => void) => {
    if (!kanaele.has(kanal)) kanaele.set(kanal, []);
    kanaele.get(kanal)!.push(cb);
    return { kanal, cb };
  };
  const finde = (f: { path: string }) => dateien.find((d) => d.path === f.path);
  const app = {
    vault: {
      getMarkdownFiles: () => dateien,
      cachedRead: () => Promise.resolve(""),
      on: (n: string, cb: (...a: never[]) => void) => on("vault:" + n, cb),
      offref: () => { /* für diese Tests unerheblich */ },
    },
    metadataCache: {
      getFileCache: (f: { path: string }) => (finde(f)?.fm ? { frontmatter: finde(f)!.fm } : null),
      // Auflösung über den Basenamen – genau wie Obsidian einen kurzen Wikilink auflöst.
      getFirstLinkpathDest: (link: string) =>
        dateien.find((d) => d.basename === link.replace(/\.md$/, "")) ?? null,
      on: (n: string, cb: (...a: never[]) => void) => on("mc:" + n, cb),
      offref: () => { /* s. o. */ },
    },
  };
  return {
    app,
    feuern: (kanal: string, ...args: unknown[]) =>
      [...(kanaele.get(kanal) ?? [])].forEach((cb) => (cb as (...a: unknown[]) => void)(...args)),
  };
}

const neuerIndex = (dateien: Datei[]) => {
  const w = fakeApp(dateien);
  const settings = { ...DEFAULT_SETTINGS, excludeFolders: [] } as BeautyTasksSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const index = new TaskIndex(w.app as any, () => settings);
  index.build();
  return { ...w, index };
};

const pfade = (ts: { path: string }[]): string[] => ts.map((t) => t.path);

describe("TaskIndex.children", () => {
  it("liefert die direkten Unteraufgaben – nicht die Enkel", () => {
    const { index } = neuerIndex([
      datei("Items/wurzel.md", aufgabe()),
      datei("Items/kind-a.md", aufgabe("wurzel")),
      datei("Items/kind-b.md", aufgabe("wurzel")),
      datei("Items/enkel.md", aufgabe("kind-a")),
    ]);
    expect(pfade(index.children("Items/wurzel.md"))).toEqual(["Items/kind-a.md", "Items/kind-b.md"]);
    expect(pfade(index.children("Items/kind-a.md"))).toEqual(["Items/enkel.md"]);
  });

  it("liefert für eine Aufgabe ohne Kinder eine leere Liste", () => {
    const { index } = neuerIndex([datei("Items/allein.md", aufgabe())]);
    expect(index.children("Items/allein.md")).toEqual([]);
    expect(index.children("Items/gibt-es-nicht.md")).toEqual([]);
  });

  it("zählt JEDEN Status mit – Filtern ist Sache der Aufrufer (Badge, Papierkorb)", () => {
    const { index } = neuerIndex([
      datei("Items/wurzel.md", aufgabe()),
      datei("Items/offen.md", aufgabe("wurzel")),
      datei("Items/fertig.md", aufgabe("wurzel", { status: "done" })),
      datei("Items/weg.md", aufgabe("wurzel", { status: "cancelled" })),
    ]);
    expect(index.children("Items/wurzel.md")).toHaveLength(3);
  });

  it("behält die Reihenfolge des Index bei (Einfügereihenfolge, wie beim früheren Vollscan)", () => {
    const { index } = neuerIndex([
      datei("Items/wurzel.md", aufgabe()),
      datei("Items/z.md", aufgabe("wurzel")),
      datei("Items/a.md", aufgabe("wurzel")),
      datei("Items/m.md", aufgabe("wurzel")),
    ]);
    expect(pfade(index.children("Items/wurzel.md"))).toEqual(["Items/z.md", "Items/a.md", "Items/m.md"]);
  });
});

describe("TaskIndex.children – die Gruppierung darf nicht veralten", () => {
  it("kennt eine neu hinzugekommene Unteraufgabe sofort", () => {
    const dateien = [datei("Items/wurzel.md", aufgabe())];
    const { index, feuern } = neuerIndex(dateien);
    expect(index.children("Items/wurzel.md")).toHaveLength(0);   // Cache füllen …

    const neu = datei("Items/kind.md", aufgabe("wurzel"));
    dateien.push(neu);
    feuern("mc:changed", neu);
    expect(pfade(index.children("Items/wurzel.md"))).toEqual(["Items/kind.md"]);
  });

  it("hängt eine Unteraufgabe um, wenn ihr Eltern-Verweis wechselt", () => {
    const dateien = [
      datei("Items/alt.md", aufgabe()),
      datei("Items/neu.md", aufgabe()),
      datei("Items/kind.md", aufgabe("alt")),
    ];
    const { index, feuern } = neuerIndex(dateien);
    expect(index.children("Items/alt.md")).toHaveLength(1);

    dateien[2].fm = aufgabe("neu");
    feuern("mc:changed", dateien[2]);
    expect(index.children("Items/alt.md")).toEqual([]);
    expect(pfade(index.children("Items/neu.md"))).toEqual(["Items/kind.md"]);
  });

  it("löst den Verweis, wenn die Unteraufgabe keine Aufgabe mehr ist", () => {
    const dateien = [datei("Items/wurzel.md", aufgabe()), datei("Items/kind.md", aufgabe("wurzel"))];
    const { index, feuern } = neuerIndex(dateien);
    expect(index.children("Items/wurzel.md")).toHaveLength(1);

    dateien[1].fm = { type: "note" };   // `type` weg -> keine Aufgabe mehr
    feuern("mc:changed", dateien[1]);
    expect(index.children("Items/wurzel.md")).toEqual([]);
  });

  it("vergisst eine gelöschte Unteraufgabe", () => {
    const dateien = [datei("Items/wurzel.md", aufgabe()), datei("Items/kind.md", aufgabe("wurzel"))];
    const { index, feuern } = neuerIndex(dateien);
    expect(index.children("Items/wurzel.md")).toHaveLength(1);

    dateien.splice(1, 1);
    feuern("vault:delete", datei("Items/kind.md", null));
    expect(index.children("Items/wurzel.md")).toEqual([]);
  });

  it("macht aus einer Unteraufgabe eine Hauptaufgabe, wenn der Elter gelöscht wird", () => {
    // severReferences kappt den Verweis im Index sofort – sonst bliebe das Kind an einem Pfad
    // hängen, den es nicht mehr gibt (s. delete-Handler in TaskIndex).
    const dateien = [datei("Items/wurzel.md", aufgabe()), datei("Items/kind.md", aufgabe("wurzel"))];
    const { index, feuern } = neuerIndex(dateien);
    expect(index.children("Items/wurzel.md")).toHaveLength(1);

    dateien.splice(0, 1);
    feuern("vault:delete", datei("Items/wurzel.md", null));
    expect(index.children("Items/wurzel.md")).toEqual([]);
    expect(index.get("Items/kind.md")?.parent).toBeNull();
  });
});

describe("TaskIndex.descendants", () => {
  it("sammelt alle Ebenen unterhalb einer Aufgabe", () => {
    const { index } = neuerIndex([
      datei("Items/wurzel.md", aufgabe()),
      datei("Items/kind.md", aufgabe("wurzel")),
      datei("Items/enkel.md", aufgabe("kind")),
      datei("Items/urenkel.md", aufgabe("enkel")),
      datei("Items/fremd.md", aufgabe()),
    ]);
    expect(pfade(index.descendants("Items/wurzel.md")).sort())
      .toEqual(["Items/enkel.md", "Items/kind.md", "Items/urenkel.md"]);
    expect(index.descendants("Items/fremd.md")).toEqual([]);
  });
});
