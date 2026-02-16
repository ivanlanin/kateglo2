/**
 * @fileoverview Halaman kelola pengguna (admin)
 */

import { useState } from 'react';
import { useDaftarPengguna, useDaftarPeran, useUbahPeran, useSimpanPengguna } from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import { TabelAdmin, InfoTotal, BadgeStatus } from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SelectField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';

function formatTanggal(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function PenggunaAdmin() {
  const [offset, setOffset] = useState(0);
  const limit = 20;

  const { data: penggunaResp, isLoading, isError } = useDaftarPengguna({ limit, offset });
  const { data: peranResp } = useDaftarPeran();
  const ubahPeran = useUbahPeran();
  const simpanPengguna = useSimpanPengguna();

  const daftarPengguna = penggunaResp?.data || [];
  const total = penggunaResp?.total || 0;
  const daftarPeran = peranResp?.data || [];

  const panel = useFormPanel({ nama: '', aktif: 1, peran_id: '' });
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const handleUbahPeran = (penggunaId, peranId) => {
    ubahPeran.mutate({ penggunaId, peranId });
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    simpanPengguna.mutate(panel.data, {
      onSuccess: () => { setPesan({ error: '', sukses: 'Tersimpan!' }); setTimeout(() => panel.tutup(), 600); },
      onError: (err) => setPesan({ error: err?.response?.data?.error || 'Gagal menyimpan', sukses: '' }),
    });
  };

  const handleBukaSunting = (item) => {
    const peranId = daftarPeran.find((r) => r.kode === item.peran_kode)?.id || '';
    panel.bukaUntukSunting({ ...item, peran_id: peranId });
  };

  const opsiPeran = [
    { value: '', label: '— Pilih peran —' },
    ...daftarPeran.map((r) => ({ value: r.id, label: r.nama })),
  ];

  const kolom = [
    {
      key: 'nama',
      label: 'Pengguna',
      render: (p) => (
        <div className="flex items-center gap-3">
          {p.foto ? (
            <img
              src={p.foto}
              alt={p.nama}
              className="w-8 h-8 rounded-full"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
              {p.nama?.[0]?.toUpperCase() || '?'}
            </div>
          )}
          <span className="font-medium text-gray-900 dark:text-white">{p.nama}</span>
        </div>
      ),
    },
    { key: 'surel', label: 'Surel' },
    {
      key: 'peran_kode',
      label: 'Peran',
      render: (p) => (
        <select
          value={daftarPeran.find((r) => r.kode === p.peran_kode)?.id || ''}
          onChange={(e) => handleUbahPeran(p.id, Number(e.target.value))}
          onClick={(e) => e.stopPropagation()}
          disabled={ubahPeran.isPending}
          className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-2 py-1 focus:outline-none focus:border-blue-500 bg-white dark:bg-dark-bg dark:text-white"
        >
          {daftarPeran.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nama}
            </option>
          ))}
        </select>
      ),
    },
    {
      key: 'aktif',
      label: 'Status',
      render: (p) => <BadgeStatus aktif={p.aktif} />,
    },
    {
      key: 'login_terakhir',
      label: 'Login Terakhir',
      render: (p) => formatTanggal(p.login_terakhir),
    },
  ];

  return (
    <TataLetakAdmin judul="Pengguna">
      <InfoTotal q="" total={total} label="pengguna" />
      <TabelAdmin
        kolom={kolom}
        data={daftarPengguna}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        onOffset={setOffset}
        onKlikBaris={handleBukaSunting}
      />

      <PanelGeser buka={panel.buka} onTutup={panel.tutup} judul="Sunting Pengguna">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <div className="form-admin-group">
          <label className="form-admin-label">Surel</label>
          <p className="text-sm text-gray-700 dark:text-gray-300">{panel.data.surel || '—'}</p>
        </div>
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} />
        <SelectField label="Peran" name="peran_id" value={panel.data.peran_id} onChange={panel.ubahField} options={opsiPeran} />
        <ToggleAktif value={panel.data.aktif} onChange={panel.ubahField} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={panel.tutup}
          isPending={simpanPengguna.isPending}
          modeTambah={false}
        />
      </PanelGeser>
    </TataLetakAdmin>
  );
}

export default PenggunaAdmin;
