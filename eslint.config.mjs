import tsParser from "@typescript-eslint/parser";
import tseslint from "typescript-eslint";
import obsidianmd from "eslint-plugin-obsidianmd";

// Spiegelt den Community-Scanner: typescript-eslint recommendedTypeChecked + obsidianmd recommended.
export default [
  { ignores: ["node_modules/**", "main.js", "*.mjs", "package.json", "package-lock.json", "versions.json", "tsconfig.json"] },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: ["src/**/*.ts"],
  })),
  ...obsidianmd.configs.recommended,
  {
    files: ["src/**/*.ts"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: "./tsconfig.json",
        sourceType: "module",
      },
    },
    rules: {
      // v0.3.0: laut Plugin-Doku standardmäßig AUS („not working as intended"); zudem
      // ist „BeautyTasks" ein Eigenname/Markenname und kein UI-Satz.
      "obsidianmd/ui/sentence-case": "off",
      // Underscore-präfixierte ungenutzte Variablen erlauben (catch (_e)).
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" }],
    },
  },
];
