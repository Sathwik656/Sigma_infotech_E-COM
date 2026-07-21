'use strict';

const cartService = require('../services/cart.service');

/**
 * Cart Controller
 * Handles HTTP request/response for shopping cart operations.
 */

/**
 * GET /api/cart
 * Returns the user's active cart with items.
 */
async function getCart(req, res, next) {
  try {
    const { cart, items } = await cartService.getCart(req.user.id);

    res.status(200).json({
      success: true,
      data: { cart, items },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/cart/items
 * Adds an item to the cart.
 * Body: { productId, quantity }
 */
async function addItem(req, res, next) {
  try {
    const { productId, quantity = 1 } = req.body;
    const item = await cartService.addItem(req.user.id, productId, quantity);

    res.status(201).json({
      success: true,
      message: 'Item added to cart.',
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/cart/items/:itemId
 * Updates the quantity of a cart item.
 * Body: { quantity }
 */
async function updateItemQuantity(req, res, next) {
  try {
    const { itemId } = req.params;
    const { quantity } = req.body;

    const item = await cartService.updateItemQuantity(req.user.id, itemId, quantity);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Cart item not found.',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Cart item updated.',
      data: item,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart/items/:itemId
 * Removes an item from the cart.
 */
async function removeItem(req, res, next) {
  try {
    const { itemId } = req.params;
    await cartService.removeItem(req.user.id, itemId);

    res.status(200).json({
      success: true,
      message: 'Item removed from cart.',
    });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/cart
 * Clears all items from the cart.
 */
async function clearCart(req, res, next) {
  try {
    await cartService.clearCart(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Cart cleared.',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { getCart, addItem, updateItemQuantity, removeItem, clearCart };
