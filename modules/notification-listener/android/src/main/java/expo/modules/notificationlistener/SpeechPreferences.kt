package expo.modules.notificationlistener

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject

/**
 * Preferencias del anuncio por voz.
 *
 * Viven en SharedPreferences (no en AsyncStorage) para que el servicio de
 * notificaciones pueda leerlas con el runtime de JavaScript apagado.
 */
object SpeechPreferences {
  private const val PREFS_NAME = "pay_notifier_speech"
  private const val KEY_ENABLED = "enabled"
  private const val KEY_RECENT = "recent_announcements"
  private const val MAX_RECENT = 40
  private const val RECENT_TTL_MS = 24L * 60L * 60L * 1000L

  private fun preferences(context: Context) =
    context.applicationContext.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)

  /** Activado por defecto: el objetivo de la app es escuchar los cobros. */
  fun isEnabled(context: Context): Boolean =
    preferences(context).getBoolean(KEY_ENABLED, true)

  fun setEnabled(context: Context, enabled: Boolean) {
    preferences(context).edit().putBoolean(KEY_ENABLED, enabled).apply()
  }

  /**
   * Evita repetir un anuncio si la misma notificación se vuelve a publicar
   * después de que JS la haya confirmado y borrado de la cola pendiente.
   */
  @Synchronized
  fun wasAnnounced(context: Context, id: String): Boolean {
    val now = System.currentTimeMillis()
    return readRecent(context).any { (storedId, at) ->
      storedId == id && at > now - RECENT_TTL_MS
    }
  }

  @Synchronized
  fun markAnnounced(context: Context, id: String) {
    val now = System.currentTimeMillis()
    val items = readRecent(context)
      .filter { (storedId, at) -> at > now - RECENT_TTL_MS && storedId != id }
      .toMutableList()

    items.add(0, id to now)

    val array = JSONArray()
    items.take(MAX_RECENT).forEach { (storedId, at) ->
      array.put(JSONObject().put("id", storedId).put("at", at))
    }

    // commit() para que el registro sobreviva si el proceso muere justo después.
    preferences(context).edit().putString(KEY_RECENT, array.toString()).commit()
  }

  private fun readRecent(context: Context): List<Pair<String, Long>> {
    val raw = preferences(context).getString(KEY_RECENT, null) ?: return emptyList()

    return try {
      val array = JSONArray(raw)
      (0 until array.length()).mapNotNull { index ->
        val item = array.optJSONObject(index) ?: return@mapNotNull null
        val id = item.optString("id")
        if (id.isEmpty()) null else id to item.optLong("at", 0L)
      }
    } catch (_: Exception) {
      // Si el JSON quedó corrupto, se descarta para no bloquear nuevos anuncios.
      emptyList()
    }
  }
}
