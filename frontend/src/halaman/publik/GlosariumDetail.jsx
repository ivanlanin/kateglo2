/**
 * @fileoverview Halaman detail glosarium berdasarkan istilah asing
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailGlosarium } from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import CursorNavButton from '../../komponen/publik/CursorNavButton';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { parseEntriGlosarium } from '../../utils/formatUtils';
import { buildMetaDetailGlosarium } from '../../utils/metaUtils';

function upsertMetaTag({ name, property, content }) {
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let tag = document.head.querySelector(selector);
  if (!tag) {
    tag = document.createElement('meta');
    if (name) tag.setAttribute('name', name);
    if (property) tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', content);
}

function SeksiDetail({ judul, jumlah, children }) {
  return (
    <div className="glosarium-detail-seksi">
      <div className="kamus-detail-subentry-heading-row">
        <h2 className="kamus-detail-def-class mb-0">
          {judul}{' '}
          <span className="kamus-count-badge" data-count={jumlah}>
            ({jumlah})
          </span>
        </h2>
      </div>
      {children}
    </div>
  );
}

function AlirEntri({ items, tautAsing = false, before = null, after = null }) {
  return (
    <div className="kamus-detail-subentry-flow">
      {before}
      {items.map((item, i) => (
        <span key={item.id}>
          {item.bidang && (
            <><Link
              to={`/glosarium/bidang/${encodeURIComponent(item.bidang_kode || item.bidang)}`}
              className="badge-bidang"
            >{item.bidang}</Link>{' '}</>
          )}
          {item.sumber && (
            <><Link
              to={`/glosarium/sumber/${encodeURIComponent(item.sumber_kode || item.sumber)}`}
              className="badge-sumber"
            >{item.sumber}</Link>{' '}</>
          )}
          {tautAsing ? (
            <>
              <Link
                to={`/glosarium/detail/${encodeURIComponent(item.asing)}`}
                className="kamus-detail-subentry-link"
              >
                <em>{item.asing}</em>
              </Link>
              {item.indonesia && (
                <>
                  {' ('}
                  {parseEntriGlosarium(item.indonesia, (part, idx) => (
                    <Link
                      key={`${item.id}-${part}-${idx}`}
                      to={buatPathDetailKamus(part)}
                      className="kamus-detail-subentry-link"
                    >
                      {part}
                    </Link>
                  ))}
                  {')'}
                </>
              )}
            </>
          ) : (
            item.indonesia && parseEntriGlosarium(item.indonesia, (part, idx) => (
              <Link
                key={`${item.id}-${part}-${idx}`}
                to={buatPathDetailKamus(part)}
                className="kamus-detail-subentry-link"
              >
                {part}
              </Link>
            ))
          )}
          {i < items.length - 1 && <span className="secondary-text">; </span>}
        </span>
      ))}
      {after}
    </div>
  );
}

function GlosariumDetail() {
  const { asing } = useParams();
  const asingDecoded = decodeURIComponent(asing || '');

  const [mengandungCursor, setMengandungCursor] = useState(null);
  const [miripCursor, setMiripCursor] = useState(null);
  const [navigasiAktif, setNavigasiAktif] = useState(null);

  useEffect(() => {
    setMengandungCursor(null);
    setMiripCursor(null);
    setNavigasiAktif(null);
  }, [asingDecoded]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['glosarium-detail', asingDecoded, mengandungCursor, miripCursor],
    queryFn: () => ambilDetailGlosarium(asingDecoded, { mengandungCursor, miripCursor }),
    enabled: Boolean(asingDecoded),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (!isFetching) setNavigasiAktif(null);
  }, [isFetching]);

  const persis = data?.persis || [];
  const mengandung = data?.mengandung || [];
  const mirip = data?.mirip || [];
  const mengandungPage = data?.mengandungPage || { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null };
  const miripPage = data?.miripPage || { hasPrev: false, hasNext: false, prevCursor: null, nextCursor: null };
  const mengandungTotal = data?.mengandungTotal ?? mengandung.length;
  const miripTotal = data?.miripTotal ?? mirip.length;
  const kosong = !isLoading && !isError && persis.length === 0 && mengandung.length === 0 && mirip.length === 0;

  const meta = buildMetaDetailGlosarium(asingDecoded, data);

  useEffect(() => {
    const judul = `${meta.judul} — Kateglo`;
    document.title = judul;
    upsertMetaTag({ name: 'description', content: meta.deskripsi });
    upsertMetaTag({ property: 'og:title', content: judul });
    upsertMetaTag({ property: 'og:description', content: meta.deskripsi });
    upsertMetaTag({ name: 'twitter:title', content: judul });
    upsertMetaTag({ name: 'twitter:description', content: meta.deskripsi });
  }, [meta.judul, meta.deskripsi]);

  const handlePrevMengandung = () => {
    if (!mengandungPage.prevCursor) return;
    setNavigasiAktif('prevMengandung');
    setMengandungCursor(mengandungPage.prevCursor);
  };

  const handleNextMengandung = () => {
    if (!mengandungPage.nextCursor) return;
    setNavigasiAktif('nextMengandung');
    setMengandungCursor(mengandungPage.nextCursor);
  };

  const handlePrevMirip = () => {
    if (!miripPage.prevCursor) return;
    setNavigasiAktif('prevMirip');
    setMiripCursor(miripPage.prevCursor);
  };

  const handleNextMirip = () => {
    if (!miripPage.nextCursor) return;
    setNavigasiAktif('nextMirip');
    setMiripCursor(miripPage.nextCursor);
  };

  return (
    <HalamanDasar>
      {asingDecoded && <h1 className="page-title"><em>{asingDecoded}</em></h1>}

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat…"
        errorText="Gagal mengambil data."
      />

      {persis.length > 0 && (
        <SeksiDetail judul="Persis" jumlah={persis.length}>
          <AlirEntri items={persis} />
        </SeksiDetail>
      )}

      {mengandung.length > 0 && (
        <SeksiDetail judul="Memuat" jumlah={mengandungTotal}>
          <AlirEntri
            items={mengandung}
            tautAsing
            before={mengandungPage.hasPrev && (
              <>
                <CursorNavButton
                  symbol="«"
                  onClick={handlePrevMengandung}
                  disabled={isFetching}
                  isLoading={isFetching && navigasiAktif === 'prevMengandung'}
                />
                <span className="secondary-text"> … </span>
              </>
            )}
            after={mengandungPage.hasNext && (
              <>
                <span className="secondary-text"> … </span>
                <CursorNavButton
                  symbol="»"
                  onClick={handleNextMengandung}
                  disabled={isFetching}
                  isLoading={isFetching && navigasiAktif === 'nextMengandung'}
                />
              </>
            )}
          />
        </SeksiDetail>
      )}

      {mirip.length > 0 && (
        <SeksiDetail judul="Mirip" jumlah={miripTotal}>
          <AlirEntri
            items={mirip}
            tautAsing
            before={miripPage.hasPrev && (
              <>
                <CursorNavButton
                  symbol="«"
                  onClick={handlePrevMirip}
                  disabled={isFetching}
                  isLoading={isFetching && navigasiAktif === 'prevMirip'}
                />
                <span className="secondary-text"> … </span>
              </>
            )}
            after={miripPage.hasNext && (
              <>
                <span className="secondary-text"> … </span>
                <CursorNavButton
                  symbol="»"
                  onClick={handleNextMirip}
                  disabled={isFetching}
                  isLoading={isFetching && navigasiAktif === 'nextMirip'}
                />
              </>
            )}
          />
        </SeksiDetail>
      )}

      {kosong && <EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />}
    </HalamanDasar>
  );
}

export {
  upsertMetaTag,
};

export default GlosariumDetail;
