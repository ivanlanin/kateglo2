/**
 * @fileoverview Test ModelAuditMakna
 * @tested_in backend/models/modelAuditMakna.js
 */

const db = require('../../db');
const ModelAuditMakna = require('../../models/modelAuditMakna');

const { __private } = ModelAuditMakna;

describe('ModelAuditMakna', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('helper private memvalidasi integer dan normalisasi status', () => {
    expect(__private.parsePositiveInteger('10', 50)).toBe(10);
    expect(__private.parsePositiveInteger('0', 50)).toBe(50);
    expect(__private.parsePositiveInteger('abc', 50)).toBe(50);

    expect(__private.parseNonNegativeInteger('3', 0)).toBe(3);
    expect(__private.parseNonNegativeInteger('-1', 0)).toBe(0);
    expect(__private.parseNonNegativeInteger('abc', 0)).toBe(0);

    expect(__private.normalizeStatus('  tambah  ')).toBe('tambah');
    expect(__private.normalizeStatus('SALAH')).toBe('salah');
    expect(__private.normalizeStatus('invalid')).toBe('');
    expect(__private.normalizeStatus(null)).toBe('');
  });

  it('daftarAdmin tanpa filter memakai pagination aman', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '2' }] })
      .mockResolvedValueOnce({ rows: [{ id: 1 }, { id: 2 }] });

    const result = await ModelAuditMakna.daftarAdmin({ limit: 999, offset: -3, q: '   ', status: 'invalid' });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM audit_makna a'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [200, 0]
    );
    expect(result).toEqual({ data: [{ id: 1 }, { id: 2 }], total: 2 });
  });

  it('daftarAdmin memakai default argumen saat dipanggil tanpa parameter', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '0' }] })
      .mockResolvedValueOnce({ rows: [] });

    await ModelAuditMakna.daftarAdmin();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM audit_makna a'),
      []
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $1 OFFSET $2'),
      [50, 0]
    );
  });

  it('daftarAdmin dengan filter q dan status membentuk where clause', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ total: '1' }] })
      .mockResolvedValueOnce({ rows: [{ id: 11, status: 'tinjau' }] });

    const result = await ModelAuditMakna.daftarAdmin({
      limit: 10,
      offset: 5,
      q: ' kata ',
      status: ' TINJAU ',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE (a.indeks ILIKE $1) AND a.status = $2'),
      ['%kata%', 'tinjau']
    );
    expect(db.query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('LIMIT $3 OFFSET $4'),
      ['%kata%', 'tinjau', 10, 5]
    );
    expect(result.total).toBe(1);
  });

  it('simpanStatus mengembalikan null saat status tidak valid', async () => {
    const result = await ModelAuditMakna.simpanStatus({ id: 1, status: 'x', catatan: 'abc' });

    expect(result).toBeNull();
    expect(db.query).not.toHaveBeenCalled();
  });

  it('simpanStatus melakukan update dan mengembalikan data pertama', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 3, status: 'nama', catatan: 'ok' }] });

    const result = await ModelAuditMakna.simpanStatus({ id: 3, status: ' Nama ', catatan: '  ok  ' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE audit_makna'),
      ['nama', '  ok  ', 3]
    );
    expect(result).toEqual({ id: 3, status: 'nama', catatan: 'ok' });
  });

  it('simpanStatus mengembalikan null saat update tidak menemukan data', async () => {
    db.query.mockResolvedValue({ rows: [] });

    const result = await ModelAuditMakna.simpanStatus({ id: 99, status: 'salah', catatan: null });

    expect(result).toBeNull();
  });
});
