"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { parseRecipientForm } from "@/lib/events/validation";

export async function createRecipient(formData: FormData): Promise<{ error: string } | void> {
  const user = await requireUser();
  const parsed = parseRecipientForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const duplicate = await prisma.recipient.findFirst({
    where: { userId: user.id, channel: parsed.value.channel, externalId: parsed.value.externalId },
  });
  if (duplicate) return { error: "Người nhận này đã có trên kênh đó." };
  await prisma.recipient.create({
    data: { userId: user.id, ...parsed.value },
  });
  revalidatePath("/recipients");
  revalidatePath("/events");
  redirect("/recipients?saved=1");
}

export async function deleteRecipient(formData: FormData): Promise<void> {
  const user = await requireUser();
  const id = String(formData.get("id") ?? "");
  await prisma.recipient.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/recipients");
  revalidatePath("/events");
}
