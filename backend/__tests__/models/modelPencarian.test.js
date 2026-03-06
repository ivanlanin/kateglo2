/**
 * @fileoverview Test model pelacakan kata terpopuler
 * @tested_in backend/models/modelPencarian.js
 */

const db = require('../../db');
const ModelPencarian = require('../../models/modelPencarian');

const { __private } = ModelPencarian;

describe('ModelPencarian', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalTrackSearch = process.env.TRACK_SEARCH;

  beforeEach(() => {
    db.query.mockReset();
    delete process.env.TRACK_SEARCH;
    process.env.NODE_ENV = originalNodeEnv;
  });

  afterAll(() => {
    process.env.NODE_ENV = originalNodeEnv;
    if (originalTrackSearch === undefined) {
      delete process.env.TRACK_SEARCH;
    } else {
      process.env.TRACK_SEARCH = originalTrackSearch;
    }
  });

  it('helper private menormalisasi kata dan parsing dasar', () => {
    expect(__private.normalisasiKata()).toBe('');
    expect(__private.normalisasiKata('  KaTa   Baru  ')).toBe('kata baru');
    expect(__private.normalisasiKata('')).toBe('');

    expect(__private.parsePeriode()).toBe('all');
    expect(__private.parsePeriode('7hari')).toBe('7hari');
    expect(__private.parsePeriode('ALL')).toBe('all');
    expect(__private.parsePeriode('lainnya')).toBe('all');

    expect(__private.parseLimit('7')).toBe(7);
    expect(__private.parseLimit('999', 10)).toBe(100);
    expect(__private.parseLimit('0', 10)).toBe(1);
    expect(__private.parseLimit('abc', 10)).toBe(10);

    expect(__private.parseLimitRedaksi('9')).toBe(9);
    expect(__private.parseLimitRedaksi('9999', 200)).toBe(1000);
    expect(__private.parseLimitRedaksi('0', 200)).toBe(1);
    expect(__private.parseLimitRedaksi('abc', 200)).toBe(200);

    expect(__private.parsePeriodeRedaksi()).toBe('7hari');
    expect(__private.parsePeriodeRedaksi('hariini')).toBe('hariini');
    expect(__private.parsePeriodeRedaksi('all')).toBe('all');
    expect(__private.parsePeriodeRedaksi('30hari')).toBe('30hari');
    expect(__private.parsePeriodeRedaksi('x')).toBe('7hari');

    expect(__private.parseDomain('3')).toBe(3);
    expect(__private.parseDomain('999')).toBe(1);
    expect(__private.parseDomain('999', 5)).toBe(5);

    expect(__private.parseDomainNullable(null)).toBeNull();
    expect(__private.parseDomainNullable('')).toBeNull();
    expect(__private.parseDomainNullable('2')).toBe(2);
    expect(__private.parseDomainNullable('88')).toBeNull();

    expect(__private.parseTanggal('2026-03-01')).toBe('2026-03-01');
    expect(__private.parseTanggal('2026/03/01')).toBeNull();
    expect(__private.parseTanggal('')).toBeNull();
    expect(__private.formatTanggalOutput('2026-03-02')).toBe('2026-03-02');
    expect(__private.formatTanggalOutput(undefined)).toBeNull();
    expect(__private.formatTanggalOutput(new Date('2026-03-02T10:00:00Z'))).toBe('2026-03-02');
    expect(__private.formatTanggalOutput(new Date('invalid'))).toBeNull();
    expect(__private.formatTanggalOutput('   ')).toBeNull();
    expect(__private.formatTanggalOutput('x')).toBeNull();

    expect(__private.namaDomain(1)).toBe('kamus');
    expect(__private.namaDomain(2)).toBe('tesaurus');
    expect(__private.namaDomain(3)).toBe('glosarium');
    expect(__private.namaDomain(4)).toBe('makna');
    expect(__private.namaDomain(5)).toBe('rima');
    expect(__private.namaDomain(99)).toBe('lainnya');
  });

  it('helper private isPelacakanAktif mengikuti env', () => {
    process.env.NODE_ENV = 'development';
    delete process.env.TRACK_SEARCH;
    expect(__private.isPelacakanAktif()).toBe(false);

    process.env.NODE_ENV = 'production';
    delete process.env.TRACK_SEARCH;
    expect(__private.isPelacakanAktif()).toBe(true);

    process.env.TRACK_SEARCH = 'TRUE';
    expect(__private.isPelacakanAktif()).toBe(true);

    process.env.TRACK_SEARCH = 'false';
    expect(__private.isPelacakanAktif()).toBe(false);
    expect(ModelPencarian.pelacakanAktif()).toBe(false);
  });

  it('catatPencarian tidak menulis data saat env mematikan pelacakan', async () => {
    process.env.TRACK_SEARCH = 'false';

    const result = await ModelPencarian.catatPencarian('kata');

    expect(result).toBe(false);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('catatPencarian tidak menulis saat kata kosong', async () => {
    process.env.TRACK_SEARCH = 'true';

    const result = await ModelPencarian.catatPencarian('   ');

    expect(result).toBe(false);
    expect(db.query).not.toHaveBeenCalled();
  });

  it('catatPencarian menulis ke tabel induk pencarian saat aktif', async () => {
    process.env.TRACK_SEARCH = 'true';
    db.query.mockResolvedValue({ rowCount: 1, rows: [] });

    const result = await ModelPencarian.catatPencarian('  KaTa   Baru  ', { domain: 4 });

    expect(result).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pencarian (tanggal, domain, kata, jumlah)'),
      [4, 'kata baru', 1]
    );
  });

  it('catatPencarian memakai fallback domain dan jumlah aman', async () => {
    process.env.TRACK_SEARCH = 'true';
    db.query.mockResolvedValue({ rowCount: 1, rows: [] });

    const result = await ModelPencarian.catatPencarian('Kata', { domain: 999, jumlah: 0 });

    expect(result).toBe(true);
    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO pencarian (tanggal, domain, kata, jumlah)'),
      [1, 'kata', 1]
    );
  });

  it('catatPencarian menangani error query', async () => {
    process.env.TRACK_SEARCH = 'true';
    db.query.mockRejectedValue(new Error('db gagal'));

    const result = await ModelPencarian.catatPencarian('kata');

    expect(result).toBe(false);
  });

  it('ambilKataTerpopuler all-time memakai agregasi tanpa filter tanggal', async () => {
    db.query.mockResolvedValue({ rows: [{ kata: 'kata', jumlah: '8' }] });

    const result = await ModelPencarian.ambilKataTerpopuler({ periode: 'all', limit: 20, domain: 1 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM pencarian'),
      [1, 20]
    );
    expect(result).toEqual([{ kata: 'kata', jumlah: 8 }]);
  });

  it('ambilKataTerpopuler all-time memakai fallback periode/domain/limit', async () => {
    db.query.mockResolvedValue({ rows: [{ kata: 'uji', jumlah: null }] });

    const result = await ModelPencarian.ambilKataTerpopuler({ periode: 'invalid', limit: 999, domain: 99 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE domain = $1'),
      [1, 100]
    );
    expect(result).toEqual([{ kata: 'uji', jumlah: 0 }]);
  });

  it('ambilKataTerpopuler 7hari menambahkan filter rentang tanggal', async () => {
    db.query.mockResolvedValue({ rows: [{ kata: 'kata', jumlah: '3' }] });

    const result = await ModelPencarian.ambilKataTerpopuler({ periode: '7hari', limit: 5, domain: 1 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining("AND tanggal >= CURRENT_DATE - INTERVAL '6 days'"),
      [1, 5]
    );
    expect(result).toEqual([{ kata: 'kata', jumlah: 3 }]);
  });

  it('ambilKataTerpopuler 7hari memakai fallback jumlah 0 saat nilai kosong', async () => {
    db.query.mockResolvedValue({ rows: [{ kata: 'kata', jumlah: null }] });

    const result = await ModelPencarian.ambilKataTerpopuler({ periode: '7hari', limit: 5, domain: 1 });

    expect(result).toEqual([{ kata: 'kata', jumlah: 0 }]);
  });

  it('ambilKataTerpopuler tanpa argumen memakai default dan fallback jumlah 0 di mode 7hari', async () => {
    db.query.mockResolvedValue({ rows: [{ kata: 'uji', jumlah: null }] });

    const result = await ModelPencarian.ambilKataTerpopuler();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('WHERE domain = $1'),
      [1, 10]
    );
    expect(result).toEqual([{ kata: 'uji', jumlah: 0 }]);
  });

  it('ambilFrasaPopulerPerDomain memakai tanggal referensi dan fallback tanggal sebelumnya per domain', async () => {
    db.query.mockResolvedValue({
      rows: [
        { domain: 1, tanggal: '2026-03-02', kata: 'air', jumlah: '12' },
        { domain: 2, tanggal: '2026-03-01', kata: 'kata', jumlah: '9' },
        { domain: 5, tanggal: '2026-02-28', kata: 'rima', jumlah: '4' },
      ],
    });

    const result = await ModelPencarian.ambilFrasaPopulerPerDomain({ tanggalReferensi: '2026-03-02' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('MAX(p.tanggal) AS tanggal'),
      [[1, 2, 3, 4, 5], '2026-03-02']
    );
    expect(result).toEqual([
      { domain: 1, domain_nama: 'kamus', tanggal: '2026-03-02', kata: 'air', jumlah: 12 },
      { domain: 2, domain_nama: 'tesaurus', tanggal: '2026-03-01', kata: 'kata', jumlah: 9 },
      { domain: 3, domain_nama: 'glosarium', tanggal: null, kata: null, jumlah: 0 },
      { domain: 4, domain_nama: 'makna', tanggal: null, kata: null, jumlah: 0 },
      { domain: 5, domain_nama: 'rima', tanggal: '2026-02-28', kata: 'rima', jumlah: 4 },
    ]);
  });

  it('ambilFrasaPopulerPerDomain memakai fallback tanggal hari ini saat tanggal referensi tidak valid', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelPencarian.ambilFrasaPopulerPerDomain({ tanggalReferensi: 'invalid' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('p.tanggal <= $2::date'),
      [
        [1, 2, 3, 4, 5],
        expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      ]
    );
    expect(result).toHaveLength(5);
    expect(result[0]).toEqual({ domain: 1, domain_nama: 'kamus', tanggal: null, kata: null, jumlah: 0 });
  });

  it('ambilFrasaPopulerPerDomain memetakan jumlah fallback 0 saat nilai non numerik', async () => {
    db.query.mockResolvedValue({
      rows: [
        { domain: 1, tanggal: '2026-03-02', kata: null, jumlah: 'abc' },
      ],
    });

    const result = await ModelPencarian.ambilFrasaPopulerPerDomain({ tanggalReferensi: '2026-03-02' });

    expect(result[0]).toEqual({ domain: 1, domain_nama: 'kamus', tanggal: '2026-03-02', kata: null, jumlah: 0 });
  });

  it('ambilFrasaPopulerPerDomain tanpa argumen memakai tanggal hari ini default', async () => {
    db.query.mockResolvedValue({ rows: [] });

    await ModelPencarian.ambilFrasaPopulerPerDomain();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('p.tanggal <= $2::date'),
      [[1, 2, 3, 4, 5], expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)]
    );
  });

  it('ambilStatistikRedaksi menyusun filter domain+tanggal eksplisit', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          domain: 3,
          kata: 'pajak',
          jumlah: '9',
          tanggal_awal: '2026-02-01',
          tanggal_akhir: '2026-02-22',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ domain: 3, jumlah: '9' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const result = await ModelPencarian.ambilStatistikRedaksi({
      domain: '3',
      periode: 'all',
      limit: 9999,
      tanggalMulai: '2026-02-01',
      tanggalSelesai: '2026-02-28',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('MIN(created_at) AS tanggal_awal'),
      [3, '2026-02-01', '2026-02-28', 1000, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('MAX(updated_at) AS tanggal_akhir'),
      [3, '2026-02-01', '2026-02-28', 1000, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE domain = $1 AND tanggal >= $2::date AND tanggal <= $3::date'),
      [3, '2026-02-01', '2026-02-28', 1000, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('GROUP BY domain'),
      [3, '2026-02-01', '2026-02-28']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('GROUP BY domain, kata'),
      [3, '2026-02-01', '2026-02-28']
    );
    expect(result.filter).toEqual({
      domain: 3,
      periode: 'all',
      tanggalMulai: '2026-02-01',
      tanggalSelesai: '2026-02-28',
      limit: 1000,
      offset: 0,
    });
    expect(result.total).toBe(1);
    expect(result.data).toEqual([
      {
        domain: 3,
        domain_nama: 'glosarium',
        kata: 'pajak',
        jumlah: 9,
        tanggal_awal: '2026-02-01',
        tanggal_akhir: '2026-02-22',
        diblokir: false,
      },
    ]);
    expect(result.ringkasanDomain).toEqual([
      { domain: 3, domain_nama: 'glosarium', jumlah: 9 },
    ]);
  });

  it('ambilStatistikRedaksi tanpa argumen memakai default dan filter 7hari', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelPencarian.ambilStatistikRedaksi();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("tanggal >= CURRENT_DATE - INTERVAL '6 days'"),
      [200, 0]
    );
    expect(result.filter).toEqual({
      domain: null,
      periode: '7hari',
      tanggalMulai: null,
      tanggalSelesai: null,
      limit: 200,
      offset: 0,
    });
    expect(result.total).toBe(0);
  });

  it('ambilStatistikRedaksi memakai periode hariini saat tanggal tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelPencarian.ambilStatistikRedaksi({ periode: 'hariini' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('tanggal = CURRENT_DATE'),
      [200, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('tanggal = CURRENT_DATE'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('tanggal = CURRENT_DATE'),
      []
    );
    expect(result.filter.periode).toBe('hariini');
    expect(result.filter.domain).toBeNull();
  });

  it('ambilStatistikRedaksi memakai periode 30hari saat tanggal tidak diberikan', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ total: '0' }] });

    const result = await ModelPencarian.ambilStatistikRedaksi({ periode: '30hari' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("tanggal >= CURRENT_DATE - INTERVAL '29 days'"),
      [200, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("tanggal >= CURRENT_DATE - INTERVAL '29 days'"),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("tanggal >= CURRENT_DATE - INTERVAL '29 days'"),
      []
    );
    expect(result.filter.periode).toBe('30hari');
    expect(result.filter.domain).toBeNull();
  });

  it('ambilStatistikRedaksi memakai periode 7hari default dan namaDomain fallback lainnya', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          domain: 9,
          kata: 'acak',
          jumlah: '2',
          tanggal_awal: '2026-03-01',
          tanggal_akhir: '2026-03-01',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ domain: 9, jumlah: '2' }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const result = await ModelPencarian.ambilStatistikRedaksi({
      domain: 'abc',
      periode: 'xxx',
      limit: '0',
      tanggalMulai: '2026/03/01',
      tanggalSelesai: '2026-03',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("tanggal >= CURRENT_DATE - INTERVAL '6 days'"),
      [1, 0]
    );
    expect(result.filter).toEqual({
      domain: null,
      periode: '7hari',
      tanggalMulai: null,
      tanggalSelesai: null,
      limit: 1,
      offset: 0,
    });
    expect(result.total).toBe(1);
    expect(result.data[0].domain_nama).toBe('lainnya');
    expect(result.ringkasanDomain[0].domain_nama).toBe('lainnya');
  });

  it('ambilStatistikRedaksi tanpa filter menghasilkan whereClause kosong dan fallback angka 0', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [{
          domain: null,
          kata: 'nol',
          jumlah: null,
          tanggal_awal: '2026-03-01',
          tanggal_akhir: '2026-03-01',
        }],
      })
      .mockResolvedValueOnce({ rows: [{ domain: null, jumlah: null }] })
      .mockResolvedValueOnce({ rows: [{ total: '1' }] });

    const result = await ModelPencarian.ambilStatistikRedaksi({ periode: 'all' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM pencarian'),
      [200, 0]
    );
    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.not.stringContaining('WHERE domain ='),
      [200, 0]
    );
    expect(result.total).toBe(1);
    expect(result.data).toEqual([
      {
        domain: 0,
        domain_nama: 'lainnya',
        kata: 'nol',
        jumlah: 0,
        tanggal_awal: '2026-03-01',
        tanggal_akhir: '2026-03-01',
        diblokir: false,
      },
    ]);
    expect(result.ringkasanDomain).toEqual([
      { domain: 0, domain_nama: 'lainnya', jumlah: 0 },
    ]);
  });

  it('hitungTotalKataHarian menghitung total kata per tanggal dengan fallback 0', async () => {
    db.query.mockResolvedValueOnce({ rows: [{ total: '13' }] });
    await expect(ModelPencarian.hitungTotalKataHarian({ tanggal: '2026-03-05' })).resolves.toBe(13);
    expect(db.query).toHaveBeenLastCalledWith(
      expect.stringContaining('SELECT COUNT(kata)::bigint AS total'),
      ['2026-03-05']
    );

    db.query.mockResolvedValueOnce({ rows: [{ total: null }] });
    await expect(ModelPencarian.hitungTotalKataHarian({ tanggal: 'invalid' })).resolves.toBe(0);
    expect(db.query).toHaveBeenLastCalledWith(expect.any(String), [null]);

    db.query.mockResolvedValueOnce({ rows: [] });
    await expect(ModelPencarian.hitungTotalKataHarian()).resolves.toBe(0);
  });
});
