/**
 * @fileoverview Route redaksi untuk pengaturan kata harian Susun Kata
 */

const express = require('express');
const { periksaIzin } = require('../../middleware/otorisasi');
const ModelSusunKata = require('../../models/modelSusunKata');
const ModelEntri = require('../../models/modelEntri');

const router = express.Router();

function parseTanggal(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) return null;
  return raw;
}

function parsePanjang(value) {
  return ModelSusunKata.parsePanjang(value, 5);
}

function parsePanjangFilter(value) {
  const raw = String(value ?? '').trim();
  if (!raw) return null;
  return ModelSusunKata.parsePanjang(raw, 5);
}

router.get('/harian', periksaIzin('kelola_susun_kata'), async (req, res, next) => {
  try {
    const tanggal = parseTanggal(req.query.tanggal);
    const panjang = parsePanjangFilter(req.query.panjang);

    if (tanggal && panjang !== null) {
      await ModelSusunKata.ambilAtauBuatHarian({ tanggal, panjang });
    }

    if (tanggal && panjang === null) {
      await Promise.all([4, 5, 6, 7, 8].map((item) => ModelSusunKata.ambilAtauBuatHarian({ tanggal, panjang: item })));
    }

    const data = await ModelSusunKata.daftarHarianAdmin({ tanggal, panjang, limit: 500 });

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

    if (panjang === null) {
      return res.status(400).json({ success: false, message: 'Panjang wajib diisi' });
    }

    const harian = await ModelSusunKata.ambilAtauBuatHarian({ tanggal, panjang });

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

module.exports = router;
