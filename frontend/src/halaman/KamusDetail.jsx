/**
 * @fileoverview Halaman detail kamus — definisi, relasi, peribahasa, terjemahan
 */

import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus } from '../api/apiPublik';
import PanelLipat from '../komponen/PanelLipat';

function KamusDetail() {
  const { slug } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['kamus-detail', slug],
    queryFn: () => ambilDetailKamus(slug),
    enabled: Boolean(slug),
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-gray-600">Memuat detail...</p>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="container mx-auto px-4 py-8">
        <p className="text-red-600">Entri tidak ditemukan.</p>
        <Link to="/kamus" className="text-blue-600 hover:underline text-sm mt-2 inline-block">
          ← Kembali ke pencarian
        </Link>
      </div>
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
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="text-sm text-gray-500 mb-4">
        <Link to="/kamus" className="hover:text-blue-600">Kamus</Link>
        <span className="mx-2">›</span>
        <span className="text-gray-900">{data.frasa}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom utama: definisi */}
        <div className="lg:col-span-2 space-y-6">
          {/* Header */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h1 className="text-3xl font-bold text-gray-900">
              {data.frasa}
              {data.pelafalan && (
                <span className="text-lg font-normal text-gray-500 ml-3">/{data.pelafalan}/</span>
              )}
            </h1>

            {data.frasaAktual && data.frasaAktual !== data.frasa && (
              <p className="text-sm text-gray-500 mt-1">
                Bentuk baku:{' '}
                <Link
                  to={`/kamus/${encodeURIComponent(data.frasaAktual)}`}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {data.frasaAktual}
                </Link>
              </p>
            )}

            {/* Label & tag */}
            <div className="flex flex-wrap gap-2 mt-3">
              {data.namaKelasLeksikal && (
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  {data.namaKelasLeksikal}
                </span>
              )}
              {data.namaTipeFrasa && (
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                  {data.namaTipeFrasa}
                </span>
              )}
              {data.namaSumber && (
                <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                  {data.namaSumber}
                </span>
              )}
              {infoTags.map((tag) => (
                <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Definisi */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Definisi</h2>

            {Object.keys(definisiPerKelas).length === 0 && (
              <p className="text-gray-500 text-sm">Belum tersedia.</p>
            )}

            {Object.entries(definisiPerKelas).map(([kelas, group]) => (
              <div key={kelas} className="mb-4 last:mb-0">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {group.nama} <span className="text-gray-400">({kelas})</span>
                </h3>
                <ol className="list-decimal list-inside space-y-2 text-gray-800">
                  {group.daftar.map((def) => (
                    <li key={def.def_uid} className="text-sm leading-relaxed">
                      {def.discipline_name && (
                        <em className="text-gray-500">[{def.discipline_name}] </em>
                      )}
                      {def.def_text}
                      {def.sample && (
                        <span className="text-gray-500 italic ml-1">: {def.sample}</span>
                      )}
                      {def.see && (
                        <span className="ml-2">
                          →{' '}
                          <Link
                            to={`/kamus/${encodeURIComponent(def.see)}`}
                            className="text-blue-600 hover:underline"
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {data.kataDasar?.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Kata Dasar</h3>
                    <div className="flex flex-wrap gap-1">
                      {data.kataDasar.map((kd) => (
                        <Link
                          key={kd}
                          to={`/kamus/${encodeURIComponent(kd)}`}
                          className="text-sm text-blue-700 hover:underline"
                        >
                          {kd}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {data.etimologi && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Etimologi</h3>
                    <p className="text-sm text-gray-700">{data.etimologi}</p>
                  </div>
                )}
                {data.catatan && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-600 mb-1">Catatan</h3>
                    <p className="text-sm text-gray-700">{data.catatan}</p>
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
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">{group.nama}</h4>
                    <div className="flex flex-wrap gap-1">
                      {group.daftar.map((kata) => (
                        <Link
                          key={kata}
                          to={`/kamus/${encodeURIComponent(kata)}`}
                          className="text-sm text-blue-700 hover:underline"
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
                    <p className="font-medium text-gray-800">{p.proverb}</p>
                    {p.meaning && <p className="text-gray-500 mt-0.5">{p.meaning}</p>}
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
                  <li key={i} className="text-gray-700">
                    {t.translation}
                    {t.ref_source_name && (
                      <span className="text-gray-400 ml-1">({t.ref_source_name})</span>
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
                      className="text-blue-600 hover:underline"
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
    </div>
  );
}

export default KamusDetail;
