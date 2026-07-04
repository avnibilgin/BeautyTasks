import { ItemView, WorkspaceLeaf, TFile, setIcon, MarkdownRenderer, Component, Keymap } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Task } from "./types";
import { todayStr, formatDate, formatDateTime, combineDT, dueWhen } from "./format";
import { openDatePicker } from "./datePicker";
import { listProjectsAndAreas, normalizeLabel } from "./taskService";
import { renderManageInto, iconBtn, confirmInline } from "./manageView";
import { parseRecurrence } from "./recurrence";
import { t, getLocale, projectDisplayName } from "./i18n";

export const VIEW_PREFIX = "beautytasks-";
export type ViewId = "heute" | "demnaechst" | "wiederkehrend" | "erledigt";
export const VIEW_IDS: ViewId[] = ["heute", "demnaechst", "wiederkehrend", "erledigt"];
export const VIEW_MAIN = VIEW_PREFIX + "main";             // EINE Dashboard-Leaf für alle Ansichten
export const VIEW_NAV = VIEW_PREFIX + "nav";
export const OLD_VIEW_TYPES = VIEW_IDS.map((v) => VIEW_PREFIX + v);   // Aufräumen alter Sitzungen
export const VIEW_ICON: Record<ViewId, string> = {
  heute: "calendar-days", demnaechst: "calendar-1", wiederkehrend: "refresh-ccw", erledigt: "check-circle",
};
const TITLE_KEY: Record<ViewId, string> = { heute: "view_today", demnaechst: "view_upcoming", wiederkehrend: "view_recurring", erledigt: "view_done" };
export const viewTitle = (id: ViewId): string => t(TITLE_KEY[id]);

/** Rendert eine Dashboard-Ansicht in ein angehängtes DOM-Element (Deferred-sicher). */
export function renderViewInto(c: HTMLElement, plugin: BeautyTasksPlugin, view: ViewId): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  if (view !== "erledigt") root.createEl("h1", { text: viewTitle(view) });   // „Erledigt" bekommt einen Kopf mit Tabs (unten)

  if (view === "heute" || view === "demnaechst") {
    const add = root.createDiv({ cls: "bt-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    // Nur im Today-Dashboard „heute" vorgeben; sonst ohne Datum.
    add.onclick = () => plugin.openNewTask(undefined, undefined, view === "heute");
  }

  const idx = plugin.index;
  if (view === "heute") {
    const overdue = idx.overdue(today), dueToday = idx.dueToday(today);
    // Heute erledigte Aufgaben – wie in Projekten/Inbox als eigener, einklappbarer Erledigt-Bereich.
    const doneToday = idx.done().filter((tk) => tk.completed === today);
    const present = renderedPaths(plugin, [...overdue, ...dueToday, ...doneToday]);
    section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
    section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
    if (doneToday.length) section(root, plugin, t("sec_done"), doneToday, today, true, false, present);
  } else if (view === "demnaechst") {
    const groups = idx.upcomingByDate(today);
    const nd = idx.noDate();
    const present = renderedPaths(plugin, [...groups.flatMap((g) => g.tasks), ...nd]);
    for (const g of groups) section(root, plugin, groupLabel(g.date, today), g.tasks, today, false, false, present);
    if (nd.length) section(root, plugin, t("sec_no_date"), nd, today, false, false, present);
    if (!groups.length && !nd.length) root.createEl("p", { cls: "bt-empty", text: t("empty_nothing_scheduled") });
  } else if (view === "wiederkehrend") {
    renderRecurring(root, plugin, today);
  } else {
    // „Erledigt" wie Manage: Kopf mit Titel links, Tabs (Erledigt | Papierkorb) rechts.
    const redraw = () => renderViewInto(c, plugin, view);
    const header = root.createDiv({ cls: "bt-manage-header" });
    header.createEl("h1", { text: plugin.doneTab === "trash" ? t("nav_trash") : viewTitle(view) });
    const tabs = header.createDiv({ cls: "bt-tabs" });
    const mkTab = (id: "done" | "trash", label: string) => {
      const b = tabs.createEl("button", { cls: "bt-tab" + (plugin.doneTab === id ? " is-active" : ""), text: label });
      b.onclick = () => { plugin.doneTab = id; redraw(); };
    };
    mkTab("done", t("view_done"));
    mkTab("trash", t("nav_trash"));

    if (plugin.doneTab === "trash") {
      const items = idx.cancelled();
      if (!items.length) { root.createEl("p", { cls: "bt-empty", text: t("empty_trash") }); return; }
      // Globale Aktionen rechtsbündig: Alle wiederherstellen (reversibel) / Papierkorb leeren (Bestätigung).
      const bar = root.createDiv({ cls: "bt-trash-actions" });
      const rAll = bar.createEl("button", { cls: "bt-trash-btn" });
      setIcon(rAll.createSpan(), "archive-restore");
      rAll.createSpan({ text: t("trash_restore_all") });
      rAll.onclick = () => void plugin.restoreAllCancelled();
      const emptyWrap = bar.createDiv({ cls: "bt-trash-act" });
      const emptyBtn = emptyWrap.createEl("button", { cls: "bt-trash-btn is-danger" });
      setIcon(emptyBtn.createSpan(), "trash-2");
      emptyBtn.createSpan({ text: t("trash_empty") });
      emptyBtn.onclick = () => confirmInline(emptyWrap, t("confirm_empty_trash_q"), () => void plugin.emptyTrash(), redraw);
      // Liste identisch zur Erledigt-Liste (dieselben Task-Zeilen), nur im Papierkorb-Modus.
      section(root, plugin, t("nav_trash"), items, today, false, true);
    } else {
      const done = idx.done();
      if (!done.length) root.createEl("p", { cls: "bt-empty", text: t("empty_nothing_done") });
      else section(root, plugin, t("sec_done"), done, today);
    }
  }
}

/** Offene wiederkehrende Aufgaben, gruppiert nach Intervall (Überschrift = Täglich/Wöchentlich/…). */
const RECUR_ORDER = ["recur_daily", "recur_weekly", "recur_monthly", "recur_quarterly", "recur_yearly"];
function recurKey(recurrence: string): string {
  const r = parseRecurrence(recurrence);
  if (r && r.unit === "day" && r.n === 1) return "recur_daily";
  if (r && r.unit === "week" && r.n === 1) return "recur_weekly";
  if (r && r.unit === "month" && r.n === 1) return "recur_monthly";
  if (r && r.unit === "month" && r.n === 3) return "recur_quarterly";
  if (r && r.unit === "year" && r.n === 1) return "recur_yearly";
  return "raw:" + recurrence;   // Sonderintervalle: eigene Gruppe mit dem Rohtext als Titel
}
function renderRecurring(root: HTMLElement, plugin: BeautyTasksPlugin, today: string): void {
  const recs = plugin.index.open().filter((tk) => tk.recurrence);   // open() blendet archivierte Projekte aus
  if (!recs.length) { root.createEl("p", { cls: "bt-empty", text: t("empty_nothing_recurring") }); return; }
  const groups = new Map<string, Task[]>();
  for (const tk of recs) {
    const key = recurKey(tk.recurrence ?? "");
    const arr = groups.get(key); if (arr) arr.push(tk); else groups.set(key, [tk]);
  }
  for (const key of RECUR_ORDER) {
    const items = groups.get(key);
    if (items?.length) section(root, plugin, t(key), items.sort(byDue), today);
  }
  for (const [key, items] of groups) {
    if (key.startsWith("raw:")) section(root, plugin, key.slice(4), items.sort(byDue), today);
  }
}

/** Obsidians „Lesbare Zeilenlänge" respektieren (wie Markdown-Ansichten): Breite +
 *  Zentrierung über --file-line-width, wenn die Einstellung aktiv ist. */
function applyReadableWidth(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  const cfg = (plugin.app.vault as unknown as { getConfig?: (k: string) => unknown }).getConfig?.("readableLineLength");
  c.toggleClass("is-readable-line-width", cfg !== false);   // Standard in Obsidian = an
}

const byDue = (a: Task, b: Task) => (a.due ?? "").localeCompare(b.due ?? "");
export const projectName = (path: string): string => path.split("/").pop()!.replace(/\.md$/, "");

/** „+ Add task"-Zeile eines Boards: links der Hinzufügen-Button, rechts ein dezenter
 *  Link zurück ins ListManager (Projekte- bzw. Labels-Tab) – wie im alten BeautyTasks. */
function addBar(root: HTMLElement, plugin: BeautyTasksPlugin, onAdd: () => void,
  section: "projects" | "labels", linkLabel: string): void {
  const bar = root.createDiv({ cls: "bt-board-bar" });

  const add = bar.createDiv({ cls: "bt-add" });
  add.createSpan({ cls: "bt-add-icon" });
  add.createSpan({ text: t("btn_add_task") });
  add.onclick = onAdd;

  const link = bar.createDiv({ cls: "bt-board-link", attr: { role: "button", tabindex: "0", "aria-label": linkLabel } });
  const lic = link.createSpan({ cls: "bt-board-link-ic" }); setIcon(lic, "arrow-left-square");
  link.createSpan({ text: linkLabel });
  activate(link, () => void plugin.activateManage(section));
}

/** Projekt-Board: alle Aufgaben eines Projekts, nach Status/Datum gruppiert. */
export function renderProjectBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, projectPath: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const name = projectName(projectPath);
  root.createEl("h1", { text: projectDisplayName(name) });

  addBar(root, plugin, () => plugin.openNewTask(name), "projects", t("group_project"));

  // Nach Namen vergleichen: gleichnamige Notizen (altes Board/Liste vs. Projekt-Notiz)
  // hätten sonst verschiedene Pfade -> der Wikilink trifft evtl. die falsche.
  const want = name;
  const tasks = plugin.index.all().filter((t) => t.project != null && projectName(t.project) === want);
  const open = tasks.filter((t) => t.status === "todo" || t.status === "doing");
  const overdue = open.filter((t) => t.due && t.due < today).sort(byDue);
  const dueToday = open.filter((t) => t.due === today);
  const upcoming = open.filter((t) => t.due && t.due > today).sort(byDue);
  const noDate = open.filter((t) => !t.due);
  const done = tasks.filter((t) => t.status === "done").sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));

  if (!tasks.length) { root.createEl("p", { cls: "bt-empty", text: t("empty_no_project_tasks") }); return; }
  const present = renderedPaths(plugin, [...open, ...done]);
  if (overdue.length) section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
  if (dueToday.length) section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
  if (upcoming.length) section(root, plugin, t("sec_upcoming"), upcoming, today, false, false, present);
  if (noDate.length) section(root, plugin, t("sec_no_date"), noDate, today, false, false, present);
  if (done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}

/** Label-Board: alle Aufgaben mit einem Label, nach Status/Datum gruppiert (wie Projekt-Board). */
export function renderLabelBoardInto(c: HTMLElement, plugin: BeautyTasksPlugin, label: string): void {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  root.createEl("h1", { cls: "bt-label-title", text: "#" + label });

  addBar(root, plugin, () => plugin.openNewTask(undefined, label), "labels", t("tab_labels"));

  const tasks = plugin.index.all().filter((tk) => tk.labels.includes(label) && !plugin.index.isProjectArchived(tk.project));
  const open = tasks.filter((tk) => tk.status === "todo" || tk.status === "doing");
  const overdue = open.filter((tk) => tk.due && tk.due < today).sort(byDue);
  const dueToday = open.filter((tk) => tk.due === today);
  const upcoming = open.filter((tk) => tk.due && tk.due > today).sort(byDue);
  const noDate = open.filter((tk) => !tk.due);
  const done = tasks.filter((tk) => tk.status === "done").sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));

  if (!tasks.length) { root.createEl("p", { cls: "bt-empty", text: t("empty_no_label_tasks") }); return; }
  const present = renderedPaths(plugin, [...open, ...done]);
  if (overdue.length) section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
  if (dueToday.length) section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
  if (upcoming.length) section(root, plugin, t("sec_upcoming"), upcoming, today, false, false, present);
  if (noDate.length) section(root, plugin, t("sec_no_date"), noDate, today, false, false, present);
  if (done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}

function groupLabel(dateISO: string, today: string): string {
  const lbl = formatDate(dateISO, today);
  if (lbl === t("date_today") || lbl === t("date_tomorrow") || lbl === t("date_yesterday")) return lbl;
  const wd = new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(dateISO + "T00:00:00"));
  return wd + ", " + lbl;
}

/** Alle Pfade, die in dieser Ansicht real gerendert werden: die Anker-Aufgaben plus ihre
 *  (nicht abgebrochenen) Nachfahren, die renderTask verschachtelt zeichnet. Basis für
 *  Variante A – eine Unteraufgabe gilt als „im Parent aufgehoben", wenn ihr Parent hier
 *  gerendert wird; ist er es nicht, wird die Unteraufgabe eigenständig angezeigt. */
function renderedPaths(plugin: BeautyTasksPlugin, anchors: Task[]): Set<string> {
  const present = new Set<string>();
  const walk = (tk: Task): void => {
    if (present.has(tk.path)) return;
    present.add(tk.path);
    for (const kid of plugin.index.children(tk.path)) if (kid.status !== "cancelled") walk(kid);
  };
  for (const a of anchors) walk(a);
  return present;
}

function section(parent: HTMLElement, plugin: BeautyTasksPlugin, title: string, tasks: Task[], today: string, collapsible = false, trash = false, present?: Set<string>): void {
  // Variante A: Unteraufgaben werden verschachtelt unter ihrem Parent gezeigt, WENN dieser
  // in der Ansicht vorkommt (present). Fehlt der Parent in der Ansicht, erscheint die
  // Unteraufgabe eigenständig als eigene Zeile – statt ganz zu verschwinden.
  // Ohne present (z. B. Papierkorb/Wiederkehrend/Erledigt): altes Verhalten (nur verschachtelt).
  const top = trash ? tasks : tasks.filter((x) => !x.parent || (present !== undefined && !present.has(x.parent)));
  const sec = parent.createDiv({ cls: "bt-section" });
  const head = sec.createEl("h6", { cls: "bt-section-title" });
  head.createSpan({ cls: "bt-section-lbl", text: title });
  head.createSpan({ cls: "bt-section-count", text: String(top.length) });   // Anzahl direkt neben dem Titel
  const list = sec.createDiv({ cls: "bt-list" });
  for (const task of top) renderTask(list, plugin, task, today, 0, trash);

  if (collapsible) {
    // Einklappbar (z. B. „Erledigt"): Chevron rechts in der Überschrift, Klick toggelt.
    sec.addClass("bt-collapsible");
    const chev = head.createSpan({ cls: "bt-collapse-ic" });
    const apply = () => { sec.toggleClass("is-collapsed", plugin.doneCollapsed); setIcon(chev, plugin.doneCollapsed ? "chevron-right" : "chevron-down"); };
    apply();
    head.onclick = () => { plugin.doneCollapsed = !plugin.doneCollapsed; apply(); };
  }
}

// Marker, die einen Link andeuten – nur dann als Markdown rendern (Performance-Guard).
const LINK_MARKERS = /\[\[|]\(|https?:\/\/|obsidian:\/\//;

/** Text in die Zeile schreiben. Enthält er Link-Marker, als (inline) Markdown rendern –
 *  klickbare Wikilinks/URLs/obsidian-Links; sonst schneller Plaintext-Pfad. Genutzt für
 *  Aufgabentitel UND Beschreibungs-Vorschau. */
function renderLinkedText(el: HTMLElement, plugin: BeautyTasksPlugin, text: string, sourcePath: string): void {
  if (!LINK_MARKERS.test(text) || !plugin.titleRenderComp) { el.setText(text); return; }
  el.addClass("bt-md-inline");
  void MarkdownRenderer.render(plugin.app, text, el, sourcePath, plugin.titleRenderComp)
    .catch(() => { el.empty(); el.setText(text); });   // Fallback: Plaintext
  // Klick auf einen Link öffnet den Link (statt das Edit-Modal der Zeile).
  el.addEventListener("click", (e) => {
    const a = (e.target as HTMLElement).closest("a");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    if (a.classList.contains("internal-link")) {
      const href = a.getAttribute("data-href") || a.getAttribute("href") || "";
      void plugin.app.workspace.openLinkText(href, sourcePath, Keymap.isModEvent(e));
    } else {
      const href = a.getAttribute("href");
      if (href) window.open(href);
    }
  });
}

function renderTask(list: HTMLElement, plugin: BeautyTasksPlugin, task: Task, today: string, depth: number, trash = false): void {
  const row = list.createDiv({ cls: "bt-task" + (depth ? " bt-subtask" : "") });
  if (depth) row.style.setProperty("--bt-depth", String(depth));
  row.dataset.path = task.path;
  if (task.status === "done") row.addClass("is-done");
  if (trash) row.addClass("is-cancelled");
  plugin.applyFlash(row, task.path);   // aus der Suche angesprungen? -> hervorheben + ins Bild scrollen

  const check = row.createDiv({ cls: "bt-check" });
  if (trash) { check.addClass("bt-check-x"); setIcon(check, "minus"); }   // Papierkorb: Minus im Kreis
  else if (task.status === "done") check.addClass("is-done");
  // Priorität als farbiger Checkbox-Ring (wie altes BeautyTasks): höchste=rot, hoch=orange,
  // mittel=blau; normal/niedrig neutral.
  else if (task.priority === "highest" || task.priority === "high" || task.priority === "medium") check.dataset.prio = task.priority;
  if (!trash) check.onclick = (e) => { e.stopPropagation(); void plugin.toggleDone(task); };

  const body = row.createDiv({ cls: "bt-body" });
  renderLinkedText(body.createDiv({ cls: "bt-title" }), plugin, task.title, task.path);

  // Beschreibungs-Vorschau (einzeilig, gekürzt) – optional per Einstellung.
  if (plugin.settings.showDescriptionInList) {
    const desc = plugin.index.descriptionOf(task.path).replace(/\s+/g, " ").trim();
    if (desc) renderLinkedText(body.createDiv({ cls: "bt-desc" }), plugin, desc, task.path);
  }

  const meta = body.createDiv({ cls: "bt-meta" });
  if (task.due) {
    const chip = meta.createSpan({ cls: "bt-chip bt-due", text: formatDateTime(combineDT(task.due, task.dueTime), today) });
    chip.dataset.when = dueWhen(task.due, today);
    chip.onclick = (e) => {
      e.stopPropagation();
      openDatePicker(chip, combineDT(task.due!, task.dueTime), (v) => void plugin.setTaskDate(task, "due", v),
        { value: task.duration, onChange: (d) => void plugin.setTaskDuration(task, d) });
    };
  }
  if (task.recurrence) meta.createSpan({ cls: "bt-chip bt-recur" });
  for (const l of task.labels) meta.createSpan({ cls: "bt-chip bt-label", text: l });
  if (task.scheduled) {
    const chip = meta.createSpan({ cls: "bt-chip bt-sched", text: formatDateTime(combineDT(task.scheduled, task.scheduledTime), today) });
    chip.onclick = (e) => { e.stopPropagation(); openDatePicker(chip, combineDT(task.scheduled!, task.scheduledTime), (v) => void plugin.setTaskDate(task, "scheduled", v)); };
  }
  // Kommentare/Anhänge: Büroklammer + dezente Anzahl (wie Todoist). Klick öffnet die Aufgabe.
  const comments = plugin.index.commentsOf(task.path);
  if (comments > 0) {
    const chip = meta.createSpan({ cls: "bt-comments" });
    const ic = chip.createSpan({ cls: "bt-comments-ic" }); setIcon(ic, "paperclip");
    chip.createSpan({ cls: "bt-comments-n", text: String(comments) });
  }

  if (trash) {
    // Papierkorb: rechts zwei Icons – Wiederherstellen + Endgültig löschen (mit Bestätigung).
    const acts = row.createDiv({ cls: "bt-task-actions" });
    iconBtn(acts, "archive-restore", t("btn_restore"), () => void plugin.restoreTask(task));
    iconBtn(acts, "trash-2", t("btn_delete_forever"),
      () => confirmInline(acts, t("confirm_delete_forever_q"), () => void plugin.deleteTaskForever(task.path), () => plugin.renderAll()));
  } else if (task.project && !plugin.currentProject && depth === 0) {
    // In einem Projekt-/Inbox-Board ist der Projektname redundant -> ausblenden; sonst sichtbar.
    // Ebenso bei verschachtelten Unteraufgaben (depth > 0): der Parent darüber zeigt dasselbe
    // Projekt bereits – nur auf Ebene 0 (Hauptaufgabe ODER promotete Unteraufgabe) anzeigen.
    const extras = row.createDiv({ cls: "bt-extras" });
    const name = task.project.split("/").pop()!.replace(/\.md$/, "");
    const bl = extras.createEl("a", { cls: "bt-backlink", text: "#" + projectDisplayName(name) });
    bl.onclick = (e) => { e.stopPropagation(); openPath(plugin, task.project!); };
  }
  // Klick auf die Zeile öffnet die Aufgabe (kein separater Stift – wäre redundant).
  row.onclick = () => plugin.openEditTask(task);

  // Unteraufgaben verschachtelt darunter (eingerückt nach Tiefe) – nicht im Papierkorb.
  if (!trash) for (const kid of plugin.index.children(task.path)) {
    if (kid.status !== "cancelled") renderTask(list, plugin, kid, today, depth + 1);
  }
}

function openPath(plugin: BeautyTasksPlugin, path: string): void {
  const f = plugin.app.vault.getAbstractFileByPath(path);
  if (f instanceof TFile) void plugin.app.workspace.getLeaf(false).openFile(f);
}

// ── Linke Navigation ─────────────────────────────────────────────
interface NavItemOpts { cls?: string; icon: string; iconColor?: string | null; label: string; count?: number; active?: boolean; onClick: () => void; }

/** Div klick- UND tastaturbedienbar machen (role=button/tabindex kommen vom Aufrufer):
 *  Klick + Enter/Space lösen dieselbe Aktion aus. So bleibt die Optik 1:1 wie zuvor. */
function activate(el: HTMLElement, handler: () => void): void {
  el.onclick = handler;
  el.onkeydown = (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handler(); } };
}

/** Ein Nav-Eintrag (Div wie bisher, aber per role=button/tabindex tastaturbedienbar). */
function navItem(c: HTMLElement, o: NavItemOpts): void {
  const item = c.createDiv({ cls: "bt-nav-item" + (o.active ? " is-active" : "") + (o.cls ? " " + o.cls : ""), attr: { role: "button", tabindex: "0" } });
  const ic = item.createSpan({ cls: "bt-nav-ic" }); setIcon(ic, o.icon); if (o.iconColor) ic.setCssStyles({ color: o.iconColor });
  item.createSpan({ cls: "bt-nav-lbl", text: o.label });
  if (o.count) item.createSpan({ cls: "bt-nav-count", text: String(o.count) });
  activate(item, o.onClick);
}

/** Ein-/ausklappbare Abschnittsüberschrift: Chevron-Toggle (Zustand persistent) + „+",
 *  das nur beim Hover/Fokus der Zeile erscheint. Gibt zurück, ob der Abschnitt eingeklappt ist. */
function navHead(c: HTMLElement, plugin: BeautyTasksPlugin, id: string, title: string,
  tip: string, placeholder: string, redraw: () => void, submit: (v: string) => Promise<unknown>): boolean {
  const collapsed = plugin.isNavCollapsed(id);
  const head = c.createDiv({ cls: "bt-nav-head" });

  // Label links (füllt die Zeile) = tastatur-/klickbarer Umschalter.
  const toggle = head.createDiv({ cls: "bt-nav-head-toggle", attr: { role: "button", tabindex: "0", "aria-expanded": String(!collapsed) } });
  toggle.createSpan({ cls: "bt-nav-head-lbl", text: title });
  activate(toggle, () => void plugin.toggleNavSection(id));

  // „+" (nur bei Hover/Fokus) direkt links vom Chevron.
  const add = head.createDiv({ cls: "bt-nav-head-add", attr: { role: "button", tabindex: "0", "aria-label": tip, "data-tooltip-position": "top" } });
  setIcon(add, "plus");
  activate(add, () => {
    const input = createEl("input", { type: "text", cls: "bt-nav-add-input", attr: { placeholder } });
    head.insertAdjacentElement("afterend", input);
    const close = () => { input.onblur = null; redraw(); };
    const commit = () => void (async () => {
      input.onblur = null;
      const v = input.value.trim();
      if (v) {
        await submit(v);
        plugin.settings.navCollapsed[id] = false;   // neu Angelegtes soll sichtbar sein
        await plugin.saveSettings();
      }
      redraw();
    })();
    input.onkeydown = (e2) => {
      if (e2.key === "Enter") { e2.preventDefault(); commit(); }
      else if (e2.key === "Escape") { e2.preventDefault(); close(); }
    };
    input.onblur = close;
    window.setTimeout(() => input.focus(), 0);
  });

  // Chevron ganz rechts (über der Badge-Spalte). Tastatur läuft über den Label-Toggle,
  // daher hier nur Maus-Affordanz + Zustandsanzeige (aria-hidden, nicht tabbierbar).
  const chev = head.createDiv({ cls: "bt-nav-head-chevron", attr: { "aria-hidden": "true" } });
  setIcon(chev, collapsed ? "chevron-right" : "chevron-down");
  chev.onclick = () => void plugin.toggleNavSection(id);

  return collapsed;
}

export function renderNavInto(c: HTMLElement, plugin: BeautyTasksPlugin): void {
  c.empty();
  c.addClass("bt-nav");
  const redraw = () => renderNavInto(c, plugin);

  const { eingang, bereiche, projekte } = listProjectsAndAreas(plugin.app);

  // „Aufgabe hinzufügen" ganz oben (Todoist-Stil): öffnet die kompakte Schnell-Erfassung.
  navItem(c, { cls: "bt-nav-add-task", icon: "sparkles", label: t("btn_add_task"), onClick: () => plugin.openQuickAdd() });

  // „Suchen" darunter: öffnet die Aufgaben-Suche (Command-Palette-Stil).
  navItem(c, { cls: "bt-nav-search", icon: "search", label: t("nav_search"), onClick: () => plugin.openSearch() });

  // Inbox ganz oben, OHNE Abschnittsüberschrift (über den Ansichten).
  if (eingang && !eingang.hidden) {
    navItem(c, {
      cls: "bt-nav-inbox", icon: eingang.icon, iconColor: eingang.color, label: projectDisplayName(eingang.name),
      count: plugin.index.byProject(eingang.path).length, active: plugin.currentProject === eingang.path,
      onClick: () => void plugin.activateProject(eingang.path),
    });
  }

  for (const id of VIEW_IDS) {
    const active = !plugin.currentProject && !plugin.currentLabel && !plugin.manageOpen && plugin.currentView === id;
    // Klasse pro Board (bt-nav-heute …) für einzeln themebare Icon-Farben.
    navItem(c, { cls: "bt-nav-" + id, icon: VIEW_ICON[id], label: viewTitle(id), count: navCount(plugin, id), active, onClick: () => void plugin.activateView(id) });
  }

  // cls = Kategorie-Klasse (bt-nav-area / bt-nav-project) für eine gemeinsame Icon-Farbe je Gruppe.
  const projItems = (items: { name: string; path: string; icon: string; color: string | null; hidden: boolean }[], cls: string) => {
    for (const p of items.filter((x) => !x.hidden)) {   // in der Verwaltung ausgeblendete weglassen
      navItem(c, {
        cls, icon: p.icon, iconColor: p.color, label: p.name, count: plugin.index.byProject(p.path).length,
        active: plugin.currentProject === p.path, onClick: () => void plugin.activateProject(p.path),
      });
    }
  };

  // Labels-Sektion (über den Bereichen): Header mit Chevron + „+", darunter die sichtbaren Labels.
  const labelsCollapsed = navHead(c, plugin, "labels", t("tab_labels"), t("add_label"), t("placeholder_label"), redraw, async (v) => {
    const nu = normalizeLabel(v);
    const ok = await plugin.addLabel(v);
    if (ok && nu) await plugin.setLabelVisible(nu, true);   // aus der Nav erstellt -> gleich sichtbar
  });
  if (!labelsCollapsed) for (const name of plugin.getVisibleLabels()) {
    const count = plugin.index.byLabel(name).length;   // byLabel nutzt open() → ohne archivierte Projekte
    navItem(c, { cls: "bt-nav-label", icon: "hash", label: name, count, active: plugin.currentLabel === name, onClick: () => void plugin.activateLabel(name) });
  }

  // Bereiche: Header „+" legt eine Notiz direkt als Bereich (type: area) an.
  const areasCollapsed = navHead(c, plugin, "areas", t("group_area"), t("pick_new_area"), t("placeholder_area_name"), redraw,
    (v) => plugin.createProject(v, true));
  if (!areasCollapsed) projItems(bereiche, "bt-nav-area");

  // Projekte: Header „+" legt ein neues Projekt an.
  const projCollapsed = navHead(c, plugin, "projects", t("group_project"), t("pick_new_project"), t("placeholder_project_name"), redraw,
    (v) => plugin.createProject(v));
  if (!projCollapsed) projItems(projekte, "bt-nav-project");

  // „Verwalten" unten: Projekte/Bereiche archivieren, ein-/ausblenden, umwandeln, löschen.
  navItem(c, { cls: "bt-nav-manage", icon: "list-plus", label: t("manage_full"), active: plugin.manageOpen, onClick: () => void plugin.activateManage() });
}

function navCount(plugin: BeautyTasksPlugin, id: ViewId): number {
  const today = todayStr();
  if (id === "heute") return plugin.index.overdue(today).length + plugin.index.dueToday(today).length;
  if (id === "demnaechst") return plugin.index.upcoming(today).length;
  if (id === "wiederkehrend") return plugin.index.open().filter((tk) => tk.recurrence).length;
  return 0;
}

/** Eine Dashboard-Ansicht. Rendern macht der Plugin-Code direkt ins DOM
 *  (renderAllViews), unabhängig von onOpen (robust gegen aufgeschobene Views). */
/** EINE Dashboard-Leaf für alle Ansichten. Welche Ansicht gezeigt wird, steht in
 *  plugin.currentView; Umschalten = nur neu zeichnen (kein neuer Leaf/Tab). */
export class MainView extends ItemView {
  private unsub: (() => void) | null = null;
  private renderComp: Component | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: BeautyTasksPlugin) { super(leaf); }
  getViewType(): string { return VIEW_MAIN; }
  getDisplayText(): string { return "BeautyTasks"; }   // statischer Header (Tab + Pane) = Programmname
  getIcon(): string { return VIEW_ICON.erledigt; }   // statisch = „Erledigt"-Icon (check-circle)
  async onOpen(): Promise<void> {
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose(): Promise<void> { this.unsub?.(); this.unsub = null; this.plugin.titleRenderComp = null; }
  draw(): void {
    if (!this.contentEl) return;
    // Frische Render-Component pro Zeichnung: Markdown-Titel (Links) sauber auf-/abbauen,
    // damit sich Hover-/Embed-Kindkomponenten nicht über Redraws hinweg ansammeln.
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new Component());
    this.plugin.titleRenderComp = this.renderComp;
    if (this.plugin.manageOpen) renderManageInto(this.contentEl, this.plugin);
    else if (this.plugin.currentLabel) renderLabelBoardInto(this.contentEl, this.plugin, this.plugin.currentLabel);
    else if (this.plugin.currentProject) renderProjectBoardInto(this.contentEl, this.plugin, this.plugin.currentProject);
    else renderViewInto(this.contentEl, this.plugin, this.plugin.currentView);
    this.syncTitle();
  }

  /** Tab UND Pane-Header (zwei getrennte Elemente) auf die aktuelle Seite bringen –
   *  sonst bleibt der Titel beim zuerst geöffneten View hängen. */
  private syncTitle(): void {
    (this.leaf as WorkspaceLeaf & { updateHeader?: () => void }).updateHeader?.();   // Tab
    const titleEl = this.containerEl.querySelector<HTMLElement>(".view-header-title");
    if (titleEl) titleEl.setText(this.getDisplayText());                              // Pane-Header
  }
}

export class NavView extends ItemView {
  private unsub: (() => void) | null = null;
  constructor(leaf: WorkspaceLeaf, private plugin: BeautyTasksPlugin) { super(leaf); }
  getViewType(): string { return VIEW_NAV; }
  getDisplayText(): string { return "BeautyTasks"; }
  getIcon(): string { return "list-checks"; }
  async onOpen(): Promise<void> {
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose(): Promise<void> { this.unsub?.(); this.unsub = null; }
  draw(): void { if (this.contentEl) renderNavInto(this.contentEl, this.plugin); }
}
