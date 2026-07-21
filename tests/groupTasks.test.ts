import { describe, it, expect } from "vitest";
import { Task, Priority } from "../src/types";
import { groupTasks } from "../src/filterEngine";
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
    expect(titles(groupTasks(list, "date", TODAY, "desc"))).toEqual([
      groupLabel("2026-08-03", TODAY),
      groupLabel("2026-07-27", TODAY),
      groupLabel("2026-07-22", TODAY),
    ]);
  });

  it("Überfällig bleibt auch absteigend oben, Kein Datum unten", () => {
    // Bewusste Entscheidung: streng nach Skala gehörte Überfälliges bei „absteigend" ans Ende –
    // ein Alarmzustand, den man wegscrollen muss, ist aber die schlechtere Voreinstellung.
    const list = [mk({ due: null }), mk({ due: "2026-07-01" }), mk({ due: "2026-07-22" }), mk({ due: "2026-07-27" })];
    expect(titles(groupTasks(list, "date", TODAY, "desc"))).toEqual([
      t("sec_overdue"),
      groupLabel("2026-07-27", TODAY),
      groupLabel("2026-07-22", TODAY),
      t("sec_no_date"),
    ]);
  });

  it("Priorität ignoriert die Richtung (Semantik, keine Skala)", () => {
    const prios: Priority[] = ["normal", "highest", "medium"];
    const list = prios.map((p, i) => mk({ id: String(i), priority: p }));
    const asc = titles(groupTasks(list, "priority", TODAY, "asc"));
    expect(asc).toEqual([t("prio_1"), t("prio_3"), t("prio_4")]);
    expect(titles(groupTasks(list, "priority", TODAY, "desc"))).toEqual(asc);
  });

  it("Label ignoriert die Richtung, „ohne Label“ bleibt am Ende", () => {
    const list = [mk({ labels: [] }), mk({ labels: ["zebra"] }), mk({ labels: ["apfel"] })];
    const asc = titles(groupTasks(list, "label", TODAY, "asc"));
    expect(asc).toEqual(["#apfel", "#zebra", t("no_label")]);
    expect(titles(groupTasks(list, "label", TODAY, "desc"))).toEqual(asc);
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
