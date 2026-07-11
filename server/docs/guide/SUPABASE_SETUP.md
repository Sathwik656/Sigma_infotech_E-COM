# Supabase Setup Guide — Sigma Infotech

This document provides step-by-step instructions for configuring your Supabase project to work with the authentication system.

> **Important**: Complete all steps in this guide before starting the backend server.

---

## Step 1 — Find Your API Keys

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project (`bjyizhdumadwgljwjyfc`)
3. Click **Project Settings** (gear icon in the left sidebar)
4. Click **API** under the "Configuration" section

You will find:
- **Project URL**: `https://bjyizhdumadwgljwjyfc.supabase.co` → use as `SUPABASE_URL`
- **anon / public key**: safe for clients → use as `SUPABASE_ANON_KEY`
- **service_role key**: secret, backend-only → use as `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ **Warning**: The `service_role` key bypasses Row Level Security. NEVER expose it to the browser or frontend code.

Copy these into your `server/.env` file.

---

## Step 2 — Enable Email/Password Authentication

1. In your Supabase dashboard, go to **Authentication** (in the left sidebar)
2. Click **Providers**
3. Find **Email** and make sure it is **enabled** (toggle it on)
4. Configure these settings:

| Setting | Recommended Value |
|---|---|
| Enable Email provider | ✅ Enabled |
| Confirm email | ❌ Disabled (for development) |
| Secure email change | ✅ Enabled |
| Enable manual linking | ❌ Disabled |

> **About email confirmation**: By default, Supabase requires users to click a confirmation link in their email before they can log in. For development, you should **disable** this to make testing easier. Re-enable it for production.

---

## Step 3 — Disable Email Confirmation (Development Only)

1. Go to **Authentication** → **Email Templates** (or **Settings**)
2. Navigate to **Authentication** → **General**  (or the top-level Auth settings)
3. Find **"Confirm email"** or **"Enable email confirmations"**
4. **Toggle it OFF** for development

> ℹ️ For production, you should keep email confirmation **ON** and configure your SMTP settings so real emails are sent.

---

## Step 4 — Configure Redirect URLs

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your frontend URL:
   - Development: `http://localhost:3000`
   - Production: `https://your-domain.com`
3. Under **Redirect URLs**, add:
   ```
   http://localhost:3000/**
   http://localhost:3000/login
   http://localhost:3000/register
   ```
4. Click **Save**

---

## Step 5 — Row Level Security (RLS)

By default, Supabase enables RLS on all tables. Our authentication system uses only the built-in `auth.users` table managed by Supabase — **no custom tables are required for basic auth**.

If you later add custom user profile tables (e.g., `profiles`), apply these policies:

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Allow profile creation on registration (via service role)
CREATE POLICY "Service role can insert profiles"
ON profiles FOR INSERT
WITH CHECK (true);
```

Run these in **Supabase Dashboard → SQL Editor**.

---

## Step 6 — SMTP Configuration (Production)

For production email sending:

1. Go to **Project Settings** → **Authentication** → **SMTP Settings**
2. Enable **Custom SMTP**
3. Enter your SMTP provider details (e.g., Resend, SendGrid, Postmark)

---

## Environment Variables Reference

| Variable | Where to Find | Used In |
|---|---|---|
| `SUPABASE_URL` | Project Settings → API → Project URL | Backend: Supabase clients |
| `SUPABASE_ANON_KEY` | Project Settings → API → anon/public | Backend: `supabaseAnon` client |
| `SUPABASE_SERVICE_ROLE_KEY` | Project Settings → API → service_role | Backend: `supabaseAdmin` client |
| `PORT` | You set this (e.g., `5000`) | Backend: HTTP server port |
| `CLIENT_URL` | Your frontend URL (`http://localhost:3000`) | Backend: CORS origin |
| `NODE_ENV` | `development` or `production` | Backend: logging, error messages |

---

## Testing the Authentication Flow

After setup, test using curl or a REST client (e.g., Postman, Insomnia):

### 1. Register a user
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"test123"}'
```

### 2. Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```
Copy the `access_token` from the response.

### 3. Access a protected route
```bash
curl http://localhost:5000/api/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 4. Get current user
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

### 5. Logout
```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Common Errors & Solutions

| Error | Cause | Solution |
|---|---|---|
| `Invalid login credentials` | Wrong email/password, or email not confirmed | Check credentials; disable email confirmation in dashboard for dev |
| `Email not confirmed` | User hasn't clicked confirmation link | Disable email confirmation in Auth settings, or confirm the email manually in the dashboard |
| `User already registered` | Email already in use | Use a different email or check existing users in Auth → Users |
| `Missing required environment variables` | `.env` is incomplete | Check all values in `.env` against `.env.example` |
| `TypeError: fetch failed` | Backend can't reach Supabase URL | Check `SUPABASE_URL` is correct (no trailing slash) |
| `JWT expired` | Access token is older than 1 hour | Use the refresh endpoint `POST /api/auth/refresh` |
| CORS error in browser | Frontend URL not in allowed origins | Make sure `CLIENT_URL` in `.env` matches the exact frontend URL |
| `Invalid API key` | Wrong anon or service role key | Re-copy keys from Supabase dashboard |

---

## Security Best Practices

1. **Never commit `.env`** — it's in `.gitignore`. Use `.env.example` for documentation.
2. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** to the frontend. This key bypasses all RLS.
3. **Always use HTTPS in production** — Supabase requires it for auth redirects.
4. **Enable email confirmation in production** — prevents fake accounts.
5. **Rate limiting is configured** — 20 requests per 15 minutes per IP on auth routes.
6. **Use strong passwords** — the API enforces min 6 characters with at least 1 letter and 1 number.
7. **Rotate your service role key** periodically via Supabase Dashboard → Project Settings → API → Regenerate.

---

## Manually Managing Users (Dashboard)

- View all registered users: **Authentication** → **Users**
- Manually confirm a user's email: Click the user → **Confirm email**
- Delete a test user: Click the user → **Delete user**
- Reset a user's password: Click the user → **Send password reset**
