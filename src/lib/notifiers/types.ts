export type NotifierChannel = "telegram" | "zalo";

export type RecipientTarget = {
  externalId: string;
  name?: string;
};

export type NotificationMessage = {
  text: string;
};

export type SendResult = {
  ok: boolean;
  error?: string;
};

export interface Notifier {
  channel: NotifierChannel;
  send(to: RecipientTarget, message: NotificationMessage): Promise<SendResult>;
}
