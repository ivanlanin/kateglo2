/**
 * @fileoverview Test ModelOpsi
 * @tested_in backend/models/modelOpsi.js
 */

const db = require('../../db');
const ModelOpsi = require('../../models/modelOpsi');

describe('ModelOpsi', () => {
  beforeEach(() => {
    db.query.mockReset();
  });

  it('daftarLookupBidang memakai pencarian dan mengembalikan rows apa adanya', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 1, kode: 'kim', nama: 'Kimia' }] });

    const result = await ModelOpsi.daftarLookupBidang({ q: 'kim' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('FROM bidang b'),
      ['%kim%']
    );
    expect(result).toEqual([{ id: 1, kode: 'kim', nama: 'Kimia' }]);
  });

  it('daftarLookupBahasa mengembalikan id, kode, nama, dan iso2', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 2, kode: 'Ing', nama: 'Inggris', iso2: 'en' }] });

    const result = await ModelOpsi.daftarLookupBahasa();

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('SELECT ba.id, ba.kode, ba.nama, ba.iso2'),
      []
    );
    expect(result).toEqual([{ id: 2, kode: 'Ing', nama: 'Inggris', iso2: 'en' }]);
  });

  it('daftarLookupSumber menerapkan filter konteks dan q', async () => {
    db.query.mockResolvedValue({ rows: [{ id: 3, kode: 'kbbi', nama: 'KBBI' }] });

    const result = await ModelOpsi.daftarLookupSumber({ q: 'kbb', glosarium: '1', etimologi: '0' });

    expect(db.query).toHaveBeenCalledWith(
      expect.stringContaining('s.glosarium = TRUE'),
      ['%kbb%']
    );
    expect(db.query.mock.calls[0][0]).toContain('s.etimologi = FALSE');
    expect(result).toEqual([{ id: 3, kode: 'kbbi', nama: 'KBBI' }]);
  });

  it('ambilKategoriLabelUntukRedaksi mengembalikan objek kosong untuk kategori tidak valid', async () => {
    const result = await ModelOpsi.ambilKategoriLabelUntukRedaksi(['x', 'y', '']);

    expect(result).toEqual({});
    expect(db.query).not.toHaveBeenCalled();
  });

  it('ambilKategoriLabelUntukRedaksi menggabungkan label biasa dan master', async () => {
    db.query
      .mockResolvedValueOnce({
        rows: [
          { kategori: 'kelas_kata', kode: 'n', nama: 'nomina' },
          { kategori: 'kelas-kata', kode: 'v', nama: 'verba' },
          { kategori: 'ragam', kode: 'cak', nama: 'cakapan' },
        ],
      })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ kode: 'id', nama: 'Indonesia' }] });

    const result = await ModelOpsi.ambilKategoriLabelUntukRedaksi();

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('FROM label'),
      [expect.arrayContaining(['kelas-kata', 'kelas_kata', 'ragam'])]
    );
    expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('WHERE kamus = TRUE'));
    expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('FROM bahasa'));
    expect(result['kelas-kata']).toEqual([
      { kode: 'n', nama: 'nomina' },
      { kode: 'v', nama: 'verba' },
    ]);
    expect(result.ragam).toEqual([{ kode: 'cak', nama: 'cakapan' }]);
    expect(result.bidang).toEqual([]);
    expect(result.bahasa).toEqual([{ kode: 'id', nama: 'Indonesia' }]);
  });

  it('simpanMasterBidang membuat data baru lalu memuat detailnya', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [{ id: 9 }] })
      .mockResolvedValueOnce({ rows: [{ id: 9, kode: 'kim', nama: 'Kimia' }] });

    const result = await ModelOpsi.simpanMasterBidang({
      kode: 'kim',
      nama: 'Kimia',
      kamus: false,
      glosarium: true,
      keterangan: 'ipa',
    });

    expect(db.query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('INSERT INTO bidang'),
      ['kim', 'Kimia', false, true, 'ipa']
    );
    expect(result).toEqual({ id: 9, kode: 'kim', nama: 'Kimia' });
  });

  it('hapusMasterBahasa melempar MASTER_IN_USE saat masih dipakai', async () => {
    db.query.mockResolvedValue({ rows: [{ total: '2' }] });

    await expect(ModelOpsi.hapusMasterBahasa(7)).rejects.toMatchObject({
      code: 'MASTER_IN_USE',
      message: 'Bahasa masih dipakai dan tidak bisa dihapus',
    });
  });
});