const db = require('../config/db');

const findAll = async () => {
  const [rows] = await db.query('SELECT * FROM Supplier ORDER BY name');
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM Supplier WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async ({ name, code, tel, contact }) => {
  const [result] = await db.query(
    'INSERT INTO Supplier (name, code, tel, contact) VALUES (?, ?, ?, ?)',
    [name, code, tel || null, contact || null]
  );
  return findById(result.insertId);
};

const update = async (id, { name, code, tel, contact }) => {
  await db.query(
    'UPDATE Supplier SET name = ?, code = ?, tel = ?, contact = ? WHERE id = ?',
    [name, code, tel || null, contact || null, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM Supplier WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };
