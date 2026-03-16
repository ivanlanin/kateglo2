/**
 * @fileoverview Halaman redaksi audit indeks dari makna yang belum ada di entri
 */

import { useState } from 'react';
import {
  useDaftarAuditMaknaAdmin,
  useSimpanAuditMaknaAdmin,
} from '../../../api/apiAdmin';
import HalamanAdmin from '../../../components/tampilan/HalamanAdmin';
import BarisFilterCariAdmin from '../../../components/formulir/FilterCariAdmin';
import TabelAdmin from '../../../components/data/TabelAdmin';
import PanelGeser from '../../../components/panel/PanelGeser';
import {
  useFormPanel,
  InputField,
  SelectField,
  TextareaField,
  FormFooter,
  PesanForm,
} from '../../../components/formulir/FormulirAdmin';
import { formatBilanganRibuan } from '../../../utils/formatUtils';
import usePencarianAdmin from '../../../hooks/usePencarianAdmin';
import { getApiErrorMessage, potongTeks } from '../../../utils/adminUtils';

const nilaiAwal = {
  id: null,
  indeks: '',
  jumlah: 0,
  entri_id: null,
  makna_id: null,
  entri_sumber: '',
  makna_sumber: '',
  status: 'tinjau',
  catatan: '',
};

const opsiStatus = [
  { value: '', label: '—Status—' },
  { value: 'tinjau', label: 'Tinjau' },
  { value: 'salah', label: 'Salah' },
  { value: 'tambah', label: 'Tambah' },
  { value: 'nama', label: 'Nama' },
];

const opsiStatusForm = [
  { value: 'tinjau', label: 'Tinjau' },
  { value: 'salah', label: 'Salah' },
  { value: 'tambah', label: 'Tambah' },
  { value: 'nama', label: 'Nama' },
];

const badgeStatusClass = {
  tinjau: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200',
  salah: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  tambah: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  nama: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
};

function BadgeStatusAudit({ status }) {
  const text = String(status || 'tinjau');
  const className = badgeStatusClass[text] || badgeStatusClass.tinjau;
  return <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded-full ${className}`}>{text}</span>;
}

const kolom = [
  { key: 'indeks', label: 'Indeks' },
  { key: 'jumlah', label: 'Jumlah', align: 'right', render: (item) => formatBilanganRibuan(item.jumlah) },
  {
    key: 'status',
    label: 'Status',
    render: (item) => <BadgeStatusAudit status={item.status} />,
  },
  {
    key: 'entri_sumber',
    label: 'Entri Contoh',
    render: (item) => item.entri_sumber || '—',
  },
  {
    key: 'makna_sumber',
    label: 'Makna Contoh',
    render: (item) => <span className="whitespace-pre-line">{potongTeks(item.makna_sumber, 120)}</span>,
  },
];

function AuditMaknaAdmin() {
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } = usePencarianAdmin(50);
  const [statusDraft, setStatusDraft] = useState('');
  const [status, setStatus] = useState('');
  const [pesan, setPesan] = useState({ error: '', sukses: '' });
  const panel = useFormPanel(nilaiAwal);

  const { data: resp, isLoading, isError } = useDaftarAuditMaknaAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    status,
  });

  const simpan = useSimpanAuditMaknaAdmin();
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const handleCari = () => {
    setStatus(statusDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setStatusDraft('');
    setStatus('');
    hapusCari();
  };

  const bukaSunting = (item) => {
    setPesan({ error: '', sukses: '' });
    panel.bukaUntukSunting(item);
  };

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    simpan.mutate(
      { id: panel.data.id, status: panel.data.status, catatan: panel.data.catatan },
      {
        onSuccess: () => {
          setPesan({ error: '', sukses: 'Status audit berhasil disimpan' });
          setTimeout(() => tutupPanel(), 500);
        },
        onError: (err) => {
          setPesan({
            error: getApiErrorMessage(err, 'Gagal menyimpan status audit'),
            sukses: '',
          });
        },
      }
    );
  };

  return (
    <HalamanAdmin judul="Audit Makna">
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari indeks …"
        filters={[
          {
            key: 'status',
            value: statusDraft,
            onChange: setStatusDraft,
            options: opsiStatus,
            ariaLabel: 'Filter status audit',
          },
        ]}
      />

      <TabelAdmin
        kolom={kolom}
        data={daftar}
        isLoading={isLoading}
        isError={isError}
        total={total}
        limit={limit}
        offset={offset}
        pageInfo={resp?.pageInfo}
        currentPage={currentPage}
        onNavigateCursor={setOffset}
        onKlikBaris={bukaSunting}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul="Tinjau Audit Makna">
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Indeks" name="indeks" value={panel.data.indeks} onChange={panel.ubahField} disabled={true} />
        <InputField label="Jumlah" name="jumlah" value={formatBilanganRibuan(panel.data.jumlah)} onChange={panel.ubahField} disabled={true} />
        <InputField label="Entri ID" name="entri_id" value={panel.data.entri_id || ''} onChange={panel.ubahField} disabled={true} />
        <InputField label="Makna ID" name="makna_id" value={panel.data.makna_id || ''} onChange={panel.ubahField} disabled={true} />
        <TextareaField label="Entri contoh" name="entri_sumber" value={panel.data.entri_sumber || ''} onChange={panel.ubahField} disabled={true} rows={2} />
        <TextareaField label="Makna contoh" name="makna_sumber" value={panel.data.makna_sumber || ''} onChange={panel.ubahField} disabled={true} rows={5} />
        <SelectField label="Status" name="status" value={panel.data.status || 'tinjau'} onChange={panel.ubahField} options={opsiStatusForm} />
        <TextareaField label="Catatan" name="catatan" value={panel.data.catatan || ''} onChange={panel.ubahField} rows={3} />
        <FormFooter onSimpan={handleSimpan} onBatal={tutupPanel} isPending={simpan.isPending} modeTambah={false} />
      </PanelGeser>
    </HalamanAdmin>
  );
}

export default AuditMaknaAdmin;
