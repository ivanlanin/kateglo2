/**
 * @fileoverview Test layananGlosariumPublik
 * @tested_in backend/services/layananGlosariumPublik.js
 */

jest.mock('../../models/modelGlosarium', () => ({
  ambilDetailAsing: jest.fn(),
}));

jest.mock('../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  getTtlSeconds: jest.fn(() => 300),
}));

const ModelGlosarium = require('../../models/modelGlosarium');
const { getJson, setJson, getTtlSeconds } = require('../../services/layananCache');
const {
  ambilDetailGlosarium,
  invalidasiCacheDetailGlosarium,
  buatCacheKeyDetailGlosarium,
  __private,
} = require('../../services/layananGlosariumPublik');

describe('layananGlosariumPublik', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    getTtlSeconds.mockReturnValue(300);
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
    ModelGlosarium.ambilDetailAsing.mockResolvedValue({ data: [{ indonesia: 'uji' }] });

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
    expect(setJson).toHaveBeenCalledWith('glosarium:detail:term:v-0:l-7:mc-aa:rc-bb', { data: [{ indonesia: 'uji' }] }, 300);
    expect(result).toEqual({ data: [{ indonesia: 'uji' }] });
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

    expect(setJson).not.toHaveBeenCalled();
  });

  it('invalidasiCacheDetailGlosarium menyimpan versi dengan ttl minimal 3600', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(123456);
    getTtlSeconds.mockReturnValue(100);

    await invalidasiCacheDetailGlosarium('Zero Sum');

    expect(setJson).toHaveBeenCalledWith('glosarium:detail:version:zero%20sum', 123456, 3600);
    nowSpy.mockRestore();
  });
});
