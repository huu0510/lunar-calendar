"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatISODate, isValidSolarDate, type SolarDate } from "@/lib/dates";
import {
  formatLunarLong,
  getLeapMonth,
  lunarMonthName,
  lunarToSolar,
  solarToLunar,
} from "@/lib/lunar";
import { DaySummary } from "@/components/DaySummary";
import { holidaysOn } from "@/lib/lunar/holidays";
import { inputClass, labelClass } from "@/components/styles";

export function Converter({ today }: { today: SolarDate }) {
  const [mode, setMode] = useState<"solar" | "lunar">("solar");
  const [solar, setSolar] = useState(formatISODate(today));
  const [day, setDay] = useState(1);
  const [month, setMonth] = useState(1);
  const [year, setYear] = useState(today.year);
  const [leap, setLeap] = useState(false);

  const leapMonth = getLeapMonth(year);

  const result = useMemo(() => {
    if (mode === "solar") {
      const parsed = parseDateInput(solar);
      if (!parsed) return { error: "Chọn một ngày dương lịch hợp lệ." as const };
      const lunar = solarToLunar(parsed);
      return { solar: parsed, lunar };
    }
    if (leap && leapMonth !== month) {
      const hint = leapMonth
        ? `Năm ${year} nhuận tháng ${lunarMonthName(leapMonth)}.`
        : `Năm ${year} không có tháng nhuận.`;
      return { error: hint };
    }
    const lunar = { day, month, year, isLeapMonth: leap };
    const converted = lunarToSolar(lunar);
    if (!converted) return { error: "Ngày âm này không tồn tại (tháng thiếu hoặc không nhuận)." as const };
    return { solar: converted, lunar: solarToLunar(converted) };
  }, [mode, solar, day, month, year, leap, leapMonth]);

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,20rem)_1fr]">
      <form className="rounded-3xl border border-line bg-white p-5 shadow-sm" onSubmit={(event) => event.preventDefault()}>
        <div className="grid grid-cols-2 gap-2 rounded-full bg-paper p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => setMode("solar")}
            className={`rounded-full px-3 py-2 ${mode === "solar" ? "bg-indigo text-paper" : "text-muted"}`}
          >
            Dương sang âm
          </button>
          <button
            type="button"
            onClick={() => setMode("lunar")}
            className={`rounded-full px-3 py-2 ${mode === "lunar" ? "bg-indigo text-paper" : "text-muted"}`}
          >
            Âm sang dương
          </button>
        </div>
        {mode === "solar" ? (
          <label className={`${labelClass} mt-4`}>
            Ngày dương lịch
            <input className={inputClass} type="date" value={solar} onChange={(event) => setSolar(event.target.value)} />
          </label>
        ) : (
          <div className="mt-4 grid grid-cols-3 gap-2">
            <label className={labelClass}>
              Ngày
              <input className={inputClass} type="number" min={1} max={30} value={day} onChange={(event) => setDay(Number(event.target.value))} />
            </label>
            <label className={labelClass}>
              Tháng
              <input className={inputClass} type="number" min={1} max={12} value={month} onChange={(event) => setMonth(Number(event.target.value))} />
            </label>
            <label className={labelClass}>
              Năm
              <input className={inputClass} type="number" min={1800} max={2299} value={year} onChange={(event) => setYear(Number(event.target.value))} />
            </label>
            <label className="col-span-3 mt-2 flex items-center gap-2 text-sm">
              <input type="checkbox" checked={leap} onChange={(event) => setLeap(event.target.checked)} />
              Tháng nhuận
              {leapMonth ? <span className="text-muted">Năm {year} nhuận tháng {lunarMonthName(leapMonth)}.</span> : null}
            </label>
          </div>
        )}
      </form>
      <div>
        {"error" in result ? (
          <p className="rounded-3xl border border-line bg-white p-5 text-cinnabar">{result.error}</p>
        ) : (
          <div className="space-y-3">
            <DaySummary solar={result.solar} lunar={result.lunar} holidays={holidaysOn(result.lunar, result.solar)} />
            <p className="text-sm text-muted">{formatLunarLong(result.lunar)}</p>
            <Link href={`/day/${formatISODate(result.solar)}`} className="text-sm font-semibold text-cinnabar">
              Xem ngày này trên lịch
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function parseDateInput(value: string): SolarDate | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const date = { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
  return isValidSolarDate(date) ? date : null;
}
