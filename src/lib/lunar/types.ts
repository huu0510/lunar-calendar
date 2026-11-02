/** Gregorian date in the Asia/Ho_Chi_Minh calendar (not a timezone-shifted instant). */
export type SolarDate = {
  year: number;
  month: number;
  day: number;
};

/** Vietnamese lunar date. `isLeapMonth` marks tháng nhuận. */
export type LunarDate = {
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
};
