/**
 * @fileoverview Halaman detail kamus — makna, contoh, sublema, tesaurus, glosarium
 */

import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus } from '../api/apiPublik';
import PanelLipat from '../komponen/PanelLipat';
import HalamanDasar from '../komponen/HalamanDasar';

/** Konversi markdown ringan (*italic* dan **bold**) ke HTML inline */
function renderMarkdown(teks) {
  if (!teks) return '';
  return teks
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

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
        <div>
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
  const tesaurusSinonim = data.tesaurus?.sinonim || [];
  const tesaurusAntonim = data.tesaurus?.antonim || [];
  const adaTesaurus = tesaurusSinonim.length > 0 || tesaurusAntonim.length > 0;
  const glosarium = data.glosarium || [];
  const tampilNomorMakna = (data.makna || []).length > 1;
  let nomorMakna = 0;

  const renderDaftarTesaurus = (items) => (
    <>
      {items.map((kata, i) => (
        <span key={`${kata}-${i}`}>
          <Link
            to={`/kamus/detail/${encodeURIComponent(kata)}`}
            className="kamus-detail-relation-link"
          >
            {kata}
          </Link>
          {i < items.length - 1 && <span className="secondary-text">; </span>}
        </span>
      ))}
    </>
  );

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
        <div className="lg:col-span-2">
          <div>
            <div className="kamus-detail-heading-row">
              <h1 className="kamus-detail-heading">
                <span className="kamus-detail-heading-main">{data.lema}</span>
                {data.lafal && (
                  <span className="kamus-detail-heading-pronunciation">/{data.lafal}/</span>
                )}
                {data.pemenggalan && data.pemenggalan !== data.lema && (
                  <span className="kamus-detail-heading-split">({data.pemenggalan})</span>
                )}
              </h1>

              {data.jenis && data.jenis !== 'dasar' && (
                <span className="kamus-detail-tag-purple">
                  {data.jenis}
                </span>
              )}
            </div>

            {/* Label jenis */}
            <div className="flex flex-wrap gap-2 mt-3">
              {data.varian && (
                <span className="kamus-detail-tag-gray">
                  varian: {data.varian}
                </span>
              )}
            </div>

            <div className="mt-6">
              {Object.keys(maknaPerKelas).length === 0 && (
                <p className="muted-text text-sm">Belum tersedia.</p>
              )}

              {Object.entries(maknaPerKelas).map(([kelas, daftarMakna]) => (
                <div key={kelas} className="mb-4 last:mb-0">
                  {kelas !== '-' && (
                    <h2 className="kamus-detail-def-class">{kelas}</h2>
                  )}
                  <ol className="kamus-detail-def-list">
                    {daftarMakna.map((m) => (
                      <li key={m.id} className="kamus-detail-def-item">
                        {tampilNomorMakna && (
                          <span className="kamus-detail-def-number">{++nomorMakna}.</span>
                        )}
                        <span className="kamus-detail-def-content">
                          {/* Badge label — semua ditampilkan di depan definisi */}
                          {m.bidang && (
                            <span className="kamus-badge kamus-badge-bidang">{m.bidang}</span>
                          )}
                          {m.ragam && (
                            <span className="kamus-badge kamus-badge-ragam">{m.ragam}</span>
                          )}
                          {m.ragam_varian && (
                            <span className="kamus-badge kamus-badge-ragam">{m.ragam_varian}</span>
                          )}
                          {m.kiasan === 1 && (
                            <span className="kamus-badge kamus-badge-kiasan">ki</span>
                          )}
                          {m.bahasa && (
                            <span className="kamus-badge kamus-badge-bahasa">{m.bahasa}</span>
                          )}
                          {m.tipe_penyingkat && (
                            <span className="kamus-badge kamus-badge-penyingkat">{m.tipe_penyingkat}</span>
                          )}
                          <span dangerouslySetInnerHTML={{ __html: renderMarkdown(m.makna) }} />
                          {(m.ilmiah || m.kimia) && (
                            <span className="kamus-detail-def-extra">
                              ; {m.ilmiah && <em>{m.ilmiah}</em>}
                              {m.ilmiah && m.kimia && '; '}
                              {m.kimia && <span dangerouslySetInnerHTML={{ __html: m.kimia }} />}
                            </span>
                          )}
                          {m.contoh?.length > 0 && (
                            <span className="kamus-detail-def-sample">: {m.contoh.map((c, i) => (
                              <span key={c.id}>
                                <span dangerouslySetInnerHTML={{ __html: renderMarkdown(c.contoh) }} />
                                {c.makna_contoh && <span> — {c.makna_contoh}</span>}
                                {i < m.contoh.length - 1 && <span>; </span>}
                              </span>
                            ))}</span>
                          )}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Sidebar: sublema, tesaurus, glosarium */}
        <div className="space-y-4">
          {/* Sublema per jenis */}
          {sublemaEntries.map(([jenis, daftar]) => (
            <PanelLipat
              key={jenis}
              judul={jenis.charAt(0).toUpperCase() + jenis.slice(1)}
              jumlah={daftar.length}
              terbukaAwal={true}
              aksen={true}
            >
              <div className="flex flex-wrap gap-1">
                {daftar.map((s, i) => (
                  <span key={s.id}>
                    <Link
                      to={`/kamus/detail/${encodeURIComponent(s.lema)}`}
                      className="kamus-detail-relation-link"
                    >
                      {s.lema}
                    </Link>
                    {i < daftar.length - 1 && <span className="secondary-text">;</span>}
                  </span>
                ))}
              </div>
            </PanelLipat>
          ))}

          {adaTesaurus && (
            <PanelLipat judul="Tesaurus" jumlah={tesaurusSinonim.length + tesaurusAntonim.length} terbukaAwal={true} aksen={true}>
              {tesaurusSinonim.length > 0 && tesaurusAntonim.length > 0 ? (
                <ul className="list-disc list-inside text-sm space-y-1 leading-relaxed">
                  <li>
                    <span className="font-medium">Sinonim:</span>{' '}
                    {renderDaftarTesaurus(tesaurusSinonim)}
                  </li>
                  <li>
                    <span className="font-medium">Antonim:</span>{' '}
                    {renderDaftarTesaurus(tesaurusAntonim)}
                  </li>
                </ul>
              ) : (
                <div className="text-sm space-y-1 leading-relaxed">
                  {tesaurusSinonim.length > 0 && (
                    <div>
                      <span className="font-medium">Sinonim:</span>{' '}
                      {renderDaftarTesaurus(tesaurusSinonim)}
                    </div>
                  )}
                  {tesaurusAntonim.length > 0 && (
                    <div>
                      <span className="font-medium">Antonim:</span>{' '}
                      {renderDaftarTesaurus(tesaurusAntonim)}
                    </div>
                  )}
                </div>
              )}
            </PanelLipat>
          )}

          {glosarium.length > 0 && (
            <PanelLipat judul="Glosarium" jumlah={glosarium.length} terbukaAwal={true} aksen={true}>
              <div className="text-sm leading-relaxed">
                {glosarium.map((item, i) => (
                  <span key={`${item.phrase}-${item.original}-${i}`}>
                    <span>{item.phrase}</span>
                    {item.original && (
                      <>
                        <span> (</span>
                        <em>{item.original}</em>
                        <span>)</span>
                      </>
                    )}
                    {i < glosarium.length - 1 && <span>; </span>}
                  </span>
                ))}
              </div>
            </PanelLipat>
          )}
        </div>
      </div>
    </HalamanDasar>
  );
}

export default KamusDetail;
