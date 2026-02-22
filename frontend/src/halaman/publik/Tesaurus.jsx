/**
 * @fileoverview Halaman pencarian tesaurus — path-based: /tesaurus/cari/:kata
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilContohTesaurus, cariTesaurus } from '../../api/apiPublik';
import { useCursorPagination } from '../../hooks/bersama/useCursorPagination';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HasilPencarian from '../../komponen/publik/HasilPencarian';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { formatLemaHomonim } from '../../utils/formatUtils';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { buildMetaBrowseTesaurus, buildMetaPencarianTesaurus } from '../../utils/metaUtils';

const limit = 100;

function RelasiTampil({ sinonim, antonim }) {
  const daftarSinonim = sinonim ? sinonim.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : [];
  const daftarAntonim = antonim ? antonim.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : [];
  if (daftarSinonim.length === 0 && daftarAntonim.length === 0) return null;
  return (
    <span className="tesaurus-result-relasi">
      {daftarSinonim.length > 0 && (
        <>{' '}<span className="tesaurus-result-badge">≈</span>{' '}{daftarSinonim.join('; ')}</>
      )}
      {daftarAntonim.length > 0 && (
        <>{' '}<span className="tesaurus-result-badge">≠</span>{' '}{daftarAntonim.join('; ')}</>
      )}
    </span>
  );
}

function Tesaurus() {
  const { kata } = useParams();
  const { cursorState, handleCursor } = useCursorPagination({
    limit,
    resetOn: kata || '',
  });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cari-tesaurus', kata, cursorState.cursor, cursorState.direction, cursorState.lastPage],
    queryFn: () => cariTesaurus(kata, {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    }),
    enabled: Boolean(kata),
  });

  const { data: dataContoh } = useQuery({
    queryKey: ['tesaurus-contoh'],
    queryFn: ambilContohTesaurus,
    enabled: !kata,
    staleTime: 5 * 60 * 1000,
  });

  const contohTesaurus = dataContoh?.data || [];

  const results = data?.data || [];
  const total = data?.total || 0;

  const handlePaginasi = (action) => {
    handleCursor(action, {
      pageInfo: data?.pageInfo,
      total,
    });
  };

  const metaHalaman = kata
    ? buildMetaPencarianTesaurus(kata)
    : buildMetaBrowseTesaurus();

  return (
    <HalamanDasar judul={metaHalaman.judul} deskripsi={metaHalaman.deskripsi}>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Mencari data …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {/* Tanpa pencarian */}
      {!kata && !isLoading && (
        <p className="secondary-text">
          Gunakan kolom pencarian di atas untuk mencari sinonim, antonim, dan relasi kata
          {contohTesaurus.length > 0 && (
            <>, misalnya{' '}
              {contohTesaurus.map((indeks, i) => (
                <span key={indeks}>
                  <Link to={`/tesaurus/cari/${encodeURIComponent(indeks)}`} className="link-action">
                    {indeks}
                  </Link>
                  {i < contohTesaurus.length - 2 && ', '}
                  {i === contohTesaurus.length - 2 && ', atau '}
                </span>
              ))}
            </>
          )}
          .
        </p>
      )}

      {/* Hasil pencarian */}
      {kata && !isLoading && !isError && (
        <HasilPencarian
          results={results}
          emptyState={<EmptyResultText text="Kata tidak ditemukan di tesaurus. Coba kata lain?" />}
          total={total}
          limit={limit}
          pageInfo={data?.pageInfo}
          currentPage={cursorState.page}
          onNavigateCursor={handlePaginasi}
          containerClassName=""
          renderItems={(items) => (
            <div className="space-y-2">
              {items.map((item) => (
                <p key={item.id} className="leading-relaxed">
                  <Link
                    to={buatPathDetailKamus(item.indeks)}
                    className="link-action font-bold"
                  >
                    {formatLemaHomonim(item.indeks)}
                  </Link>
                  <RelasiTampil sinonim={item.sinonim} antonim={item.antonim} />
                </p>
              ))}
            </div>
          )}
        />
      )}
    </HalamanDasar>
  );
}

export default Tesaurus;
