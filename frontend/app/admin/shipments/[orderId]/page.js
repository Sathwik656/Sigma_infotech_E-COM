'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getShipmentByOrderId, updateShipment } from '@/services/adminService';

const SHIPMENT_STATUS_OPTIONS = ['pending', 'label_created', 'in_transit', 'out_for_delivery', 'delivered'];

export default function ShipmentDetailPage() {
  const { orderId } = useParams();
  const [shipment, setShipment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    carrier: '',
    tracking_number: '',
    awb: '',
    shipment_status: 'pending',
    shipped_at: '',
    delivered_at: '',
    label_url: '',
  });

  useEffect(() => {
    const fetchShipment = async () => {
      setLoading(true);
      try {
        const data = await getShipmentByOrderId(orderId);
        const s = data.data || data;
        setShipment(s);
        setForm({
          carrier: s.carrier || '',
          tracking_number: s.tracking_number || '',
          awb: s.awb || '',
          shipment_status: s.shipment_status || 'pending',
          shipped_at: s.shipped_at ? s.shipped_at.slice(0, 16) : '',
          delivered_at: s.delivered_at ? s.delivered_at.slice(0, 16) : '',
          label_url: s.label_url || '',
        });
      } catch (err) {
        if (err.response?.status === 404) {
          setError('No shipment found for this order yet. It will be created after payment is confirmed.');
        } else {
          setError(err.response?.data?.message || 'Failed to load shipment.');
        }
      } finally {
        setLoading(false);
      }
    };
    if (orderId) fetchShipment();
  }, [orderId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...form };
      if (!payload.shipped_at) delete payload.shipped_at;
      if (!payload.delivered_at) delete payload.delivered_at;
      if (!payload.label_url) delete payload.label_url;

      const data = await updateShipment(orderId, payload);
      setShipment(data.data || data);
      setSuccess('Shipment updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update shipment.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="page-container"><div className="loading-spinner">Loading…</div></div>;

  return (
    <div className="page-container" style={{ maxWidth: 640 }}>
      <div className="page-header-row" style={{ marginBottom: 24 }}>
        <div>
          <Link href="/admin/shipments" style={{ color: 'var(--ink-dim)', fontSize: 13, textDecoration: 'none' }}>← Back to Shipments</Link>
          <h2 style={{ marginTop: 4 }}>Update Shipment</h2>
        </div>
        <Link href={`/admin/orders/${orderId}`} className="btn-secondary btn-sm" style={{ textDecoration: 'none' }}>
          View Order
        </Link>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 16 }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 16 }}>{success}</div>}

      {(shipment || !error) && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Shipment Status</label>
              <select name="shipment_status" className="form-select" value={form.shipment_status} onChange={handleChange}>
                {SHIPMENT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Carrier</label>
                <input type="text" name="carrier" className="form-input" placeholder="e.g. Delhivery, DTDC, FedEx" value={form.carrier} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">AWB / Consignment</label>
                <input type="text" name="awb" className="form-input" placeholder="Airway bill number" value={form.awb} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Tracking Number</label>
              <input type="text" name="tracking_number" className="form-input" placeholder="Customer-facing tracking number" value={form.tracking_number} onChange={handleChange} />
            </div>

            <div className="form-group">
              <label className="form-label">Label URL</label>
              <input type="url" name="label_url" className="form-input" placeholder="https://..." value={form.label_url} onChange={handleChange} />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Shipped At</label>
                <input type="datetime-local" name="shipped_at" className="form-input" value={form.shipped_at} onChange={handleChange} />
              </div>
              <div className="form-group">
                <label className="form-label">Delivered At</label>
                <input type="datetime-local" name="delivered_at" className="form-input" value={form.delivered_at} onChange={handleChange} />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
              <button type="submit" className="btn-primary" disabled={saving}>
                {saving ? 'Saving…' : 'Save Shipment'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
