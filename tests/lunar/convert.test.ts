import { describe, expect, it } from "vitest";
import { addDays, formatISODate } from "@/lib/dates";
import { getLeapMonth, lunarMonthLength, lunarToSolar, solarToLunar, type LunarDate, type SolarDate } from "@/lib/lunar";

const TET: Array<{ solar: SolarDate; lunarYear: number }> = [
  { solar: { year: 2024, month: 2, day: 10 }, lunarYear: 2024 },
  { solar: { year: 2025, month: 1, day: 29 }, lunarYear: 2025 },
  { solar: { year: 2026, month: 2, day: 17 }, lunarYear: 2026 },
];

describe("solarToLunar / lunarToSolar", () => {
  it.each(TET)("maps Tết $lunarYear", ({ solar, lunarYear }) => {
    const lunar: LunarDate = { day: 1, month: 1, year: lunarYear, isLeapMonth: false };
    expect(solarToLunar(solar)).toEqual(lunar);
    expect(lunarToSolar(lunar)).toEqual(solar);
  });

  it("knows leap months of 2023 and 2025", () => {
    expect(getLeapMonth(2023)).toBe(2);
    expect(getLeapMonth(2025)).toBe(6);
    expect(getLeapMonth(2024)).toBeNull();
    expect(getLeapMonth(2026)).toBeNull();
    expect(getLeapMonth(2020)).toBe(4);
  });

  it("distinguishes regular and leap month 2 of 2023", () => {
    const regular = lunarToSolar({ day: 1, month: 2, year: 2023, isLeapMonth: false });
    const leap = lunarToSolar({ day: 1, month: 2, year: 2023, isLeapMonth: true });
    expect(regular).toEqual({ year: 2023, month: 2, day: 20 });
    expect(leap).toEqual({ year: 2023, month: 3, day: 22 });
    expect(solarToLunar(regular!)).toMatchObject({ month: 2, isLeapMonth: false, year: 2023 });
    expect(solarToLunar(leap!)).toEqual({ day: 1, month: 2, year: 2023, isLeapMonth: true });
    expect(solarToLunar({ year: 2023, month: 4, day: 19 }).isLeapMonth).toBe(true);
    expect(solarToLunar({ year: 2023, month: 4, day: 20 })).toMatchObject({
      day: 1,
      month: 3,
      isLeapMonth: false,
    });
  });

  it("distinguishes regular and leap month 6 of 2025", () => {
    const leap = lunarToSolar({ day: 1, month: 6, year: 2025, isLeapMonth: true });
    const regular = lunarToSolar({ day: 1, month: 6, year: 2025, isLeapMonth: false });
    expect(leap).toEqual({ year: 2025, month: 7, day: 25 });
    expect(regular).not.toEqual(leap);
    expect(solarToLunar(leap!)).toEqual({ day: 1, month: 6, year: 2025, isLeapMonth: true });
    expect(solarToLunar({ year: 2025, month: 8, day: 22 }).isLeapMonth).toBe(true);
    expect(solarToLunar({ year: 2025, month: 8, day: 23 })).toMatchObject({
      day: 1,
      month: 7,
      isLeapMonth: false,
    });
  });

  it("rejects lunar dates that do not exist", () => {
    expect(lunarToSolar({ day: 1, month: 2, year: 2024, isLeapMonth: true })).toBeNull();
    expect(lunarToSolar({ day: 1, month: 8, year: 2025, isLeapMonth: true })).toBeNull();
    const short = findShortMonth(2024);
    expect(short).not.toBeNull();
    expect(lunarMonthLength(2024, short!, false)).toBe(29);
    expect(lunarToSolar({ day: 30, month: short!, year: 2024, isLeapMonth: false })).toBeNull();
  });

  it("does not emit lunar day 0 when the new-moon index ticks early", () => {
    expect(solarToLunar({ year: 2054, month: 5, day: 7 })).toEqual({
      day: 30,
      month: 3,
      year: 2054,
      isLeapMonth: false,
    });
  });

  it("matches published anchor dates", () => {
    expect(solarToLunar({ year: 2000, month: 1, day: 1 })).toEqual({
      day: 25,
      month: 11,
      year: 1999,
      isLeapMonth: false,
    });
    expect(solarToLunar({ year: 2020, month: 5, day: 23 })).toEqual({
      day: 1,
      month: 4,
      year: 2020,
      isLeapMonth: true,
    });
  });

  it("round-trips a wide range of solar dates", () => {
    let cursor: SolarDate = { year: 1900, month: 1, day: 1 };
    const end = formatISODate({ year: 2100, month: 12, day: 31 });
    let count = 0;
    while (formatISODate(cursor) <= end) {
      const lunar = solarToLunar(cursor);
      expect(lunarToSolar(lunar)).toEqual(cursor);
      cursor = addDays(cursor, 1);
      count += 1;
    }
    expect(count).toBeGreaterThan(70_000);
  }, 30_000);
});

function findShortMonth(year: number): number | null {
  for (let month = 1; month <= 12; month += 1) {
    if (lunarMonthLength(year, month, false) === 29) return month;
  }
  return null;
}
