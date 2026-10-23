import { CURRENCY, LOCALE } from '../config';

const currencyFormatter = new Intl.NumberFormat(LOCALE, {
  style: 'currency',
  currency: CURRENCY,
  maximumFractionDigits: 0,
});

const timeFormatter = new Intl.DateTimeFormat(LOCALE, {
  hour: '2-digit',
  minute: '2-digit',
});

const shortDayFormatter = new Intl.DateTimeFormat(LOCALE, {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
});

const longDateFormatter = new Intl.DateTimeFormat(LOCALE, {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

export function formatTime(value) {
  return timeFormatter.format(new Date(value));
}

export function formatLongDate(value) {
  return longDateFormatter.format(new Date(value));
}

export function startOfDay(value) {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date;
}

export function formatDayLabel(value) {
  const target = startOfDay(value);
  const today = startOfDay(new Date());
  const diffInDays = Math.round((today.getTime() - target.getTime()) / 86400000);

  if (diffInDays === 0) return 'Hoy';
  if (diffInDays === 1) return 'Ayer';

  const label = shortDayFormatter.format(target).replace('.', '');
  return label.charAt(0).toUpperCase() + label.slice(1);
}
