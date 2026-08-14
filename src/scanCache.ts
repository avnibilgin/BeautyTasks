import { App, TFile } from "obsidian";
import { fieldKey } from "./fieldNames";

/**
 * Ein GEMERKTES Ergebnis eines Vault-Durchlaufs über das Frontmatter.
 *
 * Wozu: `listProjectsAndAreas` und `listFilters` laufen über ALLE Notizen des Vaults und fragen
 * je Notiz den metadataCache – um am Ende ein Dutzend Projekt- und eine Handvoll Filternotizen
 * zu finden. Die Seitenleiste braucht beide bei JEDER Index-Meldung (s. tryPatchNav), also bei
 * jedem Häkchen, jedem Schritt des Google-Sync, jeder importierten Aufgabe. Der Durchlauf hängt
 * aber gar nicht an den Aufgaben: Solange sich keine Projekt-/Filternotiz ändert, kommt jedes Mal
 * dasselbe heraus.
 *
 * Warum KEIN Index (wie TaskIndex einer ist): Ein Index hat einen Zustand „noch nicht gebaut",
 * und aus dem wird an jeder Aufrufstelle stillschweigend „dieser Vault hat nichts davon" – genau
 * die Fehlerklasse, die in 1.39.1 die Label-Sektion beim Start verschwinden ließ (s.
 * TaskIndex.ready). Ein gemerktes Ergebnis hat diesen Zustand nicht: Beim ersten Fragen wird
 * gerechnet, die Antwort ist sofort vollständig, und der Aufrufer merkt keinen Unterschied.
 * Deshalb ändert sich an KEINER der ~15 Aufrufstellen eine Zeile.
 *
 * Warum es nicht hinter der Wahrheit herhinken kann: Gerechnet wird aus dem metadataCache,
 * verworfen wird genau dann, wenn der metadataCache sich meldet. Das Gemerkte ist damit nie
 * älter als die Quelle, aus der es stammt. (Dass frisch geschriebenes Frontmatter kurz noch
 * nicht im Cache steht, ist eine Eigenschaft von Obsidian und trifft den nackten Durchlauf
 * genauso – dagegen stehen die vorhandenen `refreshOnChange`-Stellen.)
 *
 * Die zurückgegebenen Einträge sind GETEILT und dürfen nicht verändert werden. Heute tut das
 * auch niemand: Gelesen wird nur, und sortiert wird stets in einer Kopie (s. orderNav).
 */
interface Invalidatable {
  clear(): void;
  changed(app: App, f: TFile): void;
  gone(path: string): void;
}

const registry: Invalidatable[] = [];

export class ScanCache<T extends { path: string }> implements Invalidatable {
  private items: T[] | null = null;

  /**
   * @param owns  Erkennt am Frontmatter-`type`, ob eine Notiz in DIESEN Durchlauf gehört.
   * @param scan  Der Durchlauf selbst – läuft beim ersten Fragen und nach jedem Verwerfen.
   */
  constructor(private readonly owns: (type: unknown) => boolean, private readonly scan: (app: App) => T[]) {
    registry.push(this);
  }

  get(app: App): T[] {
    if (!this.items) this.items = this.scan(app);
    return this.items;
  }

  clear(): void { this.items = null; }

  /**
   * Diese Notiz hat sich geändert. Verworfen wird in zwei Fällen:
   *  – sie STEHT im Gemerkten (Name, Icon, Farbe, `nav_hidden`, `status: archived` können sich
   *    geändert haben – oder sie ist gerade gar kein Projekt mehr);
   *  – sie ist gerade eine geworden.
   * Alles andere – und das ist die überwältigende Mehrheit, nämlich jede Aufgaben-Änderung –
   * lässt das Gemerkte stehen. Das ist der ganze Zweck der Übung.
   */
  changed(app: App, f: TFile): void {
    if (!this.items) return;   // nichts gemerkt -> nichts zu verwerfen
    if (this.items.some((x) => x.path === f.path)) { this.items = null; return; }
    if (this.owns(app.metadataCache.getFileCache(f)?.frontmatter?.[fieldKey("type")])) this.items = null;
  }

  /** Unter diesem Pfad liegt die Notiz nicht mehr (gelöscht oder umbenannt). Den Typ kann
   *  niemand mehr nachschlagen – es zählt nur, ob sie im Gemerkten steht. */
  gone(path: string): void {
    if (this.items?.some((x) => x.path === path)) this.items = null;
  }
}

/**
 * Alles Gemerkte vergessen. Für die Anlässe, bei denen sich ALLES geändert haben kann und eine
 * Einzelprüfung nichts brächte:
 *
 *  – `TaskIndex.build()` – im Plugin das Signal „von vorn": Feldnamen-Wechsel (dann heißt das
 *    `type`-Feld plötzlich anders), Migrationen, Import, kalter Metadaten-Cache beim Start;
 *  – eine neu angelegte Notiz: Beim `create` ist ihr Frontmatter noch nicht geparst, der Typ
 *    also noch nicht lesbar (derselbe Grund, aus dem TaskIndex dort einen Timer stellt).
 *
 * Verwerfen kostet nichts – gerechnet wird erst beim nächsten Fragen.
 */
export function clearScanCaches(): void { for (const c of registry) c.clear(); }

export function noteScanChanged(app: App, f: TFile): void { for (const c of registry) c.changed(app, f); }

export function noteScanGone(path: string): void { for (const c of registry) c.gone(path); }
