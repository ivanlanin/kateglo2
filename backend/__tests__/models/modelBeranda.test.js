/**
 * @fileoverview Test ModelBeranda
 * @tested_in backend/models/modelBeranda.js
 */

const db = require('../../db');
const ModelBeranda = require('../../models/modelBeranda');

describe('ModelBeranda', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('ambilStatistik mengubah nilai count string menjadi number', async () => {
    db.query.mockResolvedValue({
      rows: [{ kamus: '10', glosarium: '2', peribahasa: '3', singkatan: '4' }]
    });

    const result = await ModelBeranda.ambilStatistik();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(result).toEqual({
      kamus: 10,
      glosarium: 2,
      peribahasa: 3,
      singkatan: 4
    });
  });

  it('ambilLemaAcak mengembalikan rows dari query', async () => {
    const rows = [{ phrase: 'akar', lex_class: 'n' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelBeranda.ambilLemaAcak(7);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM phrase'), [7]);
    expect(result).toEqual(rows);
  });

  it('ambilLemaAcak memakai default jumlah=10', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelBeranda.ambilLemaAcak();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM phrase'), [10]);
  });

  it('ambilSalahEja mengembalikan rows dari query', async () => {
    const rows = [{ phrase: 'aktip', actual_phrase: 'aktif' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelBeranda.ambilSalahEja(5);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('actual_phrase'), [5]);
    expect(result).toEqual(rows);
  });

  it('ambilSalahEja memakai default jumlah=5', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelBeranda.ambilSalahEja();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('actual_phrase'), [5]);
  });

  it('ambilPopuler mengembalikan rows dari query', async () => {
    const rows = [{ phrase: 'kata', search_count: 99 }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelBeranda.ambilPopuler(3);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM searched_phrase'), [3]);
    expect(result).toEqual(rows);
  });

  it('ambilPopuler memakai default jumlah=5', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelBeranda.ambilPopuler();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM searched_phrase'), [5]);
  });
});
