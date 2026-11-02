import Link from "next/link";
import { formatSolarSlash, todayInVietnam } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { EVENT_TYPE_LABELS, RECURRENCE_LABELS } from "@/lib/events/labels";
import { nextOccurrence } from "@/lib/events/recurrence";
import { formatLunarCompact, solarToLunar } from "@/lib/lunar";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const today = todayInVietnam();
  const events = await prisma.event.findMany({
    where: { userId: user.id },
    orderBy: { title: "asc" },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl font-semibold">Sự kiện</h1>
          <p className="text-sm text-muted">Ngày giỗ, kỷ niệm và ghi chú của bạn.</p>
        </div>
        <Link href="/events/new" className="rounded-xl bg-cinnabar px-4 py-2 text-sm font-semibold text-white">
          Thêm
        </Link>
      </div>
      {params.saved ? <p className="text-sm font-medium text-bamboo">Đã lưu.</p> : null}
      {events.length === 0 ? (
        <p className="rounded-3xl border border-dashed border-line bg-white p-6 text-sm text-muted">
          Chưa có sự kiện. Thêm ngày giỗ để được nhắc qua Telegram hoặc Zalo.
        </p>
      ) : (
        <ul className="space-y-2">
          {events.map((event) => {
            const next = nextOccurrence(event, today);
            const lunar = next ? solarToLunar(next) : null;
            return (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="block rounded-2xl border border-line bg-white px-4 py-3">
                  <span className="font-semibold">{event.title}</span>
                  <span className="mt-1 block text-sm text-muted">
                    {EVENT_TYPE_LABELS[event.type]} · {RECURRENCE_LABELS[event.recurrence]}
                    {next ? ` · tới ${formatSolarSlash(next)}` : ""}
                    {lunar ? ` (${formatLunarCompact(lunar)} âm)` : ""}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
