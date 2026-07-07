import { setIcon } from "obsidian";
import { t } from "./i18n";

/** Kuratierte Farbpalette (geteilt: Status-Picker, Neu-Modal, Filter-Editor). */
export const COLOR_PRESETS = ["#e05c4a", "#f97316", "#f59e0b", "#4caf50", "#3b82f6", "#7c5cff", "#a855f7", "#ec4899"];

/** Inline-Swatch-Reihe für Modals (nicht Popover): „keine" · Presets · „Custom" (nativer
 *  Farbwähler). onPick liefert die gewählte Farbe (null = keine). */
export function buildSwatchRow(row: HTMLElement, current: string | null, onPick: (c: string | null) => void): void {
  row.addClass("bt-swatch-row");
  const mark = (el: HTMLElement): void => {
    row.querySelectorAll(".bt-color-cell").forEach((s) => s.removeClass("is-active"));
    el.addClass("is-active");
  };
  const isPreset = !current || COLOR_PRESETS.includes(current);

  const none = row.createEl("button", { cls: "bt-color-cell bt-color-none" + (!current ? " is-active" : ""), attr: { "aria-label": t("status_color_none") } });
  setIcon(none, "ban");
  none.onclick = () => { onPick(null); mark(none); };

  for (const c of COLOR_PRESETS) {
    const b = row.createEl("button", { cls: "bt-color-cell" + (current === c ? " is-active" : ""), attr: { "aria-label": c } });
    b.style.setProperty("--bt-swatch", c);
    b.onclick = () => { onPick(c); mark(b); };
  }

  const custom = row.createEl("button", { cls: "bt-color-cell bt-color-custom" + (isPreset ? "" : " is-active"), attr: { "aria-label": t("color_custom") } });
  if (!isPreset && current) custom.style.setProperty("--bt-swatch", current);
  setIcon(custom, "pipette");
  const input = custom.createEl("input", { cls: "bt-color-input", attr: { type: "color" } });
  if (current && /^#[0-9a-f]{6}$/i.test(current)) input.value = current;
  input.oninput = () => { custom.style.setProperty("--bt-swatch", input.value); mark(custom); onPick(input.value); };
}
