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
} from '../../komponen/redaksi/FormAdmin';
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
  sumber: '',
  jenis_rujuk: '',
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

const kategoriLabelRedaksi = [
  'bentuk-kata',
  'jenis-rujuk',
  'kelas-kata',
  'ragam',
  'bidang',
  'bahasa',
  'penyingkatan',
];

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
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">→ {item.entri_rujuk}</span>
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
      <TextareaField label="Contoh" name="contoh" value={data.contoh} onChange={ubah} rows={2} />
      <TextareaField label="Makna contoh" name="makna_contoh" value={data.makna_contoh} onChange={ubah} rows={2} />
      <div className="grid grid-cols-2 gap-2">
        <SelectField label="Ragam" name="ragam" value={data.ragam} onChange={ubah} options={ensureOpsiMemuatNilai(opsiRagam, data.ragam)} />
        <SelectField label="Bidang" name="bidang" value={data.bidang} onChange={ubah} options={ensureOpsiMemuatNilai(opsiBidang, data.bidang)} />
      </div>
      <ToggleAktif value={data.aktif} onChange={ubah} />
      <div className="flex gap-2 mt-2">
        <button onClick={handleSimpan} disabled={isPending} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
        <button onClick={() => setEdit(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
      </div>
    </div>
  );
}

function FormTambahContoh({ entriId, maknaId, simpanContoh, isPending, onBatal }) {
  const [contoh, setContoh] = useState('');

  const handleSimpan = () => {
    if (!contoh.trim()) return;
    simpanContoh.mutate({ entriId, maknaId, contoh, urutan: 1 }, {
      onSuccess: () => { setContoh(''); onBatal(); },
    });
  };

  return (
    <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-3 mt-1 mb-2 space-y-2">
      <TextareaField label="Contoh baru" name="contoh_baru" value={contoh} onChange={(_n, v) => setContoh(v)} rows={2} />
      <div className="flex gap-2">
        <button onClick={handleSimpan} disabled={isPending || !contoh.trim()} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
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
  opsiBidang,
  opsiBahasa,
  opsiTipePenyingkat,
  bisaTambahContoh,
  bisaEditContoh,
  bisaHapusContoh,
  bisaEditMakna,
  bisaHapusMakna,
}) {
  const [terbuka, setTerbuka] = useState(false);
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState(makna);
  const [tambahContoh, setTambahContoh] = useState(false);

  const ubah = (field, val) => setData((p) => ({ ...p, [field]: val }));

  const handleSimpan = () => {
    if (!data.makna?.trim()) return;
    simpanMakna.mutate({ entriId, ...data }, { onSuccess: () => setEdit(false) });
  };

  const handleHapus = () => {
    if (!confirm('Hapus makna ini beserta semua contohnya?')) return;
    hapusMakna.mutate({ entriId, maknaId: makna.id });
  };

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
              <TextareaField label="Makna" name="makna" value={data.makna} onChange={ubah} rows={2} />
              <div className="grid grid-cols-2 gap-2">
                <SelectField label="Kelas kata" name="kelas_kata" value={data.kelas_kata} onChange={ubah} options={ensureOpsiMemuatNilai(opsiKelasKata, data.kelas_kata)} />
                <SelectField label="Ragam" name="ragam" value={data.ragam} onChange={ubah} options={ensureOpsiMemuatNilai(opsiRagam, data.ragam)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SelectField label="Bidang" name="bidang" value={data.bidang} onChange={ubah} options={ensureOpsiMemuatNilai(opsiBidang, data.bidang)} />
                <SelectField label="Bahasa" name="bahasa" value={data.bahasa} onChange={ubah} options={ensureOpsiMemuatNilai(opsiBahasa, data.bahasa)} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Ilmiah" name="ilmiah" value={data.ilmiah} onChange={ubah} />
                <InputField label="Kimia" name="kimia" value={data.kimia} onChange={ubah} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SelectField label="Tipe penyingkat" name="tipe_penyingkat" value={data.tipe_penyingkat} onChange={ubah} options={ensureOpsiMemuatNilai(opsiTipePenyingkat, data.tipe_penyingkat)} />
                <InputField label="Urutan" name="urutan" value={data.urutan} onChange={ubah} type="number" />
              </div>
              <ToggleAktif value={data.aktif} onChange={ubah} />
              <div className="flex gap-2">
                <button onClick={handleSimpan} disabled={isPending} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
                <button onClick={() => setEdit(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 space-x-3 flex items-center gap-2 flex-wrap">
              {makna.bidang && <span>Bidang: {makna.bidang}</span>}
              {makna.ragam && <span>Ragam: {makna.ragam}</span>}
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

            {bisaTambahContoh && tambahContoh && (
              <FormTambahContoh
                entriId={entriId}
                maknaId={makna.id}
                simpanContoh={simpanContoh}
                isPending={isPending}
                onBatal={() => setTambahContoh(false)}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SeksiMakna({
  entriId,
  opsiKelasKata,
  opsiRagam,
  opsiBidang,
  opsiBahasa,
  opsiTipePenyingkat,
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
  const [maknaBaruTeks, setMaknaBaruTeks] = useState('');
  const [maknaBaruKelas, setMaknaBaruKelas] = useState('');

  const isPending = simpanMakna.isPending || hapusMakna.isPending || simpanContoh.isPending || hapusContoh.isPending;
  const daftar = resp?.data || [];

  const handleTambahMakna = () => {
    if (!maknaBaruTeks.trim()) return;
    simpanMakna.mutate(
      { entriId, makna: maknaBaruTeks, kelas_kata: maknaBaruKelas || null, urutan: daftar.length + 1 },
      { onSuccess: () => { setMaknaBaruTeks(''); setMaknaBaruKelas(''); setTambah(false); } }
    );
  };

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
          opsiBidang={opsiBidang}
          opsiBahasa={opsiBahasa}
          opsiTipePenyingkat={opsiTipePenyingkat}
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

      {bisaTambahMakna && tambah && (
        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
          <TextareaField label="Makna" name="makna_baru" value={maknaBaruTeks} onChange={(_n, v) => setMaknaBaruTeks(v)} rows={2} />
          <SelectField label="Kelas kata" name="kelas_baru" value={maknaBaruKelas} onChange={(_n, v) => setMaknaBaruKelas(v)} options={ensureOpsiMemuatNilai(opsiKelasKata, maknaBaruKelas)} />
          <div className="flex gap-2">
            <button onClick={handleTambahMakna} disabled={isPending || !maknaBaruTeks.trim()} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
            <button onClick={() => setTambah(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function KamusAdmin() {
  const { punyaIzin } = useAuth();
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);
  const [filterJenisDraft, setFilterJenisDraft] = useState('');
  const [filterPunyaHomografDraft, setFilterPunyaHomografDraft] = useState('');
  const [filterPunyaHomonimDraft, setFilterPunyaHomonimDraft] = useState('');
  const [filterKelasKataDraft, setFilterKelasKataDraft] = useState('');
  const [filterRagamDraft, setFilterRagamDraft] = useState('');
  const [filterBidangDraft, setFilterBidangDraft] = useState('');
  const [filterBahasaDraft, setFilterBahasaDraft] = useState('');
  const [filterPunyaIlmiahDraft, setFilterPunyaIlmiahDraft] = useState('');
  const [filterPunyaKimiaDraft, setFilterPunyaKimiaDraft] = useState('');
  const [filterTipePenyingkatDraft, setFilterTipePenyingkatDraft] = useState('');
  const [filterPunyaContohDraft, setFilterPunyaContohDraft] = useState('');
  const [filterAktifDraft, setFilterAktifDraft] = useState('');
  const [filterJenis, setFilterJenis] = useState('');
  const [filterPunyaHomograf, setFilterPunyaHomograf] = useState('');
  const [filterPunyaHomonim, setFilterPunyaHomonim] = useState('');
  const [filterKelasKata, setFilterKelasKata] = useState('');
  const [filterRagam, setFilterRagam] = useState('');
  const [filterBidang, setFilterBidang] = useState('');
  const [filterBahasa, setFilterBahasa] = useState('');
  const [filterPunyaIlmiah, setFilterPunyaIlmiah] = useState('');
  const [filterPunyaKimia, setFilterPunyaKimia] = useState('');
  const [filterTipePenyingkat, setFilterTipePenyingkat] = useState('');
  const [filterPunyaContoh, setFilterPunyaContoh] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
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
    offset,
    q,
    aktif: filterAktif,
    jenis: filterJenis,
    punyaHomograf: filterPunyaHomograf,
    punyaHomonim: filterPunyaHomonim,
    kelasKata: filterKelasKata,
    ragam: filterRagam,
    bidang: filterBidang,
    bahasa: filterBahasa,
    punyaIlmiah: filterPunyaIlmiah,
    punyaKimia: filterPunyaKimia,
    tipePenyingkat: filterTipePenyingkat,
    punyaContoh: filterPunyaContoh,
  });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailKamusAdmin(entriIdDariPath);

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
  const { data: respLabelKategori } = useKategoriLabelRedaksi(kategoriLabelRedaksi);

  const opsiKategori = useMemo(() => {
    const kategori = respLabelKategori?.data || {};

    const jenis = mapOpsiLabel(kategori['bentuk-kata'] || [], { includeEmpty: false });
    const jenisRujuk = mapOpsiLabel(kategori['jenis-rujuk'] || [], { emptyLabel: '— Tidak ada —' });
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

  const opsiFilterPunyaContoh = useMemo(() => ([
    { value: '', label: '—Contoh—' },
    { value: '1', label: 'Ada contoh' },
    { value: '0', label: 'Tanpa contoh' },
  ]), []);

  const handleCari = () => {
    setFilterJenis(filterJenisDraft);
    setFilterPunyaHomograf(filterPunyaHomografDraft);
    setFilterPunyaHomonim(filterPunyaHomonimDraft);
    setFilterKelasKata(filterKelasKataDraft);
    setFilterRagam(filterRagamDraft);
    setFilterBidang(filterBidangDraft);
    setFilterBahasa(filterBahasaDraft);
    setFilterPunyaIlmiah(filterPunyaIlmiahDraft);
    setFilterPunyaKimia(filterPunyaKimiaDraft);
    setFilterTipePenyingkat(filterTipePenyingkatDraft);
    setFilterPunyaContoh(filterPunyaContohDraft);
    setFilterAktif(filterAktifDraft);
    kirimCari(cari);
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
    };
    delete payload.induk_entri;

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
        onHapus={hapusCari}
        placeholder="Cari entri …"
        filters={[
          {
            key: 'jenis',
            value: filterJenisDraft,
            onChange: setFilterJenisDraft,
            options: opsiFilterJenis,
            ariaLabel: 'Filter jenis',
          },
          {
            key: 'punya_homograf',
            value: filterPunyaHomografDraft,
            onChange: setFilterPunyaHomografDraft,
            options: opsiFilterHomograf,
            ariaLabel: 'Filter homograf',
          },
          {
            key: 'punya_homonim',
            value: filterPunyaHomonimDraft,
            onChange: setFilterPunyaHomonimDraft,
            options: opsiFilterHomonim,
            ariaLabel: 'Filter homonim',
          },
          {
            key: 'aktif',
            value: filterAktifDraft,
            onChange: setFilterAktifDraft,
            options: opsiFilterStatusKamus,
            ariaLabel: 'Filter status entri',
          },
          {
            key: 'kelas_kata',
            value: filterKelasKataDraft,
            onChange: setFilterKelasKataDraft,
            options: opsiFilterKelasKata,
            ariaLabel: 'Filter kelas kata',
          },
          {
            key: 'ragam',
            value: filterRagamDraft,
            onChange: setFilterRagamDraft,
            options: opsiFilterRagam,
            ariaLabel: 'Filter ragam',
          },
          {
            key: 'bidang',
            value: filterBidangDraft,
            onChange: setFilterBidangDraft,
            options: opsiFilterBidang,
            ariaLabel: 'Filter bidang',
          },
          {
            key: 'bahasa',
            value: filterBahasaDraft,
            onChange: setFilterBahasaDraft,
            options: opsiFilterBahasa,
            ariaLabel: 'Filter bahasa',
          },
          {
            key: 'punya_ilmiah',
            value: filterPunyaIlmiahDraft,
            onChange: setFilterPunyaIlmiahDraft,
            options: opsiFilterPunyaIlmiah,
            ariaLabel: 'Filter ilmiah',
          },
          {
            key: 'punya_kimia',
            value: filterPunyaKimiaDraft,
            onChange: setFilterPunyaKimiaDraft,
            options: opsiFilterPunyaKimia,
            ariaLabel: 'Filter kimia',
          },
          {
            key: 'tipe_penyingkat',
            value: filterTipePenyingkatDraft,
            onChange: setFilterTipePenyingkatDraft,
            options: opsiFilterTipePenyingkat,
            ariaLabel: 'Filter penyingkatan',
          },
          {
            key: 'punya_contoh',
            value: filterPunyaContohDraft,
            onChange: setFilterPunyaContohDraft,
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
        onOffset={setOffset}
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
              placeholder="Cari entri induk…"
              className="form-admin-input"
            />
            {tampilSaranInduk && queryInduk && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-52 overflow-auto rounded-md border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-dark-bg-elevated">
                {isSaranIndukLoading && (
                  <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">Mencari entri…</div>
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
            <SelectField label="Jenis Rujuk" name="jenis_rujuk" value={panel.data.jenis_rujuk} onChange={panel.ubahField} options={ensureOpsiMemuatNilai(opsiKategori.jenisRujuk, panel.data.jenis_rujuk)} />
            <InputField label="Entri Rujuk" name="entri_rujuk" value={panel.data.entri_rujuk} onChange={panel.ubahField} />
          </div>
          <InputField label="Sumber" name="sumber" value={panel.data.sumber} onChange={panel.ubahField} />
          <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
          <FormFooter
            onSimpan={handleSimpan}
            onBatal={tutupPanel}
            onHapus={bisaHapus ? handleHapus : undefined}
            isPending={simpan.isPending || hapus.isPending}
            modeTambah={panel.modeTambah}
          />

          {/* Makna + Contoh section — only in edit mode */}
          {!panel.modeTambah && panel.data.id && (
            <SeksiMakna
              entriId={panel.data.id}
              opsiKelasKata={opsiKategori.kelasKata}
              opsiRagam={opsiKategori.ragam}
              opsiBidang={opsiKategori.bidang}
              opsiBahasa={opsiKategori.bahasa}
              opsiTipePenyingkat={opsiKategori.tipePenyingkat}
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
