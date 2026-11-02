import type { Metadata } from "next";
import { EventForm, type EventFormValues } from "@/components/EventForm";
import { parseISODate, todayInVietnam } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { createEvent } from "@/app/events/actions";
import { solarToLunar } from "@/lib/lunar";
import { requireUser } from "@/lib/session";

export const metadata: Metadata = { title: "Sự kiện mới" };
export const dynamic = "force-dynamic";

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; calendar?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = todayInVietnam();
  const selected = typeof params.date === "string" ? parseISODate(params.date) ?? today : today;
  const lunar = solarToLunar(selected);
  const preferSolar = params.calendar === "solar";
  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  const initial: EventFormValues = preferSolar
    ? {
        title: "",
        type: "DEATH_ANNIVERSARY",
        note: "",
        recurrence: "YEARLY_SOLAR",
        calendarType: "SOLAR",
        day: selected.day,
        month: selected.month,
        year: selected.year,
        isLeapMonth: false,
        leadDays: [7, 1, 0],
        recipientIds: [],
      }
    : {
        title: "",
        type: "DEATH_ANNIVERSARY",
        note: "",
        recurrence: "YEARLY_LUNAR",
        calendarType: "LUNAR",
        day: lunar.day,
        month: lunar.month,
        year: lunar.year,
        isLeapMonth: lunar.isLeapMonth,
        leadDays: [7, 1, 0],
        recipientIds: [],
      };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="font-serif text-3xl font-semibold">Sự kiện mới</h1>
      <EventForm
        action={createEvent}
        submitLabel="Lưu sự kiện"
        recipients={recipients.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          channel: recipient.channel,
        }))}
        initial={initial}
      />
    </div>
  );
}
