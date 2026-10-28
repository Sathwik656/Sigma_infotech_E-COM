# Sigma Infotech — E-Commerce Platform

> **Buy certified used laptops, desktops, and printers with expert repair & upgrade service — Mangalore, Pumpwell Circle.**

A full-stack e-commerce web application built for Sigma Infotech, featuring a customer-facing storefront, admin dashboard, cart & checkout flow, Razorpay payment integration, and Cloudinary image management.

---

## 🗂️ Repository Structure

```
Sigma_infotech/
├── frontend/          # Next.js 16 customer & admin UI
└── server/            # Express.js REST API backend
```

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|---|---|
| **Next.js 16** | React framework with App Router |
| **React 19** | UI rendering |
| **React Hook Form + Zod** | Form validation |
| **Supabase JS** | Auth token management |
| **Axios** | HTTP client for API calls |
| **Vanilla CSS** | Custom styling & animations |

### Backend
| Technology | Purpose |
|---|---|
| **Express.js 5** | HTTP server framework |
| **Supabase** | Authentication & PostgreSQL database |
| **Razorpay** | Payment gateway integration |
| **Cloudinary** | Image upload & storage |
| **Multer** | Multipart file handling |
| **Bcryptjs** | Password hashing |
| **JWT** | Stateless auth tokens |
| **Nodemailer** | Transactional email |
| **Helmet** | Security HTTP headers |
| **Morgan** | HTTP request logging |
| **express-rate-limit** | Brute-force protection |
| **express-validator** | Request validation |

---

## ✨ Features

### Customer Storefront
- 🏠 **Home page** — hero section, featured categories, product highlights
- 🛍️ **Shop page** — product listing with filters, search, and pagination
- 📦 **Product detail** — images, specs, inventory status
- 🛒 **Cart** — add/remove/update quantities, persistent session
- 💳 **Checkout** — address selection, Razorpay payment flow
- 👤 **Profile** — personal details management
- 📍 **Addresses** — CRUD saved delivery addresses
- 📋 **Orders** — order history and status tracking
- 🔐 **Auth** — register, login, logout, token refresh

### Admin Dashboard
- 📊 **Dashboard** — sales overview & key metrics
- 📦 **Products** — create, edit, delete products with image upload
- 🏷️ **Categories & Brands** — manage taxonomy
- 📁 **Inventory** — stock level management
- 🧾 **Orders** — view & update order statuses
- 💰 **Payments** — payment records & reconciliation
- 🚚 **Shipments** — delivery tracking
- 👥 **Customers** — user management

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- npm ≥ 9
- A [Supabase](https://supabase.com) project
- A [Razorpay](https://razorpay.com) account
- A [Cloudinary](https://cloudinary.com) account

---

### 1. Clone the repository

```bash
git clone <repo-url>
cd Sigma_infotech
```

---

### 2. Backend Setup

```bash
cd server
npm install
```

Create your `.env` file:

```bash
copy .env.example .env    # Windows
# cp .env.example .env   # macOS/Linux
```

Fill in the required values:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000

# Razorpay
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=your-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

Start the development server:

```bash
npm run dev       # auto-restart via nodemon
# npm start       # production
```

Server runs at `http://localhost:5000`.

---

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create your `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
```

Start the development server:

```bash
npm run dev
```

Frontend runs at `http://localhost:3000`.

---

## 🔌 API Overview

All endpoints are prefixed with `/api`. Auth endpoints are **rate-limited** to 20 requests per 15 minutes per IP.

| Domain | Base Path | Auth Required |
|---|---|---|
| Authentication | `/api/auth` | Partial |
| Profile | `/api/profile` | ✅ |
| Products | `/api/products` | Partial |
| Categories | `/api/categories` | Partial |
| Brands | `/api/brands` | Partial |
| Inventory | `/api/inventory` | ✅ Admin |
| Cart | `/api/cart` | ✅ |
| Orders | `/api/orders` | ✅ |
| Payments | `/api/payments` | ✅ |
| Shipments | `/api/shipments` | ✅ |
| Addresses | `/api/addresses` | ✅ |
| Admin | `/api/admin` | ✅ Admin |

**Health check:**
```
GET /health  →  { "success": true, "status": "ok", "timestamp": "..." }
```

For detailed endpoint documentation, see [`server/README.md`](./server/README.md).

---

## 🔐 Authentication Flow

```
1. User submits login/register form
2. Frontend sends credentials → POST /api/auth/login
3. Backend validates with Supabase signInWithPassword()
4. Server returns { access_token, refresh_token, user }
5. Frontend stores tokens & sets auth context
6. Subsequent requests include: Authorization: Bearer <access_token>
7. Middleware verifies token via supabaseAdmin.auth.getUser()
8. req.user is attached for all protected routes
9. On logout → POST /api/auth/logout clears Supabase session
```

---

## 📁 Project Structure

```
frontend/
├── app/
│   ├── page.js             # Home page
│   ├── layout.js           # Root layout (Header, Footer, Providers)
│   ├── shop/               # Product listing page
│   ├── product/            # Product detail page
│   ├── cart/               # Shopping cart
│   ├── checkout/           # Checkout & payment
│   ├── orders/             # Order history
│   ├── profile/            # User profile
│   ├── addresses/          # Saved addresses
│   ├── auth/               # Auth callback handler
│   ├── login/              # Login page
│   ├── register/           # Register page
│   ├── contact/            # Contact page
│   └── admin/              # Admin dashboard & sub-pages
│       ├── dashboard/
│       ├── products/
│       ├── categories/
│       ├── brands/
│       ├── inventory/
│       ├── orders/
│       ├── payments/
│       ├── shipments/
│       └── customers/
├── components/             # Shared UI components
│   ├── Header.js
│   ├── Footer.js
│   ├── ProductCard.js
│   ├── CategoryCard.js
│   ├── Toast.js
│   └── ScrollProgress.js
├── context/                # React context providers
│   ├── AuthContext.js
│   └── CartContext.js
├── hooks/                  # Custom React hooks
├── services/               # API service functions (Axios)
├── lib/                    # Utility libraries
└── styles/                 # Global CSS

server/
├── src/
│   ├── config/
│   │   ├── env.js          # Env validation & export
│   │   ├── supabase.js     # Supabase client setup
│   │   ├── cloudinary.js   # Cloudinary configuration
│   │   └── razorpay.js     # Razorpay configuration
│   ├── controllers/        # Route handler functions (12 modules)
│   ├── middleware/
│   │   ├── auth.middleware.js      # JWT verification
│   │   ├── error.middleware.js     # Centralized error handling
│   │   └── validate.middleware.js  # express-validator wrapper
│   ├── routes/             # Express routers (12 modules)
│   ├── services/           # Business logic & Supabase queries
│   ├── utils/              # Helper utilities
│   ├── app.js              # Express app configuration
│   └── server.js           # Entry point
└── api/                    # Vercel serverless entry
```

---

## 🌐 Deployment

| Service | Platform |
|---|---|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Vercel](https://vercel.com) (serverless via `vercel.json`) |
| Database | [Supabase](https://supabase.com) |
| Images | [Cloudinary](https://cloudinary.com) |
| Payments | [Razorpay](https://razorpay.com) |

### Live URLs
- Frontend: `https://sigma-infotech-e-com.vercel.app`
- Backend: `https://sigma-infotech-e-commerce.vercel.app`

---

## 📜 License

ISC © Sigma Infotech, Mangalore
