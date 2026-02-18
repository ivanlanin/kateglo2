/**
 * @fileoverview Main entry point for Kateglo API Server
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const routes = require('./routes');
const authRoutes = require('./routes/auth');
const { pasangFrontendRuntime } = require('./services/layananSsrRuntime');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const logger = require('./config/logger');

const app = express();
const PORT = process.env.PORT || 3000;
const trustProxy = (process.env.TRUST_PROXY || 'true') === 'true';
const enableHelmetCsp = (process.env.HELMET_ENABLE_CSP || 'false') === 'true';
const isProduction = process.env.NODE_ENV === 'production';

const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

if (!isProduction && !allowedOrigins.includes('http://localhost:3000')) {
  allowedOrigins.push('http://localhost:3000');
}

const requireOrigin = (process.env.API_REQUIRE_ORIGIN || 'true') === 'true';
const requireFrontendKey = (process.env.API_REQUIRE_FRONTEND_KEY || 'false') === 'true';
const frontendSharedKey = process.env.FRONTEND_SHARED_KEY || '';

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) {
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
app.set('trust proxy', trustProxy);
app.use(helmet({
  contentSecurityPolicy: enableHelmetCsp,
}));
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));
app.use(compression()); // Gzip compression
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', (req, res, next) => {
  const origin = req.get('origin');
  const requestFrontendKey = req.get('x-frontend-key');
  const bypassFrontendKeyForLocalSsr = !isProduction && origin === 'http://localhost:3000';

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

  if (requireFrontendKey && !bypassFrontendKeyForLocalSsr) {
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
  const startTime = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startTime;
    logger.info('HTTP request', {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      ip: req.ip,
      origin: req.get('origin') || null,
      userAgent: req.get('user-agent') || null,
      durationMs,
    });
  });

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
app.use('/auth', authRoutes);
app.use('/api', routes);
pasangFrontendRuntime(app);

// Error handlers
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Kateglo API running on port ${PORT}`);
  logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🌐 Trust proxy: ${trustProxy}`);
  logger.info(`🔐 Allowed origins: ${allowedOrigins.join(', ')}`);
  logger.info(`🧩 Frontend key required: ${requireFrontendKey}`);
  logger.info(`🗄️  Database: ${process.env.DATABASE_URL ? 'Connected' : 'Not configured'}`);
});

module.exports = app;
