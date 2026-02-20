/**
 * @fileoverview Route autentikasi OAuth eksternal
 */

const express = require('express');
const logger = require('../config/logger');
const {
  buildOAuthState,
  parseOAuthState,
  buildGoogleAuthUrl,
  exchangeCodeForToken,
  fetchGoogleProfile,
  buildAppToken,
  buildFrontendCallbackRedirect,
  buildFrontendErrorRedirect,
} = require('../services/layananAuthGoogle');
const ModelPengguna = require('../models/modelPengguna');

const router = express.Router();

router.get('/google', (req, res, next) => {
  try {
    const frontendOrigin = typeof req.query.frontend_origin === 'string'
      ? req.query.frontend_origin
      : '';
    const state = buildOAuthState({ frontendOrigin });
    const authUrl = buildGoogleAuthUrl({ state });
    return res.redirect(authUrl);
  } catch (error) {
    return next(error);
  }
});

router.get('/google/callback', async (req, res) => {
  const { code, error, state } = req.query;
  const parsedState = parseOAuthState(state);
  const frontendOrigin = typeof parsedState.frontendOrigin === 'string'
    ? parsedState.frontendOrigin
    : '';

  if (error) {
    return res.redirect(buildFrontendErrorRedirect('Login Google dibatalkan', { frontendOrigin }));
  }

  if (!code) {
    return res.redirect(buildFrontendErrorRedirect('Kode OAuth tidak tersedia', { frontendOrigin }));
  }

  try {
    const tokenPayload = await exchangeCodeForToken(code);
    const profile = await fetchGoogleProfile(tokenPayload.access_token);

    // Simpan/perbarui pengguna di database
    const pengguna = await ModelPengguna.upsertDariGoogle({
      googleId: profile.id,
      email: profile.email,
      nama: profile.name,
      foto: profile.picture,
    });

    // Bootstrap admin dari ADMIN_EMAILS jika cocok
    await ModelPengguna.bootstrapAdmin(pengguna);

    // Ambil peran dan izin dari database
    const peranData = await ModelPengguna.ambilPeranUntukAuth(pengguna.peran_id);
    const izin = await ModelPengguna.ambilIzin(pengguna.peran_id);

    const appToken = buildAppToken({
      ...profile,
      pid: pengguna.id,
      peran: peranData.kode,
      akses_redaksi: peranData.akses_redaksi,
      izin,
    });

    return res.redirect(buildFrontendCallbackRedirect(appToken, { frontendOrigin }));
  } catch (authError) {
    logger.warn('Google OAuth callback gagal', {
      message: authError.message,
    });
    return res.redirect(buildFrontendErrorRedirect('Autentikasi Google gagal', { frontendOrigin }));
  }
});

module.exports = router;
