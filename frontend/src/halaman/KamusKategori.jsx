/**
 * @fileoverview Halaman daftar lema per kategori — /kamus/:kategori/:kode
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilLemaPerKategori } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';
import { updateSearchParamsWithOffset } from '../utils/searchParams';

const NAMA_KATEGORI = {
  abjad: 'Abjad',
  jenis: 'Jenis',
  kelas_kata: 'Kelas Kata',
  ragam: 'Ragam',
  bahasa: 'Bahasa',
  bidang: 'Bidang',
};

const limit = 20;

function KamusKategori() {
  const { kategori, kode } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['kamus-kategori-lema', kategori, kode, offsetParam],
    queryFn: () => ambilLemaPerKategori(kategori, kode, { limit, offset: offsetParam }),
    enabled: Boolean(kategori && kode),
  });

  const results = data?.data || [];
  const total = data?.total || 0;
  const label = data?.label;

  const namaKategori = NAMA_KATEGORI[kategori] || kategori;
  const namaLabel = label?.nama || decodeURIComponent(kode);
  const judul = `${namaKategori}: ${namaLabel}`;

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
  };

  return (
    <HalamanDasar judul={`${judul} — Kamus`}>

      <div className="kamus-detail-breadcrumb mb-4">
        <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
        {' › '}
        <span className="kamus-detail-breadcrumb-current">{namaKategori}: {namaLabel}</span>
      </div>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Memuat data..."
        errorText="Gagal mengambil data. Coba lagi."
      />

      {!isLoading && !isError && (
        <div className="content-card p-4">
          <h2 className="kamus-result-heading">
            {namaLabel} — {total} entri
          </h2>

          {results.length === 0 && <EmptyResultText text="Tidak ada entri untuk kategori ini." />}

          {results.length > 0 && (
            <>
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
              <div className="mt-4">
                <Paginasi total={total} limit={limit} offset={offsetParam} onChange={handleOffset} />
              </div>
            </>
          )}
        </div>
      )}
    </HalamanDasar>
  );
}

export default KamusKategori;
