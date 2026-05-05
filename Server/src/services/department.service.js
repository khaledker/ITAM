const db = require('../config/db');

const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM Department ORDER BY libelle');
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM Department WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async ({ code, libelle }) => {
  const [result] = await db.query(
    'INSERT INTO Department (code, libelle) VALUES (?, ?)',
    [code, libelle]
  );
  return findById(result.insertId);
};

const update = async (id, { code, libelle }) => {
  await db.query('UPDATE Department SET code = ?, libelle = ? WHERE id = ?', [code, libelle, id]);
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM Department WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// Get all employees in a department
const getEmployees = async (departmentId) => {
  const [rows] = await db.query(
    'SELECT id, user_name, full_name, email, actif FROM Employee WHERE department_id = ?',
    [departmentId]
  );
  return rows;
};

module.exports = { findAll, findById, create, update, remove, getEmployees };
