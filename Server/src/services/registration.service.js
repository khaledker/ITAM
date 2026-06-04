const db     = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Submit a new registration request (public, no auth).
 * Creates a Users record with status = 'pending'.
 */
const createRequest = async ({ user_name, full_name, email, password }) => {
  // Check for duplicate username / email in Users table
  const [existingUser] = await db.query(
    'SELECT id, status FROM Users WHERE user_name = ? OR email = ?',
    [user_name, email]
  );
  
  // Block if an active or pending account already exists
  const blocking = existingUser.filter(e => e.status === 'active' || e.status === 'pending');
  if (blocking.length > 0) {
    const err = new Error('An account with this username or email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const hashed = await bcrypt.hash(password, 10);
  const [result] = await db.query(
    'INSERT INTO Users (user_name, full_name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    [user_name, full_name, email, hashed, 'User', 'pending']
  );
  return { id: result.insertId, user_name, full_name, email, status: 'pending' };
};

/**
 * List registration requests (pending users), optionally filtered by status.
 */
const findAll = async ({ status } = {}) => {
  let query = `
    SELECT u.id, u.user_name, u.full_name, u.email, u.status,
           u.created_at, u.role
    FROM Users u
  `;
  const params = [];

  if (status) {
    query += ' WHERE u.status = ?';
    params.push(status);
  } else {
    // By default show non-active users (pending/rejected)
    query += " WHERE u.status IN ('pending', 'rejected')";
  }

  query += ' ORDER BY u.created_at DESC';
  const [rows] = await db.query(query, params);
  return rows;
};

/**
 * Approve a pending user — set status to 'active'.
 */
const approve = async (requestId, adminId) => {
  const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [requestId]);
  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const user = rows[0];
  if (user.status !== 'pending') {
    const err = new Error(`This user has already been ${user.status}.`);
    err.statusCode = 400;
    throw err;
  }

  await db.query(
    'UPDATE Users SET status = ? WHERE id = ?',
    ['active', requestId]
  );

  return { message: `Registration for ${user.full_name} approved. Account is now active.` };
};

/**
 * Reject a pending user.
 */
const reject = async (requestId, adminId) => {
  const [rows] = await db.query('SELECT * FROM Users WHERE id = ?', [requestId]);
  if (rows.length === 0) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const user = rows[0];
  if (user.status !== 'pending') {
    const err = new Error(`This user has already been ${user.status}.`);
    err.statusCode = 400;
    throw err;
  }

  await db.query(
    'UPDATE Users SET status = ? WHERE id = ?',
    ['rejected', requestId]
  );

  return { message: `Registration for ${user.full_name} rejected.` };
};

/**
 * Get count of pending users (for badge).
 */
const getPendingCount = async () => {
  const [rows] = await db.query("SELECT COUNT(*) AS count FROM Users WHERE status = 'pending'");
  return rows[0].count;
};

module.exports = { createRequest, findAll, approve, reject, getPendingCount };
