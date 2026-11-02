import Link from "next/link";
import { MonthGrid } from "@/components/MonthGrid";
import { buildMonthGrid } from "@/lib/calendar";
import { formatISODate, formatSolarSlash, shiftMonth, todayInVietnam } from "@/lib/dates";
import { occurrenceOn } from "@/lib/events/recurrence";
import type { EventSchedule } from "@/lib/events/types";
import { formatLunarLong, solarToLunar } from "@/lib/lunar";
import { WEEKDAY_LONG, monthTitle } from "@/lib/locale";
import { weekdayIndexMonday } from "@/lib/dates";
import { prisma } from "@/lib/db";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ y?: string; m?: string }>;
}) {
  const params = await searchParams;
  const today = todayInVietnam();
  const year = clampYear(Number(params.y) || today.year);
  const month = clampMonth(Number(params.m) || today.month);
  const weeks = buildMonthGrid(year, month, today);
  const previous = shiftMonth(year, month, -1);
  const next = shiftMonth(year, month, 1);
  const lunarToday = solarToLunar(today);
  const user = await currentUser();
  const eventDates = new Set<string>();
  if (user) {
    const events = await prisma.event.findMany({ where: { userId: user.id } });
    for (const cell of weeks.flat()) {
      if (events.some((event) => occurrenceOn(toSchedule(event), cell.solar))) {
        eventDates.add(formatISODate(cell.solar));
      }
    }
  }
  const monthHolidays = weeks
    .flat()
    .filter((cell) => cell.inMonth && (cell.holidays.length > 0 || cell.solarTerm))
    .map((cell) => ({
      iso: formatISODate(cell.solar),
      label: `${cell.solar.day}/${cell.solar.month}`,
      notes: [...cell.holidays, ...(cell.solarTerm ? [cell.solarTerm] : [])],
    }));

  return (
    <div className="space-y-4">
      <section className="rounded-3xl bg-indigo px-5 py-4 text-paper">
        <p className="text-sm text-gold-soft">{WEEKDAY_LONG[weekdayIndexMonday(today)]}</p>
        <p className="font-serif text-3xl font-semibold">{formatSolarSlash(today)}</p>
        <p className="mt-1 text-sm text-paper/80">{formatLunarLong(lunarToday)}</p>
      </section>
      <div className="flex items-center justify-between gap-3">
        <Link className="rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold" href={`/?y=${previous.year}&m=${previous.month}`}>
          Trước
        </Link>
        <div className="text-center">
          <h1 className="font-serif text-2xl font-semibold">{monthTitle(year, month)}</h1>
          <Link href="/" className="text-sm font-semibold text-cinnabar">
            Hôm nay
          </Link>
        </div>
        <Link className="rounded-full border border-line bg-white px-3 py-2 text-sm font-semibold" href={`/?y=${next.year}&m=${next.month}`}>
          Sau
        </Link>
      </div>
      <MonthGrid weeks={weeks} eventDates={eventDates} />
      <p className="flex flex-wrap gap-3 text-xs text-muted">
        <span className="inline-flex items-center gap-1"><i className="h-2.5 w-2.5 rounded-full bg-cinnabar" /> Hôm nay</span>
        <span className="text-gold">Mùng 1</span>
        <span className="text-bamboo">Rằm</span>
        <span className="inline-flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-gold" /> Sự kiện của bạn</span>
      </p>
      {monthHolidays.length > 0 ? (
        <section className="rounded-3xl border border-line bg-white p-4">
          <h2 className="font-serif text-lg font-semibold">Ngày lễ và tiết khí</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {monthHolidays.map((item) => (
              <li key={item.iso}>
                <Link href={`/day/${item.iso}`} className="font-semibold text-cinnabar">
                  {item.label}
                </Link>
                <span className="text-muted"> — {item.notes.join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}

function clampYear(year: number): number {
  if (!Number.isInteger(year)) return todayInVietnam().year;
  return Math.min(2199, Math.max(1900, year));
}

function clampMonth(month: number): number {
  if (!Number.isInteger(month) || month < 1 || month > 12) return todayInVietnam().month;
  return month;
}

function toSchedule(event: {
  calendarType: EventSchedule["calendarType"];
  day: number;
  month: number;
  year: number | null;
  isLeapMonth: boolean;
  recurrence: EventSchedule["recurrence"];
}): EventSchedule {
  return event;
}
