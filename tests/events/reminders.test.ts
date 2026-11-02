import { describe, expect, it } from "vitest";
import { addDays, formatISODate } from "@/lib/dates";
import { lunarToSolar } from "@/lib/lunar";
import { formatReminderMessage } from "@/lib/events/message";
import { dispatchReminders, planReminders, reminderKey } from "@/lib/events/reminders";
import type { ReminderEvent } from "@/lib/events/types";

const tet = lunarToSolar({ day: 1, month: 1, year: 2026, isLeapMonth: false })!;

const event: ReminderEvent = {
  id: "evt-gio",
  title: "Giỗ ông nội",
  calendarType: "LUNAR",
  day: 1,
  month: 1,
  year: null,
  isLeapMonth: false,
  recurrence: "YEARLY_LUNAR",
  leadDays: [7, 1, 0],
  recipients: [
    { id: "rec-1", name: "Lan", channel: "telegram", externalId: "111" },
    { id: "rec-2", name: "Minh", channel: "zalo", externalId: "222" },
  ],
};

describe("reminders", () => {
  it("formats the Vietnamese reminder", () => {
    expect(
      formatReminderMessage({
        title: "Giỗ ông nội",
        leadDays: 7,
        lunar: { day: 10, month: 3, year: 2026, isLeapMonth: false },
        solar: { year: 2026, month: 4, day: 26 },
      }),
    ).toBe("🔔 Còn 7 ngày nữa là Giỗ ông nội (10/3 âm lịch — 26/04/2026 dương lịch).");
    expect(
      formatReminderMessage({
        title: "Giỗ ông nội",
        leadDays: 0,
        lunar: { day: 10, month: 3, year: 2026, isLeapMonth: false },
        solar: { year: 2026, month: 4, day: 26 },
      }),
    ).toBe("🔔 Hôm nay là Giỗ ông nội (10/3 âm lịch — 26/04/2026 dương lịch).");
  });

  it("plans only the lead day that lands on today", () => {
    const weekBefore = planReminders([event], addDays(tet, -7));
    expect(weekBefore.map((item) => item.leadDays).sort()).toEqual([7, 7]);
    expect(weekBefore[0]?.occurrenceDate).toBe(formatISODate(tet));
    expect(weekBefore[0]?.message).toContain("Còn 7 ngày nữa là Giỗ ông nội");

    expect(planReminders([event], tet).map((item) => item.leadDays).sort()).toEqual([0, 0]);
    expect(planReminders([event], addDays(tet, -3))).toEqual([]);
  });

  it("skips keys that were already sent and continues after a channel failure", async () => {
    const planned = planReminders([event], addDays(tet, -1)).filter((item) => item.leadDays === 1);
    expect(planned).toHaveLength(2);

    const skipped = await dispatchReminders({
      planned,
      alreadySent: new Set([reminderKey(planned[0]!)]),
      send: async () => ({ ok: true }),
      record: async () => undefined,
    });
    expect(skipped).toEqual({ sent: 1, failed: 0, skipped: 1 });

    const recorded: string[] = [];
    const mixed = await dispatchReminders({
      planned,
      alreadySent: new Set(),
      send: async (item) => {
        if (item.channel === "telegram") return { ok: false, error: "tạm ngưng" };
        return { ok: true };
      },
      record: async (item, result) => {
        recorded.push(`${item.channel}:${result.ok}`);
      },
    });
    expect(mixed).toEqual({ sent: 1, failed: 1, skipped: 0 });
    expect(recorded).toEqual(["telegram:false", "zalo:true"]);

    const thrown = await dispatchReminders({
      planned: [planned[0]!],
      alreadySent: new Set(),
      send: async () => {
        throw new Error("network");
      },
      record: async (_item, result) => {
        expect(result.ok).toBe(false);
      },
    });
    expect(thrown.failed).toBe(1);
  });
});
