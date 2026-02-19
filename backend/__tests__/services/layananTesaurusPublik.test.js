/**
 * @fileoverview Test layananTesaurusPublik
 * @tested_in backend/services/layananTesaurusPublik.js
 */

jest.mock('../../models/modelTesaurus', () => ({
  cariCursor: jest.fn(),
  ambilDetail: jest.fn(),
}));

const ModelTesaurus = require('../../models/modelTesaurus');
const { cariTesaurus, ambilDetailTesaurus } = require('../../services/layananTesaurusPublik');

describe('layananTesaurusPublik.cariTesaurus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan kosong bila query kosong', async () => {
    const result = await cariTesaurus('   ');

    expect(result).toEqual({ data: [], total: 0, hasNext: false, hasPrev: false });
    expect(ModelTesaurus.cariCursor).not.toHaveBeenCalled();
  });

  it('mengembalikan kosong bila query undefined', async () => {
    const result = await cariTesaurus(undefined);

    expect(result).toEqual({ data: [], total: 0, hasNext: false, hasPrev: false });
    expect(ModelTesaurus.cariCursor).not.toHaveBeenCalled();
  });

  it('meneruskan query trim beserta opsi', async () => {
    ModelTesaurus.cariCursor.mockResolvedValue({ data: [{ indeks: 'aktif' }], total: 1, hasNext: false, hasPrev: false });

    const result = await cariTesaurus(' aktif ', { limit: 25, cursor: 'abc', direction: 'prev', lastPage: true });

    expect(ModelTesaurus.cariCursor).toHaveBeenCalledWith('aktif', {
      limit: 25,
      cursor: 'abc',
      direction: 'prev',
      lastPage: true,
      hitungTotal: true,
    });
    expect(result.total).toBe(1);
  });
});

describe('layananTesaurusPublik.ambilDetailTesaurus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mengembalikan null bila kata kosong', async () => {
    const result = await ambilDetailTesaurus('  ');

    expect(result).toBeNull();
    expect(ModelTesaurus.ambilDetail).not.toHaveBeenCalled();
  });

  it('mengembalikan null bila kata undefined', async () => {
    const result = await ambilDetailTesaurus(undefined);

    expect(result).toBeNull();
    expect(ModelTesaurus.ambilDetail).not.toHaveBeenCalled();
  });

  it('mengembalikan null bila entri tidak ditemukan', async () => {
    ModelTesaurus.ambilDetail.mockResolvedValue(null);

    const result = await ambilDetailTesaurus('aktif');

    expect(ModelTesaurus.ambilDetail).toHaveBeenCalledWith('aktif');
    expect(result).toBeNull();
  });

  it('memetakan detail dan mem-parse relasi', async () => {
    ModelTesaurus.ambilDetail.mockResolvedValue({
      indeks: 'aktif',
      sinonim: ' giat ; rajin ; ',
      antonim: '',
    });

    const result = await ambilDetailTesaurus('aktif%20sekali');

    expect(ModelTesaurus.ambilDetail).toHaveBeenCalledWith('aktif sekali');
    expect(result).toEqual({
      indeks: 'aktif',
      sinonim: ['giat', 'rajin'],
      antonim: [],
    });
  });
});
