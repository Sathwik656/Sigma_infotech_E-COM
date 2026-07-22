'use strict';

const { supabaseAnon, supabaseAdmin } = require('../config/supabase');
const userService = require('./user.service');

/**
 * Register a new user via Supabase Auth.
 * Stores the display name in user_metadata.
 *
 * @param {string} name     - User's full name
 * @param {string} email    - User's email address
 * @param {string} password - User's password (min 6 chars enforced by Supabase)
 * @returns {{ user, session }} on success
 * @throws Error on failure
 */
async function registerUser(name, email, password) {
  const { data, error } = await supabaseAnon.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name, name },
    },
  });

  if (error) throw error;

  // If Supabase created the user, also create a row in public.users
  let userRow = null;
  if (data.user) {
    try {
      userRow = await userService.createUser({
        authUserId: data.user.id,
        email: data.user.email,
        fullName: name,
      });
    } catch (err) {
      // If user row already exists (e.g. re-registration attempt), fetch it
      if (err.code === '23505') {
        userRow = await userService.getByAuthUserId(data.user.id);
      } else {
        throw err;
      }
    }
  }

  return {
    user: data.user,
    userRow,
    session: data.session,
    requiresConfirmation: !data.session,
  };
}

/**
 * Log in an existing user with email + password.
 *
 * @param {string} email    - User's email address
 * @param {string} password - User's password
 * @returns {{ user, access_token, refresh_token, expires_in }}
 * @throws Error on failure
 */
async function loginUser(email, password) {
  const { data, error } = await supabaseAnon.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  const { user, session } = data;

  // Look up the public.users row to get role (Supabase Auth doesn't store role)
  let role = 'customer';
  let publicUserId = null;
  try {
    const { data: userRow } = await supabaseAdmin
      .from('users')
      .select('id, role')
      .eq('auth_user_id', user.id)
      .single();
    if (userRow) {
      role = userRow.role || 'customer';
      publicUserId = userRow.id;
    }
  } catch {
    // Fallback to default customer role if lookup fails
  }

  return {
    user: {
      id: publicUserId || user.id,
      authUserId: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.user_metadata?.name || '',
      role,
      createdAt: user.created_at,
    },
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
  };
}

/**
 * Log out the currently authenticated user.
 * Invalidates the session on Supabase side.
 *
 * @param {string} accessToken - Current Bearer token
 */
async function logoutUser(accessToken) {
  // Use admin client to sign out with the user's JWT
  const { error } = await supabaseAdmin.auth.admin.signOut(accessToken);
  // Ignore "session not found" errors — user is effectively logged out
  if (error && error.message !== 'Session not found') throw error;
}

/**
 * Fetch the currently authenticated user by verifying their JWT.
 *
 * @param {string} accessToken - Bearer token from Authorization header
 * @returns {{ id, email, name, createdAt }}
 * @throws Error if token is invalid or expired
 */
async function getCurrentUser(accessToken) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);

  if (error || !data?.user) throw error || new Error('Invalid or expired token');

  const { user } = data;
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.user_metadata?.name || '',
    createdAt: user.created_at,
    emailConfirmed: !!user.email_confirmed_at,
  };
}

/**
 * Refresh the access token using a refresh token.
 *
 * @param {string} refreshToken - The stored refresh token
 * @returns {{ access_token, refresh_token, expires_in }}
 */
async function refreshSession(refreshToken) {
  const { data, error } = await supabaseAnon.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error || !data?.session) throw error || new Error('Refresh failed');

  const { session } = data;
  return {
    access_token: session.access_token,
    refresh_token: session.refresh_token,
    expires_in: session.expires_in,
  };
}

/**
 * Complete the OAuth login flow.
 * Receives a Supabase access_token from an OAuth provider (Google, etc.),
 * verifies it, ensures a public.users row exists, and returns tokens.
 *
 * @param {string} accessToken - JWT from Supabase after OAuth redirect
 * @returns {{ user, access_token, refresh_token, expires_in }}
 * @throws Error if token is invalid
 */
async function oauthLoginUser(accessToken) {
  // Verify the token and get the Supabase auth user
  const { data: { user }, error: getUserError } = await supabaseAdmin.auth.getUser(accessToken);
  if (getUserError || !user) {
    throw getUserError || new Error('Invalid or expired OAuth token');
  }

  // Extract name from user metadata (Google sets full_name, email, avatar_url)
  const fullName = user.user_metadata?.full_name
    || user.user_metadata?.name
    || user.email?.split('@')[0]
    || '';
  const avatar = user.user_metadata?.avatar_url || null;

  // Look up or create the public.users row
  let userRow = null;
  try {
    userRow = await userService.getByAuthUserId(user.id);
  } catch {
    // Not found — will create below
  }

  if (!userRow) {
    try {
      userRow = await userService.createUser({
        authUserId: user.id,
        email: user.email,
        fullName,
      });
    } catch (err) {
      if (err.code === '23505') {
        // Race condition — another request created it. Fetch it.
        userRow = await userService.getByAuthUserId(user.id);
      } else {
        throw err;
      }
    }
  }

  // If the user exists but their name or avatar is missing, update it
  if (userRow && avatar && !userRow.avatar) {
    try {
      await userService.updateUser(userRow.id, { avatar });
    } catch {
      // Non-critical — ignore
    }
  }

  return {
    user: {
      id: userRow?.id || user.id,
      authUserId: user.id,
      email: user.email,
      name: fullName,
      role: userRow?.role || 'customer',
      createdAt: user.created_at,
    },
    access_token: accessToken,
    // OAuth tokens: the caller needs to use the original tokens.
    // We return them as-is since they're valid Supabase JWTs.
    refresh_token: null,
    expires_in: null,
  };
}

module.exports = { registerUser, loginUser, logoutUser, getCurrentUser, refreshSession, oauthLoginUser };
