const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const daysAgoAt = (days, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const BANK_COLORS = {
  Nequi: { light: '#A21CAF', dark: '#E879F9' },
  Bancolombia: { light: '#B45309', dark: '#FBBF24' },
  Daviplata: { light: '#BE123C', dark: '#FB7185' },
  BBVA: { light: '#1D4ED8', dark: '#60A5FA' },
  Davivienda: { light: '#B91C1C', dark: '#F87171' },
  'Banco de Bogotá': { light: '#0369A1', dark: '#38BDF8' },
};

export const SEED_PAYMENTS = [
  {
    id: 'pay-001',
    sender: 'Mariana Ospina',
    bank: 'Nequi',
    amount: 250000,
    receivedAt: minutesAgo(18),
    reference: 'A1K9Z',
  },
  {
    id: 'pay-002',
    sender: 'Andrés Restrepo',
    bank: 'Bancolombia',
    amount: 120000,
    receivedAt: minutesAgo(95),
    reference: 'B7Q2M',
  },
  {
    id: 'pay-003',
    sender: 'Laura Cifuentes',
    bank: 'Daviplata',
    amount: 85000,
    receivedAt: minutesAgo(240),
    reference: 'C3X8L',
  },
  {
    id: 'pay-004',
    sender: 'Carlos Mejía',
    bank: 'BBVA',
    amount: 480000,
    receivedAt: daysAgoAt(1, 16, 42),
    reference: 'D5N1P',
  },
  {
    id: 'pay-005',
    sender: 'Sofía Ramírez',
    bank: 'Nequi',
    amount: 65000,
    receivedAt: daysAgoAt(1, 11, 5),
    reference: 'E9R4T',
  },
  {
    id: 'pay-006',
    sender: 'Diego Torres',
    bank: 'Banco de Bogotá',
    amount: 320000,
    receivedAt: daysAgoAt(2, 18, 20),
    reference: 'F2W6H',
  },
  {
    id: 'pay-007',
    sender: 'Valentina Gómez',
    bank: 'Davivienda',
    amount: 150000,
    receivedAt: daysAgoAt(3, 9, 48),
    reference: 'G8Y3J',
  },
  {
    id: 'pay-008',
    sender: 'Camilo Herrera',
    bank: 'Bancolombia',
    amount: 99000,
    receivedAt: daysAgoAt(5, 14, 12),
    reference: 'H4M7S',
  },
];

const RANDOM_SENDERS = [
  { sender: 'Juliana Peña', bank: 'Nequi' },
  { sender: 'Santiago Ríos', bank: 'Bancolombia' },
  { sender: 'Paula Duque', bank: 'Daviplata' },
  { sender: 'Mateo Salazar', bank: 'BBVA' },
  { sender: 'Isabela Cruz', bank: 'Davivienda' },
  { sender: 'Nicolás Vargas', bank: 'Banco de Bogotá' },
];

const REFERENCE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function buildReference() {
  let reference = '';
  for (let index = 0; index < 5; index += 1) {
    reference += REFERENCE_CHARS[Math.floor(Math.random() * REFERENCE_CHARS.length)];
  }
  return reference;
}

export function buildRandomPayment() {
  const contact = RANDOM_SENDERS[Math.floor(Math.random() * RANDOM_SENDERS.length)];
  const amount = (Math.floor(Math.random() * 96) + 4) * 5000;

  return {
    id: `sim-${Date.now()}`,
    ...contact,
    amount,
    receivedAt: new Date().toISOString(),
    reference: buildReference(),
  };
}
