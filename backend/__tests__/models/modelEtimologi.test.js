/**
 * @fileoverview Test ModelEtimologi
 * @tested_in backend/models/modelEtimologi.js
 */

const db = require('../../db');
const ModelEtimologi = require('../../models/modelEtimologi');

describe('ModelEtimologi', () => {
  beforeEach(() => {
    db.query.mockReset();
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
      bahasa: 'id',
      sumber: 'LWIM',
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
      ['kata', 2, 'laf', 'id', 'LWIM', 'def', 'sit', 'isi', 'aks', 'lihat', 'var', 4, true, 9]
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
      sumber: '',
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
      ['serapan', null, '', '', '', '', '', '', '', '', '', null, true]
    );
    expect(ambilSpy).toHaveBeenCalledWith(12);
    expect(result).toEqual({ id: 12 });
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
});
