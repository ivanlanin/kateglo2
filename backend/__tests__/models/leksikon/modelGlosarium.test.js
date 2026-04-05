/**
 * @fileoverview Test ModelGlosarium
 * @tested_in backend/models/leksikon/modelGlosarium.js
 */

const db = require('../../../db');
const { encodeCursor } = require('../../../utils/cursorPagination');
const ModelGlosarium = require('../../../models/leksikon/modelGlosarium');
const ModelOpsi = require('../../../models/master/modelOpsi');
const {
  normalizeBoolean,
  parseOptionalPositiveInt,
  resolveMasterId,
  resolveBahasaId,
  buildMasterFilters,
  buildSumberFilters,
  buildJumlahEntriSumberSql,
  isNormalizedGlosariumSchema,
  forceNormalizedSchemaForTest,
  resetNormalizedSchemaCache,
} = require('../../../models/leksikon/modelGlosarium').__private;

describe('ModelGlosarium', () => {
  beforeEach(() => {
    db.query.mockReset();
    db.pool.connect.mockReset();
    resetNormalizedSchemaCache();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('autocomplete mengembalikan kosong jika query kosong', async () => {
    const result = await ModelGlosarium.autocomplete('   ', 10);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('autocomplete melakukan prefix search dengan limit dibatasi', async () => {
    db.query.mockResolvedValue({
      rows: [
        { indonesia: 'kata', asing: 'word' },
        { indonesia: 'katalog', asing: null },
      ],
    });

    const result = await ModelGlosarium.autocomplete(' ka ', 99);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE aktif = TRUE'),
      ['ka%', 20]
    );
    expect(result).toEqual([
      { value: 'kata', asing: 'word' },
      { value: 'katalog', asing: null },
    ]);
  });

  it('autocomplete memakai fallback limit default saat limit tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.autocomplete('ka', 0);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['ka%', 8]);
  });

  it('autocomplete memakai parameter default saat limit tidak diberikan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.autocomplete('ka');

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['ka%', 8]);
  });

  it('cari dengan semua filter termasuk bahasa id', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indonesia: 'kata' }] });

    const result = await ModelGlosarium.cari({
      q: 'kat',
      bidang: 'ling',
      sumber: 'kbbi',
      bahasa: 'id',
      limit: 10,
      offset: 5
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) as total FROM glosarium g WHERE'),
      ['%kat%', 'ling', 'kbbi']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.bahasa = 'id'"),
      ['%kat%', 'ling', 'kbbi', 10, 5]
    );
    expect(result).toEqual({ data: [{ id: 1, indonesia: 'kata' }], total: 2, hasNext: false });
  });

  it('cari normalized menambahkan filter bahasa_id ketika diberikan id numerik', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 4, indonesia: 'istilah' }] });

    const result = await ModelGlosarium.cari({ bahasaId: 7, limit: 5, offset: 2 });

    expect(db.query.mock.calls[0][0]).toContain('g.bahasa_id = $1');
    expect(db.query).toHaveBeenNthCalledWith(1, expect.any(String), [7]);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('LIMIT $2 OFFSET $3'), [7, 5, 2]);
    expect(result).toEqual({ data: [{ id: 4, indonesia: 'istilah' }], total: 1, hasNext: false });
  });

  it('cari dengan bahasa en', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, indonesia: 'word' }] });

    const result = await ModelGlosarium.cari({ bahasa: 'en' });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.bahasa = 'en'"),
      [20, 0]
    );
    expect(result.total).toBe(1);
    expect(result.hasNext).toBe(false);
  });

  it('cari dengan bahasa selain id/en tidak menambah filter bahasa', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, indonesia: 'term' }] });

    await ModelGlosarium.cari({ bahasa: 'semua', limit: 5, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.not.stringContaining("g.bahasa = 'id'"),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.not.stringContaining("g.bahasa = 'en'"),
      [5, 2]
    );
  });

  it('cari menambahkan filter aktif saat aktifSaja true', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, indonesia: 'aktif' }] });

    const result = await ModelGlosarium.cari({ aktifSaja: true, limit: 3, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('g.aktif = TRUE'),
      [3, 1]
    );
    expect(result).toEqual({ data: [{ id: 7, indonesia: 'aktif' }], total: 1, hasNext: false });
  });

  it('cari menambahkan filter aktif=true saat aktif=1', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, indonesia: 'aktif true' }] });

    await ModelGlosarium.cari({ aktif: '1', limit: 4, offset: 2 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [4, 2]
    );
  });

  it('cari menambahkan filter aktif=false saat aktif=0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, indonesia: 'aktif false' }] });

    await ModelGlosarium.cari({ aktif: '0' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = FALSE'),
      []
    );
  });

  it('cari tanpa filter menghasilkan whereClause kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.cari();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) as total FROM glosarium g '),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [20, 0]
    );
    expect(result).toEqual({ data: [], total: 0, hasNext: false });
  });

  it('cari menormalkan limit 0 dan offset negatif ke fallback aman', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, indonesia: 'aman' }] });

    const result = await ModelGlosarium.cari({ limit: 0, offset: -10 });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [20, 0]
    );
    expect(result).toEqual({ data: [{ id: 9, indonesia: 'aman' }], total: 1, hasNext: false });
  });

  it('cari tanpa hitungTotal memakai limit+1 untuk menentukan hasNext', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, indonesia: 'a' },
        { id: 2, indonesia: 'b' },
        { id: 3, indonesia: 'c' },
      ],
    });

    const result = await ModelGlosarium.cari({ limit: 2, offset: 4, hitungTotal: false });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [3, 4]
    );
    expect(result).toEqual({
      data: [{ id: 1, indonesia: 'a' }, { id: 2, indonesia: 'b' }],
      total: 7,
      hasNext: true,
    });
  });

  it('cari tanpa hitungTotal mengembalikan hasNext false saat hasil <= limit', async () => {
    db.query.mockResolvedValue({
      rows: [
        { id: 1, indonesia: 'a' },
        { id: 2, indonesia: 'b' },
      ],
    });

    const result = await ModelGlosarium.cari({ limit: 5, offset: 4, hitungTotal: false });

    expect(result).toEqual({
      data: [{ id: 1, indonesia: 'a' }, { id: 2, indonesia: 'b' }],
      total: 6,
      hasNext: false,
    });
  });

  it('cariCursor mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelGlosarium.cariCursor({ q: 'kata' });

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

  it('cariCursor bisa dipanggil tanpa argumen (default object)', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelGlosarium.cariCursor();

    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('cariCursor next dengan cursor menyusun cursorClause dan hasMore', async () => {
    const cursor = encodeCursor({ asing: 'beta', id: 10 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 11, indonesia: 'delta', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
          { id: 12, indonesia: 'epsilon', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
          { id: 13, indonesia: 'zeta', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
        ],
      });

    const result = await ModelGlosarium.cariCursor({
      q: 'a',
      cursor,
      direction: 'next',
      limit: 2,
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('AND (g.asing, g.id) > ($2, $3)'),
      ['%a%', 'beta', 10, 3]
    );
    expect(result.data).toHaveLength(2);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('cariCursor prev tanpa hitungTotal membalik urutan hasil', async () => {
    const cursor = encodeCursor({ asing: 'kata', id: 22 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 21, indonesia: 'gamma', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
        { id: 20, indonesia: 'beta', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
        { id: 19, indonesia: 'alpha', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
      ],
    });

    const result = await ModelGlosarium.cariCursor({
      cursor,
      direction: 'prev',
      limit: 2,
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (g.asing, g.id) < ($1, $2)'),
      ['kata', 22, 3]
    );
    expect(result.data).toEqual([
      { id: 20, indonesia: 'beta', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
      { id: 21, indonesia: 'gamma', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
    ]);
    expect(result.total).toBe(0);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariCursor lastPage menetapkan hasNext false dan hasPrev sesuai total', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 3, indonesia: 'c', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
          { id: 2, indonesia: 'b', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
        ],
      });

    const result = await ModelGlosarium.cariCursor({
      limit: 2,
      lastPage: true,
      hitungTotal: true,
    });

    expect(result.data).toEqual([
      { id: 2, indonesia: 'b', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
      { id: 3, indonesia: 'c', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
    ]);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('cariCursor dapat membangun semua filter dan limit fallback saat tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({
        rows: [{ id: 1, indonesia: 'aktif', asing: null, bidang: 'ling', bahasa: 'id', sumber: 'kbbi', aktif: true }],
      });

    await ModelGlosarium.cariCursor({
      q: 'aktif',
      bidang: 'ling',
      sumber: 'kbbi',
      bahasa: 'id',
      aktif: '1',
      aktifSaja: true,
      limit: 'abc',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("g.aktif = TRUE"),
      ['%aktif%', 'ling', 'kbbi']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.bahasa = 'id'"),
      ['%aktif%', 'ling', 'kbbi', 21]
    );
  });

  it('cariCursor mendukung filter aktif=0 dan bahasa=en', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, indonesia: 'term', asing: 'term', bidang: null, bahasa: 'en', sumber: null, aktif: false }] });

    await ModelGlosarium.cariCursor({ aktif: '0', bahasa: 'en' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("g.aktif = FALSE"),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("g.bahasa = 'en'"),
      [21]
    );
  });

  it('cariCursor dengan payload cursor kosong memakai fallback default dan cursor null ketika rows kosong', async () => {
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.cariCursor({
      cursor,
      direction: 'prev',
      hitungTotal: false,
      limit: 2,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (g.asing, g.id) < ($1, $2)'),
      ['', 0, 3]
    );
    expect(result.prevCursor).toBeNull();
    expect(result.nextCursor).toBeNull();
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  it('cariCursor lastPage bisa memiliki hasPrev false saat total tidak melebihi data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, indonesia: 'b', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
          { id: 1, indonesia: 'a', asing: null, bidang: null, bahasa: 'id', sumber: null, aktif: true },
        ],
      });

    const result = await ModelGlosarium.cariCursor({ lastPage: true, limit: 2 });
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it('ambilDaftarBidang mengembalikan rows', async () => {
    const rows = [{ bidang: 'ling' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarBidang();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM bidang b'));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('AS slug'));
    expect(result).toEqual(rows);
  });

  it('ambilDaftarBahasa mendukung aktifSaja true dan false', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, kode: 'id', nama: 'Indonesia' }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, kode: 'en', nama: 'Inggris' }] });

    await expect(ModelGlosarium.ambilDaftarBahasa()).resolves.toEqual([{ id: 1, kode: 'id', nama: 'Indonesia' }]);
    await expect(ModelGlosarium.ambilDaftarBahasa(false)).resolves.toEqual([{ id: 2, kode: 'en', nama: 'Inggris' }]);

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE ba.aktif = TRUE'));
    expect(db.query).toHaveBeenNthCalledWith(2, expect.not.stringContaining('WHERE ba.aktif = TRUE'));
  });

  it('ambilDaftarSumber mengembalikan rows', async () => {
    const rows = [{ sumber: 'kbbi', keterangan: '**Sumber utama**' }];
    db.query.mockResolvedValue({ rows });

    const result = await ModelGlosarium.ambilDaftarSumber();

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('s.keterangan'));
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM sumber s'));
    expect(result).toEqual(rows);
  });

  it('ambilPersisAsing mengembalikan kosong untuk input kosong', async () => {
    await expect(ModelGlosarium.ambilPersisAsing('   ')).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilPersisAsing juga mengembalikan kosong saat asing undefined', async () => {
    await expect(ModelGlosarium.ambilPersisAsing()).resolves.toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilPersisAsing memakai query legacy saat schema belum ternormalisasi', async () => {
    forceNormalizedSchemaForTest(false);
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, asing: 'term', indonesia: 'istilah' }] });

    const result = await ModelGlosarium.ambilPersisAsing(' term ');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('COALESCE(g.bidang, \'\') AS bidang'),
      ['term']
    );
    expect(result).toEqual([{ id: 1, asing: 'term', indonesia: 'istilah' }]);
  });

  it('ambilPersisAsing memakai query normalized saat schema ternormalisasi', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValueOnce({ rows: [{ id: 2, bahasa_kode: 'en', bidang_kode: 'ling', sumber_kode: 'kbbi' }] });

    const result = await ModelGlosarium.ambilPersisAsing('term');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('JOIN bidang b ON b.id = g.bidang_id'),
      ['term']
    );
    expect(result).toEqual([{ id: 2, bahasa_kode: 'en', bidang_kode: 'ling', sumber_kode: 'kbbi' }]);
  });

  it('ambilDetailAsing mengembalikan halaman kosong saat istilah kosong', async () => {
    const result = await ModelGlosarium.ambilDetailAsing('   ');

    expect(result).toEqual({
      persis: [],
      mengandung: [],
      mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      mengandungTotal: 0,
      mirip: [],
      miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      miripTotal: 0,
    });
  });

  it('cariFrasaMengandungKataUtuh mengembalikan kosong jika kata kosong', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('   ', 20);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('cariFrasaMengandungKataUtuh mode cursor mengembalikan objek kosong jika kata kosong', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('   ', { limit: 10 });

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('cariFrasaMengandungKataUtuh mengembalikan kosong jika token terlalu pendek', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('ab', 20);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual([]);
  });

  it('cariFrasaMengandungKataUtuh menjalankan query dengan limit yang dibatasi', async () => {
    db.query.mockResolvedValue({
      rows: [{ indonesia: 'zat aktif', asing: 'active substance' }],
    });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh(' aktif ', 999);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("plainto_tsquery('simple', $1)"),
      ['aktif', 200]
    );
    expect(result).toEqual([{ indonesia: 'zat aktif', asing: 'active substance' }]);
  });

  it('cariFrasaMengandungKataUtuh mendukung argumen default dan fallback limit', async () => {
    const emptyResult = await ModelGlosarium.cariFrasaMengandungKataUtuh();
    expect(emptyResult).toEqual([]);

    db.query.mockResolvedValue({ rows: [] });
    await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', 0);

    expect(db.query).toHaveBeenCalledWith(expect.any(String), ['aktif', 50]);
  });

  it('cariFrasaMengandungKataUtuh mode cursor mengembalikan total 0 saat hitungTotal aktif', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: null, indonesia: null, asing: null, total: 0 }] });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', {
      limit: 5,
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LEFT JOIN LATERAL'),
      ['aktif', 6]
    );
    expect(result).toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('cariFrasaMengandungKataUtuh mode cursor next mendukung cursor dan hasMore', async () => {
    const cursor = encodeCursor({ indonesia: 'kata aktif', id: 9 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 10, indonesia: 'zat aktif', asing: 'active substance', total: 5 },
        { id: 11, indonesia: 'prinsip aktif', asing: 'active principle', total: 5 },
        { id: 12, indonesia: 'unsur aktif', asing: 'active element', total: 5 },
      ],
    });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', {
      limit: 2,
      cursor,
      direction: 'next',
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (indonesia, id) > ($2, $3)'),
      ['aktif', 'kata aktif', 9, 3]
    );
    expect(result.total).toBe(5);
    expect(result.data).toEqual([
      { indonesia: 'zat aktif', asing: 'active substance' },
      { indonesia: 'prinsip aktif', asing: 'active principle' },
    ]);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('cariFrasaMengandungKataUtuh mode cursor prev membalik urutan dan tidak menghitung total', async () => {
    const cursor = encodeCursor({ indonesia: 'zeta', id: 22 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 21, indonesia: 'gamma aktif', asing: 'gamma active' },
        { id: 20, indonesia: 'beta aktif', asing: 'beta active' },
        { id: 19, indonesia: 'alpha aktif', asing: 'alpha active' },
      ],
    });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', {
      limit: 2,
      cursor,
      direction: 'prev',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (indonesia, id) < ($2, $3)'),
      ['aktif', 'zeta', 22, 3]
    );
    expect(result.total).toBe(0);
    expect(result.data).toEqual([
      { indonesia: 'beta aktif', asing: 'beta active' },
      { indonesia: 'gamma aktif', asing: 'gamma active' },
    ]);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariFrasaMengandungKataUtuh mode cursor prev dengan hitungTotal memakai ORDER BY desc pada query total', async () => {
    const cursor = encodeCursor({ indonesia: 'zeta', id: 22 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 21, indonesia: 'gamma aktif', asing: 'gamma active', total: 5 },
        { id: 20, indonesia: 'beta aktif', asing: 'beta active', total: 5 },
        { id: 19, indonesia: 'alpha aktif', asing: 'alpha active', total: 5 },
      ],
    });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', {
      limit: 2,
      cursor,
      direction: 'prev',
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY indonesia DESC, id DESC'),
      ['aktif', 'zeta', 22, 3]
    );
    expect(result.total).toBe(5);
    expect(result.data).toEqual([
      { indonesia: 'beta aktif', asing: 'beta active' },
      { indonesia: 'gamma aktif', asing: 'gamma active' },
    ]);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariFrasaMengandungKataUtuh mode cursor next tanpa cursor memakai hasPrev false dan hasNext false', async () => {
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 31, indonesia: 'aktif biologis', asing: 'biological active' },
      ],
    });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', {
      limit: 2,
      direction: 'next',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY indonesia ASC, id ASC'),
      ['aktif', 3]
    );
    expect(result.total).toBe(0);
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it('cariFrasaMengandungKataUtuh mode cursor dengan payload kosong memakai fallback indonesia/id', async () => {
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('aktif', {
      limit: 2,
      cursor,
      direction: 'next',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (indonesia, id) > ($2, $3)'),
      ['aktif', '', 0, 3]
    );
    expect(result.prevCursor).toBeNull();
    expect(result.nextCursor).toBeNull();
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(false);
  });

  it('cariFrasaMengandungKataUtuh mode cursor mengembalikan fallback kosong saat token tersisa <3', async () => {
    const result = await ModelGlosarium.cariFrasaMengandungKataUtuh('a!', {
      limit: 7,
      hitungTotal: true,
    });

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      total: 0,
      hasPrev: false,
      hasNext: false,
      prevCursor: null,
      nextCursor: null,
    });
  });

  it('hitungTotal mengembalikan nilai total numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '14' }] });

    const result = await ModelGlosarium.hitungTotal();

    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM glosarium');
    expect(result).toBe(14);
  });

  it('hitungTotalBidang mengembalikan nilai total numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '7' }] });

    const result = await ModelGlosarium.hitungTotalBidang();

    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM bidang');
    expect(result).toBe(7);
  });

  it('hitungTotalSumber mengembalikan nilai total numerik', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '5' }] });

    const result = await ModelGlosarium.hitungTotalSumber();

    expect(db.query).toHaveBeenCalledWith('SELECT COUNT(*) AS total FROM sumber');
    expect(result).toBe(5);
  });

  it('ambilDenganId mengembalikan null jika tidak ditemukan', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelGlosarium.ambilDenganId(101);

    expect(result).toBeNull();
  });

  it('ambilDenganId mengembalikan row pertama jika ditemukan', async () => {
    const row = { id: 101, indonesia: 'istilah' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelGlosarium.ambilDenganId(101);

    expect(db.query).toHaveBeenCalledWith(
      'SELECT id, indonesia, asing, bidang, bahasa, sumber, aktif FROM glosarium WHERE id = $1',
      [101]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan update jika id ada', async () => {
    const row = { id: 3, indonesia: 'baharu' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelGlosarium.simpan(
      { id: 3, indonesia: 'baharu', asing: 'new', bidang: '', bahasa: '', sumber: '' },
      'editor@example.com'
    );

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE glosarium SET indonesia = $1'),
      ['baharu', 'new', null, 'en', null, true, 'editor@example.com', 3]
    );
    expect(result).toEqual(row);
  });

  it('simpan melakukan insert jika id tidak ada', async () => {
    const row = { id: 4, indonesia: 'baru' };
    db.query.mockResolvedValue({ rows: [row] });

    const result = await ModelGlosarium.simpan({ indonesia: 'baru', asing: 'new' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['baru', 'new', null, 'en', null, true, 'admin']
    );
    expect(result).toEqual(row);
  });

  it('hapus mengembalikan true jika ada baris terhapus dan false jika tidak', async () => {
    db.query.mockResolvedValueOnce({ rowCount: 1 }).mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelGlosarium.hapus(7);
    const missing = await ModelGlosarium.hapus(8);

    expect(deleted).toBe(true);
    expect(missing).toBe(false);
  });

  // ─── normalizeBoolean coverage via simpan ─────────────────────────────

  it('simpan normalizeBoolean: boolean true diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 20 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: true });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, true, 'admin']
    );
  });

  it('simpan normalizeBoolean: boolean false diteruskan apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 21 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: false });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, false, 'admin']
    );
  });

  it('simpan normalizeBoolean: number 1 menjadi true', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 22 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: 1 });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, true, 'admin']
    );
  });

  it('simpan normalizeBoolean: string "ya" menjadi true, string "no" menjadi false', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 23 }] });
    db.query.mockResolvedValueOnce({ rows: [{ id: 24 }] });
    await ModelGlosarium.simpan({ indonesia: 'a', asing: 'b', aktif: 'ya' });
    await ModelGlosarium.simpan({ indonesia: 'c', asing: 'd', aktif: 'no' });
    expect(db.query).toHaveBeenNthCalledWith(
      1, expect.stringContaining('INSERT INTO glosarium'),
      ['a', 'b', null, 'en', null, true, 'admin']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2, expect.stringContaining('INSERT INTO glosarium'),
      ['c', 'd', null, 'en', null, false, 'admin']
    );
  });

  it('simpan normalizeBoolean: tipe lain (object) menghasilkan defaultValue', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 25 }] });
    await ModelGlosarium.simpan({ indonesia: 'tes', asing: 'test', aktif: [] });
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO glosarium'),
      ['tes', 'test', null, 'en', null, true, 'admin']
    );
  });

  // ─── aktifSaja coverage ───────────────────────────────────────────────

  it('cari dengan aktifSaja menambahkan filter aktif', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 30, indonesia: 'aktif' }] });
    const result = await ModelGlosarium.cari({ q: 'aktif', aktifSaja: true });
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      ['%aktif%']
    );
    expect(result.total).toBe(1);
    expect(result.hasNext).toBe(false);
  });

  it('normalizeBoolean tanpa argumen kedua menggunakan default true', () => {
    expect(normalizeBoolean(undefined)).toBe(true);
    expect(normalizeBoolean(null)).toBe(true);
  });

  it('parseOptionalPositiveInt mengembalikan null untuk nilai tidak valid', () => {
    expect(parseOptionalPositiveInt()).toBeNull();
    expect(parseOptionalPositiveInt('')).toBeNull();
    expect(parseOptionalPositiveInt(0)).toBeNull();
    expect(parseOptionalPositiveInt(-2)).toBeNull();
    expect(parseOptionalPositiveInt('abc')).toBeNull();
    expect(parseOptionalPositiveInt(5)).toBe(5);
  });

  it('buildMasterFilters membangun kondisi q/aktif 1/0', () => {
    const paramsA = [];
    const filtersA = buildMasterFilters({ alias: 'b', q: 'kim', aktif: '1', params: paramsA });
    expect(paramsA).toEqual(['%kim%']);
    expect(filtersA.join(' ')).toContain('b.aktif = TRUE');

    const paramsB = [];
    const filtersB = buildMasterFilters({ alias: 's', q: '', aktif: '0', params: paramsB });
    expect(paramsB).toEqual([]);
    expect(filtersB.join(' ')).toContain('s.aktif = FALSE');
  });

  it('buildSumberFilters membangun kondisi untuk semua flag dan q', () => {
    const params = [];
    const filters = buildSumberFilters({
      q: 'src',
      glosarium: '1',
      kamus: '0',
      tesaurus: '1',
      etimologi: '0',
      params,
    });

    expect(params).toEqual(['%src%']);
    expect(filters).toEqual(expect.arrayContaining([
      expect.stringContaining('s.kode ILIKE $1'),
      's.glosarium = TRUE',
      's.kamus = FALSE',
      's.tesaurus = TRUE',
      's.etimologi = FALSE',
    ]));
  });

  it('buildSumberFilters false branches dan resolveBahasaId mencakup fallback helper', async () => {
    const params = [];
    const client = {
      query: jest.fn().mockResolvedValueOnce({ rows: [{ id: 9 }] }),
    };

    expect(buildSumberFilters({ q: '', glosarium: '0', kamus: '', tesaurus: '0', etimologi: '', params })).toEqual([
      's.glosarium = FALSE',
      's.tesaurus = FALSE',
    ]);
    await expect(resolveBahasaId(client, { explicitId: 5, kode: 'id', iso2: 'id' })).resolves.toBe(5);
    await expect(resolveBahasaId(client, { kode: '', iso2: '' })).resolves.toBeNull();
    await expect(resolveBahasaId(client, { kode: 'Ing', iso2: '' })).resolves.toBe(9);
    expect(client.query).toHaveBeenCalledWith(expect.stringContaining('SELECT id FROM bahasa'), ['Ing', '']);
  });

  it('buildMasterFilters dan buildSumberFilters mencakup cabang nilai truthy lainnya', () => {
    const paramsMaster = [];
    const paramsSumber = [];
    const paramsKosong = [];

    expect(buildMasterFilters({ alias: 'b', q: '', aktif: 'x', params: paramsMaster })).toEqual([]);
    expect(buildSumberFilters({ q: '', glosarium: '1', kamus: '1', tesaurus: '', etimologi: '1', params: paramsSumber })).toEqual([
      's.glosarium = TRUE',
      's.kamus = TRUE',
      's.etimologi = TRUE',
    ]);
    expect(buildSumberFilters({ q: '', glosarium: '', kamus: '', tesaurus: '', etimologi: '', params: paramsKosong })).toEqual([]);
  });

  it('buildJumlahEntriSumberSql memakai alias default dan alias kustom', () => {
    expect(buildJumlahEntriSumberSql()).toContain('e.sumber_id = s.id');
    expect(buildJumlahEntriSumberSql('x')).toContain('e.sumber_id = x.id');
  });

  it('resolveMasterId mengembalikan explicit id, null, dan hasil query', async () => {
    const client = { query: jest.fn().mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ id: 77 }] }) };

    const explicit = await resolveMasterId(client, {
      tableName: 'bidang',
      explicitId: '8',
      kode: '',
      nama: '',
    });
    const none = await resolveMasterId(client, {
      tableName: 'bidang',
      explicitId: null,
      kode: ' ',
      nama: ' ',
    });
    const emptyQueryResult = await resolveMasterId(client, {
      tableName: 'bidang',
      explicitId: null,
      kode: 'x',
      nama: '',
    });
    const found = await resolveMasterId(client, {
      tableName: 'bidang',
      explicitId: null,
      kode: 'y',
      nama: '',
    });

    expect(explicit).toBe(8);
    expect(none).toBeNull();
    expect(emptyQueryResult).toBeNull();
    expect(found).toBe(77);
  });

  it('ambilDaftarBidang dengan filter all tidak menambahkan kondisi konteks', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelGlosarium.ambilDaftarBidang(false);
    expect(db.query).toHaveBeenCalledWith(
      expect.not.stringContaining('WHERE b.glosarium = TRUE')
    );
  });

  it('ambilDaftarBidang dengan mode kamus memfilter bidang.kamus', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.ambilDaftarBidang(true);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE b.kamus = TRUE')
    );
  });

  it('ambilDaftarSumber dengan glosariumSaja=false tidak menambahkan kondisi glosarium', async () => {
    db.query.mockResolvedValue({ rows: [] });
    await ModelGlosarium.ambilDaftarSumber(false);
    expect(db.query).toHaveBeenCalledWith(
      expect.not.stringContaining('WHERE s.glosarium = TRUE')
    );
  });

  it('ambilDaftarSumber mode konteks menambahkan kondisi OR konteks', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.ambilDaftarSumber('konteks');

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE (s.glosarium = TRUE OR s.kamus = TRUE OR s.tesaurus = TRUE OR s.etimologi = TRUE)')
    );
  });

  it('ambilDaftarSumber dengan filterMode truthy non-string diperlakukan sebagai glosarium', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelGlosarium.ambilDaftarSumber(true);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE s.glosarium = TRUE')
    );
  });

  it('resolveSlugBidang mengembalikan row pertama atau null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 4, kode: 'Far', nama: 'Farmasi dan Farmakologi' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(ModelGlosarium.resolveSlugBidang('farmasi-dan-farmakologi')).resolves.toEqual({
      id: 4,
      kode: 'Far',
      nama: 'Farmasi dan Farmakologi',
    });
    await expect(ModelGlosarium.resolveSlugBidang('tidak-ada')).resolves.toBeNull();
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM bidang'), ['farmasi-dan-farmakologi']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM bidang'), ['tidak-ada']);
  });

  it('resolveSlugBidang memakai fallback string kosong saat slug tidak diberikan', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.resolveSlugBidang(undefined);

    expect(result).toBeNull();
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM bidang'), ['']);
  });

  it('resolveSlugSumber mengembalikan row pertama atau null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 4, kode: 'kbbi', nama: 'KBBI' }] })
      .mockResolvedValueOnce({ rows: [] });

    await expect(ModelGlosarium.resolveSlugSumber('k-b-b-i')).resolves.toEqual({ id: 4, kode: 'kbbi', nama: 'KBBI' });
    await expect(ModelGlosarium.resolveSlugSumber('tidak-ada')).resolves.toBeNull();
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('FROM sumber'), ['k-b-b-i']);
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM sumber'), ['tidak-ada']);
  });

  it('resolveSlugSumber memakai fallback string kosong saat slug tidak diberikan', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.resolveSlugSumber(undefined);

    expect(result).toBeNull();
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('FROM sumber'), ['']);
  });

  it('daftarMasterSumber membangun filter glosarium/kamus/tesaurus/etimologi', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, nama: 'Sumber A' }] });

    const result = await ModelGlosarium.daftarMasterSumber({
      glosarium: '0',
      kamus: '1',
      tesaurus: '0',
      etimologi: '1',
      limit: 5,
      offset: 2,
    });

    const countSql = db.query.mock.calls[0][0];
    expect(countSql).toContain('s.glosarium = FALSE');
    expect(countSql).toContain('s.kamus = TRUE');
    expect(countSql).toContain('s.tesaurus = FALSE');
    expect(countSql).toContain('s.etimologi = TRUE');
    expect(result).toEqual({ data: [{ id: 10, nama: 'Sumber A' }], total: 1 });
  });

  it('daftarMasterSumber mencakup cabang TRUE/FALSE kebalikan untuk semua flag filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, nama: 'Sumber B' }] });

    await ModelGlosarium.daftarMasterSumber({
      glosarium: '1',
      kamus: '0',
      tesaurus: '1',
      etimologi: '0',
    });

    const countSql = db.query.mock.calls[0][0];
    expect(countSql).toContain('s.glosarium = TRUE');
    expect(countSql).toContain('s.kamus = FALSE');
    expect(countSql).toContain('s.tesaurus = TRUE');
    expect(countSql).toContain('s.etimologi = FALSE');
  });

  it('isNormalizedGlosariumSchema melakukan cache hasil saat non-test', async () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    db.query.mockResolvedValue({ rows: [{ column_name: 'bidang_id' }, { column_name: 'sumber_id' }, { column_name: 'bahasa_id' }] });

    const first = await isNormalizedGlosariumSchema();
    const second = await isNormalizedGlosariumSchema();

    expect(first).toBe(true);
    expect(second).toBe(true);
    expect(db.query).toHaveBeenCalledTimes(1);
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('cari memakai query normalized schema saat dipaksa true', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indonesia: 'aktif', bidang: 'Kimia', sumber: 'KBBI' }] });

    const result = await ModelGlosarium.cari({
      q: 'aktif',
      bidangId: 3,
      sumberId: 4,
      bahasa: 'en',
      aktif: '1',
      limit: 7,
      offset: 2,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('JOIN bidang b ON b.id = g.bidang_id'),
      ['%aktif%', 3, 4, 'en']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("ba.kode = $4"),
      ['%aktif%', 3, 4, 'en', 7, 2]
    );
    expect(result).toEqual({ data: [{ id: 1, indonesia: 'aktif', bidang: 'Kimia', sumber: 'KBBI' }], total: 2, hasNext: false });
  });

  it('cari normalized tanpa hitungTotal menghitung hasNext dari limit+1', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }, { id: 3 }] });

    const result = await ModelGlosarium.cari({
      bidangKode: 'ling',
      sumberKode: 'kbbi',
      limit: 2,
      offset: 9,
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LOWER(b.kode) = LOWER($1)'),
      ['ling', '', 'kbbi', '', 3, 9]
    );
    expect(result).toEqual({
      data: [{ id: 1 }, { id: 2 }],
      total: 12,
      hasNext: true,
    });
  });

  it('cari normalized mendukung filter nama bidang/sumber dan bahasa id', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 99, indonesia: 'abc' }] });

    await ModelGlosarium.cari({
      bidang: 'Kimia',
      sumber: 'KBBI',
      bahasa: 'id',
      aktif: '0',
      aktifSaja: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("LOWER(b.nama) = LOWER($2)"),
      ['Kimia', 'Kimia', 'KBBI', 'KBBI', 'id']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("ba.kode = $5"),
      ['Kimia', 'Kimia', 'KBBI', 'KBBI', 'id', 20, 0]
    );
  });

  it('cariCursor normalized mengembalikan kosong saat total 0', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelGlosarium.cariCursor({ q: 'tidak ada' });

    expect(result).toEqual({
      data: [],
      total: 0,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('cariCursor normalized mendukung cursor prev + reverse ordering', async () => {
    forceNormalizedSchemaForTest(true);
    const cursor = encodeCursor({ asing: 'delta', id: 8 });
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '10' }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, indonesia: 'charlie' }, { id: 6, indonesia: 'beta' }, { id: 5, indonesia: 'alpha' }] });

    const result = await ModelGlosarium.cariCursor({
      cursor,
      direction: 'prev',
      limit: 2,
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('AND (g.asing, g.id) < ($1, $2)'),
      ['delta', 8, 3]
    );
    expect(result.data).toEqual([{ id: 6, indonesia: 'beta' }, { id: 7, indonesia: 'charlie' }]);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariCursor normalized mendukung filter id dan lastPage', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, indonesia: 'b' }, { id: 1, indonesia: 'a' }] });

    const result = await ModelGlosarium.cariCursor({
      bidangId: 9,
      sumberId: 10,
      lastPage: true,
      limit: 2,
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.bidang_id = $1'),
      [9, 10]
    );
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it('cariCursor normalized mencakup aktifSaja, aktif=0, filter kode/nama, dan bahasa en', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indonesia: 'a' }] });

    await ModelGlosarium.cariCursor({
      aktifSaja: true,
      aktif: '0',
      q: 'istilah',
      bidangKode: 'kim',
      sumberKode: 'kbbi',
      bahasa: 'en',
      limit: 2,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = FALSE'),
      ['%istilah%', 'kim', '', 'kbbi', '', 'en']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("ba.kode = $6"),
      ['%istilah%', 'kim', '', 'kbbi', '', 'en', 3]
    );
  });

  it('cariCursor normalized menambahkan filter aktif=true saat aktif=1', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, indonesia: 'a' }] });

    await ModelGlosarium.cariCursor({ aktif: '1', hitungTotal: true });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('g.aktif = TRUE'),
      []
    );
  });

  it('cariCursor normalized next tanpa cursor mengatur hasPrev false dan hasNext true', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 1, indonesia: 'a' },
        { id: 2, indonesia: 'b' },
        { id: 3, indonesia: 'c' },
      ],
    });

    const result = await ModelGlosarium.cariCursor({
      bahasa: 'id',
      limit: 2,
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("ba.kode = $1"),
      ['id', 3]
    );
    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(true);
  });

  it('ambilDenganId memakai query normalized saat schema normalized aktif', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValue({ rows: [{ id: 9, indonesia: 'istilah', bidang: 'Kimia' }] });

    const result = await ModelGlosarium.ambilDenganId(9);

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('JOIN sumber s ON s.id = g.sumber_id'),
      [9]
    );
    expect(result).toEqual({ id: 9, indonesia: 'istilah', bidang: 'Kimia' });
  });

  it('simpan normalized melempar INVALID_BIDANG jika bidang tidak valid', async () => {
    forceNormalizedSchemaForTest(true);
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);

    await expect(ModelGlosarium.simpan({ indonesia: 'istilah', asing: 'term' })).rejects.toMatchObject({
      code: 'INVALID_BIDANG',
    });
    expect(client.release).toHaveBeenCalled();
  });

  it('simpan normalized melempar INVALID_SUMBER jika sumber tidak valid', async () => {
    forceNormalizedSchemaForTest(true);
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 2 }] })
        .mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);

    await expect(ModelGlosarium.simpan({ indonesia: 'istilah', asing: 'term', bidang_id: 2 })).rejects.toMatchObject({
      code: 'INVALID_SUMBER',
    });
    expect(client.release).toHaveBeenCalled();
  });

  it('simpan normalized melempar INVALID_BAHASA jika bahasa tidak valid', async () => {
    forceNormalizedSchemaForTest(true);
    const client = {
      query: jest.fn().mockResolvedValueOnce({ rows: [] }),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);

    await expect(ModelGlosarium.simpan({
      indonesia: 'istilah',
      asing: 'term',
      bidang_id: 2,
      sumber_id: 3,
      bahasa: 'xx',
    })).rejects.toMatchObject({
      code: 'INVALID_BAHASA',
    });
    expect(client.release).toHaveBeenCalled();
  });

  it('simpan normalized update mengembalikan null saat id tidak ditemukan', async () => {
    forceNormalizedSchemaForTest(true);
    const client = {
      query: jest.fn().mockResolvedValue({ rows: [] }),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);

    const result = await ModelGlosarium.simpan({ id: 99, indonesia: 'a', asing: 'b', bidang_id: 2, bahasa_id: 10, sumber_id: 3 }, 'editor@example.com');

    expect(result).toBeNull();
    expect(client.release).toHaveBeenCalled();
  });

  it('simpan normalized insert dan update sukses mengembalikan detail via ambilDenganId', async () => {
    forceNormalizedSchemaForTest(true);
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({ rows: [{ id: 2 }] })
        .mockResolvedValueOnce({ rows: [{ id: 3 }] })
        .mockResolvedValueOnce({ rows: [{ id: 10 }] })
        .mockResolvedValueOnce({ rows: [{ id: 2 }] })
        .mockResolvedValueOnce({ rows: [{ id: 3 }] })
        .mockResolvedValueOnce({ rows: [{ id: 11 }] }),
      release: jest.fn(),
    };
    db.pool.connect.mockResolvedValue(client);
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 10, indonesia: 'baru' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, indonesia: 'ubah' }] });

    const inserted = await ModelGlosarium.simpan({ indonesia: 'baru', asing: 'new', bidang_id: 2, bahasa_id: 10, sumber_id: 3 });
    const updated = await ModelGlosarium.simpan({ id: 11, indonesia: 'ubah', asing: 'upd', bidang_id: 2, bahasa_id: 10, sumber_id: 3 });

    expect(inserted).toEqual({ id: 10, indonesia: 'baru' });
    expect(updated).toEqual({ id: 11, indonesia: 'ubah' });
    expect(client.release).toHaveBeenCalledTimes(2);
  });

  it('master bidang/sumber: daftar dan detail menggunakan parse total', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kode: 'kim', nama: 'Kimia' }] })
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kode: 'kbbi', nama: 'KBBI' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] })
      .mockResolvedValueOnce({ rows: [] });

    const bidang = await ModelGlosarium.daftarMasterBidang({ q: 'kim', kamus: '1', glosarium: '0', limit: 999, offset: -10 });
    const sumber = await ModelGlosarium.daftarMasterSumber({ q: 'kb', aktif: '0', limit: 0, offset: 3 });
    const bidangDetail = await ModelGlosarium.ambilMasterBidangDenganId(1);
    const sumberDetail = await ModelGlosarium.ambilMasterSumberDenganId(9);

    expect(bidang).toEqual({ data: [{ id: 1, kode: 'kim', nama: 'Kimia' }], total: 4 });
    expect(sumber).toEqual({ data: [{ id: 2, kode: 'kbbi', nama: 'KBBI' }], total: 5 });
    expect(bidangDetail).toEqual({ id: 1 });
    expect(sumberDetail).toBeNull();
  });

  it('simpanMaster bidang/sumber mencakup update-not-found dan insert success', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 5 }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, nama: 'Kimia' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ id: 6 }] })
      .mockResolvedValueOnce({ rows: [{ id: 6, nama: 'KBBI' }] });

    const bidangUpdateMissing = await ModelGlosarium.simpanMasterBidang({ id: 7, kode: 'x', nama: 'X' });
    const bidangInsert = await ModelGlosarium.simpanMasterBidang({ kode: 'kim', nama: 'Kimia', kamus: '1', glosarium: '1' });
    const sumberUpdateMissing = await ModelGlosarium.simpanMasterSumber({ id: 8, kode: 'x', nama: 'X' });
    const sumberInsert = await ModelGlosarium.simpanMasterSumber({ kode: 'kbbi', nama: 'KBBI', aktif: 0 });

    expect(bidangUpdateMissing).toBeNull();
    expect(bidangInsert).toEqual({ id: 5, nama: 'Kimia' });
    expect(sumberUpdateMissing).toBeNull();
    expect(sumberInsert).toEqual({ id: 6, nama: 'KBBI' });
  });

  it('simpanMaster bidang/sumber update sukses mengembalikan detail', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 7 }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, nama: 'Kimia Baru' }] })
      .mockResolvedValueOnce({ rows: [{ id: 8 }] })
      .mockResolvedValueOnce({ rows: [{ id: 8, nama: 'Sumber Baru' }] });

    const bidang = await ModelGlosarium.simpanMasterBidang({ id: 7, kode: 'kim', nama: 'Kimia Baru', kamus: false, glosarium: true });
    const sumber = await ModelGlosarium.simpanMasterSumber({ id: 8, kode: 'kbbi', nama: 'Sumber Baru', aktif: true });

    expect(bidang).toEqual({ id: 7, nama: 'Kimia Baru' });
    expect(sumber).toEqual({ id: 8, nama: 'Sumber Baru' });
  });

  it('hapusMaster bidang/sumber melempar MASTER_IN_USE dan menangani hasil delete', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 0 })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rowCount: 1 });

    await expect(ModelGlosarium.hapusMasterBidang(1)).rejects.toMatchObject({ code: 'MASTER_IN_USE' });
    await expect(ModelGlosarium.hapusMasterBidang(2)).resolves.toBe(false);
    await expect(ModelGlosarium.hapusMasterSumber(3)).resolves.toBe(true);
  });

  it('hapusMasterSumber melempar MASTER_IN_USE saat masih dipakai', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '2' }] });

    await expect(ModelGlosarium.hapusMasterSumber(99)).rejects.toMatchObject({ code: 'MASTER_IN_USE' });
  });

  it('ambilDaftarBidang dan ambilDaftarSumber default menambahkan WHERE glosarium', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ id: 1 }] }).mockResolvedValueOnce({ rows: [{ id: 2 }] });

    await ModelGlosarium.ambilDaftarBidang();
    await ModelGlosarium.ambilDaftarSumber();

    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('WHERE b.glosarium = TRUE'));
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE s.glosarium = TRUE'));
  });

  it('cari normalized tanpa filter dan tanpa hitungTotal menangani hasNext=false', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValue({ rows: [{ id: 1 }, { id: 2 }] });

    const result = await ModelGlosarium.cari({ limit: 5, offset: 4, hitungTotal: false });

    expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ORDER BY g.asing ASC'), [6, 4]);
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], total: 6, hasNext: false });
  });

  it('cariCursor normalized next dengan cursor eksplisit memakai operator >', async () => {
    forceNormalizedSchemaForTest(true);
    const cursor = encodeCursor({ asing: 'kata', id: 22 });
    db.query.mockResolvedValueOnce({ rows: [{ id: 23, indonesia: 'kiri' }] });

    await ModelGlosarium.cariCursor({
      cursor,
      direction: 'next',
      hitungTotal: false,
      limit: 2,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (g.asing, g.id) > ($1, $2)'),
      ['kata', 22, 3]
    );
  });

  it('cariCursor normalized mengembalikan cursor null saat rows kosong', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelGlosarium.cariCursor({ hitungTotal: false, limit: 2 });

    expect(result.prevCursor).toBeNull();
    expect(result.nextCursor).toBeNull();
  });

  it('daftarMasterBidang dan daftarMasterSumber mendukung default argumen tanpa filter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const bidang = await ModelGlosarium.daftarMasterBidang();
    const sumber = await ModelGlosarium.daftarMasterSumber();

    expect(bidang).toEqual({ data: [], total: 0 });
    expect(sumber).toEqual({ data: [], total: 0 });
    expect(db.query).toHaveBeenNthCalledWith(1, expect.not.stringContaining('WHERE'), []);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.not.stringContaining('WHERE'), []);
  });

  it('wrapper master glosarium mendelegasikan lookup, detail, simpan, hapus, dan hitung total ke ModelOpsi', async () => {
    jest.spyOn(ModelOpsi, 'daftarLookupBidang').mockResolvedValue([{ id: 1 }]);
    jest.spyOn(ModelOpsi, 'daftarMasterBahasa').mockResolvedValue({ data: [], total: 0 });
    jest.spyOn(ModelOpsi, 'daftarLookupBahasa').mockResolvedValue([{ id: 2 }]);
    jest.spyOn(ModelOpsi, 'daftarLookupSumber').mockResolvedValue([{ id: 3 }]);
    jest.spyOn(ModelOpsi, 'ambilMasterBahasaDenganId').mockResolvedValue({ id: 4 });
    jest.spyOn(ModelOpsi, 'simpanMasterBahasa').mockResolvedValue({ id: 5 });
    jest.spyOn(ModelOpsi, 'hapusMasterBahasa').mockResolvedValue(true);
    jest.spyOn(ModelOpsi, 'hitungTotalBahasa').mockResolvedValue(8);
    jest.spyOn(ModelOpsi, 'hitungTotalSumber').mockResolvedValue(9);

    await expect(ModelGlosarium.daftarLookupBidang({ q: 'kim' })).resolves.toEqual([{ id: 1 }]);
    await expect(ModelGlosarium.daftarMasterBahasa({ q: 'ing', aktif: '1', limit: 5, offset: 1 })).resolves.toEqual({ data: [], total: 0 });
    await expect(ModelGlosarium.daftarLookupBahasa({ q: 'ing' })).resolves.toEqual([{ id: 2 }]);
    await expect(ModelGlosarium.daftarLookupSumber({ q: 'kbbi', glosarium: '1', kamus: '0', tesaurus: '1', etimologi: '0' })).resolves.toEqual([{ id: 3 }]);
    await expect(ModelGlosarium.ambilMasterBahasaDenganId(4)).resolves.toEqual({ id: 4 });
    await expect(ModelGlosarium.simpanMasterBahasa({ kode: 'id', nama: 'Indonesia' })).resolves.toEqual({ id: 5 });
    await expect(ModelGlosarium.hapusMasterBahasa(5)).resolves.toBe(true);
    await expect(ModelGlosarium.hitungTotalBahasa()).resolves.toBe(8);
    await expect(ModelGlosarium.hitungTotalSumber()).resolves.toBe(9);
  });

  it('wrapper lookup/master bahasa dan sumber mendukung default argumen kosong', async () => {
    jest.spyOn(ModelOpsi, 'daftarLookupBidang').mockResolvedValue([]);
    jest.spyOn(ModelOpsi, 'daftarMasterBahasa').mockResolvedValue({ data: [], total: 0 });
    jest.spyOn(ModelOpsi, 'daftarLookupBahasa').mockResolvedValue([]);
    jest.spyOn(ModelOpsi, 'daftarLookupSumber').mockResolvedValue([]);

    await expect(ModelGlosarium.daftarLookupBidang()).resolves.toEqual([]);
    await expect(ModelGlosarium.daftarMasterBahasa()).resolves.toEqual({ data: [], total: 0 });
    await expect(ModelGlosarium.daftarLookupBahasa()).resolves.toEqual([]);
    await expect(ModelGlosarium.daftarLookupSumber()).resolves.toEqual([]);

    expect(ModelOpsi.daftarLookupBidang).toHaveBeenCalledWith({ q: '' });
    expect(ModelOpsi.daftarMasterBahasa).toHaveBeenCalledWith({ q: '', aktif: '', limit: 50, offset: 0 });
    expect(ModelOpsi.daftarLookupBahasa).toHaveBeenCalledWith({ q: '' });
    expect(ModelOpsi.daftarLookupSumber).toHaveBeenCalledWith({ q: '', glosarium: '', kamus: '', tesaurus: '', etimologi: '' });
  });

  it('ambilMasterBidangDenganId dan ambilDenganId normalized dapat mengembalikan null', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [] });

    const bidang = await ModelGlosarium.ambilMasterBidangDenganId(404);
    const glosarium = await ModelGlosarium.ambilDenganId(404);

    expect(bidang).toBeNull();
    expect(glosarium).toBeNull();
  });

  it('forceNormalizedSchemaForTest menerima nilai non-boolean sebagai reset ke null', async () => {
    forceNormalizedSchemaForTest('invalid');
    const result = await isNormalizedGlosariumSchema();
    expect(result).toBe(false);
  });

  it('cari normalized menerima limit invalid dan tetap fallback ke 20', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }] });

    await ModelGlosarium.cari({ limit: 'abc', hitungTotal: true });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [20, 0]);
  });

  it('cariCursor normalized memakai nama saat kode kosong + fallback cursor payload + fallback limit', async () => {
    forceNormalizedSchemaForTest(true);
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({ rows: [] });

    await ModelGlosarium.cariCursor({
      bidangKode: '',
      bidang: 'Kimia',
      sumberKode: '',
      sumber: 'KBBI',
      cursor,
      direction: 'next',
      hitungTotal: false,
      limit: 'abc',
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (g.asing, g.id) > ($5, $6)'),
      ['Kimia', 'Kimia', 'KBBI', 'KBBI', '', 0, 21]
    );
  });

  it('cariCursor legacy mendukung sortBy indonesia saat bukan asing', async () => {
    forceNormalizedSchemaForTest(false);
    db.query.mockResolvedValueOnce({ rows: [] });

    await ModelGlosarium.cariCursor({
      sortBy: 'indonesia',
      hitungTotal: false,
      limit: 2,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY g.indonesia ASC, g.id ASC'),
      [3]
    );
  });

  it('cariCursor normalized mendukung sortBy indonesia saat bukan asing', async () => {
    forceNormalizedSchemaForTest(true);
    db.query.mockResolvedValueOnce({ rows: [] });

    await ModelGlosarium.cariCursor({
      sortBy: 'indonesia',
      hitungTotal: false,
      limit: 2,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('ORDER BY g.indonesia ASC, g.id ASC'),
      [3]
    );
  });

  it('daftarMasterBidang memakai fallback limit default saat limit tidak valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelGlosarium.daftarMasterBidang({ limit: 0, offset: -3 });

    expect(db.query).toHaveBeenNthCalledWith(2, expect.any(String), [50, 0]);
  });

  it('ambilDetailAsing mengembalikan struktur kosong jika kata kosong', async () => {
    const result = await ModelGlosarium.ambilDetailAsing('   ');

    expect(result).toEqual({
      persis: [],
      mengandung: [],
      mengandungPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      mengandungTotal: 0,
      mirip: [],
      miripPage: { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null },
      miripTotal: 0,
    });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilDetailAsing menerima asing null dan tetap mengembalikan struktur kosong', async () => {
    const result = await ModelGlosarium.ambilDetailAsing(null);

    expect(result.persis).toEqual([]);
    expect(result.mengandung).toEqual([]);
    expect(result.mirip).toEqual([]);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilDetailAsing mode legacy menghitung page/cursor dan total', async () => {
    forceNormalizedSchemaForTest(false);
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, asing: 'term', indonesia: 'istilah' }] })
      .mockResolvedValueOnce({ rows: [{ total: '7' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, asing: 'term x', indonesia: 'istilah x' },
          { id: 3, asing: 'term y', indonesia: 'istilah y' },
          { id: 4, asing: 'term z', indonesia: 'istilah z' },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 9, asing: 'alpha', indonesia: 'a' },
          { id: 10, asing: 'beta', indonesia: 'b' },
        ],
      });

    const result = await ModelGlosarium.ambilDetailAsing('term', {
      limit: 2,
      mengandungCursor: encodeCursor({ offset: 4 }),
      miripCursor: encodeCursor({ offset: 2 }),
    });

    expect(result.persis).toEqual([{ id: 1, asing: 'term', indonesia: 'istilah' }]);
    expect(result.mengandung).toHaveLength(2);
    expect(result.mengandungTotal).toBe(7);
    expect(result.mengandungPage.hasPrev).toBe(true);
    expect(result.mengandungPage.hasNext).toBe(true);
    expect(result.mirip).toEqual([
      { id: 9, asing: 'alpha', indonesia: 'a' },
      { id: 10, asing: 'beta', indonesia: 'b' },
    ]);
    expect(result.miripTotal).toBe(5);
    expect(result.miripPage.hasPrev).toBe(true);
    expect(result.miripPage.hasNext).toBe(false);
  });

  it('ambilDetailAsing mode normalized menjalankan query join master', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 1, asing: 'term', bidang: 'Kimia', sumber: 'KBBI' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, asing: 'term x', bidang: 'Kimia', sumber: 'KBBI' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, asing: 'alpha', bidang: 'Fisika', sumber: 'KBBI' }] });

    const result = await ModelGlosarium.ambilDetailAsing('term', { limit: 5 });

    expect(result.persis).toEqual([{ id: 1, asing: 'term', bidang: 'Kimia', sumber: 'KBBI' }]);
    expect(result.mengandung).toEqual([{ id: 2, asing: 'term x', bidang: 'Kimia', sumber: 'KBBI' }]);
    expect(result.mirip).toEqual([{ id: 3, asing: 'alpha', bidang: 'Fisika', sumber: 'KBBI' }]);
    expect(db.query).toHaveBeenNthCalledWith(1, expect.stringContaining('JOIN bidang b ON b.id = g.bidang_id'), ['term']);
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('LIMIT $2 OFFSET $3'), ['term', 6, 0]);
  });

  it('ambilDetailAsing memakai fallback limit default saat limit tidak valid', async () => {
    forceNormalizedSchemaForTest(true);
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelGlosarium.ambilDetailAsing('term', { limit: 0 });

    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('LIMIT $2 OFFSET $3'), ['term', 21, 0]);
  });
});



