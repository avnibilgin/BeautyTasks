// Unteraufgaben-Sektion im Aufgaben-Modal: Fortschritt, abhakbare Liste, Inline-Erfassung.
// Aufgebaut wie DetailLogView (Host-Callbacks + mount/unload), sitzt im selben Detailbereich
// direkt ÜBER dem Kommentar-Log.
//
// Unteraufgaben sind eigene Notizen (`parent: [[basename]]`) – die Sektion schreibt deshalb
// SOFORT in den Vault (anlegen, abhaken, in den Papierkorb), unabhängig vom Speichern-Button
// des Modals. Genau wie das Status-Chip, das ebenfalls live schreibt. Sie hängt am Index
// (subscribe) statt selbst zu zählen, damit Änderungen aus Listen/Kalender sofort ankommen.
import { Notice, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { createTaskNote, todayIso } from "./taskService";
import { formatDateTime, combineDT, dueWhen, todayStr } from "./format";
import { applyQuickEntry, emptyQuickEntryState } from "./quickEntry";
import { renderCheck, installCheckDelegation } from "./taskCheck";
import { isDone, isTrashed } from "./statuses";
import { t } from "./i18n";

/** Callbacks, die das Modal beisteuert. */
export interface SubtaskHost {
  /** Aktuelle Elternaufgabe – null, solange die Aufgabe noch nicht gespeichert ist (dann keine Sektion). */
  parent(): Task | null;
  /** Projekt-Basename, den neue Unteraufgaben erben (null = Eingang). */
  projectBase(): string | null;
  /** Eine Unteraufgabe im eigenen Modal öffnen. */
  openTask(task: Task): void;
  /** Getippten Titel im vollen Editor weiterbearbeiten (⤢). */
  openFullEditor(title: string): void;
  /** Zählerstand hat sich geändert – Modal aktualisiert das Badge am Details-Chip. */
  changed(): void;
}

export class SubtaskList {
  private wrap!: HTMLElement;
  private input: HTMLInputElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private collapsed = false;    // Sektion zugeklappt (nur für die Lebensdauer des Modals)
  private hideDone = false;     // erledigte Unteraufgaben ausblenden
  private sig = "";             // Signatur der zuletzt gezeichneten Kinder (verhindert Blind-Neuzeichnen)
  private busy = false;         // Anlegen läuft – schützt vor Doppel-Anlage bei schnellem Enter

  constructor(private plugin: BeautyTasksPlugin, private host: SubtaskHost) {}

  mount(wrap: HTMLElement): void {
    this.wrap = wrap;
    // Checkbox-Klick/Rechtsklick laufen über dieselbe Delegation wie in den Listen: EIN
    // Listener-Satz am Container, Klick = erledigt, Rechtsklick/Long-Press = Status-Menü.
    // Muss VOR dem ersten Zeichnen stehen; der Container überlebt jedes Neuzeichnen.
    installCheckDelegation(wrap, this.plugin);
    // Der Index meldet jede Änderung (auch die aus Listen/Kalender). Ohne das bliebe die
    // Sektion nach dem Abhaken auf dem alten Stand, bis das Modal neu geöffnet wird.
    this.unsubscribe = this.plugin.index.subscribe(() => this.refresh());
    this.render();
  }

  unload(): void {
    this.unsubscribe?.();
    this.unsubscribe = null;
  }

  /** Erledigt/gesamt der direkten Kinder – für das Badge am Details-Chip. */
  progress(): { done: number; total: number } {
    const kids = this.children();
    return { done: kids.filter((k) => isDone(k.status)).length, total: kids.length };
  }

  /** Eingabefeld fokussieren (Menüpunkt „Unteraufgabe erstellen"). */
  focusComposer(): void {
    this.collapsed = false;
    this.render();
    this.input?.focus();
  }

  /** Direkte Kinder ohne Papierkorb, erledigte ans Ende (wie in Todoist bleibt die
   *  Reihenfolge der offenen stabil, Abgehaktes rutscht nach unten). */
  private children(): Task[] {
    const parent = this.host.parent();
    if (!parent) return [];
    const kids = this.plugin.index.children(parent.path).filter((k) => !isTrashed(k.status));
    return kids.sort((a, b) => Number(isDone(a.status)) - Number(isDone(b.status)));
  }

  /** Nur neu zeichnen, wenn sich an den Kindern wirklich etwas geändert hat: Der Index meldet
   *  JEDE Notiz-Änderung im Vault, ein blindes Neuzeichnen würde dabei den gerade getippten
   *  Text im Eingabefeld verwerfen. */
  private refresh(): void {
    if (this.signature() === this.sig) return;
    this.render();
  }

  private signature(): string {
    return this.children().map((k) => [k.path, k.status, k.title, k.due ?? "", k.priority].join("~")).join("|");
  }

  render(): void {
    const wrap = this.wrap;
    const parent = this.host.parent();
    // Neue, noch nicht gespeicherte Aufgabe: Ein Kind braucht eine Elternnotiz zum Verlinken –
    // die Sektion erscheint deshalb erst nach dem Speichern.
    wrap.toggleClass("bt-hidden", !parent);
    if (!parent) { wrap.empty(); this.input = null; return; }

    const draft = this.input?.value ?? "";
    const hadFocus = this.input === activeDocument.activeElement;
    wrap.empty();
    this.sig = this.signature();

    const kids = this.children();
    const done = kids.filter((k) => isDone(k.status)).length;

    // ── Kopfzeile: Chevron + Titel + Fortschritt, rechts der Erledigt-Schalter ──
    const head = wrap.createDiv({ cls: "bt-sec-head" });
    const toggleBtn = head.createEl("button", {
      cls: "bt-sec-toggle",
      attr: { "aria-expanded": String(!this.collapsed), "aria-label": t("subtasks") },
    });
    setIcon(toggleBtn.createSpan({ cls: "bt-sec-caret" }), this.collapsed ? "chevron-right" : "chevron-down");
    toggleBtn.createSpan({ cls: "bt-sec-title", text: t("subtasks") });
    if (kids.length) toggleBtn.createSpan({ cls: "bt-sec-count", text: done + "/" + kids.length });
    toggleBtn.onclick = () => { this.collapsed = !this.collapsed; this.render(); };

    if (done) {
      const sw = head.createEl("button", { cls: "bt-sec-act", text: this.hideDone ? t("panel_show_done") : t("subs_hide_done") });
      sw.onclick = () => { this.hideDone = !this.hideDone; this.render(); };
    }

    if (this.collapsed) { this.input = null; this.host.changed(); return; }

    const body = wrap.createDiv({ cls: "bt-st-body" });
    for (const kid of kids) {
      if (this.hideDone && isDone(kid.status)) continue;
      this.renderRow(body, kid);
    }
    this.renderComposer(body, draft, hadFocus);
    this.host.changed();
  }

  /** Eine Unteraufgabe: Status-Kreis · Titel · Meta · ✕ (in den Papierkorb). */
  private renderRow(body: HTMLElement, kid: Task): void {
    const row = body.createDiv({ cls: "bt-st-row" + (isDone(kid.status) ? " is-done" : "") });
    renderCheck(row, this.plugin, kid, { compact: true });

    const main = row.createDiv({ cls: "bt-st-main", attr: { role: "button", tabindex: "0" } });
    main.createSpan({ cls: "bt-st-lbl", text: kid.title });
    const open = (): void => this.host.openTask(kid);
    main.onclick = open;
    main.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };

    const meta = main.createSpan({ cls: "bt-st-meta" });
    if (kid.due) {
      const chip = meta.createSpan({ cls: "bt-st-chip bt-due", text: formatDateTime(combineDT(kid.due, kid.dueTime), todayStr()) });
      chip.dataset.when = dueWhen(kid.due, todayStr());
    }
    if (kid.recurrence) meta.createSpan({ cls: "bt-st-chip bt-recur" });
    for (const l of kid.labels) meta.createSpan({ cls: "bt-st-chip bt-label", text: l });
    // Enkel nur als Zahl: Im Modal wird bewusst NUR eine Ebene gelistet – tiefer geht es
    // über das Modal der Unteraufgabe selbst.
    const grand = this.plugin.index.children(kid.path).filter((g) => !isTrashed(g.status));
    if (grand.length) {
      const gDone = grand.filter((g) => isDone(g.status)).length;
      const badge = meta.createSpan({ cls: "bt-st-kids", attr: { "aria-label": t("subtasks_progress", gDone, grand.length) } });
      setIcon(badge.createSpan({ cls: "bt-st-kids-ic" }), "list-checks");
      badge.createSpan({ text: gDone + "/" + grand.length });
    }

    const del = row.createEl("button", { cls: "bt-st-del", attr: { "aria-label": t("menu_cancel_task"), "data-tooltip-position": "top" } });
    setIcon(del, "x");
    del.onclick = (e) => { e.stopPropagation(); void this.plugin.cancelTask(kid); };
  }

  /** Inline-Erfassung: Enter legt an und lässt das Feld für die nächste offen. */
  private renderComposer(body: HTMLElement, draft: string, focus: boolean): void {
    const add = body.createDiv({ cls: "bt-st-add" });
    setIcon(add.createSpan({ cls: "bt-st-add-ic" }), "plus");
    const inp = add.createEl("input", { type: "text", cls: "bt-st-input", attr: { placeholder: t("sub_add") } });
    this.input = inp;
    inp.value = draft;
    inp.onkeydown = (e) => {
      if (e.key === "Enter") { e.preventDefault(); void this.create(inp.value); }
      else if (e.key === "Escape" && inp.value) { e.preventDefault(); e.stopPropagation(); inp.value = ""; }
    };
    // ⤢: Der getippte Text zieht in den vollen Editor um (dort gibt es alle Chips).
    const full = add.createEl("button", { cls: "bt-st-full", attr: { "aria-label": t("qa_open_full"), "data-tooltip-position": "top" } });
    setIcon(full, "maximize-2");
    full.onclick = () => this.host.openFullEditor(inp.value.trim());
    if (focus) window.setTimeout(() => inp.focus(), 0);
  }

  /** Neue Unteraufgabe aus dem Eingabefeld anlegen (mit Texterkennung wie in der Schnelleingabe). */
  private async create(raw: string): Promise<void> {
    const parent = this.host.parent();
    if (!parent || this.busy) return;
    const r = applyQuickEntry(raw,
      { due: null, dueTime: null, priority: "normal", labels: [], project: null, recurrence: null },
      emptyQuickEntryState(),
      // Kein `projects`: @Projekt bleibt außen vor – eine Unteraufgabe erbt das Projekt der Hauptaufgabe.
      { enabled: this.plugin.settings.parseNaturalLanguage, frozen: false, duePinned: false, today: todayIso() });
    const title = r.title.trim();
    if (!title) return;
    this.busy = true;
    const inp = this.input;
    if (inp) inp.value = "";
    try {
      await createTaskNote(this.plugin.app, this.plugin.settings, {
        ...r.fields, title,
        project: this.host.projectBase(),
        parent: parent.path.split("/").pop()!.replace(/\.md$/, ""),
      });
    } catch (err) {
      console.error("BeautyTasks: create subtask failed", err);
      new Notice(t("err_subtask_create"));
      if (inp) inp.value = raw;
    } finally {
      this.busy = false;
      inp?.focus();
    }
  }
}
