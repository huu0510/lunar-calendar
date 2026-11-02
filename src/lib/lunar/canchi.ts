import { jdFromDate } from "@/lib/lunar/convert";
import type { SolarDate } from "@/lib/lunar/types";

export const HEAVENLY_STEMS = [
  "Giáp",
  "Ất",
  "Bính",
  "Đinh",
  "Mậu",
  "Kỷ",
  "Canh",
  "Tân",
  "Nhâm",
  "Quý",
] as const;

export const EARTHLY_BRANCHES = [
  "Tý",
  "Sửu",
  "Dần",
  "Mão",
  "Thìn",
  "Tỵ",
  "Ngọ",
  "Mùi",
  "Thân",
  "Dậu",
  "Tuất",
  "Hợi",
] as const;

/** Vietnamese zodiac. Mão is the cat, not the rabbit. */
export const BRANCH_ANIMALS = [
  "Chuột",
  "Trâu",
  "Hổ",
  "Mèo",
  "Rồng",
  "Rắn",
  "Ngựa",
  "Dê",
  "Khỉ",
  "Gà",
  "Chó",
  "Lợn",
] as const;

const STEM_ELEMENTS = ["Mộc", "Mộc", "Hỏa", "Hỏa", "Thổ", "Thổ", "Kim", "Kim", "Thủy", "Thủy"] as const;

export type CanChi = {
  can: string;
  chi: string;
  full: string;
  canIndex: number;
  chiIndex: number;
  animal: string;
  element: string;
};

function mod(value: number, size: number): number {
  return ((value % size) + size) % size;
}

function build(canIndex: number, chiIndex: number): CanChi {
  const can = HEAVENLY_STEMS[canIndex] ?? "";
  const chi = EARTHLY_BRANCHES[chiIndex] ?? "";
  return {
    can,
    chi,
    full: `${can} ${chi}`,
    canIndex,
    chiIndex,
    animal: BRANCH_ANIMALS[chiIndex] ?? "",
    element: STEM_ELEMENTS[canIndex] ?? "",
  };
}

/** Sexagenary day, from the Julian day number. Independent of the lunar month. */
export function dayCanChi(solar: SolarDate): CanChi {
  const jd = jdFromDate(solar.day, solar.month, solar.year);
  return build(mod(jd + 9, 10), mod(jd + 1, 12));
}

/**
 * Can Chi of a lunar month. Month 1 is always Dần. A leap month uses the same
 * stem and branch as the regular month of that number.
 */
export function monthCanChi(lunarMonth: number, lunarYear: number): CanChi {
  const yearStem = mod(lunarYear + 6, 10);
  const stem = mod((yearStem % 5) * 2 + 2 + (lunarMonth - 1), 10);
  const branch = mod(lunarMonth + 1, 12);
  return build(stem, branch);
}

/** Can Chi of a lunar year. The cycle changes at Tết, not on 1 January. */
export function yearCanChi(lunarYear: number): CanChi {
  return build(mod(lunarYear + 6, 10), mod(lunarYear + 8, 12));
}
