"use client";

import { useState } from "react";
import { EVENT_TYPE_LABELS, RECURRENCE_LABELS } from "@/lib/events/labels";
import { CHANNEL_LABELS } from "@/lib/events/labels";
import { inputClass, labelClass, primaryButton } from "@/components/styles";

const LEAD_OPTIONS = [0, 1, 3, 7, 14, 30];

export type EventFormValues = {
  title: string;
  type: string;
  note: string;
  recurrence: string;
  calendarType: string;
  day: number;
  month: number;
  year: number;
  isLeapMonth: boolean;
  leadDays: number[];
  recipientIds: string[];
};

export function EventForm({
  action,
  recipients,
  initial,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<{ error: string } | void>;
  recipients: Array<{ id: string; name: string; channel: "TELEGRAM" | "ZALO" }>;
  initial: EventFormValues;
  submitLabel: string;
}) {
  const [recurrence, setRecurrence] = useState(initial.recurrence);
  const [calendarType, setCalendarType] = useState(initial.calendarType);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const lunar = recurrence === "YEARLY_LUNAR" || (recurrence === "NONE" && calendarType === "LUNAR");

  return (
    <form
      className="space-y-4 rounded-3xl border border-line bg-white p-5 shadow-sm"
      action={async (formData) => {
        setPending(true);
        setError(null);
        const result = await action(formData);
        if (result?.error) {
          setError(result.error);
          setPending(false);
        }
      }}
    >
      <label className={labelClass}>
        Tiêu đề
        <input className={inputClass} name="title" required maxLength={120} defaultValue={initial.title} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className={labelClass}>
          Loại
          <select className={inputClass} name="type" defaultValue={initial.type}>
            {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label className={labelClass}>
          Lặp lại
          <select
            className={inputClass}
            name="recurrence"
            value={recurrence}
            onChange={(event) => {
              const value = event.target.value;
              setRecurrence(value);
              if (value === "YEARLY_SOLAR") setCalendarType("SOLAR");
              if (value === "YEARLY_LUNAR") setCalendarType("LUNAR");
            }}
          >
            {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      {recurrence === "NONE" ? (
        <fieldset className="flex gap-4 text-sm">
          <legend className="text-sm font-medium">Loại lịch</legend>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              value="SOLAR"
              checked={calendarType === "SOLAR"}
              onChange={() => setCalendarType("SOLAR")}
            />
            Dương lịch
          </label>
          <label className="mt-2 flex items-center gap-2">
            <input
              type="radio"
              name="calendarType"
              value="LUNAR"
              checked={calendarType === "LUNAR"}
              onChange={() => setCalendarType("LUNAR")}
            />
            Âm lịch
          </label>
        </fieldset>
      ) : null}
      <div className="grid grid-cols-3 gap-2">
        <label className={labelClass}>
          Ngày
          <input className={inputClass} name="day" type="number" min={1} max={31} required defaultValue={initial.day} />
        </label>
        <label className={labelClass}>
          Tháng
          <input className={inputClass} name="month" type="number" min={1} max={12} required defaultValue={initial.month} />
        </label>
        {recurrence === "NONE" ? (
          <label className={labelClass}>
            Năm
            <input className={inputClass} name="year" type="number" required defaultValue={initial.year} />
          </label>
        ) : (
          <p className="col-span-1 self-end pb-3 text-xs text-muted">Lặp mỗi năm</p>
        )}
      </div>
      {lunar ? (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="isLeapMonth" defaultChecked={initial.isLeapMonth} className="mt-1" />
          <span>
            Tháng nhuận.
            <span className="mt-1 block text-muted">
              Nếu năm không có tháng nhuận trùng số này, nhắc vào tháng thường. Tháng thiếu không có ngày 30 thì dùng ngày 29.
            </span>
          </span>
        </label>
      ) : null}
      <fieldset>
        <legend className={labelClass}>Nhắc trước</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {LEAD_OPTIONS.map((lead) => (
            <label key={lead} className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm">
              <input type="checkbox" name="leadDays" value={lead} defaultChecked={initial.leadDays.includes(lead)} />
              {lead === 0 ? "Đúng ngày" : `${lead} ngày`}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className={labelClass}>Người nhận</legend>
        {recipients.length === 0 ? (
          <p className="mt-2 text-sm text-muted">Chưa có người nhận. Bạn vẫn lưu được sự kiện, rồi thêm người ở mục Nhắc nhở.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {recipients.map((recipient) => (
              <li key={recipient.id}>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="recipientIds"
                    value={recipient.id}
                    defaultChecked={initial.recipientIds.includes(recipient.id)}
                  />
                  {recipient.name}
                  <span className="text-muted">· {CHANNEL_LABELS[recipient.channel]}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </fieldset>
      <label className={labelClass}>
        Ghi chú
        <textarea className={inputClass} name="note" rows={3} maxLength={2000} defaultValue={initial.note} />
      </label>
      {error ? <p className="text-sm font-medium text-cinnabar">{error}</p> : null}
      <button className={primaryButton} type="submit" disabled={pending}>
        {pending ? "Đang lưu…" : submitLabel}
      </button>
    </form>
  );
}
