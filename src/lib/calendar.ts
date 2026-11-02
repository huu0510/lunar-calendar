import { addDays, sameSolar, weekdayIndexMonday, type SolarDate } from "@/lib/dates";
import { holidaysOn, solarTermOnDate, solarToLunar, type LunarDate } from "@/lib/lunar";

export type MonthCell = {
  solar: SolarDate;
  lunar: LunarDate;
  inMonth: boolean;
  isToday: boolean;
  weekday: number;
  holidays: string[];
  solarTerm: string | null;
};

export function buildMonthGrid(year: number, month: number, today: SolarDate): MonthCell[][] {
  const firstWeekday = weekdayIndexMonday({ year, month, day: 1 });
  let cursor = addDays({ year, month, day: 1 }, -firstWeekday);
  const weeks: MonthCell[][] = [];

  for (let week = 0; week < 6; week += 1) {
    const row: MonthCell[] = [];
    for (let day = 0; day < 7; day += 1) {
      const lunar = solarToLunar(cursor);
      row.push({
        solar: cursor,
        lunar,
        inMonth: cursor.month === month && cursor.year === year,
        isToday: sameSolar(cursor, today),
        weekday: day,
        holidays: holidaysOn(lunar, cursor),
        solarTerm: solarTermOnDate(cursor),
      });
      cursor = addDays(cursor, 1);
    }
    weeks.push(row);
  }

  const last = weeks[5];
  if (last && last.every((cell) => !cell.inMonth)) weeks.pop();
  return weeks;
}
