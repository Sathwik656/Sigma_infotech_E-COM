'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, profile, isAuthenticated, loading, logout, updateProfile } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
  });

  const displayProfile = profile || user;

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (displayProfile) {
      setFormData({
        full_name: displayProfile.full_name || displayProfile.name || '',
        phone: displayProfile.phone || '',
      });
    }
  }, [displayProfile]);

  const handleLogout = async () => {
    await logout();
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: '', text: '' });

    const result = await updateProfile(formData);

    if (result.success) {
      setMessage({ type: 'success', text: 'Profile updated successfully.' });
      setEditing(false);
    } else {
      setMessage({ type: 'error', text: result.message || 'Failed to update profile.' });
    }

    setSaving(false);
  };

  const handleCancel = () => {
    if (displayProfile) {
      setFormData({
        full_name: displayProfile.full_name || displayProfile.name || '',
        phone: displayProfile.phone || '',
      });
    }
    setEditing(false);
    setMessage({ type: '', text: '' });
  };

  if (loading || !isAuthenticated) {
    return (
      <main className="auth-page">
        <div style={{ textAlign: 'center', color: 'var(--ink-dim)' }}>Loading profile...</div>
      </main>
    );
  }

  const fullName = displayProfile?.full_name || displayProfile?.name || 'User';

  const userInitial = fullName.charAt(0).toUpperCase();

  const memberSince = displayProfile?.created_at
    ? new Date(displayProfile.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ maxWidth: '600px', width: '100%' }}>
        {/* ── Header ─────────────────────────────────── */}
        <div className="auth-header" style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '40px' }}>
          <div className="header-user-avatar" style={{ width: '64px', height: '64px', fontSize: '28px', background: 'var(--signal)', color: '#04211f' }}>
            {userInitial}
          </div>
          <div>
            <span className="eyebrow" style={{ display: 'block', marginBottom: '8px' }}>My Account</span>
            <h1 style={{ margin: 0, fontSize: '24px' }}>Welcome, {fullName.split(' ')[0]}!</h1>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────── */}
        {message.text && (
          <div
            className={message.type === 'success' ? 'auth-success' : 'auth-error'}
            style={{ marginBottom: '20px' }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              {message.type === 'success' ? (
                <>
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </>
              ) : (
                <>
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="8" x2="12" y2="12" />
                  <line x1="12" y1="16" x2="12.01" y2="16" />
                </>
              )}
            </svg>
            <span>{message.text}</span>
          </div>
        )}

        {/* ── Profile Info / Edit Form ────────────────── */}
        <div className="auth-form" style={{ gap: '24px' }}>
          <div className="info-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--ink-dim)', letterSpacing: '1px', margin: 0 }}>Account Information</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="btn btn-outline"
                  style={{ padding: '6px 16px', fontSize: '13px' }}
                >
                  Edit Profile
                </button>
              )}
            </div>

            {editing ? (
              <form onSubmit={handleSave}>
                <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '20px', borderRadius: 'var(--radius)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="field">
                    <label htmlFor="full_name" style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: 'var(--ink-dim)' }}>Full Name</label>
                    <input
                      id="full_name"
                      name="full_name"
                      type="text"
                      value={formData.full_name}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="phone" style={{ fontSize: '13px', marginBottom: '4px', display: 'block', color: 'var(--ink-dim)' }}>Phone</label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                    <button
                      type="submit"
                      className={`btn btn-copper${saving ? ' btn-loading' : ''}`}
                      disabled={saving}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      {saving ? 'Saving…' : 'Save Changes'}
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={handleCancel}
                      disabled={saving}
                      style={{ flex: 1, justifyContent: 'center' }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '20px', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--line)', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Name</span>
                  <span style={{ fontWeight: 600 }}>{fullName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--line)', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Email</span>
                  <span style={{ fontWeight: 600 }}>{displayProfile?.email}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--line)', marginBottom: '16px' }}>
                  <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Phone</span>
                  <span style={{ fontWeight: 600 }}>{displayProfile?.phone || 'Not provided'}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: displayProfile?.created_at ? '1px solid var(--line)' : 'none', marginBottom: displayProfile?.created_at ? '16px' : 0 }}>
                  <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Role</span>
                  <span style={{ fontWeight: 600, textTransform: 'capitalize' }}>{displayProfile?.role || 'Customer'}</span>
                </div>
                {memberSince && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Member Since</span>
                    <span style={{ fontWeight: 600 }}>{memberSince}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="info-section">
            <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '16px', letterSpacing: '1px' }}>Quick Links</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/orders" className="btn btn-outline btn-block" style={{ textAlign: 'center', justifyContent: 'center' }}>
                My Orders
              </Link>
              <Link href="/addresses" className="btn btn-outline btn-block" style={{ textAlign: 'center', justifyContent: 'center' }}>
                My Addresses
              </Link>
              <Link href="/shop" className="btn btn-outline btn-block" style={{ textAlign: 'center', justifyContent: 'center' }}>
                Continue Shopping
              </Link>

              {displayProfile?.role === 'admin' && (
                <Link href="/admin/dashboard" className="btn btn-outline btn-block" style={{ textAlign: 'center', justifyContent: 'center', borderColor: 'var(--signal)', color: 'var(--signal)' }}>
                  Admin Dashboard
                </Link>
              )}

              <button
                onClick={handleLogout}
                className="btn btn-block"
                style={{
                  background: 'rgba(194, 112, 61, 0.1)',
                  border: '1px solid rgba(194, 112, 61, 0.3)',
                  color: 'var(--warn)',
                  textAlign: 'center',
                  justifyContent: 'center',
                }}
              >
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
