/**
 * @fileoverview Test ModelTesaurus
 * @tested_in backend/models/modelTesaurus.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const ModelTesaurus = require('../../models/modelTesaurus');

describe('ModelTesaurus', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['aktif']);

    const result = await ModelTesaurus.autocomplete('akt', 11);

    expect(autocomplete).toHaveBeenCalledWith('tesaurus', 'lema', 'akt', { limit: 11 });
    expect(result).toEqual(['aktif']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelTesaurus.autocomplete('akt');

    expect(autocomplete).toHaveBeenCalledWith('tesaurus', 'lema', 'akt', { limit: 8 });
  });

  it('cari mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelTesaurus.cari(' xyz ', 10, 0);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('cari menormalisasi query serta clamp limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif', sinonim: 'giat', antonim: 'pasif' }] });

    const result = await ModelTesaurus.cari(' aktif ', '999', -4);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['aktif', 'aktif%', '%aktif%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 200, 0]
    );
    expect(result.total).toBe(2);
    expect(result.data).toHaveLength(1);
  });

  it('cari memakai default limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif' }] });

    await ModelTesaurus.cari('aktif');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 100, 0]
    );
  });

  it('cari memakai fallback saat limit dan offset tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'aktif' }] });

    await ModelTesaurus.cari('aktif', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['aktif', 'aktif%', '%aktif%', 100, 0]
    );
  });

  it('ambilDetail mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, lema: 'aktif' }] });

    const result = await ModelTesaurus.ambilDetail('aktif');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE LOWER(lema) = LOWER($1)'), ['aktif']);
    expect(result).toEqual({ id: 9, lema: 'aktif' });
  });

  it('ambilDetail mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelTesaurus.ambilDetail('tidak-ada');

    expect(result).toBeNull();
  });
});
