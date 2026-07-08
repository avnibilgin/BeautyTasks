# Umsetzungsplan: „Import from TaskNotes"

## Kontext
TaskNotes (callumalpass) ist der Marktführer und nutzt dieselbe Grundstruktur wie BeautyTasks:
**eine Markdown-Notiz pro Aufgabe mit Frontmatter**. Damit ist eine Migration reines
Frontmatter-Ummappen und ein starker Wachstumshebel (Wechselkosten → nahe null).
Ziel: ein eingebauter, nicht-destruktiver, idempotenter Import.

## Verifiziertes TaskNotes-Schema (Spec v0.2.0)
- Task-Erkennung: Task-Tag, Default `tags: [task]` (konfigurierbar).
- Default-Felder (über FieldMapper konfigurierbar): `title`, `status`, `priority`, `due`,
  `scheduled`, `contexts`, `projects`, `tags`, `timeEstimate`, `timeEntries`, `recurrence`,
  `complete_instances`, `completedDate`, `dateCreated`, `dateModified`, `id`.
- Status/Priorität frei konfigurierbar; „completed" über `status.completed_values`.
- Datum: `date` (`2026-02-20`) oder `datetime` (`2026-01-10T09:30:00Z`).
- Projekte: Liste von Wikilinks.
- Recurrence: iCalendar RRULE (RFC 5545), z. B. `FREQ=WEEKLY;BYDAY=FR`, plus `recurrence_anchor`.
- Quellen: https://tasknotes.dev/core-concepts/ , https://tasknotes.dev/spec/02-model-and-mapping/

## Feld-Mapping → BeautyTasks (`type: task`)
| TaskNotes | BeautyTasks | Hinweis |
|---|---|---|
| `title` | `# Titel` (H1) | BeautyTasks liest Titel aus der Überschrift |
| Body | Beschreibung (Body nach H1) | 1:1 |
| Task-Tag | `type: task` | nur getaggte Notizen importieren |
| `status` | `status` (Registry `statuses.ts`) | Status-Map; `completed_values` → „done" |
| `priority` | `priority` (`FILTER_PRIORITIES`) | Prio-Map; „normal"/Default weglassen |
| `due` / `scheduled` | `due` / `scheduled` | Datum/Datetime direkt (`combineDT`) |
| `contexts` + `tags` | `labels` | zusammenführen, „@" strippen |
| `projects` (Wikilinks) | `project: [[Basename]]` (einer) | erstes = project, Rest → Labels; auto-anlegen |
| `recurrence` (RRULE) | `recurrence` (`"every N unit"`) | nur `FREQ`+`INTERVAL`; Rest → Beschreibung |
| `recurrence_anchor` | `recur_basis` | verschieden → Default „due" |
| `completedDate` | `completed` | für „Erledigt"/Sortierung |
| `dateCreated` | `created` | direkt |
| `id`/Pfad | **`external_id`** | Dedup-Schlüssel (idempotent) |
| `timeEstimate` | `duration` | falls Minuten-kompatibel |

Verlustbehaftet (im Report zeigen): komplexe Recurrence (`BYDAY`/`COUNT`/`UNTIL` → Original-RRULE
in Beschreibung), `timeEntries`, `complete_instances`, `blockedBy`, `reminders` (v1 weglassen).

## Umsetzung
### Neues Modul `src/importTaskNotes.ts`
- `readTaskNotesMapping(app)` — TaskNotes' `data.json` (Field-Mapping + Task-Tag) lesen, sonst Defaults.
- `scanTaskNotes(app, opts)` — Task-Notizen per Tag/Ordner finden, Frontmatter über `metadataCache`.
- `mapRecord(record, mapping, statusMap, prioMap)` — → BeautyTasks-Task-Record inkl. `external_id`.
- `rruleToRecurrence(rrule)` — `FREQ`/`INTERVAL` → `"every N unit"`, sonst `null` + Original in Beschreibung.

### Wiederverwendung `importExport.ts`
Bestehender Import-Writer legt fehlende Projekte/Labels an und dedupliziert über `external_id`.
TaskNotes-Import erzeugt dieselben Task-Records → auf denselben Writer aufsetzen (ggf. minimal
generalisieren: Records rein statt nur JSON-Format).

### UI `ImportTaskNotesModal`
1. Quelle: Task-Tag (Default aus TaskNotes-Settings) oder Ordner.
2. Mapping bestätigen (Feld/Status/Prio) mit Vorbelegung, editierbar.
3. Nicht-destruktiv-Hinweis.
4. Vorschau (X Aufgaben · Y Projekte · Z Labels).
5. Import → Report (importiert / übersprungen / Recurrence-Warnung).

### Einbindung
- Command `import-tasknotes` („Import from TaskNotes").
- Eintrag in Settings-Sektion **„Import & Export"** (analog JSON-Import).

### Prinzipien
Nicht-destruktiv (Kopien), idempotent (`external_id`), Auto-Anlage (Projekte/Labels),
Mapping bestätigen statt raten.

## Verifikation
1. Test-Vault mit ~8 TaskNotes-Aufgaben (Projekt, Contexts/Tags, `due`/`scheduled`, `status`,
   `priority`, `FREQ=WEEKLY`, eine `BYDAY`-Recurrence, eine erledigte mit `completedDate`).
2. Import → Titel als H1, Projekt/Labels, Datumsfelder, Status/Prio, einfache Recurrence übersetzt,
   komplexe als Beschreibungs-Notiz, `completed` gesetzt.
3. Erneut importieren → keine Duplikate (Dedup).
4. Original-TaskNotes-Dateien unverändert.

## Nicht im Scope (v1)
Zwei-Wege-Sync, Bases-Integration, Zeittracking, Abhängigkeiten, pro-Instanz-Recurrence.
