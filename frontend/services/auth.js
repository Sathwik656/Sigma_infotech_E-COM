import axiosInstance from '../lib/axios';

/**
 * Auth API Service
 *
 * All authentication-related API calls go through this module.
 * Components and contexts should NEVER call axiosInstance directly.
 */

/**
 * Register a new user.
 * @param {{ name: string, email: string, password: string }} data
 */
export async function register(data) {
  const response = await axiosInstance.post('/api/auth/register', data);
  return response.data;
}

/**
 * Log in a user and return tokens + user data.
 * @param {{ email: string, password: string }} data
 */
export async function login(data) {
  const response = await axiosInstance.post('/api/auth/login', data);
  return response.data;
}

/**
 * Log out the current user (invalidates server-side session).
 */
export async function logout() {
  const response = await axiosInstance.post('/api/auth/logout');
  return response.data;
}

/**
 * Get the currently authenticated user.
 * Requires a valid Bearer token (injected automatically by axiosInstance).
 */
export async function getMe() {
  const response = await axiosInstance.get('/api/auth/me');
  return response.data;
}

/**
 * Refresh the access token using the stored refresh token.
 * @param {string} refreshToken
 */
export async function refreshToken(refreshToken) {
  const response = await axiosInstance.post('/api/auth/refresh', {
    refresh_token: refreshToken,
  });
  return response.data;
}
