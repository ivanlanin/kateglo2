/**
 * @fileoverview Halaman detail glosarium berdasarkan istilah asing
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailGlosarium } from '../../../api/apiPublik';
import HalamanPublik from '../../../components/publik/HalamanPublik';
import TombolNavKursor from '../../../components/publik/TombolNavKursor';
import HamparanMuatNav from '../../../components/publik/HamparanMuatNav';
import TombolSunting from '../../../components/publik/TombolSunting';
import { EmptyResultText, QueryFeedback } from '../../../components/publik/StatusKonten';
import { buatPathDetailKamus, buatSlug, normalisasiIndeksKamus } from '../../../utils/paramUtils';
import { renderEntriGlosariumTertaut } from '../../../utils/formatUtils';
import { buildMetaDetailGlosarium } from '../../../utils/metaUtils';
import useNavigasiMemuat from '../../../hooks/bersama/useNavigasiMemuat';
import { useAuthOptional } from '../../../context/authContext';

function normalisasiKunciTautanIndonesia(teks = '') {
  return normalisasiIndeksKamus(teks).trim().toLowerCase();
}

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

function getSumberSebelumnya(sortedItems = [], index = 0) {
  if (index <= 0) return '';
  return (sortedItems[index - 1]?.sumber_kode || '').trim();
}

function AlirEntri({ items, tautAsing = false, tampilkanEdit = false, tautanIndonesiaValidSet = null }) {
  const sortedItems = sortAlirEntriItems(items, {
    prioritizeIndonesia: !tautAsing,
    sortByBidang: true,
  });
  const flowItems = sortedItems;

  const renderAsing = (item) => renderEntriGlosariumTertaut(item.asing, (part, info) => (
    <Link
      key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}
      to={`/glosarium/detail/${encodeURIComponent(part)}`}
      className="kamus-detail-subentry-link"
    >
      {part}
    </Link>
  ));

  const renderIndonesia = (item) => renderEntriGlosariumTertaut(item.indonesia, (part, info) => (
    tautanIndonesiaValidSet?.has(normalisasiKunciTautanIndonesia(part)) ? (
      <Link
        key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}
        to={buatPathDetailKamus(part)}
        className="kamus-detail-subentry-link"
      >
        {part}
      </Link>
    ) : (
      <span key={`${item.id}-${part}-${info.partIndex}-${info.tokenIndex}`}>{part}</span>
    )
  ));

  return (
    <div className="kamus-detail-subentry-flow">
      {flowItems.map((item, i) => {
        const bidangSaatIni = (item.bidang || '').trim().toLowerCase();
        const bidangSebelumnya = getBidangSebelumnya(flowItems, i);
        const tampilkanBadgeBidang = Boolean(item.bidang) && bidangSaatIni !== bidangSebelumnya;
        const bidangLabel = String(item.bidang_kode || item.bidang || '').trim();
        const bidangSlug = String(item.bidang_slug || buatSlug(item.bidang || '') || item.bidang_kode || item.bidang || '').trim();

        const sumberKodeSaatIni = (item.sumber_kode || '').trim();
        const sumberKodeSebelumnya = getSumberSebelumnya(flowItems, i);
        const tampilkanBadgeSumber = Boolean(sumberKodeSaatIni) && sumberKodeSaatIni !== sumberKodeSebelumnya;

        return (
        <span key={item.id}>
          {tampilkanBadgeBidang && (
            <><Link
              to={`/glosarium/bidang/${encodeURIComponent(bidangSlug)}`}
              className="badge-bidang"
              title={item.bidang}
            >{bidangLabel}</Link>{' '}</>
          )}
          {tampilkanBadgeSumber && (
            <><Link
              to={`/glosarium/sumber/${encodeURIComponent(buatSlug(item.sumber || ''))}`}
              className="badge-sumber"
              title={item.sumber || undefined}
            >{sumberKodeSaatIni}</Link>{' '}</>
          )}
          {tautAsing ? (
            <>
              <em>{renderAsing(item)}</em>
              {item.indonesia ? ': ' : ''}
              {renderIndonesia(item)}
              {tampilkanEdit && item?.id && item?.asing && item?.indonesia && (
                <TombolSunting to={`/redaksi/glosarium/${item.id}`} />
              )}
            </>
          ) : (
            <>
              {item.indonesia && renderIndonesia(item)}
              {tampilkanEdit && item?.id && item?.indonesia && (
                <TombolSunting to={`/redaksi/glosarium/${item.id}`} />
              )}
            </>
          )}
          {i < flowItems.length - 1 && <span className="secondary-text">; </span>}
        </span>
      );
      })}
    </div>
  );
}

function pilihLabelAlir(item, prioritizeIndonesia = false) {
  const indonesia = String(item?.indonesia || '').trim();
  const asing = String(item?.asing || '').trim();

  if (prioritizeIndonesia) {
    if (indonesia) return indonesia;
    if (asing) return asing;
    return '';
  }

  if (asing) return asing;
  if (indonesia) return indonesia;
  return '';
}

function sortAlirEntriItems(items = [], { prioritizeIndonesia = false, sortByBidang = true } = {}) {
  return [...items].sort((a, b) => {
    const bidangA = (a.bidang || '').trim();
    const bidangB = (b.bidang || '').trim();

    if (sortByBidang) {
      if (bidangA && !bidangB) return -1;
      if (!bidangA && bidangB) return 1;

      const bidangCompare = bidangA.localeCompare(bidangB, 'id', { sensitivity: 'base' });
      if (bidangCompare !== 0) return bidangCompare;
    }

    const sumberA = (a.sumber || '').trim();
    const sumberB = (b.sumber || '').trim();
    const sumberCompare = sumberA.localeCompare(sumberB, 'id', { sensitivity: 'base' });
    if (sumberCompare !== 0) return sumberCompare;

    const labelA = pilihLabelAlir(a, prioritizeIndonesia);
    const labelB = pilihLabelAlir(b, prioritizeIndonesia);
    return labelA.localeCompare(labelB, 'id', { sensitivity: 'base' });
  });
}

function GlosariumDetail() {
  const { asing } = useParams();
  const auth = useAuthOptional();
  const adalahAdmin = Boolean(auth?.adalahAdmin);
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
  const tautanIndonesiaValidSet = new Set(
    (data?.tautan_indonesia_valid || []).map((item) => normalisasiKunciTautanIndonesia(item)).filter(Boolean)
  );
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
    <HalamanPublik>
      {asingDecoded && <h1 className="page-title"><em>{asingDecoded}</em></h1>}

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat …"
        errorText="Gagal mengambil data."
      />

      {persis.length > 0 && (
        <SeksiDetail judul="Persis" jumlah={persis.length}>
          <AlirEntri items={persis} tampilkanEdit={adalahAdmin} tautanIndonesiaValidSet={tautanIndonesiaValidSet} />
        </SeksiDetail>
      )}

      {mengandung.length > 0 && (
        <SeksiDetail
          judul="Memuat"
          jumlah={mengandungTotal}
          actions={(
            <div className="rima-heading-nav">
              <TombolNavKursor
                symbol="‹"
                onClick={handlePrevMengandung}
                disabled={isFetching || !mengandungPage?.hasPrev}
                className="paginasi-btn rima-heading-nav-button"
              />
              <TombolNavKursor
                symbol="›"
                onClick={handleNextMengandung}
                disabled={isFetching || !mengandungPage?.hasNext}
                className="paginasi-btn rima-heading-nav-button"
              />
            </div>
          )}
        >
          <HamparanMuatNav
            isLoading={isMemuatMengandung}
            loadingText="Memuat glosarium …"
          >
            <AlirEntri
              items={mengandung}
              tautAsing
              tampilkanEdit={adalahAdmin}
              tautanIndonesiaValidSet={tautanIndonesiaValidSet}
            />
          </HamparanMuatNav>
        </SeksiDetail>
      )}

      {mirip.length > 0 && (
        <SeksiDetail
          judul="Mirip"
          jumlah={miripTotal}
          actions={(
            <div className="rima-heading-nav">
              <TombolNavKursor
                symbol="‹"
                onClick={handlePrevMirip}
                disabled={isFetching || !miripPage?.hasPrev}
                className="paginasi-btn rima-heading-nav-button"
              />
              <TombolNavKursor
                symbol="›"
                onClick={handleNextMirip}
                disabled={isFetching || !miripPage?.hasNext}
                className="paginasi-btn rima-heading-nav-button"
              />
            </div>
          )}
        >
          <HamparanMuatNav
            isLoading={isMemuatMirip}
            loadingText="Memuat glosarium …"
          >
            <AlirEntri
              items={mirip}
              tautAsing
              tampilkanEdit={adalahAdmin}
              tautanIndonesiaValidSet={tautanIndonesiaValidSet}
            />
          </HamparanMuatNav>
        </SeksiDetail>
      )}

      {kosong && <EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />}
    </HalamanPublik>
  );
}

export const __private = {
  AlirEntri,
  getBidangSebelumnya,
  getSumberSebelumnya,
  pilihLabelAlir,
  sortAlirEntriItems,
};

export {
  upsertMetaTag,
};

export default GlosariumDetail;
