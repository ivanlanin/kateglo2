/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/layananKamusPublik.js
 */

jest.mock('../../models/modelLema', () => ({
  cariLema: jest.fn(),
  ambilLema: jest.fn(),
  ambilMakna: jest.fn(),
  ambilContoh: jest.fn(),
  ambilSublema: jest.fn(),
  ambilInduk: jest.fn(),
  ambilTerjemahan: jest.fn()
}));

jest.mock('../../models/modelTesaurus', () => ({
  ambilDetail: jest.fn()
}));

jest.mock('../../models/modelGlosarium', () => ({
  cariFrasaMengandungKataUtuh: jest.fn()
}));

const ModelLema = require('../../models/modelLema');
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
    expect(ModelLema.cariLema).not.toHaveBeenCalled();
  });

  it('mengembalikan kosong jika query undefined', async () => {
    const result = await cariKamus(undefined);

    expect(result).toEqual({ data: [], total: 0 });
    expect(ModelLema.cariLema).not.toHaveBeenCalled();
  });

  it('meneruskan query trim dengan opsi default', async () => {
    ModelLema.cariLema.mockResolvedValue({ data: [{ lema: 'kata' }], total: 1 });

    const result = await cariKamus(' kata ');

    expect(ModelLema.cariLema).toHaveBeenCalledWith('kata', 100, 0);
    expect(result).toEqual({ data: [{ lema: 'kata' }], total: 1 });
  });

  it('meneruskan opsi limit dan offset', async () => {
    ModelLema.cariLema.mockResolvedValue({ data: [], total: 0 });

    await cariKamus('kata', { limit: 33, offset: 7 });

    expect(ModelLema.cariLema).toHaveBeenCalledWith('kata', 33, 7);
  });
});

describe('layananKamusPublik.ambilDetailKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan null jika entri kosong', async () => {
    const result = await ambilDetailKamus('   ');

    expect(result).toBeNull();
    expect(ModelLema.ambilLema).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika entri undefined', async () => {
    const result = await ambilDetailKamus(undefined);

    expect(result).toBeNull();
    expect(ModelLema.ambilLema).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika lema tidak ditemukan', async () => {
    ModelLema.ambilLema.mockResolvedValue(null);

    const result = await ambilDetailKamus('kata');

    expect(ModelLema.ambilLema).toHaveBeenCalledWith('kata');
    expect(result).toBeNull();
  });

  it('mengembalikan rujukan jika lema adalah rujukan', async () => {
    ModelLema.ambilLema.mockResolvedValue({
      id: 1, lema: 'abadiat', jenis: 'dasar',
      jenis_rujuk: '→', lema_rujuk: 'abadiah'
    });

    const result = await ambilDetailKamus('abadiat');

    expect(result.rujukan).toBe(true);
    expect(result.lema_rujuk).toBe('abadiah');
  });

  it('mengembalikan detail lengkap dengan makna dan contoh', async () => {
    ModelLema.ambilLema.mockResolvedValue({
      id: 1, lema: 'aktif', jenis: 'dasar', induk: null,
      pemenggalan: 'ak.tif', lafal: 'aktif', varian: null,
      jenis_rujuk: null, lema_rujuk: null
    });
    ModelLema.ambilMakna.mockResolvedValue([
      { id: 10, makna: 'giat', kelas_kata: 'adjektiva', contoh: [] }
    ]);
    ModelLema.ambilContoh.mockResolvedValue([
      { id: 100, makna_id: 10, contoh: 'ia sangat aktif' }
    ]);
    ModelLema.ambilSublema.mockResolvedValue([
      { id: 2, lema: 'mengaktifkan', jenis: 'berimbuhan' }
    ]);
    ModelLema.ambilInduk.mockResolvedValue(null);
    ModelLema.ambilTerjemahan.mockResolvedValue([{ translation: 'active' }]);
    ModelTesaurus.ambilDetail.mockResolvedValue({
      sinonim: 'aktif;giat',
      antonim: 'pasif',
      turunan: null,
      gabungan: '',
      berkaitan: null,
    });
    ModelGlosarium.cariFrasaMengandungKataUtuh.mockResolvedValue([
      { phrase: 'zat aktif', original: 'active substance' }
    ]);

    const result = await ambilDetailKamus('aktif');

    expect(result.rujukan).toBe(false);
    expect(result.lema).toBe('aktif');
    expect(result.makna).toHaveLength(1);
    expect(result.makna[0].contoh).toHaveLength(1);
    expect(result.sublema.berimbuhan).toHaveLength(1);
    expect(result.terjemahan).toHaveLength(1);
    expect(result.tesaurus).toEqual({ sinonim: ['aktif', 'giat'], antonim: ['pasif'] });
    expect(result.glosarium).toEqual([{ phrase: 'zat aktif', original: 'active substance' }]);
  });

  it('mendekode entri URL dan menyusun induk jika tersedia', async () => {
    ModelLema.ambilLema.mockResolvedValue({
      id: 4,
      lema: 'kata dasar',
      jenis: 'dasar',
      induk: 2,
      pemenggalan: 'ka.ta',
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      lema_rujuk: null,
    });
    ModelLema.ambilMakna.mockResolvedValue([
      { id: 11, makna: 'arti pertama' },
      { id: 12, makna: 'arti kedua' },
    ]);
    ModelLema.ambilContoh.mockResolvedValue([{ id: 1, makna_id: 11, contoh: 'contoh 1' }]);
    ModelLema.ambilSublema.mockResolvedValue([
      { id: 7, jenis: 'idiom', lema: 'idiom a' },
      { id: 8, jenis: 'idiom', lema: 'idiom b' },
      { id: 9, jenis: 'gabungan', lema: 'gabungan a' },
    ]);
    ModelLema.ambilInduk.mockResolvedValue({ id: 2, lema: 'akar' });
    ModelLema.ambilTerjemahan.mockResolvedValue([]);

    const result = await ambilDetailKamus('kata%20dasar');

    expect(ModelLema.ambilLema).toHaveBeenCalledWith('kata dasar');
    expect(ModelLema.ambilContoh).toHaveBeenCalledWith([11, 12]);
    expect(result.induk).toEqual({ id: 2, lema: 'akar' });
    expect(result.makna[0].contoh).toEqual([{ id: 1, makna_id: 11, contoh: 'contoh 1' }]);
    expect(result.makna[1].contoh).toEqual([]);
    expect(result.sublema.idiom).toHaveLength(2);
    expect(result.sublema.gabungan).toHaveLength(1);
  });

  it('mengelompokkan banyak contoh untuk makna yang sama', async () => {
    ModelLema.ambilLema.mockResolvedValue({
      id: 1,
      lema: 'aktif',
      jenis: 'dasar',
      induk: null,
      pemenggalan: 'ak.tif',
      lafal: null,
      varian: null,
      jenis_rujuk: null,
      lema_rujuk: null,
    });
    ModelLema.ambilMakna.mockResolvedValue([{ id: 10, makna: 'giat' }]);
    ModelLema.ambilSublema.mockResolvedValue([]);
    ModelLema.ambilInduk.mockResolvedValue(null);
    ModelLema.ambilTerjemahan.mockResolvedValue([]);
    ModelLema.ambilContoh.mockResolvedValue([
      { id: 100, makna_id: 10, contoh: 'contoh 1' },
      { id: 101, makna_id: 10, contoh: 'contoh 2' },
    ]);

    const result = await ambilDetailKamus('aktif');

    expect(result.makna[0].contoh).toHaveLength(2);
  });
});
