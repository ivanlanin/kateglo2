/**
 * @fileoverview Halaman detail kamus — makna, contoh, sublema, tesaurus, glosarium
 */

import { Fragment, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus, ambilKomentarKamus, simpanKomentarKamus, ambilKategoriKamus, cariGlosarium } from '../../api/apiPublik';
import { useAuth } from '../../context/authContext';
import CursorNavButton from '../../komponen/publik/CursorNavButton';
import PanelLipat from '../../komponen/publik/PanelLipat';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import { PesanTidakDitemukan } from '../../komponen/publik/StatusKonten';
import { formatLemaHomonim, formatLocalDateTime, parseUtcDate } from '../../utils/formatUtils';
import { buatPathDetailKamus, normalisasiIndeksKamus } from '../../utils/paramUtils';
import { buildMetaDetailKamus } from '../../utils/metaUtils';

const GLOSARIUM_LIMIT = 20;

function upsertMetaTag({ name, property, content }) {
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement('meta');
    if (name) tag.setAttribute('name', name);
    if (property) tag.setAttribute('property', property);
    document.head.appendChild(tag);
  }

  tag.setAttribute('content', content);
}

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

function normalisasiSlugNama(teks = '') {
  return String(teks || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildLabelMap(labels = []) {
  return (labels || []).reduce((acc, item) => {
    const keyKode = normalizeToken(item?.kode);
    const keyNama = normalizeToken(item?.nama);
    const valueNama = String(item?.nama || item?.kode || '').trim();
    if (!valueNama) return acc;
    if (keyKode) {
      acc[keyKode] = valueNama;
    }
    if (keyNama) {
      acc[keyNama] = valueNama;
    }
    return acc;
  }, {});
}

function resolveNamaLabel(nilai, petaLabel = {}) {
  const key = normalizeToken(nilai);
  return petaLabel[key] || String(nilai || '').trim();
}

function buatPathKategoriDariLabel(kategori, nilai, petaLabel = {}) {
  const namaLabel = resolveNamaLabel(nilai, petaLabel);
  return buatPathKategoriKamus(kategori, normalisasiSlugNama(namaLabel || nilai));
}

function tentukanKategoriJenis(jenis = '') {
  const nilai = String(jenis || '').trim().toLowerCase();
  if (['dasar', 'turunan', 'gabungan'].includes(nilai)) return 'bentuk';
  if (['idiom', 'peribahasa'].includes(nilai)) return 'ekspresi';
  if (['terikat', 'prefiks', 'infiks', 'sufiks', 'konfiks', 'klitik', 'prakategorial'].includes(nilai)) return 'bentuk';
  return 'bentuk';
}

function bandingkanEntriKamus(a, b) {
  const homografA = Number.isFinite(Number(a.homograf)) ? Number(a.homograf) : Number.MAX_SAFE_INTEGER;
  const homografB = Number.isFinite(Number(b.homograf)) ? Number(b.homograf) : Number.MAX_SAFE_INTEGER;
  if (homografA !== homografB) return homografA - homografB;
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

function formatInfoWaktuEntri(createdAt, updatedAt, sumber = '') {
  const createdDate = parseUtcDate(createdAt);
  const updatedDate = parseUtcDate(updatedAt);
  const sumberAman = String(sumber || '').trim();

  if (!createdDate && !updatedDate && !sumberAman) return '';

  const parts = [];
  if (createdDate) {
    parts.push(`Dibuat ${formatLocalDateTime(createdDate)}`);
  }

  const shouldShowUpdated =
    Boolean(updatedDate) &&
    (!createdDate || updatedDate.getTime() !== createdDate.getTime());

  if (shouldShowUpdated) {
    parts.push(`Diubah ${formatLocalDateTime(updatedDate)}`);
  }

  if (sumberAman) {
    parts.push(`Sumber ${sumberAman}`);
  }

  return parts.join(' · ');
}

function KamusDetail() {
  const { indeks } = useParams();
  const { isAuthenticated, adalahAdmin, isLoading: isAuthLoading, loginDenganGoogle } = useAuth();
  const [teksKomentar, setTeksKomentar] = useState('');
  const [isSubmittingKomentar, setIsSubmittingKomentar] = useState(false);
  const [pesanKomentar, setPesanKomentar] = useState('');
  const [cursorGlosarium, setCursorGlosarium] = useState(null);
  const [directionGlosarium, setDirectionGlosarium] = useState('next');
  const [navigasiGlosariumAktif, setNavigasiGlosariumAktif] = useState(null);
  const [cursorGlosariumFallback, setCursorGlosariumFallback] = useState(null);
  const [directionGlosariumFallback, setDirectionGlosariumFallback] = useState('next');

  useEffect(() => {
    setCursorGlosarium(null);
    setDirectionGlosarium('next');
    setNavigasiGlosariumAktif(null);
    setCursorGlosariumFallback(null);
    setDirectionGlosariumFallback('next');
  }, [indeks]);

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['kamus-detail', indeks, cursorGlosarium, directionGlosarium],
    queryFn: () => ambilDetailKamus(indeks, {
      glosariumLimit: GLOSARIUM_LIMIT,
      glosariumCursor: cursorGlosarium,
      glosariumDirection: directionGlosarium,
    }),
    enabled: Boolean(indeks),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (!isFetching) {
      setNavigasiGlosariumAktif(null);
    }
  }, [isFetching]);

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

  const { data: glosariumFallbackData, isFetching: isFetchingGlosariumFallback } = useQuery({
    queryKey: ['glosarium-kamus-fallback', indeks, cursorGlosariumFallback, directionGlosariumFallback],
    queryFn: () => cariGlosarium(decodeURIComponent(indeks || ''), {
      limit: GLOSARIUM_LIMIT,
      cursor: cursorGlosariumFallback,
      direction: directionGlosariumFallback,
    }),
    enabled: Boolean(indeks) && !isLoading && (isError || !data),
    staleTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
  });

  useEffect(() => {
    const metaDetail = buildMetaDetailKamus(indeks, data || null);
    const judulDokumen = `${metaDetail.judul} — Kateglo`;
    document.title = judulDokumen;

    upsertMetaTag({ name: 'description', content: metaDetail.deskripsi });
    upsertMetaTag({ property: 'og:title', content: judulDokumen });
    upsertMetaTag({ property: 'og:description', content: metaDetail.deskripsi });
    upsertMetaTag({ name: 'twitter:title', content: judulDokumen });
    upsertMetaTag({ name: 'twitter:description', content: metaDetail.deskripsi });
  }, [indeks, data]);

  const petaKelasKata = buildLabelMap(kategoriKamus?.['kelas-kata'] || kategoriKamus?.kelas_kata || []);
  const petaRagam = buildLabelMap(kategoriKamus?.ragam || []);
  const petaBidang = buildLabelMap(kategoriKamus?.bidang || []);
  const petaBahasa = buildLabelMap(kategoriKamus?.bahasa || []);

  const komentarData = komentarResponse?.data || {};
  const jumlahKomentarAktif = Number(komentarData.activeCount || 0);
  const daftarKomentar = Array.isArray(komentarData.komentar) ? komentarData.komentar : [];
  const daftarKomentarTerurut = daftarKomentar.slice().sort((a, b) => {
    const waktuA = new Date(a.updated_at || a.created_at || 0).getTime() || 0;
    const waktuB = new Date(b.updated_at || b.created_at || 0).getTime() || 0;
    if (waktuA !== waktuB) return waktuB - waktuA;
    return Number(b.id || 0) - Number(a.id || 0);
  });

  const handleKirimKomentar = async (event) => {
    event.preventDefault();
    const komentar = teksKomentar.trim();
    if (!komentar) return;

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

  const notFound = isError || !data;
  const kataCari = decodeURIComponent(indeks || '');
  const saran = error?.saran || [];

  const urutanJenisSubentri = ['turunan', 'gabungan', 'idiom', 'peribahasa', 'varian'];

  const daftarEntriRaw = notFound ? [] : (
    Array.isArray(data.entri)
      ? data.entri
      : [{
        id: data.id || 'legacy',
        entri: data.entri || data.indeks || decodeURIComponent(indeks || ''),
        indeks: data.indeks || data.entri || decodeURIComponent(indeks || ''),
        homograf: data.homograf ?? null,
        homonim: data.homonim ?? null,
        jenis: data.jenis || 'dasar',
        pemenggalan: data.pemenggalan || null,
        lafal: data.lafal || null,
        varian: data.varian || null,
        sumber: data.sumber || null,
        jenis_rujuk: data.jenis_rujuk || null,
        entri_rujuk: data.entri_rujuk || null,
        entri_rujuk_indeks: data.entri_rujuk || null,
        rujukan: Boolean(data.rujukan),
        created_at: data.created_at || null,
        updated_at: data.updated_at || null,
        induk: data.induk || [],
        makna: data.makna || [],
        subentri: data.subentri || {},
      }]
  );

  const daftarEntri = daftarEntriRaw.slice().sort(bandingkanEntriKamus);

  const tesaurusSinonim = data?.tesaurus?.sinonim || [];
  const tesaurusAntonim = data?.tesaurus?.antonim || [];
  const adaTesaurus = tesaurusSinonim.length > 0 || tesaurusAntonim.length > 0;
  const glosarium = notFound
    ? (glosariumFallbackData?.data || [])
    : (Array.isArray(data?.glosarium) ? data.glosarium : (data?.glosarium?.data || []));
  const glosariumPageInfo = notFound
    ? {
      total: Number(glosariumFallbackData?.total || 0),
      hasPrev: Boolean(glosariumFallbackData?.pageInfo?.hasPrev),
      hasNext: Boolean(glosariumFallbackData?.pageInfo?.hasNext),
      prevCursor: glosariumFallbackData?.pageInfo?.prevCursor || null,
      nextCursor: glosariumFallbackData?.pageInfo?.nextCursor || null,
    }
    : {
      total: Number(data?.glosarium_page?.total || glosarium.length || 0),
      hasPrev: Boolean(data?.glosarium_page?.hasPrev),
      hasNext: Boolean(data?.glosarium_page?.hasNext),
      prevCursor: data?.glosarium_page?.prevCursor || null,
      nextCursor: data?.glosarium_page?.nextCursor || null,
    };

  const isFetchingGlosarium = notFound ? isFetchingGlosariumFallback : isFetching;

  const handlePrevGlosarium = () => {
    if (!glosariumPageInfo.prevCursor) return;
    setNavigasiGlosariumAktif('prev');
    if (notFound) {
      setCursorGlosariumFallback(glosariumPageInfo.prevCursor);
      setDirectionGlosariumFallback('prev');
    } else {
      setCursorGlosarium(glosariumPageInfo.prevCursor);
      setDirectionGlosarium('prev');
    }
  };

  const handleNextGlosarium = () => {
    if (!glosariumPageInfo.nextCursor) return;
    setNavigasiGlosariumAktif('next');
    if (notFound) {
      setCursorGlosariumFallback(glosariumPageInfo.nextCursor);
      setDirectionGlosariumFallback('next');
    } else {
      setCursorGlosarium(glosariumPageInfo.nextCursor);
      setDirectionGlosarium('next');
    }
  };


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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom utama: makna */}
        <div className="lg:col-span-2">
          {notFound ? (
            <>
              <h1 className="kamus-detail-heading">
                <span className="kamus-detail-heading-main">{kataCari}</span>
              </h1>
              <div className="mt-6">
                <PesanTidakDitemukan saran={saran} />
              </div>
            </>
          ) : daftarEntri.map((entriItem) => {
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
            const tidakAdaMakna = Object.keys(maknaPerKelas).length === 0;
            const adaSubentri = subentriEntries.length > 0;

            const rantaiHeading = [...(entriItem.induk || []), { id: `current-${entriItem.id}`, entri: entriItem.entri, indeks: entriItem.indeks, current: true }];
            const infoWaktu = formatInfoWaktuEntri(entriItem.created_at, entriItem.updated_at, entriItem.sumber);
            const indeksKamus = normalisasiIndeksKamus(entriItem.indeks || entriItem.entri);
            const tautanRujukanKbbi = indeksKamus
              ? `https://kbbi.kemendikdasmen.go.id/entri/${encodeURIComponent(indeksKamus)}`
              : '';

            return (
              <section key={entriItem.id} className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700 last:border-b-0 last:mb-0 last:pb-0">
                <div className="kamus-detail-heading-row">
                  <div className="min-w-0">
                    <h1 className="kamus-detail-heading">
                      <span className="kamus-detail-heading-main">
                        {rantaiHeading.map((item, index) => (
                          <Fragment key={`${item.id}-${index}`}>
                            {item.current ? (
                              <span>{formatLemaHomonim(item.entri)}</span>
                            ) : (
                              <Link
                                to={buatPathDetailKamus(item.indeks || item.entri)}
                                className="kamus-detail-heading-chain-link"
                              >
                                {formatLemaHomonim(item.entri)}
                              </Link>
                            )}
                            {index < rantaiHeading.length - 1 && (
                              <span className="kamus-detail-heading-chain-separator">{' › '}</span>
                            )}
                          </Fragment>
                        ))}
                      </span>
                      {entriItem.lafal && (
                        <span className="kamus-detail-heading-pronunciation">/{formatLemaHomonim(entriItem.lafal)}/</span>
                      )}
                      {entriItem.pemenggalan && entriItem.pemenggalan !== entriItem.entri && (
                        <span className="kamus-detail-heading-split">({formatLemaHomonim(entriItem.pemenggalan)})</span>
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
                  {(adalahAdmin || tautanRujukanKbbi) && (
                    <div className="kamus-detail-admin-actions">
                      {entriItem.id && (
                        adalahAdmin && (
                        <Link
                          to={`/redaksi/kamus/${entriItem.id}`}
                          className="kamus-detail-edit-link"
                          aria-label="Sunting entri di Redaksi"
                          title="Sunting entri di Redaksi"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                            <path d="M12 20h9" />
                            <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                          </svg>
                          <span className="sr-only">Sunting</span>
                        </Link>
                        )
                      )}
                      {tautanRujukanKbbi && (
                        <a
                          href={tautanRujukanKbbi}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="kamus-detail-reference-link"
                          aria-label="Buka rujukan KBBI di tab baru"
                          title="Buka rujukan KBBI (tab baru)"
                        >
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="h-4 w-4">
                            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
                            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
                          </svg>
                          <span className="sr-only">Rujukan KBBI</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>

                <div className="kamus-detail-entry-tags-row">
                  {entriItem.varian && (
                    <span className="kamus-detail-tag-gray">varian: {entriItem.varian}</span>
                  )}
                </div>

                {entriItem.rujukan ? (
                  <p className="mt-4">
                    → Lihat{' '}
                    <Link to={buatPathDetailKamus(entriItem.entri_rujuk_indeks || entriItem.entri_rujuk)} className="link-action font-semibold">
                      {formatLemaHomonim(entriItem.entri_rujuk)}
                    </Link>
                  </p>
                ) : (
                  <div className="mt-6">
                    {tidakAdaMakna && !adaSubentri && (
                      <p className="muted-text text-sm">Belum tersedia.</p>
                    )}

                    {Object.entries(maknaPerKelas).map(([kelas, daftarMakna]) => (
                      <div key={kelas} className="mb-4 last:mb-0">
                        {kelas !== '-' && (
                          <div className="kamus-detail-subentry-heading-row">
                            <h3 className="kamus-detail-def-class mb-0">
                              <Link
                                to={buatPathKategoriDariLabel('kelas', kelas, petaKelasKata)}
                                className="kamus-detail-def-class-link"
                              >
                                {formatTitleCase(petaKelasKata[normalizeToken(kelas)] || kelas)}
                              </Link>{' '}
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
                                    to={buatPathKategoriDariLabel('bidang', m.bidang, petaBidang)}
                                    className="kamus-badge kamus-badge-bidang"
                                  >
                                    {resolveNamaLabel(m.bidang, petaBidang)}
                                  </Link>{' '}
                                </>
                              )}
                              {m.ragam && (
                                <>
                                  <Link
                                    to={buatPathKategoriDariLabel('ragam', m.ragam, petaRagam)}
                                    className="kamus-badge kamus-badge-ragam"
                                  >
                                    {resolveNamaLabel(m.ragam, petaRagam)}
                                  </Link>{' '}
                                </>
                              )}
                              {m.ragam_varian && (
                                <>
                                  <Link
                                    to={buatPathKategoriDariLabel('ragam', m.ragam_varian, petaRagam)}
                                    className="kamus-badge kamus-badge-ragam"
                                  >
                                    {resolveNamaLabel(m.ragam_varian, petaRagam)}
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
                                    to={buatPathKategoriDariLabel('bahasa', m.bahasa, petaBahasa)}
                                    className="kamus-badge kamus-badge-bahasa"
                                  >
                                    {resolveNamaLabel(m.bahasa, petaBahasa)}
                                  </Link>{' '}
                                </>
                              )}
                              {m.tipe_penyingkat && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('bentuk', m.tipe_penyingkat)}
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
                                <span>{formatLemaHomonim(s.entri)}</span>
                              ) : (
                                <Link to={buatPathDetailKamus(s.indeks || s.entri)} className="kamus-detail-subentry-link">
                                  {formatLemaHomonim(s.entri)}
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

                {infoWaktu && (
                  <p className="kamus-detail-entry-meta">{infoWaktu}</p>
                )}
              </section>
            );
          })}
        </div>

        <div className="space-y-4">
            <PanelLipat judul="Komentar" jumlah={isAuthenticated ? daftarKomentar.length : jumlahKomentarAktif} terbukaAwal={true} aksen={true}>
              {isAuthenticated ? (
                <div className="space-y-3 text-sm">
                  <form onSubmit={handleKirimKomentar} className="space-y-2">
                    <div className="relative">
                      <textarea
                        value={teksKomentar}
                        onChange={(e) => setTeksKomentar(e.target.value)}
                        rows={4}
                        className="w-full text-sm px-3 py-2 pr-16 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-dark-bg-input dark:text-dark-text"
                        placeholder="Tulis komentar ..."
                      />
                      <button
                        type="submit"
                        aria-label="Kirim komentar"
                        disabled={isSubmittingKomentar || !teksKomentar.trim()}
                        className="absolute bottom-2 right-2 h-8 px-3 text-xs rounded-full bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center"
                      >
                        {isSubmittingKomentar ? '…' : 'Kirim'}
                      </button>
                    </div>
                  </form>

                  {pesanKomentar && <p className="secondary-text">{pesanKomentar}</p>}

                  {daftarKomentarTerurut.length > 0 && (
                    <div className="space-y-3">
                      {daftarKomentarTerurut.map((item) => (
                        <div key={item.id} className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
                          <div className="text-xs secondary-text mb-1 flex items-center justify-between gap-2">
                            <span>{item.pengguna_nama || 'Pengguna'}</span>
                            <span>{formatLocalDateTime(item.updated_at || item.created_at)}</span>
                          </div>
                          <div className="whitespace-pre-line leading-relaxed">{item.komentar}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2 text-sm">
                  <a
                    href="/auth/google"
                    onClick={(event) => {
                      event.preventDefault();
                      loginDenganGoogle(window.location.pathname + window.location.search);
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm rounded-md bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-400"
                  >
                    Masuk dengan Google
                  </a>
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
              <PanelLipat judul="Glosarium" jumlah={glosariumPageInfo.total} terbukaAwal={true} aksen={true}>
                <div className="text-sm leading-relaxed">
                  {glosariumPageInfo.hasPrev && (
                    <>
                      <CursorNavButton
                        symbol="«"
                        onClick={handlePrevGlosarium}
                        disabled={isFetchingGlosarium}
                        isLoading={isFetchingGlosarium && navigasiGlosariumAktif === 'prev'}
                      />
                      <span className="secondary-text"> ... </span>
                    </>
                  )}
                  {glosarium.map((item, i) => (
                    <span key={`${item.indonesia}-${item.asing}-${i}`}>
                      {item.asing ? (
                        <>
                          <em>{item.asing}</em>
                          <span> (</span>
                          <span>{item.indonesia}</span>
                          <span>)</span>
                        </>
                      ) : (
                        <span>{item.indonesia}</span>
                      )}
                      {i < glosarium.length - 1 && <span>; </span>}
                    </span>
                  ))}
                  {glosariumPageInfo.hasNext && (
                    <>
                      <span className="secondary-text"> ... </span>
                      <CursorNavButton
                        symbol="»"
                        onClick={handleNextGlosarium}
                        disabled={isFetchingGlosarium}
                        isLoading={isFetchingGlosarium && navigasiGlosariumAktif === 'next'}
                      />
                    </>
                  )}
                </div>
              </PanelLipat>
            )}
          </div>
      </div>
    </HalamanDasar>
  );
}

export default KamusDetail;
export {
  upsertMetaTag,
  renderMarkdown,
  buatPathKategoriKamus,
  formatTitleCase,
  normalizeToken,
  buildLabelMap,
  resolveNamaLabel,
  buatPathKategoriDariLabel,
  tentukanKategoriJenis,
  bandingkanEntriKamus,
  bandingkanJenisSubentri,
  formatInfoWaktuEntri,
  formatLocalDateTime,
};
