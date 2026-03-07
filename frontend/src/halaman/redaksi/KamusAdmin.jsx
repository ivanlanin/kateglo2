/**
 * @fileoverview Halaman admin kamus — daftar, cari, tambah, sunting entri + makna + contoh
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarKamusAdmin, useDetailKamusAdmin, useSimpanKamus, useHapusKamus,
  useAutocompleteIndukKamus,
  useDaftarMakna, useSimpanMakna, useHapusMakna,
  useSimpanContoh, useHapusContoh,
  useKategoriLabelRedaksi,
  useDaftarSumberAdmin,
  useTagarEntri, useSimpanTagarEntri, useDaftarTagarUntukPilih,
} from '../../api/apiAdmin';
import TataLetak from '../../komponen/bersama/TataLetak';
import { useAuth } from '../../context/authContext';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  TabelAdmin,
  BadgeStatus,
  getApiErrorMessage,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel, InputField, SelectField, TextareaField, ToggleAktif,
  FormFooter, PesanForm,
} from '../../komponen/redaksi/FormulirAdmin';
import { buatPathDetailKamus } from '../../utils/paramUtils';

// ─── Constants ───────────────────────────────────────────────────────────────

const nilaiAwalEntri = {
  entri: '',
  induk: '',
  induk_entri: '',
  indeks: '',
  homograf: '',
  homonim: '',
  jenis: 'dasar',
  lafal: '',
  pemenggalan: '',
  varian: '',
  sumber_id: '',
  jenis_rujuk: '',
  lema_rujuk: '',
  entri_rujuk_id: '',
  entri_rujuk: '',
  aktif: 1,
};

const opsiJenisBawaan = [
  { value: 'dasar', label: 'Dasar' },
  { value: 'turunan', label: 'Turunan' },
  { value: 'gabungan', label: 'Gabungan' },
  { value: 'idiom', label: 'Idiom' },
  { value: 'peribahasa', label: 'Peribahasa' },
  { value: 'varian', label: 'Varian' },
];

const opsiTipePenyingkatBawaan = [
  { value: '', label: '— Tidak ada —' },
  { value: 'akronim', label: 'Akronim' },
  { value: 'kependekan', label: 'Kependekan' },
  { value: 'singkatan', label: 'Singkatan' },
];

const kodeRagamVarianValid = ['cak', 'hor', 'kl', 'kas'];

const petaNormalisasiRagamVarian = {
  cakapan: 'cak',
  hormat: 'hor',
  klasik: 'kl',
  kasar: 'kas',
};

const kategoriLabelRedaksi = [
  'bentuk-kata',
  'jenis-rujuk',
  'kelas-kata',
  'ragam',
  'bidang',
  'bahasa',
  'penyingkatan',
];

const nilaiAwalFilterKamus = {
  jenis: '',
  punyaHomograf: '',
  punyaHomonim: '',
  punyaLafal: '',
  punyaPemenggalan: '',
  jenisRujuk: '',
  kelasKata: '',
  ragam: '',
  ragamVarian: '',
  bidang: '',
  bahasa: '',
  punyaIlmiah: '',
  punyaKimia: '',
  penyingkatan: '',
  punyaKiasan: '',
  punyaContoh: '',
  aktif: '',
};

function mapOpsiLabel(labels = [], { emptyLabel = '— Pilih —', includeEmpty = true } = {}) {
  const mapped = labels.map((item) => {
    const kode = item?.kode ?? '';
    const nama = item?.nama ?? '';
    const label = String(nama || kode);
    return { value: kode, label };
  });

  if (!includeEmpty) return mapped;
  return [{ value: '', label: emptyLabel }, ...mapped];
}

function ensureOpsiMemuatNilai(options = [], value = '') {
  const trimmedValue = String(value || '').trim();
  if (!trimmedValue) return options;
  if (options.some((item) => String(item.value) === trimmedValue)) return options;
  return [{ value: trimmedValue, label: trimmedValue }, ...options];
}

function normalisasiRagamVarian(value = '') {
  const trimmed = String(value || '').trim().toLowerCase();
  if (!trimmed) return '';
  if (kodeRagamVarianValid.includes(trimmed)) return trimmed;
  return petaNormalisasiRagamVarian[trimmed] || '';
}

function filterJenisRujukOptions(options = []) {
  const allowed = new Set(['→', 'lihat']);
  const seen = new Set();

  return options.filter((item) => {
    const rawValue = String(item?.value || '').trim();
    if (!rawValue) return true;

    const value = rawValue.toLowerCase();
    if (!allowed.has(value)) return false;
    if (seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function buatPetaLabelRagam(ragamOptions = [], fallbackKosong = true) {
  const daftar = Array.isArray(ragamOptions) ? ragamOptions : [];
  return new Map(
    daftar.map((item) => {
      const rawValue = fallbackKosong ? (item?.value || '') : item?.value;
      return [String(rawValue).toLowerCase(), item?.label];
    })
  );
}

export const __private = {
  ensureOpsiMemuatNilai,
  normalisasiRagamVarian,
  buatPetaLabelRagam,
};

const kolom = [
  {
    key: 'entri',
    label: 'Entri',
    render: (item) => (
      <span>
        <Link
          to={buatPathDetailKamus(item.indeks || item.entri)}
          className="font-medium text-blue-700 hover:underline dark:text-blue-300"
          aria-label={`Buka detail kamus ${item.entri}`}
          title="Buka detail kamus"
          onClick={(event) => event.stopPropagation()}
        >
          {item.entri}
        </Link>
        {item.jenis_rujuk && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">→ {item.entri_rujuk || item.lema_rujuk || '—'}</span>
        )}
      </span>
    ),
  },
  { key: 'jenis', label: 'Jenis' },
  { key: 'indeks', label: 'Indeks' },
  { key: 'induk_entri', label: 'Induk', render: (item) => item.induk_entri || '—' },
  { key: 'homograf', label: 'Homograf', align: 'center' },
  { key: 'homonim', label: 'Homonim', align: 'center' },
  {
    key: 'jumlah_makna',
    label: 'Makna',
    align: 'center',
    render: (item) => {
      const jumlahMakna = Number(item.jumlah_makna || 0);
      return jumlahMakna > 0 ? jumlahMakna : '—';
    },
  },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ItemContoh({
  contoh,
  entriId,
  maknaId,
  simpanContoh,
  hapusContoh,
  isPending,
  opsiRagam,
  opsiBidang,
  bisaEditContoh,
  bisaHapusContoh,
}) {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState(contoh);

  const ubah = (field, val) => setData((p) => ({ ...p, [field]: val }));

  const handleSimpan = () => {
    simpanContoh.mutate({ entriId, maknaId, ...data }, {
      onSuccess: () => setEdit(false),
    });
  };

  const handleHapus = () => {
    if (!confirm('Hapus contoh ini?')) return;
    hapusContoh.mutate({ entriId, maknaId, contohId: contoh.id });
  };

  const renderContohFields = (nilaiData, onChange) => (
    <>
      <TextareaField label="Contoh" name="contoh" value={nilaiData.contoh} onChange={onChange} rows={2} />
      <TextareaField label="Makna contoh" name="makna_contoh" value={nilaiData.makna_contoh} onChange={onChange} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Ragam" name="ragam" value={nilaiData.ragam} onChange={onChange} options={ensureOpsiMemuatNilai(opsiRagam, nilaiData.ragam)} />
        <SelectField label="Bidang" name="bidang" value={nilaiData.bidang} onChange={onChange} options={ensureOpsiMemuatNilai(opsiBidang, nilaiData.bidang)} />
      </div>
      <ToggleAktif value={nilaiData.aktif} onChange={onChange} />
    </>
  );

  if (!edit || !bisaEditContoh) {
    return (
      <div className="flex items-start gap-2 py-1.5 group">
        <span className="text-gray-500 dark:text-gray-500 text-sm select-none">•</span>
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 italic">{contoh.contoh}</span>
        <BadgeStatus aktif={contoh.aktif ?? 1} />
        {bisaEditContoh && <button onClick={() => setEdit(true)} className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">sunting</button>}
        {bisaHapusContoh && <button onClick={handleHapus} disabled={isPending} className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">hapus</button>}
      </div>
    );
  }

  return (
    <div className="border border-gray-200 dark:border-gray-600 rounded-md p-3 mt-1 mb-2 bg-gray-50 dark:bg-dark-bg space-y-2">
      {renderContohFields(data, ubah)}
      <div className="flex gap-2 mt-2">
        <button onClick={handleSimpan} disabled={isPending} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
        <button onClick={() => setEdit(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
      </div>
    </div>
  );
}

function FormTambahContoh({ entriId, maknaId, simpanContoh, isPending, onBatal, opsiRagam, opsiBidang }) {
  const [data, setData] = useState({
    contoh: '',
    makna_contoh: '',
    ragam: '',
    bidang: '',
    aktif: 1,
  });

  const ubah = (field, val) => setData((prev) => ({ ...prev, [field]: val }));

  const handleSimpan = () => {
    if (!data.contoh.trim()) return;
    simpanContoh.mutate({ entriId, maknaId, ...data, urutan: 1 }, {
      onSuccess: () => {
        setData({ contoh: '', makna_contoh: '', ragam: '', bidang: '', aktif: 1 });
        onBatal();
      },
    });
  };

  return (
    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-3 mt-1 mb-2 space-y-2">
      <TextareaField label="Contoh" name="contoh" value={data.contoh} onChange={ubah} rows={2} />
      <TextareaField label="Makna contoh" name="makna_contoh" value={data.makna_contoh} onChange={ubah} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Ragam" name="ragam" value={data.ragam} onChange={ubah} options={ensureOpsiMemuatNilai(opsiRagam, data.ragam)} />
        <SelectField label="Bidang" name="bidang" value={data.bidang} onChange={ubah} options={ensureOpsiMemuatNilai(opsiBidang, data.bidang)} />
      </div>
      <ToggleAktif value={data.aktif} onChange={ubah} />
      <div className="flex gap-2">
        <button onClick={handleSimpan} disabled={isPending || !data.contoh.trim()} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
        <button onClick={onBatal} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
      </div>
    </div>
  );
}

function ItemMakna({
  makna,
  entriId,
  simpanMakna,
  hapusMakna,
  simpanContoh,
  hapusContoh,
  isPending,
  opsiKelasKata,
  opsiRagam,
  opsiRagamVarian,
  opsiBidang,
  opsiBahasa,
  opsiPenyingkatan,
  bisaTambahContoh,
  bisaEditContoh,
  bisaHapusContoh,
  bisaEditMakna,
  bisaHapusMakna,
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState({
    ...makna,
    ragam_varian: normalisasiRagamVarian(makna?.ragam_varian),
  });
  const [tambahContoh, setTambahContoh] = useState(false);

  const ubah = (field, val) => setData((p) => ({ ...p, [field]: val }));

  const handleSimpan = () => {
    if (!data.makna?.trim()) return;
    simpanMakna.mutate(
      {
        entriId,
        ...data,
        ragam_varian: normalisasiRagamVarian(data.ragam_varian),
      },
      { onSuccess: () => setEdit(false) }
    );
  };

  const handleHapus = () => {
    if (!confirm('Hapus makna ini beserta semua contohnya?')) return;
    hapusMakna.mutate({ entriId, maknaId: makna.id });
  };

  const renderMaknaFields = (nilaiData, onChange) => (
    <>
      <TextareaField label="Makna" name="makna" value={nilaiData.makna} onChange={onChange} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Kelas kata" name="kelas_kata" value={nilaiData.kelas_kata} onChange={onChange} options={ensureOpsiMemuatNilai(opsiKelasKata, nilaiData.kelas_kata)} />
        <SelectField label="Ragam" name="ragam" value={nilaiData.ragam} onChange={onChange} options={ensureOpsiMemuatNilai(opsiRagam, nilaiData.ragam)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Ragam varian" name="ragam_varian" value={nilaiData.ragam_varian || ''} onChange={onChange} options={opsiRagamVarian} />
        <SelectField
          label="Kiasan"
          name="kiasan"
          value={nilaiData.kiasan ? '1' : '0'}
          onChange={(_field, val) => onChange('kiasan', val === '1')}
          options={[
            { value: '0', label: 'Nonkiasan' },
            { value: '1', label: 'Kiasan' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Bidang" name="bidang" value={nilaiData.bidang} onChange={onChange} options={ensureOpsiMemuatNilai(opsiBidang, nilaiData.bidang)} />
        <SelectField label="Bahasa" name="bahasa" value={nilaiData.bahasa} onChange={onChange} options={ensureOpsiMemuatNilai(opsiBahasa, nilaiData.bahasa)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Ilmiah" name="ilmiah" value={nilaiData.ilmiah} onChange={onChange} />
        <InputField label="Kimia" name="kimia" value={nilaiData.kimia} onChange={onChange} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Penyingkatan" name="penyingkatan" value={nilaiData.penyingkatan} onChange={onChange} options={ensureOpsiMemuatNilai(opsiPenyingkatan, nilaiData.penyingkatan)} />
        <InputField label="Polisem" name="polisem" value={nilaiData.polisem} onChange={onChange} type="number" />
      </div>
      <ToggleAktif value={nilaiData.aktif} onChange={onChange} />
    </>
  );

  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg mb-2 overflow-hidden">
      {/* Header — always visible */}
      <div
        className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-dark-bg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        onClick={() => setTerbuka(!terbuka)}
      >
        <span className="text-gray-400 text-xs select-none">{terbuka ? '▾' : '▸'}</span>
        {makna.kelas_kata && (
          <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 px-1.5 py-0.5 rounded font-mono">{makna.kelas_kata}</span>
        )}
        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{makna.polisem || 1}.</span>
        <span className="flex-1 text-sm text-gray-800 dark:text-gray-200 line-clamp-1">{makna.makna}</span>
        {makna.contoh?.length > 0 && (
          <span className="text-xs text-gray-400 dark:text-gray-500">{makna.contoh.length} contoh</span>
        )}
        {bisaEditMakna && (
          <button
            onClick={(e) => { e.stopPropagation(); setEdit(true); setTerbuka(true); }}
            className="text-xs text-blue-500 hover:text-blue-700"
          >
            sunting
          </button>
        )}
        {bisaHapusMakna && (
          <button
            onClick={(e) => { e.stopPropagation(); handleHapus(); }}
            disabled={isPending}
            className="text-xs text-red-500 hover:text-red-700"
          >
            hapus
          </button>
        )}
      </div>

      {/* Body — expandable */}
      {terbuka && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          {edit && bisaEditMakna ? (
            <div className="space-y-2 mb-3">
              {renderMaknaFields(data, ubah)}
              <div className="flex gap-2">
                <button onClick={handleSimpan} disabled={isPending} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
                <button onClick={() => setEdit(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 space-x-3 flex items-center gap-2 flex-wrap">
              {makna.bidang && <span>Bidang: {makna.bidang}</span>}
              {makna.ragam && <span>Ragam: {makna.ragam}</span>}
              {makna.ragam_varian && <span>Ragam varian: {normalisasiRagamVarian(makna.ragam_varian)}</span>}
              {makna.bahasa && <span>Bahasa: {makna.bahasa}</span>}
              {makna.kiasan ? <span className="italic">kiasan</span> : null}
              <BadgeStatus aktif={makna.aktif ?? 1} />
            </div>
          )}

          {/* Contoh list */}
          <div className="ml-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contoh</span>
              {bisaTambahContoh && (
                <button
                  onClick={() => setTambahContoh(true)}
                  className="text-xs text-blue-500 hover:text-blue-700"
                >
                  + contoh
                </button>
              )}
            </div>

            {bisaTambahContoh && tambahContoh && (
              <FormTambahContoh
                entriId={entriId}
                maknaId={makna.id}
                simpanContoh={simpanContoh}
                isPending={isPending}
                opsiRagam={opsiRagam}
                opsiBidang={opsiBidang}
                onBatal={() => setTambahContoh(false)}
              />
            )}

            {makna.contoh?.length > 0 ? (
              makna.contoh.map((c) => (
                <ItemContoh
                  key={c.id}
                  contoh={c}
                  entriId={entriId}
                  maknaId={makna.id}
                  simpanContoh={simpanContoh}
                  hapusContoh={hapusContoh}
                  isPending={isPending}
                  opsiRagam={opsiRagam}
                  opsiBidang={opsiBidang}
                  bisaEditContoh={bisaEditContoh}
                  bisaHapusContoh={bisaHapusContoh}
                />
              ))
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">Belum ada contoh</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SeksiTagar ──────────────────────────────────────────────────────────────

const WARNA_TAGAR = {
  prefiks: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  sufiks: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  infiks: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  klitik: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  reduplikasi: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  prakategorial: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
};

function SeksiTagar({ entriId }) {
  const { data: tagarEntriResp } = useTagarEntri(entriId);
  const { data: semuaTagarResp } = useDaftarTagarUntukPilih();
  const simpanTagarEntri = useSimpanTagarEntri();

  const tagarTerpilih = tagarEntriResp?.data || [];
  const semuaTagar = semuaTagarResp?.data || [];

  const [queryInput, setQueryInput] = useState('');
  const [tampilDropdown, setTampilDropdown] = useState(false);

  const idsYangDipilih = new Set(tagarTerpilih.map((t) => t.id));
  const tagarTersedia = semuaTagar.filter((t) => !idsYangDipilih.has(t.id));
  const tagarFiltered = queryInput
    ? tagarTersedia.filter(
        (t) =>
          t.nama.toLowerCase().includes(queryInput.toLowerCase()) ||
          t.kode.toLowerCase().includes(queryInput.toLowerCase())
      )
    : tagarTersedia;

  const grupDropdown = tagarFiltered.reduce((acc, t) => {
    if (!acc[t.kategori]) acc[t.kategori] = [];
    acc[t.kategori].push(t);
    return acc;
  }, {});

  const tambahTagar = (tagar) => {
    const tagarBaru = [...tagarTerpilih, tagar];
    simpanTagarEntri.mutate({ entriId, tagar_ids: tagarBaru.map((t) => t.id) });
    setQueryInput('');
  };

  const hapusTagar = (tagarId) => {
    const tagarBaru = tagarTerpilih.filter((t) => t.id !== tagarId);
    simpanTagarEntri.mutate({ entriId, tagar_ids: tagarBaru.map((t) => t.id) });
  };

  return (
    <div className="mt-3 border-t border-gray-200 pt-4 dark:border-gray-700">
      <div className="mb-1 text-sm font-medium text-gray-700 dark:text-gray-300">Tagar</div>
      <div className="relative">
        <div className="flex flex-wrap gap-1.5 rounded border border-gray-300 bg-white p-2 dark:border-gray-600 dark:bg-gray-800 min-h-[2.5rem]">
          {tagarTerpilih.map((t) => (
            <span
              key={t.id}
              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm ${WARNA_TAGAR[t.kategori] || WARNA_TAGAR.prakategorial}`}
            >
              {t.nama}
              <button
                type="button"
                onClick={() => hapusTagar(t.id)}
                className="opacity-60 hover:opacity-100"
                aria-label={`Hapus tagar ${t.nama}`}
              >
                ×
              </button>
            </span>
          ))}
          <input
            type="text"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            onFocus={() => setTampilDropdown(true)}
            onBlur={() => setTimeout(() => setTampilDropdown(false), 120)}
            placeholder={tagarTerpilih.length === 0 ? 'Tambah tagar …' : ''}
            className="min-w-24 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        {tampilDropdown && Object.keys(grupDropdown).length > 0 && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-60 overflow-y-auto rounded border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
            {Object.entries(grupDropdown).map(([kat, items]) => (
              <div key={kat}>
                <div className="px-3 py-1 text-xs font-semibold uppercase text-gray-500 dark:text-gray-400">
                  {kat}
                </div>
                {items.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onMouseDown={() => tambahTagar(t)}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t.nama}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
      {simpanTagarEntri.isError && (
        <p className="mt-1 text-xs text-red-600">Gagal menyimpan tagar.</p>
      )}
    </div>
  );
}

function SeksiMakna({
  entriId,
  opsiKelasKata,
  opsiRagam,
  opsiRagamVarian,
  opsiBidang,
  opsiBahasa,
  opsiPenyingkatan,
  bisaTambahMakna,
  bisaEditMakna,
  bisaHapusMakna,
  bisaTambahContoh,
  bisaEditContoh,
  bisaHapusContoh,
}) {
  const { data: resp, isLoading } = useDaftarMakna(entriId);
  const simpanMakna = useSimpanMakna();
  const hapusMakna = useHapusMakna();
  const simpanContoh = useSimpanContoh();
  const hapusContoh = useHapusContoh();

  const [tambah, setTambah] = useState(false);
  const [maknaBaru, setMaknaBaru] = useState({
    makna: '',
    kelas_kata: '',
    ragam: '',
    ragam_varian: '',
    kiasan: false,
    bidang: '',
    bahasa: '',
    ilmiah: '',
    kimia: '',
    penyingkatan: '',
    polisem: '',
    aktif: 1,
  });

  const isPending = simpanMakna.isPending || hapusMakna.isPending || simpanContoh.isPending || hapusContoh.isPending;
  const daftar = resp?.data || [];

  const ubahMaknaBaru = (field, value) => {
    setMaknaBaru((prev) => ({ ...prev, [field]: value }));
  };

  const resetMaknaBaru = () => {
    setMaknaBaru({
      makna: '',
      kelas_kata: '',
      ragam: '',
      ragam_varian: '',
      kiasan: false,
      bidang: '',
      bahasa: '',
      ilmiah: '',
      kimia: '',
      penyingkatan: '',
      polisem: '',
      aktif: 1,
    });
  };

  const handleTambahMakna = () => {
    if (!maknaBaru.makna.trim()) return;
    simpanMakna.mutate(
      {
        entriId,
        ...maknaBaru,
        kelas_kata: maknaBaru.kelas_kata || null,
        ragam: maknaBaru.ragam || null,
        ragam_varian: normalisasiRagamVarian(maknaBaru.ragam_varian),
        bidang: maknaBaru.bidang || null,
        bahasa: maknaBaru.bahasa || null,
        ilmiah: maknaBaru.ilmiah || null,
        kimia: maknaBaru.kimia || null,
        penyingkatan: maknaBaru.penyingkatan || null,
        polisem: Number(maknaBaru.polisem) || (daftar.length + 1),
      },
      { onSuccess: () => { resetMaknaBaru(); setTambah(false); } }
    );
  };

  const renderMaknaBaruFields = () => (
    <>
      <TextareaField label="Makna" name="makna" value={maknaBaru.makna} onChange={ubahMaknaBaru} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Kelas kata" name="kelas_kata" value={maknaBaru.kelas_kata} onChange={ubahMaknaBaru} options={ensureOpsiMemuatNilai(opsiKelasKata, maknaBaru.kelas_kata)} />
        <SelectField label="Ragam" name="ragam" value={maknaBaru.ragam} onChange={ubahMaknaBaru} options={ensureOpsiMemuatNilai(opsiRagam, maknaBaru.ragam)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Ragam varian" name="ragam_varian" value={maknaBaru.ragam_varian || ''} onChange={ubahMaknaBaru} options={opsiRagamVarian} />
        <SelectField
          label="Kiasan"
          name="kiasan"
          value={maknaBaru.kiasan ? '1' : '0'}
          onChange={(_field, val) => ubahMaknaBaru('kiasan', val === '1')}
          options={[
            { value: '0', label: 'Nonkiasan' },
            { value: '1', label: 'Kiasan' },
          ]}
        />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Bidang" name="bidang" value={maknaBaru.bidang} onChange={ubahMaknaBaru} options={ensureOpsiMemuatNilai(opsiBidang, maknaBaru.bidang)} />
        <SelectField label="Bahasa" name="bahasa" value={maknaBaru.bahasa} onChange={ubahMaknaBaru} options={ensureOpsiMemuatNilai(opsiBahasa, maknaBaru.bahasa)} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <InputField label="Ilmiah" name="ilmiah" value={maknaBaru.ilmiah} onChange={ubahMaknaBaru} />
        <InputField label="Kimia" name="kimia" value={maknaBaru.kimia} onChange={ubahMaknaBaru} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Penyingkatan" name="penyingkatan" value={maknaBaru.penyingkatan} onChange={ubahMaknaBaru} options={ensureOpsiMemuatNilai(opsiPenyingkatan, maknaBaru.penyingkatan)} />
        <InputField label="Polisem" name="polisem" value={maknaBaru.polisem} onChange={ubahMaknaBaru} type="number" />
      </div>
      <ToggleAktif value={maknaBaru.aktif} onChange={ubahMaknaBaru} />
    </>
  );

  return (
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
          Makna {daftar.length > 0 && <span className="font-normal text-gray-400">({daftar.length})</span>}
        </h4>
        {bisaTambahMakna && (
          <button onClick={() => setTambah(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
            + Tambah makna
          </button>
        )}
      </div>

      {isLoading && <p className="text-sm text-gray-400">Memuat makna …</p>}

      {bisaTambahMakna && tambah && (
        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2 mb-3">
          {renderMaknaBaruFields()}
          <div className="flex gap-2">
            <button onClick={handleTambahMakna} disabled={isPending || !maknaBaru.makna.trim()} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
            <button onClick={() => { resetMaknaBaru(); setTambah(false); }} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
          </div>
        </div>
      )}

      {daftar.map((m) => (
        <ItemMakna
          key={m.id}
          makna={m}
          entriId={entriId}
          simpanMakna={simpanMakna}
          hapusMakna={hapusMakna}
          simpanContoh={simpanContoh}
          hapusContoh={hapusContoh}
          isPending={isPending}
          opsiKelasKata={opsiKelasKata}
          opsiRagam={opsiRagam}
          opsiRagamVarian={opsiRagamVarian}
          opsiBidang={opsiBidang}
          opsiBahasa={opsiBahasa}
          opsiPenyingkatan={opsiPenyingkatan}
          bisaTambahContoh={bisaTambahContoh}
          bisaEditContoh={bisaEditContoh}
          bisaHapusContoh={bisaHapusContoh}
          bisaEditMakna={bisaEditMakna}
          bisaHapusMakna={bisaHapusMakna}
        />
      ))}

      {!isLoading && daftar.length === 0 && !tambah && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Belum ada makna.</p>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function KamusAdmin() {
  const { punyaIzin } = useAuth();
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } =
    usePencarianAdmin(50);
  const [filterDraft, setFilterDraft] = useState(nilaiAwalFilterKamus);
  const [filterAktif, setFilterAktif] = useState(nilaiAwalFilterKamus);
  const [pesan, setPesan] = useState({ error: '', sukses: '' });
  const bisaTambah = punyaIzin('tambah_entri');
  const bisaEdit = punyaIzin('edit_entri');
  const bisaHapus = punyaIzin('hapus_entri');
  const bisaTambahMakna = punyaIzin('tambah_makna');
  const bisaEditMakna = punyaIzin('edit_makna');
  const bisaHapusMakna = punyaIzin('hapus_makna');
  const bisaTambahContoh = punyaIzin('tambah_contoh');
  const bisaEditContoh = punyaIzin('edit_contoh');
  const bisaHapusContoh = punyaIzin('hapus_contoh');
  const entriIdDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);

  const { data: resp, isLoading, isError } = useDaftarKamusAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    jenis: filterAktif.jenis,
    jenisRujuk: filterAktif.jenisRujuk,
    punyaHomograf: filterAktif.punyaHomograf,
    punyaHomonim: filterAktif.punyaHomonim,
    punyaLafal: filterAktif.punyaLafal,
    punyaPemenggalan: filterAktif.punyaPemenggalan,
    kelasKata: filterAktif.kelasKata,
    ragam: filterAktif.ragam,
    ragamVarian: filterAktif.ragamVarian,
    bidang: filterAktif.bidang,
    bahasa: filterAktif.bahasa,
    punyaIlmiah: filterAktif.punyaIlmiah,
    punyaKimia: filterAktif.punyaKimia,
    penyingkatan: filterAktif.penyingkatan,
    punyaKiasan: filterAktif.punyaKiasan,
    punyaContoh: filterAktif.punyaContoh,
    aktif: filterAktif.aktif,
  });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailKamusAdmin(entriIdDariPath);

  const { data: sumberResp } = useDaftarSumberAdmin({ limit: 200, kamus: '1' });
  const opsiSumber = (sumberResp?.data || []).map((item) => ({ value: String(item.id), label: item.nama }));

  const panel = useFormPanel(nilaiAwalEntri);
  const simpan = useSimpanKamus();
  const hapus = useHapusKamus();
  const [inputInduk, setInputInduk] = useState('');
  const [tampilSaranInduk, setTampilSaranInduk] = useState(false);
  const queryInduk = useMemo(() => String(inputInduk || '').trim(), [inputInduk]);
  const { data: respSaranInduk, isLoading: isSaranIndukLoading } = useAutocompleteIndukKamus({
    q: queryInduk,
    excludeId: panel.data.id || null,
  });
  const daftarSaranInduk = respSaranInduk?.data || [];
  const [inputRujuk, setInputRujuk] = useState('');
  const [tampilSaranRujuk, setTampilSaranRujuk] = useState(false);
  const queryRujuk = useMemo(() => String(inputRujuk || '').trim(), [inputRujuk]);
  const { data: respSaranRujuk, isLoading: isSaranRujukLoading } = useAutocompleteIndukKamus({
    q: queryRujuk,
    excludeId: panel.data.id || null,
  });
  const daftarSaranRujuk = respSaranRujuk?.data || [];
  const { data: respLabelKategori } = useKategoriLabelRedaksi(kategoriLabelRedaksi);

  const opsiKategori = useMemo(() => {
    const kategori = respLabelKategori?.data || {};

    const jenis = mapOpsiLabel(kategori['bentuk-kata'] || [], { includeEmpty: false });
    const jenisRujuk = filterJenisRujukOptions(
      mapOpsiLabel(kategori['jenis-rujuk'] || [], { emptyLabel: '— Tidak ada —' })
    );
    const kelasKata = mapOpsiLabel(kategori['kelas-kata'] || [], { emptyLabel: '— Tidak ada —' });
    const ragam = mapOpsiLabel(kategori.ragam || [], { emptyLabel: '— Tidak ada —' });
    const bidang = mapOpsiLabel(kategori.bidang || [], { emptyLabel: '— Tidak ada —' });
    const bahasa = mapOpsiLabel(kategori.bahasa || [], { emptyLabel: '— Tidak ada —' });
    const tipePenyingkat = mapOpsiLabel(kategori.penyingkatan || [], { emptyLabel: '— Tidak ada —' });

    return {
      jenis: jenis.length ? jenis : opsiJenisBawaan,
      jenisRujuk,
      kelasKata,
      ragam,
      bidang,
      bahasa,
      tipePenyingkat: tipePenyingkat.length > 1 ? tipePenyingkat : opsiTipePenyingkatBawaan,
    };
  }, [respLabelKategori]);

  const opsiFilterJenis = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.jenis.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Jenis—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.jenis]);

  const opsiFilterHomograf = useMemo(() => ([
    { value: '', label: '—Homograf—' },
    { value: '1', label: 'Berhomograf' },
    { value: '0', label: 'Nonhomograf' },
  ]), []);

  const opsiFilterHomonim = useMemo(() => ([
    { value: '', label: '—Homonim—' },
    { value: '1', label: 'Berhomonim' },
    { value: '0', label: 'Nonhomonim' },
  ]), []);

  const opsiFilterLafal = useMemo(() => ([
    { value: '', label: '—Lafal—' },
    { value: '1', label: 'Berlafal' },
    { value: '0', label: 'Nonlafal' },
  ]), []);

  const opsiFilterPemenggalan = useMemo(() => ([
    { value: '', label: '—Pemenggalan—' },
    { value: '1', label: 'Berpemenggalan' },
    { value: '0', label: 'Nonpemenggalan' },
  ]), []);

  const opsiFilterJenisRujuk = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.jenisRujuk.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Jenis Rujuk—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.jenisRujuk]);

  const opsiFilterStatusKamus = useMemo(() => ([
    { value: '', label: '—Status—' },
    { value: '1', label: 'Aktif' },
    { value: '0', label: 'Nonaktif' },
  ]), []);

  const opsiFilterKelasKata = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.kelasKata.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Kelas Kata—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.kelasKata]);

  const opsiFilterRagam = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.ragam.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Ragam—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.ragam]);

  const opsiFilterRagamVarian = useMemo(() => {
    const petaLabel = buatPetaLabelRagam(opsiKategori.ragam, true);
    return [
      { value: '', label: '—Ragam Varian—' },
      ...kodeRagamVarianValid.map((kode) => ({ value: kode, label: petaLabel.get(kode) || kode })),
    ];
  }, [opsiKategori.ragam]);

  const opsiFilterBidang = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.bidang.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Bidang—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.bidang]);

  const opsiFilterBahasa = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.bahasa.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Bahasa—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.bahasa]);

  const opsiFilterPunyaIlmiah = useMemo(() => ([
    { value: '', label: '—Ilmiah—' },
    { value: '1', label: 'Ada ilmiah' },
    { value: '0', label: 'Tanpa ilmiah' },
  ]), []);

  const opsiFilterPunyaKimia = useMemo(() => ([
    { value: '', label: '—Kimia—' },
    { value: '1', label: 'Ada kimia' },
    { value: '0', label: 'Tanpa kimia' },
  ]), []);

  const opsiFilterTipePenyingkat = useMemo(() => {
    const pilihanTanpaKosong = opsiKategori.tipePenyingkat.filter((item) => String(item?.value || '').trim());
    return [{ value: '', label: '—Penyingkatan—' }, ...pilihanTanpaKosong];
  }, [opsiKategori.tipePenyingkat]);

  const opsiFilterKiasan = useMemo(() => ([
    { value: '', label: '—Kiasan—' },
    { value: '1', label: 'Kiasan' },
    { value: '0', label: 'Nonkiasan' },
  ]), []);

  const opsiRagamVarian = useMemo(() => {
    const petaLabel = buatPetaLabelRagam(opsiKategori.ragam, false);
    return [
      { value: '', label: '— Tidak ada —' },
      ...kodeRagamVarianValid.map((kode) => ({ value: kode, label: petaLabel.get(kode) || kode })),
    ];
  }, [opsiKategori.ragam]);

  const opsiFilterPunyaContoh = useMemo(() => ([
    { value: '', label: '—Contoh—' },
    { value: '1', label: 'Ada contoh' },
    { value: '0', label: 'Tanpa contoh' },
  ]), []);

  const setFilterDraftValue = (key, value) => {
    setFilterDraft((prev) => ({ ...prev, [key]: value }));
  };

  const handleCari = () => {
    setFilterAktif(filterDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterDraft(nilaiAwalFilterKamus);
    setFilterAktif(nilaiAwalFilterKamus);
    hapusCari();
  };

  useEffect(() => {
    if (!idParam) return;
    if (entriIdDariPath) return;
    setPesan({ error: 'ID entri tidak valid.', sukses: '' });
    navigate('/redaksi/kamus', { replace: true });
  }, [idParam, entriIdDariPath, navigate]);

  useEffect(() => {
    if (!bisaEdit) return;
    if (sedangMenutupDariPath.current) return;
    if (!entriIdDariPath || isDetailLoading || isDetailError) return;
    const detailEntri = detailResp?.data;
    if (!detailEntri?.id) return;
    if (idEditTerbuka.current === detailEntri.id) return;
    panel.bukaUntukSunting(detailEntri);
    idEditTerbuka.current = detailEntri.id;
  }, [bisaEdit, detailResp, entriIdDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (!entriIdDariPath || bisaEdit) return;
    navigate('/redaksi/kamus', { replace: true });
  }, [bisaEdit, entriIdDariPath, navigate]);

  useEffect(() => {
    if (entriIdDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [entriIdDariPath]);

  useEffect(() => {
    if (!entriIdDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Entri tidak ditemukan.', sukses: '' });
    navigate('/redaksi/kamus', { replace: true });
  }, [entriIdDariPath, isDetailError, isDetailLoading, navigate]);

  useEffect(() => {
    if (!panel.buka) {
      setInputInduk('');
      setTampilSaranInduk(false);
      setInputRujuk('');
      setTampilSaranRujuk(false);
      return;
    }
    if (panel.data.induk_entri) {
      setInputInduk(panel.data.induk_entri);
      return;
    }
    if (!panel.data.induk) {
      setInputInduk('');
    }
  }, [panel.buka, panel.data.induk, panel.data.induk_entri]);

  useEffect(() => {
    if (!panel.buka) {
      setInputRujuk('');
      return;
    }
    if (panel.data.entri_rujuk) {
      setInputRujuk(panel.data.entri_rujuk);
      return;
    }
    if (!panel.data.entri_rujuk_id) {
      setInputRujuk('');
    }
  }, [panel.buka, panel.data.entri_rujuk, panel.data.entri_rujuk_id]);

  const pilihInduk = (item) => {
    panel.ubahField('induk', item.id);
    panel.ubahField('induk_entri', item.entri);
    setInputInduk(item.entri);
    setTampilSaranInduk(false);
  };

  const handleUbahInputInduk = (value) => {
    setInputInduk(value);
    setTampilSaranInduk(true);
    const trimmed = String(value).trim();
    const indukEntriAktif = panel.data.induk_entri || '';

    if (!trimmed || (indukEntriAktif && trimmed !== indukEntriAktif)) {
      panel.ubahField('induk', '');
      panel.ubahField('induk_entri', '');
    }
  };

  const pilihRujuk = (item) => {
    panel.ubahField('entri_rujuk_id', item.id);
    panel.ubahField('entri_rujuk', item.entri);
    setInputRujuk(item.entri);
    setTampilSaranRujuk(false);
  };

  const handleUbahInputRujuk = (value) => {
    setInputRujuk(value);
    setTampilSaranRujuk(true);
    const trimmed = String(value).trim();
    const entriRujukAktif = panel.data.entri_rujuk || '';

    if (!trimmed || (entriRujukAktif && trimmed !== entriRujukAktif)) {
      panel.ubahField('entri_rujuk_id', '');
      panel.ubahField('entri_rujuk', '');
    }
  };

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (entriIdDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/kamus', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (entriIdDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/kamus', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    item?.id && navigate(`/redaksi/kamus/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [{ name: 'entri', label: 'Entri' }]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }
    const payload = {
      ...panel.data,
      induk: panel.data.induk || null,
      entri_rujuk: panel.data.entri_rujuk_id || null,
    };
    delete payload.induk_entri;
    delete payload.entri_rujuk_id;

    simpan.mutate(payload, {
      onSuccess: (r) => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        // If just created, switch to edit mode so makna section shows
        if (panel.modeTambah && r?.data?.id) {
          panel.bukaUntukSunting(r.data);
        } else {
          setTimeout(() => tutupPanel(), 600);
        }
      },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus entri ini beserta semua maknanya?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' }),
    });
  };

  return (
    <TataLetak mode="admin" judul="Kamus" aksiJudul={bisaTambah ? <TombolAksiAdmin onClick={bukaTambah} /> : null}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari entri …"
        filters={[
          {
            key: 'jenis',
            value: filterDraft.jenis,
            onChange: (value) => setFilterDraftValue('jenis', value),
            options: opsiFilterJenis,
            ariaLabel: 'Filter jenis',
          },
          {
            key: 'punya_homograf',
            value: filterDraft.punyaHomograf,
            onChange: (value) => setFilterDraftValue('punyaHomograf', value),
            options: opsiFilterHomograf,
            ariaLabel: 'Filter homograf',
          },
          {
            key: 'punya_homonim',
            value: filterDraft.punyaHomonim,
            onChange: (value) => setFilterDraftValue('punyaHomonim', value),
            options: opsiFilterHomonim,
            ariaLabel: 'Filter homonim',
          },
          {
            key: 'punya_lafal',
            value: filterDraft.punyaLafal,
            onChange: (value) => setFilterDraftValue('punyaLafal', value),
            options: opsiFilterLafal,
            ariaLabel: 'Filter lafal',
          },
          {
            key: 'punya_pemenggalan',
            value: filterDraft.punyaPemenggalan,
            onChange: (value) => setFilterDraftValue('punyaPemenggalan', value),
            options: opsiFilterPemenggalan,
            ariaLabel: 'Filter pemenggalan',
          },
          {
            key: 'jenis_rujuk',
            value: filterDraft.jenisRujuk,
            onChange: (value) => setFilterDraftValue('jenisRujuk', value),
            options: opsiFilterJenisRujuk,
            ariaLabel: 'Filter jenis rujuk',
          },
          {
            key: 'aktif',
            value: filterDraft.aktif,
            onChange: (value) => setFilterDraftValue('aktif', value),
            options: opsiFilterStatusKamus,
            ariaLabel: 'Filter status entri',
          },
          {
            key: 'kelas_kata',
            value: filterDraft.kelasKata,
            onChange: (value) => setFilterDraftValue('kelasKata', value),
            options: opsiFilterKelasKata,
            ariaLabel: 'Filter kelas kata',
          },
          {
            key: 'ragam',
            value: filterDraft.ragam,
            onChange: (value) => setFilterDraftValue('ragam', value),
            options: opsiFilterRagam,
            ariaLabel: 'Filter ragam',
          },
          {
            key: 'ragam_varian',
            value: filterDraft.ragamVarian,
            onChange: (value) => setFilterDraftValue('ragamVarian', value),
            options: opsiFilterRagamVarian,
            ariaLabel: 'Filter ragam varian',
          },
          {
            key: 'bidang',
            value: filterDraft.bidang,
            onChange: (value) => setFilterDraftValue('bidang', value),
            options: opsiFilterBidang,
            ariaLabel: 'Filter bidang',
          },
          {
            key: 'bahasa',
            value: filterDraft.bahasa,
            onChange: (value) => setFilterDraftValue('bahasa', value),
            options: opsiFilterBahasa,
            ariaLabel: 'Filter bahasa',
          },
          {
            key: 'punya_ilmiah',
            value: filterDraft.punyaIlmiah,
            onChange: (value) => setFilterDraftValue('punyaIlmiah', value),
            options: opsiFilterPunyaIlmiah,
            ariaLabel: 'Filter ilmiah',
          },
          {
            key: 'punya_kimia',
            value: filterDraft.punyaKimia,
            onChange: (value) => setFilterDraftValue('punyaKimia', value),
            options: opsiFilterPunyaKimia,
            ariaLabel: 'Filter kimia',
          },
          {
            key: 'penyingkatan',
            value: filterDraft.penyingkatan,
            onChange: (value) => setFilterDraftValue('penyingkatan', value),
            options: opsiFilterTipePenyingkat,
            ariaLabel: 'Filter penyingkatan',
          },
          {
            key: 'punya_kiasan',
            value: filterDraft.punyaKiasan,
            onChange: (value) => setFilterDraftValue('punyaKiasan', value),
            options: opsiFilterKiasan,
            ariaLabel: 'Filter kiasan',
          },
          {
            key: 'punya_contoh',
            value: filterDraft.punyaContoh,
            onChange: (value) => setFilterDraftValue('punyaContoh', value),
            options: opsiFilterPunyaContoh,
            ariaLabel: 'Filter contoh',
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
        onKlikBaris={bisaEdit ? bukaSuntingDariDaftar : undefined}
      />

      {bisaEdit && (
        <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Entri' : 'Sunting Entri'}>
          <PesanForm error={pesan.error} sukses={pesan.sukses} />
          <InputField label="Entri" name="entri" value={panel.data.entri} onChange={panel.ubahField} required />
          <InputField
            label="Indeks"
            name="indeks"
            value={panel.data.indeks}
            onChange={panel.ubahField}
            placeholder="Kosongkan untuk normalisasi otomatis dari entri"
          />
          <SelectField label="Jenis" name="jenis" value={panel.data.jenis} onChange={panel.ubahField} options={ensureOpsiMemuatNilai(opsiKategori.jenis, panel.data.jenis)} />
          <div className="form-admin-group relative">
            <label htmlFor="field-induk" className="form-admin-label">Induk</label>
            <input
              id="field-induk"
              type="text"
              value={inputInduk}
              onChange={(event) => handleUbahInputInduk(event.target.value)}
              onFocus={() => setTampilSaranInduk(true)}
              onBlur={() => setTimeout(() => setTampilSaranInduk(false), 120)}
              placeholder="Cari entri induk …"
              className="form-admin-input"
            />
            {tampilSaranInduk && queryInduk && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-dark-bg-elevated">
                {isSaranIndukLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari entri …</div>
                )}
                {!isSaranIndukLoading && daftarSaranInduk.length === 0 && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada hasil.</div>
                )}
                {!isSaranIndukLoading && daftarSaranInduk.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => pilihInduk(item)}
                    className="block w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <div className="text-sm text-gray-800 dark:text-gray-200">{item.entri}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{item.jenis} • {item.indeks}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <InputField label="Homograf" name="homograf" type="number" value={panel.data.homograf} onChange={panel.ubahField} />
            <InputField label="Homonim" name="homonim" type="number" value={panel.data.homonim} onChange={panel.ubahField} />
          </div>
          <InputField label="Varian" name="varian" value={panel.data.varian} onChange={panel.ubahField} />
          <div className="grid grid-cols-2 gap-2">
            <InputField label="Lafal" name="lafal" value={panel.data.lafal} onChange={panel.ubahField} placeholder="contoh: la·fal" />
            <InputField label="Pemenggalan" name="pemenggalan" value={panel.data.pemenggalan} onChange={panel.ubahField} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <SelectField label="Jenis Rujuk" name="jenis_rujuk" value={panel.data.jenis_rujuk} onChange={panel.ubahField} options={opsiKategori.jenisRujuk} />
            <div className="form-admin-group relative">
              <label htmlFor="field-entri-rujuk" className="form-admin-label">Entri Rujuk</label>
              <input
                id="field-entri-rujuk"
                type="text"
                value={inputRujuk}
                onChange={(event) => handleUbahInputRujuk(event.target.value)}
                onFocus={() => setTampilSaranRujuk(true)}
                onBlur={() => setTimeout(() => setTampilSaranRujuk(false), 120)}
                placeholder="Cari entri rujukan …"
                className="form-admin-input"
              />
              {tampilSaranRujuk && queryRujuk && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-dark-bg-elevated">
                  {isSaranRujukLoading && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari entri …</div>
                  )}
                  {!isSaranRujukLoading && daftarSaranRujuk.length === 0 && (
                    <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Tidak ada hasil.</div>
                  )}
                  {!isSaranRujukLoading && daftarSaranRujuk.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => pilihRujuk(item)}
                      className="block w-full px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="text-sm text-gray-800 dark:text-gray-200">{item.entri}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">{item.jenis} • {item.indeks}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <InputField label="Lema Rujuk (legacy)" name="lema_rujuk" value={panel.data.lema_rujuk} onChange={panel.ubahField} disabled />
          <SelectField label="Sumber" name="sumber_id" value={String(panel.data.sumber_id || '')} onChange={panel.ubahField} options={opsiSumber} />
          <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
          <FormFooter
            onSimpan={handleSimpan}
            onBatal={tutupPanel}
            onHapus={bisaHapus ? handleHapus : undefined}
            isPending={simpan.isPending || hapus.isPending}
            modeTambah={panel.modeTambah}
          />

          {/* Tagar section — only in edit mode */}
          {!panel.modeTambah && panel.data.id && (
            <SeksiTagar entriId={panel.data.id} />
          )}

          {/* Makna + Contoh section — only in edit mode */}
          {!panel.modeTambah && panel.data.id && (
            <SeksiMakna
              entriId={panel.data.id}
              opsiKelasKata={opsiKategori.kelasKata}
              opsiRagam={opsiKategori.ragam}
              opsiRagamVarian={opsiRagamVarian}
              opsiBidang={opsiKategori.bidang}
              opsiBahasa={opsiKategori.bahasa}
              opsiPenyingkatan={opsiKategori.tipePenyingkat}
              bisaTambahMakna={bisaTambahMakna}
              bisaEditMakna={bisaEditMakna}
              bisaHapusMakna={bisaHapusMakna}
              bisaTambahContoh={bisaTambahContoh}
              bisaEditContoh={bisaEditContoh}
              bisaHapusContoh={bisaHapusContoh}
            />
          )}
        </PanelGeser>
      )}
    </TataLetak>
  );
}

export default KamusAdmin;
