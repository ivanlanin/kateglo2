/**
 * @fileoverview Route detail kamus publik
 */

const express = require('express');
const { ambilDetailKamus } = require('../../../services/layananKamusPublik');

const router = express.Router();

router.get('/:slug', async (req, res, next) => {
  try {
    const data = await ambilDetailKamus(req.params.slug);
    if (!data) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Entri tidak ditemukan',
      });
    }
    return res.json(data);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
