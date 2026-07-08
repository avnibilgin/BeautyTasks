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
export class Component {}
export class FuzzySuggestModal {}
export class Modal {}
export class Setting {}
export class Notice {}
export function setIcon(): void { /* no-op im Test */ }
