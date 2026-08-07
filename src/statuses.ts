import { StatusKind, StoredStatus } from "./types";
import { t } from "./i18n";

export type { StatusKind, StoredStatus };

/** Default-Icon je kind, wenn eine Status-Definition kein eigenes `icon` trägt. */
const KIND_ICON: Record<StatusKind, string> = { open: "circle", done: "check-circle", cancelled: "x-circle" };

/** Eingebaute Startaufstellung. Wird verwendet, solange der Nutzer keine eigenen Status
 *  gespeichert hat. Die Ids sind identisch zum bisherigen Modell → keine Task-Migration nötig. */
export const DEFAULT_STATUSES: StoredStatus[] = [
  { id: "todo",      labelKey: "status_todo",      kind: "open",      icon: "circle" },
  { id: "doing",     labelKey: "status_doing",     kind: "open",      icon: "contrast" },
  { id: "done",      labelKey: "status_done",      kind: "done",      icon: "check-circle" },
  { id: "cancelled", labelKey: "status_cancelled", kind: "cancelled", icon: "x-circle" },
];

// ── Lebende Registry ────────────────────────────────────────────────
// Eine einzige Quelle der Wahrheit zur Laufzeit. Von main.loadSettings() und nach jeder
// Status-Änderung über initStatuses() gesetzt; alle Views lesen die Getter unten.
let CURRENT: StoredStatus[] = DEFAULT_STATUSES;
let BY_ID = new Map<string, StoredStatus>(CURRENT.map((s) => [s.id, s]));

export function initStatuses(list?: StoredStatus[] | null): void {
  CURRENT = list && list.length ? list : DEFAULT_STATUSES;
  BY_ID = new Map(CURRENT.map((s) => [s.id, s]));
}

/** Erzwingt die Pflicht-Kategorien des Lebenszyklus: mind. 1 offen, mind. 1 erledigt, mind. 1
 *  abgebrochen. Fehlt eine, wird der eingebaute Default ergänzt (self-healing) – so kann die App
 *  NIE in einen Zustand ohne gültige Kategorie geraten (kein versteckter Sentinel nötig). Reihenfolge
 *  bleibt erhalten; offen/erledigt werden vor dem Papierkorb einsortiert, abgebrochen ans Ende.
 *  Entfernt KEINE vorhandenen Einträge (nicht-destruktiv). */
export function ensureStatusInvariants(list: StoredStatus[] | null | undefined): StoredStatus[] {
  const out = list && list.length ? list.map((s) => ({ ...s })) : DEFAULT_STATUSES.map((s) => ({ ...s }));
  const has = (k: StatusKind): boolean => out.some((s) => s.kind === k);
  const uniqueId = (base: string): string => { let id = base, n = 2; while (out.some((s) => s.id === id)) id = base + "-" + n++; return id; };
  const insertBeforeTrash = (e: StoredStatus): void => {
    const cx = out.findIndex((s) => s.kind === "cancelled");
    if (cx >= 0) out.splice(cx, 0, e); else out.push(e);
  };
  // DEFAULT_STATUSES: [0]=offen, [2]=erledigt, [3]=abgebrochen.
  if (!has("open")) insertBeforeTrash({ ...DEFAULT_STATUSES[0], id: uniqueId(DEFAULT_STATUSES[0].id) });
  if (!has("done")) insertBeforeTrash({ ...DEFAULT_STATUSES[2], id: uniqueId(DEFAULT_STATUSES[2].id) });
  if (!has("cancelled")) out.push({ ...DEFAULT_STATUSES[3], id: uniqueId(DEFAULT_STATUSES[3].id) });
  return out;
}

export const allStatuses = (): StoredStatus[] => CURRENT;
export const statusDef = (id: string): StoredStatus | undefined => BY_ID.get(id);
export const statusIds = (): string[] => CURRENT.map((s) => s.id);
export const isKnownStatus = (id: string): boolean => BY_ID.has(id);

/** Ergebnis der Prüfung eines eingegebenen Frontmatter-Werts. Zwei Ablehnungsgründe getrennt,
 *  weil der Nutzer bei „schon vergeben" etwas anderes tun muss als bei „so nicht schreibbar". */
export type StatusIdCheck = { ok: true; id: string } | { ok: false; reason: "format" | "taken" };

/** Einen eingegebenen Wert auf einen brauchbaren Status-Wert reduzieren – das ist der Text, der
 *  im `status:`-Feld der Notizen landet und den fremde Programme lesen.
 *
 *  Erlaubt ist, was in YAML ohne Anführungszeichen auskommt: Buchstabe voran, dann Buchstaben,
 *  Ziffern, `_` und `-`. Kleingeschrieben wie bei neu angelegten Status (main.addStatus bildet
 *  denselben Slug), damit derselbe Name nicht je nach Weg zwei verschiedene Werte ergibt.
 *
 *  `taken` sind die Werte der ANDEREN Status – der eigene bisherige Wert gehört nicht hinein,
 *  sonst liesse sich eine unveränderte Eingabe nicht bestätigen. Rein: keine Registry, kein
 *  Obsidian, vollständig testbar. */
export function checkStatusId(raw: unknown, taken: readonly string[]): StatusIdCheck {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!/^[a-z][a-z0-9_-]*$/.test(s)) return { ok: false, reason: "format" };
  if (taken.some((x) => x.toLowerCase() === s)) return { ok: false, reason: "taken" };
  return { ok: true, id: s };
}

export const statusLabel = (id: string): string => {
  const d = BY_ID.get(id);
  if (!d) return id;
  return d.labelKey ? t(d.labelKey) : (d.label ?? id);
};
export const statusIcon = (id: string): string => {
  const d = BY_ID.get(id);
  return d?.icon ?? (d ? KIND_ICON[d.kind] : "circle");
};
export const statusColor = (id: string): string | undefined => BY_ID.get(id)?.color;

export const isOpen = (s: string): boolean => BY_ID.get(s)?.kind === "open";
export const isDone = (s: string): boolean => BY_ID.get(s)?.kind === "done";
export const isCancelled = (s: string): boolean => BY_ID.get(s)?.kind === "cancelled";
/** Papierkorb-Erkennung: als „abgebrochen" markierter Status ODER der reservierte Sentinel
 *  "cancelled" – bleibt erkennbar, auch wenn KEIN Status diese Art trägt (robust gegen Umbenennen/
 *  Löschen des Abgebrochen-Status). Überall statt `status === "cancelled"` verwenden. */
export const isTrashed = (s: string): boolean => BY_ID.get(s)?.kind === "cancelled" || s === "cancelled";

/** Board-Spalten = alles außer cancelled (Abbrechen ist Papierkorb), in Definitionsreihenfolge. */
export const boardStatuses = (): StoredStatus[] => CURRENT.filter((s) => s.kind !== "cancelled");

/** Erste offene Phase – Default für neue/zurückgesetzte Aufgaben (Fallback "todo"). */
export const firstOpenStatus = (): string => CURRENT.find((s) => s.kind === "open")?.id ?? "todo";
/** Erster erledigt-Status (Fallback "done"). */
export const firstDoneStatus = (): string => CURRENT.find((s) => s.kind === "done")?.id ?? "done";
/** Erster abgebrochen-Status (Fallback = reservierter Sentinel "cancelled", falls keiner definiert). */
export const firstCancelledStatus = (): string => CURRENT.find((s) => s.kind === "cancelled")?.id ?? "cancelled";

/** Effektive Anzeigefarbe (Board-Punkt · Checkbox · Chip · Editor-Vorschau). Eigene Farbe,
 *  sonst Vorgabe nach Art: erste offene Phase neutral · weitere offen = Akzent · erledigt =
 *  grün · abgebrochen = rot. So sind Defaults stimmig UND jede Farbe im Editor überschreibbar. */
export function statusTint(id: string): string {
  const d = BY_ID.get(id);
  if (d?.color) return d.color;
  if (!d) return "var(--interactive-accent)";
  if (d.kind === "done") return "var(--color-green, #4caf50)";
  if (d.kind === "cancelled") return "var(--color-red, #e05c4a)";
  return id === firstOpenStatus() ? "var(--text-muted)" : "var(--interactive-accent)";
}
