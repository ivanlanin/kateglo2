/**
 * @fileoverview Halaman redaksi untuk pengelolaan daftar hitam pencarian
 */

import { useState } from 'react';
import TataLetak from '../../komponen/bersama/TataLetak';
import {
  useDaftarPencarianHitamAdmin,
  useHapusPencarianHitamAdmin,
  useSimpanPencarianHitamAdmin,
} from '../../api/apiAdmin';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  TabelAdmin,
  getApiErrorMessage,
  opsiFilterStatusAktif,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  FormFooter,
  InputField,
  PesanForm,
  TextareaField,
  ToggleAktif,
  useFormPanel,
} from '../../komponen/redaksi/FormulirAdmin';
import { formatLocalDateTime } from '../../utils/formatUtils';

const nilaiAwalPencarianHitam = {
  kata: '',
  aktif: true,
  catatan: '',
};

function formatTanggalSingkat(value) {
  return formatLocalDateTime(value, { fallback: '—', separator: ', ' });
}

function PencarianHitamAdmin() {
  const {
    cari,
    setCari,
    q,
    offset,
    setOffset,
    kirimCari,
    hapusCari,
    limit,
    currentPage,
    cursor,
    direction,
    lastPage,
  } = usePencarianAdmin(50);
  const [filterStatusDraft, setFilterStatusDraft] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [pesan, setPesan] = useState({ error: '', sukses: '' });
  const panel = useFormPanel(nilaiAwalPencarianHitam);
  const simpan = useSimpanPencarianHitamAdmin();
  const hapus = useHapusPencarianHitamAdmin();

  const { data, isLoading, isError } = useDaftarPencarianHitamAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif: filterStatus,
  });

  const daftarHitam = data?.data || [];
  const kolom = [
    { key: 'kata', label: 'Kata', render: (item) => item.kata || '—' },
    {
      key: 'aktif',
      label: 'Status',
      render: (item) => (item.aktif ? 'Aktif' : 'Nonaktif'),
    },
    {
      key: 'catatan',
      label: 'Catatan',
      render: (item) => item.catatan || '—',
    },
    {
      key: 'updated_at',
      label: 'Diubah',
      render: (item) => formatTanggalSingkat(item.updated_at),
    },
  ];

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    panel.bukaUntukTambah();
  };

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
  };

  const handleCari = () => {
    setFilterStatus(filterStatusDraft);
    kirimCari(cari);
  };

  const handleReset = () => {
    setFilterStatusDraft('');
    setFilterStatus('');
    hapusCari();
  };

  const handleSunting = (item) => {
    setPesan({ error: '', sukses: '' });
    panel.bukaUntukSunting(item);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });
    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kata', label: 'Kata' },
    ]);

    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Tersimpan!' });
        setTimeout(() => tutupPanel(), 600);
      },
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan kata daftar hitam'), sukses: '' });
      },
    });
  };

  const handleHapus = () => {
    if (!panel.data?.id) return;
    if (!confirm('Yakin ingin menghapus kata ini dari daftar hitam?')) return;

    hapus.mutate(panel.data.id, {
      onSuccess: () => {
        tutupPanel();
      },
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus kata daftar hitam'), sukses: '' });
      },
    });
  };

  return (
    <TataLetak mode="admin" judul="Daftar Hitam Pencarian" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} label="+ Tambah Kata" />}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleReset}
        placeholder="Cari kata daftar hitam …"
        filters={[
          {
            key: 'aktif',
            value: filterStatusDraft,
            onChange: setFilterStatusDraft,
            options: opsiFilterStatusAktif,
            ariaLabel: 'Status',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftarHitam}
        isLoading={isLoading}
        isError={isError}
        total={Number(data?.total || 0)}
        limit={limit}
        offset={offset}
        pageInfo={data?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={handleSunting}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Kata Daftar Hitam' : 'Sunting Kata Daftar Hitam'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField
          label="Kata"
          name="kata"
          value={panel.data.kata}
          onChange={panel.ubahField}
          required
        />
        <ToggleAktif value={Boolean(panel.data.aktif)} onChange={panel.ubahField} />
        <TextareaField
          label="Catatan"
          name="catatan"
          value={panel.data.catatan}
          onChange={panel.ubahField}
          rows={3}
        />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          onHapus={handleHapus}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </TataLetak>
  );
}

export { formatTanggalSingkat };
export default PencarianHitamAdmin;