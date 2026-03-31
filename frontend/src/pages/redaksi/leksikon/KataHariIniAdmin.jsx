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
  entri: '',
  kelas_kata: '',
  makna: '',
  contoh: '',
  pemenggalan: '',
  lafal: '',
  etimologi_bahasa: '',
  etimologi_kata_asal: '',
  mode_pemilihan: 'admin',
  catatan_admin: '',
};

const opsiMode = [
  { value: 'admin', label: 'Admin' },
  { value: 'auto', label: 'Otomatis' },
];

const opsiFilterMode = [
  { value: '', label: '—Mode—' },
  { value: 'admin', label: 'Admin' },
  { value: 'auto', label: 'Otomatis' },
];

const kolom = [
  { key: 'tanggal', label: 'Tanggal' },
  { key: 'entri', label: 'Entri' },
  { key: 'indeks', label: 'Indeks' },
  {
    key: 'mode_pemilihan',
    label: 'Mode',
    render: (item) => (
      <span className={`inline-block rounded px-2 py-0.5 text-xs ${item.mode_pemilihan === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300'}`}>
        {item.mode_pemilihan === 'admin' ? 'Admin' : 'Otomatis'}
      </span>
    ),
  },
  {
    key: 'makna',
    label: 'Makna',
    render: (item) => <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.makna, 90)}</span>,
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
  const [filterModeDraft, setFilterModeDraft] = useState('');
  const [filterMode, setFilterMode] = useState('');
  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  const { data: resp, isLoading, isError } = useDaftarKataHariIniAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    modePemilihan: filterMode,
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
      etimologi_bahasa: detail.etimologi?.bahasa || '',
      etimologi_kata_asal: detail.etimologi?.kata_asal || '',
      catatan_admin: detail.catatan_admin || '',
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
    setFilterMode(filterModeDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterModeDraft('');
    setFilterMode('');
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
            key: 'mode_pemilihan',
            value: filterModeDraft,
            onChange: setFilterModeDraft,
            options: opsiFilterMode,
            ariaLabel: 'Filter mode pemilihan kata hari ini',
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
        <InputField label="Entri" name="entri" value={panel.data.entri} onChange={panel.ubahField} placeholder="Opsional, akan diisi dari kamus bila kosong" />
        <InputField label="Kelas Kata" name="kelas_kata" value={panel.data.kelas_kata} onChange={panel.ubahField} placeholder="mis. a, n, v" />
        <TextareaField label="Makna" name="makna" value={panel.data.makna} onChange={panel.ubahField} rows={4} />
        <TextareaField label="Contoh" name="contoh" value={panel.data.contoh} onChange={panel.ubahField} rows={3} />
        <InputField label="Pemenggalan" name="pemenggalan" value={panel.data.pemenggalan} onChange={panel.ubahField} />
        <InputField label="Lafal" name="lafal" value={panel.data.lafal} onChange={panel.ubahField} />
        <InputField label="Etimologi Bahasa" name="etimologi_bahasa" value={panel.data.etimologi_bahasa} onChange={panel.ubahField} />
        <InputField label="Etimologi Kata Asal" name="etimologi_kata_asal" value={panel.data.etimologi_kata_asal} onChange={panel.ubahField} />
        <SelectField label="Mode Pemilihan" name="mode_pemilihan" value={panel.data.mode_pemilihan} onChange={panel.ubahField} options={opsiMode} />
        <TextareaField label="Catatan Admin" name="catatan_admin" value={panel.data.catatan_admin} onChange={panel.ubahField} rows={3} />
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