/**
 * @fileoverview Model untuk tabel tagar dan entri_tagar (tagar morfologis entri kamus)
 */

const db = require('../db');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');
const { decodeCursor, encodeCursor } = require('../utils/cursorPagination');

const KATEGORI_VALID = ['prefiks', 'sufiks', 'infiks', 'klitik', 'reduplikasi', 'prakategorial'];

function buildAdminWhereClause({ q = '', kategori = '', aktif = '' } = {}) {
  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(kode ILIKE $${params.length} OR nama ILIKE $${params.length} OR COALESCE(deskripsi, '') ILIKE $${params.length})`);
  }

  if (kategori && KATEGORI_VALID.includes(kategori)) {
    params.push(kategori);
    conditions.push(`kategori = $${params.length}`);
  }

  if (aktif === '1') {
    conditions.push('aktif = TRUE');
  } else if (aktif === '0') {
    conditions.push('aktif = FALSE');
  }

  return { conditions, params };
}

class ModelTagar {
  /**
   * Ambil semua tagar aktif sebagai flat array (untuk publik & dropdown).
   * Diurutkan berdasarkan kategori, urutan.
   * @returns {Promise<Array<{kode: string, nama: string, kategori: string}>>}
   */
  static async ambilSemuaTagar() {
    const result = await db.query(
      `SELECT id, kode, nama, kategori
       FROM tagar
       WHERE aktif = TRUE
       ORDER BY kategori, urutan, nama`
    );
    return result.rows;
  }

  /**
   * Ambil semua tagar untuk satu entri.
   * @param {number} entriId
   * @param {{ aktifSaja?: boolean }} options
   * @returns {Promise<Array<{id: number, kode: string, nama: string, kategori: string, aktif: boolean}>>}
   */
  static async ambilTagarEntri(entriId, { aktifSaja = false } = {}) {
    const result = await db.query(
      `SELECT t.id, t.kode, t.nama, t.kategori, t.aktif
       FROM tagar t
       JOIN entri_tagar et ON et.tagar_id = t.id
       WHERE et.entri_id = $1
       ${aktifSaja ? 'AND t.aktif = TRUE' : ''}
       ORDER BY t.kategori, t.urutan, t.nama`,
      [entriId]
    );
    return result.rows;
  }

  /**
   * Cari entri berdasarkan kode tagar (cursor pagination).
   * @param {string} kode - Kode tagar
   * @param {{ limit?, cursor?, direction?, lastPage?, hitungTotal? }} options
   */
  static async cariEntriPerTagar(kode, {
    limit = 100,
    cursor = null,
    direction = 'next',
    lastPage = false,
    hitungTotal = true,
  } = {}) {
    const tagarResult = await db.query(
      'SELECT id, kode, nama, kategori FROM tagar WHERE kode = $1 AND aktif = TRUE',
      [kode]
    );
    const tagar = tagarResult.rows[0] || null;
    if (!tagar) {
      return { data: [], total: 0, tagar: null, hasNext: false, hasPrev: false, nextCursor: null, prevCursor: null };
    }

    const cappedLimit = Math.min(Math.max(Number(limit) || 100, 1), 200);
    const cursorPayload = decodeCursor(cursor);
    const isPrev = direction === 'prev';
    const orderDesc = Boolean(lastPage || isPrev);

    let total = 0;
    if (hitungTotal) {
      const countResult = await db.query(
        `SELECT COUNT(*) AS total
         FROM entri e
         JOIN entri_tagar et ON et.entri_id = e.id
         WHERE et.tagar_id = $1 AND e.aktif = 1`,
        [tagar.id]
      );
      total = parseCount(countResult.rows[0]?.total);
      if (total === 0) {
        return { data: [], total: 0, tagar, hasNext: false, hasPrev: false, nextCursor: null, prevCursor: null };
      }
    }

    const queryParams = [tagar.id];
    let cursorClause = '';
    if (cursorPayload && !lastPage) {
      queryParams.push(String(cursorPayload.entri || ''), Number(cursorPayload.id) || 0);
      const entriIdx = queryParams.length - 1;
      const idIdx = queryParams.length;
      cursorClause = isPrev
        ? `AND (e.entri, e.id) < ($${entriIdx}, $${idIdx})`
        : `AND (e.entri, e.id) > ($${entriIdx}, $${idIdx})`;
    }

    queryParams.push(cappedLimit + 1);
    const limitIdx = queryParams.length;

    const dataResult = await db.query(
      `SELECT e.id, e.entri, e.indeks, e.jenis, e.jenis_rujuk, r.entri AS entri_rujuk
       FROM entri e
       JOIN entri_tagar et ON et.entri_id = e.id
       LEFT JOIN entri r ON r.id = e.entri_rujuk
       WHERE et.tagar_id = $1 AND e.aktif = 1
       ${cursorClause}
       ORDER BY e.entri ${orderDesc ? 'DESC' : 'ASC'}, e.id ${orderDesc ? 'DESC' : 'ASC'}
       LIMIT $${limitIdx}`,
      queryParams
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) rows = rows.reverse();

    const first = rows[0];
    const last = rows[rows.length - 1];
    const prevCursor = first ? encodeCursor({ entri: first.entri, id: first.id }) : null;
    const nextCursor = last ? encodeCursor({ entri: last.entri, id: last.id }) : null;

    let hasPrev = false;
    let hasNext = false;
    if (lastPage) {
      hasNext = false;
      hasPrev = total > rows.length;
    } else if (isPrev) {
      hasPrev = hasMore;
      hasNext = Boolean(cursorPayload);
    } else {
      hasPrev = Boolean(cursorPayload);
      hasNext = hasMore;
    }

    return { data: rows, total, tagar, hasNext, hasPrev, nextCursor, prevCursor };
  }

  /**
   * Daftar tagar untuk panel admin (cursor pagination).
   */
  static async daftarAdminCursor({
    limit = 50,
    cursor = null,
    direction = 'next',
    lastPage = false,
    q = '',
    kategori = '',
    aktif = '',
  } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const { conditions, params } = buildAdminWhereClause({ q, kategori, aktif });
    const baseParams = [...params];
    const cursorPayload = decodeCursor(cursor);
    const isPrev = direction === 'prev';
    const orderDesc = Boolean(lastPage || isPrev);

    const whereBase = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(`SELECT COUNT(*) AS total FROM tagar ${whereBase}`, baseParams);
    const total = parseCount(countResult.rows[0]?.total);

    if (total === 0) {
      return { data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null };
    }

    const queryParams = [...baseParams];
    const whereParts = [...conditions];

    if (cursorPayload && !lastPage) {
      queryParams.push(
        String(cursorPayload.kategori || ''),
        Number(cursorPayload.urutan) || 0,
        String(cursorPayload.nama || ''),
        Number(cursorPayload.id) || 0
      );
      const kategoriIdx = queryParams.length - 3;
      const urutanIdx = queryParams.length - 2;
      const namaIdx = queryParams.length - 1;
      const idIdx = queryParams.length;
      whereParts.push(
        isPrev
          ? `(kategori, urutan, nama, id) < ($${kategoriIdx}, $${urutanIdx}, $${namaIdx}, $${idIdx})`
          : `(kategori, urutan, nama, id) > ($${kategoriIdx}, $${urutanIdx}, $${namaIdx}, $${idIdx})`
      );
    }

    queryParams.push(cappedLimit + 1);
    const limitIdx = queryParams.length;
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const dataResult = await db.query(
      `SELECT t.id, t.kode, t.nama, t.kategori, t.deskripsi, t.urutan, t.aktif,
              COALESCE(et_count.jumlah_entri, 0) AS jumlah_entri
       FROM tagar
       t
       LEFT JOIN LATERAL (
         SELECT COUNT(*)::int AS jumlah_entri
         FROM entri_tagar et
         WHERE et.tagar_id = t.id
       ) et_count ON TRUE
       ${whereClause}
       ORDER BY t.kategori ${orderDesc ? 'DESC' : 'ASC'},
                t.urutan   ${orderDesc ? 'DESC' : 'ASC'},
                t.nama     ${orderDesc ? 'DESC' : 'ASC'},
                t.id       ${orderDesc ? 'DESC' : 'ASC'}
       LIMIT $${limitIdx}`,
      queryParams
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) rows = rows.reverse();

    const first = rows[0];
    const last = rows[rows.length - 1];
    const prevCursor = first
      ? encodeCursor({ kategori: first.kategori, urutan: first.urutan, nama: first.nama, id: first.id })
      : null;
    const nextCursor = last
      ? encodeCursor({ kategori: last.kategori, urutan: last.urutan, nama: last.nama, id: last.id })
      : null;

    let hasPrev = false;
    let hasNext = false;
    if (lastPage) {
      hasNext = false;
      hasPrev = total > rows.length;
    } else if (isPrev) {
      hasPrev = hasMore;
      hasNext = Boolean(cursorPayload);
    } else {
      hasPrev = Boolean(cursorPayload);
      hasNext = hasMore;
    }

    return { data: rows, total, hasPrev, hasNext, prevCursor, nextCursor };
  }

  /**
   * Ambil satu tagar berdasarkan ID.
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      'SELECT id, kode, nama, kategori, deskripsi, urutan, aktif FROM tagar WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Hitung statistik cakupan tagar pada entri turunan.
   * @returns {Promise<{total_turunan: number, sudah_bertagar: number}>}
   */
  static async hitungCakupan() {
    const result = await db.query(
      `SELECT
         (SELECT COUNT(*) FROM entri WHERE jenis = 'turunan' AND aktif = 1) AS total_turunan,
         (SELECT COUNT(DISTINCT entri_id)
          FROM entri_tagar et
          JOIN entri e ON e.id = et.entri_id
          WHERE e.jenis = 'turunan' AND e.aktif = 1) AS sudah_bertagar`
    );
    return {
      total_turunan: parseCount(result.rows[0]?.total_turunan),
      sudah_bertagar: parseCount(result.rows[0]?.sudah_bertagar),
    };
  }

  /**
   * Daftar entri untuk audit tagar di redaksi (cursor pagination).
   * @param {{ limit?: number, cursor?: string|null, direction?: 'next'|'prev', lastPage?: boolean,
   *   q?: string, tagarId?: number|null, jenis?: string, punyaTagar?: '0'|'1'|'' }} options
   * @returns {Promise<{data: Array, total: number, hasPrev: boolean, hasNext: boolean, prevCursor: string|null, nextCursor: string|null}>}
   */
  static async daftarEntriTagarAdminCursor({
    limit = 50,
    cursor = null,
    direction = 'next',
    lastPage = false,
    q = '',
    tagarId = null,
    jenis = '',
    punyaTagar = '',
  } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const cursorPayload = decodeCursor(cursor);
    const isPrev = direction === 'prev';
    const orderDesc = Boolean(lastPage || isPrev);

    const params = [];
    const conditions = ['e.aktif = 1'];

    if (q) {
      params.push(`%${q}%`);
      conditions.push(`(e.entri ILIKE $${params.length} OR COALESCE(i.entri, '') ILIKE $${params.length} OR e.indeks ILIKE $${params.length})`);
    }

    if (jenis) {
      params.push(jenis);
      conditions.push(`e.jenis = $${params.length}`);
    }

    if (Number.isFinite(Number(tagarId)) && Number(tagarId) > 0) {
      params.push(Number(tagarId));
      conditions.push(`EXISTS (SELECT 1 FROM entri_tagar et_filter WHERE et_filter.entri_id = e.id AND et_filter.tagar_id = $${params.length})`);
    }

    if (punyaTagar === '1') {
      conditions.push('EXISTS (SELECT 1 FROM entri_tagar et_exists WHERE et_exists.entri_id = e.id)');
    } else if (punyaTagar === '0') {
      conditions.push('NOT EXISTS (SELECT 1 FROM entri_tagar et_exists WHERE et_exists.entri_id = e.id)');
    }

    const whereBase = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total
       FROM entri e
       LEFT JOIN entri i ON i.id = e.induk
       ${whereBase}`,
      params
    );
    const total = parseCount(countResult.rows[0]?.total);

    if (total === 0) {
      return {
        data: [],
        total: 0,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      };
    }

    const dataParams = [...params];
    const dataConditions = [...conditions];

    if (cursorPayload && !lastPage) {
      dataParams.push(String(cursorPayload.entri || ''), Number(cursorPayload.id) || 0);
      const entriIdx = dataParams.length - 1;
      const idIdx = dataParams.length;
      dataConditions.push(
        isPrev
          ? `(e.entri, e.id) < ($${entriIdx}, $${idIdx})`
          : `(e.entri, e.id) > ($${entriIdx}, $${idIdx})`
      );
    }

    dataParams.push(cappedLimit + 1);
    const limitIdx = dataParams.length;
    const whereData = dataConditions.length ? `WHERE ${dataConditions.join(' AND ')}` : '';

    const dataResult = await db.query(
      `SELECT
         e.id,
         e.entri,
         e.indeks,
         e.jenis,
         i.entri AS induk_entri,
         COALESCE(tg.items, '[]'::json) AS tagar,
         COALESCE(tg.total, 0) AS jumlah_tagar
       FROM entri e
       LEFT JOIN entri i ON i.id = e.induk
       LEFT JOIN LATERAL (
         SELECT
           json_agg(
             json_build_object(
               'id', t.id,
               'kode', t.kode,
               'nama', t.nama,
               'kategori', t.kategori
             )
             ORDER BY t.kategori, t.urutan, t.nama
           ) AS items,
           COUNT(*)::int AS total
         FROM entri_tagar et
         JOIN tagar t ON t.id = et.tagar_id
         WHERE et.entri_id = e.id
       ) tg ON TRUE
       ${whereData}
       ORDER BY e.entri ${orderDesc ? 'DESC' : 'ASC'}, e.id ${orderDesc ? 'DESC' : 'ASC'}
       LIMIT $${limitIdx}`,
      dataParams
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) rows = rows.reverse();

    const first = rows[0];
    const last = rows[rows.length - 1];
    const prevCursor = first ? encodeCursor({ entri: first.entri, id: first.id }) : null;
    const nextCursor = last ? encodeCursor({ entri: last.entri, id: last.id }) : null;

    let hasPrev = false;
    let hasNext = false;
    if (lastPage) {
      hasNext = false;
      hasPrev = total > rows.length;
    } else if (isPrev) {
      hasPrev = hasMore;
      hasNext = Boolean(cursorPayload);
    } else {
      hasPrev = Boolean(cursorPayload);
      hasNext = hasMore;
    }

    return {
      data: rows,
      total,
      hasPrev,
      hasNext,
      prevCursor,
      nextCursor,
    };
  }

  /**
   * Simpan (insert/update) tagar.
   * @param {{ id?: number, kode: string, nama: string, kategori: string, deskripsi?: string, urutan?: number, aktif?: boolean }} data
   * @returns {Promise<Object|null>}
   */
  static async simpan({ id, kode, nama, kategori, deskripsi, urutan, aktif }) {
    const nilaiUrutan = Number.isFinite(Number(urutan)) && Number(urutan) > 0
      ? Number.parseInt(urutan, 10)
      : 1;
    const nilaiAktif = normalizeBoolean(aktif, true);

    if (id) {
      const result = await db.query(
        `UPDATE tagar
         SET kode = $1, nama = $2, kategori = $3, deskripsi = $4, urutan = $5, aktif = $6
         WHERE id = $7
         RETURNING id, kode, nama, kategori, deskripsi, urutan, aktif`,
        [kode, nama, kategori, deskripsi || null, nilaiUrutan, nilaiAktif, id]
      );
      return result.rows[0] || null;
    }

    const result = await db.query(
      `INSERT INTO tagar (kode, nama, kategori, deskripsi, urutan, aktif)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, kode, nama, kategori, deskripsi, urutan, aktif`,
      [kode, nama, kategori, deskripsi || null, nilaiUrutan, nilaiAktif]
    );
    return result.rows[0];
  }

  /**
   * Hapus tagar berdasarkan ID.
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM tagar WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  /**
   * Simpan (replace) semua tagar untuk satu entri.
   * Menghapus semua relasi lama lalu memasukkan yang baru dalam satu transaksi.
   * @param {number} entriId
   * @param {number[]} tagarIds - Array ID tagar. Kosong = hapus semua tagar entri.
   * @returns {Promise<void>}
   */
  static async simpanTagarEntri(entriId, tagarIds = []) {
    const ids = (tagarIds || []).filter((id) => Number.isFinite(Number(id))).map(Number);

    await db.query('BEGIN');
    try {
      await db.query('DELETE FROM entri_tagar WHERE entri_id = $1', [entriId]);
      if (ids.length > 0) {
        await db.query(
          `INSERT INTO entri_tagar (entri_id, tagar_id)
           SELECT $1, unnest($2::int[])
           ON CONFLICT DO NOTHING`,
          [entriId, ids]
        );
      }
      await db.query('COMMIT');
    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }
  }
}

module.exports = ModelTagar;
