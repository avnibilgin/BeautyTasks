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
/** Regex-Sonderzeichen entschaerfen (Projektnamen, Ausloeser-Woerter). */
const rxEsc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ── Wiederholung ──
// Ergebnis ist stets das kanonische „every N unit" – das Format, das recurrence.ts versteht und der
// Chip schreibt (RECUR in chips.ts). „jeden Tag" ist also nur Eingabe, nie Speicherwert.
const RECUR_UNITS: Record<string, string> = {
  tag: "day", tage: "day", tagen: "day", day: "day", days: "day",
  woche: "week", wochen: "week", week: "week", weeks: "week",
  monat: "month", monate: "month", monaten: "month", month: "month", months: "month",
  jahr: "year", jahre: "year", jahren: "year", year: "year", years: "year",
};
// Adverbien ohne Zahl. Umlautlose Schreibweisen mit, weil sie real getippt werden.
const RECUR_ADV: Record<string, string> = {
  täglich: "every day", taeglich: "every day", daily: "every day",
  wöchentlich: "every week", woechentlich: "every week", weekly: "every week",
  monatlich: "every month", monthly: "every month",
  jährlich: "every year", jaehrlich: "every year", yearly: "every year", annually: "every year",
};
// Längste zuerst – sonst träfe „tag" vor „tagen" und ließe ein „en" im Titel stehen.
const longestFirst = (o: Record<string, string>): string => Object.keys(o).sort((a, b) => b.length - a.length).join("|");
const RUNITS = longestFirst(RECUR_UNITS);
const RADV = longestFirst(RECUR_ADV);
/** { n, unit } -> „every day" / „every 3 months" (trifft die Chip-Presets exakt). */
const recurRule = (n: number, unit: string): string => (n === 1 ? "every " + unit : "every " + n + " " + unit + "s");

export interface QuickEntry {
  title: string; faellig: string; time: string; tags: string[]; priority: Priority | null; project: string | null;
  recurrence: string | null;
  faelligSrc: string; timeSrc: string; recurSrc: string;
}

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
    const alt = [...known].sort((a, b) => b.length - a.length).map(rxEsc).join("|");
    const m = text.match(new RegExp("(?:^|\\s)@(" + alt + ")(?![\\p{L}\\p{N}_])", "iu"));
    if (m) {
      project = known.find((p) => p.toLowerCase() === m[1].toLowerCase()) ?? m[1];
      text = text.replace(m[0], " ");
    }
  }

  const today = now;
  // Welcher Text hat den Treffer ausgelöst? Wird als faelligSrc/timeSrc gemeldet, damit das ✕ am
  // Chip ihn im Titel escapen kann (escapeTriggers). Das führende Grenzzeichen konsumieren die
  // Regeln mit (kein Lookbehind wegen iOS) – deshalb abschneiden, falls kein Buchstabe/Ziffer.
  const trigger = (hit: string): string => hit.replace(/^[^\p{L}\p{N}]/u, "");
  let faelligSrc = "", timeSrc = "";

  // Wiederholung VOR den Datumsregeln: „alle 3 tage" darf seinen Text zuerst greifen, damit in
  // „alle 3 tage ab morgen" hinterher noch „morgen" als Datum übrig bleibt.
  let recurrence: string | null = null, recurSrc = "";
  const grabRecur = (rx: RegExp, fn: (m: RegExpMatchArray) => string | null) => {
    if (recurrence) return;
    const m = text.match(rx);
    if (!m) return;
    const r = fn(m);
    if (r) { recurrence = r; recurSrc = trigger(m[0]); text = text.replace(m[0], " "); }
  };
  // „jeden tag", „jede 2 wochen", „alle 3 tage", „every 2 days". Ohne Zahl = jede Einheit.
  // „alle"/„every" ohne Einheit dahinter trifft NICHT – „alle Rechnungen zahlen" bleibt Text.
  grabRecur(re("(?:jeden|jede[nsr]?|alle|every)\\s+(?:(\\d+)\\s+)?(" + RUNITS + ")"),
    (m) => recurRule(m[1] ? parseInt(m[1], 10) : 1, RECUR_UNITS[m[2].toLowerCase()]));
  grabRecur(re("(" + RADV + ")"), (m) => RECUR_ADV[m[1].toLowerCase()]);

  // ── Uhrzeit, Teil 1: mit „um"/„at" davor ──
  // Bewusst VOR den Datumsregeln. „um 20.12" ist eine Uhrzeit – die Datumsregel unten wuerde es
  // sonst als 20. Dezember wegschnappen, waehrend „um 20.15" durchkaeme (Monat 15 gibt es nicht).
  // Mal Datum, mal Uhrzeit, je nach Minutenzahl – genau das darf nicht passieren. Mit „um" davor
  // ist es eindeutig eine Zeit, also entscheidet das Vorwort, nicht die Reihenfolge.
  let time = "";
  const hm = (h: number, mi: number): string | null => (h >= 0 && h < 24 && mi >= 0 && mi < 60 ? z(h) + ":" + z(mi) : null);
  const grabTime = (rx: RegExp, fn: (m: RegExpMatchArray) => string | null) => {
    if (time) return;
    const m = text.match(rx);
    if (!m) return;
    const t = fn(m);
    if (t) { time = t; timeSrc = trigger(m[0]); text = text.replace(m[0], " "); }
  };
  // „um 20:15" und „um 20.15" (deutsche Schreibweise). Der Schluss-Guard laesst „um 20.10.2026"
  // in Ruhe – das ist ein Datum, keine Uhrzeit.
  grabTime(/(?:^|\s)(?:um|at|@)\s*(\d{1,2})[.:](\d{2})(?:\s*uhr)?(?!\.?\d)/i, (m) => hm(+m[1], +m[2]));
  // Vierstellig ohne Trenner („um 2015" -> 20:15). NUR mit „um"/„at": ein blosses „2015" ist eine
  // Jahreszahl („Fotos von 2015 sortieren"). Stunde 00–23, Minute 00–59 – „um 2500" bleibt Text.
  grabTime(/(?:^|\s)(?:um|at)\s*([01]\d|2[0-3])([0-5]\d)(?:\s*uhr)?(?!\d)/i, (m) => hm(+m[1], +m[2]));

  let faellig = "";
  const grab = (rx: RegExp, fn: (m: RegExpMatchArray) => Date | null) => {
    if (faellig) return;
    const m = text.match(rx);
    if (!m) return;
    const d = fn(m);
    if (d && !isNaN(d.getTime())) { faellig = iso(d); faelligSrc = trigger(m[0]); text = text.replace(m[0], " "); }
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

  // Uhrzeit, Teil 2: ohne Vorwort („07:30", „7 uhr", „7pm"). Erster Treffer gewinnt.
  grabTime(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?![a-z])/i, (m) => { let h = +m[1] % 12; if (m[3].toLowerCase() === "pm") h += 12; return hm(h, m[2] ? +m[2] : 0); });
  grabTime(/(?:^|\s)(\d{1,2}):(\d{2})(?!\d)/, (m) => hm(+m[1], +m[2]));
  grabTime(/(?:^|\s)(?:um|at)\s*(\d{1,2})(?:\s*uhr)?(?![\d:])/i, (m) => hm(+m[1], 0));
  grabTime(/(?:^|\s)(\d{1,2})\s*uhr(?!\d)/i, (m) => hm(+m[1], 0));

  // Priorität: „p1"–„p4" bzw. „!1"–„!4" (Todoist-Stil). p1 = höchste.
  let priority: Priority | null = null;
  const pm = text.match(/(?:^|\s)[p!]([1-4])(?![\wäöüßÄÖÜ])/i);
  if (pm) { priority = (["highest", "high", "medium", "normal"] as Priority[])[+pm[1] - 1]; text = text.replace(pm[0], " "); }

  // Rücktausch NACH dem Kollabieren der Leerzeichen: eigene Formatierung im geschützten Text bleibt.
  return { title: unmask(text.replace(/\s{2,}/g, " ").trim()), faellig, time, tags: [...new Set(tags)], priority, project, recurrence, faelligSrc, timeSrc, recurSrc };
}

// ── Parse-Ergebnis auf die Eingabefelder anwenden ──
// Gemeinsam von Schnelleingabe und vollem Editor genutzt: beide werteten das Ergebnis früher je
// selbst aus – dieselbe Logik doppelt, jeder Fehler doppelt zu fixen und mangels DOM ungetestet.
// Hier bewusst als reine Funktion (Systemzeit als `today` hereingereicht), damit sie testbar ist.

/** Was ein Modal zwischen zwei Tastendrücken behalten muss, um Erkanntes von Manuellem zu trennen.
 *  `dueSrc`/`timeSrc` = der Text, der Datum bzw. Uhrzeit ausgelöst hat („morgen", „um 20:00"); leer,
 *  sobald der Wert nicht (mehr) aus dem Titel stammt. Damit weiß das ✕ am Chip, ob es den Auslöser
 *  im Titel escapen soll (Wort bleibt Text) statt das Feld nur zu leeren. */
export interface QuickEntryState {
  labels: string[]; project: string | null;
  dueSrc: string; timeSrc: string; recurSrc: string;
  dueFromTitle: boolean;   // f.due stammt aus dem Titel (Datumswort ODER Anker) -> darf zurueck
}
export const emptyQuickEntryState = (): QuickEntryState => ({ labels: [], project: null, dueSrc: "", timeSrc: "", recurSrc: "", dueFromTitle: false });

/** Setzt vor jedes Wort der Auslöser einen Backslash – das ✕ am Datums-Chip tippt ihn also für den
 *  Nutzer. Pro Wort statt Anführungszeichen ums Ganze: die blieben sonst im Titel stehen.
 *  ALLE Vorkommen, nicht nur das erste – „kein Datum" gilt dem Wort, nicht einem Vorkommen
 *  („heute heute anrufen" braucht beide). Bereits Escaptes wird nicht doppelt escapt.
 *  Findet sich ein Auslöser nicht mehr wörtlich im Rohtext, bleibt der Text unverändert: bei
 *  `in 3 #x tagen` strippt der Parser das Label vor der Datumsregel, der gemeldete Auslöser trägt
 *  dann dessen Lücke. Der Aufrufer erkennt das am unveränderten Rückgabewert und leert normal. */
export function escapeTriggers(raw: string, triggers: string[]): string {
  let out = raw;
  for (const trg of triggers) {
    if (!trg.trim()) continue;
    const body = trg.trim().split(/\s+/).map(rxEsc).join("\\s+");
    const rx = new RegExp("(^|[^\\p{L}\\p{N}\\\\])(" + body + ")(?![\\p{L}\\p{N}])", "giu");
    out = out.replace(rx, (_m, pre: string, hit: string) => pre + hit.replace(/(^|\s)(\S)/g, "$1\\$2"));
  }
  return out;
}

/** Die Felder, die aus dem Titel befüllt werden können (Teilmenge der Modal-Felder). */
export interface QuickEntryFields {
  due: string | null; dueTime: string | null; priority: Priority; labels: string[]; project: string | null;
  recurrence: string | null;
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

  // Was der letzte Lauf AUS DEM TITEL gesetzt hat, gehört dem Titel: verschwindet der Auslöser,
  // verschwindet der Wert. Ohne das klebt beim Tippen von „um 2015" der Zwischenstand „um 20"
  // (= 20:00 + Anker heute) fest, obwohl der fertige Text gar keine Uhrzeit mehr ergibt.
  // Nur Selbstgesetztes wird zurückgenommen – ein voreingestelltes Datum („+ Aufgabe" auf der
  // Heute-Seite) kam nie aus dem Titel und bleibt unberührt.
  if (!opts.duePinned) {
    if (state.dueFromTitle) f.due = null;
    if (state.timeSrc) f.dueTime = null;
  }
  if (state.recurSrc) f.recurrence = null;

  let dueSrc = "", timeSrc = "", recurSrc = "", dueFromTitle = false;
  if (!opts.duePinned && p.faellig) { f.due = p.faellig; dueSrc = p.faelligSrc; dueFromTitle = true; }
  // Eine Uhrzeit impliziert einen Tag: ohne Datum wäre sie unsichtbar (der Datums-Chip prüft
  // `!!due`) und ginge beim Speichern verloren (nur mit Datum wird kombiniert). Default heute –
  // wie Todoist/TickTick. Betrifft auch „Zahnarzt um 20:00" ganz ohne Escape.
  if (!opts.duePinned && p.time) {
    f.dueTime = p.time; timeSrc = p.timeSrc;
    if (f.due == null) { f.due = opts.today; dueFromTitle = true; }
  }
  if (p.priority) f.priority = p.priority;
  // Wiederholung folgt dem Muster der Priorität (kein „pin"): steht sie im Text, gewinnt der Text.
  // Zurückgenommen wird sie über das ✕ am Chip, das den Auslöser escapt.
  // Wie die Uhrzeit braucht sie einen Anker: ohne Datum liefert recurrence.ts keine nächste
  // Instanz (nextInstance: ohne due UND scheduled -> null). Der Chip zeigte dann „Täglich" an,
  // ohne dass je etwas wiederkehrt. Ohne Datum also heute – „ab morgen" gewinnt, weil das Datum
  // oben bereits gesetzt wurde. duePinned schlägt den Anker: ein bewusst geleertes Datum holt
  // „jeden Tag" nicht zurück.
  if (p.recurrence) {
    f.recurrence = p.recurrence; recurSrc = p.recurSrc;
    if (!opts.duePinned && f.due == null) { f.due = opts.today; dueFromTitle = true; }
  }

  // @Projekt: erkannt -> setzen; wieder aus dem Titel gelöscht -> zurück auf den Default.
  let project = state.project;
  if (p.project) { f.project = p.project; project = p.project; }
  else if (project && f.project === project) { f.project = opts.defaultProject ?? null; project = null; }

  // Inline-#Labels bei JEDEM Tastendruck ersetzen statt anhäufen – sonst entstehen beim Tippen von
  // „#wichtig" die Teil-Labels #w, #wi, #wich, … Manuell gesetzte Labels bleiben unberührt.
  const manual = fields.labels.filter((l) => !state.labels.includes(l));
  const parsed = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
  f.labels = [...manual, ...parsed];

  return { title: p.title, fields: f, state: { labels: parsed, project, dueSrc, timeSrc, recurSrc, dueFromTitle } };
}
