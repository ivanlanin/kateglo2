/**
 * @fileoverview Halaman pencarian tesaurus — path-based: /tesaurus/cari/:kata
 */

import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariTesaurus } from '../../api/apiPublik';
import Paginasi from '../../komponen/bersama/Paginasi';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import TeksLema from '../../komponen/publik/TeksLema';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/kamusIndex';
import { buildMetaBrowseTesaurus, buildMetaPencarianTesaurus } from '../../utils/metaUtils';
import { updateSearchParamsWithOffset } from '../../utils/searchParams';

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

  const daftarSinonim = sinonim ? sinonim.split(';').map((s) => s.trim()).filter(Boolean) : [];
  const daftarAntonim = antonim ? antonim.split(';').map((s) => s.trim()).filter(Boolean) : [];
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
  const [searchParams, setSearchParams] = useSearchParams();
  const offsetParam = parseInt(searchParams.get('offset') || '0', 10);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['cari-tesaurus', kata, offsetParam],
    queryFn: () => cariTesaurus(kata, { limit, offset: offsetParam }),
    enabled: Boolean(kata),
  });

  const results = data?.data || [];
  const total = data?.total || 0;

  const handleOffset = (newOffset) => {
    updateSearchParamsWithOffset(setSearchParams, {}, newOffset);
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
              <div className="tesaurus-result-grid">
                {results.map((item) => (
                  <div key={item.id} className="tesaurus-result-row">
                    <Link
                      to={buatPathDetailKamus(item.lema)}
                      className="kamus-kategori-grid-link"
                    >
                      <TeksLema lema={item.lema} />
                    </Link>
                    <RelasiSingkat sinonim={item.sinonim} antonim={item.antonim} />
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
