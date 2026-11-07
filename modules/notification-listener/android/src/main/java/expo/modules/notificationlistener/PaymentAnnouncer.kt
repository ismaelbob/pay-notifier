package expo.modules.notificationlistener

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Build
import android.speech.tts.TextToSpeech
import android.speech.tts.UtteranceProgressListener
import android.util.Log
import java.util.ArrayDeque
import java.util.Locale

/**
 * Motor de voz del servicio de notificaciones.
 *
 * Vive en el proceso del servicio, así que sigue funcionando con la app cerrada.
 * Usa `USAGE_MEDIA` para salir por el stream multimedia: el modo silencio del
 * teléfono no lo apaga (sí lo hace el volumen multimedia en cero).
 */
class PaymentAnnouncer private constructor(context: Context) : TextToSpeech.OnInitListener {
  companion object {
    private const val TAG = "PaymentAnnouncer"
    private const val SAMPLE_TEXT = "20 bolivianos recibidos"
    private const val MAX_PENDING = 5

    @Volatile
    private var instance: PaymentAnnouncer? = null

    fun getInstance(context: Context): PaymentAnnouncer {
      val current = instance
      if (current != null) return current

      synchronized(this) {
        val existing = instance
        if (existing != null) return existing

        val created = PaymentAnnouncer(context.applicationContext)
        instance = created
        return created
      }
    }
  }

  private val appContext = context.applicationContext
  private val lock = Any()
  private val pending = ArrayDeque<String>()

  private var engine: TextToSpeech? = null
  private var ready = false
  private var failed = false
  private var activeLocale: Locale? = null
  private var spanishVoice = false

  @Volatile
  private var focusHeld = false

  private var focusRequest: Any? = null

  init {
    engine = TextToSpeech(appContext, this)
  }

  override fun onInit(status: Int) {
    if (status != TextToSpeech.SUCCESS) {
      Log.w(TAG, "No se pudo inicializar el motor de voz (status=$status)")
      synchronized(lock) { failed = true }
      return
    }

    val tts = engine ?: return

    configureLanguage(tts)
    tts.setAudioAttributes(audioAttributes())
    tts.setOnUtteranceProgressListener(object : UtteranceProgressListener() {
      override fun onStart(utteranceId: String?) {}

      override fun onDone(utteranceId: String?) {
        abandonAudioFocus()
      }

      override fun onError(utteranceId: String?) {
        abandonAudioFocus()
      }
    })

    synchronized(lock) {
      ready = true
      while (pending.isNotEmpty()) {
        speakNow(pending.removeFirst())
      }
    }
  }

  /**
   * Anuncia un cobro. Se ignora si la voz está desactivada o si esa
   * notificación ya se anunció antes.
   */
  fun announce(amountMinor: Long, notificationId: String) {
    if (!SpeechPreferences.isEnabled(appContext)) return
    if (SpeechPreferences.wasAnnounced(appContext, notificationId)) return

    // Se marca antes de hablar para que dos notificaciones idénticas muy
    // seguidas no se anuncien dos veces.
    SpeechPreferences.markAnnounced(appContext, notificationId)

    enqueue(buildPhrase(amountMinor))
  }

  /** Botón "Probar voz" de Ajustes; funciona aunque el anuncio esté apagado. */
  fun speakSample() {
    enqueue(SAMPLE_TEXT)
  }

  fun status(): Map<String, Any?> {
    val tts = engine
    val initializing = !ready && !failed && tts != null

    return mapOf(
      "enabled" to SpeechPreferences.isEnabled(appContext),
      "available" to ready,
      "initializing" to initializing,
      "spanishVoice" to spanishVoice,
      "language" to activeLocale?.toLanguageTag(),
      "engine" to tts?.defaultEngine
    )
  }

  fun buildPhrase(amountMinor: Long): String {
    if (amountMinor <= 0) return ""

    val bolivianos = amountMinor / 100
    val centavos = amountMinor % 100

    if (bolivianos == 0L) {
      return if (centavos == 1L) "1 centavo recibido" else "$centavos centavos recibidos"
    }

    val bolivianosPart = if (bolivianos == 1L) "1 boliviano" else "$bolivianos bolivianos"

    return when {
      centavos == 0L && bolivianos == 1L -> "$bolivianosPart recibido"
      centavos == 0L -> "$bolivianosPart recibidos"
      centavos == 1L -> "$bolivianosPart con 1 centavo recibidos"
      else -> "$bolivianosPart con $centavos centavos recibidos"
    }
  }

  private fun enqueue(text: String) {
    if (text.isEmpty()) return

    synchronized(lock) {
      if (ready) {
        speakNow(text)
      } else {
        if (pending.size >= MAX_PENDING) pending.removeFirst()
        pending.addLast(text)
      }
    }
  }

  private fun speakNow(text: String) {
    val tts = engine ?: return

    requestAudioFocus()
    val utteranceId = "pay-notifier-${System.nanoTime()}"
    val result = tts.speak(text, TextToSpeech.QUEUE_ADD, null, utteranceId)

    if (result != TextToSpeech.SUCCESS) {
      Log.w(TAG, "No se pudo anunciar el cobro (result=$result)")
      abandonAudioFocus()
    }
  }

  private fun configureLanguage(tts: TextToSpeech) {
    val candidates = listOf(Locale("es", "BO"), Locale("es", "ES"), Locale("es"))

    for (locale in candidates) {
      val availability = tts.isLanguageAvailable(locale)
      if (availability >= TextToSpeech.LANG_AVAILABLE) {
        val result = tts.setLanguage(locale)
        if (result >= TextToSpeech.LANG_AVAILABLE) {
          activeLocale = locale
          spanishVoice = true
          return
        }
      }
    }

    // Sin voz en español: se usa el idioma del sistema para no quedarse mudo.
    // Ajustes avisa de que falta la voz en español.
    val fallback = Locale.getDefault()
    tts.setLanguage(fallback)
    activeLocale = fallback
    spanishVoice = false
  }

  private fun audioAttributes(): AudioAttributes =
    AudioAttributes.Builder()
      .setUsage(AudioAttributes.USAGE_MEDIA)
      .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
      .build()

  @Suppress("DEPRECATION")
  private fun requestAudioFocus() {
    val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      val request = focusRequest as? AudioFocusRequest
        ?: AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK)
          .setAudioAttributes(audioAttributes())
          .setOnAudioFocusChangeListener { _ -> }
          .build()
          .also { focusRequest = it }

      audioManager.requestAudioFocus(request)
    } else {
      audioManager.requestAudioFocus(
        null,
        AudioManager.STREAM_MUSIC,
        AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_MAY_DUCK
      )
    }

    focusHeld = true
  }

  @Suppress("DEPRECATION")
  private fun abandonAudioFocus() {
    if (!focusHeld) return
    focusHeld = false

    val audioManager = appContext.getSystemService(Context.AUDIO_SERVICE) as? AudioManager ?: return

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      (focusRequest as? AudioFocusRequest)?.let { audioManager.abandonAudioFocusRequest(it) }
    } else {
      audioManager.abandonAudioFocus(null)
    }
  }
}
