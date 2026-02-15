/**
 * @fileoverview Test ModelLema
 * @tested_in backend/models/modelLema.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const ModelLema = require('../../models/modelLema');

describe('ModelLema', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['kata', 'kata kerja']);

    const result = await ModelLema.autocomplete('kat', 12);

    expect(autocomplete).toHaveBeenCalledWith('lema', 'lema', 'kat', {
      limit: 12,
      extraWhere: 'aktif = 1',
    });
    expect(result).toEqual(['kata', 'kata kerja']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelLema.autocomplete('kat');

    expect(autocomplete).toHaveBeenCalledWith('lema', 'lema', 'kat', {
      limit: 8,
      extraWhere: 'aktif = 1',
    });
  });

  it('cariLema mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelLema.cariLema(' zzz ', 10, 5);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['zzz', 'zzz%', '%zzz%']
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('cariLema menormalisasi query serta clamp limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ total: '3' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, lema: 'kata', jenis: 'dasar' }],
      });

    const result = await ModelLema.cariLema('  kata  ', '999', '-3');

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['kata', 'kata%', '%kata%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 200, 0]
    );
    expect(result).toEqual({ data: [{ id: 1, lema: 'kata', jenis: 'dasar' }], total: 3 });
  });

  it('cariLema memakai limit dan offset default saat argumen tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'kata' }] });

    await ModelLema.cariLema('kata');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('cariLema memakai fallback saat limit atau offset bukan angka', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'kata' }] });

    await ModelLema.cariLema('kata', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('ambilLema mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilLema('tidak-ada');

    expect(result).toBeNull();
  });

  it('ambilLema mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, lema: 'kata' }] });

    const result = await ModelLema.ambilLema('kata');

    expect(result).toEqual({ id: 1, lema: 'kata' });
  });

  it('ambilMakna mengembalikan rows', async () => {
    const rows = [{ id: 1, makna: 'arti', kelas_kata: 'nomina' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilMakna(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM makna'), [1]);
    expect(result).toEqual(rows);
  });

  it('ambilContoh mengembalikan array kosong jika tidak ada ID', async () => {
    const result = await ModelLema.ambilContoh([]);

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilContoh mengembalikan rows', async () => {
    const rows = [{ id: 1, makna_id: 1, contoh: 'contoh kalimat' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilContoh([1]);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM contoh'), [[1]]);
    expect(result).toEqual(rows);
  });

  it('ambilSublema mengembalikan rows', async () => {
    const rows = [{ id: 2, lema: 'berkata', jenis: 'berimbuhan' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilSublema(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE induk = $1'), [1]);
    expect(result).toEqual(rows);
  });

  it('ambilInduk mengembalikan null jika indukId null', async () => {
    const result = await ModelLema.ambilInduk(null);

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilInduk mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, lema: 'induk', jenis: 'dasar' }] });

    const result = await ModelLema.ambilInduk(9);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [9]);
    expect(result).toEqual({ id: 9, lema: 'induk', jenis: 'dasar' });
  });

  it('ambilInduk mengembalikan null jika ID tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelLema.ambilInduk(10);

    expect(result).toBeNull();
  });

  it('ambilTerjemahan mengembalikan rows', async () => {
    const rows = [{ lemma: 'kata', translation: 'word' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilTerjemahan('kata');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM translation'), ['kata']);
    expect(result).toEqual(rows);
  });
});
