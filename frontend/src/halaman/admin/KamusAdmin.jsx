/**
 * @fileoverview Halaman admin kamus — daftar, cari, tambah, sunting lema + makna + contoh
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  useDaftarKamusAdmin, useSimpanKamus, useHapusKamus,
  useDaftarMakna, useSimpanMakna, useHapusMakna,
  useSimpanContoh, useHapusContoh,
} from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/admin/TataLetakAdmin';
import {
  KotakCariAdmin, InfoTotal, TabelAdmin, BadgeStatus, usePencarianAdmin,
} from '../../komponen/admin/KomponenAdmin';
import PanelGeser from '../../komponen/admin/PanelGeser';
import {
  useFormPanel, InputField, SelectField, TextareaField, ToggleAktif,
  FormFooter, PesanForm,
} from '../../komponen/admin/FormAdmin';

// ─── Constants ───────────────────────────────────────────────────────────────

const nilaiAwalLema = { lema: '', jenis: 'dasar', lafal: '', pemenggalan: '', varian: '', jenis_rujuk: '', lema_rujuk: '', aktif: 1 };

const opsiJenis = [
  { value: 'dasar', label: 'Dasar' },
  { value: 'berimbuhan', label: 'Berimbuhan' },
  { value: 'gabungan', label: 'Gabungan' },
  { value: 'idiom', label: 'Idiom' },
  { value: 'peribahasa', label: 'Peribahasa' },
  { value: 'varian', label: 'Varian' },
];

const opsiTipePenyingkat = [
  { value: '', label: '— Tidak ada —' },
  { value: 'akronim', label: 'Akronim' },
  { value: 'kependekan', label: 'Kependekan' },
  { value: 'singkatan', label: 'Singkatan' },
];

const kolom = [
  {
    key: 'lema',
    label: 'Lema',
    render: (item) => (
      <span>
        <Link
          to={`/kamus/detail/${encodeURIComponent(item.lema)}`}
          className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
        >
          {item.lema}
        </Link>
        {item.jenis_rujuk && (
          <span className="text-xs text-gray-400 dark:text-gray-500 ml-2">→ {item.lema_rujuk}</span>
        )}
      </span>
    ),
  },
  { key: 'jenis', label: 'Jenis' },
  { key: 'lafal', label: 'Lafal' },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

// ─── Sub-components ──────────────────────────────────────────────────────────

function ItemContoh({ contoh, lemaId, maknaId, simpanContoh, hapusContoh, isPending }) {
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState(contoh);

  const ubah = (field, val) => setData((p) => ({ ...p, [field]: val }));

  const handleSimpan = () => {
    simpanContoh.mutate({ lemaId, maknaId, ...data }, {
      onSuccess: () => setEdit(false),
    });
  };

  const handleHapus = () => {
    if (!confirm('Hapus contoh ini?')) return;
    hapusContoh.mutate({ lemaId, maknaId, contohId: contoh.id });
  };

  if (!edit) {
    return (
      <div className="flex items-start gap-2 py-1.5 group">
        <span className="text-gray-500 dark:text-gray-500 text-sm select-none">•</span>
        <span className="flex-1 text-sm text-gray-700 dark:text-gray-300 italic">{contoh.contoh}</span>
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
        <InputField label="Ragam" name="ragam" value={data.ragam} onChange={ubah} />
        <InputField label="Bidang" name="bidang" value={data.bidang} onChange={ubah} />
      </div>
      <div className="flex gap-2 mt-2">
        <button onClick={handleSimpan} disabled={isPending} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
        <button onClick={() => setEdit(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
      </div>
    </div>
  );
}

function FormTambahContoh({ lemaId, maknaId, simpanContoh, isPending, onBatal }) {
  const [contoh, setContoh] = useState('');

  const handleSimpan = () => {
    if (!contoh.trim()) return;
    simpanContoh.mutate({ lemaId, maknaId, contoh, urutan: 1 }, {
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

function ItemMakna({ makna, lemaId, simpanMakna, hapusMakna, simpanContoh, hapusContoh, isPending }) {
  const [terbuka, setTerbuka] = useState(false);
  const [edit, setEdit] = useState(false);
  const [data, setData] = useState(makna);
  const [tambahContoh, setTambahContoh] = useState(false);

  const ubah = (field, val) => setData((p) => ({ ...p, [field]: val }));

  const handleSimpan = () => {
    if (!data.makna?.trim()) return;
    simpanMakna.mutate({ lemaId, ...data }, { onSuccess: () => setEdit(false) });
  };

  const handleHapus = () => {
    if (!confirm('Hapus makna ini beserta semua contohnya?')) return;
    hapusMakna.mutate({ lemaId, maknaId: makna.id });
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
                <InputField label="Kelas kata" name="kelas_kata" value={data.kelas_kata} onChange={ubah} placeholder="n, v, a, adv …" />
                <InputField label="Ragam" name="ragam" value={data.ragam} onChange={ubah} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Bidang" name="bidang" value={data.bidang} onChange={ubah} />
                <InputField label="Bahasa" name="bahasa" value={data.bahasa} onChange={ubah} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <InputField label="Ilmiah" name="ilmiah" value={data.ilmiah} onChange={ubah} />
                <InputField label="Kimia" name="kimia" value={data.kimia} onChange={ubah} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <SelectField label="Tipe penyingkat" name="tipe_penyingkat" value={data.tipe_penyingkat} onChange={ubah} options={opsiTipePenyingkat} />
                <InputField label="Urutan" name="urutan" value={data.urutan} onChange={ubah} type="number" />
              </div>
              <div className="flex gap-2">
                <button onClick={handleSimpan} disabled={isPending} className="form-admin-btn-simpan text-xs py-1 px-3">Simpan</button>
                <button onClick={() => setEdit(false)} className="form-admin-btn-batal text-xs py-1 px-3">Batal</button>
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 space-x-3">
              {makna.bidang && <span>Bidang: {makna.bidang}</span>}
              {makna.ragam && <span>Ragam: {makna.ragam}</span>}
              {makna.bahasa && <span>Bahasa: {makna.bahasa}</span>}
              {makna.kiasan ? <span className="italic">kiasan</span> : null}
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
                  lemaId={lemaId}
                  maknaId={makna.id}
                  simpanContoh={simpanContoh}
                  hapusContoh={hapusContoh}
                  isPending={isPending}
                />
              ))
            ) : (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic py-1">Belum ada contoh</p>
            )}

            {tambahContoh && (
              <FormTambahContoh
                lemaId={lemaId}
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

function SeksiMakna({ lemaId }) {
  const { data: resp, isLoading } = useDaftarMakna(lemaId);
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
      { lemaId, makna: maknaBaruTeks, kelas_kata: maknaBaruKelas || null, urutan: daftar.length + 1 },
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
          lemaId={lemaId}
          simpanMakna={simpanMakna}
          hapusMakna={hapusMakna}
          simpanContoh={simpanContoh}
          hapusContoh={hapusContoh}
          isPending={isPending}
        />
      ))}

      {!isLoading && daftar.length === 0 && !tambah && (
        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Belum ada makna.</p>
      )}

      {tambah && (
        <div className="border border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-3 space-y-2">
          <TextareaField label="Makna" name="makna_baru" value={maknaBaruTeks} onChange={(_n, v) => setMaknaBaruTeks(v)} rows={2} />
          <InputField label="Kelas kata" name="kelas_baru" value={maknaBaruKelas} onChange={(_n, v) => setMaknaBaruKelas(v)} placeholder="n, v, a, adv …" />
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
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);

  const { data: resp, isLoading, isError } = useDaftarKamusAdmin({ limit, offset, q });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwalLema);
  const simpan = useSimpanKamus();
  const hapus = useHapusKamus();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.lema?.trim()) { setPesan({ error: 'Lema wajib diisi', sukses: '' }); return; }
    simpan.mutate(panel.data, {
      onSuccess: (r) => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        // If just created, switch to edit mode so makna section shows
        if (panel.modeTambah && r?.data?.id) {
          panel.bukaUntukSunting(r.data);
        } else {
          setTimeout(() => panel.tutup(), 600);
        }
      },
      onError: (err) => setPesan({ error: err?.response?.data?.error || err?.response?.data?.message || 'Gagal menyimpan', sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus lema ini beserta semua maknanya?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => panel.tutup(),
      onError: (err) => setPesan({ error: err?.response?.data?.error || 'Gagal menghapus', sukses: '' }),
    });
  };

  return (
    <TataLetakAdmin judul="Kamus">
      <div className="flex justify-between items-center mb-4">
        <KotakCariAdmin
          nilai={cari}
          onChange={setCari}
          onCari={kirimCari}
          onHapus={hapusCari}
          placeholder="Cari lema …"
        />
        <button onClick={panel.bukaUntukTambah} className="form-admin-btn-simpan whitespace-nowrap ml-4">
          + Tambah
        </button>
      </div>
      <InfoTotal q={q} total={total} label="lema" />
      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        onOffset={setOffset}
        onKlikBaris={panel.bukaUntukSunting}
      />

      <PanelGeser buka={panel.buka} onTutup={panel.tutup} judul={panel.modeTambah ? 'Tambah Lema' : 'Sunting Lema'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Lema" name="lema" value={panel.data.lema} onChange={panel.ubahField} required />
        <SelectField label="Jenis" name="jenis" value={panel.data.jenis} onChange={panel.ubahField} options={opsiJenis} />
        <InputField label="Lafal" name="lafal" value={panel.data.lafal} onChange={panel.ubahField} placeholder="contoh: la·fal" />
        <InputField label="Pemenggalan" name="pemenggalan" value={panel.data.pemenggalan} onChange={panel.ubahField} />
        <InputField label="Varian" name="varian" value={panel.data.varian} onChange={panel.ubahField} />
        <InputField label="Jenis Rujuk" name="jenis_rujuk" value={panel.data.jenis_rujuk} onChange={panel.ubahField} />
        <InputField label="Lema Rujuk" name="lema_rujuk" value={panel.data.lema_rujuk} onChange={panel.ubahField} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={panel.tutup}
          onHapus={handleHapus}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />

        {/* Makna + Contoh section — only in edit mode */}
        {!panel.modeTambah && panel.data.id && <SeksiMakna lemaId={panel.data.id} />}
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default KamusAdmin;
