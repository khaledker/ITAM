const db = require('../config/db');

// All valid permission values
const VALID_PERMISSIONS = ['consultation', 'reception', 'assignment', 'transfer', 'return'];

/**
 * Get a manager's permissions and assigned locations.
 * Returns { permissions: string[], locationIds: number[] }
 */
const getPermissions = async (userId) => {
  const [permRows] = await db.query(
    'SELECT permission FROM ManagerPermission WHERE user_id = ?',
    [userId]
  );
  const [locRows] = await db.query(
    'SELECT location_id FROM ManagerLocation WHERE user_id = ?',
    [userId]
  );
  return {
    permissions: permRows.map(r => r.permission),
    locationIds: locRows.map(r => r.location_id),
  };
};

/**
 * Replace all permissions for a manager.
 */
const setPermissions = async (userId, permissions) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ManagerPermission WHERE user_id = ?', [userId]);

    if (permissions && permissions.length > 0) {
      const valid = permissions.filter(p => VALID_PERMISSIONS.includes(p));
      if (valid.length > 0) {
        const values = valid.map(p => [userId, p]);
        await conn.query('INSERT INTO ManagerPermission (user_id, permission) VALUES ?', [values]);
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Replace all assigned locations for a manager.
 */
const setLocations = async (userId, locationIds) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ManagerLocation WHERE user_id = ?', [userId]);

    if (locationIds && locationIds.length > 0) {
      const values = locationIds.map(lid => [userId, lid]);
      await conn.query('INSERT INTO ManagerLocation (user_id, location_id) VALUES ?', [values]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Set both permissions and locations in one call.
 */
const setAll = async (userId, { permissions, locationIds }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Permissions
    await conn.query('DELETE FROM ManagerPermission WHERE user_id = ?', [userId]);
    if (permissions && permissions.length > 0) {
      const valid = permissions.filter(p => VALID_PERMISSIONS.includes(p));
      if (valid.length > 0) {
        const pValues = valid.map(p => [userId, p]);
        await conn.query('INSERT INTO ManagerPermission (user_id, permission) VALUES ?', [pValues]);
      }
    }

    // Locations
    await conn.query('DELETE FROM ManagerLocation WHERE user_id = ?', [userId]);
    if (locationIds && locationIds.length > 0) {
      const lValues = locationIds.map(lid => [userId, lid]);
      await conn.query('INSERT INTO ManagerLocation (user_id, location_id) VALUES ?', [lValues]);
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * Check if a manager has a specific permission.
 */
const hasPermission = async (userId, permission) => {
  const [rows] = await db.query(
    'SELECT 1 FROM ManagerPermission WHERE user_id = ? AND permission = ? LIMIT 1',
    [userId, permission]
  );
  return rows.length > 0;
};

/**
 * Get the list of location IDs assigned to a manager.
 */
const getLocationIds = async (userId) => {
  const [rows] = await db.query(
    'SELECT location_id FROM ManagerLocation WHERE user_id = ?',
    [userId]
  );
  return rows.map(r => r.location_id);
};

module.exports = {
  VALID_PERMISSIONS,
  getPermissions,
  setPermissions,
  setLocations,
  setAll,
  hasPermission,
  getLocationIds,
};
