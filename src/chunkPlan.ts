/**
 * Wie viele Zeilen zeichnet eine Sektion (bzw. Karten eine Board-Spalte) sofort?
 *
 * Rein und deshalb prüfbar. Beide Fehler, die dieses Verfahren im Betrieb hatte, waren
 * Rechenfehler dieser Art und wären hier aufgefallen:
 *
 *  1. Das Budget je SEKTION statt je Seite: Eine nach Datum gruppierte Liste zerfällt in
 *     ~200 Tages-Sektionen, von denen fast jede unter einem Schub liegt – gedeckelt wurde
 *     damit nichts, es entstanden weiter Hunderte Zeilen.
 *  2. Dasselbe Budget quer über Board-SPALTEN: Die stehen nebeneinander und sind alle
 *     sichtbar; wer von links nach rechts verteilt, lässt die rechten leer starten.
 */

/** Wie viel vom verbleibenden Budget diese Sektion bekommt. Nie mehr als sie braucht, nie
 *  weniger als null (ein aufgebrauchtes Budget wird nicht negativ). */
export function takeFromBudget(left: number, want: number): number {
  if (!isFinite(left)) return want;      // kein Budget gesetzt (z. B. Vorschau) -> alles zeichnen
  return Math.max(0, Math.min(want, Math.floor(left)));
}

/**
 * Zeilen, die eine Sektion beim ERNEUTEN Füllen zeichnet (Abgleich, s. tryPatchList).
 *
 * `shown` ist der Stand vor dem Nachfüllen: So weit wird wieder aufgebaut, sonst schrumpfte die
 * Liste unter einem weit heruntergescrollten Nutzer zusammen. Eine ausgehängte Sektion bleibt
 * ausgehängt; steht ein Sprung aus der Suche an, wird sie ganz gezeichnet (Aufblitzen und
 * Ins-Bild-Scrollen brauchen die Zeile, und die kann überall stehen).
 */
export function repaintCount(o: { total: number; shown: number; minimum: number; recycled?: boolean; flash?: boolean }): number {
  if (o.flash) return o.total;
  if (o.recycled) return 0;
  return Math.min(o.total, Math.max(o.minimum, o.shown));
}

/**
 * Zeilen, die nötig sind, damit eine gemerkte Scrollposition wieder trifft.
 *
 * Ein Platzhalter allein genügt dort nicht, wo seine Höhe nur geschätzt ist: Ist die Schätzung
 * zu klein, klemmt der Browser die Position auf sein Maximum und man landet am Anfang. Genau das
 * passierte beim Verschieben einer Board-Spalte, in der man weit unten stand.
 *
 * `itemPx <= 0` heisst „noch nichts gemessen" – dann reicht es, einen Schub zu zeichnen und
 * danach erneut zu rechnen.
 */
export function rowsForScroll(o: { savedTop: number; viewportPx: number; itemPx: number; chunk: number; total: number }): number {
  if (o.savedTop <= 0) return 0;
  if (o.itemPx <= 0) return Math.min(o.total, o.chunk);
  return Math.min(o.total, Math.ceil((o.savedTop + Math.max(0, o.viewportPx)) / o.itemPx) + o.chunk);
}

/**
 * Zeilen, die eine Board-SPALTE zeichnet: so viele, wie in sie hineinpassen, plus Reserve.
 *
 * Bewusst NICHT aus einem Seiten-Budget: Spalten stehen nebeneinander und sind alle gleichzeitig
 * sichtbar. Waagerecht weit rechts stehende bleiben trotzdem billig, weil ihr Wächter erst
 * anspringt, wenn sie ins Bild kommen.
 */
export function columnFirstPaint(o: { total: number; viewportPx: number; itemPx: number; fallbackPx: number; reserve: number }): number {
  const px = o.itemPx > 0 ? o.itemPx : o.fallbackPx;
  if (px <= 0) return o.total;
  return Math.min(o.total, Math.ceil(Math.max(0, o.viewportPx) / px) + o.reserve);
}

/** Höhe des Platzhalters für die noch nicht gezeichneten Zeilen. Nie negativ – eine Sektion,
 *  die vollständig steht, braucht keinen. */
export function placeholderPx(total: number, shown: number, itemPx: number): number {
  return Math.max(0, total - shown) * Math.max(0, itemPx);
}
