// „Anzeige"-Panel pro Seite (Alternative C). Popover aus dem Anzeige-Knopf im Seitenkopf:
// Layout · Erledigte · (nur volle Seiten) Sortieren · Gruppieren · Zurücksetzen. Hält den Stand
// lokal für sofortiges UI-Feedback und persistiert parallel über plugin.setPageViewOption.
import { setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { openPopover } from "./popover";
import { ViewOptions, FilterSort, FilterGroup, SortDir, SubtaskDisplay, LAYOUTS, SORTS, SORT_DIRS, SUBTASK_DISPLAYS, BOARD_SUBTASK_DISPLAYS, effectiveSubtasks, hasSortDir, DEFAULT_OPTIONS } from "./filterEngine";
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

      // Unteraufgaben: in Liste UND Board wählbar (nur der Kalender kennt keine Unteraufgaben-
      // Darstellung). Bewusst NICHT an eine aktive Gruppierung gekoppelt – „Einzeln" wirkt auch
      // ungruppiert, weil eine Unteraufgabe dann ihre eigene Position in der Sortierung bekommt
      // statt der ihrer Hauptaufgabe. Ein Bedienelement, das beim Umstellen eines ANDEREN Feldes
      // auftaucht, verwirrt mehr, als das Ausblenden spart; ausgeblendet wird hier nur, was
      // wirklich wirkungslos ist (vgl. Richtung bei „smart").
      // Steht oberhalb des Anordnen-Blocks, weil es den auf „Demnächst" gar nicht gibt – dort
      // bliebe die Auswahl sonst unerreichbar.
      // Im Board fehlt „Eingerückt" (keine Karte in einer Karte). Ein gespeichertes „Eingerückt"
      // wird dort als „Einzeln" gezeigt – genau das, was boardSubtasks() tatsächlich tut. Der
      // gespeicherte Wert bleibt unangetastet und wirkt in der Liste weiter (nicht destruktiv,
      // wie bei den Gruppierungen, die das Board nicht anbietet).
      if (o.layout !== "calendar") {
        ddRow(pop, t("panel_subtasks"), o.layout === "board" ? BOARD_SUBTASK_DISPLAYS : SUBTASK_DISPLAYS,
          effectiveSubtasks(o), "panel_subs_",
          (v) => apply({ subtasks: v as SubtaskDisplay }));
      }

      // Sortieren/Gruppieren: volle Seiten UND „Heute" (dort ersetzt eine aktive Gruppierung den
      // Überfällig/Heute-Split). „Demnächst" bleibt bewusst eine reine, ungruppierte Termin-Agenda.
      // Der Kalender hat seine Achse (das Datum) fest vorgegeben – Sortieren/Gruppieren wäre dort
      // wirkungslos und wird deshalb gar nicht erst angeboten. Gespeicherte Werte bleiben erhalten
      // (nicht destruktiv: zurück in Liste/Board wirken sie wieder).
      if (o.layout !== "calendar" && (page.tier === "full" || page.key === "heute" || page.key === "demnaechst")) {
        cap(t("filter_arrange"));
        // Sortieren · Gruppieren · Richtung stehen als EIN Block enger beieinander (wie die Zeilen
        // im Filter-Modal) – sie beantworten zusammen eine Frage: in welcher Ordnung erscheint was.
        const box = pop.createDiv({ cls: "bt-panel-tight" });
        ddRow(box, t("filter_sort"), SORTS, o.sort, "filter_sort_", (v) => apply({ sort: v as FilterSort }));
        // „Demnächst" ist eine feste, ungruppierte Datums-Agenda -> KEINE Gruppieren-Zeile (in keinem
        // Layout). Sonst alle Gruppierungen anbieten – das Board bildet auch „Datum"/„Deadline" ab (eine
        // Spalte je Datum, s. dateColumns; „Überfällig"/„Ohne Datum" als Rand-Buckets). Eine nicht
        // anbietbare gespeicherte Wahl fiele via shownGroup auf „Keine" zurück (nicht destruktiv).
        if (page.key !== "demnaechst") {
          const groups = groupOptions(page.kind);
          const shownGroup = groups.includes(o.group) ? o.group : "none";
          // Im Board ist „Keine" faktisch „nach Status" (das Board braucht eine Spalten-Achse) -> so benennen.
          const groupLabelFor = o.layout === "board" ? (v: string) => v === "none" ? t("filter_group_status") : t("filter_group_" + v) : undefined;
          ddRow(box, t("filter_group"), groups, shownGroup, "filter_group_", (v) => apply({ group: v as FilterGroup }), groupLabelFor);
        }
        // Richtung gilt für Sortierung UND Gruppen. Bei „smart" gibt es keine – die Zeile entfällt
        // dann ganz (statt sie auszugrauen: ein totes Bedienelement erklärt sich nicht von selbst).
        if (hasSortDir(o.sort)) {
          ddRow(box, t("filter_dir"), SORT_DIRS, o.sortDir, "filter_dir_", (v) => apply({ sortDir: v as SortDir }));
        }
      }

      const reset = pop.createEl("button", { cls: "bt-panel-reset", text: t("filter_reset") });
      reset.onclick = () => { void plugin.resetPageViewOptions(); o = { ...DEFAULT_OPTIONS }; render(); };
    };
    render();
    void close;   // Popover schließt bei Klick außerhalb
  });
}

/**
 * Eine Zeile „Label + Dropdown". Bewusst KEIN natives <select>, sondern derselbe Trigger-Button
 * (.bt-facet-dd) plus Popover mit Häkchen-Zeilen wie im Filter-Modal (FilterModal.select()).
 * Ein <select> zeichnet sein aufgeklapptes Menü vom Betriebssystem – das ignoriert Theme und
 * CSS-Snippets. Das Popover gehört uns und folgt den Farbvariablen.
 * `labelFor` überschreibt optional den Text einzelner Optionen.
 */
function ddRow(parent: HTMLElement, label: string, values: readonly string[], current: string, keyPrefix: string,
  onChange: (v: string) => void, labelFor?: (v: string) => string): void {
  const row = parent.createDiv({ cls: "bt-panel-row" });
  row.createSpan({ cls: "bt-panel-k", text: label });
  const textOf = (v: string): string => labelFor?.(v) ?? t(keyPrefix + v);

  const btn = row.createEl("button", { cls: "bt-facet-dd bt-panel-dd" });
  btn.createSpan({ cls: "bt-facet-dd-lbl", text: textOf(current) });
  setIcon(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");

  btn.onclick = (e) => {
    e.stopPropagation();
    openPopover(btn, (pop, close) => {
      pop.addClass("bt-facet-pop");
      for (const v of values) {
        const on = v === current;
        const r = pop.createDiv({ cls: "bt-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });
        if (on) setIcon(ic, "check");
        r.createSpan({ cls: "bt-row-lbl", text: textOf(v) });
        r.onclick = () => { close(); onChange(v); };
      }
    });
  };
}

/** Anzeige-Knopf für den Seitenkopf (öffnet das Panel; Punkt = weicht vom Standard ab). */
export function anzeigeButton(head: HTMLElement, plugin: BeautyTasksPlugin): void {
  const btn = head.createEl("button", { cls: "bt-anzeige" });
  setIcon(btn.createSpan({ cls: "bt-anzeige-ic" }), "sliders-horizontal");
  btn.createSpan({ cls: "bt-anzeige-lbl", text: t("view_display") });
  const o = plugin.pageViewOptions();
  // Die Richtung zählt nur mit, wenn sie überhaupt gilt – bei „smart" gibt es keine, und ein
  // gespeicherter Wert von einer früheren Sortierung darf den Punkt nicht setzen (das Panel
  // zeigt die Zeile dort ja auch nicht: derselbe hasSortDir-Vorbehalt).
  const modified = o.layout !== DEFAULT_OPTIONS.layout || o.sort !== DEFAULT_OPTIONS.sort || o.group !== DEFAULT_OPTIONS.group
    // Unteraufgaben: die WIRKSAMEN Werte vergleichen. Wer im Board ausdrücklich „Einzeln" wählt,
    // hat damit nichts verändert – dort ist es ohnehin die Vorgabe. Ein Punkt behauptete sonst
    // eine Abweichung, die man nicht sieht (wie zuvor bei der Richtung unter „smart").
    || o.showDone !== DEFAULT_OPTIONS.showDone
    || effectiveSubtasks(o) !== effectiveSubtasks({ layout: o.layout })
    || (hasSortDir(o.sort) && o.sortDir !== DEFAULT_OPTIONS.sortDir);
  if (modified) btn.createSpan({ cls: "bt-anzeige-dot" });
  btn.onclick = () => openViewPanel(btn, plugin);
}
