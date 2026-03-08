/**
 * @fileoverview Model untuk gim Pilih Ganda — query soal per domain
 *
 * Lima domain: kamus, tesaurus, glosarium, makna, rima.
 * Setiap metode mengembalikan objek soal lengkap:
 *   { mode, soal, konteks, pilihan, jawaban, penjelasan }
 * Urutan pilihan sudah diacak sehingga jawaban tidak selalu di posisi tetap.
 */

const db = require('../db');

const jumlahKandidat = 12;
const batasRiwayatPerMode = 3;

/**
 * Jalankan SQL yang mengandung TABLESAMPLE. Jika hasilnya kosong
 * (TABLESAMPLE kebetulan tidak menyertakan halaman berisi baris lolos filter),
 * ulangi tanpa TABLESAMPLE agar tetap mendapat hasil.
 * @param {string} sql  - Query SQL yang mengandung `TABLESAMPLE SYSTEM(N)`
 * @param {any[]}  params
 * @returns {Promise<{rows: any[]}>}
 */
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

/**
 * Acak urutan array (Fisher-Yates), kembalikan { pilihan, jawaban }
 * dengan jawaban = indeks baru dari item yang semula di posisi 0.
 * @param {string} benar
 * @param {string} salah
 * @returns {{ pilihan: string[], jawaban: number }}
 */
function acakPilihan(benar, salah) {
  if (Math.random() < 0.5) {
    return { pilihan: [benar, salah], jawaban: 0 };
  }
  return { pilihan: [salah, benar], jawaban: 1 };
}

/**
 * Potong teks agar tidak melebihi batas karakter.
 * @param {string} teks
 * @param {number} maks
 * @returns {string}
 */
function potong(teks, maks = 80) {
  const t = String(teks || '').trim();
  if (t.length <= maks) return t;
  return `${t.slice(0, maks - 1)}\u2026`;
}

/**
 * Ambil satu soal mode kamus.
 * Soal: "Apa arti dari [indeks]?"
 * @returns {Promise<object|null>}
 */
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

/**
 * Ambil satu soal mode tesaurus.
 * Soal: "Apa sinonim/antonim [indeks]?"
 * @returns {Promise<object|null>}
 */
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

/**
 * Ambil satu soal mode glosarium.
 * Soal: "Apa padanan Indonesia dari [asing]?"
 * @returns {Promise<object|null>}
 */
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
    penjelasan: `Padanan Indonesia dari \u2018${soal.asing}\u2019 adalah ${soal.indonesia_benar}.`,
  };
}

/**
 * Ambil satu soal mode makna (kamus terbalik).
 * Soal: "Kata mana yang bermakna: [makna]?"
 * @returns {Promise<object|null>}
 */
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
    penjelasan: `Kata yang bermakna \u2018${maknaDisplay}\u2019 adalah ${soal.indeks_benar}.`,
  };
}

/**
 * Ambil satu soal mode rima.
 * Soal: "Mana yang berima dengan [kata]?"
 * @returns {Promise<object|null>}
 */
async function soalRima({ riwayat = [] } = {}) {
  // Coba maksimal 3 kali agar bisa mendapat pasangan rima yang valid
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

/**
 * Ambil satu ronde lengkap: 5 soal dari 5 domain berbeda, urutan diacak.
 * Jika salah satu domain gagal, fallback ke soal kamus tambahan.
 * @returns {Promise<object[]>} Array 5 soal
 */
async function ambilRonde({ riwayat = {} } = {}) {
  const privateApi = module.exports.__private;
  const generator = [
    () => privateApi.soalKamus({ riwayat: riwayat.kamus }),
    () => privateApi.soalTesaurus({ riwayat: riwayat.tesaurus }),
    () => privateApi.soalGlosarium({ riwayat: riwayat.glosarium }),
    () => privateApi.soalMakna({ riwayat: riwayat.makna }),
    () => privateApi.soalRima({ riwayat: riwayat.rima }),
  ];

  const hasil = await Promise.all(generator.map((fn) => fn().catch(() => null)));

  // Ganti slot yang null dengan soal kamus cadangan
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

  // Acak urutan soal
  for (let i = soalFinal.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [soalFinal[i], soalFinal[j]] = [soalFinal[j], soalFinal[i]];
  }

  return soalFinal;
}

module.exports = { ambilRonde };
module.exports.__private = {
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
  ambilRonde,
};
