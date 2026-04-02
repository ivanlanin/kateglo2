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
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import HalamanPublik from '../../../components/tampilan/HalamanPublik';
import KontenMarkdownStatis from '../../../components/tampilan/KontenMarkdownStatis';
import {
  ambilContohKataLeipzig,
  ambilDaftarKorpusLeipzig,
  ambilInfoKataLeipzig,
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

function buildPathAnalisisKorpus(kata = '') {
  const kataAman = normalisasiSegmenPath(kata);

  if (!kataAman) return PATH_ANALISIS_KORPUS;
  return `${PATH_ANALISIS_KORPUS}/${encodeURIComponent(kataAman)}`;
}

function KorpusLeipzig() {
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const queryParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const [panelInfoTerbuka, setPanelInfoTerbuka] = useState(false);
  const [pesanForm, setPesanForm] = useState('');
  const [tampilkanSumberContoh, setTampilkanSumberContoh] = useState(false);
  const [formKorpusId, setFormKorpusId] = useState(() => normalisasiSegmenPath(params.korpus || queryParams.get('korpus')));
  const [formKata, setFormKata] = useState(() => normalisasiSegmenPath(params.kata || queryParams.get('kata')));
  const [contohLimit, setContohLimit] = useState(10);
  const [sekalimatLimit, setSekalimatLimit] = useState(20);

  const kataAktif = normalisasiSegmenPath(params.kata || queryParams.get('kata'));
  const korpusAktif = normalisasiSegmenPath(params.korpus || queryParams.get('korpus'));
  const kataAktifDeferred = useDeferredValue(kataAktif);

  const korpusQuery = useQuery({
    queryKey: ['leipzig', 'daftar-korpus'],
    queryFn: ambilDaftarKorpusLeipzig,
    staleTime: 300000,
    retry: false,
  });

  const daftarKorpus = Array.isArray(korpusQuery.data?.data) ? korpusQuery.data.data : [];
  const korpusDefault = daftarKorpus.find((item) => item.hasSqlite)?.id || daftarKorpus[0]?.id || '';
  const korpusEfektif = formKorpusId || korpusAktif || korpusDefault;
  const pathKanonis = kataAktif
    ? buildPathAnalisisKorpus(kataAktif)
    : PATH_ANALISIS_KORPUS;

  useEffect(() => {
    setFormKata(kataAktif);
  }, [kataAktif]);

  useEffect(() => {
    setFormKorpusId((current) => {
      if (korpusAktif) return korpusAktif;
      if (current) return current;
      return korpusDefault;
    });
  }, [korpusAktif, korpusDefault]);

  useEffect(() => {
    const memakaiPathLama = location.pathname.startsWith('/alat/korpus-leipzig');
    const adaQueryLegacy = Boolean(location.search);

    if (!memakaiPathLama && !adaQueryLegacy && !params.korpus) return;
    if (location.pathname === pathKanonis && !location.search) return;

    startTransition(() => {
      navigate(pathKanonis, { replace: true });
    });
  }, [location.pathname, location.search, navigate, params.korpus, pathKanonis]);

  useEffect(() => {
    setContohLimit(10);
    setSekalimatLimit(20);
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
    enabled: queryDasar.enabled,
  });

  const tetanggaQuery = useQuery({
    queryKey: ['leipzig', 'tetangga', korpusEfektif, kataAktifDeferred],
    queryFn: () => ambilKookurensiTetanggaLeipzig(korpusEfektif, kataAktifDeferred, { limit: 20 }),
    ...queryDasar,
    enabled: queryDasar.enabled,
  });

  const sedangMemuatRingkasan = infoKataQuery.isLoading;
  const sedangMemuatContoh = contohQuery.isLoading;
  const bentukKata = useMemo(
    () => saringTokenTampil(infoKataQuery.data?.bentuk || contohQuery.data?.bentuk || []),
    [infoKataQuery.data?.bentuk, contohQuery.data?.bentuk],
  );
  const contohData = useMemo(() => contohQuery.data?.data || [], [contohQuery.data?.data]);
  const sekalimatData = useMemo(() => saringTokenTampil(sekalimatQuery.data?.data || []), [sekalimatQuery.data?.data]);
  const tetanggaKiri = useMemo(() => saringTokenTampil(tetanggaQuery.data?.kiri || []), [tetanggaQuery.data?.kiri]);
  const tetanggaKanan = useMemo(() => saringTokenTampil(tetanggaQuery.data?.kanan || []), [tetanggaQuery.data?.kanan]);

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
      navigate(buildPathAnalisisKorpus(kataAman));
    });
  };

  const handleBersihkan = () => {
    setPesanForm('');
    setFormKata('');
    startTransition(() => {
      navigate(PATH_ANALISIS_KORPUS);
    });
  };

  const handlePilihContoh = (kataContoh) => {
    setPesanForm('');
    setFormKata(kataContoh);
    startTransition(() => {
      navigate(buildPathAnalisisKorpus(kataContoh));
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
                              {tampilkanSumberContoh ? renderMetaContoh(item) : null}
                            </p>
                          </li>
                        ))}
                      </ul>
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
                    <p className="alat-panel-caption">Masukkan kata untuk melihat kemunculan, peringkat, contoh kalimat, dan hubungan leksikalnya.</p>
                  </div>
                ) : sedangMemuatRingkasan ? (
                  <div className="alat-panel-header">
                    <p className="alat-panel-caption">Memuat ringkasan kata dari korpus Leipzig ...</p>
                  </div>
                ) : infoKataQuery.isError ? (
                  <div className="alat-panel-header">
                    <p className={`alat-panel-caption ${adalahGalat404(infoKataQuery.error) ? '' : 'alat-error-text'}`}>
                      {ambilPesanGalat(infoKataQuery.error, 'Data kata Leipzig tidak dapat dimuat.')}
                    </p>
                  </div>
                ) : (
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
  buildPathAnalisisKorpus,
};

export default KorpusLeipzig;