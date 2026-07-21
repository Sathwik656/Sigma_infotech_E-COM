'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Address Service
 * Handles all database operations for public.user_addresses.
 * Every query enforces user_id ownership.
 */

/**
 * Get all addresses for a user.
 *
 * @param {string} userId - public.users.id
 * @returns {object[]}
 */
async function getByUserId(userId) {
  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) throw error;

  return data ?? [];
}

/**
 * Get a single address by ID, enforcing ownership.
 *
 * @param {string} id        - address UUID
 * @param {string} userId    - public.users.id (ownership check)
 * @returns {object|null}
 */
async function getByIdAndUser(id, userId) {
  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Create a new address for a user.
 *
 * @param {string} userId  - public.users.id
 * @param {object} addressData
 * @returns {object} Created address row
 */
async function create(userId, addressData) {
  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .insert([{ user_id: userId, ...addressData }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update an address, enforcing ownership.
 *
 * @param {string} id        - address UUID
 * @param {string} userId    - public.users.id
 * @param {object} updates
 * @returns {object|null}
 */
async function update(id, userId, updates) {
  const allowed = {};
  const fields = [
    'full_name', 'phone', 'address_line_1', 'address_line_2',
    'city', 'state', 'country', 'postal_code', 'landmark', 'is_default',
  ];

  for (const field of fields) {
    if (updates[field] !== undefined) allowed[field] = updates[field];
  }

  if (Object.keys(allowed).length === 0) return null;

  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .update(allowed)
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Delete an address, enforcing ownership.
 *
 * @param {string} id     - address UUID
 * @param {string} userId - public.users.id
 * @returns {boolean} true if deleted
 */
async function remove(id, userId) {
  const { error, count } = await supabaseAdmin
    .from('user_addresses')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  if (error) throw error;

  return true;
}

/**
 * Set one address as default, unsetting all others for that user.
 *
 * @param {string} id     - address UUID to set as default
 * @param {string} userId - public.users.id
 * @returns {object|null} Updated address row
 */
async function setDefault(id, userId) {
  // First, unset all defaults for this user
  const { error: unsetErr } = await supabaseAdmin
    .from('user_addresses')
    .update({ is_default: false })
    .eq('user_id', userId)
    .eq('is_default', true);

  if (unsetErr) throw unsetErr;

  // Then set the target address as default
  const { data, error } = await supabaseAdmin
    .from('user_addresses')
    .update({ is_default: true })
    .eq('id', id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

module.exports = { getByUserId, getByIdAndUser, create, update, remove, setDefault };
