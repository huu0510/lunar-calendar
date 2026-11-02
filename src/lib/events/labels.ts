export const EVENT_TYPE_LABELS = {
  HOLIDAY: "Ngày lễ",
  DEATH_ANNIVERSARY: "Ngày giỗ",
  ANNIVERSARY: "Kỷ niệm",
  CUSTOM: "Tuỳ chỉnh",
} as const;

export const RECURRENCE_LABELS = {
  NONE: "Một lần",
  YEARLY_SOLAR: "Hằng năm theo dương lịch",
  YEARLY_LUNAR: "Hằng năm theo âm lịch",
} as const;

export const CHANNEL_LABELS = {
  TELEGRAM: "Telegram",
  ZALO: "Zalo",
} as const;

export type EventTypeValue = keyof typeof EVENT_TYPE_LABELS;
export type RecurrenceValue = keyof typeof RECURRENCE_LABELS;
export type ChannelValue = keyof typeof CHANNEL_LABELS;
