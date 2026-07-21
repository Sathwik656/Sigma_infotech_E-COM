'use strict';

const { supabaseAdmin } = require('../config/supabase');

/**
 * Cart Service
 * Manages shopping cart operations.
 * Each user has at most one active cart.
 * Cart items store price_at_time as a snapshot of the product price.
 */

/**
 * Get or create an active cart for a user.
 *
 * @param {string} userId - public.users.id
 * @returns {object} Active cart row
 */
async function getOrCreateCart(userId) {
  // Try to find existing active cart
  const { data: existing, error: findErr } = await supabaseAdmin
    .from('carts')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (!findErr && existing) return existing;

  // Create new active cart
  const { data: created, error: createErr } = await supabaseAdmin
    .from('carts')
    .insert([{ user_id: userId, status: 'active' }])
    .select()
    .single();

  if (createErr) throw createErr;

  return created;
}

/**
 * Get the active cart with all items and product details.
 *
 * @param {string} userId - public.users.id
 * @returns {{ cart: object, items: object[] }}
 */
async function getCart(userId) {
  const cart = await getOrCreateCart(userId);

  const { data: items, error } = await supabaseAdmin
    .from('cart_items')
    .select(`
      id,
      quantity,
      price_at_time,
      product:products(
        id, slug, name, thumbnail_url, price, status,
        category:categories(id, slug, name),
        images:product_images(url, is_primary)
      )
    `)
    .eq('cart_id', cart.id)
    .order('created_at', { ascending: true });

  if (error) throw error;

  // Filter out items whose product has been deleted or deactivated
  const validItems = (items ?? []).filter(
    (item) => item.product && item.product.status === 'active'
  );

  // Calculate summary
  const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validItems.reduce(
    (sum, item) => sum + item.price_at_time * item.quantity,
    0
  );

  return {
    cart: {
      ...cart,
      item_count: itemCount,
      subtotal: parseFloat(subtotal.toFixed(2)),
    },
    items: validItems,
  };
}

/**
 * Add an item to the cart.
 * If the product already exists in the cart, increment quantity.
 *
 * @param {string} userId    - public.users.id
 * @param {string} productId - product UUID
 * @param {number} quantity
 * @returns {object} Updated cart item
 */
async function addItem(userId, productId, quantity = 1) {
  const cart = await getOrCreateCart(userId);

  // Fetch current product price
  const { data: product, error: prodErr } = await supabaseAdmin
    .from('products')
    .select('price, status')
    .eq('id', productId)
    .single();

  if (prodErr || !product) {
    throw Object.assign(new Error('Product not found.'), { status: 404 });
  }

  if (product.status !== 'active') {
    throw Object.assign(new Error('Product is not available.'), { status: 400 });
  }

  // Check if item already exists in cart
  const { data: existingItem } = await supabaseAdmin
    .from('cart_items')
    .select('id, quantity')
    .eq('cart_id', cart.id)
    .eq('product_id', productId)
    .single();

  if (existingItem) {
    // Update quantity
    const { data, error } = await supabaseAdmin
      .from('cart_items')
      .update({ quantity: existingItem.quantity + quantity })
      .eq('id', existingItem.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Insert new item
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .insert([{
      cart_id: cart.id,
      product_id: productId,
      quantity,
      price_at_time: product.price,
    }])
    .select()
    .single();

  if (error) throw error;

  return data;
}

/**
 * Update the quantity of a cart item.
 *
 * @param {string} userId - public.users.id
 * @param {string} itemId - cart_items UUID
 * @param {number} quantity
 * @returns {object|null} Updated cart item
 */
async function updateItemQuantity(userId, itemId, quantity) {
  const cart = await getOrCreateCart(userId);

  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .update({ quantity })
    .eq('id', itemId)
    .eq('cart_id', cart.id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw error;
  }

  return data;
}

/**
 * Remove an item from the cart.
 *
 * @param {string} userId - public.users.id
 * @param {string} itemId - cart_items UUID
 * @returns {boolean}
 */
async function removeItem(userId, itemId) {
  const cart = await getOrCreateCart(userId);

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('id', itemId)
    .eq('cart_id', cart.id);

  if (error) throw error;

  return true;
}

/**
 * Clear all items from the cart.
 *
 * @param {string} userId - public.users.id
 * @returns {boolean}
 */
async function clearCart(userId) {
  const cart = await getOrCreateCart(userId);

  const { error } = await supabaseAdmin
    .from('cart_items')
    .delete()
    .eq('cart_id', cart.id);

  if (error) throw error;

  return true;
}

/**
 * Get cart items for order creation (raw items without product join).
 *
 * @param {string} cartId
 * @returns {object[]}
 */
async function getCartItems(cartId) {
  const { data, error } = await supabaseAdmin
    .from('cart_items')
    .select(`
      id,
      product_id,
      quantity,
      price_at_time,
      product:products(id, name, sku, price)
    `)
    .eq('cart_id', cartId);

  if (error) throw error;

  return data ?? [];
}

module.exports = { getOrCreateCart, getCart, addItem, updateItemQuantity, removeItem, clearCart, getCartItems };
