/**
 * @fileoverview Test layananGlosariumPublik
 * @tested_in backend/services/publik/layananGlosariumPublik.js
 */

jest.mock('../../../models/leksikon/modelGlosarium', () => ({
  cariCursor: jest.fn(),
  ambilDaftarBidang: jest.fn(),
  ambilDaftarSumber: jest.fn(),
  ambilDetailAsing: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelEntri', () => ({
  ambilIndeksValidBatch: jest.fn(),
}));

jest.mock('../../../services/sistem/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  getTtlSeconds: jest.fn(() => 300),
  delKey: jest.fn(),
}));

const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const ModelEntri = require('../../../models/leksikon/modelEntri');
const { getJson, setJson, getTtlSeconds, delKey } = require('../../../services/sistem/layananCache');
const {
  cariGlosariumPublik,
  ambilDaftarBidangPublik,
  ambilDaftarSumberPublik,
  ambilGlosariumPerBidangPublik,
  ambilGlosariumPerSumberPublik,
  ambilDetailGlosarium,
  invalidasiCacheDetailGlosarium,
  invalidasiCacheMasterGlosarium,
  buatCacheKeyDetailGlosarium,
  buatCacheKeyBrowseGlosarium,
  __private,
} = require('../../../services/publik/layananGlosariumPublik');

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

  it('helper private menormalisasi istilah, memecah entri, token kurung, kandidat tautan, cache browse, dan versi cache', async () => {
    getJson
      .mockResolvedValueOnce('0')
      .mockResolvedValueOnce('abc');

    expect(__private.normalisasiAsing('zero%20sum')).toBe('zero sum');
    expect(__private.normalisasiIndeksKamus()).toBe('');
    expect(__private.normalisasiIndeksKamus('Kata (2)')).toBe('Kata');
    expect(__private.splitEntriGlosarium(' satu ; dua ;  ')).toEqual(['satu', 'dua']);
    expect(__private.splitEntriGlosarium()).toEqual([]);
    expect(__private.tokenizeKurung('alpha (beta) gamma')).toEqual([
      { text: 'alpha ', isKurung: false },
      { text: '(beta)', isKurung: true },
      { text: ' gamma', isKurung: false },
    ]);
    expect(__private.tokenizeKurung()).toEqual([]);
    expect(__private.tokenizeKurung('(beta) gamma')).toEqual([
      { text: '(beta)', isKurung: true },
      { text: ' gamma', isKurung: false },
    ]);
    expect(__private.ekstrakKandidatTautanIndonesia()).toEqual([]);
    expect(__private.ekstrakKandidatTautanIndonesia('kata (cak); frasa; ')).toEqual(['kata', 'frasa']);
    expect(__private.ekstrakKandidatTautanIndonesia(' (cak); - ; kata')).toEqual(['-', 'kata']);
    expect(__private.kumpulkanKandidatTautanIndonesia()).toEqual([]);
    expect(__private.kumpulkanKandidatTautanIndonesia({})).toEqual([]);
    expect(__private.kumpulkanKandidatTautanIndonesia([{ indonesia: 'kata; kata; frasa (ark)' }, {}])).toEqual(['kata', 'frasa']);
    expect(__private.tambahkanTautanIndonesiaValid()).resolves.toEqual({ tautan_indonesia_valid: [] });
    expect(__private.shouldCacheBrowseGlosarium('cari', {})).toBe(true);
    expect(__private.shouldCacheBrowseGlosarium('cari', { cursor: 'abc' })).toBe(false);
    expect(__private.shouldCacheBrowseGlosarium('cari', { direction: 'prev' })).toBe(false);
    expect(__private.shouldCacheBrowseGlosarium('cari', { lastPage: true })).toBe(false);
    expect(__private.shouldCacheBrowseGlosarium('bidang')).toBe(true);
    expect(__private.shouldCacheBrowseGlosarium('sumber')).toBe(true);
    expect(__private.shouldCacheBrowseGlosarium('lain')).toBe(false);
    expect(__private.buatCacheKeyMasterGlosarium()).toBe('glosarium:master::m-');
    expect(buatCacheKeyBrowseGlosarium('scope')).toBe('glosarium:browse:scope:v-0:l-100:c-:d-next:lp-0');
    expect(buatCacheKeyBrowseGlosarium(undefined, undefined, Number.NaN)).toBe('glosarium:browse::v-0:l-100:c-:d-next:lp-0');
    expect(buatCacheKeyBrowseGlosarium('scope', { limit: 0 })).toBe('glosarium:browse:scope:v-0:l-100:c-:d-next:lp-0');
    expect(buatCacheKeyDetailGlosarium('term', undefined, undefined)).toBe('glosarium:detail:term:v-0:l-20:mc-:rc-');
    await expect(__private.ambilVersiCache('term')).resolves.toBe(0);
    await expect(__private.ambilVersiCacheBrowseGlosarium()).resolves.toBe(0);
    await expect(__private.ambilVersiCache()).resolves.toBe(0);
    expect(__private.bentukResponsCursor({ hasPrev: 0, hasNext: 1, prevCursor: '', nextCursor: 'n' })).toEqual({
      hasPrev: 0,
      hasNext: 1,
      prevCursor: '',
      nextCursor: 'n',
      pageInfo: { hasPrev: false, hasNext: true, prevCursor: null, nextCursor: 'n' },
    });
  });

  it('helper private invalidasi cache browse, master loader, tautan valid, dan daftar browse langsung', async () => {
    const nowSpy = jest.spyOn(Date, 'now').mockReturnValue(456789);
    getTtlSeconds.mockReturnValue(1000);
    await __private.invalidasiCacheBrowseGlosarium();
    expect(setJson).toHaveBeenCalledWith('glosarium:browse:version', 456789, 4000);

    getJson.mockReset();
    getJson.mockResolvedValueOnce(null).mockResolvedValueOnce([{ data: 'cached' }]);
    setJson.mockClear();
    const loader = jest.fn().mockResolvedValue([{ kode: 'ling' }]);
    await expect(__private.ambilMasterGlosariumPublik('bidang', 'glosarium', loader)).resolves.toEqual([{ kode: 'ling' }]);
    expect(loader).toHaveBeenCalledTimes(1);
    await expect(__private.ambilMasterGlosariumPublik('bidang', 'glosarium', loader)).resolves.toEqual([{ data: 'cached' }]);

    ModelEntri.ambilIndeksValidBatch.mockResolvedValueOnce(['kata']);
    await expect(__private.tambahkanTautanIndonesiaValid({ ok: true }, [{ indonesia: 'kata; --' }])).resolves.toEqual({ ok: true, tautan_indonesia_valid: ['kata'] });

    getJson.mockReset();
    getJson.mockResolvedValue(null);
    ModelGlosarium.cariCursor.mockResolvedValueOnce({ hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null });
    ModelEntri.ambilIndeksValidBatch.mockResolvedValueOnce([]);
    await expect(__private.ambilDaftarGlosariumPublik('lain', null)).resolves.toEqual({
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
      pageInfo: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      tautan_indonesia_valid: [],
    });

    getJson.mockResolvedValueOnce(7).mockResolvedValueOnce(null);
    ModelGlosarium.cariCursor.mockResolvedValueOnce({ data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null });
    ModelEntri.ambilIndeksValidBatch.mockResolvedValueOnce([]);
    await expect(__private.ambilDaftarGlosariumPublik('bidang', undefined, { bidangId: 1 }, {})).resolves.toEqual(expect.objectContaining({ tautan_indonesia_valid: [] }));
    nowSpy.mockRestore();
  });

  it('ambilDaftarSumberPublik memakai default filterMode konteks', async () => {
    getJson.mockResolvedValueOnce(null);
    ModelGlosarium.ambilDaftarSumber.mockResolvedValueOnce([{ kode: 'kbbi', nama: 'KBBI' }]);

    const result = await ambilDaftarSumberPublik();

    expect(ModelGlosarium.ambilDaftarSumber).toHaveBeenCalledWith('konteks');
    expect(result).toEqual([{ kode: 'kbbi', nama: 'KBBI' }]);
  });

  it('ambilGlosariumPerBidangPublik dan ambilGlosariumPerSumberPublik memakai opsi default saat tidak diberikan', async () => {
    getJson.mockReset();
    getJson.mockResolvedValue(null);
    ModelGlosarium.cariCursor
      .mockResolvedValueOnce({ data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null })
      .mockResolvedValueOnce({ data: [], total: 0, hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null });
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue([]);

    await ambilGlosariumPerBidangPublik('ling');
    await ambilGlosariumPerSumberPublik('kbbi', { sumberId: 1 });
    await ambilGlosariumPerSumberPublik('kbbi');
    await cariGlosariumPublik('kata');

    expect(ModelGlosarium.cariCursor).toHaveBeenNthCalledWith(1, expect.objectContaining({ bidangId: null, bidang: '', limit: 100, cursor: null, direction: 'next', lastPage: false, sortBy: 'asing' }));
    expect(ModelGlosarium.cariCursor).toHaveBeenNthCalledWith(2, expect.objectContaining({ sumberId: 1, limit: 100, cursor: null, direction: 'next', lastPage: false, sortBy: 'asing' }));
    expect(ModelGlosarium.cariCursor).toHaveBeenNthCalledWith(3, expect.objectContaining({ sumberId: undefined, limit: 100, cursor: null, direction: 'next', lastPage: false, sortBy: 'asing' }));
    expect(ModelGlosarium.cariCursor).toHaveBeenNthCalledWith(4, expect.objectContaining({ q: 'kata', limit: 100, cursor: null, direction: 'next', lastPage: false }));
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
    getJson.mockReset();
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
    getJson.mockReset();
    getJson.mockResolvedValueOnce(0).mockResolvedValueOnce(null);
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

  it('ambilGlosariumPerSumberPublik memuat dari model dan menyimpan cache browse', async () => {
    getJson
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(null);
    ModelGlosarium.cariCursor.mockResolvedValue({
      data: [{ id: 2, indonesia: 'kata', asing: 'term' }],
      total: 1,
      hasPrev: true,
      hasNext: true,
      prevCursor: 'p',
      nextCursor: 'n',
    });
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue(['kata']);

    const result = await ambilGlosariumPerSumberPublik('kbbi', { sumberId: 3, limit: 10 });

    expect(ModelGlosarium.cariCursor).toHaveBeenCalledWith({
      sumberId: 3,
      limit: 10,
      aktifSaja: true,
      hitungTotal: true,
      cursor: null,
      direction: 'next',
      lastPage: false,
      sortBy: 'asing',
    });
    expect(setJson).toHaveBeenCalledWith('glosarium:browse:sumber%3Akbbi:v-8:l-10:c-:d-next:lp-0', {
      data: [{ id: 2, indonesia: 'kata', asing: 'term' }],
      total: 1,
      hasPrev: true,
      hasNext: true,
      prevCursor: 'p',
      nextCursor: 'n',
      pageInfo: { hasPrev: true, hasNext: true, prevCursor: 'p', nextCursor: 'n' },
      tautan_indonesia_valid: ['kata'],
    }, 300);
    expect(result.tautan_indonesia_valid).toEqual(['kata']);
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

  it('invalidasiCacheMasterGlosarium menghapus semua cache master terkait', async () => {
    delKey.mockResolvedValue(undefined);

    await invalidasiCacheMasterGlosarium();

    expect(delKey).toHaveBeenCalledTimes(3);
    expect(delKey).toHaveBeenNthCalledWith(1, 'glosarium:master:bidang:m-glosarium');
    expect(delKey).toHaveBeenNthCalledWith(2, 'glosarium:master:sumber:m-konteks');
    expect(delKey).toHaveBeenNthCalledWith(3, 'glosarium:master:sumber:m-glosarium');
  });
});

