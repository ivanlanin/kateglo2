/**
 * @fileoverview Model untuk tabel label dan kategori kamus
 * (ragam, kelas_kata, bahasa, bidang, abjad, bentuk, ekspresi)
 */

const db = require('../db');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');

/**
 * Ekspresi SQL untuk mengekstrak huruf pertama Latin dari entri.
 * Lewati karakter non-Latin di awal (tanda hubung, spasi, dll.),
 * lalu ambil huruf Latin pertama dan ubah ke huruf besar.
 */
const SQL_ABJAD = `UPPER(SUBSTRING(REGEXP_REPLACE(entri, '^[^a-zA-Z]*', ''), 1, 1))`;
const JENIS_BENTUK = ['dasar', 'turunan', 'gabungan'];
const JENIS_EKSPRESI = ['idiom', 'peribahasa'];
const JENIS_UNSUR_TERIKAT = ['terikat', 'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'];
const JENIS_SEMUA = [...JENIS_BENTUK, ...JENIS_EKSPRESI, ...JENIS_UNSUR_TERIKAT, 'varian'];
const KELAS_BEBAS = ['adjektiva', 'adverbia', 'nomina', 'numeralia', 'preposisi', 'konjungsi', 'interjeksi', 'partikel', 'pronomina', 'verba'];
const URUTAN_KELAS_KATA = ['nomina', 'verba', 'adjektiva', 'adverbia', 'pronomina', 'numeralia', 'preposisi', 'konjungsi', 'interjeksi', 'partikel'];
const URUTAN_UNSUR_TERIKAT = ['terikat', 'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik'];
const URUTAN_RAGAM = ['arkais', 'klasik', 'hormat', 'cakapan', 'kasar'];
const KATEGORI_LABEL_REDAKSI = ['bentuk-kata', 'jenis-rujuk', 'kelas-kata', 'ragam', 'bidang', 'bahasa', 'penyingkatan'];

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

function normalizeLabelSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function denormalizeLabelSlug(value) {
  const cleaned = normalizeLabelSlug(value);
  return cleaned.includes('-') ? cleaned.replace(/-/g, ' ') : cleaned;
}

function urutkanLabelPrioritas(labels, urutanPrioritas) {
  const prioritasMap = new Map(urutanPrioritas.map((nama, index) => [normalizeLabelValue(nama), index]));
  return [...labels].sort((a, b) => {
    const aNama = normalizeLabelValue(a.nama);
    const bNama = normalizeLabelValue(b.nama);
    const aKode = normalizeLabelValue(a.kode);
    const bKode = normalizeLabelValue(b.kode);
    const aPrioritas = prioritasMap.get(aNama) ?? prioritasMap.get(aKode);
    const bPrioritas = prioritasMap.get(bNama) ?? prioritasMap.get(bKode);

    if (aPrioritas !== undefined && bPrioritas !== undefined) return aPrioritas - bPrioritas;
    if (aPrioritas !== undefined) return -1;
    if (bPrioritas !== undefined) return 1;

    return String(a.nama || a.kode || '').localeCompare(String(b.nama || b.kode || ''), 'id');
  });
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

function buildNilaiCocokLabel(inputLabel, label = null) {
  const inputRaw = String(inputLabel || '').trim();
  const inputDeslug = denormalizeLabelSlug(inputRaw);
  const candidates = [inputRaw, inputDeslug, label?.kode, label?.nama]
    .map((item) => String(item || '').trim())
    .filter(Boolean);

  const uniqueValues = [];
  const seen = new Set();
  for (const value of candidates) {
    const key = normalizeLabelValue(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    uniqueValues.push(value);
  }

  return uniqueValues;
}

class ModelLabel {
  /**
  * Ambil semua kategori beserta daftar label per kategori dan jumlah entri.
   * Kolom makna bisa menyimpan kode atau nama label, jadi pencocokan
   * dilakukan terhadap kedua nilai.
   * @returns {Promise<Object>} { kategori: [{ kode, nama, jumlah }] }
   */
  static async ambilSemuaKategori() {
    // Label dari tabel label (ragam, kelas_kata, bahasa, bidang)
    const result = await db.query(
      `SELECT kategori, kode, nama, urutan
       FROM label
       WHERE aktif = TRUE
       ORDER BY kategori, urutan, nama`
    );

    const grouped = {};
    for (const row of result.rows) {
      const kategori = normalisasiKategoriLabel(row.kategori);
      pushLabelUnik(grouped, kategori, { kode: row.kode, nama: row.nama });
    }

    // Ambil kelas kata bebas saja dari kategori kelas_kata.
    const kelasKataSemua = grouped['kelas-kata'] || [];
    const kelasKataBebas = [];
    for (const label of kelasKataSemua) {
      const kandidatNama = normalizeLabelValue(label.nama);
      const kandidatKode = normalizeLabelValue(label.kode);
      if (KELAS_BEBAS.includes(kandidatNama) || KELAS_BEBAS.includes(kandidatKode)) {
        kelasKataBebas.push(label);
      }
    }
    grouped['kelas-kata'] = urutkanLabelPrioritas(kelasKataBebas, URUTAN_KELAS_KATA);
    grouped.kelas_kata = grouped['kelas-kata'];
    grouped.unsur_terikat = urutkanLabelPrioritas(
      JENIS_UNSUR_TERIKAT.map((jenis) => ({ kode: jenis, nama: jenis })),
      URUTAN_UNSUR_TERIKAT
    );
    grouped.ragam = urutkanLabelPrioritas(grouped.ragam || [], URUTAN_RAGAM);

    // Kategori abjad: huruf A–Z
    grouped.abjad = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((h) => ({
      kode: h,
      nama: h,
    }));

    // Kategori virtual dari kolom entri.jenis
    grouped.bentuk = JENIS_BENTUK.map((jenis) => ({ kode: jenis, nama: jenis }));
    grouped.ekspresi = JENIS_EKSPRESI.map((jenis) => ({ kode: jenis, nama: jenis }));

    // Alias kompatibilitas untuk route lama /kamus/jenis/:kode
    grouped.jenis = JENIS_SEMUA.map((jenis) => ({ kode: jenis, nama: jenis }));

    return grouped;
  }

  /**
  * Cari entri berdasarkan kategori dan kode label.
   * Mendukung kategori dari tabel label (ragam, kelas_kata, bahasa, bidang)
  * serta kategori virtual (abjad, bentuk, ekspresi, jenis).
   * @param {string} kategori - Kategori
   * @param {string} kode - Kode label / huruf / jenis
   * @param {number} limit - Batas hasil
   * @param {number} offset - Offset untuk paginasi
   * @returns {Promise<{data: Array, total: number, label: Object|null}>}
   */
  static async cariEntriPerLabel(kategori, kode, limit = 20, offset = 0) {
    const kategoriNormal = normalisasiKategoriLabel(kategori);
    const kodeTertrim = String(kode || '').trim();
    const kodeLower = normalizeLabelValue(kodeTertrim);
    const kodeSlug = normalizeLabelSlug(kodeTertrim);

    if (kategori === 'abjad') {
      return this._cariEntriPerAbjad(kode, limit, offset);
    }
    if (kategori === 'bentuk') {
      return this._cariEntriPerJenis(kode, [...JENIS_BENTUK, ...JENIS_UNSUR_TERIKAT], limit, offset);
    }
    if (kategori === 'ekspresi') {
      return this._cariEntriPerJenis(kode, JENIS_EKSPRESI, limit, offset);
    }
    if (kategori === 'jenis') {
      return this._cariEntriPerJenis(kode, JENIS_SEMUA, limit, offset);
    }
    if (kategori === 'unsur') {
      return this._cariEntriPerJenis(kode, JENIS_UNSUR_TERIKAT, limit, offset);
    }
    if (kategori === 'unsur_terikat') {
      return this._cariEntriPerJenis(kode, JENIS_UNSUR_TERIKAT, limit, offset);
    }

    const validKategori = ['ragam', 'kelas-kata', 'bahasa', 'bidang'];
    if (!validKategori.includes(kategoriNormal)) {
      return { data: [], total: 0, label: null };
    }

    const kategoriKandidat = kandidatKategoriLabel(kategoriNormal);

    // Ambil info label (kode + nama) untuk pencocokan ganda
    const labelResult = await db.query(
      `SELECT kategori, kode, nama, keterangan
       FROM label
       WHERE kategori = ANY($1::text[]) AND aktif = TRUE
         AND (
           LOWER(TRIM(kode)) = $2
           OR LOWER(TRIM(nama)) = $2
           OR TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(kode)), '[^a-z0-9]+', '-', 'g')) = $3
           OR TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(nama)), '[^a-z0-9]+', '-', 'g')) = $3
         )
       ORDER BY
         CASE WHEN LOWER(TRIM(nama)) = $2 THEN 0 ELSE 1 END,
         CASE WHEN LOWER(TRIM(kode)) = $2 THEN 0 ELSE 1 END,
         CASE WHEN TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(nama)), '[^a-z0-9]+', '-', 'g')) = $3 THEN 0 ELSE 1 END,
         CASE WHEN TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(kode)), '[^a-z0-9]+', '-', 'g')) = $3 THEN 0 ELSE 1 END,
         CASE WHEN kategori = $4 THEN 0 ELSE 1 END
       LIMIT 1`,
      [kategoriKandidat, kodeLower, kodeSlug, kategoriNormal]
    );
    const label = labelResult.rows[0] || null;

    if (kategoriNormal === 'kelas-kata') {
      if (!label) {
        return { data: [], total: 0, label: null };
      }
      const namaLabel = normalizeLabelValue(label.nama);
      const kodeLabel = normalizeLabelValue(label.kode);
      if (!KELAS_BEBAS.includes(namaLabel) && !KELAS_BEBAS.includes(kodeLabel)) {
        return { data: [], total: 0, label: null };
      }
    }

    // Kumpulkan nilai yang mungkin tersimpan di kolom makna
    const nilaiCocok = buildNilaiCocokLabel(kodeTertrim, label);

    const kolom = kategoriNormal === 'kelas-kata' ? 'kelas_kata' : kategoriNormal;

    const countResult = await db.query(
      `SELECT COUNT(DISTINCT l.id) AS total
      FROM entri l
      JOIN makna m ON m.entri_id = l.id
       WHERE m.${kolom} = ANY($1::text[]) AND l.aktif = 1`,
      [nilaiCocok]
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataResult = await db.query(
      `SELECT l.id, l.entri, l.indeks, l.urutan, l.jenis, l.jenis_rujuk, l.lema_rujuk AS entri_rujuk
       FROM entri l
       WHERE l.aktif = 1
         AND EXISTS (
           SELECT 1
           FROM makna m
           WHERE m.entri_id = l.id AND m.${kolom} = ANY($1::text[])
         )
       ORDER BY l.entri
       LIMIT $2 OFFSET $3`,
      [nilaiCocok, limit, offset]
    );

    return { data: dataResult.rows, total, label };
  }

  /**
   * Ambil daftar label per kategori untuk form redaksi.
   * @param {string[]} kategoriList
   * @returns {Promise<Object<string, Array<{kode: string, nama: string}>>>}
   */
  static async ambilKategoriUntukRedaksi(kategoriList = []) {
    const requested = kategoriList.length
      ? kategoriList.map((item) => normalisasiKategoriLabel(item)).filter(Boolean)
      : [...KATEGORI_LABEL_REDAKSI];

    const uniqueRequested = [...new Set(requested)].filter((item) => KATEGORI_LABEL_REDAKSI.includes(item));
    if (!uniqueRequested.length) {
      return {};
    }

    const kategoriQuery = [...new Set(uniqueRequested.flatMap((item) => kandidatKategoriLabel(item)))];

    const result = await db.query(
      `SELECT kategori, kode, nama, urutan
       FROM label
       WHERE kategori = ANY($1::text[]) AND aktif = TRUE
       ORDER BY kategori ASC, urutan ASC, nama ASC, kode ASC`,
      [kategoriQuery]
    );

    const grouped = Object.fromEntries(uniqueRequested.map((kategori) => [kategori, []]));

    for (const row of result.rows) {
      const normalizedKategori = normalisasiKategoriLabel(row.kategori);
      if (!grouped[normalizedKategori]) continue;
      pushLabelUnik(grouped, normalizedKategori, { kode: row.kode, nama: row.nama });
    }

    return grouped;
  }

  /**
  * Cari entri berdasarkan huruf pertama Latin.
   */
  static async _cariEntriPerAbjad(huruf, limit, offset) {
    const h = huruf.toUpperCase();
    if (!/^[A-Z]$/.test(h)) {
      return { data: [], total: 0, label: null };
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
        FROM entri
       WHERE aktif = 1 AND ${SQL_ABJAD} = $1`,
      [h]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT l.id, l.entri, l.indeks, l.urutan, l.jenis, l.jenis_rujuk, l.lema_rujuk AS entri_rujuk
       FROM entri l
       WHERE l.aktif = 1 AND ${SQL_ABJAD} = $1
       ORDER BY l.entri
       LIMIT $2 OFFSET $3`,
      [h, limit, offset]
    );

    return {
      data: dataResult.rows,
      total,
      label: { kode: h, nama: h },
    };
  }

  /**
  * Cari entri berdasarkan jenis.
   */
  static async _cariEntriPerJenis(jenis, validJenis, limit, offset) {
    if (!validJenis.includes(jenis)) {
      return { data: [], total: 0, label: null };
    }

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM entri WHERE aktif = 1 AND jenis = $1`,
      [jenis]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT l.id, l.entri, l.indeks, l.urutan, l.jenis, l.jenis_rujuk, l.lema_rujuk AS entri_rujuk
       FROM entri l
       WHERE l.aktif = 1 AND l.jenis = $1
       ORDER BY l.entri
       LIMIT $2 OFFSET $3`,
      [jenis, limit, offset]
    );

    return {
      data: dataResult.rows,
      total,
      label: { kode: jenis, nama: jenis },
    };
  }

  /**
   * Daftar label untuk panel admin (dengan pencarian opsional).
   * @param {{ limit?: number, offset?: number, q?: string }} options
   * @returns {Promise<{data: Array, total: number}>}
   */
  static async daftarAdmin({ limit = 50, offset = 0, q = '' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`(
        kategori ILIKE $${idx}
        OR kode ILIKE $${idx}
        OR nama ILIKE $${idx}
        OR COALESCE(keterangan, '') ILIKE $${idx}
      )`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM label ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT id, kategori, kode, nama, urutan, keterangan, aktif
       FROM label ${where}
       ORDER BY kategori ASC, urutan ASC, nama ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  /**
   * Ambil label berdasarkan ID (untuk admin).
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      'SELECT id, kategori, kode, nama, urutan, keterangan, aktif FROM label WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Hitung total label.
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM label');
    return parseCount(result.rows[0]?.total);
  }

  /**
   * Simpan (insert/update) label.
  * @param {{ id?: number, kategori: string, kode: string, nama: string, urutan?: number|string, keterangan?: string }} data
   * @returns {Promise<Object|null>}
   */
  static async simpan({ id, kategori, kode, nama, urutan, keterangan, aktif }) {
    const nilaiUrutan = Number.isFinite(Number(urutan)) && Number(urutan) > 0
      ? Number.parseInt(urutan, 10)
      : 1;
    const nilaiAktif = normalizeBoolean(aktif, true);

    if (id) {
      const result = await db.query(
        `UPDATE label
         SET kategori = $1,
             kode = $2,
             nama = $3,
             urutan = $4,
             keterangan = $5,
             aktif = $6
         WHERE id = $7
         RETURNING id, kategori, kode, nama, urutan, keterangan, aktif`,
        [kategori, kode, nama, nilaiUrutan, keterangan || null, nilaiAktif, id]
      );
      return result.rows[0] || null;
    }

    const result = await db.query(
      `INSERT INTO label (kategori, kode, nama, urutan, keterangan, aktif)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, kategori, kode, nama, urutan, keterangan, aktif`,
      [kategori, kode, nama, nilaiUrutan, keterangan || null, nilaiAktif]
    );
    return result.rows[0];
  }

  /**
   * Hapus label berdasarkan ID.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM label WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }
}

module.exports = ModelLabel;
module.exports.__private = {
  normalisasiKategoriLabel,
  kandidatKategoriLabel,
  normalizeLabelValue,
  buildNilaiCocokLabel,
  urutkanLabelPrioritas,
  pushLabelUnik,
  normalizeBoolean,
};
