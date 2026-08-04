import { describe, it, expect } from "vitest";
import { planTokenMigration, GCalTokens } from "../src/gcalAuth";

const token = (over: Partial<GCalTokens> = {}): GCalTokens => ({
  accessToken: "ya29.access",
  refreshToken: "1//refresh",
  expiresAt: 1_800_000_000_000,
  scope: "https://www.googleapis.com/auth/calendar.events",
  ...over,
});

describe("planTokenMigration – Token von data.json in den geräte-lokalen Speicher", () => {
  it("übernimmt einen gespeicherten Token, wenn das Gerät noch keinen hat", () => {
    const got = planTokenMigration(token(), null, false);
    expect(got).toEqual(token());
  });

  it("zieht die Anzeige-E-Mail aus den Einstellungen nach, wenn der Token keine trägt", () => {
    expect(planTokenMigration(token(), "wer@example.com", false)?.account).toBe("wer@example.com");
  });

  it("lässt die E-Mail AM TOKEN gewinnen – sie gehört zu genau dieser Verbindung", () => {
    const t = token({ account: "token@example.com" });
    expect(planTokenMigration(t, "settings@example.com", false)?.account).toBe("token@example.com");
  });

  it("erfindet kein account-Feld, wenn nirgends eine E-Mail steht", () => {
    const got = planTokenMigration(token(), null, false);
    expect(got).not.toHaveProperty("account");
  });

  it("rührt einen vorhandenen lokalen Token NICHT an – der ist der aktuellere", () => {
    expect(planTokenMigration(token(), "wer@example.com", true)).toBeNull();
  });

  it("tut nichts, wenn gar kein Token in data.json lag", () => {
    expect(planTokenMigration(null, null, false)).toBeNull();
    expect(planTokenMigration(undefined, null, false)).toBeNull();
  });

  it("tut nichts ohne Refresh-Token – ein Access-Token allein ist in Minuten wertlos", () => {
    expect(planTokenMigration(token({ refreshToken: "" }), null, false)).toBeNull();
  });

  it("kopiert, statt die Vorlage zu verändern (der Aufrufer löscht sie danach)", () => {
    const src = token();
    const got = planTokenMigration(src, "wer@example.com", false);
    expect(got).not.toBe(src);
    expect(src).not.toHaveProperty("account");
  });
});
