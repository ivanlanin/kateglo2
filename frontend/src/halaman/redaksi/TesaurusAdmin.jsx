/**
 * @fileoverview Halaman admin tesaurus — daftar, cari, tambah, sunting entri tesaurus
 */

import { useState } from 'react';
import { useDaftarTesaurusAdmin, useSimpanTesaurus, useHapusTesaurus } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariAdmin,
  InfoTotal,
  BadgeStatus,
  TabelAdmin,
  potongTeks,
  usePencarianAdmin,
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

const nilaiAwal = { lema: '', sinonim: '', antonim: '', turunan: '', gabungan: '', berkaitan: '', aktif: 1 };

const kolom = [
  {
    key: 'lema',
    label: 'Lema',
    render: (item) => (
      <span className="font-medium text-gray-800 dark:text-gray-100">
        {item.lema}
      </span>
    ),
  },
  {
    key: 'sinonim',
    label: 'Sinonim',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.sinonim, 60)}</span>
    ),
  },
  {
    key: 'antonim',
    label: 'Antonim',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.antonim, 60)}</span>
    ),
  },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

function TesaurusAdmin() {
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } =
    usePencarianAdmin(50);

  const { data: resp, isLoading, isError } = useDaftarTesaurusAdmin({ limit, offset, q });
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanTesaurus();
  const hapus = useHapusTesaurus();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.lema?.trim()) { setPesan({ error: 'Lema wajib diisi', sukses: '' }); return; }
    simpan.mutate(panel.data, {
      onSuccess: () => { setPesan({ error: '', sukses: 'Tersimpan!' }); setTimeout(() => panel.tutup(), 600); },
      onError: (err) => setPesan({ error: err?.response?.data?.error || 'Gagal menyimpan', sukses: '' }),
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus entri tesaurus ini?')) return;
    hapus.mutate(panel.data.id, {
      onSuccess: () => panel.tutup(),
      onError: (err) => setPesan({ error: err?.response?.data?.error || 'Gagal menghapus', sukses: '' }),
    });
  };

  return (
    <TataLetakAdmin judul="Tesaurus">
      <div className="flex justify-between items-center mb-4">
        <KotakCariAdmin
          nilai={cari}
          onChange={setCari}
          onCari={kirimCari}
          onHapus={hapusCari}
          placeholder="Cari tesaurus …"
        />
        <button onClick={panel.bukaUntukTambah} className="form-admin-btn-simpan whitespace-nowrap ml-4">
          + Tambah
        </button>
      </div>
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
        onKlikBaris={panel.bukaUntukSunting}
      />

      <PanelGeser buka={panel.buka} onTutup={panel.tutup} judul={panel.modeTambah ? 'Tambah Tesaurus' : 'Sunting Tesaurus'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Lema" name="lema" value={panel.data.lema} onChange={panel.ubahField} required />
        <TextareaField label="Sinonim" name="sinonim" value={panel.data.sinonim} onChange={panel.ubahField} placeholder="Pisahkan dengan koma" />
        <TextareaField label="Antonim" name="antonim" value={panel.data.antonim} onChange={panel.ubahField} placeholder="Pisahkan dengan koma" />
        <TextareaField label="Turunan" name="turunan" value={panel.data.turunan} onChange={panel.ubahField} placeholder="Pisahkan dengan koma" />
        <TextareaField label="Gabungan" name="gabungan" value={panel.data.gabungan} onChange={panel.ubahField} placeholder="Pisahkan dengan koma" />
        <TextareaField label="Berkaitan" name="berkaitan" value={panel.data.berkaitan} onChange={panel.ubahField} placeholder="Pisahkan dengan koma" />
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

export default TesaurusAdmin;
