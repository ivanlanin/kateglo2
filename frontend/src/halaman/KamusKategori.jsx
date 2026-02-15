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

const limit = 100;

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
  const labelKapital = namaLabel.charAt(0).toUpperCase() + namaLabel.slice(1);
  const judul = `${namaKategori} ${labelKapital}`;

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
  };

  const breadcrumb = (
    <div className="kamus-detail-breadcrumb">
      <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
      {' › '}
      <span className="kamus-detail-breadcrumb-current">{judul}</span>
    </div>
  );

  return (
    <HalamanDasar judul={judul} breadcrumb={breadcrumb}>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Memuat data …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {!isLoading && !isError && (
        <>
          {results.length === 0 && <EmptyResultText text="Tidak ada entri untuk kategori ini." />}

          {results.length > 0 && (
            <>
              <div className="kamus-kategori-grid">
                {results.map((item) => (
                  <Link
                    key={item.id}
                    to={`/kamus/detail/${encodeURIComponent(item.lema)}`}
                    className="kamus-kategori-grid-link"
                  >
                    {item.lema}
                  </Link>
                ))}
              </div>
              <div className="mt-4">
                <Paginasi total={total} limit={limit} offset={offsetParam} onChange={handleOffset} />
              </div>
            </>
          )}
        </>
      )}
    </HalamanDasar>
  );
}

export default KamusKategori;
