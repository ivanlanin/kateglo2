/**
 * @fileoverview Route redaksi untuk pengaturan kata harian Susun Kata
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelSusunKata = require('../../models/gim/modelSusunKata');
const ModelEntri = require('../../models/leksikon/modelEntri');

const router = express.Router();

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parsePanjang() {
  return 5;
}

function parsePanjangFilter() {
  return 5;
}

function parseLimit(value, fallback = 200) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 1000);
}

router.get('/harian', periksaIzin('kelola_susun_kata'), async (req, res, next) => {
  try {
    const tanggalFilter = parseTanggal(req.query.tanggal);
    const panjang = parsePanjangFilter(req.query.panjang);

    const data = await ModelSusunKata.daftarHarianAdmin({ tanggal: tanggalFilter, panjang, limit: 500 });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/harian/detail', periksaIzin('kelola_susun_kata'), async (req, res, next) => {
  try {
    const tanggal = parseTanggal(req.query.tanggal);
    const panjang = parsePanjangFilter(req.query.panjang);

    if (!tanggal) {
      return res.status(400).json({ success: false, message: 'Tanggal wajib format YYYY-MM-DD' });
    }

    const harian = await ModelSusunKata.ambilHarian({ tanggal, panjang });

    if (!harian) {
      return res.status(404).json({ success: false, message: 'Kata harian tidak tersedia' });
    }

    const arti = await ModelEntri.ambilArtiSusunKataByIndeks(harian.kata);
    const peserta = await ModelSusunKata.ambilPesertaHarian({ susunKataId: harian.id });

    return res.json({
      success: true,
      data: {
        ...harian,
        tanggal,
        arti,
        jumlahPeserta: peserta.length,
        peserta,
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.put('/harian', periksaIzin('kelola_susun_kata'), async (req, res, next) => {
  try {
    const tanggal = parseTanggal(req.body?.tanggal);
    const panjang = parsePanjang(req.body?.panjang);
    const kata = String(req.body?.kata || '').trim().toLowerCase();
    const keterangan = String(req.body?.keterangan || '').trim();

    if (!tanggal) {
      return res.status(400).json({ success: false, message: 'Tanggal wajib format YYYY-MM-DD' });
    }

    if (!kata) {
      return res.status(400).json({ success: false, message: 'Kata wajib diisi' });
    }

    const data = await ModelSusunKata.simpanHarianAdmin({
      tanggal,
      panjang,
      kata,
      penggunaId: req.user?.pid,
      keterangan,
    });

    return res.json({ success: true, data });
  } catch (error) {
    if (error?.message?.includes('harus')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.message?.includes('tidak valid')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    if (error?.message?.includes('tidak ditemukan')) {
      return res.status(404).json({ success: false, message: error.message });
    }
    return next(error);
  }
});

router.get('/bebas', periksaIzin('kelola_susun_kata'), async (req, res, next) => {
  try {
    const tanggal = parseTanggal(req.query.tanggal);
    const limit = parseLimit(req.query.limit, 200);

    const data = await ModelSusunKata.daftarRekapBebasAdmin({ tanggal, limit });

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
module.exports.__private = {
  parseTanggal,
  parsePanjang,
  parsePanjangFilter,
  parseLimit,
};
