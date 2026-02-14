/**
 * @fileoverview Test ModelLema
 * @tested_in backend/models/modelLema.js
 */

const db = require('../../db');
const ModelLema = require('../../models/modelLema');

describe('ModelLema', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('cariLema: hanya prefix jika hasil sudah cukup', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, lema: 'kata', jenis: 'dasar', lafal: null, jenis_rujuk: null, lema_rujuk: null }]
      })
      .mockResolvedValueOnce({
        rows: [{ lema_id: 1, makna: 'unit bahasa bermakna', kelas_kata: 'nomina' }]
      });

    const result = await ModelLema.cariLema('  kata  ', 1);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE lema ILIKE $1'),
      ['kata%', 'kata', 1]
    );
    expect(result[0].preview_makna).toBe('unit bahasa bermakna');
  });

  it('cariLema: prefix + contains saat hasil prefix kurang', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 1, lema: 'kata', jenis: 'dasar', lafal: null, jenis_rujuk: null, lema_rujuk: null }]
      })
      .mockResolvedValueOnce({
        rows: [{ id: 2, lema: 'perkataan', jenis: 'berimbuhan', lafal: null, jenis_rujuk: null, lema_rujuk: null }]
      })
      .mockResolvedValueOnce({
        rows: [
          { lema_id: 1, makna: 'def kata', kelas_kata: 'nomina' },
          { lema_id: 2, makna: 'def perkataan', kelas_kata: 'nomina' }
        ]
      });

    const result = await ModelLema.cariLema('kata', 2);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('AND lema NOT ILIKE $2'),
      ['%kata%', 'kata%', 1]
    );
    expect(result).toHaveLength(2);
    expect(result[1].preview_makna).toBe('def perkataan');
  });

  it('cariLema: mengembalikan array kosong jika tidak ada hasil', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelLema.cariLema('zzz', 10);

    expect(result).toEqual([]);
    expect(db.query).toHaveBeenCalledTimes(2);
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

  it('ambilTerjemahan mengembalikan rows', async () => {
    const rows = [{ lemma: 'kata', translation: 'word' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelLema.ambilTerjemahan('kata');

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM translation'), ['kata']);
    expect(result).toEqual(rows);
  });
});
