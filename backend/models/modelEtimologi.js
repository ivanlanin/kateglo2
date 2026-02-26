/**
 * @fileoverview Model untuk etimologi redaksi
 */

const db = require('../db');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');

function normalizeIntegerNullable(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

class ModelEtimologi {
  static async cariEntriUntukTautan(query, { limit = 8 } = {}) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return [];

    const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
    const result = await db.query(
      `SELECT
         e.id,
         e.entri,
         e.indeks,
         e.homonim,
         e.lafal,
         e.jenis
       FROM entri e
       WHERE e.aktif = 1
         AND (e.entri ILIKE $1 OR e.indeks ILIKE $1)
       ORDER BY
         CASE WHEN LOWER(e.indeks) = LOWER($2) THEN 0
              WHEN e.indeks ILIKE $3 THEN 1
              WHEN e.entri ILIKE $3 THEN 2
              ELSE 3 END,
         e.indeks ASC,
         e.homonim ASC NULLS LAST,
         e.id ASC
       LIMIT $4`,
      [`%${trimmed}%`, trimmed, `${trimmed}%`, cappedLimit]
    );

    return result.rows;
  }

  static async daftarAdmin({ limit = 50, offset = 0, q = '', bahasa = '' } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(
        e.indeks ILIKE $${params.length}
        OR COALESCE(e.lafal, '') ILIKE $${params.length}
        OR COALESCE(e.bahasa, '') ILIKE $${params.length}
        OR COALESCE(e.kata_asal, '') ILIKE $${params.length}
        OR COALESCE(e.arti_asal, '') ILIKE $${params.length}
        OR COALESCE(e.sumber_isi, '') ILIKE $${params.length}
        OR COALESCE(en.entri, '') ILIKE $${params.length}
      )`);
    }

    if (bahasa === '__KOSONG__') {
      conditions.push("NULLIF(BTRIM(COALESCE(e.bahasa, '')), '') IS NULL");
    } else if (bahasa) {
      params.push(String(bahasa).trim());
      conditions.push(`LOWER(COALESCE(e.bahasa, '')) = LOWER($${params.length})`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM etimologi e
       LEFT JOIN entri en ON en.id = e.entri_id
       ${whereSql}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataParams = [...params, cappedLimit, safeOffset];
    const limitParamIdx = dataParams.length - 1;
    const offsetParamIdx = dataParams.length;

    const dataResult = await db.query(
      `SELECT
         e.id,
         e.indeks,
         e.homonim,
         e.lafal,
         e.bahasa,
         e.kata_asal,
         e.arti_asal,
         e.sumber,
         e.sumber_definisi,
         e.sumber_sitasi,
         e.sumber_isi,
         e.sumber_aksara,
         e.sumber_lihat,
         e.sumber_varian,
         e.entri_id,
         COALESCE(en.entri, '') AS entri_teks,
         en.indeks AS entri_indeks,
         en.homonim AS entri_homonim,
         e.aktif,
         e.created_at,
         e.updated_at
       FROM etimologi e
       LEFT JOIN entri en ON en.id = e.entri_id
       ${whereSql}
       ORDER BY e.indeks ASC, e.id ASC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      dataParams
    );

    return { data: dataResult.rows, total };
  }

  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT
         e.id,
         e.indeks,
         e.homonim,
         e.lafal,
         e.bahasa,
         e.kata_asal,
         e.arti_asal,
         e.sumber,
         e.sumber_definisi,
         e.sumber_sitasi,
         e.sumber_isi,
         e.sumber_aksara,
         e.sumber_lihat,
         e.sumber_varian,
         e.entri_id,
         COALESCE(en.entri, '') AS entri_teks,
         en.indeks AS entri_indeks,
         en.homonim AS entri_homonim,
         e.aktif,
         e.created_at,
         e.updated_at
       FROM etimologi e
       LEFT JOIN entri en ON en.id = e.entri_id
       WHERE e.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async simpan({
    id,
    indeks,
    homonim,
    lafal,
    bahasa,
    kata_asal,
    arti_asal,
    sumber,
    sumber_definisi,
    sumber_sitasi,
    sumber_isi,
    sumber_aksara,
    sumber_lihat,
    sumber_varian,
    entri_id,
    aktif,
  }) {
    const normalizedHomonim = normalizeIntegerNullable(homonim);
    const normalizedEntriId = normalizeIntegerNullable(entri_id);
    const normalizedAktif = normalizeBoolean(aktif);

    const result = id
      ? await db.query(
        `UPDATE etimologi
         SET indeks = $1,
             homonim = $2,
             lafal = NULLIF($3, ''),
             bahasa = NULLIF($4, ''),
             kata_asal = NULLIF($5, ''),
             arti_asal = NULLIF($6, ''),
             sumber = NULLIF($7, ''),
             sumber_definisi = NULLIF($8, ''),
             sumber_sitasi = NULLIF($9, ''),
             sumber_isi = NULLIF($10, ''),
             sumber_aksara = NULLIF($11, ''),
             sumber_lihat = NULLIF($12, ''),
             sumber_varian = NULLIF($13, ''),
             entri_id = $14,
             aktif = COALESCE($15, aktif),
             updated_at = NOW()
           WHERE id = $16
         RETURNING id`,
        [
          indeks,
          normalizedHomonim,
          lafal,
          bahasa,
          kata_asal,
          arti_asal,
          sumber,
          sumber_definisi,
          sumber_sitasi,
          sumber_isi,
          sumber_aksara,
          sumber_lihat,
          sumber_varian,
          normalizedEntriId,
          normalizedAktif,
          id,
        ]
      )
      : await db.query(
        `INSERT INTO etimologi (
           indeks,
           homonim,
           lafal,
           bahasa,
           kata_asal,
           arti_asal,
           sumber,
           sumber_definisi,
           sumber_sitasi,
           sumber_isi,
           sumber_aksara,
           sumber_lihat,
           sumber_varian,
           entri_id,
           aktif,
           created_at,
           updated_at
         )
         VALUES (
           $1,
           $2,
           NULLIF($3, ''),
           NULLIF($4, ''),
           NULLIF($5, ''),
           NULLIF($6, ''),
           NULLIF($7, ''),
           NULLIF($8, ''),
           NULLIF($9, ''),
           NULLIF($10, ''),
           NULLIF($11, ''),
           NULLIF($12, ''),
           NULLIF($13, ''),
           $14,
           COALESCE($15, FALSE),
           NOW(),
           NOW()
         )
         RETURNING id`,
        [
          indeks,
          normalizedHomonim,
          lafal,
          bahasa,
          kata_asal,
          arti_asal,
          sumber,
          sumber_definisi,
          sumber_sitasi,
          sumber_isi,
          sumber_aksara,
          sumber_lihat,
          sumber_varian,
          normalizedEntriId,
          normalizedAktif,
        ]
      );

    const etimologiId = result.rows[0]?.id;
    if (!etimologiId) return null;
    return this.ambilDenganId(etimologiId);
  }

  static async hapus(id) {
    const result = await db.query('DELETE FROM etimologi WHERE id = $1 RETURNING id', [id]);
    return Boolean(result.rows[0]);
  }

  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM etimologi');
    return parseCount(result.rows[0]?.total);
  }
}

module.exports = ModelEtimologi;
