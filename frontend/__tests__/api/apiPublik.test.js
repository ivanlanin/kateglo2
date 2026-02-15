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

  it('ambilDaftarBidang dan ambilDaftarSumber memanggil endpoint daftar', async () => {
    klien.get.mockResolvedValue({ data: [] });
    await ambilDaftarBidang();
    await ambilDaftarSumber();
    expect(klien.get).toHaveBeenNthCalledWith(1, '/api/public/glosarium/bidang');
    expect(klien.get).toHaveBeenNthCalledWith(2, '/api/public/glosarium/sumber');
  });

});
