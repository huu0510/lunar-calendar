import { monthCanChi, yearCanChi } from "@/lib/lunar/canchi";
import type { LunarDate } from "@/lib/lunar/types";

const LUNAR_MONTH_NAMES = [
  "",
  "Giêng",
  "Hai",
  "Ba",
  "Tư",
  "Năm",
  "Sáu",
  "Bảy",
  "Tám",
  "Chín",
  "Mười",
  "Mười một",
  "Chạp",
] as const;

export function lunarMonthName(month: number): string {
  return LUNAR_MONTH_NAMES[month] ?? String(month);
}

export function formatLunarLong(lunar: LunarDate): string {
  const dayLabel = lunar.day === 1 ? "Mùng 1" : lunar.day === 15 ? "Ngày rằm" : `Ngày ${lunar.day}`;
  const leap = lunar.isLeapMonth ? " nhuận" : "";
  const year = yearCanChi(lunar.year);
  return `${dayLabel} tháng ${lunarMonthName(lunar.month)}${leap} năm ${year.full}`;
}

export function formatLunarCompact(lunar: LunarDate): string {
  const leap = lunar.isLeapMonth ? " nhuận" : "";
  return `${lunar.day}/${lunar.month}${leap}`;
}

export function formatMonthCanChi(lunar: LunarDate): string {
  return monthCanChi(lunar.month, lunar.year).full;
}
