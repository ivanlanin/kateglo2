/**
 * @fileoverview Halaman admin glosarium — daftar, cari, tambah, sunting istilah
 */

import { useState } from 'react';
import { useDaftarGlosariumAdmin, useSimpanGlosarium, useHapusGlosarium } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariTambahAdmin,
  InfoTotal,
  BadgeStatus,
  TabelAdmin,
  getApiErrorMessage,
  usePencarianAdmin,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SelectField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';

const nilaiAwal = { indonesia: '', asing: '', bidang: '', bahasa: 'en', sumber: '', aktif: 1 };

const opsiBahasa = [
  { value: 'en', label: 'Inggris' },
  { value: 'id', label: 'Indonesia' },
  { value: 'nl', label: 'Belanda' },
  { value: 'ar', label: 'Arab' },
  { value: 'ja', label: 'Jepang' },
  { value: 'de', label: 'Jerman' },
  { value: 'fr', label: 'Prancis' },
];

const kolom = [
  {
    key: 'indonesia',
    label: 'Indonesia',
    render: (item) => (
      <span className="font-medium text-gray-800 dark:text-gray-100">
        {item.indonesia}
      </span>
    ),
  },
  { key: 'asing', label: 'Asing' },
  { key: 'bidang', label: 'Bidang' },
  { key: 'sumber', label: 'Sumber' },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

function GlosariumAdmin() {
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);

  const { data: resp, isLoading, isError } = useDaftarGlosariumAdmin({ limit, offset, q });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanGlosarium();
  const hapus = useHapusGlosarium();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.indonesia?.trim() || !panel.data.asing?.trim()) {
      setPesan({ error: 'Istilah Indonesia dan Asing wajib diisi', sukses: '' });
      return;
    }
    simpan.mutate(panel.data, {
      onSuccess: () => { setPesan({ error: '', sukses: 'Tersimpan!' }); setTimeout(() => panel.tutup(), 600); },
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus istilah ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => panel.tutup(),
      onError: (err) => setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' }),
    });
  };

  return (
    <TataLetakAdmin judul="Glosarium">
      <KotakCariTambahAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari istilah …"
        onTambah={panel.bukaUntukTambah}
      />
      <InfoTotal q={q} total={total} label="istilah" />
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

      <PanelGeser buka={panel.buka} onTutup={panel.tutup} judul={panel.modeTambah ? 'Tambah Glosarium' : 'Sunting Glosarium'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Indonesia" name="indonesia" value={panel.data.indonesia} onChange={panel.ubahField} required />
        <InputField label="Asing" name="asing" value={panel.data.asing} onChange={panel.ubahField} required />
        <InputField label="Bidang" name="bidang" value={panel.data.bidang} onChange={panel.ubahField} />
        <SelectField label="Bahasa" name="bahasa" value={panel.data.bahasa} onChange={panel.ubahField} options={opsiBahasa} />
        <InputField label="Sumber" name="sumber" value={panel.data.sumber} onChange={panel.ubahField} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
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

export default GlosariumAdmin;
