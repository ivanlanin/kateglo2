/**
 * @fileoverview Halaman daftar artikel publik dengan filter topik.
 */

import { useQuery } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { ambilDaftarArtikel, ambilTopikArtikel } from '../../../api/apiPublik';
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

function bersihkanCuplikan(teks) {
  if (!teks) return '';
  return teks.replace(/[#*_`>[\]!]/g, '').replace(/\s+/g, ' ').trim();
}

function KartuArtikel({ artikel, unggulan = false }) {
  const cuplikan = bersihkanCuplikan(artikel.cuplikan)?.slice(0, 150);

  return (
    <article className={unggulan ? 'kartu-artikel-unggulan' : 'kartu-artikel'}>
      {artikel.topik?.length > 0 && (
        <div className="kartu-artikel-topik-baris">
          {artikel.topik.map((t) => (
            <span key={t} className="artikel-badge-topik">
              {topikLabel[t] ?? t}
            </span>
          ))}
        </div>
      )}
      <Link to={`/artikel/${artikel.slug}`} className="kartu-artikel-judul-link">
        <h2 className={unggulan ? 'kartu-artikel-judul-unggulan' : 'kartu-artikel-judul'}>
          {artikel.judul}
        </h2>
      </Link>
      {cuplikan && (
        <p className="kartu-artikel-cuplikan">{cuplikan}&hellip;</p>
      )}
      <div className="kartu-artikel-footer">
        {artikel.penulis_nama && (
          <span className="kartu-artikel-penulis">{artikel.penulis_nama}</span>
        )}
        {artikel.penulis_nama && artikel.diterbitkan_pada && (
          <span className="kartu-artikel-pemisah" aria-hidden="true">·</span>
        )}
        {artikel.diterbitkan_pada && (
          <time className="kartu-artikel-tanggal" dateTime={artikel.diterbitkan_pada}>
            {formatTanggal(artikel.diterbitkan_pada)}
          </time>
        )}
      </div>
    </article>
  );
}

export function Artikel() {
  const [searchParams, setSearchParams] = useSearchParams();
  const topikAktif = searchParams.get('topik') || '';

  const { data: topikData } = useQuery({
    queryKey: ['artikel-topik'],
    queryFn: ambilTopikArtikel,
    staleTime: 5 * 60 * 1000,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ['artikel-daftar', topikAktif],
    queryFn: () => ambilDaftarArtikel({ topik: topikAktif || undefined, limit: 30 }),
    staleTime: 60 * 1000,
  });

  const topikList = topikData?.data || [];
  const artikelList = data?.data || [];
  const [unggulan, ...sisanya] = artikelList;

  function pilihTopik(nama) {
    if (nama === topikAktif) {
      setSearchParams({});
    } else {
      setSearchParams({ topik: nama });
    }
  }

  return (
    <HalamanPublik
      judul="Artikel"
      deskripsi="Artikel-artikel seputar bahasa Indonesia, linguistik, dan perkembangan Kateglo."
    >
      <div className="artikel-halaman-header">
        <p className="artikel-halaman-deskripsi">
          Ulasan, tanya jawab, dan catatan seputar bahasa Indonesia.
        </p>
      </div>

      {topikList.length > 0 && (
        <div className="artikel-filter-baris">
          <button
            type="button"
            className={`artikel-filter-tombol${!topikAktif ? ' aktif' : ''}`}
            onClick={() => pilihTopik('')}
          >
            Semua
          </button>
          {topikList.map((t) => (
            <button
              key={t.topik}
              type="button"
              className={`artikel-filter-tombol${topikAktif === t.topik ? ' aktif' : ''}`}
              onClick={() => pilihTopik(t.topik)}
            >
              {topikLabel[t.topik] ?? t.topik}
              <span className="artikel-filter-jumlah">{t.jumlah}</span>
            </button>
          ))}
        </div>
      )}

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Memuat artikel…"
        errorText="Gagal memuat artikel."
      />

      {!isLoading && !isError && artikelList.length === 0 && (
        <p className="artikel-kosong">
          Belum ada artikel{topikAktif ? ` dalam topik "${topikLabel[topikAktif] ?? topikAktif}"` : ''}.
        </p>
      )}

      {!isLoading && !isError && unggulan && (
        <>
          <KartuArtikel artikel={unggulan} unggulan />
          {sisanya.length > 0 && (
            <div className="artikel-grid">
              {sisanya.map((a) => (
                <KartuArtikel key={a.id} artikel={a} />
              ))}
            </div>
          )}
        </>
      )}
    </HalamanPublik>
  );
}
