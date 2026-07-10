'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Authentication Middleware
 *
 * Reads the `Authorization: Bearer <token>` header, verifies the JWT
 * against Supabase, and attaches the decoded user to `req.user`.
 *
 * Returns 401 if:
 *  - No Authorization header is present
 *  - Token format is invalid
 *  - Token is expired or tampered
 */
async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Token is malformed.',
      });
    }

    // Verify JWT with Supabase — this also checks expiry
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data?.user) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Invalid or expired token.',
      });
    }

    // Attach clean user object to request
    req.user = {
      id: data.user.id,
      email: data.user.email,
      name:
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        '',
      createdAt: data.user.created_at,
      emailConfirmed: !!data.user.email_confirmed_at,
    };

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = { authenticate };
