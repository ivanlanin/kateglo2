/**
 * @fileoverview Test ModelEtimologi
 * @tested_in backend/models/leksikon/modelEtimologi.js
 */

const db = require('../../../db');
const ModelEtimologi = require('../../../models/leksikon/modelEtimologi');

describe('ModelEtimologi', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cariEntriUntukTautan mengembalikan kosong saat query kosong', async () => {
    await expect(ModelEtimologi.cariEntriUntukTautan('')).resolves.toEqual([]);
    await expect(ModelEtimologi.cariEntriUntukTautan('   ')).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('cariEntriUntukTautan melakukan trim query dan clamp limit', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, entri: 'kata' }] });

    const result = await ModelEtimologi.cariEntriUntukTautan('  kat  ', { limit: 99 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM entri e'),
      ['%kat%', 'kat', 'kat%', 20]
    );
    expect(result).toEqual([{ id: 1, entri: 'kata' }]);
  });

  it('cariEntriUntukTautan memakai fallback limit default saat tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelEtimologi.cariEntriUntukTautan('kat', { limit: 0 });

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['%kat%', 'kat', 'kat%', 8]);
  });

  it('daftarAdmin tanpa q membatasi limit/offset dan mengembalikan total ter-parse', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '12' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, indeks: 'kata' }] });

    const result = await ModelEtimologi.daftarAdmin({ limit: 999, offset: -7 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.not.stringContaining('WHERE'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [200, 0]
    );
    expect(result).toEqual({ data: [{ id: 3, indeks: 'kata' }], total: 12 });
  });

  it('daftarAdmin dengan q menyusun filter where dan parameter q', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5 }, { id: 6 }] });

    const result = await ModelEtimologi.daftarAdmin({ q: ' serap ', limit: 2, offset: 3 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE ('),
      ['% serap %']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['% serap %', 2, 3]
    );
    expect(result).toEqual({ data: [{ id: 5 }, { id: 6 }], total: 2 });
  });

  it('daftarAdmin dengan filter bahasa menambahkan kondisi bahasa', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 8, bahasa: 'Inggris' }] });

    const result = await ModelEtimologi.daftarAdmin({ bahasa: 'Inggris', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("LOWER(COALESCE(ba.kode, '')) = LOWER($1)"),
      ['Inggris']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['Inggris', 10, 1]
    );
    expect(result).toEqual({ data: [{ id: 8, bahasa: 'Inggris' }], total: 1 });
  });

  it('daftarAdmin dengan filter bahasa kosong menambahkan kondisi null/blank', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, bahasa: null }] });

    const result = await ModelEtimologi.daftarAdmin({ bahasa: '__KOSONG__', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("e.bahasa_id IS NULL"),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [10, 1]
    );
    expect(result).toEqual({ data: [{ id: 10, bahasa: null }], total: 1 });
  });

  it('daftarAdmin dengan filter aktif menambahkan kondisi status', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 12, aktif: true }] });

    const result = await ModelEtimologi.daftarAdmin({ aktif: '1', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('e.aktif = $1'),
      [true]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [true, 10, 1]
    );
    expect(result).toEqual({ data: [{ id: 12, aktif: true }], total: 1 });
  });

  it('daftarAdmin dengan filter aktif=0 menambahkan kondisi status false', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 13, aktif: false }] });

    const result = await ModelEtimologi.daftarAdmin({ aktif: '0', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('e.aktif = $1'),
      [false]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [false, 10, 1]
    );
    expect(result).toEqual({ data: [{ id: 13, aktif: false }], total: 1 });
  });

  it('daftarAdmin dengan filter meragukan menambahkan kondisi meragukan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 14, meragukan: false }] });

    const result = await ModelEtimologi.daftarAdmin({ meragukan: '0', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('e.meragukan = $1'),
      [false]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [false, 10, 1]
    );
    expect(result).toEqual({ data: [{ id: 14, meragukan: false }], total: 1 });
  });

  it('daftarAdmin dengan bahasaId, sumberId, dan meragukan=1 memakai filter id numerik', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 21, bahasa_id: 9, sumber_id: 6, meragukan: true }] });

    const result = await ModelEtimologi.daftarAdmin({ bahasaId: '9', sumberId: '6', meragukan: '1', limit: 10, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('e.bahasa_id = $1'),
      [9, 6, true]
    );
    expect(db.query.mock.calls[0][0]).toContain('e.sumber_id = $2');
    expect(db.query.mock.calls[0][0]).toContain('e.meragukan = $3');
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      [9, 6, true, 10, 2]
    );
    expect(result).toEqual({ data: [{ id: 21, bahasa_id: 9, sumber_id: 6, meragukan: true }], total: 3 });
  });

  it('daftarAdmin memakai fallback default limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelEtimologi.daftarAdmin({ limit: 0, offset: undefined });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [50, 0]
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('daftarAdmin memakai nilai default parameter saat argumen tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    const result = await ModelEtimologi.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [50, 0]
    );
    expect(result).toEqual({ data: [{ id: 1 }], total: 1 });
  });

  it('ambilDenganId mengembalikan baris pertama atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 11 }] }).mockResolvedValueOnce({ rows: [] });

    await expect(ModelEtimologi.ambilDenganId(11)).resolves.toEqual({ id: 11 });
    await expect(ModelEtimologi.ambilDenganId(99)).resolves.toBeNull();
  });

  it('simpan melakukan update dan menormalisasi angka/boolean', async () => {
    const ambilSpy = jest.spyOn(ModelEtimologi, 'ambilDenganId').mockResolvedValue({ id: 9, indeks: 'kata' });
    db.query.mockResolvedValueOnce({ rows: [{ id: 9 }] });

    const result = await ModelEtimologi.simpan({
      id: 9,
      indeks: 'kata',
      homonim: '2',
      lafal: 'laf',
      bahasa_id: 5,
      kata_asal: 'asal-kata',
      arti_asal: 'makna asal',
      sumber_id: 7,
      sumber_definisi: 'def',
      sumber_sitasi: 'sit',
      sumber_isi: 'isi',
      sumber_aksara: 'aks',
      sumber_lihat: 'lihat',
      sumber_varian: 'var',
      entri_id: '4',
      aktif: '1',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE etimologi'),
      ['kata', 2, 'laf', 5, 'asal-kata', 'makna asal', 7, 'def', 'sit', 'isi', 'aks', 'lihat', 'var', 4, true, false, 9]
    );
    expect(ambilSpy).toHaveBeenCalledWith(9);
    expect(result).toEqual({ id: 9, indeks: 'kata' });
  });

  it('simpan melakukan insert dan menormalisasi nilai nullable', async () => {
    const ambilSpy = jest.spyOn(ModelEtimologi, 'ambilDenganId').mockResolvedValue({ id: 12 });
    db.query.mockResolvedValueOnce({ rows: [{ id: 12 }] });

    const result = await ModelEtimologi.simpan({
      indeks: 'serapan',
      homonim: 'abc',
      lafal: '',
      bahasa: '',
      kata_asal: '',
      arti_asal: '',
      sumber_id: '',
      sumber_definisi: '',
      sumber_sitasi: '',
      sumber_isi: '',
      sumber_aksara: '',
      sumber_lihat: '',
      sumber_varian: '',
      entri_id: '',
      aktif: null,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO etimologi'),
      ['serapan', null, '', null, '', '', null, '', '', '', '', '', '', null, false, false]
    );
    expect(ambilSpy).toHaveBeenCalledWith(12);
    expect(result).toEqual({ id: 12 });
  });

  it('simpan dapat meresolusi bahasa dari kode sebelum insert', async () => {
    const ambilSpy = jest.spyOn(ModelEtimologi, 'ambilDenganId').mockResolvedValue({ id: 13, bahasa_id: 5 });
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 13 }] });

    const result = await ModelEtimologi.simpan({
      indeks: 'serapan',
      bahasa: ' Ing ',
      kata_asal: 'borrowing',
    });

    expect(db.query).toHaveBeenNthCalledWith(1, 'SELECT id FROM bahasa WHERE LOWER(kode) = LOWER($1) LIMIT 1', ['Ing']);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO etimologi'),
      ['serapan', null, undefined, 5, 'borrowing', undefined, null, undefined, undefined, undefined, undefined, undefined, undefined, null, true, false]
    );
    expect(ambilSpy).toHaveBeenCalledWith(13);
    expect(result).toEqual({ id: 13, bahasa_id: 5 });
  });

  it('simpan melempar INVALID_BAHASA ketika kode bahasa tidak ditemukan', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(ModelEtimologi.simpan({ indeks: 'serapan', bahasa: 'xyz' })).rejects.toMatchObject({
      code: 'INVALID_BAHASA',
      message: 'Bahasa tidak valid',
    });
  });

  it('simpan melewati lookup bahasa saat nilai bahasa hanya spasi', async () => {
    const ambilSpy = jest.spyOn(ModelEtimologi, 'ambilDenganId').mockResolvedValue({ id: 15, bahasa_id: null });
    db.query.mockResolvedValueOnce({ rows: [{ id: 15 }] });

    const result = await ModelEtimologi.simpan({ indeks: 'serapan', bahasa: '   ' });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO etimologi'),
      ['serapan', null, undefined, null, undefined, undefined, null, undefined, undefined, undefined, undefined, undefined, undefined, null, false, false]
    );
    expect(ambilSpy).toHaveBeenCalledWith(15);
    expect(result).toEqual({ id: 15, bahasa_id: null });
  });

  it('simpan mengembalikan null ketika query tidak me-return id', async () => {
    const ambilSpy = jest.spyOn(ModelEtimologi, 'ambilDenganId');
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelEtimologi.simpan({ id: 31, indeks: 'tanpa-id' });

    expect(result).toBeNull();
    expect(ambilSpy).not.toHaveBeenCalled();
  });

  it('hapus mengembalikan true/false berdasarkan row returning', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [] });

    await expect(ModelEtimologi.hapus(1)).resolves.toBe(true);
    await expect(ModelEtimologi.hapus(2)).resolves.toBe(false);
  });

  it('hitungTotal mengembalikan angka ter-parse atau 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '17' }] }).mockResolvedValueOnce({ rows: [{}] });

    await expect(ModelEtimologi.hitungTotal()).resolves.toBe(17);
    await expect(ModelEtimologi.hitungTotal()).resolves.toBe(0);
  });

  it('ambilAktifPublikByEntriId mengembalikan kosong saat entriId tidak valid', async () => {
    await expect(ModelEtimologi.ambilAktifPublikByEntriId(0)).resolves.toEqual([]);
    await expect(ModelEtimologi.ambilAktifPublikByEntriId(-1)).resolves.toEqual([]);
    await expect(ModelEtimologi.ambilAktifPublikByEntriId('abc')).resolves.toEqual([]);
    await expect(ModelEtimologi.ambilAktifPublikByEntriId(null)).resolves.toEqual([]);
    await expect(ModelEtimologi.ambilAktifPublikByEntriId(1.5)).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilAktifPublikByEntriId memanggil db.query dengan id valid dan mengembalikan baris', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 5, bahasa: 'Inggris', kata_asal: 'active', sumber: 'KBBI' }] });

    const result = await ModelEtimologi.ambilAktifPublikByEntriId(3);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM etimologi'),
      [3]
    );
    expect(result).toEqual([{ id: 5, bahasa: 'Inggris', kata_asal: 'active', sumber: 'KBBI' }]);
  });

  it('ambilAktifPublikByEntriId menerima entriId berupa string angka valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEtimologi.ambilAktifPublikByEntriId('7');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [7]);
    expect(result).toEqual([]);
  });

  it('ambilAktifPublikByEntriId dapat mematikan filter aktif saat aktifSaja=false', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9 }] });

    const result = await ModelEtimologi.ambilAktifPublikByEntriId(9, { aktifSaja: false });

    expect(db.query).toHaveBeenCalledWith(
      expect.not.stringContaining('AND e.aktif = TRUE'),
      [9]
    );
    expect(result).toEqual([{ id: 9 }]);
  });
});



