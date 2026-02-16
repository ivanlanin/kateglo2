/**
 * @fileoverview Halaman admin tesaurus — daftar, cari, tambah, sunting entri tesaurus
 */

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDaftarTesaurusAdmin, useSimpanTesaurus, useHapusTesaurus } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/admin/TataLetakAdmin';
import {
  KotakCariAdmin,
  InfoTotal,
  TabelAdmin,
  potongTeks,
  usePencarianAdmin,
} from '../../komponen/admin/KomponenAdmin';
import PanelGeser from '../../komponen/admin/PanelGeser';
import {
  useFormPanel,
  InputField,
  TextareaField,
  FormFooter,
  PesanForm,
} from '../../komponen/admin/FormAdmin';

const nilaiAwal = { lema: '', sinonim: '', antonim: '', turunan: '', gabungan: '', berkaitan: '' };

const kolom = [
  {
    key: 'lema',
    label: 'Lema',
    render: (item) => (
      <Link
        to={`/kamus/detail/${encodeURIComponent(item.lema)}`}
        className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
      >
        {item.lema}
      </Link>
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
