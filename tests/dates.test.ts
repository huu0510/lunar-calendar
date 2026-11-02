import { describe, expect, it } from "vitest";
import { addDays, parseISODate, todayInVietnam, weekdayIndexMonday } from "@/lib/dates";
import { buildMonthGrid } from "@/lib/calendar";

describe("Vietnam dates", () => {
  it("computes the civil date in Asia/Ho_Chi_Minh, not the host zone", () => {
    expect(todayInVietnam(new Date("2026-11-01T16:30:00.000Z"))).toEqual({
      year: 2026,
      month: 11,
      day: 1,
    });
    expect(todayInVietnam(new Date("2026-11-01T17:30:00.000Z"))).toEqual({
      year: 2026,
      month: 11,
      day: 2,
    });
  });

  it("builds November 2026 with Monday the 2nd in the second week", () => {
    const weeks = buildMonthGrid(2026, 11, { year: 2026, month: 11, day: 2 });
    expect(weeks[0]?.[0]?.solar).toEqual({ year: 2026, month: 10, day: 26 });
    expect(weeks[1]?.[0]?.solar).toEqual({ year: 2026, month: 11, day: 2 });
    expect(weeks[1]?.[0]?.isToday).toBe(true);
    expect(weekdayIndexMonday({ year: 2026, month: 11, day: 2 })).toBe(0);
    expect(parseISODate("2026-11-02")).toEqual({ year: 2026, month: 11, day: 2 });
    expect(parseISODate("2026-02-31")).toBeNull();
    expect(addDays({ year: 2024, month: 2, day: 28 }, 1)).toEqual({ year: 2024, month: 2, day: 29 });
  });
});
