import { toMinorUnits } from './money';

const CURRENCY_AMOUNT_REGEX = /(?:bs\.?|bob|\$)\s*(\d[\d.,]*)/gi;
const BARE_AMOUNT_REGEX = /(?:^|[^\d/])(\d[\d.,]*)(?![.,]?\d)/g;

// Palabras que indican un cobro. Se comparan sin acentos y en minúsculas.
const STRONG_INCOMING = [
  'recibiste',
  'recibio',
  'recibieron',
  'abono',
  'abonado',
  'acredito',
  'acredita',
  'acreditaron',
  'acreditado',
  'acreditacion',
  'depositado',
  'deposito',
  'te transfirio',
  'te envio',
  'te yapeo',
  'te yapearon',
  'pago recibido',
  'cobro recibido',
  'transferencia recibida',
  'dinero recibido',
  'recibiste un pago',
];

const WEAK_INCOMING = [
  'recibida',
  'recibido',
  'a tu cuenta',
  'a tu billetera',
  'ingreso a tu',
  'ingreso recibido',
  'nuevo ingreso',
  'entrante',
  'a favor',
];

const OUTGOING = [
  'enviaste',
  'transferiste',
  'pagaste',
  'pago realizado',
  'pago exitoso',
  'pago programado',
  'compra realizada',
  'compra en',
  'debito',
  'debitado',
  'retiro',
  'retiraste',
  'cargo',
  'consumo',
  'salida de',
  'recarga',
  'pago de servicio',
  'transferencia realizada',
  'envio realizado',
  'envio exitoso',
];

const SENDER_PATTERNS = [
  /recibiste\s+(?:bs\.?\s*)?[\d.,]+[.\-]*\s+(?:de|desde)\s*[:\-]?\s*([^\n,;]{2,60})/i,
  /recibiste\s+(?:de|desde)\s*[:\-]?\s*([^\n,;]{2,60})/i,
  /recibiste\s+(?:un\s+)?(?:pago|abono|dep[oó]sito|transferencia|yapeo|cobro)\s+(?:de|desde)\s*[:\-]?\s*([^\n,;]{2,60})/i,
  /(?:transferencia|pago|abono|dep[oó]sito|yapeo|cobro)\s+recibid[ao]\s*[:\-]?\s*(?:(?:de|desde)\s*[:\-]?\s*)?([^\n,;]{2,60})/i,
  /(?:transferencia|pago|abono|dep[oó]sito|yapeo|cobro)\s+(?:de|desde)\s*[:\-]?\s*([^\n,;]{2,60})/i,
  /(?:de|desde)\s*[:\-]\s*([^\n,;]{2,60})/i,
  /remitente\s*[:\-]?\s*([^\n,;]{2,60})/i,
  /ordenante\s*[:\-]?\s*([^\n,;]{2,60})/i,
  /te\s+(?:envi[oó]|transfiri[oó]|yape[oó])\s+(?:bs\.?\s*[\d.,]+[.\-]*\s+)?([^\n,;]{2,60})/i,
  /\b(?:yapearon|yapeo|depositaron)\s+(?:bs\.?\s*[\d.,]+[.\-]*\s+)?(?:de\s+)?([^\n,;]{2,60})/i,
  /(?:ingreso|dep[oó]sito)\s+(?:de|desde)\s*[:\-]?\s*([^\n,;]{2,60})/i,
];

const REFERENCE_PATTERNS = [
  /ref(?:erencia)?\s*[:#.]?\s*([A-Z0-9-]{4,20})/i,
  /(?:nro\.?|numero|número)\s*(?:de\s*)?(?:operacion|operación|transaccion|transacción|comprobante)?\s*[:#.]?\s*([A-Z0-9-]{4,20})/i,
  /(?:operacion|operación|transaccion|transacción|comprobante)\s*[:#.]?\s*([A-Z0-9-]{4,20})/i,
  /\bid\s*[:#.]?\s*([A-Z0-9-]{4,20})/i,
];

const SENDER_STOP_WORDS =
  'por|con|ref|referencia|nro|numero|número|operacion|operación|transaccion|transacción|desde|el|la|los|las|ci|cel|celular|cuenta|tarjeta|saldo|disponible|monto|fecha|hora';

export function normalizeText(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseAmountNumber(raw) {
  let value = raw.replace(/[^\d.,]/g, '').replace(/[.,]+$/, '');
  if (!value) return null;

  const lastDot = value.lastIndexOf('.');
  const lastComma = value.lastIndexOf(',');

  if (lastDot !== -1 && lastComma !== -1) {
    // El separador decimal es el que aparece más a la derecha.
    if (lastDot > lastComma) {
      value = value.replace(/,/g, '');
    } else {
      value = value.replace(/\./g, '').replace(',', '.');
    }
  } else if (lastComma !== -1) {
    const decimals = value.length - lastComma - 1;
    // "1,500" se interpreta como separador de miles; "1,5" como decimal.
    value = decimals === 3 ? value.replace(/,/g, '') : value.replace(/,/g, '.');
  } else if (lastDot !== -1) {
    const decimals = value.length - lastDot - 1;
    // "1.500" es separador de miles; "1500.50" es decimal.
    if (decimals === 3) {
      value = value.replace(/\./g, '');
    }
  }

  const amount = Number.parseFloat(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return amount;
}

function collectAmounts(regex, text) {
  const matches = [];
  let match;

  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    const amount = parseAmountNumber(match[1]);
    if (amount != null) {
      const index = match.index + match[0].indexOf(match[1]);
      matches.push({ amount, index });
    }
    if (match.index === regex.lastIndex) regex.lastIndex += 1;
  }

  return matches;
}

function firstIncomingIndex(text) {
  let first = -1;

  for (const keyword of [...STRONG_INCOMING, ...WEAK_INCOMING]) {
    const index = text.indexOf(keyword);
    if (index !== -1 && (first === -1 || index < first)) {
      first = index;
    }
  }

  return first;
}

function isBalanceAmount(text, index) {
  const before = text.slice(Math.max(0, index - 24), index);
  // Un saldo o límite no es el importe del cobro.
  return /(?:saldo|disponible|balance|limite|tope)\s*:?\s*(?:bs\.?|bob|\$)?\s*$/i.test(before);
}

function parseAmount(text) {
  const candidates = collectAmounts(CURRENCY_AMOUNT_REGEX, text).filter(
    (candidate) => !isBalanceAmount(text, candidate.index)
  );
  const incomingIndex = firstIncomingIndex(text);

  let selected = null;
  if (candidates.length > 0) {
    selected =
      candidates.find(
        (candidate) =>
          incomingIndex !== -1 &&
          candidate.index >= incomingIndex &&
          candidate.index - incomingIndex <= 80
      ) ?? candidates[0];
  } else {
    // Sin símbolo de moneda: solo aceptamos números con separadores o de 4+ dígitos.
    const bare = collectAmounts(BARE_AMOUNT_REGEX, text).filter(
      (candidate) => !isBalanceAmount(text, candidate.index)
    );
    const plausible = bare.filter((candidate) => {
      const raw = text.slice(candidate.index, candidate.index + 24).split(/\s/)[0];
      const hasSeparator = /[.,]/.test(raw);
      // Evita confundir años sueltos (2024, 2025...) con importes.
      if (!hasSeparator && candidate.amount >= 1900 && candidate.amount <= 2100) {
        return false;
      }
      return hasSeparator || candidate.amount >= 1000;
    });
    selected =
      plausible.find(
        (candidate) => incomingIndex !== -1 && candidate.index >= incomingIndex
      ) ?? plausible[0];
  }

  if (!selected) return null;
  if (selected.amount > 1_000_000_000) return null;

  return toMinorUnits(selected.amount);
}

function cleanSender(raw) {
  let sender = raw.trim().replace(/\s+/g, ' ');

  sender = sender.replace(
    /^(?:bs\.?\s*[\d.,]+[.\-]*\s+(?:de\s+)?|[\d.,]+[.\-]*\s+(?:de\s+)?)/i,
    ''
  );
  sender = sender.replace(/^(?:de|desde)\s*[:\-]?\s*/i, '');
  sender = sender.split(new RegExp(`\\s+(?=(?:${SENDER_STOP_WORDS})\\b)`, 'i'))[0];
  sender = sender.replace(/\s+(?:bs\.?\s*)?[\d.,]+[.\-]*$/i, '');
  sender = sender.replace(/[.,;:\-\s]+$/, '').trim();

  if (sender.length < 2 || sender.length > 60) return null;
  if (/^(?:bs|bob|usd|tu|una|el|la|los|las)$/i.test(sender)) return null;
  if (/\d{4,}/.test(sender)) return null;

  if (sender === sender.toUpperCase()) {
    sender = sender
      .toLowerCase()
      .replace(/(^|\s)([a-záéíóúñü])/g, (match, space, letter) => space + letter.toUpperCase());
  }

  return sender;
}

function parseSender(text) {
  for (const pattern of SENDER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const sender = cleanSender(match[1]);
      if (sender) return sender;
    }
  }
  return null;
}

function parseReference(text) {
  for (const pattern of REFERENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

// Ventana para considerar dos notificaciones idénticas como el mismo cobro.
const DEDUPE_BUCKET_MS = 2 * 60 * 1000;

/** Hash FNV-1a de 32 bits, suficiente para detectar contenido repetido. */
function hashContent(value) {
  let hash = 0x811c9dc5;

  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193);
  }

  return (hash >>> 0).toString(16).padStart(8, '0');
}

/**
 * Clave estable para deduplicar: si la notificación trae referencia se usa esa;
 * si no, se agrupa por contenido + monto + remitente en una ventana de 2 minutos.
 */
function buildSourceKey({ reference, text, amount, sender, receivedAt }) {
  if (reference) {
    return `ref:${reference.toUpperCase()}`;
  }

  const timestamp = Date.parse(receivedAt);
  const bucket = Number.isFinite(timestamp) ? Math.floor(timestamp / DEDUPE_BUCKET_MS) : 0;

  return `auto:${hashContent(`${text}|${amount}|${sender}|${bucket}`)}`;
}

function looksLikeReceivedPayment(text) {
  const hasStrongIncoming = STRONG_INCOMING.some((keyword) => text.includes(keyword));
  if (hasStrongIncoming) return true;

  const hasWeakIncoming = WEAK_INCOMING.some((keyword) => text.includes(keyword));
  const hasOutgoing = OUTGOING.some((keyword) => text.includes(keyword));

  return hasWeakIncoming && !hasOutgoing;
}

export function parseBankNotification(payload) {
  const rawText = [payload.title, payload.text, payload.bigText, payload.subText]
    .filter(Boolean)
    .join('\n');
  if (!rawText) return null;

  const text = normalizeText(rawText);
  if (!looksLikeReceivedPayment(text)) return null;

  const amount = parseAmount(text);
  if (amount == null) return null;

  const sender = parseSender(rawText) || 'Remitente desconocido';
  const reference = parseReference(rawText);

  const receivedAt =
    typeof payload.postedTime === 'number' && payload.postedTime > 0
      ? new Date(payload.postedTime).toISOString()
      : new Date().toISOString();

  return {
    sender,
    bank: payload.bank || 'Banco',
    amount,
    reference,
    receivedAt,
    sourceKey: buildSourceKey({ reference, text, amount, sender, receivedAt }),
  };
}
