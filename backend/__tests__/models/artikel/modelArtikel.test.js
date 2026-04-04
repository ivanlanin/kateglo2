/**
 * @fileoverview Test model artikel editorial
 * @tested_in backend/models/artikel/modelArtikel.js
 */

const db = require('../../../db');
const ModelArtikel = require('../../../models/artikel/modelArtikel');

describe('models/artikel/modelArtikel', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.pool.connect.mockReset();
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
});