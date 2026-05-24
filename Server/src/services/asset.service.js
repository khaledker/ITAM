const db = require('../config/db');

// ── Base query with joins ─────────────────────────────────
const BASE_SELECT = `
  SELECT
    a.id, a.serial_number, a.tag, a.status, a.date_acq, a.description,
    am.id AS model_id, am.name AS model_name, am.code AS model_code,
    am.brand, am.category, am.part_number,
    l.id AS location_id, l.code AS location_code, l.label AS location_label, l.type AS location_type,
    emp.id AS employee_id, emp.full_name AS employee_name
  FROM Asset a
  JOIN AssetModel am ON a.model_id = am.id
  LEFT JOIN Location l   ON a.location_id  = l.id
  LEFT JOIN Employee emp ON a.employee_id  = emp.id
`;

// ── Format asset response to match UI schema (French/Specific naming) ──────────────
const formatAsset = (row) => ({
  id:      row.id,
  tag:     row.tag,
  partNum: row.part_number || '—',
  etat:    row.status?.toLowerCase() === 'assigned' ? 'active' : 
           row.status?.toLowerCase() === 'inmaintenance' ? 'maintenance' : 
           row.status?.toLowerCase() === 'retired' ? 'inactive' : 'active',
  createdAt: row.date_acq,
  modele: {
    nom:       row.model_name,
    marque:    row.brand,
    categorie: row.category,
  },
  // Keep original fields for logic if needed
  serial_number: row.serial_number,
  status:        row.status,
  location: row.location_id ? {
    id:    row.location_id,
    code:  row.location_code,
    label: row.location_label,
    type:  row.location_type,
  } : null,
  employee: row.employee_id ? {
    id:        row.employee_id,
    full_name: row.employee_name,
  } : null,
});

const findAll = async ({ status, category, location_id, employee_id, tag, sn, user_name, region, site, brand, supplier_id, scopeLocationIds } = {}) => {
  let query = BASE_SELECT + ' WHERE 1=1';
  const params = [];

  // Region/warehouse scoping for Managers
  if (scopeLocationIds && scopeLocationIds.length > 0) {
    query += ' AND a.location_id IN (?)';
    params.push(scopeLocationIds);
  }
  
  if (status) { query += ' AND a.status = ?'; params.push(status); }
  if (category) { query += ' AND am.category = ?'; params.push(category); }
  if (location_id) { query += ' AND a.location_id = ?'; params.push(location_id); }
  if (employee_id) { query += ' AND a.employee_id = ?'; params.push(employee_id); }
  if (tag) { query += ' AND a.tag LIKE ?'; params.push(`%${tag}%`); }
  if (sn) { query += ' AND a.serial_number LIKE ?'; params.push(`%${sn}%`); }
  if (user_name) { query += ' AND emp.full_name LIKE ?'; params.push(`%${user_name}%`); }
  if (region) { query += ' AND l.region = ?'; params.push(region); }
  if (site) { query += ' AND l.site = ?'; params.push(site); }
  if (brand) { query += ' AND am.brand = ?'; params.push(brand); }
  
  // Note: Supplier join is missing for direct asset link, but keeping this extensible for now
  
  query += ' ORDER BY a.tag';
  const [rows] = await db.query(query, params);
  return rows.map(formatAsset);
};

const findById = async (id) => {
  const [rows] = await db.query(BASE_SELECT + ' WHERE a.id = ?', [id]);
  return rows[0] ? formatAsset(rows[0]) : null;
};

const create = async ({ serial_number, tag, status, date_acq, description, model_id, location_id, employee_id }) => {
  const [result] = await db.query(
    'INSERT INTO Asset (serial_number, tag, status, date_acq, description, model_id, location_id, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [serial_number, tag, status || 'Available', date_acq || null, description || null, model_id, location_id || null, employee_id || null]
  );
  return findById(result.insertId);
};

const update = async (id, { serial_number, tag, status, date_acq, description, model_id, location_id, employee_id }) => {
  await db.query(
    'UPDATE Asset SET serial_number = ?, tag = ?, status = ?, date_acq = ?, description = ?, model_id = ?, location_id = ?, employee_id = ? WHERE id = ?',
    [serial_number, tag, status, date_acq || null, description || null, model_id, location_id || null, employee_id || null, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM Asset WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// ── Movement history for a single asset ──────────────────
const getMovementHistory = async (assetId) => {
  const [rows] = await db.query(`
    SELECT
      mv.id, mv.date, mv.status AS movement_status,
      e.full_name AS performed_by,
      CASE
        WHEN r.id   IS NOT NULL THEN 'Reception'
        WHEN asn.id IS NOT NULL THEN 'Assignment'
        WHEN t.id   IS NOT NULL THEN 'Transfer'
        WHEN ar.id  IS NOT NULL THEN 'Return'
      END AS movement_type,
      -- Reception fields
      r.purchase_order_number, r.receipt_number,
      sup.name AS supplier_name,
      dest_r.label AS reception_destination,
      -- Assignment fields
      asn.expected_return,
      emp_asn.full_name AS assigned_to,
      src_asn.label AS assignment_source,
      -- Transfer fields
      t.reference AS transfer_reference,
      src_t.label AS transfer_source,
      dest_t.label AS transfer_destination,
      -- Return fields
      ar.reason AS return_reason,
      ret.label AS returned_to
    FROM AssetMovement mv
    JOIN Employee e ON mv.performed_by = e.id
    LEFT JOIN Reception   r      ON r.id      = mv.id
    LEFT JOIN Supplier    sup    ON sup.id     = r.supplier_id
    LEFT JOIN Location    dest_r ON dest_r.id  = r.destination_id
    LEFT JOIN Assignment  asn    ON asn.id     = mv.id
    LEFT JOIN Employee    emp_asn ON emp_asn.id = asn.assigned_to
    LEFT JOIN Location    src_asn ON src_asn.id = asn.source_id
    LEFT JOIN Transfer    t      ON t.id       = mv.id
    LEFT JOIN Location    src_t  ON src_t.id   = t.source_id
    LEFT JOIN Location    dest_t ON dest_t.id  = t.destination_id
    LEFT JOIN AssetReturn ar     ON ar.id      = mv.id
    LEFT JOIN Location    ret    ON ret.id     = ar.returned_to
    WHERE EXISTS (SELECT 1 FROM MovementItem mi WHERE mi.movement_id = mv.id AND mi.asset_id = ?)
    ORDER BY mv.date DESC
  `, [assetId]);
  return rows;
};

// ── Stats summary ─────────────────────────────────────────
const getStats = async ({ scopeLocationIds } = {}) => {
  let query = `
    SELECT
      COUNT(*)                        AS total,
      SUM(status = 'Available')       AS available,
      SUM(status = 'Assigned')        AS assigned,
      SUM(status = 'inMaintenance')   AS in_maintenance,
      SUM(status = 'retired')         AS retired
    FROM Asset
  `;
  const params = [];
  if (scopeLocationIds && scopeLocationIds.length > 0) {
    query += ' WHERE location_id IN (?)';
    params.push(scopeLocationIds);
  }
  const [rows] = await db.query(query, params);
  return rows[0];
};

module.exports = { findAll, findById, create, update, remove, getMovementHistory, getStats };
