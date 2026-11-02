export type NotificationPayload = {
  appPackage: string;
  bank: string;
  title?: string | null;
  text?: string | null;
  subText?: string | null;
  bigText?: string | null;
  postedTime?: number;
  /** Identificador de la notificación guardada; se usa para confirmarla (ack). */
  pendingId?: string | null;
};

export type NotificationListenerEvents = {
  onBankNotification(event: NotificationPayload): void;
};
