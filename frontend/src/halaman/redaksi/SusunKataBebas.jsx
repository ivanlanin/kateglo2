/**
 * @fileoverview Halaman redaksi untuk rekap Susun Kata Bebas
 */

import { useMemo } from 'react';
import HalamanAdmin from '../../komponen/redaksi/HalamanAdmin';
import { TabelAdmin } from '../../komponen/redaksi/KomponenAdmin';
import { useSusunKataBebasAdmin } from '../../api/apiAdmin';
import { formatBilanganRibuan } from '../../utils/formatUtils';

function formatPersen(value) {
  const angka = Number(value);
  if (!Number.isFinite(angka)) return '0%';
  return `${angka.toFixed(2)}%`;
}

const kolom = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'pemenang', label: 'Pemenang' },
  { key: 'peserta', label: 'Peserta', align: 'right', render: (item) => formatBilanganRibuan(item.peserta) },
  { key: 'main', label: 'Main', align: 'right', render: (item) => formatBilanganRibuan(item.main) },
  { key: 'menang', label: 'Menang', align: 'right', render: (item) => formatPersen(item.menang) },
];

function SusunKataBebas() {
  const { data, isLoading, isError } = useSusunKataBebasAdmin();

  const dataTabel = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []).map((item) => ({
      tanggal: item.tanggal,
      pemenang: item.pemenang || '—',
      peserta: Number(item.jumlah_peserta) || 0,
      main: Number(item.total_main) || 0,
      menang: Number(item.persen_menang),
    })),
    [data?.data]
  );

  return (
    <HalamanAdmin judul="Susun Kata Bebas">
      <TabelAdmin
        kolom={kolom}
        data={dataTabel}
        isLoading={isLoading}
        isError={isError}
        total={dataTabel.length}
        limit={100}
        offset={0}
        kunciId="tanggal"
      />
    </HalamanAdmin>
  );
}

export default SusunKataBebas;
