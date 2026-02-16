/**
 * @fileoverview Model untuk entri kamus (lema, makna, contoh)
 * Menggunakan tabel baru: entri, makna, contoh, label
 */

const db = require('../db');
const autocomplete = require('../db/autocomplete');

class ModelEntri {
  static normalisasiKunciEntri(teks) {
    if (!teks) return '';
    return teks
      .trim()
      .toLowerCase()
      .replace(/\s*\(\d+\)\s*$/, '')
      .replace(/-/g, '');
  }

  static async autocomplete(query, limit = 8) {
    return autocomplete('entri', 'entri', query, { limit, extraWhere: 'aktif = 1' });
  }

  /**
  * Cari entri di kamus dengan strategi prefix-first + contains-fallback
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
  * @returns {Promise<Array>} Daftar entri dengan preview makna
   */
  static async cariEntri(query, limit = 100, offset = 0) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    // Gunakan UNION untuk menggabungkan prefix dan contains dengan urutan stabil
    const baseSql = `
      WITH hasil AS (
           SELECT id, entri, jenis, lafal, jenis_rujuk, lema_rujuk AS entri_rujuk,
            CASE WHEN LOWER(entri) = LOWER($1) THEN 0
              WHEN entri ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas
           FROM entri
           WHERE entri ILIKE $3 AND aktif = 1
      )`;

    const countResult = await db.query(
      `${baseSql} SELECT COUNT(*) AS total FROM hasil`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`]
    );
    const total = parseInt(countResult.rows[0].total, 10);

    if (total === 0) {
      return { data: [], total: 0 };
    }

    const dataResult = await db.query(
      `${baseSql}
      SELECT id, entri, jenis, lafal, jenis_rujuk, entri_rujuk
       FROM hasil
          ORDER BY prioritas, entri ASC
       LIMIT $4 OFFSET $5`,
      [normalizedQuery, `${normalizedQuery}%`, `%${normalizedQuery}%`, cappedLimit, safeOffset]
    );

    return { data: dataResult.rows, total };
  }

  /**
  * Ambil entri berdasarkan teks (case-insensitive)
  * @param {string} teks - Teks entri
  * @returns {Promise<Object|null>} Data entri
   */
  static async ambilEntri(teks) {
    const result = await db.query(
            `SELECT id, legacy_eid, entri, jenis, induk, pemenggalan, lafal, varian,
              jenis_rujuk, lema_rujuk AS entri_rujuk, aktif
       FROM entri
       WHERE LOWER(entri) = LOWER($1)
       LIMIT 1`,
      [teks]
    );
    return result.rows[0] || null;
  }

  /**
  * Ambil daftar entri serupa (homonim/homofon/homograf berbasis normalisasi)
  * @param {string} teks - Teks entri acuan
   * @param {number} limit - Batas hasil
  * @returns {Promise<Array>} Daftar entri ringkas {id, entri, lafal}
   */
  static async ambilEntriSerupa(teks, limit = 20) {
    const kunci = ModelEntri.normalisasiKunciEntri(teks);
    if (!kunci) return [];

    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);

    const result = await db.query(
      `SELECT id, entri, lafal
       FROM entri
       WHERE aktif = 1
         AND LOWER(REGEXP_REPLACE(REPLACE(entri, '-', ''), '\\s*\\([0-9]+\\)\\s*$', '')) = $1
       ORDER BY
         CASE WHEN LOWER(entri) = LOWER($2) THEN 0 ELSE 1 END,
         COALESCE(((regexp_match(entri, '\\(([0-9]+)\\)\\s*$'))[1])::int, 2147483647),
         entri ASC
       LIMIT $3`,
      [kunci, teks, cappedLimit]
    );

    return result.rows;
  }

  /**
  * Ambil semua makna untuk sebuah entri
  * @param {number} entriId - ID entri
   * @returns {Promise<Array>} Daftar makna dengan contoh
   */
  static async ambilMakna(entriId) {
    const result = await db.query(
      `SELECT id, polisem, urutan, makna, ragam, ragam_varian,
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat,
              ilmiah, kimia
       FROM makna
      WHERE entri_id = $1
       ORDER BY urutan ASC, id ASC`,
      [entriId]
    );
    return result.rows;
  }

  /**
   * Ambil contoh untuk satu atau lebih makna
   * @param {number[]} maknaIds - Daftar ID makna
   * @returns {Promise<Array>} Daftar contoh
   */
  static async ambilContoh(maknaIds) {
    if (!maknaIds.length) return [];
    const result = await db.query(
      `SELECT id, makna_id, urutan, contoh, ragam, bahasa, bidang,
              kiasan, makna_contoh
       FROM contoh
       WHERE makna_id = ANY($1::int[])
       ORDER BY makna_id, urutan ASC, id ASC`,
      [maknaIds]
    );
    return result.rows;
  }

  /**
  * Ambil subentri (berimbuhan, gabungan, idiom, peribahasa) dari entri induk
  * @param {number} indukId - ID entri induk
  * @returns {Promise<Array>} Daftar subentri
   */
  static async ambilSubentri(indukId) {
    const result = await db.query(
      `SELECT id, entri, jenis, lafal
       FROM entri
       WHERE induk = $1 AND aktif = 1
       ORDER BY jenis, entri`,
      [indukId]
    );
    return result.rows;
  }

  /**
  * Ambil entri induk
  * @param {number} indukId - ID entri induk
  * @returns {Promise<Object|null>} Data entri induk
   */
  /**
   * Saran lema mirip menggunakan trigram similarity (pg_trgm)
   * @param {string} teks - Kata yang dicari
   * @param {number} limit - Batas hasil
  * @returns {Promise<string[]>} Daftar entri mirip
   */
  static async saranEntri(teks, limit = 5) {
    if (!teks || !teks.trim()) return [];
    const cappedLimit = Math.min(Math.max(Number(limit) || 5, 1), 20);
    const result = await db.query(
      `SELECT entri FROM (
        SELECT DISTINCT entri, similarity(entri, $1) AS sim
        FROM entri
        WHERE aktif = 1 AND similarity(entri, $1) > 0.2
       ) t
       ORDER BY sim DESC
       LIMIT $2`,
      [teks.trim(), cappedLimit]
    );
    return result.rows.map((r) => r.entri);
  }

  static async ambilInduk(indukId) {
    if (!indukId) return null;
    const result = await db.query(
      `SELECT id, entri, jenis
       FROM entri
       WHERE id = $1`,
      [indukId]
    );
    return result.rows[0] || null;
  }

  /**
   * Ambil rantai induk (ancestor chain) dari bawah ke atas, maks 5 level
   * @param {number} indukId - ID induk langsung
  * @returns {Promise<Array>} Rantai dari akar ke induk langsung [{id, entri}, ...]
   */
  static async ambilRantaiInduk(indukId) {
    if (!indukId) return [];
    const result = await db.query(
      `WITH RECURSIVE rantai AS (
         SELECT id, entri, induk, 1 AS depth
         FROM entri WHERE id = $1
         UNION ALL
         SELECT p.id, p.entri, p.induk, r.depth + 1
         FROM entri p
         JOIN rantai r ON r.induk = p.id
         WHERE r.depth < 5
       )
       SELECT id, entri FROM rantai ORDER BY depth DESC`,
      [indukId]
    );
    return result.rows;
  }

  /**
   * Daftar lema untuk panel admin (dengan pencarian opsional)
   * @param {{ limit?: number, offset?: number, q?: string }} options
   * @returns {Promise<{ data: Array, total: number }>}
   */
  static async daftarAdmin({ limit = 50, offset = 0, q = '' } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`entri ILIKE $${idx}`);
      params.push(`%${q}%`);
      idx++;
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM entri ${where}`,
      params
    );
    const total = parseInt(countResult.rows[0].total, 10);

    const dataResult = await db.query(
      `SELECT id, entri, jenis, lafal, aktif, jenis_rujuk, lema_rujuk AS entri_rujuk
       FROM entri ${where}
       ORDER BY entri ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    );

    return { data: dataResult.rows, total };
  }

  /**
  * Hitung total entri
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM entri');
    return parseInt(result.rows[0].total, 10);
  }

  /**
  * Ambil entri berdasarkan ID (untuk admin)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
            `SELECT id, entri, jenis, induk, pemenggalan, lafal, varian,
              jenis_rujuk, lema_rujuk AS entri_rujuk, aktif
       FROM entri WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
  * Simpan (insert atau update) entri
  * @param {Object} data - Data entri
   * @param {number} [data.id] - ID untuk update, null/undefined untuk insert
  * @returns {Promise<Object>} Baris entri yang disimpan
   */
  static async simpan({ id, entri, jenis, induk, pemenggalan, lafal, varian, jenis_rujuk, entri_rujuk, aktif }) {
    const nilaiEntri = entri;
    const nilaiEntriRujuk = entri_rujuk;
    if (id) {
      const result = await db.query(
        `UPDATE entri SET entri = $1, jenis = $2, induk = $3, pemenggalan = $4,
                lafal = $5, varian = $6, jenis_rujuk = $7, lema_rujuk = $8, aktif = $9
         WHERE id = $10
         RETURNING id, legacy_eid, entri, jenis, induk, pemenggalan, lafal, varian,
             jenis_rujuk, lema_rujuk AS entri_rujuk, aktif, legacy_tabel, legacy_tid`,
        [nilaiEntri, jenis, induk || null, pemenggalan || null, lafal || null,
         varian || null, jenis_rujuk || null, nilaiEntriRujuk || null, aktif ?? 1, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO entri (entri, jenis, induk, pemenggalan, lafal, varian, jenis_rujuk, lema_rujuk, aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, legacy_eid, entri, jenis, induk, pemenggalan, lafal, varian,
         jenis_rujuk, lema_rujuk AS entri_rujuk, aktif, legacy_tabel, legacy_tid`,
      [nilaiEntri, jenis, induk || null, pemenggalan || null, lafal || null,
       varian || null, jenis_rujuk || null, nilaiEntriRujuk || null, aktif ?? 1]
    );
    return result.rows[0];
  }

  /**
  * Hapus entri berdasarkan ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM entri WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  // ─── Makna CRUD ──────────────────────────────────────────────────────────

  /**
   * Ambil satu makna berdasarkan ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilMaknaById(id) {
    const result = await db.query(
      `SELECT id, entri_id, polisem, urutan, makna, ragam, ragam_varian,
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia
       FROM makna WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
  * Simpan (insert atau update) makna
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async simpanMakna({ id, entri_id, polisem, urutan, makna, ragam, ragam_varian,
    kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia }) {
    const targetEntriId = entri_id;
    if (id) {
      const result = await db.query(
        `UPDATE makna SET entri_id = $1, polisem = $2, urutan = $3, makna = $4,
                ragam = $5, ragam_varian = $6, kelas_kata = $7, bahasa = $8,
                bidang = $9, kiasan = $10, tipe_penyingkat = $11, ilmiah = $12, kimia = $13
         WHERE id = $14
         RETURNING id, entri_id, polisem, urutan, makna, ragam, ragam_varian,
                   kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia`,
        [targetEntriId, polisem ?? 1, urutan ?? 1, makna,
         ragam || null, ragam_varian || null, kelas_kata || null, bahasa || null,
         bidang || null, kiasan ?? 0, tipe_penyingkat || null, ilmiah || null, kimia || null, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO makna (entri_id, polisem, urutan, makna, ragam, ragam_varian,
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING id, entri_id, polisem, urutan, makna, ragam, ragam_varian,
                 kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia`,
      [targetEntriId, polisem ?? 1, urutan ?? 1, makna,
       ragam || null, ragam_varian || null, kelas_kata || null, bahasa || null,
       bidang || null, kiasan ?? 0, tipe_penyingkat || null, ilmiah || null, kimia || null]
    );
    return result.rows[0];
  }

  /**
   * Hapus makna (cascade juga hapus contoh)
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapusMakna(id) {
    const result = await db.query('DELETE FROM makna WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  // ─── Contoh CRUD ─────────────────────────────────────────────────────────

  /**
   * Ambil satu contoh berdasarkan ID
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilContohById(id) {
    const result = await db.query(
      `SELECT id, makna_id, urutan, contoh, ragam, bahasa, bidang,
              kiasan, makna_contoh
       FROM contoh WHERE id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Simpan (insert atau update) contoh
   * @param {Object} data
   * @returns {Promise<Object>}
   */
  static async simpanContoh({ id, makna_id, urutan, contoh, ragam, bahasa, bidang, kiasan, makna_contoh }) {
    if (id) {
      const result = await db.query(
        `UPDATE contoh SET makna_id = $1, urutan = $2, contoh = $3, ragam = $4,
                bahasa = $5, bidang = $6, kiasan = $7, makna_contoh = $8
         WHERE id = $9 RETURNING *`,
        [makna_id, urutan ?? 1, contoh, ragam || null, bahasa || null,
         bidang || null, kiasan ?? 0, makna_contoh || null, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO contoh (makna_id, urutan, contoh, ragam, bahasa, bidang, kiasan, makna_contoh)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [makna_id, urutan ?? 1, contoh, ragam || null, bahasa || null,
       bidang || null, kiasan ?? 0, makna_contoh || null]
    );
    return result.rows[0];
  }

  /**
   * Hapus contoh berdasarkan ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapusContoh(id) {
    const result = await db.query('DELETE FROM contoh WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

}

module.exports = ModelEntri;
