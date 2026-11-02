import { toMinorUnits } from '../utils/money';

const minutesAgo = (minutes) => new Date(Date.now() - minutes * 60000).toISOString();

const daysAgoAt = (days, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hours, minutes, 0, 0);
  return date.toISOString();
};

export const BANK_COLORS = {
  BNB: { light: '#1D4ED8', dark: '#60A5FA' },
  BMSC: { light: '#047857', dark: '#34D399' },
  'Banco Unión': { light: '#B45309', dark: '#FBBF24' },
  'Banco Bisa': { light: '#7C3AED', dark: '#A78BFA' },
  'BCP Bolivia': { light: '#0369A1', dark: '#38BDF8' },
  'Banco Económico': { light: '#BE123C', dark: '#FB7185' },
  BancoSol: { light: '#A21CAF', dark: '#E879F9' },
  Altoke: { light: '#0F766E', dark: '#2DD4BF' },
  'Tigo Money': { light: '#1E40AF', dark: '#818CF8' },
  YOLO: { light: '#CA8A04', dark: '#FACC15' },
  Yasta: { light: '#C2410C', dark: '#FB923C' },
  Yape: { light: '#6D28D9', dark: '#C4B5FD' },
  ZAS: { light: '#15803D', dark: '#4ADE80' },
};

// `amount` va en unidades menores (ver src/utils/money.js).
export const SEED_PAYMENTS = [
  {
    id: 'pay-001',
    sender: 'María Fernanda Quispe',
    bank: 'Yape',
    amount: toMinorUnits(350),
    receivedAt: minutesAgo(18),
    reference: 'A1K9Z',
  },
  {
    id: 'pay-002',
    sender: 'Juan Carlos Mamani',
    bank: 'BNB',
    amount: toMinorUnits(1200),
    receivedAt: minutesAgo(95),
    reference: 'B7Q2M',
  },
  {
    id: 'pay-003',
    sender: 'Rocío Choque',
    bank: 'Altoke',
    amount: toMinorUnits(85),
    receivedAt: minutesAgo(240),
    reference: 'C3X8L',
  },
  {
    id: 'pay-004',
    sender: 'Luis Alberto Flores',
    bank: 'BCP Bolivia',
    amount: toMinorUnits(4500),
    receivedAt: daysAgoAt(1, 16, 42),
    reference: 'D5N1P',
  },
  {
    id: 'pay-005',
    sender: 'Andrea Villarroel',
    bank: 'Yasta',
    amount: toMinorUnits(2500),
    receivedAt: daysAgoAt(1, 11, 5),
    reference: 'E9R4T',
  },
  {
    id: 'pay-006',
    sender: 'Sergio Gutiérrez',
    bank: 'BMSC',
    amount: toMinorUnits(620),
    receivedAt: daysAgoAt(2, 18, 20),
    reference: 'F2W6H',
  },
  {
    id: 'pay-007',
    sender: 'Valeria Condori',
    bank: 'ZAS',
    amount: toMinorUnits(180),
    receivedAt: daysAgoAt(3, 9, 48),
    reference: 'G8Y3J',
  },
  {
    id: 'pay-008',
    sender: 'Rodrigo Salazar',
    bank: 'Banco Unión',
    amount: toMinorUnits(950),
    receivedAt: daysAgoAt(5, 14, 12),
    reference: 'H4M7S',
  },
];

const RANDOM_SENDERS = [
  { sender: 'Gabriela Rojas', bank: 'Yape' },
  { sender: 'Nicolás Vargas', bank: 'BNB' },
  { sender: 'Paola Mercado', bank: 'Altoke' },
  { sender: 'Mateo Salinas', bank: 'BCP Bolivia' },
  { sender: 'Isabela Cruz', bank: 'Yasta' },
  { sender: 'Diego Torrez', bank: 'BMSC' },
  { sender: 'Camila Andrade', bank: 'Tigo Money' },
  { sender: 'Javier Ledezma', bank: 'Banco Bisa' },
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
  const amount = (Math.floor(Math.random() * 100) + 1) * 50;

  return {
    id: `sim-${Date.now()}`,
    ...contact,
    amount: toMinorUnits(amount),
    receivedAt: new Date().toISOString(),
    reference: buildReference(),
  };
}
