# Contributing to BeautyTasks

Thanks for your interest in improving BeautyTasks!

## Pull requests are not accepted

This project does **not** accept pull requests, and any PR opened will be closed
automatically. Please don't spend time preparing code changes — instead, share your idea
as described below.

## Ideas and bug reports are welcome — through issues

**Ideas are welcome as feature requests through
[GitHub issues](https://github.com/avnibilgin/BeautyTasks/issues).** Bugs, too.

- Search [existing issues](https://github.com/avnibilgin/BeautyTasks/issues) first.
- For **bugs**, include: BeautyTasks version, Obsidian version, OS/platform (desktop or
  mobile), steps to reproduce, and what you expected vs. what happened. A screenshot or a
  short screen recording helps a lot.
- For **feature requests**, describe the problem you're trying to solve, not just the
  solution — it makes it easier to find the best fit.

## Building from source (optional)

The plugin is open source, so you're welcome to build and run it yourself.

**Prerequisites:** [Node.js](https://nodejs.org) 20+ and npm.

```bash
npm install       # install dependencies
npm run dev       # esbuild in watch mode (rebuilds main.js on save)
npm run build     # type-check + production bundle
```

The plugin's source lives in `src/` and bundles to `main.js`. To try a build in a real
vault, work directly inside a test vault's `.obsidian/plugins/beautytasks/` folder (the
[Hot-Reload plugin](https://github.com/pjeby/hot-reload) picks up rebuilds automatically),
or copy `main.js`, `manifest.json` and `styles.css` into that folder and reload Obsidian.

## License

BeautyTasks is released under the [MIT License](LICENSE).
