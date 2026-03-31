/**
 * @fileoverview Halaman redaksi untuk arsip dan sunting Kata Hari Ini
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarKataHariIniAdmin,
  useDetailKataHariIniAdmin,
  useSimpanKataHariIniAdmin,
  useHapusKataHariIniAdmin,
} from '../../../api/apiAdmin';
import HalamanAdmin from '../../../components/tampilan/HalamanAdmin';
import FilterCariAdmin from '../../../components/formulir/FilterCariAdmin';
import TabelAdmin from '../../../components/data/TabelAdmin';
import TombolAksiAdmin from '../../../components/tombol/TombolAksiAdmin';
import PanelGeser from '../../../components/panel/PanelGeser';
import {
  useFormPanel,
  FormFooter,
  InputField,
  PesanForm,
  SelectField,
  TextareaField,
} from '../../../components/formulir/FormulirAdmin';
import usePencarianAdmin from '../../../hooks/usePencarianAdmin';
import { getApiErrorMessage, potongTeks, validateRequiredFields } from '../../../utils/adminUtils';
import { formatLocalDateTime } from '../../../utils/formatUtils';
import { parsePositiveIntegerParam } from '../../../utils/paramUtils';

function tanggalHariIni() {
  const sekarang = new Date();
  const tahun = sekarang.getFullYear();
  const bulan = String(sekarang.getMonth() + 1).padStart(2, '0');
  const tanggal = String(sekarang.getDate()).padStart(2, '0');
  return `${tahun}-${bulan}-${tanggal}`;
}

const nilaiAwal = {
  tanggal: tanggalHariIni(),
  indeks: '',
  sumber: 'admin',
  catatan: '',
};

const opsiSumber = [
  { value: 'admin', label: 'Admin' },
  { value: 'auto', label: 'Otomatis' },
];

const opsiFilterSumber = [
  { value: '', label: '—Sumber—' },
  { value: 'admin', label: 'Admin' },
  { value: 'auto', label: 'Otomatis' },
];

const kolom = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'entri', label: 'Entri' },
  { key: 'indeks', label: 'Indeks' },
  {
    key: 'sumber',
    label: 'Sumber',
    render: (item) => (
      <span className={`inline-block rounded px-2 py-0.5 text-xs ${item.sumber === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'}`}>
        {item.sumber === 'admin' ? 'Admin' : 'Otomatis'}
      </span>
    ),
  },
  {
    key: 'catatan',
    label: 'Catatan',
    render: (item) => <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.catatan || '—', 90)}</span>,
  },
  {
    key: 'updated_at',
    label: 'Diperbarui',
    render: (item) => formatLocalDateTime(item.updated_at, { fallback: '—' }),
  },
];

function KataHariIniAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const {
    cari, setCari, q, offset, setOffset,
    kirimCari, hapusCari, limit, currentPage,
    cursor, direction, lastPage,
  } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);
  const [filterSumberDraft, setFilterSumberDraft] = useState('');
  const [filterSumber, setFilterSumber] = useState('');
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const { data: resp, isLoading, isError } = useDaftarKataHariIniAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    sumber: filterSumber,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailKataHariIniAdmin(idDariPath);
  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanKataHariIniAdmin();
  const hapus = useHapusKataHariIniAdmin();
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID arsip Kata Hari Ini tidak valid.', sukses: '' });
    navigate('/redaksi/kata-hari-ini', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting({
      ...detail,
      catatan: detail.catatan || '',
    });
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Arsip Kata Hari Ini tidak ditemukan.', sukses: '' });
    navigate('/redaksi/kata-hari-ini', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/kata-hari-ini', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/kata-hari-ini', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    if (!item?.id) return;
    navigate(`/redaksi/kata-hari-ini/${item.id}`);
  };

  const handleCari = () => {
    setFilterSumber(filterSumberDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterSumberDraft('');
    setFilterSumber('');
    hapusCari();
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'tanggal', label: 'Tanggal' },
      { name: 'indeks', label: 'Indeks' },
    ]);
    if (pesanValidasi) {
      setPesan({ error: pesanValidasi, sukses: '' });
      return;
    }

    simpan.mutate(panel.data, {
      onSuccess: () => {
        setPesan({ error: '', sukses: 'Arsip Kata Hari Ini tersimpan.' });
        setTimeout(() => tutupPanel(), 600);
      },
      onError: (error) => {
        setPesan({ error: getApiErrorMessage(error, 'Gagal menyimpan arsip Kata Hari Ini.'), sukses: '' });
      },
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus arsip Kata Hari Ini ini?')) return;

    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (error) => {
        setPesan({ error: getApiErrorMessage(error, 'Gagal menghapus arsip Kata Hari Ini.'), sukses: '' });
      },
    });
  };

  return (
    <HalamanAdmin judul="Kata Hari Ini" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <FilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari arsip kata …"
        filters={[
          {
            key: 'sumber',
            value: filterSumberDraft,
            onChange: setFilterSumberDraft,
            options: opsiFilterSumber,
            ariaLabel: 'Filter sumber kata hari ini',
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
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Kata Hari Ini' : 'Sunting Kata Hari Ini'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Arsip hanya menyimpan tanggal, entri, sumber, dan catatan. Makna yang tampil di publik selalu mengikuti data kamus terkini.
        </p>
        <InputField
          label="Tanggal"
          name="tanggal"
          type="date"
          value={panel.data.tanggal}
          onChange={panel.ubahField}
          disabled={!panel.modeTambah}
          required
        />
        <InputField
          label="Indeks"
          name="indeks"
          value={panel.data.indeks}
          onChange={panel.ubahField}
          placeholder="mis. aktif"
          required
        />
        <SelectField label="Sumber" name="sumber" value={panel.data.sumber} onChange={panel.ubahField} options={opsiSumber} />
        <TextareaField label="Catatan" name="catatan" value={panel.data.catatan} onChange={panel.ubahField} rows={3} />
        <FormFooter
          onSimpan={handleSimpan}
          onBatal={tutupPanel}
          onHapus={handleHapus}
          isPending={simpan.isPending || hapus.isPending}
          modeTambah={panel.modeTambah}
        />
      </PanelGeser>
    </HalamanAdmin>
  );
}

export default KataHariIniAdmin;