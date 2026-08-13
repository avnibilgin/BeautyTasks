// Namen der Frontmatter-Felder, die BeautyTasks benutzt.
//
// `type`, `title` und `labels` sind beliebte Eigenschaftsnamen – wer sie schon für etwas Eigenes
// belegt, stellt hier andere ein. Konfigurierbar ist nur der NAME, nicht der Wert: Wer `bt_type`
// einstellt, kann unter diesem Schlüssel gar nicht mehr kollidieren.
//
// Bewusst nur diese drei. Alle übrigen Felder (`status`, `due`, `description` …) liest
// taskIndex.parse erst, NACHDEM `type` stimmt – eine Kollision dort trifft also ohnehin nur
// Notizen, die bereits Aufgaben sind. Weitere Felder aufzunehmen ist ein Eintrag in FieldId,
// DEFAULT_FIELD_NAMES und der Einstellungsseite; das Modell hier trägt sie schon.
//
// Rein (kein obsidian-Import, keine App) und damit vollständig testbar.

export type FieldId = "type" | "title" | "labels";

export const FIELD_IDS: FieldId[] = ["type", "title", "labels"];

export const DEFAULT_FIELD_NAMES: Record<FieldId, string> = { type: "type", title: "title", labels: "labels" };

/**
 * Fremde Schlüssel, die für EIN bestimmtes Feld trotzdem erlaubt sind.
 *
 * `tags` gehört Obsidian und ist deshalb unten gesperrt – für das Label-Feld ist es aber genau
 * das sinnvolle Ziel: Wer seine Labels dort führt, hat echte Obsidian-Tags, die andere Programme
 * lesen. Feldweise geöffnet und nicht global, damit niemand seinen Aufgabentyp auf `tags` legt.
 *
 * Ungefährlich, weil `normalizeLabel` (taskService.ts) jedes Label ohnehin zu einem Slug macht:
 * kleingeschrieben, ohne führendes `#`, Leerzeichen zu Bindestrichen. Was wir schreiben, ist
 * bereits ein gültiger Obsidian-Tag.
 */
const FIELD_EXCEPTION: Partial<Record<FieldId, string>> = { labels: "tags" };

/** Feste Feldnamen, die BeautyTasks selbst führt, plus die von Obsidian belegten. Als Ziel eines
 *  Wechsels gesperrt – sonst schriebe die App beim nächsten Speichern über ihre eigenen Daten
 *  (oder über die Tags des Nutzers). Die KONFIGURIERBAREN Felder stehen hier NICHT drin; die
 *  kommen dynamisch dazu, siehe normalizeFieldName. */
const FIXED_KEYS = new Set([
  "id", "status", "priority", "due", "scheduled", "start", "duration", "project", "parent",
  "recurrence", "recur_basis", "reminders", "sort_order", "created", "completed",
  "cancelled", "description", "external_id", "gcal_event_id", "gcal_calendar_id", "gcal_sync",
  "icon", "color", "nav_hidden",
  "tags", "aliases", "cssclasses", "cssclass", "publish", "permalink",
]);

/** Einen eingegebenen Feldnamen auf einen brauchbaren reduzieren. Erlaubt sind Namen, die in YAML
 *  ohne Anführungszeichen auskommen (Buchstabe voran, dann Buchstaben/Ziffern/_/-). Gesperrt sind
 *  die festen Felder UND die aktuellen Namen der ANDEREN konfigurierbaren Felder – sonst ließe
 *  sich `type` auf `title` legen und beide Werte lägen im selben Schlüssel. Alles Unbrauchbare
 *  fällt auf die Vorgabe zurück: Eine vertippte Einstellung darf nie Daten treffen. */
export function normalizeFieldName(id: FieldId, raw: unknown, current: Record<FieldId, string> = DEFAULT_FIELD_NAMES): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(s)) return DEFAULT_FIELD_NAMES[id];
  const lower = s.toLowerCase();
  if (FIXED_KEYS.has(lower) && FIELD_EXCEPTION[id] !== lower) return DEFAULT_FIELD_NAMES[id];
  // Namen der anderen konfigurierbaren Felder – aktueller Wert UND deren Vorgabe, damit man sich
  // nicht über einen Zwischenschritt doch auf ein besetztes Feld legen kann.
  for (const other of FIELD_IDS) {
    if (other === id) continue;
    if (lower === (current[other] ?? DEFAULT_FIELD_NAMES[other]).toLowerCase()) return DEFAULT_FIELD_NAMES[id];
    if (lower === DEFAULT_FIELD_NAMES[other].toLowerCase()) return DEFAULT_FIELD_NAMES[id];
  }
  return s;
}

/** Gespeicherte Einstellung -> vollständige, geprüfte Namenstabelle. Reihenfolge zählt: Jedes Feld
 *  wird gegen die bereits geprüften Namen der anderen validiert. */
export function resolveFieldNames(saved?: Partial<Record<FieldId, string>> | null): Record<FieldId, string> {
  const out: Record<FieldId, string> = { ...DEFAULT_FIELD_NAMES };
  for (const id of FIELD_IDS) out[id] = normalizeFieldName(id, saved?.[id], out);
  return out;
}

// ── Lebende Registry ────────────────────────────────────────────────
// Wie bei den Status (statuses.ts) und der Sprache (i18n.ts): EINE Quelle zur Laufzeit, von
// main.loadSettings() gesetzt. Alle Lese- und Schreibstellen fragen den Getter, damit keine davon
// die Einstellungen durchgereicht bekommen muss.
let CURRENT: Record<FieldId, string> = { ...DEFAULT_FIELD_NAMES };

export function initFieldNames(saved?: Partial<Record<FieldId, string>> | null): void {
  CURRENT = resolveFieldNames(saved);
}
export function fieldKey(id: FieldId): string { return CURRENT[id]; }
/** Kurzform fuer die haeufigste Abfrage – wie `titleKey()` in taskTitle.ts. */
export const labelKey = (): string => fieldKey("labels");
export function allFieldNames(): Record<FieldId, string> { return { ...CURRENT }; }

/** Frontmatter-Werte, an denen BeautyTasks seine eigenen Notizen erkennt. Die EINE Liste – sie
 *  entscheidet auch, welche Notizen ein Feldnamen-Wechsel umschreibt. */
export const ENTITY_VALUES = ["task", "project", "area", "filter", "template"] as const;
export type EntityValue = (typeof ENTITY_VALUES)[number];

export const isEntityValue = (v: unknown): v is EntityValue =>
  typeof v === "string" && (ENTITY_VALUES as readonly string[]).includes(v);

/** Ist diese Notiz von einem Wechsel des `type`-Feldes betroffen? Nur Notizen mit einem UNSERER
 *  fünf Werte im alten Schlüssel – fremde Taxonomien (`type: meeting`) bleiben unangetastet. Führt
 *  die Notiz den neuen Schlüssel schon, ist nichts zu tun; das macht den Lauf wiederholbar. Rein,
 *  damit die Auswahlregel testbar ist, ohne einen Vault zu bauen. */
export function isTypeRenameTarget(fm: Record<string, unknown> | undefined, prev: string, next: string): boolean {
  return !!fm && isEntityValue(fm[prev]) && fm[next] === undefined;
}
