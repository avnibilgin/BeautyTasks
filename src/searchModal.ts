import { App, FuzzySuggestModal, FuzzyMatch } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { formatDate, todayStr } from "./format";
import { t } from "./i18n";

const projectBase = (path: string): string => path.split("/").pop()!.replace(/\.md$/, "");

/** Fuzzy-Suchtext einer Aufgabe: Titel + Projekt + Labels. */
function taskSearchText(task: Task): string {
  const proj = task.project ? projectBase(task.project) : "";
  return [task.title, proj, ...task.labels].join(" ");
}

/** Einheitliche Aufgaben-Zeile für Such-/Picker-Modals (.bt-search-*). */
function renderTaskSuggestion(match: FuzzyMatch<Task>, el: HTMLElement): void {
  const task = match.item;
  el.addClass("bt-search-item");
  el.createDiv({ cls: "bt-search-title", text: task.title });
  const meta = el.createDiv({ cls: "bt-search-meta" });
  if (task.status === "done") meta.createSpan({ cls: "bt-search-tag is-done", text: t("sec_done") });
  if (task.project) meta.createSpan({ cls: "bt-search-tag", text: "#" + projectBase(task.project) });
  if (task.due) meta.createSpan({ cls: "bt-search-tag", text: formatDate(task.due, todayStr()) });
  for (const l of task.labels) meta.createSpan({ cls: "bt-search-tag", text: "#" + l });
}

/** Aufgaben-Suche im Command-Palette-Stil: Fuzzy über Titel, Projekt und Labels;
 *  Enter/Klick springt zur Aufgabe in ihrer Liste und hebt sie hervor. */
export class TaskSearchModal extends FuzzySuggestModal<Task> {
  constructor(private plugin: BeautyTasksPlugin) {
    super(plugin.app);
    this.setPlaceholder(t("search_placeholder"));
  }

  getItems(): Task[] {
    return this.plugin.index.all().filter((tk) => tk.status !== "cancelled");   // ohne Papierkorb
  }

  getItemText(task: Task): string { return taskSearchText(task); }
  renderSuggestion(match: FuzzyMatch<Task>, el: HTMLElement): void { renderTaskSuggestion(match, el); }

  onChooseItem(task: Task): void {
    void this.plugin.revealTask(task);
  }
}

/** Generischer Aufgaben-Picker im gleichen Look wie die Suche: wählt EINE Aufgabe aus
 *  einer vorgegebenen Kandidatenliste und ruft onChoose (z. B. zum Setzen der Elternaufgabe). */
export class TaskPickerModal extends FuzzySuggestModal<Task> {
  constructor(app: App, private items: Task[], placeholder: string, private onChoose: (task: Task) => void) {
    super(app);
    this.setPlaceholder(placeholder);
  }

  getItems(): Task[] { return this.items; }
  getItemText(task: Task): string { return taskSearchText(task); }
  renderSuggestion(match: FuzzyMatch<Task>, el: HTMLElement): void { renderTaskSuggestion(match, el); }
  onChooseItem(task: Task): void { this.onChoose(task); }
}
