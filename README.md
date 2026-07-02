# BeautyTasks

A Todoist-style task & project manager for Obsidian — one markdown note per task, a
native UI, no plugin dependencies.

## Theming

BeautyTasks is fully themeable through CSS custom properties. It ships with a built-in
color palette (separate values for dark and light mode, defined on `.theme-dark` /
`.theme-light`). Everything is overridable, so you can adapt it to any theme.

There are two ways to customize the colors:

### 1. Style Settings plugin (color pickers, no CSS)

If you have the community plugin **Style Settings** installed, open its tab and you'll
find a **BeautyTasks → Colors** section with color pickers for the semantic colors
(overdue, due today, recurring, labels, priorities). These also drive the icon colors.
Nothing is required in BeautyTasks itself — without Style Settings the defaults simply
apply. A **Monochrome (no colors)** toggle at the top renders everything in the text
color and overrides the pickers.

### 2. A CSS snippet (full control)

Create a snippet under *Settings → Appearance → CSS snippets* and override any of the
variables. Example:

```css
body {
  --bt-overdue: #e05c4a;        /* overdue tasks & priority-1 ring */
  --bt-add:     #e05c4a;        /* the "+" of Add task / project / subtask (own, decoupled) */
  --bt-today:   #f97316;        /* tasks due today (also the Today sidebar icon) */
  --bt-recur:   #ec4899;        /* recurring (also the Recurring sidebar icon) */
  --bt-label:   #a855f7;        /* labels (also the Labels sidebar icon) */
  --bt-prio-1:  #ef4444;        /* priority 1 (highest) checkbox ring */
  --bt-prio-2:  #f59e0b;        /* priority 2 (high) */
  --bt-prio-3:  #3b82f6;        /* priority 3 (medium) */
  --bt-sched:   var(--text-muted);   /* deadline / scheduled chip */
  --bt-attach:  var(--text-muted);   /* attachment / comment paperclip */
  --bt-line:        rgba(255, 255, 255, 0.10);  /* section dividers */
  --bt-line-faint:  rgba(255, 255, 255, 0.05);  /* task-row dividers */
  --bt-overlay-fg:       var(--text-on-accent); /* image lightbox controls */
  --bt-overlay-bg:       rgba(255, 255, 255, 0.12);
  --bt-overlay-bg-hover: rgba(255, 255, 255, 0.25);
}
```

Colors deliberately live in CSS variables (not in the plugin's own settings) so themes,
snippets and Style Settings can all drive them.

**Left sidebar icon colors** are themeable too. Each board has its own variable —
`--bt-nav-search`, `--bt-nav-inbox`, `--bt-nav-heute`, `--bt-nav-demnaechst`,
`--bt-nav-wiederkehrend`, `--bt-nav-erledigt`, `--bt-nav-manage` — and the item groups
share one each: `--bt-nav-label`, `--bt-nav-area`, `--bt-nav-project` (a per-item
frontmatter `color:` still wins). For consistency, the icons that also have a task chip
default to the chip color: `--bt-nav-heute` → `--bt-today`, `--bt-nav-wiederkehrend` →
`--bt-recur`, `--bt-nav-label` → `--bt-label` (set the sidebar variable to override).
The remaining icons default to the text color.

### Per-project / per-area icon color

Individual projects and areas can have their own icon color: add a `color:` property to
the project/area note's frontmatter, e.g. `color: "#4caf50"`.
