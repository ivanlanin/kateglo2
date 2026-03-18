/**
 * @fileoverview Halaman redaksi kurasi WordNet — daftar sinset + detail panel
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarSinsetAdmin,
  useDetailSinsetAdmin,
  useAutocompleteLemaSinset,
  useKandidatMaknaSinset,
  useSimpanSinset,
  useSimpanPemetaanLema,
  useTambahLemaSinset,
  useStatistikSinsetAdmin,
} from '../../../api/apiAdmin';
import HalamanAdmin from '../../../components/tampilan/HalamanAdmin';
import FilterCariAdmin from '../../../components/formulir/FilterCariAdmin';
import TabelAdmin from '../../../components/data/TabelAdmin';
import PanelGeser from '../../../components/panel/PanelGeser';
import {
  useFormPanel,
  TextareaField,
  SelectField,
  FormFooter,
  PesanForm,
} from '../../../components/formulir/FormulirAdmin';
import usePencarianAdmin from '../../../hooks/usePencarianAdmin';
import { getApiErrorMessage } from '../../../utils/adminUtils';
import { potongTeks } from '../../../utils/adminUtils';

// ─── Constants ───────────────────────────────────────────────────────────────

const NAMA_KELAS = { n: 'nomina', v: 'verba', a: 'adjektiva', r: 'adverbia' };
const WARNA_STATUS = {
  draf: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  tinjau: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  terverifikasi: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
};

const opsiStatus = [
  { value: '', label: '— Status —' },
  { value: 'draf', label: 'Draf' },
  { value: 'tinjau', label: 'Tinjau' },
  { value: 'terverifikasi', label: 'Terverifikasi' },
];

const opsiKelasKata = [
  { value: '', label: '— Kelas Kata —' },
  { value: 'n', label: 'Nomina' },
  { value: 'v', label: 'Verba' },
  { value: 'a', label: 'Adjektiva' },
  { value: 'r', label: 'Adverbia' },
];

const opsiPemetaan = [
  { value: '', label: '— Pemetaan —' },
  { value: '1', label: 'Ada pemetaan' },
  { value: '0', label: 'Belum dipetakan' },
];

const nilaiAwal = { definisi_id: '', contoh_id: [], status: 'draf', catatan: '' };

function LencanaStatusSinset({ status }) {
  return (
    <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${WARNA_STATUS[status] || WARNA_STATUS.draf}`}>
      {status}
    </span>
  );
}

const kolom = [
  { key: 'id', label: 'ID', render: (item) => <span className="font-mono text-xs">{item.id}</span> },
  {
    key: 'kelas_kata',
    label: 'Kelas',
    render: (item) => <span className="text-xs">{NAMA_KELAS[item.kelas_kata] || item.kelas_kata}</span>,
  },
  {
    key: 'lema_id',
    label: 'Lema ID',
    render: (item) => <span className="text-sm">{potongTeks(item.lema_id || '—', 40)}</span>,
  },
  {
    key: 'lema_en',
    label: 'Lema EN',
    render: (item) => <span className="text-xs text-gray-500">{(item.lema_en || []).slice(0, 3).join(', ')}</span>,
  },
  {
    key: 'definisi_en',
    label: 'Definisi EN',
    render: (item) => <span className="text-xs text-gray-500">{potongTeks(item.definisi_en || '—', 50)}</span>,
  },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <LencanaStatusSinset status={item.status} />,
  },
  {
    key: 'pemetaan',
    label: 'Pemetaan',
    render: (item) => {
      const j = Number(item.jumlah_lema) || 0;
      const t = Number(item.lema_terpetakan) || 0;
      if (j === 0) return <span className="text-xs text-gray-400">—</span>;
      const warna = t === j ? 'text-green-600' : t > 0 ? 'text-amber-600' : 'text-gray-400';
      return <span className={`text-xs font-medium ${warna}`}>{t}/{j}</span>;
    },
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

function SinsetAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const {
    cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit,
    currentPage, cursor, direction, lastPage,
  } = usePencarianAdmin(50);

  const idDariPath = idParam || null;
  const sedangMenutupDariPath = useRef(false);

  const [filterStatusDraft, setFilterStatusDraft] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterKelasDraft, setFilterKelasDraft] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterPemetaanDraft, setFilterPemetaanDraft] = useState('');
  const [filterPemetaan, setFilterPemetaan] = useState('');

  // ─── Queries ───────────────────────────────────────────────────────────────

  const { data: resp, isLoading, isError } = useDaftarSinsetAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    status: filterStatus,
    kelas_kata: filterKelas,
    ada_pemetaan: filterPemetaan,
  });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const { data: detailResp, isLoading: isDetailLoading } = useDetailSinsetAdmin(idDariPath);
  const { data: statsResp } = useStatistikSinsetAdmin({});

  // ─── Form state ────────────────────────────────────────────────────────────

  const panel = useFormPanel(nilaiAwal);
  const simpanSinset = useSimpanSinset();
  const simpanLema = useSimpanPemetaanLema();
  const tambahLema = useTambahLemaSinset();
  const [pesan, setPesan] = useState({ error: '', sukses: '' });
  const [lemaAktif, setLemaAktif] = useState(null); // lema ID for candidate mapping

  // ─── Effects ───────────────────────────────────────────────────────────────

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    panel.bukaUntukSunting({
      ...detail,
      definisi_id: detail.definisi_id || '',
      contoh_id: detail.contoh_id || [],
      status: detail.status || 'draf',
      catatan: detail.catatan || '',
    });
  }, [detailResp, idDariPath, isDetailLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
  }, [idDariPath]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    setLemaAktif(null);
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/sinset', { replace: true });
    }
  };

  const bukaSuntingDariDaftar = (item) => {
    if (!item?.id) return;
    setPesan({ error: '', sukses: '' });
    setLemaAktif(null);
    navigate(`/redaksi/sinset/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    simpanSinset.mutate(
      {
        id: panel.data.id,
        definisi_id: panel.data.definisi_id || null,
        contoh_id: panel.data.contoh_id,
        status: panel.data.status,
        catatan: panel.data.catatan || null,
      },
      {
        onSuccess: () => setPesan({ error: '', sukses: 'Tersimpan!' }),
        onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
      }
    );
  };

  const handleCari = () => {
    setFilterStatus(filterStatusDraft);
    setFilterKelas(filterKelasDraft);
    setFilterPemetaan(filterPemetaanDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterStatusDraft('');
    setFilterStatus('');
    setFilterKelasDraft('');
    setFilterKelas('');
    setFilterPemetaanDraft('');
    setFilterPemetaan('');
    hapusCari();
  };

  // ─── Stats summary ────────────────────────────────────────────────────────

  const stats = statsResp?.data;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <HalamanAdmin judul="Sinset">
      {stats && <StatistikRingkas stats={stats} />}

      <FilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari ID, lema, definisi …"
        filters={[
          {
            key: 'status',
            value: filterStatusDraft,
            onChange: setFilterStatusDraft,
            options: opsiStatus,
            ariaLabel: 'Filter status sinset',
          },
          {
            key: 'kelas_kata',
            value: filterKelasDraft,
            onChange: setFilterKelasDraft,
            options: opsiKelasKata,
            ariaLabel: 'Filter kelas kata',
          },
          {
            key: 'ada_pemetaan',
            value: filterPemetaanDraft,
            onChange: setFilterPemetaanDraft,
            options: opsiPemetaan,
            ariaLabel: 'Filter pemetaan',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
        kunciId="id"
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={`Sinset: ${panel.data.id || ''}`}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        {panel.data.id && (
          <DetailSinsetPanel
            data={panel.data}
            onChange={panel.ubahField}
            onSimpan={handleSimpan}
            onBatal={tutupPanel}
            isPending={simpanSinset.isPending}
            lemaAktif={lemaAktif}
            setLemaAktif={setLemaAktif}
            simpanLema={simpanLema}
            tambahLema={tambahLema}
          />
        )}
      </PanelGeser>
    </HalamanAdmin>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatistikRingkas({ stats }) {
  const { sinset, lema } = stats;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
      <KartuStatistik label="Total Sinset" nilai={sinset.total.toLocaleString()} />
      <KartuStatistik label="Draf" nilai={sinset.draf.toLocaleString()} warna="text-gray-600" />
      <KartuStatistik label="Tinjau" nilai={sinset.tinjau.toLocaleString()} warna="text-amber-600" />
      <KartuStatistik label="Terverifikasi" nilai={sinset.terverifikasi.toLocaleString()} warna="text-green-600" />
      <KartuStatistik label="Lema Indonesia" nilai={lema.total.toLocaleString()} />
      <KartuStatistik label="Lema Terpetakan" nilai={lema.terpetakan.toLocaleString()} warna="text-blue-600" />
      <KartuStatistik label="Lema Terverifikasi" nilai={lema.terverifikasi.toLocaleString()} warna="text-green-600" />
      <KartuStatistik label="Relasi" nilai={stats.relasi.toLocaleString()} />
    </div>
  );
}

function KartuStatistik({ label, nilai, warna = 'text-gray-900 dark:text-gray-100' }) {
  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className={`text-lg font-semibold ${warna}`}>{nilai}</p>
    </div>
  );
}

function DetailSinsetPanel({ data, onChange, onSimpan, onBatal, isPending, lemaAktif, setLemaAktif, simpanLema, tambahLema }) {
  return (
    <div className="space-y-5">
      {/* Info dasar */}
      <div className="space-y-1 text-sm">
        <div className="flex gap-2">
          <span className="text-gray-500 w-24 shrink-0">ID:</span>
          <span className="font-mono">{data.id}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500 w-24 shrink-0">Kelas Kata:</span>
          <span>{NAMA_KELAS[data.kelas_kata] || data.kelas_kata}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500 w-24 shrink-0">ILI:</span>
          <span className="font-mono text-xs">{data.ili_id || '—'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500 w-24 shrink-0">Lema EN:</span>
          <span>{(data.lema_en || []).join(', ') || '—'}</span>
        </div>
        <div className="flex gap-2">
          <span className="text-gray-500 w-24 shrink-0">Definisi EN:</span>
          <span className="text-gray-700 dark:text-gray-300">{data.definisi_en || '—'}</span>
        </div>
        {data.contoh_en?.length > 0 && (
          <div className="flex gap-2">
            <span className="text-gray-500 w-24 shrink-0">Contoh EN:</span>
            <span className="text-gray-500 italic text-xs">{data.contoh_en.join('; ')}</span>
          </div>
        )}
      </div>

      <hr className="dark:border-gray-700" />

      {/* Form edit Indonesia */}
      <TextareaField
        label="Definisi Indonesia"
        name="definisi_id"
        value={data.definisi_id || ''}
        onChange={onChange}
        rows={3}
        placeholder="Tulis definisi dalam bahasa Indonesia…"
      />

      <SelectField
        label="Status"
        name="status"
        value={data.status}
        onChange={onChange}
        options={opsiStatus.filter((o) => o.value)}
      />

      <TextareaField
        label="Catatan Redaksi"
        name="catatan"
        value={data.catatan || ''}
        onChange={onChange}
        rows={2}
        placeholder="Catatan internal…"
      />

      <FormFooter
        onSimpan={onSimpan}
        onBatal={onBatal}
        isPending={isPending}
        modeTambah={false}
      />

      <hr className="dark:border-gray-700" />

      {/* Lema Indonesia */}
      <DaftarLema
        lema={data.lema || []}
        lemaAktif={lemaAktif}
        setLemaAktif={setLemaAktif}
        sinsetId={data.id}
        simpanLema={simpanLema}
        tambahLema={tambahLema}
      />

      {/* Relasi */}
      {(data.relasiKeluar?.length > 0 || data.relasiMasuk?.length > 0) && (
        <>
          <hr className="dark:border-gray-700" />
          <DaftarRelasi relasiKeluar={data.relasiKeluar} relasiMasuk={data.relasiMasuk} />
        </>
      )}
    </div>
  );
}

function TambahLemaForm({ sinsetId, tambahLema }) {
  const [inputEntri, setInputEntri] = useState('');
  const [entriTerpilih, setEntriTerpilih] = useState(null);
  const [tampilSaran, setTampilSaran] = useState(false);
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const { data: respSaran, isLoading: isSaranLoading } = useAutocompleteLemaSinset({
    sinsetId,
    q: inputEntri,
  });
  const daftarSaran = respSaran?.data || [];

  const pilihEntri = (item) => {
    setEntriTerpilih(item);
    setInputEntri(item.entri);
    setTampilSaran(false);
    setPesan({ error: '', sukses: '' });
  };

  const handleUbahInput = (value) => {
    setInputEntri(value);
    setTampilSaran(true);
    setPesan({ error: '', sukses: '' });
    if (!entriTerpilih) return;
    if (String(value).trim() !== entriTerpilih.entri) {
      setEntriTerpilih(null);
    }
  };

  const handleTambah = () => {
    if (!entriTerpilih?.id) {
      setPesan({ error: 'Pilih entri kamus dari daftar saran terlebih dahulu.', sukses: '' });
      return;
    }

    tambahLema.mutate(
      { sinsetId, entri_id: entriTerpilih.id },
      {
        onSuccess: () => {
          setPesan({ error: '', sukses: 'Lema ditambahkan.' });
          setInputEntri('');
          setEntriTerpilih(null);
          setTampilSaran(false);
        },
        onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menambah lema Indonesia.'), sukses: '' }),
      }
    );
  };

  return (
    <div className="space-y-2 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <div>
        <h4 className="text-sm font-semibold">Tambah lema Indonesia</h4>
        <p className="text-xs text-gray-500 dark:text-gray-400">Pilih entri kamus yang sudah ada, lalu tambahkan ke sinset ini.</p>
      </div>

      <div className="relative">
        <input
          type="text"
          value={inputEntri}
          onChange={(e) => handleUbahInput(e.target.value)}
          onFocus={() => setTampilSaran(true)}
          onBlur={() => setTimeout(() => setTampilSaran(false), 120)}
          placeholder="Cari entri kamus …"
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800"
        />

        {tampilSaran && inputEntri.trim().length > 0 && (
          <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
            {isSaranLoading ? (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari entri …</p>
            ) : daftarSaran.length === 0 ? (
              <p className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada entri cocok</p>
            ) : (
              daftarSaran.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pilihEntri(item)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <span className="font-medium text-gray-800 dark:text-gray-100">{item.entri}</span>
                  <span className="ml-2 text-gray-500 dark:text-gray-400">({item.indeks})</span>
                  {item.jenis && <span className="ml-2 text-gray-400 dark:text-gray-500">{item.jenis}</span>}
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {entriTerpilih && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Entri terpilih: <strong>{entriTerpilih.entri}</strong> (#{entriTerpilih.id})
        </p>
      )}

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleTambah}
          disabled={tambahLema.isPending || !entriTerpilih?.id}
          className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {tambahLema.isPending ? 'Menambahkan…' : 'Tambah lema'}
        </button>
      </div>

      {pesan.error && <p className="text-xs text-red-600">{pesan.error}</p>}
      {pesan.sukses && <p className="text-xs text-green-600">{pesan.sukses}</p>}
    </div>
  );
}

function DaftarLema({ lema, lemaAktif, setLemaAktif, sinsetId, simpanLema, tambahLema }) {
  return (
    <div className="space-y-3">
      <TambahLemaForm sinsetId={sinsetId} tambahLema={tambahLema} />

      {!lema || lema.length === 0 ? (
        <p className="text-sm text-gray-400">Tidak ada lema Indonesia.</p>
      ) : (
        <>
      <h4 className="text-sm font-semibold mb-2">Lema Indonesia ({lema.length})</h4>
      <div className="space-y-2">
        {lema.map((l) => (
          <ItemLema
            key={l.id}
            lema={l}
            aktif={lemaAktif === l.id}
            onPilih={() => setLemaAktif(lemaAktif === l.id ? null : l.id)}
            sinsetId={sinsetId}
            simpanLema={simpanLema}
          />
        ))}
      </div>
        </>
      )}
    </div>
  );
}

function ItemLema({ lema, aktif, onPilih, sinsetId, simpanLema }) {
  const [pesanLema, setPesanLema] = useState('');

  const handlePetakan = (maknaId) => {
    simpanLema.mutate(
      { sinsetId, lemaId: lema.id, makna_id: maknaId, terverifikasi: true },
      {
        onSuccess: () => setPesanLema('Terpetakan!'),
        onError: (err) => setPesanLema(getApiErrorMessage(err, 'Gagal')),
      }
    );
  };

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-medium">{lema.lema}</span>
          {lema.terverifikasi && (
            <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded">terverifikasi</span>
          )}
          {lema.makna_id && (
            <span className="text-xs text-blue-600 dark:text-blue-400">makna #{lema.makna_id}</span>
          )}
          {lema.makna_teks && (
            <span className="text-xs text-gray-500">— {potongTeks(lema.makna_teks, 40)}</span>
          )}
        </div>
        <button
          type="button"
          onClick={onPilih}
          className="text-xs text-blue-600 hover:underline dark:text-blue-400"
        >
          {aktif ? 'tutup' : 'pilih makna'}
        </button>
      </div>
      {pesanLema && <p className="text-xs mt-1 text-green-600">{pesanLema}</p>}
      {aktif && (
        <PanelKandidatMakna sinsetId={sinsetId} lemaId={lema.id} onPetakan={handlePetakan} />
      )}
    </div>
  );
}

function PanelKandidatMakna({ sinsetId, lemaId, onPetakan }) {
  const { data: resp, isLoading, isError, error } = useKandidatMaknaSinset(sinsetId, lemaId);
  const kandidat = resp?.data;

  if (isLoading) return <p className="text-xs text-gray-400 mt-2">Memuat kandidat…</p>;
  if (isError) return <p className="text-xs text-red-600 mt-2">{getApiErrorMessage(error, 'Gagal memuat kandidat makna.')}</p>;
  if (!kandidat) return <p className="text-xs text-gray-400 mt-2">Tidak ditemukan.</p>;

  return (
    <div className="mt-2 space-y-1">
      <p className="text-xs text-gray-500">
        Kelas kata sinset: <strong>{NAMA_KELAS[kandidat.kelas_kata_sinset]}</strong>
        {' '}(DB: {kandidat.kelas_kata_db})
        {' '}— entri #{kandidat.entri_id || '—'}
      </p>

      {kandidat.kandidat.length === 0 ? (
        <p className="text-xs text-amber-600">Tidak ada makna cocok kelas kata.</p>
      ) : (
        <div className="space-y-1">
          <p className="text-xs font-medium text-gray-600 dark:text-gray-400">Kandidat cocok POS:</p>
          {kandidat.kandidat.map((m) => (
            <div key={m.id} className="flex items-start gap-2 text-xs bg-gray-50 dark:bg-gray-800 rounded p-2">
              <button
                type="button"
                onClick={() => onPetakan(m.id)}
                className="shrink-0 text-blue-600 hover:underline dark:text-blue-400"
              >
                Pilih
              </button>
              <div>
                <span className="font-medium">#{m.id}</span>
                <span className="text-gray-500 ml-1">(polisem {m.polisem}, {m.kelas_kata})</span>
                <span className="ml-1">{m.makna || '—'}</span>
                {m.contoh && <span className="text-gray-400 italic ml-1">— {potongTeks(m.contoh, 60)}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {kandidat.semuaMakna.length > kandidat.kandidat.length && (
        <details className="mt-1">
          <summary className="text-xs text-gray-400 cursor-pointer">
            Semua makna entri ({kandidat.semuaMakna.length})
          </summary>
          <div className="mt-1 space-y-1">
            {kandidat.semuaMakna.map((m) => (
              <div key={m.id} className="flex items-start gap-2 text-xs text-gray-500 p-1">
                <button
                  type="button"
                  onClick={() => onPetakan(m.id)}
                  className="shrink-0 text-gray-400 hover:text-blue-600 hover:underline"
                >
                  Pilih
                </button>
                <span>#{m.id} (polisem {m.polisem}, {m.kelas_kata}) {m.makna || '—'}</span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

function DaftarRelasi({ relasiKeluar = [], relasiMasuk = [] }) {
  return (
    <div>
      <h4 className="text-sm font-semibold mb-2">
        Relasi ({relasiKeluar.length + relasiMasuk.length})
      </h4>

      {relasiKeluar.length > 0 && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1 font-medium">Keluar:</p>
          <div className="space-y-1">
            {relasiKeluar.map((r) => (
              <div key={r.id} className="text-xs flex gap-2">
                <span className="shrink-0 text-blue-600 dark:text-blue-400 w-36">{r.tipe_publik}</span>
                <span className="font-mono text-gray-500">{r.sinset_tujuan}</span>
                {r.tujuan_lema_id && <span className="text-gray-600 dark:text-gray-400">{potongTeks(r.tujuan_lema_id, 30)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {relasiMasuk.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-1 font-medium">Masuk:</p>
          <div className="space-y-1">
            {relasiMasuk.map((r) => (
              <div key={r.id} className="text-xs flex gap-2">
                <span className="shrink-0 text-purple-600 dark:text-purple-400 w-36">{r.tipe_publik}</span>
                <span className="font-mono text-gray-500">{r.sinset_asal}</span>
                {r.asal_lema_id && <span className="text-gray-600 dark:text-gray-400">{potongTeks(r.asal_lema_id, 30)}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SinsetAdmin;
