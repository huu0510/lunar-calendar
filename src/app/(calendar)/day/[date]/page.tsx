import Link from "next/link";
import { notFound } from "next/navigation";
import { DaySummary } from "@/components/DaySummary";
import { formatISODate, formatSolarSlash, parseISODate } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { EVENT_TYPE_LABELS } from "@/lib/events/labels";
import { occurrenceOn } from "@/lib/events/recurrence";
import { holidaysOn, solarToLunar } from "@/lib/lunar";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function DayPage({ params }: { params: Promise<{ date: string }> }) {
  const { date } = await params;
  const solar = parseISODate(date);
  if (!solar) notFound();
  const lunar = solarToLunar(solar);
  const holidays = holidaysOn(lunar, solar);
  const user = await currentUser();
  const events = user
    ? (await prisma.event.findMany({ where: { userId: user.id } })).filter((event) =>
        occurrenceOn(event, solar),
      )
    : [];

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <Link href={`/?y=${solar.year}&m=${solar.month}`} className="text-sm font-semibold text-cinnabar">
        Về tháng {solar.month}
      </Link>
      <DaySummary solar={solar} lunar={lunar} holidays={holidays} />
      <section className="rounded-3xl border border-line bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-serif text-xl font-semibold">Sự kiện</h2>
          <Link
            href={`/events/new?date=${formatISODate(solar)}`}
            className="text-sm font-semibold text-cinnabar"
          >
            Thêm
          </Link>
        </div>
        {events.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {user ? "Chưa có ghi chú nào trong ngày này." : "Đăng nhập để lưu ngày giỗ và kỷ niệm."}
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {events.map((event) => (
              <li key={event.id}>
                <Link href={`/events/${event.id}`} className="font-semibold">
                  {event.title}
                </Link>
                <p className="text-sm text-muted">{EVENT_TYPE_LABELS[event.type]}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-sm text-muted">Dương lịch {formatSolarSlash(solar)}</p>
    </div>
  );
}
