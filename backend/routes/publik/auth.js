/**
 * @fileoverview Endpoint autentikasi user frontend publik
 */

const express = require('express');
const { authenticate } = require('../../middleware/auth');
const ModelPengguna = require('../../models/akses/modelPengguna');

const router = express.Router();

router.get('/me', authenticate, async (req, res) => {
  let peran = req.user.peran || 'pengguna';
  let aksesRedaksi = Boolean(req.user.akses_redaksi);
  let izin = Array.isArray(req.user.izin) ? req.user.izin : [];

  try {
    const pid = Number.parseInt(req.user.pid, 10);
    if (Number.isFinite(pid) && pid > 0) {
      const pengguna = await ModelPengguna.ambilDenganId(pid);
      if (pengguna?.peran_id) {
        const [peranData, izinDb] = await Promise.all([
          ModelPengguna.ambilPeranUntukAuth(pengguna.peran_id),
          ModelPengguna.ambilIzin(pengguna.peran_id),
        ]);

        peran = peranData?.kode || peran;
        aksesRedaksi = Boolean(peranData?.akses_redaksi);
        izin = Array.isArray(izinDb) ? izinDb : [];
      }
    }
  } catch (_error) {
    // Fallback ke payload token jika sinkronisasi DB gagal.
  }

  res.json({
    success: true,
    data: {
      id: req.user.sub,
      pid: req.user.pid,
      email: req.user.email,
      name: req.user.name,
      picture: req.user.picture,
      peran,
      akses_redaksi: aksesRedaksi,
      izin,
      provider: req.user.provider,
    },
  });
});

module.exports = router;
