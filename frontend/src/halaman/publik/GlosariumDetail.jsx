/**
 * @fileoverview Halaman detail glosarium berdasarkan istilah asing
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailGlosarium } from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import CursorNavButton from '../../komponen/publik/CursorNavButton';
import NavigasiLoadingOverlay from '../../komponen/publik/NavigasiLoadingOverlay';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import { parseEntriGlosarium } from '../../utils/formatUtils';
import { buildMetaDetailGlosarium } from '../../utils/metaUtils';
import useNavigasiMemuat from '../../hooks/bersama/useNavigasiMemuat';

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

function SeksiDetail({ judul, jumlah, actions = null, children }) {
  return (
    <div className="glosarium-detail-seksi">
      <div className="kamus-detail-subentry-heading-row">
        <h2 className="kamus-detail-def-class mb-0">{judul}</h2>
        <div className="rima-heading-actions">
          <span className="kamus-count-badge" data-count={jumlah}>
            ({jumlah})
          </span>
          {actions}
        </div>
      </div>
      {children}
    </div>
  );
}

function getBidangSebelumnya(sortedItems = [], index = 0) {
  if (index <= 0) return '';
  return (sortedItems[index - 1]?.bidang || '').trim().toLowerCase();
}

function AlirEntri({ items, tautAsing = false }) {
  const sortedItems = sortAlirEntriItems(items);

  return (
    <div className="kamus-detail-subentry-flow">
      {sortedItems.map((item, i) => {
        const bidangSaatIni = (item.bidang || '').trim().toLowerCase();
        const bidangSebelumnya = getBidangSebelumnya(sortedItems, i);
        const tampilkanBadgeBidang = Boolean(item.bidang) && bidangSaatIni !== bidangSebelumnya;

        return (
        <span key={item.id}>
          {tampilkanBadgeBidang && (
            <><Link
              to={`/glosarium/bidang/${encodeURIComponent(item.bidang_kode || item.bidang)}`}
              className="badge-bidang"
            >{item.bidang}</Link>{' '}</>
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
          {i < sortedItems.length - 1 && <span className="secondary-text">; </span>}
        </span>
      );
      })}
    </div>
  );
}

function sortAlirEntriItems(items = []) {
  return [...items].sort((a, b) => {
    const bidangA = (a.bidang || '').trim();
    const bidangB = (b.bidang || '').trim();

    if (bidangA && !bidangB) return -1;
    if (!bidangA && bidangB) return 1;

    const bidangCompare = bidangA.localeCompare(bidangB, 'id', { sensitivity: 'base' });
    if (bidangCompare !== 0) return bidangCompare;

    const labelA = (a.asing || a.indonesia || '').trim();
    const labelB = (b.asing || b.indonesia || '').trim();
    return labelA.localeCompare(labelB, 'id', { sensitivity: 'base' });
  });
}

function GlosariumDetail() {
  const { asing } = useParams();
  const asingDecoded = decodeURIComponent(asing || '');

  const [mengandungCursor, setMengandungCursor] = useState(null);
  const [miripCursor, setMiripCursor] = useState(null);
  useEffect(() => {
    setMengandungCursor(null);
    setMiripCursor(null);
  }, [asingDecoded]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['glosarium-detail', asingDecoded, mengandungCursor, miripCursor],
    queryFn: () => ambilDetailGlosarium(asingDecoded, { mengandungCursor, miripCursor }),
    enabled: Boolean(asingDecoded),
    placeholderData: (previousData) => previousData,
  });

  const { navigasiAktif, mulaiNavigasi } = useNavigasiMemuat(isFetching, asingDecoded);
  const isMemuatMengandung = isFetching && ['prevMengandung', 'nextMengandung'].includes(navigasiAktif);
  const isMemuatMirip = isFetching && ['prevMirip', 'nextMirip'].includes(navigasiAktif);

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
    mulaiNavigasi('prevMengandung');
    setMengandungCursor(mengandungPage.prevCursor);
  };

  const handleNextMengandung = () => {
    if (!mengandungPage.nextCursor) return;
    mulaiNavigasi('nextMengandung');
    setMengandungCursor(mengandungPage.nextCursor);
  };

  const handlePrevMirip = () => {
    if (!miripPage.prevCursor) return;
    mulaiNavigasi('prevMirip');
    setMiripCursor(miripPage.prevCursor);
  };

  const handleNextMirip = () => {
    if (!miripPage.nextCursor) return;
    mulaiNavigasi('nextMirip');
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
        <SeksiDetail
          judul="Memuat"
          jumlah={mengandungTotal}
          actions={(
            <div className="rima-heading-nav">
              <CursorNavButton
                symbol="‹"
                onClick={handlePrevMengandung}
                disabled={isFetching || !mengandungPage?.hasPrev}
                className="paginasi-btn rima-heading-nav-button"
              />
              <CursorNavButton
                symbol="›"
                onClick={handleNextMengandung}
                disabled={isFetching || !mengandungPage?.hasNext}
                className="paginasi-btn rima-heading-nav-button"
              />
            </div>
          )}
        >
          <NavigasiLoadingOverlay
            isLoading={isMemuatMengandung}
            loadingText="Memuat glosarium …"
          >
            <AlirEntri
              items={mengandung}
              tautAsing
            />
          </NavigasiLoadingOverlay>
        </SeksiDetail>
      )}

      {mirip.length > 0 && (
        <SeksiDetail
          judul="Mirip"
          jumlah={miripTotal}
          actions={(
            <div className="rima-heading-nav">
              <CursorNavButton
                symbol="‹"
                onClick={handlePrevMirip}
                disabled={isFetching || !miripPage?.hasPrev}
                className="paginasi-btn rima-heading-nav-button"
              />
              <CursorNavButton
                symbol="›"
                onClick={handleNextMirip}
                disabled={isFetching || !miripPage?.hasNext}
                className="paginasi-btn rima-heading-nav-button"
              />
            </div>
          )}
        >
          <NavigasiLoadingOverlay
            isLoading={isMemuatMirip}
            loadingText="Memuat glosarium …"
          >
            <AlirEntri
              items={mirip}
              tautAsing
            />
          </NavigasiLoadingOverlay>
        </SeksiDetail>
      )}

      {kosong && <EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />}
    </HalamanDasar>
  );
}

export const __private = {
  AlirEntri,
  getBidangSebelumnya,
  sortAlirEntriItems,
};

export {
  upsertMetaTag,
};

export default GlosariumDetail;
