import { NativeModule } from 'expo';
import type { NotificationListenerEvents } from './NotificationListener.types';

class NotificationListenerModule extends NativeModule<NotificationListenerEvents> {
  isEnabled() {
    return false;
  }
  requestPermission() {
    // Not supported on web
  }
  openSettings() {
    // Not supported on web
  }
  setEnabledBanks() {
    // Not supported on web
  }
}

export default new NotificationListenerModule();
export type { NotificationPayload, NotificationListenerEvents } from './NotificationListener.types';
