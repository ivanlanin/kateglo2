/**
 * @fileoverview Model untuk pengelolaan peran dan izin redaksi
 */

const db = require('../db');
const { parseCount } = require('../utils/modelUtils');

function normalizeIzinIds(izinIds) {
  if (!Array.isArray(izinIds)) return [];
  const ids = izinIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return Array.from(new Set(ids));
}

class ModelPeran {
  static async daftarPeran({ limit = 50, offset = 0, q = '' } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(
        p.kode ILIKE $${params.length}
        OR p.nama ILIKE $${params.length}
        OR COALESCE(p.keterangan, '') ILIKE $${params.length}
      )`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM peran p
       ${whereSql}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataParams = [...params, cappedLimit, safeOffset];
    const limitParamIdx = dataParams.length - 1;
    const offsetParamIdx = dataParams.length;

    const dataResult = await db.query(
      `SELECT
         p.id,
         p.kode,
         p.nama,
         p.keterangan,
         p.created_at,
         p.updated_at,
         (
           SELECT COUNT(*)::int
           FROM pengguna u
           WHERE u.peran_id = p.id
         ) AS jumlah_pengguna,
         (
           SELECT COUNT(*)::int
           FROM peran_izin pi
           WHERE pi.peran_id = p.id
         ) AS jumlah_izin,
         COALESCE((
           SELECT array_agg(i.kode ORDER BY i.kode)
           FROM peran_izin pi
           JOIN izin i ON i.id = pi.izin_id
           WHERE pi.peran_id = p.id
         ), ARRAY[]::text[]) AS izin_kode
       FROM peran p
       ${whereSql}
       ORDER BY p.id ASC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      dataParams
    );

    return { data: dataResult.rows, total };
  }

  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT
         p.id,
         p.kode,
         p.nama,
         p.keterangan,
         p.created_at,
         p.updated_at,
         COALESCE((
           SELECT array_agg(i.id ORDER BY i.id)
           FROM peran_izin pi
           JOIN izin i ON i.id = pi.izin_id
           WHERE pi.peran_id = p.id
         ), ARRAY[]::int[]) AS izin_ids,
         COALESCE((
           SELECT array_agg(i.kode ORDER BY i.kode)
           FROM peran_izin pi
           JOIN izin i ON i.id = pi.izin_id
           WHERE pi.peran_id = p.id
         ), ARRAY[]::text[]) AS izin_kode
       FROM peran p
       WHERE p.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async daftarIzin({ q = '' } = {}) {
    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(
        i.kode ILIKE $${params.length}
        OR i.nama ILIKE $${params.length}
        OR COALESCE(i.kelompok, '') ILIKE $${params.length}
      )`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT i.id, i.kode, i.nama, i.kelompok
       FROM izin i
       ${whereSql}
       ORDER BY COALESCE(i.kelompok, ''), i.nama, i.kode`,
      params
    );

    return result.rows;
  }

  static async simpan({ id, kode, nama, keterangan, izin_ids: izinIds = [] }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const izinIdNormalized = normalizeIzinIds(izinIds);

      const result = id
        ? await client.query(
          `UPDATE peran
           SET kode = $1,
               nama = $2,
               keterangan = NULLIF($3, '')
           WHERE id = $4
           RETURNING id`,
          [kode, nama, keterangan, id]
        )
        : await client.query(
          `INSERT INTO peran (kode, nama, keterangan)
           VALUES ($1, $2, NULLIF($3, ''))
           RETURNING id`,
          [kode, nama, keterangan]
        );

      const peranId = result.rows[0]?.id;
      if (!peranId) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('DELETE FROM peran_izin WHERE peran_id = $1', [peranId]);

      if (izinIdNormalized.length) {
        await client.query(
          `INSERT INTO peran_izin (peran_id, izin_id)
           SELECT $1, UNNEST($2::int[])`,
          [peranId, izinIdNormalized]
        );
      }

      await client.query('COMMIT');
      return this.ambilDenganId(peranId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ModelPeran;