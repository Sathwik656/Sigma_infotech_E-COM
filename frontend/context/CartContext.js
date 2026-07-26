'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import * as cartService from '@/services/cartService';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

const GUEST_CART_KEY = 'sigma_guest_cart';

function loadGuestCart() {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveGuestCart(items) {
  localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
}

function clearGuestCart() {
  localStorage.removeItem(GUEST_CART_KEY);
}

function computeTotals(items) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);
  return { itemCount, total: parseFloat(total.toFixed(2)) };
}

export function CartProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [itemCount, setItemCount] = useState(0);
  const [cartId, setCartId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState({ visible: false, message: '' });
  const reconcilingRef = useRef(false);

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  /* ----------------------------------------------------
     Parse backend cart response into flat items
     ---------------------------------------------------- */
  const parseCartResponse = useCallback((data) => {
    const payload = data.data || data;
    const rawItems = payload.items || payload.cart?.items || [];
    const cartItems = rawItems.map((ci) => {
      const p = ci.product || {};
      return {
        id: ci.id,
        productId: ci.product_id || p.id,
        name: p.name || ci.name || '',
        brand: p.brand || ci.brand || '',
        image: p.thumbnail_url || (p.images?.find?.((img) => img.is_primary)?.url) || ci.image || '',
        price: ci.price_at_time ?? p.price ?? ci.price ?? 0,
        quantity: ci.quantity || 0,
      };
    });
    return {
      items: cartItems,
      cart: payload.cart || payload,
    };
  }, []);

  /* ----------------------------------------------------
     Fetch cart from backend (for initial load & reconciliation)
     ---------------------------------------------------- */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartService.getCart();
      const { items: cartItems, cart } = parseCartResponse(data);
      setItems(cartItems);
      setTotal(cart.subtotal ?? 0);
      setItemCount(cart.item_count ?? 0);
      setCartId(cart.id ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, [parseCartResponse]);

  /* ----------------------------------------------------
     Background reconciliation — silently sync state with server
     ---------------------------------------------------- */
  const reconcileCart = useCallback(async () => {
    if (reconcilingRef.current) return;
    reconcilingRef.current = true;
    try {
      const data = await cartService.getCart();
      const { items: serverItems, cart } = parseCartResponse(data);
      setItems(serverItems);
      setTotal(cart.subtotal ?? 0);
      setItemCount(cart.item_count ?? 0);
      setCartId(cart.id ?? null);
    } catch {
      // Non-critical — ignore reconciliation errors
    } finally {
      reconcilingRef.current = false;
    }
  }, [parseCartResponse]);

  /* ----------------------------------------------------
     Load cart on mount / when auth state changes
     ---------------------------------------------------- */
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart().finally(() => setInitialized(true));
    } else {
      const guestItems = loadGuestCart();
      setItems(guestItems);
      const { itemCount: count, total: tot } = computeTotals(guestItems);
      setTotal(tot);
      setItemCount(count);
      setCartId(null);
      setInitialized(true);
    }
  }, [isAuthenticated, fetchCart]);

  /* ----------------------------------------------------
     syncCart — migrate guest cart to backend on login
     ---------------------------------------------------- */
  const syncCart = useCallback(async () => {
    const guestItems = loadGuestCart();
    if (guestItems.length === 0) {
      clearGuestCart();
      return;
    }

    try {
      for (const item of guestItems) {
        const productId = item.id || item.productId;
        if (productId) {
          await cartService.addItem({ productId, quantity: item.quantity });
        }
      }
      clearGuestCart();
      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync cart');
    }
  }, [fetchCart]);

  /* ----------------------------------------------------
     addItem — optimistic
     ---------------------------------------------------- */
  const addItem = useCallback(async (product, quantity = 1) => {
    setError(null);
    const productId = product.id || product.productId;

    if (!isAuthenticated) {
      setItems((prev) => {
        const existing = prev.find((item) => item.id === productId || item.productId === productId);
        const updated = existing
          ? prev.map((item) =>
              (item.id === productId || item.productId === productId)
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          : [...prev, { ...product, id: productId, productId, quantity }];
        saveGuestCart(updated);
        const { itemCount: count, total: tot } = computeTotals(updated);
        setTotal(tot);
        setItemCount(count);
        return updated;
      });
      return { success: true };
    }

    // Optimistic: add item to UI immediately
    const tempId = `temp-${Date.now()}`;
    const optimisticItem = {
      id: tempId,
      productId,
      name: product.name || '',
      brand: product.brand || '',
      image: product.image || product.thumbnail_url || '',
      price: product.price || 0,
      quantity,
    };

    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      const updated = existing
        ? prev.map((i) => i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, optimisticItem];
      const { itemCount: count, total: tot } = computeTotals(updated);
      setTotal(tot);
      setItemCount(count);
      return updated;
    });

    try {
      await cartService.addItem({ productId, quantity });
      // Reconcile in background to get server-assigned IDs and accurate prices
      reconcileCart();
      return { success: true };
    } catch (err) {
      // Revert optimistic update
      await fetchCart();
      const message = err.response?.data?.message || 'Failed to add item to cart';
      setError(message);
      return { success: false, message };
    }
  }, [isAuthenticated, fetchCart, reconcileCart]);

  /* ----------------------------------------------------
     addToCart (wrapper that also shows toast)
     ---------------------------------------------------- */
  const addToCart = useCallback(async (product, quantity = 1) => {
    const result = await addItem(product, quantity);
    if (result.success) {
      showToast(`${product.name || 'Item'} added to cart`);
    }
    return result;
  }, [addItem, showToast]);

  /* ----------------------------------------------------
     removeItem — optimistic
     ---------------------------------------------------- */
  const removeItem = useCallback(async (itemId) => {
    setError(null);

    if (!isAuthenticated) {
      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== itemId);
        saveGuestCart(updated);
        const { itemCount: count, total: tot } = computeTotals(updated);
        setTotal(tot);
        setItemCount(count);
        return updated;
      });
      return { success: true };
    }

    // Optimistic: remove item from UI immediately
    let removedItem = null;
    setItems((prev) => {
      removedItem = prev.find((i) => i.id === itemId);
      const updated = prev.filter((i) => i.id !== itemId);
      const { itemCount: count, total: tot } = computeTotals(updated);
      setTotal(tot);
      setItemCount(count);
      return updated;
    });

    try {
      await cartService.removeItem(itemId);
      reconcileCart();
      return { success: true };
    } catch (err) {
      // Revert
      await fetchCart();
      const message = err.response?.data?.message || 'Failed to remove item';
      setError(message);
      return { success: false, message };
    }
  }, [isAuthenticated, fetchCart, reconcileCart]);

  /* ----------------------------------------------------
     updateQuantity — optimistic
     ---------------------------------------------------- */
  const updateQuantity = useCallback(async (itemId, quantity) => {
    if (quantity < 1) return { success: false, message: 'Quantity must be at least 1' };
    setError(null);

    if (!isAuthenticated) {
      setItems((prev) => {
        const updated = prev.map((item) =>
          item.id === itemId ? { ...item, quantity } : item
        );
        saveGuestCart(updated);
        const { itemCount: count, total: tot } = computeTotals(updated);
        setTotal(tot);
        setItemCount(count);
        return updated;
      });
      return { success: true };
    }

    // Optimistic: update quantity immediately
    setItems((prev) => {
      const updated = prev.map((item) =>
        item.id === itemId ? { ...item, quantity } : item
      );
      const { itemCount: count, total: tot } = computeTotals(updated);
      setTotal(tot);
      setItemCount(count);
      return updated;
    });

    try {
      await cartService.updateItemQuantity(itemId, { quantity });
      reconcileCart();
      return { success: true };
    } catch (err) {
      // Revert
      await fetchCart();
      const message = err.response?.data?.message || 'Failed to update quantity';
      setError(message);
      return { success: false, message };
    }
  }, [isAuthenticated, fetchCart, reconcileCart]);

  /* ----------------------------------------------------
     clearCart
     ---------------------------------------------------- */
  const clearCart = useCallback(async () => {
    setError(null);
    clearGuestCart();

    if (!isAuthenticated) {
      setItems([]);
      setTotal(0);
      setItemCount(0);
      return { success: true };
    }

    // Optimistic: clear immediately
    setItems([]);
    setTotal(0);
    setItemCount(0);

    try {
      await cartService.clearCart();
      setCartId(null);
      return { success: true };
    } catch (err) {
      // Revert
      await fetchCart();
      const message = err.response?.data?.message || 'Failed to clear cart';
      setError(message);
      return { success: false, message };
    }
  }, [isAuthenticated, fetchCart]);

  const value = useMemo(() => ({
    items,
    total,
    itemCount,
    cartId,
    loading,
    error,
    initialized,
    toast,
    addItem,
    addToCart,
    removeItem,
    updateQuantity,
    clearCart,
    fetchCart,
    syncCart,
    showToast,
  }), [items, total, itemCount, cartId, loading, error, initialized, toast, addItem, addToCart, removeItem, updateQuantity, clearCart, fetchCart, syncCart, showToast]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
