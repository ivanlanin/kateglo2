/**
 * @fileoverview Test ModelKomentar
 * @tested_in backend/models/modelKomentar.js
 */

const db = require('../../db');
const ModelKomentar = require('../../models/modelKomentar');
const { __private } = require('../../models/modelKomentar');

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

  it('hitungKomentarAktif memakai fallback 0 jika total kosong', async () => {
    db.query.mockResolvedValue({ rows: [{}] });

    const result = await ModelKomentar.hitungKomentarAktif('kosong');

    expect(result).toBe(0);
  });

  it('hitungTotal mengembalikan 0 jika hasil kosong', async () => {
    db.query.mockResolvedValue({ rows: [{}] });

    const result = await ModelKomentar.hitungTotal();

    expect(result).toBe(0);
    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM komentar_kamus');
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

  it('daftarAdmin memakai fallback limit/offset saat input tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelKomentar.daftarAdmin({ limit: 'x', offset: '-abc', q: '' });

    expect(result).toEqual({ data: [], total: 0 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('JOIN pengguna p ON p.id = k.pengguna_id'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('daftarAdmin menormalkan offset negatif menjadi 0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelKomentar.daftarAdmin({ limit: 10, offset: -1, q: '' });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [10, 0]);
  });

  it('daftarAdmin mengembalikan fallback saat limit kurang dari 1', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelKomentar.daftarAdmin({ limit: 0, offset: 0, q: '' });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('daftarAdmin dapat dipanggil tanpa argumen', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelKomentar.daftarAdmin();

    expect(result).toEqual({ data: [], total: 0 });
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
  });

  it('daftarAdmin menambahkan filter aktif=true saat aktif=1', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 31 }] });

    await ModelKomentar.daftarAdmin({ aktif: '1' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('k.aktif = TRUE'),
      []
    );
  });

  it('daftarAdmin menambahkan filter aktif=false saat aktif=0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 32 }] });

    await ModelKomentar.daftarAdmin({ aktif: '0' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('k.aktif = FALSE'),
      []
    );
  });

  it('daftarAdmin memakai fallback total 0 saat count kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelKomentar.daftarAdmin({ q: '' });

    expect(result.total).toBe(0);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelKomentar.ambilDenganId(999);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan data jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 10, komentar: 'ada' }] });

    const result = await ModelKomentar.ambilDenganId(10);

    expect(result).toEqual({ id: 10, komentar: 'ada' });
  });

  it('simpanAdmin memperbarui komentar + status aktif', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 8, komentar: 'baru', aktif: true }] });

    const result = await ModelKomentar.simpanAdmin({ id: 8, komentar: 'baru', aktif: 'true' });

    expect(result).toEqual({ id: 8, komentar: 'baru', aktif: true });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('UPDATE komentar_kamus'), ['baru', true, 8]);
  });

  it('simpanAdmin mengubah nilai aktif non-boolean sesuai normalisasi', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, aktif: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, aktif: true }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, aktif: false }] })
      .mockResolvedValueOnce({ rows: [{ id: 4, aktif: false }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelKomentar.simpanAdmin({ id: 1, komentar: 'a', aktif: 1 });
    await ModelKomentar.simpanAdmin({ id: 2, komentar: 'b', aktif: 'ya' });
    await ModelKomentar.simpanAdmin({ id: 3, komentar: 'c', aktif: 'tidak' });
    await ModelKomentar.simpanAdmin({ id: 4, komentar: 'd', aktif: 0 });
    const result = await ModelKomentar.simpanAdmin({ id: 5, komentar: 'e', aktif: null });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String), ['a', true, 1]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), ['b', true, 2]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.any(String), ['c', false, 3]);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.any(String), ['d', false, 4]);
    expect(db.query).toHaveBeenNthCalledWith(5, expect.any(String), ['e', false, 5]);
    expect(result).toBeNull();
  });

  it('upsertKomentarPengguna mengembalikan null jika RETURNING kosong', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelKomentar.upsertKomentarPengguna({
      indeks: 'uji',
      penggunaId: 1,
      komentar: 'tes',
    });

    expect(result).toBeNull();
  });

  it('helper private menormalkan angka dan boolean sesuai aturan', () => {
    expect(__private.parsePositiveInteger('20', 1)).toBe(20);
    expect(__private.parsePositiveInteger('0', 9)).toBe(9);
    expect(__private.parseNonNegativeInteger('8', 0)).toBe(8);
    expect(__private.parseNonNegativeInteger('-1', 7)).toBe(7);
    expect(__private.normalizeBoolean(true)).toBe(true);
    expect(__private.normalizeBoolean(1)).toBe(true);
    expect(__private.normalizeBoolean('YES')).toBe(true);
    expect(__private.normalizeBoolean({})).toBe(false);
  });
});
