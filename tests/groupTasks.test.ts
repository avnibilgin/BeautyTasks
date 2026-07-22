import { describe, it, expect } from "vitest";
import { Task, Priority } from "../src/types";
import { groupTasks, visibleRows, FilterSort, SortDir } from "../src/filterEngine";
import { groupLabel } from "../src/format";
import { t } from "../src/i18n";

const TODAY = "2026-07-21";

function mk(p: Partial<Task>): Task {
  return {
    id: "t1", path: "Items/t1.md", title: "Task", status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    project: null, parent: null, labels: [], description: "", recurrence: null, recurBasis: "due",
    reminders: [], created: "2026-07-01", completed: null, cancelled: null, externalId: null, ...p,
  };
}
/** Nur die Überschriften – die Gruppen-Reihenfolge ist das, was hier geprüft wird. */
const titles = (g: { title: string }[]): string[] => g.map((x) => x.title);
/** Sortierung + Richtung als Paar. „due" als Träger, weil es eine Richtung kennt (im
 *  Gegensatz zu „smart") – damit prüfen diese Fälle wirklich die Richtung. */
const ord = (sortDir: SortDir, sort: FilterSort = "due"): { sort: FilterSort; sortDir: SortDir } => ({ sort, sortDir });

describe("groupTasks – Datum: ein Tag = eine Gruppe", () => {
  it("legt für jeden Zukunftstag eine eigene Gruppe an (statt eines Sammel-Eimers)", () => {
    const list = [
      mk({ id: "a", due: "2026-08-03" }),
      mk({ id: "b", due: "2026-07-22" }),
      mk({ id: "c", due: "2026-07-22" }),
      mk({ id: "d", due: "2026-07-27" }),
    ];
    const g = groupTasks(list, "date", TODAY);
    expect(titles(g)).toEqual([
      groupLabel("2026-07-22", TODAY),
      groupLabel("2026-07-27", TODAY),
      groupLabel("2026-08-03", TODAY),
    ]);
    expect(g[0].tasks.map((x) => x.id)).toEqual(["b", "c"]);   // selber Tag = selbe Gruppe
  });

  it("Überfällig bleibt EIN Block über mehrere Tage hinweg", () => {
    const list = [mk({ id: "a", due: "2026-07-01" }), mk({ id: "b", due: "2026-07-19" })];
    const g = groupTasks(list, "date", TODAY);
    expect(titles(g)).toEqual([t("sec_overdue")]);
    expect(g[0].tasks.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("Heute bekommt die Datums-Überschrift (Titel-Kopplung der Heute-Ansicht)", () => {
    // renderViewInto findet die Heute-Gruppe über genau diesen Titelvergleich.
    const g = groupTasks([mk({ due: TODAY })], "date", TODAY);
    expect(titles(g)).toEqual([groupLabel(TODAY, TODAY)]);
  });

  it("volle Achse: Überfällig zuerst, dann Tage chronologisch, Kein Datum zuletzt", () => {
    const list = [
      mk({ id: "ohne", due: null }),
      mk({ id: "spät", due: "2026-07-27" }),
      mk({ id: "heute", due: TODAY }),
      mk({ id: "alt", due: "2026-07-01" }),
      mk({ id: "morgen", due: "2026-07-22" }),
    ];
    expect(titles(groupTasks(list, "date", TODAY))).toEqual([
      t("sec_overdue"),
      groupLabel(TODAY, TODAY),
      groupLabel("2026-07-22", TODAY),
      groupLabel("2026-07-27", TODAY),
      t("sec_no_date"),
    ]);
  });

  it("Deadline gruppiert nach scheduled statt nach due", () => {
    const list = [mk({ id: "a", due: "2026-07-22", scheduled: null }), mk({ id: "b", due: null, scheduled: "2026-07-25" })];
    const g = groupTasks(list, "deadline", TODAY);
    expect(titles(g)).toEqual([groupLabel("2026-07-25", TODAY), t("sec_no_date")]);
    expect(g[0].tasks.map((x) => x.id)).toEqual(["b"]);
  });
});

describe("groupTasks – Richtung", () => {
  it("absteigend dreht die Tages-Gruppen um", () => {
    const list = [mk({ due: "2026-07-22" }), mk({ due: "2026-07-27" }), mk({ due: "2026-08-03" })];
    expect(titles(groupTasks(list, "date", TODAY, ord("desc")))).toEqual([
      groupLabel("2026-08-03", TODAY),
      groupLabel("2026-07-27", TODAY),
      groupLabel("2026-07-22", TODAY),
    ]);
  });

  it("Überfällig bleibt auch absteigend oben, Kein Datum unten", () => {
    // Bewusste Entscheidung: streng nach Skala gehörte Überfälliges bei „absteigend" ans Ende –
    // ein Alarmzustand, den man wegscrollen muss, ist aber die schlechtere Voreinstellung.
    const list = [mk({ due: null }), mk({ due: "2026-07-01" }), mk({ due: "2026-07-22" }), mk({ due: "2026-07-27" })];
    expect(titles(groupTasks(list, "date", TODAY, ord("desc")))).toEqual([
      t("sec_overdue"),
      groupLabel("2026-07-27", TODAY),
      groupLabel("2026-07-22", TODAY),
      t("sec_no_date"),
    ]);
  });

  it("„smart“ ignoriert eine gespeicherte Richtung auch bei den GRUPPEN", () => {
    // Gemeldeter Ablauf: erst „Datum + absteigend" eingestellt, dann auf „smart" gewechselt.
    // Die Richtung bleibt gespeichert (nicht destruktiv), das Panel blendet die Zeile aber aus –
    // und sortTasks ignoriert sie bei smart ohnehin. Die Gruppen taten es nicht: „Morgen" stand
    // vor „Heute", während die Zeilen darin aufsteigend liefen. Beides muss dieselbe Regel haben.
    const list = [mk({ due: "2026-07-23" }), mk({ due: TODAY })];
    const aufsteigend = [groupLabel(TODAY, TODAY), groupLabel("2026-07-23", TODAY)];
    expect(titles(groupTasks(list, "date", TODAY, ord("desc", "smart")))).toEqual(aufsteigend);
    // Gegenprobe: mit einer Sortierung, die eine Richtung KENNT, dreht es weiterhin.
    expect(titles(groupTasks(list, "date", TODAY, ord("desc", "due")))).toEqual([...aufsteigend].reverse());
  });

  it("Priorität ignoriert die Richtung (Semantik, keine Skala)", () => {
    const prios: Priority[] = ["normal", "highest", "medium"];
    const list = prios.map((p, i) => mk({ id: String(i), priority: p }));
    const asc = titles(groupTasks(list, "priority", TODAY, ord("asc")));
    expect(asc).toEqual([t("prio_1"), t("prio_3"), t("prio_4")]);
    expect(titles(groupTasks(list, "priority", TODAY, ord("desc")))).toEqual(asc);
  });

  it("Label ignoriert die Richtung, „ohne Label“ bleibt am Ende", () => {
    const list = [mk({ labels: [] }), mk({ labels: ["zebra"] }), mk({ labels: ["apfel"] })];
    const asc = titles(groupTasks(list, "label", TODAY, ord("asc")));
    expect(asc).toEqual(["#apfel", "#zebra", t("no_label")]);
    expect(titles(groupTasks(list, "label", TODAY, ord("desc")))).toEqual(asc);
  });
});

describe("groupTasks – Label ist mehrwertig", () => {
  it("eine Aufgabe erscheint unter JEDEM ihrer Labels", () => {
    // Der gemeldete Fall aus dem Demo-Vault: „Send Q3 report" trägt labels: [urgent, finance].
    // Das Board zeigt sie in beiden Spalten (col.has = labels.includes), die Liste zeigte sie
    // nur unter labels[0] – also unter #urgent, und unter #finance fehlte sie stillschweigend.
    const q3 = mk({ id: "q3", labels: ["urgent", "finance"] });
    const invoice = mk({ id: "invoice", labels: ["urgent"] });
    const g = groupTasks([q3, invoice], "label", TODAY);
    expect(titles(g)).toEqual(["#finance", "#urgent"]);
    expect(g[0].tasks.map((x) => x.id)).toEqual(["q3"]);
    expect(g[1].tasks.map((x) => x.id)).toEqual(["q3", "invoice"]);
  });

  it("die Summe der Gruppen-Zähler darf die Aufgabenzahl übersteigen", () => {
    // Bewusst so: „#finance · 1" heißt „ein Treffer". Im Board ist es seit jeher identisch.
    const list = [mk({ labels: ["a", "b", "c"] })];
    const g = groupTasks(list, "label", TODAY);
    expect(g).toHaveLength(3);
    expect(g.reduce((n, x) => n + x.tasks.length, 0)).toBe(3);   // 1 Aufgabe, 3 Treffer
  });

  it("ohne Labels bleibt es bei EINER „ohne Label“-Gruppe", () => {
    const g = groupTasks([mk({ labels: [] }), mk({ labels: [] })], "label", TODAY);
    expect(titles(g)).toEqual([t("no_label")]);
    expect(g[0].tasks).toHaveLength(2);
  });
});

describe("groupTasks – Label-Reihenfolge folgt der Vorgabe (wie im Board)", () => {
  it("labelOrder bestimmt die Gruppen-Reihenfolge statt des Alphabets", () => {
    const list = [mk({ labels: ["apfel"] }), mk({ labels: ["zebra"] }), mk({ labels: ["mango"] })];
    // Manuell sortierte Seitenleiste: zebra vor apfel vor mango.
    expect(titles(groupTasks(list, "label", TODAY, undefined, ["zebra", "apfel", "mango"])))
      .toEqual(["#zebra", "#apfel", "#mango"]);
  });

  it("ohne Vorgabe bleibt es alphabetisch (bisheriges Verhalten)", () => {
    const list = [mk({ labels: ["zebra"] }), mk({ labels: ["apfel"] })];
    expect(titles(groupTasks(list, "label", TODAY))).toEqual(["#apfel", "#zebra"]);
  });

  it("Labels ausserhalb der Vorgabe landen dahinter, alphabetisch", () => {
    const list = [mk({ labels: ["neu"] }), mk({ labels: ["zebra"] }), mk({ labels: ["alt"] })];
    expect(titles(groupTasks(list, "label", TODAY, undefined, ["zebra"])))
      .toEqual(["#zebra", "#alt", "#neu"]);
  });

  it("„ohne Label“ bleibt trotz Vorgabe ganz am Ende", () => {
    const list = [mk({ labels: [] }), mk({ labels: ["zebra"] })];
    expect(titles(groupTasks(list, "label", TODAY, undefined, ["zebra"])))
      .toEqual(["#zebra", t("no_label")]);
  });
});

describe("visibleRows – Wächter und Sektion müssen dieselbe Regel benutzen", () => {
  it("Unteraufgabe mit sichtbarem Parent zählt nicht als eigene Zeile", () => {
    const present = new Set(["Items/eltern.md"]);
    const rows = [mk({ id: "kind", parent: "Items/eltern.md" }), mk({ id: "frei", parent: null })];
    expect(visibleRows(rows, present).map((x) => x.id)).toEqual(["frei"]);
  });

  it("Unteraufgabe ohne sichtbaren Parent bleibt eine eigene Zeile", () => {
    const rows = [mk({ id: "kind", parent: "Items/woanders.md" })];
    expect(visibleRows(rows, new Set(["Items/eltern.md"])).map((x) => x.id)).toEqual(["kind"]);
  });

  it("„Kein Datum“ aus lauter verschachtelten Unteraufgaben ist eine LEERE Sektion", () => {
    // Der gemeldete Fall: undatierte Unteraufgaben datierter Aufgaben landen alle in „Kein
    // Datum". Die Gruppe ist nicht leer – gezeichnet wird davon aber keine einzige Zeile.
    // Ein Wächter auf g.tasks.length hätte hier einen Kopf mit „· 0" stehen lassen.
    const eltern = mk({ id: "eltern", path: "Items/eltern.md", due: "2026-07-22" });
    const kind = mk({ id: "kind", path: "Items/kind.md", parent: "Items/eltern.md", due: null });
    const present = new Set([eltern.path, kind.path]);

    const g = groupTasks([eltern, kind], "date", TODAY);
    expect(titles(g)).toEqual([groupLabel("2026-07-22", TODAY), t("sec_no_date")]);

    const nodate = g[1];
    expect(nodate.tasks).toHaveLength(1);                    // Gruppe ist NICHT leer …
    expect(visibleRows(nodate.tasks, present)).toHaveLength(0);   // … zeichnet aber nichts
  });

  it("abgehakte Unteraufgabe mit noch offener Hauptaufgabe bekommt eine eigene Zeile", () => {
    // Der Fall aus der Erledigt-Ansicht: „Collect Q2 figures" ist erledigt, „Finish quarterly
    // report" nicht – die Hauptaufgabe steht also gar nicht in der Liste. `present` wird dort
    // aus den erledigten Aufgaben gebaut und enthält sie deshalb nicht; ohne dieses Wissen
    // wurde die Unteraufgabe als „hängt schon woanders" weggelassen und war unauffindbar.
    const doneList = [mk({ id: "kind", path: "Items/kind.md", parent: "Items/offen.md" })];
    const present = new Set(doneList.map((x) => x.path));   // nur Erledigte, Parent fehlt
    expect(visibleRows(doneList, present).map((x) => x.id)).toEqual(["kind"]);
  });

  it("bleibt sichtbar, sobald die Gruppe eine echte undatierte Aufgabe enthält", () => {
    const eltern = mk({ id: "eltern", path: "Items/eltern.md", due: "2026-07-22" });
    const kind = mk({ id: "kind", path: "Items/kind.md", parent: "Items/eltern.md", due: null });
    const echt = mk({ id: "echt", path: "Items/echt.md", due: null });
    const present = new Set([eltern.path, kind.path, echt.path]);

    const nodate = groupTasks([eltern, kind, echt], "date", TODAY)[1];
    expect(visibleRows(nodate.tasks, present).map((x) => x.id)).toEqual(["echt"]);
  });
});

describe("groupTasks – unverändertes Verhalten", () => {
  it("„keine“ liefert genau eine Gruppe mit allen Aufgaben", () => {
    const list = [mk({ id: "a" }), mk({ id: "b" })];
    const g = groupTasks(list, "none", TODAY);
    expect(g).toHaveLength(1);
    expect(g[0].tasks.map((x) => x.id)).toEqual(["a", "b"]);
  });

  it("Reihenfolge innerhalb einer Gruppe bleibt wie geliefert (sortTasks hat schon sortiert)", () => {
    const list = [mk({ id: "z", due: "2026-07-22" }), mk({ id: "a", due: "2026-07-22" })];
    expect(groupTasks(list, "date", TODAY)[0].tasks.map((x) => x.id)).toEqual(["z", "a"]);
  });

  it("Projekt: ohne Projekt und Inbox-Verweis landen im selben Eingang-Bucket, ganz unten", () => {
    const list = [
      mk({ id: "ohne", project: null }),
      mk({ id: "inbox", project: "BeautyTasks/Projects/Inbox.md" }),
      mk({ id: "echt", project: "BeautyTasks/Projects/Garten.md" }),
    ];
    const g = groupTasks(list, "project", TODAY);
    expect(titles(g)).toEqual(["@Garten", t("nav_inbox")]);
    expect(g[1].tasks.map((x) => x.id)).toEqual(["ohne", "inbox"]);
  });
});
