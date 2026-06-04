const db   = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');

const login = async (user_name, password) => {
  const [rows] = await db.query(
    'SELECT * FROM Users WHERE user_name = ? AND status = ?',
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
  const hashed = await bcrypt.hash(password, 10);
  const validRoles = ['Admin', 'Manager', 'User'];
  const assignedRole = validRoles.includes(role) ? role : 'User';
  const [result] = await db.query(
    'INSERT INTO Users (user_name, full_name, email, password, role) VALUES (?, ?, ?, ?, ?)',
    [user_name, full_name, email, hashed, assignedRole]
  );
  return { id: result.insertId, user_name, full_name, email, role: assignedRole };
};

module.exports = { login, register };
