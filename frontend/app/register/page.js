'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../lib/supabase';

/* -------------------------------------------------------
   Zod Validation Schema
   ------------------------------------------------------- */
const registerSchema = z
  .object({
    name: z
      .string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must be under 100 characters'),
    email: z
      .string()
      .min(1, 'Email address is required')
      .email('Please enter a valid email address'),
    password: z
      .string()
      .min(6, 'Password must be at least 6 characters')
      .regex(/[A-Za-z]/, 'Password must contain at least one letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
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

export default function RegisterPage() {
  const router = useRouter();
  const { register: registerUser } = useAuth();
  const { syncCart } = useCart();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (formData) => {
    setServerError('');
    setSuccess('');

    const result = await registerUser(formData.name, formData.email, formData.password);

    if (result.success) {
      await syncCart();
      if (result.requiresConfirmation) {
        setSuccess('Account created! Please check your email to confirm your account, then log in.');
        reset();
      } else {
        setSuccess('Account created successfully! Redirecting to login…');
        reset();
        setTimeout(() => router.push('/login'), 1800);
      }
    } else {
      setServerError(result.message);
    }
  };

  const handleGoogleLogin = async () => {
    setServerError('');
    setSuccess('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setServerError(error.message || 'Failed to start Google sign-up.');
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-card">
        {/* ── Header ─────────────────────────────────── */}
        <div className="auth-header">
          <span className="eyebrow">New account</span>
          <h1>Create your account</h1>
          <p>
            Already have an account?{' '}
            <Link href="/login">Sign in here</Link>
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

        {/* ── Success ─────────────────────────────────── */}
        {success && (
          <div className="auth-success" style={{ marginBottom: '20px' }}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* ── Form ────────────────────────────────────── */}
        <form className="auth-form" onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Full Name */}
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input
              id="name"
              type="text"
              autoComplete="name"
              autoFocus
              className={errors.name ? 'error' : ''}
              {...register('name')}
            />
            {errors.name && (
              <span className="field-error">{errors.name.message}</span>
            )}
          </div>

          {/* Email */}
          <div className="field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              autoComplete="email"
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
                autoComplete="new-password"
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
            <span style={{ fontSize: '12px', color: 'var(--ink-faint)', marginTop: '4px' }}>
              Min. 6 characters with at least one letter and one number.
            </span>
          </div>

          {/* Confirm Password */}
          <div className="field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <div className="password-field">
              <input
                id="confirmPassword"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                className={errors.confirmPassword ? 'error' : ''}
                style={{ paddingRight: '40px', width: '100%' }}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showConfirm ? 'Hide password' : 'Show password'}
                onClick={() => setShowConfirm((v) => !v)}
              >
                <EyeIcon open={showConfirm} />
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="field-error">{errors.confirmPassword.message}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            id="register-submit"
            className={`btn btn-copper btn-block${isSubmitting ? ' btn-loading' : ''}`}
            disabled={isSubmitting || !!success}
          >
            {isSubmitting ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        {/* ── Divider ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, margin: '24px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
          <span style={{ fontSize: 12, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>or</span>
          <div style={{ flex: 1, height: 1, background: 'var(--line)' }} />
        </div>

        {/* ── Google Sign-Up ─────────────────────────────── */}
        <button
          type="button"
          className="btn btn-google btn-block"
          onClick={handleGoogleLogin}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 10,
            padding: '12px 16px',
            background: '#fff',
            border: '1px solid var(--line)',
            borderRadius: 'var(--radius)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--ink)',
            cursor: 'pointer',
            fontFamily: 'var(--font-body)',
            width: '100%',
            transition: 'border-color .2s ease',
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continue with Google
        </button>
      </div>
    </main>
  );
}
