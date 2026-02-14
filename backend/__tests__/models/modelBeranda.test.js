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
      rows: [{ kamus: '10', glosarium: '2', tesaurus: '3' }]
    });

    const result = await ModelBeranda.ambilStatistik();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('SELECT'));
    expect(result).toEqual({
      kamus: 10,
      glosarium: 2,
      tesaurus: 3
    });
  });

  it('ambilLemaAcak mengembalikan rows dari query', async () => {
    const rows = [{ id: 1, lema: 'akar', kelas_kata: 'nomina' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelBeranda.ambilLemaAcak(7);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM lema'), [7]);
    expect(result).toEqual(rows);
  });

  it('ambilLemaAcak memakai default jumlah=10', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelBeranda.ambilLemaAcak();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM lema'), [10]);
  });

  it('ambilRujukan mengembalikan rows dari query', async () => {
    const rows = [{ lema: 'abadiat', lema_rujuk: 'abadiah' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelBeranda.ambilRujukan(5);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('lema_rujuk'), [5]);
    expect(result).toEqual(rows);
  });

  it('ambilRujukan memakai default jumlah=5', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelBeranda.ambilRujukan();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('lema_rujuk'), [5]);
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
