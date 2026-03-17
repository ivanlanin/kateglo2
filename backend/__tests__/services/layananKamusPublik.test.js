/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/layananKamusPublik.js
 */

jest.mock('../../models/leksikon/modelEntri', () => {
  const cariEntri = jest.fn();
  const cariEntriCursor = jest.fn();
  const ambilEntriPerIndeks = jest.fn();
  const ambilIndeksValidBatch = jest.fn();
  const ambilNavigasiIndeks = jest.fn();
  return {
    cariEntri,
    cariEntriCursor,
    ambilEntriPerIndeks,
    ambilIndeksValidBatch,
    ambilNavigasiIndeks,
    ambilMakna: jest.fn(),
    ambilContoh: jest.fn(),
    ambilSubentri: jest.fn(),
    ambilBentukTidakBakuByRujukId: jest.fn(),
    ambilRantaiInduk: jest.fn(),
  };
});

jest.mock('../../models/leksikon/modelTesaurus', () => ({
  ambilDetail: jest.fn()
}));

jest.mock('../../models/leksikon/modelGlosarium', () => ({
  cariFrasaMengandungKataUtuh: jest.fn()
}));

jest.mock('../../models/leksikon/modelEtimologi', () => ({
  ambilAktifPublikByEntriId: jest.fn(),
}));

jest.mock('../../models/master/modelTagar', () => ({
  ambilTagarEntri: jest.fn(),
}));

jest.mock('../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  delKey: jest.fn(),
  getTtlSeconds: jest.fn(() => 900),
}));

const ModelEntri = require('../../models/leksikon/modelEntri');
const ModelTesaurus = require('../../models/leksikon/modelTesaurus');
const ModelGlosarium = require('../../models/leksikon/modelGlosarium');
const ModelEtimologi = require('../../models/leksikon/modelEtimologi');
const ModelTagar = require('../../models/master/modelTagar');
const { getJson, setJson, delKey } = require('../../services/layananCache');
const {
  cariKamus,
  ambilDetailKamus,
  hapusCacheDetailKamus,
  buatCacheKeyDetailKamus,
  __private,
} = require('../../services/layananKamusPublik');

describe('layananKamusPublik.cariKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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
    expect(__private.kumpulkanKandidatTautanGlosarium()).toEqual([]);
    expect(__private.kumpulkanKandidatTautanGlosarium([{}])).toEqual([]);
    expect(__private.kumpulkanKandidatTautanGlosarium([{ indonesia: 'kata (cak); dua kata' }])).toEqual(['kata', 'dua kata']);
    expect(__private.parseDaftarRelasi()).toEqual([]);
    expect(__private.parseDaftarRelasi('a; b; ')).toEqual(['a', 'b']);
    expect(__private.unikTanpaBedaKapitalisasi(['Kata', 'kata', 'Lawan'])).toEqual(['Kata', 'Lawan']);
    expect(__private.unikTanpaBedaKapitalisasi([])).toEqual([]);
  });
});

describe('layananKamusPublik.ambilDetailKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    delKey.mockResolvedValue(undefined);
    ModelEntri.ambilIndeksValidBatch.mockResolvedValue([]);
    ModelEntri.ambilNavigasiIndeks.mockResolvedValue({ prev: null, next: null });
    ModelEtimologi.ambilAktifPublikByEntriId.mockResolvedValue([]);
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

