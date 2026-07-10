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
      </div>
    </main>
  );
}
