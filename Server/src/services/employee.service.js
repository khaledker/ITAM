const db = require('../config/db');

const findAll = async () => {
  const [rows] = await db.query(`
    SELECT e.id, e.user_name, e.full_name, e.email, e.actif,
           d.id AS department_id, d.code AS department_code, d.libelle AS department_name
    FROM Employee e
    LEFT JOIN Department d ON e.department_id = d.id
    ORDER BY e.full_name
  `);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query(`
    SELECT e.id, e.user_name, e.full_name, e.email, e.actif,
           d.id AS department_id, d.code AS department_code, d.libelle AS department_name
    FROM Employee e
    LEFT JOIN Department d ON e.department_id = d.id
    WHERE e.id = ?
  `, [id]);
  return rows[0] || null;
};

const create = async ({ user_name, full_name, email, department_id, actif }) => {
  const [result] = await db.query(
    'INSERT INTO Employee (user_name, full_name, email, department_id, actif, password) VALUES (?, ?, ?, ?, ?, ?)',
    [user_name, full_name, email, department_id || null, actif ?? true, '']
  );
  return findById(result.insertId);
};

const update = async (id, { full_name, email, department_id, actif }) => {
  await db.query(
    'UPDATE Employee SET full_name = ?, email = ?, department_id = ?, actif = ? WHERE id = ?',
    [full_name, email, department_id || null, actif ?? true, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM Employee WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// Get all assets currently assigned to an employee
const getAssignedAssets = async (employeeId) => {
  const [rows] = await db.query(`
    SELECT a.id, a.serial_number, a.tag, a.status,
           am.name AS model_name, am.brand, am.category,
           asn.expected_return, asn.id AS assignment_id,
           mv.date AS assigned_date
    FROM Assignment asn
    JOIN AssetMovement mv ON asn.id = mv.id
    JOIN Asset a ON mv.asset_id = a.id
    JOIN AssetModel am ON a.model_id = am.id
    WHERE asn.assigned_to = ?
      AND mv.status = 'Approved'
      AND a.status = 'Assigned'
  `, [employeeId]);
  return rows;
};

const updateRole = async (id, role) => {
  const validRoles = ['Admin', 'Manager', 'Employee'];
  if (!validRoles.includes(role)) {
    const err = new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }
  await db.query('UPDATE Employee SET role = ? WHERE id = ?', [role, id]);
  return findById(id);
};

module.exports = { findAll, findById, create, update, remove, getAssignedAssets, updateRole };
