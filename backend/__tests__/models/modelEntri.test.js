/**
 * @fileoverview Test ModelEntri
 * @tested_in backend/models/modelEntri.js
 */

jest.mock('../../db/autocomplete', () => jest.fn());

const db = require('../../db');
const autocomplete = require('../../db/autocomplete');
const { encodeCursor } = require('../../utils/cursorPagination');
const ModelEntri = require('../../models/modelEntri');
const {
  normalizeBoolean,
  normalisasiIndeks,
  parseNullableInteger,
} = require('../../models/modelEntri').__private;

describe('ModelEntri', () => {
  beforeEach(() => {
    db.query.mockReset();
    autocomplete.mockReset();
  });

  it('autocomplete meneruskan parameter ke shared helper', async () => {
    autocomplete.mockResolvedValue(['kata', 'kata kerja']);

    const result = await ModelEntri.autocomplete('kat', 12);

    expect(autocomplete).toHaveBeenCalledWith('entri', 'indeks', 'kat', {
      limit: 12,
      extraWhere: 'aktif = 1',
    });
    expect(result).toEqual(['kata', 'kata kerja']);
  });

  it('autocomplete memakai limit default', async () => {
    autocomplete.mockResolvedValue([]);

    await ModelEntri.autocomplete('kat');

    expect(autocomplete).toHaveBeenCalledWith('entri', 'indeks', 'kat', {
      limit: 8,
      extraWhere: 'aktif = 1',
    });
  });

  it('contohAcak melakukan clamp limit dan mengembalikan indeks', async () => {
    db.query.mockResolvedValue({ rows: [{ indeks: 'kata' }, { indeks: 'frasa' }] });

    const result = await ModelEntri.contohAcak(99);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY RANDOM()'), [10]);
    expect(result).toEqual(['kata', 'frasa']);
  });

  it('contohAcak memakai fallback limit default saat tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelEntri.contohAcak(0);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [5]);
  });

  it('contohAcak mempertahankan limit valid tanpa clamp', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelEntri.contohAcak(3);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [3]);
  });

  it('contohAcak memakai argumen default saat limit tidak diberikan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelEntri.contohAcak();

    expect(db.query).toHaveBeenCalledWith(expect.any(String), [5]);
  });

  it('cariIndukAdmin mengembalikan kosong saat query kosong', async () => {
    expect(await ModelEntri.cariIndukAdmin('')).toEqual([]);
    expect(await ModelEntri.cariIndukAdmin('   ')).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('cariIndukAdmin menerapkan excludeId valid dan clamp limit maksimum', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 3, entri: 'latih' }] });

    const result = await ModelEntri.cariIndukAdmin('lat', { limit: 99, excludeId: 3 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('e.id <> $4'),
      ['lat', 'lat%', '%lat%', 3, 20]
    );
    expect(result).toEqual([{ id: 3, entri: 'latih' }]);
  });

  it('cariIndukAdmin mengabaikan excludeId tidak valid dan memakai fallback limit default', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelEntri.cariIndukAdmin('lat', { limit: 'abc', excludeId: 'x' });

    expect(db.query).toHaveBeenCalledWith(
      expect.not.stringContaining('e.id <> $4'),
      ['lat', 'lat%', '%lat%', 8]
    );
  });

  it('cariEntri mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelEntri.cariEntri(' zzz ', 10, 5);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['zzz', 'zzz%', '%zzz%']
    );
    expect(result).toEqual({ data: [], total: 0, hasNext: false });
  });

  it('cariEntri menormalisasi query serta clamp limit dan offset', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ total: '3' }],
      })
      .mockResolvedValueOnce({
        rows: [{ id: 1, entri: 'kata', jenis: 'dasar' }],
      });

    const result = await ModelEntri.cariEntri('  kata  ', '999', '-3');

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM hasil'),
      ['kata', 'kata%', '%kata%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 200, 0]
    );
    expect(result).toEqual({ data: [{ id: 1, entri: 'kata', jenis: 'dasar' }], total: 3, hasNext: true });
  });

  it('cariEntri tanpa hitungTotal memakai limit+1 untuk menentukan hasNext', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, entri: 'a' },
        { id: 2, entri: 'b' },
        { id: 3, entri: 'c' },
      ],
    });

    const result = await ModelEntri.cariEntri('kata', 2, 4, false);

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 3, 4]
    );
    expect(result).toEqual({
      data: [{ id: 1, entri: 'a' }, { id: 2, entri: 'b' }],
      total: 7,
      hasNext: true,
    });
  });

  it('cariEntri tanpa hitungTotal mengembalikan hasNext false saat baris tidak melebihi limit', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, entri: 'a' },
        { id: 2, entri: 'b' },
      ],
    });

    const result = await ModelEntri.cariEntri('kata', 5, 4, false);

    expect(result).toEqual({
      data: [{ id: 1, entri: 'a' }, { id: 2, entri: 'b' }],
      total: 6,
      hasNext: false,
    });
  });

  it('cariMakna mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelEntri.cariMakna('tidak-ada');

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('cariMakna next dengan cursor menghasilkan hasPrev true dan hasNext true', async () => {
    const cursor = encodeCursor({ entri: 'beta', homografSort: 2, id: 12 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '7' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 13, entri: 'charlie', indeks: 'charlie', homograf: 1, homonim: 1, homograf_sort: 1, makna_cocok: [] },
          { id: 14, entri: 'delta', indeks: 'delta', homograf: 2, homonim: 2, homograf_sort: 2, makna_cocok: [] },
          { id: 15, entri: 'echo', indeks: 'echo', homograf: 3, homonim: 3, homograf_sort: 3, makna_cocok: [] },
        ],
      });

    const result = await ModelEntri.cariMakna('kata', { limit: 2, cursor, direction: 'next' });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('WHERE (entri, homograf_sort, id) > ($2, $3, $4)'),
      ['%kata%', 'beta', 2, 12, 3]
    );
    expect(result.data).toHaveLength(2);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('cariMakna prev tanpa hitungTotal membalik urutan dan set hasNext berdasarkan cursor', async () => {
    const cursor = encodeCursor({ entri: 'kata', homografSort: 10, id: 22 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 21, entri: 'gamma', indeks: 'gamma', homograf: 2, homonim: 2, homograf_sort: 2, makna_cocok: [] },
        { id: 20, entri: 'beta', indeks: 'beta', homograf: 1, homonim: 1, homograf_sort: 1, makna_cocok: [] },
        { id: 19, entri: 'alpha', indeks: 'alpha', homograf: 1, homonim: 1, homograf_sort: 1, makna_cocok: [] },
      ],
    });

    const result = await ModelEntri.cariMakna('kata', {
      limit: 2,
      cursor,
      direction: 'prev',
      hitungTotal: false,
    });

    expect(result.data).toEqual([
      { id: 20, entri: 'beta', indeks: 'beta', homograf: 1, homonim: 1, makna_cocok: [] },
      { id: 21, entri: 'gamma', indeks: 'gamma', homograf: 2, homonim: 2, makna_cocok: [] },
    ]);
    expect(result.total).toBe(0);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariMakna lastPage mengatur hasNext false dan hasPrev berdasar total', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 3, entri: 'c', indeks: 'c', homograf: 1, homonim: 1, homograf_sort: 1, makna_cocok: [] },
          { id: 2, entri: 'b', indeks: 'b', homograf: 1, homonim: 1, homograf_sort: 1, makna_cocok: [] },
        ],
      });

    const result = await ModelEntri.cariMakna('kata', { limit: 2, lastPage: true });

    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('cariMakna memakai fallback limit 100 dan cursor payload default', async () => {
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, entri: 'a', indeks: 'a', homograf: null, homonim: null, homograf_sort: 2147483647, makna_cocok: [] },
      ],
    });

    const result = await ModelEntri.cariMakna('kata', {
      limit: 0,
      hitungTotal: false,
      cursor,
      direction: 'next',
      lastPage: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (entri, homograf_sort, id) > ($2, $3, $4)'),
      ['%kata%', '', 2147483647, 0, 101]
    );
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  it('cariMakna menghasilkan cursor null saat baris data kosong', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelEntri.cariMakna('kata', {
      limit: 3,
      hitungTotal: false,
    });

    expect(result.prevCursor).toBeNull();
    expect(result.nextCursor).toBeNull();
  });

  it('cariRima mengembalikan seksi kosong saat kata terlalu pendek', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelEntri.cariRima('a');

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      indeks: 'a',
      pemenggalan: null,
      rima_akhir: {
        pola: null,
        data: [],
        total: 0,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      },
      rima_awal: {
        pola: null,
        data: [],
        total: 0,
        hasPrev: false,
        hasNext: false,
        prevCursor: null,
        nextCursor: null,
      },
    });
  });

  it('cariRima memakai pemenggalan dan pagination next dengan hasMore', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'aktif', pemenggalan: 'ak.tif' }] })
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'positif' }, { indeks: 'pasif' }, { indeks: 'relatif' }] })
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'akrab' }, { indeks: 'aksen' }] });

    const result = await ModelEntri.cariRima('aktif', { limit: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE LOWER(indeks) = $1 AND aktif = 1'),
      ['aktif']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('COUNT(DISTINCT indeks)'),
      ['%tif', 'aktif']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('ORDER BY indeks ASC'),
      ['%tif', 'aktif', 3]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      4,
      expect.stringContaining('COUNT(DISTINCT indeks)'),
      ['ak%', 'aktif']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('ORDER BY indeks ASC'),
      ['ak%', 'aktif', 3]
    );
    expect(result.rima_akhir.pola).toBe('tif');
    expect(result.rima_akhir.total).toBe(5);
    expect(result.rima_akhir.data).toEqual([{ indeks: 'positif' }, { indeks: 'pasif' }]);
    expect(result.rima_akhir.hasPrev).toBe(false);
    expect(result.rima_akhir.hasNext).toBe(true);
    expect(result.rima_awal.pola).toBe('ak');
    expect(result.rima_awal.total).toBe(4);
    expect(result.rima_awal.hasPrev).toBe(false);
    expect(result.rima_awal.hasNext).toBe(false);
  });

  it('cariRima mode prev memakai cursor dan membalik urutan hasil', async () => {
    const cursorAkhir = encodeCursor({ indeks: 'zulu' });
    const cursorAwal = encodeCursor({ indeks: 'zebra' });
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'zeta' }, { indeks: 'yoga' }, { indeks: 'xeno' }] })
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'zeta' }, { indeks: 'yeti' }] });

    const result = await ModelEntri.cariRima('KATA', {
      limit: 2,
      cursorAkhir,
      directionAkhir: 'prev',
      cursorAwal,
      directionAwal: 'prev',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('ORDER BY indeks DESC'),
      ['%ta', 'kata', 'zulu', 3]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      5,
      expect.stringContaining('ORDER BY indeks DESC'),
      ['ka%', 'kata', 'zebra', 3]
    );
    expect(result.indeks).toBe('kata');
    expect(result.pemenggalan).toBeNull();
    expect(result.rima_akhir.pola).toBe('ta');
    expect(result.rima_akhir.data).toEqual([{ indeks: 'yoga' }, { indeks: 'zeta' }]);
    expect(result.rima_akhir.hasPrev).toBe(true);
    expect(result.rima_akhir.hasNext).toBe(true);
    expect(result.rima_awal.pola).toBe('ka');
    expect(result.rima_awal.data).toEqual([{ indeks: 'yeti' }, { indeks: 'zeta' }]);
    expect(result.rima_awal.hasPrev).toBe(false);
    expect(result.rima_awal.hasNext).toBe(true);
  });

  it('cariRima mode next dengan cursor mengatur hasPrev true dan hasNext false saat tanpa hasMore', async () => {
    const cursorAkhir = encodeCursor({ indeks: 'kasa' });
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'kata', pemenggalan: null }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'kota' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ indeks: 'kala' }] });

    const result = await ModelEntri.cariRima('kata', {
      limit: '0',
      cursorAkhir,
      directionAkhir: 'next',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('AND LOWER(indeks) > $3'),
      ['%ta', 'kata', 'kasa', 51]
    );
    expect(result.rima_akhir.hasPrev).toBe(true);
    expect(result.rima_akhir.hasNext).toBe(false);
  });

  it('cariRima menghasilkan cursor null saat hasil rima kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ indeks: 'kata', pemenggalan: null }] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelEntri.cariRima('kata', { limit: 2 });

    expect(result.rima_akhir.prevCursor).toBeNull();
    expect(result.rima_akhir.nextCursor).toBeNull();
    expect(result.rima_awal.prevCursor).toBeNull();
    expect(result.rima_awal.nextCursor).toBeNull();
  });

  it('cariEntriCursor mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelEntri.cariEntriCursor('kata');

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      data: [],
      total: 0,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('cariEntriCursor next dengan cursor menerapkan where tuple dan hasMore', async () => {
    const cursor = encodeCursor({ prioritas: 1, homografSort: 2, homonimSort: 3, entri: 'kata', id: 1 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            entri: 'kata a',
            indeks: 'kata a',
            homograf: 1,
            homonim: 1,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 1,
            homograf_sort: 1,
            homonim_sort: 1,
          },
          {
            id: 3,
            entri: 'kata b',
            indeks: 'kata b',
            homograf: 2,
            homonim: 2,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 2,
            homograf_sort: 2,
            homonim_sort: 2,
          },
          {
            id: 4,
            entri: 'kata c',
            indeks: 'kata c',
            homograf: 3,
            homonim: 3,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 2,
            homograf_sort: 3,
            homonim_sort: 3,
          },
        ],
      });

    const result = await ModelEntri.cariEntriCursor('kata', {
      limit: 2,
      cursor,
      direction: 'next',
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('(prioritas, homograf_sort, homonim_sort, entri, id) > ($4, $5, $6, $7, $8)'),
      ['kata', 'kata%', '%kata%', 1, 2, 3, 'kata', 1, 3]
    );
    expect(result.data).toHaveLength(2);
    expect(result.data[0]).not.toHaveProperty('prioritas');
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('cariEntriCursor prev tanpa hitungTotal membalik urutan hasil', async () => {
    const cursor = encodeCursor({ prioritas: 1, homografSort: 1, homonimSort: 1, entri: 'kata', id: 9 });
    db.query.mockResolvedValueOnce({
      rows: [
        {
          id: 8,
          entri: 'kata z',
          indeks: 'kata z',
          homograf: 8,
          homonim: 8,
          jenis: 'dasar',
          lafal: null,
          jenis_rujuk: null,
          entri_rujuk: null,
          prioritas: 2,
          homograf_sort: 8,
          homonim_sort: 8,
        },
        {
          id: 7,
          entri: 'kata y',
          indeks: 'kata y',
          homograf: 7,
          homonim: 7,
          jenis: 'dasar',
          lafal: null,
          jenis_rujuk: null,
          entri_rujuk: null,
          prioritas: 1,
          homograf_sort: 7,
          homonim_sort: 7,
        },
        {
          id: 6,
          entri: 'kata x',
          indeks: 'kata x',
          homograf: 6,
          homonim: 6,
          jenis: 'dasar',
          lafal: null,
          jenis_rujuk: null,
          entri_rujuk: null,
          prioritas: 1,
          homograf_sort: 6,
          homonim_sort: 6,
        },
      ],
    });

    const result = await ModelEntri.cariEntriCursor('kata', {
      limit: 2,
      cursor,
      direction: 'prev',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('(prioritas, homograf_sort, homonim_sort, entri, id) < ($4, $5, $6, $7, $8)'),
      ['kata', 'kata%', '%kata%', 1, 1, 1, 'kata', 9, 3]
    );
    expect(result.data.map((item) => item.id)).toEqual([7, 8]);
    expect(result.total).toBe(0);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariEntriCursor lastPage menetapkan hasNext false dan hasPrev berdasarkan total', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            entri: 'kata b',
            indeks: 'kata b',
            homograf: 2,
            homonim: 2,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 1,
            homograf_sort: 2,
            homonim_sort: 2,
          },
          {
            id: 1,
            entri: 'kata a',
            indeks: 'kata a',
            homograf: 1,
            homonim: 1,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 1,
            homograf_sort: 1,
            homonim_sort: 1,
          },
        ],
      });

    const result = await ModelEntri.cariEntriCursor('kata', {
      limit: 2,
      lastPage: true,
      hitungTotal: true,
    });

    expect(result.data.map((item) => item.id)).toEqual([1, 2]);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('cariEntriCursor memakai fallback limit default saat limit tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({
        rows: [{
          id: 1,
          entri: 'kata',
          indeks: 'kata',
          homograf: null,
          homonim: null,
          jenis: 'dasar',
          lafal: null,
          jenis_rujuk: null,
          entri_rujuk: null,
          prioritas: 1,
          homograf_sort: 2147483647,
          homonim_sort: 2147483647,
        }],
      });

    await ModelEntri.cariEntriCursor('kata', { limit: 'abc' });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4'),
      ['kata', 'kata%', '%kata%', 101]
    );
  });

  it('cariEntriCursor dengan payload cursor kosong memakai fallback nilai default', async () => {
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelEntri.cariEntriCursor('kata', {
      limit: 2,
      cursor,
      direction: 'next',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('(prioritas, homograf_sort, homonim_sort, entri, id) > ($4, $5, $6, $7, $8)'),
      ['kata', 'kata%', '%kata%', 0, 2147483647, 2147483647, '', 0, 3]
    );
    expect(result.prevCursor).toBeNull();
    expect(result.nextCursor).toBeNull();
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  it('cariEntriCursor lastPage bisa memiliki hasPrev false saat total tidak melebihi data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          {
            id: 2,
            entri: 'kata b',
            indeks: 'kata b',
            homograf: 2,
            homonim: 2,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 1,
            homograf_sort: 2,
            homonim_sort: 2,
          },
          {
            id: 1,
            entri: 'kata a',
            indeks: 'kata a',
            homograf: 1,
            homonim: 1,
            jenis: 'dasar',
            lafal: null,
            jenis_rujuk: null,
            entri_rujuk: null,
            prioritas: 1,
            homograf_sort: 1,
            homonim_sort: 1,
          },
        ],
      });

    const result = await ModelEntri.cariEntriCursor('kata', { limit: 2, lastPage: true, hitungTotal: true });
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it('cariEntri memakai limit dan offset default saat argumen tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'kata' }] });

    await ModelEntri.cariEntri('kata');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('cariEntri memakai fallback saat limit atau offset bukan angka', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'kata' }] });

    await ModelEntri.cariEntri('kata', 'abc', 'xyz');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['kata', 'kata%', '%kata%', 100, 0]
    );
  });

  it('ambilEntri mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilEntri('tidak-ada');

    expect(result).toBeNull();
  });

  it('ambilEntri mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, entri: 'kata' }] });

    const result = await ModelEntri.ambilEntri('kata');

    expect(result).toEqual({ id: 1, entri: 'kata' });
  });

  it('ambilEntriPerIndeks mengembalikan rows sesuai urutan query', async () => {
    const rows = [{ id: 3, entri: 'aktif', indeks: 'aktif' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilEntriPerIndeks('aktif');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE LOWER(indeks) = LOWER($1) AND aktif = 1'),
      ['aktif']
    );
    expect(result).toEqual(rows);
  });

  it('ambilMakna mengembalikan rows', async () => {
    const rows = [{ id: 1, makna: 'arti', kelas_kata: 'nomina' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilMakna(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM makna'), [1]);
    expect(result).toEqual(rows);
  });

  it('ambilContoh mengembalikan array kosong jika tidak ada ID', async () => {
    const result = await ModelEntri.ambilContoh([]);

    expect(result).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilContoh mengembalikan rows', async () => {
    const rows = [{ id: 1, makna_id: 1, contoh: 'contoh kalimat' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilContoh([1]);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM contoh'), [[1]]);
    expect(result).toEqual(rows);
  });

  it('ambilSubentri mengembalikan rows', async () => {
    const rows = [{ id: 2, entri: 'berkata', jenis: 'turunan' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelEntri.ambilSubentri(1);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE induk = $1'), [1]);
    expect(result).toEqual(rows);
  });

  it('saranEntri mengembalikan kosong untuk input kosong/falsy', async () => {
    expect(await ModelEntri.saranEntri('')).toEqual([]);
    expect(await ModelEntri.saranEntri('   ')).toEqual([]);
    expect(await ModelEntri.saranEntri(null)).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('saranEntri menormalkan teks, clamp limit, dan mapping hasil', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ entri: 'kata' }, { entri: 'kita' }] })
      .mockResolvedValueOnce({ rows: [{ entri: 'kata' }] })
      .mockResolvedValueOnce({ rows: [{ entri: 'kata' }] });

    const maxResult = await ModelEntri.saranEntri('  kata  ', 999);
    const defaultResult = await ModelEntri.saranEntri('kata', 'abc');
    const minResult = await ModelEntri.saranEntri('kata', -2);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('similarity(entri, $1)'),
      ['kata', 20]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2'),
      ['kata', 5]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('LIMIT $2'),
      ['kata', 1]
    );
    expect(maxResult).toEqual(['kata', 'kita']);
    expect(defaultResult).toEqual(['kata']);
    expect(minResult).toEqual(['kata']);
  });

  it('ambilInduk mengembalikan null jika indukId null', async () => {
    const result = await ModelEntri.ambilInduk(null);

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilInduk mengembalikan row pertama jika ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 9, entri: 'induk', jenis: 'dasar' }] });

    const result = await ModelEntri.ambilInduk(9);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [9]);
    expect(result).toEqual({ id: 9, entri: 'induk', jenis: 'dasar' });
  });

  it('ambilInduk mengembalikan null jika ID tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilInduk(10);

    expect(result).toBeNull();
  });

  it('ambilRantaiInduk mengembalikan array kosong jika indukId falsy', async () => {
    expect(await ModelEntri.ambilRantaiInduk(null)).toEqual([]);
    expect(await ModelEntri.ambilRantaiInduk(undefined)).toEqual([]);
    expect(await ModelEntri.ambilRantaiInduk(0)).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilRantaiInduk mengembalikan rantai dari akar ke induk langsung', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 100, entri: 'latih' },
        { id: 200, entri: 'berlatih' },
      ],
    });

    const result = await ModelEntri.ambilRantaiInduk(200);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WITH RECURSIVE'),
      [200]
    );
    expect(result).toEqual([
      { id: 100, entri: 'latih' },
      { id: 200, entri: 'berlatih' },
    ]);
  });

  it('ambilRantaiInduk mengembalikan satu elemen jika induk langsung adalah akar', async () => {
    db.query.mockResolvedValue({
      rows: [{ id: 100, entri: 'latih' }],
    });

    const result = await ModelEntri.ambilRantaiInduk(100);

    expect(result).toEqual([{ id: 100, entri: 'latih' }]);
  });

  it('daftarAdmin tanpa q menghitung total dan mengambil data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'kata' }] });

    const result = await ModelEntri.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('SELECT COUNT(*) AS total FROM entri'), []);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $1 OFFSET $2'), [50, 0]);
    expect(result).toEqual({ data: [{ id: 1, entri: 'kata' }], total: 2 });
  });

  it('daftarAdmin dengan q memakai where clause', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelEntri.daftarAdmin({ q: 'kat', limit: 9, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE e.entri ILIKE $1'), ['%kat%']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), ['%kat%', 9, 2]);
  });

  it('daftarAdmin dengan filter jenis dan jenis_rujuk menambah kondisi where', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelEntri.daftarAdmin({
      q: 'kat',
      jenis: 'dasar',
      jenis_rujuk: 'lihat',
      limit: 9,
      offset: 2,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE e.entri ILIKE $1 AND e.jenis = $2 AND e.jenis_rujuk = $3'),
      ['%kat%', 'dasar', 'lihat']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $4 OFFSET $5'),
      ['%kat%', 'dasar', 'lihat', 9, 2]
    );
  });

  it('daftarAdmin dengan filter homograf dan homonim menambah kondisi IS NULL/IS NOT NULL', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelEntri.daftarAdmin({
      q: 'kat',
      punya_homograf: '1',
      punya_homonim: '0',
      limit: 5,
      offset: 1,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE e.entri ILIKE $1 AND e.homograf IS NOT NULL AND e.homonim IS NULL'),
      ['%kat%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%kat%', 5, 1]
    );
  });

  it('daftarAdmin mendukung filter aktif, homograf null, dan homonim not-null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelEntri.daftarAdmin({
      aktif: '1',
      punya_homograf: '0',
      punya_homonim: '1',
      limit: 7,
      offset: 1,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE e.aktif = 1 AND e.homograf IS NULL AND e.homonim IS NOT NULL'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [7, 1]
    );
  });

  it('daftarAdmin mendukung filter aktif=0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelEntri.daftarAdmin({ aktif: '0', limit: 5, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE e.aktif = 0'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [5, 2]
    );
  });

  it('daftarAdmin mendukung filter kelas_kata/ragam/bidang/bahasa/tipe_penyingkat dan flag ilmiah/kimia/contoh', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await ModelEntri.daftarAdmin({
      kelas_kata: 'n',
      ragam: 'cak',
      bidang: 'kim',
      bahasa: 'id',
      tipe_penyingkat: 'sing',
      punya_ilmiah: '1',
      punya_kimia: '0',
      punya_contoh: '1',
      limit: 3,
      offset: 2,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('mk.kelas_kata = $1'),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('mk.ragam = $2'),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('mk.bidang = $3'),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('mk.bahasa = $4'),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('mk.tipe_penyingkat = $5'),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('AND mk.ilmiah IS NOT NULL'),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('NOT EXISTS ('),
      ['n', 'cak', 'kim', 'id', 'sing']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('JOIN contoh c ON c.makna_id = mk.id'),
      ['n', 'cak', 'kim', 'id', 'sing', 3, 2]
    );
  });

  it('daftarAdmin mendukung kebalikan flag ilmiah/kimia/contoh', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await ModelEntri.daftarAdmin({
      punya_ilmiah: '0',
      punya_kimia: '1',
      punya_contoh: '0',
      limit: 2,
      offset: 1,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('AND mk.ilmiah IS NOT NULL'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('AND mk.kimia IS NOT NULL'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('NOT EXISTS ('),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [2, 1]
    );
  });

  it('hitungTotal mengembalikan nilai numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '31' }] });

    const result = await ModelEntri.hitungTotal();

    expect(result).toBe(31);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilDenganId(7);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 7, entri: 'kata' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.ambilDenganId(7);

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE e.id = $1'), [7]);
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 8, entri: 'kata baru' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.simpan({
      id: 8,
      entri: 'kata baru',
      jenis: 'dasar',
      induk: null,
      pemenggalan: '',
      lafal: '',
      varian: '',
      jenis_rujuk: '',
      entri_rujuk: '',
      aktif: undefined,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE entri SET entri = $1'),
      ['kata baru', 'dasar', null, null, null, null, null, null, 1, 'kata baru', null, null, null, 8]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 9, entri: 'kata' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.simpan({ entri: 'kata', jenis: 'dasar', aktif: 0 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entri'),
      ['kata', 'dasar', null, null, null, null, null, null, 0, 'kata', null, null, null]
    );
    expect(result).toEqual(row);
  });

  it('simpan insert memakai aktif default 1 jika aktif tidak diberikan', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 10 }] });

    await ModelEntri.simpan({ entri: 'kata', jenis: 'dasar' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entri'),
      ['kata', 'dasar', null, null, null, null, null, null, 1, 'kata', null, null, null]
    );
  });

  it('simpan menormalkan indeks serta parsing homonim/homograf saat input tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 12, entri: '--kata-- (2)' }] });

    await ModelEntri.simpan({
      entri: '--kata-- (2)',
      jenis: 'dasar',
      indeks: '   ',
      homograf: 'bukan-angka',
      homonim: 'bukan-angka',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO entri'),
      ['--kata-- (2)', 'dasar', null, null, null, null, null, null, 1, 'kata', null, null, null]
    );
  });

  it('simpan melempar 400 saat id sama dengan induk', async () => {
    await expect(ModelEntri.simpan({
      id: 21,
      entri: 'kata',
      jenis: 'turunan',
      induk: 21,
    })).rejects.toMatchObject({
      message: 'Induk tidak boleh sama dengan entri ini',
      status: 400,
    });

    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpan melempar 400 saat induk tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await expect(ModelEntri.simpan({
      id: 22,
      entri: 'kata',
      jenis: 'turunan',
      induk: 999,
    })).rejects.toMatchObject({
      message: 'Entri induk tidak ditemukan',
      status: 400,
    });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('WHERE id = $1'), [999]);
  });

  it('simpan menerima induk yang valid dan meneruskan nilai induk ke query', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 5, entri: 'akar', jenis: 'dasar' }] })
      .mockResolvedValueOnce({ rows: [{ id: 23, entri: 'berakar' }] });

    const result = await ModelEntri.simpan({
      entri: 'berakar',
      jenis: 'turunan',
      induk: 5,
    });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE id = $1'), [5]);
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO entri'),
      ['berakar', 'turunan', 5, null, null, null, null, null, 1, 'berakar', null, null, null]
    );
    expect(result).toEqual({ id: 23, entri: 'berakar' });
  });

  it('simpan parsing homonim/homograf null-string kosong saat non-numeric', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 13, entri: 'kata-a' }] })
      .mockResolvedValueOnce({ rows: [{ id: 14, entri: 'kata-b' }] });

    await ModelEntri.simpan({
      entri: 'kata-a',
      jenis: 'dasar',
      homograf: null,
      homonim: null,
    });

    await ModelEntri.simpan({
      entri: 'kata-b',
      jenis: 'dasar',
      homograf: '',
      homonim: '',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO entri'),
      ['kata-a', 'dasar', null, null, null, null, null, null, 1, 'kata-a', null, null, null]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO entri'),
      ['kata-b', 'dasar', null, null, null, null, null, null, 1, 'kata-b', null, null, null]
    );
  });

  it('simpan tetap menyimpan saat entri undefined serta indeks hasil normalisasi fallback ke teks asli', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 15 }] })
      .mockResolvedValueOnce({ rows: [{ id: 16 }] });

    await ModelEntri.simpan({ jenis: 'dasar', indeks: '   ' });
    await ModelEntri.simpan({ entri: '---', jenis: 'dasar', indeks: '' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO entri'),
      [undefined, 'dasar', null, null, null, null, null, null, 1, '', null, null, null]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('INSERT INTO entri'),
      ['---', 'dasar', null, null, null, null, null, null, 1, '---', null, null, null]
    );
  });

  it('hapus mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelEntri.hapus(10);
    const missing = await ModelEntri.hapus(11);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  it('ambilMaknaById mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilMaknaById(12);

    expect(result).toBeNull();
  });

  it('ambilMaknaById mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 12, makna: 'arti' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.ambilMaknaById(12);

    expect(result).toEqual(row);
  });

  it('simpanMakna melakukan update dan insert', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [{ id: 2 }] });

    const updated = await ModelEntri.simpanMakna({ id: 1, entri_id: 8, makna: 'arti' });
    const inserted = await ModelEntri.simpanMakna({ entri_id: 8, makna: 'arti' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE makna SET entri_id = $1'),
      [8, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true, 1]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO makna'),
      [8, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]);
    expect(updated).toEqual({ id: 1 });
    expect(inserted).toEqual({ id: 2 });
  });

  it('hapusMakna mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelEntri.hapusMakna(20);
    const missing = await ModelEntri.hapusMakna(21);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  it('ambilContohById mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelEntri.ambilContohById(30);

    expect(result).toBeNull();
  });

  it('ambilContohById mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 30, contoh: 'contoh' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelEntri.ambilContohById(30);

    expect(result).toEqual(row);
  });

  it('simpanContoh melakukan update dan insert', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 41 }] }).mockResolvedValueOnce({ rows: [{ id: 42 }] });

    const updated = await ModelEntri.simpanContoh({ id: 41, makna_id: 11, contoh: 'contoh' });
    const inserted = await ModelEntri.simpanContoh({ makna_id: 11, contoh: 'contoh' });

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('UPDATE contoh SET makna_id = $1'),
      [11, 1, 'contoh', null, null, null, 0, null, true, 41]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO contoh'),
      [11, 1, 'contoh', null, null, null, 0, null, true]);
    expect(updated).toEqual({ id: 41 });
    expect(inserted).toEqual({ id: 42 });
  });

  it('hapusContoh mengembalikan true/false berdasarkan rowCount', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelEntri.hapusContoh(50);
    const missing = await ModelEntri.hapusContoh(51);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  // ─── normalizeBoolean coverage via simpanMakna ────────────────────────

  it('simpanMakna normalizeBoolean: boolean true diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 60 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: true });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
  });

  it('simpanMakna normalizeBoolean: boolean false diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 61 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: false });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, false]
    );
  });

  it('simpanMakna normalizeBoolean: number 1 menjadi true', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 62 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: 1 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
  });

  it('simpanMakna normalizeBoolean: string "ya" menjadi true, string "no" menjadi false', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 63 }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 64 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: 'ya' });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: 'no' });
    expect(db.query).toHaveBeenNthCalledWith(
      1, expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2, expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, false]
    );
  });

  it('simpanMakna normalizeBoolean: tipe lain (object) menghasilkan defaultValue', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 65 }] });
    await ModelEntri.simpanMakna({ entri_id: 1, makna: 'arti', aktif: [] });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO makna'),
      [1, 1, 1, 'arti', null, null, null, null, null, 0, null, null, null, true]
    );
  });

  it('normalizeBoolean tanpa argumen kedua menggunakan default true', () => {
    expect(normalizeBoolean(undefined)).toBe(true);
    expect(normalizeBoolean(null)).toBe(true);
  });

  it('ambilMakna dengan aktifSaja=true menambahkan filter aktif', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelEntri.ambilMakna(1, true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND aktif = TRUE'),
      [1]
    );
  });

  it('ambilContoh dengan aktifSaja=true menambahkan filter aktif', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelEntri.ambilContoh([1, 2], true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND aktif = TRUE'),
      [[1, 2]]
    );
  });

  it('helper private normalisasiIndeks dan parseNullableInteger menangani semua cabang', () => {
    expect(normalisasiIndeks('kata (2)')).toBe('kata');
    expect(normalisasiIndeks('-kata-')).toBe('kata');
    expect(normalisasiIndeks('---')).toBe('---');

    expect(parseNullableInteger(null)).toBeNull();
    expect(parseNullableInteger('')).toBeNull();
    expect(parseNullableInteger('12')).toBe(12);
    expect(parseNullableInteger('abc')).toBeNull();
  });

});
