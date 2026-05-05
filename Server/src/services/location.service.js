const db = require('../config/db');

const findAll = async (type) => {
  let query = 'SELECT * FROM Location';
  const params = [];
  if (type) {
    query += ' WHERE type = ?';
    params.push(type);
  }
  query += ' ORDER BY label';
  const [rows] = await db.query(query, params);
  return rows;
};

const findById = async (id) => {
  const [rows] = await db.query('SELECT * FROM Location WHERE id = ?', [id]);
  return rows[0] || null;
};

const create = async ({ code, label, region, site, type }) => {
  const [result] = await db.query(
    'INSERT INTO Location (code, label, region, site, type) VALUES (?, ?, ?, ?, ?)',
    [code, label, region || null, site || null, type || null]
  );
  return findById(result.insertId);
};

const update = async (id, { code, label, region, site, type }) => {
  await db.query(
    'UPDATE Location SET code = ?, label = ?, region = ?, site = ?, type = ? WHERE id = ?',
    [code, label, region || null, site || null, type || null, id]
  );
  return findById(id);
};

const remove = async (id) => {
  const [result] = await db.query('DELETE FROM Location WHERE id = ?', [id]);
  return result.affectedRows > 0;
};

// Get all assets currently at this location
const getAssets = async (locationId) => {
  const [rows] = await db.query(`
    SELECT a.id, a.serial_number, a.tag, a.status,
           am.name AS model_name, am.brand, am.category
    FROM Asset a
    JOIN AssetModel am ON a.model_id = am.id
    WHERE a.location_id = ?
    ORDER BY a.tag
  `, [locationId]);
  return rows;
};

module.exports = { findAll, findById, create, update, remove, getAssets };
