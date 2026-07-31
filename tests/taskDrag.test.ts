import { describe, it, expect, beforeEach } from "vitest";
import { dragTask, dragFromCol, startTaskDrag, endTaskDrag } from "../src/taskDrag";

// Der Zug-Zustand lag bis 1.33 doppelt vor: einmal in heuteView (Liste/Board/Seitenleiste), einmal
// in calendarView. Solange Liste und Kalender nie gleichzeitig sichtbar waren, fiel das nicht auf.
// Mit dem Planungs-Split fällt es sofort auf – der Kalender fragte beim dragover seine eigene,
// leere Variable und wies eine Zeile ab, die er beim Drop hätte verarbeiten können.

describe("taskDrag – EIN Zug für Liste, Board und Kalender", () => {
  beforeEach(() => endTaskDrag());

  it("ohne laufenden Zug meldet sich niemand als Ziel zuständig", () => {
    // Genau diese Abfrage unterscheidet unseren Zug von einem fremden (Datei aus dem Vault).
    expect(dragTask()).toBeNull();
    expect(dragFromCol()).toBeNull();
  });

  it("ein Zug aus der LISTE ist auch für den Kalender sichtbar", () => {
    // Der Kern des Fehlers: derselbe Aufruf, den heuteView macht, muss für calendarView gelten.
    startTaskDrag("Tasks/Umzug planen.md");
    expect(dragTask()).toBe("Tasks/Umzug planen.md");
  });

  it("ohne Spaltenangabe bleibt die Quell-Spalte leer", () => {
    // Liste und Kalender haben keine Spalten. Nur so weiß das Label-Board, dass es beim Drop
    // nichts zu ENTFERNEN gibt (swapTaskLabel überspringt ein leeres „remove").
    startTaskDrag("Tasks/A.md");
    expect(dragFromCol()).toBeNull();
  });

  it("eine Board-Karte bringt ihre Quell-Spalte mit", () => {
    startTaskDrag("Tasks/A.md", "doing");
    expect(dragFromCol()).toBe("doing");
  });

  it("ein neuer Zug erbt KEINE Spalte aus dem vorigen", () => {
    // Der eigentliche Grund, warum startTaskDrag die Spalte immer setzt statt sie wegzulassen:
    // sonst trüge ein Zug aus der Liste die Spalte des letzten Board-Zugs mit sich – und das
    // Label-Board entfernte beim Ablegen ein Label, das mit diesem Zug nie zu tun hatte.
    startTaskDrag("Tasks/A.md", "doing");
    startTaskDrag("Tasks/B.md");
    expect(dragTask()).toBe("Tasks/B.md");
    expect(dragFromCol()).toBeNull();
  });

  it("Ende räumt beides ab – auch wenn der Zug ohne Drop endet", () => {
    startTaskDrag("Tasks/A.md", "doing");
    endTaskDrag();
    expect(dragTask()).toBeNull();
    expect(dragFromCol()).toBeNull();
  });
});
