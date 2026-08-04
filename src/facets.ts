// Facetten über FilterCriteria – Bedienelement UND Definition an einer Stelle.
//
// Zwei Oberflächen stellen dieselben Fragen: der Editor eines gespeicherten Filters
// (filterModal) und der Filter-Abschnitt des Anzeige-Panels (viewPanel). Vorher hatte jede
// ihre eigene Kopie des Dropdowns, und die Kriterien-Zeilen hätten ein zweites Mal
// abgeschrieben werden müssen. Hier steht beides genau einmal:
//
//   • das WIDGET  – Trigger-Button + Popover (Einfachauswahl bzw. ✓/+/−-Mehrfachauswahl)
//   • die FACETTE – welche Werte eine Facette anbietet und wie sie in die Kriterien schreibt
//
// Die Zeilen-Klassen kommen als `RowStyle` von außen: Modal und Panel haben verschiedene
// Abstände, aber dasselbe Bedienelement.
import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { Priority } from "./types";
import { openPopover } from "./popover";
import { FilterCriteria, FacetId, MatchMode, RANGES, FILTER_PRIORITIES, SUBTASK_FILTERS, SubtaskFilter, FilterRange, orphanKeys } from "./filterEngine";
import { allStatuses, statusLabel } from "./statuses";
import { listProjectsAndAreas, isInboxName } from "./taskService";
import { PRIO_KEY } from "./chips";
import { t, projectDisplayName } from "./i18n";

export interface FacetOption { key: string; label: string }

/** Klassen der Zeile „Beschriftung links, Bedienelement rechts". `ctl` = eigener Container für
 *  das Bedienelement (Modal), `dd` = Zusatzklasse am Trigger-Button (Panel-Maße). */
export interface RowStyle { row: string; key: string; ctl?: string; dd?: string }
export const MODAL_STYLE: RowStyle = { row: "bt-filter-row", key: "bt-filter-k", ctl: "bt-filter-ctl" };
export const PANEL_STYLE: RowStyle = { row: "bt-panel-row", key: "bt-panel-k", dd: "bt-panel-dd" };

/**
 * Eine Zeile „Beschriftung + Bedienelement" – gibt den Container für das Bedienelement zurück.
 *
 * Bewusst EIGENES Markup statt Obsidians `Setting`: dessen Zeilen bringen Standard-Padding und
 * eine Trennlinie mit, die sich von außen nur über Spezifitäts-Wettbewerb bekämpfen ließen –
 * und genau das ist zweimal fehlgeschlagen. Mit eigenen Elementen bestimmt das Plugin die
 * Abstände selbst.
 */
export function fieldRow(parent: HTMLElement, label: string, style: RowStyle): HTMLElement {
  const row = parent.createDiv({ cls: style.row });
  row.createSpan({ cls: style.key, text: label });
  return style.ctl ? row.createDiv({ cls: style.ctl }) : row;
}

/** Trigger-Button (Beschriftung + Chevron). Bewusst KEIN natives <select>: dessen aufgeklapptes
 *  Menü zeichnet das Betriebssystem – das ignoriert Theme und CSS-Snippets. Das Popover gehört
 *  uns und folgt den Farbvariablen. */
function ddButton(host: HTMLElement, style: RowStyle): { btn: HTMLButtonElement; lbl: HTMLElement } {
  const btn = host.createEl("button", { cls: "bt-facet-dd" + (style.dd ? " " + style.dd : "") });
  const lbl = btn.createSpan({ cls: "bt-facet-dd-lbl" });
  setIcon(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
  return { btn, lbl };
}

/** Einfachauswahl: genau EIN Wert, Klick wählt und schließt. */
export function selectControl(parent: HTMLElement, label: string, opts: FacetOption[],
  get: () => string, set: (v: string) => void, style: RowStyle): void {
  const { btn, lbl } = ddButton(fieldRow(parent, label, style), style);
  const syncLbl = (): void => lbl.setText(opts.find((o) => o.key === get())?.label ?? "");
  syncLbl();

  btn.onclick = (e) => {
    e.stopPropagation();   // im Panel: nicht als „Klick außerhalb" des äußeren Popovers zählen
    openPopover(btn, (pop, close) => {
      pop.addClass("bt-facet-pop");
      for (const o of opts) {
        const on = get() === o.key;
        const r = pop.createDiv({ cls: "bt-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });
        if (on) setIcon(ic, "check");
        r.createSpan({ cls: "bt-row-lbl", text: o.label });
        r.onclick = () => { close(); set(o.key); syncLbl(); };
      }
    });
  };
}

/** Steuerung einer Mehrfach-Facette: liest und schreibt die Marker eines Werts. */
export interface FacetCtl {
  /** Aktueller Marker eines Werts, null = nicht gewählt. */
  modeOf(k: string): MatchMode | null;
  toggle(k: string, pen: MatchMode): void;
  clear(): void;
  /** Wählbare Stifte – bei einwertigen Feldern (Priorität, Status, Projekt) ohne „alle". */
  pens: MatchMode[];
  /** Werte ohne Ziel (gelöschtes Label, umbenanntes Projekt) – markieren den Button. */
  orphans?: readonly string[];
}

/**
 * Mehrfachauswahl mit PRO-WERT-Marker. Der Modus oben (eines/alle/keines) ist nur der „Stift":
 * Ein Klick auf einen Wert setzt/entfernt ihn im aktuellen Stift; jeder Wert behält seinen
 * Marker (✓ = eines/ODER · + = alle/UND · − = keines/NICHT), auch wenn der Stift gewechselt wird.
 *
 * Das Popover bleibt beim Umschalten OFFEN (mehrere Werte nacheinander) – deshalb darf `onChange`
 * niemals die Oberfläche neu aufbauen, in der dieser Button hängt: sein Anker wäre danach aus dem
 * DOM gelöst. Die Beschriftung zieht die Funktion selbst nach (syncLbl).
 */
export function facetControl(parent: HTMLElement, label: string, opts: FacetOption[], ctl: FacetCtl,
  style: RowStyle, onChange?: () => void): void {
  const { btn, lbl } = ddButton(fieldRow(parent, label, style), style);
  const iconOf = (m: MatchMode): string => (m === "all" ? "plus" : m === "none" ? "minus" : "check");
  const syncLbl = (): void => {   // Zusammenfassung: „N Kriterien gewählt" (Gesamtzahl)
    const n = opts.filter((o) => ctl.modeOf(o.key)).length;
    lbl.setText(n ? t("filter_n_criteria", n) : t("filter_all"));
    // Rahmen markieren, solange ein Kriterium ohne Ziel gewählt ist – wird beim Abwählen von
    // selbst wieder normal, weil syncLbl nach jedem Umschalten läuft.
    btn.toggleClass("is-stale", (ctl.orphans ?? []).some((k) => !!ctl.modeOf(k)));
  };
  syncLbl();

  let pen: MatchMode = ctl.pens[0];   // Standard-Stift = „eines"
  btn.onclick = (e) => {
    e.stopPropagation();   // im Panel: nicht als „Klick außerhalb" des äußeren Popovers zählen
    openPopover(btn, (pop) => {
      pop.addClass("bt-facet-pop");
      const render = (): void => {
        pop.empty();
        pop.addClass("bt-facet-pop");
        if (ctl.pens.length > 1) {   // Stift-Segment oben – wechselt nur den Stift, ändert keine Auswahl
          pop.addClass("bt-mode-pop");
          pop.createDiv({ cls: "bt-mode-lead", text: t("filter_mode_lead") });
          const seg = pop.createDiv({ cls: "bt-mode-seg" });
          for (const m of ctl.pens) {
            const opt = seg.createSpan({ cls: "bt-mode-opt" + (pen === m ? " is-on" : ""), text: t("filter_mode_" + m) });
            opt.onclick = () => { pen = m; render(); };
          }
          pop.createDiv({ cls: "bt-mode-sentence", text: t("filter_mode_s_" + pen) });   // beschreibt den aktiven Stift
        }
        const rowEl = (active: boolean, icon: string | null, text: string, onClick: () => void, stale = false): void => {
          const r = pop.createDiv({ cls: "bt-row" + (active ? " is-active" : "") + (stale ? " is-stale" : "") });
          const ic = r.createSpan({ cls: "bt-row-ic" });   // Slot immer da -> Beschriftungen bündig
          if (icon) setIcon(ic, icon);
          r.createSpan({ cls: "bt-row-lbl", text });
          r.onclick = onClick;
        };
        const empty = !opts.some((o) => ctl.modeOf(o.key));
        rowEl(empty, empty ? "check" : null, t("filter_all"), () => { ctl.clear(); syncLbl(); onChange?.(); render(); });
        for (const o of opts) {
          const m = ctl.modeOf(o.key);
          rowEl(!!m, m ? iconOf(m) : null, o.label,
            () => { ctl.toggle(o.key, pen); syncLbl(); onChange?.(); render(); },
            (ctl.orphans ?? []).includes(o.key));
        }
      };
      render();
    });
  };
}

// ── Facetten-Definitionen über FilterCriteria ───────────────────────

/** Eine fertig beschriebene Facette: Beschriftung, Werte und wie sie in die Kriterien schreibt. */
export interface FacetDef {
  id: FacetId;
  label: string;
  /** Einfachauswahl (Zeitraum, Unteraufgaben) bzw. Mehrfachauswahl mit ✓/+/−. */
  select?: { get: () => string; set: (v: string) => void };
  multi?: FacetCtl;
  opts: FacetOption[];
}

/** Einträge für Kriterien, deren Ziel es nicht mehr gibt – ein gelöschtes Label, ein umbenanntes
 *  Projekt, ein entfernter Status. Ohne sie stünde die Facette auf „Alle", obwohl sie filtert:
 *  Die Ansicht liefert dann scheinbar grundlos nichts. Sichtbar gemacht, lassen sie sich abwählen.
 *  Bewusst NICHT automatisch verworfen – das änderte Gespeichertes ohne Zutun des Nutzers. */
const staleOpts = (keys: readonly string[]): FacetOption[] => keys.map((k) => ({ key: k, label: t("filter_missing", k) }));

/**
 * Baut die Facetten für die angeforderten Ids.
 *
 * `get`/`set` entkoppeln die Definitionen von der Speicherung: Das Modal hält eine Arbeitskopie
 * und speichert erst beim Klick auf „Speichern", das Panel schreibt jede Änderung sofort in die
 * Seite. Beide reichen hier nur einen Leser und einen Patch-Schreiber herein.
 *
 * `statusScope` beschneidet die Status-Facette: Im Panel sitzt drei Zeilen darüber der Schalter
 * „Erledigte anzeigen", und ausdrücklich gewählte Status stechen ihn aus (s. applyFilter). Zwei
 * Bedienelemente, von denen eines das andere stillschweigend überstimmt, sind eine Falle – also
 * bietet das Panel nur die OFFENEN Phasen an (inklusive eigener). Der Editor eines gespeicherten
 * Filters behält alle: „zeig mir alles Abgebrochene" ist dort eine sinnvolle Frage.
 */
export function buildFacets(plugin: BeautyTasksPlugin, ids: readonly FacetId[],
  get: () => FilterCriteria, set: (patch: Partial<FilterCriteria>) => void,
  statusScope: "open" | "all" = "all"): FacetDef[] {
  const out: FacetDef[] = [];
  const rangeOpts = RANGES.map((r) => ({ key: r, label: t("filter_range_" + r) }));

  for (const id of ids) {
    if (id === "range") {
      out.push({ id, label: t("filter_range"), opts: rangeOpts,
        select: { get: () => get().range, set: (v) => set({ range: v as FilterRange }) } });
    } else if (id === "deadlineRange") {
      // Dieselben Stufen wie die Fälligkeit, aber ein eigenes Feld: „Deadline diese Woche" ist
      // eine andere Frage als „fällig diese Woche".
      out.push({ id, label: t("filter_deadline_range"), opts: rangeOpts,
        select: { get: () => get().deadlineRange, set: (v) => set({ deadlineRange: v as FilterRange }) } });
    } else if (id === "statuses") {
      const defs = statusScope === "open" ? allStatuses().filter((s) => s.kind === "open") : allStatuses();
      const c = get();
      const stale = orphanKeys(defs.map((s) => s.id), [...c.statuses, ...c.statusesNot]);
      out.push({ id, label: t("filter_statuses"),
        opts: [...defs.map((s) => ({ key: s.id, label: statusLabel(s.id) })), ...staleOpts(stale)],
        multi: pickMulti(get, set, "statuses", "statusesNot", stale) });
    } else if (id === "priorities") {
      out.push({ id, label: t("filter_priorities"),
        opts: FILTER_PRIORITIES.map((p) => ({ key: p, label: t(PRIO_KEY[p]) })),
        multi: pickMulti<Priority>(get, set, "priorities", "prioritiesNot") });
    } else if (id === "labels") {
      const names = plugin.getLabels().map((l) => l.name);
      const c = get();
      const stale = orphanKeys(names, [...c.labels, ...c.labelsAll, ...c.labelsNot]);
      const opts = [...names.map((n) => ({ key: n, label: n })), ...staleOpts(stale)];
      if (!opts.length) continue;
      // Labels sind das einzige MEHRWERTIGE Feld – nur hier ergibt „alle" (UND) einen Sinn.
      out.push({ id, label: t("filter_labels"), opts, multi: {
        modeOf: (k) => { const x = get(); return x.labelsNot.includes(k) ? "none" : x.labelsAll.includes(k) ? "all" : x.labels.includes(k) ? "any" : null; },
        toggle: (k, pen) => {
          const x = get();
          const was = x.labelsNot.includes(k) ? "none" : x.labelsAll.includes(k) ? "all" : x.labels.includes(k) ? "any" : null;
          const any = x.labels.filter((v) => v !== k), all = x.labelsAll.filter((v) => v !== k), not = x.labelsNot.filter((v) => v !== k);
          if (was !== pen) (pen === "all" ? all : pen === "none" ? not : any).push(k);
          set({ labels: any, labelsAll: all, labelsNot: not });
        },
        clear: () => set({ labels: [], labelsAll: [], labelsNot: [] }),
        pens: ["any", "all", "none"], orphans: stale,
      } });
    } else if (id === "projects") {
      const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
      const c = get();
      // Der Eingang kann unter mehreren Namen gespeichert sein („Inbox"/„Eingang", s. isInboxName) –
      // die Engine matcht ihn trotzdem, also ist er nie verwaist.
      const stale = orphanKeys(["Inbox", ...[...bereiche, ...projekte].map((p) => p.name)],
        [...c.projects, ...c.projectsNot].filter((k) => !isInboxName(k)));
      out.push({ id, label: t("filter_projects"),
        opts: [{ key: "Inbox", label: t("nav_inbox") },
          ...[...bereiche, ...projekte].map((p) => ({ key: p.name, label: projectDisplayName(p.name) })),
          ...staleOpts(stale)],
        multi: pickMulti(get, set, "projects", "projectsNot", stale) });
    } else {
      // Unteraufgaben: dieselbe Frage, die andere Aufgabenverwaltungen mit subtask / !subtask stellen.
      out.push({ id, label: t("filter_subtasks"),
        opts: SUBTASK_FILTERS.map((v) => ({ key: v, label: t("filter_subtasks_" + v) })),
        select: { get: () => get().subtaskMode, set: (v) => set({ subtaskMode: v as SubtaskFilter }) } });
    }
  }
  return out;
}

/** Mehrfach-Steuerung für ein EINWERTIGES Feld (Status, Priorität, Projekt): nur ✓ und −.
 *  „alle" (UND) wäre dort nie erfüllbar – eine Aufgabe hat genau einen Status, eine Priorität,
 *  ein Projekt. */
function pickMulti<T extends string>(get: () => FilterCriteria, set: (patch: Partial<FilterCriteria>) => void,
  yes: "statuses" | "priorities" | "projects", no: "statusesNot" | "prioritiesNot" | "projectsNot",
  orphans?: readonly string[]): FacetCtl {
  const listOf = (k: typeof yes | typeof no): T[] => get()[k] as T[];
  return {
    modeOf: (k) => listOf(no).includes(k as T) ? "none" : listOf(yes).includes(k as T) ? "any" : null,
    toggle: (k, pen) => {
      const v = k as T;
      const was = listOf(no).includes(v) ? "none" : listOf(yes).includes(v) ? "any" : null;
      const a = listOf(yes).filter((x) => x !== v), b = listOf(no).filter((x) => x !== v);
      if (was !== pen) (pen === "none" ? b : a).push(v);
      set({ [yes]: a, [no]: b });
    },
    clear: () => set({ [yes]: [], [no]: [] }),
    pens: ["any", "none"], orphans,
  };
}

/** Eine Facette zeichnen – wählt anhand ihrer Art das passende Bedienelement. */
export function renderFacet(parent: HTMLElement, f: FacetDef, style: RowStyle, onChange?: () => void): void {
  if (f.select) selectControl(parent, f.label, f.opts, f.select.get, (v) => { f.select?.set(v); onChange?.(); }, style);
  else if (f.multi) facetControl(parent, f.label, f.opts, f.multi, style, onChange);
}
