/**
 * @fileoverview Test ModelPeran
 * @tested_in backend/models/modelPeran.js
 */

const db = require('../../db');
const ModelPeran = require('../../models/modelPeran');

describe('ModelPeran', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.pool.connect.mockReset();
  });

  it('daftarPeran menghitung total dan mengambil data tanpa filter q', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'admin' }] });

    const result = await ModelPeran.daftarPeran({ limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM peran p'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [10, 1]);
    expect(result).toEqual({ data: [{ id: 1, kode: 'admin' }], total: 2 });
  });

  it('daftarPeran menerapkan filter q serta clamp limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPeran.daftarPeran({ limit: 999, offset: -4, q: 'adm' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE ('), ['%adm%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%adm%', 200, 0]);
  });

  it('daftarPeran memakai fallback default saat limit/offset tidak valid atau nol', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPeran.daftarPeran({ limit: 0, offset: 'x' });
    await ModelPeran.daftarPeran();

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('ambilDenganId mengembalikan row atau null', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 8, kode: 'editor' }] });
    db.query.mockResolvedValueOnce({ rows: [] });

    const found = await ModelPeran.ambilDenganId(8);
    const missing = await ModelPeran.ambilDenganId(999);

    expect(found).toEqual({ id: 8, kode: 'editor' });
    expect(missing).toBeNull();
  });

  it('daftarIzin mendukung query q dan default tanpa q', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kode: 'kelola_peran' }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, kode: 'lihat_statistik' }] });

    const withQ = await ModelPeran.daftarIzin({ q: 'kelola' });
    const withoutQ = await ModelPeran.daftarIzin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE ('), ['%kelola%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM izin i'), []);
    expect(withQ).toEqual([{ id: 1, kode: 'kelola_peran' }]);
    expect(withoutQ).toEqual([{ id: 2, kode: 'lihat_statistik' }]);
  });

  it('simpan insert menormalisasi izin_ids, commit, dan mengembalikan data detail', async () => {
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
    jest.spyOn(ModelPeran, 'ambilDenganId').mockResolvedValue({ id: 11, kode: 'editor' });

    const result = await ModelPeran.simpan({
      kode: 'editor',
      nama: 'Editor',
      keterangan: 'Penyunting',
      akses_redaksi: 1,
      izin_ids: [1, 2, 2, 'x', -1],
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO peran'), ['editor', 'Editor', 'Penyunting', true]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'DELETE FROM peran_izin WHERE peran_id = $1', [11]);
    expect(client.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO peran_izin'), [11, [1, 2]]);
    expect(client.query).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(ModelPeran.ambilDenganId).toHaveBeenCalledWith(11);
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({ id: 11, kode: 'editor' });
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

    const result = await ModelPeran.simpan({
      id: 55,
      kode: 'editor',
      nama: 'Editor',
      keterangan: '',
      akses_redaksi: false,
      izin_ids: 'bukan-array',
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE peran'), ['editor', 'Editor', '', false, 55]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(client.release).toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('simpan update berhasil tanpa izin_ids tetap commit dan tidak insert relasi', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 56 }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);
    jest.spyOn(ModelPeran, 'ambilDenganId').mockResolvedValue({ id: 56, kode: 'operator' });

    const result = await ModelPeran.simpan({
      id: 56,
      kode: 'operator',
      nama: 'Operator',
      keterangan: null,
      akses_redaksi: 0,
      izin_ids: 'bukan-array',
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE peran'), ['operator', 'Operator', null, false, 56]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'DELETE FROM peran_izin WHERE peran_id = $1', [56]);
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.query).not.toHaveBeenCalledWith(expect.stringContaining('INSERT INTO peran_izin'), expect.anything());
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({ id: 56, kode: 'operator' });
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

    await expect(ModelPeran.simpan({ kode: 'x', nama: 'X' })).rejects.toThrow('db error');

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(client.release).toHaveBeenCalled();
  });
});
