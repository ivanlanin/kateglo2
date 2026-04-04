/**
 * @fileoverview Halaman detail artikel publik — merender konten markdown.
 */

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
import '../../../styles/referensi.css';

export function ArtikelDetail() {
  const auth = useAuthOptional();
  const adalahAdmin = Boolean(auth?.adalahAdmin);
  const { slug } = useParams();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['artikel-detail', slug],
    queryFn: () => ambilDetailArtikel(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });

  const { data: daftarSidebarData } = useQuery({
    queryKey: ['artikel-daftar-sidebar', slug],
    queryFn: () => ambilDaftarArtikel({ limit: 11 }),
    enabled: Boolean(slug),
    staleTime: 60 * 1000,
  });

  const artikel = data?.data;
  const artikelLain = (daftarSidebarData?.data || [])
    .filter((item) => item?.slug && item.slug !== slug)
    .slice(0, 10);

  const cuplikan = artikel?.cuplikan
    ? artikel.cuplikan.replace(/[#*_`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)
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
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
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
