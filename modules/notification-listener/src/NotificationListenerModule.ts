import { NativeModule, requireOptionalNativeModule } from 'expo';
import type {
  NotificationListenerEvents,
  NotificationPayload,
  SpeechStatus,
} from './NotificationListener.types';
import NotificationListenerModuleWeb from './NotificationListenerModule.web';

declare class NotificationListenerModule extends NativeModule<NotificationListenerEvents> {
  isEnabled(): boolean;
  requestPermission(): void;
  openSettings(): void;
  setEnabledBanks?(banks: string[]): void;
  getPendingNotifications(): NotificationPayload[];
  removePendingNotifications(ids: string[]): void;

  // Anuncio por voz (opcionales: builds antiguos no las incluyen).
  isSpeechEnabled?(): boolean;
  setSpeechEnabled?(enabled: boolean): boolean;
  speakSample?(): void;
  getSpeechStatus?(): SpeechStatus;
}

const nativeModule = requireOptionalNativeModule<NotificationListenerModule>('NotificationListener');

// NotificationListenerModule.web.ts ya exporta una instancia, usarla directamente
const fallback = NotificationListenerModuleWeb as unknown as NotificationListenerModule;

export default nativeModule ?? fallback;
export type {
  NotificationPayload,
  NotificationListenerEvents,
  SpeechStatus,
} from './NotificationListener.types';
