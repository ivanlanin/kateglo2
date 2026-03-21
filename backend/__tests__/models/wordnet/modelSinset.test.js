/**
 * @fileoverview Test ModelSinset
 * @tested_in backend/models/wordnet/modelSinset.js
 */

const db = require('../../../db');
const ModelSinset = require('../../../models/wordnet/modelSinset');
const { parseNullableInteger, buildSinsetWhereClause } = require('../../../models/wordnet/modelSinset').__private;

describe('ModelSinset', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('helper private parseNullableInteger dan buildSinsetWhereClause menutup seluruh cabang', () => {
    expect(parseNullableInteger()).toBeNull();
    expect(parseNullableInteger('')).toBeNull();
    expect(parseNullableInteger('0')).toBeNull();
    expect(parseNullableInteger('3')).toBe(3);

    expect(buildSinsetWhereClause()).toEqual({ conditions: [], params: [] });

    const mapped = buildSinsetWhereClause({
      q: 'adil',
      status: 'draf',
      kelasKata: 'n',
      adaPemetaan: '1',
      akar: '1',
    });
    expect(mapped.params).toEqual(['%adil%', 'draf', 'n']);
    expect(mapped.conditions.join(' ')).toContain('sl3.makna_id IS NOT NULL');
    expect(mapped.conditions.join(' ')).toContain("tipe_relasi IN ('hipernim', 'hipernim_instans')");

    const unmapped = buildSinsetWhereClause({
      status: 'invalid',
      kelasKata: 'invalid',
      adaPemetaan: '0',
      akar: '0',
    });
    expect(unmapped.params).toEqual([]);
    expect(unmapped.conditions.join(' ')).toContain('NOT EXISTS');
    expect(unmapped.conditions.join(' ')).toContain('EXISTS (');
  });

  it('daftar mendukung argumen default tanpa parameter', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    await expect(ModelSinset.daftar()).resolves.toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('daftar memakai fallback limit default saat limit bernilai 0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({
        rows: [{ id: '0001-n', kelas_kata: 'n', definisi_en: 'a', definisi_id: 'b', status: 'draf', lema_en: 'alpha', ili_id: 'i1', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'adil' }],
      });

    const result = await ModelSinset.daftar({ limit: 0 });

    expect(db.query.mock.calls[1][1]).toEqual([51]);
    expect(result.data).toHaveLength(1);
  });

  it('statistik memakai fallback nama kelas jika kode tidak dikenal', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          total_sinset: '1',
          draf: '0',
          tinjau: '0',
          terverifikasi: '1',
          total_lema: '1',
          lema_terpetakan: '1',
          lema_terverifikasi: '1',
          total_relasi: '0',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ kelas_kata: 'x', status: 'terverifikasi', c: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelSinset.statistik();

    expect(result.perKelas).toEqual([{ kode: 'x', nama: 'x', draf: 0, tinjau: 0, terverifikasi: 1, total: 1 }]);
  });

  it('statistik menggabungkan hitungan global, per kelas, dan lema per kelas', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          total_sinset: '10',
          draf: '4',
          tinjau: '3',
          terverifikasi: '3',
          total_lema: '8',
          lema_terpetakan: '5',
          lema_terverifikasi: '2',
          total_relasi: '7',
        }],
      })
      .mockResolvedValueOnce({
        rows: [
          { kelas_kata: 'n', status: 'draf', c: '2' },
          { kelas_kata: 'n', status: 'terverifikasi', c: '1' },
          { kelas_kata: 'v', status: 'tinjau', c: '3' },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          { kelas_kata: 'n', total_lema: '3', terpetakan: '2' },
          { kelas_kata: 'v', total_lema: '5', terpetakan: '3' },
        ],
      });

    const result = await ModelSinset.statistik();

    expect(result).toEqual({
      sinset: { total: 10, draf: 4, tinjau: 3, terverifikasi: 3 },
      lema: { total: 8, terpetakan: 5, terverifikasi: 2 },
      relasi: 7,
      perKelas: [
        { kode: 'n', nama: 'nomina', draf: 2, tinjau: 0, terverifikasi: 1, total: 3 },
        { kode: 'v', nama: 'verba', draf: 0, tinjau: 3, terverifikasi: 0, total: 3 },
      ],
      lemaPerKelas: {
        n: { total: 3, terpetakan: 2 },
        v: { total: 5, terpetakan: 3 },
      },
    });
  });

  it('daftar mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    await expect(ModelSinset.daftar({ q: 'adil' })).resolves.toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('daftar mendukung filter lengkap dan cursor next', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: '0002-n', kelas_kata: 'n', definisi_en: 'a', definisi_id: 'b', status: 'draf', lema_en: 'alpha', ili_id: 'i1', jumlah_lema: '1', lema_terpetakan: '1', lema_id: 'adil' },
          { id: '0003-n', kelas_kata: 'n', definisi_en: 'c', definisi_id: 'd', status: 'draf', lema_en: 'beta', ili_id: 'i2', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'baik' },
          { id: '0004-n', kelas_kata: 'n', definisi_en: 'e', definisi_id: 'f', status: 'draf', lema_en: 'gamma', ili_id: 'i3', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'cakap' },
        ],
      });

    const cursor = Buffer.from(JSON.stringify({ id: '0001-n' })).toString('base64url');
    const result = await ModelSinset.daftar({
      limit: 2,
      q: 'adil',
      status: 'draf',
      kelasKata: 'n',
      adaPemetaan: '1',
      akar: '1',
      cursor,
      direction: 'next',
    });

    expect(db.query.mock.calls[0][0]).toContain('s.status = $2');
    expect(db.query.mock.calls[0][0]).toContain('s.kelas_kata = $3');
    expect(db.query.mock.calls[0][0]).toContain('sl3.makna_id IS NOT NULL');
    expect(db.query.mock.calls[0][0]).toContain("tipe_relasi IN ('hipernim', 'hipernim_instans')");
    expect(db.query.mock.calls[1][0]).toContain('s.id > $4');
    expect(db.query.mock.calls[1][1]).toEqual(['%adil%', 'draf', 'n', '0001-n', 3]);
    expect(result.data).toHaveLength(2);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('daftar mendukung prev, lastPage, dan filter tanpa pemetaan/akar', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: '0002-v', kelas_kata: 'v', definisi_en: 'x', definisi_id: 'y', status: 'tinjau', lema_en: 'go', ili_id: 'i2', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'gerak' },
          { id: '0001-v', kelas_kata: 'v', definisi_en: 'm', definisi_id: 'n', status: 'tinjau', lema_en: 'move', ili_id: 'i1', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'jalan' },
        ],
      });

    const result = await ModelSinset.daftar({
      status: 'tinjau',
      kelasKata: 'v',
      adaPemetaan: '0',
      akar: '0',
      direction: 'prev',
      lastPage: true,
      limit: 2,
    });

    expect(db.query.mock.calls[0][0]).toContain('NOT EXISTS');
    expect(db.query.mock.calls[0][0]).toContain('EXISTS (\n      SELECT 1 FROM relasi_sinset rs_akar');
    expect(db.query.mock.calls[1][0]).toContain('ORDER BY s.id DESC');
    expect(result.data.map((item) => item.id)).toEqual(['0001-v', '0002-v']);
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it('daftar prev dengan cursor mengatur hasPrev dari hasMore dan hasNext dari cursor', async () => {
    const cursor = Buffer.from(JSON.stringify({ id: '0003-v' })).toString('base64url');
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: '0002-v', kelas_kata: 'v', definisi_en: 'x', definisi_id: 'y', status: 'tinjau', lema_en: 'go', ili_id: 'i2', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'gerak' },
          { id: '0001-v', kelas_kata: 'v', definisi_en: 'm', definisi_id: 'n', status: 'tinjau', lema_en: 'move', ili_id: 'i1', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'jalan' },
        ],
      });

    const result = await ModelSinset.daftar({
      direction: 'prev',
      cursor,
      limit: 2,
    });

    expect(db.query.mock.calls[1][0]).toContain('s.id < $1');
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  it('daftar menangani cursor payload kosong dan hasil kosong saat total ada', async () => {
    const cursor = Buffer.from(JSON.stringify({})).toString('base64url');
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelSinset.daftar({ cursor });

    expect(db.query.mock.calls[1][1]).toEqual(['', 51]);
    expect(result).toEqual({
      data: [],
      total: 2,
      hasPrev: true,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('daftar membatasi limit terlalu besar dan tetap membentuk where clause kosong', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    await ModelSinset.daftar({ limit: 999 });

    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM sinset s ', []);
  });

  it('daftar membentuk where clause kosong pada query data saat tidak ada filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({
        rows: [{ id: '0001-n', kelas_kata: 'n', definisi_en: 'a', definisi_id: 'b', status: 'draf', lema_en: 'alpha', ili_id: 'i1', jumlah_lema: '1', lema_terpetakan: '0', lema_id: 'adil' }],
      });

    await ModelSinset.daftar({ limit: 1 });

    expect(db.query.mock.calls[1][0]).toMatch(/FROM sinset s\s+ORDER BY s\.id ASC/);
    expect(db.query.mock.calls[1][1]).toEqual([2]);
  });

  it('ambilDenganId mengembalikan null jika sinset tidak ada', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(ModelSinset.ambilDenganId('0001-n')).resolves.toBeNull();
  });

  it('ambilDenganId memuat sinset, lema, dan relasi', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: '0001-n', status: 'draf' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'adil' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, tipe_relasi: 'hipernim' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, tipe_relasi: 'hiponim' }] });

    const result = await ModelSinset.ambilDenganId('0001-n');

    expect(result).toEqual({
      id: '0001-n',
      status: 'draf',
      lema: [{ id: 1, lema: 'adil' }],
      relasiKeluar: [{ id: 2, tipe_relasi: 'hipernim' }],
      relasiMasuk: [{ id: 3, tipe_relasi: 'hiponim' }],
    });
  });

  it('simpan mengembalikan null saat tidak ada field yang valid', async () => {
    await expect(ModelSinset.simpan('0001-n', { status: 'invalid' })).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpan juga mengembalikan null saat payload tidak diberikan', async () => {
    await expect(ModelSinset.simpan('0001-n')).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpan memperbarui field yang diberikan', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: '0001-n', status: 'terverifikasi' }] });

    const result = await ModelSinset.simpan('0001-n', {
      definisi_id: 10,
      contoh_id: ['c1'],
      status: 'terverifikasi',
      catatan: '',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sinset'),
      [10, ['c1'], 'terverifikasi', null, '0001-n']
    );
    expect(result).toEqual({ id: '0001-n', status: 'terverifikasi' });
  });

  it('simpan menormalkan definisi falsy, contoh non-array, dan bisa mengembalikan null saat update kosong', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelSinset.simpan('0001-n', {
      definisi_id: 0,
      contoh_id: 'bukan-array',
      status: 'draf',
      catatan: 'catatan',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sinset'),
      [null, [], 'draf', 'catatan', '0001-n']
    );
    expect(result).toBeNull();
  });

  it('tambahLema menolak input tidak valid, entri hilang, dan lema kosong', async () => {
    await expect(ModelSinset.tambahLema('', { entri_id: 1 })).resolves.toEqual({ error: 'invalid_input' });
    await expect(ModelSinset.tambahLema('0001-n', { entri_id: 'x' })).resolves.toEqual({ error: 'invalid_input' });
    await expect(ModelSinset.tambahLema('0001-n')).resolves.toEqual({ error: 'invalid_input' });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelSinset.tambahLema('0001-n', { entri_id: 44 })).resolves.toEqual({ error: 'entri_not_found' });

    db.query.mockReset();
    db.query.mockResolvedValueOnce({ rows: [{ id: 44, entri: '   ' }] });
    await expect(ModelSinset.tambahLema('0001-n', { entri_id: 44 })).resolves.toEqual({ error: 'invalid_input' });

    db.query.mockReset();
    db.query.mockResolvedValueOnce({ rows: [{ id: 44, entri: null }] });
    await expect(ModelSinset.tambahLema('0001-n', { entri_id: 44 })).resolves.toEqual({ error: 'invalid_input' });
  });

  it('tambahLema memakai urutan dan sumber eksplisit', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{ id: 7, sinset_id: '00002950-r', lema: 'adil', entri_id: 305, makna_id: null, urutan: 9, terverifikasi: false, sumber: 'impor' }],
      });

    const result = await ModelSinset.tambahLema('00002950-r', { entri_id: 305, urutan: 9, sumber: ' impor ' });

    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO sinset_lema'), ['00002950-r', 'adil', 305, 9, 'impor']);
    expect(result.data.urutan).toBe(9);
  });

  it('tambahLema memakai fallback urutan 0 dan data null jika query tidak mengembalikan baris', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelSinset.tambahLema('00002950-r', { entri_id: 305 });

    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO sinset_lema'), ['00002950-r', 'adil', 305, 0, 'redaksi']);
    expect(result).toEqual({ data: null });
  });

  it('tambahLema memaksa sumber kosong kembali ke redaksi', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });

    await ModelSinset.tambahLema('00002950-r', { entri_id: 305, sumber: '   ' });

    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO sinset_lema'), ['00002950-r', 'adil', 305, 0, 'redaksi']);
  });

  it('tambahLema memakai fallback sumber redaksi saat sumber null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 7 }] });

    await ModelSinset.tambahLema('00002950-r', { entri_id: 305, urutan: 2, sumber: null });

    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO sinset_lema'), ['00002950-r', 'adil', 305, 2, 'redaksi']);
  });

  it('simpanPemetaanLema mengembalikan null jika tidak ada field', async () => {
    await expect(ModelSinset.simpanPemetaanLema(5, {})).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpanPemetaanLema juga mengembalikan null jika payload tidak diberikan', async () => {
    await expect(ModelSinset.simpanPemetaanLema(5)).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpanPemetaanLema menyimpan makna dan verifikasi', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5, makna_id: null, terverifikasi: false }] });

    const result = await ModelSinset.simpanPemetaanLema(5, { makna_id: 0, terverifikasi: 0 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE sinset_lema'),
      [null, false, 5]
    );
    expect(result).toEqual({ id: 5, makna_id: null, terverifikasi: false });
  });

  it('simpanPemetaanLema dapat mengembalikan null saat update tidak menemukan data', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(ModelSinset.simpanPemetaanLema(5, { makna_id: 10 })).resolves.toBeNull();
  });

  it('ambilKandidatMakna mengembalikan null jika lema tidak ditemukan', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(ModelSinset.ambilKandidatMakna('0001-n', 5)).resolves.toBeNull();
  });

  it('ambilKandidatMakna memakai kelas kata non-r apa adanya', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ lema: 'adil', entri_id: null, kelas_kata: 'n' }] });

    await expect(ModelSinset.ambilKandidatMakna('00002950-n', 219548)).resolves.toEqual({
      lema: 'adil',
      entri_id: null,
      kelas_kata_sinset: 'n',
      kelas_kata_db: 'n',
      kandidat: [],
      semuaMakna: [],
    });
  });

  it('ambilKandidatMakna memakai kelas kata non-r untuk query kandidat', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ lema: 'adil', entri_id: 10, kelas_kata: 'n' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kelas_kata: 'n' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kelas_kata: 'n' }] });

    const result = await ModelSinset.ambilKandidatMakna('00002950-n', 219548);

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [10, 'n']);
    expect(result.kelas_kata_db).toBe('n');
  });

  it('hitungTotal dan daftarTipeRelasi mengembalikan data query', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '12' }] })
      .mockResolvedValueOnce({ rows: [{ kode: 'hipernim', nama: 'Hipernim' }] });

    await expect(ModelSinset.hitungTotal()).resolves.toBe(12);
    await expect(ModelSinset.daftarTipeRelasi()).resolves.toEqual([{ kode: 'hipernim', nama: 'Hipernim' }]);
  });

  it('ambilKandidatMakna mengambil contoh pertama dari tabel contoh', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ lema: 'adil', entri_id: 305, kelas_kata: 'r' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
      });

    const result = await ModelSinset.ambilKandidatMakna('00002950-r', 219548);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('FROM contoh c'),
      [305, 'adv']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('FROM contoh c'),
      [305]
    );
    expect(result).toEqual({
      lema: 'adil',
      entri_id: 305,
      kelas_kata_sinset: 'r',
      kelas_kata_db: 'adv',
      kandidat: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
      semuaMakna: [{ id: 10, polisem: 1, makna: 'patut', kelas_kata: 'adv', contoh: 'bertindak adil' }],
    });
  });

  it('ambilKandidatMakna mengembalikan shape konsisten saat entri belum terhubung', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ lema: 'adil', entri_id: null, kelas_kata: 'r' }],
    });

    const result = await ModelSinset.ambilKandidatMakna('00002950-r', 219548);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      lema: 'adil',
      entri_id: null,
      kelas_kata_sinset: 'r',
      kelas_kata_db: 'adv',
      kandidat: [],
      semuaMakna: [],
    });
  });

  it('tambahLema menyisipkan lema dari entri kamus dan urutan berikutnya', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ urutan: '3' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 1,
          sinset_id: '00002950-r',
          lema: 'adil',
          entri_id: 305,
          makna_id: null,
          urutan: 3,
          terverifikasi: false,
          sumber: 'redaksi',
        }],
      });

    const result = await ModelSinset.tambahLema('00002950-r', { entri_id: 305 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM entri'), [305]);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO sinset_lema'), ['00002950-r', 'adil', 305, 3, 'redaksi']);
    expect(result).toEqual({
      data: {
        id: 1,
        sinset_id: '00002950-r',
        lema: 'adil',
        entri_id: 305,
        makna_id: null,
        urutan: 3,
        terverifikasi: false,
        sumber: 'redaksi',
      },
    });
  });

  it('tambahLema menolak duplikat lema dalam satu sinset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 305, entri: 'adil' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 99, sinset_id: '00002950-r', lema: 'adil', entri_id: 305, makna_id: null, urutan: 0, terverifikasi: false }],
      });

    const result = await ModelSinset.tambahLema('00002950-r', { entri_id: 305 });

    expect(db.query).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      error: 'duplicate',
      data: { id: 99, sinset_id: '00002950-r', lema: 'adil', entri_id: 305, makna_id: null, urutan: 0, terverifikasi: false },
    });
  });
});