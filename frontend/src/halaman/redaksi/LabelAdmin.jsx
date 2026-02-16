/**
 * @fileoverview Halaman admin label — daftar, cari, tambah, sunting label
 */

import { useState } from 'react';
import { useDaftarLabelAdmin, useSimpanLabel, useHapusLabel } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariAdmin,
  InfoTotal,
  TabelAdmin,
  potongTeks,
  usePencarianAdmin,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  TextareaField,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';

const nilaiAwal = { kategori: '', kode: '', nama: '', keterangan: '', sumber: '' };

const kolom = [
  { key: 'kategori', label: 'Kategori' },
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  {
    key: 'keterangan',
    label: 'Keterangan',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.keterangan, 80)}</span>
    ),
  },
  { key: 'sumber', label: 'Sumber' },
];

function LabelAdmin() {
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } = usePencarianAdmin(50);

  const { data: resp, isLoading, isError } = useDaftarLabelAdmin({ limit, offset, q });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanLabel();
  const hapus = useHapusLabel();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    if (!panel.data.kategori?.trim()) {
      setPesan({ error: 'Kategori wajib diisi', sukses: '' });
      return;
    }

    if (!panel.data.kode?.trim()) {
      setPesan({ error: 'Kode wajib diisi', sukses: '' });
      return;
    }

    if (!panel.data.nama?.trim()) {
      setPesan({ error: 'Nama wajib diisi', sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        setTimeout(() => panel.tutup(), 600);
      },
      onError: (err) => {
        setPesan({ error: err?.response?.data?.message || 'Gagal menyimpan', sukses: '' });
      },
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus label ini?')) return;

    hapus.mutate(panel.data.id, {
      onSuccess: () => panel.tutup(),
      onError: (err) => {
        setPesan({ error: err?.response?.data?.message || 'Gagal menghapus', sukses: '' });
      },
    });
  };

  return (
    <TataLetakAdmin judul="Label">
      <div className="flex justify-between items-center mb-4">
        <KotakCariAdmin
          nilai={cari}
          onChange={setCari}
          onCari={kirimCari}
          onHapus={hapusCari}
          placeholder="Cari label …"
        />
        <button onClick={panel.bukaUntukTambah} className="form-admin-btn-simpan whitespace-nowrap ml-4">
          + Tambah
        </button>
      </div>

      <InfoTotal q={q} total={total} label="label" />

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

      <PanelGeser buka={panel.buka} onTutup={panel.tutup} judul={panel.modeTambah ? 'Tambah Label' : 'Sunting Label'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kategori" name="kategori" value={panel.data.kategori} onChange={panel.ubahField} required />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />
        <InputField label="Sumber" name="sumber" value={panel.data.sumber} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={panel.tutup}
          onHapus={handleHapus}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default LabelAdmin;
