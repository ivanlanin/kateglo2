/**
 * @fileoverview Test layananGlosariumPublik
 * @tested_in backend/services/layananGlosariumPublik.js
 */

jest.mock('../../models/modelGlosarium', () => ({
  cariCursor: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
  ambilDetailAsing: jest.fn(),
}));

jest.mock('../../models/modelEntri', () => ({
  ambilIndeksValidBatch: jest.fn(),
}));

jest.mock('../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  getTtlSeconds: jest.fn(() => 300),
}));

const ModelGlosarium = require('../../models/modelGlosarium');
const ModelEntri = require('../../models/modelEntri');
const { getJson, setJson, getTtlSeconds } = require('../../services/layananCache');
const {
  cariGlosariumPublik,
  ambilDaftarBidangPublik,
  ambilDaftarSumberPublik,
  ambilGlosariumPerBidangPublik,
  ambilDetailGlosarium,
  invalidasiCacheDetailGlosarium,
  buatCacheKeyDetailGlosarium,
  buatCacheKeyBrowseGlosarium,
  __private,
} = require('../../services/layananGlosariumPublik');

describe('layananGlosariumPublik', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    getTtlSeconds.mockReturnValue(300);
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue([]);
  });

  it('buatCacheKeyDetailGlosarium membuat key dengan fallback default', () => {
    const key = buatCacheKeyDetailGlosarium('Zero Sum');

    expect(key).toBe('glosarium:detail:zero%20sum:v-0:l-20:mc-:rc-');
  });

  it('buatCacheKeyDetailGlosarium aman untuk istilah/opsi kosong dan limit 0', () => {
    const key = buatCacheKeyDetailGlosarium(undefined, {
      limit: 0,
      mengandungCursor: null,
      miripCursor: null,
    }, undefined);

    expect(key).toBe('glosarium:detail::v-0:l-20:mc-:rc-');
  });

  it('helper private buatCacheKeyVersion aman saat asing kosong', () => {
    expect(__private.buatCacheKeyVersion(undefined)).toBe('glosarium:detail:version:');
  });

  it('buatCacheKeyDetailGlosarium meng-encode cursor dan versi', () => {
    const key = buatCacheKeyDetailGlosarium('Zero Sum', {
      limit: 15,
      mengandungCursor: 'a+b/c=',
      miripCursor: 'x y',
    }, 77);

    expect(key).toBe('glosarium:detail:zero%20sum:v-77:l-15:mc-a%2Bb%2Fc%3D:rc-x%20y');
  });

  it('buatCacheKeyBrowseGlosarium meng-encode scope dan opsi browse', () => {
    const key = buatCacheKeyBrowseGlosarium('cari:istilah', {
      limit: 100,
      cursor: 'a+b',
      direction: 'prev',
      lastPage: true,
    }, 12);

    expect(key).toBe('glosarium:browse:cari%3Aistilah:v-12:l-100:c-a%2Bb:d-prev:lp-1');
  });

  it('helper private buatCacheKeyMasterGlosarium meng-encode resource dan mode', () => {
    expect(__private.buatCacheKeyMasterGlosarium('bidang', 'Glosarium Khusus')).toBe('glosarium:master:bidang:m-glosarium%20khusus');
  });

  it('ambilDetailGlosarium langsung ke model untuk istilah kosong', async () => {
    ModelGlosarium.ambilDetailAsing.mockResolvedValue({ data: [] });

    const result = await ambilDetailGlosarium('   ', { limit: 10, mengandungCursor: 'a', miripCursor: 'b' });

    expect(ModelGlosarium.ambilDetailAsing).toHaveBeenCalledWith('', {
      limit: 10,
      mengandungCursor: 'a',
      miripCursor: 'b',
    });
    expect(result).toEqual({ data: [] });
  });

  it('ambilDetailGlosarium aman untuk istilah undefined dan opsi default', async () => {
    ModelGlosarium.ambilDetailAsing.mockResolvedValue({ data: [] });

    await ambilDetailGlosarium(undefined);

    expect(ModelGlosarium.ambilDetailAsing).toHaveBeenCalledWith('', {
      limit: 20,
      mengandungCursor: null,
      miripCursor: null,
    });
  });

  it('ambilDetailGlosarium mengembalikan data cache saat tersedia', async () => {
    getJson
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce({ data: [{ indonesia: 'jumlah nol' }] });

    const result = await ambilDetailGlosarium('Zero Sum', { limit: 5 });

    expect(getJson).toHaveBeenNthCalledWith(1, 'glosarium:detail:version:zero%20sum');
    expect(getJson).toHaveBeenNthCalledWith(2, 'glosarium:detail:zero%20sum:v-12:l-5:mc-:rc-');
    expect(ModelGlosarium.ambilDetailAsing).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [{ indonesia: 'jumlah nol' }] });
  });

  it('ambilDetailGlosarium query model + simpan cache saat cache miss', async () => {
    ModelGlosarium.ambilDetailAsing.mockResolvedValue({ persis: [{ indonesia: 'uji' }], mengandung: [], mirip: [] });

    const result = await ambilDetailGlosarium('Term', {
      limit: 7,
      mengandungCursor: 'aa',
      miripCursor: 'bb',
    });

    expect(ModelGlosarium.ambilDetailAsing).toHaveBeenCalledWith('Term', {
      limit: 7,
      mengandungCursor: 'aa',
      miripCursor: 'bb',
    });
    expect(ModelEntri.ambilIndeksValidBatch).toHaveBeenCalledWith(['uji']);
    expect(setJson).toHaveBeenCalledWith('glosarium:detail:term:v-0:l-7:mc-aa:rc-bb', {
      persis: [{ indonesia: 'uji' }],
      mengandung: [],
      mirip: [],
      tautan_indonesia_valid: [],
    }, 300);
    expect(result).toEqual({ persis: [{ indonesia: 'uji' }], mengandung: [], mirip: [], tautan_indonesia_valid: [] });
  });

  it('cariGlosariumPublik meng-cache halaman pertama pencarian dan menyertakan tautan valid', async () => {
    getJson
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(null);
    ModelGlosarium.cariCursor.mockResolvedValue({
      data: [{ id: 1, indonesia: 'istilah; data', asing: 'term' }],
      total: 1,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue(['istilah']);

    const result = await cariGlosariumPublik('istilah', { limit: 100 });

    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      q: 'istilah',
      limit: 100,
      aktifSaja: true,
      hitungTotal: true,
      cursor: null,
      direction: 'next',
      lastPage: false,
    });
    expect(ModelEntri.ambilIndeksValidBatch).toHaveBeenCalledWith(['istilah', 'data']);
    expect(setJson).toHaveBeenCalledWith('glosarium:browse:cari%3Aistilah:v-5:l-100:c-:d-next:lp-0', {
      data: [{ id: 1, indonesia: 'istilah; data', asing: 'term' }],
      total: 1,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
      pageInfo: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      tautan_indonesia_valid: ['istilah'],
    }, 300);
    expect(result.tautan_indonesia_valid).toEqual(['istilah']);
  });

  it('cariGlosariumPublik tidak meng-cache halaman lanjutan pencarian', async () => {
    ModelGlosarium.cariCursor.mockResolvedValue({ data: [], total: 0, hasPrev: true, hasNext: false, prevCursor: 'abc', nextCursor: null });

    await cariGlosariumPublik('istilah', { limit: 100, cursor: 'abc', direction: 'prev' });

    expect(getJson).not.toHaveBeenCalled();
    expect(setJson).not.toHaveBeenCalled();
  });

  it('ambilGlosariumPerBidangPublik meng-cache halaman kategori', async () => {
    getJson
      .mockResolvedValueOnce(9)
      .mockResolvedValueOnce({ data: [], total: 0, pageInfo: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null }, tautan_indonesia_valid: [] });

    const result = await ambilGlosariumPerBidangPublik('ling', { bidangId: 7, limit: 10, cursor: 'cur', direction: 'prev', lastPage: true });

    expect(getJson).toHaveBeenNthCalledWith(1, 'glosarium:browse:version');
    expect(getJson).toHaveBeenNthCalledWith(2, 'glosarium:browse:bidang%3Aling:v-9:l-10:c-cur:d-prev:lp-1');
    expect(result.tautan_indonesia_valid).toEqual([]);
    expect(ModelGlosarium.cariCursor).not.toHaveBeenCalled();
  });

  it('ambilDaftarBidangPublik meng-cache daftar master bidang', async () => {
    getJson.mockResolvedValueOnce(null);
    ModelGlosarium.ambilDaftarBidang.mockResolvedValue([{ kode: 'ling', nama: 'Linguistik' }]);

    const result = await ambilDaftarBidangPublik();

    expect(getJson).toHaveBeenCalledWith('glosarium:master:bidang:m-glosarium');
    expect(ModelGlosarium.ambilDaftarBidang).toHaveBeenCalledWith('glosarium');
    expect(setJson).toHaveBeenCalledWith('glosarium:master:bidang:m-glosarium', [{ kode: 'ling', nama: 'Linguistik' }], 300);
    expect(result).toEqual([{ kode: 'ling', nama: 'Linguistik' }]);
  });

  it('ambilDaftarSumberPublik memakai cache daftar master sumber saat tersedia', async () => {
    getJson.mockResolvedValueOnce([{ kode: 'kbbi', nama: 'KBBI' }]);

    const result = await ambilDaftarSumberPublik('konteks');

    expect(getJson).toHaveBeenCalledWith('glosarium:master:sumber:m-konteks');
    expect(ModelGlosarium.ambilDaftarSumber).not.toHaveBeenCalled();
    expect(setJson).not.toHaveBeenCalled();
    expect(result).toEqual([{ kode: 'kbbi', nama: 'KBBI' }]);
  });

  it('ambilDetailGlosarium memaksa versi 0 saat cache version invalid', async () => {
    getJson
      .mockResolvedValueOnce('abc')
      .mockResolvedValueOnce(null);
    ModelGlosarium.ambilDetailAsing.mockResolvedValue({ data: [] });

    await ambilDetailGlosarium('Term', { limit: 20 });

    expect(getJson).toHaveBeenNthCalledWith(2, 'glosarium:detail:term:v-0:l-20:mc-:rc-');
  });

  it('ambilDetailGlosarium memakai default opsi saat argumen kedua tidak diberikan', async () => {
    getJson
      .mockResolvedValueOnce(0)
      .mockResolvedValueOnce(null);
    ModelGlosarium.ambilDetailAsing.mockResolvedValue({ data: [] });

    await ambilDetailGlosarium('Term');

    expect(getJson).toHaveBeenNthCalledWith(2, 'glosarium:detail:term:v-0:l-20:mc-:rc-');
    expect(ModelGlosarium.ambilDetailAsing).toHaveBeenCalledWith('Term', {
      limit: 20,
      mengandungCursor: null,
      miripCursor: null,
    });
  });

  it('buatCacheKeyDetailGlosarium memaksa versi 0 saat versi non-finite', () => {
    const key = buatCacheKeyDetailGlosarium('term', { limit: 20 }, Number.NaN);

    expect(key).toBe('glosarium:detail:term:v-0:l-20:mc-:rc-');
  });

  it('invalidasiCacheDetailGlosarium no-op untuk istilah kosong', async () => {
    await invalidasiCacheDetailGlosarium('   ');

    expect(setJson).toHaveBeenCalledTimes(1);
    expect(setJson).toHaveBeenCalledWith('glosarium:browse:version', expect.any(Number), 3600);
  });

  it('invalidasiCacheDetailGlosarium menyimpan versi dengan ttl minimal 3600', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456);
    getTtlSeconds.mockReturnValue(100);

    await invalidasiCacheDetailGlosarium('Zero Sum');

    expect(setJson).toHaveBeenNthCalledWith(1, 'glosarium:browse:version', 123456, 3600);
    expect(setJson).toHaveBeenNthCalledWith(2, 'glosarium:detail:version:zero%20sum', 123456, 3600);
    nowSpy.mockRestore();
  });
});
