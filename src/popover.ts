import { setIcon } from "obsidian";

/** Einfaches Popover, an activeDocument.body gehängt (eigene Ebene über dem Modal),
 *  schließt bei Klick außerhalb. Wie .am-pop in BeautyTasks. Doc/Win werden beim
 *  Öffnen erfasst (Popout-Kompatibilität, kein activeDocument-Drift bei Cleanup). */
export function openPopover(anchor: HTMLElement, build: (pop: HTMLElement, close: () => void) => void, onClose?: () => void): void {
  const doc = anchor.ownerDocument;
  const win = doc.defaultView ?? activeWindow;
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

  const r = anchor.getBoundingClientRect();
  const below = r.bottom + 4;
  const left = Math.max(8, Math.min(r.left, win.innerWidth - pop.offsetWidth - 8));
  const top = below + pop.offsetHeight > win.innerHeight - 8 ? Math.max(8, r.top - pop.offsetHeight - 4) : below;
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
