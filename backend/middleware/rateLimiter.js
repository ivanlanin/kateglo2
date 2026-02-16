/**
 * @fileoverview Rate limiter untuk endpoint publik
 */

const rateLimit = require('express-rate-limit');

const DEFAULT_WINDOW_MS = 15 * 60 * 1000;
const DEFAULT_PUBLIC_MAX = 180;
const DEFAULT_SEARCH_MAX = 60;

const windowMs = Math.max(Number(process.env.RATE_LIMIT_WINDOW_MS) || DEFAULT_WINDOW_MS, 1000);
const legacyPublicMax = Number(process.env.RATE_LIMIT_MAX_REQUESTS);
const resolvedPublicMax = Number(process.env.RATE_LIMIT_PUBLIC_MAX)
  || (Number.isFinite(legacyPublicMax) ? legacyPublicMax : 0)
  || DEFAULT_PUBLIC_MAX;
const publicMax = Math.max(resolvedPublicMax, 1);
const searchMax = Math.max(Number(process.env.RATE_LIMIT_SEARCH_MAX) || DEFAULT_SEARCH_MAX, 1);

const rateLimitMessage = {
  success: false,
  error: 'Too Many Requests',
  message: 'Terlalu banyak permintaan. Coba lagi beberapa saat.',
};

const baseLimiterOptions = {
  standardHeaders: true,
  legacyHeaders: false,
  windowMs,
  keyGenerator: (req) => req.ip,
  message: rateLimitMessage,
};

const publicApiLimiter = rateLimit({
  ...baseLimiterOptions,
  max: publicMax,
});

const publicSearchLimiter = rateLimit({
  ...baseLimiterOptions,
  max: searchMax,
});

module.exports = {
  publicApiLimiter,
  publicSearchLimiter,
};
