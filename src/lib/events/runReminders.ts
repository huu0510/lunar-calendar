import { prisma } from "@/lib/db";
import { todayInVietnam, VIETNAM_TIME_ZONE } from "@/lib/dates";
import { dispatchReminders, parseLeadDays, planReminders, reminderKey, type ReminderJobSummary } from "@/lib/events/reminders";
import type { ReminderEvent } from "@/lib/events/types";
import { getNotifier } from "@/lib/notifiers";
import type { Channel } from "@/generated/prisma/client";

function toNotifierChannel(channel: Channel): "telegram" | "zalo" {
  return channel === "TELEGRAM" ? "telegram" : "zalo";
}

function toDbChannel(channel: "telegram" | "zalo"): Channel {
  return channel === "telegram" ? "TELEGRAM" : "ZALO";
}

export async function runReminderJob(now: Date = new Date()): Promise<ReminderJobSummary> {
  const timeZone = process.env.APP_TIMEZONE || VIETNAM_TIME_ZONE;
  const today = todayInVietnam(now, timeZone);
  const rows = await prisma.event.findMany({
    include: { recipients: { include: { recipient: true } } },
  });

  const events: ReminderEvent[] = rows.map((row) => ({
    id: row.id,
    title: row.title,
    calendarType: row.calendarType,
    day: row.day,
    month: row.month,
    year: row.year,
    isLeapMonth: row.isLeapMonth,
    recurrence: row.recurrence,
    leadDays: parseLeadDays(row.leadDays),
    recipients: row.recipients.map((link) => ({
      id: link.recipient.id,
      name: link.recipient.name,
      channel: toNotifierChannel(link.recipient.channel),
      externalId: link.recipient.externalId,
    })),
  }));

  const planned = planReminders(events, today);
  const sentRows = planned.length
    ? await prisma.reminderLog.findMany({
        where: {
          status: "SENT",
          eventId: { in: [...new Set(planned.map((item) => item.eventId))] },
        },
      })
    : [];
  const alreadySent = new Set(
    sentRows.map((row) =>
      reminderKey({
        eventId: row.eventId,
        occurrenceDate: row.occurrenceDate,
        leadDays: row.leadDays,
        recipientId: row.recipientId,
        channel: toNotifierChannel(row.channel),
      }),
    ),
  );

  const notifiers = {
    telegram: getNotifier("telegram"),
    zalo: getNotifier("zalo"),
  };

  return dispatchReminders({
    planned,
    alreadySent,
    send: (item) => notifiers[item.channel].send({ externalId: item.externalId, name: undefined }, { text: item.message }),
    record: async (item, result) => {
      const error = result.ok ? null : (result.error ?? "Gửi thất bại").slice(0, 500);
      await prisma.reminderLog.upsert({
        where: {
          eventId_occurrenceDate_leadDays_recipientId_channel: {
            eventId: item.eventId,
            occurrenceDate: item.occurrenceDate,
            leadDays: item.leadDays,
            recipientId: item.recipientId,
            channel: toDbChannel(item.channel),
          },
        },
        create: {
          eventId: item.eventId,
          occurrenceDate: item.occurrenceDate,
          leadDays: item.leadDays,
          recipientId: item.recipientId,
          channel: toDbChannel(item.channel),
          status: result.ok ? "SENT" : "FAILED",
          error,
        },
        update: {
          status: result.ok ? "SENT" : "FAILED",
          error,
          sentAt: new Date(),
        },
      });
      if (!result.ok) {
        console.error(
          `reminder failed event=${item.eventId} channel=${item.channel} lead=${item.leadDays}: ${error ?? "unknown"}`,
        );
      }
    },
  });
}
