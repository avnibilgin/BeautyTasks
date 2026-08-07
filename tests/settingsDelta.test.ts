import { describe, it, expect } from "vitest";
import { toDelta, applyDefaults, deepEqual, EFFECTIVE_DEFAULTS } from "../src/settingsDelta";
import { DEFAULT_STATUSES } from "../src/statuses";
import { BeautyTasksSettings } from "../src/types";

/** Wie eine Einstellung im Betrieb aussieht: Standardwerte, darüber die Datei. */
const geladen = (datei: Record<string, unknown>): BeautyTasksSettings =>
  applyDefaults(datei as Partial<BeautyTasksSettings>);

describe("deepEqual", () => {
  it("vergleicht Werte, nicht Verweise", () => {
    expect(deepEqual({ a: 1, b: [2, 3] }, { a: 1, b: [2, 3] })).toBe(true);
    expect(deepEqual([{ x: 1 }], [{ x: 2 }])).toBe(false);
  });

  it("Reihenfolge zählt in Listen, nicht in Objekten", () => {
    expect(deepEqual([1, 2], [2, 1])).toBe(false);
    expect(deepEqual({ a: 1, b: 2 }, { b: 2, a: 1 })).toBe(true);
  });

  it("unterscheidet fehlende von gesetzten Schlüsseln", () => {
    expect(deepEqual({ a: 1 }, { a: 1, b: undefined })).toBe(false);
    expect(deepEqual({}, [])).toBe(false);
    expect(deepEqual(null, {})).toBe(false);
  });
});

describe("toDelta – was in der Datei landet", () => {
  it("lässt weg, was dem Standard gleicht", () => {
    const d = toDelta(geladen({}));
    expect(d.startView).toBeUndefined();
    expect(d.fontTaskPct).toBeUndefined();
    expect(d.itemsFolder).toBeUndefined();
    expect(d.statuses).toBeUndefined();
    expect(d.fieldNames).toBeUndefined();
  });

  it("behält, was abweicht", () => {
    const d = toDelta(geladen({ fontTaskPct: 130, startPage: { kind: "view", key: "demnaechst" } }));
    expect(d.fontTaskPct).toBe(130);
    expect(d.startPage).toEqual({ kind: "view", key: "demnaechst" });
  });

  it("lässt die Startseite weg, wenn sie der Vorgabe entspricht", () => {
    expect(toDelta(geladen({ startPage: { kind: "view", key: "heute" } })).startPage).toBeUndefined();
  });

  it("behält alles, wofür es gar keinen Standard gibt – das ist immer Nutzerinhalt", () => {
    const d = toDelta(geladen({
      schemaVersion: 3, didInitialSetup: true, lastSeenVersion: "1.37.2",
      pageViewOptions: { heute: { layout: "list" } },
      gcal: { enabled: true } as never,
    }));
    expect(d.schemaVersion).toBe(3);
    expect(d.lastSeenVersion).toBe("1.37.2");
    expect(d.pageViewOptions).toEqual({ heute: { layout: "list" } });
    expect(d.gcal).toEqual({ enabled: true });
  });

  it("schreibt kein undefined", () => {
    const s = geladen({});
    (s as unknown as Record<string, unknown>).metaTheme = undefined;
    expect(Object.prototype.hasOwnProperty.call(toDelta(s), "metaTheme")).toBe(false);
  });

  it("erkennt eine unveränderte Statusliste auch als Kopie – sonst bliebe der größte Block liegen", () => {
    const kopie = DEFAULT_STATUSES.map((s) => ({ ...s }));
    expect(toDelta(geladen({ statuses: kopie })).statuses).toBeUndefined();
  });

  it("behält eine bearbeitete Statusliste vollständig", () => {
    const eigen = DEFAULT_STATUSES.map((s) => ({ ...s }));
    eigen[0] = { ...eigen[0], label: "Offen (eigen)" } as never;
    const d = toDelta(geladen({ statuses: eigen }));
    expect(d.statuses).toEqual(eigen);
  });

  it("behält geänderte Feldnamen, lässt die Standardnamen weg", () => {
    // Vollstaendige Tabelle, wie sie nach dem Laden immer vorliegt: loadSettings setzt
    // `fieldNames = allFieldNames()` direkt nach initFieldNames. Eine luekenhafte Tabelle aus einer
    // alten data.json erreicht toDelta also nie.
    expect(toDelta(geladen({ fieldNames: { type: "type", title: "title", labels: "labels" } })).fieldNames).toBeUndefined();
    expect(toDelta(geladen({ fieldNames: { type: "art", title: "title", labels: "tags" } })).fieldNames)
      .toEqual({ type: "art", title: "title", labels: "tags" });
  });
});

describe("abgeschaffte Schlüssel", () => {
  it("boardLayout verschwindet beim Laden und wird nie wieder geschrieben", () => {
    const s = geladen({ boardLayout: "board" } as Record<string, unknown>);
    expect((s as unknown as Record<string, unknown>).boardLayout).toBeUndefined();
    expect(Object.prototype.hasOwnProperty.call(toDelta(s), "boardLayout")).toBe(false);
  });

  it("und auch dann nicht, wenn er trotzdem noch in den Einstellungen steckt", () => {
    const s = geladen({});
    (s as unknown as Record<string, unknown>).boardLayout = "board";
    expect(Object.prototype.hasOwnProperty.call(toDelta(s), "boardLayout")).toBe(false);
  });
});

describe("Hin und zurück – die Eigenschaft, auf die es ankommt", () => {
  const faelle: Record<string, Record<string, unknown>> = {
    "alles auf Standard": {},
    "gemischt, wie eine echte Datei": {
      fontTaskPct: 130, chipsIconsOnly: true, itemsFolder: "Aufgaben",
      knownLabels: ["bug", "ui"], labelColors: { bug: "#f00" },
      schemaVersion: 3, didInitialSetup: true, lastSeenVersion: "1.37.2",
      pageViewOptions: { heute: { sort: "smart" } },
      boardColumnOrder: { label: ["bug", "ui"] },
    },
    "mit bearbeiteter Statusliste": {
      statuses: [...DEFAULT_STATUSES.map((s) => ({ ...s })), { id: "wartet", labelKey: "x", kind: "open" }],
    },
  };

  for (const [name, datei] of Object.entries(faelle)) {
    it(`verliert nichts: ${name}`, () => {
      const vorher = geladen(datei);
      const nachher = applyDefaults(toDelta(vorher) as Partial<BeautyTasksSettings>);
      expect(nachher).toEqual(vorher);
    });
  }

  it("eine Datei mit lauter Standardwerten schrumpft auf die Schlüssel ohne Standard", () => {
    const voll = { ...EFFECTIVE_DEFAULTS, schemaVersion: 3, lastSeenVersion: "1.37.2" };
    expect(Object.keys(toDelta(voll)).sort()).toEqual(["lastSeenVersion", "schemaVersion"]);
  });

  it("didInitialSetup bleibt stehen, sobald es auf true steht – der Standard ist false", () => {
    expect(toDelta(geladen({ didInitialSetup: true })).didInitialSetup).toBe(true);
  });
});

describe("abgelöste Schlüssel aus früheren Fassungen", () => {
  const alt = ["chipOrder", "chipTiers", "titleProperty", "showParentMarker", "areasFolder"];

  it("werden beim Laden entfernt und nie wieder geschrieben", () => {
    const datei: Record<string, unknown> = {
      chipOrder: ["due"], chipTiers: { due: "shown" }, titleProperty: "titel",
      showParentMarker: true, areasFolder: "BeautyTasks/Areas",
    };
    const s = geladen(datei);
    const d = toDelta(s);
    for (const k of alt) {
      expect((s as unknown as Record<string, unknown>)[k], `${k} in den Einstellungen`).toBeUndefined();
      expect(Object.prototype.hasOwnProperty.call(d, k), `${k} in der Datei`).toBe(false);
    }
  });

  it("ihr Ersatz bleibt selbstverständlich erhalten", () => {
    const d = toDelta(geladen({
      chipProfiles: { editor: { order: ["due"] } },
      fieldNames: { type: "type", title: "titel" },
    }));
    expect(d.chipProfiles).toEqual({ editor: { order: ["due"] } });
    expect(d.fieldNames).toEqual({ type: "type", title: "titel" });
  });
});

describe("Standardwerte bleiben unberührt", () => {
  // Die REGRESSION aus 1.37.3, gefunden im Vault-Test: Sammlungen, die in der Datei fehlen (weil
  // sie dem Standard gleichen), zeigten auf dasselbe Objekt wie der Standard. Wer das erste Label
  // anlegte, veränderte damit den Standard – und `toDelta` verglich gegen genau dieses veränderte
  // Objekt, fand Gleichheit und warf das Label weg. Es verschwand beim Neustart.
  it("ein hinzugefügtes Label wird gespeichert, auch wenn die Liste vorher leer war", () => {
    const s = geladen({});
    s.knownLabels.push("ui");
    expect(toDelta(s).knownLabels).toEqual(["ui"]);
  });

  it("und verändert dabei NICHT den Standard für alle anderen", () => {
    const a = geladen({});
    a.knownLabels.push("ui");
    expect(geladen({}).knownLabels).toEqual([]);
    expect(EFFECTIVE_DEFAULTS.knownLabels).toEqual([]);
  });

  it("gilt für JEDE veränderliche Sammlung, nicht nur die, die mir einfielen", () => {
    for (const key of ["knownLabels", "visibleLabels", "excludeFolders"] as const) {
      const s = geladen({});
      (s[key] as string[]).push("x");
      expect(toDelta(s)[key], key).toEqual(["x"]);
      expect((geladen({})[key] as string[]).length, key + " (Standard unberührt)").toBe(0);
    }
    for (const key of ["labelColors", "metaColors"] as const) {
      const s = geladen({});
      (s[key] as Record<string, string>).a = "#fff";
      expect(toDelta(s)[key], key).toEqual({ a: "#fff" });
      expect(Object.keys(geladen({})[key] as object).length, key + " (Standard unberührt)").toBe(0);
    }
  });

  it("geladene Einstellungen teilen keine Objekte mit den Standardwerten", () => {
    const a = geladen({}), b = geladen({});
    expect(a.statuses).not.toBe(EFFECTIVE_DEFAULTS.statuses);
    expect(a.statuses).not.toBe(b.statuses);
    expect(a.fieldNames).not.toBe(EFFECTIVE_DEFAULTS.fieldNames);
    a.statuses![0].labelKey = "kaputt";
    expect(EFFECTIVE_DEFAULTS.statuses![0].labelKey).not.toBe("kaputt");
    expect(geladen({}).statuses![0].labelKey).not.toBe("kaputt");
  });
});

/**
 * Der Rundlauf, den es 1.37.3 nicht gab – und zwar AUFGEZÄHLT VOM STANDARD, nicht von Hand.
 *
 * Der Fehler von damals war nicht, die falschen drei Felder kopiert zu haben, sondern überhaupt
 * eine Liste gepflegt zu haben, an die man beim nächsten neuen Feld denken muss. Deshalb geht
 * dieser Block über JEDE veränderliche Sammlung in EFFECTIVE_DEFAULTS: Was künftig dazukommt, ist
 * ohne Zutun mitgeprüft.
 *
 * Ausgangslage ist immer eine LEERE data.json – genau der Zustand, in dem die Falle zuschnappte
 * (was dem Standard gleicht, steht nicht in der Datei und teilte sich sein Objekt mit ihm).
 */
describe("Rundlauf für jede Sammlung, ausgehend von einer leeren data.json", () => {
  const sammlungen = Object.entries(EFFECTIVE_DEFAULTS as unknown as Record<string, unknown>)
    .filter(([, v]) => v !== null && typeof v === "object");

  /** Etwas hinzufügen, ohne Vorhandenes anzutasten – wie jede Schreibstelle im Plugin. */
  const ergaenzen = (wert: unknown): unknown =>
    Array.isArray(wert) ? [...wert, wert.length && typeof wert[0] === "object" ? { probe: true } : "probe"]
      : { ...(wert as Record<string, unknown>), probe: "x" };

  it("findet überhaupt Sammlungen (sonst prüft der Block nichts)", () => {
    expect(sammlungen.length).toBeGreaterThan(5);
  });

  for (const [key] of sammlungen) {
    it(key + ": ergänzt -> gespeichert -> wieder geladen", () => {
      const s = geladen({}) as unknown as Record<string, unknown>;
      const neu = ergaenzen(s[key]);
      s[key] = neu;
      const datei = toDelta(s as unknown as BeautyTasksSettings);
      expect(datei[key], key + " fehlt in der Datei").toEqual(neu);
      expect((geladen(datei)as unknown as Record<string, unknown>)[key], key + " überlebt den Neustart nicht").toEqual(neu);
    });

    it(key + ": der Standard bleibt für alle anderen unberührt", () => {
      const a = geladen({}) as unknown as Record<string, unknown>;
      a[key] = ergaenzen(a[key]);
      // Frisch geladen (= anderer Vault, nächster Start) muss der Standard wieder der Standard sein.
      expect((geladen({}) as unknown as Record<string, unknown>)[key], key)
        .toEqual((EFFECTIVE_DEFAULTS as unknown as Record<string, unknown>)[key]);
    });
  }

  it("auch an Ort und Stelle veränderte Sammlungen (push/[k]=v) überleben – nicht nur zugewiesene", () => {
    // Die Importe wiesen bis hierher teils per push zu (importExport/importTaskNotes). Beides muss
    // halten: Die Zuweisung ist die Regel, aber das Speichern darf nicht daran hängen.
    for (const [key, def] of sammlungen) {
      if (!Array.isArray(def)) continue;
      const s = geladen({}) as unknown as Record<string, unknown>;
      (s[key] as unknown[]).push(typeof def[0] === "object" && def.length ? { probe: true } : "probe");
      expect(toDelta(s as unknown as BeautyTasksSettings)[key], key).toEqual(s[key]);
      expect((geladen({}) as unknown as Record<string, unknown>)[key], key + " (Standard verunreinigt)")
        .toEqual((EFFECTIVE_DEFAULTS as unknown as Record<string, unknown>)[key]);
    }
  });
});
