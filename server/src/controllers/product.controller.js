'use strict';

const productService = require('../services/product.service');
const categoryService = require('../services/category.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/* -----------------------------------------------------------------------
   Product Controller
   Handles HTTP request/response. Delegates all DB work to productService.
   ----------------------------------------------------------------------- */

/**
 * GET /api/products
 *
 * Query params:
 *   page       {number}  default 1
 *   limit      {number}  default 20
 *   category   {string}  'laptop' | 'desktop' | 'printer'
 *   condition  {string}  'excellent' | 'good' | 'fair'
 *   search     {string}  full-text search
 *   featured   {boolean} 'true' to return only featured
 *   sort       {string}  'price-asc' | 'price-desc' | 'newest' | 'relevance'
 */
async function getAll(req, res, next) {
  try {
    const {
      category,
      condition,
      search,
      featured,
      sort = 'relevance',
    } = req.query;

    const { page, limit, offset } = parsePagination(req.query);

    // Resolve category slug to category_id if provided
    let categoryId = null;
    if (category) {
      const categoryRow = await categoryService.getBySlug(category);
      if (categoryRow) {
        categoryId = categoryRow.id;
      }
    }

    const { products, total } = await productService.getAllProducts({
      page,
      limit,
      category: categoryId,
      condition,
      search,
      featured,
      sort,
    });

    return res.status(200).json({
      success: true,
      data: products,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:slug
 *
 * Returns a single active product by its URL slug.
 * Returns 404 if not found or inactive.
 */
async function getBySlug(req, res, next) {
  try {
    const { slug } = req.params;

    const product = await productService.getProductBySlug(slug);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with slug "${slug}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/id/:id
 *
 * Returns a product by its UUID (admin-accessible; ignores status).
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;

    const product = await productService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id "${id}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/products/:slug/related
 *
 * Returns up to 3 related products in the same category, excluding this slug.
 */
async function getRelated(req, res, next) {
  try {
    const { slug } = req.params;
    const { limit = 3 } = req.query;

    // First fetch the product to get its category
    const product = await productService.getProductBySlug(slug);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with slug "${slug}" not found.`,
      });
    }

    const related = await productService.getRelatedProducts(
      product.category_id,
      slug,
      Math.min(10, parseInt(limit, 10) || 3)
    );

    return res.status(200).json({
      success: true,
      data: related,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Whitelist of columns that actually exist in the products table.
 * Prevents Supabase errors when frontend sends non-existent fields
 * (e.g. price_formatted, brand name strings, etc.)
 */
const PRODUCT_COLUMNS = [
  'name', 'slug', 'description', 'specs_short',
  'price', 'price_old', 'sku', 'stock',
  'brand_id', 'category_id', 'condition',
  'grade', 'grade_class', 'icon_type',
  'status', 'featured', 'tags', 'specifications',
  'thumbnail_url', 'images',
];

/**
 * POST /api/products
 * Admin only — create a new product.
 *
 * Body: { slug, name, description, specs_short, sku, price,
 *         price_old, category_id, brand_id,
 *         condition, grade, grade_class, icon_type, stock, featured,
 *         specifications, tags, status }
 */
async function create(req, res, next) {
  try {
    const safePayload = {};
    for (const key of PRODUCT_COLUMNS) {
      if (req.body[key] !== undefined) safePayload[key] = req.body[key];
    }

    const product = await productService.createProduct(safePayload);

    return res.status(201).json({
      success: true,
      message: 'Product created successfully.',
      data: product,
    });
  } catch (err) {
    // Handle unique constraint violations (duplicate slug/sku)
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A product with this slug or SKU already exists.',
      });
    }
    next(err);
  }
}

/**
 * PUT /api/products/:id
 * Admin only — update an existing product by UUID.
 */
async function update(req, res, next) {
  try {
    const { id } = req.params;

    const safePayload = {};
    for (const key of PRODUCT_COLUMNS) {
      if (req.body[key] !== undefined) safePayload[key] = req.body[key];
    }

    const product = await productService.updateProduct(id, safePayload);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id "${id}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product updated successfully.',
      data: product,
    });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'A product with this slug or SKU already exists.',
      });
    }
    next(err);
  }
}

/**
 * DELETE /api/products/:id
 * Admin only — soft-delete a product (sets status = 'inactive').
 */
async function remove(req, res, next) {
  try {
    const { id } = req.params;

    const product = await productService.softDeleteProduct(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with id "${id}" not found.`,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Product deactivated successfully.',
      data: product,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getAll, getBySlug, getById, getRelated, create, update, remove };
