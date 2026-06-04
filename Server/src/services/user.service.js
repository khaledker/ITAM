const db = require('../config/db');
const bcrypt = require('bcryptjs');

const findAll = async () => {
  const [rows] = await db.query(
    'SELECT id, user_name, full_name, email, role, status, created_at FROM Users ORDER BY created_at DESC'
  );
  return rows;
};

const create = async ({ user_name, full_name, email, password, role }) => {
  const hashed = await bcrypt.hash(password || 'Djezzy@123', 10);
  const [result] = await db.query(
    'INSERT INTO Users (user_name, full_name, email, password, role, status) VALUES (?, ?, ?, ?, ?, ?)',
    [user_name, full_name, email, hashed, role || 'User', 'active']
  );
  return { id: result.insertId };
};

const updateRole = async (id, role) => {
  await db.query('UPDATE Users SET role = ? WHERE id = ?', [role, id]);
  return { message: 'Role updated successfully' };
};

module.exports = { findAll, create, updateRole };
