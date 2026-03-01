/**
 * @fileoverview Halaman redaksi untuk statistik pelacakan pencarian
 */

import { useState } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import TataLetak from '../../komponen/bersama/TataLetak';
import { useStatistikPencarianAdmin } from '../../api/apiAdmin';

dayjs.extend(utc);

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

function formatTanggalSingkat(value) {
  const text = String(value || '').trim();
  if (!text) return '—';

  const normalized = text.length <= 10 ? `${text}T00:00:00` : text.replace(' ', 'T');
  const hasTimezone = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(normalized);
  const source = hasTimezone ? normalized : `${normalized}Z`;
  const parsed = dayjs.utc(source);
  if (!parsed.isValid()) return '—';
  return parsed.format('DD MMM YYYY HH:mm [UTC]');
}

function PencarianAdmin() {
  const [filterDraft, setFilterDraft] = useState({
    domain: '',
    periode: '7hari',
    limit: 200,
    tanggalMulai: '',
    tanggalSelesai: '',
  });
  const [filterAktif, setFilterAktif] = useState(filterDraft);

  const { data, isLoading, isError } = useStatistikPencarianAdmin(filterAktif);
  const daftar = data?.data || [];
  const ringkasanDomain = data?.ringkasanDomain || [];

  const handleCari = (e) => {
    e.preventDefault();
    setFilterAktif({
      ...filterDraft,
      limit: Math.min(Math.max(Number.parseInt(filterDraft.limit, 10) || 200, 1), 1000),
    });
  };

  const handleReset = () => {
    const awal = {
      domain: '',
      periode: '7hari',
      limit: 200,
      tanggalMulai: '',
      tanggalSelesai: '',
    };
    setFilterDraft(awal);
    setFilterAktif(awal);
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
          <label htmlFor="filter-limit" className="text-sm text-gray-600 dark:text-gray-300">Limit</label>
          <input
            id="filter-limit"
            type="number"
            min="1"
            max="1000"
            value={filterDraft.limit}
            onChange={(e) => setFilterDraft((v) => ({ ...v, limit: e.target.value }))}
            className="form-admin-input w-[110px]"
          />
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

      <div className="bg-white dark:bg-dark-bg-elevated rounded-lg shadow overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Memuat data …</div>
        ) : isError ? (
          <div className="p-8 text-center text-red-600 dark:text-red-400">Gagal memuat statistik pencarian.</div>
        ) : daftar.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">Tidak ada data.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-bg">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Kata</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Jumlah</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Awal (UTC)</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-800 dark:text-gray-100 uppercase tracking-wider">Akhir (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-dark-border/60">
                {daftar.map((item, index) => (
                  <tr key={`${item.domain}-${item.kata}-${index}`}>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{item.domain_nama}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{item.kata}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{Number(item.jumlah || 0).toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{formatTanggalSingkat(item.tanggal_awal)}</td>
                    <td className="px-6 py-3 text-sm text-gray-700 dark:text-gray-300">{formatTanggalSingkat(item.tanggal_akhir)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </TataLetak>
  );
}

export { formatTanggalSingkat };
export default PencarianAdmin;
