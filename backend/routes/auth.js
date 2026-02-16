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
    const appToken = buildAppToken(profile);

    return res.redirect(buildFrontendCallbackRedirect(appToken, { frontendOrigin }));
  } catch (authError) {
    logger.warn('Google OAuth callback gagal', {
      message: authError.message,
    });
    return res.redirect(buildFrontendErrorRedirect('Autentikasi Google gagal', { frontendOrigin }));
  }
});

module.exports = router;
