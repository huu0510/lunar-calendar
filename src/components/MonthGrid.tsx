import Link from "next/link";
import { formatISODate } from "@/lib/dates";
import { WEEKDAY_SHORT } from "@/lib/locale";
import type { MonthCell } from "@/lib/calendar";

export function MonthGrid({
  weeks,
  eventDates,
}: {
  weeks: MonthCell[][];
  eventDates: Set<string>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm">
      <div className="grid grid-cols-7 bg-paper-2 text-center text-xs font-semibold tracking-wide text-muted">
        {WEEKDAY_SHORT.map((label, index) => (
          <div key={label} className={`py-2 ${index === 6 ? "text-cinnabar" : ""}`}>
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {weeks.flat().map((cell) => {
          const iso = formatISODate(cell.solar);
          const lunarLabel =
            cell.lunar.day === 1
              ? `${cell.lunar.day}/${cell.lunar.month}${cell.lunar.isLeapMonth ? "n" : ""}`
              : String(cell.lunar.day);
          const hasEvent = eventDates.has(iso);
          return (
            <Link
              key={iso}
              href={`/day/${iso}`}
              aria-label={`${cell.solar.day}/${cell.solar.month}/${cell.solar.year}, âm ${lunarLabel}`}
              aria-current={cell.isToday ? "date" : undefined}
              className={`flex min-h-[4.6rem] flex-col border-t border-line px-1 py-1 sm:min-h-24 sm:px-2 ${
                cell.inMonth ? "bg-white" : "bg-paper text-muted/70"
              } ${cell.isToday ? "bg-[#f8ebe6]" : ""}`}
            >
              <span className="flex items-start justify-between">
                <span
                  className={`grid h-7 w-7 place-items-center rounded-full text-sm font-semibold ${
                    cell.isToday
                      ? "bg-cinnabar text-white"
                      : cell.weekday === 6
                        ? "text-cinnabar"
                        : "text-ink"
                  }`}
                >
                  {cell.solar.day}
                </span>
                {hasEvent ? <span className="mt-1 h-1.5 w-1.5 rounded-full bg-gold" /> : null}
              </span>
              <span
                className={`mt-auto text-[11px] leading-tight sm:text-xs ${
                  cell.lunar.day === 1
                    ? "font-semibold text-gold"
                    : cell.lunar.day === 15
                      ? "font-semibold text-bamboo"
                      : "text-muted"
                }`}
              >
                {lunarLabel}
              </span>
              {cell.holidays[0] ? (
                <span className="mt-0.5 hidden truncate text-[10px] text-cinnabar sm:block">
                  {cell.holidays[0]}
                </span>
              ) : cell.solarTerm ? (
                <span className="mt-0.5 hidden truncate text-[10px] text-bamboo sm:block">{cell.solarTerm}</span>
              ) : null}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
