import { describe, expect, it } from "vitest";
import { lunarMonthLength, lunarToSolar } from "@/lib/lunar";
import { occurrenceOn, resolveLunarDate, resolveSolarDate } from "@/lib/events/recurrence";
import type { EventSchedule } from "@/lib/events/types";

function yearlyLunar(day: number, month: number, isLeapMonth: boolean): EventSchedule {
  return {
    calendarType: "LUNAR",
    day,
    month,
    year: null,
    isLeapMonth,
    recurrence: "YEARLY_LUNAR",
  };
}

describe("recurrence", () => {
  it("uses the regular month when the leap month is absent that year", () => {
    const inLeapYear = resolveLunarDate(15, 2, true, 2023);
    const inCommonYear = resolveLunarDate(15, 2, true, 2024);
    expect(inLeapYear).toEqual({ day: 15, month: 2, year: 2023, isLeapMonth: true });
    expect(inCommonYear).toEqual({ day: 15, month: 2, year: 2024, isLeapMonth: false });

    const event = yearlyLunar(15, 2, true);
    const leapSolar = lunarToSolar(inLeapYear!);
    const regularSolar = lunarToSolar(inCommonYear!);
    expect(occurrenceOn(event, leapSolar!)).toEqual(leapSolar);
    expect(occurrenceOn(event, regularSolar!)).toEqual(regularSolar);
    expect(leapSolar).not.toEqual(regularSolar);
  });

  it("falls back from lunar day 30 to 29 in a short month", () => {
    let shortMonth = 0;
    for (let month = 1; month <= 12; month += 1) {
      if (lunarMonthLength(2024, month, false) === 29) {
        shortMonth = month;
        break;
      }
    }
    expect(shortMonth).toBeGreaterThan(0);
    const resolved = resolveLunarDate(30, shortMonth, false, 2024);
    expect(resolved?.day).toBe(29);
    expect(lunarToSolar({ day: 30, month: shortMonth, year: 2024, isLeapMonth: false })).toBeNull();
    const solar = lunarToSolar(resolved!);
    expect(occurrenceOn(yearlyLunar(30, shortMonth, false), solar!)).toEqual(solar);
  });

  it("repeats a solar anniversary, including 29 February as 28 February", () => {
    const event: EventSchedule = {
      calendarType: "SOLAR",
      day: 29,
      month: 2,
      year: null,
      isLeapMonth: false,
      recurrence: "YEARLY_SOLAR",
    };
    expect(resolveSolarDate(2, 29, 2024)).toEqual({ year: 2024, month: 2, day: 29 });
    expect(resolveSolarDate(2, 29, 2025)).toEqual({ year: 2025, month: 2, day: 28 });
    expect(occurrenceOn(event, { year: 2025, month: 2, day: 28 })).toEqual({
      year: 2025,
      month: 2,
      day: 28,
    });
    expect(occurrenceOn(event, { year: 2025, month: 3, day: 1 })).toBeNull();
  });

  it("fires a one-time event only on its own date", () => {
    const event: EventSchedule = {
      calendarType: "SOLAR",
      day: 30,
      month: 4,
      year: 2026,
      isLeapMonth: false,
      recurrence: "NONE",
    };
    expect(occurrenceOn(event, { year: 2026, month: 4, day: 30 })).toEqual({
      year: 2026,
      month: 4,
      day: 30,
    });
    expect(occurrenceOn(event, { year: 2027, month: 4, day: 30 })).toBeNull();
  });
});
