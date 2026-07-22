'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import axiosInstance from '@/lib/axios';

const TOKEN_KEY = 'sigma_access_token';
const REFRESH_KEY = 'sigma_refresh_token';
const USER_KEY = 'sigma_user';

export default function AuthCallbackPage() {
  const router = useRouter();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('Processing Google sign-in…');
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        // Extract tokens from the URL hash fragment
        const hash = window.location.hash;
        if (!hash) {
          if (!cancelled) setError('No authentication data received.');
          return;
        }

        const params = new URLSearchParams(hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        if (!accessToken) {
          if (!cancelled) setError('No access token received from Google.');
          return;
        }

        if (!cancelled) setStatus('Verifying with server…');

        // Call backend to complete OAuth login (use axios instance for proper URL handling)
        const { data } = await axiosInstance.post('/api/auth/oauth', {
          access_token: accessToken,
        });

        if (!data.success) {
          if (!cancelled) setError(data.message || 'OAuth login failed.');
          return;
        }

        if (!cancelled) setStatus('Signing you in…');

        // Store session in localStorage (same as email/password login)
        localStorage.setItem(TOKEN_KEY, data.access_token);
        if (refreshToken) {
          localStorage.setItem(REFRESH_KEY, refreshToken);
        }
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));

        // Clear the hash to prevent token leakage in browser history
        window.history.replaceState({}, '', window.location.pathname);

        // Refresh auth state
        await refreshUser();

        // Redirect based on role
        if (!cancelled) {
          if (data.user?.role === 'admin') {
            router.push('/admin/dashboard');
          } else {
            const params = new URLSearchParams(window.location.search);
            const redirectUrl = params.get('redirect');
            router.push(redirectUrl || '/');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message || 'Something went wrong during Google sign-in.');
        }
      }
    }

    handleCallback();

    return () => { cancelled = true; };
  }, [router, refreshUser]);

  return (
    <main className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {error ? (
          <>
            <div className="auth-error" style={{ marginBottom: 20 }}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
            </div>
            <button
              className="btn btn-copper"
              onClick={() => router.push('/login')}
              style={{ marginTop: 12 }}
            >
              Back to Login
            </button>
          </>
        ) : (
          <div style={{ padding: '24px 0' }}>
            <div
              style={{
                width: 32,
                height: 32,
                border: '3px solid var(--line)',
                borderTopColor: 'var(--signal)',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
                margin: '0 auto 16px',
              }}
            />
            <p style={{ fontSize: 14, color: 'var(--ink-dim)' }}>{status}</p>
          </div>
        )}
      </div>
    </main>
  );
}
