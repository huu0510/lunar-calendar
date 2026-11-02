import { describe, expect, it } from "vitest";
import { createTelegramNotifier } from "@/lib/notifiers/telegram";
import { createZaloNotifier, type ZaloStoredToken, type ZaloTokenStore } from "@/lib/notifiers/zalo";
import { createNotifierRegistry } from "@/lib/notifiers";
import { isCronAuthorized, isTelegramWebhookAuthorized } from "@/lib/secret";
import { interpretTelegramUpdate } from "@/lib/telegramUpdate";

function memoryStore(initial: ZaloStoredToken | null): ZaloTokenStore & { saved: ZaloStoredToken | null } {
  const state: { saved: ZaloStoredToken | null } = { saved: initial };
  return {
    get saved() {
      return state.saved;
    },
    async get() {
      return state.saved;
    },
    async save(token) {
      state.saved = token;
    },
  };
}

describe("notifiers", () => {
  it("sends a Telegram message and surfaces API errors without throwing", async () => {
    const calls: Array<{ url: string; body: string }> = [];
    const notifier = createTelegramNotifier({
      botToken: "secret-token",
      fetchImpl: async (input, init) => {
        calls.push({ url: String(input), body: String(init?.body) });
        return new Response(JSON.stringify({ ok: true, result: {} }), { status: 200 });
      },
    });
    const result = await notifier.send({ externalId: "42" }, { text: "Xin chào" });
    expect(result).toEqual({ ok: true });
    expect(calls[0]?.url).toBe("https://api.telegram.org/botsecret-token/sendMessage");
    expect(JSON.parse(calls[0]?.body ?? "{}")).toEqual({ chat_id: "42", text: "Xin chào" });

    const failing = createTelegramNotifier({
      botToken: "secret-token",
      fetchImpl: async () => new Response(JSON.stringify({ ok: false, description: "chat not found" }), { status: 400 }),
    });
    const error = await failing.send({ externalId: "42" }, { text: "Xin chào" });
    expect(error.ok).toBe(false);
    expect(error.error).toBe("chat not found");
    expect(error.error).not.toContain("secret-token");
  });

  it("refreshes an expired Zalo token before sending, and retries once on an auth error", async () => {
    const store = memoryStore({
      accessToken: "old-access",
      refreshToken: "old-refresh",
      expiresAt: new Date("2026-01-01T00:00:00.000Z"),
    });
    const calls: string[] = [];
    const notifier = createZaloNotifier({
      appId: "app",
      secretKey: "key",
      store,
      now: () => new Date("2026-11-02T00:00:00.000Z"),
      fetchImpl: async (input, init) => {
        const url = String(input);
        calls.push(url);
        if (url.includes("access_token")) {
          expect(init?.headers).toMatchObject({ secret_key: "key" });
          return new Response(
            JSON.stringify({ access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600 }),
            { status: 200 },
          );
        }
        const header = new Headers(init?.headers);
        expect(header.get("access_token")).toBe("new-access");
        return new Response(JSON.stringify({ error: 0, message: "Success" }), { status: 200 });
      },
    });
    expect(await notifier.send({ externalId: "999" }, { text: "Nhắc" })).toEqual({ ok: true });
    expect(calls[0]).toContain("oauth.zaloapp.com");
    expect(calls[1]).toContain("openapi.zalo.me");
    expect(store.saved?.accessToken).toBe("new-access");

    const fresh = memoryStore({
      accessToken: "still-good",
      refreshToken: "refresh",
      expiresAt: new Date("2026-12-01T00:00:00.000Z"),
    });
    const urls: string[] = [];
    const stable = createZaloNotifier({
      appId: "app",
      secretKey: "key",
      store: fresh,
      now: () => new Date("2026-11-02T00:00:00.000Z"),
      fetchImpl: async (input) => {
        urls.push(String(input));
        return new Response(JSON.stringify({ error: 0 }), { status: 200 });
      },
    });
    await stable.send({ externalId: "1" }, { text: "ok" });
    expect(urls).toEqual(["https://openapi.zalo.me/v3.0/oa/message/cs"]);

    let sends = 0;
    const retryStore = memoryStore({
      accessToken: "expired-but-unknown",
      refreshToken: "refresh-2",
      expiresAt: null,
    });
    const retry = createZaloNotifier({
      appId: "app",
      secretKey: "key",
      store: retryStore,
      now: () => new Date("2026-11-02T00:00:00.000Z"),
      fetchImpl: async (input) => {
        const url = String(input);
        if (url.includes("oauth.zaloapp.com")) {
          return new Response(JSON.stringify({ access_token: "rotated", refresh_token: "rotated-r", expires_in: "900" }), {
            status: 200,
          });
        }
        sends += 1;
        if (sends === 1) return new Response(JSON.stringify({ error: -216, message: "Access token is invalid" }), { status: 200 });
        return new Response(JSON.stringify({ error: 0 }), { status: 200 });
      },
    });
    expect(await retry.send({ externalId: "5" }, { text: "lại" })).toEqual({ ok: true });
    expect(sends).toBe(2);
    expect(retryStore.saved?.accessToken).toBe("rotated");
  });

  it("registers telegram and zalo behind one registry", () => {
    const registry = createNotifierRegistry(
      { TELEGRAM_BOT_TOKEN: "t", ZALO_OA_APP_ID: "a", ZALO_OA_SECRET_KEY: "s" },
      memoryStore(null),
    );
    expect(registry.telegram.channel).toBe("telegram");
    expect(registry.zalo.channel).toBe("zalo");
  });
});

describe("cron and telegram webhook auth", () => {
  it("requires the bearer cron secret", () => {
    expect(isCronAuthorized(null, "secret")).toBe(false);
    expect(isCronAuthorized("Bearer secret", undefined)).toBe(false);
    expect(isCronAuthorized("Bearer wrong", "secret")).toBe(false);
    expect(isCronAuthorized("Bearer secret", "secret")).toBe(true);
  });

  it("captures chat id from /start", () => {
    expect(isTelegramWebhookAuthorized("hook", "hook")).toBe(true);
    expect(isTelegramWebhookAuthorized("nope", "hook")).toBe(false);
    const start = interpretTelegramUpdate({
      message: { text: "/start", chat: { id: 4242, first_name: "Lan", username: "lan" } },
    });
    expect(start?.chatId).toBe("4242");
    expect(start?.reply).toContain("4242");
    expect(start?.reply).toContain("Lan");
    expect(interpretTelegramUpdate({ message: { text: "xin chào", chat: { id: 1 } } })).toBeNull();
  });
});
