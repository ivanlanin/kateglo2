/**
 * @fileoverview Model arsip Kata Hari Ini
 */

const db = require('../../db');

const selectKataHariIniFields = `SELECT id,
  to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
  entri_id,
  indeks,
  entri,
  kelas_kata,
  makna,
  contoh,
  pemenggalan,
  lafal,
  etimologi_bahasa,
  etimologi_kata_asal,
  mode_pemilihan,
  catatan_admin,
  to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at,
  to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at
 FROM kata_hari_ini`;

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

function normalizeModePemilihan(value) {
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
  const makna = sanitizeText(row.makna);
  if (!tanggal || !indeks || !entri || !makna) return null;

  const etimologiBahasa = sanitizeText(row.etimologi_bahasa);
  const etimologiKataAsal = sanitizeText(row.etimologi_kata_asal);

  return {
    id: parsePositiveInteger(row.id),
    tanggal,
    entri_id: parsePositiveInteger(row.entri_id),
    indeks,
    entri,
    url: `/kamus/detail/${encodeURIComponent(indeks)}`,
    kelas_kata: sanitizeText(row.kelas_kata),
    makna,
    contoh: sanitizeText(row.contoh),
    pemenggalan: sanitizeText(row.pemenggalan),
    lafal: sanitizeText(row.lafal),
    etimologi: etimologiBahasa || etimologiKataAsal
      ? {
        bahasa: etimologiBahasa,
        bahasa_kode: null,
        kata_asal: etimologiKataAsal,
        sumber: null,
        sumber_kode: null,
      }
      : null,
    mode_pemilihan: normalizeModePemilihan(row.mode_pemilihan),
    catatan_admin: sanitizeText(row.catatan_admin),
    created_at: row.created_at || null,
    updated_at: row.updated_at || null,
  };
}

class ModelKataHariIni {
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM kata_hari_ini');
    return parsePositiveInteger(result.rows[0]?.total) || 0;
  }

  static async daftarAdmin({ limit = 50, offset = 0, q = '', modePemilihan = '' } = {}) {
    const limitAman = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const offsetAman = Math.max(Number(offset) || 0, 0);
    const qAman = sanitizeText(q, { required: false });
    const modePemilihanAman = ['auto', 'admin'].includes(String(modePemilihan || '').trim().toLowerCase())
      ? normalizeModePemilihan(modePemilihan)
      : null;

    const params = [];
    const whereClauses = [];

    if (qAman) {
      params.push(`%${qAman}%`);
      whereClauses.push(`(
        to_char(tanggal, 'YYYY-MM-DD') ILIKE $${params.length}
        OR indeks ILIKE $${params.length}
        OR entri ILIKE $${params.length}
        OR makna ILIKE $${params.length}
      )`);
    }

    if (modePemilihanAman) {
      params.push(modePemilihanAman);
      whereClauses.push(`mode_pemilihan = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : '';
    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM kata_hari_ini${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `${selectKataHariIniFields}${whereSql}
       ORDER BY tanggal DESC, id DESC
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
       WHERE id = $1
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
       WHERE tanggal = $1::date
       LIMIT 1`,
      [tanggalAman]
    );

    return mapRowToPayload(result.rows[0] || null);
  }

  static async simpanByTanggal({
    tanggal,
    entriId,
    payload,
    modePemilihan = 'auto',
    catatanAdmin = null,
  } = {}) {
    const tanggalAman = parseTanggal(tanggal);
    if (!tanggalAman) {
      throw new Error('Tanggal tidak valid');
    }

    const entriIdAman = parsePositiveInteger(entriId);
    if (!entriIdAman) {
      throw new Error('entriId tidak valid');
    }

    const indeks = sanitizeText(payload?.indeks, { required: true });
    const entri = sanitizeText(payload?.entri, { required: true });
    const makna = sanitizeText(payload?.makna, { required: true });
    const kelasKata = sanitizeText(payload?.kelas_kata);
    const contoh = sanitizeText(payload?.contoh);
    const pemenggalan = sanitizeText(payload?.pemenggalan);
    const lafal = sanitizeText(payload?.lafal);
    const etimologiBahasa = sanitizeText(payload?.etimologi?.bahasa);
    const etimologiKataAsal = sanitizeText(payload?.etimologi?.kata_asal);
    const modePemilihanAman = normalizeModePemilihan(modePemilihan);
    const catatanAdminAman = sanitizeText(catatanAdmin);

    const result = await db.query(
      `INSERT INTO kata_hari_ini (
         tanggal,
         entri_id,
         indeks,
         entri,
         kelas_kata,
         makna,
         contoh,
         pemenggalan,
         lafal,
         etimologi_bahasa,
         etimologi_kata_asal,
         mode_pemilihan,
         catatan_admin
       ) VALUES (
         $1::date,
         $2,
         $3,
         $4,
         $5,
         $6,
         $7,
         $8,
         $9,
         $10,
         $11,
         $12,
         $13
       )
       ON CONFLICT (tanggal)
       DO UPDATE SET
         entri_id = EXCLUDED.entri_id,
         indeks = EXCLUDED.indeks,
         entri = EXCLUDED.entri,
         kelas_kata = EXCLUDED.kelas_kata,
         makna = EXCLUDED.makna,
         contoh = EXCLUDED.contoh,
         pemenggalan = EXCLUDED.pemenggalan,
         lafal = EXCLUDED.lafal,
         etimologi_bahasa = EXCLUDED.etimologi_bahasa,
         etimologi_kata_asal = EXCLUDED.etimologi_kata_asal,
         mode_pemilihan = EXCLUDED.mode_pemilihan,
         catatan_admin = EXCLUDED.catatan_admin,
         updated_at = now()
       RETURNING id,
                 to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
                 entri_id,
                 indeks,
                 entri,
                 kelas_kata,
                 makna,
                 contoh,
                 pemenggalan,
                 lafal,
                 etimologi_bahasa,
                 etimologi_kata_asal,
                 mode_pemilihan,
                 catatan_admin,
                 to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at,
                 to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at`,
      [
        tanggalAman,
        entriIdAman,
        indeks,
        entri,
        kelasKata,
        makna,
        contoh,
        pemenggalan,
        lafal,
        etimologiBahasa,
        etimologiKataAsal,
        modePemilihanAman,
        catatanAdminAman,
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
  normalizeModePemilihan,
  formatTanggalOutput,
  mapRowToPayload,
};