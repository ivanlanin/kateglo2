/**
 * @fileoverview Halaman redaksi untuk audit cakupan dan asosiasi tagar per entri
 */

import { useMemo, useState } from 'react';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
  BarisFilterCariAdmin,
  TabelAdmin,
  usePencarianAdmin,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useDaftarAuditTagarAdmin,
  useDaftarTagarUntukPilih,
  useTagarEntri,
  useSimpanTagarEntri,
} from '../../api/apiAdmin';

const opsiJenis = [
  { value: '', label: 'Semua jenis' },
  { value: 'turunan', label: 'Turunan' },
  { value: 'prefiks', label: 'Prefiks' },
  { value: 'sufiks', label: 'Sufiks' },
  { value: 'konfiks', label: 'Konfiks' },
  { value: 'klitik', label: 'Klitik' },
  { value: 'prakategorial', label: 'Prakategorial' },
  { value: 'dasar', label: 'Dasar' },
  { value: 'idiom', label: 'Idiom' },
  { value: 'peribahasa', label: 'Peribahasa' },
];

const opsiPunyaTagar = [
  { value: '', label: '—Status Tagar—' },
  { value: '1', label: 'Ada tagar' },
  { value: '0', label: 'Belum ada tagar' },
];

const warnaTagar = {
  prefiks: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sufiks: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  infiks: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  klitik: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  reduplikasi: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  prakategorial: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function BadgeTagar({ item, onHapus }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs ${warnaTagar[item.kategori] || warnaTagar.prakategorial}`}
    >
      {item.nama}
      {typeof onHapus === 'function' && (
        <button
          type="button"
          onClick={() => onHapus(item.id)}
          className="opacity-60 hover:opacity-100"
          aria-label={`Hapus tagar ${item.nama}`}
        >
          ×
        </button>
      )}
    </span>
  );
}

function EditorTagarPanel({ entri, onTutup }) {
  const entriId = entri?.id;
  const { data: respTagarEntri } = useTagarEntri(entriId);
  const { data: respSemuaTagar } = useDaftarTagarUntukPilih();
  const simpanTagarEntri = useSimpanTagarEntri();
  const [queryInput, setQueryInput] = useState('');
  const [tampilDropdown, setTampilDropdown] = useState(false);

  const tagarTerpilih = respTagarEntri?.data || [];
  const semuaTagar = respSemuaTagar?.data || [];

  const idsTerpilih = new Set(tagarTerpilih.map((item) => item.id));
  const tagarTersedia = semuaTagar.filter((item) => !idsTerpilih.has(item.id));

  const kataKunci = queryInput.trim().toLowerCase();
  const tagarFiltered = kataKunci
    ? tagarTersedia.filter((item) => item.nama.toLowerCase().includes(kataKunci)
      || item.kode.toLowerCase().includes(kataKunci))
    : tagarTersedia;

  const grupDropdown = tagarFiltered.reduce((acc, item) => {
    if (!acc[item.kategori]) acc[item.kategori] = [];
    acc[item.kategori].push(item);
    return acc;
  }, {});

  const simpanDaftarTagar = (nextItems) => {
    simpanTagarEntri.mutate({ entriId, tagar_ids: nextItems.map((item) => item.id) });
  };

  const tambahTagar = (item) => {
    simpanDaftarTagar([...tagarTerpilih, item]);
    setQueryInput('');
  };

  const hapusTagar = (tagarId) => {
    simpanDaftarTagar(tagarTerpilih.filter((item) => item.id !== tagarId));
  };

  return (
    <PanelGeser
      buka={Boolean(entriId)}
      onTutup={onTutup}
      judul={`Tagar Entri: ${entri?.entri || '—'}`}
    >
      <div className="space-y-3">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Induk:</span> {entri?.induk_entri || '—'}
        </p>

        <div className="relative">
          <div className="flex flex-wrap gap-1.5 rounded border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800 min-h-[2.5rem]">
            {tagarTerpilih.map((item) => (
              <BadgeTagar key={item.id} item={item} onHapus={hapusTagar} />
            ))}
            <input
              type="text"
              value={queryInput}
              onChange={(e) => setQueryInput(e.target.value)}
              onFocus={() => setTampilDropdown(true)}
              onBlur={() => setTimeout(() => setTampilDropdown(false), 120)}
              placeholder={tagarTerpilih.length === 0 ? 'Tambah tagar…' : ''}
              className="min-w-24 flex-1 bg-transparent text-sm outline-none"
            />
          </div>

          {tampilDropdown && Object.keys(grupDropdown).length > 0 && (
            <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
              {Object.entries(grupDropdown).map(([kategori, items]) => (
                <div key={kategori}>
                  <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                    {kategori}
                  </div>
                  {items.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={() => tambahTagar(item)}
                      className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      {item.nama}
                    </button>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {simpanTagarEntri.isError && (
          <p className="text-xs text-red-600 dark:text-red-400">Gagal menyimpan tagar.</p>
        )}
      </div>
    </PanelGeser>
  );
}

function AuditTagarAdmin() {
  const {
    cari,
    setCari,
    q,
    setOffset,
    kirimCari,
    hapusCari,
    limit,
    currentPage,
    cursor,
    direction,
    lastPage,
  } = usePencarianAdmin(50);

  const [filterJenisDraft, setFilterJenisDraft] = useState('turunan');
  const [filterJenis, setFilterJenis] = useState('turunan');
  const [filterPunyaTagarDraft, setFilterPunyaTagarDraft] = useState('');
  const [filterPunyaTagar, setFilterPunyaTagar] = useState('');
  const [filterTagarDraft, setFilterTagarDraft] = useState('');
  const [filterTagar, setFilterTagar] = useState('');
  const [entriDipilih, setEntriDipilih] = useState(null);

  const { data: daftarTagarResp } = useDaftarTagarUntukPilih();
  const opsiTagar = useMemo(() => ([
    { value: '', label: '—Semua Tagar—' },
    ...(daftarTagarResp?.data || []).map((item) => ({ value: String(item.id), label: item.nama })),
  ]), [daftarTagarResp]);

  const { data: resp, isLoading, isError } = useDaftarAuditTagarAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    tagarId: filterTagar,
    jenis: filterJenis,
    punyaTagar: filterPunyaTagar,
  });

  const daftar = resp?.data || [];
  const total = Number(resp?.total || 0);
  const cakupan = resp?.cakupan || { totalTurunan: 0, sudahBertagar: 0, persentase: 0 };

  const kolom = [
    {
      key: 'entri',
      label: 'Entri',
      render: (item) => <span className="font-medium">{item.entri || '—'}</span>,
    },
    { key: 'jenis', label: 'Jenis', render: (item) => item.jenis || '—' },
    { key: 'induk_entri', label: 'Induk', render: (item) => item.induk_entri || '—' },
    {
      key: 'tagar',
      label: 'Tagar',
      render: (item) => (
        Array.isArray(item.tagar) && item.tagar.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {item.tagar.map((tagar) => <BadgeTagar key={tagar.id} item={tagar} />)}
          </div>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">Belum ada</span>
        )
      ),
    },
    {
      key: 'aksi',
      label: 'Aksi',
      render: (item) => (
        <button
          type="button"
          onClick={() => setEntriDipilih(item)}
          className="rounded border border-blue-300 px-2 py-1 text-xs text-blue-700 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-300 dark:hover:bg-blue-900/20"
        >
          Sunting Tagar
        </button>
      ),
    },
  ];

  const handleCari = () => {
    setFilterJenis(filterJenisDraft);
    setFilterPunyaTagar(filterPunyaTagarDraft);
    setFilterTagar(filterTagarDraft);
    kirimCari(cari);
  };

  const handleReset = () => {
    setFilterJenisDraft('turunan');
    setFilterJenis('turunan');
    setFilterPunyaTagarDraft('');
    setFilterPunyaTagar('');
    setFilterTagarDraft('');
    setFilterTagar('');
    hapusCari();
  };

  return (
    <TataLetak mode="admin" judul="Audit Tagar">
      <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-dark-bg-elevated">
        <div className="mb-2 text-sm font-semibold text-gray-700 dark:text-gray-200">Cakupan Tagar Turunan</div>
        <div className="mb-2 text-sm text-gray-600 dark:text-gray-300">
          {Number(cakupan.sudahBertagar || 0).toLocaleString('id-ID')} dari {Number(cakupan.totalTurunan || 0).toLocaleString('id-ID')} entri
        </div>
        <div className="h-2 overflow-hidden rounded bg-gray-200 dark:bg-gray-700">
          <div
            className="h-full bg-blue-600"
            style={{ width: `${Math.max(0, Math.min(Number(cakupan.persentase || 0), 100))}%` }}
          />
        </div>
        <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">{Number(cakupan.persentase || 0)}%</div>
      </div>

      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleReset}
        placeholder="Cari entri atau induk …"
        filters={[
          {
            key: 'jenis',
            value: filterJenisDraft,
            onChange: setFilterJenisDraft,
            options: opsiJenis,
            ariaLabel: 'Filter jenis entri',
          },
          {
            key: 'punyaTagar',
            value: filterPunyaTagarDraft,
            onChange: setFilterPunyaTagarDraft,
            options: opsiPunyaTagar,
            ariaLabel: 'Filter status tagar',
          },
          {
            key: 'tagar',
            value: filterTagarDraft,
            onChange: setFilterTagarDraft,
            options: opsiTagar,
            ariaLabel: 'Filter tagar',
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
        offset={Math.max((currentPage - 1) * limit, 0)}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
      />

      <EditorTagarPanel
        entri={entriDipilih}
        onTutup={() => setEntriDipilih(null)}
      />
    </TataLetak>
  );
}

export default AuditTagarAdmin;
