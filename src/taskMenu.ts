// Kontextmenü der Aufgabenzeile – EINE Quelle für Liste, Board-Karte und Kalender.
// Rechtsklick (Desktop) bzw. Long-Press (Mobile) auf die Zeile öffnet es; die CHECKBOX behält
// ihr eigenes Status-Menü (taskCheck.ts) – Arbeitsteilung: Checkbox = Status, Zeile = Rest.
// Eigenes Popover (bt-pop) statt Obsidian-Menu, weil die Schnellzeilen (Datum, Priorität)
// horizontale Icon-Buttons brauchen und die Optik der Modal-Popovers hier fortgeführt wird.
// Alle Aktionen rufen bestehende Plugin-Methoden; das Menü ist reine Verdrahtung.
import { setIcon, TFile } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { openPopover, openPopoverAt, popRow } from "./popover";
import { openDatePicker, quickDates } from "./datePicker";
import { CHIPS, PRIOS, PRIO_KEY, ChipHost } from "./chips";
import { listProjectsAndAreas, isInboxLink, copyTaskLink, ProjItem, baseName, INBOX_KEY } from "./taskService";
import { ConfirmModal } from "./confirmModal";
import { isTrashed } from "./statuses";
import { combineDT } from "./format";
import { t } from "./i18n";


/** Icon-Button einer Schnellzeile (Datum/Priorität). Liefert den Button für Sonderfälle. */
function iconButton(row: HTMLElement, label: string, active: boolean, onClick: () => void): HTMLElement {
  const b = row.createEl("button", { cls: "bt-icbtn" + (active ? " is-active" : ""),
    attr: { "aria-label": label, "data-tooltip-position": "top" } });
  b.onclick = (e) => { e.stopPropagation(); onClick(); };
  return b;
}

/** Erinnerungs-Popover der Chip-Leiste an einer BESTEHENDEN Aufgabe: Mini-Host, der jede
 *  Änderung sofort ins Frontmatter schreibt. Das Menü bleibt dabei offen (verschachteltes
 *  Popover wie beim Anzeige-Panel) – so bleibt der Anker lebendig, auch wenn der Nutzer im
 *  Popover weiter zum absoluten Datums-Picker springt. */
function openReminderEditor(plugin: BeautyTasksPlugin, task: Task, anchor: HTMLElement): void {
  const host: ChipHost = {
    plugin, app: plugin.app,
    f: { reminders: [...task.reminders], due: task.due, dueTime: task.dueTime },
    surface: "editor",
    rerender: () => { void plugin.setTaskReminders(task, host.f.reminders ?? []); },
    compactLabels: false, iconsOnly: false,
    applyStatus: () => {}, pinDue: () => {},
  };
  CHIPS.reminder.open(host, anchor);
}

/** Projekt-Picker zum VERSCHIEBEN (ohne Neuanlage-Zeilen): Eingang + Bereiche + Projekte,
 *  aktueller Eintrag markiert. Ein Klick schreibt das Projekt und schließt Picker UND Menü. */
function openMovePicker(plugin: BeautyTasksPlugin, task: Task, anchor: HTMLElement, done: () => void): void {
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  const cur = task.project && !isInboxLink(task.project) ? baseName(task.project) : null;
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-picker");
    const pick = (name: string | null): void => { close(); done(); if (name !== cur) void plugin.setTaskProject(task, name); };
    popRow(pop, "inbox", t("nav_inbox"), () => pick(null), cur === null);
    const group = (title: string, items: ProjItem[]): void => {
      if (!items.length) return;
      pop.createDiv({ cls: "bt-pop-head", text: title });
      for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), cur === it.name, it.color ?? undefined);
    };
    group(t("group_area"), bereiche);
    group(t("group_project"), projekte);
  });
}

/** Pfad der Aufgabe, deren Kontextmenü gerade offen ist – renderTask/decorate hängen die
 *  Halte-Klasse beim Neuzeichnen wieder an (s. Kommentar in showTaskMenu). */
let holdPath: string | null = null;
export const menuHoldPath = (): string | null => holdPath;

export function showTaskMenu(plugin: BeautyTasksPlugin, task: Task, x: number, y: number, doc: Document): void {
  // Die auslösende Zeile „gehovert" halten, bis das Menü schließt – sonst ist nach dem Öffnen
  // nicht mehr erkennbar, WELCHER Aufgabe das Menü gehört. Über den Pfad statt das Element:
  // ein Neuzeichnen bei offenem Menü (z. B. Erinnerung ergänzt) ersetzt die Zeile; renderTask
  // (Liste/Board) und decorate (Kalender) fragen menuHoldPath() ab und halten sie weiter.
  holdPath = task.path;
  const holdSel = `[data-path="${CSS.escape(task.path)}"]`;
  doc.querySelectorAll<HTMLElement>(holdSel).forEach((el) => el.addClass("bt-menu-hold"));
  openPopoverAt(doc, x, y, (pop, close) => {
    pop.addClass("bt-plus");       // Trenner + Danger-Zeilen des „+"-Menüs wiederverwenden
    pop.addClass("bt-taskmenu");
    const row = (icon: string, label: string, fn: () => void, danger = false): HTMLElement => {
      const r = popRow(pop, icon, label, () => { close(); fn(); });
      if (danger) r.addClass("bt-row-danger");
      return r;
    };

    row("pencil", t("menu_edit_task"), () => plugin.openEditTask(task));
    // Nur an Unteraufgaben: Sprung zu ihrer Hauptaufgabe. `index.get` beantwortet Verweis UND
    // Existenz in einem Zug – auf eine gelöschte Hauptaufgabe gäbe es kein Sprungziel.
    // `corner-left-up` markiert diese Beziehung im Plugin bereits an der Zeile, in der Brotkrume
    // des Modals und in dessen „+"-Menü.
    const parent = task.parent ? plugin.index.get(task.parent) : undefined;
    if (parent) row("corner-left-up", t("menu_goto_parent"), () => plugin.openEditTask(parent));
    // „Zum Projekt": führt zur Liste, in der die Aufgabe liegt – auch zum Eingang, denn der ist
    // hier eine Liste wie jede andere (nur ohne Notiz). Mit deren Icon in deren Farbe.
    // Ausgeblendet nur, wenn der Eintrag nirgends hinführte: auf der Seite, die man ansieht.
    const inbox = isInboxLink(task.project);
    const listPath = inbox ? INBOX_KEY : task.project!;
    if (plugin.currentProject !== listPath) {
      const sel = inbox ? undefined
        : (() => { const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
                   const n = baseName(task.project!); return [...bereiche, ...projekte].find((p) => p.name === n); })();
      popRow(pop, inbox ? "inbox" : (sel?.icon ?? "folder"), t("menu_goto_project"),
        () => { close(); void plugin.activateProject(listPath); }, false,
        inbox ? "var(--bt-nav-inbox)" : (sel?.color ?? undefined));
    }
    pop.createDiv({ cls: "bt-plus-sep" });

    // — Datum (setzt `due`): dieselben Icons/Farben wie die Schnellzeilen des Datums-Pickers;
    //   „…" öffnet den vollen Picker. Eine gesetzte Uhrzeit bleibt beim Schnellwechsel erhalten.
    pop.createDiv({ cls: "bt-pop-head", text: t("chip_date") });
    const dates = pop.createDiv({ cls: "bt-menu-icons" });
    for (const q of quickDates()) {
      const b = iconButton(dates, t(q.key), task.due === q.iso,
        () => { close(); void plugin.setTaskDate(task, "due", combineDT(q.iso, task.dueTime)); });
      const ic = b.createSpan({ cls: "bt-icbtn-ic" }); setIcon(ic, q.icon); ic.setCssStyles({ color: q.color });
    }
    const clearB = iconButton(dates, t("date_no_date"), !task.due,
      () => { close(); void plugin.setTaskDate(task, "due", ""); });
    setIcon(clearB.createSpan({ cls: "bt-icbtn-ic" }), "ban");
    // Picker ÖFFNEN, DANN das Menü schließen: er positioniert sich einmalig am noch lebenden Button.
    const moreB = iconButton(dates, t("chip_date"), false, () => {
      openDatePicker(moreB, task.due ? combineDT(task.due, task.dueTime) : "",
        (v) => void plugin.setTaskDate(task, "due", v),
        { value: task.duration, onChange: (d) => void plugin.setTaskDuration(task, d) });
      close();
    });
    setIcon(moreB.createSpan({ cls: "bt-icbtn-ic" }), "more-horizontal");

    // — Priorität: die Checkbox-Ringe der Aufgabenliste (P1 rot / P2 orange / P3 blau / P4 ohne).
    pop.createDiv({ cls: "bt-pop-head", text: t("chip_priority") });
    const prios = pop.createDiv({ cls: "bt-menu-icons" });
    for (const p of PRIOS) {
      const b = iconButton(prios, t(p.key), PRIO_KEY[task.priority] === p.key,
        () => { close(); void plugin.setTaskPriority(task, p.value); });
      const c = b.createSpan({ cls: "bt-check" });
      if (p.value !== "normal") c.dataset.prio = p.value;
    }
    pop.createDiv({ cls: "bt-plus-sep" });

    const remRow = popRow(pop, "alarm-clock", t("reminders_title"), () => openReminderEditor(plugin, task, remRow));
    pop.createDiv({ cls: "bt-plus-sep" });

    const mvRow = popRow(pop, "corner-up-right", t("menu_move_project"), () => openMovePicker(plugin, task, mvRow, close));
    row("copy", t("menu_duplicate"), () => void plugin.duplicateTask(task));
    row("link", t("menu_copy_link"), () => copyTaskLink(plugin.app, task.path));
    row("file-text", t("menu_open_obsidian"), () => {
      const f = plugin.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof TFile) void plugin.app.workspace.getLeaf("tab").openFile(f);
    });
    pop.createDiv({ cls: "bt-plus-sep" });
    // Mit Bestätigung – gleicher Dialog (Titel + Kaskaden-Hinweis) wie das Löschen im Task-Modal.
    row("trash-2", t("btn_delete"), () => {
      new ConfirmModal(plugin.app, {
        title: t("confirm_delete_title", task.title),
        message: t("confirm_delete_cascade"),
      }, () => void plugin.cancelTask(task)).open();
    }, true);
  }, () => {
    holdPath = null;
    doc.querySelectorAll<HTMLElement>(holdSel).forEach((el) => el.removeClass("bt-menu-hold"));
  });
}

/**
 * Event-Delegation für das Zeilen-Kontextmenü – EIN Satz Listener am Container statt je Zeile
 * (gleiches Muster und gleiche Begründung wie installCheckDelegation in taskCheck.ts).
 * Einmal je View aufrufen (onOpen) bzw. je Kalender-Popover; der Container überlebt das
 * Neuzeichnen. Greift auf allem, was einen Aufgaben-Pfad trägt (Listenzeile, Board-Karte,
 * Kalender-Chip/-Block); NICHT auf der Checkbox (Status-Menü) und nicht im Papierkorb
 * (dort gibt es Wiederherstellen/Löschen als Zeilen-Buttons).
 */
export function installTaskMenuDelegation(root: HTMLElement, plugin: BeautyTasksPlugin): void {
  const doc = root.ownerDocument;
  const taskOf = (e: Event): Task | null => {
    const target = e.target as HTMLElement | null;
    const el = target?.closest<HTMLElement>("[data-path]");
    if (!el || !el.dataset.path) return null;
    if (target!.closest(".bt-check")) return null;         // Checkbox -> Status-Menü (taskCheck.ts)
    const task = plugin.index.get(el.dataset.path) ?? null;
    return task && !isTrashed(task.status) ? task : null;
  };

  root.addEventListener("contextmenu", (e) => {
    const task = taskOf(e);
    if (!task) return;
    e.preventDefault(); e.stopPropagation();
    clear();   // falls die Plattform zum Long-Press zusätzlich contextmenu feuert
    showTaskMenu(plugin, task, e.clientX, e.clientY, doc);
  }, true);

  // Touch: Long-Press (~500 ms) öffnet dasselbe Menü (auf Mobile gibt es keinen Rechtsklick).
  let timer: number | null = null;
  let longFired = false;
  const clear = (): void => { if (timer !== null) { window.clearTimeout(timer); timer = null; } };
  root.addEventListener("touchstart", (e) => {
    const task = taskOf(e);
    if (!task) return;
    const p = e.touches[0];
    const x = p.clientX, y = p.clientY;
    longFired = false;
    timer = window.setTimeout(() => { timer = null; longFired = true; showTaskMenu(plugin, task, x, y, doc); }, 500);
  }, { passive: true, capture: true });
  root.addEventListener("touchend", clear);
  root.addEventListener("touchmove", clear);
  root.addEventListener("touchcancel", clear);
  // Nach einem Long-Press den nachlaufenden Click verschlucken – er würde das Edit-Modal öffnen.
  root.addEventListener("click", (e) => {
    if (!longFired) return;
    longFired = false;
    e.preventDefault(); e.stopPropagation();
  }, true);
}
