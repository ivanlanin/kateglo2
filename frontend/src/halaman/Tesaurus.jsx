/**
 * @fileoverview Halaman pencarian tesaurus — path-based: /tesaurus/cari/:kata
 */

import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariTesaurus } from '../api/apiPublik';
import Paginasi from '../komponen/Paginasi';
import HalamanDasar from '../komponen/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../komponen/StatusKonten';
import { updateSearchParamsWithOffset } from '../utils/searchParams';

const limit = 100;

function Tesaurus() {
  const { kata } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['cari-tesaurus', kata, offsetParam],
    queryFn: () => cariTesaurus(kata, { limit, offset: offsetParam }),
    enabled: Boolean(kata),
  });

  const results = data?.data || [];
  const total = data?.total || 0;

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
  };

  const judulHalaman = kata
    ? `Hasil Pencarian \u201c${decodeURIComponent(kata)}\u201d`
    : 'Tesaurus';

  const breadcrumbPencarian = kata ? (
    <div className="kamus-detail-breadcrumb">
      <Link to="/tesaurus" className="kamus-detail-breadcrumb-link">Tesaurus</Link>
      {' › '}
      <span className="kamus-detail-breadcrumb-current">Pencarian</span>
    </div>
  ) : null;

  return (
    <HalamanDasar judul={judulHalaman} breadcrumb={breadcrumbPencarian}>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        loadingText="Mencari data …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian */}
      {!kata && !isLoading && (
        <p className="secondary-text">Gunakan kolom pencarian di atas untuk mencari sinonim, antonim, dan relasi kata.</p>
      )}

      {/* Hasil pencarian */}
      {kata && !isLoading && !isError && (
        <>
          {results.length === 0 && <EmptyResultText text="Kata tidak ditemukan di tesaurus. Coba kata lain?" />}

          {results.length > 0 && (
            <>
              <div className="tesaurus-result-grid">
                {results.map((item) => (
                  <div key={item.id} className="tesaurus-result-row">
                    <Link
                      to={`/tesaurus/detail/${encodeURIComponent(item.lema)}`}
                      className="kamus-kategori-grid-link"
                    >
                      {item.lema}
                    </Link>
                    {item.sinonim && (
                      <span className="tesaurus-result-sinonim">
                        : {item.sinonim.split(';').slice(0, 5).join('; ')}
                        {item.sinonim.split(';').length > 5 && ' …'}
                      </span>
                    )}
                  </div>
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

export default Tesaurus;
