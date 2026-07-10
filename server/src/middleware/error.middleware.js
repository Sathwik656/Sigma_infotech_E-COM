'use strict';

const { NODE_ENV } = require('../config/env');

/**
 * Centralized Error Handling Middleware
 *
 * Must be registered LAST in the Express middleware chain.
 * Catches all errors passed via next(err).
 *
 * Maps known Supabase/Auth error messages to appropriate HTTP codes.
 */
function errorHandler(err, req, res, next) {
  // Log the full error in development only
  if (NODE_ENV === 'development') {
    console.error('[ERROR]', err);
  } else {
    console.error(`[ERROR] ${err.message || 'Unknown error'}`);
  }

  // Default status code
  let status = err.status || err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // Map Supabase-specific error messages to HTTP codes
  const errorMap = {
    'Invalid login credentials': { status: 401, message: 'Invalid email or password.' },
    'Email not confirmed': { status: 403, message: 'Please confirm your email before logging in.' },
    'User already registered': { status: 409, message: 'An account with this email already exists.' },
    'Password should be at least 6 characters': { status: 400, message: 'Password must be at least 6 characters.' },
    'Unable to validate email address: invalid format': { status: 400, message: 'Please enter a valid email address.' },
    'Signup requires a valid password': { status: 400, message: 'Please provide a valid password.' },
  };

  const mapped = errorMap[message];
  if (mapped) {
    status = mapped.status;
    message = mapped.message;
  }

  // Never leak stack traces to clients in production
  res.status(status).json({
    success: false,
    message,
    ...(NODE_ENV === 'development' && err.stack ? { stack: err.stack } : {}),
  });
}

/**
 * 404 Not Found handler — catch-all for unregistered routes.
 */
function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
  });
}

module.exports = { errorHandler, notFound };
