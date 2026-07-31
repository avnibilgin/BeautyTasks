import { describe, it, expect } from "vitest";
import { setLocale, t, pickLocale } from "../src/i18n";

// Fehlt ein Schlüssel in einer Sprache, fällt t() still auf Englisch zurück – im Test-Vault des
// Entwicklers sieht das niemand, im spanischen Menü steht dann eine englische Zeile. Deshalb sind
// die Menü-Texte, die einen ZWEITEN Tab öffnen, hier je Sprache festgenagelt.

const LOCALES = ["en", "de", "es", "pt", "fr", "tr", "zh", "ru", "ja", "it"];
const KEYS = ["menu_open_new_tab", "menu_open_right", "menu_open_window"];

describe("Öffnen-Menü: in jeder Sprache übersetzt", () => {
  it("kennt alle zehn Sprachen", () => {
    for (const loc of LOCALES) expect(pickLocale(loc)).toBe(loc);
  });

  it("liefert je Sprache einen eigenen Text (kein stiller Rückfall auf Englisch)", () => {
    setLocale("en");
    const en = KEYS.map((k) => t(k));
    expect(en).toEqual(["Open in new tab", "Open to the right", "Open in new window"]);

    for (const loc of LOCALES.filter((l) => l !== "en")) {
      setLocale(loc);
      for (const [i, key] of KEYS.entries()) {
        const s = t(key);
        expect(s, `${loc}/${key} fehlt`).not.toBe(key);      // kein Rückfall auf den Schlüssel
        expect(s, `${loc}/${key} ist englisch`).not.toBe(en[i]);
      }
    }
    setLocale("en");
  });

  it("deutsch im abgestimmten Wortlaut (wie Obsidians Datei-Explorer)", () => {
    setLocale("de");
    expect(t("menu_open_new_tab")).toBe("In neuem Tab öffnen");
    expect(t("menu_open_right")).toBe("Rechts daneben öffnen");
    expect(t("menu_open_window")).toBe("In neuem Fenster öffnen");
    setLocale("en");
  });
});
