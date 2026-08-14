import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { setLocale, t } from "../src/i18n";

/**
 * Gibt es jeden Text, den der Code anfordert?
 *
 * `t()` fällt bei einem unbekannten Schlüssel auf den SCHLÜSSEL zurück. Im Menü stand deshalb
 * eines Tages wörtlich „edit_task" – mit Unterstrich, in jeder Sprache, weil den Schlüssel nie
 * jemand angelegt hatte. Der Compiler sieht das nicht (es ist ein gültiger String), der Lint
 * auch nicht, und im Entwickler-Vault fällt es nur auf, wenn man genau dieses Menü öffnet.
 *
 * Der Test liest den Quelltext und prüft jeden fest geschriebenen Schlüssel. Zusammengesetzte
 * Schlüssel (`t("cal_mode_" + mode)`) bleiben aussen vor: Auf die passt kein statischer Test,
 * weil der zweite Teil erst zur Laufzeit entsteht – deshalb wird nur gezählt, was als
 * vollständiges Argument dasteht (dem String folgt direkt `,` oder `)`).
 */

const SRC = fileURLToPath(new URL("../src", import.meta.url));

/** Jeder fest geschriebene t()-Schlüssel im Quelltext, mit seiner Datei. */
function literalKeys(): { key: string; file: string }[] {
  const out: { key: string; file: string }[] = [];
  for (const file of readdirSync(SRC).filter((f) => f.endsWith(".ts") && f !== "i18n.ts")) {
    const src = readFileSync(`${SRC}/${file}`, "utf8");
    for (const m of src.matchAll(/\bt\(\s*"([A-Za-z0-9_]+)"\s*[,)]/g)) out.push({ key: m[1], file });
  }
  return out;
}

describe("i18n: jeder angeforderte Schlüssel existiert", () => {
  beforeAll(() => setLocale("en"));

  it("findet überhaupt Schlüssel (sonst greift der Test ins Leere)", () => {
    expect(literalKeys().length).toBeGreaterThan(200);
  });

  it("kein Aufruf fällt auf den Schlüsselnamen zurück", () => {
    const fehlend = literalKeys()
      .filter(({ key }) => t(key) === key)
      .map(({ key, file }) => `${key} (${file})`);
    expect([...new Set(fehlend)]).toEqual([]);
  });
});
