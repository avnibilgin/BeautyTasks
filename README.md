# BeautyTasks

A Todoist-style task & project manager that lives **inside** Obsidian — with a fast, native UI on top of plain Markdown. Every task is a single Markdown note, so your data stays open, portable and future-proof, and there are **no plugin dependencies** and no account required.

![Release](https://img.shields.io/github/v/release/avnibilgin/BeautyTasks?sort=semver)
![License](https://img.shields.io/github/license/avnibilgin/BeautyTasks)
![Downloads](https://img.shields.io/github/downloads/avnibilgin/BeautyTasks/total)

---

## Why BeautyTasks

- **One note per task.** Each task is a normal Markdown file with YAML frontmatter. Nothing is locked in a proprietary database — search it, edit it by hand, sync it, or version it with Git.
- **A real task app, natively.** A Todoist-inspired dashboard with sidebar navigation, a chip-based task editor, quick capture and keyboard-friendly flows — all rendered inside Obsidian, popout-window compatible.
- **Zero dependencies, fully local.** No other plugin is required, no external service is contacted, no sign-up. Your tasks never leave your vault.
- **Fully themeable.** Every color is a CSS variable; works with your theme, CSS snippets, or the Style Settings plugin — including a monochrome mode.
- **Bilingual.** Complete English and German UI (auto-detected from Obsidian, or forced in settings), including natural-language date parsing in both languages.

---

## Features

### Views & navigation
A single dashboard with a left sidebar:

- **Inbox** — everything without a project.
- **Today** — tasks due today (plus anything overdue).
- **Upcoming** — a forward-looking, date-sorted agenda.
- **Recurring** — all repeating tasks at a glance.
- **Done** — completed tasks, with a built-in **Trash** for soft-deleted items.
- **Projects, Areas & Labels** — collapsible boards in the sidebar; open any one as its own list.
- **Search** — fast fuzzy search across all tasks.
- **Manage** — administer projects and labels, archive projects, and restore or permanently remove trashed items.

### Tasks & attributes
Each task can carry:

- **Priority** (highest → lowest) with colored checkbox rings (P1/P2/P3).
- **Due date & time** and an optional **duration** (event length).
- A separate **deadline / scheduled** date & time.
- **Project** and **Area** assignment.
- **Sub-tasks** — nest tasks under a parent, drawn with clean connector lines.
- **Labels** (`#tags`).
- **Recurrence** — “every day / week / 3 months …”, repeating from either the **due date** or the **completion date**.
- **Reminders** — get notified before or at a task’s time (see below).
- A **Markdown description** plus a timestamped **activity log** (comments), with image attachments.

### Quick capture with natural language
Add tasks at the speed of thought. The quick-add modal understands plain sentences in **English and German**:

> `Write report tomorrow p1 #work`
> `Bericht schreiben morgen um 07:30 #arbeit`

It recognizes **dates** (today/tomorrow, weekdays, `3 Jul`, month names), **times** (`um 07:30`, `7pm`), **priority** (`p1`–`p4`) and inline **`#labels`**, and strips those tokens from the title automatically. Prefer full control? Open the Todoist-style task editor with its chip row for date, priority, labels, recurrence, deadline, reminder and parent.

### Reminders
Attach one or more reminders to a task — either **relative** (“at time of task”, 10 min / 30 min / 1 h / 1 day before) or an **absolute** date & time. When a reminder is due, BeautyTasks shows a **system notification** on desktop (even when Obsidian is in the background) and an in-app notice; clicking it opens the task.

> **Good to know:** reminders fire while Obsidian is running. On desktop that includes the background; on mobile they appear while the app is open. Delivery that survives a fully-closed app (calendar/ICS export) is on the roadmap and pairs with upcoming Sync.

### Everyday conveniences
- **Duplicate** a task, **copy a deep link** (`obsidian://`) to it, or **print** a clean copy.
- **Soft delete** to Trash, then restore or empty it — nothing is lost by accident.
- **Import** existing checkboxes from the Tasks/Lists format into BeautyTasks notes.
- **Icons-only chips** option for a more compact editor.
- Optional **description preview** under task titles in lists.

---

## Getting started

1. Install BeautyTasks and enable it.
2. Click the **list-checks** ribbon icon (or run **“Open BeautyTasks”**) to open the dashboard.
3. Hit **Add task** / run **Quick add**, type something like `Buy milk tomorrow #errands`, and press Enter.

That’s it — a new Markdown note is created for the task in your configured folder.

## How your data is stored

Every task is a Markdown note with frontmatter. Nothing proprietary:

```yaml
---
type: task
id: t-8f3a1
status: todo            # todo | doing | done | cancelled
priority: high
due: 2026-07-10T09:00
scheduled: 2026-07-08
duration: 30            # minutes
project: "[[Website Relaunch]]"
parent: "[[Draft the outline]]"
labels: [work, writing]
recurrence: every week
recur_basis: due        # due | done
reminders: ["-30m", "2026-07-10T08:00"]
created: 2026-07-04
---

# Write the launch blog post

Free-form Markdown description here…
```

By default, notes live under these folders (all configurable in settings):

| Content | Default folder |
| --- | --- |
| Tasks | `BeautyTasks/Items` |
| Projects | `BeautyTasks/Projects` |
| Areas | `BeautyTasks/Areas` |
| Attachments | `BeautyTasks/Attachments` |

## Commands

| Command | What it does |
| --- | --- |
| Open BeautyTasks | Open the dashboard |
| Open Today / Upcoming / Recurring / Done | Jump straight to a view |
| New task | Open the full task editor |
| Quick add task | Fast natural-language capture |
| Search tasks | Fuzzy search |
| Count tasks | Show total / open count |
| Import from Tasks/Lists | Migrate existing checkbox tasks |

Assign hotkeys to any of these under **Settings → Hotkeys**.

## Settings

- **Folders** for tasks, projects, areas and attachments.
- **Language** — auto (follow Obsidian), English or German.
- **Start view** — which view opens by default (or the last used one).
- **Natural-language parsing** — toggle date/label/priority detection in titles.
- **Icons-only chips** and **description preview in lists**.
- **Visible labels** in the sidebar.

---

## Theming

BeautyTasks is fully themeable through CSS custom properties. It ships with a built-in color palette (separate values for dark and light mode, defined on `.theme-dark` / `.theme-light`). Everything is overridable, so you can adapt it to any theme.

### 1. Style Settings plugin (color pickers, no CSS)

If you have the community plugin **Style Settings** installed, open its tab and you’ll find a **BeautyTasks → Colors** section with color pickers for the semantic colors (overdue, due today, recurring, labels, priorities). These also drive the icon colors. Nothing is required in BeautyTasks itself — without Style Settings the defaults simply apply. A **Monochrome (no colors)** toggle at the top renders everything in the text color and overrides the pickers.

### 2. A CSS snippet (full control)

Create a snippet under *Settings → Appearance → CSS snippets* and override any of the variables:

```css
body {
  --bt-overdue: #e05c4a;        /* overdue tasks & priority-1 ring */
  --bt-add:     #e05c4a;        /* the "+" of Add task / project / subtask */
  --bt-today:   #f97316;        /* tasks due today (also the Today sidebar icon) */
  --bt-recur:   #ec4899;        /* recurring (also the Recurring sidebar icon) */
  --bt-label:   #a855f7;        /* labels (also the Labels sidebar icon) */
  --bt-prio-1:  #ef4444;        /* priority 1 (highest) checkbox ring */
  --bt-prio-2:  #f59e0b;        /* priority 2 (high) */
  --bt-prio-3:  #3b82f6;        /* priority 3 (medium) */
  --bt-sched:   var(--text-muted);   /* deadline / scheduled chip */
  --bt-line:        rgba(255, 255, 255, 0.10);  /* section dividers */
  --bt-line-faint:  rgba(255, 255, 255, 0.05);  /* task-row dividers */
}
```

Colors deliberately live in CSS variables (not in the plugin’s own settings) so themes, snippets and Style Settings can all drive them.

**Left sidebar icon colors** are themeable too. Each board has its own variable — `--bt-nav-search`, `--bt-nav-inbox`, `--bt-nav-heute`, `--bt-nav-demnaechst`, `--bt-nav-wiederkehrend`, `--bt-nav-erledigt`, `--bt-nav-manage` — and the item groups share one each: `--bt-nav-label`, `--bt-nav-area`, `--bt-nav-project`. For consistency, icons that also have a task chip default to the chip color (e.g. `--bt-nav-heute` → `--bt-today`).

### Per-project / per-area icon color

Individual projects and areas can have their own icon color: add a `color:` property to the project/area note’s frontmatter, e.g. `color: "#4caf50"`.

---

## Roadmap

BeautyTasks is under active development. The following are **planned and not yet available** — listed here so you know where it’s headed:

- **Sync** — a first-class way to keep tasks in sync across devices.
- **Reminders that survive a closed app** — calendar / `.ics` (VALARM) export so your OS or phone notifies you even when Obsidian isn’t running (pairs with Sync).
- **Kanban board view** — drag tasks across status/columns.
- **Calendar view** — see due/scheduled tasks on a month/week grid.
- **Task templates** — create recurring structures and checklists from reusable templates.
- **Saved filters & smart views** — Todoist-style custom queries in the sidebar.

Have an idea or a request? Open an issue — feedback shapes the priorities.

---

## Support & feedback

Found a bug or want a feature? Please [open an issue](https://github.com/avnibilgin/BeautyTasks/issues). Contributions and suggestions are welcome.

## License

Released under the [MIT License](LICENSE).
