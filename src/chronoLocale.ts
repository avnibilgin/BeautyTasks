// chrono als RÜCKFALL für die Sprachen, die der eigene Parser nicht kann.
//
// Warum nicht als Ersatz: In Deutsch und Englisch ist der eigene Parser nachweislich besser.
// chrono kennt deutsche Kurzdaten ohne Jahr nicht („am 20.12.", „2.7." -> nichts; nur mit Jahr),
// und „day after tomorrow" greift es als „tomorrow" heraus – also ein stillschweigend FALSCHES
// Datum statt gar keinem. Dazu „nächste woche" = +7 Tage statt nächster Montag und die
// Jahreszahl-Falle („Fotos von 2015 sortieren" -> 20:15). Deshalb: eigener Parser zuerst, chrono
// nur, wo heute ohnehin nichts erkannt wird.
//
// Darum stehen en und de hier auch NICHT in der Liste – die deckt der eigene Parser ab. Das spart
// zugleich deren Sprachpakete im Bundle.
//
// Benannte Importe aus der Wurzel statt Subpath ("chrono-node/es"): die tsconfig steht auf
// moduleResolution "node" und versteht chronos exports-Map nicht. Getree-shaked wird trotzdem –
// nachgemessen identisch; alles, was hier nicht importiert wird, fliegt raus.
import { Chrono, es, fr, it, ja, pt, ru, zh } from "chrono-node";
import { getLocale } from "./i18n";

// chrono kann: de en es fi fr it ja nl pt ru sv uk vi zh.
// Das Plugin bietet zehn Sprachen an. Für TÜRKISCH hat chrono keinen Parser – dort bleibt es beim
// eigenen Parser, der nur die englischen Schlüsselwörter versteht. Bekannte Lücke.
const FALLBACK: Record<string, Chrono> = {
  es: es.casual, pt: pt.casual, fr: fr.casual,
  it: it.casual, ru: ru.casual, zh: zh.casual, ja: ja.casual,
};

/** Gibt es für diese Sprache einen chrono-Rückfall? (de/en/tr: nein – siehe oben.) */
export const hasChronoFallback = (loc: string): boolean => FALLBACK[loc] !== undefined;

/** Der chrono-Rückfall für eine Sprache – leer, wenn der eigene Parser zuständig ist.
 *  Nur EIN Parser: Englisch braucht es hier nicht, das kann der eigene Parser bereits. */
export function chronoFallback(loc: string = getLocale()): Chrono[] {
  const own = FALLBACK[loc];
  return own ? [own] : [];
}
