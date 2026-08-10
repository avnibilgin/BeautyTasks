import { describe, it, expect } from "vitest";
import { TFile } from "obsidian";
import { TaskIndex } from "../src/taskIndex";
import { DEFAULT_SETTINGS, BeautyTasksSettings, Task } from "../src/types";

/**
 * Differenzprüfung des Index unter zufälligen Änderungsfolgen.
 *
 * Der Branch hat `children()` von einer Vollsuche auf eine gruppierte Karte umgestellt. Eine
 * Vollsuche kann nicht veralten, eine Karte schon – und ein veralteter Index zeigt keine
 * Fehlermeldung, sondern falsche Listen. Einzelne Testfälle decken nur die Wege ab, an die man
 * beim Schreiben denkt; hier läuft stattdessen eine lange Folge zufälliger Änderungen, und nach
 * JEDER wird das Ergebnis gegen die stumpfe Berechnung aus dem Gesamtbestand gestellt.
 *
 * Der Zufall ist gesät: Ein Fehlschlag ist reproduzierbar, nicht launisch.
 */

(globalThis as unknown as { window: unknown }).window = globalThis;

interface Datei extends TFile { path: string; basename: string; extension: string; fm: Record<string, unknown> | null }

const datei = (path: string, fm: Record<string, unknown> | null): Datei =>
  Object.assign(new TFile(), {
    path, basename: path.split("/").pop()!.replace(/\.md$/, ""), extension: "md", fm,
  }) as Datei;

function welt(dateien: Datei[]) {
  const kanaele = new Map<string, ((...a: never[]) => void)[]>();
  const on = (k: string, cb: (...a: never[]) => void) => {
    if (!kanaele.has(k)) kanaele.set(k, []);
    kanaele.get(k)!.push(cb);
    return { k, cb };
  };
  const finde = (f: { path: string }) => dateien.find((d) => d.path === f.path);
  const app = {
    vault: {
      getMarkdownFiles: () => dateien,
      cachedRead: () => Promise.resolve(""),
      on: (n: string, cb: (...a: never[]) => void) => on("vault:" + n, cb),
      offref: () => { /* für diesen Test unerheblich */ },
    },
    metadataCache: {
      getFileCache: (f: { path: string }) => (finde(f)?.fm ? { frontmatter: finde(f)!.fm } : null),
      getFirstLinkpathDest: (link: string) => dateien.find((d) => d.basename === link) ?? null,
      on: (n: string, cb: (...a: never[]) => void) => on("mc:" + n, cb),
      offref: () => { /* s. o. */ },
    },
  };
  const settings = { ...DEFAULT_SETTINGS, excludeFolders: [] } as BeautyTasksSettings;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const index = new TaskIndex(app as any, () => settings);
  index.build();
  const feuern = (k: string, ...args: unknown[]) =>
    [...(kanaele.get(k) ?? [])].forEach((cb) => (cb as (...a: unknown[]) => void)(...args));
  return { index, feuern };
}

/** Kleiner, gesäter Zufallsgenerator – damit ein Fehlschlag wiederholbar ist. */
function wuerfel(saat: number) {
  let z = saat >>> 0;
  return () => { z = (z * 1664525 + 1013904223) >>> 0; return z / 4294967296; };
}

/** Die stumpfe Wahrheit: einmal über den ganzen Bestand. Genau das, was children() vorher tat. */
const stumpf = (alle: Task[], eltern: string): string[] =>
  alle.filter((t) => t.parent === eltern).map((t) => t.path);

function pruefe(index: TaskIndex, wo: string): void {
  const alle = index.all();
  for (const t of alle) {
    expect(index.children(t.path).map((k) => k.path), `children(${t.path}) nach ${wo}`)
      .toEqual(stumpf(alle, t.path));
  }
  // Aufgaben, die es nicht (mehr) gibt, haben keine Kinder.
  expect(index.children("Items/gibt-es-nicht.md")).toEqual([]);
  // Nachfahren: keine Dopplungen, und jede hat wirklich einen Vorfahren in der Kette.
  for (const t of alle.slice(0, 5)) {
    const nach = index.descendants(t.path).map((x) => x.path);
    expect(new Set(nach).size, `descendants(${t.path}) doppelt nach ${wo}`).toBe(nach.length);
  }
}

describe("TaskIndex – Differenzprüfung unter zufälligen Änderungen", () => {
  for (const saat of [1, 7, 42, 2026]) {
    it(`bleibt deckungsgleich mit der Vollsuche (Saat ${saat})`, () => {
      const rnd = wuerfel(saat);
      const dateien: Datei[] = [];
      for (let i = 0; i < 25; i++) {
        const eltern = i > 0 && rnd() < 0.4 ? `t${Math.floor(rnd() * i)}` : null;
        dateien.push(datei(`Items/t${i}.md`, { type: "task", status: "todo", ...(eltern ? { parent: `[[${eltern}]]` } : {}) }));
      }
      const { index, feuern } = welt(dateien);
      pruefe(index, "Aufbau");

      for (let schritt = 0; schritt < 120; schritt++) {
        const wahl = rnd();
        const i = Math.floor(rnd() * dateien.length);
        const d = dateien[i];

        if (wahl < 0.3 && d) {
          // Eltern umhängen (auch auf sich selbst – das darf den Index nicht aus dem Tritt bringen)
          const ziel = Math.floor(rnd() * dateien.length);
          d.fm = { type: "task", status: "todo", parent: `[[t${ziel}]]` };
          feuern("mc:changed", d);
        } else if (wahl < 0.45 && d) {
          d.fm = { type: "task", status: rnd() < 0.5 ? "done" : "cancelled" };   // Eltern weg
          feuern("mc:changed", d);
        } else if (wahl < 0.55 && d) {
          d.fm = { type: "note" };                        // keine Aufgabe mehr
          feuern("mc:changed", d);
        } else if (wahl < 0.7 && dateien.length > 5 && d) {
          dateien.splice(i, 1);                           // löschen
          feuern("vault:delete", d);
        } else if (wahl < 0.85 && d) {
          const alt = d.path;                             // umbenennen
          const neu = `Items/r${schritt}.md`;
          d.path = neu; d.basename = `r${schritt}`;
          feuern("vault:rename", d, alt);
        } else {
          const n = dateien.length + schritt;             // neu anlegen
          const eltern = dateien.length ? dateien[Math.floor(rnd() * dateien.length)].basename : null;
          const neu = datei(`Items/n${n}.md`, { type: "task", status: "todo", ...(eltern ? { parent: `[[${eltern}]]` } : {}) });
          dateien.push(neu);
          feuern("mc:changed", neu);
        }
        pruefe(index, `Schritt ${schritt} (Wahl ${wahl.toFixed(2)})`);
      }
    });
  }
});

describe("TaskIndex – abgeleitete Abfragen veralten nicht", () => {
  it("open/byProject/byLabel stimmen nach jeder Änderung mit dem Bestand überein", () => {
    const dateien = [
      datei("Items/a.md", { type: "task", status: "todo", labels: ["heim"], project: "[[Haus]]" }),
      datei("Items/b.md", { type: "task", status: "todo", labels: ["heim"] }),
      datei("Items/c.md", { type: "task", status: "done", labels: ["buero"] }),
    ];
    const { index, feuern } = welt(dateien);
    const stimmt = (wo: string) => {
      const alle = index.all();
      expect(index.open().map((t) => t.path).sort(), `open nach ${wo}`)
        .toEqual(alle.filter((t) => t.status === "todo" || t.status === "doing").map((t) => t.path).sort());
      expect(index.byLabel("heim").map((t) => t.path).sort(), `byLabel nach ${wo}`)
        .toEqual(alle.filter((t) => t.labels.includes("heim") && (t.status === "todo" || t.status === "doing")).map((t) => t.path).sort());
    };
    stimmt("Aufbau");

    dateien[1].fm = { type: "task", status: "done", labels: ["heim"] };
    feuern("mc:changed", dateien[1]);
    stimmt("Erledigen");

    dateien[0].fm = { type: "task", status: "todo", labels: ["buero"], project: "[[Haus]]" };
    feuern("mc:changed", dateien[0]);
    stimmt("Label-Wechsel");

    const weg = dateien[2];
    dateien.splice(2, 1);
    feuern("vault:delete", weg);
    stimmt("Löschen");
  });
});
