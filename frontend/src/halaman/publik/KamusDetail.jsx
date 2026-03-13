/**
 * @fileoverview Halaman detail kamus — makna, contoh, sublema, tesaurus, glosarium
 */

import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ambilDetailKamus, ambilKomentarKamus, simpanKomentarKamus, ambilKategoriKamus, cariGlosarium } from '../../api/apiPublik';
import { useAuth } from '../../context/authContext';
import TombolNavKursor from '../../komponen/publik/TombolNavKursor';
import PanelLipat from '../../komponen/publik/PanelLipat';
import HalamanDasar from '../../komponen/publik/HalamanDasar';
import HamparanMuatNav from '../../komponen/publik/HamparanMuatNav';
import TombolSunting from '../../komponen/publik/TombolSunting';
import TombolMasuk from '../../komponen/bersama/TombolMasuk';
import { PesanTidakDitemukan } from '../../komponen/publik/StatusKonten';
import {
  formatLemaHomonim,
  formatLocalDateTime,
  parseUtcDate,
  renderEntriGlosariumTertaut,
} from '../../utils/formatUtils';
import { buatPathDetailKamus, normalisasiIndeksKamus } from '../../utils/paramUtils';
import { buildMetaDetailKamus } from '../../utils/metaUtils';
import useNavigasiMemuat from '../../hooks/bersama/useNavigasiMemuat';

const GLOSARIUM_LIMIT = 20;
const SUBENTRI_PREVIEW_LIMIT = 8;
const SUBENTRI_PERIBAHASA_LABEL_LIMIT = 56;

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

function ekstrakKandidatTautanMakna(segmen = '') {
  const trimmed = String(segmen || '').trim();
  if (!trimmed || /\*/.test(trimmed)) return null;

  // Hanya tautkan segmen pendek utuh: "kata", "dua kata", atau dengan kurung penjelas di akhir.
  const match = trimmed.match(/^([^()]+?)(\s*(?:\([^)]*\)\s*)*)$/);
  if (!match) return null;

  const baseText = String(match[1]).trim();

  const wordCount = baseText.split(/\s+/).filter(Boolean).length;
  if (wordCount < 1 || wordCount > 2) return null;

  const parentheticalRaw = String(match[2] || '').trim();
  return {
    baseText,
    parenthetical: parentheticalRaw ? ` ${parentheticalRaw}` : '',
  };
}

function normalisasiKunciTautanMakna(teks = '') {
  return normalisasiIndeksKamus(teks).trim().toLowerCase();
}

function normalisasiKunciTautanIndonesia(teks = '') {
  return normalisasiIndeksKamus(teks).trim().toLowerCase();
}

/**
 * Render teks makna dengan tautan otomatis ke entri kamus.
 * Tautan hanya dibuat bila seluruh segmen adalah kandidat pendek (1-2 kata)
 * dengan kurung penjelas opsional di bagian akhir.
 */
function RenderMakna({ teks, tautanValidSet = null }) {
  if (!teks) return null;
  const segmen = teks.split(';');
  return (
    <>
      {segmen.map((seg, i) => {
        const trimmed = seg.trim();
        const kandidatTautan = ekstrakKandidatTautanMakna(trimmed);
        const kunciTautan = kandidatTautan ? normalisasiKunciTautanMakna(kandidatTautan.baseText) : '';
        if (kandidatTautan && tautanValidSet?.has(kunciTautan)) {
          return (
            <Fragment key={i}>
              {i > 0 && '; '}
              <Link to={buatPathDetailKamus(kandidatTautan.baseText)} className="kamus-detail-subentry-link">{kandidatTautan.baseText}</Link>
              {kandidatTautan.parenthetical}
            </Fragment>
          );
        }

        return (
          <Fragment key={i}>
            {i > 0 && '; '}
            <span dangerouslySetInnerHTML={{ __html: renderMarkdown(trimmed) }} />
          </Fragment>
        );
      })}
    </>
  );
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

function formatLabelPenyingkatanBadge(teks = '') {
  const value = String(teks || '').trim().toLowerCase();
  const petaPenyingkatan = {
    akr: 'Akronim',
    akronim: 'Akronim',
    kp: 'Kependekan',
    kependekan: 'Kependekan',
    sing: 'Singkatan',
    singkatan: 'Singkatan',
  };
  return petaPenyingkatan[value] || String(teks || '').trim();
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

function ringkasLabelChip(text = '', maxLength = SUBENTRI_PERIBAHASA_LABEL_LIMIT) {
  const nilai = String(text || '').trim();
  if (!nilai || nilai.length <= maxLength) return nilai;

  const batas = Math.max(maxLength - 4, 1);
  const potongAwal = nilai.slice(0, batas).trimEnd();
  const indeksSpasiTerakhir = potongAwal.lastIndexOf(' ');
  const potongRapi = indeksSpasiTerakhir >= 24
    ? potongAwal.slice(0, indeksSpasiTerakhir).trimEnd()
    : potongAwal;

  return `${potongRapi} …`;
}

export const __private = {
  formatLabelPenyingkatanBadge,
  ekstrakKandidatTautanMakna,
  normalisasiKunciTautanMakna,
  RenderMakna,
  ringkasLabelChip,
};

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

function resolveNamaPenyingkatan(nilai, petaLabel = {}) {
  const namaLabel = resolveNamaLabel(nilai, petaLabel);
  if (normalizeToken(namaLabel) !== normalizeToken(nilai)) {
    return namaLabel;
  }

  return formatLabelPenyingkatanBadge(nilai);
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

function formatInfoWaktuEntri(createdAt, updatedAt) {
  const createdDate = parseUtcDate(createdAt);
  const updatedDate = parseUtcDate(updatedAt);

  if (!createdDate && !updatedDate) return '';

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

  return parts.join(' · ');
}

function normalisasiNilaiMeta(teks = '', { hapusSlash = false } = {}) {
  let nilai = String(teks || '').trim();
  nilai = nilai.replace(/\s*(\(\d+\)\s*)+$/g, '').trim();
  if (hapusSlash) {
    nilai = nilai.replace(/^\/+|\/+$/g, '').trim();
  }
  return nilai.toLowerCase();
}

export function shouldShowMetaSeparator(infoWaktu, sumberKodeEntri, adalahAdmin, entriId) {
  if (!infoWaktu) return false;
  if (sumberKodeEntri) return true;
  if (adalahAdmin && entriId) return true;
  return false;
}

function BadgeSumberDanTombolEdit({
  sumberKode = '',
  editTo = '',
  editAriaLabel = 'Sunting entri di Redaksi',
  editTitle = 'Sunting entri di Redaksi',
  badgeClassName = '',
}) {
  const kode = String(sumberKode || '').trim();
  if (!kode && !editTo) return null;

  const kelasBadge = ['badge-sumber', badgeClassName].filter(Boolean).join(' ');
  const pathSumber = kode ? `/sumber#${encodeURIComponent(kode)}` : '';

  return (
    <span className="kamus-detail-inline-source">
      {kode && (
        <Link to={pathSumber} className={kelasBadge}>{kode}</Link>
      )}
      {editTo && (
        <TombolSunting
          to={editTo}
          ariaLabel={editAriaLabel}
          title={editTitle}
        />
      )}
    </span>
  );
}

function KamusDetail() {
  const { indeks } = useParams();
  const location = useLocation();
  const { isAuthenticated, adalahAdmin, isLoading: isAuthLoading, loginDenganGoogle } = useAuth();
  const [teksKomentar, setTeksKomentar] = useState('');
  const [isSubmittingKomentar, setIsSubmittingKomentar] = useState(false);
  const [subentriExpanded, setSubentriExpanded] = useState({});
  const [pesanKomentar, setPesanKomentar] = useState('');
  const [cursorGlosarium, setCursorGlosarium] = useState(null);
  const [directionGlosarium, setDirectionGlosarium] = useState('next');
  const [cursorGlosariumFallback, setCursorGlosariumFallback] = useState(null);
  const [directionGlosariumFallback, setDirectionGlosariumFallback] = useState('next');

  useEffect(() => {
    setCursorGlosarium(null);
    setDirectionGlosarium('next');
    setCursorGlosariumFallback(null);
    setDirectionGlosariumFallback('next');
  }, [indeks]);

  const sumberPelacakan = String(location.state?.sumberPelacakan || '').trim().toLowerCase();
  const skipPelacakan = sumberPelacakan === 'susun-kata';

  const { data, isLoading, isFetching, isError, error } = useQuery({
    queryKey: ['kamus-detail', indeks, cursorGlosarium, directionGlosarium],
    queryFn: () => ambilDetailKamus(indeks, {
      glosariumLimit: GLOSARIUM_LIMIT,
      glosariumCursor: cursorGlosarium,
      glosariumDirection: directionGlosarium,
      sumberPelacakan: skipPelacakan ? 'susun-kata' : null,
    }),
    enabled: Boolean(indeks),
    placeholderData: (previousData) => previousData,
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

  const tautanMaknaValidSet = new Set(
    (data?.tautan_makna_valid || []).map((item) => normalisasiKunciTautanMakna(item)).filter(Boolean)
  );

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

  const detailTersedia = !isError && Boolean(data);
  const tautanIndonesiaValidSet = new Set(
    ((detailTersedia ? data?.tautan_indonesia_valid : glosariumFallbackData?.tautan_indonesia_valid) || [])
      .map((item) => normalisasiKunciTautanIndonesia(item))
      .filter(Boolean)
  );

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
  const petaPenyingkatan = buildLabelMap(kategoriKamus?.bentuk || []);

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

  const notFound = isError || !data;
  const kataCari = decodeURIComponent(indeks || '');
  const indeksKamusFallback = normalisasiIndeksKamus(kataCari);
  const tautanRujukanKbbiFallback = indeksKamusFallback
    ? `https://kbbi.kemendikdasmen.go.id/entri/${encodeURIComponent(indeksKamusFallback)}`
    : '';
  const saran = error?.saran || [];

  const urutanJenisSubentri = ['turunan', 'gabungan', 'idiom', 'peribahasa', 'varian', 'bentuk_tidak_baku'];

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
        entri_rujuk_indeks: data.entri_rujuk_indeks || data.entri_rujuk || null,
        rujukan: Boolean(data.rujukan),
        created_at: data.created_at || null,
        updated_at: data.updated_at || null,
        induk: data.induk || [],
        makna: data.makna || [],
        subentri: data.subentri || {},
        tagar: data.tagar || [],
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
  const navigasiIndeks = notFound
    ? { prev: null, next: null }
    : {
      prev: data?.navigasi?.prev || null,
      next: data?.navigasi?.next || null,
    };
  const {
    mulaiNavigasi: mulaiNavigasiGlosarium,
    isNavigasiMemuat: isNavigasiGlosariumMemuat,
  } = useNavigasiMemuat(isFetchingGlosarium, indeks);

  if (isLoading) {
    return (
      <HalamanDasar>
        <p className="secondary-text">Memuat detail …</p>
      </HalamanDasar>
    );
  }

  const handlePrevGlosarium = () => {
    if (!glosariumPageInfo.prevCursor) return;
    mulaiNavigasiGlosarium('prev');
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
    mulaiNavigasiGlosarium('next');
    if (notFound) {
      setCursorGlosariumFallback(glosariumPageInfo.nextCursor);
      setDirectionGlosariumFallback('next');
    } else {
      setCursorGlosarium(glosariumPageInfo.nextCursor);
      setDirectionGlosarium('next');
    }
  };

  const toggleSubentri = (groupKey) => {
    setSubentriExpanded((prev) => ({
      ...prev,
      [groupKey]: !prev[groupKey],
    }));
  };


  const renderDaftarTesaurus = (items) => (
    <>
      {items.map((kata, i) => (
        <span key={`${kata}-${i}`}>
          {tautanMaknaValidSet.has(normalisasiKunciTautanMakna(kata)) ? (
            <Link
              to={buatPathDetailKamus(kata)}
              className="kamus-detail-relation-link"
            >
              {kata}
            </Link>
          ) : (
            <span>{kata}</span>
          )}
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
              <div className="kamus-detail-heading-row">
                <h1 className="kamus-detail-heading">
                  <span className="kamus-detail-heading-main">{kataCari}</span>
                </h1>
                {tautanRujukanKbbiFallback && (
                  <div className="kamus-detail-admin-actions">
                    <a
                      href={tautanRujukanKbbiFallback}
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
                  </div>
                )}
              </div>
              <div className="mt-6">
                <PesanTidakDitemukan saran={saran} />
              </div>
            </>
          ) : daftarEntri.map((entriItem, entriIndex) => {
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
            const etimologiTampil = (entriItem.etimologi || []).filter((item) => adalahAdmin || item?.aktif !== false);
            const sumberKodeEntri = String(entriItem.sumber_kode || '').trim();

            const rantaiHeading = [...(entriItem.induk || []), { id: `current-${entriItem.id}`, entri: entriItem.entri, indeks: entriItem.indeks, current: true }];
            const infoWaktu = formatInfoWaktuEntri(entriItem.created_at, entriItem.updated_at);
            const indeksKamus = normalisasiIndeksKamus(entriItem.indeks || entriItem.entri);
            const tautanRujukanKbbi = indeksKamus
              ? `https://kbbi.kemendikdasmen.go.id/entri/${encodeURIComponent(indeksKamus)}`
              : '';
            const pembandingEntri = [
              normalisasiNilaiMeta(entriItem.entri),
              normalisasiNilaiMeta(entriItem.indeks),
            ].filter(Boolean);
            const pemenggalanTernormalisasi = normalisasiNilaiMeta(entriItem.pemenggalan);
            const lafalTernormalisasi = normalisasiNilaiMeta(entriItem.lafal, { hapusSlash: true });
            const adaPemenggalan = Boolean(pemenggalanTernormalisasi);
            const adaLafal = Boolean(
              lafalTernormalisasi && !pembandingEntri.includes(lafalTernormalisasi)
            );
            const daftarTagarEntri = Array.isArray(entriItem.tagar)
              ? entriItem.tagar.filter((item) => item && typeof item === 'object' && String(item.nama || '').trim() && String(item.kode || '').trim())
              : [];

            const adalahEntriTerakhir = entriIndex === daftarEntri.length - 1;

            return (
              <section
                key={`${entriItem.id ?? entriItem.indeks ?? entriItem.entri ?? 'entri'}-${entriIndex}`}
                className={[
                  'mb-8 pb-8 border-b border-gray-200 dark:border-gray-700',
                  adalahEntriTerakhir ? 'border-b-0 mb-0 pb-0' : '',
                ].join(' ').trim()}
              >
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
                      <span className="kamus-detail-heading-badge-group">
                        {entriItem.jenis === 'varian' ? (
                          <span className="kamus-detail-tag-jenis">
                            {formatTitleCase(entriItem.jenis)}
                          </span>
                        ) : (
                          <Link
                            to={buatPathKategoriKamus(tentukanKategoriJenis(entriItem.jenis || 'dasar'), entriItem.jenis || 'dasar')}
                            className="kamus-detail-tag-jenis"
                          >
                            {formatTitleCase(entriItem.jenis || 'dasar')}
                          </Link>
                        )}
                        {daftarTagarEntri.map((tagar) => (
                          <Link
                            key={`${tagar.id ?? tagar.kode}`}
                            to={`/kamus/tagar/${encodeURIComponent(tagar.kode)}`}
                            className="kamus-detail-tag-blue"
                          >
                            {tagar.nama}
                          </Link>
                        ))}
                      </span>
                    </h1>
                    {(adaPemenggalan || adaLafal) && (
                      <p className="kamus-detail-heading-meta">
                        {adaPemenggalan && (
                          <>
                            <span title="Pemenggalan">{formatLemaHomonim(entriItem.pemenggalan)}</span>
                          </>
                        )}
                        {adaPemenggalan && adaLafal && <span>{' · '}</span>}
                        {adaLafal && (
                          <>
                            <span title="Pelafalan">/{formatLemaHomonim(entriItem.lafal)}/</span>
                          </>
                        )}
                      </p>
                    )}
                  </div>
                  {tautanRujukanKbbi && (
                    <div className="kamus-detail-admin-actions">
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

                {entriItem.entri_rujuk ? (
                  <p className="mt-4">
                    {entriItem.jenis_rujuk === '→' ? 'Bentuk tidak baku dari ' : 'Lihat '}
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
                        {(() => {
                          const renderIsiMakna = (m) => (
                            <>
                              {m.bidang && (
                                <>
                                  <Link
                                    to={buatPathKategoriDariLabel('bidang', m.bidang, petaBidang)}
                                    className="badge-bidang"
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
                              {m.kiasan && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('ekspresi', 'kiasan')}
                                    className="kamus-badge kamus-badge-kiasan"
                                  >
                                    Kiasan
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
                              {m.penyingkatan && (
                                <>
                                  <Link
                                    to={buatPathKategoriKamus('bentuk', normalisasiSlugNama(resolveNamaPenyingkatan(m.penyingkatan, petaPenyingkatan)))}
                                    className="kamus-badge kamus-badge-penyingkat"
                                  >
                                    {resolveNamaPenyingkatan(m.penyingkatan, petaPenyingkatan)}
                                  </Link>{' '}
                                </>
                              )}
                              <RenderMakna teks={m.makna} tautanValidSet={tautanMaknaValidSet} />
                              {(m.ilmiah || m.kimia) && (
                                <span className="kamus-detail-def-extra">
                                  ; {m.ilmiah && <em>{m.ilmiah}</em>}
                                  {m.ilmiah && m.kimia && '; '}
                                  {m.kimia && <span dangerouslySetInnerHTML={{ __html: m.kimia }} />}
                                </span>
                              )}
                              {m.contoh?.length > 0 && (
                                <>
                                  <span>: </span>
                                  <span className="kamus-detail-def-sample">{m.contoh.map((c, i) => (
                                    <span key={`${c.id ?? c.contoh ?? 'contoh'}-${i}`}>
                                      <span dangerouslySetInnerHTML={{ __html: renderMarkdown(c.contoh) }} />
                                      {c.makna_contoh && <span> — {c.makna_contoh}</span>}
                                      {i < m.contoh.length - 1 && <span>; </span>}
                                    </span>
                                  ))}</span>
                                </>
                              )}
                            </>
                          );

                          if (daftarMakna.length <= 1) {
                            return (
                              <div className="kamus-detail-def-content leading-relaxed">
                                {renderIsiMakna(daftarMakna[0])}
                              </div>
                            );
                          }

                          return (
                            <ol className="kamus-detail-def-list">
                              {daftarMakna.map((m, indexMakna) => (
                                <li key={`${m.id ?? m.makna ?? 'makna'}-${indexMakna}`} className="kamus-detail-def-item">
                                  <span className="kamus-detail-def-number">{indexMakna + 1}.</span>
                                  <div className="kamus-detail-def-content leading-relaxed">
                                    {renderIsiMakna(m)}
                                  </div>
                                </li>
                              ))}
                            </ol>
                          );
                        })()}
                      </div>
                    ))}
                  </div>
                )}

                {subentriEntries.length > 0 && (
                  <div className="mt-4">
                    {subentriEntries.map(([jenis, daftar]) => (
                      (() => {
                        const daftarSubentri = jenis === 'bentuk_tidak_baku'
                          ? [...daftar].sort((a, b) => (a?.entri || '').localeCompare((b?.entri || ''), 'id', { sensitivity: 'base' }))
                          : daftar;
                        const groupKey = `${entriItem.id ?? entriIndex}-${jenis}`;
                        const groupId = `subentri-${normalisasiSlugNama(String(entriItem.id ?? entriIndex))}-${normalisasiSlugNama(jenis) || 'jenis'}`;
                        const isExpanded = Boolean(subentriExpanded[groupKey]);
                        const perluLipat = daftarSubentri.length > SUBENTRI_PREVIEW_LIMIT;
                        const jumlahLainnya = Math.max(daftarSubentri.length - SUBENTRI_PREVIEW_LIMIT, 0);
                        const gunakanLabelRingkas = jenis === 'peribahasa';
                        const daftarSubentriTampil = perluLipat && !isExpanded
                          ? daftarSubentri.slice(0, SUBENTRI_PREVIEW_LIMIT)
                          : daftarSubentri;

                        return (
                      <div key={jenis} className="kamus-detail-subentry-group">
                        <div className="kamus-detail-subentry-heading-row">
                          <h3 className="kamus-detail-def-class mb-0">
                            {formatJenisSubentri(jenis)}{' '}
                            {perluLipat ? (
                              <button
                                type="button"
                                className="kamus-count-badge-button"
                                onClick={() => toggleSubentri(groupKey)}
                                aria-expanded={isExpanded}
                                aria-controls={groupId}
                              >
                                <span className="kamus-count-badge" data-count={daftar.length}>
                                  ({daftar.length})
                                </span>
                              </button>
                            ) : (
                              <span className="kamus-count-badge" data-count={daftar.length}>
                                ({daftar.length})
                              </span>
                            )}
                          </h3>
                        </div>
                        <ul id={groupId} className="kamus-detail-subentry-chip-list">
                          {daftarSubentriTampil.map((s, i) => (
                            <li key={`${s.id ?? s.indeks ?? s.entri ?? 'subentri'}-${i}`} className="kamus-detail-subentry-chip-item">
                              {(() => {
                                const labelAsli = formatLemaHomonim(s.entri);
                                const labelTampil = gunakanLabelRingkas
                                  ? ringkasLabelChip(labelAsli)
                                  : labelAsli;

                                return jenis === 'varian' ? (
                                  <span className="kamus-detail-subentry-chip-static" title={labelAsli}>{labelTampil}</span>
                                ) : (
                                  <Link
                                    to={buatPathDetailKamus(s.indeks || s.entri)}
                                    className="kamus-detail-subentry-chip-link"
                                    title={labelAsli}
                                  >
                                    {labelTampil}
                                  </Link>
                                );
                              })()}
                            </li>
                          ))}
                          {perluLipat && !isExpanded && (
                            <li className="kamus-detail-subentry-chip-item">
                              <button
                                type="button"
                                className="kamus-detail-subentry-toggle"
                                onClick={() => toggleSubentri(groupKey)}
                                aria-expanded={isExpanded}
                                aria-controls={groupId}
                              >
                                {`+${jumlahLainnya} lainnya`}
                              </button>
                            </li>
                          )}
                        </ul>
                      </div>
                        );
                      })()
                    ))}
                  </div>
                )}

                {etimologiTampil.length > 0 && (
                  <div className="mt-4">
                    <div className="kamus-detail-subentry-group">
                      <div className="kamus-detail-subentry-heading-row">
                        <h3 className="kamus-detail-def-class mb-0">
                          Etimologi{' '}
                          <span className="kamus-count-badge" data-count={etimologiTampil.length}>
                            ({etimologiTampil.length})
                          </span>
                        </h3>
                      </div>
                      <div className="kamus-detail-subentry-flow">
                        {etimologiTampil.map((item, i) => (
                          <span key={item.id || `${item.bahasa}-${item.kata_asal}-${i}`}>
                            {item.bahasa && (
                              <>
                                <span className="kamus-badge kamus-badge-bahasa">
                                  {resolveNamaLabel(item.bahasa, petaBahasa)}
                                </span>{' '}
                              </>
                            )}
                            <em>{String(item.kata_asal || '').trim() || '—'}</em>
                            {' '}
                            <BadgeSumberDanTombolEdit
                              sumberKode={item.sumber_kode}
                              editTo={adalahAdmin && item.id ? `/redaksi/etimologi/${item.id}` : ''}
                              editAriaLabel="Sunting etimologi di Redaksi"
                              editTitle="Sunting etimologi di Redaksi"
                              badgeClassName="kamus-detail-etimologi-source-badge"
                            />
                            {i < etimologiTampil.length - 1 && <span className="secondary-text">; </span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {(infoWaktu || sumberKodeEntri || (adalahAdmin && entriItem.id)) && (
                  <p className="kamus-detail-entry-meta">
                    {infoWaktu}
                    {shouldShowMetaSeparator(infoWaktu, sumberKodeEntri, adalahAdmin, entriItem.id) && <span>{' · '}</span>}
                    <BadgeSumberDanTombolEdit
                      sumberKode={sumberKodeEntri}
                      editTo={adalahAdmin && entriItem.id ? `/redaksi/kamus/${entriItem.id}` : ''}
                      editAriaLabel="Sunting entri di Redaksi"
                      editTitle="Sunting entri di Redaksi"
                      badgeClassName="kamus-detail-entry-source-badge"
                    />
                  </p>
                )}
              </section>
            );
          })}

          {!notFound && (navigasiIndeks.prev || navigasiIndeks.next) && (
            <nav className="kamus-detail-sekuens-nav" aria-label="Navigasi indeks kamus">
              {navigasiIndeks.prev ? (
                <Link
                  to={buatPathDetailKamus(navigasiIndeks.prev.indeks || navigasiIndeks.prev.label)}
                  className="kamus-detail-sekuens-link kamus-detail-sekuens-link-prev"
                  title={navigasiIndeks.prev.label || navigasiIndeks.prev.indeks}
                >
                  <span className="kamus-detail-sekuens-arrow" aria-hidden="true">{'‹'}</span>
                  <span className="kamus-detail-sekuens-label">{navigasiIndeks.prev.label || navigasiIndeks.prev.indeks}</span>
                </Link>
              ) : <span />}

              {navigasiIndeks.next && (
                <Link
                  to={buatPathDetailKamus(navigasiIndeks.next.indeks || navigasiIndeks.next.label)}
                  className="kamus-detail-sekuens-link kamus-detail-sekuens-link-next"
                  title={navigasiIndeks.next.label || navigasiIndeks.next.indeks}
                >
                  <span className="kamus-detail-sekuens-label">{navigasiIndeks.next.label || navigasiIndeks.next.indeks}</span>
                  <span className="kamus-detail-sekuens-arrow" aria-hidden="true">{'›'}</span>
                </Link>
              )}
            </nav>
          )}
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
                        placeholder="Tulis komentar …"
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
                      {daftarKomentarTerurut.map((item, indexKomentar) => (
                        <div key={`${item.id ?? item.created_at ?? 'komentar'}-${indexKomentar}`} className="border border-gray-200 dark:border-gray-700 rounded-md px-3 py-2">
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
                  <TombolMasuk
                    label="Masuk untuk Berkomentar"
                    onClick={(event) => {
                      if (event?.preventDefault) {
                        event.preventDefault();
                      }
                      loginDenganGoogle(window.location.pathname + window.location.search);
                    }}
                    className="w-auto px-3 py-2 text-sm rounded-md"
                  />
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
              <PanelLipat
                judul="Glosarium"
                jumlah={glosariumPageInfo.total}
                terbukaAwal={true}
                aksen={true}
                aksiKanan={(
                  <div className="rima-heading-nav">
                    <TombolNavKursor
                      symbol="‹"
                      onClick={handlePrevGlosarium}
                      disabled={isFetchingGlosarium || !glosariumPageInfo.hasPrev}
                      className="paginasi-btn rima-heading-nav-button"
                    />
                    <TombolNavKursor
                      symbol="›"
                      onClick={handleNextGlosarium}
                      disabled={isFetchingGlosarium || !glosariumPageInfo.hasNext}
                      className="paginasi-btn rima-heading-nav-button"
                    />
                  </div>
                )}
              >
                <HamparanMuatNav
                  isLoading={isNavigasiGlosariumMemuat}
                  loadingText="Memuat glosarium …"
                  contentClassName="text-sm leading-relaxed"
                >
                    {glosarium.map((item, i) => (
                      <span key={`${item.indonesia}-${item.asing}-${i}`}>
                        {item.asing ? (
                          <>
                            <em>{renderEntriGlosariumTertaut(item.asing, (part, info) => (
                              <Link
                                key={`${item.asing}-${part}-${info.partIndex}-${info.tokenIndex}`}
                                to={`/glosarium/detail/${encodeURIComponent(part)}`}
                                className="kamus-detail-subentry-link"
                              >
                                {part}
                              </Link>
                            ))}</em>
                            {item.indonesia ? ': ' : ''}
                            {renderEntriGlosariumTertaut(item.indonesia, (part, info) => (
                              tautanIndonesiaValidSet.has(normalisasiKunciTautanIndonesia(part)) ? (
                                <Link
                                  key={`${item.indonesia}-${part}-${info.partIndex}-${info.tokenIndex}`}
                                  to={buatPathDetailKamus(part)}
                                  className="kamus-detail-subentry-link"
                                >
                                  {part}
                                </Link>
                              ) : (
                                <span key={`${item.indonesia}-${part}-${info.partIndex}-${info.tokenIndex}`}>{part}</span>
                              )
                            ))}
                          </>
                        ) : (
                          <>{renderEntriGlosariumTertaut(item.indonesia, (part, info) => (
                            tautanIndonesiaValidSet.has(normalisasiKunciTautanIndonesia(part)) ? (
                              <Link
                                key={`${item.indonesia}-${part}-${info.partIndex}-${info.tokenIndex}`}
                                to={buatPathDetailKamus(part)}
                                className="kamus-detail-subentry-link"
                              >
                                {part}
                              </Link>
                            ) : (
                              <span key={`${item.indonesia}-${part}-${info.partIndex}-${info.tokenIndex}`}>{part}</span>
                            )
                          ))}</>
                        )}
                        {i < glosarium.length - 1 && <span>; </span>}
                      </span>
                    ))}
                </HamparanMuatNav>
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
