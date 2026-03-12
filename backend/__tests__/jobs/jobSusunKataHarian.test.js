/**
 * @fileoverview Test job Susun Kata harian
 * @tested_in backend/jobs/jobSusunKataHarian.js
 */

jest.mock('../../models/modelSusunKata', () => ({
  ambilTanggalHariIniJakarta: jest.fn(),
  buatHarianRentang: jest.fn(),
}));

const ModelSusunKata = require('../../models/modelSusunKata');
const { jalankanPrefillSusunKataHarian, parseTanggal, parseTotalHari } = require('../../jobs/jobSusunKataHarian');

describe('jobs/jobSusunKataHarian', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    ModelSusunKata.ambilTanggalHariIniJakarta.mockResolvedValue('2026-03-12');
    ModelSusunKata.buatHarianRentang.mockResolvedValue([{ id: 1 }, { id: 2 }]);
  });

  it('parser menormalkan tanggal dan total hari', () => {
    expect(parseTanggal('')).toBeNull();
    expect(parseTanggal('2026/03/12')).toBeNull();
    expect(parseTanggal('2026-03-12')).toBe('2026-03-12');

    expect(parseTotalHari('abc')).toBe(30);
    expect(parseTotalHari('0')).toBe(1);
    expect(parseTotalHari('999')).toBe(365);
    expect(parseTotalHari('7')).toBe(7);
  });

  it('menggunakan tanggal eksplisit bila tersedia', async () => {
    const hasil = await jalankanPrefillSusunKataHarian({ tanggalMulai: '2026-03-20', totalHari: 7 });

    expect(ModelSusunKata.ambilTanggalHariIniJakarta).not.toHaveBeenCalled();
    expect(ModelSusunKata.buatHarianRentang).toHaveBeenCalledWith({ tanggalMulai: '2026-03-20', totalHari: 7 });
    expect(hasil).toEqual({
      tanggalMulai: '2026-03-20',
      totalHari: 7,
      data: [{ id: 1 }, { id: 2 }],
      jumlah: 2,
    });
  });

  it('mengambil tanggal Jakarta bila tanggal tidak dikirim', async () => {
    await jalankanPrefillSusunKataHarian();

    expect(ModelSusunKata.ambilTanggalHariIniJakarta).toHaveBeenCalled();
    expect(ModelSusunKata.buatHarianRentang).toHaveBeenCalledWith({ tanggalMulai: '2026-03-12', totalHari: 30 });
  });

  it('mengembalikan hasil kosong bila tanggal acuan tidak tersedia', async () => {
    ModelSusunKata.ambilTanggalHariIniJakarta.mockResolvedValueOnce(null);

    const hasil = await jalankanPrefillSusunKataHarian({ tanggalMulai: null, totalHari: 10 });

    expect(ModelSusunKata.buatHarianRentang).not.toHaveBeenCalled();
    expect(hasil).toEqual({
      tanggalMulai: null,
      totalHari: 10,
      data: [],
      jumlah: 0,
    });
  });
});