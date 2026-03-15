/**
 * @fileoverview Test model kandidat entri KADI
 * @tested_in backend/models/kadi/modelKandidatEntri.js
 */

const db = require('../../../db');
const ModelKandidatEntri = require('../../../models/kadi/modelKandidatEntri');

describe('models/kadi/modelKandidatEntri', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('hitungTotal dan statistikAntrian membaca agregasi dasar', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: 9 }] })
      .mockResolvedValueOnce({ rows: [{ status: 'menunggu', jumlah: 3 }] });

    await expect(ModelKandidatEntri.hitungTotal()).resolves.toBe(9);
    await expect(ModelKandidatEntri.statistikAntrian()).resolves.toEqual([{ status: 'menunggu', jumlah: 3 }]);

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelKandidatEntri.hitungTotal()).resolves.toBe(0);
  });

  it('daftarAdmin membangun where clause lengkap dan memvalidasi prioritas', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kata: 'baru' }] });

    const result = await ModelKandidatEntri.daftarAdmin({
      limit: 10,
      offset: 5,
      q: 'bar',
      status: 'menunggu',
      jenis: 'dasar',
      sumber_scraper: 'wiki',
      prioritas: '3',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE ke.kata ILIKE $1 AND ke.status = $2 AND ke.jenis = $3 AND ke.sumber_scraper = $4 AND ke.prioritas = $5'),
      ['%bar%', 'menunggu', 'dasar', 'wiki', 3]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $6 OFFSET $7'),
      ['%bar%', 'menunggu', 'dasar', 'wiki', 3, 10, 5]
    );
    expect(result).toEqual({ data: [{ id: 1, kata: 'baru' }], total: 2 });
  });

  it('daftarAdmin mengabaikan prioritas tidak valid dan filter kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(ModelKandidatEntri.daftarAdmin({ prioritas: 'abc' })).resolves.toEqual({ data: [], total: 0 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.not.stringContaining('ke.prioritas ='), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });
    await expect(ModelKandidatEntri.daftarAdmin()).resolves.toEqual({ data: [], total: 0 });
  });

  it('ambilDenganId mengembalikan row pertama atau null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 7, kata: 'uji' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(ModelKandidatEntri.ambilDenganId(7)).resolves.toEqual({ id: 7, kata: 'uji' });
    await expect(ModelKandidatEntri.ambilDenganId(8)).resolves.toBeNull();
  });

  it('simpan memvalidasi kata wajib, insert baru, dan update kandidat yang ada', async () => {
    await expect(ModelKandidatEntri.simpan({ kata: '   ' })).rejects.toThrow('Kata wajib diisi');
    await expect(ModelKandidatEntri.simpan({})).rejects.toThrow('Kata wajib diisi');

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, kata: 'Baru', indeks: 'baru', prioritas: 2 }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kata: 'Lama', indeks: 'lama', prioritas: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, kata: 'Kosong', indeks: 'kosong', prioritas: 0, kontributor_id: null }] });

    await expect(ModelKandidatEntri.simpan({
      kata: ' Baru ',
      prioritas: '2',
      kontributor_id: '5',
      sumber_scraper: 'wiki',
    })).resolves.toEqual({ id: 1, kata: 'Baru', indeks: 'baru', prioritas: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO kandidat_entri'),
      ['Baru', 'baru', null, null, null, null, null, null, 'wiki', 2, 5]
    );

    await expect(ModelKandidatEntri.simpan({
      id: 2,
      kata: ' Lama ',
      prioritas: '1',
    })).resolves.toEqual({ id: 2, kata: 'Lama', indeks: 'lama', prioritas: 1 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE kandidat_entri SET'), expect.arrayContaining(['Lama', 'lama', 1, 2]));

    await expect(ModelKandidatEntri.simpan({
      kata: ' Kosong ',
      prioritas: 'x',
      kontributor_id: 'abc',
    })).resolves.toEqual({ id: 3, kata: 'Kosong', indeks: 'kosong', prioritas: 0, kontributor_id: null });
  });

  it('ubahStatus menangani kandidat tidak ditemukan, status ditinjau, dan status umum', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelKandidatEntri.ubahStatus(1, 'ditinjau', 9)).rejects.toThrow('Kandidat tidak ditemukan');

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 2, status: 'menunggu' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, status: 'ditinjau' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 3, status: 'ditolak' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, status: 'ditolak' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(ModelKandidatEntri.ubahStatus(2, 'ditinjau', 7, 'cek')).resolves.toEqual({ id: 2, status: 'ditinjau' });
    expect(db.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('INSERT INTO riwayat_kurasi'),
      [2, 7, 'tinjau', 'menunggu', 'ditinjau', 'cek']
    );

    await expect(ModelKandidatEntri.ubahStatus(3, 'ditolak', 8)).resolves.toEqual({ id: 3, status: 'ditolak' });
    expect(db.query).toHaveBeenNthCalledWith(
      7,
      expect.stringContaining('INSERT INTO riwayat_kurasi'),
      [3, 8, 'tolak', 'ditolak', 'ditolak', null]
    );
  });

  it('hapus, daftarAtestasi, tambahAtestasi, tambahBanyakAtestasi, dan daftarRiwayat bekerja sesuai kontrak', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ id: 11, kandidat_id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 12, kutipan: 'contoh' }] })
      .mockResolvedValueOnce({ rows: [{ id: 14, kutipan: 'tanpa skor' }] })
      .mockResolvedValueOnce({ rowCount: 2 })
      .mockResolvedValueOnce({ rows: [{ id: 13, redaktur_nama: 'Redaktur' }] });

    await expect(ModelKandidatEntri.hapus(1)).resolves.toBe(true);
    await expect(ModelKandidatEntri.hapus(2)).resolves.toBe(false);
    await expect(ModelKandidatEntri.daftarAtestasi(1)).resolves.toEqual([{ id: 11, kandidat_id: 1 }]);
    await expect(ModelKandidatEntri.tambahAtestasi({ kandidat_id: 1, kutipan: 'contoh', sumber_tipe: 'web', skor_konfiden: 0.9 })).resolves.toEqual({ id: 12, kutipan: 'contoh' });
    await expect(ModelKandidatEntri.tambahAtestasi({ kandidat_id: 1, kutipan: 'tanpa skor', sumber_tipe: 'web' })).resolves.toEqual({ id: 14, kutipan: 'tanpa skor' });
    await expect(ModelKandidatEntri.tambahBanyakAtestasi([])).resolves.toBe(0);
    await expect(ModelKandidatEntri.tambahBanyakAtestasi([
      { kandidat_id: 1, kutipan: 'a', sumber_tipe: 'web' },
      { kandidat_id: 2, kutipan: 'b', sumber_tipe: 'web', skor_konfiden: 0.7 },
    ])).resolves.toBe(2);
    await expect(ModelKandidatEntri.daftarRiwayat(1)).resolves.toEqual([{ id: 13, redaktur_nama: 'Redaktur' }]);
  });

  it('bulkUpsertDariScraper aman untuk input kosong, batch invalid, dan gabungan insert dengan kandidat lama', async () => {
    await expect(ModelKandidatEntri.bulkUpsertDariScraper([])).resolves.toEqual(new Map());

    await expect(ModelKandidatEntri.bulkUpsertDariScraper([{ kata: '   ' }])).resolves.toEqual(new Map());
    await expect(ModelKandidatEntri.bulkUpsertDariScraper([{ sumber_scraper: 'wiki' }])).resolves.toEqual(new Map());
    expect(db.query).not.toHaveBeenCalled();

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'baru' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indeks: 'baru' }, { id: 2, indeks: 'lama' }] });

    const result = await ModelKandidatEntri.bulkUpsertDariScraper([
      { kata: 'Baru', sumber_scraper: 'wiki' },
      { kata: 'Lama' },
    ]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('ON CONFLICT (indeks) DO NOTHING'), ['Baru', 'baru', 'wiki', 'Lama', 'lama', null]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE indeks = ANY($1)'), [['baru', 'lama']]);
    expect(Array.from(result.entries())).toEqual([['baru', 1], ['lama', 2]]);
  });
});