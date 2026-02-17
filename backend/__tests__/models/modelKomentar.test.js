/**
 * @fileoverview Test ModelKomentar
 * @tested_in backend/models/modelKomentar.js
 */

const db = require('../../db');
const ModelKomentar = require('../../models/modelKomentar');

describe('ModelKomentar', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('hitungKomentarAktif mengembalikan angka', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '3' }] });

    const result = await ModelKomentar.hitungKomentarAktif('kata');

    expect(result).toBe(3);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('COUNT(*) AS total'), ['kata']);
  });

  it('ambilKomentarTerbaca mengembalikan daftar komentar aktif + milik user', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, komentar: 'uji' }] });

    const result = await ModelKomentar.ambilKomentarTerbaca('kata', 7);

    expect(result).toEqual([{ id: 1, komentar: 'uji' }]);
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('k.aktif = TRUE OR k.pengguna_id = $2'), ['kata', 7]);
  });

  it('upsertKomentarPengguna insert/update komentar user per indeks', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 2, komentar: 'isi', aktif: false }] });

    const result = await ModelKomentar.upsertKomentarPengguna({
      indeks: 'kata',
      penggunaId: 9,
      komentar: 'isi',
    });

    expect(result).toEqual({ id: 2, komentar: 'isi', aktif: false });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ON CONFLICT (indeks, pengguna_id) DO UPDATE SET'),
      ['kata', 9, 'isi']
    );
  });

  it('daftarAdmin mendukung query pencarian + pagination', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, indeks: 'kata' }] });

    const result = await ModelKomentar.daftarAdmin({ limit: 999, offset: -2, q: 'kata' });

    expect(result.total).toBe(1);
    expect(result.data).toHaveLength(1);
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('k.indeks ILIKE $1'), ['%kata%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%kata%', 200, 0]);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelKomentar.ambilDenganId(999);

    expect(result).toBeNull();
  });

  it('simpanAdmin memperbarui komentar + status aktif', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 8, komentar: 'baru', aktif: true }] });

    const result = await ModelKomentar.simpanAdmin({ id: 8, komentar: 'baru', aktif: 'true' });

    expect(result).toEqual({ id: 8, komentar: 'baru', aktif: true });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE komentar_kamus'), ['baru', true, 8]);
  });
});
