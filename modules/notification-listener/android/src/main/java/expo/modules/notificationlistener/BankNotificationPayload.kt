package expo.modules.notificationlistener

data class BankNotificationPayload(
  val appPackage: String,
  val bank: String,
  val title: String?,
  val text: String?,
  val subText: String?,
  val bigText: String?,
  val postedTime: Long,
  val pendingId: String = ""
)
