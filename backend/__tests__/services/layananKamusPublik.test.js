/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/layananKamusPublik.js
 */

jest.mock('../../models/modelEntri', () => {
  const cariEntri = jest.fn();
  const ambilEntriPerIndeks = jest.fn();
  return {
    cariEntri,
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

const ModelEntri = require('../../models/modelEntri');
const ModelTesaurus = require('../../models/modelTesaurus');
const ModelGlosarium = require('../../models/modelGlosarium');
const { cariKamus, ambilDetailKamus } = require('../../services/layananKamusPublik');

describe('layananKamusPublik.cariKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);
  });

  it('mengembalikan array kosong jika query kosong', async () => {
    const result = await cariKamus('   ');

    expect(result).toEqual({ data: [], total: 0 });
    expect(ModelEntri.cariEntri).not.toHaveBeenCalled();
  });

  it('mengembalikan kosong jika query undefined', async () => {
    const result = await cariKamus(undefined);

    expect(result).toEqual({ data: [], total: 0 });
    expect(ModelEntri.cariEntri).not.toHaveBeenCalled();
  });

  it('meneruskan query trim dengan opsi default', async () => {
    ModelEntri.cariEntri.mockResolvedValue({ data: [{ entri: 'kata' }], total: 1 });

    const result = await cariKamus(' kata ');

    expect(ModelEntri.cariEntri).toHaveBeenCalledWith('kata', 100, 0);
    expect(result).toEqual({ data: [{ entri: 'kata' }], total: 1 });
  });

  it('meneruskan opsi limit dan offset', async () => {
    ModelEntri.cariEntri.mockResolvedValue({ data: [], total: 0 });

    await cariKamus('kata', { limit: 33, offset: 7 });

    expect(ModelEntri.cariEntri).toHaveBeenCalledWith('kata', 33, 7);
  });
});

describe('layananKamusPublik.ambilDetailKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('mengembalikan detail multi-entri berdasarkan indeks dengan makna/contoh/subentri', async () => {
    ModelEntri.ambilEntriPerIndeks.mockResolvedValue([
      {
        id: 1,
        entri: 'aktif (1)',
        indeks: 'aktif',
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
});
