'use client';

import { useEffect } from 'react';
import { useCart } from '../context/CartContext';

export default function Toast() {
  const { toast } = useCart();

  return (
    <div className={`toast${toast.visible ? ' show' : ''}`} id="toast" aria-live="polite">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 12l2 2 4-4" />
        <circle cx="12" cy="12" r="9" />
      </svg>
      <span>{toast.message || 'Added to cart'}</span>
    </div>
  );
}
