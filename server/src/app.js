'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');

const { CLIENT_URL, NODE_ENV } = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const profileRoutes = require('./routes/profile.routes');
const productRoutes = require('./routes/product.routes');
const addressRoutes = require('./routes/address.routes');
const brandRoutes = require('./routes/brand.routes');
const categoryRoutes = require('./routes/category.routes');
const inventoryRoutes = require('./routes/inventory.routes');
const cartRoutes = require('./routes/cart.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const shipmentRoutes = require('./routes/shipment.routes');
const adminRoutes = require('./routes/admin.routes');
const { errorHandler, notFound } = require('./middleware/error.middleware');

const app = express();

/* -------------------------------------------------------
   Security Headers — Helmet
   ------------------------------------------------------- */
app.use(helmet());

/* -------------------------------------------------------
   CORS — Only allow requests from the frontend origin
   ------------------------------------------------------- */
app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

/* -------------------------------------------------------
   HTTP Request Logging — Morgan
   ------------------------------------------------------- */
app.use(morgan(NODE_ENV === 'development' ? 'dev' : 'combined'));

/* -------------------------------------------------------
   Body Parsing
   ------------------------------------------------------- */
// Raw body for Razorpay webhook signature verification (before JSON parser)
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use(cookieParser());

/* -------------------------------------------------------
   Rate Limiting — Protect auth endpoints from brute force
   ------------------------------------------------------- */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,                   // max 20 requests per window per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests. Please try again in 15 minutes.',
  },
});

app.use('/api/auth', authLimiter);

/* -------------------------------------------------------
   Health Check
   ------------------------------------------------------- */
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'ok', timestamp: new Date().toISOString() });
});

/* -------------------------------------------------------
   API Routes
   ------------------------------------------------------- */
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/products', productRoutes);
app.use('/api/addresses', addressRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/admin', adminRoutes);

/* -------------------------------------------------------
   Error Handling (must be last)
   ------------------------------------------------------- */
app.use(notFound);
app.use(errorHandler);

module.exports = app;
