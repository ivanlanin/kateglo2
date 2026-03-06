/**
 * @fileoverview Halaman Sumber — daftar sumber referensi glosarium Kateglo
 */

import ReactMarkdown from 'react-markdown';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { ambilDaftarSumber } from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';

function Sumber() {
  const location = useLocation();
  const anchorAktif = decodeURIComponent((location.hash || '').replace(/^#/, '')).trim().toLowerCase();

  const { data: sumberList, isLoading, isError, error } = useQuery({
    queryKey: ['glosarium-sumber'],
    queryFn: ambilDaftarSumber,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <HalamanDasar
      judul="Sumber"
      deskripsi="Daftar sumber referensi glosarium Kateglo"
    >
      <QueryFeedback
        isLoading={isLoading}
        isError={isError}
        error={error}
        loadingText="Memuat data …"
        errorText="Gagal mengambil data."
      />

      {!isLoading && !isError && sumberList?.length > 0 && (
        <ol className="kamus-detail-def-list">
          {sumberList.map((item, index) => (
            <li
              key={item.id}
              id={item.kode}
              className={`kamus-detail-def-item sumber-anchor-item${anchorAktif && item.kode?.toLowerCase() === anchorAktif ? ' sumber-anchor-item-active' : ''}`}
            >
              <span className="kamus-detail-def-number">{index + 1}.</span>
              <div className="kamus-detail-def-content leading-relaxed">
                <ReactMarkdown components={{ p: ({ children }) => <>{children}</>, a: ({ children, href }) => <a href={href} className="link-action">{children}</a> }}>
                  {item.keterangan || item.nama}
                </ReactMarkdown>
                {item.kode && <> <span className="badge-sumber">{item.kode}</span></>}
              </div>
            </li>
          ))}
        </ol>
      )}

      {!isLoading && !isError && sumberList?.length === 0 && (
        <p className="muted-text">Belum ada sumber yang tersedia.</p>
      )}
    </HalamanDasar>
  );
}

export default Sumber;
