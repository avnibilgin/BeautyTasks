import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

// Die puren Helfer importieren teils Typen/Util aus "obsidian" (kein echtes npm-Paket).
// Fürs Testen wird es auf einen schlanken Stub gemappt.
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
  },
  resolve: {
    alias: {
      obsidian: fileURLToPath(new URL("./tests/stubs/obsidian.ts", import.meta.url)),
    },
  },
});
