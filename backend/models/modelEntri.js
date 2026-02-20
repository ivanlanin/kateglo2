/**
 * @fileoverview Model untuk entri kamus (lema, makna, contoh)
 * Menggunakan tabel baru: entri, makna, contoh, label
 */

const db = require('../db');
const autocomplete = require('../db/autocomplete');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');
const { decodeCursor, encodeCursor } = require('../utils/cursorPagination');

function normalisasiIndeks(entri = '') {
  const tanpaNomor = entri.replace(/\s*\([0-9]+\)\s*$/, '');
  const tanpaStripTepi = tanpaNomor.replace(/^-+/, '').replace(/-+$/, '');
  return tanpaStripTepi.trim() || entri.trim();
}

function parseNullableInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

class ModelEntri {
  static async cariIndukAdmin(query, { limit = 8, excludeId = null } = {}) {
    const trimmed = String(query || '').trim();
    if (!trimmed) return [];

    const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);
    const parsedExcludeId = parseNullableInteger(excludeId);
    const params = [trimmed, `${trimmed}%`, `%${trimmed}%`];
    const conditions = ['e.aktif = 1', 'e.entri ILIKE $3'];

    if (parsedExcludeId) {
      conditions.push(`e.id <> $${params.length + 1}`);
      params.push(parsedExcludeId);
    }

    params.push(cappedLimit);

    const result = await db.query(
      `SELECT e.id, e.entri, e.indeks, e.jenis
       FROM entri e
       WHERE ${conditions.join(' AND ')}
       ORDER BY
         CASE WHEN LOWER(e.entri) = LOWER($1) THEN 0
              WHEN e.entri ILIKE $2 THEN 1
              ELSE 2 END,
         e.entri ASC,
         e.id ASC
       LIMIT $${params.length}`,
      params
    );

    return result.rows;
  }

  static async autocomplete(query, limit = 8) {
    return autocomplete('entri', 'indeks', query, { limit, extraWhere: 'aktif = 1' });
  }

  /**
  * Cari entri di kamus dengan strategi prefix-first + contains-fallback
   * @param {string} query - Kata pencarian
   * @param {number} limit - Batas hasil
  * @returns {Promise<Array>} Daftar entri dengan preview makna
   */
  static async cariEntri(query, limit = 100, offset = 0, hitungTotal = true) {
    const normalizedQuery = query.trim();
    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);

    // Gunakan UNION untuk menggabungkan prefix dan contains dengan urutan stabil
    const baseSql = `
      WITH hasil AS (
           SELECT id, entri, indeks, homograf, homonim, jenis, lafal, jenis_rujuk, lema_rujuk AS entri_rujuk,
            CASE WHEN LOWER(entri) = LOWER($1) THEN 0
              WHEN entri ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas
           FROM entri
           WHERE entri ILIKE $3 AND aktif = 1
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
      SELECT id, entri, indeks, homograf, homonim, jenis, lafal, jenis_rujuk, entri_rujuk
       FROM hasil
          ORDER BY prioritas, homograf ASC NULLS LAST, homonim ASC NULLS LAST, entri ASC
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
      SELECT id, entri, indeks, homograf, homonim, jenis, lafal, jenis_rujuk, entri_rujuk
       FROM hasil
          ORDER BY prioritas, homograf ASC NULLS LAST, homonim ASC NULLS LAST, entri ASC
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

  static async cariEntriCursor(query, {
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
        SELECT id, entri, indeks, homograf, homonim, jenis, lafal, jenis_rujuk, lema_rujuk AS entri_rujuk,
               CASE WHEN LOWER(entri) = LOWER($1) THEN 0
                    WHEN entri ILIKE $2 THEN 1
                    ELSE 2 END AS prioritas,
               COALESCE(homograf, 2147483647) AS homograf_sort,
               COALESCE(homonim, 2147483647) AS homonim_sort
        FROM entri
        WHERE entri ILIKE $3 AND aktif = 1
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
        Number(cursorPayload.homografSort) || 2147483647,
        Number(cursorPayload.homonimSort) || 2147483647,
        String(cursorPayload.entri || ''),
        Number(cursorPayload.id) || 0
      );
      if (isPrev) {
        whereCursor.push(`(prioritas, homograf_sort, homonim_sort, entri, id) < ($4, $5, $6, $7, $8)`);
      } else {
        whereCursor.push(`(prioritas, homograf_sort, homonim_sort, entri, id) > ($4, $5, $6, $7, $8)`);
      }
    }

    const whereClause = whereCursor.length ? `WHERE ${whereCursor.join(' AND ')}` : '';
    params.push(cappedLimit + 1);

    const dataResult = await db.query(
      `${baseSql}
      SELECT id, entri, indeks, homograf, homonim, jenis, lafal, jenis_rujuk, entri_rujuk,
             prioritas, homograf_sort, homonim_sort
      FROM hasil
      ${whereClause}
      ORDER BY
        prioritas ${orderDesc ? 'DESC' : 'ASC'},
        homograf_sort ${orderDesc ? 'DESC' : 'ASC'},
        homonim_sort ${orderDesc ? 'DESC' : 'ASC'},
        entri ${orderDesc ? 'DESC' : 'ASC'},
        id ${orderDesc ? 'DESC' : 'ASC'}
      LIMIT $${params.length}`,
      params
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) {
      rows = rows.reverse();
    }

    const data = rows.map(({ prioritas: _p, homograf_sort: _hs, homonim_sort: _hms, ...item }) => item);
    const first = rows[0];
    const last = rows[rows.length - 1];

    const prevCursor = first
      ? encodeCursor({
        prioritas: first.prioritas,
        homografSort: first.homograf_sort,
        homonimSort: first.homonim_sort,
        entri: first.entri,
        id: first.id,
      })
      : null;
    const nextCursor = last
      ? encodeCursor({
        prioritas: last.prioritas,
        homografSort: last.homograf_sort,
        homonimSort: last.homonim_sort,
        entri: last.entri,
        id: last.id,
      })
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
  * Ambil entri berdasarkan teks (case-insensitive)
  * @param {string} teks - Teks entri
  * @returns {Promise<Object|null>} Data entri
   */
  static async ambilEntri(teks) {
    const result = await db.query(
            `SELECT id, legacy_eid, entri, indeks, homograf, homonim, jenis, induk, pemenggalan, lafal, varian,
              jenis_rujuk, lema_rujuk AS entri_rujuk, sumber, aktif
       FROM entri
       WHERE LOWER(entri) = LOWER($1)
       LIMIT 1`,
      [teks]
    );
    return result.rows[0] || null;
  }

  static async ambilEntriPerIndeks(indeks) {
    const result = await db.query(
      `SELECT id, legacy_eid, entri, indeks, homograf, homonim, jenis, induk, pemenggalan, lafal, varian,
              jenis_rujuk, lema_rujuk AS entri_rujuk, sumber, aktif,
              to_char(created_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS created_at,
              to_char(updated_at, 'YYYY-MM-DD HH24:MI:SS.MS') AS updated_at
       FROM entri
       WHERE LOWER(indeks) = LOWER($1) AND aktif = 1
       ORDER BY
         homograf ASC NULLS LAST,
         homonim ASC NULLS LAST,
         entri ASC,
         id ASC`,
      [indeks]
    );
    return result.rows;
  }

  /**
  * Ambil semua makna untuk sebuah entri
  * @param {number} entriId - ID entri
   * @returns {Promise<Array>} Daftar makna dengan contoh
   */
  static async ambilMakna(entriId, aktifSaja = false) {
    const kondisiAktif = aktifSaja ? 'AND aktif = TRUE' : '';
    const result = await db.query(
      `SELECT id, polisem, urutan, makna, ragam, ragam_varian,
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, aktif,
              ilmiah, kimia
       FROM makna
      WHERE entri_id = $1
        ${kondisiAktif}
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
  static async ambilContoh(maknaIds, aktifSaja = false) {
    if (!maknaIds.length) return [];
    const kondisiAktif = aktifSaja ? 'AND aktif = TRUE' : '';
    const result = await db.query(
      `SELECT id, makna_id, urutan, contoh, ragam, bahasa, bidang,
              kiasan, makna_contoh, aktif
       FROM contoh
       WHERE makna_id = ANY($1::int[])
         ${kondisiAktif}
       ORDER BY makna_id, urutan ASC, id ASC`,
      [maknaIds]
    );
    return result.rows;
  }

  /**
  * Ambil subentri (turunan, gabungan, idiom, peribahasa) dari entri induk
  * @param {number} indukId - ID entri induk
  * @returns {Promise<Array>} Daftar subentri
   */
  static async ambilSubentri(indukId) {
    const result = await db.query(
      `SELECT id, entri, indeks, homograf, homonim, jenis, lafal
       FROM entri
       WHERE induk = $1 AND aktif = 1
       ORDER BY jenis, homograf ASC NULLS LAST, homonim ASC NULLS LAST, entri ASC`,
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
         SELECT id, entri, indeks, induk, 1 AS depth
         FROM entri WHERE id = $1
         UNION ALL
         SELECT p.id, p.entri, p.indeks, p.induk, r.depth + 1
         FROM entri p
         JOIN rantai r ON r.induk = p.id
         WHERE r.depth < 5
       )
       SELECT id, entri, indeks FROM rantai ORDER BY depth DESC`,
      [indukId]
    );
    return result.rows;
  }

  /**
   * Daftar lema untuk panel admin (dengan pencarian opsional)
   * @param {{ limit?: number, offset?: number, q?: string, jenis?: string, jenis_rujuk?: string }} options
   * @returns {Promise<{ data: Array, total: number }>}
   */
  static async daftarAdmin({
    limit = 50,
    offset = 0,
    q = '',
    aktif = '',
    jenis = '',
    jenis_rujuk = '',
    punya_homograf = '',
    punya_homonim = '',
    kelas_kata = '',
    ragam = '',
    bidang = '',
    bahasa = '',
    punya_ilmiah = '',
    punya_kimia = '',
    tipe_penyingkat = '',
    punya_contoh = '',
  } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`e.entri ILIKE $${idx}`);
      params.push(`%${q}%`);
      idx++;
    }

    if (aktif === '1') {
      conditions.push('e.aktif = 1');
    } else if (aktif === '0') {
      conditions.push('e.aktif = 0');
    }

    if (jenis) {
      conditions.push(`e.jenis = $${idx}`);
      params.push(jenis);
      idx++;
    }

    if (jenis_rujuk) {
      conditions.push(`e.jenis_rujuk = $${idx}`);
      params.push(jenis_rujuk);
      idx++;
    }

    if (punya_homograf === '1') {
      conditions.push('e.homograf IS NOT NULL');
    } else if (punya_homograf === '0') {
      conditions.push('e.homograf IS NULL');
    }

    if (punya_homonim === '1') {
      conditions.push('e.homonim IS NOT NULL');
    } else if (punya_homonim === '0') {
      conditions.push('e.homonim IS NULL');
    }

    if (kelas_kata) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.kelas_kata = $${idx}
      )`);
      params.push(kelas_kata);
      idx++;
    }

    if (ragam) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.ragam = $${idx}
      )`);
      params.push(ragam);
      idx++;
    }

    if (bidang) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.bidang = $${idx}
      )`);
      params.push(bidang);
      idx++;
    }

    if (bahasa) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.bahasa = $${idx}
      )`);
      params.push(bahasa);
      idx++;
    }

    if (tipe_penyingkat) {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.tipe_penyingkat = $${idx}
      )`);
      params.push(tipe_penyingkat);
      idx++;
    }

    if (punya_ilmiah === '1') {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.ilmiah IS NOT NULL
          AND BTRIM(mk.ilmiah) <> ''
      )`);
    } else if (punya_ilmiah === '0') {
      conditions.push(`NOT EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.ilmiah IS NOT NULL
          AND BTRIM(mk.ilmiah) <> ''
      )`);
    }

    if (punya_kimia === '1') {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.kimia IS NOT NULL
          AND BTRIM(mk.kimia) <> ''
      )`);
    } else if (punya_kimia === '0') {
      conditions.push(`NOT EXISTS (
        SELECT 1
        FROM makna mk
        WHERE mk.entri_id = e.id
          AND mk.kimia IS NOT NULL
          AND BTRIM(mk.kimia) <> ''
      )`);
    }

    if (punya_contoh === '1') {
      conditions.push(`EXISTS (
        SELECT 1
        FROM makna mk
        JOIN contoh c ON c.makna_id = mk.id
        WHERE mk.entri_id = e.id
      )`);
    } else if (punya_contoh === '0') {
      conditions.push(`NOT EXISTS (
        SELECT 1
        FROM makna mk
        JOIN contoh c ON c.makna_id = mk.id
        WHERE mk.entri_id = e.id
      )`);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM entri e ${where}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    const dataResult = await db.query(
      `SELECT
          e.id,
          e.entri,
          e.indeks,
          e.homograf,
          e.homonim,
          e.jenis,
          e.induk,
          induk.entri AS induk_entri,
          e.lafal,
          e.sumber,
           COALESCE(mk_stat.jumlah_makna, 0) AS jumlah_makna,
          e.aktif,
          e.jenis_rujuk,
          e.lema_rujuk AS entri_rujuk
       FROM entri e
       LEFT JOIN entri induk ON induk.id = e.induk
         LEFT JOIN LATERAL (
          SELECT COUNT(*)::int AS jumlah_makna
          FROM makna mk
          WHERE mk.entri_id = e.id
         ) mk_stat ON TRUE
       ${where}
       ORDER BY e.indeks ASC, e.homograf ASC NULLS LAST, e.homonim ASC NULLS LAST, e.entri ASC
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
    return parseCount(result.rows[0]?.total);
  }

  /**
  * Ambil entri berdasarkan ID (untuk admin)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
            `SELECT e.id, e.entri, e.indeks, e.homograf, e.homonim, e.jenis, e.induk,
              i.entri AS induk_entri, i.indeks AS induk_indeks,
              e.pemenggalan, e.lafal, e.varian,
              e.jenis_rujuk, e.lema_rujuk AS entri_rujuk, e.sumber, e.aktif
       FROM entri e
       LEFT JOIN entri i ON i.id = e.induk
       WHERE e.id = $1`,
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
  static async simpan({
    id,
    entri,
    jenis,
    induk,
    pemenggalan,
    lafal,
    varian,
    jenis_rujuk,
    entri_rujuk,
    aktif,
    indeks,
    homograf,
    homonim,
    sumber,
  }) {
    const nilaiEntri = entri;
    const nilaiEntriRujuk = entri_rujuk;
    const nilaiIndeks = (indeks || '').trim() || normalisasiIndeks(nilaiEntri);
    const nilaiInduk = parseNullableInteger(induk);
    const nilaiId = parseNullableInteger(id);
    const nilaiHomograf = parseNullableInteger(homograf);
    const nilaiHomonim = parseNullableInteger(homonim);
    const nilaiSumber = String(sumber || '').trim() || null;

    if (nilaiId && nilaiInduk && nilaiId === nilaiInduk) {
      const error = new Error('Induk tidak boleh sama dengan entri ini');
      error.status = 400;
      throw error;
    }

    if (nilaiInduk) {
      const indukAda = await this.ambilInduk(nilaiInduk);
      if (!indukAda) {
        const error = new Error('Entri induk tidak ditemukan');
        error.status = 400;
        throw error;
      }
    }

    if (id) {
      const result = await db.query(
        `UPDATE entri SET entri = $1, jenis = $2, induk = $3, pemenggalan = $4,
                lafal = $5, varian = $6, jenis_rujuk = $7, lema_rujuk = $8, aktif = $9,
                indeks = $10, homograf = $11, homonim = $12, sumber = $13
         WHERE id = $14
         RETURNING id, legacy_eid, entri, indeks, homograf, homonim, jenis, induk, pemenggalan, lafal, varian,
             jenis_rujuk, lema_rujuk AS entri_rujuk, sumber, aktif, legacy_tabel, legacy_tid`,
        [nilaiEntri, jenis, nilaiInduk, pemenggalan || null, lafal || null,
         varian || null, jenis_rujuk || null, nilaiEntriRujuk || null, aktif ?? 1,
         nilaiIndeks, nilaiHomograf, nilaiHomonim, nilaiSumber, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO entri (entri, jenis, induk, pemenggalan, lafal, varian, jenis_rujuk, lema_rujuk, aktif, indeks, homograf, homonim, sumber)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       RETURNING id, legacy_eid, entri, indeks, homograf, homonim, jenis, induk, pemenggalan, lafal, varian,
         jenis_rujuk, lema_rujuk AS entri_rujuk, sumber, aktif, legacy_tabel, legacy_tid`,
      [nilaiEntri, jenis, nilaiInduk, pemenggalan || null, lafal || null,
       varian || null, jenis_rujuk || null, nilaiEntriRujuk || null, aktif ?? 1,
       nilaiIndeks, nilaiHomograf, nilaiHomonim, nilaiSumber]
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
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia, aktif
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
    kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia, aktif }) {
    const targetEntriId = entri_id;
    const nilaiAktif = normalizeBoolean(aktif, true);
    if (id) {
      const result = await db.query(
        `UPDATE makna SET entri_id = $1, polisem = $2, urutan = $3, makna = $4,
                ragam = $5, ragam_varian = $6, kelas_kata = $7, bahasa = $8,
                bidang = $9, kiasan = $10, tipe_penyingkat = $11, ilmiah = $12, kimia = $13, aktif = $14
         WHERE id = $15
         RETURNING id, entri_id, polisem, urutan, makna, ragam, ragam_varian,
                   kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia, aktif`,
        [targetEntriId, polisem ?? 1, urutan ?? 1, makna,
         ragam || null, ragam_varian || null, kelas_kata || null, bahasa || null,
         bidang || null, kiasan ?? 0, tipe_penyingkat || null, ilmiah || null, kimia || null, nilaiAktif, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO makna (entri_id, polisem, urutan, makna, ragam, ragam_varian,
              kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia, aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, entri_id, polisem, urutan, makna, ragam, ragam_varian,
                 kelas_kata, bahasa, bidang, kiasan, tipe_penyingkat, ilmiah, kimia, aktif`,
      [targetEntriId, polisem ?? 1, urutan ?? 1, makna,
       ragam || null, ragam_varian || null, kelas_kata || null, bahasa || null,
       bidang || null, kiasan ?? 0, tipe_penyingkat || null, ilmiah || null, kimia || null, nilaiAktif]
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
              kiasan, makna_contoh, aktif
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
  static async simpanContoh({ id, makna_id, urutan, contoh, ragam, bahasa, bidang, kiasan, makna_contoh, aktif }) {
    const nilaiAktif = normalizeBoolean(aktif, true);
    if (id) {
      const result = await db.query(
        `UPDATE contoh SET makna_id = $1, urutan = $2, contoh = $3, ragam = $4,
                bahasa = $5, bidang = $6, kiasan = $7, makna_contoh = $8, aktif = $9
         WHERE id = $10 RETURNING *`,
        [makna_id, urutan ?? 1, contoh, ragam || null, bahasa || null,
         bidang || null, kiasan ?? 0, makna_contoh || null, nilaiAktif, id]
      );
      return result.rows[0];
    }
    const result = await db.query(
      `INSERT INTO contoh (makna_id, urutan, contoh, ragam, bahasa, bidang, kiasan, makna_contoh, aktif)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [makna_id, urutan ?? 1, contoh, ragam || null, bahasa || null,
       bidang || null, kiasan ?? 0, makna_contoh || null, nilaiAktif]
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
module.exports.__private = {
  normalisasiIndeks,
  parseNullableInteger,
  normalizeBoolean,
};
