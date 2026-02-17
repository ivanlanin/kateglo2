/**
 * @fileoverview Halaman detail kamus — makna, contoh, sublema, tesaurus, glosarium
 */

import { Fragment, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus } from '../../api/apiPublik';
import PanelLipat from '../../komponen/publik/PanelLipat';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import TeksLema from '../../komponen/publik/TeksLema';
import { PesanTidakDitemukan } from '../../komponen/publik/StatusKonten';

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

  const { data, isLoading, isError, error } = useQuery({
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
    const kataCari = decodeURIComponent(entri || '');
    const saran = error?.saran || [];
    return (
      <HalamanDasar>
        <h1 className="kamus-detail-heading">
          <span className="kamus-detail-heading-main">{kataCari}</span>
        </h1>

        <div className="mt-6">
          <PesanTidakDitemukan saran={saran} />
        </div>

        <Link to="/kamus" className="link-action text-sm mt-4 inline-block">
          ← Kembali ke pencarian
        </Link>
      </HalamanDasar>
    );
  }

  // Jika ini rujukan, tampilkan redirect
  if (data.rujukan) {
    return (
      <HalamanDasar>
        <div>
          <h1 className="kamus-detail-heading"><TeksLema lema={data.entri} /></h1>
          <p className="mt-2">
            → Lihat{' '}
            <Link
              to={`/kamus/detail/${encodeURIComponent(data.entri_rujuk)}`}
              className="link-action font-semibold"
            >
              <TeksLema lema={data.entri_rujuk} />
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

  const urutanJenisSubentri = ['turunan', 'gabungan', 'idiom', 'peribahasa'];
  const subentriEntries = Object.entries(data.subentri || {}).sort(([jenisA], [jenisB]) => {
    const idxA = urutanJenisSubentri.indexOf((jenisA || '').toLowerCase());
    const idxB = urutanJenisSubentri.indexOf((jenisB || '').toLowerCase());

    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;

    return (jenisA || '').localeCompare((jenisB || ''), 'id');
  });
  const tesaurusSinonim = data.tesaurus?.sinonim || [];
  const tesaurusAntonim = data.tesaurus?.antonim || [];
  const adaTesaurus = tesaurusSinonim.length > 0 || tesaurusAntonim.length > 0;
  const glosarium = data.glosarium || [];
  const adaSidebar = adaTesaurus || glosarium.length > 0;
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

  const formatJenisSubentri = (jenis = '') => jenis
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');

  const rantaiHeading = [...(data.induk || []), { id: 'current', entri: data.entri, current: true }];

  return (
    <HalamanDasar>
      <div className={adaSidebar ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : 'block'}>
        {/* Kolom utama: makna */}
        <div className={adaSidebar ? 'lg:col-span-2' : ''}>
          <div>
            <div className="kamus-detail-heading-row">
              <h1 className="kamus-detail-heading">
                <span className="kamus-detail-heading-main">
                  {rantaiHeading.map((item, index) => (
                    <Fragment key={`${item.id}-${index}`}>
                      {item.current ? (
                        <span><TeksLema lema={item.entri} /></span>
                      ) : (
                        <Link
                          to={`/kamus/detail/${encodeURIComponent(item.entri)}`}
                          className="kamus-detail-heading-chain-link"
                        >
                          <TeksLema lema={item.entri} />
                        </Link>
                      )}
                      {index < rantaiHeading.length - 1 && (
                        <span className="kamus-detail-heading-chain-separator">{' > '}</span>
                      )}
                    </Fragment>
                  ))}
                </span>
                {data.lafal && (
                  <span className="kamus-detail-heading-pronunciation">/<TeksLema lema={data.lafal} />/</span>
                )}
                {data.pemenggalan && data.pemenggalan !== data.entri && (
                  <span className="kamus-detail-heading-split">(<TeksLema lema={data.pemenggalan} />)</span>
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
                            <span className="kamus-badge kamus-badge-kiasan">kiasan</span>
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

            {subentriEntries.length > 0 && (
              <div className="mt-8">
                {subentriEntries.map(([jenis, daftar]) => (
                  <div key={jenis} className="kamus-detail-subentry-group">
                    <div className="kamus-detail-subentry-heading-row">
                      <h2 className="kamus-detail-def-class mb-0">
                        {formatJenisSubentri(jenis)}
                      </h2>
                      <span className="kamus-detail-tag-gray">{daftar.length}</span>
                    </div>
                    <div className="kamus-detail-subentry-flow">
                      {daftar.map((s, i) => (
                        <span key={s.id}>
                          <Link
                            to={`/kamus/detail/${encodeURIComponent(s.entri)}`}
                            className="kamus-detail-subentry-link"
                          >
                            <TeksLema lema={s.entri} />
                          </Link>
                          {i < daftar.length - 1 && <span className="secondary-text">; </span>}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {adaSidebar && (
          <div className="space-y-4">
            {adaTesaurus && (
              <PanelLipat judul="Tesaurus" jumlah={tesaurusSinonim.length + tesaurusAntonim.length} terbukaAwal={true} aksen={true}>
                {tesaurusSinonim.length > 0 && tesaurusAntonim.length > 0 ? (
                  <ul className="kamus-detail-thesaurus-list">
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
                    <span key={`${item.indonesia}-${item.asing}-${i}`}>
                      <span>{item.indonesia}</span>
                      {item.asing && (
                        <>
                          <span> (</span>
                          <em>{item.asing}</em>
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
        )}
      </div>
    </HalamanDasar>
  );
}

export default KamusDetail;
