import { App, TFile, WorkspaceLeaf, moment } from "obsidian";
import type { PageRef } from "./pageCtx";
import type { BeautyTasksSettings } from "./types";
import { INBOX_KEY } from "./taskService";

/**
 * Die rechte Hälfte des Planungs-Splits: WELCHE Tabs dort entstehen und in welcher Reihenfolge.
 *
 * ── Warum die Reihenfolge und kein zweites Feld „Standard" ──────────────────
 * Die Reihenfolge IST die Rangfolge: Der erste eingeschaltete Eintrag ist der Tab, der vorn
 * liegt. Eine getrennte Angabe „das ist der Standard" müsste umgebogen werden, sobald man ihr
 * Ziel abschaltet – und der Nutzer müsste dabei mitten in den Einstellungen etwas entscheiden,
 * das er gerade nicht entscheiden wollte. Aus der Reihenfolge folgt der Standard von selbst,
 * und die Liste in den Einstellungen ist zugleich ein Bild der Tab-Leiste, die sie erzeugt.
 *
 * Übrig bleibt genau eine Regel, die erzwungen werden muss: Mindestens einer bleibt an
 * (s. readPlanTabs) – sonst hätte „Planen" rechts nichts zu öffnen und täte sichtbar nichts.
 */
export type PlanTabId = "calendar" | "note" | "daily";
export interface PlanTab { id: PlanTabId; on: boolean; }

/**
 * Auslieferungszustand. Nur `calendar` an: Der Befehl verhält sich damit exakt wie vor dieser
 * Einstellung – wer nichts umstellt, merkt von der Erweiterung nichts.
 *
 * Nur als Vorlage lesen, nie herausgeben: Ein Aufrufer, der eine Standard-Sammlung per Verweis
 * bekommt und darin einen Schalter umlegt, ändert damit den Standard für alle (der Fehler aus
 * dem Export/Import-Umbau).
 */
const FACTORY: readonly PlanTab[] = [
  { id: "calendar", on: true },
  { id: "note", on: false },
  { id: "daily", on: false },
];

export const PLAN_TAB_IDS: readonly PlanTabId[] = FACTORY.map((e) => e.id);

const isPlanTabId = (v: unknown): v is PlanTabId => typeof v === "string" && (PLAN_TAB_IDS as readonly string[]).includes(v);

/**
 * Gespeicherte Liste -> vollständige, gültige Liste (immer frische Objekte).
 *
 * Unbekannte und doppelte Einträge fallen weg, fehlende hängen HINTEN an und sind AUS: Ein
 * Update darf niemandem ungefragt einen weiteren Tab in seinen Split stellen.
 */
export function readPlanTabs(settings: BeautyTasksSettings): PlanTab[] {
  const seen = new Set<PlanTabId>();
  const out: PlanTab[] = [];
  for (const raw of Array.isArray(settings.planTabs) ? settings.planTabs : []) {
    const entry = raw as Partial<PlanTab> | null;
    const id = entry?.id;
    if (!isPlanTabId(id) || seen.has(id)) continue;
    seen.add(id);
    out.push({ id, on: entry?.on === true });
  }
  for (const f of FACTORY) if (!seen.has(f.id)) out.push({ id: f.id, on: false });
  if (!out.some((e) => e.on)) {
    const fallback = out.find((e) => e.id === "calendar") ?? out[0];
    fallback.on = true;
  }
  return out;
}

/**
 * Soll der Befehl die LINKE Hälfte auf Liste stellen?
 *
 * Standard ja – die Planungsansicht ist die Anordnung „Liste links, Kalender rechts", und aus
 * einer flachen Liste terminiert man am schnellsten. Wer seine Projekte als Board führt, erlebt
 * das aber bei jedem Aufruf als Bruch; ausgeschaltet behält die Seite links ihr eigenes Layout.
 * Ziehen in den Kalender geht aus dem Board genauso.
 *
 * `!== false` statt `=== true`: nie gewählt bedeutet ja, ohne dass der Wert in data.json stehen
 * muss (dasselbe Muster wie calPanel).
 */
export const forceListLeft = (settings: BeautyTasksSettings): boolean => settings.planForceList !== false;

/** Die Notiz der Seite: Projekt, Bereich oder gespeicherter Filter. Bei diesen dreien IST der
 *  `key` der Pfad ihrer Notiz. Alles andere hat keine – ein Label ist ein Name, der Eingang und
 *  die eingebauten Ansichten sind gar keine Datei. */
export function pageNoteFile(app: App, page: PageRef): TFile | null {
  const path = page.kind === "filter" ? page.key
    : (page.kind === "project" && page.key !== INBOX_KEY) ? page.key
      : null;
  if (!path) return null;
  const f = app.vault.getAbstractFileByPath(path);
  return f instanceof TFile ? f : null;
}

/**
 * Die Icons der Notiz-Reiter.
 *
 * `file-text` ist dasselbe Zeichen wie hinter „Projektnotiz öffnen" im Kontextmenü – und dort
 * steht es EINHEITLICH für Projekt, Bereich und Filter (s. navMenu.ts). Diese Einheitlichkeit
 * wird hier bewusst fortgesetzt: Der Reiter beantwortet „was ist das?" (die Notiz der Seite),
 * nicht „von welcher Art ist die Seite?" – letzteres steht ohnehin im Titel daneben.
 *
 * Die Tagesnotiz bekommt „sun" und ausdrücklich KEIN zweites Kalenderblatt: Neben dem
 * Kalender-Reiter (calendar-days) wären zwei davon bei 16 px nicht auseinanderzuhalten.
 */
export const NOTE_ICON = "file-text";
export const DAILY_ICON = "sun";

/** Zugriff auf das Kern-Plugin „Tägliche Notizen". Nicht Teil der öffentlichen API – deshalb an
 *  genau EINER Stelle eng typisiert; alles Weitere geht über die Funktionen hier. */
interface DailyNotesCore { enabled?: boolean; instance?: { options?: Record<string, unknown> } }
function dailyCore(app: App): DailyNotesCore | null {
  const host = app as App & { internalPlugins?: { getPluginById?(id: string): DailyNotesCore | null } };
  return host.internalPlugins?.getPluginById?.("daily-notes") ?? null;
}

/** Ist das Kern-Plugin überhaupt eingeschaltet? Ohne es gibt es keine Tagesnotiz, die wir
 *  öffnen könnten – der Eintrag wird dann gar nicht erst angeboten. */
export function dailyNotesEnabled(app: App): boolean {
  return dailyCore(app)?.enabled === true;
}

/** Das EINE, was wir von `moment` brauchen. Obsidian reicht die Bibliothek zwar typisiert
 *  durch (`moment: typeof Moment`), aber diese Typkette hängt daran, dass das Paket `moment`
 *  – eine Abhängigkeit von `obsidian`, keine von uns – im Prüf-Setup auch wirklich aufgelöst
 *  wird. Wo das nicht klappt, wird der Aufruf zu `any` und schleppt das durch. Deshalb wie bei
 *  `DailyNotesCore` oben: an genau EINER Stelle eng binden, danach ist der Typ unsere Sache. */
type DateFormatter = { format(fmt: string): string };
const today = (): DateFormatter => (moment as unknown as () => DateFormatter)();

/** Die HEUTIGE Tagesnotiz, sofern sie schon existiert. Format und Ordner kommen aus dem
 *  Kern-Plugin; fehlen sie, gilt dessen eigener Standard (Datum im Vault-Wurzelordner). */
export function todaysDailyNote(app: App): TFile | null {
  const o = dailyCore(app)?.instance?.options ?? {};
  const fmt = typeof o.format === "string" && o.format.trim() ? o.format : "YYYY-MM-DD";
  const folder = typeof o.folder === "string" ? o.folder.replace(/^\/+|\/+$/g, "") : "";
  const name = today().format(fmt) + ".md";
  const f = app.vault.getAbstractFileByPath(folder ? folder + "/" + name : name);
  return f instanceof TFile ? f : null;
}

/** Kurz darauf warten, dass eine gerade angelegte Datei im Vault auftaucht. Das Anlegen einer
 *  Tagesnotiz (samt Vorlage) läuft asynchron; ein Blick direkt danach sähe sie noch nicht.
 *  `window.setTimeout` statt `activeWindow`: Vorgabe des obsidianmd-Linters. */
function waitForFile(app: App, find: () => TFile | null, tries = 20): Promise<TFile | null> {
  return new Promise((resolve) => {
    const tick = (left: number): void => {
      const f = find();
      if (f || left <= 0) { resolve(f); return; }
      window.setTimeout(() => tick(left - 1), 50);
    };
    tick(tries);
  });
}

/**
 * Die heutige Tagesnotiz in einem bestimmten Tab öffnen. Liefert, ob dort danach etwas steht.
 *
 * Existiert sie, wird sie schlicht geöffnet – deterministisch und ohne Nebenwirkung. Existiert
 * sie NICHT, führen wir Obsidians eigenen Befehl aus, statt selbst eine Datei anzulegen: Ordner,
 * Dateiname und vor allem die VORLAGE des Nutzers gehören dem Kern-Plugin. Eine von uns erzeugte
 * leere Notiz sähe aus wie die Tagesnotiz, käme aber ohne seine Vorlage – genau die stille Sorte
 * Falsch, die man hinterher niemandem erklären kann.
 *
 * Danach wird sie in UNSEREN Tab geholt, statt sich darauf zu verlassen, wo der Befehl sie
 * aufgemacht hat: Er ist nicht unserer, und wo er öffnet, ist nicht zugesichert. So bleibt die
 * Platzierung in unserer Hand – auch wenn Obsidian das eines Tages anders macht.
 */
export async function openDailyNote(app: App, leaf: WorkspaceLeaf): Promise<boolean> {
  let file = todaysDailyNote(app);
  if (!file) {
    app.workspace.setActiveLeaf(leaf, { focus: true });
    const host = app as App & { commands?: { executeCommandById?(id: string): boolean } };
    host.commands?.executeCommandById?.("daily-notes");
    file = await waitForFile(app, () => todaysDailyNote(app));
  }
  if (!file) return false;
  await leaf.openFile(file);
  return true;
}

/** Kann diese Seite den Eintrag überhaupt liefern? */
export function planTabAvailable(app: App, page: PageRef, id: PlanTabId): boolean {
  if (id === "note") return pageNoteFile(app, page) !== null;
  if (id === "daily") return dailyNotesEnabled(app);
  return true;   // Kalender: Seiten ohne Kalender bieten „Planen" gar nicht erst an (tier "none")
}

/**
 * Die Tabs, die für DIESE Seite tatsächlich entstehen – in der eingestellten Reihenfolge.
 *
 * Rückfall auf den Kalender, wenn nichts übrig bleibt: Steht die Einstellung auf „nur
 * Projektnotiz" und man ruft „Planen" auf Heute oder einem Label, hätte die rechte Hälfte
 * sonst keinen Inhalt und der Befehl täte scheinbar nichts. Einen Kalender hat jede Seite,
 * die den Befehl überhaupt anbietet.
 */
export function activePlanTabs(app: App, settings: BeautyTasksSettings, page: PageRef): PlanTabId[] {
  const on = readPlanTabs(settings)
    .filter((e) => e.on)
    .map((e) => e.id)
    .filter((id) => planTabAvailable(app, page, id));
  return on.length ? on : ["calendar"];
}
