import { setIcon } from "obsidian";

/** Einfaches Popover, an activeDocument.body gehängt (eigene Ebene über dem Modal),
 *  schließt bei Klick außerhalb. Wie .am-pop in BeautyTasks. Doc/Win werden beim
 *  Öffnen erfasst (Popout-Kompatibilität, kein activeDocument-Drift bei Cleanup). */
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

export function openPopover(anchorEl: HTMLElement, build: (pop: HTMLElement, close: () => void) => void, onClose?: () => void): void {
  const doc = anchorEl.ownerDocument;
  const win = doc.defaultView ?? activeWindow;
  const anchor = liveAnchor(anchorEl) ?? anchorEl;
  // Innerhalb eines Modals INS Modal einhängen (sonst reißt Obsidians Fokus-Trap den
  // Fokus zurück -> Eingabefelder im Popover lassen sich nicht bedienen). position:fixed
  // bleibt viewport-relativ (kein Transform am .modal), Positionierung stimmt weiterhin.
  const host = anchor.closest<HTMLElement>(".modal") ?? doc.body;
  const pop = host.createDiv({ cls: "bt-pop" });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    pop.remove();
    doc.removeEventListener("mousedown", onDoc, true);
    win.removeEventListener("resize", close);
    onClose?.();
  };
  const inModal = host !== doc.body;
  const onDoc = (e: MouseEvent) => {
    const t = e.target as Node;
    if (pop.contains(t) || t === anchor || anchor.contains(t)) return;
    // Verschachtelung: Aus einem Popover heraus kann ein zweites geöffnet werden (z. B. die
    // Dropdowns im Anzeige-Panel). Dessen Elemente liegen NICHT in diesem Popover – ohne diese
    // Ausnahme würde jeder Klick darin das äußere Panel als „Klick außerhalb" schließen.
    const inOtherPop = (t as HTMLElement).closest?.(".bt-pop");
    if (inOtherPop && inOtherPop !== pop) return;
    close();
    // Klick außerhalb der Modal-Box würde sonst das ganze Modal schließen (und Änderungen
    // verwerfen) -> diesen einen Klick verschlucken, das Modal bleibt offen.
    if (inModal && !host.contains(t)) {
      e.stopPropagation();
      let swallow: (ev: MouseEvent) => void;
      const cleanup = () => doc.removeEventListener("click", swallow, true);
      swallow = (ev) => { ev.stopPropagation(); ev.preventDefault(); cleanup(); };
      doc.addEventListener("click", swallow, true);
      win.setTimeout(cleanup, 300);
    }
  };
  build(pop, close);

  // Letzte Sicherung: ist der Anker trotz allem nicht (mehr) im DOM, hat er eine Nullfläche.
  // Dann NICHT bei 0/0 aufschlagen, sondern am Modal (bzw. Viewport) ausrichten.
  const ar = anchor.getBoundingClientRect();
  const r = ar.width || ar.height ? ar : host.getBoundingClientRect();
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
  pop.setCssStyles({ left: `${left}px`, top: `${top}px` });

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
