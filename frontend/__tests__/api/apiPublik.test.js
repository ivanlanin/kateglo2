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
  cariKamus,
  ambilDetailKamus,
  cariGlosarium,
  ambilDaftarBidang,
  ambilDaftarSumber,
  cariPeribahasa,
  cariSingkatan,
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
    await cariKamus('kata', 10);
    expect(klien.get).toHaveBeenCalledWith('/api/public/pencarian', { params: { q: 'kata', limit: 10 } });
  });

  it('ambilDetailKamus melakukan encode slug', async () => {
    klien.get.mockResolvedValue({ data: { frasa: 'anak' } });
    await ambilDetailKamus('anak ibu');
    expect(klien.get).toHaveBeenCalledWith('/api/public/kamus/anak%20ibu');
  });

  it('cariGlosarium memakai default params', async () => {
    klien.get.mockResolvedValue({ data: { data: [], total: 0 } });
    await cariGlosarium();
    expect(klien.get).toHaveBeenCalledWith('/api/public/glosarium', {
      params: { q: '', bidang: '', sumber: '', bahasa: '', limit: 20, offset: 0 },
    });
  });

  it('ambilDaftarBidang dan ambilDaftarSumber memanggil endpoint daftar', async () => {
    klien.get.mockResolvedValue({ data: [] });
    await ambilDaftarBidang();
    await ambilDaftarSumber();
    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/glosarium/bidang');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/public/glosarium/sumber');
  });

  it('cariPeribahasa dan cariSingkatan mengirim parameter pencarian', async () => {
    klien.get.mockResolvedValue({ data: { data: [] } });
    await cariPeribahasa({ q: 'buah', limit: 5, offset: 1 });
    await cariSingkatan({ q: 'bumn', kependekan: 'badan', tag: 'instansi', limit: 7, offset: 2 });

    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/peribahasa', {
      params: { q: 'buah', limit: 5, offset: 1 },
    });
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/public/singkatan', {
      params: { q: 'bumn', kependekan: 'badan', tag: 'instansi', limit: 7, offset: 2 },
    });
  });
});
