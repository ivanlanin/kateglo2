/**
 * @fileoverview Halaman pencarian/browse kamus — path-based: /kamus/cari/:kata
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariKamus, ambilKategoriKamus } from '../api/apiPublik';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';

const NAMA_KATEGORI = {
  abjad: 'Abjad',
  jenis: 'Jenis',
  kelas_kata: 'Kelas Kata',
  ragam: 'Ragam',
  bahasa: 'Bahasa',
  bidang: 'Bidang',
};

const URUTAN_KATEGORI = ['abjad', 'jenis', 'kelas_kata', 'ragam', 'bahasa', 'bidang'];

function Kamus() {
  const { kata } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cari-kamus', kata],
    queryFn: () => cariKamus(kata),
    enabled: Boolean(kata),
  });

  const { data: kategoriData } = useQuery({
    queryKey: ['kamus-kategori'],
    queryFn: ambilKategoriKamus,
    staleTime: 5 * 60 * 1000,
    enabled: !kata,
  });

  const results = data?.data || [];

  return (
    <HalamanDasar judul={kata ? `Cari "${decodeURIComponent(kata)}" — Kamus` : 'Kamus'}>

      {/* Pesan loading / error */}
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data..."
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian — browse kategori */}
      {!kata && !isLoading && kategoriData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {URUTAN_KATEGORI.map((kat) => {
            const labels = kategoriData[kat];
            if (!labels || labels.length === 0) return null;
            return (
              <div key={kat} className="beranda-feature-card text-center">
                <h3 className="beranda-info-title">{NAMA_KATEGORI[kat] || kat}</h3>
                <div className="flex flex-wrap justify-center gap-2">
                  {labels.map((l) => (
                    <Link
                      key={l.kode}
                      to={`/kamus/${kat}/${encodeURIComponent(l.kode)}`}
                      className="beranda-tag-link"
                    >
                      {l.nama}
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Hasil pencarian */}
      {kata && !isLoading && !isError && (
        <div className="content-card p-4">
          <h2 className="kamus-result-heading">
            Hasil pencarian &ldquo;{kata}&rdquo; — {results.length} entri
          </h2>

          {results.length === 0 && <EmptyResultText text="Lema yang dicari tidak ditemukan. Coba kata lain?" />}

          {results.length > 0 && (
            <div className="result-divider">
              {results.map((item) => (
                <div key={item.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-baseline gap-2">
                    <Link
                      to={`/kamus/detail/${encodeURIComponent(item.lema)}`}
                      className="kamus-result-link"
                    >
                      {item.lema}
                    </Link>
                    {item.preview_kelas_kata && (
                      <span className="tag-subtle">
                        {item.preview_kelas_kata}
                      </span>
                    )}
                    {item.jenis !== 'dasar' && (
                      <span className="tag-subtle">
                        {item.jenis}
                      </span>
                    )}
                    {item.jenis_rujuk && item.lema_rujuk && (
                      <span className="kamus-result-redirect">
                        → {item.lema_rujuk}
                      </span>
                    )}
                  </div>
                  {item.preview_makna && (
                    <p className="kamus-result-preview">{item.preview_makna}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </HalamanDasar>
  );
}

export default Kamus;
