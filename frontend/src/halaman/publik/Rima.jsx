/**
 * @fileoverview Halaman pencarian rima — rima akhir dan rima awal (aliterasi)
 */

import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { cariRima } from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { amanDecode } from './Makna';

const LIMIT = 50;

function DaftarRima({ items, pageInfo, onPrev, onNext, isUpdating }) {
  if (!items || items.length === 0) {
    return <p className="secondary-text mt-2">Tidak ditemukan.</p>;
  }

  const hasPrev = Boolean(pageInfo?.hasPrev);
  const hasNext = Boolean(pageInfo?.hasNext);

  return (
    <div className="kamus-detail-subentry-flow mt-2">
      {hasPrev && (
        <>
          <button
            type="button"
            onClick={onPrev}
            className="kamus-detail-subentry-link"
            disabled={isUpdating}
          >
            «
          </button>
          <span className="secondary-text"> ... </span>
        </>
      )}
      {items.map((item, i) => (
        <Fragment key={item.indeks}>
          <Link to={buatPathDetailKamus(item.indeks)} className="kamus-detail-subentry-link">
            {item.indeks}
          </Link>
          {i < items.length - 1 && <span className="secondary-text">; </span>}
        </Fragment>
      ))}
      {hasNext && (
        <>
          <span className="secondary-text"> ... </span>
          <button
            type="button"
            onClick={onNext}
            className="kamus-detail-subentry-link"
            disabled={isUpdating}
          >
            »
          </button>
        </>
      )}
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

  useEffect(() => {
    document.title = kataAman
      ? `Rima \u201c${kataAman}\u201d \u2014 Kateglo`
      : 'Rima \u2014 Kateglo';
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

  const rimaAkhir = data?.rima_akhir;
  const rimaAwal = data?.rima_awal;

  const handleAkhirPrev = () => {
    setCursorAkhir(rimaAkhir?.prevCursor);
    setDirectionAkhir('prev');
  };
  const handleAkhirNext = () => {
    setCursorAkhir(rimaAkhir?.nextCursor);
    setDirectionAkhir('next');
  };
  const handleAwalPrev = () => {
    setCursorAwal(rimaAwal?.prevCursor);
    setDirectionAwal('prev');
  };
  const handleAwalNext = () => {
    setCursorAwal(rimaAwal?.nextCursor);
    setDirectionAwal('next');
  };

  return (
    <HalamanDasar>
      <QueryFeedback
        isLoading={isLoading && !data}
        isError={isError}
        error={error}
        loadingText="Mencari rima …"
        errorText="Gagal mengambil data. Coba lagi."
      />

      {kataAman && !isError && data && (
        <>
          <h1 className="kamus-detail-heading">
            <span className="kamus-detail-heading-main">
              Hasil Pencarian Rima &ldquo;{kataAman}&rdquo;
            </span>
          </h1>

          <div className="mt-6">
            <div className="kamus-detail-subentry-heading-row">
              <h2 className="kamus-detail-def-class mb-0">Rima Akhir</h2>
              {rimaAkhir?.total > 0 && (
                <span className="kamus-count-badge" data-count={rimaAkhir.total}>
                  {rimaAkhir.total}
                </span>
              )}
            </div>
            <DaftarRima
              items={rimaAkhir?.data}
              pageInfo={rimaAkhir}
              onPrev={handleAkhirPrev}
              onNext={handleAkhirNext}
              isUpdating={isFetching}
            />
          </div>

          <div className="mt-6">
            <div className="kamus-detail-subentry-heading-row">
              <h2 className="kamus-detail-def-class mb-0">Rima Awal</h2>
              {rimaAwal?.total > 0 && (
                <span className="kamus-count-badge" data-count={rimaAwal.total}>
                  {rimaAwal.total}
                </span>
              )}
            </div>
            <DaftarRima
              items={rimaAwal?.data}
              pageInfo={rimaAwal}
              onPrev={handleAwalPrev}
              onNext={handleAwalNext}
              isUpdating={isFetching}
            />
          </div>
        </>
      )}
    </HalamanDasar>
  );
}

export default Rima;
