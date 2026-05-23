const db   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const login = async (user_name, password) => {
  const [rows] = await db.query(
    'SELECT * FROM Employee WHERE user_name = ? AND status = ?',
    [user_name, 'active']
  );

  if (rows.length === 0) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const employee = rows[0];
  const isMatch  = await bcrypt.compare(password, employee.password);

  if (!isMatch) {
    const err = new Error('Invalid credentials.');
    err.statusCode = 401;
    throw err;
  }

  const token = jwt.sign(
    { id: employee.id, user_name: employee.user_name, email: employee.email, role: employee.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  const { password: _, ...employeeData } = employee;
  return { token, employee: employeeData };
};

const register = async ({ user_name, full_name, email, password, department_id, role }) => {
  const hashed = await bcrypt.hash(password, 10);
  const validRoles = ['Admin', 'Manager', 'Employee'];
  const assignedRole = validRoles.includes(role) ? role : 'Employee';
  const [result] = await db.query(
    'INSERT INTO Employee (user_name, full_name, email, password, department_id, role) VALUES (?, ?, ?, ?, ?, ?)',
    [user_name, full_name, email, hashed, department_id || null, assignedRole]
  );
  return { id: result.insertId, user_name, full_name, email, role: assignedRole };
};

module.exports = { login, register };
