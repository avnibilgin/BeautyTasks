// Aus dem ECHT installierten TaskNotes 4.11.1 entnommen (dessen data.json, 2026-08-05), gekürzt
// auf die Felder, die wir lesen. Zweck: die Form der fremden Daten festhalten, statt sie zu
// vermuten – ändert TaskNotes sie, fällt es hier auf und nicht erst beim Nutzer.
export const TN_SETTINGS = {
  "taskTag": "task",
  "fieldMapping": {
    "title": "title",
    "status": "status",
    "priority": "priority",
    "due": "due",
    "scheduled": "scheduled",
    "contexts": "contexts",
    "projects": "projects",
    "timeEstimate": "timeEstimate",
    "completedDate": "completedDate",
    "dateCreated": "dateCreated",
    "dateModified": "dateModified",
    "recurrence": "recurrence",
    "recurrenceAnchor": "recurrence_anchor",
    "recurrenceParent": "recurrence_parent",
    "occurrenceDate": "occurrence_date",
    "occurrenceMaterialization": "occurrence_materialization",
    "occurrenceNextTrigger": "occurrence_next_trigger",
    "occurrenceTemplate": "occurrence_template",
    "occurrencePastHorizon": "occurrence_past_horizon",
    "occurrenceFutureHorizon": "occurrence_future_horizon",
    "archiveTag": "archived",
    "timeEntries": "timeEntries",
    "completeInstances": "complete_instances",
    "skippedInstances": "skipped_instances",
    "blockedBy": "blockedBy",
    "pomodoros": "pomodoros",
    "icsEventId": "icsEventId",
    "icsEventTag": "ics_event",
    "googleCalendarEventId": "googleCalendarEventId",
    "googleCalendarExceptionEventId": "googleCalendarExceptionEventId",
    "googleCalendarExceptionOriginalScheduled": "googleCalendarExceptionOriginalScheduled",
    "googleCalendarMovedOriginalDates": "googleCalendarMovedOriginalDates",
    "reminders": "reminders",
    "sortOrder": "tasknotes_manual_order"
  }
};

export const TN_STATUSES = [
  {
    "value": "none",
    "label": "None",
    "isCompleted": false
  },
  {
    "value": "open",
    "label": "Open",
    "isCompleted": false
  },
  {
    "value": "in-progress",
    "label": "In progress",
    "isCompleted": false
  },
  {
    "value": "done",
    "label": "Done",
    "isCompleted": true
  }
];

export const TN_PRIORITIES = [
  {
    "value": "none",
    "label": "None",
    "weight": 0
  },
  {
    "value": "low",
    "label": "Low",
    "weight": 1
  },
  {
    "value": "normal",
    "label": "Normal",
    "weight": 2
  },
  {
    "value": "high",
    "label": "High",
    "weight": 3
  }
];
