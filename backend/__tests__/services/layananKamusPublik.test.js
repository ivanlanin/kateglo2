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

const ModelLema = require('../../models/modelLema');
const { cariKamus, ambilDetailKamus } = require('../../services/layananKamusPublik');

describe('layananKamusPublik.cariKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan array kosong jika query kosong', async () => {
    const result = await cariKamus('   ', 20);

    expect(result).toEqual([]);
    expect(ModelLema.cariLema).not.toHaveBeenCalled();
  });

  it('menormalisasi limit dan meneruskan query trim', async () => {
    ModelLema.cariLema.mockResolvedValue([{ lema: 'kata' }]);

    const result = await cariKamus(' kata ', '999');

    expect(ModelLema.cariLema).toHaveBeenCalledWith('kata', 50);
    expect(result).toEqual([{ lema: 'kata' }]);
  });

  it('memakai fallback limit 20 saat limit bukan angka', async () => {
    ModelLema.cariLema.mockResolvedValue([{ lema: 'kata' }]);

    await cariKamus('kata', 'abc');

    expect(ModelLema.cariLema).toHaveBeenCalledWith('kata', 20);
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

    const result = await ambilDetailKamus('aktif');

    expect(result.rujukan).toBe(false);
    expect(result.lema).toBe('aktif');
    expect(result.makna).toHaveLength(1);
    expect(result.makna[0].contoh).toHaveLength(1);
    expect(result.sublema.berimbuhan).toHaveLength(1);
    expect(result.terjemahan).toHaveLength(1);
  });
});
