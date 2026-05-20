const db = require('../config/db');

// ── Shared: get movement with subtype detail ──────────────
const findById = async (id) => {
  const [rows] = await db.query(`
    SELECT
      mv.id, mv.date, mv.status, mv.performed_by,
      GROUP_CONCAT(a.id) AS asset_ids,
      GROUP_CONCAT(a.serial_number SEPARATOR '||') AS serial_numbers,
      GROUP_CONCAT(a.tag SEPARATOR '||') AS tag,
      GROUP_CONCAT(am.brand SEPARATOR '||') AS brands,
      GROUP_CONCAT(am.name SEPARATOR '||') AS model_names,
      GROUP_CONCAT(am.category SEPARATOR '||') AS categories,
      e.full_name AS performed_by_name,
      CASE
        WHEN r.id   IS NOT NULL THEN 'Reception'
        WHEN asn.id IS NOT NULL THEN 'Assignment'
        WHEN t.id   IS NOT NULL THEN 'Transfer'
        WHEN ar.id  IS NOT NULL THEN 'Return'
      END AS type,
      r.purchase_order_number, r.receipt_number, r.supplier_id, sup.name AS supplier_name,
      r.destination_id, loc_r.label AS reception_dest_name,
      asn.expected_return, asn.assigned_to, e_asn.full_name AS assigned_to_name,
      asn.source_id AS assignment_source_id, loc_asn.label AS assignment_source_name,
      t.reference, t.source_id AS transfer_source_id, loc_tsrc.label AS transfer_source_name,
      t.destination_id AS transfer_dest_id, loc_tdst.label AS transfer_dest_name,
      ar.reason, ar.returned_to, loc_ar.label AS returned_to_name
    FROM AssetMovement mv
    JOIN MovementItem mi ON mv.id = mi.movement_id
    JOIN Asset a ON mi.asset_id = a.id
    JOIN AssetModel am ON am.id = a.model_id
    JOIN Employee e ON mv.performed_by = e.id
    LEFT JOIN Reception   r   ON r.id   = mv.id
    LEFT JOIN Supplier    sup ON r.supplier_id = sup.id
    LEFT JOIN Location    loc_r ON r.destination_id = loc_r.id
    LEFT JOIN Assignment  asn ON asn.id = mv.id
    LEFT JOIN Employee    e_asn ON asn.assigned_to = e_asn.id
    LEFT JOIN Location    loc_asn ON asn.source_id = loc_asn.id
    LEFT JOIN Transfer    t   ON t.id   = mv.id
    LEFT JOIN Location    loc_tsrc ON t.source_id = loc_tsrc.id
    LEFT JOIN Location    loc_tdst ON t.destination_id = loc_tdst.id
    LEFT JOIN AssetReturn ar  ON ar.id  = mv.id
    LEFT JOIN Location    loc_ar ON ar.returned_to = loc_ar.id
    WHERE mv.id = ?
    GROUP BY mv.id
  `, [id]);
  return rows[0] || null;
};

const findAll = async ({ type, status, asset_id, search, sort } = {}) => {
  let query = `
    SELECT
      mv.id, mv.date, mv.status, mv.performed_by,
      GROUP_CONCAT(a.id) AS asset_ids,
      SUBSTRING_INDEX(GROUP_CONCAT(a.tag ORDER BY a.tag SEPARATOR ','), ',', 3) AS tag,
      COUNT(mi.asset_id) AS asset_count,
      GROUP_CONCAT(a.serial_number) AS serial_numbers,
      e.full_name AS performed_by_name,
      CASE
        WHEN r.id   IS NOT NULL THEN 'Reception'
        WHEN asn.id IS NOT NULL THEN 'Assignment'
        WHEN t.id   IS NOT NULL THEN 'Transfer'
        WHEN ar.id  IS NOT NULL THEN 'Return'
      END AS type
    FROM AssetMovement mv
    JOIN MovementItem mi ON mv.id = mi.movement_id
    JOIN Asset a ON mi.asset_id = a.id
    JOIN Employee e ON mv.performed_by = e.id
    LEFT JOIN Reception   r   ON r.id   = mv.id
    LEFT JOIN Assignment  asn ON asn.id = mv.id
    LEFT JOIN Transfer    t   ON t.id   = mv.id
    LEFT JOIN AssetReturn ar  ON ar.id  = mv.id
    WHERE 1=1
  `;
  const params = [];
  if (status)   { query += ' AND mv.status = ?';   params.push(status);   }
  if (asset_id) { query += ' AND mi.asset_id = ?'; params.push(asset_id); }
  if (search)   { query += ' AND a.tag LIKE ?';    params.push(`%${search}%`); }
  if (type) {
    const typeMap = { Reception: 'r.id', Assignment: 'asn.id', Transfer: 't.id', Return: 'ar.id' };
    if (typeMap[type]) query += ` AND ${typeMap[type]} IS NOT NULL`;
  }
  const orderDir = sort === 'oldest' ? 'ASC' : 'DESC';
  query += `\n    GROUP BY mv.id\n    ORDER BY mv.id ${orderDir}`;
  const [rows] = await db.query(query, params);
  return rows;
};

// ── Reception ─────────────────────────────────────────────
const createReception = async ({
  date, asset_ids, performed_by,
  purchase_order_number, receipt_number, supplier_id, destination_id
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, performed_by) VALUES (?, ?, ?)',
      [date, 'Draft', performed_by]
    );
    const movId = mv.insertId;
    if (asset_ids && asset_ids.length > 0) {
      const itemValues = asset_ids.map(id => [movId, id]);
      await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES ?', [itemValues]);
    }

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
  date, asset_ids, performed_by,
  expected_return, assigned_to, source_id
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, performed_by) VALUES (?, ?, ?)',
      [date, 'Draft', performed_by]
    );
    const movId = mv.insertId;
    if (asset_ids && asset_ids.length > 0) {
      const itemValues = asset_ids.map(id => [movId, id]);
      await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES ?', [itemValues]);
    }

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
  date, asset_ids, performed_by,
  reference, source_id, destination_id
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, performed_by) VALUES (?, ?, ?)',
      [date, 'Draft', performed_by]
    );
    const movId = mv.insertId;
    if (asset_ids && asset_ids.length > 0) {
      const itemValues = asset_ids.map(id => [movId, id]);
      await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES ?', [itemValues]);
    }

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
  date, asset_ids, performed_by,
  reason, returned_to
}) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [mv] = await conn.query(
      'INSERT INTO AssetMovement (date, status, performed_by) VALUES (?, ?, ?)',
      [date, 'Draft', performed_by]
    );
    const movId = mv.insertId;
    if (asset_ids && asset_ids.length > 0) {
      const itemValues = asset_ids.map(id => [movId, id]);
      await conn.query('INSERT INTO MovementItem (movement_id, asset_id) VALUES ?', [itemValues]);
    }

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
      SELECT mv.*,
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
    const [itemRows] = await conn.query('SELECT asset_id FROM MovementItem WHERE movement_id = ?', [id]);
    const assetIds = itemRows.map(r => r.asset_id);

    // Update movement status
    await conn.query('UPDATE AssetMovement SET status = ? WHERE id = ?', [newStatus, id]);

    // If approved, update asset status + location based on movement type
    if (newStatus === 'Approved' && assetIds.length > 0) {
      if (mv.type === 'Reception') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ? WHERE id IN (?)',
          ['Available', mv.r_dest, assetIds]
        );
      } else if (mv.type === 'Assignment') {
        await conn.query(
          'UPDATE Asset SET status = ?, employee_id = ? WHERE id IN (?)',
          ['Assigned', mv.assigned_to, assetIds]
        );
      } else if (mv.type === 'Transfer') {
        await conn.query(
          'UPDATE Asset SET location_id = ? WHERE id IN (?)',
          [mv.t_dest, assetIds]
        );
      } else if (mv.type === 'Return') {
        await conn.query(
          'UPDATE Asset SET status = ?, location_id = ?, employee_id = NULL WHERE id IN (?)',
          ['Available', mv.returned_to, assetIds]
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

