'use strict';

const paymentService = require('../services/payment.service');

/**
 * Payment Controller
 * Handles Razorpay order creation, payment verification, and webhooks.
 */

/**
 * POST /api/payments/create-order
 * Creates a Razorpay order for a given order.
 * Body: { orderId }
 */
async function createOrder(req, res, next) {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'orderId is required.',
      });
    }

    // Verify the order belongs to the user
    const { supabaseAdmin } = require('../config/supabase');
    const { data: order, error } = await supabaseAdmin
      .from('orders')
      .select('id, grand_total, user_id')
      .eq('id', orderId)
      .eq('user_id', req.user.id)
      .single();

    if (error || !order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    const { razorpayOrder, payment } = await paymentService.createRazorpayOrder(
      orderId,
      order.grand_total
    );

    res.status(201).json({
      success: true,
      message: 'Razorpay order created.',
      data: {
        razorpay_order_id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        payment_id: payment.id,
        key: process.env.RAZORPAY_KEY_ID,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/verify
 * Verifies Razorpay payment signature and confirms the order.
 * Body: { razorpay_order_id, razorpay_payment_id, razorpay_signature }
 */
async function verify(req, res, next) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: 'razorpay_order_id, razorpay_payment_id, and razorpay_signature are required.',
      });
    }

    const order = await paymentService.verifyPayment(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully. Order confirmed.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/payments/webhook
 * Razorpay webhook receiver.
 * Uses raw body for signature verification.
 */
async function webhook(req, res, next) {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body; // Already a string due to raw body parser

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature.',
      });
    }

    const result = await paymentService.handleWebhook(
      typeof body === 'string' ? body : JSON.stringify(body),
      signature
    );

    res.status(200).json({
      success: true,
      event: result.event,
      handled: result.handled,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/history
 * Returns paginated payment history.
 * - Regular users see only their own payments.
 * - Admins see all payments (when ?admin=true query param is used — role enforced server side).
 */
async function getHistory(req, res, next) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));

    // Admins can see all; regular users see only their own
    const userId = req.user.role === 'admin' ? null : req.user.id;

    const { payments, total } = await paymentService.getAll({
      page: parsedPage,
      limit: parsedLimit,
      status: status || undefined,
      userId,
    });

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        page: parsedPage,
        limit: parsedLimit,
        total,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/payments/:id
 * Returns a single payment record (user must own the order, or be admin).
 */
async function getPaymentById(req, res, next) {
  try {
    const { id } = req.params;

    const { data: payment, error } = await (require('../config/supabase')).supabaseAdmin
      .from('payments')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !payment) {
      return res.status(404).json({ success: false, message: 'Payment not found.' });
    }

    // Fetch the linked order separately to avoid broken FK joins
    let order = null;
    if (payment.order_id) {
      const { data: orderData } = await (require('../config/supabase')).supabaseAdmin
        .from('orders')
        .select('id, order_number, user_id, grand_total, order_status')
        .eq('id', payment.order_id)
        .single();
      order = orderData || null;
    }
    payment.order = order;

    // Users can only see their own payments
    if (req.user.role !== 'admin' && payment.order?.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, verify, webhook, getHistory, getPaymentById };
