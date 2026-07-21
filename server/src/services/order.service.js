'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Order Service
 * Handles order creation, retrieval, and lifecycle management.
 * Order creation uses a PostgreSQL RPC for atomicity.
 */

/**
 * Generate a unique order number in format SO-YYYYMMDD-XXXXX.
 *
 * @returns {string}
 */
async function generateOrderNumber() {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');

  // Count existing orders today to generate sequential number
  const { count, error } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString());

  if (error) throw error;

  const seq = (count || 0) + 1;
  const seqPart = String(seq).padStart(5, '0');

  return `SO-${datePart}-${seqPart}`;
}

/**
 * Create a new order from cart items.
 * This validates the address, calculates totals, creates the order via RPC,
 * and clears the cart. Does NOT reserve inventory (that happens after payment).
 *
 * @param {string} userId    - public.users.id
 * @param {string} addressId - user_addresses UUID
 * @param {object[]} cartItems - array from cartService.getCartItems()
 * @param {object} [options]
 * @param {number} [options.shippingCharge=0]
 * @param {number} [options.taxRate=0] - percentage, e.g. 18 for 18%
 * @returns {object} Created order
 */
async function createOrder(userId, addressId, cartItems, options = {}) {
  const { shippingCharge = 0, taxRate = 0 } = options;

  if (!cartItems || cartItems.length === 0) {
    throw Object.assign(new Error('Cart is empty.'), { status: 400 });
  }

  // Verify address belongs to user
  const { data: address, error: addrErr } = await supabaseAdmin
    .from('user_addresses')
    .select('id')
    .eq('id', addressId)
    .eq('user_id', userId)
    .single();

  if (addrErr || !address) {
    throw Object.assign(new Error('Address not found.'), { status: 404 });
  }

  // Calculate totals
  let subtotal = 0;
  const items = cartItems.map((ci) => {
    const product = ci.product;
    const price = ci.price_at_time;
    const quantity = ci.quantity;
    const itemTotal = price * quantity;
    const itemTax = parseFloat((itemTotal * taxRate / 100).toFixed(2));
    const total = parseFloat((itemTotal + itemTax).toFixed(2));

    subtotal += itemTotal;

    return {
      product_id: ci.product_id,
      product_name: product.name,
      sku: product.sku,
      price,
      quantity,
      tax: itemTax,
      discount: 0,
      total,
    };
  });

  subtotal = parseFloat(subtotal.toFixed(2));
  const totalTax = items.reduce((sum, item) => sum + item.tax, 0);
  const grandTotal = parseFloat((subtotal + totalTax + shippingCharge).toFixed(2));

  const orderNumber = await generateOrderNumber();

  // Insert order directly
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .insert([{
      user_id: userId,
      address_id: addressId,
      order_number: orderNumber,
      subtotal,
      discount: 0,
      shipping_charge: shippingCharge,
      tax: totalTax,
      grand_total: grandTotal,
      order_status: 'pending',
      payment_status: 'pending',
      shipment_status: 'unshipped',
    }])
    .select()
    .single();

  if (orderErr) throw orderErr;

  // Insert order items
  const orderItems = items.map((item) => ({
    order_id: order.id,
    ...item,
  }));

  const { error: itemsErr } = await supabaseAdmin
    .from('order_items')
    .insert(orderItems);

  if (itemsErr) throw itemsErr;

  // Fetch the complete order with items
  return getOrderById(order.id, userId);
}

/**
 * Get a single order by ID with items, enforcing user ownership.
 *
 * @param {string} orderId
 * @param {string} userId - public.users.id (null for admin)
 * @returns {object|null}
 */
async function getOrderById(orderId, userId = null) {
  // Fetch order directly (no joins to avoid missing FK relationships)
  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', orderId);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  const { data: order, error } = await query.single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  // Fetch order items separately
  const { data: items } = await supabaseAdmin
    .from('order_items')
    .select('*')
    .eq('order_id', order.id)
    .order('created_at', { ascending: true });

  // Fetch address separately
  let address = null;
  if (order.address_id) {
    const { data: addr } = await supabaseAdmin
      .from('user_addresses')
      .select('id, full_name, phone, address_line_1, address_line_2, city, state, country, postal_code, landmark')
      .eq('id', order.address_id)
      .single();
    address = addr || null;
  }

  return { ...order, items: items || [], address };
}

/**
 * Get all orders for a user (paginated).
 *
 * @param {string} userId
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @returns {{ orders: object[], total: number }}
 */
async function getUserOrders(userId, options = {}) {
  const { page = 1, limit = 20 } = options;
  const offset = (page - 1) * limit;

  const { data: orders, error, count } = await supabaseAdmin
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Fetch items for each order separately
  const ordersWithItems = await Promise.all(
    (orders || []).map(async (order) => {
      const { data: items } = await supabaseAdmin
        .from('order_items')
        .select('id, product_name, sku, price, quantity, total')
        .eq('order_id', order.id);
      return { ...order, items: items || [] };
    })
  );

  return { orders: ordersWithItems, total: count ?? 0 };
}

/**
 * Update order status (admin or internal use).
 *
 * @param {string} orderId
 * @param {object} updates - { order_status, payment_status, shipment_status }
 * @returns {object|null}
 */
async function updateOrder(orderId, updates) {
  const allowed = {};
  if (updates.order_status !== undefined) allowed.order_status = updates.order_status;
  if (updates.payment_status !== undefined) allowed.payment_status = updates.payment_status;
  if (updates.shipment_status !== undefined) allowed.shipment_status = updates.shipment_status;
  if (updates.notes !== undefined) allowed.notes = updates.notes;

  if (Object.keys(allowed).length === 0) return null;

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update(allowed)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

module.exports = { createOrder, getOrderById, getUserOrders, updateOrder, generateOrderNumber };
