import { describe, it, expect } from "vitest";
import { applyDropPage, DropPage } from "../src/taskDrag";
import { Task } from "../src/types";
import type BeautyTasksPlugin from "../src/main";

// Abwerfen heißt „gehört jetzt hierher" – dieselbe Bedeutung, die das Ziehen auf einen
// Seitenleisten-Eintrag im Plugin schon hat. Nötig wurde das erst mit dem Planungs-Split: Vorher
// waren Liste und Kalender zwei Layouts DERSELBEN Seite, die Aufgabe gehörte also immer schon
// hierher. Seither kann sie aus einem fremden Projekt kommen – und bekam dann nur das Datum,
// blieb aber drüben und war nirgends zu sehen.

/** Aufzeichnendes Plugin-Double: hält fest, WAS geschrieben würde. */
function fakePlugin() {
  const calls: string[] = [];
  const plugin = {
    setTaskProject: (_t: Task, project: string | null) => {
      calls.push("project=" + (project ?? "(kein)"));
      return Promise.resolve();
    },
    swapTaskLabel: (_t: Task, remove: string | null, add: string | null) => {
      calls.push("label+" + add + " -" + (remove ?? "(nichts)"));
      return Promise.resolve();
    },
  } as unknown as BeautyTasksPlugin;
  return { plugin, calls };
}

/** Task.project ist ein AUFGELÖSTER Pfad (s. resolveProjectPath), kein Wikilink. */
const task = (project: string | null, labels: string[] = []): Task =>
  ({ path: "Tasks/Umzug planen.md", project, labels } as Task);

const run = async (t: Task, page: DropPage) => {
  const { plugin, calls } = fakePlugin();
  await applyDropPage(plugin, t, page);
  return calls;
};

describe("applyDropPage – Projektseiten", () => {
  it("aus einem anderen Projekt gezogen: verschiebt", async () => {
    expect(await run(task("Projekte/A.md"), { project: "B" })).toEqual(["project=B"]);
  });

  it("innerhalb derselben Seite: schreibt GAR NICHTS", async () => {
    // Der Normalfall – jede Umterminierung im eigenen Kalender ginge sonst mit einem
    // überflüssigen Frontmatter-Schreibvorgang einher.
    expect(await run(task("Projekte/B.md"), { project: "B" })).toEqual([]);
  });

  it("aus dem Eingang in ein Projekt: verschiebt", async () => {
    expect(await run(task(null), { project: "B" })).toEqual(["project=B"]);
  });
});

describe("applyDropPage – Eingang nimmt das Projekt weg", () => {
  it("aus einem Projekt in den Eingang gezogen", async () => {
    // project: null heißt „diese Seite IST der Eingang" – anders als undefined (keine Dimension).
    expect(await run(task("Projekte/A.md"), { project: null })).toEqual(["project=(kein)"]);
  });

  it("liegt schon im Eingang: nichts zu tun", async () => {
    expect(await run(task(null), { project: null })).toEqual([]);
  });
});

describe("applyDropPage – Labels ergänzen statt verschieben", () => {
  it("Label-Seite hängt ihr Label an, das Projekt bleibt unangetastet", async () => {
    // Eine Aufgabe hat genau eine Liste, aber beliebig viele Labels: Label-Seiten ERGÄNZEN.
    expect(await run(task("Projekte/A.md", []), { label: "Einkauf" }))
      .toEqual(["label+Einkauf -(nichts)"]);
  });

  it("Label schon dran: nichts zu tun", async () => {
    expect(await run(task("Projekte/A.md", ["Einkauf"]), { label: "Einkauf" })).toEqual([]);
  });
});

describe("applyDropPage – Seiten ohne eigene Dimension", () => {
  it("Heute/Demnächst/Filter fassen weder Projekt noch Label an", async () => {
    // Dort ist ein Abwurf reine Terminierung: Diese Seiten sind kein Behälter, in den etwas
    // hineingehört – „Demnächst" ist eine Zeitspanne, ein Filter eine Suchanfrage.
    expect(await run(task("Projekte/A.md"), {})).toEqual([]);
  });
});
