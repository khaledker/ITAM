const db = require('../config/db');

// ── Shared: get movement with subtype detail ──────────────
const findById = async (id) => {
  const [rows] = await db.query(`
    SELECT
      mv.id, mv.date, mv.status, mv.asset_id, mv.performed_by,
      a.serial_number, a.tag,
      e.full_name AS performed_by_name,
      CASE
        WHEN r.id   IS NOT NULL THEN 'Reception'
        WHEN asn.id IS NOT NULL THEN 'Assignment'
        WHEN t.id   IS NOT NULL THEN 'Transfer'
        WHEN ar.id  IS NOT NULL THEN 'Return'
      END AS type,
      r.purchase_order_number, r.receipt_number, r.supplier_id, r.destination_id,
      asn.expected_return, asn.assigned_to, asn.source_id AS assignment_source_id,
      t.reference, t.source_id AS transfer_source_id, t.destination_id AS transfer_dest_id,
      ar.reason, ar.returned_to
    FROM AssetMovement mv
    JOIN Asset a ON mv.asset_id = a.id
    JOIN Employee e ON mv.performed_by = e.id
    LEFT JOIN Reception   r   ON r.id   = mv.id
    LEFT JOIN Assignment  asn ON asn.id = mv.id
    LEFT JOIN Transfer    t   ON t.id   = mv.id
    LEFT JOIN AssetReturn ar  ON ar.id  = mv.id
    WHERE mv.id = ?
  `, [id]);
  return rows[0] || null;
};

const findAll = async ({ type, status, asset_id } = {}) => {
  let query = `
    SELECT
      mv.id, mv.date, mv.status, mv.asset_id, mv.performed_by,
      a.serial_number, a.tag,
      e.full_name AS performed_by_name,
      CASE
        WHEN r.id   IS NOT NULL THEN 'Reception'
        WHEN asn.id IS NOT NULL THEN 'Assignment'
        WHEN t.id   IS NOT NULL THEN 'Transfer'
        WHEN ar.id  IS NOT NULL THEN 'Return'
      END AS type
    FROM AssetMovement mv
    JOIN Asset a ON mv.asset_id = a.id
    JOIN Employee e ON mv.performed_by = e.id
    LEFT JOIN Reception   r   ON r.id   = mv.id
    LEFT JOIN Assignment  asn ON asn.id = mv.id
    LEFT JOIN Transfer    t   ON t.id   = mv.id
    LEFT JOIN AssetReturn ar  ON ar.id  = mv.id
    WHERE 1=1
  `;
  const params = [];
  if (status)   { query += ' AND mv.status = ?';   params.push(status);   }
  if (asset_id) { query += ' AND mv.asset_id = ?'; params.push(asset_id); }
  if (type) {
    const typeMap = { Reception: 'r.id', Assignment: 'asn.id', Transfer: 't.id', Return: 'ar.id' };
    if (typeMap[type]) query += ` AND ${typeMap[type]} IS NOT NULL`;
  }
  query += ' ORDER BY mv.date DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

// ── Reception ─────────────────────────────────────────────
const createReception = async ({
  date, asset_id, performed_by,
  purchase_order_number, receipt_number, supplier_id, destination_id
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES (?, ?, ?, ?)',
      [date, 'Draft', asset_id, performed_by]
    );
    const movId = mv.insertId;

    await conn.query(
      'INSERT INTO Reception (id, purchase_order_number, receipt_number, supplier_id, destination_id) VALUES (?, ?, ?, ?, ?)',
      [movId, purchase_order_number || null, receipt_number || null, supplier_id || null, destination_id || null]
    );

    await conn.commit();
    return findById(movId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Assignment ────────────────────────────────────────────
const createAssignment = async ({
  date, asset_id, performed_by,
  expected_return, assigned_to, source_id
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES (?, ?, ?, ?)',
      [date, 'Draft', asset_id, performed_by]
    );
    const movId = mv.insertId;

    await conn.query(
      'INSERT INTO Assignment (id, expected_return, assigned_to, source_id) VALUES (?, ?, ?, ?)',
      [movId, expected_return || null, assigned_to || null, source_id || null]
    );

    await conn.commit();
    return findById(movId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Transfer ──────────────────────────────────────────────
const createTransfer = async ({
  date, asset_id, performed_by,
  reference, source_id, destination_id
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES (?, ?, ?, ?)',
      [date, 'Draft', asset_id, performed_by]
    );
    const movId = mv.insertId;

    await conn.query(
      'INSERT INTO Transfer (id, reference, source_id, destination_id) VALUES (?, ?, ?, ?)',
      [movId, reference || null, source_id || null, destination_id || null]
    );

    await conn.commit();
    return findById(movId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Return ────────────────────────────────────────────────
const createReturn = async ({
  date, asset_id, performed_by,
  reason, returned_to
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, asset_id, performed_by) VALUES (?, ?, ?, ?)',
      [date, 'Draft', asset_id, performed_by]
    );
    const movId = mv.insertId;

    await conn.query(
      'INSERT INTO AssetReturn (id, reason, returned_to) VALUES (?, ?, ?)',
      [movId, reason || null, returned_to || null]
    );

    await conn.commit();
    return findById(movId);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

// ── Approve / Reject — updates asset status accordingly ───
const updateStatus = async (id, newStatus) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Get movement details
    const [mvRows] = await conn.query(`
      SELECT mv.*, mv.asset_id,
        CASE
          WHEN r.id   IS NOT NULL THEN 'Reception'
          WHEN asn.id IS NOT NULL THEN 'Assignment'
          WHEN t.id   IS NOT NULL THEN 'Transfer'
          WHEN ar.id  IS NOT NULL THEN 'Return'
        END AS type,
        asn.assigned_to, asn.source_id,
        t.destination_id AS t_dest,
        r.destination_id AS r_dest,
        ar.returned_to
      FROM AssetMovement mv
      LEFT JOIN Reception   r   ON r.id   = mv.id
      LEFT JOIN Assignment  asn ON asn.id = mv.id
      LEFT JOIN Transfer    t   ON t.id   = mv.id
      LEFT JOIN AssetReturn ar  ON ar.id  = mv.id
      WHERE mv.id = ?
    `, [id]);

    if (!mvRows[0]) {
      const err = new Error('Movement not found.');
      err.statusCode = 404;
      throw err;
    }

    const mv = mvRows[0];

    // Update movement status
    await conn.query('UPDATE AssetMovement SET status = ? WHERE id = ?', [newStatus, id]);

    // If approved, update asset status + location based on movement type
    if (newStatus === 'Approved') {
      if (mv.type === 'Reception') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ? WHERE id = ?',
          ['Available', mv.r_dest, mv.asset_id]
        );
      } else if (mv.type === 'Assignment') {
        await conn.query(
          'UPDATE Asset SET status = ?, employee_id = ? WHERE id = ?',
          ['Assigned', mv.assigned_to, mv.asset_id]
        );
      } else if (mv.type === 'Transfer') {
        await conn.query(
          'UPDATE Asset SET location_id = ? WHERE id = ?',
          [mv.t_dest, mv.asset_id]
        );
      } else if (mv.type === 'Return') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ?, employee_id = NULL WHERE id = ?',
          ['Available', mv.returned_to, mv.asset_id]
        );
      }
    }

    await conn.commit();
    return findById(id);
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

module.exports = {
  findAll, findById,
  createReception, createAssignment, createTransfer, createReturn,
  updateStatus,
};
