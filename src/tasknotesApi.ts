import { App } from "obsidian";
import { Priority } from "./types";
import { firstOpenStatus, firstDoneStatus, isKnownStatus, allStatuses } from "./statuses";

/**
 * Was TaskNotes selbst über seine Konfiguration verrät — statt sie zu raten.
 *
 * TaskNotes 4.11.1 bietet eine dokumentierte In-Process-API an (`app.plugins.getPlugin("tasknotes").api`,
 * `apiVersion = 1`): kein Server, kein Token, nur innerhalb von Obsidian. Für den Import zählen drei
 * Auskünfte:
 *
 *   `api.settings.snapshot()`   – die vollen Einstellungen, darin `taskTag` und `fieldMapping`
 *   `api.catalog.statuses()`    – die Status des Nutzers, jeder mit `isCompleted`
 *   `api.catalog.priorities()`  – die Prioritäten, jede mit `weight`
 *
 * Warum das nötig ist: Beides ist bei TaskNotes **frei konfigurierbar** (so steht es auch in deren
 * Spezifikation). Unser Importeur hatte die Feldnamen fest verdrahtet und die Status über eine
 * Namenstabelle geraten. Wer seine Felder umbenannt hatte, importierte stillschweigend leere
 * Aufgaben; wer eigene Status führte, verlor deren Bedeutung — „In progress" wurde zu „offen",
 * weil unsere Tabelle den Namen nicht kannte.
 *
 * **Alles hier ist optional und darf nie stören.** Fehlt TaskNotes, ist es deaktiviert, hat eine
 * ältere Fassung ohne API oder wirft es unerwartet — dann gilt weiter, was vorher galt. Eine
 * fremde API ist ein Angebot, keine Voraussetzung.
 */

/** Ein Status, wie TaskNotes ihn führt. Nur die Felder, auf die wir uns stützen. */
export interface TnStatus { value?: unknown; label?: unknown; isCompleted?: unknown }
/** Eine Priorität, wie TaskNotes sie führt. `weight` ordnet sie (klein = niedrig). */
export interface TnPriority { value?: unknown; label?: unknown; weight?: unknown }

export interface TnConfig {
  /** Frontmatter-Tag, an dem TaskNotes seine Aufgaben erkennt. */
  taskTag: string | null;
  /** Rolle -> Frontmatter-Schlüssel, wie der Nutzer sie eingestellt hat. */
  fieldMapping: Record<string, string>;
  statuses: TnStatus[];
  priorities: TnPriority[];
}

const str = (v: unknown): string => (typeof v === "string" ? v.trim() : "");

/**
 * Konfiguration aus dem laufenden TaskNotes lesen. `null`, wenn es nichts zu holen gibt —
 * der Aufrufer bleibt dann bei seinen Vorgaben.
 *
 * Bewusst defensiv bis zur Übertreibung: Jeder Zugriff einzeln abgesichert, damit eine geänderte
 * Fassung der fremden API höchstens weniger liefert, aber nie unseren Dialog mitreißt.
 */
export function readTaskNotesConfig(app: App): TnConfig | null {
  try {
    const plugins = (app as unknown as { plugins?: { getPlugin?: (id: string) => unknown } }).plugins;
    const tn = plugins?.getPlugin?.("tasknotes") as { api?: Record<string, unknown> } | null | undefined;
    const api = tn?.api;
    if (!api || typeof api !== "object") return null;
    // Gelesen wird nach apiVersion 1. Eine höhere Zahl heißt nicht automatisch inkompatibel – die
    // Felder unten sind einzeln abgesichert –, aber sie ist der Punkt, an dem jemand nachsehen muss.

    const call = <T>(ns: string, fn: string, fallback: T): T => {
      try {
        const group = api[ns] as Record<string, unknown> | undefined;
        const f = group?.[fn];
        if (typeof f !== "function") return fallback;
        const wert: unknown = (f as () => unknown).call(group);
        return (wert ?? fallback) as T;
      } catch { return fallback; }
    };

    const settings = call<Record<string, unknown>>("settings", "snapshot", {});
    const rawMap = settings.fieldMapping;
    const fieldMapping: Record<string, string> = {};
    if (rawMap && typeof rawMap === "object") {
      for (const [role, key] of Object.entries(rawMap as Record<string, unknown>)) {
        if (str(key)) fieldMapping[role] = str(key);
      }
    }
    const statuses = call<TnStatus[]>("catalog", "statuses", []);
    const priorities = call<TnPriority[]>("catalog", "priorities", []);
    const taskTag = str(settings.taskTag) || null;
    // Nichts Brauchbares dabei? Dann so tun, als gäbe es die API nicht – ein leeres Ergebnis
    // wäre schlimmer als die Vorgaben.
    if (!taskTag && !Object.keys(fieldMapping).length && !statuses.length) return null;
    return { taskTag, fieldMapping, statuses: Array.isArray(statuses) ? statuses : [], priorities: Array.isArray(priorities) ? priorities : [] };
  } catch (e) {
    console.warn("BeautyTasks: TaskNotes-Konfiguration nicht lesbar", e);
    return null;
  }
}

// ── Übersetzung in unser Modell (rein, testbar) ───────────────────────────────

/** Feldnamen: die Einstellung des Nutzers gewinnt, für alles Übrige bleibt unsere Vorgabe.
 *  TaskNotes führt z. B. kein `tags` und kein `id` in seiner Zuordnung – dort greift die Vorgabe. */
export function mergeFieldMapping<R extends string>(defaults: Record<R, string>, tn: Record<string, string>): Record<R, string> {
  const out = { ...defaults };
  for (const role of Object.keys(defaults) as R[]) {
    const eigen = tn[role];
    if (eigen) out[role] = eigen;
  }
  return out;
}

/**
 * Status-Übersetzer aus dem Katalog des Nutzers.
 *
 * Maßgeblich ist **`isCompleted`** — die Auskunft von TaskNotes selbst, nicht unsere Vermutung
 * über den Namen. Genau daran scheiterte die Namenstabelle: „closed" hielt sie für erledigt,
 * „In progress" für unbekannt und damit für offen.
 *
 * Für die offenen Status entscheidet weiter der Name, denn ob ein offener Status „in Arbeit"
 * bedeutet, sagt TaskNotes nirgends. Trifft nichts zu, bleibt es bei der ersten offenen Phase —
 * sichtbar und bearbeitbar ist die Aufgabe damit in jedem Fall.
 */
export function buildStatusResolver(statuses: TnStatus[], nameFallback: (raw: string) => string): (raw: string) => string {
  const byValue = new Map<string, TnStatus>();
  for (const s of statuses) { const v = str(s?.value).toLowerCase(); if (v) byValue.set(v, s); }
  const doingId = allStatuses().find((s) => s.id === "doing")?.id ?? null;
  const DOING = new Set(["doing", "in-progress", "inprogress", "in progress", "started", "wip", "active"]);
  return (raw: string): string => {
    const key = str(raw).toLowerCase();
    if (!key) return firstOpenStatus();
    if (isKnownStatus(str(raw))) return str(raw);   // gleichnamiger eigener Status bei uns
    const tn = byValue.get(key);
    if (tn) {
      if (tn.isCompleted === true) return firstDoneStatus();
      if (doingId && DOING.has(key)) return doingId;
      return nameFallback(str(raw));   // Namenstabelle darf noch „cancelled" o. Ä. erkennen
    }
    return nameFallback(str(raw));
  };
}

/**
 * Prioritäts-Übersetzer. Namen zuerst (deckt die Vorgaben von TaskNotes ab), sonst über die
 * REIHENFOLGE: `weight` ordnet die Prioritäten des Nutzers, und diese Ordnung wird auf unsere
 * sechs Stufen abgebildet. „P1" von vier eigenen Stufen wird so zur höchsten statt zu „normal".
 */
const SKALA: Priority[] = ["lowest", "low", "normal", "medium", "high", "highest"];

export function buildPriorityResolver(priorities: TnPriority[], nameFallback: (raw: string) => Priority): (raw: string) => Priority {
  const sortiert = priorities
    .filter((p) => str(p?.value))
    .map((p) => ({ value: str(p.value).toLowerCase(), weight: typeof p.weight === "number" ? p.weight : 0 }))
    .sort((a, b) => a.weight - b.weight);
  const rang = new Map(sortiert.map((p, i) => [p.value, i]));
  return (raw: string): Priority => {
    const key = str(raw).toLowerCase();
    const nach = nameFallback(str(raw));
    if (nach !== "normal" || key === "normal" || !rang.has(key)) return nach;   // Name hat gegriffen
    const i = rang.get(key)!;
    const n = sortiert.length;
    if (n <= 1) return "normal";
    // Auf die sechs Stufen strecken: unterste -> lowest, oberste -> highest.
    return SKALA[Math.round((i / (n - 1)) * (SKALA.length - 1))];
  };
}
