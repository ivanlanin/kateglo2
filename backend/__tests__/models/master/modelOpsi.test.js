/**
 * @fileoverview Test ModelOpsi
 * @tested_in backend/models/modelOpsi.js
 */

const db = require('../../db');
const ModelOpsi = require('../../models/modelOpsi');
const {
  buildMasterFilters,
  buildBidangFilters,
  buildSumberFilters,
  normalisasiKategoriLabel,
  kandidatKategoriLabel,
  normalizeLabelValue,
  pushLabelUnik,
  getMasterKategoriTable,
  ambilDaftarLabelMaster,
} = require('../../models/modelOpsi').__private;

describe('ModelOpsi', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('helper privat model opsi mencakup semua cabang filter dan normalisasi', async () => {
    const paramsMasterAktif = [];
    const paramsMasterNonaktif = [];
    const paramsBidang = [];
    const paramsSumber = [];
    const grouped = {};

    expect(buildMasterFilters({ alias: 'ba', q: 'ing', aktif: '1', params: paramsMasterAktif })).toEqual([
      expect.stringContaining('ba.kode ILIKE $1'),
      'ba.aktif = TRUE',
    ]);
    expect(paramsMasterAktif).toEqual(['%ing%']);
    expect(buildMasterFilters({ alias: 'ba', q: '', aktif: '0', params: paramsMasterNonaktif })).toEqual(['ba.aktif = FALSE']);
    expect(buildBidangFilters({ alias: 'b', q: 'kim', kamus: '1', glosarium: '0', params: paramsBidang })).toEqual([
      expect.stringContaining('b.kode ILIKE $1'),
      'b.kamus = TRUE',
      'b.glosarium = FALSE',
    ]);
    expect(paramsBidang).toEqual(['%kim%']);
    expect(buildSumberFilters({ q: 'kbb', glosarium: '1', kamus: '0', tesaurus: '1', etimologi: '0', params: paramsSumber })).toEqual([
      expect.stringContaining('s.kode ILIKE $1'),
      's.glosarium = TRUE',
      's.kamus = FALSE',
      's.tesaurus = TRUE',
      's.etimologi = FALSE',
    ]);
    expect(paramsSumber).toEqual(['%kbb%']);

    expect(normalisasiKategoriLabel('kelas_kata')).toBe('kelas-kata');
    expect(normalisasiKategoriLabel()).toBe('');
    expect(normalisasiKategoriLabel('kelas')).toBe('kelas-kata');
    expect(normalisasiKategoriLabel('ragam')).toBe('ragam');
    expect(kandidatKategoriLabel()).toEqual([]);
    expect(kandidatKategoriLabel('')).toEqual([]);
    expect(kandidatKategoriLabel('kelas-kata')).toEqual(['kelas-kata', 'kelas_kata']);
    expect(kandidatKategoriLabel('ragam')).toEqual(['ragam']);
    expect(normalizeLabelValue()).toBe('');
    expect(normalizeLabelValue(' N ')).toBe('n');
    pushLabelUnik(grouped, 'kelas-kata', { kode: 'N', nama: 'Nomina' });
    pushLabelUnik(grouped, 'kelas-kata', { kode: ' n ', nama: 'Nomina ganda' });
    expect(grouped).toEqual({
      'kelas-kata': [{ kode: 'N', nama: 'Nomina' }],
    });
    expect(getMasterKategoriTable()).toBe('');
    expect(getMasterKategoriTable('bahasa')).toBe('bahasa');
    expect(getMasterKategoriTable('asing')).toBe('');
    expect(buildMasterFilters({ alias: 'ba', q: '', aktif: '', params: [] })).toEqual([]);
    expect(buildBidangFilters({ alias: 'b', q: '', kamus: '', glosarium: '', params: [] })).toEqual([]);
    expect(buildSumberFilters({ q: '', glosarium: '', kamus: '', tesaurus: '', etimologi: '', params: [] })).toEqual([]);

    db.query.mockResolvedValueOnce({ rows: [{ kode: 'id', nama: 'Indonesia' }] });
    db.query.mockResolvedValueOnce({ rows: [{ kode: 'kim', nama: 'Kimia' }] });
    await expect(ambilDaftarLabelMaster()).resolves.toEqual([]);
    await expect(ambilDaftarLabelMaster('asing')).resolves.toEqual([]);
    await expect(ambilDaftarLabelMaster('bahasa')).resolves.toEqual([{ kode: 'id', nama: 'Indonesia' }]);
    await expect(ambilDaftarLabelMaster('bidang')).resolves.toEqual([{ kode: 'kim', nama: 'Kimia' }]);
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE aktif = TRUE'));
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE kamus = TRUE'));
  });

  it('daftarMasterBidang dan daftarLookupBidang mendukung jalur tanpa filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'bio', nama: 'Biologi' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'bio', nama: 'Biologi' }] });

    await expect(ModelOpsi.daftarMasterBidang()).resolves.toEqual({
      data: [{ id: 1, kode: 'bio', nama: 'Biologi' }],
      total: 1,
    });
    await expect(ModelOpsi.daftarLookupBidang()).resolves.toEqual([{ id: 1, kode: 'bio', nama: 'Biologi' }]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.not.stringContaining('WHERE'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.not.stringContaining('WHERE'), []);
  });

  it('daftarMasterBidang memakai fallback limit default ketika limit tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelOpsi.daftarMasterBidang({ limit: 0, offset: 0 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('daftarMasterBidang menerapkan filter kamus dan glosarium serta clamp pagination', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'kim', nama: 'Kimia' }] });

    const result = await ModelOpsi.daftarMasterBidang({ q: 'kim', kamus: '0', glosarium: '1', limit: 999, offset: -5 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('b.kamus = FALSE'),
      ['%kim%']
    );
    expect(db.query.mock.calls[0][0]).toContain('b.glosarium = TRUE');
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%kim%', 200, 0]
    );
    expect(result).toEqual({ data: [{ id: 1, kode: 'kim', nama: 'Kimia' }], total: 3 });
  });

  it('daftarMasterBidang dapat menerapkan filter kamus=true dan glosarium=false', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, kode: 'bio', nama: 'Biologi' }] });

    await ModelOpsi.daftarMasterBidang({ kamus: '1', glosarium: '0', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('b.kamus = TRUE'), []);
    expect(db.query.mock.calls[0][0]).toContain('b.glosarium = FALSE');
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [10, 1]);
  });

  it('ambilMasterBidangDenganId mengembalikan row pertama atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 3, kode: 'kim' }] }).mockResolvedValueOnce({ rows: [] });

    await expect(ModelOpsi.ambilMasterBidangDenganId(3)).resolves.toEqual({ id: 3, kode: 'kim' });
    await expect(ModelOpsi.ambilMasterBidangDenganId(99)).resolves.toBeNull();
  });

  it('daftarLookupBidang memakai pencarian dan mengembalikan rows apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, kode: 'kim', nama: 'Kimia' }] });

    const result = await ModelOpsi.daftarLookupBidang({ q: 'kim' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM bidang b'),
      ['%kim%']
    );
    expect(result).toEqual([{ id: 1, kode: 'kim', nama: 'Kimia' }]);
  });

  it('daftarLookupBahasa mengembalikan id, kode, nama, dan iso2', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 2, kode: 'Ing', nama: 'Inggris', iso2: 'en' }] });

    const result = await ModelOpsi.daftarLookupBahasa();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT ba.id, ba.kode, ba.nama, ba.iso2'),
      []
    );
    expect(result).toEqual([{ id: 2, kode: 'Ing', nama: 'Inggris', iso2: 'en' }]);
  });

  it('daftarLookupSumber menerapkan filter konteks dan q', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 3, kode: 'kbbi', nama: 'KBBI' }] });

    const result = await ModelOpsi.daftarLookupSumber({ q: 'kbb', glosarium: '1', etimologi: '0' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('s.glosarium = TRUE'),
      ['%kbb%']
    );
    expect(db.query.mock.calls[0][0]).toContain('s.etimologi = FALSE');
    expect(result).toEqual([{ id: 3, kode: 'kbbi', nama: 'KBBI' }]);
  });

  it('ambilKategoriLabelUntukRedaksi mengembalikan objek kosong untuk kategori tidak valid', async () => {
    const result = await ModelOpsi.ambilKategoriLabelUntukRedaksi(['x', 'y', '']);

    expect(result).toEqual({});
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilKategoriLabelUntukRedaksi menggabungkan label biasa dan master', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          { kategori: 'kelas_kata', kode: 'n', nama: 'nomina' },
          { kategori: 'kelas-kata', kode: 'v', nama: 'verba' },
          { kategori: 'ragam', kode: 'cak', nama: 'cakapan' },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ kode: 'id', nama: 'Indonesia' }] });

    const result = await ModelOpsi.ambilKategoriLabelUntukRedaksi();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM label'),
      [expect.arrayContaining(['kelas-kata', 'kelas_kata', 'ragam'])]
    );
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE kamus = TRUE'));
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('FROM bahasa'));
    expect(result['kelas-kata']).toEqual([
      { kode: 'n', nama: 'nomina' },
      { kode: 'v', nama: 'verba' },
    ]);
    expect(result.ragam).toEqual([{ kode: 'cak', nama: 'cakapan' }]);
    expect(result.bidang).toEqual([]);
    expect(result.bahasa).toEqual([{ kode: 'id', nama: 'Indonesia' }]);
  });

  it('simpanMasterBidang membuat data baru lalu memuat detailnya', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 9 }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, kode: 'kim', nama: 'Kimia' }] });

    const result = await ModelOpsi.simpanMasterBidang({
      kode: 'kim',
      nama: 'Kimia',
      kamus: false,
      glosarium: true,
      keterangan: 'ipa',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO bidang'),
      ['kim', 'Kimia', false, true, 'ipa']
    );
    expect(result).toEqual({ id: 9, kode: 'kim', nama: 'Kimia' });
  });

  it('simpanMasterBidang mengubah data dan dapat mengembalikan null saat update tidak menemukan id', async () => {
    const detailSpy = jest.spyOn(ModelOpsi, 'ambilMasterBidangDenganId').mockResolvedValue({ id: 7, kode: 'fis', nama: 'Fisika' });
    db.query.mockResolvedValueOnce({ rows: [{ id: 7 }] }).mockResolvedValueOnce({ rows: [] });

    const success = await ModelOpsi.simpanMasterBidang({ id: 7, kode: 'fis', nama: 'Fisika', kamus: '1', glosarium: 0, keterangan: '' });
    const missing = await ModelOpsi.simpanMasterBidang({ id: 8, kode: 'bio', nama: 'Biologi' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE bidang'),
      ['fis', 'Fisika', true, false, '', 7]
    );
    expect(detailSpy).toHaveBeenCalledWith(7);
    expect(success).toEqual({ id: 7, kode: 'fis', nama: 'Fisika' });
    expect(missing).toBeNull();
  });

  it('hapusMasterBidang mengembalikan true atau false saat tidak dipakai', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await expect(ModelOpsi.hapusMasterBidang(4)).resolves.toBe(true);
    await expect(ModelOpsi.hapusMasterBidang(5)).resolves.toBe(false);
  });

  it('hapusMasterBidang melempar MASTER_IN_USE saat masih dipakai', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '1' }] });

    await expect(ModelOpsi.hapusMasterBidang(6)).rejects.toMatchObject({
      code: 'MASTER_IN_USE',
      message: 'Bidang masih dipakai di glosarium dan tidak bisa dihapus',
    });
  });

  it('daftarMasterBahasa menerapkan filter aktif dan pagination default', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kode: 'Ing', nama: 'Inggris' }] });

    const result = await ModelOpsi.daftarMasterBahasa({ q: 'ing', aktif: '0', limit: 0, offset: -1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('ba.aktif = FALSE'),
      ['%ing%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%ing%', 50, 0]
    );
    expect(result).toEqual({ data: [{ id: 2, kode: 'Ing', nama: 'Inggris' }], total: 2 });
  });

  it('daftarMasterBahasa dapat menerapkan filter aktif=true', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, kode: 'id', nama: 'Indonesia' }] });

    await ModelOpsi.daftarMasterBahasa({ aktif: '1', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('ba.aktif = TRUE'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [10, 1]);
  });

  it('daftarMasterBahasa dan daftarLookupBahasa mendukung jalur tanpa filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'id', nama: 'Indonesia' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'id', nama: 'Indonesia', iso2: 'id' }] });

    await expect(ModelOpsi.daftarMasterBahasa()).resolves.toEqual({
      data: [{ id: 1, kode: 'id', nama: 'Indonesia' }],
      total: 2,
    });
    await expect(ModelOpsi.daftarLookupBahasa({ q: '' })).resolves.toEqual([{ id: 1, kode: 'id', nama: 'Indonesia', iso2: 'id' }]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.not.stringContaining('WHERE'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.not.stringContaining('WHERE'), []);
  });

  it('daftarLookupBahasa dapat menerapkan pencarian q', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 5, kode: 'Ing', nama: 'Inggris', iso2: 'en' }] });

    const result = await ModelOpsi.daftarLookupBahasa({ q: 'ing' });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE ('), ['%ing%']);
    expect(result).toEqual([{ id: 5, kode: 'Ing', nama: 'Inggris', iso2: 'en' }]);
  });

  it('hapusMasterBahasa melempar MASTER_IN_USE saat masih dipakai', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '2' }] });

    await expect(ModelOpsi.hapusMasterBahasa(7)).rejects.toMatchObject({
      code: 'MASTER_IN_USE',
      message: 'Bahasa masih dipakai dan tidak bisa dihapus',
    });
  });

  it('ambilMasterBahasaDenganId mengembalikan row pertama atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 6, kode: 'id', nama: 'Indonesia' }] }).mockResolvedValueOnce({ rows: [] });

    await expect(ModelOpsi.ambilMasterBahasaDenganId(6)).resolves.toEqual({ id: 6, kode: 'id', nama: 'Indonesia' });
    await expect(ModelOpsi.ambilMasterBahasaDenganId(99)).resolves.toBeNull();
  });

  it('simpanMasterBahasa mencakup update sukses, update null, dan insert', async () => {
    const detailSpy = jest.spyOn(ModelOpsi, 'ambilMasterBahasaDenganId')
      .mockResolvedValueOnce({ id: 6, kode: 'id', nama: 'Indonesia' })
      .mockResolvedValueOnce({ id: 10, kode: 'fr', nama: 'Prancis' });
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 6 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 10 }] });

    await expect(ModelOpsi.simpanMasterBahasa({ id: 6, kode: 'id', nama: 'Indonesia', aktif: '1', iso2: 'id', iso3: 'ind', keterangan: '' }))
      .resolves.toEqual({ id: 6, kode: 'id', nama: 'Indonesia' });
    await expect(ModelOpsi.simpanMasterBahasa({ id: 8, kode: 'de', nama: 'Jerman' })).resolves.toBeNull();
    await expect(ModelOpsi.simpanMasterBahasa({ kode: 'fr', nama: 'Prancis', aktif: false, iso2: 'fr', iso3: 'fra', keterangan: 'roman' }))
      .resolves.toEqual({ id: 10, kode: 'fr', nama: 'Prancis' });

    expect(detailSpy).toHaveBeenCalledWith(6);
    expect(detailSpy).toHaveBeenCalledWith(10);
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE bahasa'), ['id', 'Indonesia', true, 'id', 'ind', '', 6]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO bahasa'), ['fr', 'Prancis', false, 'fr', 'fra', 'roman']);
  });

  it('hapusMasterBahasa mengembalikan true atau false saat tidak dipakai', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await expect(ModelOpsi.hapusMasterBahasa(11)).resolves.toBe(true);
    await expect(ModelOpsi.hapusMasterBahasa(12)).resolves.toBe(false);
  });

  it('daftarMasterSumber menerapkan semua filter konteks dan clamp pagination', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({ rows: [{ id: 4, kode: 'kbbi', nama: 'KBBI' }] });

    await expect(ModelOpsi.daftarMasterSumber({ q: 'bb', glosarium: '0', kamus: '1', tesaurus: '0', etimologi: '1', limit: 999, offset: -1 }))
      .resolves.toEqual({ data: [{ id: 4, kode: 'kbbi', nama: 'KBBI' }], total: 5 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('s.glosarium = FALSE'), ['%bb%']);
    expect(db.query.mock.calls[0][0]).toContain('s.kamus = TRUE');
    expect(db.query.mock.calls[0][0]).toContain('s.tesaurus = FALSE');
    expect(db.query.mock.calls[0][0]).toContain('s.etimologi = TRUE');
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%bb%', 200, 0]);
  });

  it('daftarMasterSumber dan daftarLookupSumber mendukung jalur tanpa filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kode: 'wiki', nama: 'Wikipedia' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kode: 'wiki', nama: 'Wikipedia' }] });

    await expect(ModelOpsi.daftarMasterSumber()).resolves.toEqual({
      data: [{ id: 2, kode: 'wiki', nama: 'Wikipedia' }],
      total: 1,
    });
    await expect(ModelOpsi.daftarLookupSumber()).resolves.toEqual([{ id: 2, kode: 'wiki', nama: 'Wikipedia' }]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.not.stringContaining('WHERE'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.not.stringContaining('WHERE'), []);
  });

  it('daftarMasterSumber memakai fallback limit default ketika limit tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelOpsi.daftarMasterSumber({ limit: 0, offset: 0 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('ambilMasterSumberDenganId mengembalikan row pertama atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 4, kode: 'kbbi', nama: 'KBBI' }] }).mockResolvedValueOnce({ rows: [] });

    await expect(ModelOpsi.ambilMasterSumberDenganId(4)).resolves.toEqual({ id: 4, kode: 'kbbi', nama: 'KBBI' });
    await expect(ModelOpsi.ambilMasterSumberDenganId(99)).resolves.toBeNull();
  });

  it('simpanMasterSumber mencakup update sukses, update null, dan insert', async () => {
    const detailSpy = jest.spyOn(ModelOpsi, 'ambilMasterSumberDenganId')
      .mockResolvedValueOnce({ id: 4, kode: 'kbbi', nama: 'KBBI' })
      .mockResolvedValueOnce({ id: 8, kode: 'wiki', nama: 'Wikipedia' });
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 4 }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 8 }] });

    await expect(ModelOpsi.simpanMasterSumber({ id: 4, kode: 'kbbi', nama: 'KBBI', glosarium: '1', kamus: 0, tesaurus: '1', etimologi: false, keterangan: '' }))
      .resolves.toEqual({ id: 4, kode: 'kbbi', nama: 'KBBI' });
    await expect(ModelOpsi.simpanMasterSumber({ id: 5, kode: 'old', nama: 'Old' })).resolves.toBeNull();
    await expect(ModelOpsi.simpanMasterSumber({ kode: 'wiki', nama: 'Wikipedia', glosarium: true, kamus: true, tesaurus: false, etimologi: true, keterangan: 'ensiklopedia' }))
      .resolves.toEqual({ id: 8, kode: 'wiki', nama: 'Wikipedia' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE sumber'), ['kbbi', 'KBBI', true, false, true, false, '', 4]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO sumber'), ['wiki', 'Wikipedia', true, true, false, true, 'ensiklopedia']);
    expect(detailSpy).toHaveBeenCalledWith(4);
    expect(detailSpy).toHaveBeenCalledWith(8);
  });

  it('hapusMasterSumber mencakup in-use, true, dan false', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 0 });

    await expect(ModelOpsi.hapusMasterSumber(8)).rejects.toMatchObject({ code: 'MASTER_IN_USE' });
    await expect(ModelOpsi.hapusMasterSumber(9)).resolves.toBe(true);
    await expect(ModelOpsi.hapusMasterSumber(10)).resolves.toBe(false);
  });

  it('hitungTotalBidang, hitungTotalBahasa, dan hitungTotalSumber mengembalikan parse count atau 0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '7' }] })
      .mockResolvedValueOnce({ rows: [{}] })
      .mockResolvedValueOnce({ rows: [{ total: '8' }] });

    await expect(ModelOpsi.hitungTotalBidang()).resolves.toBe(7);
    await expect(ModelOpsi.hitungTotalBahasa()).resolves.toBe(0);
    await expect(ModelOpsi.hitungTotalSumber()).resolves.toBe(8);
  });

  it('ambilKategoriLabelUntukRedaksi mengembalikan kategori khusus, mengabaikan label asing, dan menghapus duplikasi kode', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { kategori: 'kelas-kata', kode: 'n', nama: 'nomina' },
        { kategori: 'kelas_kata', kode: ' N ', nama: 'nomina duplikat' },
        { kategori: 'asing', kode: 'x', nama: 'asing' },
      ],
    });

    const result = await ModelOpsi.ambilKategoriLabelUntukRedaksi(['kelas', 'kelas-kata']);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM label'), [['kelas-kata', 'kelas_kata']]);
    expect(result).toEqual({
      'kelas-kata': [{ kode: 'n', nama: 'nomina' }],
    });
  });

  it('ambilKategoriLabelUntukRedaksi dengan kategori master saja tidak membaca tabel label', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ kode: 'id', nama: 'Indonesia' }] });

    const result = await ModelOpsi.ambilKategoriLabelUntukRedaksi(['bahasa']);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM bahasa'));
    expect(result).toEqual({
      bahasa: [{ kode: 'id', nama: 'Indonesia' }],
    });
  });
});