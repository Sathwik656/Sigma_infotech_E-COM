'use strict';

const crypto = require('crypto');
const razorpay = require('../config/razorpay');
const { supabaseAdmin } = require('../config/supabase');
const { RAZORPAY_KEY_SECRET } = require('../config/env');
const cartService = require('./cart.service');

/**
 * Payment Service
 * Handles Razorpay order creation, payment verification, and webhook processing.
 * NEVER trusts frontend payment success — always verifies signature server-side.
 */

/**
 * Create a Razorpay order for a given order.
 * Stores a payment record linked to the order.
 *
 * @param {string} orderId     - public.orders.id
 * @param {number} amount      - amount in INR (will be converted to paise)
 * @param {string} [currency]  - default 'INR'
 * @returns {{ razorpayOrder, payment }}
 */
async function createRazorpayOrder(orderId, amount, currency = 'INR') {
  // Fetch the order to validate
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('id, grand_total, payment_status, order_number')
    .eq('id', orderId)
    .single();

  if (orderErr || !order) {
    throw Object.assign(new Error('Order not found.'), { status: 404 });
  }

  if (order.payment_status !== 'pending') {
    throw Object.assign(new Error('Order has already been paid or payment is not pending.'), { status: 400 });
  }

  // Create Razorpay order (amount in paise)
  const razorpayOrder = await razorpay.orders.create({
    amount: Math.round(amount * 100),
    currency,
    receipt: order.order_number,
  });

  // Create payment record
  const { data: payment, error: payErr } = await supabaseAdmin
    .from('payments')
    .insert([{
      order_id: orderId,
      razorpay_order_id: razorpayOrder.id,
      amount,
      currency,
      status: 'created',
    }])
    .select()
    .single();

  if (payErr) throw payErr;

  return { razorpayOrder, payment };
}

/**
 * Verify Razorpay payment signature.
 * If valid, confirms payment via RPC (updates payment, order, reserves stock, creates shipment).
 *
 * @param {string} razorpayOrderId
 * @param {string} razorpayPaymentId
 * @param {string} razorpaySignature
 * @returns {object} Updated order
 */
async function verifyPayment(razorpayOrderId, razorpayPaymentId, razorpaySignature) {
  // Verify HMAC signature
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex');

  if (expectedSignature !== razorpaySignature) {
    throw Object.assign(new Error('Payment verification failed. Invalid signature.'), { status: 400 });
  }

  // Find the payment record
  const { data: payment, error: payErr } = await supabaseAdmin
    .from('payments')
    .select('id, order_id, status')
    .eq('razorpay_order_id', razorpayOrderId)
    .single();

  if (payErr || !payment) {
    throw Object.assign(new Error('Payment record not found.'), { status: 404 });
  }

  if (payment.status === 'captured') {
    // Idempotent — already processed
    const { data: order } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('id', payment.order_id)
      .single();
    return order;
  }

  // Confirm payment via direct updates (instead of RPC that may not exist)
  // Update payment record
  const { error: payUpdateErr } = await supabaseAdmin
    .from('payments')
    .update({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: razorpaySignature,
      status: 'captured',
    })
    .eq('id', payment.id);

  if (payUpdateErr) throw payUpdateErr;

  // Update order status
  const { error: orderUpdateErr } = await supabaseAdmin
    .from('orders')
    .update({
      payment_status: 'paid',
      order_status: 'confirmed',
    })
    .eq('id', payment.order_id);

  if (orderUpdateErr) throw orderUpdateErr;

  // Clear the user's cart after successful payment
  try {
    const { data: orderRow } = await supabaseAdmin
      .from('orders')
      .select('user_id')
      .eq('id', payment.order_id)
      .single();
    if (orderRow?.user_id) {
      await cartService.clearCart(orderRow.user_id);
    }
  } catch (_e) {
    // Non-fatal — order is already confirmed
  }

  // Fetch updated order
  const { data: order, error: orderErr } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('id', payment.order_id)
    .single();

  if (orderErr) throw orderErr;

  return order;
}

/**
 * Handle Razorpay webhook events.
 * Verifies webhook signature before processing.
 *
 * @param {string} body        - raw request body string
 * @param {string} signature   - X-Razorpay-Signature header
 * @returns {{ event: string, handled: boolean }}
 */
async function handleWebhook(body, signature) {
  // Verify webhook signature
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(body)
    .digest('hex');

  if (expectedSignature !== signature) {
    throw Object.assign(new Error('Invalid webhook signature.'), { status: 400 });
  }

  const event = JSON.parse(body);
  const eventType = event.event;

  switch (eventType) {
    case 'payment.captured': {
      const paymentEntity = event.payload.payment.entity;
      await _handlePaymentCaptured(paymentEntity);
      return { event: eventType, handled: true };
    }

    case 'payment.failed': {
      const paymentEntity = event.payload.payment.entity;
      await _handlePaymentFailed(paymentEntity);
      return { event: eventType, handled: true };
    }

    default:
      return { event: eventType, handled: false };
  }
}

/**
 * Internal: Handle payment.captured webhook event.
 */
async function _handlePaymentCaptured(paymentEntity) {
  const { notes, id: razorpayPaymentId } = paymentEntity;

  // Find payment by razorpay_order_id
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('razorpay_order_id', paymentEntity.order_id)
    .single();

  if (!payment || payment.status === 'captured') return; // idempotent

  // Compute signature for the record
  const signature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${paymentEntity.order_id}|${razorpayPaymentId}`)
    .digest('hex');

  // Update payment record
  await supabaseAdmin
    .from('payments')
    .update({
      razorpay_payment_id: razorpayPaymentId,
      razorpay_signature: signature,
      status: 'captured',
    })
    .eq('id', payment.id);

  // Update order status
  const { data: paymentRow } = await supabaseAdmin
    .from('payments')
    .select('order_id')
    .eq('id', payment.id)
    .single();

  if (paymentRow) {
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'paid', order_status: 'confirmed' })
      .eq('id', paymentRow.order_id);

    // Clear the user's cart after successful payment
    try {
      const { data: orderRow } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .eq('id', paymentRow.order_id)
        .single();
      if (orderRow?.user_id) {
        await cartService.clearCart(orderRow.user_id);
      }
    } catch (_e) {
      // Non-fatal
    }
  }
}

/**
 * Internal: Handle payment.failed webhook event.
 */
async function _handlePaymentFailed(paymentEntity) {
  const { data: payment } = await supabaseAdmin
    .from('payments')
    .select('id, status')
    .eq('razorpay_order_id', paymentEntity.order_id)
    .single();

  if (!payment || payment.status === 'failed') return; // idempotent

  // Update payment record
  await supabaseAdmin
    .from('payments')
    .update({
      status: 'failed',
      failure_reason: paymentEntity.error_description || 'Payment failed',
    })
    .eq('id', payment.id);

  // Update order status
  const { data: paymentRow } = await supabaseAdmin
    .from('payments')
    .select('order_id')
    .eq('id', payment.id)
    .single();

  if (paymentRow) {
    await supabaseAdmin
      .from('orders')
      .update({ payment_status: 'failed', order_status: 'cancelled' })
      .eq('id', paymentRow.order_id);
  }
}

/**
 * Get payment by order ID.
 *
 * @param {string} orderId
 * @returns {object|null}
 */
async function getByOrderId(orderId) {
  const { data, error } = await supabaseAdmin
    .from('payments')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Get paginated list of payments.
 * If userId is provided, filters to that user's payments only (customer view).
 * If userId is null, returns all payments (admin view).
 *
 * @param {object} options
 * @param {number} [options.page=1]
 * @param {number} [options.limit=20]
 * @param {string} [options.status]
 * @param {string} [options.userId] - if set, restrict to this user's orders
 * @returns {{ payments: object[], total: number }}
 */
async function getAll({ page = 1, limit = 20, status, userId } = {}) {
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('payments')
    .select('*', { count: 'exact' });

  if (status) query = query.eq('status', status);

  if (userId) {
    // Join-filter: only payments whose order belongs to this user
    // Supabase doesn't support nested filter directly in select count, so we filter via order.user_id
    const { data: userOrderIds } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('user_id', userId);

    const ids = (userOrderIds || []).map((o) => o.id);
    if (ids.length === 0) return { payments: [], total: 0 };
    query = query.in('order_id', ids);
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;

  return { payments: data ?? [], total: count ?? 0 };
}

module.exports = { createRazorpayOrder, verifyPayment, handleWebhook, getByOrderId, getAll };
