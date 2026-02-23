/**
 * @fileoverview Halaman pencarian rima — rima akhir dan rima awal (aliterasi)
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilContohRima, cariRima } from '../../api/apiPublik';
import CursorNavButton from '../../komponen/publik/CursorNavButton';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { amanDecode } from './Makna';

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
          className="kamus-detail-subentry-link rima-hasil-link"
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
  const [navigasiRimaAktif, setNavigasiRimaAktif] = useState(null);

  useEffect(() => {
    setCursorAkhir(null);
    setDirectionAkhir('next');
    setCursorAwal(null);
    setDirectionAwal('next');
    setNavigasiRimaAktif(null);
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

  useEffect(() => {
    if (!isFetching) {
      setNavigasiRimaAktif(null);
    }
  }, [isFetching]);

  const handleAkhirPrev = () => {
    setNavigasiRimaAktif('akhir-prev');
    setCursorAkhir(rimaAkhir?.prevCursor);
    setDirectionAkhir('prev');
  };
  const handleAkhirNext = () => {
    setNavigasiRimaAktif('akhir-next');
    setCursorAkhir(rimaAkhir?.nextCursor);
    setDirectionAkhir('next');
  };
  const handleAwalPrev = () => {
    setNavigasiRimaAktif('awal-prev');
    setCursorAwal(rimaAwal?.prevCursor);
    setDirectionAwal('prev');
  };
  const handleAwalNext = () => {
    setNavigasiRimaAktif('awal-next');
    setCursorAwal(rimaAwal?.nextCursor);
    setDirectionAwal('next');
  };

  return (
    <HalamanDasar judul={judulHalaman} deskripsi={deskripsiHalaman}>
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
          <div className="mt-6">
            <div className="kamus-detail-subentry-heading-row">
              <h2 className="kamus-detail-def-class mb-0">Rima Akhir</h2>
              <div className="rima-heading-actions">
                {rimaAkhir?.total > 0 && (
                  <span className="kamus-count-badge" data-count={rimaAkhir.total}>
                    {rimaAkhir.total}
                  </span>
                )}
                <div className="rima-heading-nav">
                  <CursorNavButton
                    symbol="‹"
                    onClick={handleAkhirPrev}
                    disabled={isFetching || !rimaAkhir?.hasPrev}
                    isLoading={isFetching && navigasiRimaAktif === 'akhir-prev'}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                  <CursorNavButton
                    symbol="›"
                    onClick={handleAkhirNext}
                    disabled={isFetching || !rimaAkhir?.hasNext}
                    isLoading={isFetching && navigasiRimaAktif === 'akhir-next'}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                </div>
              </div>
            </div>
            <DaftarRima
              items={rimaAkhir?.data}
            />
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
                  <CursorNavButton
                    symbol="‹"
                    onClick={handleAwalPrev}
                    disabled={isFetching || !rimaAwal?.hasPrev}
                    isLoading={isFetching && navigasiRimaAktif === 'awal-prev'}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                  <CursorNavButton
                    symbol="›"
                    onClick={handleAwalNext}
                    disabled={isFetching || !rimaAwal?.hasNext}
                    isLoading={isFetching && navigasiRimaAktif === 'awal-next'}
                    className="paginasi-btn rima-heading-nav-button"
                  />
                </div>
              </div>
            </div>
            <DaftarRima
              items={rimaAwal?.data}
            />
          </div>
        </>
      )}
    </HalamanDasar>
  );
}

export default Rima;
