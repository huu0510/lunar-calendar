import { formatSolarSlash, weekdayIndexMonday, type SolarDate } from "@/lib/dates";
import { WEEKDAY_LONG } from "@/lib/locale";
import {
  currentSolarTerm,
  dayCanChi,
  formatLunarLong,
  monthCanChi,
  solarTermOnDate,
  yearCanChi,
  type LunarDate,
} from "@/lib/lunar";

export function DaySummary({ solar, lunar, holidays }: { solar: SolarDate; lunar: LunarDate; holidays: string[] }) {
  const weekday = WEEKDAY_LONG[weekdayIndexMonday(solar)] ?? "";
  const exactTerm = solarTermOnDate(solar);
  const term = exactTerm ?? currentSolarTerm(solar);
  const cards = [
    { label: "Ngày", value: dayCanChi(solar) },
    { label: "Tháng", value: monthCanChi(lunar.month, lunar.year) },
    { label: "Năm", value: yearCanChi(lunar.year) },
  ];

  return (
    <section className="rounded-3xl border border-line bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-muted">{weekday}</p>
      <h1 className="font-serif text-4xl font-semibold tracking-tight text-ink">{formatSolarSlash(solar)}</h1>
      <p className="mt-2 text-lg text-cinnabar-deep">{formatLunarLong(lunar)}</p>
      <p className="mt-1 text-sm text-muted">
        {exactTerm ? `Tiết khí: ${exactTerm}` : `Đang trong tiết ${term}`}
      </p>
      <dl className="mt-5 grid grid-cols-3 gap-2">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl bg-paper px-2 py-3 text-center">
            <dt className="text-[11px] font-semibold tracking-wide text-muted uppercase">{card.label}</dt>
            <dd className="mt-1 font-serif text-sm font-semibold sm:text-base">{card.value.full}</dd>
            <dd className="text-[11px] text-muted">
              {card.label === "Năm" ? card.value.animal : card.value.element}
            </dd>
          </div>
        ))}
      </dl>
      {holidays.length > 0 ? (
        <ul className="mt-4 flex flex-wrap gap-2">
          {holidays.map((name) => (
            <li key={name} className="rounded-full bg-[#f8ebe6] px-3 py-1 text-sm font-medium text-cinnabar">
              {name}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
