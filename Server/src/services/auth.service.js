const db   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const login = async (user_name, password) => {
  const [rows] = await db.query(
    `SELECT u.*, e.full_name, e.email, e.department_id 
     FROM Users u 
     JOIN Employee e ON u.employee_id = e.id 
     WHERE u.user_name = ? AND u.status = ?`,
    [user_name, 'active']
  );

  if (rows.length === 0) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const user = rows[0];
  const isMatch  = await bcrypt.compare(password, user.password);

  if (!isMatch) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: user.id, user_name: user.user_name, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const { password: _, ...userData } = user;
  if (user.role === 'Manager') {
    const permissionService = require('./permission.service');
    const perms = await permissionService.getPermissions(user.id);
    userData.permissions = perms.permissions || [];
    userData.locationIds = perms.locationIds || [];
  }
  return { token, user: userData };
};

const register = async ({ user_name, full_name, email, password, role }) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    let employee_id;
    const [existingEmp] = await connection.query('SELECT id FROM Employee WHERE email = ?', [email]);
    if (existingEmp.length > 0) {
      employee_id = existingEmp[0].id;
    } else {
      const [empResult] = await connection.query('INSERT INTO Employee (full_name, email) VALUES (?, ?)', [full_name, email]);
      employee_id = empResult.insertId;
    }

    const hashed = await bcrypt.hash(password, 10);
    const validRoles = ['Admin', 'Manager', 'User'];
    const assignedRole = validRoles.includes(role) ? role : 'User';
    
    const [result] = await connection.query(
      'INSERT INTO Users (user_name, employee_id, password, role) VALUES (?, ?, ?, ?)',
      [user_name, employee_id, hashed, assignedRole]
    );

    await connection.commit();
    return { id: result.insertId, user_name, full_name, email, role: assignedRole };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { login, register };
