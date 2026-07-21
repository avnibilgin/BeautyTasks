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
}

export class SubtaskList {
  private wrap!: HTMLElement;
  private input: HTMLInputElement | null = null;
  private unsubscribe: (() => void) | null = null;
  private collapsed = false;    // Sektion zugeklappt (nur für die Lebensdauer des Modals)
  private hideDone = false;     // erledigte Unteraufgaben ausblenden
  private sig = "";             // Signatur der zuletzt gezeichneten Kinder (verhindert Blind-Neuzeichnen)
  private busy = false;         // Anlegen läuft – schützt vor Doppel-Anlage bei schnellem Enter
  private revealed = false;     // Erfassungszeile per „+"-Menü angefordert (auch ohne Unteraufgaben)

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

  /** Beim Schliessen des Modals: getippten, aber nicht mit Enter bestaetigten Text trotzdem
   *  anlegen. Ohne das verschwindet die halb erfasste Unteraufgabe wortlos, sobald man statt
   *  Enter auf „Speichern" klickt – das Feld hat ja bewusst keinen eigenen Senden-Button.
   *  Wird bei „Abbrechen" NICHT gerufen: dort ist Verwerfen die erwartete Bedeutung. */
  flushDraft(): void {
    const raw = this.input?.value.trim() ?? "";
    if (raw) void this.create(raw);
  }

  /** Eingabefeld anfordern und fokussieren („+"-Menü -> „Unteraufgabe hinzufügen"). Blendet
   *  die Sektion ein, auch wenn die Aufgabe noch keine Unteraufgaben hat – das ist der einzige
   *  Weg dorthin, solange sie leer ist. */
  focusComposer(): void {
    this.revealed = true;
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
    const kids = parent ? this.children() : [];
    // Die Sektion kostet nur Platz, wenn sie etwas zeigt: Ohne Unteraufgaben verschwindet sie
    // ganz – der Weg dorthin ist dann „+" -> „Unteraufgabe hinzufügen" (setzt revealed).
    // Eine neue, noch nicht gespeicherte Aufgabe hat gar keine: Ein Kind braucht eine
    // Elternnotiz, auf die sein `parent`-Link zeigen kann.
    const show = !!parent && (kids.length > 0 || this.revealed);
    wrap.toggleClass("bt-hidden", !show);
    if (!show) { wrap.empty(); this.input = null; return; }

    const draft = this.input?.value ?? "";
    const hadFocus = this.input === activeDocument.activeElement;
    wrap.empty();
    this.sig = this.signature();

    const done = kids.filter((k) => isDone(k.status)).length;

    // ── Kopfzeile: Chevron + Titel + Fortschritt, rechts der Erledigt-Schalter ──
    // Nur mit Unteraufgaben: beim erstmaligen Anlegen ueber das „+"-Menue steht hier zunaechst
    // allein die Erfassungszeile, ohne Ueberschrift und Trennlinie ueber einer leeren Liste.
    if (kids.length) {
      const head = wrap.createDiv({ cls: "bt-sec-head" });
      const toggleBtn = head.createEl("button", {
        cls: "bt-sec-toggle",
        attr: { "aria-expanded": String(!this.collapsed), "aria-label": t("subtasks") },
      });
      setIcon(toggleBtn.createSpan({ cls: "bt-sec-caret" }), this.collapsed ? "chevron-right" : "chevron-down");
      toggleBtn.createSpan({ cls: "bt-sec-title", text: t("subtasks") });
      toggleBtn.createSpan({ cls: "bt-sec-count", text: done + "/" + kids.length });
      toggleBtn.onclick = () => { this.collapsed = !this.collapsed; this.render(); };

      if (done) {
        const sw = head.createEl("button", { cls: "bt-sec-act", text: this.hideDone ? t("panel_show_done") : t("subs_hide_done") });
        sw.onclick = () => { this.hideDone = !this.hideDone; this.render(); };
      }

      if (this.collapsed) { this.input = null; return; }
    }

    const body = wrap.createDiv({ cls: "bt-st-body" });
    for (const kid of kids) {
      if (this.hideDone && isDone(kid.status)) continue;
      this.renderRow(body, kid);
    }
    this.renderComposer(body, draft, hadFocus);
  }

  /** Eine Unteraufgabe – gleicher Aufbau wie eine Zeile der Aufgabenliste (heuteView):
   *  Status-Kreis links, daneben ein Textblock aus Titel und – DARUNTER – der Meta-Zeile
   *  (Datum/Wiederholung/Labels). Nicht alles in eine Zeile: sobald ein Titel umbricht,
   *  rutschten die Chips sonst quer durch den Fließtext. */
  private renderRow(body: HTMLElement, kid: Task): void {
    const row = body.createDiv({ cls: "bt-st-row" + (isDone(kid.status) ? " is-done" : "") });
    // Ohne `compact`: die Liste nimmt fuer Unteraufgaben ebenfalls die normale .bt-check und
    // verkleinert sie per CSS – so stimmen Ring, Haekchen und Status-Icon exakt ueberein.
    renderCheck(row, this.plugin, kid);

    const main = row.createDiv({ cls: "bt-st-main", attr: { role: "button", tabindex: "0" } });
    main.createDiv({ cls: "bt-st-lbl", text: kid.title });
    const open = (): void => this.host.openTask(kid);
    main.onclick = open;
    main.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } };

    // Meta-Zeile erst anlegen, wenn sie etwas enthaelt – ein leerer Kasten brauchte sonst
    // seinen Abstand nach oben, ohne etwas zu zeigen.
    let metaEl: HTMLElement | null = null;
    const meta = (): HTMLElement => (metaEl ??= main.createDiv({ cls: "bt-st-meta" }));
    if (kid.due) {
      const chip = meta().createSpan({ cls: "bt-st-chip bt-due", text: formatDateTime(combineDT(kid.due, kid.dueTime), todayStr()) });
      chip.dataset.when = dueWhen(kid.due, todayStr());
    }
    if (kid.recurrence) meta().createSpan({ cls: "bt-st-chip bt-recur" });
    for (const l of kid.labels) meta().createSpan({ cls: "bt-st-chip bt-label", text: l });
    // Enkel nur als Zahl: Im Modal wird bewusst NUR eine Ebene gelistet – tiefer geht es
    // über das Modal der Unteraufgabe selbst.
    const grand = this.plugin.index.children(kid.path).filter((g) => !isTrashed(g.status));
    if (grand.length) {
      const gDone = grand.filter((g) => isDone(g.status)).length;
      const badge = meta().createSpan({ cls: "bt-st-kids", attr: { "aria-label": t("subtasks_progress", gDone, grand.length) } });
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
    // ⤢: Der getippte Text zieht in den vollen Editor um (dort gibt es alle Chips). Das Feld
    // wird dabei VORHER geleert – sonst legte flushDraft() beim Schliessen dieselbe Unteraufgabe
    // noch einmal an, und der volle Editor erzeugte gleich darauf die zweite.
    const full = add.createEl("button", { cls: "bt-st-full", attr: { "aria-label": t("qa_open_full"), "data-tooltip-position": "top" } });
    setIcon(full, "maximize-2");
    full.onclick = () => { const v = inp.value.trim(); inp.value = ""; this.host.openFullEditor(v); };
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
