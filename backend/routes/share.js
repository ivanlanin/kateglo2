/**
 * @fileoverview Route preview tautan untuk crawler (Open Graph/Twitter Card)
 */

const express = require('express');
const ModelLabel = require('../models/modelLabel');
const { ambilDetailKamus } = require('../services/layananKamusPublik');
const { getJson, setJson, getTtlSeconds } = require('../services/layananCache');

const router = express.Router();

const defaultTitle = 'Kateglo';
const defaultDescription = 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia';

function sanitizeBaseUrl(url) {
  return String(url || 'https://kateglo.org').replace(/\/+$/, '');
}

function getSiteBaseUrl() {
  return sanitizeBaseUrl(process.env.PUBLIC_SITE_URL || 'https://kateglo.org');
}

function getCacheControlHeader() {
  const ttl = getTtlSeconds();
  return `public, max-age=300, s-maxage=${ttl}`;
}

function escapeHtml(input = '') {
  return String(input)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function safeDecode(value = '') {
  try {
    return decodeURIComponent(value);
  } catch (_error) {
    return String(value);
  }
}

function ringkasTeks(teks = '', maxLength = 180) {
  const normalized = String(teks || '').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trim()}…`;
}

function renderHtmlPreview({ title, description, canonicalUrl, imageUrl, redirectUrl }) {
  const escapedTitle = escapeHtml(title || defaultTitle);
  const escapedDescription = escapeHtml(description || defaultDescription);
  const escapedCanonicalUrl = escapeHtml(canonicalUrl);
  const escapedImageUrl = escapeHtml(imageUrl);
  const escapedRedirectUrl = escapeHtml(redirectUrl);

  return `<!DOCTYPE html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapedTitle}</title>
    <meta name="description" content="${escapedDescription}" />
    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Kateglo" />
    <meta property="og:locale" content="id_ID" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:title" content="${escapedTitle}" />
    <meta property="og:description" content="${escapedDescription}" />
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:image:alt" content="Logo Kateglo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapedTitle}" />
    <meta name="twitter:description" content="${escapedDescription}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta http-equiv="refresh" content="0;url=${escapedRedirectUrl}" />
    <script>window.location.replace(${JSON.stringify(redirectUrl)});</script>
  </head>
  <body>
    <p>Mengarahkan ke <a href="${escapedRedirectUrl}">halaman Kateglo</a>...</p>
  </body>
</html>`;
}

function buatJudulKategori(kategori = '', namaLabel = '') {
  const kategoriMap = {
    ragam: 'Ragam',
    'kelas-kata': 'Kelas Kata',
    kelas_kata: 'Kelas Kata',
    bahasa: 'Bahasa',
    bidang: 'Bidang',
    abjad: 'Abjad',
    bentuk: 'Bentuk Kata',
    ekspresi: 'Ekspresi',
    jenis: 'Jenis',
    unsur: 'Unsur Terikat',
    unsur_terikat: 'Unsur Terikat',
  };
  const labelKategori = kategoriMap[kategori] || 'Kategori';
  const labelNama = namaLabel || safeDecode(kategori);
  return `Kamus ${labelKategori}: ${labelNama} - Kateglo`;
}

async function ambilAtauSetCacheHtml(cacheKey, builder) {
  const cached = await getJson(cacheKey);
  if (cached?.html) {
    return cached.html;
  }

  const html = await builder();
  await setJson(cacheKey, { html }, getTtlSeconds());
  return html;
}

function buildBaseSectionMetadata(pathname = '') {
  const map = {
    kamus: {
      title: 'Kamus - Kateglo',
      description: 'Telusuri entri kamus bahasa Indonesia di Kateglo.',
    },
    tesaurus: {
      title: 'Tesaurus - Kateglo',
      description: 'Temukan sinonim dan antonim bahasa Indonesia di Kateglo.',
    },
    glosarium: {
      title: 'Glosarium - Kateglo',
      description: 'Jelajahi glosarium istilah bidang ilmu di Kateglo.',
    },
  };

  return map[pathname] || {
    title: defaultTitle,
    description: defaultDescription,
  };
}

router.get('/:section(kamus|tesaurus|glosarium)', async (req, res, next) => {
  try {
    const section = String(req.params.section || '').trim().toLowerCase();
    const siteBaseUrl = getSiteBaseUrl();
    const canonicalUrl = `${siteBaseUrl}/${section}`;
    const imageUrl = `${siteBaseUrl}/Logo%20Kateglo.png`;
    const redirectUrl = canonicalUrl;
    const cacheKey = `share:menu:${section}`;

    const html = await ambilAtauSetCacheHtml(cacheKey, async () => {
      const metadata = buildBaseSectionMetadata(section);
      return renderHtmlPreview({
        title: metadata.title,
        description: metadata.description,
        canonicalUrl,
        imageUrl,
        redirectUrl,
      });
    });

    res.set('Cache-Control', getCacheControlHeader());
    return res.type('html').send(html);
  } catch (error) {
    return next(error);
  }
});

router.get('/kamus/detail/:indeks', async (req, res, next) => {
  try {
    const indeks = safeDecode((req.params.indeks || '').trim());
    const siteBaseUrl = getSiteBaseUrl();
    const encodedIndeks = encodeURIComponent(indeks);
    const canonicalUrl = `${siteBaseUrl}/kamus/detail/${encodedIndeks}`;
    const imageUrl = `${siteBaseUrl}/Logo%20Kateglo.png`;
    const redirectUrl = canonicalUrl;
    const cacheKey = `share:kamus:detail:${encodeURIComponent(indeks.toLowerCase())}`;

    const html = await ambilAtauSetCacheHtml(cacheKey, async () => {
      const detail = indeks ? await ambilDetailKamus(indeks) : null;
      const entriUtama = detail?.entri?.[0];
      const judulEntri = entriUtama?.entri || detail?.indeks || indeks || defaultTitle;
      const contohMakna = entriUtama?.makna?.[0]?.makna || '';
      const title = judulEntri && detail ? `${judulEntri} - Kateglo` : defaultTitle;
      const description = detail
        ? ringkasTeks(contohMakna || `Lihat entri kamus ${judulEntri} di Kateglo.`)
        : defaultDescription;

      return renderHtmlPreview({
        title,
        description,
        canonicalUrl,
        imageUrl,
        redirectUrl,
      });
    });

    res.set('Cache-Control', getCacheControlHeader());
    return res.type('html').send(html);
  } catch (error) {
    return next(error);
  }
});

router.get('/kamus/:kategori/:kode', async (req, res, next) => {
  try {
    const kategori = safeDecode((req.params.kategori || '').trim());
    const kode = safeDecode((req.params.kode || '').trim());
    const siteBaseUrl = getSiteBaseUrl();
    const encodedKategori = encodeURIComponent(kategori);
    const encodedKode = encodeURIComponent(kode);
    const canonicalUrl = `${siteBaseUrl}/kamus/${encodedKategori}/${encodedKode}`;
    const imageUrl = `${siteBaseUrl}/Logo%20Kateglo.png`;
    const redirectUrl = canonicalUrl;
    const cacheKey = `share:kamus:kategori:${encodeURIComponent(kategori.toLowerCase())}:${encodeURIComponent(kode.toLowerCase())}`;

    const html = await ambilAtauSetCacheHtml(cacheKey, async () => {
      const hasil = (kategori && kode)
        ? await ModelLabel.cariEntriPerLabel(kategori, kode, 1, 0)
        : { total: 0, label: null };

      const namaLabel = hasil?.label?.nama || kode;
      const title = buatJudulKategori(kategori, namaLabel);
      const jumlah = Number(hasil?.total) || 0;
      const description = jumlah > 0
        ? `${jumlah} entri ditemukan untuk kategori ${namaLabel}.`
        : `Daftar entri kamus untuk kategori ${namaLabel}.`;

      return renderHtmlPreview({
        title,
        description,
        canonicalUrl,
        imageUrl,
        redirectUrl,
      });
    });

    res.set('Cache-Control', getCacheControlHeader());
    return res.type('html').send(html);
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
