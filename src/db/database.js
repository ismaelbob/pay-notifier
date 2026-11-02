import { SEED_PAYMENTS } from '../data/payments';
import { insertPayment } from './paymentsRepository';

export const DATABASE_NAME = 'pay-notifier.db';

const DATABASE_VERSION = 3;

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
    }

    // En instalaciones nuevas (currentVersion 0) los seeds se siembran al final,
    // cuando la tabla ya tiene todas las columnas.
    if (currentVersion >= 1 && currentVersion < 2) {
      // COP no tiene decimales y BOB usa 2: multiplicar por 100 conserva el
      // valor numérico de los cobros ya guardados.
      await db.execAsync('UPDATE payments SET amount_minor = amount_minor * 100;');

      // Se borran los datos de ejemplo colombianos; se resiembran más abajo.
      const seedIds = SEED_PAYMENTS.map((payment) => payment.id);
      const placeholders = seedIds.map(() => '?').join(', ');
      await db.runAsync(`DELETE FROM payments WHERE id IN (${placeholders})`, ...seedIds);
    }

    if (currentVersion < 3) {
      // Deduplicación de notificaciones: una misma clave no se guarda dos veces.
      const columns = await db.getAllAsync('PRAGMA table_info(payments)');
      const hasSourceKey = columns.some((column) => column.name === 'source_key');

      if (!hasSourceKey) {
        await db.execAsync('ALTER TABLE payments ADD COLUMN source_key TEXT;');
      }

      // SQLite permite múltiples NULL en un índice UNIQUE, así que los cobros
      // manuales o simulados (sin clave) no se ven afectados.
      await db.execAsync(`
        CREATE UNIQUE INDEX IF NOT EXISTS payments_source_key_idx
          ON payments (source_key);
      `);
    }

    // Instalaciones nuevas o bases migradas desde la versión 1.
    if (currentVersion < 2) {
      for (const payment of SEED_PAYMENTS) {
        await insertPayment(db, payment);
      }
    }

    await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
  });
}
