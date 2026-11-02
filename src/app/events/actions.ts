"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseEventForm } from "@/lib/events/validation";

function revalidateEvents() {
  revalidatePath("/");
  revalidatePath("/events");
  revalidatePath("/day", "layout");
}

export async function createEvent(formData: FormData): Promise<{ error: string } | void> {
  const user = await requireUser();
  const parsed = parseEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const owned = await ownedRecipientIds(user.id, parsed.value.recipientIds);
  const event = await prisma.event.create({
    data: {
      userId: user.id,
      title: parsed.value.title,
      type: parsed.value.type,
      note: parsed.value.note,
      calendarType: parsed.value.calendarType,
      day: parsed.value.day,
      month: parsed.value.month,
      year: parsed.value.year,
      isLeapMonth: parsed.value.isLeapMonth,
      recurrence: parsed.value.recurrence,
      leadDays: parsed.value.leadDays,
      recipients: { create: owned.map((recipientId) => ({ recipientId })) },
    },
  });
  revalidateEvents();
  redirect(`/events/${event.id}?saved=1`);
}

export async function updateEvent(id: string, formData: FormData): Promise<{ error: string } | void> {
  const user = await requireUser();
  const existing = await prisma.event.findFirst({ where: { id, userId: user.id }, select: { id: true } });
  if (!existing) return { error: "Không tìm thấy sự kiện." };
  const parsed = parseEventForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const owned = await ownedRecipientIds(user.id, parsed.value.recipientIds);
  await prisma.event.update({
    where: { id },
    data: {
      title: parsed.value.title,
      type: parsed.value.type,
      note: parsed.value.note,
      calendarType: parsed.value.calendarType,
      day: parsed.value.day,
      month: parsed.value.month,
      year: parsed.value.year,
      isLeapMonth: parsed.value.isLeapMonth,
      recurrence: parsed.value.recurrence,
      leadDays: parsed.value.leadDays,
      recipients: {
        deleteMany: {},
        create: owned.map((recipientId) => ({ recipientId })),
      },
    },
  });
  revalidateEvents();
  redirect(`/events/${id}?saved=1`);
}

export async function deleteEvent(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.event.deleteMany({ where: { id, userId: user.id } });
  revalidateEvents();
  redirect("/events");
}

async function ownedRecipientIds(userId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.recipient.findMany({
    where: { userId, id: { in: ids } },
    select: { id: true },
  });
  return rows.map((row) => row.id);
}
