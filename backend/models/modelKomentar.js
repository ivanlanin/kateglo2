/**
 * @fileoverview Model untuk komentar pada halaman kamus per indeks
 */

const db = require('../db');
const { normalizeBoolean: normalizeBooleanValue, parseCount } = require('../utils/modelUtils');

const SQL_CREATED_AT = "to_char(k.created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at";
const SQL_UPDATED_AT = "to_char(k.updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at";
const SQL_CREATED_AT_RETURNING = "to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at";
const SQL_UPDATED_AT_RETURNING = "to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at";

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

function normalizeBoolean(value) {
  return normalizeBooleanValue(value, false);
}

class ModelKomentar {
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM komentar_kamus');
    return parseCount(result.rows[0]?.total);
  }

  static async hitungKomentarAktif(indeks) {
    const result = await db.query(
      `SELECT COUNT(*) AS total
       FROM komentar_kamus
       WHERE LOWER(indeks) = LOWER($1) AND aktif = TRUE`,
      [indeks]
    );
    return parseCount(result.rows[0]?.total);
  }

  static async ambilKomentarTerbaca(indeks, penggunaId) {
    const result = await db.query(
      `SELECT k.id, k.indeks, k.komentar, k.aktif, ${SQL_CREATED_AT}, ${SQL_UPDATED_AT},
              k.pengguna_id, p.nama AS pengguna_nama
       FROM komentar_kamus k
       JOIN pengguna p ON p.id = k.pengguna_id
       WHERE LOWER(k.indeks) = LOWER($1)
         AND (k.aktif = TRUE OR k.pengguna_id = $2)
       ORDER BY k.updated_at DESC, k.id DESC`,
      [indeks, penggunaId]
    );
    return result.rows;
  }

  static async upsertKomentarPengguna({ indeks, penggunaId, komentar }) {
    const result = await db.query(
      `INSERT INTO komentar_kamus (indeks, pengguna_id, komentar, aktif)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (indeks, pengguna_id) DO UPDATE SET
         komentar = EXCLUDED.komentar
       RETURNING id, indeks, pengguna_id, komentar, aktif,
                 ${SQL_CREATED_AT_RETURNING}, ${SQL_UPDATED_AT_RETURNING}`,
      [indeks, penggunaId, komentar]
    );
    return result.rows[0] || null;
  }

  static async daftarAdmin({ limit = 50, offset = 0, q = '' } = {}) {
    const cappedLimit = Math.min(parsePositiveInteger(limit, 50), 200);
    const safeOffset = parseNonNegativeInteger(offset, 0);
    const trimmedQ = String(q || '').trim();

    const params = [];
    const where = [];
    let idx = 1;

    if (trimmedQ) {
      where.push(`(k.indeks ILIKE $${idx} OR k.komentar ILIKE $${idx} OR p.nama ILIKE $${idx} OR p.surel ILIKE $${idx})`);
      params.push(`%${trimmedQ}%`);
      idx += 1;
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM komentar_kamus k
       JOIN pengguna p ON p.id = k.pengguna_id
       ${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `SELECT k.id, k.indeks, k.pengguna_id, k.komentar, k.aktif, ${SQL_CREATED_AT}, ${SQL_UPDATED_AT},
              p.nama AS pengguna_nama, p.surel AS pengguna_surel
       FROM komentar_kamus k
       JOIN pengguna p ON p.id = k.pengguna_id
       ${whereSql}
       ORDER BY k.updated_at DESC, k.id DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, cappedLimit, safeOffset]
    );

    return {
      data: dataResult.rows,
      total: parseCount(countResult.rows[0]?.total),
    };
  }

  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT k.id, k.indeks, k.pengguna_id, k.komentar, k.aktif, ${SQL_CREATED_AT}, ${SQL_UPDATED_AT},
              p.nama AS pengguna_nama, p.surel AS pengguna_surel
       FROM komentar_kamus k
       JOIN pengguna p ON p.id = k.pengguna_id
       WHERE k.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async simpanAdmin({ id, komentar, aktif }) {
    const result = await db.query(
      `UPDATE komentar_kamus
       SET komentar = $1,
           aktif = $2
       WHERE id = $3
       RETURNING id, indeks, pengguna_id, komentar, aktif,
                 ${SQL_CREATED_AT_RETURNING}, ${SQL_UPDATED_AT_RETURNING}`,
      [komentar, normalizeBoolean(aktif), id]
    );
    return result.rows[0] || null;
  }
}

module.exports = ModelKomentar;
module.exports.__private = {
  parsePositiveInteger,
  parseNonNegativeInteger,
  normalizeBoolean,
};
