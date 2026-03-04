/**
 * @fileoverview Halaman redaksi untuk rekap Susun Kata Bebas
 */

import { useMemo, useState } from 'react';
import TataLetak from '../../komponen/bersama/TataLetak';
import { BarisFilterCariAdmin, TabelAdmin } from '../../komponen/redaksi/KomponenAdmin';
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
  const [cariTanggal, setCariTanggal] = useState('');
  const [tanggalQuery, setTanggalQuery] = useState('');

  const { data, isLoading, isError } = useSusunKataBebasAdmin({ tanggal: tanggalQuery });

  const dataTabel = useMemo(
    () => (Array.isArray(data?.data) ? data.data : []).map((item) => ({
      tanggal: item.tanggal,
      pemenang: item.pemenang || '—',
      peserta: Number(item.jumlah_peserta) || 0,
      main: Number(item.total_main) || 0,
      menang: Number(item.persen_menang) || 0,
    })),
    [data?.data]
  );

  const handleCari = () => {
    setTanggalQuery(String(cariTanggal || '').trim());
  };

  const handleReset = () => {
    setCariTanggal('');
    setTanggalQuery('');
  };

  return (
    <TataLetak mode="admin" judul="Susun Kata Bebas">
      <BarisFilterCariAdmin
        nilai={cariTanggal}
        onChange={setCariTanggal}
        onCari={handleCari}
        onHapus={handleReset}
        placeholder="Tanggal (YYYY-MM-DD)"
      />

      <TabelAdmin
        kolom={kolom}
        data={dataTabel}
        isLoading={isLoading}
        isError={isError}
        total={dataTabel.length}
        limit={100}
        offset={0}
        onOffset={() => {}}
        kunciId="tanggal"
      />
    </TataLetak>
  );
}

export default SusunKataBebas;
