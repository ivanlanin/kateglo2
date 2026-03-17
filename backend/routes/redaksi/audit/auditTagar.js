/**
 * @fileoverview Route redaksi untuk audit cakupan tagar pada entri
 */

const express = require('express');
const { periksaIzin } = require('../../../middleware/authorization');
const ModelTagar = require('../../../models/master/modelTagar');
const {
  buildPaginatedResult,
  parsePagination,
  parseSearchQuery,
  parseTrimmedString,
} = require('../../../utils/routesRedaksiUtils');

const router = express.Router();

/**
 * GET /api/redaksi/audit-tagar
 * Query:
 * - q
 * - tagar_id
 * - jenis
 * - punya_tagar ('' | '1' | '0')
 * - limit, cursor, direction, lastPage
 */
router.get('/', periksaIzin('audit_tagar'), async (req, res, next) => {
  try {
    const { limit, cursor, direction, lastPage } = parsePagination(req.query);
    const q = parseSearchQuery(req.query.q);
    const jenis = parseTrimmedString(req.query.jenis);
    const punyaTagar = parseTrimmedString(req.query.punya_tagar);
    const rawTagarId = parseTrimmedString(req.query.tagar_id);
    const tagarId = Number.parseInt(rawTagarId, 10);
    const tagarFilter = Number.isFinite(tagarId) && tagarId > 0 ? tagarId : null;

    const [result, cakupan] = await Promise.all([
      ModelTagar.daftarEntriTagarAdminCursor({
        limit,
        cursor,
        direction,
        lastPage,
        q,
        tagarId: tagarFilter,
        jenis,
        punyaTagar: ['0', '1'].includes(punyaTagar) ? punyaTagar : '',
      }),
      ModelTagar.hitungCakupan(),
    ]);

    const totalTurunan = Number(cakupan?.total_turunan || 0);
    const sudahBertagar = Number(cakupan?.sudah_bertagar || 0);
    const persentase = totalTurunan > 0
      ? Number(((sudahBertagar / totalTurunan) * 100).toFixed(1))
      : 0;

    return res.json({
      success: true,
      ...buildPaginatedResult({
        data: result.data,
        total: result.total,
        pagination: { limit },
        pageInfo: {
          hasPrev: result.hasPrev,
          hasNext: result.hasNext,
          prevCursor: result.prevCursor,
          nextCursor: result.nextCursor,
        },
      }),
      cakupan: {
        totalTurunan,
        sudahBertagar,
        persentase,
      },
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
