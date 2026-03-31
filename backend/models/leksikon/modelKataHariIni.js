/**
 * @fileoverview Model arsip Kata Hari Ini
 */

const db = require('../../db');

const selectKataHariIniFields = `SELECT khi.id,
  to_char(khi.tanggal, 'YYYY-MM-DD') AS tanggal,
  khi.entri_id,
  e.indeks,
  e.entri,
  khi.sumber,
  khi.catatan,
  to_char(khi.created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at,
  to_char(khi.updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at
 FROM kata_hari_ini khi
 JOIN entri e ON e.id = khi.entri_id`;

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parsePositiveInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function sanitizeText(value, { required = false } = {}) {
  const text = String(value || '').replace(/\s+/g, ' ').trim();
  if (!text) {
    if (required) {
      throw new Error('Teks wajib diisi');
    }
    return null;
  }
  return text;
}

function normalizeSumber(value) {
  const normalized = String(value || '').trim().toLowerCase();
  return normalized === 'admin' ? 'admin' : 'auto';
}

function formatTanggalOutput(value) {
  if (!value) return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function mapRowToPayload(row) {
  if (!row) return null;

  const tanggal = formatTanggalOutput(row.tanggal);
  const indeks = sanitizeText(row.indeks);
  const entri = sanitizeText(row.entri);
  if (!tanggal || !indeks || !entri) return null;

  return {
    id: parsePositiveInteger(row.id),
    tanggal,
    entri_id: parsePositiveInteger(row.entri_id),
    indeks,
    entri,
    url: `/kamus/detail/${encodeURIComponent(indeks)}`,
    sumber: normalizeSumber(row.sumber),
    catatan: sanitizeText(row.catatan),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

class ModelKataHariIni {
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM kata_hari_ini');
    return parsePositiveInteger(result.rows[0]?.total) || 0;
  }

  static async daftarAdmin({ limit = 50, offset = 0, q = '', sumber = '' } = {}) {
    const limitAman = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const offsetAman = Math.max(Number(offset) || 0, 0);
    const qAman = sanitizeText(q, { required: false });
    const sumberAman = ['auto', 'admin'].includes(String(sumber || '').trim().toLowerCase())
      ? normalizeSumber(sumber)
      : null;

    const params = [];
    const whereClauses = [];

    if (qAman) {
      params.push(`%${qAman}%`);
      whereClauses.push(`(
        to_char(khi.tanggal, 'YYYY-MM-DD') ILIKE $${params.length}
        OR e.indeks ILIKE $${params.length}
        OR e.entri ILIKE $${params.length}
        OR COALESCE(khi.catatan, '') ILIKE $${params.length}
      )`);
    }

    if (sumberAman) {
      params.push(sumberAman);
      whereClauses.push(`khi.sumber = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM kata_hari_ini khi
       JOIN entri e ON e.id = khi.entri_id${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `${selectKataHariIniFields}${whereSql}
       ORDER BY khi.tanggal DESC, khi.id DESC
       LIMIT $${params.length + 1}
       OFFSET $${params.length + 2}`,
      [...params, limitAman, offsetAman]
    );

    return {
      data: dataResult.rows.map(mapRowToPayload).filter(Boolean),
      total: parsePositiveInteger(countResult.rows[0]?.total) || 0,
    };
  }

  static async ambilDenganId(id) {
    const idAman = parsePositiveInteger(id);
    if (!idAman) return null;

    const result = await db.query(
      `${selectKataHariIniFields}
       WHERE khi.id = $1
       LIMIT 1`,
      [idAman]
    );

    return mapRowToPayload(result.rows[0] || null);
  }

  static async ambilByTanggal(tanggal) {
    const tanggalAman = parseTanggal(tanggal);
    if (!tanggalAman) return null;

    const result = await db.query(
      `${selectKataHariIniFields}
       WHERE khi.tanggal = $1::date
       LIMIT 1`,
      [tanggalAman]
    );

    return mapRowToPayload(result.rows[0] || null);
  }

  static async simpanByTanggal({
    tanggal,
    entriId,
    sumber = 'auto',
    catatan = null,
  } = {}) {
    const tanggalAman = parseTanggal(tanggal);
    if (!tanggalAman) {
      throw new Error('Tanggal tidak valid');
    }

    const entriIdAman = parsePositiveInteger(entriId);
    if (!entriIdAman) {
      throw new Error('entriId tidak valid');
    }

    const sumberAman = normalizeSumber(sumber);
    const catatanAman = sanitizeText(catatan);

    const result = await db.query(
      `INSERT INTO kata_hari_ini (
         tanggal,
         entri_id,
         sumber,
         catatan
       ) VALUES (
         $1::date,
         $2,
         $3,
         $4
       )
       ON CONFLICT (tanggal)
       DO UPDATE SET
         entri_id = EXCLUDED.entri_id,
         sumber = EXCLUDED.sumber,
         catatan = EXCLUDED.catatan,
         updated_at = now()
       RETURNING id,
                 to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
                 entri_id,
                 (SELECT indeks FROM entri WHERE id = entri_id) AS indeks,
                 (SELECT entri FROM entri WHERE id = entri_id) AS entri,
                 sumber,
                 catatan,
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at,
                 to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at`,
      [
        tanggalAman,
        entriIdAman,
        sumberAman,
        catatanAman,
      ]
    );

    return mapRowToPayload(result.rows[0] || null);
  }

  static async hapus(id) {
    const idAman = parsePositiveInteger(id);
    if (!idAman) return false;

    const result = await db.query(
      'DELETE FROM kata_hari_ini WHERE id = $1',
      [idAman]
    );

    return Number(result.rowCount) > 0;
  }
}

module.exports = ModelKataHariIni;

module.exports.__private = {
  parseTanggal,
  parsePositiveInteger,
  sanitizeText,
  normalizeSumber,
  formatTanggalOutput,
  mapRowToPayload,
};