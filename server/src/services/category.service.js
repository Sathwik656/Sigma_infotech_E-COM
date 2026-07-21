'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Category Service
 * Handles all database operations for the public.categories table.
 */

/**
 * Get all categories.
 *
 * @returns {object[]}
 */
async function getAll() {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .select('*')
    .order('name', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

/**
 * Get a category by UUID.
 *
 * @param {string} id
 * @returns {object|null}
 */
async function getById(id) {
  const { data, error } = await supabaseAdmin
    .from('categories')
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
 * Get a category by slug.
 *
 * @param {string} slug
 * @returns {object|null}
 */
async function getBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from('categories')
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
 * Create a new category.
 *
 * @param {object} categoryData - { slug, name, description, icon, href }
 * @returns {object} Created category row
 */
async function create(categoryData) {
  const { data, error } = await supabaseAdmin
    .from('categories')
    .insert([categoryData])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update a category by UUID.
 *
 * @param {string} id
 * @param {object} updates
 * @returns {object|null}
 */
async function update(id, updates) {
  const allowed = {};
  const fields = ['name', 'description', 'icon', 'href', 'slug'];
  for (const field of fields) {
    if (updates[field] !== undefined) allowed[field] = updates[field];
  }

  if (Object.keys(allowed).length === 0) return null;

  const { data, error } = await supabaseAdmin
    .from('categories')
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
 * Delete a category by UUID.
 *
 * @param {string} id
 * @returns {boolean}
 */
async function remove(id) {
  const { error } = await supabaseAdmin
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;

  return true;
}

module.exports = { getAll, getById, getBySlug, create, update, remove };
