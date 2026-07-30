// Titel-Modell: EINE Kaskade für Lesen UND Schreiben.
//
//   1. `title:` im Frontmatter (nicht leer)
//   2. erste H1 im Body
//   3. Dateiname
//
// Geschrieben wird dorthin, wo der Titel herkam. Stufe 3 ist nicht beschreibbar – der Dateiname
// ist die Identität (Projekt- und Eltern-Verweise laufen über den Basenamen, s. resolveProjectPath),
// deshalb fällt sie beim Schreiben auf Stufe 1 zurück. Daraus folgt die Zusage an den Nutzer:
// In den Body wird NUR geschrieben, wenn dort schon ein Titel steht – eine H1 als erste Überschrift.
//
// Alles hier ist rein (keine App, kein obsidian-Import) und damit vollständig testbar.

/** Frontmatter-Schlüssel des Titels, Vorgabe. `title` ist der Ökosystem-Standard (andere Werkzeuge
 *  lesen und schreiben dasselbe Feld) – wer es für etwas Eigenes belegt, stellt in den Einstellungen
 *  einen anderen Namen ein. */
export const DEFAULT_TITLE_KEY = "title";

/** Frontmatter-Felder, die BeautyTasks auf Aufgaben-Notizen selbst führt, plus die von Obsidian
 *  belegten. Als Titel-Feld gesperrt – sonst würde die App beim Umbenennen ihre eigenen Daten
 *  (oder die Tags des Nutzers) überschreiben. */
const RESERVED_KEYS = new Set([
  "type", "id", "status", "priority", "due", "scheduled", "start", "duration", "project", "parent",
  "labels", "recurrence", "recur_basis", "reminders", "sort_order", "created", "completed",
  "cancelled", "description", "external_id", "gcal_event_id", "gcal_calendar_id", "gcal_sync",
  "icon", "color", "nav_hidden",
  "tags", "aliases", "cssclasses", "cssclass", "publish", "permalink",
]);

/** Einen eingegebenen Schlüsselnamen auf einen brauchbaren reduzieren. Erlaubt sind Namen, die in
 *  YAML ohne Anführungszeichen auskommen (Buchstabe voran, dann Buchstaben/Ziffern/_/-); alles
 *  andere und jedes reservierte Feld fällt auf die Vorgabe zurück. So kann eine vertippte
 *  Einstellung nie Daten zerstören. */
export function normalizeTitleKey(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!/^[A-Za-z][A-Za-z0-9_-]*$/.test(s)) return DEFAULT_TITLE_KEY;
  return RESERVED_KEYS.has(s.toLowerCase()) ? DEFAULT_TITLE_KEY : s;
}

// ── Lebende Registry ────────────────────────────────────────────────
// Wie bei den Status (statuses.ts) und der Sprache (i18n.ts): EINE Quelle zur Laufzeit, von
// main.loadSettings() gesetzt. Die reinen Helfer hier und die Aufrufer in Index/Service lesen
// den Getter – so braucht keine dieser Stellen die Einstellungen durchgereicht zu bekommen.
let CURRENT_KEY = DEFAULT_TITLE_KEY;

export function initTitleKey(raw?: string | null): void { CURRENT_KEY = normalizeTitleKey(raw); }
export function titleKey(): string { return CURRENT_KEY; }

/** Minimal-Form eines Überschriften-Eintrags aus dem metadataCache (strukturell kompatibel zu
 *  HeadingCache). Bewusst lokal definiert, damit dieses Modul ohne obsidian-Import auskommt. */
export interface HeadingLike { heading: string; level: number; }

/** Stufe 1: brauchbarer Frontmatter-Titel (String oder Zahl, getrimmt, nicht leer) – sonst null. */
export function fmTitle(v: unknown): string | null {
  if (typeof v !== "string" && typeof v !== "number") return null;
  return String(v).trim() || null;
}

/** Die Kaskade: Frontmatter -> erste H1 -> Dateiname. Der Dateiname ist immer vorhanden. */
export function resolveTitle(fromFm: string | null, h1: string | undefined, basename: string): string {
  return fromFm ?? ((h1 ?? "").trim() || basename);
}

/** Erste H1 aus den Überschriften des metadataCache (fence-sicher, weil Obsidian Code-Blöcke
 *  gar nicht erst als Überschrift meldet). Tiefere Ebenen zählen NICHT – sonst läse die App einen
 *  Titel, den sie nicht zurückschreiben kann. */
export function firstH1(headings: readonly HeadingLike[] | undefined): string | undefined {
  return headings?.find((h) => h.level === 1)?.heading;
}

export type TitleTarget = "frontmatter" | "heading";

/** Wohin gehört eine Titeländerung? Frontmatter gewinnt; ohne H1 im Body gibt es kein Ziel im
 *  Text, also ebenfalls Frontmatter (dort wird `title:` dann angelegt). */
export function titleTarget(hasFmTitle: boolean, h1Line: number | null): TitleTarget {
  return hasFmTitle || h1Line === null ? "frontmatter" : "heading";
}

/** Erste H1 in einem Zeilenblock ab `from` – oder null. Code-Fences werden übersprungen:
 *  `# ...` in einem ```-Block ist eine Kommentarzeile, keine Überschrift. Genau daran scheiterte
 *  die frühere Regex über den ganzen Dateiinhalt. */
function scanH1(lines: string[], from: number): number | null {
  let fence: string | null = null;                       // offener Code-Fence (``` oder ~~~)
  for (let i = from; i < lines.length; i++) {
    const line = lines[i];
    const f = line.match(/^\s{0,3}(`{3,}|~{3,})/);
    if (f) {
      if (fence === null) fence = f[1][0];               // öffnet
      else if (f[1][0] === fence) fence = null;          // schließt (gleiches Zeichen)
      continue;
    }
    if (fence === null && /^#\s+\S/.test(line)) return i;
  }
  return null;
}

/** Zeilennummer der ersten H1 einer ganzen Notiz (Frontmatter wird übersprungen) – oder null. */
export function findH1Line(content: string): number | null {
  const lines = content.split("\n");
  let start = 0;
  if (lines[0]?.trim() === "---") {                      // Frontmatter überspringen
    const end = lines.findIndex((l, n) => n > 0 && l.trim() === "---");
    if (end === -1) return null;                         // unabgeschlossen -> alles ist Frontmatter
    start = end + 1;
  }
  return scanH1(lines, start);
}

/** Wie findH1Line, aber für einen Body OHNE Frontmatter (dort wäre ein führendes `---` eine
 *  Trennlinie, kein Frontmatter-Anfang). Nutzt splitContent, damit Titel-Erkennung und
 *  Beschreibung/Log-Trennung dieselbe Definition von „H1" verwenden. */
export function findH1LineInBody(body: string): number | null {
  return scanH1(body.split("\n"), 0);
}

/** GENAU eine Zeile ersetzen (kein Regex über den ganzen Text). Die Überschriftenebene der Zeile
 *  bleibt erhalten. null = nicht ersetzt, weil die Zeile keine Überschrift (mehr) ist – der
 *  Aufrufer weicht dann aufs Frontmatter aus, statt blind zu schreiben. */
export function replaceHeadingLine(content: string, line: number, title: string): string | null {
  const lines = content.split("\n");
  if (line < 0 || line >= lines.length) return null;
  const m = lines[line].match(/^(#{1,6})\s+/);
  if (!m) return null;
  lines[line] = m[1] + " " + title;
  return lines.join("\n");
}

/** Body einer FRISCH angelegten Aufgaben-Notiz. Regelfall seit 1.31.0 ist der Titel im Frontmatter –
 *  dann bekommt die Notiz keine Überschrift, sonst stünde derselbe Titel doppelt und die zweite
 *  Stelle wäre nach dem ersten Umbenennen falsch. Die H1-Form bleibt für Notizen, die ihren Titel
 *  im Text führen (etwa Kopien einer solchen Notiz). */
export function newTaskBody(title: string, inFrontmatter: boolean): string {
  return inFrontmatter ? "\n" : "\n# " + title + "\n";
}

/** Entfernt die Titel-Zeile aus dem Body – aber NUR, wenn sie noch genau diesen Titel trägt.
 *  Zusammen mit einer direkt folgenden Leerzeile, damit oben keine Lücke zurückbleibt und das
 *  Ergebnis exakt so aussieht wie eine frisch angelegte Notiz (s. newTaskBody). Trägt die Zeile
 *  etwas anderes, bleibt sie stehen – dann ist sie eine Überschrift des Nutzers, kein Titel. */
export function dropHeadingLine(content: string, line: number | null, title: string): string {
  if (line === null) return content;
  const lines = content.split("\n");
  const m = lines[line]?.match(/^#\s+(.*)$/);
  if (!m || m[1].trim() !== title.trim()) return content;
  lines.splice(line, lines[line + 1] === "" ? 2 : 1);
  return lines.join("\n");
}

/** Migration „Titel ins Frontmatter": Was ist für DIESE Notiz zu tun? null = nichts.
 *
 *  Angefasst werden nur Notizen ohne `title:` – wer das Feld schon führt, hat es bewusst gesetzt.
 *  Geschrieben wird immer der Titel, den die Notiz BISHER angezeigt hat (erste Überschrift, sonst
 *  Dateiname), damit sich für niemanden ein Titel ändert. Die Überschrift wird nur dann entfernt,
 *  wenn sie eine H1 und damit die Titel-Zeile war; eine `##`-Zwischenüberschrift gehört dem Nutzer
 *  und bleibt, wo sie ist. */
export function titleToStore(fmRaw: unknown, headings: readonly HeadingLike[] | undefined, basename: string):
  { title: string; dropH1: boolean } | null {
  if (fmTitle(fmRaw) !== null) return null;
  const first = headings?.[0];
  return { title: (first?.heading ?? "").trim() || basename, dropH1: first?.level === 1 };
}
