/**
 * @fileoverview Halaman detail kamus — makna, contoh, sublema, tesaurus, glosarium
 */

import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus, ambilKomentarKamus, simpanKomentarKamus, ambilKategoriKamus } from '../../api/apiPublik';
import { useAuth } from '../../context/authContext';
import PanelLipat from '../../komponen/publik/PanelLipat';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import TeksLema from '../../komponen/publik/TeksLema';
import { PesanTidakDitemukan } from '../../komponen/publik/StatusKonten';
import { buatPathDetailKamus } from '../../utils/kamusIndex';
import { formatTanggalKomentar } from '../../utils/formatTanggalKomentar';

/** Konversi markdown ringan (*italic* dan **bold**) ke HTML inline */
function renderMarkdown(teks) {
  if (!teks) return '';
  return teks
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>');
}

function buatPathKategoriKamus(kategori, badge) {
  const nilai = String(badge || '').trim();
  if (!kategori || !nilai) return '/kamus';
  return `/kamus/${encodeURIComponent(kategori)}/${encodeURIComponent(nilai)}`;
}

function formatTitleCase(teks = '') {
  return String(teks)
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((kata) => kata.charAt(0).toUpperCase() + kata.slice(1))
    .join(' ');
}

function normalizeToken(teks = '') {
  return String(teks || '').trim().toLowerCase();
}

function tentukanKategoriJenis(jenis = '') {
  const nilai = String(jenis || '').trim().toLowerCase();
  if (['dasar', 'turunan', 'gabungan'].includes(nilai)) return 'bentuk';
  if (['idiom', 'peribahasa'].includes(nilai)) return 'ekspresi';
  return 'jenis';
}

function bandingkanEntriKamus(a, b) {
  const prioritasLafalA = String(a.lafal || '').trim() ? 1 : 0;
  const prioritasLafalB = String(b.lafal || '').trim() ? 1 : 0;
  if (prioritasLafalA !== prioritasLafalB) return prioritasLafalA - prioritasLafalB;
  if ((a.urutan || 0) !== (b.urutan || 0)) return (a.urutan || 0) - (b.urutan || 0);
  const homonimA = Number.isFinite(Number(a.homonim)) ? Number(a.homonim) : Number.MAX_SAFE_INTEGER;
  const homonimB = Number.isFinite(Number(b.homonim)) ? Number(b.homonim) : Number.MAX_SAFE_INTEGER;
  if (homonimA !== homonimB) return homonimA - homonimB;
  return (a.entri || '').localeCompare((b.entri || ''), 'id');
}

function bandingkanJenisSubentri(jenisA, jenisB, urutanJenisSubentri) {
  const idxA = urutanJenisSubentri.indexOf((jenisA || '').toLowerCase());
  const idxB = urutanJenisSubentri.indexOf((jenisB || '').toLowerCase());

  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
  if (idxA !== -1) return -1;
  if (idxB !== -1) return 1;

  return (jenisA || '').localeCompare((jenisB || ''), 'id');
}

function KamusDetail() {
  const { indeks } = useParams();
  const { isAuthenticated, isLoading: isAuthLoading, loginDenganGoogle } = useAuth();
  const [teksKomentar, setTeksKomentar] = useState('');
  const [isSubmittingKomentar, setIsSubmittingKomentar] = useState(false);
  const [pesanKomentar, setPesanKomentar] = useState('');

  useEffect(() => {
    document.title = indeks
      ? `${decodeURIComponent(indeks)} — Kamus — Kateglo`
      : 'Kamus — Kateglo';
  }, [indeks]);

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['kamus-detail', indeks],
    queryFn: () => ambilDetailKamus(indeks),
    enabled: Boolean(indeks),
  });

  const {
    data: komentarResponse,
    refetch: refetchKomentar,
  } = useQuery({
    queryKey: ['kamus-komentar', indeks, isAuthenticated],
    queryFn: () => ambilKomentarKamus(indeks),
    enabled: Boolean(indeks) && !isAuthLoading,
  });

  const { data: kategoriKamus } = useQuery({
    queryKey: ['kamus-kategori'],
    queryFn: ambilKategoriKamus,
    staleTime: 5 * 60 * 1000,
  });

  const petaKelasKata = (kategoriKamus?.['kelas-kata'] || kategoriKamus?.kelas_kata || []).reduce((acc, item) => {
    const key = normalizeToken(item?.kode);
    if (!key) return acc;
    acc[key] = item?.nama || item?.kode;
    return acc;
  }, {});

  const komentarData = komentarResponse?.data || {};
  const jumlahKomentarAktif = Number(komentarData.activeCount || 0);
  const daftarKomentar = Array.isArray(komentarData.komentar) ? komentarData.komentar : [];

  const handleKirimKomentar = async (event) => {
    event.preventDefault();
    const komentar = teksKomentar.trim();
    if (!komentar) {
      setPesanKomentar('Komentar tidak boleh kosong.');
      return;
    }

    setIsSubmittingKomentar(true);
    setPesanKomentar('');
    try {
      await simpanKomentarKamus(indeks, komentar);
      setTeksKomentar('');
      setPesanKomentar('Komentar tersimpan dan menunggu peninjauan redaksi.');
      if (typeof refetchKomentar === 'function') {
        await refetchKomentar();
      }
    } catch (_error) {
      setPesanKomentar('Gagal menyimpan komentar. Silakan coba lagi.');
    } finally {
      setIsSubmittingKomentar(false);
    }
  };

  if (isLoading) {
    return (
      <HalamanDasar>
        <p className="secondary-text">Memuat detail …</p>
      </HalamanDasar>
    );
  }

  if (isError || !data) {
    const kataCari = decodeURIComponent(indeks || '');
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

  const urutanJenisSubentri = ['turunan', 'gabungan', 'idiom', 'peribahasa', 'varian'];

  const daftarEntriRaw = Array.isArray(data.entri)
    ? data.entri
    : [{
      id: data.id || 'legacy',
      entri: data.entri || data.indeks || decodeURIComponent(indeks || ''),
      indeks: data.indeks || data.entri || decodeURIComponent(indeks || ''),
      homonim: data.homonim ?? null,
      urutan: data.urutan ?? 1,
      jenis: data.jenis || 'dasar',
      pemenggalan: data.pemenggalan || null,
      lafal: data.lafal || null,
      varian: data.varian || null,
      jenis_rujuk: data.jenis_rujuk || null,
      entri_rujuk: data.entri_rujuk || null,
      entri_rujuk_indeks: data.entri_rujuk || null,
      rujukan: Boolean(data.rujukan),
      induk: data.induk || [],
      makna: data.makna || [],
      subentri: data.subentri || {},
    }];

  const daftarEntri = daftarEntriRaw.slice().sort(bandingkanEntriKamus);

  const tesaurusSinonim = data.tesaurus?.sinonim || [];
  const tesaurusAntonim = data.tesaurus?.antonim || [];
  const adaTesaurus = tesaurusSinonim.length > 0 || tesaurusAntonim.length > 0;
  const glosarium = data.glosarium || [];
  const adaSidebar = true;

  const renderDaftarTesaurus = (items) => (
    <>
      {items.map((kata, i) => (
        <span key={`${kata}-${i}`}>
          <Link
            to={buatPathDetailKamus(kata)}
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

  return (
    <HalamanDasar>
      <div className={adaSidebar ? 'grid grid-cols-1 lg:grid-cols-3 gap-6' : 'block'}>
        {/* Kolom utama: makna */}
        <div className={adaSidebar ? 'lg:col-span-2' : ''}>
          {daftarEntri.map((entriItem) => {
            const maknaPerKelas = {};
            (entriItem.makna || []).forEach((m) => {
              const kelas = m.kelas_kata || '-';
              if (!maknaPerKelas[kelas]) {
                maknaPerKelas[kelas] = [];
              }
              maknaPerKelas[kelas].push(m);
            });

            const subentriEntries = Object.entries(entriItem.subentri || {}).sort(([jenisA], [jenisB]) =>
              bandingkanJenisSubentri(jenisA, jenisB, urutanJenisSubentri));

            const rantaiHeading = [...(entriItem.induk || []), { id: `current-${entriItem.id}`, entri: entriItem.entri, indeks: entriItem.indeks, current: true }];

            return (
              <section key={entriItem.id} className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
                <div className="kamus-detail-heading-row">
                  <div className="min-w-0">
                    <h1 className="kamus-detail-heading">
                      <span className="kamus-detail-heading-main">
                        {rantaiHeading.map((item, index) => (
                          <Fragment key={`${item.id}-${index}`}>
                            {item.current ? (
                              <span><TeksLema lema={item.entri} /></span>
                            ) : (
                              <Link
                                to={buatPathDetailKamus(item.indeks || item.entri)}
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
                      {entriItem.lafal && (
                        <span className="kamus-detail-heading-pronunciation">/<TeksLema lema={entriItem.lafal} />/</span>
                      )}
                      {entriItem.pemenggalan && entriItem.pemenggalan !== entriItem.entri && (
                        <span className="kamus-detail-heading-split">(<TeksLema lema={entriItem.pemenggalan} />)</span>
                      )}
                    </h1>
                    {entriItem.jenis === 'varian' ? (
                      <span className="kamus-detail-tag-purple mt-1">
                        {formatTitleCase(entriItem.jenis)}
                      </span>
                    ) : (
                      <Link
                        to={buatPathKategoriKamus(tentukanKategoriJenis(entriItem.jenis || 'dasar'), entriItem.jenis || 'dasar')}
                        className="kamus-detail-tag-purple mt-1"
                      >
                        {formatTitleCase(entriItem.jenis || 'dasar')}
                      </Link>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {entriItem.varian && (
                    <span className="kamus-detail-tag-gray">varian: {entriItem.varian}</span>
                  )}
                </div>

                {entriItem.rujukan ? (
                  <p className="mt-4">
                    → Lihat{' '}
                    <Link to={buatPathDetailKamus(entriItem.entri_rujuk_indeks || entriItem.entri_rujuk)} className="link-action font-semibold">
                      <TeksLema lema={entriItem.entri_rujuk} />
                    </Link>
                  </p>
                ) : (
                  <div className="mt-6">
                    {Object.keys(maknaPerKelas).length === 0 && (
                      <p className="muted-text text-sm">Belum tersedia.</p>
                    )}

                    {Object.entries(maknaPerKelas).map(([kelas, daftarMakna]) => (
                      <div key={kelas} className="mb-4 last:mb-0">
                        {kelas !== '-' && (
                          <div className="kamus-detail-subentry-heading-row">
                            <h3 className="kamus-detail-def-class mb-0">
                              {formatTitleCase(petaKelasKata[normalizeToken(kelas)] || kelas)}{' '}
                              <span className="kamus-count-badge" data-count={daftarMakna.length}>
                                ({daftarMakna.length})
                              </span>
                            </h3>
                          </div>
                        )}
                        <div className="kamus-detail-def-content leading-relaxed">
                          {daftarMakna.map((m, indexMakna) => (
                            <Fragment key={m.id}>
                              {daftarMakna.length > 1 && <span>({indexMakna + 1}) </span>}
                              {m.bidang && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('bidang', m.bidang)}
                                    className="kamus-badge kamus-badge-bidang"
                                  >
                                    {m.bidang}
                                  </Link>{' '}
                                </>
                              )}
                              {m.ragam && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('ragam', m.ragam)}
                                    className="kamus-badge kamus-badge-ragam"
                                  >
                                    {m.ragam}
                                  </Link>{' '}
                                </>
                              )}
                              {m.ragam_varian && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('ragam', m.ragam_varian)}
                                    className="kamus-badge kamus-badge-ragam"
                                  >
                                    {m.ragam_varian}
                                  </Link>{' '}
                                </>
                              )}
                              {m.kiasan === 1 && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('ragam', 'kiasan')}
                                    className="kamus-badge kamus-badge-kiasan"
                                  >
                                    kiasan
                                  </Link>{' '}
                                </>
                              )}
                              {m.bahasa && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('bahasa', m.bahasa)}
                                    className="kamus-badge kamus-badge-bahasa"
                                  >
                                    {m.bahasa}
                                  </Link>{' '}
                                </>
                              )}
                              {m.tipe_penyingkat && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('jenis', m.tipe_penyingkat)}
                                    className="kamus-badge kamus-badge-penyingkat"
                                  >
                                    {m.tipe_penyingkat}
                                  </Link>{' '}
                                </>
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
                              {indexMakna < daftarMakna.length - 1 && <span>; </span>}
                            </Fragment>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {subentriEntries.length > 0 && (
                  <div className="mt-4">
                    {subentriEntries.map(([jenis, daftar]) => (
                      <div key={jenis} className="kamus-detail-subentry-group">
                        <div className="kamus-detail-subentry-heading-row">
                          <h3 className="kamus-detail-def-class mb-0">
                            {formatJenisSubentri(jenis)}{' '}
                            <span className="kamus-count-badge" data-count={daftar.length}>
                              ({daftar.length})
                            </span>
                          </h3>
                        </div>
                        <div className="kamus-detail-subentry-flow">
                          {daftar.map((s, i) => (
                            <span key={s.id}>
                              {jenis === 'varian' ? (
                                <span><TeksLema lema={s.entri} /></span>
                              ) : (
                                <Link to={buatPathDetailKamus(s.indeks || s.entri)} className="kamus-detail-subentry-link">
                                  <TeksLema lema={s.entri} />
                                </Link>
                              )}
                              {i < daftar.length - 1 && <span className="secondary-text">; </span>}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>

        {adaSidebar && (
          <div className="space-y-4">
            <PanelLipat judul="Komentar" jumlah={isAuthenticated ? daftarKomentar.length : jumlahKomentarAktif} terbukaAwal={true} aksen={true}>
              {isAuthenticated ? (
                <div className="space-y-3 text-sm">
                  {daftarKomentar.length === 0 ? (
                    <p className="secondary-text">Ingin mengomentari entri ini?</p>
                  ) : (
                    <div className="space-y-3">
                      {daftarKomentar.map((item) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
                          <div className="text-xs secondary-text mb-1 flex items-center justify-between gap-2">
                            <span>{item.pengguna_nama || 'Pengguna'}</span>
                            <span>{formatTanggalKomentar(item.updated_at || item.created_at)}</span>
                          </div>
                          <div className="whitespace-pre-line leading-relaxed">{item.komentar}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <form onSubmit={handleKirimKomentar} className="space-y-2">
                    <textarea
                      value={teksKomentar}
                      onChange={(e) => setTeksKomentar(e.target.value)}
                      rows={4}
                      className="w-full text-sm px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-input dark:text-dark-text"
                      placeholder="Tulis komentar Anda..."
                    />
                    <button
                      type="submit"
                      disabled={isSubmittingKomentar}
                      className="px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
                    >
                      {isSubmittingKomentar ? 'Mengirim…' : 'Kirim'}
                    </button>
                    {pesanKomentar && <p className="secondary-text">{pesanKomentar}</p>}
                  </form>
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  {jumlahKomentarAktif > 0 ? (
                    <p>
                      Ada {jumlahKomentarAktif} komentar pada entri ini. Silakan{' '}
                      <a
                        href="/auth/google"
                        onClick={(event) => {
                          event.preventDefault();
                          loginDenganGoogle(window.location.pathname + window.location.search);
                        }}
                        className="link-action"
                      >
                        masuk dengan akun Google
                      </a>{' '}
                      untuk membaca atau mengirim komentar.
                    </p>
                  ) : (
                    <p>
                      Silakan{' '}
                      <a
                        href="/auth/google"
                        onClick={(event) => {
                          event.preventDefault();
                          loginDenganGoogle(window.location.pathname + window.location.search);
                        }}
                        className="link-action"
                      >
                        masuk dengan akun Google
                      </a>{' '}
                      untuk meninggalkan komentar.
                    </p>
                  )}
                </div>
              )}
            </PanelLipat>

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
export {
  renderMarkdown,
  buatPathKategoriKamus,
  formatTitleCase,
  tentukanKategoriJenis,
  bandingkanEntriKamus,
  bandingkanJenisSubentri,
  formatTanggalKomentar,
};
