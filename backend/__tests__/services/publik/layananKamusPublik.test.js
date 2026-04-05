/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/publik/layananKamusPublik.js
 */

jest.mock('../../../models/leksikon/modelEntri', () => {
  const cariEntri = jest.fn();
  const cariEntriCursor = jest.fn();
  const ambilEntriPerIndeks = jest.fn();
  const ambilIndeksValidBatch = jest.fn();
  const ambilNavigasiIndeks = jest.fn();
  const ambilDaftarKandidatKataHariIni = jest.fn();
  const hitungKandidatKataHariIni = jest.fn();
  const ambilKandidatKataHariIni = jest.fn();
  return {
    cariEntri,
    cariEntriCursor,
    ambilEntriPerIndeks,
    ambilIndeksValidBatch,
    ambilNavigasiIndeks,
    ambilDaftarKandidatKataHariIni,
    hitungKandidatKataHariIni,
    ambilKandidatKataHariIni,
    ambilMakna: jest.fn(),
    ambilContoh: jest.fn(),
    ambilSubentri: jest.fn(),
    ambilBentukTidakBakuByRujukId: jest.fn(),
    ambilRantaiInduk: jest.fn(),
  };
});

jest.mock('../../../models/leksikon/modelTesaurus', () => ({
  ambilDetail: jest.fn()
}));

jest.mock('../../../models/leksikon/modelGlosarium', () => ({
  cariFrasaMengandungKataUtuh: jest.fn()
}));

jest.mock('../../../models/leksikon/modelEtimologi', () => ({
  ambilAktifPublikByEntriId: jest.fn(),
}));

jest.mock('../../../models/leksikon/modelKataHariIni', () => ({
  ambilByTanggal: jest.fn(),
  simpanByTanggal: jest.fn(),
}));

jest.mock('../../../models/master/modelTagar', () => ({
  ambilTagarEntri: jest.fn(),
}));

jest.mock('../../../services/sistem/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  delKey: jest.fn(),
  getTtlSeconds: jest.fn(() => 900),
}));

const ModelEntri = require('../../../models/leksikon/modelEntri');
const ModelTesaurus = require('../../../models/leksikon/modelTesaurus');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const ModelEtimologi = require('../../../models/leksikon/modelEtimologi');
const ModelKataHariIni = require('../../../models/leksikon/modelKataHariIni');
const ModelTagar = require('../../../models/master/modelTagar');
const { getJson, setJson, delKey, getTtlSeconds } = require('../../../services/sistem/layananCache');
const {
  cariKamus,
  ambilDetailKamus,
  ambilKataHariIni,
  ambilEntriAcak,
  generateKataHariIni,
  hapusCacheDetailKamus,
  buatCacheKeyDetailKamus,
  __private,
} = require('../../../services/publik/layananKamusPublik');

describe('layananKamusPublik.cariKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __private.resetCacheKandidatAcak();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    delKey.mockResolvedValue(undefined);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);
    ModelEntri.ambilNavigasiIndeks.mockResolvedValue({ prev: null, next: null });
    ModelEtimologi.ambilAktifPublikByEntriId.mockResolvedValue([]);
    ModelTagar.ambilTagarEntri.mockResolvedValue([]);
  });

  it('mengembalikan array kosong jika query kosong', async () => {
    const result = await cariKamus('   ');

    expect(result).toEqual({ data: [], total: 0, hasNext: false, hasPrev: false });
    expect(ModelEntri.cariEntriCursor).not.toHaveBeenCalled();
  });

  it('mengembalikan kosong jika query undefined', async () => {
    const result = await cariKamus(undefined);

    expect(result).toEqual({ data: [], total: 0, hasNext: false, hasPrev: false });
    expect(ModelEntri.cariEntriCursor).not.toHaveBeenCalled();
  });

  it('meneruskan query trim dengan opsi default', async () => {
    ModelEntri.cariEntriCursor.mockResolvedValue({ data: [{ entri: 'kata' }], total: 1, hasNext: false, hasPrev: false });

    const result = await cariKamus(' kata ');

    expect(ModelEntri.cariEntriCursor).toHaveBeenCalledWith('kata', {
      limit: 100,
      cursor: null,
      direction: 'next',
      lastPage: false,
      hitungTotal: true,
    });
    expect(result).toEqual({ data: [{ entri: 'kata' }], total: 1, hasNext: false, hasPrev: false });
  });

  it('meneruskan opsi cursor', async () => {
    ModelEntri.cariEntriCursor.mockResolvedValue({ data: [], total: 0, hasNext: false, hasPrev: false });

    await cariKamus('kata', { limit: 33, cursor: 'abc', direction: 'prev', lastPage: true });

    expect(ModelEntri.cariEntriCursor).toHaveBeenCalledWith('kata', {
      limit: 33,
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
      hitungTotal: true,
    });
  });

  it('helper privat membaca teks entri, menormalisasi indeks, memecah relasi, dan menjaga unik tanpa beda kapitalisasi', () => {
    expect(__private.bacaTeksEntri({ entri: 'kata' })).toBe('kata');
    expect(__private.bacaTeksEntri()).toBe('');
    expect(__private.normalisasiIndeksKamus('-Kata-')).toBe('Kata');
    expect(__private.ekstrakKandidatTautanMakna()).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('kata (cak)')).toBe('kata');
    expect(__private.ekstrakKandidatTautanMakna('*kata*')).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('(')).toBeNull();
    expect(__private.ekstrakKandidatTautanMakna('tiga kata penuh')).toBeNull();
    expect(__private.kumpulkanKandidatTautanMakna()).toEqual([]);
    expect(__private.kumpulkanKandidatTautanMakna([{ makna: [{ makna: 'kata; dua kata; *abaikan*' }] }])).toEqual(['kata', 'dua kata']);
    expect(__private.kumpulkanKandidatTautanMakna([{ makna: null }, {}])).toEqual([]);
    expect(__private.kumpulkanKandidatTautanMakna([{ makna: [{}] }])).toEqual([]);
    expect(__private.kumpulkanKandidatTautanTesaurus()).toEqual([]);
    expect(__private.kumpulkanKandidatTautanTesaurus({ sinonim: [''], antonim: [] })).toEqual([]);
    expect(__private.kumpulkanKandidatTautanTesaurus({ sinonim: ['Kata', 'kata'], antonim: ['Lawan (2)'] })).toEqual(['kata', 'lawan']);
    expect(__private.splitEntriGlosarium()).toEqual([]);
    expect(__private.splitEntriGlosarium('satu; dua')).toEqual(['satu', 'dua']);
    expect(__private.tokenizeKurung()).toEqual([]);
    expect(__private.tokenizeKurung('(beta) gamma')).toEqual([
      { text: '(beta)', isKurung: true },
      { text: ' gamma', isKurung: false },
    ]);
    expect(__private.tokenizeKurung('alpha (beta) gamma')).toEqual([
      { text: 'alpha ', isKurung: false },
      { text: '(beta)', isKurung: true },
      { text: ' gamma', isKurung: false },
    ]);
    expect(__private.tokenizeKurung('gamma')).toEqual([
      { text: 'gamma', isKurung: false },
    ]);
    expect(__private.kumpulkanKandidatTautanGlosarium()).toEqual([]);
    expect(__private.kumpulkanKandidatTautanGlosarium([{}])).toEqual([]);
    expect(__private.kumpulkanKandidatTautanGlosarium([{ indonesia: 'kata (cak); dua kata' }])).toEqual(['kata', 'dua kata']);
    expect(__private.parseDaftarRelasi()).toEqual([]);
    expect(__private.parseDaftarRelasi('a; b; ')).toEqual(['a', 'b']);
    expect(__private.unikTanpaBedaKapitalisasi(['Kata', 'kata', 'Lawan'])).toEqual(['Kata', 'Lawan']);
    expect(__private.unikTanpaBedaKapitalisasi([])).toEqual([]);
    expect(__private.ambilRingkasanMakna({
      makna: [
        { makna: '   ', contoh: [{ contoh: 'abaikan' }] },
        { makna: 'isi', contoh: [{ contoh: 'contoh isi' }] },
      ],
    })).toEqual([{ makna: 'isi', contoh: 'contoh isi' }]);
    expect(__private.ambilContohUtama({ makna: [{ contoh: [{ contoh: '   ' }] }] })).toBeNull();
    expect(__private.ambilEtimologiUtama([{ etimologi: [{ bahasa: ' ', kata_asal: '' }] }], null)).toBeNull();
    expect(__private.bentukPayloadKataHariIni(null, '2026-03-31')).toBeNull();
    expect(__private.ambilKandidatDariPool([], 0)).toBeNull();
  });

  it('helper cache kandidat menghapus entry kedaluwarsa dan memakai promise yang sedang berjalan', async () => {
    const now = Date.now();
    __private.simpanCacheKandidatAcak([{ indeks: 'lama' }], { requireEtimologi: false });
    jest.spyOn(Date, 'now').mockReturnValue(now + 10 ** 6);
    expect(__private.bacaCacheKandidatAcak({ requireEtimologi: false })).toBeNull();
    Date.now.mockRestore();

    let releaseRequest;
    ModelEntri.ambilDaftarKandidatKataHariIni.mockImplementationOnce(() => new Promise((resolve) => {
      releaseRequest = resolve;
    }));

    const first = __private.ambilPoolKandidatAcak({ requireEtimologi: false });
    const second = __private.ambilPoolKandidatAcak({ requireEtimologi: false });

    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledTimes(1);

    releaseRequest([{ indeks: 'baru' }]);
    await expect(first).resolves.toEqual([{ indeks: 'baru' }]);
    await expect(second).resolves.toEqual([{ indeks: 'baru' }]);
  });

  it('helper privat menutup fallback optional chaining dan default parameter', async () => {
    expect(__private.ambilContohUtama()).toBeNull();
    expect(__private.ambilContohUtama({ makna: [{}] })).toBeNull();
    expect(__private.ambilRingkasanMakna()).toEqual([]);
    expect(__private.ambilRingkasanMakna({
      makna: [{ makna: 'isi', contoh: null }],
    })).toEqual([{ makna: 'isi', contoh: null }]);

    expect(__private.ambilEtimologiUtama([
      { etimologi: null },
      { etimologi: [{ bahasa: 'Sanskerta', kata_asal: '' }] },
    ], null)).toEqual({
      bahasa: 'Sanskerta',
      bahasa_kode: null,
      kata_asal: null,
      sumber: null,
      sumber_kode: null,
    });

    expect(__private.ambilEtimologiUtama([
      { etimologi: [{ bahasa: '', kata_asal: 'mula' }] },
    ], null)).toEqual({
      bahasa: null,
      bahasa_kode: null,
      kata_asal: 'mula',
      sumber: null,
      sumber_kode: null,
    });

    expect(__private.bentukPayloadKataHariIni({ indeks: 'aktif', entri: [] }, '2026-03-31')).toBeNull();
    expect(__private.bentukPayloadKataHariIni({
      indeks: 'aktif',
      entri: [{
        homonim: 'abc',
        entri: '',
        makna: [{ makna: 'giat', contoh: [] }],
      }],
    }, '2026-03-31')).toEqual(expect.objectContaining({
      entri: 'aktif',
      homonim: null,
      kelas_kata: null,
    }));

    ModelKataHariIni.ambilByTanggal.mockResolvedValueOnce(null);
    await expect(ambilKataHariIni()).resolves.toBeNull();

    ModelKataHariIni.ambilByTanggal.mockResolvedValueOnce({ tanggal: '2026-04-08', indeks: 'lama' });
    await expect(generateKataHariIni()).resolves.toEqual(expect.objectContaining({ indeks: 'lama' }));
  });

  it('helper privat kandidat acak menutup branch TTL, cache valid, dan fallback nilai default', async () => {
    expect(__private.hashTanggal()).toBeGreaterThanOrEqual(0);
    expect(__private.buatCacheKeyKandidatAcak()).toBe('kamus:kandidat:dengan-etimologi');
    expect(__private.buatCacheKeyKandidatAcak({ requireEtimologi: false })).toBe('kamus:kandidat:tanpa-etimologi');

    getTtlSeconds.mockReturnValueOnce(10);
    expect(__private.getCandidatePoolTtlMs()).toBe(30000);
    getTtlSeconds.mockReturnValueOnce(120);
    expect(__private.getCandidatePoolTtlMs()).toBe(120000);

    expect(__private.simpanCacheKandidatAcak('bukan-array')).toEqual([]);
    expect(__private.bacaCacheKandidatAcak()).toEqual([]);

    __private.resetCacheKandidatAcak();
    __private.simpanCacheKandidatAcak([{ indeks: 'aktif' }], { requireEtimologi: false });
    expect(__private.bacaCacheKandidatAcak({ requireEtimologi: false })).toEqual([{ indeks: 'aktif' }]);

    __private.resetCacheKandidatAcak();
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([{ indeks: 'cache-hit' }]);
    await expect(__private.ambilPoolKandidatAcak()).resolves.toEqual([{ indeks: 'cache-hit' }]);
    await expect(__private.ambilPoolKandidatAcak()).resolves.toEqual([{ indeks: 'cache-hit' }]);
    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledTimes(1);
  });

  it('helper privat pemilihan kandidat dan payload menutup fallback URL, offset, dan makna utama', () => {
    expect(__private.ambilKandidatDariPool()).toBeNull();
    expect(__private.ambilKandidatDariPool([null], 0)).toBeNull();
    expect(__private.ambilKandidatDariPool([{ indeks: 'b' }, { indeks: 'c' }], -1)).toEqual({ indeks: 'c' });
    expect(__private.normalisasiCuplikan()).toBeNull();
    expect(__private.buatUrlDetailKamus()).toBeNull();
    expect(__private.buatUrlDetailKamus('   ')).toBeNull();

    expect(__private.ambilMaknaUtama()).toEqual({ entri: null, makna: null });
    expect(__private.ambilMaknaUtama([], null)).toEqual({ entri: null, makna: null });
    expect(__private.ambilMaknaUtama([
      { id: 1, makna: [{ makna: '  ' }] },
      { id: 2, makna: [{ makna: 'isi kedua' }] },
    ], 9)).toEqual({
      entri: { id: 2, makna: [{ makna: 'isi kedua' }] },
      makna: { makna: 'isi kedua' },
    });

    expect(__private.ambilMaknaUtama([
      { id: 3, makna: [] },
      { id: 4, makna: [{ makna: 'fallback' }] },
    ], 3)).toEqual({
      entri: { id: 4, makna: [{ makna: 'fallback' }] },
      makna: { makna: 'fallback' },
    });

    expect(__private.ambilMaknaUtama([
      { id: 5, makna: null },
      { id: 6, makna: [{ makna: 'isi keenam' }] },
    ], 5)).toEqual({
      entri: { id: 6, makna: [{ makna: 'isi keenam' }] },
      makna: { makna: 'isi keenam' },
    });

    expect(__private.ambilMaknaUtama([
      { id: 9, makna: [{ makna: '   ' }] },
      { id: 10, makna: [{ makna: 'isi kesepuluh' }] },
    ], 9)).toEqual({
      entri: { id: 10, makna: [{ makna: 'isi kesepuluh' }] },
      makna: { makna: 'isi kesepuluh' },
    });

    expect(__private.ambilMaknaUtama([
      { id: 7, makna: [{ makna: 'pilihan utama' }] },
      { id: 8, makna: [{ makna: 'cadangan' }] },
    ], 7)).toEqual({
      entri: { id: 7, makna: [{ makna: 'pilihan utama' }] },
      makna: { makna: 'pilihan utama' },
    });

    expect(__private.ambilEtimologiUtama()).toBeNull();
    expect(__private.bentukPayloadKataHariIni()).toBeNull();
    expect(__private.bentukPayloadKataHariIni({ indeks: 'aktif', entri: 'bukan-array' }, '2026-03-31')).toBeNull();
  });
});

describe('layananKamusPublik.ambilDetailKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    __private.resetCacheKandidatAcak();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    delKey.mockResolvedValue(undefined);
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValue([]);
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue([]);
    ModelEntri.ambilNavigasiIndeks.mockResolvedValue({ prev: null, next: null });
    ModelEntri.hitungKandidatKataHariIni.mockResolvedValue(0);
    ModelEntri.ambilKandidatKataHariIni.mockResolvedValue(null);
    ModelEtimologi.ambilAktifPublikByEntriId.mockResolvedValue([]);
    ModelKataHariIni.ambilByTanggal.mockResolvedValue(null);
    ModelKataHariIni.simpanByTanggal.mockResolvedValue(null);
    ModelTagar.ambilTagarEntri.mockResolvedValue([]);
  });

  it('membuat cache key detail kamus dalam huruf kecil ter-encode', () => {
    expect(buatCacheKeyDetailKamus('Kata Dasar')).toBe('kamus:detail:kata%20dasar');
  });

  it('membuat cache key aman saat indeks undefined', () => {
    expect(buatCacheKeyDetailKamus()).toBe('kamus:detail:');
  });

  it('membuat cache key detail dengan opsi glosarium lengkap', () => {
    const key = buatCacheKeyDetailKamus('Kata Dasar', {
      glosariumLimit: 30,
      glosariumCursor: 'abc+/=',
      glosariumDirection: 'prev',
    });

    expect(key).toBe('kamus:detail:kata%20dasar:g-30:prev:abc%2B%2F%3D');
  });

  it('membuat cache key detail dengan fallback limit dan direction next', () => {
    const key = buatCacheKeyDetailKamus('Kata Dasar', {
      glosariumLimit: 0,
      glosariumCursor: '',
      glosariumDirection: 'invalid',
    });

    expect(key).toBe('kamus:detail:kata%20dasar:g-20:next:');
  });

  it('membuat cache key detail default saat opsi bukan object', () => {
    const key = buatCacheKeyDetailKamus('Kata Dasar', 'invalid-options');

    expect(key).toBe('kamus:detail:kata%20dasar');
  });

  it('membuat cache key detail dengan suffix etimologi nonaktif saat diaktifkan', () => {
    const key = buatCacheKeyDetailKamus('Kata Dasar', {
      includeEtimologiNonaktif: true,
    });

    expect(key).toBe('kamus:detail:kata%20dasar:g-20:next::et-all');
  });

  it('membuat cache key detail memakai default saat opsi object kosong', () => {
    const key = buatCacheKeyDetailKamus('Kata Dasar', {});

    expect(key).toBe('kamus:detail:kata%20dasar:g-20:next:');
  });

  it('hapusCacheDetailKamus no-op untuk indeks kosong dan memanggil delKey untuk indeks valid', async () => {
    await hapusCacheDetailKamus('   ');
    await hapusCacheDetailKamus(undefined);
    await hapusCacheDetailKamus('Kata Dasar');

    expect(delKey).toHaveBeenCalledTimes(1);
    expect(delKey).toHaveBeenCalledWith('kamus:detail:kata%20dasar');
  });

  it('mengembalikan null jika indeks kosong', async () => {
    const result = await ambilDetailKamus('   ');

    expect(result).toBeNull();
    expect(ModelEntri.ambilEntriPerIndeks).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika indeks undefined', async () => {
    const result = await ambilDetailKamus(undefined);

    expect(result).toBeNull();
    expect(ModelEntri.ambilEntriPerIndeks).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika indeks tidak ditemukan', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([]);

    const result = await ambilDetailKamus('keras (1)');

    expect(ModelEntri.ambilEntriPerIndeks).toHaveBeenCalledWith('keras');
    expect(result).toBeNull();
  });

  it('mengembalikan hasil dari cache tanpa query model saat cache tersedia', async () => {
    getJson.mockResolvedValue({ indeks: 'kata', entri: [] });

    const result = await ambilDetailKamus('kata');

    expect(result).toEqual({ indeks: 'kata', entri: [] });
    expect(ModelEntri.ambilEntriPerIndeks).not.toHaveBeenCalled();
  });

  it('mengembalikan detail multi-entri berdasarkan indeks dengan makna/contoh/subentri', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 1,
        entri: 'aktif (1)',
        indeks: 'aktif',
        created_at: '2026-02-17 10:20:30.000',
        updated_at: '2026-02-18 10:20:30.000',
        homonim: 1,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: 'ak.tif',
        lafal: 'aktif',
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
      {
        id: 2,
        entri: 'aktif (2)',
        indeks: 'aktif',
        homonim: 2,
        urutan: 2,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: '→',
        entri_rujuk: 'aktivasi',
        entri_rujuk_indeks: 'aktivasi-indeks',
      },
    ]);
    ModelEntri.ambilMakna
      .mockResolvedValueOnce([{ id: 10, makna: 'giat', kelas_kata: 'adjektiva' }])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilContoh
      .mockResolvedValueOnce([{ id: 100, makna_id: 10, contoh: 'ia sangat aktif' }])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilSubentri
      .mockResolvedValueOnce([{ id: 3, entri: 'mengaktifkan', indeks: 'aktif', jenis: 'turunan' }])
      .mockResolvedValueOnce([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({
      sinonim: 'aktif;giat',
      antonim: 'pasif',
    });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([
      { indonesia: 'zat aktif', asing: 'active substance' }
    ]);
    ModelEntri.ambilNavigasiIndeks.mockResolvedValue({
      prev: { indeks: 'akti', label: 'akti' },
      next: { indeks: 'aktifisme', label: 'aktifisme' },
    });

    const result = await ambilDetailKamus('aktif');

    expect(result.indeks).toBe('aktif');
    expect(result.entri).toHaveLength(2);
    expect(result.entri[0].created_at).toBe('2026-02-17 10:20:30.000');
    expect(result.entri[0].updated_at).toBe('2026-02-18 10:20:30.000');
    expect(result.entri[0].makna).toHaveLength(1);
    expect(result.entri[0].makna[0].contoh).toHaveLength(1);
    expect(result.entri[0].subentri.turunan).toHaveLength(1);
    expect(result.entri[1].rujukan).toBe(true);
    expect(result.entri[1].entri_rujuk_indeks).toBe('aktivasi-indeks');
    expect(ModelEntri.ambilIndeksValidBatch).toHaveBeenCalledWith(['giat', 'aktif', 'pasif', 'zat aktif']);
    expect(result.tautan_makna_valid).toEqual([]);
    expect(result.tautan_indonesia_valid).toEqual([]);
    expect(result.tesaurus).toEqual({ sinonim: ['aktif', 'giat'], antonim: ['pasif'] });
    expect(result.glosarium).toEqual([{ indonesia: 'zat aktif', asing: 'active substance' }]);
    expect(result.navigasi).toEqual({
      prev: { indeks: 'akti', label: 'akti' },
      next: { indeks: 'aktifisme', label: 'aktifisme' },
    });
  });

  it('mengumpulkan kandidat tautan makna yang valid secara batch', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 71,
        entri: 'uji',
        indeks: 'uji',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([
      { id: 710, makna: 'kata; dua kata; tiga kata penuh; *miring*; kata (cak)' },
    ]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue(['kata', 'dua kata']);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('uji');

    expect(ModelEntri.ambilIndeksValidBatch).toHaveBeenCalledWith(['kata', 'dua kata']);
    expect(result.tautan_makna_valid).toEqual(['kata', 'dua kata']);
  });

  it('menggabungkan kandidat tautan dari makna dan tesaurus dalam satu lookup batch', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 72,
        entri: 'uji-tesaurus',
        indeks: 'uji-tesaurus',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 720, makna: 'kata' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({ sinonim: 'dua kata;kata', antonim: 'lawan' });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue(['kata', 'dua kata', 'lawan']);

    const result = await ambilDetailKamus('uji-tesaurus');

    expect(ModelEntri.ambilIndeksValidBatch).toHaveBeenCalledWith(['kata', 'dua kata', 'lawan']);
    expect(result.tautan_makna_valid).toEqual(['kata', 'dua kata', 'lawan']);
  });

  it('menyertakan tautan_indonesia_valid untuk cuplikan glosarium di detail kamus', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 73,
        entri: 'uji-glosarium',
        indeks: 'uji-glosarium',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([
      { indonesia: 'istilah; data (ark)', asing: 'term' },
    ]);
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue(['istilah']);

    const result = await ambilDetailKamus('uji-glosarium');

    expect(ModelEntri.ambilIndeksValidBatch).toHaveBeenCalledWith(['istilah', 'data']);
    expect(result.tautan_indonesia_valid).toEqual(['istilah']);
  });

  it('meminta navigasi indeks tetangga dengan indeks yang sudah ternormalisasi', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 200,
        entri: 'keras',
        indeks: 'keras',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    await ambilDetailKamus('keras (2)');

    expect(ModelEntri.ambilNavigasiIndeks).toHaveBeenCalledWith('keras');
  });

  it('membangun entri_rujuk_indeks dari entri_rujuk saat indeks rujuk tidak tersedia', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 111,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: '→',
        entri_rujuk: 'aktivasi (2)',
        entri_rujuk_indeks: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('aktif');

    expect(result.entri[0].entri_rujuk_indeks).toBe('aktivasi');
  });

  it('memasukkan bentuk tidak baku ke subentri saat tersedia', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 61,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([
      { id: 62, entri: 'aktip', indeks: 'aktif', jenis: 'bentuk_tidak_baku' },
    ]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('aktif');

    expect(result.entri[0].subentri.bentuk_tidak_baku).toEqual([
      { id: 62, entri: 'aktip', indeks: 'aktif', jenis: 'bentuk_tidak_baku' },
    ]);
  });

  it('helper privat kata hari ini menormalkan tanggal, hash, dan payload ringkas', () => {
    expect(__private.parseTanggalReferensi('2026-03-31')).toBe('2026-03-31');
    expect(__private.parseTanggalReferensi('invalid')).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(__private.buatCacheKeyKataHariIni('2026-03-31')).toBe('kamus:kata-hari-ini:2026-03-31');
    expect(__private.hashTanggal('2026-03-31')).toBeGreaterThan(0);
    expect(__private.normalisasiCuplikan('  satu   dua  ', 20)).toBe('satu dua');
    expect(__private.normalisasiCuplikan('a'.repeat(30), 10)).toBe('aaaaaaa...');
    expect(__private.buatUrlDetailKamus(' aktif (2) ')).toBe('/kamus/detail/aktif');

    const payload = __private.bentukPayloadKataHariIni({
      indeks: 'aktif',
      entri: [{
        entri: 'aktif',
        homonim: 2,
        pemenggalan: 'ak.tif',
        lafal: 'aktif',
        etimologi: [{ bahasa: 'Arab', kata_asal: 'faal' }],
        makna: [
          { makna: 'giat', kelas_kata: 'a', contoh: [{ contoh: 'Ia aktif.' }] },
          { makna: 'terlibat', kelas_kata: 'a', contoh: [{ contoh: 'Ia aktif bermusyawarah.' }] },
        ],
      }],
    }, '2026-03-31');

    expect(payload).toEqual({
      tanggal: '2026-03-31',
      indeks: 'aktif',
      entri: 'aktif',
      homonim: 2,
      url: '/kamus/detail/aktif',
      kelas_kata: 'a',
      makna: 'giat',
      contoh: 'Ia aktif.',
      daftar_makna: [
        { makna: 'giat', contoh: 'Ia aktif.' },
        { makna: 'terlibat', contoh: 'Ia aktif bermusyawarah.' },
      ],
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
      etimologi: {
        bahasa: 'Arab',
        bahasa_kode: null,
        kata_asal: 'faal',
        sumber: null,
        sumber_kode: null,
      },
    });
  });

  it('hapusCacheKataHariIni no-op untuk tanggal kosong dan menghapus cache tanggal valid', async () => {
    await __private.hapusCacheKataHariIni('   ');
    await __private.hapusCacheKataHariIni(undefined);
    await __private.hapusCacheKataHariIni('2026-03-31');

    expect(delKey).toHaveBeenCalledTimes(1);
    expect(delKey).toHaveBeenCalledWith('kamus:kata-hari-ini:2026-03-31');
  });

  it('ambilKataHariIni mengembalikan data dari cache saat tersedia', async () => {
    getJson.mockResolvedValueOnce({ tanggal: '2026-03-31', indeks: 'aktif' });

    const result = await ambilKataHariIni({ tanggal: '2026-03-31' });

    expect(result).toEqual({ tanggal: '2026-03-31', indeks: 'aktif' });
    expect(ModelKataHariIni.ambilByTanggal).not.toHaveBeenCalled();
    expect(ModelEntri.hitungKandidatKataHariIni).not.toHaveBeenCalled();
  });

  it('ambilKataHariIni memakai data tabel saat arsip tanggal sudah ada', async () => {
    ModelKataHariIni.ambilByTanggal.mockResolvedValueOnce({
      id: 1,
      tanggal: '2026-03-31',
      entri_id: 1,
      indeks: 'aktif',
      entri: 'aktif',
      sumber: 'admin',
    });
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 1,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: 'ak.tif',
        lafal: 'aktif',
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 10, makna: 'giat', kelas_kata: 'a' }]);
    ModelEntri.ambilContoh.mockResolvedValue([{ id: 100, makna_id: 10, contoh: 'Ia aktif.' }]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelEtimologi.ambilAktifPublikByEntriId.mockResolvedValue([{ bahasa: 'Arab', kata_asal: 'faal' }]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilKataHariIni({ tanggal: '2026-03-31' });

    expect(ModelKataHariIni.ambilByTanggal).toHaveBeenCalledWith('2026-03-31');
    expect(ModelEntri.hitungKandidatKataHariIni).not.toHaveBeenCalled();
    expect(result).toEqual({
      tanggal: '2026-03-31',
      indeks: 'aktif',
      entri: 'aktif',
      homonim: null,
      makna: 'giat',
      url: '/kamus/detail/aktif',
      kelas_kata: 'a',
      contoh: 'Ia aktif.',
      daftar_makna: [{ makna: 'giat', contoh: 'Ia aktif.' }],
      pemenggalan: 'ak.tif',
      lafal: 'aktif',
      etimologi: {
        bahasa: 'Arab',
        bahasa_kode: null,
        kata_asal: 'faal',
        sumber: null,
        sumber_kode: null,
      },
    });
    expect(setJson).toHaveBeenCalledWith('kamus:kata-hari-ini:2026-03-31', expect.any(Object), 900);
  });

  it('ambilKataHariIni mengembalikan null jika tanggal belum di-generate', async () => {
    const result = await ambilKataHariIni({ tanggal: '2026-03-31' });

    expect(result).toBeNull();
    expect(ModelKataHariIni.ambilByTanggal).toHaveBeenCalledWith('2026-03-31');
    expect(ModelEntri.hitungKandidatKataHariIni).not.toHaveBeenCalled();
  });

  it('ambilKataHariIni mengembalikan null jika arsip ada tetapi payload detail gagal dibentuk', async () => {
    ModelKataHariIni.ambilByTanggal.mockResolvedValueOnce({
      tanggal: '2026-03-31',
      entri_id: 1,
      indeks: 'aktif',
    });
    ModelEntri.ambilEntriPerIndeks.mockResolvedValueOnce([
      {
        id: 1,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValueOnce([]);
    ModelEntri.ambilContoh.mockResolvedValueOnce([]);
    ModelEntri.ambilSubentri.mockResolvedValueOnce([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValueOnce([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValueOnce([]);
    ModelTesaurus.ambilDetail.mockResolvedValueOnce(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValueOnce([]);

    await expect(ambilKataHariIni({ tanggal: '2026-03-31' })).resolves.toBeNull();
    expect(setJson).not.toHaveBeenCalledWith('kamus:kata-hari-ini:2026-03-31', expect.anything(), expect.anything());
  });

  it('generateKataHariIni memilih kandidat deterministik dan menyimpan ke tabel', async () => {
    const offset = __private.hashTanggal('2026-03-31') % 5;
    const kandidatPool = Array.from({ length: 5 }, (_, index) => (
      index === offset
        ? { indeks: 'aktif', entri_id: 1 }
        : { indeks: `cadangan-${index}`, entri_id: index + 10 }
    ));
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce(kandidatPool);
    ModelKataHariIni.simpanByTanggal.mockResolvedValue({ id: 1, tanggal: '2026-03-31', entri_id: 1, indeks: 'aktif', entri: 'aktif', sumber: 'auto' });

    const result = await generateKataHariIni({ tanggal: '2026-03-31' });

    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledWith({ requireEtimologi: true });
    expect(ModelKataHariIni.simpanByTanggal).toHaveBeenCalledWith({
      tanggal: '2026-03-31',
      entriId: 1,
      sumber: 'auto',
    });
    expect(result).toEqual({
      tanggal: '2026-03-31',
      indeks: 'aktif',
    });
  });

  it('generateKataHariIni mengembalikan arsip yang sudah ada tanpa menghitung kandidat baru', async () => {
    ModelKataHariIni.ambilByTanggal.mockResolvedValueOnce({
      tanggal: '2026-04-07',
      indeks: 'arsip-lama',
    });

    await expect(generateKataHariIni({ tanggal: '2026-04-07' })).resolves.toEqual({
      tanggal: '2026-04-07',
      indeks: 'arsip-lama',
    });

    expect(ModelEntri.ambilDaftarKandidatKataHariIni).not.toHaveBeenCalled();
  });

  it('generateKataHariIni mengembalikan null jika tidak ada kandidat dengan etimologi', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([]);

    const result = await generateKataHariIni({ tanggal: '2026-04-01' });

    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledWith({ requireEtimologi: true });
    expect(result).toBeNull();
  });

  it('helper privat pilihKandidatKataHariIniOtomatis mengembalikan entriId dan payload', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([{ indeks: 'aktif' }]);
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 7,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 70, makna: 'giat', kelas_kata: 'a' }]);
    ModelEntri.ambilContoh.mockResolvedValue([{ id: 700, makna_id: 70, contoh: 'Ia aktif.' }]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelEtimologi.ambilAktifPublikByEntriId.mockResolvedValue([{ bahasa: 'Arab', kata_asal: 'faal' }]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await __private.pilihKandidatKataHariIniOtomatis('2026-03-31');

    expect(result).toMatchObject({
      entriId: 7,
      payload: {
        indeks: 'aktif',
        makna: 'giat',
      },
    });
  });

  it('helper privat pilihKandidatRingan mengembalikan null untuk kandidat tanpa indeks atau entri_id valid', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([{ entri_id: 9 }]);

    await expect(__private.pilihKandidatRingan('2026-03-31')).resolves.toBeNull();

    __private.resetCacheKandidatAcak();
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([{ indeks: 'aktif', entri_id: 0 }]);

    await expect(__private.pilihKandidatRingan('2026-03-31')).resolves.toBeNull();
  });

  it('helper privat pilihKandidatKataHariIniOtomatis mengembalikan null saat pool kosong', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([]);

    await expect(__private.pilihKandidatKataHariIniOtomatis('2026-04-03')).resolves.toBeNull();
  });

  it('helper privat pilihKandidatKataHariIniOtomatis melewati kandidat invalid sampai habis', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([
      null,
      { indeks: 'kosong-detail', entri_id: 2 },
      { indeks: 'tanpa-makna', entri_id: 3 },
    ]);
    ModelEntri.ambilEntriPerIndeks
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([
        {
          id: 30,
          entri: 'tanpa-makna',
          indeks: 'tanpa-makna',
          homonim: null,
          jenis: 'dasar',
          pemenggalan: null,
          lafal: null,
          varian: null,
          jenis_rujuk: null,
          entri_rujuk: null,
        },
      ]);
    ModelEntri.ambilMakna.mockResolvedValueOnce([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    await expect(__private.pilihKandidatKataHariIniOtomatis('2026-04-04')).resolves.toBeNull();
  });

  it('helper privat pilihKandidatKataHariIniOtomatis melewati payload valid tanpa entriId', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([
      { indeks: 'tanpa-id', entri_id: 3 },
    ]);
    ModelEntri.ambilEntriPerIndeks.mockResolvedValueOnce([
      {
        entri: '',
        indeks: 'tanpa-id',
        homonim: null,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValueOnce([{ makna: 'ada makna', kelas_kata: null }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    await expect(__private.pilihKandidatKataHariIniOtomatis('2026-04-05')).resolves.toBeNull();
  });

  it('generateKataHariIni mengembalikan null jika tidak ada kandidat sama sekali', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([]);

    const result = await generateKataHariIni({ tanggal: '2026-04-02' });

    expect(result).toBeNull();
    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledTimes(1);
  });

  it('ambilEntriAcak memilih kandidat acak tanpa syarat etimologi', async () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.5);
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([
      { indeks: 'satu', entri_id: 1 },
      { indeks: 'dua', entri_id: 2 },
      { indeks: 'tiga', entri_id: 3 },
      { indeks: 'Aktif (2)', entri_id: 4 },
      { indeks: 'lima', entri_id: 5 },
      { indeks: 'enam', entri_id: 6 },
    ]);

    const result = await ambilEntriAcak();

    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledWith({ requireEtimologi: false });
    expect(result).toEqual({
      indeks: 'Aktif',
      url: '/kamus/detail/Aktif',
    });
    Math.random.mockRestore();
  });

  it('ambilEntriAcak mencoba offset berikutnya saat kandidat pertama kosong', async () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0.25);
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([
      { indeks: 'nol', entri_id: 1 },
      null,
      { indeks: 'acak', entri_id: 3 },
      { indeks: 'tiga', entri_id: 4 },
    ]);

    const result = await ambilEntriAcak();

    expect(result).toEqual({
      indeks: 'acak',
      url: '/kamus/detail/acak',
    });
    Math.random.mockRestore();
  });

  it('ambilEntriAcak mengembalikan null jika semua percobaan menghasilkan indeks tidak valid', async () => {
    jest.spyOn(Math, 'random').mockReturnValueOnce(0);
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([
      { indeks: '', entri_id: 1 },
      { indeks: '   ', entri_id: 2 },
      null,
    ]);

    await expect(ambilEntriAcak()).resolves.toBeNull();
    Math.random.mockRestore();
  });

  it('ambilEntriAcak mengembalikan null jika tidak ada kandidat', async () => {
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([]);

    const result = await ambilEntriAcak();

    expect(result).toBeNull();
    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledWith({ requireEtimologi: false });
  });

  it('ambilEntriAcak memakai cache pool kandidat antar panggilan', async () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    ModelEntri.ambilDaftarKandidatKataHariIni.mockResolvedValueOnce([{ indeks: 'acak', entri_id: 1 }]);

    const pertama = await ambilEntriAcak();
    const kedua = await ambilEntriAcak();

    expect(ModelEntri.ambilDaftarKandidatKataHariIni).toHaveBeenCalledTimes(1);
    expect(pertama).toEqual({ indeks: 'acak', url: '/kamus/detail/acak' });
    expect(kedua).toEqual({ indeks: 'acak', url: '/kamus/detail/acak' });
    Math.random.mockRestore();
  });

  it('mengembalikan page info glosarium dari mode cursor object', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 90,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue({
      data: [{ indonesia: 'zat aktif', asing: 'active substance' }],
      total: 12,
      hasPrev: true,
      hasNext: true,
      prevCursor: 'prev-1',
      nextCursor: 'next-1',
    });

    const result = await ambilDetailKamus('aktif', {
      glosariumLimit: 10,
      glosariumCursor: 'cursor-1',
      glosariumDirection: 'prev',
    });

    expect(ModelGlosarium.cariFrasaMengandungKataUtuh).toHaveBeenCalledWith('aktif', {
      limit: 10,
      cursor: 'cursor-1',
      direction: 'prev',
      hitungTotal: true,
    });
    expect(result.glosarium).toEqual([{ indonesia: 'zat aktif', asing: 'active substance' }]);
    expect(result.glosarium_page).toEqual({
      total: 12,
      hasPrev: true,
      hasNext: true,
      prevCursor: 'prev-1',
      nextCursor: 'next-1',
    });
  });

  it('mengembalikan fallback page info glosarium saat field cursor object kosong', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 91,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue({});

    const result = await ambilDetailKamus('aktif');

    expect(result.glosarium).toEqual([]);
    expect(result.glosarium_page).toEqual({
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('membersihkan relasi kosong dan menghapus duplikasi tanpa beda kapitalisasi', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 12,
        entri: 'aktif',
        indeks: 'aktif',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 121, makna: 'giat' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({
      sinonim: 'Aktif; aktif ; ; GIAT;giat',
      antonim: null,
    });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('aktif');

    expect(result.tesaurus).toEqual({ sinonim: ['Aktif', 'GIAT'], antonim: [] });
  });

  it('mengembalikan tesaurus kosong saat detail tesaurus tidak tersedia', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 15,
        entri: 'nol-tesaurus',
        indeks: 'nol-tesaurus',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 151, makna: 'arti' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('nol-tesaurus');

    expect(result.tesaurus).toEqual({ sinonim: [], antonim: [] });
  });

  it('menurunkan entri varian ke subentri induk dan tidak menampilkannya sebagai entri utama', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 10,
        entri: 'be-',
        indeks: 'be',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        induk: null,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
      {
        id: 11,
        entri: 'be-',
        indeks: 'be',
        homonim: null,
        urutan: 2,
        jenis: 'varian',
        induk: 10,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);

    ModelEntri.ambilMakna
      .mockResolvedValueOnce([{ id: 1001, makna: 'imbuhan' }])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilContoh
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilSubentri
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilRantaiInduk
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ id: 99, entri: 'ber-', indeks: 'ber' }]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('be-');

    expect(result.entri).toHaveLength(1);
    expect(result.entri[0].jenis).toBe('dasar');
    expect(result.entri[0].subentri.varian).toEqual([
      expect.objectContaining({ id: 11, entri: 'be-', jenis: 'varian' }),
    ]);
  });

  it('tidak menduplikasi varian jika subentri induk sudah memuat varian yang sama', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 20,
        entri: 'kata',
        indeks: 'kata',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        induk: null,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
      {
        id: 21,
        entri: 'kata',
        indeks: 'kata',
        homonim: null,
        urutan: 2,
        jenis: 'varian',
        induk: 20,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna
      .mockResolvedValueOnce([{ id: 201, makna: 'arti' }])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilContoh
      .mockResolvedValueOnce([
        { id: 1, makna_id: 201, contoh: 'contoh 1' },
        { id: 2, makna_id: 201, contoh: 'contoh 2' },
      ])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilSubentri
      .mockResolvedValueOnce([
        { id: 30, entri: 'berkata', indeks: 'kata', jenis: 'turunan' },
        { id: 31, entri: 'perkata', indeks: 'kata', jenis: 'turunan' },
        { id: 21, entri: 'kata', indeks: 'kata', jenis: 'varian' },
      ])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({ sinonim: '', antonim: '' });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('kata');

    expect(result.entri).toHaveLength(1);
    expect(result.entri[0].makna[0].contoh).toHaveLength(2);
    expect(result.entri[0].subentri.turunan).toHaveLength(2);
    expect(result.entri[0].subentri.varian).toHaveLength(1);
    expect(result.entri[0].subentri.varian[0].id).toBe(21);
  });

  it('mengembalikan entri varian jika tidak ada induk non-varian yang cocok', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 40,
        entri: 'xbe',
        indeks: 'xbe',
        homonim: null,
        urutan: 1,
        jenis: 'varian',
        induk: 999,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 401, makna: 'varian' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([{ id: 999, entri: 'be', indeks: 'be' }]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('xbe');

    expect(result.entri).toHaveLength(1);
    expect(result.entri[0]).toEqual(expect.objectContaining({ id: 40, jenis: 'varian' }));
  });

  it('memakai fallback array kosong saat ambilAktifPublikByEntriId mengembalikan null', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 70,
        entri: 'tes-etimologi',
        indeks: 'tes-etimologi',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);
    ModelEtimologi.ambilAktifPublikByEntriId.mockResolvedValue(null);

    const result = await ambilDetailKamus('tes-etimologi');

    expect(result.entri[0].etimologi).toEqual([]);
  });

  it('memakai fallback array kosong saat ambilTagarEntri mengembalikan null', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 72,
        entri: 'tes-tagar',
        indeks: 'tes-tagar',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);
    ModelTagar.ambilTagarEntri.mockResolvedValue(null);

    const result = await ambilDetailKamus('tes-tagar');

    expect(result.entri[0].tagar).toEqual([]);
  });

  it('memakai fallback array kosong saat rantai induk nullish', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 71,
        entri: 'tes-induk',
        indeks: 'tes-induk',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
    ]);
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilBentukTidakBakuByRujukId.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue(undefined);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('tes-induk');

    expect(result.entri[0].induk).toEqual([]);
  });

  it('melewati varian saat induk tidak ditemukan di peta induk non-varian', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 50,
        entri: 'akar',
        indeks: 'akar',
        homonim: null,
        urutan: 1,
        jenis: 'dasar',
        induk: null,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: null,
        entri_rujuk: null,
      },
      {
        id: 51,
        entri: null,
        indeks: 'akar',
        homonim: null,
        urutan: 2,
        jenis: 'varian',
        induk: 999,
        pemenggalan: null,
        lafal: null,
        varian: null,
        jenis_rujuk: '→',
        entri_rujuk: '--',
      },
    ]);
    ModelEntri.ambilMakna
      .mockResolvedValueOnce([{ id: 501, makna: 'arti akar' }])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilContoh
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilSubentri
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    ModelEntri.ambilRantaiInduk
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({ sinonim: 'akar', antonim: '' });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('akar');

    expect(result.entri).toHaveLength(1);
    expect(result.entri[0]).toEqual(expect.objectContaining({ id: 50, jenis: 'dasar' }));
    expect(result.entri[0].subentri.varian).toBeUndefined();
  });
});

