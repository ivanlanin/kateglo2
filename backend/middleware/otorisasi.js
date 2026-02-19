/**
 * @fileoverview Middleware otorisasi berbasis izin (permission-based)
 */

/**
 * Periksa apakah pengguna memiliki salah satu izin yang dibutuhkan.
 * Izin diperiksa dari JWT payload (req.user.izin).
 * @param {...string} izinDibutuhkan - Kode izin (OR logic: cukup punya salah satu)
 */
function periksaIzin(...izinDibutuhkan) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Autentikasi diperlukan',
      });
    }

    const izinPengguna = req.user.izin || [];
    const punyaIzin = izinDibutuhkan.some((izin) => izinPengguna.includes(izin));

    if (!punyaIzin) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki izin untuk tindakan ini',
      });
    }

    return next();
  };
}

/**
 * Periksa apakah pengguna adalah admin
 */
function adminSaja(req, res, next) {
  if (!req.user || req.user.peran !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Hanya admin yang dapat mengakses',
    });
  }
  return next();
}

/**
 * Periksa apakah pengguna adalah admin atau penyunting.
 * Digunakan sebagai gate untuk seluruh area /redaksi.
 * Otorisasi lebih rinci per endpoint ditangani oleh periksaIzin.
 */
function redaksiSaja(req, res, next) {
  if (!req.user || !['admin', 'penyunting'].includes(req.user.peran)) {
    return res.status(403).json({
      success: false,
      message: 'Akses terbatas untuk tim redaksi',
    });
  }
  return next();
}

module.exports = { periksaIzin, adminSaja, redaksiSaja };
