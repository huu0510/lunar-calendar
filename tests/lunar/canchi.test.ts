import { describe, expect, it } from "vitest";
import { dayCanChi, monthCanChi, yearCanChi } from "@/lib/lunar";

describe("Can Chi", () => {
  it("names Tết days, months, and years", () => {
    expect(dayCanChi({ year: 2024, month: 2, day: 10 }).full).toBe("Giáp Thìn");
    expect(monthCanChi(1, 2024).full).toBe("Bính Dần");
    expect(yearCanChi(2024).full).toBe("Giáp Thìn");
    expect(yearCanChi(2024).animal).toBe("Rồng");

    expect(dayCanChi({ year: 2025, month: 1, day: 29 }).full).toBe("Mậu Tuất");
    expect(yearCanChi(2025).full).toBe("Ất Tỵ");
    expect(yearCanChi(2023).full).toBe("Quý Mão");
    expect(yearCanChi(2026).full).toBe("Bính Ngọ");
  });

  it("gives a leap month the same Can Chi as the regular month", () => {
    expect(monthCanChi(2, 2023).full).toBe(monthCanChi(2, 2023).full);
    expect(monthCanChi(2, 2023).full).toBe("Ất Mão");
    expect(monthCanChi(6, 2025).full).toBe("Quý Mùi");
  });

  it("uses the lunar year, so 1 January 2024 is still Quý Mão", () => {
    expect(yearCanChi(2023).full).toBe("Quý Mão");
    expect(yearCanChi(2024).full).not.toBe(yearCanChi(2023).full);
  });
});
