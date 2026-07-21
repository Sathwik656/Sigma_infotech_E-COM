'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDashboardStats } from '@/services/adminService';

const STAT_CONFIG = [
  { key: 'totalUsers', label: 'Total Users', icon: 'users', color: 'var(--blue)' },
  { key: 'totalProducts', label: 'Total Products', icon: 'package', color: 'var(--signal)' },
  { key: 'totalOrders', label: 'Total Orders', icon: 'cart', color: 'var(--navy)' },
  { key: 'revenue', label: 'Revenue', icon: 'currency', color: 'var(--signal-deep)', format: 'currency' },
  { key: 'lowStockItems', label: 'Low Stock Items', icon: 'alert', color: 'var(--warn)' },
  { key: 'pendingOrders', label: 'Pending Orders', icon: 'clock', color: '#7c3aed' },
];

const STAT_ICONS = {
  users: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></svg>,
  package: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  cart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>,
  currency: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" /></svg>,
  alert: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  clock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
};

const STATUS_BADGE = {
  pending: 'badge-yellow',
  processing: 'badge-blue',
  shipped: 'badge-blue',
  delivered: 'badge-green',
  completed: 'badge-green',
  cancelled: 'badge-red',
  refunded: 'badge-purple',
  failed: 'badge-red',
};

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const data = await getDashboardStats();
        if (!cancelled) setStats(data.data || data);
      } catch (err) {
        if (!cancelled) setError(err.response?.data?.message || 'Failed to load dashboard stats.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchStats();
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return <div className="loading-spinner">Loading dashboard…</div>;
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="alert alert-error">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
          {error}
        </div>
      </div>
    );
  }

  const s = stats || {};
  const statValues = {
    totalUsers: s.totalUsers ?? s.total_users ?? 0,
    totalProducts: s.totalProducts ?? s.total_products ?? 0,
    totalOrders: s.totalOrders ?? s.total_orders ?? 0,
    revenue: s.revenue ?? s.totalRevenue ?? 0,
    lowStockItems: s.lowStockItems ?? s.low_stock_items ?? 0,
    pendingOrders: s.pendingOrders ?? s.pending_orders ?? 0,
  };

  const recentOrders = s.recentOrders ?? s.recent_orders ?? [];

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 28 }}>
        <h2>Dashboard</h2>
      </div>

      {/* ── Stat Cards ─────────────────────────────── */}
      <div className="grid grid-3" style={{ marginBottom: 32 }}>
        {STAT_CONFIG.map((item) => (
          <div className="stat-card" key={item.key}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label">{item.label}</span>
              <span style={{ color: item.color, width: 20, height: 20, flexShrink: 0 }}>
                {STAT_ICONS[item.icon]}
              </span>
            </div>
            <span className="stat-value">
              {item.format === 'currency'
                ? formatCurrency(statValues[item.key])
                : (statValues[item.key] ?? 0).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* ── Recent Orders ──────────────────────────── */}
      <div className="card" style={{ marginBottom: 32 }}>
        <div className="card-header">
          <h3>Recent Orders</h3>
          <Link href="/admin/orders" className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
            View All
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="empty-state" style={{ padding: '32px 16px', border: 'none' }}>
            <p style={{ color: 'var(--ink-dim)' }}>No recent orders.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id || order._id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: 13 }}>
                      {order.order_number || order.id?.slice(0, 8)}
                    </td>
                    <td>{order.customer_email || order.user_email || order.customer?.email || '—'}</td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formatCurrency(order.total || order.total_amount)}
                    </td>
                    <td>
                      <span className={`badge ${STATUS_BADGE[order.status] || 'badge-gray'}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--ink-dim)', fontSize: 13 }}>{formatDate(order.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Quick Actions ──────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <h3>Quick Actions</h3>
        </div>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link href="/admin/products/new" className="btn-primary" style={{ textDecoration: 'none' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ width: 16, height: 16 }}><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Add Product
          </Link>
          <Link href="/admin/orders" className="btn-secondary" style={{ textDecoration: 'none' }}>
            View Orders
          </Link>
          <Link href="/admin/inventory" className="btn-secondary" style={{ textDecoration: 'none' }}>
            Manage Inventory
          </Link>
        </div>
      </div>
    </div>
  );
}
