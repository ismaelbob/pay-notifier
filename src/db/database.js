import { SEED_PAYMENTS } from '../data/payments';
import { insertPayment } from './paymentsRepository';

export const DATABASE_NAME = 'pay-notifier.db';

const DATABASE_VERSION = 1;

/**
 * Crea el esquema la primera vez (y siembra datos de ejemplo) y aplica
 * migraciones futuras. `user_version` evita repetir el trabajo en cada arranque.
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

      for (const payment of SEED_PAYMENTS) {
        await insertPayment(db, payment);
      }
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
