/**
 * @fileoverview Test API publik frontend
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../src/api/klien', () => ({
  default: {
    get: vi.fn(),
  },
}));

import klien from '../../src/api/klien';
import {
  ambilDataBeranda,
  ambilKategoriKamus,
  ambilLemaPerKategori,
  cariKamus,
  ambilDetailKamus,
  cariTesaurus,
  ambilDetailTesaurus,
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
  });

  it('ambilDataBeranda memanggil endpoint yang benar', async () => {
    klien.get.mockResolvedValue({ data: { statistik: {} } });
    const result = await ambilDataBeranda();
    expect(klien.get).toHaveBeenCalledWith('/api/public/beranda');
    expect(result).toEqual({ statistik: {} });
  });

  it('cariKamus mengirim params query + limit', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariKamus('kata', { limit: 10, offset: 5 });
    expect(klien.get).toHaveBeenCalledWith('/api/public/kamus/cari/kata', { params: { limit: 10, offset: 5 } });
  });

  it('ambilKategoriKamus dan ambilLemaPerKategori memanggil endpoint kategori', async () => {
    klien.get.mockResolvedValue({ data: { abjad: [] } });
    await ambilKategoriKamus();
    await ambilLemaPerKategori('kelas kata', 'n-1', { limit: 9, offset: 3 });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/kamus/kategori');
    expect(klien.get).toHaveBeenNthCalledWith(
      2,
      '/api/public/kamus/kategori/kelas%20kata/n-1',
      { params: { limit: 9, offset: 3 } }
    );
  });

  it('ambilDetailKamus melakukan encode slug', async () => {
    klien.get.mockResolvedValue({ data: { frasa: 'anak' } });
    await ambilDetailKamus('anak ibu');
    expect(klien.get).toHaveBeenCalledWith('/api/public/kamus/detail/anak%20ibu');
  });

  it('cariGlosarium memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [], total: 0 } });
    await cariGlosarium('istilah');
    expect(klien.get).toHaveBeenCalledWith('/api/public/glosarium/cari/istilah', {
      params: { limit: 100, offset: 0 },
    });
  });

  it('cariTesaurus dan ambilDetailTesaurus memanggil endpoint sesuai kata', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariTesaurus('anak ibu', { limit: 50, offset: 10 });
    await ambilDetailTesaurus('anak ibu');

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/tesaurus/cari/anak%20ibu', {
      params: { limit: 50, offset: 10 },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/public/tesaurus/anak%20ibu');
  });

  it('autocomplete mengembalikan array kosong untuk kata pendek', async () => {
    const hasil = await autocomplete('kamus', 'a');
    expect(hasil).toEqual([]);
    expect(klien.get).not.toHaveBeenCalled();
  });

  it('autocomplete menormalkan item string dan object', async () => {
    klien.get.mockResolvedValue({
      data: {
        data: ['anak', { value: 'aneka', original: 'varied' }],
      },
    });

    const hasil = await autocomplete('kamus', 'an');

    expect(klien.get).toHaveBeenCalledWith('/api/public/kamus/autocomplete/an');
    expect(hasil).toEqual([{ value: 'anak' }, { value: 'aneka', original: 'varied' }]);
  });

  it('ambilGlosariumPerBidang dan ambilGlosariumPerSumber memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await ambilGlosariumPerBidang('biologi');
    await ambilGlosariumPerSumber('kbbi');

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/glosarium/bidang/biologi', {
      params: { limit: 100, offset: 0 },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/public/glosarium/sumber/kbbi', {
      params: { limit: 100, offset: 0 },
    });
  });

  it('ambilDaftarBidang dan ambilDaftarSumber memanggil endpoint daftar', async () => {
    klien.get.mockResolvedValue({ data: [] });
    await ambilDaftarBidang();
    await ambilDaftarSumber();
    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/glosarium/bidang');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/public/glosarium/sumber');
  });

});
