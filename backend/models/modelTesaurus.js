/**
 * @fileoverview Model untuk tesaurus (sinonim, antonim, relasi kata)
 */

const db = require('../db');
const autocomplete = require('../db/autocomplete');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');
const { decodeCursor, encodeCursor } = require('../utils/cursorPagination');

function normalizeRelasiList(teks) {
  if (!teks) return null;
  const daftar = String(teks)
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (daftar.length === 0) return null;
  return daftar.join('; ');
}

class ModelTesaurus {
  static async autocomplete(query, limit = 8) {
    return autocomplete('tesaurus', 'indeks', query, { limit, extraWhere: 'aktif = TRUE' });
  }

  /**
   * Cari tesaurus berdasarkan kata
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
   * @returns {Promise<Array>} Daftar entri tesaurus
   */
  static async cari(query, limit = 100, offset = 0, hitungTotal = true) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const baseSql = `
      WITH hasil AS (
        SELECT id, indeks, sinonim, antonim,
               CASE WHEN LOWER(indeks) = LOWER($1) THEN 0
                    WHEN indeks ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas
        FROM tesaurus
        WHERE indeks ILIKE $3
          AND aktif = TRUE
          AND (sinonim IS NOT NULL OR antonim IS NOT NULL)
      )`;

    if (hitungTotal) {
      const countResult = await db.query(
        `${baseSql} SELECT COUNT(*) AS total FROM hasil`,
        [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`]
      );
      const total = parseCount(countResult.rows[0]?.total);

      if (total === 0) {
        return { data: [], total: 0, hasNext: false };
      }

      const dataResult = await db.query(
        `${baseSql}
      SELECT id, indeks, sinonim, antonim
       FROM hasil
       ORDER BY prioritas, indeks ASC
       LIMIT $4 OFFSET $5`,
        [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit, safeOffset]
      );

      return {
        data: dataResult.rows,
        total,
        hasNext: safeOffset + dataResult.rows.length < total,
      };
    }

    const dataResult = await db.query(
      `${baseSql}
      SELECT id, indeks, sinonim, antonim
       FROM hasil
       ORDER BY prioritas, indeks ASC
       LIMIT $4 OFFSET $5`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit + 1, safeOffset]
    );

    const hasNext = dataResult.rows.length > cappedLimit;
    const data = hasNext ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    const total = hasNext
      ? safeOffset + cappedLimit + 1
      : safeOffset + data.length;

    return { data, total, hasNext };
  }

  static async cariCursor(query, {
    limit = 100,
    cursor = null,
    direction = 'next',
    lastPage = false,
    hitungTotal = true,
  } = {}) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const cursorPayload = decodeCursor(cursor);
    const isPrev = direction === 'prev';
    const orderDesc = Boolean(lastPage || isPrev);

    const baseSql = `
      WITH hasil AS (
        SELECT id, indeks, sinonim, antonim,
               CASE WHEN LOWER(indeks) = LOWER($1) THEN 0
                    WHEN indeks ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas
        FROM tesaurus
        WHERE indeks ILIKE $3
          AND aktif = TRUE
          AND (sinonim IS NOT NULL OR antonim IS NOT NULL)
      )`;

    let total = 0;
    if (hitungTotal) {
      const countResult = await db.query(
        `${baseSql} SELECT COUNT(*) AS total FROM hasil`,
        [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`]
      );
      total = parseCount(countResult.rows[0]?.total);
      if (total === 0) {
        return {
          data: [],
          total: 0,
          hasNext: false,
          hasPrev: false,
          nextCursor: null,
          prevCursor: null,
        };
      }
    }

    const params = [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`];
    const whereCursor = [];
    if (cursorPayload && !lastPage) {
      params.push(
        Number(cursorPayload.prioritas) || 0,
        String(cursorPayload.indeks || ''),
        Number(cursorPayload.id) || 0
      );
      if (isPrev) {
        whereCursor.push(`(prioritas, indeks, id) < ($4, $5, $6)`);
      } else {
        whereCursor.push(`(prioritas, indeks, id) > ($4, $5, $6)`);
      }
    }

    const whereClause = whereCursor.length ? `WHERE ${whereCursor.join(' AND ')}` : '';
    params.push(cappedLimit + 1);

    const dataResult = await db.query(
      `${baseSql}
      SELECT id, indeks, sinonim, antonim, prioritas
      FROM hasil
      ${whereClause}
      ORDER BY prioritas ${orderDesc ? 'DESC' : 'ASC'}, indeks ${orderDesc ? 'DESC' : 'ASC'}, id ${orderDesc ? 'DESC' : 'ASC'}
      LIMIT $${params.length}`,
      params
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) {
      rows = rows.reverse();
    }

    const data = rows.map(({ prioritas: _prioritas, ...item }) => item);
    const first = rows[0];
    const last = rows[rows.length - 1];

    const prevCursor = first
      ? encodeCursor({ prioritas: first.prioritas, indeks: first.indeks, id: first.id })
      : null;
    const nextCursor = last
      ? encodeCursor({ prioritas: last.prioritas, indeks: last.indeks, id: last.id })
      : null;

    let hasPrev = false;
    let hasNext = false;

    if (lastPage) {
      hasNext = false;
      hasPrev = total > data.length;
    } else if (isPrev) {
      hasPrev = hasMore;
      hasNext = Boolean(cursorPayload);
    } else {
      hasPrev = Boolean(cursorPayload);
      hasNext = hasMore;
    }

    return {
      data,
      total,
      hasPrev,
      hasNext,
      prevCursor,
      nextCursor,
    };
  }

  /**
   * Ambil detail tesaurus untuk sebuah kata
   * @param {string} kata - Kata yang dicari
   * @returns {Promise<Object|null>} Data tesaurus lengkap
   */
  static async ambilDetail(kata) {
    const result = await db.query(
      `SELECT id, indeks, sinonim, antonim
       FROM tesaurus
       WHERE LOWER(indeks) = LOWER($1)
         AND aktif = TRUE
       LIMIT 1`,
      [kata]
    );
    return result.rows[0] || null;
  }

  /**
   * Daftar tesaurus untuk panel admin (dengan pencarian opsional)
   * @param {{ limit?: number, offset?: number, q?: string }} options
   * @returns {Promise<{ data: Array, total: number }>}
   */
  static async daftarAdmin({ limit = 50, offset = 0, q = '', aktif = '' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`indeks ILIKE $${idx}`);
      params.push(`%${q}%`);
      idx++;
    }

    if (aktif === '1') {
      conditions.push('aktif = TRUE');
    } else if (aktif === '0') {
      conditions.push('aktif = FALSE');
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM tesaurus ${where}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataResult = await db.query(
      `SELECT id, indeks, sinonim, antonim, aktif
       FROM tesaurus ${where}
       ORDER BY indeks ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  /**
   * Hitung total tesaurus
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM tesaurus');
    return parseCount(result.rows[0]?.total);
  }

  /**
   * Ambil tesaurus berdasarkan ID (untuk admin)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      'SELECT id, indeks, sinonim, antonim, aktif FROM tesaurus WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Simpan (insert atau update) tesaurus
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async simpan({ id, indeks, sinonim, antonim, aktif }) {
    const nilaiAktif = normalizeBoolean(aktif, true);
    const sinonimNorm = normalizeRelasiList(sinonim);
    const antonimNorm = normalizeRelasiList(antonim);

    if (id) {
      const result = await db.query(
        `UPDATE tesaurus SET indeks = $1, sinonim = $2, antonim = $3,
                aktif = $4
         WHERE id = $5 RETURNING *`,
        [indeks, sinonimNorm, antonimNorm, nilaiAktif, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO tesaurus (indeks, sinonim, antonim, aktif)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [indeks, sinonimNorm, antonimNorm, nilaiAktif]
    );
    return result.rows[0];
  }

  /**
   * Hapus tesaurus berdasarkan ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM tesaurus WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = ModelTesaurus;
module.exports.__private = {
  normalizeBoolean,
  normalizeRelasiList,
};
