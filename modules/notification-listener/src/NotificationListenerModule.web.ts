import { NativeModule } from 'expo';
import type {
  NotificationListenerEvents,
  NotificationPayload,
  SpeechStatus,
} from './NotificationListener.types';

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
  getPendingNotifications(): NotificationPayload[] {
    return [];
  }
  removePendingNotifications() {
    // Not supported on web
  }
  isSpeechEnabled() {
    return false;
  }
  setSpeechEnabled() {
    return false;
  }
  speakSample() {
    // Not supported on web
  }
  getSpeechStatus(): SpeechStatus {
    return {
      enabled: false,
      available: false,
      initializing: false,
      spanishVoice: false,
      language: null,
      engine: null,
    };
  }
}

export default new NotificationListenerModule();
export type {
  NotificationPayload,
  NotificationListenerEvents,
  SpeechStatus,
} from './NotificationListener.types';
