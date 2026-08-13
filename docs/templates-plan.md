# Umsetzungsplan: Vorlagen

## Kontext
Eine Vorlage ist ein **gespeicherter Aufgabenbaum**, der beim Anwenden frische Daten bekommt. Das
unterscheidet sie vom Duplizieren, das bewusst datumsgetreu bleibt: Eine Kopie ist ab Sekunde eins
überfällig, eine Vorlage nicht.

Marktlage (geprüft 2026-08-13): **Asana** speichert je Aufgabe einen geschriebenen Versatz
(„3 Tage vor Projektstart"). **ClickUp** speichert normale Daten und rechnet beim Anwenden auf
einen neuen Anker um. **Todoist** hat Projektvorlagen mit einem Haken „Use relative dates" beim
Speichern. **TickTick** hat echte Aufgaben-Vorlagen, aber ohne Datumslogik. **TaskNotes 4.11.1**
— der direkte Wettbewerber im selben Notiz-pro-Aufgabe-Modell — hat **gar keine** Vorlagen, nur
Notiz-Rümpfe (`body template file`) und `occurrence templates` für Wiederholungen.

## Die zwei tragenden Entscheidungen

### 1. Versatz wird ABGELEITET, nicht geschrieben
Der ClickUp-Weg. Eine Vorlage trägt gewöhnliche Kalenderdaten; beim Anwenden fragt der Dialog nach
**einem** Anker und verschiebt den ganzen Baum um dieselbe Differenz.

Damit entfallen: neues Frontmatter-Feld, neues Chip, neue Schreibweise in der Texterkennung, eigene
Vorlagen-Eingabemaske. Eine Vorlage ist ein gewöhnlicher Aufgabenbaum an einem anderen Ort und wird
mit dem **normalen** Editor gebaut.

Preis, bewusst akzeptiert: „immer am 1. des Monats" ist so nicht ausdrückbar. Dafür gibt es
`recurrence`, das unverändert mitkopiert wird.

### 2. Eigener Typ, zweiter Index
`taskIndex.parse()` hat genau EIN Tor: `fm[fieldKey("type")] !== "task"`. Eine Notiz mit
`type: template` ist damit unsichtbar für Index, Ansichten, Zähler, Filter, Google-Sync und
Erinnerungs-Scan — **ohne dass an einer dieser Stellen eine Ausschlusszeile steht**. Genau solche
Ausschlusszeilen sind die Fehlerquelle (vgl. Papierkorb-Filter im Duplizieren, tote
Filterkriterien).

Damit der normale Editor trotzdem auf Vorlagen arbeiten kann, gibt es **dieselbe Klasse ein
zweites Mal**: `new TaskIndex(app, settings, TEMPLATE_SCOPE)`. Ein Geltungsbereich (`IndexScope`)
bestimmt Typwert und Ordner.

Zwei Gründe, warum `type: task` NICHT ginge:
- Vorlagen wandern über Syncthing aufs Handy, und **TaskForge erkennt Aufgaben an `type: task`** —
  sie stünden dort als echte Aufgaben.
- Mit `showUnfiledInInbox: true` erschiene jede projektlose Vorlage im Eingang.

## Gestalt

Es gibt zwei Arten, weil es zwei Dinge gibt, die einen Baum halten können:

| Art | Wurzel | Anwenden erzeugt |
|---|---|---|
| **Aufgabenvorlage** | eine Aufgabe | eine Aufgabe samt Unterbaum in einem Zielprojekt |
| **Projektvorlage** | ein Projekt | ein Projekt mit allen Bäumen darin |

„Einzelne Aufgaben in ein bestehendes Projekt kippen" ist **kein dritter Typ**, sondern eine Wahl
im Anwenden-Dialog der Projektvorlage: *neues Projekt* oder *in dieses bestehende Projekt*. Im
zweiten Fall entsteht keine Hülle.

## Vault-Layout

```
BeautyTasks/Templates/
├── Urlaub vorbereiten/
│   ├── Urlaub vorbereiten.md     type: template · template_of: task     ← Wurzel
│   ├── Reisepass prüfen.md       type: template · parent: [[Urlaub vorbereiten]]
│   ├── Koffer packen.md          type: template · parent: [[Urlaub vorbereiten]]
│   └── Wohnung übergeben.md      type: template · parent: [[Urlaub vorbereiten]]
└── Website-Relaunch/
    ├── Website-Relaunch.md       type: template · template_of: project  ← Wurzel
    └── …
```

**Ein Unterordner je Vorlage ist nicht Ordnungssinn, sondern nötig.** Verweise gehen über den
Basenamen, und Vorlagen wiederholen generische Schritte („Prüfen", „Abnahme"). Flach in einem Topf
zeigte `parent: [[Prüfen]]` irgendwann auf die falsche Vorlage. Obsidian löst Wikilinks bevorzugt
im eigenen Ordner auf — der Unterordner beseitigt die Zweideutigkeit, statt sie zu verwalten.

`template_of` steht nur an der Wurzel; die Kinder brauchen es nicht.

## Was beim Anwenden mitkommt

| Feld | Verhalten |
|---|---|
| Titel, Beschreibung, Priorität, Labels, Dauer | 1:1 |
| Baumstruktur (`parent`), `sort_order` | 1:1 (frische Lücken, s. duplicateSubtree) |
| `recurrence`, `recur_basis` | 1:1 |
| `due`, `scheduled` | **verschoben** (templatePlan.ts) |
| Erinnerungen, relativ (`-30m`) | 1:1 — hängen ohnehin an der Fälligkeit |
| Erinnerungen, absolut (ISO) | **verschoben** um dieselbe Differenz |
| `status` | **immer** erster offener Status (wie beim Duplizieren) |
| `id`, `created`, `completed`, `cancelled`, `external_id` | frisch bzw. leer |
| `gcal_event_id`, `gcal_calendar_id` | **nie** — sonst zeigten zwei Aufgaben auf einen Termin |

## Umsetzung

### Stufe 0 — Fundament ✅
- `types.ts`: `templatesFolder` (Default `BeautyTasks/Templates`)
- `fieldNames.ts`: `ENTITY_VALUES` um `"template"` erweitert — **sonst ließe ein Wechsel des
  `type`-Feldnamens die Vorlagen zurück** und sie würden lautlos unsichtbar
- `taskIndex.ts`: `IndexScope` / `TASK_SCOPE` / `TEMPLATE_SCOPE`, `isExcluded` → `inScope`
- `main.ts`: zweite Instanz `plugin.templates`
- `format.ts`: `addDays` (Gegenstück zu `dayOffset`, mit Schranke gegen unlesbare Daten)
- `templatePlan.ts`: `templateSpan` / `templateShift` / `shiftReminder` / `planTemplateDates` —
  rein und ohne Obsidian-Bezug, 22 Tests

### Stufe 1 — Aufgabenvorlagen
- `templateService.ts`: „Als Vorlage speichern" (= `duplicateSubtree` mit anderem Zielordner und
  anderem Typwert), „Vorlage anwenden" (Plan + `duplicateSubtree` ins Ziel)
- Anwenden-Dialog: Zielprojekt + Anker (`Start am` / `Fertig bis`)
- Seitenleisten-Sektion „Vorlagen" (eine Zeile je Vorlage, Zahl = entstehende Aufgaben)
- Vorlagenseite = bestehende Projektseite, auf `plugin.templates` gezeigt
- `TaskModal` / `SubtaskList`: Index als Konstruktor-Argument (Vorgabe `plugin.index`)
- Kontextmenü, Befehle, i18n (10 Sprachen, `i18nCoverage.test.ts` erzwingt Vollständigkeit)

### Stufe 2 — Projektvorlagen ✅
Dieselbe Maschinerie eine Ebene höher, plus die Wahl „neues Projekt" / „bestehendes Projekt".

**Der eine Kniff:** Im Vault gehört eine Aufgabe über `project: [[Name]]` zu ihrem Projekt, nicht
über `parent`. In der Vorlage wäre das eine Sackgasse — `descendants()` läuft über `parent`, ohne
diese Kette fände weder die Grössenangabe noch das Anwenden eine einzige Aufgabe. Deshalb:

- **Beim Speichern** hängen die Projektaufgaben unter die Vorlagen-Wurzel (`roots` in
  `DuplicateOpts` ersetzt die erste Ebene, weil die Projektnotiz keine „Kinder" hat).
- **Beim Anwenden** löst `detachTop` die direkte Ebene wieder von der Wurzel: Sie wird zum
  PROJEKT, nicht zu einer Aufgabe, die die anderen tragen könnte. Tiefere Ebenen bleiben
  Unteraufgaben.

Beides gilt ausdrücklich nur für die erste Ebene und wird aus den Optionen der Rekursion
herausgenommen.

Die Zahl an der Vorlage zählt bei einer Projektvorlage die Wurzel NICHT mit — sie wird ja ein
Projekt und keine Aufgabe.

## Bewusst NICHT

- **Verknüpfte Vorlagen**, die ihre Instanzen nachträglich mitändern. Kopien sind unabhängig.
- **Galerie mit Teilen-Link** (Todoist). Eine Vorlage ist eine `.md`-Datei — teilen heißt, den
  Ordner zu schicken. Obsidian-nativ und umsonst.
- **Platzhalter** wie `{{title}}`. Templaters Revier.
- **Geschriebene Versätze je Aufgabe** (Asana). Siehe Entscheidung 1.
- **Schalter „Wochentage beibehalten"**. Entweder stimmt der eingegebene Anker genau, oder die
  Wochentage bleiben — beides zugleich geht nicht. Ein Schalter, der das eingegebene Datum
  stillschweigend um bis zu drei Tage verschiebt, verwirrt mehr, als er nützt. Nachrüstbar, falls
  das Problem im Alltag auftritt.

## Verifikation
1. Vorlagenordner mit zwei Vorlagen anlegen; prüfen, dass in Heute/Demnächst/Kalender/Eingang und
   in den Zählern **nichts** davon auftaucht.
2. Google-Sync aktiv: prüfen, dass keine Vorlage als Termin gepusht wird.
3. Erinnerungs-Scan: prüfen, dass keine Vorlage feuert.
4. `type`-Feldnamen wechseln und prüfen, dass die Vorlagen mitwandern.
5. Vorlage mit absoluter Erinnerung anwenden; Erinnerung muss in der Zukunft liegen.
6. Vorlage über einen Sommerzeitwechsel hinweg anwenden (März → Juni); Abstände müssen ganztägig
   bleiben.
