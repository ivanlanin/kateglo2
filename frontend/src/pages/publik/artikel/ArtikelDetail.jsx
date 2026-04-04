/**
 * @fileoverview Halaman detail artikel publik — merender konten markdown.
 */

import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ambilDetailArtikel } from '../../../api/apiPublik';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import { QueryFeedback } from '../../../components/status/StatusKonten';
import '../../../styles/referensi.css';

const topikLabel = {
  'tanya-jawab': 'Tanya Jawab',
  'asal-kata': 'Asal Kata',
  'kata-baru': 'Kata Baru',
  'kesalahan-umum': 'Kesalahan Umum',
  'lainnya': 'Lainnya',
};

function formatTanggal(isoString) {
  if (!isoString) return '';
  return new Date(isoString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function ArtikelDetail() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['artikel-detail', slug],
    queryFn: () => ambilDetailArtikel(slug),
    enabled: Boolean(slug),
    staleTime: 5 * 60 * 1000,
  });

  const artikel = data?.data;

  const cuplikan = artikel?.cuplikan
    ? artikel.cuplikan.replace(/[#*_`>[\]!]/g, '').replace(/\s+/g, ' ').trim().slice(0, 160)
    : undefined;

  return (
    <HalamanPublik
      judul={artikel?.judul || 'Artikel'}
      deskripsi={cuplikan || (artikel?.judul ? `${artikel.judul} — Kateglo` : undefined)}
      tampilkanJudul={false}
    >
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Memuat artikel…"
        errorText="Gagal memuat artikel."
      />

      {!isLoading && !isError && !artikel && (
        <p className="artikel-kosong">Artikel tidak ditemukan.</p>
      )}

      {artikel && (
        <div className="artikel-detail-wrap">
          <Link to="/artikel" className="artikel-detail-kembali">
            ← Artikel
          </Link>

          <header className="artikel-detail-header">
            {artikel.topik?.length > 0 && (
              <div className="artikel-detail-topik-baris">
                {artikel.topik.map((t) => (
                  <Link
                    key={t}
                    to={`/artikel?topik=${encodeURIComponent(t)}`}
                    className="artikel-badge-topik artikel-badge-topik-link"
                  >
                    {topikLabel[t] ?? t}
                  </Link>
                ))}
              </div>
            )}

            <h1 className="artikel-detail-judul">{artikel.judul}</h1>

            <div className="artikel-detail-meta">
              {artikel.penulis_nama && (
                <span className="artikel-detail-penulis">{artikel.penulis_nama}</span>
              )}
              {artikel.penulis_nama && artikel.diterbitkan_pada && (
                <span className="artikel-detail-pemisah" aria-hidden="true">·</span>
              )}
              {artikel.diterbitkan_pada && (
                <time className="artikel-detail-tanggal" dateTime={artikel.diterbitkan_pada}>
                  {formatTanggal(artikel.diterbitkan_pada)}
                </time>
              )}
              {artikel.penyunting_nama && (
                <>
                  <span className="artikel-detail-pemisah" aria-hidden="true">·</span>
                  <span className="artikel-detail-penyunting">
                    Disunting oleh {artikel.penyunting_nama}
                  </span>
                </>
              )}
            </div>
          </header>

          <div className="artikel-detail-konten ref-markdown-content">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {artikel.konten || ''}
            </ReactMarkdown>
          </div>

          <footer className="artikel-detail-footer">
            <Link to="/artikel" className="artikel-detail-kembali">
              ← Kembali ke semua artikel
            </Link>
          </footer>
        </div>
      )}
    </HalamanPublik>
  );
}
