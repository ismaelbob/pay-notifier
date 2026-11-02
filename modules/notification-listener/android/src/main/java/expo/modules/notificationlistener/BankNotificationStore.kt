package expo.modules.notificationlistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.security.MessageDigest

/**
 * Guarda las notificaciones detectadas en SharedPreferences para que no se
 * pierdan cuando el runtime de JS no está vivo (app cerrada o en segundo plano).
 */
object BankNotificationStore {
  private const val PREFS_NAME = "pay_notifier_pending"
  private const val KEY_ITEMS = "items"
  private const val MAX_ITEMS = 200
  private const val MAX_AGE_MS = 7L * 24L * 60L * 60L * 1000L

  private fun preferences(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  /** Identifica el contenido de una notificación para poder confirmarla (ack). */
  fun buildId(payload: BankNotificationPayload): String {
    val raw = listOf(
      payload.appPackage,
      payload.title.orEmpty(),
      payload.text.orEmpty(),
      payload.subText.orEmpty(),
      payload.bigText.orEmpty()
    ).joinToString("|")

    val digest = MessageDigest.getInstance("SHA-256").digest(raw.toByteArray(Charsets.UTF_8))
    return digest.joinToString("") { byte -> "%02x".format(byte) }
  }

  @Synchronized
  fun add(context: Context, payload: BankNotificationPayload, id: String = buildId(payload)) {
    val now = System.currentTimeMillis()
    val items = readItems(context)
      .filter { it.optLong("savedAt", 0L) > now - MAX_AGE_MS && it.optString("id") != id }
      .toMutableList()

    items.add(0, toJson(payload, id, now))
    writeItems(context, items.take(MAX_ITEMS))
  }

  @Synchronized
  fun all(context: Context): List<BankNotificationPayload> {
    val now = System.currentTimeMillis()
    val items = readItems(context)
    val fresh = items.filter { it.optLong("savedAt", 0L) > now - MAX_AGE_MS }

    if (fresh.size != items.size) {
      writeItems(context, fresh)
    }

    return fresh.mapNotNull { fromJson(it) }
  }

  @Synchronized
  fun remove(context: Context, ids: List<String>) {
    if (ids.isEmpty()) return

    val idSet = ids.toSet()
    val remaining = readItems(context).filter { it.optString("id") !in idSet }
    writeItems(context, remaining)
  }

  private fun readItems(context: Context): List<JSONObject> {
    val raw = preferences(context).getString(KEY_ITEMS, null) ?: return emptyList()

    return try {
      val array = JSONArray(raw)
      (0 until array.length()).mapNotNull { index -> array.optJSONObject(index) }
    } catch (_: Exception) {
      // Si el JSON quedó corrupto, se descarta para no bloquear nuevas capturas.
      emptyList()
    }
  }

  private fun writeItems(context: Context, items: List<JSONObject>) {
    val array = JSONArray()
    items.forEach { array.put(it) }
    // commit() en lugar de apply(): el proceso del servicio puede morir justo
    // después de guardar y no queremos perder el cobro recién capturado.
    preferences(context).edit().putString(KEY_ITEMS, array.toString()).commit()
  }

  private fun toJson(payload: BankNotificationPayload, id: String, savedAt: Long): JSONObject =
    JSONObject().apply {
      put("id", id)
      put("appPackage", payload.appPackage)
      put("bank", payload.bank)
      put("title", payload.title ?: JSONObject.NULL)
      put("text", payload.text ?: JSONObject.NULL)
      put("subText", payload.subText ?: JSONObject.NULL)
      put("bigText", payload.bigText ?: JSONObject.NULL)
      put("postedTime", payload.postedTime)
      put("savedAt", savedAt)
    }

  private fun fromJson(json: JSONObject): BankNotificationPayload? {
    val appPackage = json.optNullableString("appPackage") ?: return null

    return BankNotificationPayload(
      appPackage = appPackage,
      bank = json.optString("bank"),
      title = json.optNullableString("title"),
      text = json.optNullableString("text"),
      subText = json.optNullableString("subText"),
      bigText = json.optNullableString("bigText"),
      postedTime = json.optLong("postedTime", 0L),
      pendingId = json.optString("id")
    )
  }

  private fun JSONObject.optNullableString(name: String): String? {
    if (!has(name) || isNull(name)) return null
    return optString(name).takeIf { it.isNotEmpty() }
  }
}
