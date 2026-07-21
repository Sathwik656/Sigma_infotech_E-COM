'use strict';

const authService = require('../services/auth.service');
const userService = require('../services/user.service');

/**
 * POST /api/auth/register
 * Registers a new user account.
 */
async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;
    const result = await authService.registerUser(name, email, password);

    const message = result.requiresConfirmation
      ? 'Registration successful. Please check your email to confirm your account.'
      : 'Registration successful. You can now log in.';

    res.status(201).json({
      success: true,
      message,
      requiresConfirmation: result.requiresConfirmation,
      user: result.user
        ? {
            id: result.user.id,
            email: result.user.email,
            name: result.user.user_metadata?.full_name || '',
          }
        : null,
      profile: result.userRow
        ? {
            id: result.userRow.id,
            full_name: result.userRow.full_name,
            email: result.userRow.email,
            role: result.userRow.role,
          }
        : null,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/login
 * Authenticates a user and returns tokens.
 */
async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const data = await authService.loginUser(email, password);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      user: data.user,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/logout
 * Invalidates the current session.
 */
async function logout(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      await authService.logoutUser(token);
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/auth/me
 * Returns the authenticated user's details.
 * Requires a valid Bearer token.
 */
async function getMe(req, res, next) {
  try {
    const profile = await userService.getByAuthUserId(req.user.authUserId);

    res.status(200).json({
      success: true,
      user: {
        id: req.user.id,
        authUserId: req.user.authUserId,
        email: req.user.email,
        name: req.user.name,
        role: req.user.role,
        createdAt: req.user.createdAt,
        emailConfirmed: req.user.emailConfirmed,
      },
      profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh
 * Exchanges a refresh token for a new access token.
 */
async function refresh(req, res, next) {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'refresh_token is required',
      });
    }

    const data = await authService.refreshSession(refresh_token);

    res.status(200).json({
      success: true,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { register, login, logout, getMe, refresh };
