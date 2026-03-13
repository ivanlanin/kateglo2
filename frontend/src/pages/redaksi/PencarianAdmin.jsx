/**
 * @fileoverview Halaman redaksi untuk statistik pelacakan pencarian
 */

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import HalamanAdmin from '../../components/redaksi/HalamanAdmin';
import { useStatistikPencarianAdmin } from '../../api/apiAdmin';
import {
  TabelAdmin,
  usePencarianAdmin,
} from '../../components/redaksi/KomponenAdmin';
import { formatBilanganRibuan, formatLocalDateTime } from '../../utils/formatUtils';

const opsiPeriode = [
  { value: 'hariini', label: 'Hari ini' },
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

function formatTanggalSingkat(value) {
  return formatLocalDateTime(value, { fallback: '—', separator: ', ' });
}

function PencarianAdmin() {
  const { limit, currentPage, cursor, direction, lastPage, setOffset } = usePencarianAdmin(50);

  const [filterDraft, setFilterDraft] = useState({
    domain: '',
    periode: 'hariini',
    tanggalMulai: '',
    tanggalSelesai: '',
  });
  const [filterAktif, setFilterAktif] = useState({
    domain: '',
    periode: 'hariini',
    tanggalMulai: '',
    tanggalSelesai: '',
  });

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
      align: 'right',
      render: (item) => formatBilanganRibuan(item.jumlah),
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
      periode: 'hariini',
      tanggalMulai: '',
      tanggalSelesai: '',
    };
    setFilterDraft(awal);
    setFilterAktif(awal);
    setOffset(0);
  };

  return (
    <HalamanAdmin judul="Pencarian">
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
        <Link
          to="/redaksi/pencarian-hitam"
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-dark-bg-elevated text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-sm font-medium"
        >
          Kelola Daftar Hitam
        </Link>
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
    </HalamanAdmin>
  );
}

export { formatTanggalSingkat };
export default PencarianAdmin;
