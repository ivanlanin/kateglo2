/**
 * @fileoverview Halaman detail tesaurus — sinonim, antonim, turunan, gabungan, berkaitan
 */

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailTesaurus } from '../api/apiPublik';
import HalamanDasar from '../komponen/HalamanDasar';

function DaftarKata({ judul, daftar }) {
  if (!daftar || daftar.length === 0) return null;
  return (
    <div className="mb-4">
      <h3 className="section-heading">{judul}</h3>
      <div className="flex flex-wrap gap-1">
        {daftar.map((kata) => (
          <Link
            key={kata}
            to={`/tesaurus/${encodeURIComponent(kata)}`}
            className="kamus-detail-relation-link"
          >
            {kata}
          </Link>
        ))}
      </div>
    </div>
  );
}

function TesaurusDetail() {
  const { kata } = useParams();

  useEffect(() => {
    document.title = kata
      ? `${decodeURIComponent(kata)} — Tesaurus — Kateglo`
      : 'Tesaurus — Kateglo';
  }, [kata]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tesaurus-detail', kata],
    queryFn: () => ambilDetailTesaurus(kata),
    enabled: Boolean(kata),
  });

  if (isLoading) {
    return (
      <HalamanDasar>
        <p className="secondary-text">Memuat detail …</p>
      </HalamanDasar>
    );
  }

  if (isError || !data) {
    return (
      <HalamanDasar>
        <p className="error-text">Entri tesaurus tidak ditemukan.</p>
        <Link to="/tesaurus" className="link-action text-sm mt-2 inline-block">
          ← Kembali ke pencarian
        </Link>
      </HalamanDasar>
    );
  }

  return (
    <HalamanDasar>
      {/* Breadcrumb */}
      <nav className="kamus-detail-breadcrumb">
        <Link to="/tesaurus" className="kamus-detail-breadcrumb-link">Tesaurus</Link>
        <span className="mx-2">›</span>
        <span className="kamus-detail-breadcrumb-current">{data.lema}</span>
      </nav>

      <div className="content-card p-6">
        <h1 className="kamus-detail-heading mb-4">
          {data.lema}
        </h1>

        <div className="mb-2">
          <Link
            to={`/kamus/detail/${encodeURIComponent(data.lema)}`}
            className="link-action text-sm"
          >
            Lihat di Kamus →
          </Link>
        </div>

        <DaftarKata judul="Sinonim" daftar={data.sinonim} />
        <DaftarKata judul="Antonim" daftar={data.antonim} />
        <DaftarKata judul="Turunan" daftar={data.turunan} />
        <DaftarKata judul="Gabungan" daftar={data.gabungan} />
        <DaftarKata judul="Berkaitan" daftar={data.berkaitan} />
      </div>
    </HalamanDasar>
  );
}

export default TesaurusDetail;
