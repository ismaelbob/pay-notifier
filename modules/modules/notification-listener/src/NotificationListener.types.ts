export type NotificationPayload = {
  appPackage: string;
  bank: string;
  title?: string | null;
  text?: string | null;
  subText?: string | null;
  bigText?: string | null;
  postedTime?: number;
};

export type NotificationListenerEvents = {
  onBankNotification(event: NotificationPayload): void;
};
