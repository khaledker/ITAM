const db = require('../config/db');

const findAll = async ({ category, brand } = {}) => {
  let query = 'SELECT * FROM AssetModel WHERE 1=1';
  const params = [];
  if (category) { query += ' AND category = ?'; params.push(category); }
  if (brand)    { query += ' AND brand = ?';    params.push(brand);    }
  query += ' ORDER BY name';
  const [rows] = await db.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM AssetModel WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async ({ name, code, brand, category, part_number }) => {
  const [result] = await db.query(
    'INSERT INTO AssetModel (name, code, brand, category, part_number) VALUES (?, ?, ?, ?, ?)',
    [name, code, brand || null, category || null, part_number || null]
  );
  return findById(result.insertId);
};

const update = async (id, { name, code, brand, category, part_number }) => {
  await db.query(
    'UPDATE AssetModel SET name = ?, code = ?, brand = ?, category = ?, part_number = ? WHERE id = ?',
    [name, code, brand || null, category || null, part_number || null, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM AssetModel WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

module.exports = { findAll, findById, create, update, remove };
