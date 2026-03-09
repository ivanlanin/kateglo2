/**
 * @fileoverview Model opsi untuk master bahasa, bidang, sumber,
 * dan opsi label read-only yang dipakai lintas modul redaksi.
 */

const db = require('../db');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');

const KATEGORI_LABEL_REDAKSI = ['bentuk-kata', 'jenis-rujuk', 'kelas-kata', 'ragam', 'bidang', 'bahasa', 'penyingkatan'];
const MASTER_KATEGORI_TABLE = {
  bahasa: 'bahasa',
  bidang: 'bidang',
};

function buildMasterFilters({ alias, q, aktif, params }) {
  const conditions = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(
      ${alias}.kode ILIKE $${params.length}
      OR ${alias}.nama ILIKE $${params.length}
      OR COALESCE(${alias}.keterangan, '') ILIKE $${params.length}
    )`);
  }

  if (aktif === '1') {
    conditions.push(`${alias}.aktif = TRUE`);
  } else if (aktif === '0') {
    conditions.push(`${alias}.aktif = FALSE`);
  }

  return conditions;
}

function buildSumberFilters({ q, glosarium, kamus, tesaurus, etimologi, params }) {
  const conditions = [];
  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(
      s.kode ILIKE $${params.length}
      OR s.nama ILIKE $${params.length}
      OR COALESCE(s.keterangan, '') ILIKE $${params.length}
    )`);
  }
  if (glosarium === '1') conditions.push('s.glosarium = TRUE');
  else if (glosarium === '0') conditions.push('s.glosarium = FALSE');
  if (kamus === '1') conditions.push('s.kamus = TRUE');
  else if (kamus === '0') conditions.push('s.kamus = FALSE');
  if (tesaurus === '1') conditions.push('s.tesaurus = TRUE');
  else if (tesaurus === '0') conditions.push('s.tesaurus = FALSE');
  if (etimologi === '1') conditions.push('s.etimologi = TRUE');
  else if (etimologi === '0') conditions.push('s.etimologi = FALSE');
  return conditions;
}

function normalisasiKategoriLabel(kategori = '') {
  const value = String(kategori || '').trim();
  if (value === 'kelas_kata') return 'kelas-kata';
  if (value === 'kelas') return 'kelas-kata';
  return value;
}

function kandidatKategoriLabel(kategori = '') {
  const normalized = normalisasiKategoriLabel(kategori);
  if (!normalized) return [];
  if (normalized === 'kelas-kata') return ['kelas-kata', 'kelas_kata'];
  return [normalized];
}

function normalizeLabelValue(value) {
  return String(value || '').trim().toLowerCase();
}

function pushLabelUnik(grouped, kategori, label) {
  if (!grouped[kategori]) {
    grouped[kategori] = [];
  }

  const exists = grouped[kategori].some(
    (item) => normalizeLabelValue(item.kode) === normalizeLabelValue(label.kode)
  );
  if (!exists) {
    grouped[kategori].push(label);
  }
}

function getMasterKategoriTable(kategori = '') {
  return MASTER_KATEGORI_TABLE[kategori] || '';
}

async function ambilDaftarLabelMaster(kategori = '') {
  const tableName = getMasterKategoriTable(kategori);
  if (!tableName) return [];

  const result = await db.query(
    `SELECT kode, nama
     FROM ${tableName}
     WHERE aktif = TRUE
     ORDER BY nama ASC, kode ASC`
  );

  return result.rows.map((row) => ({ kode: row.kode, nama: row.nama }));
}

class ModelOpsi {
  static async daftarMasterBidang({ q = '', aktif = '', limit = 50, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const params = [];
    const conditions = buildMasterFilters({ alias: 'b', q, aktif, params });
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM bidang b
       ${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `SELECT b.id, b.kode, b.nama, b.aktif, b.keterangan, b.created_at, b.updated_at
       FROM bidang b
       ${whereSql}
       ORDER BY b.nama ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total: parseCount(countResult.rows[0]?.total) };
  }

  static async daftarLookupBidang({ q = '' } = {}) {
    const params = [];
    const conditions = buildMasterFilters({ alias: 'b', q, aktif: '', params });
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT b.id, b.kode, b.nama
       FROM bidang b
       ${whereSql}
       ORDER BY b.nama ASC`,
      params
    );

    return result.rows;
  }

  static async ambilMasterBidangDenganId(id) {
    const result = await db.query(
      `SELECT b.id, b.kode, b.nama, b.aktif, b.keterangan, b.created_at, b.updated_at
       FROM bidang b
       WHERE b.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async simpanMasterBidang({ id, kode, nama, aktif = true, keterangan = '' }) {
    const normalizedAktif = normalizeBoolean(aktif, true);
    if (id) {
      const result = await db.query(
        `UPDATE bidang
         SET kode = $1,
             nama = $2,
             aktif = $3,
             keterangan = NULLIF($4, '')
         WHERE id = $5
         RETURNING id`,
        [kode, nama, normalizedAktif, keterangan, id]
      );
      if (!result.rows[0]?.id) return null;
      return this.ambilMasterBidangDenganId(result.rows[0].id);
    }

    const result = await db.query(
      `INSERT INTO bidang (kode, nama, aktif, keterangan)
       VALUES ($1, $2, $3, NULLIF($4, ''))
       RETURNING id`,
      [kode, nama, normalizedAktif, keterangan]
    );

    return this.ambilMasterBidangDenganId(result.rows[0].id);
  }

  static async hapusMasterBidang(id) {
    const usage = await db.query(
      'SELECT COUNT(*)::int AS total FROM glosarium WHERE bidang_id = $1',
      [id]
    );
    const total = parseCount(usage.rows[0]?.total);
    if (total > 0) {
      const error = new Error('Bidang masih dipakai di glosarium dan tidak bisa dihapus');
      error.code = 'MASTER_IN_USE';
      throw error;
    }

    const result = await db.query('DELETE FROM bidang WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  static async daftarMasterBahasa({ q = '', aktif = '', limit = 50, offset = 0 } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 500);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const params = [];
    const conditions = buildMasterFilters({ alias: 'ba', q, aktif, params });
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM bahasa ba ${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `SELECT ba.id, ba.kode, ba.nama, ba.iso2, ba.iso3, ba.aktif, ba.keterangan,
              ba.created_at, ba.updated_at
       FROM bahasa ba
       ${whereSql}
       ORDER BY ba.nama ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total: parseCount(countResult.rows[0]?.total) };
  }

  static async daftarLookupBahasa({ q = '' } = {}) {
    const params = [];
    const conditions = buildMasterFilters({ alias: 'ba', q, aktif: '', params });
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT ba.id, ba.kode, ba.nama, ba.iso2
       FROM bahasa ba
       ${whereSql}
       ORDER BY ba.nama ASC`,
      params
    );

    return result.rows;
  }

  static async ambilMasterBahasaDenganId(id) {
    const result = await db.query(
      `SELECT ba.id, ba.kode, ba.nama, ba.iso2, ba.iso3, ba.aktif, ba.keterangan,
              ba.created_at, ba.updated_at
       FROM bahasa ba
       WHERE ba.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async simpanMasterBahasa({ id, kode, nama, aktif = true, iso2 = '', iso3 = '', keterangan = '' }) {
    const normalizedAktif = normalizeBoolean(aktif, true);
    if (id) {
      const result = await db.query(
        `UPDATE bahasa
         SET kode       = $1,
             nama       = $2,
             aktif      = $3,
             iso2       = NULLIF($4, ''),
             iso3       = NULLIF($5, ''),
             keterangan = NULLIF($6, '')
         WHERE id = $7
         RETURNING id`,
        [kode, nama, normalizedAktif, iso2, iso3, keterangan, id]
      );
      if (!result.rows[0]?.id) return null;
      return this.ambilMasterBahasaDenganId(result.rows[0].id);
    }

    const result = await db.query(
      `INSERT INTO bahasa (kode, nama, aktif, iso2, iso3, keterangan)
       VALUES ($1, $2, $3, NULLIF($4, ''), NULLIF($5, ''), NULLIF($6, ''))
       RETURNING id`,
      [kode, nama, normalizedAktif, iso2, iso3, keterangan]
    );
    return this.ambilMasterBahasaDenganId(result.rows[0].id);
  }

  static async hapusMasterBahasa(id) {
    const usage = await db.query(
      `SELECT (
          (SELECT COUNT(*)::int FROM makna      WHERE bahasa    = (SELECT kode FROM bahasa WHERE id = $1))
        + (SELECT COUNT(*)::int FROM contoh     WHERE bahasa    = (SELECT kode FROM bahasa WHERE id = $1))
        + (SELECT COUNT(*)::int FROM etimologi  WHERE bahasa_id = $1)
        + (SELECT COUNT(*)::int FROM glosarium  WHERE bahasa_id = $1)
       ) AS total`,
      [id]
    );
    const total = parseCount(usage.rows[0]?.total);
    if (total > 0) {
      const error = new Error('Bahasa masih dipakai dan tidak bisa dihapus');
      error.code = 'MASTER_IN_USE';
      throw error;
    }
    const result = await db.query('DELETE FROM bahasa WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  static async daftarMasterSumber({
    q = '', glosarium = '', kamus = '', tesaurus = '', etimologi = '', limit = 50, offset = 0,
  } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const params = [];
    const conditions = buildSumberFilters({ q, glosarium, kamus, tesaurus, etimologi, params });
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM sumber s ${whereSql}`,
      params
    );

    const dataResult = await db.query(
      `SELECT s.id, s.kode, s.nama, s.glosarium, s.kamus, s.tesaurus, s.etimologi,
              s.keterangan, s.created_at, s.updated_at
       FROM sumber s
       ${whereSql}
       ORDER BY s.nama ASC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total: parseCount(countResult.rows[0]?.total) };
  }

  static async daftarLookupSumber({
    q = '', glosarium = '', kamus = '', tesaurus = '', etimologi = '',
  } = {}) {
    const params = [];
    const conditions = buildSumberFilters({ q, glosarium, kamus, tesaurus, etimologi, params });
    const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT s.id, s.kode, s.nama
       FROM sumber s
       ${whereSql}
       ORDER BY s.nama ASC`,
      params
    );

    return result.rows;
  }

  static async ambilMasterSumberDenganId(id) {
    const result = await db.query(
      `SELECT s.id, s.kode, s.nama, s.glosarium, s.kamus, s.tesaurus, s.etimologi,
              s.keterangan, s.created_at, s.updated_at
       FROM sumber s
       WHERE s.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  static async simpanMasterSumber({
    id, kode, nama, glosarium = false, kamus = false, tesaurus = false, etimologi = false, keterangan = '',
  }) {
    const normGlosarium = normalizeBoolean(glosarium, false);
    const normKamus = normalizeBoolean(kamus, false);
    const normTesaurus = normalizeBoolean(tesaurus, false);
    const normEtimologi = normalizeBoolean(etimologi, false);
    if (id) {
      const result = await db.query(
        `UPDATE sumber
         SET kode = $1, nama = $2, glosarium = $3, kamus = $4,
             tesaurus = $5, etimologi = $6, keterangan = NULLIF($7, '')
         WHERE id = $8
         RETURNING id`,
        [kode, nama, normGlosarium, normKamus, normTesaurus, normEtimologi, keterangan, id]
      );
      if (!result.rows[0]?.id) return null;
      return this.ambilMasterSumberDenganId(result.rows[0].id);
    }

    const result = await db.query(
      `INSERT INTO sumber (kode, nama, glosarium, kamus, tesaurus, etimologi, keterangan)
       VALUES ($1, $2, $3, $4, $5, $6, NULLIF($7, ''))
       RETURNING id`,
      [kode, nama, normGlosarium, normKamus, normTesaurus, normEtimologi, keterangan]
    );
    return this.ambilMasterSumberDenganId(result.rows[0].id);
  }

  static async hapusMasterSumber(id) {
    const usage = await db.query(
      `SELECT (
          (SELECT COUNT(*)::int FROM entri WHERE sumber_id = $1)
        + (SELECT COUNT(*)::int FROM tesaurus WHERE sumber_id = $1)
        + (SELECT COUNT(*)::int FROM glosarium WHERE sumber_id = $1)
        + (SELECT COUNT(*)::int FROM etimologi WHERE sumber_id = $1)
      ) AS total`,
      [id]
    );
    const total = parseCount(usage.rows[0]?.total);
    if (total > 0) {
      const error = new Error('Sumber masih dipakai dan tidak bisa dihapus');
      error.code = 'MASTER_IN_USE';
      throw error;
    }

    const result = await db.query('DELETE FROM sumber WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  static async hitungTotalBidang() {
    const result = await db.query('SELECT COUNT(*) AS total FROM bidang');
    return parseCount(result.rows[0]?.total);
  }

  static async hitungTotalBahasa() {
    const result = await db.query('SELECT COUNT(*) AS total FROM bahasa');
    return parseCount(result.rows[0]?.total);
  }

  static async hitungTotalSumber() {
    const result = await db.query('SELECT COUNT(*) AS total FROM sumber');
    return parseCount(result.rows[0]?.total);
  }

  static async ambilKategoriLabelUntukRedaksi(kategoriList = []) {
    const requested = kategoriList.length
      ? kategoriList.map((item) => normalisasiKategoriLabel(item)).filter(Boolean)
      : [...KATEGORI_LABEL_REDAKSI];

    const uniqueRequested = [...new Set(requested)].filter((item) => KATEGORI_LABEL_REDAKSI.includes(item));
    if (!uniqueRequested.length) {
      return {};
    }

    const grouped = Object.fromEntries(uniqueRequested.map((kategori) => [kategori, []]));

    const kategoriLabelBiasa = uniqueRequested.filter((item) => !getMasterKategoriTable(item));
    if (kategoriLabelBiasa.length) {
      const kategoriQuery = [...new Set(kategoriLabelBiasa.flatMap((item) => kandidatKategoriLabel(item)))];
      const result = await db.query(
        `SELECT kategori, kode, nama, urutan
         FROM label
         WHERE kategori = ANY($1::text[]) AND aktif = TRUE
         ORDER BY kategori ASC, urutan ASC, nama ASC, kode ASC`,
        [kategoriQuery]
      );

      for (const row of result.rows) {
        const normalizedKategori = normalisasiKategoriLabel(row.kategori);
        if (!grouped[normalizedKategori]) continue;
        pushLabelUnik(grouped, normalizedKategori, { kode: row.kode, nama: row.nama });
      }
    }

    const kategoriMaster = uniqueRequested.filter((item) => getMasterKategoriTable(item));
    if (kategoriMaster.length) {
      const hasilMaster = await Promise.all(kategoriMaster.map((item) => ambilDaftarLabelMaster(item)));
      kategoriMaster.forEach((kategori, index) => {
        grouped[kategori] = hasilMaster[index];
      });
    }

    return grouped;
  }
}

module.exports = ModelOpsi;