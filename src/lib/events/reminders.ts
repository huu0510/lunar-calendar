import { addDays, formatISODate, type SolarDate } from "@/lib/dates";
import { solarToLunar } from "@/lib/lunar";
import { formatReminderMessage } from "@/lib/events/message";
import { occurrenceOn } from "@/lib/events/recurrence";
import type { ReminderEvent } from "@/lib/events/types";
import type { NotifierChannel, SendResult } from "@/lib/notifiers/types";

export type PlannedReminder = {
  eventId: string;
  title: string;
  occurrenceDate: string;
  leadDays: number;
  recipientId: string;
  channel: NotifierChannel;
  externalId: string;
  message: string;
};

export type ReminderJobSummary = {
  sent: number;
  failed: number;
  skipped: number;
};

export function parseLeadDays(value: unknown): number[] {
  if (!Array.isArray(value)) return [];
  const days = value.filter(
    (item): item is number => typeof item === "number" && Number.isInteger(item) && item >= 0 && item <= 366,
  );
  return [...new Set(days)].sort((left, right) => left - right);
}

export function reminderKey(input: {
  eventId: string;
  occurrenceDate: string;
  leadDays: number;
  recipientId: string;
  channel: NotifierChannel;
}): string {
  return [input.eventId, input.occurrenceDate, String(input.leadDays), input.recipientId, input.channel].join("|");
}

/** Reminders whose occurrence is exactly `today + leadDays`. */
export function planReminders(events: ReminderEvent[], today: SolarDate): PlannedReminder[] {
  const planned: PlannedReminder[] = [];
  for (const event of events) {
    for (const lead of event.leadDays) {
      const target = addDays(today, lead);
      const occurrence = occurrenceOn(event, target);
      if (!occurrence) continue;
      const message = formatReminderMessage({
        title: event.title,
        leadDays: lead,
        solar: occurrence,
        lunar: solarToLunar(occurrence),
      });
      for (const recipient of event.recipients) {
        planned.push({
          eventId: event.id,
          title: event.title,
          occurrenceDate: formatISODate(occurrence),
          leadDays: lead,
          recipientId: recipient.id,
          channel: recipient.channel,
          externalId: recipient.externalId,
          message,
        });
      }
    }
  }
  return planned;
}

/**
 * Sends each planned reminder unless a SENT log already exists for its key.
 * A failure on one channel is recorded and does not stop the rest of the job.
 * Callers should record FAILED without treating it as already sent, so the next
 * run retries that channel.
 */
export async function dispatchReminders(options: {
  planned: PlannedReminder[];
  alreadySent: Set<string>;
  send: (item: PlannedReminder) => Promise<SendResult>;
  record: (item: PlannedReminder, result: SendResult) => Promise<void>;
}): Promise<ReminderJobSummary> {
  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const item of options.planned) {
    if (options.alreadySent.has(reminderKey(item))) {
      skipped += 1;
      continue;
    }
    let result: SendResult;
    try {
      result = await options.send(item);
    } catch (error) {
      result = { ok: false, error: error instanceof Error ? error.message : "send failed" };
    }
    try {
      await options.record(item, result);
    } catch (error) {
      console.error(
        `reminder log failed event=${item.eventId} channel=${item.channel}: ${
          error instanceof Error ? error.message : "unknown"
        }`,
      );
      failed += 1;
      continue;
    }
    if (result.ok) sent += 1;
    else failed += 1;
  }

  return { sent, failed, skipped };
}
