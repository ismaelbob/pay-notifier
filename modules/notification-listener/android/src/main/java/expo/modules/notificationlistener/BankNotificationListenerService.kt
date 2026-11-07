package expo.modules.notificationlistener

import android.service.notification.NotificationListenerService
import android.service.notification.StatusBarNotification

class BankNotificationListenerService : NotificationListenerService() {
  companion object {
    val BANK_PACKAGES = mapOf(
      // Bancos
      "bnb.com.bo.bnbmovil" to "BNB",
      "bo.com.bmsc.bancamovil" to "BMSC",
      "com.bancounion.unimovilplus" to "Banco Unión",
      "com.bisa.ebisaplus" to "Banco Bisa",
      "com.banco.appbisa" to "Banco Bisa",
      "com.mooveit.bcpb" to "BCP Bolivia",
      "com.baneco.application" to "Banco Económico",
      "tsmbo.bancosolapk.presentacion" to "BancoSol",
      // Billeteras digitales
      "com.bancosol.altoke" to "Altoke",
      "bo.tigo.mfsapp" to "Tigo Money",
      "bo.com.yolopago" to "YOLO",
      "com.busa.wallet" to "Yasta",
      "com.bcp.bo.wallet" to "Yape",
      "bec.vdb.direct" to "ZAS"
    )
  }

  override fun onCreate() {
    super.onCreate()
    // Se inicializa el motor de voz con antelación: la primera notificación
    // puede llegar antes de que TextToSpeech termine de arrancar.
    PaymentAnnouncer.getInstance(applicationContext)
  }

  override fun onNotificationPosted(sbn: StatusBarNotification?) {
    super.onNotificationPosted(sbn)
    if (sbn == null) return

    val pkg = sbn.packageName
    val bank = BANK_PACKAGES[pkg] ?: return

    val notification = sbn.notification ?: return
    val extras = notification.extras ?: return

    val payload = BankNotificationPayload(
      appPackage = pkg,
      bank = bank,
      title = extras.getCharSequence("android.title")?.toString(),
      text = extras.getCharSequence("android.text")?.toString(),
      subText = extras.getCharSequence("android.subText")?.toString(),
      bigText = extras.getCharSequence("android.bigText")?.toString(),
      postedTime = sbn.postTime
    )

    // Se persiste siempre: si la app está cerrada, JS lo consume al abrirla.
    val pendingId = BankNotificationStore.buildId(payload)
    val isNew = BankNotificationStore.add(applicationContext, payload, pendingId)

    // El anuncio por voz se decide aquí, sin depender de JS: puede correr con
    // la app cerrada. Solo se anuncia la primera vez que se ve la notificación.
    if (isNew) {
      val amountMinor = SpeechAmountParser.parse(payload)
      if (amountMinor != null) {
        PaymentAnnouncer.getInstance(applicationContext).announce(amountMinor, pendingId)
      }
    }

    // Si el runtime de JS está vivo, se entrega de inmediato para que el cobro
    // aparezca sin esperar a reabrir la app.
    NotificationListenerModule.instance?.sendBankNotification(payload.copy(pendingId = pendingId))
  }
}
