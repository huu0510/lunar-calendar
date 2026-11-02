import type { Notifier, SendResult } from "@/lib/notifiers/types";

const REFRESH_URL = "https://oauth.zaloapp.com/v4/oa/access_token";
const SEND_URL = "https://openapi.zalo.me/v3.0/oa/message/cs";

export type ZaloStoredToken = {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date | null;
};

export interface ZaloTokenStore {
  get(): Promise<ZaloStoredToken | null>;
  save(token: ZaloStoredToken): Promise<void>;
}

type ZaloJson = {
  error?: number;
  message?: string;
  access_token?: string;
  refresh_token?: string;
  expires_in?: number | string;
};

function needsRefresh(expiresAt: Date | null, now: Date): boolean {
  if (!expiresAt) return false;
  return expiresAt.getTime() - now.getTime() < 60_000;
}

function isAuthError(status: number, errorCode: number | undefined): boolean {
  return status === 401 || errorCode === -216 || errorCode === -124 || errorCode === -1003;
}

async function readJson(response: Response): Promise<ZaloJson | null> {
  return (await response.json().catch(() => null)) as ZaloJson | null;
}

export function createZaloNotifier(options: {
  appId: string;
  secretKey: string;
  store: ZaloTokenStore;
  fetchImpl?: typeof fetch;
  now?: () => Date;
}): Notifier {
  const fetchImpl = options.fetchImpl ?? fetch;
  const now = options.now ?? (() => new Date());

  async function refresh(current: ZaloStoredToken): Promise<ZaloStoredToken | SendResult> {
    if (!options.appId || !options.secretKey || !current.refreshToken) {
      return { ok: false, error: "Chưa cấu hình Zalo OA để làm mới token" };
    }
    const body = new URLSearchParams({
      app_id: options.appId,
      grant_type: "refresh_token",
      refresh_token: current.refreshToken,
    });
    const response = await fetchImpl(REFRESH_URL, {
      method: "POST",
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        secret_key: options.secretKey,
      },
      body,
    });
    const data = await readJson(response);
    if (!response.ok || !data?.access_token || !data.refresh_token || (typeof data.error === "number" && data.error !== 0)) {
      return { ok: false, error: data?.message ?? `Không làm mới được token Zalo (HTTP ${response.status})` };
    }
    const expiresIn = Number(data.expires_in ?? 3600);
    const saved: ZaloStoredToken = {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(now().getTime() + Math.max(60, expiresIn) * 1000),
    };
    await options.store.save(saved);
    return saved;
  }

  async function postMessage(accessToken: string, userId: string, text: string): Promise<{ response: Response; data: ZaloJson | null }> {
    const response = await fetchImpl(SEND_URL, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        access_token: accessToken,
      },
      body: JSON.stringify({
        recipient: { user_id: userId },
        message: { text },
      }),
    });
    const data = await readJson(response);
    return { response, data };
  }

  return {
    channel: "zalo",
    async send(to, message) {
      try {
        let token = await options.store.get();
        if (!token?.accessToken) {
          return { ok: false, error: "Chưa có access token Zalo OA" };
        }
        if (needsRefresh(token.expiresAt, now())) {
          const refreshed = await refresh(token);
          if ("ok" in refreshed) return refreshed;
          token = refreshed;
        }

        let attempt = await postMessage(token.accessToken, to.externalId, message.text);
        if (isAuthError(attempt.response.status, attempt.data?.error)) {
          const refreshed = await refresh(token);
          if ("ok" in refreshed) return refreshed;
          token = refreshed;
          attempt = await postMessage(token.accessToken, to.externalId, message.text);
        }

        const errorCode = attempt.data?.error;
        if (!attempt.response.ok || (typeof errorCode === "number" && errorCode !== 0)) {
          return { ok: false, error: attempt.data?.message ?? `HTTP ${attempt.response.status}` };
        }
        return { ok: true };
      } catch (error) {
        return { ok: false, error: error instanceof Error ? error.message : "Không gửi được Zalo" };
      }
    },
  };
}
