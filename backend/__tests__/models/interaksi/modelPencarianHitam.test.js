/**
 * @fileoverview Test ModelPencarianHitam
 * @tested_in backend/models/interaksi/modelPencarianHitam.js
 */

const db = require('../../../db');
const logger = require('../../../config/logger');
const ModelPencarianHitam = require('../../../models/interaksi/modelPencarianHitam');

describe('ModelPencarianHitam', () => {
  beforeEach(() => {
    db.query.mockReset();
    ModelPencarianHitam.resetCache();
    jest.spyOn(logger, 'warn').mockImplementation(() => {});
  });

  it('helper private normalisasi/parse menutup semua cabang', () => {
    const { normalisasiKata, parseAktifBoolean, parseLimit } = ModelPencarianHitam.__private;

    expect(normalisasiKata('  KaTa   A  ')).toBe('kata a');
    expect(normalisasiKata(undefined)).toBe('');

    expect(parseAktifBoolean(undefined, true)).toBe(true);
    expect(parseAktifBoolean('', false)).toBe(false);
    expect(parseAktifBoolean(true)).toBe(true);
    expect(parseAktifBoolean(1)).toBe(true);
    expect(parseAktifBoolean(0)).toBe(false);
    expect(parseAktifBoolean('YA')).toBe(true);
    expect(parseAktifBoolean('nonaktif')).toBe(false);

    expect(parseLimit(undefined, 200)).toBe(200);
    expect(parseLimit('0', 200)).toBe(1);
    expect(parseLimit('2000', 200)).toBe(1000);
    expect(parseLimit('5', 200)).toBe(5);
    expect(parseLimit()).toBe(200);
  });

  it('hitungTotal mengembalikan jumlah blacklist atau 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '11' }] });
    await expect(ModelPencarianHitam.hitungTotal()).resolves.toBe(11);

    db.query.mockResolvedValueOnce({ rows: [{}] });
    await expect(ModelPencarianHitam.hitungTotal()).resolves.toBe(0);
  });

  it('daftarAdmin dan simpan bisa dipanggil dengan argumen default object', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{}] });
    await expect(ModelPencarianHitam.daftarAdmin()).resolves.toEqual({ data: [], total: 0 });

    await expect(ModelPencarianHitam.simpan()).rejects.toThrow('Kata wajib diisi');
  });

  it('ambilSetAktif memakai cache, forceRefresh, dan loadingPromise paralel', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ kata: '  Ujaran  ' }, { kata: '' }] });

    const setPertama = await ModelPencarianHitam.ambilSetAktif();
    expect(setPertama.has('ujaran')).toBe(true);

    const setKedua = await ModelPencarianHitam.ambilSetAktif();
    expect(setKedua).toBe(setPertama);
    expect(db.query).toHaveBeenCalledTimes(1);

    let resolveQuery;
    db.query.mockImplementationOnce(() => new Promise((resolve) => {
      resolveQuery = resolve;
    }));

    const p1 = ModelPencarianHitam.ambilSetAktif({ forceRefresh: true });
    const p2 = ModelPencarianHitam.ambilSetAktif({ forceRefresh: true });
    resolveQuery({ rows: [{ kata: 'baru' }] });

    const [s1, s2] = await Promise.all([p1, p2]);
    expect(s1).toBe(s2);
    expect(s1.has('baru')).toBe(true);
    expect(db.query).toHaveBeenCalledTimes(2);
  });

  it('ambilSetAktif fallback set kosong saat query gagal', async () => {
    db.query.mockRejectedValueOnce(new Error('db gagal'));

    const setKata = await ModelPencarianHitam.ambilSetAktif({ forceRefresh: true });

    expect(setKata).toBeInstanceOf(Set);
    expect(setKata.size).toBe(0);
    expect(logger.warn).toHaveBeenCalledWith(expect.stringContaining('db gagal'));
  });

  it('apakahKataDiblokir menangani kata kosong dan kata aktif', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ kata: 'terlarang' }] });

    await expect(ModelPencarianHitam.apakahKataDiblokir('   ')).resolves.toBe(false);
    await expect(ModelPencarianHitam.apakahKataDiblokir(' TERLARANG ')).resolves.toBe(true);
  });

  it('daftarAdmin menyusun filter where dan memetakan hasil', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: '1', kata: 'uji', aktif: 1, catatan: 'c', created_at: 'x', updated_at: 'y' }] })
      .mockResolvedValueOnce({ rows: [{ total: '7' }] });

    const result = await ModelPencarianHitam.daftarAdmin({ q: ' Uji ', aktif: '1', limit: 5000, offset: -2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE kata ILIKE $1 AND aktif = $2'),
      ['%uji%', true, 1000, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('SELECT COUNT(*)::bigint AS total'),
      ['%uji%', true]
    );
    expect(result).toEqual({
      data: [{ id: 1, kata: 'uji', aktif: true, catatan: 'c', created_at: 'x', updated_at: 'y' }],
      total: 7,
    });
  });

  it('daftarAdmin tanpa q/aktif dan dengan aktif nonaktif mencakup semua cabang where', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: '3', kata: 'abc', aktif: false, catatan: null, created_at: null, updated_at: null }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });
    await expect(ModelPencarianHitam.daftarAdmin({ q: '', aktif: '', limit: 'abc', offset: 'abc' })).resolves.toEqual({
      data: [{ id: 3, kata: 'abc', aktif: false, catatan: null, created_at: null, updated_at: null }],
      total: 1,
    });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.not.stringContaining('WHERE'), [200, 0]);

    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });
    await ModelPencarianHitam.daftarAdmin({ aktif: '0', limit: 1, offset: 2 });
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('aktif = $1'), [false, 1, 2]);
  });

  it('ambilDenganId validasi id, return null, dan mapping data', async () => {
    await expect(ModelPencarianHitam.ambilDenganId('abc')).resolves.toBeNull();
    expect(db.query).not.toHaveBeenCalled();

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelPencarianHitam.ambilDenganId(10)).resolves.toBeNull();

    db.query.mockResolvedValueOnce({ rows: [{ id: '2', kata: 'a', aktif: 0, catatan: null, created_at: 'x', updated_at: 'y' }] });
    await expect(ModelPencarianHitam.ambilDenganId(2)).resolves.toEqual({
      id: 2,
      kata: 'a',
      aktif: false,
      catatan: null,
      created_at: 'x',
      updated_at: 'y',
    });
  });

  it('simpan menolak kata kosong, update/insert, dan null ketika returning kosong', async () => {
    await expect(ModelPencarianHitam.simpan({ kata: '   ' })).rejects.toThrow('Kata wajib diisi');

    db.query.mockResolvedValueOnce({ rows: [{ id: '5', kata: 'uji', aktif: true, catatan: 'x', created_at: 'a', updated_at: 'b' }] });
    await expect(ModelPencarianHitam.simpan({ id: 5, kata: ' Uji ', aktif: '0', catatan: '  ' })).resolves.toEqual({
      id: 5,
      kata: 'uji',
      aktif: true,
      catatan: 'x',
      created_at: 'a',
      updated_at: 'b',
    });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelPencarianHitam.simpan({ id: 6, kata: 'baru' })).resolves.toBeNull();

    db.query.mockResolvedValueOnce({ rows: [{ id: '7', kata: 'baru', aktif: false, catatan: null, created_at: 'a', updated_at: 'b' }] });
    await expect(ModelPencarianHitam.simpan({ kata: 'Baru', aktif: false, catatan: null })).resolves.toEqual({
      id: 7,
      kata: 'baru',
      aktif: false,
      catatan: null,
      created_at: 'a',
      updated_at: 'b',
    });

    db.query.mockResolvedValueOnce({ rows: [{ id: '8', kata: 'tes', aktif: true, catatan: null, created_at: null, updated_at: null }] });
    await expect(ModelPencarianHitam.simpan({ id: 'abc', kata: 'Tes', aktif: 'yes', catatan: '' })).resolves.toEqual({
      id: 8,
      kata: 'tes',
      aktif: true,
      catatan: null,
      created_at: null,
      updated_at: null,
    });
  });

  it('hapus validasi id dan status rowCount', async () => {
    await expect(ModelPencarianHitam.hapus('abc')).resolves.toBe(false);
    expect(db.query).not.toHaveBeenCalled();

    db.query.mockResolvedValueOnce({ rowCount: 0 });
    await expect(ModelPencarianHitam.hapus(3)).resolves.toBe(false);

    db.query.mockResolvedValueOnce({ rowCount: 1 });
    await expect(ModelPencarianHitam.hapus(4)).resolves.toBe(true);
  });
});



