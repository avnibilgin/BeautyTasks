// Zuordnung Obsidian-Sprache -> chrono-Parser für die Datums-/Uhrzeit-Erkennung.
//
// Benannte Importe aus der Wurzel, NICHT Subpath ("chrono-node/de"): die tsconfig steht auf
// moduleResolution "node", das versteht chronos exports-Map nicht. Getree-shaked wird trotzdem –
// nachgemessen: identische 140 KB wie mit Subpath-Importen, die ungenutzten Sprachen (fi, nl, sv,
// uk, vi) fliegen raus. Deshalb hier NUR die Sprachen importieren, die das Plugin auch anbietet.
import { Chrono, de, en, es, fr, it, ja, pt, ru, zh } from "chrono-node";
import { getLocale } from "./i18n";

// chrono kennt: de en es fi fr it ja nl pt ru sv uk vi zh.
// Das Plugin kann zehn Sprachen – für TÜRKISCH hat chrono keinen Parser. tr fällt darum (wie jede
// unbekannte Sprache) auf Englisch zurück; der türkische qa_placeholder verspricht bis dahin mehr,
// als die Erkennung halten kann.
const CHRONO: Record<string, Chrono> = {
  en: en.casual, de: de.casual, es: es.casual, pt: pt.casual,
  fr: fr.casual, it: it.casual, ru: ru.casual, zh: zh.casual, ja: ja.casual,
};

/** Hat chrono einen Parser für diese Sprache? (false = wir parsen dort nur englisch.) */
export const hasChronoLocale = (loc: string): boolean => CHRONO[loc] !== undefined;

/** Die Parser für eine Sprache, in Anwendungsreihenfolge – erster Treffer gewinnt.
 *  Englisch hängt immer hinten dran: der handgeschriebene Parser verstand DE und EN stets
 *  gleichzeitig („Bericht morgen" wie „report tomorrow"), und englische Schlüsselwörter sind
 *  in Obsidian-Vaults verbreitet. Für en selbst bleibt es bei einem Parser. */
export function chronoFor(loc: string = getLocale()): Chrono[] {
  const own = CHRONO[loc];
  return own && loc !== "en" ? [own, CHRONO.en] : [CHRONO.en];
}
