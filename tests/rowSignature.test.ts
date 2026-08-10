import { describe, it, expect } from "vitest";
import { rowSig, sectionSig, SigLookup } from "../src/rowSignature";
import { Task } from "../src/types";

/**
 * Die Signaturen des inkrementellen Nachzeichnens.
 *
 * Der Anlass für diese Datei ist ein echter Fehler: `rowSig` führte `project` nicht. Wer eine
 * Aufgabe per Zug in ein anderes Projekt schob, sah nichts passieren – die Aufgabe WAR
 * verschoben, aber die Sektion galt als unverändert und die Zeile trug weiter das alte Projekt.
 * Zwei Fehlersuchen gingen in die falsche Richtung, weil sich so etwas nicht als Fehler meldet,
 * sondern als „die Oberfläche reagiert nicht".
 *
 * Deshalb prüft der erste Block nicht einzelne Felder, sondern ALLE: Jedes Feld von `Task` wird
 * verändert, und die Signatur muss sich rühren. Wer künftig ein Feld hinzufügt, muss hier eine
 * bewusste Entscheidung treffen – vergessen geht nicht mehr.
 */

const BASIS: Task = {
  id: "t-1", path: "Items/a.md", title: "Aufgabe", titleInFm: true,
  status: "todo", priority: "normal",
  due: "2026-08-10", dueTime: "09:00", scheduled: "2026-08-12", scheduledTime: "10:00",
  duration: 30, start: "2026-08-09",
  project: "Projects/Haus.md", parent: "Items/eltern.md",
  labels: ["urgent"], description: "Beschreibung",
  recurrence: "FREQ=DAILY", recurBasis: "due", reminders: ["-30m"],
  sortOrder: 10, created: "2026-08-01T10:00:00",
  completed: null, cancelled: null, externalId: "x-1",
};

const ELTERN: Task = { ...BASIS, id: "t-0", path: "Items/eltern.md", title: "Elternaufgabe", parent: null };

const look = (over: Partial<SigLookup> = {}): SigLookup => ({
  title: (p) => (p === ELTERN.path ? ELTERN.title : undefined),
  comments: () => 0,
  children: () => [],
  expanded: () => false,
  ...over,
});

/**
 * Felder, die eine Zeile NICHT anfassen – jedes mit Begründung. Alles andere muss die Signatur
 * verändern. Diese Liste ist bewusst kurz und darf nur nach Prüfung wachsen.
 */
const OHNE_WIRKUNG: Record<string, string> = {
  id: "Interne Kennung für den Google-Abgleich; steht nirgends in der Zeile.",
  titleInFm: "Sagt nur, WO der Titel gespeichert ist (Frontmatter oder Überschrift), nicht wie er aussieht.",
  created: "Wird nicht angezeigt. Als SORTIERKRITERIUM wirkt es über die Reihenfolge der Zeilen, und die steckt in der Sektions-Signatur.",
  externalId: "Fremdschlüssel für Importe; unsichtbar.",
};

/** Ein anderer, garantiert abweichender Wert für ein Feld – ohne den Typ zu verbiegen. */
function anders(wert: unknown): unknown {
  if (typeof wert === "string") return wert + "-X";
  if (typeof wert === "number") return wert + 1;
  if (typeof wert === "boolean") return !wert;
  if (Array.isArray(wert)) return [...wert, "zusatz"];
  return "gesetzt";   // war null
}

describe("rowSig – jedes Feld von Task ist bedacht", () => {
  for (const feld of Object.keys(BASIS) as (keyof Task)[]) {
    const grund = OHNE_WIRKUNG[feld];
    it(`${feld}${grund ? " (bewusst ohne Wirkung)" : ""}`, () => {
      const geaendert = { ...BASIS, [feld]: anders(BASIS[feld]) } as Task;
      const vorher = rowSig(BASIS, look());
      const nachher = rowSig(geaendert, look());
      if (grund) expect(nachher, grund).toBe(vorher);
      else expect(nachher, `Feld "${feld}" ändert die Zeile, fehlt aber in rowSig`).not.toBe(vorher);
    });
  }

  it("deckt alle Felder ab, die es gibt – auch künftige", () => {
    // Schlägt fehl, sobald Task ein Feld bekommt, das weder in rowSig noch in OHNE_WIRKUNG steht.
    const unbedacht = (Object.keys(BASIS) as (keyof Task)[]).filter((f) => {
      if (OHNE_WIRKUNG[f]) return false;
      return rowSig({ ...BASIS, [f]: anders(BASIS[f]) } as Task, look()) === rowSig(BASIS, look());
    });
    expect(unbedacht).toEqual([]);
  });
});

describe("rowSig – Werte, die nicht in der Aufgabe stehen", () => {
  it("bemerkt eine neue Kommentar-/Anhangzahl", () => {
    expect(rowSig(BASIS, look({ comments: () => 2 }))).not.toBe(rowSig(BASIS, look()));
  });

  it("bemerkt, wenn die Elternaufgabe umbenannt wird – ihr Titel steht in der Zeile", () => {
    const umbenannt = look({ title: () => "Anderer Elterntitel" });
    expect(rowSig(BASIS, umbenannt)).not.toBe(rowSig(BASIS, look()));
  });

  it("verwechselt Feldgrenzen nicht (Titel/Beschreibung verschoben)", () => {
    const a = { ...BASIS, title: "ab", description: "c" } as Task;
    const b = { ...BASIS, title: "a", description: "bc" } as Task;
    expect(rowSig(a, look())).not.toBe(rowSig(b, look()));
  });
});

describe("sectionSig", () => {
  const A: Task = { ...BASIS, path: "Items/a.md", parent: null, title: "A" };
  const B: Task = { ...BASIS, path: "Items/b.md", parent: null, title: "B" };
  const KIND: Task = { ...BASIS, path: "Items/kind.md", parent: "Items/a.md", title: "Kind" };

  it("ändert sich, wenn eine Zeile sich ändert", () => {
    const vorher = sectionSig([A, B], look());
    const nachher = sectionSig([A, { ...B, title: "B neu" }], look());
    expect(nachher).not.toBe(vorher);
  });

  it("ändert sich bei anderer REIHENFOLGE – die Liste sieht dann anders aus", () => {
    expect(sectionSig([A, B], look())).not.toBe(sectionSig([B, A], look()));
  });

  it("erfasst auch Unteraufgaben, die nicht in der Menge stehen", () => {
    const mitKind = look({ children: (p) => (p === A.path ? [KIND] : []) });
    const kindGeaendert = look({ children: (p) => (p === A.path ? [{ ...KIND, status: "done" }] : []) });
    expect(sectionSig([A], kindGeaendert)).not.toBe(sectionSig([A], mitKind));
  });

  it("erfasst das Auf- und Zuklappen – es ändert die Anzeige, nicht die Daten", () => {
    const zu = look({ children: (p) => (p === A.path ? [KIND] : []) });
    const auf = look({ children: (p) => (p === A.path ? [KIND] : []), expanded: () => true });
    expect(sectionSig([A], auf)).not.toBe(sectionSig([A], zu));
  });

  it("läuft nicht in einer Schleife fest, wenn sich Aufgaben gegenseitig als Eltern führen", () => {
    const zyklisch = look({ children: (p) => (p === A.path ? [B] : p === B.path ? [A] : []) });
    expect(() => sectionSig([A], zyklisch)).not.toThrow();
  });

  it("ist stabil, solange sich nichts ändert", () => {
    expect(sectionSig([A, B], look())).toBe(sectionSig([A, B], look()));
  });
});
