import { describe, expect, it } from "vitest";
import { holidaysOn, lunarToSolar, solarToLunar } from "@/lib/lunar";

describe("Vietnamese holidays", () => {
  it("marks Tết Nguyên Đán and the solar national day", () => {
    const tet = { year: 2024, month: 2, day: 10 };
    expect(holidaysOn(solarToLunar(tet), tet)).toContain("Tết Nguyên Đán");
    const national = { year: 2026, month: 9, day: 2 };
    expect(holidaysOn(solarToLunar(national), national)).toContain("Ngày Quốc khánh");
    const children = { year: 2024, month: 6, day: 1 };
    expect(holidaysOn(solarToLunar(children), children)).toContain("Ngày Quốc tế Thiếu nhi");
  });

  it("does not apply lunar holidays to the leap month", () => {
    const leapNewYear = lunarToSolar({ day: 1, month: 2, year: 2023, isLeapMonth: true });
    expect(leapNewYear).not.toBeNull();
    const lunar = solarToLunar(leapNewYear!);
    expect(lunar.isLeapMonth).toBe(true);
    expect(holidaysOn(lunar, leapNewYear!)).not.toContain("Tết Nguyên Đán");
  });

  it("places Giỗ Tổ Hùng Vương on lunar 10/3", () => {
    const solar = lunarToSolar({ day: 10, month: 3, year: 2026, isLeapMonth: false });
    expect(solar).not.toBeNull();
    expect(holidaysOn(solarToLunar(solar!), solar!)).toContain("Giỗ Tổ Hùng Vương");
  });
});
