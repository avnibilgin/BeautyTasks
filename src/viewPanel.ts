// „Anzeige"-Panel pro Seite (Alternative C). Popover aus dem Anzeige-Knopf im Seitenkopf:
// Layout · Erledigte · Unteraufgaben · (nur volle Seiten) Anordnung · Filter · Zurücksetzen.
// Hält den Stand lokal für sofortiges UI-Feedback und persistiert parallel über ctx.setOption
// bzw. ctx.setLayout; die Kriterien des Ansichtsfilters gehen denselben Weg über ctx.setCriteria.
import { setIcon } from "obsidian";
import { PageCtx, PageRef, pageInfo, facetsFor } from "./pageCtx";
import { openPopover } from "./popover";
import { ViewOptions, FilterCriteria, PageLayout, FilterSort, FilterGroup, SortDir, SubtaskDisplay, LAYOUTS, SORTS, SORT_DIRS, SUBTASK_DISPLAYS, BOARD_SUBTASK_DISPLAYS, effectiveSubtasks, hasSortDir, hasCriteria, activeFacetCount, DEFAULT_OPTIONS, DEFAULT_CRITERIA } from "./filterEngine";
import { PANEL_STYLE, buildFacets, renderFacet, selectControl } from "./facets";
import { FilterModal } from "./filterModal";
import { INBOX_KEY, baseName } from "./taskService";
import { resetSubtaskToggles } from "./heuteView";
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

/** Kriterien für „Als Filter speichern": der Ansichtsfilter PLUS die Achse der Seite. Ohne sie
 *  wäre der gespeicherte Filter vault-weit – „Priorität 1" statt „Priorität 1 in diesem Projekt",
 *  also etwas anderes als das, was gerade auf dem Schirm steht. */
function presetFor(page: PageRef, c: FilterCriteria): FilterCriteria {
  const add = (list: string[], v: string): string[] => (list.includes(v) ? list : [...list, v]);
  if (page.kind === "label") return { ...c, labels: add(c.labels, page.key) };
  if (page.kind === "project") return { ...c, projects: add(c.projects, page.key === INBOX_KEY ? "Inbox" : baseName(page.key)) };
  if (page.key === "heute") return { ...c, range: "today" };
  if (page.key === "demnaechst") return { ...c, range: "next7" };
  return { ...c };
}

export function openViewPanel(anchor: HTMLElement, ctx: PageCtx): void {
  const page = pageInfo(ctx.page);
  if (page.tier === "none") return;
  const facets = facetsFor(ctx.page);
  // Klappzustand gilt für DIESE Panel-Sitzung (bewusst nicht gespeichert): „Filter" beginnt
  // offen, sobald die Seite gefiltert ist – dann ist es die Auskunft, die man sucht.
  const openSec = { arrange: true, filter: hasCriteria(ctx.crit) };

  openPopover(anchor, (pop, close) => {
    let o: ViewOptions = ctx.opts;
    let c: FilterCriteria = ctx.crit;
    const apply = (patch: Partial<ViewOptions>): void => { o = { ...o, ...patch }; ctx.setOption(patch); render(); };
    // Das Layout geht einen eigenen Weg: es gehört dem TAB (s. MainView.setLayout), damit ein
    // zweiter Tab derselben Seite beim Umschalten hier nicht mitspringt.
    const applyLayout = (l: PageLayout): void => { o = { ...o, layout: l }; ctx.setLayout(l); render(); };
    // Kriterien schreiben OHNE das Panel neu aufzubauen: Das Facetten-Popover bleibt beim
    // Umschalten offen, und sein Anker ist ein Knopf in genau diesem Panel – ein render() hier
    // löste ihn aus dem DOM und das offene Popover hinge an einem toten Element (s. facets.ts).
    const setCrit = (patch: Partial<FilterCriteria>): void => { c = { ...c, ...patch }; ctx.setCriteria(patch); };

    /** Zähler der Filter-Überschrift – nachziehbar, ohne das Panel neu zu bauen (s. setCrit). */
    let critCount: HTMLElement | null = null;

    const render = (): void => {
      pop.empty();
      pop.addClass("bt-view-panel");
      critCount = null;

      /** Abschnitts-Überschrift, klappbar, mit Zähler rechts. Liefert, ob der Rumpf zu zeichnen ist. */
      const cap = (text: string, sec: "arrange" | "filter", n: number): boolean => {
        const el = pop.createDiv({ cls: "bt-panel-cap is-toggle" });
        el.createSpan({ cls: "bt-panel-cap-t", text });
        const num = el.createSpan({ cls: "bt-panel-cap-n", text: n ? String(n) : "" });
        if (sec === "filter") critCount = num;
        setIcon(el.createSpan({ cls: "bt-panel-cap-chev" }), openSec[sec] ? "chevron-down" : "chevron-right");
        el.onclick = () => { openSec[sec] = !openSec[sec]; render(); };
        return openSec[sec];
      };

      const seg = pop.createDiv({ cls: "bt-tabs bt-layout-toggle" });
      for (const l of LAYOUTS) {
        const b = seg.createEl("button", { cls: "bt-tab" + (o.layout === l ? " is-active" : ""), text: t("layout_" + l) });
        b.onclick = () => applyLayout(l);
      }

      // „Erledigte anzeigen" ergibt in „Demnächst" (reine Zukunfts-Agenda) keinen Sinn -> dort weglassen.
      if (page.key !== "demnaechst") {
        const doneRow = pop.createDiv({ cls: "bt-panel-row" });
        doneRow.createSpan({ cls: "bt-panel-k", text: t("panel_show_done") });
        const sw = doneRow.createDiv({ cls: "bt-panel-switch" + (o.showDone ? " is-on" : "") });
        sw.onclick = () => apply({ showDone: !o.showDone });
      }

      // Unteraufgaben: in Liste UND Board wählbar (nur der Kalender kennt keine Unteraufgaben-
      // Darstellung), aber mit VERSCHIEDENEN Fragen (s. SubtaskDisplay in filterEngine):
      //  • Liste: Klapp-Default der verschachtelten Kinder – „Kompakt" (Badge zu) / „Eingerückt"
      //    (offen). „Einzeln" gibt es dort nicht mehr: Unteraufgaben ohne sichtbaren Parent
      //    stehen ohnehin immer einzeln (Variante A), der Rest ist die Klapp-Frage.
      //  • Board: Unterkarten „Ausblenden" (compact) / „Einblenden" (standalone) – dieselben
      //    gespeicherten Werte, eigene Labels (labelFor, wie die Status-Umbenennung unten).
      // Steht oberhalb des Anordnen-Blocks, weil es den auf „Demnächst" gar nicht gibt – dort
      // bliebe die Auswahl sonst unerreichbar.
      // Fremde Werte zeigt jedes Layout als das, was effectiveSubtasks daraus macht („indented"
      // im Board als „Einblenden", „standalone" in der Liste als „Kompakt"). Der gespeicherte
      // Wert bleibt unangetastet und wirkt im anderen Layout weiter (nicht destruktiv, wie bei
      // den Gruppierungen, die das Board nicht anbietet).
      if (o.layout !== "calendar") {
        const subsLabelFor = o.layout === "board"
          ? (v: string) => t(v === "compact" ? "panel_subs_hide" : "panel_subs_show")
          : undefined;
        ddRow(pop, t("panel_subtasks"), o.layout === "board" ? BOARD_SUBTASK_DISPLAYS : SUBTASK_DISPLAYS,
          effectiveSubtasks(o), "panel_subs_",
          // Moduswechsel = „alle auf/zu": gemerkte Einzel-Badge-Klicks verwerfen, sonst
          // überstimmen sie den neuen Modus und er scheint nichts zu tun (s. resetSubtaskToggles).
          (v) => { resetSubtaskToggles(ctx); apply({ subtasks: v as SubtaskDisplay }); }, subsLabelFor);
      }

      // Sortieren/Gruppieren: volle Seiten UND „Heute" (dort ersetzt eine aktive Gruppierung den
      // Überfällig/Heute-Split). „Demnächst" bleibt bewusst eine reine, ungruppierte Termin-Agenda.
      // Der Kalender hat seine Achse (das Datum) fest vorgegeben – Sortieren/Gruppieren wäre dort
      // wirkungslos und wird deshalb gar nicht erst angeboten. Gespeicherte Werte bleiben erhalten
      // (nicht destruktiv: zurück in Liste/Board wirken sie wieder).
      if (o.layout !== "calendar" && (page.tier === "full" || page.key === "heute" || page.key === "demnaechst")) {
        // Gruppieren anbieten. In den Datums-Agenda-LISTEN (Heute/Demnächst) ist „Keine" deckungsgleich
        // mit „Datum" (beide = Überfällig/Heute bzw. die Tages-Agenda) -> dort „Keine" verbergen, Default
        // „Datum". Im BOARD sind „Keine"(=Status-Spalten) und „Datum"(=Spalte je Tag) verschieden, deshalb
        // bleibt „Keine" im Heute-Board (Status-Default). Das Demnächst-Board ist bewusst Datum-Default
        // (keine Status-Spalten). Volle Seiten: „Keine" = flache Liste, echt verschieden von „Datum".
        const hideNone = page.key === "demnaechst" || (page.key === "heute" && o.layout !== "board");
        const groups = hideNone ? groupOptions(page.kind).filter((g) => g !== "none") : groupOptions(page.kind);
        const shownGroup = groups.includes(o.group) ? o.group : (hideNone ? "date" : "none");
        // Zähler in der Überschrift = wie viele der drei Zeilen vom Normalfall abweichen. Auf den
        // Agenda-Seiten ist „Datum" der Normalfall, nicht „Keine" (s. hideNone) – sonst zählte die
        // Vorgabe selbst als Abweichung.
        const defGroup: FilterGroup = hideNone ? "date" : DEFAULT_OPTIONS.group;
        const n = (o.sort !== DEFAULT_OPTIONS.sort ? 1 : 0) + (shownGroup !== defGroup ? 1 : 0)
          + (hasSortDir(o.sort) && o.sortDir !== DEFAULT_OPTIONS.sortDir ? 1 : 0);
        if (cap(t("filter_arrange"), "arrange", n)) {
          // Sortieren · Gruppieren · Richtung stehen als EIN Block enger beieinander (wie die Zeilen
          // im Filter-Modal) – sie beantworten zusammen eine Frage: in welcher Ordnung erscheint was.
          const box = pop.createDiv({ cls: "bt-panel-tight" });
          ddRow(box, t("filter_sort"), SORTS, o.sort, "filter_sort_", (v) => apply({ sort: v as FilterSort }));
          // Im Board ist „Keine" faktisch „nach Status" (das Board braucht eine Spalten-Achse) -> so benennen.
          const groupLabelFor = o.layout === "board" ? (v: string) => v === "none" ? t("filter_group_status") : t("filter_group_" + v) : undefined;
          ddRow(box, t("filter_group"), groups, shownGroup, "filter_group_", (v) => apply({ group: v as FilterGroup }), groupLabelFor);
          // Richtung gilt für Sortierung UND Gruppen. Bei „smart" gibt es keine – die Zeile entfällt
          // dann ganz (statt sie auszugrauen: ein totes Bedienelement erklärt sich nicht von selbst).
          if (hasSortDir(o.sort)) {
            ddRow(box, t("filter_dir"), SORT_DIRS, o.sortDir, "filter_dir_", (v) => apply({ sortDir: v as SortDir }));
          }
        }
      }

      // ── Filter: dieselben Kriterien wie im Editor eines gespeicherten Filters, nur flüchtig ──
      // Die Facetten-Definitionen kommen aus facets.ts und sind buchstäblich dieselben, die das
      // Filter-Modal zeichnet; hier landet jede Änderung sofort in der Seite statt in einer Notiz.
      if (facets.length && cap(t("filter_facets"), "filter", activeFacetCount(c))) {
        const box = pop.createDiv({ cls: "bt-panel-tight" });
        const syncCount = (): void => { const n = activeFacetCount(c); critCount?.setText(n ? String(n) : ""); };
        for (const f of buildFacets(ctx.plugin, facets, () => c, setCrit, "open")) {
          renderFacet(box, f, PANEL_STYLE, syncCount);
        }
        // Brücke zum gespeicherten Filter: was hier eingestellt ist, lässt sich als Filternotiz
        // festhalten – mitsamt der Achse dieser Seite (s. presetFor). Ohne diesen Weg stünden
        // zwei Filtersysteme unverbunden nebeneinander.
        // Plus-Zeichen wie bei „+ Aufgabe hinzufügen" (dieselbe .bt-add-icon-Maske): Beide legen
        // etwas Neues an, und der Knopf soll auf den ersten Blick als solcher lesbar sein statt
        // als weitere Einstellung. Die Icon-Variablen gelten auch im Popover (.bt-pop, s. CSS).
        const save = pop.createEl("button", { cls: "bt-panel-save" });
        save.createSpan({ cls: "bt-add-icon" });
        save.createSpan({ text: t("filter_save_as") });
        save.onclick = () => { close(); new FilterModal(ctx.plugin, undefined, presetFor(ctx.page, c)).open(); };
      }

      const reset = pop.createEl("button", { cls: "bt-panel-reset", text: t("filter_reset") });
      reset.onclick = () => {
        resetSubtaskToggles(ctx);
        ctx.resetOptions();   // setzt Anzeige-Optionen UND Ansichtsfilter zurück
        o = { ...DEFAULT_OPTIONS }; c = { ...DEFAULT_CRITERIA };
        render();
      };
    };
    render();
  });
}

/**
 * Eine Zeile „Label + Dropdown" für die einfachen Anzeige-Optionen (Werte-Liste mit
 * Übersetzungs-Präfix). Benutzt dasselbe Bedienelement wie die Filter-Facetten (facets.ts) –
 * bewusst KEIN natives <select>, dessen aufgeklapptes Menü das Betriebssystem zeichnet.
 * `labelFor` überschreibt optional den Text einzelner Optionen.
 */
function ddRow(parent: HTMLElement, label: string, values: readonly string[], current: string, keyPrefix: string,
  onChange: (v: string) => void, labelFor?: (v: string) => string): void {
  const opts = values.map((v) => ({ key: v, label: labelFor?.(v) ?? t(keyPrefix + v) }));
  selectControl(parent, label, opts, () => current, onChange, PANEL_STYLE);
}

/** Anzeige-Knopf für den Seitenkopf (öffnet das Panel; Punkt/Zahl = weicht vom Standard ab). */
export function anzeigeButton(head: HTMLElement, ctx: PageCtx): void {
  const btn = head.createEl("button", { cls: "bt-anzeige" });
  setIcon(btn.createSpan({ cls: "bt-anzeige-ic" }), "sliders-horizontal");
  btn.createSpan({ cls: "bt-anzeige-lbl", text: t("view_display") });
  const o = ctx.opts;
  // Die Richtung zählt nur mit, wenn sie überhaupt gilt – bei „smart" gibt es keine, und ein
  // gespeicherter Wert von einer früheren Sortierung darf den Punkt nicht setzen (das Panel
  // zeigt die Zeile dort ja auch nicht: derselbe hasSortDir-Vorbehalt).
  const modified = o.layout !== DEFAULT_OPTIONS.layout || o.sort !== DEFAULT_OPTIONS.sort || o.group !== DEFAULT_OPTIONS.group
    // Unteraufgaben: die WIRKSAMEN Werte vergleichen. Ein gespeichertes „standalone" ist in der
    // LISTE keine Abweichung (wirkt dort als „Kompakt" = Vorgabe), im Board schon („Einblenden").
    // Ein Punkt auf dem Rohwert behauptete sonst eine Abweichung, die man nicht sieht (wie
    // zuvor bei der Richtung unter „smart").
    || o.showDone !== DEFAULT_OPTIONS.showDone
    || effectiveSubtasks(o) !== effectiveSubtasks({ layout: o.layout })
    || (hasSortDir(o.sort) && o.sortDir !== DEFAULT_OPTIONS.sortDir);
  // Ein Filter VERBIRGT Aufgaben – dafür ist ein stiller Punkt zu wenig Signal: Er sähe genauso
  // aus wie eine geänderte Sortierung, die nichts wegnimmt. Also die ANZAHL der Kriterien, und
  // sie ersetzt den Punkt (zwei Marker nebeneinander erklärten sich nicht).
  const n = activeFacetCount(ctx.crit);
  if (n) btn.createSpan({ cls: "bt-anzeige-n", text: String(n) });
  else if (modified) btn.createSpan({ cls: "bt-anzeige-dot" });
  btn.onclick = () => openViewPanel(btn, ctx);
}
