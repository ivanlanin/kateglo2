/**
 * @fileoverview Halaman redaksi untuk statistik pelacakan pencarian
 */

import { useMemo, useState } from 'react';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
  useDaftarPencarianHitamAdmin,
  useHapusPencarianHitamAdmin,
  useSimpanPencarianHitamAdmin,
  useStatistikPencarianAdmin,
} from '../../api/apiAdmin';
import {
  TabelAdmin,
  getApiErrorMessage,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  FormFooter,
  InputField,
  PesanForm,
  TextareaField,
  ToggleAktif,
  useFormPanel,
} from '../../komponen/redaksi/FormulirAdmin';
import { formatLocalDateTime } from '../../utils/formatUtils';

const opsiPeriode = [
  { value: '7hari', label: '7 hari terakhir' },
  { value: '30hari', label: '30 hari terakhir' },
  { value: 'all', label: 'Semua waktu' },
];

const opsiDomain = [
  { value: '', label: 'Semua domain' },
  { value: '1', label: 'Kamus' },
  { value: '2', label: 'Tesaurus' },
  { value: '3', label: 'Glosarium' },
  { value: '4', label: 'Makna' },
  { value: '5', label: 'Rima' },
];

const opsiFilterStatus = [
  { value: '', label: 'Semua status' },
  { value: '1', label: 'Aktif' },
  { value: '0', label: 'Nonaktif' },
];

const nilaiAwalPencarianHitam = {
  kata: '',
  aktif: true,
  catatan: '',
};

function formatTanggalSingkat(value) {
  return formatLocalDateTime(value, { fallback: '—', separator: ', ' });
}

function PencarianAdmin() {
  const { limit, currentPage, cursor, direction, lastPage, setOffset } = usePencarianAdmin(200);
  const {
    cari: cariHitam,
    setCari: setCariHitam,
    q: qHitam,
    offset: offsetHitam,
    setOffset: setOffsetHitam,
    kirimCari: kirimCariHitam,
    hapusCari: hapusCariHitam,
    limit: limitHitam,
    currentPage: currentPageHitam,
    cursor: cursorHitam,
    direction: directionHitam,
    lastPage: lastPageHitam,
  } = usePencarianAdmin(100);

  const [filterDraft, setFilterDraft] = useState({
    domain: '',
    periode: '7hari',
    tanggalMulai: '',
    tanggalSelesai: '',
  });
  const [filterAktif, setFilterAktif] = useState({
    domain: '',
    periode: '7hari',
    tanggalMulai: '',
    tanggalSelesai: '',
  });
  const [panelHitamBuka, setPanelHitamBuka] = useState(false);
  const [filterHitamDraft, setFilterHitamDraft] = useState('');
  const [filterHitam, setFilterHitam] = useState('');
  const [pesanHitam, setPesanHitam] = useState({ error: '', sukses: '' });
  const panelHitam = useFormPanel(nilaiAwalPencarianHitam);
  const simpanHitam = useSimpanPencarianHitamAdmin();
  const hapusHitam = useHapusPencarianHitamAdmin();

  const { data, isLoading, isError } = useStatistikPencarianAdmin({
    ...filterAktif,
    limit,
    cursor,
    direction,
    lastPage,
  });
  const daftarTabel = useMemo(
    () => (data?.data || []).map((item, index) => ({ ...item, _rowKey: `${item.domain}-${item.kata}-${index}` })),
    [data?.data]
  );
  const ringkasanDomain = data?.ringkasanDomain || [];

  const {
    data: daftarHitamResp,
    isLoading: isHitamLoading,
    isError: isHitamError,
  } = useDaftarPencarianHitamAdmin({
    limit: limitHitam,
    cursor: cursorHitam,
    direction: directionHitam,
    lastPage: lastPageHitam,
    q: qHitam,
    aktif: filterHitam,
  });

  const daftarHitam = daftarHitamResp?.data || [];

  const kolomHitam = [
    { key: 'kata', label: 'Kata', render: (item) => item.kata || '—' },
    {
      key: 'aktif',
      label: 'Status',
      render: (item) => (item.aktif ? 'Aktif' : 'Nonaktif'),
    },
    {
      key: 'catatan',
      label: 'Catatan',
      render: (item) => item.catatan || '—',
    },
    {
      key: 'updated_at',
      label: 'Diubah',
      render: (item) => formatTanggalSingkat(item.updated_at),
    },
  ];

  const kolom = [
    { key: 'domain_nama', label: 'Domain', render: (item) => item.domain_nama || '—' },
    {
      key: 'kata',
      label: 'Kata',
      render: (item) => (
        <div className="flex items-center gap-2">
          <span>{item.kata || '—'}</span>
          {item.diblokir ? (
            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
              Diblokir
            </span>
          ) : (
            <span className="inline-flex px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              Normal
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'jumlah',
      label: 'Jumlah',
      render: (item) => Number(item.jumlah || 0).toLocaleString('id-ID'),
    },
    { key: 'tanggal_awal', label: 'Awal', render: (item) => formatTanggalSingkat(item.tanggal_awal) },
    { key: 'tanggal_akhir', label: 'Akhir', render: (item) => formatTanggalSingkat(item.tanggal_akhir) },
  ];

  const handleCari = (e) => {
    e.preventDefault();
    setFilterAktif({
      ...filterDraft,
    });
    setOffset(0);
  };

  const handleReset = () => {
    const awal = {
      domain: '',
      periode: '7hari',
      tanggalMulai: '',
      tanggalSelesai: '',
    };
    setFilterDraft(awal);
    setFilterAktif(awal);
    setOffset(0);
  };

  const bukaPanelHitam = () => {
    setPesanHitam({ error: '', sukses: '' });
    setPanelHitamBuka(true);
    panelHitam.bukaUntukTambah();
  };

  const tutupPanelHitam = () => {
    setPesanHitam({ error: '', sukses: '' });
    setPanelHitamBuka(false);
    panelHitam.tutup();
  };

  const handleCariHitam = (e) => {
    e.preventDefault();
    setFilterHitam(filterHitamDraft);
    kirimCariHitam(cariHitam);
  };

  const handleResetHitam = () => {
    setFilterHitamDraft('');
    setFilterHitam('');
    hapusCariHitam();
  };

  const handleSuntingHitam = (item) => {
    setPesanHitam({ error: '', sukses: '' });
    panelHitam.bukaUntukSunting(item);
  };

  const handleSimpanHitam = () => {
    setPesanHitam({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panelHitam.data, [
      { name: 'kata', label: 'Kata' },
    ]);

    if (pesanValidasi) {
      setPesanHitam({ error: pesanValidasi, sukses: '' });
      return;
    }

    simpanHitam.mutate(panelHitam.data, {
      onSuccess: () => {
        setPesanHitam({ error: '', sukses: 'Tersimpan!' });
        if (panelHitam.modeTambah) {
          panelHitam.bukaUntukTambah();
        }
      },
      onError: (err) => {
        setPesanHitam({ error: getApiErrorMessage(err, 'Gagal menyimpan kata daftar hitam'), sukses: '' });
      },
    });
  };

  const handleHapusHitam = () => {
    if (!panelHitam.data?.id) return;
    if (!confirm('Yakin ingin menghapus kata ini dari daftar hitam?')) return;

    hapusHitam.mutate(panelHitam.data.id, {
      onSuccess: () => {
        setPesanHitam({ error: '', sukses: 'Berhasil dihapus.' });
        panelHitam.bukaUntukTambah();
      },
      onError: (err) => {
        setPesanHitam({ error: getApiErrorMessage(err, 'Gagal menghapus kata daftar hitam'), sukses: '' });
      },
    });
  };

  return (
    <TataLetak mode="admin" judul="Pencarian">
      <form onSubmit={handleCari} className="mb-4 flex flex-wrap gap-2 items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="filter-domain" className="text-sm text-gray-600 dark:text-gray-300">Domain</label>
          <select
            id="filter-domain"
            value={filterDraft.domain}
            onChange={(e) => setFilterDraft((v) => ({ ...v, domain: e.target.value }))}
            className="form-admin-select w-auto min-w-[170px]"
          >
            {opsiDomain.map((opsi) => (
              <option key={opsi.value} value={opsi.value}>{opsi.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-periode" className="text-sm text-gray-600 dark:text-gray-300">Periode</label>
          <select
            id="filter-periode"
            value={filterDraft.periode}
            onChange={(e) => setFilterDraft((v) => ({ ...v, periode: e.target.value }))}
            className="form-admin-select w-auto min-w-[170px]"
          >
            {opsiPeriode.map((opsi) => (
              <option key={opsi.value} value={opsi.value}>{opsi.label}</option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-tanggal-mulai" className="text-sm text-gray-600 dark:text-gray-300">Tanggal Mulai</label>
          <input
            id="filter-tanggal-mulai"
            type="date"
            value={filterDraft.tanggalMulai}
            onChange={(e) => setFilterDraft((v) => ({ ...v, tanggalMulai: e.target.value }))}
            className="form-admin-input"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label htmlFor="filter-tanggal-selesai" className="text-sm text-gray-600 dark:text-gray-300">Tanggal Selesai</label>
          <input
            id="filter-tanggal-selesai"
            type="date"
            value={filterDraft.tanggalSelesai}
            onChange={(e) => setFilterDraft((v) => ({ ...v, tanggalSelesai: e.target.value }))}
            className="form-admin-input"
          />
        </div>

        <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
          Terapkan
        </button>
        <button type="button" onClick={handleReset} className="px-3 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-sm">
          Reset
        </button>
        <button
          type="button"
          onClick={bukaPanelHitam}
          className="px-4 py-2 bg-white dark:bg-dark-bg-elevated text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium"
        >
          Daftar Hitam
        </button>
      </form>

      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-4 mb-4">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">Ringkasan Domain</h3>
        {isLoading ? (
          <p className="text-gray-500 dark:text-gray-400">Memuat data …</p>
        ) : ringkasanDomain.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Belum ada data.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {ringkasanDomain.map((item) => (
              <div key={item.domain} className="rounded border border-gray-200 dark:border-dark-border px-3 py-2">
                <div className="text-xs text-gray-500 dark:text-gray-400 uppercase">{item.domain_nama}</div>
                <div className="text-lg font-semibold text-gray-900 dark:text-white">{Number(item.jumlah || 0).toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isError ? (
        <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow p-8 text-center text-red-600 dark:text-red-400">
          Gagal memuat statistik pencarian.
        </div>
      ) : (
        <TabelAdmin
          kolom={kolom}
          data={daftarTabel}
          isLoading={isLoading}
          isError={false}
          total={Number(data?.total || 0)}
          limit={limit}
          offset={Math.max((currentPage - 1) * limit, 0)}
          pageInfo={data?.pageInfo}
          currentPage={currentPage}
          onNavigateCursor={setOffset}
          kunciId="_rowKey"
        />
      )}

      <PanelGeser buka={panelHitamBuka} onTutup={tutupPanelHitam} judul="Daftar Hitam Pencarian">
        <form onSubmit={handleCariHitam} className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            value={cariHitam}
            onChange={(e) => setCariHitam(e.target.value)}
            placeholder="Cari kata daftar hitam …"
            className="form-admin-input w-full"
          />
          <select
            value={filterHitamDraft}
            onChange={(e) => setFilterHitamDraft(e.target.value)}
            className="form-admin-select w-full"
          >
            {opsiFilterStatus.map((opsi) => (
              <option key={opsi.value} value={opsi.value}>{opsi.label}</option>
            ))}
          </select>
          <button type="submit" className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium">
            Cari
          </button>
          <button type="button" onClick={handleResetHitam} className="px-3 py-2 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-bg text-sm">
            Reset
          </button>
          <button type="button" onClick={() => panelHitam.bukaUntukTambah()} className="px-3 py-2 bg-white dark:bg-dark-bg-elevated text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm">
            + Tambah Kata
          </button>
        </form>

        <TabelAdmin
          kolom={kolomHitam}
          data={daftarHitam}
          isLoading={isHitamLoading}
          isError={isHitamError}
          total={Number(daftarHitamResp?.total || 0)}
          limit={limitHitam}
          offset={offsetHitam}
          pageInfo={daftarHitamResp?.pageInfo}
          currentPage={currentPageHitam}
          onNavigateCursor={setOffsetHitam}
          onKlikBaris={handleSuntingHitam}
        />

        <div className="mt-4 border-t border-gray-200 dark:border-dark-border pt-4">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {panelHitam.modeTambah ? 'Tambah Kata Daftar Hitam' : 'Sunting Kata Daftar Hitam'}
          </h4>
          <PesanForm error={pesanHitam.error} sukses={pesanHitam.sukses} />
          <InputField
            label="Kata"
            name="kata"
            value={panelHitam.data.kata}
            onChange={panelHitam.ubahField}
            required
          />
          <ToggleAktif value={Boolean(panelHitam.data.aktif)} onChange={panelHitam.ubahField} />
          <TextareaField
            label="Catatan"
            name="catatan"
            value={panelHitam.data.catatan}
            onChange={panelHitam.ubahField}
            rows={3}
          />
          <FormFooter
            onSimpan={handleSimpanHitam}
            onBatal={() => panelHitam.bukaUntukTambah()}
            onHapus={handleHapusHitam}
            isPending={simpanHitam.isPending || hapusHitam.isPending}
            modeTambah={panelHitam.modeTambah}
          />
        </div>
      </PanelGeser>
    </TataLetak>
  );
}

export { formatTanggalSingkat };
export default PencarianAdmin;
