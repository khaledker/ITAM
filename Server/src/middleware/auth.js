const jwt = require('jsonwebtoken');

/**
 * Protects routes by verifying the JWT token.
 */
const protect = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided. Access denied.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.employee = decoded; // { id, user_name, email, role }
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

module.exports = { protect, authorize };
