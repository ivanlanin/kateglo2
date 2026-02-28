/**
 * @fileoverview Halaman Sumber — daftar sumber glosarium Kateglo
 */

import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import ReactMarkdown from 'react-markdown';
import { ambilDaftarSumber } from '../../api/apiPublik';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { QueryFeedback } from '../../komponen/publik/StatusKonten';
import { buatSlug } from '../../utils/paramUtils';

function Sumber() {
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
        <div className="space-y-6">
          {sumberList.map((item) => (
            <div key={item.id} className="space-y-1">
              <h2 className="font-semibold">
                <Link
                  to={`/glosarium/sumber/${encodeURIComponent(item.slug || buatSlug(item.nama))}`}
                  className="link-action"
                >
                  {item.nama}
                </Link>
              </h2>
              {item.keterangan && (
                <div className="muted-text">
                  <ReactMarkdown>{item.keterangan}</ReactMarkdown>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && sumberList?.length === 0 && (
        <p className="muted-text">Belum ada sumber yang tersedia.</p>
      )}
    </HalamanDasar>
  );
}

export default Sumber;
