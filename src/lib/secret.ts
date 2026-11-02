import { timingSafeEqual } from "node:crypto";

export function timingSafeEqualString(left: string, right: string): boolean {
  const a = Buffer.from(left);
  const b = Buffer.from(right);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`. Missing secret fails closed. */
export function isCronAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  return timingSafeEqualString(header, `Bearer ${secret}`);
}

export function isTelegramWebhookAuthorized(header: string | null, secret: string | undefined): boolean {
  if (!secret || !header) return false;
  return timingSafeEqualString(header, secret);
}
