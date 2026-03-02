/**
 * @fileoverview Model pelacakan kata pencarian terpopuler
 */

const db = require('../db');
const logger = require('../config/logger');

const domainKode = Object.freeze({
  kamus: 1,
  tesaurus: 2,
  glosarium: 3,
  makna: 4,
  rima: 5,
});

const daftarDomain = Object.values(domainKode);

function normalisasiKata(kata = '') {
  return String(kata || '').trim().replace(/\s+/g, ' ').toLowerCase();
}

function parseLimit(limit, defaultValue = 10) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, 1), 100);
}

function parseLimitRedaksi(limit, defaultValue = 200) {
  const parsed = Number.parseInt(limit, 10);
  if (Number.isNaN(parsed)) return defaultValue;
  return Math.min(Math.max(parsed, 1), 1000);
}

function parsePeriode(periode) {
  const normalized = String(periode || 'all').trim().toLowerCase();
  return normalized === '7hari' ? '7hari' : 'all';
}

function parsePeriodeRedaksi(periode) {
  const normalized = String(periode || '7hari').trim().toLowerCase();
  if (normalized === 'all') return 'all';
  if (normalized === '30hari') return '30hari';
  return '7hari';
}

function parseDomain(domain, fallback = domainKode.kamus) {
  const parsed = Number.parseInt(domain, 10);
  if (!daftarDomain.includes(parsed)) {
    return fallback;
  }
  return parsed;
}

function parseDomainNullable(domain) {
  if (domain === null || domain === undefined || domain === '') return null;
  const parsed = Number.parseInt(domain, 10);
  return daftarDomain.includes(parsed) ? parsed : null;
}

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function formatTanggalOutput(value) {
  if (!value) return null;

  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const raw = String(value).trim();
  if (!raw) return null;
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}

function namaDomain(domain) {
  const parsed = parseDomainNullable(domain);
  switch (parsed) {
    case 1: return 'kamus';
    case 2: return 'tesaurus';
    case 3: return 'glosarium';
    case 4: return 'makna';
    case 5: return 'rima';
    default: return 'lainnya';
  }
}

function isPelacakanAktif() {
  const raw = process.env.TRACK_SEARCH;
  if (raw === undefined) {
    return process.env.NODE_ENV !== 'development';
  }
  return String(raw).toLowerCase() === 'true';
}

class ModelPencarian {
  static pelacakanAktif() {
    return isPelacakanAktif();
  }

  static async catatPencarian(kata, { domain = domainKode.kamus, jumlah = 1 } = {}) {
    if (!isPelacakanAktif()) {
      return false;
    }

    const kataNormal = normalisasiKata(kata);
    if (!kataNormal) {
      return false;
    }

    const jumlahAman = Math.max(Number.parseInt(jumlah, 10) || 1, 1);
    const domainAman = parseDomain(domain, domainKode.kamus);

    try {
      await db.query(
        `INSERT INTO pencarian (tanggal, domain, kata, jumlah)
         VALUES (CURRENT_DATE, $1, $2, $3)`,
        [domainAman, kataNormal, jumlahAman]
      );
      return true;
    } catch (error) {
      logger.warn(`Gagal mencatat pelacakan pencarian: ${error.message}`);
      return false;
    }
  }

  static async ambilKataTerpopuler({ periode = 'all', limit = 10, domain = domainKode.kamus } = {}) {
    const periodeAman = parsePeriode(periode);
    const limitAman = parseLimit(limit, 10);
    const domainAman = parseDomain(domain, domainKode.kamus);

    if (periodeAman === '7hari') {
      const result = await db.query(
        `SELECT kata, SUM(jumlah)::bigint AS jumlah
         FROM pencarian
         WHERE domain = $1
           AND tanggal >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY kata
         ORDER BY jumlah DESC, kata ASC
         LIMIT $2`,
        [domainAman, limitAman]
      );

      return result.rows.map((row) => ({
        kata: row.kata,
        jumlah: Number(row.jumlah) || 0,
      }));
    }

    const result = await db.query(
      `SELECT kata, SUM(jumlah)::bigint AS jumlah
       FROM pencarian
       WHERE domain = $1
       GROUP BY kata
       ORDER BY jumlah DESC, kata ASC
       LIMIT $2`,
      [domainAman, limitAman]
    );

    return result.rows.map((row) => ({
      kata: row.kata,
      jumlah: Number(row.jumlah) || 0,
    }));
  }

  static async ambilFrasaPopulerPerDomain({ tanggalReferensi = null } = {}) {
    const tanggalAman = parseTanggal(tanggalReferensi) || new Date().toISOString().slice(0, 10);
    const daftarDomainAman = [...daftarDomain];

    const result = await db.query(
      `WITH daftar_domain AS (
         SELECT UNNEST($1::int[]) AS domain
       ),
       tanggal_aktif AS (
         SELECT d.domain,
                MAX(p.tanggal) AS tanggal
         FROM daftar_domain d
         LEFT JOIN pencarian p
           ON p.domain = d.domain
          AND p.tanggal <= $2::date
         GROUP BY d.domain
       ),
       peringkat_kata AS (
         SELECT p.domain,
                p.tanggal,
                p.kata,
                SUM(p.jumlah)::bigint AS jumlah,
                ROW_NUMBER() OVER (
                  PARTITION BY p.domain, p.tanggal
                  ORDER BY SUM(p.jumlah) DESC, p.kata ASC
                ) AS urutan
         FROM pencarian p
         JOIN tanggal_aktif t
           ON t.domain = p.domain
          AND t.tanggal = p.tanggal
         GROUP BY p.domain, p.tanggal, p.kata
       )
       SELECT t.domain,
              t.tanggal,
              r.kata,
              r.jumlah
       FROM tanggal_aktif t
       LEFT JOIN peringkat_kata r
         ON r.domain = t.domain
        AND r.tanggal = t.tanggal
        AND r.urutan = 1
       ORDER BY t.domain ASC`,
      [daftarDomainAman, tanggalAman]
    );

    const petaHasil = new Map(
      result.rows.map((row) => [Number(row.domain), {
        tanggal: formatTanggalOutput(row.tanggal),
        kata: row.kata,
        jumlah: Number(row.jumlah) || 0,
      }])
    );

    return daftarDomainAman.map((domain) => {
      const item = petaHasil.get(domain);
      return {
        domain,
        domain_nama: namaDomain(domain),
        tanggal: item?.tanggal || null,
        kata: item?.kata || null,
        jumlah: item?.jumlah || 0,
      };
    });
  }

  static async ambilStatistikRedaksi({
    domain = null,
    periode = '7hari',
    limit = 200,
    tanggalMulai = null,
    tanggalSelesai = null,
  } = {}) {
    const limitAman = parseLimitRedaksi(limit, 200);
    const domainAman = parseDomainNullable(domain);
    const periodeAman = parsePeriodeRedaksi(periode);
    const tanggalMulaiAman = parseTanggal(tanggalMulai);
    const tanggalSelesaiAman = parseTanggal(tanggalSelesai);

    const where = [];
    const params = [];

    if (domainAman) {
      params.push(domainAman);
      where.push(`domain = $${params.length}`);
    }

    if (tanggalMulaiAman) {
      params.push(tanggalMulaiAman);
      where.push(`tanggal >= $${params.length}::date`);
    }

    if (tanggalSelesaiAman) {
      params.push(tanggalSelesaiAman);
      where.push(`tanggal <= $${params.length}::date`);
    }

    if (!tanggalMulaiAman && !tanggalSelesaiAman) {
      if (periodeAman === '7hari') {
        where.push("tanggal >= CURRENT_DATE - INTERVAL '6 days'");
      } else if (periodeAman === '30hari') {
        where.push("tanggal >= CURRENT_DATE - INTERVAL '29 days'");
      }
    }

    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';

    params.push(limitAman);
    const limitParam = `$${params.length}`;

        const rowsQuery = `
          SELECT domain, kata, SUM(jumlah)::bigint AS jumlah,
            MIN(created_at) AS tanggal_awal,
            MAX(updated_at) AS tanggal_akhir
      FROM pencarian
      ${whereClause}
      GROUP BY domain, kata
      ORDER BY jumlah DESC, tanggal_akhir DESC, domain ASC, kata ASC
      LIMIT ${limitParam}`;

    const summaryQuery = `
      SELECT domain, SUM(jumlah)::bigint AS jumlah
      FROM pencarian
      ${whereClause}
      GROUP BY domain
      ORDER BY domain ASC`;

    const rowsResult = await db.query(rowsQuery, params);
    const summaryResult = await db.query(summaryQuery, params.slice(0, -1));

    const data = rowsResult.rows.map((row) => ({
      domain: Number(row.domain) || 0,
      domain_nama: namaDomain(row.domain),
      kata: row.kata,
      jumlah: Number(row.jumlah) || 0,
      tanggal_awal: row.tanggal_awal,
      tanggal_akhir: row.tanggal_akhir,
    }));

    const ringkasanDomain = summaryResult.rows.map((row) => ({
      domain: Number(row.domain) || 0,
      domain_nama: namaDomain(row.domain),
      jumlah: Number(row.jumlah) || 0,
    }));

    return {
      filter: {
        domain: domainAman,
        periode: periodeAman,
        tanggalMulai: tanggalMulaiAman,
        tanggalSelesai: tanggalSelesaiAman,
        limit: limitAman,
      },
      ringkasanDomain,
      data,
    };
  }
}

ModelPencarian.__private = {
  domainKode,
  daftarDomain,
  normalisasiKata,
  parseLimit,
  parseLimitRedaksi,
  parsePeriode,
  parsePeriodeRedaksi,
  parseDomain,
  parseDomainNullable,
  parseTanggal,
  formatTanggalOutput,
  namaDomain,
  isPelacakanAktif,
};

module.exports = ModelPencarian;
