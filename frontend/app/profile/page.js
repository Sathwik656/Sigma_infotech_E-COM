'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, loading, logout } = useAuth();

  useEffect(() => {
    // If auth state has loaded and user is not authenticated, redirect to login
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Handle logout
  const handleLogout = async () => {
    await logout();
  };

  // Show nothing or a loading state while checking authentication
  if (loading || !isAuthenticated) {
    return (
      <main className="auth-page">
        <div style={{ textAlign: 'center', color: 'var(--ink-dim)' }}>Loading profile...</div>
      </main>
    );
  }

  // Get user initial for avatar
  const userInitial = user?.name
    ? user.name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase() || '?';

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
            <h1 style={{ margin: 0, fontSize: '24px' }}>Welcome, {user?.name?.split(' ')[0] || 'User'}!</h1>
          </div>
        </div>

        {/* ── Profile Info ────────────────────────────── */}
        <div className="auth-form" style={{ gap: '24px' }}>
          <div className="info-section">
            <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '16px', letterSpacing: '1px' }}>Account Information</h3>
            
            <div style={{ background: 'var(--bg)', border: '1px solid var(--line)', padding: '20px', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--line)', marginBottom: '16px' }}>
                <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Full Name</span>
                <span style={{ fontWeight: 600 }}>{user?.name || 'Not provided'}</span>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--ink-dim)', fontWeight: 500 }}>Email Address</span>
                <span style={{ fontWeight: 600 }}>{user?.email}</span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3 style={{ fontSize: '15px', textTransform: 'uppercase', color: 'var(--ink-dim)', marginBottom: '16px', letterSpacing: '1px' }}>Account Actions</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/shop" className="btn btn-outline btn-block" style={{ textAlign: 'center', justifyContent: 'center' }}>
                Continue Shopping
              </Link>
              
              <button 
                onClick={handleLogout}
                className="btn btn-block" 
                style={{ 
                  background: 'rgba(194, 112, 61, 0.1)', 
                  border: '1px solid rgba(194, 112, 61, 0.3)', 
                  color: 'var(--warn)', 
                  textAlign: 'center', 
                  justifyContent: 'center' 
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
