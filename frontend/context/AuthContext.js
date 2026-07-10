'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '../services/auth';

/* -------------------------------------------------------
   Context Definition
   ------------------------------------------------------- */
const AuthContext = createContext(null);

/* -------------------------------------------------------
   Token Storage Helpers (localStorage)
   ------------------------------------------------------- */
const TOKEN_KEY = 'sigma_access_token';
const REFRESH_KEY = 'sigma_refresh_token';
const USER_KEY = 'sigma_user';

function saveSession(accessToken, refreshToken, user) {
  localStorage.setItem(TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
}

function getStoredUser() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/* -------------------------------------------------------
   AuthProvider Component
   ------------------------------------------------------- */
export function AuthProvider({ children }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true during initial session restore
  const [error, setError] = useState(null);

  /* ----------------------------------------------------
     Session Restore — runs once on mount
     ---------------------------------------------------- */
  useEffect(() => {
    async function restoreSession() {
      const storedUser = getStoredUser();
      const accessToken = localStorage.getItem(TOKEN_KEY);

      if (!accessToken || !storedUser) {
        setLoading(false);
        return;
      }

      // Optimistically show stored user, then verify with backend
      setUser(storedUser);

      try {
        const data = await authService.getMe();
        setUser(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        // Token is invalid/expired — clear everything
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    restoreSession();
  }, []);

  /* ----------------------------------------------------
     Login Action
     ---------------------------------------------------- */
  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const data = await authService.login({ email, password });
      saveSession(data.access_token, data.refresh_token, data.user);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Login failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  /* ----------------------------------------------------
     Register Action
     ---------------------------------------------------- */
  const register = useCallback(async (name, email, password) => {
    setError(null);
    try {
      const data = await authService.register({ name, email, password });
      return { success: true, requiresConfirmation: data.requiresConfirmation };
    } catch (err) {
      // Handle validation errors array
      if (err.response?.data?.errors?.length) {
        const message = err.response.data.errors[0].message;
        setError(message);
        return { success: false, message };
      }
      const message =
        err.response?.data?.message || err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  /* ----------------------------------------------------
     Logout Action
     ---------------------------------------------------- */
  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // Best-effort — clear local session regardless
    } finally {
      clearSession();
      setUser(null);
      router.push('/login');
    }
  }, [router]);

  /* ----------------------------------------------------
     Clear error helper
     ---------------------------------------------------- */
  const clearError = useCallback(() => setError(null), []);

  const value = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* -------------------------------------------------------
   useAuth Hook
   ------------------------------------------------------- */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>');
  }
  return ctx;
}
