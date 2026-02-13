/**
 * @fileoverview Error handling middleware
 */

const logger = require('../config/logger');

/**
 * 404 Not Found handler
 */
const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    path: req.path
  });
};

/**
 * Global error handler
 */
const errorHandler = (err, req, res, next) => {
  logger.error(err.message, { stack: err.stack });

  // Default error
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // Unique violation
        status = 409;
        message = 'Duplicate entry';
        break;
      case '23503': // Foreign key violation
        status = 400;
        message = 'Invalid reference';
        break;
      case '22P02': // Invalid text representation
        status = 400;
        message = 'Invalid input format';
        break;
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    status = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    status = 401;
    message = 'Token expired';
  }

  // Validation errors (Joi)
  if (err.isJoi) {
    status = 400;
    message = err.details.map(d => d.message).join(', ');
  }

  res.status(status).json({
    error: err.name || 'Error',
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = { notFoundHandler, errorHandler };
