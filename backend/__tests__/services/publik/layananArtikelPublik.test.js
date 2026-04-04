/**
 * @fileoverview Test layananArtikelPublik
 * @tested_in backend/services/publik/layananArtikelPublik.js
 */

jest.mock('../../../models/artikel/modelArtikel', () => ({
  ambilDaftarPublik: jest.fn(),
  ambilSatuPublik: jest.fn(),
}));

jest.mock('../../../services/sistem/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  getTtlSeconds: jest.fn(() => 300),
}));

const ModelArtikel = require('../../../models/artikel/modelArtikel');
const { getJson, setJson, getTtlSeconds } = require('../../../services/sistem/layananCache');
const {
  ambilDaftarArtikelPublik,
  ambilDetailArtikelPublik,
  invalidasiCacheArtikelPublik,
  buatCacheKeyDaftarArtikel,
  buatCacheKeyDetailArtikel,
  __private,
} = require('../../../services/publik/layananArtikelPublik');

describe('layananArtikelPublik', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    getTtlSeconds.mockReturnValue(300);
  });

  it('membuat cache key daftar dan detail secara stabil', () => {
    expect(buatCacheKeyDaftarArtikel({ q: '  Kata ', topik: ['Sintaksis', 'bahasa'], limit: 15, offset: 5 }, 9))
      .toBe('artikel:browse:v-9:l-15:o-5:q-Kata:t-bahasa%7Csintaksis');
    expect(buatCacheKeyDetailArtikel('Artikel Satu', 12)).toBe('artikel:detail:artikel%20satu:v-12');
  });

  it('helper private menormalisasi nilai cache artikel', async () => {
    getJson.mockResolvedValueOnce('abc').mockResolvedValueOnce('17');

    expect(__private.normalisasiSlug(' Artikel%20Dua ')).toBe('artikel dua');
    expect(__private.normalisasiTopikFilter([' Sintaksis ', 'bahasa', 'sintaksis'])).toEqual(['bahasa', 'sintaksis']);
    expect(__private.normalisasiTopikFilter()).toEqual([]);
    expect(__private.normalisasiLimit('0')).toBe(20);
    expect(__private.normalisasiLimit('50')).toBe(50);
    expect(__private.normalisasiOffset('-1')).toBe(0);
    expect(__private.normalisasiOffset('7')).toBe(7);
    expect(__private.normalisasiQueryTeks('  uji  ')).toBe('uji');
    expect(__private.buatCacheKeyVersiDetailArtikel('Artikel Satu')).toBe('artikel:detail:version:artikel%20satu');
    await expect(__private.ambilVersiCacheDaftarArtikel()).resolves.toBe(0);
    await expect(__private.ambilVersiCacheDetailArtikel('Artikel Satu')).resolves.toBe(17);
  });

  it('ambilDaftarArtikelPublik memakai cache saat tersedia', async () => {
    getJson.mockResolvedValueOnce(3).mockResolvedValueOnce({ total: 1, data: [{ slug: 'cached' }] });

    const hasil = await ambilDaftarArtikelPublik({ q: 'cache' });

    expect(hasil).toEqual({ total: 1, data: [{ slug: 'cached' }] });
    expect(ModelArtikel.ambilDaftarPublik).not.toHaveBeenCalled();
  });

  it('ambilDaftarArtikelPublik menyimpan hasil model ke cache saat miss', async () => {
    ModelArtikel.ambilDaftarPublik.mockResolvedValueOnce({ total: 2, data: [{ slug: 'artikel-satu' }] });

    const hasil = await ambilDaftarArtikelPublik({ topik: ['Bahasa'], q: 'tes', limit: 30, offset: 10 });

    expect(ModelArtikel.ambilDaftarPublik).toHaveBeenCalledWith({
      topik: ['bahasa'],
      q: 'tes',
      limit: 30,
      offset: 10,
    });
    expect(setJson).toHaveBeenCalledWith(
      'artikel:browse:v-0:l-30:o-10:q-tes:t-bahasa',
      { total: 2, data: [{ slug: 'artikel-satu' }] },
      300
    );
    expect(hasil).toEqual({ total: 2, data: [{ slug: 'artikel-satu' }] });
  });

  it('ambilDetailArtikelPublik memakai cache saat tersedia dan tidak cache miss null', async () => {
    getJson.mockResolvedValueOnce(4).mockResolvedValueOnce({ slug: 'artikel-satu' });

    const cached = await ambilDetailArtikelPublik('Artikel-Satu');
    expect(cached).toEqual({ slug: 'artikel-satu' });
    expect(ModelArtikel.ambilSatuPublik).not.toHaveBeenCalled();

    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    ModelArtikel.ambilSatuPublik.mockResolvedValueOnce(null);

    const kosong = await ambilDetailArtikelPublik('artikel-kosong');
    expect(kosong).toBeNull();
    expect(setJson).not.toHaveBeenCalled();
  });

  it('ambilDetailArtikelPublik menyimpan hasil model ke cache saat miss', async () => {
    ModelArtikel.ambilSatuPublik.mockResolvedValueOnce({ slug: 'artikel-dua', judul: 'Artikel Dua' });

    const hasil = await ambilDetailArtikelPublik('Artikel-Dua');

    expect(ModelArtikel.ambilSatuPublik).toHaveBeenCalledWith('artikel-dua');
    expect(setJson).toHaveBeenCalledWith('artikel:detail:artikel-dua:v-0', { slug: 'artikel-dua', judul: 'Artikel Dua' }, 300);
    expect(hasil).toEqual({ slug: 'artikel-dua', judul: 'Artikel Dua' });
  });

  it('invalidasiCacheArtikelPublik memperbarui versi browse dan detail unik', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456);
    getTtlSeconds.mockReturnValue(200);

    await invalidasiCacheArtikelPublik(['Artikel-Satu', 'artikel-satu', 'Artikel-Dua']);

    expect(setJson).toHaveBeenNthCalledWith(1, 'artikel:browse:version', 123456, 3600);
    expect(setJson).toHaveBeenNthCalledWith(2, 'artikel:detail:version:artikel-satu', 123456, 3600);
    expect(setJson).toHaveBeenNthCalledWith(3, 'artikel:detail:version:artikel-dua', 123456, 3600);
    nowSpy.mockRestore();
  });
});