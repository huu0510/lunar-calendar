import { DeleteButton } from "@/components/DeleteButton";
import { RecipientForm } from "@/components/RecipientForm";
import { prisma } from "@/lib/db";
import { CHANNEL_LABELS } from "@/lib/events/labels";
import { deleteRecipient } from "@/app/recipients/actions";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function RecipientsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const recipients = await prisma.recipient.findMany({
    where: { userId: user.id },
    orderBy: { name: "asc" },
  });
  const telegramReady = Boolean(process.env.TELEGRAM_BOT_TOKEN);
  const zaloReady = Boolean(process.env.ZALO_OA_ACCESS_TOKEN || process.env.ZALO_OA_REFRESH_TOKEN);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,22rem)_1fr]">
      <div className="space-y-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Người nhận</h1>
          <p className="mt-1 text-sm text-muted">Nhắc ngày giỗ và kỷ niệm qua Telegram hoặc Zalo.</p>
        </div>
        {params.saved ? <p className="text-sm font-medium text-bamboo">Đã lưu người nhận.</p> : null}
        <RecipientForm />
      </div>
      <div className="space-y-4">
        <section className="rounded-3xl border border-line bg-white p-5 text-sm leading-6">
          <h2 className="font-serif text-xl font-semibold">Lấy Chat ID Telegram</h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted">
            <li>Mở bot của bạn và nhắn /start.</li>
            <li>Bot trả lại chat_id. Dán số đó vào ô người nhận.</li>
            <li>Webhook cần header bí mật TELEGRAM_WEBHOOK_SECRET.</li>
          </ol>
          <p className="mt-2">{telegramReady ? "Bot Telegram đã được cấu hình." : "Chưa có TELEGRAM_BOT_TOKEN trong môi trường."}</p>
          <h2 className="mt-4 font-serif text-xl font-semibold">Zalo Official Account</h2>
          <p className="mt-2 text-muted">
            Người nhận là user_id của người đã quan tâm OA. Access token hết hạn sẽ được làm mới bằng refresh token và lưu trong cơ sở dữ liệu.
          </p>
          <p className="mt-2">{zaloReady ? "Đã có token Zalo trong môi trường." : "Chưa có token Zalo trong môi trường."}</p>
        </section>
        <ul className="space-y-2">
          {recipients.length === 0 ? <li className="text-sm text-muted">Chưa có người nhận.</li> : null}
          {recipients.map((recipient) => (
            <li key={recipient.id} className="flex items-center justify-between rounded-2xl border border-line bg-white px-4 py-3">
              <div>
                <p className="font-semibold">{recipient.name}</p>
                <p className="text-sm text-muted">
                  {CHANNEL_LABELS[recipient.channel]} · {recipient.externalId}
                </p>
              </div>
              <DeleteButton action={deleteRecipient} id={recipient.id} label="Xóa" />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
