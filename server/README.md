# Sigma Infotech — Backend API

Production-ready Express.js REST API with Supabase Authentication.

---

## Tech Stack

| Package | Purpose |
|---|---|
| `express` | HTTP server framework |
| `@supabase/supabase-js` | Supabase SDK (auth + DB) |
| `dotenv` | Environment variable loading |
| `cors` | Cross-origin resource sharing |
| `helmet` | Security headers |
| `morgan` | HTTP request logger |
| `cookie-parser` | Cookie parsing middleware |
| `express-validator` | Request validation |
| `express-rate-limit` | Rate limiting (brute-force protection) |
| `nodemon` | Development auto-restart |

---

## Folder Structure

```
server/
├── src/
│   ├── config/
│   │   ├── env.js            # Env var loader + validation
│   │   └── supabase.js       # Supabase client initialization
│   │
│   ├── controllers/
│   │   └── auth.controller.js  # Request handlers (thin layer)
│   │
│   ├── middleware/
│   │   ├── auth.middleware.js    # JWT verification
│   │   ├── error.middleware.js   # Centralized error handling
│   │   └── validate.middleware.js # express-validator wrapper
│   │
│   ├── routes/
│   │   ├── auth.routes.js     # Auth endpoints + validation rules
│   │   └── profile.routes.js  # Protected route example
│   │
│   ├── services/
│   │   └── auth.service.js    # Business logic + Supabase calls
│   │
│   ├── app.js                 # Express app setup
│   └── server.js              # Entry point
│
├── .env                       # Local secrets (never commit)
├── .env.example               # Template for required variables
├── package.json
├── README.md
└── SUPABASE_SETUP.md
```

---

## Environment Setup

1. Copy the template:
   ```bash
   copy .env.example .env
   ```

2. Fill in your values from [Supabase Dashboard → Project Settings → API](https://supabase.com/dashboard):
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   CLIENT_URL=http://localhost:3000
   PORT=5000
   NODE_ENV=development
   ```

See `SUPABASE_SETUP.md` for a full step-by-step guide.

---

## Installation

```bash
cd server
npm install
```

## Running

```bash
# Development (auto-restart on file changes)
npm run dev

# Production
npm start
```

The server starts at `http://localhost:5000`.

---

## API Endpoints

### Health Check

```
GET /health
```

**Response:**
```json
{ "success": true, "status": "ok", "timestamp": "2026-01-01T00:00:00.000Z" }
```

---

### Authentication

All auth endpoints are prefixed with `/api/auth`.

**Rate limit:** 20 requests per 15 minutes per IP.

---

#### Register

```
POST /api/auth/register
```

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "pass123"
}
```

**Success (201):**
```json
{
  "success": true,
  "message": "Registration successful. You can now log in.",
  "requiresConfirmation": false,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe"
  }
}
```

**Validation Error (400):**
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    { "field": "password", "message": "Password must contain at least one number" }
  ]
}
```

**Conflict (409):**
```json
{ "success": false, "message": "An account with this email already exists." }
```

---

#### Login

```
POST /api/auth/login
```

**Body:**
```json
{
  "email": "john@example.com",
  "password": "pass123"
}
```

**Success (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-01T00:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "...",
  "expires_in": 3600
}
```

**Invalid credentials (401):**
```json
{ "success": false, "message": "Invalid email or password." }
```

---

#### Logout

```
POST /api/auth/logout
Authorization: Bearer <access_token>
```

**Success (200):**
```json
{ "success": true, "message": "Logged out successfully" }
```

---

#### Get Current User

```
GET /api/auth/me
Authorization: Bearer <access_token>
```

**Success (200):**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "john@example.com",
    "name": "John Doe",
    "createdAt": "2026-01-01T00:00:00.000Z",
    "emailConfirmed": true
  }
}
```

**Unauthorized (401):**
```json
{ "success": false, "message": "Access denied. Invalid or expired token." }
```

---

#### Refresh Token

```
POST /api/auth/refresh
```

**Body:**
```json
{ "refresh_token": "..." }
```

**Success (200):**
```json
{
  "success": true,
  "access_token": "new-token...",
  "refresh_token": "new-refresh...",
  "expires_in": 3600
}
```

---

### Protected Routes

#### Get Profile

```
GET /api/profile
Authorization: Bearer <access_token>
```

**Success (200):**
```json
{
  "success": true,
  "message": "Profile data retrieved successfully",
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "memberSince": "2026-01-01T00:00:00.000Z",
    "emailConfirmed": true
  }
}
```

---

## Authentication Flow

```
1. User submits register/login form on frontend
2. Frontend sends POST to /api/auth/login
3. Backend calls Supabase signInWithPassword()
4. Backend returns { access_token, refresh_token, user }
5. Frontend stores tokens in localStorage
6. Subsequent requests include Authorization: Bearer <access_token>
7. Backend auth.middleware verifies token via supabaseAdmin.auth.getUser()
8. req.user is attached for protected routes
9. On logout: POST /api/auth/logout clears session on Supabase
```
