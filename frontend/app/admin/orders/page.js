'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getOrders } from '@/services/adminService';

const STATUS_OPTIONS = ['', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_BADGE = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-purple',
  shipped: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: 20 };
      if (status) params.status = status;
      const data = await getOrders(params);
      setOrders(data.data || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load orders.');
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const renderPagination = () => {
    if (totalPages <= 1) return null;
    return (
      <div className="pagination">
        <button className="btn-sm btn-secondary" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
        {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
          <button key={p} className={`btn-sm ${p === page ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setPage(p)}>{p}</button>
        ))}
        <button className="btn-sm btn-secondary" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    );
  };

  return (
    <div className="page-container">
      <div className="card">
        <div className="card-header">
          <div>
            <h2>Order Management</h2>
            {total > 0 && <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>{total} orders</span>}
          </div>
          <select className="form-select" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.filter(Boolean).map((s) => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {loading ? (
          <div className="loading-spinner">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="empty-state">
            <h3>No orders found</h3>
            <p>Orders appear here once customers place them.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Order #</th>
                    <th>Customer</th>
                    <th>Email</th>
                    <th style={{ textAlign: 'right' }}>Total</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                        {order.order_number || order.id?.slice(0, 8)}
                      </td>
                      <td style={{ fontSize: 13 }}>{order.user?.full_name || order.customer_name || '—'}</td>
                      <td style={{ fontSize: 12, color: 'var(--ink-dim)' }}>{order.user?.email || order.customer_email || '—'}</td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                        {formatCurrency(order.total || order.grand_total)}
                      </td>
                      <td>
                        <span className={`badge ${STATUS_BADGE[order.order_status || order.status] || 'badge-gray'}`}>
                          {order.order_status || order.status}
                        </span>
                      </td>
                      <td style={{ fontSize: 13, color: 'var(--ink-dim)' }}>{formatDate(order.created_at)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="btn-sm btn-primary"
                          style={{ textDecoration: 'none' }}
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination()}
          </>
        )}
      </div>
    </div>
  );
}
