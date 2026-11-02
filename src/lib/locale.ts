export const WEEKDAY_SHORT = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"] as const;

export const WEEKDAY_LONG = [
  "Thứ Hai",
  "Thứ Ba",
  "Thứ Tư",
  "Thứ Năm",
  "Thứ Sáu",
  "Thứ Bảy",
  "Chủ Nhật",
] as const;

export function monthTitle(year: number, month: number): string {
  return `Tháng ${month} năm ${year}`;
}
