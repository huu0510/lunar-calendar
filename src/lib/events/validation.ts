import { isValidSolarDate } from "@/lib/dates";
import { getLeapMonth, lunarMonthName, lunarToSolar } from "@/lib/lunar";
import type { CalendarKind, RecurrenceKind } from "@/lib/events/types";
import type { ChannelValue, EventTypeValue } from "@/lib/events/labels";

const EVENT_TYPES = ["HOLIDAY", "DEATH_ANNIVERSARY", "ANNIVERSARY", "CUSTOM"] as const;
const RECURRENCES = ["NONE", "YEARLY_SOLAR", "YEARLY_LUNAR"] as const;

export type ParsedEvent = {
  title: string;
  type: EventTypeValue;
  note: string | null;
  calendarType: CalendarKind;
  day: number;
  month: number;
  year: number | null;
  isLeapMonth: boolean;
  recurrence: RecurrenceKind;
  leadDays: number[];
  recipientIds: string[];
};

export type ParsedRecipient = {
  name: string;
  channel: ChannelValue;
  externalId: string;
};

function intField(value: FormDataEntryValue | null): number | null {
  if (typeof value !== "string" || !/^-?\d+$/.test(value.trim())) return null;
  return Number(value);
}

function solarMonthDayAllowed(month: number, day: number): boolean {
  if (month === 2 && day === 29) return true;
  return isValidSolarDate({ year: 2023, month, day }) || isValidSolarDate({ year: 2024, month, day });
}

export function parseEventForm(formData: FormData): { ok: true; value: ParsedEvent } | { ok: false; error: string } {
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return { ok: false, error: "Nhập tiêu đề." };
  if (title.length > 120) return { ok: false, error: "Tiêu đề tối đa 120 ký tự." };

  const type = String(formData.get("type") ?? "");
  if (!EVENT_TYPES.includes(type as (typeof EVENT_TYPES)[number])) {
    return { ok: false, error: "Loại sự kiện không hợp lệ." };
  }

  const noteRaw = String(formData.get("note") ?? "").trim();
  if (noteRaw.length > 2000) return { ok: false, error: "Ghi chú tối đa 2000 ký tự." };

  const recurrence = String(formData.get("recurrence") ?? "");
  if (!RECURRENCES.includes(recurrence as (typeof RECURRENCES)[number])) {
    return { ok: false, error: "Kiểu lặp không hợp lệ." };
  }
  const recurrenceKind = recurrence as RecurrenceKind;

  const day = intField(formData.get("day"));
  const month = intField(formData.get("month"));
  const yearField = intField(formData.get("year"));
  if (day == null || month == null) return { ok: false, error: "Ngày và tháng không hợp lệ." };

  let calendarType: CalendarKind = formData.get("calendarType") === "SOLAR" ? "SOLAR" : "LUNAR";
  let isLeapMonth = formData.get("isLeapMonth") === "on" || formData.get("isLeapMonth") === "true";
  let year: number | null = yearField;

  if (recurrenceKind === "YEARLY_SOLAR") {
    calendarType = "SOLAR";
    isLeapMonth = false;
    year = null;
  } else if (recurrenceKind === "YEARLY_LUNAR") {
    calendarType = "LUNAR";
    year = null;
  } else if (year == null) {
    return { ok: false, error: "Sự kiện một lần cần có năm." };
  }

  if (calendarType === "SOLAR") {
    isLeapMonth = false;
    if (recurrenceKind === "NONE") {
      if (year == null || !isValidSolarDate({ year, month, day })) {
        return { ok: false, error: "Ngày dương không hợp lệ." };
      }
    } else if (!solarMonthDayAllowed(month, day)) {
      return { ok: false, error: "Ngày dương không hợp lệ." };
    }
  } else {
    if (day < 1 || day > 30 || month < 1 || month > 12) {
      return { ok: false, error: "Ngày âm phải từ 1 đến 30, tháng từ 1 đến 12." };
    }
    if (recurrenceKind === "NONE" && year != null) {
      if (year < 1800 || year > 2299) return { ok: false, error: "Năm âm nằm ngoài phạm vi hỗ trợ." };
      if (isLeapMonth && getLeapMonth(year) !== month) {
        const leap = getLeapMonth(year);
        const hint = leap ? ` Năm ${year} nhuận tháng ${lunarMonthName(leap)}.` : ` Năm ${year} không nhuận.`;
        return { ok: false, error: `Năm âm này không có tháng nhuận đó.${hint}` };
      }
      const solar = lunarToSolar({ day, month, year, isLeapMonth });
      if (!solar) {
        return { ok: false, error: "Ngày âm này không tồn tại (tháng thiếu hoặc không có tháng nhuận)." };
      }
    }
  }

  const leadDays = [
    ...new Set(
      formData
        .getAll("leadDays")
        .map((value) => (typeof value === "string" ? Number(value) : NaN))
        .filter((value) => Number.isInteger(value) && value >= 0 && value <= 366),
    ),
  ].sort((left, right) => left - right);

  const recipientIds = [
    ...new Set(
      formData
        .getAll("recipientIds")
        .filter((value): value is string => typeof value === "string" && value.length > 0),
    ),
  ];

  return {
    ok: true,
    value: {
      title,
      type: type as EventTypeValue,
      note: noteRaw || null,
      calendarType,
      day,
      month,
      year,
      isLeapMonth: calendarType === "LUNAR" ? isLeapMonth : false,
      recurrence: recurrenceKind,
      leadDays,
      recipientIds,
    },
  };
}

export function parseRecipientForm(
  formData: FormData,
): { ok: true; value: ParsedRecipient } | { ok: false; error: string } {
  const name = String(formData.get("name") ?? "").trim();
  if (!name || name.length > 80) return { ok: false, error: "Nhập tên người nhận (tối đa 80 ký tự)." };
  const channel = String(formData.get("channel") ?? "");
  if (channel !== "TELEGRAM" && channel !== "ZALO") {
    return { ok: false, error: "Chọn Telegram hoặc Zalo." };
  }
  const externalId = String(formData.get("externalId") ?? "").trim();
  if (channel === "TELEGRAM" && !/^-?\d{1,20}$/.test(externalId)) {
    return { ok: false, error: "Chat ID Telegram là một dãy số (nhắn /start cho bot để lấy)." };
  }
  if (channel === "ZALO" && !/^\d{1,32}$/.test(externalId)) {
    return { ok: false, error: "User ID Zalo là một dãy số của người đã quan tâm OA." };
  }
  return { ok: true, value: { name, channel, externalId } };
}
