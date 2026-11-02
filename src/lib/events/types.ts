import type { NotifierChannel } from "@/lib/notifiers/types";

export type CalendarKind = "SOLAR" | "LUNAR";
export type RecurrenceKind = "NONE" | "YEARLY_SOLAR" | "YEARLY_LUNAR";

export type EventSchedule = {
  calendarType: CalendarKind;
  day: number;
  month: number;
  year: number | null;
  isLeapMonth: boolean;
  recurrence: RecurrenceKind;
};

export type ReminderRecipient = {
  id: string;
  name: string;
  channel: NotifierChannel;
  externalId: string;
};

export type ReminderEvent = EventSchedule & {
  id: string;
  title: string;
  leadDays: number[];
  recipients: ReminderRecipient[];
};
