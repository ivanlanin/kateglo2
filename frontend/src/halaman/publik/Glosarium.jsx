/**
 * @fileoverview Halaman Glosarium — browse dan cari istilah teknis bilingual
 */

import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  cariGlosarium,
  ambilGlosariumPerBidang,
  ambilGlosariumPerSumber,
  ambilDaftarBidang,
  ambilDaftarSumber,
} from '../../api/apiPublik';
import Paginasi from '../../komponen/bersama/Paginasi';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { EmptyResultText, QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/paramUtils';
import {
  buildMetaBidangGlosarium,
  buildMetaBrowseGlosarium,
  buildMetaPencarianGlosarium,
  buildMetaSumberGlosarium,
} from '../../utils/metaUtils';

function Glosarium() {
  const { kata, bidang, sumber } = useParams();
  const [cursorState, setCursorState] = useState({
    cursor: null,
    direction: 'next',
    lastPage: false,
    page: 1,
  });
  const limit = 100;

  useEffect(() => {
    setCursorState({ cursor: null, direction: 'next', lastPage: false, page: 1 });
  }, [kata, bidang, sumber]);

  const sedangMencari = Boolean(kata || bidang || sumber);
  const modeCariKata = Boolean(kata);

  const { data: bidangList } = useQuery({
    queryKey: ['glosarium-bidang'],
    queryFn: ambilDaftarBidang,
    staleTime: 5 * 60 * 1000,
  });

  const { data: sumberList } = useQuery({
    queryKey: ['glosarium-sumber'],
    queryFn: ambilDaftarSumber,
    staleTime: 5 * 60 * 1000,
  });

  const queryFn = () => {
    const opts = {
      limit,
      cursor: cursorState.cursor,
      direction: cursorState.direction,
      lastPage: cursorState.lastPage,
    };
    if (kata) return cariGlosarium(kata, opts);
    if (bidang) return ambilGlosariumPerBidang(bidang, opts);
    if (sumber) return ambilGlosariumPerSumber(sumber, opts);
    return Promise.resolve({ data: [], total: 0, pageInfo: { hasPrev: false, hasNext: false } });
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      'glosarium',
      kata || '',
      bidang || '',
      sumber || '',
      cursorState.cursor,
      cursorState.direction,
      cursorState.lastPage,
    ],
    queryFn,
    enabled: sedangMencari,
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

  const metaHalaman = modeCariKata
    ? buildMetaPencarianGlosarium(kata)
    : bidang
      ? buildMetaBidangGlosarium(bidang)
      : sumber
        ? buildMetaSumberGlosarium(sumber)
        : buildMetaBrowseGlosarium();

  return (
    <HalamanDasar judul={metaHalaman.judul} deskripsi={metaHalaman.deskripsi}>

      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Mencari data …"
        errorText="Gagal mengambil data."
      />

      {!sedangMencari && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {bidangList?.length > 0 && (
            <div className="beranda-feature-card text-center">
              <h3 className="beranda-info-title">Bidang</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {bidangList.map((b) => (
                  <Link
                    key={b.bidang}
                    to={`/glosarium/bidang/${encodeURIComponent(b.bidang)}`}
                    className="beranda-tag-link"
                  >
                    {b.bidang}
                  </Link>
                ))}
              </div>
            </div>
          )}
          {sumberList?.length > 0 && (
            <div className="beranda-feature-card text-center">
              <h3 className="beranda-info-title">Sumber</h3>
              <div className="flex flex-wrap justify-center gap-2">
                {sumberList.map((s) => (
                  <Link
                    key={s.sumber}
                    to={`/glosarium/sumber/${encodeURIComponent(s.sumber)}`}
                    className="beranda-tag-link"
                  >
                    {s.sumber}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {sedangMencari && !isLoading && !isError && (
        <>
          {results.length === 0 && <EmptyResultText text="Tidak ada entri glosarium yang ditemukan." />}

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
              <div className="glosarium-result-grid">
                {results.map((item) => (
                  <div key={item.id} className="glosarium-result-row">
                    <Link
                      to={buatPathDetailKamus(item.indonesia)}
                      className="kamus-kategori-grid-link"
                    >
                      {item.indonesia}
                    </Link>
                    {item.asing && <span className="glosarium-result-original"> ({item.asing})</span>}
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

export default Glosarium;
