// Chip-Registry: eine gemeinsame Quelle für die Attribut-Chips beider Eingabe-Modale
// (Schnelleingabe + voller Editor). Kapselt Konstanten (Prioritäten/Wiederholung), die Picker
// (Datum, Priorität, Status, Wiederholung, Labels, Erinnerungen, Übergeordnet) und die
// Sichtbarkeits-/Reihenfolge-Logik (chipOrder/chipTiers). Beide Modale rendern über CHIPS und
// nutzen dieselben Picker – keine Duplikate mehr.
import { App, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority, TaskStatus, ChipId, ChipTier, ChipSurface, ChipProfile, CHIP_IDS, BeautyTasksSettings } from "./types";
import { formatDateTime, formatDuration, combineDT, dateOf, timeOf } from "./format";
import { boardStatuses, statusLabel, statusIcon, statusTint, firstOpenStatus, isTrashed } from "./statuses";
import { openDatePicker } from "./datePicker";
import { formatReminder } from "./reminders";
import { openPopover, popRow } from "./popover";
import { TaskPickerModal } from "./searchModal";
import { slugify } from "./taskService";
import { t } from "./i18n";

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
// Priorität -> Kurz-Kürzel „P1"–„P3" (normal/low = keine Anzeige) für kompakte Chip-Labels.
const PRIO_NUM: Record<Priority, number | null> = { highest: 1, high: 2, medium: 3, normal: null, low: null, lowest: null };

export const RECUR: { key: string; val: string }[] = [
  { key: "recur_daily", val: "every day" },
  { key: "recur_weekly", val: "every week" },
  { key: "recur_monthly", val: "every month" },
  { key: "recur_quarterly", val: "every 3 months" },
  { key: "recur_yearly", val: "every year" },
];
export const recurLabel = (v: string, basis?: "due" | "done"): string => {
  const r = RECUR.find((x) => x.val === v);
  const base = r ? t(r.key) : v;
  return basis === "done" ? base + " · " + t("recur_when_done") : base;
};

/** Feld-Zustand, auf dem die Chips arbeiten (Schnittmenge beider Modale). Optionalität spiegelt
 *  TaskFields, damit TaskModal.f direkt zuweisbar ist; Picker greifen defensiv (?? []). */
export interface ChipFields {
  status?: TaskStatus;
  due?: string | null; dueTime?: string | null; duration?: number | null;
  scheduled?: string | null; scheduledTime?: string | null;
  priority?: Priority;
  labels?: string[];
  recurrence?: string | null; recurBasis?: "due" | "done";
  reminders?: string[];
  parent?: string | null;
}

/** Brücke Modal ⇄ Chip: liefert Feldzustand + Callbacks, die pro Modal unterschiedlich sind
 *  (Status live schreiben, Datum „pinnen", Details-Sektion toggeln, Parent-Ausschluss …). */
export interface ChipHost {
  plugin: BeautyTasksPlugin;
  app: App;
  f: ChipFields;
  surface: ChipSurface;                   // eigene Chip-Konfiguration je Fläche (Editor/Schnelleingabe)
  rerender(): void;                       // Chip-Leiste neu zeichnen
  compactLabels: boolean;                 // true = Priorität als „P1" (Schnelleingabe), sonst voll
  iconsOnly: boolean;                     // leere Chips nur als Icon (Schnelleingabe immer; Editor per Setting)
  applyStatus(s: TaskStatus): void;       // Status übernehmen (Editor: live schreiben)
  pinDue(): void;                         // Datum manuell gesetzt/geleert -> NL überschreibt nicht
  /** ✕ am Datums-Chip: Kam der Wert aus dem Titel („morgen"), dort den Auslöser escapen, statt nur
   *  das Feld zu leeren – sonst bliebe das Wort aus dem Titel gestrippt. true = übernommen. */
  unparseDue?(): boolean;
  resetParsedLabels?(): void;             // Schnelleingabe: manuelle Label-Änderung entkoppelt vom Parser
  existingPath?: string;                  // vorhandene Aufgabe -> Selbst/Nachfahren im Parent-Picker ausschließen
  onParentPicked?(projectBase: string | null): void;  // Parent gewählt -> ggf. Projekt erben + neu zeichnen
  toggleDetails?(anchor: HTMLElement): void;  // Details-Chip (Editor: Log · Schnelleingabe: Beschreibung)
  detailsOpen?(): boolean;                // Offen-Zustand des Details-Chips
  chipEnabled?(id: ChipId): boolean;      // Chip in diesem Modal überhaupt anbieten (Default true)
}

/** Eine Chip-Definition. `kind` steuert das Rendering: value = Wert-Chip mit ✕, status = fixes
 *  Label ohne ✕, details = Toggle (is-open statt is-set). */
export interface ChipDef {
  id: ChipId;
  icon: string;
  nameKey: string;                                     // i18n-Key des Chip-Namens (Tooltip/Menü/Settings)
  kind: "value" | "status" | "details";
  isSet(f: ChipFields, host: ChipHost): boolean;
  valueLabel(f: ChipFields, host: ChipHost): string | string[];
  open(host: ChipHost, anchor: HTMLElement): void;
  clear(host: ChipHost): void;
}

// ── Picker (aus TaskModal extrahiert, host-getrieben) ──
function openDate(host: ChipHost, anchor: HTMLElement, field: "due" | "scheduled"): void {
  const f = host.f;
  const timeField = field === "due" ? "dueTime" : "scheduledTime";
  const d = f[field];
  const value = d ? combineDT(d, f[timeField]) : "";
  // Dauer nur am Fälligkeits-Datum anbieten (= Event-Länge im Kalender).
  const dur = field === "due"
    ? { value: f.duration ?? null, onChange: (v: number | null) => { f.duration = v; host.rerender(); } }
    : undefined;
  openDatePicker(anchor, value, (v) => {
    f[field] = v ? dateOf(v) : null;
    f[timeField] = v ? timeOf(v) : null;
    if (field === "due") host.pinDue();
    host.rerender();
  }, dur);
}

function openPrio(host: ChipHost, anchor: HTMLElement): void {
  openPopover(anchor, (pop, close) => {
    for (const p of PRIOS) {
      popRow(pop, "flag", t(p.key), () => { host.f.priority = p.value; host.rerender(); close(); }, host.f.priority === p.value, p.color);
    }
  });
}

function openStatus(host: ChipHost, anchor: HTMLElement): void {
  openPopover(anchor, (pop, close) => {
    for (const s of boardStatuses()) {
      popRow(pop, statusIcon(s.id), statusLabel(s.id), () => { host.applyStatus(s.id); close(); }, (host.f.status ?? firstOpenStatus()) === s.id);
    }
  });
}

function openRecur(host: ChipHost, anchor: HTMLElement): void {
  const f = host.f;
  openPopover(anchor, (pop, close) => {
    const render = () => {
      pop.empty();
      popRow(pop, "x", t("recur_none"), () => { f.recurrence = null; host.rerender(); close(); }, !f.recurrence);
      for (const r of RECUR) {
        popRow(pop, "refresh-ccw", t(r.key), () => { f.recurrence = r.val; host.rerender(); render(); }, f.recurrence === r.val);
      }
      if (f.recurrence) {
        pop.createDiv({ cls: "bt-pop-head", text: t("recur_basis") });
        popRow(pop, f.recurBasis === "done" ? "check-circle-2" : "circle", t("recur_when_done"),
          () => { f.recurBasis = f.recurBasis === "done" ? "due" : "done"; host.rerender(); render(); },
          f.recurBasis === "done");
      }
    };
    render();
  });
}

function openLabels(host: ChipHost, anchor: HTMLElement): void {
  const f = host.f;
  f.labels ??= [];
  const known = [...new Set([...host.plugin.index.all().flatMap((task) => task.labels), ...host.plugin.settings.knownLabels])];
  openPopover(anchor, (pop) => {
    pop.addClass("bt-tags");
    const add = pop.createEl("input", { type: "text", cls: "bt-tag-add", attr: { placeholder: t("placeholder_label") } });
    const list = pop.createDiv({ cls: "bt-tag-list" });
    const render = () => {
      list.empty();
      const q = add.value.trim().toLowerCase().replace(/^#/, "");
      const all = [...new Set([...known, ...f.labels!])].sort((a, b) => a.localeCompare(b, "de"));
      for (const tag of all) {
        if (q && !tag.toLowerCase().includes(q)) continue;
        const on = f.labels!.includes(tag);
        const r = list.createDiv({ cls: "bt-row bt-tag-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" }); setIcon(ic, "hash");
        r.createSpan({ cls: "bt-row-lbl", text: tag });
        const box = r.createSpan({ cls: "bt-tag-box" }); if (on) setIcon(box, "check");
        r.onclick = () => {
          f.labels = on ? f.labels!.filter((x) => x !== tag) : [...f.labels!, tag];
          host.resetParsedLabels?.();
          host.rerender(); render();
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
      if (!f.labels!.includes(slug)) f.labels!.push(slug);
      host.resetParsedLabels?.();
      add.value = ""; host.rerender(); render();
    };
    window.setTimeout(() => add.focus(), 0);
  });
}

/** Chip-Text für Erinnerungen: 0 → „Erinnerung", 1 → deren Text, n → „n Erinnerungen". */
function reminderLabel(f: ChipFields): string {
  const n = f.reminders?.length ?? 0;
  if (n === 0) return t("chip_reminder");
  if (n === 1) return formatReminder(f.reminders![0]);
  return t("rem_count", n);
}

function openReminders(host: ChipHost, anchor: HTMLElement): void {
  const f = host.f;
  f.reminders ??= [];
  const PRESETS = ["-0m", "-10m", "-30m", "-1h", "-1d"];
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-rem");
    const add = (raw: string) => {
      if (!f.reminders!.includes(raw)) f.reminders = [...f.reminders!, raw];
      host.rerender();
    };
    const render = () => {
      pop.empty();
      pop.createDiv({ cls: "bt-pop-head", text: t("reminders_title") });
      for (const raw of f.reminders!) {
        const row = pop.createDiv({ cls: "bt-row bt-rem-item" });
        const ic = row.createSpan({ cls: "bt-row-ic" }); setIcon(ic, "alarm-clock");
        row.createSpan({ cls: "bt-row-lbl", text: formatReminder(raw) });
        const x = row.createSpan({ cls: "bt-rem-x" }); setIcon(x, "x");
        x.onclick = (e) => { e.stopPropagation(); f.reminders = f.reminders!.filter((r) => r !== raw); host.rerender(); render(); };
      }
      if (f.reminders!.length) pop.createDiv({ cls: "bt-rem-sep" });
      pop.createDiv({ cls: "bt-pop-sub", text: t("rem_tab_relative") });
      if (!f.dueTime) {
        pop.createDiv({ cls: "bt-rem-hint", text: t("rem_need_time") });
      } else {
        for (const raw of PRESETS) {
          const row = popRow(pop, "clock", formatReminder(raw), () => { add(raw); render(); });
          if (f.reminders!.includes(raw)) row.addClass("is-disabled");
        }
      }
      pop.createDiv({ cls: "bt-rem-sep" });
      popRow(pop, "calendar-clock", t("rem_tab_absolute"), () => {
        close();
        // HINZUFÜGEN, nicht setzen: der Picker muss im confirm-Modus laufen, sonst würde
        // jeder Zwischenstand beim Tippen einer Uhrzeit eine eigene Erinnerung anlegen.
        // requireTime: eine absolute Erinnerung ohne Uhrzeit hat keinen Feuerzeitpunkt.
        openDatePicker(anchor, "", (iso) => { if (iso && iso.includes("T")) add(iso); }, undefined,
          { commit: "confirm", requireTime: true, confirmLabel: t("rem_add") });
      });
    };
    render();
  });
}

/** Titel der aktuell gewählten Elternaufgabe (für Chip-Label) oder null. */
function parentTitle(host: ChipHost): string | null {
  if (!host.f.parent) return null;
  return host.plugin.index.all().find((tk) => baseName(tk.path) === host.f.parent)?.title ?? host.f.parent;
}

function openParent(host: ChipHost): void {
  const exclude = new Set<string>();
  if (host.existingPath) {
    exclude.add(host.existingPath);
    for (const d of host.plugin.index.descendants(host.existingPath)) exclude.add(d.path);
  }
  const items = host.plugin.index.all().filter((tk) => !isTrashed(tk.status) && !exclude.has(tk.path));
  new TaskPickerModal(host.app, items, t("pick_parent"), (parent) => {
    host.f.parent = baseName(parent.path);
    host.onParentPicked?.(parent.project ? baseName(parent.project) : null);   // Projekt erben (wie „+ Subtask")
    host.rerender();
  }).open();
}

// ── Registry ──
export const CHIPS: Record<ChipId, ChipDef> = {
  status: {
    id: "status", icon: "circle", nameKey: "chip_status", kind: "status",
    isSet: () => true,
    valueLabel: (f) => statusLabel(f.status ?? firstOpenStatus()),
    open: (host, a) => openStatus(host, a),
    clear: () => { /* Status ist nie leer */ },
  },
  due: {
    id: "due", icon: "calendar", nameKey: "chip_date", kind: "value",
    isSet: (f) => !!f.due,
    valueLabel: (f) => formatDateTime(combineDT(f.due!, f.dueTime)) + (f.duration ? " · " + formatDuration(f.duration) : ""),
    open: (host, a) => openDate(host, a, "due"),
    // Aus dem Titel erkannt -> dort escapen (das Modal parst neu, der Chip leert sich dabei selbst
    // und das Wort bleibt im Titel). Sonst – manuell gesetzt oder Auslöser nicht mehr auffindbar –
    // wie bisher einfach leeren.
    clear: (host) => {
      if (host.unparseDue?.()) return;
      host.f.due = null; host.f.dueTime = null; host.f.duration = null; host.pinDue();
    },
  },
  priority: {
    id: "priority", icon: "flag", nameKey: "chip_priority", kind: "value",
    isSet: (f) => !!f.priority && f.priority !== "normal",
    valueLabel: (f, host) => host.compactLabels ? "P" + PRIO_NUM[f.priority!] : t(PRIO_KEY[f.priority!]),
    open: (host, a) => openPrio(host, a),
    clear: (host) => { host.f.priority = "normal"; },
  },
  label: {
    id: "label", icon: "hash", nameKey: "chip_label", kind: "value",
    isSet: (f) => !!(f.labels && f.labels.length),
    valueLabel: (f, host) => host.compactLabels ? (f.labels ?? []).join(" | ") : (f.labels ?? []),
    open: (host, a) => openLabels(host, a),
    clear: (host) => { host.f.labels = []; host.resetParsedLabels?.(); },
  },
  recurrence: {
    id: "recurrence", icon: "refresh-ccw", nameKey: "chip_recurrence", kind: "value",
    isSet: (f) => !!f.recurrence,
    valueLabel: (f) => recurLabel(f.recurrence!, f.recurBasis),
    open: (host, a) => openRecur(host, a),
    clear: (host) => { host.f.recurrence = null; },
  },
  deadline: {
    id: "deadline", icon: "clock", nameKey: "chip_deadline", kind: "value",
    isSet: (f) => !!f.scheduled,
    valueLabel: (f) => formatDateTime(combineDT(f.scheduled!, f.scheduledTime)),
    open: (host, a) => openDate(host, a, "scheduled"),
    clear: (host) => { host.f.scheduled = null; host.f.scheduledTime = null; },
  },
  reminder: {
    id: "reminder", icon: "alarm-clock", nameKey: "chip_reminder", kind: "value",
    isSet: (f) => (f.reminders?.length ?? 0) > 0,
    valueLabel: (f) => reminderLabel(f),
    open: (host, a) => openReminders(host, a),
    clear: (host) => { host.f.reminders = []; },
  },
  parent: {
    id: "parent", icon: "corner-down-right", nameKey: "chip_parent", kind: "value",
    isSet: (f) => !!f.parent,
    valueLabel: (_f, host) => parentTitle(host) ?? t("chip_parent"),
    open: (host) => openParent(host),
    clear: (host) => { host.f.parent = null; },
  },
  details: {
    id: "details", icon: "paperclip", nameKey: "details", kind: "details",
    isSet: (_f, host) => host.detailsOpen?.() ?? false,
    valueLabel: () => t("details"),
    open: (host, a) => host.toggleDetails?.(a),
    clear: () => { /* Details ist ein Toggle, kein Wert */ },
  },
};

/** Sinnvolle Standard-Profile für die Ersteinrichtung (greifen, solange die Fläche kein eigenes
 *  gespeichertes Profil hat). Tiers nur für nicht-„shown" Chips gelistet (Rest = shown). */
export const DEFAULT_CHIP_PROFILES: Record<ChipSurface, ChipProfile> = {
  editor: {
    order: ["due", "priority", "label", "details", "recurrence", "reminder", "deadline", "parent", "status"],
    tiers: { deadline: "onValue", parent: "onValue", status: "hidden" },
  },
  quickAdd: {
    order: ["due", "priority", "label", "recurrence", "reminder", "deadline", "parent", "details", "status"],
    tiers: { recurrence: "onValue", reminder: "onValue", deadline: "onValue", parent: "onValue", details: "hidden", status: "hidden" },
  },
};

/** Konfigurations-Profil einer Fläche (eigenes gespeichertes ODER der Ersteinrichtungs-Default). */
export function chipProfile(settings: BeautyTasksSettings, surface: ChipSurface): ChipProfile {
  return settings.chipProfiles?.[surface] ?? DEFAULT_CHIP_PROFILES[surface];
}

/** Aufgelöste Chip-Reihenfolge der Fläche: gespeicherte Reihenfolge, um fehlende Ids (kanonisch) ergänzt. */
export function resolveChipOrder(settings: BeautyTasksSettings, surface: ChipSurface): ChipId[] {
  const saved = chipProfile(settings, surface).order ?? [];
  const seen = new Set(saved.filter((id) => CHIP_IDS.includes(id)));
  return [...saved.filter((id) => CHIP_IDS.includes(id)), ...CHIP_IDS.filter((id) => !seen.has(id))];
}

/** Sichtbarkeits-Stufe eines Chips auf der Fläche (fehlt = "shown" -> unverändertes Default-Verhalten). */
export function chipTierOf(settings: BeautyTasksSettings, surface: ChipSurface, id: ChipId): ChipTier {
  return chipProfile(settings, surface).tiers?.[id] ?? "shown";
}

/** Soll der Chip inline in der Leiste stehen? shown = immer; onValue = nur mit Wert; hidden = nie.
 *  Gilt in Kompakt- UND Normalmodus gleich (gesetzte Werte bleiben immer sichtbar). */
export function isInline(settings: BeautyTasksSettings, surface: ChipSurface, id: ChipId, set: boolean): boolean {
  const tier = chipTierOf(settings, surface, id);
  return tier === "shown" || (tier === "onValue" && set);
}

/** Chips in aufgelöster Reihenfolge, ohne im Modal deaktivierte (z. B. Parent im Subtask-Modus). */
export function orderedChips(host: ChipHost): ChipDef[] {
  return resolveChipOrder(host.plugin.settings, host.surface).map((id) => CHIPS[id]).filter((c) => !host.chipEnabled || host.chipEnabled(c.id));
}

/** Die nicht-inline Chips (fürs „+"-Menü „Weitere Aktionen"). */
export function plusChips(host: ChipHost): ChipDef[] {
  const s = host.plugin.settings;
  return orderedChips(host).filter((c) => !isInline(s, host.surface, c.id, c.isSet(host.f, host)));
}

/** True, wenn hinter „+" ausgeblendete Chips MIT Wert stecken (Badge am „+"-Icon). */
export function plusHasSetHidden(host: ChipHost): boolean {
  return plusChips(host).some((c) => c.isSet(host.f, host));
}

/** „Weitere Aktionen"-Sektion ins Popover rendern: nicht-inline Chips mit Icon, Name und –
 *  bei gesetztem Wert – Umrandung + Wert-Vorschau. Klick öffnet den jeweiligen Picker (am Anchor).
 *  Gibt true zurück, wenn mindestens eine Zeile gerendert wurde. */
export function renderPlusChips(pop: HTMLElement, host: ChipHost, anchor: HTMLElement, close: () => void): boolean {
  const list = plusChips(host);
  if (!list.length) return false;
  pop.createDiv({ cls: "bt-pop-head", text: t("more_chip_actions") });
  for (const c of list) {
    const set = c.isSet(host.f, host);
    const row = popRow(pop, c.icon, t(c.nameKey), () => { close(); c.open(host, anchor); });
    if (set) {
      row.addClass("bt-row-set");   // Umrandung = „ist gesetzt"-Signal (v. a. Status)
      const val = c.valueLabel(host.f, host);
      const v = Array.isArray(val) ? val.join(", ") : val;
      if (v) row.createSpan({ cls: "bt-row-val", text: v });
    }
  }
  return true;
}

/** Status-Chip inline rendern (fixes Label, kein ✕) – öffnet die Status-Auswahl. Gemeinsam
 *  für beide Modale. */
export function renderStatusChip(bar: HTMLElement, host: ChipHost, c: ChipDef): void {
  const cur = host.f.status ?? firstOpenStatus();
  const chip = bar.createEl("button", { cls: "bt-chip bt-chip-status is-set", attr: { "data-status": cur, "data-chip": c.id } });
  const sic = chip.createSpan({ cls: "bt-chip-ic" }); setIcon(sic, statusIcon(cur)); sic.style.color = statusTint(cur);
  chip.createSpan({ cls: "bt-chip-lbl", text: statusLabel(cur) });
  chip.onclick = (e) => { e.stopPropagation(); c.open(host, chip); };
}

/** Wert-Chip inline rendern: leer = Icon (+Name als Tooltip), gesetzt = Wert + ✕. Icon-only-Modus
 *  blendet nur die Labels leerer Chips aus (CSS). Gemeinsam für beide Modale. */
export function renderValueChip(bar: HTMLElement, host: ChipHost, c: ChipDef, set: boolean): void {
  const iconsOnly = host.iconsOnly;
  const truncate = c.id === "parent" && set;
  // data-chip: Anker-Kennung. renderChips() leert die Leiste (bar.empty()) und ersetzt die
  // Chip-Elemente – ein Popover, das noch das ALTE Element als Anker hält, könnte sich sonst
  // nicht mehr positionieren. openPopover() findet den Nachfolger darüber wieder.
  const chip = bar.createEl("button", {
    cls: "bt-chip" + (set ? " is-set" : "") + (truncate ? " bt-chip-truncate" : ""),
    attr: { "data-chip": c.id },
  });
  if (iconsOnly && !set) { chip.setAttribute("aria-label", t(c.nameKey)); chip.setAttribute("data-tooltip-position", "top"); }
  const ic = chip.createSpan({ cls: "bt-chip-ic" }); setIcon(ic, c.icon);
  const lbl = chip.createSpan({ cls: "bt-chip-lbl" });
  const label = set ? c.valueLabel(host.f, host) : t(c.nameKey);
  // Das „#"-Chip-Icon signalisiert bereits „Label" -> im Text KEIN zweites „#".
  if (Array.isArray(label)) label.forEach((p, i) => { if (i) lbl.createSpan({ cls: "bt-chip-sep", text: " | " }); lbl.appendText(p); });
  else lbl.setText(label);
  // Langer Elternname per CSS mit „…" gekürzt; vollen Namen als Tooltip, wenn abgeschnitten.
  if (truncate && lbl.scrollWidth > lbl.clientWidth) {
    chip.addClass("is-faded");
    chip.setAttribute("aria-label", Array.isArray(label) ? label.join(", ") : label);
    chip.setAttribute("data-tooltip-position", "top");
  }
  chip.onclick = (e) => { e.stopPropagation(); c.open(host, chip); };
  if (set) { const x = chip.createSpan({ cls: "bt-chip-x" }); setIcon(x, "x"); x.onclick = (e) => { e.stopPropagation(); c.clear(host); host.rerender(); }; }
}

/** Obsidian-Einstellungen beim BeautyTasks-Tab öffnen („Aufgabenaktionen bearbeiten"). */
export function openChipSettings(app: App): void {
  const s = (app as unknown as { setting?: { open(): void; openTabById(id: string): void } }).setting;
  s?.open();
  s?.openTabById("beautytasks");
}
