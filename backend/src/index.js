import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';

import { authenticate } from './middleware/auth.js';
import authRoutes from './routes/auth.js';
import productRoutes from './routes/products.js';
import cartRoutes from './routes/cart.js';
import orderRoutes from './routes/orders.js';
import supportRoutes from './routes/support.js';
import livekitRoutes from './routes/livekit.js';
import pool from './config/db.js';

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// GLOBAL MIDDLEWARE
// ============================================

// Security headers
app.use(helmet());

// CORS — only allow frontend origin
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON bodies (limit size to prevent abuse)
app.use(express.json({ limit: '10kb' }));

// HTTP request logging
app.use(morgan('dev'));

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', async (req, res) => {
  try {
    const dbResult = await pool.query('SELECT NOW()');
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      dbTime: dbResult.rows[0].now,
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      database: 'disconnected',
      error: error.message,
    });
  }
});

// ============================================
// ROUTES
// ============================================

// Auth routes (register & login are public, /me is protected)
app.use('/api/auth', (req, res, next) => {
  // /me route requires auth, register and login don't
  if (req.path === '/me') {
    return authenticate(req, res, next);
  }
  next();
}, authRoutes);

// Protected routes — all require authentication
app.use('/api/products', authenticate, productRoutes);
app.use('/api/cart', authenticate, cartRoutes);
app.use('/api/orders', authenticate, orderRoutes);
app.use('/api/support', authenticate, supportRoutes);
app.use('/api/livekit', authenticate, livekitRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error.'
      : err.message,
  });
});

// ============================================
// START SERVER
// ============================================
app.listen(PORT, () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║     🛒 ShopVault API Server             ║
  ║     Running on http://localhost:${PORT}    ║
  ║     Environment: ${process.env.NODE_ENV || 'development'}        ║
  ╚══════════════════════════════════════════╝
  `);
});

export default app;
