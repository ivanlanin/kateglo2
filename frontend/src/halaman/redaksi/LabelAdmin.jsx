/**
 * @fileoverview Halaman admin label — daftar, cari, tambah, sunting label
 */

import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDaftarLabelAdmin, useDetailLabelAdmin, useSimpanLabel, useHapusLabel } from '../../api/apiAdmin';
import TataLetak from '../../komponen/bersama/TataLetak';
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
  TextareaField,
  ToggleAktif,
  FormFooter,
  PesanForm,
} from '../../komponen/redaksi/FormAdmin';
import { parsePositiveIntegerParam } from '../../utils/paramUtils';

const nilaiAwal = { kategori: '', kode: '', nama: '', urutan: 1, keterangan: '', aktif: true };

const kolom = [
  { key: 'kategori', label: 'Kategori' },
  { key: 'kode', label: 'Kode' },
  { key: 'nama', label: 'Nama' },
  { key: 'urutan', label: 'Urutan' },
  {
    key: 'aktif',
    label: 'Status',
    render: (item) => <BadgeStatus aktif={item.aktif} />,
  },
  {
    key: 'keterangan',
    label: 'Keterangan',
    render: (item) => (
      <span className="text-gray-600 dark:text-gray-400">{potongTeks(item.keterangan, 80)}</span>
    ),
  },
];

function LabelAdmin() {
  const navigate = useNavigate();
  const { id: idParam } = useParams();
  const { cari, setCari, q, offset, setOffset, kirimCari, hapusCari, limit, currentPage, cursor, direction, lastPage } = usePencarianAdmin(50);
  const idDariPath = parsePositiveIntegerParam(idParam);
  const idEditTerbuka = useRef(null);
  const sedangMenutupDariPath = useRef(false);
  const [filterAktifDraft, setFilterAktifDraft] = useState('');
  const [filterAktif, setFilterAktif] = useState('');

  const { data: resp, isLoading, isError } = useDaftarLabelAdmin({
    limit,
    cursor,
    direction,
    lastPage,
    q,
    aktif: filterAktif,
  });
  const { data: detailResp, isLoading: isDetailLoading, isError: isDetailError } = useDetailLabelAdmin(idDariPath);
  const daftar = resp?.data || [];
  const total = resp?.total || 0;

  const panel = useFormPanel(nilaiAwal);
  const simpan = useSimpanLabel();
  const hapus = useHapusLabel();

  const [pesan, setPesan] = useState({ error: '', sukses: '' });

  useEffect(() => {
    if (!idParam) return;
    if (idDariPath) return;
    setPesan({ error: 'ID label tidak valid.', sukses: '' });
    navigate('/redaksi/label', { replace: true });
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
    setPesan({ error: 'Label tidak ditemukan.', sukses: '' });
    navigate('/redaksi/label', { replace: true });
  }, [idDariPath, isDetailError, isDetailLoading, navigate]);

  const tutupPanel = () => {
    setPesan({ error: '', sukses: '' });
    panel.tutup();
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/label', { replace: true });
    }
  };

  const bukaTambah = () => {
    setPesan({ error: '', sukses: '' });
    if (idDariPath) {
      sedangMenutupDariPath.current = true;
      navigate('/redaksi/label', { replace: true });
    }
    panel.bukaUntukTambah();
  };

  const bukaSuntingDariDaftar = (item) => {
    setPesan({ error: '', sukses: '' });
    if (!item?.id) return;
    navigate(`/redaksi/label/${item.id}`);
  };

  const handleSimpan = () => {
    setPesan({ error: '', sukses: '' });

    const pesanValidasi = validateRequiredFields(panel.data, [
      { name: 'kategori', label: 'Kategori' },
      { name: 'kode', label: 'Kode' },
      { name: 'nama', label: 'Nama' },
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
    if (!confirm('Yakin ingin menghapus label ini?')) return;

    hapus.mutate(panel.data.id, {
      onSuccess: () => tutupPanel(),
      onError: (err) => {
        setPesan({ error: getApiErrorMessage(err, 'Gagal menghapus'), sukses: '' });
      },
    });
  };

  const handleCari = () => {
    setFilterAktif(filterAktifDraft);
    kirimCari(cari);
  };

  return (
    <TataLetak mode="admin" judul="Label" aksiJudul={<TombolAksiAdmin onClick={bukaTambah} />}>
      <BarisFilterCariAdmin
        nilai={cari}
        onChange={setCari}
        onCari={handleCari}
        onHapus={hapusCari}
        placeholder="Cari label …"
        filters={[
          {
            key: 'aktif',
            value: filterAktifDraft,
            onChange: setFilterAktifDraft,
            options: opsiFilterStatusAktif,
            ariaLabel: 'Filter status label',
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
        onNavigateCursor={(action) => setOffset(action, { pageInfo: resp?.pageInfo, total })}
        onKlikBaris={bukaSuntingDariDaftar}
      />

      <PanelGeser buka={panel.buka} onTutup={tutupPanel} judul={panel.modeTambah ? 'Tambah Label' : 'Sunting Label'}>
        <PesanForm error={pesan.error} sukses={pesan.sukses} />
        <InputField label="Kategori" name="kategori" value={panel.data.kategori} onChange={panel.ubahField} required />
        <InputField label="Kode" name="kode" value={panel.data.kode} onChange={panel.ubahField} required />
        <InputField label="Nama" name="nama" value={panel.data.nama} onChange={panel.ubahField} required />
        <InputField label="Urutan" name="urutan" type="number" value={panel.data.urutan} onChange={panel.ubahField} />
        <ToggleAktif value={Boolean(panel.data.aktif)} onChange={panel.ubahField} />
        <TextareaField label="Keterangan" name="keterangan" value={panel.data.keterangan} onChange={panel.ubahField} rows={3} />
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

export default LabelAdmin;
