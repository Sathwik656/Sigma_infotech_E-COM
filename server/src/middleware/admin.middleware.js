'use strict';

/**
 * Admin Authorization Middleware
 *
 * Must be used AFTER the `authenticate` middleware which attaches `req.user`.
 *
 * The `authenticate` middleware already performs a fresh lookup of the user's
 * role from public.users on every request, so this middleware only needs to
 * check the in-memory role value.
 *
 * Returns 403 Forbidden if the user is authenticated but not an admin.
 */
function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Access denied. Authentication required.',
    });
  }

  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
  }

  next();
}

module.exports = { requireAdmin };
