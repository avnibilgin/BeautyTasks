// Status-Editor – lebt jetzt in den Einstellungen (Custom-Status ist Konfiguration, kein
// Listen-Inhalt). Rendert in einen Container; lokaler Redraw, weil im Settings-Fenster kein
// renderAll()-Kaskaden-Redraw greift (plugin.setStatusX() zeichnet nur die Haupt-Boards neu).
import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { statusLabel, statusIcon, statusTint, StatusKind, StoredStatus } from "./statuses";
import { openPopover } from "./popover";
import { iconBtn, addRow, openColorPicker, confirmInline } from "./manageView";
import { t } from "./i18n";

const KIND_KEY: Record<StatusKind, string> = { open: "status_kind_open", done: "status_kind_done", cancelled: "status_kind_cancelled" };
const KIND_ICON: Record<StatusKind, string> = { open: "circle", done: "check-circle", cancelled: "x-circle" };
// Kuratierte Icon-Auswahl (keine freien Lucide-Namen → nichts kann leer rendern).
const ICON_PRESETS = ["circle", "contrast", "circle-dot", "circle-dashed", "check-circle", "x-circle",
  "clock", "loader", "pause", "play", "flag", "star", "alert-circle", "eye", "inbox", "zap"];

/** Status-Editor in einen Container rendern (Einstellungen-Abschnitt). */
export function renderStatusEditor(container: HTMLElement, plugin: BeautyTasksPlugin): void {
  container.empty();
  // bt-view aktiviert die (unter `.bt-view` gescopten) Manage-/Status-Zeilen-Styles auch im
  // Settings-Fenster; `.bt-view` selbst bringt nur Icon-Variablen, kein Layout.
  container.addClass("bt-view");
  container.addClass("bt-status-editor");
  const redraw = (): void => renderStatusEditor(container, plugin);
  addRow(container, t("status_add"), t("placeholder_status_name"), (v) => plugin.addStatus(v), redraw);
  container.createEl("p", { cls: "bt-manage-hint", text: t("status_hint") });
  const statuses = plugin.getStatuses();
  const list = container.createDiv({ cls: "bt-manage-list" });
  statuses.forEach((s, i) => statusRow(list, plugin, s, i, statuses.length, redraw));
}

/** Mutation + lokaler Redraw (die Status-Liste im Settings-Fenster aktualisiert sich sonst nicht). */
function then(p: Promise<unknown>, redraw: () => void): void { void p.then(redraw); }

function statusRow(list: HTMLElement, plugin: BeautyTasksPlugin, s: StoredStatus, i: number, n: number, redraw: () => void): void {
  const row = list.createDiv({ cls: "bt-manage-row bt-status-row" });

  // Sortier-Pfeile (mobil-sicher).
  const move = row.createDiv({ cls: "bt-status-move" });
  const up = iconBtn(move, "chevron-up", t("btn_move_up"), () => then(plugin.moveStatus(s.id, -1), redraw));
  const down = iconBtn(move, "chevron-down", t("btn_move_down"), () => then(plugin.moveStatus(s.id, 1), redraw));
  if (i === 0) up.disabled = true;
  if (i === n - 1) down.disabled = true;

  // Vorschau: Icon in der Status-Farbe – genau wie später auf dem Board.
  const dot = row.createSpan({ cls: "bt-status-dot" });
  setIcon(dot, statusIcon(s.id));
  dot.style.color = statusTint(s.id);

  const name = row.createSpan({ cls: "bt-manage-name bt-status-name", text: statusLabel(s.id) });
  name.onclick = () => startStatusRename(row, plugin, s, redraw);

  const cnt = plugin.statusTaskCount(s.id);
  if (cnt) row.createSpan({ cls: "bt-manage-count", text: String(cnt) });

  const actions = row.createDiv({ cls: "bt-manage-actions" });
  const kindBtn = actions.createEl("button", { cls: "bt-tab bt-status-kind", text: t(KIND_KEY[s.kind]) });
  kindBtn.onclick = (e) => { e.stopPropagation(); openKindPicker(kindBtn, plugin, s, redraw); };
  const iconB = iconBtn(actions, "shapes", t("status_pick_icon"), () => openIconPicker(iconB, plugin, s, redraw));
  const colB = iconBtn(actions, "palette", t("status_pick_color"), () => openColorPicker(colB, s.color ?? null, (c) => then(plugin.setStatusColor(s.id, c), redraw)));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => then(plugin.deleteStatus(s.id), redraw), redraw));
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
