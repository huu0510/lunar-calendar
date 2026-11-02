import { diffDays } from "@/lib/dates";
import type { LunarDate, SolarDate } from "@/lib/lunar/types";

/**
 * Vietnamese lunar calendar (UTC+7).
 *
 * The rules follow the astronomical method published by Hồ Ngọc Đức for Vietnam,
 * not the Chinese calendar (UTC+8): a lunar month begins on the local day of the
 * new moon, month 11 contains the winter solstice, and in a 13-month year the
 * leap month is the first month after that solstice with no major solar term.
 *
 * The series below are the Meeus new-moon and solar-longitude terms used by that
 * method, evaluated at a fixed UTC+7 offset so results match Vietnamese almanacs.
 */
export const VN_OFFSET_HOURS = 7;

function floor(value: number): number {
  return Math.floor(value);
}

/** Julian day number at noon UTC for a Gregorian (or Julian, before 1582) date. */
export function jdFromDate(day: number, month: number, year: number): number {
  const a = floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  let jd = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - floor(y / 100) + floor(y / 400) - 32045;
  if (jd < 2299161) {
    jd = day + floor((153 * m + 2) / 5) + 365 * y + floor(y / 4) - 32083;
  }
  return jd;
}

function jdToDate(jd: number): SolarDate | null {
  let a: number;
  let b: number;
  let c: number;
  if (jd > 2299160) {
    a = jd + 32044;
    b = floor((4 * a + 3) / 146097);
    c = a - floor((b * 146097) / 4);
  } else {
    b = 0;
    c = jd + 32082;
  }
  const d = floor((4 * c + 3) / 1461);
  const e = c - floor((1461 * d) / 4);
  const m = floor((5 * e + 2) / 153);
  const day = e - floor((153 * m + 2) / 5) + 1;
  const month = m + 3 - 12 * floor(m / 10);
  const year = b * 100 + d - 4800 + floor(m / 10);
  if (day === 0 || month === 0 || year === 0) return null;
  return { day, month, year };
}

/** Ecliptic longitude of the sun in radians, normalized to [0, 2π). */
export function sunLongitude(jdn: number): number {
  const t = (jdn - 2451545.0) / 36525;
  const t2 = t * t;
  const dr = Math.PI / 180;
  const anomaly = 357.5291 + 35999.0503 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
  const meanLongitude = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
  let correction = (1.9146 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * anomaly);
  correction += (0.019993 - 0.000101 * t) * Math.sin(dr * 2 * anomaly) + 0.00029 * Math.sin(dr * 3 * anomaly);
  let longitude = (meanLongitude + correction) * dr;
  longitude -= Math.PI * 2 * floor(longitude / (Math.PI * 2));
  return longitude;
}

function newMoon(k: number): number {
  const t = k / 1236.85;
  const t2 = t * t;
  const t3 = t2 * t;
  const dr = Math.PI / 180;
  let jd = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
  jd += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
  const sunAnomaly = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
  const moonAnomaly = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
  const latitude = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
  let correction = (0.1734 - 0.000393 * t) * Math.sin(sunAnomaly * dr) + 0.0021 * Math.sin(2 * dr * sunAnomaly);
  correction -= 0.4068 * Math.sin(moonAnomaly * dr);
  correction += 0.0161 * Math.sin(dr * 2 * moonAnomaly);
  correction -= 0.0004 * Math.sin(dr * 3 * moonAnomaly);
  correction += 0.0104 * Math.sin(dr * 2 * latitude);
  correction -= 0.0051 * Math.sin(dr * (sunAnomaly + moonAnomaly));
  correction -= 0.0074 * Math.sin(dr * (sunAnomaly - moonAnomaly));
  correction += 0.0004 * Math.sin(dr * (2 * latitude + sunAnomaly));
  correction -= 0.0004 * Math.sin(dr * (2 * latitude - sunAnomaly));
  correction -= 0.0006 * Math.sin(dr * (2 * latitude + moonAnomaly));
  correction += 0.001 * Math.sin(dr * (2 * latitude - moonAnomaly));
  correction += 0.0005 * Math.sin(dr * (2 * moonAnomaly + sunAnomaly));
  const deltaT =
    t < -11
      ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3
      : -0.000278 + 0.000265 * t + 0.000262 * t2;
  return jd + correction - deltaT;
}

/** Local calendar day of the k-th new moon. */
function newMoonDay(k: number, timeZone: number): number {
  return floor(newMoon(k) + 0.5 + timeZone / 24);
}

/** Major-term index (0–11, 30° each) at local midnight of a Julian day. */
function majorSolarTerm(dayNumber: number, timeZone: number): number {
  return floor((sunLongitude(dayNumber - 0.5 - timeZone / 24) / Math.PI) * 6);
}

/** Julian day on which lunar month 11 (the month of the winter solstice) begins. */
function lunarMonth11(year: number, timeZone: number): number {
  const k = floor((jdFromDate(31, 12, year) - 2415021) / 29.530588853);
  let monthStart = newMoonDay(k, timeZone);
  if (majorSolarTerm(monthStart, timeZone) >= 9) {
    monthStart = newMoonDay(k - 1, timeZone);
  }
  return monthStart;
}

/** Offset of the leap month after the month that starts on `month11Start`. */
function leapMonthOffset(month11Start: number, timeZone: number): number {
  const k = floor((month11Start - 2415021.076998695) / 29.530588853 + 0.5);
  let index = 1;
  let arc = majorSolarTerm(newMoonDay(k + index, timeZone), timeZone);
  let previous = 0;
  do {
    previous = arc;
    index += 1;
    arc = majorSolarTerm(newMoonDay(k + index, timeZone), timeZone);
  } while (arc !== previous && index < 14);
  return index - 1;
}

export function solarToLunar(solar: SolarDate, timeZone: number = VN_OFFSET_HOURS): LunarDate {
  const dayNumber = jdFromDate(solar.day, solar.month, solar.year);
  const k = floor((dayNumber - 2415021.076998695) / 29.530588853);
  let monthStart = newMoonDay(k + 1, timeZone);
  if (monthStart > dayNumber) monthStart = newMoonDay(k, timeZone);
  // The synodic index can tick one day before the local new-moon date, which
  // would otherwise produce lunar day 0. Step back one more new moon.
  if (monthStart > dayNumber) monthStart = newMoonDay(k - 1, timeZone);

  let month11 = lunarMonth11(solar.year, timeZone);
  let nextMonth11 = month11;
  let lunarYear: number;
  if (month11 >= monthStart) {
    lunarYear = solar.year;
    month11 = lunarMonth11(solar.year - 1, timeZone);
  } else {
    lunarYear = solar.year + 1;
    nextMonth11 = lunarMonth11(solar.year + 1, timeZone);
  }

  const lunarDay = dayNumber - monthStart + 1;
  const diff = floor((monthStart - month11) / 29);
  let isLeapMonth = false;
  let lunarMonth = diff + 11;
  if (nextMonth11 - month11 > 365) {
    const leapOffset = leapMonthOffset(month11, timeZone);
    if (diff >= leapOffset) {
      lunarMonth = diff + 10;
      if (diff === leapOffset) isLeapMonth = true;
    }
  }
  if (lunarMonth > 12) lunarMonth -= 12;
  if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;

  return { day: lunarDay, month: lunarMonth, year: lunarYear, isLeapMonth };
}

function lunarToSolarUnchecked(lunar: LunarDate, timeZone: number): SolarDate | null {
  const { day, month, year, isLeapMonth } = lunar;
  if (day < 1 || day > 30 || month < 1 || month > 12) return null;

  const month11 = month < 11 ? lunarMonth11(year - 1, timeZone) : lunarMonth11(year, timeZone);
  const nextMonth11 = month < 11 ? lunarMonth11(year, timeZone) : lunarMonth11(year + 1, timeZone);
  const k = floor(0.5 + (month11 - 2415021.076998695) / 29.530588853);
  let offset = month - 11;
  if (offset < 0) offset += 12;

  if (nextMonth11 - month11 > 365) {
    const leapOffset = leapMonthOffset(month11, timeZone);
    let leapMonth = leapOffset - 2;
    if (leapMonth < 0) leapMonth += 12;
    if (isLeapMonth && month !== leapMonth) return null;
    if (isLeapMonth || offset >= leapOffset) offset += 1;
  } else if (isLeapMonth) {
    return null;
  }

  const monthStart = newMoonDay(k + offset, timeZone);
  return jdToDate(monthStart + day - 1);
}

/**
 * Solar date of a lunar date, or null when that lunar day does not exist
 * (no such leap month, or day 30 of a 29-day month).
 */
export function lunarToSolar(lunar: LunarDate, timeZone: number = VN_OFFSET_HOURS): SolarDate | null {
  const solar = lunarToSolarUnchecked(lunar, timeZone);
  if (!solar) return null;
  const back = solarToLunar(solar, timeZone);
  if (
    back.day !== lunar.day ||
    back.month !== lunar.month ||
    back.year !== lunar.year ||
    back.isLeapMonth !== lunar.isLeapMonth
  ) {
    return null;
  }
  return solar;
}

/** Leap month number of a lunar year, or null when the year is not a leap year. */
export function getLeapMonth(lunarYear: number, timeZone: number = VN_OFFSET_HOURS): number | null {
  for (let month = 1; month <= 12; month += 1) {
    const found = lunarToSolarUnchecked(
      { day: 1, month, year: lunarYear, isLeapMonth: true },
      timeZone,
    );
    if (found) return month;
  }
  return null;
}

/** Length of a lunar month in days (29 or 30), or null if that month does not exist. */
export function lunarMonthLength(
  lunarYear: number,
  month: number,
  isLeapMonth: boolean,
  timeZone: number = VN_OFFSET_HOURS,
): number | null {
  const start = lunarToSolar({ day: 1, month, year: lunarYear, isLeapMonth }, timeZone);
  if (!start) return null;
  const next = nextMonthStart(lunarYear, month, isLeapMonth, timeZone);
  if (!next) return null;
  const length = diffDays(start, next);
  if (length !== 29 && length !== 30) return null;
  return length;
}

function nextMonthStart(
  lunarYear: number,
  month: number,
  isLeapMonth: boolean,
  timeZone: number,
): SolarDate | null {
  if (!isLeapMonth && getLeapMonth(lunarYear, timeZone) === month) {
    return lunarToSolar({ day: 1, month, year: lunarYear, isLeapMonth: true }, timeZone);
  }
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? lunarYear + 1 : lunarYear;
  return lunarToSolar({ day: 1, month: nextMonth, year: nextYear, isLeapMonth: false }, timeZone);
}
