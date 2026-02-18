/**
 * @fileoverview Halaman admin label — daftar, cari, tambah, sunting label
 */

import { useState } from 'react';
import { useDaftarLabelAdmin, useSimpanLabel, useHapusLabel } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariTambahAdmin,
  BadgeStatus,
  InfoTotal,
  TabelAdmin,
  getApiErrorMessage,
  potongTeks,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  TextareaField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';

const nilaiAwal = { kategori: '', kode: '', nama: '', urutan: 1, keterangan: '', aktif: true };

const kolom = [
  { key: 'kategori', label: 'Kategori' },
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  { key: 'urutan', label: 'Urutan' },
  {
    key: 'aktif',
    label: 'Status',
    render: (item) => <BadgeStatus aktif={item.aktif} />,
  },
  {
    key: 'keterangan',
    label: 'Keterangan',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.keterangan, 80)}</span>
    ),
  },
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

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kategori', label: 'Kategori' },
      { name: 'kode', label: 'Kode' },
      { name: 'nama', label: 'Nama' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        setTimeout(() => panel.tutup(), 600);
      },
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' });
      },
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus label ini?')) return;

    hapus.mutate(panel.data.id, {
      onSuccess: () => panel.tutup(),
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' });
      },
    });
  };

  return (
    <TataLetakAdmin judul="Label">
      <KotakCariTambahAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari label …"
        onTambah={panel.bukaUntukTambah}
      />

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
        <InputField label="Urutan" name="urutan" type="number" value={panel.data.urutan} onChange={panel.ubahField} />
        <ToggleAktif value={Boolean(panel.data.aktif)} onChange={panel.ubahField} />
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />
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
