import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/authContext';
import { SsrPrefetchProvider } from './context/ssrPrefetchContext';
import {
  buildDeskripsiDetailKamus,
  buildDeskripsiPencarianGlosarium,
  buildDeskripsiPencarianTesaurus,
  buildMetaBidangGlosarium,
  buildMetaBrowseKamus,
  buildMetaBrowseGlosarium,
  buildMetaBrowseTesaurus,
  buildMetaDetailGlosarium,
  buildMetaDetailKamus,
  buildMetaPencarianGlosarium,
  buildMetaKategoriKamus,
  buildMetaTagarKamus,
  buildMetaPencarianKamus,
  buildMetaPencarianTesaurus,
  buildMetaSumberGlosarium,
} from './utils/metaUtils';
import { petaItemEjaanBySlug, formatJudulEjaanDariSlug } from './constants/ejaanData';
import { petaItemGramatikaBySlug, formatJudulGramatikaDariSlug } from './constants/gramatikaData';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeJsonForHtml(value = '') {
  return String(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

function stripTrailingSlash(url = '') {
  return String(url || '').replace(/\/+$/, '');
}

/**
 * Potong teks ke panjang maksimum tanpa memotong di tengah kata.
 */
function truncate(text = '', maxLen = 155) {
  if (text.length <= maxLen) return text;
  const cut = text.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.substring(0, lastSpace) : cut) + ' \u2026';
}

function buildMetaMakna(kata = '') {
  const kataAman = String(kata || '').trim();
  if (!kataAman) {
    return {
      judul: 'Makna',
      deskripsi: 'Cari kata berdasarkan makna di kamus Kateglo.',
    };
  }

  return {
    judul: `Hasil Pencarian Makna "${kataAman}"`,
    deskripsi: `Kata-kata yang maknanya mengandung "${kataAman}" di kamus Kateglo.`,
  };
}

function buildMetaRima(kata = '') {
  const kataAman = String(kata || '').trim();
  if (!kataAman) {
    return {
      judul: 'Rima',
      deskripsi: 'Cari kata berdasarkan rima di kamus Kateglo.',
    };
  }

  return {
    judul: `Hasil Pencarian Rima "${kataAman}"`,
    deskripsi: `Kata-kata yang berima dengan "${kataAman}" di kamus Kateglo.`,
  };
}

function buildMetaEjaan(slug = '', prefetchedData = null) {
  const slugAman = String(slug || '').trim().replace(/\/+$/, '');
  const dataMarkdown = prefetchedData?.type === 'static-markdown'
    && prefetchedData.section === 'ejaan'
    && prefetchedData.slug === slugAman
    ? prefetchedData
    : null;

  if (!slugAman) {
    return {
      judul: 'Ejaan',
      deskripsi:
        'Panduan kaidah ejaan bahasa Indonesia mencakup penggunaan huruf, penulisan kata, tanda baca, dan unsur serapan.',
    };
  }

  if (dataMarkdown?.notFound) {
    return {
      judul: 'Ejaan Tidak Ditemukan',
      deskripsi: 'Halaman ejaan yang diminta tidak ditemukan di Kateglo.',
    };
  }

  const metadata = petaItemEjaanBySlug[slugAman] || {
    judul: formatJudulEjaanDariSlug(slugAman) || 'Ejaan',
    judulBab: 'Ejaan',
  };

  const deskripsiSpesifik = String(dataMarkdown?.description || '').trim();

  return {
    judul: metadata.judul,
    deskripsi: deskripsiSpesifik || `Kaidah ${metadata.judul} pada bab ${metadata.judulBab} dalam pedoman ejaan bahasa Indonesia di Kateglo.`,
  };
}

function buildMetaGramatika(slug = '', prefetchedData = null) {
  const slugAman = String(slug || '').trim().replace(/\/+$/, '');
  const dataMarkdown = prefetchedData?.type === 'static-markdown'
    && prefetchedData.section === 'gramatika'
    && prefetchedData.slug === slugAman
    ? prefetchedData
    : null;

  if (!slugAman) {
    return {
      judul: 'Gramatika',
      deskripsi:
        'Panduan tata bahasa Indonesia mencakup kelas kata, kalimat, dan hubungan antarklausa berdasarkan Tata Bahasa Baku Bahasa Indonesia.',
    };
  }

  if (dataMarkdown?.notFound) {
    return {
      judul: 'Gramatika Tidak Ditemukan',
      deskripsi: 'Halaman gramatika yang diminta tidak ditemukan di Kateglo.',
    };
  }

  const metadata = petaItemGramatikaBySlug[slugAman] || {
    judul: formatJudulGramatikaDariSlug(slugAman) || 'Gramatika',
    judulBab: 'Gramatika',
  };

  const deskripsiSpesifik = String(dataMarkdown?.description || '').trim();

  if (metadata.tipe === 'bab') {
    return {
      judul: metadata.judul,
      deskripsi: deskripsiSpesifik || `Ikhtisar bab ${metadata.judul} dalam panduan tata bahasa Indonesia di Kateglo.`,
    };
  }

  if (metadata.tipe === 'daftar') {
    return {
      judul: metadata.judul,
      deskripsi: deskripsiSpesifik || metadata.deskripsi || `Rujukan ${metadata.judul} dalam panduan tata bahasa Indonesia di Kateglo.`,
    };
  }

  return {
    judul: metadata.judul,
    deskripsi: deskripsiSpesifik || `Penjelasan tentang ${metadata.judul} pada bab ${metadata.judulBab} dalam panduan tata bahasa Indonesia di Kateglo.`,
  };
}

function buildSerializedSsrDataScript(prefetchedData = null) {
  if (!prefetchedData) return '';

  const dataJson = escapeJsonForHtml(JSON.stringify(prefetchedData));
  return `<script>window.__KATEGLO_SSR_DATA__ = ${dataJson};</script>`;
}

function buildSocialTitle(pathname = '/', fallbackTitle = '') {
  const path = decodeURIComponent(pathname || '/');
  const fallback = stripKategloSuffix(fallbackTitle) || 'Kateglo';

  const routeToDomainLabel = () => {
    if (path === '/kamus' || path === '/kamus/' || path.startsWith('/kamus/')) return 'Kamus';
    if (path === '/tesaurus' || path === '/tesaurus/' || path.startsWith('/tesaurus/')) return 'Tesaurus';
    if (path === '/glosarium' || path === '/glosarium/' || path.startsWith('/glosarium/')) return 'Glosarium';
    if (path === '/makna' || path === '/makna/' || path.startsWith('/makna/')) return 'Makna';
    if (path === '/rima' || path === '/rima/' || path.startsWith('/rima/')) return 'Rima';
    if (path === '/gramatika' || path === '/gramatika/' || path.startsWith('/gramatika/')) return 'Gramatika';
    if (path === '/ejaan' || path === '/ejaan/' || path.startsWith('/ejaan/')) return 'Ejaan';
    if (path === '/alat' || path === '/alat/' || path.startsWith('/alat/')) return 'Alat';
    if (path === '/gim' || path === '/gim/' || path.startsWith('/gim/')) return 'Gim';
    return '';
  };

  const domainLabel = routeToDomainLabel();
  if (!domainLabel) return `${fallback} — Kateglo`;

  if (!fallback || fallback.toLowerCase() === domainLabel.toLowerCase()) {
    return `${domainLabel} — Kateglo`;
  }

  return `${fallback} — ${domainLabel} — Kateglo`;
}

function stripKategloSuffix(value = '') {
  return String(value || '').replace(/\s+[—-]\s+Kateglo$/, '').trim();
}

function buildOgQueryString(params = {}) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    const normalized = String(value || '').trim();
    if (normalized) searchParams.set(key, normalized);
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}

function buildGenericSocialContext(pathname = '/') {
  const path = decodeURIComponent(pathname || '/');

  if (path.startsWith('/kamus/detail/')) return { section: 'kamus', context: 'Entri Kamus Bahasa Indonesia' };
  if (path.startsWith('/kamus/cari/')) return { section: 'kamus', context: 'Hasil Pencarian Kamus' };
  if (path === '/kamus' || path === '/kamus/') return { section: 'kamus', context: 'Kamus Bahasa Indonesia' };
  if (path.startsWith('/kamus/')) return { section: 'kamus', context: 'Kategori Kamus Bahasa Indonesia' };

  if (path.startsWith('/tesaurus/cari/')) return { section: 'tesaurus', context: 'Hasil Pencarian Tesaurus' };
  if (path.startsWith('/tesaurus')) return { section: 'tesaurus', context: 'Sinonim dan Antonim' };

  if (path.startsWith('/glosarium/detail/')) return { section: 'glosarium', context: 'Padanan Istilah Bahasa Indonesia' };
  if (path.startsWith('/glosarium/cari/')) return { section: 'glosarium', context: 'Hasil Pencarian Glosarium' };
  if (path.startsWith('/glosarium/bidang/')) return { section: 'glosarium', context: 'Glosarium per Bidang' };
  if (path.startsWith('/glosarium/sumber/')) return { section: 'glosarium', context: 'Glosarium per Sumber' };
  if (path.startsWith('/glosarium')) return { section: 'glosarium', context: 'Istilah dan Padanan Bidang Ilmu' };

  if (path.startsWith('/makna')) return { section: 'makna', context: 'Cari Kata Berdasarkan Makna' };
  if (path.startsWith('/rima')) return { section: 'rima', context: 'Cari Kata Berdasarkan Rima' };

  if (path === '/alat' || path === '/alat/') return { section: 'alat', context: 'Perangkat Bahasa Indonesia' };
  if (path.startsWith('/alat/')) return { section: 'alat', context: 'Alat Bahasa Indonesia' };

  if (path === '/gim' || path === '/gim/') return { section: 'gim', context: 'Permainan Kata Bahasa Indonesia' };
  if (path.startsWith('/gim/')) return { section: 'gim', context: 'Permainan Bahasa Indonesia' };

  return { section: 'default', context: 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia' };
}

function buildSocialImageUrl(pathname = '/', siteBaseUrl = 'https://kateglo.org', prefetchedData = null) {
  const path = decodeURIComponent(pathname || '/');
  const baseUrl = stripTrailingSlash(siteBaseUrl || 'https://kateglo.org');
  const meta = buildMetaForPath(path, baseUrl, prefetchedData);
  const genericConfig = buildGenericSocialContext(path);
  const defaultImageUrl = `${baseUrl}/og/default.png${buildOgQueryString({
    title: stripKategloSuffix(meta.title),
    context: meta.description,
  })}`;

  if (path.startsWith('/kamus/detail/')) {
    return `${baseUrl}/og/kamus.png${buildOgQueryString({
      title: stripKategloSuffix(meta.title),
      context: meta.description,
      stripTitle: '1',
    })}`;
  }

  if (path === '/ejaan' || path === '/ejaan/') {
    return `${baseUrl}/og/ejaan.png${buildOgQueryString({
      title: 'Panduan Ejaan Bahasa Indonesia',
      context: meta.description,
    })}`;
  }

  if (path.startsWith('/ejaan/')) {
    const slug = path.replace('/ejaan/', '').trim().replace(/\/+$/, '');
    if (!slug || prefetchedData?.notFound) return defaultImageUrl;
    const metadata = petaItemEjaanBySlug[slug] || {
      judul: formatJudulEjaanDariSlug(slug) || 'Ejaan',
      judulBab: 'Ejaan',
    };
    return `${baseUrl}/og/ejaan/${encodeURIComponent(slug)}.png${buildOgQueryString({
      title: metadata.judul,
      context: meta.description,
    })}`;
  }

  if (path === '/gramatika' || path === '/gramatika/') {
    return `${baseUrl}/og/gramatika.png${buildOgQueryString({
      title: 'Panduan Tata Bahasa Indonesia',
      context: meta.description,
    })}`;
  }

  if (path.startsWith('/gramatika/')) {
    const slug = path.replace('/gramatika/', '').trim().replace(/\/+$/, '');
    if (!slug || prefetchedData?.notFound) return defaultImageUrl;
    const metadata = petaItemGramatikaBySlug[slug] || {
      judul: formatJudulGramatikaDariSlug(slug) || 'Gramatika',
      judulBab: 'Gramatika',
    };
    return `${baseUrl}/og/gramatika/${encodeURIComponent(slug)}.png${buildOgQueryString({
      title: metadata.judul,
      context: meta.description,
    })}`;
  }

  return `${baseUrl}/og/${genericConfig.section}.png${buildOgQueryString({
    title: stripKategloSuffix(meta.title),
    context: meta.description,
  })}`;
}

function resolveSsrStatusCode(prefetchedData = null) {
  if (prefetchedData?.type === 'static-markdown' && prefetchedData.notFound) {
    return 404;
  }

  return 200;
}

function buildMetaSusunKata(mode = 'harian') {
  if (mode === 'bebas') {
    return {
      judul: 'Susun Kata Bebas',
      deskripsi: 'Mainkan mode bebas Susun Kata untuk menyusun kata bahasa Indonesia kapan saja dengan ronde baru yang bisa diulang langsung di Kateglo.',
    };
  }

  return {
    judul: 'Susun Kata Harian',
    deskripsi: 'Mainkan gim susun kata harian seperti Wordle untuk menyusun kata bahasa Indonesia dalam enam percobaan.',
  };
}

function buildMetaKuisKata() {
  return {
    judul: 'Kuis Kata',
    deskripsi: 'Mainkan kuis kata pilihan ganda di Kateglo untuk menebak arti, sinonim, padanan, makna, dan rima dalam satu ronde cepat.',
  };
}

function buildMetaIhwal() {
  return {
    judul: 'Ihwal Kateglo',
    deskripsi: 'Penjelasan singkat tentang Kateglo, cakupan layanan, sumber, dan arah pengembangannya.',
  };
}

function buildMetaGim() {
  return {
    judul: 'Gim',
    deskripsi: 'Kumpulan gim kata di Kateglo. Saat ini tersedia Kuis Kata dan Susun Kata untuk latihan bahasa Indonesia yang singkat dan interaktif.',
  };
}

function buildMetaAlat() {
  return {
    judul: 'Alat',
    deskripsi: 'Kumpulan alat bahasa Indonesia di Kateglo, termasuk Penganalisis Teks dan Penghitung Huruf untuk analisis cepat langsung di peramban.',
  };
}

function buildMetaPenganalisisTeks() {
  return {
    judul: 'Penganalisis Teks',
    deskripsi: 'Alat untuk menghitung jumlah paragraf, kalimat, dan kata dari teks bahasa Indonesia langsung di Kateglo.',
  };
}

function buildMetaPenghitungHuruf() {
  return {
    judul: 'Penghitung Huruf',
    deskripsi: 'Alat untuk menghitung frekuensi huruf a-z, persentase kemunculan, dan grafik distribusi huruf langsung di Kateglo.',
  };
}

function buildMetaForPath(pathname = '/', siteBaseUrl = 'https://kateglo.org', prefetchedData = null) {
  const defaultMeta = {
    title: 'Kateglo',
    description: 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
  };

  const path = decodeURIComponent(pathname || '/');

  /** Bungkus { judul, deskripsi } menjadi output { title, description } */
  const titled = ({ judul, deskripsi }) => ({ title: `${judul} \u2014 Kateglo`, description: deskripsi });

  /** Kembalikan prefetchedData jika tipenya cocok, null jika tidak */
  const dataFor = (type) => (prefetchedData?.type === type ? prefetchedData : null);

  /** Ekstrak segmen path setelah prefix */
  const seg = (prefix) => path.replace(prefix, '').trim();

  // /kamus/detail/:indeks
  if (path.startsWith('/kamus/detail/')) {
    return titled(buildMetaDetailKamus(seg('/kamus/detail/'), dataFor('kamus-detail')));
  }

  // /kamus/cari/:kata
  if (path.startsWith('/kamus/cari/')) {
    const kata = seg('/kamus/cari/');
    if (!kata) return titled(buildMetaBrowseKamus());

    const metaCari = buildMetaPencarianKamus(kata);
    const data = dataFor('kamus-cari');
    const description = data?.semuaMakna?.length
      ? `${kata}: ${truncate(data.semuaMakna[0].makna, 130)}`
      : metaCari.deskripsi;

    return { title: `${metaCari.judul} \u2014 Kateglo`, description };
  }

  // /kamus/tagar/:kode
  if (path.startsWith('/kamus/tagar/')) {
    const kodeTagar = seg('/kamus/tagar/');
    return titled(buildMetaTagarKamus(kodeTagar ? { nama: kodeTagar } : null, 0));
  }

  // /kamus/:kategori/:kode
  if (/^\/kamus\/[^/]+\/[^/]+/.test(path)) {
    const [kategoriPath = '', kodePath = ''] = path.replace('/kamus/', '').split('/');
    return titled(buildMetaKategoriKamus({ kategori: kategoriPath, kode: kodePath }));
  }

  // /kamus (root)
  if (path === '/kamus' || path === '/kamus/') {
    return titled(buildMetaBrowseKamus());
  }

  // /makna/cari/:kata
  if (path.startsWith('/makna/cari/')) {
    return titled(buildMetaMakna(seg('/makna/cari/')));
  }

  // /makna
  if (path === '/makna' || path === '/makna/') {
    return titled(buildMetaMakna());
  }

  // /rima/cari/:kata
  if (path.startsWith('/rima/cari/')) {
    return titled(buildMetaRima(seg('/rima/cari/')));
  }

  // /rima
  if (path === '/rima' || path === '/rima/') {
    return titled(buildMetaRima());
  }

  // /tesaurus/cari/:kata
  if (path.startsWith('/tesaurus/cari/')) {
    return titled(buildMetaPencarianTesaurus(seg('/tesaurus/cari/'), dataFor('tesaurus-detail')));
  }

  // /tesaurus
  if (path.startsWith('/tesaurus')) {
    return titled(buildMetaBrowseTesaurus());
  }

  // /glosarium/cari/:kata
  if (path.startsWith('/glosarium/cari/')) {
    return titled(buildMetaPencarianGlosarium(seg('/glosarium/cari/'), dataFor('glosarium-cari')));
  }

  // /glosarium/bidang/:bidang
  if (path.startsWith('/glosarium/bidang/')) {
    return titled(buildMetaBidangGlosarium(seg('/glosarium/bidang/'), dataFor('glosarium-bidang')));
  }

  // /glosarium/sumber/:sumber
  if (path.startsWith('/glosarium/sumber/')) {
    return titled(buildMetaSumberGlosarium(seg('/glosarium/sumber/'), dataFor('glosarium-sumber')));
  }

  // /glosarium/detail/:asing
  if (path.startsWith('/glosarium/detail/')) {
    return titled(buildMetaDetailGlosarium(seg('/glosarium/detail/'), dataFor('glosarium-detail')));
  }

  // /glosarium
  if (path.startsWith('/glosarium')) {
    return titled(buildMetaBrowseGlosarium());
  }

  // /ejaan dan /ejaan/:slug
  if (path === '/ejaan' || path === '/ejaan/') {
    return titled(buildMetaEjaan());
  }

  if (path.startsWith('/ejaan/')) {
    return titled(buildMetaEjaan(seg('/ejaan/'), prefetchedData));
  }

  // /gramatika dan /gramatika/:slug
  if (path === '/gramatika' || path === '/gramatika/') {
    return titled(buildMetaGramatika());
  }

  if (path.startsWith('/gramatika/')) {
    return titled(buildMetaGramatika(seg('/gramatika/'), prefetchedData));
  }

  // /alat
  if (path === '/alat' || path === '/alat/') {
    return titled(buildMetaAlat());
  }

  if (path === '/alat/penganalisis-teks' || path === '/alat/penganalisis-teks/') {
    return titled(buildMetaPenganalisisTeks());
  }

  if (path === '/alat/penghitung-huruf' || path === '/alat/penghitung-huruf/') {
    return titled(buildMetaPenghitungHuruf());
  }

  // /gim
  if (path === '/gim' || path === '/gim/') {
    return titled(buildMetaGim());
  }

  // /gim/kuis-kata
  if (path === '/gim/kuis-kata' || path === '/gim/kuis-kata/') {
    return titled(buildMetaKuisKata());
  }

  // /ihwal
  if (path === '/ihwal' || path === '/ihwal/') {
    return titled(buildMetaIhwal());
  }

  // /privasi
  if (path === '/privasi' || path === '/privasi/') {
    return {
      title: 'Kebijakan Privasi — Kateglo',
      description: 'Kebijakan privasi layanan Kateglo.',
      canonicalUrl: `${siteBaseUrl}/privasi`,
    };
  }

  // /kebijakan-privasi
  if (path.startsWith('/kebijakan-privasi')) {
    return {
      title: 'Kebijakan Privasi \u2014 Kateglo',
      description: 'Kebijakan privasi layanan Kateglo.',
      canonicalUrl: `${siteBaseUrl}/privasi`,
    };
  }

  // /gim/susun-kata, /gim/susun-kata/harian, /gim/susun-kata/bebas
  if (path === '/gim/susun-kata' || path === '/gim/susun-kata/') {
    return {
      ...titled(buildMetaSusunKata('harian')),
      canonicalUrl: `${siteBaseUrl}/gim/susun-kata/harian`,
    };
  }

  if (path === '/gim/susun-kata/bebas' || path === '/gim/susun-kata/bebas/') {
    return titled(buildMetaSusunKata('bebas'));
  }

  if (path === '/gim/susun-kata/harian' || path === '/gim/susun-kata/harian/' || path.startsWith('/gim/susun-kata/harian/')) {
    return titled(buildMetaSusunKata('harian'));
  }

  if (path.startsWith('/gim/susun-kata/')) {
    return {
      ...titled(buildMetaSusunKata('harian')),
      canonicalUrl: `${siteBaseUrl}/gim/susun-kata/harian`,
    };
  }

  return { ...defaultMeta, canonicalUrl: `${siteBaseUrl}${path}` };
}

function shouldSkipSsr(pathname = '/') {
  const path = decodeURIComponent(pathname || '/');
  return path === '/redaksi' || path.startsWith('/redaksi/');
}

export async function render(url = '/', prefetchedData = null) {
  const runtimeProcess = globalThis.process;
  const siteBaseUrl = stripTrailingSlash(runtimeProcess?.env?.PUBLIC_SITE_URL || 'https://kateglo.org');
  const pathname = url.split('?')[0] || '/';
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
      },
    },
  });
  const serializedStateScript = buildSerializedSsrDataScript(prefetchedData);
  const statusCode = resolveSsrStatusCode(prefetchedData);

  if (shouldSkipSsr(pathname)) {
    const meta = buildMetaForPath(pathname, siteBaseUrl, prefetchedData);
    const canonicalUrl = meta.canonicalUrl;
    const imageUrl = buildSocialImageUrl(pathname, siteBaseUrl, prefetchedData, meta.title);
    const title = escapeHtml(meta.title);
    const socialTitle = escapeHtml(buildSocialTitle(pathname, meta.title));
    const description = escapeHtml(meta.description);
    const escapedCanonicalUrl = escapeHtml(canonicalUrl);
    const escapedImageUrl = escapeHtml(imageUrl);

    const headTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Kateglo" />
    <meta property="og:locale" content="id_ID" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:title" content="${socialTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Logo Kateglo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${socialTitle}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta name="twitter:image:alt" content="Logo Kateglo" />
    ${serializedStateScript}`;

    return { appHtml: '', headTags, statusCode };
  }

  const appHtml = renderToString(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SsrPrefetchProvider value={prefetchedData}>
          <MemoryRouter initialEntries={[url]}>
            <App />
          </MemoryRouter>
        </SsrPrefetchProvider>
      </AuthProvider>
    </QueryClientProvider>
  );

  const meta = buildMetaForPath(pathname, siteBaseUrl, prefetchedData);
  const canonicalUrl = meta.canonicalUrl || `${siteBaseUrl}${pathname}`;
  const imageUrl = buildSocialImageUrl(pathname, siteBaseUrl, prefetchedData, meta.title);
  const title = escapeHtml(meta.title);
  const socialTitle = escapeHtml(buildSocialTitle(pathname, meta.title));
  const description = escapeHtml(meta.description);
  const escapedCanonicalUrl = escapeHtml(canonicalUrl);
  const escapedImageUrl = escapeHtml(imageUrl);

  const headTags = `
    <title>${title}</title>
    <meta name="description" content="${description}" />
    <link rel="canonical" href="${escapedCanonicalUrl}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Kateglo" />
    <meta property="og:locale" content="id_ID" />
    <meta property="og:url" content="${escapedCanonicalUrl}" />
    <meta property="og:title" content="${socialTitle}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:image:type" content="image/png" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta property="og:image:alt" content="Logo Kateglo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${socialTitle}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />
    <meta name="twitter:image:alt" content="Logo Kateglo" />
    ${serializedStateScript}`;

  return { appHtml, headTags, statusCode };
}

export const __private = {
  escapeHtml,
  escapeJsonForHtml,
  stripTrailingSlash,
  truncate,
  stripKategloSuffix,
  buildOgQueryString,
  buildGenericSocialContext,
  buildKamusDescription: buildDeskripsiDetailKamus,
  buildTesaurusDescription: buildDeskripsiPencarianTesaurus,
  buildGlosariumCariDescription: buildDeskripsiPencarianGlosarium,
  buildMetaEjaan,
  buildMetaGramatika,
  buildSocialTitle,
  buildSocialImageUrl,
  buildSerializedSsrDataScript,
  resolveSsrStatusCode,
  buildMetaForPath,
  shouldSkipSsr,
};
