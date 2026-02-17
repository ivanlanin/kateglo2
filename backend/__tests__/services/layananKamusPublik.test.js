/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/layananKamusPublik.js
 */

jest.mock('../../models/modelEntri', () => {
  const cariEntri = jest.fn();
  const ambilEntri = jest.fn();
  return {
    cariEntri,
    ambilEntri,
    ambilMakna: jest.fn(),
    ambilContoh: jest.fn(),
    ambilSubentri: jest.fn(),
    ambilInduk: jest.fn(),
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

  it('mengembalikan null jika entri kosong', async () => {
    const result = await ambilDetailKamus('   ');

    expect(result).toBeNull();
    expect(ModelEntri.ambilEntri).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika entri undefined', async () => {
    const result = await ambilDetailKamus(undefined);

    expect(result).toBeNull();
    expect(ModelEntri.ambilEntri).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika lema tidak ditemukan', async () => {
    ModelEntri.ambilEntri.mockResolvedValue(null);

    const result = await ambilDetailKamus('kata');

    expect(ModelEntri.ambilEntri).toHaveBeenCalledWith('kata');
    expect(result).toBeNull();
  });

  it('mengembalikan rujukan jika lema adalah rujukan', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 1, entri: 'abadiat', jenis: 'dasar',
      jenis_rujuk: '→', entri_rujuk: 'abadiah'
    });

    const result = await ambilDetailKamus('abadiat');

    expect(result.rujukan).toBe(true);
    expect(result.entri_rujuk).toBe('abadiah');
  });

  it('mengembalikan detail lengkap dengan makna dan contoh', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 1, entri: 'aktif', jenis: 'dasar', induk: null,
      pemenggalan: 'ak.tif', lafal: 'aktif', varian: null,
      jenis_rujuk: null, entri_rujuk: null
    });
    ModelEntri.ambilMakna.mockResolvedValue([
      { id: 10, makna: 'giat', kelas_kata: 'adjektiva', contoh: [] }
    ]);
    ModelEntri.ambilContoh.mockResolvedValue([
      { id: 100, makna_id: 10, contoh: 'ia sangat aktif' }
    ]);
    ModelEntri.ambilSubentri.mockResolvedValue([
      { id: 2, entri: 'mengaktifkan', jenis: 'turunan' }
    ]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({
      sinonim: 'aktif;giat',
      antonim: 'pasif',
      turunan: null,
      gabungan: '',
      berkaitan: null,
    });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([
      { indonesia: 'zat aktif', asing: 'active substance' }
    ]);

    const result = await ambilDetailKamus('aktif');

    expect(result.rujukan).toBe(false);
    expect(result.entri).toBe('aktif');
    expect(result.makna).toHaveLength(1);
    expect(result.makna[0].contoh).toHaveLength(1);
    expect(result.subentri.turunan).toHaveLength(1);
    expect(result.tesaurus).toEqual({ sinonim: ['aktif', 'giat'], antonim: ['pasif'] });
    expect(result.glosarium).toEqual([{ indonesia: 'zat aktif', asing: 'active substance' }]);
  });

  it('mendekode entri URL dan menyusun induk jika tersedia', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 4,
      entri: 'kata dasar',
      jenis: 'dasar',
      induk: 2,
      pemenggalan: 'ka.ta',
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      entri_rujuk: null,
    });
    ModelEntri.ambilMakna.mockResolvedValue([
      { id: 11, makna: 'arti pertama' },
      { id: 12, makna: 'arti kedua' },
    ]);
    ModelEntri.ambilContoh.mockResolvedValue([{ id: 1, makna_id: 11, contoh: 'contoh 1' }]);
    ModelEntri.ambilSubentri.mockResolvedValue([
      { id: 7, jenis: 'idiom', entri: 'idiom a' },
      { id: 8, jenis: 'idiom', entri: 'idiom b' },
      { id: 9, jenis: 'gabungan', entri: 'gabungan a' },
    ]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([{ id: 2, entri: 'akar' }]);

    const result = await ambilDetailKamus('kata%20dasar');

    expect(ModelEntri.ambilEntri).toHaveBeenCalledWith('kata dasar');
    expect(ModelEntri.ambilContoh).toHaveBeenCalledWith([11, 12]);
    expect(result.induk).toEqual([{ id: 2, entri: 'akar' }]);
    expect(result.makna[0].contoh).toEqual([{ id: 1, makna_id: 11, contoh: 'contoh 1' }]);
    expect(result.makna[1].contoh).toEqual([]);
    expect(result.subentri.idiom).toHaveLength(2);
    expect(result.subentri.gabungan).toHaveLength(1);
  });

  it('mengelompokkan banyak contoh untuk makna yang sama', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 1,
      entri: 'aktif',
      jenis: 'dasar',
      induk: null,
      pemenggalan: 'ak.tif',
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      entri_rujuk: null,
    });
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 10, makna: 'giat' }]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([
      { id: 100, makna_id: 10, contoh: 'contoh 1' },
      { id: 101, makna_id: 10, contoh: 'contoh 2' },
    ]);

    const result = await ambilDetailKamus('aktif');

    expect(result.makna[0].contoh).toHaveLength(2);
  });

  it('membersihkan relasi kosong dan menghapus duplikasi tanpa beda kapitalisasi', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 12,
      entri: 'aktif',
      jenis: 'dasar',
      induk: null,
      pemenggalan: null,
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      entri_rujuk: null,
    });
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 121, makna: 'giat' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue({
      sinonim: 'Aktif; aktif ; ; GIAT;giat',
      antonim: null,
    });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('aktif');

    expect(result.tesaurus).toEqual({ sinonim: ['Aktif', 'GIAT'], antonim: [] });
  });

  it('mengembalikan tesaurus kosong saat detail tesaurus tidak tersedia', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 15,
      entri: 'nol-tesaurus',
      jenis: 'dasar',
      induk: null,
      pemenggalan: null,
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      entri_rujuk: null,
    });
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 151, makna: 'arti' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('nol-tesaurus');

    expect(result.tesaurus).toEqual({ sinonim: [], antonim: [] });
  });

  it('menyusun rantai induk multi-level (dasar > turunan > gabungan)', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 60,
      entri: 'berlatih tanding',
      jenis: 'gabungan',
      induk: 61,
      pemenggalan: null,
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      entri_rujuk: null,
    });
    ModelEntri.ambilMakna.mockResolvedValue([{ id: 601, makna: 'berlatih untuk bertanding' }]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([
      { id: 62, entri: 'latih' },
      { id: 61, entri: 'berlatih' },
    ]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('berlatih tanding');

    expect(result.induk).toEqual([
      { id: 62, entri: 'latih' },
      { id: 61, entri: 'berlatih' },
    ]);
  });

  it('mengembalikan induk null jika rantai induk kosong', async () => {
    ModelEntri.ambilEntri.mockResolvedValue({
      id: 70,
      entri: 'rumah',
      jenis: 'dasar',
      induk: null,
      pemenggalan: null,
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      entri_rujuk: null,
    });
    ModelEntri.ambilMakna.mockResolvedValue([]);
    ModelEntri.ambilContoh.mockResolvedValue([]);
    ModelEntri.ambilSubentri.mockResolvedValue([]);
    ModelEntri.ambilRantaiInduk.mockResolvedValue([]);
    ModelTesaurus.ambilDetail.mockResolvedValue(null);
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([]);

    const result = await ambilDetailKamus('rumah');

    expect(result.induk).toBeNull();
  });
});
