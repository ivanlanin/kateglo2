/**
 * @fileoverview Job generator Susun Kata harian
 */

const ModelSusunKata = require('../models/modelSusunKata');

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parseTotalHari(value, fallback = 30) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 365);
}

async function jalankanPrefillSusunKataHarian({ tanggalMulai = null, totalHari = 30 } = {}) {
  const totalHariAman = parseTotalHari(totalHari, 30);
  const tanggalInput = parseTanggal(tanggalMulai);
  const tanggalAcuan = tanggalInput || await ModelSusunKata.ambilTanggalHariIniJakarta();

  if (!tanggalAcuan) {
    return {
      tanggalMulai: null,
      totalHari: totalHariAman,
      data: [],
      jumlah: 0,
    };
  }

  const data = await ModelSusunKata.buatHarianRentang({
    tanggalMulai: tanggalAcuan,
    totalHari: totalHariAman,
  });

  return {
    tanggalMulai: tanggalAcuan,
    totalHari: totalHariAman,
    data,
    jumlah: data.length,
  };
}

module.exports = {
  jalankanPrefillSusunKataHarian,
  parseTanggal,
  parseTotalHari,
};