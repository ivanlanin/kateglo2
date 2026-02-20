/**
 * @fileoverview Test ModelLabel
 * @tested_in backend/models/modelLabel.js
 */

const db = require('../../db');
const { encodeCursor } = require('../../utils/cursorPagination');
const ModelLabel = require('../../models/modelLabel');
const { __private } = require('../../models/modelLabel');

describe('ModelLabel', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('ambilSemuaKategori mengelompokkan label serta menambah abjad, bentuk, ekspresi, kelas, dan unsur terikat', async () => {
    db.query.mockResolvedValue({
      rows: [
        { kategori: 'ragam', kode: 'cak', nama: 'cakapan' },
        { kategori: 'ragam', kode: 'horm', nama: 'hormat' },
        { kategori: 'ragam', kode: 'ark', nama: 'arkais' },
        { kategori: 'ragam', kode: 'ksr', nama: 'kasar' },
        { kategori: 'ragam', kode: 'kls', nama: 'klasik' },
        { kategori: 'bahasa', kode: 'id', nama: 'Indonesia' },
        { kategori: 'kelas_kata', kode: 'n', nama: 'nomina' },
        { kategori: 'kelas_kata', kode: 'adv', nama: 'adverbia' },
        { kategori: 'kelas_kata', kode: 'prefiks', nama: 'prefiks' },
        { kategori: 'kelas_kata', kode: 'v', nama: 'verba' },
        { kategori: 'kelas_kata', kode: 'bentuk_terikat', nama: 'bentuk terikat' },
      ],
    });

    const result = await ModelLabel.ambilSemuaKategori();

    expect(result.ragam).toEqual([
      { kode: 'ark', nama: 'arkais' },
      { kode: 'kls', nama: 'klasik' },
      { kode: 'horm', nama: 'hormat' },
      { kode: 'cak', nama: 'cakapan' },
      { kode: 'ksr', nama: 'kasar' },
    ]);
    expect(result.bahasa).toEqual([{ kode: 'id', nama: 'Indonesia' }]);
    expect(result.abjad).toHaveLength(26);
    expect(result.bentuk).toHaveLength(3);
    expect(result.bentuk).toEqual([
      { kode: 'dasar', nama: 'dasar' },
      { kode: 'turunan', nama: 'turunan' },
      { kode: 'gabungan', nama: 'gabungan' },
    ]);
    expect(result.ekspresi).toHaveLength(2);
    expect(result.ekspresi).toEqual([
      { kode: 'idiom', nama: 'idiom' },
      { kode: 'peribahasa', nama: 'peribahasa' },
    ]);
    expect(result.kelas_kata).toEqual([
      { kode: 'n', nama: 'nomina' },
      { kode: 'v', nama: 'verba' },
      { kode: 'adv', nama: 'adverbia' },
    ]);
    expect(result.unsur_terikat).toEqual([
      { kode: 'terikat', nama: 'terikat' },
      { kode: 'prefiks', nama: 'prefiks' },
      { kode: 'infiks', nama: 'infiks' },
      { kode: 'sufiks', nama: 'sufiks' },
      { kode: 'konfiks', nama: 'konfiks' },
      { kode: 'klitik', nama: 'klitik' },
      { kode: 'prakategorial', nama: 'prakategorial' },
    ]);

    // Alias kompatibilitas route lama
    expect(result.jenis).toHaveLength(13);
    expect(result.jenis).toEqual([
      { kode: 'dasar', nama: 'dasar' },
      { kode: 'turunan', nama: 'turunan' },
      { kode: 'gabungan', nama: 'gabungan' },
      { kode: 'idiom', nama: 'idiom' },
      { kode: 'peribahasa', nama: 'peribahasa' },
      { kode: 'terikat', nama: 'terikat' },
      { kode: 'prefiks', nama: 'prefiks' },
      { kode: 'infiks', nama: 'infiks' },
      { kode: 'sufiks', nama: 'sufiks' },
      { kode: 'konfiks', nama: 'konfiks' },
      { kode: 'klitik', nama: 'klitik' },
      { kode: 'prakategorial', nama: 'prakategorial' },
      { kode: 'varian', nama: 'varian' },
    ]);
  });

  it('ambilSemuaKategori mengurutkan prioritas dan fallback alfabet untuk label non-prioritas', async () => {
    db.query.mockResolvedValue({
      rows: [
        { kategori: 'ragam', kode: 'umum', nama: 'umum' },
        { kategori: 'ragam', kode: 'cak', nama: 'cakapan' },
        { kategori: 'ragam', kode: 'baku', nama: 'baku' },
        { kategori: 'kelas_kata', kode: 'verba', nama: 'kata kerja' },
        { kategori: 'kelas_kata', kode: 'x', nama: 'tak dikenal' },
      ],
    });

    const result = await ModelLabel.ambilSemuaKategori();

    expect(result.ragam).toEqual([
      { kategori: undefined, kode: 'cak', nama: 'cakapan' },
      { kategori: undefined, kode: 'baku', nama: 'baku' },
      { kategori: undefined, kode: 'umum', nama: 'umum' },
    ].map(({ kode, nama }) => ({ kode, nama })));
    expect(result.kelas_kata).toEqual([{ kode: 'verba', nama: 'kata kerja' }]);
    expect(result.unsur_terikat).toEqual([
      { kode: 'terikat', nama: 'terikat' },
      { kode: 'prefiks', nama: 'prefiks' },
      { kode: 'infiks', nama: 'infiks' },
      { kode: 'sufiks', nama: 'sufiks' },
      { kode: 'konfiks', nama: 'konfiks' },
      { kode: 'klitik', nama: 'klitik' },
      { kode: 'prakategorial', nama: 'prakategorial' },
    ]);
  });

  it('ambilSemuaKategori tetap aman saat kategori ragam/kelas_kata kosong atau nilai label tidak lengkap', async () => {
    db.query.mockResolvedValue({
      rows: [
        { kategori: 'bahasa', kode: 'id', nama: 'Indonesia' },
        { kategori: 'ragam', kode: null, nama: null },
      ],
    });

    const result = await ModelLabel.ambilSemuaKategori();

    expect(result.bahasa).toEqual([{ kode: 'id', nama: 'Indonesia' }]);
    expect(result.kelas_kata).toEqual([]);
    expect(result.unsur_terikat).toEqual([
      { kode: 'terikat', nama: 'terikat' },
      { kode: 'prefiks', nama: 'prefiks' },
      { kode: 'infiks', nama: 'infiks' },
      { kode: 'sufiks', nama: 'sufiks' },
      { kode: 'konfiks', nama: 'konfiks' },
      { kode: 'klitik', nama: 'klitik' },
      { kode: 'prakategorial', nama: 'prakategorial' },
    ]);
    expect(result.ragam).toEqual([{ kode: null, nama: null }]);
  });

  it('ambilSemuaKategori mengurutkan ragam saat nama/kode tidak lengkap dengan fallback aman', async () => {
    db.query.mockResolvedValue({
      rows: [
        { kategori: 'ragam', kode: null, nama: null },
        { kategori: 'ragam', kode: null, nama: null },
        { kategori: 'ragam', kode: 'zz', nama: null },
        { kategori: 'ragam', kode: 'aa', nama: '' },
      ],
    });

    const result = await ModelLabel.ambilSemuaKategori();

    expect(result.ragam).toEqual([
      { kode: null, nama: null },
      { kode: 'aa', nama: '' },
      { kode: 'zz', nama: null },
    ]);
  });

  it('ambilSemuaKategori menyediakan fallback array kosong ketika ragam tidak ada', async () => {
    db.query.mockResolvedValue({
      rows: [{ kategori: 'bahasa', kode: 'en', nama: 'Inggris' }],
    });

    const result = await ModelLabel.ambilSemuaKategori();

    expect(result.ragam).toEqual([]);
    expect(result.kelas_kata).toEqual([]);
    expect(result.unsur_terikat).toEqual([
      { kode: 'terikat', nama: 'terikat' },
      { kode: 'prefiks', nama: 'prefiks' },
      { kode: 'infiks', nama: 'infiks' },
      { kode: 'sufiks', nama: 'sufiks' },
      { kode: 'konfiks', nama: 'konfiks' },
      { kode: 'klitik', nama: 'klitik' },
      { kode: 'prakategorial', nama: 'prakategorial' },
    ]);
  });

  it('cariEntriPerLabel mengembalikan kosong untuk kategori tidak valid', async () => {
    const result = await ModelLabel.cariEntriPerLabel('unknown', 'x', 10, 0);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori abjad valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, lema: 'Akar' }] });

    const result = await ModelLabel.cariEntriPerLabel('abjad', 'a', 5, 1);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND UPPER'),
      ['A']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['A', 5, 1]
    );
    expect(result.total).toBe(2);
    expect(result.label).toEqual({ kode: 'A', nama: 'A' });
  });

  it('cariEntriPerLabel kategori abjad invalid', async () => {
    const result = await ModelLabel.cariEntriPerLabel('abjad', '12', 5, 0);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori bentuk valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, lema: 'berkata', jenis: 'turunan' }] });

    const result = await ModelLabel.cariEntriPerLabel('bentuk', 'turunan', 10, 2);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND jenis = $1'),
      ['turunan']
    );
    expect(result.total).toBe(1);
    expect(result.label).toEqual({ kode: 'turunan', nama: 'turunan' });
  });

  it('cariEntriPerLabel kategori bentuk menerima kode unsur terikat', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, lema: 'meng-', jenis: 'prefiks' }] });

    const result = await ModelLabel.cariEntriPerLabel('bentuk', 'prefiks', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND jenis = $1'),
      ['prefiks']
    );
    expect(result.total).toBe(2);
    expect(result.label).toEqual({ kode: 'prefiks', nama: 'prefiks' });
  });

  it('cariEntriPerLabel kategori bentuk menerima kode prakategorial', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 51, lema: 'juang (1)', jenis: 'prakategorial' }] });

    const result = await ModelLabel.cariEntriPerLabel('bentuk', 'prakategorial', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND jenis = $1'),
      ['prakategorial']
    );
    expect(result.total).toBe(3);
    expect(result.label).toEqual({ kode: 'prakategorial', nama: 'prakategorial' });
  });

  it('cariEntriPerLabel kategori ekspresi valid', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 12, lema: 'buah bibir', jenis: 'idiom' }] });

    const result = await ModelLabel.cariEntriPerLabel('ekspresi', 'idiom');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['idiom', 20, 0]
    );
    expect(result.total).toBe(1);
    expect(result.label).toEqual({ kode: 'idiom', nama: 'idiom' });
  });

  it('cariEntriPerLabel kategori jenis valid dengan limit/offset default (alias kompatibilitas)', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, lema: 'kata', jenis: 'dasar' }] });

    await ModelLabel.cariEntriPerLabel('jenis', 'dasar');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['dasar', 20, 0]
    );
  });

  it('cariEntriPerLabel kategori jenis invalid', async () => {
    const result = await ModelLabel.cariEntriPerLabel('jenis', 'random', 10, 0);

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori label memakai kode dan nama saat label ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ kode: 'cak', nama: 'cakapan', keterangan: '' }] })
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({ rows: [{ id: 3, lema: 'kata' }] });

    const result = await ModelLabel.cariEntriPerLabel('ragam', 'cak', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(nama)), '[^a-z0-9]+', '-', 'g')) = $3"),
      [['ragam'], 'cak', 'cak', 'ragam']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.ragam = ANY($1::text[])'),
      [['cak', 'cakapan']]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      [['cak', 'cakapan'], 20, 0]
    );
    expect(result.total).toBe(3);
    expect(result.label).toEqual({ kode: 'cak', nama: 'cakapan', keterangan: '' });
  });

  it('cariEntriPerLabel tetap aman saat kode kosong/falsy pada kategori label', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.cariEntriPerLabel('ragam', undefined, 10, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("REGEXP_REPLACE(LOWER(TRIM(kode)), '[^a-z0-9]+', '-', 'g')"),
      [['ragam'], '', '', 'ragam']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.ragam = ANY($1::text[])'),
      [[]]
    );
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel menerima nama label pada slug kategori', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ kode: 'v', nama: 'verba', keterangan: '' }] })
      .mockResolvedValueOnce({ rows: [{ total: '4' }] })
      .mockResolvedValueOnce({ rows: [{ id: 7, entri: 'makan' }] });

    const result = await ModelLabel.cariEntriPerLabel('kelas', 'Verba', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(nama)), '[^a-z0-9]+', '-', 'g')) = $3"),
      [['kelas-kata', 'kelas_kata'], 'verba', 'verba', 'kelas-kata']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.kelas_kata = ANY($1::text[])'),
      [['Verba', 'v']]
    );
    expect(result.total).toBe(4);
    expect(result.label).toEqual({ kode: 'v', nama: 'verba', keterangan: '' });
  });

  it('cariEntriPerLabel menerima slug lowercase-hyphen dari nama label', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ kode: 'rag bku', nama: 'Ragam Baku', keterangan: '' }] })
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 17, entri: 'contoh' }] });

    const result = await ModelLabel.cariEntriPerLabel('ragam', 'ragam-baku', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("TRIM(BOTH '-' FROM REGEXP_REPLACE(LOWER(TRIM(nama)), '[^a-z0-9]+', '-', 'g')) = $3"),
      [['ragam'], 'ragam-baku', 'ragam-baku', 'ragam']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.ragam = ANY($1::text[])'),
      [['ragam-baku', 'ragam baku', 'rag bku']]
    );
    expect(result.total).toBe(2);
    expect(result.label).toEqual({ kode: 'rag bku', nama: 'Ragam Baku', keterangan: '' });
  });

  it('cariEntriPerLabel kategori label hanya kode saat label tidak ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.cariEntriPerLabel('bahasa', 'id', 3, 4);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.bahasa = ANY($1::text[])'),
      [['id']]
    );
    expect(result).toEqual({ data: [], total: 0, label: null });
  });

  it('cariEntriPerLabel kategori unsur_terikat memakai kolom jenis pada entri', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, lema: 'meng-' }] });

    const result = await ModelLabel.cariEntriPerLabel('unsur_terikat', 'prefiks', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND jenis = $1'),
      ['prefiks']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['prefiks', 20, 0]
    );
    expect(result.total).toBe(2);
    expect(result.label).toEqual({ kode: 'prefiks', nama: 'prefiks' });
  });

  it('cariEntriPerLabel kategori unsur (alias path baru) memakai kolom jenis pada entri', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 31, entri: 'ber-', jenis: 'prefiks' }] });

    const result = await ModelLabel.cariEntriPerLabel('unsur', 'prefiks', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE aktif = 1 AND jenis = $1'),
      ['prefiks']
    );
    expect(result.total).toBe(2);
    expect(result.label).toEqual({ kode: 'prefiks', nama: 'prefiks' });
  });

  it('cariEntriPerLabel kategori kelas_kata menolak label unsur terikat', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ kode: 'prefiks', nama: 'prefiks', keterangan: '' }] });

    const result = await ModelLabel.cariEntriPerLabel('kelas_kata', 'prefiks', 20, 0);

    expect(result).toEqual({ data: [], total: 0, label: null });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('cariEntriPerLabel kategori kelas_kata mengembalikan kosong saat label tidak ditemukan', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.cariEntriPerLabel('kelas-kata', 'nomina', 20, 0);

    expect(result).toEqual({ data: [], total: 0, label: null });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('cariEntriPerLabel kategori kelas sebagai alias kelas_kata', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ kode: 'n', nama: 'nomina', keterangan: null }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 88, entri: 'akar' }] });

    const result = await ModelLabel.cariEntriPerLabel('kelas', 'n', 20, 0);

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.kelas_kata = ANY($1::text[])'),
      [['n', 'nomina']]
    );
    expect(result.total).toBe(1);
  });

  it('cariEntriPerLabelCursor mengembalikan kosong untuk kategori tidak valid', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('tidak-ada', 'x', { limit: 10 });

    expect(db.query).not.toHaveBeenCalled();
    expect(result).toEqual({
      data: [],
      total: 0,
      label: null,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('cariEntriPerLabelCursor kategori tidak valid tetap aman saat kode undefined', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('tidak-ada', undefined);
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('cariEntriPerLabelCursor abjad invalid mengembalikan kosong', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('abjad', '12');
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('cariEntriPerLabelCursor abjad mengembalikan kosong saat total 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('abjad', 'a', { limit: 2 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT COUNT(*) AS total'),
      ['A']
    );
    expect(result).toEqual({
      data: [],
      total: 0,
      label: { kode: 'A', nama: 'A' },
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('cariEntriPerLabelCursor kategori label next dengan cursor menambah where tuple', async () => {
    const cursor = encodeCursor({ entri: 'abjad', id: 10 });
    db.query
      .mockResolvedValueOnce({ rows: [{ kategori: 'ragam', kode: 'cak', nama: 'cakapan', keterangan: '' }] })
      .mockResolvedValueOnce({ rows: [{ total: '5' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 11, entri: 'acuh', indeks: 'acuh', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
          { id: 12, entri: 'adat', indeks: 'adat', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
          { id: 13, entri: 'adib', indeks: 'adib', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
        ],
      });

    const result = await ModelLabel.cariEntriPerLabelCursor('ragam', 'cak', {
      limit: 2,
      cursor,
      direction: 'next',
      hitungTotal: true,
    });

    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('AND (l.entri, l.id) > ($2, $3)'),
      [['cak', 'cakapan'], 'abjad', 10, 3]
    );
    expect(result.label).toEqual({ kategori: 'ragam', kode: 'cak', nama: 'cakapan', keterangan: '' });
    expect(result.data).toHaveLength(2);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariEntriPerLabelCursor jenis prev tanpa hitungTotal membalik urutan hasil', async () => {
    const cursor = encodeCursor({ entri: 'kata', id: 20 });
    db.query.mockResolvedValueOnce({
      rows: [
        { id: 19, entri: 'zulu', indeks: 'zulu', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
        { id: 18, entri: 'yankee', indeks: 'yankee', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
        { id: 17, entri: 'xray', indeks: 'xray', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
      ],
    });

    const result = await ModelLabel.cariEntriPerLabelCursor('jenis', 'dasar', {
      limit: 2,
      cursor,
      direction: 'prev',
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (l.entri, l.id) < ($2, $3)'),
      ['dasar', 'kata', 20, 3]
    );
    expect(result.data.map((item) => item.entri)).toEqual(['yankee', 'zulu']);
    expect(result.total).toBe(0);
    expect(result.hasPrev).toBe(true);
    expect(result.hasNext).toBe(true);
  });

  it('cariEntriPerLabelCursor bentuk valid mengembalikan data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 4, entri: 'berkata', indeks: 'berkata', jenis: 'turunan', jenis_rujuk: null, entri_rujuk: null }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('bentuk', 'turunan', { limit: 2 });
    expect(result.total).toBe(1);
    expect(result.label).toEqual({ kode: 'turunan', nama: 'turunan' });
  });

  it('cariEntriPerLabelCursor ekspresi valid mengembalikan data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 5, entri: 'buah bibir', indeks: 'buah bibir', jenis: 'idiom', jenis_rujuk: null, entri_rujuk: null }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('ekspresi', 'idiom', { limit: 2 });
    expect(result.total).toBe(1);
    expect(result.label).toEqual({ kode: 'idiom', nama: 'idiom' });
  });

  it('cariEntriPerLabelCursor jenis invalid mengembalikan kosong', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('jenis', 'tidak-valid');
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('cariEntriPerLabelCursor unsur valid mengembalikan data', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 6, entri: 'meng-', indeks: 'meng-', jenis: 'prefiks', jenis_rujuk: null, entri_rujuk: null }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('unsur', 'prefiks', { limit: 2 });
    expect(result.total).toBe(1);
    expect(result.label).toEqual({ kode: 'prefiks', nama: 'prefiks' });
  });

  it('cariEntriPerLabelCursor lastPage mengatur hasNext false', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '3' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, entri: 'beta', indeks: 'beta', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
          { id: 1, entri: 'alpha', indeks: 'alpha', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
        ],
      });

    const result = await ModelLabel.cariEntriPerLabelCursor('jenis', 'dasar', {
      limit: 2,
      lastPage: true,
      hitungTotal: true,
    });

    expect(result.data.map((item) => item.entri)).toEqual(['alpha', 'beta']);
    expect(result.hasNext).toBe(false);
    expect(result.hasPrev).toBe(true);
  });

  it('cariEntriPerLabelCursor kelas-kata mengembalikan kosong bila label tidak bebas', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ kategori: 'kelas-kata', kode: 'prefiks', nama: 'prefiks', keterangan: '' }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('kelas-kata', 'prefiks', { limit: 10 });

    expect(result).toEqual({
      data: [],
      total: 0,
      label: null,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('cariEntriPerLabelCursor kelas-kata mengembalikan kosong bila label tidak ditemukan', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.cariEntriPerLabelCursor('kelas-kata', 'nomina');

    expect(result).toEqual({
      data: [],
      total: 0,
      label: null,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
    expect(db.query).toHaveBeenCalledTimes(1);
  });

  it('cariEntriPerLabelCursor kelas-kata valid memakai kolom makna kelas_kata', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ kategori: 'kelas-kata', kode: 'n', nama: 'nomina', keterangan: null }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, entri: 'akar', indeks: 'akar', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('kelas-kata', 'n');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('m.kelas_kata = ANY($1::text[])'),
      [['n', 'nomina']]
    );
    expect(result.total).toBe(1);
  });

  it('cariEntriPerLabelCursor bentuk invalid mengembalikan kosong', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('bentuk', 'tidak-valid');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('cariEntriPerLabelCursor ekspresi invalid mengembalikan kosong', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('ekspresi', 'tidak-valid');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('cariEntriPerLabelCursor unsur invalid mengembalikan kosong', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('unsur', 'tidak-valid');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('cariEntriPerLabelCursor unsur_terikat invalid mengembalikan kosong', async () => {
    const result = await ModelLabel.cariEntriPerLabelCursor('unsur_terikat', 'tidak-valid');
    expect(result.data).toEqual([]);
    expect(result.total).toBe(0);
  });

  it('cariEntriPerLabelCursor jenis memakai default options saat tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, entri: 'beta', indeks: 'beta', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null }] });

    const result = await ModelLabel.cariEntriPerLabelCursor('jenis', 'dasar');

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2'),
      ['dasar', 21]
    );
    expect(result.total).toBe(1);
  });

  it('_cariEntriCursorDenganKondisi memakai default argumen dan cursor null saat rows kosong', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel._cariEntriCursorDenganKondisi({
      whereSql: 'l.aktif = 1',
      label: null,
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $1'),
      [21]
    );
    expect(result).toEqual({
      data: [],
      total: 0,
      label: null,
      hasNext: false,
      hasPrev: false,
      nextCursor: null,
      prevCursor: null,
    });
  });

  it('_cariEntriCursorDenganKondisi memakai default hitungTotal=true saat properti tidak diberikan', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelLabel._cariEntriCursorDenganKondisi({
      whereSql: 'l.aktif = 1',
      label: null,
    });

    expect(db.query).toHaveBeenCalledTimes(1);
    expect(result.total).toBe(0);
    expect(result.data).toEqual([]);
  });

  it('_cariEntriCursorDenganKondisi dengan payload cursor kosong memakai fallback default', async () => {
    const cursor = encodeCursor({});
    db.query.mockResolvedValueOnce({ rows: [{ id: 1, entri: 'alpha', indeks: 'alpha', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null }] });

    const result = await ModelLabel._cariEntriCursorDenganKondisi({
      whereSql: 'l.aktif = 1 AND l.jenis = $1',
      params: ['dasar'],
      label: { kode: 'dasar', nama: 'dasar' },
      cursor,
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('AND (l.entri, l.id) > ($2, $3)'),
      ['dasar', '', 0, 21]
    );
    expect(result.prevCursor).toEqual(expect.any(String));
    expect(result.nextCursor).toEqual(expect.any(String));
  });

  it('_cariEntriCursorDenganKondisi menormalkan limit invalid ke default', async () => {
    db.query.mockResolvedValueOnce({ rows: [] });

    await ModelLabel._cariEntriCursorDenganKondisi({
      whereSql: 'l.aktif = 1',
      label: null,
      limit: 0,
      hitungTotal: false,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('LIMIT $1'),
      [21]
    );
  });

  it('_cariEntriCursorDenganKondisi lastPage dapat bernilai hasPrev false', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({
        rows: [
          { id: 2, entri: 'beta', indeks: 'beta', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
          { id: 1, entri: 'alpha', indeks: 'alpha', jenis: 'dasar', jenis_rujuk: null, entri_rujuk: null },
        ],
      });

    const result = await ModelLabel._cariEntriCursorDenganKondisi({
      whereSql: 'l.aktif = 1 AND l.jenis = $1',
      params: ['dasar'],
      label: { kode: 'dasar', nama: 'dasar' },
      lastPage: true,
      limit: 2,
      hitungTotal: true,
    });

    expect(result.hasPrev).toBe(false);
    expect(result.hasNext).toBe(false);
  });

  it('cariEntriPerLabel kategori unsur_terikat mengembalikan kosong saat label tidak ditemukan', async () => {
    const result = await ModelLabel.cariEntriPerLabel('unsur_terikat', 'tidak-ada', 20, 0);

    expect(result).toEqual({ data: [], total: 0, label: null });
    expect(db.query).not.toHaveBeenCalled();
  });

  it('daftarAdmin tanpa q memakai paginasi default where kosong', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1, kategori: 'ragam', kode: 'cak' }] });

    const result = await ModelLabel.daftarAdmin({ limit: 5, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('SELECT COUNT(*) AS total FROM label'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [5, 1]
    );
    expect(result).toEqual({ data: [{ id: 1, kategori: 'ragam', kode: 'cak' }], total: 2 });
  });

  it('daftarAdmin dapat dipanggil tanpa argumen dan memakai nilai default', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    const result = await ModelLabel.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [50, 0]
    );
    expect(result).toEqual({ data: [], total: 0 });
  });

  it('daftarAdmin dengan q membentuk WHERE ILIKE dan parameter berurutan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 2, kategori: 'bahasa', kode: 'id', nama: 'Indonesia' }] });

    const result = await ModelLabel.daftarAdmin({ limit: 7, offset: 3, q: 'indo' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('kategori ILIKE $1'),
      ['%indo%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%indo%', 7, 3]
    );
    expect(result.total).toBe(1);
  });

  it('daftarAdmin menambahkan filter aktif=true ketika aktif=1', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, kode: 'cak' }] });

    await ModelLabel.daftarAdmin({ q: 'cak', aktif: '1', limit: 10, offset: 1 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('aktif = TRUE'),
      ['%cak%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%cak%', 10, 1]
    );
  });

  it('daftarAdmin menambahkan filter aktif=false ketika aktif=0', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 10, kode: 'ark' }] });

    await ModelLabel.daftarAdmin({ q: 'ark', aktif: '0', limit: 8, offset: 3 });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('aktif = FALSE'),
      ['%ark%']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $2 OFFSET $3'),
      ['%ark%', 8, 3]
    );
  });

  it('ambilDenganId mengembalikan baris pertama atau null', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 11, kategori: 'ragam', kode: 'cak' }] })
      .mockResolvedValueOnce({ rows: [] });

    const found = await ModelLabel.ambilDenganId(11);
    const notFound = await ModelLabel.ambilDenganId(99);

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      'SELECT id, kategori, kode, nama, urutan, keterangan, aktif FROM label WHERE id = $1',
      [11]
    );
    expect(found).toEqual({ id: 11, kategori: 'ragam', kode: 'cak' });
    expect(notFound).toBeNull();
  });

  it('simpan melakukan INSERT dengan normalisasi null untuk field opsional', async () => {
    db.query.mockResolvedValueOnce({
      rows: [{ id: 21, kategori: 'ragam', kode: 'cak', nama: 'cakapan', urutan: 1, keterangan: null }],
    });

    const result = await ModelLabel.simpan({
      kategori: 'ragam',
      kode: 'cak',
      nama: 'cakapan',
      keterangan: '',
      urutan: undefined,
    });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO label'),
      ['ragam', 'cak', 'cakapan', 1, null, true]
    );
    expect(result.id).toBe(21);
  });

  it('hitungTotal mengembalikan angka total label', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '17' }] });

    const total = await ModelLabel.hitungTotal();
    expect(total).toBe(17);
  });

  it('simpan melakukan UPDATE dan bisa mengembalikan null saat id tidak ditemukan', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{ id: 22, kategori: 'bahasa', kode: 'id', nama: 'Indonesia', urutan: 1, keterangan: null }],
      })
      .mockResolvedValueOnce({ rows: [] });

    const updated = await ModelLabel.simpan({
      id: 22,
      kategori: 'bahasa',
      kode: 'id',
      nama: 'Indonesia',
      urutan: 1,
      keterangan: null,
    });
    const missing = await ModelLabel.simpan({
      id: 404,
      kategori: 'bahasa',
      kode: 'xx',
      nama: 'Kosong',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('UPDATE label'),
      ['bahasa', 'id', 'Indonesia', 1, null, true, 22]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE label'),
      ['bahasa', 'xx', 'Kosong', 1, null, true, 404]
    );
    expect(updated.id).toBe(22);
    expect(missing).toBeNull();
  });

  it('hapus mengembalikan boolean dari rowCount', async () => {
    db.query
      .mockResolvedValueOnce({ rowCount: 1 })
      .mockResolvedValueOnce({ rowCount: 0 });

    const deleted = await ModelLabel.hapus(5);
    const notDeleted = await ModelLabel.hapus(6);

    expect(db.query).toHaveBeenNthCalledWith(1, 'DELETE FROM label WHERE id = $1 RETURNING id', [5]);
    expect(db.query).toHaveBeenNthCalledWith(2, 'DELETE FROM label WHERE id = $1 RETURNING id', [6]);
    expect(deleted).toBe(true);
    expect(notDeleted).toBe(false);
  });

  it('ambilKategoriUntukRedaksi mengembalikan objek kosong untuk kategori tidak valid', async () => {
    const result = await ModelLabel.ambilKategoriUntukRedaksi(['x', 'y', '']);

    expect(result).toEqual({});
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilKategoriUntukRedaksi memakai daftar default dan normalisasi kategori', async () => {
    db.query.mockResolvedValue({
      rows: [
        { kategori: 'kelas_kata', kode: 'n', nama: 'nomina' },
        { kategori: 'kelas-kata', kode: 'v', nama: 'verba' },
        { kategori: 'kelas-kata', kode: 'v', nama: 'verba' },
        { kategori: 'ragam', kode: 'cak', nama: 'cakapan' },
        { kategori: 'asing', kode: 'x', nama: 'abaikan' },
      ],
    });

    const result = await ModelLabel.ambilKategoriUntukRedaksi();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE kategori = ANY($1::text[])'),
      [expect.arrayContaining(['kelas-kata', 'kelas_kata', 'ragam', 'bidang', 'bahasa'])]
    );
    expect(result['kelas-kata']).toEqual([
      { kode: 'n', nama: 'nomina' },
      { kode: 'v', nama: 'verba' },
    ]);
    expect(result.ragam).toEqual([{ kode: 'cak', nama: 'cakapan' }]);
    expect(result).toHaveProperty('bentuk-kata');
    expect(result).toHaveProperty('jenis-rujuk');
    expect(result).toHaveProperty('penyingkatan');
  });

  it('ambilKategoriUntukRedaksi menerima daftar kategori terfilter dan deduplikasi input', async () => {
    db.query.mockResolvedValue({
      rows: [{ kategori: 'kelas_kata', kode: 'n', nama: 'nomina' }],
    });

    const result = await ModelLabel.ambilKategoriUntukRedaksi(['kelas', 'kelas_kata', 'kelas-kata', 'tidak-ada']);

    expect(db.query).toHaveBeenCalledWith(
      expect.any(String),
      [expect.arrayContaining(['kelas-kata', 'kelas_kata'])]
    );
    expect(result).toEqual({
      'kelas-kata': [{ kode: 'n', nama: 'nomina' }],
    });
  });

  it('helper private modelLabel menutup branch normalisasi dan deduplikasi', () => {
    expect(__private.normalisasiKategoriLabel()).toBe('');
    expect(__private.normalisasiKategoriLabel('kelas_kata')).toBe('kelas-kata');
    expect(__private.normalisasiKategoriLabel('kelas')).toBe('kelas-kata');
    expect(__private.normalisasiKategoriLabel(' ragam ')).toBe('ragam');

    expect(__private.kandidatKategoriLabel()).toEqual([]);
    expect(__private.kandidatKategoriLabel('kelas-kata')).toEqual(['kelas-kata', 'kelas_kata']);
    expect(__private.kandidatKategoriLabel('bahasa')).toEqual(['bahasa']);
    expect(__private.kandidatKategoriLabel('')).toEqual([]);

    expect(__private.normalizeLabelValue(' Nomina ')).toBe('nomina');

    const sorted = __private.urutkanLabelPrioritas(
      [
        { kode: 'x', nama: 'zeta' },
        { kode: 'n', nama: 'nomina' },
        { kode: 'v', nama: 'verba' },
      ],
      ['nomina', 'verba']
    );
    expect(sorted.map((item) => item.nama)).toEqual(['nomina', 'verba', 'zeta']);

    const sortedInverse = __private.urutkanLabelPrioritas(
      [
        { kode: 'x', nama: 'zeta' },
        { kode: 'n', nama: 'nomina' },
      ],
      ['nomina']
    );
    expect(sortedInverse.map((item) => item.nama)).toEqual(['nomina', 'zeta']);

    const sortedFallback = __private.urutkanLabelPrioritas(
      [
        {},
        { nama: 'alpha' },
      ],
      []
    );
    expect(sortedFallback.map((item) => item.nama || '')).toEqual(['', 'alpha']);

    const sortedFallbackThree = __private.urutkanLabelPrioritas(
      [
        { nama: 'beta' },
        {},
        { nama: 'alpha' },
      ],
      []
    );
    expect(sortedFallbackThree.map((item) => item.nama || '')).toEqual(['', 'alpha', 'beta']);

    const grouped = {};
    __private.pushLabelUnik(grouped, 'ragam', { kode: 'cak', nama: 'cakapan' });
    __private.pushLabelUnik(grouped, 'ragam', { kode: 'CAK', nama: 'cakapan duplikat' });
    __private.pushLabelUnik(grouped, 'ragam', { kode: 'horm', nama: 'hormat' });
    expect(grouped.ragam).toEqual([
      { kode: 'cak', nama: 'cakapan' },
      { kode: 'horm', nama: 'hormat' },
    ]);

    expect(__private.buildNilaiCocokLabel('kelas-kata')).toEqual(['kelas-kata', 'kelas kata']);
  });
});
