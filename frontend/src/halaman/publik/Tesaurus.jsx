/**
 * @fileoverview Halaman pencarian tesaurus — path-based: /tesaurus/cari/:kata
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariTesaurus } from '../../api/apiPublik';
import Paginasi from '../../komponen/bersama/Paginasi';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import TeksLema from '../../komponen/publik/TeksLema';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { buildMetaBrowseTesaurus, buildMetaPencarianTesaurus } from '../../utils/metaUtils';

const limit = 100;
const BATAS_RINGKAS = 2;

function DaftarRelasi({ simbol, daftar, ekspansi }) {
  const tampil = ekspansi ? daftar : daftar.slice(0, BATAS_RINGKAS);
  const terpotong = !ekspansi && daftar.length > BATAS_RINGKAS;
  return (
    <>
      <span className="tesaurus-result-badge">{simbol}</span>
      {' '}{tampil.join('; ')}{terpotong && '; …'}
    </>
  );
}

function RelasiSingkat({ sinonim, antonim }) {
  const [ekspansi, setEkspansi] = useState(false);

  const daftarSinonim = sinonim ? sinonim.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : [];
  const daftarAntonim = antonim ? antonim.split(/[;,]/).map((s) => s.trim()).filter(Boolean) : [];
  if (daftarSinonim.length === 0 && daftarAntonim.length === 0) return null;

  const adaLebih = daftarSinonim.length > BATAS_RINGKAS || daftarAntonim.length > BATAS_RINGKAS;

  return (
    <span className="tesaurus-result-relasi">
      {daftarSinonim.length > 0 && (
        <>{' '}<DaftarRelasi simbol="≈" daftar={daftarSinonim} ekspansi={ekspansi} /></>
      )}
      {daftarAntonim.length > 0 && (
        <>{' '}<DaftarRelasi simbol="≠" daftar={daftarAntonim} ekspansi={ekspansi} /></>
      )}
      {adaLebih && (
        <>
          {' '}
          <button
            type="button"
            className="tesaurus-result-toggle"
            onClick={() => setEkspansi(!ekspansi)}
            aria-expanded={ekspansi}
          >
            {ekspansi ? '«' : '»'}
          </button>
        </>
      )}
    </span>
  );
}

function Tesaurus() {
  const { kata } = useParams();
  const [cursorState, setCursorState] = useState({
    cursor: null,
    direction: 'next',
    lastPage: false,
    page: 1,
  });

  useEffect(() => {
    setCursorState({ cursor: null, direction: 'next', lastPage: false, page: 1 });
  }, [kata]);

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

  const results = data?.data || [];
  const total = data?.total || 0;

  const handleCursor = (action) => {
    const pageInfo = data?.pageInfo;
    if (action === 'first') {
      setCursorState({ cursor: null, direction: 'next', lastPage: false, page: 1 });
      return;
    }

    if (action === 'last') {
      const targetPage = Math.max(1, Math.ceil((total || 0) / limit));
      setCursorState({ cursor: null, direction: 'next', lastPage: true, page: targetPage });
      return;
    }

    if (action === 'next' && pageInfo?.hasNext && pageInfo?.nextCursor) {
      setCursorState((prev) => ({
        cursor: pageInfo.nextCursor,
        direction: 'next',
        lastPage: false,
        page: prev.page + 1,
      }));
      return;
    }

    if (action === 'prev' && pageInfo?.hasPrev && pageInfo?.prevCursor) {
      setCursorState((prev) => ({
        cursor: pageInfo.prevCursor,
        direction: 'prev',
        lastPage: false,
        page: Math.max(1, prev.page - 1),
      }));
    }
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
        <p className="secondary-text">Gunakan kolom pencarian di atas untuk mencari sinonim, antonim, dan relasi kata.</p>
      )}

      {/* Hasil pencarian */}
      {kata && !isLoading && !isError && (
        <>
          {results.length === 0 && <EmptyResultText text="Kata tidak ditemukan di tesaurus. Coba kata lain?" />}

          {results.length > 0 && (
            <>
              <div className="mb-4">
                <Paginasi
                  total={total}
                  limit={limit}
                  pageInfo={data?.pageInfo}
                  currentPage={cursorState.page}
                  onNavigateCursor={handleCursor}
                />
              </div>
              <div className="tesaurus-result-grid">
                {results.map((item) => (
                  <div key={item.id} className="tesaurus-result-row">
                    <Link
                      to={buatPathDetailKamus(item.indeks)}
                      className="kamus-kategori-grid-link"
                    >
                      <TeksLema lema={item.indeks} />
                    </Link>
                    <RelasiSingkat sinonim={item.sinonim} antonim={item.antonim} />
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Paginasi
                  total={total}
                  limit={limit}
                  pageInfo={data?.pageInfo}
                  currentPage={cursorState.page}
                  onNavigateCursor={handleCursor}
                />
              </div>
            </>
          )}
        </>
      )}
    </HalamanDasar>
  );
}

export default Tesaurus;
