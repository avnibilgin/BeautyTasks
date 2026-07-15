import { App, TFile } from "obsidian";
import { getLocale } from "./i18n";

// Kommentar-Log (Details) – 1:1 zum alten BeautyTasks (tasks-utils.js). Einträge stehen
// als [!log]-Callouts; im neuen Modell leben sie im BODY der Aufgaben-Notiz (statt in
// einer separaten Detail-Notiz), unterhalb der „# Titel"-Überschrift.

export interface LogEntry { ts: string; body: string; legacy?: boolean; }

/** parseDetailLog(body, fallbackTs) → Einträge. Erkennt [!log]-Callouts; gibt es keinen,
 *  gilt der ganze (freie) Inhalt als EIN Alt-Eintrag (fallbackTs). */
export function parseDetailLog(body: string, fallbackTs = ""): LogEntry[] {
  const src = String(body || "");
  const entries: { ts: string; body: string[]; legacy?: boolean }[] = [];
  let cur: { ts: string; body: string[] } | null = null;
  for (const line of src.split("\n")) {
    const head = line.match(/^>\s*\[!log\][-+]?\s*(.*?)\s*$/i);
    if (head) {
      if (cur) entries.push(cur);
      cur = { ts: (head[1] || "").trim(), body: [] };
    } else if (cur && /^>/.test(line)) {
      cur.body.push(line.replace(/^>\s?/, ""));
    } else if (cur) {
      entries.push(cur); cur = null;   // erste Nicht-Callout-Zeile beendet den Eintrag
    }
  }
  if (cur) entries.push(cur);
  const out: LogEntry[] = entries.map((e) => ({ ts: e.ts, body: e.body.join("\n").replace(/^\n+|\n+$/g, "") }));
  if (out.length === 0) {
    const tt = src.replace(/\n{3,}/g, "\n\n").trim();
    return tt ? [{ ts: (fallbackTs || "").trim(), body: tt, legacy: true }] : [];
  }
  return out.filter((e) => (e.body || "").trim() !== "");
}

/** serializeDetailLog(entries) → Markdown (Callout-Blöcke, durch Leerzeile getrennt). */
export function serializeDetailLog(entries: LogEntry[]): string {
  return (entries || [])
    .filter((e) => (e.body || "").trim() !== "")
    .map((e) => {
      const ts = (e.ts || "").trim();
      const body = String(e.body || "").split("\n").map((l) => "> " + l).join("\n");
      return "> [!log]" + (ts ? " " + ts : "") + "\n" + body;
    })
    .join("\n\n");
}

/** nowLogTs() → absoluter Zeitstempel "YYYY-MM-DD HH:MM:SS". */
export function nowLogTs(d?: Date): string {
  d = d || new Date();
  const z = (n: number) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + " "
    + z(d.getHours()) + ":" + z(d.getMinutes()) + ":" + z(d.getSeconds());
}

/** formatLogTime(ts) → relative Anzeige "Heute · 23:12" / "24. Jun · 09:15" (Locale-abhängig). */
export function formatLogTime(ts: string, now?: Date): string {
  const m = String(ts || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return (ts || "").trim();
  const de = getLocale() !== "en";
  const base = now || new Date();
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = new Date(+m[1], +m[2] - 1, +m[3]);
  const diff = Math.round((day.getTime() - today.getTime()) / 86400000);
  const hm = m[4] + ":" + m[5];
  const mon = de ? ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
                 : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let datePart: string;
  if (diff === 0) datePart = de ? "Heute" : "Today";
  else if (diff === -1) datePart = de ? "Gestern" : "Yesterday";
  else if (diff === 1) datePart = de ? "Morgen" : "Tomorrow";
  else {
    const d = +m[3], moo = mon[+m[2] - 1];
    datePart = de ? (d + ". " + moo) : (moo + " " + d);
    if (+m[1] !== today.getFullYear()) datePart += " " + m[1];
  }
  return datePart + " · " + hm;
}

// ── Body-Zugriff: Frontmatter, „# Titel", Beschreibung und Log-Region abtrennen ──
// Body-Layout:  # Titel  →  Beschreibung/Inhalt  →  ###### Log-Überschrift  →  [!log]-Callouts.
// Die (einklappbare) Log-Überschrift gruppiert die Kommentare, damit sie in umgewandelten
// Inhaltsnotizen nicht stören. Sie ist ein fester Marker (nicht lokalisiert), damit splitContent
// die Log-Region zuverlässig erkennt und die Überschrift beim Lesen wieder wegtrennt.
export const LOG_HEADING = "###### BeautyTasks Details-Logbuch";
const isLogHead = (l: string): boolean => /^#{1,6}\s+BeautyTasks Details-Logbuch\s*$/.test(l);

export function splitContent(content: string): { fm: string; title: string; description: string; log: string } {
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)/);
  const fm = fmMatch ? fmMatch[1] : "";
  const body = content.slice(fm.length);
  const lines = body.split("\n");
  const idx = lines.findIndex((l) => /^#\s+/.test(l));           // Titel-Überschrift (nur H1)
  const title = idx === -1 ? "" : lines[idx];
  const rest = idx === -1 ? lines : lines.slice(idx + 1);
  // Log-Region beginnt bei der Log-Überschrift ODER (falls keine da) beim ersten [!log].
  const li = rest.findIndex((l) => isLogHead(l) || /^>\s*\[!log\]/i.test(l));
  const trim = (s: string): string => s.replace(/^\n+|\n+$/g, "");
  const description = trim((li === -1 ? rest : rest.slice(0, li)).join("\n"));
  let logLines = li === -1 ? [] : rest.slice(li);
  if (logLines.length && isLogHead(logLines[0])) logLines = logLines.slice(1);   // Überschrift abtrennen
  const log = trim(logLines.join("\n"));
  return { fm, title, description, log };
}

/** Body neu zusammensetzen: Frontmatter, Titel, Beschreibung/Inhalt, Log-Überschrift, Log. */
export function composeContent(fm: string, title: string, description: string, log: string): string {
  let out = fm + "\n" + title + "\n";
  const desc = description.replace(/^\n+|\n+$/g, "");
  if (desc) out += "\n" + desc + "\n";
  if (log) out += "\n" + LOG_HEADING + "\n\n" + log + "\n";
  return out;
}

/** Log-Einträge einer Aufgaben-Notiz lesen (mtime als Fallback-Zeit für Alt-Inhalt). */
export async function readLog(app: App, file: TFile): Promise<LogEntry[]> {
  const content = await app.vault.cachedRead(file);
  const { log } = splitContent(content);
  return parseDetailLog(log, nowLogTs(new Date(file.stat.mtime)));
}

/** Log-Einträge in den Body schreiben. Verlustfrei: ALLES vor der Log-Region (Frontmatter, Titel,
 *  Inhalt – auch Text vor der ersten Überschrift, den splitContent/composeContent sonst verwerfen)
 *  bleibt unverändert; nur die Log-Region (Überschrift + Callouts) wird neu gesetzt. */
export async function writeLog(app: App, file: TFile, entries: LogEntry[]): Promise<void> {
  await app.vault.process(file, (content) => {
    const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)/);
    const fm = fmMatch ? fmMatch[1] : "";
    const body = content.slice(fm.length);
    const lines = body.split("\n");
    const li = lines.findIndex((l) => isLogHead(l) || /^>\s*\[!log\]/i.test(l));
    const before = (li === -1 ? lines : lines.slice(0, li)).join("\n").replace(/\n+$/, "");
    const logMd = serializeDetailLog(entries);
    return fm + before + (logMd ? "\n\n" + LOG_HEADING + "\n\n" + logMd + "\n" : "\n");
  });
}

/** Beschreibung in den Body schreiben (Frontmatter, Titel, Log bleiben erhalten). */
export async function writeDescription(app: App, file: TFile, description: string): Promise<void> {
  await app.vault.process(file, (content) => {
    const { fm, title, log } = splitContent(content);
    const head = title || "# " + file.basename;
    return composeContent(fm, head, description, log);
  });
}

/** Heuristik: Ist dieser Body-Text ein „Dokument" (eigener Inhalt) statt einer kurzen Beschreibung?
 *  Bilder/Embeds, Überschriften, größere Länge oder mehrere Absätze sprechen für ein Dokument. */
export function isDocumentBody(s: string): boolean {
  const t = (s || "").trim();
  if (!t) return false;
  return /!\[/.test(t)                          // Bild/Embed
    || /^\s{0,3}#{1,6}\s/m.test(t)              // Überschrift
    || t.length > 300                            // längerer Text
    || (t.match(/\n\s*\n/g)?.length ?? 0) >= 2;  // mehrere Absätze
}

/** Idempotent EINEN „Notiz öffnen"-Kommentar (Selbst-Wikilink) an den Log anhängen. Nutzt das
 *  verlustfreie writeLog (Body-Inhalt bleibt vollständig erhalten). Existiert der Selbst-Link schon
 *  irgendwo, passiert nichts. Gibt zurück, ob etwas ergänzt wurde. */
export async function ensureNoteLinkLog(app: App, file: TFile, label: string): Promise<boolean> {
  const content = await app.vault.cachedRead(file);
  const link = "[[" + file.basename + "]]";
  if (content.includes(link)) return false;   // schon vorhanden (Selbst-Link ist sonst untypisch)
  const { log } = splitContent(content);
  const entries = parseDetailLog(log, nowLogTs(new Date(file.stat.mtime)));
  entries.push({ ts: nowLogTs(), body: label + " " + link });
  await writeLog(app, file, entries);
  return true;
}
