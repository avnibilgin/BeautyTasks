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
 *  Ausgeblendete und archivierte Einträge fehlen: Was in der Nav nicht auftaucht, taugt nicht
 *  als Startseite. Verwaltungsseiten fehlen ebenfalls – sie zeigen keine Aufgaben. */
export function listStartPages(plugin: BeautyTasksPlugin): StartPageOption[] {
  const out: StartPageOption[] = [
    { value: "last", label: t("set_start_view_last"), icon: "history", kind: "" },
    { value: { kind: "project", key: INBOX_KEY }, label: t("nav_inbox"), icon: "inbox", kind: t("kind_view") },
  ];
  for (const id of VIEW_IDS) {
    out.push({ value: { kind: "view", key: id }, label: viewTitle(id), icon: VIEW_ICON[id], kind: t("kind_view") });
  }
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  for (const a of bereiche) if (!a.hidden) out.push({ value: { kind: "project", key: a.path }, label: a.name, icon: a.icon || "folder", kind: t("kind_area") });
  for (const p of projekte) if (!p.hidden) out.push({ value: { kind: "project", key: p.path }, label: p.name, icon: p.icon || "hash", kind: t("kind_project") });
  for (const fl of plugin.sortFilters(listFilters(plugin.app))) {
    if (!fl.hidden) out.push({ value: { kind: "filter", key: fl.path }, label: fl.name, icon: fl.icon || "filter", kind: t("kind_filter") });
  }
  for (const name of plugin.getVisibleLabels()) {
    out.push({ value: { kind: "label", key: name }, label: name, icon: "hash", kind: t("kind_label") });
  }
  return out;
}

/** Beschriftung der aktuellen Wahl für die Einstellungszeile. `missing` = Ziel gibt es nicht mehr. */
export function startPageLabel(plugin: BeautyTasksPlugin, setting: StartPage | undefined | null):
  { label: string; icon: string; missing: boolean } {
  if (setting === "last") return { label: t("set_start_view_last"), icon: "history", missing: false };
  const hit = isRef(setting) ? listStartPages(plugin).find((o) => isRef(o.value) && samePageValue(o.value, setting)) : undefined;
  if (hit) return { label: hit.label, icon: hit.icon, missing: false };
  if (isRef(setting)) return { label: setting.key, icon: "alert-triangle", missing: true };
  return { label: viewTitle("heute"), icon: VIEW_ICON.heute, missing: false };
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
