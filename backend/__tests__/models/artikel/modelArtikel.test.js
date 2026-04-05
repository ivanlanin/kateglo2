/**
 * @fileoverview Test model artikel editorial
 * @tested_in backend/models/artikel/modelArtikel.js
 */

const db = require('../../../db');
const ModelArtikel = require('../../../models/artikel/modelArtikel');

describe('models/artikel/modelArtikel', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
    db.query.mockReset();
    db.pool.connect.mockReset();
  });

  it('hitungTotal mengembalikan jumlah artikel', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: 4 }] });

    await expect(ModelArtikel.hitungTotal()).resolves.toBe(4);
    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*)::int AS total FROM artikel');
  });

  it('hitungTotal fallback ke 0 saat baris kosong', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await expect(ModelArtikel.hitungTotal()).resolves.toBe(0);
  });

  it('query pembacaan topik memakai urutan simpan, bukan abjad', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, topik: ['zeta', 'alpha'] }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, topik: ['kedua', 'pertama'] }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, topik: ['zeta', 'alpha'] }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 4, topik: ['kedua', 'pertama'] }] });

    await expect(ModelArtikel.ambilDaftarPublik({ limit: 5, offset: 0 })).resolves.toEqual({
      data: [{ id: 1, topik: ['zeta', 'alpha'] }],
      total: 1,
    });
    await expect(ModelArtikel.ambilSatuPublik('slug-uji')).resolves.toEqual({ id: 2, topik: ['kedua', 'pertama'] });
    await expect(ModelArtikel.ambilDaftarRedaksi({ limit: 5, offset: 0 })).resolves.toEqual({
      data: [{ id: 3, topik: ['zeta', 'alpha'] }],
      total: 1,
    });
    await expect(ModelArtikel.ambilSatuRedaksi(4)).resolves.toEqual({ id: 4, topik: ['kedua', 'pertama'] });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('array_agg(at2.topik ORDER BY at2.ctid)'), [5, 0]);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('array_agg(at2.topik ORDER BY at2.ctid)'), ['slug-uji']);
    expect(db.query).toHaveBeenNthCalledWith(4, expect.stringContaining('array_agg(at2.topik ORDER BY at2.ctid)'), [5, 0]);
    expect(db.query).toHaveBeenNthCalledWith(6, expect.stringContaining('array_agg(at2.topik ORDER BY at2.ctid)'), [4]);
  });

  it('buat mempertahankan urutan topik input sambil menghapus duplikat', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 11, judul: 'Judul Uji', slug: 'judul-uji', konten: '', diterbitkan: false, diterbitkan_pada: null, created_at: 'x', updated_at: 'x' }] })
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);
    jest.spyOn(ModelArtikel, 'buatSlug').mockResolvedValue('judul-uji');

    const result = await ModelArtikel.buat({
      judul: 'Judul Uji',
      konten: '',
      topik: ['zeta', 'alpha', 'zeta', 'beta'],
      penulis_id: 7,
      diterbitkan: false,
      diterbitkan_pada: null,
    });

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO artikel_topik'), [11, ['zeta', 'alpha', 'beta']]);
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
    expect(result.topik).toEqual(['zeta', 'alpha', 'beta']);
  });

  it('perbarui mempertahankan urutan topik input sambil menghapus duplikat', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValue({ id: 21, topik: ['kedua', 'pertama', 'ketiga'] });

    const result = await ModelArtikel.perbarui(21, {
      topik: ['kedua', 'pertama', 'kedua', 'ketiga'],
    }, 7);

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE artikel SET penyunting_id = $1'), [7, 21]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'DELETE FROM artikel_topik WHERE artikel_id = $1', [21]);
    expect(client.query).toHaveBeenNthCalledWith(4, expect.stringContaining('INSERT INTO artikel_topik'), [21, ['kedua', 'pertama', 'ketiga']]);
    expect(client.query).toHaveBeenNthCalledWith(5, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
    expect(result).toEqual({ id: 21, topik: ['kedua', 'pertama', 'ketiga'] });
  });

  it('buatSlug menghasilkan basis slug, suffix unik, dan menghormati excludeId', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ slug: 'artikel' }, { slug: 'artikel-2' }] })
      .mockResolvedValueOnce({ rows: [{ slug: 'judul-uji' }] });

    await expect(ModelArtikel.buatSlug('Judul Uji')).resolves.toBe('judul-uji');
    await expect(ModelArtikel.buatSlug('!!!')).resolves.toBe('artikel-3');
    await expect(ModelArtikel.buatSlug('Judul Uji', { excludeId: 9 })).resolves.toBe('judul-uji-2');

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('ORDER BY slug'), ['judul-uji', 'judul-uji-%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), ['artikel', 'artikel-%']);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('AND id <> $3'), ['judul-uji', 'judul-uji-%', 9]);
  });

  it('ambilDaftarPublik membangun query dengan filter q dan topik', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, slug: 'artikel-satu' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const hasil = await ModelArtikel.ambilDaftarPublik({ topik: ['bahasa', 'sastra'], q: 'uji', limit: 10, offset: 4 });

    expect(hasil).toEqual({ data: [{ id: 1, slug: 'artikel-satu' }], total: 1 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('a.judul ILIKE $1 OR a.konten ILIKE $1'), ['%uji%', ['bahasa', 'sastra'], 10, 4]);
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('at2.topik = ANY($2)'), ['%uji%', ['bahasa', 'sastra'], 10, 4]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('SELECT COUNT(*) FROM artikel a WHERE a.diterbitkan = true'), ['%uji%', ['bahasa', 'sastra']]);
  });

  it('ambilDaftarPublik menangani filter topik tunggal tanpa query', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, slug: 'bahasa' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    const hasil = await ModelArtikel.ambilDaftarPublik({ topik: 'bahasa', limit: 2, offset: 1 });

    expect(hasil).toEqual({ data: [{ id: 10, slug: 'bahasa' }], total: 1 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('at2.topik = ANY($1)'), [['bahasa'], 2, 1]);
  });

  it('ambilDaftarPublik memakai parameter bawaan saat dipanggil tanpa argumen', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    await expect(ModelArtikel.ambilDaftarPublik({})).resolves.toEqual({ data: [], total: 0 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE a.diterbitkan = true'), [20, 0]);
  });

  it('ambilSatuPublik, ambilTopikPublik, dan ambilDaftarRedaksi menangani hasil null dan filter status', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ topik: 'bahasa', jumlah: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, slug: 'terbit' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, slug: 'draf' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await expect(ModelArtikel.ambilSatuPublik('tidak-ada')).resolves.toBeNull();
    await expect(ModelArtikel.ambilTopikPublik()).resolves.toEqual([{ topik: 'bahasa', jumlah: '2' }]);
    await expect(ModelArtikel.ambilDaftarRedaksi({ q: 'uji', diterbitkan: 'true', topik: 'bahasa', limit: 5, offset: 1 })).resolves.toEqual({
      data: [{ id: 2, slug: 'terbit' }],
      total: 1,
    });
    await expect(ModelArtikel.ambilDaftarRedaksi({ diterbitkan: false, limit: 3, offset: 0 })).resolves.toEqual({
      data: [{ id: 3, slug: 'draf' }],
      total: 1,
    });

    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('a.diterbitkan = true'), ['%uji%', ['bahasa'], 5, 1]);
    expect(db.query).toHaveBeenNthCalledWith(5, expect.stringContaining('a.diterbitkan = false'), [3, 0]);
  });

  it('ambilDaftarRedaksi dan ambilSatuRedaksi menangani tanpa filter dan null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 12, slug: 'semua' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(ModelArtikel.ambilDaftarRedaksi({ limit: 2, offset: 0 })).resolves.toEqual({
      data: [{ id: 12, slug: 'semua' }],
      total: 1,
    });
    await expect(ModelArtikel.ambilSatuRedaksi(999)).resolves.toBeNull();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('LEFT JOIN pengguna pn ON pn.id = a.penyunting_id'), [2, 0]);
    expect(db.query.mock.calls[0][0]).not.toContain('WHERE (a.judul');
  });

  it('ambilDaftarRedaksi memakai parameter bawaan saat dipanggil tanpa argumen', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ count: '0' }] });

    await expect(ModelArtikel.ambilDaftarRedaksi({})).resolves.toEqual({ data: [], total: 0 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('ORDER BY a.diterbitkan_pada DESC NULLS LAST'), [50, 0]);
  });

  it('ambilDaftarRedaksi menangani filter topik array', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 14, slug: 'array-topik' }] })
      .mockResolvedValueOnce({ rows: [{ count: '1' }] });

    await expect(ModelArtikel.ambilDaftarRedaksi({ topik: ['bahasa', 'sastra'], limit: 4, offset: 0 })).resolves.toEqual({
      data: [{ id: 14, slug: 'array-topik' }],
      total: 1,
    });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('at2.topik = ANY($1)'), [['bahasa', 'sastra'], 4, 0]);
  });

  it('buat menangani topik kosong dan rollback saat query gagal', async () => {
    const successClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({ rows: [{ id: 30, judul: 'Baru', slug: 'baru', konten: '', diterbitkan: true, diterbitkan_pada: '2026-04-05', created_at: 'x', updated_at: 'y' }] })
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(successClient);
    jest.spyOn(ModelArtikel, 'buatSlug').mockResolvedValueOnce('baru');

    const hasil = await ModelArtikel.buat({
      judul: 'Baru',
      konten: '',
      topik: [],
      penulis_id: 7,
      diterbitkan: true,
      diterbitkan_pada: '2026-04-05',
    });

    expect(hasil).toEqual(expect.objectContaining({ id: 30, slug: 'baru', topik: [] }));
    expect(successClient.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(successClient.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(successClient.release).toHaveBeenCalled();

    const failingClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('insert gagal'))
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(failingClient);
    jest.spyOn(ModelArtikel, 'buatSlug').mockResolvedValueOnce('gagal');

    await expect(ModelArtikel.buat({ judul: 'Gagal', penulis_id: 1 })).rejects.toThrow('insert gagal');
    expect(failingClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(failingClient.release).toHaveBeenCalled();
  });

  it('perbarui menangani tanpa perubahan, update penuh tanpa insert topik, dan rollback', async () => {
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValueOnce({ id: 41, judul: 'Tetap' });

    await expect(ModelArtikel.perbarui(41, {}, undefined)).resolves.toEqual({ id: 41, judul: 'Tetap' });

    const updateClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(updateClient);
    jest.spyOn(ModelArtikel, 'buatSlug').mockResolvedValueOnce('judul-baru');
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValueOnce({ id: 42, slug: 'judul-baru', topik: [] });

    const updated = await ModelArtikel.perbarui(42, {
      judul: 'Judul Baru',
      konten: 'Konten Baru',
      topik: ['', '  '],
      penyunting_id: null,
      penulis_id: 13,
      diterbitkan_pada: '',
    }, 9);

    expect(updated).toEqual({ id: 42, slug: 'judul-baru', topik: [] });
    expect(updateClient.query).toHaveBeenNthCalledWith(2, expect.stringContaining('judul = $1, slug = $2, konten = $3, penulis_id = $4, penyunting_id = $5, diterbitkan_pada = $6'), [
      'Judul Baru',
      'judul-baru',
      'Konten Baru',
      13,
      null,
      null,
      42,
    ]);
    expect(updateClient.query).toHaveBeenNthCalledWith(3, 'DELETE FROM artikel_topik WHERE artikel_id = $1', [42]);
    expect(updateClient.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(updateClient.release).toHaveBeenCalled();

    const rollbackClient = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('update gagal'))
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(rollbackClient);
    jest.spyOn(ModelArtikel, 'buatSlug').mockResolvedValueOnce('judul-gagal');

    await expect(ModelArtikel.perbarui(43, { judul: 'Judul Gagal' }, 9)).rejects.toThrow('update gagal');
    expect(rollbackClient.query).toHaveBeenNthCalledWith(3, 'ROLLBACK');
    expect(rollbackClient.release).toHaveBeenCalled();
  });

  it('perbarui menangani pembaruan topik saja tanpa UPDATE utama', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(client);
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValueOnce({ id: 55, topik: ['bahasa'] });

    const hasil = await ModelArtikel.perbarui(55, { topik: ' bahasa ' }, undefined);

    expect(hasil).toEqual({ id: 55, topik: ['bahasa'] });
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'DELETE FROM artikel_topik WHERE artikel_id = $1', [55]);
    expect(client.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO artikel_topik'), [55, ['bahasa']]);
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('perbarui menangani update utama tanpa perubahan topik', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(client);
    jest.spyOn(ModelArtikel, 'buatSlug').mockResolvedValueOnce('judul-tanpa-topik');
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValueOnce({ id: 58, slug: 'judul-tanpa-topik' });

    const hasil = await ModelArtikel.perbarui(58, { judul: 'Judul Tanpa Topik' }, 9);

    expect(hasil).toEqual({ id: 58, slug: 'judul-tanpa-topik' });
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, expect.stringContaining('UPDATE artikel SET judul = $1, slug = $2, penyunting_id = $3 WHERE id = $4'), [
      'Judul Tanpa Topik',
      'judul-tanpa-topik',
      9,
      58,
    ]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('perbarui menangani topik null sebagai daftar kosong tanpa insert ulang', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(client);
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValueOnce({ id: 56, topik: [] });

    const hasil = await ModelArtikel.perbarui(56, { topik: null }, undefined);

    expect(hasil).toEqual({ id: 56, topik: [] });
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'DELETE FROM artikel_topik WHERE artikel_id = $1', [56]);
    expect(client.query).toHaveBeenNthCalledWith(3, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('perbarui menangani topik array murni tanpa UPDATE utama', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValueOnce(client);
    jest.spyOn(ModelArtikel, 'ambilSatuRedaksi').mockResolvedValueOnce({ id: 57, topik: ['satu', 'dua'] });

    const hasil = await ModelArtikel.perbarui(57, { topik: ['satu', 'dua'] }, undefined);

    expect(hasil).toEqual({ id: 57, topik: ['satu', 'dua'] });
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN');
    expect(client.query).toHaveBeenNthCalledWith(2, 'DELETE FROM artikel_topik WHERE artikel_id = $1', [57]);
    expect(client.query).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO artikel_topik'), [57, ['satu', 'dua']]);
    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT');
    expect(client.release).toHaveBeenCalled();
  });

  it('terbitkan, hapus, dan ambilSlugTerbit menjalankan query yang sesuai', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 50, slug: 'slug-satu' }] })
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce({ rows: [{ slug: 'satu' }, { slug: 'dua' }] });

    await expect(ModelArtikel.terbitkan(50, false)).resolves.toEqual({ id: 50, slug: 'slug-satu' });
    await expect(ModelArtikel.hapus(50)).resolves.toBeUndefined();
    await expect(ModelArtikel.ambilSlugTerbit()).resolves.toEqual(['satu', 'dua']);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SET diterbitkan = $1'), [false, 50]);
    expect(db.query).toHaveBeenNthCalledWith(3, 'DELETE FROM artikel WHERE id = $1', [50]);
    expect(db.query).toHaveBeenNthCalledWith(4, 'SELECT slug FROM artikel WHERE diterbitkan = true ORDER BY diterbitkan_pada DESC');
  });
});