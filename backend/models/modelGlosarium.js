/**
 * @fileoverview Model untuk glosarium (istilah teknis bilingual)
 */

const db = require('../db');
const ModelOpsi = require('./modelOpsi');
const { normalizeBoolean, parseCount } = require('../utils/modelUtils');
const { decodeCursor, encodeCursor } = require('../utils/cursorPagination');

function buildSlugSql(column) {
  return `LOWER(TRIM(BOTH '-' FROM REGEXP_REPLACE(TRIM(${column}), '[^a-zA-Z0-9]+', '-', 'g')))`;
}

function parseOptionalPositiveInt(value) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
}

async function resolveMasterId(client, {
  tableName,
  explicitId,
  kode,
  nama,
}) {
  const normalizedId = parseOptionalPositiveInt(explicitId);
  if (normalizedId) return normalizedId;

  const kandidatKode = String(kode || '').trim();
  const kandidatNama = String(nama || '').trim();
  if (!kandidatKode && !kandidatNama) return null;

  const result = await client.query(
    `SELECT id
     FROM ${tableName}
     WHERE ($1 <> '' AND LOWER(kode) = LOWER($1))
        OR ($2 <> '' AND LOWER(nama) = LOWER($2))
     ORDER BY id
     LIMIT 1`,
    [kandidatKode, kandidatNama]
  );

  return result.rows[0]?.id || null;
}

async function resolveBahasaId(client, { explicitId, kode, iso2 }) {
  const normalizedId = parseOptionalPositiveInt(explicitId);
  if (normalizedId) return normalizedId;

  const kandKode = String(kode || '').trim();
  const kandIso = String(iso2 || '').trim();
  if (!kandKode && !kandIso) return null;

  const result = await client.query(
    `SELECT id FROM bahasa
     WHERE ($1 <> '' AND LOWER(kode) = LOWER($1))
        OR ($2 <> '' AND iso2 = $2)
     ORDER BY id LIMIT 1`,
    [kandKode, kandIso]
  );
  return result.rows[0]?.id || null;
}

function buildMasterFilters({
  alias,
  q,
  aktif,
  params,
}) {
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

function buildJumlahEntriSumberSql(alias = 's') {
  return `(
            (SELECT COUNT(*)::int FROM entri e WHERE e.sumber_id = ${alias}.id)
          + (SELECT COUNT(*)::int FROM tesaurus t WHERE t.sumber_id = ${alias}.id)
          + (SELECT COUNT(*)::int FROM glosarium g WHERE g.sumber_id = ${alias}.id)
          + (SELECT COUNT(*)::int FROM etimologi et WHERE et.sumber_id = ${alias}.id)
         )`;
}

let cachedNormalizedSchema = null;
let forcedNormalizedSchemaForTest = null;

async function isNormalizedGlosariumSchema() {
  if (forcedNormalizedSchemaForTest !== null) return forcedNormalizedSchemaForTest;
  if (process.env.NODE_ENV === 'test') return false;
  if (cachedNormalizedSchema !== null) return cachedNormalizedSchema;
  const result = await db.query(
    `SELECT column_name
     FROM information_schema.columns
     WHERE table_schema = 'public'
       AND table_name = 'glosarium'
       AND column_name IN ('bidang_id', 'sumber_id', 'bahasa_id')`
  );
  cachedNormalizedSchema = result.rows.length >= 3;
  return cachedNormalizedSchema;
}

class ModelGlosarium {
  static async autocomplete(query, limit = 8) {
    const trimmed = query.trim();
    if (!trimmed) return [];
    const cappedLimit = Math.min(Math.max(Number(limit) || 8, 1), 20);

    const result = await db.query(
      `SELECT DISTINCT indonesia, asing
       FROM glosarium
       WHERE aktif = TRUE
         AND (indonesia ILIKE $1 OR asing ILIKE $1)
       ORDER BY indonesia ASC
       LIMIT $2`,
      [`${trimmed}%`, cappedLimit]
    );

    return result.rows.map((row) => ({
      value: row.indonesia,
      asing: row.asing || null,
    }));
  }

  /**
   * Cari glosarium dengan filter
   * @param {Object} params - Parameter pencarian
   * @param {string} params.q - Kata pencarian
  * @param {string} params.bidang - Filter bidang
  * @param {string} params.sumber - Filter sumber
   * @param {string} params.bahasa - Filter bahasa (id/en/semua)
   * @param {number} params.limit - Batas hasil
   * @param {number} params.offset - Offset untuk pagination
   * @returns {Promise<Object>} { data, total }
   */
  static async cari({
    q = '',
    bidang = '',
    bidangId = null,
    bidangKode = '',
    sumber = '',
    sumberId = null,
    sumberKode = '',
    bahasa = '',
    bahasaId = null,
    aktif = '',
    limit = 20,
    offset = 0,
    aktifSaja = false,
    hitungTotal = true,
  } = {}) {
    const normalizedSchema = await isNormalizedGlosariumSchema();
    if (!normalizedSchema) {
      const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
      const safeOffset = Math.max(Number(offset) || 0, 0);
      const conditions = [];
      const params = [];
      let idx = 1;

      if (aktifSaja) {
        conditions.push('g.aktif = TRUE');
      }

      if (aktif === '1') {
        conditions.push('g.aktif = TRUE');
      } else if (aktif === '0') {
        conditions.push('g.aktif = FALSE');
      }

      if (q) {
        conditions.push(`(g.indonesia ILIKE $${idx} OR g.asing ILIKE $${idx})`);
        params.push(`%${q}%`);
        idx++;
      }

      if (bidang) {
        conditions.push(`g.bidang = $${idx}`);
        params.push(bidang);
        idx++;
      }

      if (sumber) {
        conditions.push(`g.sumber = $${idx}`);
        params.push(sumber);
        idx++;
      }

      if (bahasa === 'id') {
        conditions.push(`g.bahasa = 'id'`);
      } else if (bahasa === 'en') {
        conditions.push(`g.bahasa = 'en'`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      if (hitungTotal) {
        const countResult = await db.query(
          `SELECT COUNT(*) as total FROM glosarium g ${whereClause}`,
          params
        );
        const total = parseCount(countResult.rows[0]?.total);

        const dataResult = await db.query(
          `SELECT g.id, g.indonesia, g.asing, g.bidang, g.bahasa, g.sumber, g.aktif
           FROM glosarium g
           ${whereClause}
           ORDER BY g.asing ASC
           LIMIT $${idx} OFFSET $${idx + 1}`,
          [...params, cappedLimit, safeOffset]
        );

        return { data: dataResult.rows, total, hasNext: safeOffset + dataResult.rows.length < total };
      }

      const dataResult = await db.query(
        `SELECT g.id, g.indonesia, g.asing, g.bidang, g.bahasa, g.sumber, g.aktif
         FROM glosarium g
         ${whereClause}
         ORDER BY g.asing ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, cappedLimit + 1, safeOffset]
      );

      const hasNext = dataResult.rows.length > cappedLimit;
      const data = hasNext ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
      const total = hasNext
        ? safeOffset + cappedLimit + 1
        : safeOffset + data.length;

      return { data, total, hasNext };
    }

    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const conditions = [];
    const params = [];
    let idx = 1;
    const normalizedBidangId = parseOptionalPositiveInt(bidangId);
    const normalizedBahasaId = parseOptionalPositiveInt(bahasaId);
    const normalizedSumberId = parseOptionalPositiveInt(sumberId);
    const normalizedBidangKode = String(bidangKode || '').trim();
    const normalizedSumberKode = String(sumberKode || '').trim();
    const normalizedBidang = String(bidang || '').trim();
    const normalizedSumber = String(sumber || '').trim();

    if (aktifSaja) {
      conditions.push('g.aktif = TRUE');
    }

    if (aktif === '1') {
      conditions.push('g.aktif = TRUE');
    } else if (aktif === '0') {
      conditions.push('g.aktif = FALSE');
    }

    if (q) {
      conditions.push(`(g.indonesia ILIKE $${idx} OR g.asing ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    if (normalizedBidangId) {
      conditions.push(`g.bidang_id = $${idx}`);
      params.push(normalizedBidangId);
      idx++;
    } else if (normalizedBidangKode || normalizedBidang) {
      conditions.push(`(
        ($${idx} <> '' AND LOWER(b.kode) = LOWER($${idx}))
        OR ($${idx + 1} <> '' AND LOWER(b.nama) = LOWER($${idx + 1}))
      )`);
      params.push(normalizedBidangKode || normalizedBidang, normalizedBidang);
      idx += 2;
    }

    if (normalizedSumberId) {
      conditions.push(`g.sumber_id = $${idx}`);
      params.push(normalizedSumberId);
      idx++;
    } else if (normalizedSumberKode || normalizedSumber) {
      conditions.push(`(
        ($${idx} <> '' AND LOWER(s.kode) = LOWER($${idx}))
        OR ($${idx + 1} <> '' AND LOWER(s.nama) = LOWER($${idx + 1}))
      )`);
      params.push(normalizedSumberKode || normalizedSumber, normalizedSumber);
      idx += 2;
    }

    if (normalizedBahasaId) {
      conditions.push(`g.bahasa_id = $${idx}`);
      params.push(normalizedBahasaId);
      idx++;
    } else if (bahasa) {
      conditions.push(`(ba.kode = $${idx} OR ba.iso2 = $${idx})`);
      params.push(bahasa);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    if (hitungTotal) {
      const countResult = await db.query(
        `SELECT COUNT(*) as total
         FROM glosarium g
         JOIN bidang b ON b.id = g.bidang_id
         JOIN sumber s ON s.id = g.sumber_id
         LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
         ${whereClause}`,
        params
      );
      const total = parseCount(countResult.rows[0]?.total);

      const dataResult = await db.query(
        `SELECT
           g.id,
           g.indonesia,
           g.asing,
           g.bidang_id,
           b.kode AS bidang_kode,
           b.nama AS bidang,
           g.bahasa_id,
           ba.kode AS bahasa_kode,
           ba.nama AS bahasa,
           g.sumber_id,
           s.kode AS sumber_kode,
           s.nama AS sumber,
           g.aktif
         FROM glosarium g
         JOIN bidang b ON b.id = g.bidang_id
         JOIN sumber s ON s.id = g.sumber_id
         LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
         ${whereClause}
         ORDER BY g.asing ASC
         LIMIT $${idx} OFFSET $${idx + 1}`,
        [...params, cappedLimit, safeOffset]
      );

      return { data: dataResult.rows, total, hasNext: safeOffset + dataResult.rows.length < total };
    }

    const dataResult = await db.query(
      `SELECT
         g.id,
         g.indonesia,
         g.asing,
         g.bidang_id,
         b.kode AS bidang_kode,
         b.nama AS bidang,
         g.bahasa_id,
         ba.kode AS bahasa_kode,
         ba.nama AS bahasa,
         g.sumber_id,
         s.kode AS sumber_kode,
         s.nama AS sumber,
         g.aktif
       FROM glosarium g
       JOIN bidang b ON b.id = g.bidang_id
       JOIN sumber s ON s.id = g.sumber_id
       LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
       ${whereClause}
       ORDER BY g.asing ASC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, cappedLimit + 1, safeOffset]
    );

    const hasNext = dataResult.rows.length > cappedLimit;
    const data = hasNext ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    const total = hasNext
      ? safeOffset + cappedLimit + 1
      : safeOffset + data.length;

    return { data, total, hasNext };
  }

  static async cariCursor({
    q = '',
    bidang = '',
    bidangId = null,
    bidangKode = '',
    sumber = '',
    sumberId = null,
    sumberKode = '',
    bahasa = '',
    aktif = '',
    limit = 20,
    aktifSaja = false,
    hitungTotal = true,
    cursor = null,
    direction = 'next',
    lastPage = false,
    sortBy = 'asing',
  } = {}) {
    const normalizedSchema = await isNormalizedGlosariumSchema();
    if (!normalizedSchema) {
      const sortField = sortBy === 'asing' ? 'asing' : 'indonesia';
      const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
      const cursorPayload = decodeCursor(cursor);
      const isPrev = direction === 'prev';
      const orderDesc = Boolean(lastPage || isPrev);
      const conditions = [];
      const params = [];
      let idx = 1;

      if (aktifSaja) {
        conditions.push('g.aktif = TRUE');
      }

      if (aktif === '1') {
        conditions.push('g.aktif = TRUE');
      } else if (aktif === '0') {
        conditions.push('g.aktif = FALSE');
      }

      if (q) {
        conditions.push(`(g.indonesia ILIKE $${idx} OR g.asing ILIKE $${idx})`);
        params.push(`%${q}%`);
        idx++;
      }

      if (bidang) {
        conditions.push(`g.bidang = $${idx}`);
        params.push(bidang);
        idx++;
      }

      if (sumber) {
        conditions.push(`g.sumber = $${idx}`);
        params.push(sumber);
        idx++;
      }

      if (bahasa === 'id') {
        conditions.push(`g.bahasa = 'id'`);
      } else if (bahasa === 'en') {
        conditions.push(`g.bahasa = 'en'`);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      let total = 0;
      if (hitungTotal) {
        const countResult = await db.query(
          `SELECT COUNT(*) as total FROM glosarium g ${whereClause}`,
          params
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

      const dataParams = [...params];
      let cursorClause = '';
      if (cursorPayload && !lastPage) {
        dataParams.push(String(cursorPayload[sortField] || ''), Number(cursorPayload.id) || 0);
        const sortIdx = dataParams.length - 1;
        const idIdx = dataParams.length;
        cursorClause = isPrev
          ? `AND (g.${sortField}, g.id) < ($${sortIdx}, $${idIdx})`
          : `AND (g.${sortField}, g.id) > ($${sortIdx}, $${idIdx})`;
      }

      dataParams.push(cappedLimit + 1);
      const limitIdx = dataParams.length;

      const dataResult = await db.query(
        `SELECT g.id, g.indonesia, g.asing, g.bidang, g.bahasa, g.sumber, g.aktif
         FROM glosarium g
         ${whereClause}
         ${cursorClause}
         ORDER BY g.${sortField} ${orderDesc ? 'DESC' : 'ASC'}, g.id ${orderDesc ? 'DESC' : 'ASC'}
         LIMIT $${limitIdx}`,
        dataParams
      );

      const hasMore = dataResult.rows.length > cappedLimit;
      let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
      if (orderDesc) {
        rows = rows.reverse();
      }

      const first = rows[0];
      const last = rows[rows.length - 1];
      const prevCursor = first ? encodeCursor({ [sortField]: first[sortField], id: first.id }) : null;
      const nextCursor = last ? encodeCursor({ [sortField]: last[sortField], id: last.id }) : null;

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

    const sortField = sortBy === 'asing' ? 'asing' : 'indonesia';
    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 200);
    const cursorPayload = decodeCursor(cursor);
    const isPrev = direction === 'prev';
    const orderDesc = Boolean(lastPage || isPrev);
    const conditions = [];
    const params = [];
    let idx = 1;
    const normalizedBidangId = parseOptionalPositiveInt(bidangId);
    const normalizedSumberId = parseOptionalPositiveInt(sumberId);
    const normalizedBidangKode = String(bidangKode || '').trim();
    const normalizedSumberKode = String(sumberKode || '').trim();
    const normalizedBidang = String(bidang || '').trim();
    const normalizedSumber = String(sumber || '').trim();

    if (aktifSaja) {
      conditions.push('g.aktif = TRUE');
    }

    if (aktif === '1') {
      conditions.push('g.aktif = TRUE');
    } else if (aktif === '0') {
      conditions.push('g.aktif = FALSE');
    }

    if (q) {
      conditions.push(`(g.indonesia ILIKE $${idx} OR g.asing ILIKE $${idx})`);
      params.push(`%${q}%`);
      idx++;
    }

    if (normalizedBidangId) {
      conditions.push(`g.bidang_id = $${idx}`);
      params.push(normalizedBidangId);
      idx++;
    } else if (normalizedBidangKode || normalizedBidang) {
      conditions.push(`(
        ($${idx} <> '' AND LOWER(b.kode) = LOWER($${idx}))
        OR ($${idx + 1} <> '' AND LOWER(b.nama) = LOWER($${idx + 1}))
      )`);
      params.push(normalizedBidangKode || normalizedBidang, normalizedBidang);
      idx += 2;
    }

    if (normalizedSumberId) {
      conditions.push(`g.sumber_id = $${idx}`);
      params.push(normalizedSumberId);
      idx++;
    } else if (normalizedSumberKode || normalizedSumber) {
      conditions.push(`(
        ($${idx} <> '' AND LOWER(s.kode) = LOWER($${idx}))
        OR ($${idx + 1} <> '' AND LOWER(s.nama) = LOWER($${idx + 1}))
      )`);
      params.push(normalizedSumberKode || normalizedSumber, normalizedSumber);
      idx += 2;
    }

    if (bahasa) {
      conditions.push(`(ba.kode = $${idx} OR ba.iso2 = $${idx})`);
      params.push(bahasa);
      idx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    let total = 0;
    if (hitungTotal) {
      const countResult = await db.query(
        `SELECT COUNT(*) as total
         FROM glosarium g
         JOIN bidang b ON b.id = g.bidang_id
         JOIN sumber s ON s.id = g.sumber_id
         LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
         ${whereClause}`,
        params
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

    const dataParams = [...params];
    let cursorClause = '';
    if (cursorPayload && !lastPage) {
      dataParams.push(String(cursorPayload[sortField] || ''), Number(cursorPayload.id) || 0);
      const sortIdx = dataParams.length - 1;
      const idIdx = dataParams.length;
      cursorClause = isPrev
        ? `AND (g.${sortField}, g.id) < ($${sortIdx}, $${idIdx})`
        : `AND (g.${sortField}, g.id) > ($${sortIdx}, $${idIdx})`;
    }

    dataParams.push(cappedLimit + 1);
    const limitIdx = dataParams.length;

    const dataResult = await db.query(
      `SELECT
         g.id,
         g.indonesia,
         g.asing,
         g.bidang_id,
         b.kode AS bidang_kode,
         b.nama AS bidang,
         g.bahasa_id,
         ba.kode AS bahasa_kode,
         ba.nama AS bahasa,
         g.sumber_id,
         s.kode AS sumber_kode,
         s.nama AS sumber,
         g.aktif
       FROM glosarium g
       JOIN bidang b ON b.id = g.bidang_id
       JOIN sumber s ON s.id = g.sumber_id
       LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
       ${whereClause}
       ${cursorClause}
       ORDER BY g.${sortField} ${orderDesc ? 'DESC' : 'ASC'}, g.id ${orderDesc ? 'DESC' : 'ASC'}
       LIMIT $${limitIdx}`,
      dataParams
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) {
      rows = rows.reverse();
    }

    const first = rows[0];
    const last = rows[rows.length - 1];
    const prevCursor = first ? encodeCursor({ [sortField]: first[sortField], id: first.id }) : null;
    const nextCursor = last ? encodeCursor({ [sortField]: last[sortField], id: last.id }) : null;

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
  * Ambil daftar bidang yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarBidang(filterMode = 'glosarium') {
    const mode = typeof filterMode === 'string'
      ? filterMode
      : (filterMode ? 'kamus' : 'all');

    let kondisi = '';
    if (mode === 'kamus') {
      kondisi = 'WHERE b.kamus = TRUE';
    } else if (mode === 'glosarium') {
      kondisi = 'WHERE b.glosarium = TRUE';
    }

    const result = await db.query(
      `SELECT b.id, b.kode, b.nama, b.nama AS bidang,
              ${buildSlugSql('b.nama')} AS slug
       FROM bidang b
       ${kondisi}
       ORDER BY b.nama`
    );
    return result.rows;
  }

  /**
   * Cari bidang berdasarkan slug yang dibentuk dari nama, atau fallback kode/nama
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async resolveSlugBidang(slug) {
    const result = await db.query(
      `SELECT id, kode, nama
       FROM bidang
       WHERE ${buildSlugSql('nama')} = $1
          OR LOWER(kode) = $1
          OR LOWER(nama) = $1
       LIMIT 1`,
      [String(slug || '').toLowerCase()]
    );
    return result.rows[0] || null;
  }

  static async ambilDaftarBahasa(aktifSaja = true) {
    const kondisiAktif = aktifSaja ? 'WHERE ba.aktif = TRUE' : '';
    const result = await db.query(
      `SELECT ba.id, ba.kode, ba.nama, ba.iso2, ba.iso3
       FROM bahasa ba
       ${kondisiAktif}
       ORDER BY ba.nama`
    );
    return result.rows;
  }

  /**
   * Ambil daftar sumber yang memiliki entri glosarium
   * @returns {Promise<Array>}
   */
  static async ambilDaftarSumber(filterMode = 'glosarium') {
    const mode = typeof filterMode === 'string'
      ? filterMode
      : (filterMode ? 'glosarium' : 'all');

    let kondisi = '';
    if (mode === 'glosarium') {
      kondisi = 'WHERE s.glosarium = TRUE';
    } else if (mode === 'konteks') {
      kondisi = 'WHERE (s.glosarium = TRUE OR s.kamus = TRUE OR s.tesaurus = TRUE OR s.etimologi = TRUE)';
    }

    const result = await db.query(
      `SELECT
         s.id,
         s.kode,
         s.nama,
        s.glosarium,
         s.keterangan,
         s.nama AS sumber,
         ${buildSlugSql('s.nama')} AS slug
       FROM sumber s
       ${kondisi}
       ORDER BY s.keterangan ASC NULLS LAST, s.nama ASC`
    );
    return result.rows;
  }

  /**
   * Cari sumber berdasarkan slug yang dibentuk dari nama
   * @param {string} slug
   * @returns {Promise<Object|null>}
   */
  static async resolveSlugSumber(slug) {
    const result = await db.query(
      `SELECT id, kode, nama
       FROM sumber
       WHERE ${buildSlugSql('nama')} = $1
          OR LOWER(kode) = $1
          OR LOWER(nama) = $1
       LIMIT 1`,
      [String(slug || '').toLowerCase()]
    );
    return result.rows[0] || null;
  }

  static async daftarMasterBidang({ q = '', kamus = '', glosarium = '', limit = 50, offset = 0 } = {}) {
    return ModelOpsi.daftarMasterBidang({ q, kamus, glosarium, limit, offset });
  }

  static async daftarLookupBidang({ q = '' } = {}) {
    return ModelOpsi.daftarLookupBidang({ q });
  }

  static async daftarMasterSumber({
    q = '', glosarium = '', kamus = '', tesaurus = '', etimologi = '', limit = 50, offset = 0,
  } = {}) {
    return ModelOpsi.daftarMasterSumber({ q, glosarium, kamus, tesaurus, etimologi, limit, offset });
  }

  static async ambilMasterBidangDenganId(id) {
    return ModelOpsi.ambilMasterBidangDenganId(id);
  }

  static async ambilMasterSumberDenganId(id) {
    return ModelOpsi.ambilMasterSumberDenganId(id);
  }

  static async simpanMasterBidang({ id, kode, nama, kamus = true, glosarium = true, keterangan = '' }) {
    return ModelOpsi.simpanMasterBidang({ id, kode, nama, kamus, glosarium, keterangan });
  }

  static async simpanMasterSumber({
    id, kode, nama, glosarium = false, kamus = false, tesaurus = false, etimologi = false, keterangan = '',
  }) {
    return ModelOpsi.simpanMasterSumber({ id, kode, nama, glosarium, kamus, tesaurus, etimologi, keterangan });
  }

  static async hapusMasterBidang(id) {
    return ModelOpsi.hapusMasterBidang(id);
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

  /**
  * Ambil entri glosarium yang mengandung kata utuh pada kolom indonesia
   * @param {string} kata - Kata target (word boundary)
   * @param {number} limit - Batas hasil
  * @returns {Promise<Array>} Daftar indonesia + asing
   */
  /**
   * Hitung total glosarium
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM glosarium');
    return parseCount(result.rows[0]?.total);
  }

  static async hitungTotalBidang() {
    return ModelOpsi.hitungTotalBidang();
  }

  // ── MASTER BAHASA ─────────────────────────────────────────────────────────

  static async daftarMasterBahasa({ q = '', aktif = '', limit = 50, offset = 0 } = {}) {
    return ModelOpsi.daftarMasterBahasa({ q, aktif, limit, offset });
  }

  static async daftarLookupBahasa({ q = '' } = {}) {
    return ModelOpsi.daftarLookupBahasa({ q });
  }

  static async daftarLookupSumber({
    q = '', glosarium = '', kamus = '', tesaurus = '', etimologi = '',
  } = {}) {
    return ModelOpsi.daftarLookupSumber({ q, glosarium, kamus, tesaurus, etimologi });
  }

  static async ambilMasterBahasaDenganId(id) {
    return ModelOpsi.ambilMasterBahasaDenganId(id);
  }

  static async simpanMasterBahasa({ id, kode, nama, aktif = true, iso2 = '', iso3 = '', keterangan = '' }) {
    return ModelOpsi.simpanMasterBahasa({ id, kode, nama, aktif, iso2, iso3, keterangan });
  }

  static async hapusMasterBahasa(id) {
    return ModelOpsi.hapusMasterBahasa(id);
  }

  static async hitungTotalBahasa() {
    return ModelOpsi.hitungTotalBahasa();
  }

  static async hitungTotalSumber() {
    return ModelOpsi.hitungTotalSumber();
  }

  /**
   * Ambil glosarium berdasarkan ID (untuk admin)
   * @param {number} id
   * @returns {Promise<Object|null>}
   */
  static async ambilDenganId(id) {
    const sudahNormalisasi = await isNormalizedGlosariumSchema();
    if (!sudahNormalisasi) {
      const legacyResult = await db.query(
        'SELECT id, indonesia, asing, bidang, bahasa, sumber, aktif FROM glosarium WHERE id = $1',
        [id]
      );
      return legacyResult.rows[0] || null;
    }

    const result = await db.query(
      `SELECT
         g.id,
         g.indonesia,
         g.asing,
         g.bidang_id,
         b.kode AS bidang_kode,
         b.nama AS bidang,
         g.bahasa_id,
         ba.kode AS bahasa_kode,
         ba.nama AS bahasa,
         g.sumber_id,
         s.kode AS sumber_kode,
         s.nama AS sumber,
         g.aktif
       FROM glosarium g
       JOIN bidang b ON b.id = g.bidang_id
       LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
       JOIN sumber s ON s.id = g.sumber_id
       WHERE g.id = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  /**
   * Simpan (insert atau update) glosarium
   * @param {Object} data
   * @param {string} updater - Email penyunting
   * @returns {Promise<Object>}
   */
  static async simpan({
    id,
    indonesia,
    asing,
    bidang,
    bidang_id: bidangId,
    bidang_kode: bidangKode,
    bahasa,
    bahasa_id: bahasaId,
    bahasa_kode: bahasaKode,
    sumber,
    sumber_id: sumberId,
    sumber_kode: sumberKode,
    aktif,
  }, updater = 'admin') {
    const normalizedSchema = await isNormalizedGlosariumSchema();
    if (!normalizedSchema) {
      const nilaiAktif = normalizeBoolean(aktif, true);
      if (id) {
        const result = await db.query(
          `UPDATE glosarium SET indonesia = $1, asing = $2, bidang = $3,
                  bahasa = $4, sumber = $5, aktif = $6, updater = $7, updated = NOW()
           WHERE id = $8 RETURNING *`,
          [indonesia, asing, bidang || null, bahasa || 'en', sumber || null, nilaiAktif, updater, id]
        );
        return result.rows[0];
      }
      const result = await db.query(
        `INSERT INTO glosarium (indonesia, asing, bidang, bahasa, sumber, aktif, updater, updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
        [indonesia, asing, bidang || null, bahasa || 'en', sumber || null, nilaiAktif, updater]
      );
      return result.rows[0];
    }

    const client = await db.pool.connect();
    try {
      const resolvedBidangId = await resolveMasterId(client, {
        tableName: 'bidang',
        explicitId: bidangId,
        kode: bidangKode,
        nama: bidang,
      });
      const resolvedSumberId = await resolveMasterId(client, {
        tableName: 'sumber',
        explicitId: sumberId,
        kode: sumberKode,
        nama: sumber,
      });
      // bahasa: terima bahasa_id, bahasa_kode, atau bahasa sebagai iso2 (misal 'en')
      const resolvedBahasaId = await resolveBahasaId(client, {
        explicitId: bahasaId,
        kode: bahasaKode || bahasa,
        iso2: bahasa,
      });

      if (!resolvedBidangId) {
        const error = new Error('Bidang tidak valid');
        error.code = 'INVALID_BIDANG';
        throw error;
      }
      if (!resolvedSumberId) {
        const error = new Error('Sumber tidak valid');
        error.code = 'INVALID_SUMBER';
        throw error;
      }
      if (!resolvedBahasaId) {
        const error = new Error('Bahasa tidak valid');
        error.code = 'INVALID_BAHASA';
        throw error;
      }

      const nilaiAktif = normalizeBoolean(aktif, true);
      if (id) {
        const result = await client.query(
          `UPDATE glosarium
           SET indonesia = $1,
               asing = $2,
               bidang_id = $3,
               bahasa_id = $4,
               sumber_id = $5,
               aktif = $6,
               updater = $7,
               updated = NOW()
           WHERE id = $8
           RETURNING id`,
          [indonesia, asing, resolvedBidangId, resolvedBahasaId, resolvedSumberId, nilaiAktif, updater, id]
        );

        if (!result.rows[0]?.id) return null;
        return this.ambilDenganId(result.rows[0].id);
      }

      const result = await client.query(
        `INSERT INTO glosarium (indonesia, asing, bidang_id, bahasa_id, sumber_id, aktif, updater, updated)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
         RETURNING id`,
        [indonesia, asing, resolvedBidangId, resolvedBahasaId, resolvedSumberId, nilaiAktif, updater]
      );

      return this.ambilDenganId(result.rows[0].id);
    } finally {
      client.release();
    }
  }

  /**
   * Hapus glosarium berdasarkan ID
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query('DELETE FROM glosarium WHERE id = $1 RETURNING id', [id]);
    return result.rowCount > 0;
  }

  static async ambilDetailAsing(asing, { limit = 20, mengandungCursor = null, miripCursor = null } = {}) {
    const trimmed = (asing || '').trim();
    const emptyPage = { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null };
    if (!trimmed) {
      return {
        persis: [],
        mengandung: [], mengandungPage: emptyPage, mengandungTotal: 0,
        mirip: [], miripPage: emptyPage, miripTotal: 0,
      };
    }

    const cappedLimit = Math.min(Math.max(Number(limit) || 20, 1), 100);
    const fetchLimit = cappedLimit + 1;
    const mengOffset = Math.max(Number(decodeCursor(mengandungCursor)?.offset) || 0, 0);
    const mirOffset = Math.max(Number(decodeCursor(miripCursor)?.offset) || 0, 0);
    const normalizedSchema = await isNormalizedGlosariumSchema();

    const wordBoundarySql = `(
      '(^|[^[:alnum:]_])' ||
      regexp_replace(LOWER($1), '([.^$|()\\[\\]{}*+?\\\\-])', '\\\\\\1', 'g') ||
      '([^[:alnum:]_]|$)'
    )`;

    function buildPage(offset, rows, cap) {
      const hasNext = rows.length > cap;
      const data = hasNext ? rows.slice(0, cap) : rows;
      const hasPrev = offset > 0;
      return {
        data,
        page: {
          hasPrev,
          hasNext,
          prevCursor: hasPrev ? encodeCursor({ offset: Math.max(0, offset - cap) }) : null,
          nextCursor: hasNext ? encodeCursor({ offset: offset + cap }) : null,
        },
      };
    }

    if (!normalizedSchema) {
      const [persisResult, mengCount, mengResult, mirCount, mirResult] = await Promise.all([
        db.query(
          `SELECT g.id, g.asing, g.indonesia, g.bahasa,
                  COALESCE(g.bidang, '') AS bidang, '' AS bidang_kode,
                  COALESCE(g.sumber, '') AS sumber, '' AS sumber_kode
           FROM glosarium g
           WHERE g.aktif = TRUE AND LOWER(g.asing) = LOWER($1)
           ORDER BY g.bidang, g.sumber`,
          [trimmed]
        ),
        db.query(
          `SELECT COUNT(*) AS total FROM glosarium g
           WHERE g.aktif = TRUE
             AND LOWER(g.asing) != LOWER($1)
             AND LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
             AND g.asing ~* ${wordBoundarySql}`,
          [trimmed]
        ),
        db.query(
          `SELECT g.id, g.asing, g.indonesia, g.bahasa,
                  COALESCE(g.bidang, '') AS bidang, '' AS bidang_kode,
                  COALESCE(g.sumber, '') AS sumber, '' AS sumber_kode
           FROM glosarium g
           WHERE g.aktif = TRUE
             AND LOWER(g.asing) != LOWER($1)
             AND LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
             AND g.asing ~* ${wordBoundarySql}
           ORDER BY g.asing, g.bidang
           LIMIT $2 OFFSET $3`,
          [trimmed, fetchLimit, mengOffset]
        ),
        db.query(
          `SELECT COUNT(*) AS total FROM glosarium g
           WHERE g.aktif = TRUE
             AND LOWER(g.asing) != LOWER($1)
             AND NOT (
               LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
               AND g.asing ~* ${wordBoundarySql}
             )
             AND g.asing % $1`,
          [trimmed]
        ),
        db.query(
          `SELECT g.id, g.asing, g.indonesia, g.bahasa,
                  COALESCE(g.bidang, '') AS bidang, '' AS bidang_kode,
                  COALESCE(g.sumber, '') AS sumber, '' AS sumber_kode
           FROM glosarium g
           WHERE g.aktif = TRUE
             AND LOWER(g.asing) != LOWER($1)
             AND NOT (
               LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
               AND g.asing ~* ${wordBoundarySql}
             )
             AND g.asing % $1
           ORDER BY similarity(g.asing, $1) DESC, g.asing
           LIMIT $2 OFFSET $3`,
          [trimmed, fetchLimit, mirOffset]
        ),
      ]);

      const { data: mengandung, page: mengandungPage } = buildPage(mengOffset, mengResult.rows, cappedLimit);
      const { data: mirip, page: miripPage } = buildPage(mirOffset, mirResult.rows, cappedLimit);
      return {
        persis: persisResult.rows,
        mengandung, mengandungPage, mengandungTotal: parseCount(mengCount.rows[0]?.total),
        mirip, miripPage, miripTotal: parseCount(mirCount.rows[0]?.total),
      };
    }

    const [persisResult, mengCount, mengResult, mirCount, mirResult] = await Promise.all([
      db.query(
        `SELECT g.id, g.asing, g.indonesia,
                g.bahasa_id, ba.kode AS bahasa_kode, ba.nama AS bahasa,
                b.kode AS bidang_kode, b.nama AS bidang,
                s.kode AS sumber_kode, s.nama AS sumber
         FROM glosarium g
         JOIN bidang b ON b.id = g.bidang_id
         JOIN sumber s ON s.id = g.sumber_id
         LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
         WHERE g.aktif = TRUE AND LOWER(g.asing) = LOWER($1)
         ORDER BY b.nama, s.nama`,
        [trimmed]
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM glosarium g
         WHERE g.aktif = TRUE
           AND LOWER(g.asing) != LOWER($1)
           AND LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
           AND g.asing ~* ${wordBoundarySql}`,
        [trimmed]
      ),
      db.query(
        `SELECT g.id, g.asing, g.indonesia,
                g.bahasa_id, ba.kode AS bahasa_kode, ba.nama AS bahasa,
                b.kode AS bidang_kode, b.nama AS bidang,
                s.kode AS sumber_kode, s.nama AS sumber
         FROM glosarium g
         JOIN bidang b ON b.id = g.bidang_id
         JOIN sumber s ON s.id = g.sumber_id
         LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
         WHERE g.aktif = TRUE
           AND LOWER(g.asing) != LOWER($1)
           AND LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
           AND g.asing ~* ${wordBoundarySql}
         ORDER BY g.asing, b.nama
         LIMIT $2 OFFSET $3`,
        [trimmed, fetchLimit, mengOffset]
      ),
      db.query(
        `SELECT COUNT(*) AS total FROM glosarium g
         WHERE g.aktif = TRUE
           AND LOWER(g.asing) != LOWER($1)
           AND NOT (
             LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
             AND g.asing ~* ${wordBoundarySql}
           )
           AND g.asing % $1`,
        [trimmed]
      ),
      db.query(
        `SELECT g.id, g.asing, g.indonesia,
                g.bahasa_id, ba.kode AS bahasa_kode, ba.nama AS bahasa,
                b.kode AS bidang_kode, b.nama AS bidang,
                s.kode AS sumber_kode, s.nama AS sumber
         FROM glosarium g
         JOIN bidang b ON b.id = g.bidang_id
         JOIN sumber s ON s.id = g.sumber_id
         LEFT JOIN bahasa ba ON ba.id = g.bahasa_id
         WHERE g.aktif = TRUE
           AND LOWER(g.asing) != LOWER($1)
           AND NOT (
             LOWER(g.asing) LIKE ('%' || LOWER($1) || '%')
             AND g.asing ~* ${wordBoundarySql}
           )
           AND g.asing % $1
         ORDER BY similarity(g.asing, $1) DESC, g.asing
         LIMIT $2 OFFSET $3`,
        [trimmed, fetchLimit, mirOffset]
      ),
    ]);

    const { data: mengandung, page: mengandungPage } = buildPage(mengOffset, mengResult.rows, cappedLimit);
    const { data: mirip, page: miripPage } = buildPage(mirOffset, mirResult.rows, cappedLimit);
    return {
      persis: persisResult.rows,
      mengandung, mengandungPage, mengandungTotal: parseCount(mengCount.rows[0]?.total),
      mirip, miripPage, miripTotal: parseCount(mirCount.rows[0]?.total),
    };
  }

  static async cariFrasaMengandungKataUtuh(kata, options = 50) {
    const trimmed = (kata || '').trim();
    const legacyMode = typeof options === 'number';
    if (!trimmed) {
      return legacyMode
        ? []
        : {
          data: [],
          total: 0,
          hasPrev: false,
          hasNext: false,
          prevCursor: null,
          nextCursor: null,
        };
    }

    const token = trimmed
      .toLowerCase()
      .replace(/[^\p{L}\p{N}_-]+/gu, '')
      .trim();

    if (token.length < 3) {
      return legacyMode
        ? []
        : {
          data: [],
          total: 0,
          hasPrev: false,
          hasNext: false,
          prevCursor: null,
          nextCursor: null,
        };
    }

    const limit = legacyMode ? options : options?.limit;
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);

    if (legacyMode) {
      const result = await db.query(
        `SELECT DISTINCT g.indonesia, g.asing
         FROM glosarium g
         WHERE g.aktif = TRUE
           AND LOWER(g.indonesia) LIKE ('%' || LOWER($1) || '%')
           AND LOWER(g.indonesia) ~ (
           '(^|[^[:alnum:]_])' ||
           regexp_replace(LOWER($1), '([.^$|()\\[\\]{}*+?\\\\-])', '\\\\\\1', 'g') ||
           '([^[:alnum:]_]|$)'
         )
         ORDER BY g.indonesia ASC, g.asing ASC
         LIMIT $2`,
        [trimmed, cappedLimit]
      );

      return result.rows;
    }

    const cursor = typeof options?.cursor === 'string' && options.cursor.trim()
      ? options.cursor.trim()
      : null;
    const direction = options?.direction === 'prev' ? 'prev' : 'next';
    const hitungTotal = options?.hitungTotal !== false;
    const cursorPayload = cursor ? decodeCursor(cursor) : null;
    const isPrev = direction === 'prev';
    const orderDesc = isPrev;

    const filteredCte = `
      WITH hasil AS (
        SELECT MIN(g.id) AS id, g.indonesia, g.asing
        FROM glosarium g
        WHERE g.aktif = TRUE
          AND LOWER(g.indonesia) LIKE ('%' || LOWER($1) || '%')
          AND LOWER(g.indonesia) ~ (
          '(^|[^[:alnum:]_])' ||
          regexp_replace(LOWER($1), '([.^$|()\\[\\]{}*+?\\\\-])', '\\\\\\1', 'g') ||
          '([^[:alnum:]_]|$)'
        )
        GROUP BY g.indonesia, g.asing
      )
    `;

    let total = 0;
    if (hitungTotal) {
      const countResult = await db.query(
        `${filteredCte}
         SELECT COUNT(*) AS total FROM hasil`,
        [trimmed]
      );
      total = parseCount(countResult.rows[0]?.total);
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
    }

    const params = [trimmed];
    let cursorClause = '';
    if (cursorPayload) {
      params.push(String(cursorPayload.indonesia || ''), Number(cursorPayload.id) || 0);
      const indonesiaIdx = params.length - 1;
      const idIdx = params.length;
      cursorClause = isPrev
        ? `WHERE (indonesia, id) < ($${indonesiaIdx}, $${idIdx})`
        : `WHERE (indonesia, id) > ($${indonesiaIdx}, $${idIdx})`;
    }

    params.push(cappedLimit + 1);
    const limitIdx = params.length;

    const dataResult = await db.query(
      `${filteredCte}
       SELECT id, indonesia, asing
       FROM hasil
       ${cursorClause}
       ORDER BY indonesia ${orderDesc ? 'DESC' : 'ASC'}, id ${orderDesc ? 'DESC' : 'ASC'}
       LIMIT $${limitIdx}`,
      params
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) {
      rows = rows.reverse();
    }

    const first = rows[0];
    const last = rows[rows.length - 1];

    let hasPrev = false;
    let hasNext = false;
    if (isPrev) {
      hasPrev = hasMore;
      hasNext = Boolean(cursorPayload);
    } else {
      hasPrev = Boolean(cursorPayload);
      hasNext = hasMore;
    }

    return {
      data: rows.map((row) => ({ indonesia: row.indonesia, asing: row.asing })),
      total,
      hasPrev,
      hasNext,
      prevCursor: first ? encodeCursor({ indonesia: first.indonesia, id: first.id }) : null,
      nextCursor: last ? encodeCursor({ indonesia: last.indonesia, id: last.id }) : null,
    };
  }
}

module.exports = ModelGlosarium;
module.exports.__private = {
  normalizeBoolean,
  parseOptionalPositiveInt,
  resolveMasterId,
  resolveBahasaId,
  buildMasterFilters,
  buildSumberFilters,
  buildJumlahEntriSumberSql,
  isNormalizedGlosariumSchema,
  forceNormalizedSchemaForTest(value) {
    forcedNormalizedSchemaForTest = typeof value === 'boolean' ? value : null;
  },
  resetNormalizedSchemaCache() {
    cachedNormalizedSchema = null;
    forcedNormalizedSchemaForTest = null;
  },
};
