import esbuild from "esbuild";
import process from "process";
import { builtinModules as builtins } from "node:module";

const prod = process.argv[2] === "production";

const ctx = await esbuild.context({
  entryPoints: ["src/main.ts"],
  bundle: true,
  external: ["obsidian", "electron", "@codemirror/*", ...builtins],
  format: "cjs",
  target: "es2020",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  // Nur im Release minifizieren – im Dev-Build bleibt der Code lesbar (mit Inline-Sourcemap).
  // Zahlt die chrono-Sprachpakete mehr als aus: 971K -> 629K, also kleiner als die 686K, die
  // vorher OHNE chrono ausgeliefert wurden.
  minify: prod,
  treeShaking: true,
  outfile: "main.js",
});

if (prod) {
  await ctx.rebuild();
  process.exit(0);
} else {
  await ctx.watch();
}
