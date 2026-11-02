import type { Notifier } from "@/lib/notifiers/types";

export function createTelegramNotifier(options: {
  botToken: string;
  fetchImpl?: typeof fetch;
}): Notifier {
  const fetchImpl = options.fetchImpl ?? fetch;
  return {
    channel: "telegram",
    async send(to, message) {
      if (!options.botToken) {
        return { ok: false, error: "Chưa cấu hình TELEGRAM_BOT_TOKEN" };
      }
      try {
        const response = await fetchImpl(`https://api.telegram.org/bot${options.botToken}/sendMessage`, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ chat_id: to.externalId, text: message.text }),
        });
        const data = (await response.json().catch(() => null)) as { ok?: boolean; description?: string } | null;
        if (!response.ok || data?.ok !== true) {
          return { ok: false, error: data?.description ?? `HTTP ${response.status}` };
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Không gửi được Telegram" };
      }
    },
  };
}
