/**
 * @fileoverview Halaman redaksi untuk rekap harian Kuis Kata.
 */

import { useMemo } from 'react';
import HalamanAdmin from '../../components/redaksi/HalamanAdmin';
import { TabelAdmin } from '../../components/redaksi/KomponenAdmin';
import { useKuisKataAdmin } from '../../api/apiAdmin';
import { formatBilanganRibuan } from '../../utils/formatUtils';

function formatDurasiDetik(value) {
  const angka = Number(value);
  if (!Number.isFinite(angka)) return '0 dtk';
  return `${formatBilanganRibuan(angka)} dtk`;
}

const kolom = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'nama', label: 'Pemain' },
  { key: 'main', label: 'Ronde', align: 'right', render: (item) => formatBilanganRibuan(item.main) },
  { key: 'benar', label: 'Benar', align: 'right', render: (item) => formatBilanganRibuan(item.benar) },
  { key: 'pertanyaan', label: 'Soal', align: 'right', render: (item) => formatBilanganRibuan(item.pertanyaan) },
  { key: 'skor', label: 'Skor', align: 'right', render: (item) => formatBilanganRibuan(item.skor) },
  { key: 'durasi', label: 'Durasi', align: 'right', render: (item) => formatDurasiDetik(item.durasi) },
];

function KuisKataAdmin() {
  const { data, isLoading, isError } = useKuisKataAdmin();

  const dataTabel = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []).map((item) => ({
      id: item.id,
      tanggal: item.tanggal,
      nama: item.nama,
      main: Number(item.jumlah_main) || 0,
      benar: Number(item.jumlah_benar) || 0,
      pertanyaan: Number(item.jumlah_pertanyaan) || 0,
      skor: Number(item.skor_total) || 0,
      durasi: Number(item.durasi_detik) || 0,
    })),
    [data?.data]
  );

  return (
    <HalamanAdmin judul="Kuis Kata">
      <TabelAdmin
        kolom={kolom}
        data={dataTabel}
        isLoading={isLoading}
        isError={isError}
        total={dataTabel.length}
        limit={100}
        offset={0}
        kunciId="id"
      />
    </HalamanAdmin>
  );
}

export default KuisKataAdmin;