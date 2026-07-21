'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * User Service
 * Handles all database operations for the public.users table.
 * Controllers must NEVER touch Supabase directly.
 */

/**
 * Find a user by their Supabase auth_user_id.
 *
 * @param {string} authUserId - UUID from auth.users
 * @returns {object|null}
 */
async function getByAuthUserId(authUserId) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('auth_user_id', authUserId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Find a user by their public users table id.
 *
 * @param {string} id - UUID from public.users
 * @returns {object|null}
 */
async function getById(id) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Create a new user row in public.users after Supabase Auth registration.
 *
 * @param {object} userData
 * @param {string} userData.authUserId  - auth.users.id
 * @param {string} userData.email
 * @param {string} userData.fullName
 * @param {string} [userData.phone]
 * @param {string} [userData.role='customer']
 * @returns {object} Created user row
 */
async function createUser({ authUserId, email, fullName, phone, role = 'customer' }) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .insert([{
      auth_user_id: authUserId,
      email,
      full_name: fullName,
      phone: phone || null,
      role,
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update a user's profile.
 *
 * @param {string} id - public.users.id
 * @param {object} updates - fields to update (full_name, phone, avatar)
 * @returns {object|null} Updated user row
 */
async function updateUser(id, updates) {
  const allowed = {};
  if (updates.full_name !== undefined) allowed.full_name = updates.full_name;
  if (updates.phone !== undefined) allowed.phone = updates.phone;
  if (updates.avatar !== undefined) allowed.avatar = updates.avatar;

  if (Object.keys(allowed).length === 0) return null;

  const { data, error } = await supabaseAdmin
    .from('users')
    .update(allowed)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

module.exports = { getByAuthUserId, getById, createUser, updateUser };
