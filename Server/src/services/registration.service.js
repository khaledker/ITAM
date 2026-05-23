const db     = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Submit a new registration request (public, no auth).
 * Creates an Employee record with status = 'pending'.
 */
const createRequest = async ({ user_name, full_name, email, password, department_id }) => {
  // Check for duplicate username / email in Employee table
  const [existingEmp] = await db.query(
    'SELECT id, status FROM Employee WHERE user_name = ? OR email = ?',
    [user_name, email]
  );
  
  // Block if an active or pending account already exists
  const blocking = existingEmp.filter(e => e.status === 'active' || e.status === 'pending');
  if (blocking.length > 0) {
    const err = new Error('An account with this username or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO Employee (user_name, full_name, email, password, department_id, role, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [user_name, full_name, email, hashed, department_id || null, 'Employee', 'pending']
  );
  return { id: result.insertId, user_name, full_name, email, status: 'pending' };
};

/**
 * List registration requests (pending employees), optionally filtered by status.
 */
const findAll = async ({ status } = {}) => {
  let query = `
    SELECT e.id, e.user_name, e.full_name, e.email, e.status,
           e.created_at, e.reviewed_at,
           d.libelle AS department_name, d.id AS department_id,
           r.full_name AS reviewed_by_name
    FROM Employee e
    LEFT JOIN Department d ON e.department_id = d.id
    LEFT JOIN Employee r ON e.reviewed_by = r.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE e.status = ?';
    params.push(status);
  } else {
    // By default show non-active employees (pending/rejected)
    query += " WHERE e.status IN ('pending', 'rejected')";
  }

  query += ' ORDER BY e.created_at DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * Approve a pending employee — set status to 'active'.
 */
const approve = async (requestId, adminId) => {
  const [rows] = await db.query('SELECT * FROM Employee WHERE id = ?', [requestId]);
  if (rows.length === 0) {
    const err = new Error('Employee not found.');
    err.statusCode = 404;
    throw err;
  }

  const emp = rows[0];
  if (emp.status !== 'pending') {
    const err = new Error(`This employee has already been ${emp.status}.`);
    err.statusCode = 400;
    throw err;
  }

  await db.query(
    'UPDATE Employee SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    ['active', adminId, requestId]
  );

  return { message: `Registration for ${emp.full_name} approved. Account is now active.` };
};

/**
 * Reject a pending employee.
 */
const reject = async (requestId, adminId) => {
  const [rows] = await db.query('SELECT * FROM Employee WHERE id = ?', [requestId]);
  if (rows.length === 0) {
    const err = new Error('Employee not found.');
    err.statusCode = 404;
    throw err;
  }

  const emp = rows[0];
  if (emp.status !== 'pending') {
    const err = new Error(`This employee has already been ${emp.status}.`);
    err.statusCode = 400;
    throw err;
  }

  await db.query(
    'UPDATE Employee SET status = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
    ['rejected', adminId, requestId]
  );

  return { message: `Registration for ${emp.full_name} rejected.` };
};

/**
 * Get count of pending employees (for badge).
 */
const getPendingCount = async () => {
  const [rows] = await db.query("SELECT COUNT(*) AS count FROM Employee WHERE status = 'pending'");
  return rows[0].count;
};

module.exports = { createRequest, findAll, approve, reject, getPendingCount };
