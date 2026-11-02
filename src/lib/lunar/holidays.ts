import type { LunarDate, SolarDate } from "@/lib/lunar/types";

export type Holiday = {
  name: string;
  calendar: "SOLAR" | "LUNAR";
  month: number;
  day: number;
};

/**
 * Major Vietnamese public holidays and traditional festivals.
 * Lunar holidays apply to the regular month only, never the leap month.
 */
export const HOLIDAYS: readonly Holiday[] = [
  { name: "Tết Dương lịch", calendar: "SOLAR", month: 1, day: 1 },
  { name: "Ngày thành lập Đảng Cộng sản Việt Nam", calendar: "SOLAR", month: 2, day: 3 },
  { name: "Ngày Quốc tế Phụ nữ", calendar: "SOLAR", month: 3, day: 8 },
  { name: "Ngày thành lập Đoàn Thanh niên Cộng sản Hồ Chí Minh", calendar: "SOLAR", month: 3, day: 26 },
  { name: "Ngày Giải phóng miền Nam, thống nhất đất nước", calendar: "SOLAR", month: 4, day: 30 },
  { name: "Ngày Quốc tế Lao động", calendar: "SOLAR", month: 5, day: 1 },
  { name: "Ngày Chiến thắng Điện Biên Phủ", calendar: "SOLAR", month: 5, day: 7 },
  { name: "Ngày sinh Chủ tịch Hồ Chí Minh", calendar: "SOLAR", month: 5, day: 19 },
  { name: "Ngày Quốc tế Thiếu nhi", calendar: "SOLAR", month: 6, day: 1 },
  { name: "Ngày Thương binh - Liệt sĩ", calendar: "SOLAR", month: 7, day: 27 },
  { name: "Cách mạng tháng Tám", calendar: "SOLAR", month: 8, day: 19 },
  { name: "Ngày Quốc khánh", calendar: "SOLAR", month: 9, day: 2 },
  { name: "Ngày Giải phóng Thủ đô", calendar: "SOLAR", month: 10, day: 10 },
  { name: "Ngày Phụ nữ Việt Nam", calendar: "SOLAR", month: 10, day: 20 },
  { name: "Ngày Nhà giáo Việt Nam", calendar: "SOLAR", month: 11, day: 20 },
  { name: "Ngày thành lập Quân đội Nhân dân Việt Nam", calendar: "SOLAR", month: 12, day: 22 },
  { name: "Lễ Giáng sinh", calendar: "SOLAR", month: 12, day: 25 },
  { name: "Tết Nguyên Đán", calendar: "LUNAR", month: 1, day: 1 },
  { name: "Mùng 2 Tết", calendar: "LUNAR", month: 1, day: 2 },
  { name: "Mùng 3 Tết", calendar: "LUNAR", month: 1, day: 3 },
  { name: "Tết Nguyên Tiêu", calendar: "LUNAR", month: 1, day: 15 },
  { name: "Tết Hàn thực", calendar: "LUNAR", month: 3, day: 3 },
  { name: "Giỗ Tổ Hùng Vương", calendar: "LUNAR", month: 3, day: 10 },
  { name: "Lễ Phật Đản", calendar: "LUNAR", month: 4, day: 15 },
  { name: "Tết Đoan Ngọ", calendar: "LUNAR", month: 5, day: 5 },
  { name: "Lễ Vu Lan", calendar: "LUNAR", month: 7, day: 15 },
  { name: "Tết Trung Thu", calendar: "LUNAR", month: 8, day: 15 },
  { name: "Tết Trùng Cửu", calendar: "LUNAR", month: 9, day: 9 },
  { name: "Ông Táo chầu trời", calendar: "LUNAR", month: 12, day: 23 },
];

export function holidaysOn(lunar: LunarDate, solar: SolarDate): string[] {
  const names: string[] = [];
  for (const holiday of HOLIDAYS) {
    if (holiday.calendar === "SOLAR") {
      if (holiday.month === solar.month && holiday.day === solar.day) names.push(holiday.name);
      continue;
    }
    if (
      !lunar.isLeapMonth &&
      holiday.month === lunar.month &&
      holiday.day === lunar.day
    ) {
      names.push(holiday.name);
    }
  }
  return names;
}
