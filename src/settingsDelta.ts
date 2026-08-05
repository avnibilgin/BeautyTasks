import { BeautyTasksSettings, DEFAULT_SETTINGS } from "./types";
import { DEFAULT_STATUSES } from "./statuses";
import { DEFAULT_FIELD_NAMES } from "./fieldNames";

/**
 * Gespeichert wird nur, was vom Standard ABWEICHT — nicht der ganze Einstellungsblock.
 *
 * Warum: Bis 1.37.2 schrieb `saveData(this.settings)` jeden Standardwert wörtlich in data.json.
 * Damit war jeder Standard eine einmalige Entscheidung auf Lebenszeit — eine Änderung im Code
 * erreichte keinen Bestandsnutzer mehr, weil dessen Datei den alten Wert festhielt. Wer die
 * Statusliste nie angefasst hat, hat sie ab jetzt gar nicht mehr in der Datei stehen und bekommt
 * Verbesserungen automatisch; wer sie angepasst hat, behält seine Fassung unangetastet.
 *
 * **Der Preis, bewusst akzeptiert:** „bewusst auf den Standardwert gestellt" ist von „nie
 * angefasst" nicht mehr zu unterscheiden. Wer „Heute" als Startansicht auswählt, hat danach
 * nichts in der Datei stehen — und würde einer späteren Änderung des Standards folgen. Deshalb
 * gilt die Regel an `DEFAULT_SETTINGS`: Standardwerte mit Bedienung werden nicht mehr geändert.
 * Muss einer doch einmal wandern, bekommt GENAU DIESE Einstellung im selben Zug einen
 * „automatisch"-Wert, wie ihn `locale` schon hat.
 *
 * Die Funktionen hier sind rein und ohne Obsidian-Bezug — Laden und Speichern liegen als Paar
 * beieinander, damit die eine Eigenschaft, auf die es ankommt, testbar ist:
 * `applyDefaults(toDelta(x))` muss wieder `x` ergeben.
 */

/**
 * Alle Standardwerte an einer Stelle. `statuses` und `fieldNames` stehen NICHT in
 * `DEFAULT_SETTINGS` (types.ts darf statuses.ts nicht importieren – das gäbe einen Zirkelbezug,
 * statuses.ts importiert types.ts). Sie werden deshalb hier zusammengeführt, wo beide Seiten
 * erlaubt sind. Ohne sie brächte die Umstellung ihren wichtigsten Fall nicht: Die Statusliste ist
 * der größte Block, den heute jede data.json wörtlich mitschleppt.
 */
export const EFFECTIVE_DEFAULTS: BeautyTasksSettings = {
  ...DEFAULT_SETTINGS,
  statuses: DEFAULT_STATUSES,
  fieldNames: DEFAULT_FIELD_NAMES,
};

/**
 * Schlüssel, die es im Code nicht mehr gibt. Sie werden beim Laden entfernt, sonst schleppte sie
 * jede data.json ewig mit: `Object.assign` zieht sie aus der Datei in die Einstellungen, und
 * `toDelta` behielte sie als „kennt der Standard nicht" bei. Genau dieselbe Falle wie bei den
 * Google-Token in 1.36.0 (s. `migrateGCalTokens`).
 */
export const OBSOLETE_KEYS = [
  "boardLayout",       // tot: nie gelesen, nie geschrieben – das Layout hängt an pageViewOptions
  "chipOrder",         // -> chipProfiles.editor.order (Flächen getrennt)
  "chipTiers",         // -> chipProfiles.editor.tiers
  "titleProperty",     // -> fieldNames.title (seit 1.32.0)
  "showParentMarker",  // ersatzlos entfallen, keine Fundstelle mehr im Code
  "areasFolder",       // ersatzlos entfallen, Bereiche liegen im projectsFolder
] as const;

/**
 * ACHTUNG bei den drei abgelösten Schlüsseln `chipOrder`/`chipTiers`/`titleProperty`: Ihre
 * Migrationen in `loadSettings` lesen die DATEI (`saved`), nicht die aufgefüllten Einstellungen —
 * genau deshalb dürfen sie hier stehen. Wer eine weitere Migration ergänzt, muss dasselbe tun:
 * Ob ein Wert ALT ist, entscheidet die Datei, nicht der Zustand nach `applyDefaults`.
 */

/** Eigener Schlüssel (nicht geerbt). `Object.hasOwn` gibt es erst ab ES2022, Ziel ist ES2020. */
const hasOwn = (o: Record<string, unknown>, k: string): boolean =>
  Object.prototype.hasOwnProperty.call(o, k) === true;

/** Tiefer Vergleich. Reihenfolge zählt in Listen, nicht in Objekten. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b || a === null || b === null) return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
    return a.every((v, i) => deepEqual(v, b[i]));
  }
  if (typeof a !== "object") return false;
  const ao = a as Record<string, unknown>, bo = b as Record<string, unknown>;
  const ak = Object.keys(ao), bk = Object.keys(bo);
  if (ak.length !== bk.length) return false;
  return ak.every((k) => hasOwn(bo, k) && deepEqual(ao[k], bo[k]));
}

/**
 * Was in die Datei gehört. Ein Schlüssel fliegt NUR raus, wenn der Standard ihn kennt UND der
 * Wert ihm gleicht. Alles andere bleibt: `gcal`, `pageViewOptions`, `schemaVersion`, die
 * Migrations-Marker – Dinge ohne Standard sind immer Nutzerinhalt und dürfen nie verschwinden.
 *
 * `undefined` wird nicht geschrieben: In JSON gäbe es das ohnehin nicht, und ein Feld, das der
 * Nutzer nie gesetzt hat, soll auch keinen Platz bekommen.
 */
export function toDelta(settings: BeautyTasksSettings): Record<string, unknown> {
  const defaults = EFFECTIVE_DEFAULTS as unknown as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(settings as unknown as Record<string, unknown>)) {
    if (value === undefined) continue;
    if ((OBSOLETE_KEYS as readonly string[]).includes(key)) continue;
    if (hasOwn(defaults, key) && deepEqual(value, defaults[key])) continue;
    out[key] = value;
  }
  return out;
}

/**
 * Die Gegenrichtung: Standardwerte, darüber die Datei. Entspricht dem bisherigen
 * `Object.assign({}, DEFAULT_SETTINGS, saved)` und entfernt zusätzlich die abgeschafften
 * Schlüssel.
 *
 * Bewusst FLACH: `toDelta` speichert verschachtelte Werte immer als Ganzes, nie zerlegt — ein
 * halb gefülltes Objekt kann also gar nicht entstehen und ein tiefes Verschmelzen brauchte es
 * nur, um Altbestände zu reparieren. Das ist ein eigener Punkt (rekursiver mergeDefaults) und
 * gehört nicht in diese Umstellung.
 */
export function applyDefaults(saved: Partial<BeautyTasksSettings> | null | undefined): BeautyTasksSettings {
  // Die verschachtelten Standardwerte werden KOPIERT herausgegeben. Sonst zeigte `settings.statuses`
  // ohne Eintrag in der Datei auf dieselbe Liste wie `DEFAULT_STATUSES`, und wer sie an Ort und
  // Stelle änderte, veränderte den Standard des ganzen Prozesses. Heute ändert niemand sie so
  // (alle Schreibstellen weisen frische Objekte zu) – aber darauf soll sich niemand verlassen müssen.
  const base: BeautyTasksSettings = {
    ...EFFECTIVE_DEFAULTS,
    statuses: EFFECTIVE_DEFAULTS.statuses?.map((s) => ({ ...s })),
    fieldNames: { ...EFFECTIVE_DEFAULTS.fieldNames },
  };
  const merged = Object.assign(base, saved ?? {}) as unknown as Record<string, unknown>;
  for (const key of OBSOLETE_KEYS) delete merged[key];
  return merged as unknown as BeautyTasksSettings;
}
