'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Brand Service
 * Handles all database operations for the public.brands table.
 */

/**
 * Get all brands.
 *
 * @returns {object[]}
 */
async function getAll() {
  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/**
 * Get a brand by UUID.
 *
 * @param {string} id
 * @returns {object|null}
 */
async function getById(id) {
  const { data, error } = await supabaseAdmin
    .from('brands')
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
 * Get a brand by slug.
 *
 * @param {string} slug
 * @returns {object|null}
 */
async function getBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Create a new brand.
 *
 * @param {object} brandData - { slug, name, logo }
 * @returns {object} Created brand row
 */
async function create(brandData) {
  const { data, error } = await supabaseAdmin
    .from('brands')
    .insert([brandData])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update a brand by UUID.
 *
 * @param {string} id
 * @param {object} updates - { name, logo }
 * @returns {object|null}
 */
async function update(id, updates) {
  const allowed = {};
  if (updates.name !== undefined) allowed.name = updates.name;
  if (updates.logo !== undefined) allowed.logo = updates.logo;
  if (updates.slug !== undefined) allowed.slug = updates.slug;

  if (Object.keys(allowed).length === 0) return null;

  const { data, error } = await supabaseAdmin
    .from('brands')
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

/**
 * Delete a brand by UUID.
 *
 * @param {string} id
 * @returns {boolean}
 */
async function remove(id) {
  const { error } = await supabaseAdmin
    .from('brands')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}

module.exports = { getAll, getById, getBySlug, create, update, remove };
