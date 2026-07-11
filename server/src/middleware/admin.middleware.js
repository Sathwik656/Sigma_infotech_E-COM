'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Admin Authorization Middleware
 *
 * Must be used AFTER the `authenticate` middleware which attaches `req.user`.
 *
 * Checks that the authenticated user has `role: 'admin'` stored in their
 * Supabase user_metadata.
 *
 * To grant admin access to a user, run the following in Supabase SQL Editor:
 *
 *   UPDATE auth.users
 *   SET raw_user_meta_data = raw_user_meta_data || '{"role": "admin"}'::jsonb
 *   WHERE email = 'admin@yourdomain.com';
 *
 * Returns 403 Forbidden if the user is authenticated but not an admin.
 */
async function requireAdmin(req, res, next) {
  try {
    // req.user is attached by auth.middleware — must be used after `authenticate`
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Authentication required.',
      });
    }

    // Fetch fresh user metadata from Supabase to get the role
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(req.user.id);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Could not verify user.',
      });
    }

    const role = data.user.user_metadata?.role;

    if (role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.',
      });
    }

    // Attach role to the request user object for downstream use
    req.user.role = 'admin';

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { requireAdmin };
