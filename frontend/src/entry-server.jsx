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

/**
 * Potong teks ke panjang maksimum tanpa memotong di tengah kata.
 */
function truncate(text = '', maxLen = 155) {
  if (text.length <= maxLen) return text;
  const cut = text.substring(0, maxLen);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > maxLen * 0.6 ? cut.substring(0, lastSpace) : cut) + '\u2026';
}

/**
 * Bangun deskripsi kaya dari data kamus detail.
 * Format: "indeks (lafal): (1) makna pertama; (2) makna kedua..."
 */
function buildKamusDescription(indeks, data) {
  const parts = [indeks];
  if (data.lafal) parts[0] += ` ${data.lafal}`;

  const maknaList = data.semuaMakna || [];
  if (maknaList.length === 0) return `Lihat detail entri kamus \u201c${indeks}\u201d di Kateglo.`;

  if (maknaList.length === 1) {
    const m = maknaList[0];
    const kelasPrefix = m.kelas_kata ? `(${m.kelas_kata}) ` : '';
    return truncate(`${parts[0]}: ${kelasPrefix}${m.makna}`, 155);
  }

  // Banyak makna — gabungkan dengan nomor
  const formattedMakna = maknaList.slice(0, 4).map((m, i) => {
    const kelasPrefix = m.kelas_kata ? `(${m.kelas_kata}) ` : '';
    return `(${i + 1}) ${kelasPrefix}${m.makna}`;
  });
  const joined = formattedMakna.join('; ');
  return truncate(`${parts[0]}: ${joined}`, 155);
}

/**
 * Bangun deskripsi kaya dari data tesaurus.
 * Format: "kata — sinonim: x, y, z. Antonim: a, b."
 */
function buildTesaurusDescription(kata, data) {
  const parts = [];
  if (data.sinonim?.length) {
    parts.push(`Sinonim: ${data.sinonim.slice(0, 5).join(', ')}`);
  }
  if (data.antonim?.length) {
    parts.push(`Antonim: ${data.antonim.slice(0, 5).join(', ')}`);
  }
  if (parts.length === 0) return `Hasil pencarian tesaurus untuk \u201c${kata}\u201d di Kateglo.`;
  return truncate(`${kata} \u2014 ${parts.join('. ')}.`, 155);
}

/**
 * Bangun deskripsi kaya dari hasil pencarian glosarium.
 */
function buildGlosariumCariDescription(kata, data) {
  if (!data.total) return `Hasil pencarian glosarium untuk \u201c${kata}\u201d di Kateglo.`;
  let desc = `${data.total} hasil glosarium untuk \u201c${kata}\u201d.`;
  if (data.contoh?.length) {
    const contohList = data.contoh.map((c) => `${c.indonesia} (${c.asing})`).join(', ');
    desc += ` Contoh: ${truncate(contohList, 100)}.`;
  }
  return truncate(desc, 155);
}

function buildMetaForPath(pathname = '/', siteBaseUrl = 'https://kateglo.org', prefetchedData = null) {
  const defaultMeta = {
    title: 'Kateglo \u2014 Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
    description: 'Kamus, Tesaurus, dan Glosarium Bahasa Indonesia',
  };

  const decodedPath = decodeURIComponent(pathname || '/');

  // /kamus/detail/:indeks
  if (decodedPath.startsWith('/kamus/detail/')) {
    const indeks = decodedPath.replace('/kamus/detail/', '').trim();
    if (!indeks) return { title: 'Kamus \u2014 Kateglo', description: 'Telusuri entri kamus bahasa Indonesia di Kateglo.' };

    let description = `Lihat detail entri kamus \u201c${indeks}\u201d di Kateglo.`;
    if (prefetchedData?.type === 'kamus-detail' && prefetchedData.semuaMakna?.length) {
      description = buildKamusDescription(indeks, prefetchedData);
    }

    return {
      title: `${indeks} \u2014 Kamus \u2014 Kateglo`,
      description,
    };
  }

  // /kamus/cari/:kata
  if (decodedPath.startsWith('/kamus/cari/')) {
    const kata = decodedPath.replace('/kamus/cari/', '').trim();
    if (!kata) return { title: 'Kamus \u2014 Kateglo', description: 'Telusuri entri kamus bahasa Indonesia di Kateglo.' };

    let description = `Hasil pencarian kamus untuk \u201c${kata}\u201d di Kateglo.`;
    if (prefetchedData?.type === 'kamus-cari' && prefetchedData.semuaMakna?.length) {
      const ringkasan = prefetchedData.semuaMakna[0].makna;
      description = `${kata}: ${truncate(ringkasan, 130)}`;
    }

    return {
      title: `Hasil Pencarian \u201c${kata}\u201d \u2014 Kateglo`,
      description,
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
    if (!kata) return { title: 'Tesaurus \u2014 Kateglo', description: 'Temukan sinonim dan antonim bahasa Indonesia di Kateglo.' };

    let description = `Hasil pencarian tesaurus untuk \u201c${kata}\u201d di Kateglo.`;
    if (prefetchedData?.type === 'tesaurus-detail') {
      description = buildTesaurusDescription(kata, prefetchedData);
    }

    return {
      title: `Hasil Pencarian \u201c${kata}\u201d \u2014 Kateglo`,
      description,
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
    if (!kata) return { title: 'Glosarium \u2014 Kateglo', description: 'Jelajahi glosarium istilah bidang ilmu di Kateglo.' };

    let description = `Hasil pencarian glosarium untuk \u201c${kata}\u201d di Kateglo.`;
    if (prefetchedData?.type === 'glosarium-cari' && prefetchedData.total > 0) {
      description = buildGlosariumCariDescription(kata, prefetchedData);
    }

    return {
      title: `Hasil Pencarian \u201c${kata}\u201d \u2014 Kateglo`,
      description,
    };
  }

  // /glosarium/bidang/:bidang
  if (decodedPath.startsWith('/glosarium/bidang/')) {
    const bidang = decodedPath.replace('/glosarium/bidang/', '').trim();
    if (!bidang) return { title: 'Glosarium \u2014 Kateglo', description: 'Jelajahi glosarium istilah bidang ilmu di Kateglo.' };

    let description = `Glosarium bidang ${bidang} di Kateglo.`;
    if (prefetchedData?.type === 'glosarium-bidang' && prefetchedData.total > 0) {
      description = `${prefetchedData.total} istilah bidang ${bidang}.`;
      if (prefetchedData.contoh?.length) {
        const contohList = prefetchedData.contoh.map((c) => `${c.indonesia} (${c.asing})`).join(', ');
        description += ` Contoh: ${truncate(contohList, 100)}.`;
      }
    }

    return {
      title: `Bidang ${bidang} \u2014 Kateglo`,
      description,
    };
  }

  // /glosarium/sumber/:sumber
  if (decodedPath.startsWith('/glosarium/sumber/')) {
    const sumber = decodedPath.replace('/glosarium/sumber/', '').trim();
    if (!sumber) return { title: 'Glosarium \u2014 Kateglo', description: 'Jelajahi glosarium istilah bidang ilmu di Kateglo.' };

    let description = `Glosarium dari sumber ${sumber} di Kateglo.`;
    if (prefetchedData?.type === 'glosarium-sumber' && prefetchedData.total > 0) {
      description = `${prefetchedData.total} istilah dari sumber ${sumber}.`;
      if (prefetchedData.contoh?.length) {
        const contohList = prefetchedData.contoh.map((c) => `${c.indonesia} (${c.asing})`).join(', ');
        description += ` Contoh: ${truncate(contohList, 100)}.`;
      }
    }

    return {
      title: `Sumber ${sumber} \u2014 Kateglo`,
      description,
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

export async function render(url = '/', prefetchedData = null) {
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
