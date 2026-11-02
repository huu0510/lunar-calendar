import type { SolarDate } from "@/lib/lunar/types";

export type { SolarDate };

/** Vietnam has no daylight-saving time. Lunar astronomy uses this fixed offset. */
export const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export function isValidSolarDate(date: SolarDate): boolean {
  if (!Number.isInteger(date.year) || !Number.isInteger(date.month) || !Number.isInteger(date.day)) {
    return false;
  }
  if (date.month < 1 || date.month > 12 || date.day < 1) return false;
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return (
    utc.getUTCFullYear() === date.year &&
    utc.getUTCMonth() === date.month - 1 &&
    utc.getUTCDate() === date.day
  );
}

export function compareSolar(a: SolarDate, b: SolarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

export function sameSolar(a: SolarDate, b: SolarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/** Calendar-day arithmetic that does not depend on the host timezone. */
export function addDays(date: SolarDate, days: number): SolarDate {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day + days));
  return {
    year: utc.getUTCFullYear(),
    month: utc.getUTCMonth() + 1,
    day: utc.getUTCDate(),
  };
}

export function diffDays(from: SolarDate, to: SolarDate): number {
  const start = Date.UTC(from.year, from.month - 1, from.day);
  const end = Date.UTC(to.year, to.month - 1, to.day);
  return Math.round((end - start) / 86_400_000);
}

export function formatISODate(date: SolarDate): string {
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${date.year}-${month}-${day}`;
}

export function parseISODate(value: string): SolarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
  return isValidSolarDate(date) ? date : null;
}

/** `dd/MM/yyyy` as used in reminder copy. */
export function formatSolarSlash(date: SolarDate): string {
  const day = String(date.day).padStart(2, "0");
  const month = String(date.month).padStart(2, "0");
  return `${day}/${month}/${date.year}`;
}

/** Monday = 0 … Sunday = 6, for the civil date itself. */
export function weekdayIndexMonday(date: SolarDate): number {
  const utc = new Date(Date.UTC(date.year, date.month - 1, date.day));
  return (utc.getUTCDay() + 6) % 7;
}

export function shiftMonth(year: number, month: number, delta: number): { year: number; month: number } {
  const index = year * 12 + (month - 1) + delta;
  const nextYear = Math.floor(index / 12);
  const nextMonth = index - nextYear * 12 + 1;
  return { year: nextYear, month: nextMonth };
}

/**
 * Civil date in Vietnam. `timeZone` defaults to Asia/Ho_Chi_Minh so the result
 * does not follow the machine timezone.
 */
export function todayInVietnam(now: Date = new Date(), timeZone: string = VIETNAM_TIME_ZONE): SolarDate {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return { year, month, day };
}
