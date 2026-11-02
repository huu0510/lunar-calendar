import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { DeleteButton } from "@/components/DeleteButton";
import { EventForm, type EventFormValues } from "@/components/EventForm";
import { prisma } from "@/lib/db";
import { deleteEvent, updateEvent } from "@/app/events/actions";
import { parseLeadDays } from "@/lib/events/reminders";
import { requireUser } from "@/lib/session";
import { todayInVietnam } from "@/lib/dates";

export const metadata: Metadata = { title: "Sửa sự kiện" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  const query = await searchParams;
  const event = await prisma.event.findFirst({
    where: { id, userId: user.id },
    include: { recipients: true },
  });
  if (!event) notFound();
  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  const initial: EventFormValues = {
    title: event.title,
    type: event.type,
    note: event.note ?? "",
    recurrence: event.recurrence,
    calendarType: event.calendarType,
    day: event.day,
    month: event.month,
    year: event.year ?? todayInVietnam().year,
    isLeapMonth: event.isLeapMonth,
    leadDays: parseLeadDays(event.leadDays),
    recipientIds: event.recipients.map((link) => link.recipientId),
  };
  const save = updateEvent.bind(null, event.id);

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href="/events" className="text-sm font-semibold text-cinnabar">
        Tất cả sự kiện
      </Link>
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-3xl font-semibold">Sửa sự kiện</h1>
        <DeleteButton action={deleteEvent} id={event.id} label="Xóa" />
      </div>
      {query.saved ? <p className="text-sm font-medium text-bamboo">Đã lưu.</p> : null}
      <EventForm
        action={save}
        submitLabel="Cập nhật"
        initial={initial}
        recipients={recipients.map((recipient) => ({
          id: recipient.id,
          name: recipient.name,
          channel: recipient.channel,
        }))}
      />
    </div>
  );
}
