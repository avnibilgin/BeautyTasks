// „Anzeige"-Panel pro Seite (Alternative C). Popover aus dem Anzeige-Knopf im Seitenkopf:
// Layout · Erledigte · (nur volle Seiten) Sortieren · Gruppieren · Zurücksetzen. Hält den Stand
// lokal für sofortiges UI-Feedback und persistiert parallel über plugin.setPageViewOption.
import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { openPopover } from "./popover";
import { ViewOptions, FilterSort, FilterGroup, LAYOUTS, SORTS, DEFAULT_OPTIONS } from "./filterEngine";
import { t } from "./i18n";

/** Kontextabhängige Gruppierungs-Optionen: die auf dieser Seite redundante ausblenden
 *  (auf einer Projektseite ist „Liste" sinnlos -> „Label"; auf einer Label-Seite umgekehrt). */
function groupOptions(kind: string): FilterGroup[] {
  const base: FilterGroup[] = ["none", "date", "deadline", "priority"];
  if (kind === "project") base.push("label");
  else if (kind === "label") base.push("project");
  else { base.push("label"); base.push("project"); }
  return base;
}

export function openViewPanel(anchor: HTMLElement, plugin: BeautyTasksPlugin): void {
  const page = plugin.currentPage();
  if (page.tier === "none") return;

  openPopover(anchor, (pop, close) => {
    let o: ViewOptions = plugin.pageViewOptions();
    const apply = (patch: Partial<ViewOptions>): void => { o = { ...o, ...patch }; void plugin.setPageViewOption(patch); render(); };

    const cap = (text: string): void => { pop.createDiv({ cls: "bt-panel-cap", text }); };
    const render = (): void => {
      pop.empty();
      pop.addClass("bt-view-panel");

      const seg = pop.createDiv({ cls: "bt-tabs bt-layout-toggle" });
      for (const l of LAYOUTS) {
        const b = seg.createEl("button", { cls: "bt-tab" + (o.layout === l ? " is-active" : ""), text: t("layout_" + l) });
        b.onclick = () => apply({ layout: l });
      }

      // „Erledigte anzeigen" ergibt in „Demnächst" (reine Zukunfts-Agenda) keinen Sinn -> dort weglassen.
      if (page.key !== "demnaechst") {
        const doneRow = pop.createDiv({ cls: "bt-panel-row" });
        doneRow.createSpan({ cls: "bt-panel-k", text: t("panel_show_done") });
        const sw = doneRow.createDiv({ cls: "bt-panel-switch" + (o.showDone ? " is-on" : "") });
        sw.onclick = () => apply({ showDone: !o.showDone });
      }

      // Sortieren/Gruppieren: volle Seiten UND „Heute" (dort ersetzt eine aktive Gruppierung den
      // Überfällig/Heute-Split). „Demnächst" bleibt bewusst eine reine, ungruppierte Termin-Agenda.
      // Der Kalender hat seine Achse (das Datum) fest vorgegeben – Sortieren/Gruppieren wäre dort
      // wirkungslos und wird deshalb gar nicht erst angeboten. Gespeicherte Werte bleiben erhalten
      // (nicht destruktiv: zurück in Liste/Board wirken sie wieder).
      if (o.layout !== "calendar" && (page.tier === "full" || page.key === "heute")) {
        cap(t("filter_arrange"));
        ddRow(pop, t("filter_sort"), SORTS, o.sort, "filter_sort_", (v) => apply({ sort: v as FilterSort }));
        // Im Board-Layout nur die spaltenfähigen Gruppierungen anbieten – Datum/Deadline passen nicht
        // auf ein Kanban (offene Achse, mehrdeutige Bereichs-Buckets). Steht eine davon noch gespeichert,
        // in der Auswahl als „Keine" zeigen (nicht destruktiv: in der Liste bleibt sie erhalten).
        const groups = o.layout === "board"
          ? groupOptions(page.kind).filter((g) => g !== "date" && g !== "deadline")
          : groupOptions(page.kind);
        const shownGroup = groups.includes(o.group) ? o.group : "none";
        // Im Board ist „Keine" faktisch „nach Status" (das Board braucht eine Spalten-Achse) -> so benennen.
        const groupLabelFor = o.layout === "board" ? (v: string) => v === "none" ? t("filter_group_status") : t("filter_group_" + v) : undefined;
        ddRow(pop, t("filter_group"), groups, shownGroup, "filter_group_", (v) => apply({ group: v as FilterGroup }), groupLabelFor);
      }

      const reset = pop.createEl("button", { cls: "bt-panel-reset", text: t("filter_reset") });
      reset.onclick = () => { void plugin.resetPageViewOptions(); o = { ...DEFAULT_OPTIONS }; render(); };
    };
    render();
    void close;   // Popover schließt bei Klick außerhalb
  });
}

/** Eine Zeile „Label + Dropdown". `labelFor` überschreibt optional den Text einzelner Optionen. */
function ddRow(pop: HTMLElement, label: string, values: readonly string[], current: string, keyPrefix: string, onChange: (v: string) => void, labelFor?: (v: string) => string): void {
  const row = pop.createDiv({ cls: "bt-panel-row" });
  row.createSpan({ cls: "bt-panel-k", text: label });
  const sel = row.createEl("select", { cls: "dropdown bt-panel-dd" });
  for (const v of values) {
    const opt = sel.createEl("option", { text: labelFor?.(v) ?? t(keyPrefix + v), value: v });
    if (v === current) opt.selected = true;
  }
  sel.onchange = () => onChange(sel.value);
}

/** Anzeige-Knopf für den Seitenkopf (öffnet das Panel; Punkt = weicht vom Standard ab). */
export function anzeigeButton(head: HTMLElement, plugin: BeautyTasksPlugin): void {
  const btn = head.createEl("button", { cls: "bt-anzeige" });
  setIcon(btn.createSpan({ cls: "bt-anzeige-ic" }), "sliders-horizontal");
  btn.createSpan({ cls: "bt-anzeige-lbl", text: t("view_display") });
  const o = plugin.pageViewOptions();
  const modified = o.layout !== DEFAULT_OPTIONS.layout || o.sort !== DEFAULT_OPTIONS.sort || o.group !== DEFAULT_OPTIONS.group || o.showDone !== DEFAULT_OPTIONS.showDone;
  if (modified) btn.createSpan({ cls: "bt-anzeige-dot" });
  btn.onclick = () => openViewPanel(btn, plugin);
}
