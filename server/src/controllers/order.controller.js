'use strict';

const orderService = require('../services/order.service');
const cartService = require('../services/cart.service');
const inventoryService = require('../services/inventory.service');
const { parsePagination, buildPaginationMeta } = require('../utils/pagination');

/**
 * Order Controller
 * Handles HTTP request/response for order operations.
 */

/**
 * POST /api/orders
 * Creates a new order from the user's cart.
 * Validates stock availability but does NOT reserve inventory yet.
 * Inventory is reserved only after Razorpay order creation.
 *
 * Body: { addressId, shippingCharge?, taxRate? }
 */
async function create(req, res, next) {
  try {
    const { addressId, shippingCharge = 0, taxRate = 0 } = req.body;

    if (!addressId) {
      return res.status(400).json({
        success: false,
        message: 'addressId is required.',
      });
    }

    // Get cart items
    const cart = await cartService.getOrCreateCart(req.user.id);
    const cartItems = await cartService.getCartItems(cart.id);

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty.',
      });
    }

    // Validate stock availability for all items
    const productIds = cartItems.map((item) => item.product_id);
    const inventoryRecords = await inventoryService.getByProductIds(productIds);

    for (const item of cartItems) {
      const inv = inventoryRecords.find((r) => r.product_id === item.product_id);
      if (!inv || inv.available_stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product?.name || item.product_id}". Available: ${inv?.available_stock || 0}, Requested: ${item.quantity}.`,
        });
      }
    }

    // Create the order
    const order = await orderService.createOrder(req.user.id, addressId, cartItems, {
      shippingCharge: parseFloat(shippingCharge) || 0,
      taxRate: parseFloat(taxRate) || 0,
    });

    // Clear the cart after successful order creation
    await cartService.clearCart(req.user.id);

    res.status(201).json({
      success: true,
      message: 'Order created successfully. Please complete payment.',
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders
 * Returns all orders for the authenticated user (paginated).
 */
async function list(req, res, next) {
  try {
    const { page, limit } = parsePagination(req.query);
    const { orders, total } = await orderService.getUserOrders(req.user.id, { page, limit });

    res.status(200).json({
      success: true,
      data: orders,
      pagination: buildPaginationMeta(page, limit, total),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/orders/:id
 * Returns a single order with items (ownership enforced).
 */
async function getById(req, res, next) {
  try {
    const { id } = req.params;
    const order = await orderService.getOrderById(id, req.user.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found.',
      });
    }

    res.status(200).json({
      success: true,
      data: order,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { create, list, getById };
