import type { Component } from "obsidian";
import type BeautyTasksPlugin from "./main";
import type { ViewOptions, PageLayout } from "./filterEngine";
import { INBOX_KEY } from "./taskService";

/**
 * ── Wer besitzt „welche Seite ist offen"? ──────────────────────────────────────────────────────
 *
 * Bis 1.33 lag das auf der Plugin-Instanz (currentView/currentProject/currentLabel/currentFilter)
 * und es gab per Konstruktion genau EINE Dashboard-Leaf. Zwei Tabs waren damit nicht zwei Tabs,
 * sondern zwei Klone derselben Anzeige: Umschalten im einen schaltete den anderen mit um.
 *
 * Seither besitzt der LEAF seine Seite (MainView), und alles, was beim Zeichnen oder in einem
 * Klick-Handler wissen muss „welcher Tab bin ich", bekommt diesen Kontext gereicht statt das
 * Plugin zu fragen. Genau deshalb ist `plugin` hier ein Feld und kein zweiter Parameter: die
 * Zeichen-Funktionen tauschen einfach ihren `plugin`-Parameter gegen `ctx` und holen sich das
 * Plugin daraus – der Rest ihres Rumpfs bleibt unverändert.
 *
 * Was AM PLUGIN bleibt, ist alles, was es wirklich nur einmal gibt: der Index, die Einstellungen,
 * die gespeicherten Anzeige-Optionen JE SEITE (Frontmatter/Settings) und die Seitenleiste – die
 * markiert die Seite des gerade AKTIVEN Tabs (plugin.activePage()), nicht „die" Seite.
 */

/** Welche Art Seite ein Tab zeigt. „manage" trägt in `key` seinen Bereich (projects/areas/…). */
export type PageKind = "view" | "project" | "label" | "filter" | "manage";

/** Die Seite eines Tabs – der vollständige Navigations-Zustand, seriell in getState/setState. */
export interface PageRef {
  kind: PageKind;
  /** ViewId · Projekt-/Filterpfad · Labelname · Verwaltungs-Bereich. */
  key: string;
}

export const samePage = (a: PageRef, b: PageRef): boolean => a.kind === b.kind && a.key === b.key;

/** Übersetzungs-Schlüssel der Überschrift eines Verwaltungs-Bereichs. Liegt hier, weil sowohl die
 *  Seite selbst (manageView) als auch ihr Tab-Titel (MainView.getDisplayText) ihn braucht – und
 *  manageView von heuteView nicht importieren darf (heuteView importiert manageView). */
export function manageTitleKey(section: string): string {
  return section === "filters" ? "nav_filters"
    : section === "labels" ? "tab_labels"
      : section === "areas" ? "group_area" : "group_project";
}

/** Speicher-Schlüssel und „Fernbedienungs-Größe" einer Seite – wo ihre Anzeige-Optionen liegen
 *  und wie viel das Anzeige-Panel dort überhaupt anbietet. Reine Funktion der Seite (früher
 *  plugin.currentPage(), das dafür den globalen Zustand las). */
export function pageInfo(page: PageRef): { key: string; tier: "full" | "light" | "none"; kind: "view" | "project" | "label" | "filter" } {
  if (page.kind === "manage") return { key: "manage", tier: "none", kind: "view" };
  if (page.kind === "filter") return { key: page.key, tier: "full", kind: "filter" };
  if (page.kind === "label") return { key: page.key, tier: "full", kind: "label" };
  // Eingang: eingebaute Ansicht ohne Notiz -> Anzeige-Optionen in den Settings (wie Heute/Demnächst).
  if (page.kind === "project") return page.key === INBOX_KEY
    ? { key: "inbox", tier: "full", kind: "view" }
    : { key: page.key, tier: "full", kind: "project" };
  const v = page.key;
  return { key: v, tier: (v === "heute" || v === "demnaechst") ? "light" : "none", kind: "view" };
}

/**
 * Alles, was eine Zeichnung (und jeder darin erzeugte Klick-Handler) über IHREN Tab wissen muss.
 * Wird von MainView.draw() frisch gebaut und nach unten gereicht.
 */
export interface PageCtx {
  readonly plugin: BeautyTasksPlugin;
  /** Stabile Kennung DIESES Tabs. Gehört in jeden Schlüssel für transienten Zustand
   *  (Scrollposition, aufgeklappte Badges, Kalender-Anker) – sonst teilen sich zwei Tabs
   *  derselben Seite einen Eintrag und ziehen sich gegenseitig an die falsche Stelle. */
  readonly id: string;
  readonly page: PageRef;
  /** Speicher-Schlüssel der Seite (pageInfo().key) – u. a. für pageShowsEvents. */
  readonly pageKey: string;
  /** Effektive Anzeige-Optionen: Seiten-Standard, überlagert vom Layout DIESES Tabs. */
  readonly opts: ViewOptions;
  /** Lifecycle für Markdown-Titel (Links) – je Zeichnung frisch, siehe MainView.draw(). */
  readonly titleComp: Component | null;
  /** Untergeordneter Zustand der Seite: „Erledigt“-Tabs, Verwaltungs-Tabs, Erledigt-Sektion. */
  readonly doneTab: "done" | "trash";
  readonly manageTab: "active" | "archive";
  readonly doneCollapsed: boolean;
  setDoneTab(v: "done" | "trash"): void;
  setManageTab(v: "active" | "archive"): void;
  setDoneCollapsed(v: boolean): void;
  /** NUR diesen Tab neu zeichnen. */
  redraw(): void;
  /** Diesen Tab auf eine andere Seite schicken (Backlink, „Zum Projekt", Verwaltungs-Liste). */
  open(page: PageRef): void;
  /** Anzeige-Option der Seite setzen (Frontmatter/Settings) – gilt für alle Tabs dieser Seite. */
  setOption(patch: Partial<ViewOptions>): void;
  /** Layout umstellen: gehört dem Tab (s. MainView.setLayout). */
  setLayout(layout: PageLayout): void;
  /** Anzeige-Optionen der Seite auf Vorgabe zurücksetzen (inkl. Layout-Wahl dieses Tabs). */
  resetOptions(): void;
}
