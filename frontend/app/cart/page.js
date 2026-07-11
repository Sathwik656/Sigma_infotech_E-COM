'use client';

import Link from 'next/link';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/navigation';

function CartIcon({ type }) {
  if (type === 'desktop') {
    return (
      <svg width="40" height="35" viewBox="0 0 80 70" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--ink-faint)' }}>
        <rect x="8" y="4" width="30" height="62" rx="2" />
        <circle cx="23" cy="14" r="2" />
        <rect x="44" y="30" width="30" height="20" rx="1" />
        <path d="M50 58h18" />
      </svg>
    );
  }
  if (type === 'printer') {
    return (
      <svg width="40" height="30" viewBox="0 0 80 60" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--ink-faint)' }}>
        <path d="M18 22V6h44v16" />
        <rect x="8" y="22" width="64" height="24" rx="2" />
        <rect x="20" y="46" width="40" height="10" />
      </svg>
    );
  }
  // default: laptop
  return (
    <svg width="45" height="35" viewBox="0 0 90 70" fill="none" stroke="currentColor" strokeWidth="1.4" style={{ color: 'var(--ink-faint)' }}>
      <rect x="6" y="6" width="78" height="46" rx="2" />
      <path d="M2 58h86l-6 8H8Z" />
    </svg>
  );
}

export default function CartPage() {
  const { cartItems, cartTotal, updateQuantity, removeFromCart } = useCart();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const handleCheckout = () => {
    if (!isAuthenticated) {
      router.push('/login?redirect=/cart');
      return;
    }
    alert('Checkout process will be integrated later. Thank you!');
  };

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>Cart</span>
          </div>
          <h1>Your Cart</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container">
            {cartItems.length === 0 ? (
              <div className="cart-empty" style={{ textAlign: 'center', padding: '60px 0' }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 64, height: 64, color: 'var(--ink-faint)', marginBottom: 24 }}>
                  <path d="M3 3h2l2.4 12.2a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.6L20 7H6" />
                  <circle cx="9" cy="20" r="1.4" />
                  <circle cx="17" cy="20" r="1.4" />
                </svg>
                <h2 style={{ marginBottom: 12 }}>Your cart is empty</h2>
                <p style={{ color: 'var(--ink-dim)', marginBottom: 32 }}>Looks like you haven't added anything to your cart yet.</p>
                <Link href="/shop" className="btn btn-copper">
                  Browse Shop
                </Link>
              </div>
            ) : (
              <div className="cart-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '40px', alignItems: 'start' }}>
                
                {/* ── CART ITEMS ────────────────────────────── */}
                <div className="cart-items">
                  {cartItems.map((item) => (
                    <div key={item.id} className="cart-item" style={{ 
                      display: 'grid', 
                      gridTemplateColumns: '80px 1fr auto', 
                      gap: '24px', 
                      padding: '24px', 
                      background: 'var(--surface)', 
                      borderRadius: '8px', 
                      marginBottom: '16px',
                      alignItems: 'center'
                    }}>
                      <div className="cart-item-thumb" style={{ background: 'var(--bg)', height: '80px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CartIcon type={item.icon_type} />
                      </div>
                      
                      <div className="cart-item-details">
                        <span style={{ fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--ink-dim)' }}>{item.brand}</span>
                        <h4 style={{ margin: '4px 0 8px 0', fontSize: '16px' }}>
                          <Link href={`/product/${item.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                            {item.name}
                          </Link>
                        </h4>
                        <div className="qty-control" style={{ display: 'inline-flex', background: 'var(--bg)', borderRadius: '4px', overflow: 'hidden' }}>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            style={{ padding: '4px 12px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink)' }}
                          >−</button>
                          <span style={{ padding: '4px 12px', fontSize: '14px', borderLeft: '1px solid var(--border)', borderRight: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            style={{ padding: '4px 12px', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--ink)' }}
                          >+</button>
                        </div>
                      </div>

                      <div className="cart-item-actions" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '16px' }}>
                        <span style={{ fontWeight: '500', fontSize: '16px' }}>
                          ₹{(item.price * item.quantity).toLocaleString('en-IN')}
                        </span>
                        <button 
                          onClick={() => removeFromCart(item.id)}
                          style={{ border: 'none', background: 'none', color: 'var(--signal)', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 14, height: 14 }}>
                            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          </svg>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* ── ORDER SUMMARY ─────────────────────────── */}
                <aside className="cart-summary" style={{ background: 'var(--surface)', padding: '32px', borderRadius: '8px' }}>
                  <h3 style={{ marginBottom: '24px', fontSize: '18px' }}>Order Summary</h3>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--ink-dim)', fontSize: '15px' }}>
                    <span>Subtotal</span>
                    <span>₹{cartTotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: 'var(--ink-dim)', fontSize: '15px' }}>
                    <span>Estimated Tax (18%)</span>
                    <span>₹{Math.round(cartTotal * 0.18).toLocaleString('en-IN')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '24px', borderBottom: '1px solid var(--border)', color: 'var(--ink-dim)', fontSize: '15px' }}>
                    <span>Shipping</span>
                    <span>Calculated at checkout</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', margin: '24px 0', fontWeight: '500', fontSize: '18px' }}>
                    <span>Total</span>
                    <span>₹{Math.round(cartTotal * 1.18).toLocaleString('en-IN')}</span>
                  </div>

                  <button 
                    className="btn btn-copper" 
                    style={{ width: '100%', justifyContent: 'center' }}
                    onClick={handleCheckout}
                  >
                    Proceed to Checkout
                  </button>

                  <div style={{ marginTop: '24px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--ink-faint)', fontSize: '13px', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ width: 16, height: 16 }}>
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                    </svg>
                    Secure checkout
                  </div>
                </aside>

              </div>
            )}
          </div>
        </section>
      </main>

      <style>{`
        @media (max-width: 900px) {
          .cart-layout {
            grid-template-columns: 1fr !important;
          }
          .cart-item {
            grid-template-columns: 80px 1fr !important;
          }
          .cart-item-actions {
            grid-column: 1 / -1;
            flex-direction: row !important;
            justify-content: space-between;
            align-items: center !important;
            margin-top: 16px;
            padding-top: 16px;
            border-top: 1px solid var(--border);
          }
        }
      `}</style>
    </>
  );
}
