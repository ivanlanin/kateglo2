/**
 * @fileoverview Test model korpus Leipzig.
 * @tested_in backend/models/leipzig/modelKorpus.js
 */

jest.mock('../../../db/leipzig', () => ({
  listAvailableCorpora: jest.fn(),
  normalizeCorpusId: jest.fn((value) => String(value || '').trim()),
}));

const LeipzigDb = require('../../../db/leipzig');
const ModelKorpus = require('../../../models/leipzig/modelKorpus');

describe('models/leipzig/modelKorpus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    LeipzigDb.listAvailableCorpora.mockReturnValue([
      { id: 'ind_news_2024_10K', label: 'News 2024 (10K)' },
      { id: 'ind_wikipedia_2021_1M', label: 'Wikipedia 2021 (1M)' },
    ]);
  });

  it('mengembalikan daftar korpus tersedia', async () => {
    const result = await ModelKorpus.ambilDaftarTersedia();
    expect(result).toHaveLength(2);
  });

  it('mengembalikan detail korpus yang cocok', async () => {
    const result = await ModelKorpus.ambilDetail('ind_wikipedia_2021_1M');
    expect(result).toEqual({ id: 'ind_wikipedia_2021_1M', label: 'Wikipedia 2021 (1M)' });
  });

  it('mengembalikan null jika id kosong atau tidak ditemukan', async () => {
    LeipzigDb.normalizeCorpusId.mockReturnValueOnce('');
    expect(await ModelKorpus.ambilDetail('')).toBeNull();
    expect(await ModelKorpus.ambilDetail('ind_web_2024_10K')).toBeNull();
  });
});