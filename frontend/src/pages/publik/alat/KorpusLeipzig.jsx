/**
 * @fileoverview Alat Korpus Leipzig untuk menelusuri kata, contoh kalimat, dan asosiasinya.
 */

import {
  Fragment,
  startTransition,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';
import {
  ambilContohKataLeipzig,
  ambilDaftarKorpusLeipzig,
  ambilGrafKataLeipzig,
  ambilInfoKataLeipzig,
  ambilKookurensiSekalimatLeipzig,
  ambilKookurensiTetanggaLeipzig,
  ambilMiripKonteksLeipzig,
} from '../../../api/apiPublik';

const formatAngka = new Intl.NumberFormat('id-ID');
const formatTanggal = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const PILIHAN_TAMBAH_HASIL = [10, 25, 100];

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
  return `kelas ${value}`;
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

function GrafAsosiasi({ data }) {
  const nodeLayout = useMemo(
    () => bangunTataLetakGraf(saringTokenTampil(data?.nodes || []).filter((item) => item.isCenter || adalahTokenTampil(item.label))),
    [data],
  );
  const nodeMap = useMemo(() => new Map(nodeLayout.map((item) => [item.id, item])), [nodeLayout]);
  const edges = useMemo(
    () => (data?.edges || []).filter((item) => nodeMap.has(item.source) && nodeMap.has(item.target)),
    [data, nodeMap],
  );
  const bobotTepiMaks = Math.max(...edges.map((item) => Number(item?.weight) || 0), 1);

  if (!nodeLayout.length) {
    return <p className="alat-empty-text">Graf asosiasi belum tersedia untuk kata ini.</p>;
  }

  return (
    <div className="korpus-leipzig-graph-shell">
      <svg viewBox="0 0 720 360" className="korpus-leipzig-graph-svg" role="img" aria-label="Graf asosiasi kata Leipzig">
        <defs>
          <linearGradient id="korpus-leipzig-edge" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1d4ed8" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#0f766e" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {edges.map((edge, index) => {
          const source = nodeMap.get(edge.source);
          const target = nodeMap.get(edge.target);
          if (!source || !target) return null;

          return (
            <line
              key={`${edge.source}-${edge.target}-${index}`}
              x1={source.x}
              y1={source.y}
              x2={target.x}
              y2={target.y}
              stroke="url(#korpus-leipzig-edge)"
              strokeWidth={1.25 + (((Number(edge.weight) || 0) / bobotTepiMaks) * 4)}
              strokeLinecap="round"
            />
          );
        })}

        {nodeLayout.map((node) => {
          const label = String(node.label || '');
          const boxWidth = Math.max(node.isCenter ? 88 : 58, (label.length * (node.isCenter ? 8 : 7)) + 20);
          const boxHeight = node.isCenter ? 34 : 28;

          return (
            <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
              <rect
                x={-boxWidth / 2}
                y={-boxHeight / 2}
                width={boxWidth}
                height={boxHeight}
                rx={node.isCenter ? 8 : 6}
                className={node.isCenter ? 'korpus-leipzig-node-box korpus-leipzig-node-box-center' : 'korpus-leipzig-node-box'}
              />
              <text
                x="0"
                y="1"
                textAnchor="middle"
                dominantBaseline="middle"
                className={node.isCenter ? 'korpus-leipzig-node-box-label korpus-leipzig-node-box-label-center' : 'korpus-leipzig-node-box-label'}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
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

function renderTambahHasilControls(currentLimit, total, onTambah) {
  if (!total || currentLimit >= total) return null;

  return (
    <div className="korpus-leipzig-load-more-row">
      {PILIHAN_TAMBAH_HASIL.map((step) => (
        <button
          key={step}
          type="button"
          className="korpus-leipzig-load-more-button"
          onClick={() => onTambah(step)}
          disabled={currentLimit >= total}
        >
          +{step}
        </button>
      ))}
    </div>
  );
}

function renderMiripKonteksList(items = [], emptyText, onSelect) {
  return renderTokenList(
    items,
    emptyText,
    onSelect,
    (item) => `${Math.round((Number(item.skorDice) || 0) * 100)}%`,
  );
}

function renderBentukKata(items = [], onSelect) {
  const daftar = saringTokenTampil(items);

  if (!daftar.length) {
    return null;
  }

  return (
    <p className="korpus-leipzig-summary-links">
      <span className="korpus-leipzig-summary-links-label">Lihat juga:</span>{' '}
      {daftar.map((item, index) => (
        <Fragment key={`${item.kata}-${item.wordId || item.frekuensi}-${index}`}>
          <button
            type="button"
            className="korpus-leipzig-inline-link"
            onClick={() => onSelect(item.kata)}
          >
            {item.kata}
          </button>
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

function KorpusLeipzig() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);
  const [pesanForm, setPesanForm] = useState('');
  const [formKorpusId, setFormKorpusId] = useState(() => searchParams.get('korpus') || '');
  const [formKata, setFormKata] = useState(() => searchParams.get('kata') || '');
  const [contohLimit, setContohLimit] = useState(8);
  const [sekalimatLimit, setSekalimatLimit] = useState(25);
  const [tabHasilAktif, setTabHasilAktif] = useState('kolokasi');

  const kataAktif = String(searchParams.get('kata') || '').trim();
  const korpusAktif = String(searchParams.get('korpus') || '').trim();
  const kataAktifDeferred = useDeferredValue(kataAktif);

  const korpusQuery = useQuery({
    queryKey: ['leipzig', 'daftar-korpus'],
    queryFn: ambilDaftarKorpusLeipzig,
    staleTime: 300000,
    retry: false,
  });

  const daftarKorpus = Array.isArray(korpusQuery.data?.data) ? korpusQuery.data.data : [];
  const korpusDefault = daftarKorpus.find((item) => item.hasSqlite)?.id || daftarKorpus[0]?.id || '';
  const korpusEfektif = korpusAktif || formKorpusId || korpusDefault;

  useEffect(() => {
    setFormKata(kataAktif);
    setFormKorpusId(korpusAktif || korpusDefault);
  }, [kataAktif, korpusAktif, korpusDefault]);

  useEffect(() => {
    setContohLimit(8);
    setSekalimatLimit(25);
    setTabHasilAktif('kolokasi');
  }, [kataAktif, korpusEfektif]);

  const queryDasar = {
    enabled: Boolean(korpusEfektif && kataAktifDeferred),
    retry: false,
    staleTime: 60000,
  };

  const infoKataQuery = useQuery({
    queryKey: ['leipzig', 'kata', korpusEfektif, kataAktifDeferred],
    queryFn: () => ambilInfoKataLeipzig(korpusEfektif, kataAktifDeferred),
    ...queryDasar,
  });

  const contohQuery = useQuery({
    queryKey: ['leipzig', 'contoh', korpusEfektif, kataAktifDeferred, contohLimit],
    queryFn: () => ambilContohKataLeipzig(korpusEfektif, kataAktifDeferred, { limit: contohLimit, offset: 0 }),
    ...queryDasar,
  });

  const sekalimatQuery = useQuery({
    queryKey: ['leipzig', 'sekalimat', korpusEfektif, kataAktifDeferred, sekalimatLimit],
    queryFn: () => ambilKookurensiSekalimatLeipzig(korpusEfektif, kataAktifDeferred, { limit: sekalimatLimit, offset: 0 }),
    ...queryDasar,
  });

  const tetanggaQuery = useQuery({
    queryKey: ['leipzig', 'tetangga', korpusEfektif, kataAktifDeferred],
    queryFn: () => ambilKookurensiTetanggaLeipzig(korpusEfektif, kataAktifDeferred, { limit: 25 }),
    ...queryDasar,
  });

  const grafQuery = useQuery({
    queryKey: ['leipzig', 'graf', korpusEfektif, kataAktifDeferred],
    queryFn: () => ambilGrafKataLeipzig(korpusEfektif, kataAktifDeferred, { limit: 10 }),
    ...queryDasar,
  });

  const miripKonteksQuery = useQuery({
    queryKey: ['leipzig', 'mirip-konteks', korpusEfektif, kataAktifDeferred],
    queryFn: () => ambilMiripKonteksLeipzig(korpusEfektif, kataAktifDeferred, { limit: 12, minimumKonteksSama: 3 }),
    ...queryDasar,
  });

  const sedangMemuatHasil = infoKataQuery.isLoading || sekalimatQuery.isLoading || tetanggaQuery.isLoading || grafQuery.isLoading || miripKonteksQuery.isLoading;
  const sedangMemuatContoh = contohQuery.isLoading;
  const bentukKata = useMemo(
    () => saringTokenTampil(infoKataQuery.data?.bentuk || contohQuery.data?.bentuk || []),
    [infoKataQuery.data?.bentuk, contohQuery.data?.bentuk],
  );
  const contohData = useMemo(() => contohQuery.data?.data || [], [contohQuery.data?.data]);
  const sekalimatData = useMemo(() => saringTokenTampil(sekalimatQuery.data?.data || []), [sekalimatQuery.data?.data]);
  const tetanggaKiri = useMemo(() => saringTokenTampil(tetanggaQuery.data?.kiri || []), [tetanggaQuery.data?.kiri]);
  const tetanggaKanan = useMemo(() => saringTokenTampil(tetanggaQuery.data?.kanan || []), [tetanggaQuery.data?.kanan]);
  const miripKonteksData = useMemo(() => saringTokenTampil(miripKonteksQuery.data?.data || []), [miripKonteksQuery.data?.data]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const kataAman = String(formKata || '').trim();
    const korpusAman = String(formKorpusId || korpusDefault || '').trim();

    if (!korpusAman) {
      setPesanForm('Korpus belum tersedia.');
      return;
    }

    if (!kataAman) {
      setPesanForm('Masukkan kata yang ingin ditelusuri.');
      return;
    }

    setPesanForm('');
    startTransition(() => {
      setSearchParams({ korpus: korpusAman, kata: kataAman });
    });
  };

  const handleBersihkan = () => {
    setPesanForm('');
    setFormKata('');
    startTransition(() => {
      if (formKorpusId || korpusDefault) {
        setSearchParams({ korpus: formKorpusId || korpusDefault });
        return;
      }
      setSearchParams({});
    });
  };

  const handlePilihContoh = (kataContoh) => {
    setPesanForm('');
    setFormKata(kataContoh);
    startTransition(() => {
      setSearchParams({
        korpus: formKorpusId || korpusDefault,
        kata: kataContoh,
      });
    });
  };

  const handleTambahContoh = (step) => {
    setContohLimit((current) => Math.min((contohQuery.data?.total || current + step), current + step));
  };

  const handleTambahSekalimat = (step) => {
    setSekalimatLimit((current) => Math.min((sekalimatQuery.data?.total || current + step), current + step));
  };

  return (
    <HalamanPublik
      judul="Korpus Leipzig"
      deskripsi="Telusuri frekuensi kata, contoh kalimat, tetangga leksikal, dan graf asosiasi dari korpus Leipzig bahasa Indonesia."
      tampilkanJudul={false}
    >
      <div className="alat-page">
        <div className="alat-heading-row">
          <h1 className="alat-page-heading">Korpus Leipzig</h1>
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
              src="/halaman/alat/korpus-leipzig.md"
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
                    <div className="korpus-leipzig-form-row">
                      <div className="korpus-leipzig-field korpus-leipzig-field-grow">
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

                      <div className="korpus-leipzig-field korpus-leipzig-field-select">
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

                    <div className="alat-actions korpus-leipzig-actions">
                      <button type="submit" className="alat-link-primary">Telusuri</button>
                      <button type="button" className="alat-link-secondary" onClick={handleBersihkan}>Bersihkan</button>
                    </div>
                  </form>

                  {pesanForm ? <p className="alat-error-text">{pesanForm}</p> : null}
                  {korpusQuery.isError ? <p className="alat-error-text">{ambilPesanGalat(korpusQuery.error, 'Daftar korpus Leipzig gagal dimuat.')}</p> : null}
                </section>

                <section className="alat-panel korpus-leipzig-examples-panel" aria-labelledby="korpus-leipzig-contoh-title">
                  <div className="alat-panel-header">
                    <h2 id="korpus-leipzig-contoh-title" className="alat-panel-title">Contoh</h2>
                  </div>

                  {!kataAktif ? (
                    <p className="alat-panel-caption">Masukkan kata untuk melihat contoh pemakaian dari korpus terpilih.</p>
                  ) : sedangMemuatContoh ? (
                    <p className="alat-panel-caption">Memuat contoh kalimat dari korpus Leipzig ...</p>
                  ) : contohQuery.isError ? (
                    <p className={adalahGalat404(contohQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>
                      {ambilPesanGalat(contohQuery.error, 'Contoh kalimat tidak dapat dimuat.')}
                    </p>
                  ) : contohData.length ? (
                    <>
                      <ul className="korpus-leipzig-contoh-list">
                        {contohData.map((item) => (
                          <li key={item.sentenceId} className="korpus-leipzig-contoh-item">
                            <span className="korpus-leipzig-contoh-bullet" aria-hidden="true">•</span>
                            <p className="korpus-leipzig-contoh-kalimat">
                              {sorotKataDalamKalimat(item.sentence, bentukKata)}
                              {renderMetaContoh(item)}
                            </p>
                          </li>
                        ))}
                      </ul>
                      {renderTambahHasilControls(contohLimit, contohQuery.data?.total, handleTambahContoh)}
                    </>
                  ) : (
                    <p className="alat-empty-text">Belum ada contoh kalimat yang tersedia.</p>
                  )}
                </section>
              </div>

              <section className="alat-panel korpus-leipzig-right-column" aria-labelledby="korpus-leipzig-output-title">
                <div className="alat-panel-header">
                  <h2 id="korpus-leipzig-output-title" className="alat-panel-title">Hasil</h2>
                </div>

                {!kataAktif ? (
                  <div className="alat-panel-header">
                    <p className="alat-panel-caption">Masukkan kata untuk melihat frekuensi, bentuk kata, contoh kalimat, dan hubungan leksikalnya.</p>
                  </div>
                ) : sedangMemuatHasil ? (
                  <div className="alat-panel-header">
                    <p className="alat-panel-caption">Memuat data kata, contoh kalimat, dan asosiasi dari korpus Leipzig ...</p>
                  </div>
                ) : infoKataQuery.isError ? (
                  <div className="alat-panel-header">
                    <p className={`alat-panel-caption ${adalahGalat404(infoKataQuery.error) ? '' : 'alat-error-text'}`}>
                      {ambilPesanGalat(infoKataQuery.error, 'Data kata Leipzig tidak dapat dimuat.')}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="alat-summary-stack" aria-label="Ringkasan hasil korpus Leipzig">
                      <div className="alat-stat-grid-row">
                        <article className="alat-stat-card">
                          <span className="alat-stat-label">Kemunculan</span>
                          <strong className="alat-stat-value">{formatAngka.format(infoKataQuery.data?.frekuensi || 0)}</strong>
                        </article>
                        <article className="alat-stat-card">
                          <span className="alat-stat-label">Peringkat</span>
                          <strong className="alat-stat-value">{infoKataQuery.data?.rank ? `#${formatAngka.format(infoKataQuery.data.rank)}` : 'N/A'}</strong>
                        </article>
                        <article className="alat-stat-card">
                          <span className="alat-stat-label">Frekuensi</span>
                          <strong className="alat-stat-value">{formatKelasFrekuensiRingkas(infoKataQuery.data?.kelasFrekuensi)}</strong>
                        </article>
                      </div>
                    </div>

                    {renderBentukKata(bentukKata, handlePilihContoh)}

                    <div className="alat-result-pills" role="tablist" aria-label="Kategori hasil korpus Leipzig">
                      <button
                        id="korpus-leipzig-tab-kolokasi"
                        type="button"
                        role="tab"
                        aria-selected={tabHasilAktif === 'kolokasi'}
                        aria-controls="korpus-leipzig-panel-kolokasi"
                        className={`alat-pill-button ${tabHasilAktif === 'kolokasi' ? 'alat-pill-button-active' : ''}`}
                        onClick={() => setTabHasilAktif('kolokasi')}
                      >
                        Kolokasi
                      </button>
                      <button
                        id="korpus-leipzig-tab-kiri"
                        type="button"
                        role="tab"
                        aria-selected={tabHasilAktif === 'kiri'}
                        aria-controls="korpus-leipzig-panel-kiri"
                        className={`alat-pill-button ${tabHasilAktif === 'kiri' ? 'alat-pill-button-active' : ''}`}
                        onClick={() => setTabHasilAktif('kiri')}
                      >
                        Kiri
                      </button>
                      <button
                        id="korpus-leipzig-tab-kanan"
                        type="button"
                        role="tab"
                        aria-selected={tabHasilAktif === 'kanan'}
                        aria-controls="korpus-leipzig-panel-kanan"
                        className={`alat-pill-button ${tabHasilAktif === 'kanan' ? 'alat-pill-button-active' : ''}`}
                        onClick={() => setTabHasilAktif('kanan')}
                      >
                        Kanan
                      </button>
                      <button
                        id="korpus-leipzig-tab-mirip"
                        type="button"
                        role="tab"
                        aria-selected={tabHasilAktif === 'mirip'}
                        aria-controls="korpus-leipzig-panel-mirip"
                        className={`alat-pill-button ${tabHasilAktif === 'mirip' ? 'alat-pill-button-active' : ''}`}
                        onClick={() => setTabHasilAktif('mirip')}
                      >
                        Mirip
                      </button>
                      <button
                        id="korpus-leipzig-tab-graf"
                        type="button"
                        role="tab"
                        aria-selected={tabHasilAktif === 'graf'}
                        aria-controls="korpus-leipzig-panel-graf"
                        className={`alat-pill-button ${tabHasilAktif === 'graf' ? 'alat-pill-button-active' : ''}`}
                        onClick={() => setTabHasilAktif('graf')}
                      >
                        Graf
                      </button>
                    </div>

                    <div className="alat-result-stack">
                      {tabHasilAktif === 'kolokasi' ? (
                        <section id="korpus-leipzig-panel-kolokasi" role="tabpanel" aria-labelledby="korpus-leipzig-tab-kolokasi" className="alat-subpanel korpus-leipzig-subpanel">

                          {sekalimatQuery.isError ? (
                            <p className={adalahGalat404(sekalimatQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>
                              {ambilPesanGalat(sekalimatQuery.error, 'Kookurensi sekalimat tidak dapat dimuat.')}
                            </p>
                          ) : (
                            <>
                              {renderTokenList(sekalimatData, 'Kata pasangan sekalimat belum ditemukan.', handlePilihContoh)}
                              {renderTambahHasilControls(sekalimatLimit, sekalimatQuery.data?.total, handleTambahSekalimat)}
                            </>
                          )}
                        </section>
                      ) : null}

                      {tabHasilAktif === 'kiri' ? (
                        <section id="korpus-leipzig-panel-kiri" role="tabpanel" aria-labelledby="korpus-leipzig-tab-kiri" className="alat-subpanel korpus-leipzig-subpanel">

                          {tetanggaQuery.isError
                            ? <p className={adalahGalat404(tetanggaQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>{ambilPesanGalat(tetanggaQuery.error, 'Tetangga kiri tidak dapat dimuat.')}</p>
                            : renderTokenList(tetanggaKiri, 'Belum ada tetangga kiri.', handlePilihContoh)}
                        </section>
                      ) : null}

                      {tabHasilAktif === 'kanan' ? (
                        <section id="korpus-leipzig-panel-kanan" role="tabpanel" aria-labelledby="korpus-leipzig-tab-kanan" className="alat-subpanel korpus-leipzig-subpanel">

                          {tetanggaQuery.isError
                            ? <p className={adalahGalat404(tetanggaQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>{ambilPesanGalat(tetanggaQuery.error, 'Tetangga kanan tidak dapat dimuat.')}</p>
                            : renderTokenList(tetanggaKanan, 'Belum ada tetangga kanan.', handlePilihContoh)}
                        </section>
                      ) : null}

                      {tabHasilAktif === 'mirip' ? (
                        <section id="korpus-leipzig-panel-mirip" role="tabpanel" aria-labelledby="korpus-leipzig-tab-mirip" className="alat-subpanel korpus-leipzig-subpanel">
                          {miripKonteksQuery.isError ? (
                            <p className={adalahGalat404(miripKonteksQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>
                              {ambilPesanGalat(miripKonteksQuery.error, 'Kata dengan konteks mirip tidak dapat dimuat.')}
                            </p>
                          ) : renderMiripKonteksList(miripKonteksData, 'Belum ada kata dengan konteks mirip untuk kata ini.', handlePilihContoh)}
                        </section>
                      ) : null}

                      {tabHasilAktif === 'graf' ? (
                        <section id="korpus-leipzig-panel-graf" role="tabpanel" aria-labelledby="korpus-leipzig-tab-graf" className="alat-subpanel korpus-leipzig-subpanel">
                          {grafQuery.isError ? (
                            <p className={adalahGalat404(grafQuery.error) ? 'alat-empty-text' : 'alat-error-text'}>
                              {ambilPesanGalat(grafQuery.error, 'Graf asosiasi tidak dapat dimuat.')}
                            </p>
                          ) : (
                            <GrafAsosiasi data={grafQuery.data} />
                          )}
                        </section>
                      ) : null}
                    </div>
                  </>
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
  getKelasFrekuensiLabel,
  formatKelasFrekuensiRingkas,
  adalahTokenTampil,
  saringTokenTampil,
  sorotKataDalamKalimat,
  bangunTataLetakGraf,
};

export default KorpusLeipzig;