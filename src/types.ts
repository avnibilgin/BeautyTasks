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
  title: string;           // aufgelöst über die Titel-Kaskade (s. taskTitle.ts)
  titleInFm: boolean;      // Titel steht im Frontmatter (statt in der H1) – damit Kopien es halten wie das Original
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
  /** Handreihenfolge unter den GESCHWISTERN (gleicher Parent bzw. beide ohne). `null` = noch nie
   *  von Hand einsortiert; solche Aufgaben stehen hinten, damit neu Angelegtes unten landet.
   *  Verglichen wird nie diese Zahl allein, sondern die Kette von der Wurzel – s. TaskIndex.orderKey. */
  sortOrder: number | null;
  created: string;
  completed: string | null;
  cancelled: string | null;
  externalId: string | null;
}

/**
 * Das Datum, an dem eine Aufgabe in den Zeit-Ansichten steht (Heute, Demnächst, Kalender):
 * die Fälligkeit – und wenn es keine gibt, die Deadline. Ohne Plan IST die Frist der Plan.
 * `null` = die Aufgabe hat dort keinen Platz (Eingang/Projekt).
 *
 * Steht hier und nicht in filterEngine, weil auch calendarModel sie braucht und ein Import
 * dorthin einen Zyklus ergäbe (filterEngine holt sich CalMode von dort). Die vollständige Regel
 * samt Überfälligkeit ist bei den Prädikaten in filterEngine dokumentiert.
 */
export const agendaDate = (t: Task): string | null => t.due ?? t.scheduled;
/** Die Uhrzeit zum agendaDate – aus dem Feld, das das Datum liefert. */
export const agendaTime = (t: Task): string | null => (t.due ? t.dueTime : t.scheduledTime);

/**
 * Ein Termin aus einem verbundenen Google-Kalender. **Reine Anzeige-Schicht**: ein CalEvent wird
 * NIE eine Notiz, steht NIE im TaskIndex und hat kein Frontmatter — sonst würde `pushAll()` es als
 * berechtigte Aufgabe ansehen und ein zweites Event dafür anlegen (Rückkopplung). Siehe
 * `docs/gcal-feed-plan.md`. Lebensdauer: Speicher-Cache in gcalFeed.ts (+ geräte-lokaler Snapshot).
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

/** Vom Nutzer einzeln überschreibbare Meta-Farben (leer = Theme-Default). accent=--bt-accent,
 *  Datum: overdue/today/d1/d2/week/far=--bt-dist-*, Icons: recur/remind/sched/label/comments/subs/
 *  parent/backlink=--bt-c-*. Angewandt als Body-CSS-Variablen (main.applyColors). */
export type MetaColorKey =
  | "accent" | "overdue" | "today" | "d1" | "d2" | "week" | "far"
  | "recur" | "remind" | "sched" | "label" | "comments" | "subs" | "parent" | "backlink";

/**
 * ══ Wo gehört ein Wert hin? ══════════════════════════════════════════════════
 * Die Frage ist NICHT „Notiz oder Einstellungen", sondern:
 *
 *   Beschreibt der Wert den VAULT (wie soll diese Seite gelesen werden?)
 *   oder das GERÄT (wo bin ich gerade, was habe ich eingeklappt?)
 *
 * ► VAULT-EBENE — soll synchronisieren:
 *     Existiert zur Seite eine Notiz (Projekt, Bereich, gespeicherter Filter),
 *     dann ins FRONTMATTER – Obsidian-nativ und rename-sicher (s. pageOptions.ts).
 *     Sonst (System-Ansichten, Labels) hierher, in die Einstellungen.
 *     Beispiele: layout, sort, group, showDone, Filterkriterien, navOrder, navSort.
 *
 * ► GERÄTE-EBENE — darf NICHT synchronisieren:
 *     In den lokalen Speicher (DeviceState, s. unten). Ein Handy und ein Desktop
 *     teilen sich weder ihre Bildschirmaufteilung noch ihren letzten Standort.
 *
 * ► BILDSCHIRMABHÄNGIG — gar nicht speichern:
 *     Beim ZEICHNEN entscheiden, nicht beim Speichern. Vorbild ist chipsCompact()
 *     in chips.ts: Der Kompakt-Modus hing früher an der Installation und wanderte
 *     per Sync aufs falsche Gerät. Das Gerät ist keine Eigenschaft des Vaults.
 *
 * Neue Felder bitte vorher einsortieren – die Aufteilung ist eine Regel, keine
 * Geschmacksfrage.
 * ═════════════════════════════════════════════════════════════════════════════
 */
export interface BeautyTasksSettings {
  itemsFolder: string;
  projectsFolder: string;   // Projekte UND Bereiche liegen hier (Bereich = type:area)
  filtersFolder: string;    // gespeicherte Filter (type: filter) liegen hier
  attachmentsFolder: string;
  knownLabels: string[];   // Register: auch Labels ohne Aufgabe (im Manager angelegt)
  visibleLabels: string[]; // in der Seitenleiste sichtbar geschaltete Labels (Default leer)
  labelColors: Record<string, string>;   // Label-Name -> Farbe (Hex); Labels sind keine Notizen, daher hier
  locale: string;          // "auto" (folgt Obsidian) | "en" (Kanon) | "de"
  fontTaskPct: number;     // Skalierung Aufgabentext in % (100 = Standardgröße, wie ohne Anpassung)
  fontNavPct: number;      // Skalierung Seitenleisten-Einträge in % (100 = Standard)
  fontHeadingPct: number;  // Skalierung Sektionsüberschriften der Seitenleiste in % (100 = Standard)
  fontSectionPct: number;  // Skalierung Datums-/Abschnittsüberschriften in den Listen in % (100 = Standard)
  showDescriptionInList: boolean;  // Beschreibungs-Vorschau unter dem Titel in Listen
  showProjectDescription: boolean; // Beschreibung unter dem Seitentitel von Projekt/Bereich/Filter
  metaTheme: "minimalisdo" | "colorado" | "user";  // Meta-Farbstil: Minimalisdo (grau) / Colorado (farbig) / User (eigene Farben aus metaColors)
  metaColors: Partial<Record<MetaColorKey, string>>;   // einzeln überschreibbare Meta-Farben (s. MetaColorKey)
  startView: string;       // Ansicht beim Öffnen: ViewId ("heute"…) oder "last" (zuletzt benutzte).
                           // Die WAHL ist Vault-Ebene; welche Ansicht zuletzt offen war, nicht
                           // (DeviceState.lastView).
  parseNaturalLanguage: boolean;  // Datum + #Labels automatisch aus dem Aufgabentitel erkennen
  showUnfiledInInbox: boolean;    // projektlose offene Aufgaben (auch handgeschriebene type:task-Notizen) im Eingang zeigen
  excludeFolders: string[];       // Ordner-Präfixe: Notizen darin gelten NIE als Aufgabe (Schutz vor fremden type:task-Notizen)
  fieldNames?: Partial<Record<import("./fieldNames").FieldId, string>>;   // eigene Namen für `type`/`title` (s. fieldNames.ts)
  chipsIconsOnly: boolean;         // In der Aufgaben-Maske nur die Chip-Icons zeigen (ohne Text)
  chipProfiles?: Partial<Record<ChipSurface, ChipProfile>>;   // Chip-Konfiguration je Fläche (Editor/Schnelleingabe)
  boardLayout: "list" | "board";   // Projekt-/Label-Boards als Liste oder Kanban (Spalten = Status)
  boardColumnOrder?: Record<string, string[]>;   // manuelle Kanban-Spalten-Reihenfolge je Gruppierung (status/label/project); board-eigen, entkoppelt von der Sidebar
  statuses?: StoredStatus[];        // user-definierbare Status (undefined = eingebaute Defaults, siehe statuses.ts)
  pageViewOptions?: Record<string, Partial<import("./filterEngine").ViewOptions>>;   // Anzeige-Optionen für System-Views (key=ViewId) und Labels (key="label:<name>"); Notiz-Seiten speichern im Frontmatter
  pageFilters?: Record<string, Record<string, unknown>>;   // Ansichtsfilter derselben Seiten (gleiche Schlüssel); serialisiert wie im Frontmatter (s. pageOptions.writeCriteria), damit beide Speicherorte EIN Format haben
  navSort?: Record<NavSection, NavSortMode>;    // Sortiermodus je Seitenleisten-Sektion (Default "name")
  navOrder?: Record<NavSection, string[]>;      // manuelle Reihenfolge (Pfade bzw. Label-Namen)
  didInitialSetup: boolean;        // intern: Erst-Setup-Marker (bestehender Nutzer?) – KEINE Migration, entscheidet nur, ob das „Neu"-Modal erscheinen darf
  schemaVersion?: number;          // intern: Stand der Einmal-Migrationen, s. schema.ts (ersetzt die drei did*-Marker unten)
  // Die folgenden drei Marker sind ABGELÖST von `schemaVersion` und werden nur noch MITgeschrieben,
  // damit ältere Builds im Umlauf ihre Migrationen nicht für ungelaufen halten (s. schema.ts).
  // Neuer Code liest sie nicht mehr – außer beim einmaligen Ableiten des Stands.
  didDescriptionMigration?: boolean;  // intern: Migration „Beschreibung ins Frontmatter" einmalig gelaufen
  didInboxRemoval?: boolean;       // intern: Migration „Inbox-Notiz entfernt" einmalig gelaufen
  didTitleMigration?: boolean;     // intern: Migration „Titel einfrieren" einmalig gelaufen (s. taskTitle.ts)
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
  fontNavPct: 100,
  fontHeadingPct: 100,
  fontSectionPct: 100,
  showDescriptionInList: true,
  showProjectDescription: true,
  metaTheme: "minimalisdo",
  metaColors: {},
  startView: "heute",
  parseNaturalLanguage: true,
  showUnfiledInInbox: true,
  excludeFolders: [],
  chipsIconsOnly: false,
  boardLayout: "list",
  didInitialSetup: false,
};

/**
 * Geräte-Zustand. Liegt im lokalen Speicher (app.saveLocalStorage), NICHT in data.json –
 * siehe die Regel an BeautyTasksSettings. Ein Objekt unter EINEM Schlüssel, damit nicht für
 * jeden Wert ein eigener Eintrag entsteht.
 *
 * Alles hier ist entbehrlich: Geht es verloren, startet das Gerät mit aufgeklappter
 * Seitenleiste und der eingestellten Startansicht. Nichts davon ist Nutzerinhalt.
 */
export interface DeviceState {
  navCollapsed: Record<string, boolean>;  // ein-/ausgeklappte Nav-Abschnitte (labels/areas/projects)
  lastView: string;                       // zuletzt aktive Ansicht (nur für startView === "last")
  reminderLastScan: number;               // Epoch-ms des letzten gefeuerten Reminder-Scans
}

export const DEFAULT_DEVICE_STATE: DeviceState = { navCollapsed: {}, lastView: "heute", reminderLastScan: 0 };
