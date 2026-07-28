import { describe, it, expect, beforeAll } from "vitest";
import { Task } from "../src/types";
import { deadlineMarkers } from "../src/filterEngine";
import { initStatuses } from "../src/statuses";

beforeAll(() => initStatuses());

const TODAY = "2026-07-28";

function mk(id: string, o: Partial<Task> = {}): Task {
  return {
    id, path: "Items/" + id + ".md", title: id, status: "todo", priority: "normal",
    due: null, dueTime: null, scheduled: null, scheduledTime: null, duration: null, start: null,
    sortOrder: null, project: null, parent: null, labels: [], description: "", recurrence: null,
    recurBasis: "due", reminders: [], created: "2026-07-01", completed: null, cancelled: null,
    externalId: null, ...o,
  };
}

/** „Demnächst"/Kalender rechnen je TAG: die Aufgabe steht dort, wenn sie an diesem Tag fällig ist. */
const rowsOnDay = (day: string) => (t: Task): boolean => t.due === day;
/** „Heute" ist EIN Zeitraum: die Aufgabe steht dort, wenn sie heute oder früher fällig ist
 *  (Abschnitte Überfällig + Heute zusammen). */
const rowsInHeute = (today: string) => (t: Task): boolean => !!t.due && t.due <= today;

describe("deadlineMarkers – Deadline-Hinweise ohne Doppelung im selben Abschnitt", () => {
  it("zeigt den Hinweis, wenn die Aufgabe gar keine Fälligkeit hat", () => {
    const tasks = [mk("a", { scheduled: TODAY })];
    expect(deadlineMarkers(tasks, rowsOnDay(TODAY)).map((t) => t.id)).toEqual(["a"]);
  });

  it("unterdrückt den Hinweis, wenn Fälligkeit und Deadline auf denselben Tag fallen", () => {
    // Dann trägt die ohnehin vorhandene Aufgabenzeile die Deadline als Chip in der Meta-Zeile.
    const tasks = [mk("a", { due: TODAY, scheduled: TODAY })];
    expect(deadlineMarkers(tasks, rowsOnDay(TODAY))).toEqual([]);
  });

  it("vergleicht tagesbasiert: verschiedene Uhrzeiten am selben Tag bleiben EIN Tag", () => {
    const tasks = [mk("a", { due: TODAY, dueTime: "09:00", scheduled: TODAY, scheduledTime: "17:00" })];
    expect(deadlineMarkers(tasks, rowsOnDay(TODAY))).toEqual([]);
  });

  it("zeigt den Hinweis, wenn die Fälligkeit auf einen ANDEREN Tag fällt", () => {
    const tasks = [mk("a", { due: "2026-07-31", scheduled: TODAY })];
    expect(deadlineMarkers(tasks, rowsOnDay(TODAY)).map((t) => t.id)).toEqual(["a"]);
  });

  it("„Heute“: heute fällige Aufgabe mit gestriger Deadline bekommt KEINEN Hinweis", () => {
    // Ihre Zeile steht unter „Heute“ und trägt die verstrichene Deadline als roten Chip – ein
    // zusätzlicher Hinweis unter „Überfällig“ wäre dieselbe Aussage ein zweites Mal.
    const tasks = [mk("a", { due: TODAY, scheduled: "2026-07-27" })];
    expect(deadlineMarkers(tasks, rowsInHeute(TODAY))).toEqual([]);
  });

  it("„Heute“: überfällige Aufgabe mit heutiger Deadline bekommt KEINEN Hinweis", () => {
    // Gegenprobe zum Fall darüber – die Ansicht ist EIN Zeitraum, nicht zwei.
    const tasks = [mk("a", { due: "2026-07-20", scheduled: TODAY })];
    expect(deadlineMarkers(tasks, rowsInHeute(TODAY))).toEqual([]);
  });

  it("„Heute“: künftig fällige Aufgabe mit heutiger Deadline bekommt ihren Hinweis", () => {
    // Sie hat in „Heute“ keine eigene Zeile – ohne den Hinweis wäre die Deadline hier unsichtbar.
    const tasks = [mk("a", { due: "2026-08-05", scheduled: TODAY })];
    expect(deadlineMarkers(tasks, rowsInHeute(TODAY)).map((t) => t.id)).toEqual(["a"]);
  });

  it("lässt erledigte und abgebrochene Aufgaben weg", () => {
    const tasks = [mk("a", { scheduled: TODAY, status: "done" }), mk("b", { scheduled: TODAY, status: "cancelled" })];
    expect(deadlineMarkers(tasks, rowsOnDay(TODAY))).toEqual([]);
  });

  it("sortiert nach Uhrzeit, Deadlines ohne Uhrzeit ans Tagesende", () => {
    const tasks = [
      mk("spaet", { scheduled: TODAY, scheduledTime: "17:00" }),
      mk("ohne", { scheduled: TODAY }),
      mk("frueh", { scheduled: TODAY, scheduledTime: "08:30" }),
    ];
    expect(deadlineMarkers(tasks, rowsOnDay(TODAY)).map((t) => t.id)).toEqual(["frueh", "spaet", "ohne"]);
  });
});
