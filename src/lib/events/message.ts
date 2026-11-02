import { formatSolarSlash, type SolarDate } from "@/lib/dates";
import type { LunarDate } from "@/lib/lunar";

export function formatReminderMessage(input: {
  title: string;
  leadDays: number;
  solar: SolarDate;
  lunar: LunarDate;
}): string {
  const when = input.leadDays === 0 ? "Hôm nay là" : `Còn ${input.leadDays} ngày nữa là`;
  const leap = input.lunar.isLeapMonth ? " nhuận" : "";
  const lunarText = `${input.lunar.day}/${input.lunar.month}${leap} âm lịch`;
  const solarText = `${formatSolarSlash(input.solar)} dương lịch`;
  return `🔔 ${when} ${input.title} (${lunarText} — ${solarText}).`;
}
