const SELECT_FIELDS = 'id, sender, bank, amount_minor, received_at, reference';

function mapRow(row) {
  return {
    id: row.id,
    sender: row.sender,
    bank: row.bank,
    amount: row.amount_minor,
    receivedAt: row.received_at,
    reference: row.reference,
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

/** Inserta un cobro. El id es único, así que reintentos no duplican filas. */
export async function insertPayment(db, payment) {
  await db.runAsync(
    `INSERT OR IGNORE INTO payments
       (id, sender, bank, amount_minor, received_at, reference, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    payment.id,
    payment.sender,
    payment.bank,
    payment.amount,
    payment.receivedAt,
    payment.reference ?? null,
    new Date().toISOString()
  );

  return payment;
}
