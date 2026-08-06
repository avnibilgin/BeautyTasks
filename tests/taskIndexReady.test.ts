import { describe, it, expect } from "vitest";
import { TaskIndex } from "../src/taskIndex";
import { DEFAULT_SETTINGS, BeautyTasksSettings } from "../src/types";

/**
 * Der Startzustand des Index – die Ursache dafür, dass die Seitenleiste beim Start „+ Label
 * erstellen" anbot, obwohl der Vault voller Labels war (1.39.0 und früher).
 *
 * Der Kern ist die Unterscheidung LEER vs. UNBEKANNT: Bis der Index einmal stand, heißt „keine
 * Aufgabe mit diesem Label" nicht „gibt es nicht", sondern „noch nicht nachgesehen". Wer daraus
 * einen Leer-Zustand ableitet, zeigt dem Nutzer einen frischen Vault.
 */

// TaskIndex meldet über `window.setTimeout` (Obsidian-Linter erzwingt das, s. timer-Regel).
// Unter environment: "node" gibt es kein window – hier eines auslegen.
(globalThis as unknown as { window: unknown }).window = globalThis;

interface Datei { path: string; basename: string; extension: string; fm: Record<string, unknown> | null }

const datei = (path: string, fm: Record<string, unknown> | null): Datei =>
  ({ path, basename: path.split("/").pop()!.replace(/\.md$/, ""), extension: "md", fm });

/** Fake-App mit eigener Abo-Buchhaltung: Nur so lässt sich prüfen, ob TaskIndex einen Kanal
 *  MEHRFACH belegt – build() wird im Betrieb mehrmals gerufen (Migrationen, Importe). */
function fakeApp(dateien: Datei[]) {
  const kanaele = new Map<string, ((...a: never[]) => void)[]>();
  const on = (kanal: string, cb: (...a: never[]) => void) => {
    if (!kanaele.has(kanal)) kanaele.set(kanal, []);
    kanaele.get(kanal)!.push(cb);
    return { kanal, cb };
  };
  const offref = (ref: { kanal: string; cb: (...a: never[]) => void }) => {
    const l = kanaele.get(ref.kanal);
    if (l && l.includes(ref.cb)) l.splice(l.indexOf(ref.cb), 1);
  };
  const finde = (f: { path: string }) => dateien.find((d) => d.path === f.path);
  const app = {
    vault: {
      getMarkdownFiles: () => dateien,
      cachedRead: () => Promise.resolve(""),
      on: (n: string, cb: (...a: never[]) => void) => on("vault:" + n, cb),
      offref,
    },
    metadataCache: {
      // Der ENTSCHEIDENDE Schalter: `fm: null` ist ein Vault, dessen Metadaten-Cache noch kalt ist.
      getFileCache: (f: { path: string }) => (finde(f)?.fm ? { frontmatter: finde(f)!.fm } : null),
      getFirstLinkpathDest: () => null,
      on: (n: string, cb: (...a: never[]) => void) => on("mc:" + n, cb),
      offref,
    },
  };
  return {
    app,
    feuern: (kanal: string, ...args: unknown[]) => [...(kanaele.get(kanal) ?? [])].forEach((cb) => (cb as (...a: unknown[]) => void)(...args)),
    abos: (kanal: string) => (kanaele.get(kanal) ?? []).length,
  };
}

const aufgabe = (labels: string[]) => ({ type: "task", status: "todo", labels });
const neuerIndex = (dateien: Datei[]) => {
  const w = fakeApp(dateien);
  const settings = { ...DEFAULT_SETTINGS, excludeFolders: [] } as BeautyTasksSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { ...w, index: new TaskIndex(w.app as any, () => settings) };
};

describe("TaskIndex.ready – leer vs. noch nicht nachgesehen", () => {
  it("ist vor dem ersten Aufbau false, danach true", () => {
    const { index } = neuerIndex([datei("Items/a.md", aufgabe(["health"]))]);
    expect(index.ready).toBe(false);   // NICHT „dieser Vault hat keine Labels"
    index.build();
    expect(index.ready).toBe(true);
  });

  it("ohne Aufbau kennt der Index kein einziges Label – die Aufgaben liegen längst da", () => {
    const { index } = neuerIndex([datei("Items/a.md", aufgabe(["health", "errands"]))]);
    expect(index.all()).toEqual([]);          // genau der Zustand, den die Seitenleiste sah
    index.build();
    expect(index.all()).toHaveLength(1);
    expect(index.byLabel("health")).toHaveLength(1);
  });
});

describe("Kalter Metadaten-Cache", () => {
  it("holt der Index nach, sobald Obsidian das Ende des Indizierens meldet", () => {
    const dateien = [datei("Items/a.md", null)];   // Cache noch kalt: kein Frontmatter zu holen
    const { index, feuern } = neuerIndex(dateien);
    index.build();
    expect(index.all()).toEqual([]);   // onLayoutReady sagt nichts über den Cache-Stand

    dateien[0].fm = aufgabe(["health"]);   // Obsidian ist mit dem Indizieren durch …
    feuern("mc:resolved");                 // … und meldet es
    expect(index.byLabel("health")).toHaveLength(1);
  });

  it("hört danach auf zuzuhören – resolved feuert auch bei jeder späteren Änderung", () => {
    const { index, feuern, abos } = neuerIndex([datei("Items/a.md", aufgabe([]))]);
    index.build();
    expect(abos("mc:resolved")).toBe(1);
    feuern("mc:resolved");
    expect(abos("mc:resolved")).toBe(0);   // einmal nachbauen genügt, sonst Vollscan bei jedem Tippen
  });
});

describe("Mehrfacher Aufbau", () => {
  it("belegt die Kanäle nur EINMAL – build() läuft bei Migrationen und Importen erneut", () => {
    const { index, abos } = neuerIndex([datei("Items/a.md", aufgabe([]))]);
    index.build();
    index.build();
    index.build();
    // Vor dem Fix: 3. Jede Dateiänderung hätte upsert dreimal ausgelöst.
    expect(abos("mc:changed")).toBe(1);
    expect(abos("vault:create")).toBe(1);
    expect(abos("vault:delete")).toBe(1);
    expect(abos("vault:rename")).toBe(1);
  });

  it("baut den Inhalt trotzdem jedes Mal neu auf", () => {
    const dateien = [datei("Items/a.md", aufgabe(["health"]))];
    const { index } = neuerIndex(dateien);
    index.build();
    dateien.push(datei("Items/b.md", aufgabe(["health"])));
    index.build();
    expect(index.byLabel("health")).toHaveLength(2);
  });
});
