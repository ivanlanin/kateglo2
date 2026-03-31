/**
 * @fileoverview Model gim Kuis Kata untuk generator soal dan rekap harian.
 */

const db = require('../../db');

const jumlahKandidat = 12;
const batasRiwayatPerMode = 3;

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parsePenggunaId(value) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return null;
  return parsed;
}

function parseBilangan(value, { fallback = 0, min = 0, max = 1000 } = {}) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, min), max);
}

function mapRekapHarian(row = {}, { fallbackTanggal = undefined } = {}) {
  return {
    id: Number(row.id) || 0,
    pengguna_id: Number(row.pengguna_id) || 0,
    nama: row.nama,
    tanggal: row.tanggal || fallbackTanggal,
    jumlah_benar: Number(row.jumlah_benar) || 0,
    jumlah_pertanyaan: Number(row.jumlah_pertanyaan) || 0,
    durasi_detik: Number(row.durasi_detik) || 0,
    jumlah_main: Number(row.jumlah_main) || 0,
    skor_total: Number(row.skor_total) || ((Number(row.jumlah_benar) || 0) * 10),
  };
}

async function queryAcak(sql, params = []) {
  const result = await db.query(sql, params);
  if (result.rows.length > 0) return result;

  const sqlFull = sql.replace(/\s+TABLESAMPLE\s+SYSTEM\(\d+\)/gi, '');
  const butuhOrderAcak = !/ORDER\s+BY\s+RANDOM\(\)/i.test(sqlFull);
  const limitMatch = sqlFull.match(/LIMIT\s+(\d+)/i);
  let sqlFallback = sqlFull;

  if (butuhOrderAcak && limitMatch) {
    sqlFallback = sqlFull.replace(/\s+LIMIT\s+\d+/i, ` ORDER BY RANDOM() LIMIT ${limitMatch[1]}`);
  } else if (butuhOrderAcak) {
    sqlFallback = `${sqlFull} ORDER BY RANDOM() LIMIT ${jumlahKandidat}`;
  }

  return db.query(sqlFallback, params);
}

function acakDariArray(items) {
  if (!Array.isArray(items) || items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)];
}

function acakArray(items) {
  if (!Array.isArray(items)) return [];
  const hasil = [...items];
  for (let i = hasil.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [hasil[i], hasil[j]] = [hasil[j], hasil[i]];
  }
  return hasil;
}

function normalisasiDaftar(teks) {
  return String(teks || '')
    .split(/[;,]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function pilihBerbeda(items, pembanding) {
  const kandidat = (Array.isArray(items) ? items : []).filter((item) => !pembanding(item));
  return acakDariArray(kandidat);
}

function normalisasiRiwayatMode(items) {
  if (!Array.isArray(items)) return [];

  const unik = new Set();
  const hasil = [];
  for (const item of items) {
    const nilai = String(item || '').trim().toLowerCase();
    if (!nilai || unik.has(nilai)) continue;
    unik.add(nilai);
    hasil.push(nilai);
  }

  if (hasil.length <= batasRiwayatPerMode) {
    return hasil;
  }

  return hasil.slice(-batasRiwayatPerMode);
}

function buatFilterRiwayat(columnSql, riwayat, startIndex = 1) {
  const nilai = normalisasiRiwayatMode(riwayat);
  if (nilai.length === 0) {
    return { clause: '', params: [] };
  }

  const placeholders = nilai.map((_, index) => `$${startIndex + index}`).join(', ');
  return {
    clause: ` AND LOWER(${columnSql}) NOT IN (${placeholders})`,
    params: nilai,
  };
}

function acakPilihan(benar, salah) {
  if (Math.random() < 0.5) {
    return { pilihan: [benar, salah], jawaban: 0 };
  }
  return { pilihan: [salah, benar], jawaban: 1 };
}

function potong(teks, maks = 80) {
  const t = String(teks || '').trim();
  if (t.length <= maks) return t;
  return `${t.slice(0, maks - 1)}…`;
}

async function soalKamus({ riwayat = [] } = {}) {
  const filterRiwayat = buatFilterRiwayat('e.indeks', riwayat);
  const soalRes = await queryAcak(
    `SELECT e.indeks, m.makna AS makna_benar
     FROM entri e TABLESAMPLE SYSTEM(10)
     JOIN makna m ON m.entri_id = e.id
     WHERE e.aktif = 1
       AND e.jenis = 'dasar'
       AND e.jenis_rujuk IS NULL
       AND m.aktif = true
       AND m.polisem = 1
       AND CHAR_LENGTH(e.indeks) BETWEEN 4 AND 12
       AND e.indeks NOT LIKE '% %'
       AND CHAR_LENGTH(m.makna) BETWEEN 10 AND 100
       ${filterRiwayat.clause}
     LIMIT ${jumlahKandidat}`,
    filterRiwayat.params,
  );

  const soal = acakDariArray(soalRes.rows);
  if (!soal) return null;

  const distractorRes = await queryAcak(
    `SELECT m.makna AS makna_salah
     FROM makna m TABLESAMPLE SYSTEM(10)
     JOIN entri e ON e.id = m.entri_id
     WHERE m.aktif = true
       AND m.polisem = 1
       AND LOWER(e.indeks) != LOWER($1)
       AND CHAR_LENGTH(m.makna) BETWEEN 10 AND 100
     LIMIT ${jumlahKandidat}`,
    [soal.indeks],
  );

  const distractor = pilihBerbeda(distractorRes.rows, (item) => potong(item.makna_salah) === potong(soal.makna_benar));
  if (!distractor) return null;

  const benar = potong(soal.makna_benar);
  const salah = potong(distractor.makna_salah);
  const { pilihan, jawaban } = acakPilihan(benar, salah);

  return {
    mode: 'kamus',
    soal: soal.indeks,
    kunciSoal: soal.indeks,
    konteks: null,
    pilihan,
    jawaban,
    penjelasan: `${soal.indeks} artinya: ${benar}.`,
  };
}

async function soalTesaurus({ riwayat = [] } = {}) {
  const filterRiwayat = buatFilterRiwayat('t.indeks', riwayat);
  const soalRes = await queryAcak(
    `SELECT t.indeks, t.sinonim, t.antonim
     FROM tesaurus t TABLESAMPLE SYSTEM(20)
     WHERE t.aktif = true
       AND (
         (t.sinonim IS NOT NULL AND t.sinonim != '')
         OR (t.antonim IS NOT NULL AND t.antonim != '')
       )
       ${filterRiwayat.clause}
     LIMIT ${jumlahKandidat}`,
    filterRiwayat.params,
  );

  const soal = acakDariArray(soalRes.rows);
  if (!soal) return null;

  const daftarRelasi = [];
  if (String(soal.sinonim || '').trim()) {
    daftarRelasi.push({ tipe: 'sinonim', nilai: soal.sinonim });
  }
  if (String(soal.antonim || '').trim()) {
    daftarRelasi.push({ tipe: 'antonim', nilai: soal.antonim });
  }
  if (daftarRelasi.length === 0) return null;

  const relasiDipilih = acakDariArray(daftarRelasi);
  const tokenRelasi = normalisasiDaftar(relasiDipilih.nilai);
  if (tokenRelasi.length === 0) return null;
  const jawabanBenar = acakDariArray(tokenRelasi);

  const distractorRes = await queryAcak(
    `SELECT e.indeks AS kata_salah
     FROM entri e TABLESAMPLE SYSTEM(10)
     WHERE e.aktif = 1
       AND e.jenis = 'dasar'
       AND e.jenis_rujuk IS NULL
       AND LOWER(e.indeks) != LOWER($1)
       AND LOWER(e.indeks) != LOWER($2)
       AND e.indeks NOT LIKE '% %'
       AND CHAR_LENGTH(e.indeks) BETWEEN 3 AND 15
     LIMIT ${jumlahKandidat}`,
    [soal.indeks, jawabanBenar],
  );

  const distractor = pilihBerbeda(distractorRes.rows, (item) => item.kata_salah.toLowerCase() === jawabanBenar.toLowerCase());
  if (!distractor) return null;

  const { pilihan, jawaban } = acakPilihan(jawabanBenar, distractor.kata_salah);

  return {
    mode: 'tesaurus',
    soal: soal.indeks,
    kunciSoal: soal.indeks,
    konteks: null,
    relasi: relasiDipilih.tipe,
    pilihan,
    jawaban,
    penjelasan: `${jawabanBenar} adalah ${relasiDipilih.tipe} dari ${soal.indeks}.`,
  };
}

async function soalGlosarium({ riwayat = [] } = {}) {
  const filterRiwayat = buatFilterRiwayat('g.asing', riwayat);
  const soalRes = await queryAcak(
    `SELECT g.asing, g.indonesia AS indonesia_benar
     FROM glosarium g TABLESAMPLE SYSTEM(10)
     JOIN bahasa ba ON ba.id = g.bahasa_id
     WHERE g.aktif = true
       AND (ba.iso2 = 'en' OR LOWER(ba.kode) = 'ing')
       AND CHAR_LENGTH(g.asing) BETWEEN 3 AND 25
       AND CHAR_LENGTH(g.indonesia) BETWEEN 3 AND 40
       ${filterRiwayat.clause}
      LIMIT ${jumlahKandidat}`,
    filterRiwayat.params,
  );

  const soal = acakDariArray(soalRes.rows);
  if (!soal) return null;

  const distractorRes = await queryAcak(
    `SELECT g.indonesia AS indonesia_salah
     FROM glosarium g TABLESAMPLE SYSTEM(10)
     WHERE g.aktif = true
       AND LOWER(g.indonesia) != LOWER($1)
       AND CHAR_LENGTH(g.indonesia) BETWEEN 3 AND 40
     LIMIT ${jumlahKandidat}`,
    [soal.indonesia_benar],
  );

  const distractor = pilihBerbeda(
    distractorRes.rows,
    (item) => item.indonesia_salah.toLowerCase() === soal.indonesia_benar.toLowerCase(),
  );
  if (!distractor) return null;

  const { pilihan, jawaban } = acakPilihan(soal.indonesia_benar, distractor.indonesia_salah);

  return {
    mode: 'glosarium',
    soal: soal.asing,
    kunciSoal: soal.asing,
    konteks: null,
    pilihan,
    jawaban,
    penjelasan: `Padanan Indonesia dari ‘${soal.asing}’ adalah ${soal.indonesia_benar}.`,
  };
}

async function soalMakna({ riwayat = [] } = {}) {
  const filterRiwayat = buatFilterRiwayat('m.makna', riwayat);
  const soalRes = await queryAcak(
    `SELECT e.indeks AS indeks_benar, m.makna
     FROM makna m TABLESAMPLE SYSTEM(10)
     JOIN entri e ON e.id = m.entri_id
     WHERE m.aktif = true
       AND m.polisem = 1
       AND e.aktif = 1
       AND e.jenis = 'dasar'
       AND e.jenis_rujuk IS NULL
       AND e.indeks NOT LIKE '% %'
       AND CHAR_LENGTH(m.makna) BETWEEN 10 AND 80
       ${filterRiwayat.clause}
      LIMIT ${jumlahKandidat}`,
    filterRiwayat.params,
  );

  const soal = acakDariArray(soalRes.rows);
  if (!soal) return null;

  const distractorRes = await queryAcak(
    `SELECT e.indeks AS indeks_salah
     FROM entri e TABLESAMPLE SYSTEM(10)
     WHERE e.aktif = 1
       AND e.jenis = 'dasar'
       AND e.jenis_rujuk IS NULL
       AND LOWER(e.indeks) != LOWER($1)
       AND e.indeks NOT LIKE '% %'
       AND CHAR_LENGTH(e.indeks) BETWEEN 3 AND 15
     LIMIT ${jumlahKandidat}`,
    [soal.indeks_benar],
  );

  const distractor = pilihBerbeda(
    distractorRes.rows,
    (item) => item.indeks_salah.toLowerCase() === soal.indeks_benar.toLowerCase(),
  );
  if (!distractor) return null;

  const maknaDisplay = potong(soal.makna, 80);
  const { pilihan, jawaban } = acakPilihan(soal.indeks_benar, distractor.indeks_salah);

  return {
    mode: 'makna',
    soal: maknaDisplay,
    kunciSoal: soal.makna,
    konteks: null,
    pilihan,
    jawaban,
    penjelasan: `Kata yang bermakna ‘${maknaDisplay}’ adalah ${soal.indeks_benar}.`,
  };
}

async function soalRima({ riwayat = [] } = {}) {
  for (let coba = 0; coba < 3; coba += 1) {
    const filterRiwayat = buatFilterRiwayat('e.indeks', riwayat);
    // eslint-disable-next-line no-await-in-loop
    const soalRes = await queryAcak(
      `SELECT e.indeks AS soal
       FROM entri e TABLESAMPLE SYSTEM(10)
       WHERE e.aktif = 1
         AND e.jenis = 'dasar'
         AND e.jenis_rujuk IS NULL
         AND e.indeks NOT LIKE '% %'
         AND CHAR_LENGTH(e.indeks) BETWEEN 4 AND 8
         AND e.indeks ~ '^[a-zA-Z]+$'
        ${filterRiwayat.clause}
       LIMIT ${jumlahKandidat}`,
      filterRiwayat.params,
    );

    const kandidatSoal = acakArray(soalRes.rows);
    if (kandidatSoal.length === 0) continue;

    for (const soal of kandidatSoal) {
      const panjangAkhiran = soal.soal.length > 5 && Math.random() < 0.5 ? 2 : 3;

      // eslint-disable-next-line no-await-in-loop
      const rimaRes = await queryAcak(
        `SELECT e.indeks AS rima_benar
         FROM entri e TABLESAMPLE SYSTEM(10)
         WHERE e.aktif = 1
           AND e.jenis = 'dasar'
           AND e.indeks NOT LIKE '% %'
           AND e.indeks ~ '^[a-zA-Z]+$'
           AND RIGHT(LOWER(e.indeks), $2) = RIGHT(LOWER($1), $2)
           AND LOWER(e.indeks) != LOWER($1)
         LIMIT ${jumlahKandidat}`,
        [soal.soal, panjangAkhiran],
      );

      const rimaBenar = pilihBerbeda(
        rimaRes.rows,
        (item) => item.rima_benar.toLowerCase() === soal.soal.toLowerCase(),
      );
      if (!rimaBenar) continue;

      // eslint-disable-next-line no-await-in-loop
      const distractorRes = await queryAcak(
        `SELECT e.indeks AS rima_salah
         FROM entri e TABLESAMPLE SYSTEM(10)
         WHERE e.aktif = 1
           AND e.jenis = 'dasar'
           AND e.indeks NOT LIKE '% %'
           AND e.indeks ~ '^[a-zA-Z]+$'
           AND RIGHT(LOWER(e.indeks), $2) != RIGHT(LOWER($1), $2)
           AND LOWER(e.indeks) != LOWER($1)
         LIMIT ${jumlahKandidat}`,
        [soal.soal, panjangAkhiran],
      );

      const distractor = pilihBerbeda(
        distractorRes.rows,
        (item) => item.rima_salah.toLowerCase() === rimaBenar.rima_benar.toLowerCase(),
      );
      if (!distractor) continue;

      const akhiran = soal.soal.slice(-panjangAkhiran).toLowerCase();
      const { pilihan, jawaban } = acakPilihan(rimaBenar.rima_benar, distractor.rima_salah);

      return {
        mode: 'rima',
        soal: soal.soal,
        kunciSoal: soal.soal,
        konteks: null,
        pilihan,
        jawaban,
        penjelasan: `${rimaBenar.rima_benar} berima dengan ${soal.soal} (keduanya berakhiran -${akhiran}).`,
      };
    }
  }

  return null;
}

class ModelKuisKata {
  static parseTanggal(value) {
    return parseTanggal(value);
  }

  static parsePenggunaId(value) {
    return parsePenggunaId(value);
  }

  static parseJumlahBenar(value, fallback = 0) {
    return parseBilangan(value, { fallback, min: 0, max: 100 });
  }

  static parseJumlahPertanyaan(value, fallback = 0) {
    return parseBilangan(value, { fallback, min: 0, max: 100 });
  }

  static parseDurasiDetik(value, fallback = 0) {
    return parseBilangan(value, { fallback, min: 0, max: 86400 });
  }

  static parseJumlahMain(value, fallback = 1) {
    return parseBilangan(value, { fallback, min: 0, max: 1000 });
  }

  static parseLimit(value, fallback = 10, maksimum = 1000) {
    return parseBilangan(value, { fallback, min: 1, max: maksimum });
  }

  static async ambilRonde({ riwayat = {} } = {}) {
    const privateApi = this.__private;
    const generator = [
      () => privateApi.soalKamus({ riwayat: riwayat.kamus }),
      () => privateApi.soalTesaurus({ riwayat: riwayat.tesaurus }),
      () => privateApi.soalGlosarium({ riwayat: riwayat.glosarium }),
      () => privateApi.soalMakna({ riwayat: riwayat.makna }),
      () => privateApi.soalRima({ riwayat: riwayat.rima }),
    ];

    const hasil = await Promise.all(generator.map((fn) => fn().catch(() => null)));

    const soalFinal = [];
    for (let i = 0; i < hasil.length; i += 1) {
      if (hasil[i]) {
        soalFinal.push(hasil[i]);
      } else {
        // eslint-disable-next-line no-await-in-loop
        const cadangan = await privateApi.soalKamus({ riwayat: riwayat.kamus }).catch(() => null);
        if (cadangan) soalFinal.push(cadangan);
      }
    }

    for (let i = soalFinal.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [soalFinal[i], soalFinal[j]] = [soalFinal[j], soalFinal[i]];
    }

    return soalFinal;
  }

  static async ambilTanggalHariIniJakarta() {
    const result = await db.query(
      `SELECT to_char((now() AT TIME ZONE 'Asia/Jakarta')::date, 'YYYY-MM-DD') AS tanggal`
    );
    return result.rows[0]?.tanggal || null;
  }

  static async simpanRekapHarian({
    penggunaId,
    tanggal = null,
    jumlahBenar,
    jumlahPertanyaan,
    durasiDetik = 0,
    jumlahMain = 1,
  }) {
    const penggunaIdAman = parsePenggunaId(penggunaId);
    if (!penggunaIdAman) {
      throw new Error('Pengguna tidak valid');
    }

    const tanggalAman = parseTanggal(tanggal) || await this.ambilTanggalHariIniJakarta();
    if (!tanggalAman) {
      throw new Error('Tanggal tidak valid');
    }

    const jumlahPertanyaanAman = this.parseJumlahPertanyaan(jumlahPertanyaan, 0);
    const jumlahBenarAman = this.parseJumlahBenar(jumlahBenar, 0);
    const durasiDetikAman = this.parseDurasiDetik(durasiDetik, 0);
    const jumlahMainAman = this.parseJumlahMain(jumlahMain, 1);

    if (jumlahPertanyaanAman <= 0) {
      throw new Error('Jumlah pertanyaan harus lebih dari 0');
    }

    if (jumlahBenarAman > jumlahPertanyaanAman) {
      throw new Error('Jumlah benar tidak boleh melebihi jumlah pertanyaan');
    }

    const result = await db.query(
      `INSERT INTO kuis_kata (
         pengguna_id,
         tanggal,
         jumlah_benar,
         jumlah_pertanyaan,
         durasi_detik,
         jumlah_main
       )
       VALUES ($1, $2::date, $3, $4, $5, $6)
       ON CONFLICT (pengguna_id, tanggal)
       DO UPDATE SET
         jumlah_benar = kuis_kata.jumlah_benar + EXCLUDED.jumlah_benar,
         jumlah_pertanyaan = kuis_kata.jumlah_pertanyaan + EXCLUDED.jumlah_pertanyaan,
         durasi_detik = kuis_kata.durasi_detik + EXCLUDED.durasi_detik,
         jumlah_main = kuis_kata.jumlah_main + EXCLUDED.jumlah_main
       RETURNING
         id,
         pengguna_id,
         to_char(tanggal, 'YYYY-MM-DD') AS tanggal,
         jumlah_benar,
         jumlah_pertanyaan,
         durasi_detik,
         jumlah_main`,
      [
        penggunaIdAman,
        tanggalAman,
        jumlahBenarAman,
        jumlahPertanyaanAman,
        durasiDetikAman,
        jumlahMainAman,
      ]
    );

    return mapRekapHarian(result.rows[0], { fallbackTanggal: tanggalAman });
  }

  static async ambilSkorPenggunaHarian({ penggunaId, tanggal = null } = {}) {
    const penggunaIdAman = parsePenggunaId(penggunaId);
    if (!penggunaIdAman) return null;

    const tanggalAman = parseTanggal(tanggal) || await this.ambilTanggalHariIniJakarta();
    if (!tanggalAman) return null;

    const result = await db.query(
      `SELECT
         kk.id,
         kk.pengguna_id,
         to_char(kk.tanggal, 'YYYY-MM-DD') AS tanggal,
         kk.jumlah_benar,
         kk.jumlah_pertanyaan,
         kk.durasi_detik,
         kk.jumlah_main,
         (kk.jumlah_benar * 10) AS skor_total
       FROM kuis_kata kk
       WHERE kk.pengguna_id = $1
         AND kk.tanggal = $2::date
       LIMIT 1`,
      [penggunaIdAman, tanggalAman]
    );

    if (!result.rows[0]) {
      return null;
    }

    return mapRekapHarian(result.rows[0], { fallbackTanggal: tanggalAman });
  }

  static async ambilKlasemenHarian({ tanggal = null, limit = 10 } = {}) {
    const tanggalAman = parseTanggal(tanggal) || await this.ambilTanggalHariIniJakarta();
    const limitAman = this.parseLimit(limit, 10, 50);

    const result = await db.query(
      `SELECT
         kk.id,
         kk.pengguna_id,
         p.nama,
         to_char(kk.tanggal, 'YYYY-MM-DD') AS tanggal,
         kk.jumlah_benar,
         kk.jumlah_pertanyaan,
         kk.durasi_detik,
         kk.jumlah_main,
         (kk.jumlah_benar * 10) AS skor_total
       FROM kuis_kata kk
       JOIN pengguna p ON p.id = kk.pengguna_id
       WHERE kk.tanggal = $1::date
       ORDER BY kk.jumlah_benar DESC, kk.durasi_detik ASC, kk.jumlah_main DESC, LOWER(p.nama) ASC
       LIMIT $2`,
      [tanggalAman, limitAman]
    );

    return result.rows.map((row) => mapRekapHarian(row));
  }

  static async hitungPesertaHarian({ tanggal = null } = {}) {
    const tanggalAman = parseTanggal(tanggal);

    const result = await db.query(
      `SELECT COUNT(DISTINCT kk.pengguna_id)::bigint AS total
       FROM kuis_kata kk
       WHERE kk.tanggal = COALESCE($1::date, (now() AT TIME ZONE 'Asia/Jakarta')::date)`,
      [tanggalAman]
    );

    return Number(result.rows[0]?.total) || 0;
  }

  static async daftarRekapAdmin({ tanggal = null, limit = 200 } = {}) {
    const tanggalAman = parseTanggal(tanggal);
    const limitAman = this.parseLimit(limit, 200, 1000);
    const values = [];
    const kondisi = [];

    if (tanggalAman) {
      values.push(tanggalAman);
      kondisi.push(`kk.tanggal = $${values.length}::date`);
    }

    values.push(limitAman);
    const limitParam = values.length;
    const whereClause = kondisi.length ? `WHERE ${kondisi.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT
         kk.id,
         kk.pengguna_id,
         p.nama,
         to_char(kk.tanggal, 'YYYY-MM-DD') AS tanggal,
         kk.jumlah_benar,
         kk.jumlah_pertanyaan,
         kk.durasi_detik,
         kk.jumlah_main,
         (kk.jumlah_benar * 10) AS skor_total
       FROM kuis_kata kk
       JOIN pengguna p ON p.id = kk.pengguna_id
       ${whereClause}
       ORDER BY kk.tanggal DESC, kk.jumlah_benar DESC, kk.durasi_detik ASC, kk.jumlah_main DESC, LOWER(p.nama) ASC
       LIMIT $${limitParam}`,
      values
    );

    return result.rows.map((row) => mapRekapHarian(row));
  }
}

ModelKuisKata.__private = {
  parseBilangan,
  acakDariArray,
  acakArray,
  acakPilihan,
  buatFilterRiwayat,
  normalisasiDaftar,
  normalisasiRiwayatMode,
  potong,
  pilihBerbeda,
  queryAcak,
  soalGlosarium,
  soalKamus,
  soalMakna,
  soalRima,
  soalTesaurus,
};

module.exports = ModelKuisKata;
