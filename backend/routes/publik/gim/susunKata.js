/**
 * @fileoverview Route gim Susun Kata publik
 */

const express = require('express');
const { authenticate, authenticateOptional } = require('../../../middleware/auth');
const ModelEntri = require('../../../models/leksikon/modelEntri');
const ModelSusunKata = require('../../../models/gim/modelSusunKata');

const router = express.Router();

function parsePanjang(value) {
  return ModelSusunKata.parsePanjang(value, 5);
}

function parseLimit(value, fallback = 10) {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) return fallback;
  return Math.min(Math.max(parsed, 1), 50);
}

function parseBodyBoolean(value, fallback = false) {
  if (value === true || value === '1' || value === 1 || value === 'true') return true;
  if (value === false || value === '0' || value === 0 || value === 'false') return false;
  return fallback;
}

function ambilTebakanTerakhir(tebakan) {
  const daftar = String(tebakan || '')
    .split(';')
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return daftar[daftar.length - 1] || '';
}

function normalisasiKataParam(value) {
  return String(value || '').trim().toLowerCase();
}

function parseRiwayatTebakanHarian(tebakanRaw, panjang = 5) {
  const panjangAman = parsePanjang(panjang);
  return String(tebakanRaw || '')
    .split(';')
    .map((item) => item.trim().toLowerCase())
    .filter((item) => /^[a-z]+$/.test(item) && item.length === panjangAman)
    .slice(0, 6);
}

async function buildHarianPayload({ panjang, userPid = null }) {
  const tanggal = await ModelSusunKata.ambilTanggalHariIniJakarta();
  const harian = await ModelSusunKata.ambilAtauBuatHarian({ tanggal, panjang });

  if (!harian) {
    return null;
  }

  const arti = await ModelEntri.ambilArtiSusunKataByIndeks(harian.kata);
  const penggunaId = ModelSusunKata.parsePenggunaId(userPid);
  let hasilHariIni = null;
  let progresHariIni = null;

  if (penggunaId) {
    hasilHariIni = await ModelSusunKata.ambilSkorPenggunaHarian({
      susunKataId: harian.id,
      penggunaId,
    });

    if (!hasilHariIni) {
      progresHariIni = await ModelSusunKata.ambilProgresPenggunaHarian({
        susunKataId: harian.id,
        penggunaId,
      });
    }
  }

  return {
    tanggal,
    panjang,
    total: 1,
    target: harian.kata,
    arti,
    kamus: [harian.kata],
    susunKataId: harian.id,
    sudahMainHariIni: Boolean(hasilHariIni),
    hasilHariIni,
    progresHariIni,
  };
}

async function buildBebasPayload({ panjang = null }) {
  const payload = await ModelSusunKata.ambilPuzzleBebas({ panjang });
  if (!payload) return null;

  return {
    ...payload,
    mode: 'bebas',
    sudahMainHariIni: false,
    hasilHariIni: null,
  };
}

router.get('/puzzle', authenticateOptional, async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.query.panjang);
    const payload = await buildHarianPayload({ panjang, userPid: req.user?.pid });

    if (!payload) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: `Kata untuk Susun Kata ${panjang} huruf belum tersedia`,
      });
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get('/harian', authenticateOptional, async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.query.panjang);
    const payload = await buildHarianPayload({ panjang, userPid: req.user?.pid });

    if (!payload) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: `Kata untuk Susun Kata ${panjang} huruf belum tersedia`,
      });
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.get('/bebas', authenticateOptional, async (req, res, next) => {
  try {
    const panjangRaw = req.query.panjang;
    const panjang = panjangRaw ? ModelSusunKata.parsePanjangBebas(panjangRaw, 5) : null;
    const payload = await buildBebasPayload({ panjang });

    if (!payload) {
      return res.status(404).json({
        error: 'Tidak Ditemukan',
        message: 'Kata untuk Susun Kata Bebas belum tersedia',
      });
    }

    return res.json(payload);
  } catch (error) {
    return next(error);
  }
});

router.post('/harian/submit', authenticate, async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.body?.panjang ?? req.query?.panjang);
    const penggunaId = ModelSusunKata.parsePenggunaId(req.user?.pid);

    if (!penggunaId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    const payloadHarian = await buildHarianPayload({ panjang, userPid: req.user?.pid });
    if (!payloadHarian?.susunKataId) {
      return res.status(404).json({ success: false, message: 'Kata harian belum tersedia' });
    }

    const existing = await ModelSusunKata.ambilSkorPenggunaHarian({
      susunKataId: payloadHarian.susunKataId,
      penggunaId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Skor hari ini sudah tercatat',
        data: existing,
      });
    }

    const percobaan = Math.min(Math.max(Number.parseInt(req.body?.percobaan, 10) || 6, 1), 6);
    const detik = Math.min(Math.max(Number.parseInt(req.body?.detik ?? req.body?.waktuDetik, 10) || 0, 0), 86400);
    const tebakan = String(req.body?.tebakan || '').trim().toLowerCase();
    const menang = parseBodyBoolean(req.body?.menang, false);
    const tebakanTerakhir = ambilTebakanTerakhir(tebakan) || String(req.body?.tebakanTerakhir || '').trim().toLowerCase();

    if (menang && tebakanTerakhir && tebakanTerakhir !== payloadHarian.target) {
      return res.status(400).json({
        success: false,
        message: 'Tebakan terakhir tidak cocok dengan kata harian',
      });
    }

    const data = await ModelSusunKata.simpanSkorHarian({
      susunKataId: payloadHarian.susunKataId,
      penggunaId,
      percobaan,
      detik,
      tebakan,
      menang,
    });

    return res.status(201).json({
      success: true,
      data: {
        ...data,
        skor: ModelSusunKata.hitungSkor({ percobaan, menang }),
      },
    });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({
        success: false,
        message: 'Skor hari ini sudah tercatat',
      });
    }
    return next(error);
  }
});

router.post('/harian/progres', authenticate, async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.body?.panjang ?? req.query?.panjang);
    const penggunaId = ModelSusunKata.parsePenggunaId(req.user?.pid);

    if (!penggunaId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    const payloadHarian = await buildHarianPayload({ panjang, userPid: req.user?.pid });
    if (!payloadHarian?.susunKataId) {
      return res.status(404).json({ success: false, message: 'Kata harian belum tersedia' });
    }

    const existing = await ModelSusunKata.ambilSkorPenggunaHarian({
      susunKataId: payloadHarian.susunKataId,
      penggunaId,
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Skor hari ini sudah tercatat',
        data: existing,
      });
    }

    const daftarTebakan = parseRiwayatTebakanHarian(req.body?.tebakan, panjang);
    const tebakan = daftarTebakan.join(';');

    const data = await ModelSusunKata.simpanProgresPenggunaHarian({
      susunKataId: payloadHarian.susunKataId,
      penggunaId,
      tebakan,
    });

    if (!data) {
      return res.status(409).json({
        success: false,
        message: 'Progres tidak dapat diperbarui',
      });
    }

    return res.json({
      success: true,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/harian/klasemen', async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.query.panjang);
    const limit = parseLimit(req.query.limit, 10);
    const payload = await buildHarianPayload({ panjang });

    if (!payload?.susunKataId) {
      return res.status(404).json({
        success: false,
        message: 'Kata harian belum tersedia',
      });
    }

    const data = await ModelSusunKata.ambilKlasemenHarian({
      susunKataId: payload.susunKataId,
      limit,
    });

    return res.json({
      success: true,
      tanggal: payload.tanggal,
      panjang,
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.post('/bebas/submit', authenticate, async (req, res, next) => {
  try {
    const penggunaId = ModelSusunKata.parsePenggunaId(req.user?.pid);

    if (!penggunaId) {
      return res.status(401).json({ success: false, message: 'Autentikasi diperlukan' });
    }

    const panjang = ModelSusunKata.parsePanjangBebas(req.body?.panjang ?? req.query?.panjang, 5);
    const kata = String(req.body?.kata || '').trim().toLowerCase();
    const tanggal = String(req.body?.tanggal || '').trim() || null;
    const percobaan = Math.min(Math.max(Number.parseInt(req.body?.percobaan, 10) || 6, 1), 6);
    const detik = Math.min(Math.max(Number.parseInt(req.body?.detik ?? req.body?.waktuDetik, 10) || 0, 0), 86400);
    const tebakan = String(req.body?.tebakan || '').trim().toLowerCase();
    const menang = parseBodyBoolean(req.body?.menang, false);
    const tebakanTerakhir = ambilTebakanTerakhir(tebakan) || String(req.body?.tebakanTerakhir || '').trim().toLowerCase();

    if (!kata || !/^[a-z]+$/.test(kata) || kata.length !== panjang) {
      return res.status(400).json({ success: false, message: `Kata harus ${panjang} huruf a-z` });
    }

    const valid = await ModelEntri.cekKataSusunKataValid(kata, { panjang });
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Kata tidak ditemukan pada kamus Susun Kata' });
    }

    if (menang && tebakanTerakhir && tebakanTerakhir !== kata) {
      return res.status(400).json({
        success: false,
        message: 'Tebakan terakhir tidak cocok dengan kata bebas',
      });
    }

    const data = await ModelSusunKata.simpanSkorBebas({
      tanggal,
      panjang,
      kata,
      penggunaId,
      percobaan,
      tebakan,
      detik,
      menang,
    });

    return res.status(201).json({
      success: true,
      data: {
        ...data,
        skor: ModelSusunKata.hitungSkor({ percobaan, menang }),
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/bebas/klasemen', async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 10);
    const data = await ModelSusunKata.ambilKlasemenBebas({ limit });

    return res.json({
      success: true,
      mode: 'bebas',
      data,
    });
  } catch (error) {
    return next(error);
  }
});

router.get('/validasi/:kata', async (req, res, next) => {
  try {
    const panjang = parsePanjang(req.query.panjang);
    const kata = normalisasiKataParam(req.params.kata);
    const valid = await ModelEntri.cekKataSusunKataValid(kata, { panjang });

    return res.json({
      kata,
      panjang,
      valid,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;

module.exports.__private = {
  parsePanjang,
  parseLimit,
  parseBodyBoolean,
  ambilTebakanTerakhir,
  parseRiwayatTebakanHarian,
  normalisasiKataParam,
  buildHarianPayload,
  buildBebasPayload,
};
