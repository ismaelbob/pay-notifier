import { toMinorUnits } from './money';

const AMOUNT_REGEX = /\$?\s*([0-9]{1,3}(?:\.[0-9]{3})+(?:,[0-9]+)?|[0-9]+(?:,[0-9]+)?)/;

const SENDER_PATTERNS = [
  /de\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s]{2,30})/i,
  /desde\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s]{2,30})/i,
  /remitente[:\s]+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s]{2,30})/i,
  /te\s+envió\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s]{2,30})/i,
  /recibiste\s+de\s+([A-ZÁÉÍÓÚÑ][A-Za-zÁÉÍÓÚÑ\s]{2,30})/i,
];

const REFERENCE_PATTERNS = [
  /ref(?:erencia)?[:\s]+([A-Z0-9]{4,12})/i,
  /nro[:\s]+([A-Z0-9]{4,12})/i,
  /id[:\s]+([A-Z0-9]{4,12})/i,
];

function parseAmount(text) {
  if (!text) return null;
  const match = text.match(AMOUNT_REGEX);
  if (!match) return null;
  // Remove thousand separators (dots) and replace comma decimal with dot
  let numStr = match[1].replace(/\./g, '');
  if (numStr.includes(',')) {
    numStr = numStr.replace(',', '.');
  }
  const value = parseFloat(numStr);
  if (isNaN(value)) return null;
  // Assume whole pesos for Colombian banks
  return toMinorUnits(Math.round(value));
}

function parseSender(text) {
  if (!text) return null;
  for (const pattern of SENDER_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim().replace(/\s+/g, ' ');
    }
  }
  return null;
}

function parseReference(text) {
  if (!text) return null;
  for (const pattern of REFERENCE_PATTERNS) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export function parseBankNotification(payload) {
  const content = [payload.title, payload.text, payload.bigText, payload.subText]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  // Check if it looks like a received payment
  const isReceived = /(recib|entr|abono|transfer|deposit|crédit|acredit)/.test(content);
  if (!isReceived) return null;

  const fullText = [payload.title, payload.text, payload.bigText, payload.subText]
    .filter(Boolean)
    .join('\n');

  const amount = parseAmount(fullText);
  if (amount == null) return null;

  const sender = parseSender(fullText) || 'Remitente desconocido';
  const reference = parseReference(fullText);

  return {
    sender,
    bank: payload.bank,
    amount,
    reference,
    receivedAt: new Date().toISOString(),
  };
}
