/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/layananKamusPublik.js
 */

jest.mock('../../models/modelEntri', () => {
  const cariEntri = jest.fn();
  const cariEntriCursor = jest.fn();
  const ambilEntriPerIndeks = jest.fn();
  return {
    cariEntri,
    cariEntriCursor,
    ambilEntriPerIndeks,
    ambilMakna: jest.fn(),
    ambilContoh: jest.fn(),
    ambilSubentri: jest.fn(),
    ambilRantaiInduk: jest.fn(),
  };
});

jest.mock('../../models/modelTesaurus', () => ({
  ambilDetail: jest.fn()
}));

jest.mock('../../models/modelGlosarium', () => ({
  cariFrasaMengandungKataUtuh: jest.fn()
}));

jest.mock('../../services/layananCache', () => ({
  getJson: jest.fn(),
  setJson: jest.fn(),
  delKey: jest.fn(),
  getTtlSeconds: jest.fn(() => 900),
}));

const ModelEntri = require('../../models/modelEntri');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelGlosarium = require('../../models/modelGlosarium');
const { getJson, setJson, delKey } = require('../../services/layananCache');
const {
  cariKamus,
  ambilDetailKamus,
  hapusCacheDetailKamus,
  buatCacheKeyDetailKamus,
} = require('../../services/layananKamusPublik');

describe('layananKamusPublik.cariKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    delKey.mockResolvedValue(undefined);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);
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
});

describe('layananKamusPublik.ambilDetailKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    getJson.mockResolvedValue(null);
    setJson.mockResolvedValue(undefined);
    delKey.mockResolvedValue(undefined);
  });

  it('membuat cache key detail kamus dalam huruf kecil ter-encode', () => {
    expect(buatCacheKeyDetailKamus('Kata Dasar')).toBe('kamus:detail:kata%20dasar');
  });

  it('membuat cache key aman saat indeks undefined', () => {
    expect(buatCacheKeyDetailKamus()).toBe('kamus:detail:');
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

    const result = await ambilDetailKamus('aktif');

    expect(result.indeks).toBe('aktif');
    expect(result.entri).toHaveLength(2);
    expect(result.entri[0].created_at).toBe('2026-02-17 10:20:30.000');
    expect(result.entri[0].updated_at).toBe('2026-02-18 10:20:30.000');
    expect(result.entri[0].makna).toHaveLength(1);
    expect(result.entri[0].makna[0].contoh).toHaveLength(1);
    expect(result.entri[0].subentri.turunan).toHaveLength(1);
    expect(result.entri[1].rujukan).toBe(true);
    expect(result.entri[1].entri_rujuk_indeks).toBe('aktivasi');
    expect(result.tesaurus).toEqual({ sinonim: ['aktif', 'giat'], antonim: ['pasif'] });
    expect(result.glosarium).toEqual([{ indonesia: 'zat aktif', asing: 'active substance' }]);
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
