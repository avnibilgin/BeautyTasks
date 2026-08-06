// Minimaler "obsidian"-Stub – nur die von den puren Helfern importierten Exporte,
// damit die Module unter vitest auflösbar sind. Keine echte Logik nötig (die Tests
// rufen nur reine Funktionen, nicht die App/TFile-abhängigen Pfade).

export function normalizePath(p: string): string {
  return p.replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/^\/+|\/+$/g, "");
}

export function stringifyYaml(obj: Record<string, unknown>): string {
  return Object.entries(obj).map(([k, v]) => `${k}: ${JSON.stringify(v)}`).join("\n") + "\n";
}

export class App {}
export class TFile {}
/** Nur so viel Component, wie TaskIndex braucht: Abos einsammeln. `registerEvent` zählt
 *  bewusst NICHT selbst mit – wie oft ein Kanal belegt ist, weiß der Fake-App-Stub im Test
 *  (sonst prüfte der Test seine eigene Buchhaltung statt der von TaskIndex). */
export class Component {
  private refs: unknown[] = [];
  registerEvent(ref: unknown): void { this.refs.push(ref); }
  addChild<T>(child: T): T { return child; }
}
export class FuzzySuggestModal {}
export class Modal {}
export class Setting {}
export class Notice {}
export function setIcon(): void { /* no-op im Test */ }
