/**
 * @fileoverview Halaman detail kamus — definisi, relasi, peribahasa, terjemahan
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus } from '../api/apiPublik';
import PanelLipat from '../komponen/PanelLipat';
import HalamanDasar from '../komponen/HalamanDasar';

function KamusDetail() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['kamus-detail', slug],
    queryFn: () => ambilDetailKamus(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <HalamanDasar>
        <p className="secondary-text">Memuat detail...</p>
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

  // Kelompokkan definisi per kelas leksikal
  const definisiPerKelas = {};
  (data.definisi || []).forEach((def) => {
    const kelas = def.lex_class || '-';
    if (!definisiPerKelas[kelas]) {
      definisiPerKelas[kelas] = {
        nama: def.lex_class_name || kelas,
        daftar: [],
      };
    }
    definisiPerKelas[kelas].daftar.push(def);
  });

  const relasiEntries = Object.entries(data.relasi || {});
  const adaPeribahasa = data.peribahasa?.length > 0;
  const adaTerjemahan = data.terjemahan?.length > 0;
  const adaTautan = data.tautan?.length > 0;

  // Info tags
  const infoTags = data.info ? data.info.split(',').map((t) => t.trim()).filter(Boolean) : [];

  return (
    <HalamanDasar>
      {/* Breadcrumb */}
      <nav className="kamus-detail-breadcrumb">
        <Link to="/kamus" className="kamus-detail-breadcrumb-link">Kamus</Link>
        <span className="mx-2">›</span>
        <span className="kamus-detail-breadcrumb-current">{data.frasa}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom utama: definisi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="content-card p-6">
            <h1 className="kamus-detail-heading">
              {data.frasa}
              {data.pelafalan && (
                <span className="kamus-detail-pronunciation">/{data.pelafalan}/</span>
              )}
            </h1>

            {data.frasaAktual && data.frasaAktual !== data.frasa && (
              <p className="kamus-detail-subtext">
                Bentuk baku:{' '}
                <Link
                  to={`/kamus/${encodeURIComponent(data.frasaAktual)}`}
                  className="kamus-detail-actual-link"
                >
                  {data.frasaAktual}
                </Link>
              </p>
            )}

            {/* Label & tag */}
            <div className="flex flex-wrap gap-2 mt-3">
              {data.namaKelasLeksikal && (
                <span className="kamus-detail-tag-blue">
                  {data.namaKelasLeksikal}
                </span>
              )}
              {data.namaTipeFrasa && (
                <span className="kamus-detail-tag-purple">
                  {data.namaTipeFrasa}
                </span>
              )}
              {data.namaSumber && (
                <span className="kamus-detail-tag-green">
                  {data.namaSumber}
                </span>
              )}
              {infoTags.map((tag) => (
                <span key={tag} className="kamus-detail-tag-gray">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Definisi */}
          <div className="content-card p-6">
            <h2 className="kamus-detail-section-title">Definisi</h2>

            {Object.keys(definisiPerKelas).length === 0 && (
              <p className="muted-text text-sm">Belum tersedia.</p>
            )}

            {Object.entries(definisiPerKelas).map(([kelas, group]) => (
              <div key={kelas} className="mb-4 last:mb-0">
                <h3 className="kamus-detail-def-class">
                  {group.nama} <span className="kamus-detail-def-class-code">({kelas})</span>
                </h3>
                <ol className="kamus-detail-def-list">
                  {group.daftar.map((def) => (
                    <li key={def.def_uid} className="text-sm leading-relaxed">
                      {def.discipline_name && (
                        <em className="kamus-detail-def-discipline">[{def.discipline_name}] </em>
                      )}
                      {def.def_text}
                      {def.sample && (
                        <span className="kamus-detail-def-sample">: {def.sample}</span>
                      )}
                      {def.see && (
                        <span className="ml-2">
                          →{' '}
                          <Link
                            to={`/kamus/${encodeURIComponent(def.see)}`}
                            className="link-action"
                          >
                            {def.see}
                          </Link>
                        </span>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>

          {/* Info tambahan: etimologi, catatan */}
          {(data.etimologi || data.catatan || data.kataDasar?.length > 0) && (
            <div className="content-card p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.kataDasar?.length > 0 && (
                  <div>
                    <h3 className="kamus-detail-info-label">Kata Dasar</h3>
                    <div className="flex flex-wrap gap-1">
                      {data.kataDasar.map((kd) => (
                        <Link
                          key={kd}
                          to={`/kamus/${encodeURIComponent(kd)}`}
                          className="kamus-detail-info-link"
                        >
                          {kd}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {data.etimologi && (
                  <div>
                    <h3 className="kamus-detail-info-label">Etimologi</h3>
                    <p className="kamus-detail-info-text">{data.etimologi}</p>
                  </div>
                )}
                {data.catatan && (
                  <div>
                    <h3 className="kamus-detail-info-label">Catatan</h3>
                    <p className="kamus-detail-info-text">{data.catatan}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: relasi, peribahasa, terjemahan, tautan */}
        <div className="space-y-4">
          {/* Kata Terkait */}
          {relasiEntries.length > 0 && (
            <PanelLipat
              judul="Kata Terkait"
              jumlah={relasiEntries.reduce((sum, [, v]) => sum + v.daftar.length, 0)}
              terbukaAwal={true}
            >
              <div className="space-y-3">
                {relasiEntries.map(([tipe, group]) => (
                  <div key={tipe}>
                    <h4 className="kamus-detail-relation-type">{group.nama}</h4>
                    <div className="flex flex-wrap gap-1">
                      {group.daftar.map((kata) => (
                        <Link
                          key={kata}
                          to={`/kamus/${encodeURIComponent(kata)}`}
                          className="kamus-detail-relation-link"
                        >
                          {kata}
                        </Link>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PanelLipat>
          )}

          {/* Peribahasa */}
          {adaPeribahasa && (
            <PanelLipat judul="Peribahasa" jumlah={data.peribahasa.length}>
              <ul className="space-y-2">
                {data.peribahasa.map((p) => (
                  <li key={p.prv_uid} className="text-sm">
                    <p className="kamus-detail-proverb-text">{p.proverb}</p>
                    {p.meaning && <p className="kamus-detail-proverb-meaning">{p.meaning}</p>}
                  </li>
                ))}
              </ul>
            </PanelLipat>
          )}

          {/* Terjemahan */}
          {adaTerjemahan && (
            <PanelLipat judul="Terjemahan" jumlah={data.terjemahan.length}>
              <ul className="space-y-1 text-sm">
                {data.terjemahan.map((t, i) => (
                  <li key={i} className="kamus-detail-translation">
                    {t.translation}
                    {t.ref_source_name && (
                      <span className="kamus-detail-translation-source">({t.ref_source_name})</span>
                    )}
                  </li>
                ))}
              </ul>
            </PanelLipat>
          )}

          {/* Tautan Luar */}
          {adaTautan && (
            <PanelLipat judul="Tautan Luar" jumlah={data.tautan.length}>
              <ul className="space-y-1 text-sm">
                {data.tautan.map((t) => (
                  <li key={t.ext_uid}>
                    <a
                      href={t.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="link-action"
                    >
                      {t.label || t.url}
                    </a>
                  </li>
                ))}
              </ul>
            </PanelLipat>
          )}
        </div>
      </div>
    </HalamanDasar>
  );
}

export default KamusDetail;
