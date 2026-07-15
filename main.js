var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => BeautyTasksPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian29 = require("obsidian");

// src/types.ts
var CHIP_IDS = ["status", "due", "priority", "label", "recurrence", "deadline", "reminder", "parent", "details"];
var DEFAULT_SETTINGS = {
  itemsFolder: "BeautyTasks/Items",
  projectsFolder: "BeautyTasks/Projects",
  filtersFolder: "BeautyTasks/Filters",
  attachmentsFolder: "BeautyTasks/Attachments",
  knownLabels: [],
  visibleLabels: [],
  labelColors: {},
  locale: "auto",
  showDescriptionInList: true,
  navCollapsed: {},
  startView: "heute",
  lastView: "heute",
  parseNaturalLanguage: true,
  showUnfiledInInbox: true,
  excludeFolders: [],
  chipsIconsOnly: false,
  boardLayout: "list",
  reminderLastScan: 0,
  didInitialSetup: false
};

// src/i18n.ts
var STRINGS = {
  en: {
    view_today: "Today",
    view_upcoming: "Upcoming",
    view_recurring: "Recurring",
    view_done: "Done",
    status_todo: "To-Do",
    status_doing: "In progress",
    status_done: "Done",
    status_cancelled: "Cancelled",
    layout_list: "List",
    layout_board: "Board",
    menu_cancel_task: "Cancel task",
    layout_calendar: "Calendar",
    cal_prev: "Previous",
    cal_next: "Next",
    cal_today: "Today",
    cal_unscheduled: "Unscheduled",
    cal_unscheduled_empty: "Nothing unscheduled",
    cal_mode_year: "Year",
    cal_tasks: "{0} tasks",
    cal_mode_month: "Month",
    cal_mode_week: "Week",
    cal_mode_day: "Day",
    cal_more: "+{0} more",
    cal_allday: "All-day",
    tab_statuses: "Statuses",
    status_add: "Add status",
    placeholder_status_name: "Status name",
    status_reset_default: "Reset to default",
    confirm_reset_statuses_q: "Reset all statuses to default?",
    status_hint: "These are the columns on the Kanban board \u2014 order = column order.",
    status_kind_open: "Open",
    status_kind_done: "Done",
    status_kind_cancelled: "Cancelled",
    role_new_tasks: "New tasks",
    role_on_complete: "On complete",
    role_trash: "Trash",
    status_pick_icon: "Icon",
    status_pick_color: "Color",
    status_color_none: "No color",
    color_custom: "Custom color",
    btn_move_up: "Move up",
    btn_move_down: "Move down",
    status_need_done: "Keep at least one \u201CDone\u201D status.",
    status_need_open: "Keep at least one open status.",
    status_need_kind: "Keep at least one status per category.",
    status_only_one_trash: "There's exactly one trash status.",
    status_reassigned: "{0} tasks moved to {1}.",
    sort_by: "Sort",
    sort_manual: "Manual",
    sort_name: "Name",
    sort_count: "Count",
    whatsnew_title: "What\u2019s new",
    whatsnew_ok: "Got it",
    wn_cal_t: "Calendar view",
    wn_cal_d: "Year, month, week and day \u2013 drag tasks to reschedule them.",
    wn_unsched_t: "Unscheduled sidebar",
    wn_unsched_d: "Tasks without a date, ready to drag into the grid.",
    wn_dir_t: "Sort direction",
    wn_dir_d: "Ascending or descending, for every sort criterion.",
    wn_excl_t: "Include and exclude in filters",
    wn_excl_d: "Mark each value as \u2713 include or \u2212 exclude \u2014 mixed in the same field, for labels, projects and priorities.",
    wn_fmode_t: "Mode: any \xB7 all \xB7 none",
    wn_fmode_d: "Per field, choose at least one (OR), all (AND) or none (NOT).",
    wn_anytime_t: "e.g. an \u201CAnytime\u201D filter",
    wn_anytime_d: "Undated and without a certain label \u2014 now possible in a single filter.",
    wn_chips_t: "Customize input chips",
    wn_chips_d: "Show, hide and reorder the chips in quick add and the full editor separately \u2014 with a + menu for the rest.",
    wn_status_t: "Robust statuses",
    wn_status_d: "Statuses now have guaranteed categories (open \xB7 done \xB7 trash), an editor grouped by category, and a trash that always works.",
    wn_quickadd_t: "Quick add, complete",
    wn_quickadd_d: "Quick add carries every field; the maximize button hands everything over to the full editor.",
    wn_reset_t: "Sensible defaults",
    wn_reset_d: "New default layouts, plus reset buttons for the chip layout and the statuses.",
    wn_gcal_t: "Google Calendar sync",
    wn_gcal_d: "Mirror tasks that have a due date \u2014 date and time sync both ways.",
    wn_gcalcal_t: "Your account, your calendar",
    wn_gcalcal_d: "Connect with your own Google credentials; events go to a dedicated BeautyTasks calendar.",
    wn_gcallist_t: "Per-list control",
    wn_gcallist_d: "Switch sync on or off for any project, area, or the inbox.",
    wn_gcalstat_t: "Status & conflicts",
    wn_gcalstat_d: "A status-bar indicator shows sync state; on a conflict, Obsidian wins.",
    wn_board_t: "Board by grouping",
    wn_board_d: "The Kanban board now follows your grouping: columns by status, label, priority or project \u2014 drag cards between columns.",
    wn_langs_t: "8 new languages",
    wn_langs_d: "The interface is now also available in Spanish, Portuguese, French, Turkish, Chinese, Russian, Japanese and Italian.",
    wn_project_t: "Type @ for a project",
    wn_project_d: "In quick add, assign a task to an existing project or area by typing @Name.",
    wn_hidden_t: "Reveal hidden items",
    wn_hidden_d: "Right-click a section header to bring hidden entries back with a single click.",
    wn_ui_t: "UI improvements",
    wn_ui_d: "Cleaner and more flexible: sort & group in Today, a focused dated agenda in Upcoming, and a menu on every project, label and filter page.",
    nav_inbox: "Inbox",
    group_area: "Areas",
    group_project: "Projects",
    sec_overdue: "Overdue",
    sec_today: "Today",
    sec_upcoming: "Upcoming",
    sec_no_date: "No date",
    sec_done: "Done",
    count_task: "{0} task",
    count_tasks: "{0} tasks",
    empty_nothing_scheduled: "Nothing scheduled.",
    empty_nothing_recurring: "No recurring tasks.",
    empty_nothing_done: "Nothing done yet.",
    empty_nothing_today: "Nothing due today.",
    empty_no_project_tasks: "No tasks in this project yet.",
    empty_no_area_tasks: "No tasks in this area yet.",
    empty_no_inbox_tasks: "No tasks in the inbox yet.",
    empty_no_label_tasks: "No tasks with this label yet.",
    empty_no_tasks: "No tasks yet.",
    btn_add_task: "Add task",
    btn_cancel: "Cancel",
    btn_save: "Save",
    btn_delete: "Delete",
    details: "Details",
    subtask: "Subtask",
    placeholder_subtask: "Subtask",
    log_placeholder: "Add a comment \u2026",
    log_attach: "Attach file",
    log_link: "Link note",
    log_add: "Add",
    log_edit: "Edit",
    log_update: "Update",
    log_link_placeholder: "Link a note \u2026",
    btn_close: "Close",
    lb_prev: "Previous image",
    lb_next: "Next image",
    lb_copy: "Copy image",
    msg_image_copied: "Image copied to clipboard.",
    msg_image_copy_failed: "Could not copy image.",
    msg_attached: "Attached {0}",
    msg_attach_failed: "Attachment failed: {0}",
    err_detail_save: "Could not save details.",
    placeholder_taskname: "Task name",
    placeholder_description: "Description \u2026",
    placeholder_date_input: "Enter date \u2026",
    placeholder_label: "Label",
    placeholder_project_name: "Project name \u2026",
    placeholder_area_name: "Area name \u2026",
    chip_date: "Date",
    chip_priority: "Priority",
    chip_label: "Labels",
    chip_recurrence: "Recurrence",
    chip_deadline: "Deadline",
    chip_parent: "Parent",
    pick_parent: "Move under task \u2026",
    prio_1: "Priority 1",
    prio_2: "Priority 2",
    prio_3: "Priority 3",
    prio_4: "Priority 4",
    recur_none: "None",
    recur_daily: "Daily",
    recur_weekly: "Weekly",
    recur_monthly: "Monthly",
    recur_quarterly: "Quarterly",
    recur_yearly: "Yearly",
    recur_basis: "Next date from",
    recur_when_done: "When done",
    pick_new_project: "New project",
    pick_new_area: "New area",
    no_project: "No project",
    make_area: "Area",
    make_area_hint: "Areas are permanent and can't be deleted or archived.",
    manage: "Manage",
    manage_full: "ListManager",
    tab_active: "Active",
    tab_archive: "Archive",
    tab_labels: "Labels",
    add_label: "New label",
    manage_empty_labels: "No labels in use yet.",
    tip_show_sidebar: "Show in sidebar",
    tip_hide_sidebar: "Hide from sidebar",
    tip_mark_area: "Convert to area",
    tip_unmark_area: "Convert to project",
    btn_rename: "Rename",
    btn_archive: "Archive",
    btn_restore: "Restore",
    btn_delete_forever: "Delete permanently",
    confirm_delete_q: "Delete?",
    confirm_delete_forever_q: "Delete permanently?",
    menu_edit: "Edit \u2026",
    menu_reorder: "Change order \u2026",
    menu_reveal_hidden: "Show hidden",
    menu_goto_projects: "Go to project overview",
    menu_goto_areas: "Go to area overview",
    menu_goto_labels: "Go to label overview",
    menu_goto_filters: "Go to filter overview",
    reorder_active: "Reordering",
    reorder_done: "Done",
    archive_undo: "Undo",
    archived_notice: "\u201C{0}\u201D archived.",
    confirm_delete_title: "Delete \u201C{0}\u201D?",
    confirm_delete_body: "This can't be undone.",
    manage_empty_active: "No projects or areas yet.",
    manage_empty_archive: "Nothing archived.",
    manage_empty_projects: "No projects yet.",
    manage_empty_areas: "No areas yet.",
    manage_no_active_hint: "Create a project from the task dialog, then convert it to an area here if needed.",
    date_today: "Today",
    date_yesterday: "Yesterday",
    date_tomorrow: "Tomorrow",
    date_this_weekend: "This weekend",
    date_next_week: "Next week",
    date_no_date: "No date",
    time_add: "Time",
    time_label: "Time",
    duration_label: "Duration",
    err_enter_taskname: "Please enter a task name.",
    err_parent_not_found: "Parent task not found.",
    cmd_new_task: "New task",
    cmd_quick_add: "Quick add task",
    cmd_make_task: "Turn current note into a task",
    cmd_migrate_desc: "Migrate descriptions to frontmatter",
    cmd_remove_inbox: "Remove the old Inbox note (Inbox is now built-in)",
    cmd_open_view: "Open {0}",
    cmd_count_tasks: "Count tasks",
    cmd_import: "Import from Tasks/Lists",
    cmd_search: "Search tasks",
    cmd_whatsnew: "Show what's new",
    cmd_gcal_sync_now: "Sync with Google Calendar now",
    notice_made_task: "Note is now a task.",
    notice_inbox_removed: "Inbox note moved to trash; {0} tasks unfiled.",
    notice_auto_migrated: "BeautyTasks: your tasks were updated to the new format.",
    notice_desc_migrated: "Descriptions migrated: {0} moved to frontmatter, {1} kept as notes.",
    desc_note_content_hint: "Contains its own note content.",
    log_open_note: "Open note",
    cmd_export_json: "Export tasks (JSON)",
    cmd_import_json: "Import tasks (JSON)",
    cmd_import_tasknotes: "Import from TaskNotes",
    set_import_tn: "Import from TaskNotes",
    set_import_tn_desc: "Migrate tasks from the TaskNotes plugin (kept as Markdown notes).",
    set_import_tn_btn: "Import from TaskNotes",
    set_gcal_heading: "Google Calendar",
    gcal_not_connected: "Not connected",
    gcal_setup_desc: 'Sync dated tasks to Google Calendar. Uses your own Google API credentials (one-time setup, ~5 min). Create an OAuth client of type "Desktop app" and paste its ID and secret below.',
    gcal_help_btn: "Open setup guide",
    gcal_setup_hint: "First time? The setup guide walks you through creating the Google credentials.",
    gcal_client_id: "Client ID",
    gcal_client_secret: "Client secret",
    gcal_connect_btn: "Connect",
    gcal_connecting: "Connecting\u2026",
    gcal_connect_failed: "Connection failed: {0}",
    gcal_connected_as: "Connected as {0}",
    gcal_disconnect_btn: "Disconnect",
    gcal_last_synced: "Last synced: {0}",
    gcal_never: "never",
    gcal_syncing: "Syncing\u2026",
    gcal_sync_error: "Error: {0}",
    gcal_sync_now_btn: "Sync now",
    gcal_target_calendar: "Target calendar",
    gcal_target_calendar_desc: "Which calendar dated tasks are mirrored into.",
    gcal_create_calendar_btn: "Create BeautyTasks calendar",
    gcal_create_calendar_desc: 'Create a dedicated "BeautyTasks" calendar and use it (existing events move over on the next sync).',
    gcal_sync_list: "Sync with Google Calendar",
    gcal_tip_create: "Tip: use a dedicated calendar",
    gcal_tip_create_desc: "Create your own Google calendar and migrate your tasks there (clean separation from your main calendar).",
    gcal_create_calendar_failed: "Couldn't create the calendar: {0} \u2014 you may need to disconnect and reconnect (new permission).",
    gcal_no_calendar_warn: "No target calendar selected yet \u2014 pick one below or create the BeautyTasks calendar. Nothing syncs until then.",
    gcal_enabled: "Sync dated tasks",
    gcal_enabled_desc: "Mirror every task that has a due date as an event.",
    gcal_autosync: "Sync automatically",
    gcal_autosync_desc: "Push changes as you edit tasks (otherwise sync only runs on command).",
    gcal_advanced: "Advanced",
    gcal_on_create: "Add new tasks",
    gcal_on_update: "Push edits to existing events",
    gcal_on_delete: "Remove event when task is deleted or undated",
    gcal_remove_on_complete: "Remove event when task is completed",
    gcal_duration: "Default event length (minutes)",
    gcal_timezone: "Time zone",
    gcal_statusbar: "Show sync status in the status bar",
    gcal_notify_conflicts: "Notify on conflicts",
    gcal_device_prompt: "Open {0} and enter code: {1}",
    gcal_reconnect_hint: "reconnect in settings",
    gcal_conflicts_notice: "{0} conflict(s) resolved \u2014 kept the Obsidian values",
    menu_gcal_exclude: "Exclude from Calendar sync",
    menu_gcal_include: "Include in Calendar sync",
    tn_import_title: "Import from TaskNotes",
    tn_import_desc: "Creates new BeautyTasks notes from your TaskNotes tasks. Your TaskNotes files stay untouched.",
    tn_import_tag: "Task tag",
    tn_import_tag_desc: "Frontmatter tag that marks a note as a TaskNotes task.",
    tn_import_folder: "Folder (optional)",
    tn_import_folder_desc: "Limit to a folder. Empty scans the whole vault.",
    tn_import_folder_ph: "e.g. Tasks",
    tn_import_found: "{0} task notes found.",
    tn_import_none: "No TaskNotes tasks found.",
    tn_import_btn: "Import",
    tn_import_done: "Imported {0}, skipped {1}.",
    tn_import_lossy: "{0} with complex recurrence kept the original as a note.",
    tn_import_failed: "Import failed.",
    qa_placeholder: "e.g. Write report tomorrow p1 #important @work",
    qa_added: "Task added",
    qa_open_full: "Open in full editor",
    nav_search: "Search",
    search_placeholder: "Search tasks \u2026",
    search_exclude_archived: "Exclude archived",
    notice_count: "BeautyTasks: {0} tasks ({1} open)",
    notice_import_running: "BeautyTasks: importing \u2026",
    notice_imported: "BeautyTasks: {0} tasks imported.",
    notice_import_failed: "BeautyTasks: import failed (see console).",
    notice_export_done: "BeautyTasks: exported to {0}",
    notice_export_failed: "BeautyTasks: export failed (see console).",
    notice_import_invalid: "BeautyTasks: not a valid export file.",
    notice_import_summary: "BeautyTasks: {0} tasks added, {1} skipped.",
    import_pick_placeholder: "Pick a JSON export \u2026",
    set_data_heading: "Import & Export",
    set_export: "Export tasks",
    set_export_desc: "Save all tasks as a JSON file in your vault (lossless).",
    set_export_btn: "Export",
    set_import: "Import tasks",
    set_import_desc: "Read tasks from a JSON export. Existing tasks are skipped (matched by id).",
    set_import_vault_btn: "From vault \u2026",
    set_import_os_btn: "From file \u2026",
    ribbon_open: "Open BeautyTasks",
    set_show_desc: "Show description in lists",
    set_show_desc_desc: "Display a one-line description preview under the task title.",
    set_chips_iconsonly: "Compact chips (icons only)",
    set_chips_iconsonly_desc: "In the task editor, show only the icons of empty option chips (Date, Priority, Label \u2026); the name appears as a tooltip. Chips with a value still show it.",
    task_actions: "Task actions",
    chip_status: "Status",
    more_chip_actions: "More actions",
    edit_task_actions: "Edit task actions",
    set_chip_actions: "Task actions (input chips)",
    set_chip_actions_desc: "Configure quick add and the full editor separately. Drag each chip into a section \u2014 Always show, Show when set, or Only in the + menu. Order = chip order.",
    chip_tier_shown: "Always show",
    chip_tier_onValue: "Show when set",
    chip_tier_hidden: "Only in the + menu",
    chip_surface_editor: "Full editor",
    chip_surface_quickadd: "Quick add",
    chip_reset_default: "Reset to default",
    menu_create_subtask: "Create subtask",
    menu_show_parent: "Show parent task",
    menu_duplicate: "Duplicate task",
    menu_copy_link: "Copy link to task",
    menu_open_obsidian: "Open in Obsidian",
    menu_open_editor: "Open in editor",
    menu_print: "Print",
    copy_suffix: "(Copy)",
    msg_duplicated: "Task duplicated",
    msg_link_copied: "Link copied",
    msg_link_copy_failed: "Could not copy link.",
    set_folders_heading: "Folders",
    set_folder_items: "Tasks folder",
    set_folder_items_desc: "Where new task notes are created.",
    set_folder_projects: "Projects folder",
    set_folder_projects_desc: "Where project and area notes are created.",
    set_folder_attachments: "Attachments folder",
    set_folder_attachments_desc: "Where pasted or attached files are stored.",
    set_behavior_heading: "Behavior",
    set_language: "Language",
    set_language_desc: "Language for the interface.",
    set_language_auto: "Automatic (follow Obsidian)",
    set_start_view: "View on open",
    set_start_view_desc: "Which view opens on start.",
    set_start_view_last: "Last used",
    set_nl: "Detect date and #labels in title",
    set_nl_desc: "Parse due dates and #labels automatically while typing the task title.",
    set_show_unfiled: "Show unfiled tasks in inbox",
    set_show_unfiled_desc: "List open tasks that have no project \u2013 including notes you create by hand with `type: task` \u2013 in the inbox. Turn off to keep the inbox to tasks you filed there explicitly.",
    set_exclude_folders: "Excluded folders",
    set_exclude_folders_desc: "Notes in these folders are never treated as tasks, even with `type: task`. One folder per line.",
    nav_trash: "Trash",
    empty_trash: "Trash is empty.",
    trash_restore_all: "Restore all",
    trash_empty: "Empty trash",
    confirm_empty_trash_q: "Empty trash?",
    msg_restored: '"{0}" restored.',
    msg_trash_empty: "Trash is already empty.",
    msg_trash_emptied: "Trash emptied \u2013 {0} task(s) permanently deleted.",
    report_trash_empty_restore: "Trash is empty \u2013 nothing to restore.",
    report_tasks_restored: "{0} task(s) restored.",
    rem_at_time: "At time of task",
    rem_before: "{0} before",
    rem_unit_min: "{0} min",
    rem_unit_hour: "{0} h",
    rem_unit_day: "{0} day",
    rem_unit_days: "{0} days",
    chip_reminder: "Reminder",
    rem_count: "{0} reminders",
    reminders_title: "Reminders",
    rem_tab_relative: "Before the task",
    rem_tab_absolute: "Date & time\u2026",
    rem_need_time: "Set a time first",
    rem_add: "Add reminder",
    date_confirm: "Apply",
    nav_filters: "Filters",
    filter_add: "New filter",
    sec_tasks: "Tasks",
    manage_empty_filters: "No filters yet.",
    nav_toggle_section: "Collapse or expand section",
    new_project_title: "New project",
    new_area_title: "New area",
    new_label_title: "New label",
    edit_project_title: "Edit project",
    edit_area_title: "Edit area",
    edit_label_title: "Edit label",
    show_in_sidebar: "Show in sidebar",
    create_filter: "Create filter",
    create_label: "Create label",
    create_project: "Create project",
    create_area: "Create area",
    btn_create: "Create",
    new_need_name: "Please enter a name.",
    new_preview_hint: "Preview",
    empty_no_filter: "This filter no longer exists.",
    empty_no_filter_tasks: "No task matches this filter.",
    filter_new: "New filter",
    filter_edit: "Edit filter",
    filter_name: "Name",
    filter_name_ph: "Filter name \u2026",
    filter_arrange: "Arrange",
    filter_facets: "Filter",
    filter_dir: "Direction",
    filter_dir_asc: "Ascending",
    filter_dir_desc: "Descending",
    filter_sort: "Sort",
    filter_group: "Group",
    filter_show_done: "Include done",
    filter_range: "Time",
    filter_priorities: "Priority",
    filter_labels: "Labels",
    filter_projects: "Projects",
    filter_search: "Search",
    filter_search_ph: "Text in title \u2026",
    filter_reset: "Reset",
    filter_delete: "Delete",
    filter_save: "Save",
    filter_need_name: "Please enter a name.",
    filter_name_taken: "A filter with this name already exists.",
    filter_facets_active: "{0} active",
    filter_all: "All",
    filter_n_selected: "{0} selected",
    filter_n_criteria: "{0} criteria selected",
    filter_mode_lead: "Filter mode",
    filter_mode_any: "any",
    filter_mode_all: "all",
    filter_mode_none: "none",
    filter_mode_s_any: "At least one must match.",
    filter_mode_s_all: "All must match.",
    filter_mode_s_none: "None may match.",
    filter_range_any: "Any",
    filter_range_overdue: "Overdue",
    filter_range_today: "Today & overdue",
    filter_range_next7: "Next 7 days",
    filter_range_nodate: "No date",
    filter_sort_smart: "Smart",
    filter_sort_due: "Date",
    filter_sort_deadline: "Deadline",
    filter_sort_priority: "Priority",
    filter_sort_created: "Created",
    filter_sort_title: "Name",
    filter_group_none: "None",
    filter_group_status: "Status",
    filter_group_date: "Date",
    filter_group_deadline: "Deadline",
    filter_group_priority: "Priority",
    filter_group_label: "Label",
    filter_group_project: "Projects",
    view_display: "Display",
    panel_layout: "Layout",
    panel_show_done: "Show completed",
    no_label: "No label",
    more_actions: "More"
  },
  de: {
    view_today: "Heute",
    view_upcoming: "Demn\xE4chst",
    view_recurring: "Wiederkehrend",
    view_done: "Erledigt",
    status_todo: "To-Do",
    status_doing: "In Arbeit",
    status_done: "Erledigt",
    status_cancelled: "Abgebrochen",
    layout_list: "Liste",
    layout_board: "Board",
    menu_cancel_task: "Abbrechen",
    layout_calendar: "Kalender",
    cal_prev: "Zur\xFCck",
    cal_next: "Weiter",
    cal_today: "Heute",
    cal_unscheduled: "Undatiert",
    cal_unscheduled_empty: "Nichts Undatiertes",
    cal_mode_year: "Jahr",
    cal_tasks: "{0} Aufgaben",
    cal_mode_month: "Monat",
    cal_mode_week: "Woche",
    cal_mode_day: "Tag",
    cal_more: "+{0} weitere",
    cal_allday: "Ganzt\xE4gig",
    tab_statuses: "Status",
    status_add: "Status hinzuf\xFCgen",
    placeholder_status_name: "Status-Name",
    status_reset_default: "Auf Standard zur\xFCcksetzen",
    confirm_reset_statuses_q: "Alle Status auf Standard zur\xFCcksetzen?",
    status_hint: "Das sind die Spalten auf dem Kanban-Board \u2013 Reihenfolge = Spaltenreihenfolge.",
    status_kind_open: "Offen",
    status_kind_done: "Erledigt",
    status_kind_cancelled: "Abgebrochen",
    role_new_tasks: "Neue Aufgaben",
    role_on_complete: "Beim Erledigen",
    role_trash: "Papierkorb",
    status_pick_icon: "Icon",
    status_pick_color: "Farbe",
    status_color_none: "Keine Farbe",
    color_custom: "Eigene Farbe",
    btn_move_up: "Nach oben",
    btn_move_down: "Nach unten",
    status_need_done: 'Mindestens ein \u201EErledigt"-Status muss bleiben.',
    status_need_open: "Mindestens ein offener Status muss bleiben.",
    status_need_kind: "Behalte mindestens einen Status je Kategorie.",
    status_only_one_trash: "Es gibt genau einen Papierkorb-Status.",
    status_reassigned: "{0} Aufgaben nach {1} verschoben.",
    sort_by: "Sortieren",
    sort_manual: "Manuell",
    sort_name: "Name",
    sort_count: "Anzahl",
    whatsnew_title: "Neu in dieser Version",
    whatsnew_ok: "Verstanden",
    wn_cal_t: "Kalender-Ansicht",
    wn_cal_d: "Jahr, Monat, Woche und Tag \u2013 Aufgaben per Drag & Drop umplanen.",
    wn_unsched_t: "Seitenleiste \u201EUndatiert\u201C",
    wn_unsched_d: "Aufgaben ohne Datum, bereit zum Ziehen ins Raster.",
    wn_dir_t: "Sortierrichtung",
    wn_dir_d: "Auf- oder absteigend, f\xFCr jedes Sortierkriterium.",
    wn_excl_t: "Im Filter ein- und ausschlie\xDFen",
    wn_excl_d: "Markiere jeden Wert als \u2713 einschlie\xDFen oder \u2212 ausschlie\xDFen \u2014 gemischt im selben Feld, f\xFCr Labels, Projekte und Priorit\xE4ten.",
    wn_fmode_t: "Modus: eines \xB7 alle \xB7 keines",
    wn_fmode_d: "Pro Feld w\xE4hlen: mindestens eines (ODER), alle (UND) oder keines (NICHT).",
    wn_anytime_t: "z. B. ein \u201EJederzeit\u201C-Filter",
    wn_anytime_d: "Ohne Datum und ohne ein bestimmtes Label \u2014 jetzt in einem einzigen Filter.",
    wn_chips_t: "Eingabe-Chips anpassen",
    wn_chips_d: "Chips in Schnelleingabe und vollem Editor getrennt ein-/ausblenden und sortieren \u2013 mit +-Men\xFC f\xFCr den Rest.",
    wn_status_t: "Robuste Status",
    wn_status_d: "Status haben jetzt garantierte Kategorien (offen \xB7 erledigt \xB7 Papierkorb), einen nach Kategorie gruppierten Editor und einen Papierkorb, der immer funktioniert.",
    wn_quickadd_t: "Schnelleingabe komplett",
    wn_quickadd_d: "Die Schnelleingabe tr\xE4gt alle Felder; der Maximieren-Button \xFCbergibt alles an den vollen Editor.",
    wn_reset_t: "Sinnvolle Standards",
    wn_reset_d: "Neue Standard-Layouts plus Zur\xFCcksetzen-Buttons f\xFCr Chip-Layout und Status.",
    wn_gcal_t: "Google-Kalender-Sync",
    wn_gcal_d: "Aufgaben mit F\xE4lligkeitsdatum spiegeln \u2014 Datum und Uhrzeit flie\xDFen in beide Richtungen.",
    wn_gcalcal_t: "Dein Konto, dein Kalender",
    wn_gcalcal_d: "Mit eigenen Google-Zugangsdaten verbinden; Termine landen in einem eigenen BeautyTasks-Kalender.",
    wn_gcallist_t: "Steuerung pro Liste",
    wn_gcallist_d: "Sync f\xFCr jedes Projekt, jeden Bereich und den Eingang ein-/ausschalten.",
    wn_gcalstat_t: "Status & Konflikte",
    wn_gcalstat_d: "Ein Statusleisten-Symbol zeigt den Sync-Zustand; bei Konflikten gewinnt Obsidian.",
    wn_board_t: "Board nach Gruppierung",
    wn_board_d: "Das Kanban-Board folgt jetzt der Gruppierung: Spalten nach Status, Label, Priorit\xE4t oder Projekt \u2013 Karten per Drag zwischen den Spalten.",
    wn_langs_t: "8 neue Sprachen",
    wn_langs_d: "Die Oberfl\xE4che gibt es jetzt auch auf Spanisch, Portugiesisch, Franz\xF6sisch, T\xFCrkisch, Chinesisch, Russisch, Japanisch und Italienisch.",
    wn_project_t: "Projekt per @ tippen",
    wn_project_d: "In der Schnell-Erfassung ein bestehendes Projekt oder einen Bereich direkt mit @Name zuweisen.",
    wn_hidden_t: "Ausgeblendete einblenden",
    wn_hidden_d: "Rechtsklick auf einen Sektionskopf holt ausgeblendete Eintr\xE4ge mit einem Klick zur\xFCck.",
    wn_ui_t: "UI-Optimierungen",
    wn_ui_d: "Aufger\xE4umter und flexibler: \u201EHeute\u201C mit Sortieren & Gruppieren, \u201EDemn\xE4chst\u201C als reine Termin-Agenda und ein Men\xFC auf jeder Projekt-, Label- und Filterseite.",
    nav_inbox: "Eingang",
    group_area: "Bereiche",
    group_project: "Projekte",
    sec_overdue: "\xDCberf\xE4llig",
    sec_today: "Heute",
    sec_upcoming: "Demn\xE4chst",
    sec_no_date: "Ohne Datum",
    sec_done: "Erledigt",
    count_task: "{0} Aufgabe",
    count_tasks: "{0} Aufgaben",
    empty_nothing_scheduled: "Nichts geplant.",
    empty_nothing_recurring: "Keine wiederkehrenden Aufgaben.",
    empty_nothing_done: "Noch nichts erledigt.",
    empty_nothing_today: "Noch keine Aufgaben heute.",
    empty_no_project_tasks: "Noch keine Aufgaben in diesem Projekt.",
    empty_no_area_tasks: "Noch keine Aufgaben in diesem Bereich.",
    empty_no_inbox_tasks: "Noch keine Aufgaben im Eingang.",
    empty_no_label_tasks: "Noch keine Aufgaben mit diesem Label.",
    empty_no_tasks: "Noch keine Aufgaben.",
    btn_add_task: "Aufgabe hinzuf\xFCgen",
    btn_cancel: "Abbrechen",
    btn_save: "Speichern",
    btn_delete: "L\xF6schen",
    details: "Details",
    subtask: "Unteraufgabe",
    placeholder_subtask: "Unteraufgabe",
    log_placeholder: "Kommentar hinzuf\xFCgen \u2026",
    log_attach: "Datei anh\xE4ngen",
    log_link: "Notiz verkn\xFCpfen",
    log_add: "Hinzuf\xFCgen",
    log_edit: "Bearbeiten",
    log_update: "Aktualisieren",
    log_link_placeholder: "Notiz verkn\xFCpfen \u2026",
    btn_close: "Schlie\xDFen",
    lb_prev: "Vorheriges Bild",
    lb_next: "N\xE4chstes Bild",
    lb_copy: "Bild kopieren",
    msg_image_copied: "Bild in die Zwischenablage kopiert.",
    msg_image_copy_failed: "Bild konnte nicht kopiert werden.",
    msg_attached: "Angeh\xE4ngt: {0}",
    msg_attach_failed: "Anhang fehlgeschlagen: {0}",
    err_detail_save: "Details konnten nicht gespeichert werden.",
    placeholder_taskname: "Aufgabenname",
    placeholder_description: "Beschreibung \u2026",
    placeholder_date_input: "Datum eingeben \u2026",
    placeholder_label: "Label",
    placeholder_project_name: "Projektname \u2026",
    placeholder_area_name: "Bereichsname \u2026",
    chip_date: "Datum",
    chip_priority: "Priorit\xE4t",
    chip_label: "Label",
    chip_recurrence: "Wiederholung",
    chip_deadline: "Deadline",
    chip_parent: "\xDCbergeordnet",
    pick_parent: "Unter Aufgabe einordnen \u2026",
    prio_1: "Priorit\xE4t 1",
    prio_2: "Priorit\xE4t 2",
    prio_3: "Priorit\xE4t 3",
    prio_4: "Priorit\xE4t 4",
    recur_none: "Keine",
    recur_daily: "T\xE4glich",
    recur_weekly: "W\xF6chentlich",
    recur_monthly: "Monatlich",
    recur_quarterly: "Quartalsweise",
    recur_yearly: "J\xE4hrlich",
    recur_basis: "N\xE4chstes Datum ab",
    recur_when_done: "Erledigung",
    pick_new_project: "Neues Projekt",
    pick_new_area: "Neuer Bereich",
    no_project: "Kein Projekt",
    make_area: "Bereich",
    make_area_hint: "Bereiche sind dauerhaft und k\xF6nnen nicht gel\xF6scht oder archiviert werden.",
    manage: "Verwalten",
    manage_full: "ListManager",
    tab_active: "Aktiv",
    tab_archive: "Archiv",
    tab_labels: "Labels",
    add_label: "Neues Label",
    manage_empty_labels: "Noch keine Labels in Verwendung.",
    tip_show_sidebar: "In Seitenleiste anzeigen",
    tip_hide_sidebar: "Aus Seitenleiste ausblenden",
    tip_mark_area: "In Bereich umwandeln",
    tip_unmark_area: "In Projekt umwandeln",
    btn_rename: "Umbenennen",
    btn_archive: "Archivieren",
    btn_restore: "Wiederherstellen",
    btn_delete_forever: "Endg\xFCltig l\xF6schen",
    confirm_delete_q: "L\xF6schen?",
    confirm_delete_forever_q: "Endg\xFCltig l\xF6schen?",
    menu_edit: "Bearbeiten \u2026",
    menu_reorder: "Reihenfolge \xE4ndern \u2026",
    menu_reveal_hidden: "Ausgeblendete einblenden",
    menu_goto_projects: "Zur Projekt\xFCbersicht",
    menu_goto_areas: "Zur Bereichs\xFCbersicht",
    menu_goto_labels: "Zur Label\xFCbersicht",
    menu_goto_filters: "Zur Filter\xFCbersicht",
    reorder_active: "Sortieren aktiv",
    reorder_done: "Fertig",
    archive_undo: "R\xFCckg\xE4ngig",
    archived_notice: "\u201E{0}\u201C archiviert.",
    confirm_delete_title: "\u201E{0}\u201C l\xF6schen?",
    confirm_delete_body: "Kann nicht r\xFCckg\xE4ngig gemacht werden.",
    manage_empty_active: "Noch keine Projekte oder Bereiche.",
    manage_empty_archive: "Nichts archiviert.",
    manage_empty_projects: "Noch keine Projekte.",
    manage_empty_areas: "Noch keine Bereiche.",
    manage_no_active_hint: "Projekte entstehen im Aufgaben-Dialog; hier kannst du sie bei Bedarf in Bereiche umwandeln.",
    date_today: "Heute",
    date_yesterday: "Gestern",
    date_tomorrow: "Morgen",
    date_this_weekend: "Dieses Wochenende",
    date_next_week: "N\xE4chste Woche",
    date_no_date: "Kein Datum",
    time_add: "Uhrzeit",
    time_label: "Uhrzeit",
    duration_label: "Dauer",
    err_enter_taskname: "Bitte einen Aufgabennamen eingeben.",
    err_parent_not_found: "\xDCbergeordnete Aufgabe nicht gefunden.",
    cmd_new_task: "Neue Aufgabe",
    cmd_quick_add: "Aufgabe schnell erfassen",
    cmd_make_task: "Aktuelle Notiz zur Aufgabe machen",
    cmd_migrate_desc: "Beschreibungen ins Frontmatter migrieren",
    cmd_remove_inbox: "Alte Inbox-Notiz entfernen (Eingang ist jetzt eingebaut)",
    cmd_open_view: "{0} \xF6ffnen",
    cmd_count_tasks: "Aufgaben z\xE4hlen",
    cmd_import: "Aus Tasks/Lists importieren",
    cmd_search: "Aufgaben suchen",
    cmd_whatsnew: "Neuigkeiten anzeigen",
    cmd_gcal_sync_now: "Jetzt mit Google Kalender synchronisieren",
    notice_made_task: "Notiz ist jetzt eine Aufgabe.",
    notice_inbox_removed: "Inbox-Notiz in den Papierkorb verschoben; {0} Aufgaben in den Eingang gel\xF6st.",
    notice_auto_migrated: "BeautyTasks: Deine Aufgaben wurden aufs neue Format aktualisiert.",
    notice_desc_migrated: "Beschreibungen migriert: {0} ins Frontmatter, {1} als Notiz behalten.",
    desc_note_content_hint: "Enth\xE4lt eigene Notizinhalte.",
    log_open_note: "Notiz \xF6ffnen",
    cmd_export_json: "Aufgaben exportieren (JSON)",
    cmd_import_json: "Aufgaben importieren (JSON)",
    cmd_import_tasknotes: "Aus TaskNotes importieren",
    set_import_tn: "Aus TaskNotes importieren",
    set_import_tn_desc: "Aufgaben aus dem TaskNotes-Plugin migrieren (bleiben Markdown-Notizen).",
    set_import_tn_btn: "Aus TaskNotes importieren",
    set_gcal_heading: "Google Kalender",
    gcal_not_connected: "Nicht verbunden",
    gcal_setup_desc: "Aufgaben mit Datum in Google Kalender spiegeln. Nutzt deine eigenen Google-API-Zugangsdaten (einmalige Einrichtung, ~5 Min). Lege einen OAuth-Client vom Typ \u201EDesktop-App\u201C an und f\xFCge ID und Secret unten ein.",
    gcal_help_btn: "Einrichtungs-Anleitung \xF6ffnen",
    gcal_setup_hint: "Zum ersten Mal? Die Anleitung f\xFChrt dich durch das Erstellen der Google-Zugangsdaten.",
    gcal_client_id: "Client-ID",
    gcal_client_secret: "Client-Secret",
    gcal_connect_btn: "Verbinden",
    gcal_connecting: "Verbinde\u2026",
    gcal_connect_failed: "Verbindung fehlgeschlagen: {0}",
    gcal_connected_as: "Verbunden als {0}",
    gcal_disconnect_btn: "Abmelden",
    gcal_last_synced: "Zuletzt synchronisiert: {0}",
    gcal_never: "nie",
    gcal_syncing: "Synchronisiere\u2026",
    gcal_sync_error: "Fehler: {0}",
    gcal_sync_now_btn: "Jetzt synchronisieren",
    gcal_target_calendar: "Ziel-Kalender",
    gcal_target_calendar_desc: "In welchen Kalender datierte Aufgaben gespiegelt werden.",
    gcal_create_calendar_btn: "BeautyTasks-Kalender anlegen",
    gcal_create_calendar_desc: "Einen eigenen Kalender \u201EBeautyTasks\u201C anlegen und verwenden (bestehende Events ziehen beim n\xE4chsten Sync mit um).",
    gcal_sync_list: "Mit Google Kalender synchronisieren",
    gcal_tip_create: "Tipp: Eigenen Kalender verwenden",
    gcal_tip_create_desc: "Lege einen eigenen Google-Kalender an und migriere deine Aufgaben dorthin (saubere Trennung vom Hauptkalender).",
    gcal_create_calendar_failed: "Kalender konnte nicht angelegt werden: {0} \u2014 evtl. einmal abmelden und neu verbinden (neue Berechtigung).",
    gcal_no_calendar_warn: "Noch kein Ziel-Kalender gew\xE4hlt \u2014 bitte unten w\xE4hlen oder den BeautyTasks-Kalender anlegen. Bis dahin wird nichts synchronisiert.",
    gcal_enabled: "Aufgaben mit Datum synchronisieren",
    gcal_enabled_desc: "Jede Aufgabe mit F\xE4lligkeitsdatum als Termin spiegeln.",
    gcal_autosync: "Automatisch synchronisieren",
    gcal_autosync_desc: "\xC4nderungen beim Bearbeiten sofort \xFCbertragen (sonst nur per Befehl).",
    gcal_advanced: "Erweitert",
    gcal_on_create: "Neue Aufgaben hinzuf\xFCgen",
    gcal_on_update: "\xC4nderungen an bestehende Termine \xFCbertragen",
    gcal_on_delete: "Termin entfernen, wenn Aufgabe gel\xF6scht/undatiert wird",
    gcal_remove_on_complete: "Termin entfernen, wenn Aufgabe erledigt wird",
    gcal_duration: "Standard-Termindauer (Minuten)",
    gcal_timezone: "Zeitzone",
    gcal_statusbar: "Sync-Status in der Statusleiste anzeigen",
    gcal_notify_conflicts: "Bei Konflikten benachrichtigen",
    gcal_device_prompt: "\xD6ffne {0} und gib den Code ein: {1}",
    gcal_reconnect_hint: "in den Einstellungen neu verbinden",
    gcal_conflicts_notice: "{0} Konflikt(e) gel\xF6st \u2014 Obsidian-Werte behalten",
    menu_gcal_exclude: "Aus Kalender-Sync ausschlie\xDFen",
    menu_gcal_include: "In Kalender-Sync aufnehmen",
    tn_import_title: "Aus TaskNotes importieren",
    tn_import_desc: "Legt neue BeautyTasks-Notizen aus deinen TaskNotes-Aufgaben an. Deine TaskNotes-Dateien bleiben unangetastet.",
    tn_import_tag: "Task-Tag",
    tn_import_tag_desc: "Frontmatter-Tag, der eine Notiz als TaskNotes-Aufgabe markiert.",
    tn_import_folder: "Ordner (optional)",
    tn_import_folder_desc: "Auf einen Ordner begrenzen. Leer durchsucht den ganzen Vault.",
    tn_import_folder_ph: "z. B. Tasks",
    tn_import_found: "{0} Aufgaben-Notizen gefunden.",
    tn_import_none: "Keine TaskNotes-Aufgaben gefunden.",
    tn_import_btn: "Importieren",
    tn_import_done: "{0} importiert, {1} \xFCbersprungen.",
    tn_import_lossy: "{0} mit komplexer Wiederholung \u2013 Original als Notiz erhalten.",
    tn_import_failed: "Import fehlgeschlagen.",
    qa_placeholder: "z. B. Bericht schreiben morgen p1 #wichtig @arbeit",
    qa_added: "Aufgabe hinzugef\xFCgt",
    qa_open_full: "Im vollen Editor \xF6ffnen",
    nav_search: "Suchen",
    search_placeholder: "Aufgabe suchen \u2026",
    search_exclude_archived: "Archiv ausschlie\xDFen",
    notice_count: "BeautyTasks: {0} Aufgaben ({1} offen)",
    notice_import_running: "BeautyTasks: Import l\xE4uft \u2026",
    notice_imported: "BeautyTasks: {0} Aufgaben importiert.",
    notice_import_failed: "BeautyTasks: Import fehlgeschlagen (Konsole).",
    notice_export_done: "BeautyTasks: exportiert nach {0}",
    notice_export_failed: "BeautyTasks: Export fehlgeschlagen (Konsole).",
    notice_import_invalid: "BeautyTasks: keine g\xFCltige Export-Datei.",
    notice_import_summary: "BeautyTasks: {0} Aufgaben neu, {1} \xFCbersprungen.",
    import_pick_placeholder: "JSON-Export w\xE4hlen \u2026",
    set_data_heading: "Import & Export",
    set_export: "Aufgaben exportieren",
    set_export_desc: "Alle Aufgaben als JSON-Datei im Vault sichern (verlustfrei).",
    set_export_btn: "Exportieren",
    set_import: "Aufgaben importieren",
    set_import_desc: "Aufgaben aus einem JSON-Export einlesen. Vorhandene werden \xFCbersprungen (Abgleich per id).",
    set_import_vault_btn: "Aus Vault \u2026",
    set_import_os_btn: "Vom Rechner \u2026",
    ribbon_open: "BeautyTasks \xF6ffnen",
    set_show_desc: "Beschreibung in Listen anzeigen",
    set_show_desc_desc: "Zeigt eine einzeilige Beschreibungs-Vorschau unter dem Aufgabentitel.",
    set_chips_iconsonly: "Kompakte Chips (nur Icons)",
    set_chips_iconsonly_desc: "In der Aufgaben-Maske nur die Icons leerer Options-Chips (Datum, Priorit\xE4t, Label \u2026) zeigen; der Name erscheint als Tooltip. Chips mit Wert zeigen diesen weiterhin an.",
    task_actions: "Aufgabenaktionen",
    chip_status: "Status",
    more_chip_actions: "Weitere Aktionen",
    edit_task_actions: "Aufgabenaktionen bearbeiten",
    set_chip_actions: "Aufgabenaktionen (Eingabe-Chips)",
    set_chip_actions_desc: "Schnelleingabe und normale Eingabe getrennt einstellbar. Ziehe jeden Chip in einen Abschnitt \u2013 Immer anzeigen, Bei Wert anzeigen oder Nur im +-Men\xFC. Reihenfolge = Chip-Reihenfolge.",
    chip_tier_shown: "Immer anzeigen",
    chip_tier_onValue: "Bei Wert anzeigen",
    chip_tier_hidden: "Nur im +-Men\xFC",
    chip_surface_editor: "Normale Eingabe",
    chip_surface_quickadd: "Schnelleingabe",
    chip_reset_default: "Auf Standard zur\xFCcksetzen",
    menu_create_subtask: "Unteraufgabe erstellen",
    menu_show_parent: "\xDCbergeordnete Aufgabe anzeigen",
    menu_duplicate: "Aufgabe duplizieren",
    menu_copy_link: "Link zur Aufgabe kopieren",
    menu_open_obsidian: "In Obsidian \xF6ffnen",
    menu_open_editor: "In Editor \xF6ffnen",
    menu_print: "Drucken",
    copy_suffix: "(Kopie)",
    msg_duplicated: "Aufgabe dupliziert",
    msg_link_copied: "Link kopiert",
    msg_link_copy_failed: "Link konnte nicht kopiert werden.",
    set_folders_heading: "Ordner",
    set_folder_items: "Aufgaben-Ordner",
    set_folder_items_desc: "Wo neue Aufgaben-Notizen angelegt werden.",
    set_folder_projects: "Projekte-Ordner",
    set_folder_projects_desc: "Wo Projekt- und Bereich-Notizen angelegt werden.",
    set_folder_attachments: "Anh\xE4nge-Ordner",
    set_folder_attachments_desc: "Wo eingef\xFCgte oder angeh\xE4ngte Dateien gespeichert werden.",
    set_behavior_heading: "Verhalten",
    set_language: "Sprache",
    set_language_desc: "Sprache der Oberfl\xE4che.",
    set_language_auto: "Automatisch (folgt Obsidian)",
    set_start_view: "Ansicht beim \xD6ffnen",
    set_start_view_desc: "Welche Ansicht beim Start erscheint.",
    set_start_view_last: "Zuletzt benutzte",
    set_nl: "Datum und #Labels im Titel erkennen",
    set_nl_desc: "F\xE4lligkeitsdatum und #Labels automatisch beim Tippen aus dem Titel \xFCbernehmen.",
    set_show_unfiled: "Nicht zugeordnete Aufgaben im Eingang zeigen",
    set_show_unfiled_desc: "Offene Aufgaben ohne Projekt \u2013 auch von Hand mit `type: task` erstellte Notizen \u2013 im Eingang auflisten. Ausschalten, um im Eingang nur explizit dort abgelegte Aufgaben zu zeigen.",
    set_exclude_folders: "Ausgeschlossene Ordner",
    set_exclude_folders_desc: "Notizen in diesen Ordnern gelten nie als Aufgabe, auch mit `type: task`. Ein Ordner pro Zeile.",
    nav_trash: "Papierkorb",
    empty_trash: "Papierkorb ist leer.",
    trash_restore_all: "Alle wiederherstellen",
    trash_empty: "Papierkorb leeren",
    confirm_empty_trash_q: "Papierkorb leeren?",
    msg_restored: '"{0}" wiederhergestellt.',
    msg_trash_empty: "Papierkorb ist bereits leer.",
    msg_trash_emptied: "Papierkorb geleert \u2013 {0} Aufgabe(n) endg\xFCltig gel\xF6scht.",
    report_trash_empty_restore: "Papierkorb ist leer \u2013 nichts wiederherzustellen.",
    report_tasks_restored: "{0} Aufgabe(n) wiederhergestellt.",
    rem_at_time: "Zum Zeitpunkt der Aufgabe",
    rem_before: "{0} vorher",
    rem_unit_min: "{0} min",
    rem_unit_hour: "{0} Std",
    rem_unit_day: "{0} Tag",
    rem_unit_days: "{0} Tage",
    chip_reminder: "Erinnerung",
    rem_count: "{0} Erinnerungen",
    reminders_title: "Erinnerungen",
    rem_tab_relative: "Vor der Aufgabe",
    rem_tab_absolute: "Datum & Uhrzeit\u2026",
    rem_need_time: "Setz zuerst eine Uhrzeit",
    rem_add: "Erinnerung hinzuf\xFCgen",
    date_confirm: "\xDCbernehmen",
    nav_filters: "Filter",
    filter_add: "Neuer Filter",
    sec_tasks: "Aufgaben",
    manage_empty_filters: "Noch keine Filter.",
    nav_toggle_section: "Sektion auf- oder zuklappen",
    new_project_title: "Neues Projekt",
    new_area_title: "Neuer Bereich",
    new_label_title: "Neues Label",
    edit_project_title: "Projekt bearbeiten",
    edit_area_title: "Bereich bearbeiten",
    edit_label_title: "Label bearbeiten",
    show_in_sidebar: "In Seitenleiste zeigen",
    create_filter: "Filter erstellen",
    create_label: "Label erstellen",
    create_project: "Projekt erstellen",
    create_area: "Bereich erstellen",
    btn_create: "Erstellen",
    new_need_name: "Bitte einen Namen eingeben.",
    new_preview_hint: "Vorschau",
    empty_no_filter: "Diesen Filter gibt es nicht mehr.",
    empty_no_filter_tasks: "Keine Aufgabe passt zu diesem Filter.",
    filter_new: "Neuer Filter",
    filter_edit: "Filter bearbeiten",
    filter_name: "Name",
    filter_name_ph: "Filtername \u2026",
    filter_arrange: "Anordnung",
    filter_facets: "Filter",
    filter_dir: "Richtung",
    filter_dir_asc: "Aufsteigend",
    filter_dir_desc: "Absteigend",
    filter_sort: "Sortieren",
    filter_group: "Gruppieren",
    filter_show_done: "Erledigte einbeziehen",
    filter_range: "Zeitraum",
    filter_priorities: "Priorit\xE4t",
    filter_labels: "Labels",
    filter_projects: "Projekte",
    filter_search: "Suche",
    filter_search_ph: "Text im Titel \u2026",
    filter_reset: "Zur\xFCcksetzen",
    filter_delete: "L\xF6schen",
    filter_save: "Speichern",
    filter_need_name: "Bitte einen Namen eingeben.",
    filter_name_taken: "Ein Filter mit diesem Namen existiert bereits.",
    filter_facets_active: "{0} aktiv",
    filter_all: "Alle",
    filter_n_selected: "{0} ausgew\xE4hlt",
    filter_n_criteria: "{0} Kriterien gew\xE4hlt",
    filter_mode_lead: "Filtermodus",
    filter_mode_any: "eines",
    filter_mode_all: "alle",
    filter_mode_none: "keines",
    filter_mode_s_any: "Mindestens eines trifft zu.",
    filter_mode_s_all: "Alle m\xFCssen zutreffen.",
    filter_mode_s_none: "Keines darf zutreffen.",
    filter_range_any: "Alle",
    filter_range_overdue: "\xDCberf\xE4llig",
    filter_range_today: "Heute & \xFCberf\xE4llig",
    filter_range_next7: "N\xE4chste 7 Tage",
    filter_range_nodate: "Ohne Datum",
    filter_sort_smart: "Smart",
    filter_sort_due: "Datum",
    filter_sort_deadline: "Deadline",
    filter_sort_priority: "Priorit\xE4t",
    filter_sort_created: "Erstellt",
    filter_sort_title: "Name",
    filter_group_none: "Keine",
    filter_group_status: "Status",
    filter_group_date: "Datum",
    filter_group_deadline: "Deadline",
    filter_group_priority: "Priorit\xE4t",
    filter_group_label: "Label",
    filter_group_project: "Projekte",
    view_display: "Anzeige",
    panel_layout: "Layout",
    panel_show_done: "Erledigte anzeigen",
    no_label: "Kein Label",
    more_actions: "Mehr"
  },
  es: {
    view_today: "Hoy",
    view_upcoming: "Pr\xF3ximas",
    view_recurring: "Recurrentes",
    view_done: "Completadas",
    status_todo: "Por hacer",
    status_doing: "En curso",
    status_done: "Hecho",
    status_cancelled: "Cancelada",
    layout_list: "Lista",
    layout_board: "Tablero",
    menu_cancel_task: "Cancelar tarea",
    layout_calendar: "Calendario",
    cal_prev: "Anterior",
    cal_next: "Siguiente",
    cal_today: "Hoy",
    cal_unscheduled: "Sin fecha",
    cal_unscheduled_empty: "Nada sin fecha",
    cal_mode_year: "A\xF1o",
    cal_tasks: "{0} tareas",
    cal_mode_month: "Mes",
    cal_mode_week: "Semana",
    cal_mode_day: "D\xEDa",
    cal_more: "+{0} m\xE1s",
    cal_allday: "Todo el d\xEDa",
    tab_statuses: "Estados",
    status_add: "A\xF1adir estado",
    placeholder_status_name: "Nombre del estado",
    status_reset_default: "Restablecer predeterminados",
    confirm_reset_statuses_q: "\xBFRestablecer todos los estados?",
    status_hint: "Estas son las columnas del tablero Kanban \u2014 el orden = orden de las columnas.",
    status_kind_open: "Abierto",
    status_kind_done: "Hecho",
    status_kind_cancelled: "Cancelado",
    role_new_tasks: "Tareas nuevas",
    role_on_complete: "Al completar",
    role_trash: "Papelera",
    status_pick_icon: "Icono",
    status_pick_color: "Color",
    status_color_none: "Sin color",
    color_custom: "Color personalizado",
    btn_move_up: "Subir",
    btn_move_down: "Bajar",
    status_need_done: "Mant\xE9n al menos un estado \xABHecho\xBB.",
    status_need_open: "Mant\xE9n al menos un estado abierto.",
    status_need_kind: "Mant\xE9n al menos un estado por categor\xEDa.",
    status_only_one_trash: "Solo hay un estado de papelera.",
    status_reassigned: "{0} tareas movidas a {1}.",
    sort_by: "Ordenar",
    sort_manual: "Manual",
    sort_name: "Nombre",
    sort_count: "Cantidad",
    whatsnew_title: "Novedades",
    whatsnew_ok: "Entendido",
    wn_cal_t: "Vista de calendario",
    wn_cal_d: "A\xF1o, mes, semana y d\xEDa: arrastra tareas para reprogramarlas.",
    wn_unsched_t: "Barra \u201ESin fecha\u201C",
    wn_unsched_d: "Tareas sin fecha, listas para arrastrar a la cuadr\xEDcula.",
    wn_dir_t: "Direcci\xF3n de orden",
    wn_dir_d: "Ascendente o descendente, para cada criterio.",
    wn_excl_t: "Incluir y excluir en filtros",
    wn_excl_d: "Marca cada valor como \u2713 incluir o \u2212 excluir, mezclado en el mismo campo: etiquetas, proyectos y prioridades.",
    wn_fmode_t: "Modo: alguno \xB7 todos \xB7 ninguno",
    wn_fmode_d: "Por campo: al menos uno (O), todos (Y) o ninguno (NO).",
    wn_anytime_t: "p. ej. un filtro \xABEn cualquier momento\xBB",
    wn_anytime_d: "Sin fecha y sin una etiqueta concreta, ahora en un solo filtro.",
    wn_chips_t: "Personaliza los chips",
    wn_chips_d: "Muestra, oculta y reordena los chips en la entrada r\xE1pida y el editor completo por separado, con un men\xFA + para el resto.",
    wn_status_t: "Estados robustos",
    wn_status_d: "Los estados tienen categor\xEDas garantizadas (abierto \xB7 hecho \xB7 papelera), un editor agrupado por categor\xEDa y una papelera que siempre funciona.",
    wn_quickadd_t: "Entrada r\xE1pida completa",
    wn_quickadd_d: "La entrada r\xE1pida lleva todos los campos; el bot\xF3n maximizar lo pasa todo al editor completo.",
    wn_reset_t: "Valores predeterminados \xFAtiles",
    wn_reset_d: "Nuevos dise\xF1os predeterminados y botones para restablecer el dise\xF1o de chips y los estados.",
    wn_gcal_t: "Sincronizaci\xF3n con Google Calendar",
    wn_gcal_d: "Refleja las tareas con fecha de vencimiento: la fecha y la hora se sincronizan en ambos sentidos.",
    wn_gcalcal_t: "Tu cuenta, tu calendario",
    wn_gcalcal_d: "Con\xE9ctate con tus propias credenciales de Google; los eventos van a un calendario BeautyTasks propio.",
    wn_gcallist_t: "Control por lista",
    wn_gcallist_d: "Activa o desactiva la sincronizaci\xF3n de cualquier proyecto, \xE1rea o la bandeja de entrada.",
    wn_gcalstat_t: "Estado y conflictos",
    wn_gcalstat_d: "Un indicador en la barra de estado muestra la sincronizaci\xF3n; en caso de conflicto, gana Obsidian.",
    wn_board_t: "Tablero por agrupaci\xF3n",
    wn_board_d: "El tablero Kanban ahora sigue la agrupaci\xF3n: columnas por estado, etiqueta, prioridad o proyecto \u2014 arrastra las tarjetas entre columnas.",
    wn_langs_t: "8 nuevos idiomas",
    wn_langs_d: "La interfaz ahora tambi\xE9n est\xE1 disponible en espa\xF1ol, portugu\xE9s, franc\xE9s, turco, chino, ruso, japon\xE9s e italiano.",
    wn_project_t: "Escribe @ para un proyecto",
    wn_project_d: "En la adici\xF3n r\xE1pida, asigna una tarea a un proyecto o \xE1rea existente escribiendo @Nombre.",
    wn_hidden_t: "Mostrar elementos ocultos",
    wn_hidden_d: "Haz clic derecho en el encabezado de una secci\xF3n para recuperar las entradas ocultas con un solo clic.",
    wn_ui_t: "Mejoras de la interfaz",
    wn_ui_d: "M\xE1s ordenado y flexible: ordenar y agrupar en Hoy, una agenda con fechas en Pr\xF3ximas y un men\xFA en cada p\xE1gina de proyecto, etiqueta y filtro.",
    nav_inbox: "Bandeja de entrada",
    group_area: "\xC1reas",
    group_project: "Proyectos",
    sec_overdue: "Atrasadas",
    sec_today: "Hoy",
    sec_upcoming: "Pr\xF3ximas",
    sec_no_date: "Sin fecha",
    sec_done: "Completadas",
    count_task: "{0} tarea",
    count_tasks: "{0} tareas",
    empty_nothing_scheduled: "Nada programado.",
    empty_nothing_recurring: "No hay tareas recurrentes.",
    empty_nothing_done: "A\xFAn no hay nada completado.",
    empty_nothing_today: "Nada para hoy.",
    empty_no_project_tasks: "A\xFAn no hay tareas en este proyecto.",
    empty_no_area_tasks: "A\xFAn no hay tareas en esta \xE1rea.",
    empty_no_inbox_tasks: "A\xFAn no hay tareas en la bandeja de entrada.",
    empty_no_label_tasks: "A\xFAn no hay tareas con esta etiqueta.",
    empty_no_tasks: "A\xFAn no hay tareas.",
    btn_add_task: "A\xF1adir tarea",
    btn_cancel: "Cancelar",
    btn_save: "Guardar",
    btn_delete: "Eliminar",
    details: "Detalles",
    subtask: "Subtarea",
    placeholder_subtask: "Subtarea",
    log_placeholder: "A\xF1adir un comentario \u2026",
    log_attach: "Adjuntar archivo",
    log_link: "Enlazar nota",
    log_add: "A\xF1adir",
    log_edit: "Editar",
    log_update: "Actualizar",
    log_link_placeholder: "Enlazar una nota \u2026",
    btn_close: "Cerrar",
    lb_prev: "Imagen anterior",
    lb_next: "Imagen siguiente",
    lb_copy: "Copiar imagen",
    msg_image_copied: "Imagen copiada al portapapeles.",
    msg_image_copy_failed: "No se pudo copiar la imagen.",
    msg_attached: "Adjuntado {0}",
    msg_attach_failed: "Error al adjuntar: {0}",
    err_detail_save: "No se pudieron guardar los detalles.",
    placeholder_taskname: "Nombre de la tarea",
    placeholder_description: "Descripci\xF3n \u2026",
    placeholder_date_input: "Introduce una fecha \u2026",
    placeholder_label: "Etiqueta",
    placeholder_project_name: "Nombre del proyecto \u2026",
    placeholder_area_name: "Nombre del \xE1rea \u2026",
    chip_date: "Fecha",
    chip_priority: "Prioridad",
    chip_label: "Etiquetas",
    chip_recurrence: "Repetici\xF3n",
    chip_deadline: "Fecha l\xEDmite",
    chip_parent: "Tarea superior",
    pick_parent: "Mover bajo una tarea \u2026",
    prio_1: "Prioridad 1",
    prio_2: "Prioridad 2",
    prio_3: "Prioridad 3",
    prio_4: "Prioridad 4",
    recur_none: "Ninguna",
    recur_daily: "Diaria",
    recur_weekly: "Semanal",
    recur_monthly: "Mensual",
    recur_quarterly: "Trimestral",
    recur_yearly: "Anual",
    recur_basis: "Pr\xF3xima fecha desde",
    recur_when_done: "Al completar",
    pick_new_project: "Nuevo proyecto",
    pick_new_area: "Nueva \xE1rea",
    no_project: "Sin proyecto",
    make_area: "\xC1rea",
    make_area_hint: "Las \xE1reas son permanentes y no se pueden eliminar ni archivar.",
    manage: "Gestionar",
    manage_full: "Gestor de listas",
    tab_active: "Activos",
    tab_archive: "Archivo",
    tab_labels: "Etiquetas",
    add_label: "Nueva etiqueta",
    manage_empty_labels: "A\xFAn no se usan etiquetas.",
    tip_show_sidebar: "Mostrar en la barra lateral",
    tip_hide_sidebar: "Ocultar de la barra lateral",
    tip_mark_area: "Convertir en \xE1rea",
    tip_unmark_area: "Convertir en proyecto",
    btn_rename: "Renombrar",
    btn_archive: "Archivar",
    btn_restore: "Restaurar",
    btn_delete_forever: "Eliminar permanentemente",
    confirm_delete_q: "\xBFEliminar?",
    confirm_delete_forever_q: "\xBFEliminar permanentemente?",
    menu_edit: "Editar \u2026",
    menu_reorder: "Cambiar orden \u2026",
    menu_reveal_hidden: "Mostrar ocultos",
    menu_goto_projects: "Ir a la vista de proyectos",
    menu_goto_areas: "Ir a la vista de \xE1reas",
    menu_goto_labels: "Ir a la vista de etiquetas",
    menu_goto_filters: "Ir a la vista de filtros",
    reorder_active: "Reordenando",
    reorder_done: "Listo",
    archive_undo: "Deshacer",
    archived_notice: "\xAB{0}\xBB archivado.",
    confirm_delete_title: "\xBFEliminar \xAB{0}\xBB?",
    confirm_delete_body: "Esto no se puede deshacer.",
    manage_empty_active: "A\xFAn no hay proyectos ni \xE1reas.",
    manage_empty_archive: "No hay nada archivado.",
    manage_empty_projects: "A\xFAn no hay proyectos.",
    manage_empty_areas: "A\xFAn no hay \xE1reas.",
    manage_no_active_hint: "Crea un proyecto desde el di\xE1logo de tarea y luego convi\xE9rtelo en \xE1rea aqu\xED si lo necesitas.",
    date_today: "Hoy",
    date_yesterday: "Ayer",
    date_tomorrow: "Ma\xF1ana",
    date_this_weekend: "Este fin de semana",
    date_next_week: "La pr\xF3xima semana",
    date_no_date: "Sin fecha",
    time_add: "Hora",
    time_label: "Hora",
    duration_label: "Duraci\xF3n",
    err_enter_taskname: "Introduce un nombre de tarea.",
    err_parent_not_found: "No se encontr\xF3 la tarea superior.",
    cmd_new_task: "Nueva tarea",
    cmd_quick_add: "A\xF1adir tarea r\xE1pida",
    cmd_open_view: "Abrir {0}",
    cmd_count_tasks: "Contar tareas",
    cmd_import: "Importar desde Tasks/Lists",
    cmd_search: "Buscar tareas",
    cmd_whatsnew: "Ver novedades",
    cmd_gcal_sync_now: "Sincronizar con Google Calendar ahora",
    cmd_export_json: "Exportar tareas (JSON)",
    cmd_import_json: "Importar tareas (JSON)",
    cmd_import_tasknotes: "Importar desde TaskNotes",
    set_import_tn: "Importar desde TaskNotes",
    set_import_tn_desc: "Migra tareas del plugin TaskNotes (se conservan como notas Markdown).",
    set_import_tn_btn: "Importar desde TaskNotes",
    set_gcal_heading: "Google Calendar",
    gcal_not_connected: "No conectado",
    gcal_setup_desc: 'Sincroniza tareas con fecha en Google Calendar. Usa tus propias credenciales de la API de Google (configuraci\xF3n \xFAnica, ~5 min). Crea un cliente OAuth de tipo "Aplicaci\xF3n de escritorio" y pega su ID y secreto abajo.',
    gcal_help_btn: "Abrir la gu\xEDa de configuraci\xF3n",
    gcal_setup_hint: "\xBFPrimera vez? La gu\xEDa te explica c\xF3mo crear las credenciales de Google.",
    gcal_client_id: "ID de cliente",
    gcal_client_secret: "Secreto de cliente",
    gcal_connect_btn: "Conectar",
    gcal_connecting: "Conectando\u2026",
    gcal_connect_failed: "Error de conexi\xF3n: {0}",
    gcal_connected_as: "Conectado como {0}",
    gcal_disconnect_btn: "Desconectar",
    gcal_last_synced: "\xDAltima sincronizaci\xF3n: {0}",
    gcal_never: "nunca",
    gcal_syncing: "Sincronizando\u2026",
    gcal_sync_error: "Error: {0}",
    gcal_sync_now_btn: "Sincronizar ahora",
    gcal_target_calendar: "Calendario de destino",
    gcal_target_calendar_desc: "En qu\xE9 calendario se reflejan las tareas con fecha.",
    gcal_create_calendar_btn: "Crear calendario BeautyTasks",
    gcal_create_calendar_desc: 'Crea un calendario "BeautyTasks" propio y \xFAsalo (los eventos existentes se mover\xE1n en la pr\xF3xima sincronizaci\xF3n).',
    gcal_sync_list: "Sincronizar con Google Calendar",
    gcal_tip_create: "Consejo: usa un calendario propio",
    gcal_tip_create_desc: "Crea tu propio calendario de Google y migra tus tareas all\xED (separaci\xF3n limpia de tu calendario principal).",
    gcal_create_calendar_failed: "No se pudo crear el calendario: {0} \u2014 quiz\xE1 debas desconectar y volver a conectar (nuevo permiso).",
    gcal_no_calendar_warn: "A\xFAn no hay calendario de destino seleccionado \u2014 elige uno abajo o crea el calendario BeautyTasks. Hasta entonces no se sincroniza nada.",
    gcal_enabled: "Sincronizar tareas con fecha",
    gcal_enabled_desc: "Refleja como evento cada tarea que tenga fecha de vencimiento.",
    gcal_autosync: "Sincronizar autom\xE1ticamente",
    gcal_autosync_desc: "Env\xEDa los cambios mientras editas las tareas (si no, la sincronizaci\xF3n solo se ejecuta con el comando).",
    gcal_advanced: "Avanzado",
    gcal_on_create: "A\xF1adir tareas nuevas",
    gcal_on_update: "Enviar cambios a los eventos existentes",
    gcal_on_delete: "Eliminar el evento cuando se borra la tarea o pierde la fecha",
    gcal_remove_on_complete: "Eliminar el evento cuando se completa la tarea",
    gcal_duration: "Duraci\xF3n predeterminada del evento (minutos)",
    gcal_timezone: "Zona horaria",
    gcal_statusbar: "Mostrar el estado de sincronizaci\xF3n en la barra de estado",
    gcal_notify_conflicts: "Avisar de conflictos",
    gcal_device_prompt: "Abre {0} e introduce el c\xF3digo: {1}",
    gcal_reconnect_hint: "vuelve a conectar en los ajustes",
    gcal_conflicts_notice: "{0} conflicto(s) resuelto(s) \u2014 se conservaron los valores de Obsidian",
    menu_gcal_exclude: "Excluir de la sincronizaci\xF3n con Calendar",
    menu_gcal_include: "Incluir en la sincronizaci\xF3n con Calendar",
    tn_import_title: "Importar desde TaskNotes",
    tn_import_desc: "Crea nuevas notas de BeautyTasks a partir de tus tareas de TaskNotes. Tus archivos de TaskNotes quedan intactos.",
    tn_import_tag: "Etiqueta de tarea",
    tn_import_tag_desc: "Etiqueta del frontmatter que marca una nota como tarea de TaskNotes.",
    tn_import_folder: "Carpeta (opcional)",
    tn_import_folder_desc: "Limitar a una carpeta. Vac\xEDo analiza todo el almac\xE9n.",
    tn_import_folder_ph: "p. ej. Tareas",
    tn_import_found: "{0} notas de tarea encontradas.",
    tn_import_none: "No se encontraron tareas de TaskNotes.",
    tn_import_btn: "Importar",
    tn_import_done: "Importadas {0}, omitidas {1}.",
    tn_import_lossy: "{0} con repetici\xF3n compleja conservaron el original como nota.",
    tn_import_failed: "Error en la importaci\xF3n.",
    qa_placeholder: "p. ej. Escribir informe ma\xF1ana p1 #importante @trabajo",
    qa_added: "Tarea a\xF1adida",
    qa_open_full: "Abrir en el editor completo",
    nav_search: "Buscar",
    search_placeholder: "Buscar tareas \u2026",
    search_exclude_archived: "Excluir archivados",
    notice_count: "BeautyTasks: {0} tareas ({1} abiertas)",
    notice_import_running: "BeautyTasks: importando \u2026",
    notice_imported: "BeautyTasks: {0} tareas importadas.",
    notice_import_failed: "BeautyTasks: error en la importaci\xF3n (ver consola).",
    notice_export_done: "BeautyTasks: exportado a {0}",
    notice_export_failed: "BeautyTasks: error en la exportaci\xF3n (ver consola).",
    notice_import_invalid: "BeautyTasks: no es un archivo de exportaci\xF3n v\xE1lido.",
    notice_import_summary: "BeautyTasks: {0} tareas a\xF1adidas, {1} omitidas.",
    import_pick_placeholder: "Elige una exportaci\xF3n JSON \u2026",
    set_data_heading: "Importar y exportar",
    set_export: "Exportar tareas",
    set_export_desc: "Guarda todas las tareas como archivo JSON en tu almac\xE9n (sin p\xE9rdidas).",
    set_export_btn: "Exportar",
    set_import: "Importar tareas",
    set_import_desc: "Lee tareas desde una exportaci\xF3n JSON. Las tareas existentes se omiten (seg\xFAn su id).",
    set_import_vault_btn: "Desde el almac\xE9n \u2026",
    set_import_os_btn: "Desde archivo \u2026",
    ribbon_open: "Abrir BeautyTasks",
    set_show_desc: "Mostrar descripci\xF3n en las listas",
    set_show_desc_desc: "Muestra una vista previa de una l\xEDnea de la descripci\xF3n bajo el t\xEDtulo de la tarea.",
    set_chips_iconsonly: "Fichas compactas (solo iconos)",
    set_chips_iconsonly_desc: "En el editor de tareas, muestra solo los iconos de las fichas de opci\xF3n vac\xEDas (Fecha, Prioridad, Etiqueta \u2026); el nombre aparece como informaci\xF3n sobre herramientas. Las fichas con un valor lo siguen mostrando.",
    task_actions: "Acciones de tarea",
    chip_status: "Estado",
    more_chip_actions: "M\xE1s acciones",
    edit_task_actions: "Editar acciones de tarea",
    set_chip_actions: "Acciones de tarea (chips de entrada)",
    set_chip_actions_desc: "Configura la entrada r\xE1pida y el editor completo por separado. Arrastra cada chip a una secci\xF3n: Mostrar siempre, Mostrar con valor o Solo en el men\xFA +. El orden = orden de los chips.",
    chip_tier_shown: "Mostrar siempre",
    chip_tier_onValue: "Mostrar con valor",
    chip_tier_hidden: "Solo en el men\xFA +",
    chip_surface_editor: "Editor completo",
    chip_surface_quickadd: "Entrada r\xE1pida",
    chip_reset_default: "Restablecer predeterminados",
    menu_create_subtask: "Crear subtarea",
    menu_show_parent: "Mostrar tarea superior",
    menu_duplicate: "Duplicar tarea",
    menu_copy_link: "Copiar enlace a la tarea",
    menu_open_obsidian: "Abrir en Obsidian",
    menu_open_editor: "Abrir en el editor",
    menu_print: "Imprimir",
    copy_suffix: "(Copia)",
    msg_duplicated: "Tarea duplicada",
    msg_link_copied: "Enlace copiado",
    msg_link_copy_failed: "No se pudo copiar el enlace.",
    set_folders_heading: "Carpetas",
    set_folder_items: "Carpeta de tareas",
    set_folder_items_desc: "D\xF3nde se crean las nuevas notas de tarea.",
    set_folder_projects: "Carpeta de proyectos",
    set_folder_projects_desc: "D\xF3nde se crean las notas de proyecto y \xE1rea.",
    set_folder_attachments: "Carpeta de adjuntos",
    set_folder_attachments_desc: "D\xF3nde se guardan los archivos pegados o adjuntos.",
    set_behavior_heading: "Comportamiento",
    set_language: "Idioma",
    set_language_desc: "Idioma de la interfaz.",
    set_language_auto: "Autom\xE1tico (seguir Obsidian)",
    set_start_view: "Vista al abrir",
    set_start_view_desc: "Qu\xE9 vista se abre al iniciar.",
    set_start_view_last: "\xDAltima usada",
    set_nl: "Detectar fecha y #etiquetas en el t\xEDtulo",
    set_nl_desc: "Analiza autom\xE1ticamente las fechas de vencimiento y las #etiquetas mientras escribes el t\xEDtulo de la tarea.",
    nav_trash: "Papelera",
    empty_trash: "La papelera est\xE1 vac\xEDa.",
    trash_restore_all: "Restaurar todo",
    trash_empty: "Vaciar papelera",
    confirm_empty_trash_q: "\xBFVaciar la papelera?",
    msg_restored: "\xAB{0}\xBB restaurada.",
    msg_trash_empty: "La papelera ya est\xE1 vac\xEDa.",
    msg_trash_emptied: "Papelera vaciada \u2013 {0} tarea(s) eliminada(s) permanentemente.",
    report_trash_empty_restore: "La papelera est\xE1 vac\xEDa \u2013 nada que restaurar.",
    report_tasks_restored: "{0} tarea(s) restaurada(s).",
    rem_at_time: "A la hora de la tarea",
    rem_before: "{0} antes",
    rem_unit_min: "{0} min",
    rem_unit_hour: "{0} h",
    rem_unit_day: "{0} d\xEDa",
    rem_unit_days: "{0} d\xEDas",
    chip_reminder: "Recordatorio",
    rem_count: "{0} recordatorios",
    reminders_title: "Recordatorios",
    rem_tab_relative: "Antes de la tarea",
    rem_tab_absolute: "Fecha y hora\u2026",
    rem_need_time: "Primero establece una hora",
    rem_add: "A\xF1adir recordatorio",
    date_confirm: "Aplicar",
    nav_filters: "Filtros",
    filter_add: "Nuevo filtro",
    sec_tasks: "Tareas",
    manage_empty_filters: "A\xFAn no hay filtros.",
    nav_toggle_section: "Contraer o expandir la secci\xF3n",
    new_project_title: "Nuevo proyecto",
    new_area_title: "Nueva \xE1rea",
    new_label_title: "Nueva etiqueta",
    edit_project_title: "Editar proyecto",
    edit_area_title: "Editar \xE1rea",
    edit_label_title: "Editar etiqueta",
    show_in_sidebar: "Mostrar en la barra lateral",
    create_filter: "Crear filtro",
    create_label: "Crear etiqueta",
    create_project: "Crear proyecto",
    create_area: "Crear \xE1rea",
    btn_create: "Crear",
    new_need_name: "Introduce un nombre.",
    new_preview_hint: "Vista previa",
    empty_no_filter: "Este filtro ya no existe.",
    empty_no_filter_tasks: "Ninguna tarea coincide con este filtro.",
    filter_new: "Nuevo filtro",
    filter_edit: "Editar filtro",
    filter_name: "Nombre",
    filter_name_ph: "Nombre del filtro \u2026",
    filter_arrange: "Organizar",
    filter_facets: "Filtro",
    filter_dir: "Direcci\xF3n",
    filter_dir_asc: "Ascendente",
    filter_dir_desc: "Descendente",
    filter_sort: "Ordenar",
    filter_group: "Agrupar",
    filter_show_done: "Incluir completadas",
    filter_range: "Tiempo",
    filter_priorities: "Prioridad",
    filter_labels: "Etiquetas",
    filter_projects: "Proyectos",
    filter_search: "Buscar",
    filter_search_ph: "Texto en el t\xEDtulo \u2026",
    filter_reset: "Restablecer",
    filter_delete: "Eliminar",
    filter_save: "Guardar",
    filter_need_name: "Introduce un nombre.",
    filter_name_taken: "Ya existe un filtro con ese nombre.",
    filter_facets_active: "{0} activos",
    filter_all: "Todos",
    filter_n_selected: "{0} seleccionados",
    filter_n_criteria: "{0} criterios seleccionados",
    filter_mode_lead: "Modo de filtro",
    filter_mode_any: "alguno",
    filter_mode_all: "todos",
    filter_mode_none: "ninguno",
    filter_mode_s_any: "Al menos uno debe coincidir.",
    filter_mode_s_all: "Todos deben coincidir.",
    filter_mode_s_none: "Ninguno debe coincidir.",
    filter_range_any: "Cualquiera",
    filter_range_overdue: "Atrasadas",
    filter_range_today: "Hoy y atrasadas",
    filter_range_next7: "Pr\xF3ximos 7 d\xEDas",
    filter_range_nodate: "Sin fecha",
    filter_sort_smart: "Inteligente",
    filter_sort_due: "Fecha",
    filter_sort_deadline: "Fecha l\xEDmite",
    filter_sort_priority: "Prioridad",
    filter_sort_created: "Creaci\xF3n",
    filter_sort_title: "Nombre",
    filter_group_none: "Ninguna",
    filter_group_status: "Estado",
    filter_group_date: "Fecha",
    filter_group_deadline: "Fecha l\xEDmite",
    filter_group_priority: "Prioridad",
    filter_group_label: "Etiqueta",
    filter_group_project: "Proyectos",
    view_display: "Vista",
    panel_layout: "Dise\xF1o",
    panel_show_done: "Mostrar completadas",
    no_label: "Sin etiqueta",
    more_actions: "M\xE1s"
  },
  pt: {
    view_today: "Hoje",
    view_upcoming: "Pr\xF3ximas",
    view_recurring: "Recorrentes",
    view_done: "Conclu\xEDdas",
    status_todo: "A fazer",
    status_doing: "Em andamento",
    status_done: "Feito",
    status_cancelled: "Cancelada",
    layout_list: "Lista",
    layout_board: "Quadro",
    menu_cancel_task: "Cancelar tarefa",
    layout_calendar: "Calend\xE1rio",
    cal_prev: "Anterior",
    cal_next: "Pr\xF3ximo",
    cal_today: "Hoje",
    cal_unscheduled: "Sem data",
    cal_unscheduled_empty: "Nada sem data",
    cal_mode_year: "Ano",
    cal_tasks: "{0} tarefas",
    cal_mode_month: "M\xEAs",
    cal_mode_week: "Semana",
    cal_mode_day: "Dia",
    cal_more: "+{0} mais",
    cal_allday: "Dia inteiro",
    tab_statuses: "Status",
    status_add: "Adicionar status",
    placeholder_status_name: "Nome do status",
    status_reset_default: "Redefinir para o padr\xE3o",
    confirm_reset_statuses_q: "Redefinir todos os status para o padr\xE3o?",
    status_hint: "Estas s\xE3o as colunas do quadro Kanban \u2014 a ordem = ordem das colunas.",
    status_kind_open: "Aberto",
    status_kind_done: "Feito",
    status_kind_cancelled: "Cancelado",
    role_new_tasks: "Novas tarefas",
    role_on_complete: "Ao concluir",
    role_trash: "Lixeira",
    status_pick_icon: "\xCDcone",
    status_pick_color: "Cor",
    status_color_none: "Sem cor",
    color_custom: "Cor personalizada",
    btn_move_up: "Mover para cima",
    btn_move_down: "Mover para baixo",
    status_need_done: "Mantenha ao menos um status \xABFeito\xBB.",
    status_need_open: "Mantenha ao menos um status aberto.",
    status_need_kind: "Mantenha ao menos um status por categoria.",
    status_only_one_trash: "H\xE1 exatamente um status de lixeira.",
    status_reassigned: "{0} tarefas movidas para {1}.",
    sort_by: "Ordenar",
    sort_manual: "Manual",
    sort_name: "Nome",
    sort_count: "Quantidade",
    whatsnew_title: "Novidades",
    whatsnew_ok: "Entendi",
    wn_cal_t: "Vista de calend\xE1rio",
    wn_cal_d: "Ano, m\xEAs, semana e dia \u2013 arraste tarefas para reagendar.",
    wn_unsched_t: "Barra \u201ESem data\u201C",
    wn_unsched_d: "Tarefas sem data, prontas para arrastar para a grade.",
    wn_dir_t: "Dire\xE7\xE3o da ordena\xE7\xE3o",
    wn_dir_d: "Crescente ou decrescente, para cada crit\xE9rio.",
    wn_excl_t: "Incluir e excluir nos filtros",
    wn_excl_d: "Marque cada valor como \u2713 incluir ou \u2212 excluir, misturado no mesmo campo: etiquetas, projetos e prioridades.",
    wn_fmode_t: "Modo: algum \xB7 todos \xB7 nenhum",
    wn_fmode_d: "Por campo: pelo menos um (OU), todos (E) ou nenhum (N\xC3O).",
    wn_anytime_t: "ex.: um filtro \u201CA qualquer momento\u201D",
    wn_anytime_d: "Sem data e sem uma etiqueta espec\xEDfica \u2014 agora num \xFAnico filtro.",
    wn_chips_t: "Personalize os chips",
    wn_chips_d: "Mostre, oculte e reordene os chips na adi\xE7\xE3o r\xE1pida e no editor completo separadamente, com um menu + para o resto.",
    wn_status_t: "Status robustos",
    wn_status_d: "Os status agora t\xEAm categorias garantidas (aberto \xB7 feito \xB7 lixeira), um editor agrupado por categoria e uma lixeira que sempre funciona.",
    wn_quickadd_t: "Adi\xE7\xE3o r\xE1pida completa",
    wn_quickadd_d: "A adi\xE7\xE3o r\xE1pida leva todos os campos; o bot\xE3o maximizar passa tudo para o editor completo.",
    wn_reset_t: "Padr\xF5es sensatos",
    wn_reset_d: "Novos layouts padr\xE3o e bot\xF5es para redefinir o layout dos chips e os status.",
    wn_gcal_t: "Sincroniza\xE7\xE3o com o Google Agenda",
    wn_gcal_d: "Espelha as tarefas com data de vencimento \u2014 data e hora sincronizam nos dois sentidos.",
    wn_gcalcal_t: "Sua conta, sua agenda",
    wn_gcalcal_d: "Conecte-se com suas pr\xF3prias credenciais do Google; os eventos v\xE3o para uma agenda BeautyTasks dedicada.",
    wn_gcallist_t: "Controle por lista",
    wn_gcallist_d: "Ative ou desative a sincroniza\xE7\xE3o de qualquer projeto, \xE1rea ou a caixa de entrada.",
    wn_gcalstat_t: "Status e conflitos",
    wn_gcalstat_d: "Um indicador na barra de status mostra a sincroniza\xE7\xE3o; em caso de conflito, o Obsidian vence.",
    wn_board_t: "Quadro por agrupamento",
    wn_board_d: "O quadro Kanban agora segue o agrupamento: colunas por status, etiqueta, prioridade ou projeto \u2014 arraste os cart\xF5es entre as colunas.",
    wn_langs_t: "8 novos idiomas",
    wn_langs_d: "A interface agora tamb\xE9m est\xE1 dispon\xEDvel em espanhol, portugu\xEAs, franc\xEAs, turco, chin\xEAs, russo, japon\xEAs e italiano.",
    wn_project_t: "Digite @ para um projeto",
    wn_project_d: "Na adi\xE7\xE3o r\xE1pida, atribua uma tarefa a um projeto ou \xE1rea existente digitando @Nome.",
    wn_hidden_t: "Mostrar itens ocultos",
    wn_hidden_d: "Clique com o bot\xE3o direito no cabe\xE7alho de uma se\xE7\xE3o para trazer de volta as entradas ocultas com um clique.",
    wn_ui_t: "Melhorias na interface",
    wn_ui_d: "Mais organizado e flex\xEDvel: ordenar e agrupar em Hoje, uma agenda com datas em Pr\xF3ximas e um menu em cada p\xE1gina de projeto, etiqueta e filtro.",
    nav_inbox: "Entrada",
    group_area: "\xC1reas",
    group_project: "Projetos",
    sec_overdue: "Atrasadas",
    sec_today: "Hoje",
    sec_upcoming: "Pr\xF3ximas",
    sec_no_date: "Sem data",
    sec_done: "Conclu\xEDdas",
    count_task: "{0} tarefa",
    count_tasks: "{0} tarefas",
    empty_nothing_scheduled: "Nada agendado.",
    empty_nothing_recurring: "Nenhuma tarefa recorrente.",
    empty_nothing_done: "Nada conclu\xEDdo ainda.",
    empty_nothing_today: "Nada para hoje.",
    empty_no_project_tasks: "Ainda n\xE3o h\xE1 tarefas neste projeto.",
    empty_no_area_tasks: "Ainda n\xE3o h\xE1 tarefas nesta \xE1rea.",
    empty_no_inbox_tasks: "Ainda n\xE3o h\xE1 tarefas na entrada.",
    empty_no_label_tasks: "Ainda n\xE3o h\xE1 tarefas com esta etiqueta.",
    empty_no_tasks: "Ainda n\xE3o h\xE1 tarefas.",
    btn_add_task: "Adicionar tarefa",
    btn_cancel: "Cancelar",
    btn_save: "Salvar",
    btn_delete: "Excluir",
    details: "Detalhes",
    subtask: "Subtarefa",
    placeholder_subtask: "Subtarefa",
    log_placeholder: "Adicionar um coment\xE1rio \u2026",
    log_attach: "Anexar arquivo",
    log_link: "Vincular nota",
    log_add: "Adicionar",
    log_edit: "Editar",
    log_update: "Atualizar",
    log_link_placeholder: "Vincular uma nota \u2026",
    btn_close: "Fechar",
    lb_prev: "Imagem anterior",
    lb_next: "Pr\xF3xima imagem",
    lb_copy: "Copiar imagem",
    msg_image_copied: "Imagem copiada para a \xE1rea de transfer\xEAncia.",
    msg_image_copy_failed: "N\xE3o foi poss\xEDvel copiar a imagem.",
    msg_attached: "Anexado {0}",
    msg_attach_failed: "Falha ao anexar: {0}",
    err_detail_save: "N\xE3o foi poss\xEDvel salvar os detalhes.",
    placeholder_taskname: "Nome da tarefa",
    placeholder_description: "Descri\xE7\xE3o \u2026",
    placeholder_date_input: "Digite uma data \u2026",
    placeholder_label: "Etiqueta",
    placeholder_project_name: "Nome do projeto \u2026",
    placeholder_area_name: "Nome da \xE1rea \u2026",
    chip_date: "Data",
    chip_priority: "Prioridade",
    chip_label: "Etiquetas",
    chip_recurrence: "Recorr\xEAncia",
    chip_deadline: "Prazo",
    chip_parent: "Tarefa superior",
    pick_parent: "Mover para dentro de uma tarefa \u2026",
    prio_1: "Prioridade 1",
    prio_2: "Prioridade 2",
    prio_3: "Prioridade 3",
    prio_4: "Prioridade 4",
    recur_none: "Nenhuma",
    recur_daily: "Di\xE1ria",
    recur_weekly: "Semanal",
    recur_monthly: "Mensal",
    recur_quarterly: "Trimestral",
    recur_yearly: "Anual",
    recur_basis: "Pr\xF3xima data a partir de",
    recur_when_done: "Ao concluir",
    pick_new_project: "Novo projeto",
    pick_new_area: "Nova \xE1rea",
    no_project: "Sem projeto",
    make_area: "\xC1rea",
    make_area_hint: "As \xE1reas s\xE3o permanentes e n\xE3o podem ser exclu\xEDdas nem arquivadas.",
    manage: "Gerenciar",
    manage_full: "Gerenciador de listas",
    tab_active: "Ativos",
    tab_archive: "Arquivo",
    tab_labels: "Etiquetas",
    add_label: "Nova etiqueta",
    manage_empty_labels: "Nenhuma etiqueta em uso ainda.",
    tip_show_sidebar: "Mostrar na barra lateral",
    tip_hide_sidebar: "Ocultar da barra lateral",
    tip_mark_area: "Converter em \xE1rea",
    tip_unmark_area: "Converter em projeto",
    btn_rename: "Renomear",
    btn_archive: "Arquivar",
    btn_restore: "Restaurar",
    btn_delete_forever: "Excluir permanentemente",
    confirm_delete_q: "Excluir?",
    confirm_delete_forever_q: "Excluir permanentemente?",
    menu_edit: "Editar \u2026",
    menu_reorder: "Alterar ordem \u2026",
    menu_reveal_hidden: "Mostrar ocultos",
    menu_goto_projects: "Ir para a vis\xE3o de projetos",
    menu_goto_areas: "Ir para a vis\xE3o de \xE1reas",
    menu_goto_labels: "Ir para a vis\xE3o de etiquetas",
    menu_goto_filters: "Ir para a vis\xE3o de filtros",
    reorder_active: "Reordenando",
    reorder_done: "Conclu\xEDdo",
    archive_undo: "Desfazer",
    archived_notice: "\xAB{0}\xBB arquivado.",
    confirm_delete_title: "Excluir \xAB{0}\xBB?",
    confirm_delete_body: "Isso n\xE3o pode ser desfeito.",
    manage_empty_active: "Ainda n\xE3o h\xE1 projetos nem \xE1reas.",
    manage_empty_archive: "Nada arquivado.",
    manage_empty_projects: "Ainda n\xE3o h\xE1 projetos.",
    manage_empty_areas: "Ainda n\xE3o h\xE1 \xE1reas.",
    manage_no_active_hint: "Crie um projeto pelo di\xE1logo de tarefa e depois converta-o em \xE1rea aqui, se necess\xE1rio.",
    date_today: "Hoje",
    date_yesterday: "Ontem",
    date_tomorrow: "Amanh\xE3",
    date_this_weekend: "Este fim de semana",
    date_next_week: "Pr\xF3xima semana",
    date_no_date: "Sem data",
    time_add: "Hora",
    time_label: "Hora",
    duration_label: "Dura\xE7\xE3o",
    err_enter_taskname: "Digite um nome de tarefa.",
    err_parent_not_found: "Tarefa superior n\xE3o encontrada.",
    cmd_new_task: "Nova tarefa",
    cmd_quick_add: "Adi\xE7\xE3o r\xE1pida de tarefa",
    cmd_open_view: "Abrir {0}",
    cmd_count_tasks: "Contar tarefas",
    cmd_import: "Importar de Tasks/Lists",
    cmd_search: "Buscar tarefas",
    cmd_whatsnew: "Ver novidades",
    cmd_gcal_sync_now: "Sincronizar com o Google Agenda agora",
    cmd_export_json: "Exportar tarefas (JSON)",
    cmd_import_json: "Importar tarefas (JSON)",
    cmd_import_tasknotes: "Importar do TaskNotes",
    set_import_tn: "Importar do TaskNotes",
    set_import_tn_desc: "Migre tarefas do plugin TaskNotes (mantidas como notas Markdown).",
    set_import_tn_btn: "Importar do TaskNotes",
    set_gcal_heading: "Google Agenda",
    gcal_not_connected: "N\xE3o conectado",
    gcal_setup_desc: 'Sincronize tarefas com data no Google Agenda. Usa suas pr\xF3prias credenciais da API do Google (configura\xE7\xE3o \xFAnica, ~5 min). Crie um cliente OAuth do tipo "Aplicativo para computador" e cole o ID e o segredo abaixo.',
    gcal_help_btn: "Abrir o guia de configura\xE7\xE3o",
    gcal_setup_hint: "Primeira vez? O guia orienta voc\xEA na cria\xE7\xE3o das credenciais do Google.",
    gcal_client_id: "ID do cliente",
    gcal_client_secret: "Segredo do cliente",
    gcal_connect_btn: "Conectar",
    gcal_connecting: "Conectando\u2026",
    gcal_connect_failed: "Falha na conex\xE3o: {0}",
    gcal_connected_as: "Conectado como {0}",
    gcal_disconnect_btn: "Desconectar",
    gcal_last_synced: "\xDAltima sincroniza\xE7\xE3o: {0}",
    gcal_never: "nunca",
    gcal_syncing: "Sincronizando\u2026",
    gcal_sync_error: "Erro: {0}",
    gcal_sync_now_btn: "Sincronizar agora",
    gcal_target_calendar: "Agenda de destino",
    gcal_target_calendar_desc: "Em qual agenda as tarefas com data s\xE3o espelhadas.",
    gcal_create_calendar_btn: "Criar agenda BeautyTasks",
    gcal_create_calendar_desc: 'Crie uma agenda "BeautyTasks" pr\xF3pria e use-a (os eventos existentes ser\xE3o movidos na pr\xF3xima sincroniza\xE7\xE3o).',
    gcal_sync_list: "Sincronizar com o Google Agenda",
    gcal_tip_create: "Dica: use uma agenda pr\xF3pria",
    gcal_tip_create_desc: "Crie sua pr\xF3pria agenda do Google e migre suas tarefas para l\xE1 (separa\xE7\xE3o limpa da sua agenda principal).",
    gcal_create_calendar_failed: "N\xE3o foi poss\xEDvel criar a agenda: {0} \u2014 talvez seja preciso desconectar e reconectar (nova permiss\xE3o).",
    gcal_no_calendar_warn: "Nenhuma agenda de destino selecionada ainda \u2014 escolha uma abaixo ou crie a agenda BeautyTasks. At\xE9 l\xE1, nada \xE9 sincronizado.",
    gcal_enabled: "Sincronizar tarefas com data",
    gcal_enabled_desc: "Espelha como evento cada tarefa que tem data de vencimento.",
    gcal_autosync: "Sincronizar automaticamente",
    gcal_autosync_desc: "Envia as mudan\xE7as enquanto voc\xEA edita as tarefas (caso contr\xE1rio, a sincroniza\xE7\xE3o s\xF3 roda por comando).",
    gcal_advanced: "Avan\xE7ado",
    gcal_on_create: "Adicionar novas tarefas",
    gcal_on_update: "Enviar altera\xE7\xF5es aos eventos existentes",
    gcal_on_delete: "Remover o evento quando a tarefa for exclu\xEDda ou perder a data",
    gcal_remove_on_complete: "Remover o evento quando a tarefa for conclu\xEDda",
    gcal_duration: "Dura\xE7\xE3o padr\xE3o do evento (minutos)",
    gcal_timezone: "Fuso hor\xE1rio",
    gcal_statusbar: "Mostrar o status da sincroniza\xE7\xE3o na barra de status",
    gcal_notify_conflicts: "Notificar sobre conflitos",
    gcal_device_prompt: "Abra {0} e digite o c\xF3digo: {1}",
    gcal_reconnect_hint: "reconecte nas configura\xE7\xF5es",
    gcal_conflicts_notice: "{0} conflito(s) resolvido(s) \u2014 mantidos os valores do Obsidian",
    menu_gcal_exclude: "Excluir da sincroniza\xE7\xE3o com a Agenda",
    menu_gcal_include: "Incluir na sincroniza\xE7\xE3o com a Agenda",
    tn_import_title: "Importar do TaskNotes",
    tn_import_desc: "Cria novas notas do BeautyTasks a partir das suas tarefas do TaskNotes. Seus arquivos do TaskNotes permanecem intactos.",
    tn_import_tag: "Etiqueta de tarefa",
    tn_import_tag_desc: "Etiqueta do frontmatter que marca uma nota como tarefa do TaskNotes.",
    tn_import_folder: "Pasta (opcional)",
    tn_import_folder_desc: "Limitar a uma pasta. Vazio analisa o cofre inteiro.",
    tn_import_folder_ph: "ex.: Tarefas",
    tn_import_found: "{0} notas de tarefa encontradas.",
    tn_import_none: "Nenhuma tarefa do TaskNotes encontrada.",
    tn_import_btn: "Importar",
    tn_import_done: "Importadas {0}, ignoradas {1}.",
    tn_import_lossy: "{0} com recorr\xEAncia complexa mantiveram o original como nota.",
    tn_import_failed: "Falha na importa\xE7\xE3o.",
    qa_placeholder: "ex.: Escrever relat\xF3rio amanh\xE3 p1 #importante @trabalho",
    qa_added: "Tarefa adicionada",
    qa_open_full: "Abrir no editor completo",
    nav_search: "Buscar",
    search_placeholder: "Buscar tarefas \u2026",
    search_exclude_archived: "Excluir arquivados",
    notice_count: "BeautyTasks: {0} tarefas ({1} abertas)",
    notice_import_running: "BeautyTasks: importando \u2026",
    notice_imported: "BeautyTasks: {0} tarefas importadas.",
    notice_import_failed: "BeautyTasks: falha na importa\xE7\xE3o (ver console).",
    notice_export_done: "BeautyTasks: exportado para {0}",
    notice_export_failed: "BeautyTasks: falha na exporta\xE7\xE3o (ver console).",
    notice_import_invalid: "BeautyTasks: n\xE3o \xE9 um arquivo de exporta\xE7\xE3o v\xE1lido.",
    notice_import_summary: "BeautyTasks: {0} tarefas adicionadas, {1} ignoradas.",
    import_pick_placeholder: "Escolha uma exporta\xE7\xE3o JSON \u2026",
    set_data_heading: "Importar e exportar",
    set_export: "Exportar tarefas",
    set_export_desc: "Salve todas as tarefas como arquivo JSON no seu cofre (sem perdas).",
    set_export_btn: "Exportar",
    set_import: "Importar tarefas",
    set_import_desc: "L\xEA tarefas de uma exporta\xE7\xE3o JSON. Tarefas existentes s\xE3o ignoradas (pelo id).",
    set_import_vault_btn: "Do cofre \u2026",
    set_import_os_btn: "De arquivo \u2026",
    ribbon_open: "Abrir o BeautyTasks",
    set_show_desc: "Mostrar descri\xE7\xE3o nas listas",
    set_show_desc_desc: "Exibe uma pr\xE9via de uma linha da descri\xE7\xE3o sob o t\xEDtulo da tarefa.",
    set_chips_iconsonly: "Chips compactos (somente \xEDcones)",
    set_chips_iconsonly_desc: "No editor de tarefas, mostra apenas os \xEDcones dos chips de op\xE7\xE3o vazios (Data, Prioridade, Etiqueta \u2026); o nome aparece como dica. Chips com um valor continuam a exibi-lo.",
    task_actions: "A\xE7\xF5es da tarefa",
    chip_status: "Status",
    more_chip_actions: "Mais a\xE7\xF5es",
    edit_task_actions: "Editar a\xE7\xF5es da tarefa",
    set_chip_actions: "A\xE7\xF5es da tarefa (chips de entrada)",
    set_chip_actions_desc: "Configure a adi\xE7\xE3o r\xE1pida e o editor completo separadamente. Arraste cada chip para uma se\xE7\xE3o: Sempre mostrar, Mostrar com valor ou Apenas no menu +. Ordem = ordem dos chips.",
    chip_tier_shown: "Sempre mostrar",
    chip_tier_onValue: "Mostrar com valor",
    chip_tier_hidden: "Apenas no menu +",
    chip_surface_editor: "Editor completo",
    chip_surface_quickadd: "Adi\xE7\xE3o r\xE1pida",
    chip_reset_default: "Redefinir para o padr\xE3o",
    menu_create_subtask: "Criar subtarefa",
    menu_show_parent: "Mostrar tarefa superior",
    menu_duplicate: "Duplicar tarefa",
    menu_copy_link: "Copiar link para a tarefa",
    menu_open_obsidian: "Abrir no Obsidian",
    menu_open_editor: "Abrir no editor",
    menu_print: "Imprimir",
    copy_suffix: "(C\xF3pia)",
    msg_duplicated: "Tarefa duplicada",
    msg_link_copied: "Link copiado",
    msg_link_copy_failed: "N\xE3o foi poss\xEDvel copiar o link.",
    set_folders_heading: "Pastas",
    set_folder_items: "Pasta de tarefas",
    set_folder_items_desc: "Onde as novas notas de tarefa s\xE3o criadas.",
    set_folder_projects: "Pasta de projetos",
    set_folder_projects_desc: "Onde as notas de projeto e \xE1rea s\xE3o criadas.",
    set_folder_attachments: "Pasta de anexos",
    set_folder_attachments_desc: "Onde os arquivos colados ou anexados s\xE3o armazenados.",
    set_behavior_heading: "Comportamento",
    set_language: "Idioma",
    set_language_desc: "Idioma da interface.",
    set_language_auto: "Autom\xE1tico (seguir o Obsidian)",
    set_start_view: "Vis\xE3o ao abrir",
    set_start_view_desc: "Qual vis\xE3o abre ao iniciar.",
    set_start_view_last: "\xDAltima usada",
    set_nl: "Detectar data e #etiquetas no t\xEDtulo",
    set_nl_desc: "Analisa automaticamente as datas de vencimento e as #etiquetas enquanto voc\xEA digita o t\xEDtulo da tarefa.",
    nav_trash: "Lixeira",
    empty_trash: "A lixeira est\xE1 vazia.",
    trash_restore_all: "Restaurar tudo",
    trash_empty: "Esvaziar lixeira",
    confirm_empty_trash_q: "Esvaziar a lixeira?",
    msg_restored: "\xAB{0}\xBB restaurada.",
    msg_trash_empty: "A lixeira j\xE1 est\xE1 vazia.",
    msg_trash_emptied: "Lixeira esvaziada \u2013 {0} tarefa(s) exclu\xEDda(s) permanentemente.",
    report_trash_empty_restore: "A lixeira est\xE1 vazia \u2013 nada a restaurar.",
    report_tasks_restored: "{0} tarefa(s) restaurada(s).",
    rem_at_time: "Na hora da tarefa",
    rem_before: "{0} antes",
    rem_unit_min: "{0} min",
    rem_unit_hour: "{0} h",
    rem_unit_day: "{0} dia",
    rem_unit_days: "{0} dias",
    chip_reminder: "Lembrete",
    rem_count: "{0} lembretes",
    reminders_title: "Lembretes",
    rem_tab_relative: "Antes da tarefa",
    rem_tab_absolute: "Data e hora\u2026",
    rem_need_time: "Defina uma hora primeiro",
    rem_add: "Adicionar lembrete",
    date_confirm: "Aplicar",
    nav_filters: "Filtros",
    filter_add: "Novo filtro",
    sec_tasks: "Tarefas",
    manage_empty_filters: "Ainda n\xE3o h\xE1 filtros.",
    nav_toggle_section: "Recolher ou expandir a se\xE7\xE3o",
    new_project_title: "Novo projeto",
    new_area_title: "Nova \xE1rea",
    new_label_title: "Nova etiqueta",
    edit_project_title: "Editar projeto",
    edit_area_title: "Editar \xE1rea",
    edit_label_title: "Editar etiqueta",
    show_in_sidebar: "Mostrar na barra lateral",
    create_filter: "Criar filtro",
    create_label: "Criar etiqueta",
    create_project: "Criar projeto",
    create_area: "Criar \xE1rea",
    btn_create: "Criar",
    new_need_name: "Digite um nome.",
    new_preview_hint: "Pr\xE9via",
    empty_no_filter: "Este filtro n\xE3o existe mais.",
    empty_no_filter_tasks: "Nenhuma tarefa corresponde a este filtro.",
    filter_new: "Novo filtro",
    filter_edit: "Editar filtro",
    filter_name: "Nome",
    filter_name_ph: "Nome do filtro \u2026",
    filter_arrange: "Organizar",
    filter_facets: "Filtro",
    filter_dir: "Dire\xE7\xE3o",
    filter_dir_asc: "Crescente",
    filter_dir_desc: "Decrescente",
    filter_sort: "Ordenar",
    filter_group: "Agrupar",
    filter_show_done: "Incluir conclu\xEDdas",
    filter_range: "Tempo",
    filter_priorities: "Prioridade",
    filter_labels: "Etiquetas",
    filter_projects: "Projetos",
    filter_search: "Buscar",
    filter_search_ph: "Texto no t\xEDtulo \u2026",
    filter_reset: "Redefinir",
    filter_delete: "Excluir",
    filter_save: "Salvar",
    filter_need_name: "Digite um nome.",
    filter_name_taken: "J\xE1 existe um filtro com esse nome.",
    filter_facets_active: "{0} ativos",
    filter_all: "Todos",
    filter_n_selected: "{0} selecionados",
    filter_n_criteria: "{0} crit\xE9rios selecionados",
    filter_mode_lead: "Modo de filtro",
    filter_mode_any: "algum",
    filter_mode_all: "todos",
    filter_mode_none: "nenhum",
    filter_mode_s_any: "Pelo menos um deve corresponder.",
    filter_mode_s_all: "Todos devem corresponder.",
    filter_mode_s_none: "Nenhum pode corresponder.",
    filter_range_any: "Qualquer",
    filter_range_overdue: "Atrasadas",
    filter_range_today: "Hoje e atrasadas",
    filter_range_next7: "Pr\xF3ximos 7 dias",
    filter_range_nodate: "Sem data",
    filter_sort_smart: "Inteligente",
    filter_sort_due: "Data",
    filter_sort_deadline: "Prazo",
    filter_sort_priority: "Prioridade",
    filter_sort_created: "Cria\xE7\xE3o",
    filter_sort_title: "Nome",
    filter_group_none: "Nenhuma",
    filter_group_status: "Status",
    filter_group_date: "Data",
    filter_group_deadline: "Prazo",
    filter_group_priority: "Prioridade",
    filter_group_label: "Etiqueta",
    filter_group_project: "Projetos",
    view_display: "Exibi\xE7\xE3o",
    panel_layout: "Layout",
    panel_show_done: "Mostrar conclu\xEDdas",
    no_label: "Sem etiqueta",
    more_actions: "Mais"
  },
  fr: {
    view_today: "Aujourd'hui",
    view_upcoming: "\xC0 venir",
    view_recurring: "R\xE9currentes",
    view_done: "Termin\xE9es",
    status_todo: "\xC0 faire",
    status_doing: "En cours",
    status_done: "Termin\xE9",
    status_cancelled: "Annul\xE9e",
    layout_list: "Liste",
    layout_board: "Tableau",
    menu_cancel_task: "Annuler la t\xE2che",
    layout_calendar: "Calendrier",
    cal_prev: "Pr\xE9c\xE9dent",
    cal_next: "Suivant",
    cal_today: "Aujourd\u2019hui",
    cal_unscheduled: "Sans date",
    cal_unscheduled_empty: "Rien sans date",
    cal_mode_year: "Ann\xE9e",
    cal_tasks: "{0} t\xE2ches",
    cal_mode_month: "Mois",
    cal_mode_week: "Semaine",
    cal_mode_day: "Jour",
    cal_more: "+{0} autres",
    cal_allday: "Toute la journ\xE9e",
    tab_statuses: "Statuts",
    status_add: "Ajouter un statut",
    placeholder_status_name: "Nom du statut",
    status_reset_default: "R\xE9initialiser par d\xE9faut",
    confirm_reset_statuses_q: "R\xE9initialiser tous les statuts par d\xE9faut ?",
    status_hint: "Ce sont les colonnes du tableau Kanban \u2014 l'ordre = ordre des colonnes.",
    status_kind_open: "Ouvert",
    status_kind_done: "Termin\xE9",
    status_kind_cancelled: "Annul\xE9",
    role_new_tasks: "Nouvelles t\xE2ches",
    role_on_complete: "\xC0 la fin",
    role_trash: "Corbeille",
    status_pick_icon: "Ic\xF4ne",
    status_pick_color: "Couleur",
    status_color_none: "Aucune couleur",
    color_custom: "Couleur personnalis\xE9e",
    btn_move_up: "Monter",
    btn_move_down: "Descendre",
    status_need_done: "Gardez au moins un statut \xAB Termin\xE9 \xBB.",
    status_need_open: "Gardez au moins un statut ouvert.",
    status_need_kind: "Gardez au moins un statut par cat\xE9gorie.",
    status_only_one_trash: "Il n\u2019y a qu\u2019un seul statut corbeille.",
    status_reassigned: "{0} t\xE2ches d\xE9plac\xE9es vers {1}.",
    sort_by: "Trier",
    sort_manual: "Manuel",
    sort_name: "Nom",
    sort_count: "Nombre",
    whatsnew_title: "Nouveaut\xE9s",
    whatsnew_ok: "Compris",
    wn_cal_t: "Vue calendrier",
    wn_cal_d: "Ann\xE9e, mois, semaine et jour \u2013 glissez les t\xE2ches pour les replanifier.",
    wn_unsched_t: "Volet \xAB Sans date \xBB",
    wn_unsched_d: "T\xE2ches sans date, pr\xEAtes \xE0 glisser dans la grille.",
    wn_dir_t: "Sens du tri",
    wn_dir_d: "Croissant ou d\xE9croissant, pour chaque crit\xE8re.",
    wn_excl_t: "Inclure et exclure dans les filtres",
    wn_excl_d: "Marquez chaque valeur \u2713 inclure ou \u2212 exclure, m\xE9lang\xE9s dans le m\xEAme champ : \xE9tiquettes, projets et priorit\xE9s.",
    wn_fmode_t: "Mode : au moins un \xB7 tous \xB7 aucun",
    wn_fmode_d: "Par champ : au moins un (OU), tous (ET) ou aucun (NON).",
    wn_anytime_t: "p. ex. un filtre \xAB \xC0 tout moment \xBB",
    wn_anytime_d: "Sans date et sans une \xE9tiquette pr\xE9cise \u2014 d\xE9sormais dans un seul filtre.",
    wn_chips_t: "Personnalisez les puces",
    wn_chips_d: "Affichez, masquez et r\xE9organisez les puces dans l\u2019ajout rapide et l\u2019\xE9diteur complet s\xE9par\xE9ment, avec un menu + pour le reste.",
    wn_status_t: "Statuts robustes",
    wn_status_d: "Les statuts ont d\xE9sormais des cat\xE9gories garanties (ouvert \xB7 termin\xE9 \xB7 corbeille), un \xE9diteur group\xE9 par cat\xE9gorie et une corbeille qui fonctionne toujours.",
    wn_quickadd_t: "Ajout rapide complet",
    wn_quickadd_d: "L\u2019ajout rapide emporte tous les champs ; le bouton agrandir transmet tout \xE0 l\u2019\xE9diteur complet.",
    wn_reset_t: "Valeurs par d\xE9faut utiles",
    wn_reset_d: "Nouvelles dispositions par d\xE9faut et boutons pour r\xE9initialiser la disposition des puces et les statuts.",
    wn_gcal_t: "Synchronisation Google Agenda",
    wn_gcal_d: "Refl\xE8te les t\xE2ches dat\xE9es \u2014 la date et l'heure se synchronisent dans les deux sens.",
    wn_gcalcal_t: "Votre compte, votre agenda",
    wn_gcalcal_d: "Connectez-vous avec vos propres identifiants Google ; les \xE9v\xE9nements vont dans un agenda BeautyTasks d\xE9di\xE9.",
    wn_gcallist_t: "Contr\xF4le par liste",
    wn_gcallist_d: "Activez ou d\xE9sactivez la synchronisation d'un projet, d'un domaine ou de la bo\xEEte de r\xE9ception.",
    wn_gcalstat_t: "\xC9tat et conflits",
    wn_gcalstat_d: "Un indicateur dans la barre d'\xE9tat montre la synchronisation ; en cas de conflit, Obsidian l'emporte.",
    wn_board_t: "Tableau par regroupement",
    wn_board_d: "Le tableau Kanban suit d\xE9sormais votre regroupement : colonnes par statut, \xE9tiquette, priorit\xE9 ou projet \u2014 faites glisser les cartes entre les colonnes.",
    wn_langs_t: "8 nouvelles langues",
    wn_langs_d: "L\u2019interface est d\xE9sormais aussi disponible en espagnol, portugais, fran\xE7ais, turc, chinois, russe, japonais et italien.",
    wn_project_t: "Saisissez @ pour un projet",
    wn_project_d: "Dans l\u2019ajout rapide, attribuez une t\xE2che \xE0 un projet ou un domaine existant en saisissant @Nom.",
    wn_hidden_t: "Afficher les \xE9l\xE9ments masqu\xE9s",
    wn_hidden_d: "Faites un clic droit sur l'en-t\xEAte d'une section pour ramener les entr\xE9es masqu\xE9es en un clic.",
    wn_ui_t: "Am\xE9liorations de l\u2019interface",
    wn_ui_d: "Plus net et plus flexible : tri et regroupement dans Aujourd\u2019hui, une liste dat\xE9e dans \xC0 venir, et un menu sur chaque page de projet, d\u2019\xE9tiquette et de filtre.",
    nav_inbox: "Bo\xEEte de r\xE9ception",
    group_area: "Domaines",
    group_project: "Projets",
    sec_overdue: "En retard",
    sec_today: "Aujourd'hui",
    sec_upcoming: "\xC0 venir",
    sec_no_date: "Sans date",
    sec_done: "Termin\xE9es",
    count_task: "{0} t\xE2che",
    count_tasks: "{0} t\xE2ches",
    empty_nothing_scheduled: "Rien de planifi\xE9.",
    empty_nothing_recurring: "Aucune t\xE2che r\xE9currente.",
    empty_nothing_done: "Rien de termin\xE9 pour l'instant.",
    empty_nothing_today: "Rien pour aujourd'hui.",
    empty_no_project_tasks: "Aucune t\xE2che dans ce projet pour l'instant.",
    empty_no_area_tasks: "Aucune t\xE2che dans ce domaine pour l'instant.",
    empty_no_inbox_tasks: "Aucune t\xE2che dans la bo\xEEte de r\xE9ception pour l'instant.",
    empty_no_label_tasks: "Aucune t\xE2che avec cette \xE9tiquette pour l'instant.",
    empty_no_tasks: "Aucune t\xE2che pour l'instant.",
    btn_add_task: "Ajouter une t\xE2che",
    btn_cancel: "Annuler",
    btn_save: "Enregistrer",
    btn_delete: "Supprimer",
    details: "D\xE9tails",
    subtask: "Sous-t\xE2che",
    placeholder_subtask: "Sous-t\xE2che",
    log_placeholder: "Ajouter un commentaire \u2026",
    log_attach: "Joindre un fichier",
    log_link: "Lier une note",
    log_add: "Ajouter",
    log_edit: "Modifier",
    log_update: "Mettre \xE0 jour",
    log_link_placeholder: "Lier une note \u2026",
    btn_close: "Fermer",
    lb_prev: "Image pr\xE9c\xE9dente",
    lb_next: "Image suivante",
    lb_copy: "Copier l'image",
    msg_image_copied: "Image copi\xE9e dans le presse-papiers.",
    msg_image_copy_failed: "Impossible de copier l'image.",
    msg_attached: "Joint {0}",
    msg_attach_failed: "\xC9chec de la pi\xE8ce jointe : {0}",
    err_detail_save: "Impossible d'enregistrer les d\xE9tails.",
    placeholder_taskname: "Nom de la t\xE2che",
    placeholder_description: "Description \u2026",
    placeholder_date_input: "Saisir une date \u2026",
    placeholder_label: "\xC9tiquette",
    placeholder_project_name: "Nom du projet \u2026",
    placeholder_area_name: "Nom du domaine \u2026",
    chip_date: "Date",
    chip_priority: "Priorit\xE9",
    chip_label: "\xC9tiquettes",
    chip_recurrence: "R\xE9currence",
    chip_deadline: "Date limite",
    chip_parent: "T\xE2che parente",
    pick_parent: "D\xE9placer sous une t\xE2che \u2026",
    prio_1: "Priorit\xE9 1",
    prio_2: "Priorit\xE9 2",
    prio_3: "Priorit\xE9 3",
    prio_4: "Priorit\xE9 4",
    recur_none: "Aucune",
    recur_daily: "Quotidienne",
    recur_weekly: "Hebdomadaire",
    recur_monthly: "Mensuelle",
    recur_quarterly: "Trimestrielle",
    recur_yearly: "Annuelle",
    recur_basis: "Prochaine date \xE0 partir de",
    recur_when_done: "\xC0 la r\xE9alisation",
    pick_new_project: "Nouveau projet",
    pick_new_area: "Nouveau domaine",
    no_project: "Aucun projet",
    make_area: "Domaine",
    make_area_hint: "Les domaines sont permanents et ne peuvent \xEAtre ni supprim\xE9s ni archiv\xE9s.",
    manage: "G\xE9rer",
    manage_full: "Gestionnaire de listes",
    tab_active: "Actifs",
    tab_archive: "Archives",
    tab_labels: "\xC9tiquettes",
    add_label: "Nouvelle \xE9tiquette",
    manage_empty_labels: "Aucune \xE9tiquette utilis\xE9e pour l'instant.",
    tip_show_sidebar: "Afficher dans la barre lat\xE9rale",
    tip_hide_sidebar: "Masquer de la barre lat\xE9rale",
    tip_mark_area: "Convertir en domaine",
    tip_unmark_area: "Convertir en projet",
    btn_rename: "Renommer",
    btn_archive: "Archiver",
    btn_restore: "Restaurer",
    btn_delete_forever: "Supprimer d\xE9finitivement",
    confirm_delete_q: "Supprimer ?",
    confirm_delete_forever_q: "Supprimer d\xE9finitivement ?",
    menu_edit: "Modifier \u2026",
    menu_reorder: "Changer l'ordre \u2026",
    menu_reveal_hidden: "Afficher les masqu\xE9s",
    menu_goto_projects: "Aller \xE0 la vue des projets",
    menu_goto_areas: "Aller \xE0 la vue des domaines",
    menu_goto_labels: "Aller \xE0 la vue des \xE9tiquettes",
    menu_goto_filters: "Aller \xE0 la vue des filtres",
    reorder_active: "R\xE9organisation",
    reorder_done: "Termin\xE9",
    archive_undo: "Annuler",
    archived_notice: "\xAB {0} \xBB archiv\xE9.",
    confirm_delete_title: "Supprimer \xAB {0} \xBB ?",
    confirm_delete_body: "Cette action est irr\xE9versible.",
    manage_empty_active: "Aucun projet ni domaine pour l'instant.",
    manage_empty_archive: "Rien d'archiv\xE9.",
    manage_empty_projects: "Aucun projet pour l'instant.",
    manage_empty_areas: "Aucun domaine pour l'instant.",
    manage_no_active_hint: "Cr\xE9ez un projet depuis la bo\xEEte de dialogue de t\xE2che, puis convertissez-le en domaine ici si besoin.",
    date_today: "Aujourd'hui",
    date_yesterday: "Hier",
    date_tomorrow: "Demain",
    date_this_weekend: "Ce week-end",
    date_next_week: "La semaine prochaine",
    date_no_date: "Sans date",
    time_add: "Heure",
    time_label: "Heure",
    duration_label: "Dur\xE9e",
    err_enter_taskname: "Veuillez saisir un nom de t\xE2che.",
    err_parent_not_found: "T\xE2che parente introuvable.",
    cmd_new_task: "Nouvelle t\xE2che",
    cmd_quick_add: "Ajout rapide de t\xE2che",
    cmd_open_view: "Ouvrir {0}",
    cmd_count_tasks: "Compter les t\xE2ches",
    cmd_import: "Importer depuis Tasks/Lists",
    cmd_search: "Rechercher des t\xE2ches",
    cmd_whatsnew: "Afficher les nouveaut\xE9s",
    cmd_gcal_sync_now: "Synchroniser avec Google Agenda maintenant",
    cmd_export_json: "Exporter les t\xE2ches (JSON)",
    cmd_import_json: "Importer les t\xE2ches (JSON)",
    cmd_import_tasknotes: "Importer depuis TaskNotes",
    set_import_tn: "Importer depuis TaskNotes",
    set_import_tn_desc: "Migrez les t\xE2ches du plugin TaskNotes (conserv\xE9es comme notes Markdown).",
    set_import_tn_btn: "Importer depuis TaskNotes",
    set_gcal_heading: "Google Agenda",
    gcal_not_connected: "Non connect\xE9",
    gcal_setup_desc: `Synchronisez les t\xE2ches dat\xE9es avec Google Agenda. Utilise vos propres identifiants de l'API Google (configuration unique, ~5 min). Cr\xE9ez un client OAuth de type "Application de bureau" et collez son ID et son secret ci-dessous.`,
    gcal_help_btn: "Ouvrir le guide de configuration",
    gcal_setup_hint: "Premi\xE8re fois ? Le guide vous explique comment cr\xE9er les identifiants Google.",
    gcal_client_id: "ID client",
    gcal_client_secret: "Secret client",
    gcal_connect_btn: "Connecter",
    gcal_connecting: "Connexion\u2026",
    gcal_connect_failed: "\xC9chec de la connexion : {0}",
    gcal_connected_as: "Connect\xE9 en tant que {0}",
    gcal_disconnect_btn: "D\xE9connecter",
    gcal_last_synced: "Derni\xE8re synchronisation : {0}",
    gcal_never: "jamais",
    gcal_syncing: "Synchronisation\u2026",
    gcal_sync_error: "Erreur : {0}",
    gcal_sync_now_btn: "Synchroniser maintenant",
    gcal_target_calendar: "Agenda cible",
    gcal_target_calendar_desc: "Dans quel agenda les t\xE2ches dat\xE9es sont refl\xE9t\xE9es.",
    gcal_create_calendar_btn: "Cr\xE9er l'agenda BeautyTasks",
    gcal_create_calendar_desc: 'Cr\xE9ez un agenda "BeautyTasks" d\xE9di\xE9 et utilisez-le (les \xE9v\xE9nements existants seront d\xE9plac\xE9s \xE0 la prochaine synchronisation).',
    gcal_sync_list: "Synchroniser avec Google Agenda",
    gcal_tip_create: "Astuce : utilisez un agenda d\xE9di\xE9",
    gcal_tip_create_desc: "Cr\xE9ez votre propre agenda Google et migrez-y vos t\xE2ches (s\xE9paration nette de votre agenda principal).",
    gcal_create_calendar_failed: "Impossible de cr\xE9er l'agenda : {0} \u2014 vous devrez peut-\xEAtre vous d\xE9connecter et vous reconnecter (nouvelle autorisation).",
    gcal_no_calendar_warn: "Aucun agenda cible s\xE9lectionn\xE9 pour l'instant \u2014 choisissez-en un ci-dessous ou cr\xE9ez l'agenda BeautyTasks. Rien n'est synchronis\xE9 jusque-l\xE0.",
    gcal_enabled: "Synchroniser les t\xE2ches dat\xE9es",
    gcal_enabled_desc: "Refl\xE9ter comme \xE9v\xE9nement chaque t\xE2che ayant une date d'\xE9ch\xE9ance.",
    gcal_autosync: "Synchroniser automatiquement",
    gcal_autosync_desc: "Envoyer les modifications au fil de l'\xE9dition des t\xE2ches (sinon la synchronisation ne s'ex\xE9cute que sur commande).",
    gcal_advanced: "Avanc\xE9",
    gcal_on_create: "Ajouter les nouvelles t\xE2ches",
    gcal_on_update: "Envoyer les modifications aux \xE9v\xE9nements existants",
    gcal_on_delete: "Supprimer l'\xE9v\xE9nement quand la t\xE2che est supprim\xE9e ou sans date",
    gcal_remove_on_complete: "Supprimer l'\xE9v\xE9nement quand la t\xE2che est termin\xE9e",
    gcal_duration: "Dur\xE9e par d\xE9faut de l'\xE9v\xE9nement (minutes)",
    gcal_timezone: "Fuseau horaire",
    gcal_statusbar: "Afficher l'\xE9tat de synchronisation dans la barre d'\xE9tat",
    gcal_notify_conflicts: "Notifier en cas de conflit",
    gcal_device_prompt: "Ouvrez {0} et saisissez le code : {1}",
    gcal_reconnect_hint: "reconnectez-vous dans les param\xE8tres",
    gcal_conflicts_notice: "{0} conflit(s) r\xE9solu(s) \u2014 valeurs d'Obsidian conserv\xE9es",
    menu_gcal_exclude: "Exclure de la synchronisation Agenda",
    menu_gcal_include: "Inclure dans la synchronisation Agenda",
    tn_import_title: "Importer depuis TaskNotes",
    tn_import_desc: "Cr\xE9e de nouvelles notes BeautyTasks \xE0 partir de vos t\xE2ches TaskNotes. Vos fichiers TaskNotes restent intacts.",
    tn_import_tag: "\xC9tiquette de t\xE2che",
    tn_import_tag_desc: "\xC9tiquette du frontmatter qui marque une note comme t\xE2che TaskNotes.",
    tn_import_folder: "Dossier (facultatif)",
    tn_import_folder_desc: "Limiter \xE0 un dossier. Vide analyse tout le coffre.",
    tn_import_folder_ph: "ex. T\xE2ches",
    tn_import_found: "{0} notes de t\xE2che trouv\xE9es.",
    tn_import_none: "Aucune t\xE2che TaskNotes trouv\xE9e.",
    tn_import_btn: "Importer",
    tn_import_done: "Import\xE9es {0}, ignor\xE9es {1}.",
    tn_import_lossy: "{0} avec une r\xE9currence complexe ont conserv\xE9 l'original en note.",
    tn_import_failed: "\xC9chec de l'importation.",
    qa_placeholder: "ex. R\xE9diger le rapport demain p1 #important @travail",
    qa_added: "T\xE2che ajout\xE9e",
    qa_open_full: "Ouvrir dans l'\xE9diteur complet",
    nav_search: "Rechercher",
    search_placeholder: "Rechercher des t\xE2ches \u2026",
    search_exclude_archived: "Exclure les archives",
    notice_count: "BeautyTasks : {0} t\xE2ches ({1} ouvertes)",
    notice_import_running: "BeautyTasks : importation \u2026",
    notice_imported: "BeautyTasks : {0} t\xE2ches import\xE9es.",
    notice_import_failed: "BeautyTasks : \xE9chec de l'importation (voir la console).",
    notice_export_done: "BeautyTasks : export\xE9 vers {0}",
    notice_export_failed: "BeautyTasks : \xE9chec de l'exportation (voir la console).",
    notice_import_invalid: "BeautyTasks : fichier d'exportation non valide.",
    notice_import_summary: "BeautyTasks : {0} t\xE2ches ajout\xE9es, {1} ignor\xE9es.",
    import_pick_placeholder: "Choisir une exportation JSON \u2026",
    set_data_heading: "Import et export",
    set_export: "Exporter les t\xE2ches",
    set_export_desc: "Enregistre toutes les t\xE2ches dans un fichier JSON de votre coffre (sans perte).",
    set_export_btn: "Exporter",
    set_import: "Importer les t\xE2ches",
    set_import_desc: "Lit les t\xE2ches depuis une exportation JSON. Les t\xE2ches existantes sont ignor\xE9es (selon leur id).",
    set_import_vault_btn: "Depuis le coffre \u2026",
    set_import_os_btn: "Depuis un fichier \u2026",
    ribbon_open: "Ouvrir BeautyTasks",
    set_show_desc: "Afficher la description dans les listes",
    set_show_desc_desc: "Affiche un aper\xE7u d'une ligne de la description sous le titre de la t\xE2che.",
    set_chips_iconsonly: "Puces compactes (ic\xF4nes seules)",
    set_chips_iconsonly_desc: "Dans l'\xE9diteur de t\xE2ches, n'affiche que les ic\xF4nes des puces d'option vides (Date, Priorit\xE9, \xC9tiquette \u2026) ; le nom appara\xEEt en infobulle. Les puces ayant une valeur l'affichent toujours.",
    task_actions: "Actions de t\xE2che",
    chip_status: "Statut",
    more_chip_actions: "Plus d\u2019actions",
    edit_task_actions: "Modifier les actions de t\xE2che",
    set_chip_actions: "Actions de t\xE2che (puces de saisie)",
    set_chip_actions_desc: "Configurez l\u2019ajout rapide et l\u2019\xE9diteur complet s\xE9par\xE9ment. Faites glisser chaque puce dans une section : Toujours afficher, Afficher si renseign\xE9 ou Seulement dans le menu +. L\u2019ordre = ordre des puces.",
    chip_tier_shown: "Toujours afficher",
    chip_tier_onValue: "Afficher si renseign\xE9",
    chip_tier_hidden: "Seulement dans le menu +",
    chip_surface_editor: "\xC9diteur complet",
    chip_surface_quickadd: "Ajout rapide",
    chip_reset_default: "R\xE9initialiser par d\xE9faut",
    menu_create_subtask: "Cr\xE9er une sous-t\xE2che",
    menu_show_parent: "Afficher la t\xE2che parente",
    menu_duplicate: "Dupliquer la t\xE2che",
    menu_copy_link: "Copier le lien vers la t\xE2che",
    menu_open_obsidian: "Ouvrir dans Obsidian",
    menu_open_editor: "Ouvrir dans l'\xE9diteur",
    menu_print: "Imprimer",
    copy_suffix: "(Copie)",
    msg_duplicated: "T\xE2che dupliqu\xE9e",
    msg_link_copied: "Lien copi\xE9",
    msg_link_copy_failed: "Impossible de copier le lien.",
    set_folders_heading: "Dossiers",
    set_folder_items: "Dossier des t\xE2ches",
    set_folder_items_desc: "O\xF9 sont cr\xE9\xE9es les nouvelles notes de t\xE2che.",
    set_folder_projects: "Dossier des projets",
    set_folder_projects_desc: "O\xF9 sont cr\xE9\xE9es les notes de projet et de domaine.",
    set_folder_attachments: "Dossier des pi\xE8ces jointes",
    set_folder_attachments_desc: "O\xF9 sont stock\xE9s les fichiers coll\xE9s ou joints.",
    set_behavior_heading: "Comportement",
    set_language: "Langue",
    set_language_desc: "Langue de l'interface.",
    set_language_auto: "Automatique (suivre Obsidian)",
    set_start_view: "Vue \xE0 l'ouverture",
    set_start_view_desc: "Quelle vue s'ouvre au d\xE9marrage.",
    set_start_view_last: "Derni\xE8re utilis\xE9e",
    set_nl: "D\xE9tecter la date et les #\xE9tiquettes dans le titre",
    set_nl_desc: "Analyse automatiquement les dates d'\xE9ch\xE9ance et les #\xE9tiquettes pendant la saisie du titre.",
    nav_trash: "Corbeille",
    empty_trash: "La corbeille est vide.",
    trash_restore_all: "Tout restaurer",
    trash_empty: "Vider la corbeille",
    confirm_empty_trash_q: "Vider la corbeille ?",
    msg_restored: "\xAB {0} \xBB restaur\xE9e.",
    msg_trash_empty: "La corbeille est d\xE9j\xE0 vide.",
    msg_trash_emptied: "Corbeille vid\xE9e \u2013 {0} t\xE2che(s) supprim\xE9e(s) d\xE9finitivement.",
    report_trash_empty_restore: "La corbeille est vide \u2013 rien \xE0 restaurer.",
    report_tasks_restored: "{0} t\xE2che(s) restaur\xE9e(s).",
    rem_at_time: "\xC0 l'heure de la t\xE2che",
    rem_before: "{0} avant",
    rem_unit_min: "{0} min",
    rem_unit_hour: "{0} h",
    rem_unit_day: "{0} jour",
    rem_unit_days: "{0} jours",
    chip_reminder: "Rappel",
    rem_count: "{0} rappels",
    reminders_title: "Rappels",
    rem_tab_relative: "Avant la t\xE2che",
    rem_tab_absolute: "Date et heure\u2026",
    rem_need_time: "D\xE9finissez d'abord une heure",
    rem_add: "Ajouter un rappel",
    date_confirm: "Appliquer",
    nav_filters: "Filtres",
    filter_add: "Nouveau filtre",
    sec_tasks: "T\xE2ches",
    manage_empty_filters: "Aucun filtre pour l'instant.",
    nav_toggle_section: "R\xE9duire ou d\xE9velopper la section",
    new_project_title: "Nouveau projet",
    new_area_title: "Nouveau domaine",
    new_label_title: "Nouvelle \xE9tiquette",
    edit_project_title: "Modifier le projet",
    edit_area_title: "Modifier le domaine",
    edit_label_title: "Modifier l'\xE9tiquette",
    show_in_sidebar: "Afficher dans la barre lat\xE9rale",
    create_filter: "Cr\xE9er un filtre",
    create_label: "Cr\xE9er une \xE9tiquette",
    create_project: "Cr\xE9er un projet",
    create_area: "Cr\xE9er un domaine",
    btn_create: "Cr\xE9er",
    new_need_name: "Veuillez saisir un nom.",
    new_preview_hint: "Aper\xE7u",
    empty_no_filter: "Ce filtre n'existe plus.",
    empty_no_filter_tasks: "Aucune t\xE2che ne correspond \xE0 ce filtre.",
    filter_new: "Nouveau filtre",
    filter_edit: "Modifier le filtre",
    filter_name: "Nom",
    filter_name_ph: "Nom du filtre \u2026",
    filter_arrange: "Organiser",
    filter_facets: "Filtrer",
    filter_dir: "Sens",
    filter_dir_asc: "Croissant",
    filter_dir_desc: "D\xE9croissant",
    filter_sort: "Trier",
    filter_group: "Grouper",
    filter_show_done: "Inclure les termin\xE9es",
    filter_range: "P\xE9riode",
    filter_priorities: "Priorit\xE9",
    filter_labels: "\xC9tiquettes",
    filter_projects: "Projets",
    filter_search: "Rechercher",
    filter_search_ph: "Texte dans le titre \u2026",
    filter_reset: "R\xE9initialiser",
    filter_delete: "Supprimer",
    filter_save: "Enregistrer",
    filter_need_name: "Veuillez saisir un nom.",
    filter_name_taken: "Un filtre portant ce nom existe d\xE9j\xE0.",
    filter_facets_active: "{0} actifs",
    filter_all: "Tous",
    filter_n_selected: "{0} s\xE9lectionn\xE9s",
    filter_n_criteria: "{0} crit\xE8res s\xE9lectionn\xE9s",
    filter_mode_lead: "Mode de filtre",
    filter_mode_any: "l'un",
    filter_mode_all: "tous",
    filter_mode_none: "aucun",
    filter_mode_s_any: "Au moins un doit correspondre.",
    filter_mode_s_all: "Tous doivent correspondre.",
    filter_mode_s_none: "Aucun ne doit correspondre.",
    filter_range_any: "Toutes",
    filter_range_overdue: "En retard",
    filter_range_today: "Aujourd'hui et en retard",
    filter_range_next7: "7 prochains jours",
    filter_range_nodate: "Sans date",
    filter_sort_smart: "Intelligent",
    filter_sort_due: "Date",
    filter_sort_deadline: "Date limite",
    filter_sort_priority: "Priorit\xE9",
    filter_sort_created: "Cr\xE9ation",
    filter_sort_title: "Nom",
    filter_group_none: "Aucun",
    filter_group_status: "Statut",
    filter_group_date: "Date",
    filter_group_deadline: "Date limite",
    filter_group_priority: "Priorit\xE9",
    filter_group_label: "\xC9tiquette",
    filter_group_project: "Projets",
    view_display: "Affichage",
    panel_layout: "Disposition",
    panel_show_done: "Afficher les termin\xE9es",
    no_label: "Sans \xE9tiquette",
    more_actions: "Plus"
  },
  tr: {
    view_today: "Bug\xFCn",
    view_upcoming: "Yakla\u015Fan",
    view_recurring: "Yinelenen",
    view_done: "Tamamlanan",
    status_todo: "Yap\u0131lacak",
    status_doing: "Devam ediyor",
    status_done: "Bitti",
    status_cancelled: "\u0130ptal edildi",
    layout_list: "Liste",
    layout_board: "Pano",
    menu_cancel_task: "G\xF6revi iptal et",
    layout_calendar: "Takvim",
    cal_prev: "\xD6nceki",
    cal_next: "Sonraki",
    cal_today: "Bug\xFCn",
    cal_unscheduled: "Tarihsiz",
    cal_unscheduled_empty: "Tarihsiz g\xF6rev yok",
    cal_mode_year: "Y\u0131l",
    cal_tasks: "{0} g\xF6rev",
    cal_mode_month: "Ay",
    cal_mode_week: "Hafta",
    cal_mode_day: "G\xFCn",
    cal_more: "+{0} daha",
    cal_allday: "T\xFCm g\xFCn",
    tab_statuses: "Durumlar",
    status_add: "Durum ekle",
    placeholder_status_name: "Durum ad\u0131",
    status_reset_default: "Varsay\u0131lana s\u0131f\u0131rla",
    confirm_reset_statuses_q: "T\xFCm durumlar varsay\u0131lana s\u0131f\u0131rlans\u0131n m\u0131?",
    status_hint: "Bunlar Kanban panosunun s\xFCtunlar\u0131d\u0131r \u2014 s\u0131ralama = s\xFCtun s\u0131ras\u0131.",
    status_kind_open: "A\xE7\u0131k",
    status_kind_done: "Bitti",
    status_kind_cancelled: "\u0130ptal edildi",
    role_new_tasks: "Yeni g\xF6revler",
    role_on_complete: "Tamamlan\u0131nca",
    role_trash: "\xC7\xF6p kutusu",
    status_pick_icon: "Simge",
    status_pick_color: "Renk",
    status_color_none: "Renk yok",
    color_custom: "\xD6zel renk",
    btn_move_up: "Yukar\u0131 ta\u015F\u0131",
    btn_move_down: "A\u015Fa\u011F\u0131 ta\u015F\u0131",
    status_need_done: "En az bir \xABBitti\xBB durumu b\u0131rak\u0131n.",
    status_need_open: "En az bir a\xE7\u0131k durum b\u0131rak\u0131n.",
    status_need_kind: "Her kategoride en az bir durum b\u0131rak\u0131n.",
    status_only_one_trash: "Yaln\u0131zca bir \xE7\xF6p durumu vard\u0131r.",
    status_reassigned: "{0} g\xF6rev {1} durumuna ta\u015F\u0131nd\u0131.",
    sort_by: "S\u0131rala",
    sort_manual: "Elle",
    sort_name: "Ad",
    sort_count: "Say\u0131",
    whatsnew_title: "Yenilikler",
    whatsnew_ok: "Anlad\u0131m",
    wn_cal_t: "Takvim g\xF6r\xFCn\xFCm\xFC",
    wn_cal_d: "Y\u0131l, ay, hafta ve g\xFCn \u2013 g\xF6revleri s\xFCr\xFCkleyerek yeniden planlay\u0131n.",
    wn_unsched_t: "\u201ETarihsiz\u201C kenar \xE7ubu\u011Fu",
    wn_unsched_d: "Tarihi olmayan g\xF6revler, \u0131zgaraya s\xFCr\xFCklemeye haz\u0131r.",
    wn_dir_t: "S\u0131ralama y\xF6n\xFC",
    wn_dir_d: "Her \xF6l\xE7\xFCt i\xE7in artan veya azalan.",
    wn_excl_t: "Filtrede dahil etme ve hari\xE7 tutma",
    wn_excl_d: "Her de\u011Feri \u2713 dahil et veya \u2212 hari\xE7 tut olarak i\u015Faretle \u2014 ayn\u0131 alanda kar\u0131\u015F\u0131k; etiketler, projeler ve \xF6ncelikler.",
    wn_fmode_t: "Mod: biri \xB7 hepsi \xB7 hi\xE7biri",
    wn_fmode_d: "Alan ba\u015F\u0131na: en az biri (VEYA), hepsi (VE) veya hi\xE7biri (DE\u011E\u0130L).",
    wn_anytime_t: "\xF6rn. bir \u201CHer zaman\u201D filtresi",
    wn_anytime_d: "Tarihsiz ve belirli bir etiket olmadan \u2014 art\u0131k tek bir filtrede.",
    wn_chips_t: "Giri\u015F \xE7iplerini \xF6zelle\u015Ftirin",
    wn_chips_d: "H\u0131zl\u0131 ekleme ve tam d\xFCzenleyicideki \xE7ipleri ayr\u0131 ayr\u0131 g\xF6sterin, gizleyin ve yeniden s\u0131ralay\u0131n; gerisi i\xE7in + men\xFCs\xFC.",
    wn_status_t: "Sa\u011Flam durumlar",
    wn_status_d: "Durumlar\u0131n art\u0131k garantili kategorileri (a\xE7\u0131k \xB7 bitti \xB7 \xE7\xF6p), kategoriye g\xF6re gruplanm\u0131\u015F bir d\xFCzenleyici ve her zaman \xE7al\u0131\u015Fan bir \xE7\xF6p kutusu var.",
    wn_quickadd_t: "Eksiksiz h\u0131zl\u0131 ekleme",
    wn_quickadd_d: "H\u0131zl\u0131 ekleme t\xFCm alanlar\u0131 ta\u015F\u0131r; b\xFCy\xFCt d\xFC\u011Fmesi her \u015Feyi tam d\xFCzenleyiciye aktar\u0131r.",
    wn_reset_t: "Makul varsay\u0131lanlar",
    wn_reset_d: "Yeni varsay\u0131lan d\xFCzenler ve \xE7ip d\xFCzenini ve durumlar\u0131 s\u0131f\u0131rlama d\xFC\u011Fmeleri.",
    wn_gcal_t: "Google Takvim e\u015Fitlemesi",
    wn_gcal_d: "Biti\u015F tarihi olan g\xF6revleri yans\u0131t \u2014 tarih ve saat iki y\xF6nde e\u015Fitlenir.",
    wn_gcalcal_t: "Kendi hesab\u0131n, kendi takvimin",
    wn_gcalcal_d: "Kendi Google kimlik bilgilerinle ba\u011Flan; etkinlikler \xF6zel bir BeautyTasks takvimine gider.",
    wn_gcallist_t: "Liste baz\u0131nda kontrol",
    wn_gcallist_d: "Herhangi bir proje, alan veya gelen kutusu i\xE7in e\u015Fitlemeyi a\xE7/kapat.",
    wn_gcalstat_t: "Durum ve \xE7ak\u0131\u015Fmalar",
    wn_gcalstat_d: "Durum \xE7ubu\u011Fundaki g\xF6sterge e\u015Fitleme durumunu g\xF6sterir; \xE7ak\u0131\u015Fmada Obsidian kazan\u0131r.",
    wn_board_t: "Gruplamaya g\xF6re pano",
    wn_board_d: "Kanban panosu art\u0131k gruplaman\u0131z\u0131 izliyor: durum, etiket, \xF6ncelik veya projeye g\xF6re s\xFCtunlar \u2014 kartlar\u0131 s\xFCtunlar aras\u0131nda s\xFCr\xFCkleyin.",
    wn_langs_t: "8 yeni dil",
    wn_langs_d: "Aray\xFCz art\u0131k \u0130spanyolca, Portekizce, Frans\u0131zca, T\xFCrk\xE7e, \xC7ince, Rus\xE7a, Japonca ve \u0130talyanca dillerinde de mevcut.",
    wn_project_t: "Proje i\xE7in @ yaz\u0131n",
    wn_project_d: "H\u0131zl\u0131 eklemede, @Ad yazarak bir g\xF6revi mevcut bir projeye veya alana atay\u0131n.",
    wn_hidden_t: "Gizli \xF6\u011Feleri g\xF6ster",
    wn_hidden_d: "Gizli giri\u015Fleri tek t\u0131kla geri getirmek i\xE7in bir b\xF6l\xFCm ba\u015Fl\u0131\u011F\u0131na sa\u011F t\u0131klay\u0131n.",
    wn_ui_t: "Aray\xFCz iyile\u015Ftirmeleri",
    wn_ui_d: "Daha d\xFCzenli ve esnek: Bug\xFCn\u2019de s\u0131ralama ve gruplama, Yakla\u015Fan\u2019da tarihli bir ajanda ve her proje, etiket ve filtre sayfas\u0131nda bir men\xFC.",
    nav_inbox: "Gelen kutusu",
    group_area: "Alanlar",
    group_project: "Projeler",
    sec_overdue: "Gecikmi\u015F",
    sec_today: "Bug\xFCn",
    sec_upcoming: "Yakla\u015Fan",
    sec_no_date: "Tarihsiz",
    sec_done: "Tamamlanan",
    count_task: "{0} g\xF6rev",
    count_tasks: "{0} g\xF6rev",
    empty_nothing_scheduled: "Planlanm\u0131\u015F bir \u015Fey yok.",
    empty_nothing_recurring: "Yinelenen g\xF6rev yok.",
    empty_nothing_done: "Hen\xFCz tamamlanan bir \u015Fey yok.",
    empty_nothing_today: "Bug\xFCn i\xE7in bir \u015Fey yok.",
    empty_no_project_tasks: "Bu projede hen\xFCz g\xF6rev yok.",
    empty_no_area_tasks: "Bu alanda hen\xFCz g\xF6rev yok.",
    empty_no_inbox_tasks: "Gelen kutusunda hen\xFCz g\xF6rev yok.",
    empty_no_label_tasks: "Bu etikete sahip hen\xFCz g\xF6rev yok.",
    empty_no_tasks: "Hen\xFCz g\xF6rev yok.",
    btn_add_task: "G\xF6rev ekle",
    btn_cancel: "\u0130ptal",
    btn_save: "Kaydet",
    btn_delete: "Sil",
    details: "Ayr\u0131nt\u0131lar",
    subtask: "Alt g\xF6rev",
    placeholder_subtask: "Alt g\xF6rev",
    log_placeholder: "Yorum ekle \u2026",
    log_attach: "Dosya ekle",
    log_link: "Not ba\u011Fla",
    log_add: "Ekle",
    log_edit: "D\xFCzenle",
    log_update: "G\xFCncelle",
    log_link_placeholder: "Bir not ba\u011Fla \u2026",
    btn_close: "Kapat",
    lb_prev: "\xD6nceki g\xF6rsel",
    lb_next: "Sonraki g\xF6rsel",
    lb_copy: "G\xF6rseli kopyala",
    msg_image_copied: "G\xF6rsel panoya kopyaland\u0131.",
    msg_image_copy_failed: "G\xF6rsel kopyalanamad\u0131.",
    msg_attached: "{0} eklendi",
    msg_attach_failed: "Ekleme ba\u015Far\u0131s\u0131z: {0}",
    err_detail_save: "Ayr\u0131nt\u0131lar kaydedilemedi.",
    placeholder_taskname: "G\xF6rev ad\u0131",
    placeholder_description: "A\xE7\u0131klama \u2026",
    placeholder_date_input: "Tarih girin \u2026",
    placeholder_label: "Etiket",
    placeholder_project_name: "Proje ad\u0131 \u2026",
    placeholder_area_name: "Alan ad\u0131 \u2026",
    chip_date: "Tarih",
    chip_priority: "\xD6ncelik",
    chip_label: "Etiketler",
    chip_recurrence: "Yineleme",
    chip_deadline: "Son tarih",
    chip_parent: "\xDCst g\xF6rev",
    pick_parent: "Bir g\xF6revin alt\u0131na ta\u015F\u0131 \u2026",
    prio_1: "\xD6ncelik 1",
    prio_2: "\xD6ncelik 2",
    prio_3: "\xD6ncelik 3",
    prio_4: "\xD6ncelik 4",
    recur_none: "Yok",
    recur_daily: "G\xFCnl\xFCk",
    recur_weekly: "Haftal\u0131k",
    recur_monthly: "Ayl\u0131k",
    recur_quarterly: "\xDC\xE7 ayl\u0131k",
    recur_yearly: "Y\u0131ll\u0131k",
    recur_basis: "Sonraki tarih \u015Fundan",
    recur_when_done: "Tamamlan\u0131nca",
    pick_new_project: "Yeni proje",
    pick_new_area: "Yeni alan",
    no_project: "Projesiz",
    make_area: "Alan",
    make_area_hint: "Alanlar kal\u0131c\u0131d\u0131r; silinemez veya ar\u015Fivlenemez.",
    manage: "Y\xF6net",
    manage_full: "Liste y\xF6neticisi",
    tab_active: "Etkin",
    tab_archive: "Ar\u015Fiv",
    tab_labels: "Etiketler",
    add_label: "Yeni etiket",
    manage_empty_labels: "Hen\xFCz kullan\u0131lan etiket yok.",
    tip_show_sidebar: "Kenar \xE7ubu\u011Funda g\xF6ster",
    tip_hide_sidebar: "Kenar \xE7ubu\u011Fundan gizle",
    tip_mark_area: "Alana d\xF6n\xFC\u015Ft\xFCr",
    tip_unmark_area: "Projeye d\xF6n\xFC\u015Ft\xFCr",
    btn_rename: "Yeniden adland\u0131r",
    btn_archive: "Ar\u015Fivle",
    btn_restore: "Geri y\xFCkle",
    btn_delete_forever: "Kal\u0131c\u0131 olarak sil",
    confirm_delete_q: "Silinsin mi?",
    confirm_delete_forever_q: "Kal\u0131c\u0131 olarak silinsin mi?",
    menu_edit: "D\xFCzenle \u2026",
    menu_reorder: "S\u0131ray\u0131 de\u011Fi\u015Ftir \u2026",
    menu_reveal_hidden: "Gizlileri g\xF6ster",
    menu_goto_projects: "Projeler g\xF6r\xFCn\xFCm\xFCne git",
    menu_goto_areas: "Alanlar g\xF6r\xFCn\xFCm\xFCne git",
    menu_goto_labels: "Etiketler g\xF6r\xFCn\xFCm\xFCne git",
    menu_goto_filters: "Filtreler g\xF6r\xFCn\xFCm\xFCne git",
    reorder_active: "Yeniden s\u0131ralan\u0131yor",
    reorder_done: "Bitti",
    archive_undo: "Geri al",
    archived_notice: "\xAB{0}\xBB ar\u015Fivlendi.",
    confirm_delete_title: "\xAB{0}\xBB silinsin mi?",
    confirm_delete_body: "Bu i\u015Flem geri al\u0131namaz.",
    manage_empty_active: "Hen\xFCz proje veya alan yok.",
    manage_empty_archive: "Ar\u015Fivde bir \u015Fey yok.",
    manage_empty_projects: "Hen\xFCz proje yok.",
    manage_empty_areas: "Hen\xFCz alan yok.",
    manage_no_active_hint: "G\xF6rev penceresinden bir proje olu\u015Fturun, ard\u0131ndan gerekirse burada alana d\xF6n\xFC\u015Ft\xFCr\xFCn.",
    date_today: "Bug\xFCn",
    date_yesterday: "D\xFCn",
    date_tomorrow: "Yar\u0131n",
    date_this_weekend: "Bu hafta sonu",
    date_next_week: "Gelecek hafta",
    date_no_date: "Tarihsiz",
    time_add: "Saat",
    time_label: "Saat",
    duration_label: "S\xFCre",
    err_enter_taskname: "L\xFCtfen bir g\xF6rev ad\u0131 girin.",
    err_parent_not_found: "\xDCst g\xF6rev bulunamad\u0131.",
    cmd_new_task: "Yeni g\xF6rev",
    cmd_quick_add: "H\u0131zl\u0131 g\xF6rev ekle",
    cmd_open_view: "{0} a\xE7",
    cmd_count_tasks: "G\xF6revleri say",
    cmd_import: "Tasks/Lists'ten i\xE7e aktar",
    cmd_search: "G\xF6rev ara",
    cmd_whatsnew: "Yenilikleri g\xF6ster",
    cmd_gcal_sync_now: "\u015Eimdi Google Takvim ile e\u015Fitle",
    cmd_export_json: "G\xF6revleri d\u0131\u015Fa aktar (JSON)",
    cmd_import_json: "G\xF6revleri i\xE7e aktar (JSON)",
    cmd_import_tasknotes: "TaskNotes'tan i\xE7e aktar",
    set_import_tn: "TaskNotes'tan i\xE7e aktar",
    set_import_tn_desc: "TaskNotes eklentisinden g\xF6revleri ta\u015F\u0131y\u0131n (Markdown notlar\u0131 olarak korunur).",
    set_import_tn_btn: "TaskNotes'tan i\xE7e aktar",
    set_gcal_heading: "Google Takvim",
    gcal_not_connected: "Ba\u011Fl\u0131 de\u011Fil",
    gcal_setup_desc: 'Tarihli g\xF6revleri Google Takvim ile e\u015Fitleyin. Kendi Google API kimlik bilgilerinizi kullan\u0131r (tek seferlik kurulum, ~5 dk). "Masa\xFCst\xFC uygulamas\u0131" t\xFCr\xFCnde bir OAuth istemcisi olu\u015Fturun ve kimli\u011Fi ile gizli anahtar\u0131 a\u015Fa\u011F\u0131ya yap\u0131\u015Ft\u0131r\u0131n.',
    gcal_help_btn: "Kurulum k\u0131lavuzunu a\xE7",
    gcal_setup_hint: "\u0130lk kez mi? K\u0131lavuz, Google kimlik bilgilerini olu\u015Fturma ad\u0131mlar\u0131nda size yol g\xF6sterir.",
    gcal_client_id: "\u0130stemci kimli\u011Fi",
    gcal_client_secret: "\u0130stemci gizli anahtar\u0131",
    gcal_connect_btn: "Ba\u011Flan",
    gcal_connecting: "Ba\u011Flan\u0131yor\u2026",
    gcal_connect_failed: "Ba\u011Flant\u0131 ba\u015Far\u0131s\u0131z: {0}",
    gcal_connected_as: "{0} olarak ba\u011Fl\u0131",
    gcal_disconnect_btn: "Ba\u011Flant\u0131y\u0131 kes",
    gcal_last_synced: "Son e\u015Fitleme: {0}",
    gcal_never: "hi\xE7",
    gcal_syncing: "E\u015Fitleniyor\u2026",
    gcal_sync_error: "Hata: {0}",
    gcal_sync_now_btn: "\u015Eimdi e\u015Fitle",
    gcal_target_calendar: "Hedef takvim",
    gcal_target_calendar_desc: "Tarihli g\xF6revlerin hangi takvime yans\u0131t\u0131laca\u011F\u0131.",
    gcal_create_calendar_btn: "BeautyTasks takvimi olu\u015Ftur",
    gcal_create_calendar_desc: '\xD6zel bir "BeautyTasks" takvimi olu\u015Fturup kullan\u0131n (mevcut etkinlikler sonraki e\u015Fitlemede ta\u015F\u0131n\u0131r).',
    gcal_sync_list: "Google Takvim ile e\u015Fitle",
    gcal_tip_create: "\u0130pucu: \xF6zel bir takvim kullan\u0131n",
    gcal_tip_create_desc: "Kendi Google takviminizi olu\u015Fturun ve g\xF6revlerinizi oraya ta\u015F\u0131y\u0131n (ana takviminizden temiz bir ayr\u0131m).",
    gcal_create_calendar_failed: "Takvim olu\u015Fturulamad\u0131: {0} \u2014 ba\u011Flant\u0131y\u0131 kesip yeniden ba\u011Flanman\u0131z gerekebilir (yeni izin).",
    gcal_no_calendar_warn: "Hen\xFCz hedef takvim se\xE7ilmedi \u2014 a\u015Fa\u011F\u0131dan birini se\xE7in veya BeautyTasks takvimini olu\u015Fturun. O zamana kadar hi\xE7bir \u015Fey e\u015Fitlenmez.",
    gcal_enabled: "Tarihli g\xF6revleri e\u015Fitle",
    gcal_enabled_desc: "Biti\u015F tarihi olan her g\xF6revi etkinlik olarak yans\u0131t.",
    gcal_autosync: "Otomatik e\u015Fitle",
    gcal_autosync_desc: "G\xF6revleri d\xFCzenlerken de\u011Fi\u015Fiklikleri g\xF6nderir (aksi halde e\u015Fitleme yaln\u0131zca komutla \xE7al\u0131\u015F\u0131r).",
    gcal_advanced: "Geli\u015Fmi\u015F",
    gcal_on_create: "Yeni g\xF6revleri ekle",
    gcal_on_update: "De\u011Fi\u015Fiklikleri mevcut etkinliklere g\xF6nder",
    gcal_on_delete: "G\xF6rev silindi\u011Finde veya tarihi kald\u0131r\u0131ld\u0131\u011F\u0131nda etkinli\u011Fi kald\u0131r",
    gcal_remove_on_complete: "G\xF6rev tamamland\u0131\u011F\u0131nda etkinli\u011Fi kald\u0131r",
    gcal_duration: "Varsay\u0131lan etkinlik s\xFCresi (dakika)",
    gcal_timezone: "Saat dilimi",
    gcal_statusbar: "E\u015Fitleme durumunu durum \xE7ubu\u011Funda g\xF6ster",
    gcal_notify_conflicts: "\xC7ak\u0131\u015Fmalarda bildir",
    gcal_device_prompt: "{0} adresini a\xE7\u0131n ve kodu girin: {1}",
    gcal_reconnect_hint: "ayarlardan yeniden ba\u011Flan\u0131n",
    gcal_conflicts_notice: "{0} \xE7ak\u0131\u015Fma \xE7\xF6z\xFCld\xFC \u2014 Obsidian de\u011Ferleri korundu",
    menu_gcal_exclude: "Takvim e\u015Fitlemesinden \xE7\u0131kar",
    menu_gcal_include: "Takvim e\u015Fitlemesine ekle",
    tn_import_title: "TaskNotes'tan i\xE7e aktar",
    tn_import_desc: "TaskNotes g\xF6revlerinizden yeni BeautyTasks notlar\u0131 olu\u015Fturur. TaskNotes dosyalar\u0131n\u0131za dokunulmaz.",
    tn_import_tag: "G\xF6rev etiketi",
    tn_import_tag_desc: "Bir notu TaskNotes g\xF6revi olarak i\u015Faretleyen frontmatter etiketi.",
    tn_import_folder: "Klas\xF6r (iste\u011Fe ba\u011Fl\u0131)",
    tn_import_folder_desc: "Bir klas\xF6rle s\u0131n\u0131rla. Bo\u015F b\u0131rak\u0131l\u0131rsa t\xFCm kasa taran\u0131r.",
    tn_import_folder_ph: "\xF6rn. G\xF6revler",
    tn_import_found: "{0} g\xF6rev notu bulundu.",
    tn_import_none: "TaskNotes g\xF6revi bulunamad\u0131.",
    tn_import_btn: "\u0130\xE7e aktar",
    tn_import_done: "{0} i\xE7e aktar\u0131ld\u0131, {1} atland\u0131.",
    tn_import_lossy: "Karma\u015F\u0131k yinelemeye sahip {0} g\xF6rev, orijinali not olarak korudu.",
    tn_import_failed: "\u0130\xE7e aktarma ba\u015Far\u0131s\u0131z.",
    qa_placeholder: "\xF6rn. Yar\u0131n rapor yaz p1 #\xF6nemli @i\u015F",
    qa_added: "G\xF6rev eklendi",
    qa_open_full: "Tam d\xFCzenleyicide a\xE7",
    nav_search: "Ara",
    search_placeholder: "G\xF6rev ara \u2026",
    search_exclude_archived: "Ar\u015Fivi hari\xE7 tut",
    notice_count: "BeautyTasks: {0} g\xF6rev ({1} a\xE7\u0131k)",
    notice_import_running: "BeautyTasks: i\xE7e aktar\u0131l\u0131yor \u2026",
    notice_imported: "BeautyTasks: {0} g\xF6rev i\xE7e aktar\u0131ld\u0131.",
    notice_import_failed: "BeautyTasks: i\xE7e aktarma ba\u015Far\u0131s\u0131z (konsola bak\u0131n).",
    notice_export_done: "BeautyTasks: {0} konumuna d\u0131\u015Fa aktar\u0131ld\u0131",
    notice_export_failed: "BeautyTasks: d\u0131\u015Fa aktarma ba\u015Far\u0131s\u0131z (konsola bak\u0131n).",
    notice_import_invalid: "BeautyTasks: ge\xE7erli bir d\u0131\u015Fa aktarma dosyas\u0131 de\u011Fil.",
    notice_import_summary: "BeautyTasks: {0} g\xF6rev eklendi, {1} atland\u0131.",
    import_pick_placeholder: "Bir JSON d\u0131\u015Fa aktar\u0131m\u0131 se\xE7in \u2026",
    set_data_heading: "\u0130\xE7e ve d\u0131\u015Fa aktarma",
    set_export: "G\xF6revleri d\u0131\u015Fa aktar",
    set_export_desc: "T\xFCm g\xF6revleri kasan\u0131za JSON dosyas\u0131 olarak kaydeder (kay\u0131ps\u0131z).",
    set_export_btn: "D\u0131\u015Fa aktar",
    set_import: "G\xF6revleri i\xE7e aktar",
    set_import_desc: "G\xF6revleri bir JSON d\u0131\u015Fa aktar\u0131m\u0131ndan okur. Var olan g\xF6revler atlan\u0131r (id ile e\u015Fle\u015Fir).",
    set_import_vault_btn: "Kasadan \u2026",
    set_import_os_btn: "Dosyadan \u2026",
    ribbon_open: "BeautyTasks'\u0131 a\xE7",
    set_show_desc: "A\xE7\u0131klamay\u0131 listelerde g\xF6ster",
    set_show_desc_desc: "G\xF6rev ba\u015Fl\u0131\u011F\u0131n\u0131n alt\u0131nda tek sat\u0131rl\u0131k bir a\xE7\u0131klama \xF6nizlemesi g\xF6sterir.",
    set_chips_iconsonly: "S\u0131k\u0131\u015F\u0131k \xE7ipler (yaln\u0131zca simgeler)",
    set_chips_iconsonly_desc: "G\xF6rev d\xFCzenleyicide bo\u015F se\xE7enek \xE7iplerinin (Tarih, \xD6ncelik, Etiket \u2026) yaln\u0131zca simgelerini g\xF6sterir; ad ipucu olarak g\xF6r\xFCn\xFCr. De\u011Feri olan \xE7ipler de\u011Feri g\xF6stermeye devam eder.",
    task_actions: "G\xF6rev i\u015Flemleri",
    chip_status: "Durum",
    more_chip_actions: "Di\u011Fer eylemler",
    edit_task_actions: "G\xF6rev i\u015Flemlerini d\xFCzenle",
    set_chip_actions: "G\xF6rev i\u015Flemleri (giri\u015F \xE7ipleri)",
    set_chip_actions_desc: "H\u0131zl\u0131 ekleme ve tam d\xFCzenleyici ayr\u0131 ayr\u0131 ayarlan\u0131r. Her \xE7ipi bir b\xF6l\xFCme s\xFCr\xFCkleyin: Her zaman g\xF6ster, De\u011Fer varsa g\xF6ster veya Yaln\u0131zca + men\xFCs\xFCnde. S\u0131ra = \xE7ip s\u0131ras\u0131.",
    chip_tier_shown: "Her zaman g\xF6ster",
    chip_tier_onValue: "De\u011Fer varsa g\xF6ster",
    chip_tier_hidden: "Yaln\u0131zca + men\xFCs\xFCnde",
    chip_surface_editor: "Tam d\xFCzenleyici",
    chip_surface_quickadd: "H\u0131zl\u0131 ekleme",
    chip_reset_default: "Varsay\u0131lana s\u0131f\u0131rla",
    menu_create_subtask: "Alt g\xF6rev olu\u015Ftur",
    menu_show_parent: "\xDCst g\xF6revi g\xF6ster",
    menu_duplicate: "G\xF6revi \xE7o\u011Falt",
    menu_copy_link: "G\xF6reve ba\u011Flant\u0131 kopyala",
    menu_open_obsidian: "Obsidian'da a\xE7",
    menu_open_editor: "D\xFCzenleyicide a\xE7",
    menu_print: "Yazd\u0131r",
    copy_suffix: "(Kopya)",
    msg_duplicated: "G\xF6rev \xE7o\u011Falt\u0131ld\u0131",
    msg_link_copied: "Ba\u011Flant\u0131 kopyaland\u0131",
    msg_link_copy_failed: "Ba\u011Flant\u0131 kopyalanamad\u0131.",
    set_folders_heading: "Klas\xF6rler",
    set_folder_items: "G\xF6rev klas\xF6r\xFC",
    set_folder_items_desc: "Yeni g\xF6rev notlar\u0131n\u0131n olu\u015Fturulaca\u011F\u0131 yer.",
    set_folder_projects: "Proje klas\xF6r\xFC",
    set_folder_projects_desc: "Proje ve alan notlar\u0131n\u0131n olu\u015Fturulaca\u011F\u0131 yer.",
    set_folder_attachments: "Ek klas\xF6r\xFC",
    set_folder_attachments_desc: "Yap\u0131\u015Ft\u0131r\u0131lan veya eklenen dosyalar\u0131n saklanaca\u011F\u0131 yer.",
    set_behavior_heading: "Davran\u0131\u015F",
    set_language: "Dil",
    set_language_desc: "Aray\xFCz dili.",
    set_language_auto: "Otomatik (Obsidian'\u0131 izle)",
    set_start_view: "A\xE7\u0131l\u0131\u015Fta g\xF6r\xFCn\xFCm",
    set_start_view_desc: "Ba\u015Flang\u0131\xE7ta hangi g\xF6r\xFCn\xFCm a\xE7\u0131l\u0131r.",
    set_start_view_last: "Son kullan\u0131lan",
    set_nl: "Ba\u015Fl\u0131kta tarih ve #etiketleri alg\u0131la",
    set_nl_desc: "G\xF6rev ba\u015Fl\u0131\u011F\u0131n\u0131 yazarken son tarihleri ve #etiketleri otomatik olarak ayr\u0131\u015Ft\u0131r\u0131r.",
    nav_trash: "\xC7\xF6p kutusu",
    empty_trash: "\xC7\xF6p kutusu bo\u015F.",
    trash_restore_all: "T\xFCm\xFCn\xFC geri y\xFCkle",
    trash_empty: "\xC7\xF6p kutusunu bo\u015Falt",
    confirm_empty_trash_q: "\xC7\xF6p kutusu bo\u015Falt\u0131ls\u0131n m\u0131?",
    msg_restored: "\xAB{0}\xBB geri y\xFCklendi.",
    msg_trash_empty: "\xC7\xF6p kutusu zaten bo\u015F.",
    msg_trash_emptied: "\xC7\xF6p kutusu bo\u015Falt\u0131ld\u0131 \u2013 {0} g\xF6rev kal\u0131c\u0131 olarak silindi.",
    report_trash_empty_restore: "\xC7\xF6p kutusu bo\u015F \u2013 geri y\xFCklenecek bir \u015Fey yok.",
    report_tasks_restored: "{0} g\xF6rev geri y\xFCklendi.",
    rem_at_time: "G\xF6rev saatinde",
    rem_before: "{0} \xF6nce",
    rem_unit_min: "{0} dk",
    rem_unit_hour: "{0} sa",
    rem_unit_day: "{0} g\xFCn",
    rem_unit_days: "{0} g\xFCn",
    chip_reminder: "Hat\u0131rlat\u0131c\u0131",
    rem_count: "{0} hat\u0131rlat\u0131c\u0131",
    reminders_title: "Hat\u0131rlat\u0131c\u0131lar",
    rem_tab_relative: "G\xF6revden \xF6nce",
    rem_tab_absolute: "Tarih ve saat\u2026",
    rem_need_time: "\xD6nce bir saat belirleyin",
    rem_add: "Hat\u0131rlat\u0131c\u0131 ekle",
    date_confirm: "Uygula",
    nav_filters: "Filtreler",
    filter_add: "Yeni filtre",
    sec_tasks: "G\xF6revler",
    manage_empty_filters: "Hen\xFCz filtre yok.",
    nav_toggle_section: "B\xF6l\xFCm\xFC daralt veya geni\u015Flet",
    new_project_title: "Yeni proje",
    new_area_title: "Yeni alan",
    new_label_title: "Yeni etiket",
    edit_project_title: "Projeyi d\xFCzenle",
    edit_area_title: "Alan\u0131 d\xFCzenle",
    edit_label_title: "Etiketi d\xFCzenle",
    show_in_sidebar: "Kenar \xE7ubu\u011Funda g\xF6ster",
    create_filter: "Filtre olu\u015Ftur",
    create_label: "Etiket olu\u015Ftur",
    create_project: "Proje olu\u015Ftur",
    create_area: "Alan olu\u015Ftur",
    btn_create: "Olu\u015Ftur",
    new_need_name: "L\xFCtfen bir ad girin.",
    new_preview_hint: "\xD6nizleme",
    empty_no_filter: "Bu filtre art\u0131k mevcut de\u011Fil.",
    empty_no_filter_tasks: "Bu filtreyle e\u015Fle\u015Fen g\xF6rev yok.",
    filter_new: "Yeni filtre",
    filter_edit: "Filtreyi d\xFCzenle",
    filter_name: "Ad",
    filter_name_ph: "Filtre ad\u0131 \u2026",
    filter_arrange: "D\xFCzenle",
    filter_facets: "Filtre",
    filter_dir: "Y\xF6n",
    filter_dir_asc: "Artan",
    filter_dir_desc: "Azalan",
    filter_sort: "S\u0131rala",
    filter_group: "Grupla",
    filter_show_done: "Tamamlananlar\u0131 dahil et",
    filter_range: "Zaman",
    filter_priorities: "\xD6ncelik",
    filter_labels: "Etiketler",
    filter_projects: "Projeler",
    filter_search: "Ara",
    filter_search_ph: "Ba\u015Fl\u0131kta metin \u2026",
    filter_reset: "S\u0131f\u0131rla",
    filter_delete: "Sil",
    filter_save: "Kaydet",
    filter_need_name: "L\xFCtfen bir ad girin.",
    filter_name_taken: "Bu ada sahip bir filtre zaten var.",
    filter_facets_active: "{0} etkin",
    filter_all: "T\xFCm\xFC",
    filter_n_selected: "{0} se\xE7ili",
    filter_n_criteria: "{0} kriter se\xE7ili",
    filter_mode_lead: "Filtre modu",
    filter_mode_any: "biri",
    filter_mode_all: "hepsi",
    filter_mode_none: "hi\xE7biri",
    filter_mode_s_any: "En az biri e\u015Fle\u015Fmeli.",
    filter_mode_s_all: "Hepsi e\u015Fle\u015Fmeli.",
    filter_mode_s_none: "Hi\xE7biri e\u015Fle\u015Fmemeli.",
    filter_range_any: "Herhangi",
    filter_range_overdue: "Gecikmi\u015F",
    filter_range_today: "Bug\xFCn ve gecikmi\u015F",
    filter_range_next7: "Sonraki 7 g\xFCn",
    filter_range_nodate: "Tarihsiz",
    filter_sort_smart: "Ak\u0131ll\u0131",
    filter_sort_due: "Tarih",
    filter_sort_deadline: "Son tarih",
    filter_sort_priority: "\xD6ncelik",
    filter_sort_created: "Olu\u015Fturulma",
    filter_sort_title: "Ad",
    filter_group_none: "Yok",
    filter_group_status: "Durum",
    filter_group_date: "Tarih",
    filter_group_deadline: "Son tarih",
    filter_group_priority: "\xD6ncelik",
    filter_group_label: "Etiket",
    filter_group_project: "Projeler",
    view_display: "G\xF6r\xFCn\xFCm",
    panel_layout: "D\xFCzen",
    panel_show_done: "Tamamlananlar\u0131 g\xF6ster",
    no_label: "Etiketsiz",
    more_actions: "Daha fazla"
  },
  zh: {
    view_today: "\u4ECA\u5929",
    view_upcoming: "\u5373\u5C06\u5230\u6765",
    view_recurring: "\u91CD\u590D",
    view_done: "\u5DF2\u5B8C\u6210",
    status_todo: "\u5F85\u529E",
    status_doing: "\u8FDB\u884C\u4E2D",
    status_done: "\u5B8C\u6210",
    status_cancelled: "\u5DF2\u53D6\u6D88",
    layout_list: "\u5217\u8868",
    layout_board: "\u770B\u677F",
    menu_cancel_task: "\u53D6\u6D88\u4EFB\u52A1",
    layout_calendar: "\u65E5\u5386",
    cal_prev: "\u4E0A\u4E00\u4E2A",
    cal_next: "\u4E0B\u4E00\u4E2A",
    cal_today: "\u4ECA\u5929",
    cal_unscheduled: "\u672A\u6392\u671F",
    cal_unscheduled_empty: "\u6CA1\u6709\u672A\u6392\u671F\u4EFB\u52A1",
    cal_mode_year: "\u5E74",
    cal_tasks: "{0} \u4E2A\u4EFB\u52A1",
    cal_mode_month: "\u6708",
    cal_mode_week: "\u5468",
    cal_mode_day: "\u65E5",
    cal_more: "+{0} \u66F4\u591A",
    cal_allday: "\u5168\u5929",
    tab_statuses: "\u72B6\u6001",
    status_add: "\u6DFB\u52A0\u72B6\u6001",
    placeholder_status_name: "\u72B6\u6001\u540D\u79F0",
    status_reset_default: "\u6062\u590D\u9ED8\u8BA4",
    confirm_reset_statuses_q: "\u5C06\u6240\u6709\u72B6\u6001\u6062\u590D\u4E3A\u9ED8\u8BA4\uFF1F",
    status_hint: "\u8FD9\u4E9B\u662F\u770B\u677F\u7684\u5217 \u2014 \u987A\u5E8F\u5373\u5217\u7684\u987A\u5E8F\u3002",
    status_kind_open: "\u672A\u5B8C\u6210",
    status_kind_done: "\u5B8C\u6210",
    status_kind_cancelled: "\u5DF2\u53D6\u6D88",
    role_new_tasks: "\u65B0\u4EFB\u52A1",
    role_on_complete: "\u5B8C\u6210\u65F6",
    role_trash: "\u56DE\u6536\u7AD9",
    status_pick_icon: "\u56FE\u6807",
    status_pick_color: "\u989C\u8272",
    status_color_none: "\u65E0\u989C\u8272",
    color_custom: "\u81EA\u5B9A\u4E49\u989C\u8272",
    btn_move_up: "\u4E0A\u79FB",
    btn_move_down: "\u4E0B\u79FB",
    status_need_done: "\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u201C\u5B8C\u6210\u201D\u72B6\u6001\u3002",
    status_need_open: "\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u672A\u5B8C\u6210\u72B6\u6001\u3002",
    status_need_kind: "\u6BCF\u4E2A\u7C7B\u522B\u81F3\u5C11\u4FDD\u7559\u4E00\u4E2A\u72B6\u6001\u3002",
    status_only_one_trash: "\u56DE\u6536\u7AD9\u72B6\u6001\u53EA\u6709\u4E00\u4E2A\u3002",
    status_reassigned: "{0} \u4E2A\u4EFB\u52A1\u5DF2\u79FB\u81F3 {1}\u3002",
    sort_by: "\u6392\u5E8F",
    sort_manual: "\u624B\u52A8",
    sort_name: "\u540D\u79F0",
    sort_count: "\u6570\u91CF",
    whatsnew_title: "\u65B0\u529F\u80FD",
    whatsnew_ok: "\u77E5\u9053\u4E86",
    wn_cal_t: "\u65E5\u5386\u89C6\u56FE",
    wn_cal_d: "\u5E74\u3001\u6708\u3001\u5468\u3001\u65E5\u2014\u2014\u62D6\u52A8\u4EFB\u52A1\u5373\u53EF\u6539\u671F\u3002",
    wn_unsched_t: "\u672A\u6392\u671F\u4FA7\u680F",
    wn_unsched_d: "\u6CA1\u6709\u65E5\u671F\u7684\u4EFB\u52A1\uFF0C\u53EF\u76F4\u63A5\u62D6\u5165\u7F51\u683C\u3002",
    wn_dir_t: "\u6392\u5E8F\u65B9\u5411",
    wn_dir_d: "\u6BCF\u4E2A\u6392\u5E8F\u6761\u4EF6\u5747\u53EF\u5347\u5E8F\u6216\u964D\u5E8F\u3002",
    wn_excl_t: "\u7B5B\u9009\u4E2D\u5305\u542B\u4E0E\u6392\u9664",
    wn_excl_d: "\u5C06\u6BCF\u4E2A\u503C\u6807\u8BB0\u4E3A \u2713 \u5305\u542B\u6216 \u2212 \u6392\u9664\uFF0C\u53EF\u5728\u540C\u4E00\u5B57\u6BB5\u6DF7\u7528\uFF1B\u9002\u7528\u4E8E\u6807\u7B7E\u3001\u9879\u76EE\u548C\u4F18\u5148\u7EA7\u3002",
    wn_fmode_t: "\u6A21\u5F0F\uFF1A\u4EFB\u4E00 \xB7 \u5168\u90E8 \xB7 \u65E0",
    wn_fmode_d: "\u6BCF\u4E2A\u5B57\u6BB5\u53EF\u9009\uFF1A\u81F3\u5C11\u4E00\u4E2A\uFF08\u6216\uFF09\u3001\u5168\u90E8\uFF08\u4E0E\uFF09\u6216\u65E0\uFF08\u975E\uFF09\u3002",
    wn_anytime_t: "\u4F8B\u5982\u201C\u968F\u65F6\u201D\u7B5B\u9009",
    wn_anytime_d: "\u65E0\u65E5\u671F\u4E14\u4E0D\u542B\u67D0\u4E2A\u6807\u7B7E\u2014\u2014\u73B0\u5728\u53EF\u5728\u4E00\u4E2A\u7B5B\u9009\u4E2D\u5B9E\u73B0\u3002",
    wn_chips_t: "\u81EA\u5B9A\u4E49\u8F93\u5165\u9879",
    wn_chips_d: "\u5728\u5FEB\u901F\u6DFB\u52A0\u548C\u5B8C\u6574\u7F16\u8F91\u5668\u4E2D\u5206\u522B\u663E\u793A\u3001\u9690\u85CF\u548C\u91CD\u65B0\u6392\u5E8F\u8F93\u5165\u9879\uFF0C\u5176\u4F59\u9879\u5728 + \u83DC\u5355\u4E2D\u3002",
    wn_status_t: "\u66F4\u7A33\u5065\u7684\u72B6\u6001",
    wn_status_d: "\u72B6\u6001\u73B0\u5728\u62E5\u6709\u6709\u4FDD\u969C\u7684\u7C7B\u522B\uFF08\u672A\u5B8C\u6210 \xB7 \u5B8C\u6210 \xB7 \u56DE\u6536\u7AD9\uFF09\u3001\u6309\u7C7B\u522B\u5206\u7EC4\u7684\u7F16\u8F91\u5668\uFF0C\u4EE5\u53CA\u59CB\u7EC8\u53EF\u7528\u7684\u56DE\u6536\u7AD9\u3002",
    wn_quickadd_t: "\u5B8C\u6574\u7684\u5FEB\u901F\u6DFB\u52A0",
    wn_quickadd_d: "\u5FEB\u901F\u6DFB\u52A0\u5305\u542B\u6240\u6709\u5B57\u6BB5\uFF1B\u6700\u5927\u5316\u6309\u94AE\u4F1A\u5C06\u5168\u90E8\u5185\u5BB9\u79FB\u4EA4\u7ED9\u5B8C\u6574\u7F16\u8F91\u5668\u3002",
    wn_reset_t: "\u5408\u7406\u7684\u9ED8\u8BA4\u503C",
    wn_reset_d: "\u65B0\u7684\u9ED8\u8BA4\u5E03\u5C40\uFF0C\u4EE5\u53CA\u7528\u4E8E\u91CD\u7F6E\u8F93\u5165\u9879\u5E03\u5C40\u548C\u72B6\u6001\u7684\u6309\u94AE\u3002",
    wn_gcal_t: "Google \u65E5\u5386\u540C\u6B65",
    wn_gcal_d: "\u955C\u50CF\u6709\u622A\u6B62\u65E5\u671F\u7684\u4EFB\u52A1\u2014\u2014\u65E5\u671F\u548C\u65F6\u95F4\u53CC\u5411\u540C\u6B65\u3002",
    wn_gcalcal_t: "\u4F60\u7684\u8D26\u6237\uFF0C\u4F60\u7684\u65E5\u5386",
    wn_gcalcal_d: "\u4F7F\u7528\u4F60\u81EA\u5DF1\u7684 Google \u51ED\u636E\u8FDE\u63A5\uFF1B\u4E8B\u4EF6\u8FDB\u5165\u4E13\u7528\u7684 BeautyTasks \u65E5\u5386\u3002",
    wn_gcallist_t: "\u6309\u5217\u8868\u63A7\u5236",
    wn_gcallist_d: "\u4E3A\u4EFB\u610F\u9879\u76EE\u3001\u9886\u57DF\u6216\u6536\u4EF6\u7BB1\u5F00\u542F\u6216\u5173\u95ED\u540C\u6B65\u3002",
    wn_gcalstat_t: "\u72B6\u6001\u4E0E\u51B2\u7A81",
    wn_gcalstat_d: "\u72B6\u6001\u680F\u6307\u793A\u5668\u663E\u793A\u540C\u6B65\u72B6\u6001\uFF1B\u53D1\u751F\u51B2\u7A81\u65F6\uFF0C\u4EE5 Obsidian \u4E3A\u51C6\u3002",
    wn_board_t: "\u770B\u677F\u6309\u5206\u7EC4",
    wn_board_d: "\u770B\u677F\u73B0\u5728\u4F1A\u8DDF\u968F\u4F60\u7684\u5206\u7EC4\uFF1A\u6309\u72B6\u6001\u3001\u6807\u7B7E\u3001\u4F18\u5148\u7EA7\u6216\u9879\u76EE\u5206\u5217 \u2014 \u5728\u5217\u4E4B\u95F4\u62D6\u52A8\u5361\u7247\u3002",
    wn_langs_t: "8 \u79CD\u65B0\u8BED\u8A00",
    wn_langs_d: "\u754C\u9762\u73B0\u5728\u8FD8\u652F\u6301\u897F\u73ED\u7259\u8BED\u3001\u8461\u8404\u7259\u8BED\u3001\u6CD5\u8BED\u3001\u571F\u8033\u5176\u8BED\u3001\u4E2D\u6587\u3001\u4FC4\u8BED\u3001\u65E5\u8BED\u548C\u610F\u5927\u5229\u8BED\u3002",
    wn_project_t: "\u8F93\u5165 @ \u6307\u5B9A\u9879\u76EE",
    wn_project_d: "\u5728\u5FEB\u901F\u6DFB\u52A0\u4E2D\uFF0C\u8F93\u5165 @\u540D\u79F0 \u5373\u53EF\u5C06\u4EFB\u52A1\u5206\u914D\u7ED9\u5DF2\u6709\u7684\u9879\u76EE\u6216\u9886\u57DF\u3002",
    wn_hidden_t: "\u663E\u793A\u9690\u85CF\u9879",
    wn_hidden_d: "\u53F3\u952E\u70B9\u51FB\u5206\u533A\u6807\u9898\uFF0C\u4E00\u952E\u627E\u56DE\u9690\u85CF\u7684\u6761\u76EE\u3002",
    wn_ui_t: "\u754C\u9762\u4F18\u5316",
    wn_ui_d: "\u66F4\u6574\u6D01\u3001\u66F4\u7075\u6D3B\uFF1A\u300C\u4ECA\u5929\u300D\u652F\u6301\u6392\u5E8F\u548C\u5206\u7EC4\uFF0C\u300C\u5373\u5C06\u5230\u6765\u300D\u662F\u7EAF\u65E5\u671F\u65E5\u7A0B\uFF0C\u6BCF\u4E2A\u9879\u76EE\u3001\u6807\u7B7E\u548C\u7B5B\u9009\u5668\u9875\u9762\u90FD\u6709\u83DC\u5355\u3002",
    nav_inbox: "\u6536\u4EF6\u7BB1",
    group_area: "\u9886\u57DF",
    group_project: "\u9879\u76EE",
    sec_overdue: "\u5DF2\u903E\u671F",
    sec_today: "\u4ECA\u5929",
    sec_upcoming: "\u5373\u5C06\u5230\u6765",
    sec_no_date: "\u65E0\u65E5\u671F",
    sec_done: "\u5DF2\u5B8C\u6210",
    count_task: "{0} \u4E2A\u4EFB\u52A1",
    count_tasks: "{0} \u4E2A\u4EFB\u52A1",
    empty_nothing_scheduled: "\u6CA1\u6709\u5DF2\u6392\u671F\u7684\u4EFB\u52A1\u3002",
    empty_nothing_recurring: "\u6CA1\u6709\u91CD\u590D\u4EFB\u52A1\u3002",
    empty_nothing_done: "\u8FD8\u6CA1\u6709\u5DF2\u5B8C\u6210\u7684\u4EFB\u52A1\u3002",
    empty_nothing_today: "\u4ECA\u5929\u6CA1\u6709\u4EFB\u52A1\u3002",
    empty_no_project_tasks: "\u6B64\u9879\u76EE\u4E2D\u8FD8\u6CA1\u6709\u4EFB\u52A1\u3002",
    empty_no_area_tasks: "\u6B64\u9886\u57DF\u4E2D\u8FD8\u6CA1\u6709\u4EFB\u52A1\u3002",
    empty_no_inbox_tasks: "\u6536\u4EF6\u7BB1\u4E2D\u8FD8\u6CA1\u6709\u4EFB\u52A1\u3002",
    empty_no_label_tasks: "\u8FD8\u6CA1\u6709\u5E26\u6B64\u6807\u7B7E\u7684\u4EFB\u52A1\u3002",
    empty_no_tasks: "\u8FD8\u6CA1\u6709\u4EFB\u52A1\u3002",
    btn_add_task: "\u6DFB\u52A0\u4EFB\u52A1",
    btn_cancel: "\u53D6\u6D88",
    btn_save: "\u4FDD\u5B58",
    btn_delete: "\u5220\u9664",
    details: "\u8BE6\u60C5",
    subtask: "\u5B50\u4EFB\u52A1",
    placeholder_subtask: "\u5B50\u4EFB\u52A1",
    log_placeholder: "\u6DFB\u52A0\u8BC4\u8BBA \u2026",
    log_attach: "\u9644\u52A0\u6587\u4EF6",
    log_link: "\u94FE\u63A5\u7B14\u8BB0",
    log_add: "\u6DFB\u52A0",
    log_edit: "\u7F16\u8F91",
    log_update: "\u66F4\u65B0",
    log_link_placeholder: "\u94FE\u63A5\u4E00\u6761\u7B14\u8BB0 \u2026",
    btn_close: "\u5173\u95ED",
    lb_prev: "\u4E0A\u4E00\u5F20\u56FE\u7247",
    lb_next: "\u4E0B\u4E00\u5F20\u56FE\u7247",
    lb_copy: "\u590D\u5236\u56FE\u7247",
    msg_image_copied: "\u56FE\u7247\u5DF2\u590D\u5236\u5230\u526A\u8D34\u677F\u3002",
    msg_image_copy_failed: "\u65E0\u6CD5\u590D\u5236\u56FE\u7247\u3002",
    msg_attached: "\u5DF2\u9644\u52A0 {0}",
    msg_attach_failed: "\u9644\u52A0\u5931\u8D25\uFF1A{0}",
    err_detail_save: "\u65E0\u6CD5\u4FDD\u5B58\u8BE6\u60C5\u3002",
    placeholder_taskname: "\u4EFB\u52A1\u540D\u79F0",
    placeholder_description: "\u63CF\u8FF0 \u2026",
    placeholder_date_input: "\u8F93\u5165\u65E5\u671F \u2026",
    placeholder_label: "\u6807\u7B7E",
    placeholder_project_name: "\u9879\u76EE\u540D\u79F0 \u2026",
    placeholder_area_name: "\u9886\u57DF\u540D\u79F0 \u2026",
    chip_date: "\u65E5\u671F",
    chip_priority: "\u4F18\u5148\u7EA7",
    chip_label: "\u6807\u7B7E",
    chip_recurrence: "\u91CD\u590D",
    chip_deadline: "\u6700\u540E\u671F\u9650",
    chip_parent: "\u7236\u4EFB\u52A1",
    pick_parent: "\u79FB\u5230\u67D0\u4EFB\u52A1\u4E0B \u2026",
    prio_1: "\u4F18\u5148\u7EA7 1",
    prio_2: "\u4F18\u5148\u7EA7 2",
    prio_3: "\u4F18\u5148\u7EA7 3",
    prio_4: "\u4F18\u5148\u7EA7 4",
    recur_none: "\u65E0",
    recur_daily: "\u6BCF\u5929",
    recur_weekly: "\u6BCF\u5468",
    recur_monthly: "\u6BCF\u6708",
    recur_quarterly: "\u6BCF\u5B63\u5EA6",
    recur_yearly: "\u6BCF\u5E74",
    recur_basis: "\u4E0B\u6B21\u65E5\u671F\u57FA\u4E8E",
    recur_when_done: "\u5B8C\u6210\u65F6",
    pick_new_project: "\u65B0\u5EFA\u9879\u76EE",
    pick_new_area: "\u65B0\u5EFA\u9886\u57DF",
    no_project: "\u65E0\u9879\u76EE",
    make_area: "\u9886\u57DF",
    make_area_hint: "\u9886\u57DF\u662F\u6C38\u4E45\u7684\uFF0C\u65E0\u6CD5\u5220\u9664\u6216\u5F52\u6863\u3002",
    manage: "\u7BA1\u7406",
    manage_full: "\u5217\u8868\u7BA1\u7406\u5668",
    tab_active: "\u6D3B\u52A8",
    tab_archive: "\u5F52\u6863",
    tab_labels: "\u6807\u7B7E",
    add_label: "\u65B0\u5EFA\u6807\u7B7E",
    manage_empty_labels: "\u8FD8\u6CA1\u6709\u4F7F\u7528\u4E2D\u7684\u6807\u7B7E\u3002",
    tip_show_sidebar: "\u5728\u4FA7\u8FB9\u680F\u663E\u793A",
    tip_hide_sidebar: "\u4ECE\u4FA7\u8FB9\u680F\u9690\u85CF",
    tip_mark_area: "\u8F6C\u6362\u4E3A\u9886\u57DF",
    tip_unmark_area: "\u8F6C\u6362\u4E3A\u9879\u76EE",
    btn_rename: "\u91CD\u547D\u540D",
    btn_archive: "\u5F52\u6863",
    btn_restore: "\u6062\u590D",
    btn_delete_forever: "\u6C38\u4E45\u5220\u9664",
    confirm_delete_q: "\u5220\u9664\uFF1F",
    confirm_delete_forever_q: "\u6C38\u4E45\u5220\u9664\uFF1F",
    menu_edit: "\u7F16\u8F91 \u2026",
    menu_reorder: "\u66F4\u6539\u987A\u5E8F \u2026",
    menu_reveal_hidden: "\u663E\u793A\u9690\u85CF\u9879",
    menu_goto_projects: "\u524D\u5F80\u9879\u76EE\u89C6\u56FE",
    menu_goto_areas: "\u524D\u5F80\u9886\u57DF\u89C6\u56FE",
    menu_goto_labels: "\u524D\u5F80\u6807\u7B7E\u89C6\u56FE",
    menu_goto_filters: "\u524D\u5F80\u7B5B\u9009\u5668\u89C6\u56FE",
    reorder_active: "\u6B63\u5728\u91CD\u6392",
    reorder_done: "\u5B8C\u6210",
    archive_undo: "\u64A4\u9500",
    archived_notice: "\u201C{0}\u201D\u5DF2\u5F52\u6863\u3002",
    confirm_delete_title: "\u5220\u9664\u201C{0}\u201D\uFF1F",
    confirm_delete_body: "\u6B64\u64CD\u4F5C\u65E0\u6CD5\u64A4\u9500\u3002",
    manage_empty_active: "\u8FD8\u6CA1\u6709\u9879\u76EE\u6216\u9886\u57DF\u3002",
    manage_empty_archive: "\u6CA1\u6709\u5DF2\u5F52\u6863\u7684\u5185\u5BB9\u3002",
    manage_empty_projects: "\u8FD8\u6CA1\u6709\u9879\u76EE\u3002",
    manage_empty_areas: "\u8FD8\u6CA1\u6709\u9886\u57DF\u3002",
    manage_no_active_hint: "\u4ECE\u4EFB\u52A1\u5BF9\u8BDD\u6846\u521B\u5EFA\u4E00\u4E2A\u9879\u76EE\uFF0C\u7136\u540E\u5728\u6B64\u6309\u9700\u8F6C\u6362\u4E3A\u9886\u57DF\u3002",
    date_today: "\u4ECA\u5929",
    date_yesterday: "\u6628\u5929",
    date_tomorrow: "\u660E\u5929",
    date_this_weekend: "\u672C\u5468\u672B",
    date_next_week: "\u4E0B\u5468",
    date_no_date: "\u65E0\u65E5\u671F",
    time_add: "\u65F6\u95F4",
    time_label: "\u65F6\u95F4",
    duration_label: "\u65F6\u957F",
    err_enter_taskname: "\u8BF7\u8F93\u5165\u4EFB\u52A1\u540D\u79F0\u3002",
    err_parent_not_found: "\u672A\u627E\u5230\u7236\u4EFB\u52A1\u3002",
    cmd_new_task: "\u65B0\u5EFA\u4EFB\u52A1",
    cmd_quick_add: "\u5FEB\u901F\u6DFB\u52A0\u4EFB\u52A1",
    cmd_open_view: "\u6253\u5F00 {0}",
    cmd_count_tasks: "\u7EDF\u8BA1\u4EFB\u52A1",
    cmd_import: "\u4ECE Tasks/Lists \u5BFC\u5165",
    cmd_search: "\u641C\u7D22\u4EFB\u52A1",
    cmd_whatsnew: "\u67E5\u770B\u65B0\u529F\u80FD",
    cmd_gcal_sync_now: "\u7ACB\u5373\u4E0E Google \u65E5\u5386\u540C\u6B65",
    cmd_export_json: "\u5BFC\u51FA\u4EFB\u52A1\uFF08JSON\uFF09",
    cmd_import_json: "\u5BFC\u5165\u4EFB\u52A1\uFF08JSON\uFF09",
    cmd_import_tasknotes: "\u4ECE TaskNotes \u5BFC\u5165",
    set_import_tn: "\u4ECE TaskNotes \u5BFC\u5165",
    set_import_tn_desc: "\u4ECE TaskNotes \u63D2\u4EF6\u8FC1\u79FB\u4EFB\u52A1\uFF08\u4FDD\u7559\u4E3A Markdown \u7B14\u8BB0\uFF09\u3002",
    set_import_tn_btn: "\u4ECE TaskNotes \u5BFC\u5165",
    set_gcal_heading: "Google \u65E5\u5386",
    gcal_not_connected: "\u672A\u8FDE\u63A5",
    gcal_setup_desc: "\u5C06\u6709\u65E5\u671F\u7684\u4EFB\u52A1\u540C\u6B65\u5230 Google \u65E5\u5386\u3002\u4F7F\u7528\u4F60\u81EA\u5DF1\u7684 Google API \u51ED\u636E\uFF08\u4E00\u6B21\u6027\u8BBE\u7F6E\uFF0C\u7EA6 5 \u5206\u949F\uFF09\u3002\u521B\u5EFA\u4E00\u4E2A\u7C7B\u578B\u4E3A\u201C\u684C\u9762\u5E94\u7528\u201D\u7684 OAuth \u5BA2\u6237\u7AEF\uFF0C\u5E76\u5C06\u5176 ID \u548C\u5BC6\u94A5\u7C98\u8D34\u5230\u4E0B\u65B9\u3002",
    gcal_help_btn: "\u6253\u5F00\u8BBE\u7F6E\u6307\u5357",
    gcal_setup_hint: "\u7B2C\u4E00\u6B21\u4F7F\u7528\uFF1F\u8BE5\u6307\u5357\u4F1A\u5F15\u5BFC\u4F60\u521B\u5EFA Google \u51ED\u636E\u3002",
    gcal_client_id: "\u5BA2\u6237\u7AEF ID",
    gcal_client_secret: "\u5BA2\u6237\u7AEF\u5BC6\u94A5",
    gcal_connect_btn: "\u8FDE\u63A5",
    gcal_connecting: "\u6B63\u5728\u8FDE\u63A5\u2026",
    gcal_connect_failed: "\u8FDE\u63A5\u5931\u8D25\uFF1A{0}",
    gcal_connected_as: "\u5DF2\u8FDE\u63A5\u4E3A {0}",
    gcal_disconnect_btn: "\u65AD\u5F00\u8FDE\u63A5",
    gcal_last_synced: "\u4E0A\u6B21\u540C\u6B65\uFF1A{0}",
    gcal_never: "\u4ECE\u4E0D",
    gcal_syncing: "\u6B63\u5728\u540C\u6B65\u2026",
    gcal_sync_error: "\u9519\u8BEF\uFF1A{0}",
    gcal_sync_now_btn: "\u7ACB\u5373\u540C\u6B65",
    gcal_target_calendar: "\u76EE\u6807\u65E5\u5386",
    gcal_target_calendar_desc: "\u6709\u65E5\u671F\u7684\u4EFB\u52A1\u4F1A\u955C\u50CF\u5230\u54EA\u4E2A\u65E5\u5386\u3002",
    gcal_create_calendar_btn: "\u521B\u5EFA BeautyTasks \u65E5\u5386",
    gcal_create_calendar_desc: "\u521B\u5EFA\u5E76\u4F7F\u7528\u4E13\u7528\u7684\u201CBeautyTasks\u201D\u65E5\u5386\uFF08\u73B0\u6709\u4E8B\u4EF6\u4F1A\u5728\u4E0B\u6B21\u540C\u6B65\u65F6\u8FC1\u79FB\u8FC7\u53BB\uFF09\u3002",
    gcal_sync_list: "\u4E0E Google \u65E5\u5386\u540C\u6B65",
    gcal_tip_create: "\u63D0\u793A\uFF1A\u4F7F\u7528\u4E13\u7528\u65E5\u5386",
    gcal_tip_create_desc: "\u521B\u5EFA\u4F60\u81EA\u5DF1\u7684 Google \u65E5\u5386\u5E76\u5C06\u4EFB\u52A1\u8FC1\u79FB\u5230\u90A3\u91CC\uFF08\u4E0E\u4E3B\u65E5\u5386\u5E72\u51C0\u5730\u5206\u5F00\uFF09\u3002",
    gcal_create_calendar_failed: "\u65E0\u6CD5\u521B\u5EFA\u65E5\u5386\uFF1A{0} \u2014\u2014 \u53EF\u80FD\u9700\u8981\u65AD\u5F00\u5E76\u91CD\u65B0\u8FDE\u63A5\uFF08\u65B0\u6743\u9650\uFF09\u3002",
    gcal_no_calendar_warn: "\u5C1A\u672A\u9009\u62E9\u76EE\u6807\u65E5\u5386 \u2014\u2014 \u8BF7\u5728\u4E0B\u65B9\u9009\u62E9\u4E00\u4E2A\u6216\u521B\u5EFA BeautyTasks \u65E5\u5386\u3002\u5728\u6B64\u4E4B\u524D\u4E0D\u4F1A\u540C\u6B65\u4EFB\u4F55\u5185\u5BB9\u3002",
    gcal_enabled: "\u540C\u6B65\u6709\u65E5\u671F\u7684\u4EFB\u52A1",
    gcal_enabled_desc: "\u5C06\u6BCF\u4E2A\u6709\u622A\u6B62\u65E5\u671F\u7684\u4EFB\u52A1\u955C\u50CF\u4E3A\u4E8B\u4EF6\u3002",
    gcal_autosync: "\u81EA\u52A8\u540C\u6B65",
    gcal_autosync_desc: "\u5728\u4F60\u7F16\u8F91\u4EFB\u52A1\u65F6\u63A8\u9001\u66F4\u6539\uFF08\u5426\u5219\u4EC5\u901A\u8FC7\u547D\u4EE4\u8FD0\u884C\u540C\u6B65\uFF09\u3002",
    gcal_advanced: "\u9AD8\u7EA7",
    gcal_on_create: "\u6DFB\u52A0\u65B0\u4EFB\u52A1",
    gcal_on_update: "\u5C06\u66F4\u6539\u63A8\u9001\u5230\u73B0\u6709\u4E8B\u4EF6",
    gcal_on_delete: "\u4EFB\u52A1\u88AB\u5220\u9664\u6216\u53BB\u9664\u65E5\u671F\u65F6\u79FB\u9664\u4E8B\u4EF6",
    gcal_remove_on_complete: "\u4EFB\u52A1\u5B8C\u6210\u65F6\u79FB\u9664\u4E8B\u4EF6",
    gcal_duration: "\u9ED8\u8BA4\u4E8B\u4EF6\u65F6\u957F\uFF08\u5206\u949F\uFF09",
    gcal_timezone: "\u65F6\u533A",
    gcal_statusbar: "\u5728\u72B6\u6001\u680F\u663E\u793A\u540C\u6B65\u72B6\u6001",
    gcal_notify_conflicts: "\u51B2\u7A81\u65F6\u901A\u77E5",
    gcal_device_prompt: "\u6253\u5F00 {0} \u5E76\u8F93\u5165\u4EE3\u7801\uFF1A{1}",
    gcal_reconnect_hint: "\u5728\u8BBE\u7F6E\u4E2D\u91CD\u65B0\u8FDE\u63A5",
    gcal_conflicts_notice: "\u5DF2\u89E3\u51B3 {0} \u4E2A\u51B2\u7A81 \u2014\u2014 \u4FDD\u7559\u4E86 Obsidian \u7684\u503C",
    menu_gcal_exclude: "\u4ECE\u65E5\u5386\u540C\u6B65\u4E2D\u6392\u9664",
    menu_gcal_include: "\u52A0\u5165\u65E5\u5386\u540C\u6B65",
    tn_import_title: "\u4ECE TaskNotes \u5BFC\u5165",
    tn_import_desc: "\u6839\u636E\u4F60\u7684 TaskNotes \u4EFB\u52A1\u521B\u5EFA\u65B0\u7684 BeautyTasks \u7B14\u8BB0\u3002\u4F60\u7684 TaskNotes \u6587\u4EF6\u4FDD\u6301\u4E0D\u53D8\u3002",
    tn_import_tag: "\u4EFB\u52A1\u6807\u7B7E",
    tn_import_tag_desc: "\u5C06\u7B14\u8BB0\u6807\u8BB0\u4E3A TaskNotes \u4EFB\u52A1\u7684 frontmatter \u6807\u7B7E\u3002",
    tn_import_folder: "\u6587\u4EF6\u5939\uFF08\u53EF\u9009\uFF09",
    tn_import_folder_desc: "\u9650\u5B9A\u5230\u67D0\u4E2A\u6587\u4EF6\u5939\u3002\u7559\u7A7A\u5219\u626B\u63CF\u6574\u4E2A\u4ED3\u5E93\u3002",
    tn_import_folder_ph: "\u4F8B\u5982\uFF1A\u4EFB\u52A1",
    tn_import_found: "\u627E\u5230 {0} \u6761\u4EFB\u52A1\u7B14\u8BB0\u3002",
    tn_import_none: "\u672A\u627E\u5230 TaskNotes \u4EFB\u52A1\u3002",
    tn_import_btn: "\u5BFC\u5165",
    tn_import_done: "\u5DF2\u5BFC\u5165 {0}\uFF0C\u8DF3\u8FC7 {1}\u3002",
    tn_import_lossy: "{0} \u6761\u542B\u590D\u6742\u91CD\u590D\u89C4\u5219\u7684\u4EFB\u52A1\u5DF2\u5C06\u539F\u6587\u4FDD\u7559\u4E3A\u7B14\u8BB0\u3002",
    tn_import_failed: "\u5BFC\u5165\u5931\u8D25\u3002",
    qa_placeholder: "\u4F8B\u5982\uFF1A\u660E\u5929\u5199\u62A5\u544A p1 #\u91CD\u8981 @\u5DE5\u4F5C",
    qa_added: "\u4EFB\u52A1\u5DF2\u6DFB\u52A0",
    qa_open_full: "\u5728\u5B8C\u6574\u7F16\u8F91\u5668\u4E2D\u6253\u5F00",
    nav_search: "\u641C\u7D22",
    search_placeholder: "\u641C\u7D22\u4EFB\u52A1 \u2026",
    search_exclude_archived: "\u6392\u9664\u5DF2\u5F52\u6863",
    notice_count: "BeautyTasks\uFF1A{0} \u4E2A\u4EFB\u52A1\uFF08{1} \u4E2A\u672A\u5B8C\u6210\uFF09",
    notice_import_running: "BeautyTasks\uFF1A\u6B63\u5728\u5BFC\u5165 \u2026",
    notice_imported: "BeautyTasks\uFF1A\u5DF2\u5BFC\u5165 {0} \u4E2A\u4EFB\u52A1\u3002",
    notice_import_failed: "BeautyTasks\uFF1A\u5BFC\u5165\u5931\u8D25\uFF08\u89C1\u63A7\u5236\u53F0\uFF09\u3002",
    notice_export_done: "BeautyTasks\uFF1A\u5DF2\u5BFC\u51FA\u5230 {0}",
    notice_export_failed: "BeautyTasks\uFF1A\u5BFC\u51FA\u5931\u8D25\uFF08\u89C1\u63A7\u5236\u53F0\uFF09\u3002",
    notice_import_invalid: "BeautyTasks\uFF1A\u4E0D\u662F\u6709\u6548\u7684\u5BFC\u51FA\u6587\u4EF6\u3002",
    notice_import_summary: "BeautyTasks\uFF1A\u5DF2\u6DFB\u52A0 {0} \u4E2A\u4EFB\u52A1\uFF0C\u8DF3\u8FC7 {1} \u4E2A\u3002",
    import_pick_placeholder: "\u9009\u62E9\u4E00\u4E2A JSON \u5BFC\u51FA\u6587\u4EF6 \u2026",
    set_data_heading: "\u5BFC\u5165\u4E0E\u5BFC\u51FA",
    set_export: "\u5BFC\u51FA\u4EFB\u52A1",
    set_export_desc: "\u5C06\u6240\u6709\u4EFB\u52A1\u4FDD\u5B58\u4E3A\u4ED3\u5E93\u4E2D\u7684 JSON \u6587\u4EF6\uFF08\u65E0\u635F\uFF09\u3002",
    set_export_btn: "\u5BFC\u51FA",
    set_import: "\u5BFC\u5165\u4EFB\u52A1",
    set_import_desc: "\u4ECE JSON \u5BFC\u51FA\u6587\u4EF6\u8BFB\u53D6\u4EFB\u52A1\u3002\u5DF2\u5B58\u5728\u7684\u4EFB\u52A1\u5C06\u88AB\u8DF3\u8FC7\uFF08\u6309 id \u5339\u914D\uFF09\u3002",
    set_import_vault_btn: "\u4ECE\u4ED3\u5E93 \u2026",
    set_import_os_btn: "\u4ECE\u6587\u4EF6 \u2026",
    ribbon_open: "\u6253\u5F00 BeautyTasks",
    set_show_desc: "\u5728\u5217\u8868\u4E2D\u663E\u793A\u63CF\u8FF0",
    set_show_desc_desc: "\u5728\u4EFB\u52A1\u6807\u9898\u4E0B\u65B9\u663E\u793A\u4E00\u884C\u63CF\u8FF0\u9884\u89C8\u3002",
    set_chips_iconsonly: "\u7D27\u51D1\u6807\u7B7E\uFF08\u4EC5\u56FE\u6807\uFF09",
    set_chips_iconsonly_desc: "\u5728\u4EFB\u52A1\u7F16\u8F91\u5668\u4E2D\uFF0C\u4EC5\u663E\u793A\u7A7A\u9009\u9879\u6807\u7B7E\uFF08\u65E5\u671F\u3001\u4F18\u5148\u7EA7\u3001\u6807\u7B7E \u2026\uFF09\u7684\u56FE\u6807\uFF1B\u540D\u79F0\u4EE5\u63D0\u793A\u5F62\u5F0F\u663E\u793A\u3002\u6709\u503C\u7684\u6807\u7B7E\u4ECD\u4F1A\u663E\u793A\u5176\u503C\u3002",
    task_actions: "\u4EFB\u52A1\u64CD\u4F5C",
    chip_status: "\u72B6\u6001",
    more_chip_actions: "\u66F4\u591A\u64CD\u4F5C",
    edit_task_actions: "\u7F16\u8F91\u4EFB\u52A1\u64CD\u4F5C",
    set_chip_actions: "\u4EFB\u52A1\u64CD\u4F5C\uFF08\u8F93\u5165\u9879\uFF09",
    set_chip_actions_desc: "\u5FEB\u901F\u6DFB\u52A0\u548C\u5B8C\u6574\u7F16\u8F91\u5668\u53EF\u5206\u522B\u914D\u7F6E\u3002\u5C06\u6BCF\u4E00\u9879\u62D6\u5165\u67D0\u4E2A\u533A\u57DF\u2014\u2014\u59CB\u7EC8\u663E\u793A\u3001\u6709\u503C\u65F6\u663E\u793A\u6216\u4EC5\u5728 + \u83DC\u5355\u4E2D\u3002\u987A\u5E8F\u5373\u663E\u793A\u987A\u5E8F\u3002",
    chip_tier_shown: "\u59CB\u7EC8\u663E\u793A",
    chip_tier_onValue: "\u6709\u503C\u65F6\u663E\u793A",
    chip_tier_hidden: "\u4EC5\u5728 + \u83DC\u5355\u4E2D",
    chip_surface_editor: "\u5B8C\u6574\u7F16\u8F91\u5668",
    chip_surface_quickadd: "\u5FEB\u901F\u6DFB\u52A0",
    chip_reset_default: "\u6062\u590D\u9ED8\u8BA4",
    menu_create_subtask: "\u521B\u5EFA\u5B50\u4EFB\u52A1",
    menu_show_parent: "\u663E\u793A\u7236\u4EFB\u52A1",
    menu_duplicate: "\u590D\u5236\u4EFB\u52A1",
    menu_copy_link: "\u590D\u5236\u4EFB\u52A1\u94FE\u63A5",
    menu_open_obsidian: "\u5728 Obsidian \u4E2D\u6253\u5F00",
    menu_open_editor: "\u5728\u7F16\u8F91\u5668\u4E2D\u6253\u5F00",
    menu_print: "\u6253\u5370",
    copy_suffix: "\uFF08\u526F\u672C\uFF09",
    msg_duplicated: "\u4EFB\u52A1\u5DF2\u590D\u5236",
    msg_link_copied: "\u94FE\u63A5\u5DF2\u590D\u5236",
    msg_link_copy_failed: "\u65E0\u6CD5\u590D\u5236\u94FE\u63A5\u3002",
    set_folders_heading: "\u6587\u4EF6\u5939",
    set_folder_items: "\u4EFB\u52A1\u6587\u4EF6\u5939",
    set_folder_items_desc: "\u65B0\u4EFB\u52A1\u7B14\u8BB0\u7684\u521B\u5EFA\u4F4D\u7F6E\u3002",
    set_folder_projects: "\u9879\u76EE\u6587\u4EF6\u5939",
    set_folder_projects_desc: "\u9879\u76EE\u548C\u9886\u57DF\u7B14\u8BB0\u7684\u521B\u5EFA\u4F4D\u7F6E\u3002",
    set_folder_attachments: "\u9644\u4EF6\u6587\u4EF6\u5939",
    set_folder_attachments_desc: "\u7C98\u8D34\u6216\u9644\u52A0\u7684\u6587\u4EF6\u7684\u5B58\u653E\u4F4D\u7F6E\u3002",
    set_behavior_heading: "\u884C\u4E3A",
    set_language: "\u8BED\u8A00",
    set_language_desc: "\u754C\u9762\u8BED\u8A00\u3002",
    set_language_auto: "\u81EA\u52A8\uFF08\u8DDF\u968F Obsidian\uFF09",
    set_start_view: "\u6253\u5F00\u65F6\u7684\u89C6\u56FE",
    set_start_view_desc: "\u542F\u52A8\u65F6\u6253\u5F00\u54EA\u4E2A\u89C6\u56FE\u3002",
    set_start_view_last: "\u4E0A\u6B21\u4F7F\u7528",
    set_nl: "\u5728\u6807\u9898\u4E2D\u8BC6\u522B\u65E5\u671F\u548C #\u6807\u7B7E",
    set_nl_desc: "\u5728\u8F93\u5165\u4EFB\u52A1\u6807\u9898\u65F6\u81EA\u52A8\u89E3\u6790\u622A\u6B62\u65E5\u671F\u548C #\u6807\u7B7E\u3002",
    nav_trash: "\u56DE\u6536\u7AD9",
    empty_trash: "\u56DE\u6536\u7AD9\u4E3A\u7A7A\u3002",
    trash_restore_all: "\u5168\u90E8\u6062\u590D",
    trash_empty: "\u6E05\u7A7A\u56DE\u6536\u7AD9",
    confirm_empty_trash_q: "\u6E05\u7A7A\u56DE\u6536\u7AD9\uFF1F",
    msg_restored: "\u201C{0}\u201D\u5DF2\u6062\u590D\u3002",
    msg_trash_empty: "\u56DE\u6536\u7AD9\u5DF2\u7ECF\u662F\u7A7A\u7684\u3002",
    msg_trash_emptied: "\u56DE\u6536\u7AD9\u5DF2\u6E05\u7A7A \u2013 \u6C38\u4E45\u5220\u9664\u4E86 {0} \u4E2A\u4EFB\u52A1\u3002",
    report_trash_empty_restore: "\u56DE\u6536\u7AD9\u4E3A\u7A7A \u2013 \u6CA1\u6709\u53EF\u6062\u590D\u7684\u5185\u5BB9\u3002",
    report_tasks_restored: "\u5DF2\u6062\u590D {0} \u4E2A\u4EFB\u52A1\u3002",
    rem_at_time: "\u4EFB\u52A1\u5F00\u59CB\u65F6",
    rem_before: "\u63D0\u524D {0}",
    rem_unit_min: "{0} \u5206\u949F",
    rem_unit_hour: "{0} \u5C0F\u65F6",
    rem_unit_day: "{0} \u5929",
    rem_unit_days: "{0} \u5929",
    chip_reminder: "\u63D0\u9192",
    rem_count: "{0} \u4E2A\u63D0\u9192",
    reminders_title: "\u63D0\u9192",
    rem_tab_relative: "\u4EFB\u52A1\u4E4B\u524D",
    rem_tab_absolute: "\u65E5\u671F\u548C\u65F6\u95F4\u2026",
    rem_need_time: "\u8BF7\u5148\u8BBE\u7F6E\u65F6\u95F4",
    rem_add: "\u6DFB\u52A0\u63D0\u9192",
    date_confirm: "\u5E94\u7528",
    nav_filters: "\u7B5B\u9009\u5668",
    filter_add: "\u65B0\u5EFA\u7B5B\u9009\u5668",
    sec_tasks: "\u4EFB\u52A1",
    manage_empty_filters: "\u8FD8\u6CA1\u6709\u7B5B\u9009\u5668\u3002",
    nav_toggle_section: "\u6298\u53E0\u6216\u5C55\u5F00\u5206\u533A",
    new_project_title: "\u65B0\u5EFA\u9879\u76EE",
    new_area_title: "\u65B0\u5EFA\u9886\u57DF",
    new_label_title: "\u65B0\u5EFA\u6807\u7B7E",
    edit_project_title: "\u7F16\u8F91\u9879\u76EE",
    edit_area_title: "\u7F16\u8F91\u9886\u57DF",
    edit_label_title: "\u7F16\u8F91\u6807\u7B7E",
    show_in_sidebar: "\u5728\u4FA7\u8FB9\u680F\u663E\u793A",
    create_filter: "\u521B\u5EFA\u7B5B\u9009\u5668",
    create_label: "\u521B\u5EFA\u6807\u7B7E",
    create_project: "\u521B\u5EFA\u9879\u76EE",
    create_area: "\u521B\u5EFA\u9886\u57DF",
    btn_create: "\u521B\u5EFA",
    new_need_name: "\u8BF7\u8F93\u5165\u540D\u79F0\u3002",
    new_preview_hint: "\u9884\u89C8",
    empty_no_filter: "\u6B64\u7B5B\u9009\u5668\u5DF2\u4E0D\u5B58\u5728\u3002",
    empty_no_filter_tasks: "\u6CA1\u6709\u4EFB\u52A1\u5339\u914D\u6B64\u7B5B\u9009\u5668\u3002",
    filter_new: "\u65B0\u5EFA\u7B5B\u9009\u5668",
    filter_edit: "\u7F16\u8F91\u7B5B\u9009\u5668",
    filter_name: "\u540D\u79F0",
    filter_name_ph: "\u7B5B\u9009\u5668\u540D\u79F0 \u2026",
    filter_arrange: "\u6392\u5217",
    filter_facets: "\u7B5B\u9009",
    filter_dir: "\u65B9\u5411",
    filter_dir_asc: "\u5347\u5E8F",
    filter_dir_desc: "\u964D\u5E8F",
    filter_sort: "\u6392\u5E8F",
    filter_group: "\u5206\u7EC4",
    filter_show_done: "\u5305\u542B\u5DF2\u5B8C\u6210",
    filter_range: "\u65F6\u95F4",
    filter_priorities: "\u4F18\u5148\u7EA7",
    filter_labels: "\u6807\u7B7E",
    filter_projects: "\u9879\u76EE",
    filter_search: "\u641C\u7D22",
    filter_search_ph: "\u6807\u9898\u4E2D\u7684\u6587\u672C \u2026",
    filter_reset: "\u91CD\u7F6E",
    filter_delete: "\u5220\u9664",
    filter_save: "\u4FDD\u5B58",
    filter_need_name: "\u8BF7\u8F93\u5165\u540D\u79F0\u3002",
    filter_name_taken: "\u5DF2\u5B58\u5728\u540C\u540D\u7684\u8FC7\u6EE4\u5668\u3002",
    filter_facets_active: "{0} \u9879\u542F\u7528",
    filter_all: "\u5168\u90E8",
    filter_n_selected: "\u5DF2\u9009 {0} \u9879",
    filter_n_criteria: "\u5DF2\u9009 {0} \u4E2A\u6761\u4EF6",
    filter_mode_lead: "\u7B5B\u9009\u6A21\u5F0F",
    filter_mode_any: "\u4EFB\u4E00",
    filter_mode_all: "\u5168\u90E8",
    filter_mode_none: "\u65E0",
    filter_mode_s_any: "\u81F3\u5C11\u5339\u914D\u4E00\u4E2A\u3002",
    filter_mode_s_all: "\u5FC5\u987B\u5168\u90E8\u5339\u914D\u3002",
    filter_mode_s_none: "\u4E0D\u80FD\u5339\u914D\u4EFB\u4F55\u4E00\u4E2A\u3002",
    filter_range_any: "\u4EFB\u610F",
    filter_range_overdue: "\u5DF2\u903E\u671F",
    filter_range_today: "\u4ECA\u5929\u53CA\u903E\u671F",
    filter_range_next7: "\u672A\u6765 7 \u5929",
    filter_range_nodate: "\u65E0\u65E5\u671F",
    filter_sort_smart: "\u667A\u80FD",
    filter_sort_due: "\u65E5\u671F",
    filter_sort_deadline: "\u6700\u540E\u671F\u9650",
    filter_sort_priority: "\u4F18\u5148\u7EA7",
    filter_sort_created: "\u521B\u5EFA\u65F6\u95F4",
    filter_sort_title: "\u540D\u79F0",
    filter_group_none: "\u65E0",
    filter_group_status: "\u72B6\u6001",
    filter_group_date: "\u65E5\u671F",
    filter_group_deadline: "\u6700\u540E\u671F\u9650",
    filter_group_priority: "\u4F18\u5148\u7EA7",
    filter_group_label: "\u6807\u7B7E",
    filter_group_project: "\u9879\u76EE",
    view_display: "\u663E\u793A",
    panel_layout: "\u5E03\u5C40",
    panel_show_done: "\u663E\u793A\u5DF2\u5B8C\u6210",
    no_label: "\u65E0\u6807\u7B7E",
    more_actions: "\u66F4\u591A"
  },
  ru: {
    view_today: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    view_upcoming: "\u041F\u0440\u0435\u0434\u0441\u0442\u043E\u044F\u0449\u0438\u0435",
    view_recurring: "\u041F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0438\u0435\u0441\u044F",
    view_done: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E",
    status_todo: "\u041A \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044E",
    status_doing: "\u0412 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0435",
    status_done: "\u0413\u043E\u0442\u043E\u0432\u043E",
    status_cancelled: "\u041E\u0442\u043C\u0435\u043D\u0435\u043D\u0430",
    layout_list: "\u0421\u043F\u0438\u0441\u043E\u043A",
    layout_board: "\u0414\u043E\u0441\u043A\u0430",
    menu_cancel_task: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443",
    layout_calendar: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    cal_prev: "\u041D\u0430\u0437\u0430\u0434",
    cal_next: "\u0412\u043F\u0435\u0440\u0451\u0434",
    cal_today: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    cal_unscheduled: "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B",
    cal_unscheduled_empty: "\u041D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447 \u0431\u0435\u0437 \u0434\u0430\u0442\u044B",
    cal_mode_year: "\u0413\u043E\u0434",
    cal_tasks: "\u0437\u0430\u0434\u0430\u0447: {0}",
    cal_mode_month: "\u041C\u0435\u0441\u044F\u0446",
    cal_mode_week: "\u041D\u0435\u0434\u0435\u043B\u044F",
    cal_mode_day: "\u0414\u0435\u043D\u044C",
    cal_more: "+{0} \u0435\u0449\u0451",
    cal_allday: "\u0412\u0435\u0441\u044C \u0434\u0435\u043D\u044C",
    tab_statuses: "\u0421\u0442\u0430\u0442\u0443\u0441\u044B",
    status_add: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441",
    placeholder_status_name: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u0430",
    status_reset_default: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
    confirm_reset_statuses_q: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u0432\u0441\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044B \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E?",
    status_hint: "\u042D\u0442\u043E \u0441\u0442\u043E\u043B\u0431\u0446\u044B \u043A\u0430\u043D\u0431\u0430\u043D-\u0434\u043E\u0441\u043A\u0438 \u2014 \u043F\u043E\u0440\u044F\u0434\u043E\u043A = \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u0441\u0442\u043E\u043B\u0431\u0446\u043E\u0432.",
    status_kind_open: "\u041E\u0442\u043A\u0440\u044B\u0442",
    status_kind_done: "\u0413\u043E\u0442\u043E\u0432\u043E",
    status_kind_cancelled: "\u041E\u0442\u043C\u0435\u043D\u0451\u043D",
    role_new_tasks: "\u041D\u043E\u0432\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438",
    role_on_complete: "\u041F\u0440\u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0438",
    role_trash: "\u041A\u043E\u0440\u0437\u0438\u043D\u0430",
    status_pick_icon: "\u0417\u043D\u0430\u0447\u043E\u043A",
    status_pick_color: "\u0426\u0432\u0435\u0442",
    status_color_none: "\u0411\u0435\u0437 \u0446\u0432\u0435\u0442\u0430",
    color_custom: "\u0421\u0432\u043E\u0439 \u0446\u0432\u0435\u0442",
    btn_move_up: "\u0412\u0432\u0435\u0440\u0445",
    btn_move_down: "\u0412\u043D\u0438\u0437",
    status_need_done: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u0441\u0442\u0430\u0442\u0443\u0441 \xAB\u0413\u043E\u0442\u043E\u0432\u043E\xBB.",
    status_need_open: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0439 \u0441\u0442\u0430\u0442\u0443\u0441.",
    status_need_kind: "\u041E\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u0438\u043D \u0441\u0442\u0430\u0442\u0443\u0441 \u0432 \u043A\u0430\u0436\u0434\u043E\u0439 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438.",
    status_only_one_trash: "\u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442 \u0440\u043E\u0432\u043D\u043E \u043E\u0434\u0438\u043D \u0441\u0442\u0430\u0442\u0443\u0441 \u043A\u043E\u0440\u0437\u0438\u043D\u044B.",
    status_reassigned: "{0} \u0437\u0430\u0434\u0430\u0447 \u043F\u0435\u0440\u0435\u043C\u0435\u0449\u0435\u043D\u043E \u0432 {1}.",
    sort_by: "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
    sort_manual: "\u0412\u0440\u0443\u0447\u043D\u0443\u044E",
    sort_name: "\u0418\u043C\u044F",
    sort_count: "\u041A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E",
    whatsnew_title: "\u0427\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E",
    whatsnew_ok: "\u041F\u043E\u043D\u044F\u0442\u043D\u043E",
    wn_cal_t: "\u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    wn_cal_d: "\u0413\u043E\u0434, \u043C\u0435\u0441\u044F\u0446, \u043D\u0435\u0434\u0435\u043B\u044F \u0438 \u0434\u0435\u043D\u044C \u2014 \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0439\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0438, \u0447\u0442\u043E\u0431\u044B \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0442\u0438 \u0438\u0445.",
    wn_unsched_t: "\u041F\u0430\u043D\u0435\u043B\u044C \xAB\u0411\u0435\u0437 \u0434\u0430\u0442\u044B\xBB",
    wn_unsched_d: "\u0417\u0430\u0434\u0430\u0447\u0438 \u0431\u0435\u0437 \u0434\u0430\u0442\u044B, \u0433\u043E\u0442\u043E\u0432\u044B\u0435 \u043A \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0443 \u0432 \u0441\u0435\u0442\u043A\u0443.",
    wn_dir_t: "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0438",
    wn_dir_d: "\u041F\u043E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u0443\u0431\u044B\u0432\u0430\u043D\u0438\u044E, \u0434\u043B\u044F \u043B\u044E\u0431\u043E\u0433\u043E \u043A\u0440\u0438\u0442\u0435\u0440\u0438\u044F.",
    wn_excl_t: "\u0412\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0438 \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 \u0432 \u0444\u0438\u043B\u044C\u0442\u0440\u0430\u0445",
    wn_excl_d: "\u041E\u0442\u043C\u0435\u0447\u0430\u0439\u0442\u0435 \u043A\u0430\u0436\u0434\u043E\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435 \u043A\u0430\u043A \u2713 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u043B\u0438 \u2212 \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u2014 \u0432\u043F\u0435\u0440\u0435\u043C\u0435\u0448\u043A\u0443 \u0432 \u043E\u0434\u043D\u043E\u043C \u043F\u043E\u043B\u0435: \u043C\u0435\u0442\u043A\u0438, \u043F\u0440\u043E\u0435\u043A\u0442\u044B \u0438 \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u044B.",
    wn_fmode_t: "\u0420\u0435\u0436\u0438\u043C: \u043B\u044E\u0431\u043E\u0435 \xB7 \u0432\u0441\u0435 \xB7 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E",
    wn_fmode_d: "\u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u043F\u043E\u043B\u044F: \u0445\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E (\u0418\u041B\u0418), \u0432\u0441\u0435 (\u0418) \u0438\u043B\u0438 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E (\u041D\u0415).",
    wn_anytime_t: "\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \u0444\u0438\u043B\u044C\u0442\u0440 \xAB\u0412 \u043B\u044E\u0431\u043E\u0435 \u0432\u0440\u0435\u043C\u044F\xBB",
    wn_anytime_d: "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B \u0438 \u0431\u0435\u0437 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0451\u043D\u043D\u043E\u0439 \u043C\u0435\u0442\u043A\u0438 \u2014 \u0442\u0435\u043F\u0435\u0440\u044C \u0432 \u043E\u0434\u043D\u043E\u043C \u0444\u0438\u043B\u044C\u0442\u0440\u0435.",
    wn_chips_t: "\u041D\u0430\u0441\u0442\u0440\u043E\u0439\u0442\u0435 \u0447\u0438\u043F\u044B \u0432\u0432\u043E\u0434\u0430",
    wn_chips_d: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0439\u0442\u0435, \u0441\u043A\u0440\u044B\u0432\u0430\u0439\u0442\u0435 \u0438 \u043F\u0435\u0440\u0435\u0443\u043F\u043E\u0440\u044F\u0434\u043E\u0447\u0438\u0432\u0430\u0439\u0442\u0435 \u0447\u0438\u043F\u044B \u0432 \u0431\u044B\u0441\u0442\u0440\u043E\u043C \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u0438 \u043F\u043E\u043B\u043D\u043E\u043C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u043F\u043E \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u0438 \u2014 \u0441 \u043C\u0435\u043D\u044E + \u0434\u043B\u044F \u043E\u0441\u0442\u0430\u043B\u044C\u043D\u043E\u0433\u043E.",
    wn_status_t: "\u041D\u0430\u0434\u0451\u0436\u043D\u044B\u0435 \u0441\u0442\u0430\u0442\u0443\u0441\u044B",
    wn_status_d: "\u0423 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432 \u0442\u0435\u043F\u0435\u0440\u044C \u0433\u0430\u0440\u0430\u043D\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u044B\u0435 \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u0438 (\u043E\u0442\u043A\u0440\u044B\u0442 \xB7 \u0433\u043E\u0442\u043E\u0432\u043E \xB7 \u043A\u043E\u0440\u0437\u0438\u043D\u0430), \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u0441 \u0433\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u043A\u043E\u0439 \u043F\u043E \u043A\u0430\u0442\u0435\u0433\u043E\u0440\u0438\u044F\u043C \u0438 \u043A\u043E\u0440\u0437\u0438\u043D\u0430, \u043A\u043E\u0442\u043E\u0440\u0430\u044F \u0432\u0441\u0435\u0433\u0434\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442.",
    wn_quickadd_t: "\u041F\u043E\u043B\u043D\u043E\u0435 \u0431\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    wn_quickadd_d: "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442 \u0432\u0441\u0435 \u043F\u043E\u043B\u044F; \u043A\u043D\u043E\u043F\u043A\u0430 \u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442 \u0432\u0441\u0451 \u0432 \u043F\u043E\u043B\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440.",
    wn_reset_t: "\u0420\u0430\u0437\u0443\u043C\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
    wn_reset_d: "\u041D\u043E\u0432\u044B\u0435 \u043C\u0430\u043A\u0435\u0442\u044B \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0438 \u043A\u043D\u043E\u043F\u043A\u0438 \u0441\u0431\u0440\u043E\u0441\u0430 \u0434\u043B\u044F \u0440\u0430\u0441\u043A\u043B\u0430\u0434\u043A\u0438 \u0447\u0438\u043F\u043E\u0432 \u0438 \u0441\u0442\u0430\u0442\u0443\u0441\u043E\u0432.",
    wn_gcal_t: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0441 Google \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0451\u043C",
    wn_gcal_d: "\u041E\u0442\u0440\u0430\u0436\u0430\u0435\u0442 \u0437\u0430\u0434\u0430\u0447\u0438 \u0441\u043E \u0441\u0440\u043E\u043A\u043E\u043C \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u2014 \u0434\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u044E\u0442\u0441\u044F \u0432 \u043E\u0431\u0435 \u0441\u0442\u043E\u0440\u043E\u043D\u044B.",
    wn_gcalcal_t: "\u0412\u0430\u0448 \u0430\u043A\u043A\u0430\u0443\u043D\u0442, \u0432\u0430\u0448 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    wn_gcalcal_d: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0430\u0439\u0442\u0435\u0441\u044C \u0441\u043E \u0441\u0432\u043E\u0438\u043C\u0438 \u0443\u0447\u0451\u0442\u043D\u044B\u043C\u0438 \u0434\u0430\u043D\u043D\u044B\u043C\u0438 Google; \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043F\u043E\u043F\u0430\u0434\u0430\u044E\u0442 \u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C BeautyTasks.",
    wn_gcallist_t: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u043F\u043E \u0441\u043F\u0438\u0441\u043A\u0430\u043C",
    wn_gcallist_d: "\u0412\u043A\u043B\u044E\u0447\u0430\u0439\u0442\u0435 \u0438\u043B\u0438 \u043E\u0442\u043A\u043B\u044E\u0447\u0430\u0439\u0442\u0435 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044E \u0434\u043B\u044F \u043B\u044E\u0431\u043E\u0433\u043E \u043F\u0440\u043E\u0435\u043A\u0442\u0430, \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u0438\u043B\u0438 \u0432\u0445\u043E\u0434\u044F\u0449\u0438\u0445.",
    wn_gcalstat_t: "\u0421\u0442\u0430\u0442\u0443\u0441 \u0438 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B",
    wn_gcalstat_d: "\u0418\u043D\u0434\u0438\u043A\u0430\u0442\u043E\u0440 \u0432 \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044E; \u043F\u0440\u0438 \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0435 \u043F\u043E\u0431\u0435\u0436\u0434\u0430\u0435\u0442 Obsidian.",
    wn_board_t: "\u0414\u043E\u0441\u043A\u0430 \u043F\u043E \u0433\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u043A\u0435",
    wn_board_d: "\u0414\u043E\u0441\u043A\u0430 \u041A\u0430\u043D\u0431\u0430\u043D \u0442\u0435\u043F\u0435\u0440\u044C \u0441\u043B\u0435\u0434\u0443\u0435\u0442 \u0432\u0430\u0448\u0435\u0439 \u0433\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u043A\u0435: \u0441\u0442\u043E\u043B\u0431\u0446\u044B \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0443, \u043C\u0435\u0442\u043A\u0435, \u043F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442\u0443 \u0438\u043B\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u0443 \u2014 \u043F\u0435\u0440\u0435\u0442\u0430\u0441\u043A\u0438\u0432\u0430\u0439\u0442\u0435 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u043C\u0435\u0436\u0434\u0443 \u0441\u0442\u043E\u043B\u0431\u0446\u0430\u043C\u0438.",
    wn_langs_t: "8 \u043D\u043E\u0432\u044B\u0445 \u044F\u0437\u044B\u043A\u043E\u0432",
    wn_langs_d: "\u0418\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441 \u0442\u0435\u043F\u0435\u0440\u044C \u0442\u0430\u043A\u0436\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u043D\u0430 \u0438\u0441\u043F\u0430\u043D\u0441\u043A\u043E\u043C, \u043F\u043E\u0440\u0442\u0443\u0433\u0430\u043B\u044C\u0441\u043A\u043E\u043C, \u0444\u0440\u0430\u043D\u0446\u0443\u0437\u0441\u043A\u043E\u043C, \u0442\u0443\u0440\u0435\u0446\u043A\u043E\u043C, \u043A\u0438\u0442\u0430\u0439\u0441\u043A\u043E\u043C, \u0440\u0443\u0441\u0441\u043A\u043E\u043C, \u044F\u043F\u043E\u043D\u0441\u043A\u043E\u043C \u0438 \u0438\u0442\u0430\u043B\u044C\u044F\u043D\u0441\u043A\u043E\u043C.",
    wn_project_t: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 @ \u0434\u043B\u044F \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
    wn_project_d: "\u0412 \u0431\u044B\u0441\u0442\u0440\u043E\u043C \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0438 \u043D\u0430\u0437\u043D\u0430\u0447\u044C\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0443 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u043C\u0443 \u043F\u0440\u043E\u0435\u043A\u0442\u0443 \u0438\u043B\u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u0438, \u0432\u0432\u0435\u0434\u044F @\u0418\u043C\u044F.",
    wn_hidden_t: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u043A\u0440\u044B\u0442\u044B\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B",
    wn_hidden_d: "\u0429\u0451\u043B\u043A\u043D\u0438\u0442\u0435 \u043F\u0440\u0430\u0432\u043E\u0439 \u043A\u043D\u043E\u043F\u043A\u043E\u0439 \u043F\u043E \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0443 \u0440\u0430\u0437\u0434\u0435\u043B\u0430, \u0447\u0442\u043E\u0431\u044B \u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0441\u043A\u0440\u044B\u0442\u044B\u0435 \u0437\u0430\u043F\u0438\u0441\u0438 \u043E\u0434\u043D\u0438\u043C \u043A\u043B\u0438\u043A\u043E\u043C.",
    wn_ui_t: "\u0423\u043B\u0443\u0447\u0448\u0435\u043D\u0438\u044F \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430",
    wn_ui_d: "\u0410\u043A\u043A\u0443\u0440\u0430\u0442\u043D\u0435\u0435 \u0438 \u0433\u0438\u0431\u0447\u0435: \u0441\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430 \u0438 \u0433\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u043A\u0430 \u0432 \xAB\u0421\u0435\u0433\u043E\u0434\u043D\u044F\xBB, \u0434\u0430\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043D\u0430\u044F \u043F\u043E\u0432\u0435\u0441\u0442\u043A\u0430 \u0432 \xAB\u041F\u0440\u0435\u0434\u0441\u0442\u043E\u044F\u0449\u0438\u0445\xBB \u0438 \u043C\u0435\u043D\u044E \u043D\u0430 \u043A\u0430\u0436\u0434\u043E\u0439 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430, \u043C\u0435\u0442\u043A\u0438 \u0438 \u0444\u0438\u043B\u044C\u0442\u0440\u0430.",
    nav_inbox: "\u0412\u0445\u043E\u0434\u044F\u0449\u0438\u0435",
    group_area: "\u041E\u0431\u043B\u0430\u0441\u0442\u0438",
    group_project: "\u041F\u0440\u043E\u0435\u043A\u0442\u044B",
    sec_overdue: "\u041F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0435",
    sec_today: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    sec_upcoming: "\u041F\u0440\u0435\u0434\u0441\u0442\u043E\u044F\u0449\u0438\u0435",
    sec_no_date: "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B",
    sec_done: "\u0412\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E",
    count_task: "{0} \u0437\u0430\u0434\u0430\u0447\u0430",
    count_tasks: "{0} \u0437\u0430\u0434\u0430\u0447",
    empty_nothing_scheduled: "\u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0437\u0430\u043F\u043B\u0430\u043D\u0438\u0440\u043E\u0432\u0430\u043D\u043E.",
    empty_nothing_recurring: "\u041D\u0435\u0442 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u044E\u0449\u0438\u0445\u0441\u044F \u0437\u0430\u0434\u0430\u0447.",
    empty_nothing_done: "\u041F\u043E\u043A\u0430 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E.",
    empty_nothing_today: "\u041D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435\u0442.",
    empty_no_project_tasks: "\u0412 \u044D\u0442\u043E\u043C \u043F\u0440\u043E\u0435\u043A\u0442\u0435 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447.",
    empty_no_area_tasks: "\u0412 \u044D\u0442\u043E\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447.",
    empty_no_inbox_tasks: "\u0412\u043E \u0432\u0445\u043E\u0434\u044F\u0449\u0438\u0445 \u043F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447.",
    empty_no_label_tasks: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447 \u0441 \u044D\u0442\u043E\u0439 \u043C\u0435\u0442\u043A\u043E\u0439.",
    empty_no_tasks: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0437\u0430\u0434\u0430\u0447.",
    btn_add_task: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443",
    btn_cancel: "\u041E\u0442\u043C\u0435\u043D\u0430",
    btn_save: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    btn_delete: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
    details: "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438",
    subtask: "\u041F\u043E\u0434\u0437\u0430\u0434\u0430\u0447\u0430",
    placeholder_subtask: "\u041F\u043E\u0434\u0437\u0430\u0434\u0430\u0447\u0430",
    log_placeholder: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439 \u2026",
    log_attach: "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u0444\u0430\u0439\u043B",
    log_link: "\u0421\u0432\u044F\u0437\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443",
    log_add: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C",
    log_edit: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C",
    log_update: "\u041E\u0431\u043D\u043E\u0432\u0438\u0442\u044C",
    log_link_placeholder: "\u0421\u0432\u044F\u0437\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443 \u2026",
    btn_close: "\u0417\u0430\u043A\u0440\u044B\u0442\u044C",
    lb_prev: "\u041F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435",
    lb_next: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435",
    lb_copy: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435",
    msg_image_copied: "\u0418\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 \u0431\u0443\u0444\u0435\u0440 \u043E\u0431\u043C\u0435\u043D\u0430.",
    msg_image_copy_failed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u0435.",
    msg_attached: "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0435\u043D\u043E {0}",
    msg_attach_failed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C: {0}",
    err_detail_save: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438.",
    placeholder_taskname: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438",
    placeholder_description: "\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u2026",
    placeholder_date_input: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u0434\u0430\u0442\u0443 \u2026",
    placeholder_label: "\u041C\u0435\u0442\u043A\u0430",
    placeholder_project_name: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u0440\u043E\u0435\u043A\u0442\u0430 \u2026",
    placeholder_area_name: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 \u2026",
    chip_date: "\u0414\u0430\u0442\u0430",
    chip_priority: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442",
    chip_label: "\u041C\u0435\u0442\u043A\u0438",
    chip_recurrence: "\u041F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u0435",
    chip_deadline: "\u041A\u0440\u0430\u0439\u043D\u0438\u0439 \u0441\u0440\u043E\u043A",
    chip_parent: "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430",
    pick_parent: "\u041F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u0438\u0442\u044C \u043F\u043E\u0434 \u0437\u0430\u0434\u0430\u0447\u0443 \u2026",
    prio_1: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442 1",
    prio_2: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442 2",
    prio_3: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442 3",
    prio_4: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442 4",
    recur_none: "\u041D\u0435\u0442",
    recur_daily: "\u0415\u0436\u0435\u0434\u043D\u0435\u0432\u043D\u043E",
    recur_weekly: "\u0415\u0436\u0435\u043D\u0435\u0434\u0435\u043B\u044C\u043D\u043E",
    recur_monthly: "\u0415\u0436\u0435\u043C\u0435\u0441\u044F\u0447\u043D\u043E",
    recur_quarterly: "\u0415\u0436\u0435\u043A\u0432\u0430\u0440\u0442\u0430\u043B\u044C\u043D\u043E",
    recur_yearly: "\u0415\u0436\u0435\u0433\u043E\u0434\u043D\u043E",
    recur_basis: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0430\u044F \u0434\u0430\u0442\u0430 \u043E\u0442",
    recur_when_done: "\u041F\u043E \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0438",
    pick_new_project: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442",
    pick_new_area: "\u041D\u043E\u0432\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C",
    no_project: "\u0411\u0435\u0437 \u043F\u0440\u043E\u0435\u043A\u0442\u0430",
    make_area: "\u041E\u0431\u043B\u0430\u0441\u0442\u044C",
    make_area_hint: "\u041E\u0431\u043B\u0430\u0441\u0442\u0438 \u043F\u043E\u0441\u0442\u043E\u044F\u043D\u043D\u044B, \u0438\u0445 \u043D\u0435\u043B\u044C\u0437\u044F \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0438\u043B\u0438 \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C.",
    manage: "\u0423\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    manage_full: "\u041C\u0435\u043D\u0435\u0434\u0436\u0435\u0440 \u0441\u043F\u0438\u0441\u043A\u043E\u0432",
    tab_active: "\u0410\u043A\u0442\u0438\u0432\u043D\u044B\u0435",
    tab_archive: "\u0410\u0440\u0445\u0438\u0432",
    tab_labels: "\u041C\u0435\u0442\u043A\u0438",
    add_label: "\u041D\u043E\u0432\u0430\u044F \u043C\u0435\u0442\u043A\u0430",
    manage_empty_labels: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u043C\u044B\u0445 \u043C\u0435\u0442\u043E\u043A.",
    tip_show_sidebar: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043D\u0430 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438",
    tip_hide_sidebar: "\u0421\u043A\u0440\u044B\u0442\u044C \u0441 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438",
    tip_mark_area: "\u041F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u0442\u044C \u0432 \u043E\u0431\u043B\u0430\u0441\u0442\u044C",
    tip_unmark_area: "\u041F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u043E\u0432\u0430\u0442\u044C \u0432 \u043F\u0440\u043E\u0435\u043A\u0442",
    btn_rename: "\u041F\u0435\u0440\u0435\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u0442\u044C",
    btn_archive: "\u0410\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    btn_restore: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C",
    btn_delete_forever: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430",
    confirm_delete_q: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C?",
    confirm_delete_forever_q: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430?",
    menu_edit: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u2026",
    menu_reorder: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u2026",
    menu_reveal_hidden: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0441\u043A\u0440\u044B\u0442\u044B\u0435",
    menu_goto_projects: "\u041A \u043E\u0431\u0437\u043E\u0440\u0443 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432",
    menu_goto_areas: "\u041A \u043E\u0431\u0437\u043E\u0440\u0443 \u043E\u0431\u043B\u0430\u0441\u0442\u0435\u0439",
    menu_goto_labels: "\u041A \u043E\u0431\u0437\u043E\u0440\u0443 \u043C\u0435\u0442\u043E\u043A",
    menu_goto_filters: "\u041A \u043E\u0431\u0437\u043E\u0440\u0443 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432",
    reorder_active: "\u041F\u0435\u0440\u0435\u0443\u043F\u043E\u0440\u044F\u0434\u043E\u0447\u0438\u0432\u0430\u043D\u0438\u0435",
    reorder_done: "\u0413\u043E\u0442\u043E\u0432\u043E",
    archive_undo: "\u041E\u0442\u043C\u0435\u043D\u0438\u0442\u044C",
    archived_notice: "\xAB{0}\xBB \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u043D\u043E.",
    confirm_delete_title: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \xAB{0}\xBB?",
    confirm_delete_body: "\u042D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0442\u043C\u0435\u043D\u0438\u0442\u044C.",
    manage_empty_active: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u0438\u043B\u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u0435\u0439.",
    manage_empty_archive: "\u0412 \u0430\u0440\u0445\u0438\u0432\u0435 \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435\u0442.",
    manage_empty_projects: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432.",
    manage_empty_areas: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u043E\u0431\u043B\u0430\u0441\u0442\u0435\u0439.",
    manage_no_active_hint: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043F\u0440\u043E\u0435\u043A\u0442 \u0438\u0437 \u0434\u0438\u0430\u043B\u043E\u0433\u0430 \u0437\u0430\u0434\u0430\u0447\u0438, \u0437\u0430\u0442\u0435\u043C \u043F\u0440\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u043F\u0440\u0435\u043E\u0431\u0440\u0430\u0437\u0443\u0439\u0442\u0435 \u0435\u0433\u043E \u0432 \u043E\u0431\u043B\u0430\u0441\u0442\u044C \u0437\u0434\u0435\u0441\u044C.",
    date_today: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F",
    date_yesterday: "\u0412\u0447\u0435\u0440\u0430",
    date_tomorrow: "\u0417\u0430\u0432\u0442\u0440\u0430",
    date_this_weekend: "\u0412 \u044D\u0442\u0438 \u0432\u044B\u0445\u043E\u0434\u043D\u044B\u0435",
    date_next_week: "\u041D\u0430 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u043D\u0435\u0434\u0435\u043B\u0435",
    date_no_date: "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B",
    time_add: "\u0412\u0440\u0435\u043C\u044F",
    time_label: "\u0412\u0440\u0435\u043C\u044F",
    duration_label: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C",
    err_enter_taskname: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438.",
    err_parent_not_found: "\u0420\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u0441\u043A\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430.",
    cmd_new_task: "\u041D\u043E\u0432\u0430\u044F \u0437\u0430\u0434\u0430\u0447\u0430",
    cmd_quick_add: "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438",
    cmd_open_view: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C {0}",
    cmd_count_tasks: "\u041F\u043E\u0434\u0441\u0447\u0438\u0442\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0438",
    cmd_import: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438\u0437 Tasks/Lists",
    cmd_search: "\u041F\u043E\u0438\u0441\u043A \u0437\u0430\u0434\u0430\u0447",
    cmd_whatsnew: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C, \u0447\u0442\u043E \u043D\u043E\u0432\u043E\u0433\u043E",
    cmd_gcal_sync_now: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441 Google \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0451\u043C \u0441\u0435\u0439\u0447\u0430\u0441",
    cmd_export_json: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0437\u0430\u0434\u0430\u0447 (JSON)",
    cmd_import_json: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u0434\u0430\u0447 (JSON)",
    cmd_import_tasknotes: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438\u0437 TaskNotes",
    set_import_tn: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438\u0437 TaskNotes",
    set_import_tn_desc: "\u041F\u0435\u0440\u0435\u043D\u043E\u0441 \u0437\u0430\u0434\u0430\u0447 \u0438\u0437 \u043F\u043B\u0430\u0433\u0438\u043D\u0430 TaskNotes (\u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F \u043A\u0430\u043A \u0437\u0430\u043C\u0435\u0442\u043A\u0438 Markdown).",
    set_import_tn_btn: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438\u0437 TaskNotes",
    set_gcal_heading: "Google \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    gcal_not_connected: "\u041D\u0435 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E",
    gcal_setup_desc: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0439\u0442\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u0441 \u0434\u0430\u0442\u043E\u0439 \u0432 Google \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442 \u0432\u0430\u0448\u0438 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0435 \u0443\u0447\u0451\u0442\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 Google API (\u043E\u0434\u043D\u043E\u043A\u0440\u0430\u0442\u043D\u0430\u044F \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430, ~5 \u043C\u0438\u043D). \u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043A\u043B\u0438\u0435\u043D\u0442 OAuth \u0442\u0438\u043F\u0430 \xAB\u041F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u0435 \u0434\u043B\u044F \u043A\u043E\u043C\u043F\u044C\u044E\u0442\u0435\u0440\u0430\xBB \u0438 \u0432\u0441\u0442\u0430\u0432\u044C\u0442\u0435 \u0435\u0433\u043E ID \u0438 \u0441\u0435\u043A\u0440\u0435\u0442 \u043D\u0438\u0436\u0435.",
    gcal_help_btn: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0440\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u043F\u043E \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0435",
    gcal_setup_hint: "\u0412\u043F\u0435\u0440\u0432\u044B\u0435? \u0420\u0443\u043A\u043E\u0432\u043E\u0434\u0441\u0442\u0432\u043E \u043F\u0440\u043E\u0432\u0435\u0434\u0451\u0442 \u0432\u0430\u0441 \u0447\u0435\u0440\u0435\u0437 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0443\u0447\u0451\u0442\u043D\u044B\u0445 \u0434\u0430\u043D\u043D\u044B\u0445 Google.",
    gcal_client_id: "ID \u043A\u043B\u0438\u0435\u043D\u0442\u0430",
    gcal_client_secret: "\u0421\u0435\u043A\u0440\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u0430",
    gcal_connect_btn: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C",
    gcal_connecting: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435\u2026",
    gcal_connect_failed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F: {0}",
    gcal_connected_as: "\u041F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u043E \u043A\u0430\u043A {0}",
    gcal_disconnect_btn: "\u041E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C",
    gcal_last_synced: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F: {0}",
    gcal_never: "\u043D\u0438\u043A\u043E\u0433\u0434\u0430",
    gcal_syncing: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F\u2026",
    gcal_sync_error: "\u041E\u0448\u0438\u0431\u043A\u0430: {0}",
    gcal_sync_now_btn: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0435\u0439\u0447\u0430\u0441",
    gcal_target_calendar: "\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    gcal_target_calendar_desc: "\u0412 \u043A\u0430\u043A\u043E\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u043E\u0442\u0440\u0430\u0436\u0430\u044E\u0442\u0441\u044F \u0437\u0430\u0434\u0430\u0447\u0438 \u0441 \u0434\u0430\u0442\u043E\u0439.",
    gcal_create_calendar_btn: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C BeautyTasks",
    gcal_create_calendar_desc: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \xABBeautyTasks\xBB \u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0435\u0433\u043E (\u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043F\u0435\u0440\u0435\u043C\u0435\u0441\u0442\u044F\u0442\u0441\u044F \u043F\u0440\u0438 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u0439 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438).",
    gcal_sync_list: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441 Google \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0451\u043C",
    gcal_tip_create: "\u0421\u043E\u0432\u0435\u0442: \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C",
    gcal_tip_create_desc: "\u0421\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u0441\u043E\u0431\u0441\u0442\u0432\u0435\u043D\u043D\u044B\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C Google \u0438 \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0438\u0442\u0435 \u0442\u0443\u0434\u0430 \u0437\u0430\u0434\u0430\u0447\u0438 (\u0447\u0438\u0441\u0442\u043E\u0435 \u043E\u0442\u0434\u0435\u043B\u0435\u043D\u0438\u0435 \u043E\u0442 \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0433\u043E \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044F).",
    gcal_create_calendar_failed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C: {0} \u2014 \u0432\u043E\u0437\u043C\u043E\u0436\u043D\u043E, \u043D\u0443\u0436\u043D\u043E \u043E\u0442\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u044C\u0441\u044F \u0437\u0430\u043D\u043E\u0432\u043E (\u043D\u043E\u0432\u043E\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u0438\u0435).",
    gcal_no_calendar_warn: "\u0426\u0435\u043B\u0435\u0432\u043E\u0439 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C \u0435\u0449\u0451 \u043D\u0435 \u0432\u044B\u0431\u0440\u0430\u043D \u2014 \u0432\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u0435\u0433\u043E \u043D\u0438\u0436\u0435 \u0438\u043B\u0438 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044C BeautyTasks. \u0414\u043E \u044D\u0442\u043E\u0433\u043E \u043D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u0443\u0435\u0442\u0441\u044F.",
    gcal_enabled: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0438 \u0441 \u0434\u0430\u0442\u043E\u0439",
    gcal_enabled_desc: "\u041E\u0442\u0440\u0430\u0436\u0430\u0442\u044C \u043A\u0430\u043A \u0441\u043E\u0431\u044B\u0442\u0438\u0435 \u043A\u0430\u0436\u0434\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443 \u0441\u043E \u0441\u0440\u043E\u043A\u043E\u043C \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F.",
    gcal_autosync: "\u0421\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438",
    gcal_autosync_desc: "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u043F\u043E \u043C\u0435\u0440\u0435 \u0440\u0435\u0434\u0430\u043A\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447 (\u0438\u043D\u0430\u0447\u0435 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044F \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E \u043A\u043E\u043C\u0430\u043D\u0434\u0435).",
    gcal_advanced: "\u0414\u043E\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C\u043D\u043E",
    gcal_on_create: "\u0414\u043E\u0431\u0430\u0432\u043B\u044F\u0442\u044C \u043D\u043E\u0432\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438",
    gcal_on_update: "\u041E\u0442\u043F\u0440\u0430\u0432\u043B\u044F\u0442\u044C \u0438\u0437\u043C\u0435\u043D\u0435\u043D\u0438\u044F \u0432 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F",
    gcal_on_delete: "\u0423\u0434\u0430\u043B\u044F\u0442\u044C \u0441\u043E\u0431\u044B\u0442\u0438\u0435, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u0434\u0430\u0447\u0430 \u0443\u0434\u0430\u043B\u0435\u043D\u0430 \u0438\u043B\u0438 \u0431\u0435\u0437 \u0434\u0430\u0442\u044B",
    gcal_remove_on_complete: "\u0423\u0434\u0430\u043B\u044F\u0442\u044C \u0441\u043E\u0431\u044B\u0442\u0438\u0435, \u043A\u043E\u0433\u0434\u0430 \u0437\u0430\u0434\u0430\u0447\u0430 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0430",
    gcal_duration: "\u0414\u043B\u0438\u0442\u0435\u043B\u044C\u043D\u043E\u0441\u0442\u044C \u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E (\u043C\u0438\u043D\u0443\u0442\u044B)",
    gcal_timezone: "\u0427\u0430\u0441\u043E\u0432\u043E\u0439 \u043F\u043E\u044F\u0441",
    gcal_statusbar: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0432 \u0441\u0442\u0440\u043E\u043A\u0435 \u0441\u043E\u0441\u0442\u043E\u044F\u043D\u0438\u044F",
    gcal_notify_conflicts: "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u044F\u0442\u044C \u043E \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u0430\u0445",
    gcal_device_prompt: "\u041E\u0442\u043A\u0440\u043E\u0439\u0442\u0435 {0} \u0438 \u0432\u0432\u0435\u0434\u0438\u0442\u0435 \u043A\u043E\u0434: {1}",
    gcal_reconnect_hint: "\u043F\u0435\u0440\u0435\u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u0441\u044C \u0432 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0430\u0445",
    gcal_conflicts_notice: "\u0420\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u043E \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u043E\u0432: {0} \u2014 \u0441\u043E\u0445\u0440\u0430\u043D\u0435\u043D\u044B \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F Obsidian",
    menu_gcal_exclude: "\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0438\u0437 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0441 \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0451\u043C",
    menu_gcal_include: "\u0412\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0432 \u0441\u0438\u043D\u0445\u0440\u043E\u043D\u0438\u0437\u0430\u0446\u0438\u044E \u0441 \u041A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u0451\u043C",
    tn_import_title: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438\u0437 TaskNotes",
    tn_import_desc: "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u043D\u043E\u0432\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 BeautyTasks \u0438\u0437 \u0432\u0430\u0448\u0438\u0445 \u0437\u0430\u0434\u0430\u0447 TaskNotes. \u0412\u0430\u0448\u0438 \u0444\u0430\u0439\u043B\u044B TaskNotes \u043E\u0441\u0442\u0430\u044E\u0442\u0441\u044F \u043D\u0435\u0442\u0440\u043E\u043D\u0443\u0442\u044B\u043C\u0438.",
    tn_import_tag: "\u0422\u0435\u0433 \u0437\u0430\u0434\u0430\u0447\u0438",
    tn_import_tag_desc: "\u0422\u0435\u0433 frontmatter, \u043F\u043E\u043C\u0435\u0447\u0430\u044E\u0449\u0438\u0439 \u0437\u0430\u043C\u0435\u0442\u043A\u0443 \u043A\u0430\u043A \u0437\u0430\u0434\u0430\u0447\u0443 TaskNotes.",
    tn_import_folder: "\u041F\u0430\u043F\u043A\u0430 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)",
    tn_import_folder_desc: "\u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0442\u044C \u043F\u0430\u043F\u043A\u043E\u0439. \u041F\u0443\u0441\u0442\u043E \u2014 \u0441\u043A\u0430\u043D\u0438\u0440\u0443\u0435\u0442\u0441\u044F \u0432\u0441\u0451 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435.",
    tn_import_folder_ph: "\u043D\u0430\u043F\u0440. \u0417\u0430\u0434\u0430\u0447\u0438",
    tn_import_found: "\u041D\u0430\u0439\u0434\u0435\u043D\u043E \u0437\u0430\u043C\u0435\u0442\u043E\u043A \u0437\u0430\u0434\u0430\u0447: {0}.",
    tn_import_none: "\u0417\u0430\u0434\u0430\u0447\u0438 TaskNotes \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B.",
    tn_import_btn: "\u0418\u043C\u043F\u043E\u0440\u0442",
    tn_import_done: "\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E {0}, \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E {1}.",
    tn_import_lossy: "{0} \u0437\u0430\u0434\u0430\u0447 \u0441\u043E \u0441\u043B\u043E\u0436\u043D\u044B\u043C \u043F\u043E\u0432\u0442\u043E\u0440\u0435\u043D\u0438\u0435\u043C \u0441\u043E\u0445\u0440\u0430\u043D\u0438\u043B\u0438 \u043E\u0440\u0438\u0433\u0438\u043D\u0430\u043B \u043A\u0430\u043A \u0437\u0430\u043C\u0435\u0442\u043A\u0443.",
    tn_import_failed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C.",
    qa_placeholder: "\u043D\u0430\u043F\u0440. \u041D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u043E\u0442\u0447\u0451\u0442 \u0437\u0430\u0432\u0442\u0440\u0430 p1 #\u0432\u0430\u0436\u043D\u043E @\u0440\u0430\u0431\u043E\u0442\u0430",
    qa_added: "\u0417\u0430\u0434\u0430\u0447\u0430 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0430",
    qa_open_full: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u043F\u043E\u043B\u043D\u043E\u043C \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435",
    nav_search: "\u041F\u043E\u0438\u0441\u043A",
    search_placeholder: "\u041F\u043E\u0438\u0441\u043A \u0437\u0430\u0434\u0430\u0447 \u2026",
    search_exclude_archived: "\u0418\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0430\u0440\u0445\u0438\u0432",
    notice_count: "BeautyTasks: {0} \u0437\u0430\u0434\u0430\u0447 ({1} \u043E\u0442\u043A\u0440\u044B\u0442\u044B\u0445)",
    notice_import_running: "BeautyTasks: \u0438\u043C\u043F\u043E\u0440\u0442 \u2026",
    notice_imported: "BeautyTasks: \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0437\u0430\u0434\u0430\u0447: {0}.",
    notice_import_failed: "BeautyTasks: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0438\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C (\u0441\u043C. \u043A\u043E\u043D\u0441\u043E\u043B\u044C).",
    notice_export_done: "BeautyTasks: \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E \u0432 {0}",
    notice_export_failed: "BeautyTasks: \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u0442\u044C (\u0441\u043C. \u043A\u043E\u043D\u0441\u043E\u043B\u044C).",
    notice_import_invalid: "BeautyTasks: \u043D\u0435\u0432\u0435\u0440\u043D\u044B\u0439 \u0444\u0430\u0439\u043B \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430.",
    notice_import_summary: "BeautyTasks: \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u043E \u0437\u0430\u0434\u0430\u0447: {0}, \u043F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E: {1}.",
    import_pick_placeholder: "\u0412\u044B\u0431\u0435\u0440\u0438\u0442\u0435 \u044D\u043A\u0441\u043F\u043E\u0440\u0442 JSON \u2026",
    set_data_heading: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0438 \u044D\u043A\u0441\u043F\u043E\u0440\u0442",
    set_export: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0437\u0430\u0434\u0430\u0447",
    set_export_desc: "\u0421\u043E\u0445\u0440\u0430\u043D\u044F\u0435\u0442 \u0432\u0441\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u0432 \u0444\u0430\u0439\u043B JSON \u0432 \u0432\u0430\u0448\u0435\u043C \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0435 (\u0431\u0435\u0437 \u043F\u043E\u0442\u0435\u0440\u044C).",
    set_export_btn: "\u042D\u043A\u0441\u043F\u043E\u0440\u0442",
    set_import: "\u0418\u043C\u043F\u043E\u0440\u0442 \u0437\u0430\u0434\u0430\u0447",
    set_import_desc: "\u0427\u0438\u0442\u0430\u0435\u0442 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438\u0437 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 JSON. \u0421\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u043F\u0440\u043E\u043F\u0443\u0441\u043A\u0430\u044E\u0442\u0441\u044F (\u043F\u043E id).",
    set_import_vault_btn: "\u0418\u0437 \u0445\u0440\u0430\u043D\u0438\u043B\u0438\u0449\u0430 \u2026",
    set_import_os_btn: "\u0418\u0437 \u0444\u0430\u0439\u043B\u0430 \u2026",
    ribbon_open: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C BeautyTasks",
    set_show_desc: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0432 \u0441\u043F\u0438\u0441\u043A\u0430\u0445",
    set_show_desc_desc: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u043E\u0434\u043D\u043E\u0441\u0442\u0440\u043E\u0447\u043D\u044B\u0439 \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044F \u043F\u043E\u0434 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435\u043C \u0437\u0430\u0434\u0430\u0447\u0438.",
    set_chips_iconsonly: "\u041A\u043E\u043C\u043F\u0430\u043A\u0442\u043D\u044B\u0435 \u0447\u0438\u043F\u044B (\u0442\u043E\u043B\u044C\u043A\u043E \u0437\u043D\u0430\u0447\u043A\u0438)",
    set_chips_iconsonly_desc: "\u0412 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435 \u0437\u0430\u0434\u0430\u0447 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E \u0437\u043D\u0430\u0447\u043A\u0438 \u043F\u0443\u0441\u0442\u044B\u0445 \u0447\u0438\u043F\u043E\u0432 \u043E\u043F\u0446\u0438\u0439 (\u0414\u0430\u0442\u0430, \u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442, \u041C\u0435\u0442\u043A\u0430 \u2026); \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0432 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u0435. \u0427\u0438\u043F\u044B \u0441\u043E \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0435\u043C \u043F\u043E-\u043F\u0440\u0435\u0436\u043D\u0435\u043C\u0443 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u044E\u0442 \u0435\u0433\u043E.",
    task_actions: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0441 \u0437\u0430\u0434\u0430\u0447\u0435\u0439",
    chip_status: "\u0421\u0442\u0430\u0442\u0443\u0441",
    more_chip_actions: "\u0414\u0440\u0443\u0433\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F",
    edit_task_actions: "\u041D\u0430\u0441\u0442\u0440\u043E\u0438\u0442\u044C \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438",
    set_chip_actions: "\u0414\u0435\u0439\u0441\u0442\u0432\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438 (\u0447\u0438\u043F\u044B \u0432\u0432\u043E\u0434\u0430)",
    set_chip_actions_desc: "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435 \u0438 \u043F\u043E\u043B\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440 \u043D\u0430\u0441\u0442\u0440\u0430\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E. \u041F\u0435\u0440\u0435\u0442\u0430\u0449\u0438\u0442\u0435 \u043A\u0430\u0436\u0434\u044B\u0439 \u0447\u0438\u043F \u0432 \u0440\u0430\u0437\u0434\u0435\u043B: \u0412\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C, \u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0438 \u0438\u043B\u0438 \u0422\u043E\u043B\u044C\u043A\u043E \u0432 \u043C\u0435\u043D\u044E +. \u041F\u043E\u0440\u044F\u0434\u043E\u043A = \u043F\u043E\u0440\u044F\u0434\u043E\u043A \u0447\u0438\u043F\u043E\u0432.",
    chip_tier_shown: "\u0412\u0441\u0435\u0433\u0434\u0430 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C",
    chip_tier_onValue: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u0438",
    chip_tier_hidden: "\u0422\u043E\u043B\u044C\u043A\u043E \u0432 \u043C\u0435\u043D\u044E +",
    chip_surface_editor: "\u041F\u043E\u043B\u043D\u044B\u0439 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440",
    chip_surface_quickadd: "\u0411\u044B\u0441\u0442\u0440\u043E\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    chip_reset_default: "\u0421\u0431\u0440\u043E\u0441\u0438\u0442\u044C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E",
    menu_create_subtask: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0434\u0437\u0430\u0434\u0430\u0447\u0443",
    menu_show_parent: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C\u0441\u043A\u0443\u044E \u0437\u0430\u0434\u0430\u0447\u0443",
    menu_duplicate: "\u0414\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0437\u0430\u0434\u0430\u0447\u0443",
    menu_copy_link: "\u041A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u0437\u0430\u0434\u0430\u0447\u0443",
    menu_open_obsidian: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 Obsidian",
    menu_open_editor: "\u041E\u0442\u043A\u0440\u044B\u0442\u044C \u0432 \u0440\u0435\u0434\u0430\u043A\u0442\u043E\u0440\u0435",
    menu_print: "\u041F\u0435\u0447\u0430\u0442\u044C",
    copy_suffix: "(\u041A\u043E\u043F\u0438\u044F)",
    msg_duplicated: "\u0417\u0430\u0434\u0430\u0447\u0430 \u043F\u0440\u043E\u0434\u0443\u0431\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0430",
    msg_link_copied: "\u0421\u0441\u044B\u043B\u043A\u0430 \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u043D\u0430",
    msg_link_copy_failed: "\u041D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0441\u043A\u043E\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443.",
    set_folders_heading: "\u041F\u0430\u043F\u043A\u0438",
    set_folder_items: "\u041F\u0430\u043F\u043A\u0430 \u0437\u0430\u0434\u0430\u0447",
    set_folder_items_desc: "\u0413\u0434\u0435 \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F \u043D\u043E\u0432\u044B\u0435 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u0437\u0430\u0434\u0430\u0447.",
    set_folder_projects: "\u041F\u0430\u043F\u043A\u0430 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432",
    set_folder_projects_desc: "\u0413\u0434\u0435 \u0441\u043E\u0437\u0434\u0430\u044E\u0442\u0441\u044F \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u043F\u0440\u043E\u0435\u043A\u0442\u043E\u0432 \u0438 \u043E\u0431\u043B\u0430\u0441\u0442\u0435\u0439.",
    set_folder_attachments: "\u041F\u0430\u043F\u043A\u0430 \u0432\u043B\u043E\u0436\u0435\u043D\u0438\u0439",
    set_folder_attachments_desc: "\u0413\u0434\u0435 \u0445\u0440\u0430\u043D\u044F\u0442\u0441\u044F \u0432\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0435 \u0438\u043B\u0438 \u043F\u0440\u0438\u043A\u0440\u0435\u043F\u043B\u0451\u043D\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B.",
    set_behavior_heading: "\u041F\u043E\u0432\u0435\u0434\u0435\u043D\u0438\u0435",
    set_language: "\u042F\u0437\u044B\u043A",
    set_language_desc: "\u042F\u0437\u044B\u043A \u0438\u043D\u0442\u0435\u0440\u0444\u0435\u0439\u0441\u0430.",
    set_language_auto: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 (\u043A\u0430\u043A \u0432 Obsidian)",
    set_start_view: "\u0412\u0438\u0434 \u043F\u0440\u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u0438\u0438",
    set_start_view_desc: "\u041A\u0430\u043A\u043E\u0439 \u0432\u0438\u0434 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043F\u0440\u0438 \u0437\u0430\u043F\u0443\u0441\u043A\u0435.",
    set_start_view_last: "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0439 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u043D\u043D\u044B\u0439",
    set_nl: "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u044F\u0442\u044C \u0434\u0430\u0442\u0443 \u0438 #\u043C\u0435\u0442\u043A\u0438 \u0432 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0438",
    set_nl_desc: "\u0410\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0440\u0430\u0441\u043F\u043E\u0437\u043D\u0430\u0451\u0442 \u0441\u0440\u043E\u043A\u0438 \u0438 #\u043C\u0435\u0442\u043A\u0438 \u043F\u0440\u0438 \u0432\u0432\u043E\u0434\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0437\u0430\u0434\u0430\u0447\u0438.",
    nav_trash: "\u041A\u043E\u0440\u0437\u0438\u043D\u0430",
    empty_trash: "\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u043F\u0443\u0441\u0442\u0430.",
    trash_restore_all: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u044C \u0432\u0441\u0451",
    trash_empty: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u043E\u0440\u0437\u0438\u043D\u0443",
    confirm_empty_trash_q: "\u041E\u0447\u0438\u0441\u0442\u0438\u0442\u044C \u043A\u043E\u0440\u0437\u0438\u043D\u0443?",
    msg_restored: "\xAB{0}\xBB \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u0430.",
    msg_trash_empty: "\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u0443\u0436\u0435 \u043F\u0443\u0441\u0442\u0430.",
    msg_trash_emptied: "\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u043E\u0447\u0438\u0449\u0435\u043D\u0430 \u2013 \u0443\u0434\u0430\u043B\u0435\u043D\u043E \u043D\u0430\u0432\u0441\u0435\u0433\u0434\u0430 \u0437\u0430\u0434\u0430\u0447: {0}.",
    report_trash_empty_restore: "\u041A\u043E\u0440\u0437\u0438\u043D\u0430 \u043F\u0443\u0441\u0442\u0430 \u2013 \u043D\u0435\u0447\u0435\u0433\u043E \u0432\u043E\u0441\u0441\u0442\u0430\u043D\u0430\u0432\u043B\u0438\u0432\u0430\u0442\u044C.",
    report_tasks_restored: "\u0412\u043E\u0441\u0441\u0442\u0430\u043D\u043E\u0432\u043B\u0435\u043D\u043E \u0437\u0430\u0434\u0430\u0447: {0}.",
    rem_at_time: "\u0412 \u043C\u043E\u043C\u0435\u043D\u0442 \u0437\u0430\u0434\u0430\u0447\u0438",
    rem_before: "\u0437\u0430 {0} \u0434\u043E",
    rem_unit_min: "{0} \u043C\u0438\u043D",
    rem_unit_hour: "{0} \u0447",
    rem_unit_day: "{0} \u0434\u0435\u043D\u044C",
    rem_unit_days: "{0} \u0434\u043D.",
    chip_reminder: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435",
    rem_count: "{0} \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0439",
    reminders_title: "\u041D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F",
    rem_tab_relative: "\u041F\u0435\u0440\u0435\u0434 \u0437\u0430\u0434\u0430\u0447\u0435\u0439",
    rem_tab_absolute: "\u0414\u0430\u0442\u0430 \u0438 \u0432\u0440\u0435\u043C\u044F\u2026",
    rem_need_time: "\u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u0443\u043A\u0430\u0436\u0438\u0442\u0435 \u0432\u0440\u0435\u043C\u044F",
    rem_add: "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435",
    date_confirm: "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C",
    nav_filters: "\u0424\u0438\u043B\u044C\u0442\u0440\u044B",
    filter_add: "\u041D\u043E\u0432\u044B\u0439 \u0444\u0438\u043B\u044C\u0442\u0440",
    sec_tasks: "\u0417\u0430\u0434\u0430\u0447\u0438",
    manage_empty_filters: "\u041F\u043E\u043A\u0430 \u043D\u0435\u0442 \u0444\u0438\u043B\u044C\u0442\u0440\u043E\u0432.",
    nav_toggle_section: "\u0421\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0438\u043B\u0438 \u0440\u0430\u0437\u0432\u0435\u0440\u043D\u0443\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B",
    new_project_title: "\u041D\u043E\u0432\u044B\u0439 \u043F\u0440\u043E\u0435\u043A\u0442",
    new_area_title: "\u041D\u043E\u0432\u0430\u044F \u043E\u0431\u043B\u0430\u0441\u0442\u044C",
    new_label_title: "\u041D\u043E\u0432\u0430\u044F \u043C\u0435\u0442\u043A\u0430",
    edit_project_title: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442",
    edit_area_title: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043E\u0431\u043B\u0430\u0441\u0442\u044C",
    edit_label_title: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043C\u0435\u0442\u043A\u0443",
    show_in_sidebar: "\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043D\u0430 \u0431\u043E\u043A\u043E\u0432\u043E\u0439 \u043F\u0430\u043D\u0435\u043B\u0438",
    create_filter: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440",
    create_label: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043C\u0435\u0442\u043A\u0443",
    create_project: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u0440\u043E\u0435\u043A\u0442",
    create_area: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u0431\u043B\u0430\u0441\u0442\u044C",
    btn_create: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C",
    new_need_name: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435.",
    new_preview_hint: "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440",
    empty_no_filter: "\u042D\u0442\u043E\u0442 \u0444\u0438\u043B\u044C\u0442\u0440 \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.",
    empty_no_filter_tasks: "\u041D\u0438 \u043E\u0434\u043D\u0430 \u0437\u0430\u0434\u0430\u0447\u0430 \u043D\u0435 \u0441\u043E\u043E\u0442\u0432\u0435\u0442\u0441\u0442\u0432\u0443\u0435\u0442 \u044D\u0442\u043E\u043C\u0443 \u0444\u0438\u043B\u044C\u0442\u0440\u0443.",
    filter_new: "\u041D\u043E\u0432\u044B\u0439 \u0444\u0438\u043B\u044C\u0442\u0440",
    filter_edit: "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0444\u0438\u043B\u044C\u0442\u0440",
    filter_name: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    filter_name_ph: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u0430 \u2026",
    filter_arrange: "\u0423\u043F\u043E\u0440\u044F\u0434\u043E\u0447\u0438\u0442\u044C",
    filter_facets: "\u0424\u0438\u043B\u044C\u0442\u0440",
    filter_dir: "\u041D\u0430\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u0438\u0435",
    filter_dir_asc: "\u041F\u043E \u0432\u043E\u0437\u0440\u0430\u0441\u0442\u0430\u043D\u0438\u044E",
    filter_dir_desc: "\u041F\u043E \u0443\u0431\u044B\u0432\u0430\u043D\u0438\u044E",
    filter_sort: "\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430",
    filter_group: "\u0413\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u043A\u0430",
    filter_show_done: "\u0412\u043A\u043B\u044E\u0447\u0430\u044F \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0435",
    filter_range: "\u041F\u0435\u0440\u0438\u043E\u0434",
    filter_priorities: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442",
    filter_labels: "\u041C\u0435\u0442\u043A\u0438",
    filter_projects: "\u041F\u0440\u043E\u0435\u043A\u0442\u044B",
    filter_search: "\u041F\u043E\u0438\u0441\u043A",
    filter_search_ph: "\u0422\u0435\u043A\u0441\u0442 \u0432 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0438 \u2026",
    filter_reset: "\u0421\u0431\u0440\u043E\u0441",
    filter_delete: "\u0423\u0434\u0430\u043B\u0438\u0442\u044C",
    filter_save: "\u0421\u043E\u0445\u0440\u0430\u043D\u0438\u0442\u044C",
    filter_need_name: "\u0412\u0432\u0435\u0434\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435.",
    filter_name_taken: "\u0424\u0438\u043B\u044C\u0442\u0440 \u0441 \u0442\u0430\u043A\u0438\u043C \u0438\u043C\u0435\u043D\u0435\u043C \u0443\u0436\u0435 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u0435\u0442.",
    filter_facets_active: "{0} \u0430\u043A\u0442\u0438\u0432\u043D\u043E",
    filter_all: "\u0412\u0441\u0435",
    filter_n_selected: "\u0412\u044B\u0431\u0440\u0430\u043D\u043E: {0}",
    filter_n_criteria: "\u041A\u0440\u0438\u0442\u0435\u0440\u0438\u0435\u0432 \u0432\u044B\u0431\u0440\u0430\u043D\u043E: {0}",
    filter_mode_lead: "\u0420\u0435\u0436\u0438\u043C \u0444\u0438\u043B\u044C\u0442\u0440\u0430",
    filter_mode_any: "\u043B\u044E\u0431\u043E\u0439",
    filter_mode_all: "\u0432\u0441\u0435",
    filter_mode_none: "\u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E",
    filter_mode_s_any: "\u0425\u043E\u0442\u044F \u0431\u044B \u043E\u0434\u043D\u043E \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442.",
    filter_mode_s_all: "\u0414\u043E\u043B\u0436\u043D\u044B \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0442\u044C \u0432\u0441\u0435.",
    filter_mode_s_none: "\u041D\u0438 \u043E\u0434\u043D\u043E \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442.",
    filter_range_any: "\u041B\u044E\u0431\u043E\u0439",
    filter_range_overdue: "\u041F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0435",
    filter_range_today: "\u0421\u0435\u0433\u043E\u0434\u043D\u044F \u0438 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0435",
    filter_range_next7: "\u0421\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 7 \u0434\u043D\u0435\u0439",
    filter_range_nodate: "\u0411\u0435\u0437 \u0434\u0430\u0442\u044B",
    filter_sort_smart: "\u0423\u043C\u043D\u0430\u044F",
    filter_sort_due: "\u0414\u0430\u0442\u0430",
    filter_sort_deadline: "\u041A\u0440\u0430\u0439\u043D\u0438\u0439 \u0441\u0440\u043E\u043A",
    filter_sort_priority: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442",
    filter_sort_created: "\u0414\u0430\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F",
    filter_sort_title: "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435",
    filter_group_none: "\u041D\u0435\u0442",
    filter_group_status: "\u0421\u0442\u0430\u0442\u0443\u0441",
    filter_group_date: "\u0414\u0430\u0442\u0430",
    filter_group_deadline: "\u041A\u0440\u0430\u0439\u043D\u0438\u0439 \u0441\u0440\u043E\u043A",
    filter_group_priority: "\u041F\u0440\u0438\u043E\u0440\u0438\u0442\u0435\u0442",
    filter_group_label: "\u041C\u0435\u0442\u043A\u0430",
    filter_group_project: "\u041F\u0440\u043E\u0435\u043A\u0442\u044B",
    view_display: "\u0412\u0438\u0434",
    panel_layout: "\u041C\u0430\u043A\u0435\u0442",
    panel_show_done: "\u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043D\u044B\u0435",
    no_label: "\u0411\u0435\u0437 \u043C\u0435\u0442\u043A\u0438",
    more_actions: "\u0415\u0449\u0451"
  },
  ja: {
    view_today: "\u4ECA\u65E5",
    view_upcoming: "\u8FD1\u65E5\u4E88\u5B9A",
    view_recurring: "\u7E70\u308A\u8FD4\u3057",
    view_done: "\u5B8C\u4E86",
    status_todo: "\u672A\u7740\u624B",
    status_doing: "\u9032\u884C\u4E2D",
    status_done: "\u5B8C\u4E86",
    status_cancelled: "\u30AD\u30E3\u30F3\u30BB\u30EB\u6E08\u307F",
    layout_list: "\u30EA\u30B9\u30C8",
    layout_board: "\u30DC\u30FC\u30C9",
    menu_cancel_task: "\u30BF\u30B9\u30AF\u3092\u30AD\u30E3\u30F3\u30BB\u30EB",
    layout_calendar: "\u30AB\u30EC\u30F3\u30C0\u30FC",
    cal_prev: "\u524D\u3078",
    cal_next: "\u6B21\u3078",
    cal_today: "\u4ECA\u65E5",
    cal_unscheduled: "\u65E5\u4ED8\u306A\u3057",
    cal_unscheduled_empty: "\u65E5\u4ED8\u306A\u3057\u306E\u30BF\u30B9\u30AF\u306F\u3042\u308A\u307E\u305B\u3093",
    cal_mode_year: "\u5E74",
    cal_tasks: "{0} \u4EF6\u306E\u30BF\u30B9\u30AF",
    cal_mode_month: "\u6708",
    cal_mode_week: "\u9031",
    cal_mode_day: "\u65E5",
    cal_more: "\u4ED6 {0} \u4EF6",
    cal_allday: "\u7D42\u65E5",
    tab_statuses: "\u30B9\u30C6\u30FC\u30BF\u30B9",
    status_add: "\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u8FFD\u52A0",
    placeholder_status_name: "\u30B9\u30C6\u30FC\u30BF\u30B9\u540D",
    status_reset_default: "\u30C7\u30D5\u30A9\u30EB\u30C8\u306B\u623B\u3059",
    confirm_reset_statuses_q: "\u3059\u3079\u3066\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u30C7\u30D5\u30A9\u30EB\u30C8\u306B\u623B\u3057\u307E\u3059\u304B\uFF1F",
    status_hint: "\u3053\u308C\u3089\u306F\u30AB\u30F3\u30D0\u30F3\u30DC\u30FC\u30C9\u306E\u5217\u3067\u3059 \u2014 \u4E26\u3073\u9806 = \u5217\u306E\u9806\u5E8F\u3002",
    status_kind_open: "\u672A\u5B8C\u4E86",
    status_kind_done: "\u5B8C\u4E86",
    status_kind_cancelled: "\u30AD\u30E3\u30F3\u30BB\u30EB\u6E08\u307F",
    role_new_tasks: "\u65B0\u898F\u30BF\u30B9\u30AF",
    role_on_complete: "\u5B8C\u4E86\u6642",
    role_trash: "\u30B4\u30DF\u7BB1",
    status_pick_icon: "\u30A2\u30A4\u30B3\u30F3",
    status_pick_color: "\u8272",
    status_color_none: "\u8272\u306A\u3057",
    color_custom: "\u30AB\u30B9\u30BF\u30E0\u30AB\u30E9\u30FC",
    btn_move_up: "\u4E0A\u3078",
    btn_move_down: "\u4E0B\u3078",
    status_need_done: "\u300C\u5B8C\u4E86\u300D\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u5C11\u306A\u304F\u3068\u30821\u3064\u6B8B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    status_need_open: "\u672A\u5B8C\u4E86\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u5C11\u306A\u304F\u3068\u30821\u3064\u6B8B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    status_need_kind: "\u5404\u30AB\u30C6\u30B4\u30EA\u30FC\u306B\u5C11\u306A\u304F\u3068\u30821\u3064\u306E\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u6B8B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    status_only_one_trash: "\u30B4\u30DF\u7BB1\u30B9\u30C6\u30FC\u30BF\u30B9\u306F1\u3064\u3060\u3051\u3067\u3059\u3002",
    status_reassigned: "{0} \u4EF6\u306E\u30BF\u30B9\u30AF\u3092 {1} \u306B\u79FB\u52D5\u3057\u307E\u3057\u305F\u3002",
    sort_by: "\u4E26\u3079\u66FF\u3048",
    sort_manual: "\u624B\u52D5",
    sort_name: "\u540D\u524D",
    sort_count: "\u4EF6\u6570",
    whatsnew_title: "\u65B0\u6A5F\u80FD",
    whatsnew_ok: "OK",
    wn_cal_t: "\u30AB\u30EC\u30F3\u30C0\u30FC\u8868\u793A",
    wn_cal_d: "\u5E74\u30FB\u6708\u30FB\u9031\u30FB\u65E5 \u2014 \u30C9\u30E9\u30C3\u30B0\u3067\u4E88\u5B9A\u3092\u5909\u66F4\u3067\u304D\u307E\u3059\u3002",
    wn_unsched_t: "\u300C\u65E5\u4ED8\u306A\u3057\u300D\u30B5\u30A4\u30C9\u30D0\u30FC",
    wn_unsched_d: "\u65E5\u4ED8\u306E\u306A\u3044\u30BF\u30B9\u30AF\u3092\u30B0\u30EA\u30C3\u30C9\u3078\u30C9\u30E9\u30C3\u30B0\u3002",
    wn_dir_t: "\u4E26\u3073\u9806\u306E\u65B9\u5411",
    wn_dir_d: "\u3059\u3079\u3066\u306E\u57FA\u6E96\u3067\u6607\u9806\u30FB\u964D\u9806\u3092\u9078\u3079\u307E\u3059\u3002",
    wn_excl_t: "\u30D5\u30A3\u30EB\u30BF\u30FC\u3067\u542B\u3081\u308B\uFF0F\u9664\u5916\u3059\u308B",
    wn_excl_d: "\u5404\u5024\u3092 \u2713 \u542B\u3081\u308B\u30FB\u2212 \u9664\u5916\u3068\u3057\u3066\u6307\u5B9A \u2014 \u540C\u3058\u9805\u76EE\u5185\u3067\u6DF7\u5728\u53EF\u80FD\u3002\u30E9\u30D9\u30EB\u30FB\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30FB\u512A\u5148\u5EA6\u306B\u5BFE\u5FDC\u3002",
    wn_fmode_t: "\u30E2\u30FC\u30C9\uFF1A\u3044\u305A\u308C\u304B\u30FB\u3059\u3079\u3066\u30FB\u306A\u3057",
    wn_fmode_d: "\u9805\u76EE\u3054\u3068\u306B\u3001\u5C11\u306A\u304F\u3068\u30821\u3064\uFF08OR\uFF09\u3001\u3059\u3079\u3066\uFF08AND\uFF09\u3001\u306A\u3057\uFF08NOT\uFF09\u3092\u9078\u629E\u3002",
    wn_anytime_t: "\u4F8B\uFF1A\u300C\u3044\u3064\u3067\u3082\u300D\u30D5\u30A3\u30EB\u30BF\u30FC",
    wn_anytime_d: "\u65E5\u4ED8\u306A\u3057\u30FB\u7279\u5B9A\u306E\u30E9\u30D9\u30EB\u306A\u3057 \u2014 1\u3064\u306E\u30D5\u30A3\u30EB\u30BF\u30FC\u3067\u5B9F\u73FE\u3002",
    wn_chips_t: "\u5165\u529B\u30C1\u30C3\u30D7\u3092\u30AB\u30B9\u30BF\u30DE\u30A4\u30BA",
    wn_chips_d: "\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0\u3068\u30D5\u30EB\u30A8\u30C7\u30A3\u30BF\u30FC\u306E\u30C1\u30C3\u30D7\u3092\u500B\u5225\u306B\u8868\u793A\u30FB\u975E\u8868\u793A\u30FB\u4E26\u3079\u66FF\u3048\u3002\u6B8B\u308A\u306F + \u30E1\u30CB\u30E5\u30FC\u306B\u3002",
    wn_status_t: "\u5805\u7262\u306A\u30B9\u30C6\u30FC\u30BF\u30B9",
    wn_status_d: "\u30B9\u30C6\u30FC\u30BF\u30B9\u306B\u4FDD\u8A3C\u3055\u308C\u305F\u30AB\u30C6\u30B4\u30EA\u30FC\uFF08\u672A\u5B8C\u4E86\u30FB\u5B8C\u4E86\u30FB\u30B4\u30DF\u7BB1\uFF09\u3001\u30AB\u30C6\u30B4\u30EA\u30FC\u5225\u306B\u5206\u985E\u3055\u308C\u305F\u30A8\u30C7\u30A3\u30BF\u30FC\u3001\u5E38\u306B\u6A5F\u80FD\u3059\u308B\u30B4\u30DF\u7BB1\u304C\u52A0\u308F\u308A\u307E\u3057\u305F\u3002",
    wn_quickadd_t: "\u5B8C\u5168\u306A\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0",
    wn_quickadd_d: "\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0\u306F\u3059\u3079\u3066\u306E\u9805\u76EE\u3092\u4FDD\u6301\u3057\u3001\u6700\u5927\u5316\u30DC\u30BF\u30F3\u3067\u3059\u3079\u3066\u3092\u30D5\u30EB\u30A8\u30C7\u30A3\u30BF\u30FC\u3078\u5F15\u304D\u7D99\u304E\u307E\u3059\u3002",
    wn_reset_t: "\u9069\u5207\u306A\u30C7\u30D5\u30A9\u30EB\u30C8",
    wn_reset_d: "\u65B0\u3057\u3044\u30C7\u30D5\u30A9\u30EB\u30C8\u30EC\u30A4\u30A2\u30A6\u30C8\u3068\u3001\u30C1\u30C3\u30D7\u914D\u7F6E\u3068\u30B9\u30C6\u30FC\u30BF\u30B9\u3092\u30EA\u30BB\u30C3\u30C8\u3059\u308B\u30DC\u30BF\u30F3\u3002",
    wn_gcal_t: "Google \u30AB\u30EC\u30F3\u30C0\u30FC\u540C\u671F",
    wn_gcal_d: "\u671F\u65E5\u306E\u3042\u308B\u30BF\u30B9\u30AF\u3092\u53CD\u6620 \u2014 \u65E5\u4ED8\u3068\u6642\u523B\u304C\u53CC\u65B9\u5411\u3067\u540C\u671F\u3057\u307E\u3059\u3002",
    wn_gcalcal_t: "\u81EA\u5206\u306E\u30A2\u30AB\u30A6\u30F3\u30C8\u3001\u81EA\u5206\u306E\u30AB\u30EC\u30F3\u30C0\u30FC",
    wn_gcalcal_d: "\u81EA\u5206\u306E Google \u8A8D\u8A3C\u60C5\u5831\u3067\u63A5\u7D9A\u3002\u4E88\u5B9A\u306F\u5C02\u7528\u306E BeautyTasks \u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u5165\u308A\u307E\u3059\u3002",
    wn_gcallist_t: "\u30EA\u30B9\u30C8\u3054\u3068\u306E\u5236\u5FA1",
    wn_gcallist_d: "\u4EFB\u610F\u306E\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30FB\u30A8\u30EA\u30A2\u30FB\u53D7\u4FE1\u30C8\u30EC\u30A4\u306E\u540C\u671F\u3092\u30AA\u30F3/\u30AA\u30D5\u3067\u304D\u307E\u3059\u3002",
    wn_gcalstat_t: "\u30B9\u30C6\u30FC\u30BF\u30B9\u3068\u7AF6\u5408",
    wn_gcalstat_d: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306E\u8868\u793A\u3067\u540C\u671F\u72B6\u614B\u304C\u308F\u304B\u308A\u307E\u3059\u3002\u7AF6\u5408\u6642\u306F Obsidian \u304C\u512A\u5148\u3055\u308C\u307E\u3059\u3002",
    wn_board_t: "\u30B0\u30EB\u30FC\u30D7\u5316\u306B\u5FDC\u3058\u305F\u30DC\u30FC\u30C9",
    wn_board_d: "\u30AB\u30F3\u30D0\u30F3\u30DC\u30FC\u30C9\u304C\u30B0\u30EB\u30FC\u30D7\u5316\u306B\u5F93\u3046\u3088\u3046\u306B\u306A\u308A\u307E\u3057\u305F\uFF1A\u30B9\u30C6\u30FC\u30BF\u30B9\u30FB\u30E9\u30D9\u30EB\u30FB\u512A\u5148\u5EA6\u30FB\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3054\u3068\u306E\u5217\u3067\u3001\u30AB\u30FC\u30C9\u3092\u5217\u9593\u3067\u30C9\u30E9\u30C3\u30B0\u3067\u304D\u307E\u3059\u3002",
    wn_langs_t: "8 \u3064\u306E\u65B0\u3057\u3044\u8A00\u8A9E",
    wn_langs_d: "\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9\u304C\u30B9\u30DA\u30A4\u30F3\u8A9E\u30FB\u30DD\u30EB\u30C8\u30AC\u30EB\u8A9E\u30FB\u30D5\u30E9\u30F3\u30B9\u8A9E\u30FB\u30C8\u30EB\u30B3\u8A9E\u30FB\u4E2D\u56FD\u8A9E\u30FB\u30ED\u30B7\u30A2\u8A9E\u30FB\u65E5\u672C\u8A9E\u30FB\u30A4\u30BF\u30EA\u30A2\u8A9E\u306B\u3082\u5BFE\u5FDC\u3057\u307E\u3057\u305F\u3002",
    wn_project_t: "@ \u3067\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u6307\u5B9A",
    wn_project_d: "\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0\u3067 @\u540D\u524D \u3068\u5165\u529B\u3059\u308B\u3068\u3001\u65E2\u5B58\u306E\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3084\u30A8\u30EA\u30A2\u306B\u30BF\u30B9\u30AF\u3092\u5272\u308A\u5F53\u3066\u3089\u308C\u307E\u3059\u3002",
    wn_hidden_t: "\u975E\u8868\u793A\u306E\u9805\u76EE\u3092\u8868\u793A",
    wn_hidden_d: "\u30BB\u30AF\u30B7\u30E7\u30F3\u898B\u51FA\u3057\u3092\u53F3\u30AF\u30EA\u30C3\u30AF\u3059\u308B\u3068\u3001\u975E\u8868\u793A\u306E\u9805\u76EE\u3092\u30EF\u30F3\u30AF\u30EA\u30C3\u30AF\u3067\u623B\u305B\u307E\u3059\u3002",
    wn_ui_t: "UI \u306E\u6539\u5584",
    wn_ui_d: "\u3059\u3063\u304D\u308A\uFF06\u67D4\u8EDF\u306B\uFF1A\u300C\u4ECA\u65E5\u300D\u3067\u4E26\u3079\u66FF\u3048\u3068\u30B0\u30EB\u30FC\u30D7\u5316\u3001\u300C\u8FD1\u65E5\u4E88\u5B9A\u300D\u306F\u65E5\u4ED8\u9806\u306E\u30A2\u30B8\u30A7\u30F3\u30C0\u3001\u5404\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30FB\u30E9\u30D9\u30EB\u30FB\u30D5\u30A3\u30EB\u30BF\u30FC\u306E\u30DA\u30FC\u30B8\u306B\u30E1\u30CB\u30E5\u30FC\u3002",
    nav_inbox: "\u30A4\u30F3\u30DC\u30C3\u30AF\u30B9",
    group_area: "\u30A8\u30EA\u30A2",
    group_project: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8",
    sec_overdue: "\u671F\u9650\u5207\u308C",
    sec_today: "\u4ECA\u65E5",
    sec_upcoming: "\u8FD1\u65E5\u4E88\u5B9A",
    sec_no_date: "\u65E5\u4ED8\u306A\u3057",
    sec_done: "\u5B8C\u4E86",
    count_task: "{0} \u4EF6\u306E\u30BF\u30B9\u30AF",
    count_tasks: "{0} \u4EF6\u306E\u30BF\u30B9\u30AF",
    empty_nothing_scheduled: "\u4E88\u5B9A\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_nothing_recurring: "\u7E70\u308A\u8FD4\u3057\u30BF\u30B9\u30AF\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_nothing_done: "\u307E\u3060\u5B8C\u4E86\u3057\u305F\u3082\u306E\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_nothing_today: "\u4ECA\u65E5\u306E\u4E88\u5B9A\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_no_project_tasks: "\u3053\u306E\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306B\u306F\u307E\u3060\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_no_area_tasks: "\u3053\u306E\u30A8\u30EA\u30A2\u306B\u306F\u307E\u3060\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_no_inbox_tasks: "\u30A4\u30F3\u30DC\u30C3\u30AF\u30B9\u306B\u306F\u307E\u3060\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_no_label_tasks: "\u3053\u306E\u30E9\u30D9\u30EB\u306E\u30BF\u30B9\u30AF\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
    empty_no_tasks: "\u307E\u3060\u30BF\u30B9\u30AF\u304C\u3042\u308A\u307E\u305B\u3093\u3002",
    btn_add_task: "\u30BF\u30B9\u30AF\u3092\u8FFD\u52A0",
    btn_cancel: "\u30AD\u30E3\u30F3\u30BB\u30EB",
    btn_save: "\u4FDD\u5B58",
    btn_delete: "\u524A\u9664",
    details: "\u8A73\u7D30",
    subtask: "\u30B5\u30D6\u30BF\u30B9\u30AF",
    placeholder_subtask: "\u30B5\u30D6\u30BF\u30B9\u30AF",
    log_placeholder: "\u30B3\u30E1\u30F3\u30C8\u3092\u8FFD\u52A0 \u2026",
    log_attach: "\u30D5\u30A1\u30A4\u30EB\u3092\u6DFB\u4ED8",
    log_link: "\u30CE\u30FC\u30C8\u3092\u30EA\u30F3\u30AF",
    log_add: "\u8FFD\u52A0",
    log_edit: "\u7DE8\u96C6",
    log_update: "\u66F4\u65B0",
    log_link_placeholder: "\u30CE\u30FC\u30C8\u3092\u30EA\u30F3\u30AF \u2026",
    btn_close: "\u9589\u3058\u308B",
    lb_prev: "\u524D\u306E\u753B\u50CF",
    lb_next: "\u6B21\u306E\u753B\u50CF",
    lb_copy: "\u753B\u50CF\u3092\u30B3\u30D4\u30FC",
    msg_image_copied: "\u753B\u50CF\u3092\u30AF\u30EA\u30C3\u30D7\u30DC\u30FC\u30C9\u306B\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F\u3002",
    msg_image_copy_failed: "\u753B\u50CF\u3092\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    msg_attached: "{0} \u3092\u6DFB\u4ED8\u3057\u307E\u3057\u305F",
    msg_attach_failed: "\u6DFB\u4ED8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF1A{0}",
    err_detail_save: "\u8A73\u7D30\u3092\u4FDD\u5B58\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    placeholder_taskname: "\u30BF\u30B9\u30AF\u540D",
    placeholder_description: "\u8AAC\u660E \u2026",
    placeholder_date_input: "\u65E5\u4ED8\u3092\u5165\u529B \u2026",
    placeholder_label: "\u30E9\u30D9\u30EB",
    placeholder_project_name: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u540D \u2026",
    placeholder_area_name: "\u30A8\u30EA\u30A2\u540D \u2026",
    chip_date: "\u65E5\u4ED8",
    chip_priority: "\u512A\u5148\u5EA6",
    chip_label: "\u30E9\u30D9\u30EB",
    chip_recurrence: "\u7E70\u308A\u8FD4\u3057",
    chip_deadline: "\u7DE0\u3081\u5207\u308A",
    chip_parent: "\u89AA\u30BF\u30B9\u30AF",
    pick_parent: "\u30BF\u30B9\u30AF\u306E\u4E0B\u306B\u79FB\u52D5 \u2026",
    prio_1: "\u512A\u5148\u5EA6 1",
    prio_2: "\u512A\u5148\u5EA6 2",
    prio_3: "\u512A\u5148\u5EA6 3",
    prio_4: "\u512A\u5148\u5EA6 4",
    recur_none: "\u306A\u3057",
    recur_daily: "\u6BCE\u65E5",
    recur_weekly: "\u6BCE\u9031",
    recur_monthly: "\u6BCE\u6708",
    recur_quarterly: "\u56DB\u534A\u671F\u3054\u3068",
    recur_yearly: "\u6BCE\u5E74",
    recur_basis: "\u6B21\u56DE\u65E5\u4ED8\u306E\u57FA\u6E96",
    recur_when_done: "\u5B8C\u4E86\u6642",
    pick_new_project: "\u65B0\u3057\u3044\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8",
    pick_new_area: "\u65B0\u3057\u3044\u30A8\u30EA\u30A2",
    no_project: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306A\u3057",
    make_area: "\u30A8\u30EA\u30A2",
    make_area_hint: "\u30A8\u30EA\u30A2\u306F\u6C38\u7D9A\u7684\u3067\u3001\u524A\u9664\u3084\u30A2\u30FC\u30AB\u30A4\u30D6\u306F\u3067\u304D\u307E\u305B\u3093\u3002",
    manage: "\u7BA1\u7406",
    manage_full: "\u30EA\u30B9\u30C8\u30DE\u30CD\u30FC\u30B8\u30E3\u30FC",
    tab_active: "\u30A2\u30AF\u30C6\u30A3\u30D6",
    tab_archive: "\u30A2\u30FC\u30AB\u30A4\u30D6",
    tab_labels: "\u30E9\u30D9\u30EB",
    add_label: "\u65B0\u3057\u3044\u30E9\u30D9\u30EB",
    manage_empty_labels: "\u4F7F\u7528\u4E2D\u306E\u30E9\u30D9\u30EB\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
    tip_show_sidebar: "\u30B5\u30A4\u30C9\u30D0\u30FC\u306B\u8868\u793A",
    tip_hide_sidebar: "\u30B5\u30A4\u30C9\u30D0\u30FC\u304B\u3089\u975E\u8868\u793A",
    tip_mark_area: "\u30A8\u30EA\u30A2\u306B\u5909\u63DB",
    tip_unmark_area: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306B\u5909\u63DB",
    btn_rename: "\u540D\u524D\u3092\u5909\u66F4",
    btn_archive: "\u30A2\u30FC\u30AB\u30A4\u30D6",
    btn_restore: "\u5FA9\u5143",
    btn_delete_forever: "\u5B8C\u5168\u306B\u524A\u9664",
    confirm_delete_q: "\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
    confirm_delete_forever_q: "\u5B8C\u5168\u306B\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
    menu_edit: "\u7DE8\u96C6 \u2026",
    menu_reorder: "\u9806\u5E8F\u3092\u5909\u66F4 \u2026",
    menu_reveal_hidden: "\u975E\u8868\u793A\u3092\u8868\u793A",
    menu_goto_projects: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u4E00\u89A7\u3078",
    menu_goto_areas: "\u30A8\u30EA\u30A2\u4E00\u89A7\u3078",
    menu_goto_labels: "\u30E9\u30D9\u30EB\u4E00\u89A7\u3078",
    menu_goto_filters: "\u30D5\u30A3\u30EB\u30BF\u30FC\u4E00\u89A7\u3078",
    reorder_active: "\u4E26\u3079\u66FF\u3048\u4E2D",
    reorder_done: "\u5B8C\u4E86",
    archive_undo: "\u5143\u306B\u623B\u3059",
    archived_notice: "\u300C{0}\u300D\u3092\u30A2\u30FC\u30AB\u30A4\u30D6\u3057\u307E\u3057\u305F\u3002",
    confirm_delete_title: "\u300C{0}\u300D\u3092\u524A\u9664\u3057\u307E\u3059\u304B\uFF1F",
    confirm_delete_body: "\u3053\u306E\u64CD\u4F5C\u306F\u53D6\u308A\u6D88\u305B\u307E\u305B\u3093\u3002",
    manage_empty_active: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3082\u30A8\u30EA\u30A2\u3082\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
    manage_empty_archive: "\u30A2\u30FC\u30AB\u30A4\u30D6\u306F\u7A7A\u3067\u3059\u3002",
    manage_empty_projects: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
    manage_empty_areas: "\u30A8\u30EA\u30A2\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
    manage_no_active_hint: "\u30BF\u30B9\u30AF\u30C0\u30A4\u30A2\u30ED\u30B0\u304B\u3089\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u4F5C\u6210\u3057\u3001\u5FC5\u8981\u306B\u5FDC\u3058\u3066\u3053\u3053\u3067\u30A8\u30EA\u30A2\u306B\u5909\u63DB\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    date_today: "\u4ECA\u65E5",
    date_yesterday: "\u6628\u65E5",
    date_tomorrow: "\u660E\u65E5",
    date_this_weekend: "\u4ECA\u9031\u672B",
    date_next_week: "\u6765\u9031",
    date_no_date: "\u65E5\u4ED8\u306A\u3057",
    time_add: "\u6642\u523B",
    time_label: "\u6642\u523B",
    duration_label: "\u6240\u8981\u6642\u9593",
    err_enter_taskname: "\u30BF\u30B9\u30AF\u540D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    err_parent_not_found: "\u89AA\u30BF\u30B9\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002",
    cmd_new_task: "\u65B0\u3057\u3044\u30BF\u30B9\u30AF",
    cmd_quick_add: "\u30BF\u30B9\u30AF\u3092\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0",
    cmd_open_view: "{0} \u3092\u958B\u304F",
    cmd_count_tasks: "\u30BF\u30B9\u30AF\u3092\u6570\u3048\u308B",
    cmd_import: "Tasks/Lists \u304B\u3089\u30A4\u30F3\u30DD\u30FC\u30C8",
    cmd_search: "\u30BF\u30B9\u30AF\u3092\u691C\u7D22",
    cmd_whatsnew: "\u65B0\u6A5F\u80FD\u3092\u8868\u793A",
    cmd_gcal_sync_now: "\u4ECA\u3059\u3050 Google \u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u540C\u671F",
    cmd_export_json: "\u30BF\u30B9\u30AF\u3092\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\uFF08JSON\uFF09",
    cmd_import_json: "\u30BF\u30B9\u30AF\u3092\u30A4\u30F3\u30DD\u30FC\u30C8\uFF08JSON\uFF09",
    cmd_import_tasknotes: "TaskNotes \u304B\u3089\u30A4\u30F3\u30DD\u30FC\u30C8",
    set_import_tn: "TaskNotes \u304B\u3089\u30A4\u30F3\u30DD\u30FC\u30C8",
    set_import_tn_desc: "TaskNotes \u30D7\u30E9\u30B0\u30A4\u30F3\u304B\u3089\u30BF\u30B9\u30AF\u3092\u79FB\u884C\u3057\u307E\u3059\uFF08Markdown \u30CE\u30FC\u30C8\u3068\u3057\u3066\u4FDD\u6301\uFF09\u3002",
    set_import_tn_btn: "TaskNotes \u304B\u3089\u30A4\u30F3\u30DD\u30FC\u30C8",
    set_gcal_heading: "Google \u30AB\u30EC\u30F3\u30C0\u30FC",
    gcal_not_connected: "\u672A\u63A5\u7D9A",
    gcal_setup_desc: "\u671F\u65E5\u306E\u3042\u308B\u30BF\u30B9\u30AF\u3092 Google \u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u540C\u671F\u3057\u307E\u3059\u3002\u81EA\u5206\u306E Google API \u8A8D\u8A3C\u60C5\u5831\u3092\u4F7F\u7528\u3057\u307E\u3059\uFF08\u521D\u56DE\u306E\u307F\u3001\u7D045\u5206\uFF09\u3002\u300C\u30C7\u30B9\u30AF\u30C8\u30C3\u30D7\u30A2\u30D7\u30EA\u300D\u30BF\u30A4\u30D7\u306E OAuth \u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u3092\u4F5C\u6210\u3057\u3001\u305D\u306E ID \u3068\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8\u3092\u4E0B\u306B\u8CBC\u308A\u4ED8\u3051\u3066\u304F\u3060\u3055\u3044\u3002",
    gcal_help_btn: "\u30BB\u30C3\u30C8\u30A2\u30C3\u30D7\u30AC\u30A4\u30C9\u3092\u958B\u304F",
    gcal_setup_hint: "\u521D\u3081\u3066\u3067\u3059\u304B\uFF1F\u30AC\u30A4\u30C9\u304C Google \u8A8D\u8A3C\u60C5\u5831\u306E\u4F5C\u6210\u624B\u9806\u3092\u6848\u5185\u3057\u307E\u3059\u3002",
    gcal_client_id: "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8 ID",
    gcal_client_secret: "\u30AF\u30E9\u30A4\u30A2\u30F3\u30C8\u30B7\u30FC\u30AF\u30EC\u30C3\u30C8",
    gcal_connect_btn: "\u63A5\u7D9A",
    gcal_connecting: "\u63A5\u7D9A\u4E2D\u2026",
    gcal_connect_failed: "\u63A5\u7D9A\u306B\u5931\u6557\u3057\u307E\u3057\u305F: {0}",
    gcal_connected_as: "{0} \u3068\u3057\u3066\u63A5\u7D9A\u6E08\u307F",
    gcal_disconnect_btn: "\u63A5\u7D9A\u3092\u89E3\u9664",
    gcal_last_synced: "\u6700\u7D42\u540C\u671F: {0}",
    gcal_never: "\u306A\u3057",
    gcal_syncing: "\u540C\u671F\u4E2D\u2026",
    gcal_sync_error: "\u30A8\u30E9\u30FC: {0}",
    gcal_sync_now_btn: "\u4ECA\u3059\u3050\u540C\u671F",
    gcal_target_calendar: "\u5BFE\u8C61\u30AB\u30EC\u30F3\u30C0\u30FC",
    gcal_target_calendar_desc: "\u671F\u65E5\u306E\u3042\u308B\u30BF\u30B9\u30AF\u3092\u3069\u306E\u30AB\u30EC\u30F3\u30C0\u30FC\u306B\u53CD\u6620\u3059\u308B\u304B\u3002",
    gcal_create_calendar_btn: "BeautyTasks \u30AB\u30EC\u30F3\u30C0\u30FC\u3092\u4F5C\u6210",
    gcal_create_calendar_desc: "\u5C02\u7528\u306E\u300CBeautyTasks\u300D\u30AB\u30EC\u30F3\u30C0\u30FC\u3092\u4F5C\u6210\u3057\u3066\u4F7F\u7528\u3057\u307E\u3059\uFF08\u65E2\u5B58\u306E\u4E88\u5B9A\u306F\u6B21\u56DE\u306E\u540C\u671F\u3067\u79FB\u52D5\u3057\u307E\u3059\uFF09\u3002",
    gcal_sync_list: "Google \u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u540C\u671F",
    gcal_tip_create: "\u30D2\u30F3\u30C8: \u5C02\u7528\u30AB\u30EC\u30F3\u30C0\u30FC\u3092\u4F7F\u3046",
    gcal_tip_create_desc: "\u81EA\u5206\u306E Google \u30AB\u30EC\u30F3\u30C0\u30FC\u3092\u4F5C\u6210\u3057\u3066\u30BF\u30B9\u30AF\u3092\u305D\u3053\u306B\u79FB\u884C\u3057\u307E\u3059\uFF08\u30E1\u30A4\u30F3\u30AB\u30EC\u30F3\u30C0\u30FC\u3068\u3059\u3063\u304D\u308A\u5206\u96E2\uFF09\u3002",
    gcal_create_calendar_failed: "\u30AB\u30EC\u30F3\u30C0\u30FC\u3092\u4F5C\u6210\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F: {0} \u2014 \u63A5\u7D9A\u3092\u89E3\u9664\u3057\u3066\u518D\u63A5\u7D9A\u304C\u5FC5\u8981\u306A\u5834\u5408\u304C\u3042\u308A\u307E\u3059\uFF08\u65B0\u3057\u3044\u6A29\u9650\uFF09\u3002",
    gcal_no_calendar_warn: "\u5BFE\u8C61\u30AB\u30EC\u30F3\u30C0\u30FC\u304C\u307E\u3060\u9078\u629E\u3055\u308C\u3066\u3044\u307E\u305B\u3093 \u2014 \u4E0B\u3067\u9078\u3076\u304B\u3001BeautyTasks \u30AB\u30EC\u30F3\u30C0\u30FC\u3092\u4F5C\u6210\u3057\u3066\u304F\u3060\u3055\u3044\u3002\u305D\u308C\u307E\u3067\u4F55\u3082\u540C\u671F\u3055\u308C\u307E\u305B\u3093\u3002",
    gcal_enabled: "\u671F\u65E5\u306E\u3042\u308B\u30BF\u30B9\u30AF\u3092\u540C\u671F",
    gcal_enabled_desc: "\u671F\u65E5\u306E\u3042\u308B\u30BF\u30B9\u30AF\u3092\u3059\u3079\u3066\u4E88\u5B9A\u3068\u3057\u3066\u53CD\u6620\u3057\u307E\u3059\u3002",
    gcal_autosync: "\u81EA\u52D5\u7684\u306B\u540C\u671F",
    gcal_autosync_desc: "\u30BF\u30B9\u30AF\u3092\u7DE8\u96C6\u3059\u308B\u305F\u3073\u306B\u5909\u66F4\u3092\u9001\u4FE1\u3057\u307E\u3059\uFF08\u305D\u3046\u3067\u306A\u3051\u308C\u3070\u540C\u671F\u306F\u30B3\u30DE\u30F3\u30C9\u6642\u306E\u307F\u5B9F\u884C\uFF09\u3002",
    gcal_advanced: "\u8A73\u7D30",
    gcal_on_create: "\u65B0\u3057\u3044\u30BF\u30B9\u30AF\u3092\u8FFD\u52A0",
    gcal_on_update: "\u5909\u66F4\u3092\u65E2\u5B58\u306E\u4E88\u5B9A\u306B\u9001\u4FE1",
    gcal_on_delete: "\u30BF\u30B9\u30AF\u304C\u524A\u9664\u307E\u305F\u306F\u671F\u65E5\u306A\u3057\u306B\u306A\u3063\u305F\u3089\u4E88\u5B9A\u3092\u524A\u9664",
    gcal_remove_on_complete: "\u30BF\u30B9\u30AF\u304C\u5B8C\u4E86\u3057\u305F\u3089\u4E88\u5B9A\u3092\u524A\u9664",
    gcal_duration: "\u4E88\u5B9A\u306E\u65E2\u5B9A\u306E\u9577\u3055\uFF08\u5206\uFF09",
    gcal_timezone: "\u30BF\u30A4\u30E0\u30BE\u30FC\u30F3",
    gcal_statusbar: "\u30B9\u30C6\u30FC\u30BF\u30B9\u30D0\u30FC\u306B\u540C\u671F\u72B6\u6CC1\u3092\u8868\u793A",
    gcal_notify_conflicts: "\u7AF6\u5408\u6642\u306B\u901A\u77E5",
    gcal_device_prompt: "{0} \u3092\u958B\u3044\u3066\u30B3\u30FC\u30C9\u3092\u5165\u529B: {1}",
    gcal_reconnect_hint: "\u8A2D\u5B9A\u3067\u518D\u63A5\u7D9A\u3057\u3066\u304F\u3060\u3055\u3044",
    gcal_conflicts_notice: "{0} \u4EF6\u306E\u7AF6\u5408\u3092\u89E3\u6C7A\u3057\u307E\u3057\u305F \u2014 Obsidian \u306E\u5024\u3092\u4FDD\u6301",
    menu_gcal_exclude: "\u30AB\u30EC\u30F3\u30C0\u30FC\u540C\u671F\u304B\u3089\u9664\u5916",
    menu_gcal_include: "\u30AB\u30EC\u30F3\u30C0\u30FC\u540C\u671F\u306B\u8FFD\u52A0",
    tn_import_title: "TaskNotes \u304B\u3089\u30A4\u30F3\u30DD\u30FC\u30C8",
    tn_import_desc: "TaskNotes \u306E\u30BF\u30B9\u30AF\u304B\u3089\u65B0\u3057\u3044 BeautyTasks \u30CE\u30FC\u30C8\u3092\u4F5C\u6210\u3057\u307E\u3059\u3002TaskNotes \u306E\u30D5\u30A1\u30A4\u30EB\u306F\u305D\u306E\u307E\u307E\u6B8B\u308A\u307E\u3059\u3002",
    tn_import_tag: "\u30BF\u30B9\u30AF\u30BF\u30B0",
    tn_import_tag_desc: "\u30CE\u30FC\u30C8\u3092 TaskNotes \u30BF\u30B9\u30AF\u3068\u3057\u3066\u793A\u3059 frontmatter \u30BF\u30B0\u3002",
    tn_import_folder: "\u30D5\u30A9\u30EB\u30C0\uFF08\u4EFB\u610F\uFF09",
    tn_import_folder_desc: "\u30D5\u30A9\u30EB\u30C0\u306B\u9650\u5B9A\u3057\u307E\u3059\u3002\u7A7A\u306E\u5834\u5408\u306F\u4FDD\u7BA1\u5EAB\u5168\u4F53\u3092\u30B9\u30AD\u30E3\u30F3\u3057\u307E\u3059\u3002",
    tn_import_folder_ph: "\u4F8B\uFF1A\u30BF\u30B9\u30AF",
    tn_import_found: "{0} \u4EF6\u306E\u30BF\u30B9\u30AF\u30CE\u30FC\u30C8\u304C\u898B\u3064\u304B\u308A\u307E\u3057\u305F\u3002",
    tn_import_none: "TaskNotes \u306E\u30BF\u30B9\u30AF\u304C\u898B\u3064\u304B\u308A\u307E\u305B\u3093\u3002",
    tn_import_btn: "\u30A4\u30F3\u30DD\u30FC\u30C8",
    tn_import_done: "{0} \u4EF6\u3092\u30A4\u30F3\u30DD\u30FC\u30C8\u3001{1} \u4EF6\u3092\u30B9\u30AD\u30C3\u30D7\u3057\u307E\u3057\u305F\u3002",
    tn_import_lossy: "\u8907\u96D1\u306A\u7E70\u308A\u8FD4\u3057\u306E {0} \u4EF6\u306F\u5143\u306E\u5185\u5BB9\u3092\u30CE\u30FC\u30C8\u3068\u3057\u3066\u4FDD\u6301\u3057\u307E\u3057\u305F\u3002",
    tn_import_failed: "\u30A4\u30F3\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\u3002",
    qa_placeholder: "\u4F8B\uFF1A\u660E\u65E5 \u30EC\u30DD\u30FC\u30C8\u4F5C\u6210 p1 #\u91CD\u8981 @\u4ED5\u4E8B",
    qa_added: "\u30BF\u30B9\u30AF\u3092\u8FFD\u52A0\u3057\u307E\u3057\u305F",
    qa_open_full: "\u30D5\u30EB\u30A8\u30C7\u30A3\u30BF\u30FC\u3067\u958B\u304F",
    nav_search: "\u691C\u7D22",
    search_placeholder: "\u30BF\u30B9\u30AF\u3092\u691C\u7D22 \u2026",
    search_exclude_archived: "\u30A2\u30FC\u30AB\u30A4\u30D6\u3092\u9664\u5916",
    notice_count: "BeautyTasks\uFF1A{0} \u4EF6\u306E\u30BF\u30B9\u30AF\uFF08{1} \u4EF6\u672A\u5B8C\u4E86\uFF09",
    notice_import_running: "BeautyTasks\uFF1A\u30A4\u30F3\u30DD\u30FC\u30C8\u4E2D \u2026",
    notice_imported: "BeautyTasks\uFF1A{0} \u4EF6\u306E\u30BF\u30B9\u30AF\u3092\u30A4\u30F3\u30DD\u30FC\u30C8\u3057\u307E\u3057\u305F\u3002",
    notice_import_failed: "BeautyTasks\uFF1A\u30A4\u30F3\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF08\u30B3\u30F3\u30BD\u30FC\u30EB\u3092\u53C2\u7167\uFF09\u3002",
    notice_export_done: "BeautyTasks\uFF1A{0} \u306B\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3057\u307E\u3057\u305F",
    notice_export_failed: "BeautyTasks\uFF1A\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u306B\u5931\u6557\u3057\u307E\u3057\u305F\uFF08\u30B3\u30F3\u30BD\u30FC\u30EB\u3092\u53C2\u7167\uFF09\u3002",
    notice_import_invalid: "BeautyTasks\uFF1A\u6709\u52B9\u306A\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u30D5\u30A1\u30A4\u30EB\u3067\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    notice_import_summary: "BeautyTasks\uFF1A{0} \u4EF6\u3092\u8FFD\u52A0\u3001{1} \u4EF6\u3092\u30B9\u30AD\u30C3\u30D7\u3057\u307E\u3057\u305F\u3002",
    import_pick_placeholder: "JSON \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u3092\u9078\u629E \u2026",
    set_data_heading: "\u30A4\u30F3\u30DD\u30FC\u30C8\u3068\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8",
    set_export: "\u30BF\u30B9\u30AF\u3092\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8",
    set_export_desc: "\u3059\u3079\u3066\u306E\u30BF\u30B9\u30AF\u3092\u4FDD\u7BA1\u5EAB\u5185\u306E JSON \u30D5\u30A1\u30A4\u30EB\u3068\u3057\u3066\u4FDD\u5B58\u3057\u307E\u3059\uFF08\u7121\u640D\u5931\uFF09\u3002",
    set_export_btn: "\u30A8\u30AF\u30B9\u30DD\u30FC\u30C8",
    set_import: "\u30BF\u30B9\u30AF\u3092\u30A4\u30F3\u30DD\u30FC\u30C8",
    set_import_desc: "JSON \u30A8\u30AF\u30B9\u30DD\u30FC\u30C8\u304B\u3089\u30BF\u30B9\u30AF\u3092\u8AAD\u307F\u8FBC\u307F\u307E\u3059\u3002\u65E2\u5B58\u306E\u30BF\u30B9\u30AF\u306F\u30B9\u30AD\u30C3\u30D7\u3055\u308C\u307E\u3059\uFF08id \u3067\u7167\u5408\uFF09\u3002",
    set_import_vault_btn: "\u4FDD\u7BA1\u5EAB\u304B\u3089 \u2026",
    set_import_os_btn: "\u30D5\u30A1\u30A4\u30EB\u304B\u3089 \u2026",
    ribbon_open: "BeautyTasks \u3092\u958B\u304F",
    set_show_desc: "\u30EA\u30B9\u30C8\u306B\u8AAC\u660E\u3092\u8868\u793A",
    set_show_desc_desc: "\u30BF\u30B9\u30AF\u30BF\u30A4\u30C8\u30EB\u306E\u4E0B\u306B\u8AAC\u660E\u306E1\u884C\u30D7\u30EC\u30D3\u30E5\u30FC\u3092\u8868\u793A\u3057\u307E\u3059\u3002",
    set_chips_iconsonly: "\u30B3\u30F3\u30D1\u30AF\u30C8\u30C1\u30C3\u30D7\uFF08\u30A2\u30A4\u30B3\u30F3\u306E\u307F\uFF09",
    set_chips_iconsonly_desc: "\u30BF\u30B9\u30AF\u30A8\u30C7\u30A3\u30BF\u30FC\u3067\u3001\u7A7A\u306E\u30AA\u30D7\u30B7\u30E7\u30F3\u30C1\u30C3\u30D7\uFF08\u65E5\u4ED8\u30FB\u512A\u5148\u5EA6\u30FB\u30E9\u30D9\u30EB \u2026\uFF09\u306F\u30A2\u30A4\u30B3\u30F3\u306E\u307F\u8868\u793A\u3057\u307E\u3059\u3002\u540D\u524D\u306F\u30C4\u30FC\u30EB\u30C1\u30C3\u30D7\u306B\u8868\u793A\u3055\u308C\u307E\u3059\u3002\u5024\u306E\u3042\u308B\u30C1\u30C3\u30D7\u306F\u5024\u3092\u8868\u793A\u3057\u7D9A\u3051\u307E\u3059\u3002",
    task_actions: "\u30BF\u30B9\u30AF\u306E\u64CD\u4F5C",
    chip_status: "\u30B9\u30C6\u30FC\u30BF\u30B9",
    more_chip_actions: "\u305D\u306E\u4ED6\u306E\u64CD\u4F5C",
    edit_task_actions: "\u30BF\u30B9\u30AF\u64CD\u4F5C\u3092\u7DE8\u96C6",
    set_chip_actions: "\u30BF\u30B9\u30AF\u64CD\u4F5C\uFF08\u5165\u529B\u30C1\u30C3\u30D7\uFF09",
    set_chip_actions_desc: "\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0\u3068\u30D5\u30EB\u30A8\u30C7\u30A3\u30BF\u30FC\u3092\u500B\u5225\u306B\u8A2D\u5B9A\u3067\u304D\u307E\u3059\u3002\u5404\u30C1\u30C3\u30D7\u3092\u30BB\u30AF\u30B7\u30E7\u30F3\u306B\u30C9\u30E9\u30C3\u30B0\u3057\u307E\u3059\u2014\u2014\u5E38\u306B\u8868\u793A\u3001\u5024\u304C\u3042\u308B\u3068\u304D\u8868\u793A\u3001\u307E\u305F\u306F + \u30E1\u30CB\u30E5\u30FC\u306E\u307F\u3002\u4E26\u3073\u9806\uFF1D\u30C1\u30C3\u30D7\u306E\u9806\u5E8F\u3002",
    chip_tier_shown: "\u5E38\u306B\u8868\u793A",
    chip_tier_onValue: "\u5024\u304C\u3042\u308B\u3068\u304D\u8868\u793A",
    chip_tier_hidden: "+ \u30E1\u30CB\u30E5\u30FC\u306E\u307F",
    chip_surface_editor: "\u30D5\u30EB\u30A8\u30C7\u30A3\u30BF\u30FC",
    chip_surface_quickadd: "\u30AF\u30A4\u30C3\u30AF\u8FFD\u52A0",
    chip_reset_default: "\u30C7\u30D5\u30A9\u30EB\u30C8\u306B\u623B\u3059",
    menu_create_subtask: "\u30B5\u30D6\u30BF\u30B9\u30AF\u3092\u4F5C\u6210",
    menu_show_parent: "\u89AA\u30BF\u30B9\u30AF\u3092\u8868\u793A",
    menu_duplicate: "\u30BF\u30B9\u30AF\u3092\u8907\u88FD",
    menu_copy_link: "\u30BF\u30B9\u30AF\u3078\u306E\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC",
    menu_open_obsidian: "Obsidian \u3067\u958B\u304F",
    menu_open_editor: "\u30A8\u30C7\u30A3\u30BF\u30FC\u3067\u958B\u304F",
    menu_print: "\u5370\u5237",
    copy_suffix: "\uFF08\u30B3\u30D4\u30FC\uFF09",
    msg_duplicated: "\u30BF\u30B9\u30AF\u3092\u8907\u88FD\u3057\u307E\u3057\u305F",
    msg_link_copied: "\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3057\u307E\u3057\u305F",
    msg_link_copy_failed: "\u30EA\u30F3\u30AF\u3092\u30B3\u30D4\u30FC\u3067\u304D\u307E\u305B\u3093\u3067\u3057\u305F\u3002",
    set_folders_heading: "\u30D5\u30A9\u30EB\u30C0",
    set_folder_items: "\u30BF\u30B9\u30AF\u30D5\u30A9\u30EB\u30C0",
    set_folder_items_desc: "\u65B0\u3057\u3044\u30BF\u30B9\u30AF\u30CE\u30FC\u30C8\u306E\u4F5C\u6210\u5148\u3002",
    set_folder_projects: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u30D5\u30A9\u30EB\u30C0",
    set_folder_projects_desc: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3068\u30A8\u30EA\u30A2\u306E\u30CE\u30FC\u30C8\u306E\u4F5C\u6210\u5148\u3002",
    set_folder_attachments: "\u6DFB\u4ED8\u30D5\u30A9\u30EB\u30C0",
    set_folder_attachments_desc: "\u8CBC\u308A\u4ED8\u3051\u307E\u305F\u306F\u6DFB\u4ED8\u3057\u305F\u30D5\u30A1\u30A4\u30EB\u306E\u4FDD\u5B58\u5148\u3002",
    set_behavior_heading: "\u52D5\u4F5C",
    set_language: "\u8A00\u8A9E",
    set_language_desc: "\u30A4\u30F3\u30BF\u30FC\u30D5\u30A7\u30FC\u30B9\u306E\u8A00\u8A9E\u3002",
    set_language_auto: "\u81EA\u52D5\uFF08Obsidian \u306B\u5F93\u3046\uFF09",
    set_start_view: "\u958B\u3044\u305F\u3068\u304D\u306E\u8868\u793A",
    set_start_view_desc: "\u8D77\u52D5\u6642\u306B\u958B\u304F\u8868\u793A\u3002",
    set_start_view_last: "\u524D\u56DE\u4F7F\u7528",
    set_nl: "\u30BF\u30A4\u30C8\u30EB\u306E\u65E5\u4ED8\u3068 #\u30E9\u30D9\u30EB\u3092\u691C\u51FA",
    set_nl_desc: "\u30BF\u30B9\u30AF\u30BF\u30A4\u30C8\u30EB\u306E\u5165\u529B\u4E2D\u306B\u671F\u9650\u3068 #\u30E9\u30D9\u30EB\u3092\u81EA\u52D5\u7684\u306B\u89E3\u6790\u3057\u307E\u3059\u3002",
    nav_trash: "\u30B4\u30DF\u7BB1",
    empty_trash: "\u30B4\u30DF\u7BB1\u306F\u7A7A\u3067\u3059\u3002",
    trash_restore_all: "\u3059\u3079\u3066\u5FA9\u5143",
    trash_empty: "\u30B4\u30DF\u7BB1\u3092\u7A7A\u306B\u3059\u308B",
    confirm_empty_trash_q: "\u30B4\u30DF\u7BB1\u3092\u7A7A\u306B\u3057\u307E\u3059\u304B\uFF1F",
    msg_restored: "\u300C{0}\u300D\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F\u3002",
    msg_trash_empty: "\u30B4\u30DF\u7BB1\u306F\u3059\u3067\u306B\u7A7A\u3067\u3059\u3002",
    msg_trash_emptied: "\u30B4\u30DF\u7BB1\u3092\u7A7A\u306B\u3057\u307E\u3057\u305F \u2013 {0} \u4EF6\u306E\u30BF\u30B9\u30AF\u3092\u5B8C\u5168\u306B\u524A\u9664\u3057\u307E\u3057\u305F\u3002",
    report_trash_empty_restore: "\u30B4\u30DF\u7BB1\u306F\u7A7A\u3067\u3059 \u2013 \u5FA9\u5143\u3059\u308B\u3082\u306E\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    report_tasks_restored: "{0} \u4EF6\u306E\u30BF\u30B9\u30AF\u3092\u5FA9\u5143\u3057\u307E\u3057\u305F\u3002",
    rem_at_time: "\u30BF\u30B9\u30AF\u306E\u6642\u523B\u306B",
    rem_before: "{0} \u524D",
    rem_unit_min: "{0} \u5206",
    rem_unit_hour: "{0} \u6642\u9593",
    rem_unit_day: "{0} \u65E5",
    rem_unit_days: "{0} \u65E5",
    chip_reminder: "\u30EA\u30DE\u30A4\u30F3\u30C0\u30FC",
    rem_count: "{0} \u4EF6\u306E\u30EA\u30DE\u30A4\u30F3\u30C0\u30FC",
    reminders_title: "\u30EA\u30DE\u30A4\u30F3\u30C0\u30FC",
    rem_tab_relative: "\u30BF\u30B9\u30AF\u306E\u524D",
    rem_tab_absolute: "\u65E5\u4ED8\u3068\u6642\u523B\u2026",
    rem_need_time: "\u5148\u306B\u6642\u523B\u3092\u8A2D\u5B9A\u3057\u3066\u304F\u3060\u3055\u3044",
    rem_add: "\u30EA\u30DE\u30A4\u30F3\u30C0\u30FC\u3092\u8FFD\u52A0",
    date_confirm: "\u9069\u7528",
    nav_filters: "\u30D5\u30A3\u30EB\u30BF\u30FC",
    filter_add: "\u65B0\u3057\u3044\u30D5\u30A3\u30EB\u30BF\u30FC",
    sec_tasks: "\u30BF\u30B9\u30AF",
    manage_empty_filters: "\u30D5\u30A3\u30EB\u30BF\u30FC\u306F\u307E\u3060\u3042\u308A\u307E\u305B\u3093\u3002",
    nav_toggle_section: "\u30BB\u30AF\u30B7\u30E7\u30F3\u3092\u6298\u308A\u305F\u305F\u3080\uFF0F\u5C55\u958B",
    new_project_title: "\u65B0\u3057\u3044\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8",
    new_area_title: "\u65B0\u3057\u3044\u30A8\u30EA\u30A2",
    new_label_title: "\u65B0\u3057\u3044\u30E9\u30D9\u30EB",
    edit_project_title: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u7DE8\u96C6",
    edit_area_title: "\u30A8\u30EA\u30A2\u3092\u7DE8\u96C6",
    edit_label_title: "\u30E9\u30D9\u30EB\u3092\u7DE8\u96C6",
    show_in_sidebar: "\u30B5\u30A4\u30C9\u30D0\u30FC\u306B\u8868\u793A",
    create_filter: "\u30D5\u30A3\u30EB\u30BF\u30FC\u3092\u4F5C\u6210",
    create_label: "\u30E9\u30D9\u30EB\u3092\u4F5C\u6210",
    create_project: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8\u3092\u4F5C\u6210",
    create_area: "\u30A8\u30EA\u30A2\u3092\u4F5C\u6210",
    btn_create: "\u4F5C\u6210",
    new_need_name: "\u540D\u524D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    new_preview_hint: "\u30D7\u30EC\u30D3\u30E5\u30FC",
    empty_no_filter: "\u3053\u306E\u30D5\u30A3\u30EB\u30BF\u30FC\u306F\u5B58\u5728\u3057\u307E\u305B\u3093\u3002",
    empty_no_filter_tasks: "\u3053\u306E\u30D5\u30A3\u30EB\u30BF\u30FC\u306B\u4E00\u81F4\u3059\u308B\u30BF\u30B9\u30AF\u306F\u3042\u308A\u307E\u305B\u3093\u3002",
    filter_new: "\u65B0\u3057\u3044\u30D5\u30A3\u30EB\u30BF\u30FC",
    filter_edit: "\u30D5\u30A3\u30EB\u30BF\u30FC\u3092\u7DE8\u96C6",
    filter_name: "\u540D\u524D",
    filter_name_ph: "\u30D5\u30A3\u30EB\u30BF\u30FC\u540D \u2026",
    filter_arrange: "\u6574\u7406",
    filter_facets: "\u30D5\u30A3\u30EB\u30BF\u30FC",
    filter_dir: "\u4E26\u3073\u9806",
    filter_dir_asc: "\u6607\u9806",
    filter_dir_desc: "\u964D\u9806",
    filter_sort: "\u4E26\u3079\u66FF\u3048",
    filter_group: "\u30B0\u30EB\u30FC\u30D7\u5316",
    filter_show_done: "\u5B8C\u4E86\u3092\u542B\u3081\u308B",
    filter_range: "\u671F\u9593",
    filter_priorities: "\u512A\u5148\u5EA6",
    filter_labels: "\u30E9\u30D9\u30EB",
    filter_projects: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8",
    filter_search: "\u691C\u7D22",
    filter_search_ph: "\u30BF\u30A4\u30C8\u30EB\u5185\u306E\u30C6\u30AD\u30B9\u30C8 \u2026",
    filter_reset: "\u30EA\u30BB\u30C3\u30C8",
    filter_delete: "\u524A\u9664",
    filter_save: "\u4FDD\u5B58",
    filter_need_name: "\u540D\u524D\u3092\u5165\u529B\u3057\u3066\u304F\u3060\u3055\u3044\u3002",
    filter_name_taken: "\u3053\u306E\u540D\u524D\u306E\u30D5\u30A3\u30EB\u30BF\u30FC\u306F\u65E2\u306B\u5B58\u5728\u3057\u307E\u3059\u3002",
    filter_facets_active: "{0} \u4EF6\u6709\u52B9",
    filter_all: "\u3059\u3079\u3066",
    filter_n_selected: "{0} \u4EF6\u9078\u629E",
    filter_n_criteria: "{0} \u4EF6\u306E\u6761\u4EF6\u3092\u9078\u629E",
    filter_mode_lead: "\u30D5\u30A3\u30EB\u30BF\u30FC\u30E2\u30FC\u30C9",
    filter_mode_any: "\u3044\u305A\u308C\u304B",
    filter_mode_all: "\u3059\u3079\u3066",
    filter_mode_none: "\u306A\u3057",
    filter_mode_s_any: "\u5C11\u306A\u304F\u3068\u30821\u3064\u304C\u4E00\u81F4\u3002",
    filter_mode_s_all: "\u3059\u3079\u3066\u304C\u4E00\u81F4\u3002",
    filter_mode_s_none: "\u3069\u308C\u3082\u4E00\u81F4\u3057\u306A\u3044\u3002",
    filter_range_any: "\u3059\u3079\u3066",
    filter_range_overdue: "\u671F\u9650\u5207\u308C",
    filter_range_today: "\u4ECA\u65E5\u3068\u671F\u9650\u5207\u308C",
    filter_range_next7: "\u4ECA\u5F8C 7 \u65E5\u9593",
    filter_range_nodate: "\u65E5\u4ED8\u306A\u3057",
    filter_sort_smart: "\u30B9\u30DE\u30FC\u30C8",
    filter_sort_due: "\u65E5\u4ED8",
    filter_sort_deadline: "\u7DE0\u3081\u5207\u308A",
    filter_sort_priority: "\u512A\u5148\u5EA6",
    filter_sort_created: "\u4F5C\u6210\u65E5",
    filter_sort_title: "\u540D\u524D",
    filter_group_none: "\u306A\u3057",
    filter_group_status: "\u30B9\u30C6\u30FC\u30BF\u30B9",
    filter_group_date: "\u65E5\u4ED8",
    filter_group_deadline: "\u7DE0\u3081\u5207\u308A",
    filter_group_priority: "\u512A\u5148\u5EA6",
    filter_group_label: "\u30E9\u30D9\u30EB",
    filter_group_project: "\u30D7\u30ED\u30B8\u30A7\u30AF\u30C8",
    view_display: "\u8868\u793A",
    panel_layout: "\u30EC\u30A4\u30A2\u30A6\u30C8",
    panel_show_done: "\u5B8C\u4E86\u3092\u8868\u793A",
    no_label: "\u30E9\u30D9\u30EB\u306A\u3057",
    more_actions: "\u305D\u306E\u4ED6"
  },
  it: {
    view_today: "Oggi",
    view_upcoming: "Prossime",
    view_recurring: "Ricorrenti",
    view_done: "Completate",
    status_todo: "Da fare",
    status_doing: "In corso",
    status_done: "Fatto",
    status_cancelled: "Annullata",
    layout_list: "Elenco",
    layout_board: "Bacheca",
    menu_cancel_task: "Annulla attivit\xE0",
    layout_calendar: "Calendario",
    cal_prev: "Precedente",
    cal_next: "Successivo",
    cal_today: "Oggi",
    cal_unscheduled: "Senza data",
    cal_unscheduled_empty: "Nulla senza data",
    cal_mode_year: "Anno",
    cal_tasks: "{0} attivit\xE0",
    cal_mode_month: "Mese",
    cal_mode_week: "Settimana",
    cal_mode_day: "Giorno",
    cal_more: "+{0} altri",
    cal_allday: "Tutto il giorno",
    tab_statuses: "Stati",
    status_add: "Aggiungi stato",
    placeholder_status_name: "Nome dello stato",
    status_reset_default: "Ripristina predefiniti",
    confirm_reset_statuses_q: "Ripristinare tutti gli stati ai valori predefiniti?",
    status_hint: "Queste sono le colonne della bacheca Kanban \u2014 l'ordine = ordine delle colonne.",
    status_kind_open: "Aperto",
    status_kind_done: "Fatto",
    status_kind_cancelled: "Annullato",
    role_new_tasks: "Nuove attivit\xE0",
    role_on_complete: "Al completamento",
    role_trash: "Cestino",
    status_pick_icon: "Icona",
    status_pick_color: "Colore",
    status_color_none: "Nessun colore",
    color_custom: "Colore personalizzato",
    btn_move_up: "Sposta su",
    btn_move_down: "Sposta gi\xF9",
    status_need_done: "Mantieni almeno uno stato \xABFatto\xBB.",
    status_need_open: "Mantieni almeno uno stato aperto.",
    status_need_kind: "Mantieni almeno uno stato per categoria.",
    status_only_one_trash: "C\u2019\xE8 esattamente uno stato cestino.",
    status_reassigned: "{0} attivit\xE0 spostate in {1}.",
    sort_by: "Ordina",
    sort_manual: "Manuale",
    sort_name: "Nome",
    sort_count: "Numero",
    whatsnew_title: "Novit\xE0",
    whatsnew_ok: "Ho capito",
    wn_cal_t: "Vista calendario",
    wn_cal_d: "Anno, mese, settimana e giorno: trascina le attivit\xE0 per riprogrammarle.",
    wn_unsched_t: "Barra \u201ESenza data\u201C",
    wn_unsched_d: "Attivit\xE0 senza data, pronte da trascinare nella griglia.",
    wn_dir_t: "Direzione di ordinamento",
    wn_dir_d: "Crescente o decrescente, per ogni criterio.",
    wn_excl_t: "Includere ed escludere nei filtri",
    wn_excl_d: "Segna ogni valore come \u2713 includi o \u2212 escludi, misti nello stesso campo: etichette, progetti e priorit\xE0.",
    wn_fmode_t: "Modalit\xE0: uno \xB7 tutti \xB7 nessuno",
    wn_fmode_d: "Per campo: almeno uno (O), tutti (E) o nessuno (NON).",
    wn_anytime_t: "es. un filtro \u201CIn qualsiasi momento\u201D",
    wn_anytime_d: "Senza data e senza una certa etichetta \u2014 ora in un solo filtro.",
    wn_chips_t: "Personalizza i chip",
    wn_chips_d: "Mostra, nascondi e riordina i chip nell\u2019aggiunta rapida e nell\u2019editor completo separatamente, con un menu + per il resto.",
    wn_status_t: "Stati robusti",
    wn_status_d: "Gli stati ora hanno categorie garantite (aperto \xB7 fatto \xB7 cestino), un editor raggruppato per categoria e un cestino che funziona sempre.",
    wn_quickadd_t: "Aggiunta rapida completa",
    wn_quickadd_d: "L\u2019aggiunta rapida porta tutti i campi; il pulsante ingrandisci passa tutto all\u2019editor completo.",
    wn_reset_t: "Impostazioni predefinite sensate",
    wn_reset_d: "Nuovi layout predefiniti e pulsanti per ripristinare il layout dei chip e gli stati.",
    wn_gcal_t: "Sincronizzazione con Google Calendar",
    wn_gcal_d: "Rispecchia le attivit\xE0 con data di scadenza \u2014 data e ora si sincronizzano nei due sensi.",
    wn_gcalcal_t: "Il tuo account, il tuo calendario",
    wn_gcalcal_d: "Connettiti con le tue credenziali Google; gli eventi finiscono in un calendario BeautyTasks dedicato.",
    wn_gcallist_t: "Controllo per lista",
    wn_gcallist_d: "Attiva o disattiva la sincronizzazione per qualsiasi progetto, area o la posta in arrivo.",
    wn_gcalstat_t: "Stato e conflitti",
    wn_gcalstat_d: "Un indicatore nella barra di stato mostra la sincronizzazione; in caso di conflitto vince Obsidian.",
    wn_board_t: "Bacheca per raggruppamento",
    wn_board_d: "La bacheca Kanban ora segue il raggruppamento: colonne per stato, etichetta, priorit\xE0 o progetto \u2014 trascina le schede tra le colonne.",
    wn_langs_t: "8 nuove lingue",
    wn_langs_d: "L\u2019interfaccia \xE8 ora disponibile anche in spagnolo, portoghese, francese, turco, cinese, russo, giapponese e italiano.",
    wn_project_t: "Digita @ per un progetto",
    wn_project_d: "Nell\u2019aggiunta rapida, assegna un\u2019attivit\xE0 a un progetto o area esistente digitando @Nome.",
    wn_hidden_t: "Mostra elementi nascosti",
    wn_hidden_d: "Fai clic destro sull'intestazione di una sezione per ripristinare le voci nascoste con un clic.",
    wn_ui_t: "Miglioramenti dell\u2019interfaccia",
    wn_ui_d: "Pi\xF9 ordinato e flessibile: ordina e raggruppa in Oggi, un\u2019agenda con date in Prossime e un menu in ogni pagina di progetto, etichetta e filtro.",
    nav_inbox: "Posta in arrivo",
    group_area: "Aree",
    group_project: "Progetti",
    sec_overdue: "In ritardo",
    sec_today: "Oggi",
    sec_upcoming: "Prossime",
    sec_no_date: "Senza data",
    sec_done: "Completate",
    count_task: "{0} attivit\xE0",
    count_tasks: "{0} attivit\xE0",
    empty_nothing_scheduled: "Niente in programma.",
    empty_nothing_recurring: "Nessuna attivit\xE0 ricorrente.",
    empty_nothing_done: "Ancora niente di completato.",
    empty_nothing_today: "Niente per oggi.",
    empty_no_project_tasks: "Ancora nessuna attivit\xE0 in questo progetto.",
    empty_no_area_tasks: "Ancora nessuna attivit\xE0 in quest'area.",
    empty_no_inbox_tasks: "Ancora nessuna attivit\xE0 nella posta in arrivo.",
    empty_no_label_tasks: "Ancora nessuna attivit\xE0 con questa etichetta.",
    empty_no_tasks: "Ancora nessuna attivit\xE0.",
    btn_add_task: "Aggiungi attivit\xE0",
    btn_cancel: "Annulla",
    btn_save: "Salva",
    btn_delete: "Elimina",
    details: "Dettagli",
    subtask: "Sottoattivit\xE0",
    placeholder_subtask: "Sottoattivit\xE0",
    log_placeholder: "Aggiungi un commento \u2026",
    log_attach: "Allega file",
    log_link: "Collega nota",
    log_add: "Aggiungi",
    log_edit: "Modifica",
    log_update: "Aggiorna",
    log_link_placeholder: "Collega una nota \u2026",
    btn_close: "Chiudi",
    lb_prev: "Immagine precedente",
    lb_next: "Immagine successiva",
    lb_copy: "Copia immagine",
    msg_image_copied: "Immagine copiata negli appunti.",
    msg_image_copy_failed: "Impossibile copiare l'immagine.",
    msg_attached: "Allegato {0}",
    msg_attach_failed: "Allegato non riuscito: {0}",
    err_detail_save: "Impossibile salvare i dettagli.",
    placeholder_taskname: "Nome dell'attivit\xE0",
    placeholder_description: "Descrizione \u2026",
    placeholder_date_input: "Inserisci una data \u2026",
    placeholder_label: "Etichetta",
    placeholder_project_name: "Nome del progetto \u2026",
    placeholder_area_name: "Nome dell'area \u2026",
    chip_date: "Data",
    chip_priority: "Priorit\xE0",
    chip_label: "Etichette",
    chip_recurrence: "Ricorrenza",
    chip_deadline: "Termine ultimo",
    chip_parent: "Attivit\xE0 principale",
    pick_parent: "Sposta sotto un'attivit\xE0 \u2026",
    prio_1: "Priorit\xE0 1",
    prio_2: "Priorit\xE0 2",
    prio_3: "Priorit\xE0 3",
    prio_4: "Priorit\xE0 4",
    recur_none: "Nessuna",
    recur_daily: "Giornaliera",
    recur_weekly: "Settimanale",
    recur_monthly: "Mensile",
    recur_quarterly: "Trimestrale",
    recur_yearly: "Annuale",
    recur_basis: "Prossima data da",
    recur_when_done: "Al completamento",
    pick_new_project: "Nuovo progetto",
    pick_new_area: "Nuova area",
    no_project: "Nessun progetto",
    make_area: "Area",
    make_area_hint: "Le aree sono permanenti e non possono essere eliminate n\xE9 archiviate.",
    manage: "Gestisci",
    manage_full: "Gestore elenchi",
    tab_active: "Attivi",
    tab_archive: "Archivio",
    tab_labels: "Etichette",
    add_label: "Nuova etichetta",
    manage_empty_labels: "Ancora nessuna etichetta in uso.",
    tip_show_sidebar: "Mostra nella barra laterale",
    tip_hide_sidebar: "Nascondi dalla barra laterale",
    tip_mark_area: "Converti in area",
    tip_unmark_area: "Converti in progetto",
    btn_rename: "Rinomina",
    btn_archive: "Archivia",
    btn_restore: "Ripristina",
    btn_delete_forever: "Elimina definitivamente",
    confirm_delete_q: "Eliminare?",
    confirm_delete_forever_q: "Eliminare definitivamente?",
    menu_edit: "Modifica \u2026",
    menu_reorder: "Cambia ordine \u2026",
    menu_reveal_hidden: "Mostra nascosti",
    menu_goto_projects: "Vai alla panoramica progetti",
    menu_goto_areas: "Vai alla panoramica aree",
    menu_goto_labels: "Vai alla panoramica etichette",
    menu_goto_filters: "Vai alla panoramica filtri",
    reorder_active: "Riordino",
    reorder_done: "Fatto",
    archive_undo: "Annulla",
    archived_notice: "\xAB{0}\xBB archiviato.",
    confirm_delete_title: "Eliminare \xAB{0}\xBB?",
    confirm_delete_body: "L'operazione non pu\xF2 essere annullata.",
    manage_empty_active: "Ancora nessun progetto o area.",
    manage_empty_archive: "Niente archiviato.",
    manage_empty_projects: "Ancora nessun progetto.",
    manage_empty_areas: "Ancora nessuna area.",
    manage_no_active_hint: "Crea un progetto dalla finestra dell'attivit\xE0, poi convertilo in area qui se necessario.",
    date_today: "Oggi",
    date_yesterday: "Ieri",
    date_tomorrow: "Domani",
    date_this_weekend: "Questo fine settimana",
    date_next_week: "La prossima settimana",
    date_no_date: "Senza data",
    time_add: "Ora",
    time_label: "Ora",
    duration_label: "Durata",
    err_enter_taskname: "Inserisci un nome per l'attivit\xE0.",
    err_parent_not_found: "Attivit\xE0 principale non trovata.",
    cmd_new_task: "Nuova attivit\xE0",
    cmd_quick_add: "Aggiunta rapida attivit\xE0",
    cmd_open_view: "Apri {0}",
    cmd_count_tasks: "Conta le attivit\xE0",
    cmd_import: "Importa da Tasks/Lists",
    cmd_search: "Cerca attivit\xE0",
    cmd_whatsnew: "Mostra le novit\xE0",
    cmd_gcal_sync_now: "Sincronizza ora con Google Calendar",
    cmd_export_json: "Esporta attivit\xE0 (JSON)",
    cmd_import_json: "Importa attivit\xE0 (JSON)",
    cmd_import_tasknotes: "Importa da TaskNotes",
    set_import_tn: "Importa da TaskNotes",
    set_import_tn_desc: "Migra le attivit\xE0 dal plugin TaskNotes (mantenute come note Markdown).",
    set_import_tn_btn: "Importa da TaskNotes",
    set_gcal_heading: "Google Calendar",
    gcal_not_connected: "Non connesso",
    gcal_setup_desc: `Sincronizza le attivit\xE0 con data su Google Calendar. Usa le tue credenziali dell'API di Google (configurazione una tantum, ~5 min). Crea un client OAuth di tipo "App desktop" e incolla ID e secret qui sotto.`,
    gcal_help_btn: "Apri la guida alla configurazione",
    gcal_setup_hint: "Prima volta? La guida ti accompagna nella creazione delle credenziali Google.",
    gcal_client_id: "ID client",
    gcal_client_secret: "Secret client",
    gcal_connect_btn: "Connetti",
    gcal_connecting: "Connessione\u2026",
    gcal_connect_failed: "Connessione non riuscita: {0}",
    gcal_connected_as: "Connesso come {0}",
    gcal_disconnect_btn: "Disconnetti",
    gcal_last_synced: "Ultima sincronizzazione: {0}",
    gcal_never: "mai",
    gcal_syncing: "Sincronizzazione\u2026",
    gcal_sync_error: "Errore: {0}",
    gcal_sync_now_btn: "Sincronizza ora",
    gcal_target_calendar: "Calendario di destinazione",
    gcal_target_calendar_desc: "In quale calendario vengono rispecchiate le attivit\xE0 con data.",
    gcal_create_calendar_btn: "Crea calendario BeautyTasks",
    gcal_create_calendar_desc: 'Crea un calendario "BeautyTasks" dedicato e usalo (gli eventi esistenti verranno spostati alla prossima sincronizzazione).',
    gcal_sync_list: "Sincronizza con Google Calendar",
    gcal_tip_create: "Consiglio: usa un calendario dedicato",
    gcal_tip_create_desc: "Crea il tuo calendario Google e migra l\xEC le attivit\xE0 (separazione netta dal calendario principale).",
    gcal_create_calendar_failed: "Impossibile creare il calendario: {0} \u2014 potresti dover disconnetterti e riconnetterti (nuova autorizzazione).",
    gcal_no_calendar_warn: "Nessun calendario di destinazione selezionato \u2014 scegline uno qui sotto o crea il calendario BeautyTasks. Fino ad allora non viene sincronizzato nulla.",
    gcal_enabled: "Sincronizza le attivit\xE0 con data",
    gcal_enabled_desc: "Rispecchia come evento ogni attivit\xE0 con una data di scadenza.",
    gcal_autosync: "Sincronizza automaticamente",
    gcal_autosync_desc: "Invia le modifiche mentre modifichi le attivit\xE0 (altrimenti la sincronizzazione parte solo su comando).",
    gcal_advanced: "Avanzate",
    gcal_on_create: "Aggiungi nuove attivit\xE0",
    gcal_on_update: "Invia le modifiche agli eventi esistenti",
    gcal_on_delete: "Rimuovi l'evento quando l'attivit\xE0 viene eliminata o senza data",
    gcal_remove_on_complete: "Rimuovi l'evento quando l'attivit\xE0 \xE8 completata",
    gcal_duration: "Durata predefinita dell'evento (minuti)",
    gcal_timezone: "Fuso orario",
    gcal_statusbar: "Mostra lo stato di sincronizzazione nella barra di stato",
    gcal_notify_conflicts: "Notifica in caso di conflitti",
    gcal_device_prompt: "Apri {0} e inserisci il codice: {1}",
    gcal_reconnect_hint: "riconnettiti nelle impostazioni",
    gcal_conflicts_notice: "{0} conflitto/i risolto/i \u2014 mantenuti i valori di Obsidian",
    menu_gcal_exclude: "Escludi dalla sincronizzazione con Calendar",
    menu_gcal_include: "Includi nella sincronizzazione con Calendar",
    tn_import_title: "Importa da TaskNotes",
    tn_import_desc: "Crea nuove note BeautyTasks dalle tue attivit\xE0 TaskNotes. I tuoi file TaskNotes restano intatti.",
    tn_import_tag: "Etichetta attivit\xE0",
    tn_import_tag_desc: "Etichetta del frontmatter che contrassegna una nota come attivit\xE0 TaskNotes.",
    tn_import_folder: "Cartella (facoltativa)",
    tn_import_folder_desc: "Limita a una cartella. Vuoto analizza tutto il vault.",
    tn_import_folder_ph: "es. Attivit\xE0",
    tn_import_found: "{0} note di attivit\xE0 trovate.",
    tn_import_none: "Nessuna attivit\xE0 TaskNotes trovata.",
    tn_import_btn: "Importa",
    tn_import_done: "Importate {0}, saltate {1}.",
    tn_import_lossy: "{0} con ricorrenza complessa hanno mantenuto l'originale come nota.",
    tn_import_failed: "Importazione non riuscita.",
    qa_placeholder: "es. Scrivere report domani p1 #importante @lavoro",
    qa_added: "Attivit\xE0 aggiunta",
    qa_open_full: "Apri nell'editor completo",
    nav_search: "Cerca",
    search_placeholder: "Cerca attivit\xE0 \u2026",
    search_exclude_archived: "Escludi archiviati",
    notice_count: "BeautyTasks: {0} attivit\xE0 ({1} aperte)",
    notice_import_running: "BeautyTasks: importazione \u2026",
    notice_imported: "BeautyTasks: {0} attivit\xE0 importate.",
    notice_import_failed: "BeautyTasks: importazione non riuscita (vedi console).",
    notice_export_done: "BeautyTasks: esportato in {0}",
    notice_export_failed: "BeautyTasks: esportazione non riuscita (vedi console).",
    notice_import_invalid: "BeautyTasks: file di esportazione non valido.",
    notice_import_summary: "BeautyTasks: {0} attivit\xE0 aggiunte, {1} saltate.",
    import_pick_placeholder: "Scegli un'esportazione JSON \u2026",
    set_data_heading: "Importa ed esporta",
    set_export: "Esporta attivit\xE0",
    set_export_desc: "Salva tutte le attivit\xE0 come file JSON nel tuo vault (senza perdite).",
    set_export_btn: "Esporta",
    set_import: "Importa attivit\xE0",
    set_import_desc: "Legge le attivit\xE0 da un'esportazione JSON. Le attivit\xE0 esistenti vengono saltate (in base all'id).",
    set_import_vault_btn: "Dal vault \u2026",
    set_import_os_btn: "Da file \u2026",
    ribbon_open: "Apri BeautyTasks",
    set_show_desc: "Mostra la descrizione negli elenchi",
    set_show_desc_desc: "Mostra un'anteprima di una riga della descrizione sotto il titolo dell'attivit\xE0.",
    set_chips_iconsonly: "Chip compatti (solo icone)",
    set_chips_iconsonly_desc: "Nell'editor delle attivit\xE0, mostra solo le icone dei chip di opzione vuoti (Data, Priorit\xE0, Etichetta \u2026); il nome appare come suggerimento. I chip con un valore continuano a mostrarlo.",
    task_actions: "Azioni attivit\xE0",
    chip_status: "Stato",
    more_chip_actions: "Altre azioni",
    edit_task_actions: "Modifica azioni attivit\xE0",
    set_chip_actions: "Azioni attivit\xE0 (chip di input)",
    set_chip_actions_desc: "Configura l\u2019aggiunta rapida e l\u2019editor completo separatamente. Trascina ogni chip in una sezione: Mostra sempre, Mostra se valorizzato o Solo nel menu +. L\u2019ordine = ordine dei chip.",
    chip_tier_shown: "Mostra sempre",
    chip_tier_onValue: "Mostra se valorizzato",
    chip_tier_hidden: "Solo nel menu +",
    chip_surface_editor: "Editor completo",
    chip_surface_quickadd: "Aggiunta rapida",
    chip_reset_default: "Ripristina predefiniti",
    menu_create_subtask: "Crea sottoattivit\xE0",
    menu_show_parent: "Mostra attivit\xE0 principale",
    menu_duplicate: "Duplica attivit\xE0",
    menu_copy_link: "Copia link all'attivit\xE0",
    menu_open_obsidian: "Apri in Obsidian",
    menu_open_editor: "Apri nell'editor",
    menu_print: "Stampa",
    copy_suffix: "(Copia)",
    msg_duplicated: "Attivit\xE0 duplicata",
    msg_link_copied: "Link copiato",
    msg_link_copy_failed: "Impossibile copiare il link.",
    set_folders_heading: "Cartelle",
    set_folder_items: "Cartella attivit\xE0",
    set_folder_items_desc: "Dove vengono create le nuove note di attivit\xE0.",
    set_folder_projects: "Cartella progetti",
    set_folder_projects_desc: "Dove vengono create le note di progetto e area.",
    set_folder_attachments: "Cartella allegati",
    set_folder_attachments_desc: "Dove vengono archiviati i file incollati o allegati.",
    set_behavior_heading: "Comportamento",
    set_language: "Lingua",
    set_language_desc: "Lingua dell'interfaccia.",
    set_language_auto: "Automatica (segui Obsidian)",
    set_start_view: "Vista all'apertura",
    set_start_view_desc: "Quale vista si apre all'avvio.",
    set_start_view_last: "Ultima usata",
    set_nl: "Rileva data e #etichette nel titolo",
    set_nl_desc: "Analizza automaticamente le scadenze e le #etichette mentre digiti il titolo dell'attivit\xE0.",
    nav_trash: "Cestino",
    empty_trash: "Il cestino \xE8 vuoto.",
    trash_restore_all: "Ripristina tutto",
    trash_empty: "Svuota cestino",
    confirm_empty_trash_q: "Svuotare il cestino?",
    msg_restored: "\xAB{0}\xBB ripristinata.",
    msg_trash_empty: "Il cestino \xE8 gi\xE0 vuoto.",
    msg_trash_emptied: "Cestino svuotato \u2013 {0} attivit\xE0 eliminate definitivamente.",
    report_trash_empty_restore: "Il cestino \xE8 vuoto \u2013 niente da ripristinare.",
    report_tasks_restored: "{0} attivit\xE0 ripristinate.",
    rem_at_time: "All'ora dell'attivit\xE0",
    rem_before: "{0} prima",
    rem_unit_min: "{0} min",
    rem_unit_hour: "{0} h",
    rem_unit_day: "{0} giorno",
    rem_unit_days: "{0} giorni",
    chip_reminder: "Promemoria",
    rem_count: "{0} promemoria",
    reminders_title: "Promemoria",
    rem_tab_relative: "Prima dell'attivit\xE0",
    rem_tab_absolute: "Data e ora\u2026",
    rem_need_time: "Imposta prima un'ora",
    rem_add: "Aggiungi promemoria",
    date_confirm: "Applica",
    nav_filters: "Filtri",
    filter_add: "Nuovo filtro",
    sec_tasks: "Attivit\xE0",
    manage_empty_filters: "Ancora nessun filtro.",
    nav_toggle_section: "Comprimi o espandi la sezione",
    new_project_title: "Nuovo progetto",
    new_area_title: "Nuova area",
    new_label_title: "Nuova etichetta",
    edit_project_title: "Modifica progetto",
    edit_area_title: "Modifica area",
    edit_label_title: "Modifica etichetta",
    show_in_sidebar: "Mostra nella barra laterale",
    create_filter: "Crea filtro",
    create_label: "Crea etichetta",
    create_project: "Crea progetto",
    create_area: "Crea area",
    btn_create: "Crea",
    new_need_name: "Inserisci un nome.",
    new_preview_hint: "Anteprima",
    empty_no_filter: "Questo filtro non esiste pi\xF9.",
    empty_no_filter_tasks: "Nessuna attivit\xE0 corrisponde a questo filtro.",
    filter_new: "Nuovo filtro",
    filter_edit: "Modifica filtro",
    filter_name: "Nome",
    filter_name_ph: "Nome del filtro \u2026",
    filter_arrange: "Disponi",
    filter_facets: "Filtra",
    filter_dir: "Direzione",
    filter_dir_asc: "Crescente",
    filter_dir_desc: "Decrescente",
    filter_sort: "Ordina",
    filter_group: "Raggruppa",
    filter_show_done: "Includi completate",
    filter_range: "Periodo",
    filter_priorities: "Priorit\xE0",
    filter_labels: "Etichette",
    filter_projects: "Progetti",
    filter_search: "Cerca",
    filter_search_ph: "Testo nel titolo \u2026",
    filter_reset: "Reimposta",
    filter_delete: "Elimina",
    filter_save: "Salva",
    filter_need_name: "Inserisci un nome.",
    filter_name_taken: "Esiste gi\xE0 un filtro con questo nome.",
    filter_facets_active: "{0} attivi",
    filter_all: "Tutti",
    filter_n_selected: "{0} selezionati",
    filter_n_criteria: "{0} criteri selezionati",
    filter_mode_lead: "Modalit\xE0 filtro",
    filter_mode_any: "uno",
    filter_mode_all: "tutti",
    filter_mode_none: "nessuno",
    filter_mode_s_any: "Almeno uno deve corrispondere.",
    filter_mode_s_all: "Tutti devono corrispondere.",
    filter_mode_s_none: "Nessuno deve corrispondere.",
    filter_range_any: "Qualsiasi",
    filter_range_overdue: "In ritardo",
    filter_range_today: "Oggi e in ritardo",
    filter_range_next7: "Prossimi 7 giorni",
    filter_range_nodate: "Senza data",
    filter_sort_smart: "Intelligente",
    filter_sort_due: "Data",
    filter_sort_deadline: "Termine ultimo",
    filter_sort_priority: "Priorit\xE0",
    filter_sort_created: "Creazione",
    filter_sort_title: "Nome",
    filter_group_none: "Nessuno",
    filter_group_status: "Stato",
    filter_group_date: "Data",
    filter_group_deadline: "Termine ultimo",
    filter_group_priority: "Priorit\xE0",
    filter_group_label: "Etichetta",
    filter_group_project: "Progetti",
    view_display: "Visualizza",
    panel_layout: "Layout",
    panel_show_done: "Mostra completate",
    no_label: "Senza etichetta",
    more_actions: "Altro"
  }
};
var DEFAULT_LOCALE = "en";
var current = DEFAULT_LOCALE;
function pickLocale(raw) {
  const l = String(raw ?? "").trim().toLowerCase();
  if (Object.prototype.hasOwnProperty.call(STRINGS, l)) return l;
  const base = l.split(/[-_]/)[0];
  return Object.prototype.hasOwnProperty.call(STRINGS, base) ? base : DEFAULT_LOCALE;
}
function setLocale(loc) {
  current = pickLocale(loc);
}
function getLocale() {
  return current;
}
function t(key, ...args) {
  let s = STRINGS[current][key] ?? STRINGS[DEFAULT_LOCALE][key] ?? key;
  for (let i = 0; i < args.length; i++) s = s.split("{" + i + "}").join(String(args[i]));
  return s;
}
function projectDisplayName(name) {
  return name && /^(inbox|eingang)$/i.test(name) ? t("nav_inbox") : name ?? "";
}

// src/statuses.ts
var KIND_ICON = { open: "circle", done: "check-circle", cancelled: "x-circle" };
var DEFAULT_STATUSES = [
  { id: "todo", labelKey: "status_todo", kind: "open", icon: "circle" },
  { id: "doing", labelKey: "status_doing", kind: "open", icon: "contrast" },
  { id: "done", labelKey: "status_done", kind: "done", icon: "check-circle" },
  { id: "cancelled", labelKey: "status_cancelled", kind: "cancelled", icon: "x-circle" }
];
var CURRENT = DEFAULT_STATUSES;
var BY_ID = new Map(CURRENT.map((s) => [s.id, s]));
function initStatuses(list) {
  CURRENT = list && list.length ? list : DEFAULT_STATUSES;
  BY_ID = new Map(CURRENT.map((s) => [s.id, s]));
}
function ensureStatusInvariants(list) {
  const out = list && list.length ? list.map((s) => ({ ...s })) : DEFAULT_STATUSES.map((s) => ({ ...s }));
  const has = (k) => out.some((s) => s.kind === k);
  const uniqueId = (base) => {
    let id = base, n = 2;
    while (out.some((s) => s.id === id)) id = base + "-" + n++;
    return id;
  };
  const insertBeforeTrash = (e) => {
    const cx = out.findIndex((s) => s.kind === "cancelled");
    if (cx >= 0) out.splice(cx, 0, e);
    else out.push(e);
  };
  if (!has("open")) insertBeforeTrash({ ...DEFAULT_STATUSES[0], id: uniqueId(DEFAULT_STATUSES[0].id) });
  if (!has("done")) insertBeforeTrash({ ...DEFAULT_STATUSES[2], id: uniqueId(DEFAULT_STATUSES[2].id) });
  if (!has("cancelled")) out.push({ ...DEFAULT_STATUSES[3], id: uniqueId(DEFAULT_STATUSES[3].id) });
  return out;
}
var allStatuses = () => CURRENT;
var isKnownStatus = (id) => BY_ID.has(id);
var statusLabel = (id) => {
  const d = BY_ID.get(id);
  if (!d) return id;
  return d.labelKey ? t(d.labelKey) : d.label ?? id;
};
var statusIcon = (id) => {
  const d = BY_ID.get(id);
  return d?.icon ?? (d ? KIND_ICON[d.kind] : "circle");
};
var statusColor = (id) => BY_ID.get(id)?.color;
var isOpen = (s) => BY_ID.get(s)?.kind === "open";
var isDone = (s) => BY_ID.get(s)?.kind === "done";
var isTrashed = (s) => BY_ID.get(s)?.kind === "cancelled" || s === "cancelled";
var boardStatuses = () => CURRENT.filter((s) => s.kind !== "cancelled");
var firstOpenStatus = () => CURRENT.find((s) => s.kind === "open")?.id ?? "todo";
var firstDoneStatus = () => CURRENT.find((s) => s.kind === "done")?.id ?? "done";
var firstCancelledStatus = () => CURRENT.find((s) => s.kind === "cancelled")?.id ?? "cancelled";
function statusTint(id) {
  const d = BY_ID.get(id);
  if (d?.color) return d.color;
  if (!d) return "var(--interactive-accent)";
  if (d.kind === "done") return "var(--color-green, #4caf50)";
  if (d.kind === "cancelled") return "var(--color-red, #e05c4a)";
  return id === firstOpenStatus() ? "var(--text-muted)" : "var(--interactive-accent)";
}

// src/format.ts
function todayStr() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function localStamp() {
  const d = /* @__PURE__ */ new Date();
  const z6 = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z6(d.getMonth() + 1)}-${z6(d.getDate())}T${z6(d.getHours())}:${z6(d.getMinutes())}:${z6(d.getSeconds())}`;
}
function monthShort(monthIndex) {
  return new Intl.DateTimeFormat(getLocale(), { month: "short" }).format(new Date(2020, monthIndex, 1)).replace(/\.$/, "");
}
var dateOf = (iso4) => iso4.slice(0, 10);
var timeOf = (iso4) => {
  const m = iso4.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : null;
};
var combineDT = (date, time) => time ? date + "T" + time : date;
function formatDate(iso4, today = todayStr()) {
  const d = /* @__PURE__ */ new Date(dateOf(iso4) + "T00:00");
  const tn = /* @__PURE__ */ new Date(dateOf(today) + "T00:00");
  const diff = Math.round((d.getTime() - tn.getTime()) / 864e5);
  if (diff === 0) return t("date_today");
  if (diff === -1) return t("date_yesterday");
  if (diff === 1) return t("date_tomorrow");
  const sameYear = d.getFullYear() === tn.getFullYear();
  return `${d.getDate()} ${monthShort(d.getMonth())}${sameYear ? "" : " " + d.getFullYear()}`;
}
function formatDateTime(iso4, today = todayStr()) {
  const tm = timeOf(iso4);
  return formatDate(iso4, today) + (tm ? " \xB7 " + tm : "");
}
function formatDuration(min) {
  if (min < 60) return min + " min";
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
function dueWhen(iso4, today = todayStr()) {
  const d = dateOf(iso4), tn = dateOf(today);
  return d < tn ? "past" : d === tn ? "today" : "future";
}

// src/reminders.ts
function parseReminder(raw) {
  const rel = raw.match(/^-(\d+)([mhd])$/);
  if (rel) {
    const n = parseInt(rel[1], 10);
    const mult = rel[2] === "m" ? 1 : rel[2] === "h" ? 60 : 1440;
    return { rel: n * mult };
  }
  if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/.test(raw)) return { abs: raw };
  return null;
}
function humanizeOffset(min) {
  if (min % 1440 === 0) {
    const d = min / 1440;
    return t(d === 1 ? "rem_unit_day" : "rem_unit_days", d);
  }
  if (min % 60 === 0) return t("rem_unit_hour", min / 60);
  return t("rem_unit_min", min);
}
function formatReminder(raw) {
  const p = parseReminder(raw);
  if (!p) return raw;
  if ("abs" in p) return formatDateTime(p.abs);
  if (p.rel === 0) return t("rem_at_time");
  return t("rem_before", humanizeOffset(p.rel));
}
function resolveReminders(task) {
  if (isDone(task.status) || isTrashed(task.status)) return [];
  const out = [];
  for (const raw of task.reminders ?? []) {
    const p = parseReminder(raw);
    if (!p) continue;
    if ("abs" in p) {
      const d = new Date(p.abs.length === 10 ? p.abs + "T00:00" : p.abs);
      if (!isNaN(d.getTime())) out.push({ raw, fireAt: d });
    } else {
      if (!task.due || !task.dueTime) continue;
      const base = /* @__PURE__ */ new Date(task.due + "T" + task.dueTime);
      if (isNaN(base.getTime())) continue;
      out.push({ raw, fireAt: new Date(base.getTime() - p.rel * 6e4) });
    }
  }
  return out;
}

// src/taskIndex.ts
var import_obsidian2 = require("obsidian");

// src/taskService.ts
var import_obsidian = require("obsidian");
var slugify = (s) => s.replace(/[\\/:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Task";
var normalizeLabel = (s) => slugify(s).toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
var newId = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
var todayIso = () => {
  const d = /* @__PURE__ */ new Date();
  const z6 = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z6(d.getMonth() + 1) + "-" + z6(d.getDate());
};
function ensureCanonicalFm(fm) {
  if (fm.id == null || fm.id === "") fm.id = newId("t");
  if (typeof fm.created !== "string" || !fm.created) fm.created = todayIso();
}
function buildFrontmatter(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === void 0 || v === "" || Array.isArray(v) && v.length === 0) continue;
    clean[k] = v;
  }
  return "---\n" + (0, import_obsidian.stringifyYaml)(clean) + "---\n";
}
async function ensureFolder(app, path) {
  const p = (0, import_obsidian.normalizePath)(path);
  if (!app.vault.getAbstractFileByPath(p)) {
    try {
      await app.vault.createFolder(p);
    } catch {
    }
  }
}
async function createTaskNote(app, settings, f) {
  await ensureFolder(app, settings.itemsFolder);
  const slug = slugify(f.title);
  let dest = (0, import_obsidian.normalizePath)(settings.itemsFolder + "/" + slug + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = (0, import_obsidian.normalizePath)(settings.itemsFolder + "/" + slug + " " + n + ".md");
    n++;
    if (n > 200) break;
  }
  const fm = buildFrontmatter({
    type: "task",
    id: newId("t"),
    status: f.status ?? firstOpenStatus(),
    priority: f.priority && f.priority !== "normal" ? f.priority : void 0,
    due: f.due ? combineDT(f.due, f.dueTime) : null,
    scheduled: f.scheduled ? combineDT(f.scheduled, f.scheduledTime) : null,
    duration: f.duration ?? null,
    project: f.project ? "[[" + f.project + "]]" : null,
    parent: f.parent ? "[[" + f.parent + "]]" : null,
    labels: f.labels ?? [],
    recurrence: f.recurrence ?? null,
    recur_basis: f.recurrence && f.recurBasis === "done" ? "done" : null,
    reminders: f.reminders ?? [],
    created: todayIso(),
    description: (f.description ?? "").trim() || null
    // Beschreibung im Frontmatter, nicht im Body
  });
  return app.vault.create(dest, fm + "\n# " + f.title + "\n");
}
var byName = (a, b) => a.name.localeCompare(b.name, "de");
var isInbox = (p) => p.name.toLowerCase() === "inbox" || p.name.toLowerCase() === "eingang";
var INBOX_KEY = "bt:inbox";
function inboxNotePath(app) {
  return allProjItems(app).find(isInbox)?.path ?? null;
}
var isInboxName = (name) => !!name && /^(inbox|eingang)$/i.test(name);
var isInboxLink = (project) => !project || isInboxName(project.split("/").pop().replace(/\.md$/, ""));
function allProjItems(app) {
  return app.vault.getMarkdownFiles().flatMap((f) => {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    const type = fm?.type === "area" ? "area" : fm?.type === "project" ? "project" : null;
    if (!type) return [];
    return [{
      name: f.basename,
      path: f.path,
      type,
      // Bereiche immer circle-small (per CSS gefüllt), unabhängig vom icon-Frontmatter.
      // Projekte: eigenes icon-Frontmatter respektieren, sonst Default „folder".
      icon: type === "area" ? "circle-small" : typeof fm?.icon === "string" && fm.icon ? fm.icon : "folder",
      color: typeof fm?.color === "string" ? fm.color : null,
      hidden: !!fm?.nav_hidden,
      archived: fm?.status === "archived"
    }];
  });
}
function archivedProjectNames(app) {
  return new Set(allProjItems(app).filter((p) => p.archived).map((p) => p.name.toLowerCase()));
}
function listProjectsAndAreas(app) {
  const all = allProjItems(app).filter((p) => !p.archived);
  const bereiche = all.filter((p) => p.type === "area").sort(byName);
  const projekte = all.filter((p) => p.type === "project" && !isInbox(p)).sort(byName);
  return { bereiche, projekte };
}
function listManaged(app) {
  const all = allProjItems(app).filter((p) => !isInbox(p));
  const active = all.filter((p) => !p.archived).sort((a, b) => a.type === b.type ? byName(a, b) : a.type === "area" ? -1 : 1);
  const archived = all.filter((p) => p.archived).sort(byName);
  return { active, archived };
}
async function createProjectNote(app, settings, name, asArea = false, color = null, hidden = false) {
  const folder = settings.projectsFolder;
  await ensureFolder(app, folder);
  const base = slugify(name);
  let dest = (0, import_obsidian.normalizePath)(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = (0, import_obsidian.normalizePath)(folder + "/" + base + " " + n + ".md");
    n++;
    if (n > 200) break;
  }
  const fm = buildFrontmatter({ type: asArea ? "area" : "project", id: newId("p"), status: "active", color: color ?? void 0, nav_hidden: hidden ? true : void 0, created: todayIso() });
  await app.vault.create(dest, fm + "\n# " + name + "\n");
  return base;
}
async function setProjectType(app, path, toArea) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.type = toArea ? "area" : "project";
  });
}
function isAreaPath(app, path) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) return false;
  const fm = app.metadataCache.getFileCache(file)?.frontmatter;
  return fm?.type === "area";
}
async function setProjectArchived(app, path, archived) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm) => {
    fm.status = archived ? "archived" : "active";
  });
}
async function setNavHidden(app, path, hidden) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm) => {
    if (hidden) fm.nav_hidden = true;
    else delete fm.nav_hidden;
  });
}
async function setProjectColor(app, path, color) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) return;
  await app.fileManager.processFrontMatter(file, (fm) => {
    if (color) fm.color = color;
    else delete fm.color;
  });
}
async function renameProjectNote(app, path, newName) {
  const file = app.vault.getAbstractFileByPath(path);
  if (!(file instanceof import_obsidian.TFile)) return null;
  const base = slugify(newName);
  if (!base || base === file.basename) return file.basename;
  const dir = file.parent?.path ?? "";
  const dest = (0, import_obsidian.normalizePath)((dir ? dir + "/" : "") + base + ".md");
  if (app.vault.getAbstractFileByPath(dest)) return null;
  await app.fileManager.renameFile(file, dest);
  const renamed = app.vault.getAbstractFileByPath(dest);
  if (renamed instanceof import_obsidian.TFile) {
    await app.vault.process(renamed, (c) => c.replace(/^#\s+.*$/m, "# " + newName));
  }
  return base;
}
async function deleteProjectNote(app, path) {
  const file = app.vault.getAbstractFileByPath(path);
  if (file instanceof import_obsidian.TFile) await app.fileManager.trashFile(file);
}

// src/taskIndex.ts
var baseName = (p) => p.split("/").pop().replace(/\.md$/, "");
var PRIO = /* @__PURE__ */ new Set(["highest", "high", "medium", "normal", "low", "lowest"]);
var asDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
var asTime = (v) => {
  const m = typeof v === "string" ? v.match(/T(\d{2}:\d{2})/) : null;
  return m ? m[1] : null;
};
var asNum = (v) => typeof v === "number" && isFinite(v) ? v : null;
var TaskIndex = class extends import_obsidian2.Component {
  constructor(app, getSettings) {
    super();
    this.app = app;
    this.getSettings = getSettings;
    this.byPath = /* @__PURE__ */ new Map();
    this.byId = /* @__PURE__ */ new Map();
    // id -> path (überlebt Umbenennen, für Sync)
    this.commentCounts = /* @__PURE__ */ new Map();
    // path -> Anzahl [!log]-Einträge (Kommentare/Anhänge)
    this.subs = /* @__PURE__ */ new Set();
    this.timer = null;
    this.archivedDirty = true;
    // neu berechnen, sobald sich etwas geändert hat
    this.archivedSet = /* @__PURE__ */ new Set();
    // Basenamen (lowercase) archivierter Projekte
    // ── Abfrage-Cache ────────────────────────────────────────────────────────────────────────
    // open() filtert über ALLE Aufgaben und schlägt dabei je Aufgabe den Projekt-Basename nach
    // (String-Split + toLowerCase). Eine einzige Nav-Zeichnung ruft open() rund 30-mal auf (je
    // Projekt, Label, Filter und View-Zähler) – das sind Tausende identischer Durchläufe für Zahlen,
    // die sich zwischendurch gar nicht ändern können. Der Cache wird bei JEDER Mutation verworfen;
    // die Aufrufer mutieren die Ergebnisse nicht (sie filtern/sortieren stets in Kopien).
    this.openCache = null;
    this.projectCache = null;
    // Projekt-Basename -> offene Aufgaben
    this.labelCache = null;
  }
  // Label -> offene Aufgaben
  /** Alle abgeleiteten Abfragen verwerfen. Aufrufen, wenn sich Aufgaben ODER Archiv-Status ändern. */
  invalidate() {
    this.openCache = null;
    this.projectCache = null;
    this.labelCache = null;
  }
  /** Liegt der Pfad in einem der Ausschluss-Ordner? Dann gilt die Notiz NIE als Aufgabe –
   *  Schutz vor fremden `type: task`-Notizen (z. B. anderer Plugins) im Vault-weiten Scan. */
  isExcluded(path) {
    for (const raw of this.getSettings().excludeFolders) {
      const dir = raw.replace(/\/+$/, "").trim();
      if (dir && (path === dir || path.startsWith(dir + "/"))) return true;
    }
    return false;
  }
  /** Basenamen archivierter Projekte, gecacht bis zur nächsten Änderung (notify setzt dirty). */
  archivedProjects() {
    if (this.archivedDirty) {
      this.archivedSet = archivedProjectNames(this.app);
      this.archivedDirty = false;
    }
    return this.archivedSet;
  }
  /** NACH onLayoutReady aufrufen – dann sind Wikilinks auflösbar. */
  build() {
    this.byPath.clear();
    this.byId.clear();
    this.invalidate();
    const files = this.app.vault.getMarkdownFiles();
    for (const f of files) this.upsert(f, false, true);
    const tasks = files.filter((f) => this.byPath.has(f.path));
    void Promise.all(tasks.map((f) => this.readBodyMeta(f, false))).then((changed) => {
      if (changed.some(Boolean)) this.notify();
    });
    const { metadataCache: mc, vault } = this.app;
    this.registerEvent(mc.on("changed", (f) => this.upsert(f)));
    this.registerEvent(vault.on("create", (f) => {
      if (f instanceof import_obsidian2.TFile && f.extension === "md") window.setTimeout(() => this.upsert(f), 80);
    }));
    this.registerEvent(vault.on("delete", (f) => {
      if (f instanceof import_obsidian2.TFile) this.remove(f.path);
    }));
    this.registerEvent(vault.on("rename", (f, old) => {
      this.remove(old, false);
      if (f instanceof import_obsidian2.TFile) this.upsert(f, false);
      this.notify();
    }));
    this.notify();
  }
  // ── Mutation (inkrementell, nie Vollscan im Betrieb) ──
  upsert(f, notify = true, skipBody = false) {
    if (f.extension !== "md") return;
    const t2 = this.parse(f);
    if (!t2) {
      const type = this.app.metadataCache.getFileCache(f)?.frontmatter?.type;
      if (notify && (type === "project" || type === "area")) this.notify();
      this.remove(f.path, notify);
      return;
    }
    const prev = this.byPath.get(f.path);
    if (prev && prev.id !== t2.id) this.byId.delete(prev.id);
    this.byPath.set(f.path, t2);
    this.byId.set(t2.id, f.path);
    this.invalidate();
    if (!skipBody) void this.readBodyMeta(f);
    if (notify) this.notify();
  }
  remove(path, notify = true) {
    const t2 = this.byPath.get(path);
    this.commentCounts.delete(path);
    if (!t2) return;
    this.byPath.delete(path);
    if (this.byId.get(t2.id) === path) this.byId.delete(t2.id);
    this.invalidate();
    if (notify) this.notify();
  }
  /** Anzahl der [!log]-Einträge (Kommentare/Anhänge) einer Aufgabe – für das Chip. */
  commentsOf(path) {
    return this.commentCounts.get(path) ?? 0;
  }
  /** Body EINMAL lesen: Kommentar-Anzahl ableiten (cachedRead ist gecacht). Die Beschreibung
   *  lebt im Frontmatter (`description`) und kommt aus parse() – hier wird sie nicht mehr gelesen.
   *  Gibt zurück, ob sich die Zahl geändert hat. `notify = false` unterdrückt die Meldung. */
  async readBodyMeta(f, notify = true) {
    let content;
    try {
      content = await this.app.vault.cachedRead(f);
    } catch {
      return false;
    }
    const n = (content.match(/^>\s*\[!log\]/gim) ?? []).length;
    const prevN = this.commentCounts.get(f.path) ?? 0;
    if (n) this.commentCounts.set(f.path, n);
    else this.commentCounts.delete(f.path);
    const changed = n !== prevN;
    if (changed && notify) this.notify();
    return changed;
  }
  /** Frontmatter -> Task (Defaults + Enum-Schutz). null = keine Aufgabe. */
  parse(f) {
    if (this.isExcluded(f.path)) return null;
    const cache = this.app.metadataCache.getFileCache(f);
    const fm = cache?.frontmatter;
    if (!fm || fm.type !== "task") return null;
    const link = (v) => {
      const m = typeof v === "string" ? v.match(/\[\[([^\]|#]+)/) : null;
      const dest = m ? this.app.metadataCache.getFirstLinkpathDest(m[1].trim(), f.path) : null;
      return dest ? dest.path : null;
    };
    return {
      id: String(fm.id ?? f.path),
      path: f.path,
      // Titel aus der „# Überschrift" (ungekürzt) – der Dateiname ist nur ein Slug (max. 80).
      title: cache?.headings?.[0]?.heading ?? f.basename,
      // Unbekannter/leerer Status -> erste offene Phase, damit die Aufgabe sichtbar bleibt (statt
      // Status-Limbo). Ausnahme: der reservierte Sentinel "cancelled" bleibt erhalten, sonst würden
      // abgebrochene Aufgaben ohne definierten Abgebrochen-Status wieder als aktiv auftauchen.
      status: typeof fm.status === "string" && isKnownStatus(fm.status) ? fm.status : fm.status === "cancelled" ? "cancelled" : firstOpenStatus(),
      priority: typeof fm.priority === "string" && PRIO.has(fm.priority) ? fm.priority : "normal",
      due: asDate(fm.due),
      dueTime: asTime(fm.due),
      scheduled: asDate(fm.scheduled),
      scheduledTime: asTime(fm.scheduled),
      duration: asNum(fm.duration),
      start: asDate(fm.start),
      project: link(fm.project),
      parent: link(fm.parent),
      labels: Array.isArray(fm.labels) ? fm.labels.map(String) : [],
      description: typeof fm.description === "string" ? fm.description : "",
      recurrence: typeof fm.recurrence === "string" ? fm.recurrence : null,
      recurBasis: fm.recur_basis === "done" ? "done" : "due",
      reminders: Array.isArray(fm.reminders) ? fm.reminders.map(String) : [],
      created: typeof fm.created === "string" ? fm.created : "",
      completed: typeof fm.completed === "string" ? fm.completed : null,
      // voller Zeitstempel (Uhrzeit für Erledigt-Sortierung)
      cancelled: typeof fm.cancelled === "string" ? fm.cancelled : null,
      // voller Zeitstempel (Uhrzeit für Papierkorb-Sortierung)
      externalId: fm.external_id != null ? String(fm.external_id) : null
    };
  }
  // ── Reaktivität ──
  subscribe(cb) {
    this.subs.add(cb);
    return () => this.subs.delete(cb);
  }
  notify() {
    this.archivedDirty = true;
    this.invalidate();
    if (this.timer) return;
    this.timer = window.setTimeout(() => {
      this.timer = null;
      this.subs.forEach((cb) => cb());
    }, 50);
  }
  // ── Abfragen (für die Views) ──
  all() {
    return [...this.byPath.values()];
  }
  get(path) {
    return this.byPath.get(path);
  }
  getById(id) {
    const p = this.byId.get(id);
    return p ? this.byPath.get(p) : void 0;
  }
  /** Offene Aufgaben (todo/doing) OHNE die aus archivierten Projekten – Basis aller
   *  Sammelansichten, damit archivierte Projekte nirgends mehr auftauchen. */
  open() {
    if (this.openCache) return this.openCache;
    const archived = this.archivedProjects();
    this.openCache = this.all().filter((t2) => isOpen(t2.status) && !(t2.project && archived.has(baseName(t2.project).toLowerCase())));
    return this.openCache;
  }
  /** True, wenn das Projekt (Basename) archiviert ist – für Ansichten/Zähler, die all() nutzen. */
  isProjectArchived(project) {
    return !!project && this.archivedProjects().has(baseName(project).toLowerCase());
  }
  overdue(today) {
    return this.open().filter((t2) => !!t2.due && t2.due < today);
  }
  dueToday(today) {
    return this.open().filter((t2) => t2.due === today);
  }
  upcoming(today) {
    return this.open().filter((t2) => !!t2.due && t2.due > today).sort((a, b) => a.due.localeCompare(b.due));
  }
  done() {
    return this.all().filter((t2) => isDone(t2.status)).sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  }
  /** Abgebrochene Aufgaben (Papierkorb), neueste zuerst. */
  cancelled() {
    return this.all().filter((t2) => isTrashed(t2.status)).sort((a, b) => (b.cancelled ?? "").localeCompare(a.cancelled ?? ""));
  }
  /** Offene Aufgaben je Projekt-Basename – EINMAL gruppiert statt je Projekt ein Vollscan.
   *  (Basename, weil gleichnamige Notizen verschiedene Pfade haben können.) */
  byProjectMap() {
    if (this.projectCache) return this.projectCache;
    const m = /* @__PURE__ */ new Map();
    for (const t2 of this.open()) {
      if (!t2.project) continue;
      const name = baseName(t2.project);
      const arr = m.get(name);
      if (arr) arr.push(t2);
      else m.set(name, [t2]);
    }
    this.projectCache = m;
    return m;
  }
  byProject(path) {
    return this.byProjectMap().get(baseName(path)) ?? [];
  }
  /** Eingang, ALLE Status (fürs Board): „nicht einsortiert" = alter `[[Inbox]]`-Verweis ODER
   *  (optional, per Einstellung) gar kein Projekt. Papierkorb bleibt außen vor (globaler Papierkorb). */
  inbox() {
    const filed = this.all().filter((t2) => t2.project != null && isInboxName(baseName(t2.project)) && !isTrashed(t2.status));
    const unfiled = this.getSettings().showUnfiledInInbox ? this.all().filter((t2) => !t2.project && !isTrashed(t2.status)) : [];
    return [...filed, ...unfiled];
  }
  /** Offene Eingangs-Aufgaben – für den Sidebar-Zähler. */
  inboxOpen() {
    return this.inbox().filter((t2) => isOpen(t2.status));
  }
  /** Offene Aufgaben je Label – ebenfalls einmal gruppiert (eine Aufgabe kann mehrere haben). */
  byLabelMap() {
    if (this.labelCache) return this.labelCache;
    const m = /* @__PURE__ */ new Map();
    for (const t2 of this.open()) {
      for (const l of t2.labels) {
        const arr = m.get(l);
        if (arr) arr.push(t2);
        else m.set(l, [t2]);
      }
    }
    this.labelCache = m;
    return m;
  }
  byLabel(label) {
    return this.byLabelMap().get(label) ?? [];
  }
  children(parentPath) {
    return this.all().filter((t2) => t2.parent === parentPath);
  }
  /** Alle Nachfahren (rekursiv, jeder Status) einer Aufgabe – z. B. für Kaskaden-Aktionen. */
  descendants(path) {
    const out = [];
    const walk = (p) => {
      for (const kid of this.children(p)) {
        out.push(kid);
        walk(kid.path);
      }
    };
    walk(path);
    return out;
  }
  /** Demnächst: künftige datierte Aufgaben, gruppiert nach ISO-Datum (aufsteigend). */
  upcomingByDate(today) {
    const groups = /* @__PURE__ */ new Map();
    for (const t2 of this.upcoming(today)) {
      const arr = groups.get(t2.due) ?? [];
      arr.push(t2);
      groups.set(t2.due, arr);
    }
    return [...groups.entries()].sort((a, b) => a[0].localeCompare(b[0])).map(([date, tasks]) => ({ date, tasks }));
  }
};

// src/migrate.ts
var import_obsidian3 = require("obsidian");
var PRIO_MAP = {
  "\u{1F53A}": "highest",
  "\u23EB": "high",
  "\u{1F53C}": "medium",
  "\u{1F53D}": "low",
  "\u23EC": "lowest"
};
var STATUS_MAP = {
  " ": "todo",
  "/": "doing",
  "x": "done",
  "X": "done",
  "-": "cancelled"
};
function parseLine(line) {
  const cb = line.match(/^\s*- \[(.)\]\s?/);
  if (!cb) return null;
  const status = STATUS_MAP[cb[1]] ?? "todo";
  let body = line.replace(/^\s*- \[.\]\s*/, "");
  let detailsBase = null;
  body = body.replace(/\s*\[\[([^\]|]+)\|Details\]\]/, (_m, b) => {
    detailsBase = b.trim();
    return " ";
  });
  body = body.replace(/(^|\s)#task(?=\s|$)/, " ");
  const labels = [...new Set([...body.matchAll(/(?:^|[^"\w/-])#([A-Za-zÄÖÜäöüß][A-Za-z0-9ÄÖÜäöüß/_-]*)/g)].map((m) => m[1]))];
  body = body.replace(/(?:^|[^"\w/-])#([A-Za-zÄÖÜäöüß][A-Za-z0-9ÄÖÜäöüß/_-]*)/g, " ");
  let due = null, scheduled = null;
  body = body.replace(/📅\s*(\d{4}-\d{2}-\d{2})/, (_m, d) => {
    due = d;
    return " ";
  });
  body = body.replace(/⏳\s*(\d{4}-\d{2}-\d{2})/, (_m, d) => {
    scheduled = d;
    return " ";
  });
  let priority = "normal";
  body = body.replace(/(🔺|⏫|🔼|🔽|⏬|⬆️?)/, (m) => {
    priority = PRIO_MAP[m] ?? (m.startsWith("\u2B06") ? "high" : "normal");
    return " ";
  });
  let completed = null, cancelled = null;
  body = body.replace(/✅\s*(\d{4}-\d{2}-\d{2})/, (_m, d) => {
    completed = d;
    return " ";
  });
  body = body.replace(/❌\s*(\d{4}-\d{2}-\d{2})/, (_m, d) => {
    cancelled = d;
    return " ";
  });
  let recurrence = null;
  body = body.replace(/🔁\s*([^\n]*)$/, (_m, r) => {
    recurrence = r.trim();
    return " ";
  });
  const title = body.replace(/\s{2,}/g, " ").trim();
  return { status, title, priority, due, scheduled, recurrence, completed, cancelled, labels, detailsBase };
}
var slugify2 = (s) => s.replace(/[\\/:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Aufgabe";
var newId2 = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
async function ensureFolder2(app, path) {
  const p = (0, import_obsidian3.normalizePath)(path);
  if (!app.vault.getAbstractFileByPath(p)) {
    try {
      await app.vault.createFolder(p);
    } catch {
    }
  }
}
function frontmatter(obj) {
  const clean = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === void 0 || Array.isArray(v) && v.length === 0 || v === "") continue;
    clean[k] = v;
  }
  return "---\n" + (0, import_obsidian3.stringifyYaml)(clean) + "---\n";
}
async function detailBody(app, base) {
  const f = app.vault.getAbstractFileByPath((0, import_obsidian3.normalizePath)("Tasks/Details/" + base + ".md"));
  if (!(f instanceof import_obsidian3.TFile)) return "";
  let txt = await app.vault.read(f);
  txt = txt.replace(/^---\n[\s\S]*?\n---\n?/, "");
  txt = txt.replace(/^#\s.*\n?/, "");
  return txt.trim();
}
async function runMigration(app, settings) {
  await ensureFolder2(app, settings.itemsFolder);
  await ensureFolder2(app, settings.projectsFolder);
  const lists = app.vault.getMarkdownFiles().filter((f) => f.path.startsWith("Tasks/Lists/") && f.path.indexOf("/", "Tasks/Lists/".length) === -1 && f.basename !== "+ New Project");
  const today = todayIso();
  let created = 0;
  for (const list of lists) {
    const projectName2 = list.basename;
    const projPath = (0, import_obsidian3.normalizePath)(settings.projectsFolder + "/" + slugify2(projectName2) + ".md");
    if (!app.vault.getAbstractFileByPath(projPath)) {
      await app.vault.create(projPath, frontmatter({ type: "project", id: newId2("p"), status: "active", icon: "folder" }) + "\n# " + projectName2 + "\n");
    }
    const lines = (await app.vault.read(list)).split("\n");
    for (const line of lines) {
      if (!/^\s*- \[.\]/.test(line)) continue;
      const p = parseLine(line);
      if (!p || !p.title) continue;
      let slug = slugify2(p.title);
      let dest = (0, import_obsidian3.normalizePath)(settings.itemsFolder + "/" + slug + ".md");
      let n = 2;
      while (app.vault.getAbstractFileByPath(dest)) {
        dest = (0, import_obsidian3.normalizePath)(settings.itemsFolder + "/" + slug + " " + n + ".md");
        n++;
        if (n > 50) break;
      }
      if (app.vault.getAbstractFileByPath(dest)) continue;
      const fm = frontmatter({
        type: "task",
        id: newId2("t"),
        status: p.status,
        priority: p.priority === "normal" ? void 0 : p.priority,
        due: p.due,
        scheduled: p.scheduled,
        project: "[[" + projectName2 + "]]",
        labels: p.labels,
        recurrence: p.recurrence,
        created: today,
        completed: p.completed,
        cancelled: p.cancelled
      });
      let body = "# " + p.title + "\n";
      if (p.detailsBase) {
        const db = await detailBody(app, p.detailsBase);
        if (db) body += "\n" + db + "\n";
      }
      await app.vault.create(dest, fm + "\n" + body);
      created++;
    }
  }
  return created;
}

// src/heuteView.ts
var import_obsidian20 = require("obsidian");

// src/datePicker.ts
var import_obsidian5 = require("obsidian");

// src/popover.ts
var import_obsidian4 = require("obsidian");
function liveAnchor(anchor) {
  if (anchor.isConnected) return anchor;
  const id = anchor.getAttribute("data-chip");
  if (!id) return null;
  const doc = anchor.ownerDocument;
  const hits = doc.querySelectorAll(`[data-chip="${CSS.escape(id)}"]`);
  return hits.length ? hits[hits.length - 1] : null;
}
function openPopover(anchorEl, build, onClose) {
  const doc = anchorEl.ownerDocument;
  const win = doc.defaultView ?? activeWindow;
  const anchor = liveAnchor(anchorEl) ?? anchorEl;
  const host = anchor.closest(".modal") ?? doc.body;
  const pop = host.createDiv({ cls: "bt-pop" });
  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    pop.remove();
    doc.removeEventListener("mousedown", onDoc, true);
    win.removeEventListener("resize", close);
    onClose?.();
  };
  const inModal = host !== doc.body;
  const onDoc = (e) => {
    const t2 = e.target;
    if (pop.contains(t2) || t2 === anchor || anchor.contains(t2)) return;
    const inOtherPop = t2.closest?.(".bt-pop");
    if (inOtherPop && inOtherPop !== pop) return;
    close();
    if (inModal && !host.contains(t2)) {
      e.stopPropagation();
      let swallow;
      const cleanup = () => doc.removeEventListener("click", swallow, true);
      swallow = (ev) => {
        ev.stopPropagation();
        ev.preventDefault();
        cleanup();
      };
      doc.addEventListener("click", swallow, true);
      win.setTimeout(cleanup, 300);
    }
  };
  build(pop, close);
  const ar = anchor.getBoundingClientRect();
  const r = ar.width || ar.height ? ar : host.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  const maxL = win.innerWidth - pw - 8, maxT = win.innerHeight - ph - 8;
  const clampL = (x) => Math.max(8, Math.min(x, maxL));
  const clampT = (y) => Math.max(8, Math.min(y, maxT));
  let left, top;
  if (r.bottom + 4 + ph <= win.innerHeight - 8) {
    left = clampL(r.left);
    top = r.bottom + 4;
  } else if (r.right + 4 + pw <= win.innerWidth - 8) {
    left = r.right + 4;
    top = clampT(r.top);
  } else if (r.left - 4 - pw >= 8) {
    left = r.left - 4 - pw;
    top = clampT(r.top);
  } else {
    left = clampL(r.left);
    top = Math.max(8, r.top - ph - 4);
  }
  pop.setCssStyles({ left: `${left}px`, top: `${top}px` });
  win.setTimeout(() => doc.addEventListener("mousedown", onDoc, true), 0);
  win.addEventListener("resize", close);
}
function popRow(pop, icon, label, onClick, active = false, iconColor) {
  const row = pop.createDiv({ cls: "bt-row" + (active ? " is-active" : "") });
  if (icon) {
    const ic = row.createSpan({ cls: "bt-row-ic" });
    (0, import_obsidian4.setIcon)(ic, icon);
    if (iconColor) ic.setCssStyles({ color: iconColor });
  }
  row.createSpan({ cls: "bt-row-lbl", text: label });
  row.onclick = () => onClick();
  return row;
}

// src/datePicker.ts
var z = (n) => String(n).padStart(2, "0");
var iso = (d) => d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate());
var todayISO = () => iso(/* @__PURE__ */ new Date());
var MONTHS = {
  jan: 1,
  feb: 2,
  "m\xE4r": 3,
  mar: 3,
  apr: 4,
  mai: 5,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  okt: 10,
  oct: 10,
  nov: 11,
  dez: 12,
  dec: 12
};
var WDMAP = {
  sonntag: 0,
  sunday: 0,
  montag: 1,
  monday: 1,
  dienstag: 2,
  tuesday: 2,
  mittwoch: 3,
  wednesday: 3,
  donnerstag: 4,
  thursday: 4,
  freitag: 5,
  friday: 5,
  samstag: 6,
  sonnabend: 6,
  saturday: 6
};
var weekdayShort = (dayIndex) => new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(2021, 7, 1 + dayIndex));
var monthYear = (d) => new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(d);
function parseDateInput(raw) {
  const s = (raw || "").trim().toLowerCase();
  if (!s) return "";
  if (s === "heute" || s === "today") return todayISO();
  if (s === "morgen" || s === "tomorrow") {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + 1);
    return iso(d);
  }
  if (s === "\xFCbermorgen") {
    const d = /* @__PURE__ */ new Date();
    d.setDate(d.getDate() + 2);
    return iso(d);
  }
  if (s in WDMAP) {
    const d = /* @__PURE__ */ new Date();
    const off = (WDMAP[s] - d.getDay() + 7) % 7 || 7;
    d.setDate(d.getDate() + off);
    return iso(d);
  }
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return isNaN(d.getTime()) ? "" : iso(d);
  }
  m = s.match(/^(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?$/);
  if (m) {
    let y = m[3] ? parseInt(m[3], 10) : (/* @__PURE__ */ new Date()).getFullYear();
    if (y < 100) y += 2e3;
    const d = new Date(y, +m[2] - 1, +m[1]);
    return isNaN(d.getTime()) ? "" : iso(d);
  }
  m = s.match(/^(\d{1,2})\.?\s*([a-zä]{3,})\.?\s*(\d{2,4})?$/);
  if (m && MONTHS[m[2].slice(0, 3)]) {
    let y = m[3] ? parseInt(m[3], 10) : (/* @__PURE__ */ new Date()).getFullYear();
    if (y < 100) y += 2e3;
    const d = new Date(y, MONTHS[m[2].slice(0, 3)] - 1, +m[1]);
    if (!isNaN(d.getTime())) return iso(d);
  }
  m = s.match(/^([a-zä]{3,})\.?\s*(\d{1,2})(?:\s*,?\s*(\d{2,4}))?$/);
  if (m && MONTHS[m[1].slice(0, 3)]) {
    let y = m[3] ? parseInt(m[3], 10) : (/* @__PURE__ */ new Date()).getFullYear();
    if (y < 100) y += 2e3;
    const d = new Date(y, MONTHS[m[1].slice(0, 3)] - 1, +m[2]);
    if (!isNaN(d.getTime())) return iso(d);
  }
  return "";
}
function parseTime(raw) {
  let s = (raw || "").trim().toLowerCase().replace(/\s+/g, "").replace("uhr", "");
  if (!s) return null;
  let ampm = "";
  const ap = s.match(/(am|pm)$/);
  if (ap) {
    ampm = ap[1];
    s = s.slice(0, -2);
  }
  let h, m = 0;
  const colon = s.match(/^(\d{1,2})[:.](\d{2})$/);
  if (colon) {
    h = +colon[1];
    m = +colon[2];
  } else if (/^\d{4}$/.test(s)) {
    h = +s.slice(0, 2);
    m = +s.slice(2);
  } else if (/^\d{3}$/.test(s)) {
    h = +s.slice(0, 1);
    m = +s.slice(1);
  } else if (/^\d{1,2}$/.test(s)) {
    h = +s;
    m = 0;
  } else return null;
  if (ampm === "pm" && h < 12) h += 12;
  if (ampm === "am" && h === 12) h = 0;
  if (h > 23 || m > 59) return null;
  return z(h) + ":" + z(m);
}
var DUR_OPTS = [null, 15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 480];
function parseDuration(raw) {
  const s = (raw || "").trim().toLowerCase().replace(",", ".");
  if (!s || s === "\u2014" || s === "-") return null;
  let m = s.match(/^(\d+):(\d{2})$/);
  if (m) return +m[1] * 60 + +m[2];
  m = s.match(/^(\d+(?:\.\d+)?)\s*h(?:ours?)?\s*(\d+)?\s*(?:m|min)?$/);
  if (m) return Math.round(parseFloat(m[1]) * 60 + (m[2] ? +m[2] : 0));
  m = s.match(/^(\d+)\s*(?:m|min|minutes?)?$/);
  if (m) return +m[1];
  return null;
}
function openDatePicker(anchor, value, onPick, dur, opts) {
  const live = (opts?.commit ?? "live") === "live";
  const requireTime = !!opts?.requireTime;
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-date");
    if (!live) pop.addClass("bt-date-confirm");
    let curDate = value ? dateOf(value) : live ? "" : todayISO();
    let curTime = value ? timeOf(value) : null;
    let curDur = dur ? dur.value : null;
    let timeOpen = !!curTime || requireTime;
    const apply = () => {
      if (live) onPick(curDate ? combineDT(curDate, curTime) : "");
      else renderFoot();
    };
    const canCommit = () => !!curDate && (!requireTime || !!curTime);
    const commit = () => {
      if (!canCommit()) return;
      onPick(combineDT(curDate, curTime));
      close();
    };
    const setDate = (d) => {
      curDate = d;
      if (!d) curTime = null;
      if (!live) {
        apply();
        renderTime();
        renderCal();
        return;
      }
      if (timeOpen && d) {
        apply();
        renderTime();
        renderCal();
      } else {
        apply();
        close();
      }
    };
    const input = pop.createEl("input", { type: "text", cls: "bt-date-input", attr: { placeholder: t("placeholder_date_input") } });
    if (value) input.value = formatDate(value);
    input.onkeydown = (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      const v = parseDateInput(input.value);
      if (v) setDate(v);
      else {
        input.addClass("is-invalid");
        window.setTimeout(() => input.removeClass("is-invalid"), 600);
      }
    };
    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
    const quick = pop.createDiv({ cls: "bt-date-quick" });
    const qrow = (icon, color, label, hint, val) => {
      const r = quick.createDiv({ cls: "bt-row bt-date-q" });
      const ic = r.createSpan({ cls: "bt-row-ic" });
      (0, import_obsidian5.setIcon)(ic, icon);
      if (color) ic.setCssStyles({ color });
      r.createSpan({ cls: "bt-row-lbl", text: label });
      if (hint) r.createSpan({ cls: "bt-date-hint", text: hint });
      r.onclick = () => setDate(val);
    };
    const tomorrow = /* @__PURE__ */ new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const satOff = (6 - (/* @__PURE__ */ new Date()).getDay() + 7) % 7;
    const sat = /* @__PURE__ */ new Date();
    sat.setDate(sat.getDate() + satOff);
    const monOff = (1 - (/* @__PURE__ */ new Date()).getDay() + 7) % 7 || 7;
    const mon = /* @__PURE__ */ new Date();
    mon.setDate(mon.getDate() + monOff);
    qrow("calendar", "#22c55e", t("date_today"), "", todayISO());
    qrow("sun", "#f59e0b", t("date_tomorrow"), weekdayShort(tomorrow.getDay()), iso(tomorrow));
    qrow("sofa", "#3b82f6", t("date_this_weekend"), weekdayShort(sat.getDay()), iso(sat));
    qrow("calendar-days", "#a78bfa", t("date_next_week"), weekdayShort(mon.getDay()), iso(mon));
    if (live) qrow("ban", "", t("date_no_date"), "", "");
    const cal = pop.createDiv({ cls: "bt-date-cal" });
    let view = curDate ? /* @__PURE__ */ new Date(curDate + "T00:00:00") : /* @__PURE__ */ new Date();
    view = new Date(view.getFullYear(), view.getMonth(), 1);
    function renderCal() {
      cal.empty();
      const head = cal.createDiv({ cls: "bt-cal-head" });
      const prev = head.createSpan({ cls: "bt-cal-nav" });
      (0, import_obsidian5.setIcon)(prev, "chevron-left");
      prev.onclick = (ev) => {
        ev.stopPropagation();
        view = new Date(view.getFullYear(), view.getMonth() - 1, 1);
        renderCal();
      };
      head.createSpan({ cls: "bt-cal-title", text: monthYear(view) });
      const next = head.createSpan({ cls: "bt-cal-nav" });
      (0, import_obsidian5.setIcon)(next, "chevron-right");
      next.onclick = (ev) => {
        ev.stopPropagation();
        view = new Date(view.getFullYear(), view.getMonth() + 1, 1);
        renderCal();
      };
      const grid = cal.createDiv({ cls: "bt-cal-grid" });
      for (const wd of [1, 2, 3, 4, 5, 6, 0]) grid.createDiv({ cls: "bt-cal-wd", text: weekdayShort(wd) });
      const startOff = (view.getDay() + 6) % 7;
      const start = new Date(view);
      start.setDate(view.getDate() - startOff);
      const tISO = todayISO();
      for (let i = 0; i < 42; i++) {
        const day = new Date(start);
        day.setDate(start.getDate() + i);
        const dISO = iso(day);
        const cell = grid.createDiv({ cls: "bt-cal-day", text: String(day.getDate()) });
        if (day.getMonth() !== view.getMonth()) cell.addClass("is-other");
        if (dISO === tISO) cell.addClass("is-today");
        if (curDate && dISO === curDate) cell.addClass("is-sel");
        cell.onclick = (ev) => {
          ev.stopPropagation();
          setDate(dISO);
        };
      }
    }
    renderCal();
    const timeWrap = pop.createDiv({ cls: "bt-time-wrap" });
    function renderTime() {
      timeWrap.empty();
      if (!timeOpen) {
        const btn = timeWrap.createDiv({ cls: "bt-time-toggle" });
        const ic = btn.createSpan({ cls: "bt-row-ic" });
        (0, import_obsidian5.setIcon)(ic, "clock");
        btn.createSpan({ cls: "bt-row-lbl", text: curTime ? curTime : t("time_add") });
        btn.onclick = () => {
          timeOpen = true;
          if (!curDate) curDate = todayISO();
          renderTime();
          renderCal();
        };
        return;
      }
      const row = timeWrap.createDiv({ cls: "bt-time-row" });
      row.createSpan({ cls: "bt-time-label", text: t("time_label") });
      const field = row.createDiv({ cls: "bt-time-field" });
      const ti = field.createEl("input", { type: "text", cls: "bt-time-input", attr: { placeholder: "09:00" } });
      ti.value = curTime ?? "";
      const drop = field.createDiv({ cls: "bt-time-drop" });
      const START = 8 * 60;
      const openDrop = (filter) => {
        drop.empty();
        const f = filter.trim();
        let selEl = null;
        for (let i = 0; i < 24 * 60; i += 15) {
          const mins = (START + i) % (24 * 60);
          const hhmm2 = z(Math.floor(mins / 60)) + ":" + z(mins % 60);
          if (f && !hhmm2.startsWith(f)) continue;
          const it = drop.createDiv({ cls: "bt-time-opt" + (hhmm2 === curTime ? " is-sel" : ""), text: hhmm2 });
          if (hhmm2 === curTime) selEl = it;
          it.onmousedown = (e) => {
            e.preventDefault();
            curTime = hhmm2;
            ti.value = hhmm2;
            apply();
            drop.removeClass("is-open");
          };
        }
        drop.addClass("is-open");
        if (selEl) drop.scrollTop = Math.max(0, selEl.offsetTop - 44);
      };
      ti.onfocus = () => {
        openDrop("");
        window.setTimeout(() => ti.select(), 0);
      };
      ti.onblur = () => window.setTimeout(() => drop.removeClass("is-open"), 150);
      ti.oninput = () => {
        openDrop(ti.value);
        const v = parseTime(ti.value);
        if (v) {
          curTime = v;
          apply();
        } else if (!ti.value.trim()) {
          curTime = null;
          apply();
        }
      };
      ti.onkeydown = (ev) => {
        if (ev.key === "Escape") {
          drop.removeClass("is-open");
        } else if (ev.key === "Enter") {
          ev.preventDefault();
          const v = parseTime(ti.value);
          if (v) {
            curTime = v;
            ti.value = v;
            apply();
          }
          drop.removeClass("is-open");
          if (!live) {
            commit();
            return;
          }
          ti.blur();
        }
      };
      const clear = row.createSpan({ cls: "bt-time-clear" });
      (0, import_obsidian5.setIcon)(clear, "x");
      clear.onmousedown = (e) => {
        e.preventDefault();
        curTime = null;
        ti.value = "";
        if (live || !requireTime) timeOpen = false;
        apply();
        renderTime();
      };
      if (dur) {
        const drow = timeWrap.createDiv({ cls: "bt-dur-row" });
        drow.createSpan({ cls: "bt-time-label", text: t("duration_label") });
        const dfield = drow.createDiv({ cls: "bt-time-field" });
        const di = dfield.createEl("input", { type: "text", cls: "bt-dur-input", attr: { placeholder: "\u2014" } });
        di.value = curDur ? formatDuration(curDur) : "";
        const ddrop = dfield.createDiv({ cls: "bt-time-drop" });
        const openDdrop = () => {
          ddrop.empty();
          let selEl = null;
          for (const d of DUR_OPTS) {
            const it = ddrop.createDiv({ cls: "bt-time-opt" + (curDur === d ? " is-sel" : ""), text: d ? formatDuration(d) : "\u2014" });
            if (curDur === d) selEl = it;
            it.onmousedown = (e) => {
              e.preventDefault();
              curDur = d;
              di.value = d ? formatDuration(d) : "";
              dur.onChange(d);
              ddrop.removeClass("is-open");
            };
          }
          ddrop.addClass("is-open");
          if (selEl) ddrop.scrollTop = Math.max(0, selEl.offsetTop - 44);
        };
        di.onfocus = () => {
          openDdrop();
          window.setTimeout(() => di.select(), 0);
        };
        di.onblur = () => {
          window.setTimeout(() => ddrop.removeClass("is-open"), 150);
          di.value = curDur ? formatDuration(curDur) : "";
        };
        di.oninput = () => {
          curDur = parseDuration(di.value);
          dur.onChange(curDur);
        };
        di.onkeydown = (ev) => {
          if (ev.key === "Escape") ddrop.removeClass("is-open");
          else if (ev.key === "Enter") {
            ev.preventDefault();
            ddrop.removeClass("is-open");
            di.blur();
          }
        };
      }
    }
    renderTime();
    const foot = pop.createDiv({ cls: "bt-date-foot" });
    function renderFoot() {
      if (live) return;
      foot.empty();
      const btn = foot.createEl("button", { cls: "bt-date-commit mod-cta", text: opts?.confirmLabel ?? t("date_confirm") });
      btn.disabled = !canCommit();
      btn.onclick = (ev) => {
        ev.stopPropagation();
        commit();
      };
    }
    renderFoot();
  });
}

// src/filterService.ts
var import_obsidian7 = require("obsidian");

// src/filterEngine.ts
var DEFAULT_CRITERIA = {
  range: "any",
  priorities: [],
  prioritiesNot: [],
  labels: [],
  labelsAll: [],
  labelsNot: [],
  projects: [],
  projectsNot: [],
  search: ""
};
var DEFAULT_OPTIONS = { layout: "list", sort: "smart", group: "none", showDone: false, sortDir: "asc", calMode: "month", calPanel: true };
var RANGES = ["any", "overdue", "today", "next7", "nodate"];
var SORTS = ["smart", "due", "deadline", "priority", "created", "title"];
var GROUPS = ["none", "date", "deadline", "priority", "label", "project"];
var SORT_DIRS = ["asc", "desc"];
var hasSortDir = (sort) => sort !== "smart";
var LAYOUTS = ["list", "board", "calendar"];
var FILTER_PRIORITIES = ["highest", "high", "medium", "normal"];
var baseName2 = (p) => p.split("/").pop().replace(/\.md$/, "");
var PRIO_RANK = { highest: 0, high: 1, medium: 2, normal: 3, low: 4, lowest: 5 };
function addDays(iso4, n) {
  const d = /* @__PURE__ */ new Date(iso4 + "T00:00:00");
  d.setDate(d.getDate() + n);
  const z6 = (x) => String(x).padStart(2, "0");
  return d.getFullYear() + "-" + z6(d.getMonth() + 1) + "-" + z6(d.getDate());
}
function activeFacetCount(c) {
  let n = 0;
  if (c.range !== "any") n++;
  if (c.priorities.length || c.prioritiesNot.length) n++;
  if (c.labels.length || c.labelsAll.length || c.labelsNot.length) n++;
  if (c.projects.length || c.projectsNot.length) n++;
  if (c.search.trim()) n++;
  return n;
}
function inRange(t2, range, today) {
  if (range === "any") return true;
  if (range === "nodate") return !t2.due;
  if (!t2.due) return false;
  if (range === "overdue") return t2.due < today;
  if (range === "today") return t2.due <= today;
  if (range === "next7") return t2.due >= today && t2.due <= addDays(today, 7);
  return true;
}
function matchesTask(t2, c, today) {
  if (!inRange(t2, c.range, today)) return false;
  if (c.priorities.length && !c.priorities.includes(t2.priority)) return false;
  if (c.prioritiesNot.includes(t2.priority)) return false;
  if (c.labels.length && !c.labels.some((l) => t2.labels.includes(l))) return false;
  if (!c.labelsAll.every((l) => t2.labels.includes(l))) return false;
  if (c.labelsNot.some((l) => t2.labels.includes(l))) return false;
  const inbox = isInboxLink(t2.project);
  const pb = inbox ? null : baseName2(t2.project);
  const inList = (list) => inbox ? list.some(isInboxName) : pb !== null && list.includes(pb);
  if (c.projects.length && !inList(c.projects)) return false;
  if (inList(c.projectsNot)) return false;
  const q = c.search.trim().toLowerCase();
  if (q && !t2.title.toLowerCase().includes(q)) return false;
  return true;
}
function sortTasks(list, sort, dir = "asc") {
  const arr = [...list];
  const s = dir === "desc" ? -1 : 1;
  const key = (date, time) => date && date + "T" + (time ?? "99:99");
  const byDate = (a, b) => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return s * a.localeCompare(b);
  };
  const byDue2 = (a, b) => byDate(key(a.due, a.dueTime), key(b.due, b.dueTime));
  const byPrio = (a, b) => s * (PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
  const byTitle = (a, b) => a.title.localeCompare(b.title);
  if (sort === "due") return arr.sort((a, b) => byDue2(a, b) || byTitle(a, b));
  if (sort === "deadline") return arr.sort((a, b) => byDate(key(a.scheduled, a.scheduledTime), key(b.scheduled, b.scheduledTime)) || byPrio(a, b));
  if (sort === "priority") return arr.sort((a, b) => byPrio(a, b) || byDue2(a, b));
  if (sort === "created") return arr.sort((a, b) => s * (a.created ?? "").localeCompare(b.created ?? ""));
  if (sort === "title") return arr.sort((a, b) => s * byTitle(a, b));
  const dueAsc = (a, b) => {
    const ka = key(a.due, a.dueTime), kb = key(b.due, b.dueTime);
    if (!ka && !kb) return 0;
    if (!ka) return 1;
    if (!kb) return -1;
    return ka.localeCompare(kb);
  };
  return arr.sort((a, b) => dueAsc(a, b) || PRIO_RANK[a.priority] - PRIO_RANK[b.priority]);
}
function applyFilter(idx, c, opts, today) {
  const base = opts.showDone ? [...idx.open(), ...idx.done()] : idx.open();
  return sortTasks(base.filter((t2) => matchesTask(t2, c, today)), opts.sort, opts.sortDir);
}

// src/pageOptions.ts
var import_obsidian6 = require("obsidian");

// src/calendarModel.ts
var CAL_MODES = ["year", "month", "week", "day"];
var z2 = (n) => String(n).padStart(2, "0");
var iso2 = (d) => d.getFullYear() + "-" + z2(d.getMonth() + 1) + "-" + z2(d.getDate());
var parseISO = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
function addDays2(isoDate2, n) {
  const d = parseISO(isoDate2);
  d.setDate(d.getDate() + n);
  return iso2(d);
}
function addMonths(isoDate2, n) {
  const d = parseISO(isoDate2);
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + n);
  const last = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, last));
  return iso2(d);
}
function startOfWeek(isoDate2) {
  const d = parseISO(isoDate2);
  d.setDate(d.getDate() - (d.getDay() + 6) % 7);
  return iso2(d);
}
var sameMonth = (a, b) => a.slice(0, 7) === b.slice(0, 7);
function monthGrid(anchor) {
  const first = anchor.slice(0, 8) + "01";
  const start = startOfWeek(first);
  return Array.from({ length: 42 }, (_, i) => addDays2(start, i));
}
function yearMonths(anchor) {
  const y = anchor.slice(0, 4);
  return Array.from({ length: 12 }, (_, i) => `${y}-${z2(i + 1)}-01`);
}
function addYears(isoDate2, n) {
  return addMonths(isoDate2, n * 12);
}
function weekDays(anchor) {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => addDays2(start, i));
}
function bucketByDue(tasks) {
  const out = /* @__PURE__ */ new Map();
  for (const tk of tasks) {
    if (!tk.due) continue;
    const key = dateOf(tk.due);
    const arr = out.get(key);
    if (arr) arr.push(tk);
    else out.set(key, [tk]);
  }
  return out;
}
function minutesOf(task) {
  const tm = task.dueTime ?? (task.due ? timeOf(task.due) : null);
  if (!tm) return null;
  const m = tm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const min = +m[1] * 60 + +m[2];
  return min >= 0 && min < 1440 ? min : null;
}
var DEFAULT_BLOCK_MIN = 30;
function layoutDay(tasks) {
  const blocks = [];
  for (const task of tasks) {
    const startMin = minutesOf(task);
    if (startMin === null) continue;
    const dur = task.duration && task.duration > 0 ? task.duration : DEFAULT_BLOCK_MIN;
    blocks.push({ task, startMin, endMin: Math.min(startMin + dur, 1440), col: 0, cols: 1 });
  }
  blocks.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin || a.task.title.localeCompare(b.task.title));
  let cluster = [];
  let clusterEnd = -1;
  const flush = () => {
    if (!cluster.length) return;
    const cols = Math.max(...cluster.map((b) => b.col)) + 1;
    for (const b of cluster) b.cols = cols;
    cluster = [];
  };
  const colEnds = [];
  for (const b of blocks) {
    if (b.startMin >= clusterEnd) {
      flush();
      colEnds.length = 0;
    }
    let c = colEnds.findIndex((end) => end <= b.startMin);
    if (c === -1) {
      c = colEnds.length;
      colEnds.push(b.endMin);
    } else {
      colEnds[c] = b.endMin;
    }
    b.col = c;
    cluster.push(b);
    clusterEnd = Math.max(clusterEnd, b.endMin);
  }
  flush();
  return blocks;
}
var allDayOf = (tasks) => tasks.filter((tk) => minutesOf(tk) === null);
function chipsThatFit(availPx, m) {
  const row = m.chip + m.gap;
  return {
    all: Math.max(1, Math.floor((availPx + m.gap) / row)),
    some: Math.max(1, Math.floor((availPx - m.more) / row))
  };
}
var shownChips = (count, fit) => count <= fit.all ? count : fit.some;

// src/pageOptions.ts
var oneOf = (v, allowed, fallback) => typeof v === "string" && allowed.includes(v) ? v : fallback;
function readViewOptions(fm) {
  const o = fm ?? {};
  return {
    layout: oneOf(o.layout, LAYOUTS, DEFAULT_OPTIONS.layout),
    sort: oneOf(o.sort, SORTS, DEFAULT_OPTIONS.sort),
    group: oneOf(o.group, GROUPS, DEFAULT_OPTIONS.group),
    showDone: o.showDone === true,
    sortDir: oneOf(o.sortDir, SORT_DIRS, DEFAULT_OPTIONS.sortDir),
    calMode: oneOf(o.calMode, CAL_MODES, DEFAULT_OPTIONS.calMode),
    calPanel: o.calPanel !== false
    // Default: offen
  };
}
function writeViewOptions(fm, o) {
  const setOrDel = (k, v, def) => {
    if (v === def) delete fm[k];
    else fm[k] = v;
  };
  setOrDel("layout", o.layout, DEFAULT_OPTIONS.layout);
  setOrDel("sort", o.sort, DEFAULT_OPTIONS.sort);
  setOrDel("group", o.group, DEFAULT_OPTIONS.group);
  setOrDel("showDone", o.showDone, false);
  setOrDel("sortDir", o.sortDir, DEFAULT_OPTIONS.sortDir);
  setOrDel("calMode", o.calMode, DEFAULT_OPTIONS.calMode);
  setOrDel("calPanel", o.calPanel, DEFAULT_OPTIONS.calPanel);
}
function readNoteViewOptions(app, path) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian6.TFile)) return { ...DEFAULT_OPTIONS };
  return readViewOptions(app.metadataCache.getFileCache(f)?.frontmatter);
}
async function setNoteViewOption(app, path, patch) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian6.TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm) => {
    writeViewOptions(fm, { ...readViewOptions(fm), ...patch });
  });
}

// src/filterService.ts
var asStrArr = (v) => Array.isArray(v) ? v.map(String) : [];
var oneOf2 = (v, allowed, fallback) => typeof v === "string" && allowed.includes(v) ? v : fallback;
function readCriteria(fm) {
  const prio = (v) => asStrArr(v).filter((p) => FILTER_PRIORITIES.includes(p));
  return {
    range: oneOf2(fm.range, RANGES, DEFAULT_CRITERIA.range),
    priorities: prio(fm.priorities),
    prioritiesNot: prio(fm.priorities_not),
    labels: asStrArr(fm.labels),
    labelsAll: asStrArr(fm.labels_all),
    labelsNot: asStrArr(fm.labels_not),
    projects: asStrArr(fm.projects),
    projectsNot: asStrArr(fm.projects_not),
    search: typeof fm.search === "string" ? fm.search : ""
  };
}
function readOptions(fm) {
  return readViewOptions(fm);
}
function toItem(f, fm) {
  return {
    name: f.basename,
    path: f.path,
    icon: "tag",
    // fest (noch kein Icon-Picker) – gilt auch für Alt-Filter mit gespeichertem icon
    color: typeof fm.color === "string" ? fm.color : null,
    hidden: !!fm.nav_hidden,
    criteria: readCriteria(fm),
    options: readOptions(fm)
  };
}
function listFilters(app) {
  return app.vault.getMarkdownFiles().flatMap((f) => {
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    return fm?.type === "filter" ? [toItem(f, fm)] : [];
  }).sort((a, b) => a.name.localeCompare(b.name, "de"));
}
function readFilter(app, path) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian7.TFile)) return null;
  const fm = app.metadataCache.getFileCache(f)?.frontmatter;
  return fm?.type === "filter" ? toItem(f, fm) : null;
}
function applyToFrontmatter(fm, c, o, color) {
  const setOrDel = (k, v) => {
    if (v == null) delete fm[k];
    else fm[k] = v;
  };
  setOrDel("range", c.range === "any" ? null : c.range);
  setOrDel("priorities", c.priorities.length ? c.priorities : null);
  setOrDel("priorities_not", c.prioritiesNot.length ? c.prioritiesNot : null);
  setOrDel("labels", c.labels.length ? c.labels : null);
  setOrDel("labels_all", c.labelsAll.length ? c.labelsAll : null);
  setOrDel("labels_not", c.labelsNot.length ? c.labelsNot : null);
  setOrDel("projects", c.projects.length ? c.projects : null);
  setOrDel("projects_not", c.projectsNot.length ? c.projectsNot : null);
  setOrDel("search", c.search.trim() || null);
  writeViewOptions(fm, o);
  setOrDel("color", color);
}
async function createFilterNote(app, settings, name, criteria, options, color = null, hidden = false) {
  const folder = settings.filtersFolder;
  await ensureFolder(app, folder);
  const base = slugify(name);
  let dest = (0, import_obsidian7.normalizePath)(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = (0, import_obsidian7.normalizePath)(folder + "/" + base + " " + n + ".md");
    n++;
    if (n > 200) break;
  }
  const fm = { type: "filter", id: newId("f"), created: todayIso() };
  if (hidden) fm.nav_hidden = true;
  applyToFrontmatter(fm, criteria, options, color);
  await app.vault.create(dest, buildFrontmatter(fm) + "\n# " + name + "\n");
  return base;
}
async function updateFilterNote(app, path, criteria, options, color) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian7.TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm) => applyToFrontmatter(fm, criteria, options, color));
}
async function renameFilterNote(app, path, newName) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian7.TFile)) return null;
  const base = slugify(newName);
  const folder = f.parent?.path ?? "";
  let dest = (0, import_obsidian7.normalizePath)((folder ? folder + "/" : "") + base + ".md");
  if (dest !== path && app.vault.getAbstractFileByPath(dest)) return null;
  await app.fileManager.renameFile(f, dest);
  const nf = app.vault.getAbstractFileByPath(dest);
  if (nf instanceof import_obsidian7.TFile) {
    const body = await app.vault.read(nf);
    const replaced = body.replace(/^# .*$/m, "# " + newName);
    if (replaced !== body) await app.vault.modify(nf, replaced);
  }
  return base;
}
async function setFilterColor(app, path, color) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian7.TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm) => {
    if (color) fm.color = color;
    else delete fm.color;
  });
}
async function setFilterNavHidden(app, path, hidden) {
  const f = app.vault.getAbstractFileByPath(path);
  if (!(f instanceof import_obsidian7.TFile)) return;
  await app.fileManager.processFrontMatter(f, (fm) => {
    if (hidden) fm.nav_hidden = true;
    else delete fm.nav_hidden;
  });
}
async function deleteFilterNote(app, path) {
  const f = app.vault.getAbstractFileByPath(path);
  if (f instanceof import_obsidian7.TFile) await app.fileManager.trashFile(f);
}

// src/filterModal.ts
var import_obsidian14 = require("obsidian");

// src/taskModal.ts
var import_obsidian11 = require("obsidian");

// src/quickEntry.ts
var z3 = (n) => String(n).padStart(2, "0");
var iso3 = (d) => d.getFullYear() + "-" + z3(d.getMonth() + 1) + "-" + z3(d.getDate());
var addDays3 = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
var nextWeekday = (from, target) => {
  let off = (target - from.getDay() + 7) % 7;
  if (off === 0) off = 7;
  return addDays3(from, off);
};
var WD = {
  sonntag: 0,
  montag: 1,
  dienstag: 2,
  mittwoch: 3,
  donnerstag: 4,
  freitag: 5,
  samstag: 6,
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6
};
var WDNAMES = "montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday";
var MONTHS2 = {
  januar: 0,
  j\u00E4nner: 0,
  january: 0,
  jan: 0,
  februar: 1,
  february: 1,
  feb: 1,
  m\u00E4rz: 2,
  maerz: 2,
  march: 2,
  m\u00E4r: 2,
  mar: 2,
  april: 3,
  apr: 3,
  mai: 4,
  may: 4,
  juni: 5,
  june: 5,
  jun: 5,
  juli: 6,
  july: 6,
  jul: 6,
  august: 7,
  aug: 7,
  september: 8,
  sept: 8,
  sep: 8,
  oktober: 9,
  october: 9,
  okt: 9,
  oct: 9,
  november: 10,
  nov: 10,
  dezember: 11,
  december: 11,
  dez: 11,
  dec: 11
};
var MONTHNAMES = Object.keys(MONTHS2).sort((a, b) => b.length - a.length).join("|");
var L = "[A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF]";
var re = (body) => new RegExp("(?:^|[^A-Za-z\xC4\xD6\xDC\xE4\xF6\xFC\xDF])" + body + "(?!" + L + ")", "i");
function parseQuickEntry(raw, projects = []) {
  let text = " " + (raw || "") + " ";
  const tags = [];
  const tagRe = /(?:^|\s)#([\p{L}\p{N}_/-]+)/gu;
  for (const m of text.matchAll(tagRe)) tags.push(m[1]);
  text = text.replace(tagRe, " ");
  let project = null;
  const known = projects.filter(Boolean);
  if (known.length) {
    const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const alt = [...known].sort((a, b) => b.length - a.length).map(esc).join("|");
    const m = text.match(new RegExp("(?:^|\\s)@(" + alt + ")(?![\\p{L}\\p{N}_])", "iu"));
    if (m) {
      project = known.find((p) => p.toLowerCase() === m[1].toLowerCase()) ?? m[1];
      text = text.replace(m[0], " ");
    }
  }
  const today = /* @__PURE__ */ new Date();
  let faellig = "";
  const grab = (rx, fn) => {
    if (faellig) return;
    const m = text.match(rx);
    if (!m) return;
    const d = fn(m);
    if (d && !isNaN(d.getTime())) {
      faellig = iso3(d);
      text = text.replace(m[0], " ");
    }
  };
  grab(re("heute|today"), () => today);
  grab(re("\xFCbermorgen|day\\s+after\\s+tomorrow"), () => addDays3(today, 2));
  grab(re("morgen|tomorrow"), () => addDays3(today, 1));
  grab(re("in\\s+(\\d+)\\s+(?:tagen|days?)"), (m) => addDays3(today, parseInt(m[1], 10)));
  grab(re("(?:n\xE4chste[nr]?\\s+woche|next\\s+week)"), () => nextWeekday(today, 1));
  grab(
    re("(?:am|n\xE4chste[nr]?|diesen|kommende[nr]?|on|next|this|coming)\\s+(" + WDNAMES + ")"),
    (m) => nextWeekday(today, WD[m[1].toLowerCase()])
  );
  grab(re("(" + WDNAMES + ")"), (m) => nextWeekday(today, WD[m[1].toLowerCase()]));
  const monthDate = (mo, day, year) => {
    const y = year ? parseInt(year, 10) : today.getFullYear();
    const d = new Date(y, mo, day);
    return d.getMonth() === mo ? d : null;
  };
  grab(
    re("(?:am\\s+|on\\s+)?(\\d{1,2})(?:\\.\\s*|\\s+)(" + MONTHNAMES + ")(?:\\s+(\\d{4}))?"),
    (m) => monthDate(MONTHS2[m[2].toLowerCase()], parseInt(m[1], 10), m[3])
  );
  grab(
    re("(?:on\\s+)?(" + MONTHNAMES + ")\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+(\\d{4}))?"),
    (m) => monthDate(MONTHS2[m[1].toLowerCase()], parseInt(m[2], 10), m[3])
  );
  grab(/\b(?:am\s+)?(\d{1,2})\.(\d{1,2})\.?(\d{2,4})?(?![\dA-Za-zÄÖÜäöüß])/i, (m) => {
    let y = m[3] ? parseInt(m[3], 10) : today.getFullYear();
    if (y < 100) y += 2e3;
    const d = new Date(y, +m[2] - 1, +m[1]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  });
  grab(/\b(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/, (m) => {
    let y = m[3] ? parseInt(m[3], 10) : today.getFullYear();
    if (y < 100) y += 2e3;
    const d = new Date(y, +m[1] - 1, +m[2]);
    return d.getMonth() === +m[1] - 1 ? d : null;
  });
  grab(/\b(\d{4})-(\d{1,2})-(\d{1,2})\b/, (m) => {
    const d = new Date(+m[1], +m[2] - 1, +m[3]);
    return d.getMonth() === +m[2] - 1 ? d : null;
  });
  let time = "";
  const hm = (h, mi) => h >= 0 && h < 24 && mi >= 0 && mi < 60 ? z3(h) + ":" + z3(mi) : null;
  const grabTime = (rx, fn) => {
    if (time) return;
    const m = text.match(rx);
    if (!m) return;
    const t2 = fn(m);
    if (t2) {
      time = t2;
      text = text.replace(m[0], " ");
    }
  };
  grabTime(/(?:^|\s)(?:um|at|@)\s*(\d{1,2}):(\d{2})(?:\s*uhr)?(?!\d)/i, (m) => hm(+m[1], +m[2]));
  grabTime(/(?:^|\s)(\d{1,2})(?::(\d{2}))?\s*(am|pm)(?![a-z])/i, (m) => {
    let h = +m[1] % 12;
    if (m[3].toLowerCase() === "pm") h += 12;
    return hm(h, m[2] ? +m[2] : 0);
  });
  grabTime(/(?:^|\s)(\d{1,2}):(\d{2})(?!\d)/, (m) => hm(+m[1], +m[2]));
  grabTime(/(?:^|\s)(?:um|at)\s*(\d{1,2})(?:\s*uhr)?(?![\d:])/i, (m) => hm(+m[1], 0));
  grabTime(/(?:^|\s)(\d{1,2})\s*uhr(?!\d)/i, (m) => hm(+m[1], 0));
  let priority = null;
  const pm = text.match(/(?:^|\s)[p!]([1-4])(?![\wäöüßÄÖÜ])/i);
  if (pm) {
    priority = ["highest", "high", "medium", "normal"][+pm[1] - 1];
    text = text.replace(pm[0], " ");
  }
  return { title: text.replace(/\s{2,}/g, " ").trim(), faellig, time, tags: [...new Set(tags)], priority, project };
}

// src/detailLog.ts
function parseDetailLog(body, fallbackTs = "") {
  const src = String(body || "");
  const entries = [];
  let cur = null;
  for (const line of src.split("\n")) {
    const head = line.match(/^>\s*\[!log\][-+]?\s*(.*?)\s*$/i);
    if (head) {
      if (cur) entries.push(cur);
      cur = { ts: (head[1] || "").trim(), body: [] };
    } else if (cur && /^>/.test(line)) {
      cur.body.push(line.replace(/^>\s?/, ""));
    } else if (cur) {
      entries.push(cur);
      cur = null;
    }
  }
  if (cur) entries.push(cur);
  const out = entries.map((e) => ({ ts: e.ts, body: e.body.join("\n").replace(/^\n+|\n+$/g, "") }));
  if (out.length === 0) {
    const tt = src.replace(/\n{3,}/g, "\n\n").trim();
    return tt ? [{ ts: (fallbackTs || "").trim(), body: tt, legacy: true }] : [];
  }
  return out.filter((e) => (e.body || "").trim() !== "");
}
function serializeDetailLog(entries) {
  return (entries || []).filter((e) => (e.body || "").trim() !== "").map((e) => {
    const ts = (e.ts || "").trim();
    const body = String(e.body || "").split("\n").map((l) => "> " + l).join("\n");
    return "> [!log]" + (ts ? " " + ts : "") + "\n" + body;
  }).join("\n\n");
}
function nowLogTs(d) {
  d = d || /* @__PURE__ */ new Date();
  const z6 = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z6(d.getMonth() + 1) + "-" + z6(d.getDate()) + " " + z6(d.getHours()) + ":" + z6(d.getMinutes()) + ":" + z6(d.getSeconds());
}
function formatLogTime(ts, now) {
  const m = String(ts || "").match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  if (!m) return (ts || "").trim();
  const de = getLocale() !== "en";
  const base = now || /* @__PURE__ */ new Date();
  const today = new Date(base.getFullYear(), base.getMonth(), base.getDate());
  const day = new Date(+m[1], +m[2] - 1, +m[3]);
  const diff = Math.round((day.getTime() - today.getTime()) / 864e5);
  const hm = m[4] + ":" + m[5];
  const mon = de ? ["Jan", "Feb", "M\xE4r", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"] : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let datePart;
  if (diff === 0) datePart = de ? "Heute" : "Today";
  else if (diff === -1) datePart = de ? "Gestern" : "Yesterday";
  else if (diff === 1) datePart = de ? "Morgen" : "Tomorrow";
  else {
    const d = +m[3], moo = mon[+m[2] - 1];
    datePart = de ? d + ". " + moo : moo + " " + d;
    if (+m[1] !== today.getFullYear()) datePart += " " + m[1];
  }
  return datePart + " \xB7 " + hm;
}
var LOG_HEADING = "###### BeautyTasks Details-Logbuch";
var isLogHead = (l) => /^#{1,6}\s+BeautyTasks Details-Logbuch\s*$/.test(l);
function splitContent(content) {
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)/);
  const fm = fmMatch ? fmMatch[1] : "";
  const body = content.slice(fm.length);
  const lines = body.split("\n");
  const idx = lines.findIndex((l) => /^#\s+/.test(l));
  const title = idx === -1 ? "" : lines[idx];
  const rest = idx === -1 ? lines : lines.slice(idx + 1);
  const li = rest.findIndex((l) => isLogHead(l) || /^>\s*\[!log\]/i.test(l));
  const trim = (s) => s.replace(/^\n+|\n+$/g, "");
  const description = trim((li === -1 ? rest : rest.slice(0, li)).join("\n"));
  let logLines = li === -1 ? [] : rest.slice(li);
  if (logLines.length && isLogHead(logLines[0])) logLines = logLines.slice(1);
  const log = trim(logLines.join("\n"));
  return { fm, title, description, log };
}
function composeContent(fm, title, description, log) {
  let out = fm + "\n" + title + "\n";
  const desc = description.replace(/^\n+|\n+$/g, "");
  if (desc) out += "\n" + desc + "\n";
  if (log) out += "\n" + LOG_HEADING + "\n\n" + log + "\n";
  return out;
}
async function readLog(app, file) {
  const content = await app.vault.cachedRead(file);
  const { log } = splitContent(content);
  return parseDetailLog(log, nowLogTs(new Date(file.stat.mtime)));
}
function rebuildWithLog(content, entries) {
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)/);
  const fm = fmMatch ? fmMatch[1] : "";
  const body = content.slice(fm.length);
  const lines = body.split("\n");
  const li = lines.findIndex((l) => isLogHead(l) || /^>\s*\[!log\]/i.test(l));
  const logMd = serializeDetailLog(entries);
  if (li === -1) {
    const before2 = body.replace(/\n+$/, "");
    return fm + before2 + (logMd ? "\n\n" + LOG_HEADING + "\n\n" + logMd + "\n" : "\n");
  }
  let lastLog = li;
  for (let i = li; i < lines.length; i++) if (isLogHead(lines[i]) || /^>/.test(lines[i])) lastLog = i;
  const before = lines.slice(0, li).join("\n").replace(/\n+$/, "");
  const after = lines.slice(lastLog + 1).join("\n").replace(/^\n+|\n+$/g, "");
  let out = fm + before + (logMd ? "\n\n" + LOG_HEADING + "\n\n" + logMd + "\n" : "\n");
  if (after) out += "\n" + after + "\n";
  return out;
}
async function writeLog(app, file, entries) {
  await app.vault.process(file, (content) => rebuildWithLog(content, entries));
}
async function writeDescription(app, file, description) {
  await app.vault.process(file, (content) => {
    const { fm, title, log } = splitContent(content);
    const head = title || "# " + file.basename;
    return composeContent(fm, head, description, log);
  });
}
function isDocumentBody(s) {
  const t2 = (s || "").trim();
  if (!t2) return false;
  return /!\[/.test(t2) || /^\s{0,3}#{1,6}\s/m.test(t2) || t2.length > 300 || (t2.match(/\n\s*\n/g)?.length ?? 0) >= 2;
}
async function ensureNoteLinkLog(app, file, label) {
  const content = await app.vault.cachedRead(file);
  const link = "[[" + file.basename + "]]";
  if (content.includes(link)) return false;
  const { log } = splitContent(content);
  const entries = parseDetailLog(log, nowLogTs(new Date(file.stat.mtime)));
  entries.push({ ts: nowLogTs(), body: label + " " + link });
  await writeLog(app, file, entries);
  return true;
}

// src/detailLogView.ts
var import_obsidian8 = require("obsidian");
var DetailLogView = class {
  constructor(app, plugin, host) {
    this.app = app;
    this.plugin = plugin;
    this.host = host;
    this.entries = [];
    this.comp = null;
    this.input = null;
    this.chain = Promise.resolve();
  }
  mount(wrap) {
    this.wrap = wrap;
    this.render();
  }
  setEntries(entries) {
    this.entries = entries;
  }
  hasEntries() {
    return this.entries.length > 0;
  }
  focusComposer() {
    this.input?.focus();
  }
  unload() {
    this.comp?.unload();
  }
  /** Beim Anlegen einer neuen Aufgabe: gepufferte Einträge in die frische Datei schreiben. */
  async flush(file) {
    if (this.entries.length) await writeLog(this.app, file, this.entries);
  }
  /** Timeline der Einträge (Zeitstempel + Markdown + Bearbeiten/Löschen) + Composer. */
  render() {
    const wrap = this.wrap;
    wrap.empty();
    this.comp?.unload();
    this.comp = new import_obsidian8.Component();
    this.comp.load();
    const src = this.host.srcPath();
    const list = wrap.createDiv({ cls: "bt-log-list" });
    list.addEventListener("click", (e) => {
      if (!(e.target instanceof HTMLElement)) return;
      const img = e.target.closest(".bt-log-content img");
      if (img instanceof HTMLImageElement) {
        e.preventDefault();
        const imgs = Array.from(list.querySelectorAll(".bt-log-content img"));
        this.openLightbox(imgs, imgs.indexOf(img));
        return;
      }
      const link = e.target.closest("a.internal-link");
      if (link) {
        const href = link.getAttribute("data-href") || link.getAttribute("href");
        if (href) {
          e.preventDefault();
          void this.app.workspace.openLinkText(href, src, true);
          this.host.close();
        }
      }
    });
    this.entries.forEach((entry, idx) => {
      const row = list.createDiv({ cls: "bt-log-entry" });
      const head = row.createDiv({ cls: "bt-log-head" });
      head.createDiv({ cls: "bt-log-ts", text: formatLogTime(entry.ts) || "\u2014" });
      const content = row.createDiv({ cls: "bt-log-content" });
      this.renderEntry(content, entry, src);
      const acts = head.createDiv({ cls: "bt-log-actions" });
      const ed = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("log_edit") } });
      (0, import_obsidian8.setIcon)(ed.createSpan(), "pencil");
      ed.onclick = () => this.editEntry(idx, content);
      const del = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("btn_delete") } });
      (0, import_obsidian8.setIcon)(del.createSpan(), "trash-2");
      del.onclick = () => {
        this.entries.splice(idx, 1);
        this.render();
        void this.persistLog();
      };
    });
    const comp = wrap.createDiv({ cls: "bt-log-composer" });
    const inp = comp.createEl("textarea", { cls: "bt-log-input", attr: { placeholder: t("log_placeholder"), rows: "1" } });
    this.input = inp;
    const grow = () => {
      inp.setCssStyles({ height: "auto" });
      inp.setCssStyles({ height: Math.min(inp.scrollHeight, 220) + "px" });
    };
    inp.oninput = grow;
    inp.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.addEntry();
      }
    };
    inp.onpaste = (ev) => {
      const f = ev.clipboardData?.files;
      if (f && f.length) {
        ev.preventDefault();
        void this.handleFiles(f);
      }
    };
    inp.ondragover = (ev) => {
      ev.preventDefault();
      inp.addClass("bt-drop");
    };
    inp.ondragleave = () => inp.removeClass("bt-drop");
    inp.ondrop = (ev) => {
      const f = ev.dataTransfer?.files;
      if (f && f.length) {
        ev.preventDefault();
        ev.stopPropagation();
        inp.removeClass("bt-drop");
        void this.handleFiles(f);
      }
    };
    const cActs = comp.createDiv({ cls: "bt-log-composer-actions" });
    const attach = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_attach") } });
    (0, import_obsidian8.setIcon)(attach.createSpan(), "paperclip");
    attach.onclick = () => this.pickAttachment();
    const linkBtn = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_link") } });
    (0, import_obsidian8.setIcon)(linkBtn.createSpan(), "link");
    linkBtn.onclick = () => this.pickNote();
    const add = cActs.createEl("button", { cls: "bt-log-add", attr: { "aria-label": t("log_add") } });
    (0, import_obsidian8.setIcon)(add.createSpan(), "send-horizontal");
    add.onclick = () => this.addEntry();
    window.setTimeout(() => {
      list.scrollTop = list.scrollHeight;
    }, 0);
  }
  renderEntry(el, entry, src) {
    el.empty();
    void Promise.resolve(import_obsidian8.MarkdownRenderer.render(this.app, entry.body || "", el, src, this.comp)).catch((e) => console.error("bt-log render", e));
  }
  /** Bild-Lightbox über dem Modal: navigiert über alle Kommentar-Bilder (Pfeiltasten/
   *  Buttons), Esc oder Klick auf den Hintergrund schließt. Das Overlay ist transient –
   *  nur der Tastatur-Listener braucht Cleanup, darum das Fenster fixieren (Popout-Drift). */
  openLightbox(imgs, startIndex) {
    if (!imgs.length) return;
    let i = Math.max(0, Math.min(startIndex, imgs.length - 1));
    const many = imgs.length > 1;
    const doc = activeDocument;
    const ov = doc.body.createDiv("bt-lightbox");
    const stage = ov.createDiv("bt-lb-stage");
    const view = stage.createEl("img", { cls: "bt-lb-img" });
    const counter = many ? ov.createDiv("bt-lb-counter") : null;
    const show = () => {
      view.src = imgs[i].src;
      counter?.setText(i + 1 + " / " + imgs.length);
    };
    const go = (d) => {
      i = (i + d + imgs.length) % imgs.length;
      show();
    };
    const copyCurrent = async () => {
      const img = imgs[i];
      try {
        const canvas = doc.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("no 2d context");
        ctx.drawImage(img, 0, 0);
        const blob = await new Promise((res) => canvas.toBlob(res, "image/png"));
        if (!blob) throw new Error("toBlob returned null");
        await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
        new import_obsidian8.Notice(t("msg_image_copied"));
      } catch (err) {
        console.error("BeautyTasks: copy image failed", err);
        new import_obsidian8.Notice(t("msg_image_copy_failed"));
      }
    };
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "c" || e.key === "C")) {
        e.preventDefault();
        void copyCurrent();
      } else if (many && e.key === "ArrowLeft") {
        e.preventDefault();
        go(-1);
      } else if (many && e.key === "ArrowRight") {
        e.preventDefault();
        go(1);
      }
    };
    const close = () => {
      ov.remove();
      doc.removeEventListener("keydown", onKey, true);
    };
    if (many) {
      const nav = (cls, icon, label, d) => {
        const b = ov.createEl("button", { cls: "bt-lb-nav " + cls, attr: { "aria-label": label } });
        (0, import_obsidian8.setIcon)(b, icon);
        b.onclick = (e) => {
          e.stopPropagation();
          go(d);
        };
      };
      nav("bt-lb-prev", "chevron-left", t("lb_prev"), -1);
      nav("bt-lb-next", "chevron-right", t("lb_next"), 1);
    }
    const copyBtn = ov.createEl("button", { cls: "bt-lb-copy", attr: { "aria-label": t("lb_copy") } });
    (0, import_obsidian8.setIcon)(copyBtn, "copy");
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      void copyCurrent();
    };
    const closeBtn = ov.createEl("button", { cls: "bt-lb-close", attr: { "aria-label": t("btn_close") } });
    (0, import_obsidian8.setIcon)(closeBtn, "x");
    closeBtn.onclick = (e) => {
      e.stopPropagation();
      close();
    };
    view.onclick = (e) => {
      e.stopPropagation();
      if (many) go(1);
    };
    ov.onclick = (e) => {
      if (e.target === ov || e.target === stage) close();
    };
    doc.addEventListener("keydown", onKey, true);
    show();
  }
  addEntry() {
    const v = (this.input?.value || "").trim();
    if (!v) return;
    this.entries.push({ ts: nowLogTs(), body: v });
    this.host.reveal();
    this.render();
    void this.persistLog();
  }
  editEntry(idx, contentEl) {
    const entry = this.entries[idx];
    contentEl.empty();
    const ta = contentEl.createEl("textarea", { cls: "bt-log-edit" });
    ta.value = entry.body || "";
    window.setTimeout(() => {
      ta.setCssStyles({ height: "auto" });
      ta.setCssStyles({ height: ta.scrollHeight + 2 + "px" });
      ta.focus();
    }, 0);
    const acts = contentEl.createDiv({ cls: "bt-log-edit-acts" });
    const doSave = () => {
      entry.body = ta.value.trim();
      if (!entry.body) this.entries.splice(idx, 1);
      this.render();
      void this.persistLog();
    };
    const save = acts.createEl("button", { cls: "bt-log-edit-btn mod-cta", text: t("log_update") });
    save.onclick = doSave;
    const cancel = acts.createEl("button", { cls: "bt-log-edit-btn", text: t("btn_cancel") });
    cancel.onclick = () => this.render();
    ta.onkeydown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.render();
      }
    };
  }
  /** Sofort-Speichern – unabhängig vom Modal-Save. Bei neuen Aufgaben (kein File)
   *  wird der Log erst beim Speichern in den Body geschrieben. Serialisiert (Kette). */
  async persistLog() {
    const file = this.host.file();
    if (!file) return;
    this.chain = this.chain.then(async () => {
      try {
        await writeLog(this.app, file, this.entries);
      } catch (e) {
        console.error("bt-log persist", e);
        new import_obsidian8.Notice(t("err_detail_save"));
      }
    });
    return this.chain;
  }
  // ── Anhänge ──
  insertInComposer(text) {
    const el = this.input;
    if (!el) return;
    const s = el.selectionStart ?? el.value.length, e = el.selectionEnd ?? el.value.length;
    el.value = el.value.slice(0, s) + text + el.value.slice(e);
    el.selectionStart = el.selectionEnd = s + text.length;
    el.dispatchEvent(new Event("input"));
    el.focus();
  }
  async saveAttachment(file) {
    const IMG = ["png", "jpg", "jpeg", "gif", "webp", "svg", "bmp", "avif", "heic"];
    const dir = this.plugin.settings.attachmentsFolder;
    try {
      const name = file.name || "Pasted-" + Date.now() + "." + (file.type.split("/")[1] || "bin");
      const buf = await file.arrayBuffer();
      await ensureFolder(this.app, dir);
      const dot = name.lastIndexOf(".");
      const base = dot > 0 ? name.slice(0, dot) : name;
      const ext = dot > 0 ? name.slice(dot) : "";
      let p = (0, import_obsidian8.normalizePath)(dir + "/" + name);
      let i = 1;
      while (this.app.vault.getAbstractFileByPath(p)) p = (0, import_obsidian8.normalizePath)(dir + "/" + base + "-" + i++ + ext);
      const tfile = await this.app.vault.createBinary(p, buf);
      const isImage = IMG.includes((name.split(".").pop() || "").toLowerCase());
      const link = this.app.fileManager.generateMarkdownLink(tfile, this.host.srcPath());
      this.host.reveal();
      this.insertInComposer((isImage ? "!" : "") + link + " ");
      new import_obsidian8.Notice(t("msg_attached", tfile.name));
    } catch (err) {
      console.error("bt-attachment", err);
      new import_obsidian8.Notice(t("msg_attach_failed", String(err?.message || err)));
    }
  }
  async handleFiles(files) {
    for (const f of Array.from(files)) await this.saveAttachment(f);
  }
  pickAttachment() {
    const fi = createEl("input", { cls: "bt-hidden-file", attr: { type: "file", multiple: "true" } });
    activeDocument.body.appendChild(fi);
    fi.addEventListener("change", () => {
      if (fi.files?.length) void this.handleFiles(fi.files);
      fi.remove();
    });
    fi.click();
  }
  pickNote() {
    const app = this.app;
    const src = this.host.srcPath();
    const insert = (f) => {
      this.host.reveal();
      this.insertInComposer(app.fileManager.generateMarkdownLink(f, src) + " ");
    };
    class NotePicker extends import_obsidian8.FuzzySuggestModal {
      getItems() {
        return app.vault.getMarkdownFiles();
      }
      getItemText(f) {
        return f.path;
      }
      onChooseItem(f) {
        insert(f);
      }
    }
    const picker = new NotePicker(app);
    picker.setPlaceholder(t("log_link_placeholder"));
    picker.open();
  }
};

// src/chips.ts
var import_obsidian10 = require("obsidian");

// src/searchModal.ts
var import_obsidian9 = require("obsidian");
var projectBase = (path) => path.split("/").pop().replace(/\.md$/, "");
function taskSearchText(task) {
  const proj = task.project ? projectBase(task.project) : "";
  return [task.title, proj, ...task.labels].join(" ");
}
function renderTaskSuggestion(match, el) {
  const task = match.item;
  const done = isDone(task.status);
  el.addClass("bt-search-item");
  el.createDiv({ cls: "bt-search-title" + (done ? " is-done" : ""), text: task.title });
  const meta = el.createDiv({ cls: "bt-search-meta" });
  const proj = isInboxLink(task.project) ? t("nav_inbox") : projectDisplayName(projectBase(task.project));
  meta.createSpan({ cls: "bt-search-tag", text: "@" + proj });
  if (task.due) {
    const today = todayStr();
    const cls = done ? "" : task.due < today ? " is-overdue" : task.due === today ? " is-today" : "";
    meta.createSpan({ cls: "bt-search-tag" + cls, text: formatDate(task.due, today) });
  }
  for (const l of task.labels) meta.createSpan({ cls: "bt-search-tag", text: "#" + l });
}
var TaskSearchModal = class extends import_obsidian9.FuzzySuggestModal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    /** Archivierte Projekte bleiben standardmäßig außen vor – wie in Todoist, wo archivierte
     *  Projekte gar nicht erst durchsucht werden. Der Schalter unter dem Suchfeld holt sie zurück;
     *  er ist bewusst NICHT persistent: jede neue Suche beginnt wieder ohne Altlasten. */
    this.excludeArchived = true;
    this.setPlaceholder(t("search_placeholder"));
  }
  onOpen() {
    void super.onOpen();
    const bar = this.modalEl.createDiv({ cls: "bt-search-bar" });
    bar.createSpan({ cls: "bt-search-bar-lbl", text: t("search_exclude_archived") });
    const sw = bar.createDiv({
      cls: "bt-panel-switch" + (this.excludeArchived ? " is-on" : ""),
      attr: { role: "switch", "aria-checked": String(this.excludeArchived), tabindex: "0" }
    });
    const toggle = () => {
      this.excludeArchived = !this.excludeArchived;
      sw.toggleClass("is-on", this.excludeArchived);
      sw.setAttribute("aria-checked", String(this.excludeArchived));
      this.inputEl.dispatchEvent(new Event("input"));
      this.inputEl.focus();
    };
    sw.onclick = toggle;
    sw.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggle();
      }
    };
    this.modalEl.querySelector(".prompt-input-container")?.insertAdjacentElement("afterend", bar);
  }
  getItems() {
    const mtime = (tk) => {
      const f = this.plugin.app.vault.getAbstractFileByPath(tk.path);
      return f instanceof import_obsidian9.TFile ? f.stat.mtime : 0;
    };
    return this.plugin.index.all().filter((tk) => !isTrashed(tk.status)).filter((tk) => !this.excludeArchived || !this.plugin.index.isProjectArchived(tk.project)).sort((a, b) => mtime(b) - mtime(a));
  }
  getItemText(task) {
    return taskSearchText(task);
  }
  renderSuggestion(match, el) {
    renderTaskSuggestion(match, el);
  }
  onChooseItem(task) {
    void this.plugin.revealTask(task);
  }
};
var TaskPickerModal = class extends import_obsidian9.FuzzySuggestModal {
  constructor(app, items, placeholder, onChoose) {
    super(app);
    this.items = items;
    this.onChoose = onChoose;
    this.setPlaceholder(placeholder);
  }
  getItems() {
    return this.items;
  }
  getItemText(task) {
    return taskSearchText(task);
  }
  renderSuggestion(match, el) {
    renderTaskSuggestion(match, el);
  }
  onChooseItem(task) {
    this.onChoose(task);
  }
};

// src/chips.ts
var baseName3 = (path) => path.split("/").pop().replace(/\.md$/, "");
var PRIOS = [
  { value: "highest", key: "prio_1", color: "#ef4444" },
  { value: "high", key: "prio_2", color: "#f59e0b" },
  { value: "medium", key: "prio_3", color: "#3b82f6" },
  { value: "normal", key: "prio_4", color: "#9ca3af" }
];
var PRIO_KEY = {
  highest: "prio_1",
  high: "prio_2",
  medium: "prio_3",
  normal: "prio_4",
  low: "prio_4",
  lowest: "prio_4"
};
var PRIO_NUM = { highest: 1, high: 2, medium: 3, normal: null, low: null, lowest: null };
var RECUR = [
  { key: "recur_daily", val: "every day" },
  { key: "recur_weekly", val: "every week" },
  { key: "recur_monthly", val: "every month" },
  { key: "recur_quarterly", val: "every 3 months" },
  { key: "recur_yearly", val: "every year" }
];
var recurLabel = (v, basis) => {
  const r = RECUR.find((x) => x.val === v);
  const base = r ? t(r.key) : v;
  return basis === "done" ? base + " \xB7 " + t("recur_when_done") : base;
};
function openDate(host, anchor, field) {
  const f = host.f;
  const timeField = field === "due" ? "dueTime" : "scheduledTime";
  const d = f[field];
  const value = d ? combineDT(d, f[timeField]) : "";
  const dur = field === "due" ? { value: f.duration ?? null, onChange: (v) => {
    f.duration = v;
    host.rerender();
  } } : void 0;
  openDatePicker(anchor, value, (v) => {
    f[field] = v ? dateOf(v) : null;
    f[timeField] = v ? timeOf(v) : null;
    if (field === "due") host.pinDue();
    host.rerender();
  }, dur);
}
function openPrio(host, anchor) {
  openPopover(anchor, (pop, close) => {
    for (const p of PRIOS) {
      popRow(pop, "flag", t(p.key), () => {
        host.f.priority = p.value;
        host.rerender();
        close();
      }, host.f.priority === p.value, p.color);
    }
  });
}
function openStatus(host, anchor) {
  openPopover(anchor, (pop, close) => {
    for (const s of boardStatuses()) {
      popRow(pop, statusIcon(s.id), statusLabel(s.id), () => {
        host.applyStatus(s.id);
        close();
      }, (host.f.status ?? firstOpenStatus()) === s.id);
    }
  });
}
function openRecur(host, anchor) {
  const f = host.f;
  openPopover(anchor, (pop, close) => {
    const render = () => {
      pop.empty();
      popRow(pop, "x", t("recur_none"), () => {
        f.recurrence = null;
        host.rerender();
        close();
      }, !f.recurrence);
      for (const r of RECUR) {
        popRow(pop, "refresh-ccw", t(r.key), () => {
          f.recurrence = r.val;
          host.rerender();
          render();
        }, f.recurrence === r.val);
      }
      if (f.recurrence) {
        pop.createDiv({ cls: "bt-pop-head", text: t("recur_basis") });
        popRow(
          pop,
          f.recurBasis === "done" ? "check-circle-2" : "circle",
          t("recur_when_done"),
          () => {
            f.recurBasis = f.recurBasis === "done" ? "due" : "done";
            host.rerender();
            render();
          },
          f.recurBasis === "done"
        );
      }
    };
    render();
  });
}
function openLabels(host, anchor) {
  const f = host.f;
  f.labels ?? (f.labels = []);
  const known = [.../* @__PURE__ */ new Set([...host.plugin.index.all().flatMap((task) => task.labels), ...host.plugin.settings.knownLabels])];
  openPopover(anchor, (pop) => {
    pop.addClass("bt-tags");
    const add = pop.createEl("input", { type: "text", cls: "bt-tag-add", attr: { placeholder: t("placeholder_label") } });
    const list = pop.createDiv({ cls: "bt-tag-list" });
    const render = () => {
      list.empty();
      const q = add.value.trim().toLowerCase().replace(/^#/, "");
      const all = [.../* @__PURE__ */ new Set([...known, ...f.labels])].sort((a, b) => a.localeCompare(b, "de"));
      for (const tag of all) {
        if (q && !tag.toLowerCase().includes(q)) continue;
        const on = f.labels.includes(tag);
        const r = list.createDiv({ cls: "bt-row bt-tag-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });
        (0, import_obsidian10.setIcon)(ic, "hash");
        r.createSpan({ cls: "bt-row-lbl", text: tag });
        const box = r.createSpan({ cls: "bt-tag-box" });
        if (on) (0, import_obsidian10.setIcon)(box, "check");
        r.onclick = () => {
          f.labels = on ? f.labels.filter((x) => x !== tag) : [...f.labels, tag];
          host.resetParsedLabels?.();
          host.rerender();
          render();
        };
      }
    };
    render();
    add.oninput = () => render();
    add.onkeydown = (ev) => {
      if (ev.key !== "Enter") return;
      ev.preventDefault();
      const slug = slugify(add.value).toLowerCase().replace(/\s+/g, "-");
      if (!slug) return;
      if (!f.labels.includes(slug)) f.labels.push(slug);
      host.resetParsedLabels?.();
      add.value = "";
      host.rerender();
      render();
    };
    window.setTimeout(() => add.focus(), 0);
  });
}
function reminderLabel(f) {
  const n = f.reminders?.length ?? 0;
  if (n === 0) return t("chip_reminder");
  if (n === 1) return formatReminder(f.reminders[0]);
  return t("rem_count", n);
}
function openReminders(host, anchor) {
  const f = host.f;
  f.reminders ?? (f.reminders = []);
  const PRESETS = ["-0m", "-10m", "-30m", "-1h", "-1d"];
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-rem");
    const add = (raw) => {
      if (!f.reminders.includes(raw)) f.reminders = [...f.reminders, raw];
      host.rerender();
    };
    const render = () => {
      pop.empty();
      pop.createDiv({ cls: "bt-pop-head", text: t("reminders_title") });
      for (const raw of f.reminders) {
        const row = pop.createDiv({ cls: "bt-row bt-rem-item" });
        const ic = row.createSpan({ cls: "bt-row-ic" });
        (0, import_obsidian10.setIcon)(ic, "alarm-clock");
        row.createSpan({ cls: "bt-row-lbl", text: formatReminder(raw) });
        const x = row.createSpan({ cls: "bt-rem-x" });
        (0, import_obsidian10.setIcon)(x, "x");
        x.onclick = (e) => {
          e.stopPropagation();
          f.reminders = f.reminders.filter((r) => r !== raw);
          host.rerender();
          render();
        };
      }
      if (f.reminders.length) pop.createDiv({ cls: "bt-rem-sep" });
      pop.createDiv({ cls: "bt-pop-sub", text: t("rem_tab_relative") });
      if (!f.dueTime) {
        pop.createDiv({ cls: "bt-rem-hint", text: t("rem_need_time") });
      } else {
        for (const raw of PRESETS) {
          const row = popRow(pop, "clock", formatReminder(raw), () => {
            add(raw);
            render();
          });
          if (f.reminders.includes(raw)) row.addClass("is-disabled");
        }
      }
      pop.createDiv({ cls: "bt-rem-sep" });
      popRow(pop, "calendar-clock", t("rem_tab_absolute"), () => {
        close();
        openDatePicker(
          anchor,
          "",
          (iso4) => {
            if (iso4 && iso4.includes("T")) add(iso4);
          },
          void 0,
          { commit: "confirm", requireTime: true, confirmLabel: t("rem_add") }
        );
      });
    };
    render();
  });
}
function parentTitle(host) {
  if (!host.f.parent) return null;
  return host.plugin.index.all().find((tk) => baseName3(tk.path) === host.f.parent)?.title ?? host.f.parent;
}
function openParent(host) {
  const exclude = /* @__PURE__ */ new Set();
  if (host.existingPath) {
    exclude.add(host.existingPath);
    for (const d of host.plugin.index.descendants(host.existingPath)) exclude.add(d.path);
  }
  const items = host.plugin.index.all().filter((tk) => !isTrashed(tk.status) && !exclude.has(tk.path));
  new TaskPickerModal(host.app, items, t("pick_parent"), (parent) => {
    host.f.parent = baseName3(parent.path);
    host.onParentPicked?.(parent.project ? baseName3(parent.project) : null);
    host.rerender();
  }).open();
}
var CHIPS = {
  status: {
    id: "status",
    icon: "circle",
    nameKey: "chip_status",
    kind: "status",
    isSet: () => true,
    valueLabel: (f) => statusLabel(f.status ?? firstOpenStatus()),
    open: (host, a) => openStatus(host, a),
    clear: () => {
    }
  },
  due: {
    id: "due",
    icon: "calendar",
    nameKey: "chip_date",
    kind: "value",
    isSet: (f) => !!f.due,
    valueLabel: (f) => formatDateTime(combineDT(f.due, f.dueTime)) + (f.duration ? " \xB7 " + formatDuration(f.duration) : ""),
    open: (host, a) => openDate(host, a, "due"),
    clear: (host) => {
      host.f.due = null;
      host.f.dueTime = null;
      host.f.duration = null;
      host.pinDue();
    }
  },
  priority: {
    id: "priority",
    icon: "flag",
    nameKey: "chip_priority",
    kind: "value",
    isSet: (f) => !!f.priority && f.priority !== "normal",
    valueLabel: (f, host) => host.compactLabels ? "P" + PRIO_NUM[f.priority] : t(PRIO_KEY[f.priority]),
    open: (host, a) => openPrio(host, a),
    clear: (host) => {
      host.f.priority = "normal";
    }
  },
  label: {
    id: "label",
    icon: "hash",
    nameKey: "chip_label",
    kind: "value",
    isSet: (f) => !!(f.labels && f.labels.length),
    valueLabel: (f, host) => host.compactLabels ? (f.labels ?? []).join(" | ") : f.labels ?? [],
    open: (host, a) => openLabels(host, a),
    clear: (host) => {
      host.f.labels = [];
      host.resetParsedLabels?.();
    }
  },
  recurrence: {
    id: "recurrence",
    icon: "refresh-ccw",
    nameKey: "chip_recurrence",
    kind: "value",
    isSet: (f) => !!f.recurrence,
    valueLabel: (f) => recurLabel(f.recurrence, f.recurBasis),
    open: (host, a) => openRecur(host, a),
    clear: (host) => {
      host.f.recurrence = null;
    }
  },
  deadline: {
    id: "deadline",
    icon: "clock",
    nameKey: "chip_deadline",
    kind: "value",
    isSet: (f) => !!f.scheduled,
    valueLabel: (f) => formatDateTime(combineDT(f.scheduled, f.scheduledTime)),
    open: (host, a) => openDate(host, a, "scheduled"),
    clear: (host) => {
      host.f.scheduled = null;
      host.f.scheduledTime = null;
    }
  },
  reminder: {
    id: "reminder",
    icon: "alarm-clock",
    nameKey: "chip_reminder",
    kind: "value",
    isSet: (f) => (f.reminders?.length ?? 0) > 0,
    valueLabel: (f) => reminderLabel(f),
    open: (host, a) => openReminders(host, a),
    clear: (host) => {
      host.f.reminders = [];
    }
  },
  parent: {
    id: "parent",
    icon: "corner-down-right",
    nameKey: "chip_parent",
    kind: "value",
    isSet: (f) => !!f.parent,
    valueLabel: (_f, host) => parentTitle(host) ?? t("chip_parent"),
    open: (host) => openParent(host),
    clear: (host) => {
      host.f.parent = null;
    }
  },
  details: {
    id: "details",
    icon: "paperclip",
    nameKey: "details",
    kind: "details",
    isSet: (_f, host) => host.detailsOpen?.() ?? false,
    valueLabel: () => t("details"),
    open: (host, a) => host.toggleDetails?.(a),
    clear: () => {
    }
  }
};
var DEFAULT_CHIP_PROFILES = {
  editor: {
    order: ["due", "priority", "label", "details", "recurrence", "reminder", "deadline", "parent", "status"],
    tiers: { deadline: "onValue", parent: "onValue", status: "hidden" }
  },
  quickAdd: {
    order: ["due", "priority", "label", "recurrence", "reminder", "deadline", "parent", "details", "status"],
    tiers: { recurrence: "onValue", reminder: "onValue", deadline: "onValue", parent: "onValue", details: "hidden", status: "hidden" }
  }
};
function chipProfile(settings, surface) {
  return settings.chipProfiles?.[surface] ?? DEFAULT_CHIP_PROFILES[surface];
}
function resolveChipOrder(settings, surface) {
  const saved = chipProfile(settings, surface).order ?? [];
  const seen = new Set(saved.filter((id) => CHIP_IDS.includes(id)));
  return [...saved.filter((id) => CHIP_IDS.includes(id)), ...CHIP_IDS.filter((id) => !seen.has(id))];
}
function chipTierOf(settings, surface, id) {
  return chipProfile(settings, surface).tiers?.[id] ?? "shown";
}
function isInline(settings, surface, id, set) {
  const tier = chipTierOf(settings, surface, id);
  return tier === "shown" || tier === "onValue" && set;
}
function orderedChips(host) {
  return resolveChipOrder(host.plugin.settings, host.surface).map((id) => CHIPS[id]).filter((c) => !host.chipEnabled || host.chipEnabled(c.id));
}
function plusChips(host) {
  const s = host.plugin.settings;
  return orderedChips(host).filter((c) => !isInline(s, host.surface, c.id, c.isSet(host.f, host)));
}
function plusHasSetHidden(host) {
  return plusChips(host).some((c) => c.isSet(host.f, host));
}
function renderPlusChips(pop, host, anchor, close) {
  const list = plusChips(host);
  if (!list.length) return false;
  pop.createDiv({ cls: "bt-pop-head", text: t("more_chip_actions") });
  for (const c of list) {
    const set = c.isSet(host.f, host);
    const row = popRow(pop, c.icon, t(c.nameKey), () => {
      close();
      c.open(host, anchor);
    });
    if (set) {
      row.addClass("bt-row-set");
      const val = c.valueLabel(host.f, host);
      const v = Array.isArray(val) ? val.join(", ") : val;
      if (v) row.createSpan({ cls: "bt-row-val", text: v });
    }
  }
  return true;
}
function renderStatusChip(bar, host, c) {
  const cur = host.f.status ?? firstOpenStatus();
  const chip = bar.createEl("button", { cls: "bt-chip bt-chip-status is-set", attr: { "data-status": cur, "data-chip": c.id } });
  const sic = chip.createSpan({ cls: "bt-chip-ic" });
  (0, import_obsidian10.setIcon)(sic, statusIcon(cur));
  sic.style.color = statusTint(cur);
  chip.createSpan({ cls: "bt-chip-lbl", text: statusLabel(cur) });
  chip.onclick = (e) => {
    e.stopPropagation();
    c.open(host, chip);
  };
}
function renderValueChip(bar, host, c, set) {
  const iconsOnly = host.iconsOnly;
  const truncate = c.id === "parent" && set;
  const chip = bar.createEl("button", {
    cls: "bt-chip" + (set ? " is-set" : "") + (truncate ? " bt-chip-truncate" : ""),
    attr: { "data-chip": c.id }
  });
  if (iconsOnly && !set) {
    chip.setAttribute("aria-label", t(c.nameKey));
    chip.setAttribute("data-tooltip-position", "top");
  }
  const ic = chip.createSpan({ cls: "bt-chip-ic" });
  (0, import_obsidian10.setIcon)(ic, c.icon);
  const lbl = chip.createSpan({ cls: "bt-chip-lbl" });
  const label = set ? c.valueLabel(host.f, host) : t(c.nameKey);
  if (Array.isArray(label)) label.forEach((p, i) => {
    if (i) lbl.createSpan({ cls: "bt-chip-sep", text: " | " });
    lbl.appendText(p);
  });
  else lbl.setText(label);
  if (truncate && lbl.scrollWidth > lbl.clientWidth) {
    chip.addClass("is-faded");
    chip.setAttribute("aria-label", Array.isArray(label) ? label.join(", ") : label);
    chip.setAttribute("data-tooltip-position", "top");
  }
  chip.onclick = (e) => {
    e.stopPropagation();
    c.open(host, chip);
  };
  if (set) {
    const x = chip.createSpan({ cls: "bt-chip-x" });
    (0, import_obsidian10.setIcon)(x, "x");
    x.onclick = (e) => {
      e.stopPropagation();
      c.clear(host);
      host.rerender();
    };
  }
}
function openChipSettings(app) {
  const s = app.setting;
  s?.open();
  s?.openTabById("beautytasks");
}

// src/taskModal.ts
var baseName4 = (path) => path.split("/").pop().replace(/\.md$/, "");
var TaskModal = class _TaskModal extends import_obsidian11.Modal {
  // true sobald geschrieben -> kein Doppel-Speichern
  /** opts.hideProjekt blendet das Projekt-Chip aus (Unteraufgaben-Modus – die
   *  Unteraufgabe erbt Projekt der Hauptaufgabe). opts.parent = Eltern-Basename. */
  constructor(plugin, existing, defaultProject, opts = {}) {
    super(plugin.app);
    this.plugin = plugin;
    this.existing = existing;
    this.opts = opts;
    this.descInput = null;
    // Kommentar-Log (gemeinsame Komponente)
    this.duePinned = false;
    // true sobald Datum manuell gesetzt -> NL überschreibt nicht mehr
    this.cleanTitle = "";
    // Titel ohne erkannte Datum-/Label-Token
    this.parsedLabels = [];
    // aktuell aus dem Titel geparste #Labels (wird bei jedem Parse ersetzt)
    this.discarding = false;
    // true = bewusst verwerfen („Cancel") -> kein Auto-Speichern
    this.persisted = false;
    const seed = opts.seed;
    this.f = existing ? {
      title: existing.title,
      status: existing.status,
      due: existing.due,
      dueTime: existing.dueTime,
      scheduled: existing.scheduled,
      scheduledTime: existing.scheduledTime,
      duration: existing.duration,
      priority: existing.priority,
      recurrence: existing.recurrence,
      recurBasis: existing.recurBasis,
      project: existing.project ? baseName4(existing.project) : null,
      parent: existing.parent ? baseName4(existing.parent) : null,
      labels: [...existing.labels],
      reminders: [...existing.reminders ?? []],
      description: existing.description
      // aus dem Frontmatter (kein Body-Read mehr nötig)
    } : {
      title: opts.defaultTitle ?? "",
      status: seed?.status ?? opts.defaultStatus,
      priority: seed?.priority ?? "normal",
      labels: seed?.labels ? [...seed.labels] : opts.defaultLabel ? [opts.defaultLabel] : [],
      reminders: seed?.reminders ? [...seed.reminders] : [],
      due: seed?.due ?? (opts.defaultToday ? todayIso() : null),
      dueTime: seed?.dueTime ?? null,
      duration: seed?.duration ?? null,
      scheduled: seed?.scheduled ?? null,
      scheduledTime: seed?.scheduledTime ?? null,
      recurrence: seed?.recurrence ?? null,
      recurBasis: seed?.recurBasis ?? "due",
      parent: seed?.parent ?? null,
      description: seed?.description,
      project: defaultProject ?? null
      // kein Default-Projekt -> Eingang (= kein Projekt)
    };
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-task-modal");
    modalEl.toggleClass("bt-chips-icons-only", this.plugin.settings.chipsIconsOnly);
    contentEl.empty();
    const placeholder = this.opts.parent ? t("placeholder_subtask") : t("placeholder_taskname");
    const title = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder } });
    title.value = this.f.title;
    title.oninput = () => {
      this.f.title = title.value;
      this.applyParse();
      this.renderChips();
    };
    title.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void this.save();
      }
    };
    window.setTimeout(() => title.focus(), 0);
    const desc = contentEl.createEl("textarea", { cls: "bt-beschr", attr: { placeholder: t("placeholder_description"), rows: "1" } });
    desc.value = this.f.description ?? "";
    desc.oninput = () => {
      this.f.description = desc.value;
      this.growDesc();
    };
    this.descInput = desc;
    window.setTimeout(() => this.growDesc(), 0);
    this.chipBar = contentEl.createDiv({ cls: "bt-chips" });
    this.detailsWrap = contentEl.createDiv({ cls: "bt-details" });
    this.logWrap = this.detailsWrap.createDiv({ cls: "bt-log bt-hidden" });
    this.log = new DetailLogView(this.app, this.plugin, {
      srcPath: () => this.logSrc(),
      file: () => this.existingFile(),
      reveal: () => {
        this.logWrap.removeClass("bt-hidden");
        this.syncDetails();
      },
      close: () => this.close()
    });
    this.applyParse();
    this.renderChips();
    this.log.mount(this.logWrap);
    this.syncDetails();
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof import_obsidian11.TFile) {
        void readLog(this.app, file).then((entries) => {
          this.log.setEntries(entries);
          if (entries.length) this.logWrap.removeClass("bt-hidden");
          this.log.render();
          this.syncDetails();
        });
      }
    }
    if (this.opts.openDetails) {
      this.logWrap.removeClass("bt-hidden");
      this.syncDetails();
      window.setTimeout(() => this.log.focusComposer(), 0);
    }
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    if (!this.opts.hideProjekt) {
      this.projektBtn = foot.createEl("button", { cls: "bt-projekt" });
      this.projektBtn.onclick = (e) => this.openProject(e.currentTarget);
      this.renderProjekt();
    } else {
      foot.createDiv();
    }
    const actions = foot.createDiv({ cls: "bt-actions" });
    const cancel = actions.createEl("button", { text: t("btn_cancel") });
    cancel.onclick = () => {
      this.discarding = true;
      this.close();
    };
    const submit = actions.createEl("button", { cls: "mod-cta", text: this.existing ? t("btn_save") : t("btn_add_task") });
    submit.onclick = () => void this.save();
  }
  onClose() {
    if (!this.discarding) void this.persist();
    this.log?.unload();
    this.contentEl.empty();
  }
  /** Beschreibungs-Textarea an ihren Inhalt anpassen (Auto-Grow, gedeckelt). */
  growDesc() {
    const el = this.descInput;
    if (!el) return;
    el.setCssStyles({ height: "auto" });
    el.setCssStyles({ height: Math.min(el.scrollHeight, 200) + "px" });
  }
  /** Natural-Language: Datum + #Labels aus dem Titel erkennen und übernehmen.
   *  Datum nur, solange nicht manuell gesetzt; Labels werden ergänzt. */
  applyParse() {
    if (!this.plugin.settings.parseNaturalLanguage) {
      this.cleanTitle = this.f.title;
      return;
    }
    const p = parseQuickEntry(this.f.title);
    this.cleanTitle = p.title;
    if (!this.duePinned && p.faellig) this.f.due = p.faellig;
    if (!this.duePinned && p.time) this.f.dueTime = p.time;
    if (p.priority) this.f.priority = p.priority;
    const manual = this.f.labels.filter((l) => !this.parsedLabels.includes(l));
    this.parsedLabels = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
    this.f.labels = [...manual, ...this.parsedLabels];
  }
  // ── Chips ──
  /** Brücke Modal ⇄ Chip-Registry: Feldzustand + host-spezifische Callbacks. */
  chipHost() {
    return {
      plugin: this.plugin,
      app: this.app,
      f: this.f,
      surface: "editor",
      rerender: () => this.renderChips(),
      compactLabels: false,
      iconsOnly: this.plugin.settings.chipsIconsOnly,
      applyStatus: (s) => void this.applyStatus(s),
      pinDue: () => {
        this.duePinned = true;
      },
      existingPath: this.existing?.path,
      onParentPicked: (proj) => {
        if (proj) this.f.project = proj;
        if (!this.opts.hideProjekt) this.renderProjekt();
      },
      toggleDetails: () => this.toggleDetails(),
      detailsOpen: () => !this.logWrap.hasClass("bt-hidden"),
      // Elternaufgaben-Chip im festen „+ Subtask"-Modus (opts.parent) ausblenden – Parent steht fest.
      chipEnabled: (id) => id === "parent" ? !this.opts.parent : true
    };
  }
  renderChips() {
    const bar = this.chipBar;
    bar.empty();
    const host = this.chipHost();
    const settings = this.plugin.settings;
    for (const id of resolveChipOrder(settings, host.surface)) {
      const c = CHIPS[id];
      if (host.chipEnabled && !host.chipEnabled(id)) continue;
      const set = c.isSet(this.f, host);
      if (!isInline(settings, host.surface, id, set)) continue;
      if (c.kind === "status") renderStatusChip(bar, host, c);
      else if (c.kind === "details") this.renderDetailsChip(bar);
      else renderValueChip(bar, host, c, set);
    }
    const acts = bar.createEl("button", { cls: "bt-chip bt-chip-actions" + (plusHasSetHidden(host) ? " has-set" : ""), attr: { "aria-label": t("task_actions"), "data-tooltip-position": "top" } });
    (0, import_obsidian11.setIcon)(acts.createSpan({ cls: "bt-chip-ic" }), "plus");
    acts.onclick = (e) => {
      e.stopPropagation();
      this.openPlusMenu(acts);
    };
  }
  /** Details-Chip (Büroklammer): toggelt die Kommentar-/Detail-Sektion (is-open statt is-set). */
  renderDetailsChip(bar) {
    const open = !this.logWrap.hasClass("bt-hidden");
    const chip = bar.createEl("button", { cls: "bt-chip bt-chip-details" + (open ? " is-open" : "") });
    if (this.plugin.settings.chipsIconsOnly) {
      chip.setAttribute("aria-label", t("details"));
      chip.setAttribute("data-tooltip-position", "top");
    }
    const dIc = chip.createSpan({ cls: "bt-chip-ic" });
    (0, import_obsidian11.setIcon)(dIc, "paperclip");
    chip.createSpan({ cls: "bt-chip-lbl", text: t("details") });
    chip.onclick = (e) => {
      e.stopPropagation();
      this.toggleDetails();
    };
    this.detailsChip = chip;
  }
  /** „+"-Popover: „Weitere Aktionen" (ausgeblendete Chips, mit Umrandung + Wert-Vorschau),
   *  im Edit-Modus zusätzlich die Aufgabenaktionen; unten immer „Aufgabenaktionen bearbeiten". */
  openPlusMenu(anchor) {
    const host = this.chipHost();
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-plus");
      const row = (icon, label, fn, danger = false) => {
        const r = popRow(pop, icon, label, () => {
          close();
          fn();
        });
        if (danger) r.addClass("bt-row-danger");
      };
      let any = renderPlusChips(pop, host, anchor, close);
      if (this.existing) {
        if (any) pop.createDiv({ cls: "bt-plus-sep" });
        row("corner-down-right", t("menu_create_subtask"), () => this.addSubtask());
        if (this.parentTask()) row("corner-left-up", t("menu_show_parent"), () => this.showParent());
        row("copy", t("menu_duplicate"), () => void this.duplicate());
        pop.createDiv({ cls: "bt-plus-sep" });
        row("link", t("menu_copy_link"), () => this.copyLink());
        row("file-text", t("menu_open_obsidian"), () => this.openInObsidian());
        if (!import_obsidian11.Platform.isMobile) row("external-link", t("menu_open_editor"), () => this.openInEditor());
        if (!import_obsidian11.Platform.isMobile) {
          pop.createDiv({ cls: "bt-plus-sep" });
          row("printer", t("menu_print"), () => this.printTask());
        }
        pop.createDiv({ cls: "bt-plus-sep" });
        row("trash-2", t("btn_delete"), () => void this.remove(), true);
        any = true;
      }
      if (any) pop.createDiv({ cls: "bt-plus-sep" });
      popRow(pop, "sliders-horizontal", t("edit_task_actions"), () => {
        close();
        openChipSettings(this.app);
      });
    });
  }
  /** Aufgabe duplizieren: aktuellen Stand sichern und als neue Aufgabe („(Kopie)") anlegen. */
  async duplicate() {
    const title = this.titleValue();
    if (!title) {
      new import_obsidian11.Notice(t("err_enter_taskname"));
      return;
    }
    await this.persist();
    const file = await createTaskNote(this.app, this.plugin.settings, {
      ...this.f,
      title: title + " " + t("copy_suffix"),
      status: firstOpenStatus(),
      parent: this.f.parent ?? this.opts.parent ?? null
    });
    await this.log.flush(file);
    new import_obsidian11.Notice(t("msg_duplicated"));
    this.close();
  }
  /** Obsidian-Deeplink (obsidian://) zur Aufgabe in die Zwischenablage kopieren. */
  copyLink() {
    if (!this.existing) return;
    const vault = encodeURIComponent(this.app.vault.getName());
    const file = encodeURIComponent(this.existing.path.replace(/\.md$/, ""));
    navigator.clipboard.writeText(`obsidian://open?vault=${vault}&file=${file}`).then(() => new import_obsidian11.Notice(t("msg_link_copied"))).catch((err) => {
      console.error("BeautyTasks: copy link failed", err);
      new import_obsidian11.Notice(t("msg_link_copy_failed"));
    });
  }
  /** Aufgaben-Notiz in einem neuen Obsidian-Tab öffnen. */
  openInObsidian() {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (file instanceof import_obsidian11.TFile) {
      void this.app.workspace.getLeaf("tab").openFile(file);
      this.close();
    }
  }
  /** Aufgaben-Notiz im System-Standardeditor (externe App) öffnen. */
  openInEditor() {
    if (!this.existing) return;
    this.app.openWithDefaultApp?.(this.existing.path);
    this.close();
  }
  /** Aufgabe drucken: Titel + Meta + Beschreibung in ein verstecktes iframe rendern und drucken.
   *  DOM-basiert (createElement/textContent) – kein document.write, kein Inline-Style. */
  printTask() {
    const doc = activeDocument;
    const title = this.titleValue() || t("placeholder_taskname");
    const meta = [];
    if (this.f.due) meta.push(t("chip_date") + ": " + formatDateTime(combineDT(this.f.due, this.f.dueTime)));
    if (this.f.priority && this.f.priority !== "normal") meta.push(t("chip_priority") + ": " + t(PRIO_KEY[this.f.priority]));
    if (this.f.labels?.length) meta.push(t("chip_label") + ": " + this.f.labels.map((l) => "#" + l).join(", "));
    if (this.f.project) meta.push(t("group_project") + ": " + projectDisplayName(this.f.project));
    const desc = (this.f.description ?? "").trim();
    const iframe = doc.createElement("iframe");
    iframe.setAttribute("aria-hidden", "true");
    iframe.addClass("bt-print-frame");
    doc.body.appendChild(iframe);
    const idoc = iframe.contentDocument, win = iframe.contentWindow;
    if (!idoc || !win) {
      iframe.remove();
      return;
    }
    idoc.title = title;
    idoc.body.className = "bt-print";
    const style = idoc.createElement("style");
    style.textContent = ".bt-print{font-family:sans-serif;margin:2cm;color:#111}.bt-print h1{font-size:20pt;margin:0 0 12pt}.bt-print ul{padding-left:1.2em;color:#333;font-size:11pt}.bt-print li{margin:2pt 0}.bt-print pre{white-space:pre-wrap;font:inherit;font-size:11pt;margin-top:12pt}";
    idoc.head.appendChild(style);
    const h1 = idoc.createElement("h1");
    h1.textContent = title;
    idoc.body.appendChild(h1);
    if (meta.length) {
      const ul = idoc.createElement("ul");
      for (const m of meta) {
        const li = idoc.createElement("li");
        li.textContent = m;
        ul.appendChild(li);
      }
      idoc.body.appendChild(ul);
    }
    if (desc) {
      const pre = idoc.createElement("pre");
      pre.textContent = desc;
      idoc.body.appendChild(pre);
    }
    win.focus();
    win.print();
    window.setTimeout(() => iframe.remove(), 1e3);
  }
  /** Detail-Sektion (Kommentar-Log) auf-/zuklappen – vom Büroklammer-Chip ausgelöst. */
  toggleDetails() {
    const willOpen = this.logWrap.hasClass("bt-hidden");
    this.logWrap.toggleClass("bt-hidden", !willOpen);
    if (willOpen) window.setTimeout(() => this.log.focusComposer(), 0);
    this.syncDetails();
  }
  /** Chip-Zustand + Sichtbarkeit des Detail-Bereichs angleichen: Der Wrapper (und damit sein
   *  Leerraum) verschwindet, wenn die Kommentar-Sektion zu ist – so kein leeres Band unter
   *  den Chips. */
  syncDetails() {
    const logOpen = !this.logWrap.hasClass("bt-hidden");
    this.detailsChip?.toggleClass("is-open", logOpen);
    this.detailsWrap.toggleClass("bt-hidden", !logOpen);
  }
  /** Die aktuell gewählte Elternaufgabe aus dem Index (oder null, wenn keine/nicht gefunden). */
  parentTask() {
    if (!this.f.parent) return null;
    return this.plugin.index.all().find((tk) => baseName4(tk.path) === this.f.parent) ?? null;
  }
  /** Elternaufgabe in ihrer Liste anzeigen (wie die Lupe in der Suche: hinspringen + kurz
   *  hervorheben). Modal schließen, damit die hervorgehobene Zeile sichtbar wird. */
  showParent() {
    const parent = this.parentTask();
    if (!parent) {
      new import_obsidian11.Notice(t("err_parent_not_found"));
      return;
    }
    this.close();
    void this.plugin.revealTask(parent);
  }
  /** Status übernehmen. Bei bestehender Aufgabe live schreiben (setTaskStatus kümmert sich
   *  um Zeitstempel/Wiederholung); bei neuer Aufgabe fließt f.status beim Anlegen ein. */
  async applyStatus(status) {
    this.f.status = status;
    if (this.existing) {
      await this.plugin.setTaskStatus(this.existing, status);
      this.existing.status = status;
    }
    this.renderChips();
  }
  renderProjekt() {
    this.projektBtn.empty();
    const { bereiche, projekte } = listProjectsAndAreas(this.app);
    const inbox = isInboxLink(this.f.project);
    const sel = inbox ? null : [...bereiche, ...projekte].find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    (0, import_obsidian11.setIcon)(ic, inbox ? "inbox" : sel?.icon ?? "folder");
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: inbox ? t("nav_inbox") : projectDisplayName(this.f.project) });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" });
    (0, import_obsidian11.setIcon)(car, "chevron-down");
  }
  openProject(anchor) {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      popRow(pop, "plus", t("pick_new_project"), () => this.startNewProject(pop, close, false)).addClass("bt-row-action");
      popRow(pop, "plus", t("pick_new_area"), () => this.startNewProject(pop, close, true)).addClass("bt-row-action");
      const { bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name) => {
        this.f.project = name;
        this.renderProjekt();
        close();
      };
      popRow(pop, "inbox", t("nav_inbox"), () => pick(null), isInboxLink(this.f.project));
      const group = (title, items) => {
        if (!items.length) return;
        pop.createDiv({ cls: "bt-pop-head", text: title });
        for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), this.f.project === it.name, it.color ?? void 0);
      };
      group(t("group_area"), bereiche);
      group(t("group_project"), projekte);
    });
  }
  startNewProject(pop, close, asArea) {
    pop.empty();
    const inp = pop.createEl("input", { type: "text", cls: "bt-pop-input", attr: { placeholder: asArea ? t("placeholder_area_name") : t("placeholder_project_name") } });
    inp.onkeydown = async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const name = inp.value.trim();
      if (!name) return;
      const base = await createProjectNote(this.app, this.plugin.settings, name, asArea);
      this.f.project = base;
      this.renderProjekt();
      close();
    };
    window.setTimeout(() => inp.focus(), 0);
  }
  // ── Unteraufgabe ──
  /** „＋ Unteraufgabe": schließt dieses Modal und öffnet ein neues, vollwertiges
   *  Aufgaben-Modal mit ausgeblendetem Projekt-Chip. Projekt = das der Hauptaufgabe,
   *  parent = Eltern-Titel. Genau wie im alten BeautyTasks. */
  addSubtask() {
    if (!this.existing) return;
    const parent = this.existing;
    const parentProject = parent.project ? parent.project.split("/").pop().replace(/\.md$/, "") : void 0;
    const parentBase = parent.path.split("/").pop().replace(/\.md$/, "");
    this.close();
    new _TaskModal(this.plugin, void 0, parentProject, { hideProjekt: true, parent: parentBase }).open();
  }
  // ── Details: Kommentar-Log (gemeinsame Komponente DetailLogView) ──
  logSrc() {
    return this.existing?.path ?? this.plugin.settings.itemsFolder + "/_.md";
  }
  /** Ziel-Datei des Logs (nur bei bestehender Aufgabe) – null = neue Aufgabe (Puffer im Speicher). */
  existingFile() {
    if (!this.existing) return null;
    const f = this.app.vault.getAbstractFileByPath(this.existing.path);
    return f instanceof import_obsidian11.TFile ? f : null;
  }
  // ── Speichern / Löschen ──
  /** Aktueller (bereinigter) Titel. */
  titleValue() {
    return (this.cleanTitle || this.f.title).trim();
  }
  /** Explizites Speichern (Button/Enter): bei leerem Titel Hinweis + offen bleiben. */
  async save() {
    if (!this.titleValue()) {
      new import_obsidian11.Notice(t("err_enter_taskname"));
      return;
    }
    await this.persist();
    this.close();
  }
  /** Schreibt die Aufgabe (neu anlegen oder Frontmatter aktualisieren). Ohne Titel passiert
   *  nichts (stilles Verwerfen beim Auto-Speichern); nur EINMAL (Schutz gegen Doppel-Schreiben). */
  async persist() {
    const title = this.titleValue();
    if (!title || this.persisted) return;
    this.persisted = true;
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof import_obsidian11.TFile) {
        await this.app.fileManager.processFrontMatter(file, (fm) => {
          ensureCanonicalFm(fm);
          const set = (k, v) => {
            if (v === null || v === void 0 || v === "" || Array.isArray(v) && v.length === 0) delete fm[k];
            else fm[k] = v;
          };
          set("priority", this.f.priority && this.f.priority !== "normal" ? this.f.priority : null);
          set("due", this.f.due ? combineDT(this.f.due, this.f.dueTime) : null);
          set("scheduled", this.f.scheduled ? combineDT(this.f.scheduled, this.f.scheduledTime) : null);
          set("duration", this.f.duration ?? null);
          set("recurrence", this.f.recurrence);
          set("recur_basis", this.f.recurrence && this.f.recurBasis === "done" ? "done" : null);
          set("project", this.f.project ? "[[" + this.f.project + "]]" : null);
          set("parent", this.f.parent ? "[[" + this.f.parent + "]]" : null);
          set("labels", this.f.labels);
          set("reminders", this.f.reminders);
          set("description", (this.f.description ?? "").trim() || null);
        });
        if (title !== this.existing.title) {
          await this.app.vault.process(file, (c) => c.replace(/^#\s+.*$/m, () => "# " + title));
        }
      }
    } else {
      const file = await createTaskNote(this.app, this.plugin.settings, { ...this.f, title, parent: this.f.parent ?? this.opts.parent ?? null });
      await this.log.flush(file);
    }
  }
  async remove() {
    if (!this.existing) return;
    this.discarding = true;
    await this.plugin.cancelTask(this.existing);
    this.close();
  }
};

// src/colorSwatches.ts
var import_obsidian12 = require("obsidian");
var COLOR_PRESETS = ["#e05c4a", "#f97316", "#f59e0b", "#4caf50", "#3b82f6", "#7c5cff", "#a855f7", "#ec4899"];
function buildSwatchRow(row, current2, onPick) {
  row.addClass("bt-swatch-row");
  const mark = (el) => {
    row.querySelectorAll(".bt-color-cell").forEach((s) => s.removeClass("is-active"));
    el.addClass("is-active");
  };
  const isPreset = !current2 || COLOR_PRESETS.includes(current2);
  const none = row.createEl("button", { cls: "bt-color-cell bt-color-none" + (!current2 ? " is-active" : ""), attr: { "aria-label": t("status_color_none") } });
  (0, import_obsidian12.setIcon)(none, "ban");
  none.onclick = () => {
    onPick(null);
    mark(none);
  };
  for (const c of COLOR_PRESETS) {
    const b = row.createEl("button", { cls: "bt-color-cell" + (current2 === c ? " is-active" : ""), attr: { "aria-label": c } });
    b.style.setProperty("--bt-swatch", c);
    b.onclick = () => {
      onPick(c);
      mark(b);
    };
  }
  const custom = row.createEl("button", { cls: "bt-color-cell bt-color-custom" + (isPreset ? "" : " is-active"), attr: { "aria-label": t("color_custom") } });
  if (!isPreset && current2) custom.style.setProperty("--bt-swatch", current2);
  (0, import_obsidian12.setIcon)(custom, "pipette");
  const input = custom.createEl("input", { cls: "bt-color-input", attr: { type: "color" } });
  if (current2 && /^#[0-9a-f]{6}$/i.test(current2)) input.value = current2;
  input.oninput = () => {
    custom.style.setProperty("--bt-swatch", input.value);
    mark(custom);
    onPick(input.value);
  };
}

// src/confirmModal.ts
var import_obsidian13 = require("obsidian");
var ConfirmModal = class extends import_obsidian13.Modal {
  constructor(app, opts, onConfirm) {
    super(app);
    this.opts = opts;
    this.onConfirm = onConfirm;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-confirm-modal");
    contentEl.createEl("h3", { text: this.opts.title });
    if (this.opts.message) contentEl.createEl("p", { cls: "bt-confirm-msg", text: this.opts.message });
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    const cancel = actions.createEl("button", { text: t("btn_cancel") });
    cancel.onclick = () => this.close();
    const confirm = actions.createEl("button", {
      cls: "mod-cta" + (this.opts.destructive === false ? "" : " mod-warning"),
      text: this.opts.confirmText ?? t("btn_delete")
    });
    confirm.onclick = () => {
      this.close();
      this.onConfirm();
    };
    window.setTimeout(() => confirm.focus(), 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};
var PromptModal = class extends import_obsidian13.Modal {
  constructor(app, opts, onSubmit) {
    super(app);
    this.opts = opts;
    this.onSubmit = onSubmit;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-confirm-modal");
    contentEl.createEl("h3", { text: this.opts.title });
    const input = contentEl.createEl("input", { cls: "bt-new-input", attr: { type: "text", placeholder: this.opts.placeholder ?? "" } });
    input.value = this.opts.value ?? "";
    const submit = () => {
      const v = input.value.trim();
      this.close();
      if (v && v !== this.opts.value) this.onSubmit(v);
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.close();
      }
    };
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: this.opts.confirmText ?? t("btn_save") }).onclick = submit;
    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/filterModal.ts
var FilterModal = class extends import_obsidian14.Modal {
  constructor(plugin, editPath) {
    super(plugin.app);
    this.plugin = plugin;
    this.editPath = editPath ?? null;
    const existing = editPath ? readFilter(plugin.app, editPath) : null;
    this.name = existing?.name ?? "";
    this.origName = this.name;
    this.c = { ...DEFAULT_CRITERIA, ...existing?.criteria ?? {} };
    this.o = { ...DEFAULT_OPTIONS, ...existing?.options ?? {} };
    this.color = existing?.color ?? null;
    this.visible = existing ? !existing.hidden : true;
    this.wasVisible = this.visible;
  }
  onOpen() {
    this.modalEl.addClass("bt-filter-modal");
    this.build();
  }
  build() {
    const { contentEl } = this;
    contentEl.empty();
    contentEl.createEl("h3", { text: this.editPath ? t("filter_edit") : t("filter_new") });
    new import_obsidian14.Setting(contentEl).setName(t("filter_name")).addText((tx) => tx.setPlaceholder(t("filter_name_ph")).setValue(this.name).onChange((v) => {
      this.name = v;
    }));
    const colorField = contentEl.createDiv({ cls: "bt-new-field bt-filter-color" });
    colorField.createEl("label", { text: t("status_pick_color") });
    buildSwatchRow(colorField.createDiv({ cls: "bt-color-box" }), this.color, (c) => {
      this.color = c;
    });
    const visRow = contentEl.createDiv({ cls: "bt-new-row" });
    visRow.createEl("label", { text: t("show_in_sidebar") });
    const sw = visRow.createDiv({ cls: "bt-mrow-switch" + (this.visible ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(this.visible), tabindex: "0" } });
    const flip = () => {
      this.visible = !this.visible;
      sw.toggleClass("is-on", this.visible);
      sw.setAttr("aria-checked", String(this.visible));
    };
    sw.onclick = flip;
    sw.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    };
    contentEl.createEl("h4", { cls: "bt-filter-h", text: t("filter_facets") });
    this.select(
      contentEl,
      t("filter_range"),
      RANGES.map((r) => ({ key: r, label: t("filter_range_" + r) })),
      () => this.c.range,
      (v) => {
        this.c.range = v;
        this.refresh();
      }
    );
    this.facet(
      contentEl,
      t("filter_priorities"),
      FILTER_PRIORITIES.map((p) => ({ key: p, label: t(PRIO_KEY[p]) })),
      {
        modeOf: (k) => this.c.prioritiesNot.includes(k) ? "none" : this.c.priorities.includes(k) ? "any" : null,
        toggle: (k, pen) => {
          const p = k;
          const was = this.c.prioritiesNot.includes(p) ? "none" : this.c.priorities.includes(p) ? "any" : null;
          this.c.priorities = this.c.priorities.filter((x) => x !== p);
          this.c.prioritiesNot = this.c.prioritiesNot.filter((x) => x !== p);
          if (was !== pen) (pen === "none" ? this.c.prioritiesNot : this.c.priorities).push(p);
        },
        clear: () => {
          this.c.priorities = [];
          this.c.prioritiesNot = [];
        },
        pens: ["any", "none"]
      }
    );
    const labels = this.plugin.getLabels().map((l) => ({ key: l.name, label: l.name }));
    if (labels.length) this.facet(contentEl, t("filter_labels"), labels, {
      modeOf: (k) => this.c.labelsNot.includes(k) ? "none" : this.c.labelsAll.includes(k) ? "all" : this.c.labels.includes(k) ? "any" : null,
      toggle: (k, pen) => {
        const was = this.c.labelsNot.includes(k) ? "none" : this.c.labelsAll.includes(k) ? "all" : this.c.labels.includes(k) ? "any" : null;
        this.c.labels = this.c.labels.filter((x) => x !== k);
        this.c.labelsAll = this.c.labelsAll.filter((x) => x !== k);
        this.c.labelsNot = this.c.labelsNot.filter((x) => x !== k);
        if (was !== pen) (pen === "all" ? this.c.labelsAll : pen === "none" ? this.c.labelsNot : this.c.labels).push(k);
      },
      clear: () => {
        this.c.labels = [];
        this.c.labelsAll = [];
        this.c.labelsNot = [];
      },
      pens: ["any", "all", "none"]
    });
    const { bereiche, projekte } = listProjectsAndAreas(this.plugin.app);
    const projOpts = [
      { key: "Inbox", label: t("nav_inbox") },
      ...[...bereiche, ...projekte].map((p) => ({ key: p.name, label: projectDisplayName(p.name) }))
    ];
    if (projOpts.length) this.facet(contentEl, t("filter_projects"), projOpts, {
      modeOf: (k) => this.c.projectsNot.includes(k) ? "none" : this.c.projects.includes(k) ? "any" : null,
      toggle: (k, pen) => {
        const was = this.c.projectsNot.includes(k) ? "none" : this.c.projects.includes(k) ? "any" : null;
        this.c.projects = this.c.projects.filter((x) => x !== k);
        this.c.projectsNot = this.c.projectsNot.filter((x) => x !== k);
        if (was !== pen) (pen === "none" ? this.c.projectsNot : this.c.projects).push(k);
      },
      clear: () => {
        this.c.projects = [];
        this.c.projectsNot = [];
      },
      pens: ["any", "none"]
    });
    new import_obsidian14.Setting(contentEl).setName(t("filter_search")).addText((tx) => tx.setPlaceholder(t("filter_search_ph")).setValue(this.c.search).onChange((v) => {
      this.c.search = v;
      this.refresh();
    }));
    this.countEl = contentEl.createDiv({ cls: "bt-filter-count" });
    this.refresh();
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    const danger = foot.createDiv({ cls: "bt-actions" });
    if (this.editPath) danger.createEl("button", { cls: "mod-warning", text: t("filter_delete") }).onclick = () => new ConfirmModal(this.app, { title: t("confirm_delete_title", this.name || t("nav_filters")), message: t("confirm_delete_body") }, () => void this.remove()).open();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("filter_reset") }).onclick = () => this.reset();
    actions.createEl("button", { cls: "mod-cta", text: t("filter_save") }).onclick = () => void this.save();
  }
  onClose() {
    this.contentEl.empty();
  }
  /** Mehrfachauswahl mit PRO-WERT-Marker. Der Modus oben (eines/alle/keines) ist nur der „Stift":
   *  Ein Klick auf einen Wert setzt/entfernt ihn im aktuellen Stift; jeder Wert behält seinen Marker
   *  (✓ = eines/ODER · + = alle/UND · − = keines/NICHT), auch wenn der Stift gewechselt wird. */
  facet(parent, label, opts, ctl) {
    const btn = new import_obsidian14.Setting(parent).setName(label).controlEl.createEl("button", { cls: "bt-facet-dd" });
    const lbl = btn.createSpan({ cls: "bt-facet-dd-lbl" });
    (0, import_obsidian14.setIcon)(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
    const iconOf = (m) => m === "all" ? "plus" : m === "none" ? "minus" : "check";
    const syncLbl = () => {
      const n = opts.filter((o) => ctl.modeOf(o.key)).length;
      lbl.setText(n ? t("filter_n_criteria", n) : t("filter_all"));
    };
    syncLbl();
    let pen = ctl.pens[0];
    btn.onclick = () => openPopover(btn, (pop) => {
      pop.addClass("bt-facet-pop");
      const render = () => {
        pop.empty();
        pop.addClass("bt-facet-pop");
        if (ctl.pens.length > 1) {
          pop.addClass("bt-mode-pop");
          pop.createDiv({ cls: "bt-mode-lead", text: t("filter_mode_lead") });
          const seg = pop.createDiv({ cls: "bt-mode-seg" });
          for (const m of ctl.pens) {
            const opt = seg.createSpan({ cls: "bt-mode-opt" + (pen === m ? " is-on" : ""), text: t("filter_mode_" + m) });
            opt.onclick = () => {
              pen = m;
              render();
            };
          }
          pop.createDiv({ cls: "bt-mode-sentence", text: t("filter_mode_s_" + pen) });
        }
        const rowEl = (active, icon, text, onClick) => {
          const r = pop.createDiv({ cls: "bt-row" + (active ? " is-active" : "") });
          const ic = r.createSpan({ cls: "bt-row-ic" });
          if (icon) (0, import_obsidian14.setIcon)(ic, icon);
          r.createSpan({ cls: "bt-row-lbl", text });
          r.onclick = onClick;
        };
        const empty = !opts.some((o) => ctl.modeOf(o.key));
        rowEl(empty, empty ? "check" : null, t("filter_all"), () => {
          ctl.clear();
          syncLbl();
          this.refresh();
          render();
        });
        for (const o of opts) {
          const m = ctl.modeOf(o.key);
          rowEl(!!m, m ? iconOf(m) : null, o.label, () => {
            ctl.toggle(o.key, pen);
            syncLbl();
            this.refresh();
            render();
          });
        }
      };
      render();
    });
  }
  /** Einfachauswahl als kompaktes Dropdown (Button + Popover mit Häkchen) – optisch identisch
   *  zu den Mehrfach-Facetten, aber genau EIN Wert; Klick wählt und schließt. */
  select(parent, label, opts, get, set) {
    const btn = new import_obsidian14.Setting(parent).setName(label).controlEl.createEl("button", { cls: "bt-facet-dd" });
    const lbl = btn.createSpan({ cls: "bt-facet-dd-lbl" });
    (0, import_obsidian14.setIcon)(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
    const syncLbl = () => lbl.setText(opts.find((o) => o.key === get())?.label ?? "");
    syncLbl();
    btn.onclick = () => openPopover(btn, (pop, close) => {
      pop.addClass("bt-facet-pop");
      for (const o of opts) {
        const on = get() === o.key;
        const r = pop.createDiv({ cls: "bt-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });
        if (on) (0, import_obsidian14.setIcon)(ic, "check");
        r.createSpan({ cls: "bt-row-lbl", text: o.label });
        r.onclick = () => {
          set(o.key);
          syncLbl();
          this.refresh();
          close();
        };
      }
    });
  }
  refresh() {
    const n = applyFilter(this.plugin.index, this.c, this.o, todayStr()).length;
    const facets = activeFacetCount(this.c);
    this.countEl.setText(t(n === 1 ? "count_task" : "count_tasks", n) + (facets ? " \xB7 " + t("filter_facets_active", facets) : ""));
  }
  reset() {
    this.c = { ...DEFAULT_CRITERIA };
    this.color = null;
    this.build();
  }
  async save() {
    const name = this.name.trim();
    if (!name) {
      new import_obsidian14.Notice(t("filter_need_name"));
      return;
    }
    if (this.editPath) {
      let path = this.editPath;
      if (name !== this.origName) {
        const base = await this.plugin.renameFilter(this.editPath, name);
        if (base === null) {
          new import_obsidian14.Notice(t("filter_name_taken"));
          return;
        }
        const slash = this.editPath.lastIndexOf("/");
        path = (slash >= 0 ? this.editPath.slice(0, slash + 1) : "") + base + ".md";
      }
      await this.plugin.updateFilter(path, this.c, this.o, this.color);
      if (this.visible !== this.wasVisible) await this.plugin.setFilterVisible(path, this.visible);
    } else {
      await this.plugin.createFilter(name, this.c, this.o, this.color, !this.visible);
    }
    this.close();
  }
  async remove() {
    if (!this.editPath) return;
    await this.plugin.deleteFilter(this.editPath);
    this.close();
  }
};

// src/newItemModal.ts
var import_obsidian15 = require("obsidian");
var ICON = { project: "folder", area: "circle", label: "hash" };
var TITLE = { project: "new_project_title", area: "new_area_title", label: "new_label_title" };
var EDIT_TITLE = { project: "edit_project_title", area: "edit_area_title", label: "edit_label_title" };
var PH = { project: "placeholder_project_name", area: "placeholder_area_name", label: "placeholder_label" };
var NewItemModal = class extends import_obsidian15.Modal {
  constructor(plugin, kind, edit) {
    super(plugin.app);
    this.plugin = plugin;
    this.kind = kind;
    this.edit = edit;
    this.syncExcluded = false;
    // aktueller Stand des Sync-Toggles
    this.syncExcludedInit = null;
    this.name = edit?.name ?? "";
    this.color = edit?.color ?? null;
    this.visible = edit ? edit.visible : true;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-new-modal");
    contentEl.createEl("h3", { text: t((this.edit ? EDIT_TITLE : TITLE)[this.kind]) });
    const nameField = contentEl.createDiv({ cls: "bt-new-field" });
    nameField.createEl("label", { text: t("filter_name") });
    const input = nameField.createEl("input", { cls: "bt-new-input", attr: { type: "text", placeholder: t(PH[this.kind]) } });
    input.value = this.name;
    input.oninput = () => {
      this.name = input.value;
      this.updatePreview();
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void this.submit();
      }
    };
    const colorField = contentEl.createDiv({ cls: "bt-new-field" });
    colorField.createEl("label", { text: t("status_pick_color") });
    buildSwatchRow(colorField.createDiv({ cls: "bt-color-box" }), this.color, (c) => {
      this.color = c;
      this.updatePreview();
    });
    const visRow = contentEl.createDiv({ cls: "bt-new-row" });
    visRow.createEl("label", { text: t("show_in_sidebar") });
    const sw = visRow.createDiv({ cls: "bt-mrow-switch" + (this.visible ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(this.visible), tabindex: "0" } });
    const flip = () => {
      this.visible = !this.visible;
      sw.toggleClass("is-on", this.visible);
      sw.setAttr("aria-checked", String(this.visible));
    };
    sw.onclick = flip;
    sw.onkeydown = (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        flip();
      }
    };
    if (this.edit && this.kind !== "label" && this.plugin.gcalSync.canSync()) {
      this.syncExcludedInit = this.plugin.isListGcalExcluded(this.edit.key);
      this.syncExcluded = this.syncExcludedInit;
      const on = () => !this.syncExcluded;
      const syncRow = contentEl.createDiv({ cls: "bt-new-row" });
      syncRow.createEl("label", { text: t("gcal_sync_list") });
      const sw2 = syncRow.createDiv({ cls: "bt-mrow-switch" + (on() ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(on()), tabindex: "0" } });
      const flip2 = () => {
        this.syncExcluded = !this.syncExcluded;
        sw2.toggleClass("is-on", on());
        sw2.setAttr("aria-checked", String(on()));
      };
      sw2.onclick = flip2;
      sw2.onkeydown = (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          flip2();
        }
      };
    }
    const prev = contentEl.createDiv({ cls: "bt-new-preview" });
    this.previewIc = prev.createSpan({ cls: "bt-new-preview-ic" });
    (0, import_obsidian15.setIcon)(this.previewIc, ICON[this.kind]);
    this.previewNm = prev.createSpan({ cls: "bt-new-preview-nm" });
    prev.createSpan({ cls: "bt-new-preview-hint", text: t("new_preview_hint") });
    this.updatePreview();
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    const danger = foot.createDiv({ cls: "bt-actions" });
    if (this.edit) {
      if (this.kind !== "label") danger.createEl("button", { text: t("btn_archive") }).onclick = () => {
        this.plugin.archiveWithUndo(this.edit.key, this.edit.name);
        this.close();
      };
      danger.createEl("button", { cls: "mod-warning", text: t("btn_delete") }).onclick = () => this.confirmDelete();
    }
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: t(this.edit ? "btn_save" : "btn_create") }).onclick = () => void this.submit();
    window.setTimeout(() => {
      input.focus();
      input.select();
    }, 0);
  }
  onClose() {
    this.contentEl.empty();
  }
  updatePreview() {
    this.previewNm.setText(this.name.trim() || t(PH[this.kind]));
    this.previewIc.style.color = this.color ?? "var(--text-muted)";
  }
  /** Löschen mit Sicherheitsabfrage (nur im Bearbeiten-Modus). */
  confirmDelete() {
    const e = this.edit;
    new ConfirmModal(
      this.app,
      { title: t("confirm_delete_title", e.name), message: t("confirm_delete_body") },
      () => {
        if (this.kind === "label") void this.plugin.deleteLabel(e.key);
        else void this.plugin.deleteProject(e.key);
        this.close();
      }
    ).open();
  }
  async submit() {
    const name = this.name.trim();
    if (!name) {
      new import_obsidian15.Notice(t("new_need_name"));
      return;
    }
    if (this.edit) await this.applyEdit(name);
    else await this.applyNew(name);
    this.close();
  }
  /** Anlegen: Notiz/Label erstellen, Farbe + Sichtbarkeit setzen. */
  async applyNew(name) {
    if (this.kind === "label") {
      const nu = normalizeLabel(name);
      await this.plugin.addLabel(name);
      if (nu) {
        if (this.visible) await this.plugin.setLabelVisible(nu, true);
        if (this.color) await this.plugin.setLabelColor(nu, this.color);
      }
    } else {
      await this.plugin.createProject(name, this.kind === "area", this.color, !this.visible);
    }
  }
  /** Bearbeiten: Farbe & Sichtbarkeit anwenden, ZULETZT umbenennen (Rename zieht Farbe/Sichtbarkeit mit). */
  async applyEdit(name) {
    const e = this.edit;
    if (this.kind === "label") {
      if (this.color !== e.color) await this.plugin.setLabelColor(e.key, this.color);
      if (this.visible !== e.visible) await this.plugin.setLabelVisible(e.key, this.visible);
      if (name !== e.name) await this.plugin.renameLabel(e.key, name);
    } else {
      if (this.color !== e.color) await this.plugin.setProjectColor(e.key, this.color);
      if (this.visible !== e.visible) await this.plugin.setProjectVisible(e.key, this.visible);
      if (this.syncExcludedInit !== null && this.syncExcluded !== this.syncExcludedInit) await this.plugin.setListGcalExcluded(e.key, this.syncExcluded);
      if (name !== e.name) await this.plugin.renameProject(e.key, name);
    }
  }
};

// src/navMenu.ts
function addGcalSyncItem(menu, plugin, path) {
  if (!plugin.gcalSync.canSync()) return false;
  const excluded = plugin.isListGcalExcluded(path);
  menu.addItem((m) => m.setSection("bt-gcal").setTitle(excluded ? t("menu_gcal_include") : t("menu_gcal_exclude")).setIcon(excluded ? "calendar-sync" : "calendar-off").onClick(() => void plugin.setListGcalExcluded(path, !excluded)));
  return true;
}
function openEdit(plugin, item) {
  if (item.sec === "filters") {
    new FilterModal(plugin, item.key).open();
    return;
  }
  const kind = item.sec === "labels" ? "label" : item.type ?? "project";
  new NewItemModal(plugin, kind, { key: item.key, name: item.name, color: item.color ?? null, visible: !item.hidden }).open();
}
function setVisible(plugin, sec, key, visible) {
  if (sec === "filters") return plugin.setFilterVisible(key, visible);
  if (sec === "labels") return plugin.setLabelVisible(key, visible);
  return plugin.setProjectVisible(key, visible);
}
function deleteItem(plugin, item) {
  if (item.sec === "filters") return plugin.deleteFilter(item.key);
  if (item.sec === "labels") return plugin.deleteLabel(item.key);
  return plugin.deleteProject(item.key);
}
function renameItem(plugin, item, v) {
  if (item.sec === "filters") {
    void plugin.renameFilter(item.key, v);
    return;
  }
  if (item.sec === "labels") {
    void plugin.renameLabel(item.key, v);
    return;
  }
  void plugin.renameProject(item.key, v);
}
var GOTO_KEY = {
  projects: "menu_goto_projects",
  areas: "menu_goto_areas",
  labels: "menu_goto_labels",
  filters: "menu_goto_filters"
};
function buildItemMenu(menu, plugin, item, source = "sidebar") {
  const isProjLike = item.sec === "projects" || item.sec === "areas";
  const fromSidebar = source === "sidebar";
  const onBoard = source === "board";
  if (onBoard) {
    menu.addItem((m) => m.setSection("bt-goto").setTitle(t(GOTO_KEY[item.sec])).setIcon("list-plus").onClick(() => void plugin.activateManage(item.sec)));
  }
  menu.addItem((m) => m.setSection("bt-edit").setTitle(t("menu_edit")).setIcon("pencil").onClick(() => openEdit(plugin, item)));
  menu.addItem((m) => m.setSection("bt-edit").setTitle(t("btn_rename")).setIcon("text-cursor-input").onClick(() => new PromptModal(
    plugin.app,
    { title: t("btn_rename"), value: item.name },
    (v) => renameItem(plugin, item, v)
  ).open()));
  if (isProjLike) {
    const toArea = item.type !== "area";
    menu.addItem((m) => m.setSection("bt-edit").setTitle(toArea ? t("tip_mark_area") : t("tip_unmark_area")).setIcon(toArea ? "circle-small" : "folder").onClick(() => void plugin.setProjectArea(item.key, toArea)));
  }
  menu.addItem((m) => m.setSection("bt-arrange").setTitle(item.hidden ? t("tip_show_sidebar") : t("tip_hide_sidebar")).setIcon(item.hidden ? "eye" : "eye-off").onClick(() => void setVisible(plugin, item.sec, item.key, item.hidden)));
  if (fromSidebar) {
    menu.addItem((m) => m.setSection("bt-arrange").setTitle(t("menu_reorder")).setIcon("arrow-up-down").onClick(() => void plugin.startReorder(item.sec)));
  }
  if (!onBoard) {
    menu.addItem((m) => m.setSection("bt-arrange").setTitle(t("btn_move_up")).setIcon("chevron-up").onClick(() => void (fromSidebar ? plugin.moveNavItemVisible(item.sec, item.key, -1) : plugin.moveNavItem(item.sec, item.key, -1))));
    menu.addItem((m) => m.setSection("bt-arrange").setTitle(t("btn_move_down")).setIcon("chevron-down").onClick(() => void (fromSidebar ? plugin.moveNavItemVisible(item.sec, item.key, 1) : plugin.moveNavItem(item.sec, item.key, 1))));
  }
  if (isProjLike) addGcalSyncItem(menu, plugin, item.key);
  if (isProjLike) {
    menu.addItem((m) => m.setSection("bt-danger").setTitle(t("btn_archive")).setIcon("archive").onClick(() => plugin.archiveWithUndo(item.key, item.name)));
  }
  menu.addItem((m) => m.setSection("bt-danger").setTitle(t("btn_delete")).setIcon("trash-2").setWarning(true).onClick(() => new ConfirmModal(
    plugin.app,
    { title: t("confirm_delete_title", item.name), message: t("confirm_delete_body") },
    () => void deleteItem(plugin, item)
  ).open()));
}
function hiddenOf(plugin, sec) {
  if (sec === "filters") return listFilters(plugin.app).filter((f) => f.hidden).map((f) => ({ key: f.path, name: f.name }));
  if (sec === "labels") return plugin.getLabels().filter((l) => !plugin.isLabelVisible(l.name)).map((l) => ({ key: l.name, name: l.name }));
  const want = sec === "areas" ? "area" : "project";
  return listManaged(plugin.app).active.filter((p) => p.type === want && p.hidden).map((p) => ({ key: p.path, name: p.name }));
}
function showHiddenSubmenu(menu, plugin, sec) {
  const hidden = hiddenOf(plugin, sec);
  if (!hidden.length) return false;
  menu.addItem((parent) => {
    parent.setTitle(t("menu_reveal_hidden")).setIcon("eye");
    const sub = parent.setSubmenu();
    for (const h of hidden) {
      sub.addItem((m) => m.setTitle(h.name).setIcon("eye-off").onClick(() => void setVisible(plugin, sec, h.key, true)));
    }
  });
  return true;
}

// src/viewPanel.ts
var import_obsidian16 = require("obsidian");
function groupOptions(kind) {
  const base = ["none", "date", "deadline", "priority"];
  if (kind === "project") base.push("label");
  else if (kind === "label") base.push("project");
  else {
    base.push("label");
    base.push("project");
  }
  return base;
}
function openViewPanel(anchor, plugin) {
  const page = plugin.currentPage();
  if (page.tier === "none") return;
  openPopover(anchor, (pop, close) => {
    let o = plugin.pageViewOptions();
    const apply = (patch) => {
      o = { ...o, ...patch };
      void plugin.setPageViewOption(patch);
      render();
    };
    const cap = (text) => {
      pop.createDiv({ cls: "bt-panel-cap", text });
    };
    const render = () => {
      pop.empty();
      pop.addClass("bt-view-panel");
      const seg = pop.createDiv({ cls: "bt-tabs bt-layout-toggle" });
      for (const l of LAYOUTS) {
        const b = seg.createEl("button", { cls: "bt-tab" + (o.layout === l ? " is-active" : ""), text: t("layout_" + l) });
        b.onclick = () => apply({ layout: l });
      }
      if (page.key !== "demnaechst") {
        const doneRow = pop.createDiv({ cls: "bt-panel-row" });
        doneRow.createSpan({ cls: "bt-panel-k", text: t("panel_show_done") });
        const sw = doneRow.createDiv({ cls: "bt-panel-switch" + (o.showDone ? " is-on" : "") });
        sw.onclick = () => apply({ showDone: !o.showDone });
      }
      if (o.layout !== "calendar" && (page.tier === "full" || page.key === "heute")) {
        cap(t("filter_arrange"));
        const box = pop.createDiv({ cls: "bt-panel-tight" });
        ddRow(box, t("filter_sort"), SORTS, o.sort, "filter_sort_", (v) => apply({ sort: v }));
        const groups = o.layout === "board" ? groupOptions(page.kind).filter((g) => g !== "date" && g !== "deadline") : groupOptions(page.kind);
        const shownGroup = groups.includes(o.group) ? o.group : "none";
        const groupLabelFor = o.layout === "board" ? (v) => v === "none" ? t("filter_group_status") : t("filter_group_" + v) : void 0;
        ddRow(box, t("filter_group"), groups, shownGroup, "filter_group_", (v) => apply({ group: v }), groupLabelFor);
        if (hasSortDir(o.sort)) {
          ddRow(box, t("filter_dir"), SORT_DIRS, o.sortDir, "filter_dir_", (v) => apply({ sortDir: v }));
        }
      }
      const reset = pop.createEl("button", { cls: "bt-panel-reset", text: t("filter_reset") });
      reset.onclick = () => {
        void plugin.resetPageViewOptions();
        o = { ...DEFAULT_OPTIONS };
        render();
      };
    };
    render();
    void close;
  });
}
function ddRow(parent, label, values, current2, keyPrefix, onChange, labelFor) {
  const row = parent.createDiv({ cls: "bt-panel-row" });
  row.createSpan({ cls: "bt-panel-k", text: label });
  const textOf = (v) => labelFor?.(v) ?? t(keyPrefix + v);
  const btn = row.createEl("button", { cls: "bt-facet-dd bt-panel-dd" });
  btn.createSpan({ cls: "bt-facet-dd-lbl", text: textOf(current2) });
  (0, import_obsidian16.setIcon)(btn.createSpan({ cls: "bt-facet-dd-chev" }), "chevron-down");
  btn.onclick = (e) => {
    e.stopPropagation();
    openPopover(btn, (pop, close) => {
      pop.addClass("bt-facet-pop");
      for (const v of values) {
        const on = v === current2;
        const r = pop.createDiv({ cls: "bt-row" + (on ? " is-active" : "") });
        const ic = r.createSpan({ cls: "bt-row-ic" });
        if (on) (0, import_obsidian16.setIcon)(ic, "check");
        r.createSpan({ cls: "bt-row-lbl", text: textOf(v) });
        r.onclick = () => {
          close();
          onChange(v);
        };
      }
    });
  };
}
function anzeigeButton(head, plugin) {
  const btn = head.createEl("button", { cls: "bt-anzeige" });
  (0, import_obsidian16.setIcon)(btn.createSpan({ cls: "bt-anzeige-ic" }), "sliders-horizontal");
  btn.createSpan({ cls: "bt-anzeige-lbl", text: t("view_display") });
  const o = plugin.pageViewOptions();
  const modified = o.layout !== DEFAULT_OPTIONS.layout || o.sort !== DEFAULT_OPTIONS.sort || o.group !== DEFAULT_OPTIONS.group || o.showDone !== DEFAULT_OPTIONS.showDone || o.sortDir !== DEFAULT_OPTIONS.sortDir;
  if (modified) btn.createSpan({ cls: "bt-anzeige-dot" });
  btn.onclick = () => openViewPanel(btn, plugin);
}

// src/manageView.ts
var import_obsidian17 = require("obsidian");
function sortControl(parent, plugin, sec) {
  const wrap = parent.createDiv({ cls: "bt-sort-control" });
  wrap.createSpan({ cls: "bt-sort-lbl", text: t("sort_by") });
  const seg = wrap.createDiv({ cls: "bt-tabs bt-layout-toggle" });
  const mk = (mode, label) => {
    const b = seg.createEl("button", { cls: "bt-tab" + (plugin.navSortMode(sec) === mode ? " is-active" : ""), text: label });
    b.onclick = () => void plugin.setNavSort(sec, mode);
  };
  mk("manual", t("sort_manual"));
  mk("name", t("sort_name"));
  mk("count", t("sort_count"));
}
function reorderHandle(row, list, plugin, sec, key) {
  row.setAttr("data-key", key);
  const grip = row.createSpan({ cls: "bt-nav-grip", attr: { role: "button", tabindex: "0", "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
  (0, import_obsidian17.setIcon)(grip, "grip-vertical");
  grip.onkeydown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      void plugin.moveNavItem(sec, key, -1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      void plugin.moveNavItem(sec, key, 1);
    }
  };
  attachRowDrag(row, grip, list, (keys) => void plugin.setNavOrder(sec, keys));
  row.prepend(grip);
}
function attachRowDrag(row, grip, list, onDrop) {
  grip.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    const doc = list.ownerDocument;
    row.addClass("is-dragging");
    const onMove = (me) => {
      const y = me.clientY;
      const siblings = Array.from(list.children).filter((el) => el !== row);
      let placed = false;
      for (const sib of siblings) {
        const r = sib.getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          list.insertBefore(row, sib);
          placed = true;
          break;
        }
      }
      if (!placed) list.appendChild(row);
    };
    const onUp = () => {
      row.removeClass("is-dragging");
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      const keys = Array.from(list.children).map((el) => el.getAttr("data-key")).filter((k) => !!k);
      onDrop(keys);
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  });
}
function iconBtn(parent, icon, label, onClick) {
  const b = parent.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
  (0, import_obsidian17.setIcon)(b.createSpan(), icon);
  b.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return b;
}
function renderManageInto(c, plugin) {
  c.empty();
  c.addClass("bt-view");
  const root = c.createDiv({ cls: "bt-sizer" });
  const redraw = () => renderManageInto(c, plugin);
  const header = root.createDiv({ cls: "bt-manage-header" });
  const titleKey = plugin.manageSection === "filters" ? "nav_filters" : plugin.manageSection === "labels" ? "tab_labels" : plugin.manageSection === "areas" ? "group_area" : "group_project";
  header.createEl("h1", { text: t(titleKey) });
  if (plugin.manageSection === "projects" || plugin.manageSection === "areas") {
    const tabs = header.createDiv({ cls: "bt-tabs" });
    const mkTab = (id, label) => {
      const b = tabs.createEl("button", { cls: "bt-tab" + (plugin.manageTab === id ? " is-active" : ""), text: label });
      b.onclick = () => {
        plugin.manageTab = id;
        renderManageInto(c, plugin);
      };
    };
    mkTab("active", t("tab_active"));
    mkTab("archive", t("tab_archive"));
  }
  if (plugin.manageSection === "filters") {
    const add = root.createDiv({ cls: "bt-manage-add" });
    const btn = add.createDiv({ cls: "bt-add" });
    btn.createSpan({ cls: "bt-add-icon" });
    btn.createSpan({ text: t("filter_add") });
    btn.onclick = () => new FilterModal(plugin).open();
    sortControl(root, plugin, "filters");
    const filters = plugin.sortFilters(listFilters(plugin.app));
    if (!filters.length) {
      root.createEl("p", { cls: "bt-empty", text: t("manage_empty_filters") });
      return;
    }
    const manual2 = plugin.navSortMode("filters") === "manual";
    const list2 = root.createDiv({ cls: "bt-manage-list" });
    filters.forEach((fl) => filterRow(list2, plugin, fl, redraw, manual2 ? "filters" : void 0));
    return;
  }
  if (plugin.manageSection === "labels") {
    addRow(root, t("add_label"), t("placeholder_label"), (v) => plugin.addLabel(v), redraw);
    sortControl(root, plugin, "labels");
    const labels = plugin.sortLabels(plugin.getLabels());
    if (!labels.length) {
      root.createEl("p", { cls: "bt-empty", text: t("manage_empty_labels") });
      return;
    }
    const manual2 = plugin.navSortMode("labels") === "manual";
    const list2 = root.createDiv({ cls: "bt-manage-list" });
    labels.forEach((l) => labelRow(list2, plugin, l, redraw, manual2 ? "labels" : void 0));
    return;
  }
  const isAreaSection = plugin.manageSection === "areas";
  const wantType = isAreaSection ? "area" : "project";
  addRow(
    root,
    isAreaSection ? t("pick_new_area") : t("pick_new_project"),
    isAreaSection ? t("placeholder_area_name") : t("placeholder_project_name"),
    (v) => plugin.createProject(v, isAreaSection),
    redraw
  );
  const { active, archived } = listManaged(plugin.app);
  if (plugin.manageTab === "archive") {
    const items2 = archived.filter((p) => p.type === wantType);
    if (!items2.length) {
      root.createEl("p", { cls: "bt-empty", text: t("manage_empty_archive") });
      return;
    }
    const list2 = root.createDiv({ cls: "bt-manage-list" });
    for (const it of items2) archiveRow(list2, plugin, it, redraw);
    return;
  }
  const sec = isAreaSection ? "areas" : "projects";
  sortControl(root, plugin, sec);
  const items = plugin.sortProjItems(sec, active.filter((p) => p.type === wantType));
  if (!items.length) {
    root.createEl("p", { cls: "bt-empty", text: t(isAreaSection ? "manage_empty_areas" : "manage_empty_projects") });
    return;
  }
  const manual = plugin.navSortMode(sec) === "manual";
  const list = root.createDiv({ cls: "bt-manage-list" });
  items.forEach((it) => activeRow(list, plugin, it, redraw, manual ? sec : void 0));
}
function addRow(parent, label, placeholder, onSubmit, redraw) {
  const wrap = parent.createDiv({ cls: "bt-manage-add" });
  const btn = wrap.createDiv({ cls: "bt-add" });
  btn.createSpan({ cls: "bt-add-icon" });
  btn.createSpan({ text: label });
  btn.onclick = () => {
    wrap.empty();
    const input = wrap.createEl("input", { type: "text", cls: "bt-manage-input", attr: { placeholder } });
    const done = () => void (async () => {
      const v = input.value.trim();
      if (v) await onSubmit(v);
      redraw();
    })();
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        done();
      } else if (e.key === "Escape") {
        e.preventDefault();
        redraw();
      }
    };
    window.setTimeout(() => input.focus(), 0);
  };
}
function colorDot(row, plugin, current2, previewKey, defaultColor, onPick) {
  const dot = row.createDiv({ cls: "bt-mrow-dot", attr: { "aria-label": t("status_pick_color"), "data-tooltip-position": "top" } });
  dot.style.setProperty("--c", current2 ?? defaultColor);
  dot.onclick = (e) => {
    e.stopPropagation();
    openColorPicker(dot, current2, onPick, { onPreview: (c) => plugin.setColorPreview(previewKey, c), onClose: () => plugin.clearColorPreview() });
  };
}
function syncSwitch(row, plugin, path) {
  if (!plugin.gcalSync.canSync()) return;
  let excluded = plugin.isListGcalExcluded(path);
  const btn = row.createDiv({ cls: "bt-mrow-sync", attr: { role: "switch", "data-tooltip-position": "top", tabindex: "0" } });
  const paint = () => {
    (0, import_obsidian17.setIcon)(btn, excluded ? "calendar-off" : "calendar-sync");
    btn.toggleClass("is-off", excluded);
    btn.setAttr("aria-checked", String(!excluded));
    btn.setAttr("aria-label", excluded ? t("menu_gcal_include") : t("menu_gcal_exclude"));
  };
  paint();
  const toggle = () => {
    excluded = !excluded;
    paint();
    void plugin.setListGcalExcluded(path, excluded);
  };
  btn.onclick = (e) => {
    e.stopPropagation();
    toggle();
  };
  btn.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  };
}
function visSwitch(row, on, onToggle) {
  const sw = row.createDiv({ cls: "bt-mrow-switch" + (on ? " is-on" : ""), attr: { role: "switch", "aria-checked": String(on), "aria-label": on ? t("tip_hide_sidebar") : t("tip_show_sidebar"), "data-tooltip-position": "top", tabindex: "0" } });
  sw.onclick = (e) => {
    e.stopPropagation();
    onToggle();
  };
  sw.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onToggle();
    }
  };
}
function rowMenu(actions, plugin, it) {
  const kebab = actions.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": t("more_actions"), "data-tooltip-position": "top" } });
  (0, import_obsidian17.setIcon)(kebab.createSpan(), "more-horizontal");
  kebab.onclick = (e) => {
    e.stopPropagation();
    const menu = new import_obsidian17.Menu();
    buildItemMenu(menu, plugin, { sec: it.type === "area" ? "areas" : "projects", key: it.path, name: it.name, hidden: it.hidden, color: it.color, type: it.type }, "manage");
    menu.showAtMouseEvent(e);
  };
}
function activeRow(list, plugin, it, redraw, reorderSec) {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorderSec) reorderHandle(row, list, plugin, reorderSec, it.path);
  const isArea = it.type === "area";
  colorDot(row, plugin, it.color, it.path, isArea ? "var(--bt-nav-area)" : "var(--bt-nav-project)", (c) => void plugin.setProjectColor(it.path, c));
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  const actions = row.createDiv({ cls: "bt-manage-actions bt-hover-acts" });
  iconBtn(actions, "pencil", t("btn_rename"), () => startRename(row, plugin, it, redraw));
  iconBtn(actions, "archive", t("btn_archive"), () => void plugin.archiveProject(it.path, true));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteProject(it.path), redraw));
  rowMenu(actions, plugin, it);
  row.createSpan({ cls: "bt-manage-count", text: String(plugin.index.byProject(it.path).length) });
  syncSwitch(row, plugin, it.path);
  visSwitch(row, !it.hidden, () => void plugin.setProjectVisible(it.path, it.hidden));
}
function archiveRow(list, plugin, it, redraw) {
  const row = list.createDiv({ cls: "bt-manage-row is-archived" });
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "archive-restore", t("btn_restore"), () => void plugin.archiveProject(it.path, false));
  iconBtn(actions, "trash-2", t("btn_delete_forever"), () => confirmInline(actions, t("confirm_delete_forever_q"), () => void plugin.deleteProject(it.path), redraw));
}
function labelRow(list, plugin, l, redraw, reorderSec) {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorderSec) reorderHandle(row, list, plugin, reorderSec, l.name);
  colorDot(row, plugin, plugin.getLabelColor(l.name), l.name, "var(--bt-nav-label)", (c) => void plugin.setLabelColor(l.name, c));
  const name = row.createSpan({ cls: "bt-manage-name", text: "#" + l.name });
  name.onclick = () => void plugin.activateLabel(l.name);
  const actions = row.createDiv({ cls: "bt-manage-actions bt-hover-acts" });
  iconBtn(actions, "pencil", t("btn_rename"), () => startLabelRename(row, plugin, l, redraw));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteLabel(l.name), redraw));
  row.createSpan({ cls: "bt-manage-count", text: String(l.count) });
  visSwitch(row, plugin.isLabelVisible(l.name), () => void plugin.setLabelVisible(l.name, !plugin.isLabelVisible(l.name)));
}
function filterRow(list, plugin, fl, redraw, reorderSec) {
  const row = list.createDiv({ cls: "bt-manage-row" });
  if (reorderSec) reorderHandle(row, list, plugin, reorderSec, fl.path);
  colorDot(row, plugin, fl.color, fl.path, "var(--text-muted)", (c) => void plugin.setFilterColor(fl.path, c));
  const name = row.createSpan({ cls: "bt-manage-name", text: fl.name });
  name.onclick = () => void plugin.activateFilter(fl.path);
  const actions = row.createDiv({ cls: "bt-manage-actions bt-hover-acts" });
  iconBtn(actions, "sliders-horizontal", t("filter_edit"), () => new FilterModal(plugin, fl.path).open());
  iconBtn(actions, "pencil", t("btn_rename"), () => startFilterRename(row, plugin, fl, redraw));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteFilter(fl.path), redraw));
  row.createSpan({ cls: "bt-manage-count", text: String(applyFilter(plugin.index, fl.criteria, fl.options, todayStr()).length) });
  visSwitch(row, !fl.hidden, () => void plugin.setFilterVisible(fl.path, fl.hidden));
}
function startFilterRename(row, plugin, fl, redraw) {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = fl.name;
  const save = async () => {
    const nu = input.value.trim();
    if (!nu || nu === fl.name) {
      redraw();
      return;
    }
    const r = await plugin.renameFilter(fl.path, nu);
    if (r === null) new import_obsidian17.Notice(t("err_enter_taskname"));
    redraw();
  };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      redraw();
    }
  };
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}
function startLabelRename(row, plugin, l, redraw) {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = l.name;
  const save = async () => {
    const ok = await plugin.renameLabel(l.name, input.value);
    if (!ok) {
      redraw();
      return;
    }
    redraw();
  };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      redraw();
    }
  };
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}
function startRename(row, plugin, it, redraw) {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = it.name;
  const save = async () => {
    const nu = input.value.trim();
    if (!nu || nu === it.name) {
      redraw();
      return;
    }
    const r = await plugin.renameProject(it.path, nu);
    if (r === null) new import_obsidian17.Notice(t("err_enter_taskname"));
    redraw();
  };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      redraw();
    }
  };
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}
var COLOR_PRESETS2 = ["#e05c4a", "#f97316", "#f59e0b", "#4caf50", "#3b82f6", "#7c5cff", "#a855f7", "#ec4899"];
function openColorPicker(anchor, current2, onPick, opts = {}) {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-color-grid");
    const none = pop.createEl("button", { cls: "bt-color-cell bt-color-none" + (!current2 ? " is-active" : ""), attr: { "aria-label": t("status_color_none") } });
    (0, import_obsidian17.setIcon)(none, "ban");
    none.onclick = () => {
      onPick(null);
      close();
    };
    for (const c of COLOR_PRESETS2) {
      const b = pop.createEl("button", { cls: "bt-color-cell" + (current2 === c ? " is-active" : ""), attr: { "aria-label": c } });
      b.style.setProperty("--bt-swatch", c);
      b.onclick = () => {
        onPick(c);
        close();
      };
    }
    const isPreset = !current2 || COLOR_PRESETS2.includes(current2);
    const custom = pop.createEl("button", { cls: "bt-color-cell bt-color-custom" + (isPreset ? "" : " is-active"), attr: { "aria-label": t("color_custom") } });
    if (!isPreset && current2) custom.style.setProperty("--bt-swatch", current2);
    else (0, import_obsidian17.setIcon)(custom, "pipette");
    const input = custom.createEl("input", { type: "color", cls: "bt-color-input" });
    if (current2 && /^#[0-9a-f]{6}$/i.test(current2)) input.value = current2;
    input.oninput = () => opts.onPreview?.(input.value);
    input.onchange = () => {
      onPick(input.value);
      close();
    };
  }, opts.onClose);
}
function confirmInline(actions, question, onConfirm, redraw) {
  actions.empty();
  actions.addClass("bt-confirm");
  actions.createSpan({ cls: "bt-confirm-q", text: question });
  iconBtn(actions, "check", t("btn_delete"), onConfirm);
  iconBtn(actions, "x", t("btn_cancel"), redraw);
}

// src/recurrence.ts
function parseRecurrence(rule) {
  const m = rule.trim().toLowerCase().match(/every\s+(\d+)?\s*(day|week|month|year)s?/);
  if (!m) return null;
  return { n: m[1] ? parseInt(m[1], 10) : 1, unit: m[2] };
}
var z4 = (n) => String(n).padStart(2, "0");
var toIso = (d) => d.getFullYear() + "-" + z4(d.getMonth() + 1) + "-" + z4(d.getDate());
var addDays4 = (isoDate2, days) => {
  const d = /* @__PURE__ */ new Date(isoDate2 + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
};
function advance(isoDate2, rule) {
  const d = /* @__PURE__ */ new Date(isoDate2 + "T00:00:00");
  if (rule.unit === "day") d.setDate(d.getDate() + rule.n);
  else if (rule.unit === "week") d.setDate(d.getDate() + rule.n * 7);
  else if (rule.unit === "month") d.setMonth(d.getMonth() + rule.n);
  else d.setFullYear(d.getFullYear() + rule.n);
  return toIso(d);
}
function advanceUntilFuture(isoDate2, rule, today) {
  let d = advance(isoDate2, rule);
  let guard = 0;
  while (d <= today && guard++ < 1e3) d = advance(d, rule);
  return d;
}
var ms = (iso4) => (/* @__PURE__ */ new Date(iso4 + "T00:00:00")).getTime();
function nextInstance(task, today) {
  if (!task.recurrence) return null;
  const rule = parseRecurrence(task.recurrence);
  if (!rule) return null;
  const fromDone = task.recurBasis === "done";
  if (task.due) {
    const nextDue = advanceUntilFuture(fromDone ? today : task.due, rule, today);
    let nextScheduled = null;
    if (task.scheduled) {
      const gap = Math.round((ms(task.scheduled) - ms(task.due)) / 864e5);
      nextScheduled = addDays4(nextDue, gap);
    }
    return { due: nextDue, scheduled: nextScheduled };
  }
  if (task.scheduled) {
    return { due: null, scheduled: advanceUntilFuture(fromDone ? today : task.scheduled, rule, today) };
  }
  return null;
}

// src/calendarView.ts
var import_obsidian19 = require("obsidian");

// src/taskCheck.ts
var import_obsidian18 = require("obsidian");
function renderCheck(parent, _plugin, task, opts = {}) {
  const check = parent.createDiv({ cls: "bt-check" + (opts.compact ? " bt-check-sm" : "") });
  if (opts.trash) {
    check.addClass("bt-check-x");
    (0, import_obsidian18.setIcon)(check, "x");
    return check;
  }
  check.dataset.check = task.path;
  if (isDone(task.status)) {
    check.addClass("is-done");
    const c = statusColor(task.status);
    if (c) {
      check.style.backgroundColor = c;
      check.style.borderColor = c;
    }
  } else {
    if (task.status !== firstOpenStatus()) {
      check.addClass("bt-check-status");
      (0, import_obsidian18.setIcon)(check, statusIcon(task.status));
      check.style.setProperty("--bt-status-col", statusTint(task.status));
    } else {
      const c = statusColor(task.status);
      if (c) check.style.borderColor = c;
    }
    if (task.priority === "highest" || task.priority === "high" || task.priority === "medium") check.dataset.prio = task.priority;
  }
  return check;
}
function installCheckDelegation(root, plugin) {
  const taskOf = (e) => {
    const el = e.target?.closest(".bt-check[data-check]");
    if (!el) return null;
    return plugin.index.get(el.dataset.check) ?? null;
  };
  let longFired = false;
  root.addEventListener("click", (e) => {
    const task = taskOf(e);
    if (!task) return;
    e.stopPropagation();
    if (longFired) {
      longFired = false;
      return;
    }
    void plugin.toggleDone(task);
  }, true);
  root.addEventListener("contextmenu", (e) => {
    const task = taskOf(e);
    if (!task) return;
    e.preventDefault();
    e.stopPropagation();
    showStatusMenu(plugin, task, e.clientX, e.clientY);
  }, true);
  let timer = null;
  const clear = () => {
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
  };
  root.addEventListener("touchstart", (e) => {
    const task = taskOf(e);
    if (!task) return;
    const p = e.touches[0];
    const x = p.clientX, y = p.clientY;
    longFired = false;
    timer = window.setTimeout(() => {
      timer = null;
      longFired = true;
      showStatusMenu(plugin, task, x, y);
    }, 500);
  }, { passive: true, capture: true });
  root.addEventListener("touchend", clear);
  root.addEventListener("touchmove", clear);
  root.addEventListener("touchcancel", clear);
}
function showStatusMenu(plugin, task, x, y) {
  const menu = new import_obsidian18.Menu();
  for (const s of allStatuses()) {
    if (s.kind === "cancelled") menu.addSeparator();
    menu.addItem((it) => {
      it.setTitle(s.kind === "cancelled" ? t("menu_cancel_task") : statusLabel(s.id));
      it.setIcon(statusIcon(s.id));
      it.setChecked(task.status === s.id);
      it.onClick(() => {
        if (s.kind === "cancelled") void plugin.cancelTask(task);
        else void plugin.setTaskStatus(task, s.id);
      });
    });
  }
  menu.showAtPosition({ x, y });
}

// src/calendarView.ts
var HOUR_PX = 60;
var SNAP_MIN = 15;
var MIN_DUR = 15;
var TWO_LINE_PX = 34;
var DAY_START_HOUR = 7;
var anchors = /* @__PURE__ */ new Map();
var pageKey = (plugin) => (plugin.currentProject ?? plugin.currentLabel ?? plugin.currentFilter ?? plugin.currentView ?? "") + "|cal";
var dragPath = null;
var z5 = (n) => String(n).padStart(2, "0");
var hhmm = (min) => z5(Math.floor(min / 60)) + ":" + z5(min % 60);
var span = (from, to) => hhmm(from) + " \u2013 " + hhmm(to);
var snap = (min) => Math.max(0, Math.min(1425, Math.round(min / SNAP_MIN) * SNAP_MIN));
var weekdayShort2 = (dayIdx) => new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(new Date(2021, 7, 1 + dayIdx));
var monthYear2 = (isoDate2) => new Intl.DateTimeFormat(getLocale(), { month: "long", year: "numeric" }).format(parseISO(isoDate2));
var mounts = /* @__PURE__ */ new WeakMap();
function calSignature(plugin, opts) {
  const key = pageKey(plugin);
  const today = todayStr();
  return [key, opts.calMode, anchors.get(key) ?? today, opts.showDone, opts.calPanel, today].join("|");
}
function tryPatchCalendar(c, plugin) {
  const m = mounts.get(c);
  if (!m || !m.root.isConnected) return false;
  const opts = plugin.pageViewOptions();
  if (opts.layout !== "calendar") return false;
  if (m.sig !== calSignature(plugin, opts)) return false;
  m.paint(m.source());
  return true;
}
function calendarDayAnchor(plugin, opts) {
  if (opts.layout !== "calendar" || opts.calMode !== "day") return null;
  return anchors.get(pageKey(plugin)) ?? todayStr();
}
function renderCalendar(root, plugin, source, today, opts, redraw, add = {}) {
  const tasks = source();
  root.addClass("bt-sizer-board");
  root.addClass("bt-calview-host");
  root.parentElement?.addClass("bt-view-calendar");
  const key = pageKey(plugin);
  const anchor = anchors.get(key) ?? today;
  const mode = opts.calMode;
  const go = (next) => {
    anchors.set(key, next);
    redraw();
  };
  const step = (dir) => go(
    mode === "year" ? addYears(anchor, dir) : mode === "month" ? addMonths(anchor, dir) : addDays2(anchor, dir * (mode === "week" ? 7 : 1))
  );
  const head = root.createDiv({ cls: "bt-calview-head" });
  const nav = head.createDiv({ cls: "bt-calview-nav" });
  const navBtn = (icon, label, onClick) => {
    const b = nav.createEl("button", { cls: "bt-calview-nav-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
    (0, import_obsidian19.setIcon)(b, icon);
    b.onclick = onClick;
  };
  navBtn("chevron-left", t("cal_prev"), () => step(-1));
  const todayBtn = nav.createEl("button", { cls: "bt-calview-today", text: t("cal_today") });
  todayBtn.onclick = () => go(today);
  navBtn("chevron-right", t("cal_next"), () => step(1));
  head.createSpan({ cls: "bt-calview-title", text: rangeTitle(mode, anchor) });
  const seg = head.createDiv({ cls: "bt-tabs bt-calview-seg" });
  for (const m of CAL_MODES) {
    const b = seg.createEl("button", { cls: "bt-tab" + (mode === m ? " is-active" : ""), text: t("cal_mode_" + m) });
    b.onclick = () => void plugin.setPageViewOption({ calMode: m });
  }
  const unscheduledOf = (list) => list.filter((tk) => !tk.due && isOpen(tk.status));
  const panelUseful = mode !== "year";
  let setPanelCount = () => {
  };
  if (panelUseful) {
    const tgl = seg.createEl("button", {
      cls: "bt-tab bt-calview-panel-btn" + (opts.calPanel ? " is-active" : ""),
      attr: { "aria-label": t("cal_unscheduled"), "data-tooltip-position": "top" }
    });
    (0, import_obsidian19.setIcon)(tgl.createSpan({ cls: "bt-calview-panel-ic" }), "calendar-off");
    const n = tgl.createSpan({ cls: "bt-calview-panel-n" });
    setPanelCount = (count) => n.setText(count ? String(count) : "");
    tgl.onclick = () => void plugin.setPageViewOption({ calPanel: !opts.calPanel });
  }
  const zoom = (next, m) => {
    anchors.set(key, next);
    void plugin.setPageViewOption({ calMode: m });
  };
  const body = root.createDiv({ cls: "bt-calview-body" });
  const fillGrid = mode === "year" ? renderYear(body, plugin, anchor, today, zoom) : mode === "month" ? renderMonth(body, plugin, anchor, today, add) : renderTimeGrid(body, plugin, mode === "day" ? [anchor] : weekDays(anchor), today, add);
  const fillPanel = panelUseful && opts.calPanel ? renderUnscheduled(body, plugin, add) : null;
  const paint = (list) => {
    const unsched = unscheduledOf(list);
    fillGrid(bucketByDue(list));
    fillPanel?.(unsched);
    setPanelCount(unsched.length);
  };
  paint(tasks);
  const host = root.parentElement;
  if (host) mounts.set(host, { sig: calSignature(plugin, opts), root, source, paint });
}
function rangeTitle(mode, anchor) {
  if (mode === "year") return anchor.slice(0, 4);
  if (mode === "month") return monthYear2(anchor);
  if (mode === "day") {
    return new Intl.DateTimeFormat(getLocale(), { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(parseISO(anchor));
  }
  return weekTitle(anchor);
}
function weekTitle(anchor) {
  const days = weekDays(anchor);
  const a = parseISO(days[0]), b = parseISO(days[6]);
  const fmt = (d, withMonth) => new Intl.DateTimeFormat(getLocale(), withMonth ? { day: "numeric", month: "long" } : { day: "numeric" }).format(d);
  const year = new Intl.DateTimeFormat(getLocale(), { year: "numeric" }).format(b);
  return `${fmt(a, a.getMonth() !== b.getMonth())} \u2013 ${fmt(b, true)} ${year}`;
}
function renderYear(root, plugin, anchor, today, zoom) {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-year" });
  const cells = [];
  for (const first of yearMonths(anchor)) {
    const card = wrap.createDiv({ cls: "bt-calview-mini" });
    const title = card.createDiv({ cls: "bt-calview-mini-title", text: monthName(first) });
    title.onclick = () => zoom(first, "month");
    const grid = card.createDiv({ cls: "bt-calview-mini-grid" });
    for (const i of [1, 2, 3, 4, 5, 6, 0]) grid.createDiv({ cls: "bt-calview-mini-wd", text: weekdayShort2(i) });
    for (const day of monthGrid(first)) {
      const cell = grid.createDiv({ cls: "bt-calview-mini-day", text: String(parseISO(day).getDate()) });
      if (!sameMonth(day, first)) cell.addClass("is-other");
      if (day === today) cell.addClass("is-today");
      cell.onclick = () => zoom(day, "day");
      cells.push({ day, el: cell });
    }
  }
  return (buckets) => {
    for (const { day, el } of cells) {
      const n = (buckets.get(day) ?? []).length;
      el.toggleClass("has-tasks", n > 0);
      if (n) {
        el.setAttribute("aria-label", t("cal_tasks", n));
        el.setAttribute("data-tooltip-position", "top");
      } else {
        el.removeAttribute("aria-label");
      }
    }
  };
}
var monthName = (isoDate2) => new Intl.DateTimeFormat(getLocale(), { month: "long" }).format(parseISO(isoDate2));
var CELL_GAP = 2;
var CHIP_PX = 25;
var MORE_PX = 18;
var CHIPS_UNMEASURED = { all: 3, some: 3 };
function measureChips(grid, plugin, sample) {
  const probe = grid.createDiv({ cls: "bt-calview-probe" });
  renderChip(probe, plugin, sample);
  const chip = probe.firstElementChild;
  const more = probe.createDiv({ cls: "bt-calview-more", text: t("cal_more", 1) });
  const m = {
    chip: chip?.offsetHeight || CHIP_PX,
    more: more.offsetHeight || MORE_PX,
    gap: CELL_GAP
  };
  probe.remove();
  return m;
}
var firstTask = (buckets) => {
  for (const list of buckets.values()) if (list.length) return list[0];
  return null;
};
function renderMonth(root, plugin, anchor, today, add) {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-month" });
  const wd = wrap.createDiv({ cls: "bt-calview-weekdays" });
  for (const i of [1, 2, 3, 4, 5, 6, 0]) wd.createDiv({ cls: "bt-calview-wd", text: weekdayShort2(i) });
  const grid = wrap.createDiv({ cls: "bt-calview-grid" });
  const cells = [];
  for (const day of monthGrid(anchor)) {
    const cell = grid.createDiv({ cls: "bt-calview-cell" });
    if (!sameMonth(day, anchor)) cell.addClass("is-other");
    if (day === today) cell.addClass("is-today");
    const wdIdx = parseISO(day).getDay();
    if (wdIdx === 0 || wdIdx === 6) cell.addClass("is-weekend");
    const num = cell.createDiv({ cls: "bt-calview-daynum", text: String(parseISO(day).getDate()) });
    const addHere = () => plugin.openNewTaskOn(day, null, add.project ?? void 0, add.label);
    num.onclick = (e) => {
      e.stopPropagation();
      addHere();
    };
    cell.onclick = addHere;
    const cellBody = cell.createDiv({ cls: "bt-calview-cell-body" });
    cells.push({ day, body: cellBody });
    dropTarget(cell, plugin, (task) => combineDT(day, task.dueTime));
  }
  const fillCell = (day, body, items, fit2) => {
    body.empty();
    const shown = shownChips(items.length, fit2);
    const list = body.createDiv({ cls: "bt-calview-chips" });
    for (const tk of items.slice(0, shown)) renderChip(list, plugin, tk);
    if (items.length > shown) {
      const more = body.createDiv({ cls: "bt-calview-more", text: t("cal_more", items.length - shown) });
      more.onclick = (e) => {
        e.stopPropagation();
        openPopover(more, (pop) => {
          pop.addClass("bt-calview-pop");
          installCheckDelegation(pop, plugin);
          pop.createDiv({ cls: "bt-pop-head", text: dayTitle(day) });
          for (const tk of items) renderChip(pop, plugin, tk);
        });
      };
    }
  };
  let metrics = null;
  let fit = null;
  let last = /* @__PURE__ */ new Map();
  const currentFit = () => {
    const sample = firstTask(last);
    if (sample && !metrics) metrics = measureChips(grid, plugin, sample);
    const avail = cells[0]?.body.clientHeight ?? 0;
    if (!metrics || avail <= 0) return CHIPS_UNMEASURED;
    return chipsThatFit(avail, metrics);
  };
  const draw = () => {
    fit = currentFit();
    for (const { day, body } of cells) fillCell(day, body, sortDay(last.get(day) ?? []), fit);
  };
  const ro = new ResizeObserver(() => {
    if (!grid.isConnected) {
      ro.disconnect();
      return;
    }
    const next = currentFit();
    if (!fit || next.all !== fit.all || next.some !== fit.some) draw();
  });
  ro.observe(grid);
  return (buckets) => {
    last = buckets;
    draw();
  };
}
var dayTitle = (day) => new Intl.DateTimeFormat(getLocale(), { weekday: "long", day: "numeric", month: "long" }).format(parseISO(day));
function sortDay(list) {
  return [...list].sort((a, b) => {
    const da = isDone(a.status) ? 1 : 0, db = isDone(b.status) ? 1 : 0;
    if (da !== db) return da - db;
    const ta = a.dueTime ?? "99:99", tb = b.dueTime ?? "99:99";
    return ta.localeCompare(tb) || a.title.localeCompare(b.title);
  });
}
function renderTimeGrid(root, plugin, days, today, add) {
  const wrap = root.createDiv({ cls: "bt-calview bt-calview-week" + (days.length === 1 ? " bt-calview-day" : "") });
  const top = wrap.createDiv({ cls: "bt-calview-week-top" });
  const head = top.createDiv({ cls: "bt-calview-week-head" });
  head.createDiv({ cls: "bt-calview-gutter" });
  for (const day of days) {
    const d = head.createDiv({ cls: "bt-calview-dayhead" + (day === today ? " is-today" : "") });
    d.createSpan({ cls: "bt-calview-dayhead-wd", text: weekdayShort2(parseISO(day).getDay()) });
    d.createSpan({ cls: "bt-calview-dayhead-num", text: String(parseISO(day).getDate()) });
    d.onclick = () => plugin.openNewTaskOn(day, null, add.project ?? void 0, add.label);
  }
  const allday = top.createDiv({ cls: "bt-calview-allday", attr: { "aria-label": t("cal_allday") } });
  allday.createDiv({ cls: "bt-calview-gutter" });
  const alldayCells = /* @__PURE__ */ new Map();
  for (const day of days) {
    const cell = allday.createDiv({ cls: "bt-calview-allday-cell" + (day === today ? " is-today" : "") });
    alldayCells.set(day, cell);
    dropTarget(cell, plugin, () => day);
  }
  const gridWrap = wrap.createDiv({ cls: "bt-calview-timegrid" });
  gridWrap.style.setProperty("--bt-hour", HOUR_PX + "px");
  const gutter = gridWrap.createDiv({ cls: "bt-calview-gutter bt-calview-hours" });
  for (let h = 0; h < 24; h++) {
    const row = gutter.createDiv({ cls: "bt-calview-hour" });
    row.style.height = HOUR_PX + "px";
    if (h) row.createSpan({ text: z5(h) + ":00" });
  }
  const cols = /* @__PURE__ */ new Map();
  for (const day of days) {
    const col = gridWrap.createDiv({ cls: "bt-calview-daycol" + (day === today ? " is-today" : "") });
    col.style.height = 24 * HOUR_PX + "px";
    if (day === today) {
      const now = /* @__PURE__ */ new Date();
      const nowLine = col.createDiv({ cls: "bt-calview-now" });
      nowLine.style.top = (now.getHours() * 60 + now.getMinutes()) / 60 * HOUR_PX + "px";
    }
    col.onclick = (e) => {
      if (e.target !== col) return;
      plugin.openNewTaskOn(day, hhmm(snap(yToMin(e.clientY, col))), add.project ?? void 0, add.label);
    };
    dropTarget(col, plugin, (_task, ev) => combineDT(day, hhmm(snap(yToMin(ev.clientY, col)))));
    attachGhost(col, plugin);
    cols.set(day, col);
  }
  window.setTimeout(() => {
    if (wrap.isConnected) wrap.scrollTop = DAY_START_HOUR * HOUR_PX;
  }, 0);
  return (buckets) => {
    for (const day of days) {
      const dayTasks = sortDay(buckets.get(day) ?? []);
      const cell = alldayCells.get(day);
      cell.empty();
      for (const tk of allDayOf(dayTasks)) renderChip(cell, plugin, tk);
      const col = cols.get(day);
      for (const old of Array.from(col.children)) {
        if (old.hasClass("bt-calview-block")) old.remove();
      }
      for (const b of layoutDay(dayTasks)) {
        const el = col.createDiv({ cls: "bt-calview-block" });
        const h = Math.max(18, (b.endMin - b.startMin) / 60 * HOUR_PX - 2);
        el.style.top = b.startMin / 60 * HOUR_PX + "px";
        el.style.height = h + "px";
        el.style.left = `calc(${b.col / b.cols * 100}% + 2px)`;
        el.style.width = `calc(${1 / b.cols * 100}% - 4px)`;
        const compact = h < TWO_LINE_PX;
        if (compact) el.addClass("is-compact");
        decorate(el, plugin, b.task);
        renderCheck(el, plugin, b.task, { compact: true });
        const inner = el.createDiv({ cls: "bt-calview-block-in" });
        inner.createDiv({ cls: "bt-calview-block-title", text: b.task.title });
        if (!compact) inner.createDiv({ cls: "bt-calview-block-time", text: span(b.startMin, b.endMin) });
        dragSource(el, b.task);
        const grip = el.createDiv({ cls: "bt-calview-resize" });
        grip.onmousedown = (ev) => startResize(ev, el, b.task, b.startMin, plugin);
      }
    }
  };
}
function renderUnscheduled(body, plugin, add) {
  const panel = body.createDiv({ cls: "bt-calview-panel" });
  dropTarget(panel, plugin, () => "");
  const head = panel.createDiv({ cls: "bt-calview-panel-head" });
  head.createSpan({ cls: "bt-calview-panel-title", text: t("cal_unscheduled") });
  const count = head.createSpan({ cls: "bt-calview-panel-count" });
  const list = panel.createDiv({ cls: "bt-calview-panel-list" });
  const addEl = panel.createDiv({ cls: "bt-calview-panel-add" });
  (0, import_obsidian19.setIcon)(addEl.createSpan({ cls: "bt-calview-panel-add-ic" }), "plus");
  addEl.createSpan({ text: t("btn_add_task") });
  addEl.onclick = () => plugin.openNewTask(add.project ?? void 0, add.label);
  return (tasks) => {
    count.setText(String(tasks.length));
    list.empty();
    if (!tasks.length) {
      list.createDiv({ cls: "bt-calview-panel-empty", text: t("cal_unscheduled_empty") });
      return;
    }
    for (const tk of [...tasks].sort((a, b) => a.title.localeCompare(b.title))) {
      const card = list.createDiv({ cls: "bt-calview-panel-card" });
      decorate(card, plugin, tk);
      renderCheck(card, plugin, tk, { compact: true });
      const inner = card.createDiv({ cls: "bt-calview-panel-card-in" });
      inner.createSpan({ cls: "bt-calview-panel-card-title", text: tk.title });
      const proj = isInboxLink(tk.project) ? t("nav_inbox") : projectDisplayName(projectBase2(tk.project));
      inner.createSpan({ cls: "bt-calview-panel-card-proj", text: "@" + proj });
      dragSource(card, tk);
    }
  };
}
var projectBase2 = (p) => p.split("/").pop().replace(/\.md$/, "");
function yToMin(clientY, col, top) {
  const t2 = top ?? col.getBoundingClientRect().top;
  return (clientY - t2) / HOUR_PX * 60;
}
function startResize(e, el, task, startMin, plugin) {
  e.preventDefault();
  e.stopPropagation();
  const col = el.parentElement;
  const doc = el.ownerDocument;
  let minutes = Math.max(MIN_DUR, task.duration ?? 30);
  const onMove = (ev) => {
    minutes = Math.max(MIN_DUR, snap(yToMin(ev.clientY, col)) - startMin);
    const h = Math.max(18, minutes / 60 * HOUR_PX - 2);
    el.style.height = h + "px";
    el.toggleClass("is-compact", h < TWO_LINE_PX);
  };
  const onUp = () => {
    doc.removeEventListener("mousemove", onMove);
    doc.removeEventListener("mouseup", onUp);
    if (minutes !== task.duration) void plugin.setTaskDuration(task, minutes);
  };
  doc.addEventListener("mousemove", onMove);
  doc.addEventListener("mouseup", onUp);
}
function renderChip(parent, plugin, task) {
  const chip = parent.createDiv({ cls: "bt-calview-chip" });
  decorate(chip, plugin, task);
  renderCheck(chip, plugin, task, { compact: true });
  if (task.dueTime) chip.createSpan({ cls: "bt-calview-chip-time", text: task.dueTime });
  chip.createSpan({ cls: "bt-calview-chip-title", text: task.title });
  dragSource(chip, task);
}
function decorate(el, plugin, task) {
  el.dataset.path = task.path;
  if (isDone(task.status)) el.addClass("is-done");
  el.style.setProperty("--bt-cal-tint", prioTint(task));
  el.onclick = (e) => {
    e.stopPropagation();
    plugin.openEditTask(task);
  };
}
var PRIO_TINT = {
  highest: "#ef4444",
  high: "#f59e0b",
  medium: "#3b82f6"
};
var prioTint = (task) => PRIO_TINT[task.priority] ?? "var(--interactive-accent)";
function dragSource(el, task) {
  el.setAttr("draggable", "true");
  el.addEventListener("dragstart", (e) => {
    dragPath = task.path;
    el.addClass("is-dragging");
    e.dataTransfer?.setData("text/plain", task.path);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
  });
  el.addEventListener("dragend", () => {
    dragPath = null;
    el.removeClass("is-dragging");
  });
}
function attachGhost(col, plugin) {
  let ghost = null;
  let lastMin = -1;
  let colTop = 0;
  const remove = () => {
    ghost?.remove();
    ghost = null;
    lastMin = -1;
  };
  col.addEventListener("dragenter", () => {
    colTop = col.getBoundingClientRect().top;
  });
  col.addEventListener("dragover", (e) => {
    if (!dragPath) return;
    const task = plugin.index.get(dragPath);
    if (!task) return;
    if (!ghost) {
      colTop = col.getBoundingClientRect().top;
      ghost = col.createDiv({ cls: "bt-calview-ghost" });
      const dur = task.duration && task.duration > 0 ? task.duration : DEFAULT_BLOCK_MIN;
      ghost.style.height = Math.max(18, dur / 60 * HOUR_PX - 2) + "px";
      ghost.dataset.dur = String(dur);
    }
    const start = snap(yToMin(e.clientY, col, colTop));
    if (start === lastMin) return;
    lastMin = start;
    ghost.style.transform = `translateY(${start / 60 * HOUR_PX}px)`;
    const end = Math.min(start + Number(ghost.dataset.dur), 1440);
    ghost.dataset.time = span(start, end);
  });
  col.addEventListener("dragleave", (e) => {
    if (!col.contains(e.relatedTarget)) remove();
  });
  col.addEventListener("drop", remove);
  col.addEventListener("dragend", remove);
}
function dropTarget(el, plugin, dueOf) {
  el.addEventListener("dragover", (e) => {
    if (!dragPath) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    el.addClass("is-drop");
  });
  el.addEventListener("dragleave", (e) => {
    if (!el.contains(e.relatedTarget)) el.removeClass("is-drop");
  });
  el.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    el.removeClass("is-drop");
    const path = e.dataTransfer?.getData("text/plain") || dragPath;
    dragPath = null;
    if (!path) return;
    const task = plugin.index.get(path);
    if (!task) return;
    const next = dueOf(task, e);
    if (next === combineDT(task.due ?? "", task.dueTime)) return;
    void plugin.setTaskDate(task, "due", next);
  });
}

// src/heuteView.ts
var dragPath2 = null;
var dragFromCol = null;
var boardScroll = /* @__PURE__ */ new Map();
var VIEW_PREFIX = "beautytasks-";
var VIEW_IDS = ["heute", "demnaechst", "wiederkehrend", "erledigt"];
var VIEW_MAIN = VIEW_PREFIX + "main";
var VIEW_NAV = VIEW_PREFIX + "nav";
var OLD_VIEW_TYPES = VIEW_IDS.map((v) => VIEW_PREFIX + v);
var VIEW_ICON = {
  heute: "calendar-days",
  demnaechst: "calendar-1",
  wiederkehrend: "refresh-ccw",
  erledigt: "check-circle"
};
var TITLE_KEY = { heute: "view_today", demnaechst: "view_upcoming", wiederkehrend: "view_recurring", erledigt: "view_done" };
var viewTitle = (id) => t(TITLE_KEY[id]);
function addDue(plugin) {
  return calendarDayAnchor(plugin, plugin.pageViewOptions());
}
function calendarTasks(plugin, opts) {
  const open = plugin.index.open();
  return opts.showDone ? [...open, ...plugin.index.done()] : open;
}
function pageTop(c, layout) {
  const bar = c.createDiv({ cls: "bt-page-top" });
  c.prepend(bar);
  const wide = layout !== "list";
  return bar.createDiv({ cls: "bt-sizer bt-page-top-in" + (wide ? " bt-sizer-board" : "") });
}
function renderViewInto(c, plugin, view) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  if (view === "heute" || view === "demnaechst") {
    const top = pageTop(c, plugin.pageViewOptions().layout);
    const head = top.createDiv({ cls: "bt-board-head" });
    head.createEl("h1", { text: viewTitle(view) });
    anzeigeButton(head.createDiv({ cls: "bt-head-actions" }), plugin);
    const add = top.createDiv({ cls: "bt-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    add.onclick = () => plugin.openNewTask(void 0, void 0, view === "heute", void 0, addDue(plugin));
  } else if (view !== "erledigt") {
    root.createEl("h1", { text: viewTitle(view) });
  }
  const idx = plugin.index;
  if (view === "heute") {
    const opts = plugin.pageViewOptions();
    const overdue = idx.overdue(today), dueToday = idx.dueToday(today);
    const doneToday = idx.done().filter((tk) => dateOf(tk.completed ?? "") === today);
    const open = [...overdue, ...dueToday];
    if (!open.length && !(opts.showDone && doneToday.length)) {
      emptyState(root, VIEW_ICON.heute, "empty_nothing_today");
    } else if (opts.layout === "calendar") {
      renderCalendar(root, plugin, () => calendarTasks(plugin, opts), today, opts, () => plugin.renderMain());
    } else if (opts.layout === "board") {
      renderKanbanBoard(root, plugin, opts.showDone ? [...open, ...doneToday] : open, today, opts, { today: true });
    } else {
      const present = renderedPaths(plugin, opts.showDone ? [...open, ...doneToday] : open);
      if (opts.group === "none") {
        section(root, plugin, t("sec_overdue"), sortTasks(overdue, opts.sort, opts.sortDir), today, false, false, present);
        section(root, plugin, t("sec_today"), sortTasks(dueToday, opts.sort, opts.sortDir), today, false, false, present);
      } else {
        for (const g of filterGroups(plugin, sortTasks(open, opts.sort, opts.sortDir), opts.group, today))
          if (g.tasks.length) section(root, plugin, g.title, g.tasks, today, false, false, present);
      }
      if (opts.showDone && doneToday.length) section(root, plugin, t("sec_done"), doneToday, today, true, false, present);
    }
  } else if (view === "demnaechst") {
    const opts = plugin.pageViewOptions();
    const groups = idx.upcomingByDate(today);
    if (!groups.length) {
      emptyState(root, VIEW_ICON.demnaechst, "empty_nothing_scheduled");
    } else if (opts.layout === "calendar") {
      renderCalendar(root, plugin, () => calendarTasks(plugin, opts), today, opts, () => plugin.renderMain());
    } else if (opts.layout === "board") {
      renderKanbanBoard(root, plugin, groups.flatMap((g) => g.tasks), today, opts, {});
    } else {
      const present = renderedPaths(plugin, groups.flatMap((g) => g.tasks));
      for (const g of groups) section(root, plugin, groupLabel(g.date, today), g.tasks, today, false, false, present);
    }
  } else if (view === "wiederkehrend") {
    renderRecurring(root, plugin, today);
  } else {
    const redraw = () => renderViewInto(c, plugin, view);
    const header = root.createDiv({ cls: "bt-manage-header" });
    header.createEl("h1", { text: plugin.doneTab === "trash" ? t("nav_trash") : viewTitle(view) });
    const tabs = header.createDiv({ cls: "bt-tabs" });
    const mkTab = (id, label) => {
      const b = tabs.createEl("button", { cls: "bt-tab" + (plugin.doneTab === id ? " is-active" : ""), text: label });
      b.onclick = () => {
        plugin.doneTab = id;
        redraw();
      };
    };
    mkTab("done", t("view_done"));
    mkTab("trash", t("nav_trash"));
    if (plugin.doneTab === "trash") {
      const items = idx.cancelled();
      if (!items.length) {
        emptyState(root, "trash-2", "empty_trash");
        return;
      }
      const bar = root.createDiv({ cls: "bt-trash-actions" });
      const rAll = bar.createEl("button", { cls: "bt-trash-btn" });
      (0, import_obsidian20.setIcon)(rAll.createSpan(), "archive-restore");
      rAll.createSpan({ text: t("trash_restore_all") });
      rAll.onclick = () => void plugin.restoreAllCancelled();
      const emptyWrap = bar.createDiv({ cls: "bt-trash-act" });
      const emptyBtn = emptyWrap.createEl("button", { cls: "bt-trash-btn is-danger" });
      (0, import_obsidian20.setIcon)(emptyBtn.createSpan(), "trash-2");
      emptyBtn.createSpan({ text: t("trash_empty") });
      emptyBtn.onclick = () => confirmInline(emptyWrap, t("confirm_empty_trash_q"), () => void plugin.emptyTrash(), redraw);
      section(root, plugin, t("nav_trash"), items, today, false, true);
    } else {
      const done = idx.done();
      if (!done.length) emptyState(root, VIEW_ICON.erledigt, "empty_nothing_done");
      else section(root, plugin, t("sec_done"), done, today);
    }
  }
}
var RECUR_ORDER = ["recur_daily", "recur_weekly", "recur_monthly", "recur_quarterly", "recur_yearly"];
function recurKey(recurrence) {
  const r = parseRecurrence(recurrence);
  if (r && r.unit === "day" && r.n === 1) return "recur_daily";
  if (r && r.unit === "week" && r.n === 1) return "recur_weekly";
  if (r && r.unit === "month" && r.n === 1) return "recur_monthly";
  if (r && r.unit === "month" && r.n === 3) return "recur_quarterly";
  if (r && r.unit === "year" && r.n === 1) return "recur_yearly";
  return "raw:" + recurrence;
}
function renderRecurring(root, plugin, today) {
  const recs = plugin.index.open().filter((tk) => tk.recurrence);
  if (!recs.length) {
    emptyState(root, VIEW_ICON.wiederkehrend, "empty_nothing_recurring");
    return;
  }
  const groups = /* @__PURE__ */ new Map();
  for (const tk of recs) {
    const key = recurKey(tk.recurrence ?? "");
    const arr = groups.get(key);
    if (arr) arr.push(tk);
    else groups.set(key, [tk]);
  }
  for (const key of RECUR_ORDER) {
    const items = groups.get(key);
    if (items?.length) section(root, plugin, t(key), items.sort(byDue), today);
  }
  for (const [key, items] of groups) {
    if (key.startsWith("raw:")) section(root, plugin, key.slice(4), items.sort(byDue), today);
  }
}
function applyReadableWidth(c, plugin) {
  const cfg = plugin.app.vault.getConfig?.("readableLineLength");
  c.toggleClass("is-readable-line-width", cfg !== false);
}
var byDue = (a, b) => (a.due ?? "").localeCompare(b.due ?? "");
var projectName = (path) => path.split("/").pop().replace(/\.md$/, "");
function emptyState(root, icon, key) {
  root.addClass("is-empty");
  const box = root.createDiv({ cls: "bt-empty" });
  (0, import_obsidian20.setIcon)(box.createDiv({ cls: "bt-empty-ic" }), icon);
  box.createDiv({ cls: "bt-empty-text", text: t(key) });
}
function addBar(root, plugin, onAdd) {
  const bar = root.createDiv({ cls: "bt-board-bar" });
  const add = bar.createDiv({ cls: "bt-add" });
  add.createSpan({ cls: "bt-add-icon" });
  add.createSpan({ text: t("btn_add_task") });
  add.onclick = onAdd;
}
function renderProjectBoardInto(c, plugin, projectPath) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const isInbox2 = projectPath === INBOX_KEY;
  const name = isInbox2 ? "" : projectName(projectPath);
  const isArea = !isInbox2 && isAreaPath(plugin.app, projectPath);
  const meta = isInbox2 ? null : (() => {
    const a = listProjectsAndAreas(plugin.app);
    return [...a.bereiche, ...a.projekte].find((p) => p.path === projectPath) ?? null;
  })();
  const top = pageTop(c, plugin.pageViewOptions().layout);
  pageHeader(
    top,
    plugin,
    top.createEl("h1", { text: isInbox2 ? t("nav_inbox") : projectDisplayName(name) }),
    meta ? { menu: { sec: meta.type === "area" ? "areas" : "projects", key: meta.path, name: meta.name, hidden: meta.hidden, color: meta.color, type: meta.type } } : {}
  );
  addBar(top, plugin, () => plugin.openNewTask(isInbox2 ? void 0 : name, void 0, false, void 0, addDue(plugin)));
  const source = () => isInbox2 ? plugin.index.inbox() : plugin.index.all().filter((t2) => t2.project != null && projectName(t2.project) === name);
  const tasks = source();
  if (!tasks.length) {
    if (isInbox2) emptyState(root, "inbox", "empty_no_inbox_tasks");
    else if (isArea) emptyState(root, "circle-small", "empty_no_area_tasks");
    else emptyState(root, "folder", "empty_no_project_tasks");
    return;
  }
  renderPageBody(root, plugin, source, plugin.pageViewOptions(), today, isInbox2 ? {} : { project: name });
}
function renderLabelBoardInto(c, plugin, label) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const top = pageTop(c, plugin.pageViewOptions().layout);
  pageHeader(
    top,
    plugin,
    top.createEl("h1", { cls: "bt-label-title", text: "#" + label }),
    { menu: { sec: "labels", key: label, name: label, hidden: !plugin.isLabelVisible(label), color: plugin.getLabelColor(label) } }
  );
  addBar(top, plugin, () => plugin.openNewTask(void 0, label, false, void 0, addDue(plugin)));
  const source = () => plugin.index.all().filter((tk) => tk.labels.includes(label) && !plugin.index.isProjectArchived(tk.project));
  const tasks = source();
  if (!tasks.length) {
    emptyState(root, "hash", "empty_no_label_tasks");
    return;
  }
  renderPageBody(root, plugin, source, plugin.pageViewOptions(), today, { label });
}
function filterGroups(plugin, tasks, group, today) {
  if (group === "none") return [{ title: t("sec_tasks"), tasks }];
  const buckets = /* @__PURE__ */ new Map();
  const push = (key, title, order, tk) => {
    let b = buckets.get(key);
    if (!b) {
      b = { key, title, tasks: [], order };
      buckets.set(key, b);
    }
    b.tasks.push(tk);
  };
  const prioKey = (p) => p === "highest" ? "prio_1" : p === "high" ? "prio_2" : p === "medium" ? "prio_3" : "prio_4";
  const prioOrder = (p) => p === "highest" ? 0 : p === "high" ? 1 : p === "medium" ? 2 : 3;
  for (const tk of tasks) {
    if (group === "date" || group === "deadline") {
      const d = group === "date" ? tk.due : tk.scheduled;
      if (d && d < today) push("overdue", t("sec_overdue"), 0, tk);
      else if (d === today) push("today", t("sec_today"), 1, tk);
      else if (d && d > today) push("upcoming", t("sec_upcoming"), 2, tk);
      else push("nodate", t("sec_no_date"), 3, tk);
    } else if (group === "priority") {
      const k = prioKey(tk.priority);
      push(k, t(k), prioOrder(tk.priority), tk);
    } else if (group === "label") {
      if (tk.labels.length) push("l:" + tk.labels[0], "#" + tk.labels[0], 1, tk);
      else push("nolabel", t("no_label"), 0, tk);
    } else {
      if (tk.project && !isInboxLink(tk.project)) {
        const nm = projectName(tk.project);
        push("p:" + nm, "@" + projectDisplayName(nm), 1, tk);
      } else push("noproject", t("nav_inbox"), 0, tk);
    }
  }
  const isRest = (k) => k === "nodate" || k === "nolabel" || k === "noproject" ? 1 : 0;
  return [...buckets.values()].sort((a, b) => isRest(a.key) - isRest(b.key) || a.order - b.order || a.title.localeCompare(b.title));
}
function renderPageBody(root, plugin, source, opts, today, add) {
  const tasks = source();
  const open = tasks.filter((t2) => isOpen(t2.status));
  const done = tasks.filter((t2) => isDone(t2.status)).sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  if (opts.layout === "board") {
    renderKanbanBoard(root, plugin, opts.showDone ? [...open, ...done] : open, today, opts, add);
    return;
  }
  if (opts.layout === "calendar") {
    const calSource = () => {
      const all = source();
      const o = all.filter((t2) => isOpen(t2.status));
      return opts.showDone ? [...o, ...all.filter((t2) => isDone(t2.status))] : o;
    };
    renderCalendar(root, plugin, calSource, today, opts, () => plugin.renderMain(), add);
    return;
  }
  const sorted = sortTasks(open, opts.sort, opts.sortDir);
  const present = renderedPaths(plugin, opts.showDone ? [...open, ...done] : open);
  for (const g of filterGroups(plugin, sorted, opts.group, today)) {
    if (g.tasks.length) section(root, plugin, g.title, g.tasks, today, false, false, present);
  }
  if (opts.showDone && done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}
function renderFilterBoardInto(c, plugin, filterPath) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const filter = readFilter(plugin.app, filterPath);
  if (!filter) {
    emptyState(root, "tag", "empty_no_filter");
    return;
  }
  const top = pageTop(c, filter.options.layout);
  pageHeader(top, plugin, top.createEl("h1", { text: filter.name }), {
    menu: { sec: "filters", key: filterPath, name: filter.name, hidden: filter.hidden, color: filter.color }
  });
  addBar(top, plugin, () => plugin.openNewTask(void 0, void 0, false, void 0, addDue(plugin)));
  const tasks = applyFilter(plugin.index, filter.criteria, filter.options, today);
  if (!tasks.length) {
    emptyState(root, filter.icon, "empty_no_filter_tasks");
    return;
  }
  renderPageBody(root, plugin, () => applyFilter(plugin.index, filter.criteria, filter.options, today), filter.options, today, {});
}
function pageHeader(root, plugin, titleEl, opts = {}) {
  const head = root.createDiv({ cls: "bt-board-head" });
  head.appendChild(titleEl);
  const actions = head.createDiv({ cls: "bt-head-actions" });
  if (opts.menu) {
    const it = opts.menu;
    const kebab = actions.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": t("more_actions"), "data-tooltip-position": "top" } });
    (0, import_obsidian20.setIcon)(kebab.createSpan(), "more-horizontal");
    kebab.onclick = (e) => {
      e.stopPropagation();
      const m = new import_obsidian20.Menu();
      buildItemMenu(m, plugin, it, "board");
      m.showAtMouseEvent(e);
    };
  }
  anzeigeButton(actions, plugin);
}
function sortColumn(list, kind) {
  if (kind === "done") return list.sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  return list.sort((a, b) => (a.due ?? "9999-99-99").localeCompare(b.due ?? "9999-99-99") || a.title.localeCompare(b.title));
}
var NO_LABEL = "\0nolabel";
function statusColumns(plugin, add) {
  return boardStatuses().map((col) => ({
    id: col.id,
    title: statusLabel(col.id),
    tint: statusTint(col.id),
    kind: col.kind,
    has: (tk) => tk.status === col.id,
    onDrop: (tk) => {
      if (tk.status !== col.id) void plugin.setTaskStatus(tk, col.id);
    },
    onAdd: () => plugin.openNewTask(add.project ?? void 0, add.label, add.today ?? false, col.id)
  }));
}
function labelColumns(plugin, tasks, add) {
  const present = tasks.flatMap((t2) => t2.labels);
  const names = plugin.sortLabels([...new Set(present)].map((name) => ({ name }))).map((x) => x.name);
  const cols = names.map((name) => ({
    id: name,
    title: "#" + name,
    tint: plugin.getLabelColor(name) ?? "var(--bt-label)",
    kind: "open",
    has: (tk) => tk.labels.includes(name),
    onDrop: (tk, fromColId) => void plugin.swapTaskLabel(tk, fromColId === NO_LABEL ? null : fromColId, name),
    onAdd: () => plugin.openNewTask(add.project ?? void 0, name, add.today ?? false, firstOpenStatus())
  }));
  if (tasks.some((t2) => t2.labels.length === 0)) {
    cols.push({
      id: NO_LABEL,
      title: t("no_label"),
      tint: "var(--text-muted)",
      kind: "open",
      has: (tk) => tk.labels.length === 0,
      onDrop: (tk, fromColId) => void plugin.swapTaskLabel(tk, fromColId === NO_LABEL ? null : fromColId, null),
      onAdd: () => plugin.openNewTask(add.project ?? void 0, void 0, add.today ?? false, firstOpenStatus())
    });
  }
  return cols;
}
var NO_PROJECT = " noproject";
function priorityColumns(plugin, add) {
  const eff = (p) => p === "low" || p === "lowest" ? "normal" : p;
  return PRIOS.map((p) => ({
    id: p.value,
    title: t(p.key),
    tint: p.color,
    kind: "open",
    has: (tk) => eff(tk.priority) === p.value,
    onDrop: (tk) => {
      if (eff(tk.priority) !== p.value) void plugin.setTaskPriority(tk, p.value);
    },
    onAdd: () => plugin.openNewTask(add.project ?? void 0, add.label, add.today ?? false)
  }));
}
function projectColumns(plugin, tasks, add) {
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  const colorOf = new Map([...bereiche, ...projekte].map((p) => [p.name, p.color]));
  const present = new Set(tasks.filter((t2) => t2.project && !isInboxLink(t2.project)).map((t2) => projectName(t2.project)));
  const ordered = [
    ...plugin.sortProjItems("areas", bereiche.filter((p) => present.has(p.name))),
    ...plugin.sortProjItems("projects", projekte.filter((p) => present.has(p.name)))
  ];
  const names = ordered.map((p) => p.name);
  for (const n of present) if (!names.includes(n)) names.push(n);
  const cols = names.map((name) => ({
    id: name,
    title: projectDisplayName(name),
    tint: colorOf.get(name) ?? "var(--bt-nav-project)",
    kind: "open",
    has: (tk) => !!tk.project && projectName(tk.project) === name,
    onDrop: (tk) => {
      if (!tk.project || projectName(tk.project) !== name) void plugin.setTaskProject(tk, name);
    },
    onAdd: () => plugin.openNewTask(name, add.label, add.today ?? false)
  }));
  if (tasks.some((t2) => isInboxLink(t2.project))) {
    cols.push({
      id: NO_PROJECT,
      title: t("nav_inbox"),
      tint: "var(--text-muted)",
      kind: "open",
      has: (tk) => isInboxLink(tk.project),
      onDrop: (tk) => {
        if (!isInboxLink(tk.project)) void plugin.setTaskProject(tk, null);
      },
      // in den Eingang = Projekt leeren
      onAdd: () => plugin.openNewTask(void 0, add.label, add.today ?? false)
    });
  }
  return cols;
}
function attachEdgeAutoscroll(board) {
  const EDGE = 56;
  const MAX = 18;
  let hSpeed = 0, rafId = 0;
  const ramp = (dist) => Math.min(MAX, Math.max(1, Math.ceil((EDGE - dist) / EDGE * MAX)));
  const tick = () => {
    if (!board.isConnected || !hSpeed) {
      rafId = 0;
      return;
    }
    board.scrollLeft += hSpeed;
    rafId = window.requestAnimationFrame(tick);
  };
  const stop = () => {
    hSpeed = 0;
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }
  };
  board.addEventListener("dragover", (e) => {
    if (!dragPath2) return;
    const r = board.getBoundingClientRect();
    hSpeed = e.clientX < r.left + EDGE ? -ramp(e.clientX - r.left) : e.clientX > r.right - EDGE ? ramp(r.right - e.clientX) : 0;
    if (hSpeed && !rafId) rafId = window.requestAnimationFrame(tick);
  });
  board.addEventListener("dragend", stop);
  board.addEventListener("drop", stop);
}
var isSentinelCol = (id) => id === NO_LABEL || id === NO_PROJECT;
function applyColumnOrder(cols, saved) {
  if (!saved?.length) return cols;
  const rank = new Map(saved.map((id, i) => [id, i]));
  return [...cols].sort((a, b) => {
    const pa = isSentinelCol(a.id) ? 1 : 0, pb = isSentinelCol(b.id) ? 1 : 0;
    if (pa !== pb) return pa - pb;
    return (rank.get(a.id) ?? Infinity) - (rank.get(b.id) ?? Infinity);
  });
}
function attachColumnDrag(colEl, handle, board, groupKey, plugin) {
  const cols = () => Array.from(board.children).filter((el) => el.instanceOf(HTMLElement) && el.hasClass("bt-kanban-col"));
  const orderIds = () => cols().filter((el) => el.dataset.pin !== "1").map((el) => el.dataset.col).filter((c) => !!c);
  handle.addEventListener("pointerdown", (ev) => {
    if (ev.button !== 0) return;
    ev.preventDefault();
    const doc = board.ownerDocument;
    const before = orderIds().join(",");
    const onMove = (me) => {
      colEl.addClass("is-col-dragging");
      const x = me.clientX;
      let placed = false;
      for (const sib of cols()) {
        if (sib === colEl || sib.dataset.pin === "1") continue;
        const r = sib.getBoundingClientRect();
        if (x < r.left + r.width / 2) {
          board.insertBefore(colEl, sib);
          placed = true;
          break;
        }
      }
      if (!placed) {
        const pin = cols().find((el) => el.dataset.pin === "1");
        if (pin) board.insertBefore(colEl, pin);
        else board.appendChild(colEl);
      }
    };
    const onUp = () => {
      colEl.removeClass("is-col-dragging");
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      const ids = orderIds();
      if (ids.join(",") !== before) void plugin.setBoardColumnOrder(groupKey, ids);
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  });
}
function setupColumnDnd(colEl, col, plugin) {
  colEl.addEventListener("dragover", (e) => {
    if (!dragPath2) return;
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
    colEl.addClass("is-drop");
  });
  colEl.addEventListener("dragleave", (e) => {
    if (!colEl.contains(e.relatedTarget)) colEl.removeClass("is-drop");
  });
  colEl.addEventListener("drop", (e) => {
    e.preventDefault();
    colEl.removeClass("is-drop");
    const path = e.dataTransfer?.getData("text/plain") || dragPath2;
    const fromCol = dragFromCol;
    dragPath2 = null;
    dragFromCol = null;
    if (!path) return;
    const task = plugin.index.get(path);
    if (task) col.onDrop(task, fromCol ?? "");
  });
}
function renderKanbanBoard(root, plugin, tasks, today, opts, add) {
  root.addClass("bt-sizer-board");
  const groupKey = opts.group === "label" ? "label" : opts.group === "priority" ? "priority" : opts.group === "project" ? "project" : "status";
  const reorderable = groupKey !== "priority";
  const baseCols = opts.group === "label" ? labelColumns(plugin, tasks, add) : opts.group === "priority" ? priorityColumns(plugin, add) : opts.group === "project" ? projectColumns(plugin, tasks, add) : statusColumns(plugin, add);
  const cols = reorderable ? applyColumnOrder(baseCols, plugin.settings.boardColumnOrder?.[groupKey]) : baseCols;
  const board = root.createDiv({ cls: "bt-kanban" });
  attachEdgeAutoscroll(board);
  const scrollKey = (plugin.currentProject ?? plugin.currentLabel ?? plugin.currentFilter ?? plugin.currentView ?? "") + "|" + (opts.group ?? "");
  board.addEventListener("scroll", () => boardScroll.set(scrollKey, board.scrollLeft));
  for (const col of cols) {
    const colEl = board.createDiv({ cls: "bt-kanban-col" });
    colEl.dataset.col = col.id;
    const sentinel = isSentinelCol(col.id);
    if (sentinel) colEl.dataset.pin = "1";
    setupColumnDnd(colEl, col, plugin);
    const head = colEl.createDiv({ cls: "bt-kanban-head" });
    if (reorderable && !sentinel) {
      head.addClass("bt-col-draggable");
      (0, import_obsidian20.setIcon)(head.createSpan({ cls: "bt-kanban-grip" }), "grip-vertical");
      attachColumnDrag(colEl, head, board, groupKey, plugin);
    }
    head.createSpan({ cls: "bt-kanban-dot" }).style.background = col.tint;
    head.createSpan({ cls: "bt-kanban-title", text: col.title });
    const colTasks = sortColumn(tasks.filter((tk) => col.has(tk)), col.kind);
    head.createSpan({ cls: "bt-kanban-count", text: String(colTasks.length) });
    const listEl = colEl.createDiv({ cls: "bt-kanban-list" });
    for (const tk of colTasks) renderTask(listEl, plugin, tk, today, 0, false, { flat: true, draggable: true, colId: col.id });
    const addEl = colEl.createDiv({ cls: "bt-kanban-add" });
    addEl.createSpan({ cls: "bt-add-icon" });
    addEl.createSpan({ text: t("btn_add_task") });
    addEl.onclick = () => col.onAdd();
  }
  const savedLeft = boardScroll.get(scrollKey);
  if (savedLeft) board.scrollLeft = savedLeft;
}
function groupLabel(dateISO, today) {
  const lbl = formatDate(dateISO, today);
  if (lbl === t("date_today") || lbl === t("date_tomorrow") || lbl === t("date_yesterday")) return lbl;
  const wd = new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(/* @__PURE__ */ new Date(dateISO + "T00:00:00"));
  return wd + ", " + lbl;
}
function renderedPaths(plugin, anchors2) {
  const present = /* @__PURE__ */ new Set();
  const walk = (tk) => {
    if (present.has(tk.path)) return;
    present.add(tk.path);
    for (const kid of plugin.index.children(tk.path)) if (!isTrashed(kid.status)) walk(kid);
  };
  for (const a of anchors2) walk(a);
  return present;
}
function section(parent, plugin, title, tasks, today, collapsible = false, trash = false, present) {
  const top = trash ? tasks : tasks.filter((x) => !x.parent || present !== void 0 && !present.has(x.parent));
  const sec = parent.createDiv({ cls: "bt-section" });
  const head = sec.createEl("h6", { cls: "bt-section-title" });
  head.createSpan({ cls: "bt-section-lbl", text: title });
  head.createSpan({ cls: "bt-section-count", text: String(top.length) });
  const list = sec.createDiv({ cls: "bt-list" });
  for (const task of top) renderTask(list, plugin, task, today, 0, trash);
  annotateSubtaskTree(list);
  if (collapsible) {
    sec.addClass("bt-collapsible");
    const chev = head.createSpan({ cls: "bt-collapse-ic" });
    const apply = () => {
      sec.toggleClass("is-collapsed", plugin.doneCollapsed);
      (0, import_obsidian20.setIcon)(chev, plugin.doneCollapsed ? "chevron-right" : "chevron-down");
    };
    apply();
    head.onclick = () => {
      plugin.doneCollapsed = !plugin.doneCollapsed;
      apply();
    };
  }
}
function annotateSubtaskTree(list) {
  const rows = Array.from(list.children);
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row.hasClass("bt-task")) continue;
    const next = rows[i + 1];
    const nextIsSub = !!next && next.hasClass("bt-task") && next.hasClass("bt-subtask");
    if (row.hasClass("bt-subtask")) row.toggleClass("bt-last-sub", !nextIsSub);
    else row.toggleClass("bt-has-sub", nextIsSub);
  }
}
var LINK_MARKERS = /\[\[|]\(|https?:\/\/|obsidian:\/\//;
function renderLinkedText(el, plugin, text, sourcePath) {
  if (!LINK_MARKERS.test(text) || !plugin.titleRenderComp) {
    el.setText(text);
    return;
  }
  el.addClass("bt-md-inline");
  void import_obsidian20.MarkdownRenderer.render(plugin.app, text, el, sourcePath, plugin.titleRenderComp).catch(() => {
    el.empty();
    el.setText(text);
  });
  el.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (!a) return;
    e.preventDefault();
    e.stopPropagation();
    if (a.classList.contains("internal-link")) {
      const href = a.getAttribute("data-href") || a.getAttribute("href") || "";
      void plugin.app.workspace.openLinkText(href, sourcePath, import_obsidian20.Keymap.isModEvent(e));
    } else {
      const href = a.getAttribute("href");
      if (href) window.open(href);
    }
  });
}
function renderTask(list, plugin, task, today, depth, trash = false, opts = {}) {
  const row = list.createDiv({ cls: "bt-task" + (depth ? " bt-subtask" : "") });
  if (depth) row.style.setProperty("--bt-depth", String(depth));
  row.dataset.path = task.path;
  if (isDone(task.status)) row.addClass("is-done");
  if (trash) row.addClass("is-cancelled");
  plugin.applyFlash(row, task.path);
  if (opts.draggable && !trash) {
    row.setAttr("draggable", "true");
    row.addEventListener("dragstart", (e) => {
      dragPath2 = task.path;
      dragFromCol = opts.colId ?? null;
      row.addClass("is-dragging");
      e.dataTransfer?.setData("text/plain", task.path);
      if (e.dataTransfer) e.dataTransfer.effectAllowed = "move";
    });
    row.addEventListener("dragend", () => {
      dragPath2 = null;
      dragFromCol = null;
      row.removeClass("is-dragging");
    });
  }
  renderCheck(row, plugin, task, { trash });
  const body = row.createDiv({ cls: "bt-body" });
  renderLinkedText(body.createDiv({ cls: "bt-title" }), plugin, task.title, task.path);
  if (plugin.settings.showDescriptionInList) {
    const desc = task.description.replace(/!\[\[[^\]]*\]\]/g, "").replace(/!\[[^\]]*\]\([^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (desc) renderLinkedText(body.createDiv({ cls: "bt-desc" }), plugin, desc, task.path);
  }
  const meta = body.createDiv({ cls: "bt-meta" });
  if (task.due) {
    const chip = meta.createSpan({ cls: "bt-chip bt-due", text: formatDateTime(combineDT(task.due, task.dueTime), today) });
    chip.dataset.when = dueWhen(task.due, today);
    chip.onclick = (e) => {
      e.stopPropagation();
      openDatePicker(
        chip,
        combineDT(task.due, task.dueTime),
        (v) => void plugin.setTaskDate(task, "due", v),
        { value: task.duration, onChange: (d) => void plugin.setTaskDuration(task, d) }
      );
    };
  }
  if (task.recurrence) meta.createSpan({ cls: "bt-chip bt-recur" });
  if (task.reminders.length) {
    const rem = meta.createSpan({ cls: "bt-remind", attr: { "aria-label": task.reminders.map(formatReminder).join(" \xB7 "), "data-tooltip-position": "top" } });
    (0, import_obsidian20.setIcon)(rem, "alarm-clock");
  }
  for (const l of task.labels) meta.createSpan({ cls: "bt-chip bt-label", text: l });
  if (task.scheduled) {
    const chip = meta.createSpan({ cls: "bt-chip bt-sched", text: formatDateTime(combineDT(task.scheduled, task.scheduledTime), today) });
    chip.onclick = (e) => {
      e.stopPropagation();
      openDatePicker(chip, combineDT(task.scheduled, task.scheduledTime), (v) => void plugin.setTaskDate(task, "scheduled", v));
    };
  }
  const comments = plugin.index.commentsOf(task.path);
  if (comments > 0) {
    const chip = meta.createSpan({ cls: "bt-comments" });
    const ic = chip.createSpan({ cls: "bt-comments-ic" });
    (0, import_obsidian20.setIcon)(ic, "paperclip");
    chip.createSpan({ cls: "bt-comments-n", text: String(comments) });
  }
  if (trash) {
    const acts = row.createDiv({ cls: "bt-task-actions" });
    iconBtn(acts, "archive-restore", t("btn_restore"), () => void plugin.restoreTask(task));
    iconBtn(
      acts,
      "trash-2",
      t("btn_delete_forever"),
      () => confirmInline(acts, t("confirm_delete_forever_q"), () => void plugin.deleteTaskForever(task.path), () => plugin.renderAll())
    );
  } else if (!plugin.currentProject && depth === 0) {
    const extras = row.createDiv({ cls: "bt-extras" });
    if (isInboxLink(task.project)) {
      const bl = extras.createEl("a", { cls: "bt-backlink", text: "@" + t("nav_inbox") });
      bl.onclick = (e) => {
        e.stopPropagation();
        void plugin.activateProject(INBOX_KEY);
      };
    } else {
      const name = projectName(task.project);
      const bl = extras.createEl("a", { cls: "bt-backlink", text: "@" + projectDisplayName(name) });
      bl.onclick = (e) => {
        e.stopPropagation();
        void plugin.activateProject(task.project);
      };
    }
  }
  row.onclick = () => plugin.openEditTask(task);
  if (!trash && !opts.flat) for (const kid of plugin.index.children(task.path)) {
    if (!isTrashed(kid.status)) renderTask(list, plugin, kid, today, depth + 1);
  }
}
function activate(el, handler) {
  el.onclick = handler;
  el.onkeydown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handler();
    }
  };
}
function navItem(c, o) {
  const item = c.createDiv({ cls: "bt-nav-item" + (o.active ? " is-active" : "") + (o.cls ? " " + o.cls : ""), attr: { role: "button", tabindex: "0" } });
  const ic = item.createSpan({ cls: "bt-nav-ic" });
  (0, import_obsidian20.setIcon)(ic, o.icon);
  if (o.iconColor) ic.setCssStyles({ color: o.iconColor });
  item.createSpan({ cls: "bt-nav-lbl", text: o.label });
  if (o.countKey || o.count) {
    const badge = item.createSpan({ cls: "bt-nav-count", text: o.count ? String(o.count) : "" });
    if (o.countKey) navBadges?.set(o.countKey, badge);
  }
  activate(item, o.onClick);
  if (o.onContext) item.oncontextmenu = (e) => {
    e.preventDefault();
    o.onContext(e);
  };
}
function navHintRow(c, icon, label, onClick) {
  const row = c.createDiv({ cls: "bt-nav-hint", attr: { role: "button", tabindex: "0" } });
  (0, import_obsidian20.setIcon)(row.createSpan({ cls: "bt-nav-hint-ic" }), icon);
  row.createSpan({ cls: "bt-nav-hint-lbl", text: label });
  activate(row, onClick);
}
function navHead(c, plugin, id, title, tip, placeholder, redraw, submit, onAddClick) {
  const collapsed = plugin.isNavCollapsed(id);
  const head = c.createDiv({ cls: "bt-nav-head" });
  const manageSec = id === "projects" || id === "areas" || id === "labels" || id === "filters" ? id : null;
  const toggle = head.createDiv({ cls: "bt-nav-head-toggle", attr: { role: "button", tabindex: "0" } });
  toggle.createSpan({ cls: "bt-nav-head-lbl", text: title });
  activate(toggle, () => manageSec ? void plugin.activateManage(manageSec) : void plugin.toggleNavSection(id));
  const add = head.createDiv({ cls: "bt-nav-head-add", attr: { role: "button", tabindex: "0", "aria-label": tip, "data-tooltip-position": "top" } });
  (0, import_obsidian20.setIcon)(add, "plus");
  activate(add, () => {
    if (onAddClick) {
      onAddClick();
      return;
    }
    const input = createEl("input", { type: "text", cls: "bt-nav-add-input", attr: { placeholder } });
    head.insertAdjacentElement("afterend", input);
    const close = () => {
      input.onblur = null;
      redraw();
    };
    const commit = () => void (async () => {
      input.onblur = null;
      const v = input.value.trim();
      if (v) {
        await submit(v);
        plugin.settings.navCollapsed[id] = false;
        await plugin.saveSettings();
      }
      redraw();
    })();
    input.onkeydown = (e2) => {
      if (e2.key === "Enter") {
        e2.preventDefault();
        commit();
      } else if (e2.key === "Escape") {
        e2.preventDefault();
        close();
      }
    };
    input.onblur = close;
    window.setTimeout(() => input.focus(), 0);
  });
  const chev = head.createDiv({ cls: "bt-nav-head-chevron", attr: { role: "button", tabindex: "0", "aria-expanded": String(!collapsed), "aria-label": t("nav_toggle_section"), "data-tooltip-position": "top" } });
  (0, import_obsidian20.setIcon)(chev, collapsed ? "chevron-right" : "chevron-down");
  activate(chev, () => void plugin.toggleNavSection(id));
  if (id === "projects" || id === "areas" || id === "labels" || id === "filters") {
    head.oncontextmenu = (e) => {
      const menu = new import_obsidian20.Menu();
      if (showHiddenSubmenu(menu, plugin, id)) {
        e.preventDefault();
        menu.showAtMouseEvent(e);
      }
    };
  }
  return collapsed;
}
function renderReorderList(c, plugin, sec, entries) {
  const bar = c.createDiv({ cls: "bt-reorder-bar" });
  bar.createSpan({ cls: "bt-reorder-lbl", text: t("reorder_active") });
  const done = bar.createEl("button", { cls: "bt-reorder-done mod-cta", text: t("reorder_done") });
  done.onclick = () => plugin.endReorder();
  const list = c.createDiv({ cls: "bt-reorder-list" });
  for (const e of entries) {
    const row = list.createDiv({ cls: "bt-reorder-row", attr: { "data-key": e.key } });
    const grip = row.createSpan({ cls: "bt-nav-grip", attr: { role: "button", tabindex: "0", "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
    (0, import_obsidian20.setIcon)(grip, "grip-vertical");
    const ic = row.createSpan({ cls: "bt-nav-ic" });
    (0, import_obsidian20.setIcon)(ic, e.icon);
    if (e.color) ic.setCssStyles({ color: e.color });
    row.createSpan({ cls: "bt-nav-lbl", text: e.name });
    grip.onkeydown = (ev) => {
      if (ev.key === "ArrowUp") {
        ev.preventDefault();
        void plugin.moveNavItemVisible(sec, e.key, -1);
      } else if (ev.key === "ArrowDown") {
        ev.preventDefault();
        void plugin.moveNavItemVisible(sec, e.key, 1);
      }
    };
    attachRowDrag(row, grip, list, (keys) => void plugin.reorderVisible(sec, keys));
  }
}
var navMounts = /* @__PURE__ */ new WeakMap();
var navBadges = null;
function navCounts(plugin) {
  const m = /* @__PURE__ */ new Map();
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  m.set("p:" + INBOX_KEY, plugin.index.inboxOpen().length);
  for (const id of VIEW_IDS) m.set("v:" + id, navCount(plugin, id));
  for (const p of [...bereiche, ...projekte]) m.set("p:" + p.path, plugin.index.byProject(p.path).length);
  const today = todayStr();
  for (const fl of listFilters(plugin.app)) m.set("f:" + fl.path, applyFilter(plugin.index, fl.criteria, fl.options, today).length);
  for (const name of plugin.getVisibleLabels()) m.set("l:" + name, plugin.index.byLabel(name).length);
  return m;
}
function navSignature(plugin) {
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  const proj = (p) => [p.path, p.name, p.icon, p.color, p.hidden].join("~");
  return JSON.stringify({
    areas: plugin.sortProjItems("areas", bereiche).map(proj),
    projects: plugin.sortProjItems("projects", projekte).map(proj),
    filters: plugin.sortFilters(listFilters(plugin.app)).map((f) => [f.path, f.name, f.icon, f.color, f.hidden].join("~")),
    labels: plugin.getVisibleLabels().map((n) => n + "~" + plugin.getLabelColor(n)),
    labelsTotal: plugin.getLabels().length,
    // steuert die „+ Label erstellen"-Zeile
    active: [plugin.currentProject, plugin.currentLabel, plugin.currentFilter, plugin.currentView, plugin.manageOpen].join("~"),
    collapsed: ["filters", "labels", "areas", "projects"].map((id) => plugin.isNavCollapsed(id)),
    reorder: plugin.reorderSec,
    preview: plugin.colorPreview,
    locale: getLocale()
  });
}
function tryPatchNav(c, plugin) {
  const m = navMounts.get(c);
  if (!m || m.sig !== navSignature(plugin)) return false;
  const counts = navCounts(plugin);
  for (const [key, el] of m.badges) {
    const n = counts.get(key) ?? 0;
    el.setText(n ? String(n) : "");
  }
  return true;
}
function renderNavInto(c, plugin) {
  c.empty();
  c.addClass("bt-nav");
  const redraw = () => renderNavInto(c, plugin);
  const badges = /* @__PURE__ */ new Map();
  navBadges = badges;
  const { bereiche, projekte } = listProjectsAndAreas(plugin.app);
  const navColor = (path, stored) => plugin.colorPreview?.key === path ? plugin.colorPreview.color : stored;
  navItem(c, { cls: "bt-nav-add-task", icon: "bt-add-task", label: t("btn_add_task"), onClick: () => plugin.openQuickAddHere() });
  navItem(c, { cls: "bt-nav-search", icon: "search", label: t("nav_search"), onClick: () => plugin.openSearch() });
  navItem(c, {
    cls: "bt-nav-inbox",
    icon: "inbox",
    label: t("nav_inbox"),
    count: plugin.index.inboxOpen().length,
    countKey: "p:" + INBOX_KEY,
    active: plugin.currentProject === INBOX_KEY,
    onClick: () => void plugin.activateProject(INBOX_KEY),
    onContext: (e) => {
      const m = new import_obsidian20.Menu();
      if (addGcalSyncItem(m, plugin, INBOX_KEY)) m.showAtMouseEvent(e);
    }
  });
  for (const id of VIEW_IDS) {
    const active = !plugin.currentProject && !plugin.currentLabel && !plugin.currentFilter && !plugin.manageOpen && plugin.currentView === id;
    navItem(c, { cls: "bt-nav-" + id, icon: VIEW_ICON[id], label: viewTitle(id), count: navCount(plugin, id), countKey: "v:" + id, active, onClick: () => void plugin.activateView(id) });
  }
  const projItems = (items, cls, kind) => {
    const sec = kind === "area" ? "areas" : "projects";
    const visible = items.filter((x) => !x.hidden);
    if (plugin.reorderSec === sec) {
      renderReorderList(c, plugin, sec, visible.map((p) => ({ key: p.path, name: p.name, icon: p.icon, color: p.color })));
      return;
    }
    for (const p of visible) {
      navItem(c, {
        cls,
        icon: p.icon,
        iconColor: navColor(p.path, p.color),
        label: p.name,
        count: plugin.index.byProject(p.path).length,
        countKey: "p:" + p.path,
        active: plugin.currentProject === p.path,
        onClick: () => void plugin.activateProject(p.path),
        onContext: (e) => {
          const m = new import_obsidian20.Menu();
          buildItemMenu(m, plugin, { sec, key: p.path, name: p.name, hidden: p.hidden, color: p.color, type: kind });
          m.showAtMouseEvent(e);
        }
      });
    }
    if (!items.length) navHintRow(c, "plus", t(kind === "area" ? "create_area" : "create_project"), () => new NewItemModal(plugin, kind).open());
  };
  const today = todayStr();
  const filters = plugin.sortFilters(listFilters(plugin.app));
  const filtersCollapsed = navHead(
    c,
    plugin,
    "filters",
    t("nav_filters"),
    t("filter_add"),
    "",
    redraw,
    async () => void 0,
    () => new FilterModal(plugin).open()
  );
  if (plugin.reorderSec === "filters") {
    renderReorderList(c, plugin, "filters", filters.filter((f) => !f.hidden).map((f) => ({ key: f.path, name: f.name, icon: f.icon, color: f.color })));
  } else if (!filtersCollapsed) {
    for (const fl of filters) {
      if (fl.hidden) continue;
      navItem(c, {
        cls: "bt-nav-filter",
        icon: fl.icon,
        iconColor: navColor(fl.path, fl.color),
        label: fl.name,
        count: applyFilter(plugin.index, fl.criteria, fl.options, today).length,
        countKey: "f:" + fl.path,
        active: plugin.currentFilter === fl.path,
        onClick: () => void plugin.activateFilter(fl.path),
        onContext: (e) => {
          const m = new import_obsidian20.Menu();
          buildItemMenu(m, plugin, { sec: "filters", key: fl.path, name: fl.name, hidden: fl.hidden, color: fl.color });
          m.showAtMouseEvent(e);
        }
      });
    }
    if (!filters.length) navHintRow(c, "plus", t("create_filter"), () => new FilterModal(plugin).open());
  }
  const labelsCollapsed = navHead(
    c,
    plugin,
    "labels",
    t("tab_labels"),
    t("add_label"),
    "",
    redraw,
    async () => void 0,
    () => new NewItemModal(plugin, "label").open()
  );
  if (plugin.reorderSec === "labels") {
    renderReorderList(c, plugin, "labels", plugin.getVisibleLabels().map((n) => ({ key: n, name: n, icon: "hash", color: plugin.getLabelColor(n) })));
  } else if (!labelsCollapsed) {
    for (const name of plugin.getVisibleLabels()) {
      const count = plugin.index.byLabel(name).length;
      navItem(c, {
        cls: "bt-nav-label",
        icon: "hash",
        iconColor: navColor(name, plugin.getLabelColor(name)),
        label: name,
        count,
        countKey: "l:" + name,
        active: plugin.currentLabel === name,
        onClick: () => void plugin.activateLabel(name),
        onContext: (e) => {
          const m = new import_obsidian20.Menu();
          buildItemMenu(m, plugin, { sec: "labels", key: name, name, hidden: !plugin.isLabelVisible(name), color: plugin.getLabelColor(name) });
          m.showAtMouseEvent(e);
        }
      });
    }
    if (!plugin.getLabels().length) navHintRow(c, "plus", t("create_label"), () => new NewItemModal(plugin, "label").open());
  }
  const areasCollapsed = navHead(
    c,
    plugin,
    "areas",
    t("group_area"),
    t("pick_new_area"),
    "",
    redraw,
    async () => void 0,
    () => new NewItemModal(plugin, "area").open()
  );
  if (!areasCollapsed || plugin.reorderSec === "areas") projItems(plugin.sortProjItems("areas", bereiche), "bt-nav-area", "area");
  const projCollapsed = navHead(
    c,
    plugin,
    "projects",
    t("group_project"),
    t("pick_new_project"),
    "",
    redraw,
    async () => void 0,
    () => new NewItemModal(plugin, "project").open()
  );
  if (!projCollapsed || plugin.reorderSec === "projects") projItems(plugin.sortProjItems("projects", projekte), "bt-nav-project", "project");
  navBadges = null;
  navMounts.set(c, { sig: navSignature(plugin), badges });
}
function navCount(plugin, id) {
  const today = todayStr();
  if (id === "heute") return plugin.index.overdue(today).length + plugin.index.dueToday(today).length;
  if (id === "demnaechst") return plugin.index.upcoming(today).length;
  if (id === "wiederkehrend") return plugin.index.open().filter((tk) => tk.recurrence).length;
  return 0;
}
var MainView = class extends import_obsidian20.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.unsub = null;
    this.renderComp = null;
  }
  getViewType() {
    return VIEW_MAIN;
  }
  getDisplayText() {
    return "BeautyTasks";
  }
  // statischer Header (Tab + Pane) = Programmname
  getIcon() {
    return VIEW_ICON.erledigt;
  }
  // statisch = „Erledigt"-Icon (check-circle)
  async onOpen() {
    installCheckDelegation(this.contentEl, this.plugin);
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose() {
    this.unsub?.();
    this.unsub = null;
    this.plugin.titleRenderComp = null;
  }
  draw() {
    if (!this.contentEl) return;
    if (!this.plugin.manageOpen && tryPatchCalendar(this.contentEl, this.plugin)) return;
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new import_obsidian20.Component());
    this.plugin.titleRenderComp = this.renderComp;
    this.contentEl.removeClass("bt-view-calendar");
    if (this.plugin.manageOpen) renderManageInto(this.contentEl, this.plugin);
    else if (this.plugin.currentFilter) renderFilterBoardInto(this.contentEl, this.plugin, this.plugin.currentFilter);
    else if (this.plugin.currentLabel) renderLabelBoardInto(this.contentEl, this.plugin, this.plugin.currentLabel);
    else if (this.plugin.currentProject) renderProjectBoardInto(this.contentEl, this.plugin, this.plugin.currentProject);
    else renderViewInto(this.contentEl, this.plugin, this.plugin.currentView);
    this.syncTitle();
  }
  /** Tab UND Pane-Header (zwei getrennte Elemente) auf die aktuelle Seite bringen –
   *  sonst bleibt der Titel beim zuerst geöffneten View hängen. */
  syncTitle() {
    this.leaf.updateHeader?.();
    const titleEl = this.containerEl.querySelector(".view-header-title");
    if (titleEl) titleEl.setText(this.getDisplayText());
  }
};
var NavView = class extends import_obsidian20.ItemView {
  constructor(leaf, plugin) {
    super(leaf);
    this.plugin = plugin;
    this.unsub = null;
  }
  getViewType() {
    return VIEW_NAV;
  }
  getDisplayText() {
    return "BeautyTasks";
  }
  getIcon() {
    return "check-circle";
  }
  async onOpen() {
    if (!this.unsub) this.unsub = this.plugin.index.subscribe(() => this.draw());
    this.draw();
  }
  async onClose() {
    this.unsub?.();
    this.unsub = null;
  }
  draw() {
    if (!this.contentEl) return;
    if (tryPatchNav(this.contentEl, this.plugin)) return;
    renderNavInto(this.contentEl, this.plugin);
  }
};

// src/quickAddModal.ts
var import_obsidian21 = require("obsidian");
var QuickAddModal = class extends import_obsidian21.Modal {
  /** `opts` belegt die Schnellerfassung aus dem Kontext der aufrufenden Seite vor – genauso wie
   *  der „+ Aufgabe"-Knopf unter dem Seitentitel (Label-Seite -> Label, Heute -> heute, …). */
  constructor(plugin, project, opts = {}) {
    super(plugin.app);
    this.plugin = plugin;
    this.cleanTitle = "";
    this.duePinned = false;
    // Datum manuell gesetzt/geleert -> Parser überschreibt nicht mehr
    this.parsedLabels = [];
    // aus dem Titel erkannte Labels (zum Trennen von manuellen)
    this.parsedProject = null;
    this.defaultProject = project ?? null;
    this.f = {
      title: "",
      project: this.defaultProject,
      status: firstOpenStatus(),
      due: opts.due ?? (opts.today ? todayStr() : null),
      dueTime: null,
      duration: null,
      scheduled: null,
      scheduledTime: null,
      priority: "normal",
      labels: opts.label ? [opts.label] : [],
      recurrence: null,
      recurBasis: "due",
      reminders: [],
      parent: null
    };
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-task-modal");
    modalEl.addClass("bt-quickadd");
    modalEl.addClass("bt-chips-icons-only");
    contentEl.empty();
    const input = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder: t("qa_placeholder") } });
    input.oninput = () => {
      this.f.title = input.value;
      this.parse();
      this.renderChips();
      this.renderProjekt();
    };
    input.onkeydown = (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        void this.submit();
      }
    };
    window.setTimeout(() => input.focus(), 0);
    this.input = input;
    const row = contentEl.createDiv({ cls: "bt-qa-row" });
    this.projektBtn = row.createEl("button", { cls: "bt-projekt" });
    this.projektBtn.onclick = (e) => this.openProject(e.currentTarget);
    this.chipBar = row.createDiv({ cls: "bt-chips bt-qa-chips" });
    const right = row.createDiv({ cls: "bt-qa-foot-right" });
    const full = right.createEl("button", { cls: "bt-qa-icon", attr: { "aria-label": t("qa_open_full"), "data-tooltip-position": "top" } });
    (0, import_obsidian21.setIcon)(full, "maximize-2");
    full.onclick = () => this.openInFull();
    const submit = right.createEl("button", { cls: "mod-cta bt-qa-submit", attr: { "aria-label": t("btn_add_task"), "data-tooltip-position": "top" } });
    (0, import_obsidian21.setIcon)(submit, "arrow-up");
    submit.onclick = () => void this.submit();
    this.parse();
    this.renderChips();
    this.renderProjekt();
  }
  onClose() {
    this.contentEl.empty();
  }
  /** Natural-Language aus dem Titel: Datum, Uhrzeit, Priorität, #Labels, @Projekt. Manuell (per
   *  Chip) gesetzte Werte bleiben erhalten. Spiegelt die Logik von TaskModal.applyParse. */
  parse() {
    if (!this.plugin.settings.parseNaturalLanguage) {
      this.cleanTitle = this.f.title;
      return;
    }
    const { bereiche, projekte } = listProjectsAndAreas(this.app);
    const projNames = [...bereiche, ...projekte].map((p2) => p2.name);
    const p = parseQuickEntry(this.f.title, projNames);
    this.cleanTitle = p.title;
    if (!this.duePinned && p.faellig) this.f.due = p.faellig;
    if (!this.duePinned && p.time) this.f.dueTime = p.time;
    if (p.priority) this.f.priority = p.priority;
    if (p.project) {
      this.f.project = p.project;
      this.parsedProject = p.project;
    } else if (this.parsedProject && this.f.project === this.parsedProject) {
      this.f.project = this.defaultProject;
      this.parsedProject = null;
    }
    const manual = this.f.labels.filter((l) => !this.parsedLabels.includes(l));
    this.parsedLabels = [...new Set(p.tags)].filter((tag) => !manual.includes(tag));
    this.f.labels = [...manual, ...this.parsedLabels];
  }
  // ── Chips (gemeinsame Registry) ──
  /** Brücke Modal ⇄ Chip-Registry. Kein existing (Neu-Anlage): Status nur lokal, keine Ausschlüsse. */
  chipHost() {
    return {
      plugin: this.plugin,
      app: this.app,
      f: this.f,
      surface: "quickAdd",
      rerender: () => this.renderChips(),
      compactLabels: true,
      // Priorität als „P1" (kompakt)
      iconsOnly: true,
      // leere Chips stets nur Icon
      applyStatus: (s) => {
        this.f.status = s;
        this.renderChips();
      },
      pinDue: () => {
        this.duePinned = true;
      },
      resetParsedLabels: () => {
        this.parsedLabels = [];
      },
      onParentPicked: (proj) => {
        if (proj) {
          this.f.project = proj;
          this.parsedProject = null;
          this.renderProjekt();
        }
      },
      // Details in der Schnelleingabe hat keinen Inline-Log -> öffnet den vollen Editor mit
      // aufgeklapptem Detailbereich (Schnelleingabe bleibt eine reine Ein-Zeilen-Erfassung).
      toggleDetails: () => this.openInFull(true),
      detailsOpen: () => false,
      chipEnabled: () => true
    };
  }
  renderChips() {
    const bar = this.chipBar;
    bar.empty();
    const host = this.chipHost();
    const settings = this.plugin.settings;
    for (const id of resolveChipOrder(settings, host.surface)) {
      const c = CHIPS[id];
      const set = c.isSet(this.f, host);
      if (!isInline(settings, host.surface, id, set)) continue;
      if (c.kind === "status") renderStatusChip(bar, host, c);
      else if (c.kind === "details") this.renderDetailsChip(bar);
      else renderValueChip(bar, host, c, set);
    }
    const acts = bar.createEl("button", { cls: "bt-chip bt-chip-actions" + (plusHasSetHidden(host) ? " has-set" : ""), attr: { "aria-label": t("task_actions"), "data-tooltip-position": "top" } });
    (0, import_obsidian21.setIcon)(acts.createSpan({ cls: "bt-chip-ic" }), "plus");
    acts.onclick = (e) => {
      e.stopPropagation();
      this.openPlusMenu(acts);
    };
  }
  /** Details-Chip: öffnet den vollen Editor mit aufgeklapptem Detailbereich (kein Inline-Log). */
  renderDetailsChip(bar) {
    const chip = bar.createEl("button", { cls: "bt-chip bt-chip-details", attr: { "aria-label": t("details"), "data-tooltip-position": "top" } });
    (0, import_obsidian21.setIcon)(chip.createSpan({ cls: "bt-chip-ic" }), "paperclip");
    chip.createSpan({ cls: "bt-chip-lbl", text: t("details") });
    chip.onclick = (e) => {
      e.stopPropagation();
      this.openInFull(true);
    };
  }
  /** „+"-Popover (Erstell-Modus, schlank): ausgeblendete Chips + „Aufgabenaktionen bearbeiten". */
  openPlusMenu(anchor) {
    const host = this.chipHost();
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-plus");
      const any = renderPlusChips(pop, host, anchor, close);
      if (any) pop.createDiv({ cls: "bt-plus-sep" });
      popRow(pop, "sliders-horizontal", t("edit_task_actions"), () => {
        close();
        openChipSettings(this.app);
      });
    });
  }
  // ── Projekt ──
  renderProjekt() {
    this.projektBtn.empty();
    const { bereiche, projekte } = listProjectsAndAreas(this.app);
    const inbox = isInboxLink(this.f.project);
    const sel = inbox ? null : [...bereiche, ...projekte].find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    (0, import_obsidian21.setIcon)(ic, inbox ? "inbox" : sel?.icon ?? "folder");
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: inbox ? t("nav_inbox") : projectDisplayName(this.f.project) });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" });
    (0, import_obsidian21.setIcon)(car, "chevron-down");
  }
  openProject(anchor) {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      const { bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name) => {
        this.f.project = name;
        this.parsedProject = null;
        this.renderProjekt();
        close();
      };
      popRow(pop, "inbox", t("nav_inbox"), () => pick(null), isInboxLink(this.f.project));
      const group = (title, items) => {
        if (!items.length) return;
        pop.createDiv({ cls: "bt-pop-head", text: title });
        for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), this.f.project === it.name, it.color ?? void 0);
      };
      group(t("group_area"), bereiche);
      group(t("group_project"), projekte);
    });
  }
  // ── Speichern / Brücke ──
  titleValue() {
    return (this.cleanTitle || this.f.title).trim();
  }
  /** Aufgabe anlegen und für die nächste offen bleiben (Multi-Add). Das gewählte Projekt bleibt
   *  erhalten; die Liste im Hintergrund aktualisiert sich über den Index-Listener von selbst. */
  async submit() {
    const title = this.titleValue();
    if (!title) {
      new import_obsidian21.Notice(t("err_enter_taskname"));
      return;
    }
    await createTaskNote(this.app, this.plugin.settings, {
      title,
      status: this.f.status,
      due: this.f.due,
      dueTime: this.f.dueTime,
      duration: this.f.duration,
      scheduled: this.f.scheduled,
      scheduledTime: this.f.scheduledTime,
      priority: this.f.priority,
      labels: this.f.labels,
      recurrence: this.f.recurrence,
      recurBasis: this.f.recurBasis,
      reminders: this.f.reminders,
      parent: this.f.parent,
      project: this.f.project
    });
    new import_obsidian21.Notice(t("qa_added"));
    const project = this.f.project;
    this.f = {
      title: "",
      project,
      status: firstOpenStatus(),
      due: null,
      dueTime: null,
      duration: null,
      scheduled: null,
      scheduledTime: null,
      priority: "normal",
      labels: [],
      recurrence: null,
      recurBasis: "due",
      reminders: [],
      parent: null
    };
    this.cleanTitle = "";
    this.duePinned = false;
    this.parsedLabels = [];
    this.parsedProject = null;
    this.input.value = "";
    this.renderChips();
    this.input.focus();
  }
  /** Modal schließen und den vollständigen Stand ins volle TaskModal übergeben: bereinigten Titel
   *  (NL-Token bereits ausgewertet) + alle gesetzten Chips als Seed. openDetails = Detailbereich
   *  (Beschreibung/Kommentare) direkt aufgeklappt (vom Details-Chip ausgelöst). */
  openInFull(openDetails = false) {
    const title = this.titleValue();
    const project = this.f.project ?? void 0;
    const seed = {
      status: this.f.status,
      due: this.f.due,
      dueTime: this.f.dueTime,
      duration: this.f.duration,
      scheduled: this.f.scheduled,
      scheduledTime: this.f.scheduledTime,
      priority: this.f.priority,
      labels: [...this.f.labels],
      recurrence: this.f.recurrence,
      recurBasis: this.f.recurBasis,
      reminders: [...this.f.reminders],
      parent: this.f.parent
    };
    this.close();
    new TaskModal(this.plugin, void 0, project, { defaultTitle: title, seed, openDetails }).open();
  }
};

// src/settingsTab.ts
var import_obsidian25 = require("obsidian");

// src/statusEditor.ts
var import_obsidian22 = require("obsidian");
var KIND_KEY = { open: "status_kind_open", done: "status_kind_done", cancelled: "status_kind_cancelled" };
var KIND_ICON2 = { open: "circle", done: "check-circle", cancelled: "x-circle" };
var ICON_PRESETS = [
  "circle",
  "contrast",
  "circle-dot",
  "circle-dashed",
  "check-circle",
  "x-circle",
  "clock",
  "loader",
  "pause",
  "play",
  "flag",
  "star",
  "alert-circle",
  "eye",
  "inbox",
  "zap"
];
var KIND_ORDER = ["open", "done", "cancelled"];
var GROUP_TITLE = { open: "status_kind_open", done: "status_kind_done", cancelled: "nav_trash" };
function renderStatusEditor(container, plugin) {
  container.empty();
  container.addClass("bt-view");
  container.addClass("bt-status-editor");
  const redraw = () => renderStatusEditor(container, plugin);
  const head = container.createDiv({ cls: "bt-status-head" });
  head.createEl("p", { cls: "bt-manage-hint", text: t("status_hint") });
  const resetWrap = head.createDiv({ cls: "bt-status-reset-wrap" });
  const resetBtn = resetWrap.createEl("button", { cls: "bt-chip-reset", text: t("status_reset_default") });
  resetBtn.onclick = () => confirmInline(resetWrap, t("confirm_reset_statuses_q"), () => then(plugin.resetStatuses(), redraw), redraw);
  const statuses = plugin.getStatuses();
  const roles = { newTask: firstOpenStatus(), done: firstDoneStatus(), trash: statuses.find((s) => s.kind === "cancelled")?.id };
  const groupLists = [];
  const persist = () => {
    const order = [];
    for (const g of groupLists) for (const r of Array.from(g.children)) {
      const k = r.getAttr("data-key");
      if (k) order.push(k);
    }
    then(plugin.setStatusOrder(order), redraw);
  };
  for (const kind of KIND_ORDER) {
    const rows = statuses.filter((s) => s.kind === kind);
    const block = container.createDiv({ cls: "bt-status-group" });
    block.createDiv({ cls: "bt-status-group-title", text: t(GROUP_TITLE[kind]) });
    const listEl = block.createDiv({ cls: "bt-manage-list" });
    groupLists.push(listEl);
    for (const s of rows) statusRow(listEl, plugin, s, rows.length, roles, persist, redraw);
    if (kind !== "cancelled") addRow(block, t("status_add"), t("placeholder_status_name"), (v) => plugin.addStatus(v, kind), redraw);
  }
}
function then(p, redraw) {
  void p.then(redraw);
}
function statusRow(list, plugin, s, groupCount, roles, persist, redraw) {
  const row = list.createDiv({ cls: "bt-manage-row bt-status-row", attr: { "data-key": s.id } });
  const grip = row.createSpan({ cls: "bt-nav-grip", attr: { role: "button", tabindex: "0", "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
  (0, import_obsidian22.setIcon)(grip, "grip-vertical");
  grip.onkeydown = (e) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      then(plugin.moveStatus(s.id, -1), redraw);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      then(plugin.moveStatus(s.id, 1), redraw);
    }
  };
  attachRowDrag(row, grip, list, () => persist());
  const dot = row.createSpan({ cls: "bt-status-dot" });
  (0, import_obsidian22.setIcon)(dot, statusIcon(s.id));
  dot.style.color = statusTint(s.id);
  const name = row.createSpan({ cls: "bt-manage-name bt-status-name", text: statusLabel(s.id) });
  name.onclick = () => startStatusRename(row, plugin, s, redraw);
  const roleKey = s.id === roles.newTask ? "role_new_tasks" : s.id === roles.done ? "role_on_complete" : s.id === roles.trash ? "role_trash" : null;
  if (roleKey) row.createSpan({ cls: "bt-status-role", text: t(roleKey) });
  const cnt = plugin.statusTaskCount(s.id);
  if (cnt) row.createSpan({ cls: "bt-manage-count", text: String(cnt) });
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  const kindBtn = actions.createEl("button", { cls: "bt-tab bt-status-kind", text: t(KIND_KEY[s.kind]) });
  kindBtn.onclick = (e) => {
    e.stopPropagation();
    openKindPicker(kindBtn, plugin, s, redraw);
  };
  const iconB = iconBtn(actions, "shapes", t("status_pick_icon"), () => openIconPicker(iconB, plugin, s, redraw));
  const colB = iconBtn(actions, "palette", t("status_pick_color"), () => openColorPicker(colB, s.color ?? null, (c) => then(plugin.setStatusColor(s.id, c), redraw)));
  const delB = iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => then(plugin.deleteStatus(s.id), redraw), redraw));
  if (groupCount <= 1) delB.disabled = true;
}
function startStatusRename(row, plugin, s, redraw) {
  row.empty();
  row.addClass("is-editing");
  const input = row.createEl("input", { type: "text", cls: "bt-manage-input" });
  input.value = statusLabel(s.id);
  const save = async () => {
    await plugin.renameStatus(s.id, input.value);
    redraw();
  };
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "check", t("btn_save"), () => void save());
  iconBtn(actions, "x", t("btn_cancel"), redraw);
  input.onkeydown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void save();
    } else if (e.key === "Escape") {
      e.preventDefault();
      redraw();
    }
  };
  window.setTimeout(() => {
    input.focus();
    input.select();
  }, 0);
}
function openKindPicker(anchor, plugin, s, redraw) {
  openPopover(anchor, (pop, close) => {
    ["open", "done", "cancelled"].forEach((k) => {
      const row = pop.createDiv({ cls: "bt-row" + (s.kind === k ? " is-active" : "") });
      const ic = row.createSpan({ cls: "bt-row-ic" });
      (0, import_obsidian22.setIcon)(ic, KIND_ICON2[k]);
      row.createSpan({ cls: "bt-row-lbl", text: t(KIND_KEY[k]) });
      row.onclick = () => {
        then(plugin.setStatusKind(s.id, k), redraw);
        close();
      };
    });
  });
}
function openIconPicker(anchor, plugin, s, redraw) {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-icon-grid");
    for (const ic of ICON_PRESETS) {
      const b = pop.createEl("button", { cls: "bt-icon-cell" + (s.icon === ic ? " is-active" : ""), attr: { "aria-label": ic } });
      (0, import_obsidian22.setIcon)(b, ic);
      b.onclick = () => {
        then(plugin.setStatusIcon(s.id, ic), redraw);
        close();
      };
    }
  });
}

// src/gcalSync.ts
var import_obsidian24 = require("obsidian");

// src/gcalAuth.ts
var import_obsidian23 = require("obsidian");
var AUTH_ENDPOINT = "https://accounts.google.com/o/oauth2/v2/auth";
var TOKEN_ENDPOINT = "https://oauth2.googleapis.com/token";
var REVOKE_ENDPOINT = "https://oauth2.googleapis.com/revoke";
var DEVICE_ENDPOINT = "https://oauth2.googleapis.com/device/code";
var DEVICE_GRANT = "urn:ietf:params:oauth:grant-type:device_code";
var GCAL_SCOPE = "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.app.created";
var EXPIRY_SKEW_MS = 6e4;
var LOOPBACK_TIMEOUT_MS = 18e4;
var GCalAuthError = class extends Error {
};
function base64url(buf) {
  let s = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function randomToken(bytes = 32) {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)).buffer);
}
async function pkcePair() {
  const verifier = randomToken(32);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(digest) };
}
function form(params) {
  return Object.entries(params).map(([k, v]) => encodeURIComponent(k) + "=" + encodeURIComponent(v)).join("&");
}
async function postForm(url, params) {
  const res = await (0, import_obsidian23.requestUrl)({
    url,
    method: "POST",
    contentType: "application/x-www-form-urlencoded",
    body: form(params),
    throw: false
  });
  let json = {};
  try {
    json = res.json;
  } catch {
  }
  if (res.status >= 400) {
    const err = json.error_description || json.error || `HTTP ${res.status}`;
    throw new GCalAuthError(String(err));
  }
  return json;
}
function toTokens(json, prevRefresh) {
  const access = json.access_token;
  const refresh = json.refresh_token ?? prevRefresh;
  const expiresIn = json.expires_in ?? 3600;
  if (!access || !refresh) throw new GCalAuthError("Unvollst\xE4ndige Token-Antwort von Google.");
  return {
    accessToken: access,
    refreshToken: refresh,
    expiresAt: Date.now() + expiresIn * 1e3,
    scope: json.scope
  };
}
var GCalAuth = class {
  constructor(getCredentials, store) {
    this.getCredentials = getCredentials;
    this.store = store;
  }
  isConnected() {
    const t2 = this.store.load();
    return !!t2?.refreshToken;
  }
  account() {
    return this.store.load()?.account ?? null;
  }
  /** Gültiges Access-Token liefern; bei Bedarf transparent per Refresh-Token erneuern. */
  async getAccessToken() {
    const t2 = this.store.load();
    if (!t2?.refreshToken) throw new GCalAuthError("Nicht mit Google verbunden.");
    if (t2.accessToken && Date.now() < t2.expiresAt - EXPIRY_SKEW_MS) return t2.accessToken;
    return this.refresh(t2);
  }
  async refresh(t2) {
    const creds = this.requireCredentials();
    const json = await postForm(TOKEN_ENDPOINT, {
      client_id: creds.clientId,
      ...creds.clientSecret ? { client_secret: creds.clientSecret } : {},
      refresh_token: t2.refreshToken,
      grant_type: "refresh_token"
    });
    const next = toTokens(json, t2.refreshToken);
    next.account = t2.account;
    await this.store.save(next);
    return next.accessToken;
  }
  /** Plattform-passender Login. onDevicePrompt nur für den Mobile-Device-Flow relevant. */
  async connect(onDevicePrompt) {
    const tokens = import_obsidian23.Platform.isDesktopApp ? await this.connectLoopback() : await this.connectDevice(onDevicePrompt);
    await this.store.save(tokens);
    return tokens;
  }
  /** Verbindung trennen: Refresh-Token bei Google widerrufen + lokal löschen (best effort). */
  async disconnect() {
    const t2 = this.store.load();
    if (t2?.refreshToken) {
      try {
        await postForm(REVOKE_ENDPOINT, { token: t2.refreshToken });
      } catch {
      }
    }
    await this.store.save(null);
  }
  requireCredentials() {
    const creds = this.getCredentials();
    if (!creds?.clientId) throw new GCalAuthError("Keine Google-Zugangsdaten hinterlegt.");
    return creds;
  }
  // ── Desktop: Loopback-Server + PKCE ──
  async connectLoopback() {
    const creds = this.requireCredentials();
    const { verifier, challenge } = await pkcePair();
    const state = randomToken(16);
    const http = window.require("http");
    const { code, redirectUri } = await new Promise(
      (resolve, reject) => {
        const server = http.createServer((req, res) => {
          try {
            const url = new URL(req.url ?? "/", "http://127.0.0.1");
            if (!url.searchParams.has("code") && !url.searchParams.has("error")) {
              res.writeHead(204).end();
              return;
            }
            const ok = url.searchParams.get("state") === state && url.searchParams.has("code");
            res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
            res.end(loopbackPage(ok));
            server.close();
            window.clearTimeout(timer);
            if (url.searchParams.get("error")) return reject(new GCalAuthError(url.searchParams.get("error")));
            if (!ok) return reject(new GCalAuthError("Ung\xFCltige Antwort (state stimmt nicht)."));
            resolve({ code: url.searchParams.get("code"), redirectUri: base });
          } catch (e) {
            reject(e instanceof Error ? e : new GCalAuthError(String(e)));
          }
        });
        let base = "";
        const timer = window.setTimeout(() => {
          server.close();
          reject(new GCalAuthError("Zeit\xFCberschreitung bei der Google-Anmeldung."));
        }, LOOPBACK_TIMEOUT_MS);
        server.on("error", (e) => {
          window.clearTimeout(timer);
          reject(e);
        });
        server.listen(0, "127.0.0.1", () => {
          const addr = server.address();
          const port = typeof addr === "object" && addr ? addr.port : 0;
          base = `http://127.0.0.1:${port}`;
          const authUrl = AUTH_ENDPOINT + "?" + form({
            client_id: creds.clientId,
            redirect_uri: base,
            response_type: "code",
            scope: GCAL_SCOPE,
            code_challenge: challenge,
            code_challenge_method: "S256",
            state,
            access_type: "offline",
            prompt: "consent"
            // erzwingt refresh_token auch bei erneutem Login
          });
          window.open(authUrl);
        });
      }
    );
    const json = await postForm(TOKEN_ENDPOINT, {
      client_id: creds.clientId,
      ...creds.clientSecret ? { client_secret: creds.clientSecret } : {},
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: redirectUri
    });
    return toTokens(json);
  }
  // ── Mobile: Device-Code-Flow ──
  async connectDevice(onPrompt) {
    const creds = this.requireCredentials();
    const dev = await postForm(DEVICE_ENDPOINT, { client_id: creds.clientId, scope: GCAL_SCOPE });
    const deviceCode = dev.device_code;
    const intervalMs = (dev.interval ?? 5) * 1e3;
    const expiresAt = Date.now() + (dev.expires_in ?? 1800) * 1e3;
    onPrompt?.({
      userCode: dev.user_code,
      verificationUrl: dev.verification_url ?? dev.verification_uri,
      expiresInSec: dev.expires_in ?? 1800
    });
    let wait = intervalMs;
    for (; ; ) {
      if (Date.now() > expiresAt) throw new GCalAuthError("Der Anmeldecode ist abgelaufen.");
      await sleep(wait);
      const res = await (0, import_obsidian23.requestUrl)({
        url: TOKEN_ENDPOINT,
        method: "POST",
        contentType: "application/x-www-form-urlencoded",
        body: form({
          client_id: creds.clientId,
          ...creds.clientSecret ? { client_secret: creds.clientSecret } : {},
          device_code: deviceCode,
          grant_type: DEVICE_GRANT
        }),
        throw: false
      });
      const json = res.json ?? {};
      if (res.status < 400) return toTokens(json);
      const err = json.error;
      if (err === "authorization_pending") continue;
      if (err === "slow_down") {
        wait += 5e3;
        continue;
      }
      throw new GCalAuthError(json.error_description || err || `HTTP ${res.status}`);
    }
  }
};
function sleep(ms2) {
  return new Promise((r) => window.setTimeout(r, ms2));
}
function loopbackPage(ok) {
  const msg = ok ? "\u2705 BeautyTasks ist jetzt mit Google Kalender verbunden." : "\u26A0\uFE0F Anmeldung fehlgeschlagen. Bitte in Obsidian erneut versuchen.";
  return `<!doctype html><html lang="de"><head><meta charset="utf-8">
<title>BeautyTasks</title><style>
body{font-family:system-ui,sans-serif;background:#1e1e1e;color:#eee;display:flex;
min-height:100vh;align-items:center;justify-content:center;margin:0}
div{max-width:28rem;text-align:center;line-height:1.5;padding:2rem}
</style></head><body><div><p>${msg}</p><p>Du kannst dieses Fenster schlie\xDFen.</p></div></body></html>`;
}

// src/gcalSync.ts
var GCalHttpError = class extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
};
var API = "https://www.googleapis.com/calendar/v3";
var SYNC_SOURCE = "beautytasks";
var DEBOUNCE_MS = 2e3;
var POLL_MS = 5 * 60 * 1e3;
var DEFAULT_CALENDAR_NAME = "BeautyTasks";
var DEFAULT_GCAL_SETTINGS = {
  enabled: false,
  clientId: "",
  clientSecret: "",
  calendarId: "",
  timezone: "Europe/Berlin",
  defaultDurationMin: 60,
  autoSync: true,
  syncOnCreate: true,
  syncOnUpdate: true,
  syncOnDelete: true,
  removeEventOnComplete: false,
  excludeInbox: false,
  notifyConflicts: false,
  showStatusBar: true,
  account: null,
  tokens: null,
  lastSynced: {},
  syncTokens: {}
};
async function api(auth, method, path, body) {
  const token = await auth.getAccessToken();
  for (let attempt = 0; ; attempt++) {
    const res = await (0, import_obsidian24.requestUrl)({
      url: API + path,
      method,
      headers: { Authorization: "Bearer " + token, "Content-Type": "application/json" },
      body: body != null ? JSON.stringify(body) : void 0,
      throw: false
    });
    if (res.status === 204 || !res.text) return null;
    if (res.status < 400) {
      try {
        return res.json;
      } catch {
        return null;
      }
    }
    if (res.status === 401) throw new GCalAuthError("Google-Verbindung abgelaufen \u2013 bitte neu verbinden.");
    if ((res.status === 403 || res.status === 429 || res.status >= 500) && attempt < 5) {
      await sleep2(Math.min(3e4, 2 ** attempt * 1e3) + Math.random() * 500);
      continue;
    }
    let msg = `HTTP ${res.status}`;
    try {
      msg = res.json.error?.message ?? msg;
    } catch {
    }
    throw new GCalHttpError(res.status, "Google Kalender: " + msg);
  }
}
async function listCalendars(auth) {
  const out = [];
  let pageToken;
  do {
    const q = pageToken ? "?pageToken=" + encodeURIComponent(pageToken) : "";
    const resp = await api(auth, "GET", "/users/me/calendarList" + q);
    for (const c of resp?.items ?? []) {
      out.push({ id: c.id, summary: c.summary ?? c.id, primary: !!c.primary });
    }
    pageToken = resp?.nextPageToken;
  } while (pageToken);
  return out;
}
async function fetchAccountEmail(auth) {
  const cal = await api(auth, "GET", "/calendars/primary");
  return cal?.id ?? null;
}
async function ensureDefaultCalendar(auth, timezone) {
  const existing = (await listCalendars(auth)).find((c) => c.summary === DEFAULT_CALENDAR_NAME);
  if (existing) return existing.id;
  const created = await api(auth, "POST", "/calendars", { summary: DEFAULT_CALENDAR_NAME, timeZone: timezone });
  return created?.id;
}
var isoDate = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
var isoDateTime = (d) => `${isoDate(d)}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;
function reminderOverrides(task, start) {
  const mins = resolveReminders(task).map((r) => Math.round((start.getTime() - r.fireAt.getTime()) / 6e4)).filter((m) => m >= 0 && m <= 40320);
  return [...new Set(mins)].slice(0, 5).map((minutes) => ({ method: "popup", minutes }));
}
function eventBody(task, s) {
  const timed = !!task.dueTime;
  const startDate = /* @__PURE__ */ new Date(task.due + "T" + (task.dueTime ?? "00:00"));
  let start, end;
  if (timed) {
    const endDate = new Date(startDate.getTime() + (task.duration ?? s.defaultDurationMin) * 6e4);
    start = { dateTime: isoDateTime(startDate), timeZone: s.timezone };
    end = { dateTime: isoDateTime(endDate), timeZone: s.timezone };
  } else {
    const next = new Date(startDate.getTime());
    next.setDate(next.getDate() + 1);
    start = { date: task.due };
    end = { date: isoDate(next) };
  }
  const overrides = reminderOverrides(task, startDate);
  return {
    summary: task.title,
    start,
    end,
    reminders: overrides.length ? { useDefault: false, overrides } : { useDefault: true },
    extendedProperties: { private: { syncSource: SYNC_SOURCE, btTaskId: task.id } }
  };
}
function eventDateParts(ev) {
  const start = ev.start;
  if (!start) return { due: null, dueTime: null };
  if (start.date) return { due: start.date, dueTime: null };
  if (start.dateTime) {
    const d = new Date(start.dateTime);
    if (isNaN(d.getTime())) return { due: null, dueTime: null };
    return {
      due: isoDate(d),
      dueTime: `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`
    };
  }
  return { due: null, dueTime: null };
}
async function pullEvents(auth, calendarId, syncToken) {
  const items = [];
  let pageToken;
  let nextSyncToken = null;
  do {
    const q = new URLSearchParams({ singleEvents: "true", showDeleted: "true", maxResults: "2500" });
    if (syncToken) q.set("syncToken", syncToken);
    else q.set("privateExtendedProperty", "syncSource=" + SYNC_SOURCE);
    if (pageToken) q.set("pageToken", pageToken);
    const resp = await api(auth, "GET", `/calendars/${enc(calendarId)}/events?` + q.toString());
    for (const ev of resp?.items ?? []) items.push(ev);
    pageToken = resp?.nextPageToken;
    nextSyncToken = resp?.nextSyncToken ?? nextSyncToken;
  } while (pageToken);
  return { items, nextSyncToken };
}
function signature(task, calendarId) {
  return JSON.stringify([
    task.title,
    task.due,
    task.dueTime,
    task.duration,
    (task.reminders ?? []).join(","),
    calendarId
  ]);
}
var GCalSync = class {
  constructor(host, auth) {
    this.host = host;
    this.auth = auth;
    this.statusCbs = /* @__PURE__ */ new Set();
    this.info = { status: "disconnected", lastSyncedAt: null, lastError: null, account: null };
    this.unsub = null;
    this.debounceTimer = null;
    this.pollTimer = null;
    this.running = false;
    this.rerun = false;
    this.info.account = host.settings.account;
    this.info.status = auth.isConnected() ? "idle" : "disconnected";
  }
  // ── Öffentliche API ──
  onStatus(cb) {
    this.statusCbs.add(cb);
    cb(this.info);
    return () => this.statusCbs.delete(cb);
  }
  getStatus() {
    return this.info;
  }
  /** Auto-Sync verdrahten: bei Vault-Änderungen entprellt syncen + periodischer Pull
   *  (holt Google-Änderungen auch ohne lokale Edits). Beides an `autoSync` gekoppelt. Idempotent. */
  start() {
    if (this.unsub) return;
    this.unsub = this.host.subscribe(() => this.scheduleSync());
    this.pollTimer = window.setInterval(() => {
      if (this.host.settings.autoSync) void this.syncNow();
    }, POLL_MS);
  }
  stop() {
    this.unsub?.();
    this.unsub = null;
    if (this.debounceTimer) {
      window.clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.pollTimer) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }
  scheduleSync() {
    if (!this.canSync() || !this.host.settings.autoSync) return;
    if (this.debounceTimer) window.clearTimeout(this.debounceTimer);
    this.debounceTimer = window.setTimeout(() => {
      this.debounceTimer = null;
      void this.syncNow();
    }, DEBOUNCE_MS);
  }
  /** Ist der Sync tatsächlich aktiv (verbunden UND Hauptschalter an UND Ziel-Kalender gesetzt)?
   *  Auch die UI (per-Listen-Schalter/-Menü) hängt daran – tote Bedienelemente vermeiden. */
  canSync() {
    const s = this.host.settings;
    return s.enabled && !!s.calendarId && this.auth.isConnected();
  }
  /** Ein Zwei-Wege-Durchlauf (manuell oder entprellt): erst Pull, dann Push. Re-entrancy-sicher. */
  async syncNow() {
    if (!this.canSync()) return;
    if (this.running) {
      this.rerun = true;
      return;
    }
    this.running = true;
    this.emit({ status: "syncing", lastError: null });
    try {
      const pulled = await this.pullAll();
      await this.pushAll(pulled);
      await this.host.persist();
      this.emit({ status: "idle", lastSyncedAt: Date.now(), lastError: null });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.emit({ status: "error", lastError: msg });
    } finally {
      this.running = false;
      if (this.rerun) {
        this.rerun = false;
        void this.syncNow();
      }
    }
  }
  // ── Pull-Reconcile (Google → Obsidian) ──
  /** Liefert die Menge der Aufgaben-Ids, die gerade AUS Google zurückgeschrieben wurden –
   *  der Push überspringt sie diesen Lauf (metadataCache ist noch stale). */
  async pullAll() {
    const s = this.host.settings;
    const cal = s.calendarId;
    const pulled = /* @__PURE__ */ new Set();
    let result;
    try {
      result = await pullEvents(this.auth, cal, s.syncTokens[cal]);
    } catch (e) {
      if (!(e instanceof GCalHttpError && e.status === 410)) throw e;
      delete s.syncTokens[cal];
      result = await pullEvents(this.auth, cal, void 0);
    }
    const taskMap = new Map(this.host.allTasks().map((t2) => [t2.id, t2]));
    const byEvent = /* @__PURE__ */ new Map();
    for (const [tid, link] of Object.entries(s.lastSynced)) byEvent.set(link.eventId, tid);
    let conflicts = 0;
    for (const ev of result.items) {
      const eventId = ev.id;
      const priv = ev.extendedProperties?.private;
      const taskId = priv?.btTaskId ?? byEvent.get(eventId);
      if (!taskId) continue;
      const link = s.lastSynced[taskId];
      if (ev.status === "cancelled") {
        if (link && link.eventId === eventId) delete s.lastSynced[taskId];
        const task2 = taskMap.get(taskId);
        if (task2) await this.clearBack(task2);
        continue;
      }
      const task = taskMap.get(taskId);
      if (!task || !link || link.eventId !== eventId) continue;
      const g = eventDateParts(ev);
      const known = link.due !== void 0;
      const lastDue = known ? link.due ?? null : task.due ?? null;
      const lastDueTime = known ? link.dueTime ?? null : task.dueTime ?? null;
      const gChanged = g.due !== lastDue || g.dueTime !== lastDueTime;
      if (!gChanged) {
        if (!known) {
          link.due = g.due;
          link.dueTime = g.dueTime;
        }
        continue;
      }
      const oChanged = task.due !== lastDue || task.dueTime !== lastDueTime;
      if (oChanged) {
        conflicts++;
        continue;
      }
      await this.writeBackDue(task, g.due, g.dueTime);
      link.due = g.due;
      link.dueTime = g.dueTime;
      link.sig = signature({ ...task, due: g.due, dueTime: g.dueTime }, cal);
      pulled.add(taskId);
    }
    if (result.nextSyncToken) s.syncTokens[cal] = result.nextSyncToken;
    if (conflicts && s.notifyConflicts) new import_obsidian24.Notice(t("gcal_conflicts_notice", conflicts));
    return pulled;
  }
  // ── Push-Reconcile (Obsidian → Google) ──
  /** `skip` = Aufgaben, die dieser Lauf gerade aus Google zurückgeschrieben hat (stale Cache). */
  async pushAll(skip) {
    const s = this.host.settings;
    const cal = s.calendarId;
    const tasks = this.host.allTasks();
    const eligible = /* @__PURE__ */ new Map();
    for (const t2 of tasks) if (this.isEligible(t2)) eligible.set(t2.id, t2);
    for (const [id, task] of eligible) {
      if (skip.has(id)) continue;
      const link = s.lastSynced[id];
      const eventId = link?.eventId ?? this.frontmatterEventId(task);
      const sig = signature(task, cal);
      const stamp = (evId) => ({ eventId: evId, calendarId: cal, sig, due: task.due, dueTime: task.dueTime });
      if (!eventId) {
        if (!s.syncOnCreate) continue;
        const ev = await api(this.auth, "POST", `/calendars/${enc(cal)}/events`, eventBody(task, s));
        const newId3 = ev?.id;
        if (newId3) {
          s.lastSynced[id] = stamp(newId3);
          await this.writeBack(task, newId3, cal);
        }
      } else if (!link || link.sig !== sig || link.calendarId !== cal) {
        if (!s.syncOnUpdate) continue;
        try {
          if (link && link.calendarId !== cal) {
            await api(this.auth, "POST", `/calendars/${enc(link.calendarId)}/events/${enc(eventId)}/move?destination=${enc(cal)}`);
          }
          await api(this.auth, "PATCH", `/calendars/${enc(cal)}/events/${enc(eventId)}`, eventBody(task, s));
          s.lastSynced[id] = stamp(eventId);
          await this.writeBack(task, eventId, cal);
        } catch (e) {
          if (!(e instanceof GCalHttpError && (e.status === 404 || e.status === 410))) throw e;
          const ev = await api(this.auth, "POST", `/calendars/${enc(cal)}/events`, eventBody(task, s));
          const newId3 = ev?.id;
          if (newId3) {
            s.lastSynced[id] = stamp(newId3);
            await this.writeBack(task, newId3, cal);
          }
        }
      }
    }
    for (const id of Object.keys(s.lastSynced)) {
      if (eligible.has(id)) continue;
      if (!s.syncOnDelete) continue;
      const link = s.lastSynced[id];
      try {
        await api(this.auth, "DELETE", `/calendars/${enc(link.calendarId)}/events/${enc(link.eventId)}`);
      } catch (e) {
        if (!(e instanceof GCalHttpError && (e.status === 404 || e.status === 410))) throw e;
      }
      delete s.lastSynced[id];
      const t2 = this.host.allTasks().find((x) => x.id === id);
      if (t2) await this.clearBack(t2);
    }
  }
  isEligible(t2) {
    if (!t2.due) return false;
    if (isTrashed(t2.status)) return false;
    if (this.host.settings.removeEventOnComplete && isDoneStatus(t2)) return false;
    if (this.projectExcluded(t2)) return false;
    return true;
  }
  frontmatterOf(path) {
    const f = this.host.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian24.TFile)) return null;
    return this.host.app.metadataCache.getFileCache(f)?.frontmatter ?? null;
  }
  projectExcluded(t2) {
    if (isInboxLink(t2.project)) return this.host.settings.excludeInbox;
    return this.frontmatterOf(t2.project)?.gcal_sync === false;
  }
  frontmatterEventId(t2) {
    const id = this.frontmatterOf(t2.path)?.gcal_event_id;
    return typeof id === "string" && id ? id : void 0;
  }
  async writeBack(t2, eventId, calendarId) {
    const f = this.host.app.vault.getAbstractFileByPath(t2.path);
    if (!(f instanceof import_obsidian24.TFile)) return;
    await this.host.app.fileManager.processFrontMatter(f, (fm) => {
      fm.gcal_event_id = eventId;
      fm.gcal_calendar_id = calendarId;
    });
  }
  async clearBack(t2) {
    const f = this.host.app.vault.getAbstractFileByPath(t2.path);
    if (!(f instanceof import_obsidian24.TFile)) return;
    await this.host.app.fileManager.processFrontMatter(f, (fm) => {
      delete fm.gcal_event_id;
      delete fm.gcal_calendar_id;
    });
  }
  /** Datum/Uhrzeit aus Google in die Notiz zurückschreiben (Frontmatter `due` = kombiniert). */
  async writeBackDue(t2, due, dueTime) {
    const f = this.host.app.vault.getAbstractFileByPath(t2.path);
    if (!(f instanceof import_obsidian24.TFile)) return;
    await this.host.app.fileManager.processFrontMatter(f, (fm) => {
      if (due) fm.due = combineDT(due, dueTime);
      else delete fm.due;
    });
  }
  // ── intern ──
  emit(patch) {
    this.info = { ...this.info, ...patch, account: this.host.settings.account };
    for (const cb of this.statusCbs) cb(this.info);
  }
};
function enc(s) {
  return encodeURIComponent(s);
}
function sleep2(ms2) {
  return new Promise((r) => window.setTimeout(r, ms2));
}
function isDoneStatus(t2) {
  return isDone(t2.status);
}

// src/settingsTab.ts
var CHIP_TIERS = ["shown", "onValue", "hidden"];
var GCAL_GUIDE_URL = "https://github.com/avnibilgin/BeautyTasks#google-calendar-sync";
function attachChipDrag(row, grip, zones, onDrop) {
  grip.addEventListener("pointerdown", (ev) => {
    ev.preventDefault();
    const doc = row.ownerDocument;
    row.addClass("is-dragging");
    const onMove = (me) => {
      const y = me.clientY;
      let target = zones.find((z6) => {
        const r = z6.getBoundingClientRect();
        return y >= r.top && y <= r.bottom;
      });
      if (!target) {
        let best = Infinity;
        for (const z6 of zones) {
          const r = z6.getBoundingClientRect();
          const dy = y < r.top ? r.top - y : y - r.bottom;
          if (dy < best) {
            best = dy;
            target = z6;
          }
        }
      }
      if (!target) return;
      const sibs = Array.from(target.children).filter((el) => el !== row);
      let placed = false;
      for (const sib of sibs) {
        const r = sib.getBoundingClientRect();
        if (y < r.top + r.height / 2) {
          target.insertBefore(row, sib);
          placed = true;
          break;
        }
      }
      if (!placed) target.appendChild(row);
    };
    const onUp = () => {
      row.removeClass("is-dragging");
      doc.removeEventListener("pointermove", onMove);
      doc.removeEventListener("pointerup", onUp);
      onDrop();
    };
    doc.addEventListener("pointermove", onMove);
    doc.addEventListener("pointerup", onUp);
  });
}
var FolderSuggest = class extends import_obsidian25.AbstractInputSuggest {
  constructor(appRef, textInputEl, onPick) {
    super(appRef, textInputEl);
    this.appRef = appRef;
    this.onPick = onPick;
  }
  getSuggestions(query) {
    const q = query.toLowerCase();
    const out = [];
    for (const f of this.appRef.vault.getAllLoadedFiles()) {
      if (f instanceof import_obsidian25.TFolder && f.path.toLowerCase().includes(q)) {
        out.push(f);
        if (out.length >= 100) break;
      }
    }
    return out;
  }
  renderSuggestion(folder, el) {
    el.setText(folder.path || "/");
  }
  selectSuggestion(folder) {
    this.setValue(folder.path);
    this.onPick(folder.path);
    this.close();
  }
};
var BeautyTasksSettingTab = class extends import_obsidian25.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.gcalStatusUnsub = null;
  }
  hide() {
    this.gcalStatusUnsub?.();
    this.gcalStatusUnsub = null;
  }
  display() {
    const { containerEl } = this;
    this.gcalStatusUnsub?.();
    this.gcalStatusUnsub = null;
    containerEl.empty();
    const p = this.plugin;
    new import_obsidian25.Setting(containerEl).setName(t("set_folders_heading")).setHeading();
    const folderRow = (name, desc, get, set) => {
      new import_obsidian25.Setting(containerEl).setName(name).setDesc(desc).addText((text) => {
        text.setValue(get());
        const save = (raw) => {
          const v = (0, import_obsidian25.normalizePath)(raw.trim());
          if (v && v !== ".") {
            set(v);
            void p.saveSettings();
          }
        };
        text.onChange(save);
        new FolderSuggest(this.app, text.inputEl, (path) => {
          text.setValue(path);
          save(path);
        });
      });
    };
    folderRow(t("set_folder_items"), t("set_folder_items_desc"), () => p.settings.itemsFolder, (v) => p.settings.itemsFolder = v);
    folderRow(t("set_folder_projects"), t("set_folder_projects_desc"), () => p.settings.projectsFolder, (v) => p.settings.projectsFolder = v);
    folderRow(t("set_folder_attachments"), t("set_folder_attachments_desc"), () => p.settings.attachmentsFolder, (v) => p.settings.attachmentsFolder = v);
    new import_obsidian25.Setting(containerEl).setName(t("set_exclude_folders")).setDesc(t("set_exclude_folders_desc")).addTextArea((ta) => {
      ta.setValue(p.settings.excludeFolders.join("\n"));
      ta.inputEl.rows = 3;
      ta.onChange(async (v) => {
        p.settings.excludeFolders = v.split("\n").map((s) => (0, import_obsidian25.normalizePath)(s.trim())).filter((s) => s && s !== ".");
        await p.saveSettings();
      });
      ta.inputEl.addEventListener("blur", () => {
        p.index.build();
        p.renderAll();
      });
    });
    new import_obsidian25.Setting(containerEl).setName(t("set_behavior_heading")).setHeading();
    new import_obsidian25.Setting(containerEl).setName(t("set_language")).setDesc(t("set_language_desc")).addDropdown((dd) => {
      dd.addOption("auto", t("set_language_auto"));
      dd.addOption("en", "English");
      dd.addOption("de", "Deutsch");
      dd.addOption("es", "Espa\xF1ol");
      dd.addOption("pt", "Portugu\xEAs (Brasil)");
      dd.addOption("fr", "Fran\xE7ais");
      dd.addOption("it", "Italiano");
      dd.addOption("tr", "T\xFCrk\xE7e");
      dd.addOption("ru", "\u0420\u0443\u0441\u0441\u043A\u0438\u0439");
      dd.addOption("zh", "\u7B80\u4F53\u4E2D\u6587");
      dd.addOption("ja", "\u65E5\u672C\u8A9E");
      dd.setValue(p.settings.locale);
      dd.onChange(async (v) => {
        p.settings.locale = v;
        await p.saveSettings();
        p.applyLocale();
        p.renderAll();
      });
    });
    new import_obsidian25.Setting(containerEl).setName(t("set_start_view")).setDesc(t("set_start_view_desc")).addDropdown((dd) => {
      for (const id of VIEW_IDS) dd.addOption(id, viewTitle(id));
      dd.addOption("last", t("set_start_view_last"));
      dd.setValue(p.settings.startView);
      dd.onChange(async (v) => {
        p.settings.startView = v;
        await p.saveSettings();
      });
    });
    new import_obsidian25.Setting(containerEl).setName(t("set_nl")).setDesc(t("set_nl_desc")).addToggle((tg) => tg.setValue(p.settings.parseNaturalLanguage).onChange(async (v) => {
      p.settings.parseNaturalLanguage = v;
      await p.saveSettings();
    }));
    new import_obsidian25.Setting(containerEl).setName(t("set_show_unfiled")).setDesc(t("set_show_unfiled_desc")).addToggle((tg) => tg.setValue(p.settings.showUnfiledInInbox).onChange(async (v) => {
      p.settings.showUnfiledInInbox = v;
      await p.saveSettings();
      p.renderAll();
    }));
    new import_obsidian25.Setting(containerEl).setName(t("set_show_desc")).setDesc(t("set_show_desc_desc")).addToggle((tg) => tg.setValue(p.settings.showDescriptionInList).onChange(async (v) => {
      p.settings.showDescriptionInList = v;
      await p.saveSettings();
      p.renderAll();
    }));
    new import_obsidian25.Setting(containerEl).setName(t("set_chips_iconsonly")).setDesc(t("set_chips_iconsonly_desc")).addToggle((tg) => tg.setValue(p.settings.chipsIconsOnly).onChange(async (v) => {
      p.settings.chipsIconsOnly = v;
      await p.saveSettings();
    }));
    new import_obsidian25.Setting(containerEl).setName(t("set_chip_actions")).setHeading();
    containerEl.createEl("div", { cls: "setting-item-description bt-chip-actions-desc", text: t("set_chip_actions_desc") });
    this.renderChipActions(containerEl);
    new import_obsidian25.Setting(containerEl).setName(t("tab_statuses")).setHeading();
    renderStatusEditor(containerEl.createDiv({ cls: "bt-settings-status" }), p);
    new import_obsidian25.Setting(containerEl).setName(t("set_data_heading")).setHeading();
    new import_obsidian25.Setting(containerEl).setName(t("set_export")).setDesc(t("set_export_desc")).addButton((b) => b.setButtonText(t("set_export_btn")).setCta().onClick(() => void p.exportTasksJson()));
    new import_obsidian25.Setting(containerEl).setName(t("set_import")).setDesc(t("set_import_desc")).addButton((b) => b.setButtonText(t("set_import_vault_btn")).onClick(() => p.importTasksFromVault())).addButton((b) => b.setButtonText(t("set_import_os_btn")).onClick(() => p.importTasksFromOs()));
    new import_obsidian25.Setting(containerEl).setName(t("set_import_tn")).setDesc(t("set_import_tn_desc")).addButton((b) => b.setButtonText(t("set_import_tn_btn")).onClick(() => p.importFromTaskNotes()));
    const gcalHost = containerEl.createDiv();
    const drawGCal = () => {
      gcalHost.empty();
      this.renderGCal(gcalHost, drawGCal);
    };
    drawGCal();
  }
  /** Google-Kalender-Sektion: vor dem Verbinden ein schlanker Setup-Assistent, danach der
   *  Verbunden-Zustand mit Status, Ziel-Kalender und Optionen (Feinkorn unter „Erweitert").
   *  Progressive Offenlegung – Optionen erscheinen erst nach erfolgreicher Verbindung.
   *  `redraw` zeichnet nur diese Sektion neu (kein this.display() → keine no-deprecated-Warnung). */
  renderGCal(containerEl, redraw) {
    const p = this.plugin;
    const g = p.settings.gcal;
    this.gcalStatusUnsub?.();
    this.gcalStatusUnsub = null;
    new import_obsidian25.Setting(containerEl).setName(t("set_gcal_heading")).setHeading();
    if (!p.gcalAuth.isConnected()) {
      containerEl.createEl("div", { cls: "setting-item-description", text: t("gcal_setup_desc") });
      new import_obsidian25.Setting(containerEl).addButton((b) => b.setButtonText(t("gcal_help_btn")).onClick(() => window.open(GCAL_GUIDE_URL)));
      let connectBtn = null;
      const refreshConnect = () => {
        connectBtn?.setDisabled(!g.clientId || !g.clientSecret);
      };
      new import_obsidian25.Setting(containerEl).setName(t("gcal_client_id")).addText((txt) => txt.setValue(g.clientId).onChange((v) => {
        g.clientId = v.trim();
        void p.saveSettings();
        refreshConnect();
      }));
      new import_obsidian25.Setting(containerEl).setName(t("gcal_client_secret")).addText((txt) => {
        txt.inputEl.type = "password";
        txt.setValue(g.clientSecret).onChange((v) => {
          g.clientSecret = v.trim();
          void p.saveSettings();
          refreshConnect();
        });
      });
      containerEl.createEl("div", { cls: "setting-item-description bt-gcal-hint", text: t("gcal_setup_hint") });
      new import_obsidian25.Setting(containerEl).addButton((b) => {
        connectBtn = b;
        b.setButtonText(t("gcal_connect_btn")).setCta().setDisabled(!g.clientId || !g.clientSecret).onClick(async () => {
          b.setButtonText(t("gcal_connecting")).setDisabled(true);
          try {
            await p.gcalConnect((dp) => new import_obsidian25.Notice(t("gcal_device_prompt", dp.verificationUrl, dp.userCode), 0));
          } catch (e) {
            new import_obsidian25.Notice(t("gcal_connect_failed", e instanceof Error ? e.message : String(e)));
          }
          redraw();
        });
      });
      return;
    }
    const head = new import_obsidian25.Setting(containerEl).setName(t("gcal_connected_as", g.account ?? "\u2014")).addButton((b) => b.setButtonText(t("gcal_disconnect_btn")).onClick(async () => {
      await p.gcalDisconnect();
      redraw();
    }));
    head.nameEl.prepend(createSpan({ cls: "bt-gcal-dot" }));
    if (!g.calendarId) containerEl.createEl("div", { cls: "bt-gcal-warn", text: t("gcal_no_calendar_warn") });
    const statusSetting = new import_obsidian25.Setting(containerEl).addButton((b) => b.setButtonText(t("gcal_sync_now_btn")).onClick(() => void p.gcalSync.syncNow()));
    const renderStatus = (i) => {
      const txt = i.status === "syncing" ? t("gcal_syncing") : i.status === "error" ? t("gcal_sync_error", i.lastError ?? "") : t("gcal_last_synced", i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleString() : t("gcal_never"));
      statusSetting.setName(txt);
    };
    this.gcalStatusUnsub = p.gcalSync.onStatus(renderStatus);
    const calHost = containerEl.createDiv();
    void (async () => {
      let cals = [];
      let ok = false;
      try {
        cals = await p.gcalCalendars();
        ok = true;
      } catch {
      }
      new import_obsidian25.Setting(calHost).setName(t("gcal_target_calendar")).setDesc(t("gcal_target_calendar_desc")).addDropdown((dd) => {
        if (cals.length) for (const c of cals) dd.addOption(c.id, c.summary);
        else if (g.calendarId) dd.addOption(g.calendarId, g.calendarId);
        dd.setValue(g.calendarId);
        dd.onChange((v) => {
          g.calendarId = v;
          void p.saveSettings();
          void p.gcalSync.syncNow();
        });
      });
      if (ok && !cals.some((c) => c.summary === DEFAULT_CALENDAR_NAME)) {
        new import_obsidian25.Setting(calHost).setName(t("gcal_tip_create")).setDesc(t("gcal_tip_create_desc")).addButton((b) => b.setButtonText(t("gcal_create_calendar_btn")).setCta().onClick(async () => {
          try {
            await p.gcalCreateDefaultCalendar();
          } catch (e) {
            new import_obsidian25.Notice(t("gcal_create_calendar_failed", e instanceof Error ? e.message : String(e)));
          }
          redraw();
        }));
      }
    })();
    new import_obsidian25.Setting(containerEl).setName(t("gcal_enabled")).setDesc(t("gcal_enabled_desc")).addToggle((tg) => tg.setValue(g.enabled).onChange((v) => {
      g.enabled = v;
      void p.saveSettings();
      if (v) void p.gcalSync.syncNow();
    }));
    new import_obsidian25.Setting(containerEl).setName(t("gcal_autosync")).setDesc(t("gcal_autosync_desc")).addToggle((tg) => tg.setValue(g.autoSync).onChange((v) => {
      g.autoSync = v;
      void p.saveSettings();
    }));
    const adv = containerEl.createEl("details", { cls: "bt-gcal-advanced" });
    adv.createEl("summary", { text: t("gcal_advanced") });
    const av = adv.createDiv();
    const boolRow = (key, get, set) => {
      new import_obsidian25.Setting(av).setName(t(key)).addToggle((tg) => tg.setValue(get()).onChange((v) => {
        set(v);
        void p.saveSettings();
      }));
    };
    boolRow("gcal_on_create", () => g.syncOnCreate, (v) => g.syncOnCreate = v);
    boolRow("gcal_on_update", () => g.syncOnUpdate, (v) => g.syncOnUpdate = v);
    boolRow("gcal_on_delete", () => g.syncOnDelete, (v) => g.syncOnDelete = v);
    boolRow("gcal_remove_on_complete", () => g.removeEventOnComplete, (v) => g.removeEventOnComplete = v);
    new import_obsidian25.Setting(av).setName(t("gcal_duration")).addText((txt) => {
      txt.inputEl.type = "number";
      txt.setValue(String(g.defaultDurationMin)).onChange((v) => {
        const n = parseInt(v, 10);
        if (n > 0) {
          g.defaultDurationMin = n;
          void p.saveSettings();
        }
      });
    });
    new import_obsidian25.Setting(av).setName(t("gcal_timezone")).addText((txt) => txt.setValue(g.timezone).onChange((v) => {
      g.timezone = v.trim() || g.timezone;
      void p.saveSettings();
    }));
    new import_obsidian25.Setting(av).setName(t("gcal_statusbar")).addToggle((tg) => tg.setValue(g.showStatusBar).onChange((v) => {
      g.showStatusBar = v;
      void p.saveSettings();
      p.refreshGCalStatusBar();
    }));
    boolRow("gcal_notify_conflicts", () => g.notifyConflicts, (v) => g.notifyConflicts = v);
  }
  /** Fläche wählen (Normale Eingabe · Schnelleingabe) und darunter deren drei Tier-Zonen zeichnen.
   *  Beide Flächen haben getrennte Profile (chipProfiles). */
  renderChipActions(containerEl) {
    const p = this.plugin;
    const SURFACES = ["editor", "quickAdd"];
    let surface = "editor";
    const bar = containerEl.createDiv({ cls: "bt-chip-surface-bar" });
    const tabs = bar.createDiv({ cls: "bt-chip-surface-tabs" });
    const reset = bar.createEl("button", { cls: "bt-chip-reset", text: t("chip_reset_default") });
    const zonesHost = containerEl.createDiv();
    const drawTabs = () => {
      tabs.empty();
      for (const s of SURFACES) {
        const b = tabs.createEl("button", { cls: "bt-chip-surface-tab" + (s === surface ? " is-active" : ""), text: t(s === "editor" ? "chip_surface_editor" : "chip_surface_quickadd") });
        b.onclick = () => {
          if (s === surface) return;
          surface = s;
          drawTabs();
          this.renderChipZones(zonesHost, surface);
        };
      }
    };
    reset.onclick = async () => {
      if (p.settings.chipProfiles) delete p.settings.chipProfiles[surface];
      await p.saveSettings();
      this.renderChipZones(zonesHost, surface);
    };
    drawTabs();
    this.renderChipZones(zonesHost, surface);
  }
  /** Drei Tier-Zonen (Immer anzeigen · Bei Wert anzeigen · Immer im +-Menü) für EINE Fläche. Jede
   *  Chip-Zeile lässt sich per Griff zwischen den Zonen ziehen; Ablegen persistiert das Profil. */
  renderChipZones(containerEl, surface) {
    const p = this.plugin;
    containerEl.empty();
    const wrap = containerEl.createDiv({ cls: "bt-chip-zones" });
    const zones = [];
    const persist = () => {
      const order = [];
      const tiers = {};
      for (const z6 of zones) {
        const tier = z6.getAttr("data-tier");
        for (const r of Array.from(z6.children)) {
          const id = r.getAttr("data-id");
          if (!id) continue;
          order.push(id);
          tiers[id] = tier;
        }
      }
      const profiles = p.settings.chipProfiles ?? {};
      profiles[surface] = { order, tiers };
      p.settings.chipProfiles = profiles;
      void p.saveSettings();
    };
    for (const tier of CHIP_TIERS) {
      const block = wrap.createDiv({ cls: "bt-chip-zone-block" });
      block.createDiv({ cls: "bt-chip-zone-title", text: t("chip_tier_" + tier) });
      const zone = block.createDiv({ cls: "bt-chip-zone", attr: { "data-tier": tier } });
      zones.push(zone);
    }
    for (const id of resolveChipOrder(p.settings, surface)) {
      const c = CHIPS[id];
      const zone = zones[CHIP_TIERS.indexOf(chipTierOf(p.settings, surface, id))];
      const row = zone.createDiv({ cls: "bt-chip-row", attr: { "data-id": id } });
      const grip = row.createSpan({ cls: "bt-chip-grip", attr: { "aria-label": t("menu_reorder"), "data-tooltip-position": "top" } });
      (0, import_obsidian25.setIcon)(grip, "grip-vertical");
      (0, import_obsidian25.setIcon)(row.createSpan({ cls: "bt-chip-row-ic" }), c.icon);
      row.createSpan({ cls: "bt-chip-row-lbl", text: t(c.nameKey) });
      attachChipDrag(row, grip, zones, persist);
    }
  }
};

// src/importExport.ts
var import_obsidian26 = require("obsidian");
var EXPORT_FORMAT = "beautytasks";
var EXPORT_VERSION = 2;
var baseName5 = (p) => p.split("/").pop().replace(/\.md$/, "");
function makeImportData(lists, labels, tasks) {
  return { format: EXPORT_FORMAT, version: EXPORT_VERSION, exportedAt: (/* @__PURE__ */ new Date()).toISOString(), taskCount: tasks.length, lists, labels, tasks };
}
function buildExportData(plugin) {
  const tasks = plugin.index.all().map((tk) => ({
    id: tk.id,
    externalId: tk.externalId,
    title: tk.title,
    status: tk.status,
    priority: tk.priority,
    due: tk.due,
    dueTime: tk.dueTime,
    scheduled: tk.scheduled,
    scheduledTime: tk.scheduledTime,
    duration: tk.duration,
    start: tk.start,
    project: tk.project ? baseName5(tk.project) : null,
    parent: tk.parent ? baseName5(tk.parent) : null,
    labels: tk.labels,
    recurrence: tk.recurrence,
    recurBasis: tk.recurBasis,
    reminders: tk.reminders,
    created: tk.created,
    completed: tk.completed,
    cancelled: tk.cancelled,
    description: tk.description
  }));
  const { active, archived } = listManaged(plugin.app);
  const lists = [...active, ...archived].map((p) => ({
    name: p.name,
    type: p.type,
    color: p.color,
    archived: p.archived
  }));
  return {
    format: EXPORT_FORMAT,
    version: EXPORT_VERSION,
    exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
    taskCount: tasks.length,
    lists,
    labels: [...plugin.settings.knownLabels],
    tasks
  };
}
async function writeExportFile(plugin) {
  const { app, settings } = plugin;
  const data = buildExportData(plugin);
  const parts = settings.itemsFolder.split("/");
  const base = parts.length > 1 ? parts.slice(0, -1).join("/") : settings.itemsFolder;
  await ensureFolder(app, base);
  const d = /* @__PURE__ */ new Date();
  const z6 = (n2) => String(n2).padStart(2, "0");
  const stamp = `${d.getFullYear()}-${z6(d.getMonth() + 1)}-${z6(d.getDate())}-${z6(d.getHours())}${z6(d.getMinutes())}`;
  let dest = (0, import_obsidian26.normalizePath)(`${base}/beautytasks-export-${stamp}.json`);
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = (0, import_obsidian26.normalizePath)(`${base}/beautytasks-export-${stamp} ${n}.json`);
    n++;
    if (n > 200) break;
  }
  await app.vault.create(dest, JSON.stringify(data, null, 2));
  return dest;
}
function parseExport(raw) {
  let obj;
  try {
    obj = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof obj !== "object" || obj === null) return null;
  const d = obj;
  if (d.format !== EXPORT_FORMAT || !Array.isArray(d.tasks)) return null;
  return d;
}
async function writeImportedTask(app, settings, et) {
  await ensureFolder(app, settings.itemsFolder);
  const slug = slugify(et.title);
  let dest = (0, import_obsidian26.normalizePath)(settings.itemsFolder + "/" + slug + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = (0, import_obsidian26.normalizePath)(settings.itemsFolder + "/" + slug + " " + n + ".md");
    n++;
    if (n > 500) break;
  }
  const fm = buildFrontmatter({
    type: "task",
    id: et.id || newId("t"),
    status: et.status || "todo",
    priority: et.priority && et.priority !== "normal" ? et.priority : void 0,
    due: et.due ? combineDT(et.due, et.dueTime) : null,
    scheduled: et.scheduled ? combineDT(et.scheduled, et.scheduledTime) : null,
    duration: et.duration ?? null,
    start: et.start ?? null,
    project: et.project ? "[[" + et.project + "]]" : null,
    parent: et.parent ? "[[" + et.parent + "]]" : null,
    labels: et.labels ?? [],
    recurrence: et.recurrence ?? null,
    recur_basis: et.recurrence && et.recurBasis === "done" ? "done" : null,
    reminders: et.reminders ?? [],
    created: et.created || todayIso(),
    completed: et.completed ?? null,
    cancelled: et.cancelled ?? null,
    external_id: et.externalId ?? null,
    description: (et.description ?? "").trim() || null
    // Beschreibung im Frontmatter, nicht im Body
  });
  await app.vault.create(dest, fm + "\n# " + et.title + "\n");
}
async function writeImportedList(app, settings, list) {
  const folder = settings.projectsFolder;
  await ensureFolder(app, folder);
  const base = slugify(list.name);
  let dest = (0, import_obsidian26.normalizePath)(folder + "/" + base + ".md");
  let n = 2;
  while (app.vault.getAbstractFileByPath(dest)) {
    dest = (0, import_obsidian26.normalizePath)(folder + "/" + base + " " + n + ".md");
    n++;
    if (n > 200) break;
  }
  const fm = buildFrontmatter({
    type: list.type === "area" ? "area" : "project",
    id: newId("p"),
    status: list.archived ? "archived" : "active",
    color: list.color ?? void 0,
    created: todayIso()
  });
  await app.vault.create(dest, fm + "\n# " + list.name + "\n");
}
function existingListNames(app) {
  const out = /* @__PURE__ */ new Set();
  for (const f of app.vault.getMarkdownFiles()) {
    const type = app.metadataCache.getFileCache(f)?.frontmatter?.type;
    if (type === "project" || type === "area") out.add(f.basename.toLowerCase());
  }
  return out;
}
async function importData(plugin, data) {
  const { app, settings } = plugin;
  const existing = plugin.index.all();
  const seenIds = new Set(existing.map((t2) => t2.id));
  const seenExt = new Set(existing.filter((t2) => t2.externalId).map((t2) => t2.externalId));
  const listNames = existingListNames(app);
  let listsCreated = 0;
  for (const list of data.lists ?? []) {
    const key = list.name?.toLowerCase();
    if (!key || listNames.has(key)) continue;
    listNames.add(key);
    await writeImportedList(app, settings, list);
    listsCreated++;
  }
  for (const et of data.tasks) {
    const key = et.project?.toLowerCase();
    if (!et.project || !key || listNames.has(key)) continue;
    if (key === "inbox" || key === "eingang") continue;
    listNames.add(key);
    await createProjectNote(app, settings, et.project, false);
    listsCreated++;
  }
  const labels = /* @__PURE__ */ new Set([...data.labels ?? [], ...data.tasks.flatMap((t2) => t2.labels ?? [])]);
  let labelsAdded = 0;
  for (const l of labels) {
    if (l && !settings.knownLabels.includes(l)) {
      settings.knownLabels.push(l);
      labelsAdded++;
    }
  }
  if (labelsAdded) await plugin.saveSettings();
  let created = 0, skipped = 0;
  for (const et of data.tasks) {
    if (et.id && seenIds.has(et.id) || et.externalId && seenExt.has(et.externalId)) {
      skipped++;
      continue;
    }
    await writeImportedTask(app, settings, et);
    if (et.id) seenIds.add(et.id);
    if (et.externalId) seenExt.add(et.externalId);
    created++;
  }
  return { created, skipped, listsCreated, labelsAdded };
}
var JsonFilePickerModal = class extends import_obsidian26.FuzzySuggestModal {
  constructor(app, onPick) {
    super(app);
    this.onPick = onPick;
    this.setPlaceholder(t("import_pick_placeholder"));
  }
  getItems() {
    return this.app.vault.getFiles().filter((f) => f.extension === "json").sort((a, b) => b.stat.mtime - a.stat.mtime);
  }
  getItemText(f) {
    return f.path;
  }
  onChooseItem(f) {
    this.onPick(f);
  }
};
function pickOsJsonFile(onText) {
  const input = createEl("input", { cls: "bt-hidden-file-input", type: "file", attr: { accept: ".json,application/json" } });
  activeDocument.body.appendChild(input);
  const cleanup = () => input.remove();
  input.addEventListener("change", () => {
    const file = input.files?.[0];
    cleanup();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onText(typeof reader.result === "string" ? reader.result : "");
    reader.readAsText(file);
  });
  window.addEventListener("focus", () => window.setTimeout(cleanup, 0), { once: true });
  try {
    if (typeof input.showPicker === "function") input.showPicker();
    else input.click();
  } catch {
    input.click();
  }
}

// src/importTaskNotes.ts
var import_obsidian27 = require("obsidian");
var DEFAULT_MAPPING = {
  title: "title",
  status: "status",
  priority: "priority",
  due: "due",
  scheduled: "scheduled",
  contexts: "contexts",
  projects: "projects",
  tags: "tags",
  timeEstimate: "timeEstimate",
  recurrence: "recurrence",
  completedDate: "completedDate",
  dateCreated: "dateCreated",
  dateModified: "dateModified",
  id: "id"
};
var STATUS_MAP2 = {
  open: "todo",
  todo: "todo",
  backlog: "todo",
  "in-progress": "doing",
  "in progress": "doing",
  doing: "doing",
  started: "doing",
  done: "done",
  completed: "done",
  complete: "done",
  finished: "done",
  closed: "done",
  cancelled: "cancelled",
  canceled: "cancelled"
};
var PRIO_MAP2 = {
  lowest: "lowest",
  low: "low",
  none: "normal",
  normal: "normal",
  medium: "medium",
  high: "high",
  highest: "highest",
  urgent: "highest",
  critical: "highest"
};
var VALID_PRIO = /* @__PURE__ */ new Set(["highest", "high", "medium", "normal", "low", "lowest"]);
var asStr = (v) => {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean" || typeof v === "bigint") return String(v);
  if (v instanceof Date) return v.toISOString();
  return "";
};
var toStrArr = (v) => Array.isArray(v) ? v.map(asStr).map((x) => x.trim()).filter(Boolean) : typeof v === "string" && v.trim() ? [v.trim()] : [];
var uniq = (a) => [...new Set(a)];
var numOrNull = (v) => typeof v === "number" ? v : typeof v === "string" && /^\d+$/.test(v.trim()) ? parseInt(v, 10) : null;
var stripFrontmatter = (content) => content.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, "");
function linkBase(s) {
  const m = s.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
  const raw = (m ? m[1] : s).trim();
  return raw.split("/").pop().replace(/\.md$/i, "").trim();
}
function splitDT(v) {
  const s = asStr(v).trim();
  if (!s) return { date: null, time: null };
  const ti = s.indexOf("T");
  if (ti === -1) return { date: s.slice(0, 10), time: null };
  const time = s.slice(ti + 1, ti + 6);
  return { date: s.slice(0, 10), time: /^\d\d:\d\d$/.test(time) ? time : null };
}
function rruleToRecurrence(v) {
  const s = asStr(v).trim();
  if (!s) return { recurrence: null, lossyOriginal: null };
  const parts = {};
  for (const seg of s.split(";")) {
    const p = seg.trim();
    if (!p || /^DTSTART/i.test(p) || /^RRULE/i.test(p)) continue;
    const eq = p.indexOf("=");
    if (eq === -1) continue;
    parts[p.slice(0, eq).toUpperCase().trim()] = p.slice(eq + 1).trim();
  }
  const unit = { DAILY: "day", WEEKLY: "week", MONTHLY: "month", YEARLY: "year" }[parts.FREQ?.toUpperCase()];
  if (!unit) return { recurrence: null, lossyOriginal: s };
  const n = parts.INTERVAL ? parseInt(parts.INTERVAL, 10) : 1;
  const recurrence = "every " + (n > 1 ? n + " " + unit + "s" : unit);
  const IGNORED = /* @__PURE__ */ new Set(["FREQ", "INTERVAL", "WKST"]);
  const hasExtra = Object.keys(parts).some((k) => !IGNORED.has(k));
  return { recurrence, lossyOriginal: hasExtra ? s : null };
}
function mapStatus(raw) {
  const key = raw.trim().toLowerCase();
  if (raw && isKnownStatus(raw)) return raw;
  return STATUS_MAP2[key] ?? firstOpenStatus();
}
function mapPriority(raw) {
  const key = raw.trim().toLowerCase();
  if (VALID_PRIO.has(key)) return key;
  return PRIO_MAP2[key] ?? "normal";
}
function scanTaskNotes(app, taskTag, folder, tagsKey) {
  const tag = taskTag.replace(/^#/, "").trim().toLowerCase();
  const pref = folder.trim() ? (0, import_obsidian27.normalizePath)(folder.trim()) + "/" : null;
  const out = [];
  for (const f of app.vault.getMarkdownFiles()) {
    if (pref && !f.path.startsWith(pref)) continue;
    const fm = app.metadataCache.getFileCache(f)?.frontmatter;
    if (!fm) continue;
    if (tag) {
      const tags = toStrArr(fm[tagsKey]).map((x) => x.replace(/^#/, "").toLowerCase());
      if (!tags.includes(tag)) continue;
    }
    out.push({ file: f, fm });
  }
  return out;
}
async function buildImportData(app, files, mapping, taskTag) {
  const tag = taskTag.replace(/^#/, "").trim().toLowerCase();
  const listByKey = /* @__PURE__ */ new Map();
  const labelSet = /* @__PURE__ */ new Set();
  const tasks = [];
  let lossy = 0;
  for (const { file, fm } of files) {
    const get = (r) => fm[mapping[r]];
    const title = (asStr(get("title")).trim() || file.basename).trim();
    const completedRaw = asStr(get("completedDate")).trim();
    let status = mapStatus(asStr(get("status")));
    let completed = null;
    if (completedRaw) {
      status = firstDoneStatus();
      completed = completedRaw;
    } else if (isDone(status)) {
      completed = asStr(get("dateModified")).trim() || todayIso();
    }
    const due = splitDT(get("due"));
    const sched = splitDT(get("scheduled"));
    const projects = toStrArr(get("projects")).map(linkBase).filter(Boolean);
    const project = projects[0] ?? null;
    if (project) {
      const k = project.toLowerCase();
      if (!listByKey.has(k)) listByKey.set(k, { name: project, type: "project", color: null, archived: false });
    }
    const contexts = toStrArr(get("contexts")).map((c) => c.replace(/^@/, "").trim()).filter(Boolean);
    const tnTags = toStrArr(get("tags")).map((x) => x.replace(/^#/, "").trim()).filter((x) => x && x.toLowerCase() !== tag);
    const labels = uniq([...contexts, ...tnTags, ...projects.slice(1)]);
    for (const l of labels) labelSet.add(l);
    const rec = rruleToRecurrence(get("recurrence"));
    let body = stripFrontmatter(await app.vault.cachedRead(file)).trim();
    if (rec.lossyOriginal) {
      body = (body ? body + "\n\n" : "") + "> [TaskNotes recurrence] " + rec.lossyOriginal;
      lossy++;
    }
    tasks.push({
      id: "",
      externalId: asStr(get("id")).trim() || file.path,
      title,
      status,
      priority: mapPriority(asStr(get("priority"))),
      due: due.date,
      dueTime: due.time,
      scheduled: sched.date,
      scheduledTime: sched.time,
      duration: numOrNull(get("timeEstimate")),
      start: null,
      project,
      parent: null,
      labels,
      recurrence: rec.recurrence,
      recurBasis: "due",
      reminders: [],
      created: (asStr(get("dateCreated")).trim() || todayIso()).slice(0, 10),
      completed,
      cancelled: null,
      description: body
    });
  }
  return { tasks, lists: [...listByKey.values()], labels: [...labelSet], lossy };
}
var ImportTaskNotesModal = class extends import_obsidian27.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.taskTag = "task";
    this.folder = "";
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-new-modal");
    contentEl.createEl("h3", { text: t("tn_import_title") });
    contentEl.createEl("p", { cls: "bt-confirm-msg", text: t("tn_import_desc") });
    new import_obsidian27.Setting(contentEl).setName(t("tn_import_tag")).setDesc(t("tn_import_tag_desc")).addText((tx) => tx.setPlaceholder("task").setValue(this.taskTag).onChange((v) => {
      this.taskTag = v;
      this.updateCount();
    }));
    new import_obsidian27.Setting(contentEl).setName(t("tn_import_folder")).setDesc(t("tn_import_folder_desc")).addText((tx) => tx.setPlaceholder(t("tn_import_folder_ph")).setValue(this.folder).onChange((v) => {
      this.folder = v;
      this.updateCount();
    }));
    this.countEl = contentEl.createDiv({ cls: "bt-filter-count" });
    this.updateCount();
    const foot = contentEl.createDiv({ cls: "bt-foot" });
    foot.createDiv();
    const actions = foot.createDiv({ cls: "bt-actions" });
    actions.createEl("button", { text: t("btn_cancel") }).onclick = () => this.close();
    actions.createEl("button", { cls: "mod-cta", text: t("tn_import_btn") }).onclick = () => void this.run();
  }
  onClose() {
    this.contentEl.empty();
  }
  updateCount() {
    const n = scanTaskNotes(this.app, this.taskTag, this.folder, DEFAULT_MAPPING.tags).length;
    this.countEl.setText(t("tn_import_found", n));
  }
  async run() {
    const files = scanTaskNotes(this.app, this.taskTag, this.folder, DEFAULT_MAPPING.tags);
    if (!files.length) {
      new import_obsidian27.Notice(t("tn_import_none"));
      return;
    }
    try {
      const { tasks, lists, labels, lossy } = await buildImportData(this.app, files, DEFAULT_MAPPING, this.taskTag);
      const r = await importData(this.plugin, makeImportData(lists, labels, tasks));
      let shown = false;
      for (const l of labels) {
        if (l && !this.plugin.settings.visibleLabels.includes(l)) {
          this.plugin.settings.visibleLabels.push(l);
          shown = true;
        }
      }
      if (shown) await this.plugin.saveSettings();
      this.close();
      new import_obsidian27.Notice(t("tn_import_done", r.created, r.skipped) + (lossy ? " " + t("tn_import_lossy", lossy) : ""));
      window.setTimeout(() => this.plugin.index.build(), 800);
    } catch (e) {
      console.error("BeautyTasks TaskNotes import error", e);
      new import_obsidian27.Notice(t("tn_import_failed"));
    }
  }
};

// src/whatsNew.ts
var import_obsidian28 = require("obsidian");
var WhatsNewModal = class extends import_obsidian28.Modal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-whatsnew");
    contentEl.createDiv({ cls: "bt-wn-eyebrow", text: "BeautyTasks " + this.plugin.manifest.version });
    contentEl.createEl("h2", { cls: "bt-wn-title", text: t("whatsnew_title") });
    const items = [
      { icon: "calendar-days", title: t("wn_cal_t"), desc: t("wn_cal_d") },
      { icon: "inbox", title: t("wn_unsched_t"), desc: t("wn_unsched_d") },
      { icon: "arrow-up-down", title: t("wn_dir_t"), desc: t("wn_dir_d") }
    ];
    const list = contentEl.createDiv({ cls: "bt-wn-list" });
    for (const it of items) {
      const row = list.createDiv({ cls: "bt-wn-item" });
      (0, import_obsidian28.setIcon)(row.createDiv({ cls: "bt-wn-ic" }), it.icon);
      const body = row.createDiv({ cls: "bt-wn-body" });
      body.createDiv({ cls: "bt-wn-item-t", text: it.title });
      body.createDiv({ cls: "bt-wn-item-d", text: it.desc });
    }
    const foot = contentEl.createDiv({ cls: "bt-wn-foot" });
    foot.createEl("button", { cls: "mod-cta", text: t("whatsnew_ok") }).onclick = () => this.close();
  }
  onClose() {
    this.contentEl.empty();
  }
};

// src/main.ts
function registerIcons() {
  (0, import_obsidian29.addIcon)("bt-add-task", `<g transform="scale(4.1667)">
    <path fill="currentColor" fill-rule="evenodd" clip-rule="evenodd" d="M12 23c6.075 0 11-4.925 11-11S18.075 1 12 1 1 5.925 1 12s4.925 11 11 11m-.711-16.5a.75.75 0 1 1 1.5 0v4.789H17.5a.75.75 0 0 1 0 1.5h-4.711V17.5a.75.75 0 0 1-1.5 0V12.79H6.5a.75.75 0 1 1 0-1.5h4.789z"/>
  </g>`);
}
var BeautyTasksPlugin = class extends import_obsidian29.Plugin {
  constructor() {
    super(...arguments);
    this.gcalStatusBar = null;
    this.currentView = "heute";
    this.currentProject = null;
    this.currentLabel = null;
    // aktives Label-Board
    this.currentFilter = null;
    // aktiver gespeicherter Filter (type:filter-Pfad)
    this.colorPreview = null;
    // Live-Vorschau der Icon-Farbe (Farb-Picker), NICHT persistiert
    this.reorderSec = null;
    // aktiver Drag-Sortiermodus in der Seitenleiste (transient, nur Sichtbare)
    this.doneCollapsed = true;
    // „Erledigt"-Sektionen eingeklappt (Default)
    this.manageOpen = false;
    // Verwaltungs-Ansicht aktiv?
    this.manageSection = "projects";
    // welcher Bereich im ListManager
    this.manageTab = "active";
    // Unterteilung nur bei Projekten
    this.doneTab = "done";
    // „Erledigt"-Ansicht: Liste vs. Papierkorb
    this.flashPath = null;
    // aus der Suche angesprungene Aufgabe (kurz hervorgehoben)
    this.flashScrolled = false;
    // pro Sprung nur einmal ins Bild scrollen
    this.titleRenderComp = null;
    // Lifecycle für Markdown-Titel (Links), von MainView pro Zeichnung gesetzt
    this.reminderScan = 0;
  }
  // Obergrenze des zuletzt geprüften Zeitfensters (Epoch-ms)
  async onload() {
    registerIcons();
    await this.loadSettings();
    this.applyLocale();
    this.currentView = this.resolveStartView();
    this.index = new TaskIndex(this.app, () => this.settings);
    this.addChild(this.index);
    this.setupGCal();
    this.reminderScan = this.settings.reminderLastScan || Date.now();
    this.app.workspace.onLayoutReady(async () => {
      const wasExisting = this.settings.didInitialSetup;
      const prevVersion = this.settings.lastSeenVersion;
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (OLD_VIEW_TYPES.includes(leaf.getViewState().type)) leaf.detach();
      });
      if (!this.settings.didInitialSetup) {
        this.settings.didInitialSetup = true;
        await this.saveSettings();
      }
      this.index.build();
      this.renderAll();
      await this.runPendingMigrations();
      this.scanReminders();
      this.gcalSync.start();
      void this.gcalSync.syncNow();
      const minorKey = (v) => v.split(".").slice(0, 2).join(".");
      if (wasExisting && minorKey(prevVersion ?? "") !== minorKey(this.manifest.version)) new WhatsNewModal(this).open();
      if (this.settings.lastSeenVersion !== this.manifest.version) {
        this.settings.lastSeenVersion = this.manifest.version;
        await this.saveSettings();
      }
    });
    this.registerInterval(window.setInterval(() => this.scanReminders(), 3e4));
    this.registerView(VIEW_MAIN, (leaf) => new MainView(leaf, this));
    this.registerView(VIEW_NAV, (leaf) => new NavView(leaf, this));
    this.addRibbonIcon("check-circle", t("ribbon_open"), () => void this.openBeautyTasks());
    this.addSettingTab(new BeautyTasksSettingTab(this.app, this));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.renderAll()));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => void this.onNoteRenamed(file, oldPath)));
    this.addCommand({ id: "open", name: t("ribbon_open"), callback: () => void this.openBeautyTasks() });
    for (const id of VIEW_IDS) {
      this.addCommand({ id: "open-" + id, name: t("cmd_open_view", viewTitle(id)), callback: () => void this.activateView(id) });
    }
    this.addCommand({ id: "new-task", name: t("cmd_new_task"), callback: () => this.openNewTaskHere() });
    this.addCommand({ id: "quick-add", name: t("cmd_quick_add"), callback: () => this.openQuickAddHere() });
    this.addCommand({
      id: "make-task",
      name: t("cmd_make_task"),
      checkCallback: (checking) => {
        const f = this.app.workspace.getActiveFile();
        if (!f || f.extension !== "md") return false;
        const type = this.app.metadataCache.getFileCache(f)?.frontmatter?.type;
        if (type === "task" || type === "project" || type === "area" || type === "filter") return false;
        if (!checking) void this.convertActiveNoteToTask(f);
        return true;
      }
    });
    this.addCommand({ id: "search", name: t("cmd_search"), callback: () => this.openSearch() });
    this.addCommand({ id: "whats-new", name: t("cmd_whatsnew"), callback: () => new WhatsNewModal(this).open() });
    this.addCommand({ id: "gcal-sync-now", name: t("cmd_gcal_sync_now"), callback: () => void this.gcalSync.syncNow() });
    this.addCommand({
      id: "count-tasks",
      name: t("cmd_count_tasks"),
      callback: () => new import_obsidian29.Notice(t("notice_count", this.index.all().length, this.index.open().length))
    });
    this.addCommand({ id: "export-json", name: t("cmd_export_json"), callback: () => void this.exportTasksJson() });
    this.addCommand({ id: "import-json", name: t("cmd_import_json"), callback: () => this.importTasksFromVault() });
    this.addCommand({ id: "import-tasknotes", name: t("cmd_import_tasknotes"), callback: () => this.importFromTaskNotes() });
    this.addCommand({ id: "migrate-descriptions", name: t("cmd_migrate_desc"), callback: () => void this.migrateDescriptions() });
    this.addCommand({ id: "remove-inbox-note", name: t("cmd_remove_inbox"), callback: () => void this.migrateInboxRemoval() });
    this.addCommand({
      id: "import-from-lists",
      name: t("cmd_import"),
      callback: async () => {
        new import_obsidian29.Notice(t("notice_import_running"));
        try {
          const n = await runMigration(this.app, this.settings);
          new import_obsidian29.Notice(t("notice_imported", n));
          window.setTimeout(() => this.index.build(), 800);
        } catch (e) {
          console.error("BeautyTasks import error", e);
          new import_obsidian29.Notice(t("notice_import_failed"));
        }
      }
    });
  }
  // ── Rendern: Views zeichnen sich selbst (eigenes contentEl) ──
  renderAll() {
    this.renderMain();
    this.renderNav();
  }
  renderMain() {
    if (!this.index) return;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_MAIN)) {
      if (leaf.view instanceof MainView) leaf.view.draw();
    }
  }
  renderNav() {
    if (!this.index) return;
    for (const leaf of this.app.workspace.getLeavesOfType(VIEW_NAV)) {
      if (leaf.view instanceof NavView) leaf.view.draw();
    }
  }
  // ── Öffnen / Navigieren ──
  async openBeautyTasks() {
    await this.activateNav();
    await this.activateView(this.resolveStartView());
  }
  /** UI-Sprache anwenden: "auto" folgt Obsidians Sprache (via moment-Locale), sonst der
   *  gewählte Code. `moment.locale()` statt `getLanguage()` – letzteres bräuchte App ≥ 1.8.7. */
  applyLocale() {
    setLocale(this.settings.locale === "auto" ? import_obsidian29.moment.locale() : this.settings.locale);
  }
  /** Startansicht aus den Einstellungen (Fallback „heute"). "last" = zuletzt benutzte. */
  resolveStartView() {
    const pick = this.settings.startView === "last" ? this.settings.lastView : this.settings.startView;
    return VIEW_IDS.includes(pick) ? pick : "heute";
  }
  /** Zur konfigurierten Startansicht wechseln – z. B. wenn der gerade offene Eintrag
   *  (Projekt/Bereich/Label/Filter) gelöscht oder archiviert wurde. */
  async goToStartView() {
    await this.activateView(this.resolveStartView());
  }
  async activateNav() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_NAV)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeftLeaf(false);
      if (leaf) await leaf.setViewState({ type: VIEW_NAV, active: true });
    }
    if (leaf) await workspace.revealLeaf(leaf);
    this.renderNav();
  }
  /** EINE Dashboard-Leaf öffnen/vordergründig machen und neu zeichnen. */
  async showMain() {
    const { workspace } = this.app;
    let leaf = workspace.getLeavesOfType(VIEW_MAIN)[0] ?? null;
    if (!leaf) {
      leaf = workspace.getLeaf("tab");
      await leaf.setViewState({ type: VIEW_MAIN, active: true });
    }
    await workspace.revealLeaf(leaf);
    if (leaf.view instanceof MainView) leaf.view.draw();
    this.renderNav();
  }
  async activateView(id) {
    this.currentView = id;
    this.currentProject = null;
    this.currentLabel = null;
    this.currentFilter = null;
    this.manageOpen = false;
    this.doneTab = "done";
    if (this.settings.lastView !== id) {
      this.settings.lastView = id;
      void this.saveSettings();
    }
    await this.showMain();
  }
  async activateProject(path) {
    this.currentProject = path;
    this.currentLabel = null;
    this.currentFilter = null;
    this.manageOpen = false;
    await this.showMain();
  }
  async activateLabel(label) {
    this.currentLabel = label;
    this.currentProject = null;
    this.currentFilter = null;
    this.manageOpen = false;
    await this.showMain();
  }
  async activateFilter(path) {
    this.currentFilter = path;
    this.currentProject = null;
    this.currentLabel = null;
    this.manageOpen = false;
    await this.showMain();
  }
  async activateManage(section2) {
    this.manageOpen = true;
    if (section2) this.manageSection = section2;
    this.manageTab = "active";
    this.currentProject = null;
    this.currentLabel = null;
    this.currentFilter = null;
    await this.showMain();
  }
  // ── Anzeige pro Seite (Layout/Sortieren/Gruppieren/Erledigte) ──
  /** Welche Seite ist gerade offen + ihre „Fernbedienungs-Größe". */
  currentPage() {
    if (this.manageOpen) return { key: "manage", tier: "none", kind: "view" };
    if (this.currentFilter) return { key: this.currentFilter, tier: "full", kind: "filter" };
    if (this.currentLabel) return { key: this.currentLabel, tier: "full", kind: "label" };
    if (this.currentProject === INBOX_KEY) return { key: "inbox", tier: "full", kind: "view" };
    if (this.currentProject) return { key: this.currentProject, tier: "full", kind: "project" };
    const v = this.currentView;
    return { key: v, tier: v === "heute" || v === "demnaechst" ? "light" : "none", kind: "view" };
  }
  /** Effektive Anzeige-Optionen der aktuellen Seite (aus Frontmatter bzw. Settings). */
  pageViewOptions() {
    const p = this.currentPage();
    if (p.kind === "project") return readNoteViewOptions(this.app, p.key);
    if (p.kind === "filter") {
      const fl = readFilter(this.app, p.key);
      return fl ? fl.options : { ...DEFAULT_OPTIONS };
    }
    return readViewOptions(this.settings.pageViewOptions?.[p.kind === "label" ? "label:" + p.key : p.key]);
  }
  /** Eine Anzeige-Option der aktuellen Seite setzen – am richtigen Ort gespeichert. */
  async setPageViewOption(patch) {
    const p = this.currentPage();
    if (p.kind === "project") {
      this.refreshOnChange(p.key);
      await setNoteViewOption(this.app, p.key, patch);
      return;
    }
    if (p.kind === "filter") {
      const fl = readFilter(this.app, p.key);
      if (!fl) return;
      await this.updateFilter(p.key, fl.criteria, { ...fl.options, ...patch }, fl.color);
      return;
    }
    const map = this.settings.pageViewOptions ?? {};
    const skey = p.kind === "label" ? "label:" + p.key : p.key;
    map[skey] = { ...readViewOptions(map[skey]), ...patch };
    this.settings.pageViewOptions = map;
    await this.saveSettings();
    this.renderMain();
  }
  /** Anzeige-Optionen der aktuellen Seite auf Default zurücksetzen. */
  async resetPageViewOptions() {
    const p = this.currentPage();
    if (p.kind === "project") {
      this.refreshOnChange(p.key);
      await setNoteViewOption(this.app, p.key, { ...DEFAULT_OPTIONS });
      return;
    }
    if (p.kind === "filter") {
      const fl = readFilter(this.app, p.key);
      if (fl) await this.updateFilter(p.key, fl.criteria, { ...DEFAULT_OPTIONS }, fl.color);
      return;
    }
    if (this.settings.pageViewOptions) {
      delete this.settings.pageViewOptions[p.kind === "label" ? "label:" + p.key : p.key];
      await this.saveSettings();
    }
    this.renderMain();
  }
  // ── Gespeicherte Filter (type:filter-Notizen) ──
  /** Neuen Filter anlegen und öffnen. Wie createProject wartet ein einmaliger „changed"-
   *  Listener auf den frisch geparsten Frontmatter, bevor zum neuen Filter-Board gewechselt wird. */
  async createFilter(name, criteria, options, color = null, hidden = false) {
    const base = await createFilterNote(this.app, this.settings, name, criteria, options, color, hidden);
    const ref = this.app.metadataCache.on("changed", () => {
      this.app.metadataCache.offref(ref);
      const created = listFilters(this.app).find((fl) => fl.name === base);
      if (created) void this.activateFilter(created.path);
      else this.renderAll();
    });
    this.registerEvent(ref);
  }
  /** Filter aktualisieren. Wie die Projekt-Aktionen wartet ein einmaliger „changed"-Listener
   *  auf den frisch geparsten Frontmatter, bevor Board/Nav neu gezeichnet werden (sonst zeigt
   *  die Seite bis zum nächsten Ereignis den alten Stand). */
  async updateFilter(path, criteria, options, color) {
    this.refreshOnChange(path);
    await updateFilterNote(this.app, path, criteria, options, color);
  }
  /** Filter umbenennen (Datei + „# Überschrift"). Gibt neuen Basenamen zurück oder null bei
   *  Kollision. renameFile löst ein vault-„rename" aus; zur Sicherheit zusätzlich neu zeichnen. */
  async renameFilter(path, newName) {
    const r = await renameFilterNote(this.app, path, newName);
    this.renderAll();
    return r;
  }
  /** Filter in der Seitenleiste ein-/ausblenden (nav_hidden), refresh nach Cache-Update. */
  async setFilterVisible(path, visible) {
    this.refreshOnChange(path);
    await setFilterNavHidden(this.app, path, !visible);
  }
  /** Icon-Farbe eines Filters setzen (null = keine), refresh nach Cache-Update. */
  async setFilterColor(path, color) {
    this.colorPreview = null;
    this.refreshOnChange(path);
    await setFilterColor(this.app, path, color);
  }
  async deleteFilter(path) {
    await deleteFilterNote(this.app, path);
    if (this.currentFilter === path) await this.goToStartView();
    else this.renderAll();
  }
  /** Aus der Suche gewählte Aufgabe in ihrer Liste zeigen: zum Projekt-/Inbox-Board
   *  (bzw. passenden Datums-/Erledigt-View) springen und die Zeile kurz hervorheben
   *  – als führe man mit der Maus darüber. `flashPath` wird beim Zeichnen von der
   *  Task-Zeile ausgewertet (robust gegen Neu-Zeichnen durch active-leaf-change). */
  async revealTask(task) {
    this.flashPath = task.path;
    this.flashScrolled = false;
    if (isDone(task.status)) this.doneCollapsed = false;
    if (task.project) {
      await this.activateProject(task.project);
    } else if (isDone(task.status)) {
      await this.activateView("erledigt");
    } else if (task.due && task.due <= todayStr()) {
      await this.activateView("heute");
    } else {
      await this.activateView("demnaechst");
    }
    window.setTimeout(() => {
      if (this.flashPath !== task.path) return;
      this.flashPath = null;
      this.renderMain();
    }, 4400);
  }
  /** Task-Zeile beim Zeichnen hervorheben + einmalig ins Bild scrollen (aus der Suche). */
  applyFlash(row, path) {
    if (this.flashPath !== path) return;
    row.addClass("is-focus");
    if (this.flashScrolled) return;
    this.flashScrolled = true;
    window.setTimeout(() => row.scrollIntoView({ block: "center", behavior: "smooth" }), 0);
  }
  // ── Projektverwaltung (Umwandeln/Archiv/Sichtbarkeit/Umbenennen/Löschen) ──
  /** Nav/Board/Verwaltung hängen am metadataCache, der nach processFrontMatter erst kurz
   *  später aktualisiert wird -> einmaliger „changed"-Listener zeichnet dann neu
   *  (flackerfrei, ohne festes Timeout). Listener VOR der Änderung registrieren. */
  refreshOnChange(path) {
    const ref = this.app.metadataCache.on("changed", (f) => {
      if (f.path !== path) return;
      this.app.metadataCache.offref(ref);
      this.renderAll();
    });
    this.registerEvent(ref);
  }
  /** Neues Projekt (oder direkt Bereich) anlegen. Nav/Board lesen den metadataCache, der
   *  nach create erst kurz später aktualisiert wird -> einmaliger „changed"-Listener zeichnet
   *  dann neu, damit der neue Eintrag sofort in der Seitenleiste erscheint. */
  async createProject(name, asArea = false, color = null, hidden = false) {
    await createProjectNote(this.app, this.settings, name, asArea, color, hidden);
    const ref = this.app.metadataCache.on("changed", () => {
      this.app.metadataCache.offref(ref);
      this.renderAll();
    });
    this.registerEvent(ref);
  }
  async setProjectArea(path, toArea) {
    this.refreshOnChange(path);
    await setProjectType(this.app, path, toArea);
  }
  async archiveProject(path, archived) {
    this.refreshOnChange(path);
    await setProjectArchived(this.app, path, archived);
    if (archived && this.currentProject === path) await this.goToStartView();
  }
  /** Projekt/Bereich archivieren und eine „Rückgängig"-Notice zeigen (Kontextmenü + Bearbeiten-Modal). */
  archiveWithUndo(path, name) {
    void this.archiveProject(path, true);
    const frag = createFragment((f) => {
      f.appendText(t("archived_notice", name) + " ");
      const undo = f.createEl("a", { text: t("archive_undo"), href: "#" });
      undo.onclick = (e) => {
        e.preventDefault();
        void this.archiveProject(path, false);
      };
    });
    new import_obsidian29.Notice(frag, 8e3);
  }
  async setProjectVisible(path, visible) {
    this.refreshOnChange(path);
    await setNavHidden(this.app, path, !visible);
  }
  /** Live-Vorschau der Icon-Farbe (Ziehen im Farbwähler): nur die Nav neu zeichnen, KEIN
   *  Schreiben auf die Platte. Wird beim Bestätigen/Schließen verworfen bzw. persistiert. */
  setColorPreview(key, color) {
    this.colorPreview = { key, color };
    this.renderNav();
  }
  clearColorPreview() {
    if (this.colorPreview) {
      this.colorPreview = null;
      this.renderNav();
    }
  }
  /** Icon-Farbe eines Projekts/Bereichs setzen (null = keine), refresh nach Cache-Update. */
  async setProjectColor(path, color) {
    this.colorPreview = null;
    this.refreshOnChange(path);
    await setProjectColor(this.app, path, color);
  }
  /** Umbenennen löst ein vault-„rename" aus -> der Index benachrichtigt bereits; zur
   *  Sicherheit zusätzlich neu zeichnen. Gibt Basename zurück oder null bei Kollision. */
  async renameProject(path, newName) {
    const r = await renameProjectNote(this.app, path, newName);
    this.renderAll();
    return r;
  }
  async deleteProject(path) {
    await deleteProjectNote(this.app, path);
    if (this.currentProject === path) {
      await this.goToStartView();
      return;
    }
    this.renderAll();
  }
  // ── Import / Export (JSON, verlustfrei) ──
  /** Alle Aufgaben als JSON in den Vault sichern; Notice mit Zielpfad. */
  async exportTasksJson() {
    try {
      const path = await writeExportFile(this);
      new import_obsidian29.Notice(t("notice_export_done", path));
    } catch (e) {
      console.error("BeautyTasks export error", e);
      new import_obsidian29.Notice(t("notice_export_failed"));
    }
  }
  /** JSON-Rohtext einlesen, Aufgaben anlegen (Duplikat-Schutz), Index neu aufbauen. */
  async importTasksFromText(raw) {
    const data = parseExport(raw);
    if (!data) {
      new import_obsidian29.Notice(t("notice_import_invalid"));
      return;
    }
    try {
      const r = await importData(this, data);
      new import_obsidian29.Notice(t("notice_import_summary", r.created, r.skipped));
      window.setTimeout(() => this.index.build(), 800);
    } catch (e) {
      console.error("BeautyTasks JSON import error", e);
      new import_obsidian29.Notice(t("notice_import_failed"));
    }
  }
  /** Import über die In-Vault-Auswahl (alle .json-Dateien). */
  importTasksFromVault() {
    new JsonFilePickerModal(this.app, (f) => void this.readAndImport(f)).open();
  }
  async readAndImport(f) {
    await this.importTasksFromText(await this.app.vault.read(f));
  }
  /** Import über den OS-Dateidialog (Datei außerhalb des Vaults). */
  importTasksFromOs() {
    pickOsJsonFile((text) => void this.importTasksFromText(text));
  }
  /** Migration aus dem TaskNotes-Plugin (Dialog: Quelle wählen, nicht-destruktiv importieren). */
  importFromTaskNotes() {
    new ImportTaskNotesModal(this).open();
  }
  // ── Label-Verwaltung (Strings auf den Aufgaben + Register für leere Labels) ──
  /** Alle Labels (aus Aufgaben + Register) mit Häufigkeit (alphabetisch). */
  getLabels() {
    const counts = /* @__PURE__ */ new Map();
    for (const name of this.settings.knownLabels) counts.set(name, 0);
    for (const task of this.index.all()) for (const l of task.labels) counts.set(l, (counts.get(l) ?? 0) + 1);
    return [...counts.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => a.name.localeCompare(b.name, "de"));
  }
  /** Neues (leeres) Label ins Register aufnehmen. false bei leer/bereits vorhanden. */
  async addLabel(raw) {
    const nu = normalizeLabel(raw);
    if (!nu) return false;
    if (this.settings.knownLabels.includes(nu) || this.getLabels().some((l) => l.name === nu)) return false;
    this.settings.knownLabels.push(nu);
    await this.saveSettings();
    this.renderAll();
    return true;
  }
  /** Label in ALLEN Aufgaben (und im Register) umbenennen. false bei leerem/gleichem Namen. */
  async renameLabel(oldName, rawNew) {
    const nu = normalizeLabel(rawNew);
    if (!nu || nu === oldName) return false;
    for (const task of this.index.all()) {
      if (!task.labels.includes(oldName)) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        const arr = Array.isArray(fm.labels) ? fm.labels.map(String) : [];
        fm.labels = [...new Set(arr.map((x) => x === oldName ? nu : x))];
      });
    }
    for (const fl of listFilters(this.app)) {
      if (!fl.criteria.labels.includes(oldName) && !fl.criteria.labelsAll.includes(oldName) && !fl.criteria.labelsNot.includes(oldName)) continue;
      const ff = this.app.vault.getAbstractFileByPath(fl.path);
      if (ff instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(ff, (fm) => {
        for (const key of ["labels", "labels_all", "labels_not"]) {
          if (Array.isArray(fm[key])) fm[key] = [...new Set(fm[key].map(String).map((x) => x === oldName ? nu : x))];
        }
      });
    }
    this.settings.knownLabels = [...new Set(this.settings.knownLabels.map((x) => x === oldName ? nu : x))];
    this.settings.visibleLabels = [...new Set(this.settings.visibleLabels.map((x) => x === oldName ? nu : x))];
    if (this.settings.labelColors[oldName]) {
      this.settings.labelColors[nu] = this.settings.labelColors[oldName];
      delete this.settings.labelColors[oldName];
    }
    if (this.currentLabel === oldName) this.currentLabel = nu;
    await this.saveSettings();
    this.renderAll();
    return true;
  }
  // ── Referenz-Integrität beim Umbenennen (nativ ODER Plugin, setting-unabhängig) ──
  /** Wikilink/Klartext → Basename (ohne .md); null, wenn kein String. */
  wikiBase(v) {
    if (typeof v !== "string") return null;
    const m = v.match(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/);
    const raw = (m ? m[1] : v).trim();
    return raw ? raw.split("/").pop().replace(/\.md$/i, "") : null;
  }
  /** Reagiert auf jedes Umbenennen einer verwalteten Notiz und zieht alle Referenzen selbst nach. */
  async onNoteRenamed(file, oldPath) {
    if (!(file instanceof import_obsidian29.TFile) || file.extension !== "md") return;
    const type = this.app.metadataCache.getFileCache(file)?.frontmatter?.type;
    if (type !== "project" && type !== "area" && type !== "filter" && type !== "task") return;
    const oldBase = oldPath.split("/").pop().replace(/\.md$/i, "");
    const newBase = file.basename;
    if (type !== "task" && oldPath !== file.path) this.remapNavOrder(oldPath, file.path);
    if (this.currentProject === oldPath) this.currentProject = file.path;
    if (this.currentFilter === oldPath) this.currentFilter = file.path;
    if (oldBase !== newBase) {
      if (type === "project" || type === "area") await this.remapListRefs(oldBase, newBase);
      else if (type === "task") await this.remapParentRefs(oldBase, newBase);
    }
    this.renderAll();
  }
  /** Projekt/Bereich umbenannt: Aufgaben-`project` (Wikilink) UND Filter-`projects` (Klartext) nachziehen. */
  async remapListRefs(oldBase, newBase) {
    for (const task of this.index.all()) {
      if (this.wikiBase(task.project) !== oldBase) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        if (this.wikiBase(fm.project) === oldBase) fm.project = "[[" + newBase + "]]";
      });
    }
    for (const fl of listFilters(this.app)) {
      if (!fl.criteria.projects.includes(oldBase) && !fl.criteria.projectsNot.includes(oldBase)) continue;
      const f = this.app.vault.getAbstractFileByPath(fl.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        for (const key of ["projects", "projects_not"]) {
          if (Array.isArray(fm[key])) fm[key] = [...new Set(fm[key].map(String).map((x) => x === oldBase ? newBase : x))];
        }
      });
    }
  }
  /** Aufgabe umbenannt: `parent`-Referenzen der Unteraufgaben nachziehen. */
  async remapParentRefs(oldBase, newBase) {
    for (const task of this.index.all()) {
      if (this.wikiBase(task.parent) !== oldBase) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        if (this.wikiBase(fm.parent) === oldBase) fm.parent = "[[" + newBase + "]]";
      });
    }
  }
  /** navOrder-Schlüssel (Pfad) von alt → neu umhängen (project/area/filter). */
  remapNavOrder(oldPath, newPath) {
    const o = this.settings.navOrder;
    if (!o) return;
    let changed = false;
    for (const sec of ["projects", "areas", "filters"]) {
      const arr = o[sec];
      const i = arr ? arr.indexOf(oldPath) : -1;
      if (arr && i >= 0) {
        arr[i] = newPath;
        changed = true;
      }
    }
    if (changed) void this.saveSettings();
  }
  /** Label aus ALLEN Aufgaben (Register + Sichtbarkeit) entfernen. */
  async deleteLabel(name) {
    for (const task of this.index.all()) {
      if (!task.labels.includes(name)) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        const arr = Array.isArray(fm.labels) ? fm.labels.map(String) : [];
        fm.labels = arr.filter((x) => x !== name);
      });
    }
    this.settings.knownLabels = this.settings.knownLabels.filter((x) => x !== name);
    this.settings.visibleLabels = this.settings.visibleLabels.filter((x) => x !== name);
    delete this.settings.labelColors[name];
    const wasOpen = this.currentLabel === name;
    await this.saveSettings();
    if (wasOpen) {
      await this.goToStartView();
      return;
    }
    this.renderAll();
  }
  // ── Label-Farbe (Labels sind keine Notizen -> Speicher in den Settings) ──
  getLabelColor(name) {
    return this.settings.labelColors[name] ?? null;
  }
  async setLabelColor(name, color) {
    this.colorPreview = null;
    if (color) this.settings.labelColors[name] = color;
    else delete this.settings.labelColors[name];
    await this.saveSettings();
    this.renderAll();
  }
  // ── Label-Sichtbarkeit in der Seitenleiste (Default: aus) ──
  isLabelVisible(name) {
    return this.settings.visibleLabels.includes(name);
  }
  /** Sichtbar geschaltete Labels, die es noch gibt – in der eingestellten Reihenfolge. */
  getVisibleLabels() {
    const exist = new Set(this.getLabels().map((l) => l.name));
    const raw = this.settings.visibleLabels.filter((n) => exist.has(n)).map((n) => ({ name: n }));
    return this.orderNav("labels", raw, (x) => x.name, (x) => x.name).map((x) => x.name);
  }
  // ── Seitenleisten-Sortierung (Projekte/Bereiche/Labels) ──
  navSortMode(sec) {
    return this.settings.navSort?.[sec] ?? "name";
  }
  async setNavSort(sec, mode) {
    const cur = this.settings.navSort ?? { projects: "name", areas: "name", labels: "name", filters: "name" };
    cur[sec] = mode;
    this.settings.navSort = cur;
    await this.saveSettings();
    this.renderAll();
  }
  navCount(sec, key) {
    if (sec === "labels") return this.index.byLabel(key).length;
    if (sec === "filters") {
      const fl = readFilter(this.app, key);
      return fl ? applyFilter(this.index, fl.criteria, fl.options, todayStr()).length : 0;
    }
    return this.index.byProject(key).length;
  }
  /** Liste nach dem aktiven Modus sortieren: Name (alphabetisch) · Anzahl (viele zuerst) · Manuell. */
  orderNav(sec, items, keyOf, nameOf) {
    const mode = this.navSortMode(sec);
    const arr = [...items];
    const byName2 = (a, b) => nameOf(a).localeCompare(nameOf(b), "de");
    if (mode === "count") return arr.sort((a, b) => this.navCount(sec, keyOf(b)) - this.navCount(sec, keyOf(a)) || byName2(a, b));
    if (mode === "manual") {
      const order = this.settings.navOrder?.[sec] ?? [];
      const idx = new Map(order.map((k, i) => [k, i]));
      return arr.sort((a, b) => (idx.get(keyOf(a)) ?? Infinity) - (idx.get(keyOf(b)) ?? Infinity) || byName2(a, b));
    }
    return arr.sort(byName2);
  }
  /** Projekte/Bereiche in eingestellter Reihenfolge – für Seitenleiste UND ListManager. */
  sortProjItems(sec, items) {
    return this.orderNav(sec, items, (p) => p.path, (p) => p.name);
  }
  /** Label-Liste (Manager) in eingestellter Reihenfolge. */
  sortLabels(items) {
    return this.orderNav("labels", items, (x) => x.name, (x) => x.name);
  }
  /** Filter-Liste (Seitenleiste UND ListManager) in eingestellter Reihenfolge. */
  sortFilters(items) {
    return this.orderNav("filters", items, (f) => f.path, (f) => f.name);
  }
  /** Aktuelle Reihenfolge der Schlüssel (materialisiert die manuelle Liste beim ersten Verschieben). */
  currentNavKeys(sec) {
    if (sec === "labels") {
      const items2 = this.getLabels().map((l) => ({ name: l.name }));
      return this.orderNav("labels", items2, (x) => x.name, (x) => x.name).map((x) => x.name);
    }
    if (sec === "filters") return this.sortFilters(listFilters(this.app)).map((f) => f.path);
    const wantType = sec === "areas" ? "area" : "project";
    const items = listManaged(this.app).active.filter((p) => p.type === wantType);
    return this.sortProjItems(sec, items).map((p) => p.path);
  }
  /** Manuelle Reihenfolge einer Sektion setzen (materialisiert navOrder). Gemeinsame Persistenz
   *  für ↑/↓-Verschieben UND Drag-Sortiermodus – schreibt genau ein Feld: navOrder[sec]. */
  async setNavOrder(sec, keys) {
    const order = this.settings.navOrder ?? { projects: [], areas: [], labels: [], filters: [] };
    order[sec] = keys;
    this.settings.navOrder = order;
    await this.saveSettings();
    this.renderAll();
  }
  /** Manuelle Kanban-Spalten-Reihenfolge je Gruppierung setzen (board-eigen, entkoppelt von der
   *  Sidebar). keys = Spalten-IDs in gewünschter Reihenfolge (ohne Sentinel „Ohne …"). */
  async setBoardColumnOrder(groupKey, keys) {
    const map = this.settings.boardColumnOrder ?? {};
    map[groupKey] = keys;
    this.settings.boardColumnOrder = map;
    await this.saveSettings();
    this.renderAll();
  }
  /** Sichtbare Schlüssel einer Sektion in aktueller Reihenfolge (ohne die ausgeblendeten) –
   *  das ist genau die Menge, die die Seitenleiste zeigt. Basis fürs Sidebar-Umsortieren. */
  visibleNavKeys(sec) {
    if (sec === "labels") return this.getVisibleLabels();
    if (sec === "filters") return this.sortFilters(listFilters(this.app)).filter((f) => !f.hidden).map((f) => f.path);
    const want = sec === "areas" ? "area" : "project";
    const items = listManaged(this.app).active.filter((p) => p.type === want && !p.hidden);
    return this.sortProjItems(sec, items).map((p) => p.path);
  }
  /** Neue Reihenfolge der SICHTBAREN Schlüssel anwenden (Seitenleisten-Umsortieren).
   *  Ausgeblendete behalten ihre absolute Position, damit ihre Reihenfolge nicht verloren geht. */
  async reorderVisible(sec, visibleKeys) {
    const full = this.currentNavKeys(sec);
    const visSet = new Set(visibleKeys);
    let vi = 0;
    const merged = full.map((k) => visSet.has(k) ? visibleKeys[vi++] : k);
    for (const k of visibleKeys) if (!full.includes(k)) merged.push(k);
    await this.setNavOrder(sec, merged);
  }
  /** ↑/↓ im ÜBERSICHTS-Kontext: verschiebt in der VOLLEN Reihenfolge (inkl. Ausgeblendeter). */
  async moveNavItem(sec, key, dir) {
    await this.ensureManualSort(sec);
    const keys = this.currentNavKeys(sec);
    const i = keys.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= keys.length) return;
    [keys[i], keys[j]] = [keys[j], keys[i]];
    await this.setNavOrder(sec, keys);
  }
  /** ↑/↓ im SEITENLEISTEN-Kontext: verschiebt NUR innerhalb der sichtbaren Reihenfolge
   *  (überspringt Ausgeblendete) – so bewegt sich in der Seitenleiste immer sichtbar etwas. */
  async moveNavItemVisible(sec, key, dir) {
    await this.ensureManualSort(sec);
    const vis = this.visibleNavKeys(sec);
    const i = vis.indexOf(key), j = i + dir;
    if (i < 0 || j < 0 || j >= vis.length) return;
    [vis[i], vis[j]] = [vis[j], vis[i]];
    await this.reorderVisible(sec, vis);
  }
  /** Sicherstellen, dass eine Sektion im Manuell-Modus ist (Voraussetzung fürs Umsortieren). */
  async ensureManualSort(sec) {
    if (this.navSortMode(sec) !== "manual") await this.setNavSort(sec, "manual");
  }
  /** „Reihenfolge ändern" aus der SEITENLEISTE: Drag-Sortiermodus (nur Sichtbare) starten. */
  async startReorder(sec) {
    await this.ensureManualSort(sec);
    this.reorderSec = sec;
    this.renderAll();
  }
  /** Seitenleisten-Sortiermodus beenden. */
  endReorder() {
    this.reorderSec = null;
    this.renderAll();
  }
  // ── Nav-Abschnitte ein-/ausklappen (Zustand persistent, beim Neustart wiederhergestellt) ──
  isNavCollapsed(id) {
    return !!this.settings.navCollapsed[id];
  }
  async setNavCollapsed(id, collapsed) {
    if (this.isNavCollapsed(id) === collapsed) return;
    this.settings.navCollapsed[id] = collapsed;
    await this.saveSettings();
    this.renderNav();
  }
  async toggleNavSection(id) {
    await this.setNavCollapsed(id, !this.isNavCollapsed(id));
  }
  async setLabelVisible(name, visible) {
    const has = this.settings.visibleLabels.includes(name);
    if (visible === has) return;
    this.settings.visibleLabels = visible ? [...this.settings.visibleLabels, name] : this.settings.visibleLabels.filter((x) => x !== name);
    await this.saveSettings();
    this.renderAll();
  }
  // ── Status-Verwaltung (user-definierbare Status) ──
  /** Mutierbare Status-Liste; materialisiert beim ersten Edit die eingebauten Defaults. */
  statusList() {
    if (!this.settings.statuses) this.settings.statuses = DEFAULT_STATUSES.map((s) => ({ ...s }));
    return this.settings.statuses;
  }
  getStatuses() {
    return this.statusList();
  }
  /** Wie viele Aufgaben tragen diesen Status (für Löschen-Umzug/Anzeige). */
  statusTaskCount(id) {
    return this.index.all().filter((tk) => tk.status === id).length;
  }
  /** Registry aktualisieren, speichern, Index neu bewerten (isKnownStatus), Views neu. Vorher die
   *  Pflicht-Kategorien erzwingen (einziger Choke-Point aller Status-Mutationen). */
  async commitStatuses() {
    this.settings.statuses = ensureStatusInvariants(this.statusList());
    initStatuses(this.settings.statuses);
    await this.saveSettings();
    this.index.build();
    this.renderAll();
  }
  async addStatus(label, kind = "open") {
    const name = label.trim();
    if (!name) return;
    if (kind === "cancelled") {
      new import_obsidian29.Notice(t("status_only_one_trash"));
      return;
    }
    const list = this.statusList();
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "status";
    let id = base, n = 2;
    while (list.some((s) => s.id === id)) id = base + "-" + n++;
    const entry = { id, label: name, kind, icon: kind === "done" ? "check-circle" : "circle" };
    let last = -1;
    for (let i = 0; i < list.length; i++) if (list[i].kind === kind) last = i;
    if (last >= 0) list.splice(last + 1, 0, entry);
    else {
      const cx = list.findIndex((s) => s.kind === "cancelled");
      if (cx >= 0) list.splice(cx, 0, entry);
      else list.push(entry);
    }
    await this.commitStatuses();
  }
  async renameStatus(id, label) {
    const name = label.trim();
    if (!name) return;
    const s = this.statusList().find((x) => x.id === id);
    if (!s) return;
    delete s.labelKey;
    s.label = name;
    await this.commitStatuses();
  }
  async setStatusKind(id, kind) {
    const list = this.statusList();
    const s = list.find((x) => x.id === id);
    if (!s || s.kind === kind) return;
    if (kind === "cancelled" && list.some((x) => x.kind === "cancelled")) {
      new import_obsidian29.Notice(t("status_only_one_trash"));
      return;
    }
    if (list.filter((x) => x.kind === s.kind).length <= 1) {
      new import_obsidian29.Notice(t("status_need_kind"));
      return;
    }
    s.kind = kind;
    await this.commitStatuses();
  }
  async setStatusIcon(id, icon) {
    const s = this.statusList().find((x) => x.id === id);
    if (!s) return;
    s.icon = icon;
    await this.commitStatuses();
  }
  async setStatusColor(id, color) {
    const s = this.statusList().find((x) => x.id === id);
    if (!s) return;
    if (color) s.color = color;
    else delete s.color;
    await this.commitStatuses();
  }
  async moveStatus(id, dir) {
    const list = this.statusList();
    const i = list.findIndex((s) => s.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= list.length) return;
    [list[i], list[j]] = [list[j], list[i]];
    await this.commitStatuses();
  }
  /** Volle Status-Reihenfolge setzen (Drag&Drop-Sortierung im Status-Editor). Nicht genannte
   *  Ids werden ans Ende gehängt (Sicherheitsnetz), damit keine Definition verloren geht. */
  async setStatusOrder(ids) {
    const list = this.statusList();
    const byId = new Map(list.map((s) => [s.id, s]));
    const next = ids.map((id) => byId.get(id)).filter((s) => !!s);
    for (const s of list) if (!ids.includes(s.id)) next.push(s);
    this.settings.statuses = next;
    await this.commitStatuses();
  }
  /** Alle Status auf die eingebauten Defaults zurücksetzen (To-Do · In Arbeit · Erledigt · Papierkorb).
   *  Aufgaben mit eigenen, dann nicht mehr existierenden Status-IDs werden vom Index auf die erste
   *  offene Phase abgebildet (nicht-destruktiv am Frontmatter). */
  async resetStatuses() {
    this.settings.statuses = DEFAULT_STATUSES.map((s) => ({ ...s }));
    await this.commitStatuses();
  }
  /** Status löschen: Aufgaben darauf werden auf einen gleichartigen Ersatz umgezogen (statt
   *  zu verwaisen). Leitplanken: mind. 1 je Kategorie (offen · erledigt · Papierkorb). */
  async deleteStatus(id) {
    const list = this.statusList();
    const s = list.find((x) => x.id === id);
    if (!s) return;
    if (list.filter((x) => x.kind === s.kind).length <= 1) {
      new import_obsidian29.Notice(t("status_need_kind"));
      return;
    }
    const target = list.find((x) => x.id !== id && x.kind === s.kind)?.id ?? list.find((x) => x.id !== id && x.kind === "open")?.id ?? firstOpenStatus();
    const affected = this.index.all().filter((tk) => tk.status === id);
    for (const tk of affected) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        fm.status = target;
      });
    }
    this.settings.statuses = list.filter((x) => x.id !== id);
    await this.commitStatuses();
    if (affected.length) new import_obsidian29.Notice(t("status_reassigned", affected.length, statusLabel(target)));
  }
  // ── Aufgaben-Aktionen ──
  /** `due` (optional) schlägt `today`: der Kalender kann damit den angezeigten Tag vorgeben. */
  openNewTask(project, label, today = false, status, due) {
    new TaskModal(this, void 0, project, {
      defaultLabel: label,
      defaultToday: today,
      defaultStatus: status,
      seed: due ? { due } : void 0
    }).open();
  }
  openEditTask(task) {
    new TaskModal(this, task).open();
  }
  /** Bestehende Notiz zur Aufgabe machen: `type: task` + Kanon-Felder setzen. Ohne Projekt –
   *  landet damit (Variante A) automatisch im Eingang, bis der Nutzer sie zuordnet. */
  async convertActiveNoteToTask(f) {
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      fm.type = "task";
      ensureCanonicalFm(fm);
      if (typeof fm.status !== "string" || !fm.status) fm.status = firstOpenStatus();
    });
    await this.reconcileTaskDescription(f);
    new import_obsidian29.Notice(t("notice_made_task"));
  }
  /** Beschreibungs-Modell für EINE Aufgaben-Notiz herstellen (idempotent):
   *  - hat sie schon eine Frontmatter-`description`, bleibt alles wie es ist;
   *  - ist der Body ein Dokument (eigener Inhalt), bleibt er stehen und bekommt einen Hinweis
   *    (`description`) plus einen „Notiz öffnen"-Kommentar mit Selbst-Wikilink;
   *  - ist der Body eine kurze Beschreibung, wandert sie ins Frontmatter und wird aus dem Body entfernt.
   *  Gibt zurück, was passiert ist (für die Migrations-Statistik). */
  async reconcileTaskDescription(f) {
    const fmNow = this.app.metadataCache.getFileCache(f)?.frontmatter?.description;
    if (typeof fmNow === "string" && fmNow.trim()) return "none";
    const content = await this.app.vault.cachedRead(f);
    const afterFm = content.replace(/^---\n[\s\S]*?\n---\n/, "");
    const h1 = afterFm.search(/^#\s+/m);
    const preH1 = (h1 > 0 ? afterFm.slice(0, h1) : "").trim();
    const bodyDesc = splitContent(content).description;
    const combined = (preH1 + "\n" + bodyDesc).trim();
    if (!combined) return "none";
    if (preH1 || isDocumentBody(combined)) {
      await this.app.fileManager.processFrontMatter(f, (fm) => {
        if (typeof fm.description !== "string" || !fm.description) fm.description = t("desc_note_content_hint");
      });
      await ensureNoteLinkLog(this.app, f, t("log_open_note"));
      return "document";
    }
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      fm.description = bodyDesc;
    });
    await writeDescription(this.app, f, "");
    return "moved";
  }
  /** Einmalige Migration: bestehende Body-Beschreibungen ins Frontmatter überführen bzw. Dokumente
   *  mit „Notiz öffnen"-Kommentar versehen. Idempotent – mehrfaches Ausführen ist gefahrlos. */
  async migrateDescriptions(opts = {}) {
    const tasks = this.index.all();
    let moved = 0, docs = 0;
    for (const tk of tasks) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (!(f instanceof import_obsidian29.TFile)) continue;
      const r = await this.reconcileTaskDescription(f);
      if (r === "moved") moved++;
      else if (r === "document") docs++;
      await this.normalizeLog(f);
    }
    this.settings.didDescriptionMigration = true;
    await this.saveSettings();
    if (!opts.silent) {
      window.setTimeout(() => this.index.build(), 400);
      new import_obsidian29.Notice(t("notice_desc_migrated", moved, docs));
    }
  }
  /** Einmalige Migration „Inbox-Notiz entfernen": übernimmt View-Optionen + GCal-Ausschluss der
   *  alten Inbox-Notiz in die Settings, löst `[[Inbox]]`-Verweise auf (kein Projekt) und verschiebt
   *  die Notiz in Obsidians Papierkorb. Idempotent (setzt `didInboxRemoval`); auch manuell aufrufbar. */
  async migrateInboxRemoval(opts = {}) {
    const path = inboxNotePath(this.app);
    const noteFile = path ? this.app.vault.getAbstractFileByPath(path) : null;
    if (noteFile instanceof import_obsidian29.TFile) {
      const fm = this.app.metadataCache.getFileCache(noteFile)?.frontmatter;
      if (fm?.gcal_sync === false && this.settings.gcal) this.settings.gcal.excludeInbox = true;
      const opts2 = readNoteViewOptions(this.app, noteFile.path);
      this.settings.pageViewOptions = { ...this.settings.pageViewOptions ?? {}, inbox: opts2 };
    }
    let unlinked = 0;
    for (const tk of this.index.all()) {
      if (!tk.project || !isInboxName(tk.project.split("/").pop().replace(/\.md$/, ""))) continue;
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof import_obsidian29.TFile) {
        await this.app.fileManager.processFrontMatter(f, (m) => {
          delete m.project;
        });
        unlinked++;
      }
    }
    if (noteFile instanceof import_obsidian29.TFile) await this.app.fileManager.trashFile(noteFile);
    this.settings.didInboxRemoval = true;
    await this.saveSettings();
    if (!opts.silent) {
      window.setTimeout(() => this.index.build(), 400);
      new import_obsidian29.Notice(t("notice_inbox_removed", unlinked));
    }
  }
  /** Beim ERSTEN Start nach einem Update die ausstehenden Einmal-Migrationen automatisch ausführen
   *  (per Flag abgesichert, nie doppelt). Für neue Vaults sind beide No-Ops (keine Alt-Daten). */
  async runPendingMigrations() {
    if (this.settings.didDescriptionMigration && this.settings.didInboxRemoval) return;
    const hasData = this.index.all().length > 0 || inboxNotePath(this.app) !== null;
    if (!this.settings.didDescriptionMigration) await this.migrateDescriptions({ silent: true });
    if (!this.settings.didInboxRemoval) await this.migrateInboxRemoval({ silent: true });
    if (hasData) {
      this.index.build();
      this.renderAll();
      new import_obsidian29.Notice(t("notice_auto_migrated"));
    }
  }
  /** Bestehenden Log einer Notiz auf den aktuellen Stand bringen (verlustfrei): führendes „📄 " aus
   *  „Notiz öffnen"-Einträgen entfernen und die einklappbare Log-Überschrift ergänzen, falls sie fehlt. */
  async normalizeLog(f) {
    const content = await this.app.vault.cachedRead(f);
    const { log } = splitContent(content);
    if (!log) return;
    const entries = parseDetailLog(log, nowLogTs(new Date(f.stat.mtime)));
    let changed = false;
    for (const e of entries) {
      const s = e.body.replace(/^📄\s*/, "");
      if (s !== e.body) {
        e.body = s;
        changed = true;
      }
    }
    if (changed || !content.includes(LOG_HEADING)) await writeLog(this.app, f, entries);
  }
  /** Neue Aufgabe mit vorbelegter Fälligkeit – Klick auf einen Kalendertag bzw. Zeit-Slot.
   *  Projekt/Label erbt sie von der Seite, auf der der Kalender steht (wie „+ Aufgabe" der Liste). */
  openNewTaskOn(due, dueTime, project, label) {
    new TaskModal(this, void 0, project, {
      defaultLabel: label,
      seed: { due, dueTime: dueTime ?? null }
    }).open();
  }
  openQuickAdd(project) {
    new QuickAddModal(this, project).open();
  }
  /**
   * Kontext der aktuell geöffneten Seite für „Aufgabe hinzufügen" – spiegelt exakt das, was der
   * „+ Aufgabe"-Knopf UNTER DEM SEITENTITEL tut. Das ist die ganze Regel: Der Command macht
   * dasselbe wie der sichtbare Knopf. Seiten ohne Knopf (Wiederkehrend, Erledigt, Verwaltung,
   * Filter) belegen nichts vor -> Eingang, wie bisher.
   */
  addContext() {
    const page = this.currentPage();
    const due = calendarDayAnchor(this, this.pageViewOptions());
    if (page.kind === "project") return { project: projectName(page.key), today: false, due };
    if (page.kind === "label") return { label: page.key, today: false, due };
    if (page.kind === "view" && page.key === "heute") return { today: true, due };
    return { today: false, due };
  }
  /** „Neue Aufgabe" (voller Editor) im Kontext der aktuellen Seite. */
  openNewTaskHere() {
    const c = this.addContext();
    this.openNewTask(c.project, c.label, c.today, void 0, c.due);
  }
  /** „Aufgabe schnell erfassen" im Kontext der aktuellen Seite. */
  openQuickAddHere() {
    const c = this.addContext();
    new QuickAddModal(this, c.project, { label: c.label, due: c.due, today: c.today }).open();
  }
  openSearch() {
    new TaskSearchModal(this).open();
  }
  // ── Erinnerungen (Stufe A) ──
  /** Prüft alle offenen Aufgaben und feuert Erinnerungen, deren Zeitpunkt ins Fenster
   *  (letzter Scan, jetzt] fällt. Das fortlaufende Fenster garantiert „genau einmal";
   *  ein Grace von 1 h fängt beim (Neu-)Start kürzlich Verpasstes ohne Alt-Spam. */
  scanReminders() {
    if (!this.index) return;
    const now = Date.now();
    const REMINDER_GRACE_MS = 60 * 6e4;
    const from = Math.max(this.reminderScan, now - REMINDER_GRACE_MS);
    let fired = false;
    for (const task of this.index.open()) {
      for (const { fireAt } of resolveReminders(task)) {
        const ts = fireAt.getTime();
        if (ts > from && ts <= now) {
          this.fireReminder(task);
          fired = true;
        }
      }
    }
    this.reminderScan = now;
    if (fired) {
      this.settings.reminderLastScan = now;
      void this.saveSettings();
    }
  }
  /** Zustellung: System-Notification (Desktop, auch im Hintergrund) + klickbare In-App-Notice.
   *  Klick öffnet die Aufgabe. Auf Mobile/ohne Notification bleibt die Notice der Kanal. */
  fireReminder(task) {
    const body = task.title;
    try {
      if (typeof Notification !== "undefined" && !import_obsidian29.Platform.isMobile) {
        const n = new Notification("BeautyTasks", { body });
        n.onclick = () => {
          window.focus();
          this.openEditTask(task);
        };
      }
    } catch {
    }
    new import_obsidian29.Notice("\u23F0 " + body, 1e4);
  }
  async setTaskDate(task, field, isoVal) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      this.ensureCanonical(fm);
      if (isoVal) fm[field] = isoVal;
      else delete fm[field];
    });
  }
  async setTaskDuration(task, minutes) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      this.ensureCanonical(fm);
      if (minutes) fm.duration = minutes;
      else delete fm.duration;
    });
  }
  /** Checkbox-Umschalten: erledigt ⇄ offen. Delegiert an setTaskStatus, damit die
   *  Erledigt-Semantik (Zeitstempel, Wiederholung) an EINER Stelle lebt. */
  async toggleDone(task) {
    await this.setTaskStatus(task, isDone(task.status) ? firstOpenStatus() : firstDoneStatus());
  }
  /** Status setzen (Frontmatter). Beim Wechsel nach „erledigt" wird `completed`
   *  gestempelt und – falls wiederkehrend – die nächste Instanz angelegt (wie das
   *  Tasks-Plugin). Beim Verlassen von „erledigt" wird der Stempel entfernt. Basis
   *  für Checkbox UND Kanban-Drag; `cancelled` läuft weiter über cancelTask. */
  /** Ein Label an einer Aufgabe tauschen (Kanban „nach Label", Drag zwischen Label-Spalten):
   *  entfernt `remove` (falls gesetzt) und fügt `add` hinzu (falls gesetzt) – andere Labels bleiben.
   *  Der metadataCache-Listener zeichnet danach neu (wie bei setTaskStatus). */
  /** Fehlende Kanon-Felder einer handgeschriebenen `type: task`-Notiz nachtragen – idempotent,
   *  lazy: läuft nur, wenn der Nutzer die Aufgabe erstmals ÜBER DIE APP anfasst (Status/Projekt/
   *  Label/Datum ändern, abschließen …). So bleibt `id` über Umbenennen und GCal-Sync stabil,
   *  ohne dass beim Laden fremde Notizen umgeschrieben werden. `status`/`project` bleiben unberührt
   *  (fehlendes `project` ist bedeutungstragend = Eingang). */
  ensureCanonical(fm) {
    ensureCanonicalFm(fm);
  }
  async swapTaskLabel(task, remove, add) {
    if (remove === add) return;
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      this.ensureCanonical(fm);
      let arr = Array.isArray(fm.labels) ? fm.labels.map(String) : [];
      if (remove) arr = arr.filter((x) => x !== remove);
      if (add && !arr.includes(add)) arr.push(add);
      fm.labels = arr;
    });
  }
  /** Priorität einer Aufgabe setzen (Kanban „nach Priorität"). „normal" = kein Frontmatter-Feld. */
  async setTaskPriority(task, priority) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      this.ensureCanonical(fm);
      fm.priority = priority !== "normal" ? priority : null;
    });
  }
  /** Aufgabe einem Projekt/Bereich zuordnen (Kanban „nach Projekt"). null = kein Projekt.
   *  Referenz als `[[Basename]]` – wie im Task-Modal; der Index löst den Basename auf. */
  async setTaskProject(task, project) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      this.ensureCanonical(fm);
      fm.project = project ? "[[" + project + "]]" : null;
    });
  }
  async setTaskStatus(task, status) {
    if (task.status === status) return;
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    const wasDone = isDone(task.status);
    const nowDone = isDone(status);
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      this.ensureCanonical(fm);
      fm.status = status;
      if (nowDone && !wasDone) fm.completed = localStamp();
      else if (wasDone && !nowDone) fm.completed = null;
    });
    if (nowDone && !wasDone && task.recurrence) {
      const next = nextInstance(task, todayStr());
      if (next && (next.due || next.scheduled)) {
        await createTaskNote(this.app, this.settings, {
          title: task.title,
          priority: task.priority,
          project: task.project ? projectName(task.project) : null,
          labels: [...task.labels],
          due: next.due,
          dueTime: task.dueTime,
          // Uhrzeit/Dauer in die nächste Instanz übernehmen
          scheduled: next.scheduled,
          scheduledTime: task.scheduledTime,
          duration: task.duration,
          recurrence: task.recurrence,
          recurBasis: task.recurBasis
        });
      }
    }
  }
  // ── Papierkorb (abgebrochene Aufgaben = status "cancelled") ──
  /** Aufgabe in den Papierkorb: status "cancelled" – INKLUSIVE aller Unteraufgaben
   *  (Kaskade). Sonst blieben Kinder ohne sichtbaren Parent zurück und wären nur noch
   *  über die Suche, nicht mehr in den Boards erreichbar. */
  async cancelTask(task) {
    const stamp = localStamp();
    const cancelId = firstCancelledStatus();
    const targets = [task, ...this.index.descendants(task.path)].filter((t2) => !isTrashed(t2.status));
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        this.ensureCanonical(fm);
        fm.status = cancelId;
        fm.cancelled = stamp;
      });
    }
  }
  /** Einzelne Aufgabe wiederherstellen: zurück auf offen, Abbruch-Datum entfernen. */
  async restoreTask(task) {
    const targets = [task, ...this.index.descendants(task.path)].filter((tk) => isTrashed(tk.status));
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        this.ensureCanonical(fm);
        fm.status = firstOpenStatus();
        delete fm.cancelled;
      });
    }
    new import_obsidian29.Notice(t("msg_restored", task.title));
  }
  /** Einzelne Aufgabe endgültig löschen (in Obsidians Papierkorb – dort wiederherstellbar). */
  async deleteTaskForever(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof import_obsidian29.TFile) await this.app.fileManager.trashFile(f);
  }
  /** Alle abgebrochenen Aufgaben wiederherstellen (reversibel, ohne Rückfrage). */
  async restoreAllCancelled() {
    const items = this.index.cancelled();
    if (!items.length) {
      new import_obsidian29.Notice(t("report_trash_empty_restore"));
      return;
    }
    for (const task of items) {
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        this.ensureCanonical(fm);
        fm.status = firstOpenStatus();
        delete fm.cancelled;
      });
    }
    new import_obsidian29.Notice(t("report_tasks_restored", items.length));
  }
  /** Papierkorb leeren: alle abgebrochenen Aufgaben in Obsidians Papierkorb verschieben. */
  async emptyTrash() {
    const items = this.index.cancelled();
    if (!items.length) {
      new import_obsidian29.Notice(t("msg_trash_empty"));
      return;
    }
    for (const task of items) {
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian29.TFile) await this.app.fileManager.trashFile(f);
    }
    new import_obsidian29.Notice(t("msg_trash_emptied", items.length));
  }
  async loadSettings() {
    const saved = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, saved);
    const legacy = saved ?? {};
    if ((legacy.chipOrder || legacy.chipTiers) && !this.settings.chipProfiles) {
      this.settings.chipProfiles = {
        editor: { order: legacy.chipOrder, tiers: legacy.chipTiers }
      };
    }
    if (saved?.chipsIconsOnly === void 0 && import_obsidian29.Platform.isMobile) {
      this.settings.chipsIconsOnly = true;
    }
    this.settings.statuses = ensureStatusInvariants(this.settings.statuses);
    initStatuses(this.settings.statuses);
    this.settings.gcal = Object.assign({}, DEFAULT_GCAL_SETTINGS, this.settings.gcal);
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  /** Google-Auth + Push-Engine aufbauen (UI-agnostisch). Beide mutieren `settings.gcal`
   *  in place; Persistenz läuft über saveSettings (data.json). Auf Unload wird gestoppt. */
  setupGCal() {
    const gcal = this.settings.gcal;
    const store = {
      load: () => gcal.tokens,
      save: async (tokens) => {
        gcal.tokens = tokens;
        await this.saveSettings();
      }
    };
    this.gcalAuth = new GCalAuth(
      () => ({ clientId: gcal.clientId, clientSecret: gcal.clientSecret }),
      store
    );
    const host = {
      app: this.app,
      settings: gcal,
      persist: () => this.saveSettings(),
      allTasks: () => this.index.all(),
      subscribe: (cb) => this.index.subscribe(cb)
    };
    this.gcalSync = new GCalSync(host, this.gcalAuth);
    this.register(() => this.gcalSync.stop());
    const bar = this.addStatusBarItem();
    bar.addClass("bt-gcal-sb");
    bar.addEventListener("click", () => void this.gcalSync.syncNow());
    this.gcalStatusBar = bar;
    this.register(this.gcalSync.onStatus((i) => this.renderStatusBar(i)));
  }
  /** Statusleiste zeichnen (nur wenn verbunden UND showStatusBar). Icon + Tooltip je Zustand. */
  renderStatusBar(i) {
    const bar = this.gcalStatusBar;
    if (!bar) return;
    const g = this.settings.gcal;
    const show = g.showStatusBar && this.gcalAuth.isConnected();
    bar.style.display = show ? "" : "none";
    if (!show) return;
    bar.empty();
    bar.toggleClass("mod-error", i.status === "error");
    const icon = i.status === "syncing" ? "refresh-cw" : i.status === "error" ? "alert-circle" : "calendar-sync";
    (0, import_obsidian29.setIcon)(bar.createSpan({ cls: "bt-gcal-sb-ic" }), icon);
    const detail = i.status === "syncing" ? t("gcal_syncing") : i.status === "error" ? t("gcal_sync_error", i.lastError ?? "") + " \u2014 " + t("gcal_reconnect_hint") : t("gcal_last_synced", i.lastSyncedAt ? new Date(i.lastSyncedAt).toLocaleTimeString() : t("gcal_never"));
    bar.setAttr("aria-label", t("set_gcal_heading") + " \xB7 " + detail);
  }
  /** Statusleiste neu zeichnen (nach Verbinden/Abmelden oder Toggle showStatusBar). */
  refreshGCalStatusBar() {
    this.renderStatusBar(this.gcalSync.getStatus());
  }
  /** Ist diese Liste vom Kalender-Sync ausgeschlossen? Eingang -> Setting, sonst gcal_sync:false der Notiz. */
  isListGcalExcluded(path) {
    if (path === INBOX_KEY) return this.settings.gcal?.excludeInbox ?? false;
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian29.TFile)) return false;
    const fm = this.app.metadataCache.getFileCache(f)?.frontmatter;
    return fm?.gcal_sync === false;
  }
  /** Liste ein-/ausschließen, danach syncen. Eingang -> Setting, sonst gcal_sync-Flag der Notiz. */
  async setListGcalExcluded(path, excluded) {
    if (path === INBOX_KEY) {
      if (this.settings.gcal) {
        this.settings.gcal.excludeInbox = excluded;
        await this.saveSettings();
      }
      void this.gcalSync.syncNow();
      return;
    }
    const f = this.app.vault.getAbstractFileByPath(path);
    if (!(f instanceof import_obsidian29.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      if (excluded) fm.gcal_sync = false;
      else delete fm.gcal_sync;
    });
    void this.gcalSync.syncNow();
  }
  /** Mit Google verbinden: Login (Desktop-Loopback bzw. Mobile-Device-Flow), danach Anzeige-
   *  E-Mail holen, bei Bedarf eigenen „BeautyTasks"-Kalender anlegen, aktivieren, initial pushen.
   *  Wirft bei Fehler (die UI zeigt die Meldung). */
  async gcalConnect(onDevicePrompt) {
    const g = this.settings.gcal;
    await this.gcalAuth.connect(onDevicePrompt);
    try {
      g.account = await fetchAccountEmail(this.gcalAuth);
    } catch {
      g.account = null;
    }
    try {
      const cals = await this.gcalCalendars();
      if (!g.calendarId || !cals.some((c) => c.id === g.calendarId)) {
        g.calendarId = await ensureDefaultCalendar(this.gcalAuth, g.timezone);
      }
    } catch (e) {
      console.warn("BeautyTasks: Ziel-Kalender konnte nicht sichergestellt werden", e);
    }
    g.enabled = true;
    await this.saveSettings();
    this.refreshGCalStatusBar();
    void this.gcalSync.syncNow();
  }
  /** Verbindung trennen (Token widerrufen + löschen). Kalenderwahl bleibt für erneutes Verbinden. */
  async gcalDisconnect() {
    const g = this.settings.gcal;
    await this.gcalAuth.disconnect();
    g.account = null;
    g.enabled = false;
    await this.saveSettings();
    this.refreshGCalStatusBar();
  }
  /** Kalenderliste für den Ziel-Kalender-Picker. */
  gcalCalendars() {
    return listCalendars(this.gcalAuth);
  }
  /** Eigenen „BeautyTasks"-Kalender anlegen (oder vorhandenen finden) und als Ziel setzen.
   *  Bestehende Events ziehen beim nächsten Sync via move nach. Braucht den calendar.app.created-
   *  Scope → nach Scope-Erweiterung ggf. einmal neu verbinden. Wirft bei Fehler (UI zeigt Meldung). */
  async gcalCreateDefaultCalendar() {
    const g = this.settings.gcal;
    g.calendarId = await ensureDefaultCalendar(this.gcalAuth, g.timezone);
    await this.saveSettings();
    void this.gcalSync.syncNow();
  }
};
