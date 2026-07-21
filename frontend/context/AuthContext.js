'use client';

import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import * as authService from '../services/auth';
import api from '@/lib/axios';

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
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
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

      setUser(storedUser);

      try {
        const data = await authService.getMe();
        setUser(data.user);
        setProfile(data.user);
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
      } catch {
        clearSession();
        setUser(null);
        setProfile(null);
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
      const userData = data.user;
      saveSession(data.access_token, data.refresh_token, userData);
      setUser(userData);
      setProfile(userData);

      return { success: true, user: userData };
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
      // Best-effort
    } finally {
      clearSession();
      setUser(null);
      setProfile(null);
      router.push('/login');
    }
  }, [router]);

  /* ----------------------------------------------------
     Update Profile Action
     ---------------------------------------------------- */
  const updateProfile = useCallback(async (data) => {
    setError(null);
    try {
      const response = await api.patch('/api/profile', data);
      const updatedUser = response.data.user || response.data;
      setProfile(updatedUser);
      setUser(updatedUser);
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      return { success: true };
    } catch (err) {
      const message =
        err.response?.data?.message || err.message || 'Failed to update profile.';
      setError(message);
      return { success: false, message };
    }
  }, []);

  /* ----------------------------------------------------
     Refresh User — re-fetch from /api/auth/me
     ---------------------------------------------------- */
  const refreshUser = useCallback(async () => {
    try {
      const data = await authService.getMe();
      setUser(data.user);
      setProfile(data.user);
      localStorage.setItem(USER_KEY, JSON.stringify(data.user));
    } catch {
      clearSession();
      setUser(null);
      setProfile(null);
    }
  }, []);

  /* ----------------------------------------------------
     Clear error helper
     ---------------------------------------------------- */
  const clearError = useCallback(() => setError(null), []);

  const isAdmin = useMemo(() => user?.role === 'admin', [user]);

  const value = {
    user,
    profile,
    isAdmin,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
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
