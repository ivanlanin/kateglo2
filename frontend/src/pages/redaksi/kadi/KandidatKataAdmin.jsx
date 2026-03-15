/**
 * @fileoverview Halaman redaksi kandidat kata (KADI)
 * Daftar, filter, detail, ubah status, lihat atestasi & riwayat kurasi
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarKandidatKataAdmin,
  useDetailKandidatKataAdmin,
  useSimpanKandidatKata,
  useUbahStatusKandidatKata,
  useHapusKandidatKata,
  useStatistikKandidatKata,
  useDaftarAtestasi,
  useDaftarRiwayat,
} from '../../../api/apiKadi';
import HalamanAdmin from '../../../components/redaksi/HalamanAdmin';
import { useAuth } from '../../../context/authContext';
import {
  BarisFilterCariAdmin,
  TabelAdmin,
  getApiErrorMessage,
  usePencarianAdmin,
} from '../../../components/redaksi/KomponenAdmin';
import PanelGeser from '../../../components/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SelectField,
  TextareaField,
  FormFooter,
  PesanForm,
} from '../../../components/redaksi/FormulirAdmin';
import { parsePositiveIntegerParam } from '../../../utils/paramUtils';

// ─── Constants ───────────────────────────────────────────────────────────────

const nilaiAwal = {
  kata: '',
  jenis: '',
  kelas_kata: '',
  definisi_awal: '',
  ragam: '',
  bahasa_campur: '',
  catatan_redaksi: '',
};

const opsiStatus = [
  { value: '', label: 'Semua Status' },
  { value: 'menunggu', label: 'Menunggu' },
  { value: 'ditinjau', label: 'Ditinjau' },
  { value: 'disetujui', label: 'Disetujui' },
  { value: 'ditolak', label: 'Ditolak' },
  { value: 'tunda', label: 'Tunda' },
];

const opsiJenis = [
  { value: '', label: 'Semua Jenis' },
  { value: 'kata-dasar', label: 'Kata Dasar' },
  { value: 'kata-majemuk', label: 'Kata Majemuk' },
  { value: 'frasa', label: 'Frasa' },
  { value: 'singkatan', label: 'Singkatan' },
  { value: 'serapan', label: 'Serapan' },
];

const warnaStatus = {
  menunggu: 'bg-gray-100 text-gray-700',
  ditinjau: 'bg-blue-100 text-blue-700',
  disetujui: 'bg-green-100 text-green-700',
  ditolak: 'bg-red-100 text-red-700',
  tunda: 'bg-yellow-100 text-yellow-700',
};

function BadgeStatusKandidat({ status }) {
  const cls = warnaStatus[status] || 'bg-gray-100 text-gray-700';
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${cls}`}>
      {status || '-'}
    </span>
  );
}

function formatTanggal(dateStr) {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) {
    return dateStr;
  }

  return date.toLocaleDateString('id-ID', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function BarStatistik({ stats }) {
  if (!stats?.data) return null;
  const items = stats.data;
  const total = items.reduce((sum, s) => sum + (s.jumlah || 0), 0);

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      <span className="inline-block px-3 py-1 rounded text-sm font-medium bg-gray-200 text-gray-800">
        Total: {total}
      </span>
      {items.map((s) => (
        <span
          key={s.status}
          className={`inline-block px-3 py-1 rounded text-sm font-medium ${warnaStatus[s.status] || 'bg-gray-100'}`}
        >
          {s.status}: {s.jumlah}
        </span>
      ))}
    </div>
  );
}

function DaftarAtestasi({ kandidatId }) {
  const { data: resp, isLoading } = useDaftarAtestasi(kandidatId);
  const daftar = resp?.data || [];

  if (isLoading) return <p className="text-sm text-gray-500 mt-2">Memuat atestasi...</p>;
  if (!daftar.length) return <p className="text-sm text-gray-400 mt-2">Belum ada atestasi.</p>;

  return (
    <div className="mt-3 space-y-3">
      <h4 className="text-sm font-semibold text-gray-600">Atestasi ({daftar.length})</h4>
      {daftar.map((a) => (
        <div key={a.id} className="p-3 bg-gray-50 rounded text-sm border border-gray-200">
          <p className="italic text-gray-700 mb-1">&ldquo;{a.kutipan}&rdquo;</p>
          <div className="flex flex-wrap gap-x-4 text-xs text-gray-500">
            {a.sumber_nama && <span>{a.sumber_nama}</span>}
            {a.sumber_tipe && <span className="uppercase">{a.sumber_tipe}</span>}
            {a.tanggal_terbit && <span>{formatTanggal(a.tanggal_terbit)}</span>}
            {a.sumber_url && (
              <a href={a.sumber_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">
                Sumber
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function DaftarRiwayat({ kandidatId }) {
  const { data: resp, isLoading } = useDaftarRiwayat(kandidatId);
  const daftar = resp?.data || [];

  if (isLoading) return <p className="text-sm text-gray-500 mt-2">Memuat riwayat...</p>;
  if (!daftar.length) return <p className="text-sm text-gray-400 mt-2">Belum ada riwayat.</p>;

  return (
    <div className="mt-3 space-y-2">
      <h4 className="text-sm font-semibold text-gray-600">Riwayat Kurasi</h4>
      {daftar.map((r) => (
        <div key={r.id} className="text-xs text-gray-600 flex gap-2 items-baseline">
          <span className="text-gray-400">{formatTanggal(r.created_at)}</span>
          <BadgeStatusKandidat status={r.status_baru} />
          <span>{r.redaktur_nama || 'Sistem'}</span>
          {r.catatan && <span className="italic text-gray-500">— {r.catatan}</span>}
        </div>
      ))}
    </div>
  );
}

function TombolAksiStatus({ kandidat, onUbahStatus, isLoading }) {
  const { status } = kandidat;
  const tombolKonfig = {
    menunggu: [
      { label: 'Tinjau', newStatus: 'ditinjau', cls: 'btn-admin-primary' },
      { label: 'Tolak', newStatus: 'ditolak', cls: 'btn-admin-danger' },
    ],
    ditinjau: [
      { label: 'Setujui', newStatus: 'disetujui', cls: 'btn-admin-success' },
      { label: 'Tolak', newStatus: 'ditolak', cls: 'btn-admin-danger' },
      { label: 'Tunda', newStatus: 'tunda', cls: 'btn-admin-warning' },
    ],
    tunda: [
      { label: 'Tinjau Ulang', newStatus: 'ditinjau', cls: 'btn-admin-primary' },
      { label: 'Tolak', newStatus: 'ditolak', cls: 'btn-admin-danger' },
    ],
    ditolak: [
      { label: 'Tinjau Ulang', newStatus: 'ditinjau', cls: 'btn-admin-primary' },
    ],
    disetujui: [],
  };
  const tombol = tombolKonfig[status] || [];
  if (!tombol.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {tombol.map((t) => (
        <button
          key={t.newStatus}
          type="button"
          className={`btn-admin btn-admin-sm ${t.cls}`}
          disabled={isLoading}
          onClick={() => onUbahStatus(t.newStatus)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function shouldBukaDetailPanel({ sedangMenutupDariPath, idDariPath, isLoading, isError, detailId, idEditTerbuka }) {
  return !sedangMenutupDariPath
    && Boolean(idDariPath)
    && !isLoading
    && !isError
    && Boolean(detailId)
    && idEditTerbuka !== detailId;
}

function shouldSinkronkanPanel({ detailData, panelBuka, modeTambah, idDariPath, panelDataId }) {
  return Boolean(detailData)
    && panelBuka
    && !modeTambah
    && Boolean(idDariPath)
    && panelDataId !== detailData.id;
}

export const __private = {
  BadgeStatusKandidat,
  formatTanggal,
  BarStatistik,
  DaftarAtestasi,
  DaftarRiwayat,
  TombolAksiStatus,
  shouldBukaDetailPanel,
  shouldSinkronkanPanel,
};

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function KandidatKataAdmin() {
  const navigate = useNavigate();
  const { id: paramId } = useParams();
  const idDariPath = parsePositiveIntegerParam(paramId);
  const { punyaIzin } = useAuth();
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const bisaEdit = punyaIzin('edit_kandidat');
  const bisaUbahStatus = punyaIzin('ubah_status_kandidat');
  const bisaHapus = punyaIzin('hapus_kandidat');

  // ─── State ───────────────────────────────────────────────────────────

  const {
    cari,
    setCari,
    q,
    limit,
    offset,
    currentPage,
    setOffset,
    kirimCari,
    hapusCari,
    cursor,
    direction,
    lastPage,
  } = usePencarianAdmin(50);

  const [filterStatusDraft, setFilterStatusDraft] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJenisDraft, setFilterJenisDraft] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [pesan, setPesan] = useState({ error: '', sukses: '' });
  const [tab, setTab] = useState('atestasi');

  const panel = useFormPanel(nilaiAwal);

  // ─── Queries ─────────────────────────────────────────────────────────

  const statsQuery = useStatistikKandidatKata();
  const daftarQuery = useDaftarKandidatKataAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    status: filterStatus,
    jenis: filterJenis,
  });
  const resp = daftarQuery.data;
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const detailQuery = useDetailKandidatKataAdmin(idDariPath);

  // ─── Mutations ───────────────────────────────────────────────────────

  const simpanMut = useSimpanKandidatKata();
  const ubahStatusMut = useUbahStatusKandidatKata();
  const hapusMut = useHapusKandidatKata();

  // ─── Handlers ────────────────────────────────────────────────────────

  function bukaSuntingDariDaftar(item) {
    setPesan({ error: '', sukses: '' });
    setTab('atestasi');
    if (!item?.id) return;
    navigate(`/redaksi/kandidat-kata/${item.id}`);
  }

  function tutupPanel() {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/kandidat-kata', { replace: true });
    }
  }

  function handleCari() {
    setFilterStatus(filterStatusDraft);
    setFilterJenis(filterJenisDraft);
    kirimCari(cari);
  }

  function handleResetFilter() {
    setFilterStatusDraft('');
    setFilterStatus('');
    setFilterJenisDraft('');
    setFilterJenis('');
    hapusCari();
  }

  async function handleSimpan() {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.kata?.trim()) {
      setPesan({ error: 'Kata wajib diisi', sukses: '' });
      return;
    }
    try {
      await simpanMut.mutateAsync(panel.data);
      setPesan({ error: '', sukses: 'Berhasil disimpan' });
      setTimeout(() => tutupPanel(), 600);
    } catch (err) {
      setPesan({ error: getApiErrorMessage(err), sukses: '' });
    }
  }

  async function handleUbahStatus(statusBaru) {
    if (!panel.data?.id) return;
    try {
      await ubahStatusMut.mutateAsync({
        id: panel.data.id,
        status: statusBaru,
      });
      setPesan({ error: '', sukses: `Status diubah ke "${statusBaru}"` });
      // Refresh detail
      panel.ubahField('status', statusBaru);
    } catch (err) {
      setPesan({ error: getApiErrorMessage(err), sukses: '' });
    }
  }

  async function handleHapus() {
    if (!window.confirm('Hapus kandidat ini? Semua atestasi juga akan terhapus.')) return;
    try {
      await hapusMut.mutateAsync(panel.data.id);
      tutupPanel();
    } catch (err) {
      setPesan({ error: getApiErrorMessage(err), sukses: '' });
    }
  }

  useEffect(() => {
    if (!paramId) return;
    if (idDariPath) return;
    setPesan({ error: 'ID kandidat tidak valid.', sukses: '' });
    navigate('/redaksi/kandidat-kata', { replace: true });
  }, [idDariPath, navigate, paramId]);

  useEffect(() => {
    const detail = detailQuery.data?.data;
    if (!shouldBukaDetailPanel({
      sedangMenutupDariPath: sedangMenutupDariPath.current,
      idDariPath,
      isLoading: detailQuery.isLoading,
      isError: detailQuery.isError,
      detailId: detail?.id,
      idEditTerbuka: idEditTerbuka.current,
    })) return;

    panel.bukaUntukSunting(detail);
    idEditTerbuka.current = detail.id;
    setTab('atestasi');
  }, [detailQuery.data, detailQuery.isError, detailQuery.isLoading, idDariPath, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || detailQuery.isLoading || !detailQuery.isError) return;
    setPesan({ error: 'Kandidat tidak ditemukan.', sukses: '' });
    navigate('/redaksi/kandidat-kata', { replace: true });
  }, [detailQuery.isError, detailQuery.isLoading, idDariPath, navigate]);

  useEffect(() => {
    if (!shouldSinkronkanPanel({
      detailData: detailQuery.data?.data,
      panelBuka: panel.buka,
      modeTambah: panel.modeTambah,
      idDariPath,
      panelDataId: panel.data?.id,
    })) return;

    panel.setData(detailQuery.data.data);
  }, [detailQuery.data, idDariPath, panel]);

  const kolom = [
    {
      key: 'kata',
      label: 'Kata',
      render: (item) => (
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {item.kata}
        </span>
      ),
    },
    { key: 'jenis', label: 'Jenis', render: (item) => item.jenis || '—' },
    { key: 'status', label: 'Status', render: (item) => <BadgeStatusKandidat status={item.status} /> },
    { key: 'sumber_scraper', label: 'Sumber', render: (item) => item.sumber_scraper || '—' },
    { key: 'jumlah_atestasi', label: 'Atestasi', render: (item) => item.jumlah_atestasi || 0, align: 'center' },
    { key: 'created_at', label: 'Dibuat', render: (item) => formatTanggal(item.created_at) },
  ];

  const detailData = panel.data;

  return (
    <HalamanAdmin judul="Kandidat Kata — KADI">
      <PesanForm error={pesan.error} sukses={pesan.sukses} />

      <BarStatistik stats={statsQuery.data} />

      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari kata kandidat …"
        filters={[
          {
            key: 'status',
            value: filterStatusDraft,
            onChange: setFilterStatusDraft,
            options: opsiStatus,
            ariaLabel: 'Filter status kandidat',
          },
          {
            key: 'jenis',
            value: filterJenisDraft,
            onChange: setFilterJenisDraft,
            options: opsiJenis,
            ariaLabel: 'Filter jenis kandidat',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={daftarQuery.isLoading}
        isError={daftarQuery.isError}
        total={total}
        limit={limit}
        offset={offset}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={detailData?.kata || 'Detail Kandidat Kata'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />

        {detailData?.status && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-500">Status:</span>
              <BadgeStatusKandidat status={detailData.status} />
            </div>
            {bisaUbahStatus && (
              <TombolAksiStatus
                kandidat={detailData}
                onUbahStatus={handleUbahStatus}
                isLoading={ubahStatusMut.isPending}
              />
            )}
          </div>
        )}

        {bisaEdit && (
          <>
            <InputField label="Kata" name="kata" value={detailData.kata || ''} onChange={panel.ubahField} required />
            <SelectField label="Jenis" name="jenis" value={detailData.jenis || ''} onChange={panel.ubahField} options={opsiJenis.slice(1)} />
            <InputField label="Kelas Kata" name="kelas_kata" value={detailData.kelas_kata || ''} onChange={panel.ubahField} />
            <TextareaField label="Definisi Awal" name="definisi_awal" value={detailData.definisi_awal || ''} onChange={panel.ubahField} />
            <InputField label="Ragam" name="ragam" value={detailData.ragam || ''} onChange={panel.ubahField} />
            <InputField label="Bahasa Campur" name="bahasa_campur" value={detailData.bahasa_campur || ''} onChange={panel.ubahField} />
            <TextareaField label="Catatan Redaksi" name="catatan_redaksi" value={detailData.catatan_redaksi || ''} onChange={panel.ubahField} />

            <FormFooter
              onSimpan={handleSimpan}
              onBatal={tutupPanel}
              isLoading={simpanMut.isPending}
            />

            {bisaHapus && detailData.id && (
              <div className="mt-3 pt-3 border-t border-gray-200">
                <button
                  type="button"
                  className="btn-admin btn-admin-sm btn-admin-danger"
                  onClick={handleHapus}
                  disabled={hapusMut.isPending}
                >
                  Hapus Kandidat
                </button>
              </div>
            )}
          </>
        )}

        {detailData?.id && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex gap-4 mb-2">
              <button
                type="button"
                className={`text-sm font-medium pb-1 ${tab === 'atestasi' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                onClick={() => setTab('atestasi')}
              >
                Atestasi
              </button>
              <button
                type="button"
                className={`text-sm font-medium pb-1 ${tab === 'riwayat' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-400'}`}
                onClick={() => setTab('riwayat')}
              >
                Riwayat
              </button>
            </div>

            {tab === 'atestasi' && <DaftarAtestasi kandidatId={detailData.id} />}
            {tab === 'riwayat' && <DaftarRiwayat kandidatId={detailData.id} />}
          </div>
        )}
      </PanelGeser>
    </HalamanAdmin>
  );
}
