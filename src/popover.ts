import { setIcon } from "obsidian";

/** Einfaches Popover auf eigener Ebene über der Oberfläche (im Modal: über dem Modal),
 *  schließt bei Klick außerhalb. Doc/Win werden beim Öffnen erfasst (Popout-Kompatibilität,
 *  kein activeDocument-Drift bei Cleanup). */
/** Lebenden Anker beschaffen: Chip-Leisten werden bei jeder Änderung komplett neu gebaut
 *  (renderChips -> bar.empty()), ein zwischenzeitlich gemerktes Chip-Element ist danach aus
 *  dem DOM gelöst. Dessen getBoundingClientRect() liefert nur Nullen -> das Popover landete
 *  in der linken oberen Ecke. Über data-chip findet sich das nachgerenderte Element wieder. */
function liveAnchor(anchor: HTMLElement): HTMLElement | null {
  if (anchor.isConnected) return anchor;
  const id = anchor.getAttribute("data-chip");
  if (!id) return null;
  const doc = anchor.ownerDocument;
  const hits = doc.querySelectorAll<HTMLElement>(`[data-chip="${CSS.escape(id)}"]`);
  return hits.length ? hits[hits.length - 1] : null;   // oberstes/zuletzt geöffnetes Modal
}

/**
 * ── Wer ist gerade offen, und wer gehört zu wem? ───────────────────────────────────────────────
 *
 * Alle Popovers hängen als GESCHWISTER am body (bzw. am Modal-Container) – nie ineinander. Die
 * Verschachtelung („dieses Dropdown gehört zum Anzeige-Panel") steht also nirgends im DOM; sie
 * steckt allein im ANKER: Ein Popover ist das Kind desjenigen, in dessen Fläche sein Auslöser
 * liegt. Genau diese Beziehung hält das Register fest, weil drei Entscheidungen sie brauchen:
 *
 *   1. ZWEITER KLICK auf denselben Auslöser klappt zu, statt ein weiteres darüberzulegen.
 *      Ohne das stapelten sich deckungsgleiche Exemplare, jedes mit eigenem Schatten (sichtbar
 *      als wachsender Hof) und eigenen Wächtern. Nötig ist es, weil der Anker im
 *      Außerhalb-Wächter ausgenommen bleiben MUSS – sonst klappte ein Popover sofort wieder zu,
 *      sobald man die Maustaste über dem eigenen Knopf loslässt.
 *
 *   2. ÖFFNET SICH EINES woanders, schließt alles, was nicht zu seiner Ahnenkette gehört. Damit
 *      lösen sich Geschwister ab: Zwei Facetten-Dropdowns desselben Panels standen vorher
 *      gleichzeitig offen, weil keines für das andere „draußen" war.
 *
 *   3. EIN KLICK gilt nur dann nicht als „draußen", wenn er im eigenen Inhalt oder in einem
 *      KIND-Popover landet. Vorher stand dort „in irgendeinem anderen Popover" – und weil das
 *      Eltern-Panel eben auch ein anderes ist, war ein Klick auf dessen leere Fläche geschützt:
 *      Das Dropdown blieb hartnäckig stehen.
 *
 * Ein Set statt einer WeakMap: Es sind nie mehr als eine Handvoll, sie werden über ihre
 * Beziehungen zueinander abgefragt (nicht über einen Schlüssel), und jeder Eintrag verschwindet
 * beim Schließen wieder – ein abgelöstes Anker-Element hält hier also nichts am Leben.
 */
interface OpenPop {
  pop: HTMLElement;
  /** Auslöser – null bei Koordinaten-Popovers (Rechtsklick, s. openPopoverAt). */
  anchor: HTMLElement | null;
  parent: OpenPop | null;
  close: () => void;
}
const openPops = new Set<OpenPop>();

/** Das offene Popover, in dessen Fläche `el` liegt – also der Elter eines dort ausgelösten. */
function popContaining(el: Node | null): OpenPop | null {
  if (!el) return null;
  for (const e of openPops) if (e.pop.contains(el)) return e;
  return null;
}

/** Ist `q` (oder einer seiner Vorfahren) ein Kind von `me`? */
function isDescendant(me: OpenPop, q: OpenPop | null): boolean {
  for (let c = q; c; c = c.parent) if (c === me) return true;
  return false;
}

/** Beim Öffnen aufräumen: alles schließen, was nicht in der Ahnenkette des Neuen liegt. Die
 *  Kette selbst bleibt stehen – sonst zöge ein Dropdown das Panel mit weg, aus dem es kommt. */
function closeUnrelated(parent: OpenPop | null): void {
  const keep = new Set<OpenPop>();
  for (let c = parent; c; c = c.parent) keep.add(c);
  for (const e of [...openPops]) if (!keep.has(e)) e.close();
}

export function openPopover(anchorEl: HTMLElement, build: (pop: HTMLElement, close: () => void) => void, onClose?: () => void): void {
  const doc = anchorEl.ownerDocument;
  const win = doc.defaultView ?? activeWindow;
  const anchor = liveAnchor(anchorEl) ?? anchorEl;
  // Regel 1 – zweiter Klick auf denselben Auslöser = zuklappen (wie jedes Menü). Bewusst kein
  // Schließen-und-sofort-neu-Öffnen: Das flackerte nur und ließe einen nie ohne Umweg wieder heraus.
  for (const e of openPops) if (e.anchor === anchor) { e.close(); return; }
  // Regel 2 – meine Ebene bestimmen und alles Fremde schließen. VOR dem Erzeugen des eigenen
  // Elements, damit das Register beim Nachschlagen noch den Stand von vorher zeigt.
  const parent = popContaining(anchor);
  closeUnrelated(parent);
  // Innerhalb eines Modals in den .modal-CONTAINER einhängen – nicht in die .modal-Box:
  // - Fokus: Obsidian setzt scope.setTabFocusContainerEl(containerEl), der Container reicht
  //   also aus, damit Eingabefelder im Popover bedienbar bleiben (deshalb hing es früher im
  //   Modal; body allein genügt nicht).
  // - Clipping: .modal hat von Obsidian `overflow: auto`. Sobald ein Theme dem Modal einen
  //   backdrop-filter/filter/transform gibt (Milchglas-Modale sind verbreitet), wird es zum
  //   containing block für position:fixed – das Popover wurde dann an der Modal-Kante
  //   abgeschnitten und zählte zum Scrollinhalt des Modals. Der Container hat kein overflow.
  const modalBox = anchor.closest<HTMLElement>(".modal");
  const host = modalBox?.closest<HTMLElement>(".modal-container") ?? modalBox ?? doc.body;
  const pop = host.createDiv({ cls: "bt-pop" });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    openPops.delete(entry);
    pop.remove();
    doc.removeEventListener("mousedown", onDoc, true);
    win.removeEventListener("resize", close);
    onClose?.();
  };
  const entry: OpenPop = { pop, anchor, parent, close };
  openPops.add(entry);
  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t)) return;                        // eigener Inhalt
    // Der Anker ist ausgenommen, damit das Popover beim Loslassen über dem eigenen Auslöser nicht
    // sofort wieder zuklappt. Den zweiten Klick fängt dafür Regel 1 oben ab (s. openPops).
    if (t === anchor || anchor.contains(t)) return;
    // Regel 3 – geschützt ist nur ein Klick in einem KIND-Popover (der Datumswähler, den dieses
    // Menü geöffnet hat). Ein Klick im ELTERN-Panel ist dagegen ein Klick nach draußen: Genau
    // dort blieb früher ein Dropdown stehen, weil „irgendein anderes Popover" auch den Elter meinte.
    if (isDescendant(entry, popContaining(t))) return;
    close();
    // Klick außerhalb der Modal-BOX würde sonst das ganze Modal schließen (und Änderungen
    // verwerfen) -> diesen einen Klick verschlucken, das Modal bleibt offen. Bewusst gegen
    // modalBox geprüft, nicht gegen host: der Container schließt die Abdunklung (.modal-bg)
    // mit ein, und genau ein Klick DARAUF beendet das Modal (auf macOS über einen eigenen
    // Handler an bgEl).
    if (modalBox && !modalBox.contains(t)) {
      e.stopPropagation();
      let swallow: (ev: MouseEvent) => void;
      const cleanup = () => doc.removeEventListener("click", swallow, true);
      swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); cleanup(); };
      doc.addEventListener("click", swallow, true);
      win.setTimeout(cleanup, 300);
    }
  };
  build(pop, close);

  // Nullpunkt des containing block ermitteln: Alles unten wird in VIEWPORT-Koordinaten
  // gerechnet. position:fixed misst normalerweise ab der Viewport-Ecke – ist aber ein
  // Vorfahr durch backdrop-filter/filter/transform/contain selbst zum containing block
  // geworden (Themes mit Milchglas-Modalen tun das), zählt left/top ab DESSEN Ecke. Statt
  // das zu erraten: einmal auf 0/0 setzen, nachmessen, wo das gelandet ist, und den Versatz
  // am Ende herausrechnen. Ohne solchen Vorfahr ist der Versatz 0 und nichts ändert sich.
  pop.setCssStyles({ left: "0px", top: "0px" });
  const org = pop.getBoundingClientRect();

  // Letzte Sicherung: ist der Anker trotz allem nicht (mehr) im DOM, hat er eine Nullfläche.
  // Dann NICHT bei 0/0 aufschlagen, sondern am Modal (bzw. Viewport) ausrichten.
  const ar = anchor.getBoundingClientRect();
  const r = ar.width || ar.height ? ar : (modalBox ?? host).getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  const maxL = win.innerWidth - pw - 8, maxT = win.innerHeight - ph - 8;
  const clampL = (x: number) => Math.max(8, Math.min(x, maxL));
  const clampT = (y: number) => Math.max(8, Math.min(y, maxT));

  // 1. Standard: unter den Anker, linke Kanten bündig.
  // 2. Passt darunter nichts mehr (hoher Picker + Anker weit unten), NICHT gerade nach oben
  //    wegklappen – das schießt über das Modal hinaus. Stattdessen seitlich neben den Anker
  //    setzen, oben bündig mit ihm, und vertikal in den Viewport klemmen: rechts, sonst links.
  // 3. Ist seitlich auch kein Platz, bleibt als letzte Möglichkeit „über dem Anker".
  let left: number, top: number;
  if (r.bottom + 4 + ph <= win.innerHeight - 8) {
    left = clampL(r.left); top = r.bottom + 4;
  } else if (r.right + 4 + pw <= win.innerWidth - 8) {
    left = r.right + 4; top = clampT(r.top);              // rechts daneben, oben bündig
  } else if (r.left - 4 - pw >= 8) {
    left = r.left - 4 - pw; top = clampT(r.top);          // links daneben, oben bündig
  } else {
    left = clampL(r.left); top = Math.max(8, r.top - ph - 4);
  }
  // Auf ganze Pixel runden: getBoundingClientRect liefert Bruchwerte, und ein Popover auf
  // „halber" Pixelposition zeichnet seine 1px-Trennlinien je nach Rundung 1 oder 2 Pixel dick.
  pop.setCssStyles({ left: `${Math.round(left - org.left)}px`, top: `${Math.round(top - org.top)}px` });

  // Höhe an den Platz klemmen, der ab `top` bis zum unteren Rand noch da ist. Ohne das kann ein
  // Popover, das für keinen der vier Zweige ganz passt, unten aus dem Bild laufen – erreichbar
  // wäre der letzte Eintrag dann nicht mehr.
  //
  // Nur VERKLEINERN, nie vergrößern: jedes Popover behält seine eigene Obergrenze aus dem
  // Stylesheet (Zeilenlisten 320px, Datumswähler 560px, Anzeige-Panel 480px). Die Klemmung greift
  // erst, wenn der Bildschirm weniger hergibt als diese Grenze. Deshalb wird die berechnete Grenze
  // hier ausgelesen statt überschrieben.
  const cap = parseFloat(win.getComputedStyle(pop).maxHeight) || Infinity;
  pop.setCssStyles({ maxHeight: `${Math.min(cap, win.innerHeight - top - 8)}px` });

  win.setTimeout(() => doc.addEventListener("mousedown", onDoc, true), 0);
  win.addEventListener("resize", close);
}

/** Popover an einer BILDSCHIRMPOSITION statt an einem Anker-Element (Rechtsklick/Long-Press:
 *  dort gibt es keinen Anker, nur Koordinaten). Bewusst immer am body – Kontextmenüs entstehen
 *  in den Views, nie in einem Modal, deshalb entfällt die ganze Modal-Sonderbehandlung von
 *  openPopover (Fokus-Container, Klick-Verschlucken). Verschachtelte Popovers (ein Picker aus
 *  dem Menü heraus) bleiben über die .bt-pop-Ausnahme im Außerhalb-Klick erhalten. */
export function openPopoverAt(doc: Document, x: number, y: number, build: (pop: HTMLElement, close: () => void) => void, onClose?: () => void): void {
  const win = doc.defaultView ?? activeWindow;
  // Ohne Anker gibt es keine Ebene: Ein Kontextmenü ist immer die Wurzel und löst deshalb alles
  // Offene ab. Regel 1 (Toggle) entfällt mangels Auslöser – ein zweiter Rechtsklick ist ohnehin
  // ein Klick nach draußen und schließt das vorige über den normalen Weg.
  closeUnrelated(null);
  const pop = doc.body.createDiv({ cls: "bt-pop" });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    openPops.delete(entry);
    pop.remove();
    doc.removeEventListener("mousedown", onDoc, true);
    win.removeEventListener("resize", close);
    onClose?.();
  };
  const entry: OpenPop = { pop, anchor: null, parent: null, close };
  openPops.add(entry);
  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t)) return;
    // Kind-Popovers bleiben geschützt: Aus dem Zeilen-Kontextmenü heraus öffnet sich z. B. der
    // Datumswähler, dessen Anker in DIESEM Menü liegt (s. isDescendant).
    if (isDescendant(entry, popContaining(t))) return;
    close();
  };
  build(pop, close);

  // Gleicher Nullpunkt-Trick wie openPopover: einmal auf 0/0 setzen, Versatz eines etwaigen
  // containing block herausmessen und am Ende abziehen.
  pop.setCssStyles({ left: "0px", top: "0px" });
  const org = pop.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  // Standard: rechts unterhalb des Zeigers; passt es unten nicht, oberhalb aufklappen –
  // horizontal und vertikal in den Viewport geklemmt.
  const left = Math.max(8, Math.min(x, win.innerWidth - pw - 8));
  const top = y + ph + 8 <= win.innerHeight ? y : Math.max(8, y - ph - 4);
  // Runden wie in openPopover: gebrochener Ursprung macht 1px-Linien mal 1, mal 2 Pixel dick.
  pop.setCssStyles({ left: `${Math.round(left - org.left)}px`, top: `${Math.round(top - org.top)}px` });
  // Höhe an den verbleibenden Platz klemmen (nur verkleinern – s. openPopover).
  const cap = parseFloat(win.getComputedStyle(pop).maxHeight) || Infinity;
  pop.setCssStyles({ maxHeight: `${Math.min(cap, win.innerHeight - top - 8)}px` });

  win.setTimeout(() => doc.addEventListener("mousedown", onDoc, true), 0);
  win.addEventListener("resize", close);
}

/** Eine klickbare Zeile im Popover (Icon optional, Icon-Farbe optional). */
export function popRow(pop: HTMLElement, icon: string | null, label: string, onClick: () => void, active = false, iconColor?: string): HTMLElement {
  const row = pop.createDiv({ cls: "bt-row" + (active ? " is-active" : "") });
  if (icon) { const ic = row.createSpan({ cls: "bt-row-ic" }); setIcon(ic, icon); if (iconColor) ic.setCssStyles({ color: iconColor }); }
  row.createSpan({ cls: "bt-row-lbl", text: label });
  row.onclick = () => onClick();
  return row;
}
