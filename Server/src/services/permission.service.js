const db = require('../config/db');

// All valid permission values
const VALID_PERMISSIONS = ['consultation', 'reception', 'assignment', 'transfer', 'return'];

/**
 * Get a manager's permissions and assigned locations.
 * Returns { permissions: string[], locationIds: number[] }
 */
const getPermissions = async (employeeId) => {
  const [permRows] = await db.query(
    'SELECT permission FROM ManagerPermission WHERE employee_id = ?',
    [employeeId]
  );
  const [locRows] = await db.query(
    'SELECT location_id FROM ManagerLocation WHERE employee_id = ?',
    [employeeId]
  );
  return {
    permissions: permRows.map(r => r.permission),
    locationIds: locRows.map(r => r.location_id),
  };
};

/**
 * Replace all permissions for a manager.
 */
const setPermissions = async (employeeId, permissions) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ManagerPermission WHERE employee_id = ?', [employeeId]);

    if (permissions && permissions.length > 0) {
      const valid = permissions.filter(p => VALID_PERMISSIONS.includes(p));
      if (valid.length > 0) {
        const values = valid.map(p => [employeeId, p]);
        await conn.query('INSERT INTO ManagerPermission (employee_id, permission) VALUES ?', [values]);
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
const setLocations = async (employeeId, locationIds) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('DELETE FROM ManagerLocation WHERE employee_id = ?', [employeeId]);

    if (locationIds && locationIds.length > 0) {
      const values = locationIds.map(lid => [employeeId, lid]);
      await conn.query('INSERT INTO ManagerLocation (employee_id, location_id) VALUES ?', [values]);
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
const setAll = async (employeeId, { permissions, locationIds }) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Permissions
    await conn.query('DELETE FROM ManagerPermission WHERE employee_id = ?', [employeeId]);
    if (permissions && permissions.length > 0) {
      const valid = permissions.filter(p => VALID_PERMISSIONS.includes(p));
      if (valid.length > 0) {
        const pValues = valid.map(p => [employeeId, p]);
        await conn.query('INSERT INTO ManagerPermission (employee_id, permission) VALUES ?', [pValues]);
      }
    }

    // Locations
    await conn.query('DELETE FROM ManagerLocation WHERE employee_id = ?', [employeeId]);
    if (locationIds && locationIds.length > 0) {
      const lValues = locationIds.map(lid => [employeeId, lid]);
      await conn.query('INSERT INTO ManagerLocation (employee_id, location_id) VALUES ?', [lValues]);
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
const hasPermission = async (employeeId, permission) => {
  const [rows] = await db.query(
    'SELECT 1 FROM ManagerPermission WHERE employee_id = ? AND permission = ? LIMIT 1',
    [employeeId, permission]
  );
  return rows.length > 0;
};

/**
 * Get the list of location IDs assigned to a manager.
 */
const getLocationIds = async (employeeId) => {
  const [rows] = await db.query(
    'SELECT location_id FROM ManagerLocation WHERE employee_id = ?',
    [employeeId]
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
