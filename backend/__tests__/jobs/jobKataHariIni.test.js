/**
 * @fileoverview Test job Kata Hari Ini
 * @tested_in backend/jobs/jobKataHariIni.js
 */

jest.mock('../../services/publik/layananKamusPublik', () => ({
  generateKataHariIni: jest.fn(),
}));

const { generateKataHariIni } = require('../../services/publik/layananKamusPublik');
const {
  jalankanPrefillKataHariIni,
  parseTanggal,
  parseTotalHari,
} = require('../../jobs/jobKataHariIni');

describe('jobs/jobKataHariIni', () => {
  const originalDateTimeFormat = Intl.DateTimeFormat;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    Intl.DateTimeFormat = originalDateTimeFormat;
  });

  it('mem-parsing tanggal dan total hari dengan batas aman', () => {
    expect(parseTanggal()).toBeNull();
    expect(parseTanggal('')).toBeNull();
    expect(parseTanggal('2026/04/05')).toBeNull();
    expect(parseTanggal('2026-04-05')).toBe('2026-04-05');

    expect(parseTotalHari(undefined)).toBe(30);
    expect(parseTotalHari('abc', 14)).toBe(14);
    expect(parseTotalHari('0')).toBe(1);
    expect(parseTotalHari('999')).toBe(365);
    expect(parseTotalHari('7')).toBe(7);
  });

  it('memakai tanggal eksplisit dan menambah hari lintas tahun', async () => {
    generateKataHariIni
      .mockResolvedValueOnce({ indeks: 'akhir' })
      .mockResolvedValueOnce({ indeks: 'awal' });

    const hasil = await jalankanPrefillKataHariIni({
      tanggalMulai: '2026-12-31',
      totalHari: 2,
    });

    expect(generateKataHariIni).toHaveBeenNthCalledWith(1, { tanggal: '2026-12-31' });
    expect(generateKataHariIni).toHaveBeenNthCalledWith(2, { tanggal: '2027-01-01' });
    expect(hasil).toEqual({
      tanggalMulai: '2026-12-31',
      totalHari: 2,
      data: [
        { tanggal: '2026-12-31', indeks: 'akhir', berhasil: true },
        { tanggal: '2027-01-01', indeks: 'awal', berhasil: true },
      ],
      jumlah: 2,
    });
  });

  it('memakai tanggal Jakarta saat input tidak valid dan menandai hasil kosong sebagai gagal', async () => {
    const format = jest.fn(() => '2026-03-31');
    Intl.DateTimeFormat = jest.fn(() => ({ format }));
    generateKataHariIni
      .mockResolvedValueOnce({ indeks: 'maret' })
      .mockResolvedValueOnce(null);

    const hasil = await jalankanPrefillKataHariIni({ tanggalMulai: 'invalid', totalHari: '2' });

    expect(Intl.DateTimeFormat).toHaveBeenCalledWith('en-CA', {
      timeZone: 'Asia/Jakarta',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    expect(format).toHaveBeenCalledTimes(1);
    expect(generateKataHariIni).toHaveBeenNthCalledWith(1, { tanggal: '2026-03-31' });
    expect(generateKataHariIni).toHaveBeenNthCalledWith(2, { tanggal: '2026-04-01' });
    expect(hasil).toEqual({
      tanggalMulai: '2026-03-31',
      totalHari: 2,
      data: [
        { tanggal: '2026-03-31', indeks: 'maret', berhasil: true },
        { tanggal: '2026-04-01', indeks: null, berhasil: false },
      ],
      jumlah: 1,
    });
  });

  it('memakai parameter bawaan saat dipanggil tanpa argumen', async () => {
    const format = jest.fn(() => '2026-04-05');
    Intl.DateTimeFormat = jest.fn(() => ({ format }));
    generateKataHariIni.mockResolvedValue(null);

    const hasil = await jalankanPrefillKataHariIni();

    expect(generateKataHariIni).toHaveBeenCalledTimes(30);
    expect(generateKataHariIni).toHaveBeenNthCalledWith(1, { tanggal: '2026-04-05' });
    expect(generateKataHariIni).toHaveBeenNthCalledWith(30, { tanggal: '2026-05-04' });
    expect(hasil).toEqual({
      tanggalMulai: '2026-04-05',
      totalHari: 30,
      data: expect.any(Array),
      jumlah: 0,
    });
    expect(hasil.data).toHaveLength(30);
  });
});