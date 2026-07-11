'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';

/* -------------------------------------------------------
   Zod Validation Schema
   ------------------------------------------------------- */
const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address'),
  password: z
    .string()
    .min(1, 'Password is required'),
});

/* -------------------------------------------------------
   Password Toggle Icon
   ------------------------------------------------------- */
function EyeIcon({ open }) {
  return open ? (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (formData) => {
    setServerError('');
    const result = await login(formData.email, formData.password);

    if (result.success) {
      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect') || '/';
      router.push(redirectUrl);
    } else {
      setServerError(result.message);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* ── Header ─────────────────────────────────── */}
        <div className="auth-header">
          <span className="eyebrow">Welcome back</span>
          <h1>Sign in to your account</h1>
          <p>
            Don&apos;t have an account?{' '}
            <Link href="/register">Create one here</Link>
          </p>
        </div>

        {/* ── Server Error ────────────────────────────── */}
        {serverError && (
          <div className="auth-error" style={{ marginBottom: '20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span>{serverError}</span>
          </div>
        )}

        {/* ── Form ────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              autoFocus
              className={errors.email ? 'error' : ''}
              {...register('email')}
            />
            {errors.email && (
              <span className="field-error">{errors.email.message}</span>
            )}
          </div>

          {/* Password */}
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="password-field">
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                className={errors.password ? 'error' : ''}
                style={{ paddingRight: '40px', width: '100%' }}
                {...register('password')}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((v) => !v)}
              >
                <EyeIcon open={showPassword} />
              </button>
            </div>
            {errors.password && (
              <span className="field-error">{errors.password.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="login-submit"
            className={`btn btn-copper btn-block${isSubmitting ? ' btn-loading' : ''}`}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        {/* ── Footer note ─────────────────────────────── */}
        <p style={{ marginTop: '20px', fontSize: '13px', color: 'var(--ink-faint)', textAlign: 'center' }}>
          By signing in you agree to our{' '}
          <Link href="/" style={{ color: 'var(--blue)' }}>Terms &amp; Privacy Policy</Link>.
        </p>
      </div>
    </main>
  );
}
