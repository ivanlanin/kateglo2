/**
 * @fileoverview Route redaksi untuk audit kata dari makna
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/otorisasi');
const ModelAuditMakna = require('../../../models/audit/modelAuditMakna');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseIdParam,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();
const statusValid = ['tinjau', 'salah', 'tambah', 'nama'];

router.get('/', periksaIzin('audit_makna'), async (req, res, next) => {
  try {
    const { limit, offset } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const status = parseTrimmedString(req.query.status).toLowerCase();

    const { data, total } = await ModelAuditMakna.daftarAdmin({
      limit,
      offset,
      q,
      status: statusValid.includes(status) ? status : '',
    });

    return res.json({ success: true, ...buildPaginatedResult({ data, total, pagination: { limit, offset } }) });
  } catch (error) {
    return next(error);
  }
});

router.put('/:id', periksaIzin('audit_makna'), async (req, res, next) => {
  try {
    const id = parseIdParam(req.params.id);
    const status = parseTrimmedString(req.body?.status).toLowerCase();
    const catatan = parseTrimmedString(req.body?.catatan);

    if (!statusValid.includes(status)) {
      return res.status(400).json({ success: false, message: 'Status tidak valid' });
    }

    const data = await ModelAuditMakna.simpanStatus({ id, status, catatan });
    if (!data) {
      return res.status(404).json({ success: false, message: 'Data audit tidak ditemukan' });
    }

    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
