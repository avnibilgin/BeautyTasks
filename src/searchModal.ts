import { App, FuzzySuggestModal, FuzzyMatch, TFile } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { formatDate, todayStr } from "./format";
import { isDone, isTrashed } from "./statuses";
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
  const done = isDone(task.status);
  el.addClass("bt-search-item");
  // Erledigt = durchgestrichener, gedimmter Titel (wie in der Liste) statt „Erledigt"-Wort.
  el.createDiv({ cls: "bt-search-title" + (done ? " is-done" : ""), text: task.title });
  const meta = el.createDiv({ cls: "bt-search-meta" });
  // Projekt mit @ (Konvention: @ = Projekt/Bereich, # = Label).
  if (task.project) meta.createSpan({ cls: "bt-search-tag", text: "@" + projectBase(task.project) });
  if (task.due) {   // Datum farbcodiert wie in der Liste (offene Aufgaben): überfällig / heute.
    const today = todayStr();
    const cls = done ? "" : task.due < today ? " is-overdue" : task.due === today ? " is-today" : "";
    meta.createSpan({ cls: "bt-search-tag" + cls, text: formatDate(task.due, today) });
  }
  for (const l of task.labels) meta.createSpan({ cls: "bt-search-tag", text: "#" + l });
}

/** Aufgaben-Suche im Command-Palette-Stil: Fuzzy über Titel, Projekt und Labels;
 *  Enter/Klick springt zur Aufgabe in ihrer Liste und hebt sie hervor. */
export class TaskSearchModal extends FuzzySuggestModal<Task> {
  /** Archivierte Projekte bleiben standardmäßig außen vor – wie in Todoist, wo archivierte
   *  Projekte gar nicht erst durchsucht werden. Der Schalter unter dem Suchfeld holt sie zurück;
   *  er ist bewusst NICHT persistent: jede neue Suche beginnt wieder ohne Altlasten. */
  private excludeArchived = true;

  constructor(private plugin: BeautyTasksPlugin) {
    super(plugin.app);
    this.setPlaceholder(t("search_placeholder"));
  }

  onOpen(): void {
    void super.onOpen();
    const bar = this.modalEl.createDiv({ cls: "bt-search-bar" });
    bar.createSpan({ cls: "bt-search-bar-lbl", text: t("search_exclude_archived") });
    const sw = bar.createDiv({
      cls: "bt-panel-switch" + (this.excludeArchived ? " is-on" : ""),
      attr: { role: "switch", "aria-checked": String(this.excludeArchived), tabindex: "0" },
    });
    const toggle = (): void => {
      this.excludeArchived = !this.excludeArchived;
      sw.toggleClass("is-on", this.excludeArchived);
      sw.setAttribute("aria-checked", String(this.excludeArchived));
      // Trefferliste neu berechnen lassen (getItems läuft dabei erneut).
      this.inputEl.dispatchEvent(new Event("input"));
      this.inputEl.focus();
    };
    sw.onclick = toggle;
    sw.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } };
    // Zeile direkt unter das Suchfeld schieben (Obsidian hängt sie sonst ans Modal-Ende).
    this.modalEl.querySelector(".prompt-input-container")?.insertAdjacentElement("afterend", bar);
  }

  getItems(): Task[] {
    const mtime = (tk: Task): number => {
      const f = this.plugin.app.vault.getAbstractFileByPath(tk.path);
      return f instanceof TFile ? f.stat.mtime : 0;
    };
    return this.plugin.index.all()
      .filter((tk) => !isTrashed(tk.status))                                   // ohne Papierkorb
      .filter((tk) => !this.excludeArchived || !this.plugin.index.isProjectArchived(tk.project))
      .sort((a, b) => mtime(b) - mtime(a));   // zuletzt geändert zuerst (leere Suche)
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
