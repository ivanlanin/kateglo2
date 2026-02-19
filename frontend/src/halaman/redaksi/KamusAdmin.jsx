/**
 * @fileoverview Halaman admin kamus — daftar, cari, tambah, sunting entri + makna + contoh
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarKamusAdmin, useDetailKamusAdmin, useSimpanKamus, useHapusKamus,
  useDaftarMakna, useSimpanMakna, useHapusMakna,
  useSimpanContoh, useHapusContoh,
  useKategoriLabelRedaksi,
} from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariTambahAdmin,
  InfoTotal,
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

// ─── Constants ───────────────────────────────────────────────────────────────

const nilaiAwalEntri = {
  entri: '',
  indeks: '',
  homonim: '',
  urutan: 1,
  jenis: 'dasar',
  lafal: '',
  pemenggalan: '',
  varian: '',
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
        <span className="font-medium text-gray-800 dark:text-gray-100">
          {item.entri}
        </span>
        {item.jenis_rujuk && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">→ {item.entri_rujuk}</span>
        )}
      </span>
    ),
  },
  { key: 'indeks', label: 'Indeks' },
  { key: 'homonim', label: 'Homonim' },
  { key: 'urutan', label: 'Urutan' },
  { key: 'jenis', label: 'Jenis' },
  { key: 'lafal', label: 'Lafal' },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ItemContoh({ contoh, entriId, maknaId, simpanContoh, hapusContoh, isPending, opsiRagam, opsiBidang }) {
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

  if (!edit) {
    return (
      <div className="flex items-start gap-2 py-1.5 group">
        <span className="text-gray-500 dark:text-gray-500 text-sm select-none">•</span>
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 italic">{contoh.contoh}</span>
        <BadgeStatus aktif={contoh.aktif ?? 1} />
        <button onClick={() => setEdit(true)} className="text-xs text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">sunting</button>
        <button onClick={handleHapus} disabled={isPending} className="text-xs text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">hapus</button>
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
        <button
          onClick={(e) => { e.stopPropagation(); setEdit(true); setTerbuka(true); }}
          className="text-xs text-blue-500 hover:text-blue-700"
        >
          sunting
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); handleHapus(); }}
          disabled={isPending}
          className="text-xs text-red-500 hover:text-red-700"
        >
          hapus
        </button>
      </div>

      {/* Body — expandable */}
      {terbuka && (
        <div className="px-3 py-2 border-t border-gray-200 dark:border-gray-700">
          {edit ? (
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
              <button
                onClick={() => setTambahContoh(true)}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                + contoh
              </button>
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
                />
              ))
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">Belum ada contoh</p>
            )}

            {tambahContoh && (
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

function SeksiMakna({ entriId, opsiKelasKata, opsiRagam, opsiBidang, opsiBahasa, opsiTipePenyingkat }) {
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
        <button onClick={() => setTambah(true)} className="text-xs text-blue-500 hover:text-blue-700 font-medium">
          + Tambah makna
        </button>
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
        />
      ))}

      {!isLoading && daftar.length === 0 && !tambah && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Belum ada makna.</p>
      )}

      {tambah && (
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
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);
  const [pesan, setPesan] = useState({ error: '', sukses: '' });
  const idEdit = Number.parseInt(idParam || '', 10);
  const entriIdDariPath = Number.isInteger(idEdit) && idEdit > 0 ? idEdit : null;
  const idEditTerbuka = useRef(null);

  const { data: resp, isLoading, isError } = useDaftarKamusAdmin({ limit, offset, q });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailKamusAdmin(entriIdDariPath);

  const panel = useFormPanel(nilaiAwalEntri);
  const simpan = useSimpanKamus();
  const hapus = useHapusKamus();
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

  useEffect(() => {
    if (!idParam) return;
    if (entriIdDariPath) return;
    setPesan({ error: 'ID entri tidak valid.', sukses: '' });
    navigate('/redaksi/kamus', { replace: true });
  }, [idParam, entriIdDariPath, navigate]);

  useEffect(() => {
    if (!entriIdDariPath || isDetailLoading || isDetailError) return;
    const detailEntri = detailResp?.data;
    if (!detailEntri?.id) return;
    if (idEditTerbuka.current === detailEntri.id) return;
    panel.bukaUntukSunting(detailEntri);
    idEditTerbuka.current = detailEntri.id;
  }, [detailResp, entriIdDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (!entriIdDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Entri tidak ditemukan.', sukses: '' });
    navigate('/redaksi/kamus', { replace: true });
  }, [entriIdDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    panel.tutup();
    if (entriIdDariPath) {
      idEditTerbuka.current = null;
      navigate('/redaksi/kamus', { replace: true });
    }
  };

  const bukaTambah = () => {
    if (entriIdDariPath) {
      idEditTerbuka.current = null;
      navigate('/redaksi/kamus', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    if (!item?.id) {
      panel.bukaUntukSunting(item);
      return;
    }
    panel.bukaUntukSunting(item);
    if (panel.buka) return;
    navigate(`/redaksi/kamus/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [{ name: 'entri', label: 'Entri' }]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }
    simpan.mutate(panel.data, {
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
    <TataLetakAdmin judul="Kamus">
      <KotakCariTambahAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari entri …"
        onTambah={bukaTambah}
      />
      <InfoTotal q={q} total={total} label="entri" />
      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        onOffset={setOffset}
        onKlikBaris={bukaSuntingDariDaftar}
      />

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
        <div className="grid grid-cols-2 gap-2">
          <InputField label="Homonim" name="homonim" type="number" value={panel.data.homonim} onChange={panel.ubahField} />
          <InputField label="Urutan" name="urutan" type="number" value={panel.data.urutan} onChange={panel.ubahField} />
        </div>
        <SelectField label="Jenis" name="jenis" value={panel.data.jenis} onChange={panel.ubahField} options={ensureOpsiMemuatNilai(opsiKategori.jenis, panel.data.jenis)} />
        <InputField label="Lafal" name="lafal" value={panel.data.lafal} onChange={panel.ubahField} placeholder="contoh: la·fal" />
        <InputField label="Pemenggalan" name="pemenggalan" value={panel.data.pemenggalan} onChange={panel.ubahField} />
        <InputField label="Varian" name="varian" value={panel.data.varian} onChange={panel.ubahField} />
        <SelectField label="Jenis Rujuk" name="jenis_rujuk" value={panel.data.jenis_rujuk} onChange={panel.ubahField} options={ensureOpsiMemuatNilai(opsiKategori.jenisRujuk, panel.data.jenis_rujuk)} />
        <InputField label="Entri Rujuk" name="entri_rujuk" value={panel.data.entri_rujuk} onChange={panel.ubahField} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          onHapus={handleHapus}
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
          />
        )}
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default KamusAdmin;
