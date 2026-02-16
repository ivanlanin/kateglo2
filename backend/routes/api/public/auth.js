/**
 * @fileoverview Endpoint autentikasi user frontend publik
 */

const express = require('express');
const { authenticate } = require('../../../middleware/auth');

const router = express.Router();

router.get('/me', authenticate, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user.sub,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      role: req.user.role,
      provider: req.user.provider,
    },
  });
});

module.exports = router;
