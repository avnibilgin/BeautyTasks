# Contributing to BeautyTasks

Thanks for your interest in improving BeautyTasks! This guide covers how to set up the
project, the quality bar for changes, and how to report issues.

## Reporting issues

- Search [existing issues](https://github.com/avnibilgin/BeautyTasks/issues) first.
- For **bugs**, include: BeautyTasks version, Obsidian version, OS/platform (desktop or
  mobile), steps to reproduce, and what you expected vs. what happened. A screenshot or a
  short screen recording helps a lot.
- For **feature requests**, describe the problem you're trying to solve, not just the
  solution — it makes it easier to find the best fit.

## Development setup

**Prerequisites:** [Node.js](https://nodejs.org) 20+ and npm.

```bash
npm install       # install dependencies
npm run dev       # esbuild in watch mode (rebuilds main.js on save)
```

The plugin's source lives in `src/` and bundles to `main.js`. To try your build in a real
vault, develop directly inside a test vault's `.obsidian/plugins/beautytasks/` folder (the
[Hot-Reload plugin](https://github.com/pjeby/hot-reload) picks up rebuilds automatically),
or copy `main.js`, `manifest.json` and `styles.css` into that folder and reload Obsidian.

## Before you open a pull request

Please make sure all three pass:

```bash
npm run lint      # eslint (incl. eslint-plugin-obsidianmd rules)
npm test          # vitest unit tests
npm run build     # type-check + production bundle
```

Guidelines:

- **Match the surrounding style.** Comments are in German; keep new comments consistent
  with the file you're editing. Code identifiers are English.
- **Keep it dependency-free.** BeautyTasks ships with zero runtime plugin dependencies and
  contacts no external service — please keep it that way.
- **Mobile-safe.** Avoid Node/Electron-only APIs (`fs`, `path`, `require`, …). The plugin
  targets both desktop and mobile.
- **No `:has` in CSS**, and prefer `window.setTimeout` over the global for popout-window
  compatibility — both are enforced by lint / project conventions.
- **Add tests** for logic changes where practical (see `tests/`), and update the README
  when you add or change a user-facing feature.
- Keep pull requests focused; one topic per PR makes review easier.

## Localization

UI strings live in `src/i18n.ts` with complete **English** and **German** dictionaries.
When you add user-facing text, add the key to **both** locales.

## License

By contributing, you agree that your contributions are licensed under the project's
[MIT License](LICENSE).
