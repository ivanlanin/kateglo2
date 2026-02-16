/**
 * @fileoverview Middleware autentikasi JWT
 */

const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const [scheme, token] = authHeader.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Token autentikasi tidak ditemukan',
    });
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    return res.status(503).json({
      success: false,
      message: 'Konfigurasi autentikasi belum lengkap',
    });
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = payload;
    return next();
  } catch (_error) {
    return res.status(401).json({
      success: false,
      message: 'Token tidak valid atau kedaluwarsa',
    });
  }
}

module.exports = {
  authenticate,
};
