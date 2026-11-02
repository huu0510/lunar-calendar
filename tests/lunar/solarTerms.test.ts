import { describe, expect, it } from "vitest";
import { addDays, compareSolar, type SolarDate } from "@/lib/dates";
import { SOLAR_TERMS, currentSolarTerm, solarTermOnDate } from "@/lib/lunar";

function findTerm(year: number, name: string): SolarDate | null {
  let cursor: SolarDate = { year, month: 1, day: 1 };
  const end: SolarDate = { year, month: 12, day: 31 };
  while (compareSolar(cursor, end) <= 0) {
    if (solarTermOnDate(cursor) === name) return cursor;
    cursor = addDays(cursor, 1);
  }
  return null;
}

describe("solar terms", () => {
  it("finds each of the 24 terms once in 2024", () => {
    const found = new Map<string, SolarDate>();
    let cursor: SolarDate = { year: 2024, month: 1, day: 1 };
    const end: SolarDate = { year: 2024, month: 12, day: 31 };
    while (compareSolar(cursor, end) <= 0) {
      const name = solarTermOnDate(cursor);
      if (name) found.set(name, cursor);
      cursor = addDays(cursor, 1);
    }
    expect([...found.keys()].sort()).toEqual([...SOLAR_TERMS].sort());
    expect(found.get("Xuân phân")?.month).toBe(3);
    expect(found.get("Hạ chí")?.month).toBe(6);
    expect(found.get("Thu phân")?.month).toBe(9);
    expect(found.get("Đông chí")?.month).toBe(12);
    expect(found.get("Lập xuân")?.month).toBe(2);
  });

  it("reports the term that begins on that date as the current term", () => {
    const lapXuan = findTerm(2024, "Lập xuân");
    expect(lapXuan).not.toBeNull();
    expect(currentSolarTerm(lapXuan!)).toBe("Lập xuân");
    expect(solarTermOnDate(addDays(lapXuan!, 1))).toBeNull();
  });
});
