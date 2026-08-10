import { Task } from "./types";
import { isDone } from "./statuses";
import { combineDT, formatDateTime, formatDeadline, dueWhen, dueDist } from "./format";
import { formatReminder } from "./reminders";
import { isInboxLink, baseName } from "./taskService";
import { projectDisplayName } from "./i18n";

/**
 * WAS eine Aufgaben-Zeile zeigt – ohne zu zeichnen.
 *
 * Die Regeln, welcher Chip erscheint und was darin steht, sind der Teil der Zeile, in dem
 * Fehler unsichtbar bleiben: Ein Chip, der zu Unrecht fehlt, sieht aus wie eine leere Aufgabe,
 * und ein Chip mit altem Inhalt sieht aus wie gar nichts. Hier stehen sie rein und geprüft;
 * renderTask führt den Plan nur noch aus.
 *
 * Bewusst NICHT hier: alles Transiente und Interaktive (Zieh-Griffe, Klick-Handler, das
 * gehaltene Kontextmenü, Aufblitzen aus der Suche). Das gehört zum Zeichnen, nicht zum Inhalt.
 */

/** Sentinel-Id der „Kein Projekt"-Spalte – dieselbe, die das Board benutzt. */
export const NO_PROJECT = " noproject";

export interface RowPlanInput {
  task: Task;
  today: string;
  depth: number;
  trash?: boolean;
  flat?: boolean;                  // Kanban-Karte: kein Aufklappen
  /** Steht dieser Tab schon auf einer Projekt-/Eingang-Seite? Dann kein @Projekt-Verweis. */
  onProjectPage?: boolean;
  showDescription?: boolean;       // Einstellung „Beschreibung in Listen"
  /** Datum, das die Sektion/Spalte schon in ihrer Überschrift trägt. */
  impliedDate?: string;
  deadlineImplied?: boolean;
  /** Projekt, das Sektion/Spalte schon zeigt (NO_PROJECT = Eingang). */
  hideProject?: string;
  parentTitle?: string;            // Titel der Elternaufgabe, falls auffindbar
  comments?: number;
  kids?: Task[];                   // nicht-abgebrochene Unteraufgaben
  expanded?: boolean;
}

export interface DatePlan { text: string; when: string; dist: string }
export interface RowPlan {
  classes: string[];
  depth: number;
  title: string;
  description: string | null;
  parentLink: { title: string } | null;
  due: DatePlan | null;
  deadline: DatePlan | null;
  recur: boolean;
  reminders: string[];
  labels: string[];
  comments: number | null;
  subs: { done: number; total: number; open: boolean } | null;
  backlink: { inbox: boolean; text: string } | null;
  trashActions: boolean;
}

/** Bild-/Embed-Syntax raus, Leerraum zusammenziehen – sonst ginge die einzeilige Vorschau auf. */
export function descriptionPreview(raw: string): string {
  return raw.replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
}

export function rowPlan(i: RowPlanInput): RowPlan {
  const t = i.task;
  const depth = i.depth;
  const trash = !!i.trash;
  const kids = i.kids ?? [];

  const classes = ["bt-task"];
  if (depth) classes.push("bt-subtask");
  if (isDone(t.status)) classes.push("is-done");
  if (trash) classes.push("is-cancelled");

  const desc = i.showDescription ? descriptionPreview(t.description) : "";

  // Fälligkeit: Trägt die Sektions-/Spaltenüberschrift GENAU DIESES Datum, ist der Chip
  // redundant – ohne Uhrzeit fällt er ganz weg, mit Uhrzeit bleibt nur die Uhrzeit. Der
  // Datumsvergleich ist wesentlich: In „Heute" stehen auch später fällige Aufgaben (über die
  // Deadline-Regel), und deren Fälligkeit ist alles andere als redundant.
  let due: DatePlan | null = null;
  if (t.due) {
    const kompakt = depth === 0 && !!i.impliedDate && t.due === i.impliedDate;
    if (!(kompakt && !t.dueTime)) {
      due = {
        text: kompakt ? (t.dueTime ?? "") : formatDateTime(combineDT(t.due, t.dueTime), i.today),
        when: dueWhen(t.due, i.today),
        dist: dueDist(t.due, i.today),
      };
    }
  }

  // Deadline analog. Hier genügt „nicht vergangen": Bei Gruppierung NACH DEADLINE tragen alle
  // Zeilen einer Gruppe dieselbe Frist; der einzige Sammel-Bucket ohne eigenes Datum ist
  // „Überfällig", und dort soll der Chip gerade stehen bleiben.
  let deadline: DatePlan | null = null;
  if (t.scheduled) {
    const kompakt = depth === 0 && !!i.deadlineImplied && t.scheduled >= i.today;
    if (!(kompakt && !t.scheduledTime)) {
      deadline = {
        text: kompakt ? (t.scheduledTime ?? "") : formatDeadline(combineDT(t.scheduled, t.scheduledTime), i.today),
        when: dueWhen(t.scheduled, i.today),
        dist: dueDist(t.scheduled, i.today),
      };
    }
  }

  // @Projekt-Verweis: nur an Hauptaufgaben, nie im Papierkorb, nicht auf einer Projektseite und
  // nicht, wenn Sektion oder Spalte das Projekt schon in der Überschrift zeigt.
  let backlink: RowPlan["backlink"] = null;
  if (!trash && depth === 0 && !i.onProjectPage) {
    const inbox = isInboxLink(t.project);
    const name = inbox ? null : baseName(t.project!);
    const zeigen = inbox ? i.hideProject !== NO_PROJECT : name !== i.hideProject;
    if (zeigen) backlink = { inbox, text: inbox ? "" : projectDisplayName(name) };
  }

  return {
    classes,
    depth,
    title: t.title,
    description: desc || null,
    // Der Verweis auf die Hauptaufgabe steht nur an Zeilen, die auf oberster Ebene stehen –
    // verschachtelt sieht man die Zugehörigkeit ja.
    parentLink: depth === 0 && t.parent && i.parentTitle !== undefined ? { title: i.parentTitle } : null,
    due,
    deadline,
    recur: !!t.recurrence,
    reminders: t.reminders.map(formatReminder),
    labels: [...t.labels],
    comments: (i.comments ?? 0) > 0 ? (i.comments ?? 0) : null,
    // Das Badge steht an JEDER Hauptaufgabe mit Kindern, auch auf der Karte – dort aber nur als
    // Anzeige (aufklappen ginge nicht, eine Karte nimmt keine verschachtelten Zeilen auf).
    subs: !trash && kids.length
      ? { done: kids.filter((k) => isDone(k.status)).length, total: kids.length, open: !i.flat && !!i.expanded }
      : null,
    backlink,
    trashActions: trash,
  };
}
