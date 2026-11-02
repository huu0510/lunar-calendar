import { prisma } from "@/lib/db";
import { createTelegramNotifier } from "@/lib/notifiers/telegram";
import { createZaloNotifier, type ZaloTokenStore } from "@/lib/notifiers/zalo";
import type { Notifier, NotifierChannel } from "@/lib/notifiers/types";

export type { Notifier, NotifierChannel, NotificationMessage, RecipientTarget, SendResult } from "@/lib/notifiers/types";

export function prismaZaloTokenStore(): ZaloTokenStore {
  return {
    async get() {
      const row = await prisma.zaloToken.findUnique({ where: { id: "default" } });
      if (row) {
        return {
          accessToken: row.accessToken,
          refreshToken: row.refreshToken,
          expiresAt: row.expiresAt,
        };
      }
      const accessToken = process.env.ZALO_OA_ACCESS_TOKEN ?? "";
      const refreshToken = process.env.ZALO_OA_REFRESH_TOKEN ?? "";
      if (!accessToken || !refreshToken) return null;
      return { accessToken, refreshToken, expiresAt: null };
    },
    async save(token) {
      await prisma.zaloToken.upsert({
        where: { id: "default" },
        create: {
          id: "default",
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
        },
        update: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
          expiresAt: token.expiresAt,
        },
      });
    },
  };
}

export type NotifierEnv = {
  TELEGRAM_BOT_TOKEN?: string;
  ZALO_OA_APP_ID?: string;
  ZALO_OA_SECRET_KEY?: string;
  ZALO_OA_ACCESS_TOKEN?: string;
  ZALO_OA_REFRESH_TOKEN?: string;
};

export function createNotifierRegistry(env?: NotifierEnv, store?: ZaloTokenStore): Record<NotifierChannel, Notifier> {
  const resolved: NotifierEnv = env ?? {
    TELEGRAM_BOT_TOKEN: process.env.TELEGRAM_BOT_TOKEN,
    ZALO_OA_APP_ID: process.env.ZALO_OA_APP_ID,
    ZALO_OA_SECRET_KEY: process.env.ZALO_OA_SECRET_KEY,
  };
  return {
    telegram: createTelegramNotifier({ botToken: resolved.TELEGRAM_BOT_TOKEN ?? "" }),
    zalo: createZaloNotifier({
      appId: resolved.ZALO_OA_APP_ID ?? "",
      secretKey: resolved.ZALO_OA_SECRET_KEY ?? "",
      store: store ?? prismaZaloTokenStore(),
    }),
  };
}

export function getNotifier(channel: NotifierChannel): Notifier {
  return createNotifierRegistry()[channel];
}
