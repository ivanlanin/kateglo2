/**
 * @fileoverview Test ModelTagar
 * @tested_in backend/models/master/modelTagar.js
 */

const db = require('../../../db');
const { encodeCursor } = require('../../../utils/cursorPagination');
const ModelTagar = require('../../../models/master/modelTagar');

describe('ModelTagar', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('ambilDaftarKategori, ambilSemuaTagar, ambilSemuaTagarRedaksi, ambilTagarEntri berjalan normal', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ kategori: 'bentuk' }, { kategori: null }, { kategori: '  ' }, { kategori: 'kelas' }] });
    await expect(ModelTagar.ambilDaftarKategori()).resolves.toEqual(['bentuk', 'kelas']);

    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kode: 'pref', nama: 'Prefiks', kategori: 'bentuk', urutan: 1 }] });
    await expect(ModelTagar.ambilSemuaTagar()).resolves.toEqual([{ id: 1, kode: 'pref', nama: 'Prefiks', kategori: 'bentuk', urutan: 1 }]);

    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kode: 'pref', nama: 'Prefiks', kategori: 'bentuk', urutan: 1, aktif: true }] });
    await expect(ModelTagar.ambilSemuaTagarRedaksi()).resolves.toEqual([{ id: 1, kode: 'pref', nama: 'Prefiks', kategori: 'bentuk', urutan: 1, aktif: true }]);

    db.query.mockResolvedValueOnce({ rows: [{ id: 2, kode: 'inf', aktif: true }] });
    await ModelTagar.ambilTagarEntri(9, { aktifSaja: true });
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('AND t.aktif = TRUE'), [9]);

    db.query.mockResolvedValueOnce({ rows: [] });
    await ModelTagar.ambilTagarEntri(9);
    expect(db.query).toHaveBeenNthCalledWith(5, expect.not.stringContaining('AND t.aktif = TRUE'), [9]);
  });

  it('cariEntriPerTagar return awal saat tagar tidak ditemukan atau total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelTagar.cariEntriPerTagar('x')).resolves.toEqual({
      data: [], total: 0, tagar: null, hasNext: false, hasPrev: false, nextCursor: null, prevCursor: null,
    });

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, kode: 'x', nama: 'X', kategori: 'bentuk' }] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });
    await expect(ModelTagar.cariEntriPerTagar('x')).resolves.toEqual({
      data: [],
      total: 0,
      tagar: { id: 10, kode: 'x', nama: 'X', kategori: 'bentuk' },
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('cariEntriPerTagar mendukung mode next/prev/lastPage', async () => {
    const cursor = encodeCursor({ entri: 'beta', id: 20 });
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, kode: 'x', nama: 'X', kategori: 'bentuk' }] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 21, entri: 'delta', indeks: 'delta', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
          { id: 22, entri: 'ekor', indeks: 'ekor', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
          { id: 23, entri: 'fajar', indeks: 'fajar', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
        ],
      });

    const resultNext = await ModelTagar.cariEntriPerTagar('x', { limit: 2, cursor, direction: 'next', hitungTotal: true });
    expect(resultNext.data).toHaveLength(2);
    expect(resultNext.hasPrev).toBe(true);
    expect(resultNext.hasNext).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, kode: 'x', nama: 'X', kategori: 'bentuk' }] })
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, entri: 'awal' }] });
    const resultPrev = await ModelTagar.cariEntriPerTagar('x', { limit: 2, cursor, direction: 'prev', hitungTotal: true });
    expect(resultPrev.hasPrev).toBe(false);
    expect(resultPrev.hasNext).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, kode: 'x', nama: 'X', kategori: 'bentuk' }] })
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, entri: 'omega' }] });
    const resultLast = await ModelTagar.cariEntriPerTagar('x', { limit: 2, lastPage: true, hitungTotal: true });
    expect(resultLast.hasNext).toBe(false);
    expect(resultLast.hasPrev).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, kode: 'x', nama: 'X', kategori: 'bentuk' }] })
      .mockResolvedValueOnce({ rows: [] });
    const resultNoTotal = await ModelTagar.cariEntriPerTagar('x', {
      limit: 0,
      cursor: encodeCursor({}),
      direction: 'next',
      hitungTotal: false,
    });
    expect(resultNoTotal.total).toBe(0);
    expect(resultNoTotal.prevCursor).toBeNull();
    expect(resultNoTotal.nextCursor).toBeNull();
  });

  it('daftarAdminCursor menangani total 0 dan pagination lengkap', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    await expect(ModelTagar.daftarAdminCursor()).resolves.toEqual({
      data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null,
    });

    const cursor = encodeCursor({ kategori: 'bentuk', urutan: 1, nama: 'Prefiks', id: 7 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 8, kode: 'in', nama: 'Infiks', kategori: 'bentuk', deskripsi: '', urutan: 2, aktif: true, jumlah_entri: 2 },
          { id: 9, kode: 'su', nama: 'Sufiks', kategori: 'bentuk', deskripsi: '', urutan: 3, aktif: true, jumlah_entri: 1 },
          { id: 10, kode: 'ko', nama: 'Konfiks', kategori: 'bentuk', deskripsi: '', urutan: 4, aktif: true, jumlah_entri: 1 },
        ],
      });
    const next = await ModelTagar.daftarAdminCursor({ limit: 2, cursor, direction: 'next', q: 'fi', kategori: 'bentuk', aktif: '1' });
    expect(next.data).toHaveLength(2);
    expect(next.hasPrev).toBe(true);
    expect(next.hasNext).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 6, kode: 'pr', nama: 'Prefiks', kategori: 'bentuk', deskripsi: '', urutan: 1, aktif: true, jumlah_entri: 2 }] });
    const prev = await ModelTagar.daftarAdminCursor({ limit: 2, cursor, direction: 'prev' });
    expect(prev.hasPrev).toBe(false);
    expect(prev.hasNext).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{ id: 12, kode: 'x', nama: 'X', kategori: 'kelas', deskripsi: '', urutan: 1, aktif: true, jumlah_entri: 0 }] });
    const last = await ModelTagar.daftarAdminCursor({ lastPage: true, limit: 2 });
    expect(last.hasNext).toBe(false);
    expect(last.hasPrev).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 13, kode: 'zz', nama: 'Z', kategori: 'kelas', deskripsi: null, urutan: 1, aktif: false, jumlah_entri: 0 }] });
    await ModelTagar.daftarAdminCursor({ aktif: '0', limit: 10 });
    expect(db.query).toHaveBeenNthCalledWith(8, expect.stringContaining('aktif = FALSE'), []);
  });

  it('ambilDenganId dan hitungCakupan mengembalikan data ter-parse', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kode: 'x' }] });
    await expect(ModelTagar.ambilDenganId(1)).resolves.toEqual({ id: 1, kode: 'x' });

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelTagar.ambilDenganId(2)).resolves.toBeNull();

    db.query.mockResolvedValueOnce({ rows: [{ total_turunan: '12', sudah_bertagar: '4' }] });
    await expect(ModelTagar.hitungCakupan()).resolves.toEqual({ total_turunan: 12, sudah_bertagar: 4 });
  });

  it('hitungTotal dan hitungTotalBelumBertagar mengembalikan nilai aman', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '15' }] });
    await expect(ModelTagar.hitungTotal()).resolves.toBe(15);

    db.query.mockResolvedValueOnce({ rows: [{ total_turunan: '12', sudah_bertagar: '4' }] });
    await expect(ModelTagar.hitungTotalBelumBertagar()).resolves.toBe(8);

    db.query.mockResolvedValueOnce({ rows: [{ total_turunan: null, sudah_bertagar: null }] });
    await expect(ModelTagar.hitungTotalBelumBertagar()).resolves.toBe(0);

    db.query.mockResolvedValueOnce({ rows: [{ total_turunan: '2', sudah_bertagar: '9' }] });
    await expect(ModelTagar.hitungTotalBelumBertagar()).resolves.toBe(0);
  });

  it('daftarEntriTagarAdminCursor mencakup filter, cursor, prev, dan lastPage', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });
    await expect(ModelTagar.daftarEntriTagarAdminCursor()).resolves.toEqual({
      data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null,
    });

    const cursor = encodeCursor({ entri: 'beta', id: 20 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 21, entri: 'delta', indeks: 'delta', jenis: 'turunan', induk_entri: 'kata', tagar: [], jumlah_tagar: 0 },
          { id: 22, entri: 'ekor', indeks: 'ekor', jenis: 'turunan', induk_entri: 'kata', tagar: [], jumlah_tagar: 1 },
          { id: 23, entri: 'fajar', indeks: 'fajar', jenis: 'turunan', induk_entri: 'kata', tagar: [], jumlah_tagar: 2 },
        ],
      });
    const next = await ModelTagar.daftarEntriTagarAdminCursor({ limit: 2, cursor, direction: 'next', q: 'ka', tagarId: 7, jenis: 'turunan', punyaTagar: '1' });
    expect(next.data).toHaveLength(2);
    expect(next.hasPrev).toBe(true);
    expect(next.hasNext).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, entri: 'awal', indeks: 'awal', jenis: 'dasar', induk_entri: null, tagar: [], jumlah_tagar: 0 }] });
    const prev = await ModelTagar.daftarEntriTagarAdminCursor({ limit: 2, cursor, direction: 'prev', punyaTagar: '0' });
    expect(prev.hasPrev).toBe(false);
    expect(prev.hasNext).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, entri: 'zzz', indeks: 'zzz', jenis: 'dasar', induk_entri: null, tagar: [], jumlah_tagar: 0 }] });
    const last = await ModelTagar.daftarEntriTagarAdminCursor({ lastPage: true, limit: 2 });
    expect(last.hasNext).toBe(false);
    expect(last.hasPrev).toBe(true);

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });
    const limitFallback = await ModelTagar.daftarEntriTagarAdminCursor({ limit: 0, cursor: encodeCursor({}), direction: 'next' });
    expect(limitFallback.data).toEqual([]);
  });

  it('simpan, hapus, dan simpanTagarEntri (commit/rollback) berjalan sesuai cabang', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 3, kode: 'x' }] });
    await expect(ModelTagar.simpan({ id: 3, kode: 'x', nama: 'X', kategori: 'bentuk', deskripsi: '', urutan: 0, aktif: '1' })).resolves.toEqual({ id: 3, kode: 'x' });

    db.query.mockResolvedValueOnce({ rows: [{ id: 4, kode: 'y' }] });
    await expect(ModelTagar.simpan({ kode: 'y', nama: 'Y', kategori: 'bentuk', deskripsi: null, urutan: 5, aktif: false })).resolves.toEqual({ id: 4, kode: 'y' });

    db.query.mockResolvedValueOnce({ rowCount: 1 });
    await expect(ModelTagar.hapus(4)).resolves.toBe(true);
    db.query.mockResolvedValueOnce({ rowCount: 0 });
    await expect(ModelTagar.hapus(5)).resolves.toBe(false);

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    await ModelTagar.simpanTagarEntri(11, []);
    expect(db.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(db.query).toHaveBeenNthCalledWith(2, 'DELETE FROM entri_tagar WHERE entri_id = $1', [11]);
    expect(db.query).toHaveBeenNthCalledWith(3, 'COMMIT');

    db.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    await ModelTagar.simpanTagarEntri(12, [1, '2', 'x']);
    expect(db.query).toHaveBeenNthCalledWith(6, expect.stringContaining('INSERT INTO entri_tagar'), [12, [1, 2]]);

    db.query
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce(new Error('hapus gagal'))
      .mockResolvedValueOnce({});
    await expect(ModelTagar.simpanTagarEntri(13, [1])).rejects.toThrow('hapus gagal');
    expect(db.query).toHaveBeenNthCalledWith(10, 'ROLLBACK');
  });

  it('edge case cursor dan hasil kosong menutup cabang fallback nilai', async () => {
    const emptyCursor = encodeCursor({});

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });
    const adminKosong = await ModelTagar.daftarAdminCursor({ cursor: emptyCursor, direction: 'next', limit: 2 });
    expect(adminKosong.prevCursor).toBeNull();
    expect(adminKosong.nextCursor).toBeNull();

    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });
    const auditKosong = await ModelTagar.daftarEntriTagarAdminCursor({ cursor: emptyCursor, direction: 'next', limit: 2 });
    expect(auditKosong.prevCursor).toBeNull();
    expect(auditKosong.nextCursor).toBeNull();

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelTagar.simpan({ id: 55, kode: 'x', nama: 'X', kategori: 'bentuk', deskripsi: null, urutan: 1, aktif: true })).resolves.toBeNull();

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    await ModelTagar.simpanTagarEntri(77, [null, undefined, 'x', 5]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO entri_tagar'), [77, [5]]);
  });

  it('edge case default parameter dan fallback filter admin/tagar entri', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'a', nama: 'A', kategori: 'k', deskripsi: null, urutan: 1, aktif: true, jumlah_entri: 0 }] });

    await ModelTagar.daftarAdminCursor({ aktif: 'x', limit: 0 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) AS total FROM tagar'), []);

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    await ModelTagar.simpanTagarEntri(88);
    expect(db.query).toHaveBeenCalledTimes(3);
    expect(db.query).toHaveBeenNthCalledWith(2, 'DELETE FROM entri_tagar WHERE entri_id = $1', [88]);

    db.query.mockReset();
    db.query
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({});
    await ModelTagar.simpanTagarEntri(89, null);
    expect(db.query).toHaveBeenCalledTimes(3);
    expect(db.query).toHaveBeenNthCalledWith(3, 'COMMIT');
  });
});



