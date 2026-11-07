package expo.modules.notificationlistener

import java.text.Normalizer
import java.util.Locale
import kotlin.math.roundToLong

/**
 * Extractor mínimo de importes para el anuncio por voz.
 *
 * Es un port reducido de `src/utils/notificationParser.js`: solo decide si una
 * notificación es un cobro entrante y cuánto anunciar en voz alta. El guardado
 * del cobro sigue dependiendo del parser de JavaScript, así que un fallo aquí
 * nunca altera los datos.
 *
 * Si agregas un banco, billetera o formato de notificación nuevo, actualiza los
 * dos archivos: este y `src/utils/notificationParser.js`.
 */
object SpeechAmountParser {
  // Palabras que indican un cobro. Se comparan sin acentos y en minúsculas.
  private val STRONG_INCOMING = listOf(
    "te ha enviado",
    "te han enviado",
    "te ha transferido",
    "te han transferido",
    "te ha depositado",
    "te han depositado",
    "te ha pagado",
    "te han pagado",
    "te enviaron",
    "te transfirieron",
    "te depositaron",
    "te pagaron",
    "cobro exitoso",
    "nuevo cobro",
    "recibiste",
    "recibio",
    "recibieron",
    "abono",
    "abonado",
    "acredito",
    "acredita",
    "acreditaron",
    "acreditado",
    "acreditacion",
    "depositado",
    "deposito",
    "te transfirio",
    "te envio",
    "te yapeo",
    "te yapearon",
    "pago recibido",
    "cobro recibido",
    "transferencia recibida",
    "dinero recibido",
    "recibiste un pago"
  )

  private val WEAK_INCOMING = listOf(
    "recibida",
    "recibido",
    "a tu cuenta",
    "a tu billetera",
    "ingreso a tu",
    "ingreso recibido",
    "nuevo ingreso",
    "entrante",
    "a favor"
  )

  private val OUTGOING = listOf(
    "enviaste",
    "transferiste",
    "pagaste",
    "pago realizado",
    "pago exitoso",
    "pago programado",
    "compra realizada",
    "compra en",
    "debito",
    "debitado",
    "retiro",
    "retiraste",
    "cargo",
    "consumo",
    "salida de",
    "recarga",
    "pago de servicio",
    "transferencia realizada",
    "envio realizado",
    "envio exitoso"
  )

  private val ALL_INCOMING = STRONG_INCOMING + WEAK_INCOMING

  private val COMBINING_MARKS = Regex("[\u0300-\u036f]+")
  private val SPACES = Regex("\\s+")

  private val CURRENCY_AMOUNT_REGEX =
    Regex("(?:bs\\.?|bob|\\$)\\s*(\\d[\\d.,]*)", RegexOption.IGNORE_CASE)
  // Algunas billeteras escriben el monto antes del símbolo: "100 Bs".
  private val CURRENCY_SUFFIX_AMOUNT_REGEX =
    Regex("(\\d[\\d.,]*)\\s*(?:bs\\.?|bob)\\b", RegexOption.IGNORE_CASE)
  private val BARE_AMOUNT_REGEX = Regex("(?:^|[^\\d/])(\\d[\\d.,]*)(?![.,]?\\d)")
  // Un saldo o límite no es el importe del cobro.
  private val BALANCE_BEFORE_REGEX =
    Regex("(?:saldo|disponible|balance|limite|tope)\\s*:?\\s*(?:bs\\.?|bob|\\$)?\\s*$", RegexOption.IGNORE_CASE)

  private data class AmountCandidate(val amount: Double, val index: Int)

  /** Devuelve el monto en unidades menores (centavos) o `null` si no es un cobro. */
  fun parse(payload: BankNotificationPayload): Long? {
    val rawText = listOf(payload.title, payload.text, payload.bigText, payload.subText)
      .filterNotNull()
      .filter { it.isNotBlank() }
      .joinToString("\n")

    if (rawText.isBlank()) return null

    val text = normalize(rawText)
    if (!looksLikeReceivedPayment(text)) return null

    return parseAmount(text)
  }

  private fun normalize(value: String): String =
    Normalizer.normalize(value, Normalizer.Form.NFD)
      .replace(COMBINING_MARKS, "")
      .lowercase(Locale.ROOT)

  private fun looksLikeReceivedPayment(text: String): Boolean {
    if (STRONG_INCOMING.any { text.contains(it) }) return true

    val hasWeakIncoming = WEAK_INCOMING.any { text.contains(it) }
    val hasOutgoing = OUTGOING.any { text.contains(it) }

    return hasWeakIncoming && !hasOutgoing
  }

  private fun parseAmount(text: String): Long? {
    val candidates = (
      collectAmounts(CURRENCY_AMOUNT_REGEX, text) +
        collectAmounts(CURRENCY_SUFFIX_AMOUNT_REGEX, text)
      )
      .filter { !isBalanceAmount(text, it.index) }
      .sortedBy { it.index }

    val incomingIndex = firstIncomingIndex(text)

    val selected = (if (candidates.isNotEmpty()) {
      candidates.firstOrNull {
        incomingIndex != -1 && it.index >= incomingIndex && it.index - incomingIndex <= 80
      } ?: candidates.first()
    } else {
      // Sin símbolo de moneda: solo se aceptan números con separadores o de 4+ dígitos.
      val plausible = collectAmounts(BARE_AMOUNT_REGEX, text)
        .filter { !isBalanceAmount(text, it.index) }
        .filter { candidate ->
          val raw = text.substring(
            candidate.index,
            minOf(candidate.index + 24, text.length)
          ).split(SPACES).first()
          val hasSeparator = raw.any { it == '.' || it == ',' }

          // Evita confundir años sueltos (2024, 2025...) con importes.
          if (!hasSeparator && candidate.amount >= 1900 && candidate.amount <= 2100) {
            return@filter false
          }
          hasSeparator || candidate.amount >= 1000
        }

      plausible.firstOrNull { incomingIndex != -1 && it.index >= incomingIndex }
        ?: plausible.firstOrNull()
    }) ?: return null

    if (selected.amount > 1_000_000_000) return null

    val minorUnits = (selected.amount * 100.0).roundToLong()
    return minorUnits.takeIf { it > 0 }
  }

  private fun collectAmounts(regex: Regex, text: String): List<AmountCandidate> {
    val matches = mutableListOf<AmountCandidate>()

    for (match in regex.findAll(text)) {
      val group = match.groups[1] ?: continue
      val amount = parseAmountNumber(group.value) ?: continue
      matches.add(AmountCandidate(amount, group.range.first))
    }

    return matches
  }

  private fun parseAmountNumber(raw: String): Double? {
    var value = raw.replace(Regex("[^\\d.,]"), "").replace(Regex("[.,]+$"), "")
    if (value.isEmpty()) return null

    val lastDot = value.lastIndexOf('.')
    val lastComma = value.lastIndexOf(',')

    if (lastDot != -1 && lastComma != -1) {
      // El separador decimal es el que aparece más a la derecha.
      value = if (lastDot > lastComma) {
        value.replace(",", "")
      } else {
        value.replace(".", "").replace(",", ".")
      }
    } else if (lastComma != -1) {
      val decimals = value.length - lastComma - 1
      // "1,500" se interpreta como separador de miles; "1,5" como decimal.
      value = if (decimals == 3) value.replace(",", "") else value.replace(",", ".")
    } else if (lastDot != -1) {
      val decimals = value.length - lastDot - 1
      // "1.500" es separador de miles; "1500.50" es decimal.
      if (decimals == 3) value = value.replace(".", "")
    }

    val amount = value.toDoubleOrNull() ?: return null
    if (!amount.isFinite() || amount <= 0.0) return null
    return amount
  }

  private fun firstIncomingIndex(text: String): Int {
    var first = -1

    for (keyword in ALL_INCOMING) {
      val index = text.indexOf(keyword)
      if (index != -1 && (first == -1 || index < first)) {
        first = index
      }
    }

    return first
  }

  private fun isBalanceAmount(text: String, index: Int): Boolean {
    val start = maxOf(0, index - 24)
    val before = text.substring(start, minOf(index, text.length))
    return BALANCE_BEFORE_REGEX.containsMatchIn(before)
  }
}
