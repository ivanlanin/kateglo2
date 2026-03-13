/**
 * @fileoverview Halaman admin tagar — daftar, cari, tambah, sunting tagar morfologis
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  useDaftarTagarAdmin,
  useDetailTagarAdmin,
  useSimpanTagar,
  useHapusTagar,
  useKategoriTagarAdmin,
} from '../../api/apiAdmin';
import TataLetakAdmin from '../../komponen/redaksi/TataLetakAdmin';
import {
  BarisFilterCariAdmin,
  TombolAksiAdmin,
  BadgeStatus,
  opsiFilterStatusAktif,
  TabelAdmin,
  getApiErrorMessage,
  potongTeks,
  usePencarianAdmin,
  validateRequiredFields,
} from '../../komponen/redaksi/KomponenAdmin';
import PanelGeser from '../../komponen/redaksi/PanelGeser';
import {
  useFormPanel,
  InputField,
  SelectField,
  TextareaField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormulirAdmin';
import { formatBilanganRibuan } from '../../utils/formatUtils';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';

const nilaiAwal = {
  kode: '',
  nama: '',
  kategori: '',
  urutan: 1,
  aktif: true,
  deskripsi: '',
};

const kolom = [
  { key: 'nama', label: 'Nama' },
  { key: 'kode', label: 'Kode' },
  {
    key: 'kategori',
    label: 'Kategori',
    render: (item) => (
      <span className="inline-block rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        {item.kategori}
      </span>
    ),
  },
  {
    key: 'jumlah_entri',
    label: 'Entri',
    align: 'right',
    render: (item) => formatBilanganRibuan(item.jumlah_entri),
  },
  { key: 'urutan', label: 'Urutan' },
  {
    key: 'aktif',
    label: 'Status',
    render: (item) => <BadgeStatus aktif={item.aktif} />,
  },
  {
    key: 'deskripsi',
    label: 'Deskripsi',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">
        {potongTeks(item.deskripsi, 80)}
      </span>
    ),
  },
];

function TagarAdmin() {
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
  const [filterAktifDraft, setFilterAktifDraft] = useState('');
  const [filterAktif, setFilterAktif] = useState('');
  const [filterKategoriDraft, setFilterKategoriDraft] = useState('');
  const [filterKategori, setFilterKategori] = useState('');

  const { data: resp, isLoading, isError } = useDaftarTagarAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    kategori: filterKategori,
    aktif: filterAktif,
  });
  const {
    data: detailResp,
    isLoading: isDetailLoading,
    isError: isDetailError,
  } = useDetailTagarAdmin(idDariPath);
  const { data: kategoriResp } = useKategoriTagarAdmin();
  const daftar = resp?.data || [];
  const total = resp?.total || 0;
  const daftarKategori = kategoriResp?.data || [];
  const opsiKategori = [
    { value: '', label: 'Semua kategori' },
    ...daftarKategori.map((k) => ({ value: k, label: k })),
  ];
  const opsiKategoriForm = [
    { value: '', label: '-- Pilih kategori --' },
    ...daftarKategori.map((k) => ({ value: k, label: k })),
  ];

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanTagar();
  const hapus = useHapusTagar();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID tagar tidak valid.', sukses: '' });
    navigate('/redaksi/tagar', { replace: true });
  }, [idParam, idDariPath, navigate]);

  useEffect(() => {
    if (sedangMenutupDariPath.current) return;
    if (!idDariPath || isDetailLoading || isDetailError) return;
    const detail = detailResp?.data;
    if (!detail?.id) return;
    if (idEditTerbuka.current === detail.id) return;
    panel.bukaUntukSunting(detail);
    idEditTerbuka.current = detail.id;
  }, [detailResp, idDariPath, isDetailError, isDetailLoading, panel]);

  useEffect(() => {
    if (idDariPath) return;
    sedangMenutupDariPath.current = false;
    idEditTerbuka.current = null;
  }, [idDariPath]);

  useEffect(() => {
    if (!idDariPath || isDetailLoading || !isDetailError) return;
    setPesan({ error: 'Tagar tidak ditemukan.', sukses: '' });
    navigate('/redaksi/tagar', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/tagar', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/tagar', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    if (!item?.id) return;
    navigate(`/redaksi/tagar/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kode', label: 'Kode' },
      { name: 'nama', label: 'Nama' },
      { name: 'kategori', label: 'Kategori' },
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
        setPesan({ error: getApiErrorMessage(err, 'Gagal menyimpan'), sukses: '' });
      },
    });
  };

  const handleHapus = () => {
    if (!confirm('Yakin ingin menghapus tagar ini?')) return;

    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' });
      },
    });
  };

  const handleCari = () => {
    setFilterAktif(filterAktifDraft);
    setFilterKategori(filterKategoriDraft);
    kirimCari(cari);
  };

  const handleResetFilter = () => {
    setFilterAktifDraft('');
    setFilterAktif('');
    setFilterKategoriDraft('');
    setFilterKategori('');
    hapusCari();
  };

  return (
    <TataLetakAdmin judul="Tagar" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={handleResetFilter}
        placeholder="Cari tagar …"
        filters={[
          {
            key: 'kategori',
            value: filterKategoriDraft,
            onChange: setFilterKategoriDraft,
            options: opsiKategori,
            ariaLabel: 'Filter kategori tagar',
          },
          {
            key: 'aktif',
            value: filterAktifDraft,
            onChange: setFilterAktifDraft,
            options: opsiFilterStatusAktif,
            ariaLabel: 'Filter status tagar',
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

      <PanelGeser
        buka={panel.buka}
        onTutup={tutupPanel}
        judul={panel.modeTambah ? 'Tambah Tagar' : 'Sunting Tagar'}
      >
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField
          label="Nama"
          name="nama"
          value={panel.data.nama}
          onChange={panel.ubahField}
          placeholder="mis. me-, -an, R-"
          required
        />
        <InputField
          label="Kode"
          name="kode"
          value={panel.data.kode}
          onChange={panel.ubahField}
          placeholder="mis. me, an, R"
          required
        />
        <SelectField
          label="Kategori"
          name="kategori"
          value={panel.data.kategori}
          onChange={panel.ubahField}
          options={opsiKategoriForm}
        />
        <InputField
          label="Urutan"
          name="urutan"
          type="number"
          value={panel.data.urutan}
          onChange={panel.ubahField}
        />
        <ToggleAktif value={Boolean(panel.data.aktif)} onChange={panel.ubahField} />
        <TextareaField
          label="Deskripsi"
          name="deskripsi"
          value={panel.data.deskripsi}
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
    </TataLetakAdmin>
  );
}

export default TagarAdmin;
