'use client';

import { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState({ visible: false, message: '' });

  const addToCart = useCallback((name) => {
    setCartCount((prev) => prev + 1);
    setToast({ visible: true, message: `${name} added to cart` });
    // Auto-hide toast after 2.4 s (matches original main.js behaviour)
    setTimeout(() => {
      setToast((t) => ({ ...t, visible: false }));
    }, 2400);
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, addToCart, toast }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside <CartProvider>');
  return ctx;
}
