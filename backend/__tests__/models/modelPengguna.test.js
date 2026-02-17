/**
 * @fileoverview Test ModelPengguna
 * @tested_in backend/models/modelPengguna.js
 */

const db = require('../../db');
const ModelPengguna = require('../../models/modelPengguna');

describe('ModelPengguna', () => {
  beforeEach(() => {
    db.query.mockReset();
    delete process.env.ADMIN_EMAILS;
  });

  it('upsertDariGoogle menyimpan dan mengembalikan baris pengguna', async () => {
    const row = { id: 1, google_id: 'gid-1', surel: 'u@example.com' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelPengguna.upsertDariGoogle({
      googleId: 'gid-1',
      email: 'u@example.com',
      nama: 'User',
      foto: 'https://img/u.png',
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ON CONFLICT (google_id) DO UPDATE SET'), [
      'gid-1',
      'u@example.com',
      'User',
      'https://img/u.png',
    ]);
    expect(result).toEqual(row);
  });

  it('ambilKodePeran mengembalikan kode jika ada', async () => {
    db.query.mockResolvedValue({ rows: [{ kode: 'admin' }] });

    const result = await ModelPengguna.ambilKodePeran(2);

    expect(db.query).toHaveBeenCalledWith('SELECT kode FROM peran WHERE id = $1', [2]);
    expect(result).toBe('admin');
  });

  it('ambilKodePeran fallback ke pengguna jika data tidak ada', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelPengguna.ambilKodePeran(999);

    expect(result).toBe('pengguna');
  });

  it('ambilIzin mengembalikan daftar kode izin', async () => {
    db.query.mockResolvedValue({ rows: [{ kode: 'kelola_pengguna' }, { kode: 'kelola_peran' }] });

    const result = await ModelPengguna.ambilIzin(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN peran_izin pi ON pi.izin_id = i.id'), [1]);
    expect(result).toEqual(['kelola_pengguna', 'kelola_peran']);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelPengguna.ambilDenganId(123);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan data pengguna jika ditemukan', async () => {
    const row = { id: 10, surel: 'u@example.com', peran_kode: 'admin' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelPengguna.ambilDenganId(10);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('JOIN peran r ON r.id = p.peran_id'), [10]);
    expect(result).toEqual(row);
  });

  it('daftarPengguna menghitung total dan clamp limit/offset', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });

    const result = await ModelPengguna.daftarPengguna({ limit: 999, offset: -8 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [200, 0]);
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], total: 3 });
  });

  it('daftarPengguna memakai default saat nilai limit/offset tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPengguna.daftarPengguna({ limit: 'x', offset: 'y' });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 0]);
  });

  it('daftarPengguna memakai fallback default saat limit dan offset bernilai 0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPengguna.daftarPengguna({ limit: 0, offset: 0 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 0]);
  });

  it('daftarPengguna menormalkan limit minimum menjadi 1 saat limit negatif', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPengguna.daftarPengguna({ limit: -9, offset: -3 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [1, 0]);
  });

  it('daftarPengguna memakai default parameter object saat argumen tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPengguna.daftarPengguna();

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 0]);
  });

  it('daftarPengguna memakai default limit saat limit tidak disediakan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPengguna.daftarPengguna({ offset: 7 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 7]);
  });

  it('daftarPengguna memakai default offset saat offset tidak disediakan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelPengguna.daftarPengguna({ limit: 9 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [9, 0]);
  });

  it('ubahPeran mengembalikan null jika tidak ada baris terupdate', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelPengguna.ubahPeran(9, 3);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE pengguna SET peran_id = $1'), [3, 9]);
    expect(result).toBeNull();
  });

  it('ubahPeran mengembalikan pengguna terupdate jika ada', async () => {
    const row = { id: 9, peran_id: 1 };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelPengguna.ubahPeran(9, 1);

    expect(result).toEqual(row);
  });

  it('daftarPeran mengembalikan seluruh baris peran', async () => {
    const rows = [{ id: 1, kode: 'admin' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelPengguna.daftarPeran();

    expect(db.query).toHaveBeenCalledWith('SELECT id, kode, nama, keterangan FROM peran ORDER BY id');
    expect(result).toEqual(rows);
  });

  it('hitungTotal mengembalikan angka total pengguna', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '11' }] });

    const result = await ModelPengguna.hitungTotal();

    expect(result).toBe(11);
  });

  it('simpanPengguna mengembalikan null jika pengguna tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelPengguna.simpanPengguna(5, { nama: 'Baru', aktif: true, peran_id: 2 });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('COALESCE($1, nama)'), ['Baru', true, 2, 5]);
    expect(result).toBeNull();
  });

  it('simpanPengguna mengembalikan pengguna yang terupdate', async () => {
    const row = { id: 5, nama: 'Baru' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelPengguna.simpanPengguna(5, { nama: 'Baru' });

    expect(result).toEqual(row);
  });

  it('bootstrapAdmin mengembalikan pengguna apa adanya jika email bukan admin', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const pengguna = { id: 7, surel: 'user@example.com', peran_id: 2 };

    const result = await ModelPengguna.bootstrapAdmin(pengguna);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toBe(pengguna);
  });

  it('bootstrapAdmin mengembalikan pengguna apa adanya jika ADMIN_EMAILS tidak diatur', async () => {
    const pengguna = { id: 8, surel: 'admin@example.com', peran_id: 2 };

    const result = await ModelPengguna.bootstrapAdmin(pengguna);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toBe(pengguna);
  });

  it('bootstrapAdmin tidak update jika peran admin tidak ditemukan', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const pengguna = { id: 7, surel: 'admin@example.com', peran_id: 2 };
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelPengguna.bootstrapAdmin(pengguna);

    expect(db.query).toHaveBeenCalledWith('SELECT id FROM peran WHERE kode = $1', ['admin']);
    expect(result).toBe(pengguna);
    expect(result.peran_id).toBe(2);
  });

  it('bootstrapAdmin tidak update jika pengguna sudah admin', async () => {
    process.env.ADMIN_EMAILS = 'admin@example.com';
    const pengguna = { id: 7, surel: 'admin@example.com', peran_id: 1 };
    db.query.mockResolvedValue({ rows: [{ id: 1 }] });

    const result = await ModelPengguna.bootstrapAdmin(pengguna);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result.peran_id).toBe(1);
  });

  it('bootstrapAdmin update peran ke admin jika perlu', async () => {
    process.env.ADMIN_EMAILS = 'Admin@Example.com';
    const pengguna = { id: 9, surel: 'admin@example.com', peran_id: 2 };
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelPengguna.bootstrapAdmin(pengguna);

    expect(db.query).toHaveBeenNthCalledWith(2, 'UPDATE pengguna SET peran_id = $1 WHERE id = $2', [1, 9]);
    expect(result.peran_id).toBe(1);
  });
});
