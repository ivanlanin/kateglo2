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
  buildMetaDetailKamus,
  buildMetaPencarianGlosarium,
  buildMetaKategoriKamus,
  buildMetaPencarianKamus,
  buildMetaPencarianTesaurus,
  buildMetaSumberGlosarium,
} from './utils/metaUtils';

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
  /* c8 ignore next */
  return (lastSpace > maxLen * 0.6 ? cut.substring(0, lastSpace) : cut) + '\u2026';
}

function buildMetaForPath(pathname = '/', siteBaseUrl = 'https://kateglo.org', prefetchedData = null) {
  const defaultMeta = {
    title: 'Kateglo \u2014 Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
    description: 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
  };

  /* c8 ignore next */
  const decodedPath = decodeURIComponent(pathname || '/');

  // /kamus/detail/:indeks
  if (decodedPath.startsWith('/kamus/detail/')) {
    const indeks = decodedPath.replace('/kamus/detail/', '').trim();
    const metaDetail = buildMetaDetailKamus(
      indeks,
      prefetchedData?.type === 'kamus-detail' ? prefetchedData : null
    );

    return {
      title: `${metaDetail.judul} \u2014 Kateglo`,
      description: metaDetail.deskripsi,
    };
  }

  // /kamus/cari/:kata
  if (decodedPath.startsWith('/kamus/cari/')) {
    const kata = decodedPath.replace('/kamus/cari/', '').trim();
    if (!kata) {
      const metaBrowse = buildMetaBrowseKamus();
      return { title: `${metaBrowse.judul} \u2014 Kateglo`, description: metaBrowse.deskripsi };
    }

    const metaCari = buildMetaPencarianKamus(kata);
    let description = metaCari.deskripsi;
    if (prefetchedData?.type === 'kamus-cari' && prefetchedData.semuaMakna?.length) {
      const ringkasan = prefetchedData.semuaMakna[0].makna;
      description = `${kata}: ${truncate(ringkasan, 130)}`;
    }

    return {
      title: `${metaCari.judul} \u2014 Kateglo`,
      description,
    };
  }

  // /kamus/:kategori/:kode
  if (/^\/kamus\/[^/]+\/[^/]+/.test(decodedPath)) {
    const [kategoriPath = '', kodePath = ''] = decodedPath.replace('/kamus/', '').split('/');
    const metaKategori = buildMetaKategoriKamus({ kategori: kategoriPath, kode: kodePath });

    return {
      title: `${metaKategori.judul} \u2014 Kateglo`,
      description: metaKategori.deskripsi,
    };
  }

  // /kamus (root)
  if (decodedPath === '/kamus' || decodedPath === '/kamus/') {
    const metaBrowse = buildMetaBrowseKamus();
    return {
      title: `${metaBrowse.judul} \u2014 Kateglo`,
      description: metaBrowse.deskripsi,
    };
  }

  // /tesaurus/cari/:kata
  if (decodedPath.startsWith('/tesaurus/cari/')) {
    const kata = decodedPath.replace('/tesaurus/cari/', '').trim();
    const metaTesaurus = buildMetaPencarianTesaurus(
      kata,
      prefetchedData?.type === 'tesaurus-detail' ? prefetchedData : null
    );

    return {
      title: `${metaTesaurus.judul} \u2014 Kateglo`,
      description: metaTesaurus.deskripsi,
    };
  }

  // /tesaurus
  if (decodedPath.startsWith('/tesaurus')) {
    const metaBrowse = buildMetaBrowseTesaurus();
    return {
      title: `${metaBrowse.judul} \u2014 Kateglo`,
      description: metaBrowse.deskripsi,
    };
  }

  // /glosarium/cari/:kata
  if (decodedPath.startsWith('/glosarium/cari/')) {
    const kata = decodedPath.replace('/glosarium/cari/', '').trim();
    const metaGlosarium = buildMetaPencarianGlosarium(
      kata,
      prefetchedData?.type === 'glosarium-cari' ? prefetchedData : null
    );

    return {
      title: `${metaGlosarium.judul} \u2014 Kateglo`,
      description: metaGlosarium.deskripsi,
    };
  }

  // /glosarium/bidang/:bidang
  if (decodedPath.startsWith('/glosarium/bidang/')) {
    const bidang = decodedPath.replace('/glosarium/bidang/', '').trim();
    const metaBidang = buildMetaBidangGlosarium(
      bidang,
      prefetchedData?.type === 'glosarium-bidang' ? prefetchedData : null
    );

    return {
      title: `${metaBidang.judul} \u2014 Kateglo`,
      description: metaBidang.deskripsi,
    };
  }

  // /glosarium/sumber/:sumber
  if (decodedPath.startsWith('/glosarium/sumber/')) {
    const sumber = decodedPath.replace('/glosarium/sumber/', '').trim();
    const metaSumber = buildMetaSumberGlosarium(
      sumber,
      prefetchedData?.type === 'glosarium-sumber' ? prefetchedData : null
    );

    return {
      title: `${metaSumber.judul} \u2014 Kateglo`,
      description: metaSumber.deskripsi,
    };
  }

  // /glosarium
  if (decodedPath.startsWith('/glosarium')) {
    const metaBrowse = buildMetaBrowseGlosarium();
    return {
      title: `${metaBrowse.judul} \u2014 Kateglo`,
      description: metaBrowse.deskripsi,
    };
  }

  // /kebijakan-privasi
  if (decodedPath.startsWith('/kebijakan-privasi')) {
    return {
      title: 'Kebijakan Privasi \u2014 Kateglo',
      description: 'Kebijakan privasi layanan Kateglo.',
    };
  }

  return {
    ...defaultMeta,
    canonicalUrl: `${siteBaseUrl}${decodedPath}`,
  };
}

export async function render(url = '/', prefetchedData = null) {
  /* c8 ignore next */
  const runtimeProcess = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
  /* c8 ignore next */
  const siteBaseUrl = stripTrailingSlash(runtimeProcess?.env?.PUBLIC_SITE_URL || 'https://kateglo.org');
  /* c8 ignore next */
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
