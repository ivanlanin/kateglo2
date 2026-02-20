/**
 * @fileoverview Test ModelIzin
 * @tested_in backend/models/modelIzin.js
 */

const db = require('../../db');
const ModelIzin = require('../../models/modelIzin');

describe('ModelIzin', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.pool.connect.mockReset();
  });

  it('daftarIzin menghitung total dan mengambil data tanpa q', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'kelola_peran' }] });

    const result = await ModelIzin.daftarIzin({ limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM izin i'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [10, 1]);
    expect(result).toEqual({ data: [{ id: 1, kode: 'kelola_peran' }], total: 2 });
  });

  it('daftarIzin menerapkan q dan clamp limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelIzin.daftarIzin({ limit: 999, offset: -4, q: 'kelola' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE ('), ['%kelola%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%kelola%', 200, 0]);
  });

  it('daftarIzin memakai fallback default saat limit/offset tidak valid atau nol', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelIzin.daftarIzin({ limit: 0, offset: 'x' });
    await ModelIzin.daftarIzin();

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('ambilDenganId mengembalikan row atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 8, kode: 'kelola_peran' }] });
    db.query.mockResolvedValueOnce({ rows: [] });

    const found = await ModelIzin.ambilDenganId(8);
    const missing = await ModelIzin.ambilDenganId(999);

    expect(found).toEqual({ id: 8, kode: 'kelola_peran' });
    expect(missing).toBeNull();
  });

  it('daftarPeran mendukung query q dan default tanpa q', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kode: 'admin' }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, kode: 'editor' }] });

    const withQ = await ModelIzin.daftarPeran({ q: 'admin' });
    const withoutQ = await ModelIzin.daftarPeran();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE ('), ['%admin%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM peran p'), []);
    expect(withQ).toEqual([{ id: 1, kode: 'admin' }]);
    expect(withoutQ).toEqual([{ id: 2, kode: 'editor' }]);
  });

  it('simpan insert menormalisasi peran_ids, commit, dan mengembalikan data detail', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 11 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);
    jest.spyOn(ModelIzin, 'ambilDenganId').mockResolvedValue({ id: 11, kode: 'kelola_peran' });

    const result = await ModelIzin.simpan({
      kode: 'kelola_peran',
      nama: 'Kelola Peran',
      kelompok: 'redaksi',
      peran_ids: [1, 2, 2, 'x', -1],
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO izin'), ['kelola_peran', 'Kelola Peran', 'redaksi']);
    expect(client.query).toHaveBeenNthCalledWith(3, 'DELETE FROM peran_izin WHERE izin_id = $1', [11]);
    expect(client.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO peran_izin'), [[1, 2], 11]);
    expect(client.query).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(ModelIzin.ambilDenganId).toHaveBeenCalledWith(11);
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({ id: 11, kode: 'kelola_peran' });
  });

  it('simpan update dapat rollback dan return null jika tidak ada id hasil update', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);

    const result = await ModelIzin.simpan({
      id: 55,
      kode: 'kelola_peran',
      nama: 'Kelola Peran',
      kelompok: '',
      peran_ids: 'bukan-array',
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE izin'), ['kelola_peran', 'Kelola Peran', '', 55]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(client.release).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('simpan update berhasil tanpa peran_ids tetap commit dan tidak insert relasi', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 56 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);
    jest.spyOn(ModelIzin, 'ambilDenganId').mockResolvedValue({ id: 56, kode: 'lihat_statistik' });

    const result = await ModelIzin.simpan({
      id: 56,
      kode: 'lihat_statistik',
      nama: 'Lihat Statistik',
      kelompok: null,
      peran_ids: 'bukan-array',
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE izin'), ['lihat_statistik', 'Lihat Statistik', null, 56]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'DELETE FROM peran_izin WHERE izin_id = $1', [56]);
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO peran_izin'), expect.anything());
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({ id: 56, kode: 'lihat_statistik' });
  });

  it('simpan rollback dan throw saat query gagal', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('db error'))
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);

    await expect(ModelIzin.simpan({ kode: 'x', nama: 'X' })).rejects.toThrow('db error');

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
