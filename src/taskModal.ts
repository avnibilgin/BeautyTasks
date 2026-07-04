import { Modal, TFile, Notice, setIcon, normalizePath, MarkdownRenderer, Component, FuzzySuggestModal, Menu } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task, Priority } from "./types";
import { createTaskNote, listProjectsAndAreas, createProjectNote, slugify, todayIso, ensureFolder, TaskFields } from "./taskService";
import { formatDateTime, formatDuration, combineDT, dateOf, timeOf } from "./format";
import { openPopover, popRow } from "./popover";
import { openDatePicker } from "./datePicker";
import { parseQuickEntry } from "./quickEntry";
import { LogEntry, readLog, writeLog, readDescription, writeDescription, nowLogTs, formatLogTime } from "./detailLog";
import { TaskPickerModal } from "./searchModal";
import { t, projectDisplayName } from "./i18n";

/** Basename (ohne Ordner/.md) – Aufgaben verlinken Eltern/Projekt über den Basename. */
const baseName = (path: string): string => path.split("/").pop()!.replace(/\.md$/, "");

// 4 Stufen (P1 rot / P2 orange / P3 blau / P4 = ohne). Label-Keys via t().
export const PRIOS: { value: Priority; key: string; color: string }[] = [
  { value: "highest", key: "prio_1", color: "#ef4444" },
  { value: "high", key: "prio_2", color: "#f59e0b" },
  { value: "medium", key: "prio_3", color: "#3b82f6" },
  { value: "normal", key: "prio_4", color: "#9ca3af" },
];
export const PRIO_KEY: Record<Priority, string> = {
  highest: "prio_1", high: "prio_2", medium: "prio_3", normal: "prio_4", low: "prio_4", lowest: "prio_4",
};

const RECUR: { key: string; val: string }[] = [
  { key: "recur_daily", val: "every day" },
  { key: "recur_weekly", val: "every week" },
  { key: "recur_monthly", val: "every month" },
  { key: "recur_quarterly", val: "every 3 months" },
  { key: "recur_yearly", val: "every year" },
];
const recurLabel = (v: string, basis?: "due" | "done"): string => {
  const r = RECUR.find((x) => x.val === v);
  const base = r ? t(r.key) : v;
  return basis === "done" ? base + " · " + t("recur_when_done") : base;
};

/** Aufgaben-Modal im Todoist-Stil – 1:1 zu BeautyTasks (randloser Titel, Chip-Reihe,
 *  Projekt-Picker, CTA). Erfasst neu oder bearbeitet/verschiebt eine bestehende Aufgabe. */
export class TaskModal extends Modal {
  private f: TaskFields & { scheduled?: string | null; recurrence?: string | null };
  private chipBar!: HTMLElement;
  private descInput: HTMLTextAreaElement | null = null;
  private descDirty = false;          // true sobald Nutzer die Beschreibung getippt hat
  private projektBtn!: HTMLButtonElement;
  private detailsWrap!: HTMLElement;
  private logWrap!: HTMLElement;
  private detailsChip?: HTMLElement;   // Büroklammer-Chip, der die Detail-Sektion toggelt
  private logInput: HTMLTextAreaElement | null = null;
  private logComp: Component | null = null;
  private logEntries: LogEntry[] = [];
  private persistChain: Promise<void> = Promise.resolve();
  private duePinned = false;          // true sobald Datum manuell gesetzt -> NL überschreibt nicht mehr
  private cleanTitle = "";            // Titel ohne erkannte Datum-/Label-Token
  private parsedLabels: string[] = []; // aktuell aus dem Titel geparste #Labels (wird bei jedem Parse ersetzt)
  private discarding = false;          // true = bewusst verwerfen („Cancel") -> kein Auto-Speichern
  private persisted = false;           // true sobald geschrieben -> kein Doppel-Speichern

  /** opts.hideProjekt blendet das Projekt-Chip aus (Unteraufgaben-Modus – die
   *  Unteraufgabe erbt Projekt der Hauptaufgabe). opts.parent = Eltern-Basename. */
  constructor(private plugin: BeautyTasksPlugin, private existing?: Task, defaultProject?: string,
              private opts: { hideProjekt?: boolean; parent?: string; defaultLabel?: string; defaultToday?: boolean; defaultTitle?: string } = {}) {
    super(plugin.app);
    this.f = existing
      ? {
          title: existing.title, status: existing.status, due: existing.due, dueTime: existing.dueTime,
          scheduled: existing.scheduled, scheduledTime: existing.scheduledTime, duration: existing.duration,
          priority: existing.priority, recurrence: existing.recurrence, recurBasis: existing.recurBasis,
          project: existing.project ? baseName(existing.project) : null,
          parent: existing.parent ? baseName(existing.parent) : null,
          labels: [...existing.labels],
        }
      : { title: opts.defaultTitle ?? "", priority: "normal", labels: opts.defaultLabel ? [opts.defaultLabel] : [], due: opts.defaultToday ? todayIso() : null, project: defaultProject ?? "Inbox", recurBasis: "due" };
  }

  onOpen(): void {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-task-modal");
    modalEl.toggleClass("bt-chips-icons-only", this.plugin.settings.chipsIconsOnly);   // nur Chip-Icons
    contentEl.empty();

    const placeholder = this.opts.parent ? t("placeholder_subtask") : t("placeholder_taskname");
    const title = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder } });
    title.value = this.f.title;
    title.oninput = () => { this.f.title = title.value; this.applyParse(); this.renderChips(); };
    title.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); void this.save(); } };
    window.setTimeout(() => title.focus(), 0);

    // Beschreibung: freier Markdown-Text, im Body zwischen Titel und Kommentar-Log.
    const desc = contentEl.createEl("textarea", { cls: "bt-beschr", attr: { placeholder: t("placeholder_description"), rows: "1" } });
    desc.value = this.f.description ?? "";
    desc.oninput = () => { this.descDirty = true; this.f.description = desc.value; this.growDesc(); };
    this.descInput = desc;
    window.setTimeout(() => this.growDesc(), 0);

    this.chipBar = contentEl.createDiv({ cls: "bt-chips" });

    // Details = Kommentar-Log (Timeline), einklappbar. Öffnen/Schließen jetzt über den
    // Büroklammer-Chip in der Chip-Leiste (statt der früheren "+ Details"-Zeile). Der Log
    // lebt im Body der Aufgaben-Notiz. Vor renderChips() anlegen, damit der Details-Chip
    // seinen Offen/Zu-Zustand aus logWrap lesen kann.
    this.detailsWrap = contentEl.createDiv({ cls: "bt-details" });
    this.logWrap = this.detailsWrap.createDiv({ cls: "bt-log bt-hidden" });

    this.applyParse();
    this.renderChips();
    this.renderDetailLog();
    this.syncDetails();
    // Bestehende Aufgabe: Log aus dem Notiz-Body laden, bei Inhalt direkt aufgeklappt.
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof TFile) {
        void readDescription(this.app, file).then((d) => {
          if (this.descDirty) return;   // Nutzer hat schon getippt -> nicht überschreiben
          this.f.description = d;
          if (this.descInput) { this.descInput.value = d; this.growDesc(); }
        });
        void readLog(this.app, file).then((entries) => {
          this.logEntries = entries;
          if (entries.length) this.logWrap.removeClass("bt-hidden");
          this.renderDetailLog();
          this.syncDetails();
        });
      }
    }

    // Fußzeile: Projekt-Picker links, Buttons rechts. Im Unteraufgaben-Modus
    // (hideProjekt) entfällt der Projekt-Picker – das Projekt erbt die Hauptaufgabe.
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    if (!this.opts.hideProjekt) {
      this.projektBtn = foot.createEl("button", { cls: "bt-projekt" });
      this.projektBtn.onclick = (e) => this.openProject(e.currentTarget as HTMLElement);
      this.renderProjekt();
    } else {
      foot.createDiv();   // Platzhalter links, damit die Buttons rechts bleiben
    }

    const actions = foot.createDiv({ cls: "bt-actions" });
    const cancel = actions.createEl("button", { text: t("btn_cancel") });
    cancel.onclick = () => { this.discarding = true; this.close(); };
    const submit = actions.createEl("button", { cls: "mod-cta", text: this.existing ? t("btn_save") : t("btn_add_task") });
    submit.onclick = () => void this.save();
  }

  onClose(): void {
    // Auto-Speichern beim Wegklicken / Esc / X (nur mit Titel). „Cancel" verwirft bewusst.
    // persist() ist gegen Doppel-Schreiben geschützt (this.persisted) und braucht kein DOM.
    if (!this.discarding) void this.persist();
    this.logComp?.unload();
    this.contentEl.empty();
  }

  /** Beschreibungs-Textarea an ihren Inhalt anpassen (Auto-Grow, gedeckelt). */
  private growDesc(): void {
    const el = this.descInput; if (!el) return;
    el.setCssStyles({ height: "auto" });
    el.setCssStyles({ height: Math.min(el.scrollHeight, 200) + "px" });
  }

  /** Natural-Language: Datum + #Labels aus dem Titel erkennen und übernehmen.
   *  Datum nur, solange nicht manuell gesetzt; Labels werden ergänzt. */
  private applyParse(): void {
    if (!this.plugin.settings.parseNaturalLanguage) { this.cleanTitle = this.f.title; return; }
    const p = parseQuickEntry(this.f.title);
    this.cleanTitle = p.title;
    if (!this.duePinned && p.faellig) this.f.due = p.faellig;
    if (!this.duePinned && p.time) this.f.dueTime = p.time;   // Uhrzeit („um 07:30") übernehmen
    if (p.priority) this.f.priority = p.priority;             // Priorität („p1") übernehmen
    // Inline-#Labels aus dem Titel bei JEDEM Tastendruck ersetzen (nicht anhäufen) – sonst
    // entstehen beim Tippen von „#wichtig" die Teil-Labels #w, #wi, #wich, … Manuell (Picker/
    // Default) gesetzte Labels bleiben erhalten.
    const manual = this.f.labels!.filter((l) => !this.parsedLabels.includes(l));
    this.parsedLabels = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
    this.f.labels = [...manual, ...this.parsedLabels];
  }

  // ── Chips ──
  private renderChips(): void {
    const bar = this.chipBar; bar.empty();
    this.addChip(bar, "calendar", this.f.due ? formatDateTime(combineDT(this.f.due, this.f.dueTime)) + (this.f.duration ? " · " + formatDuration(this.f.duration) : "") : t("chip_date"), !!this.f.due,
      (el) => this.openDate(el, "due"), () => { this.f.due = null; this.f.dueTime = null; this.f.duration = null; this.duePinned = true; this.renderChips(); });
    this.addChip(bar, "flag", this.f.priority && this.f.priority !== "normal" ? t(PRIO_KEY[this.f.priority]) : t("chip_priority"),
      !!this.f.priority && this.f.priority !== "normal",
      (el) => this.openPrio(el), () => { this.f.priority = "normal"; this.renderChips(); });
    this.addChip(bar, "hash", (this.f.labels && this.f.labels.length) ? this.f.labels : t("chip_label"), !!(this.f.labels && this.f.labels.length),
      (el) => this.openLabels(el), () => { this.f.labels = []; this.renderChips(); });
    this.addChip(bar, "refresh-ccw", this.f.recurrence ? recurLabel(this.f.recurrence, this.f.recurBasis) : t("chip_recurrence"), !!this.f.recurrence,
      (el) => this.openRecur(el), () => { this.f.recurrence = null; this.renderChips(); });
    this.addChip(bar, "alarm-clock", this.f.scheduled ? formatDateTime(combineDT(this.f.scheduled, this.f.scheduledTime)) : t("chip_deadline"), !!this.f.scheduled,
      (el) => this.openDate(el, "scheduled"), () => { this.f.scheduled = null; this.f.scheduledTime = null; this.renderChips(); });
    // Elternaufgabe (macht diese Aufgabe zur Unteraufgabe). Im festen „+ Subtask"-Modus
    // (opts.parent) ausgeblendet – dort steht der Parent bereits fest.
    if (!this.opts.parent) {
      this.addChip(bar, "corner-down-right", this.parentTitle() ?? t("chip_parent"), !!this.f.parent,
        () => this.openParent(), () => { this.f.parent = null; this.renderChips(); },
        { truncate: !!this.f.parent });
    }

    // Details-Chip (Büroklammer): toggelt die Detail-Sektion – ersetzt die frühere
    // "+ Details"-Zeile. Kein Wert-Chip → Offen-Zustand über .is-open (nicht .is-set),
    // damit er auch im Icon-only-Modus stets kompakt bleibt.
    const detailsOpen = !this.logWrap.hasClass("bt-hidden");
    const details = bar.createEl("button", { cls: "bt-chip bt-chip-details" + (detailsOpen ? " is-open" : "") });
    if (this.plugin.settings.chipsIconsOnly) { details.setAttribute("aria-label", t("details")); details.setAttribute("data-tooltip-position", "top"); }
    const dIc = details.createSpan({ cls: "bt-chip-ic" }); setIcon(dIc, "paperclip");
    details.createSpan({ cls: "bt-chip-lbl", text: t("details") });
    details.onclick = (e) => { e.stopPropagation(); this.toggleDetails(); };
    this.detailsChip = details;

    // „+"-Aktionsmenü ganz rechts (nur im Edit-Modus): weitere Aktionen zur Aufgabe –
    // aktuell „Unteraufgabe erstellen" + „Löschen", bewusst erweiterbar. Neue Aufgabe hat
    // (noch) keine Aktionen → kein Button.
    if (this.existing) {
      const acts = bar.createEl("button", { cls: "bt-chip bt-chip-actions", attr: { "aria-label": t("task_actions"), "data-tooltip-position": "top" } });
      setIcon(acts.createSpan({ cls: "bt-chip-ic" }), "plus");
      acts.onclick = (e) => { e.stopPropagation(); this.openActionsMenu(acts); };
    }
  }

  /** „+"-Aktionsmenü zur Aufgabe (Edit-Modus), thematisch gruppiert mit Trennlinien. */
  private openActionsMenu(anchor: HTMLElement): void {
    const menu = new Menu();
    // Erstellen/Bearbeiten
    menu.addItem((i) => i.setTitle(t("menu_create_subtask")).setIcon("corner-down-right").onClick(() => this.addSubtask()));
    // „Übergeordnete Aufgabe anzeigen" nur bei Unteraufgaben (Elternaufgabe im Index vorhanden).
    if (this.parentTask()) {
      menu.addItem((i) => i.setTitle(t("menu_show_parent")).setIcon("corner-left-up").onClick(() => this.showParent()));
    }
    menu.addItem((i) => i.setTitle(t("menu_duplicate")).setIcon("copy").onClick(() => void this.duplicate()));
    menu.addSeparator();
    // Öffnen/Teilen
    menu.addItem((i) => i.setTitle(t("menu_copy_link")).setIcon("link").onClick(() => this.copyLink()));
    menu.addItem((i) => i.setTitle(t("menu_open_obsidian")).setIcon("file-text").onClick(() => this.openInObsidian()));
    menu.addItem((i) => i.setTitle(t("menu_open_editor")).setIcon("external-link").onClick(() => this.openInEditor()));
    menu.addSeparator();
    // Ausgabe
    menu.addItem((i) => i.setTitle(t("menu_print")).setIcon("printer").onClick(() => this.printTask()));
    menu.addSeparator();
    // Gefährlich
    menu.addItem((i) => i.setTitle(t("btn_delete")).setIcon("trash-2").setWarning(true).onClick(() => void this.remove()));
    const r = anchor.getBoundingClientRect();
    menu.showAtPosition({ x: r.left, y: r.bottom + 4 });
  }

  /** Aufgabe duplizieren: aktuellen Stand sichern und als neue Aufgabe („(Kopie)") anlegen. */
  private async duplicate(): Promise<void> {
    const title = this.titleValue();
    if (!title) { new Notice(t("err_enter_taskname")); return; }
    await this.persist();   // laufende Bearbeitung sichern, bevor kopiert wird
    const file = await createTaskNote(this.app, this.plugin.settings, {
      ...this.f, title: title + " " + t("copy_suffix"), status: "todo",
      parent: this.f.parent ?? this.opts.parent ?? null,
    });
    if (this.logEntries.length) await writeLog(this.app, file, this.logEntries);
    new Notice(t("msg_duplicated"));
    this.close();
  }

  /** Obsidian-Deeplink (obsidian://) zur Aufgabe in die Zwischenablage kopieren. */
  private copyLink(): void {
    if (!this.existing) return;
    const vault = encodeURIComponent(this.app.vault.getName());
    const file = encodeURIComponent(this.existing.path.replace(/\.md$/, ""));
    void navigator.clipboard.writeText(`obsidian://open?vault=${vault}&file=${file}`);
    new Notice(t("msg_link_copied"));
  }

  /** Aufgaben-Notiz in einem neuen Obsidian-Tab öffnen. */
  private openInObsidian(): void {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (file instanceof TFile) { void this.app.workspace.getLeaf("tab").openFile(file); this.close(); }
  }

  /** Aufgaben-Notiz im System-Standardeditor (externe App) öffnen. */
  private openInEditor(): void {
    if (!this.existing) return;
    (this.app as unknown as { openWithDefaultApp?: (p: string) => void }).openWithDefaultApp?.(this.existing.path);
    this.close();
  }

  /** Aufgabe drucken: Titel + Meta + Beschreibung in ein verstecktes iframe rendern und drucken.
   *  DOM-basiert (createElement/textContent) – kein document.write, kein Inline-Style. */
  private printTask(): void {
    const doc = activeDocument;
    const title = this.titleValue() || t("placeholder_taskname");
    const meta: string[] = [];
    if (this.f.due) meta.push(t("chip_date") + ": " + formatDateTime(combineDT(this.f.due, this.f.dueTime)));
    if (this.f.priority && this.f.priority !== "normal") meta.push(t("chip_priority") + ": " + t(PRIO_KEY[this.f.priority]));
    if (this.f.labels?.length) meta.push(t("chip_label") + ": " + this.f.labels.map((l) => "#" + l).join(", "));
    if (this.f.project) meta.push(t("group_project") + ": " + projectDisplayName(this.f.project));
    const desc = (this.f.description ?? "").trim();

    const iframe = doc.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.addClass("bt-print-frame");
    doc.body.appendChild(iframe);
    // Inhalt liegt im iframe-Realm → nur Standard-DOM (kein Obsidian-createEl/addClass).
    const idoc = iframe.contentDocument, win = iframe.contentWindow;
    if (!idoc || !win) { iframe.remove(); return; }
    idoc.title = title;
    idoc.body.className = "bt-print";
    const style = idoc.createElement("style");
    style.textContent = ".bt-print{font-family:sans-serif;margin:2cm;color:#111}.bt-print h1{font-size:20pt;margin:0 0 12pt}"
      + ".bt-print ul{padding-left:1.2em;color:#333;font-size:11pt}.bt-print li{margin:2pt 0}"
      + ".bt-print pre{white-space:pre-wrap;font:inherit;font-size:11pt;margin-top:12pt}";
    idoc.head.appendChild(style);
    const h1 = idoc.createElement("h1"); h1.textContent = title; idoc.body.appendChild(h1);
    if (meta.length) {
      const ul = idoc.createElement("ul");
      for (const m of meta) { const li = idoc.createElement("li"); li.textContent = m; ul.appendChild(li); }
      idoc.body.appendChild(ul);
    }
    if (desc) { const pre = idoc.createElement("pre"); pre.textContent = desc; idoc.body.appendChild(pre); }
    win.focus();
    win.print();
    window.setTimeout(() => iframe.remove(), 1000);
  }

  /** Detail-Sektion (Kommentar-Log) auf-/zuklappen – vom Büroklammer-Chip ausgelöst. */
  private toggleDetails(): void {
    const willOpen = this.logWrap.hasClass("bt-hidden");
    this.logWrap.toggleClass("bt-hidden", !willOpen);
    if (willOpen) window.setTimeout(() => this.logInput?.focus(), 0);
    this.syncDetails();
  }

  /** Chip-Zustand + Sichtbarkeit des Detail-Bereichs angleichen: Der Wrapper (und damit sein
   *  Leerraum) verschwindet, wenn die Kommentar-Sektion zu ist – so kein leeres Band unter
   *  den Chips. */
  private syncDetails(): void {
    const logOpen = !this.logWrap.hasClass("bt-hidden");
    this.detailsChip?.toggleClass("is-open", logOpen);
    this.detailsWrap.toggleClass("bt-hidden", !logOpen);
  }

  /** Die aktuell gewählte Elternaufgabe aus dem Index (oder null, wenn keine/nicht gefunden). */
  private parentTask(): Task | null {
    if (!this.f.parent) return null;
    return this.plugin.index.all().find((tk) => baseName(tk.path) === this.f.parent) ?? null;
  }

  /** Titel der aktuell gewählten Elternaufgabe (für das Chip-Label) oder null. */
  private parentTitle(): string | null {
    if (!this.f.parent) return null;
    return this.parentTask()?.title ?? this.f.parent;
  }

  /** Elternaufgabe in ihrer Liste anzeigen (wie die Lupe in der Suche: hinspringen + kurz
   *  hervorheben). Modal schließen, damit die hervorgehobene Zeile sichtbar wird. */
  private showParent(): void {
    const parent = this.parentTask();
    if (!parent) { new Notice(t("err_parent_not_found")); return; }
    this.close();
    void this.plugin.revealTask(parent);
  }

  /** Aufgaben-Picker öffnen und die gewählte Aufgabe als Elternaufgabe setzen. Sich selbst
   *  und alle Nachfahren ausschließen (kein Zyklus); Projekt vom Parent übernehmen. */
  private openParent(): void {
    const exclude = new Set<string>();
    if (this.existing) {
      exclude.add(this.existing.path);
      for (const d of this.plugin.index.descendants(this.existing.path)) exclude.add(d.path);
    }
    const items = this.plugin.index.all().filter((tk) => tk.status !== "cancelled" && !exclude.has(tk.path));
    new TaskPickerModal(this.app, items, t("pick_parent"), (parent) => {
      this.f.parent = baseName(parent.path);
      if (parent.project) this.f.project = baseName(parent.project);   // wie „+ Subtask": Projekt erben
      this.renderChips();
      if (!this.opts.hideProjekt) this.renderProjekt();
    }).open();
  }

  private addChip(bar: HTMLElement, icon: string, label: string | string[], isSet: boolean,
                  onClick: (el: HTMLElement) => void, onClear: () => void,
                  opts: { truncate?: boolean } = {}): void {
    const chip = bar.createEl("button", { cls: "bt-chip" + (isSet ? " is-set" : "") + (opts.truncate ? " bt-chip-truncate" : "") });
    // Icon-only-Modus: leere (ungesetzte) Chips zeigen nur das Icon -> Tooltip mit dem Namen.
    if (this.plugin.settings.chipsIconsOnly && !isSet) {
      chip.setAttribute("aria-label", Array.isArray(label) ? label.join(", ") : label);
      chip.setAttribute("data-tooltip-position", "top");
    }
    const ic = chip.createSpan({ cls: "bt-chip-ic" }); setIcon(ic, icon);
    const lbl = chip.createSpan({ cls: "bt-chip-lbl" });
    // Das „#"-Chip-Icon signalisiert bereits „Label" -> im Text KEIN zweites „#" (sonst „# #wichtig").
    if (Array.isArray(label)) label.forEach((p, i) => { if (i) lbl.createSpan({ cls: "bt-chip-sep", text: " | " }); lbl.appendText(p); });
    else lbl.setText(label);
    // Langer Elternname wird per CSS mit „…" gekürzt; den vollen Namen als Tooltip anbieten,
    // aber nur wenn tatsächlich abgeschnitten wurde (scrollWidth > sichtbare Breite).
    if (opts.truncate) {
      const full = Array.isArray(label) ? label.join(", ") : label;
      if (lbl.scrollWidth > lbl.clientWidth) {
        chip.addClass("is-faded");                 // Fade-Maske am rechten Rand aktivieren
        chip.setAttribute("aria-label", full);
        chip.setAttribute("data-tooltip-position", "top");
      }
    }
    chip.onclick = (e) => { e.stopPropagation(); onClick(chip); };
    if (isSet) { const x = chip.createSpan({ cls: "bt-chip-x" }); setIcon(x, "x"); x.onclick = (e) => { e.stopPropagation(); onClear(); }; }
  }

  // ── Picker ──
  private openDate(anchor: HTMLElement, field: "due" | "scheduled"): void {
    const timeField = field === "due" ? "dueTime" : "scheduledTime";
    const d = this.f[field];
    const value = d ? combineDT(d, this.f[timeField]) : "";
    // Dauer nur am Fälligkeits-Datum anbieten (= Event-Länge im Kalender).
    const dur = field === "due"
      ? { value: this.f.duration ?? null, onChange: (d: number | null) => { this.f.duration = d; this.renderChips(); } }
      : undefined;
    openDatePicker(anchor, value, (v) => {
      this.f[field] = v ? dateOf(v) : null;
      this.f[timeField] = v ? timeOf(v) : null;
      if (field === "due") this.duePinned = true;
      this.renderChips();
    }, dur);
  }

  private openPrio(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      for (const p of PRIOS) {
        popRow(pop, "flag", t(p.key), () => { this.f.priority = p.value; this.renderChips(); close(); }, this.f.priority === p.value, p.color);
      }
    });
  }

  private openRecur(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      const render = () => {
        pop.empty();
        popRow(pop, "x", t("recur_none"), () => { this.f.recurrence = null; this.renderChips(); close(); }, !this.f.recurrence);
        for (const r of RECUR) {
          popRow(pop, "refresh-ccw", t(r.key), () => { this.f.recurrence = r.val; this.renderChips(); render(); }, this.f.recurrence === r.val);
        }
        // Basis-Schalter: nächstes Datum ab Fälligkeit (aus) oder ab Erledigung (an).
        if (this.f.recurrence) {
          pop.createDiv({ cls: "bt-pop-head", text: t("recur_basis") });
          popRow(pop, this.f.recurBasis === "done" ? "check-circle-2" : "circle", t("recur_when_done"),
            () => { this.f.recurBasis = this.f.recurBasis === "done" ? "due" : "done"; this.renderChips(); render(); },
            this.f.recurBasis === "done");
        }
      };
      render();
    });
  }

  /** Label-Picker 1:1 zu BeautyTasks buildTagPicker: Eingabe oben (filtert + Enter legt
   *  neu an), darunter Liste mit #-Icon, Name und rechtsbündiger Häkchen-Box. */
  private openLabels(anchor: HTMLElement): void {
    const known = [...new Set([...this.plugin.index.all().flatMap((task) => task.labels), ...this.plugin.settings.knownLabels])];
    openPopover(anchor, (pop) => {
      pop.addClass("bt-tags");
      const add = pop.createEl("input", { type: "text", cls: "bt-tag-add", attr: { placeholder: t("placeholder_label") } });
      const list = pop.createDiv({ cls: "bt-tag-list" });
      const render = () => {
        list.empty();
        const f = add.value.trim().toLowerCase().replace(/^#/, "");
        const all = [...new Set([...known, ...this.f.labels!])].sort((a, b) => a.localeCompare(b, "de"));
        for (const tag of all) {
          if (f && !tag.toLowerCase().includes(f)) continue;
          const on = this.f.labels!.includes(tag);
          const r = list.createDiv({ cls: "bt-row bt-tag-row" + (on ? " is-active" : "") });
          const ic = r.createSpan({ cls: "bt-row-ic" }); setIcon(ic, "hash");
          r.createSpan({ cls: "bt-row-lbl", text: tag });
          const box = r.createSpan({ cls: "bt-tag-box" }); if (on) setIcon(box, "check");
          r.onclick = () => {
            this.f.labels = on ? this.f.labels!.filter((x) => x !== tag) : [...this.f.labels!, tag];
            this.renderChips(); render();
          };
        }
      };
      render();
      add.oninput = () => render();
      add.onkeydown = (ev) => {
        if (ev.key !== "Enter") return;
        ev.preventDefault();
        const slug = slugify(add.value).toLowerCase().replace(/\s+/g, "-");
        if (!slug) return;
        if (!this.f.labels!.includes(slug)) this.f.labels!.push(slug);
        add.value = ""; this.renderChips(); render();
      };
      window.setTimeout(() => add.focus(), 0);
    });
  }

  private renderProjekt(): void {
    this.projektBtn.empty();
    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
    const all = [eingang, ...bereiche, ...projekte].filter(Boolean) as { name: string; icon: string; color: string | null }[];
    const sel = all.find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    setIcon(ic, sel?.icon ?? (this.f.project ? "folder" : "inbox"));
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: this.f.project ? projectDisplayName(this.f.project) : t("no_project") });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" }); setIcon(car, "chevron-down");
  }

  private openProject(anchor: HTMLElement): void {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      // Nur noch Projekte werden erstellt; Bereiche entstehen durch Umwandeln eines Projekts.
      popRow(pop, "plus", t("pick_new_project"), () => this.startNewProject(pop, close)).addClass("bt-row-action");

      const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name: string) => { this.f.project = name; this.renderProjekt(); close(); };
      if (eingang) popRow(pop, eingang.icon, projectDisplayName(eingang.name), () => pick(eingang.name), this.f.project === eingang.name, eingang.color ?? undefined);
      const group = (title: string, items: { name: string; icon: string; color: string | null }[]) => {
        if (!items.length) return;
        pop.createDiv({ cls: "bt-pop-head", text: title });
        for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), this.f.project === it.name, it.color ?? undefined);
      };
      group(t("group_area"), bereiche);
      group(t("group_project"), projekte);
    });
  }

  private startNewProject(pop: HTMLElement, close: () => void): void {
    pop.empty();
    const inp = pop.createEl("input", { type: "text", cls: "bt-pop-input", attr: { placeholder: t("placeholder_project_name") } });
    inp.onkeydown = async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const name = inp.value.trim();
      if (!name) return;
      const base = await createProjectNote(this.app, this.plugin.settings, name);
      this.f.project = base; this.renderProjekt();
      close();
    };
    window.setTimeout(() => inp.focus(), 0);
  }

  // ── Unteraufgabe ──
  /** „＋ Unteraufgabe": schließt dieses Modal und öffnet ein neues, vollwertiges
   *  Aufgaben-Modal mit ausgeblendetem Projekt-Chip. Projekt = das der Hauptaufgabe,
   *  parent = Eltern-Titel. Genau wie im alten BeautyTasks. */
  private addSubtask(): void {
    if (!this.existing) return;
    const parent = this.existing;
    const parentProject = parent.project ? parent.project.split("/").pop()!.replace(/\.md$/, "") : undefined;
    // Eltern-Link über den Basename (Dateiname), NICHT den Titel – der Titel (Überschrift)
    // kann vom Dateinamen abweichen und würde als Wikilink sonst nicht auflösen.
    const parentBase = parent.path.split("/").pop()!.replace(/\.md$/, "");
    this.close();
    new TaskModal(this.plugin, undefined, parentProject, { hideProjekt: true, parent: parentBase }).open();
  }

  // ── Details: Kommentar-Log (Timeline + Composer) ──
  private logSrc(): string { return this.existing?.path ?? this.plugin.settings.itemsFolder + "/_.md"; }

  /** Timeline der Einträge (Zeitstempel + Markdown + Bearbeiten/Löschen) + Composer. */
  private renderDetailLog(): void {
    const wrap = this.logWrap; wrap.empty();
    this.logComp?.unload();
    this.logComp = new Component(); this.logComp.load();
    const src = this.logSrc();
    const list = wrap.createDiv({ cls: "bt-log-list" });
    // Klicks in den gerenderten Kommentaren: Bilder öffnen die Lightbox, interne
    // Links (Notizen/PDF) öffnen im Tab. MarkdownRenderer verdrahtet im Modal keine
    // Navigation. Delegation am transienten `list` (bei jedem Re-Render neu erzeugt)
    // → kein manuelles Cleanup, kein doppelter Listener.
    list.addEventListener("click", (e) => {
      if (!(e.target instanceof HTMLElement)) return;
      const img = e.target.closest(".bt-log-content img");
      if (img instanceof HTMLImageElement) {
        e.preventDefault();
        const imgs = Array.from(list.querySelectorAll<HTMLImageElement>(".bt-log-content img"));
        this.openLightbox(imgs, imgs.indexOf(img));
        return;
      }
      const link = e.target.closest("a.internal-link");
      if (link) {
        const href = link.getAttribute("data-href") || link.getAttribute("href");
        if (href) { e.preventDefault(); void this.app.workspace.openLinkText(href, src, true); this.close(); }
      }
    });
    this.logEntries.forEach((entry, idx) => {
      const row = list.createDiv({ cls: "bt-log-entry" });
      const head = row.createDiv({ cls: "bt-log-head" });
      head.createDiv({ cls: "bt-log-ts", text: formatLogTime(entry.ts) || "—" });
      const content = row.createDiv({ cls: "bt-log-content" });
      this.renderEntry(content, entry, src);
      const acts = head.createDiv({ cls: "bt-log-actions" });
      const ed = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("log_edit") } });
      setIcon(ed.createSpan(), "pencil");
      ed.onclick = () => this.editEntry(idx, content, src);
      const del = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("btn_delete") } });
      setIcon(del.createSpan(), "trash-2");
      del.onclick = () => { this.logEntries.splice(idx, 1); this.renderDetailLog(); void this.persistLog(); };
    });
    const comp = wrap.createDiv({ cls: "bt-log-composer" });
    const inp = comp.createEl("textarea", { cls: "bt-log-input", attr: { placeholder: t("log_placeholder"), rows: "1" } });
    this.logInput = inp;
    const grow = () => { inp.setCssStyles({ height: "auto" }); inp.setCssStyles({ height: Math.min(inp.scrollHeight, 220) + "px" }); };
    inp.oninput = grow;
    inp.onkeydown = (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); this.addEntry(); } };
    inp.onpaste = (ev) => { const f = ev.clipboardData?.files; if (f && f.length) { ev.preventDefault(); void this.handleFiles(f); } };
    inp.ondragover = (ev) => { ev.preventDefault(); inp.addClass("bt-drop"); };
    inp.ondragleave = () => inp.removeClass("bt-drop");
    inp.ondrop = (ev) => { const f = ev.dataTransfer?.files; if (f && f.length) { ev.preventDefault(); ev.stopPropagation(); inp.removeClass("bt-drop"); void this.handleFiles(f); } };
    const cActs = comp.createDiv({ cls: "bt-log-composer-actions" });
    const attach = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_attach") } });
    setIcon(attach.createSpan(), "paperclip");
    attach.onclick = () => this.pickAttachment();
    const linkBtn = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_link") } });
    setIcon(linkBtn.createSpan(), "link");
    linkBtn.onclick = () => this.pickNote();
    const add = cActs.createEl("button", { cls: "bt-log-add", attr: { "aria-label": t("log_add") } });
    setIcon(add.createSpan(), "send-horizontal");
    add.onclick = () => this.addEntry();
    window.setTimeout(() => { list.scrollTop = list.scrollHeight; }, 0);
  }

  private renderEntry(el: HTMLElement, entry: LogEntry, src: string): void {
    el.empty();
    void Promise.resolve(MarkdownRenderer.render(this.app, entry.body || "", el, src, this.logComp!))
      .catch((e) => console.error("bt-log render", e));
  }

  /** Bild-Lightbox über dem Modal: navigiert über alle Kommentar-Bilder (Pfeiltasten/
   *  Buttons), Esc oder Klick auf den Hintergrund schließt. Das Overlay ist transient –
   *  nur der Tastatur-Listener braucht Cleanup, darum das Fenster fixieren (Popout-Drift). */
  private openLightbox(imgs: HTMLImageElement[], startIndex: number): void {
    if (!imgs.length) return;
    let i = Math.max(0, Math.min(startIndex, imgs.length - 1));
    const many = imgs.length > 1;
    const doc = activeDocument;

    const ov = doc.body.createDiv("bt-lightbox");
    const stage = ov.createDiv("bt-lb-stage");
    const view = stage.createEl("img", { cls: "bt-lb-img" });
    const counter = many ? ov.createDiv("bt-lb-counter") : null;

    const show = () => { view.src = imgs[i].src; counter?.setText((i + 1) + " / " + imgs.length); };
    const go = (d: number) => { i = (i + d + imgs.length) % imgs.length; show(); };
    // Aktuelles Bild als PNG in die Zwischenablage (Canvas -> Blob -> Clipboard-API).
    const copyCurrent = async (): Promise<void> => {
      const img = imgs[i];
      try {
        const canvas = doc.createElement("canvas");
        canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("toBlob returned null");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        new Notice(t("msg_image_copied"));
      } catch (err) {
        console.error("BeautyTasks: copy image failed", err);
        new Notice(t("msg_image_copy_failed"));
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); close(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) { e.preventDefault(); void copyCurrent(); }
      else if (many && e.key === "ArrowLeft") { e.preventDefault(); go(-1); }
      else if (many && e.key === "ArrowRight") { e.preventDefault(); go(1); }
    };
    const close = () => { ov.remove(); doc.removeEventListener("keydown", onKey, true); };

    if (many) {
      const nav = (cls: string, icon: string, label: string, d: number) => {
        const b = ov.createEl("button", { cls: "bt-lb-nav " + cls, attr: { "aria-label": label } });
        setIcon(b, icon);
        b.onclick = (e) => { e.stopPropagation(); go(d); };
      };
      nav("bt-lb-prev", "chevron-left", t("lb_prev"), -1);
      nav("bt-lb-next", "chevron-right", t("lb_next"), 1);
    }
    const copyBtn = ov.createEl("button", { cls: "bt-lb-copy", attr: { "aria-label": t("lb_copy") } });
    setIcon(copyBtn, "copy");
    copyBtn.onclick = (e) => { e.stopPropagation(); void copyCurrent(); };
    const closeBtn = ov.createEl("button", { cls: "bt-lb-close", attr: { "aria-label": t("btn_close") } });
    setIcon(closeBtn, "x");
    closeBtn.onclick = (e) => { e.stopPropagation(); close(); };

    view.onclick = (e) => { e.stopPropagation(); if (many) go(1); };
    ov.onclick = (e) => { if (e.target === ov || e.target === stage) close(); };
    doc.addEventListener("keydown", onKey, true);
    show();
  }

  private addEntry(): void {
    const v = (this.logInput?.value || "").trim();
    if (!v) return;
    this.logEntries.push({ ts: nowLogTs(), body: v });
    this.logWrap.removeClass("bt-hidden");
    this.syncDetails();
    this.renderDetailLog();
    void this.persistLog();
  }

  private editEntry(idx: number, contentEl: HTMLElement, _src: string): void {
    const entry = this.logEntries[idx];
    contentEl.empty();
    const ta = contentEl.createEl("textarea", { cls: "bt-log-edit" });
    ta.value = entry.body || "";
    window.setTimeout(() => { ta.setCssStyles({ height: "auto" }); ta.setCssStyles({ height: (ta.scrollHeight + 2) + "px" }); ta.focus(); }, 0);
    const acts = contentEl.createDiv({ cls: "bt-log-edit-acts" });
    const doSave = () => { entry.body = ta.value.trim(); if (!entry.body) this.logEntries.splice(idx, 1); this.renderDetailLog(); void this.persistLog(); };
    const save = acts.createEl("button", { cls: "bt-log-edit-btn mod-cta", text: t("log_update") });
    save.onclick = doSave;
    const cancel = acts.createEl("button", { cls: "bt-log-edit-btn", text: t("btn_cancel") });
    cancel.onclick = () => this.renderDetailLog();
    ta.onkeydown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) { e.preventDefault(); doSave(); }
      else if (e.key === "Escape") { e.preventDefault(); this.renderDetailLog(); }
    };
  }

  /** Sofort-Speichern – unabhängig vom Modal-Save. Bei neuen Aufgaben (kein File)
   *  wird der Log erst beim Speichern in den Body geschrieben. Serialisiert (Kette). */
  private async persistLog(): Promise<void> {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (!(file instanceof TFile)) return;
    this.persistChain = this.persistChain.then(async () => {
      try { await writeLog(this.app, file, this.logEntries); }
      catch (e) { console.error("bt-log persist", e); new Notice(t("err_detail_save")); }
    });
    return this.persistChain;
  }

  // ── Anhänge ──
  private insertInComposer(text: string): void {
    const el = this.logInput; if (!el) return;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    el.selectionStart = el.selectionEnd = s + text.length;
    el.dispatchEvent(new Event("input"));
    el.focus();
  }

  private async saveAttachment(file: File): Promise<void> {
    const IMG = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "heic"];
    const dir = this.plugin.settings.attachmentsFolder;
    try {
      const name = file.name || ("Pasted-" + Date.now() + "." + (file.type.split("/")[1] || "bin"));
      const buf = await file.arrayBuffer();
      await ensureFolder(this.app, dir);
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let p = normalizePath(dir + "/" + name); let i = 1;
      while (this.app.vault.getAbstractFileByPath(p)) p = normalizePath(dir + "/" + base + "-" + (i++) + ext);
      const tfile = await this.app.vault.createBinary(p, buf);
      const isImage = IMG.includes((name.split(".").pop() || "").toLowerCase());
      const link = this.app.fileManager.generateMarkdownLink(tfile, this.logSrc());
      this.logWrap.removeClass("bt-hidden");
      this.syncDetails();
      this.insertInComposer((isImage ? "!" : "") + link + " ");
      new Notice(t("msg_attached", tfile.name));
    } catch (err) {
      console.error("bt-attachment", err);
      new Notice(t("msg_attach_failed", String((err as Error)?.message || err)));
    }
  }

  private async handleFiles(files: FileList): Promise<void> { for (const f of Array.from(files)) await this.saveAttachment(f); }

  private pickAttachment(): void {
    const fi = createEl("input", { cls: "bt-hidden-file", attr: { type: "file", multiple: "true" } });
    activeDocument.body.appendChild(fi);
    // Einmal-Listener: Element wird nach Auswahl entfernt → kein Leak.
    fi.addEventListener("change", () => { if (fi.files?.length) void this.handleFiles(fi.files); fi.remove(); });
    fi.click();
  }

  private pickNote(): void {
    const app = this.app;
    const src = this.logSrc();
    const insert = (f: TFile) => { this.logWrap.removeClass("bt-hidden"); this.syncDetails(); this.insertInComposer(app.fileManager.generateMarkdownLink(f, src) + " "); };
    class NotePicker extends FuzzySuggestModal<TFile> {
      getItems(): TFile[] { return app.vault.getMarkdownFiles(); }
      getItemText(f: TFile): string { return f.path; }
      onChooseItem(f: TFile): void { insert(f); }
    }
    const picker = new NotePicker(app);
    picker.setPlaceholder(t("log_link_placeholder"));
    picker.open();
  }

  // ── Speichern / Löschen ──
  /** Aktueller (bereinigter) Titel. */
  private titleValue(): string { return (this.cleanTitle || this.f.title).trim(); }

  /** Explizites Speichern (Button/Enter): bei leerem Titel Hinweis + offen bleiben. */
  private async save(): Promise<void> {
    if (!this.titleValue()) { new Notice(t("err_enter_taskname")); return; }
    await this.persist();
    this.close();
  }

  /** Schreibt die Aufgabe (neu anlegen oder Frontmatter aktualisieren). Ohne Titel passiert
   *  nichts (stilles Verwerfen beim Auto-Speichern); nur EINMAL (Schutz gegen Doppel-Schreiben). */
  private async persist(): Promise<void> {
    const title = this.titleValue();
    if (!title || this.persisted) return;
    this.persisted = true;
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof TFile) {
        await this.app.fileManager.processFrontMatter(file, (fm: Record<string, unknown>) => {
          const set = (k: string, v: unknown) => {
            if (v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0)) delete fm[k]; else fm[k] = v;
          };
          set("priority", this.f.priority && this.f.priority !== "normal" ? this.f.priority : null);
          set("due", this.f.due ? combineDT(this.f.due, this.f.dueTime) : null);
          set("scheduled", this.f.scheduled ? combineDT(this.f.scheduled, this.f.scheduledTime) : null);
          set("duration", this.f.duration ?? null);
          set("recurrence", this.f.recurrence);
          set("recur_basis", this.f.recurrence && this.f.recurBasis === "done" ? "done" : null);
          set("project", this.f.project ? "[[" + this.f.project + "]]" : null);
          set("parent", this.f.parent ? "[[" + this.f.parent + "]]" : null);
          set("labels", this.f.labels);
        });
        if (title !== this.existing.title) {
          // Titel steckt in der „# Überschrift" (ungekürzt); Dateiname bleibt der Slug
          // -> kein Umbenennen (bricht sonst Eltern-Links) und keine Längenbegrenzung.
          await this.app.vault.process(file, (c) => c.replace(/^#\s+.*$/m, () => "# " + title));
        }
        // Beschreibung nur schreiben, wenn geladen oder getippt (undefined = Read noch
        // offen und nichts eingegeben -> Body nicht überschreiben).
        if (this.f.description !== undefined) await writeDescription(this.app, file, this.f.description ?? "");
      }
    } else {
      const file = await createTaskNote(this.app, this.plugin.settings, { ...this.f, title, parent: this.f.parent ?? this.opts.parent ?? null });
      if (this.logEntries.length) await writeLog(this.app, file, this.logEntries);
    }
  }

  private async remove(): Promise<void> {
    if (!this.existing) return;
    this.discarding = true;   // Löschen ist kein Bearbeiten -> onClose darf nicht auto-speichern
    // Kaskade: Aufgabe UND alle Unteraufgaben in den Papierkorb (sonst verwaisen Kinder).
    await this.plugin.cancelTask(this.existing);
    this.close();
  }
}
