import { compareSolar, isValidSolarDate, sameSolar, type SolarDate } from "@/lib/dates";
import { getLeapMonth, lunarMonthLength, lunarToSolar, solarToLunar, type LunarDate } from "@/lib/lunar";
import type { EventSchedule } from "@/lib/events/types";

/**
 * YEARLY_LUNAR rules (also applied when a one-time lunar date must be resolved):
 * - If the original event falls in a leap month and that lunar year has no leap
 *   month of the same number, use the regular month with the same number.
 * - If lunar day 30 does not exist because the month is short, use day 29.
 *
 * YEARLY_SOLAR: 29 February in a common year falls on 28 February.
 */
export function resolveLunarDate(
  day: number,
  month: number,
  isLeapMonth: boolean,
  lunarYear: number,
): LunarDate | null {
  if (month < 1 || month > 12 || day < 1 || day > 30) return null;
  const leapMonth = getLeapMonth(lunarYear);
  const useLeap = isLeapMonth && leapMonth === month;
  const length = lunarMonthLength(lunarYear, month, useLeap);
  if (length == null) return null;
  const useDay = day > length ? length : day;
  return { day: useDay, month, year: lunarYear, isLeapMonth: useLeap };
}

export function resolveSolarDate(month: number, day: number, year: number): SolarDate | null {
  const date = { year, month, day };
  if (isValidSolarDate(date)) return date;
  if (month === 2 && day === 29 && isValidSolarDate({ year, month: 2, day: 28 })) {
    return { year, month: 2, day: 28 };
  }
  return null;
}

export function singleOccurrence(event: EventSchedule): SolarDate | null {
  if (event.year == null) return null;
  if (event.recurrence === "YEARLY_SOLAR" || event.calendarType === "SOLAR") {
    return resolveSolarDate(event.month, event.day, event.year);
  }
  const lunar = resolveLunarDate(event.day, event.month, event.isLeapMonth, event.year);
  return lunar ? lunarToSolar(lunar) : null;
}

/** The solar date of this event when it occurs on `solar`, after fallback rules. */
export function occurrenceOn(event: EventSchedule, solar: SolarDate): SolarDate | null {
  if (event.recurrence === "NONE") {
    const once = singleOccurrence(event);
    return once && sameSolar(once, solar) ? once : null;
  }
  if (event.recurrence === "YEARLY_SOLAR") {
    const resolved = resolveSolarDate(event.month, event.day, solar.year);
    return resolved && sameSolar(resolved, solar) ? resolved : null;
  }
  const lunar = solarToLunar(solar);
  const resolved = resolveLunarDate(event.day, event.month, event.isLeapMonth, lunar.year);
  if (!resolved) return null;
  const occurrence = lunarToSolar(resolved);
  return occurrence && sameSolar(occurrence, solar) ? occurrence : null;
}

export function nextOccurrence(event: EventSchedule, today: SolarDate): SolarDate | null {
  if (event.recurrence === "NONE") {
    const once = singleOccurrence(event);
    if (!once || compareSolar(once, today) < 0) return null;
    return once;
  }
  if (event.recurrence === "YEARLY_SOLAR") {
    const thisYear = resolveSolarDate(event.month, event.day, today.year);
    if (thisYear && compareSolar(thisYear, today) >= 0) return thisYear;
    return resolveSolarDate(event.month, event.day, today.year + 1);
  }
  const lunarToday = solarToLunar(today);
  const thisYear = solarOfLunarEvent(event, lunarToday.year);
  if (thisYear && compareSolar(thisYear, today) >= 0) return thisYear;
  return solarOfLunarEvent(event, lunarToday.year + 1);
}

function solarOfLunarEvent(event: EventSchedule, lunarYear: number): SolarDate | null {
  const resolved = resolveLunarDate(event.day, event.month, event.isLeapMonth, lunarYear);
  return resolved ? lunarToSolar(resolved) : null;
}
