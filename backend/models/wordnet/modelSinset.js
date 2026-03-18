/**
 * @fileoverview Model untuk tabel sinset, sinset_lema, relasi_sinset (domain WordNet)
 *
 * Fat model: semua query database ada di sini.
 * Digunakan oleh route redaksi untuk kurasi WordNet Indonesia.
 */

const db = require('../../db');
const { parseCount } = require('../../utils/modelUtils');
const { decodeCursor, encodeCursor } = require('../../utils/cursorPagination');

const KELAS_KATA_VALID = ['n', 'v', 'a', 'r'];
const STATUS_VALID = ['draf', 'tinjau', 'terverifikasi'];

const NAMA_KELAS = { n: 'nomina', v: 'verba', a: 'adjektiva', r: 'adverbia' };

function parseNullableInteger(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

/**
 * Build WHERE clause fragments from filter params.
 */
function buildSinsetWhereClause({ q = '', status = '', kelasKata = '', adaPemetaan = '', akar = '' } = {}) {
  const conditions = [];
  const params = [];

  if (q) {
    params.push(`%${q}%`);
    conditions.push(`(
      s.id ILIKE $${params.length}
      OR s.definisi_en ILIKE $${params.length}
      OR s.definisi_id ILIKE $${params.length}
      OR EXISTS (
        SELECT 1 FROM sinset_lema sl2 WHERE sl2.sinset_id = s.id AND sl2.lema ILIKE $${params.length}
      )
    )`);
  }

  if (status && STATUS_VALID.includes(status)) {
    params.push(status);
    conditions.push(`s.status = $${params.length}`);
  }

  if (kelasKata && KELAS_KATA_VALID.includes(kelasKata)) {
    params.push(kelasKata);
    conditions.push(`s.kelas_kata = $${params.length}`);
  }

  if (adaPemetaan === '1') {
    conditions.push(`EXISTS (
      SELECT 1 FROM sinset_lema sl3 WHERE sl3.sinset_id = s.id AND sl3.makna_id IS NOT NULL
    )`);
  } else if (adaPemetaan === '0') {
    conditions.push(`EXISTS (
      SELECT 1 FROM sinset_lema sl3 WHERE sl3.sinset_id = s.id
    ) AND NOT EXISTS (
      SELECT 1 FROM sinset_lema sl4 WHERE sl4.sinset_id = s.id AND sl4.makna_id IS NOT NULL
    )`);
  }

  if (akar === '1') {
    conditions.push(`NOT EXISTS (
      SELECT 1 FROM relasi_sinset rs_akar
      WHERE rs_akar.sinset_asal = s.id
        AND rs_akar.tipe_relasi IN ('hipernim', 'hipernim_instans')
    )`);
  } else if (akar === '0') {
    conditions.push(`EXISTS (
      SELECT 1 FROM relasi_sinset rs_akar
      WHERE rs_akar.sinset_asal = s.id
        AND rs_akar.tipe_relasi IN ('hipernim', 'hipernim_instans')
    )`);
  }

  return { conditions, params };
}

class ModelSinset {
  /**
   * Statistik dashboard: jumlah per status, per kelas_kata, pemetaan, dll.
   */
  static async statistik() {
    const result = await db.query(`
      SELECT
        (SELECT COUNT(*) FROM sinset) AS total_sinset,
        (SELECT COUNT(*) FROM sinset WHERE status = 'draf') AS draf,
        (SELECT COUNT(*) FROM sinset WHERE status = 'tinjau') AS tinjau,
        (SELECT COUNT(*) FROM sinset WHERE status = 'terverifikasi') AS terverifikasi,
        (SELECT COUNT(*) FROM sinset_lema) AS total_lema,
        (SELECT COUNT(*) FROM sinset_lema WHERE makna_id IS NOT NULL) AS lema_terpetakan,
        (SELECT COUNT(*) FROM sinset_lema WHERE terverifikasi = TRUE) AS lema_terverifikasi,
        (SELECT COUNT(*) FROM relasi_sinset) AS total_relasi
    `);
    const s = result.rows[0];

    const perKelasResult = await db.query(`
      SELECT kelas_kata, status, COUNT(*) AS c
      FROM sinset
      GROUP BY kelas_kata, status
      ORDER BY kelas_kata, status
    `);

    const perKelas = {};
    for (const row of perKelasResult.rows) {
      if (!perKelas[row.kelas_kata]) {
        perKelas[row.kelas_kata] = {
          kode: row.kelas_kata,
          nama: NAMA_KELAS[row.kelas_kata] || row.kelas_kata,
          draf: 0,
          tinjau: 0,
          terverifikasi: 0,
          total: 0,
        };
      }
      perKelas[row.kelas_kata][row.status] = parseCount(row.c);
      perKelas[row.kelas_kata].total += parseCount(row.c);
    }

    // Lema per kelas kata with mapping stats
    const lemaPerKelasResult = await db.query(`
      SELECT s.kelas_kata,
             COUNT(*) AS total_lema,
             COUNT(sl.makna_id) AS terpetakan
      FROM sinset_lema sl
      JOIN sinset s ON s.id = sl.sinset_id
      GROUP BY s.kelas_kata
      ORDER BY s.kelas_kata
    `);

    const lemaPerKelas = {};
    for (const row of lemaPerKelasResult.rows) {
      lemaPerKelas[row.kelas_kata] = {
        total: parseCount(row.total_lema),
        terpetakan: parseCount(row.terpetakan),
      };
    }

    return {
      sinset: {
        total: parseCount(s.total_sinset),
        draf: parseCount(s.draf),
        tinjau: parseCount(s.tinjau),
        terverifikasi: parseCount(s.terverifikasi),
      },
      lema: {
        total: parseCount(s.total_lema),
        terpetakan: parseCount(s.lema_terpetakan),
        terverifikasi: parseCount(s.lema_terverifikasi),
      },
      relasi: parseCount(s.total_relasi),
      perKelas: Object.values(perKelas),
      lemaPerKelas,
    };
  }

  /**
   * Daftar synset dengan filter, pencarian, dan paginasi cursor.
   */
  static async daftar({
    limit = 50,
    q = '',
    status = '',
    kelasKata = '',
    adaPemetaan = '',
    akar = '',
    cursor = null,
    direction = 'next',
    lastPage = false,
  } = {}) {
    const cappedLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
    const { conditions, params } = buildSinsetWhereClause({ q, status, kelasKata, adaPemetaan, akar });
    const baseParams = [...params];
    const cursorPayload = decodeCursor(cursor);
    const isPrev = direction === 'prev';
    const orderDesc = Boolean(lastPage || isPrev);

    const whereBase = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM sinset s ${whereBase}`,
      baseParams
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

    const queryParams = [...baseParams];
    const whereParts = [...conditions];

    if (cursorPayload && !lastPage) {
      queryParams.push(String(cursorPayload.id || ''));
      const idIdx = queryParams.length;
      whereParts.push(
        isPrev ? `s.id < $${idIdx}` : `s.id > $${idIdx}`
      );
    }

    queryParams.push(cappedLimit + 1);
    const limitIdx = queryParams.length;
    const whereClause = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';

    const dataResult = await db.query(
      `SELECT s.id, s.kelas_kata, s.definisi_en, s.definisi_id, s.status,
              s.lema_en, s.ili_id,
              (SELECT COUNT(*) FROM sinset_lema sl WHERE sl.sinset_id = s.id) AS jumlah_lema,
              (SELECT COUNT(*) FROM sinset_lema sl WHERE sl.sinset_id = s.id AND sl.makna_id IS NOT NULL) AS lema_terpetakan,
              (SELECT string_agg(sl.lema, ', ' ORDER BY sl.urutan) FROM sinset_lema sl WHERE sl.sinset_id = s.id) AS lema_id
       FROM sinset s
       ${whereClause}
       ORDER BY s.id ${orderDesc ? 'DESC' : 'ASC'}
       LIMIT $${limitIdx}`,
      queryParams
    );

    const hasMore = dataResult.rows.length > cappedLimit;
    let rows = hasMore ? dataResult.rows.slice(0, cappedLimit) : dataResult.rows;
    if (orderDesc) {
      rows = rows.reverse();
    }

    const first = rows[0];
    const last = rows[rows.length - 1];
    const prevCursor = first ? encodeCursor({ id: first.id }) : null;
    const nextCursor = last ? encodeCursor({ id: last.id }) : null;

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
   * Ambil satu synset lengkap: lema, relasi, kandidat makna.
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT s.*
       FROM sinset s
       WHERE s.id = $1`,
      [id]
    );
    if (!result.rows[0]) return null;
    const sinset = result.rows[0];

    // Lema Indonesia + info entri + makna terpetakan
    const lemaResult = await db.query(
      `SELECT sl.id, sl.lema, sl.entri_id, sl.makna_id, sl.urutan, sl.terverifikasi,
              e.entri AS entri_teks,
              m.makna AS makna_teks, m.kelas_kata AS makna_kelas_kata
       FROM sinset_lema sl
       LEFT JOIN entri e ON e.id = sl.entri_id
       LEFT JOIN makna m ON m.id = sl.makna_id
       WHERE sl.sinset_id = $1
       ORDER BY sl.urutan, sl.lema`,
      [id]
    );

    // Relasi keluar (asal = synset ini)
    const relasiKeluarResult = await db.query(
      `SELECT rs.id, rs.sinset_tujuan, rs.tipe_relasi,
              tr.nama AS tipe_nama, tr.nama_publik AS tipe_publik, tr.kategori,
              st.definisi_en AS tujuan_def_en, st.kelas_kata AS tujuan_kelas,
              (SELECT string_agg(sl.lema, ', ' ORDER BY sl.urutan) FROM sinset_lema sl WHERE sl.sinset_id = rs.sinset_tujuan) AS tujuan_lema_id
       FROM relasi_sinset rs
       JOIN tipe_relasi tr ON tr.kode = rs.tipe_relasi
       JOIN sinset st ON st.id = rs.sinset_tujuan
       WHERE rs.sinset_asal = $1
       ORDER BY tr.urutan, rs.sinset_tujuan`,
      [id]
    );

    // Relasi masuk (tujuan = synset ini)
    const relasiMasukResult = await db.query(
      `SELECT rs.id, rs.sinset_asal, rs.tipe_relasi,
              tr.nama AS tipe_nama, tr.nama_publik AS tipe_publik, tr.kategori,
              tr.kebalikan,
              sa.definisi_en AS asal_def_en, sa.kelas_kata AS asal_kelas,
              (SELECT string_agg(sl.lema, ', ' ORDER BY sl.urutan) FROM sinset_lema sl WHERE sl.sinset_id = rs.sinset_asal) AS asal_lema_id
       FROM relasi_sinset rs
       JOIN tipe_relasi tr ON tr.kode = rs.tipe_relasi
       JOIN sinset sa ON sa.id = rs.sinset_asal
       WHERE rs.sinset_tujuan = $1
       ORDER BY tr.urutan, rs.sinset_asal`,
      [id]
    );

    return {
      ...sinset,
      lema: lemaResult.rows,
      relasiKeluar: relasiKeluarResult.rows,
      relasiMasuk: relasiMasukResult.rows,
    };
  }

  /**
   * Update synset (definisi_id, status, catatan).
   */
  static async simpan(id, { definisi_id, contoh_id, status, catatan } = {}) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (definisi_id !== undefined) {
      fields.push(`definisi_id = $${idx++}`);
      values.push(definisi_id || null);
    }
    if (contoh_id !== undefined) {
      fields.push(`contoh_id = $${idx++}`);
      values.push(Array.isArray(contoh_id) ? contoh_id : []);
    }
    if (status !== undefined && STATUS_VALID.includes(status)) {
      fields.push(`status = $${idx++}`);
      values.push(status);
    }
    if (catatan !== undefined) {
      fields.push(`catatan = $${idx++}`);
      values.push(catatan || null);
    }

    if (fields.length === 0) return null;

    values.push(id);
    const result = await db.query(
      `UPDATE sinset
       SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING *`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Tambah satu lema Indonesia ke sinset dari entri kamus yang sudah ada.
   */
  static async tambahLema(sinsetId, { entri_id, urutan = null, sumber = 'redaksi' } = {}) {
    const entriId = parseNullableInteger(entri_id);
    if (!sinsetId || !entriId) {
      return { error: 'invalid_input' };
    }

    const entriResult = await db.query(
      `SELECT id, entri
       FROM entri
       WHERE id = $1 AND aktif = 1`,
      [entriId]
    );
    const entri = entriResult.rows[0];
    if (!entri) {
      return { error: 'entri_not_found' };
    }

    const lema = String(entri.entri || '').trim();
    if (!lema) {
      return { error: 'invalid_input' };
    }

    const duplikatResult = await db.query(
      `SELECT id, sinset_id, lema, entri_id, makna_id, urutan, terverifikasi
       FROM sinset_lema
       WHERE sinset_id = $1 AND LOWER(lema) = LOWER($2)
       LIMIT 1`,
      [sinsetId, lema]
    );
    if (duplikatResult.rows[0]) {
      return { error: 'duplicate', data: duplikatResult.rows[0] };
    }

    let urutanFinal = parseNullableInteger(urutan);
    if (urutanFinal === null) {
      const urutanResult = await db.query(
        `SELECT COALESCE(MAX(urutan), -1) + 1 AS urutan
         FROM sinset_lema
         WHERE sinset_id = $1`,
        [sinsetId]
      );
      urutanFinal = Number(urutanResult.rows[0]?.urutan) || 0;
    }

    const insertResult = await db.query(
      `INSERT INTO sinset_lema (sinset_id, lema, entri_id, urutan, sumber)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, sinset_id, lema, entri_id, makna_id, urutan, terverifikasi, sumber`,
      [sinsetId, lema, entri.id, urutanFinal, String(sumber || 'redaksi').trim() || 'redaksi']
    );

    return { data: insertResult.rows[0] || null };
  }

  /**
   * Update pemetaan lema: set makna_id dan terverifikasi.
   */
  static async simpanPemetaanLema(lemaId, { makna_id, terverifikasi } = {}) {
    const fields = [];
    const values = [];
    let idx = 1;

    if (makna_id !== undefined) {
      fields.push(`makna_id = $${idx++}`);
      values.push(makna_id || null);
    }
    if (terverifikasi !== undefined) {
      fields.push(`terverifikasi = $${idx++}`);
      values.push(Boolean(terverifikasi));
    }

    if (fields.length === 0) return null;

    values.push(lemaId);
    const result = await db.query(
      `UPDATE sinset_lema
       SET ${fields.join(', ')}
       WHERE id = $${idx}
       RETURNING id, sinset_id, lema, entri_id, makna_id, urutan, terverifikasi`,
      values
    );
    return result.rows[0] || null;
  }

  /**
   * Ambil kandidat makna untuk satu lema dalam synset.
   * Cari berdasarkan entri_id + kelas_kata synset.
   */
  static async ambilKandidatMakna(sinsetId, lemaId) {
    // Ambil info lema + synset kelas_kata
    const lemaResult = await db.query(
      `SELECT sl.lema, sl.entri_id, s.kelas_kata
       FROM sinset_lema sl
       JOIN sinset s ON s.id = sl.sinset_id
       WHERE sl.id = $1 AND sl.sinset_id = $2`,
      [lemaId, sinsetId]
    );
    if (!lemaResult.rows[0]) return null;

    const { lema, entri_id, kelas_kata } = lemaResult.rows[0];

    if (!entri_id) {
      return {
        lema,
        entri_id: null,
        kelas_kata_sinset: kelas_kata,
        kelas_kata_db: kelas_kata === 'r' ? 'adv' : kelas_kata,
        kandidat: [],
        semuaMakna: [],
      };
    }

    // Kelas kata mapping: sinset uses n/v/a/r, makna uses n/v/a/adv
    const kelasDb = kelas_kata === 'r' ? 'adv' : kelas_kata;

    // Ambil semua makna dari entri ini yang cocok kelas kata
    const maknaResult = await db.query(
      `SELECT m.id, m.polisem, m.makna, m.kelas_kata, contoh_ringkas.contoh
       FROM makna m
       LEFT JOIN LATERAL (
         SELECT c.contoh
         FROM contoh c
         WHERE c.makna_id = m.id AND c.aktif = true
         ORDER BY c.urutan, c.id
         LIMIT 1
       ) contoh_ringkas ON TRUE
       WHERE m.entri_id = $1 AND m.kelas_kata = $2 AND m.aktif = true
       ORDER BY m.polisem`,
      [entri_id, kelasDb]
    );

    // Also get all makna regardless of POS for context
    const semuaMaknaResult = await db.query(
      `SELECT m.id, m.polisem, m.makna, m.kelas_kata, contoh_ringkas.contoh
       FROM makna m
       LEFT JOIN LATERAL (
         SELECT c.contoh
         FROM contoh c
         WHERE c.makna_id = m.id AND c.aktif = true
         ORDER BY c.urutan, c.id
         LIMIT 1
       ) contoh_ringkas ON TRUE
       WHERE m.entri_id = $1 AND m.aktif = true
       ORDER BY m.polisem`,
      [entri_id]
    );

    return {
      lema,
      entri_id,
      kelas_kata_sinset: kelas_kata,
      kelas_kata_db: kelasDb,
      kandidat: maknaResult.rows,
      semuaMakna: semuaMaknaResult.rows,
    };
  }

  /**
   * Hitung total sinset (untuk dasbor umum).
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*) AS total FROM sinset');
    return parseCount(result.rows[0]?.total);
  }

  /**
   * Ambil daftar tipe relasi.
   */
  static async daftarTipeRelasi() {
    const result = await db.query(
      `SELECT kode, nama, nama_publik, kategori, kebalikan, simetris, urutan
       FROM tipe_relasi
       ORDER BY urutan`
    );
    return result.rows;
  }
}

module.exports = ModelSinset;
