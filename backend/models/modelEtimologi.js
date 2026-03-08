/**
 * @fileoverview Model untuk etimologi redaksi
 */

const db = require('../db');
const { parseCount } = require('../utils/modelUtils');

function normalizeIntegerNullable(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

class ModelEtimologi {
  static async ambilAktifPublikByEntriId(entriId, { aktifSaja = true } = {}) {
    const parsedId = Number(entriId);
    if (!Number.isInteger(parsedId) || parsedId <= 0) return [];

    const result = await db.query(
      `SELECT e.id, e.bahasa_id, ba.kode AS bahasa_kode, ba.nama AS bahasa,
              e.kata_asal, e.sumber_id, s.kode AS sumber_kode, s.nama AS sumber, e.aktif, e.meragukan
       FROM etimologi e
       LEFT JOIN sumber s ON s.id = e.sumber_id
       LEFT JOIN bahasa ba ON ba.id = e.bahasa_id
       WHERE e.entri_id = $1
         ${aktifSaja ? 'AND e.aktif = TRUE' : ''}
         AND (
           e.bahasa_id IS NOT NULL
           OR NULLIF(BTRIM(COALESCE(e.kata_asal, '')), '') IS NOT NULL
         )
       ORDER BY e.id ASC`,
      [parsedId]
    );

    return result.rows;
  }

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

  static async daftarAdmin({ limit = 50, offset = 0, q = '', bahasa = '', aktif = '', meragukan = '' } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    const params = [];
    const conditions = [];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(
        e.indeks ILIKE $${params.length}
        OR COALESCE(e.lafal, '') ILIKE $${params.length}
        OR COALESCE(ba.kode, '') ILIKE $${params.length}
        OR COALESCE(ba.nama, '') ILIKE $${params.length}
        OR COALESCE(e.kata_asal, '') ILIKE $${params.length}
        OR COALESCE(e.arti_asal, '') ILIKE $${params.length}
        OR COALESCE(e.sumber_isi, '') ILIKE $${params.length}
        OR COALESCE(en.entri, '') ILIKE $${params.length}
      )`);
    }

    if (bahasa === '__KOSONG__') {
      conditions.push('e.bahasa_id IS NULL');
    } else if (bahasa) {
      params.push(String(bahasa).trim());
      conditions.push(`LOWER(COALESCE(ba.kode, '')) = LOWER($${params.length})`);
    }

    if (aktif === '1' || aktif === '0') {
      params.push(aktif === '1');
      conditions.push(`e.aktif = $${params.length}`);
    }

    if (meragukan === '1' || meragukan === '0') {
      params.push(meragukan === '1');
      conditions.push(`e.meragukan = $${params.length}`);
    }

    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM etimologi e
       LEFT JOIN entri en ON en.id = e.entri_id
       LEFT JOIN bahasa ba ON ba.id = e.bahasa_id
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
         e.bahasa_id,
         ba.kode AS bahasa_kode,
         ba.nama AS bahasa,
         e.kata_asal,
         e.arti_asal,
         e.sumber_id,
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
         e.meragukan,
         e.created_at,
         e.updated_at
       FROM etimologi e
       LEFT JOIN entri en ON en.id = e.entri_id
       LEFT JOIN bahasa ba ON ba.id = e.bahasa_id
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
         e.bahasa_id,
         ba.kode AS bahasa_kode,
         ba.nama AS bahasa,
         e.kata_asal,
         e.arti_asal,
         e.sumber_id,
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
         e.meragukan,
         e.created_at,
         e.updated_at
       FROM etimologi e
       LEFT JOIN entri en ON en.id = e.entri_id
       LEFT JOIN bahasa ba ON ba.id = e.bahasa_id
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
    bahasa_id,
    kata_asal,
    arti_asal,
    sumber_id,
    sumber_definisi,
    sumber_sitasi,
    sumber_isi,
    sumber_aksara,
    sumber_lihat,
    sumber_varian,
    entri_id,
    meragukan,
  }) {
    const normalizedHomonim = normalizeIntegerNullable(homonim);
    const normalizedEntriId = normalizeIntegerNullable(entri_id);
    const normalizedSumberId = normalizeIntegerNullable(sumber_id);
    const normalizedMeragukan = Boolean(meragukan);

    // Resolve bahasa_id: terima bahasa_id (integer) atau bahasa (kode string)
    let resolvedBahasaId = normalizeIntegerNullable(bahasa_id);
    if (!resolvedBahasaId && bahasa) {
      const kode = String(bahasa).trim();
      if (kode) {
        const r = await db.query('SELECT id FROM bahasa WHERE LOWER(kode) = LOWER($1) LIMIT 1', [kode]);
        resolvedBahasaId = r.rows[0]?.id || null;
        if (!resolvedBahasaId) {
          const error = new Error('Bahasa tidak valid');
          error.code = 'INVALID_BAHASA';
          throw error;
        }
      }
    }
    const normalizedAktif = Boolean(resolvedBahasaId);

    const result = id
      ? await db.query(
        `UPDATE etimologi
         SET indeks = $1,
             homonim = $2,
             lafal = NULLIF($3, ''),
             bahasa_id = $4,
             kata_asal = NULLIF($5, ''),
             arti_asal = NULLIF($6, ''),
             sumber_id = $7,
             sumber_definisi = NULLIF($8, ''),
             sumber_sitasi = NULLIF($9, ''),
             sumber_isi = NULLIF($10, ''),
             sumber_aksara = NULLIF($11, ''),
             sumber_lihat = NULLIF($12, ''),
             sumber_varian = NULLIF($13, ''),
             entri_id = $14,
             aktif = $15,
             meragukan = $16,
             updated_at = NOW()
           WHERE id = $17
         RETURNING id`,
        [
          indeks,
          normalizedHomonim,
          lafal,
          resolvedBahasaId,
          kata_asal,
          arti_asal,
          normalizedSumberId,
          sumber_definisi,
          sumber_sitasi,
          sumber_isi,
          sumber_aksara,
          sumber_lihat,
          sumber_varian,
          normalizedEntriId,
          normalizedAktif,
          normalizedMeragukan,
          id,
        ]
      )
      : await db.query(
        `INSERT INTO etimologi (
           indeks,
           homonim,
           lafal,
           bahasa_id,
           kata_asal,
           arti_asal,
           sumber_id,
           sumber_definisi,
           sumber_sitasi,
           sumber_isi,
           sumber_aksara,
           sumber_lihat,
           sumber_varian,
           entri_id,
           aktif,
           meragukan,
           created_at,
           updated_at
         )
         VALUES (
           $1,
           $2,
           NULLIF($3, ''),
           $4,
           NULLIF($5, ''),
           NULLIF($6, ''),
           $7,
           NULLIF($8, ''),
           NULLIF($9, ''),
           NULLIF($10, ''),
           NULLIF($11, ''),
           NULLIF($12, ''),
           NULLIF($13, ''),
           $14,
           $15,
           $16,
           NOW(),
           NOW()
         )
         RETURNING id`,
        [
          indeks,
          normalizedHomonim,
          lafal,
          resolvedBahasaId,
          kata_asal,
          arti_asal,
          normalizedSumberId,
          sumber_definisi,
          sumber_sitasi,
          sumber_isi,
          sumber_aksara,
          sumber_lihat,
          sumber_varian,
          normalizedEntriId,
          normalizedAktif,
          normalizedMeragukan,
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
