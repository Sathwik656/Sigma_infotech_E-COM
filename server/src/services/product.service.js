'use strict';

const { supabaseAdmin } = require('../config/supabase');

/* -----------------------------------------------------------------------
   Product Service
   All database queries for the products table live here.
   Controllers must NEVER touch Supabase directly.
   ----------------------------------------------------------------------- */

/**
 * Fetch a paginated, filtered list of active products.
 *
 * @param {object} filters
 * @param {number}  [filters.page=1]
 * @param {number}  [filters.limit=20]
 * @param {string}  [filters.category]      - 'laptop' | 'desktop' | 'printer'
 * @param {string}  [filters.condition]     - 'excellent' | 'good' | 'fair'
 * @param {string}  [filters.search]        - full-text search string
 * @param {boolean} [filters.featured]      - if true, only featured products
 * @param {string}  [filters.sort]          - 'price-asc' | 'price-desc' | 'newest' | 'relevance'
 * @returns {{ products: object[], total: number }}
 */
async function getAllProducts(filters = {}) {
  const {
    page = 1,
    limit = 20,
    category,
    condition,
    search,
    featured,
    sort = 'relevance',
  } = filters;

  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('products')
    .select('*', { count: 'exact' })
    .eq('status', 'active');

  // Apply filters
  if (category) query = query.eq('category', category);
  if (condition) query = query.eq('condition', condition);
  if (featured === true || featured === 'true') query = query.eq('featured', true);
  if (search) {
    // ilike on name or brand for simple search; upgrade to FTS later if needed
    query = query.or(`name.ilike.%${search}%,brand.ilike.%${search}%,specs_short.ilike.%${search}%`);
  }

  // Apply sort
  switch (sort) {
    case 'price-asc':
      query = query.order('price', { ascending: true });
      break;
    case 'price-desc':
      query = query.order('price', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    default:
      // relevance: featured first, then by name
      query = query.order('featured', { ascending: false }).order('name', { ascending: true });
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) throw error;

  return { products: data ?? [], total: count ?? 0 };
}

/**
 * Fetch a single active product by its slug.
 *
 * @param {string} slug
 * @returns {object|null}
 */
async function getProductBySlug(slug) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (error) {
    // PGRST116 = no rows returned (not a server error)
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Fetch a single product by its UUID (admin use — ignores status).
 *
 * @param {string} id - UUID
 * @returns {object|null}
 */
async function getProductById(id) {
  const { data, error } = await supabaseAdmin
    .from('products')
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
 * Fetch related products in the same category, excluding the given slug.
 *
 * @param {string} category
 * @param {string} excludeSlug
 * @param {number} [limit=3]
 * @returns {object[]}
 */
async function getRelatedProducts(category, excludeSlug, limit = 3) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .select('id, slug, name, brand, specs_short, price_formatted, grade, grade_class, icon_type, category, condition')
    .eq('status', 'active')
    .eq('category', category)
    .neq('slug', excludeSlug)
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

/**
 * Create a new product (admin only).
 *
 * @param {object} productData
 * @returns {object} Created product row
 */
async function createProduct(productData) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .insert([productData])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update an existing product by UUID (admin only).
 *
 * @param {string} id    - UUID
 * @param {object} updates
 * @returns {object} Updated product row
 */
async function updateProduct(id, updates) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update(updates)
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
 * Soft-delete a product by setting status = 'inactive' (admin only).
 *
 * @param {string} id - UUID
 * @returns {object} Updated product row
 */
async function softDeleteProduct(id) {
  const { data, error } = await supabaseAdmin
    .from('products')
    .update({ status: 'inactive' })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

module.exports = {
  getAllProducts,
  getProductBySlug,
  getProductById,
  getRelatedProducts,
  createProduct,
  updateProduct,
  softDeleteProduct,
};
