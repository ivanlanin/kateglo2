/**
 * @fileoverview Model untuk pengelolaan izin dan relasi peran
 */

const db = require('../db');
const { parseCount } = require('../utils/modelUtils');

function normalizePeranIds(peranIds) {
  if (!Array.isArray(peranIds)) return [];
  const ids = peranIds
    .map((id) => Number(id))
    .filter((id) => Number.isInteger(id) && id > 0);
  return Array.from(new Set(ids));
}

class ModelIzin {
  static async daftarIzin({ limit = 50, offset = 0, q = '' } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

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

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM izin i
       ${whereSql}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataParams = [...params, cappedLimit, safeOffset];
    const limitParamIdx = dataParams.length - 1;
    const offsetParamIdx = dataParams.length;

    const dataResult = await db.query(
      `SELECT
         i.id,
         i.kode,
         i.nama,
         i.kelompok,
         i.created_at,
         i.updated_at,
         (
           SELECT COUNT(*)::int
           FROM peran_izin pi
           WHERE pi.izin_id = i.id
         ) AS jumlah_peran,
         COALESCE((
           SELECT array_agg(p.kode ORDER BY p.kode)
           FROM peran_izin pi
           JOIN peran p ON p.id = pi.peran_id
           WHERE pi.izin_id = i.id
         ), ARRAY[]::text[]) AS peran_kode
       FROM izin i
       ${whereSql}
       ORDER BY i.id ASC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      dataParams
    );

    return { data: dataResult.rows, total };
  }

  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT
         i.id,
         i.kode,
         i.nama,
         i.kelompok,
         i.created_at,
         i.updated_at,
         COALESCE((
           SELECT array_agg(p.id ORDER BY p.id)
           FROM peran_izin pi
           JOIN peran p ON p.id = pi.peran_id
           WHERE pi.izin_id = i.id
         ), ARRAY[]::int[]) AS peran_ids,
         COALESCE((
           SELECT array_agg(p.kode ORDER BY p.kode)
           FROM peran_izin pi
           JOIN peran p ON p.id = pi.peran_id
           WHERE pi.izin_id = i.id
         ), ARRAY[]::text[]) AS peran_kode
       FROM izin i
       WHERE i.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async daftarPeran({ q = '' } = {}) {
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

    const result = await db.query(
      `SELECT p.id, p.kode, p.nama, p.keterangan
       FROM peran p
       ${whereSql}
       ORDER BY p.nama, p.kode`,
      params
    );

    return result.rows;
  }

  static async simpan({ id, kode, nama, kelompok, peran_ids: peranIds = [] }) {
    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const peranIdNormalized = normalizePeranIds(peranIds);

      const result = id
        ? await client.query(
          `UPDATE izin
           SET kode = $1,
               nama = $2,
               kelompok = NULLIF($3, '')
           WHERE id = $4
           RETURNING id`,
          [kode, nama, kelompok, id]
        )
        : await client.query(
          `INSERT INTO izin (kode, nama, kelompok)
           VALUES ($1, $2, NULLIF($3, ''))
           RETURNING id`,
          [kode, nama, kelompok]
        );

      const izinId = result.rows[0]?.id;
      if (!izinId) {
        await client.query('ROLLBACK');
        return null;
      }

      await client.query('DELETE FROM peran_izin WHERE izin_id = $1', [izinId]);

      if (peranIdNormalized.length) {
        await client.query(
          `INSERT INTO peran_izin (peran_id, izin_id)
           SELECT UNNEST($1::int[]), $2`,
          [peranIdNormalized, izinId]
        );
      }

      await client.query('COMMIT');
      return this.ambilDenganId(izinId);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ModelIzin;