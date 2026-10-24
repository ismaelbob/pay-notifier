import { NativeModule, requireNativeModule } from 'expo';
import type { NotificationListenerEvents } from './NotificationListener.types';

declare class NotificationListenerModule extends NativeModule<NotificationListenerEvents> {
  isEnabled(): boolean;
  requestPermission(): void;
  openSettings(): void;
  setEnabledBanks(banks: string[]): void;
}

export default requireNativeModule<NotificationListenerModule>('NotificationListener');
export type { NotificationPayload, NotificationListenerEvents } from './NotificationListener.types';
