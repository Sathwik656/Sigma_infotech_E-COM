'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { getOrderById, updateOrderStatus } from '@/services/adminService';

const ORDER_STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const PAYMENT_STATUS_OPTIONS = ['pending', 'authorized', 'captured', 'failed', 'refunded'];
const SHIPMENT_STATUS_OPTIONS = ['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered'];

const STATUS_BADGE = {
  pending: 'badge-yellow',
  confirmed: 'badge-blue',
  processing: 'badge-purple',
  shipped: 'badge-blue',
  delivered: 'badge-green',
  cancelled: 'badge-red',
  authorized: 'badge-blue',
  captured: 'badge-green',
  failed: 'badge-red',
  refunded: 'badge-purple',
  label_created: 'badge-blue',
  in_transit: 'badge-blue',
  out_for_delivery: 'badge-yellow',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function formatCurrency(amount) {
  return '₹' + Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function AdminOrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState('');

  const fetchOrder = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getOrderById(id);
      setOrder(data.data || data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load order details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchOrder(); }, [fetchOrder]);

  const handleUpdateStatus = async (field, value) => {
    try {
      setUpdating(true);
      setError('');
      setSuccess('');
      const payload = {};
      payload[field] = value;
      await updateOrderStatus(id, payload);
      setSuccess(`${field.replace('_', ' ')} updated to ${value}`);
      await fetchOrder();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="loading-spinner">Loading order details...</div>;
  if (error && !order) return <div className="alert alert-error">{error}</div>;
  if (!order) return <div className="empty-state"><h3>Order not found</h3></div>;

  const items = order.items || order.order_items || [];

  return (
    <div className="page-container">
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <Link href="/admin/orders" style={{ fontSize: 13, color: 'var(--blue)', display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
            &larr; Back to Orders
          </Link>
          <h2>Order #{order.order_number || id?.slice(0, 8)}</h2>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-faint)' }}>
            Placed {formatDate(order.created_at)}
          </span>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {/* ── STATUS UPDATES ──────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Status Management</h3>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, padding: 20 }}>
          <div>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 8, display: 'block' }}>Order Status</label>
            <select
              className="form-input"
              value={order.order_status || 'pending'}
              onChange={(e) => handleUpdateStatus('status', e.target.value)}
              disabled={updating}
            >
              {ORDER_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 8, display: 'block' }}>Payment Status</label>
            <select
              className="form-input"
              value={order.payment_status || 'pending'}
              onChange={(e) => handleUpdateStatus('payment_status', e.target.value)}
              disabled={updating}
            >
              {PAYMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="form-label" style={{ fontSize: 13, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--ink-dim)', marginBottom: 8, display: 'block' }}>Shipment Status</label>
            <select
              className="form-input"
              value={order.shipment_status || 'unshipped'}
              onChange={(e) => handleUpdateStatus('shipment_status', e.target.value)}
              disabled={updating}
            >
              {SHIPMENT_STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>
        {/* ── ORDER INFO ──────────────────────────── */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Order Info</h3>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-dim)' }}>Order Number</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{order.order_number}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-dim)' }}>Order Status</span>
              <span className={`badge ${STATUS_BADGE[order.order_status] || 'badge-gray'}`}>{order.order_status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-dim)' }}>Payment Status</span>
              <span className={`badge ${STATUS_BADGE[order.payment_status] || 'badge-gray'}`}>{order.payment_status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-dim)' }}>Shipment Status</span>
              <span className={`badge ${STATUS_BADGE[order.shipment_status] || 'badge-gray'}`}>{order.shipment_status}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-dim)' }}>Created</span>
              <span>{formatDate(order.created_at)}</span>
            </div>
          </div>
        </div>

        {/* ── CUSTOMER INFO ────────────────────────── */}
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Customer</h3>
          {order.user ? (
            <div style={{ fontSize: 14, lineHeight: 2 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-dim)' }}>Name</span>
                <span style={{ fontWeight: 600 }}>{order.user.full_name || order.user.name || '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-dim)' }}>Email</span>
                <span>{order.user.email}</span>
              </div>
              {order.user.phone && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--ink-dim)' }}>Phone</span>
                  <span>{order.user.phone}</span>
                </div>
              )}
            </div>
          ) : (
            <p style={{ color: 'var(--ink-faint)', fontSize: 14 }}>Customer info unavailable</p>
          )}
        </div>
      </div>

      {/* ── SHIPPING ADDRESS ──────────────────────── */}
      {order.address && (
        <div className="card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 16 }}>Shipping Address</h3>
          <div style={{ fontSize: 14, lineHeight: 1.8, color: 'var(--ink-dim)' }}>
            <div style={{ fontWeight: 600, color: 'var(--ink)', marginBottom: 4 }}>{order.address.full_name}</div>
            <div>{order.address.address_line_1}</div>
            {order.address.address_line_2 && <div>{order.address.address_line_2}</div>}
            <div>{order.address.city}, {order.address.state} {order.address.postal_code}</div>
            <div>{order.address.country || 'India'}</div>
            {order.address.phone && <div style={{ marginTop: 4 }}>Phone: {order.address.phone}</div>}
          </div>
        </div>
      )}

      {/* ── ORDER ITEMS ───────────────────────────── */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="card-header">
          <h3>Order Items</h3>
        </div>
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Unit Price</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => (
                <tr key={item.id || idx}>
                  <td style={{ fontWeight: 500, fontSize: 13 }}>{item.product_name || item.name || 'Product'}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--ink-dim)' }}>{item.sku || '—'}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{item.quantity}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 13 }}>{formatCurrency(item.price)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 13 }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── PAYMENT SUMMARY ───────────────────────── */}
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 16, marginBottom: 16 }}>Payment Summary</h3>
        <div style={{ maxWidth: 350, marginLeft: 'auto', fontSize: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--ink-dim)' }}>
            <span>Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--ink-dim)' }}>
            <span>Shipping</span>
            <span>{(order.shipping_charge || 0) === 0 ? 'Free' : formatCurrency(order.shipping_charge)}</span>
          </div>
          {order.tax > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--ink-dim)' }}>
              <span>Tax</span>
              <span>{formatCurrency(order.tax)}</span>
            </div>
          )}
          {order.discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10, color: 'var(--signal)' }}>
              <span>Discount</span>
              <span>-{formatCurrency(order.discount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--line)', fontWeight: 700, fontSize: 17, fontFamily: 'var(--font-display)' }}>
            <span>Grand Total</span>
            <span>{formatCurrency(order.grand_total)}</span>
          </div>
        </div>

        {order.payment && (
          <div style={{ marginTop: 24, padding: 16, background: 'var(--surface-2, var(--bg))', border: '1px solid var(--line)', fontSize: 13 }}>
            <div style={{ fontWeight: 600, marginBottom: 8 }}>Payment Details</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--ink-dim)' }}>Payment ID</span>
              <span style={{ fontFamily: 'var(--font-mono)' }}>{order.payment.razorpay_payment_id || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--ink-dim)' }}>Method</span>
              <span>{order.payment.payment_method || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--ink-dim)' }}>Status</span>
              <span className={`badge ${STATUS_BADGE[order.payment.status] || 'badge-gray'}`}>{order.payment.status}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
