/**
 * @fileoverview Model KADI untuk kandidat entri (staging area kata baru)
 * Fat model: semua query database untuk tabel kandidat_entri, atestasi, riwayat_kurasi
 */

const db = require('../../db');

function normalisasiIndeks(kata = '') {
  return kata.trim().toLowerCase();
}

class ModelKandidatEntri {
  // ─── Daftar & Statistik ──────────────────────────────────────────────

  /**
   * Hitung total kandidat entri.
   * @returns {Promise<number>}
   */
  static async hitungTotal() {
    const result = await db.query('SELECT COUNT(*)::int AS total FROM kandidat_entri');
    return result.rows[0]?.total || 0;
  }

  /**
   * Daftar kandidat entri untuk panel redaksi (dengan filter + paginasi)
   * @param {object} options
   * @returns {Promise<{ data: Array, total: number }>}
   */
  static async daftarAdmin({
    limit = 50,
    offset = 0,
    q = '',
    status = '',
    jenis = '',
    sumber_scraper = '',
    prioritas = '',
  } = {}) {
    const conditions = [];
    const params = [];
    let idx = 1;

    if (q) {
      conditions.push(`ke.kata ILIKE $${idx}`);
      params.push(`%${q}%`);
      idx++;
    }

    if (status) {
      conditions.push(`ke.status = $${idx}`);
      params.push(status);
      idx++;
    }

    if (jenis) {
      conditions.push(`ke.jenis = $${idx}`);
      params.push(jenis);
      idx++;
    }

    if (sumber_scraper) {
      conditions.push(`ke.sumber_scraper = $${idx}`);
      params.push(sumber_scraper);
      idx++;
    }

    if (prioritas !== '') {
      const parsedPrioritas = Number.parseInt(prioritas, 10);
      if (!Number.isNaN(parsedPrioritas)) {
        conditions.push(`ke.prioritas = $${idx}`);
        params.push(parsedPrioritas);
        idx++;
      }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const countResult = await db.query(
      `SELECT COUNT(*) AS total FROM kandidat_entri ke ${where}`,
      params,
    );
    const total = Number(countResult.rows[0]?.total) || 0;

    const dataResult = await db.query(
      `SELECT ke.*,
              (SELECT COUNT(*) FROM atestasi a WHERE a.kandidat_id = ke.id AND a.aktif = true) AS jumlah_atestasi
       FROM kandidat_entri ke
       ${where}
       ORDER BY ke.prioritas DESC, ke.created_at DESC
       LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset],
    );

    return { data: dataResult.rows, total };
  }

  /**
   * Statistik antrian per status
   * @returns {Promise<Array<{ status: string, jumlah: number }>>}
   */
  static async statistikAntrian() {
    const result = await db.query(
      `SELECT status, COUNT(*)::int AS jumlah FROM kandidat_entri GROUP BY status ORDER BY status`,
    );
    return result.rows;
  }

  // ─── Detail ──────────────────────────────────────────────────────────

  /**
   * Ambil kandidat entri dengan ID, termasuk jumlah atestasi dan nama kontributor
   * @param {number} id
   * @returns {Promise<object|null>}
   */
  static async ambilDenganId(id) {
    const result = await db.query(
      `SELECT ke.*,
              (SELECT COUNT(*) FROM atestasi a WHERE a.kandidat_id = ke.id AND a.aktif = true) AS jumlah_atestasi,
              p.nama AS kontributor_nama
       FROM kandidat_entri ke
       LEFT JOIN pengguna p ON p.id = ke.kontributor_id
       WHERE ke.id = $1`,
      [id],
    );
    return result.rows[0] || null;
  }

  // ─── Simpan (Insert / Update) ────────────────────────────────────────

  /**
   * Simpan kandidat entri (insert baru atau update berdasarkan id)
   * @param {object} data
   * @returns {Promise<object>} Row yang disimpan
   */
  static async simpan(data) {
    const kata = String(data.kata || '').trim();
    if (!kata) throw new Error('Kata wajib diisi');

    const indeks = normalisasiIndeks(kata);
    const fields = {
      kata,
      indeks,
      jenis: data.jenis || null,
      kelas_kata: data.kelas_kata || null,
      definisi_awal: data.definisi_awal || null,
      ragam: data.ragam || null,
      bahasa_campur: data.bahasa_campur || null,
      catatan_redaksi: data.catatan_redaksi || null,
      sumber_scraper: data.sumber_scraper || null,
      prioritas: Number.parseInt(data.prioritas, 10) || 0,
    };

    if (data.kontributor_id) {
      fields.kontributor_id = Number.parseInt(data.kontributor_id, 10) || null;
    }

    if (data.id) {
      // UPDATE
      const setClauses = [];
      const params = [];
      let idx = 1;

      for (const [key, value] of Object.entries(fields)) {
        setClauses.push(`${key} = $${idx}`);
        params.push(value);
        idx++;
      }

      params.push(data.id);
      const result = await db.query(
        `UPDATE kandidat_entri SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`,
        params,
      );
      return result.rows[0];
    }

    // INSERT
    const keys = Object.keys(fields);
    const values = Object.values(fields);
    const placeholders = keys.map((_, i) => `$${i + 1}`);

    const result = await db.query(
      `INSERT INTO kandidat_entri (${keys.join(', ')})
       VALUES (${placeholders.join(', ')})
       RETURNING *`,
      values,
    );
    return result.rows[0];
  }

  // ─── Ubah Status ─────────────────────────────────────────────────────

  /**
   * Ubah status kandidat dan catat riwayat kurasi
   * @param {number} id
   * @param {string} statusBaru
   * @param {number} redakturId
   * @param {string} [catatan]
   * @returns {Promise<object>} Row yang diperbarui
   */
  static async ubahStatus(id, statusBaru, redakturId, catatan = null) {
    const current = await db.query(
      'SELECT id, status FROM kandidat_entri WHERE id = $1',
      [id],
    );
    if (!current.rows[0]) throw new Error('Kandidat tidak ditemukan');

    const statusLama = current.rows[0].status;

    const updated = await db.query(
      'UPDATE kandidat_entri SET status = $1 WHERE id = $2 RETURNING *',
      [statusBaru, id],
    );

    await db.query(
      `INSERT INTO riwayat_kurasi (kandidat_id, redaktur_id, aksi, status_lama, status_baru, catatan)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [id, redakturId, statusBaru === 'ditinjau' ? 'tinjau' : statusBaru.replace('di', ''), statusLama, statusBaru, catatan],
    );

    return updated.rows[0];
  }

  // ─── Hapus ───────────────────────────────────────────────────────────

  /**
   * Hapus kandidat entri (cascade ke atestasi via ON DELETE CASCADE)
   * @param {number} id
   * @returns {Promise<boolean>}
   */
  static async hapus(id) {
    const result = await db.query(
      'DELETE FROM kandidat_entri WHERE id = $1',
      [id],
    );
    return result.rowCount > 0;
  }

  // ─── Atestasi ────────────────────────────────────────────────────────

  /**
   * Daftar atestasi untuk satu kandidat
   * @param {number} kandidatId
   * @returns {Promise<Array>}
   */
  static async daftarAtestasi(kandidatId) {
    const result = await db.query(
      `SELECT * FROM atestasi
       WHERE kandidat_id = $1 AND aktif = true
       ORDER BY tanggal_terbit DESC NULLS LAST, created_at DESC`,
      [kandidatId],
    );
    return result.rows;
  }

  /**
   * Tambah satu atestasi
   * @param {object} data
   * @returns {Promise<object>}
   */
  static async tambahAtestasi(data) {
    const result = await db.query(
      `INSERT INTO atestasi (kandidat_id, kutipan, konteks_pra, konteks_pasca,
         sumber_tipe, sumber_url, sumber_nama, sumber_penulis, tanggal_terbit,
         crawler_id, skor_konfiden)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING *`,
      [
        data.kandidat_id, data.kutipan, data.konteks_pra || null,
        data.konteks_pasca || null, data.sumber_tipe, data.sumber_url || null,
        data.sumber_nama || null, data.sumber_penulis || null,
        data.tanggal_terbit || null, data.crawler_id || null,
        data.skor_konfiden != null ? data.skor_konfiden : null,
      ],
    );
    return result.rows[0];
  }

  /**
   * Bulk insert atestasi (untuk scraper)
   * @param {Array<object>} rows
   * @returns {Promise<number>} Jumlah baris yang disisipkan
   */
  static async tambahBanyakAtestasi(rows) {
    if (!rows.length) return 0;

    const values = [];
    const placeholders = [];
    let idx = 1;

    for (const row of rows) {
      placeholders.push(
        `($${idx}, $${idx + 1}, $${idx + 2}, $${idx + 3}, $${idx + 4}, $${idx + 5}, $${idx + 6}, $${idx + 7}, $${idx + 8})`,
      );
      values.push(
        row.kandidat_id, row.kutipan, row.sumber_tipe,
        row.sumber_url || null, row.sumber_nama || null,
        row.sumber_penulis || null, row.tanggal_terbit || null,
        row.crawler_id || null, row.skor_konfiden != null ? row.skor_konfiden : null,
      );
      idx += 9;
    }

    const result = await db.query(
      `INSERT INTO atestasi (kandidat_id, kutipan, sumber_tipe,
         sumber_url, sumber_nama, sumber_penulis, tanggal_terbit,
         crawler_id, skor_konfiden)
       VALUES ${placeholders.join(', ')}`,
      values,
    );
    return result.rowCount;
  }

  // ─── Riwayat Kurasi ──────────────────────────────────────────────────

  /**
   * Daftar riwayat kurasi untuk satu kandidat
   * @param {number} kandidatId
   * @returns {Promise<Array>}
   */
  static async daftarRiwayat(kandidatId) {
    const result = await db.query(
      `SELECT rk.*, p.nama AS redaktur_nama
       FROM riwayat_kurasi rk
       LEFT JOIN pengguna p ON p.id = rk.redaktur_id
       WHERE rk.kandidat_id = $1
       ORDER BY rk.created_at DESC`,
      [kandidatId],
    );
    return result.rows;
  }

  // ─── Bulk Upsert (untuk Scraper) ─────────────────────────────────────

  /**
   * Bulk upsert kandidat dari scraper. Jika indeks sudah ada, skip (tidak update).
   * Mengembalikan daftar kandidat (id + indeks) yang berhasil di-insert atau sudah ada.
   * @param {Array<{ kata: string, sumber_scraper?: string }>} items
   * @returns {Promise<Map<string, number>>} Map<indeks, id>
   */
  static async bulkUpsertDariScraper(items) {
    if (!items.length) return new Map();

    const result = new Map();
    const batchSize = 100;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const values = [];
      const placeholders = [];
      let idx = 1;

      for (const item of batch) {
        const kata = String(item.kata || '').trim();
        const indeks = normalisasiIndeks(kata);
        if (!kata || !indeks) continue;

        placeholders.push(`($${idx}, $${idx + 1}, $${idx + 2})`);
        values.push(kata, indeks, item.sumber_scraper || null);
        idx += 3;
      }

      if (!placeholders.length) continue;

      const upsertResult = await db.query(
        `INSERT INTO kandidat_entri (kata, indeks, sumber_scraper)
         VALUES ${placeholders.join(', ')}
         ON CONFLICT (indeks) DO NOTHING
         RETURNING id, indeks`,
        values,
      );

      for (const row of upsertResult.rows) {
        result.set(row.indeks, row.id);
      }
    }

    // Also fetch IDs for existing candidates that were skipped by ON CONFLICT
    const allIndeks = items
      .map((item) => normalisasiIndeks(item.kata))
      .filter(Boolean);

    if (allIndeks.length) {
      const existing = await db.query(
        `SELECT id, indeks FROM kandidat_entri WHERE indeks = ANY($1)`,
        [allIndeks],
      );
      for (const row of existing.rows) {
        if (!result.has(row.indeks)) {
          result.set(row.indeks, row.id);
        }
      }
    }

    return result;
  }
}

module.exports = ModelKandidatEntri;
