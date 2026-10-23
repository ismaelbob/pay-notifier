import { formatDayLabel, startOfDay } from './format';

export function isToday(value) {
  return startOfDay(value).getTime() === startOfDay(new Date()).getTime();
}

export function sumAmounts(payments) {
  return payments.reduce((total, payment) => total + payment.amount, 0);
}

export function getTotals(payments) {
  const todayStart = startOfDay(new Date()).getTime();
  const weekStart = todayStart - 6 * 86400000;

  let today = 0;
  let countToday = 0;
  let week = 0;

  for (const payment of payments) {
    const receivedAt = new Date(payment.receivedAt).getTime();

    if (receivedAt >= todayStart) {
      today += payment.amount;
      countToday += 1;
    }

    if (receivedAt >= weekStart) {
      week += payment.amount;
    }
  }

  return { today, countToday, week };
}

export function filterByRange(payments, range) {
  if (range === 'all') return payments;

  const days = range === 'today' ? 1 : 7;
  const limit = startOfDay(new Date()).getTime() - (days - 1) * 86400000;

  return payments.filter(
    (payment) => new Date(payment.receivedAt).getTime() >= limit
  );
}

export function groupByDay(payments) {
  const groups = new Map();

  for (const payment of payments) {
    const key = startOfDay(payment.receivedAt).toISOString();
    const group = groups.get(key) ?? [];
    group.push(payment);
    groups.set(key, group);
  }

  return Array.from(groups, ([key, data]) => ({
    key,
    title: formatDayLabel(key),
    total: sumAmounts(data),
    data,
  }));
}
