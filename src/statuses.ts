import { TaskStatus } from "./types";
import { t } from "./i18n";

/** Art eines Status – steuert Verhalten (nicht nur die Spalte):
 *  open      = aktive Arbeitsphase (wie todo/doing), erscheint in Sammelansichten
 *  done      = terminal, setzt `completed`-Stempel, treibt Wiederholung, wird ausgeblendet
 *  cancelled = terminal, Papierkorb (`cancelled`-Stempel), aus Reminders/Listen raus */
export type StatusKind = "open" | "done" | "cancelled";

export interface StatusDef {
  id: TaskStatus;
  labelKey: string;   // i18n-Schlüssel (Locale-Wechsel zur Laufzeit möglich)
  kind: StatusKind;
}

/** Zentrale Status-Registry = einzige Wahrheit über Status im Plugin.
 *  Reihenfolge = Reihenfolge der Kanban-Spalten. ROADMAP (siehe memory
 *  beautytasks-kanban-board): künftig um user-definierte Status erweiterbar –
 *  dank dieser Registry + der Prädikate unten ohne Umbau der Views. */
export const STATUSES: StatusDef[] = [
  { id: "todo",      labelKey: "status_todo",      kind: "open" },
  { id: "doing",     labelKey: "status_doing",     kind: "open" },
  { id: "done",      labelKey: "status_done",      kind: "done" },
  { id: "cancelled", labelKey: "status_cancelled", kind: "cancelled" },
];

/** Menü-/Popover-Icons je Status – bewusst gleiche Bildsprache wie die Checkbox:
 *  leerer Kreis (todo) · halb gefüllt (doing = `contrast`, wie `.bt-check.is-doing`) ·
 *  Kreis mit Haken (done) · Kreis mit × (cancelled). */
export const STATUS_ICON: Record<TaskStatus, string> = {
  todo: "circle",
  doing: "contrast",
  done: "check-circle",
  cancelled: "x-circle",
};

const BY_ID = new Map<string, StatusDef>(STATUSES.map((s) => [s.id, s]));

export const statusDef = (id: string): StatusDef | undefined => BY_ID.get(id);
export const statusLabel = (id: string): string => { const d = BY_ID.get(id); return d ? t(d.labelKey) : id; };
export const statusIds = (): TaskStatus[] => STATUSES.map((s) => s.id);

export const isOpen = (s: string): boolean => BY_ID.get(s)?.kind === "open";
export const isDone = (s: string): boolean => BY_ID.get(s)?.kind === "done";
export const isCancelled = (s: string): boolean => BY_ID.get(s)?.kind === "cancelled";

/** Spalten des Kanban-Boards (v1): offene + erledigt. `cancelled` bleibt draußen –
 *  Abbrechen ist der Papierkorb, keine Arbeitsphase. */
export const BOARD_STATUSES: StatusDef[] = STATUSES.filter((s) => s.kind !== "cancelled");
