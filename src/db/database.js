export const DATABASE_NAME = 'pay-notifier.db';

const DATABASE_VERSION = 4;
const LEGACY_SAMPLE_PAYMENT_IDS = [
  'pay-001',
  'pay-002',
  'pay-003',
  'pay-004',
  'pay-005',
  'pay-006',
  'pay-007',
  'pay-008',
];

/**
 * Crea el esquema la primera vez y aplica migraciones. `user_version` evita
 * repetir el trabajo en cada arranque.
 */
export async function migrateDbIfNeeded(db) {
  await db.execAsync('PRAGMA journal_mode = WAL');

  const result = await db.getFirstAsync('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  await db.withTransactionAsync(async () => {
    if (currentVersion < 1) {
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS payments (
          id TEXT PRIMARY KEY NOT NULL,
          sender TEXT NOT NULL,
          bank TEXT NOT NULL,
          amount_minor INTEGER NOT NULL,
          received_at TEXT NOT NULL,
          reference TEXT,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS payments_received_at_idx
          ON payments (received_at DESC);
      `);
    }

    if (currentVersion >= 1 && currentVersion < 2) {
      // Convierte los cobros de COP sin decimales a las unidades menores de BOB.
      await db.execAsync('UPDATE payments SET amount_minor = amount_minor * 100;');
    }

    if (currentVersion < 3) {
      const columns = await db.getAllAsync('PRAGMA table_info(payments)');
      const hasSourceKey = columns.some((column) => column.name === 'source_key');

      if (!hasSourceKey) {
        await db.execAsync('ALTER TABLE payments ADD COLUMN source_key TEXT;');
      }

      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS payments_source_key_idx
          ON payments (source_key);
      `);
    }

    if (currentVersion < 4) {
      const placeholders = LEGACY_SAMPLE_PAYMENT_IDS.map(() => '?').join(', ');
      await db.runAsync(
        `DELETE FROM payments WHERE id IN (${placeholders})`,
        ...LEGACY_SAMPLE_PAYMENT_IDS
      );
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
