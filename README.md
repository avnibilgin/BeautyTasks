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

## Screenshots

### The dashboard
A Todoist-style dashboard with sidebar navigation and grouped task lists.

![BeautyTasks dashboard — Today view](docs/dashboard.png)

### Task editor
The full editor with its chip row for date, priority, labels, recurrence, deadline and reminders.

![BeautyTasks task editor](docs/task-editor.png)

### Quick capture
Add tasks in plain language — dates, times, priority and `#labels` are parsed automatically.

![BeautyTasks quick add](docs/quick-add.png)

### Reminders
Relative (“30 min before”) or absolute reminders, delivered as system notifications.

![BeautyTasks reminders popover](docs/reminders.png)

---

## Features

### Views & navigation
A single dashboard with a left sidebar:

- **Inbox** — everything without a project.
- **Today** — tasks due today (plus anything overdue).
- **Upcoming** — a forward-looking, date-sorted agenda.
- **Recurring** — all repeating tasks at a glance.
- **Done** — completed tasks, with a built-in **Trash** for soft-deleted items.
- **Projects, Areas & Labels** — collapsible boards in the sidebar; open any one as its own **list or Kanban board**.
- **Search** — fast fuzzy search across all tasks.
- **Manage** — a ListManager with separate **Projects**, **Areas** and **Labels** tabs: create, rename, hide, archive or delete each, and restore or permanently remove trashed items.

**Projects vs. Areas.** Organize tasks into **projects** or **areas** — two independent kinds, each with its own tab in the ListManager and its own `+` in the sidebar, so you can **create, archive and delete either one directly**. An **Area** is a fixed section that keeps its own place in the sidebar — ideal for long-running responsibilities that should never be “finished” — while a **project** is for work that eventually wraps up. You can convert one into the other at any time.

### Kanban board
Any project, area or label board can switch between a **List** and a **Board** layout with a quiet toggle in its header. The board is a Kanban with one column per status — **To-Do · In progress · Done** — so you can see your workflow at a glance:

- **Drag & drop** a card between columns to change its status instantly.
- **Add a task straight into a column** with the per-column `+`, pre-set to that column’s status.
- Columns **stack vertically** on narrow panes and mobile, so the board stays usable on the phone.

Because columns map to the task’s `status` field, moving a card is just a normal edit to its Markdown note — nothing lives in a separate board file.

### Tasks & attributes
Each task can carry:

- **Status** — *To-Do*, *In progress* and *Done* (plus a *Cancelled* trash state). The in-progress state shows as a **half-filled checkbox** in every list and board. Set a status by **right-clicking** the checkbox (or **long-pressing** it on mobile), from the **status chip** in the task editor, or by dragging on the Kanban board — a left-click still simply completes the task.
- **Priority** (highest → lowest) with colored checkbox rings (P1/P2/P3).
- **Due date & time** and an optional **duration** (event length).
- A separate **deadline / scheduled** date & time.
- **Project** and **Area** assignment.
- **Sub-tasks** — nest tasks under a parent, drawn with clean connector lines.
- **Labels** (`#tags`).
- **Recurrence** — “every day / week / 3 months …”, repeating from either the **due date** or the **completion date**.
- **Reminders** — get notified before or at a task’s time (see below).
- A **Markdown description**, a **timestamped comment log**, and **file/image attachments** (see below).

### Quick capture with natural language
Add tasks at the speed of thought. The quick-add modal understands plain sentences in **English and German**:

> `Write report tomorrow p1 #work`
> `Bericht schreiben morgen um 07:30 #arbeit`

It recognizes **dates** (today/tomorrow, weekdays, `3 Jul`, month names), **times** (`um 07:30`, `7pm`), **priority** (`p1`–`p4`) and inline **`#labels`**, and strips those tokens from the title automatically. Prefer full control? Open the Todoist-style task editor with its chip row for date, priority, labels, recurrence, deadline, reminder and parent.

### Reminders
Attach one or more reminders to a task — either **relative** (“at time of task”, 10 min / 30 min / 1 h / 1 day before) or an **absolute** date & time. When a reminder is due, BeautyTasks shows a **system notification** on desktop (even when Obsidian is in the background) and an in-app notice; clicking it opens the task.

> **Good to know:** reminders fire while Obsidian is running. On desktop that includes the background; on mobile they appear while the app is open. Delivery that survives a fully-closed app (calendar/ICS export) is on the roadmap and pairs with upcoming Sync.

### Notes, comments & attachments
Every task has a **Details** panel for the story behind the task:

- A free-form **Markdown description**.
- A **timestamped comment log** to track progress over time — add, edit and revisit notes, each stamped with its date and time.
- **Attachments** — click the paperclip, or simply **paste or drag & drop** files and images straight into a comment. They’re saved to your configurable attachments folder, and images appear as thumbnails with a built-in **lightbox** (zoom, copy to clipboard).
- **Link other notes** into a comment to connect related context from your vault.

Because it all lives in the task note’s own Markdown body, your comments and attachments stay readable and portable outside the plugin, too.

### Everyday conveniences
- **Duplicate** a task, **copy a deep link** (`obsidian://`) to it, or **print** a clean copy.
- **Soft delete** to Trash, then restore or empty it — nothing is lost by accident (Trash and Done are ordered newest-first).
- **Export & import all tasks as JSON** — a lossless backup of your task data (fields and description) that you can restore or move to another vault. Import from within the vault or from a file on disk; re-importing is **idempotent** (existing tasks are matched by id and skipped), and missing projects, areas and labels are recreated. Attachments and the comment log stay as separate files in your vault (back them up with the folder).
- **Import** existing checkboxes from the Tasks/Lists format into BeautyTasks notes.
- **Icons-only chips** option for a more compact editor.
- Optional **description preview** under task titles in lists.

---

## Getting started

1. Install BeautyTasks and enable it.
2. Click the **check-circle** ribbon icon (or run **“Open BeautyTasks”**) to open the dashboard.
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

## Google Calendar sync

BeautyTasks can mirror every task that has a **due date** into Google Calendar, two-way: the **date and time** flow in both directions, while everything else (title, duration, reminders) is driven by Obsidian. It uses **your own** Google API credentials — no third-party server is involved, and your token stays in your vault.

### Setup (one-time, ~5 min)

1. **Project** — open the [Google Cloud Console](https://console.cloud.google.com) and create or pick a project.
2. **Enable the API** — go to *APIs & Services → Library*, search for **Google Calendar API**, and click **Enable**.
3. **Consent screen** — open *Google Auth Platform → Get started*: set an app name and your email, and choose **Audience = External**. Then open **Audience** and **Publish app** so the status is **In production**.
   > ⚠️ **Important:** In *Testing* mode, refresh tokens for calendar scopes expire after **7 days**, so the sync would break every week. *In production* they stay valid. You do **not** need Google to verify the app while you are the only user.
4. **Create the client** — go to *Clients → Create client*, set Application type to **Desktop app**, click **Create**, then copy the **Client ID** and **Client secret**.
5. **Connect** — in Obsidian open *Settings → BeautyTasks → Google Calendar*, paste the Client ID and secret, and click **Connect**. On the “Google hasn’t verified this app” screen choose **Advanced → Continue** — this is expected for a personal app.
6. **Calendar** — BeautyTasks creates and selects a dedicated **“BeautyTasks”** calendar (small blast radius; your other calendars are never touched). Done.

The required permissions (`calendar.events`, `calendar.readonly`, `calendar.app.created`) are requested when you connect — there is nothing to pre-register in the consent screen. On **mobile**, step 5 uses a device-code login (you enter a short code on another device) instead of the desktop loopback flow.

### What syncs

| Field | Obsidian → Google | Google → Obsidian |
| --- | --- | --- |
| Title | ✅ | — (Obsidian wins) |
| Date / time (`due`) | ✅ | ✅ written back |
| Duration | ✅ | — |
| Reminders | ✅ (as popups) | — |

- On a conflict (both sides changed the date), **Obsidian wins**.
- Existence is Obsidian-driven: an event deleted in Google is recreated as long as the task still has a date. To remove it for good, change the task in Obsidian or exclude its list.
- Exclude a project/area from sync via its right-click menu, the icon in the management list, or the edit dialog.

### Where credentials live

Your Client ID/secret and the OAuth token are stored locally in `.obsidian/plugins/beautytasks/data.json` (git-ignored). **Disconnect** in settings revokes the token with Google and deletes it locally. If you sync your vault by other means (Obsidian Sync, Dropbox, iCloud…), this file travels with it.

## Commands

| Command | What it does |
| --- | --- |
| Open BeautyTasks | Open the dashboard |
| Open Today / Upcoming / Recurring / Done | Jump straight to a view |
| New task | Open the full task editor |
| Quick add task | Fast natural-language capture |
| Search tasks | Fuzzy search |
| Count tasks | Show total / open count |
| Export tasks (JSON) | Save all tasks to a JSON file in your vault |
| Import tasks (JSON) | Restore tasks from a JSON export |
| Import from Tasks/Lists | Migrate existing checkbox tasks |

Assign hotkeys to any of these under **Settings → Hotkeys**.

## Settings

- **Folders** for tasks, projects, areas and attachments.
- **Language** — auto (follow Obsidian), English or German.
- **Start view** — which view opens by default (or the last used one).
- **Natural-language parsing** — toggle date/label/priority detection in titles.
- **Icons-only chips** and **description preview in lists**.
- **Visible labels** in the sidebar.
- **Import & Export** — save all tasks to JSON, or read them back from the vault or a file.

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
- **Custom statuses** — define your own workflow columns (add, rename, reorder) beyond To-Do / In progress / Done.
- **Calendar view** — see due/scheduled tasks on a month/week grid.
- **Task templates** — create recurring structures and checklists from reusable templates.
- **Saved filters & smart views** — Todoist-style custom queries in the sidebar.

Have an idea or a request? Open an issue — feedback shapes the priorities.

---

## Support & feedback

Found a bug or want a feature? Please [open an issue](https://github.com/avnibilgin/BeautyTasks/issues). Contributions and suggestions are welcome.

## License

Released under the [MIT License](LICENSE).
