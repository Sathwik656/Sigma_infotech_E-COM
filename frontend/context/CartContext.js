'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  const showToast = useCallback((message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 3000);
  }, []);

  /* ----------------------------------------------------
     Fetch cart from backend
     ---------------------------------------------------- */
  const fetchCart = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await cartService.getCart();
      // Backend returns { success, data: { cart, items } } — unwrap .data
      const payload = data.data || data;
      const rawItems = payload.items || payload.cart?.items || [];
      // Normalize backend cart items to flat structure the UI expects
      const cartItems = rawItems.map((ci) => {
        const p = ci.product || {};
        return {
          id: ci.id,
          productId: ci.product_id || p.id,
          name: p.name || ci.name || '',
          brand: p.brand || ci.brand || '',
          image: p.thumbnail_url || (p.images?.find((img) => img.is_primary)?.url) || ci.image || '',
          price: ci.price_at_time ?? p.price ?? ci.price ?? 0,
          quantity: ci.quantity || 0,
        };
      });
      setItems(cartItems);
      setTotal(payload.cart?.subtotal ?? payload.total ?? 0);
      setItemCount(payload.cart?.item_count ?? payload.itemCount ?? 0);
      setCartId(payload.cart?.id ?? payload.id ?? null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch cart');
    } finally {
      setLoading(false);
    }
  }, []);

  /* ----------------------------------------------------
     Load cart on mount / when auth state changes
     ---------------------------------------------------- */
  useEffect(() => {
    if (isAuthenticated) {
      fetchCart().finally(() => setInitialized(true));
    } else {
      const guestItems = loadGuestCart();
      setItems(guestItems);
      setTotal(guestItems.reduce((sum, item) => sum + item.price * item.quantity, 0));
      setItemCount(guestItems.reduce((sum, item) => sum + item.quantity, 0));
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
      setLoading(true);
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
    } finally {
      setLoading(false);
    }
  }, [fetchCart]);

  /* ----------------------------------------------------
     addItem
     ---------------------------------------------------- */
  const addItem = useCallback(async (product, quantity = 1) => {
    setError(null);

    if (!isAuthenticated) {
      setItems((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        const updated = existing
          ? prev.map((item) =>
              item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
            )
          : [...prev, { ...product, quantity }];
        saveGuestCart(updated);
        setTotal(updated.reduce((sum, i) => sum + i.price * i.quantity, 0));
        setItemCount(updated.reduce((sum, i) => sum + i.quantity, 0));
        return updated;
      });
      return { success: true };
    }

    try {
      setLoading(true);
      await cartService.addItem({ productId: product.id || product.productId, quantity });
      try {
        await fetchCart();
      } catch (_fetchErr) {
        // Item was added successfully even if fetchCart failed
      }
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add item to cart';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

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
     removeItem
     ---------------------------------------------------- */
  const removeItem = useCallback(async (itemId) => {
    setError(null);

    if (!isAuthenticated) {
      setItems((prev) => {
        const updated = prev.filter((item) => item.id !== itemId);
        saveGuestCart(updated);
        setTotal(updated.reduce((sum, i) => sum + i.price * i.quantity, 0));
        setItemCount(updated.reduce((sum, i) => sum + i.quantity, 0));
        return updated;
      });
      return { success: true };
    }

    try {
      setLoading(true);
      await cartService.removeItem(itemId);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to remove item';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

  /* ----------------------------------------------------
     updateQuantity
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
        setTotal(updated.reduce((sum, i) => sum + i.price * i.quantity, 0));
        setItemCount(updated.reduce((sum, i) => sum + i.quantity, 0));
        return updated;
      });
      return { success: true };
    }

    try {
      setLoading(true);
      await cartService.updateItemQuantity(itemId, { quantity });
      await fetchCart();
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update quantity';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, fetchCart]);

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

    try {
      setLoading(true);
      await cartService.clearCart();
      setItems([]);
      setTotal(0);
      setItemCount(0);
      setCartId(null);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to clear cart';
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

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
