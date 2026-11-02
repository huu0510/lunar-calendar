import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createTelegramNotifier } from "@/lib/notifiers/telegram";
import { isTelegramWebhookAuthorized } from "@/lib/secret";
import { interpretTelegramUpdate } from "@/lib/telegramUpdate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (
    !isTelegramWebhookAuthorized(
      request.headers.get("x-telegram-bot-api-secret-token"),
      process.env.TELEGRAM_WEBHOOK_SECRET,
    )
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const update: unknown = await request.json().catch(() => null);
  const start = interpretTelegramUpdate(update);
  if (!start) return NextResponse.json({ ok: true });
  await prisma.telegramSubscriber.upsert({
    where: { chatId: start.chatId },
    create: { chatId: start.chatId, username: start.username, firstName: start.firstName },
    update: { username: start.username, firstName: start.firstName },
  });
  const notifier = createTelegramNotifier({ botToken: process.env.TELEGRAM_BOT_TOKEN ?? "" });
  await notifier.send({ externalId: start.chatId }, { text: start.reply });
  return NextResponse.json({ ok: true });
}
