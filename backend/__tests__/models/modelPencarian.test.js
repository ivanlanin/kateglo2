/**
 * @fileoverview Test model pelacakan kata terpopuler
 * @tested_in backend/models/modelPencarian.js
 */

const db = require('../../db');
const ModelPencarian = require('../../models/modelPencarian');

const { __private } = ModelPencarian;

describe('ModelPencarian', () => {
  beforeEach(() => {
    db.query.mockReset();
    delete process.env.TRACK_SEARCH;
  });

  it('helper private menormalisasi kata, periode, dan limit', () => {
    expect(__private.normalisasiKata('  KaTa   Baru  ')).toBe('kata baru');
    expect(__private.parsePeriode('7hari')).toBe('7hari');
    expect(__private.parsePeriode('ALL')).toBe('all');
    expect(__private.parseLimit('999', 10)).toBe(100);
    expect(__private.parseLimit('0', 10)).toBe(1);
    expect(__private.parseLimit('abc', 10)).toBe(10);
  });

  it('catatPencarian tidak menulis data saat env mematikan pelacakan', async () => {
    process.env.TRACK_SEARCH = 'false';

    const result = await ModelPencarian.catatPencarian('kata');

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

  it('ambilKataTerpopuler all-time memakai agregasi tanpa filter tanggal', async () => {
    db.query.mockResolvedValue({ rows: [{ kata: 'kata', jumlah: '8' }] });

    const result = await ModelPencarian.ambilKataTerpopuler({ periode: 'all', limit: 20, domain: 1 });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM pencarian'),
      [1, 20]
    );
    expect(result).toEqual([{ kata: 'kata', jumlah: 8 }]);
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
});
