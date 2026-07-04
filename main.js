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
var import_obsidian12 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  itemsFolder: "BeautyTasks/Items",
  projectsFolder: "BeautyTasks/Projects",
  areasFolder: "BeautyTasks/Areas",
  attachmentsFolder: "BeautyTasks/Attachments",
  knownLabels: [],
  visibleLabels: [],
  locale: "auto",
  showDescriptionInList: true,
  navCollapsed: {},
  startView: "heute",
  lastView: "heute",
  parseNaturalLanguage: true,
  chipsIconsOnly: false,
  reminderLastScan: 0
};

// src/i18n.ts
var STRINGS = {
  en: {
    view_today: "Today",
    view_upcoming: "Upcoming",
    view_recurring: "Recurring",
    view_done: "Done",
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
    empty_no_project_tasks: "No tasks in this project yet.",
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
    manage_empty_active: "No projects or areas yet.",
    manage_empty_archive: "Nothing archived.",
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
    cmd_open_view: "Open {0}",
    cmd_count_tasks: "Count tasks",
    cmd_import: "Import from Tasks/Lists",
    cmd_search: "Search tasks",
    qa_placeholder: "e.g. Write report tomorrow p1 #work",
    qa_added: "Task added",
    qa_open_full: "Open in full editor",
    nav_search: "Search",
    search_placeholder: "Search tasks \u2026",
    notice_count: "BeautyTasks: {0} tasks ({1} open)",
    notice_import_running: "BeautyTasks: importing \u2026",
    notice_imported: "BeautyTasks: {0} tasks imported.",
    notice_import_failed: "BeautyTasks: import failed (see console).",
    ribbon_open: "Open BeautyTasks",
    set_show_desc: "Show description in lists",
    set_show_desc_desc: "Display a one-line description preview under the task title.",
    set_chips_iconsonly: "Compact chips (icons only)",
    set_chips_iconsonly_desc: "In the task editor, show only the icons of empty option chips (Date, Priority, Label \u2026); the name appears as a tooltip. Chips with a value still show it.",
    task_actions: "Task actions",
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
    rem_need_time: "Set a time first"
  },
  de: {
    view_today: "Heute",
    view_upcoming: "Demn\xE4chst",
    view_recurring: "Wiederkehrend",
    view_done: "Erledigt",
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
    empty_no_project_tasks: "Noch keine Aufgaben in diesem Projekt.",
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
    manage_empty_active: "Noch keine Projekte oder Bereiche.",
    manage_empty_archive: "Nichts archiviert.",
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
    cmd_open_view: "{0} \xF6ffnen",
    cmd_count_tasks: "Aufgaben z\xE4hlen",
    cmd_import: "Aus Tasks/Lists importieren",
    cmd_search: "Aufgaben suchen",
    qa_placeholder: "z. B. Bericht schreiben morgen p1 #arbeit",
    qa_added: "Aufgabe hinzugef\xFCgt",
    qa_open_full: "Im vollen Editor \xF6ffnen",
    nav_search: "Suchen",
    search_placeholder: "Aufgabe suchen \u2026",
    notice_count: "BeautyTasks: {0} Aufgaben ({1} offen)",
    notice_import_running: "BeautyTasks: Import l\xE4uft \u2026",
    notice_imported: "BeautyTasks: {0} Aufgaben importiert.",
    notice_import_failed: "BeautyTasks: Import fehlgeschlagen (Konsole).",
    ribbon_open: "BeautyTasks \xF6ffnen",
    set_show_desc: "Beschreibung in Listen anzeigen",
    set_show_desc_desc: "Zeigt eine einzeilige Beschreibungs-Vorschau unter dem Aufgabentitel.",
    set_chips_iconsonly: "Kompakte Chips (nur Icons)",
    set_chips_iconsonly_desc: "In der Aufgaben-Maske nur die Icons leerer Options-Chips (Datum, Priorit\xE4t, Label \u2026) zeigen; der Name erscheint als Tooltip. Chips mit Wert zeigen diesen weiterhin an.",
    task_actions: "Aufgabenaktionen",
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
    rem_need_time: "Setz zuerst eine Uhrzeit"
  }
};
var DEFAULT_LOCALE = "en";
var current = DEFAULT_LOCALE;
function pickLocale(raw) {
  const l = String(raw ?? "").trim().toLowerCase();
  return Object.prototype.hasOwnProperty.call(STRINGS, l) ? l : DEFAULT_LOCALE;
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

// src/format.ts
function todayStr() {
  const d = /* @__PURE__ */ new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function monthShort(monthIndex) {
  return new Intl.DateTimeFormat(getLocale(), { month: "short" }).format(new Date(2020, monthIndex, 1)).replace(/\.$/, "");
}
var dateOf = (iso3) => iso3.slice(0, 10);
var timeOf = (iso3) => {
  const m = iso3.match(/T(\d{2}:\d{2})/);
  return m ? m[1] : null;
};
var combineDT = (date, time) => time ? date + "T" + time : date;
function formatDate(iso3, today = todayStr()) {
  const d = /* @__PURE__ */ new Date(dateOf(iso3) + "T00:00");
  const tn = /* @__PURE__ */ new Date(dateOf(today) + "T00:00");
  const diff = Math.round((d.getTime() - tn.getTime()) / 864e5);
  if (diff === 0) return t("date_today");
  if (diff === -1) return t("date_yesterday");
  if (diff === 1) return t("date_tomorrow");
  const sameYear = d.getFullYear() === tn.getFullYear();
  return `${d.getDate()} ${monthShort(d.getMonth())}${sameYear ? "" : " " + d.getFullYear()}`;
}
function formatDateTime(iso3, today = todayStr()) {
  const tm = timeOf(iso3);
  return formatDate(iso3, today) + (tm ? " \xB7 " + tm : "");
}
function formatDuration(min) {
  if (min < 60) return min + " min";
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
function dueWhen(iso3, today = todayStr()) {
  const d = dateOf(iso3), tn = dateOf(today);
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
  if (task.status === "done" || task.status === "cancelled") return [];
  const out = [];
  for (const raw of task.reminders ?? []) {
    const p = parseReminder(raw);
    if (!p) continue;
    if ("abs" in p) {
      const d = new Date(p.abs);
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
  const z4 = (n) => String(n).padStart(2, "0");
  return d.getFullYear() + "-" + z4(d.getMonth() + 1) + "-" + z4(d.getDate()) + " " + z4(d.getHours()) + ":" + z4(d.getMinutes()) + ":" + z4(d.getSeconds());
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
function splitContent(content) {
  const fmMatch = content.match(/^(---\n[\s\S]*?\n---\n)/);
  const fm = fmMatch ? fmMatch[1] : "";
  const body = content.slice(fm.length);
  const lines = body.split("\n");
  const idx = lines.findIndex((l) => /^#\s+/.test(l));
  const title = idx === -1 ? "" : lines[idx];
  const rest = idx === -1 ? lines : lines.slice(idx + 1);
  const li = rest.findIndex((l) => /^>\s*\[!log\]/i.test(l));
  const trim = (s) => s.replace(/^\n+|\n+$/g, "");
  const description = trim((li === -1 ? rest : rest.slice(0, li)).join("\n"));
  const log = li === -1 ? "" : trim(rest.slice(li).join("\n"));
  return { fm, title, description, log };
}
function composeContent(fm, title, description, log) {
  let out = fm + "\n" + title + "\n";
  const desc = description.replace(/^\n+|\n+$/g, "");
  if (desc) out += "\n" + desc + "\n";
  if (log) out += "\n" + log + "\n";
  return out;
}
async function readLog(app, file) {
  const content = await app.vault.cachedRead(file);
  const { log } = splitContent(content);
  return parseDetailLog(log, nowLogTs(new Date(file.stat.mtime)));
}
async function readDescription(app, file) {
  const content = await app.vault.cachedRead(file);
  return splitContent(content).description;
}
async function writeLog(app, file, entries) {
  await app.vault.process(file, (content) => {
    const { fm, title, description } = splitContent(content);
    const head = title || "# " + file.basename;
    return composeContent(fm, head, description, serializeDetailLog(entries));
  });
}
async function writeDescription(app, file, description) {
  await app.vault.process(file, (content) => {
    const { fm, title, log } = splitContent(content);
    const head = title || "# " + file.basename;
    return composeContent(fm, head, description, log);
  });
}

// src/taskService.ts
var import_obsidian = require("obsidian");
var slugify = (s) => s.replace(/[\\/:*?"<>|#^[\]]/g, "").replace(/\s+/g, " ").trim().slice(0, 80) || "Task";
var normalizeLabel = (s) => slugify(s).toLowerCase().replace(/^#/, "").replace(/\s+/g, "-");
var newId = (p) => p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
var todayIso = () => (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
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
    status: f.status ?? "todo",
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
    created: todayIso()
  });
  const desc = (f.description ?? "").trim();
  return app.vault.create(dest, fm + "\n# " + f.title + "\n" + (desc ? "\n" + desc + "\n" : ""));
}
var byName = (a, b) => a.name.localeCompare(b.name, "de");
var isInbox = (p) => p.name.toLowerCase() === "inbox" || p.name.toLowerCase() === "eingang";
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
  const projekteAll = all.filter((p) => p.type === "project");
  const eingang = projekteAll.find(isInbox) ?? null;
  if (eingang) eingang.icon = "inbox";
  const projekte = projekteAll.filter((p) => p !== eingang).sort(byName);
  return { eingang, bereiche, projekte };
}
function listManaged(app) {
  const all = allProjItems(app).filter((p) => !isInbox(p));
  const active = all.filter((p) => !p.archived).sort((a, b) => a.type === b.type ? byName(a, b) : a.type === "area" ? -1 : 1);
  const archived = all.filter((p) => p.archived).sort(byName);
  return { active, archived };
}
async function createProjectNote(app, settings, name, asArea = false) {
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
  const fm = buildFrontmatter({ type: asArea ? "area" : "project", id: newId("p"), status: "active", created: todayIso() });
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
var STATUS = /* @__PURE__ */ new Set(["todo", "doing", "done", "cancelled"]);
var PRIO = /* @__PURE__ */ new Set(["highest", "high", "medium", "normal", "low", "lowest"]);
var asDate = (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null;
var asTime = (v) => {
  const m = typeof v === "string" ? v.match(/T(\d{2}:\d{2})/) : null;
  return m ? m[1] : null;
};
var asNum = (v) => typeof v === "number" && isFinite(v) ? v : null;
var TaskIndex = class extends import_obsidian2.Component {
  // Basenamen (lowercase) archivierter Projekte
  constructor(app) {
    super();
    this.app = app;
    this.byPath = /* @__PURE__ */ new Map();
    this.byId = /* @__PURE__ */ new Map();
    // id -> path (überlebt Umbenennen, für Sync)
    this.commentCounts = /* @__PURE__ */ new Map();
    // path -> Anzahl [!log]-Einträge (Kommentare/Anhänge)
    this.descriptions = /* @__PURE__ */ new Map();
    // path -> Beschreibung (Body zwischen Titel und Log)
    this.subs = /* @__PURE__ */ new Set();
    this.timer = null;
    this.archivedDirty = true;
    // neu berechnen, sobald sich etwas geändert hat
    this.archivedSet = /* @__PURE__ */ new Set();
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
    for (const f of this.app.vault.getMarkdownFiles()) this.upsert(f, false);
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
  upsert(f, notify = true) {
    if (f.extension !== "md") return;
    const t2 = this.parse(f);
    if (!t2) {
      this.remove(f.path, notify);
      return;
    }
    const prev = this.byPath.get(f.path);
    if (prev && prev.id !== t2.id) this.byId.delete(prev.id);
    this.byPath.set(f.path, t2);
    this.byId.set(t2.id, f.path);
    void this.readBodyMeta(f);
    if (notify) this.notify();
  }
  remove(path, notify = true) {
    const t2 = this.byPath.get(path);
    this.commentCounts.delete(path);
    this.descriptions.delete(path);
    if (!t2) return;
    this.byPath.delete(path);
    if (this.byId.get(t2.id) === path) this.byId.delete(t2.id);
    if (notify) this.notify();
  }
  /** Anzahl der [!log]-Einträge (Kommentare/Anhänge) einer Aufgabe – für das Chip. */
  commentsOf(path) {
    return this.commentCounts.get(path) ?? 0;
  }
  /** Beschreibung einer Aufgabe (Body zwischen Titel und Log) – für die Listen-Vorschau. */
  descriptionOf(path) {
    return this.descriptions.get(path) ?? "";
  }
  /** Body EINMAL lesen: Kommentar-Anzahl + Beschreibung ableiten (cachedRead ist gecacht). */
  async readBodyMeta(f) {
    let content;
    try {
      content = await this.app.vault.cachedRead(f);
    } catch {
      return;
    }
    const { description } = splitContent(content);
    const n = (content.match(/^>\s*\[!log\]/gim) ?? []).length;
    const prevN = this.commentCounts.get(f.path) ?? 0;
    const prevD = this.descriptions.get(f.path) ?? "";
    if (n) this.commentCounts.set(f.path, n);
    else this.commentCounts.delete(f.path);
    if (description) this.descriptions.set(f.path, description);
    else this.descriptions.delete(f.path);
    if (n !== prevN || description !== prevD) this.notify();
  }
  /** Frontmatter -> Task (Defaults + Enum-Schutz). null = keine Aufgabe. */
  parse(f) {
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
      status: typeof fm.status === "string" && STATUS.has(fm.status) ? fm.status : "todo",
      priority: typeof fm.priority === "string" && PRIO.has(fm.priority) ? fm.priority : "normal",
      due: asDate(fm.due),
      dueTime: asTime(fm.due),
      scheduled: asDate(fm.scheduled),
      scheduledTime: asTime(fm.scheduled),
      duration: asNum(fm.duration),
      start: asDate(fm.start),
      project: link(fm.project),
      area: link(fm.area),
      parent: link(fm.parent),
      labels: Array.isArray(fm.labels) ? fm.labels.map(String) : [],
      recurrence: typeof fm.recurrence === "string" ? fm.recurrence : null,
      recurBasis: fm.recur_basis === "done" ? "done" : "due",
      reminders: Array.isArray(fm.reminders) ? fm.reminders.map(String) : [],
      created: typeof fm.created === "string" ? fm.created : "",
      completed: asDate(fm.completed),
      cancelled: asDate(fm.cancelled),
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
    const archived = this.archivedProjects();
    return this.all().filter((t2) => (t2.status === "todo" || t2.status === "doing") && !(t2.project && archived.has(baseName(t2.project).toLowerCase())));
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
  noDate() {
    return this.open().filter((t2) => !t2.due);
  }
  done() {
    return this.all().filter((t2) => t2.status === "done").sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  }
  /** Abgebrochene Aufgaben (Papierkorb), neueste zuerst. */
  cancelled() {
    return this.all().filter((t2) => t2.status === "cancelled").sort((a, b) => (b.cancelled ?? "").localeCompare(a.cancelled ?? ""));
  }
  byProject(path) {
    const base = (p) => p.split("/").pop().replace(/\.md$/, "");
    const name = base(path);
    return this.open().filter((t2) => !!t2.project && base(t2.project) === name);
  }
  byLabel(label) {
    return this.open().filter((t2) => t2.labels.includes(label));
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
  const today = (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
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
var import_obsidian7 = require("obsidian");

// src/datePicker.ts
var import_obsidian5 = require("obsidian");

// src/popover.ts
var import_obsidian4 = require("obsidian");
function openPopover(anchor, build) {
  const doc = anchor.ownerDocument;
  const win = doc.defaultView ?? activeWindow;
  const host = anchor.closest(".modal") ?? doc.body;
  const pop = host.createDiv({ cls: "bt-pop" });
  const close = () => {
    pop.remove();
    doc.removeEventListener("mousedown", onDoc, true);
    win.removeEventListener("resize", close);
  };
  const inModal = host !== doc.body;
  const onDoc = (e) => {
    const t2 = e.target;
    if (pop.contains(t2) || t2 === anchor || anchor.contains(t2)) return;
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
  const r = anchor.getBoundingClientRect();
  const below = r.bottom + 4;
  const left = Math.max(8, Math.min(r.left, win.innerWidth - pop.offsetWidth - 8));
  const top = below + pop.offsetHeight > win.innerHeight - 8 ? Math.max(8, r.top - pop.offsetHeight - 4) : below;
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
function openDatePicker(anchor, value, onPick, dur) {
  openPopover(anchor, (pop, close) => {
    pop.addClass("bt-date");
    let curDate = value ? dateOf(value) : "";
    let curTime = value ? timeOf(value) : null;
    let curDur = dur ? dur.value : null;
    let timeOpen = !!curTime;
    const apply = () => onPick(curDate ? combineDT(curDate, curTime) : "");
    const setDate = (d) => {
      curDate = d;
      if (!d) curTime = null;
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
    qrow("ban", "", t("date_no_date"), "", "");
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
          const hhmm = z(Math.floor(mins / 60)) + ":" + z(mins % 60);
          if (f && !hhmm.startsWith(f)) continue;
          const it = drop.createDiv({ cls: "bt-time-opt" + (hhmm === curTime ? " is-sel" : ""), text: hhmm });
          if (hhmm === curTime) selEl = it;
          it.onmousedown = (e) => {
            e.preventDefault();
            curTime = hhmm;
            ti.value = hhmm;
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
          ti.blur();
        }
      };
      const clear = row.createSpan({ cls: "bt-time-clear" });
      (0, import_obsidian5.setIcon)(clear, "x");
      clear.onmousedown = (e) => {
        e.preventDefault();
        curTime = null;
        timeOpen = false;
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
  });
}

// src/manageView.ts
var import_obsidian6 = require("obsidian");
function iconBtn(parent, icon, label, onClick) {
  const b = parent.createEl("button", { cls: "bt-manage-btn", attr: { "aria-label": label, "data-tooltip-position": "top" } });
  (0, import_obsidian6.setIcon)(b.createSpan(), icon);
  b.onclick = (e) => {
    e.stopPropagation();
    onClick();
  };
  return b;
}
function lockBtn(btn, tip) {
  btn.disabled = true;
  btn.addClass("is-locked");
  btn.setAttr("aria-label", tip);
}
function renderManageInto(c, plugin) {
  c.empty();
  c.addClass("bt-view");
  const root = c.createDiv({ cls: "bt-sizer" });
  const redraw = () => renderManageInto(c, plugin);
  const header = root.createDiv({ cls: "bt-manage-header" });
  header.createEl("h1", { text: plugin.manageSection === "labels" ? t("tab_labels") : t("group_project") });
  const sections = header.createDiv({ cls: "bt-tabs" });
  const mkSection = (id, label) => {
    const b = sections.createEl("button", { cls: "bt-tab" + (plugin.manageSection === id ? " is-active" : ""), text: label });
    b.onclick = () => {
      plugin.manageSection = id;
      renderManageInto(c, plugin);
    };
  };
  mkSection("projects", t("group_project"));
  mkSection("labels", t("tab_labels"));
  if (plugin.manageSection === "labels") {
    addRow(root, t("add_label"), t("placeholder_label"), (v) => plugin.addLabel(v), redraw);
    const labels = plugin.getLabels();
    if (!labels.length) {
      root.createEl("p", { cls: "bt-empty", text: t("manage_empty_labels") });
      return;
    }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const l of labels) labelRow(list, plugin, l, redraw);
    return;
  }
  addRow(
    root,
    t("pick_new_project"),
    t("placeholder_project_name"),
    async (v) => {
      await createProjectNote(plugin.app, plugin.settings, v);
    },
    redraw
  );
  const subtabs = root.createDiv({ cls: "bt-subtabs" });
  const mkTab = (id, label) => {
    const b = subtabs.createEl("button", { cls: "bt-subtab" + (plugin.manageTab === id ? " is-active" : ""), text: label });
    b.onclick = () => {
      plugin.manageTab = id;
      renderManageInto(c, plugin);
    };
  };
  mkTab("active", t("tab_active"));
  mkTab("archive", t("tab_archive"));
  const { active, archived } = listManaged(plugin.app);
  if (plugin.manageTab === "archive") {
    if (!archived.length) {
      root.createEl("p", { cls: "bt-empty", text: t("manage_empty_archive") });
      return;
    }
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const it of archived) archiveRow(list, plugin, it, redraw);
    return;
  }
  if (!active.length) {
    root.createEl("p", { cls: "bt-empty", text: t("manage_empty_active") });
    return;
  }
  const group = (title, items) => {
    if (!items.length) return;
    root.createEl("h6", { cls: "bt-section-title bt-manage-head", text: title });
    const list = root.createDiv({ cls: "bt-manage-list" });
    for (const it of items) activeRow(list, plugin, it, redraw);
  };
  group(t("group_area"), active.filter((p) => p.type === "area"));
  group(t("group_project"), active.filter((p) => p.type === "project"));
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
function activeRow(list, plugin, it, redraw) {
  const row = list.createDiv({ cls: "bt-manage-row" });
  const isArea = it.type === "area";
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(
    actions,
    isArea ? "circle" : it.icon,
    isArea ? t("tip_unmark_area") : t("tip_mark_area"),
    () => void plugin.setProjectArea(it.path, !isArea)
  );
  iconBtn(
    actions,
    it.hidden ? "eye-off" : "eye",
    it.hidden ? t("tip_show_sidebar") : t("tip_hide_sidebar"),
    () => void plugin.setProjectVisible(it.path, it.hidden)
  );
  iconBtn(actions, "pencil", t("btn_rename"), () => startRename(row, plugin, it, redraw));
  const arch = iconBtn(actions, "archive", t("btn_archive"), () => void plugin.archiveProject(it.path, true));
  const del = iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteProject(it.path), redraw));
  if (isArea) {
    lockBtn(arch, t("make_area_hint"));
    lockBtn(del, t("make_area_hint"));
  }
}
function archiveRow(list, plugin, it, redraw) {
  const row = list.createDiv({ cls: "bt-manage-row is-archived" });
  const name = row.createSpan({ cls: "bt-manage-name", text: it.name });
  name.onclick = () => void plugin.activateProject(it.path);
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  iconBtn(actions, "archive-restore", t("btn_restore"), () => void plugin.archiveProject(it.path, false));
  iconBtn(actions, "trash-2", t("btn_delete_forever"), () => confirmInline(actions, t("confirm_delete_forever_q"), () => void plugin.deleteProject(it.path), redraw));
}
function labelRow(list, plugin, l, redraw) {
  const row = list.createDiv({ cls: "bt-manage-row" });
  const name = row.createSpan({ cls: "bt-manage-name", text: "#" + l.name });
  name.onclick = () => void plugin.activateLabel(l.name);
  row.createSpan({ cls: "bt-manage-count", text: String(l.count) });
  const actions = row.createDiv({ cls: "bt-manage-actions" });
  const vis = plugin.isLabelVisible(l.name);
  iconBtn(
    actions,
    vis ? "eye" : "eye-off",
    vis ? t("tip_hide_sidebar") : t("tip_show_sidebar"),
    () => void plugin.setLabelVisible(l.name, !vis)
  );
  iconBtn(actions, "pencil", t("btn_rename"), () => startLabelRename(row, plugin, l, redraw));
  iconBtn(actions, "trash-2", t("btn_delete"), () => confirmInline(actions, t("confirm_delete_q"), () => void plugin.deleteLabel(l.name), redraw));
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
    if (r === null) new import_obsidian6.Notice(t("err_enter_taskname"));
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
var z2 = (n) => String(n).padStart(2, "0");
var toIso = (d) => d.getFullYear() + "-" + z2(d.getMonth() + 1) + "-" + z2(d.getDate());
var addDays = (isoDate, days) => {
  const d = /* @__PURE__ */ new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return toIso(d);
};
function advance(isoDate, rule) {
  const d = /* @__PURE__ */ new Date(isoDate + "T00:00:00");
  if (rule.unit === "day") d.setDate(d.getDate() + rule.n);
  else if (rule.unit === "week") d.setDate(d.getDate() + rule.n * 7);
  else if (rule.unit === "month") d.setMonth(d.getMonth() + rule.n);
  else d.setFullYear(d.getFullYear() + rule.n);
  return toIso(d);
}
function advanceUntilFuture(isoDate, rule, today) {
  let d = advance(isoDate, rule);
  let guard = 0;
  while (d <= today && guard++ < 1e3) d = advance(d, rule);
  return d;
}
var ms = (iso3) => (/* @__PURE__ */ new Date(iso3 + "T00:00:00")).getTime();
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
      nextScheduled = addDays(nextDue, gap);
    }
    return { due: nextDue, scheduled: nextScheduled };
  }
  if (task.scheduled) {
    return { due: null, scheduled: advanceUntilFuture(fromDone ? today : task.scheduled, rule, today) };
  }
  return null;
}

// src/heuteView.ts
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
function renderViewInto(c, plugin, view) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  if (view !== "erledigt") root.createEl("h1", { text: viewTitle(view) });
  if (view === "heute" || view === "demnaechst") {
    const add = root.createDiv({ cls: "bt-add" });
    add.createSpan({ cls: "bt-add-icon" });
    add.createSpan({ text: t("btn_add_task") });
    add.onclick = () => plugin.openNewTask(void 0, void 0, view === "heute");
  }
  const idx = plugin.index;
  if (view === "heute") {
    const overdue = idx.overdue(today), dueToday = idx.dueToday(today);
    const doneToday = idx.done().filter((tk) => tk.completed === today);
    const present = renderedPaths(plugin, [...overdue, ...dueToday, ...doneToday]);
    section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
    section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
    if (doneToday.length) section(root, plugin, t("sec_done"), doneToday, today, true, false, present);
  } else if (view === "demnaechst") {
    const groups = idx.upcomingByDate(today);
    const nd = idx.noDate();
    const present = renderedPaths(plugin, [...groups.flatMap((g) => g.tasks), ...nd]);
    for (const g of groups) section(root, plugin, groupLabel(g.date, today), g.tasks, today, false, false, present);
    if (nd.length) section(root, plugin, t("sec_no_date"), nd, today, false, false, present);
    if (!groups.length && !nd.length) root.createEl("p", { cls: "bt-empty", text: t("empty_nothing_scheduled") });
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
        root.createEl("p", { cls: "bt-empty", text: t("empty_trash") });
        return;
      }
      const bar = root.createDiv({ cls: "bt-trash-actions" });
      const rAll = bar.createEl("button", { cls: "bt-trash-btn" });
      (0, import_obsidian7.setIcon)(rAll.createSpan(), "archive-restore");
      rAll.createSpan({ text: t("trash_restore_all") });
      rAll.onclick = () => void plugin.restoreAllCancelled();
      const emptyWrap = bar.createDiv({ cls: "bt-trash-act" });
      const emptyBtn = emptyWrap.createEl("button", { cls: "bt-trash-btn is-danger" });
      (0, import_obsidian7.setIcon)(emptyBtn.createSpan(), "trash-2");
      emptyBtn.createSpan({ text: t("trash_empty") });
      emptyBtn.onclick = () => confirmInline(emptyWrap, t("confirm_empty_trash_q"), () => void plugin.emptyTrash(), redraw);
      section(root, plugin, t("nav_trash"), items, today, false, true);
    } else {
      const done = idx.done();
      if (!done.length) root.createEl("p", { cls: "bt-empty", text: t("empty_nothing_done") });
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
    root.createEl("p", { cls: "bt-empty", text: t("empty_nothing_recurring") });
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
function addBar(root, plugin, onAdd, section2, linkLabel) {
  const bar = root.createDiv({ cls: "bt-board-bar" });
  const add = bar.createDiv({ cls: "bt-add" });
  add.createSpan({ cls: "bt-add-icon" });
  add.createSpan({ text: t("btn_add_task") });
  add.onclick = onAdd;
  const link = bar.createDiv({ cls: "bt-board-link", attr: { role: "button", tabindex: "0", "aria-label": linkLabel } });
  const lic = link.createSpan({ cls: "bt-board-link-ic" });
  (0, import_obsidian7.setIcon)(lic, "arrow-left-square");
  link.createSpan({ text: linkLabel });
  activate(link, () => void plugin.activateManage(section2));
}
function renderProjectBoardInto(c, plugin, projectPath) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  const name = projectName(projectPath);
  root.createEl("h1", { text: projectDisplayName(name) });
  addBar(root, plugin, () => plugin.openNewTask(name), "projects", t("group_project"));
  const want = name;
  const tasks = plugin.index.all().filter((t2) => t2.project != null && projectName(t2.project) === want);
  const open = tasks.filter((t2) => t2.status === "todo" || t2.status === "doing");
  const overdue = open.filter((t2) => t2.due && t2.due < today).sort(byDue);
  const dueToday = open.filter((t2) => t2.due === today);
  const upcoming = open.filter((t2) => t2.due && t2.due > today).sort(byDue);
  const noDate = open.filter((t2) => !t2.due);
  const done = tasks.filter((t2) => t2.status === "done").sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  if (!tasks.length) {
    root.createEl("p", { cls: "bt-empty", text: t("empty_no_project_tasks") });
    return;
  }
  const present = renderedPaths(plugin, [...open, ...done]);
  if (overdue.length) section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
  if (dueToday.length) section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
  if (upcoming.length) section(root, plugin, t("sec_upcoming"), upcoming, today, false, false, present);
  if (noDate.length) section(root, plugin, t("sec_no_date"), noDate, today, false, false, present);
  if (done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}
function renderLabelBoardInto(c, plugin, label) {
  const today = todayStr();
  c.empty();
  c.addClass("bt-view");
  applyReadableWidth(c, plugin);
  const root = c.createDiv({ cls: "bt-sizer" });
  root.createEl("h1", { cls: "bt-label-title", text: "#" + label });
  addBar(root, plugin, () => plugin.openNewTask(void 0, label), "labels", t("tab_labels"));
  const tasks = plugin.index.all().filter((tk) => tk.labels.includes(label) && !plugin.index.isProjectArchived(tk.project));
  const open = tasks.filter((tk) => tk.status === "todo" || tk.status === "doing");
  const overdue = open.filter((tk) => tk.due && tk.due < today).sort(byDue);
  const dueToday = open.filter((tk) => tk.due === today);
  const upcoming = open.filter((tk) => tk.due && tk.due > today).sort(byDue);
  const noDate = open.filter((tk) => !tk.due);
  const done = tasks.filter((tk) => tk.status === "done").sort((a, b) => (b.completed ?? "").localeCompare(a.completed ?? ""));
  if (!tasks.length) {
    root.createEl("p", { cls: "bt-empty", text: t("empty_no_label_tasks") });
    return;
  }
  const present = renderedPaths(plugin, [...open, ...done]);
  if (overdue.length) section(root, plugin, t("sec_overdue"), overdue, today, false, false, present);
  if (dueToday.length) section(root, plugin, t("sec_today"), dueToday, today, false, false, present);
  if (upcoming.length) section(root, plugin, t("sec_upcoming"), upcoming, today, false, false, present);
  if (noDate.length) section(root, plugin, t("sec_no_date"), noDate, today, false, false, present);
  if (done.length) section(root, plugin, t("sec_done"), done, today, true, false, present);
}
function groupLabel(dateISO, today) {
  const lbl = formatDate(dateISO, today);
  if (lbl === t("date_today") || lbl === t("date_tomorrow") || lbl === t("date_yesterday")) return lbl;
  const wd = new Intl.DateTimeFormat(getLocale(), { weekday: "short" }).format(/* @__PURE__ */ new Date(dateISO + "T00:00:00"));
  return wd + ", " + lbl;
}
function renderedPaths(plugin, anchors) {
  const present = /* @__PURE__ */ new Set();
  const walk = (tk) => {
    if (present.has(tk.path)) return;
    present.add(tk.path);
    for (const kid of plugin.index.children(tk.path)) if (kid.status !== "cancelled") walk(kid);
  };
  for (const a of anchors) walk(a);
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
  if (collapsible) {
    sec.addClass("bt-collapsible");
    const chev = head.createSpan({ cls: "bt-collapse-ic" });
    const apply = () => {
      sec.toggleClass("is-collapsed", plugin.doneCollapsed);
      (0, import_obsidian7.setIcon)(chev, plugin.doneCollapsed ? "chevron-right" : "chevron-down");
    };
    apply();
    head.onclick = () => {
      plugin.doneCollapsed = !plugin.doneCollapsed;
      apply();
    };
  }
}
var LINK_MARKERS = /\[\[|]\(|https?:\/\/|obsidian:\/\//;
function renderLinkedText(el, plugin, text, sourcePath) {
  if (!LINK_MARKERS.test(text) || !plugin.titleRenderComp) {
    el.setText(text);
    return;
  }
  el.addClass("bt-md-inline");
  void import_obsidian7.MarkdownRenderer.render(plugin.app, text, el, sourcePath, plugin.titleRenderComp).catch(() => {
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
      void plugin.app.workspace.openLinkText(href, sourcePath, import_obsidian7.Keymap.isModEvent(e));
    } else {
      const href = a.getAttribute("href");
      if (href) window.open(href);
    }
  });
}
function renderTask(list, plugin, task, today, depth, trash = false) {
  const row = list.createDiv({ cls: "bt-task" + (depth ? " bt-subtask" : "") });
  if (depth) row.style.setProperty("--bt-depth", String(depth));
  row.dataset.path = task.path;
  if (task.status === "done") row.addClass("is-done");
  if (trash) row.addClass("is-cancelled");
  plugin.applyFlash(row, task.path);
  const check = row.createDiv({ cls: "bt-check" });
  if (trash) {
    check.addClass("bt-check-x");
    (0, import_obsidian7.setIcon)(check, "minus");
  } else if (task.status === "done") check.addClass("is-done");
  else if (task.priority === "highest" || task.priority === "high" || task.priority === "medium") check.dataset.prio = task.priority;
  if (!trash) check.onclick = (e) => {
    e.stopPropagation();
    void plugin.toggleDone(task);
  };
  const body = row.createDiv({ cls: "bt-body" });
  renderLinkedText(body.createDiv({ cls: "bt-title" }), plugin, task.title, task.path);
  if (plugin.settings.showDescriptionInList) {
    const desc = plugin.index.descriptionOf(task.path).replace(/\s+/g, " ").trim();
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
    (0, import_obsidian7.setIcon)(ic, "paperclip");
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
  } else if (task.project && !plugin.currentProject && depth === 0) {
    const extras = row.createDiv({ cls: "bt-extras" });
    const name = task.project.split("/").pop().replace(/\.md$/, "");
    const bl = extras.createEl("a", { cls: "bt-backlink", text: "#" + projectDisplayName(name) });
    bl.onclick = (e) => {
      e.stopPropagation();
      openPath(plugin, task.project);
    };
  }
  row.onclick = () => plugin.openEditTask(task);
  if (!trash) for (const kid of plugin.index.children(task.path)) {
    if (kid.status !== "cancelled") renderTask(list, plugin, kid, today, depth + 1);
  }
}
function openPath(plugin, path) {
  const f = plugin.app.vault.getAbstractFileByPath(path);
  if (f instanceof import_obsidian7.TFile) void plugin.app.workspace.getLeaf(false).openFile(f);
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
  (0, import_obsidian7.setIcon)(ic, o.icon);
  if (o.iconColor) ic.setCssStyles({ color: o.iconColor });
  item.createSpan({ cls: "bt-nav-lbl", text: o.label });
  if (o.count) item.createSpan({ cls: "bt-nav-count", text: String(o.count) });
  activate(item, o.onClick);
}
function navHead(c, plugin, id, title, tip, placeholder, redraw, submit) {
  const collapsed = plugin.isNavCollapsed(id);
  const head = c.createDiv({ cls: "bt-nav-head" });
  const toggle = head.createDiv({ cls: "bt-nav-head-toggle", attr: { role: "button", tabindex: "0", "aria-expanded": String(!collapsed) } });
  toggle.createSpan({ cls: "bt-nav-head-lbl", text: title });
  activate(toggle, () => void plugin.toggleNavSection(id));
  const add = head.createDiv({ cls: "bt-nav-head-add", attr: { role: "button", tabindex: "0", "aria-label": tip, "data-tooltip-position": "top" } });
  (0, import_obsidian7.setIcon)(add, "plus");
  activate(add, () => {
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
  const chev = head.createDiv({ cls: "bt-nav-head-chevron", attr: { "aria-hidden": "true" } });
  (0, import_obsidian7.setIcon)(chev, collapsed ? "chevron-right" : "chevron-down");
  chev.onclick = () => void plugin.toggleNavSection(id);
  return collapsed;
}
function renderNavInto(c, plugin) {
  c.empty();
  c.addClass("bt-nav");
  const redraw = () => renderNavInto(c, plugin);
  const { eingang, bereiche, projekte } = listProjectsAndAreas(plugin.app);
  navItem(c, { cls: "bt-nav-add-task", icon: "sparkles", label: t("btn_add_task"), onClick: () => plugin.openQuickAdd() });
  navItem(c, { cls: "bt-nav-search", icon: "search", label: t("nav_search"), onClick: () => plugin.openSearch() });
  if (eingang && !eingang.hidden) {
    navItem(c, {
      cls: "bt-nav-inbox",
      icon: eingang.icon,
      iconColor: eingang.color,
      label: projectDisplayName(eingang.name),
      count: plugin.index.byProject(eingang.path).length,
      active: plugin.currentProject === eingang.path,
      onClick: () => void plugin.activateProject(eingang.path)
    });
  }
  for (const id of VIEW_IDS) {
    const active = !plugin.currentProject && !plugin.currentLabel && !plugin.manageOpen && plugin.currentView === id;
    navItem(c, { cls: "bt-nav-" + id, icon: VIEW_ICON[id], label: viewTitle(id), count: navCount(plugin, id), active, onClick: () => void plugin.activateView(id) });
  }
  const projItems = (items, cls) => {
    for (const p of items.filter((x) => !x.hidden)) {
      navItem(c, {
        cls,
        icon: p.icon,
        iconColor: p.color,
        label: p.name,
        count: plugin.index.byProject(p.path).length,
        active: plugin.currentProject === p.path,
        onClick: () => void plugin.activateProject(p.path)
      });
    }
  };
  const labelsCollapsed = navHead(c, plugin, "labels", t("tab_labels"), t("add_label"), t("placeholder_label"), redraw, async (v) => {
    const nu = normalizeLabel(v);
    const ok = await plugin.addLabel(v);
    if (ok && nu) await plugin.setLabelVisible(nu, true);
  });
  if (!labelsCollapsed) for (const name of plugin.getVisibleLabels()) {
    const count = plugin.index.byLabel(name).length;
    navItem(c, { cls: "bt-nav-label", icon: "hash", label: name, count, active: plugin.currentLabel === name, onClick: () => void plugin.activateLabel(name) });
  }
  const areasCollapsed = navHead(
    c,
    plugin,
    "areas",
    t("group_area"),
    t("pick_new_area"),
    t("placeholder_area_name"),
    redraw,
    (v) => plugin.createProject(v, true)
  );
  if (!areasCollapsed) projItems(bereiche, "bt-nav-area");
  const projCollapsed = navHead(
    c,
    plugin,
    "projects",
    t("group_project"),
    t("pick_new_project"),
    t("placeholder_project_name"),
    redraw,
    (v) => plugin.createProject(v)
  );
  if (!projCollapsed) projItems(projekte, "bt-nav-project");
  navItem(c, { cls: "bt-nav-manage", icon: "list-plus", label: t("manage_full"), active: plugin.manageOpen, onClick: () => void plugin.activateManage() });
}
function navCount(plugin, id) {
  const today = todayStr();
  if (id === "heute") return plugin.index.overdue(today).length + plugin.index.dueToday(today).length;
  if (id === "demnaechst") return plugin.index.upcoming(today).length;
  if (id === "wiederkehrend") return plugin.index.open().filter((tk) => tk.recurrence).length;
  return 0;
}
var MainView = class extends import_obsidian7.ItemView {
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
    if (this.renderComp) this.removeChild(this.renderComp);
    this.renderComp = this.addChild(new import_obsidian7.Component());
    this.plugin.titleRenderComp = this.renderComp;
    if (this.plugin.manageOpen) renderManageInto(this.contentEl, this.plugin);
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
var NavView = class extends import_obsidian7.ItemView {
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
    if (this.contentEl) renderNavInto(this.contentEl, this.plugin);
  }
};

// src/taskModal.ts
var import_obsidian9 = require("obsidian");

// src/quickEntry.ts
var z3 = (n) => String(n).padStart(2, "0");
var iso2 = (d) => d.getFullYear() + "-" + z3(d.getMonth() + 1) + "-" + z3(d.getDate());
var addDays2 = (d, n) => {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
};
var nextWeekday = (from, target) => {
  let off = (target - from.getDay() + 7) % 7;
  if (off === 0) off = 7;
  return addDays2(from, off);
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
function parseQuickEntry(raw) {
  let text = " " + (raw || "") + " ";
  const tags = [];
  const tagRe = /(?:^|\s)#([\p{L}\p{N}_/-]+)/gu;
  for (const m of text.matchAll(tagRe)) tags.push(m[1]);
  text = text.replace(tagRe, " ");
  const today = /* @__PURE__ */ new Date();
  let faellig = "";
  const grab = (rx, fn) => {
    if (faellig) return;
    const m = text.match(rx);
    if (!m) return;
    const d = fn(m);
    if (d && !isNaN(d.getTime())) {
      faellig = iso2(d);
      text = text.replace(m[0], " ");
    }
  };
  grab(re("heute|today"), () => today);
  grab(re("\xFCbermorgen|day\\s+after\\s+tomorrow"), () => addDays2(today, 2));
  grab(re("morgen|tomorrow"), () => addDays2(today, 1));
  grab(re("in\\s+(\\d+)\\s+(?:tagen|days?)"), (m) => addDays2(today, parseInt(m[1], 10)));
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
  return { title: text.replace(/\s{2,}/g, " ").trim(), faellig, time, tags: [...new Set(tags)], priority };
}

// src/searchModal.ts
var import_obsidian8 = require("obsidian");
var projectBase = (path) => path.split("/").pop().replace(/\.md$/, "");
function taskSearchText(task) {
  const proj = task.project ? projectBase(task.project) : "";
  return [task.title, proj, ...task.labels].join(" ");
}
function renderTaskSuggestion(match, el) {
  const task = match.item;
  el.addClass("bt-search-item");
  el.createDiv({ cls: "bt-search-title", text: task.title });
  const meta = el.createDiv({ cls: "bt-search-meta" });
  if (task.status === "done") meta.createSpan({ cls: "bt-search-tag is-done", text: t("sec_done") });
  if (task.project) meta.createSpan({ cls: "bt-search-tag", text: "#" + projectBase(task.project) });
  if (task.due) meta.createSpan({ cls: "bt-search-tag", text: formatDate(task.due, todayStr()) });
  for (const l of task.labels) meta.createSpan({ cls: "bt-search-tag", text: "#" + l });
}
var TaskSearchModal = class extends import_obsidian8.FuzzySuggestModal {
  constructor(plugin) {
    super(plugin.app);
    this.plugin = plugin;
    this.setPlaceholder(t("search_placeholder"));
  }
  getItems() {
    return this.plugin.index.all().filter((tk) => tk.status !== "cancelled");
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
var TaskPickerModal = class extends import_obsidian8.FuzzySuggestModal {
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

// src/taskModal.ts
var baseName2 = (path) => path.split("/").pop().replace(/\.md$/, "");
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
var TaskModal = class _TaskModal extends import_obsidian9.Modal {
  // true sobald geschrieben -> kein Doppel-Speichern
  /** opts.hideProjekt blendet das Projekt-Chip aus (Unteraufgaben-Modus – die
   *  Unteraufgabe erbt Projekt der Hauptaufgabe). opts.parent = Eltern-Basename. */
  constructor(plugin, existing, defaultProject, opts = {}) {
    super(plugin.app);
    this.plugin = plugin;
    this.existing = existing;
    this.opts = opts;
    this.descInput = null;
    this.descDirty = false;
    // Büroklammer-Chip, der die Detail-Sektion toggelt
    this.logInput = null;
    this.logComp = null;
    this.logEntries = [];
    this.persistChain = Promise.resolve();
    this.duePinned = false;
    // true sobald Datum manuell gesetzt -> NL überschreibt nicht mehr
    this.cleanTitle = "";
    // Titel ohne erkannte Datum-/Label-Token
    this.parsedLabels = [];
    // aktuell aus dem Titel geparste #Labels (wird bei jedem Parse ersetzt)
    this.discarding = false;
    // true = bewusst verwerfen („Cancel") -> kein Auto-Speichern
    this.persisted = false;
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
      project: existing.project ? baseName2(existing.project) : null,
      parent: existing.parent ? baseName2(existing.parent) : null,
      labels: [...existing.labels],
      reminders: [...existing.reminders ?? []]
    } : { title: opts.defaultTitle ?? "", priority: "normal", labels: opts.defaultLabel ? [opts.defaultLabel] : [], reminders: [], due: opts.defaultToday ? todayIso() : null, project: defaultProject ?? "Inbox", recurBasis: "due" };
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
      this.descDirty = true;
      this.f.description = desc.value;
      this.growDesc();
    };
    this.descInput = desc;
    window.setTimeout(() => this.growDesc(), 0);
    this.chipBar = contentEl.createDiv({ cls: "bt-chips" });
    this.detailsWrap = contentEl.createDiv({ cls: "bt-details" });
    this.logWrap = this.detailsWrap.createDiv({ cls: "bt-log bt-hidden" });
    this.applyParse();
    this.renderChips();
    this.renderDetailLog();
    this.syncDetails();
    if (this.existing) {
      const file = this.app.vault.getAbstractFileByPath(this.existing.path);
      if (file instanceof import_obsidian9.TFile) {
        void readDescription(this.app, file).then((d) => {
          if (this.descDirty) return;
          this.f.description = d;
          if (this.descInput) {
            this.descInput.value = d;
            this.growDesc();
          }
        });
        void readLog(this.app, file).then((entries) => {
          this.logEntries = entries;
          if (entries.length) this.logWrap.removeClass("bt-hidden");
          this.renderDetailLog();
          this.syncDetails();
        });
      }
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
    this.logComp?.unload();
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
  renderChips() {
    const bar = this.chipBar;
    bar.empty();
    this.addChip(
      bar,
      "calendar",
      this.f.due ? formatDateTime(combineDT(this.f.due, this.f.dueTime)) + (this.f.duration ? " \xB7 " + formatDuration(this.f.duration) : "") : t("chip_date"),
      !!this.f.due,
      (el) => this.openDate(el, "due"),
      () => {
        this.f.due = null;
        this.f.dueTime = null;
        this.f.duration = null;
        this.duePinned = true;
        this.renderChips();
      }
    );
    this.addChip(
      bar,
      "flag",
      this.f.priority && this.f.priority !== "normal" ? t(PRIO_KEY[this.f.priority]) : t("chip_priority"),
      !!this.f.priority && this.f.priority !== "normal",
      (el) => this.openPrio(el),
      () => {
        this.f.priority = "normal";
        this.renderChips();
      }
    );
    this.addChip(
      bar,
      "hash",
      this.f.labels && this.f.labels.length ? this.f.labels : t("chip_label"),
      !!(this.f.labels && this.f.labels.length),
      (el) => this.openLabels(el),
      () => {
        this.f.labels = [];
        this.renderChips();
      }
    );
    this.addChip(
      bar,
      "refresh-ccw",
      this.f.recurrence ? recurLabel(this.f.recurrence, this.f.recurBasis) : t("chip_recurrence"),
      !!this.f.recurrence,
      (el) => this.openRecur(el),
      () => {
        this.f.recurrence = null;
        this.renderChips();
      }
    );
    this.addChip(
      bar,
      "clock",
      this.f.scheduled ? formatDateTime(combineDT(this.f.scheduled, this.f.scheduledTime)) : t("chip_deadline"),
      !!this.f.scheduled,
      (el) => this.openDate(el, "scheduled"),
      () => {
        this.f.scheduled = null;
        this.f.scheduledTime = null;
        this.renderChips();
      }
    );
    this.addChip(
      bar,
      "alarm-clock",
      this.reminderChipLabel(),
      this.f.reminders.length > 0,
      (el) => this.openReminders(el),
      () => {
        this.f.reminders = [];
        this.renderChips();
      }
    );
    if (!this.opts.parent) {
      this.addChip(
        bar,
        "corner-down-right",
        this.parentTitle() ?? t("chip_parent"),
        !!this.f.parent,
        () => this.openParent(),
        () => {
          this.f.parent = null;
          this.renderChips();
        },
        { truncate: !!this.f.parent }
      );
    }
    const detailsOpen = !this.logWrap.hasClass("bt-hidden");
    const details = bar.createEl("button", { cls: "bt-chip bt-chip-details" + (detailsOpen ? " is-open" : "") });
    if (this.plugin.settings.chipsIconsOnly) {
      details.setAttribute("aria-label", t("details"));
      details.setAttribute("data-tooltip-position", "top");
    }
    const dIc = details.createSpan({ cls: "bt-chip-ic" });
    (0, import_obsidian9.setIcon)(dIc, "paperclip");
    details.createSpan({ cls: "bt-chip-lbl", text: t("details") });
    details.onclick = (e) => {
      e.stopPropagation();
      this.toggleDetails();
    };
    this.detailsChip = details;
    if (this.existing) {
      const acts = bar.createEl("button", { cls: "bt-chip bt-chip-actions", attr: { "aria-label": t("task_actions"), "data-tooltip-position": "top" } });
      (0, import_obsidian9.setIcon)(acts.createSpan({ cls: "bt-chip-ic" }), "plus");
      acts.onclick = (e) => {
        e.stopPropagation();
        this.openActionsMenu(acts);
      };
    }
  }
  /** Chip-Text für Erinnerungen: 0 → „Erinnerung", 1 → deren Text, n → „n Erinnerungen". */
  reminderChipLabel() {
    const n = this.f.reminders.length;
    if (n === 0) return t("chip_reminder");
    if (n === 1) return formatReminder(this.f.reminders[0]);
    return t("rem_count", n);
  }
  /** Erinnerungs-Popover (Todoist-Stil): bestehende Liste mit ×, relative Presets
   *  („Vor der Aufgabe", nur mit Uhrzeit) und ein absoluter „Datum & Uhrzeit"-Eintrag. */
  openReminders(anchor) {
    const PRESETS = ["-0m", "-10m", "-30m", "-1h", "-1d"];
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-rem");
      const add = (raw) => {
        if (!this.f.reminders.includes(raw)) this.f.reminders = [...this.f.reminders, raw];
        this.renderChips();
      };
      const render = () => {
        pop.empty();
        pop.createDiv({ cls: "bt-pop-head", text: t("reminders_title") });
        for (const raw of this.f.reminders) {
          const row = pop.createDiv({ cls: "bt-row bt-rem-item" });
          const ic = row.createSpan({ cls: "bt-row-ic" });
          (0, import_obsidian9.setIcon)(ic, "alarm-clock");
          row.createSpan({ cls: "bt-row-lbl", text: formatReminder(raw) });
          const x = row.createSpan({ cls: "bt-rem-x" });
          (0, import_obsidian9.setIcon)(x, "x");
          x.onclick = (e) => {
            e.stopPropagation();
            this.f.reminders = this.f.reminders.filter((r) => r !== raw);
            this.renderChips();
            render();
          };
        }
        if (this.f.reminders.length) pop.createDiv({ cls: "bt-rem-sep" });
        pop.createDiv({ cls: "bt-pop-sub", text: t("rem_tab_relative") });
        if (!this.f.dueTime) {
          pop.createDiv({ cls: "bt-rem-hint", text: t("rem_need_time") });
        } else {
          for (const raw of PRESETS) {
            const row = popRow(pop, "clock", formatReminder(raw), () => {
              add(raw);
              render();
            });
            if (this.f.reminders.includes(raw)) row.addClass("is-disabled");
          }
        }
        pop.createDiv({ cls: "bt-rem-sep" });
        popRow(pop, "calendar-clock", t("rem_tab_absolute"), () => {
          close();
          openDatePicker(anchor, "", (iso3) => {
            if (iso3) add(iso3);
          });
        });
      };
      render();
    });
  }
  /** „+"-Aktionsmenü zur Aufgabe (Edit-Modus), thematisch gruppiert mit Trennlinien. */
  openActionsMenu(anchor) {
    const menu = new import_obsidian9.Menu();
    menu.addItem((i) => i.setTitle(t("menu_create_subtask")).setIcon("corner-down-right").onClick(() => this.addSubtask()));
    if (this.parentTask()) {
      menu.addItem((i) => i.setTitle(t("menu_show_parent")).setIcon("corner-left-up").onClick(() => this.showParent()));
    }
    menu.addItem((i) => i.setTitle(t("menu_duplicate")).setIcon("copy").onClick(() => void this.duplicate()));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle(t("menu_copy_link")).setIcon("link").onClick(() => this.copyLink()));
    menu.addItem((i) => i.setTitle(t("menu_open_obsidian")).setIcon("file-text").onClick(() => this.openInObsidian()));
    menu.addItem((i) => i.setTitle(t("menu_open_editor")).setIcon("external-link").onClick(() => this.openInEditor()));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle(t("menu_print")).setIcon("printer").onClick(() => this.printTask()));
    menu.addSeparator();
    menu.addItem((i) => i.setTitle(t("btn_delete")).setIcon("trash-2").setWarning(true).onClick(() => void this.remove()));
    const r = anchor.getBoundingClientRect();
    menu.showAtPosition({ x: r.left, y: r.bottom + 4 });
  }
  /** Aufgabe duplizieren: aktuellen Stand sichern und als neue Aufgabe („(Kopie)") anlegen. */
  async duplicate() {
    const title = this.titleValue();
    if (!title) {
      new import_obsidian9.Notice(t("err_enter_taskname"));
      return;
    }
    await this.persist();
    const file = await createTaskNote(this.app, this.plugin.settings, {
      ...this.f,
      title: title + " " + t("copy_suffix"),
      status: "todo",
      parent: this.f.parent ?? this.opts.parent ?? null
    });
    if (this.logEntries.length) await writeLog(this.app, file, this.logEntries);
    new import_obsidian9.Notice(t("msg_duplicated"));
    this.close();
  }
  /** Obsidian-Deeplink (obsidian://) zur Aufgabe in die Zwischenablage kopieren. */
  copyLink() {
    if (!this.existing) return;
    const vault = encodeURIComponent(this.app.vault.getName());
    const file = encodeURIComponent(this.existing.path.replace(/\.md$/, ""));
    void navigator.clipboard.writeText(`obsidian://open?vault=${vault}&file=${file}`);
    new import_obsidian9.Notice(t("msg_link_copied"));
  }
  /** Aufgaben-Notiz in einem neuen Obsidian-Tab öffnen. */
  openInObsidian() {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (file instanceof import_obsidian9.TFile) {
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
    if (willOpen) window.setTimeout(() => this.logInput?.focus(), 0);
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
    return this.plugin.index.all().find((tk) => baseName2(tk.path) === this.f.parent) ?? null;
  }
  /** Titel der aktuell gewählten Elternaufgabe (für das Chip-Label) oder null. */
  parentTitle() {
    if (!this.f.parent) return null;
    return this.parentTask()?.title ?? this.f.parent;
  }
  /** Elternaufgabe in ihrer Liste anzeigen (wie die Lupe in der Suche: hinspringen + kurz
   *  hervorheben). Modal schließen, damit die hervorgehobene Zeile sichtbar wird. */
  showParent() {
    const parent = this.parentTask();
    if (!parent) {
      new import_obsidian9.Notice(t("err_parent_not_found"));
      return;
    }
    this.close();
    void this.plugin.revealTask(parent);
  }
  /** Aufgaben-Picker öffnen und die gewählte Aufgabe als Elternaufgabe setzen. Sich selbst
   *  und alle Nachfahren ausschließen (kein Zyklus); Projekt vom Parent übernehmen. */
  openParent() {
    const exclude = /* @__PURE__ */ new Set();
    if (this.existing) {
      exclude.add(this.existing.path);
      for (const d of this.plugin.index.descendants(this.existing.path)) exclude.add(d.path);
    }
    const items = this.plugin.index.all().filter((tk) => tk.status !== "cancelled" && !exclude.has(tk.path));
    new TaskPickerModal(this.app, items, t("pick_parent"), (parent) => {
      this.f.parent = baseName2(parent.path);
      if (parent.project) this.f.project = baseName2(parent.project);
      this.renderChips();
      if (!this.opts.hideProjekt) this.renderProjekt();
    }).open();
  }
  addChip(bar, icon, label, isSet, onClick, onClear, opts = {}) {
    const chip = bar.createEl("button", { cls: "bt-chip" + (isSet ? " is-set" : "") + (opts.truncate ? " bt-chip-truncate" : "") });
    if (this.plugin.settings.chipsIconsOnly && !isSet) {
      chip.setAttribute("aria-label", Array.isArray(label) ? label.join(", ") : label);
      chip.setAttribute("data-tooltip-position", "top");
    }
    const ic = chip.createSpan({ cls: "bt-chip-ic" });
    (0, import_obsidian9.setIcon)(ic, icon);
    const lbl = chip.createSpan({ cls: "bt-chip-lbl" });
    if (Array.isArray(label)) label.forEach((p, i) => {
      if (i) lbl.createSpan({ cls: "bt-chip-sep", text: " | " });
      lbl.appendText(p);
    });
    else lbl.setText(label);
    if (opts.truncate) {
      const full = Array.isArray(label) ? label.join(", ") : label;
      if (lbl.scrollWidth > lbl.clientWidth) {
        chip.addClass("is-faded");
        chip.setAttribute("aria-label", full);
        chip.setAttribute("data-tooltip-position", "top");
      }
    }
    chip.onclick = (e) => {
      e.stopPropagation();
      onClick(chip);
    };
    if (isSet) {
      const x = chip.createSpan({ cls: "bt-chip-x" });
      (0, import_obsidian9.setIcon)(x, "x");
      x.onclick = (e) => {
        e.stopPropagation();
        onClear();
      };
    }
  }
  // ── Picker ──
  openDate(anchor, field) {
    const timeField = field === "due" ? "dueTime" : "scheduledTime";
    const d = this.f[field];
    const value = d ? combineDT(d, this.f[timeField]) : "";
    const dur = field === "due" ? { value: this.f.duration ?? null, onChange: (d2) => {
      this.f.duration = d2;
      this.renderChips();
    } } : void 0;
    openDatePicker(anchor, value, (v) => {
      this.f[field] = v ? dateOf(v) : null;
      this.f[timeField] = v ? timeOf(v) : null;
      if (field === "due") this.duePinned = true;
      this.renderChips();
    }, dur);
  }
  openPrio(anchor) {
    openPopover(anchor, (pop, close) => {
      for (const p of PRIOS) {
        popRow(pop, "flag", t(p.key), () => {
          this.f.priority = p.value;
          this.renderChips();
          close();
        }, this.f.priority === p.value, p.color);
      }
    });
  }
  openRecur(anchor) {
    openPopover(anchor, (pop, close) => {
      const render = () => {
        pop.empty();
        popRow(pop, "x", t("recur_none"), () => {
          this.f.recurrence = null;
          this.renderChips();
          close();
        }, !this.f.recurrence);
        for (const r of RECUR) {
          popRow(pop, "refresh-ccw", t(r.key), () => {
            this.f.recurrence = r.val;
            this.renderChips();
            render();
          }, this.f.recurrence === r.val);
        }
        if (this.f.recurrence) {
          pop.createDiv({ cls: "bt-pop-head", text: t("recur_basis") });
          popRow(
            pop,
            this.f.recurBasis === "done" ? "check-circle-2" : "circle",
            t("recur_when_done"),
            () => {
              this.f.recurBasis = this.f.recurBasis === "done" ? "due" : "done";
              this.renderChips();
              render();
            },
            this.f.recurBasis === "done"
          );
        }
      };
      render();
    });
  }
  /** Label-Picker 1:1 zu BeautyTasks buildTagPicker: Eingabe oben (filtert + Enter legt
   *  neu an), darunter Liste mit #-Icon, Name und rechtsbündiger Häkchen-Box. */
  openLabels(anchor) {
    const known = [.../* @__PURE__ */ new Set([...this.plugin.index.all().flatMap((task) => task.labels), ...this.plugin.settings.knownLabels])];
    openPopover(anchor, (pop) => {
      pop.addClass("bt-tags");
      const add = pop.createEl("input", { type: "text", cls: "bt-tag-add", attr: { placeholder: t("placeholder_label") } });
      const list = pop.createDiv({ cls: "bt-tag-list" });
      const render = () => {
        list.empty();
        const f = add.value.trim().toLowerCase().replace(/^#/, "");
        const all = [.../* @__PURE__ */ new Set([...known, ...this.f.labels])].sort((a, b) => a.localeCompare(b, "de"));
        for (const tag of all) {
          if (f && !tag.toLowerCase().includes(f)) continue;
          const on = this.f.labels.includes(tag);
          const r = list.createDiv({ cls: "bt-row bt-tag-row" + (on ? " is-active" : "") });
          const ic = r.createSpan({ cls: "bt-row-ic" });
          (0, import_obsidian9.setIcon)(ic, "hash");
          r.createSpan({ cls: "bt-row-lbl", text: tag });
          const box = r.createSpan({ cls: "bt-tag-box" });
          if (on) (0, import_obsidian9.setIcon)(box, "check");
          r.onclick = () => {
            this.f.labels = on ? this.f.labels.filter((x) => x !== tag) : [...this.f.labels, tag];
            this.renderChips();
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
        if (!this.f.labels.includes(slug)) this.f.labels.push(slug);
        add.value = "";
        this.renderChips();
        render();
      };
      window.setTimeout(() => add.focus(), 0);
    });
  }
  renderProjekt() {
    this.projektBtn.empty();
    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
    const all = [eingang, ...bereiche, ...projekte].filter(Boolean);
    const sel = all.find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    (0, import_obsidian9.setIcon)(ic, sel?.icon ?? (this.f.project ? "folder" : "inbox"));
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: this.f.project ? projectDisplayName(this.f.project) : t("no_project") });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" });
    (0, import_obsidian9.setIcon)(car, "chevron-down");
  }
  openProject(anchor) {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      popRow(pop, "plus", t("pick_new_project"), () => this.startNewProject(pop, close)).addClass("bt-row-action");
      const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name) => {
        this.f.project = name;
        this.renderProjekt();
        close();
      };
      if (eingang) popRow(pop, eingang.icon, projectDisplayName(eingang.name), () => pick(eingang.name), this.f.project === eingang.name, eingang.color ?? void 0);
      const group = (title, items) => {
        if (!items.length) return;
        pop.createDiv({ cls: "bt-pop-head", text: title });
        for (const it of items) popRow(pop, it.icon, it.name, () => pick(it.name), this.f.project === it.name, it.color ?? void 0);
      };
      group(t("group_area"), bereiche);
      group(t("group_project"), projekte);
    });
  }
  startNewProject(pop, close) {
    pop.empty();
    const inp = pop.createEl("input", { type: "text", cls: "bt-pop-input", attr: { placeholder: t("placeholder_project_name") } });
    inp.onkeydown = async (e) => {
      if (e.key !== "Enter") return;
      e.preventDefault();
      const name = inp.value.trim();
      if (!name) return;
      const base = await createProjectNote(this.app, this.plugin.settings, name);
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
  // ── Details: Kommentar-Log (Timeline + Composer) ──
  logSrc() {
    return this.existing?.path ?? this.plugin.settings.itemsFolder + "/_.md";
  }
  /** Timeline der Einträge (Zeitstempel + Markdown + Bearbeiten/Löschen) + Composer. */
  renderDetailLog() {
    const wrap = this.logWrap;
    wrap.empty();
    this.logComp?.unload();
    this.logComp = new import_obsidian9.Component();
    this.logComp.load();
    const src = this.logSrc();
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
          this.close();
        }
      }
    });
    this.logEntries.forEach((entry, idx) => {
      const row = list.createDiv({ cls: "bt-log-entry" });
      const head = row.createDiv({ cls: "bt-log-head" });
      head.createDiv({ cls: "bt-log-ts", text: formatLogTime(entry.ts) || "\u2014" });
      const content = row.createDiv({ cls: "bt-log-content" });
      this.renderEntry(content, entry, src);
      const acts = head.createDiv({ cls: "bt-log-actions" });
      const ed = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("log_edit") } });
      (0, import_obsidian9.setIcon)(ed.createSpan(), "pencil");
      ed.onclick = () => this.editEntry(idx, content, src);
      const del = acts.createEl("button", { cls: "bt-log-act", attr: { "aria-label": t("btn_delete") } });
      (0, import_obsidian9.setIcon)(del.createSpan(), "trash-2");
      del.onclick = () => {
        this.logEntries.splice(idx, 1);
        this.renderDetailLog();
        void this.persistLog();
      };
    });
    const comp = wrap.createDiv({ cls: "bt-log-composer" });
    const inp = comp.createEl("textarea", { cls: "bt-log-input", attr: { placeholder: t("log_placeholder"), rows: "1" } });
    this.logInput = inp;
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
    (0, import_obsidian9.setIcon)(attach.createSpan(), "paperclip");
    attach.onclick = () => this.pickAttachment();
    const linkBtn = cActs.createEl("button", { cls: "bt-log-attach", attr: { "aria-label": t("log_link") } });
    (0, import_obsidian9.setIcon)(linkBtn.createSpan(), "link");
    linkBtn.onclick = () => this.pickNote();
    const add = cActs.createEl("button", { cls: "bt-log-add", attr: { "aria-label": t("log_add") } });
    (0, import_obsidian9.setIcon)(add.createSpan(), "send-horizontal");
    add.onclick = () => this.addEntry();
    window.setTimeout(() => {
      list.scrollTop = list.scrollHeight;
    }, 0);
  }
  renderEntry(el, entry, src) {
    el.empty();
    void Promise.resolve(import_obsidian9.MarkdownRenderer.render(this.app, entry.body || "", el, src, this.logComp)).catch((e) => console.error("bt-log render", e));
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
        new import_obsidian9.Notice(t("msg_image_copied"));
      } catch (err) {
        console.error("BeautyTasks: copy image failed", err);
        new import_obsidian9.Notice(t("msg_image_copy_failed"));
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
        (0, import_obsidian9.setIcon)(b, icon);
        b.onclick = (e) => {
          e.stopPropagation();
          go(d);
        };
      };
      nav("bt-lb-prev", "chevron-left", t("lb_prev"), -1);
      nav("bt-lb-next", "chevron-right", t("lb_next"), 1);
    }
    const copyBtn = ov.createEl("button", { cls: "bt-lb-copy", attr: { "aria-label": t("lb_copy") } });
    (0, import_obsidian9.setIcon)(copyBtn, "copy");
    copyBtn.onclick = (e) => {
      e.stopPropagation();
      void copyCurrent();
    };
    const closeBtn = ov.createEl("button", { cls: "bt-lb-close", attr: { "aria-label": t("btn_close") } });
    (0, import_obsidian9.setIcon)(closeBtn, "x");
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
    const v = (this.logInput?.value || "").trim();
    if (!v) return;
    this.logEntries.push({ ts: nowLogTs(), body: v });
    this.logWrap.removeClass("bt-hidden");
    this.syncDetails();
    this.renderDetailLog();
    void this.persistLog();
  }
  editEntry(idx, contentEl, _src) {
    const entry = this.logEntries[idx];
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
      if (!entry.body) this.logEntries.splice(idx, 1);
      this.renderDetailLog();
      void this.persistLog();
    };
    const save = acts.createEl("button", { cls: "bt-log-edit-btn mod-cta", text: t("log_update") });
    save.onclick = doSave;
    const cancel = acts.createEl("button", { cls: "bt-log-edit-btn", text: t("btn_cancel") });
    cancel.onclick = () => this.renderDetailLog();
    ta.onkeydown = (e) => {
      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        doSave();
      } else if (e.key === "Escape") {
        e.preventDefault();
        this.renderDetailLog();
      }
    };
  }
  /** Sofort-Speichern – unabhängig vom Modal-Save. Bei neuen Aufgaben (kein File)
   *  wird der Log erst beim Speichern in den Body geschrieben. Serialisiert (Kette). */
  async persistLog() {
    if (!this.existing) return;
    const file = this.app.vault.getAbstractFileByPath(this.existing.path);
    if (!(file instanceof import_obsidian9.TFile)) return;
    this.persistChain = this.persistChain.then(async () => {
      try {
        await writeLog(this.app, file, this.logEntries);
      } catch (e) {
        console.error("bt-log persist", e);
        new import_obsidian9.Notice(t("err_detail_save"));
      }
    });
    return this.persistChain;
  }
  // ── Anhänge ──
  insertInComposer(text) {
    const el = this.logInput;
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
      let p = (0, import_obsidian9.normalizePath)(dir + "/" + name);
      let i = 1;
      while (this.app.vault.getAbstractFileByPath(p)) p = (0, import_obsidian9.normalizePath)(dir + "/" + base + "-" + i++ + ext);
      const tfile = await this.app.vault.createBinary(p, buf);
      const isImage = IMG.includes((name.split(".").pop() || "").toLowerCase());
      const link = this.app.fileManager.generateMarkdownLink(tfile, this.logSrc());
      this.logWrap.removeClass("bt-hidden");
      this.syncDetails();
      this.insertInComposer((isImage ? "!" : "") + link + " ");
      new import_obsidian9.Notice(t("msg_attached", tfile.name));
    } catch (err) {
      console.error("bt-attachment", err);
      new import_obsidian9.Notice(t("msg_attach_failed", String(err?.message || err)));
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
    const src = this.logSrc();
    const insert = (f) => {
      this.logWrap.removeClass("bt-hidden");
      this.syncDetails();
      this.insertInComposer(app.fileManager.generateMarkdownLink(f, src) + " ");
    };
    class NotePicker extends import_obsidian9.FuzzySuggestModal {
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
  // ── Speichern / Löschen ──
  /** Aktueller (bereinigter) Titel. */
  titleValue() {
    return (this.cleanTitle || this.f.title).trim();
  }
  /** Explizites Speichern (Button/Enter): bei leerem Titel Hinweis + offen bleiben. */
  async save() {
    if (!this.titleValue()) {
      new import_obsidian9.Notice(t("err_enter_taskname"));
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
      if (file instanceof import_obsidian9.TFile) {
        await this.app.fileManager.processFrontMatter(file, (fm) => {
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
        });
        if (title !== this.existing.title) {
          await this.app.vault.process(file, (c) => c.replace(/^#\s+.*$/m, () => "# " + title));
        }
        if (this.f.description !== void 0) await writeDescription(this.app, file, this.f.description ?? "");
      }
    } else {
      const file = await createTaskNote(this.app, this.plugin.settings, { ...this.f, title, parent: this.f.parent ?? this.opts.parent ?? null });
      if (this.logEntries.length) await writeLog(this.app, file, this.logEntries);
    }
  }
  async remove() {
    if (!this.existing) return;
    this.discarding = true;
    await this.plugin.cancelTask(this.existing);
    this.close();
  }
};

// src/quickAddModal.ts
var import_obsidian10 = require("obsidian");
var PRIO_NUM = { highest: 1, high: 2, medium: 3, normal: null, low: null, lowest: null };
var QuickAddModal = class extends import_obsidian10.Modal {
  constructor(plugin, project) {
    super(plugin.app);
    this.plugin = plugin;
    this.cleanTitle = "";
    this.duePinned = false;
    // Datum manuell gesetzt/geleert -> Parser überschreibt nicht mehr
    this.parsedLabels = [];
    this.f = { title: "", project: project ?? "Inbox", due: null, dueTime: null, priority: "normal", labels: [] };
  }
  onOpen() {
    const { contentEl, modalEl } = this;
    modalEl.addClass("bt-task-modal");
    modalEl.addClass("bt-quickadd");
    contentEl.empty();
    const input = contentEl.createEl("input", { type: "text", cls: "bt-titel", attr: { placeholder: t("qa_placeholder") } });
    input.oninput = () => {
      this.f.title = input.value;
      this.parse();
      this.renderChips();
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
    (0, import_obsidian10.setIcon)(full, "maximize-2");
    full.onclick = () => this.openInFull();
    const submit = right.createEl("button", { cls: "mod-cta bt-qa-submit", attr: { "aria-label": t("btn_add_task"), "data-tooltip-position": "top" } });
    (0, import_obsidian10.setIcon)(submit, "arrow-up");
    submit.onclick = () => void this.submit();
    this.parse();
    this.renderChips();
    this.renderProjekt();
  }
  onClose() {
    this.contentEl.empty();
  }
  /** Natural-Language aus dem Titel: Datum, Uhrzeit, Priorität, #Labels. Manuell (per Chip)
   *  gesetzte Werte bleiben erhalten: das Datum solange `duePinned`, Labels über den Abgleich
   *  parsedLabels ↔ manuell. Spiegelt die Logik von TaskModal.applyParse. */
  parse() {
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
  // ── Interaktive Chips ──
  /** Ein Chip: gesetzt (label != null) -> Wert + ✕ + Klick öffnet Picker; leer -> nur Icon +
   *  Tooltip, Klick öffnet Picker. Optik/Verhalten wie im vollen Modal (addChip). */
  addChip(icon, label, tooltip, onClick, onClear) {
    const isSet = label !== void 0;
    const chip = this.chipBar.createEl("button", { cls: "bt-chip" + (isSet ? " is-set" : "") });
    if (!isSet) {
      chip.setAttribute("aria-label", tooltip);
      chip.setAttribute("data-tooltip-position", "top");
    }
    (0, import_obsidian10.setIcon)(chip.createSpan({ cls: "bt-chip-ic" }), icon);
    if (isSet) chip.createSpan({ cls: "bt-chip-lbl", text: label });
    chip.onclick = (e) => {
      e.stopPropagation();
      onClick(chip);
    };
    if (isSet) {
      const x = chip.createSpan({ cls: "bt-chip-x" });
      (0, import_obsidian10.setIcon)(x, "x");
      x.onclick = (e) => {
        e.stopPropagation();
        onClear();
      };
    }
  }
  renderChips() {
    this.chipBar.empty();
    this.addChip(
      "calendar",
      this.f.due ? formatDateTime(combineDT(this.f.due, this.f.dueTime)) : void 0,
      t("chip_date"),
      (a) => this.openDate(a),
      () => {
        this.f.due = null;
        this.f.dueTime = null;
        this.duePinned = true;
        this.renderChips();
      }
    );
    const pn = PRIO_NUM[this.f.priority];
    this.addChip(
      "flag",
      pn ? "P" + pn : void 0,
      t("chip_priority"),
      (a) => this.openPrio(a),
      () => {
        this.f.priority = "normal";
        this.renderChips();
      }
    );
    this.addChip(
      "hash",
      this.f.labels.length ? this.f.labels.join(" | ") : void 0,
      t("chip_label"),
      (a) => this.openLabels(a),
      () => {
        this.f.labels = [];
        this.parsedLabels = [];
        this.renderChips();
      }
    );
  }
  openDate(anchor) {
    const value = this.f.due ? combineDT(this.f.due, this.f.dueTime) : "";
    openDatePicker(anchor, value, (v) => {
      this.f.due = v ? dateOf(v) : null;
      this.f.dueTime = v ? timeOf(v) : null;
      this.duePinned = true;
      this.renderChips();
    });
  }
  openPrio(anchor) {
    openPopover(anchor, (pop, close) => {
      for (const p of PRIOS) {
        popRow(pop, "flag", t(p.key), () => {
          this.f.priority = p.value;
          this.renderChips();
          close();
        }, this.f.priority === p.value, p.color);
      }
    });
  }
  openLabels(anchor) {
    const known = [.../* @__PURE__ */ new Set([...this.plugin.index.all().flatMap((task) => task.labels), ...this.plugin.settings.knownLabels])];
    openPopover(anchor, (pop) => {
      pop.addClass("bt-tags");
      const add = pop.createEl("input", { type: "text", cls: "bt-tag-add", attr: { placeholder: t("placeholder_label") } });
      const list = pop.createDiv({ cls: "bt-tag-list" });
      const render = () => {
        list.empty();
        const f = add.value.trim().toLowerCase().replace(/^#/, "");
        const all = [.../* @__PURE__ */ new Set([...known, ...this.f.labels])].sort((a, b) => a.localeCompare(b, "de"));
        for (const tag of all) {
          if (f && !tag.toLowerCase().includes(f)) continue;
          const on = this.f.labels.includes(tag);
          const r = list.createDiv({ cls: "bt-row bt-tag-row" + (on ? " is-active" : "") });
          (0, import_obsidian10.setIcon)(r.createSpan({ cls: "bt-row-ic" }), "hash");
          r.createSpan({ cls: "bt-row-lbl", text: tag });
          const box = r.createSpan({ cls: "bt-tag-box" });
          if (on) (0, import_obsidian10.setIcon)(box, "check");
          r.onclick = () => {
            this.f.labels = on ? this.f.labels.filter((x) => x !== tag) : [...this.f.labels, tag];
            this.parsedLabels = this.parsedLabels.filter((x) => x !== tag);
            this.renderChips();
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
        if (!this.f.labels.includes(slug)) this.f.labels.push(slug);
        this.parsedLabels = this.parsedLabels.filter((x) => x !== slug);
        add.value = "";
        this.renderChips();
        render();
      };
      window.setTimeout(() => add.focus(), 0);
    });
  }
  // ── Projekt ──
  renderProjekt() {
    this.projektBtn.empty();
    const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
    const all = [eingang, ...bereiche, ...projekte].filter(Boolean);
    const sel = all.find((p) => p.name === this.f.project);
    const ic = this.projektBtn.createSpan({ cls: "bt-projekt-ic" });
    (0, import_obsidian10.setIcon)(ic, sel?.icon ?? (this.f.project ? "folder" : "inbox"));
    if (sel?.color) ic.setCssStyles({ color: sel.color });
    this.projektBtn.createSpan({ text: this.f.project ? projectDisplayName(this.f.project) : t("no_project") });
    const car = this.projektBtn.createSpan({ cls: "bt-projekt-car" });
    (0, import_obsidian10.setIcon)(car, "chevron-down");
  }
  openProject(anchor) {
    openPopover(anchor, (pop, close) => {
      pop.addClass("bt-picker");
      const { eingang, bereiche, projekte } = listProjectsAndAreas(this.app);
      const pick = (name) => {
        this.f.project = name;
        this.renderProjekt();
        close();
      };
      if (eingang) popRow(pop, eingang.icon, projectDisplayName(eingang.name), () => pick(eingang.name), this.f.project === eingang.name, eingang.color ?? void 0);
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
      new import_obsidian10.Notice(t("err_enter_taskname"));
      return;
    }
    await createTaskNote(this.app, this.plugin.settings, {
      title,
      status: "todo",
      due: this.f.due,
      dueTime: this.f.dueTime,
      priority: this.f.priority,
      labels: this.f.labels,
      project: this.f.project
    });
    new import_obsidian10.Notice(t("qa_added"));
    this.f.title = "";
    this.cleanTitle = "";
    this.f.due = null;
    this.f.dueTime = null;
    this.f.priority = "normal";
    this.f.labels = [];
    this.duePinned = false;
    this.parsedLabels = [];
    this.input.value = "";
    this.renderChips();
    this.input.focus();
  }
  /** Modal schließen und das bereits Getippte ins volle TaskModal übergeben. */
  openInFull() {
    const text = this.f.title;
    const project = this.f.project ?? void 0;
    this.close();
    new TaskModal(this.plugin, void 0, project, { defaultTitle: text }).open();
  }
};

// src/settingsTab.ts
var import_obsidian11 = require("obsidian");
var FolderSuggest = class extends import_obsidian11.AbstractInputSuggest {
  constructor(appRef, textInputEl, onPick) {
    super(appRef, textInputEl);
    this.appRef = appRef;
    this.onPick = onPick;
  }
  getSuggestions(query) {
    const q = query.toLowerCase();
    const out = [];
    for (const f of this.appRef.vault.getAllLoadedFiles()) {
      if (f instanceof import_obsidian11.TFolder && f.path.toLowerCase().includes(q)) {
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
var BeautyTasksSettingTab = class extends import_obsidian11.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    const p = this.plugin;
    new import_obsidian11.Setting(containerEl).setName(t("set_folders_heading")).setHeading();
    const folderRow = (name, desc, get, set) => {
      new import_obsidian11.Setting(containerEl).setName(name).setDesc(desc).addText((text) => {
        text.setValue(get());
        const save = (raw) => {
          const v = (0, import_obsidian11.normalizePath)(raw.trim());
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
    new import_obsidian11.Setting(containerEl).setName(t("set_behavior_heading")).setHeading();
    new import_obsidian11.Setting(containerEl).setName(t("set_language")).setDesc(t("set_language_desc")).addDropdown((dd) => {
      dd.addOption("auto", t("set_language_auto"));
      dd.addOption("en", "English");
      dd.addOption("de", "Deutsch");
      dd.setValue(p.settings.locale);
      dd.onChange(async (v) => {
        p.settings.locale = v;
        await p.saveSettings();
        p.applyLocale();
        p.renderAll();
      });
    });
    new import_obsidian11.Setting(containerEl).setName(t("set_start_view")).setDesc(t("set_start_view_desc")).addDropdown((dd) => {
      for (const id of VIEW_IDS) dd.addOption(id, viewTitle(id));
      dd.addOption("last", t("set_start_view_last"));
      dd.setValue(p.settings.startView);
      dd.onChange(async (v) => {
        p.settings.startView = v;
        await p.saveSettings();
      });
    });
    new import_obsidian11.Setting(containerEl).setName(t("set_nl")).setDesc(t("set_nl_desc")).addToggle((tg) => tg.setValue(p.settings.parseNaturalLanguage).onChange(async (v) => {
      p.settings.parseNaturalLanguage = v;
      await p.saveSettings();
    }));
    new import_obsidian11.Setting(containerEl).setName(t("set_show_desc")).setDesc(t("set_show_desc_desc")).addToggle((tg) => tg.setValue(p.settings.showDescriptionInList).onChange(async (v) => {
      p.settings.showDescriptionInList = v;
      await p.saveSettings();
      p.renderAll();
    }));
    new import_obsidian11.Setting(containerEl).setName(t("set_chips_iconsonly")).setDesc(t("set_chips_iconsonly_desc")).addToggle((tg) => tg.setValue(p.settings.chipsIconsOnly).onChange(async (v) => {
      p.settings.chipsIconsOnly = v;
      await p.saveSettings();
    }));
  }
};

// src/main.ts
var BeautyTasksPlugin = class extends import_obsidian12.Plugin {
  constructor() {
    super(...arguments);
    this.currentView = "heute";
    this.currentProject = null;
    this.currentLabel = null;
    // aktives Label-Board
    this.doneCollapsed = true;
    // „Erledigt"-Sektionen eingeklappt (Default)
    this.manageOpen = false;
    // Verwaltungs-Ansicht aktiv?
    this.manageSection = "projects";
    // obere Ebene
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
    await this.loadSettings();
    this.applyLocale();
    this.currentView = this.resolveStartView();
    this.index = new TaskIndex(this.app);
    this.addChild(this.index);
    this.index.subscribe(() => this.renderAll());
    this.reminderScan = this.settings.reminderLastScan || Date.now();
    this.app.workspace.onLayoutReady(() => {
      this.app.workspace.iterateAllLeaves((leaf) => {
        if (OLD_VIEW_TYPES.includes(leaf.getViewState().type)) leaf.detach();
      });
      this.index.build();
      this.renderAll();
      this.scanReminders();
    });
    this.registerInterval(window.setInterval(() => this.scanReminders(), 3e4));
    this.registerView(VIEW_MAIN, (leaf) => new MainView(leaf, this));
    this.registerView(VIEW_NAV, (leaf) => new NavView(leaf, this));
    this.addRibbonIcon("check-circle", t("ribbon_open"), () => void this.openBeautyTasks());
    this.addSettingTab(new BeautyTasksSettingTab(this.app, this));
    this.registerEvent(this.app.workspace.on("layout-change", () => this.renderAll()));
    this.registerEvent(this.app.workspace.on("active-leaf-change", () => this.renderAll()));
    this.addCommand({ id: "open", name: t("ribbon_open"), callback: () => void this.openBeautyTasks() });
    for (const id of VIEW_IDS) {
      this.addCommand({ id: "open-" + id, name: t("cmd_open_view", viewTitle(id)), callback: () => void this.activateView(id) });
    }
    this.addCommand({ id: "new-task", name: t("cmd_new_task"), callback: () => this.openNewTask() });
    this.addCommand({ id: "quick-add", name: t("cmd_quick_add"), callback: () => this.openQuickAdd() });
    this.addCommand({ id: "search", name: t("cmd_search"), callback: () => this.openSearch() });
    this.addCommand({
      id: "count-tasks",
      name: t("cmd_count_tasks"),
      callback: () => new import_obsidian12.Notice(t("notice_count", this.index.all().length, this.index.open().length))
    });
    this.addCommand({
      id: "import-from-lists",
      name: t("cmd_import"),
      callback: async () => {
        new import_obsidian12.Notice(t("notice_import_running"));
        try {
          const n = await runMigration(this.app, this.settings);
          new import_obsidian12.Notice(t("notice_imported", n));
          window.setTimeout(() => this.index.build(), 800);
        } catch (e) {
          console.error("BeautyTasks import error", e);
          new import_obsidian12.Notice(t("notice_import_failed"));
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
    setLocale(this.settings.locale === "auto" ? import_obsidian12.moment.locale() : this.settings.locale);
  }
  /** Startansicht aus den Einstellungen (Fallback „heute"). "last" = zuletzt benutzte. */
  resolveStartView() {
    const pick = this.settings.startView === "last" ? this.settings.lastView : this.settings.startView;
    return VIEW_IDS.includes(pick) ? pick : "heute";
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
    this.manageOpen = false;
    await this.showMain();
  }
  async activateLabel(label) {
    this.currentLabel = label;
    this.currentProject = null;
    this.manageOpen = false;
    await this.showMain();
  }
  async activateManage(section2) {
    this.manageOpen = true;
    if (section2) this.manageSection = section2;
    this.currentProject = null;
    this.currentLabel = null;
    await this.showMain();
  }
  /** Aus der Suche gewählte Aufgabe in ihrer Liste zeigen: zum Projekt-/Inbox-Board
   *  (bzw. passenden Datums-/Erledigt-View) springen und die Zeile kurz hervorheben
   *  – als führe man mit der Maus darüber. `flashPath` wird beim Zeichnen von der
   *  Task-Zeile ausgewertet (robust gegen Neu-Zeichnen durch active-leaf-change). */
  async revealTask(task) {
    this.flashPath = task.path;
    this.flashScrolled = false;
    if (task.status === "done") this.doneCollapsed = false;
    if (task.project) {
      await this.activateProject(task.project);
    } else if (task.status === "done") {
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
  async createProject(name, asArea = false) {
    await createProjectNote(this.app, this.settings, name, asArea);
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
  }
  async setProjectVisible(path, visible) {
    this.refreshOnChange(path);
    await setNavHidden(this.app, path, !visible);
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
    this.renderAll();
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
      if (f instanceof import_obsidian12.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        const arr = Array.isArray(fm.labels) ? fm.labels.map(String) : [];
        fm.labels = [...new Set(arr.map((x) => x === oldName ? nu : x))];
      });
    }
    this.settings.knownLabels = [...new Set(this.settings.knownLabels.map((x) => x === oldName ? nu : x))];
    this.settings.visibleLabels = [...new Set(this.settings.visibleLabels.map((x) => x === oldName ? nu : x))];
    if (this.currentLabel === oldName) this.currentLabel = nu;
    await this.saveSettings();
    this.renderAll();
    return true;
  }
  /** Label aus ALLEN Aufgaben (Register + Sichtbarkeit) entfernen. */
  async deleteLabel(name) {
    for (const task of this.index.all()) {
      if (!task.labels.includes(name)) continue;
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian12.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        const arr = Array.isArray(fm.labels) ? fm.labels.map(String) : [];
        fm.labels = arr.filter((x) => x !== name);
      });
    }
    this.settings.knownLabels = this.settings.knownLabels.filter((x) => x !== name);
    this.settings.visibleLabels = this.settings.visibleLabels.filter((x) => x !== name);
    if (this.currentLabel === name) this.currentLabel = null;
    await this.saveSettings();
    this.renderAll();
  }
  // ── Label-Sichtbarkeit in der Seitenleiste (Default: aus) ──
  isLabelVisible(name) {
    return this.settings.visibleLabels.includes(name);
  }
  /** Sichtbar geschaltete Labels, die es noch gibt (alphabetisch). */
  getVisibleLabels() {
    const exist = new Set(this.getLabels().map((l) => l.name));
    return this.settings.visibleLabels.filter((n) => exist.has(n)).sort((a, b) => a.localeCompare(b, "de"));
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
  // ── Aufgaben-Aktionen ──
  openNewTask(project, label, today = false) {
    new TaskModal(this, void 0, project, { defaultLabel: label, defaultToday: today }).open();
  }
  openEditTask(task) {
    new TaskModal(this, task).open();
  }
  openQuickAdd(project) {
    new QuickAddModal(this, project).open();
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
      if (typeof Notification !== "undefined" && !import_obsidian12.Platform.isMobile) {
        const n = new Notification("BeautyTasks", { body });
        n.onclick = () => {
          window.focus();
          this.openEditTask(task);
        };
      }
    } catch {
    }
    new import_obsidian12.Notice("\u23F0 " + body, 1e4);
  }
  async setTaskDate(task, field, isoVal) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian12.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      if (isoVal) fm[field] = isoVal;
      else delete fm[field];
    });
  }
  async setTaskDuration(task, minutes) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian12.TFile)) return;
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      if (minutes) fm.duration = minutes;
      else delete fm.duration;
    });
  }
  async toggleDone(task) {
    const f = this.app.vault.getAbstractFileByPath(task.path);
    if (!(f instanceof import_obsidian12.TFile)) return;
    const done = task.status !== "done";
    await this.app.fileManager.processFrontMatter(f, (fm) => {
      fm.status = done ? "done" : "todo";
      fm.completed = done ? todayStr() : null;
    });
    if (done && task.recurrence) {
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
    const today = todayStr();
    const targets = [task, ...this.index.descendants(task.path)].filter((t2) => t2.status !== "cancelled");
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof import_obsidian12.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        fm.status = "cancelled";
        fm.cancelled = today;
      });
    }
  }
  /** Einzelne Aufgabe wiederherstellen: zurück auf offen, Abbruch-Datum entfernen. */
  async restoreTask(task) {
    const targets = [task, ...this.index.descendants(task.path)].filter((tk) => tk.status === "cancelled");
    for (const tk of targets) {
      const f = this.app.vault.getAbstractFileByPath(tk.path);
      if (f instanceof import_obsidian12.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        fm.status = "todo";
        delete fm.cancelled;
      });
    }
    new import_obsidian12.Notice(t("msg_restored", task.title));
  }
  /** Einzelne Aufgabe endgültig löschen (in Obsidians Papierkorb – dort wiederherstellbar). */
  async deleteTaskForever(path) {
    const f = this.app.vault.getAbstractFileByPath(path);
    if (f instanceof import_obsidian12.TFile) await this.app.fileManager.trashFile(f);
  }
  /** Alle abgebrochenen Aufgaben wiederherstellen (reversibel, ohne Rückfrage). */
  async restoreAllCancelled() {
    const items = this.index.cancelled();
    if (!items.length) {
      new import_obsidian12.Notice(t("report_trash_empty_restore"));
      return;
    }
    for (const task of items) {
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian12.TFile) await this.app.fileManager.processFrontMatter(f, (fm) => {
        fm.status = "todo";
        delete fm.cancelled;
      });
    }
    new import_obsidian12.Notice(t("report_tasks_restored", items.length));
  }
  /** Papierkorb leeren: alle abgebrochenen Aufgaben in Obsidians Papierkorb verschieben. */
  async emptyTrash() {
    const items = this.index.cancelled();
    if (!items.length) {
      new import_obsidian12.Notice(t("msg_trash_empty"));
      return;
    }
    for (const task of items) {
      const f = this.app.vault.getAbstractFileByPath(task.path);
      if (f instanceof import_obsidian12.TFile) await this.app.fileManager.trashFile(f);
    }
    new import_obsidian12.Notice(t("msg_trash_emptied", items.length));
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
