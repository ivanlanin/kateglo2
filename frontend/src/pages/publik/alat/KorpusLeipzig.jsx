/**
 * @fileoverview Alat analisis korpus untuk menelusuri kata, contoh kalimat, dan asosiasinya.
 */

import {
  Fragment,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';
import {
  ambilContohKataLeipzig,
  ambilDaftarKorpusLeipzig,
  ambilInfoKataLeipzig,
  ambilPeringkatKataLeipzig,
  ambilKookurensiSekalimatLeipzig,
  ambilKookurensiTetanggaLeipzig,
} from '../../../api/apiPublik';

const formatAngka = new Intl.NumberFormat('id-ID');
const formatTanggal = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const formatPersen = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});
const PATH_ANALISIS_KORPUS = '/alat/analisis-korpus';
const MODE_TELUSURI = 'telusuri';
const MODE_BANDINGKAN = 'bandingkan';
const MODE_PERINGKAT = 'peringkat';
const PERINGKAT_LIMIT = 25;
const DAFTAR_MODE = [
  { value: MODE_TELUSURI, label: 'Pencarian' },
  { value: MODE_BANDINGKAN, label: 'Perbandingan' },
  { value: MODE_PERINGKAT, label: 'Pemeringkatan' },
];

function ambilPesanGalat(error, fallback = 'Terjadi kesalahan saat memuat data.') {
  return error?.response?.data?.message || fallback;
}

function adalahGalat404(error) {
  return error?.response?.status === 404;
}

function escapeRegExp(value = '') {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function formatTanggalAman(value) {
  if (!value) return 'Tanggal tidak tersedia';
  const tanggal = new Date(value);
  if (Number.isNaN(tanggal.getTime())) return String(value);
  return formatTanggal.format(tanggal);
}

function formatStatKorpus(stats = {}) {
  const statsAman = stats && typeof stats === 'object' ? stats : {};
  const daftar = [
    statsAman.sentences ? `${formatAngka.format(statsAman.sentences)} kalimat` : null,
    statsAman.wordTypes ? `${formatAngka.format(statsAman.wordTypes)} tipe kata` : null,
    statsAman.wordTokens ? `${formatAngka.format(statsAman.wordTokens)} token` : null,
  ].filter(Boolean);

  return daftar.length ? daftar.join(' · ') : 'Statistik korpus belum tersedia';
}

function getKelasFrekuensiLabel(value) {
  if (value == null) return 'Belum dihitung';
  if (value <= 1) return `Sangat umum (kelas ${value})`;
  if (value <= 3) return `Umum (kelas ${value})`;
  if (value <= 6) return `Menengah (kelas ${value})`;
  return `Jarang (kelas ${value})`;
}

function formatKelasFrekuensiRingkas(value) {
  if (value == null) return 'N/A';
  return `Kelas ${value}`;
}

function formatKemunculanRingkas(frekuensi) {
  const jumlahKemunculan = Number(frekuensi) || 0;
  return formatAngka.format(jumlahKemunculan);
}

function normalisasiMode(value = '') {
  const mode = String(value || '').trim().toLowerCase();
  if (mode === MODE_BANDINGKAN || mode === MODE_PERINGKAT) {
    return mode;
  }

  return MODE_TELUSURI;
}

function formatPersenKemunculan(frekuensi, stats = {}) {
  const jumlahKemunculan = Number(frekuensi) || 0;
  const totalToken = Number(stats?.wordTokens) || 0;

  if (!totalToken) {
    return 'N/A';
  }

  return `${formatPersen.format((jumlahKemunculan / totalToken) * 100)}%`;
}

function adalahTokenTampil(value = '') {
  return /[\p{L}\p{N}]/u.test(String(value || ''));
}

function saringTokenTampil(items = []) {
  return items.filter((item) => {
    const kata = typeof item === 'string' ? item : item?.kata || item?.label;
    return adalahTokenTampil(kata);
  });
}

function formatHostSumber(url) {
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return String(url);
  }
}

function sorotKataDalamKalimat(kalimat = '', bentuk = []) {
  const daftarBentuk = bentuk
    .map((item) => String(item?.kata || '').trim())
    .filter(Boolean)
    .sort((kiri, kanan) => kanan.length - kiri.length);

  if (!kalimat || daftarBentuk.length === 0) return kalimat;

  const regex = new RegExp(`(${daftarBentuk.map((item) => escapeRegExp(item)).join('|')})`, 'gi');
  const parts = String(kalimat).split(regex);

  return parts.map((part, index) => {
    if (daftarBentuk.some((item) => item.toLowerCase() === part.toLowerCase())) {
      return <mark key={`${part}-${index}`} className="korpus-leipzig-mark">{part}</mark>;
    }
    return <Fragment key={`${part}-${index}`}>{part}</Fragment>;
  });
}

function bangunTataLetakGraf(nodes = [], width = 720, height = 360) {
  if (!Array.isArray(nodes) || nodes.length === 0) {
    return [];
  }

  const pusatX = width / 2;
  const pusatY = height / 2;
  const selainPusat = nodes.slice(1);
  const bobotMaks = Math.max(...nodes.map((item) => Number(item?.weight) || 0), 1);

  return nodes.map((node, index) => {
    const bobot = Number(node?.weight) || 0;
    const radiusNode = node?.isCenter
      ? 24 + ((bobot / bobotMaks) * 10)
      : 12 + ((bobot / bobotMaks) * 8);

    if (index === 0) {
      return {
        ...node,
        x: pusatX,
        y: pusatY,
        radius: radiusNode,
      };
    }

    const urutan = index - 1;
    const sudut = ((Math.PI * 2) / Math.max(selainPusat.length, 1)) * urutan - (Math.PI / 2);
    const radiusOrbit = Math.min(width, height) * (0.26 + ((urutan % 2) * 0.06));

    return {
      ...node,
      x: pusatX + (Math.cos(sudut) * radiusOrbit),
      y: pusatY + (Math.sin(sudut) * radiusOrbit),
      radius: radiusNode,
    };
  });
}

function renderTokenList(items = [], emptyText, onSelect = null, getCountLabel = null) {
  const daftar = saringTokenTampil(items);

  if (!daftar.length) {
    return <p className="alat-empty-text">{emptyText}</p>;
  }

  return (
    <p className="korpus-leipzig-inline-list">
      {daftar.map((item, index) => (
        <Fragment key={`${item.kata}-${item.frekuensi}-${index}`}>
          <button
            type="button"
            className="korpus-leipzig-inline-link"
            onClick={onSelect ? () => onSelect(item.kata) : undefined}
            disabled={!onSelect}
          >
            {item.kata}
          </button>
          <span className="korpus-leipzig-inline-count"> {' '}({getCountLabel ? getCountLabel(item) : formatAngka.format(item.frekuensi)})</span>
          {index < daftar.length - 1 ? ', ' : ''}
        </Fragment>
      ))}
    </p>
  );
}

function renderMetaContoh(item) {
  const host = formatHostSumber(item.sourceUrl);
  const tanggal = item.sourceDate ? formatTanggalAman(item.sourceDate) : null;

  if (!host && !tanggal) {
    return null;
  }

  return (
    <span className="korpus-leipzig-contoh-source-wrap">
      {' '}(
      {item.sourceUrl ? (
        <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="korpus-leipzig-source-link">{host}</a>
      ) : host}
      {tanggal ? `, dikumpulkan ${tanggal}` : ''})
    </span>
  );
}

function normalisasiSegmenPath(value = '') {
  return String(value || '').trim();
}

function normalisasiOffset(value = '') {
  const parsed = Number.parseInt(String(value || '').trim(), 10);
  if (Number.isNaN(parsed)) return 0;
  return Math.max(parsed, 0);
}

function buildPathAnalisisKorpus({
  mode = MODE_TELUSURI,
  korpus = '',
  kata = '',
  kata1 = '',
  kata2 = '',
  offset = 0,
} = {}) {
  const modeAman = normalisasiMode(mode);
  const korpusAman = normalisasiSegmenPath(korpus);
  const kataAman = normalisasiSegmenPath(kata);
  const kata1Aman = normalisasiSegmenPath(kata1);
  const kata2Aman = normalisasiSegmenPath(kata2);
  const offsetAman = normalisasiOffset(offset);
  const params = new URLSearchParams();

  if (modeAman !== MODE_TELUSURI) {
    params.set('mode', modeAman);
  }

  if (korpusAman) {
    params.set('korpus', korpusAman);
  }

  if (kataAman) {
    params.set('kata', kataAman);
  }

  if (kata1Aman) {
    params.set('kata1', kata1Aman);
  }

  if (kata2Aman) {
    params.set('kata2', kata2Aman);
  }

  if (modeAman === MODE_PERINGKAT && offsetAman > 0) {
    params.set('offset', String(offsetAman));
  }

  const query = params.toString();
  return query ? `${PATH_ANALISIS_KORPUS}?${query}` : PATH_ANALISIS_KORPUS;
}

function formatRentangData(offset = 0, jumlah = 0, total = 0) {
  if (!jumlah || !total) return 'Belum ada data kata.';

  const mulai = offset + 1;
  const akhir = offset + jumlah;
  return `Menampilkan ${formatAngka.format(mulai)}-${formatAngka.format(akhir)} dari ${formatAngka.format(total)} kata.`;
}

function hitungRingkasanPerbandingan(kiri = null, kanan = null) {
  const frekuensiKiri = Number(kiri?.frekuensi) || 0;
  const frekuensiKanan = Number(kanan?.frekuensi) || 0;
  const rankKiri = Number(kiri?.rank) || null;
  const rankKanan = Number(kanan?.rank) || null;

  if (!frekuensiKiri && !frekuensiKanan) {
    return {
      labelDominan: 'Belum ada data untuk dibandingkan.',
      selisihFrekuensi: 0,
      rasio: null,
      selisihRank: null,
    };
  }

  const entriKiri = kiri?.kata || 'Kata 1';
  const entriKanan = kanan?.kata || 'Kata 2';
  const selisihFrekuensi = Math.abs(frekuensiKiri - frekuensiKanan);
  const selisihRank = rankKiri && rankKanan ? Math.abs(rankKiri - rankKanan) : null;

  if (frekuensiKiri === frekuensiKanan) {
    return {
      labelDominan: `${entriKiri} dan ${entriKanan} muncul dengan frekuensi yang sama.`,
      selisihFrekuensi,
      rasio: 1,
      selisihRank,
    };
  }

  const kiriLebihSering = frekuensiKiri > frekuensiKanan;
  const pembilang = kiriLebihSering ? frekuensiKiri : frekuensiKanan;
  const penyebut = kiriLebihSering ? frekuensiKanan : frekuensiKiri;
  const kataDominan = kiriLebihSering ? entriKiri : entriKanan;

  return {
    labelDominan: `${kataDominan} lebih sering muncul pada korpus ini.`,
    selisihFrekuensi,
    rasio: penyebut ? (pembilang / penyebut) : null,
    selisihRank,
  };
}

function getLabelTombolSubmit(mode = MODE_TELUSURI) {
  if (mode === MODE_BANDINGKAN) return 'Bandingkan';
  if (mode === MODE_PERINGKAT) return 'Tampilkan';
  return 'Cari';
}

function PanelContohKata({
  kataAktif,
  query,
  bentuk = [],
  tampilkanSumberContoh = false,
}) {
  const contohData = Array.isArray(query?.data?.data) ? query.data.data : [];

  return (
    <>
      {!kataAktif ? (
        <p className="alat-panel-caption">Masukkan kata untuk melihat contoh pemakaian dari korpus terpilih.</p>
      ) : query.isLoading ? (
        <p className="alat-panel-caption">Memuat contoh kalimat dari korpus Leipzig ...</p>
      ) : query.isError ? (
        <p className={adalahGalat404(query.error) ? 'alat-empty-text' : 'alat-error-text'}>
          {ambilPesanGalat(query.error, 'Contoh kalimat tidak dapat dimuat.')}
        </p>
      ) : contohData.length ? (
        <ul className="korpus-leipzig-contoh-list">
          {contohData.map((item) => (
            <li key={`${kataAktif}-${item.sentenceId}`} className="korpus-leipzig-contoh-item">
              <span className="korpus-leipzig-contoh-bullet" aria-hidden="true">•</span>
              <p className="korpus-leipzig-contoh-kalimat">
                {sorotKataDalamKalimat(item.sentence, bentuk)}
                {tampilkanSumberContoh ? renderMetaContoh(item) : null}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="alat-empty-text">Belum ada contoh kalimat yang tersedia.</p>
      )}
    </>
  );
}

function RingkasanBandingKata({ title, info, queryError = null, isLoading = false, stats = {} }) {
  if (isLoading) {
    return (
      <section className="alat-subpanel korpus-leipzig-subpanel">
        <h3 className="korpus-leipzig-section-heading">{title}</h3>
        <p className="alat-panel-caption alat-subpanel-body">Memuat statistik kata ...</p>
      </section>
    );
  }

  if (queryError) {
    return (
      <section className="alat-subpanel korpus-leipzig-subpanel">
        <h3 className="korpus-leipzig-section-heading">{title}</h3>
        <p className={adalahGalat404(queryError) ? 'alat-empty-text' : 'alat-error-text'}>
          {ambilPesanGalat(queryError, 'Statistik kata tidak dapat dimuat.')}
        </p>
      </section>
    );
  }

  return (
    <section className="alat-subpanel korpus-leipzig-subpanel">
      <h3 className="korpus-leipzig-section-heading">{title}</h3>
      <div className="alat-summary-stack" aria-label={title}>
        <div className="korpus-leipzig-stat-row">
          <article className="alat-stat-card">
            <span className="alat-stat-label">Kata</span>
            <strong className="alat-stat-value">{info?.kata || 'N/A'}</strong>
          </article>
          <article className="alat-stat-card">
            <span className="alat-stat-label">Kemunculan</span>
            <strong className="alat-stat-value">{formatKemunculanRingkas(info?.frekuensi)}</strong>
          </article>
          <article className="alat-stat-card">
            <span className="alat-stat-label">Urutan</span>
            <strong className="alat-stat-value">{info?.rank ? formatAngka.format(info.rank) : 'N/A'}</strong>
          </article>
        </div>
        <p className="korpus-leipzig-summary-line">
          <span className="korpus-leipzig-summary-metric">Proporsi: {formatPersenKemunculan(info?.frekuensi, stats)}</span>
          <span className="korpus-leipzig-summary-metric">Kelas frekuensi: {formatKelasFrekuensiRingkas(info?.kelasFrekuensi)}</span>
        </p>
      </div>
    </section>
  );
}

function RingkasanDeltaBanding({ summary, statsKiri = null, statsKanan = null, stats = {} }) {
  return (
    <section className="alat-subpanel korpus-leipzig-subpanel">
      <h3 className="korpus-leipzig-section-heading">Ringkasan Perbandingan</h3>
      <div className="korpus-leipzig-stat-row">
        <article className="alat-stat-card">
          <span className="alat-stat-label">△ Frekuensi</span>
          <strong className="alat-stat-value">{formatKemunculanRingkas(summary?.selisihFrekuensi)}</strong>
        </article>
        <article className="alat-stat-card">
          <span className="alat-stat-label">Rasio</span>
          <strong className="alat-stat-value">{summary?.rasio ? `${formatPersen.format(summary.rasio)}x` : 'N/A'}</strong>
        </article>
        <article className="alat-stat-card">
          <span className="alat-stat-label">△ Urutan</span>
          <strong className="alat-stat-value">{summary?.selisihRank ? formatAngka.format(summary.selisihRank) : 'N/A'}</strong>
        </article>
      </div>
      <p className="korpus-leipzig-summary-line">
        <span className="korpus-leipzig-summary-metric">{summary?.labelDominan}</span>
      </p>
      {(statsKiri?.kata || statsKanan?.kata) ? (
        <p className="korpus-leipzig-summary-line">
          <span className="korpus-leipzig-summary-metric">{statsKiri?.kata || 'Kata 1'}: {formatPersenKemunculan(statsKiri?.frekuensi, stats)}</span>
          <span className="korpus-leipzig-summary-metric">{statsKanan?.kata || 'Kata 2'}: {formatPersenKemunculan(statsKanan?.frekuensi, stats)}</span>
        </p>
      ) : null}
    </section>
  );
}

function KorpusLeipzig() {
  const queryClient = useQueryClient();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const modeAktif = normalisasiMode(queryParams.get('mode'));
  const legacyKata = normalisasiSegmenPath(params.kata);
  const legacyKorpus = normalisasiSegmenPath(params.korpus);
  const kataAktif = normalisasiSegmenPath(queryParams.get('kata') || (modeAktif === MODE_TELUSURI ? legacyKata : ''));
  const kataBanding1Aktif = normalisasiSegmenPath(queryParams.get('kata1'));
  const kataBanding2Aktif = normalisasiSegmenPath(queryParams.get('kata2'));
  const korpusAktif = normalisasiSegmenPath(queryParams.get('korpus') || legacyKorpus);
  const peringkatOffsetAktif = normalisasiOffset(queryParams.get('offset'));
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);
  const [pesanForm, setPesanForm] = useState('');
  const [tampilkanSumberContoh, setTampilkanSumberContoh] = useState(false);
  const [formMode, setFormMode] = useState(() => modeAktif);
  const [formKorpusId, setFormKorpusId] = useState(() => korpusAktif);
  const [formKata, setFormKata] = useState(() => kataAktif);
  const [formKata1, setFormKata1] = useState(() => kataBanding1Aktif);
  const [formKata2, setFormKata2] = useState(() => kataBanding2Aktif);
  const [contohLimit, setContohLimit] = useState(10);
  const [contohBandingLimit, setContohBandingLimit] = useState(5);
  const [sekalimatLimit, setSekalimatLimit] = useState(20);
  const kataAktifDeferred = useDeferredValue(kataAktif);
  const kataBanding1Deferred = useDeferredValue(kataBanding1Aktif);
  const kataBanding2Deferred = useDeferredValue(kataBanding2Aktif);

  const korpusQuery = useQuery({
    queryKey: ['leipzig', 'daftar-korpus'],
    queryFn: ambilDaftarKorpusLeipzig,
    staleTime: 300000,
    retry: false,
  });

  const daftarKorpus = Array.isArray(korpusQuery.data?.data) ? korpusQuery.data.data : [];
  const korpusDefault = daftarKorpus.find((item) => item.hasSqlite)?.id || daftarKorpus[0]?.id || '';
  const korpusDataAktif = korpusAktif || korpusDefault;
  const korpusTerpilih = daftarKorpus.find((item) => item.id === korpusDataAktif) || null;
  const pathKanonis = buildPathAnalisisKorpus({
    mode: modeAktif,
    korpus: korpusAktif,
    kata: kataAktif,
    kata1: kataBanding1Aktif,
    kata2: kataBanding2Aktif,
    offset: peringkatOffsetAktif,
  });

  useEffect(() => {
    setFormMode(modeAktif);
  }, [modeAktif]);

  useEffect(() => {
    setFormKata(kataAktif);
  }, [kataAktif]);

  useEffect(() => {
    setFormKata1(kataBanding1Aktif);
  }, [kataBanding1Aktif]);

  useEffect(() => {
    setFormKata2(kataBanding2Aktif);
  }, [kataBanding2Aktif]);

  useEffect(() => {
    setFormKorpusId((current) => {
      if (korpusAktif) return korpusAktif;
      if (current) return current;
      return korpusDefault;
    });
  }, [korpusAktif, korpusDefault]);

  useEffect(() => {
    const urlSaatIni = `${location.pathname}${location.search}`;
    const memakaiPathLama = location.pathname.startsWith('/alat/korpus-leipzig') || Boolean(params.kata) || Boolean(params.korpus);

    if (!memakaiPathLama) return;
    if (urlSaatIni === pathKanonis) return;

    startTransition(() => {
      navigate(pathKanonis, { replace: true });
    });
  }, [location.pathname, location.search, navigate, params.kata, params.korpus, pathKanonis]);

  useEffect(() => {
    setContohLimit(10);
    setContohBandingLimit(5);
    setSekalimatLimit(20);
  }, [modeAktif, kataAktif, kataBanding1Aktif, kataBanding2Aktif, korpusDataAktif]);

  const queryDasar = {
    retry: false,
    staleTime: 60000,
  };
  const telusuriEnabled = modeAktif === MODE_TELUSURI && Boolean(korpusDataAktif && kataAktifDeferred);
  const bandingkanEnabled = modeAktif === MODE_BANDINGKAN && Boolean(korpusDataAktif);
  const peringkatEnabled = modeAktif === MODE_PERINGKAT && Boolean(korpusDataAktif);

  const infoKataQuery = useQuery({
    queryKey: ['leipzig', 'kata', korpusDataAktif, kataAktifDeferred],
    queryFn: () => ambilInfoKataLeipzig(korpusDataAktif, kataAktifDeferred),
    ...queryDasar,
    enabled: telusuriEnabled,
  });

  const contohQuery = useQuery({
    queryKey: ['leipzig', 'contoh', korpusDataAktif, kataAktifDeferred, contohLimit],
    queryFn: () => ambilContohKataLeipzig(korpusDataAktif, kataAktifDeferred, { limit: contohLimit, offset: 0 }),
    ...queryDasar,
    enabled: telusuriEnabled,
  });

  const sekalimatQuery = useQuery({
    queryKey: ['leipzig', 'sekalimat', korpusDataAktif, kataAktifDeferred, sekalimatLimit],
    queryFn: () => ambilKookurensiSekalimatLeipzig(korpusDataAktif, kataAktifDeferred, { limit: sekalimatLimit, offset: 0 }),
    ...queryDasar,
    enabled: telusuriEnabled,
  });

  const tetanggaQuery = useQuery({
    queryKey: ['leipzig', 'tetangga', korpusDataAktif, kataAktifDeferred],
    queryFn: () => ambilKookurensiTetanggaLeipzig(korpusDataAktif, kataAktifDeferred, { limit: 20 }),
    ...queryDasar,
    enabled: telusuriEnabled,
  });

  const infoBandingKata1Query = useQuery({
    queryKey: ['leipzig', 'bandingkan', 'kata-1', korpusDataAktif, kataBanding1Deferred],
    queryFn: () => ambilInfoKataLeipzig(korpusDataAktif, kataBanding1Deferred),
    ...queryDasar,
    enabled: bandingkanEnabled && Boolean(kataBanding1Deferred),
  });

  const infoBandingKata2Query = useQuery({
    queryKey: ['leipzig', 'bandingkan', 'kata-2', korpusDataAktif, kataBanding2Deferred],
    queryFn: () => ambilInfoKataLeipzig(korpusDataAktif, kataBanding2Deferred),
    ...queryDasar,
    enabled: bandingkanEnabled && Boolean(kataBanding2Deferred),
  });

  const contohBandingKata1Query = useQuery({
    queryKey: ['leipzig', 'bandingkan', 'contoh-1', korpusDataAktif, kataBanding1Deferred, contohBandingLimit],
    queryFn: () => ambilContohKataLeipzig(korpusDataAktif, kataBanding1Deferred, { limit: contohBandingLimit, offset: 0 }),
    ...queryDasar,
    enabled: bandingkanEnabled && Boolean(kataBanding1Deferred),
  });

  const contohBandingKata2Query = useQuery({
    queryKey: ['leipzig', 'bandingkan', 'contoh-2', korpusDataAktif, kataBanding2Deferred, contohBandingLimit],
    queryFn: () => ambilContohKataLeipzig(korpusDataAktif, kataBanding2Deferred, { limit: contohBandingLimit, offset: 0 }),
    ...queryDasar,
    enabled: bandingkanEnabled && Boolean(kataBanding2Deferred),
  });

  const peringkatQuery = useQuery({
    queryKey: ['leipzig', 'peringkat', korpusDataAktif, peringkatOffsetAktif, PERINGKAT_LIMIT],
    queryFn: () => ambilPeringkatKataLeipzig(korpusDataAktif, { limit: PERINGKAT_LIMIT, offset: peringkatOffsetAktif }),
    ...queryDasar,
    enabled: peringkatEnabled,
    placeholderData: (previousData) => previousData,
  });

  const sedangMemuatRingkasan = infoKataQuery.isLoading;
  const bentukKata = useMemo(
    () => saringTokenTampil(infoKataQuery.data?.bentuk || contohQuery.data?.bentuk || []),
    [infoKataQuery.data?.bentuk, contohQuery.data?.bentuk],
  );
  const sekalimatData = useMemo(() => saringTokenTampil(sekalimatQuery.data?.data || []), [sekalimatQuery.data?.data]);
  const tetanggaKiri = useMemo(() => saringTokenTampil(tetanggaQuery.data?.kiri || []), [tetanggaQuery.data?.kiri]);
  const tetanggaKanan = useMemo(() => saringTokenTampil(tetanggaQuery.data?.kanan || []), [tetanggaQuery.data?.kanan]);
  const bentukBandingKata1 = useMemo(
    () => saringTokenTampil(infoBandingKata1Query.data?.bentuk || contohBandingKata1Query.data?.bentuk || []),
    [infoBandingKata1Query.data?.bentuk, contohBandingKata1Query.data?.bentuk],
  );
  const bentukBandingKata2 = useMemo(
    () => saringTokenTampil(infoBandingKata2Query.data?.bentuk || contohBandingKata2Query.data?.bentuk || []),
    [infoBandingKata2Query.data?.bentuk, contohBandingKata2Query.data?.bentuk],
  );
  const ringkasanBanding = useMemo(
    () => hitungRingkasanPerbandingan(infoBandingKata1Query.data, infoBandingKata2Query.data),
    [infoBandingKata1Query.data, infoBandingKata2Query.data],
  );
  const dataPeringkat = useMemo(() => peringkatQuery.data?.data || [], [peringkatQuery.data?.data]);

  useEffect(() => {
    if (!peringkatEnabled || !peringkatQuery.data?.hasMore || !korpusDataAktif) {
      return;
    }

    const nextOffset = peringkatOffsetAktif + PERINGKAT_LIMIT;
    queryClient.prefetchQuery({
      queryKey: ['leipzig', 'peringkat', korpusDataAktif, nextOffset, PERINGKAT_LIMIT],
      queryFn: () => ambilPeringkatKataLeipzig(korpusDataAktif, { limit: PERINGKAT_LIMIT, offset: nextOffset }),
      staleTime: 60000,
    });
  }, [queryClient, peringkatEnabled, peringkatQuery.data?.hasMore, korpusDataAktif, peringkatOffsetAktif]);

  const handleUbahMode = (value) => {
    const modeBaru = normalisasiMode(value);

    if (modeBaru === MODE_TELUSURI) {
      setFormKata(formKata1 || formKata2 || formKata);
    }

    if (modeBaru === MODE_BANDINGKAN) {
      setFormKata1((current) => current || formKata);
      setFormKata2((current) => current || '');
    }

    setFormMode(modeBaru);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const modeAman = normalisasiMode(formMode);
    const korpusAman = String(formKorpusId || korpusDefault || '').trim();
    const kataAman = String(formKata || '').trim();
    const kata1Aman = String(formKata1 || '').trim();
    const kata2Aman = String(formKata2 || '').trim();

    if (!korpusAman) {
      setPesanForm('Korpus belum tersedia.');
      return;
    }

    if (modeAman === MODE_TELUSURI) {
      if (!kataAman) {
        setPesanForm('Masukkan kata yang ingin ditelusuri.');
        return;
      }
    }

    if (modeAman === MODE_BANDINGKAN) {
      if (!kata1Aman || !kata2Aman) {
        setPesanForm('Masukkan dua kata yang ingin dibandingkan.');
        return;
      }
    }

    setPesanForm('');
    startTransition(() => {
      navigate(buildPathAnalisisKorpus({
        mode: modeAman,
        korpus: korpusAman,
        kata: kataAman,
        kata1: kata1Aman,
        kata2: kata2Aman,
        offset: 0,
      }));
    });
  };

  const handleBersihkan = () => {
    setPesanForm('');
    setFormKata('');
    setFormKata1('');
    setFormKata2('');
    startTransition(() => {
      navigate(buildPathAnalisisKorpus({
        mode: formMode,
        korpus: formKorpusId || korpusDefault,
        offset: 0,
      }));
    });
  };

  const handlePilihContoh = (kataContoh) => {
    setPesanForm('');
    setFormMode(MODE_TELUSURI);
    setFormKata(kataContoh);
    startTransition(() => {
      navigate(buildPathAnalisisKorpus({
        mode: MODE_TELUSURI,
        korpus: korpusDataAktif,
        kata: kataContoh,
        offset: 0,
      }));
    });
  };

  const handleGantiHalamanPeringkat = (offsetBaru) => {
    startTransition(() => {
      navigate(buildPathAnalisisKorpus({
        mode: MODE_PERINGKAT,
        korpus: korpusDataAktif,
        offset: normalisasiOffset(offsetBaru),
      }));
    });
  };

  return (
    <HalamanPublik
      judul="Analisis Korpus"
      deskripsi="Telusuri frekuensi kata, contoh kalimat, tetangga leksikal, dan graf asosiasi dari korpus Leipzig bahasa Indonesia."
      tampilkanJudul={false}
    >
      <div className="alat-page">
        <div className="alat-heading-row">
          <h1 className="alat-page-heading">Analisis Korpus</h1>
          <button
            type="button"
            className="alat-heading-info-button"
            aria-label={panelInfoTerbuka ? 'Tutup informasi alat' : 'Lihat informasi alat'}
            onClick={() => setPanelInfoTerbuka((value) => !value)}
          >
            <Info size={20} strokeWidth={2.2} aria-hidden="true" />
          </button>
        </div>

        {panelInfoTerbuka ? (
          <section className="alat-panel alat-info-panel">
            <KontenMarkdownStatis
              src="/halaman/alat/analisis-korpus.md"
              loadingText="Memuat informasi alat ..."
              errorText="Gagal memuat informasi alat."
            />
          </section>
        ) : (
          <>
            <div className="alat-tool-layout korpus-leipzig-main-layout">
              <div className="korpus-leipzig-left-column">
                <section className="alat-panel" aria-labelledby="korpus-leipzig-form-title">
                  <div className="alat-panel-header">
                    <h2 id="korpus-leipzig-form-title" className="alat-panel-title">Masukan</h2>
                  </div>

                  <form className="alat-form korpus-leipzig-form-grid" onSubmit={handleSubmit}>
                    <div className="korpus-leipzig-form-row korpus-leipzig-form-row-compact">
                      <div className="korpus-leipzig-field korpus-leipzig-field-select">
                        <label htmlFor="korpus-leipzig-mode" className="korpus-leipzig-field-label">Mode</label>
                        <select
                          id="korpus-leipzig-mode"
                          value={formMode}
                          className="korpus-leipzig-select"
                          aria-label="Pilih mode analisis korpus"
                          onChange={(event) => handleUbahMode(event.target.value)}
                        >
                          {DAFTAR_MODE.map((item) => (
                            <option key={item.value} value={item.value}>{item.label}</option>
                          ))}
                        </select>
                      </div>

                      <div className="korpus-leipzig-field korpus-leipzig-field-grow">
                        <label htmlFor="korpus-leipzig-korpus" className="korpus-leipzig-field-label">Korpus</label>
                        <select
                          id="korpus-leipzig-korpus"
                          value={formKorpusId}
                          className="korpus-leipzig-select"
                          aria-label="Pilih korpus Leipzig"
                          onChange={(event) => setFormKorpusId(event.target.value)}
                          disabled={korpusQuery.isLoading || daftarKorpus.length === 0}
                        >
                          {daftarKorpus.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.label}{item.hasSqlite ? '' : ' · belum siap'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {formMode === MODE_TELUSURI ? (
                      <div className="korpus-leipzig-form-row">
                        <div className="korpus-leipzig-field korpus-leipzig-field-grow">
                          <label htmlFor="korpus-leipzig-kata" className="korpus-leipzig-field-label">Kata 1</label>
                          <input
                            id="korpus-leipzig-kata"
                            type="text"
                            value={formKata}
                            className="korpus-leipzig-input"
                            placeholder="Masukkan kata, misalnya: indonesia"
                            aria-label="Kata yang ingin ditelusuri"
                            onChange={(event) => setFormKata(event.target.value)}
                          />
                        </div>
                      </div>
                    ) : null}

                    {formMode === MODE_BANDINGKAN ? (
                      <div className="korpus-leipzig-form-row korpus-leipzig-form-row-2">
                        <div className="korpus-leipzig-field korpus-leipzig-field-grow">
                          <label htmlFor="korpus-leipzig-kata-1" className="korpus-leipzig-field-label">Kata 1</label>
                          <input
                            id="korpus-leipzig-kata-1"
                            type="text"
                            value={formKata1}
                            className="korpus-leipzig-input"
                            placeholder="Misalnya: subjek"
                            aria-label="Kata pertama yang ingin dibandingkan"
                            onChange={(event) => setFormKata1(event.target.value)}
                          />
                        </div>
                        <div className="korpus-leipzig-field korpus-leipzig-field-grow">
                          <label htmlFor="korpus-leipzig-kata-2" className="korpus-leipzig-field-label">Kata 2</label>
                          <input
                            id="korpus-leipzig-kata-2"
                            type="text"
                            value={formKata2}
                            className="korpus-leipzig-input"
                            placeholder="Misalnya: subyek"
                            aria-label="Kata kedua yang ingin dibandingkan"
                            onChange={(event) => setFormKata2(event.target.value)}
                          />
                        </div>
                      </div>
                    ) : null}

                    <div className="alat-actions korpus-leipzig-actions">
                      <button type="submit" className="alat-link-primary">{getLabelTombolSubmit(formMode)}</button>
                      <button type="button" className="alat-link-secondary" onClick={handleBersihkan}>Bersihkan</button>
                    </div>
                  </form>

                  {pesanForm ? <p className="alat-error-text">{pesanForm}</p> : null}
                  {korpusQuery.isError ? <p className="alat-error-text">{ambilPesanGalat(korpusQuery.error, 'Daftar korpus Leipzig gagal dimuat.')}</p> : null}
                </section>

                {(modeAktif === MODE_TELUSURI || modeAktif === MODE_BANDINGKAN) ? (
                  <section className="alat-panel korpus-leipzig-examples-panel" aria-labelledby="korpus-leipzig-contoh-title">
                    <div className="alat-panel-header alat-panel-header-split">
                      <h2 id="korpus-leipzig-contoh-title" className="alat-panel-title">Contoh</h2>
                      <button
                        type="button"
                        className="alat-link-secondary alat-panel-action-button"
                        onClick={() => setTampilkanSumberContoh((value) => !value)}
                      >
                        {tampilkanSumberContoh ? 'Sembunyikan sumber' : 'Tampilkan sumber'}
                      </button>
                    </div>

                    {modeAktif === MODE_TELUSURI ? (
                      <PanelContohKata
                        kataAktif={kataAktif}
                        query={contohQuery}
                        bentuk={bentukKata}
                        tampilkanSumberContoh={tampilkanSumberContoh}
                      />
                    ) : (
                      <div className="korpus-leipzig-example-stack">
                        <section className="alat-subpanel korpus-leipzig-subpanel">
                          <h3 className="korpus-leipzig-section-heading">{kataBanding1Aktif ? `Contoh ${kataBanding1Aktif}` : 'Contoh Kata 1'}</h3>
                          <PanelContohKata
                            kataAktif={kataBanding1Aktif}
                            query={contohBandingKata1Query}
                            bentuk={bentukBandingKata1}
                            tampilkanSumberContoh={tampilkanSumberContoh}
                          />
                        </section>
                        <section className="alat-subpanel korpus-leipzig-subpanel">
                          <h3 className="korpus-leipzig-section-heading">{kataBanding2Aktif ? `Contoh ${kataBanding2Aktif}` : 'Contoh Kata 2'}</h3>
                          <PanelContohKata
                            kataAktif={kataBanding2Aktif}
                            query={contohBandingKata2Query}
                            bentuk={bentukBandingKata2}
                            tampilkanSumberContoh={tampilkanSumberContoh}
                          />
                        </section>
                      </div>
                    )}
                  </section>
                ) : null}
              </div>

              <section className="alat-panel korpus-leipzig-right-column" aria-labelledby="korpus-leipzig-output-title">
                <div className="alat-panel-header">
                  <h2 id="korpus-leipzig-output-title" className="alat-panel-title">Hasil</h2>
                </div>

                {modeAktif === MODE_TELUSURI && !kataAktif ? (
                  <div className="alat-panel-header">
                    <p className="alat-panel-caption">Masukkan kata untuk melihat kemunculan, peringkat, contoh kalimat, dan hubungan leksikalnya.</p>
                  </div>
                ) : modeAktif === MODE_TELUSURI && sedangMemuatRingkasan ? (
                  <div className="alat-panel-header">
                    <p className="alat-panel-caption">Memuat ringkasan kata dari korpus Leipzig ...</p>
                  </div>
                ) : modeAktif === MODE_TELUSURI && infoKataQuery.isError ? (
                  <div className="alat-panel-header">
                    <p className={`alat-panel-caption ${adalahGalat404(infoKataQuery.error) ? '' : 'alat-error-text'}`}>
                      {ambilPesanGalat(infoKataQuery.error, 'Data kata Leipzig tidak dapat dimuat.')}
                    </p>
                  </div>
                ) : modeAktif === MODE_TELUSURI ? (
                  <>
                    <div className="alat-summary-stack" aria-label="Ringkasan hasil analisis korpus">
                      <div className="korpus-leipzig-stat-row">
                        <article className="alat-stat-card">
                          <span className="alat-stat-label">Kata</span>
                          <strong className="alat-stat-value">{infoKataQuery.data?.kata || kataAktif || 'N/A'}</strong>
                        </article>
                        <article className="alat-stat-card">
                          <span className="alat-stat-label">Kemunculan</span>
                          <strong className="alat-stat-value">{formatKemunculanRingkas(infoKataQuery.data?.frekuensi)}</strong>
                        </article>
                        <article className="alat-stat-card">
                          <span className="alat-stat-label">Urutan</span>
                          <strong className="alat-stat-value">{infoKataQuery.data?.rank ? formatAngka.format(infoKataQuery.data.rank) : 'N/A'}</strong>
                        </article>
                      </div>
                      <p className="korpus-leipzig-summary-line">
                        <span className="korpus-leipzig-summary-metric">Proporsi: {formatPersenKemunculan(infoKataQuery.data?.frekuensi, korpusTerpilih?.stats)}</span>
                        <span className="korpus-leipzig-summary-metric">Kelas frekuensi: {getKelasFrekuensiLabel(infoKataQuery.data?.kelasFrekuensi)}</span>
                      </p>
                    </div>

                    <div className="korpus-leipzig-section-stack">
                      <section className="alat-subpanel korpus-leipzig-subpanel">
                        <h3 className="korpus-leipzig-section-heading">Kata dalam Satu Kalimat</h3>
                        {sekalimatQuery.isLoading ? (
                          <p className="alat-panel-caption alat-subpanel-body">Memuat kata dalam satu kalimat ...</p>
                        ) : sekalimatQuery.isError ? (
                          <p className={adalahGalat404(sekalimatQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>
                            {ambilPesanGalat(sekalimatQuery.error, 'Kata dalam satu kalimat tidak dapat dimuat.')}
                          </p>
                        ) : (
                          renderTokenList(sekalimatData, 'Kata pasangan sekalimat belum ditemukan.', handlePilihContoh)
                        )}
                      </section>

                      <section className="alat-subpanel korpus-leipzig-subpanel">
                        <h3 className="korpus-leipzig-section-heading">Kata di Kiri</h3>
                        {tetanggaQuery.isLoading
                          ? <p className="alat-panel-caption alat-subpanel-body">Memuat kata di kiri ...</p>
                          : tetanggaQuery.isError
                          ? <p className={adalahGalat404(tetanggaQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>{ambilPesanGalat(tetanggaQuery.error, 'Kata di kiri tidak dapat dimuat.')}</p>
                          : renderTokenList(tetanggaKiri, 'Belum ada kata di kiri.', handlePilihContoh)}
                      </section>

                      <section className="alat-subpanel korpus-leipzig-subpanel">
                        <h3 className="korpus-leipzig-section-heading">Kata di Kanan</h3>
                        {tetanggaQuery.isLoading
                          ? <p className="alat-panel-caption alat-subpanel-body">Memuat kata di kanan ...</p>
                          : tetanggaQuery.isError
                          ? <p className={adalahGalat404(tetanggaQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>{ambilPesanGalat(tetanggaQuery.error, 'Kata di kanan tidak dapat dimuat.')}</p>
                          : renderTokenList(tetanggaKanan, 'Belum ada kata di kanan.', handlePilihContoh)}
                      </section>
                    </div>
                  </>
                ) : modeAktif === MODE_BANDINGKAN ? (
                  <div className="korpus-leipzig-section-stack">
                    {!kataBanding1Aktif && !kataBanding2Aktif ? (
                      <p className="alat-panel-caption">Masukkan dua kata untuk membandingkan frekuensi dan peringkatnya pada korpus yang sama.</p>
                    ) : (
                      <>
                        <RingkasanBandingKata
                          title={kataBanding1Aktif ? `Kata 1 · ${kataBanding1Aktif}` : 'Kata 1'}
                          info={infoBandingKata1Query.data}
                          queryError={infoBandingKata1Query.error}
                          isLoading={infoBandingKata1Query.isLoading}
                          stats={korpusTerpilih?.stats}
                        />
                        <RingkasanBandingKata
                          title={kataBanding2Aktif ? `Kata 2 · ${kataBanding2Aktif}` : 'Kata 2'}
                          info={infoBandingKata2Query.data}
                          queryError={infoBandingKata2Query.error}
                          isLoading={infoBandingKata2Query.isLoading}
                          stats={korpusTerpilih?.stats}
                        />
                        <RingkasanDeltaBanding
                          summary={ringkasanBanding}
                          statsKiri={infoBandingKata1Query.data}
                          statsKanan={infoBandingKata2Query.data}
                          stats={korpusTerpilih?.stats}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <div className="korpus-leipzig-section-stack">
                    <section className="alat-subpanel korpus-leipzig-subpanel">
                      <h3 className="korpus-leipzig-section-heading">Peringkat Kata</h3>
                      {peringkatQuery.isLoading ? (
                        <p className="alat-panel-caption">Memuat daftar frekuensi kata ...</p>
                      ) : peringkatQuery.isError ? (
                        <p className="alat-error-text">{ambilPesanGalat(peringkatQuery.error, 'Daftar frekuensi kata tidak dapat dimuat.')}</p>
                      ) : dataPeringkat.length ? (
                        <>
                          <div className="korpus-leipzig-summary-card">
                            <p className="korpus-leipzig-summary-line">
                              <span className="korpus-leipzig-summary-metric">{formatRentangData(peringkatQuery.data?.offset, dataPeringkat.length, peringkatQuery.data?.total)}</span>
                            </p>
                          </div>

                          <div className="korpus-leipzig-ranking-list" role="list" aria-label="Daftar frekuensi kata korpus">
                            {dataPeringkat.map((item) => (
                              <article key={`${item.rank}-${item.kata}`} className="korpus-leipzig-ranking-item" role="listitem">
                                <span className="korpus-leipzig-ranking-rank">#{formatAngka.format(item.rank)}</span>
                                <button
                                  type="button"
                                  className="korpus-leipzig-ranking-word"
                                  onClick={() => handlePilihContoh(item.kata)}
                                >
                                  {item.kata}
                                </button>
                                <span className="korpus-leipzig-ranking-frequency">{formatKemunculanRingkas(item.frekuensi)}</span>
                                <span className="korpus-leipzig-ranking-percent">{formatPersenKemunculan(item.frekuensi, korpusTerpilih?.stats)}</span>
                              </article>
                            ))}
                          </div>

                          <div className="korpus-leipzig-paging-row">
                            <button
                              type="button"
                              className="alat-link-secondary"
                              onClick={() => handleGantiHalamanPeringkat(peringkatOffsetAktif - PERINGKAT_LIMIT)}
                              disabled={peringkatOffsetAktif <= 0}
                            >
                              Sebelumnya
                            </button>
                            <button
                              type="button"
                              className="alat-link-secondary"
                              onClick={() => handleGantiHalamanPeringkat(peringkatOffsetAktif + PERINGKAT_LIMIT)}
                              disabled={!peringkatQuery.data?.hasMore}
                            >
                              Berikutnya
                            </button>
                          </div>
                        </>
                      ) : (
                        <p className="alat-empty-text">Belum ada data frekuensi kata untuk korpus ini.</p>
                      )}
                    </section>
                  </div>
                )}
              </section>
            </div>
          </>
        )}
      </div>
    </HalamanPublik>
  );
}

export const __private = {
  ambilPesanGalat,
  adalahGalat404,
  formatTanggalAman,
  formatStatKorpus,
  formatKemunculanRingkas,
  formatPersenKemunculan,
  getKelasFrekuensiLabel,
  formatKelasFrekuensiRingkas,
  adalahTokenTampil,
  saringTokenTampil,
  sorotKataDalamKalimat,
  bangunTataLetakGraf,
  normalisasiMode,
  normalisasiOffset,
  buildPathAnalisisKorpus,
  formatRentangData,
  hitungRingkasanPerbandingan,
};

export default KorpusLeipzig;