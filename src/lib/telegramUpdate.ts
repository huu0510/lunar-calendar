export type TelegramStart = {
  chatId: string;
  username: string | null;
  firstName: string | null;
  reply: string;
};

export function interpretTelegramUpdate(update: unknown): TelegramStart | null {
  if (!update || typeof update !== "object") return null;
  const message = (update as { message?: unknown }).message;
  if (!message || typeof message !== "object") return null;
  const text = (message as { text?: unknown }).text;
  const chat = (message as { chat?: unknown }).chat;
  if (typeof text !== "string" || !chat || typeof chat !== "object") return null;
  const command = text.trim().split(/\s+/)[0]?.split("@")[0];
  if (command !== "/start") return null;
  const id = (chat as { id?: unknown }).id;
  if (typeof id !== "number" && typeof id !== "string") return null;
  const chatId = String(id);
  const usernameValue = (chat as { username?: unknown }).username;
  const firstNameValue = (chat as { first_name?: unknown }).first_name;
  const username = typeof usernameValue === "string" ? usernameValue : null;
  const firstName = typeof firstNameValue === "string" ? firstNameValue : null;
  const who = firstName ? ` ${firstName}` : "";
  const reply = `Xin chào${who}! Chat ID của bạn là: ${chatId}\nHãy dán số này vào mục Người nhận trong Lịch âm để nhận nhắc ngày giỗ và kỷ niệm.`;
  return { chatId, username, firstName, reply };
}
