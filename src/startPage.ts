import { PageRef, StartPage } from "./pageCtx";

/**
 * Die Startseite — welche Seite beim Öffnen erscheint.
 *
 * Bis 1.37.2 war das ein `ViewId`: genau vier Ansichten plus „zuletzt benutzte". Der Eingang war
 * nicht wählbar (er ist intern eine Projektseite, keine Ansicht), Projekte, Bereiche, Labels und
 * Filter ebenso wenig. Gespeichert wird deshalb jetzt eine `PageRef` — dieselbe Angabe, die auch
 * jeder Tab führt. Damit ist jede Seite wählbar, ohne Sonderfälle.
 *
 * **Warum die Einstellung vorher wirkungslos war:** Seit die Seite zum Tab gehört (1.34.0) stellt
 * Obsidian jeden Tab dort wieder her, wo er zuletzt stand — `startView()` wurde beim Start gar
 * nicht gefragt. Die Option „zuletzt benutzte" war damit die einzige, die zutraf, und jede andere
 * Wahl blieb folgenlos. Deshalb bedeutet „last" hier ausdrücklich **null = den Tab in Ruhe
 * lassen**, und jede feste Seite überschreibt den wiederhergestellten Tab.
 */

/** Vorgabe, wenn nichts gewählt ist oder das Ziel nicht mehr existiert. */
export const HOME: PageRef = { kind: "view", key: "heute" };

/** Prüft, ob eine gespeicherte Seite überhaupt noch existiert (Projekt gelöscht, Label entfernt …). */
export type PageExists = (page: PageRef) => boolean;

const isRef = (s: StartPage | undefined | null): s is PageRef =>
  !!s && typeof s === "object" && typeof s.key === "string";

/**
 * Welche Seite ein WIEDERHERGESTELLTER Tab beim Start bekommt.
 * `null` heißt: nichts erzwingen, der Tab behält seine eigene Seite.
 */
export function forcedStartPage(setting: StartPage | undefined | null, exists: PageExists): PageRef | null {
  if (setting === "last") return null;
  if (!isRef(setting)) return HOME;          // nie gewählt oder unbrauchbar gespeichert
  return exists(setting) ? setting : HOME;   // Ziel gelöscht → Vorgabe statt leerer Seite
}

/**
 * Seite für einen NEUEN Tab. Dort gibt es nichts zu behalten, also muss auch „zuletzt benutzte"
 * eine Antwort geben — das ist die zuletzt aktive Ansicht des Geräts.
 */
export function newTabPage(setting: StartPage | undefined | null, lastView: string | undefined, exists: PageExists): PageRef {
  if (setting === "last") {
    const p: PageRef = { kind: "view", key: lastView || HOME.key };
    return exists(p) ? p : HOME;
  }
  return forcedStartPage(setting, exists) ?? HOME;
}

/** Übernimmt die alte Form (`startView`, ein String) in die neue. Unbekanntes → Vorgabe.
 *  Die gültigen Ansichts-IDs kommen von außen, damit diese Datei nichts von der Oberfläche
 *  wissen muss – sie ist rein und ohne Obsidian-Bezug, genau deshalb ist sie testbar. */
export function fromLegacyStartView(value: unknown, gueltigeAnsichten: readonly string[]): StartPage {
  if (value === "last") return "last";
  if (typeof value === "string" && gueltigeAnsichten.includes(value)) return { kind: "view", key: value };
  return HOME;
}
