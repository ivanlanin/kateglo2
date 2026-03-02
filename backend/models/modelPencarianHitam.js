/**
 * @fileoverview Model pengelolaan daftar hitam kata pencarian
 */

const db = require('../db');
const logger = require('../config/logger');

const pencarianHitamCache = {
  kataSet: null,
  loadedAt: 0,
  ttlMs: 5 * 60 * 1000,
  loadingPromise: null,
};

function normalisasiKata(kata = '') {
  return String(kata || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseAktifBoolean(value, fallback = true) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'number') return value === 1;
  const normalized = String(value).trim().toLowerCase();
  return ['1', 'true', 'ya', 'yes', 'aktif'].includes(normalized);
}

function parseLimit(limit, defaultValue = 200) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, 1), 1000);
}

class ModelPencarianHitam {
  static resetCache() {
    pencarianHitamCache.kataSet = null;
    pencarianHitamCache.loadedAt = 0;
    pencarianHitamCache.loadingPromise = null;
  }

  static async ambilSetAktif({ forceRefresh = false } = {}) {
    const now = Date.now();
    const cacheMasihAktif =
      !forceRefresh
      && pencarianHitamCache.kataSet instanceof Set
      && now - pencarianHitamCache.loadedAt < pencarianHitamCache.ttlMs;

    if (cacheMasihAktif) {
      return pencarianHitamCache.kataSet;
    }

    if (pencarianHitamCache.loadingPromise) {
      return pencarianHitamCache.loadingPromise;
    }

    pencarianHitamCache.loadingPromise = db.query(
      `SELECT kata
       FROM pencarian_hitam
       WHERE aktif = true`
    )
      .then((result) => {
        const kataSet = new Set(
          result.rows
            .map((row) => normalisasiKata(row.kata))
            .filter(Boolean)
        );
        pencarianHitamCache.kataSet = kataSet;
        pencarianHitamCache.loadedAt = Date.now();
        return kataSet;
      })
      .catch((error) => {
        logger.warn(`Gagal memuat pencarian_hitam: ${error.message}`);
        const kataSet = new Set();
        pencarianHitamCache.kataSet = kataSet;
        pencarianHitamCache.loadedAt = Date.now();
        return kataSet;
      })
      .finally(() => {
        pencarianHitamCache.loadingPromise = null;
      });

    return pencarianHitamCache.loadingPromise;
  }

  static async apakahKataDiblokir(kata) {
    const kataNormal = normalisasiKata(kata);
    if (!kataNormal) return false;
    const kataSet = await this.ambilSetAktif();
    return kataSet.has(kataNormal);
  }

  static async daftarAdmin({ q = '', aktif = '', limit = 200, offset = 0 } = {}) {
    const qAman = normalisasiKata(q);
    const limitAman = parseLimit(limit, 200);
    const offsetAman = Math.max(Number.parseInt(offset, 10) || 0, 0);

    const where = [];
    const params = [];

    if (qAman) {
      params.push(`%${qAman}%`);
      where.push(`kata ILIKE $${params.length}`);
    }

    if (aktif !== '' && aktif !== null && aktif !== undefined) {
      params.push(parseAktifBoolean(aktif));
      where.push(`aktif = $${params.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    params.push(limitAman);
    const limitParam = `$${params.length}`;
    params.push(offsetAman);
    const offsetParam = `$${params.length}`;

    const rowsResult = await db.query(
      `SELECT id, kata, aktif, catatan, created_at, updated_at
       FROM pencarian_hitam
       ${whereClause}
       ORDER BY kata ASC
       LIMIT ${limitParam} OFFSET ${offsetParam}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::bigint AS total
       FROM pencarian_hitam
       ${whereClause}`,
      params.slice(0, -2)
    );

    return {
      data: rowsResult.rows.map((row) => ({
        id: Number(row.id),
        kata: row.kata,
        aktif: Boolean(row.aktif),
        catatan: row.catatan,
        created_at: row.created_at,
        updated_at: row.updated_at,
      })),
      total: Number(countResult.rows[0]?.total) || 0,
    };
  }

  static async ambilDenganId(id) {
    const idAman = Number.parseInt(id, 10);
    if (!Number.isFinite(idAman) || idAman < 1) return null;

    const result = await db.query(
      `SELECT id, kata, aktif, catatan, created_at, updated_at
       FROM pencarian_hitam
       WHERE id = $1`,
      [idAman]
    );

    if (!result.rows[0]) return null;

    const row = result.rows[0];
    return {
      id: Number(row.id),
      kata: row.kata,
      aktif: Boolean(row.aktif),
      catatan: row.catatan,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async simpan({ id = null, kata, aktif = true, catatan = null } = {}) {
    const kataNormal = normalisasiKata(kata);
    if (!kataNormal) {
      throw new Error('Kata wajib diisi');
    }

    const aktifBoolean = parseAktifBoolean(aktif, true);
    const catatanAman = String(catatan ?? '').trim() || null;

    const idAman = Number.parseInt(id, 10);
    let result;

    if (Number.isFinite(idAman) && idAman > 0) {
      result = await db.query(
        `UPDATE pencarian_hitam
         SET kata = $2,
             aktif = $3,
             catatan = $4,
             updated_at = now()
         WHERE id = $1
         RETURNING id, kata, aktif, catatan, created_at, updated_at`,
        [idAman, kataNormal, aktifBoolean, catatanAman]
      );
    } else {
      result = await db.query(
        `INSERT INTO pencarian_hitam (kata, aktif, catatan)
         VALUES ($1, $2, $3)
         ON CONFLICT (kata)
         DO UPDATE SET
           aktif = EXCLUDED.aktif,
           catatan = EXCLUDED.catatan,
           updated_at = now()
         RETURNING id, kata, aktif, catatan, created_at, updated_at`,
        [kataNormal, aktifBoolean, catatanAman]
      );
    }

    if (!result.rows[0]) return null;

    this.resetCache();

    const row = result.rows[0];
    return {
      id: Number(row.id),
      kata: row.kata,
      aktif: Boolean(row.aktif),
      catatan: row.catatan,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  static async hapus(id) {
    const idAman = Number.parseInt(id, 10);
    if (!Number.isFinite(idAman) || idAman < 1) return false;

    const result = await db.query(
      `DELETE FROM pencarian_hitam
       WHERE id = $1`,
      [idAman]
    );

    if ((result.rowCount || 0) > 0) {
      this.resetCache();
      return true;
    }

    return false;
  }
}

ModelPencarianHitam.__private = {
  pencarianHitamCache,
  normalisasiKata,
  parseAktifBoolean,
  parseLimit,
};

module.exports = ModelPencarianHitam;
