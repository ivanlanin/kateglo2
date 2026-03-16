/**
 * @fileoverview Halaman pencarian rima — rima akhir dan rima awal (aliterasi)
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilContohRima, cariRima } from '../../../api/apiPublik';
import TombolNavKursor from '../../../components/publik/TombolNavKursor';
import HalamanPublik from '../../../components/publik/HalamanPublik';
import HamparanMuatNav from '../../../components/publik/HamparanMuatNav';
import { QueryFeedback } from '../../../components/publik/StatusKonten';
import { buatPathDetailKamus } from '../../../utils/paramUtils';
import { amanDecode } from './Makna';
import useNavigasiMemuat from '../../../hooks/bersama/useNavigasiMemuat';

const LIMIT = 50;

function DaftarRima({
  items,
}) {
  if (!items || items.length === 0) {
    return <p className="secondary-text mt-2">Tidak ditemukan.</p>;
  }

  return (
    <div className="rima-hasil-grid mt-2">
      {items.map((item) => (
        <Link
          key={item.indeks}
          to={buatPathDetailKamus(item.indeks)}
          className="kamus-detail-subentry-link rima-hasil-link hasil-entry-link"
        >
          {item.indeks}
        </Link>
      ))}
    </div>
  );
}

function Rima() {
  const { kata } = useParams();
  const kataAman = amanDecode(kata);

  const [cursorAkhir, setCursorAkhir] = useState(null);
  const [directionAkhir, setDirectionAkhir] = useState('next');
  const [cursorAwal, setCursorAwal] = useState(null);
  const [directionAwal, setDirectionAwal] = useState('next');

  useEffect(() => {
    setCursorAkhir(null);
    setDirectionAkhir('next');
    setCursorAwal(null);
    setDirectionAwal('next');
  }, [kataAman]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['cari-rima', kataAman, cursorAkhir, directionAkhir, cursorAwal, directionAwal],
    queryFn: () => cariRima(kataAman, {
      limit: LIMIT,
      cursorAkhir,
      directionAkhir,
      cursorAwal,
      directionAwal,
    }),
    enabled: Boolean(kataAman),
    placeholderData: (previousData) => previousData,
  });

  const { data: dataContoh } = useQuery({
    queryKey: ['rima-contoh'],
    queryFn: ambilContohRima,
    enabled: !kataAman,
    staleTime: 5 * 60 * 1000,
  });

  const contohRima = dataContoh?.data || [];

  const judulHalaman = kataAman
    ? `Hasil Pencarian Rima "${kataAman}"`
    : 'Rima';
  const deskripsiHalaman = kataAman
    ? `Kata-kata yang berima dengan "${kataAman}" di kamus Kateglo.`
    : 'Cari kata berdasarkan rima di kamus Kateglo.';

  const rimaAkhir = data?.rima_akhir;
  const rimaAwal = data?.rima_awal;

  const { navigasiAktif: navigasiRimaAktif, mulaiNavigasi } = useNavigasiMemuat(isFetching, kataAman);
  const isMemuatRimaAkhir = isFetching && ['akhir-prev', 'akhir-next'].includes(navigasiRimaAktif);
  const isMemuatRimaAwal = isFetching && ['awal-prev', 'awal-next'].includes(navigasiRimaAktif);

  const handleAkhirPrev = () => {
    mulaiNavigasi('akhir-prev');
    setCursorAkhir(rimaAkhir?.prevCursor);
    setDirectionAkhir('prev');
  };
  const handleAkhirNext = () => {
    mulaiNavigasi('akhir-next');
    setCursorAkhir(rimaAkhir?.nextCursor);
    setDirectionAkhir('next');
  };
  const handleAwalPrev = () => {
    mulaiNavigasi('awal-prev');
    setCursorAwal(rimaAwal?.prevCursor);
    setDirectionAwal('prev');
  };
  const handleAwalNext = () => {
    mulaiNavigasi('awal-next');
    setCursorAwal(rimaAwal?.nextCursor);
    setDirectionAwal('next');
  };

  return (
    <HalamanPublik judul={judulHalaman} deskripsi={deskripsiHalaman}>
      <QueryFeedback
        isLoading={isLoading && !data}
        isError={isError}
        error={error}
        loadingText="Mencari rima …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {!kataAman && !isLoading && (
        <p className="secondary-text">
          Gunakan kolom pencarian di atas untuk mencari kata yang berima
          {contohRima.length > 0 && (
            <>, misalnya{' '}
              {contohRima.map((indeks, i) => (
                <span key={indeks}>
                  <Link to={`/rima/cari/${encodeURIComponent(indeks)}`} className="link-action">
                    {indeks}
                  </Link>
                  {i < contohRima.length - 2 && ', '}
                  {i === contohRima.length - 2 && ', atau '}
                </span>
              ))}
            </>
          )}
          .
        </p>
      )}

      {kataAman && !isError && data && (
        <>
          <div className="mt-6 mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
            <div className="kamus-detail-subentry-heading-row">
              <h2 className="kamus-detail-def-class mb-0">Rima Akhir</h2>
              <div className="rima-heading-actions">
                {rimaAkhir?.total > 0 && (
                  <span className="kamus-count-badge" data-count={rimaAkhir.total}>
                    {rimaAkhir.total}
                  </span>
                )}
                <div className="rima-heading-nav">
                  <TombolNavKursor
                    symbol="‹"
                    onClick={handleAkhirPrev}
                    disabled={isFetching || !rimaAkhir?.hasPrev}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                  <TombolNavKursor
                    symbol="›"
                    onClick={handleAkhirNext}
                    disabled={isFetching || !rimaAkhir?.hasNext}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                </div>
              </div>
            </div>
            <HamparanMuatNav
              isLoading={isMemuatRimaAkhir}
              loadingText="Memuat rima …"
            >
              <DaftarRima
                items={rimaAkhir?.data}
              />
            </HamparanMuatNav>
          </div>

          <div className="mt-6">
            <div className="kamus-detail-subentry-heading-row">
              <h2 className="kamus-detail-def-class mb-0">Rima Awal</h2>
              <div className="rima-heading-actions">
                {rimaAwal?.total > 0 && (
                  <span className="kamus-count-badge" data-count={rimaAwal.total}>
                    {rimaAwal.total}
                  </span>
                )}
                <div className="rima-heading-nav">
                  <TombolNavKursor
                    symbol="‹"
                    onClick={handleAwalPrev}
                    disabled={isFetching || !rimaAwal?.hasPrev}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                  <TombolNavKursor
                    symbol="›"
                    onClick={handleAwalNext}
                    disabled={isFetching || !rimaAwal?.hasNext}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                </div>
              </div>
            </div>
            <HamparanMuatNav
              isLoading={isMemuatRimaAwal}
              loadingText="Memuat rima …"
            >
              <DaftarRima
                items={rimaAwal?.data}
              />
            </HamparanMuatNav>
          </div>
        </>
      )}
    </HalamanPublik>
  );
}

export default Rima;
