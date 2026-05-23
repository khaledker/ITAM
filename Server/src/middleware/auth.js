const jwt = require('jsonwebtoken');
const permissionService = require('../services/permission.service');
const db = require('../config/db');

/**
 * Protects routes by verifying the JWT token.
 * Eagerly loads current role, status, and permissions from the database.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch latest employee data from the database
    const [rows] = await db.query(
      'SELECT id, user_name, email, role, status FROM Employee WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ message: 'User no longer exists.' });
    }

    const employee = rows[0];

    // Check account status
    if (employee.status !== 'active') {
      return res.status(403).json({
        message: `Account is ${employee.status}. Contact administrator.`
      });
    }

    req.employee = employee;

    // For Managers, eagerly load permissions + assigned locations
    if (employee.role === 'Manager') {
      const perms = await permissionService.getPermissions(employee.id);
      req.employee.permissions = perms.permissions;
      req.employee.locationIds = perms.locationIds;
    }

    next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

/**
 * Restricts access to specific roles.
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.employee || !roles.includes(req.employee.role)) {
      return res.status(403).json({
        message: `Access denied. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
};

/**
 * Restricts access based on functionality permissions.
 * Does NOT check locations—that's done by requireLocationAccess.
 */
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    if (!req.employee) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Admin always has full access
    if (req.employee.role === 'Admin') {
      return next();
    }

    // Employee role — basic access only (create drafts, view own assets)
    if (req.employee.role === 'Employee') {
      // Optional: Block employees from certain operations entirely
      const employeeAllowed = ['consultation'];
      const hasAccess = permissions.some(p => employeeAllowed.includes(p));
      if (!hasAccess) {
        return res.status(403).json({
          message: 'Employees cannot perform this operation.'
        });
      }
      return next();
    }

    // Manager — check granular permissions
    const userPerms = req.employee.permissions || [];

    // Implicit consultation for any manager with at least one permission
    const effectivePerms = userPerms.length > 0
      ? [...new Set([...userPerms, 'consultation'])]
      : userPerms;

    const hasAny = permissions.some(p => effectivePerms.includes(p));

    if (!hasAny) {
      return res.status(403).json({
        message: `Permission denied. Required: ${permissions.join(' or ')}.`
      });
    }

    next();
  };
};

/**
 * ✅ NEW: Checks if the manager has access to a specific location.
 * Must be used AFTER requirePermission on routes with location-specific operations.
 * 
 * Usage: requireLocationAccess('body', 'destination_id')
 *        requireLocationAccess('params', 'id')
 *        requireLocationAccess('query', 'location_id')
 *        requireLocationAccess('body', ['source_id', 'destination_id']) // checks all
 */
const requireLocationAccess = (source = 'body', fields = 'location_id') => {
  return (req, res, next) => {
    // Admin bypasses location check
    if (req.employee.role === 'Admin') return next();

    // Employees don't have location restrictions
    if (req.employee.role === 'Employee') return next();

    // Manager location check
    const managerLocations = req.employee.locationIds || [];

    // No locations assigned = no access to any location operations
    if (managerLocations.length === 0) {
      return res.status(403).json({
        message: 'You have no locations assigned. Contact administrator.'
      });
    }

    // Normalize fields to array
    const fieldList = Array.isArray(fields) ? fields : [fields];

    // Get request data based on source
    let data;
    if (source === 'body') data = req.body;
    else if (source === 'params') data = req.params;
    else if (source === 'query') data = req.query;
    else return next(); // Unknown source, skip

    // Check each location field
    for (const field of fieldList) {
      const locationId = data[field];
      if (locationId && !managerLocations.includes(Number(locationId))) {
        return res.status(403).json({
          message: `You don't have access to location ${locationId}.`
        });
      }
    }

    next();
  };
};

module.exports = { protect, authorize, requirePermission, requireLocationAccess };