'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Inventory Service
 * Handles all stock operations via the public.inventory table.
 * Stock mutations use PostgreSQL RPC functions for atomicity.
 * Every mutation creates a transaction log record.
 */

/**
 * Get inventory for a single product.
 *
 * @param {string} productId
 * @returns {object|null}
 */
async function getByProductId(productId) {
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('*')
    .eq('product_id', productId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Get inventory for multiple products (for cart/order validation).
 *
 * @param {string[]} productIds
 * @returns {object[]}
 */
async function getByProductIds(productIds) {
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('*')
    .in('product_id', productIds);

  if (error) throw error;

  return data ?? [];
}

/**
 * Get all inventory records (admin view).
 *
 * @returns {object[]}
 */
async function getAll() {
  const { data, error } = await supabaseAdmin
    .from('inventory')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;

  // Fetch product details separately for each inventory record
  const result = await Promise.all(
    (data || []).map(async (inv) => {
      const { data: product } = await supabaseAdmin
        .from('products')
        .select('id, slug, name, sku')
        .eq('id', inv.product_id)
        .single();
      return { ...inv, product: product || null };
    })
  );

  return result;
}

/**
 * Reserve stock for an order (atomic via RPC).
 * Decrements available_stock, increments reserved_stock.
 *
 * @param {string} productId
 * @param {number} quantity
 * @param {string} [referenceType] - 'order'
 * @param {string} [referenceId]   - order UUID
 */
async function reserveStock(productId, quantity, referenceType = null, referenceId = null) {
  const { error } = await supabaseAdmin.rpc('reserve_stock', {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) throw error;

  // Log the transaction
  await supabaseAdmin.from('inventory_transactions').insert([{
    product_id: productId,
    type: 'reserved',
    quantity,
    reference_type: referenceType,
    reference_id: referenceId,
    notes: `Reserved ${quantity} units`,
  }]);
}

/**
 * Confirm sale after payment (atomic via RPC).
 * Decrements reserved_stock, increments sold_stock.
 *
 * @param {string} productId
 * @param {number} quantity
 * @param {string} [referenceType] - 'order'
 * @param {string} [referenceId]   - order UUID
 */
async function confirmSale(productId, quantity, referenceType = null, referenceId = null) {
  const { error } = await supabaseAdmin.rpc('confirm_sale', {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) throw error;

  await supabaseAdmin.from('inventory_transactions').insert([{
    product_id: productId,
    type: 'sold',
    quantity,
    reference_type: referenceType,
    reference_id: referenceId,
    notes: `Sale confirmed: ${quantity} units`,
  }]);
}

/**
 * Unreserve stock (e.g. order cancelled before payment).
 * Decrements reserved_stock, increments available_stock.
 *
 * @param {string} productId
 * @param {number} quantity
 * @param {string} [referenceType] - 'cancellation'
 * @param {string} [referenceId]   - order UUID
 */
async function unreserveStock(productId, quantity, referenceType = null, referenceId = null) {
  const { error } = await supabaseAdmin.rpc('unreserve_stock', {
    p_product_id: productId,
    p_quantity: quantity,
  });

  if (error) throw error;

  await supabaseAdmin.from('inventory_transactions').insert([{
    product_id: productId,
    type: 'unreserved',
    quantity,
    reference_type: referenceType,
    reference_id: referenceId,
    notes: `Unreserved ${quantity} units`,
  }]);
}

/**
 * Add stock (admin manual adjustment).
 *
 * @param {string} productId
 * @param {number} quantity
 * @param {string} [notes]
 */
async function addStock(productId, quantity, notes = null) {
  const { data, error: fetchErr } = await supabaseAdmin
    .from('inventory')
    .select('available_stock')
    .eq('product_id', productId)
    .single();

  if (fetchErr) throw fetchErr;

  const { error: updateErr } = await supabaseAdmin
    .from('inventory')
    .update({ available_stock: data.available_stock + quantity })
    .eq('product_id', productId);

  if (updateErr) throw updateErr;

  await supabaseAdmin.from('inventory_transactions').insert([{
    product_id: productId,
    type: 'stock_added',
    quantity,
    reference_type: 'manual',
    notes: notes || `Manual stock addition: ${quantity} units`,
  }]);
}

/**
 * Remove stock (admin manual adjustment).
 *
 * @param {string} productId
 * @param {number} quantity
 * @param {string} [notes]
 */
async function removeStock(productId, quantity, notes = null) {
  const { data, error: fetchErr } = await supabaseAdmin
    .from('inventory')
    .select('available_stock')
    .eq('product_id', productId)
    .single();

  if (fetchErr) throw fetchErr;

  if (data.available_stock < quantity) {
    throw new Error(`Insufficient stock. Available: ${data.available_stock}, Requested: ${quantity}`);
  }

  const { error: updateErr } = await supabaseAdmin
    .from('inventory')
    .update({ available_stock: data.available_stock - quantity })
    .eq('product_id', productId);

  if (updateErr) throw updateErr;

  await supabaseAdmin.from('inventory_transactions').insert([{
    product_id: productId,
    type: 'stock_removed',
    quantity,
    reference_type: 'manual',
    notes: notes || `Manual stock removal: ${quantity} units`,
  }]);
}

/**
 * Get transaction history for a product.
 *
 * @param {string} productId
 * @param {number} [limit=50]
 * @returns {object[]}
 */
async function getTransactions(productId, limit = 50) {
  const { data, error } = await supabaseAdmin
    .from('inventory_transactions')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  return data ?? [];
}

module.exports = {
  getByProductId,
  getByProductIds,
  getAll,
  reserveStock,
  confirmSale,
  unreserveStock,
  addStock,
  removeStock,
  getTransactions,
};
