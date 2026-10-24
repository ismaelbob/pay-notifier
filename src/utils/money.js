import { CURRENCY, CURRENCY_DECIMALS, LOCALE } from '../config';

const factor = 10 ** CURRENCY_DECIMALS;

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  minimumFractionDigits: CURRENCY_DECIMALS,
  maximumFractionDigits: CURRENCY_DECIMALS,
});

/** Convierte un importe "de pantalla" (p. ej. 250000 COP) a unidades menores (centavos). */
export function toMinorUnits(amount) {
  return Math.round(amount * factor);
}

/** Convierte unidades menores al importe que se muestra al usuario. */
export function toMajorUnits(amount) {
  return amount / factor;
}

/** Formatea un importe guardado en unidades menores. */
export function formatMoney(amountMinor) {
  return currencyFormatter.format(toMajorUnits(amountMinor));
}
