import { describe, it, expect } from "vitest";
import { rowPlan, descriptionPreview, NO_PROJECT, RowPlanInput } from "../src/rowPlan";
import { Task } from "../src/types";

/**
 * Was eine Aufgaben-Zeile zeigt.
 *
 * Diese Regeln waren bis hierher nur am Bildschirm nachprüfbar – und genau dort fallen sie nicht
 * auf: Ein Chip, der zu Unrecht fehlt, sieht aus wie eine leere Aufgabe; einer mit altem Inhalt
 * sieht aus wie gar nichts. Deshalb steht hier jede Sichtbarkeitsregel als eigener Fall.
 */

const HEUTE = "2026-08-10";

const aufgabe = (over: Partial<Task> = {}): Task => ({
  id: "t-1", path: "Items/a.md", title: "Aufgabe", titleInFm: true,
  status: "todo", priority: "normal",
  due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
  project: null, parent: null, labels: [], description: "",
  recurrence: null, recurBasis: "due", reminders: [], sortOrder: null,
  created: "2026-08-01T10:00:00", completed: null, cancelled: null, externalId: null,
  ...over,
});

const plan = (task: Task, over: Partial<RowPlanInput> = {}) =>
  rowPlan({ task, today: HEUTE, depth: 0, ...over });

describe("Zeilen-Klassen", () => {
  it("markiert Erledigtes, Abgebrochenes und Verschachteltes", () => {
    expect(plan(aufgabe()).classes).toEqual(["bt-task"]);
    expect(plan(aufgabe({ status: "done" })).classes).toContain("is-done");
    expect(plan(aufgabe(), { trash: true }).classes).toContain("is-cancelled");
    expect(plan(aufgabe(), { depth: 1 }).classes).toContain("bt-subtask");
  });
});

describe("Beschreibungs-Vorschau", () => {
  it("erscheint nur, wenn die Einstellung es erlaubt", () => {
    const t = aufgabe({ description: "Kontext" });
    expect(plan(t).description).toBeNull();
    expect(plan(t, { showDescription: true }).description).toBe("Kontext");
  });

  it("wirft Bilder und Embeds heraus – sonst ginge die einzeilige Vorschau auf", () => {
    expect(descriptionPreview("davor ![[bild.png]] danach")).toBe("davor danach");
    expect(descriptionPreview("davor ![alt](pfad.png) danach")).toBe("davor danach");
    expect(descriptionPreview("  viel\n\n  Leerraum  ")).toBe("viel Leerraum");
    expect(descriptionPreview("![[nur-ein-bild.png]]")).toBe("");
  });

  it("zeigt nichts an, wenn nach dem Aufräumen nichts übrig bleibt", () => {
    expect(plan(aufgabe({ description: "![[bild.png]]" }), { showDescription: true }).description).toBeNull();
  });
});

describe("Fälligkeit", () => {
  it("steht mit Datum in der Zeile", () => {
    const p = plan(aufgabe({ due: "2026-08-12" }));
    expect(p.due?.text).toBeTruthy();
    expect(p.due?.when).toBe("future");
  });

  it("entfällt, wenn die Sektionsüberschrift GENAU DIESES Datum trägt", () => {
    const t = aufgabe({ due: HEUTE });
    expect(plan(t, { impliedDate: HEUTE }).due).toBeNull();
  });

  it("bleibt bei abweichendem Datum stehen – auch in einer datierten Sektion", () => {
    // „Heute" zeigt über die Deadline-Regel auch später fällige Aufgaben. Deren Fälligkeit ist
    // der Grund, warum die Zeile dort überhaupt erklärbar ist – sie darf nie wegfallen.
    const t = aufgabe({ due: "2026-08-20" });
    expect(plan(t, { impliedDate: HEUTE }).due).not.toBeNull();
  });

  it("zeigt bei gleichem Datum WENIGSTENS die Uhrzeit", () => {
    const t = aufgabe({ due: HEUTE, dueTime: "14:30" });
    expect(plan(t, { impliedDate: HEUTE }).due?.text).toBe("14:30");
  });

  it("blendet an Unteraufgaben NIE aus – die Überschrift meint die Hauptaufgabe", () => {
    const t = aufgabe({ due: HEUTE });
    expect(plan(t, { impliedDate: HEUTE, depth: 1 }).due).not.toBeNull();
  });

  it("färbt überfällig anders als künftig", () => {
    expect(plan(aufgabe({ due: "2026-08-01" })).due?.when).toBe("past");
    expect(plan(aufgabe({ due: HEUTE })).due?.when).toBe("today");
  });
});

describe("Deadline", () => {
  it("entfällt bei Deadline-Gruppierung, solange sie nicht vergangen ist", () => {
    expect(plan(aufgabe({ scheduled: "2026-08-20" }), { deadlineImplied: true }).deadline).toBeNull();
  });

  it("bleibt stehen, wenn sie vergangen ist – dort sammelt der Ueberfaellig-Bucket ohne eigenes Datum", () => {
    expect(plan(aufgabe({ scheduled: "2026-08-01" }), { deadlineImplied: true }).deadline).not.toBeNull();
  });

  it("zeigt auch bei Gruppierung wenigstens die Uhrzeit", () => {
    const t = aufgabe({ scheduled: "2026-08-20", scheduledTime: "08:00" });
    expect(plan(t, { deadlineImplied: true }).deadline?.text).toBe("08:00");
  });
});

describe("@Projekt-Verweis", () => {
  const imProjekt = aufgabe({ project: "Projects/Haus.md" });

  it("steht an einer Aufgabe mit Projekt", () => {
    expect(plan(imProjekt).backlink).toEqual({ inbox: false, text: "Haus" });
  });

  it("entfällt auf einer Projektseite – dort weiß man, wo man ist", () => {
    expect(plan(imProjekt, { onProjectPage: true }).backlink).toBeNull();
  });

  it("entfällt, wenn die Sektion nach genau diesem Projekt gruppiert", () => {
    expect(plan(imProjekt, { hideProject: "Haus" }).backlink).toBeNull();
    expect(plan(imProjekt, { hideProject: "Garten" }).backlink).not.toBeNull();
  });

  it("zeigt bei fehlendem Projekt den Eingang", () => {
    expect(plan(aufgabe()).backlink).toEqual({ inbox: true, text: "" });
    expect(plan(aufgabe(), { hideProject: NO_PROJECT }).backlink).toBeNull();
  });

  it("steht nie an einer Unteraufgabe und nie im Papierkorb", () => {
    expect(plan(imProjekt, { depth: 1 }).backlink).toBeNull();
    expect(plan(imProjekt, { trash: true }).backlink).toBeNull();
  });
});

describe("Unteraufgaben-Badge", () => {
  const kind = (over: Partial<Task> = {}) => aufgabe({ path: "Items/k.md", parent: "Items/a.md", ...over });

  it("zählt erledigte und alle", () => {
    const p = plan(aufgabe(), { kids: [kind(), kind({ status: "done" })] });
    expect(p.subs).toEqual({ done: 1, total: 2, open: false });
  });

  it("fehlt ohne Unteraufgaben", () => {
    expect(plan(aufgabe(), { kids: [] }).subs).toBeNull();
  });

  it("ist auf einer Karte nie aufgeklappt – dort ginge Aufklappen nicht", () => {
    expect(plan(aufgabe(), { kids: [kind()], expanded: true, flat: true }).subs?.open).toBe(false);
    expect(plan(aufgabe(), { kids: [kind()], expanded: true }).subs?.open).toBe(true);
  });

  it("fehlt im Papierkorb", () => {
    expect(plan(aufgabe(), { kids: [kind()], trash: true }).subs).toBeNull();
  });
});

describe("Übrige Chips", () => {
  it("Wiederholung, Erinnerungen, Labels, Kommentare erscheinen nur, wenn es sie gibt", () => {
    const leer = plan(aufgabe());
    expect(leer.recur).toBe(false);
    expect(leer.reminders).toEqual([]);
    expect(leer.labels).toEqual([]);
    expect(leer.comments).toBeNull();

    const voll = plan(aufgabe({ recurrence: "FREQ=DAILY", reminders: ["-30m"], labels: ["urgent", "heim"] }), { comments: 3 });
    expect(voll.recur).toBe(true);
    expect(voll.reminders).toHaveLength(1);
    expect(voll.labels).toEqual(["urgent", "heim"]);
    expect(voll.comments).toBe(3);
  });

  it("zeigt ALLE Labels – auch das der Label-Seite, auf der man steht", () => {
    expect(plan(aufgabe({ labels: ["urgent", "heim"] })).labels).toEqual(["urgent", "heim"]);
  });

  it("reicht die Labels als Kopie heraus – die Zeile darf die Aufgabe nicht verändern", () => {
    const t = aufgabe({ labels: ["urgent"] });
    plan(t).labels.push("dazu");
    expect(t.labels).toEqual(["urgent"]);
  });
});

describe("Verweis auf die Hauptaufgabe", () => {
  it("steht an einer Unteraufgabe, die auf oberster Ebene gezeigt wird", () => {
    const t = aufgabe({ parent: "Items/eltern.md" });
    expect(plan(t, { parentTitle: "Die Hauptaufgabe" }).parentLink).toEqual({ title: "Die Hauptaufgabe" });
  });

  it("entfällt, wenn die Zeile ohnehin eingerückt unter ihrer Hauptaufgabe steht", () => {
    const t = aufgabe({ parent: "Items/eltern.md" });
    expect(plan(t, { parentTitle: "Die Hauptaufgabe", depth: 1 }).parentLink).toBeNull();
  });

  it("entfällt, wenn die Hauptaufgabe nicht auffindbar ist", () => {
    expect(plan(aufgabe({ parent: "Items/weg.md" })).parentLink).toBeNull();
  });
});

describe("Papierkorb", () => {
  it("zeigt seine eigenen Aktionen statt der Zeilen-Extras", () => {
    const p = plan(aufgabe({ project: "Projects/Haus.md" }), { trash: true });
    expect(p.trashActions).toBe(true);
    expect(p.backlink).toBeNull();
    expect(p.subs).toBeNull();
  });
});
