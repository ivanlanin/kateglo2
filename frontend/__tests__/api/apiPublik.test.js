/**
 * @fileoverview Test API publik frontend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/api/klien', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

import klien from '../../src/api/klien';
import {
  ambilKategoriKamus,
  ambilEntriPerKategori,
  cariKamus,
  ambilDetailKamus,
  ambilKomentarKamus,
  simpanKomentarKamus,
  cariTesaurus,
  autocomplete,
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../src/api/apiPublik';

describe('apiPublik', () => {
  beforeEach(() => {
    klien.get.mockReset();
    klien.post.mockReset();
  });

  it('cariKamus mengirim params query + limit', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariKamus('kata', { limit: 10, offset: 5 });
    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/cari/kata', { params: { limit: 10, offset: 5 } });
  });

  it('ambilKategoriKamus dan ambilEntriPerKategori memanggil endpoint kategori', async () => {
    klien.get.mockResolvedValue({ data: { abjad: [] } });
    await ambilKategoriKamus();
    await ambilEntriPerKategori('kelas kata', 'n-1', { limit: 9, offset: 3 });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/kamus/kategori');
    expect(klien.get).toHaveBeenNthCalledWith(
      2,
      '/api/publik/kamus/kategori/kelas%20kata/n-1',
      { params: { limit: 9, offset: 3 } }
    );
  });

  it('ambilDetailKamus melakukan encode slug', async () => {
    klien.get.mockResolvedValue({ data: { frasa: 'anak' } });
    await ambilDetailKamus('anak ibu');
    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/detail/anak%20ibu');
  });

  it('ambilDetailKamus melempar error terformat saat 404', async () => {
    klien.get.mockRejectedValue({
      response: {
        status: 404,
        data: { saran: ['kata', 'kita'] },
      },
    });

    await expect(ambilDetailKamus('tidak ada')).rejects.toMatchObject({
      message: 'Entri tidak ditemukan',
      saran: ['kata', 'kita'],
    });
  });

  it('ambilDetailKamus memberi saran kosong saat 404 tanpa payload saran', async () => {
    klien.get.mockRejectedValue({
      response: {
        status: 404,
        data: {},
      },
    });

    await expect(ambilDetailKamus('tidak ada')).rejects.toMatchObject({
      message: 'Entri tidak ditemukan',
      saran: [],
    });
  });

  it('ambilDetailKamus meneruskan error non-404 apa adanya', async () => {
    const err = new Error('Jaringan bermasalah');
    err.response = { status: 500 };
    klien.get.mockRejectedValue(err);

    await expect(ambilDetailKamus('kata')).rejects.toBe(err);
  });

  it('cariGlosarium memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [], total: 0 } });
    await cariGlosarium('istilah');
    expect(klien.get).toHaveBeenCalledWith('/api/publik/glosarium/cari/istilah', {
      params: { limit: 100, offset: 0 },
    });
  });

  it('cariTesaurus memanggil endpoint sesuai kata', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariTesaurus('anak ibu', { limit: 50, offset: 10 });

    expect(klien.get).toHaveBeenCalledWith('/api/publik/tesaurus/cari/anak%20ibu', {
      params: { limit: 50, offset: 10 },
    });
  });

  it('ambilKomentarKamus dan simpanKomentarKamus memanggil endpoint komentar', async () => {
    klien.get.mockResolvedValue({ data: { success: true } });
    klien.post.mockResolvedValue({ data: { success: true } });

    await ambilKomentarKamus('kata dasar');
    await simpanKomentarKamus('kata dasar', 'komentar uji');

    expect(klien.get).toHaveBeenCalledWith('/api/publik/kamus/komentar/kata%20dasar');
    expect(klien.post).toHaveBeenCalledWith('/api/publik/kamus/komentar/kata%20dasar', {
      komentar: 'komentar uji',
    });
  });

  it('cariTesaurus memakai nilai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });

    await cariTesaurus('aktif');

    expect(klien.get).toHaveBeenCalledWith('/api/publik/tesaurus/cari/aktif', {
      params: { limit: 100, offset: 0 },
    });
  });

  it('autocomplete mengembalikan array kosong untuk kata kosong', async () => {
    const hasil = await autocomplete('kamus', '   ');
    expect(hasil).toEqual([]);
    expect(klien.get).not.toHaveBeenCalled();
  });

  it('autocomplete memanggil endpoint untuk 1 karakter', async () => {
    klien.get.mockResolvedValue({ data: { data: ['a'] } });

    const hasil = await autocomplete('kamus', 'a');

    expect(klien.get).toHaveBeenCalledWith(
      '/api/publik/kamus/autocomplete/a',
      expect.objectContaining({ params: expect.objectContaining({ _ac: expect.any(Number) }) })
    );
    expect(hasil).toEqual([{ value: 'a' }]);
  });

  it('autocomplete menormalkan item string dan object', async () => {
    klien.get.mockResolvedValue({
      data: {
        data: ['anak', { value: 'aneka', asing: 'varied' }],
      },
    });

    const hasil = await autocomplete('kamus', 'an');

    expect(klien.get).toHaveBeenCalledWith(
      '/api/publik/kamus/autocomplete/an',
      expect.objectContaining({ params: expect.objectContaining({ _ac: expect.any(Number) }) })
    );
    expect(hasil).toEqual([{ value: 'anak' }, { value: 'aneka', asing: 'varied' }]);
  });

  it('autocomplete memfilter item kosong, falsy, object tanpa value, dan object tanpa asing', async () => {
    klien.get.mockResolvedValue({
      data: {
        data: [
          '  ',             // string yang trim jadi kosong → null
          null,             // falsy → null
          42,               // non-object non-string → null
          { foo: 'bar' },   // object tanpa value field yg valid → null
          { value: 'kata' },// object dengan value tapi tanpa asing
        ],
      },
    });

    const hasil = await autocomplete('kamus', 'x');

    expect(hasil).toEqual([{ value: 'kata' }]);
  });

  it('autocomplete dengan kata null/undefined memakai fallback string kosong', async () => {
    const hasil1 = await autocomplete('kamus', null);
    const hasil2 = await autocomplete('kamus', undefined);
    expect(hasil1).toEqual([]);
    expect(hasil2).toEqual([]);
    expect(klien.get).not.toHaveBeenCalled();
  });

  it('autocomplete menangani response tanpa data array (fallback [])', async () => {
    klien.get.mockResolvedValue({ data: { data: 'bukan-array' } });

    const hasil = await autocomplete('kamus', 'tes');

    expect(hasil).toEqual([]);
  });

  it('ambilGlosariumPerBidang dan ambilGlosariumPerSumber memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await ambilGlosariumPerBidang('biologi');
    await ambilGlosariumPerSumber('kbbi');

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/glosarium/bidang/biologi', {
      params: { limit: 100, offset: 0 },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/glosarium/sumber/kbbi', {
      params: { limit: 100, offset: 0 },
    });
  });

  it('ambilDaftarBidang dan ambilDaftarSumber memanggil endpoint daftar', async () => {
    klien.get.mockResolvedValue({ data: [] });
    await ambilDaftarBidang();
    await ambilDaftarSumber();
    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/publik/glosarium/bidang');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/publik/glosarium/sumber');
  });

});
