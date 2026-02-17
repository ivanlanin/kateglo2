/**
 * @fileoverview Halaman admin komentar kamus — daftar, cari, dan moderasi aktif
 */

import { useState } from 'react';
import { useDaftarKomentarAdmin, useSimpanKomentarAdmin } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  KotakCariAdmin,
  InfoTotal,
  TabelAdmin,
  BadgeStatus,
  usePencarianAdmin,
  potongTeks,
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
import { formatTanggalKomentar } from '../../utils/formatTanggalKomentar';

const nilaiAwal = {
  id: null,
  indeks: '',
  pengguna_nama: '',
  pengguna_surel: '',
  komentar: '',
  aktif: 0,
};

const kolom = [
  {
    key: 'tanggal',
    label: 'Tanggal',
    render: (item) => formatTanggalKomentar(item.updated_at || item.created_at),
  },
  { key: 'indeks', label: 'Indeks' },
  {
    key: 'komentar',
    label: 'Komentar',
    render: (item) => <span className="whitespace-pre-line">{potongTeks(item.komentar, 120)}</span>,
  },
  { key: 'pengguna_nama', label: 'Pengguna' },
  { key: 'aktif', label: 'Status', render: (item) => <BadgeStatus aktif={item.aktif} /> },
];

function KomentarAdmin() {
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit } = usePencarianAdmin(50);
  const { data: resp, isLoading, isError } = useDaftarKomentarAdmin({ limit, offset, q });
  const simpan = useSimpanKomentarAdmin();
  const panel = useFormPanel(nilaiAwal);
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    if (!panel.data.komentar?.trim()) {
      setPesan({ error: 'Komentar wajib diisi', sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Komentar berhasil diperbarui' });
        setTimeout(() => panel.tutup(), 500);
      },
      onError: (err) => {
        setPesan({
          error: err?.response?.data?.error || err?.response?.data?.message || 'Gagal menyimpan komentar',
          sukses: '',
        });
      },
    });
  };

  return (
    <TataLetakAdmin judul="Komentar">
      <KotakCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={kirimCari}
        onHapus={hapusCari}
        placeholder="Cari indeks, komentar, atau pengguna …"
      />

      <InfoTotal q={q} total={total} label="komentar" />

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

      <PanelGeser buka={panel.buka} onTutup={panel.tutup} judul="Sunting Komentar">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Indeks" name="indeks" value={panel.data.indeks} onChange={panel.ubahField} disabled={true} />
        <InputField label="Nama" name="pengguna_nama" value={panel.data.pengguna_nama} onChange={panel.ubahField} disabled={true} />
        <InputField label="Surel" name="pengguna_surel" value={panel.data.pengguna_surel} onChange={panel.ubahField} disabled={true} />
        <TextareaField label="Komentar" name="komentar" value={panel.data.komentar} onChange={panel.ubahField} rows={8} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={panel.tutup}
          isPending={simpan.isPending}
          modeTambah={false}
        />
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default KomentarAdmin;
