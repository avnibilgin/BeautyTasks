// Status-Id: die eingebauten als Literale (für Autocomplete/Guards), plus beliebige
// user-definierte Ids. `(string & {})` hält die Literal-Hinweise, erlaubt aber jeden String.
export type TaskStatus = "todo" | "doing" | "done" | "cancelled" | (string & {});
export type Priority = "highest" | "high" | "medium" | "normal" | "low" | "lowest";

/** Attribut-Chips in den Eingabe-Modalen (Schnelleingabe + voller Editor). Reihenfolge und
 *  Sichtbarkeit sind über die Einstellungen konfigurierbar (chipOrder/chipTiers). */
export type ChipId = "status" | "due" | "priority" | "label" | "recurrence" | "deadline" | "reminder" | "parent" | "details";
/** Sichtbarkeits-Stufe eines Chips:
 *  shown   = immer in der Chip-Leiste (leer = Add-Icon, gesetzt = Wert)
 *  onValue = nur sichtbar, sobald ein Wert gesetzt ist; leer nur über „+ Weitere Aktionen"
 *  hidden  = nie in der Leiste (auch mit Wert nicht) – setzen/ändern nur über „+ Weitere Aktionen". */
export type ChipTier = "shown" | "onValue" | "hidden";
/** Die zwei Eingabe-Flächen mit je EIGENER Chip-Konfiguration (getrennte Profile). */
export type ChipSurface = "editor" | "quickAdd";
/** Chip-Konfiguration einer Fläche: Reihenfolge + Sichtbarkeits-Stufe je Chip. */
export interface ChipProfile { order?: ChipId[]; tiers?: Partial<Record<ChipId, ChipTier>>; }
/** Kanonische Reihenfolge (= bisheriges Render-Verhalten). Fehlt ein Chip in profile.order,
 *  wird er hier ergänzt; fehlt sein Tier, gilt "shown" (nichts ändert sich per Default). */
export const CHIP_IDS: ChipId[] = ["status", "due", "priority", "label", "recurrence", "deadline", "reminder", "parent", "details"];

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
  description: string;          // kurzer Zusatztext, im Frontmatter (`description`); NICHT der Notiz-Body
  recurrence: string | null;
  recurBasis: "due" | "done";   // Wiederholung ab Fälligkeit (due) oder Erledigung (done)
  reminders: string[];          // rohe Erinnerungs-Strings, siehe reminders.ts ("-30m" | ISO)
  created: string;
  completed: string | null;
  cancelled: string | null;
  externalId: string | null;
}

/**
 * Ein Termin aus einem verbundenen Google-Kalender. **Reine Anzeige-Schicht**: ein CalEvent wird
 * NIE eine Notiz, steht NIE im TaskIndex und hat kein Frontmatter — sonst würde `pushAll()` es als
 * berechtigte Aufgabe ansehen und ein zweites Event dafür anlegen (Rückkopplung). Siehe
 * `docs/gcal-feed-plan.md`. Lebensdauer: Speicher-Cache in gcalFeed.ts (+ Snapshot in data.json).
 */
export interface CalEvent {
  id: string;
  calendarId: string;
  title: string;
  start: string;        // "YYYY-MM-DD" (ganztägig) oder "YYYY-MM-DDTHH:mm" (lokale Zeit)
  end: string;          // exklusiv (Google-Semantik: Ganztags-Ende = Folgetag)
  allDay: boolean;
  color: string;        // Kalenderfarbe (backgroundColor aus calendarList)
  htmlLink: string;     // Klick -> in Google öffnen
  location?: string;
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
  fontTaskPct: number;     // Schriftgröße Aufgabentext, % von Obsidians Textgröße (--font-text-size)
  fontNavPct: number;      // Schriftgröße Seitenleisten-Einträge, % von Obsidians Textgröße
  fontHeadingPct: number;  // Schriftgröße Sektionsüberschriften der Seitenleiste, % von Obsidians Textgröße
  showDescriptionInList: boolean;  // Beschreibungs-Vorschau unter dem Titel in Listen
  navCollapsed: Record<string, boolean>;  // ein-/ausgeklappte Nav-Abschnitte (labels/areas/projects)
  startView: string;       // Ansicht beim Öffnen: ViewId ("heute"…) oder "last" (zuletzt benutzte)
  lastView: string;        // zuletzt aktive Ansicht (für startView === "last")
  parseNaturalLanguage: boolean;  // Datum + #Labels automatisch aus dem Aufgabentitel erkennen
  showUnfiledInInbox: boolean;    // projektlose offene Aufgaben (auch handgeschriebene type:task-Notizen) im Eingang zeigen
  excludeFolders: string[];       // Ordner-Präfixe: Notizen darin gelten NIE als Aufgabe (Schutz vor fremden type:task-Notizen)
  chipsIconsOnly: boolean;         // In der Aufgaben-Maske nur die Chip-Icons zeigen (ohne Text)
  chipProfiles?: Partial<Record<ChipSurface, ChipProfile>>;   // Chip-Konfiguration je Fläche (Editor/Schnelleingabe)
  boardLayout: "list" | "board";   // Projekt-/Label-Boards als Liste oder Kanban (Spalten = Status)
  boardColumnOrder?: Record<string, string[]>;   // manuelle Kanban-Spalten-Reihenfolge je Gruppierung (status/label/project); board-eigen, entkoppelt von der Sidebar
  statuses?: StoredStatus[];        // user-definierbare Status (undefined = eingebaute Defaults, siehe statuses.ts)
  pageViewOptions?: Record<string, Partial<import("./filterEngine").ViewOptions>>;   // Anzeige-Optionen für System-Views (key=ViewId) und Labels (key="label:<name>"); Notiz-Seiten speichern im Frontmatter
  navSort?: Record<NavSection, NavSortMode>;    // Sortiermodus je Seitenleisten-Sektion (Default "name")
  navOrder?: Record<NavSection, string[]>;      // manuelle Reihenfolge (Pfade bzw. Label-Namen)
  reminderLastScan: number;        // intern (nicht im UI): Epoch-ms des letzten gefeuerten Reminder-Scans
  didInitialSetup: boolean;        // intern: Erst-Setup-Marker (bestehender Nutzer?)
  didDescriptionMigration?: boolean;  // intern: Migration „Beschreibung ins Frontmatter" einmalig gelaufen
  didInboxRemoval?: boolean;       // intern: Migration „Inbox-Notiz entfernt" einmalig gelaufen
  lastSeenVersion?: string;        // intern: zuletzt im „Neu"-Modal gezeigte Plugin-Version
  gcal?: import("./gcalSync").GCalSyncSettings;   // Google-Kalender-Sync (undefined = nie eingerichtet)
  gcalFeed?: import("./gcalFeed").GCalFeedSettings;   // Google-Termine ANZEIGEN (read-only, getrennt vom Sync)
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
  fontTaskPct: 100,
  fontNavPct: 90,
  fontHeadingPct: 68,
  showDescriptionInList: true,
  navCollapsed: {},
  startView: "heute",
  lastView: "heute",
  parseNaturalLanguage: true,
  showUnfiledInInbox: true,
  excludeFolders: [],
  chipsIconsOnly: false,
  boardLayout: "list",
  reminderLastScan: 0,
  didInitialSetup: false,
};
