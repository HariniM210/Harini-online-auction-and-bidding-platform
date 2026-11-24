/**
 * Role-based authorization middleware.
 * Supports only 'user' and 'admin' roles.
 * Prevents privilege escalation by requiring explicit role match.
 */
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ status: 'error', message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ status: 'error', message: 'Insufficient permissions' });
    }

    next();
  };
};

module.exports = { requireRole };