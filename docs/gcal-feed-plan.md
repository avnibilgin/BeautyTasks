# Umsetzungsplan: „Google-Termine in BeautyTasks anzeigen" (Feed / Overlay)

## Kontext und Abgrenzung
Der bestehende Sync (`gcalSync.ts`, siehe [gcal-sync-plan.md](gcal-sync-plan.md)) spiegelt **Aufgaben →
Google** und zurück. Dieses Feature ist die andere Richtung, aber **kein Sync**: fremde Termine
(Zahnarzt, Meetings, Geburtstage) sollen im Kalender-Layout und in „Heute" **sichtbar** sein, damit
man neben den Aufgaben sieht, wieviel Tag überhaupt noch übrig ist.

Es ist damit eine **Anzeige-Schicht**, keine Abgleich-Schicht: read-only, flüchtig, ohne Identität im
Vault. Beides in `gcalSync.ts` zu mischen wäre der erste und teuerste Fehler — die Engine dort ist
Wahrheit über *Aufgaben-Zustand*, der Feed ist Wahrheit über *nichts* (er zeigt nur, was Google sagt).
Deshalb eine eigene Datei, eigene Settings, eigener Lebenszyklus.

## Die tragende Regel: ein Termin wird nie eine Aufgabe
Keine Notiz, kein `type: task`, kein Frontmatter, nichts im `TaskIndex`. Termine leben ausschließlich
im Speicher-Cache von `gcalFeed.ts` und werden von den Views gezeichnet.

Das ist nicht Geschmack, sondern in dieser Codebasis zwingend:
- **Rückkopplung.** `isEligible()` (`gcalSync.ts:443`) prüft nur `due` + Status. Ein als Notiz
  importierter Termin wäre eine ganz normale berechtigte Aufgabe → `pushAll()` legt dafür ein
  **zweites Event** an → der nächste Pull sieht es → Schleife, die den echten Kalender vollschreibt.
- **Vault-Müll.** Jeder Termin eine Datei, jede Wiederholung viele Dateien; in Google gelöscht =
  Leiche im Vault, die jemand aufräumen muss.
- **Privates.** Termintitel wandern in einen ggf. synchronisierten/geteilten Vault.
- **Löschen ist kaputt.** Der Sync definiert „Existenz ist Obsidian-gesteuert" — für fremde Termine
  gilt exakt das Gegenteil (Google ist die Wahrheit). Zwei Regeln in einem Datenmodell geht nicht auf.

Das ist der etablierte Ansatz: Termine sind ein separater Layer über der Aufgabenliste, nie Teil von ihr.

## Verbindung: geteilt, aber entkoppelt
`gcalAuth.ts` und der Setup-Assistent bleiben unverändert — der Scope enthält **bereits**
`calendar.readonly` (`gcalAuth.ts:29`), also **kein neuer Scope, kein erneutes Autorisieren**.

Getrennte Schalter über derselben Verbindung:
| Schalter | Bedeutung |
|---|---|
| `gcal.enabled` | Aufgaben **nach** Google spiegeln (Sync, wie bisher) |
| `gcalFeed.enabled` | Termine **aus** Google anzeigen (neu) |

Beide sind unabhängig: „nur anzeigen, nichts schreiben" ist ein legitimer (und für viele der einzig
gewünschte) Zustand. Der Feed braucht nur `gcalAuth.isConnected()`, nicht `canSync()`.

## Datenmodell
### Im Speicher (die einzige Darstellung)
```ts
export interface CalEvent {
  id: string;            // Google-Event-Id (nur für Cache/Keys, nie im Vault)
  calendarId: string;
  title: string;
  start: string;         // "YYYY-MM-DD" (ganztägig) oder "YYYY-MM-DDTHH:mm" (lokal)
  end: string;
  allDay: boolean;
  color: string;         // aus calendarList.backgroundColor
  htmlLink: string;      // Klick -> in Google öffnen
  location?: string;
}
```
Kein `Task`-Feld, keine gemeinsame Basisklasse mit `Task`. Wer beide Typen mischt, landet über kurz
oder lang wieder bei „Termin abhaken".

### Settings (`settings.gcalFeed`, eigenes Unter-Objekt neben `settings.gcal`)
| Feld | Zweck |
|---|---|
| `enabled` | Termine anzeigen an/aus (Default **aus**) |
| `calendars: Record<calId, boolean>` | welche Kalender sichtbar sind |
| `hideDeclined` | abgelehnte Einladungen ausblenden (Default an) |
| `snapshot` | letzter Fensterstand für den Kaltstart (siehe unten), gedeckelt |

Beim ersten Aktivieren: **primärer Kalender an**, alle anderen aus — und der eigene
`BeautyTasks`-Kalender (`gcal.calendarId`) **hart ausgeschlossen**, nicht nur ungehakt. Sonst steht
jede datierte Aufgabe doppelt da: einmal als Aufgabe, einmal als ihr eigenes gepushtes Event. Das ist
der Fehler, der beim ersten Blick sofort auffällt, wenn man ihn nicht bewusst verhindert.

## Holen (`src/gcalFeed.ts`)
### Fenster statt syncToken — bewusst anders als der Pull
`events.list` erlaubt **kein** `syncToken` zusammen mit `timeMin`/`timeMax`. Der Sync-Pull nutzt
Tokens, weil er nur die eigenen Events (`privateExtendedProperty`) betrachtet — eine kleine Menge.
Der Feed müsste dafür **den ganzen Kalender spiegeln**, inklusive der Termine von 2019. Deshalb hier
das Fenster-Verfahren:

```
GET /calendars/{id}/events
  ?timeMin=…&timeMax=…&singleEvents=true&orderBy=startTime&maxResults=2500
```
- **`singleEvents=true`** lässt Google die Wiederholungen serverseitig auflösen — kein RRULE-Expandieren
  im Plugin (das wäre der teuerste und fehleranfälligste Teil; `recurrence.ts` bleibt unberührt).
- **Fenster** = sichtbarer Zeitraum, **auf Monatsgrenzen gerundet** ± 7 Tage Rand. Gerundet, damit
  Blättern innerhalb eines Monats den Cache trifft statt bei jedem Klick neu zu laden.
- **ETag**: Antwort-ETag merken, Folge-Anfragen mit `If-None-Match` → Google antwortet `304` ohne Body.
  Das ist der eigentliche Effizienz-Hebel: das ruhige Intervall kostet dann fast nichts.
- Wiederverwendung: `api()` aus `gcalSync.ts` (Auth + Backoff) wird exportiert und geteilt, damit es
  genau **einen** Ort für 403/429/5xx-Behandlung gibt. Zusätzlicher Parameter für Response-Header
  (ETag) nötig — kleine, saubere Erweiterung, keine Kopie.

### Cache und Kaltstart
- Speicher: `Map<calendarId|windowKey, { etag: string; events: CalEvent[] }>`.
- **Snapshot** des aktuellen Fensters in `data.json` (**entschieden 2026-07-17: ja, mit Titeln**),
  damit die Ansicht beim Öffnen **sofort** gefüllt ist und offline nicht leer wirkt (Muster aller
  ernsthaften Kalender-Clients). Gedeckelt auf ~500 Events, damit `data.json` nicht wächst.
  Termintitel liegen damit unverschlüsselt in `data.json` — dieselbe Lage wie die Tokens heute,
  gehört also in denselben Settings-Hinweis.

### Wann aktualisiert wird
- beim Öffnen der View und bei jedem Fensterwechsel (Blättern), sofern nicht im Cache,
- ruhiges Intervall (5 Min, wie `POLL_MS`) **nur wenn** eine BeautyTasks-Leaf sichtbar ist —
  ein Hintergrundtimer für eine Ansicht, die niemand ansieht, ist verschwendete Quota und Akku,
- bei `active-leaf-change` auf eine BeautyTasks-Leaf, wenn der letzte Lauf älter als 5 Min ist.
- Kein Timer, wenn `gcalFeed.enabled` aus ist. `window.setInterval`/`setTimeout` (Skill-Regel 30).

### Filtern
Raus fliegen: `status: "cancelled"`, eigener Sync-Kalender, abgelehnte Einladungen
(`attendees[].self && responseStatus === "declined"`, wenn `hideDeclined`). Alles andere wird gezeigt
— auch „frei"/`transparency`-Termine (Geburtstage), die gehören dazu.

### Mehrtägige Termine
Ein Termin von Mi–Fr muss auf **jedem** Tag erscheinen, geklemmt auf den jeweiligen Tag; ein
Zeit-Termin über Mitternacht ebenso. `bucketByDue()` kann das nicht (es kennt nur einen Tag pro
Aufgabe) — der Feed bekommt dafür eine eigene, reine Funktion `bucketEvents(events, days)` in
`calendarModel.ts`, per Vitest abgedeckt. Das ist der Punkt, an dem naive Umsetzungen sichtbar brechen.

## Zeichnen
### `calendarModel.ts` — `layoutDay` generisch machen
Heute ist `TimedBlock = { task: Task; … }` (`calendarModel.ts:91`). Damit Aufgaben **und** Termine
einander im Zeitraster ausweichen (die ehrliche Variante: ein Meeting von 10–11 schiebt den
Aufgabenblock zur Seite), wird das Verfahren auf ein minimales Interface gehoben:

```ts
interface Slot { startMin: number; endMin: number; }
function layoutSlots<T extends Slot>(items: T[]): (T & { col: number; cols: number })[]
```
`layoutDay(tasks)` bleibt als dünner Aufruf darüber bestehen (Tests laufen unverändert weiter), der
Kalender ruft die generische Variante mit der Vereinigung aus Aufgabenblöcken und Terminblöcken auf.
Die Cluster-Logik selbst wird **nicht** angefasst.

### `calendarView.ts` — Termin-Block
**Leitbild (Nutzer-Entscheidung 2026-07-17, per Screenshot-Vorgabe):** Aufgabe und Termin unterscheiden
sich durch die **Fläche**, nicht durch die Farbe:

| | Aufgabe (heute schon) | Termin (neu) |
|---|---|---|
| Fläche | **gefüllt**, Pastellton | **neutral/transparent** (Hintergrundfarbe der Ansicht) |
| Kante | — | **kräftiger Balken links** in Kalenderfarbe |
| Titel | unterstrichen, mit Abhak-Kreis | schlicht, **kein Kreis** |

Das ist bewusst die **Umkehrung** meines ersten Vorschlags („gefüllte Fläche in Kalenderfarbe"): der
gefüllte Block ist in deinem Kalender bereits die Sprache der *Aufgabe* — ein zweiter gefüllter Block
daneben wäre nur eine weitere Farbe, kein anderer Gegenstand. Leer + Farbbalken liest sich auf einen
Blick als „gehört nicht mir, ist nur belegt".

- **Woche/Tag**: Termine als `.bt-calview-ev` im selben Raster (teilen sich per `layoutSlots` die
  Breite mit Aufgabenblöcken), **kein `renderCheck`**, **kein Drag**, **kein Resize-Griff**.
  Ganztägige Termine in die bestehende Ganztägig-Zeile.
- **Monat**: Termine als Chips mit Farbpunkt, **mitgezählt** in `chipsThatFit`/`shownChips` — sonst
  rechnet die Zelle mit der falschen Zahl und das „+N weitere" schneidet ab.
- **Jahr**: v1 unberührt.
- Klick → Termin in Google öffnen (`htmlLink`). Hover → bestehendes `popover.ts` mit Zeit, Kalender,
  Ort. Kein Kontextmenü in v1.
- Das inkrementelle Nachzeichnen (`tryPatchCalendar`) muss die Termin-Menge in seinen Kontext-Vergleich
  aufnehmen, sonst zeigt es nach einem Feed-Refresh veraltete Termine. Sicherheitsnetz-Prinzip der
  Datei: im Zweifel voll neu bauen.

### Liste (`heuteView.ts`) — schmales Band, kein eigener Abschnitt
**Korrektur meines ersten Vorschlags** (Nutzer-Entscheidung 2026-07-17, per Screenshot-Vorgabe): Es
gibt **keinen** Abschnitt „Termine". Der Termin ist eine **einzeilige, volle Breite füllende Zeile**
in der Tagesgruppe selbst:

```
Aug 21 · Heute · Donnerstag
│ 9–10 Uhr  1:1 mit Ana                                    ← Termin: ein Band, kein Kreis
◯ Admin work
  10:15–11:15
◯ Follow up with designer
```
Ein Band, dezent hinterlegt, Farbbalken links, **Uhrzeit vor dem Titel** in einer Zeile, kein
Abhak-Kreis, keine Meta-Zeile. Es steht **an seiner chronologischen Stelle** zwischen den Aufgaben,
nicht in einem eigenen Block.

Meine Sorge („zwei Ordnungen in einer Liste") löst sich eleganter, als ich sie zunächst umgehen wollte: das
Band ist so offensichtlich kein Listeneintrag, dass es die Sortierung gar nicht erst beansprucht — es
markiert eine Uhrzeit, keine Reihenfolge. Bleibt die **Regel für den Fall, dass die Liste nicht nach
Zeit sortiert** (`opts.sort` = Priorität, Titel, …): dann steht das Band **oben in der Gruppe**,
chronologisch untereinander, vor der ersten Aufgabe. Eine Zeitmarke zwischen alphabetisch sortierten
Aufgaben wäre sinnlos.

Leerzustand (`heuteView.ts:109`): Sind keine Aufgaben, aber Termine da, wäre ein großes „Nichts für
heute" glatt gelogen. Regel: Bänder zuerst rendern, `emptyState` nur noch, wenn *beide* Mengen leer
sind; sonst ein gedämpfter Einzeiler statt der großen Leerfläche.

### „Demnächst" — **in v1 dabei** (Nutzer-Entscheidung 2026-07-17)
Dieselben Bänder in den Tagesgruppen von `upcomingByDate()` — dieselbe Funktion, dieselbe Regel wie in
„Heute", nur über mehrere Tage. Das Abrufsfenster deckt die Zukunft ohnehin ab, es entsteht kein
zusätzlicher Request. Damit ist „Demnächst" die Wochenplanungs-Fläche: sichtbar, welcher Tag schon
belegt ist, bevor man ihm Aufgaben zuschiebt.

## Einstellungen (UI)
Nach dem Verbunden-Kopf, **vor** „Erweitert", drei Zeilen im bestehenden Stil — erscheint nur, wenn
verbunden:
```
 Termine aus Google anzeigen                             [ ]
   ● Privat (avni.bilgin@gmail.com)                      [✔]
   ● Familie                                             [ ]
   ● Feiertage in Deutschland                            [ ]
   Abgelehnte Termine ausblenden                         [✔]
```
Farbpunkt = Kalenderfarbe aus `calendarList` (dieselbe Farbe wie im Raster — die Verbindung muss ohne
Erklärung sichtbar sein). Kalenderliste kommt aus `listCalendars()`, das es schon gibt; der eigene
`BeautyTasks`-Kalender taucht gar nicht erst auf. Imperativer Tab wie bisher
([[beautytasks-settings-declarative-api]]).

## Fehler- und Status-UX
Der Feed ist **still**. Keine Notices — ein fehlgeschlagener Termin-Abruf ist kein Ereignis, das eine
Meldung wert wäre.
- **Stale-while-error**: bei Fehlern die zuletzt geholten Termine weiter zeigen, nicht leeren.
- Anhaltender Fehler → gedämpfte Zeile im Kalenderkopf („Termine konnten nicht geladen werden"),
  sonst nichts.
- Token weg/entzogen → derselbe Weg wie beim Sync (Statusleiste rot, eine Notice, Settings zeigt
  „Erneut verbinden"). Die Statusleiste bleibt **Sync-Anzeige** und bekommt keinen Feed-Zustand
  aufgepfropft; sie meldet nur den geteilten Verbindungsfehler.

## Neue/berührte Dateien
- `src/gcalFeed.ts` (neu) — Fenster-Fetch, ETag-Cache, Snapshot, Filter, `onChange`-Emitter
  (dünne Abonnenten wie bei `gcalSync.ts`).
- `src/gcalSync.ts` — `api()` exportieren + Response-Header durchreichen; sonst **unverändert**.
- `src/calendarModel.ts` — `layoutSlots` (generisch), `bucketEvents` (mehrtägig/Mitternacht).
- `src/calendarView.ts` — Termin-Blöcke Woche/Tag, Termin-Chips Monat, Chip-Fit, Patch-Kontext.
- `src/heuteView.ts` — Termin-Band in den Tagesgruppen von „Heute" **und** „Demnächst", Leerzustands-Regel.
- `src/settingsTab.ts` — Feed-Block + Kalenderliste mit Farbpunkten.
- `src/types.ts` — `gcalFeed?: GCalFeedSettings`.
- `src/main.ts` — Feed aufbauen, `register(() => feed.stop())`, Leaf-Sichtbarkeit verdrahten.
- `src/i18n.ts` — neue Strings (10 Sprachen, Key-Parität).
- `styles.css` — `.bt-calview-ev` (neutrale Fläche + Farbbalken links), Termin-Chip, Termin-Band der
  Liste (kein Build nötig).
- Tests (Vitest) — `layoutSlots` (Misch-Cluster Aufgabe/Termin), `bucketEvents` (mehrtägig,
  Mitternacht, Ganztags-Ende-exklusiv).

## Verifikation
1. **Anzeige**: Termin in Google anlegen → erscheint in Woche/Tag/Monat sowie als Band in den Listen
   von „Heute" und „Demnächst".
2. **Kein Doppel**: eigener BeautyTasks-Kalender taucht nirgends als Termin auf.
3. **Mehrtägig**: Ganztags-Termin Mi–Fr steht auf allen drei Tagen; Termin 23:00–01:00 auf beiden.
4. **Überlappung**: Meeting 10–11 + Aufgabenblock 10:30 → teilen sich die Breite, nichts liegt übereinander.
5. **Read-only**: Termin lässt sich nicht abhaken, nicht ziehen, nicht in der Größe ändern; Klick öffnet Google.
   Optisch auf einen Blick von einer Aufgabe unterscheidbar (leere Fläche + Farbbalken vs. gefüllter Block).
6. **Sortierung**: Liste auf „nach Priorität" umstellen → Bänder rutschen an den Kopf der Tagesgruppe,
   stehen dort chronologisch.
7. **Effizienz**: zweiter Refresh ohne Änderung = `304`, kein Neuzeichnen; Blättern im Monat = 0 Requests.
8. **Kaltstart**: Obsidian neu starten → Termine stehen sofort da (Snapshot), kein leeres Blitzen.
9. **Kein Sync-Einfluss**: `lastSynced`/`gcal_event_id` bleiben unberührt; ein Sync-Lauf nach Feed-Nutzung
   erzeugt **0** Schreibzugriffe (Idempotenz-Test aus dem Sync-Plan wiederholen).
10. **Offline/Fehler**: Netz aus → zuletzt geholte Termine bleiben stehen, keine Notice, keine Fehlerschleife.
11. **Aus = aus**: `gcalFeed.enabled = false` → kein Timer, kein Request (im Netzwerk-Log prüfen).
12. **Blast-Radius**: Test-Vault + Zweit-Account; kein einziger Schreib-Request auf fremde Kalender
    (Requests im Log auf `GET` prüfen).

## Nicht im Scope (v1)
Termine **bearbeiten** (Ziehen, Anlegen, Löschen — bräuchte Schreibrechte auf fremden Kalendern, also
genau den großen Blast-Radius, den der Sync-Plan bewusst meidet), „Aufgabe aus Termin erstellen",
Event-eigene Farben (`colorId` statt Kalenderfarbe), Jahresansicht, Frei/Gebucht-Zeiten für
Terminvorschläge, andere Anbieter (ICS/CalDAV/Outlook).

## Branch
Gebaut wird auf **eigenem Branch `feat/gcal-feed`** (ab `main`), damit `main` jederzeit trivial
wiederherstellbar bleibt — dasselbe Vorgehen wie bei `feat/gcal-sync` (1.11.0). Merge nach `main`
erst nach dem Praxistest, per `--no-ff`.
