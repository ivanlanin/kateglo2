/**
 * @fileoverview Halaman detail artikel publik — merender konten markdown.
 */

import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ambilDaftarArtikel, ambilDetailArtikel } from '../../../api/apiPublik';
import TombolSunting from '../../../components/tombol/TombolSunting';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import { QueryFeedback } from '../../../components/status/StatusKonten';
import TeksMarkdownInline, { stripInlineMarkdown } from '../../../components/tampilan/TeksMarkdownInline';
import { useAuthOptional } from '../../../context/authContext';
import { useSsrPrefetch } from '../../../context/ssrPrefetchContext';
import '../../../styles/referensi.css';

function bersihkanCuplikan(teks) {
  if (!teks) return '';
  return teks.replace(/[#*_`>[\]!()-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function isArtikelInternalHref(href = '') {
  return String(href || '').trim().startsWith('/');
}

function RenderArtikelMarkdownLink({ node: _node, href = '', children, ...props }) {
  if (isArtikelInternalHref(href)) {
    return <Link to={href}>{children}</Link>;
  }

  const isExternalHttp = /^https?:\/\//i.test(String(href || '').trim());
  return (
    <a
      href={href}
      target={isExternalHttp ? '_blank' : undefined}
      rel={isExternalHttp ? 'noopener noreferrer' : undefined}
      {...props}
    >
      {children}
    </a>
  );
}

export function ArtikelDetail() {
  const auth = useAuthOptional();
  const ssrPrefetch = useSsrPrefetch();
  const adalahAdmin = Boolean(auth?.adalahAdmin);
  const { slug } = useParams();

  const initialDetailData = useMemo(() => {
    if (ssrPrefetch?.type !== 'artikel-detail') return undefined;
    if (String(ssrPrefetch.slug || '') !== String(slug || '')) return undefined;
    if (!ssrPrefetch.artikel) return { success: true, data: null };

    return { success: true, data: ssrPrefetch.artikel };
  }, [slug, ssrPrefetch]);

  const initialSidebarData = useMemo(() => {
    if (ssrPrefetch?.type !== 'artikel-detail') return undefined;
    if (String(ssrPrefetch.slug || '') !== String(slug || '')) return undefined;

    return { success: true, data: ssrPrefetch.artikelLain || [] };
  }, [slug, ssrPrefetch]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['artikel-detail', slug],
    queryFn: () => ambilDetailArtikel(slug),
    enabled: Boolean(slug),
    initialData: initialDetailData,
    staleTime: 5 * 60 * 1000,
  });

  const { data: daftarSidebarData } = useQuery({
    queryKey: ['artikel-daftar-sidebar', slug],
    queryFn: () => ambilDaftarArtikel({ limit: 11 }),
    enabled: Boolean(slug),
    initialData: initialSidebarData,
    staleTime: 60 * 1000,
  });

  const artikel = data?.data;
  const artikelLain = (daftarSidebarData?.data || [])
    .filter((item) => item?.slug && item.slug !== slug)
    .slice(0, 10);

  const cuplikan = artikel
    ? bersihkanCuplikan(artikel.cuplikan || artikel.konten || '').slice(0, 160)
    : undefined;

  return (
    <HalamanPublik
      judul={stripInlineMarkdown(artikel?.judul || 'Artikel')}
      deskripsi={cuplikan || (artikel?.judul ? `${stripInlineMarkdown(artikel.judul)} — Kateglo` : undefined)}
      tampilkanJudul={false}
    >
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat artikel…"
        errorText="Gagal memuat artikel."
      />

      {!isLoading && !isError && !artikel && (
        <p className="secondary-text">Artikel tidak ditemukan.</p>
      )}

      {artikel && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <article className="lg:col-span-2">
            <nav className="kamus-detail-breadcrumb" aria-label="Breadcrumb artikel">
              <Link to="/artikel" className="kamus-detail-breadcrumb-link">Artikel</Link>
            </nav>

            <header className="artikel-detail-header artikel-detail-header-sederhana">
              <div className="kamus-detail-heading-row">
                <h1 className="kamus-detail-heading">
                  <span className="kamus-detail-heading-main">
                    <TeksMarkdownInline as="span" text={artikel.judul} />
                  </span>
                </h1>
                {adalahAdmin && artikel?.id && (
                  <TombolSunting
                    to={`/redaksi/artikel/${artikel.id}`}
                    entitas="artikel"
                    className="glosarium-edit-link-inline artikel-detail-edit-link-inline"
                    ariaLabel="Sunting artikel di Redaksi"
                    title="Sunting artikel di Redaksi"
                  />
                )}
              </div>

              {artikel.topik?.length > 0 && (
                <div className="artikel-detail-topik-baris">
                  {artikel.topik.map((t) => (
                    <Link
                      key={t}
                      to={`/artikel?topik=${encodeURIComponent(t)}`}
                      className="artikel-badge-topik artikel-badge-topik-link"
                    >
                      {t}
                    </Link>
                  ))}
                </div>
              )}
            </header>

            <div className="mt-6 artikel-detail-konten ref-markdown-content ref-gramatika-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={{ a: RenderArtikelMarkdownLink }}>
                {artikel.konten || ''}
              </ReactMarkdown>
            </div>
          </article>

          <aside aria-labelledby="artikel-lain-title" className="artikel-sidebar-separator">
            {artikelLain.length > 0 && (
              <section>
                <h2 id="artikel-lain-title" className="artikel-sidebar-title">Artikel lain</h2>
                <ul className="artikel-sidebar-list artikel-sidebar-bullets">
                  {artikelLain.map((item) => (
                    <li key={item.slug}>
                      <Link to={`/artikel/${item.slug}`} className="ref-panel-link artikel-sidebar-link">
                        <TeksMarkdownInline as="span" text={item.judul} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </aside>
        </div>
      )}
    </HalamanPublik>
  );
}

export const __private = {
  isArtikelInternalHref,
  RenderArtikelMarkdownLink,
};
