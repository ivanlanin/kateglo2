/**
 * @fileoverview Test layananKamusPublik
 * @tested_in backend/services/layananKamusPublik.js
 */

jest.mock('../../models/modelFrasa', () => ({
  cariKamus: jest.fn(),
  ambilFrasa: jest.fn(),
  ambilDefinisi: jest.fn(),
  ambilRelasi: jest.fn(),
  ambilPeribahasa: jest.fn(),
  ambilTerjemahan: jest.fn(),
  ambilTautan: jest.fn(),
  ambilKataDasar: jest.fn()
}));

const ModelFrasa = require('../../models/modelFrasa');
const { cariKamus, ambilDetailKamus } = require('../../services/layananKamusPublik');

describe('layananKamusPublik.cariKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan array kosong jika query kosong', async () => {
    const result = await cariKamus('   ', 20);

    expect(result).toEqual([]);
    expect(ModelFrasa.cariKamus).not.toHaveBeenCalled();
  });

  it('menormalisasi limit dan meneruskan query trim', async () => {
    ModelFrasa.cariKamus.mockResolvedValue([{ phrase: 'kata' }]);

    const result = await cariKamus(' kata ', '999');

    expect(ModelFrasa.cariKamus).toHaveBeenCalledWith('kata', 50);
    expect(result).toEqual([{ phrase: 'kata' }]);
  });

  it('memakai fallback limit 20 saat limit bukan angka', async () => {
    ModelFrasa.cariKamus.mockResolvedValue([{ phrase: 'kata' }]);

    await cariKamus('kata', 'abc');

    expect(ModelFrasa.cariKamus).toHaveBeenCalledWith('kata', 20);
  });

  it('memakai fallback limit 20 saat limit <= 0', async () => {
    ModelFrasa.cariKamus.mockResolvedValue([{ phrase: 'kata' }]);

    await cariKamus('kata', 0);

    expect(ModelFrasa.cariKamus).toHaveBeenCalledWith('kata', 20);
  });

  it('mempertahankan limit valid di dalam rentang', async () => {
    ModelFrasa.cariKamus.mockResolvedValue([{ phrase: 'kata' }]);

    await cariKamus('kata', 7);

    expect(ModelFrasa.cariKamus).toHaveBeenCalledWith('kata', 7);
  });
});

describe('layananKamusPublik.ambilDetailKamus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan null jika slug kosong', async () => {
    const result = await ambilDetailKamus('   ');

    expect(result).toBeNull();
    expect(ModelFrasa.ambilFrasa).not.toHaveBeenCalled();
  });

  it('mengembalikan null jika entri tidak ditemukan', async () => {
    ModelFrasa.ambilFrasa.mockResolvedValue(null);

    const result = await ambilDetailKamus('kata');

    expect(ModelFrasa.ambilFrasa).toHaveBeenCalledWith('kata');
    expect(result).toBeNull();
  });

  it('mengembalikan detail lengkap dan mengelompokkan relasi', async () => {
    ModelFrasa.ambilFrasa.mockResolvedValue({
      phrase: 'aktif',
      actual_phrase: 'aktif',
      lex_class: 'adj',
      lex_class_name: 'adjektiva',
      phrase_type: 'dasar',
      phrase_type_name: 'dasar',
      pronounciation: 'ak-tif',
      etymology: null,
      info: null,
      notes: null,
      ref_source: 'kbbi',
      ref_source_name: 'KBBI'
    });
    ModelFrasa.ambilDefinisi.mockResolvedValue([{ def_text: 'giat' }]);
    ModelFrasa.ambilRelasi.mockResolvedValue([
      { rel_type: 's', rel_type_name: 'Sinonim', related_phrase: 'giat' },
      { rel_type: 's', rel_type_name: 'Sinonim', related_phrase: 'gesit' },
      { rel_type: 'a', rel_type_name: 'Antonim', related_phrase: 'malas' }
    ]);
    ModelFrasa.ambilPeribahasa.mockResolvedValue([{ proverb: 'rajin pangkal pandai' }]);
    ModelFrasa.ambilTerjemahan.mockResolvedValue([{ translation: 'active' }]);
    ModelFrasa.ambilTautan.mockResolvedValue([{ url: 'https://contoh.test' }]);
    ModelFrasa.ambilKataDasar.mockResolvedValue(['aktif']);

    const result = await ambilDetailKamus('aktif%20');

    expect(ModelFrasa.ambilFrasa).toHaveBeenCalledWith('aktif ');
    expect(ModelFrasa.ambilDefinisi).toHaveBeenCalledWith('aktif');
    expect(result.relasi.s.daftar).toEqual(['giat', 'gesit']);
    expect(result.relasi.a.daftar).toEqual(['malas']);
    expect(result.namaSumber).toBe('KBBI');
  });

  it('menggunakan phrase asli jika actual_phrase tidak ada dan fallback nama relasi ke key', async () => {
    ModelFrasa.ambilFrasa.mockResolvedValue({
      phrase: 'uji',
      actual_phrase: null,
      lex_class: 'n',
      lex_class_name: 'nomina'
    });
    ModelFrasa.ambilDefinisi.mockResolvedValue([]);
    ModelFrasa.ambilRelasi.mockResolvedValue([
      { rel_type: 'x', rel_type_name: '', related_phrase: 'contoh' }
    ]);
    ModelFrasa.ambilPeribahasa.mockResolvedValue([]);
    ModelFrasa.ambilTerjemahan.mockResolvedValue([]);
    ModelFrasa.ambilTautan.mockResolvedValue([]);
    ModelFrasa.ambilKataDasar.mockResolvedValue([]);

    const result = await ambilDetailKamus('uji');

    expect(ModelFrasa.ambilDefinisi).toHaveBeenCalledWith('uji');
    expect(result.relasi.x.nama).toBe('x');
    expect(result.relasi.x.daftar).toEqual(['contoh']);
  });
});
