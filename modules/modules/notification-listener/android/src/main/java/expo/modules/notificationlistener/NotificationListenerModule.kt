package expo.modules.notificationlistener

import android.content.ComponentName
import android.content.Intent
import android.provider.Settings
import androidx.core.app.NotificationManagerCompat
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class NotificationListenerModule : Module() {
  companion object {
    @Volatile
    var instance: NotificationListenerModule? = null
  }

  override fun definition() = ModuleDefinition {
    Name("NotificationListener")

    Events("onBankNotification")

    OnCreate {
      instance = this@NotificationListenerModule
      BankNotificationListenerService.flush(this@NotificationListenerModule)
    }

    OnDestroy {
      if (instance == this@NotificationListenerModule) {
        instance = null
      }
    }

    Function("isEnabled") {
      val context = appContext.reactContext ?: return@Function false
      val enabled = NotificationManagerCompat.getEnabledListenerPackages(context)
      enabled.contains(context.packageName)
    }

    Function("requestPermission") {
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("openSettings") {
      val context = appContext.reactContext ?: return@Function
      val intent = Intent(Settings.ACTION_NOTIFICATION_LISTENER_SETTINGS)
      intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
      context.startActivity(intent)
    }

    Function("setEnabledBanks") { banks: List<String> ->
      // Banks are filtered in the service; method kept for API parity
      banks
    }
  }

  fun sendBankNotification(payload: BankNotificationListenerService.BankNotificationPayload) {
    sendEvent(
      "onBankNotification",
      mapOf(
        "appPackage" to payload.appPackage,
        "bank" to payload.bank,
        "title" to payload.title,
        "text" to payload.text,
        "subText" to payload.subText,
        "bigText" to payload.bigText,
        "postedTime" to payload.postedTime
      )
    )
  }
}
