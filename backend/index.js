/**
 * @fileoverview Main entry point for Kateglo API Server
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const requireOrigin = (process.env.API_REQUIRE_ORIGIN || 'true') === 'true';
const requireFrontendKey = (process.env.API_REQUIRE_FRONTEND_KEY || 'false') === 'true';
const frontendSharedKey = process.env.FRONTEND_SHARED_KEY || '';

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
      if (requireOrigin) {
        return callback(new Error('CORS origin is required'));
      }
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    logger.warn(`Blocked CORS origin: ${origin}`);
    return callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Frontend-Key'],
};

// Middleware
app.use(helmet()); // Security headers
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression()); // Gzip compression
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  const requestFrontendKey = req.get('x-frontend-key');

  if (!origin && requireOrigin) {
    return res.status(403).json({
      success: false,
      message: 'Origin wajib untuk mengakses API',
    });
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({
      success: false,
      message: 'Origin tidak diizinkan',
    });
  }

  if (requireFrontendKey) {
    if (!frontendSharedKey) {
      logger.error('API_REQUIRE_FRONTEND_KEY aktif tetapi FRONTEND_SHARED_KEY belum diatur');
      return res.status(503).json({
        success: false,
        message: 'Konfigurasi keamanan API belum lengkap',
      });
    }

    if (!requestFrontendKey || requestFrontendKey !== frontendSharedKey) {
      return res.status(403).json({
        success: false,
        message: 'Frontend key tidak valid',
      });
    }
  }

  return next();
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// API Routes
app.use('/api', routes);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Kateglo API running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔐 Allowed origins: ${allowedOrigins.join(', ')}`);
  logger.info(`🧩 Frontend key required: ${requireFrontendKey}`);
  logger.info(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = app;
