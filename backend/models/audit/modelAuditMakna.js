/**
 * @fileoverview Model untuk audit indeks dari makna yang belum ada di entri
 */

const db = require('../../db');
const { parseCount } = require('../../utils/modelUtils');

const SQL_CREATED_AT = "to_char(a.created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at";
const SQL_UPDATED_AT = "to_char(a.updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at";
const STATUS_VALID = ['tinjau', 'salah', 'tambah', 'nama'];

function parsePositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 1) return fallback;
  return parsed;
}

function parseNonNegativeInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed < 0) return fallback;
  return parsed;
}

function normalizeStatus(value) {
  const normalized = String(value || '').trim().toLowerCase();
  if (STATUS_VALID.includes(normalized)) return normalized;
  return '';
}

class ModelAuditMakna {
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM audit_makna');
    return parseCount(result.rows[0]?.total);
  }

  static async daftarAdmin({ limit = 50, offset = 0, q = '', status = '' } = {}) {
    const cappedLimit = Math.min(parsePositiveInteger(limit, 50), 200);
    const safeOffset = parseNonNegativeInteger(offset, 0);
    const trimmedQ = String(q || '').trim();
    const normalizedStatus = normalizeStatus(status);

    const params = [];
    const where = [];
    let idx = 1;

    if (trimmedQ) {
      where.push(`(a.indeks ILIKE $${idx})`);
      params.push(`%${trimmedQ}%`);
      idx += 1;
    }

    if (normalizedStatus) {
      where.push(`a.status = $${idx}`);
      params.push(normalizedStatus);
      idx += 1;
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM audit_makna a
       ${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `SELECT a.id, a.indeks, a.jumlah, a.entri_id, a.makna_id, a.status, a.catatan,
              ${SQL_CREATED_AT}, ${SQL_UPDATED_AT},
              e.entri AS entri_sumber,
              m.makna AS makna_sumber
       FROM audit_makna a
       LEFT JOIN entri e ON e.id = a.entri_id
       LEFT JOIN makna m ON m.id = a.makna_id
       ${whereSql}
       ORDER BY a.jumlah DESC, a.indeks ASC, a.id ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, cappedLimit, safeOffset]
    );

    return {
      data: dataResult.rows,
      total: parseCount(countResult.rows[0]?.total),
    };
  }

  static async simpanStatus({ id, status, catatan }) {
    const normalizedStatus = normalizeStatus(status);
    if (!normalizedStatus) return null;

    const result = await db.query(
      `UPDATE audit_makna
       SET status = $1,
           catatan = NULLIF(TRIM($2), '')
       WHERE id = $3
      RETURNING id, indeks, jumlah, entri_id, makna_id, status, catatan,
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at,
                 to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at`,
      [normalizedStatus, String(catatan ?? ''), id]
    );

    return result.rows[0] || null;
  }
}

module.exports = ModelAuditMakna;
module.exports.__private = {
  parsePositiveInteger,
  parseNonNegativeInteger,
  normalizeStatus,
};

