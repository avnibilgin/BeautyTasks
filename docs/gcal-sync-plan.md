Ist# Umsetzungsplan: „Google Kalender – Zwei-Wege-Sync" (Alternative B)

## Kontext
BeautyTasks ist **eine Markdown-Notiz pro Aufgabe mit Frontmatter** (`type: task`, gelesen über
`TaskIndex`/`metadataCache`) — dasselbe Modell wie TaskNotes. Die Event-Identität gehört daher in
die **Notiz** (Frontmatter), nicht ins Google-Event. Ziel: nativer, plattformübergreifender
Zwei-Wege-Sync **ohne** externe Python/systemd-Abhängigkeit (ersetzt das alte Sidecar-Script).

Ausgeliefert wird in zwei Stufen: **A = Push-only** (Obsidian → Google), danach **B = A + Pull +
Konfliktlogik**. A ist vorwärtskompatibel, weil die Event-ID ab Tag 1 im Frontmatter liegt →
kein Wegwerf-Code.

## Datenmodell (neue Frontmatter-Felder pro Aufgabe)
| Feld | Zweck |
|---|---|
| `gcal_event_id` | Google-Event-ID – Anker Aufgabe ↔ Event (an der **Aufgabe**) |
| `gcal_calendar_id` | Ziel-Kalender (erlaubt späteren Kalenderwechsel/Multi-Kalender) |
| `gcal_sync: false` | **an der Projekt-/Bereich-Notiz** – schließt die Liste vom Sync aus (Default = an) |

`external_id` **nicht** wiederverwenden (belegt durch Import-Dedup, `importTaskNotes.ts:159`).
Schreiben/Löschen dieser Felder ausschließlich über `app.fileManager.processFrontMatter` — Obsidian
besitzt die Datei, keine atomic-write/Regex-Akrobatik nötig (anders als das alte Script).

Plugin-weiter State in `data.json` (nicht pro Notiz):
- `gcalTokens` — Refresh-/Access-Token (+ Ablauf).
- `gcalSyncTokens: Record<calendarId, nextSyncToken>` — für inkrementellen Pull.
- `gcalLastSynced: Record<taskId, {due, status}>` — letzter Stand je Aufgabe (3-Wege-Basis).

## Task ↔ Event-Mapping
| BeautyTasks | Google-Event | Hinweis |
|---|---|---|
| `# Titel` (H1) | `summary` | via `TaskIndex` (`cache.headings[0]`) |
| `due` + `dueTime` (+ `duration`) | `start`/`end` | mit `dueTime` → `dateTime` (Zeitblock, `duration` Min., Default 60); ohne → `date` (Ganztags) |
| `status` (Registry) | — | `isDone` → Event bleibt (optional `transparency`/`colorId`); Papierkorb → Event löschen |
| `reminders` (`resolveReminders`) | `reminders.overrides` | rel/abs → Popup-Minuten; `reminders.ts` ist die einzige Wahrheit |
| `recurrence` + `recur_basis` | `recurrence: [RRULE]` | v1: nur `FREQ`+`INTERVAL` (Umkehr von `rruleToRecurrence`); komplexe zurückgestellt |
| `gcal_event_id` | `event.id` | Anker |
| `id` (Task) | `extendedProperties.private.btTaskId` | Rück-Zuordnung beim Pull, überlebt Umbenennen |

Zeitzone aus `moment.tz`/Obsidian-Locale; Default `Europe/Berlin`, in Settings überschreibbar.

## OAuth (`src/gcalAuth.ts`)
Nutzer legt **eigenen** OAuth-Client an (kein Secret im Plugin; Anleitung = bestehender Leitfaden
Abschnitt 2 → in Settings verlinken/einbetten). Zwei Flows nach `Platform.isMobile`:
- **Desktop:** Loopback-Server (`http` aus Electron) auf `127.0.0.1:<port>` + **PKCE**
  (`code_challenge`), `redirect_uri` = Loopback. Kein Secret.
- **Mobile:** **Device-Code-Flow** (`oauth2.googleapis.com/device/code`) – Code am Zweitgerät.

Alle HTTP-Calls über **`requestUrl`** (nicht `fetch` – CORS/Origin). Scopes:
`https://www.googleapis.com/auth/calendar.events`. Token-Refresh transparent vor jedem Lauf;
Revoke-Command zum Abmelden. Token in `data.json` (Hinweis in Settings: unverschlüsselt).

## Sync-Engine (`src/gcalSync.ts`)
### Push (Stufe A)
- Abo auf `TaskIndex.subscribe()` (bereits 50 ms entprellt) → zusätzlicher Debounce ~2 s.
- Pro geänderter Aufgabe: kein `gcal_event_id` → `events.insert`; vorhanden → `events.patch`;
  Papierkorb/gelöscht → `events.delete`. Ergebnis-ID via `processFrontMatter` zurückschreiben.
- Trigger-Schalter wie TaskNotes: `syncOnCreate/Update/Complete/Delete` (Settings).
- Datierte Aufgaben ohne Datum werden **nicht** exportiert (bzw. bestehendes Event gelöscht).

### Pull (Stufe B)
- Pro Kalender `events.list(syncToken=…, singleEvents=true, showDeleted=true)`; leerer/abgelaufener
  Token → einmaliger Voll-Pull, `nextSyncToken` speichern.
- Nur Events mit `extendedProperties.private.btTaskId` betrachten (Fremd-Events ignorieren).
- Änderung an `due`/`dueTime`/`status` → über `processFrontMatter` in die Notiz zurück.
- In Google gelöschtes Event (`status:cancelled`): `gcal_event_id` aus der Notiz entfernen
  (Aufgabe bleibt) — Existenz ist **Obsidian-gesteuert**.

### Konfliktlogik (3-Wege, aus altem Script übernommen)
Pro Aufgabe drei Werte: Obsidian jetzt · Google jetzt · `gcalLastSynced` (letzter Stand).

| Obsidian geändert? | Google geändert? | Aktion |
|---|---|---|
| ja | nein | Google patchen |
| nein | ja | in Notiz zurückschreiben |
| ja | ja | **Obsidian gewinnt** + `Notice`-Warnung |
| nein | nein | nichts |

Zusätzlich: manueller Command „Jetzt synchronisieren" + optionaler Intervall-Timer
(`window.setInterval`, Skill-Regel 30 beachten). Einzellauf-Flag gegen Überlappung.

## User Experience & UI
Leitprinzip: **die Standard-Oberfläche ist winzig, Tiefe steckt hinter „Erweitert".**
Progressive Offenlegung — vor dem Verbinden sieht der Nutzer genau *einen* Knopf; Optionen erscheinen
erst nach erfolgreicher Verbindung. Kein Toggle-Wall.

### 1. Onboarding — geführter Setup-Assistent (Entscheidung: eigene Credentials)
Inline in der Settings-Sektion, nicht als Modal-Wand. Drei Schritte, jeder erst sichtbar wenn der
vorige erledigt ist:
1. **Google-Zugang anlegen** — Button „Anleitung öffnen" (öffnet den bestehenden Leitfaden bzw. eine
   gekürzte In-App-Fassung). Klartext, kein Jargon außerhalb dieses Schritts.
2. **Zugangsdaten einfügen** — zwei Felder Client-ID / Client-Secret (Desktop) mit Inline-Hilfe
   („findest du unter … → JSON"). Auf Mobile: nur Client-ID (Device-Code-Flow).
3. **Autorisieren** — Button startet Loopback- (Desktop) bzw. Device-Code-Flow (Mobile).
Nach Erfolg klappt der Assistent zu und wird durch den Verbunden-Zustand ersetzt.

### 2. Verbunden-Zustand (Status-Kopf)
```
Google Kalender
 ● Verbunden als avni.bilgin@gmail.com            [ Abmelden ]
 Zuletzt synchronisiert: vor 2 Min                [ Jetzt synchronisieren ]
 ──────────────────────────────────────────────────────────────
 Ziel-Kalender                    [ BeautyTasks ▾ ]
 Aufgaben mit Datum synchronisieren                      [✔]
 Automatisch synchronisieren                             [✔]
 ▸ Erweitert
     Synchronisieren bei   Erstellen ✔  Ändern ✔  Erledigen ✔  Löschen ✔
     Standard-Termindauer             [ 60 Min ]
     Bei Konflikten benachrichtigen   [ ]
     Anzeige in der Statusleiste      [✔]
     Zeitzone                         [ Europe/Berlin ]
```
Die **Standardfläche = 3 Zeilen** (Kalender, ein Toggle, Auto-Sync). Alles Feinkörnige unter
„Erweitert" (zugeklappt). Imperativer Settings-Tab (minAppVersion, siehe
[[beautytasks-settings-declarative-api]]).

### 3. Ziel-Kalender — eigener „BeautyTasks"-Kalender (kleiner Blast-Radius)
Beim ersten Verbinden Default = eigener Kalender „BeautyTasks" (anlegen falls fehlt), nicht der
Hauptkalender — ein Bug kann so nie den privaten Kalender beschädigen. Dropdown aus
`calendarList.list` erlaubt jeden anderen + „＋ Kalender ‚BeautyTasks' anlegen".

### 4. Sync-Umfang — global an, pro Liste ausschließbar (Entscheidung)
- Globaler Toggle „Aufgaben mit Datum synchronisieren" = **an**.
- Ausschluss pro Projekt/Bereich über das **bestehende Kontextmenü** (`navMenu.ts`): Eintrag
  „Aus Kalender-Sync ausschließen" ↔ „In Kalender-Sync aufnehmen" → setzt `gcal_sync: false` im
  Listen-Frontmatter. Keine neue UI-Fläche, reine Wiederverwendung.
- Ausgeschlossene Listen: dezentes `calendar-off`-Icon (muted) am Sidebar-Eintrag, sonst nichts.

### 5. Aufgaben-Indikator (wiederverwendetes Muster)
Aufgaben mit `gcal_event_id` zeigen in der Meta-Zeile ein kleines `calendar-check`-Icon — **genau die
Behandlung wie der vorhandene `alarm-clock`-Reminder-Indikator** (`.bt-remind`), muted, Tooltip „Im
Google Kalender · <Kalendername>". Visuell konsistent mit der bestehenden Chip-Sprache, nie aufdringlich.

### 6. Hintergrund-Feedback — Statusleiste statt Notices
Ein unaufdringliches `addStatusBarItem`: `calendar`-Icon im Ruhezustand, animiertes Pünktchen beim
Synchronisieren, roter Punkt bei Fehler; Klick → Settings. **Notices nur für Ereignisse, nicht für
Routine**: (a) erste Verbindung erfolgreich, (b) Verbindung unterbrochen → neu verbinden,
(c) optional aggregierte Konflikt-Meldung. Kein Notice pro Sync-Lauf (nervt).

### 7. Konflikt- & Fehler-UX
- **Konflikt**: still „Obsidian gewinnt". Höchstens *eine* gebündelte, entprellte Notice
  („3 Konflikte gelöst — Obsidian-Werte behalten"), nur wenn „Bei Konflikten benachrichtigen" an
  (Default aus). Nie Spam pro Aufgabe.
- **Token abgelaufen/entzogen**: Statusleiste rot, *eine* Notice „Google-Verbindung unterbrochen",
  Settings zeigt „Erneut verbinden". Sync pausiert still bis zur Reparatur (keine Fehlerschleife).

### 8. Ton & Copy
Deutsch, ruhig, jargonfrei in der Standardfläche („Verbinden", „Zuletzt synchronisiert",
„Aus Kalender-Sync ausschließen"). Technische Begriffe (Client-ID etc.) nur im Assistenten, dort mit
Klartext-Hilfe. Alle Strings über `i18n.ts` (10 Sprachen, Key-Parität wie bestehend).

### Code-Sauberkeit (Konsequenz für die Architektur)
Die Engine (`gcalSync.ts`) ist **UI-agnostisch** und einzige Wahrheit über den Sync-Zustand; sie
*emittiert* Status-Events (`idle`/`syncing`/`error`/`lastSyncedAt`). Settings-Kopf und Statusleiste
sind **dünne Abonnenten** — dasselbe Prinzip wie `reminders.ts` („einzige Wahrheit, dünne
Konsumenten"). So bleibt UI austauschbar und testbar, ohne Netz-/Auth-Logik zu berühren.

## Neue/berührte Dateien
- `src/gcalAuth.ts` (neu) — OAuth + Token, `requestUrl`.
- `src/gcalSync.ts` (neu) — Mapping, Push, Pull, Reconcile, `gcalApi`-Wrapper mit Backoff (aus altem
  `_ex()` übernehmen: 403/429 + „quota/rate" → exponentielles Warten).
- `src/reminders.ts` — nur konsumiert (`resolveReminders`), unverändert.
- `src/main.ts` — Engine verdrahten (onLayoutReady), Commands, `TaskIndex`-Abo, `addStatusBarItem`.
- `src/settingsTab.ts` — Setup-Assistent + Verbunden-Kopf + „Erweitert"-Block (imperativ).
- `src/types.ts` — Settings-Felder (Trigger, Auto-Sync, Dauer, Zeitzone, Statusleiste, Konflikt-Notice).
- `src/navMenu.ts` — Kontextmenü-Eintrag „Aus Kalender-Sync ausschließen/aufnehmen" (`gcal_sync`).
- `src/heuteView.ts` — Aufgaben-Indikator (`calendar-check`, Muster von `.bt-remind`); `calendar-off`
  am ausgeschlossenen Sidebar-Eintrag.
- `src/i18n.ts` — neue Strings (10 Sprachen, Key-Parität).
- `src/recurrence.ts` — Umkehrfunktion `recurrenceToRrule` (Gegenstück zu `rruleToRecurrence`).
- `styles.css` — `.bt-gcal`-Indikator, Statusleisten-Zustände, Assistent-Layout (kein Build nötig).

## Verifikation
1. **Auth**: Desktop-Loopback + Mobile-Device-Code je einmal; Token-Refresh nach Ablauf.
2. **Push**: Aufgabe mit `dueTime`+`duration` → Zeitblock; ohne → Ganztags; `reminders` → Popups;
   erledigt/Papierkorb → Event-Verhalten korrekt.
3. **Pull**: Event in Google verschoben → `due`/`dueTime` in Notiz angepasst; Event gelöscht →
   `gcal_event_id` entfernt, Aufgabe bleibt.
4. **Konflikt**: beidseitig geändert → Obsidian gewinnt + Warnung.
5. **Idempotenz**: zweiter Lauf ohne Änderung = 0 API-Schreibzugriffe (dank `gcalLastSynced`).
6. **Blast-Radius**: eigener Test-Kalender + Wegwerf-Vault; Fremd-Events unberührt (btTaskId-Filter).

## Nicht im Scope (v1 von B)
Pro-Instanz-Recurrence-Exceptions (`googleCalendarException*`-Äquivalent), Outlook/CalDAV,
Multi-Kalender-Routing pro Projekt, `watch`/Push-Notifications (Polling reicht bei dieser Eventzahl).
