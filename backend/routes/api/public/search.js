const express = require('express');
const { searchDictionary } = require('../../../services/publicDictionaryService');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const { q = '', limit = '20', type = 'dictionary' } = req.query;

    if (type !== 'dictionary') {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Only type=dictionary is supported for now'
      });
    }

    const results = await searchDictionary(q, limit);
    return res.json({
      query: q,
      type,
      count: results.length,
      data: results
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
