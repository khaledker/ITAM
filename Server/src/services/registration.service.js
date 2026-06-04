const db     = require('../config/db');
const bcrypt = require('bcryptjs');

/**
 * Submit a new registration request (public, no auth).
 * Creates a Users record with status = 'pending'.
 */
const createRequest = async ({ user_name, full_name, email, password, department_id }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Check for duplicate username in Users or email in Employee/Users
    const [existingUser] = await connection.query(
      `SELECT u.id, u.status 
       FROM Users u 
       JOIN Employee e ON u.employee_id = e.id 
       WHERE u.user_name = ? OR e.email = ?`,
      [user_name, email]
    );
    
    // Block if an active or pending account already exists
    const blocking = existingUser.filter(e => e.status === 'active' || e.status === 'pending');
    if (blocking.length > 0) {
      const err = new Error('An account with this username or email already exists.');
      err.statusCode = 409;
      throw err;
    }

    let employee_id;
    const [existingEmp] = await connection.query('SELECT id FROM Employee WHERE email = ?', [email]);
    if (existingEmp.length > 0) {
      employee_id = existingEmp[0].id;
      // Optionally update their department if provided
      if (department_id) {
        await connection.query('UPDATE Employee SET department_id = ? WHERE id = ?', [department_id, employee_id]);
      }
    } else {
      const [empResult] = await connection.query(
        'INSERT INTO Employee (full_name, email, department_id) VALUES (?, ?, ?)', 
        [full_name, email, department_id || null]
      );
      employee_id = empResult.insertId;
    }

    const hashed = await bcrypt.hash(password, 10);
    const [result] = await connection.query(
      'INSERT INTO Users (user_name, employee_id, password, role, status) VALUES (?, ?, ?, ?, ?)',
      [user_name, employee_id, hashed, 'User', 'pending']
    );

    await connection.commit();
    return { id: result.insertId, user_name, full_name, email, status: 'pending' };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

/**
 * List registration requests (pending users), optionally filtered by status.
 */
const findAll = async ({ status } = {}) => {
  let query = `
    SELECT u.id, u.user_name, e.full_name, e.email, u.status,
           u.created_at, u.role
    FROM Users u
    JOIN Employee e ON u.employee_id = e.id
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
  const [rows] = await db.query(
    'SELECT u.*, e.full_name FROM Users u JOIN Employee e ON u.employee_id = e.id WHERE u.id = ?', 
    [requestId]
  );
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
  const [rows] = await db.query(
    'SELECT u.*, e.full_name FROM Users u JOIN Employee e ON u.employee_id = e.id WHERE u.id = ?', 
    [requestId]
  );
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
