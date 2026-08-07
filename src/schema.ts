/**
 * Stand des Einstellungs-Schemas — EINE Zahl statt wachsender Boolescher Marker.
 *
 * Bis 1.37.1 merkte sich jede Einmal-Migration ihr eigenes Flag (`didDescriptionMigration`,
 * `didInboxRemoval`, `didTitleMigration`). Das wächst mit jeder weiteren Migration, sagt nichts
 * über die Reihenfolge und lässt sich nicht ausdrücken als „Schritt 5 setzt Schritt 4 voraus".
 * `schemaVersion` ist die Anzahl der gelaufenen Schritte: Datei steht auf 1, Code will 3 → es
 * laufen Schritt 2 und 3, danach steht 3 drin.
 *
 * **Die alten Marker werden weiter mitgeschrieben** (in den Migrationen selbst). Nicht aus
 * Zaghaftigkeit: Draußen laufen ältere Builds, die ausschließlich die Marker lesen. Fehlen sie,
 * hält so ein Build alle Migrationen für ungelaufen und startet sie mit seinem eigenen, alten
 * Code — den kann diese Version nicht nachträglich absichern. Sie dürfen erst weg, wenn keine
 * Fassung ohne `schemaVersion` mehr im Umlauf ist.
 *
 * **Eine Zahl kann nur einen zusammenhängenden Stand ausdrücken.** Die alten Marker waren
 * unabhängig, es kann sie also lückenhaft geben (Schritt 1 und 3 gesetzt, 2 nicht — etwa weil ein
 * Lauf dazwischen abbrach). Beim Ableiten wird deshalb bis zur ERSTEN Lücke gezählt; alles danach
 * läuft erneut. Das ist nur zulässig, weil alle Schritte gefahrlos wiederholbar sind:
 * `migrateDescriptions` gleicht ab statt blind zu schreiben, `migrateTitles` bricht ab, sobald im
 * Frontmatter ein Titel steht, `migrateInboxRemoval` findet ohne Inbox-Notiz nichts vor. Wer hier
 * einen Schritt ergänzt, muss dieselbe Zusage einhalten.
 */

/** Die Einmal-Migrationen in ihrer Reihenfolge. Anhängen, nie umsortieren, nie entfernen. */
export const SCHEMA_STEPS = ["descriptions", "inboxRemoval", "titles", "recurrenceRRule"] as const;
export type SchemaStep = typeof SCHEMA_STEPS[number];

/** Stand, den dieser Build erwartet. */
export const CURRENT_SCHEMA = SCHEMA_STEPS.length;

/** Die Felder aus data.json, die den Stand verraten — alle optional, alle aus Altbeständen. */
export interface SchemaMarkers {
  schemaVersion?: unknown;
  didDescriptionMigration?: unknown;
  didInboxRemoval?: unknown;
  didTitleMigration?: unknown;
}

/**
 * Welchen Stand hat diese Datei? `null` = frische Installation (keine data.json), dann gibt es
 * nichts zu migrieren und der aktuelle Stand gilt sofort.
 *
 * Ein gespeicherter Wert schlägt die Marker — auch ein GRÖSSERER als `CURRENT_SCHEMA`. Der
 * entsteht, wenn dieselbe data.json vorher von einer neueren Fassung berührt wurde (zwei Geräte,
 * ein Sync). Er wird bewusst NICHT gekappt: Sonst schriebe dieser Build die kleinere Zahl zurück
 * und die neuere Fassung ließe ihre Schritte erneut laufen.
 */
export function schemaVersionOf(saved: SchemaMarkers | null | undefined): number {
  if (!saved) return CURRENT_SCHEMA;
  const stored = saved.schemaVersion;
  if (typeof stored === "number" && Number.isFinite(stored)) return Math.max(0, Math.trunc(stored));
  // Kein Wert gespeichert -> aus den alten Markern ableiten, bis zur ersten Lücke.
  const done = [saved.didDescriptionMigration, saved.didInboxRemoval, saved.didTitleMigration];
  let n = 0;
  while (n < done.length && done[n] === true) n++;
  return n;
}

/** Was ist an diesem Stand noch offen? Leer = nichts zu tun (auch bei Dateien aus der Zukunft). */
export function pendingSteps(version: number): SchemaStep[] {
  return SCHEMA_STEPS.slice(Math.min(Math.max(0, version), CURRENT_SCHEMA));
}

/** Was nach einem vollständigen Lauf in der Datei stehen muss. Nie kleiner als der Vorwert. */
export function nextSchemaVersion(version: number): number {
  return Math.max(version, CURRENT_SCHEMA);
}
