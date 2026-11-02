const SELECT_FIELDS = 'id, sender, bank, amount_minor, received_at, reference, source_key';

function mapRow(row) {
  return {
    id: row.id,
    sender: row.sender,
    bank: row.bank,
    amount: row.amount_minor,
    receivedAt: row.received_at,
    reference: row.reference,
    sourceKey: row.source_key ?? null,
  };
}

/** Cobros más recientes primero. */
export async function listPayments(db) {
  const rows = await db.getAllAsync(
    `SELECT ${SELECT_FIELDS}
     FROM payments
     ORDER BY received_at DESC, created_at DESC`
  );

  return rows.map(mapRow);
}

/**
 * Inserta un cobro. El id y `source_key` son únicos, así que reintentos no
 * duplican filas. Devuelve `inserted: false` cuando la fila ya existía.
 */
export async function insertPayment(db, payment) {
  const result = await db.runAsync(
    `INSERT OR IGNORE INTO payments
       (id, sender, bank, amount_minor, received_at, reference, source_key, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    payment.id,
    payment.sender,
    payment.bank,
    payment.amount,
    payment.receivedAt,
    payment.reference ?? null,
    payment.sourceKey ?? null,
    new Date().toISOString()
  );

  return { payment, inserted: result.changes > 0 };
}
