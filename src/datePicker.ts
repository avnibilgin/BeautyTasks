import { setIcon } from "obsidian";
import { openPopover } from "./popover";
import { t, getLocale } from "./i18n";
import { formatDate, formatDuration, dateOf, timeOf, combineDT } from "./format";

const z = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
const todayISO = () => iso(new Date());

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, "mär": 3, mar: 3, apr: 4, mai: 5, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, okt: 10, oct: 10, nov: 11, dez: 12, dec: 12,
};
const WDMAP: Record<string, number> = {
  sonntag: 0, sunday: 0, montag: 1, monday: 1, dienstag: 2, tuesday: 2, mittwoch: 3, wednesday: 3,
  donnerstag: 4, thursday: 4, freitag: 5, friday: 5, samstag: 6, sonnabend: 6, saturday: 6,
};

/** Lokalisierte Wochentags-/Monatsnamen via Intl. dayIndex 0 = Sonntag. */
const weekdayShort = (dayIndex: number) =>
  new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(2021, 7, 1 + dayIndex));
const monthYear = (d: Date) =>
  new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(d);

/** Natürliche Eingabe (zweisprachig): today/heute, tomorrow/morgen, Wochentag, ISO,
 *  DD.MM.(YYYY), „10 Jun", „Jun 10". */
function parseDateInput(raw: string): string {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "heute" || s === "today") return todayISO();
  if (s === "morgen" || s === "tomorrow") { const d = new Date(); d.setDate(d.getDate() + 1); return iso(d); }
  if (s === "übermorgen") { const d = new Date(); d.setDate(d.getDate() + 2); return iso(d); }
  if (s in WDMAP) { const d = new Date(); const off = ((WDMAP[s] - d.getDay() + 7) % 7) || 7; d.setDate(d.getDate() + off); return iso(d); }
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) { const d = new Date(+m[1], +m[2] - 1, +m[3]); return isNaN(d.getTime()) ? "" : iso(d); }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?$/);
  if (m) { let y = m[3] ? parseInt(m[3], 10) : new Date().getFullYear(); if (y < 100) y += 2000; const d = new Date(y, +m[2] - 1, +m[1]); return isNaN(d.getTime()) ? "" : iso(d); }
  m = s.match(/^(\d{1,2})\.?\s*([a-zä]{3,})\.?\s*(\d{2,4})?$/);
  if (m && MONTHS[m[2].slice(0, 3)]) { let y = m[3] ? parseInt(m[3], 10) : new Date().getFullYear(); if (y < 100) y += 2000; const d = new Date(y, MONTHS[m[2].slice(0, 3)] - 1, +m[1]); if (!isNaN(d.getTime())) return iso(d); }
  m = s.match(/^([a-zä]{3,})\.?\s*(\d{1,2})(?:\s*,?\s*(\d{2,4}))?$/);
  if (m && MONTHS[m[1].slice(0, 3)]) { let y = m[3] ? parseInt(m[3], 10) : new Date().getFullYear(); if (y < 100) y += 2000; const d = new Date(y, MONTHS[m[1].slice(0, 3)] - 1, +m[2]); if (!isNaN(d.getTime())) return iso(d); }
  return "";
}

/** Uhrzeit-Eingabe parsen: "2330"/"23:30"/"9"/"9pm"/"9:30am" -> "HH:mm" (oder null). */
export function parseTime(raw: string): string | null {
  let s = (raw || "").trim().toLowerCase().replace(/\s+/g, "").replace("uhr", "");
  if (!s) return null;
  let ampm = "";
  const ap = s.match(/(am|pm)$/); if (ap) { ampm = ap[1]; s = s.slice(0, -2); }
  let h: number, m = 0;
  const colon = s.match(/^(\d{1,2})[:.](\d{2})$/);
  if (colon) { h = +colon[1]; m = +colon[2]; }
  else if (/^\d{4}$/.test(s)) { h = +s.slice(0, 2); m = +s.slice(2); }
  else if (/^\d{3}$/.test(s)) { h = +s.slice(0, 1); m = +s.slice(1); }
  else if (/^\d{1,2}$/.test(s)) { h = +s; m = 0; }
  else return null;
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return z(h) + ":" + z(m);
}

// Dauer-Dropdown-Optionen (null = keine); Minuten, scrollbar wie die Uhrzeit-Liste.
const DUR_OPTS: (number | null)[] = [null, 15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480];

/** Freie Dauer-Eingabe: "30"/"30 min"/"1h"/"1h30"/"1:30"/"1,5h" -> Minuten (oder null). */
export function parseDuration(raw: string): number | null {
  const s = (raw || "").trim().toLowerCase().replace(",", ".");
  if (!s || s === "—" || s === "-") return null;
  let m = s.match(/^(\d+):(\d{2})$/);
  if (m) return +m[1] * 60 + +m[2];
  m = s.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(\d+)?\s*(?:m|min)?$/);
  if (m) return Math.round(parseFloat(m[1]) * 60 + (m[2] ? +m[2] : 0));
  m = s.match(/^(\d+)\s*(?:m|min|minutes?)?$/);
  if (m) return +m[1];
  return null;
}

/** Datums-Picker: Eingabefeld + Schnellzeilen + Monatskalender + optional Uhrzeit/Dauer.
 *  onPick("") = kein Datum. value darf "YYYY-MM-DD" oder "YYYY-MM-DDTHH:mm" sein.
 *  dur (optional) blendet die Dauer-Auswahl ein und meldet Änderungen separat. */
export function openDatePicker(
  anchor: HTMLElement, value: string, onPick: (iso: string) => void,
  dur?: { value: number | null; onChange: (d: number | null) => void },
): void {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-date");
    let curDate = value ? dateOf(value) : "";
    let curTime = value ? timeOf(value) : null;
    let curDur = dur ? dur.value : null;
    let timeOpen = !!curTime;

    const apply = () => onPick(curDate ? combineDT(curDate, curTime) : "");
    // Schnellauswahl schließt sofort, SOLANGE der Uhrzeit-Bereich zu ist; sonst live anwenden.
    const setDate = (d: string) => {
      curDate = d;
      if (!d) curTime = null;
      if (timeOpen && d) { apply(); renderTime(); renderCal(); }
      else { apply(); close(); }
    };

    const input = pop.createEl("input", { type: "text", cls: "bt-date-input", attr: { placeholder: t("placeholder_date_input") } });
    if (value) input.value = formatDate(value);
    input.onkeydown = (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      const v = parseDateInput(input.value);
      if (v) setDate(v);
      else { input.addClass("is-invalid"); window.setTimeout(() => input.removeClass("is-invalid"), 600); }
    };
    window.setTimeout(() => { input.focus(); input.select(); }, 0);

    const quick = pop.createDiv({ cls: "bt-date-quick" });
    const qrow = (icon: string, color: string, label: string, hint: string, val: string) => {
      const r = quick.createDiv({ cls: "bt-row bt-date-q" });
      const ic = r.createSpan({ cls: "bt-row-ic" }); setIcon(ic, icon); if (color) ic.setCssStyles({ color });
      r.createSpan({ cls: "bt-row-lbl", text: label });
      if (hint) r.createSpan({ cls: "bt-date-hint", text: hint });
      r.onclick = () => setDate(val);
    };
    const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate() + 1);
    const satOff = (6 - new Date().getDay() + 7) % 7; const sat = new Date(); sat.setDate(sat.getDate() + satOff);
    const monOff = ((1 - new Date().getDay() + 7) % 7) || 7; const mon = new Date(); mon.setDate(mon.getDate() + monOff);
    qrow("calendar", "#22c55e", t("date_today"), "", todayISO());
    qrow("sun", "#f59e0b", t("date_tomorrow"), weekdayShort(tomorrow.getDay()), iso(tomorrow));
    qrow("sofa", "#3b82f6", t("date_this_weekend"), weekdayShort(sat.getDay()), iso(sat));
    qrow("calendar-days", "#a78bfa", t("date_next_week"), weekdayShort(mon.getDay()), iso(mon));
    qrow("ban", "", t("date_no_date"), "", "");

    const cal = pop.createDiv({ cls: "bt-date-cal" });
    let view = curDate ? new Date(curDate + "T00:00:00") : new Date();
    view = new Date(view.getFullYear(), view.getMonth(), 1);
    function renderCal(): void {
      cal.empty();
      const head = cal.createDiv({ cls: "bt-cal-head" });
      const prev = head.createSpan({ cls: "bt-cal-nav" }); setIcon(prev, "chevron-left");
      prev.onclick = (ev) => { ev.stopPropagation(); view = new Date(view.getFullYear(), view.getMonth() - 1, 1); renderCal(); };
      head.createSpan({ cls: "bt-cal-title", text: monthYear(view) });
      const next = head.createSpan({ cls: "bt-cal-nav" }); setIcon(next, "chevron-right");
      next.onclick = (ev) => { ev.stopPropagation(); view = new Date(view.getFullYear(), view.getMonth() + 1, 1); renderCal(); };

      const grid = cal.createDiv({ cls: "bt-cal-grid" });
      for (const wd of [1, 2, 3, 4, 5, 6, 0]) grid.createDiv({ cls: "bt-cal-wd", text: weekdayShort(wd) });
      const startOff = (view.getDay() + 6) % 7;       // Montag zuerst
      const start = new Date(view); start.setDate(view.getDate() - startOff);
      const tISO = todayISO();
      for (let i = 0; i < 42; i++) {
        const day = new Date(start); day.setDate(start.getDate() + i);
        const dISO = iso(day);
        const cell = grid.createDiv({ cls: "bt-cal-day", text: String(day.getDate()) });
        if (day.getMonth() !== view.getMonth()) cell.addClass("is-other");
        if (dISO === tISO) cell.addClass("is-today");
        if (curDate && dISO === curDate) cell.addClass("is-sel");
        cell.onclick = (ev) => { ev.stopPropagation(); setDate(dISO); };
      }
    }
    renderCal();

    // ── Uhrzeit + Dauer (Todoist-Stil) ─────────────────────────────────────────
    const timeWrap = pop.createDiv({ cls: "bt-time-wrap" });
    function renderTime(): void {
      timeWrap.empty();
      if (!timeOpen) {
        const btn = timeWrap.createDiv({ cls: "bt-time-toggle" });
        const ic = btn.createSpan({ cls: "bt-row-ic" }); setIcon(ic, "clock");
        btn.createSpan({ cls: "bt-row-lbl", text: curTime ? curTime : t("time_add") });
        btn.onclick = () => { timeOpen = true; if (!curDate) curDate = todayISO(); renderTime(); renderCal(); };
        return;
      }
      // Uhrzeit-Zeile: Eingabe (LIVE-Commit beim Tippen, kein Umformatieren) + Vorschläge
      // als Overlay nach oben. Dropdown per Klasse (kein flackerndes hide/show).
      const row = timeWrap.createDiv({ cls: "bt-time-row" });
      row.createSpan({ cls: "bt-time-label", text: t("time_label") });
      const field = row.createDiv({ cls: "bt-time-field" });
      const ti = field.createEl("input", { type: "text", cls: "bt-time-input", attr: { placeholder: "09:00" } });
      ti.value = curTime ?? "";
      const drop = field.createDiv({ cls: "bt-time-drop" });
      const START = 8 * 60;   // Liste beginnt bei 08:00 (Termine meist ab morgens), danach Umbruch
      const openDrop = (filter: string) => {
        drop.empty();
        const f = filter.trim();
        let selEl: HTMLElement | null = null;
        for (let i = 0; i < 24 * 60; i += 15) {
          const mins = (START + i) % (24 * 60);
          const hhmm = z(Math.floor(mins / 60)) + ":" + z(mins % 60);
          if (f && !hhmm.startsWith(f)) continue;
          const it = drop.createDiv({ cls: "bt-time-opt" + (hhmm === curTime ? " is-sel" : ""), text: hhmm });
          if (hhmm === curTime) selEl = it;
          it.onmousedown = (e) => { e.preventDefault(); curTime = hhmm; ti.value = hhmm; apply(); drop.removeClass("is-open"); };
        }
        drop.addClass("is-open");
        if (selEl) drop.scrollTop = Math.max(0, selEl.offsetTop - 44);   // aktuelle Zeit sichtbar machen
      };
      // Beim Fokus ALLE zeigen (nicht nach dem vollen Wert filtern) + Text markieren (Überschreiben).
      ti.onfocus = () => { openDrop(""); window.setTimeout(() => ti.select(), 0); };
      ti.onblur = () => window.setTimeout(() => drop.removeClass("is-open"), 150);   // Klick auf Vorschlag durchlassen
      ti.oninput = () => {
        openDrop(ti.value);
        const v = parseTime(ti.value);                 // gültige Eingabe SOFORT übernehmen (kein Blur nötig)
        if (v) { curTime = v; apply(); } else if (!ti.value.trim()) { curTime = null; apply(); }
      };
      ti.onkeydown = (ev) => {
        if (ev.key === "Escape") { drop.removeClass("is-open"); }
        else if (ev.key === "Enter") { ev.preventDefault(); const v = parseTime(ti.value); if (v) { curTime = v; ti.value = v; apply(); } drop.removeClass("is-open"); ti.blur(); }
      };
      const clear = row.createSpan({ cls: "bt-time-clear" }); setIcon(clear, "x");
      clear.onmousedown = (e) => { e.preventDefault(); curTime = null; timeOpen = false; apply(); renderTime(); };

      // Dauer-Zeile: FREIE Eingabe + Overlay-Dropdown (genau wie die Uhrzeit).
      if (dur) {
        const drow = timeWrap.createDiv({ cls: "bt-dur-row" });
        drow.createSpan({ cls: "bt-time-label", text: t("duration_label") });
        const dfield = drow.createDiv({ cls: "bt-time-field" });
        const di = dfield.createEl("input", { type: "text", cls: "bt-dur-input", attr: { placeholder: "—" } });
        di.value = curDur ? formatDuration(curDur) : "";
        const ddrop = dfield.createDiv({ cls: "bt-time-drop" });
        const openDdrop = () => {
          ddrop.empty();
          let selEl: HTMLElement | null = null;
          for (const d of DUR_OPTS) {
            const it = ddrop.createDiv({ cls: "bt-time-opt" + (curDur === d ? " is-sel" : ""), text: d ? formatDuration(d) : "—" });
            if (curDur === d) selEl = it;
            it.onmousedown = (e) => { e.preventDefault(); curDur = d; di.value = d ? formatDuration(d) : ""; dur.onChange(d); ddrop.removeClass("is-open"); };
          }
          ddrop.addClass("is-open");
          if (selEl) ddrop.scrollTop = Math.max(0, selEl.offsetTop - 44);
        };
        di.onfocus = () => { openDdrop(); window.setTimeout(() => di.select(), 0); };
        di.onblur = () => { window.setTimeout(() => ddrop.removeClass("is-open"), 150); di.value = curDur ? formatDuration(curDur) : ""; };
        di.oninput = () => { curDur = parseDuration(di.value); dur.onChange(curDur); };   // Tippen sofort übernehmen
        di.onkeydown = (ev) => {
          if (ev.key === "Escape") ddrop.removeClass("is-open");
          else if (ev.key === "Enter") { ev.preventDefault(); ddrop.removeClass("is-open"); di.blur(); }
        };
      }
    }
    renderTime();
  });
}
