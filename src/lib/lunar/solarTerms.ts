import { addDays } from "@/lib/dates";
import { jdFromDate, sunLongitude, VN_OFFSET_HOURS } from "@/lib/lunar/convert";
import type { SolarDate } from "@/lib/lunar/types";

/** 24 tiết khí, indexed by floor(sun longitude / 15°) starting at the March equinox. */
export const SOLAR_TERMS = [
  "Xuân phân",
  "Thanh minh",
  "Cốc vũ",
  "Lập hạ",
  "Tiểu mãn",
  "Mang chủng",
  "Hạ chí",
  "Tiểu thử",
  "Đại thử",
  "Lập thu",
  "Xử thử",
  "Bạch lộ",
  "Thu phân",
  "Hàn lộ",
  "Sương giáng",
  "Lập đông",
  "Tiểu tuyết",
  "Đại tuyết",
  "Đông chí",
  "Tiểu hàn",
  "Đại hàn",
  "Lập xuân",
  "Vũ thủy",
  "Kinh trập",
] as const;

function termIndexAt(jd: number): number {
  const radians = sunLongitude(jd);
  const degrees = (radians * 180) / Math.PI;
  return Math.floor(degrees / 15) % 24;
}

function midnightJd(solar: SolarDate, timeZone: number): number {
  return jdFromDate(solar.day, solar.month, solar.year) - 0.5 - timeZone / 24;
}

/**
 * Name of the tiết khí that begins on this civil date in Vietnam, or null.
 * The date is the local day that contains the instant the sun crosses a
 * multiple of 15°.
 */
export function solarTermOnDate(solar: SolarDate, timeZone: number = VN_OFFSET_HOURS): string | null {
  const current = termIndexAt(midnightJd(solar, timeZone));
  const next = termIndexAt(midnightJd(addDays(solar, 1), timeZone));
  if (current === next) return null;
  return SOLAR_TERMS[next] ?? null;
}

/** Tiết khí in force on this date. On the day a term begins, that new term is returned. */
export function currentSolarTerm(solar: SolarDate, timeZone: number = VN_OFFSET_HOURS): string {
  return solarTermOnDate(solar, timeZone) ?? SOLAR_TERMS[termIndexAt(midnightJd(solar, timeZone))] ?? "";
}
