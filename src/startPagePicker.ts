import { App, FuzzySuggestModal, FuzzyMatch, setIcon } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { PageRef, StartPage } from "./pageCtx";
import { VIEW_IDS, VIEW_ICON, viewTitle } from "./heuteView";
import { listProjectsAndAreas, INBOX_KEY } from "./taskService";
import { listFilters } from "./filterService";
import { t } from "./i18n";

/**
 * Die AUSWAHL der Startseite – Liste und Wähler. Getrennt von `startPage.ts`, weil dort die reine
 * Entscheidungslogik liegt: Sie darf nichts von Ansichten, Modalen oder dem Vault wissen, sonst
 * wäre sie nicht ohne die halbe Oberfläche testbar.
 */

const isRef = (s: StartPage | undefined | null): s is PageRef =>
  !!s && typeof s === "object" && typeof s.key === "string";

/** Ein Eintrag im Seiten-Wähler. `value` ist das, was gespeichert wird. */
export interface StartPageOption {
  value: StartPage;
  label: string;
  icon: string;
  /** Art, rechts in der Zeile: „Ansicht", „Projekt", … Leer beim Sondereintrag. */
  kind: string;
}

/** Alles, was man als Startseite wählen kann – in derselben Reihenfolge wie die Seitenleiste.
 *
 *  **Ausgeblendete Einträge sind dabei**, gekennzeichnet. „Aus der Seitenleiste ausblenden" heißt
 *  „nicht im Weg", nicht „gibt es nicht": Die Seite lässt sich weiter über die Verwaltung öffnen,
 *  und wer sie ausblendet, während sie seine Startseite ist, soll sie behalten dürfen. Fehlten sie
 *  hier, widerspräche die Liste außerdem `pageExists` – dort gelten sie als vorhanden.
 *
 *  ARCHIVIERTE fehlen (`listProjectsAndAreas` liefert sie gar nicht erst): Ein abgelegtes Projekt
 *  als Startseite wäre ein Widerspruch. Wird die Startseite archiviert, greift der Rückfall auf
 *  „Heute" samt Hinweis in den Einstellungen.
 *
 *  Verwaltungsseiten fehlen ebenfalls – sie zeigen keine Aufgaben. */
export function listStartPages(plugin: BeautyTasksPlugin): StartPageOption[] {
  const out: StartPageOption[] = [
    { value: "last", label: t("set_start_view_last"), icon: "history", kind: "" },
    { value: { kind: "project", key: INBOX_KEY }, label: t("nav_inbox"), icon: "inbox", kind: t("kind_view") },
  ];
  for (const id of VIEW_IDS) {
    out.push({ value: { kind: "view", key: id }, label: viewTitle(id), icon: VIEW_ICON[id], kind: t("kind_view") });
  }
  /** Art-Kennzeichen, bei ausgeblendeten Einträgen ergänzt. */
  const art = (basis: string, hidden: boolean): string => hidden ? basis + " · " + t("start_page_hidden") : basis;
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  for (const a of bereiche) out.push({ value: { kind: "project", key: a.path }, label: a.name, icon: a.icon || "folder", kind: art(t("kind_area"), a.hidden) });
  for (const p of projekte) out.push({ value: { kind: "project", key: p.path }, label: p.name, icon: p.icon || "hash", kind: art(t("kind_project"), p.hidden) });
  for (const fl of plugin.sortFilters(listFilters(plugin.app))) {
    out.push({ value: { kind: "filter", key: fl.path }, label: fl.name, icon: fl.icon || "filter", kind: art(t("kind_filter"), fl.hidden) });
  }
  for (const l of plugin.getLabels()) {
    out.push({ value: { kind: "label", key: l.name }, label: l.name, icon: "hash", kind: art(t("kind_label"), !plugin.isLabelVisible(l.name)) });
  }
  return out;
}

/**
 * Beschriftung der aktuellen Wahl für die Einstellungszeile.
 *
 * `missing` kommt aus `pageExists` und NICHT daraus, ob die Auswahlliste einen Treffer hat: Beides
 * auseinanderlaufen zu lassen war ein Fehler – ein ausgeblendetes Projekt fehlte in der Liste,
 * galt aber als vorhanden, und die Zeile behauptete fälschlich, es gäbe die Seite nicht mehr.
 */
export function startPageLabel(plugin: BeautyTasksPlugin, setting: StartPage | undefined | null):
  { label: string; icon: string; missing: boolean } {
  if (setting === "last") return { label: t("set_start_view_last"), icon: "history", missing: false };
  if (!isRef(setting)) return { label: viewTitle("heute"), icon: VIEW_ICON.heute, missing: false };
  if (!plugin.pageExists(setting)) return { label: setting.key, icon: "alert-triangle", missing: true };
  const hit = listStartPages(plugin).find((o) => isRef(o.value) && samePageValue(o.value, setting));
  return { label: hit?.label ?? setting.key, icon: hit?.icon ?? "file", missing: false };
}

const samePageValue = (a: PageRef, b: PageRef): boolean => a.kind === b.kind && a.key === b.key;

/** Der Wähler: Obsidians eigene Suchliste, damit Tastatur und Bedienung die der Befehlspalette sind. */
export class StartPageModal extends FuzzySuggestModal<StartPageOption> {
  constructor(app: App, private options: StartPageOption[], private current: StartPage | undefined,
    private onChoose: (value: StartPage) => void) {
    super(app);
    this.setPlaceholder(t("start_page_search"));
  }
  getItems(): StartPageOption[] { return this.options; }
  getItemText(o: StartPageOption): string { return o.label + " " + o.kind; }
  onChooseItem(o: StartPageOption): void { this.onChoose(o.value); }

  renderSuggestion(m: FuzzyMatch<StartPageOption>, el: HTMLElement): void {
    const o = m.item;
    el.addClass("bt-startpage-row");
    const ic = el.createSpan({ cls: "bt-startpage-icon" });
    setIcon(ic, o.icon);
    el.createSpan({ cls: "bt-startpage-name", text: o.label });
    // Häkchen bei der aktuellen Wahl – wie in der Seitenleiste die aktive Seite.
    const gewaehlt = this.current === "last" ? o.value === "last"
      : isRef(this.current) && isRef(o.value) && samePageValue(o.value, this.current);
    if (gewaehlt) setIcon(el.createSpan({ cls: "bt-startpage-check" }), "check");
    if (o.kind) el.createSpan({ cls: "bt-startpage-kind", text: o.kind });
  }
}
