/**
 * @fileoverview Halaman daftar artikel publik dengan filter topik.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ambilDaftarArtikel } from '../../../api/apiPublik';
import TombolSunting from '../../../components/tombol/TombolSunting';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import { QueryFeedback } from '../../../components/status/StatusKonten';
import TeksMarkdownInline from '../../../components/tampilan/TeksMarkdownInline';
import { useAuthOptional } from '../../../context/authContext';
import { useSsrPrefetch } from '../../../context/ssrPrefetchContext';
import '../../../styles/referensi.css';

function bersihkanCuplikan(teks) {
  if (!teks) return '';
  return teks.replace(/[#*_`>[\]!]/g, '').replace(/\s+/g, ' ').trim();
}

function KartuArtikel({ artikel, tampilkanEdit = false }) {
  const cuplikan = bersihkanCuplikan(artikel.cuplikan)?.slice(0, 150);

  return (
    <article className="kartu-artikel">
      <div className="kartu-artikel-judul-baris">
        <Link to={`/artikel/${artikel.slug}`} className="kartu-artikel-judul-link">
          <TeksMarkdownInline as="h2" className="kartu-artikel-judul" text={artikel.judul} />
        </Link>
        {tampilkanEdit && artikel?.id && (
          <TombolSunting
            to={`/redaksi/artikel/${artikel.id}`}
            entitas="artikel"
            className="glosarium-edit-link-inline artikel-list-edit-link-inline"
            ariaLabel="Sunting artikel di Redaksi"
            title="Sunting artikel di Redaksi"
          />
        )}
      </div>
      {cuplikan && (
        <p className="kartu-artikel-cuplikan">{cuplikan}&hellip;</p>
      )}
      {artikel.topik?.length > 0 && (
        <div className="kartu-artikel-topik-baris">
          {artikel.topik.map((t) => (
            <span key={t} className="artikel-badge-topik">
              {t}
            </span>
          ))}
        </div>
      )}
    </article>
  );
}

export function Artikel() {
  const auth = useAuthOptional();
  const ssrPrefetch = useSsrPrefetch();
  const adalahAdmin = Boolean(auth?.adalahAdmin);
  const [searchParams] = useSearchParams();
  const topikAktif = searchParams.get('topik') || '';
  const qAktif = searchParams.get('q') || '';

  const initialData = useMemo(() => {
    if (ssrPrefetch?.type !== 'artikel-daftar') return undefined;
    if (String(ssrPrefetch.topik || '') !== topikAktif) return undefined;
    if (String(ssrPrefetch.q || '') !== qAktif) return undefined;

    return {
      success: true,
      data: ssrPrefetch.data || [],
      total: ssrPrefetch.total || 0,
      limit: 30,
      offset: 0,
    };
  }, [qAktif, ssrPrefetch, topikAktif]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['artikel-daftar', topikAktif],
    queryFn: () => ambilDaftarArtikel({ topik: topikAktif || undefined, limit: 30 }),
    initialData,
    staleTime: 60 * 1000,
  });

  const artikelList = data?.data || [];

  return (
    <HalamanPublik
      judul="Artikel"
      deskripsi="Artikel-artikel seputar bahasa Indonesia, linguistik, dan perkembangan Kateglo."
    >
      <div className="alat-page">
        <QueryFeedback
          isLoading={isLoading}
          isError={isError}
          loadingText="Memuat artikel…"
          errorText="Gagal memuat artikel."
        />

        {!isLoading && !isError && artikelList.length === 0 && (
          <p className="artikel-kosong">
            Belum ada artikel{topikAktif ? ` dalam topik "${topikAktif}"` : ''}.
          </p>
        )}

        {!isLoading && !isError && artikelList.length > 0 && (
          <section className="alat-list-grid" aria-label="Daftar artikel">
            {artikelList.map((a) => (
              <KartuArtikel key={a.id} artikel={a} tampilkanEdit={adalahAdmin} />
            ))}
          </section>
        )}
      </div>
    </HalamanPublik>
  );
}
