export type TaskStatus = "todo" | "doing" | "done" | "cancelled";
export type Priority = "highest" | "high" | "medium" | "normal" | "low" | "lowest";

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
  project: string | null;  // aufgelöster Pfad der Projekt-Notiz
  area: string | null;
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
  projectsFolder: string;
  areasFolder: string;
  attachmentsFolder: string;
  knownLabels: string[];   // Register: auch Labels ohne Aufgabe (im Manager angelegt)
  visibleLabels: string[]; // in der Seitenleiste sichtbar geschaltete Labels (Default leer)
  locale: string;          // "auto" (folgt Obsidian) | "en" (Kanon) | "de"
  showDescriptionInList: boolean;  // Beschreibungs-Vorschau unter dem Titel in Listen
  navCollapsed: Record<string, boolean>;  // ein-/ausgeklappte Nav-Abschnitte (labels/areas/projects)
  startView: string;       // Ansicht beim Öffnen: ViewId ("heute"…) oder "last" (zuletzt benutzte)
  lastView: string;        // zuletzt aktive Ansicht (für startView === "last")
  parseNaturalLanguage: boolean;  // Datum + #Labels automatisch aus dem Aufgabentitel erkennen
  chipsIconsOnly: boolean;         // In der Aufgaben-Maske nur die Chip-Icons zeigen (ohne Text)
  reminderLastScan: number;        // intern (nicht im UI): Epoch-ms des letzten gefeuerten Reminder-Scans
}

export const DEFAULT_SETTINGS: BeautyTasksSettings = {
  itemsFolder: "BeautyTasks/Items",
  projectsFolder: "BeautyTasks/Projects",
  areasFolder: "BeautyTasks/Areas",
  attachmentsFolder: "BeautyTasks/Attachments",
  knownLabels: [],
  visibleLabels: [],
  locale: "auto",
  showDescriptionInList: true,
  navCollapsed: {},
  startView: "heute",
  lastView: "heute",
  parseNaturalLanguage: true,
  chipsIconsOnly: false,
  reminderLastScan: 0,
};
