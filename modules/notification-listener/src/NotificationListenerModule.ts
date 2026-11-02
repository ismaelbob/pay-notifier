import { NativeModule, requireOptionalNativeModule } from 'expo';
import type { NotificationListenerEvents, NotificationPayload } from './NotificationListener.types';
import NotificationListenerModuleWeb from './NotificationListenerModule.web';

declare class NotificationListenerModule extends NativeModule<NotificationListenerEvents> {
  isEnabled(): boolean;
  requestPermission(): void;
  openSettings(): void;
  setEnabledBanks?(banks: string[]): void;
  getPendingNotifications(): NotificationPayload[];
  removePendingNotifications(ids: string[]): void;
}

const nativeModule = requireOptionalNativeModule<NotificationListenerModule>('NotificationListener');

// NotificationListenerModule.web.ts ya exporta una instancia, usarla directamente
const fallback = NotificationListenerModuleWeb as unknown as NotificationListenerModule;

export default nativeModule ?? fallback;
export type { NotificationPayload, NotificationListenerEvents } from './NotificationListener.types';
