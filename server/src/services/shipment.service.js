'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Shipment Service
 * Handles shipment record management.
 * No logistics integration yet — admin can update status manually.
 */

/**
 * Get shipment by order ID.
 *
 * @param {string} orderId
 * @returns {object|null}
 */
async function getByOrderId(orderId) {
  const { data, error } = await supabaseAdmin
    .from('shipments')
    .select('*')
    .eq('order_id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Update shipment details (admin only).
 *
 * @param {string} orderId
 * @param {object} updates - { carrier, tracking_number, awb, shipment_status, shipped_at, delivered_at, label_url }
 * @returns {object|null}
 */
async function update(orderId, updates) {
  const allowed = {};
  const fields = [
    'carrier', 'tracking_number', 'awb', 'shipment_status',
    'shipped_at', 'delivered_at', 'label_url',
  ];

  for (const field of fields) {
    if (updates[field] !== undefined) allowed[field] = updates[field];
  }

  if (Object.keys(allowed).length === 0) return null;

  const { data, error } = await supabaseAdmin
    .from('shipments')
    .update(allowed)
    .eq('order_id', orderId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Get all shipments (admin view).
 *
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.status] - filter by shipment_status
 * @returns {{ shipments: object[], total: number }}
 */
async function getAll(options = {}) {
  const { page = 1, limit = 20, status } = options;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('shipments')
    .select('*', { count: 'exact' });

  if (status) {
    query = query.eq('shipment_status', status);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  // Fetch order details separately for each shipment
  const shipments = await Promise.all(
    (data || []).map(async (s) => {
      const { data: order } = await supabaseAdmin
        .from('orders')
        .select('id, order_number, user_id, grand_total')
        .eq('id', s.order_id)
        .single();
      return { ...s, order: order || null };
    })
  );

  return { shipments, total: count ?? 0 };
}

module.exports = { getByOrderId, update, getAll };
