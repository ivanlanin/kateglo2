import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/authContext';
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
  buildMetaPencarianKamus,
  buildMetaPencarianTesaurus,
  buildMetaSumberGlosarium,
} from './utils/metaUtils';
import { petaItemEjaanBySlug, formatJudulEjaanDariSlug } from './constants/ejaanData';

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  return (lastSpace > maxLen * 0.6 ? cut.substring(0, lastSpace) : cut) + '\u2026';
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

function buildMetaEjaan(slug = '') {
  const slugAman = String(slug || '').trim().replace(/\/+$/, '');
  if (!slugAman) {
    return {
      judul: 'Ejaan Bahasa Indonesia',
      deskripsi:
        'Panduan kaidah ejaan bahasa Indonesia mencakup penggunaan huruf, penulisan kata, tanda baca, dan unsur serapan.',
    };
  }

  const metadata = petaItemEjaanBySlug[slugAman] || {
    judul: formatJudulEjaanDariSlug(slugAman) || 'Ejaan Bahasa Indonesia',
    judulBab: 'Ejaan Bahasa Indonesia',
  };

  return {
    judul: metadata.judul,
    deskripsi: `Kaidah ${metadata.judul} pada bab ${metadata.judulBab} dalam pedoman ejaan bahasa Indonesia di Kateglo.`,
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
    return titled(buildMetaEjaan(seg('/ejaan/')));
  }

  // /kebijakan-privasi
  if (path.startsWith('/kebijakan-privasi')) {
    return { title: 'Kebijakan Privasi \u2014 Kateglo', description: 'Kebijakan privasi layanan Kateglo.' };
  }

  return { ...defaultMeta, canonicalUrl: `${siteBaseUrl}${path}` };
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

  const appHtml = renderToString(
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <MemoryRouter initialEntries={[url]}>
          <App />
        </MemoryRouter>
      </AuthProvider>
    </QueryClientProvider>
  );

  const meta = buildMetaForPath(pathname, siteBaseUrl, prefetchedData);
  const canonicalUrl = meta.canonicalUrl || `${siteBaseUrl}${pathname}`;
  const imageUrl = `${siteBaseUrl}/Logo%20Kateglo.png`;
  const title = escapeHtml(meta.title);
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
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:image" content="${escapedImageUrl}" />
    <meta property="og:image:alt" content="Logo Kateglo" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${escapedImageUrl}" />`;

  return { appHtml, headTags };
}

export const __private = {
  escapeHtml,
  stripTrailingSlash,
  truncate,
  buildKamusDescription: buildDeskripsiDetailKamus,
  buildTesaurusDescription: buildDeskripsiPencarianTesaurus,
  buildGlosariumCariDescription: buildDeskripsiPencarianGlosarium,
  buildMetaForPath,
};
