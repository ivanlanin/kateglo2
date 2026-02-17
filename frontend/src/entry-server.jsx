import { renderToString } from 'react-dom/server';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { AuthProvider } from './context/authContext';

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

function buildMetaForPath(pathname = '/', siteBaseUrl = 'https://kateglo.org') {
  const defaultMeta = {
    title: 'Kateglo \u2014 Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
    description: 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
  };

  const decodedPath = decodeURIComponent(pathname || '/');

  // /kamus/detail/:indeks
  if (decodedPath.startsWith('/kamus/detail/')) {
    const indeks = decodedPath.replace('/kamus/detail/', '').trim();
    return {
      title: indeks ? `${indeks} \u2014 Kamus \u2014 Kateglo` : 'Kamus \u2014 Kateglo',
      description: indeks
        ? `Lihat detail entri kamus \u201c${indeks}\u201d di Kateglo.`
        : 'Telusuri entri kamus bahasa Indonesia di Kateglo.',
    };
  }

  // /kamus/cari/:kata
  if (decodedPath.startsWith('/kamus/cari/')) {
    const kata = decodedPath.replace('/kamus/cari/', '').trim();
    return {
      title: kata ? `Hasil Pencarian \u201c${kata}\u201d \u2014 Kateglo` : 'Kamus \u2014 Kateglo',
      description: kata
        ? `Hasil pencarian kamus untuk \u201c${kata}\u201d di Kateglo.`
        : 'Telusuri entri kamus bahasa Indonesia di Kateglo.',
    };
  }

  // /kamus/:kategori/:kode
  if (/^\/kamus\/[^/]+\/[^/]+/.test(decodedPath)) {
    return {
      title: 'Kamus \u2014 Kateglo',
      description: 'Telusuri entri kamus bahasa Indonesia berdasarkan kategori di Kateglo.',
    };
  }

  // /kamus (root)
  if (decodedPath === '/kamus' || decodedPath === '/kamus/') {
    return {
      title: 'Kamus \u2014 Kateglo',
      description: 'Telusuri entri kamus bahasa Indonesia di Kateglo.',
    };
  }

  // /tesaurus/cari/:kata
  if (decodedPath.startsWith('/tesaurus/cari/')) {
    const kata = decodedPath.replace('/tesaurus/cari/', '').trim();
    return {
      title: kata ? `Hasil Pencarian \u201c${kata}\u201d \u2014 Kateglo` : 'Tesaurus \u2014 Kateglo',
      description: kata
        ? `Hasil pencarian tesaurus untuk \u201c${kata}\u201d di Kateglo.`
        : 'Temukan sinonim dan antonim bahasa Indonesia di Kateglo.',
    };
  }

  // /tesaurus
  if (decodedPath.startsWith('/tesaurus')) {
    return {
      title: 'Tesaurus \u2014 Kateglo',
      description: 'Temukan sinonim dan antonim bahasa Indonesia di Kateglo.',
    };
  }

  // /glosarium/cari/:kata
  if (decodedPath.startsWith('/glosarium/cari/')) {
    const kata = decodedPath.replace('/glosarium/cari/', '').trim();
    return {
      title: kata ? `Hasil Pencarian \u201c${kata}\u201d \u2014 Kateglo` : 'Glosarium \u2014 Kateglo',
      description: kata
        ? `Hasil pencarian glosarium untuk \u201c${kata}\u201d di Kateglo.`
        : 'Jelajahi glosarium istilah bidang ilmu di Kateglo.',
    };
  }

  // /glosarium/bidang/:bidang
  if (decodedPath.startsWith('/glosarium/bidang/')) {
    const bidang = decodedPath.replace('/glosarium/bidang/', '').trim();
    return {
      title: bidang ? `Bidang ${bidang} \u2014 Kateglo` : 'Glosarium \u2014 Kateglo',
      description: bidang
        ? `Glosarium bidang ${bidang} di Kateglo.`
        : 'Jelajahi glosarium istilah bidang ilmu di Kateglo.',
    };
  }

  // /glosarium/sumber/:sumber
  if (decodedPath.startsWith('/glosarium/sumber/')) {
    const sumber = decodedPath.replace('/glosarium/sumber/', '').trim();
    return {
      title: sumber ? `Sumber ${sumber} \u2014 Kateglo` : 'Glosarium \u2014 Kateglo',
      description: sumber
        ? `Glosarium dari sumber ${sumber} di Kateglo.`
        : 'Jelajahi glosarium istilah bidang ilmu di Kateglo.',
    };
  }

  // /glosarium
  if (decodedPath.startsWith('/glosarium')) {
    return {
      title: 'Glosarium \u2014 Kateglo',
      description: 'Jelajahi glosarium istilah bidang ilmu di Kateglo.',
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

export async function render(url = '/') {
  const runtimeProcess = typeof globalThis !== 'undefined' ? globalThis.process : undefined;
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

  const meta = buildMetaForPath(pathname, siteBaseUrl);
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
