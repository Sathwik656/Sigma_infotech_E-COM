'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

export default function OrdersPage() {
  const router = useRouter();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);

  useEffect(() => {
    document.title = 'My Orders | Sigma Infotech';
  }, []);

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login?redirect=/orders');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchOrders = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      setError('');
      const data = await orderService.list({ page: pageNum, limit: 10 });
      setOrders(data.data || data.orders || data || []);
      setTotalPages(data.pagination?.totalPages || data.totalPages || 1);
      setTotalOrders(data.pagination?.total || data.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      fetchOrders(page);
    }
  }, [isAuthenticated, page, fetchOrders]);

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

  return (
    <>
      <div className="page-header">
        <div className="container">
          <div className="breadcrumb">
            <Link href="/">Home</Link>
            <span>/</span>
            <span>My Orders</span>
          </div>
          <h1>My Orders</h1>
        </div>
      </div>

      <main>
        <section>
          <div className="container" style={{ maxWidth: 900 }}>
            {error && (
              <div className="auth-error" style={{ marginBottom: 24 }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            {loading ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--ink-dim)' }}>
                <div className="loading-spinner" style={{ width: 32, height: 32, border: '3px solid var(--line)', borderTopColor: 'var(--signal)', borderRadius: '50%', margin: '0 auto 16px', animation: 'spin 0.8s linear infinite' }} />
                Loading orders...
              </div>
            ) : orders.length === 0 ? (
              <div className="empty-state" style={{
                textAlign: 'center',
                padding: '60px 0',
                background: 'var(--surface)',
                border: '1px solid var(--line)',
              }}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ width: 56, height: 56, color: 'var(--ink-faint)', margin: '0 auto 20px' }}>
                  <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
                  <rect x="9" y="3" width="6" height="4" rx="1" />
                </svg>
                <h3 style={{ fontSize: 20, marginBottom: 8 }}>No orders yet</h3>
                <p style={{ color: 'var(--ink-dim)', marginBottom: 24, fontSize: 14 }}>
                  Start shopping to see your orders here.
                </p>
                <Link href="/shop" className="btn btn-copper">
                  Browse Shop
                </Link>
              </div>
            ) : (
              <>
                <div style={{ marginBottom: 16, fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--ink-dim)' }}>
                  {totalOrders} order{totalOrders !== 1 ? 's' : ''} found
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {orders.map((order) => {
                    const itemsCount = order.order_items?.length || order.items?.length || 0;
                    const status = (order.order_status || order.status || 'pending').toLowerCase();
                    const badgeStyle = STATUS_STYLES[status] || STATUS_STYLES.pending;

                    return (
                      <div
                        key={order.id}
                        style={{
                          background: 'var(--surface)',
                          border: '1px solid var(--line)',
                          padding: '20px 24px',
                          display: 'grid',
                          gridTemplateColumns: '1fr auto',
                          gap: 16,
                          alignItems: 'center',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 600, fontFamily: 'var(--font-mono)', fontSize: 14 }}>
                              #{order.order_number || order.id?.slice(0, 8) || 'N/A'}
                            </span>
                            <span className="badge" style={{
                              ...badgeStyle,
                              padding: '3px 10px',
                              fontFamily: 'var(--font-mono)',
                              fontSize: 11,
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                            }}>
                              {status}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--ink-dim)' }}>
                            <span>{formatDate(order.created_at || order.createdAt)}</span>
                            <span style={{ margin: '0 8px', color: 'var(--line)' }}>|</span>
                            <span>{itemsCount} item{itemsCount !== 1 ? 's' : ''}</span>
                          </div>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                          <span style={{ fontWeight: 700, fontFamily: 'var(--font-mono)', fontSize: 16 }}>
                            ₹{(order.grand_total || order.total || order.total_amount || 0).toLocaleString('en-IN')}
                          </span>
                          <Link
                            href={`/orders/${order.id}`}
                            className="btn btn-sm btn-outline"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* ── PAGINATION ─────────────────────────── */}
                {totalPages > 1 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 40,
                  }}>
                    <button
                      className="btn btn-sm btn-outline"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                      style={{ opacity: page <= 1 ? 0.5 : 1 }}
                    >
                      Previous
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                      .map((p, idx, arr) => (
                        <span key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          {idx > 0 && arr[idx - 1] !== p - 1 && (
                            <span style={{ color: 'var(--ink-faint)', fontSize: 13 }}>...</span>
                          )}
                          <button
                            onClick={() => setPage(p)}
                            style={{
                              width: 36,
                              height: 36,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: page === p ? 'var(--navy)' : 'transparent',
                              color: page === p ? '#fff' : 'var(--ink)',
                              border: `1px solid ${page === p ? 'var(--navy)' : 'var(--line)'}`,
                              fontFamily: 'var(--font-mono)',
                              fontSize: 13,
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            {p}
                          </button>
                        </span>
                      ))}

                    <button
                      className="btn btn-sm btn-outline"
                      disabled={page >= totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      style={{ opacity: page >= totalPages ? 0.5 : 1 }}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>
      </main>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
