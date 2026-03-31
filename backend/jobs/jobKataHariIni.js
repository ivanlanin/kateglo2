/**
 * @fileoverview Job generator Kata Hari Ini
 */

const { generateKataHariIni } = require('../services/publik/layananKamusPublik');

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

function tanggalHariIniJakarta() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

function tambahHari(tanggalStr, hari) {
  const date = new Date(`${tanggalStr}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + hari);
  return date.toISOString().slice(0, 10);
}

async function jalankanPrefillKataHariIni({ tanggalMulai = null, totalHari = 30 } = {}) {
  const totalHariAman = parseTotalHari(totalHari, 30);
  const tanggalInput = parseTanggal(tanggalMulai);
  const tanggalAcuan = tanggalInput || tanggalHariIniJakarta();

  const data = [];
  for (let i = 0; i < totalHariAman; i++) {
    const tanggal = tambahHari(tanggalAcuan, i);
    const hasil = await generateKataHariIni({ tanggal });
    data.push({
      tanggal,
      indeks: hasil?.indeks || null,
      berhasil: Boolean(hasil),
    });
  }

  return {
    tanggalMulai: tanggalAcuan,
    totalHari: totalHariAman,
    data,
    jumlah: data.filter((d) => d.berhasil).length,
  };
}

module.exports = {
  jalankanPrefillKataHariIni,
  parseTanggal,
  parseTotalHari,
};
