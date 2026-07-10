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

export const allStatuses = (): StoredStatus[] => CURRENT;
export const statusDef = (id: string): StoredStatus | undefined => BY_ID.get(id);
export const statusIds = (): string[] => CURRENT.map((s) => s.id);
export const isKnownStatus = (id: string): boolean => BY_ID.has(id);

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
