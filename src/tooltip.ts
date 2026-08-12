import { setTooltip } from "obsidian";
import type { TooltipPlacement } from "obsidian";

/**
 * Tooltips – eine Stelle für alle.
 *
 * ── Wie Obsidian Tooltips zeigt ────────────────────────────────────────────────────────────────
 * Nicht das Element bringt seinen Tooltip mit: Obsidian hängt EINEN Delegate je Dokument an
 * `body` (`pointerover`/`pointerout` auf `[aria-label]`). Wer ein `aria-label` trägt, bekommt
 * dadurch automatisch einen Tooltip; `data-tooltip-position` bestimmt die Richtung, und ohne
 * dieses Attribut ist die Voreinstellung `bottom`. Genau daraus entstand die Unruhe, die dieses
 * Modul beendet: Die Hälfte unserer Stellen setzte die Richtung, die andere nicht – zwei Symbole
 * derselben Meta-Zeile klappten in verschiedene Richtungen auf.
 *
 * Deshalb geht ab hier ALLES über `tip()`/`tipWhenClipped()` statt über rohe Attribute. Die
 * Richtung steht dann an genau einer Stelle, und wer sie einmal ändern will, ändert sie hier.
 *
 * ── Wann überhaupt ein Tooltip? ────────────────────────────────────────────────────────────────
 * Nur, wenn er etwas HINZUFÜGT. Das ist der eine oder der andere Fall:
 *
 *   1. Er trägt mehr als das Sichtbare – ein Symbol ohne Beschriftung („Weitere Aktionen"), oder
 *      ein Termin, dessen ORT nirgends auf dem Bildschirm steht.  ->  `tip()`
 *   2. Der sichtbare Text ist ABGESCHNITTEN und der Tooltip zeigt ihn ganz.  ->  `tipWhenClipped()`
 *
 * Ein Tooltip, der „Reisen" über ein vollständig lesbares „Reisen" legt, ist Lärm: In einer
 * Seitenleiste mit zwanzig Einträgen poppte bei jeder Mausbewegung etwas auf.
 */

/**
 * Richtung für alle Tooltips des Plugins.
 *
 * `top`, weil unsere Tooltips fast durchweg an Zeilen und Chips hängen, die in einer Liste
 * untereinander stehen: Nach unten aufklappend verdeckte der Tooltip die nächste Zeile – also
 * ausgerechnet das, was der Nutzer als Nächstes ansteuert.
 *
 * Bewusst NICHT verstellt bleibt die Verzögerung: Obsidian wartet eine Sekunde (mit Schnellpfad,
 * solange gerade eben schon einer stand). Wer hier kürzer macht, fällt gegenüber dem Rest der
 * Anwendung auf.
 */
const PLACEMENT: TooltipPlacement = "top";

/** Tooltip setzen. Leerer Text entfernt ihn (Obsidian zeigt bei leerem Label nichts an). */
export function tip(el: HTMLElement, text: string, placement: TooltipPlacement = PLACEMENT): void {
  setTooltip(el, text, { placement });
}

/** Was `isClipped` zum Urteilen braucht – so lässt sich die Rechnung ohne DOM prüfen. */
export interface ClipMetrics {
  scrollWidth: number; clientWidth: number;
  scrollHeight: number; clientHeight: number;
}

/**
 * Ist der Text dieses Elements abgeschnitten?
 *
 * Beide Achsen, weil beide Kürzungsarten vorkommen: einzeilig mit `text-overflow: ellipsis`
 * (Breite) und mehrzeilig gedeckelt (Höhe).
 *
 * Die Toleranz von 1 px ist kein Sicherheitspuffer, sondern Pflicht: `scrollWidth`/`clientWidth`
 * sind gerundete Ganzzahlen. Bei fraktionaler Displayskalierung (der Nutzer fährt über 100 %)
 * gehen die beiden Rundungen regelmäßig um genau eins auseinander, und ohne Toleranz erschiene
 * ein Tooltip für einen vollständig sichtbaren Namen.
 */
export function isClipped(m: ClipMetrics): boolean {
  return m.scrollWidth - m.clientWidth > 1 || m.scrollHeight - m.clientHeight > 1;
}

/**
 * Tooltip, der nur erscheint, wenn `measure` seinen Text abschneidet.
 *
 * ── Warum erst beim Überfahren gemessen wird ───────────────────────────────────────────────────
 * Nicht aus Sparsamkeit, sondern weil beim Zeichnen gemessen schlicht FALSCH wäre:
 *
 *   • Die Seitenleiste ist breitenverstellbar. Ob ein Projektname passt, entscheidet sich neu,
 *     sobald der Nutzer den Trenner zieht – ohne dass irgendetwas neu gezeichnet würde. Ein beim
 *     Aufbau gefälltes Urteil wäre ab dem ersten Ziehen veraltet.
 *   • Beim Erzeugen steht das Element noch nicht im Umbruch; `clientWidth` wäre 0, also gälte
 *     jede Zeile als abgeschnitten.
 *
 * Nebenbei bleibt so auch der Aufbau billig: kein erzwungener Umbruch je Zeile (s. die Arbeit an
 * der Listen-Performance), sondern eine einzige Messung für die eine Zeile unter der Maus.
 *
 * ── Warum der Horcher am Element hängt ─────────────────────────────────────────────────────────
 * Obsidians Delegate sitzt auf `body`, also WEITER OBEN. Ein Horcher direkt am Element läuft im
 * selben `pointerover` vorher; das `aria-label` steht damit rechtzeitig, und der Tooltip erscheint
 * schon beim ERSTEN Überfahren statt erst beim zweiten.
 *
 * `el` ist die Fläche, über der der Tooltip erscheint (meist die ganze Zeile bzw. der Chip),
 * `measure` das Element, dessen Text tatsächlich beschnitten wird.
 */
export function tipWhenClipped(el: HTMLElement, measure: HTMLElement, text: string,
                               placement: TooltipPlacement = PLACEMENT): void {
  el.addEventListener("pointerover", () => {
    // Jedes Mal neu urteilen: Spaltenbreiten ändern sich, ohne dass die Zeile neu entsteht.
    tip(el, isClipped(measure) ? text : "", placement);
  });
}
