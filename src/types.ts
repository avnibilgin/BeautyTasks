// Status-Id: die eingebauten als Literale (für Autocomplete/Guards), plus beliebige
// user-definierte Ids. `(string & {})` hält die Literal-Hinweise, erlaubt aber jeden String.
export type TaskStatus = "todo" | "doing" | "done" | "cancelled" | (string & {});
export type Priority = "highest" | "high" | "medium" | "normal" | "low" | "lowest";

/** Art eines Status – steuert Verhalten (nicht nur die Spalte):
 *  open = aktive Phase · done = terminal (Zeitstempel/Wiederholung/Ausblenden) · cancelled = Papierkorb. */
export type StatusKind = "open" | "done" | "cancelled";

/** Seitenleisten-Sektionen mit sortierbarer Reihenfolge. */
export type NavSection = "projects" | "areas" | "labels" | "filters";
/** Sortiermodus einer Sektion: manuelle Reihenfolge · alphabetisch · nach Aufgabenzahl. */
export type NavSortMode = "manual" | "name" | "count";

/** Gespeicherte Status-Definition (in settings.statuses). Eingebaute nutzen `labelKey` (i18n),
 *  user-definierte `label` (wörtlich). `icon`/`color` optional (sonst Default nach kind). */
export interface StoredStatus {
  id: string;
  labelKey?: string;
  label?: string;
  kind: StatusKind;
  icon?: string;
  color?: string;
}

export interface Task {
  id: string;
  path: string;            // aktueller Datei-Pfad (= Identität in der Map)
  title: string;           // Dateiname
  status: TaskStatus;
  priority: Priority;
  due: string | null;      // YYYY-MM-DD (Datums-Teil; Zeit separat in dueTime)
  dueTime: string | null;  // "HH:mm" oder null (für Kalender/Uhrzeit)
  scheduled: string | null;
  scheduledTime: string | null;
  duration: number | null; // Minuten (Event-Länge), optional
  start: string | null;
  project: string | null;  // aufgelöster Pfad der zugeordneten Liste (Projekt ODER Bereich; Typ lebt an der Liste)
  parent: string | null;   // aufgelöster Pfad der Eltern-Aufgabe
  labels: string[];
  recurrence: string | null;
  recurBasis: "due" | "done";   // Wiederholung ab Fälligkeit (due) oder Erledigung (done)
  reminders: string[];          // rohe Erinnerungs-Strings, siehe reminders.ts ("-30m" | ISO)
  created: string;
  completed: string | null;
  cancelled: string | null;
  externalId: string | null;
}

export interface BeautyTasksSettings {
  itemsFolder: string;
  projectsFolder: string;   // Projekte UND Bereiche liegen hier (Bereich = type:area)
  filtersFolder: string;    // gespeicherte Filter (type: filter) liegen hier
  attachmentsFolder: string;
  knownLabels: string[];   // Register: auch Labels ohne Aufgabe (im Manager angelegt)
  visibleLabels: string[]; // in der Seitenleiste sichtbar geschaltete Labels (Default leer)
  labelColors: Record<string, string>;   // Label-Name -> Farbe (Hex); Labels sind keine Notizen, daher hier
  locale: string;          // "auto" (folgt Obsidian) | "en" (Kanon) | "de"
  showDescriptionInList: boolean;  // Beschreibungs-Vorschau unter dem Titel in Listen
  navCollapsed: Record<string, boolean>;  // ein-/ausgeklappte Nav-Abschnitte (labels/areas/projects)
  startView: string;       // Ansicht beim Öffnen: ViewId ("heute"…) oder "last" (zuletzt benutzte)
  lastView: string;        // zuletzt aktive Ansicht (für startView === "last")
  parseNaturalLanguage: boolean;  // Datum + #Labels automatisch aus dem Aufgabentitel erkennen
  chipsIconsOnly: boolean;         // In der Aufgaben-Maske nur die Chip-Icons zeigen (ohne Text)
  boardLayout: "list" | "board";   // Projekt-/Label-Boards als Liste oder Kanban (Spalten = Status)
  statuses?: StoredStatus[];        // user-definierbare Status (undefined = eingebaute Defaults, siehe statuses.ts)
  pageViewOptions?: Record<string, Partial<import("./filterEngine").ViewOptions>>;   // Anzeige-Optionen für System-Views (key=ViewId) und Labels (key="label:<name>"); Notiz-Seiten speichern im Frontmatter
  navSort?: Record<NavSection, NavSortMode>;    // Sortiermodus je Seitenleisten-Sektion (Default "name")
  navOrder?: Record<NavSection, string[]>;      // manuelle Reihenfolge (Pfade bzw. Label-Namen)
  reminderLastScan: number;        // intern (nicht im UI): Epoch-ms des letzten gefeuerten Reminder-Scans
  didInitialSetup: boolean;        // intern: Erst-Setup (Inbox anlegen) einmalig gelaufen
  lastSeenVersion?: string;        // intern: zuletzt im „Neu"-Modal gezeigte Plugin-Version
}

export const DEFAULT_SETTINGS: BeautyTasksSettings = {
  itemsFolder: "BeautyTasks/Items",
  projectsFolder: "BeautyTasks/Projects",
  filtersFolder: "BeautyTasks/Filters",
  attachmentsFolder: "BeautyTasks/Attachments",
  knownLabels: [],
  visibleLabels: [],
  labelColors: {},
  locale: "auto",
  showDescriptionInList: true,
  navCollapsed: {},
  startView: "heute",
  lastView: "heute",
  parseNaturalLanguage: true,
  chipsIconsOnly: false,
  boardLayout: "list",
  reminderLastScan: 0,
  didInitialSetup: false,
};
