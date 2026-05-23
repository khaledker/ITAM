const jwt = require('jsonwebtoken');
const permissionService = require('../services/permission.service');

/**
 * Protects routes by verifying the JWT token.
 * For Managers, also eagerly loads their permissions and location scope.
 */
const protect = async (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = decoded; // { id, user_name, email, role }

    // For Managers, eagerly load permissions + assigned locations
    if (decoded.role === 'Manager') {
      const perms = await permissionService.getPermissions(decoded.id);
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
 * Usage: authorize('Admin', 'Manager')
 *
 * Roles:
 *  - Admin    → full access
 *  - Manager  → can approve movements, create/edit assets
 *  - Employee → read only + create draft movements
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
 * Admin always passes. For Managers, checks ManagerPermission table.
 * Usage: requirePermission('reception')
 *        requirePermission('assignment', 'transfer')  // requires at least one
 */
const requirePermission = (...permissions) => {
  return async (req, res, next) => {
    // Admin always has full access
    if (req.employee && req.employee.role === 'Admin') {
      return next();
    }

    // Employee role — they don't go through permission checks (handled by authorize)
    if (req.employee && req.employee.role === 'Employee') {
      return next();
    }

    // Manager — check granular permissions
    if (!req.employee) {
      return res.status(401).json({ message: 'Authentication required.' });
    }

    // Permissions should already be loaded by protect middleware
    const userPerms = req.employee.permissions || [];

    // Any Manager with at least one permission implicitly gets 'consultation'
    // (you can't assign/transfer/receive without viewing assets first)
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

module.exports = { protect, authorize, requirePermission };
