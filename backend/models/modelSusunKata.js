/**
 * @fileoverview Model gim Susun Kata harian dan skor
 */

const db = require('../db');
const ModelEntri = require('./modelEntri');

const BASE_TANGGAL = '2026-01-01';

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parsePanjang(value, fallback = 5) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 4), 8);
}

function parsePenggunaId(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return null;
  return parsed > 0 ? parsed : null;
}

function hitungOffsetHari(tanggal) {
  const aman = parseTanggal(tanggal);
  if (!aman) return 0;

  const [tahun, bulan, hari] = aman.split('-').map((item) => Number.parseInt(item, 10));
  const [baseTahun, baseBulan, baseHari] = BASE_TANGGAL.split('-').map((item) => Number.parseInt(item, 10));

  const milidetikSekarang = Date.UTC(tahun, bulan - 1, hari);
  const milidetikBase = Date.UTC(baseTahun, baseBulan - 1, baseHari);
  return Math.floor((milidetikSekarang - milidetikBase) / 86400000);
}

function hitungSkor({ percobaan, menang }) {
  if (!menang) return 0;
  const percobaanAman = Math.min(Math.max(Number.parseInt(percobaan, 10) || 6, 1), 6);
  return Math.max(11 - percobaanAman, 1);
}

class ModelSusunKata {
  static parsePanjang(value, fallback = 5) {
    return parsePanjang(value, fallback);
  }

  static parsePenggunaId(value) {
    return parsePenggunaId(value);
  }

  static hitungSkor(payload) {
    return hitungSkor(payload);
  }

  static async ambilTanggalHariIniJakarta() {
    const result = await db.query(
      `SELECT to_char((now() AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS tanggal`
    );
    return result.rows[0]?.tanggal || null;
  }

  static async ambilHarian({ tanggal, panjang }) {
    const tanggalAman = parseTanggal(tanggal);
    const panjangAman = parsePanjang(panjang, 5);
    if (!tanggalAman) return null;

    const result = await db.query(
      `SELECT id, tanggal, panjang, kata, keterangan, created_at, updated_at
       FROM susun_kata
       WHERE tanggal = $1::date AND panjang = $2
       LIMIT 1`,
      [tanggalAman, panjangAman]
    );

    return result.rows[0] || null;
  }

  static async daftarHarianAdmin({ tanggal = null, panjang = null, limit = 200 }) {
    const tanggalAman = parseTanggal(tanggal);
    const panjangAman = panjang === null || panjang === undefined || String(panjang).trim() === ''
      ? null
      : parsePanjang(panjang, 5);
    const limitAman = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 1000);

    const kondisi = [];
    const values = [];

    if (tanggalAman) {
      values.push(tanggalAman);
      kondisi.push(`sk.tanggal = $${values.length}::date`);
    }

    if (panjangAman !== null) {
      values.push(panjangAman);
      kondisi.push(`sk.panjang = $${values.length}`);
    }

    values.push(limitAman);
    const limitParam = values.length;

    const whereClause = kondisi.length ? `WHERE ${kondisi.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT
         sk.id,
         to_char(sk.tanggal, 'YYYY-MM-DD') AS tanggal,
         sk.panjang,
         sk.kata,
         sk.keterangan,
         sk.created_at,
         sk.updated_at,
         COUNT(ss.id) AS jumlah_peserta
       FROM susun_kata sk
       LEFT JOIN susun_kata_skor ss ON ss.susun_kata_id = sk.id
       ${whereClause}
       GROUP BY sk.id, sk.tanggal, sk.panjang, sk.kata, sk.keterangan, sk.created_at, sk.updated_at
       ORDER BY sk.tanggal DESC, sk.panjang ASC
       LIMIT $${limitParam}`,
      values
    );

    return result.rows.map((row) => ({
      id: Number(row.id) || 0,
      tanggal: row.tanggal,
      panjang: Number(row.panjang) || 0,
      kata: row.kata,
      keterangan: row.keterangan,
      created_at: row.created_at,
      updated_at: row.updated_at,
      jumlahPeserta: Number(row.jumlah_peserta) || 0,
    }));
  }

  static async buatHarianOtomatis({ tanggal, panjang }) {
    const tanggalAman = parseTanggal(tanggal);
    const panjangAman = parsePanjang(panjang, 5);
    if (!tanggalAman) return null;

    const kamus = await ModelEntri.ambilKamusSusunKata({ panjang: panjangAman, limit: 10000 });
    if (!kamus.length) return null;

    const offsetHari = hitungOffsetHari(tanggalAman);
    const indexKata = ((offsetHari % kamus.length) + kamus.length) % kamus.length;
    const kata = String(kamus[indexKata] || '').trim().toLowerCase();

    const insertResult = await db.query(
      `INSERT INTO susun_kata (tanggal, panjang, kata)
       VALUES ($1::date, $2, $3)
       ON CONFLICT (tanggal, panjang) DO NOTHING
       RETURNING id, tanggal, panjang, kata, keterangan, created_at, updated_at`,
      [tanggalAman, panjangAman, kata]
    );

    if (insertResult.rows[0]) {
      return insertResult.rows[0];
    }

    return this.ambilHarian({ tanggal: tanggalAman, panjang: panjangAman });
  }

  static async ambilAtauBuatHarian({ tanggal, panjang }) {
    const existing = await this.ambilHarian({ tanggal, panjang });
    if (existing) return existing;
    return this.buatHarianOtomatis({ tanggal, panjang });
  }

  static async simpanHarianAdmin({ tanggal, panjang, kata, penggunaId, keterangan = null }) {
    const tanggalAman = parseTanggal(tanggal);
    const panjangAman = parsePanjang(panjang, 5);
    const kataAman = String(kata || '').trim().toLowerCase();
    parsePenggunaId(penggunaId);
    const keteranganAman = String(keterangan || '').trim() || null;

    if (!tanggalAman) throw new Error('Tanggal tidak valid');
    if (!/^[a-z]+$/.test(kataAman)) throw new Error('Kata hanya boleh huruf a-z');
    if (kataAman.length !== panjangAman) throw new Error(`Kata harus ${panjangAman} huruf`);

    const valid = await ModelEntri.cekKataSusunKataValid(kataAman, { panjang: panjangAman });
    if (!valid) throw new Error('Kata tidak ditemukan pada kamus Susun Kata');

    const result = await db.query(
      `INSERT INTO susun_kata (tanggal, panjang, kata, keterangan)
       VALUES ($1::date, $2, $3, $4)
       ON CONFLICT (tanggal, panjang)
       DO UPDATE SET
         kata = EXCLUDED.kata,
         keterangan = EXCLUDED.keterangan,
         updated_at = now()
       RETURNING id, tanggal, panjang, kata, keterangan, created_at, updated_at`,
      [tanggalAman, panjangAman, kataAman, keteranganAman]
    );

    return result.rows[0] || null;
  }

  static async ambilSkorPenggunaHarian({ susunKataId, penggunaId }) {
    const susunKataIdAman = Number.parseInt(susunKataId, 10);
    const penggunaIdAman = parsePenggunaId(penggunaId);
    if (Number.isNaN(susunKataIdAman) || !penggunaIdAman) return null;

    const result = await db.query(
      `SELECT id, susun_kata_id, pengguna_id, percobaan, detik, tebakan, menang, created_at
       FROM susun_kata_skor
       WHERE susun_kata_id = $1 AND pengguna_id = $2
       LIMIT 1`,
      [susunKataIdAman, penggunaIdAman]
    );

    return result.rows[0] || null;
  }

  static async simpanSkorHarian({ susunKataId, penggunaId, percobaan, detik, tebakan, menang }) {
    const susunKataIdAman = Number.parseInt(susunKataId, 10);
    const penggunaIdAman = parsePenggunaId(penggunaId);
    const percobaanAman = Math.min(Math.max(Number.parseInt(percobaan, 10) || 6, 1), 6);
    const detikAman = Math.min(Math.max(Number.parseInt(detik, 10) || 0, 0), 86400);
    const tebakanAman = String(tebakan || '').trim().toLowerCase();
    const menangAman = Boolean(menang);

    const result = await db.query(
      `INSERT INTO susun_kata_skor (susun_kata_id, pengguna_id, percobaan, detik, tebakan, menang)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, susun_kata_id, pengguna_id, percobaan, detik, tebakan, menang, created_at`,
      [susunKataIdAman, penggunaIdAman, percobaanAman, detikAman, tebakanAman, menangAman]
    );

    return result.rows[0] || null;
  }

  static async ambilKlasemenHarian({ susunKataId, limit = 10 }) {
    const susunKataIdAman = Number.parseInt(susunKataId, 10);
    const limitAman = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 50);
    if (Number.isNaN(susunKataIdAman)) return [];

    const result = await db.query(
      `SELECT
         sk.pengguna_id,
         p.nama,
         sk.percobaan,
         sk.detik,
         sk.menang,
         CASE
           WHEN sk.menang THEN GREATEST(11 - sk.percobaan, 1)
           ELSE 0
         END AS skor,
         sk.created_at
       FROM susun_kata_skor sk
       JOIN pengguna p ON p.id = sk.pengguna_id
       WHERE sk.susun_kata_id = $1
       ORDER BY skor DESC, sk.detik ASC, sk.created_at ASC
       LIMIT $2`,
      [susunKataIdAman, limitAman]
    );

    return result.rows.map((row) => ({
      pengguna_id: Number(row.pengguna_id) || 0,
      nama: row.nama,
      percobaan: Number(row.percobaan) || 0,
      detik: Number(row.detik) || 0,
      menang: Boolean(row.menang),
      skor: Number(row.skor) || 0,
      created_at: row.created_at,
    }));
  }

  static async ambilPesertaHarian({ susunKataId, limit = 200 }) {
    const susunKataIdAman = Number.parseInt(susunKataId, 10);
    const limitAman = Math.min(Math.max(Number.parseInt(limit, 10) || 200, 1), 1000);
    if (Number.isNaN(susunKataIdAman)) return [];

    const result = await db.query(
      `SELECT
         sk.pengguna_id,
         p.nama,
         sk.percobaan,
         sk.detik,
         sk.menang,
         CASE
           WHEN sk.menang THEN GREATEST(11 - sk.percobaan, 1)
           ELSE 0
         END AS skor,
         sk.created_at
       FROM susun_kata_skor sk
       JOIN pengguna p ON p.id = sk.pengguna_id
       WHERE sk.susun_kata_id = $1
       ORDER BY skor DESC, sk.detik ASC, sk.created_at ASC
       LIMIT $2`,
      [susunKataIdAman, limitAman]
    );

    return result.rows.map((row) => ({
      pengguna_id: Number(row.pengguna_id) || 0,
      nama: row.nama,
      percobaan: Number(row.percobaan) || 0,
      detik: Number(row.detik) || 0,
      menang: Boolean(row.menang),
      skor: Number(row.skor) || 0,
      created_at: row.created_at,
    }));
  }
}

module.exports = ModelSusunKata;
