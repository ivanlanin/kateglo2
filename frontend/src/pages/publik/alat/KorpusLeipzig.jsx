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
import { useQueries, useQuery, useQueryClient } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import Paginasi from '../../../components/navigasi/Paginasi';
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
const KATA_BANDING_KEYS = ['kata1', 'kata2', 'kata3', 'kata4'];
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

function formatPersenPerbandingan(frekuensi, totalFrekuensiBanding = 0) {
  const jumlahKemunculan = Number(frekuensi) || 0;
  const total = Number(totalFrekuensiBanding) || 0;

  if (!total) {
    return 'N/A';
  }

  return `${formatPersen.format((jumlahKemunculan / total) * 100)}%`;
}

function formatPersenKemunculanTanpaSimbol(frekuensi, stats = {}) {
  const persen = formatPersenKemunculan(frekuensi, stats);
  return persen.endsWith('%') ? persen.slice(0, -1) : persen;
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

function ambilDaftarKataBanding(queryParams) {
  return KATA_BANDING_KEYS.map((key) => normalisasiSegmenPath(queryParams.get(key)));
}

function buildPathAnalisisKorpus({
  mode = MODE_TELUSURI,
  korpus = '',
  kata = '',
  kata1 = '',
  kata2 = '',
  kata3 = '',
  kata4 = '',
  kataBanding = [],
  offset = 0,
} = {}) {
  const modeAman = normalisasiMode(mode);
  const korpusAman = normalisasiSegmenPath(korpus);
  const kataAman = normalisasiSegmenPath(kata);
  const kataBandingAman = KATA_BANDING_KEYS.map((_, index) => normalisasiSegmenPath(kataBanding[index] || [kata1, kata2, kata3, kata4][index]));
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

  kataBandingAman.forEach((value, index) => {
    if (value) {
      params.set(KATA_BANDING_KEYS[index], value);
    }
  });

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
  emptyText = 'Belum ada contoh kalimat yang tersedia.',
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
        <p className="alat-empty-text">{emptyText}</p>
      )}
    </>
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
  const kataBandingAktifList = useMemo(() => ambilDaftarKataBanding(queryParams), [queryParams]);
  const korpusAktif = normalisasiSegmenPath(queryParams.get('korpus') || legacyKorpus);
  const peringkatOffsetAktif = normalisasiOffset(queryParams.get('offset'));
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);
  const [pesanForm, setPesanForm] = useState('');
  const [tampilkanSumberContohCari, setTampilkanSumberContohCari] = useState(false);
  const [tampilkanSumberContohBanding, setTampilkanSumberContohBanding] = useState(() => KATA_BANDING_KEYS.map(() => false));
  const [formMode, setFormMode] = useState(() => modeAktif);
  const [formKorpusId, setFormKorpusId] = useState(() => korpusAktif);
  const [formKata, setFormKata] = useState(() => kataAktif);
  const [formKataBanding, setFormKataBanding] = useState(() => kataBandingAktifList);
  const [contohLimit, setContohLimit] = useState(10);
  const [contohBandingLimit, setContohBandingLimit] = useState(5);
  const [sekalimatLimit, setSekalimatLimit] = useState(20);
  const kataAktifDeferred = useDeferredValue(kataAktif);
  const kataBandingDeferredList = useDeferredValue(kataBandingAktifList);

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
    kataBanding: kataBandingAktifList,
    offset: peringkatOffsetAktif,
  });

  useEffect(() => {
    setFormMode(modeAktif);
  }, [modeAktif]);

  useEffect(() => {
    setFormKata(kataAktif);
  }, [kataAktif]);

  useEffect(() => {
    setFormKataBanding(kataBandingAktifList);
  }, [kataBandingAktifList]);

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
  }, [modeAktif, kataAktif, kataBandingAktifList, korpusDataAktif]);

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

  const infoBandingQueries = useQueries({
    queries: kataBandingDeferredList.map((kataBanding, index) => ({
      queryKey: ['leipzig', 'bandingkan', 'kata', KATA_BANDING_KEYS[index], korpusDataAktif, kataBanding],
      queryFn: () => ambilInfoKataLeipzig(korpusDataAktif, kataBanding),
      ...queryDasar,
      enabled: bandingkanEnabled && Boolean(kataBanding),
    })),
  });

  const contohBandingQueries = useQueries({
    queries: kataBandingDeferredList.map((kataBanding, index) => ({
      queryKey: ['leipzig', 'bandingkan', 'contoh', KATA_BANDING_KEYS[index], korpusDataAktif, kataBanding, contohBandingLimit],
      queryFn: () => ambilContohKataLeipzig(korpusDataAktif, kataBanding, { limit: contohBandingLimit, offset: 0 }),
      ...queryDasar,
      enabled: bandingkanEnabled && Boolean(kataBanding),
    })),
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
  const bentukBandingList = kataBandingAktifList.map((_, index) => saringTokenTampil(infoBandingQueries[index]?.data?.bentuk || contohBandingQueries[index]?.data?.bentuk || []));
  const tampilkanPanelContohCari = modeAktif === MODE_TELUSURI && Boolean(kataAktif);
  const tampilkanPanelContohBanding = modeAktif === MODE_BANDINGKAN
    ? kataBandingAktifList.map((kata) => Boolean(kata))
    : KATA_BANDING_KEYS.map(() => false);
  const dataPeringkat = useMemo(() => peringkatQuery.data?.data || [], [peringkatQuery.data?.data]);
  const jumlahKataBandingAktif = kataBandingAktifList.filter(Boolean).length;
  const sedangMemuatPerbandingan = infoBandingQueries.some((query) => query.isLoading);
  const galatPerbandingan = kataBandingAktifList
    .map((kata, index) => {
      const query = infoBandingQueries[index];
      if (!kata || !query?.isError) return null;

      return {
        kata,
        error: query.error,
      };
    })
    .filter(Boolean);
  const dataPerbandingan = kataBandingAktifList
    .map((kata, index) => {
      const data = infoBandingQueries[index]?.data;
      if (!kata || !data) return null;

      return {
        kataInput: kata,
        kata: data.kata || kata,
        frekuensi: Number(data.frekuensi) || 0,
        rank: Number(data.rank) || null,
      };
    })
    .filter(Boolean)
    .sort((kiri, kanan) => {
      if (kanan.frekuensi !== kiri.frekuensi) {
        return kanan.frekuensi - kiri.frekuensi;
      }

      if ((kiri.rank || Number.MAX_SAFE_INTEGER) !== (kanan.rank || Number.MAX_SAFE_INTEGER)) {
        return (kiri.rank || Number.MAX_SAFE_INTEGER) - (kanan.rank || Number.MAX_SAFE_INTEGER);
      }

      return kiri.kata.localeCompare(kanan.kata, 'id');
    });
  const totalFrekuensiPerbandingan = dataPerbandingan.reduce((total, item) => total + item.frekuensi, 0);

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
      setFormKata(formKataBanding.find((item) => String(item || '').trim()) || formKata);
    }

    if (modeBaru === MODE_BANDINGKAN) {
      setFormKataBanding((current) => {
        const berikutnya = [...current];
        if (!berikutnya[0]) {
          berikutnya[0] = formKata;
        }
        return berikutnya;
      });
    }

    setFormMode(modeBaru);
  };

  const handleUbahKataBanding = (index, value) => {
    setFormKataBanding((current) => current.map((item, itemIndex) => (itemIndex === index ? value : item)));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const modeAman = normalisasiMode(formMode);
    const korpusAman = String(formKorpusId || korpusDefault || '').trim();
    const kataAman = String(formKata || '').trim();
    const kataBandingAman = formKataBanding.map((item) => String(item || '').trim());
    const jumlahKataBanding = kataBandingAman.filter(Boolean).length;

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
      if (jumlahKataBanding < 2) {
        setPesanForm('Masukkan minimal dua kata yang ingin dibandingkan.');
        return;
      }
    }

    setPesanForm('');
    startTransition(() => {
      navigate(buildPathAnalisisKorpus({
        mode: modeAman,
        korpus: korpusAman,
        kata: kataAman,
        kataBanding: kataBandingAman,
        offset: 0,
      }));
    });
  };

  const handleBersihkan = () => {
    setPesanForm('');
    setFormKata('');
    setFormKataBanding(KATA_BANDING_KEYS.map(() => ''));
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
                          <label htmlFor="korpus-leipzig-kata" className="korpus-leipzig-field-label">Kata</label>
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
                      <div className="korpus-leipzig-form-row korpus-leipzig-form-row-4">
                        {formKataBanding.map((value, index) => (
                          <div key={KATA_BANDING_KEYS[index]} className="korpus-leipzig-field korpus-leipzig-field-grow">
                            <label htmlFor={`korpus-leipzig-${KATA_BANDING_KEYS[index]}`} className="korpus-leipzig-field-label">{`Kata ${index + 1}`}</label>
                            <input
                              id={`korpus-leipzig-${KATA_BANDING_KEYS[index]}`}
                              type="text"
                              value={value}
                              className="korpus-leipzig-input"
                              placeholder={index === 0 ? 'Misalnya: subjek' : index === 1 ? 'Misalnya: subyek' : 'Opsional'}
                              aria-label={`Kata ke-${index + 1} yang ingin dibandingkan`}
                              onChange={(event) => handleUbahKataBanding(index, event.target.value)}
                            />
                          </div>
                        ))}
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

                {tampilkanPanelContohCari ? (
                  <section className="alat-panel korpus-leipzig-examples-panel" aria-labelledby="korpus-leipzig-contoh-title">
                    <div className="alat-panel-header alat-panel-header-split">
                      <h2 id="korpus-leipzig-contoh-title" className="alat-panel-title">Contoh</h2>
                      <button
                        type="button"
                        className="alat-link-secondary alat-panel-action-button"
                        onClick={() => setTampilkanSumberContohCari((value) => !value)}
                      >
                        {tampilkanSumberContohCari ? 'Sembunyikan sumber' : 'Tampilkan sumber'}
                      </button>
                    </div>

                    <PanelContohKata
                      kataAktif={kataAktif}
                      query={contohQuery}
                      bentuk={bentukKata}
                      tampilkanSumberContoh={tampilkanSumberContohCari}
                    />
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
                          <strong className="alat-stat-value korpus-leipzig-stat-value-word">{infoKataQuery.data?.kata || kataAktif || 'N/A'}</strong>
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
                    {jumlahKataBandingAktif < 2 ? (
                      <p className="alat-panel-caption">Masukkan minimal dua kata untuk membandingkan frekuensi dan peringkatnya pada korpus yang sama.</p>
                    ) : (
                      <>
                        {sedangMemuatPerbandingan ? <p className="alat-panel-caption">Memuat statistik kata ...</p> : null}
                        {galatPerbandingan.map((item) => (
                          <p key={item.kata} className={adalahGalat404(item.error) ? 'alat-empty-text' : 'alat-error-text'}>
                            {ambilPesanGalat(item.error, `Statistik untuk "${item.kata}" tidak dapat dimuat.`)}
                          </p>
                        ))}
                        {dataPerbandingan.length ? (
                          <div className="alat-table-wrap korpus-leipzig-ranking-table-wrap">
                            <table className="alat-data-table">
                              <thead>
                                <tr>
                                  <th className="korpus-leipzig-ranking-col-rank">#</th>
                                  <th>Kata</th>
                                  <th className="korpus-leipzig-ranking-col-number">Kemunculan</th>
                                  <th className="korpus-leipzig-ranking-col-number">Urutan</th>
                                  <th className="korpus-leipzig-ranking-col-number">Persentase</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dataPerbandingan.map((item, index) => (
                                  <tr key={`${item.kataInput}-${item.kata}-${item.rank || index}`}>
                                    <td className="korpus-leipzig-ranking-col-rank">{`${index + 1}.`}</td>
                                    <td>
                                      <button
                                        type="button"
                                        className="korpus-leipzig-ranking-word"
                                        onClick={() => handlePilihContoh(item.kata)}
                                      >
                                        {item.kata}
                                      </button>
                                    </td>
                                    <td className="korpus-leipzig-ranking-col-number">{formatKemunculanRingkas(item.frekuensi)}</td>
                                    <td className="korpus-leipzig-ranking-col-number">{item.rank ? formatAngka.format(item.rank) : 'N/A'}</td>
                                    <td className="korpus-leipzig-ranking-col-number">{formatPersenPerbandingan(item.frekuensi, totalFrekuensiPerbandingan)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : null}
                        {!sedangMemuatPerbandingan && !dataPerbandingan.length && !galatPerbandingan.length ? (
                          <p className="alat-empty-text">Belum ada data perbandingan yang dapat ditampilkan.</p>
                        ) : null}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="korpus-leipzig-section-stack">
                    {peringkatQuery.isLoading ? (
                      <p className="alat-panel-caption">Memuat daftar frekuensi kata ...</p>
                    ) : peringkatQuery.isError ? (
                      <p className="alat-error-text">{ambilPesanGalat(peringkatQuery.error, 'Daftar frekuensi kata tidak dapat dimuat.')}</p>
                    ) : dataPeringkat.length ? (
                      <>
                        <Paginasi
                          total={peringkatQuery.data?.total || 0}
                          limit={PERINGKAT_LIMIT}
                          offset={peringkatOffsetAktif}
                          onChange={handleGantiHalamanPeringkat}
                          maxOffset={null}
                          className="korpus-leipzig-pagination"
                        />
                        <div className="alat-table-wrap korpus-leipzig-ranking-table-wrap">
                          <table className="alat-data-table">
                            <thead>
                              <tr>
                                <th className="korpus-leipzig-ranking-col-rank">#</th>
                                <th>Kata</th>
                                <th className="korpus-leipzig-ranking-col-number">Jumlah</th>
                                <th className="korpus-leipzig-ranking-col-number">%Frekuensi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dataPeringkat.map((item) => (
                                <tr key={`${item.rank}-${item.kata}`}>
                                  <td className="korpus-leipzig-ranking-col-rank">{String(item.rank)}.</td>
                                  <td>
                                    <button
                                      type="button"
                                      className="korpus-leipzig-ranking-word"
                                      onClick={() => handlePilihContoh(item.kata)}
                                    >
                                      {item.kata}
                                    </button>
                                  </td>
                                  <td className="korpus-leipzig-ranking-col-number">{formatKemunculanRingkas(item.frekuensi)}</td>
                                  <td className="korpus-leipzig-ranking-col-number">{formatPersenKemunculanTanpaSimbol(item.frekuensi, korpusTerpilih?.stats)}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <p className="alat-empty-text">Belum ada data frekuensi kata untuk korpus ini.</p>
                    )}
                  </div>
                )}
              </section>
            </div>

            {tampilkanPanelContohBanding.some(Boolean) ? (
              <div className="korpus-leipzig-compare-examples-grid">
                {kataBandingAktifList.map((kataBanding, index) => (tampilkanPanelContohBanding[index] ? (
                  <section key={KATA_BANDING_KEYS[index]} className="alat-panel korpus-leipzig-examples-panel" aria-labelledby={`korpus-leipzig-contoh-${KATA_BANDING_KEYS[index]}-title`}>
                    <div className="alat-panel-header alat-panel-header-split">
                      <h2 id={`korpus-leipzig-contoh-${KATA_BANDING_KEYS[index]}-title`} className="alat-panel-title">{`Contoh "${kataBanding}"`}</h2>
                      <button
                        type="button"
                        className="alat-link-secondary alat-panel-action-button"
                        onClick={() => setTampilkanSumberContohBanding((current) => current.map((value, itemIndex) => (itemIndex === index ? !value : value)))}
                      >
                        {tampilkanSumberContohBanding[index] ? 'Sembunyikan sumber' : 'Tampilkan sumber'}
                      </button>
                    </div>
                    <PanelContohKata
                      kataAktif={kataBanding}
                      query={contohBandingQueries[index]}
                      bentuk={bentukBandingList[index]}
                      tampilkanSumberContoh={tampilkanSumberContohBanding[index]}
                      emptyText={`Belum ada contoh untuk kata ${index + 1}.`}
                    />
                  </section>
                ) : null))}
              </div>
            ) : null}
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
  formatPersenPerbandingan,
  formatPersenKemunculanTanpaSimbol,
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