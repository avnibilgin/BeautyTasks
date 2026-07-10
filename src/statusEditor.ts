// Status-Editor – lebt jetzt in den Einstellungen (Custom-Status ist Konfiguration, kein
// Listen-Inhalt). Rendert in einen Container; lokaler Redraw, weil im Settings-Fenster kein
// renderAll()-Kaskaden-Redraw greift (plugin.setStatusX() zeichnet nur die Haupt-Boards neu).
import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { statusLabel, statusIcon, statusTint, firstOpenStatus, firstDoneStatus, StatusKind, StoredStatus } from "./statuses";
import { openPopover } from "./popover";
import { iconBtn, addRow, openColorPicker, confirmInline, attachRowDrag } from "./manageView";
import { t } from "./i18n";

/** Standard-Rollen (welcher Status wird wofür genommen) – für die Badges im Editor. */
interface StatusRoles { newTask: string; done: string; trash?: string; }

const KIND_KEY: Record<StatusKind, string> = { open: "status_kind_open", done: "status_kind_done", cancelled: "status_kind_cancelled" };
const KIND_ICON: Record<StatusKind, string> = { open: "circle", done: "check-circle", cancelled: "x-circle" };
// Kuratierte Icon-Auswahl (keine freien Lucide-Namen → nichts kann leer rendern).
const ICON_PRESETS = ["circle", "contrast", "circle-dot", "circle-dashed", "check-circle", "x-circle",
  "clock", "loader", "pause", "play", "flag", "star", "alert-circle", "eye", "inbox", "zap"];

// Reihenfolge der Kategorie-Gruppen im Editor (= Lebenszyklus).
const KIND_ORDER: StatusKind[] = ["open", "done", "cancelled"];
// Gruppen-Überschrift: Papierkorb klarer als „Abgebrochen".
const GROUP_TITLE: Record<StatusKind, string> = { open: "status_kind_open", done: "status_kind_done", cancelled: "nav_trash" };

/** Status-Editor in einen Container rendern (Einstellungen-Abschnitt). Nach Kategorie gruppiert:
 *  Offen · Erledigt · Papierkorb – so sind die drei Pflicht-Zustände sichtbar. */
export function renderStatusEditor(container: HTMLElement, plugin: BeautyTasksPlugin): void {
  container.empty();
  // bt-view aktiviert die (unter `.bt-view` gescopten) Manage-/Status-Zeilen-Styles auch im
  // Settings-Fenster; `.bt-view` selbst bringt nur Icon-Variablen, kein Layout.
  container.addClass("bt-view");
  container.addClass("bt-status-editor");
  const redraw = (): void => renderStatusEditor(container, plugin);
  // Kopf: Hinweis links, „Auf Standard zurücksetzen" (mit Bestätigung) rechts.
  const head = container.createDiv({ cls: "bt-status-head" });
  head.createEl("p", { cls: "bt-manage-hint", text: t("status_hint") });
  const resetWrap = head.createDiv({ cls: "bt-status-reset-wrap" });
  const resetBtn = resetWrap.createEl("button", { cls: "bt-chip-reset", text: t("status_reset_default") });
  resetBtn.onclick = () => confirmInline(resetWrap, t("confirm_reset_statuses_q"), () => then(plugin.resetStatuses(), redraw), redraw);
  const statuses = plugin.getStatuses();
  // Standard-Rollen: erster offener = neue Aufgaben, erster erledigt = beim Abhaken, abgebrochen = Papierkorb.
  const roles: StatusRoles = { newTask: firstOpenStatus(), done: firstDoneStatus(), trash: statuses.find((s) => s.kind === "cancelled")?.id };

  // Alle Gruppen-Listen sammeln – beim Drag lesen wir die volle Reihenfolge über alle Gruppen.
  const groupLists: HTMLElement[] = [];
  const persist = (): void => {
    const order: string[] = [];
    for (const g of groupLists) for (const r of Array.from(g.children) as HTMLElement[]) { const k = r.getAttr("data-key"); if (k) order.push(k); }
    then(plugin.setStatusOrder(order), redraw);
  };

  for (const kind of KIND_ORDER) {
    const rows = statuses.filter((s) => s.kind === kind);
    const block = container.createDiv({ cls: "bt-status-group" });
    block.createDiv({ cls: "bt-status-group-title", text: t(GROUP_TITLE[kind]) });
    const listEl = block.createDiv({ cls: "bt-manage-list" });
    groupLists.push(listEl);
    for (const s of rows) statusRow(listEl, plugin, s, rows.length, roles, persist, redraw);
    // Hinzufügen je Gruppe – Papierkorb ist genau 1, dort kein „+".
    if (kind !== "cancelled") addRow(block, t("status_add"), t("placeholder_status_name"), (v) => plugin.addStatus(v, kind), redraw);
  }
}

/** Mutation + lokaler Redraw (die Status-Liste im Settings-Fenster aktualisiert sich sonst nicht). */
function then(p: Promise<unknown>, redraw: () => void): void { void p.then(redraw); }

function statusRow(list: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, groupCount: number, roles: StatusRoles, persist: () => void, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row bt-status-row", attr: { "data-key": s.id } });

  // Sortier-Griff: Drag&Drop (dasselbe System wie Chip-/Nav-Sortierung) + Pfeiltasten (a11y/mobil).
  // Ziehen ordnet innerhalb der Gruppe; persist() liest danach die volle Reihenfolge über alle Gruppen.
  const grip = row.createSpan({ cls: "bt-nav-grip", attr: { role: "button", tabindex: "0", "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
  setIcon(grip, "grip-vertical");
  grip.onkeydown = (e) => {
    if (e.key === "ArrowUp") { e.preventDefault(); then(plugin.moveStatus(s.id, -1), redraw); }
    else if (e.key === "ArrowDown") { e.preventDefault(); then(plugin.moveStatus(s.id, 1), redraw); }
  };
  attachRowDrag(row, grip, list, () => persist());

  // Vorschau: Icon in der Status-Farbe – genau wie später auf dem Board.
  const dot = row.createSpan({ cls: "bt-status-dot" });
  setIcon(dot, statusIcon(s.id));
  dot.style.color = statusTint(s.id);

  const name = row.createSpan({ cls: "bt-manage-name bt-status-name", text: statusLabel(s.id) });
  name.onclick = () => startStatusRename(row, plugin, s, redraw);

  // Rollen-Badge: zeigt, wofür dieser Status automatisch verwendet wird.
  const roleKey = s.id === roles.newTask ? "role_new_tasks" : s.id === roles.done ? "role_on_complete" : s.id === roles.trash ? "role_trash" : null;
  if (roleKey) row.createSpan({ cls: "bt-status-role", text: t(roleKey) });

  const cnt = plugin.statusTaskCount(s.id);
  if (cnt) row.createSpan({ cls: "bt-manage-count", text: String(cnt) });

  const actions = row.createDiv({ cls: "bt-manage-actions" });
  const kindBtn = actions.createEl("button", { cls: "bt-tab bt-status-kind", text: t(KIND_KEY[s.kind]) });
  kindBtn.onclick = (e) => { e.stopPropagation(); openKindPicker(kindBtn, plugin, s, redraw); };
  const iconB = iconBtn(actions, "shapes", t("status_pick_icon"), () => openIconPicker(iconB, plugin, s, redraw));
  const colB = iconBtn(actions, "palette", t("status_pick_color"), () => openColorPicker(colB, s.color ?? null, (c) => then(plugin.setStatusColor(s.id, c), redraw)));
  const delB = iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => then(plugin.deleteStatus(s.id), redraw), redraw));
  // Letzten einer Pflicht-Kategorie (auch den einzigen Papierkorb) nicht löschbar.
  if (groupCount <= 1) delB.disabled = true;
}

function startStatusRename(row: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, redraw: () => void): void {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = statusLabel(s.id);
  const save = async (): Promise<void> => { await plugin.renameStatus(s.id, input.value); redraw(); };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") { e.preventDefault(); void save(); }
    else if (e.key === "Escape") { e.preventDefault(); redraw(); }
  };
  window.setTimeout(() => { input.focus(); input.select(); }, 0);
}

function openKindPicker(anchor: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, redraw: () => void): void {
  openPopover(anchor, (pop, close) => {
    (["open", "done", "cancelled"] as StatusKind[]).forEach((k) => {
      const row = pop.createDiv({ cls: "bt-row" + (s.kind === k ? " is-active" : "") });
      const ic = row.createSpan({ cls: "bt-row-ic" }); setIcon(ic, KIND_ICON[k]);
      row.createSpan({ cls: "bt-row-lbl", text: t(KIND_KEY[k]) });
      row.onclick = () => { then(plugin.setStatusKind(s.id, k), redraw); close(); };
    });
  });
}

function openIconPicker(anchor: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, redraw: () => void): void {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-icon-grid");
    for (const ic of ICON_PRESETS) {
      const b = pop.createEl("button", { cls: "bt-icon-cell" + (s.icon === ic ? " is-active" : ""), attr: { "aria-label": ic } });
      setIcon(b, ic);
      b.onclick = () => { then(plugin.setStatusIcon(s.id, ic), redraw); close(); };
    }
  });
}
