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

/** Estado del motor de voz que usa el servicio de notificaciones. */
export type SpeechStatus = {
  /** Ajuste guardado en el dispositivo. */
  enabled: boolean;
  /** El motor terminó de inicializar y puede hablar. */
  available: boolean;
  /** El motor todavía está arrancando. */
  initializing: boolean;
  /** Se encontró una voz en español; si no, se usa el idioma del sistema. */
  spanishVoice: boolean;
  language: string | null;
  engine: string | null;
};
