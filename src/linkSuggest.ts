import { TFile, prepareFuzzySearch, sortSearchResults, renderMatches } from "obsidian";
import type { SearchResult } from "obsidian";
import type BeautyTasksPlugin from "./main";
import { openPopoverAt } from "./popover";

/**
 * „[[" in einem MEHRZEILIGEN Feld vervollständigen (Beschreibung, Kommentare).
 *
 * ── Warum nicht Obsidians AbstractInputSuggest? ────────────────────────────────────────────────
 * Weil sie mit einer <textarea> nachweislich nicht funktioniert. Sie nimmt laut Typdefinition nur
 * <input> oder ein contenteditable <div>, und das ist keine Förmlichkeit: getValue/setValue
 * verzweigen auf `instanceOf(HTMLInputElement)` und fallen sonst auf `innerText` zurück. Bei einer
 * <textarea> ist `innerText` der AUSGANGSinhalt aus dem Markup, nicht der getippte Wert – ab dem
 * ersten Tastendruck läse sie also Falsches und schriebe ins Leere. Ausserdem reicht sie den
 * GESAMTEN Feldinhalt als Suchanfrage weiter und ersetzt beim Auswählen den GESAMTEN Wert; hier
 * darf aber nur das Stück von „[[" bis zum Cursor angefasst werden.
 *
 * EditorSuggest – die Klasse, die im richtigen Editor das „[[" bedient – braucht eine echte
 * CodeMirror-Editor-Instanz. Eine <textarea> ist keine.
 *
 * Gebaut ist es deshalb aus Teilen, die es schon gibt: openPopoverAt (kennt Aussenklick,
 * Fenstergrösse, Viewport-Rand und Popout-Fenster) plus prepareFuzzySearch/sortSearchResults/
 * renderMatches aus der öffentlichen API – letzteres hebt die Treffer genauso hervor wie
 * Obsidians eigene Vorschlagsliste.
 */

/** Höchstzahl gezeigter Vorschläge. Mehr liest ohnehin niemand, und die Liste bliebe im Bild. */
const MAX_ROWS = 20;

export interface LinkQuery {
  /** Index des „[[" im Text – ab hier wird beim Auswählen ersetzt. */
  start: number;
  /** Was der Nutzer seit dem „[[" getippt hat. */
  query: string;
}

/**
 * Steht der Cursor in einem offenen „[[…"? Dann liefert das die Fundstelle, sonst null.
 *
 * Bewusst streng: Ein „]" oder „[" zwischen Klammer und Cursor beendet die Erkennung (der Link
 * ist schon geschlossen bzw. der Text ist keiner), und ein Zeilenumbruch ebenfalls – sonst würde
 * ein „[[" drei Zeilen weiter oben die Eingabe kapern.
 */
export function findLinkQuery(text: string, caret: number): LinkQuery | null {
  const left = text.slice(0, caret);
  const start = left.lastIndexOf("[[");
  if (start < 0) return null;
  const query = left.slice(start + 2);
  if (/[[\]\n]/.test(query)) return null;
  return { start, query };
}

/**
 * Den Vorschlag einsetzen – und NUR den Bereich von „[[" bis zum Cursor ersetzen.
 *
 * Ein direkt hinter dem Cursor stehendes „]]" wird mitverbraucht: Wer in ein fertiges „[[Alt]]"
 * hineinklickt und neu tippt, bekäme sonst „[[Neu]]]]".
 */
export function applyLink(text: string, q: LinkQuery, caret: number, linktext: string):
  { text: string; caret: number } {
  const end = text.startsWith("]]", caret) ? caret + 2 : caret;
  const insert = "[[" + linktext + "]]";
  return { text: text.slice(0, q.start) + insert + text.slice(end), caret: q.start + insert.length };
}

interface Hit { file: TFile; match: SearchResult | null }

/**
 * Vorschlagsliste an ein mehrzeiliges Feld hängen.
 *
 * `srcPath` ist eine Funktion, weil eine NEUE Aufgabe noch keine Notiz hat – der Pfad steht erst
 * beim Speichern fest, und die Wirte liefern bis dahin einen Platzhalter (s. logSrc/srcPath).
 */
export function attachLinkSuggest(ta: HTMLTextAreaElement, plugin: BeautyTasksPlugin,
                                  srcPath: () => string): void {
  let pop: HTMLElement | null = null;
  let close: (() => void) | null = null;
  let hits: Hit[] = [];
  let active = 0;
  let anchorBottom = 0;

  const hide = (): void => { close?.(); pop = null; close = null; };

  const rank = (query: string): Hit[] => {
    const files = plugin.app.vault.getMarkdownFiles();
    // Ohne Anfrage (gerade erst „[[" getippt): die zuletzt bearbeiteten Notizen – das trifft
    // erfahrungsgemäss öfter als eine alphabetische Liste, die immer bei „A" anfängt.
    if (!query) {
      return [...files].sort((a, b) => b.stat.mtime - a.stat.mtime)
        .slice(0, MAX_ROWS).map((file) => ({ file, match: null }));
    }
    const fuzzy = prepareFuzzySearch(query);
    const found: { file: TFile; match: SearchResult }[] = [];
    for (const file of files) {
      const match = fuzzy(file.basename);
      if (match) found.push({ file, match });
    }
    sortSearchResults(found);
    return found.slice(0, MAX_ROWS);
  };

  const draw = (): void => {
    if (!pop) return;
    pop.empty();
    hits.forEach((hit, i) => {
      const row = pop!.createDiv({ cls: "bt-row" + (i === active ? " is-active" : "") });
      const lbl = row.createSpan({ cls: "bt-row-lbl" });
      // renderMatches hebt genau die Zeichen hervor, die die unscharfe Suche getroffen hat –
      // dieselbe Darstellung wie in Obsidians eigener Vorschlagsliste.
      if (hit.match) renderMatches(lbl, hit.file.basename, hit.match.matches);
      else lbl.setText(hit.file.basename);
      // Ordner klein dahinter: Ohne ihn wären zwei gleichnamige Notizen nicht zu unterscheiden.
      const dir = hit.file.parent?.path ?? "";
      if (dir && dir !== "/") row.createSpan({ cls: "bt-suggest-dir", text: dir });
      // Der Klick darf den Fokus NICHT aus dem Feld nehmen – sonst schriebe das Einsetzen in ein
      // Feld, das gerade den Cursor verloren hat. Genau das macht Obsidian an dieser Stelle auch.
      row.addEventListener("mousedown", (e) => e.preventDefault());
      row.onclick = () => choose(i);
    });
  };

  const choose = (i: number): void => {
    const hit = hits[i];
    if (!hit) return;
    const caret = ta.selectionStart;
    const q = findLinkQuery(ta.value, caret);
    if (!q) { hide(); return; }
    // fileToLinktext liefert den Namen so, wie Obsidian ihn schreiben würde (kürzester eindeutiger
    // Pfad je nach Einstellung). BEWUSST nicht generateMarkdownLink wie beim Knopf „Notiz
    // verlinken": wer „[[" tippt, will eine Wikilink-Klammer – und genau die steht schon da.
    const linktext = plugin.app.metadataCache.fileToLinktext(hit.file, srcPath(), true);
    const next = applyLink(ta.value, q, caret, linktext);
    ta.value = next.text;
    ta.setSelectionRange(next.caret, next.caret);
    hide();
    // Der Wirt hängt an `input` (schreibt f.description fort, lässt das Feld mitwachsen, setzt
    // „has-text"). Ohne dieses Ereignis wäre der eingesetzte Link beim Speichern wieder weg.
    ta.dispatchEvent(new Event("input", { bubbles: true }));
    ta.focus();
  };

  const refresh = (): void => {
    if (!ta.isConnected) { hide(); return; }
    const q = findLinkQuery(ta.value, ta.selectionStart);
    if (!q) { hide(); return; }
    hits = rank(q.query);
    active = 0;
    if (!hits.length) { hide(); return; }   // kein Treffer -> Popup zu (wie in Obsidian), keine Meldung

    const r = ta.getBoundingClientRect();
    // Steht es schon an der richtigen Stelle, nur neu füllen. Das Feld wächst beim Tippen mit,
    // deshalb wird beim Wandern der Unterkante neu aufgesetzt statt die Liste zu verschieben.
    if (pop && Math.round(r.bottom) === anchorBottom) { draw(); return; }
    hide();
    anchorBottom = Math.round(r.bottom);
    // Die Zeilen entstehen INNERHALB des Aufbaus: openPopoverAt misst danach und klappt bei
    // Platzmangel nach oben um – bei leerem Popover hätte es nichts zu messen.
    openPopoverAt(ta.ownerDocument, r.left, r.bottom, (p, c) => {
      pop = p; close = c;
      p.addClass("bt-linksuggest");
      draw();
    }, () => { pop = null; close = null; });
  };

  ta.addEventListener("input", refresh);
  ta.addEventListener("click", refresh);
  // Cursor per Taste aus der Klammer heraus bewegt: Auf/Ab gehören der Liste, deshalb nur die
  // waagerechten Bewegungen und die Sprungtasten.
  ta.addEventListener("keyup", (e) => {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight" || e.key === "Home" || e.key === "End") refresh();
  });
  ta.addEventListener("blur", hide);

  ta.addEventListener("keydown", (e) => {
    if (!pop) return;
    if (e.key === "ArrowDown") { active = (active + 1) % hits.length; draw(); }
    else if (e.key === "ArrowUp") { active = (active - 1 + hits.length) % hits.length; draw(); }
    else if (e.key === "Enter") { choose(active); }
    else if (e.key === "Escape") { hide(); }
    else return;
    e.preventDefault();
    // MUSS sein: Sonst schlägt Escape bis zum Modal durch und schliesst die halb getippte
    // Aufgabe, und Enter setzt im Beschreibungsfeld zusätzlich einen Zeilenumbruch.
    e.stopPropagation();
  });
}
