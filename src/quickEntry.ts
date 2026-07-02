// Quick-Entry-Parser (zweisprachig). Zerlegt Freitext in { title, faellig, tags }.
// Erkennt inline #Labels und gängige Datumsphrasen (DE + EN); gibt den um die
// erkannten Token bereinigten Titel zurück. Portiert aus tasks-ui.js parseQuickEntry.

const z = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const nextWeekday = (from: Date, target: number) => { let off = (target - from.getDay() + 7) % 7; if (off === 0) off = 7; return addDays(from, off); };

const WD: Record<string, number> = {
  sonntag: 0, montag: 1, dienstag: 2, mittwoch: 3, donnerstag: 4, freitag: 5, samstag: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};
const WDNAMES = "montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday";
// Monatsnamen (DE + EN, inkl. gängiger Abkürzungen) -> Monatsindex 0–11.
const MONTHS: Record<string, number> = {
  januar: 0, jänner: 0, january: 0, jan: 0,
  februar: 1, february: 1, feb: 1,
  märz: 2, maerz: 2, march: 2, mär: 2, mar: 2,
  april: 3, apr: 3,
  mai: 4, may: 4,
  juni: 5, june: 5, jun: 5,
  juli: 6, july: 6, jul: 6,
  august: 7, aug: 7,
  september: 8, sept: 8, sep: 8,
  oktober: 9, october: 9, okt: 9, oct: 9,
  november: 10, nov: 10,
  dezember: 11, december: 11, dez: 11, dec: 11,
};
// Längste zuerst, damit die Alternation „juli" vor „jul", „januar" vor „jan" trifft.
const MONTHNAMES = Object.keys(MONTHS).sort((a, b) => b.length - a.length).join("|");
const L = "[A-Za-zÄÖÜäöüß]";
// Wort-Grenze ohne Lookbehind (iOS < 16.4 unterstützt keine Lookbehinds): die führende
// Grenze als nicht-fangende Gruppe (^ oder Nicht-Buchstabe). Nicht-fangend → Capture-Indizes
// bleiben stabil; der konsumierte Grenz-Char wird beim Strippen ohnehin zu Leerraum.
const re = (body: string) => new RegExp("(?:^|[^A-Za-zÄÖÜäöüß])" + body + "(?!" + L + ")", "i");

export interface QuickEntry { title: string; faellig: string; tags: string[]; }

export function parseQuickEntry(raw: string): QuickEntry {
  let text = " " + (raw || "") + " ";

  // Inline-#Labels sammeln + strippen.
  const tags: string[] = [];
  const tagRe = /(?:^|\s)#([\p{L}\p{N}_/-]+)/gu;
  for (const m of text.matchAll(tagRe)) tags.push(m[1]);
  text = text.replace(tagRe, " ");

  const today = new Date();
  let faellig = "";
  const grab = (rx: RegExp, fn: (m: RegExpMatchArray) => Date | null) => {
    if (faellig) return;
    const m = text.match(rx);
    if (!m) return;
    const d = fn(m);
    if (d && !isNaN(d.getTime())) { faellig = iso(d); text = text.replace(m[0], " "); }
  };
  grab(re("heute|today"), () => today);
  grab(re("übermorgen|day\\s+after\\s+tomorrow"), () => addDays(today, 2));
  grab(re("morgen|tomorrow"), () => addDays(today, 1));
  grab(re("in\\s+(\\d+)\\s+(?:tagen|days?)"), (m) => addDays(today, parseInt(m[1], 10)));
  grab(re("(?:nächste[nr]?\\s+woche|next\\s+week)"), () => nextWeekday(today, 1));
  grab(re("(?:am|nächste[nr]?|diesen|kommende[nr]?|on|next|this|coming)\\s+(" + WDNAMES + ")"),
    (m) => nextWeekday(today, WD[m[1].toLowerCase()]));
  // Bloßer Wochentag ohne Vorwort („montag", „friday") -> nächster solcher Tag.
  grab(re("(" + WDNAMES + ")"), (m) => nextWeekday(today, WD[m[1].toLowerCase()]));
  // Tag + Monatsname („3. Juli", „03. Juli", „3 July") und Monatsname + Tag („July 3rd"),
  // jeweils mit optionalem Jahr. Ohne Jahr = laufendes Jahr.
  const monthDate = (mo: number, day: number, year?: string): Date | null => {
    const y = year ? parseInt(year, 10) : today.getFullYear();
    const d = new Date(y, mo, day);
    return d.getMonth() === mo ? d : null;
  };
  grab(re("(?:am\\s+|on\\s+)?(\\d{1,2})(?:\\.\\s*|\\s+)(" + MONTHNAMES + ")(?:\\s+(\\d{4}))?"),
    (m) => monthDate(MONTHS[m[2].toLowerCase()], parseInt(m[1], 10), m[3]));
  grab(re("(?:on\\s+)?(" + MONTHNAMES + ")\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?"),
    (m) => monthDate(MONTHS[m[1].toLowerCase()], parseInt(m[2], 10), m[3]));
  // Schluss-Guard statt \b: konsumiert einen optionalen End-Punkt („2.7.") und verhindert
  // Treffer mitten in Zahlen/Wörtern – sonst bliebe bei „2.7." ein einzelner Punkt im Titel.
  grab(/\b(?:am\s+)?(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?(?![\dA-Za-zÄÖÜäöüß])/i, (m) => {
    let y = m[3] ? parseInt(m[3], 10) : today.getFullYear(); if (y < 100) y += 2000;
    const d = new Date(y, +m[2] - 1, +m[1]); return d.getMonth() === +m[2] - 1 ? d : null;
  });
  grab(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, (m) => {
    let y = m[3] ? parseInt(m[3], 10) : today.getFullYear(); if (y < 100) y += 2000;
    const d = new Date(y, +m[1] - 1, +m[2]); return d.getMonth() === +m[1] - 1 ? d : null;
  });
  grab(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, (m) => {
    const d = new Date(+m[1], +m[2] - 1, +m[3]); return d.getMonth() === +m[2] - 1 ? d : null;
  });

  return { title: text.replace(/\s{2,}/g, " ").trim(), faellig, tags: [...new Set(tags)] };
}
