'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import * as orderService from '@/services/orderService';

const STATUS_STYLES = {
  pending: { background: 'rgba(234, 179, 8, 0.1)', color: '#a16207', border: '1px solid rgba(234, 179, 8, 0.3)' },
  confirmed: { background: 'rgba(59, 130, 246, 0.1)', color: '#1d4ed8', border: '1px solid rgba(59, 130, 246, 0.3)' },
  processing: { background: 'rgba(168, 85, 247, 0.1)', color: '#7c3aed', border: '1px solid rgba(168, 85, 247, 0.3)' },
  shipped: { background: 'rgba(99, 102, 241, 0.1)', color: '#4f46e5', border: '1px solid rgba(99, 102, 241, 0.3)' },
  delivered: { background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' },
  cancelled: { background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)' },
  paid: { background: 'rgba(16, 185, 129, 0.1)', color: '#059669', border: '1px solid rgba(16, 185, 129, 0.3)' },
};

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    document.title = 'Order Details | Sigma Infotech';
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !id) return;

    async function fetchOrder() {
      try {
        setLoading(true);
        setError('');
        const data = await orderService.getById(id);
        setOrder(data.order || data);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load order details');
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [isAuthenticated, id]);

  if (authLoading) {
    return (
      <main className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center', maxWidth: 480 }}>
          <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--signal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ color: 'var(--ink-dim)' }}>Loading...</p>
        </div>
      </main>
    );
  }

  if (!isAuthenticated) return null;

  const status = (order?.order_status || order?.status || 'pending').toLowerCase();
  const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;
  const orderItems = order?.order_items || order?.items || [];
  const shippingAddr = order?.address || order?.shipping_address || order?.shippingAddress || null;
  const paymentInfo = order?.payment || order?.paymentInfo || null;

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <Link href="/orders">My Orders</Link>
            <span>/</span>
            <span>Order Details</span>
          </div>
          <h1>Order Details</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container" style={{ maxWidth: 900 }}>
            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-dim)' }}>
                <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--signal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                Loading order details...
              </div>
            ) : error ? (
              <div>
                <div className="auth-error" style={{ marginBottom: 24 }}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <span>{error}</span>
                </div>
                <Link href="/orders" className="btn btn-outline">
                  Back to Orders
                </Link>
              </div>
            ) : !order ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 0',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>Order not found</h3>
                <p style={{ color: 'var(--ink-dim)', marginBottom: 24, fontSize: 14 }}>
                  The order you are looking for does not exist or has been removed.
                </p>
                <Link href="/orders" className="btn btn-copper">
                  Back to Orders
                </Link>
              </div>
            ) : (
              <>
                {/* ── HEADER ────────────────────────────────── */}
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  padding: '24px 28px',
                  marginBottom: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: 12,
                }}>
                  <div>
                    <h2 style={{ fontSize: 20, marginBottom: 4 }}>
                      Order #{order.order_number || order.id?.slice(0, 8) || 'N/A'}
                    </h2>
                    <div style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
                      Placed on {formatDate(order.created_at || order.createdAt)}
                    </div>
                  </div>
                  <span className="badge" style={{
                    ...badgeStyle,
                    padding: '4px 14px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}>
                    {status}
                  </span>
                </div>

                {/* ── ITEMS TABLE ──────────────────────────── */}
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  padding: 28,
                  marginBottom: 24,
                }}>
                  <h3 style={{ fontSize: 16, marginBottom: 20 }}>Order Items</h3>
                  <div style={{ overflowX: 'auto' }}>
                    <table className="spec-table" style={{ width: '100%' }}>
                      <thead>
                        <tr>
                          <th style={{ textAlign: 'left', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Product</th>
                          <th style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Qty</th>
                          <th style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Unit Price</th>
                          <th style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '8px 0' }}>Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderItems.map((item, idx) => (
                          <tr key={item.id || idx}>
                            <td style={{ padding: '14px 0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                  width: 50,
                                  height: 50,
                                  background: 'var(--surface-2)',
                                  border: '1px solid var(--line)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}>
                                  {item.image || item.product?.image ? (
                                    <img src={item.image || item.product?.image} alt={item.name || item.product?.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  ) : (
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 20, height: 20, color: 'var(--ink-faint)' }}>
                                      <rect x="3" y="3" width="18" height="18" rx="2" />
                                    </svg>
                                  )}
                                </div>
                                <span style={{ fontWeight: 500, fontSize: 14 }}>{item.product_name || item.name || item.product?.name || 'Product'}</span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 14 }}>{item.quantity}</td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 14 }}>₹{(item.price || 0).toLocaleString('en-IN')}</td>
                            <td style={{ padding: '14px 0', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 14 }}>₹{(item.total || (item.price || 0) * (item.quantity || 0)).toLocaleString('en-IN')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
                  {/* ── SHIPPING ADDRESS ──────────────────── */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    padding: 24,
                  }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16 }}>Shipping Address</h3>
                    {shippingAddr ? (
                      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink-dim)' }}>
                        <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>
                          {shippingAddr.full_name}
                        </div>
                        <div>{shippingAddr.address_line_1}</div>
                        {shippingAddr.address_line_2 && <div>{shippingAddr.address_line_2}</div>}
                        <div>{shippingAddr.city}, {shippingAddr.state} {shippingAddr.postal_code}</div>
                        <div>{shippingAddr.country || 'India'}</div>
                        {shippingAddr.phone && <div style={{ marginTop: 4 }}>Phone: {shippingAddr.phone}</div>}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>No shipping address available</p>
                    )}
                  </div>

                  {/* ── PAYMENT INFO ─────────────────────── */}
                  <div style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--line)',
                    padding: 24,
                  }}>
                    <h3 style={{ fontSize: 16, marginBottom: 16 }}>Payment Info</h3>
                    {paymentInfo ? (
                      <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink-dim)' }}>
                        {paymentInfo.payment_method && (
                          <div><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>Method: </span>{paymentInfo.payment_method}</div>
                        )}
                        {paymentInfo.status && (
                          <div>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>Status: </span>
                            <span style={{ fontWeight: 600, color: paymentInfo.status === 'captured' || paymentInfo.status === 'paid' ? 'var(--signal-deep)' : 'var(--warn)' }}>
                              {paymentInfo.status}
                            </span>
                          </div>
                        )}
                        {paymentInfo.razorpay_payment_id && (
                          <div style={{ wordBreak: 'break-all' }}>
                            <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--ink-faint)' }}>Payment ID: </span>
                            {paymentInfo.razorpay_payment_id}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>No payment information available</p>
                    )}
                  </div>
                </div>

                {/* ── ORDER SUMMARY ──────────────────────── */}
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--line)',
                  padding: 24,
                  marginBottom: 24,
                }}>
                  <h3 style={{ fontSize: 16, marginBottom: 16 }}>Order Summary</h3>
                  <div style={{ maxWidth: 300, marginLeft: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--ink-dim)' }}>
                      <span>Subtotal</span>
                      <span>₹{(order.subtotal || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--ink-dim)' }}>
                      <span>Shipping</span>
                      <span style={{ color: (order.shipping_charge || 0) === 0 ? 'var(--signal)' : 'var(--ink)' }}>
                        {(order.shipping_charge || 0) === 0 ? 'Free' : `₹${(order.shipping_charge || 0).toLocaleString('en-IN')}`}
                      </span>
                    </div>
                    {order.tax > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, fontSize: 14, color: 'var(--ink-dim)' }}>
                        <span>Tax</span>
                        <span>₹{(order.tax || 0).toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      paddingTop: 12,
                      borderTop: '1px solid var(--line)',
                      fontWeight: 700,
                      fontSize: 16,
                      fontFamily: 'var(--font-display)',
                    }}>
                      <span>Total</span>
                      <span>₹{(order.grand_total || order.total || 0).toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* ── BACK LINK ──────────────────────────── */}
                <Link href="/orders" style={{ fontSize: 14, color: 'var(--blue)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  ← Back to Orders
                </Link>
              </>
            )}
          </div>
        </section>
      </main>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 700px) {
          div[style*="grid-template-columns: 1fr 1fr"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </>
  );
}
