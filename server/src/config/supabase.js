'use strict';

const { createClient } = require('@supabase/supabase-js');
const { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY } = require('./env');

/**
 * Public (anon) Supabase client.
 * Use for user-facing operations: signUp, signInWithPassword, etc.
 * Respects Row Level Security (RLS).
 */
const supabaseAnon = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

/**
 * Admin (service-role) Supabase client.
 * BYPASSES Row Level Security — use ONLY on the backend.
 * NEVER expose this client or its key to the frontend.
 */
const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
  },
});

module.exports = { supabaseAnon, supabaseAdmin };
