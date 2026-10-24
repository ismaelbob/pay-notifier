package expo.modules.notificationlistener

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification
import android.text.TextUtils
import java.util.concurrent.ConcurrentLinkedQueue

class BankNotificationListenerService : NotificationListenerService() {
  companion object {
    @Volatile
    var instance: BankNotificationListenerService? = null

    private val pending = ConcurrentLinkedQueue<Pair<BankNotificationPayload, () -> Unit>>()

    fun emit(payload: BankNotificationPayload, onSend: () -> Unit) {
      val svc = instance
      if (svc != null) {
        onSend()
      } else {
        pending.add(Pair(payload, onSend))
      }
    }

    fun flush(module: NotificationListenerModule) {
      val svc = instance ?: return
      while (true) {
        val pair = pending.poll() ?: break
        module.sendBankNotification(pair.first)
        pair.second()
      }
    }
  }

  override fun onListenerConnected() {
    super.onListenerConnected()
    instance = this
    NotificationListenerModule.instance?.let { flush(it) }
  }

  override fun onListenerDisconnected() {
    super.onListenerDisconnected()
    instance = null
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    super.onNotificationPosted(sbn)
    if (sbn == null) return

    val pkg = sbn.packageName
    if (!BANK_PACKAGES.containsKey(pkg)) return

    val notification = sbn.notification ?: return
    val extras = notification.extras ?: return

    val title = extras.getCharSequence("android.title")?.toString()
    val text = extras.getCharSequence("android.text")?.toString()
    val subText = extras.getCharSequence("android.subText")?.toString()
    val bigText = extras.getCharSequence("android.bigText")?.toString()

    val bank = BANK_PACKAGES[pkg] ?: return
    val payload = BankNotificationPayload(
      appPackage = pkg,
      bank = bank,
      title = title,
      text = text,
      subText = subText,
      bigText = bigText,
      postedTime = sbn.postTime
    )

    val module = NotificationListenerModule.instance
    if (module != null) {
      module.sendBankNotification(payload)
    }
  }

  data class BankNotificationPayload(
    val appPackage: String,
    val bank: String,
    val title: String?,
    val text: String?,
    val subText: String?,
    val bigText: String?,
    val postedTime: Long
  )

  companion object Banks {
    val BANK_PACKAGES = mapOf(
      "com.nequi.MobileApp" to "Nequi",
      "co.com.bancolombia.personas.superapp" to "Bancolombia",
      "com.davivienda.daviplataapp" to "Daviplata",
      "co.com.bbva.mb" to "BBVA",
      "com.davivienda.daviviendaapp" to "Davivienda",
      "com.bancodebogota.bancamovil" to "Banco de Bogotá"
    )
  }
}
