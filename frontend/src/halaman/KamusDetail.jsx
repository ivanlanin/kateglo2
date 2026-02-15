/**
 * @fileoverview Halaman detail kamus — makna, contoh, sublema, terjemahan
 */

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus } from '../api/apiPublik';
import PanelLipat from '../komponen/PanelLipat';
import HalamanDasar from '../komponen/HalamanDasar';

function KamusDetail() {
  const { entri } = useParams();

  useEffect(() => {
    document.title = entri
      ? `${decodeURIComponent(entri)} — Kamus — Kateglo`
      : 'Kamus — Kateglo';
  }, [entri]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['kamus-detail', entri],
    queryFn: () => ambilDetailKamus(entri),
    enabled: Boolean(entri),
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
        <p className="error-text">Entri tidak ditemukan.</p>
        <Link to="/kamus" className="link-action text-sm mt-2 inline-block">
          ← Kembali ke pencarian
        </Link>
      </HalamanDasar>
    );
  }

  // Jika ini rujukan, tampilkan redirect
  if (data.rujukan) {
    return (
      <HalamanDasar>
        <nav className="kamus-detail-breadcrumb">
          <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
          <span className="mx-2">›</span>
          <span className="kamus-detail-breadcrumb-current">{data.lema}</span>
        </nav>
        <div className="content-card p-6">
          <h1 className="kamus-detail-heading">{data.lema}</h1>
          <p className="mt-2">
            → Lihat{' '}
            <Link
              to={`/kamus/detail/${encodeURIComponent(data.lema_rujuk)}`}
              className="link-action font-semibold"
            >
              {data.lema_rujuk}
            </Link>
          </p>
        </div>
      </HalamanDasar>
    );
  }

  // Kelompokkan makna per kelas kata
  const maknaPerKelas = {};
  (data.makna || []).forEach((m) => {
    const kelas = m.kelas_kata || '-';
    if (!maknaPerKelas[kelas]) {
      maknaPerKelas[kelas] = [];
    }
    maknaPerKelas[kelas].push(m);
  });

  const sublemaEntries = Object.entries(data.sublema || {});
  const adaTerjemahan = data.terjemahan?.length > 0;

  return (
    <HalamanDasar>
      {/* Breadcrumb */}
      <nav className="kamus-detail-breadcrumb">
        <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
        <span className="mx-2">›</span>
        {data.induk && (
          <>
            <Link
              to={`/kamus/detail/${encodeURIComponent(data.induk.lema)}`}
              className="kamus-detail-breadcrumb-link"
            >
              {data.induk.lema}
            </Link>
            <span className="mx-2">›</span>
          </>
        )}
        <span className="kamus-detail-breadcrumb-current">{data.lema}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom utama: makna */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="content-card p-6">
            <h1 className="kamus-detail-heading">
              {data.lema}
              {data.lafal && (
                <span className="kamus-detail-pronunciation">/{data.lafal}/</span>
              )}
            </h1>

            {data.pemenggalan && data.pemenggalan !== data.lema && (
              <p className="kamus-detail-subtext">
                {data.pemenggalan}
              </p>
            )}

            {/* Label jenis */}
            <div className="flex flex-wrap gap-2 mt-3">
              {data.jenis && data.jenis !== 'dasar' && (
                <span className="kamus-detail-tag-purple">
                  {data.jenis}
                </span>
              )}
              {data.varian && (
                <span className="kamus-detail-tag-gray">
                  varian: {data.varian}
                </span>
              )}
            </div>
          </div>

          {/* Makna */}
          <div className="content-card p-6">
            <h2 className="kamus-detail-section-title">Makna</h2>

            {Object.keys(maknaPerKelas).length === 0 && (
              <p className="muted-text text-sm">Belum tersedia.</p>
            )}

            {Object.entries(maknaPerKelas).map(([kelas, daftarMakna]) => (
              <div key={kelas} className="mb-4 last:mb-0">
                {kelas !== '-' && (
                  <h3 className="kamus-detail-def-class">{kelas}</h3>
                )}
                <ol className="kamus-detail-def-list">
                  {daftarMakna.map((m) => (
                    <li key={m.id} className="text-sm leading-relaxed">
                      {m.bidang && (
                        <em className="kamus-detail-def-discipline">[{m.bidang}] </em>
                      )}
                      {m.ragam && (
                        <em className="kamus-detail-def-discipline">{m.ragam} </em>
                      )}
                      {m.kiasan === 1 && (
                        <em className="kamus-detail-def-discipline">ki </em>
                      )}
                      <span dangerouslySetInnerHTML={{ __html: m.makna }} />
                      {m.tipe_penyingkat && (
                        <span className="tag-subtle ml-1">{m.tipe_penyingkat}</span>
                      )}
                      {m.ilmiah && (
                        <span className="kamus-detail-def-sample"> [{m.ilmiah}]</span>
                      )}
                      {m.kimia && (
                        <span className="kamus-detail-def-sample"> ({m.kimia})</span>
                      )}
                      {/* Contoh */}
                      {m.contoh?.length > 0 && (
                        <ul className="mt-1 ml-4">
                          {m.contoh.map((c) => (
                            <li key={c.id} className="kamus-detail-def-sample">
                              <span dangerouslySetInnerHTML={{ __html: c.contoh }} />
                              {c.makna_contoh && (
                                <span> — {c.makna_contoh}</span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: sublema, terjemahan */}
        <div className="space-y-4">
          {/* Sublema per jenis */}
          {sublemaEntries.map(([jenis, daftar]) => (
            <PanelLipat
              key={jenis}
              judul={jenis.charAt(0).toUpperCase() + jenis.slice(1)}
              jumlah={daftar.length}
              terbukaAwal={true}
            >
              <div className="flex flex-wrap gap-1">
                {daftar.map((s) => (
                  <Link
                    key={s.id}
                    to={`/kamus/detail/${encodeURIComponent(s.lema)}`}
                    className="kamus-detail-relation-link"
                  >
                    {s.lema}
                  </Link>
                ))}
              </div>
            </PanelLipat>
          ))}

          {/* Terjemahan */}
          {adaTerjemahan && (
            <PanelLipat judul="Terjemahan" jumlah={data.terjemahan.length}>
              <ul className="space-y-1 text-sm">
                {data.terjemahan.map((t, i) => (
                  <li key={i} className="kamus-detail-translation">
                    {t.translation}
                    {t.ref_source && (
                      <span className="kamus-detail-translation-source">({t.ref_source})</span>
                    )}
                  </li>
                ))}
              </ul>
            </PanelLipat>
          )}

          {/* Link ke Tesaurus */}
          <div className="content-card p-4">
            <Link
              to={`/tesaurus/${encodeURIComponent(data.lema)}`}
              className="link-action text-sm"
            >
              Lihat di Tesaurus →
            </Link>
          </div>
        </div>
      </div>
    </HalamanDasar>
  );
}

export default KamusDetail;
