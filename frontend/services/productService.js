import axiosInstance from '../lib/axios';

/**
 * Product API Service
 *
 * All product-related API calls go through this module.
 * Pages and components must NEVER import product data directly.
 *
 * All functions communicate with GET /api/products on the Express backend,
 * which fetches data from Supabase PostgreSQL.
 */

/**
 * Fetch a paginated, filtered list of products.
 *
 * @param {object} [params]
 * @param {number}  [params.page=1]
 * @param {number}  [params.limit=20]
 * @param {string}  [params.category]    - 'laptop' | 'desktop' | 'printer'
 * @param {string}  [params.condition]   - 'excellent' | 'good' | 'fair'
 * @param {string}  [params.search]      - search query
 * @param {boolean} [params.featured]    - only featured products
 * @param {string}  [params.sort]        - 'price-asc' | 'price-desc' | 'newest' | 'relevance'
 * @returns {Promise<{ data: object[], pagination: object }>}
 */
export async function getProducts(params = {}) {
  const response = await axiosInstance.get('/api/products', { params });
  return response.data; // { success, data, pagination }
}

/**
 * Fetch a single product by its URL slug.
 *
 * @param {string} slug - e.g. 'dell-latitude-7490'
 * @returns {Promise<object>} Product object
 * @throws {Error} 404 if product not found
 */
export async function getProductBySlug(slug) {
  const response = await axiosInstance.get(`/api/products/${slug}`);
  return response.data; // { success, data }
}

/**
 * Fetch a product by its UUID (admin use).
 *
 * @param {string} id - UUID
 * @returns {Promise<object>} Product object
 */
export async function getProductById(id) {
  const response = await axiosInstance.get(`/api/products/id/${id}`);
  return response.data; // { success, data }
}

/**
 * Fetch the featured products for the homepage.
 * Returns up to 3 featured, active products.
 *
 * @returns {Promise<object[]>} Array of product objects
 */
export async function getFeaturedProducts() {
  const response = await axiosInstance.get('/api/products', {
    params: { featured: true, limit: 3 },
  });
  return response.data?.data ?? [];
}

/**
 * Fetch all products in a given category.
 *
 * @param {string} category - 'laptop' | 'desktop' | 'printer'
 * @returns {Promise<object[]>} Array of product objects
 */
export async function getProductsByCategory(category) {
  const response = await axiosInstance.get('/api/products', {
    params: { category, limit: 50 },
  });
  return response.data?.data ?? [];
}

/**
 * Search products by a text query.
 *
 * @param {string} query - Search string
 * @returns {Promise<object[]>} Array of matching product objects
 */
export async function searchProducts(query) {
  const response = await axiosInstance.get('/api/products', {
    params: { search: query, limit: 20 },
  });
  return response.data?.data ?? [];
}

/**
 * Fetch related products for a given product slug.
 * Returns products in the same category, excluding the current one.
 *
 * @param {string} slug - Slug of the current product
 * @param {number} [limit=3]
 * @returns {Promise<object[]>} Array of related product objects
 */
export async function getRelatedProducts(slug, limit = 3) {
  const response = await axiosInstance.get(`/api/products/${slug}/related`, {
    params: { limit },
  });
  return response.data?.data ?? [];
}
