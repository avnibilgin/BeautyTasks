// Quick-Entry-Parser (zweisprachig). Zerlegt Freitext in { title, faellig, time, tags, priority }.
// Erkennt inline #Labels, gängige Datumsphrasen, Uhrzeiten und Prioritäten (DE + EN);
// gibt den um die erkannten Token bereinigten Titel zurück. Portiert aus tasks-ui.js.
//
// Wörtlich (nicht erkannt) wird Text auf zwei Wegen: `\wort` schützt ein einzelnes Wort (wie das
// Escaping in Markdown; der Backslash selbst fällt weg, `\\` ergibt einen echten Backslash), und
// "…" schützt eine ganze Phrase (die Anführungszeichen bleiben im Titel stehen – sie sind das
// Satzzeichen des Nutzers, nicht Syntax). Siehe mask() unten.
import { Priority } from "./types";

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
// Platzhalter (PUA, siehe mask()) sind hier ausgenommen: die führende Grenze wird mitkonsumiert
// und beim Strippen gelöscht – sie würde sonst direkt anschließenden Wörtern den Schutz nehmen.
const re = (body: string) => new RegExp("(?:^|[^A-Za-zÄÖÜäöüß\\uE000-\\uF8FF])" + body + "(?!" + L + ")", "i");

// ── Wörtlicher Text (`\wort`, "phrase") ──
// Beides wird vor der ersten Regel durch je EIN Zeichen aus der Private Use Area ersetzt. Das
// matcht auf keine Regel (weder Buchstabe noch \p{L}/\p{N}/Ziffer) und wandert – anders als eine
// gemerkte Position – unbeschadet durch die replace()-Mutationen der Regeln mit. Am Ende wird es
// im fertigen Titel wieder gegen den Originaltext getauscht.
// Der Backslash zählt nur am Wortanfang – wie #Label und @Projekt weiter unten. Sonst zerlegte
// er Pfade („C:\Users\avni") mitten im Wort. `\\ ` am Wortanfang ergibt einen echten Backslash.
const MASK = /(^|\s)\\(\S+)|(["„“”])([^"„“”]+)(["„“”])/g;
const PUA = /[\uE000-\uF8FF]/g;

export interface QuickEntry { title: string; faellig: string; time: string; tags: string[]; priority: Priority | null; project: string | null; }

// `projects` = bekannte Projekt-/Bereichsnamen. Nur damit wird @Projekt erkannt (Zuordnung nur
// zu Bestehenden – Projekte sind Dateien, kein Anlegen bei Tippfehler). Labels dagegen sind frei.
// `now` = Bezugspunkt für relative Phrasen („heute", „morgen", „nächsten Montag"). Hereingereicht
// statt aus der Systemuhr gelesen -> deterministisch testbar; Default bleibt die echte Zeit.
export function parseQuickEntry(raw: string, projects: string[] = [], now: Date = new Date()): QuickEntry {
  let text = " " + (raw || "") + " ";

  // Wörtlichen Text ausblenden – muss VOR jeder Regel laufen (auch vor den Labels, damit
  // `\#kein-label` als Text durchgeht). Über 6400 Literale sprengen die PUA -> unmaskiert lassen.
  const lits: string[] = [];
  const lit = (s: string): string => (lits.length >= 6400 ? s : String.fromCharCode(0xE000 + lits.push(s) - 1));
  const unmask = (s: string): string => s.replace(PUA, (c) => lits[c.charCodeAt(0) - 0xE000] ?? c);
  text = text.replace(MASK, (_m, ws: string | undefined, word: string | undefined, q1: string, inner: string, q2: string) =>
    word !== undefined ? ws + lit(word) : q1 + lit(inner) + q2);

  // Inline-#Labels sammeln + strippen.
  const tags: string[] = [];
  const tagRe = /(?:^|\s)#([\p{L}\p{N}_/-]+)/gu;
  for (const m of text.matchAll(tagRe)) tags.push(m[1]);
  text = text.replace(tagRe, " ");

  // Inline-@Projekt: NUR bestehende Projekte/Bereiche. Längster Name zuerst, damit „Home Server"
  // vor „Home" trifft; @ + Ziffer (Uhrzeit) matcht hier nicht, weil nur echte Namen alterniert werden.
  let project: string | null = null;
  const known = projects.filter(Boolean);
  if (known.length) {
    const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const alt = [...known].sort((a, b) => b.length - a.length).map(esc).join("|");
    const m = text.match(new RegExp("(?:^|\\s)@(" + alt + ")(?![\\p{L}\\p{N}_])", "iu"));
    if (m) {
      project = known.find((p) => p.toLowerCase() === m[1].toLowerCase()) ?? m[1];
      text = text.replace(m[0], " ");
    }
  }

  const today = now;
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

  // Uhrzeit: „um 07:30", „07:30", „um 7 uhr", „7 uhr"; englisch „7pm", „7:30 am". Erste Treffer gewinnt.
  let time = "";
  const hm = (h: number, mi: number): string | null => (h >= 0 && h < 24 && mi >= 0 && mi < 60 ? z(h) + ":" + z(mi) : null);
  const grabTime = (rx: RegExp, fn: (m: RegExpMatchArray) => string | null) => {
    if (time) return;
    const m = text.match(rx);
    if (!m) return;
    const t = fn(m);
    if (t) { time = t; text = text.replace(m[0], " "); }
  };
  grabTime(/(?:^|\s)(?:um|at|@)\s*(\d{1,2}):(\d{2})(?:\s*uhr)?(?!\d)/i, (m) => hm(+m[1], +m[2]));
  grabTime(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?![a-z])/i, (m) => { let h = +m[1] % 12; if (m[3].toLowerCase() === "pm") h += 12; return hm(h, m[2] ? +m[2] : 0); });
  grabTime(/(?:^|\s)(\d{1,2}):(\d{2})(?!\d)/, (m) => hm(+m[1], +m[2]));
  grabTime(/(?:^|\s)(?:um|at)\s*(\d{1,2})(?:\s*uhr)?(?![\d:])/i, (m) => hm(+m[1], 0));
  grabTime(/(?:^|\s)(\d{1,2})\s*uhr(?!\d)/i, (m) => hm(+m[1], 0));

  // Priorität: „p1"–„p4" bzw. „!1"–„!4" (Todoist-Stil). p1 = höchste.
  let priority: Priority | null = null;
  const pm = text.match(/(?:^|\s)[p!]([1-4])(?![\wäöüßÄÖÜ])/i);
  if (pm) { priority = (["highest", "high", "medium", "normal"] as Priority[])[+pm[1] - 1]; text = text.replace(pm[0], " "); }

  // Rücktausch NACH dem Kollabieren der Leerzeichen: eigene Formatierung im geschützten Text bleibt.
  return { title: unmask(text.replace(/\s{2,}/g, " ").trim()), faellig, time, tags: [...new Set(tags)], priority, project };
}

// ── Parse-Ergebnis auf die Eingabefelder anwenden ──
// Gemeinsam von Schnelleingabe und vollem Editor genutzt: beide werteten das Ergebnis früher je
// selbst aus – dieselbe Logik doppelt, jeder Fehler doppelt zu fixen und mangels DOM ungetestet.
// Hier bewusst als reine Funktion (Systemzeit als `today` hereingereicht), damit sie testbar ist.

/** Was ein Modal zwischen zwei Tastendrücken behalten muss, um Erkanntes von Manuellem zu trennen. */
export interface QuickEntryState { labels: string[]; project: string | null; }
export const emptyQuickEntryState = (): QuickEntryState => ({ labels: [], project: null });

/** Die Felder, die aus dem Titel befüllt werden können (Teilmenge der Modal-Felder). */
export interface QuickEntryFields {
  due: string | null; dueTime: string | null; priority: Priority; labels: string[]; project: string | null;
}

export interface QuickEntryOptions {
  enabled: boolean;                 // Einstellung „Natural Language" – aus: Titel bleibt wie getippt
  frozen: boolean;                  // bestehende Aufgabe: gespeicherter Titel ist Text, kein Befehl
  duePinned: boolean;               // Datum manuell gesetzt -> Text überschreibt es nicht mehr
  today: string;                    // YYYY-MM-DD, hereingereicht statt aus der Systemzeit gelesen.
                                    // Bezugspunkt für ALLES: auch „morgen" im Text rechnet dagegen.
  projects?: string[];              // bekannte Projekt-/Bereichsnamen ([] = kein @Projekt-Erkennen)
  defaultProject?: string | null;   // Fallback, wenn ein erkanntes @Projekt wieder entfernt wird
}

/** `raw` -> bereinigter Titel + neue Feldwerte + neuer Zustand. Mutiert nichts. */
export function applyQuickEntry(raw: string, fields: QuickEntryFields, state: QuickEntryState,
                                opts: QuickEntryOptions): { title: string; fields: QuickEntryFields; state: QuickEntryState } {
  if (!opts.enabled || opts.frozen) return { title: raw, fields, state };
  // Ein Bezugspunkt für den ganzen Aufruf: „morgen" im Text und der Uhrzeit-Default unten rechnen
  // gegen dasselbe Datum. Lokale Mitternacht (nicht Date.parse) – wie iso() im Parser.
  const [y, mo, d] = opts.today.split("-").map(Number);
  const p = parseQuickEntry(raw, opts.projects ?? [], new Date(y, mo - 1, d));
  const f: QuickEntryFields = { ...fields };

  if (!opts.duePinned && p.faellig) f.due = p.faellig;
  // Eine Uhrzeit impliziert einen Tag: ohne Datum wäre sie unsichtbar (der Datums-Chip prüft
  // `!!due`) und ginge beim Speichern verloren (nur mit Datum wird kombiniert). Default heute –
  // wie Todoist/TickTick. Betrifft auch „Zahnarzt um 20:00" ganz ohne Escape.
  if (!opts.duePinned && p.time) { f.dueTime = p.time; f.due ??= opts.today; }
  if (p.priority) f.priority = p.priority;

  // @Projekt: erkannt -> setzen; wieder aus dem Titel gelöscht -> zurück auf den Default.
  let project = state.project;
  if (p.project) { f.project = p.project; project = p.project; }
  else if (project && f.project === project) { f.project = opts.defaultProject ?? null; project = null; }

  // Inline-#Labels bei JEDEM Tastendruck ersetzen statt anhäufen – sonst entstehen beim Tippen von
  // „#wichtig" die Teil-Labels #w, #wi, #wich, … Manuell gesetzte Labels bleiben unberührt.
  const manual = fields.labels.filter((l) => !state.labels.includes(l));
  const parsed = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
  f.labels = [...manual, ...parsed];

  return { title: p.title, fields: f, state: { labels: parsed, project } };
}
